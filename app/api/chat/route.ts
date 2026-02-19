import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// ── Rate limit store (in-memory) ─────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // 20 RPM for Groq Llama 3 70B (it's fast)
const MAX_MSG_LEN = 1000;
const MAX_TURNS = 30;

function getIP(req: NextRequest): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
        req.headers.get('x-real-ip') ?? 'unknown'
    );
}

function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
    const now = Date.now();
    const rec = rateLimitStore.get(ip);
    if (!rec || now > rec.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + 60_000 });
        return { limited: false };
    }
    if (rec.count >= RATE_LIMIT) {
        return { limited: true, retryAfter: Math.ceil((rec.resetAt - now) / 1000) };
    }
    rec.count += 1;
    return { limited: false };
}

// ── System Prompt (Optimized for Llama 3) ─────────────────────────────────────
const SYSTEM_PROMPT = `You are a super friendly, helpful, and chill assistant for the AI@IM SIG.
CONTEXT: 
- You are registering students for a potential **Greenhouse Facility Visit** (Industry Exposure).
- The goal is to get a **headcount**. Dates and facility details will be announced later.
- Keep responses concise, warm, and professional.
- Do NOT mention any specific company names. Just say "Greenhouse Facility".

Your GOAL: Collect exactly 4 pieces of info from the student, one by one.
1. Full Name
2. WhatsApp number (e.g. +94 77 123 4567)
3. Academic Level (e.g. 1st Year, 2nd Year)
4. Why they are interested (short reason)

RULES:
- Ask only ONE question at a time.
- **Phone Validation:** Accept any valid-looking number in Sri Lanka If the number looks obiviously wrong gently ask the user to confirm the number if it is correct or to proceed with the current number.
- **Name Validation:** Accept ANY name given, even if it's just one word or a nickname.
- **Reason Validation:** Accept anything the user says, even if short.
- **Mistakes:** If the user makes a small mistake or enters something twice, just ignore it and move on. NEVER argue with the user.
- If the student asks about dates/venue, say they are TBD and this is just for headcount.
- Do not answer off-topic questions. Redirect to registration.

CRITICAL JSON OUTPUTS:
1. When you have ALL 4 items, output ONLY this JSON block (no extra text):
CONFIRMATION_REQUEST:{"name":"<name>","whatsapp":"<whatsapp>","level":"<level>","reason":"<reason>"}

2. If the user confirms, output ONLY this JSON block (no extra text):
REGISTRATION_COMPLETE:{"name":"<name>","whatsapp":"<whatsapp>","level":"<level>","reason":"<reason>"}

6. Contact Support: If the student is stuck, provide Chief Coordinator's WhatsApp: +94762195995.

START: Greet the student warmly and ask for their Name.`;

// ── Groq Client ───────────────────────────────────────────────────────────────
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0 || !error.message?.includes('429')) throw error;

        console.warn(`Rate limit hit. Retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
    }
}

export async function POST(req: NextRequest) {
    // Rate limit
    const ip = getIP(req);
    const { limited, retryAfter } = isRateLimited(ip);
    if (limited) return NextResponse.json({ error: `You're messaging too fast! Wait ${retryAfter}s.` }, { status: 429 });

    let body;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

    const { history = [], message = '' } = body;

    if (!message.trim()) return NextResponse.json({ error: 'Message empty' }, { status: 400 });
    if (message.length > MAX_MSG_LEN) return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    if (history.length > MAX_TURNS) return NextResponse.json({ error: 'Conversation too long' }, { status: 400 });

    if (!process.env.GROQ_API_KEY) {
        console.error('Missing GROQ_API_KEY');
        return NextResponse.json({ error: 'AI service not configured (missing key).' }, { status: 503 });
    }

    try {
        // Convert Gemini-style history to OpenAI/Groq style
        // Check if the last message in history is the same as the current message
        // If so, do not append it again to avoid "double message" confusion
        const lastMsg = history[history.length - 1];
        const isDuplicate = lastMsg && lastMsg.role === 'user' &&
            (lastMsg.parts?.[0]?.text === message || lastMsg.content === message);

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m: any) => ({
                role: m.role === 'model' ? 'assistant' : 'user',
                content: m.parts?.[0]?.text || m.content || ''
            }))
        ];

        if (!isDuplicate) {
            messages.push({ role: 'user', content: message });
        }

        let completion;

        try {
            // Try 70b first (High Intelligence)
            completion = await retryWithBackoff(async () => {
                return await groq.chat.completions.create({
                    messages: messages as any,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.6,
                    max_tokens: 1024,
                });
            }, 2, 1000); // 2 retries, start with 1s delay
        } catch (err) {
            console.warn('Primary model (70b) failed or rate-limited. Switching to fallback (8b)...');
            // Fallback to 8b (High Speed/Throughput)
            completion = await retryWithBackoff(async () => {
                return await groq.chat.completions.create({
                    messages: messages as any,
                    model: 'llama-3.1-8b-instant',
                    temperature: 0.6,
                    max_tokens: 1024,
                });
            }, 2, 1000);
        }

        const reply = completion.choices[0]?.message?.content || '';
        if (!reply) throw new Error('Empty response from Groq');
        return NextResponse.json({ reply });

    } catch (err: any) {
        const msg = err.message || JSON.stringify(err);
        console.error('Groq Error:', msg);

        // Friendly error messages
        let friendly = 'AI service hiccuped. Please try again.';
        if (msg.includes('401') || msg.includes('unauthorized')) friendly = 'Invalid API Key. Tell the admin.';
        if (msg.includes('429')) friendly = 'Groq is busy (rate limit). Try in a minute.';
        if (msg.includes('500') || msg.includes('503')) friendly = 'Groq is temporarily down.';

        return NextResponse.json({ error: `${friendly} (${msg.slice(0, 50)}...)` }, { status: 503 });
    }
}

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
const SYSTEM_PROMPT = `You are a friendly and efficient registration assistant for the AI@IM SIG's field visit to Codegen's **Greenhouse**.

CONTEXT: 
- This is an **industry exposure visit** to Codegen's high-tech Greenhouse facility.
- It is relevant because our department is planning its own greenhouse project, so we want to learn from the experts.
- Keep responses concise and professional but warm.

Your GOAL: Collect exactly 5 pieces of info from the student, one by one.
1. Full Name
2. WhatsApp number (e.g. +94 77 123 4567)
3. Email Address (e.g. student@example.com)
4. Academic Level / Year (e.g. 1st Year, 2nd Year, Staff)
5. Why they want to join (short reason)

RULES:
- Ask only ONE question at a time.
- **Phone Validation:** Ensure the number has between 7 and 15 digits. If not, ask to check it.
- **Email Validation:** Ensure it looks like an email.
- **Reason Validation:** If the reason is too short (e.g. "Just because", "I want to go"), ask for a bit more detail because seats are limited.
- If the student asks about the event, explain the context (industry exposure for our project).
- Do not answer off-topic questions. Redirect to registration.

CRITICAL JSON OUTPUTS:
1. When you have ALL 5 items, do NOT ask for confirmation in text. Instead, output ONLY this JSON block:
CONFIRMATION_REQUEST:{"name":"<name>","whatsapp":"<whatsapp>","email":"<email>","level":"<level>","reason":"<reason>"}

2. If the user confirms (says "yes", "correct", or clicks confirm), output ONLY this JSON block:
REGISTRATION_COMPLETE:{"name":"<name>","whatsapp":"<whatsapp>","email":"<email>","level":"<level>","reason":"<reason>"}

6. Contact Support: If the student is stuck or asks for help, provide the Chief Coordinator's WhatsApp: +94762195995.

START: Greet the student and ask for their Full Name.`;

// ── Groq Client ───────────────────────────────────────────────────────────────
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || '',
});

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
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map((m: any) => ({
                role: m.role === 'model' ? 'assistant' : 'user',
                content: m.parts?.[0]?.text || m.content || '' // Handle both formats
            })),
            { role: 'user', content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages as any,
            model: 'llama-3.3-70b-versatile', // Updated to latest stable model
            temperature: 0.6,
            max_tokens: 1024,
        });

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

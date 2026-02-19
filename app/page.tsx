'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Leaf, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
interface RegistrationData {
  name: string;
  whatsapp: string;
  level: string;
  reason: string;
}

// ── Paused Screen ─────────────────────────────────────────────────────────────
function ClosedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-10 max-w-md w-full"
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Registrations Closed</h2>
        <p className="text-slate-400 leading-relaxed">
          Event registrations are not open at the moment.<br />
          Please check back later or contact the AI@IM club.
        </p>
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-600">AI@IM Club — Codegen Greenhouse Field Visit</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-10 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text mb-2">You&apos;re Registered! 🎉</h2>
        <p className="text-slate-400 text-sm mb-8">See you at the Codegen Greenhouse!</p>
        <div className="space-y-3 text-left">
          {[
            { label: 'Name', value: data.name },
            { label: 'WhatsApp', value: data.whatsapp },
            { label: 'Level', value: data.level },
            { label: 'Reason', value: data.reason },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-white font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-600">AI@IM Club — Codegen Greenhouse Field Visit</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 glass rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2 h-2 rounded-full bg-violet-400 typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

// ── Chat Bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg, idx }: { msg: ChatMessage; idx: number }) {
  const isUser = msg.role === 'user';
  const text = msg.parts[0]?.text ?? '';

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mt-1 mr-2">
          <Leaf className="w-4 h-4 text-violet-300" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : 'glass text-slate-200 rounded-tl-sm'
        )}
      >
        {text}
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [status, setStatus] = useState<'loading' | 'paused' | 'open' | 'done'>('loading');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [regData, setRegData] = useState<RegistrationData | null>(null);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check pause status and start chat
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        if (json.paused) {
          setStatus('paused');
          return;
        }
        setStatus('open');
        // Kick off the conversation
        await sendToGemini([], '__start__');
      } catch {
        setStatus('open');
        await sendToGemini([], '__start__');
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  async function sendToGemini(currentHistory: ChatMessage[], userMessage: string) {
    setIsTyping(true);
    setError('');

    const message = userMessage === '__start__'
      ? 'Hello, I would like to register.'
      : userMessage;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: currentHistory, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }

      const reply: string = data.reply ?? '';

      // Check for registration complete signal
      const completionMatch = reply.match(/REGISTRATION_COMPLETE:([\s\S]*?\{[\s\S]*?\})/);
      if (completionMatch) {
        try {
          const parsed = JSON.parse(completionMatch[1]) as RegistrationData;
          setRegData(parsed);

          // Show "Saving..." message briefly
          const saveMsg = '✅ Saving your registration...';
          const newHistory: ChatMessage[] = [
            ...currentHistory,
            ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
            { role: 'model', parts: [{ text: saveMsg }] },
          ];
          setHistory(newHistory);

          // POST to register route
          const saveRes = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });

          if (saveRes.ok) {
            setStatus('done');
          } else {
            const errData = await saveRes.json();
            setError(errData.error ?? 'Failed to save registration.');
          }
          return;
        } catch {
          setError('Failed to process registration data.');
          return;
        }
      }

      // Normal reply
      const updatedHistory: ChatMessage[] = [
        ...currentHistory,
        ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
        { role: 'model', parts: [{ text: reply }] },
      ];
      setHistory(updatedHistory);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isTyping) return;

    setInput('');
    const newHistory: ChatMessage[] = [...history, { role: 'user', parts: [{ text: msg }] }];
    setHistory(newHistory);
    await sendToGemini(history, msg);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (status === 'paused') return <ClosedScreen />;
  if (status === 'done' && regData) return <SuccessScreen data={regData} />;

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl px-6 py-4 mb-6 flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-violet-300" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">Codegen Greenhouse Field Visit</h1>
          <p className="text-xs text-slate-500">AI@IM Club Event Registration</p>
        </div>
      </motion.header>

      {/* Chat area */}
      <div className="flex-1 glass rounded-2xl p-4 mb-4 overflow-y-auto flex flex-col gap-4 min-h-0" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <AnimatePresence initial={false}>
          {history.map((msg, i) => (
            <Bubble key={i} msg={msg} idx={i} />
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mt-1">
              <Leaf className="w-4 h-4 text-violet-300" />
            </div>
            <TypingIndicator />
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-sm glass rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl px-4 py-3 flex items-end gap-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          maxLength={500}
          placeholder="Type your message…"
          disabled={isTyping}
          className="flex-1 bg-transparent text-white placeholder-slate-600 text-sm resize-none outline-none leading-relaxed"
          style={{ minHeight: '24px', maxHeight: '120px' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </motion.div>

      <p className="text-center text-xs text-slate-700 mt-3">
        Powered by Gemini · AI@IM Club
      </p>
    </div>
  );
}

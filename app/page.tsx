'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Leaf, CheckCircle2, AlertCircle, Loader2,
  Moon, Sun, HelpCircle, X, MessageCircle
} from 'lucide-react';

interface ChatMessage { role: 'user' | 'model'; parts: { text: string }[]; }
interface RegistrationData { name: string; whatsapp: string; level: string; reason: string; }

// ── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  const toggle = () => {
    const next = !dark; setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { }
  };
  return (
    <button onClick={toggle} className="pill-btn" title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

// ── Help popover ──────────────────────────────────────────────────────────────
function HelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`pill-btn ${open ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        title="Help"
      >
        <HelpCircle size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="popover-content absolute right-0 top-full mt-2 w-64 p-4 z-50 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Need Help?</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Issues with registration? Contact the Chief Coordinator directly.
            </p>
            <a
              href="https://wa.me/964762195995"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors"
              onClick={() => setOpen(false)}
            >
              <MessageCircle size={14} />
              Chat on WhatsApp
            </a>
            <p className="text-[10px] text-center text-gray-400 mt-3 font-mono">
              +964 762 195 995
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 p-1">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const text = msg.parts[0]?.text ?? '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-lg text-[14.5px] leading-relaxed whitespace-pre-wrap shadow-sm ${isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 rounded-bl-none'
          }`}
      >
        {text}
      </div>
    </motion.div>
  );
}

// ── Closed screen ─────────────────────────────────────────────────────────────
function ClosedScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-zinc-800 p-8 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center"
      >
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-amber-500">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Registrations Closed</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          Event registrations are currently paused.<br />Please check back later.
        </p>
        <a href="https://wa.me/964762195995" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors">
          <MessageCircle size={16} /> Contact Chief Coordinator
        </a>
      </motion.div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-zinc-800 p-8 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500"
        >
          <CheckCircle2 size={32} />
        </motion.div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Registration Confirmed</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">See you at the Greenhouse!</p>

        <div className="space-y-3 text-left">
          {[
            { l: 'Name', v: data.name },
            { l: 'WhatsApp', v: data.whatsapp },
            { l: 'Level', v: data.level },
            { l: 'Reason', v: data.reason }
          ].map(({ l, v }) => (
            <div key={l} className="flex flex-col p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-800">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">{l}</span>
              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
          <p className="text-xs text-center text-gray-400">AI@IM SIG · Codegen Field Visit</p>
        </div>
      </motion.div>
    </div>
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const sendToGemini = useCallback(async (currentHistory: ChatMessage[], userMessage: string) => {
    setIsTyping(true); setError('');
    const message = userMessage === '__start__' ? 'Hello, I would like to register.' : userMessage;

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
      const match = reply.match(/REGISTRATION_COMPLETE:([\s\S]*?\{[\s\S]*?\})/);

      if (match) {
        try {
          const parsed = JSON.parse(match[1]) as RegistrationData;
          setRegData(parsed);

          const saveMsg = '✅ Saving your registration details...';
          setHistory([...currentHistory,
          ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
          { role: 'model', parts: [{ text: saveMsg }] }
          ]);

          const saveRes = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });

          if (saveRes.ok) setStatus('done');
          else {
            const e = await saveRes.json();
            setError(e.error ?? 'Failed to save.');
          }
        } catch {
          setError('Failed to process registration data.');
        }
        return;
      }

      setHistory([...currentHistory,
      ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
      { role: 'model', parts: [{ text: reply }] }]);

    } catch {
      setError('Connection error. Please check your network.');
    } finally {
      setIsTyping(false);
      // Keep focus on input unless we're done
      if (status !== 'done') inputRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    async function init() {
      try {
        const r = await fetch('/api/status');
        const j = await r.json();
        if (j.paused) { setStatus('paused'); return; }
      } catch { }
      setStatus('open');
      await sendToGemini([], '__start__');
    }
    init();
  }, [sendToGemini]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isTyping) return;
    setInput('');
    setHistory([...history, { role: 'user', parts: [{ text: msg }] }]);
    await sendToGemini(history, msg);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleRetry() {
    setError(''); setHistory([]); setIsTyping(false);
    await sendToGemini([], '__start__');
  }

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  );
  if (status === 'paused') return <ClosedScreen />;
  if (status === 'done' && regData) return <SuccessScreen data={regData} />;

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#191919] flex items-center justify-center p-4">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[560px] bg-white dark:bg-[#202020] rounded-xl shadow-lg border border-[#E9E9E7] dark:border-[#2F2F2F] flex flex-col overflow-hidden"
        style={{ height: 'min(700px, 90vh)' }}
      >

        {/* Header */}
        <header className="px-6 py-4 border-b border-[#E9E9E7] dark:border-[#2F2F2F] flex items-center justify-between bg-white dark:bg-[#202020]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Leaf size={16} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#37352F] dark:text-[#D4D4D4] leading-tight">
                Codegen Field Visit
              </h1>
              <span className="text-[11px] text-[#787774] dark:text-[#9B9B9B] font-medium">
                AI@IM SIG · Registration
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <HelpButton />
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col bg-white dark:bg-[#202020]">
          <AnimatePresence initial={false}>
            {history.map((msg, i) => (
              <Bubble key={i} msg={msg} />
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-zinc-700">
                <Leaf size={12} />
              </div>
              <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-lg rounded-bl-none border border-gray-100 dark:border-zinc-800">
                <TypingDots />
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start gap-3"
            >
              <AlertCircle size={16} className="text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-600 dark:text-red-400 mb-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="text-xs font-semibold text-red-700 dark:text-red-300 underline"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-[#202020] border-t border-[#E9E9E7] dark:border-[#2F2F2F]">
          <div
            className={`
              flex items-end gap-2 p-2 rounded-xl bg-[#F7F7F5] dark:bg-[#2C2C2C] border transition-all duration-200
              ${isTyping ? 'border-transparent opacity-60' : 'border-transparent focus-within:border-blue-500/30 focus-within:ring-2 focus-within:ring-blue-500/10'}
            `}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={isTyping}
              rows={1}
              placeholder="Type your answer..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm text-[#37352F] dark:text-[#D4D4D4] placeholder:text-[#9B9B9B] py-2 px-2 max-h-32"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={`
                p-2 rounded-lg transition-all duration-200 flex-shrink-0 mb-0.5
                ${input.trim() && !isTyping
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed'}
              `}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-center text-[10px] text-[#ACABA9] mt-3 font-medium">
            Powered by Gemini · AI@IM SIG
          </p>
        </div>
      </motion.div>
    </div>
  );
}

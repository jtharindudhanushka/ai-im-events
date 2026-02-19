'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Leaf, CheckCircle2, AlertCircle, Loader2,
  Moon, Sun, MessageCircleQuestion, RefreshCw,
} from 'lucide-react';

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

// ── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { }
  }

  return (
    <button className="icon-btn" onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

// ── WhatsApp help button ───────────────────────────────────────────────────────
function HelpButton() {
  return (
    <a
      href="https://wa.me/964762195995"
      target="_blank"
      rel="noopener noreferrer"
      className="icon-btn"
      title="Contact AI@IM Club on WhatsApp"
    >
      <MessageCircleQuestion size={15} />
    </a>
  );
}

// ── Closed screen ─────────────────────────────────────────────────────────────
function ClosedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-10 text-center"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <AlertCircle size={22} style={{ color: '#e9a23b' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Registrations Closed
        </h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          Event registrations are not open at the moment.<br />
          Please check back later or contact the AI@IM club.
        </p>
        <a
          href="https://wa.me/964762195995"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{
            background: '#25D366',
            color: '#fff',
          }}
        >
          <MessageCircleQuestion size={14} />
          Contact on WhatsApp
        </a>
      </motion.div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-sm w-full p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <CheckCircle2 size={26} style={{ color: '#16a34a' }} />
        </motion.div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
          You&apos;re Registered! 🎉
        </h2>
        <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
          See you at the Codegen Greenhouse!
        </p>

        <div className="space-y-2 text-left">
          {[
            { label: 'Name', value: data.name },
            { label: 'WhatsApp', value: data.whatsapp },
            { label: 'Level', value: data.level },
            { label: 'Reason', value: data.reason },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs font-medium w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--text-faint)' }}>
                {label}
              </span>
              <span className="text-sm" style={{ color: 'var(--text)' }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="divider mt-7 mb-5" />
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
          AI@IM Club · Codegen Greenhouse Field Visit
        </p>
      </motion.div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl rounded-tl-sm w-fit"
      style={{ background: 'var(--bot-bubble)' }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full typing-dot"
          style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const text = msg.parts[0]?.text ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 mr-2"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
        >
          <Leaf size={13} style={{ color: 'var(--accent)' }} />
        </div>
      )}
      <div
        className="max-w-[76%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap"
        style={
          isUser
            ? {
              background: 'var(--user-bubble)',
              color: 'var(--user-bubble-fg)',
              borderBottomRightRadius: '4px',
            }
            : {
              background: 'var(--bot-bubble)',
              color: 'var(--bot-bubble-fg)',
              borderBottomLeftRadius: '4px',
            }
        }
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  const sendToGemini = useCallback(async (currentHistory: ChatMessage[], userMessage: string) => {
    setIsTyping(true);
    setError('');

    const message = userMessage === '__start__' ? 'Hello, I would like to register.' : userMessage;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: currentHistory, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      const reply: string = data.reply ?? '';

      // Detect completion signal
      const completionMatch = reply.match(/REGISTRATION_COMPLETE:([\s\S]*?\{[\s\S]*?\})/);
      if (completionMatch) {
        try {
          const parsed = JSON.parse(completionMatch[1]) as RegistrationData;
          setRegData(parsed);

          const saveMsg = '✅ Saving your registration…';
          const newHistory: ChatMessage[] = [
            ...currentHistory,
            ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
            { role: 'model', parts: [{ text: saveMsg }] },
          ];
          setHistory(newHistory);

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
      setError('Connection error. Please check your network and try again.');
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/status');
        const json = await res.json();
        if (json.paused) { setStatus('paused'); return; }
      } catch { /* ignore */ }
      setStatus('open');
      await sendToGemini([], '__start__');
    }
    init();
  }, [sendToGemini]);

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

  function handleRetry() {
    setError('');
    setHistory([]);
    setStatus('loading');
    sendToGemini([], '__start__').then(() => setStatus('open'));
  }

  // ── Render loading ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (status === 'paused') return <ClosedScreen />;
  if (status === 'done' && regData) return <SuccessScreen data={regData} />;

  // ── Main chat UI ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Top bar */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 border-b"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left: logo + title */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
          >
            <Leaf size={14} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
              Codegen Greenhouse Field Visit
            </p>
            <p className="text-[10px] leading-tight" style={{ color: 'var(--text-faint)' }}>
              AI@IM Club · Event Registration
            </p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1">
          <HelpButton />
          <ThemeToggle />
        </div>
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-2xl mx-auto space-y-3">
          <AnimatePresence initial={false}>
            {history.map((msg, i) => (
              <Bubble key={i} msg={msg} />
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
              >
                <Leaf size={13} style={{ color: 'var(--accent)' }} />
              </div>
              <TypingIndicator />
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm"
              style={{
                background: 'rgba(235,87,87,.08)',
                border: '1px solid rgba(235,87,87,.25)',
                color: '#eb5757',
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-xs font-medium underline opacity-80 hover:opacity-100 flex-shrink-0"
              >
                <RefreshCw size={11} /> Retry
              </button>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="sticky bottom-0 z-20 border-t px-4 py-3"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <div
            className="flex-1 flex items-end gap-2 rounded-xl px-3.5 py-2.5"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={500}
              placeholder="Type your message…"
              disabled={isTyping}
              className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
              style={{
                color: 'var(--text)',
                minHeight: '22px',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150"
              style={{
                background: input.trim() && !isTyping ? 'var(--accent)' : 'var(--border)',
                color: input.trim() && !isTyping ? 'var(--accent-fg)' : 'var(--text-faint)',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] mt-2.5" style={{ color: 'var(--text-faint)' }}>
          Powered by Gemini · AI@IM Club
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Leaf, CheckCircle2, AlertCircle, Loader2,
  Moon, Sun, HelpCircle, X, MessageCircle, RefreshCw,
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
    <button onClick={toggle} className="pill-btn ghost" title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={14} /> : <Moon size={14} />}
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
      <button onClick={() => setOpen(!open)} className="pill-btn ghost" title="Help">
        <HelpCircle size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="popover"
            style={{ top: 'calc(100% + 6px)', right: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>Need Help?</span>
              <button onClick={() => setOpen(false)} className="pill-btn ghost" style={{ padding: '2px 4px' }}>
                <X size={12} />
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
              Having trouble registering? Reach out to the AI@IM Club organizer directly.
            </p>
            <a
              href="https://wa.me/964762195995"
              target="_blank"
              rel="noopener noreferrer"
              className="pill-btn green"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setOpen(false)}
            >
              <MessageCircle size={13} />
              Chat on WhatsApp
            </a>
            <p style={{ color: 'var(--text-faint)', fontSize: 10.5, textAlign: 'center', marginTop: 10 }}>
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
    <div className="bubble-bot flex items-center gap-1.5" style={{ padding: '12px 16px' }}>
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const text = msg.parts[0]?.text ?? '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'items-end gap-2'}`}
    >
      {!isUser && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
          style={{ background: 'var(--accent-light)', border: '1px solid var(--border)' }}
        >
          <Leaf size={11} style={{ color: 'var(--accent)' }} />
        </div>
      )}
      <div className={isUser ? 'bubble-user' : 'bubble-bot'}>{text}</div>
    </motion.div>
  );
}

// ── Closed screen ─────────────────────────────────────────────────────────────
function ClosedScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="n-card max-w-sm w-full p-8 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: '#fff8ed', border: '1px solid #f5d57a' }}>
          <AlertCircle size={22} style={{ color: '#d8a346' }} />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Registrations Closed</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)', lineHeight: 1.65 }}>
          Event registrations are not open right now.<br />Check back later or contact the organizer.
        </p>
        <a href="https://wa.me/964762195995" target="_blank" rel="noopener noreferrer"
          className="pill-btn green" style={{ justifyContent: 'center' }}>
          <MessageCircle size={13} /> Chat on WhatsApp
        </a>
      </motion.div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="n-card max-w-sm w-full p-8 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 size={26} style={{ color: '#16a34a' }} />
        </motion.div>
        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>You&apos;re Registered! 🎉</h2>
        <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>See you at the Codegen Greenhouse!</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
          {[{ l: 'Name', v: data.name }, { l: 'WhatsApp', v: data.whatsapp },
          { l: 'Level', v: data.level }, { l: 'Reason', v: data.reason }].map(({ l, v }) => (
            <div key={l} className="flex gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 500, width: 60, flexShrink: 0, paddingTop: 1 }}>{l}</span>
              <span style={{ color: 'var(--text)', fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="divider" style={{ margin: '24px 0 16px' }} />
        <p style={{ color: 'var(--text-faint)', fontSize: 11 }}>AI@IM Club · Codegen Greenhouse Field Visit</p>
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: currentHistory, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      const reply: string = data.reply ?? '';

      const match = reply.match(/REGISTRATION_COMPLETE:([\s\S]*?\{[\s\S]*?\})/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]) as RegistrationData;
          setRegData(parsed);
          const nh: ChatMessage[] = [...currentHistory,
          ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
          { role: 'model', parts: [{ text: '✅ Saving your registration…' }] }];
          setHistory(nh);
          const saveRes = await fetch('/api/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });
          if (saveRes.ok) setStatus('done');
          else { const e = await saveRes.json(); setError(e.error ?? 'Failed to save.'); }
        } catch { setError('Failed to process registration data.'); }
        return;
      }

      setHistory([...currentHistory,
      ...(userMessage !== '__start__' ? [{ role: 'user' as const, parts: [{ text: userMessage }] }] : []),
      { role: 'model', parts: [{ text: reply }] }]);
    } catch { setError('Connection error. Please check your network.'); }
    finally { setIsTyping(false); inputRef.current?.focus(); }
  }, []);

  useEffect(() => {
    async function init() {
      try { const r = await fetch('/api/status'); const j = await r.json(); if (j.paused) { setStatus('paused'); return; } } catch { }
      setStatus('open');
      await sendToGemini([], '__start__');
    }
    init();
  }, [sendToGemini]);

  async function handleSend() {
    const msg = input.trim(); if (!msg || isTyping) return;
    setInput('');
    const newHist: ChatMessage[] = [...history, { role: 'user', parts: [{ text: msg }] }];
    setHistory(newHist);
    await sendToGemini(history, msg);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleRetry() {
    setError(''); setHistory([]); setIsTyping(false);
    await sendToGemini([], '__start__');
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-faint)' }} />
    </div>
  );
  if (status === 'paused') return <ClosedScreen />;
  if (status === 'done' && regData) return <SuccessScreen data={regData} />;

  // ── Chat UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen p-4 md:p-6" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="n-card w-full flex flex-col"
        style={{ maxWidth: 520, height: 'min(680px, calc(100dvh - 48px))' }}
      >

        {/* ── Card header ── */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)', flexShrink: 0 }}>
          <div className="flex items-center gap-2.5">
            {/* Logo */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
              <Leaf size={15} style={{ color: 'var(--accent)' }} />
            </div>
            {/* Title */}
            <div>
              <h1 style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>
                Codegen Greenhouse Field Visit
              </h1>
              {/* Pill badge */}
              <span className="pill" style={{ background: 'var(--accent-light)', color: 'var(--accent)', marginTop: 3 }}>
                AI@IM Club · Registration
              </span>
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-0.5">
            <HelpButton />
            <ThemeToggle />
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
        >
          <AnimatePresence initial={false}>
            {history.map((msg, i) => <Bubble key={i} msg={msg} />)}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
                <Leaf size={11} style={{ color: 'var(--accent)' }} />
              </div>
              <TypingDots />
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm"
              style={{ background: 'rgba(212,76,71,.07)', border: '1px solid rgba(212,76,71,.2)', color: 'var(--red)' }}>
              <AlertCircle size={14} className="flex-shrink-0" style={{ marginTop: 2 }} />
              <span style={{ flex: 1, fontSize: 12.5 }}>{error}</span>
              <button onClick={handleRetry}
                className="flex items-center gap-1 flex-shrink-0"
                style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--red)', opacity: 0.8, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
                <RefreshCw size={10} /> Retry
              </button>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="px-4 py-3.5 border-t" style={{ borderColor: 'var(--border)', flexShrink: 0 }}>
          <div
            className="flex items-end gap-2 rounded-2xl px-3.5 py-2"
            style={{
              background: 'var(--bg-subtle)',
              border: `1px solid ${isTyping ? 'var(--border)' : 'var(--border-input)'}`,
              transition: 'border-color .15s, box-shadow .15s',
              boxShadow: input ? 'var(--input-shadow)' : 'none',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              maxLength={500}
              placeholder="Message AIMI Bot…"
              disabled={isTyping}
              style={{
                flex: 1,
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 13.5,
                resize: 'none',
                outline: 'none',
                border: 'none',
                lineHeight: 1.55,
                minHeight: '22px',
                maxHeight: '108px',
                overflowY: 'auto',
                padding: '2px 0',
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 108)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="pill-btn primary"
              style={{
                padding: '5px 12px',
                fontSize: 12,
                opacity: (!input.trim() || isTyping) ? 0.4 : 1,
                cursor: (!input.trim() || isTyping) ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                gap: 5,
              }}
            >
              {isTyping ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send
            </button>
          </div>
          <p style={{ color: 'var(--text-faint)', fontSize: 10.5, textAlign: 'center', marginTop: 10 }}>
            Powered by Gemini · AI@IM Club
          </p>
        </div>
      </motion.div>
    </div>
  );
}

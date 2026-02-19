'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, AlertCircle, Loader2, Moon, Sun, HelpCircle, X, Sparkles, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assumes you have this

interface ChatMessage { role: 'user' | 'model'; parts: { text: string }[]; }
interface RegistrationData { name: string; whatsapp: string; email: string; level: string; reason: string; }

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
    <button onClick={toggle} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" title={dark ? 'Switch to light' : 'Switch to dark'}>
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

// ── Bot Icon ──────────────────────────────────────────────────────────────────
function BotIcon() {
  return (
    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
      <Sparkles size={16} className="text-white" fill="white" />
    </div>
  );
}

// ── Chat Bubble (Gemini Style) ────────────────────────────────────────────────
function Bubble({ msg, onConfirm }: { msg: ChatMessage; onConfirm: (text: string) => void }) {
  const isUser = msg.role === 'user';
  const rawText = msg.parts[0]?.text ?? '';

  // 1. Extract JSON data if present
  let confirmData: RegistrationData | null = null;
  if (!isUser) {
    const match = rawText.match(/CONFIRMATION_REQUEST\s*[:\s]*(\{[\s\S]*?\})/i);
    if (match) {
      try { confirmData = JSON.parse(match[1]); } catch { }
    }
  }

  // 2. Clean text for display (remove ALL JSON blocks)
  let displayText = rawText;
  if (!isUser) {
    displayText = displayText
      .replace(/CONFIRMATION_REQUEST\s*[:\s]*\{[\s\S]*?\}/gi, '')
      .replace(/REGISTRATION_COMPLETE\s*[:\s]*\{[\s\S]*?\}/gi, '')
      .trim();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full mb-8", isUser ? "justify-end" : "justify-start gap-4")}
    >
      {!isUser && <BotIcon />}

      <div className={cn(
        "max-w-[85%] md:max-w-[75%] text-[16px] leading-[1.6]",
        isUser
          ? "bg-gray-100 dark:bg-zinc-800 px-5 py-3 rounded-[24px] rounded-br-[4px] text-gray-800 dark:text-gray-100" // User bubble
          : "text-gray-900 dark:text-gray-100 pt-1" // Bot text (no bubble needed)
      )}>
        {/* Render text if it exists */}
        {displayText && (
          <div className="mb-3">
            {displayText.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        )}

        {/* Render Confirmation Card */}
        {confirmData && (
          <div className="bg-white dark:bg-[#1E1F20] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm mt-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Review Your Details
            </h3>
            <div className="space-y-3 mb-5">
              {[
                { l: 'Name', v: confirmData.name },
                { l: 'WhatsApp', v: confirmData.whatsapp },
                { l: 'Email', v: confirmData.email },
                { l: 'Level', v: confirmData.level },
                { l: 'Reason', v: confirmData.reason }
              ].map(({ l, v }) => (
                <div key={l} className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{l}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onConfirm("Yes, these details are correct.")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              Confirm & Register
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Closed Screen ─────────────────────────────────────────────────────────────
function ClosedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-3xl font-semibold mb-2 text-center text-gray-900 dark:text-white">Registrations Closed</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 text-center max-w-md">
        No events are open for registration at the moment. Please check back later or contact the team.
      </p>

      <a
        href="https://wa.me/94762195995"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-8 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
      >
        <MessageCircle size={18} />
        Contact Team
      </a>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">AI@IM SIG · Field Visit</p>
      </div>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
        <Sparkles size={32} />
      </div>
      <h1 className="text-3xl font-semibold mb-2 text-center text-gray-900 dark:text-white">Submitted! 🎉</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 text-center">
        More details will be shared in the future.
      </p>

      <div className="w-full max-w-md bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
        {[
          { l: 'Name', v: data.name },
          { l: 'WhatsApp', v: data.whatsapp },
          { l: 'Email', v: data.email },
          { l: 'Level', v: data.level },
          { l: 'Goal', v: data.reason }
        ].map(({ l, v }) => (
          <div key={l} className="flex justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 last:pb-0 first:pt-0">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{l}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200 text-right max-w-[60%] truncate">{v}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">AI@IM SIG · Field Visit</p>
      </div>
    </div>
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
        className={`p-2.5 rounded-full transition-colors text-gray-500 dark:text-gray-400 ${open ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
        title="Help"
      >
        <HelpCircle size={20} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 p-5 z-50 bg-white dark:bg-[#1E1F20] border border-gray-200 dark:border-zinc-800 shadow-xl rounded-2xl"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Codegen Industry Visit</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">AI@IM SIG Event</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={16} />
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium">
                📅 Date to be announced soon!
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-300 mt-1">
                Stay tuned for updates.
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Have questions or need clarification? Contact the Chief Coordinator directly.
            </p>

            <a
              href="https://wa.me/94762195995"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => setOpen(false)}
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'open' | 'done' | 'closed'>('open');
  const [regData, setRegData] = useState<RegistrationData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check pause status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.paused) setStatus('closed');
      })
      .catch(() => { });
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  // Initial greeting
  useEffect(() => {
    if (status === 'closed') return;
    // Small delay for effect
    setTimeout(() => {
      setHistory([{ role: 'model', parts: [{ text: "Hi there! 👋 I'm the AI@IM assistant.\n\nReady to sign up for the **Codegen Greenhouse Field Visit**?" }] }]);
    }, 600);
  }, [status]);

  async function handleSend(overrideMsg?: string) {
    const msg = overrideMsg || input.trim();
    if (!msg || isTyping || status === 'done' || status === 'closed') return;

    if (!overrideMsg) setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const newHistory = [...history, { role: 'user', parts: [{ text: msg }] } as ChatMessage];
    setHistory(newHistory);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: newHistory, message: msg }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      const reply = data.reply || '';

      // Check for completion with relaxed regex
      const match = reply.match(/REGISTRATION_COMPLETE\s*[:\s]*(\{[\s\S]*?\})/i);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          setRegData(parsed);

          await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          });

          setStatus('done');
          setIsTyping(false);
          return;
        } catch { } // Consider logging here or alerting user in a more robust app
      }

      setHistory([...newHistory, { role: 'model', parts: [{ text: reply }] }]);
    } catch (err: any) {
      const errMsg = err.message || "Unknown error";
      setHistory([...newHistory, {
        role: 'model',
        parts: [{ text: `⚠️ **Oops!** ${errMsg}` }]
      }]);
    }

    // Cleanup if not done
    setIsTyping(false);
    // Only focus if we typed manually (no override)
    if (!overrideMsg) inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-[#131314] text-gray-900 dark:text-gray-100 font-[Inter]">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">AI@IM</span>
          <span className="text-lg text-gray-400 dark:text-gray-600">/</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">Events</span>
        </div>
        <div className="flex items-center gap-1">
          <HelpButton />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full pt-36 pb-32">

          {status === 'closed' ? (
            <ClosedScreen />
          ) : status === 'done' && regData ? (
            <SuccessScreen data={regData} />
          ) : (
            <>
              {history.length === 0 && (
                // Empty state / Loading initial
                <div className="flex items-center justify-center h-[60vh] text-gray-400 animate-pulse">
                  <Sparkles />
                </div>
              )}

              <AnimatePresence initial={false}>
                {history.map((msg, i) => (
                  <Bubble key={i} msg={msg} onConfirm={handleSend} />
                ))}
              </AnimatePresence>

              {isTyping && (
                <div className="flex gap-4 mb-8">
                  <BotIcon />
                  <div className="flex items-center gap-1 pt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </>
          )}

        </div>
      </main>

      {/* Input Area (Floating) */}
      {status === 'open' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 md:pb-6 z-20 bg-gradient-to-t from-white via-white to-transparent dark:from-[#131314] dark:via-[#131314] dark:to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <div className="relative flex items-end gap-2 p-3 bg-gray-100 dark:bg-[#1E1F20] rounded-[28px] shadow-lg dark:shadow-none transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:bg-white dark:focus-within:bg-[#2A2B2C]">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Message AI@IM..."
                className="w-full max-h-32 bg-transparent border-0 focus:ring-0 resize-none py-3 px-4 text-[16px] text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
                style={{ minHeight: '48px' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = `${Math.min(t.scrollHeight, 150)}px`;
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="p-2.5 mb-1.5 mr-1.5 rounded-full bg-blue-600 text-white disabled:bg-transparent disabled:text-gray-400 transition-all hover:bg-blue-700 disabled:hover:bg-transparent"
              >
                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3 font-medium">
              Powered by Groq Llama 3 · AI@IM SIG
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

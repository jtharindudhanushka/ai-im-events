'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Leaf, AlertCircle, Loader2, Moon, Sun, HelpCircle, X, Sparkles, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assumes you have this, or I'll implement inline

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
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const text = msg.parts[0]?.text ?? '';

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
        {/* Simple markdown-like rendering (bolding) */}
        {text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        )}
      </div>
    </motion.div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-400">
        <Sparkles size={32} />
      </div>
      <h1 className="text-3xl font-semibold mb-2 text-center text-gray-900 dark:text-white">You&apos;re in! 🎉</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 text-center">See you at the Greenhouse.</p>

      <div className="w-full max-w-md bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
        {[
          { l: 'Name', v: data.name },
          { l: 'WhatsApp', v: data.whatsapp },
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState<'open' | 'done'>('open');
  const [regData, setRegData] = useState<RegistrationData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isTyping]);

  // Initial greeting
  useEffect(() => {
    // Small delay for effect
    setTimeout(() => {
      setHistory([{ role: 'model', parts: [{ text: "Hi there! 👋 I'm the AI@IM assistant.\n\nReady to sign up for the **Codegen Greenhouse Field Visit**?" }] }]);
    }, 600);
  }, []);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isTyping || status === 'done') return;

    setInput('');
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

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      const reply = data.reply || '';

      // Check for completion
      const match = reply.match(/REGISTRATION_COMPLETE:([\s\S]*?\{[\s\S]*?\})/);
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
        } catch { }
      }

      setHistory([...newHistory, { role: 'model', parts: [{ text: reply }] }]);
    } catch {
      setHistory([...newHistory, { role: 'model', parts: [{ text: "⚠️ Oops, I hiccuped. Could you say that again?" }] }]);
    }

    // Cleanup if not done
    setIsTyping(false);
    // We know status was 'open' at start, so unless we returned above, we are still open.
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-[#131314] text-gray-900 dark:text-gray-100 font-[Inter]">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">AI@IM</span>
          <span className="text-lg text-gray-400 dark:text-gray-600">/</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">Events</span>
        </div>
        <div className="flex items-center gap-1">
          <a href="https://wa.me/964762195995" target="_blank" className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-400">
            <HelpCircle size={20} />
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth">
        <div className="max-w-3xl mx-auto w-full pt-6 pb-32">

          {status === 'done' && regData ? (
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
                  <Bubble key={i} msg={msg} />
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
                onClick={handleSend}
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, AlertCircle, Loader2, Moon, Sun, HelpCircle, X, Sparkles, MessageCircle, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Reusable Logic for Chat ───────────────────────────────────────────────────
function useChatLogic(isOpen: boolean) {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [regData, setRegData] = useState<RegistrationData | null>(null);
    const [chatStatus, setChatStatus] = useState<'open' | 'done'>('open');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial greeting when opened
    const hasGreeted = useRef(false);
    useEffect(() => {
        if (isOpen && !hasGreeted.current) {
            hasGreeted.current = true;
            setTimeout(() => {
                setHistory([{ role: 'model', parts: [{ text: "Hi there! 👋 I'm the AI@IM assistant.\n\nReady to sign up for the **Greenhouse Facility Visit**?" }] }]);
            }, 600);
        }
    }, [isOpen]);

    // Auto-scroll
    useEffect(() => {
        if (isOpen) scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isTyping, isOpen]);

    async function handleSend(overrideMsg?: string) {
        const msg = overrideMsg || input.trim();
        if (!msg || isTyping || chatStatus === 'done') return;

        if (!overrideMsg) setInput('');
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
            if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

            const reply = data.reply || '';
            const match = reply.match(/REGISTRATION_COMPLETE\s*[:\s]*(\{[\s\S]*?\})/i);

            if (match) {
                try {
                    const parsed = JSON.parse(match[1]);
                    setRegData(parsed);
                    await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...parsed, email: '' })
                    });
                    setChatStatus('done');
                    setIsTyping(false);
                    return;
                } catch { }
            }

            setHistory([...newHistory, { role: 'model', parts: [{ text: reply }] }]);
        } catch (err: any) {
            setHistory([...newHistory, { role: 'model', parts: [{ text: `⚠️ **Oops!** ${err.message || "Unknown error"}` }] }]);
        } finally {
            setIsTyping(false);
        }
    }

    return { history, input, setInput, isTyping, chatStatus, regData, scrollRef, handleSend };
}

// ── Components: Chat Popup ────────────────────────────────────────────────────
function BotIcon() {
    return (
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Sparkles size={16} className="text-white" fill="white" />
        </div>
    );
}

function Bubble({ msg, onConfirm }: { msg: ChatMessage; onConfirm: (text: string) => void }) {
    const isUser = msg.role === 'user';
    const rawText = msg.parts[0]?.text ?? '';

    let confirmData: RegistrationData | null = null;
    if (!isUser) {
        const match = rawText.match(/CONFIRMATION_REQUEST\s*[:\s]*(\{[\s\S]*?\})/i);
        if (match) { try { confirmData = JSON.parse(match[1]); } catch { } }
    }

    let displayText = rawText;
    if (!isUser) {
        displayText = displayText
            .replace(/CONFIRMATION_REQUEST\s*[:\s]*\{[\s\S]*?\}/gi, '')
            .replace(/REGISTRATION_COMPLETE\s*[:\s]*\{[\s\S]*?\}/gi, '')
            .trim();
    }

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start gap-3")}>
            {!isUser && <BotIcon />}
            <div className={cn("max-w-[85%] text-[15px] leading-relaxed", isUser ? "bg-gray-100 dark:bg-zinc-800 px-4 py-2.5 rounded-2xl rounded-br-none text-gray-800 dark:text-gray-100" : "text-gray-900 dark:text-gray-100 pt-1")}>
                {displayText && (
                    <div className="mb-2">
                        {displayText.split(/\*\*(.*?)\*\*/g).map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
                    </div>
                )}
                {confirmData && (
                    <div className="bg-white dark:bg-[#1E1F20] border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm mt-2">
                        <div className="space-y-2 mb-3">
                            {[{ l: 'Name', v: confirmData.name }, { l: 'WhatsApp', v: confirmData.whatsapp }, { l: 'Level', v: confirmData.level }, { l: 'Reason', v: confirmData.reason }]
                                .map(({ l, v }) => (
                                    <div key={l} className="grid grid-cols-[70px_1fr] gap-2 text-xs">
                                        <span className="text-gray-500">{l}</span>
                                        <span className="font-medium">{v}</span>
                                    </div>
                                ))}
                        </div>
                        <button onClick={() => onConfirm("Yes, details are correct.")} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium">Confirm & Register</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function ChatPopup({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { history, input, setInput, isTyping, chatStatus, regData, scrollRef, handleSend } = useChatLogic(isOpen);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 sm:items-end sm:justify-end sm:right-6 sm:bottom-6 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="pointer-events-auto w-full max-w-[380px] h-[600px] max-h-[80vh] bg-white dark:bg-[#131314] rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-[#131314]/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-blue-600" />
                                <span className="font-semibold text-sm">AI Assistant</span>
                            </div>
                            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                            {chatStatus === 'done' && regData ? (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                        <Check size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Registration Complete!</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Thanks {regData.name.split(' ')[0]}!</p>
                                </div>
                            ) : (
                                <>
                                    {history.map((msg, i) => <Bubble key={i} msg={msg} onConfirm={handleSend} />)}
                                    {isTyping && (
                                        <div className="flex gap-3 mb-6">
                                            <BotIcon />
                                            <div className="flex items-center gap-1 pt-2">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {chatStatus === 'open' && (
                            <div className="p-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-[#1E1F20]/50">
                                <div className="relative flex items-end gap-2 p-2 bg-white dark:bg-[#2A2B2C] rounded-xl border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-blue-500/20">
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder="Type your message..."
                                        className="w-full max-h-24 bg-transparent border-0 focus:ring-0 resize-none py-2 px-2 text-sm"
                                        style={{ minHeight: '36px' }}
                                    />
                                    <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="p-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-200 dark:disabled:bg-zinc-700 disabled:text-gray-400 hover:bg-blue-700 transition-colors">
                                        {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ── Components: Registration Form ─────────────────────────────────────────────
function RegistrationForm({ onSuccess }: { onSuccess: (data: RegistrationData) => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', whatsapp: '', interest: '' });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        // Strict 10-digit validation
        if (!/^07\d{8}$/.test(formData.whatsapp)) {
            setError('WhatsApp number must be exactly 10 digits and start with 07 (e.g., 0712345678).');
            return;
        }

        setLoading(true);
        try {
            const payload = { ...formData, level: 'Not Specified', reason: formData.interest, email: '' }; // Map interest -> reason
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to register');
            }

            onSuccess(payload);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-3">Greenhouse Registration</h1>
                <p className="text-gray-500 dark:text-gray-400">Join us for an exclusive industry visit.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</label>
                    <input
                        type="tel"
                        required
                        placeholder="0712345678"
                        maxLength={10}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.whatsapp}
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData({ ...formData, whatsapp: val });
                        }}
                    />
                    <p className="text-xs text-gray-400">Must be 10 digits (e.g., 071...)</p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Why do you want to join?</label>
                    <textarea
                        required
                        placeholder="I'm interested in..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                        value={formData.interest}
                        onChange={e => setFormData({ ...formData, interest: e.target.value })}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Register Now'}
                </button>
            </form>
        </div>
    );
}

// ── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ data }: { data: RegistrationData }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in zoom-in duration-500">
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
                    { l: 'Goal', v: data.reason } // "Level" omitted from summary if not collected
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

// ── Components: Closed Screen & Help ──────────────────────────────────────────
function ClosedScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                <AlertCircle size={32} />
            </div>
            <h1 className="text-3xl font-semibold mb-2 text-center text-gray-900 dark:text-white">Registrations Closed</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 text-center max-w-md">No events are open for registration at the moment.</p>
            <a href="https://wa.me/94762195995" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg">
                <MessageCircle size={18} /> Contact Team
            </a>
        </div>
    );
}

function HelpButton() {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setOpen(!open)} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-400"><HelpCircle size={20} /></button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-72 p-5 z-50 bg-white dark:bg-[#1E1F20] border border-gray-200 dark:border-zinc-800 shadow-xl rounded-2xl">
                            <h3 className="text-sm font-semibold mb-1">Need Help?</h3>
                            <p className="text-xs text-gray-500 mb-4">Contact the Chief Coordinator directly.</p>
                            <a href="https://wa.me/94762195995" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-medium">
                                <MessageCircle size={16} /> Chat on WhatsApp
                            </a>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
    const [status, setStatus] = useState<'open' | 'done' | 'closed'>('open');
    const [regData, setRegData] = useState<RegistrationData | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        fetch('/api/status').then(res => res.json()).then(data => { if (data.paused) setStatus('closed'); }).catch(() => { });
    }, []);

    return (
        <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-[#131314] text-gray-900 dark:text-gray-100 font-[Inter]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">AI@IM</span>
                    <span className="text-lg text-gray-400 dark:text-gray-600">/</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">Events</span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Chat Trigger Icon */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        title="Open AI Chat"
                    >
                        <MessageCircle size={20} />
                    </button>

                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1" />
                    <HelpButton />
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col justify-center px-4 md:px-0 pt-24 pb-12">
                {status === 'closed' ? (
                    <ClosedScreen />
                ) : status === 'done' && regData ? (
                    <SuccessScreen data={regData} />
                ) : (
                    <RegistrationForm onSuccess={(data) => { setRegData(data); setStatus('done'); }} />
                )}
            </main>

            {/* Footer with Disclaimer */}
            <footer className="py-6 text-center">
                <p className="text-xs text-gray-400 font-medium mb-1">
                    Powered by AI@IM SIG
                </p>
                <p className="text-[10px] text-gray-500/80 dark:text-gray-500 max-w-sm mx-auto leading-tight">
                    This is a Beta Stage testing App. Errors can be reported via the help section.
                </p>
            </footer>

            {/* Chat Popup */}
            <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
}

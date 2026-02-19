'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download, Eye, EyeOff, Loader2, LogOut, Pause, Play,
    Users, Copy, CheckCheck, AlertCircle, Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Registration {
    id: string;
    name: string;
    whatsapp: string;
    email: string;
    level: string;
    reason: string;
    created_at: string;
}

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        // Test auth by calling the admin API
        const res = await fetch('/api/admin', {
            headers: { Authorization: `Bearer ${password}` },
        });
        setLoading(false);
        if (res.ok) {
            onLogin(password);
        } else {
            setError('Incorrect password. Please try again.');
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl p-8 w-full max-w-sm"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-violet-300" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Admin Dashboard</h1>
                        <p className="text-xs text-slate-500">AI@IM Events</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type={show ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm outline-none focus:border-violet-500/60 transition-colors pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShow((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-red-400 text-sm flex items-center gap-2"
                            >
                                <AlertCircle className="w-4 h-4" /> {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={!password || loading}
                        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
    const [rows, setRows] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [pauseLoading, setPauseLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const authHeaders = { Authorization: `Bearer ${token}` };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin', { headers: authHeaders });
            const json = await res.json();
            if (res.ok) setRows(json.data ?? []);
            else setError(json.error ?? 'Failed to load data.');
        } catch {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const fetchPauseState = useCallback(async () => {
        try {
            const res = await fetch('/api/status');
            const json = await res.json();
            setPaused(json.paused === true);
        } catch { /* silently ignore */ }
    }, []);

    useEffect(() => {
        fetchData();
        fetchPauseState();
    }, [fetchData, fetchPauseState]);

    async function deleteRegistration(id: string) {
        if (!confirm('Are you sure you want to delete this registration?')) return;

        // Optimistic update
        setRows(prev => prev.filter(r => r.id !== id));

        try {
            const res = await fetch('/api/admin', {
                method: 'DELETE',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || 'Failed to delete');
            }
        } catch (err: any) {
            setError(err.message);
            fetchData(); // Revert on error
        }
    }

    async function togglePause() {
        setPauseLoading(true);
        try {
            const res = await fetch('/api/admin', {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ paused: !paused }),
            });
            const json = await res.json();
            if (res.ok) setPaused(json.paused);
            else setError(json.error ?? 'Failed to update.');
        } catch {
            setError('Network error.');
        } finally {
            setPauseLoading(false);
        }
    }

    async function downloadCSV() {
        const res = await fetch('/api/admin?format=csv', { headers: authHeaders });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registrations_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function copyWhatsApps() {
        const numbers = rows.map((r) => r.whatsapp).join('\n');
        await navigator.clipboard.writeText(numbers);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }

    return (
        <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center gap-4"
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-violet-300" />
                    </div>
                    <div>
                        <h1 className="font-bold text-white">Registrations Dashboard</h1>
                        <p className="text-xs text-slate-500">Codegen Greenhouse Field Visit · AI@IM Club</p>
                    </div>
                </div>

                {/* Stats pill */}
                <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-400" />
                    <span className="text-white font-semibold">{rows.length}</span>
                    <span className="text-slate-500 text-sm">registered</span>
                </div>

                {/* Status pill */}
                <div className={cn(
                    'glass rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-medium',
                    paused ? 'border-amber-500/30 text-amber-400' : 'border-emerald-500/30 text-emerald-400'
                )}>
                    <div className={cn('w-2 h-2 rounded-full', paused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse')} />
                    {paused ? 'Registrations Paused' : 'Registrations Open'}
                </div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="glass rounded-xl px-3 py-2 text-slate-400 hover:text-white transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </motion.div>

            {/* Action Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-3 mb-6"
            >
                {/* Pause / Resume */}
                <button
                    onClick={togglePause}
                    disabled={pauseLoading}
                    className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50',
                        paused
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                    )}
                >
                    {pauseLoading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {paused ? 'Resume Registrations' : 'Pause Registrations'}
                </button>

                {/* Download CSV */}
                <button
                    onClick={downloadCSV}
                    disabled={rows.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download CSV
                </button>

                {/* Copy WhatsApp numbers */}
                <button
                    onClick={copyWhatsApps}
                    disabled={rows.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy WhatsApp Numbers'}
                </button>
            </motion.div>

            {error && (
                <div className="glass border-red-500/30 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-2xl overflow-hidden"
            >
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="text-center py-20 text-slate-600">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No registrations yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/8">
                                    {['#', 'Name', 'WhatsApp', 'Email', 'Level', 'Reason', 'Registered', ''].map((h, i) => (
                                        <th key={i} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <motion.tr
                                        key={r.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                                    >
                                        <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">{i + 1}</td>
                                        <td className="px-4 py-3.5 text-white font-medium whitespace-nowrap">{r.name}</td>
                                        <td className="px-4 py-3.5 text-violet-300 font-mono text-xs whitespace-nowrap">{r.whatsapp}</td>
                                        <td className="px-4 py-3.5 text-slate-300 text-xs whitespace-nowrap">{r.email}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="glass rounded-lg px-2.5 py-1 text-xs text-slate-300 whitespace-nowrap">{r.level}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-400 max-w-xs">
                                            <p className="line-clamp-2">{r.reason}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600 text-xs whitespace-nowrap">
                                            {new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <button
                                                onClick={() => deleteRegistration(r.id)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Delete"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const [token, setToken] = useState<string | null>(null);

    function handleLogin(t: string) { setToken(t); }
    function handleLogout() { setToken(null); }

    if (!token) return <LoginScreen onLogin={handleLogin} />;
    return <Dashboard token={token} onLogout={handleLogout} />;
}

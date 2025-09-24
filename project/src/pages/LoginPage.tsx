import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { authAdapter } from '../adapters';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';
import {
    ExclamationTriangleIcon,
    EyeIcon,
    EyeSlashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function LoginPage() {
    const { session, setSession, showToast } = useApp();
    const nav = useNavigate();
    const loc = useLocation();
    const from = (loc.state as any)?.from?.pathname || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    // subtle warning ribbon
    const [warn, setWarn] = useState<string | null>(null);
    const hideTimer = useRef<number | null>(null);
    const openWarn = (msg: string) => {
        setWarn(msg);
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setWarn(null), 4000);
    };
    useEffect(() => () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }, []);

    if (session) return <Navigate to={from} replace />;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const u = username.trim();
        if (!u || !password) {
            openWarn('Please enter both username and password.');
            return;
        }
        setLoading(true);
        try {
            const s = await authAdapter.signInWithPassword(u, password);
            setSession(s);
            showToast('Welcome!', 'success');
            nav(from, { replace: true });
        } catch (e: any) {
            const raw = e?.message || 'Login failed';
            let friendly = 'Login failed. Please try again.';
            if (raw.includes('(401)')) friendly = 'Incorrect username or password.';
            else if (raw.includes('(403)')) friendly = 'Forbidden (check API route/auth).';
            else if (raw.includes('(404)')) friendly = 'Endpoint not found (check URL).';
            else if (raw.includes('(409)')) friendly = 'Account exists already.';
            else if (raw.includes('(500)')) friendly = 'Server error.';
            openWarn(friendly);
            showToast(friendly, 'error');
        } finally {
            setLoading(false);
        }
    };

    const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg relative overflow-hidden">
            {/* decorative blur blobs */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#6366F1]/25 to-[#22D3EE]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-[#A78BFA]/20 to-[#60A5FA]/20 blur-3xl" />

            <div className="w-full max-w-sm">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {/* header strip */}
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary-100/70 to-transparent pointer-events-none" />

                    {/* Logo + brand */}
                    <div className="relative pt-7 pb-2 flex flex-col items-center">
                        <div className="relative grid place-items-center">
                            <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-br from-[#6366F1]/30 to-[#22D3EE]/30" />
                            <img src={logoSrc} alt="Dialife" className="relative h-12 w-12 drop-shadow-sm" />
                        </div>
                        <h1 className="mt-3 text-xl font-semibold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#22D3EE]">
                Dialife
              </span>
                        </h1>
                        <p className="text-sm text-text-muted -mt-0.5">Welcome back</p>
                    </div>

                    {/* warning ribbon */}
                    {warn && (
                        <div className="mx-4 mb-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 shadow-sm p-2.5 flex items-start gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 mt-0.5 flex-none" />
                            <p className="text-sm">{warn}</p>
                            <button
                                type="button"
                                onClick={() => setWarn(null)}
                                className="ml-auto rounded p-1 hover:bg-amber-100"
                                aria-label="Dismiss"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="relative p-6 pt-4 space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm">Username</label>
                            <input
                                id="username"
                                className="w-full rounded-xl border border-border bg-bg p-2"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                placeholder="e.g. john_doe"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPw ? 'text' : 'password'}
                                    className="w-full rounded-xl border border-border bg-bg p-2 pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-soft"
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                </button>
                            </div>
                        </div>
                        <p className="text-right text-sm -mt-1">
                            <Link to="/forgot" className="text-primary-600 hover:underline">Forgot
                                password?</Link>
                        </p>
                        <Button type="submit" loading={loading} className="w-full">Sign in</Button>

                        {/* First time? */}
                        <p className="text-center text-sm text-text-muted">
                            First time here?{' '}
                            <Link to="/signup" className="text-primary-600 hover:underline">
                                Create an account
                            </Link>
                        </p>
                    </form>
                </div>

                <p className="mt-4 text-center text-xs text-text-muted">
                    Tip: check API URL & CORS if sign-in fails.
                </p>
            </div>
        </div>
    );
}

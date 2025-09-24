import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { authAdapter } from '../adapters';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ForgotPasswordPage() {
    const { showToast } = useApp();
    const nav = useNavigate();

    const [username, setUsername] = useState('');
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

    // dev-mode token (if backend returns it)
    const [devToken, setDevToken] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const u = username.trim();
        if (!u) return openWarn('Please enter your username.');
        setLoading(true);
        try {
            const { devToken } = await authAdapter.requestPasswordReset(u);
            showToast('If the account exists, reset instructions have been sent.', 'success');
            if (devToken) setDevToken(devToken); // for local/dev environments
        } catch (e: any) {
            const raw = e?.message || '';
            let friendly = 'Could not start password reset.';
            if (raw.includes('(404)')) friendly = 'No account found for that username.';
            else if (raw.includes('(429)')) friendly = 'Too many attempts. Try again later.';
            openWarn(friendly);
            showToast(friendly, 'error');
        } finally {
            setLoading(false);
        }
    };

    const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#6366F1]/25 to-[#22D3EE]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-[#A78BFA]/20 to-[#60A5FA]/20 blur-3xl" />

            <div className="w-full max-w-sm">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary-100/70 to-transparent pointer-events-none" />

                    <div className="relative pt-7 pb-2 flex flex-col items-center">
                        <div className="relative grid place-items-center">
                            <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-br from-[#6366F1]/30 to-[#22D3EE]/30" />
                            <img src={logoSrc} alt="Dialife" className="relative h-12 w-12 drop-shadow-sm" />
                        </div>
                        <h1 className="mt-3 text-xl font-semibold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#22D3EE]">
                Forgot your password?
              </span>
                        </h1>
                        <p className="text-sm text-text-muted -mt-0.5">We’ll help you reset it</p>
                    </div>

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

                    <form onSubmit={onSubmit} className="relative p-6 pt-4 space-y-4">
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

                        <Button type="submit" loading={loading} className="w-full">
                            Send reset instructions
                        </Button>

                        <p className="text-center text-sm text-text-muted">
                            Remembered it?{' '}
                            <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
                        </p>
                    </form>

                    {devToken && (
                        <div className="px-6 pb-6">
                            <div className="rounded-xl border border-border bg-bg-soft p-3 text-sm">
                                <div className="font-medium mb-1">Dev mode reset code</div>
                                <div className="font-mono break-all text-text">{devToken}</div>
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(devToken);
                                            showToast('Code copied', 'success');
                                        }}
                                        size="sm"
                                    >
                                        Copy
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => nav(`/reset?token=${encodeURIComponent(devToken)}`)}
                                    >
                                        Continue to reset
                                    </Button>
                                </div>
                                <p className="mt-2 text-xs text-text-muted">For local/testing only.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

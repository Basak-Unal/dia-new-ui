import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import { authAdapter } from '../adapters';
import { ExclamationTriangleIcon, XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

function pwScore(p: string) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^\w\s]/.test(p)) s++;
    return Math.min(s, 4);
}

export default function ResetPasswordPage() {
    const { showToast } = useApp();
    const nav = useNavigate();
    const [search] = useSearchParams();
    const initialToken = search.get('token') || '';

    const [token, setToken] = useState(initialToken);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw1, setShowPw1] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [loading, setLoading] = useState(false);

    // warning ribbon
    const [warn, setWarn] = useState<string | null>(null);
    const hideTimer = useRef<number | null>(null);
    const openWarn = (msg: string) => {
        setWarn(msg);
        if (hideTimer.current) window.clearTimeout(hideTimer.current);
        hideTimer.current = window.setTimeout(() => setWarn(null), 4000);
    };
    useEffect(() => () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }, []);

    const strong = useMemo(() => PASSWORD_RE.test(password), [password]);
    const match = useMemo(() => password === confirm && confirm.length > 0, [password, confirm]);
    const score = pwScore(password);
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const bars = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

    const canSubmit = !!token && strong && match && !loading;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return openWarn('Missing or invalid reset code.');
        if (!strong) return openWarn('Password must be 8+ chars with letters, numbers, and a special character.');
        if (!match) return openWarn('Passwords do not match.');
        setLoading(true);
        try {
            await authAdapter.resetPassword(token, password);
            showToast('Password updated. Please sign in.', 'success');
            nav('/login', { replace: true });
        } catch (e: any) {
            const raw = e?.message || '';
            let friendly = 'Could not reset password.';
            if (raw.includes('(400)')) friendly = 'Invalid or expired reset code.';
            else if (raw.includes('(404)')) friendly = 'Reset code not found.';
            else if (raw.includes('(500)')) friendly = 'Server error.';
            openWarn(friendly);
            showToast(friendly, 'error');
        } finally {
            setLoading(false);
        }
    };

    const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;

    const pwBorder = password.length === 0 ? 'border-border' : strong ? 'border-border' : 'border-red-300';
    const confirmBorder = confirm.length === 0 ? 'border-border' : match ? 'border-border' : 'border-red-300';

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
                Reset password
              </span>
                        </h1>
                        <p className="text-sm text-text-muted -mt-0.5">Enter your new password</p>
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
                            <label htmlFor="token" className="block text-sm">Reset code</label>
                            <input
                                id="token"
                                className="w-full rounded-xl border border-border bg-bg p-2"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Paste the code you received"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm">New password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPw1 ? 'text' : 'password'}
                                    className={`w-full rounded-xl border p-2 pr-10 bg-bg ${pwBorder}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    aria-invalid={!strong && password.length > 0}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw1((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-soft"
                                >
                                    {showPw1 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            <div className="h-1 rounded bg-gray-100 overflow-hidden mt-2">
                                <div className={`h-full ${bars[score]}`} style={{ width: widths[score] }} />
                            </div>
                            <p className="text-xs text-text-muted">At least 8 characters with letters, numbers, and a special character.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="confirm" className="block text-sm">Confirm new password</label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    type={showPw2 ? 'text' : 'password'}
                                    className={`w-full rounded-xl border p-2 pr-10 bg-bg ${confirmBorder}`}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    aria-invalid={!match && confirm.length > 0}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw2((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-soft"
                                >
                                    {showPw2 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" loading={loading} disabled={!canSubmit} className="w-full">
                            Update password
                        </Button>

                        <p className="text-center text-sm text-text-muted">
                            Back to{' '}
                            <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

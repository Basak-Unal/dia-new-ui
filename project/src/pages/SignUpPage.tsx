// src/pages/SignUpPage.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { authAdapter } from '../adapters';
import { Button } from '../components/ui/Button';
import { buildApiUrl } from '../config';
import {
    ExclamationTriangleIcon,
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline';

const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

type AvailState = 'idle' | 'checking' | 'ok' | 'taken' | 'err';

function pwScore(p: string) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^\w\s]/.test(p)) s++; // special char
    return Math.min(s, 4);
}

export default function SignUpPage() {
    const { session, setSession, showToast } = useApp();
    const nav = useNavigate();
    const loc = useLocation();
    const from = (loc.state as any)?.from?.pathname || '/';

    // form state
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw1, setShowPw1] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [agree, setAgree] = useState(false);
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

    // availability check (debounced, abortable, cached)
    const [avail, setAvail] = useState<AvailState>('idle');
    const lastCheckedRef = useRef<string>('');
    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<number | null>(null);

    async function checkUsername(u: string) {
        const val = u.trim();
        if (!USERNAME_RE.test(val)) { setAvail('idle'); return; }
        if (val === lastCheckedRef.current) return;

        // cancel in-flight
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setAvail('checking');
        try {
            const res = await fetch(buildApiUrl(`users?username=${encodeURIComponent(val)}`), {
                signal: ctrl.signal,
            });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            const exists = Array.isArray(data) ? data.length > 0 : !!data?.exists;
            setAvail(exists ? 'taken' : 'ok');
            lastCheckedRef.current = val;
        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            setAvail('err');
        }
    }

    function onUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value;
        setUsername(v);
        setAvail('idle');
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => checkUsername(v), 500);
    }

    // validations
    const usernameValid = useMemo(() => USERNAME_RE.test(username.trim()), [username]);
    const passwordStrong = useMemo(() => PASSWORD_RE.test(password), [password]);
    const passwordsMatch = useMemo(() => password === confirm && confirm.length > 0, [password, confirm]);
    const score = pwScore(password);

    const formValid =
        usernameValid &&
        passwordStrong &&
        passwordsMatch &&
        agree;

    const canSubmit =
        formValid &&
        avail !== 'checking' &&
        avail !== 'taken' &&
        !loading;

    if (session) return <Navigate to={from} replace />;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usernameValid) return openWarn('Username must be 3–20 chars: letters, numbers, _ or .');
        if (!passwordStrong) return openWarn('Password must be 8+ chars with letters, numbers, and a special character.');
        if (!passwordsMatch) return openWarn('Passwords do not match.');
        if (avail === 'checking') return openWarn('Checking username… please wait.');
        if (avail === 'taken') return openWarn('Username already exists. Choose another.');
        if (!agree) return openWarn('Please accept the terms to continue.');

        setLoading(true);
        try {
            await authAdapter.signUp({
                username: username.trim(),
                password,
                name: name.trim(),
                surname: surname.trim(),
            });
            // auto-login
            const s = await authAdapter.signInWithPassword(username.trim(), password);
            setSession(s);
            showToast('Account created. Welcome!', 'success');
            nav('/', { replace: true });
        } catch (e: any) {
            const raw = e?.message || '';
            let friendly = 'Could not create account.';
            if (raw.includes('(409)')) friendly = 'Username already exists.';
            else if (raw.includes('(400)')) friendly = 'Invalid input. Check the fields and try again.';
            else if (raw.includes('(500)')) friendly = 'Server error.';
            openWarn(friendly);
            showToast(friendly, 'error');
        } finally {
            setLoading(false);
        }
    };

    const logoSrc = `${import.meta.env.BASE_URL}logo.svg`;
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const bars = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

    // dynamic border helper
    const usernameBorder =
        username.length === 0 ? 'border-border'
            : !usernameValid ? 'border-red-300'
                : avail === 'taken' ? 'border-red-300'
                    : avail === 'ok' ? 'border-green-400'
                        : 'border-border';

    const pwBorder =
        password.length === 0 ? 'border-border'
            : passwordStrong ? 'border-border'
                : 'border-red-300';

    const confirmBorder =
        confirm.length === 0 ? 'border-border'
            : passwordsMatch ? 'border-border'
                : 'border-red-300';

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg relative overflow-hidden">
            {/* decorative blur blobs */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#6366F1]/25 to-[#22D3EE]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-[#A78BFA]/20 to-[#60A5FA]/20 blur-3xl" />

            <div className="w-full max-w-sm">
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary-100/70 to-transparent pointer-events-none" />

                    {/* Logo + heading */}
                    <div className="relative pt-7 pb-2 flex flex-col items-center">
                        <div className="relative grid place-items-center">
                            <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-br from-[#6366F1]/30 to-[#22D3EE]/30" />
                            <img src={logoSrc} alt="Dialife" className="relative h-12 w-12 drop-shadow-sm" />
                        </div>
                        <h1 className="mt-3 text-xl font-semibold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#22D3EE]">
                Create your account
              </span>
                        </h1>
                        <p className="text-sm text-text-muted -mt-0.5">It only takes a minute</p>
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

                    <form onSubmit={onSubmit} className="relative p-6 pt-4 space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="block text-sm">Username</label>
                            <input
                                id="username"
                                className={`w-full rounded-xl border p-2 bg-bg ${usernameBorder}`}
                                value={username}
                                onChange={onUsernameChange}
                                onBlur={() => checkUsername(username)}
                                autoComplete="username"
                                placeholder="e.g. john_doe"
                                aria-invalid={!usernameValid && username.length > 0}
                                aria-describedby="username-help"
                                required
                            />
                            <div className="flex items-center justify-between">
                                <p id="username-help" className="text-xs text-text-muted">
                                    Username must be at least 3–20 characters
                                </p>
                                <p className="text-xs">
                                    {avail === 'checking' && <span className="text-text-muted">Checking…</span>}
                                    {avail === 'ok' && <span className="text-green-600">Available</span>}
                                    {avail === 'taken' && <span className="text-red-600">Taken</span>}
                                    {avail === 'err' && <span className="text-amber-600">Try again</span>}
                                </p>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm">Password</label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPw1 ? 'text' : 'password'}
                                    className={`w-full rounded-xl border p-2 pr-10 bg-bg ${pwBorder}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    aria-invalid={!passwordStrong && password.length > 0}
                                    aria-describedby="password-help"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw1((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-soft"
                                    aria-label={showPw1 ? 'Hide password' : 'Show password'}
                                >
                                    {showPw1 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            <div className="h-1 rounded bg-gray-100 overflow-hidden mt-2">
                                <div className={`h-full ${bars[score]}`} style={{ width: widths[score] }} />
                            </div>
                            <p id="password-help" className="text-xs text-text-muted">
                                At least 8 characters with letters, numbers, and a special character.
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="confirm" className="block text-sm">Confirm password</label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    type={showPw2 ? 'text' : 'password'}
                                    className={`w-full rounded-xl border p-2 pr-10 bg-bg ${confirmBorder}`}
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    aria-invalid={!passwordsMatch && confirm.length > 0}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw2((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-soft"
                                    aria-label={showPw2 ? 'Hide password' : 'Show password'}
                                >
                                    {showPw2 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                            {!passwordsMatch && confirm.length > 0 && (
                                <p className="text-xs text-red-600">Passwords do not match.</p>
                            )}
                        </div>

                        {/* Optional: Name */}
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                                <label htmlFor="name" className="block text-sm">Name (optional)</label>
                                <input
                                    id="name"
                                    className="w-full rounded-xl border border-border bg-bg p-2"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="given-name"
                                    placeholder="e.g. John"
                                />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <label htmlFor="surname" className="block text-sm">Surname (optional)</label>
                                <input
                                    id="surname"
                                    className="w-full rounded-xl border border-border bg-bg p-2"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    autoComplete="family-name"
                                    placeholder="e.g. Doe"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <label className="flex items-center gap-2 text-sm select-none">
                            <input
                                type="checkbox"
                                checked={agree}
                                onChange={(e) => setAgree(e.target.checked)}
                                className="rounded border-border"
                            />
                            I agree to the <a className="underline hover:no-underline" href="#" onClick={(e) => e.preventDefault()}>Terms</a> and <a className="underline hover:no-underline" href="#" onClick={(e) => e.preventDefault()}>Privacy</a>.
                        </label>

                        <Button type="submit" loading={loading} disabled={!canSubmit} className="w-full">
                            Create account
                        </Button>

                        <p className="text-center text-sm text-text-muted">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

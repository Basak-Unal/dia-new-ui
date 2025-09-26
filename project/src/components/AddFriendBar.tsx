import React, { useState } from 'react';
import { buildApiUrl } from '../config';
import { authAdapter } from '../adapters/AuthAdapter';
import { Button } from './ui/Button';
import { UserPlusIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

type Props = {
    onAdded?: (userId: string) => void;
    className?: string;
};

export default function AddFriendBar({ onAdded, className }: Props) {
    const [userId, setUserId] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const session = authAdapter.getSession(); // expects { username, ... }

    async function addFriendApi(target: string) {
        const resp = await fetch(buildApiUrl('/users/friend'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-username': session?.username || '',
            },
            body: JSON.stringify({
                current_username: session?.username,
                target_username: target,
            }),
        });

        if (resp.status === 409) {
            throw Object.assign(new Error('Already following'), { code: 409 });
        }
        if (!resp.ok) {
            const j = await resp.json().catch(() => ({}));
            const m = j?.error || `Request failed (${resp.status})`;
            throw Object.assign(new Error(m), { code: resp.status });
        }
        return resp.json();
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = userId.trim();
        if (!id || !session?.username) {
            setErr(!session?.username ? 'Please sign in first' : 'Enter a user id');
            setTimeout(() => setErr(null), 2000);
            return;
        }
        setLoading(true);
        setMsg(null);
        setErr(null);

        try {
            await addFriendApi(id);
            setMsg(`Following @${id}`);
            setUserId('');
            onAdded?.(id);
            setTimeout(() => setMsg(null), 2000);
        } catch (e: any) {
            if (e?.code === 409) {
                setErr('Already following');
            } else if (e?.code === 404) {
                setErr('User not found');
            } else {
                setErr(e?.message || 'Failed to add');
            }
            setTimeout(() => setErr(null), 2500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={className}>
            <form
                onSubmit={onSubmit}
                className="flex items-center gap-2 rounded-full border border-border bg-bg-soft px-2 py-1 shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <UserPlusIcon className="h-4 w-4 text-text-muted" aria-hidden />
                    <input
                        type="text"
                        placeholder="Add user (e.g., john_doe)"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-40 sm:w-56 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading || userId.trim() === ''}
                    className="h-8 px-3 text-sm rounded-full"
                    title="Add Friend"
                >
                    {loading ? 'Adding…' : 'Add'}
                </Button>
            </form>

            {msg && (
                <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
                    <span>{msg}</span>
                </div>
            )}
            {err && (
                <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden />
                    <span>{err}</span>
                </div>
            )}
        </div>
    );
}

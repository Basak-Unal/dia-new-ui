// components/comments/Comments.tsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {commentsAdapter} from '../adapters/CommentsAdapter';
import {useAuth} from '../contexts/AuthContext';
import {Button} from './ui/Button';

type Props = {
    postId: string;
    initiallyListOpen?: boolean;    // default: true
    comments?: Comment[];           // embedded comments from Post (if provided, no fetch)
};

function AvatarCircle({name}: { name: string }) {
    const initials = useMemo(() => (name?.[0]?.toUpperCase() ?? '?'), [name]);
    return (
        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
            {initials}
        </div>
    );
}

export function Comments({postId, initiallyListOpen = true, comments}: Props) {
    const {session} = useAuth();
    const [items, setItems] = useState<Comment[]>(comments ?? []); // seed from post.Comments if provided
    const [page, setPage] = useState(0);
    const [nextPage, setNextPage] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [text, setText] = useState('');
    const [listOpen, setListOpen] = useState(initiallyListOpen);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // auto-grow textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = '0px';
        ta.style.height = Math.min(144, ta.scrollHeight) + 'px';
    }, [text]);

    // on mount: if comments prop exists (even empty array), don't fetch
    useEffect(() => {
        if (comments !== undefined) return;
        void load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // when list first opens: if no embedded comments and nothing loaded, fetch once
    useEffect(() => {
        if (listOpen && items.length === 0 && comments === undefined) void load(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listOpen]);

    // listen to post-level toggle button
    useEffect(() => {
        const key = `toggle-comments-${postId}`;
        const handler = () => setListOpen(v => !v);
        window.addEventListener(key, handler);
        return () => window.removeEventListener(key, handler);
    }, [postId]);

    async function load(target: number) {
        setLoading(true);
        try {
            // if embedded comments were provided, just use them (no Lambda call)
            if (comments !== undefined && target === 0) {
                setItems(comments);
                setPage(0);
                setNextPage(undefined);
                return;
            }
            const {items: batch, nextPage} = await commentsAdapter.list(postId, target);
            setItems(prev => (target === 0 ? batch : [...prev, ...batch]));
            setPage(target);
            setNextPage(nextPage);
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        setSubmitting(true);
        try {
            const created = await commentsAdapter.create({postId, text: trimmed});
            setItems(prev => [created, ...prev]); // newest on top
            setText('');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mt-3">
            {/* Composer Card (always visible) */}
            <div className="flex justify-end">
                <div className="flex gap-3 w-full max-w-3xl ml-16">
                    <AvatarCircle name={session?.username || 'u'}/>
                    <form onSubmit={onSubmit} className="flex-1 flex items-end gap-2">
            <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                rows={1}
                placeholder="Add a comment…"
                className="flex-1 resize-none px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-bg"
            />
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={!session || !text.trim() || submitting}
                            className="shrink-0"
                        >
                            Comment
                        </Button>
                    </form>
                </div>
            </div>

            {/* List (toggle via the button on the post) */}
            <div
                className={`transition-all duration-200 ${
                    listOpen
                        ? 'max-h-64 opacity-100 mt-3 overflow-y-auto pr-1'   // scrollable, compact
                        : 'max-h-0 opacity-0 overflow-hidden'                 // collapsed
                }`}
                aria-hidden={!listOpen}
            >
                <div className="space-y-2">
                    {loading && items.length === 0 && (
                        <p className="text-sm text-text-muted px-1">Loading comments…</p>
                    )}

                    {items.map(c => (
                        <div key={c.id} className="flex gap-3">
                            <AvatarCircle name={c.author}/>
                            <div className="flex-1 bg-bg-soft border border-border rounded-2xl px-3 py-2">
                                <div className="text-xs text-text-muted mb-0.5">
                                    <span className="font-medium text-text">{c.author}</span> •{' '}
                                    {new Date(c.ts).toLocaleString()}
                                </div>
                                <div className="text-sm text-text whitespace-pre-wrap">{c.text}</div>
                            </div>
                        </div>
                    ))}

                    {nextPage !== undefined && (
                        <div className="pt-1">
                            <Button
                                variant="outline"
                                onClick={() => load(nextPage!)}
                                loading={loading}
                                disabled={loading}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// adapters/CommentsAdapter.ts
import {buildApiUrl} from '../config';
import {authAdapter} from './AuthAdapter';

export class CommentsAdapter {
    async list(postId: string, page = 0): Promise<{ items: Comment[]; nextPage?: number }> {
        const url = new URL(buildApiUrl('/comments'), window.location.origin);
        url.searchParams.set('post_id', postId);
        url.searchParams.set('page', String(page));

        const r = await fetch(url.toString());
        if (!r.ok) throw new Error(`Comments list failed: ${r.status}`);
        const data = await r.json();
        return {
            items: Array.isArray(data?.items) ? data.items : [],
            nextPage: typeof data?.nextPage === 'number' ? data.nextPage : undefined,
        };
    }

    async create(opts: { postId: string; text: string }): Promise<Comment> {
        const session = authAdapter.getSession();
        if (!session?.username) throw new Error('Not authenticated');

        const sep = opts.postId.lastIndexOf('#');
        if (sep < 0) throw new Error('Invalid postId format');
        const userWithPrivacy = opts.postId.slice(0, sep);
        const postTimestamp = Number(opts.postId.slice(sep + 1));

        const commentTs = Date.now();

        // EXACT body you asked for (numbers for timestamps are generally safer)
        const body = {
            UserID: userWithPrivacy,                 // "<username>#<privacy>"
            Timestamp: postTimestamp,                // post's timestamp
            CommentUserID: session.username,         // current user
            CommentTimeStamp: commentTs,             // now
            CommentTxt: opts.text.trim(),            // content
        };

        const r = await fetch(buildApiUrl('/post/add-comment'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        });

        // Some backends return nothing on success; synthesize a client-side Comment
        if (!r.ok) {
            let msg = `Comments create failed: ${r.status}`;
            try {
                const err = await r.json();
                if (err?.error) msg = err.error;
            } catch {
            }
            throw new Error(msg);
        }

        let created: Comment | null = null;
        created = {
            id: `${opts.postId}#${commentTs}#${session.username}`,
            postId: opts.postId,
            author: session.username,
            ts: commentTs,
            text: opts.text.trim(),
        };
        return created;
    }
}

export const commentsAdapter = new CommentsAdapter();

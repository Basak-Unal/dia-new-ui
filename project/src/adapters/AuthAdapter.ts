import { buildApiUrl } from '../config';
import type { Session } from '../types';

export class AuthAdapter {
    private session: Session | null = null;

    async signInWithPassword(username: string, password: string): Promise<Session> {
        const res = await fetch(buildApiUrl('auth'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Login failed (${res.status}): ${text}`);
        }

        // Backend returns: { userId, username, displayName, avatar, followingList, closeList }
        const raw = await res.json();

        // 🔒 normalize so the rest of the app can trust arrays
        const session: Session = {
            userId: String(raw.userId),
            username: String(raw.username),
            displayName: String(raw.displayName ?? raw.username),
            avatar: raw.avatar ?? null,
            followingList: Array.isArray(raw.followingList) ? raw.followingList.map(String) : [],
            closeList: Array.isArray(raw.closeList) ? raw.closeList.map(String) : [],
        };


        this.session = session;
        return session;
    }

    // ... keep the rest as-is
    async signUp(input: { username: string; password: string; name?: string; surname?: string; profile_pic?: string }) {
        const payload = {
            username: input.username,
            password: input.password,
            name: input.name || '',
            surname: input.surname || '',
            profile_pic: input.profile_pic || '',
            bio: '',
            followers: [],
            following: [],
            events_applied: [],
        };

        const url = buildApiUrl('users');
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Sign up failed (${res.status}): ${text}`);
        }
        return true;
    }

    async requestPasswordReset(username: string): Promise<{ devToken?: string }> {
        const res = await fetch(buildApiUrl('auth/forgot'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Forgot failed (${res.status}): ${text}`);
        }
        const json = await res.json().catch(() => ({}));
        return { devToken: (json && (json.devToken || json.token)) || undefined };
    }

    async resetPassword(token: string, newPassword: string): Promise<true> {
        const res = await fetch(buildApiUrl('auth/reset'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Reset failed (${res.status}): ${text}`);
        }
        return true;
    }

    getSession(): Session | null {
        return this.session;
    }

    signOut(): void {
        this.session = null;
    }
}

export const authAdapter = new AuthAdapter();

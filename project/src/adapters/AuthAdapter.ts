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
        const session: Session = await res.json();
        this.session = session;
        return session;
    }

    async signUp(input: { username: string; password: string; name?: string; surname?: string; profile_pic?: string }) {
        const payload = {
            username: input.username,
            password: input.password, // TEST ONLY (plain), matches your backend
            name: input.name || '',
            surname: input.surname || '',
            profile_pic: input.profile_pic || '',
            bio: '',
            followers: [],
            following: [],
        };

        const url = buildApiUrl('users');
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            // include status in the Error message so the page can parse (409/400/500)
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
        // In real prod, API usually returns { ok: true }
        // In dev, your backend can return { ok: true, devToken: "..." } so you can test without email
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

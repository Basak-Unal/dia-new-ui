import { buildApiUrl } from '../config';
import type { Session } from '../types';

const STORAGE_KEY = 'dialife.session.v1';

export class AuthAdapter {
    private session: Session | null = null;

    constructor() {
        // Hydrate from storage on page load
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // normalize once more to be safe
                this.session = {
                    userId: String(parsed.userId),
                    username: String(parsed.username),
                    displayName: String(parsed.displayName ?? parsed.username),
                    avatar: parsed.avatar ?? null,
                    followingList: Array.isArray(parsed.followingList) ? parsed.followingList.map(String) : [],
                    closeList: Array.isArray(parsed.closeList) ? parsed.closeList.map(String) : [],
                };
            }
        } catch { /* ignore corrupt storage */ }

        // Keep multiple tabs in sync
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                if (e.newValue) {
                    try {
                        const parsed = JSON.parse(e.newValue);
                        this.session = {
                            userId: String(parsed.userId),
                            username: String(parsed.username),
                            displayName: String(parsed.displayName ?? parsed.username),
                            avatar: parsed.avatar ?? null,
                            followingList: Array.isArray(parsed.followingList) ? parsed.followingList.map(String) : [],
                            closeList: Array.isArray(parsed.closeList) ? parsed.closeList.map(String) : [],
                        };
                    } catch {
                        this.session = null;
                    }
                } else {
                    this.session = null;
                }
            }
        });
    }

    private persist(session: Session | null) {
        this.session = session;
        if (session) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            } catch { /* quota/full private mode */ }
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    async signInWithPassword(username: string, password: string): Promise<Session> {
        const res = await fetch(buildApiUrl('auth'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include', // harmless if you later switch to cookies
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Login failed (${res.status}): ${text}`);
        }

        // Backend returns: { userId, username, displayName, avatar, followingList, closeList }
        const raw = await res.json();

        const session: Session = {
            userId: String(raw.userId),
            username: String(raw.username),
            displayName: String(raw.displayName ?? raw.username),
            avatar: raw.avatar ?? null,
            followingList: Array.isArray(raw.followingList) ? raw.followingList.map(String) : [],
            closeList: Array.isArray(raw.closeList) ? raw.closeList.map(String) : [],
        };

        this.persist(session);
        return session;
    }

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
        this.persist(null);
    }
}

export const authAdapter = new AuthAdapter();

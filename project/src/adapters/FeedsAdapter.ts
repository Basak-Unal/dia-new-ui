import { buildApiUrl } from '../config';
import type { FeedsResponse, PairFeedsResponse, Post, Session } from '../types';
import { authAdapter } from './AuthAdapter.ts';

export class FeedsAdapter {
  /**
   * Fetch exactly one list: 'following' (authors I follow) or 'close' (authors who added me).
   * NOTE: Uses GET /friend-list with query params (username, list_type).
   */
  // FeedsAdapter.ts
  async fetchFriendList(kind: 'following' | 'close'): Promise<string[]> {
    const session = authAdapter.getSession();
    const username = session?.username;
    if (!username) return [];

    const list_type = kind === 'following' ? 0 : 1;

    const resp = await fetch(buildApiUrl('/friend-list'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // If your API uses cookies / auth headers, you might also need:
      // credentials: 'include',
      body: JSON.stringify({ username, list_type }),
    });

    // Show backend error so the UI isn't silent
    if (!resp.ok) {
      let message = `API Error: ${resp.status}`;
      try {
        const err = await resp.json();
        if (err?.error) message = err.error;        // e.g. "username and valid list_type (0 or 1) required"
      } catch {}
      throw new Error(message);
    }

    const data = await resp.json().catch(() => ({} as any));
    return Array.isArray(data?.user_list) ? data.user_list : [];
  }


  /**
   * FRIENDS feed (privacy=1) — ALWAYS calls /feeds.
   * friendsIds must be provided by the caller (we will NOT call any other endpoint here).
   */
  async getFriendsFeed(params: {
    friendsIds: string[];         // REQUIRED: list of usernames
    friendsPage?: number;         // OPTIONAL paging (maps to followers_page)
  }): Promise<PairFeedsResponse> {
    if (!params.friendsIds?.length) return { feeds: [[], []] };

    const url = new URL(buildApiUrl('/feeds'), window.location.origin);
    url.searchParams.set('mask', '2'); // friends bucket
    url.searchParams.set('following_ids', params.friendsIds.join(','));
    if (params.friendsPage != null) url.searchParams.set('followers_page', String(params.friendsPage));

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`API Error: ${r.status}`);
    const data = await r.json();

    // /feeds convention: [public, friends, close, private]
    return {
      feeds: [
        (data.feeds?.[1] ?? []).map((it: any) => this.mapFeedItem(it, 1)), // friends bucket
        [],                                                             // placeholder to satisfy PairFeedsResponse
      ],
    };
  }

  /**
   * CLOSE FRIENDS feed (privacy=2) — ALWAYS calls /feeds.
   * closeIds must be provided by the caller.
   */
  async getCloseFeed(params: {
    closeIds: string[];           // REQUIRED: list of usernames
    closePage?: number;           // OPTIONAL paging (maps to close_page)
  }): Promise<PairFeedsResponse> {
    if (!params.closeIds?.length) return { feeds: [[], []] };

    const url = new URL(buildApiUrl('/feeds'), window.location.origin);
    url.searchParams.set('mask', '4'); // close bucket
    url.searchParams.set('close_ids', params.closeIds.join(','));
    if (params.closePage != null) url.searchParams.set('close_page', String(params.closePage));

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`API Error: ${r.status}`);
    const data = await r.json();

    // /feeds convention: [public, friends, close, private]
    return {
      feeds: [
        [],                                                             // placeholder
        (data.feeds?.[2] ?? []).map((it: any) => this.mapFeedItem(it, 2)), // close bucket
      ],
    };
  }

  /**
   * Generic /feeds accessor you can still use for public/private.
   */
  async getFeeds(params: {
    mask: number;
    userId?: string;
    followingIds?: string;
    closeIds?: string;
    publicPage?: number;
    followersPage?: number;
    closePage?: number;
    privateAfter?: number;
  }): Promise<FeedsResponse> {
    const url = new URL(buildApiUrl('/feeds'), window.location.origin);
    url.searchParams.set('mask', String(params.mask));
    if (params.userId) url.searchParams.set('user_id', params.userId);
    if (params.followingIds) url.searchParams.set('following_ids', params.followingIds);
    if (params.closeIds) url.searchParams.set('close_ids', params.closeIds);
    if (params.publicPage != null) url.searchParams.set('public_page', String(params.publicPage));
    if (params.followersPage != null) url.searchParams.set('followers_page', String(params.followersPage));
    if (params.closePage != null) url.searchParams.set('close_page', String(params.closePage));
    if (params.privateAfter != null) url.searchParams.set('private_after', String(params.privateAfter));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return {
      feeds: (data.feeds ?? []).map((feed: any[]) => (feed ?? []).map(item => this.mapFeedItem(item))),
      next_private_after: data.next_private_after,
    };
  }

  private mapFeedItem(item: any, privacy?: number): Post {
    const uid = String(item.UserID ?? '');
    const [user] = uid.split('#');
    const ts = Number(item.Timestamp ?? 0);
    const postId = `${uid}#${ts}`;

    // NEW: accept Comments/comments, normalize fields to your Comment interface
    const rawComments = Array.isArray(item.Comments)
        ? item.Comments
        : Array.isArray(item.comments)
            ? item.comments
            : [];

    const Comments = rawComments.map((c: any) => {
      const author = String(c.UserID ?? c.userId ?? c.user ?? c.author ?? '');
      const cts = Number(c.Timestamp ?? c.ts ?? c.time ?? 0);
      const text = String(
          c.Context ?? c.context ?? c.Txt ?? c.text ?? c.body ?? c.message ?? ''
      );
      const id = String(c.id ?? `${postId}#${cts || Date.now()}#${author || 'anon'}`);
      return { id, postId, author, ts: cts, text };
    });

    // Return in your app’s existing shape (unchanged keys), just add Comments
    return {
      id: postId,                     // (already used by your UI keys)
      user,                           // existing lowercase field your UI uses
      privacy: (item.Privacy != null)? item.Privacy : (privacy != null)? privacy : 3,
      ts,
      txt: item.Txt,
      tags: item.Tags,
      links: item.Links,
      History: item.History,

      // Also keep original backend-style fields if other parts rely on them
      UserID: uid,
      Privacy: item.Privacy,
      Timestamp: ts,
      Txt: item.Txt,

      // NEW field carrying normalized comments
      Comments,
    } as Post;
  }
}

export const feedsAdapter = new FeedsAdapter();

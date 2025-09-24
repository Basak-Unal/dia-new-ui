import { buildApiUrl } from '../config';
import type { FeedsResponse, PairFeedsResponse, Post } from '../types';

export class FeedsAdapter {
  /**
   * FRIENDS feed (privacy=1) — ALWAYS calls /feeds.
   * friendsIds must be provided by the caller (we will NOT call any other endpoint).
   */
  async getFriendsFeed(params: {
    friendsIds: string[];         // REQUIRED: list of usernames
    friendsPage?: number;         // OPTIONAL paging (maps to followers_page)
  }): Promise<PairFeedsResponse> {
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
        (data.feeds?.[1] ?? []).map((it: any) => this.mapFeedItem(it)), // friends bucket
        [],                                                             // placeholder second array to fit PairFeedsResponse
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
        [],                                                             // placeholder first array
        (data.feeds?.[2] ?? []).map((it: any) => this.mapFeedItem(it)), // close bucket
      ],
    };
  }

  /**
   * BOTH (friends + close) in one /feeds call.
   * Requires both lists to be provided by the caller.
   */
  async getBothFeeds(params: {
    friendsIds: string[];
    closeIds: string[];
    friendsPage?: number;
    closePage?: number;
  }): Promise<PairFeedsResponse> {
    const url = new URL(buildApiUrl('/feeds'), window.location.origin);
    url.searchParams.set('mask', '6'); // 2|4
    url.searchParams.set('following_ids', params.friendsIds.join(','));
    url.searchParams.set('close_ids', params.closeIds.join(','));
    if (params.friendsPage != null) url.searchParams.set('followers_page', String(params.friendsPage));
    if (params.closePage != null) url.searchParams.set('close_page', String(params.closePage));

    const r = await fetch(url.toString());
    if (!r.ok) throw new Error(`API Error: ${r.status}`);
    const data = await r.json();

    return {
      feeds: [
        (data.feeds?.[1] ?? []).map((it: any) => this.mapFeedItem(it)), // friends
        (data.feeds?.[2] ?? []).map((it: any) => this.mapFeedItem(it)), // close
      ],
    };
  }

  // You can still keep this generic method for public/private usage elsewhere
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
      feeds: data.feeds.map((feed: any[]) => feed.map(item => this.mapFeedItem(item))),
      next_private_after: data.next_private_after,
    };
  }

  private mapFeedItem(item: any): Post {
    const [user] = String(item.UserID || '').split('#');
    return {
      id: `${item.UserID}#${item.Timestamp}`,
      user,
      privacy: item.Privacy,
      ts: item.Timestamp,
      txt: item.Txt,
      tags: item.Tags,
      links: item.Links,
    };
  }
}

export const feedsAdapter = new FeedsAdapter();

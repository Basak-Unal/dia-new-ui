// Core domain types
export interface Post {
  UserID: string;
  user: string;
<<<<<<< HEAD
  Privacy: 0 | 1 | 2 | 3;
  Timestamp: number;
  Tx: string;
=======
  privacy: 0 | 1 | 2 | 3; // 0=Public, 1=Followers, 2=Close, 3=Private
  ts: number;
  txt: string;
>>>>>>> chatbot
  tags?: string[];
  links?: string[];
}

export type Session = {
  userId: string;       // e.g. "user#john_doe"
  username: string;     // e.g. "john_doe"
  displayName: string;  // e.g. "John Doe"
  avatar?: string | null;
  followingList: string[];
  closeList: string[];
};


export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface ActivityItem {
  id: string;
  kind: 'like' | 'comment' | 'follow' | 'mention' | 'repost' | 'system';
  actor: string;
  ts: number;
  ref?: {
    postId?: string;
    user?: string;
  };
  text?: string;
  read?: boolean;
}

export interface MeetItem {
  id: string;
  host: string;
  title: string;
  when: number;
  where: string;
  desc?: string;
  privacy?: 0 | 1 | 2 | 3;
  going: number;
  attendees?: string[];
  max?: number;
}

export interface FeedsResponse {
  feeds: [Post[], Post[], Post[], Post[]]; // [public, following, close, private]
  next_private_after?: number;
}

export type FeedVariant = 'public' | 'following' | 'close' | 'private';
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'tr';
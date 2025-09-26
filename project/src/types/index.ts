// src/types.ts
export interface Post {
  UserID: string;
  user: string;
  Privacy: 0 | 1 | 2 | 3;
  Timestamp: number;
  Txt: string;
  tags?: string[];
  links?: string[];
}

export type Session = {
  userId: string;
  username: string;
  displayName: string;
  avatar?: string | null;

  followingList: string[]; // friends
  closeList: string[];     // close friends
};

export interface FeedsResponse {
  feeds: [Post[], Post[], Post[], Post[]]; // [public, friends, close, private]
  next_private_after?: number;
}

// If you don't already have this type, add it:
export type PairFeedsResponse = { feeds: [Post[], Post[]] };

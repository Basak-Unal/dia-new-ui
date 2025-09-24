import React from 'react';
import { FeedView } from '../components/FeedView';

export function FollowingPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Following</h2>
        <p className="text-text-muted">Posts from people you follow</p>
      </div>
      <FeedView variant="following" />
    </div>
  );
}
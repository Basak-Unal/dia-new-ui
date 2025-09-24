import React from 'react';
import { FeedView } from '../components/FeedView';

export function HomePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Public Feed</h2>
        <p className="text-text-muted">Discover what everyone is sharing</p>
      </div>
      <FeedView variant="public" />
    </div>
  );
}
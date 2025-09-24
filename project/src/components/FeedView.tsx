// src/components/FeedView.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PostCard } from './PostCard';
import { Loading } from './ui/Loading';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { Button } from './ui/Button';
import { feedsAdapter } from '../adapters/FeedsAdapter';
import type { Post } from '../types';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export function FeedView() {
  const { session } = useAuth(); // Session | null

  // Friends IDs from session (stable)
  const friendsIds = useMemo(() => session?.followingList ?? [], [session?.followingList]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Prevent duplicate initial loads in React Strict Mode
  const lastRunKeyRef = useRef<string | null>(null);

  const loadFeed = useCallback(
      async (append = false, pageNum = 0) => {
        try {
          setLoading(true);
          setError(null);

          // If no friends, show empty state without calling the API
          if (!friendsIds.length) {
            setPosts(append ? posts : []);
            setHasMore(false);
            return;
          }

          const res = await feedsAdapter.getFriendsFeedFromSession(session!, pageNum);
          // PairFeedsResponse: [friends, placeholder]
          const feedData = res.feeds[0];

          setPosts(prev => (append ? [...prev, ...feedData] : feedData));
          setHasMore(feedData.length === 10); // adjust if your backend page size differs
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load feed');
        } finally {
          setLoading(false);
        }
      },
      [session, friendsIds, posts]
  );

  // Initial load or when friends list changes
  useEffect(() => {
    const key = `friends|${friendsIds.join(',')}`;
    if (lastRunKeyRef.current === key) return; // avoid Strict Mode double-run
    lastRunKeyRef.current = key;

    setPage(0);
    setPosts([]);
    setHasMore(true);
    loadFeed(false, 0);
  }, [friendsIds, loadFeed]);

  if (loading && posts.length === 0) {
    return <Loading text="Loading feed..." />;
  }

  if (error) {
    return (
        <ErrorState
            title="Failed to load feed"
            message={error}
            onRetry={() => loadFeed(false, page)}
        />
    );
  }

  if (posts.length === 0) {
    return (
        <EmptyState
            icon={<DocumentTextIcon />}
            title="No posts yet"
            description={
              friendsIds.length === 0
                  ? 'You have no friends set yet.'
                  : 'No friends posts to show right now.'
            }
            action={{ label: 'Refresh', onClick: () => loadFeed(false, 0) }}
        />
    );
  }

  return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <Button
              variant="outline"
              onClick={() => loadFeed(false, 0)}
              disabled={loading}
              loading={loading}
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {posts.map(post => (
              <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="flex items-center justify-center pt-4">
          <Button
              variant="outline"
              onClick={() => {
                const next = page + 1;
                setPage(next);
                loadFeed(true, next);
              }}
              disabled={!hasMore || loading}
              loading={loading}
          >
            Load more
          </Button>
        </div>
      </div>
  );
}

export default FeedView;

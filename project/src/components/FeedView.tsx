// src/components/FeedView.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PostCard } from './PostCard';
import { Loading } from './ui/Loading';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { Button } from './ui/Button';
import { feedsAdapter } from '../adapters/FeedsAdapter';
import { config } from '../config';
import type { Post, FeedVariant } from '../types';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface FeedViewProps {
  variant: FeedVariant;
}

export function FeedView({ variant }: FeedViewProps) {
  // Use session (must carry lists if you want friends/close to populate)
  const { session } = useAuth(); // Session | null
  const username = session?.username;

  // If you store lists on session, expose them like this:
  // e.g., in your AuthContext after login/profile fetch:
  // session.followingList: string[]
  // session.closeList: string[]
  const friendsIds = useMemo<string[]>(
      () => session?.followingList ?? [],
      [session?.followingList]
  );
  const closeIds = useMemo<string[]>(
      () => session?.closeList ?? [],
      [session?.closeList]
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicPage, setPublicPage] = useState(0);
  const [privateAfter, setPrivateAfter] = useState<number | null>(null);
  const [nextPrivateAfter, setNextPrivateAfter] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (append = false) => {
    try {
      setLoading(true);
      setError(null);

      let feedData: Post[] = [];
      let newNextPrivateAfter: number | null = null;

      if (variant === 'public') {
        const res = await feedsAdapter.getFeeds({ mask: 1, publicPage });
        feedData = res.feeds[0];
        setHasMore(feedData.length === 10);
      } else if (variant === 'following') {
        if (!username) throw new Error('Not logged in');

        // ALWAYS call /feeds; provide client-known list (required by your rule)
        const res = await feedsAdapter.getFriendsFeed({
          friendsIds,
          friendsPage: 0, // add paging state if you later support it
        });
        feedData = res.feeds[0];
        setHasMore(feedData.length === 10);
      } else if (variant === 'close') {
        if (!username) throw new Error('Not logged in');

        // ALWAYS call /feeds; provide client-known list (required by your rule)
        const res = await feedsAdapter.getCloseFeed({
          closeIds,
          closePage: 0, // add paging state if you later support it
        });
        feedData = res.feeds[1];
        setHasMore(feedData.length === 10);
      } else if (variant === 'private') {
        const res = await feedsAdapter.getFeeds({
          mask: 8,
          userId: config.CURRENT_USER_ID, // or session?.userId if you prefer
          privateAfter: privateAfter ?? undefined,
        });
        feedData = res.feeds[3];
        newNextPrivateAfter = res.next_private_after || null;
        setNextPrivateAfter(newNextPrivateAfter);
        setHasMore(!!newNextPrivateAfter);
      }

      setPosts(prev => (append ? [...prev, ...feedData] : feedData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
    // include lists in deps (stringify to avoid ref churn)
  }, [variant, publicPage, privateAfter, username, JSON.stringify(friendsIds), JSON.stringify(closeIds)]);

  useEffect(() => {
    setPublicPage(0);
    setPrivateAfter(null);
    setNextPrivateAfter(null);
    setPosts([]);
    loadFeed(false);
  }, [variant, username, loadFeed]);

  if (loading && posts.length === 0) {
    return <Loading text="Loading feed..." />;
  }

  if (error) {
    return (
        <ErrorState
            title="Failed to load feed"
            message={error}
            onRetry={() => loadFeed(false)}
        />
    );
  }

  // Tailored empty messages for friends/close if lists are missing
  const emptyDescription =
      variant === 'following' && friendsIds.length === 0
          ? 'You have no friends set yet.'
          : variant === 'close' && closeIds.length === 0
              ? 'You have no close friends set yet.'
              : `No ${variant} posts to show right now.`;

  if (posts.length === 0) {
    return (
        <EmptyState
            icon={<DocumentTextIcon />}
            title="No posts yet"
            description={emptyDescription}
            action={{ label: 'Refresh', onClick: () => loadFeed(false) }}
        />
    );
  }

  return (
      <div className="space-y-4">
        <div className="space-y-4">
          {posts.map(post => (
              <PostCard key={post.id} post={post} />
          ))}
        </div>

        {variant === 'public' && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                  variant="outline"
                  onClick={() => setPublicPage(p => Math.max(0, p - 1))}
                  disabled={publicPage === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-text-muted">Page {publicPage + 1}</span>
              <Button
                  variant="outline"
                  onClick={() => setPublicPage(p => p + 1)}
                  disabled={!hasMore || loading}
                  loading={loading}
              >
                Next
              </Button>
            </div>
        )}

        {variant === 'private' && hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                  variant="outline"
                  onClick={() => {
                    if (nextPrivateAfter != null) {
                      setPrivateAfter(nextPrivateAfter);
                      loadFeed(true);
                    }
                  }}
                  disabled={loading}
                  loading={loading}
              >
                Load Older Posts
              </Button>
            </div>
        )}
      </div>
  );
}

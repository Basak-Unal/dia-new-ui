import { useState, useEffect, useCallback } from 'react';
import { PostCard } from './PostCard';
import { Loading } from './ui/Loading';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { Button } from './ui/Button';
import { feedsAdapter } from '../adapters/FeedsAdapter';
import type { Post, FeedVariant } from '../types';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface FeedViewProps {
  variant: FeedVariant; // 'public' | 'following' | 'close' | 'private'
}

export function FeedView({ variant }: FeedViewProps) {
    const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // fallback for very old UAs
      window.scrollTo(0, 0);
    }
  };
  
  const { session } = useAuth();
  const username = session?.username;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // paging states
  const [publicPage, setPublicPage] = useState(0);
  const [friendsPage, setFriendsPage] = useState(0);
  const [closePage, setClosePage] = useState(0);

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
        const res = await feedsAdapter.getFeeds({ mask: 1, publicPage: publicPage });
        feedData = res.feeds[0] ?? [];
        // heuristic: server page size assumed 10; adjust if yours differs
        setHasMore(feedData.length === 10);
      } else if (variant === 'following') {
        if (!username) throw new Error('Not logged in');
        const list = await feedsAdapter.fetchFriendList('following');
        const res = await feedsAdapter.getFriendsFeed({
          friendsIds: list,
          friendsPage,
        });
        feedData = res.feeds[0] ?? [];
        setHasMore(feedData.length === 10);
      } else if (variant === 'close') {
        if (!username) throw new Error('Not logged in');
        const list2 = await feedsAdapter.fetchFriendList('close');
        const res = await feedsAdapter.getCloseFeed({
          closeIds: list2,
          closePage,
        });
        feedData = res.feeds[1] ?? [];
        setHasMore(feedData.length === 10);
      } else if (variant === 'private') {
        if (!username) throw new Error('Not logged in');
        const res = await feedsAdapter.getFeeds({
          mask: 8,
          userId: username,
          privateAfter: privateAfter ?? undefined,
        });
        feedData = res.feeds[3] ?? [];
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
  }, [variant, publicPage, friendsPage, closePage, privateAfter, username]);

  useEffect(() => {
    setPublicPage(0);
    setFriendsPage(0);
    setClosePage(0);
    setPrivateAfter(null);
    setNextPrivateAfter(null);
    setPosts([]);
  }, [variant, username]);
  // 2) Load whenever the inputs change (including page changes)
  useEffect(() => {
    loadFeed(false);
  }, [variant, publicPage, friendsPage, closePage, privateAfter, loadFeed]);

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

  const emptyDescription = `No ${variant} posts to show right now.`;

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

        {/* Public pagination */}
        {variant === 'public' && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                  variant="outline"
                  onClick={() => {scrollToTop(); setPublicPage(p => Math.max(0, p - 1))}}
                  disabled={publicPage === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-text-muted">Page {publicPage + 1}</span>
              <Button
                  variant="outline"
                  onClick={() => {scrollToTop(); setPublicPage(p => p + 1)}}
                  disabled={publicPage === 2 || loading}
                  loading={loading}
              >
                Next
              </Button>
            </div>
        )}

        {/* Friends pagination */}
        {variant === 'following' && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                  variant="outline"
                  onClick={() => {scrollToTop(); setFriendsPage(p => Math.max(0, p - 1))}}
                  disabled={friendsPage === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-text-muted">Page {friendsPage + 1}</span>
              <Button
                  variant="outline"
                  onClick={() => {scrollToTop(); setFriendsPage(p => p + 1)}}
                  disabled={!hasMore || loading}
                  loading={loading}
              >
                Next
              </Button>
            </div>
        )}

        {/* Close pagination */}
        {variant === 'close' && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button
                  variant="outline"
                  onClick={() => {scrollToTop(); setClosePage(p => Math.max(0, p - 1))}}
                  disabled={closePage === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-text-muted">Page {closePage + 1}</span>
              <Button
                  variant="outline"
                  onClick={() => {scrollToTop(); setClosePage(p => p + 1)}}
                  disabled={!hasMore || loading}
                  loading={loading}
              >
                Next
              </Button>
            </div>
        )}

        {/* Private infinite-ish */}
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

import { useState, useEffect } from 'react';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { activitiesAdapter } from '../adapters';
import { formatDate, PRIVACY_LABELS } from '../utils/privacy';
import { useApp } from '../contexts/AppContext';
import type { ActivityItem } from '../types';
import { 
  BellIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  UserPlusIcon,
  AtSymbolIcon,
  ArrowPathRoundedSquareIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

const ACTIVITY_ICONS = {
  like: HeartIcon,
  comment: ChatBubbleLeftIcon,
  follow: UserPlusIcon,
  mention: AtSymbolIcon,
  repost: ArrowPathRoundedSquareIcon,
  system: ExclamationCircleIcon,
};

const ACTIVITY_COLORS = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  follow: 'text-green-500',
  mention: 'text-purple-500',
  repost: 'text-yellow-500',
  system: 'text-gray-500',
};

type FilterType = 'all' | 'you' | 'following';

export function ActivitiesPage() {
  const { language, showToast } = useApp();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadActivities = async (pageNum = 0, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activitiesAdapter.getActivities(pageNum);
      
      if (reset) {
        setActivities(response.items);
      } else {
        setActivities(prev => [...prev, ...response.items]);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(0, true);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await activitiesAdapter.markAllAsRead();
      setActivities(prev => prev.map(activity => ({ ...activity, read: true })));
      showToast('All activities marked as read', 'success');
    } catch (error) {
      showToast('Failed to mark activities as read', 'error');
      throw(error); //yain
    }
  };

  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case 'you':
        return activity.ref?.user === 'currentuser' || activity.kind === 'follow';
      case 'following':
        // In a real app, this would check if the actor is in the following list
        return ['alice', 'bob', 'charlie'].includes(activity.actor);
      default:
        return true;
    }
  });

  const unreadCount = activities.filter(a => !a.read).length;

  if (loading && activities.length === 0) {
    return <Loading text="Loading activities..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load activities"
        message={error}
        onRetry={() => loadActivities(0, true)}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text mb-2">Activities</h2>
            <p className="text-text-muted">
              Stay updated with what's happening around you
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} new
                </span>
              )}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex space-x-1">
          {(['all', 'you', 'following'] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={clsx(
                'px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                filter === filterType
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-text-muted hover:text-text hover:bg-bg-soft'
              )}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={<BellIcon />}
          title="No activities yet"
          description="Activities will appear here when people interact with your posts."
        />
      ) : (
        <>
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const IconComponent = ACTIVITY_ICONS[activity.kind];
              return (
                <div
                  key={activity.id}
                  className={clsx(
                    'flex items-start space-x-3 p-4 bg-card rounded-2xl border',
                    activity.read ? 'border-border' : 'border-primary-200 bg-primary-50'
                  )}
                >
                  <div className={clsx(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    activity.read ? 'bg-bg-soft' : 'bg-primary-100'
                  )}>
                    <IconComponent className={clsx('w-4 h-4', ACTIVITY_COLORS[activity.kind])} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-text">{activity.actor}</span>
                      <span className="text-text-muted">
                        {activity.kind === 'like' && 'liked your post'}
                        {activity.kind === 'comment' && 'commented on your post'}
                        {activity.kind === 'follow' && 'started following you'}
                        {activity.kind === 'mention' && 'mentioned you'}
                        {activity.kind === 'repost' && 'reposted your post'}
                        {activity.kind === 'system' && 'system notification'}
                      </span>
                      {!activity.read && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full" />
                      )}
                    </div>
                    
                    {activity.text && (
                      <p className="text-text-muted text-sm mb-2">{activity.text}</p>
                    )}
                    
                    <time className="text-xs text-text-muted">
                      {formatDate(activity.ts, language)}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"z
                onClick={() => loadActivities(page + 1)}
                disabled={loading}
                loading={loading}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
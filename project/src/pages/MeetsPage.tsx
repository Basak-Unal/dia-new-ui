import React, { useState, useEffect } from 'react';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { meetsAdapter } from '../adapters';
import { formatDate, PRIVACY_LABELS } from '../utils/privacy';
import { useApp } from '../contexts/AppContext';
import type { MeetItem } from '../types';
import { 
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

type FilterType = 'upcoming' | 'past' | 'mine' | 'all';

export function MeetsPage() {
  const { language, showToast } = useApp();
  const [meets, setMeets] = useState<MeetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadMeets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meetsAdapter.getMeets(filter);
      setMeets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeets();
  }, [filter]);

  const handleRSVP = async (meetId: string, currentlyGoing: boolean) => {
    try {
      if (currentlyGoing) {
        await meetsAdapter.unrsvp(meetId);
        showToast('RSVP cancelled', 'info');
      } else {
        await meetsAdapter.rsvp(meetId);
        showToast('RSVP confirmed!', 'success');
      }
      // Update local state optimistically
      setMeets(prev => prev.map(meet => {
        if (meet.id === meetId) {
          return {
            ...meet,
            going: currentlyGoing ? meet.going - 1 : meet.going + 1
          };
        }
        return meet;
      }));
    } catch (error) {
      showToast('Failed to update RSVP', 'error');
    }
  };

  if (loading) {
    return <Loading text="Loading meetups..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load meetups"
        message={error}
        onRetry={loadMeets}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text mb-2">Meetups</h2>
            <p className="text-text-muted">Discover and join local events</p>
          </div>
          
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Meet</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex space-x-1 mb-6">
          {(['upcoming', 'past', 'mine', 'all'] as FilterType[]).map((filterType) => (
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

        {/* Create Form */}
        {showCreateForm && (
          <CreateMeetForm
            onSuccess={() => {
              setShowCreateForm(false);
              loadMeets();
              showToast('Meetup created!', 'success');
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>

      {meets.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon />}
          title="No meetups found"
          description={`No ${filter} meetups to show right now.`}
          action={{
            label: 'Create Meetup',
            onClick: () => setShowCreateForm(true)
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meets.map((meet) => {
            const hasRSVP = meetsAdapter.hasRSVP(meet.id);
            const isUpcoming = meet.when > Date.now();
            const isFull = meet.max && meet.going >= meet.max;
            
            return (
              <div
                key={meet.id}
                className="bg-card rounded-2xl shadow-sm border border-border p-6 hover:shadow-md transition-shadow duration-150"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-text text-lg">{meet.title}</h3>
                    {meet.privacy !== undefined && (
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                        {PRIVACY_LABELS[meet.privacy]}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-text-muted text-sm mb-2">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    <span>Hosted by {meet.host}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-text-muted text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{new Date(meet.when).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</span>
                  </div>
                  
                  <div className="flex items-start text-text-muted text-sm">
                    <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{meet.where}</span>
                  </div>
                  
                  {meet.desc && (
                    <p className="text-text text-sm leading-relaxed">{meet.desc}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-text-muted text-sm">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    <span>
                      {meet.going} going
                      {meet.max && ` / ${meet.max}`}
                    </span>
                  </div>
                  
                  {isUpcoming && (
                    <Button
                      size="sm"
                      variant={hasRSVP ? 'outline' : 'primary'}
                      onClick={() => handleRSVP(meet.id, hasRSVP)}
                      disabled={!hasRSVP && isFull}
                      className={clsx(
                        'flex items-center space-x-1',
                        hasRSVP && 'hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      )}
                    >
                      {hasRSVP ? (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span className="group-hover:hidden">Going</span>
                          <span className="hidden group-hover:inline">Leave</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-3 h-3" />
                          <span>{isFull ? 'Full' : 'Join'}</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CreateMeetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateMeetForm({ onSuccess, onCancel }: CreateMeetFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    when: '',
    where: '',
    desc: '',
    privacy: 0 as 0 | 1 | 2 | 3,
    max: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.when || !formData.where) return;

    try {
      setLoading(true);
      const meetData = {
        host: 'currentuser',
        title: formData.title,
        when: new Date(formData.when).getTime(),
        where: formData.where,
        desc: formData.desc || undefined,
        privacy: formData.privacy,
        max: formData.max ? parseInt(formData.max) : undefined,
      };
      
      await meetsAdapter.createMeet(meetData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create meetup:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h3 className="text-lg font-semibold text-text mb-4">Create New Meetup</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Coffee & Code Session"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="when" className="block text-sm font-medium text-text mb-1">
              When *
            </label>
            <input
              type="datetime-local"
              id="when"
              value={formData.when}
              onChange={(e) => setFormData(prev => ({ ...prev, when: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label htmlFor="max" className="block text-sm font-medium text-text mb-1">
              Max Attendees
            </label>
            <input
              type="number"
              id="max"
              value={formData.max}
              onChange={(e) => setFormData(prev => ({ ...prev, max: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="20"
              min="1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="where" className="block text-sm font-medium text-text mb-1">
            Location *
          </label>
          <input
            type="text"
            id="where"
            value={formData.where}
            onChange={(e) => setFormData(prev => ({ ...prev, where: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Startup Café, Downtown"
            required
          />
        </div>

        <div>
          <label htmlFor="desc" className="block text-sm font-medium text-text mb-1">
            Description
          </label>
          <textarea
            id="desc"
            value={formData.desc}
            onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Tell people what to expect..."
          />
        </div>

        <div>
          <label htmlFor="privacy" className="block text-sm font-medium text-text mb-1">
            Privacy
          </label>
          <select
            id="privacy"
            value={formData.privacy}
            onChange={(e) => setFormData(prev => ({ ...prev, privacy: parseInt(e.target.value) as 0 | 1 | 2 | 3 }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={0}>Public</option>
            <option value={1}>Followers</option>
            <option value={2}>Close Friends</option>
            <option value={3}>Private</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!formData.title || !formData.when || !formData.where}
          >
            Create Meetup
          </Button>
        </div>
      </form>
    </div>
  );
}
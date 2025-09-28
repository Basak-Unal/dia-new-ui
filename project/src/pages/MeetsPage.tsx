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
  ClockIcon,
  ArchiveBoxIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

type FilterType = 'upcoming' | 'past' | 'mine' | 'all';

const FILTER_ICONS = (iconSize: number) => ({
  upcoming: <ClockIcon className={`w-${iconSize} h-${iconSize}`} />,
  past: <ArchiveBoxIcon className={`w-${iconSize} h-${iconSize}`} />,
  mine: <UserIcon className={`w-${iconSize} h-${iconSize}`} />,
  all: <UsersIcon className={`w-${iconSize} h-${iconSize}`} />
});

export function MeetsPage() {
  const { language, showToast } = useApp();
  const [meets, setMeets] = useState<MeetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<FilterType>('upcoming');
  const [type, setType] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [city, setCity] = useState<string>('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [typeOptions, setTypeOptions] = useState<string[]>([]);

  const loadMeets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meetsAdapter.getMeets({
        filterType,
        type,
        validUntil,
        city
      });
      setMeets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meets');
    } finally {
      setLoading(false);
    }
  };

  const loadTypeOptions = async () => {
    try {
      const types = await meetsAdapter.getMeetTypes();
      setTypeOptions(types);
    } catch (err) {
      console.error("Failed to load types:", err);
    }
  };

  useEffect(() => {
    loadTypeOptions();
    loadMeets();
  }, [filterType, type, validUntil, city]);

  const handleRSVP = async (meetId: string, currentlyGoing: boolean) => {
    try {
      if (currentlyGoing) {
        await meetsAdapter.unrsvp(meetId);
        showToast('RSVP cancelled', 'info');
      } else {
        await meetsAdapter.rsvp(meetId);
        showToast('RSVP confirmed!', 'success');
      }
      setMeets(prev =>
        prev.map(meet => {
          if (meet.id === meetId) {
            return {
              ...meet,
              going: currentlyGoing ? meet.going - 1 : meet.going + 1
            };
          }
          return meet;
        })
      );
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
    <div className="flex">
      {/* Sidebar Filters */}
      <aside
        className={clsx(
          "bg-white border-r border-border transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64 p-4" : "w-16 p-2"
        )}
      >
        {/* Toggle Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-bg-soft focus:outline-none"
          >
            {sidebarOpen ? "❮" : "❯"}
          </button>
        </div>

        {/* Filters Content */}
        <div className="flex flex-col space-y-6 flex-1">
          {/* Existing Type Filter */}
          <div>
            {sidebarOpen && <h2 className="text-xl font-bold mb-4">Filters</h2>}
            <div>
              {(['upcoming', 'past', 'mine', 'all'] as FilterType[]).map(typeOption => (
                <button
                  key={typeOption}
                  onClick={() => setFilterType(typeOption)}
                  className={clsx(
                    "block w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center space-x-2",
                    filterType === typeOption
                      ? "bg-primary-100 text-primary-700"
                      : "hover:bg-bg-soft text-text-muted"
                  )}
                  title={typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                >
                  {FILTER_ICONS(sidebarOpen ? 4 : 6)[typeOption]}
                  {sidebarOpen && typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter Dropdown */}
          {sidebarOpen && (
            <div>
              <h3 className="font-semibold mb-2">Type</h3>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                {typeOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Valid Until Filter */}
          {sidebarOpen && (
            <div>
              <h3 className="font-semibold mb-2">Valid Until</h3>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* City Filter */}
          {sidebarOpen && (
            <div>
              <h3 className="font-semibold mb-2">City</h3>
              <input
                type="text"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Apply Button */}
          {sidebarOpen && (
            <Button onClick={loadMeets} className="w-full">
              Apply Filters
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="mb-6 flex items-center justify-between">
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

        {meets.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon />}
            title="No meetups found"
            description={`No ${filterType} meetups to show right now.`}
            action={{
              label: 'Create Meetup',
              onClick: () => setShowCreateForm(true)
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meets.map(meet => {
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
                            <span>Going</span>
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
      </main>
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
        {/* Title */}
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

        {/* When & Max */}
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

        {/* Location */}
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

        {/* Description */}
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

        {/* Privacy */}
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

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!formData.title || !formData.when || !formData.where}>
            Create Meetup
          </Button>
        </div>
      </form>
    </div>
  );
}

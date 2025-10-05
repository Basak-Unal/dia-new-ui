import React, { useState, useEffect } from 'react';
import { Loading } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
//import { meetsAdapter } from '../adapters';
import { formatDate, PRIVACY_LABELS } from '../utils/privacy';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext'; // <-- add
import type { MeetItem } from '../types';
import { buildApiUrl } from '../config';

import { buildGetUrl } from '../utils/http';


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

import clsx from 'clsx';

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type FilterType = 'all' | 'mine' | 'upcoming' | 'past';

export interface GetMeetsParams {
  filterType: FilterType;
  type: string;        // UI "Type" dropdown
  validUntil: string;  // UI date input: 'YYYY-MM-DD' or ''
  city: string;        // UI city input
  username?: string;   // required for 'mine'
}

export interface MeetItem {
  id: string;
  title?: string;
  host?: string;
  when: number;      // epoch ms
  where: string;
  desc?: string;
  privacy?: 0|1|2|3;
  going: number;
  max?: number;
  // ... add any other fields you render
}

// ---- helpers ----
function endOfDayEpochMsFromDateInput(dateStr?: string): number {
  if (!dateStr) return Date.now(); // fallback to now when empty
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return Date.now();
  const dt = new Date(y, m - 1, d, 23, 59, 59, 0);
  return dt.getTime();
}

async function getJSON<T>(url: URL): Promise<T> {
  const res = await fetch(url.toString(), { method: 'GET', headers: { 'Accept': 'application/json' } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function putJSON<T>(path: string, body: any): Promise<T> {
  const url = new URL(buildApiUrl(path), window.location.origin);
  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const meetsAdapter = {
  async getFeed(filters: { type: string; validUntil: string; city: string }): Promise<MeetItem[]> {
    const url = buildGetUrl('/activity/explore', {
      ActivityType: filters.type || 'meetup',
      ValidUntill: endOfDayEpochMsFromDateInput(filters.validUntil),
      City: filters.city || 'Ankara',
    });
    const data = await getJSON<{ count: number; items: any[] }>(url);
    return (data.items ?? []).map((it) => ({
      id: it.id || `${it.ActivityType}-${it.City}-${it.ValidUntill}`,
      title: it.ActivityType,
      host: it.Host || it.host || '—',
      when: Number(it.ValidUntill) || Date.now(),
      where: it.City,
      desc: it.Description,
      privacy: it.Privacy ?? undefined,
      going: it.Going ?? it.going ?? 0,
      max: it.Max ?? it.max ?? undefined,
    }));
  },

async getSelfPairs(UserID: string): Promise<any[]> {
  const url = new URL(buildApiUrl('/activity/self-pairs'), window.location.origin);

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ UserID }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: Failed to get self pairs: ${text || res.statusText}`);
  }

  const data = await res.json() as { pairs: any[] };
  console.log('[DEBUG] Pairs from Lambda A:', data.pairs);

  return data.pairs ?? [];
},

async getSelf(UserID: string): Promise<MeetItem[]> {

  const pairs = await this.getSelfPairs(UserID);

  if (!pairs || pairs.length === 0) {
    console.log(`[DEBUG] No activities found for user ${UserID}`);
    return [];
  }

  const sanitizedPairs = pairs
    .map(p => {
      if (Array.isArray(p) && p.length === 2) return [String(p[0]), Number(p[1])] as [string, number];
      if (p.pk && p.sk) return [String(p.pk), Number(p.sk)] as [string, number];
      console.warn('[WARN] Invalid pair format detected:', p);
      return null;
    })
    .filter(Boolean);

  if (sanitizedPairs.length === 0) {
    console.warn('[WARN] No valid pairs to send to Lambda B');
    return [];
  }

  console.log('[DEBUG] Pairs to send to Lambda B:', sanitizedPairs);

  const url = new URL(buildApiUrl('/activity/self-result'), window.location.origin);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ pairs: sanitizedPairs }), // <-- keep key "pairs"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: Failed to get activities from DB: ${text || res.statusText}`);
  }

  const data = await res.json() as { count: number; items: any[] };
  console.log('[DEBUG] Data from Lambda B:', data);

  return (data.items ?? []).map((it) => ({
    id: it.id || `${it.ActivityType}-${it.ValidUntill}`,
    title: it.title || it.ActivityType || 'My meet',
    host: it.host ?? it.Host ?? '—',
    when: Number(it.when ?? it.ValidUntill ?? Date.now()),
    where: it.where ?? it.City ?? '—',
    desc: it.desc ?? it.Description,
    privacy: it.privacy ?? undefined,
    going: it.Going ?? it.going ?? 0,
    max: it.max ?? undefined,
  }));
},


  async getMeets(params: GetMeetsParams): Promise<MeetItem[]> {
    const { filterType, type, validUntil, city, username } = params;
    const now = Date.now();

    // helper sorters
    const asc = (a: MeetItem, b: MeetItem) => a.when - b.when;
    const desc = (a: MeetItem, b: MeetItem) => b.when - a.when;

    if (filterType === 'mine') {
      const mine = await this.getSelf(username || '');
      const upcoming = mine.filter(m => m.when >= now).sort(asc);
      const past     = mine.filter(m => m.when <  now).sort(desc);
      return [...upcoming, ...past];
    }

    const all = await this.getFeed({ type, validUntil, city });

    if (filterType === 'upcoming') {
      return all.filter(m => m.when >= now).sort(asc);
    }
    if (filterType === 'past') {
      return all.filter(m => m.when < now).sort(desc);
    }

    // 'all'
    const upcoming = all.filter(m => m.when >= now).sort(asc);
    const past     = all.filter(m => m.when <  now).sort(desc);
    return [...upcoming, ...past];
  },


  async getMeetTypes(): Promise<string[]> {
    // temporary; replace with GET to your endpoint if available
    return ['meetup', 'challenge', 'hard challenge', 'sports', 'technology_share', 'supply_exchange'];
  },

  async createMeet(meetData: any): Promise<void> {
    // keep POST for create
    const url = new URL(buildApiUrl('/meets/create'), window.location.origin);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetData),
    });
    if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text().catch(()=> '')}`);
  },

  async rsvp(meetId: string): Promise<void> {
    const url = new URL(buildApiUrl('/meets/rsvp'), window.location.origin);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: meetId }),
    });
    if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text().catch(()=> '')}`);
  },

  async unrsvp(meetId: string): Promise<void> {
    const url = new URL(buildApiUrl('/meets/unrsvp'), window.location.origin);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: meetId }),
    });
    if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text().catch(()=> '')}`);
  },

  hasRSVP(_meetId: string): boolean { return false; },

    async putActivity(params: {
    ActivityType: string;
    ValidUntill: number;
    City: string;
    Description: string;
    Signed: boolean;
    Finished: boolean;
    Host: string;
  }): Promise<{ id?: string; postgresOk?: boolean; postgresError?: string | null }> {

    // 1) Keep existing Dynamo behavior (this will throw if it fails)
    const dynamoResult = await putJSON<{ id?: string }>('/activity/put', params);

    // 2) Fire-and-try-to-retry for Postgres Lambda at /activity/postgres
    // Use the same payload. We'll try up to N times with exponential backoff.
    const postgresUrl = new URL(buildApiUrl('/activity'), window.location.origin).toString();

    async function postWithRetry(body: any, retries = 3, delayMs = 500): Promise<{ ok: boolean; error?: string }> {
      let lastError: string | undefined;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const res = await fetch(postgresUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => '');
            lastError = `Status ${res.status}: ${text || res.statusText}`;
            // If client error (4xx), don't retry
            if (res.status >= 400 && res.status < 500) break;
            // otherwise fall-through to retry
          } else {
            return { ok: true };
          }
        } catch (err: any) {
          lastError = (err && err.message) ? err.message : String(err);
        }
        // If we'll retry, wait
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt))); // exponential backoff
        }
      }
      return { ok: false, error: lastError ?? 'Unknown error' };
    }

    const pgResult = await postWithRetry(params, 3, 400);

    if (!pgResult.ok) {
      // Log to console (frontend). You may also want to send to Sentry or show a non-blocking toast.
      console.warn('[WARN] Postgres write failed for /activity:', pgResult.error);
      // Return both the dynamo id and the failed postgres signal
      return { id: dynamoResult?.id, postgresOk: false, postgresError: pgResult.error };
    }

    return { id: dynamoResult?.id, postgresOk: true, postgresError: null };
  },


   buildActivityFromForm(form: {
    title: string;
    when: string;  // 'YYYY-MM-DDTHH:mm'
    where: string;
    desc?: string;
  }) {
    return {
      ActivityType: /* (!) choose your mapping e.g. */ form.title || 'event',        // (!)
      ValidUntill:  new Date(form.when).getTime(),                                     // (!) or endOfDayEpochMsFromDateInput(form.when.split('T')[0])
      City:         /* (!) e.g. */ form.where,                                         // (!)
      Description:  /* (!) e.g. */ (form.desc ?? ''),                                  // (!)
      Signed:       /* (!) true/false, default false */ false,                         // (!)
      Finished:     /* (!) true/false, default false */ false,                         // (!)
    };
  },

  // Add this to your meetsAdapter object
  async joinActivity(activityType: string, validUntil: number, username: string): Promise<void> {
    const url = new URL(buildApiUrl('/activity/join'), window.location.origin);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        ActivityType: activityType,
        ValidUntill: validUntil
      }),
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API Error ${res.status}: Failed to join activity: ${text || res.statusText}`);
    }

    // Simay
    try {
      const postgresUrl = new URL(buildApiUrl('/activity'), window.location.origin);
      const body = {
        ActivityType: activityType,
        ValidUntill: validUntil,
        Host: username || 'unknown',  // 🔹 add Host since Postgres Lambda expects it
      };

      const pgRes = await fetch(postgresUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!pgRes.ok) {
        const text = await pgRes.text().catch(() => '');
        console.warn(`[WARN] Postgres write failed for /activity/post: Status ${pgRes.status}: ${text || pgRes.statusText}`);
      } else {
        console.log('[DEBUG] Postgres write success for /activity/post');
      }

    } catch (err: any) {
      console.warn('[WARN] Postgres call error:', err.message || err);
    }
    
    return res.json();
  },

};

const FILTER_ICONS = (iconSize: number) => ({
  all: <UsersIcon className={`w-${iconSize} h-${iconSize}`} />,
  mine: <UserIcon className={`w-${iconSize} h-${iconSize}`} />,
  upcoming: <ClockIcon className={`w-${iconSize} h-${iconSize}`} />,
  past: <ArchiveBoxIcon className={`w-${iconSize} h-${iconSize}`} />,
});

export function MeetsPage() {
  const { language, showToast } = useApp();

  const {session} = useAuth();
  const username = session?.username || '';

  const [meets, setMeets] = useState<MeetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [type, setType] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [city, setCity] = useState<string>('');

  const [applied, setApplied] = useState({ type: '', validUntil: '', city: '' });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [typeOptions, setTypeOptions] = useState<string[]>([]);

  const loadMeets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await meetsAdapter.getMeets({
        filterType,
        type: applied.type,
        validUntil: applied.validUntil,
        city: applied.city,
        username
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
  }, [filterType, applied]);

  const handleJoin = async (meet: MeetItem) => {
    try {
      // Extract the activity type from meet data
      // Assuming meet.title contains the activity type, adjust if needed
      const activityType = meet.title || '';
      const validUntil = meet.when;
      
      await meetsAdapter.joinActivity(activityType, validUntil, username);
      showToast('Successfully joined activity!', 'success');
      
      // Update local state to reflect the join
      setMeets(prev =>
        prev.map(m => {
          if (m.id === meet.id) {
            return {
              ...m,
              going: m.going + 1
            };
          }
          return m;
        })
      );
    } catch (error) {
      showToast('Failed to join activity', 'error');
      console.error('Join error:', error);
    }
  };

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
    return <Loading text="Loading events..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load events"
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
              {(['all', 'mine', 'upcoming', 'past'] as FilterType[]).map(typeOption => (
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
            <Button
              onClick={() => setApplied({ type, validUntil, city })}
              className="w-full"
            >
              Apply Filters
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text mb-2">Events</h2>
            <p className="text-text-muted">Discover and join local events</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Event</span>
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <CreateMeetForm
            typeOptions={typeOptions}
            onSuccess={() => {
              setShowCreateForm(false);
              loadMeets();
              showToast('Event created!', 'success');
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {meets.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon />}
            title="No events found"
            description={`No ${filterType} events to show right now.`}
            action={{
              label: 'Create Event',
              onClick: () => setShowCreateForm(true)
            }}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meets.map(meet => {
              const hasRSVP = meetsAdapter.hasRSVP(meet.id);

              // "Past the date of today" = before today's 00:00
              const isPastDay = meet.when < startOfTodayMs();
              const isUpcoming = meet.when > Date.now(); // keep your time-based join logic
              const isFull = meet.max && meet.going >= meet.max;

              return (
                <div
                  key={meet.id}
                  className={clsx(
                    "rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow duration-150",
                    isPastDay ? "border-red-200 bg-red-50/80" : "border-border bg-card"
                  )}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={clsx("font-semibold text-lg",
                        isPastDay ? "text-red-700" : "text-text"
                      )}>
                        {meet.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        {isPastDay && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            Past
                          </span>
                        )}
                        {meet.privacy !== undefined && (
                          <span className={clsx(
                            "text-xs px-2 py-1 rounded-full",
                            isPastDay ? "bg-red-100 text-red-700" : "bg-primary-100 text-primary-700"
                          )}>
                            {PRIVACY_LABELS[meet.privacy]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={clsx("flex items-center text-sm mb-2",
                      isPastDay ? "text-red-600" : "text-text-muted"
                    )}>
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      <span>Hosted by {meet.host}</span>
                    </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className={clsx("flex items-center text-sm",
                        isPastDay ? "text-red-600" : "text-text-muted"
                      )}>
                        <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{new Date(meet.when).toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</span>
                      </div>

                      <div className={clsx("flex items-start text-sm",
                        isPastDay ? "text-red-600" : "text-text-muted"
                      )}>
                        <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{meet.where}</span>
                      </div>

                      {meet.desc && (
                        <p className={clsx("text-sm leading-relaxed",
                          isPastDay ? "text-red-800" : "text-text"
                        )}>
                          {meet.desc}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={clsx("flex items-center text-sm",
                        isPastDay ? "text-red-700" : "text-text-muted"
                      )}>
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        <span>
                          {meet.going} going{meet.max && ` / ${meet.max}`}
                        </span>
                      </div>

                      {isUpcoming && (
                        <Button
                          size="sm"
                          variant={hasRSVP ? 'outline' : 'primary'}
                          onClick={() => {
                            // Use handleJoin for new join functionality, handleRSVP for existing RSVP
                            if (!hasRSVP && !isFull) {
                              // Find the meet object to get activity type and validUntil
                              const currentMeet = meets.find(m => m.id === meet.id);
                              if (currentMeet) {
                                handleJoin(currentMeet);
                              }
                            } else {
                              handleRSVP(meet.id, hasRSVP);
                            }
                          }}
                          disabled={!hasRSVP && isFull}
                          className={clsx(
                            'flex items-center space-x-1',
                            hasRSVP
                              ? (isPastDay
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'hover:bg-red-50 hover:text-red-600 hover:border-red-200')
                              : undefined
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
  typeOptions: string[];
}

interface CreateMeetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  typeOptions?: string[]; // <-- new (optional)
}

function CreateMeetForm({ onSuccess, onCancel, typeOptions = [] }: CreateMeetFormProps) {
  const { session } = useAuth();

  const [formData, setFormData] = useState({
    type: '',   // <-- use "type" instead of "title"
    when: '',
    where: '',
    desc: '',
    privacy: 0 as 0 | 1 | 2 | 3,
    max: '',
  });
  const [loading, setLoading] = useState(false);

  // If options arrive later, preselect the first
  useEffect(() => {
    if (typeOptions.length && !formData.type) {
      setFormData(prev => ({ ...prev, type: typeOptions[0] }));
    }
  }, [typeOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.when || !formData.where) return;

    try {
      setLoading(true);

      const activityPayload = {
        ActivityType: formData.type,                          // <-- use dropdown value
        ValidUntill: new Date(formData.when).getTime(),
        City:        formData.where,
        Description: formData.desc || '',
        Signed:      false,
        Finished:    false,
        Host:        session?.username || 'unknown',
      };

      await meetsAdapter.putActivity(activityPayload);
      onSuccess();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h3 className="text-lg font-semibold text-text mb-4">Create New Event</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type (dropdown) */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-text mb-1">
            Type *
          </label>
          <select
            id="type"
            value={formData.type || ''} // keep controlled when loading
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            {/* Placeholder to avoid empty + required issues while loading */}
            {!formData.type && (
              <option value="" disabled>
                {typeOptions.length ? 'Select a type' : 'Loading…'}
              </option>
            )}
            {(typeOptions ?? []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
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
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="20"
              min="1"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label htmlFor="where" className="block text-sm font-medium text-text mb-1">
            City *
          </label>
          <input
            type="text"
            id="where"
            value={formData.where}
            onChange={(e) => setFormData(prev => ({ ...prev, where: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          <Button
            type="submit"
            loading={loading}
            disabled={!formData.type || !formData.when || !formData.where} // <-- use type
          >
            Create Event
          </Button>
        </div>
      </form>
    </div>
  );
}

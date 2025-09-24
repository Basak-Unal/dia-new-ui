import type { Post } from '../types';

export const PRIVACY_LABELS = {
  0: 'Public',
  1: 'Followers',
  2: 'Close Friends',
  3: 'Private',
} as const;

export const PRIVACY_COLORS = {
  0: 'bg-blue-100 text-blue-700',
  1: 'bg-indigo-100 text-indigo-700',
  2: 'bg-teal-100 text-teal-700',
  3: 'bg-slate-100 text-slate-700',
} as const;

export function getPrivacyIcon(privacy: Post['privacy']): string {
  switch (privacy) {
    case 0: return 'globe-alt';
    case 1: return 'user-group';
    case 2: return 'star';
    case 3: return 'lock-closed';
    default: return 'globe-alt';
  }
}

export function formatDate(timestamp: number, language: 'en' | 'tr' = 'en'): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  
  if (diff < minute) {
    return language === 'tr' ? 'Şimdi' : 'Now';
  } else if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return language === 'tr' ? `${mins}d` : `${mins}m`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return language === 'tr' ? `${hours}s` : `${hours}h`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return language === 'tr' ? `${days}g` : `${days}d`;
  } else {
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
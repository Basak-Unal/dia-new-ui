// project/src/components/PostCard.tsx
import React, { useState } from 'react';
import { formatDate, PRIVACY_LABELS, PRIVACY_COLORS, getPrivacyIcon } from '../utils/privacy';
import { useApp } from '../contexts/AppContext';
import type { Post } from '../types';
import * as Icons from '@heroicons/react/24/outline';
import Sparkline from './Sparkline';

// Comments
import { Comments } from './Comments';
import { CommentsToggleButton } from './CommentsToggleButton';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { language } = useApp();
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const privacyIconName = getPrivacyIcon(post.privacy);
  const IconComponent = Icons[privacyIconName as keyof typeof Icons] as React.ComponentType<any>;

  const maxTags = window.innerWidth < 768 ? 4 : 6;
  const visibleTags = tagsExpanded ? post.tags : post.tags?.slice(0, maxTags);
  const hiddenTagsCount = (post.tags?.length || 0) - maxTags;

  const history = post.History ?? [];
  const hasHistory = Array.isArray(history) && history.length >= 2;
  const latest = hasHistory ? history[history.length - 1] : undefined;

  let tint = 'text-emerald-500';
  if (typeof latest === 'number') {
    if (latest < 70) tint = 'text-red-500';
    else if (latest > 180) tint = 'text-amber-500';
  }

  return (
      <article className="bg-card rounded-2xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow duration-150">
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-medium">
              {post.user.charAt(0).toUpperCase()}
            </span>
            </div>
            <div>
              <h3 className="font-medium text-text">{post.user}</h3>
              <time className="text-sm text-text-muted">
                {formatDate(post.ts, language)}
              </time>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Button on the post that toggles the comments list */}
            <CommentsToggleButton postId={post.id} />
            <div
                className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${PRIVACY_COLORS[post.privacy]}
            `}
            >
              {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
              {PRIVACY_LABELS[post.privacy]}
            </div>
          </div>
        </header>

        <div className="text-text mb-3 whitespace-pre-wrap leading-relaxed">{post.txt}</div>

        {hasHistory && (
            <div className="mt-3 border-t pt-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>Last 2h</span>
                <span className="tabular-nums">Blood Sugar at post: {latest} mg/dL</span>
              </div>

              <Sparkline
                  data={history}
                  width={360}
                  height={96}
                  lineClassName={tint}
                  axisClassName="text-muted-foreground"
                  rangeLow={90}
                  rangeHigh={160}
              />
            </div>
        )}

        {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {visibleTags?.map((tag, index) => (
                  <button
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md hover:bg-primary-100 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      aria-label={`Tag: ${tag}`}
                  >
                    #{tag}
                  </button>
              ))}
              {hiddenTagsCount > 0 && !tagsExpanded && (
                  <button
                      onClick={() => setTagsExpanded(true)}
                      className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      aria-label={`Show ${hiddenTagsCount} more tags`}
                  >
                    +{hiddenTagsCount} more
                  </button>
              )}
              {tagsExpanded && (post.tags?.length || 0) > maxTags && (
                  <button
                      onClick={() => setTagsExpanded(false)}
                      className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    Show less
                  </button>
              )}
            </div>
        )}

        {post.links && post.links.length > 0 && (
            <div className="mt-3 space-y-1">
              {post.links.map((link, index) => (
                  <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700 text-sm underline"
                  >
                    {link}
                  </a>
              ))}
            </div>
        )}

        {/* Comments: pass embedded comments from the post.
         If present, Comments.tsx will NOT fetch from Lambda. */}
        <div className="mt-4">
          <Comments
              postId={post.id}
              initiallyListOpen={false}
              comments={post.Comments ?? []}   // ← the only change needed here
          />
        </div>
      </article>
  );
}

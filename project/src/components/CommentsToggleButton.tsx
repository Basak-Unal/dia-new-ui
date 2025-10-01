// components/CommentsToggleButton.tsx
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

type Props = {
    postId: string;
    count?: number; // optional if you later add comment counts
    className?: string;
};

export function CommentsToggleButton({ postId, count, className = '' }: Props) {
    function toggle() {
        window.dispatchEvent(new CustomEvent(`toggle-comments-${postId}`));
    }
    return (
        <button
            type="button"
            onClick={toggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-bg hover:bg-bg-soft transition ${className}`}
            aria-label="Toggle comments"
        >
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text">Comments</span>
            {typeof count === 'number' && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
          {count}
        </span>
            )}
        </button>
    );
}

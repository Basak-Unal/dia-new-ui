import { ArrowPathIcon } from '@heroicons/react/24/outline';

type Props = {
    onClick: () => void;
    className?: string;
    spinning?: boolean;
    title?: string;
};

export default function RefreshButton({ onClick, className, spinning, title = 'Refresh' }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`h-8 w-8 inline-flex items-center justify-center rounded-full border border-border bg-bg hover:bg-bg-soft shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${className || ''}`}
        >
            <ArrowPathIcon className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} aria-hidden />
            <span className="sr-only">{title}</span>
        </button>
    );
}

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PostCard } from '../components/PostCard';
import { followAdapter } from '../adapters';
import { useApp } from '../contexts/AppContext';
import {
    UserPlusIcon,
    UserMinusIcon,
    PencilIcon,
    DocumentTextIcon,
    UserGroupIcon,
    LockClosedIcon,
    InformationCircleIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

type TabType = 'posts' | 'followers' | 'following' | 'private' | 'about';

// --- Mock fallback data (kept so the page looks “full” until you hook real APIs)
const mockUser = {
    id: 'alice',
    username: 'alice',
    displayName: 'Alice Smith',
    bio:
        'Software developer, coffee enthusiast, and weekend hiker. Building the future one line of code at a time.',
    avatar: null as string | null,
    stats: {
        posts: 127,
        followers: 1234,
        following: 567,
    },
};

const mockPosts = [
    {
        id: 'alice#1640000000000',
        user: 'alice',
        privacy: 0 as const,
        ts: 1640000000000,
        txt: 'Just shipped a new feature! The feeling never gets old 🚀',
        tags: ['coding', 'productivity', 'career'],
    },
    {
        id: 'alice#1639900000000',
        user: 'alice',
        privacy: 1 as const,
        ts: 1639900000000,
        txt: "Coffee shop coding session. There's something magical about the ambient noise.",
        tags: ['coding', 'coffee', 'lifestyle'],
    },
];

const mockFollowers = [
    { id: 'bob', username: 'bob', displayName: 'Bob Johnson', bio: 'Designer & photographer' },
    { id: 'charlie', username: 'charlie', displayName: 'Charlie Brown', bio: 'Product manager' },
    { id: 'diana', username: 'diana', displayName: 'Diana Wilson', bio: 'Marketing specialist' },
];

const mockFollowing = [
    { id: 'eve', username: 'eve', displayName: 'Eve Davis', bio: 'Tech lead' },
    { id: 'frank', username: 'frank', displayName: 'Frank Miller', bio: 'UX researcher' },
];

export default function ProfilePage() {
    const { user: routeUser } = useParams<{ user?: string }>();
    const { session, showToast } = useApp();

    // Prefer the URL param; fallback to the logged-in user
    const profileUsername = routeUser || session?.username || 'user';
    const isOwnProfile = !!session && profileUsername === session.username;

    // Build a user object: if it's your own profile, use session details;
    // otherwise reuse mock (but stamped with the requested username).
    const user = isOwnProfile
        ? {
            id: session.username,
            username: session.username,
            displayName: session.displayName || session.username,
            bio: '', // plug your real bio here when you have it
            avatar: session.avatar || null,
            stats: mockUser.stats, // keep nice demo stats until you wire real numbers
        }
        : {
            ...mockUser,
            id: profileUsername,
            username: profileUsername,
            displayName:
                mockUser.username === profileUsername
                    ? mockUser.displayName
                    : profileUsername.charAt(0).toUpperCase() + profileUsername.slice(1),
        };

    const [activeTab, setActiveTab] = useState<TabType>('posts');
    const [isFollowing, setIsFollowing] = useState(() =>
        isOwnProfile ? false : followAdapter.isFollowing(profileUsername)
    );
    const [followerCount, setFollowerCount] = useState<number>(user.stats.followers);
    const [loading, setLoading] = useState(false);

    const handleFollowToggle = async () => {
        if (isOwnProfile) return; // don't follow yourself
        try {
            setLoading(true);
            if (isFollowing) {
                await followAdapter.unfollow(profileUsername);
                setIsFollowing(false);
                setFollowerCount((n) => Math.max(0, n - 1));
                showToast(`Unfollowed ${user.displayName}`, 'info');
            } else {
                await followAdapter.follow(profileUsername);
                setIsFollowing(true);
                setFollowerCount((n) => n + 1);
                showToast(`Now following ${user.displayName}`, 'success');
            }
        } catch (e) {
            showToast('Failed to update follow status', 'error');
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
        { id: 'posts', label: 'Posts', icon: DocumentTextIcon },
        { id: 'followers', label: 'Followers', icon: UserGroupIcon },
        { id: 'following', label: 'Following', icon: UserGroupIcon },
        ...(isOwnProfile ? [{ id: 'private', label: 'Private', icon: LockClosedIcon } as const] : []),
        { id: 'about', label: 'About', icon: InformationCircleIcon },
    ];

    // For demo posts, stamp username to reflect the profile being viewed
    const demoPosts = mockPosts.map((p) => ({ ...p, user: user.username }));

    return (
        <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="relative bg-card rounded-2xl border border-border p-6 mb-6 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-100 to-transparent absolute inset-x-0 top-0 h-24 rounded-t-2xl opacity-50" />

                <div className="relative">
                    <div className="flex items-start space-x-4 mb-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-100">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="avatar"
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <UserCircleIcon className="w-10 h-10 text-primary-700" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-text mb-1">{user.displayName}</h1>
                            <p className="text-text-muted mb-3">@{user.username}</p>

                            <div className="flex items-center space-x-6 text-sm">
                                <div>
                                    <span className="font-semibold text-text">{user.stats.posts}</span>
                                    <span className="text-text-muted ml-1">Posts</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-text">{followerCount.toLocaleString()}</span>
                                    <span className="text-text-muted ml-1">Followers</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-text">{user.stats.following}</span>
                                    <span className="text-text-muted ml-1">Following</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {isOwnProfile ? (
                                <Link
                                    to={`/settings`}
                                    className="inline-flex items-center space-x-2 px-4 py-2 border border-primary-300 text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    <span>Edit Profile</span>
                                </Link>
                            ) : (
                                <Button
                                    onClick={handleFollowToggle}
                                    loading={loading}
                                    variant={isFollowing ? 'outline' : 'primary'}
                                    className={clsx(
                                        'flex items-center space-x-2 group',
                                        isFollowing && 'hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                    )}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserMinusIcon className="w-4 h-4" />
                                            <span className="group-hover:hidden">Following</span>
                                            <span className="hidden group-hover:inline">Unfollow</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlusIcon className="w-4 h-4" />
                                            <span>Follow</span>
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {user.bio && <p className="text-text leading-relaxed">{user.bio}</p>}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="border-b border-border">
                    <nav className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        'flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                                        isActive
                                            ? 'text-primary-600 border-b-2 border-primary-600'
                                            : 'text-text-muted hover:text-text'
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">
                    <TabContent
                        tab={activeTab}
                        user={user}
                        demoPosts={demoPosts}
                        mockFollowers={mockFollowers}
                        mockFollowing={mockFollowing}
                    />
                </div>
            </div>
        </div>
    );
}

function TabContent({
                        tab,
                        user,
                        demoPosts,
                        mockFollowers,
                        mockFollowing,
                    }: {
    tab: TabType;
    user: typeof mockUser;
    demoPosts: typeof mockPosts;
    mockFollowers: typeof mockFollowers;
    mockFollowing: typeof mockFollowing;
}) {
    switch (tab) {
        case 'posts':
            return (
                <div className="space-y-4">
                    {demoPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            );

        case 'followers':
            return (
                <div className="space-y-3">
                    {mockFollowers.map((follower) => (
                        <UserRow key={follower.id} user={follower} />
                    ))}
                </div>
            );

        case 'following':
            return (
                <div className="space-y-3">
                    {mockFollowing.map((following) => (
                        <UserRow key={following.id} user={following} />
                    ))}
                </div>
            );

        case 'private':
            return (
                <div className="text-center py-8">
                    <LockClosedIcon className="w-12 h-12 mx-auto mb-4 text-text-muted" />
                    <h3 className="text-lg font-medium text-text mb-2">Private Posts</h3>
                    <p className="text-text-muted">Your private posts will appear here</p>
                </div>
            );

        case 'about':
            return (
                <div className="space-y-4">
                    <div className="bg-bg-soft rounded-lg p-4">
                        <h3 className="font-medium text-text mb-2">Bio</h3>
                        <p className="text-text-muted leading-relaxed">{user.bio || 'No bio available.'}</p>
                    </div>

                    <div className="bg-bg-soft rounded-lg p-4">
                        <h3 className="font-medium text-text mb-2">Joined</h3>
                        <p className="text-text-muted">Member since January 2023</p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

function UserRow({
                     user,
                 }: {
    user: { id: string; username: string; displayName: string; bio?: string };
}) {
    const [isFollowing, setIsFollowing] = useState(() => followAdapter.isFollowing(user.id));
    const [loading, setLoading] = useState(false);
    const { showToast } = useApp();

    const handleFollowToggle = async () => {
        try {
            setLoading(true);
            if (isFollowing) {
                await followAdapter.unfollow(user.id);
                setIsFollowing(false);
                showToast(`Unfollowed ${user.displayName}`, 'info');
            } else {
                await followAdapter.follow(user.id);
                setIsFollowing(true);
                showToast(`Now following ${user.displayName}`, 'success');
            }
        } catch {
            showToast('Failed to update follow status', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center space-x-3 p-3 bg-bg-soft rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary-100 grid place-items-center flex-shrink-0">
                <UserCircleIcon className="w-5 h-5 text-primary-700" />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text">{user.displayName}</h4>
                <p className="text-sm text-text-muted">@{user.username}</p>
                {user.bio && <p className="text-sm text-text-muted mt-1 line-clamp-1">{user.bio}</p>}
            </div>

            <Button
                size="sm"
                variant={isFollowing ? 'outline' : 'primary'}
                onClick={handleFollowToggle}
                loading={loading}
                className={clsx('group', isFollowing && 'hover:bg-red-50 hover:text-red-600 hover:border-red-200')}
            >
                {isFollowing ? (
                    <>
                        <span className="group-hover:hidden">Following</span>
                        <span className="hidden group-hover:inline">Unfollow</span>
                    </>
                ) : (
                    'Follow'
                )}
            </Button>
        </div>
    );
}

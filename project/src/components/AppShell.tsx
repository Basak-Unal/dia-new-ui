import { useState } from 'react';
import { NavLink, Outlet, useLocation, Navigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  GlobeAltIcon,
  UserGroupIcon,
  StarIcon,
  LockClosedIcon,
  BellIcon,
  CalendarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../contexts/AppContext';
import { ChatbotWidget } from './ChatbotWidget';

const navigation = [
  { name: 'Public',       href: '/',          icon: GlobeAltIcon },
  { name: 'Following',    href: '/following', icon: UserGroupIcon },
  { name: 'Close Friends',href: '/close',     icon: StarIcon },
  { name: 'Private',      href: '/private',   icon: LockClosedIcon },
  { name: 'Events',        href: '/meets',     icon: CalendarIcon },
];

export function AppShell() {
  const location = useLocation();
  const { session, signOut } = useApp();
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Gate: if no session, go to login
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  const profileHref = `/profile/${session.username}`;
  const firstLetter =
      (session.displayName?.[0] ?? session.username?.[0] ?? '').toUpperCase();

  // ✅ Only SETTINGS in user actions to avoid duplicate Profile button
  const userActions = [
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
      <div className="min-h-screen bg-bg">
        {/* Top Navigation */}
        <nav className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="text-xl font-bold text-primary-700">Dialife</Link>
              </div>

              {/* Main Navigation - Desktop */}
              <div className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                      <NavLink
                          key={item.name}
                          to={item.href}
                          className={clsx(
                              'inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
                              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                              isActive
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'text-text-muted hover:text-text hover:bg-bg-soft'
                          )}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </NavLink>
                  );
                })}
              </div>

              {/* Right side: Post button, avatar chip (links to profile), and Settings */}
              <div className="flex items-center space-x-2">
                <NavLink
                    to="/post"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Post
                </NavLink>

                {/* Avatar chip → Profile */}
                <NavLink
                    to={profileHref}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-bg-soft"
                    title={session.displayName || session.username}
                >
                  {session.avatar ? (
                      <img
                          src={session.avatar}
                          alt="avatar"
                          className="w-7 h-7 rounded-full object-cover"
                      />
                  ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 grid place-items-center text-xs">
                        {firstLetter}
                      </div>
                  )}
                  <span className="hidden sm:block max-w-[160px] truncate text-sm">
                  {session.displayName || session.username}
                </span>
                </NavLink>

                {/* Only Settings (Profile icon removed) */}
                {userActions.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className="p-2 text-text-muted hover:text-text hover:bg-bg-soft rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title={item.name}
                    >
                      <item.icon className="w-5 h-5" />
                    </NavLink>
                ))}

                {/* Sign out */}
                <button
                    onClick={signOut}
                    className="ml-1 px-3 py-1 text-sm rounded-lg border hover:bg-bg-soft"
                    title="Sign out"
                >
                  Sign out
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden pb-4">
              <div className="flex space-x-1 overflow-x-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                      <NavLink
                          key={item.name}
                          to={item.href}
                          className={clsx(
                              'flex-shrink-0 inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150',
                              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                              isActive
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'text-text-muted hover:text-text hover:bg-bg-soft'
                          )}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>

        {/* Chatbot Widget */}
        <ChatbotWidget isOpen={isChatOpen} onToggle={setIsChatOpen} />
      </div>
  );
}

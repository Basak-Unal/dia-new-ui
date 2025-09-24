import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useApp } from '../contexts/AppContext';
import type { Theme, Language } from '../types';
import {
  GlobeAltIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export function SettingsPage() {
  const { theme, language, setTheme, setLanguage, showToast } = useApp();
  const [profile, setProfile] = useState({
    displayName: 'Current User',
    bio: 'This is my bio description.',
    avatar: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showToast('Avatar size must be less than 2MB', 'error');
        return;
      }
      setProfile(prev => ({ ...prev, avatar: file }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Settings</h2>
        <p className="text-text-muted">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <GlobeAltIcon className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text">General</h3>
          </div>

          <div className="space-y-4">
            {/* Language Setting */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-text mb-2">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>

            {/* Theme Setting */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'light' as Theme, label: 'Light', icon: SunIcon },
                  { value: 'dark' as Theme, label: 'Dark', icon: MoonIcon },
                  { value: 'system' as Theme, label: 'System', icon: ComputerDesktopIcon },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                      ${theme === option.value
                        ? 'bg-primary-100 border-primary-300 text-primary-700'
                        : 'border-border hover:bg-bg-soft text-text-muted hover:text-text'
                      }
                    `}
                  >
                    <option.icon className="w-5 h-5 mb-1" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Profile Settings */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserCircleIcon className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text">Profile</h3>
          </div>

          <div className="space-y-4">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-700">
                    {profile.displayName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-block px-4 py-2 bg-bg-soft border border-border rounded-lg text-sm font-medium text-text hover:bg-primary-50 hover:border-primary-300 transition-colors duration-150"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-text-muted mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your display name"
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-text mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                maxLength={300}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-text-muted mt-1">
                {profile.bio.length}/300 characters
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-text">Privacy</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-bg-soft rounded-lg p-4">
              <h4 className="font-medium text-text mb-2">Data & Privacy</h4>
              <p className="text-text-muted text-sm mb-3">
                Your data is kept secure and private. We only collect necessary information to provide our services.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Profile visibility</span>
                  <span className="text-text font-medium">Public</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Search visibility</span>
                  <span className="text-text font-medium">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Activity status</span>
                  <span className="text-text font-medium">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            loading={loading}
            className="px-8"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
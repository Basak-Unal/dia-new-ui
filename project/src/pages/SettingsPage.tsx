import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { useApp } from "../contexts/AppContext";
import {
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { buildApiUrl } from "../config";

export function SettingsPage() {
  const { showToast, session } = useApp();

  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    bio: "",
    avatar: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.username) return;

      try {
        const url = buildApiUrl(`users?username=${session.username}`);
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.message) {
          showToast(data.message || "Failed to load profile", "error");
          return;
        }

        setProfile({
          name: data.name || "",
          surname: data.surname || "",
          bio: data.bio || "",
          avatar: null,
        });
      } catch (err) {
        console.error(err);
        showToast("Failed to load profile", "error");
      }
    };

    fetchProfile();
  }, [session]);

  const handleSave = async () => {
    if (!session?.username) {
      showToast("No user session found", "error");
      return;
    }

    try {
      setLoading(true);

      const body: any = {
        username: session.username,
        name: profile.name,
        surname: profile.surname,
        bio: profile.bio,
      };

      if (profile.avatar) {
        body.profile_pic = "TODO: Avatar upload URL";
      }

      const res = await fetch(buildApiUrl("users"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (res.ok) {
        showToast("Settings saved successfully!", "success");
      } else {
        showToast(result.error || "Failed to save settings", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to save settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "error");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast("Avatar size must be less than 2MB", "error");
        return;
      }
      setProfile((prev) => ({ ...prev, avatar: file }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Settings</h2>
        <p className="text-text-muted">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
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
                    {profile.name?.charAt(0) || ""}
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
                    className="cursor-pointer inline-block px-4 py-2 bg-bg-soft border border-border rounded-lg text-sm font-medium hover:bg-primary-50"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-text-muted mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* First Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="name"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Surname */}
            <div>
              <label
                htmlFor="surname"
                className="block text-sm font-medium text-text mb-2"
              >
                Surname
              </label>
              <input
                type="text"
                id="surname"
                value={profile.surname}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, surname: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-text mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={profile.bio}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={3}
                maxLength={300}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
          <div className="bg-bg-soft rounded-lg p-4">
            <h4 className="font-medium text-text mb-2">Data & Privacy</h4>
            <p className="text-text-muted text-sm mb-3">
              Your data is kept secure and private. We only collect necessary
              information to provide our services.
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
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={loading} className="px-8">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

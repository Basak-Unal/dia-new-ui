import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { PostCard } from "../components/PostCard";
import { followAdapter } from "../adapters/FollowAdapter";
import { useApp } from "../contexts/AppContext";
import {
  PencilIcon,
  DocumentTextIcon,
  UserGroupIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { buildApiUrl } from "../config";

type TabType = "posts" | "followers" | "following" | "about";

type FeedPost = {
  id: string;
  user: string;
  privacy: 0 | 1 | 2;
  ts: number;
  txt: string;
  tags?: string[];
};

export default function ProfilePage() {
  const { user: routeUser } = useParams<{ user?: string }>();
  const { session, showToast } = useApp();

  const profileUsername = routeUser || session?.username || "user";
  const isOwnProfile = !!session && profileUsername === session.username;

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isFollowing, setIsFollowing] = useState(
    () => !isOwnProfile && followAdapter.isFollowing(profileUsername)
  );
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);
  const [postErr, setPostErr] = useState<string | null>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  const tabs: { id: TabType; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: "posts", label: "Posts", icon: DocumentTextIcon },
    { id: "followers", label: "Followers", icon: UserGroupIcon },
    { id: "following", label: "Following", icon: UserGroupIcon },
    { id: "about", label: "About", icon: InformationCircleIcon },
  ];

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const targetUser = routeUser ?? session?.username ?? "guest";
        const url = new URL(buildApiUrl("/entries"), window.location.origin);
        url.searchParams.set("UserID", targetUser);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`API ${res.status}`);

        const data = await res.json();
        const mapped: FeedPost[] = (data || []).map((row: any) => ({
          id: `${row.UserID}:${row.Timestamp}`,
          user: String(row.UserID).split("#")[0],
          privacy: (Number(String(row.UserID).split("#")[1]) || 0) as 0 | 1 | 2,
          ts: Number(row.Timestamp) * (Number(row.Timestamp) < 1e12 ? 1000 : 1),
          txt: String(row.Txt),
        }));

        if (alive) setPosts(mapped);
      } catch (e: any) {
        if (alive) {
          setPostErr(e?.message || "Failed to load posts");
          setPosts([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [routeUser, session?.username]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const followersList = await followAdapter.getFollowers(profileUsername);
        const followingList = await followAdapter.getFollowing(profileUsername);

        if (alive) {
          setFollowers(followersList);
          setFollowing(followingList);
          setFollowerCount(followersList.length);
        }
      } catch (e) {
        console.error("Failed to fetch followers/following:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [profileUsername]);

  const handleFollowToggle = async () => {
    if (isOwnProfile || !session) return;
    try {
      setLoading(true);
      if (isFollowing) {
        await followAdapter.unfollow(session.username, profileUsername);
        setIsFollowing(false);
      } else {
        await followAdapter.follow(session.username, profileUsername);
        setIsFollowing(true);
      }
      const followersList = await followAdapter.getFollowers(profileUsername);
      const followingList = await followAdapter.getFollowing(profileUsername);
      setFollowers(followersList);
      setFollowing(followingList);
      setFollowerCount(followersList.length);
      showToast(
        isFollowing
          ? `Unfollowed ${profileUsername}`
          : `Now following ${profileUsername}`,
        isFollowing ? "info" : "success"
      );
    } catch (e) {
      console.error(e);
      showToast("Failed to update follow status", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-card rounded-2xl border border-border p-6 mb-6 overflow-hidden">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-medium text-2xl">
              {profileUsername.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-text mb-1">{profileUsername}</h1>
            <p className="text-text-muted mb-3">@{profileUsername}</p>
            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="font-semibold text-text">{posts?.length || 0}</span>
                <span className="text-text-muted ml-1">Posts</span>
              </div>
              <div>
                <span className="font-semibold text-text">{followerCount}</span>
                <span className="text-text-muted ml-1">Followers</span>
              </div>
              <div>
                <span className="font-semibold text-text">{following.length}</span>
                <span className="text-text-muted ml-1">Following</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            {isOwnProfile ? (
              <Link to={`/settings`} className="inline-flex items-center px-4 py-2 border rounded-lg">
                <PencilIcon className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            ) : (
              <Button
                onClick={handleFollowToggle}
                loading={loading}
                variant={isFollowing ? "outline" : "primary"}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="border-b border-border">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center px-4 py-3 text-sm font-medium",
                  activeTab === tab.id
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-text-muted"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <TabContent
            tab={activeTab}
            posts={posts}
            postErr={postErr}
            followers={followers}
            following={following}
            profileUsername={profileUsername}
            setFollowers={setFollowers}
            setFollowing={setFollowing}
            setFollowerCount={setFollowerCount}
          />
        </div>
      </div>
    </div>
  );
}

function TabContent({
  tab,
  posts,
  postErr,
  followers,
  following,
  profileUsername,
  setFollowers,
  setFollowing,
  setFollowerCount,
}: {
  tab: TabType;
  posts: FeedPost[] | null;
  postErr: string | null;
  followers: string[];
  following: string[];
  profileUsername: string;
  setFollowers: React.Dispatch<React.SetStateAction<string[]>>;
  setFollowing: React.Dispatch<React.SetStateAction<string[]>>;
  setFollowerCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { session, showToast } = useApp();

  const handleTabFollowToggle = async (
    currentUser: string,
    targetUser: string,
    isFollowingAlready: boolean
  ) => {
    try {
      if (isFollowingAlready) {
        await followAdapter.unfollow(currentUser, targetUser);
      } else {
        await followAdapter.follow(currentUser, targetUser);
      }
      const followersList = await followAdapter.getFollowers(profileUsername);
      const followingList = await followAdapter.getFollowing(profileUsername);
      setFollowers(followersList);
      setFollowing(followingList);
      setFollowerCount(followersList.length);

      showToast(
        isFollowingAlready
          ? `Unfollowed ${targetUser}`
          : `Now following ${targetUser}`,
        isFollowingAlready ? "info" : "success"
      );
    } catch (e) {
      console.error(e);
      showToast("Failed to update follow status", "error");
    }
  };

  const renderUserCard = (
    username: string,
    isFollowingAlready: boolean,
    isCurrentUser: boolean,
    tabType: TabType
  ) => {
    return (
      <div
        key={username}
        className="flex justify-between items-center p-4 border rounded-lg bg-card hover:shadow-md transition"
      >
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-medium">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium">{username}</span>
        </div>

        {!isCurrentUser && (
          <Button
            size="sm"
            variant={isFollowingAlready ? "outline" : "primary"}
            disabled={tabType === "followers" && isFollowingAlready}
            className={clsx(
              tabType === "followers" && isFollowingAlready && "opacity-50 cursor-not-allowed"
            )}
            onClick={() =>
              handleTabFollowToggle(session!.username, username, isFollowingAlready)
            }
          >
            {tabType === "followers"
              ? isFollowingAlready
                ? "Following"
                : "Follow"
              : "Unfollow"}
          </Button>
        )}
      </div>
    );
  };

  if (tab === "followers") {
    return (
      <div className="space-y-3">
        {followers.length === 0 ? (
          <div className="text-text-muted">No followers yet.</div>
        ) : (
          followers.map((f) => {
            const alreadyFollowing = following.includes(f);
            const isCurrentUser = session?.username === f;
            return renderUserCard(f, alreadyFollowing, isCurrentUser, "followers");
          })
        )}
      </div>
    );
  }

  if (tab === "following") {
    return (
      <div className="space-y-3">
        {following.length === 0 ? (
          <div className="text-text-muted">Not following anyone.</div>
        ) : (
          following.map((f) => {
            const isCurrentUser = session?.username === f;
            return renderUserCard(f, true, isCurrentUser, "following");
          })
        )}
      </div>
    );
  }

  if (tab === "posts") {
    if (!posts || posts.length === 0) {
      return <div className="text-text-muted">No posts to show yet.</div>;
    }
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  }

  if (tab === "about") {
    return <div>About content here...</div>;
  }

  return null;
}

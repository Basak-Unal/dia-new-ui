import { buildApiUrl } from "../config";

export class FollowAdapter {
  // Get users that current user is following
  async getFollowing(username: string): Promise<string[]> {
    const url = buildApiUrl("/friend-list");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, list_type: 0 }), // 0 = following
    });

    if (!res.ok) throw new Error(`Failed to fetch following: ${res.status}`);
    const data = await res.json();

    return Array.isArray(data.user_list) ? data.user_list : [];
  }

  // Get followers of a user
  async getFollowers(username: string): Promise<string[]> {
    const url = buildApiUrl("/users") + "?username=" + encodeURIComponent(username);

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`Failed to fetch followers: ${res.status}`);

    const data = await res.json();

    if (data?.followers && Array.isArray(data.followers)) {
        return data.followers;
    }

    // Handle case where followers is a JSON string
    if (typeof data?.followers === "string") {
        try {
        const parsed = JSON.parse(data.followers);
        if (Array.isArray(parsed)) return parsed;
        } catch {}
    }

    return [];
    }


  async follow(currentUser: string, targetUser: string): Promise<void> {
    // Add targetUser to currentUser's following
    const following = await this.getFollowing(currentUser);
    if (!following.includes(targetUser)) {
        following.push(targetUser);
    }

    // Add currentUser to targetUser's followers
    const followers = await this.getFollowers(targetUser);
    if (!followers.includes(currentUser)) {
        followers.push(currentUser);
    }

    // Update both users
    await Promise.all([
        this.updateUser(currentUser, { following }),
        this.updateUser(targetUser, { followers })
    ]);
    }

    async unfollow(currentUser: string, targetUser: string): Promise<void> {
    const following = (await this.getFollowing(currentUser)).filter(u => u !== targetUser);
    const followers = (await this.getFollowers(targetUser)).filter(u => u !== currentUser);

    await Promise.all([
        this.updateUser(currentUser, { following }),
        this.updateUser(targetUser, { followers })
    ]);
    }

    private async updateUser(username: string, data: Record<string, any>) {
    const url = buildApiUrl("/users");
    const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ...data })
    });

    if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
    }


  isFollowing(username: string): boolean {
    const stored = localStorage.getItem("following") || "[]";
    try {
      const list = JSON.parse(stored);
      return Array.isArray(list) && list.includes(username);
    } catch {
      return false;
    }
  }
}

export const followAdapter = new FollowAdapter();

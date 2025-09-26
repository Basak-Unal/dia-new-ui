// All adapters - most are stubs that can be swapped for real implementations
import type { Post, ActivityItem, MeetItem } from '../types';
import { buildApiUrl } from '../config';

type CreatePostResponse = Post;


// Follow operations adapter
export class FollowAdapter {
  private followingSet = new Set(['user1', 'user2', 'user3']); // Mock data
  
  async follow(userId: string): Promise<void> {
    await this.delay(300);
    this.followingSet.add(userId);
  }
  
  async unfollow(userId: string): Promise<void> {
    await this.delay(300);
    this.followingSet.delete(userId);
  }
  
  isFollowing(userId: string): boolean {
    return this.followingSet.has(userId);
  }
  
  getFollowingList(): string[] {
    return Array.from(this.followingSet);
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Post creation adapter
export class PostAdapter {
  async createPost(post: Omit<Post, 'id' | 'ts'>): Promise<Post> {
    await this.delay(500);
    const newPost: Post = {
      ...post,
      UserID: `${post.user}`,
      Timestamp: Date.now(),
    };
    console.log('Created post:', newPost);
    this.sendPost(newPost);
    return newPost;
  }

  async sendPost(post: Post): Promise<CreatePostResponse> {
    // If Post has any non-JSON fields (e.g., File), strip or serialize them first.
    const { imageFile, ...jsonSafe } = post as any;

    const url = new URL(buildApiUrl('/new-entry'), window.location.origin);

    console.log('Sending post to API:', url);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}`, // if you use auth
        // 'Idempotency-Key': crypto.randomUUID(), // optional safety on retries
      },
      body: JSON.stringify(jsonSafe),
      // credentials: 'include', // if your API uses cookies
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API Error ${res.status}: ${text || res.statusText}`);
    }

    const data = await res.json();
    // If API returns a wrapper, map it: return this.mapPost(data.post)
    return data as CreatePostResponse;
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Activities adapter
export class ActivitiesAdapter {
  private activities: ActivityItem[] = [
    {
      id: '1',
      kind: 'like',
      actor: 'alice',
      ts: Date.now() - 3600000,
      ref: { postId: 'post1' },
      read: false,
    },
    {
      id: '2',
      kind: 'follow',
      actor: 'bob',
      ts: Date.now() - 7200000,
      ref: { user: 'currentuser' },
      read: false,
    },
    {
      id: '3',
      kind: 'comment',
      actor: 'charlie',
      ts: Date.now() - 10800000,
      ref: { postId: 'post2' },
      text: 'Great post!',
      read: true,
    },
  ];
  
  async getActivities(page = 0, limit = 20): Promise<{ items: ActivityItem[]; hasMore: boolean }> {
    await this.delay(300);
    const start = page * limit;
    const items = this.activities.slice(start, start + limit);
    return {
      items,
      hasMore: start + limit < this.activities.length,
    };
  }
  
  async markAllAsRead(): Promise<void> {
    await this.delay(200);
    this.activities.forEach(activity => activity.read = true);
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Meets/Meetups adapter
export class MeetsAdapter {
  private meets: MeetItem[] = [
    {
      id: '1',
      host: 'alice',
      title: 'Coffee & Code',
      when: Date.now() + 86400000,
      where: 'Startup Café, Downtown',
      desc: 'Weekly coding session over coffee',
      privacy: 0,
      going: 12,
      attendees: ['bob', 'charlie', 'diana'],
      max: 20,
    },
    {
      id: '2',
      host: 'bob',
      title: 'Hiking Adventure',
      when: Date.now() + 172800000,
      where: 'Mountain Trail Park',
      desc: 'Weekend hiking trip for beginners',
      privacy: 1,
      going: 8,
      attendees: ['alice', 'eve'],
    },
  ];
  
  private rsvps = new Set<string>(); // meetId set
  
  async getMeets(filter: 'upcoming' | 'past' | 'mine' | 'all' = 'all'): Promise<MeetItem[]> {
    await this.delay(300);
    let filtered = this.meets;
    
    const now = Date.now();
    switch (filter) {
      case 'upcoming':
        filtered = this.meets.filter(m => m.when > now);
        break;
      case 'past':
        filtered = this.meets.filter(m => m.when <= now);
        break;
      case 'mine':
        filtered = this.meets.filter(m => m.host === 'currentuser');
        break;
    }
    
    return filtered;
  }
  
  async rsvp(meetId: string): Promise<void> {
    await this.delay(300);
    this.rsvps.add(meetId);
    const meet = this.meets.find(m => m.id === meetId);
    if (meet) meet.going++;
  }
  
  async unrsvp(meetId: string): Promise<void> {
    await this.delay(300);
    this.rsvps.delete(meetId);
    const meet = this.meets.find(m => m.id === meetId);
    if (meet) meet.going = Math.max(0, meet.going - 1);
  }
  
  hasRSVP(meetId: string): boolean {
    return this.rsvps.has(meetId);
  }
  
  async createMeet(meet: Omit<MeetItem, 'id' | 'going' | 'attendees'>): Promise<MeetItem> {
    await this.delay(500);
    const newMeet: MeetItem = {
      ...meet,
      id: `meet_${Date.now()}`,
      going: 1,
      attendees: [meet.host],
    };
    this.meets.unshift(newMeet);
    return newMeet;
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Upload helper adapter
export class UploadAdapter {
  async getUploadUrl(filename: string): Promise<string> {
    await this.delay(200);
    // Return a mock pre-signed URL
    return `https://uploads.dialife.social/${Date.now()}-${filename}`;
  }
  
  async uploadFile(file: File, uploadUrl: string): Promise<string> {
    await this.delay(1000);
    // Mock upload - return final image URL
    return `https://images.dialife.social/${Date.now()}-${file.name}`;
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Chatbot adapter
export class ChatbotAdapter {
  async sendMessage(message: string): Promise<string> {
    await this.delay(Math.random() * 300 + 600); // 600-900ms
    
    const responses = [
      "I'm here to help! What would you like to know about Dialife?",
      "That's a great question. Let me think about that...",
      "I can help you with posts, privacy settings, and finding friends!",
      "Thanks for using Dialife! Is there anything specific you need help with?",
      "I'm still learning, but I'm happy to assist you with the app!",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


// Export instances
export const followAdapter = new FollowAdapter();
export const postAdapter = new PostAdapter();
export const activitiesAdapter = new ActivitiesAdapter();
export const meetsAdapter = new MeetsAdapter();
export const uploadAdapter = new UploadAdapter();
export const chatbotAdapter = new ChatbotAdapter();
export { authAdapter } from './AuthAdapter';

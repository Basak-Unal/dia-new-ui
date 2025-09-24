
import { FeedView } from '../components/FeedView';

export function PrivatePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Private</h2>
        <p className="text-text-muted">Your private posts</p>
      </div>
      <FeedView variant="private" />
    </div>
  );
}
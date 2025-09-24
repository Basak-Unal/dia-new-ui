import { FeedView } from '../components/FeedView';

export function ClosePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Close Friends</h2>
        <p className="text-text-muted">Posts from your closest friends</p>
      </div>
      <FeedView variant="close" />
    </div>
  );
}
import { useState } from 'react';
import AddFriendBar from '../components/AddFriendBar';
import RefreshButton from '../components/RefreshButton';
import { FeedView } from '../components/FeedView';

export function FollowingPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [spinning, setSpinning] = useState(false);

    const doRefresh = () => {
        setSpinning(true);
        setRefreshKey((k) => k + 1);
        setTimeout(() => setSpinning(false), 800);
    };

    return (
        <div>
            <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text mb-1 sm:mb-0">Following</h2>
                    <p className="text-text-muted">Posts from people you follow</p>
                </div>
                <div className="flex items-center gap-2 sm:ml-4">
                    <AddFriendBar />
                    <RefreshButton onClick={doRefresh} spinning={spinning} />
                </div>
            </div>

            <FeedView key={refreshKey} variant="following" />
        </div>
    );
}

import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';  // <-- useApp (not useAuth)

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { session } = useApp();
    const loc = useLocation();
    if (!session) return <Navigate to="/login" replace state={{ from: loc }} />;
    return children;
}

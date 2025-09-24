import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {AppProvider} from './contexts/AppContext';
import {AppShell} from './components/AppShell';
import {HomePage} from './pages/HomePage';
import {FollowingPage} from './pages/FollowingPage';
import {ClosePage} from './pages/ClosePage';
import {PrivatePage} from './pages/PrivatePage';
import {ActivitiesPage} from './pages/ActivitiesPage';
import {MeetsPage} from './pages/MeetsPage';
import {PostPage} from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import {SettingsPage} from './pages/SettingsPage';
import {ChatPage} from './pages/ChatPage';
import {NotFoundPage} from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
    return (
        <AppProvider>
            <Router>
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/forgot" element={<ForgotPasswordPage />} />
                    <Route path="/reset" element={<ResetPasswordPage />} />
                    {/* Private (gated) */}
                    <Route
                        element={
                            <ProtectedRoute>
                                <AppShell/>
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<HomePage/>}/>
                        <Route path="following" element={<FollowingPage/>}/>
                        <Route path="close" element={<ClosePage/>}/>
                        <Route path="private" element={<PrivatePage/>}/>
                        <Route path="activities" element={<ActivitiesPage/>}/>
                        <Route path="meets" element={<MeetsPage/>}/>
                        <Route path="post" element={<PostPage/>}/>
                        <Route path="profile/:user" element={<ProfilePage/>}/>
                        <Route path="settings" element={<SettingsPage/>}/>
                        <Route path="chat" element={<ChatPage/>}/>
                    </Route>

                    {/* 404 */}
                    <Route path="/404" element={<NotFoundPage/>}/>
                    <Route path="*" element={<Navigate to="/404" replace/>}/>
                </Routes>
            </Router>
        </AppProvider>
    );
}

export default App;

import { Routes, Route, Navigate, ScrollRestoration } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import OAuthCallbackPage from './features/auth/pages/OAuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './features/user/pages/ProfilePage';
import ActiveSessionsPage from './features/user/pages/ActiveSessionsPage';
import AccountSettingsPage from './features/user/pages/AccountSettingsPage';
import MFASetupPage from './features/user/pages/MFASetupPage';
import { FeedPage } from './pages/Feed';
import { ReviewDetailPage } from './pages/ReviewDetail';

function App() {
  return (
    <AuthProvider>
      <ScrollRestoration />
      <Routes>
        {/* Public routes */}
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/reviews/:id" element={<ReviewDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <ActiveSessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AccountSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/mfa/setup"
          element={
            <ProtectedRoute>
              <MFASetupPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

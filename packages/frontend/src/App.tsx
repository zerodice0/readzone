import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, ScrollRestoration } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import ProtectedRoute from './components/ProtectedRoute';
import { Skeleton } from './components/ui/skeleton';

// T113: Code splitting with React.lazy() for bundle optimization
// Public pages - Eager loaded (frequently accessed)
import { FeedPage } from './pages/Feed';
import { ReviewDetailPage } from './pages/ReviewDetail';

// Auth pages - Lazy loaded
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(
  () => import('./features/auth/pages/ForgotPasswordPage')
);
const ResetPasswordPage = lazy(
  () => import('./features/auth/pages/ResetPasswordPage')
);
const OAuthCallbackPage = lazy(
  () => import('./features/auth/pages/OAuthCallbackPage')
);

// Protected pages - Lazy loaded
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./features/user/pages/ProfilePage'));
const ActiveSessionsPage = lazy(
  () => import('./features/user/pages/ActiveSessionsPage')
);
const AccountSettingsPage = lazy(
  () => import('./features/user/pages/AccountSettingsPage')
);
const MFASetupPage = lazy(() => import('./features/user/pages/MFASetupPage'));

// T113: Loading fallback component
function PageLoader() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ScrollRestoration />
      {/* T113: Wrap routes in Suspense for lazy loading */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes - FeedPage and ReviewDetailPage are eager loaded */}
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/reviews/:id" element={<ReviewDetailPage />} />

          {/* Auth routes - Lazy loaded */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
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
      </Suspense>
    </AuthProvider>
  );
}

export default App;

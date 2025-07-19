import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';
import './styles/globals.css';

// Critical pages (loaded immediately)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const BookDetailPage = lazy(() => import('./pages/BookDetailPage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const ReadingGoalsPage = lazy(() => import('./pages/ReadingGoalsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Components
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import PerformanceMonitor from './components/dev/PerformanceMonitor';

function App() {
  const { isAuthenticated, token, refreshUser, isLoading } = useAuthStore();

  // Refresh user data on app load if authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUser();
    }
  }, [isAuthenticated, token, refreshUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Page loading fallback component
  const PageLoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
      <span className="ml-3 text-gray-600">페이지를 불러오는 중...</span>
    </div>
  );

  return (
    <Router>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/books/:isbn" element={<BookDetailPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/users/:userId" element={<UserProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <LibraryPage />
              </ProtectedRoute>
            } />
            <Route path="/reading-goals" element={
              <ProtectedRoute>
                <ReadingGoalsPage />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/statistics" element={
              <ProtectedRoute>
                <StatisticsPage />
              </ProtectedRoute>
            } />
            
            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      
      {/* Performance Monitor (development only) */}
      <PerformanceMonitor />
    </Router>
  );
}

export default App;

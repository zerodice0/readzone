import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import './styles/globals.css';

// Pages (will be created later)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import BookDetailPage from './pages/BookDetailPage';
import PostDetailPage from './pages/PostDetailPage';
import LibraryPage from './pages/LibraryPage';
import ReadingGoalsPage from './pages/ReadingGoalsPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';

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

  return (
    <Router>
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
          
          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

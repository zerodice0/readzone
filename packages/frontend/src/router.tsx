import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  ScrollRestoration,
  type RouteObject,
} from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Skeleton } from './components/ui/skeleton';
import { Layout } from './components/layout/Layout';

// T113: Code splitting with React.lazy() for bundle optimization
// Public pages - Eager loaded (most frequently accessed)
import { FeedPage } from './pages/Feed';
import { ReviewDetailPage } from './pages/ReviewDetail';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

// Clerk components for auth
import { SignIn, SignUp } from '@clerk/clerk-react';

// Public pages - Lazy loaded
const BooksPage = lazy(() => import('./pages/Books/BooksPage'));
const BookDetailPage = lazy(() => import('./pages/BookDetail/BookDetailPage'));

// Protected pages - Lazy loaded
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const ReviewNewPage = lazy(() => import('./pages/ReviewNew/ReviewNewPage'));
const ReviewEditPage = lazy(() => import('./pages/ReviewEdit/ReviewEditPage'));
// Note: MyReviewsPage and BookmarksPage are now integrated into DashboardPage as tabs

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

// Root layout component with ScrollRestoration
function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// Route configuration
const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      // Routes with Layout (Header + content)
      {
        element: (
          <Layout>
            <Outlet />
          </Layout>
        ),
        children: [
          // Public routes
          {
            path: '/feed',
            element: <FeedPage />,
          },
          {
            path: '/books',
            element: <BooksPage />,
          },
          {
            path: '/books/:id',
            element: <BookDetailPage />,
          },
          {
            path: '/reviews/:id',
            element: <ReviewDetailPage />,
          },

          // Protected routes
          {
            path: '/reviews/new',
            element: (
              <ProtectedRoute>
                <ReviewNewPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/reviews/:id/edit',
            element: (
              <ProtectedRoute>
                <ReviewEditPage />
              </ProtectedRoute>
            ),
          },
          {
            path: '/dashboard',
            element: (
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            ),
          },
          // Legacy routes - redirect to /dashboard
          {
            path: '/profile',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/my-reviews',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/bookmarks',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/account',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/sessions',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/settings',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/settings/mfa/setup',
            element: <Navigate to="/dashboard" replace />,
          },

          // Default redirect
          {
            path: '/',
            element: <Navigate to="/feed" replace />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },

      // Auth routes without Layout
      {
        path: '/sign-in/*',
        element: (
          <div className="flex items-center justify-center min-h-screen">
            <SignIn
              routing="path"
              path="/sign-in"
              fallbackRedirectUrl="/feed"
            />
          </div>
        ),
      },
      {
        path: '/sign-up/*',
        element: (
          <div className="flex items-center justify-center min-h-screen">
            <SignUp
              routing="path"
              path="/sign-up"
              fallbackRedirectUrl="/feed"
            />
          </div>
        ),
      },
    ],
  },
];

// Create the data router
export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routes);

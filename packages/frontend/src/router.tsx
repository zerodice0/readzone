import { Suspense, useEffect, useState } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigate,
  type RouteObject,
} from 'react-router-dom';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Skeleton } from './components/ui/skeleton';
import { Layout } from './components/layout/Layout';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { RouteErrorFallback } from './components/RouteErrorFallback';

// T113: Code splitting with React.lazy() for bundle optimization
// Public pages - Eager loaded (most frequently accessed)
import { FeedPage } from './pages/Feed';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { ClerkLoadingWrapper } from './components/ClerkLoadingWrapper';

// Public pages - Lazy loaded
const BooksPage = lazyWithRetry(
  () => import('./pages/Books/BooksPage'),
  'BooksPage'
);
const BookDetailPage = lazyWithRetry(
  () => import('./pages/BookDetail/BookDetailPage'),
  'BookDetailPage'
);
const ReviewDetailPage = lazyWithRetry(
  () =>
    import('./pages/ReviewDetail').then((module) => ({
      default: module.ReviewDetailPage,
    })),
  'ReviewDetailPage'
);

// Protected pages - Lazy loaded
const DashboardPage = lazyWithRetry(
  () => import('./pages/Dashboard/DashboardPage'),
  'DashboardPage'
);
const ReviewNewPage = lazyWithRetry(
  () => import('./pages/ReviewNew/ReviewNewPage'),
  'ReviewNewPage'
);
const ReviewEditPage = lazyWithRetry(
  () => import('./pages/ReviewEdit/ReviewEditPage'),
  'ReviewEditPage'
);
const ReadingDiaryPage = lazyWithRetry(
  () => import('./pages/ReadingDiary/ReadingDiaryPage'),
  'ReadingDiaryPage'
);
const ReadingDiaryNewPage = lazyWithRetry(
  () => import('./pages/ReadingDiaryNew/ReadingDiaryNewPage'),
  'ReadingDiaryNewPage'
);

// Auth pages - Lazy loaded
const SignInPage = lazyWithRetry(
  () => import('./features/auth/pages/SignInPage'),
  'SignInPage'
);
const SignUpPage = lazyWithRetry(
  () => import('./features/auth/pages/SignUpPage'),
  'SignUpPage'
);
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
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <PageLoader />;
  }

  if (!isSignedIn) {
    const redirectUrl = `${location.pathname}${location.search}${location.hash}`;

    return (
      <Navigate
        to={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}

function SsoCallbackPage() {
  const clerk = useClerk();
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void clerk
      .handleRedirectCallback({}, (to) => {
        if (to.startsWith('/') && !to.startsWith('//')) {
          void navigate(to, { replace: true });
          return Promise.resolve();
        }

        window.location.assign(to);
        return Promise.resolve();
      })
      .catch(() => {
        if (isMounted) {
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clerk, navigate]);

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-50 px-4">
        <div className="max-w-sm text-center">
          <p className="font-medium text-stone-900">
            로그인을 완료하지 못했습니다.
          </p>
          <p className="mt-2 text-sm text-stone-600">
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </div>
    );
  }

  return <PageLoader />;
}

// Route configuration
const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorFallback />,
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
              <RequireAuth>
                <ReviewNewPage />
              </RequireAuth>
            ),
          },
          {
            path: '/reviews/:id/edit',
            element: (
              <RequireAuth>
                <ReviewEditPage />
              </RequireAuth>
            ),
          },
          {
            path: '/dashboard',
            element: (
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            ),
          },
          {
            path: '/reading-diary',
            element: (
              <RequireAuth>
                <ReadingDiaryPage />
              </RequireAuth>
            ),
          },
          {
            path: '/reading-diary/new',
            element: (
              <RequireAuth>
                <ReadingDiaryNewPage />
              </RequireAuth>
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
      // ClerkLoadingWrapper: iOS Chrome(WKWebView) cross-origin 쿠키 제한 대응
      {
        path: '/sign-in/*',
        element: (
          <ClerkLoadingWrapper>
            <SignInPage />
          </ClerkLoadingWrapper>
        ),
      },
      {
        path: '/sign-up/*',
        element: (
          <ClerkLoadingWrapper>
            <SignUpPage />
          </ClerkLoadingWrapper>
        ),
      },
      {
        path: '/sso-callback',
        element: (
          <ClerkLoadingWrapper>
            <SsoCallbackPage />
          </ClerkLoadingWrapper>
        ),
      },
    ],
  },
];

// Create the data router
export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter(routes);

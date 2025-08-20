import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './styles/globals.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';
// Import the generated route tree
import { routeTree } from './routeTree.gen';
// Create a QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5분
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
        },
        mutations: {
            retry: 1,
        },
    },
});
// Create a new router instance
const router = createRouter({ routeTree });
const root = document.getElementById('root');
if (!root) {
    throw new Error('Root element not found');
}
createRoot(root).render(_jsx(StrictMode, { children: _jsxs(QueryClientProvider, { client: queryClient, children: [_jsx(RouterProvider, { router: router }), _jsx(Toaster, {})] }) }));

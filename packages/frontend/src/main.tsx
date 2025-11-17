import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import './index.css';

const rootElement: HTMLElement | null = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* T114: Wrap app in ErrorBoundary */}
    <ErrorBoundary>
      <App>
        <RouterProvider router={router} />
      </App>
      <Toaster position="top-right" expand={false} richColors />
    </ErrorBoundary>
  </React.StrictMode>
);

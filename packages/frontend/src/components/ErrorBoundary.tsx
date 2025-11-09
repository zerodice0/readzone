import React from 'react';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * T114: Error Boundary Component
 * Catches React errors and displays fallback UI
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, errorInfo);

    // TODO: Send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">문제가 발생했습니다</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              페이지 새로고침
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/feed';
              }}
            >
              홈으로 이동
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Enhanced error boundary for draft components
 * Provides accessible error states and recovery options
 */
export class DraftErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Draft component error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <div 
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
              aria-hidden="true"
            >
              <svg 
                className="w-8 h-8 text-red-600 dark:text-red-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            <h3 
              className="text-lg font-medium text-red-900 dark:text-red-100 mb-2"
              id="error-title"
            >
              문제가 발생했습니다
            </h3>
            
            <p 
              className="text-sm text-red-700 dark:text-red-300 mb-4"
              aria-describedby="error-title"
            >
              독후감 초안을 불러오는 중 오류가 발생했습니다. 
              다시 시도하거나 페이지를 새로고침해 주세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="독후감 초안 다시 불러오기"
              >
                다시 시도
              </Button>
              
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                className="focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="페이지 새로고침"
              >
                페이지 새로고침
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                  개발자 정보
                </summary>
                <pre className="mt-2 text-xs text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for consistent error handling across draft components
 */
export function useDraftErrorHandler() {
  const handleError = (error: Error, context: string = 'Draft operation') => {
    console.error(`${context}:`, error)
    
    // Could integrate with error reporting service here
    // Example: Sentry, LogRocket, etc.
    
    return {
      message: error.message || '알 수 없는 오류가 발생했습니다',
      isNetworkError: error.message.includes('fetch') || error.message.includes('network'),
      isValidationError: error.message.includes('validation') || error.message.includes('invalid'),
    }
  }

  return { handleError }
}
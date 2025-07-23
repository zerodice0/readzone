import { AlertTriangle, RefreshCw, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface ErrorDisplayProps {
  title?: string
  message: string
  type?: 'network' | 'not-found' | 'permission' | 'generic'
  onRetry?: () => void
  showRetry?: boolean
  showNavigation?: boolean
  className?: string
}

const errorConfig = {
  network: {
    icon: RefreshCw,
    title: '네트워크 오류',
    defaultMessage: '네트워크 연결을 확인하고 다시 시도해주세요.',
    retryLabel: '다시 시도'
  },
  'not-found': {
    icon: Search,
    title: '데이터를 찾을 수 없습니다',
    defaultMessage: '요청하신 정보를 찾을 수 없습니다.',
    retryLabel: '새로고침'
  },
  permission: {
    icon: AlertTriangle,
    title: '접근 권한이 없습니다',
    defaultMessage: '이 기능을 사용하려면 로그인이 필요합니다.',
    retryLabel: '다시 시도'
  },
  generic: {
    icon: AlertTriangle,
    title: '오류가 발생했습니다',
    defaultMessage: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryLabel: '다시 시도'
  }
}

export function ErrorDisplay({
  title,
  message,
  type = 'generic',
  onRetry,
  showRetry = true,
  showNavigation = false,
  className = ""
}: ErrorDisplayProps) {
  const config = errorConfig[type]
  const Icon = config.icon
  const displayTitle = title || config.title
  const displayMessage = message || config.defaultMessage

  return (
    <Card className={`p-8 text-center ${className}`}>
      <div 
        className="flex flex-col items-center"
        role="alert"
        aria-live="assertive"
      >
        <Icon 
          className="h-16 w-16 mx-auto mb-4 text-gray-400" 
          aria-hidden="true"
        />
        
        <h2 className="text-xl font-semibold mb-2 text-gray-900">
          {displayTitle}
        </h2>
        
        <p className="text-gray-600 mb-6 leading-relaxed max-w-md">
          {displayMessage}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {config.retryLabel}
            </Button>
          )}
          
          {showNavigation && (
            <>
              <Button asChild variant={showRetry ? "outline" : "default"}>
                <Link href="/" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  홈으로 돌아가기
                </Link>
              </Button>
              
              {type === 'not-found' && (
                <Button variant="outline" asChild>
                  <Link href="/search" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    도서 검색하기
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>
        
        {type === 'permission' && (
          <div className="mt-6 pt-4 border-t text-sm text-gray-500">
            <p>
              계정이 없으신가요?{' '}
              <Link 
                href="/register" 
                className="text-primary-600 hover:text-primary-700 underline"
              >
                회원가입하기
              </Link>
            </p>
          </div>
        )}
        
        {(type === 'network' || type === 'generic') && (
          <div className="mt-6 pt-4 border-t text-sm text-gray-500">
            <p>
              문제가 지속된다면{' '}
              <a 
                href="mailto:support@readzone.com" 
                className="text-primary-600 hover:text-primary-700 underline"
              >
                고객지원
              </a>
              으로 문의해 주세요.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
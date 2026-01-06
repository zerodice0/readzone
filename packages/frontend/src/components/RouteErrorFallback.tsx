import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

/**
 * T114: React Router 에러 핸들링을 위한 폴백 컴포넌트
 * 라우트 레벨에서 발생하는 에러를 포착하여 사용자에게 복구 옵션 제공
 */
export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  // 에러 메시지 분석을 통해 Chunk 로딩 에러인지 판단
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const isChunkError =
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Loading chunk');

  const handleRefresh = () => window.location.reload();
  const handleGoHome = () => navigate('/feed', { replace: true });

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-background rounded-lg border border-border my-8">
      <div className="bg-destructive/10 p-4 rounded-full mb-6">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>

      <h1 className="text-2xl font-bold mb-3 tracking-tight">
        {isChunkError ? '앱 업데이트가 필요합니다' : '문제가 발생했습니다'}
      </h1>

      <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
        {isChunkError
          ? '새로운 버전이 배포되었습니다. 최신 기능을 사용하려면 페이지를 새로고침 해주세요.'
          : '요청하신 페이지를 불러오는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mx-auto">
        <Button
          onClick={handleRefresh}
          className="flex-1 font-semibold shadow-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          페이지 새로고침
        </Button>
        <Button
          variant="outline"
          onClick={handleGoHome}
          className="flex-1 font-medium"
        >
          <Home className="w-4 h-4 mr-2" />
          홈으로 이동
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-8 p-4 bg-muted text-muted-foreground text-xs rounded-md overflow-auto max-w-full text-left">
          {errorMessage}
        </pre>
      )}
    </div>
  );
}

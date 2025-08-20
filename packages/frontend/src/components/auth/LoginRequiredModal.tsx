import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: {
    title: string;
    description: string;
  } | undefined;
  redirectTo?: string | undefined;
}

export const LoginRequiredModal = ({
  isOpen,
  onClose,
  message = {
    title: '로그인 필요',
    description: '이 기능을 사용하려면 로그인이 필요합니다.'
  },
  redirectTo
}: LoginRequiredModalProps) => {
  const navigate = useNavigate();

  if (!isOpen) {
    return null;
  }

  const handleLogin = () => {
    onClose();
    const currentPath = redirectTo ?? window.location.pathname + window.location.search;

    navigate({ to: `/login?redirect=${encodeURIComponent(currentPath)}` });
  };

  const handleBrowse = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{message.title}</CardTitle>
          <CardDescription>
            {message.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>ReadZone에서 다음과 같은 기능을 이용할 수 있습니다:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>독후감 작성 및 공유</li>
              <li>다른 사용자와 소통</li>
              <li>개인화된 피드 경험</li>
              <li>독서 기록 관리</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleBrowse} className="flex-1">
            계속 둘러보기
          </Button>
          <Button onClick={handleLogin} className="flex-1">
            로그인하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

/**
 * 전역 로그인 필요 모달 컨테이너
 */
export const GlobalLoginRequiredModal = () => {
  const { loginRequiredModal, setLoginRequiredModal } = useAuthStore();

  const handleClose = () => {
    setLoginRequiredModal({
      isOpen: false,
      message: undefined as { title: string; description: string; } | undefined,
      redirectTo: undefined as string | undefined
    });
  };

  return (
    <LoginRequiredModal
      isOpen={loginRequiredModal.isOpen}
      onClose={handleClose}
      message={loginRequiredModal.message}
      redirectTo={loginRequiredModal.redirectTo}
    />
  );
};
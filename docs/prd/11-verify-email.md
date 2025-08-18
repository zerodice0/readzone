# 11. 이메일 인증 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/verify-email`
- **우선순위**: 3순위 (Enhanced Features)
- **설명**: 회원가입/이메일 변경 후 이메일 인증 처리
- **인증**: 비로그인 접근 가능

## 📋 참조 문서

### 사용자 플로우
- **[신규 사용자 여정](../user-flows/onboarding.md)** - 회원가입 후 이메일 인증 처리
- **[오류 처리](../user-flows/error-handling.md)** - 토큰 만료, 인증 실패 처리

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 이메일 인증의 온보딩 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 인증 체인 및 신규 사용자 온보딩 흐름

### 관련 PRD 문서
- **[회원가입 페이지](./03-register.md)** - 회원가입 후 이메일 인증 연결
- **[로그인 페이지](./02-login.md)** - 인증 완료 후 로그인 처리
- **[비밀번호 찾기 페이지](./12-forgot-password.md)** - 이메일 인증 시스템 공유
- **[메인 피드 페이지](./01-main-feed.md)** - 인증 완료 후 서비스 이용

## 핵심 기능

### 1. 이메일 인증 토큰 처리
- **토큰 검증**: URL 파라미터 토큰 자동 검증
- **만료 시간 확인**: 24시간 유효기간 체크
- **일회성 처리**: 이미 사용된 토큰 재사용 방지
- **자동 로그인**: 인증 성공 시 자동 로그인 (신규 가입자만)

### 2. 인증 상태별 UI
- **로딩 상태**: 토큰 검증 중 로딩 스피너
- **성공 상태**: 인증 완료 메시지 + 자동 리다이렉트
- **실패 상태**: 오류 메시지 + 재발송 옵션
- **만료 상태**: 만료 안내 + 재발송 버튼

### 3. 이메일 재발송 기능
- **재발송 제한**: 1분 간격 제한 + 일일 5회 제한
- **쿨다운 타이머**: 재발송까지 남은 시간 표시
- **이메일 변경**: 다른 이메일로 재발송 옵션
- **스팸 방지**: reCAPTCHA 통합

### 4. 사용자 안내 및 지원
- **진행 상황 표시**: 단계별 진행률 (가입 → 이메일 발송 → 인증 완료)
- **이메일 확인 가이드**: 이메일 앱 열기 버튼들
- **스팸함 안내**: 스팸함 확인 안내 메시지
- **고객 지원**: 문제 신고 연결

## 필요한 API

### GET `/api/auth/verify-email`
```typescript
interface VerifyEmailRequest {
  token: string;
  type?: 'signup' | 'email_change';
}

interface VerifyEmailResponse {
  success: boolean;
  status: 'verified' | 'invalid_token' | 'expired' | 'already_verified' | 'user_not_found';
  message: string;
  
  // 인증 성공 시 제공
  user?: {
    id: string;
    username: string;
    email: string;
    isEmailVerified: boolean;
  };
  
  // 자동 로그인용 토큰 (신규 가입자만)
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  
  // 리다이렉트 정보
  redirectUrl?: string;
  
  // 재발송 가능 여부
  canResend: boolean;
  resendAvailableAt?: string; // 다음 재발송 가능 시간
  dailyResendLimit: {
    used: number;
    limit: number;
    resetAt: string;
  };
}
```

### POST `/api/auth/resend-verification`
```typescript
interface ResendVerificationRequest {
  email?: string; // 미제공 시 기존 이메일 사용
  type: 'signup' | 'email_change';
  recaptchaToken?: string; // 재발송 횟수 초과 시 필수
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
  
  // 발송 정보
  sentTo: string; // 마스킹된 이메일 주소
  expiresAt: string;
  
  // 제한 정보
  nextResendAvailableAt: string;
  dailyResendLimit: {
    used: number;
    limit: number;
    resetAt: string;
  };
  
  // reCAPTCHA 필요 여부
  requiresCaptcha: boolean;
}
```

### GET `/api/auth/verification-status`
```typescript
interface VerificationStatusRequest {
  email: string;
  type: 'signup' | 'email_change';
}

interface VerificationStatusResponse {
  isVerified: boolean;
  hasPendingVerification: boolean;
  lastSentAt?: string;
  expiresAt?: string;
  canResend: boolean;
  nextResendAvailableAt?: string;
  
  dailyResendLimit: {
    used: number;
    limit: number;
    resetAt: string;
  };
}
```

### POST `/api/auth/change-verification-email`
```typescript
interface ChangeVerificationEmailRequest {
  currentToken: string;
  newEmail: string;
  recaptchaToken?: string;
}

interface ChangeVerificationEmailResponse {
  success: boolean;
  message: string;
  newVerificationSent: boolean;
  
  // 새 이메일 정보
  sentTo: string; // 마스킹된 이메일 주소
  expiresAt: string;
  
  // 기존 토큰 무효화 확인
  previousTokenInvalidated: boolean;
}
```

## 컴포넌트 구조

### 1. EmailVerificationPage (메인 컴포넌트)
```typescript
interface EmailVerificationPageProps {
  token?: string;
  type?: 'signup' | 'email_change';
}

// 상태 관리
- verificationStatus: 'loading' | 'success' | 'failed' | 'expired' | 'invalid'
- user: User | null
- tokens: AuthTokens | null
- error: string | null
- canResend: boolean
- resendCooldown: number
- dailyLimitInfo: DailyLimitInfo
```

### 2. VerificationSteps (진행 단계)
```typescript
interface VerificationStepsProps {
  currentStep: 'sent' | 'verifying' | 'completed';
  type: 'signup' | 'email_change';
}

// 단계별 표시
- 1단계: 이메일 발송됨
- 2단계: 인증 진행 중 (토큰 검증)
- 3단계: 인증 완료
```

### 3. VerificationSuccess (인증 성공)
```typescript
interface VerificationSuccessProps {
  user: User;
  type: 'signup' | 'email_change';
  redirectUrl?: string;
  autoRedirectSeconds: number;
  onRedirect: () => void;
}

// 기능
- 환영 메시지 표시
- 자동 리다이렉트 카운트다운
- 수동 리다이렉트 버튼
- 추가 설정 안내 (신규 가입자)
```

### 4. VerificationFailed (인증 실패)
```typescript
interface VerificationFailedProps {
  error: string;
  status: 'invalid_token' | 'expired' | 'already_verified';
  canResend: boolean;
  resendCooldown: number;
  dailyLimitInfo: DailyLimitInfo;
  onResend: () => Promise<void>;
  onChangeEmail: (newEmail: string) => Promise<void>;
}

// 실패 타입별 메시지
- 잘못된 토큰: 토큰이 올바르지 않음
- 만료된 토큰: 24시간 경과로 만료
- 이미 인증됨: 이미 인증 완료된 계정
```

### 5. ResendVerification (재발송 섹션)
```typescript
interface ResendVerificationProps {
  currentEmail: string;
  canResend: boolean;
  cooldownSeconds: number;
  dailyLimit: DailyLimitInfo;
  requiresCaptcha: boolean;
  onResend: () => Promise<void>;
  onChangeEmail: (email: string) => Promise<void>;
  isLoading: boolean;
}

// 재발송 제한 UI
- 쿨다운 타이머
- 일일 제한 표시
- reCAPTCHA 위젯
- 이메일 변경 옵션
```

### 6. CooldownTimer (쿨다운 타이머)
```typescript
interface CooldownTimerProps {
  seconds: number;
  onComplete: () => void;
  format?: 'mm:ss' | 'text';
}

// 타이머 표시
- 남은 시간 실시간 업데이트
- 완료 시 콜백 호출
- 다양한 표시 형식
```

### 7. EmailClientButtons (이메일 앱 버튼)
```typescript
interface EmailClientButtonsProps {
  email: string;
  onClientOpen: (client: string) => void;
}

// 이메일 클라이언트별 딥링크
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- 기본 메일 앱
```

### 8. ChangeEmailModal (이메일 변경 모달)
```typescript
interface ChangeEmailModalProps {
  isOpen: boolean;
  currentEmail: string;
  onClose: () => void;
  onConfirm: (newEmail: string) => Promise<void>;
  isLoading: boolean;
}

// 이메일 변경 기능
- 새 이메일 주소 입력
- 유효성 검증
- 중복 확인
- 기존 토큰 무효화 안내
```

## 상태 관리 (Zustand)

### EmailVerificationStore
```typescript
interface EmailVerificationState {
  // 상태
  verificationStatus: 'loading' | 'success' | 'failed' | 'expired' | 'invalid' | null;
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
  
  // 재발송 상태
  canResend: boolean;
  resendCooldown: number;
  dailyLimitInfo: DailyLimitInfo | null;
  requiresCaptcha: boolean;
  
  // UI 상태
  isResending: boolean;
  isChangingEmail: boolean;
  autoRedirectSeconds: number;
  
  // 액션
  verifyEmail: (token: string, type?: string) => Promise<void>;
  resendVerification: (email?: string, recaptchaToken?: string) => Promise<void>;
  changeVerificationEmail: (currentToken: string, newEmail: string) => Promise<void>;
  checkVerificationStatus: (email: string, type: string) => Promise<void>;
  
  // 타이머 관련
  startCooldownTimer: (seconds: number) => void;
  startAutoRedirectTimer: (seconds: number, callback: () => void) => void;
  
  // 유틸리티
  reset: () => void;
  setError: (error: string) => void;
  clearError: () => void;
}
```

## 이메일 인증 플로우

### 토큰 검증 로직
```typescript
const useEmailVerification = (token?: string, type?: string) => {
  const {
    verificationStatus,
    verifyEmail,
    startAutoRedirectTimer,
    reset
  } = useEmailVerificationStore();
  
  const router = useRouter();
  
  // 토큰이 있으면 자동 검증
  useEffect(() => {
    if (token) {
      verifyEmail(token, type);
    }
  }, [token, type]);
  
  // 인증 성공 시 자동 리다이렉트 시작
  useEffect(() => {
    if (verificationStatus === 'success') {
      startAutoRedirectTimer(5, () => {
        // 신규 가입자는 메인 페이지로, 이메일 변경은 설정 페이지로
        const redirectUrl = type === 'signup' ? '/' : '/settings';
        router.push(redirectUrl);
      });
    }
    
    return () => {
      // 컴포넌트 언마운트 시 타이머 정리
      reset();
    };
  }, [verificationStatus, type]);
  
  return {
    verificationStatus,
    // ... 기타 상태들
  };
};
```

### 재발송 쿨다운 구현
```typescript
const useCooldownTimer = (initialSeconds: number) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(initialSeconds > 0);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds]);
  
  const start = (newSeconds: number) => {
    setSeconds(newSeconds);
    setIsActive(true);
  };
  
  const stop = () => {
    setIsActive(false);
    setSeconds(0);
  };
  
  const formatTime = (secs: number): string => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return {
    seconds,
    isActive,
    formattedTime: formatTime(seconds),
    start,
    stop
  };
};

const ResendButton: React.FC<{
  onResend: () => Promise<void>;
  cooldownSeconds: number;
  dailyLimit: DailyLimitInfo;
  requiresCaptcha: boolean;
}> = ({ onResend, cooldownSeconds, dailyLimit, requiresCaptcha }) => {
  const { seconds, isActive, formattedTime, start } = useCooldownTimer(cooldownSeconds);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  
  const canResend = !isActive && dailyLimit.used < dailyLimit.limit && (!requiresCaptcha || captchaToken);
  
  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      await onResend();
      start(60); // 1분 쿨다운 시작
      setCaptchaToken(undefined); // reCAPTCHA 리셋
      toast.success('인증 이메일을 재발송했습니다');
    } catch (error: any) {
      toast.error(error.message || '재발송에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* 일일 제한 표시 */}
      <div className="text-sm text-gray-600">
        오늘 {dailyLimit.used}/{dailyLimit.limit}회 발송
        {dailyLimit.used >= dailyLimit.limit && (
          <span className="text-red-600 ml-2">
            (일일 제한 도달, 내일 {new Date(dailyLimit.resetAt).toLocaleTimeString()} 초기화)
          </span>
        )}
      </div>
      
      {/* reCAPTCHA */}
      {requiresCaptcha && (
        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
          onChange={setCaptchaToken}
          onExpired={() => setCaptchaToken(undefined)}
        />
      )}
      
      {/* 재발송 버튼 */}
      <button
        onClick={handleResend}
        disabled={!canResend || isLoading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          canResend
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            발송 중...
          </div>
        ) : isActive ? (
          `재발송 (${formattedTime} 후 가능)`
        ) : dailyLimit.used >= dailyLimit.limit ? (
          '일일 제한 도달'
        ) : requiresCaptcha && !captchaToken ? (
          '보안 문자 확인 필요'
        ) : (
          '인증 이메일 재발송'
        )}
      </button>
    </div>
  );
};
```

## 이메일 클라이언트 딥링크

### 이메일 앱 바로가기
```typescript
const EmailClientButtons: React.FC<{
  email: string;
  onClientOpen: (client: string) => void;
}> = ({ email, onClientOpen }) => {
  const clients = [
    {
      name: 'Gmail',
      icon: '📧',
      url: 'https://mail.google.com/mail/u/0/#search/in%3Ainbox+from%3Anoreply%40readzone.com',
      color: 'red'
    },
    {
      name: 'Outlook',
      icon: '📮',
      url: 'https://outlook.live.com/mail/0/inbox',
      color: 'blue'
    },
    {
      name: 'Yahoo',
      icon: '💌',
      url: 'https://mail.yahoo.com/d/folders/1',
      color: 'purple'
    },
    {
      name: '기본 메일',
      icon: '📬',
      url: `mailto:?subject=${encodeURIComponent('ReadZone 이메일 인증')}`,
      color: 'gray'
    }
  ];
  
  const handleClientClick = (client: typeof clients[0]) => {
    window.open(client.url, '_blank', 'noopener,noreferrer');
    onClientOpen(client.name);
    
    // 사용자 경험 개선: 브라우저 포커스 복원
    setTimeout(() => {
      window.focus();
    }, 1000);
  };
  
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        <strong>{email.replace(/(.{3}).*(@.*)/, '$1***$2')}</strong>로 인증 이메일을 발송했습니다.
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        {clients.map(client => (
          <button
            key={client.name}
            onClick={() => handleClientClick(client)}
            className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg border border-${client.color}-200 text-${client.color}-700 hover:bg-${client.color}-50 transition-colors`}
          >
            <span className="mr-2 text-lg">{client.icon}</span>
            {client.name}
          </button>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 이메일이 보이지 않으면 스팸함을 확인해보세요</p>
        <p>• 발신자: noreply@readzone.com</p>
        <p>• 인증 링크는 24시간 동안 유효합니다</p>
      </div>
    </div>
  );
};
```

## 오류 상황별 UI

### 상태별 컴포넌트
```typescript
const VerificationStatusDisplay: React.FC<{
  status: string;
  error?: string;
  onRetry: () => void;
}> = ({ status, error, onRetry }) => {
  const statusConfig = {
    loading: {
      icon: '⏳',
      title: '인증 확인 중...',
      message: '이메일 인증을 확인하고 있습니다. 잠시만 기다려주세요.',
      showSpinner: true
    },
    success: {
      icon: '✅',
      title: '이메일 인증 완료!',
      message: '이메일 인증이 성공적으로 완료되었습니다. 곧 메인 페이지로 이동합니다.',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800'
    },
    invalid_token: {
      icon: '❌',
      title: '잘못된 인증 링크',
      message: '인증 링크가 올바르지 않습니다. 새로운 인증 이메일을 요청해주세요.',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      showResend: true
    },
    expired: {
      icon: '⏰',
      title: '인증 시간 만료',
      message: '인증 링크가 만료되었습니다. (유효기간: 24시간)',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      showResend: true
    },
    already_verified: {
      icon: '✅',
      title: '이미 인증 완료',
      message: '이미 이메일 인증이 완료된 계정입니다.',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      showLogin: true
    },
    user_not_found: {
      icon: '❓',
      title: '사용자를 찾을 수 없음',
      message: '해당하는 사용자 계정을 찾을 수 없습니다.',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800',
      showSignup: true
    }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  
  if (!config) {
    return <div>알 수 없는 오류가 발생했습니다.</div>;
  }
  
  return (
    <div className={`p-6 rounded-lg ${config.bgColor || 'bg-gray-50'}`}>
      <div className="text-center space-y-4">
        <div className="text-4xl">{config.icon}</div>
        
        <div>
          <h2 className={`text-xl font-semibold ${config.textColor || 'text-gray-800'}`}>
            {config.title}
          </h2>
          <p className={`mt-2 ${config.textColor || 'text-gray-600'}`}>
            {config.message}
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">
              오류 상세: {error}
            </p>
          )}
        </div>
        
        {config.showSpinner && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
        
        {config.showResend && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            새 인증 이메일 받기
          </button>
        )}
        
        {config.showLogin && (
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            로그인하기
          </Link>
        )}
        
        {config.showSignup && (
          <Link
            href="/register"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            회원가입하기
          </Link>
        )}
      </div>
    </div>
  );
};
```

## SEO 및 메타태그

### 동적 메타태그 설정
```typescript
const EmailVerificationHead: React.FC<{
  status: string;
  type: string;
}> = ({ status, type }) => {
  const getTitle = () => {
    if (status === 'success') {
      return '이메일 인증 완료 | ReadZone';
    }
    if (type === 'signup') {
      return '회원가입 이메일 인증 | ReadZone';
    }
    return '이메일 변경 인증 | ReadZone';
  };
  
  const getDescription = () => {
    if (status === 'success') {
      return 'ReadZone 이메일 인증이 완료되었습니다.';
    }
    return 'ReadZone 이메일 인증을 진행해주세요.';
  };
  
  return (
    <Head>
      <title>{getTitle()}</title>
      <meta name="description" content={getDescription()} />
      <meta name="robots" content="noindex,nofollow" /> {/* 검색 엔진 색인 방지 */}
    </Head>
  );
};
```

## 접근성

### 스크린 리더 지원
```typescript
// 인증 진행 상황 안내
<div role="status" aria-live="polite">
  {verificationStatus === 'loading' && (
    <p className="sr-only">이메일 인증을 확인하고 있습니다.</p>
  )}
  {verificationStatus === 'success' && (
    <p className="sr-only">이메일 인증이 완료되었습니다. 5초 후 메인 페이지로 이동합니다.</p>
  )}
  {verificationStatus === 'failed' && (
    <p className="sr-only">이메일 인증에 실패했습니다. 새로운 인증 이메일을 요청해주세요.</p>
  )}
</div>

// 쿨다운 타이머 접근성
<button
  disabled={!canResend}
  aria-describedby="resend-status"
  className="..."
>
  재발송
</button>
<div id="resend-status" className="sr-only">
  {isActive 
    ? `${formattedTime} 후 재발송 가능합니다`
    : '지금 재발송 가능합니다'
  }
</div>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (페이지 렌더링)
- **FID**: < 100ms (버튼 클릭 응답성)
- **CLS**: < 0.1 (상태 변경 시 레이아웃 안정성)

### 사용자 경험 지표
- 토큰 검증: < 2초
- 재발송 처리: < 3초
- 자동 리다이렉트: 5초 카운트다운
- 타이머 업데이트: 정확한 1초 간격
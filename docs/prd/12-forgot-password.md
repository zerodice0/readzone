# 12. 비밀번호 찾기 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/forgot-password`
- **우선순위**: 3순위 (Enhanced Features)
- **설명**: 비밀번호 재설정 요청 및 처리
- **인증**: 비로그인 접근 가능

## 📋 참조 문서

### 사용자 플로우
- **[신규 사용자 여정](../user-flows/onboarding.md)** - 비밀번호 찾기, 미가입자 초대 링크
- **[오류 처리](../user-flows/error-handling.md)** - 이메일 발송 실패, 토큰 오류

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 비밀번호 찾기의 복구 체인
- **[사용자 흐름도 개요](../user-flows.md)** - 인증 체인 및 복구 흐름

### 관련 PRD 문서
- **[로그인 페이지](./02-login.md)** - 비밀번호 찾기 진입점
- **[회원가입 페이지](./03-register.md)** - 비밀번호 정책 및 보안 고려사항 공유
- **[설정 페이지](./08-settings.md)** - 비밀번호 변경 정책 공유
- **[이메일 인증 페이지](./11-verify-email.md)** - 이메일 인증 시스템 공유

## 핵심 기능

### 1. 비밀번호 재설정 요청
- **이메일 입력**: 가입된 이메일 주소 입력
- **계정 존재 확인**: 가입된 계정 여부 검증 (보안상 결과 노출 안함)
- **재설정 이메일 발송**: 비밀번호 재설정 링크 포함 이메일 발송
- **스팸 방지**: reCAPTCHA 통합 + 발송 제한

### 2. 비밀번호 재설정 처리
- **토큰 검증**: URL 파라미터 토큰 자동 검증
- **새 비밀번호 설정**: 강도 검사 + 확인 입력
- **일회성 토큰**: 사용 후 즉시 무효화
- **자동 로그인**: 재설정 성공 시 자동 로그인

### 3. 보안 강화 기능
- **발송 제한**: IP별 시간당 3회, 이메일별 일일 5회 제한
- **토큰 만료**: 1시간 유효기간
- **강력한 비밀번호**: 복합 조건 검증
- **세션 무효화**: 비밀번호 변경 시 모든 기존 세션 무효화

### 4. 사용자 지원
- **미가입자 안내**: 가입되지 않은 이메일의 경우 회원가입 유도
- **진행 상황 안내**: 단계별 가이드
- **이메일 확인 도움**: 스팸함 안내, 이메일 앱 바로가기
- **고객 지원**: 추가 도움이 필요한 경우 연결

## 필요한 API

### POST `/api/auth/forgot-password`
```typescript
interface ForgotPasswordRequest {
  email: string;
  recaptchaToken: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  
  // 보안상 실제 발송 여부는 노출하지 않음
  // 모든 경우에 동일한 응답
  sentTo: string; // 마스킹된 이메일 주소 (a***@example.com)
  
  // 제한 정보
  rateLimitInfo: {
    remainingAttempts: number;
    resetAt: string; // 다음 시도 가능 시간
    dailyLimitReached: boolean;
  };
  
  // 미가입자인 경우에만 제공
  suggestedActions?: {
    signup: boolean;
    message: string;
  };
}
```

### GET `/api/auth/reset-password`
```typescript
interface ResetPasswordGetRequest {
  token: string;
}

interface ResetPasswordGetResponse {
  success: boolean;
  status: 'valid' | 'invalid' | 'expired' | 'used';
  message: string;
  
  // 토큰이 유효한 경우만 제공
  tokenInfo?: {
    email: string; // 마스킹된 이메일
    expiresAt: string;
    createdAt: string;
  };
  
  // 오류인 경우 재발송 가능 여부
  canRequestNew: boolean;
}
```

### POST `/api/auth/reset-password`
```typescript
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
  
  // 성공 시 자동 로그인용 토큰
  user?: {
    id: string;
    username: string;
    email: string;
  };
  
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
  
  // 실패 시 오류 정보
  errors?: Array<{
    field: string;
    message: string;
  }>;
  
  // 무효화된 세션 수
  invalidatedSessions?: number;
}
```

### GET `/api/auth/reset-status`
```typescript
interface ResetStatusRequest {
  email: string;
}

interface ResetStatusResponse {
  // 보안상 계정 존재 여부는 노출하지 않음
  canSendReset: boolean;
  lastSentAt?: string;
  nextAllowedAt?: string;
  
  rateLimitInfo: {
    dailyCount: number;
    dailyLimit: number;
    hourlyCount: number;
    hourlyLimit: number;
    resetAt: string;
  };
}
```

## 컴포넌트 구조

### 1. ForgotPasswordPage (메인 컴포넌트)
```typescript
interface ForgotPasswordPageProps {
  token?: string; // URL에서 추출된 재설정 토큰
}

// 상태 관리
- mode: 'request' | 'reset' | 'success'
- email: string
- isLoading: boolean
- error: string | null
- sentTo: string | null
- rateLimitInfo: RateLimitInfo | null
- tokenStatus: 'valid' | 'invalid' | 'expired' | 'used' | null
```

### 2. RequestResetForm (재설정 요청 폼)
```typescript
interface RequestResetFormProps {
  onSubmit: (data: { email: string; recaptchaToken: string }) => Promise<void>;
  isLoading: boolean;
  rateLimitInfo?: RateLimitInfo;
}

// 폼 필드
- 이메일 주소 입력
- reCAPTCHA 검증
- 제출 버튼 (제한 시 비활성화)
- 로그인 페이지 링크
```

### 3. ResetPasswordForm (새 비밀번호 설정)
```typescript
interface ResetPasswordFormProps {
  token: string;
  email: string; // 마스킹된 이메일
  onSubmit: (data: ResetPasswordRequest) => Promise<void>;
  isLoading: boolean;
}

// 폼 필드
- 새 비밀번호 입력 (강도 표시)
- 비밀번호 확인 입력
- 제출 버튼
- 비밀번호 표시/숨김 토글
```

### 4. EmailSentConfirmation (이메일 발송 확인)
```typescript
interface EmailSentConfirmationProps {
  sentTo: string; // 마스킹된 이메일
  onRequestAnother: () => void;
  rateLimitInfo: RateLimitInfo;
}

// 표시 내용
- 발송 확인 메시지
- 이메일 확인 가이드
- 스팸함 안내
- 이메일 앱 바로가기
- 다른 이메일로 재요청 옵션
```

### 5. ResetSuccess (재설정 성공)
```typescript
interface ResetSuccessProps {
  user: User;
  autoRedirectSeconds: number;
  onRedirect: () => void;
}

// 성공 안내
- 성공 메시지
- 자동 로그인 안내
- 자동 리다이렉트 카운트다운
- 수동 로그인 버튼
```

### 6. TokenStatus (토큰 상태 표시)
```typescript
interface TokenStatusProps {
  status: 'valid' | 'invalid' | 'expired' | 'used';
  tokenInfo?: TokenInfo;
  onRequestNew: () => void;
}

// 상태별 메시지
- 유효: 새 비밀번호 설정 폼 표시
- 무효: 잘못된 링크 안내
- 만료: 1시간 초과 안내
- 사용됨: 이미 사용된 토큰 안내
```

### 7. PasswordStrengthIndicator (비밀번호 강도 표시)
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

// 강도 검증 조건
- 최소 8자 이상
- 대소문자 포함
- 숫자 포함
- 특수문자 포함
- 일반적 패스워드 금지
```

### 8. RateLimitWarning (제한 경고)
```typescript
interface RateLimitWarningProps {
  rateLimitInfo: RateLimitInfo;
  onUnderstand: () => void;
}

// 제한 안내
- 남은 시도 횟수
- 다음 시도 가능 시간
- 일일 제한 도달 시 안내
- 보안상 이유 설명
```

## 상태 관리 (Zustand)

### ForgotPasswordStore
```typescript
interface ForgotPasswordState {
  // 요청 단계 상태
  mode: 'request' | 'reset' | 'success';
  email: string;
  sentTo: string | null;
  rateLimitInfo: RateLimitInfo | null;
  
  // 재설정 단계 상태
  resetToken: string | null;
  tokenStatus: 'valid' | 'invalid' | 'expired' | 'used' | null;
  tokenInfo: TokenInfo | null;
  
  // 성공 단계 상태
  user: User | null;
  tokens: AuthTokens | null;
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  autoRedirectSeconds: number;
  
  // 액션
  requestPasswordReset: (email: string, recaptchaToken: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<void>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>;
  checkRateLimit: (email: string) => Promise<void>;
  
  // 유틸리티
  setMode: (mode: string) => void;
  setEmail: (email: string) => void;
  setError: (error: string | null) => void;
  startAutoRedirect: (callback: () => void) => void;
  reset: () => void;
}
```

## 보안 구현

### 비밀번호 강도 검증
```typescript
interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
  estimatedCrackTime: string;
}

const validatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  
  // 길이 체크
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('최소 8자 이상 입력해주세요');
  }
  
  // 문자 종류 체크
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const characterTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (characterTypes >= 3) {
    score += 1;
  } else {
    feedback.push('대소문자, 숫자, 특수문자 중 3종류 이상 포함해주세요');
  }
  
  // 일반적인 패스워드 패턴 체크
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /111111/,
    /admin/i
  ];
  
  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score -= 1;
    feedback.push('일반적으로 사용되는 패스워드는 피해주세요');
  }
  
  // 반복 문자 체크
  const hasRepeating = /(.)\1{2,}/.test(password);
  if (hasRepeating) {
    score -= 1;
    feedback.push('동일한 문자를 3번 이상 반복하지 마세요');
  }
  
  // 점수 범위 조정
  score = Math.max(0, Math.min(4, score));
  
  // 크래킹 시간 추정 (간단한 휴리스틱)
  const estimatedCrackTime = estimateCrackTime(score, password.length);
  
  return {
    score,
    feedback,
    isValid: score >= 3 && feedback.length === 0,
    estimatedCrackTime
  };
};

const estimateCrackTime = (score: number, length: number): string => {
  const times = [
    '즉시',           // 0
    '몇 초',          // 1
    '몇 분',          // 2
    '몇 시간',        // 3
    '몇 년'           // 4
  ];
  
  // 길이에 따른 보정
  let adjustedScore = score;
  if (length >= 16) adjustedScore = Math.min(4, adjustedScore + 1);
  else if (length <= 8) adjustedScore = Math.max(0, adjustedScore - 1);
  
  return times[adjustedScore] || '알 수 없음';
};

const PasswordStrengthIndicator: React.FC<{
  password: string;
}> = ({ password }) => {
  const strength = useMemo(() => validatePasswordStrength(password), [password]);
  
  const strengthColors = [
    'bg-red-500',      // 0
    'bg-red-400',      // 1
    'bg-yellow-500',   // 2
    'bg-blue-500',     // 3
    'bg-green-500'     // 4
  ];
  
  const strengthLabels = [
    '매우 약함',
    '약함',
    '보통',
    '강함',
    '매우 강함'
  ];
  
  if (!password.length) return null;
  
  return (
    <div className="space-y-3">
      {/* 강도 바 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>비밀번호 강도</span>
          <span className={`font-medium ${
            strength.isValid ? 'text-green-600' : 'text-red-600'
          }`}>
            {strengthLabels[strength.score]}
          </span>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${strengthColors[strength.score]}`}
            style={{ width: `${(strength.score + 1) * 20}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-600">
          예상 크래킹 시간: {strength.estimatedCrackTime}
        </div>
      </div>
      
      {/* 피드백 */}
      {strength.feedback.length > 0 && (
        <ul className="text-sm text-red-600 space-y-1">
          {strength.feedback.map((feedback, index) => (
            <li key={index} className="flex items-start">
              <XMarkIcon className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
              {feedback}
            </li>
          ))}
        </ul>
      )}
      
      {/* 요구사항 체크리스트 */}
      <div className="text-sm space-y-1">
        <div className="font-medium text-gray-700">요구사항:</div>
        <RequirementItem
          met={password.length >= 8}
          text="최소 8자 이상"
        />
        <RequirementItem
          met={/[a-z]/.test(password)}
          text="소문자 포함"
        />
        <RequirementItem
          met={/[A-Z]/.test(password)}
          text="대문자 포함"
        />
        <RequirementItem
          met={/\d/.test(password)}
          text="숫자 포함"
        />
        <RequirementItem
          met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
          text="특수문자 포함"
        />
      </div>
    </div>
  );
};

const RequirementItem: React.FC<{
  met: boolean;
  text: string;
}> = ({ met, text }) => (
  <div className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
    {met ? (
      <CheckIcon className="w-4 h-4 mr-2" />
    ) : (
      <XMarkIcon className="w-4 h-4 mr-2" />
    )}
    {text}
  </div>
);
```

### 레이트 리미팅 구현
```typescript
const RateLimitManager: React.FC<{
  rateLimitInfo: RateLimitInfo;
  onLimitExceeded: () => void;
}> = ({ rateLimitInfo, onLimitExceeded }) => {
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);
  
  useEffect(() => {
    const resetTime = new Date(rateLimitInfo.resetAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, resetTime - now);
      setTimeUntilReset(Math.floor(remaining / 1000));
      
      if (remaining <= 0) {
        // 제한 해제됨
        onLimitExceeded();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [rateLimitInfo.resetAt, onLimitExceeded]);
  
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '0초';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };
  
  if (rateLimitInfo.dailyLimitReached) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
          <div className="text-sm">
            <div className="font-medium text-red-800">일일 시도 횟수 초과</div>
            <div className="text-red-700 mt-1">
              보안상 하루에 최대 {rateLimitInfo.dailyLimit}번까지 비밀번호 재설정을 요청할 수 있습니다.
            </div>
            <div className="text-red-600 mt-2">
              {formatTimeRemaining(timeUntilReset)} 후 다시 시도하실 수 있습니다.
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (rateLimitInfo.remainingAttempts <= 1) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5 mr-3" />
          <div className="text-sm">
            <div className="font-medium text-yellow-800">시도 횟수 주의</div>
            <div className="text-yellow-700 mt-1">
              {rateLimitInfo.remainingAttempts}번의 시도 기회가 남아있습니다.
              {formatTimeRemaining(timeUntilReset)} 후 시도 횟수가 초기화됩니다.
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};
```

## 이메일 템플릿 연동

### 비밀번호 재설정 이메일
```typescript
interface PasswordResetEmailData {
  username: string;
  resetUrl: string;
  expirationTime: string;
  ipAddress: string;
  userAgent: string;
}

const generatePasswordResetEmail = (data: PasswordResetEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ReadZone 비밀번호 재설정</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">ReadZone</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px;">
          <h2 style="color: #1e40af; margin-top: 0;">비밀번호 재설정 요청</h2>
          
          <p>안녕하세요, ${data.username}님!</p>
          
          <p>ReadZone 계정의 비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              비밀번호 재설정하기
            </a>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #dc2626; margin-top: 0;">보안 안내</h4>
            <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
              <li>이 링크는 <strong>${data.expirationTime}</strong>까지 유효합니다</li>
              <li>요청하지 않았다면 이 이메일을 무시하세요</li>
              <li>링크는 일회성이며, 사용 후 무효화됩니다</li>
            </ul>
          </div>
          
          <div style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            <p><strong>요청 정보:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>IP 주소: ${data.ipAddress}</li>
              <li>브라우저: ${data.userAgent.substring(0, 50)}...</li>
              <li>요청 시각: ${new Date().toLocaleString('ko-KR')}</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280;">
          <p>이 이메일은 ReadZone에서 자동 발송된 메일입니다.</p>
          <p>문의사항이 있으시면 <a href="mailto:support@readzone.com" style="color: #2563eb;">support@readzone.com</a>으로 연락주세요.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
```

## 에러 처리

### 상태별 에러 메시지
```typescript
const getErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'RATE_LIMIT_EXCEEDED':
      return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
    case 'INVALID_EMAIL':
      return '올바른 이메일 주소를 입력해주세요.';
    case 'INVALID_TOKEN':
      return '유효하지 않은 재설정 링크입니다.';
    case 'TOKEN_EXPIRED':
      return '재설정 링크가 만료되었습니다. 새로 요청해주세요.';
    case 'TOKEN_USED':
      return '이미 사용된 재설정 링크입니다.';
    case 'WEAK_PASSWORD':
      return '더 강력한 비밀번호를 설정해주세요.';
    case 'PASSWORD_MISMATCH':
      return '비밀번호가 일치하지 않습니다.';
    case 'RECAPTCHA_FAILED':
      return '보안 인증에 실패했습니다. 다시 시도해주세요.';
    default:
      return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};
```

## 접근성

### 스크린 리더 지원
```typescript
// 폼 접근성
<form onSubmit={handleSubmit} role="form" aria-labelledby="forgot-password-title">
  <h1 id="forgot-password-title" className="sr-only">비밀번호 찾기</h1>
  
  <div>
    <label htmlFor="email" className="block text-sm font-medium">
      이메일 주소
    </label>
    <input
      id="email"
      type="email"
      required
      aria-describedby="email-help"
      className="..."
    />
    <div id="email-help" className="text-sm text-gray-600">
      가입하신 이메일 주소를 입력해주세요
    </div>
  </div>
  
  <div role="status" aria-live="polite">
    {error && (
      <div role="alert" className="text-red-600">
        {error}
      </div>
    )}
  </div>
  
  <button
    type="submit"
    disabled={isLoading}
    aria-describedby={isLoading ? "loading-status" : undefined}
  >
    {isLoading ? '처리 중...' : '재설정 이메일 발송'}
  </button>
  
  {isLoading && (
    <div id="loading-status" className="sr-only">
      비밀번호 재설정 이메일을 발송하고 있습니다
    </div>
  )}
</form>
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (페이지 렌더링)
- **FID**: < 100ms (폼 입력 응답성)
- **CLS**: < 0.1 (단계 전환 시 레이아웃 안정성)

### 사용자 경험 지표
- 이메일 발송 요청: < 3초
- 토큰 검증: < 2초
- 비밀번호 재설정: < 3초
- 강도 검사 응답: < 100ms
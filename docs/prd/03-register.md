# 03. 회원가입 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/register`
- **우선순위**: 1순위 (MVP)
- **설명**: 이메일 인증 포함한 회원가입 시스템
- **인증**: 비인증 사용자 전용 (로그인된 사용자는 메인으로 리다이렉트)

## 📋 참조 문서

### 사용자 플로우
- **[신규 사용자 여정](../user-flows/onboarding.md)** - 회원가입, 이메일 인증, 실패 처리 흐름
- **[오류 처리](../user-flows/error-handling.md)** - 검증 오류, 네트워크 오류 대응 방안

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 회원가입 페이지의 연결 관계 및 우선순위
- **[사용자 흐름도 개요](../user-flows.md)** - 인증 체인 및 신규 사용자 온보딩 흐름

### 관련 PRD 문서
- **[로그인 페이지](./02-login.md)** - 회원가입 완료 후 이동하는 로그인 페이지
- **[이메일 인증 페이지](./11-verify-email.md)** - 회원가입 후 필수 이메일 인증 단계
- **[메인 피드 페이지](./01-main-feed.md)** - 인증 완료 후 이동하는 서비스 메인
- **[비밀번호 찾기 페이지](./12-forgot-password.md)** - 비밀번호 정책 및 보안 고려사항 공유

## 핵심 기능

### 1. 회원가입 폼
- **필수 정보**: 이메일, 비밀번호, 비밀번호 확인, 닉네임
- **선택 정보**: 자기소개 (최대 150자)
- **약관 동의**: 서비스 이용약관, 개인정보 처리방침
- **실시간 검증**: 
  - 이메일 중복 확인
  - 닉네임 중복 확인
  - 비밀번호 강도 체크
  - 비밀번호 일치 확인

### 2. 이메일 인증 시스템
- **즉시 인증 이메일 발송**: 회원가입 완료 시
- **인증 대기 페이지**: 이메일 확인 안내
- **재발송 기능**: 5분 간격, 최대 5회
- **인증 링크 유효시간**: 24시간

### 3. 사용자 경험 최적화
- **단계별 진행**: 정보 입력 → 약관 동의 → 이메일 인증
- **진행률 표시**: 현재 단계 시각화
- **자동 완성 지원**: 이메일, 닉네임 등
- **키보드 네비게이션**: Tab, Enter 키 지원

## 필요한 API

### POST `/api/auth/register`
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  bio?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

interface RegisterResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    username: string;
    emailVerified: false;
  } | null;
  error?: {
    field?: 'email' | 'password' | 'username' | 'general';
    message: string;
  };
}
```

### GET `/api/auth/check-availability`
```typescript
interface AvailabilityRequest {
  type: 'email' | 'username';
  value: string;
}

interface AvailabilityResponse {
  available: boolean;
  message?: string;
}
```

### POST `/api/auth/send-verification`
```typescript
interface SendVerificationRequest {
  email: string;
  resend?: boolean;
}

interface SendVerificationResponse {
  success: boolean;
  message: string;
  canResendAt?: string; // 다음 재발송 가능 시간
}
```

### GET `/api/auth/verify-email`
```typescript
interface VerifyEmailRequest {
  token: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
    emailVerified: true;
  };
}
```

## 컴포넌트 구조

### 1. RegisterPage (메인 컴포넌트)
```typescript
interface RegisterPageProps {
  redirectTo?: string;
}

// 상태 관리
- currentStep: 'form' | 'verification' | 'success'
- isLoading: boolean
- error: string | null
- formData: RegisterFormData
- userEmail: string // 인증 이메일 표시용
```

### 2. RegisterForm (회원가입 폼)
```typescript
interface RegisterFormProps {
  onSubmit: (data: RegisterRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onLoginClick: () => void;
}

// 내부 컴포넌트
- EmailInput: 중복 확인 포함
- UsernameInput: 중복 확인 포함  
- PasswordInput: 강도 표시 포함
- BiographyInput: 글자 수 카운터 포함
- TermsAgreement: 약관 동의 체크박스
```

### 3. EmailVerification (이메일 인증)
```typescript
interface EmailVerificationProps {
  email: string;
  onResendEmail: () => Promise<void>;
  onBackToForm: () => void;
  canResend: boolean;
  nextResendTime?: Date;
}
```

### 4. RegistrationSuccess (가입 완료)
```typescript
interface RegistrationSuccessProps {
  username: string;
  onLoginClick: () => void;
  onGoToHome: () => void;
}
```

### 5. ProgressIndicator (진행률 표시)
```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    label: string;
    completed: boolean;
  }>;
}
```

## 상태 관리 (Zustand)

### RegisterStore
```typescript
interface RegisterState {
  // 상태
  currentStep: 'form' | 'verification' | 'success';
  formData: Partial<RegisterFormData>;
  verificationEmail: string;
  canResendAt: Date | null;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  setStep: (step: RegisterState['currentStep']) => void;
  updateFormData: (data: Partial<RegisterFormData>) => void;
  register: (data: RegisterRequest) => Promise<boolean>;
  sendVerificationEmail: (resend?: boolean) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  checkAvailability: (type: 'email' | 'username', value: string) => Promise<boolean>;
  reset: () => void;
}

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  bio: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}
```

## 폼 검증 (Zod + React Hook Form)

### 검증 스키마
```typescript
const registerSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다')
    .max(320, '이메일이 너무 깁니다'),
  
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(128, '비밀번호는 128자 이하여야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  
  confirmPassword: z
    .string()
    .min(1, '비밀번호 확인을 입력해주세요'),
  
  username: z
    .string()
    .min(2, '닉네임은 최소 2자 이상이어야 합니다')
    .max(20, '닉네임은 20자 이하여야 합니다')
    .regex(
      /^[가-힣a-zA-Z0-9_]+$/,
      '닉네임은 한글, 영문, 숫자, 언더스코어만 사용 가능합니다'
    ),
  
  bio: z
    .string()
    .max(150, '자기소개는 150자 이하여야 합니다')
    .optional(),
  
  agreeTerms: z
    .boolean()
    .refine(val => val === true, '서비스 이용약관에 동의해주세요'),
  
  agreePrivacy: z
    .boolean()
    .refine(val => val === true, '개인정보 처리방침에 동의해주세요')
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;
```

### 실시간 검증 훅
```typescript
const useFieldValidation = (
  fieldName: 'email' | 'username',
  value: string,
  debounceMs = 500
) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');
  
  const debouncedValue = useDebounce(value, debounceMs);
  
  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2) {
      setIsAvailable(null);
      setMessage('');
      return;
    }
    
    const checkAvailability = async () => {
      setIsChecking(true);
      try {
        const result = await api.checkAvailability(fieldName, debouncedValue);
        setIsAvailable(result.available);
        setMessage(result.message || '');
      } catch (error) {
        setIsAvailable(null);
        setMessage('확인 중 오류가 발생했습니다');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAvailability();
  }, [debouncedValue, fieldName]);
  
  return { isChecking, isAvailable, message };
};
```

## 이메일 인증 시스템

### 인증 이메일 템플릿
```typescript
interface VerificationEmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const generateVerificationEmail = (
  username: string, 
  verificationUrl: string
): VerificationEmailTemplate => ({
  subject: 'ReadZone 이메일 인증을 완료해주세요',
  html: `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>안녕하세요 ${username}님!</h1>
      <p>ReadZone 회원가입을 완료하려면 아래 버튼을 클릭해주세요.</p>
      <a href="${verificationUrl}" 
         style="background: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 4px; display: inline-block;">
        이메일 인증하기
      </a>
      <p>링크가 작동하지 않으면 다음 주소를 복사해서 브라우저에 붙여넣기 해주세요:</p>
      <p>${verificationUrl}</p>
      <p>이 링크는 24시간 후에 만료됩니다.</p>
    </div>
  `,
  text: `안녕하세요 ${username}님!\n\n이메일 인증을 완료해주세요: ${verificationUrl}\n\n이 링크는 24시간 후에 만료됩니다.`
});
```

### 재발송 제한 로직
```typescript
const useEmailResend = (email: string) => {
  const [canResend, setCanResend] = useState(true);
  const [nextResendTime, setNextResendTime] = useState<Date | null>(null);
  const [resendCount, setResendCount] = useState(0);
  
  const MAX_RESEND_COUNT = 5;
  const RESEND_INTERVAL = 5 * 60 * 1000; // 5분
  
  const sendVerificationEmail = async (resend = false) => {
    if (!canResend && resend) {
      throw new Error('재발송 대기 시간이 지나지 않았습니다');
    }
    
    if (resendCount >= MAX_RESEND_COUNT) {
      throw new Error('재발송 한도를 초과했습니다. 고객센터에 문의해주세요');
    }
    
    try {
      await api.sendVerificationEmail({ email, resend });
      
      if (resend) {
        setResendCount(prev => prev + 1);
        setCanResend(false);
        const nextTime = new Date(Date.now() + RESEND_INTERVAL);
        setNextResendTime(nextTime);
        
        // 타이머 설정
        setTimeout(() => {
          setCanResend(true);
          setNextResendTime(null);
        }, RESEND_INTERVAL);
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };
  
  return {
    sendVerificationEmail,
    canResend,
    nextResendTime,
    resendCount,
    maxResendCount: MAX_RESEND_COUNT
  };
};
```

## 비밀번호 강도 체커

### 강도 계산 로직
```typescript
interface PasswordStrength {
  score: number; // 0-4
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const feedback: string[] = [];
  
  // 길이 체크
  if (password.length >= 8) score += 1;
  else feedback.push('최소 8자 이상 입력해주세요');
  
  // 대문자 포함
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('대문자를 포함해주세요');
  
  // 소문자 포함
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('소문자를 포함해주세요');
  
  // 숫자 포함
  if (/\d/.test(password)) score += 1;
  else feedback.push('숫자를 포함해주세요');
  
  // 특수문자 포함
  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('특수문자를 포함해주세요');
  
  // 길이 보너스
  if (password.length >= 12) score += 1;
  
  const level = score <= 1 ? 'weak' : 
                score <= 2 ? 'fair' : 
                score <= 3 ? 'good' : 'strong';
  
  return { score: Math.min(score, 4), level, feedback };
};
```

### 비밀번호 입력 컴포넌트
```typescript
const PasswordInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
}> = ({ value, onChange, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const strength = calculatePasswordStrength(value);
  
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="비밀번호를 입력해주세요"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      
      {value && (
        <div className="space-y-1">
          <div className="flex space-x-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i < strength.score
                    ? strength.level === 'weak' ? 'bg-red-500' :
                      strength.level === 'fair' ? 'bg-yellow-500' :
                      strength.level === 'good' ? 'bg-blue-500' : 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            비밀번호 강도: {strength.level === 'weak' ? '약함' : 
                        strength.level === 'fair' ? '보통' : 
                        strength.level === 'good' ? '좋음' : '강함'}
          </p>
          {strength.feedback.length > 0 && (
            <ul className="text-xs text-gray-500 list-disc list-inside">
              {strength.feedback.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};
```

## 에러 처리

### 에러 타입별 처리
```typescript
interface RegisterError {
  type: 'validation' | 'availability' | 'network' | 'server';
  field?: keyof RegisterFormData;
  message: string;
}

const handleRegisterError = (error: any): RegisterError => {
  // 중복 확인 에러
  if (error.code === 'EMAIL_EXISTS') {
    return {
      type: 'availability',
      field: 'email',
      message: '이미 사용 중인 이메일입니다'
    };
  }
  
  if (error.code === 'USERNAME_EXISTS') {
    return {
      type: 'availability',
      field: 'username',
      message: '이미 사용 중인 닉네임입니다'
    };
  }
  
  // 네트워크 에러
  if (error.name === 'NetworkError') {
    return {
      type: 'network',
      message: '네트워크 연결을 확인해주세요'
    };
  }
  
  // 기본 서버 에러
  return {
    type: 'server',
    message: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
  };
};
```

## 보안 고려사항

### 입력 데이터 sanitization
```typescript
const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // HTML 태그 방지
    .substring(0, 1000); // 최대 길이 제한
};

// 닉네임 특수 검증
const isValidUsername = (username: string): boolean => {
  const sanitized = sanitizeUserInput(username);
  
  // 금지된 단어 체크
  const bannedWords = ['admin', 'administrator', 'root', 'system'];
  if (bannedWords.some(word => sanitized.toLowerCase().includes(word))) {
    return false;
  }
  
  // 연속된 특수문자 체크
  if (/[_]{3,}/.test(sanitized)) {
    return false;
  }
  
  return true;
};
```

### Rate Limiting (클라이언트 측)
```typescript
const useRateLimit = (key: string, maxAttempts: number, windowMs: number) => {
  const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
  const now = Date.now();
  
  // 윈도우 외부의 시도는 제거
  const recentAttempts = attempts.filter((timestamp: number) => 
    now - timestamp < windowMs
  );
  
  const canAttempt = recentAttempts.length < maxAttempts;
  
  const recordAttempt = () => {
    recentAttempts.push(now);
    localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
  };
  
  return { canAttempt, recordAttempt };
};
```

## 접근성

### ARIA 지원
```typescript
// 폼 접근성
<form role="form" aria-labelledby="register-title">
  <h1 id="register-title">회원가입</h1>
  
  <div role="group" aria-labelledby="password-group">
    <h3 id="password-group">비밀번호 설정</h3>
    <input
      type="password"
      aria-label="비밀번호"
      aria-describedby="password-help password-strength"
    />
    <div id="password-help">
      8자 이상, 대소문자, 숫자, 특수문자 포함
    </div>
    <div id="password-strength" aria-live="polite">
      {strength.level === 'strong' ? '강한 비밀번호입니다' : ''}
    </div>
  </div>
</form>

// 진행률 표시기 접근성
<div role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={currentStep}>
  <span className="sr-only">
    회원가입 진행률: {currentStep}단계 / 3단계 완료
  </span>
</div>
```

## 성능 최적화

### 지연 로딩
```typescript
// 약관 모달 지연 로딩
const TermsModal = lazy(() => import('./TermsModal'));
const PrivacyModal = lazy(() => import('./PrivacyModal'));
```

### 디바운스를 통한 API 호출 최적화
```typescript
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.5초 (폼 렌더링)
- **FID**: < 100ms (입력 응답성)
- **CLS**: < 0.1 (검증 메시지 표시)

### 사용자 경험 지표
- 중복 확인 응답: < 800ms
- 회원가입 API 응답: < 2초
- 이메일 발송: < 3초
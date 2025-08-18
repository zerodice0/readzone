# 02. 로그인 페이지 구현 요구사항

## 페이지 정보
- **경로**: `/login`
- **우선순위**: 1순위 (MVP)
- **설명**: 서비스 소개와 JWT 토큰 기반 로그인 시스템
- **인증**: 비인증 사용자 전용 (로그인된 사용자는 메인으로 리다이렉트)

## 📋 참조 문서

### 사용자 플로우
- **[신규 사용자 여정](../user-flows/onboarding.md)** - 로그인, 회원가입, JWT 토큰 관리 흐름
- **[오류 처리](../user-flows/error-handling.md)** - 인증 실패, 네트워크 오류 대응

### 프로젝트 구조
- **[구현 페이지 목록](../implementation-pages.md)** - 로그인 페이지의 연결 관계 및 우선순위
- **[사용자 흐름도 개요](../user-flows.md)** - 인증 체인 및 첫 방문자 회원가입 시나리오

### 관련 PRD 문서
- **[메인 피드 페이지](./01-main-feed.md)** - 로그인 후 이동하는 메인 허브 페이지
- **[회원가입 페이지](./03-register.md)** - 로그인 페이지에서 연결되는 회원가입
- **[비밀번호 찾기 페이지](./12-forgot-password.md)** - 비밀번호 찾기 링크로 연결
- **[이메일 인증 페이지](./11-verify-email.md)** - 회원가입 후 인증 프로세스
- **[설정 페이지](./08-settings.md)** - 로그아웃 기능 및 계정 관리

## 핵심 기능

### 1. 서비스 소개 섹션
- **ReadZone 가치 제안**: "독서 후 감상을 나누는 커뮤니티"
- **주요 기능 하이라이트**: 
  - 마크다운 독후감 작성
  - 3단계 도서 검색 (DB → 카카오 API → 수동)
  - Threads 스타일 피드 경험
- **시각적 요소**: 서비스 스크린샷 또는 일러스트
- **비로그인 콘텐츠 미리보기**: "지금 둘러보기" 버튼

### 2. 로그인 폼
- **이메일 + 비밀번호** 방식
- **실시간 검증**: 이메일 형식, 비밀번호 필수 입력
- **로그인 상태 유지**: "로그인 상태 유지" 체크박스
- **에러 처리**: 인증 실패, 네트워크 오류, 검증 오류
- **로딩 상태**: 로그인 버튼 로딩 스피너

### 3. 부가 기능
- **회원가입 링크**: "아직 계정이 없으신가요?"
- **비밀번호 찾기**: "비밀번호를 잊으셨나요?"
- **비로그인 이용**: "먼저 둘러보기" 버튼 (메인 피드로 이동)

## 필요한 API

### POST `/api/auth/login`
```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    username: string;
    profileImage?: string;
  } | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  } | null;
  error?: {
    field?: 'email' | 'password' | 'general';
    message: string;
  };
}
```

### POST `/api/auth/verify-token`
```typescript
interface VerifyTokenRequest {
  token: string;
}

interface VerifyTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}
```

### GET `/api/auth/me`
```typescript
interface MeResponse {
  user: {
    id: string;
    email: string;
    username: string;
    profileImage?: string;
  } | null;
  authenticated: boolean;
}
```

## 컴포넌트 구조

### 1. LoginPage (메인 컴포넌트)
```typescript
interface LoginPageProps {
  redirectTo?: string; // 로그인 후 리다이렉트할 경로
}

// 상태 관리
- isLoading: boolean
- error: string | null
- formData: { email: string; password: string; rememberMe: boolean }
- redirectPath: string
```

### 2. ServiceIntro (서비스 소개)
```typescript
interface ServiceIntroProps {
  onBrowseClick: () => void; // 둘러보기 버튼 클릭
}
```

### 3. LoginForm (로그인 폼)
```typescript
interface LoginFormProps {
  onSubmit: (data: LoginRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onForgotPassword: () => void;
  onSignUp: () => void;
}
```

### 4. AuthRedirect (로그인 상태 확인)
```typescript
interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}
```

## 상태 관리 (Zustand)

### AuthStore
```typescript
interface AuthState {
  // 상태
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  } | null;
  
  // 액션
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  verifyToken: () => Promise<boolean>;
  refreshTokens: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
}
```

## JWT 토큰 관리

### 토큰 저장 전략
```typescript
// LocalStorage vs SessionStorage
const storage = rememberMe ? localStorage : sessionStorage;
storage.setItem('readzone_tokens', JSON.stringify(tokens));

// 토큰 구조
interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  iat: number; // issued at
  exp: number; // expires at
}
```

### 자동 토큰 갱신
```typescript
// 토큰 만료 10분 전 자동 갱신
const REFRESH_BEFORE_EXPIRY = 10 * 60 * 1000; // 10분

// Interval로 주기적 체크
setInterval(() => {
  const tokenExpiresAt = new Date(tokens.expiresAt);
  const now = new Date();
  const timeUntilExpiry = tokenExpiresAt.getTime() - now.getTime();
  
  if (timeUntilExpiry <= REFRESH_BEFORE_EXPIRY) {
    refreshTokens();
  }
}, 60000); // 1분마다 체크
```

### API 요청 인터셉터
```typescript
// TanStack Query에서 토큰 자동 첨부
const authQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${tokens?.accessToken}`,
            'Content-Type': 'application/json',
          },
          signal,
        });
        
        if (response.status === 401) {
          // 토큰 만료 처리
          const refreshed = await refreshTokens();
          if (!refreshed) {
            throw new Error('Authentication expired');
          }
          // 원래 요청 재시도
          return fetch(url, {
            headers: {
              'Authorization': `Bearer ${newTokens.accessToken}`,
              'Content-Type': 'application/json',
            }
          });
        }
        
        return response.json();
      }
    }
  }
});
```

## 라우팅 및 리다이렉트

### 로그인 후 리다이렉트
```typescript
// URL 파라미터에서 redirect 경로 확인
const searchParams = new URLSearchParams(window.location.search);
const redirectTo = searchParams.get('redirect') || '/';

// 로그인 성공 후 리다이렉트
if (loginSuccess) {
  // 보안을 위해 내부 경로만 허용
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/';
  router.push(safeRedirect);
}
```

### 보호된 라우트 처리
```typescript
// 로그인이 필요한 페이지에서 리다이렉트
if (!isAuthenticated) {
  router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
}
```

## 폼 검증 (Zod + React Hook Form)

### 검증 스키마
```typescript
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  rememberMe: z.boolean().default(false)
});

type LoginFormData = z.infer<typeof loginSchema>;
```

### React Hook Form 설정
```typescript
const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    email: '',
    password: '',
    rememberMe: false
  },
  mode: 'onChange' // 실시간 검증
});
```

## 에러 처리

### 에러 타입별 처리
```typescript
interface LoginError {
  type: 'validation' | 'auth' | 'network' | 'server';
  field?: 'email' | 'password' | 'general';
  message: string;
}

// 에러 메시지 매핑
const errorMessages = {
  'INVALID_CREDENTIALS': '이메일 또는 비밀번호가 잘못되었습니다',
  'ACCOUNT_NOT_VERIFIED': '이메일 인증이 필요합니다',
  'ACCOUNT_LOCKED': '계정이 일시적으로 잠겼습니다',
  'NETWORK_ERROR': '네트워크 연결을 확인해주세요',
  'SERVER_ERROR': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
};
```

### 재시도 로직
```typescript
// 네트워크 오류 시 자동 재시도 (최대 3회)
const loginWithRetry = async (credentials: LoginRequest, retries = 3): Promise<LoginResponse> => {
  try {
    return await loginAPI(credentials);
  } catch (error) {
    if (retries > 0 && isNetworkError(error)) {
      await delay(1000); // 1초 대기
      return loginWithRetry(credentials, retries - 1);
    }
    throw error;
  }
};
```

## 보안 고려사항

### CSRF 보호
```typescript
// NextAuth.js CSRF 토큰 포함
const csrfToken = await getCsrfToken();
headers['X-CSRF-Token'] = csrfToken;
```

### 브루트 포스 공격 방지
```typescript
// 로그인 시도 제한 (클라이언트 측)
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15분

// localStorage에 시도 횟수 기록
const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
const now = Date.now();

if (attempts.count >= MAX_LOGIN_ATTEMPTS && 
    now - attempts.lastAttempt < LOCKOUT_DURATION) {
  throw new Error('너무 많은 로그인 시도로 인해 일시적으로 제한되었습니다');
}
```

## 접근성

### 키보드 네비게이션
- Tab 키로 폼 요소 간 이동
- Enter 키로 로그인 실행
- Escape 키로 모달/에러 메시지 닫기

### 스크린 리더 지원
```typescript
// ARIA 라벨 및 역할
<form role="form" aria-labelledby="login-title">
  <h1 id="login-title">로그인</h1>
  <input
    aria-label="이메일 주소"
    aria-describedby="email-error"
    aria-invalid={!!errors.email}
  />
  <div id="email-error" role="alert">
    {errors.email?.message}
  </div>
</form>
```

## 성능 최적화

### 코드 스플리팅
```typescript
// 지연 로딩으로 번들 크기 최적화
const ServiceIntro = lazy(() => import('./ServiceIntro'));
const ForgotPasswordModal = lazy(() => import('./ForgotPasswordModal'));
```

### 이미지 최적화
```typescript
// Cloudinary 자동 최적화
const serviceImages = {
  hero: 'https://res.cloudinary.com/readzone/image/upload/w_800,h_600,c_fill,f_auto,q_auto/service-hero',
  features: 'https://res.cloudinary.com/readzone/image/upload/w_400,h_300,c_fill,f_auto,q_auto/features-preview'
};
```

## 성능 목표

### Core Web Vitals
- **LCP**: < 2.0초 (서비스 소개 이미지 로딩 포함)
- **FID**: < 100ms (폼 입력 응답성)
- **CLS**: < 0.1 (에러 메시지 표시 시 레이아웃 변경 최소화)

### 사용자 경험 지표
- 로그인 폼 검증 응답: 즉시 (< 100ms)
- 로그인 API 응답: < 1.5초
- 성공 후 리다이렉트: < 500ms
# ReadZone 프로젝트 개발 가이드

## 프로젝트 개요

ReadZone은 독서 기록을 작성하고 커뮤니티에서 공유할 수 있는 모던한 독서 플랫폼입니다. 기존의 고풍스럽고 진부한 독서 이미지를 탈피하여, 일상적이고 캐주얼한 독서 문화를 조성하는 것을 목표로 합니다.

## 기술 스택

### 백엔드 (readzone-backend)
- **런타임**: Node.js 18+ 
- **프레임워크**: Express.js with TypeScript
- **데이터베이스**: PostgreSQL with Prisma ORM
- **인증**: JWT (JSON Web Token)
- **보안**: bcrypt, helmet, CORS, rate limiting
- **테스팅**: Jest + Supertest
- **로깅**: Winston
- **검증**: Joi

### 프론트엔드 (readzone-frontend)
- **프레임워크**: React 18 with TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS
- **라우팅**: React Router v6
- **상태 관리**: Zustand (persist 미들웨어 사용)
- **HTTP 클라이언트**: Axios
- **폼 관리**: React Hook Form + Zod
- **차트**: Chart.js + react-chartjs-2
- **테스팅**: Vitest + Playwright (E2E)
- **PWA**: Service Worker 지원

## 프로젝트 구조

```
readzone/
├── readzone-backend/          # Express.js API 서버
│   ├── src/
│   │   ├── controllers/       # API 컨트롤러
│   │   ├── middleware/        # 미들웨어 (인증, 에러 처리 등)
│   │   ├── routes/           # API 라우트 정의
│   │   ├── services/         # 비즈니스 로직
│   │   ├── utils/            # 유틸리티 함수
│   │   ├── config/           # 설정 파일
│   │   └── types/            # TypeScript 타입 정의
│   ├── prisma/               # Prisma 스키마 및 마이그레이션
│   └── tests/                # 테스트 파일
├── readzone-frontend/         # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/       # React 컴포넌트
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── services/         # API 서비스
│   │   ├── stores/           # Zustand 스토어
│   │   ├── hooks/            # 커스텀 훅
│   │   ├── utils/            # 유틸리티 함수
│   │   └── types/            # TypeScript 타입 정의
│   └── tests/                # 테스트 파일
└── docs/                     # 프로젝트 문서
```

## 개발 규칙 및 컨벤션

### 코딩 스타일
- **TypeScript strict 모드** 사용 필수
- **함수형 컴포넌트** 선호 (React)
- **camelCase**: 변수명, 함수명
- **PascalCase**: 컴포넌트명, 타입명
- **kebab-case**: 파일명
- **UPPER_SNAKE_CASE**: 상수명

### 네이밍 규칙
- **컴포넌트 파일**: `ComponentName.tsx`
- **페이지 컴포넌트**: `PageName.tsx` (예: `HomePage.tsx`)
- **훅**: `useHookName.ts` (예: `useAuth.ts`)
- **서비스**: `serviceName.ts` (예: `authService.ts`)
- **스토어**: `storeNameStore.ts` (예: `authStore.ts`)

### 폴더 구조 규칙
- **컴포넌트**: 기능별로 폴더 분리 (`components/auth/`, `components/posts/`)
- **페이지**: 단일 폴더에 모든 페이지 (`pages/`)
- **서비스**: API별로 파일 분리 (`services/authService.ts`)

## API 설계 원칙

### RESTful API 규칙
- **GET**: 데이터 조회
- **POST**: 데이터 생성
- **PUT**: 데이터 전체 수정
- **PATCH**: 데이터 부분 수정
- **DELETE**: 데이터 삭제

### 응답 형식
```typescript
// 성공 응답
{
  success: true,
  data: any,
  message?: string
}

// 오류 응답
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}

// 페이지네이션 응답
{
  success: true,
  data: {
    items: any[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
      hasNext: boolean,
      hasPrev: boolean
    }
  }
}
```

### 인증 및 보안
- **JWT 토큰**: Bearer 토큰 방식
- **비밀번호**: bcrypt 해싱 (salt rounds 12)
- **Rate Limiting**: 15분당 100회 요청 제한
- **CORS**: 허용된 도메인만 접근
- **Helmet**: 보안 헤더 설정

## 데이터베이스 설계

### 주요 테이블
- **users**: 사용자 정보
- **books**: 도서 정보 (카카오 API 캐싱)
- **posts**: 독서 기록 게시글
- **comments**: 댓글
- **likes**: 좋아요
- **follows**: 팔로우 관계
- **library_books**: 개인 서재
- **reading_goals**: 독서 목표
- **notifications**: 알림
- **reading_groups**: 독서 그룹
- **book_recommendations**: 도서 추천

### 관계 설정
- User 1:N Post (사용자-게시글)
- Post 1:N Comment (게시글-댓글)
- User M:N Book (사용자-도서, library_books 테이블)
- User M:N User (팔로우 관계, follows 테이블)

## 상태 관리 (Zustand)

### 스토어 구조
```typescript
interface Store {
  // State
  data: any;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchData: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
```

### 주요 스토어
- **authStore**: 인증 상태 관리
- **libraryStore**: 개인 서재 상태
- **notificationStore**: 알림 상태
- **statisticsStore**: 통계 데이터

## 컴포넌트 설계 원칙

### 컴포넌트 분류
- **Pages**: 라우트에 연결되는 페이지 컴포넌트
- **Layouts**: 레이아웃 컴포넌트
- **UI**: 재사용 가능한 UI 컴포넌트
- **Feature**: 특정 기능을 담당하는 컴포넌트

### Props 타입 정의
```typescript
interface ComponentProps {
  // Required props
  title: string;
  
  // Optional props
  description?: string;
  
  // Event handlers
  onClick?: () => void;
  
  // Children
  children?: React.ReactNode;
}
```

## 테스팅 전략

### 백엔드 테스팅 (Jest + Supertest)
- **단위 테스트**: 개별 함수 및 메서드
- **통합 테스트**: API 엔드포인트
- **테스트 커버리지**: 80% 이상 유지

### 프론트엔드 테스팅
- **단위 테스트**: Vitest로 컴포넌트 테스트
- **E2E 테스트**: Playwright로 사용자 시나리오 테스트

## 성능 최적화

### 프론트엔드 최적화
- **Code Splitting**: React.lazy()로 페이지별 분할
- **Image Optimization**: LazyImage 컴포넌트 사용
- **Bundle Analysis**: Vite 번들 분석
- **PWA**: Service Worker로 오프라인 지원

### 백엔드 최적화
- **Database Indexing**: 자주 조회되는 컬럼에 인덱스
- **Query Optimization**: Prisma 쿼리 최적화
- **Caching**: 필요시 Redis 캐싱 도입

## 배포 및 환경 설정

### 환경 변수
```bash
# Backend (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
KAKAO_API_KEY="your-kakao-api-key"
PORT=3001
NODE_ENV=development

# Frontend (.env)
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_ENV=development
```

### 개발 서버 실행
```bash
# Backend
cd readzone-backend
npm install
npm run dev

# Frontend
cd readzone-frontend
npm install
npm run dev
```

## 외부 API 연동

### 카카오 도서 검색 API
- **엔드포인트**: `/api/books/search`
- **제한사항**: 일일 10,000회 호출 제한
- **캐싱**: 검색 결과를 데이터베이스에 캐싱

## 에러 처리

### 백엔드 에러 코드
- **AUTH_001**: 유효하지 않은 토큰
- **AUTH_002**: 토큰 만료
- **AUTH_003**: 권한 없음
- **VALIDATION_001**: 필수 필드 누락
- **RESOURCE_001**: 리소스 없음

### 프론트엔드 에러 처리
- **Try-Catch**: async/await 함수에서 에러 처리
- **Error Boundary**: React 컴포넌트 에러 처리
- **Toast Notifications**: 사용자에게 에러 메시지 표시

## 개발 워크플로우

### Git 브랜치 전략
- **main**: 프로덕션 브랜치
- **develop**: 개발 브랜치
- **feature/**: 기능 개발 브랜치
- **hotfix/**: 긴급 수정 브랜치

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드 설정 변경
```

## 주요 기능 구현 가이드

### 인증 시스템
- JWT 토큰 기반 인증
- 로그인/회원가입/로그아웃
- 토큰 자동 갱신
- 보호된 라우트

### 게시글 시스템
- CRUD 기능
- 좋아요/댓글 기능
- 태그 시스템
- 공개/비공개 설정

### 검색 기능
- 통합 검색 (게시글, 사용자, 도서)
- 필터링 및 정렬
- 자동완성

### 알림 시스템
- 실시간 알림
- 알림 타입별 분류
- 읽음/안읽음 상태

이 가이드를 참고하여 ReadZone 프로젝트의 일관성 있는 개발을 진행해주세요.
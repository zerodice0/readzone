# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReadZone은 독서 후 의견을 공유하는 **독서 전용 커뮤니티 SNS 플랫폼**입니다. Threads와 같은 SNS 형태로 독후감을 작성하고 다른 사용자들과 의견을 공유할 수 있습니다.

**프로젝트 목적**: 독서 계획 수립이나 관리가 아닌, **독서 이후 커뮤니티 형성**에 초점

## 기술 스택

### 통합 풀스택 구성
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite (로컬 미니PC 환경)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **State Management**: 
  - Zustand (클라이언트 전역 상태)
  - TanStack Query (서버 상태 및 캐싱)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **External API**: 카카오 도서 검색 API

## TypeScript 설정 규칙

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 코드 작성 원칙

### 1. 타입 안정성
- **any 타입 사용 금지**
- 모든 함수의 매개변수와 반환값에 명시적 타입 정의
- interface/type을 활용한 명확한 타입 정의

### 2. 순수 함수와 불변성
- 최대한 순수 함수로 작성 (같은 입력 → 같은 출력)
- 사이드이펙트 최소화
- `const` 기본 사용, `let`은 필요한 경우만
- 객체/배열 변경 시 spread operator 또는 immer 사용

### 3. 함수형 프로그래밍
```typescript
// 좋은 예
const addTax = (price: number, taxRate: number): number => 
  price * (1 + taxRate);

// 피해야 할 예
let total = 0;
function addToTotal(price: number): void {
  total += price; // 사이드이펙트
}
```

## 페이지 구성 (11개)

### 1. 독후감 피드 (`/`) - 메인 페이지
- Threads 스타일 무한 스크롤 피드
- 독후감 미리보기 카드 (200자 + "...더보기")
- 비로그인 시 읽기만 가능, 상호작용 시 로그인 유도
- 플로팅 작성 버튼

### 2. 로그인 페이지 (`/login`) - 서비스 소개 포함
- 왼쪽: ReadZone 서비스 소개
- 오른쪽: 로그인/회원가입 폼
- 비로그인 상호작용 시 자동 이동

### 3. 회원가입 페이지 (`/register`)
- 이메일, 비밀번호, 닉네임
- 이메일 인증 프로세스

### 4. 비밀번호 찾기 (`/forgot-password`)
- 이메일로 재설정 링크 전송

### 5. 이메일 인증 페이지 (`/verify-email`)
- 회원가입 후 이메일 인증 처리

### 6. 도서 검색 페이지 (`/search`)
- 카카오 도서 API 연동
- 검색되지 않는 도서의 수동 입력 기능
- 검색 결과 캐싱

### 7. 도서 상세 페이지 (`/books/[id]`)
- 도서 정보 표시
- 해당 도서에 대한 의견 피드
- 280자 의견 작성 (추천/비추천)

### 8. 독후감 작성 페이지 (`/write`)
- 도서 검색 (API + 수동 입력)
- 마크다운 에디터
- 추천/비추천 선택
- 구매 링크 추가 (선택)

### 9. 독후감 상세 페이지 (`/review/[id]`)
- 전체 독후감 내용
- 댓글 시스템
- 좋아요/공유 기능
- 구매 링크 (클릭 추적)

### 10. 프로필 페이지 (`/profile/[userId]`)
- 기본 정보 (닉네임, 가입일, 자기소개)
- 활동 통계 (독후감 수, 도서 의견 수, 받은 좋아요 수, 읽은 책 수)
- 작성한 콘텐츠 목록

### 11. 설정 페이지 (`/settings`)
- 프로필 편집
- 비밀번호 변경
- 알림 설정
- 계정 삭제

## 프로젝트 구조

```
readzone/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지 그룹
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── verify-email/
│   ├── (main)/              # 메인 앱 페이지 그룹
│   │   ├── search/
│   │   ├── books/
│   │   ├── write/
│   │   ├── review/
│   │   ├── profile/
│   │   └── settings/
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   ├── books/
│   │   ├── reviews/
│   │   └── kakao/
│   ├── layout.tsx           # 루트 레이아웃
│   └── page.tsx            # 독후감 피드 메인
├── components/              # 재사용 가능한 컴포넌트
│   ├── ui/                 # 기본 UI 컴포넌트 (Radix UI)
│   ├── feed/               # 피드 관련 컴포넌트
│   ├── book/               # 도서 관련 컴포넌트
│   ├── review/             # 독후감 관련 컴포넌트
│   └── layout/             # 레이아웃 컴포넌트
├── lib/                     # 유틸리티 함수
│   ├── db.ts              # Prisma 클라이언트
│   ├── auth.ts            # NextAuth 설정
│   ├── kakao.ts           # 카카오 API 클라이언트
│   └── utils.ts           # 헬퍼 함수
├── hooks/                   # 커스텀 React 훅
├── store/                   # Zustand 스토어
├── types/                   # TypeScript 타입 정의
├── prisma/
│   └── schema.prisma       # 데이터베이스 스키마
└── public/                  # 정적 파일
```

## Essential Commands

### 프로젝트 설정
```bash
# Node 버전 설정
nvm use 18.17.0

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 개발
```bash
# 개발 서버 실행
npm run dev

# TypeScript 타입 체크
npm run type-check

# Lint 실행
npm run lint

# Prettier 포맷팅
npm run format

# Prisma 작업
npx prisma generate          # 클라이언트 생성
npx prisma migrate dev       # 마이그레이션 실행 (개발환경)
npx prisma migrate deploy    # 마이그레이션 실행 (프로덕션)
npx prisma studio           # DB 관리 GUI
npx prisma db seed          # 시드 데이터 실행

# 테스트 실행
npm test                     # 단위 테스트
npm run test:e2e            # E2E 테스트 (향후 추가)
npm run test:coverage       # 테스트 커버리지
```

### 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start

# 정적 사이트 생성
npm run export
```

## 주요 기능 구현 가이드

### 독후감 작성
- 카카오 도서 API로 도서 검색
- API에서 검색되지 않는 도서는 수동 입력
- 마크다운 에디터 지원
- 추천/비추천 선택 (별점 대신)
- 구매 링크 추가 (선택, 클릭 추적)

### 피드 시스템
- 무한 스크롤 (TanStack Query)
- 독후감 미리보기 (200자 + 더보기)
- 실시간 업데이트 (폴링)

### 도서 정보 처리
- 카카오 API 우선 검색
- 수동 입력 지원 (제목, 저자, 출판사, 장르, 페이지 수)
- API 사용량 추적 및 캐싱

### 소셜 기능
- 좋아요/댓글
- 도서 의견 (280자 제한)
- 추천/비추천 표시
- 외부 SNS 공유

### 구매 링크 시스템
- 단순 URL 저장
- 클릭 수 추적
- 단축 URL 생성 (선택)

## 데이터베이스 스키마 핵심

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  nickname  String   @unique
  bio       String?
  createdAt DateTime @default(now())
  // 관계
  reviews   BookReview[]
  opinions  BookOpinion[]
  likes     ReviewLike[]
  comments  Comment[]
}

model Book {
  id           String   @id @default(cuid())
  isbn         String?  @unique  // API 검색 시에만
  title        String
  authors      String[] 
  publisher    String?
  genre        String?
  pageCount    Int?
  thumbnail    String?
  isManualEntry Boolean @default(false)
  // 관계
  reviews      BookReview[]
  opinions     BookOpinion[]
}

model BookReview {
  id             String   @id @default(cuid())
  title          String?
  content        String   // 독후감 내용
  isRecommended  Boolean  // 추천/비추천
  tags           String[] // 해시태그
  purchaseLink   String?  // 구매 링크
  linkClicks     Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  // 관계
  userId         String
  bookId         String
  user           User     @relation(fields: [userId], references: [id])
  book           Book     @relation(fields: [bookId], references: [id])
  likes          ReviewLike[]
  comments       Comment[]
}

model BookOpinion {
  id            String   @id @default(cuid())
  content       String   @db.VarChar(280)
  isRecommended Boolean
  createdAt     DateTime @default(now())
  // 관계
  userId        String
  bookId        String
  user          User     @relation(fields: [userId], references: [id])
  book          Book     @relation(fields: [bookId], references: [id])
}
```

## API 통합

### 카카오 도서 검색 API
```typescript
interface KakaoBookResponse {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  datetime: string;
  price: number;
  sale_price: number;
  thumbnail: string;
  contents: string;
  status: string;
}

// API 사용량 관리
interface ApiUsageTracking {
  date: string;
  searchCount: number;
  remaining: number;
  resetTime: Date;
}
```

## 성능 최적화

- React Server Components 활용
- 이미지 최적화 (Next.js Image)
- 카카오 API 검색 결과 24시간 캐싱
- 클라이언트 상태 최소화
- 무한 스크롤 가상화

## 보안 고려사항

### 민감 정보 보호 (중요)
- **환경 변수 관리**: 모든 API 키, 시크릿 키, 데이터베이스 인증 정보는 `.env.local` 파일에 저장
- **Git 보안**: `.env`, `.env.local`, `.env.production` 등의 환경 변수 파일은 **절대 Git 저장소에 커밋하지 않음**
- **예시 파일**: `.env.example` 파일로 필요한 환경 변수 목록만 제공 (실제 값은 제외)
- **키 로테이션**: 정기적으로 API 키 및 시크릿 키 변경

```bash
# ❌ 절대 커밋하지 않을 파일들
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# ✅ 커밋 가능한 파일 (실제 값 없이 키 목록만)
.env.example
```

### 애플리케이션 보안
- **CSRF 보호**: NextAuth.js 내장 보호 기능 활용
- **XSS 방지**: React 기본 제공 방지 + 마크다운 콘텐츠 산티타이징
- **SQL Injection 방지**: Prisma ORM 사용으로 자동 방지
- **세션 보안**: JWT 토큰 만료 시간 설정 및 보안 헤더 적용
- **입력 검증**: Zod 스키마를 통한 모든 사용자 입력 검증
- **파일 업로드 보안**: 이미지 파일 타입 및 크기 제한

## 배포 환경

### 미니PC 로컬 환경 설정
- **운영체제**: Linux (Ubuntu 20.04+ 권장)
- **Node.js**: 18.17.0 (LTS)
- **프로세스 관리**: PM2 또는 systemd
- **리버스 프록시**: nginx (선택사항, HTTPS 설정 시 권장)
- **데이터베이스**: SQLite (파일 기반)
- **백업**: SQLite 파일 자동 백업

### 배포 스크립트
```bash
# 프로덕션 배포
npm run build
npm run start

# PM2를 사용한 프로세스 관리
pm2 start npm --name "readzone" -- start
pm2 startup
pm2 save

# 자동 재시작 설정
pm2 restart readzone
pm2 logs readzone

# SQLite 백업 자동화 (crontab 설정)
0 2 * * * /usr/local/bin/backup-readzone-db.sh
```

### 환경 변수 관리
```bash
# 프로덕션 환경 변수 (.env.production)
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
DATABASE_URL="file:./prod.db"
KAKAO_API_KEY=your_kakao_api_key
NEXTAUTH_SECRET=your_super_secret_key
```

### 보안 설정
- **방화벽**: UFW 설정으로 필요한 포트만 개방
- **SSL 인증서**: Let's Encrypt 또는 자체 서명 인증서
- **정기 업데이트**: 시스템 및 종속성 정기 업데이트
- **로그 관리**: 로그 로테이션 설정

## 개발 프로세스

### PRD 기반 개발 방법론

ReadZone 프로젝트는 **Phase별 PRD(Product Requirements Document) 기반 개발**을 진행합니다.

#### 개발 단계
1. **PRD 작성**: 각 Phase별 상세 구현 계획 문서화
2. **구현**: PRD 명세에 따른 기능 개발
3. **검토**: 구현 완료 후 PRD 대비 완성도 확인
4. **피드백**: 사용자 리뷰 및 개선사항 수집
5. **다음 Phase 진행**

#### PRD 파일 구조
```
docs/
├── phase-1-foundation.md     # 기본 인프라 및 인증
├── phase-2-core-pages.md     # 핵심 페이지 구현
├── phase-3-book-system.md    # 도서 검색 및 관리
├── phase-4-review-system.md  # 독후감 시스템
├── phase-5-social.md         # 소셜 기능
└── phase-6-optimization.md   # 최적화 및 고도화
```

#### 각 PRD 포함 내용
- **목표**: Phase의 핵심 목적
- **범위**: 구현할 기능 목록
- **기술 요구사항**: 사용할 기술 스택
- **UI/UX 명세**: 페이지별 상세 디자인
- **API 명세**: 엔드포인트 및 데이터 구조
- **테스트 시나리오**: 검증 방법
- **완료 기준**: 구현 완료 판단 기준

#### 구현 완료 프로세스
1. 모든 PRD 명세 사항 구현 완료
2. 기능 동작 테스트 완료
3. TypeScript 타입 체크 통과
4. ESLint 검사 통과
5. **구현 완료 보고서** 작성:
   - 구현된 기능 목록
   - 발견된 이슈 및 해결 방안
   - 다음 Phase 연계 사항
   - 피드백 요청 항목

## Phase별 개발 계획

### Phase 1: Foundation (기반 인프라)
- Next.js 프로젝트 초기화
- TypeScript 및 ESLint 설정
- Prisma + SQLite 설정
- NextAuth.js 인증 시스템
- 기본 UI 컴포넌트 (Radix UI + Tailwind)

### Phase 2: Core Pages (핵심 페이지)
- 독후감 피드 (메인 페이지)
- 로그인/회원가입 페이지
- 이메일 인증 시스템
- 기본 레이아웃 및 네비게이션

### Phase 3: Book System (도서 시스템)
- 카카오 도서 API 연동
- 도서 검색 페이지
- 수동 도서 입력 기능
- 도서 상세 페이지

### Phase 4: Review System (독후감 시스템)
- 독후감 작성/편집 페이지
- 독후감 상세 페이지
- 마크다운 에디터
- 추천/비추천 시스템

### Phase 5: Social Features (소셜 기능)
- 좋아요/댓글 시스템
- 도서 의견 (280자)
- 프로필 페이지
- 외부 SNS 공유

### Phase 6: Optimization (최적화)
- 구매 링크 시스템
- 성능 최적화
- SEO 최적화
- PWA 기능

## 사용자 흐름

### 첫 방문자
1. 독후감 피드 접속 (비로그인 읽기 가능)
2. 상호작용 시도 시 로그인 페이지로 이동
3. 서비스 소개 확인 후 회원가입
4. 이메일 인증 완료 후 서비스 이용

### 독후감 작성
1. 플로팅 버튼 클릭
2. 카카오 API로 도서 검색 또는 수동 입력
3. 독후감 작성 (마크다운 지원)
4. 추천/비추천 선택
5. 구매 링크 추가 (선택)
6. 게시 후 피드에 즉시 반영

### 도서 의견 작성
1. 도서 검색
2. 도서 상세 페이지 이동
3. 280자 의견 및 추천/비추천 작성
4. 즉시 게시

## API 통합 가이드

### 카카오 도서 API
- **엔드포인트**: `https://dapi.kakao.com/v3/search/book`
- **인증**: REST API 키 필요
- **일일 할당량**: 300,000회 (2024년 기준)
- **응답 형식**: JSON
- **캐싱 전략**: 검색 결과 24시간 캐싱
- **에러 처리**: 할당량 초과, 네트워크 오류, 잘못된 요청 처리

### 외부 API 의존성
```typescript
// API 클라이언트 예시
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  remaining?: number
}

const handleApiError = (error: any) => {
  if (error.status === 429) {
    // 할당량 초과
    return '일일 검색 한도에 도달했습니다.'
  }
  if (error.status >= 500) {
    // 서버 오류
    return '도서 검색 서비스에 일시적 문제가 있습니다.'
  }
  return '검색 중 오류가 발생했습니다.'
}
```

## 트러블슈팅

### 자주 발생하는 문제

#### 1. 데이터베이스 관련
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 마이그레이션 오류 시 초기화
npx prisma migrate reset

# SQLite 파일 권한 확인
ls -la prisma/dev.db
chmod 644 prisma/dev.db
```

#### 2. 카카오 API 관련
- **할당량 초과**: 캐싱 확인, 불필요한 요청 최소화
- **인증 실패**: API 키 유효성 확인
- **응답 지연**: 타임아웃 설정 및 재시도 로직

#### 3. Next.js 빌드 오류
```bash
# 캐시 클리어
rm -rf .next
npm run build

# 타입 체크
npm run type-check

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 4. 성능 이슈
- **큰 이미지**: Next.js Image 최적화 확인
- **무한 스크롤**: 가상화 적용 여부 확인
- **메모리 누수**: React DevTools Profiler 사용

### 로그 분석
```bash
# PM2 로그 확인
pm2 logs readzone

# Next.js 로그
npm run dev 2>&1 | tee debug.log

# 에러 로그 필터링
pm2 logs readzone --err
```

## 품질 관리

### 코드 품질 기준
- TypeScript strict 모드 준수
- ESLint 규칙 준수
- 단위 테스트 커버리지 80% 이상
- 성능 메트릭 기준치 충족

### 검토 프로세스
1. **기능 검토**: PRD 명세 대비 완성도
2. **코드 검토**: 코딩 스타일 및 품질
3. **성능 검토**: 로딩 속도 및 반응성
4. **사용성 검토**: UX/UI 사용 편의성
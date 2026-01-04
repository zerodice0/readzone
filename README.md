# ReadZone - 독후감 공유 플랫폼

ReadZone은 책을 읽고 독후감을 기록하고 공유하는 현대적인 독서 관리 플랫폼입니다.

## 주요 기능

- **독후감 작성 & 공유**: 책을 검색하고 독후감을 작성하여 공유
- **독서 일기**: 캘린더 기반의 일별 독서 기록
- **독서 통계**: 장르별 독서 패턴, 월별 통계 시각화
- **소셜 기능**: 좋아요, 북마크, 피드 탐색
- **도서 검색**: 알라딘 API 연동 실시간 도서 검색

## 기술 스택

### Backend (Serverless)

| 기술           | 용도                                |
| -------------- | ----------------------------------- |
| **Convex**     | 실시간 데이터베이스 + 서버리스 함수 |
| **Clerk**      | 인증 (OAuth, Email, MFA)            |
| **알라딘 API** | 도서 검색                           |

### Frontend

| 기술              | 버전 | 용도              |
| ----------------- | ---- | ----------------- |
| **React**         | 19   | UI 프레임워크     |
| **TypeScript**    | 5.9  | 타입 안전성       |
| **Vite**          | 7    | 빌드 도구         |
| **Tailwind CSS**  | 4    | 스타일링          |
| **React Router**  | 7    | 라우팅            |
| **Zustand**       | 5    | 상태 관리         |
| **Framer Motion** | 12   | 애니메이션        |
| **Radix UI**      | -    | 접근성 컴포넌트   |
| **Nivo**          | -    | 차트 (Bar, Radar) |

### 개발 도구

| 도구                  | 용도          |
| --------------------- | ------------- |
| **pnpm**              | 패키지 매니저 |
| **Turbo**             | 모노레포 빌드 |
| **ESLint + Prettier** | 코드 품질     |
| **Husky**             | Git hooks     |
| **Vitest**            | 테스트        |

## 시작하기

### 사전 요구사항

- **Node.js** 20.x 이상
- **pnpm** 8.x 이상

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd readzone
pnpm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 다음 값들을 설정합니다:

```bash
# Convex (https://dashboard.convex.dev)
CONVEX_DEPLOYMENT=your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk (https://dashboard.clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev
```

### 3. Convex 설정

```bash
# Convex CLI 로그인 (처음 한 번만)
npx convex login

# 개발 서버 시작 (새 프로젝트 자동 생성)
npx convex dev
```

### 4. 개발 서버 실행

```bash
# 터미널 1: Convex 개발 서버
npx convex dev

# 터미널 2: Frontend 개발 서버
pnpm dev
```

- Frontend: http://localhost:5173
- Convex Dashboard: https://dashboard.convex.dev

## 프로젝트 구조

```
readzone/
├── packages/
│   ├── backend/
│   │   └── convex/           # Convex 함수 및 스키마
│   │       ├── schema.ts     # 데이터베이스 스키마
│   │       ├── reviews.ts    # 리뷰 CRUD
│   │       ├── books.ts      # 도서 관리
│   │       ├── bookmarks.ts  # 북마크
│   │       ├── likes.ts      # 좋아요
│   │       ├── readingDiaries.ts  # 독서 일기
│   │       ├── stats.ts      # 통계
│   │       ├── aladin.ts     # 알라딘 API 연동
│   │       └── http.ts       # HTTP 엔드포인트 (Webhook)
│   │
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/   # 재사용 컴포넌트
│   │   │   ├── pages/        # 페이지 컴포넌트
│   │   │   ├── hooks/        # 커스텀 훅
│   │   │   ├── stores/       # Zustand 스토어
│   │   │   ├── utils/        # 유틸리티
│   │   │   └── lib/          # 라이브러리 설정
│   │   └── public/           # 정적 파일
│   │
│   └── shared/               # 공유 타입 (예정)
│
├── convex.json               # Convex 설정
├── turbo.json                # Turbo 설정
└── pnpm-workspace.yaml       # pnpm 워크스페이스
```

## 주요 스크립트

### 루트

```bash
pnpm dev              # 전체 개발 서버 실행
pnpm build            # 전체 빌드
pnpm lint             # 린트 검사
pnpm format           # 코드 포맷팅
pnpm type-check       # 타입 검사
```

### Convex

```bash
npx convex dev        # 개발 서버 (스키마 자동 동기화)
npx convex deploy     # 프로덕션 배포
npx convex dashboard  # 대시보드 열기
```

### 데이터 백업

```bash
pnpm backup:prod-to-dev    # 프로덕션 → 개발 환경 복사
pnpm backup:export-prod    # 프로덕션 데이터 내보내기
pnpm backup:import-dev     # 개발 환경에 데이터 가져오기
```

## 인증 기능 (Clerk)

ReadZone은 Clerk를 통해 다양한 인증 방식을 지원합니다:

- **이메일 인증**: 이메일 + 비밀번호 로그인
- **소셜 로그인**: Google, GitHub OAuth
- **MFA**: 선택적 2단계 인증
- **세션 관리**: 자동 토큰 갱신

### Clerk 설정

1. [Clerk Dashboard](https://dashboard.clerk.com)에서 앱 생성
2. OAuth 제공자 설정 (Google, GitHub)
3. JWT Template 설정 (Convex 연동용)
4. 환경 변수 복사

## 배포

### Convex 배포

```bash
npx convex deploy --prod
```

### Frontend 배포 (Vercel 권장)

```bash
# Vercel CLI
vercel --prod

# 또는 GitHub 연동으로 자동 배포
```

**환경 변수 설정** (Vercel Dashboard):

- `VITE_CONVEX_URL`: 프로덕션 Convex URL
- `VITE_CLERK_PUBLISHABLE_KEY`: 프로덕션 Clerk 키

## 트러블슈팅

### Convex 관련

**"Convex deployment not found"**

```bash
# 환경 변수 확인
echo $CONVEX_DEPLOYMENT

# 다시 로그인
npx convex logout && npx convex login
```

**스키마 동기화 오류**

```bash
# 개발 서버 재시작
npx convex dev
```

### Clerk 관련

**"Invalid publishable key"**

- `.env` 파일의 `VITE_CLERK_PUBLISHABLE_KEY` 확인
- 개발/프로덕션 키 구분 확인

**OAuth 리디렉션 오류**

- Clerk Dashboard에서 Redirect URLs 설정 확인
- `http://localhost:5173` (개발), `https://your-domain.com` (프로덕션)

### 일반

**pnpm 설치 오류**

```bash
pnpm store prune
rm -rf node_modules packages/*/node_modules
pnpm install
```

## 문서

- [구현 계획서](./IMPLEMENTATION_PLAN.md)
- [디자인 개선 사항](./DESIGN_IMPROVEMENTS.md)
- [프로젝트 원칙](./PROJECT_CONSTITUTION.md)
- [접근성 가이드](./ACCESSIBILITY.md)

## 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

MIT

# Phase 1: Foundation (기반 인프라)

## 목표
ReadZone 프로젝트의 기본 인프라를 구축하고, 개발 환경을 설정하여 이후 Phase들의 기반을 마련합니다.

## 범위

### 1. 프로젝트 초기화
- [ ] Next.js 14 프로젝트 생성 (App Router)
- [ ] TypeScript 설정 (strict mode)
- [ ] ESLint + Prettier 설정
- [ ] 기본 폴더 구조 생성

### 2. 데이터베이스 설정
- [ ] Prisma ORM 설정
- [ ] SQLite 데이터베이스 초기화
- [ ] 기본 스키마 정의 (User, Book, BookReview, BookOpinion)
- [ ] 데이터베이스 마이그레이션

### 3. 인증 시스템
- [ ] NextAuth.js 설정
- [ ] 이메일/비밀번호 인증 Provider
- [ ] JWT 토큰 설정
- [ ] 세션 관리

### 4. 상태 관리
- [ ] Zustand 스토어 설정
- [ ] TanStack Query 설정
- [ ] 기본 상태 타입 정의

### 5. UI 기초 설정
- [ ] Tailwind CSS 설정
- [ ] Radix UI 기본 컴포넌트 설치
- [ ] 디자인 토큰 정의 (색상, 타이포그래피, 간격)
- [ ] 기본 UI 컴포넌트 (Button, Input, Card 등)

## 기술 요구사항

### 의존성 패키지
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "next-auth": "^4.24.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@radix-ui/react-button": "^1.0.0",
    "@radix-ui/react-input": "^1.0.0",
    "@radix-ui/react-card": "^1.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/bcryptjs": "^2.4.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

### TypeScript 설정 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### ESLint 설정 (.eslintrc.json)
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-const": "error",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

## 데이터베이스 스키마

### Prisma Schema (prisma/schema.prisma)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  nickname      String    @unique
  bio           String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  reviews  BookReview[]
  opinions BookOpinion[]
  likes    ReviewLike[]
  comments Comment[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Book {
  id            String   @id @default(cuid())
  isbn          String?  @unique
  title         String
  authors       String
  publisher     String?
  genre         String?
  pageCount     Int?
  thumbnail     String?
  description   String?
  isManualEntry Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  reviews  BookReview[]
  opinions BookOpinion[]
}

model BookReview {
  id            String   @id @default(cuid())
  title         String?
  content       String
  isRecommended Boolean
  tags          String
  purchaseLink  String?
  linkClicks    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId String
  bookId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  book   Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)

  likes    ReviewLike[]
  comments Comment[]
}

model BookOpinion {
  id            String   @id @default(cuid())
  content       String
  isRecommended Boolean
  createdAt     DateTime @default(now())

  userId String
  bookId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  book   Book   @relation(fields: [bookId], references: [id], onDelete: Cascade)

  @@unique([userId, bookId])
}

model ReviewLike {
  id       String @id @default(cuid())
  userId   String
  reviewId String

  user   User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  review BookReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([userId, reviewId])
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId   String
  reviewId String
  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  review   BookReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
}
```

## 폴더 구조

```
readzone/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── index.ts
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   └── validations.ts
├── store/
│   ├── auth-store.ts
│   └── index.ts
├── types/
│   ├── auth.ts
│   ├── database.ts
│   └── index.ts
├── hooks/
│   └── use-session.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── .eslintrc.json
└── package.json
```

## 환경 변수 (.env.example)

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (for future use)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

## 테스트 시나리오

### 1. 프로젝트 초기화 테스트
- [ ] `npm run dev` 실행 성공
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 검사 통과
- [ ] Prettier 포맷팅 적용

### 2. 데이터베이스 테스트
- [ ] Prisma 마이그레이션 실행 성공
- [ ] 데이터베이스 연결 확인
- [ ] Prisma Studio 접근 가능

### 3. 인증 시스템 테스트
- [ ] NextAuth.js 설정 확인
- [ ] 세션 상태 관리 동작
- [ ] JWT 토큰 생성/검증

### 4. UI 컴포넌트 테스트
- [ ] 기본 컴포넌트 렌더링
- [ ] Tailwind CSS 스타일 적용
- [ ] 반응형 디자인 동작

## 완료 기준

### 필수 완료 사항
1. ✅ **프로젝트 설정**: Next.js 14 + TypeScript 환경 구축
2. ✅ **코드 품질**: ESLint/Prettier 설정 완료
3. ✅ **데이터베이스**: Prisma + SQLite 연동 완료
4. ✅ **인증**: NextAuth.js 기본 설정 완료
5. ✅ **상태 관리**: Zustand + TanStack Query 설정
6. ✅ **UI 기반**: Tailwind + Radix UI 컴포넌트 준비

### 검증 방법
1. `npm run dev` 실행 시 오류 없이 개발 서버 시작
2. `npx prisma studio` 실행 시 데이터베이스 접근 가능
3. TypeScript 타입 체크 통과: `npm run type-check`
4. ESLint 검사 통과: `npm run lint`
5. 기본 UI 컴포넌트 렌더링 확인

## 다음 Phase 연계 사항

Phase 1 완료 후 Phase 2에서 활용할 기반 요소:
- 설정된 인증 시스템으로 로그인/회원가입 페이지 구현
- 기본 UI 컴포넌트로 페이지 레이아웃 구성
- Prisma 스키마로 사용자 데이터 관리
- Zustand 스토어로 전역 상태 관리

## 위험 요소 및 대응 방안

### 위험 요소
1. **SQLite 제한사항**: 동시 접속자 수 제한
2. **NextAuth.js 설정 복잡성**: 이메일 인증 설정
3. **TypeScript strict 모드**: 기존 라이브러리 타입 이슈

### 대응 방안
1. **SQLite**: 미니PC 환경에 적합, 추후 PostgreSQL 마이그레이션 고려
2. **NextAuth.js**: 기본 설정부터 단계별 구현
3. **TypeScript**: 타입 정의 파일 작성 및 점진적 적용
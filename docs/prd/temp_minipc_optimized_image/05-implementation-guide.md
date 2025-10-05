# 05. 구현 가이드

> 목적: Phase 1, 2의 모든 수정사항을 단계별로 구현
> 총 소요 시간: 약 1시간 (긴급 + 권장 사항)

## 📋 목차

- [구현 우선순위](#구현-우선순위)
- [Step 1: 긴급 수정](#step-1-긴급-수정-15분)
- [Step 2: 캐싱 설정](#step-2-캐싱-설정-3분)
- [Step 3: 레이지 로딩](#step-3-레이지-로딩-15분)
- [Step 4: 선택적 개선](#step-4-선택적-개선-35분)
- [검증 및 테스트](#검증-및-테스트)
- [트러블슈팅](#트러블슈팅)

---

## 구현 우선순위

### 🔴 긴급 (즉시 적용 - 15분)
1. ✅ settingsStore markAsChanged 수정
2. ✅ useSettings 훅 수정
3. ✅ ProfileSettings store 동기화

### 🟡 권장 (1일 내 - 18분)
4. ✅ 브라우저 캐싱 강화
5. ✅ 프론트엔드 레이지 로딩

### 🟢 선택적 (필요 시 - 35분)
6. ⚠️ 고아 파일 정리 스케줄러
7. ⚠️ 이미지 크기 조정

---

## Step 1: 긴급 수정 (15분)

### 1.1 settingsStore 액션 추가 (3분)

**파일**: `packages/frontend/src/store/settingsStore.ts`

**위치**: 537번째 줄 근처 (유틸리티 함수 섹션)

**추가할 코드**:
```typescript
// 유틸리티 함수들
markAsChanged: () => set((state) => {
  state.hasUnsavedChanges = true
}),

setActiveTab: (tab) => set((state) => {
  state.activeTab = tab
}),
```

**전체 컨텍스트**:
```typescript
export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ... 기존 코드 ...

        // 유틸리티 함수들
        markAsChanged: () => set((state) => {
          state.hasUnsavedChanges = true
        }),

        setActiveTab: (tab) => set((state) => {
          state.activeTab = tab
        }),

        clearError: () => set((state) => {
          state.error = null
          state.fieldErrors = {}
          state.isAuthError = false
        }),

        // ... 나머지 코드 ...
      })),
      // ... persist 설정 ...
    ),
    { name: 'settings-store' }
  )
)
```

### 1.2 useSettings 훅 수정 (2분)

**파일**: `packages/frontend/src/hooks/useSettings.ts`

**위치**: 79번째 줄

**변경 전**:
```typescript
markAsChanged: () => store.setActiveTab(store.activeTab), // Trigger change detection
```

**변경 후**:
```typescript
markAsChanged: store.markAsChanged,
```

### 1.3 ProfileSettings store 동기화 (10분)

**파일**: `packages/frontend/src/components/settings/sections/ProfileSettings.tsx`

**1단계: import 추가** (1-3번째 줄 근처):
```typescript
import React, { useRef, useState } from 'react'
import { clsx } from 'clsx'
import { useImageValidation, useProfileImageUpload } from '@/hooks/useImageUpload'
import { useConfirmation } from '@/hooks/useConfirmation'
import { SettingsActions, SettingsCard, SettingsField, SettingsSection } from '../common/SettingsCard'
import type { UpdateProfileRequest, UserSettingsResponse } from '@/types'
import { useSettingsStore } from '@/store/settingsStore'  // ✅ 추가
import { useAuthStore } from '@/store/authStore'          // ✅ 추가
```

**2단계: handleImageChange 함수 수정** (59-90번째 줄):

```typescript
const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]

  if (!file) {return}

  // 이미지 유효성 검사
  const errors = validateProfileImage(file)

  if (errors.length > 0) {
    setValidationErrors({ profileImage: errors[0] ?? '이미지 유효성 검사에 실패했습니다.' })

    return
  }

  try {
    setValidationErrors({})

    // 이미지 선택 즉시 변경사항으로 표시
    markAsChanged()

    const imageUrl = await uploadProfileImage(file)

    // 로컬 상태 업데이트
    setFormData(prev => ({ ...prev, profileImage: imageUrl }))

    // ✅ settingsStore 동기화 (낙관적 업데이트)
    useSettingsStore.setState((state) => {
      if (state.settings) {
        state.settings.user.profileImage = imageUrl
      }
    })

    // ✅ authStore 동기화 (헤더 등에 즉시 반영)
    useAuthStore.setState((state) => {
      if (state.user) {
        state.user.profileImage = imageUrl
      }
    })
  } catch (error) {
    console.error('Profile image upload failed:', error)
  } finally {
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
}
```

### 검증 (Step 1)

```bash
# 1. TypeScript 타입 체크
npm run type-check

# 2. Lint 검사
npm run lint

# 3. 개발 서버 재시작
npm run dev

# 4. 브라우저 테스트
# http://localhost:3000/settings
# - 이미지 선택 → 버튼 활성화 확인
# - 버튼 클릭 → 저장 확인
# - F5 새로고침 → 이미지 유지 확인
```

---

## Step 2: 캐싱 설정 (3분)

### 2.1 ServeStaticModule 옵션 추가

**파일**: `packages/backend/src/app.module.ts`

**위치**: 36-39번째 줄

**변경 전**:
```typescript
ServeStaticModule.forRoot({
  rootPath: uploadsRoot,
  serveRoot: '/uploads',
})
```

**변경 후**:
```typescript
ServeStaticModule.forRoot({
  rootPath: uploadsRoot,
  serveRoot: '/uploads',
  serveStaticOptions: {
    maxAge: 31536000000,  // 1년 (밀리초)
    immutable: true,
    etag: true,
    lastModified: true,
  },
})
```

### 검증 (Step 2)

```bash
# 1. 백엔드 재시작
npm run dev:backend

# 2. 브라우저 개발자 도구 (F12)
# Network 탭 → 프로필 페이지 접속

# 3. 이미지 요청 확인
# Response Headers:
# ✅ Cache-Control: public, max-age=31536000, immutable
# ✅ ETag: "..."

# 4. 페이지 새로고침 (F5)
# ✅ Status: 304 Not Modified
# ✅ Size: (disk cache)
```

---

## Step 3: 레이지 로딩 (15분)

### 3.1 Avatar 컴포넌트 수정 (5분)

**파일**: `packages/frontend/src/components/ui/avatar.tsx`

**수정 위치**: `<img>` 태그에 속성 추가

**변경 전**:
```typescript
<img
  src={src}
  alt={alt}
  className="w-full h-full object-cover"
/>
```

**변경 후**:
```typescript
<img
  src={src}
  alt={alt}
  loading="lazy"
  decoding="async"
  className="w-full h-full object-cover"
/>
```

### 3.2 ProfileHeader 수정 (3분)

**파일**: `packages/frontend/src/components/profile/ProfileHeader.tsx`

**위치**: 프로필 이미지 `<img>` 태그

```typescript
<img
  src={user.profileImage}
  alt={`${user.username}의 프로필`}
  loading="lazy"      // ✅ 추가
  decoding="async"    // ✅ 추가
  className="w-full h-full object-cover"
/>
```

### 3.3 ReviewCard 수정 (3분)

**파일**: `packages/frontend/src/components/reviews/ReviewCard.tsx`

**위치**: 책 표지 이미지 `<img>` 태그

```typescript
<img
  src={review.book.cover}
  alt={review.book.title}
  loading="lazy"      // ✅ 추가
  decoding="async"    // ✅ 추가
  className="w-full h-48 object-cover"
/>
```

### 3.4 CommentItem 수정 (2분)

**파일**: `packages/frontend/src/components/comments/CommentItem.tsx`

**위치**: 댓글 작성자 프로필 이미지

```typescript
<img
  src={comment.user.profileImage}
  alt={comment.user.username}
  loading="lazy"      // ✅ 추가
  decoding="async"    // ✅ 추가
  className="w-8 h-8 rounded-full"
/>
```

### 3.5 기타 이미지 컴포넌트 (2분)

**추가로 수정할 파일 (있는 경우)**:
```
packages/frontend/src/components/
├── feed/FeedItem.tsx
├── search/SearchResult.tsx
└── books/BookCard.tsx
```

**패턴**: 모든 `<img>` 태그에 동일하게 적용
```typescript
loading="lazy"
decoding="async"
```

### 검증 (Step 3)

```bash
# 1. 개발 서버 재시작
npm run dev:frontend

# 2. 브라우저 개발자 도구 (F12)
# Performance 탭 → 녹화 시작

# 3. 피드 페이지 접속 (스크롤하지 않음)
# ✅ 화면에 보이는 이미지만 로드되는지 확인

# 4. 천천히 스크롤
# ✅ 스크롤에 따라 이미지가 로드되는지 확인

# 5. Network 탭 확인
# ✅ 초기 로딩 시 이미지 요청 수 감소 확인
```

---

## Step 4: 선택적 개선 (35분)

### 4.1 고아 파일 정리 스케줄러 (30분) ⚠️ 선택적

**적용 조건**:
- 디스크 공간이 부족한 경우
- 사용자가 프로필 이미지를 자주 변경하는 경우

**파일**: `packages/backend/src/modules/upload/upload.service.ts`

**1단계: import 추가**:
```typescript
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
```

**2단계: constructor 수정**:
```typescript
constructor(
  private readonly configService: ConfigService,
  private readonly prisma: PrismaService  // ✅ 추가
) {
  // ... 기존 코드 ...
}
```

**3단계: cleanupOrphanFiles 메서드 추가** (파일 끝에 추가):
```typescript
/**
 * 고아 파일 정리 스케줄러
 * 매주 일요일 새벽 3시 실행
 */
@Cron('0 3 * * 0')
async cleanupOrphanFiles() {
  try {
    console.log('[Cleanup] 고아 파일 정리 시작...')

    // 1. 디스크의 모든 아바타 파일 목록
    const avatarsDir = path.join(this.storageRoot, 'uploads', 'avatars')
    const avatarFiles = await fs.readdir(avatarsDir)

    // 2. DB에서 사용 중인 이미지 URL
    const users = await this.prisma.user.findMany({
      select: { profileImage: true },
    })

    const usedFiles = new Set<string>()
    users.forEach((user) => {
      if (user.profileImage) {
        const fileName = path.basename(user.profileImage)
        usedFiles.add(fileName)
      }
    })

    // 3. 1주일 이상 된 고아 파일 삭제
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    let deletedCount = 0

    for (const file of avatarFiles) {
      if (!usedFiles.has(file)) {
        const filePath = path.join(avatarsDir, file)
        const stats = await fs.stat(filePath)

        if (stats.mtimeMs < oneWeekAgo) {
          await fs.unlink(filePath)
          deletedCount++
          console.log(`[Cleanup] 삭제: ${file}`)
        }
      }
    }

    console.log(`[Cleanup] 완료: ${deletedCount}개 파일 삭제`)

    return { deletedCount }
  } catch (error) {
    console.error('[Cleanup] 에러:', error)
    throw error
  }
}
```

**4단계: upload.module.ts 수정**:
```typescript
// packages/backend/src/modules/upload/upload.module.ts
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],  // ✅ 추가
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
```

### 4.2 이미지 크기 조정 (5분) ⚠️ 선택적

**적용 조건**:
- 스토리지 공간이 부족한 경우
- 네트워크 대역폭을 더 절약하고 싶은 경우

**파일 1**: `packages/backend/src/modules/upload/upload.service.ts`

**위치**: 50-52번째 줄

**변경 전**:
```typescript
.resize({
  width: 1600,
  height: 1600,
  fit: 'inside',
  withoutEnlargement: true,
})
```

**변경 후**:
```typescript
.resize({
  width: 1200,  // ✅ 1600 → 1200
  height: 1200,
  fit: 'inside',
  withoutEnlargement: true,
})
```

**파일 2**: `packages/backend/src/modules/users/avatar.service.ts`

**위치**: 106-109번째 줄

**변경 전**:
```typescript
{ key: 'thumbnail', width: 50,  height: 50,  quality: 80 },
{ key: 'small',     width: 100, height: 100, quality: 82 },
{ key: 'medium',    width: 200, height: 200, quality: 85 },
{ key: 'large',     width: 400, height: 400, quality: 90 },
```

**변경 후**:
```typescript
{ key: 'thumbnail', width: 64,  height: 64,  quality: 80 },  // ✅ Retina 대응
{ key: 'small',     width: 128, height: 128, quality: 82 },
{ key: 'medium',    width: 256, height: 256, quality: 85 },
{ key: 'large',     width: 512, height: 512, quality: 90 },
```

---

## 검증 및 테스트

### 전체 시스템 테스트

```bash
# 1. 전체 빌드
npm run build

# 2. 타입 체크
npm run type-check

# 3. Lint 검사
npm run lint

# 4. 테스트 실행 (E2E)
npm run test:e2e

# 5. 개발 서버 실행
npm run dev
```

### 기능 테스트 체크리스트

#### ✅ Phase 1: 긴급 수정
- [ ] 이미지 선택 시 "변경사항 저장" 버튼 활성화
- [ ] 버튼 클릭 시 저장 성공
- [ ] 페이지 새로고침 후 이미지 유지
- [ ] 헤더 프로필 이미지 즉시 반영

#### ✅ Phase 2: 캐싱
- [ ] Response Headers에 Cache-Control 존재
- [ ] 두 번째 요청부터 304 또는 disk cache
- [ ] 네트워크 탭에서 캐싱 확인

#### ✅ Phase 2: 레이지 로딩
- [ ] 화면에 보이는 이미지만 로드
- [ ] 스크롤 시 추가 이미지 로드
- [ ] Performance 탭에서 초기 로딩 개선 확인

#### ⚠️ Phase 2: 고아 파일 정리 (선택적)
- [ ] 스케줄러 등록 확인 (백엔드 로그)
- [ ] 수동 실행 테스트
- [ ] 1주일 후 자동 실행 확인

---

## 트러블슈팅

### 문제 1: "변경사항 저장" 버튼이 여전히 비활성화

**원인**: markAsChanged가 제대로 호출되지 않음

**해결**:
```typescript
// ProfileSettings.tsx에서 확인
console.log('markAsChanged called')  // 디버깅용
markAsChanged()

// 개발자 도구 Console 탭에서 확인
// Application → Local Storage → settings-store
// hasUnsavedChanges: true 확인
```

### 문제 2: 이미지 업로드 후 새로고침 시 사라짐

**원인**: store 동기화가 안됨

**해결**:
```typescript
// 업로드 성공 후 store 상태 확인
console.log('Upload success:', imageUrl)

useSettingsStore.getState().settings?.user.profileImage
// ↑ 이 값이 imageUrl과 동일한지 확인

useAuthStore.getState().user?.profileImage
// ↑ 이 값도 imageUrl과 동일한지 확인
```

### 문제 3: 캐싱이 작동하지 않음

**원인**: ServeStaticModule 옵션 적용 안됨

**해결**:
```bash
# 1. 백엔드 완전 재시작
npm run dev:backend

# 2. 브라우저 캐시 완전 삭제
# 개발자 도구 → Application → Clear storage → Clear site data

# 3. Hard Refresh (Ctrl+Shift+R)

# 4. Response Headers 다시 확인
```

### 문제 4: 레이지 로딩이 작동하지 않음

**원인**: 브라우저가 너무 구버전

**해결**:
```bash
# 브라우저 버전 확인
# Chrome 77+ 필요
# Firefox 75+ 필요
# Safari 15.4+ 필요

# 브라우저 업데이트 후 재시도
```

### 문제 5: TypeScript 타입 에러

**원인**: import 누락 또는 타입 불일치

**해결**:
```typescript
// settingsStore에서 markAsChanged 타입 확인
interface SettingsState {
  // ...
  markAsChanged: () => void  // ✅ 이 타입 추가
}

// ProfileSettings에서 import 확인
import { useSettingsStore } from '@/store/settingsStore'  // ✅
import { useAuthStore } from '@/store/authStore'          // ✅
```

---

## 다음 단계

- [비용 분석 및 효과 측정](./06-cost-analysis.md)
- [Phase 1 상세 가이드](./02-phase1-urgent-fixes.md)
- [Phase 2 상세 가이드](./03-phase2-optimizations.md)
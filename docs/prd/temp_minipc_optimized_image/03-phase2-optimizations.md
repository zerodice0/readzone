# 03. Phase 2: 개인 PC 환경 최적화

> 우선순위: 🟡 권장 (1주일 내)
> 총 예상 소요 시간: 50분
> 목표: 네트워크/스토리지 절약, 성능 개선 (비용 $0)

## 📋 목차

- [최적화 2.1: 브라우저 캐싱 강화](#최적화-21-브라우저-캐싱-강화)
- [최적화 2.2: 고아 파일 정리 스케줄러](#최적화-22-고아-파일-정리-스케줄러)
- [최적화 2.3: 프론트엔드 레이지 로딩](#최적화-23-프론트엔드-레이지-로딩)
- [최적화 2.4: 이미지 크기 조정](#최적화-24-이미지-크기-조정)

---

## 최적화 2.1: 브라우저 캐싱 강화

### 우선순위: 🔴 높음 (즉시 적용)
### 예상 소요 시간: 3분
### 예상 효과: 네트워크 트래픽 70% 감소

### 현재 문제점

```typescript
// packages/backend/src/app.module.ts:36-39
ServeStaticModule.forRoot({
  rootPath: uploadsRoot,
  serveRoot: '/uploads',
  // ❌ 캐싱 옵션 없음 → 매번 서버에서 이미지 다운로드
})
```

**문제**:
- 이미지를 볼 때마다 서버에서 다시 다운로드
- 미니 PC 네트워크 부하 증가
- 페이지 로딩 속도 느림

### 수정 방안

**파일**: `packages/backend/src/app.module.ts`

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
    immutable: true,      // 파일이 절대 변경되지 않음
    etag: true,           // ETag 헤더 활성화
    lastModified: true,   // Last-Modified 헤더 활성화
  },
})
```

### 동작 원리

```
[첫 번째 요청]
클라이언트 → GET /uploads/avatars/user123_medium.webp
서버 → 200 OK + 이미지 데이터
       Cache-Control: public, max-age=31536000, immutable
       ETag: "abc123"
       Last-Modified: Wed, 29 Jan 2025 12:00:00 GMT

[두 번째 요청 (1년 내)]
클라이언트 → (캐시에서 직접 로드)
서버 → (요청 안함) ✅ 네트워크 트래픽 0

[파일 변경 후]
파일명이 변경되므로 (타임스탬프 포함) 자동으로 새 파일 다운로드
```

### 장점

- ✅ **무료**: 설정만 추가
- ✅ **즉각 효과**: 재배포 없이 적용
- ✅ **네트워크 절약**: 두 번째 방문부터 이미지 로딩 없음
- ✅ **미니 PC 부하 감소**: 정적 파일 서빙 요청 대폭 감소

### 검증 방법

```
1. 수정 후 백엔드 재시작: npm run dev:backend
2. 브라우저 개발자 도구 (F12) → Network 탭
3. 프로필 페이지 접속 → 이미지 요청 확인
4. Response Headers 확인:
   ✅ Cache-Control: public, max-age=31536000, immutable
   ✅ ETag: "..."
5. 페이지 새로고침 (F5)
6. ✅ 두 번째 요청부터 "(disk cache)" 또는 "304 Not Modified" 확인
```

---

## 최적화 2.2: 고아 파일 정리 스케줄러

### 우선순위: 🟢 선택적 (디스크 공간 부족 시)
### 예상 소요 시간: 30분
### 예상 효과: 디스크 공간 5-10% 절약

### 문제 상황

**고아 파일 발생 시나리오**:
1. 사용자가 프로필 이미지 업로드 (파일 생성)
2. 다시 다른 이미지로 변경 (새 파일 생성, 이전 파일 잔류)
3. DB에는 새 파일 URL만 저장됨
4. ❌ 이전 파일은 디스크에 남아있음 (고아 파일)

### 수정 방안

**파일**: `packages/backend/src/modules/upload/upload.service.ts`

**새 메서드 추가**:
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService  // ✅ 추가
  ) {
    // ...
  }

  /**
   * 고아 파일 정리 스케줄러
   * 매주 일요일 새벽 3시 실행
   */
  @Cron('0 3 * * 0')  // 또는 CronExpression.EVERY_WEEK
  async cleanupOrphanFiles() {
    try {
      console.log('[Cleanup] 고아 파일 정리 시작...')

      // 1. 디스크의 모든 이미지 파일 목록 가져오기
      const avatarsDir = path.join(this.storageRoot, 'uploads', 'avatars')
      const imagesDir = path.join(this.storageRoot, 'uploads', 'images')

      const avatarFiles = await fs.readdir(avatarsDir)
      const imageFiles = await fs.readdir(imagesDir)

      // 2. DB에서 사용 중인 이미지 URL 가져오기
      const users = await this.prisma.user.findMany({
        select: { profileImage: true },
      })

      const reviews = await this.prisma.review.findMany({
        select: { content: true },  // 마크다운에서 이미지 URL 추출 필요
      })

      // 3. 사용 중인 파일명 추출
      const usedFiles = new Set<string>()

      users.forEach((user) => {
        if (user.profileImage) {
          const fileName = path.basename(user.profileImage)
          usedFiles.add(fileName)
        }
      })

      // 4. 1주일 이상 된 고아 파일 삭제
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
}
```

**모듈 수정 필요**:
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

### 스케줄 옵션

| Cron 표현식 | 실행 주기 | 권장 환경 |
|------------|----------|----------|
| `0 3 * * 0` | 매주 일요일 새벽 3시 | ✅ 개인 PC (권장) |
| `0 3 * * *` | 매일 새벽 3시 | 파일 많을 때 |
| `0 3 1 * *` | 매월 1일 새벽 3시 | 파일 적을 때 |

### 장점

- ✅ **무료**: 자동 실행
- ✅ **디스크 절약**: 불필요한 파일 제거
- ✅ **안전**: 1주일 이상 된 파일만 삭제

### 주의사항

- ⚠️ **낮은 우선순위**: 디스크 공간이 충분하면 스킵 가능
- ⚠️ **백업 권장**: 삭제 전 로그 확인

---

## 최적화 2.3: 프론트엔드 레이지 로딩

### 우선순위: 🔴 높음 (즉시 적용)
### 예상 소요 시간: 15분
### 예상 효과: 초기 로딩 속도 30-50% 개선

### 현재 문제점

```typescript
// ❌ 모든 이미지가 페이지 로드 시 즉시 다운로드됨
<img src={user.profileImage} alt="프로필" />
```

**문제**:
- 피드에 20개 독후감 → 20개 프로필 이미지 동시 다운로드
- 초기 페이지 로딩 느림
- 스크롤하지 않은 하단 이미지도 미리 로드

### 수정 방안

**수정할 파일 목록**:
```
packages/frontend/src/components/
├── profile/ProfileHeader.tsx
├── ui/avatar.tsx
├── reviews/ReviewCard.tsx
└── comments/CommentItem.tsx
```

**변경 전**:
```typescript
<img
  src={profileImage}
  alt="프로필 이미지"
  className="w-full h-full object-cover"
/>
```

**변경 후**:
```typescript
<img
  src={profileImage}
  alt="프로필 이미지"
  className="w-full h-full object-cover"
  loading="lazy"      // ✅ 레이지 로딩
  decoding="async"    // ✅ 비동기 디코딩
/>
```

### 동작 원리

```
[일반 로딩]
페이지 로드 → 모든 이미지 즉시 다운로드 (20개)
           → 네트워크 혼잡, 느린 로딩

[레이지 로딩]
페이지 로드 → 화면에 보이는 이미지만 다운로드 (3-5개)
스크롤 ↓   → 이미지가 뷰포트 근처에 오면 다운로드
           → 빠른 초기 로딩, 네트워크 효율적 사용
```

### 적용 예시

**1. Avatar 컴포넌트**:
```typescript
// packages/frontend/src/components/ui/avatar.tsx
interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ src, alt = '사용자', size = 'md' }: AvatarProps) {
  return (
    <div className={clsx('rounded-full overflow-hidden', sizeClasses[size])}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"       // ✅
          decoding="async"     // ✅
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  )
}
```

**2. ReviewCard 컴포넌트**:
```typescript
// packages/frontend/src/components/reviews/ReviewCard.tsx
<img
  src={review.book.cover}
  alt={review.book.title}
  loading="lazy"       // ✅
  decoding="async"     // ✅
  className="w-full h-48 object-cover"
/>
```

### 브라우저 지원

| 브라우저 | loading="lazy" | decoding="async" |
|---------|----------------|------------------|
| Chrome 77+ | ✅ | ✅ |
| Firefox 75+ | ✅ | ✅ |
| Safari 15.4+ | ✅ | ✅ |
| Edge 79+ | ✅ | ✅ |

**호환성**: ✅ 모든 모던 브라우저 지원, 미지원 브라우저는 무시 (하위 호환)

### 장점

- ✅ **무료**: HTML 속성만 추가
- ✅ **네이티브 지원**: 추가 라이브러리 불필요
- ✅ **성능 개선**: 초기 로딩 30-50% 빨라짐
- ✅ **메모리 절약**: 필요한 이미지만 메모리 로드

---

## 최적화 2.4: 이미지 크기 조정

### 우선순위: 🟢 선택적 (스토리지 부족 시)
### 예상 소요 시간: 5분
### 예상 효과: 스토리지 20% 절약

### 현재 크기

```typescript
// upload.service.ts:50-52
.resize({
  width: 1600,   // ⚠️ 다소 큼
  height: 1600,
  fit: 'inside',
  withoutEnlargement: true,
})

// avatar.service.ts:106-109
{ key: 'thumbnail', width: 50,  height: 50,  quality: 80 },   // ⚠️ Retina 미대응
{ key: 'small',     width: 100, height: 100, quality: 82 },
{ key: 'medium',    width: 200, height: 200, quality: 85 },
{ key: 'large',     width: 400, height: 400, quality: 90 },
```

### 권장 크기

**일반 이미지** (독후감 첨부):
```typescript
// packages/backend/src/modules/upload/upload.service.ts
.resize({
  width: 1200,   // ✅ 1600 → 1200 (독후감에 충분)
  height: 1200,
  fit: 'inside',
  withoutEnlargement: true,
})
```

**아바타 이미지** (Retina 대응):
```typescript
// packages/backend/src/modules/users/avatar.service.ts
{ key: 'thumbnail', width: 64,  height: 64,  quality: 80 },   // ✅ 50 → 64
{ key: 'small',     width: 128, height: 128, quality: 82 },   // ✅ 100 → 128
{ key: 'medium',    width: 256, height: 256, quality: 85 },   // ✅ 200 → 256
{ key: 'large',     width: 512, height: 512, quality: 90 },   // ✅ 400 → 512
```

### Retina 디스플레이 대응

```
[일반 디스플레이]
50x50 CSS → 50x50 물리 픽셀

[Retina (2x)]
50x50 CSS → 100x100 물리 픽셀
          → 64x64 이미지면 선명하게 표시

[MacBook Pro (3x)]
50x50 CSS → 150x150 물리 픽셀
          → 64x64로도 충분 (품질 저하 미미)
```

### 장점

- ✅ **스토리지 절약**: 파일 크기 약 20% 감소
- ✅ **Retina 대응**: 고해상도 디스플레이에서도 선명
- ✅ **네트워크 효율**: 약간 빠른 다운로드

### 주의사항

- ⚠️ **선택적**: 디스크 공간 충분하면 스킵 가능
- ⚠️ **호환성**: 기존 이미지는 그대로 유지 (새 업로드만 적용)

---

## 적용 순서

### 1단계: 즉시 적용 (3분)
- ✅ 브라우저 캐싱 강화 (app.module.ts)

### 2단계: 1일 내 (15분)
- ✅ 프론트엔드 레이지 로딩 (Avatar, ReviewCard 등)

### 3단계: 필요시 (30-35분)
- ⚠️ 고아 파일 정리 스케줄러 (디스크 부족 시)
- ⚠️ 이미지 크기 조정 (스토리지 절약 필요 시)

---

## 다음 단계

- [Phase 3: 제외 항목](./04-phase3-excluded-items.md)
- [구현 가이드](./05-implementation-guide.md)
# 01. ReadZone 이미지 저장 구조 완전 분석

> 작성일: 2025-01-30
> 목적: 현재 이미지 시스템 구조 파악 및 최적화 방향 결정

## 📋 목차

- [현재 구현 구조](#현재-구현-구조)
- [아키텍처 개요](#아키텍처-개요)
- [핵심 파일 구조](#핵심-파일-구조)
- [이미지 최적화 로직](#이미지-최적화-로직)
- [DB vs 파일시스템 비교](#db-vs-파일시스템-비교)
- [최종 권장 사항](#최종-권장-사항)

---

## 현재 구현 구조

### 저장 방식
✅ **로컬 파일시스템** (외부 서비스 미사용)

- **저장 위치**: `packages/backend/storage/uploads/`
- **정적 파일 서빙**: NestJS `ServeStaticModule`
- **DB 저장**: URL 경로만 저장 (`VARCHAR(255)`)

### 디렉터리 구조

```
📁 packages/backend/storage/uploads/
├── 📁 avatars/          # 프로필 이미지 (4가지 사이즈)
│   ├── user123_1234567890_thumbnail.webp  (50x50, 80% quality)
│   ├── user123_1234567890_small.webp      (100x100, 82% quality)
│   ├── user123_1234567890_medium.webp     (200x200, 85% quality)
│   └── user123_1234567890_large.webp      (400x400, 90% quality)
└── 📁 images/           # 일반 이미지 (독후감 등)
    └── image_1234567890_abc123.webp       (최대 1600x1600, 85% quality)
```

---

## 아키텍처 개요

### 요청 흐름

```
[클라이언트]
    ↓
[POST /api/users/:id/avatar]
    ↓
[AvatarService] → Sharp 이미지 처리 → 4가지 사이즈 생성
    ↓
[파일시스템 저장] → /storage/uploads/avatars/
    ↓
[DB 업데이트] → User.profileImage = URL
    ↓
[응답] { profileImage: "http://localhost:3001/uploads/avatars/...", sizes: {...} }
```

### 이미지 서빙 흐름

```
[클라이언트 요청]
    ↓
GET http://localhost:3001/uploads/avatars/user123_medium.webp
    ↓
[ServeStaticModule] → 정적 파일 직접 서빙
    ↓
[응답] 이미지 데이터 + 캐싱 헤더
```

---

## 핵심 파일 구조

| 파일 경로 | 역할 | 주요 기능 |
|----------|------|---------|
| `backend/src/modules/upload/upload.service.ts` | 일반 이미지 업로드 | Sharp 기반 WebP 변환, 1600px 리사이징 |
| `backend/src/modules/users/avatar.service.ts` | 프로필 이미지 전용 | 4가지 사이즈 멀티 생성, 병렬 처리 |
| `backend/src/modules/upload/upload.controller.ts` | 업로드 API | `/upload/image` 엔드포인트 |
| `backend/src/modules/users/users.controller.ts` | 아바타 API | `/users/:id/avatar` 엔드포인트 |
| `backend/src/app.module.ts` | 정적 파일 설정 | ServeStaticModule 설정 |

### 코드 참조 위치

```typescript
// upload.service.ts:48-57 - 이미지 최적화 로직
await sharp(file.buffer)
  .rotate()                    // EXIF 회전 보정
  .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
  .toFormat('webp', { quality: 85 })
  .toFile(destination)

// avatar.service.ts:68-72 - 멀티 사이즈 병렬 생성
const savedVariants = await Promise.all(
  this.getVariantConfig().map((variant) =>
    this.generateVariant(file.buffer, baseName, variant)
  )
)

// app.module.ts:36-39 - 정적 파일 서빙
ServeStaticModule.forRoot({
  rootPath: uploadsRoot,
  serveRoot: '/uploads',
})
```

---

## 이미지 최적화 로직

### ✅ 구현된 최적화 기능

#### 1. Sharp 라이브러리 기반 처리

| 최적화 | 구현 여부 | 위치 | 효과 |
|--------|----------|------|------|
| EXIF 회전 보정 | ✅ | upload.service.ts:49 | 모바일 사진 자동 회전 |
| WebP 변환 | ✅ | upload.service.ts:56 | JPEG 대비 25-35% 용량 절감 |
| 비율 유지 리사이징 | ✅ | upload.service.ts:50-54 | 원본 비율 보존 |
| 확대 방지 | ✅ | upload.service.ts:54 | 저해상도 이미지 블러 방지 |

#### 2. 프로필 이미지 멀티 사이즈

```typescript
// avatar.service.ts:104-111
const variants = [
  { key: 'thumbnail', width: 50,  height: 50,  quality: 80 },  // 피드용
  { key: 'small',     width: 100, height: 100, quality: 82 },  // 댓글용
  { key: 'medium',    width: 200, height: 200, quality: 85 },  // 프로필용
  { key: 'large',     width: 400, height: 400, quality: 90 },  // 상세페이지용
]
```

**최적화 효과**:
- 피드에서 50x50 썸네일 사용 시 원본 대비 **96% 용량 절감**
- 네트워크 트래픽 대폭 감소

#### 3. 보안 검증

```typescript
// 파일 크기 검증 (upload.service.ts:39-41)
if (file.size > 5 * 1024 * 1024) {
  throw new BadRequestException('이미지 크기는 5MB 이하여야 합니다.')
}

// MIME 타입 검증 (avatar.service.ts:55-58)
if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
  throw new BadRequestException('JPG, PNG, WebP 형식만 지원')
}
```

---

## DB vs 파일시스템 비교

### 🗄️ 방안 1: DB 저장 (BYTEA/BLOB)

#### 장점
- ✅ 백업 단순화 (DB 백업만으로 완전 복원)
- ✅ 트랜잭션 지원 (원자적 저장)
- ✅ 권한 관리 (Row-Level Security)

#### 단점
- ❌ **성능 저하**: DB 쿼리 오버헤드 (파일시스템 대비 2-5배 느림)
- ❌ **DB 크기 폭증**: 100명 = 20MB, 1만명 = 2GB
- ❌ **네트워크 부하**: 모든 요청이 백엔드 경유 (CDN 불가)
- ❌ **복잡한 캐싱**: 응답 헤더 수동 관리 필요

### 📁 방안 2: 파일시스템 저장 (현재 방식) ✅ 권장

#### 장점
- ✅ **고성능**: OS 레벨 최적화, Nginx급 성능
- ✅ **확장성**: CDN 연동 용이
- ✅ **브라우저 캐싱**: HTTP 304 자동 지원
- ✅ **DB 부하 감소**: URL만 저장 (255 bytes)

#### 단점
- ⚠️ **백업 복잡성**: DB와 별도 백업 필요
  - **해결책**: rsync, cron 자동화
- ⚠️ **고아 파일 발생**: DB 레코드 삭제 후 파일 잔류
  - **해결책**: 주기적 정리 스케줄러

---

## 최종 권장 사항

### ✅ 파일시스템 저장 유지 (현재 구조)

#### 권장 이유

1. **성능**: 백엔드 서버 부하 최소화
2. **확장성**: 향후 CDN 연동 가능
3. **비용 효율**: PostgreSQL 용량 제한 회피
4. **표준 방식**: 대부분의 웹 서비스 채택

#### 개인 미니 PC 환경 적합성

- ✅ 네트워크 트래픽 최소화
- ✅ DB 리소스 절약
- ✅ 로컬 디스크 활용 (무제한)
- ✅ 백업 간편 (폴더 복사)

---

## 다음 단계

- [Phase 1: 긴급 수정사항](./02-phase1-urgent-fixes.md)
- [Phase 2: 최적화 방안](./03-phase2-optimizations.md)
- [Phase 3: 제외 항목](./04-phase3-excluded-items.md)
- [구현 가이드](./05-implementation-guide.md)
- [비용 분석](./06-cost-analysis.md)
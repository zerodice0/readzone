# 04. Phase 3: 적용하지 않는 항목

> 목적: 개인 미니 PC 환경에 불필요하거나 과도한 최적화 제외
> 비용 절감 원칙: 무료 또는 필수 기능만 구현

## 📋 목차

- [CDN 연동](#cdn-연동)
- [WebP 폴백](#webp-폴백)
- [AWS S3 마이그레이션](#aws-s3-마이그레이션)
- [이미지 처리 워커](#이미지-처리-워커)
- [요약](#요약)

---

## CDN 연동

### ❌ 적용하지 않음

### 일반적인 CDN 사용 이유

```
[CDN 없음]
사용자 (한국) → 서버 (미국) → 200ms 지연
사용자 (일본) → 서버 (미국) → 150ms 지연
사용자 (유럽) → 서버 (미국) → 300ms 지연

[CDN 적용]
사용자 (한국) → CDN (서울) → 20ms 지연
사용자 (일본) → CDN (도쿄) → 15ms 지연
사용자 (유럽) → CDN (런던) → 30ms 지연

✅ 전 세계 엣지 서버에서 이미지 캐싱
✅ 원본 서버 부하 감소
✅ 글로벌 배포 시 필수
```

### 개인 미니 PC 환경에서 불필요한 이유

#### 1. 로컬 네트워크 환경

```
[실제 환경]
사용자 (가족/친구) → 같은 공유기 → 미니 PC
                  → 지연 시간: 1-5ms ✅

CDN을 써도:
사용자 → 인터넷 → Cloudflare → 인터넷 → 미니 PC
     → 지연 시간: 50-100ms ❌ 오히려 느려짐
```

**결론**: 로컬 네트워크가 CDN보다 훨씬 빠름

#### 2. 사용자 수 제한

```
[대규모 서비스]
동시 접속 1만명 → 초당 1만 이미지 요청
                → 서버 과부하 → CDN 필수

[개인 프로젝트]
동시 접속 10명 이하 → 초당 10-20 이미지 요청
                   → 미니 PC로 충분 → CDN 불필요
```

#### 3. 비용 vs 효과

| CDN 서비스 | 무료 플랜 | 유료 플랜 | 개인 PC 효과 |
|-----------|----------|----------|-------------|
| Cloudflare | 무료 (무제한) | $20/월부터 | ⚠️ 설정 복잡 |
| AWS CloudFront | 1TB/월 무료 (1년) | $0.085/GB | ❌ 로컬에서 의미 없음 |
| Vercel | 100GB/월 무료 | $20/월 | ❌ 백엔드 미지원 |

**무료 플랜도 있지만**:
- 설정 복잡도 증가
- 도메인 설정 필요
- 로컬 환경에서 효과 없음

### 향후 고려 시점

✅ **CDN 필요한 경우**:
- 외부 인터넷 공개 시
- 지역적으로 떨어진 사용자 접속 시
- 동시 접속 100명 이상
- 대역폭 비용 절감 필요 시

**현재는 불필요** → Phase 3에서 제외

---

## WebP 폴백

### ❌ 적용하지 않음

### 일반적인 WebP 폴백 이유

```
[문제 상황]
구형 브라우저 (IE11, Safari 13 등) → WebP 미지원
                                  → 이미지 깨짐

[해결 방법]
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="폴백">
</picture>

✅ WebP 지원 브라우저 → WebP 로드 (작은 용량)
✅ 미지원 브라우저 → JPEG 로드 (호환성)
```

### 개인 환경에서 불필요한 이유

#### 1. 모던 브라우저만 사용

| 브라우저 | WebP 지원 버전 | 현재 점유율 | 개인 PC 사용 여부 |
|---------|---------------|------------|-----------------|
| Chrome 23+ | ✅ 2012년부터 | 65% | ✅ 사용 |
| Firefox 65+ | ✅ 2019년부터 | 3% | ✅ 사용 |
| Safari 14+ | ✅ 2020년부터 | 20% | ✅ 사용 (macOS) |
| Edge 18+ | ✅ 2018년부터 | 5% | ✅ 사용 |
| IE11 | ❌ 미지원 | 0.5% | ❌ 사용 안함 |

**결론**: 개인 프로젝트에서는 IE11 지원 불필요

#### 2. 중복 저장 부담

```
[WebP + JPEG 동시 저장]
프로필 이미지 1개 = 4 variants × 2 formats = 8 파일
                  = 약 400KB (WebP) + 600KB (JPEG) = 1MB

100명 사용 시:
WebP만: 40MB
WebP + JPEG: 100MB ❌ 스토리지 2.5배 사용
```

#### 3. 코드 복잡도 증가

```typescript
// ❌ 복잡한 코드
async generateVariant(buffer, baseName, variant) {
  // WebP 생성
  await sharp(buffer)
    .toFormat('webp', { quality: variant.quality })
    .toFile(`${baseName}_${variant.key}.webp`)

  // JPEG 생성 (폴백용)
  await sharp(buffer)
    .toFormat('jpeg', { quality: variant.quality })
    .toFile(`${baseName}_${variant.key}.jpg`)

  return {
    webp: `${baseName}_${variant.key}.webp`,
    jpeg: `${baseName}_${variant.key}.jpg`
  }
}

// ✅ 현재 단순한 코드
await sharp(buffer)
  .toFormat('webp', { quality: variant.quality })
  .toFile(`${baseName}_${variant.key}.webp`)
```

### 향후 고려 시점

✅ **WebP 폴백 필요한 경우**:
- IE11 지원 요구사항 있을 시
- Safari 13 이하 지원 필요 시
- 기업 환경 (구형 브라우저 사용) 배포 시

**현재는 불필요** → Phase 3에서 제외

---

## AWS S3 마이그레이션

### ❌ 적용하지 않음

### 일반적인 S3 사용 이유

```
[로컬 스토리지 문제점]
- 서버 디스크 용량 제한
- 백업 복잡
- 확장성 제한
- 다중 서버 환경에서 동기화 어려움

[S3 장점]
- 무제한 스토리지
- 자동 백업/복제
- CloudFront CDN 연동
- 다중 서버 환경 지원
- 내구성 99.999999999%
```

### 개인 미니 PC 환경에서 불필요한 이유

#### 1. 로컬 디스크로 충분

```
[예상 사용량]
100명 × 1MB (프로필) = 100MB
1000개 독후감 × 500KB (책 표지) = 500MB
총 예상: ~1GB

[미니 PC 디스크]
일반적인 SSD: 256GB ~ 1TB
사용 가능: 충분함 ✅
```

#### 2. 비용 발생

| 항목 | AWS S3 비용 | 개인 PC |
|------|------------|---------|
| 스토리지 | $0.023/GB/월 | $0 (무료) |
| 요청 | $0.0004/1000 GET | $0 (무료) |
| 데이터 전송 | $0.09/GB | $0 (로컬) |

**예시 (1GB 저장, 월 10만 요청)**:
- S3: $0.023 + $0.04 = **$0.063/월** = **$0.76/년**
- 로컬: **$0** ✅

작은 금액이지만 불필요한 지출

#### 3. 네트워크 지연

```
[S3 사용 시]
미니 PC → 인터넷 → AWS S3 (미국) → 이미지 다운로드
      → 50-100ms 지연

[로컬 저장]
미니 PC → 로컬 디스크 → 이미지 로드
      → 1-5ms 지연 ✅ 20-100배 빠름
```

#### 4. 설정 복잡도

```typescript
// ❌ S3 설정 필요
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

// 환경 변수 추가:
// AWS_REGION=us-east-1
// AWS_ACCESS_KEY_ID=...
// AWS_SECRET_ACCESS_KEY=...
// AWS_BUCKET_NAME=...

// ✅ 현재 단순한 코드
await fs.writeFile(destination, buffer)  // 끝
```

### 향후 고려 시점

✅ **S3 필요한 경우**:
- 외부 인터넷 공개 시
- 다중 서버 환경 구축 시
- 스토리지 10GB 이상 필요 시
- 자동 백업/복제 필요 시

**현재는 불필요** → Phase 3에서 제외

---

## 이미지 처리 워커

### ❌ 적용하지 않음

### 일반적인 워커 사용 이유

```
[동기 처리 (현재)]
사용자 → 이미지 업로드 → Sharp 처리 (100ms) → 응답
                                         ↓
                                    사용자 대기

[비동기 워커]
사용자 → 이미지 업로드 → 즉시 응답 (5ms) ✅
                     ↓
                [백그라운드]
                Bull Queue → Sharp 처리 (100ms)
                          → DB 업데이트
                          → WebSocket 알림

✅ 빠른 응답
✅ 서버 부하 분산
✅ 재시도 로직
```

### 개인 환경에서 불필요한 이유

#### 1. Sharp 처리 속도

```
[실제 측정]
프로필 이미지 (4 variants):
- 50x50:   10ms
- 100x100: 15ms
- 200x200: 25ms
- 400x400: 50ms
총: 100ms ✅ 충분히 빠름

일반 이미지 (1200px):
- 처리: 50-80ms ✅ 무시할 수준
```

**결론**: 동기 처리로 충분히 빠름

#### 2. 설정 복잡도

```typescript
// ❌ Bull Queue 설정
import { BullModule } from '@nestjs/bull'
import { Queue } from 'bull'

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
})

// Redis 서버 설치 필요
// sudo apt install redis-server

// ✅ 현재 단순한 코드
const imageUrl = await uploadService.uploadImage(file)
```

#### 3. 인프라 증가

```
[현재]
미니 PC → Node.js 서버 (NestJS)
       → PostgreSQL (Neon)

[워커 추가 시]
미니 PC → Node.js 서버 (NestJS)
       → PostgreSQL (Neon)
       → Redis (워커 큐) ❌ 추가 프로세스
       → Worker 프로세스 ❌ 추가 프로세스
```

**메모리/CPU 낭비**

#### 4. 사용자 경험

```
[동기 처리]
업로드 → 100ms 대기 → 완료 ✅
                   → 즉시 이미지 표시

[비동기 워커]
업로드 → 즉시 응답 → "처리 중..." 표시
      → 5초 후 → 완료 알림 ❌ 오히려 불편
```

**소규모 환경에서는 동기 처리가 더 직관적**

### 향후 고려 시점

✅ **워커 필요한 경우**:
- 이미지 처리 시간 5초 이상
- 동시 업로드 100건 이상
- 복잡한 이미지 처리 (필터, AI 등)
- 대규모 배치 작업

**현재는 불필요** → Phase 3에서 제외

---

## 요약

| 항목 | 일반적 효과 | 개인 PC 환경 | 결정 |
|------|-----------|------------|------|
| CDN 연동 | 글로벌 배포 필수 | 로컬 네트워크로 충분 | ❌ 제외 |
| WebP 폴백 | 구형 브라우저 지원 | 모던 브라우저만 사용 | ❌ 제외 |
| AWS S3 | 무제한 확장 | 로컬 디스크로 충분 | ❌ 제외 |
| 워커 큐 | 대규모 처리 | 동기 처리로 충분 | ❌ 제외 |

### 핵심 원칙

✅ **YAGNI (You Aren't Gonna Need It)**
- 현재 필요하지 않은 기능은 추가하지 않음
- 과도한 엔지니어링 방지

✅ **비용 최소화**
- 무료 또는 필수 기능만 구현
- 불필요한 외부 서비스 배제

✅ **단순성 유지**
- 복잡한 설정 회피
- 유지보수 용이성 확보

---

## 다음 단계

- [구현 가이드](./05-implementation-guide.md)
- [비용 분석](./06-cost-analysis.md)
# Draft System Cron Jobs Deployment Guide

ReadZone의 개선된 임시저장 시스템을 위한 자동화 작업 배포 가이드입니다.

## 🎯 개요

이 가이드는 PRD에서 정의된 다음 자동화 요구사항을 구현합니다:

- **FR-3**: 7일 보관, 24시간 전 알림, 일일 배치 삭제, 사용자당 최대 5개 제한
- **성능 요구사항**: <500ms 저장, <1s 목록 조회, <2s 복원
- **보안**: Cron 작업 인증, Rate Limiting, 입력 검증

## 📋 구현된 기능

### 1. 자동 정리 시스템 (`/api/cron/cleanup-drafts`)
- ✅ 만료된 Draft 상태 업데이트 (EXPIRED)
- ✅ 7일 이상된 Draft 자동 삭제
- ✅ 사용자당 5개 초과 Draft 정리
- ✅ 고아 Draft 제거 (삭제된 사용자)
- ✅ 감사 로그 생성
- ✅ Dry-run 모드 지원

### 2. 만료 알림 시스템 (`/api/cron/notify-expiring-drafts`)
- ✅ 48시간 내 만료 - 조기 경고
- ✅ 24시간 내 만료 - 최종 경고
- ✅ 이미 만료 - 만료 알림
- ✅ 이메일 발송 시뮬레이션
- ✅ 알림 통계 및 분류

### 3. 시스템 모니터링 (`/api/admin/draft-monitor`)
- ✅ 실시간 통계 및 건강 상태
- ✅ 성능 메트릭 추적
- ✅ 추천 사항 및 알림 생성
- ✅ 종합 건강 점수 (0-100)

### 4. 사용자 API
- ✅ 만료 예정 알림 조회 (`/api/reviews/draft/warnings`)
- ✅ 만료일 연장 (`/api/reviews/draft/[id]/extend`)

## 🚀 배포 절차

### 1. 환경 변수 설정

`.env.local` 또는 배포 환경에 다음 변수를 추가:

```bash
# Cron 작업 보안 토큰 (필수)
CRON_SECRET="your-secure-random-string-here"

# 앱 기본 URL (필수)
NEXT_PUBLIC_BASE_URL="https://your-domain.com"

# 이메일 서비스 설정 (선택적)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 2. 데이터베이스 마이그레이션

현재 Prisma 스키마에는 이미 필요한 필드들이 포함되어 있습니다:

```bash
npx prisma migrate deploy
```

### 3. Cron 작업 설정

자동 설정 스크립트 실행:

```bash
chmod +x scripts/setup-cron-jobs.sh
sudo ./scripts/setup-cron-jobs.sh
```

또는 수동으로 crontab 설정:

```bash
# 매일 새벽 2시 - Draft 정리
0 2 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" -H "Content-Type: application/json" "https://your-domain.com/api/cron/cleanup-drafts"

# 매일 오전 9시 - 만료 알림
0 9 * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" -H "Content-Type: application/json" "https://your-domain.com/api/cron/notify-expiring-drafts"

# 6시간마다 - 시스템 건강 체크
0 */6 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" "https://your-domain.com/api/admin/draft-monitor"
```

### 4. 로그 모니터링 설정

로그 디렉토리 생성:
```bash
sudo mkdir -p /var/log/readzone
sudo chmod 755 /var/log/readzone
```

로그 순환 설정:
```bash
sudo tee /etc/logrotate.d/readzone-drafts > /dev/null << EOF
/var/log/readzone/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
}
EOF
```

## 🔧 운영 가이드

### 수동 작업 실행

#### Draft 정리 (Dry-run)
```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}' \
  https://your-domain.com/api/cron/cleanup-drafts
```

#### 만료 알림 발송
```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://your-domain.com/api/cron/notify-expiring-drafts
```

#### 시스템 상태 확인
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/admin/draft-monitor
```

### 모니터링 지표

#### 핵심 메트릭
- **건강 점수**: 70점 이하 시 주의
- **만료된 Draft**: 100개 초과 시 정리 필요
- **동기화 대기**: 50개 초과 시 배치 실행
- **응답 시간**: 500ms 초과 시 성능 점검

#### 알림 임계값
- **Critical**: 24시간 내 만료 20개 이상
- **Warning**: 디스크 사용량 80% 이상
- **Error**: DB 연결 실패, API 응답 실패

### 로그 파일 위치

```
/var/log/readzone/
├── cleanup-drafts.log      # Draft 정리 로그
├── notify-expiring-drafts.log  # 알림 발송 로그
├── health-check.log        # 건강 상태 로그
└── monitor.log            # 종합 모니터링 로그
```

### 문제 해결

#### 1. Cron 작업이 실행되지 않음
```bash
# Cron 서비스 상태 확인
sudo systemctl status cron

# Cron 로그 확인
sudo tail -f /var/log/syslog | grep CRON

# Crontab 확인
crontab -l
```

#### 2. API 인증 실패
```bash
# CRON_SECRET 확인
echo $CRON_SECRET

# 환경 변수 재로드
source .env.local
```

#### 3. 높은 메모리 사용량
```bash
# 시스템 리소스 확인
free -h
df -h

# Draft 통계 확인
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/admin/draft-monitor | jq '.data.statistics'
```

## 📊 성능 최적화

### 데이터베이스 인덱스

현재 스키마에는 다음 인덱스가 설정되어 있습니다:

```sql
-- Draft 정리 최적화
@@index([expiresAt, status], name: "cleanup_queue")

-- 사용자별 Draft 조회 최적화  
@@index([userId, updatedAt(sort: Desc)], name: "user_drafts_timeline")

-- 상태별 활동 추적
@@index([status, lastAccessed], name: "status_activity")
```

### 배치 크기 조정

대용량 환경에서는 배치 크기를 조정:

```json
{
  "batchSize": 50,
  "maxConcurrency": 5,
  "cleanupInterval": "0 2 * * *"
}
```

### 캐싱 전략

- Redis를 통한 Draft 통계 캐싱 (5분)
- 알림 대상 캐싱 (1시간)
- 시스템 건강 상태 캐싱 (10분)

## 🔒 보안 고려사항

### 1. Cron Secret 관리
- 32바이트 이상 랜덤 문자열 사용
- 정기적인 로테이션 (3개월)
- 환경 변수로만 관리, 코드에 하드코딩 금지

### 2. Rate Limiting
```typescript
// 구현 예정: API Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100요청
  message: 'Too many requests'
})
```

### 3. 입력 검증
- Zod 스키마를 통한 모든 입력 검증
- SQL Injection 방지 (Prisma ORM)
- XSS 방지 (DOMPurify)

## 📈 확장성 계획

### Phase 2: 고급 기능
- 실시간 이메일 발송 (SendGrid/AWS SES)
- Slack/Discord 알림 연동
- 메트릭 대시보드 (Grafana)
- 자동 스케일링 기반 배치 크기 조정

### Phase 3: 엔터프라이즈
- 다중 지역 배포 지원
- 실시간 모니터링 및 알림
- 고급 분석 및 예측
- SLA 기반 자동 복구

## ✅ 검증 체크리스트

배포 후 다음 사항을 확인하세요:

- [ ] 모든 Cron 작업이 정상 실행됨
- [ ] 로그 파일이 생성되고 순환됨
- [ ] 시스템 건강 점수가 70점 이상
- [ ] 알림 발송이 정상 작동함
- [ ] API 응답 시간이 500ms 미만
- [ ] 데이터베이스 연결이 안정적
- [ ] 디스크 및 메모리 사용량이 적정 수준

## 📞 지원

문제 발생 시 다음 정보와 함께 문의:

1. 시스템 환경 (OS, Node.js 버전)
2. 에러 로그 (`/var/log/readzone/`)
3. API 응답 결과
4. 시스템 리소스 상태

---

**문서 버전**: v1.0  
**마지막 업데이트**: 2025-01-31  
**담당자**: DevOps Team
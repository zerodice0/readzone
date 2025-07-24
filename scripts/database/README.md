# ReadZone 데이터베이스 관리 스크립트

ReadZone 프로젝트의 SQLite 데이터베이스를 안전하게 관리하기 위한 스크립트 모음입니다.

## 📋 목차

- [스크립트 개요](#스크립트-개요)
- [설치 및 설정](#설치-및-설정)
- [데이터베이스 초기화](#데이터베이스-초기화)
- [데이터베이스 백업](#데이터베이스-백업)
- [안전 절차](#안전-절차)
- [문제 해결](#문제-해결)

## 🔧 스크립트 개요

### 1. 데이터베이스 초기화 (`reset-database.ts`)
- **목적**: 개발/테스트 환경에서 데이터베이스를 깨끗한 상태로 초기화
- **기능**: 
  - 선택적 데이터 삭제 (콘텐츠, 사용자, 도서, 캐시 등)
  - 자동 백업 생성
  - 안전성 검사 (프로덕션 환경 차단)
  - 삭제 전 미리보기 (dry-run)

### 2. 데이터베이스 백업 (`backup-database.ts`)
- **목적**: 데이터베이스의 안전한 백업 생성
- **기능**:
  - 압축 백업 지원 (gzip)
  - 백업 무결성 검증
  - 자동 파일명 생성 (타임스탬프)
  - 백업 보존 정책 (최대 개수 제한)

## 📦 설치 및 설정

### 필수 의존성
```bash
# TypeScript 실행 환경
npm install -g tsx

# 프로젝트 의존성 확인
npm install
```

### 환경 변수 설정
```bash
# .env.local
NODE_ENV=development
DATABASE_URL="file:./dev.db"
```

## 🧹 데이터베이스 초기화

### 기본 사용법

```bash
# 콘텐츠 데이터만 삭제 (사용자, 도서 보존)  
npm run db:reset

# 모든 데이터 삭제
npm run db:reset --all

# 계획만 확인 (실제 삭제 안함)
npm run db:reset --dry-run
```

### 고급 옵션

```bash
# 사용자 데이터도 삭제
npm run db:reset --users

# 도서 데이터도 삭제
npm run db:reset --books

# 캐시 데이터만 정리
npm run db:reset --caches

# 백업 없이 삭제 (주의!)
npm run db:reset --no-backup

# 상세 로그 출력
npm run db:reset --verbose
```

### 삭제 대상 테이블

| 옵션 | 삭제되는 테이블 | 설명 |
|------|----------------|------|
| **기본** | BookReview, BookOpinion, Comment, ReviewLike, CommentLike, ReviewDraft, ManualBookEntry | 사용자 생성 콘텐츠 |
| `--users` | + User | 사용자 계정 정보 |
| `--books` | + Book | 도서 정보 |
| `--caches` | + BookApiCache, ApiUsageLog | 캐시 및 로그 |
| `--auth` | + Account, Session, VerificationToken | 인증 관련 |

### 안전 장치

- ✅ **환경 검사**: 프로덕션 환경에서 실행 차단
- ✅ **백업 생성**: 삭제 전 자동 백업 (비활성화 가능)
- ✅ **확인 프롬프트**: 대화형 확인 요청
- ✅ **Dry-run**: 실제 삭제 없이 계획 미리보기
- ✅ **트랜잭션**: 모든 삭제를 하나의 트랜잭션으로 처리

## 💾 데이터베이스 백업

### 기본 사용법

```bash
# 기본 백업
npm run db:backup

# 압축 백업 (권장)
npm run db:backup --compress

# 사용자 지정 이름
npm run db:backup --name pre-migration
```

### 고급 옵션

```bash
# 백업 디렉토리 지정
npm run db:backup --output ./custom-backups

# 최대 백업 개수 설정
npm run db:backup --max-backups 5

# 무결성 검증 건너뛰기
npm run db:backup --no-verify

# 상세 정보 출력
npm run db:backup --verbose
```

### 백업 파일 구조

```
backups/
├── readzone-backup-2025-01-15T10-30-45.db      # 기본 백업
├── readzone-backup-2025-01-15T10-30-45.db.json # 메타데이터
├── readzone-backup-2025-01-15T11-15-20.db.gz   # 압축 백업
└── pre-migration-2025-01-15T14-22-10.db        # 사용자 지정 이름
```

### 백업 메타데이터 예시

```json
{
  "tables": {
    "User": 150,
    "Book": 1200,
    "BookReview": 450,
    "Comment": 230
  },
  "totalRecords": 2030,
  "databaseSize": 2048576,
  "backupPath": "./backups/readzone-backup-2025-01-15T10-30-45.db",
  "backupSize": 1847362,
  "createdAt": "2025-01-15T10:30:45.123Z",
  "version": "1.0.0"
}
```

## 🛡️ 안전 절차

### 프로덕션 환경 보호

스크립트는 다음 조건에서 실행을 거부합니다:

```bash
# 환경 변수 검사
NODE_ENV=production  # ❌ 실행 차단

# 데이터베이스 URL 검사
DATABASE_URL="postgresql://prod-db"  # ❌ 실행 차단
DATABASE_URL="file:./dev.db"         # ✅ 실행 허용
```

### 권장 워크플로우

1. **백업 생성**
   ```bash
   npm run db:backup --compress
   ```

2. **계획 확인**
   ```bash
   npm run db:reset --dry-run
   ```

3. **실제 초기화**
   ```bash
   npm run db:reset
   ```

4. **결과 확인**
   ```bash
   npm run db:studio
   ```

### 복구 절차

백업에서 데이터베이스 복구:

```bash
# 1. 현재 데이터베이스 백업
npm run db:backup --name before-restore

# 2. 백업 파일 복구
cp backups/readzone-backup-2025-01-15T10-30-45.db prisma/dev.db

# 3. Prisma 클라이언트 재생성  
npm run db:generate

# 4. 복구 확인
npm run db:studio
```

## 🔍 문제 해결

### 자주 발생하는 문제

#### 1. 권한 오류
```bash
# 문제: EACCES: permission denied
# 해결: 파일 권한 확인
ls -la prisma/dev.db
chmod 644 prisma/dev.db
```

#### 2. 데이터베이스 잠금
```bash
# 문제: database is locked
# 해결: 활성 연결 종료
pkill -f "prisma studio"
pkill -f "next dev"
```

#### 3. 백업 디렉토리 없음
```bash
# 문제: ENOENT: no such file or directory
# 해결: 백업 디렉토리 생성
mkdir -p backups
```

#### 4. TypeScript 실행 오류
```bash
# 문제: tsx command not found
# 해결: tsx 전역 설치
npm install -g tsx
```

### 로그 분석

스크립트 실행 시 다음 로그를 확인하세요:

```bash
# 성공적인 실행
✅ 데이터베이스 백업 생성: ./backups/...
✅ 총 1,234개 레코드 삭제 완료  
✅ 데이터베이스 최적화 완료
🎉 데이터베이스 초기화가 완료되었습니다!

# 오류 발생
❌ 프로덕션 환경에서는 이 스크립트를 실행할 수 없습니다.
❌ 데이터베이스 파일을 찾을 수 없습니다: ./prisma/dev.db
❌ 백업 무결성 검증 실패
```

### 지원 및 문의

문제가 해결되지 않는 경우:

1. **GitHub Issues**: 프로젝트 저장소의 Issues 섹션에 문의
2. **로그 첨부**: 실행 시 `--verbose` 옵션으로 상세 로그 수집
3. **환경 정보**: OS, Node.js 버전, 프로젝트 버전 명시

---

⚠️ **중요**: 이 스크립트들은 개발 환경에서만 사용하세요. 프로덕션 데이터 손실을 방지하기 위해 여러 안전장치가 구현되어 있지만, 항상 주의깊게 사용하시기 바랍니다.
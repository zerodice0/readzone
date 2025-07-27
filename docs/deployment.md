# ReadZone 배포 및 운영 가이드

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
- **XSS 방지**: DOMPurify 기반 HTML 콘텐츠 산티타이징 + SafeHtmlRenderer 컴포넌트
- **SQL Injection 방지**: Prisma ORM 사용으로 자동 방지
- **세션 보안**: JWT 토큰 만료 시간 설정 및 보안 헤더 적용
- **입력 검증**: Zod 스키마를 통한 모든 사용자 입력 검증
- **HTML 보안**: React Quill 생성 HTML의 화이트리스트 기반 태그/속성 필터링
- **파일 업로드 보안**: 이미지 파일 타입 및 크기 제한

### 보안 설정
- **방화벽**: UFW 설정으로 필요한 포트만 개방
- **SSL 인증서**: Let's Encrypt 또는 자체 서명 인증서
- **정기 업데이트**: 시스템 및 종속성 정기 업데이트
- **로그 관리**: 로그 로테이션 설정

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

## 성능 최적화

### 핵심 전략
- **React Server Components 활용**: 서버 사이드 렌더링 최대화
- **이미지 최적화**: Next.js Image 컴포넌트, 지연 로딩, WebP 변환
- **캐싱 전략**: 카카오 API 검색 결과 24시간 캐싱, React Query 적극 활용
- **클라이언트 상태 최소화**: Zustand를 통한 필수 상태만 관리
- **코드 스플리팅**: 동적 import, 라우트별 번들 분리

### Phase 6 고도화 계획
- **무한 스크롤 가상화**: react-window를 활용한 대용량 리스트 처리
- **번들 최적화**: Tree shaking, 불필요한 라이브러리 제거
- **Core Web Vitals 목표**: LCP <2.5s, FID <100ms, CLS <0.1
- **PWA 구현**: 서비스 워커, 오프라인 지원, 앱 설치 기능
- **CDN 도입**: 정적 파일 및 이미지 CDN 배포

### 모니터링
- **성능 메트릭**: Lighthouse, Web Vitals 지속 모니터링
- **에러 추적**: Sentry 연동으로 실시간 에러 모니터링
- **사용자 분석**: 행동 패턴 분석 및 성능 영향 측정

## 백업 및 복구

### SQLite 백업 전략
```bash
# 자동 백업 스크립트
#!/bin/bash
BACKUP_DIR="/home/readzone/backups"
DB_PATH="/home/readzone/app/prisma/prod.db"
DATE=$(date +%Y%m%d_%H%M%S)

# SQLite 백업
sqlite3 $DB_PATH ".backup $BACKUP_DIR/readzone_$DATE.db"

# 압축
gzip "$BACKUP_DIR/readzone_$DATE.db"

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "readzone_*.db.gz" -mtime +7 -delete

echo "Backup completed: readzone_$DATE.db.gz"
```

### 복구 절차
```bash
# 1. 서비스 중지
pm2 stop readzone

# 2. 현재 DB 백업
cp prod.db prod.db.backup

# 3. 백업에서 복구
gunzip readzone_20250724_020000.db.gz
cp readzone_20250724_020000.db prod.db

# 4. 권한 설정
chmod 644 prod.db

# 5. 서비스 재시작
pm2 start readzone
```

## 모니터링 및 알림

### 시스템 모니터링
```bash
# 시스템 리소스 확인
htop
df -h
free -m

# 애플리케이션 상태
pm2 status
pm2 monit

# 로그 실시간 확인
tail -f ~/.pm2/logs/readzone-out.log
tail -f ~/.pm2/logs/readzone-error.log
```

### 알림 설정
```bash
# 디스크 사용량 80% 초과 시 알림
*/30 * * * * if [ $(df / | tail -1 | awk '{print $5}' | sed 's/%//') -gt 80 ]; then echo "Disk usage high" | mail -s "ReadZone Alert" admin@example.com; fi

# 메모리 사용량 90% 초과 시 알림
*/15 * * * * if [ $(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}') -gt 90 ]; then echo "Memory usage high" | mail -s "ReadZone Alert" admin@example.com; fi
```

## SSL/TLS 설정

### Let's Encrypt 인증서
```bash
# Certbot 설치
sudo apt install certbot

# 인증서 발급
sudo certbot certonly --standalone -d your-domain.com

# 자동 갱신 설정
0 3 * * * /usr/bin/certbot renew --quiet
```

### Nginx 설정
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 장애 대응 절차

### 1. 서비스 다운
```bash
# 1. 로그 확인
pm2 logs readzone --lines 100

# 2. 프로세스 상태 확인
pm2 status

# 3. 재시작 시도
pm2 restart readzone

# 4. 실패 시 리로드
pm2 reload readzone

# 5. 최후 수단 - 완전 재시작
pm2 delete readzone
pm2 start npm --name "readzone" -- start
```

### 2. 데이터베이스 문제
```bash
# 1. DB 파일 권한 확인
ls -la prisma/prod.db

# 2. 백업에서 복구
cp /backups/latest/readzone.db prisma/prod.db

# 3. 마이그레이션 실행
npx prisma migrate deploy
```

### 3. 메모리 부족
```bash
# 1. 메모리 사용량 확인
free -m
ps aux --sort=-%mem | head

# 2. 불필요한 프로세스 종료
# 3. 스왑 공간 확인
swapon -s

# 4. PM2 메모리 모니터링
pm2 monit
```

## 정기 유지보수 체크리스트

### 일일 체크
- [ ] 서비스 상태 확인
- [ ] 에러 로그 확인
- [ ] 응답 시간 모니터링

### 주간 체크
- [ ] 백업 파일 검증
- [ ] 디스크 사용량 확인
- [ ] 보안 업데이트 확인

### 월간 체크
- [ ] 성능 메트릭 분석
- [ ] 용량 계획 검토
- [ ] SSL 인증서 만료일 확인
- [ ] 로그 파일 정리

이 가이드를 따라 안정적이고 보안이 강화된 ReadZone 서비스를 운영할 수 있습니다.
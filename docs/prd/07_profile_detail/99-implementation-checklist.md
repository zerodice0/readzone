# 프로필 페이지 구현 체크리스트

## 📋 전체 진행 상황

- [ ] **Phase 1**: 기본 프로필 구조 (1-2주)
- [ ] **Phase 2**: 콘텐츠 탭 시스템 (1-2주)
- [ ] **Phase 3**: 팔로우 시스템 (1-2주)
- [ ] **Phase 4**: 프로필 편집 시스템 (2-3주)
- [ ] **Phase 5**: 고급 기능 및 최적화 (1-2주)

**총 예상 기간**: 6-10주

---

## 🏗️ Phase 1: 기본 프로필 구조

### Backend 구현
- [ ] **데이터베이스 스키마**
  - [ ] User 모델 확장 (bio, profileImage, socialLinks 필드)
  - [ ] 마이그레이션 파일 생성 및 실행
  - [ ] 인덱스 추가 (username, created_at)

- [ ] **API 구현**
  - [ ] `GET /api/users/:userId` 프로필 조회 API
  - [ ] OptionalAuthGuard 구현 (비로그인 접근 허용)
  - [ ] 사용자 통계 계산 로직 (리뷰, 좋아요, 팔로우 수)
  - [ ] 권한 처리 (본인/타인 구분)

- [ ] **서비스 로직**
  - [ ] UserService.getProfile() 메서드 구현
  - [ ] calculateUserStats() 메서드 구현
  - [ ] getRecentActivity() 메서드 구현

### Frontend 구현
- [ ] **라우팅**
  - [ ] `/profile/:userId` 라우트 생성
  - [ ] TanStack Router 설정
  - [ ] 프로필 데이터 프리로딩

- [ ] **컴포넌트**
  - [ ] ProfilePage 메인 컴포넌트
  - [ ] ProfileHeader 컴포넌트 (사진, 이름, 기본 정보)
  - [ ] ProfileStats 컴포넌트 (활동 통계)
  - [ ] ProfileSkeleton 로딩 컴포넌트
  - [ ] ProfileError 에러 컴포넌트

- [ ] **상태 관리**
  - [ ] TanStack Query 설정
  - [ ] Zustand ProfileStore 구현
  - [ ] 캐싱 전략 (5분 stale time, 30분 gc time)

### 테스트
- [ ] **Backend E2E 테스트**
  - [ ] 공개 프로필 조회 테스트
  - [ ] 본인 프로필 조회 테스트 (로그인)
  - [ ] 존재하지 않는 사용자 404 테스트

- [ ] **Frontend 컴포넌트 테스트**
  - [ ] ProfilePage 렌더링 테스트
  - [ ] 프로필 정보 표시 테스트
  - [ ] 로딩/에러 상태 테스트

### 성능 및 품질
- [ ] TypeScript 타입 에러 0개
- [ ] ESLint 경고 0개
- [ ] LCP < 2.5초 달성

---

## 📑 Phase 2: 콘텐츠 탭 시스템

### Backend 구현
- [ ] **API 엔드포인트**
  - [ ] `GET /api/users/:userId/reviews` 독후감 목록
  - [ ] `GET /api/users/:userId/likes` 좋아요한 독후감 (본인만)
  - [ ] `GET /api/users/:userId/books` 서재 (읽은 책 목록)
  - [ ] `GET /api/users/:userId/follows` 팔로워/팔로잉 목록

- [ ] **DTO 및 유효성 검사**
  - [ ] UserReviewsQueryDto (정렬, 공개범위, 페이징)
  - [ ] UserLikesQueryDto, UserBooksQueryDto, UserFollowsQueryDto
  - [ ] 커서 기반 페이지네이션 구현

- [ ] **권한 처리**
  - [ ] canAccessUserContent() 권한 검사 로직
  - [ ] 개인정보 설정에 따른 접근 제어
  - [ ] 좋아요 목록 본인만 접근 제한

### Frontend 구현
- [ ] **탭 시스템**
  - [ ] ProfileTabs 컴포넌트 (탭 네비게이션)
  - [ ] ProfileContent 컴포넌트 (탭별 콘텐츠)
  - [ ] ARIA 역할 및 접근성 지원

- [ ] **콘텐츠 리스트**
  - [ ] ReviewsList 컴포넌트 (필터링, 정렬)
  - [ ] LikedReviewsList 컴포넌트
  - [ ] BooksList 컴포넌트
  - [ ] FollowsList 컴포넌트 (Phase 3에서 완성)

- [ ] **무한 스크롤**
  - [ ] useInfiniteScroll 훅 구현
  - [ ] Intersection Observer 활용
  - [ ] TanStack Query Infinite Queries 설정

### 테스트
- [ ] **Backend 테스트**
  - [ ] 각 탭별 API 테스트
  - [ ] 권한별 접근 제어 테스트
  - [ ] 페이지네이션 테스트

- [ ] **Frontend 테스트**
  - [ ] 탭 전환 테스트
  - [ ] 무한 스크롤 테스트
  - [ ] 필터링/정렬 테스트

### 성능
- [ ] 탭 전환 < 300ms
- [ ] 무한 스크롤 로딩 < 1초

---

## 👥 Phase 3: 팔로우 시스템

### Backend 구현
- [ ] **데이터베이스**
  - [ ] Follow 모델 생성
  - [ ] User 모델 관계 추가 (following, followers)
  - [ ] 인덱스 설정 (follower_id, following_id, 복합 인덱스)

- [ ] **API 구현**
  - [ ] `POST /api/users/:userId/follow` 팔로우/언팔로우
  - [ ] 팔로우 관계 조회 API 완성
  - [ ] 상호 팔로우 감지 로직

- [ ] **비즈니스 로직**
  - [ ] toggleFollow() 메서드 구현
  - [ ] 자기 자신 팔로우 방지
  - [ ] 중복 팔로우 방지
  - [ ] 팔로우 수 실시간 업데이트

### Frontend 구현
- [ ] **팔로우 버튼**
  - [ ] FollowButton 컴포넌트 구현
  - [ ] 낙관적 업데이트 적용
  - [ ] 에러 시 롤백 처리
  - [ ] 상호 팔로우 표시

- [ ] **팔로우 목록**
  - [ ] FollowsList 컴포넌트 완성
  - [ ] UserCard 컴포넌트 구현
  - [ ] 팔로우 버튼 연동

- [ ] **상태 관리**
  - [ ] 팔로우 상태 실시간 동기화
  - [ ] 관련 쿼리 자동 무효화

### 테스트
- [ ] **Backend 테스트**
  - [ ] 팔로우/언팔로우 테스트
  - [ ] 자기 자신 팔로우 방지 테스트
  - [ ] 중복 팔로우 방지 테스트
  - [ ] 상호 팔로우 감지 테스트

- [ ] **Frontend 테스트**
  - [ ] FollowButton 동작 테스트
  - [ ] 낙관적 업데이트 테스트
  - [ ] 상호 팔로우 표시 테스트

### 성능
- [ ] 팔로우 버튼 응답 < 500ms
- [ ] UI 상태 동기화 정상 동작

---

## ✏️ Phase 4: 프로필 편집 시스템

### Backend 구현
- [ ] **프로필 수정 API**
  - [ ] `PUT /api/users/:userId/profile` 구현
  - [ ] 본인만 수정 가능 권한 검사
  - [ ] UpdateProfileDto 유효성 검사

- [ ] **닉네임 중복 확인**
  - [ ] `GET /api/users/check-username/:username` API
  - [ ] 실시간 중복 확인 로직
  - [ ] 대체 제안 생성 알고리즘

- [ ] **프로필 사진 업로드**
  - [ ] `POST /api/users/:userId/avatar` API
  - [ ] Cloudinary 연동 및 설정
  - [ ] 이미지 크롭 및 리사이징
  - [ ] 다중 크기 이미지 생성 (50px, 100px, 200px, 400px)

- [ ] **개인정보 설정**
  - [ ] privacy 필드 JSON 스키마 정의
  - [ ] 공개 범위 설정 로직
  - [ ] 설정별 접근 제어 연동

### Frontend 구현
- [ ] **편집 모달**
  - [ ] ProfileEditModal 컴포넌트 구현
  - [ ] 탭 기반 편집 인터페이스 (기본 정보, 프로필 사진, 개인정보)
  - [ ] React Hook Form + Zod 유효성 검사

- [ ] **닉네임 검사**
  - [ ] UsernameAvailabilityChecker 컴포넌트
  - [ ] 실시간 중복 확인 (500ms debounce)
  - [ ] 대체 제안 표시 및 선택

- [ ] **이미지 편집**
  - [ ] AvatarEditSection 컴포넌트
  - [ ] ReactCrop을 이용한 이미지 크롭
  - [ ] 드래그 앤 드롭 업로드
  - [ ] 파일 크기/형식 검증

- [ ] **개인정보 설정**
  - [ ] PrivacySettingsSection 컴포넌트
  - [ ] 공개 범위 선택 UI
  - [ ] 설정 변경 즉시 적용

### 테스트
- [ ] **Backend 테스트**
  - [ ] 프로필 정보 수정 테스트
  - [ ] 닉네임 중복 확인 테스트
  - [ ] 프로필 사진 업로드 테스트
  - [ ] 권한 처리 테스트

- [ ] **Frontend 테스트**
  - [ ] 편집 모달 기능 테스트
  - [ ] 이미지 크롭 테스트
  - [ ] 유효성 검사 테스트

### 성능
- [ ] 이미지 업로드 < 3초
- [ ] 폼 입력 응답성 < 100ms

---

## 🚀 Phase 5: 고급 기능 및 최적화

### 배지 시스템
- [ ] **Backend**
  - [ ] Badge, UserBadge 모델 구현
  - [ ] BadgeService 및 자동 획득 로직
  - [ ] 배지 초기화 및 조건 정의

- [ ] **Frontend**
  - [ ] ProfileBadges 컴포넌트
  - [ ] BadgeItem 컴포넌트
  - [ ] BadgeProgressModal 구현

### 접근성 개선
- [ ] **ARIA 지원**
  - [ ] 시맨틱 HTML 구조
  - [ ] ARIA 라벨 및 역할 정의
  - [ ] 스크린 리더 지원

- [ ] **키보드 네비게이션**
  - [ ] 포커스 트래핑 구현
  - [ ] 키보드 단축키 지원
  - [ ] 탭 순서 최적화

### 성능 최적화
- [ ] **Frontend 최적화**
  - [ ] React Query 캐싱 최적화
  - [ ] 이미지 최적화 (OptimizedImage 컴포넌트)
  - [ ] 가상화 적용 (VirtualizedList)
  - [ ] 코드 스플리팅 및 레이지 로딩

- [ ] **Backend 최적화**
  - [ ] 데이터베이스 인덱스 최적화
  - [ ] 쿼리 성능 최적화
  - [ ] 캐싱 전략 구현

### SEO 및 소셜 공유
- [ ] **메타 태그**
  - [ ] ProfileMetaTags 컴포넌트
  - [ ] Open Graph 설정
  - [ ] Twitter Card 설정
  - [ ] 구조화된 데이터 (JSON-LD)

- [ ] **소셜 공유**
  - [ ] SocialShareButton 컴포넌트
  - [ ] Native Share API 지원
  - [ ] 소셜 플랫폼별 공유 링크

### 보안 강화
- [ ] **CSP 설정**
  - [ ] Content Security Policy 헤더
  - [ ] XSS 방지 설정
  - [ ] CSRF 보호

- [ ] **입력 검증**
  - [ ] DOMPurify를 이용한 HTML 살균
  - [ ] URL 유효성 검사
  - [ ] 파일 업로드 보안

### 모니터링
- [ ] **성능 모니터링**
  - [ ] Core Web Vitals 측정
  - [ ] 성능 메트릭 수집
  - [ ] 분석 도구 연동

### 테스트
- [ ] **통합 테스트**
  - [ ] 배지 시스템 테스트
  - [ ] 접근성 테스트
  - [ ] 성능 테스트

### 품질 목표
- [ ] **Core Web Vitals**
  - [ ] LCP < 2.5초
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

- [ ] **접근성**
  - [ ] WCAG 2.1 AA 수준 준수
  - [ ] 스크린 리더 호환성
  - [ ] 키보드 네비게이션 지원

---

## 🔍 최종 검증 체크리스트

### 기능 완성도
- [ ] 모든 PRD 요구사항 구현 완료
- [ ] 사용자 플로우 정상 동작
- [ ] 에러 시나리오 처리 완료

### 품질 기준
- [ ] TypeScript strict mode 준수 (0 에러)
- [ ] ESLint 규칙 준수 (0 경고)
- [ ] 테스트 커버리지 80% 이상
- [ ] 성능 목표 달성

### 보안 및 접근성
- [ ] 보안 취약점 점검 완료
- [ ] 접근성 표준 준수
- [ ] 개인정보 보호 규정 준수

### 사용자 경험
- [ ] 직관적인 UI/UX
- [ ] 모바일 반응형 지원
- [ ] 다크 모드 지원
- [ ] 로딩 및 에러 상태 적절한 처리

### 배포 준비
- [ ] 프로덕션 빌드 성공
- [ ] 환경 변수 설정 완료
- [ ] CDN 및 외부 서비스 연동 확인
- [ ] 모니터링 설정 완료

---

## 📈 성공 지표

### 개발 지표
- **코드 품질**: TypeScript 0 에러, ESLint 0 경고
- **테스트 커버리지**: 80% 이상
- **성능 점수**: Lighthouse 90점 이상

### 사용자 경험 지표
- **로딩 시간**: 프로필 페이지 < 1.5초
- **응답성**: 사용자 인터랙션 < 100ms
- **접근성**: WAVE 도구 0 에러

### 비즈니스 지표
- **사용자 참여도**: 프로필 조회 수 증가
- **소셜 상호작용**: 팔로우 관계 형성 증가
- **콘텐츠 품질**: 프로필 완성도 향상

---

## 🚀 배포 후 모니터링

### 주요 모니터링 항목
- [ ] 페이지 로딩 속도
- [ ] API 응답 시간
- [ ] 에러 발생률
- [ ] 사용자 이탈률
- [ ] 기능별 사용률

### 개선 계획
- [ ] 사용자 피드백 수집
- [ ] 성능 최적화 지속
- [ ] 새로운 기능 추가 계획
- [ ] A/B 테스트 설계

---

**문서 버전**: 1.0
**작성일**: 2024.12
**최종 검토**: 개발팀, 기획팀
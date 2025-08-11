# NextAuth 세션 검증 시스템 테스트 가이드

## 🎯 테스트 개요

이 가이드는 새로 구현된 NextAuth 세션 검증 및 갱신 시스템의 동작을 확인하기 위한 테스트 방법을 제공합니다.

---

## 📋 사전 준비

### 1. 개발 서버 시작
```bash
npm run dev
```

### 2. 브라우저 개발자 도구 준비
- **Network 탭**: 세션 관련 HTTP 요청 모니터링
- **Application 탭**: 쿠키 및 세션 토큰 확인
- **Console 탭**: 에러 로그 및 디버깅 정보 확인

---

## 🧪 Phase 1: JWT 토큰 및 세션 테스트

### Test 1.1: 로그인 후 세션 정보 확인
**목적**: JWT 토큰에 user.id가 올바르게 포함되는지 확인

**절차**:
1. `/login` 페이지 접속
2. 유효한 계정으로 로그인
3. 브라우저 개발자 도구 → Application → Cookies
4. `next-auth.session-token` 또는 `__Secure-next-auth.session-token` 쿠키 확인

**예상 결과**:
- 세션 토큰 쿠키가 존재해야 함
- Network 탭에서 `/api/auth/session` 요청 확인
- 응답에 `user.id`, `user.email`, `user.nickname` 포함 확인

**확인 방법**:
```javascript
// 브라우저 콘솔에서 실행
fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => {
    console.log('Session data:', data)
    console.log('User ID exists:', !!data.user?.id)
    console.log('User Email exists:', !!data.user?.email)
    console.log('User Nickname exists:', !!data.user?.nickname)
  })
```

### Test 1.2: 독후감 작성 시 Foreign Key 에러 해결 확인
**목적**: 세션 user.id가 데이터베이스와 올바르게 매칭되는지 확인

**절차**:
1. 로그인 상태에서 `/write` 페이지 접속
2. 기존 도서 선택 (예: "도라에몽(완전판) 34(2판)")
3. 독후감 제목과 내용 작성
4. 저장 버튼 클릭

**예상 결과**:
- Foreign Key 제약 조건 위반 에러가 발생하지 않아야 함
- 독후감이 성공적으로 저장되어야 함
- Network 탭에서 `POST /api/reviews` 요청이 200 상태로 성공

**실패 시 확인 사항**:
- Network 탭에서 에러 응답 내용 확인
- Console 탭에서 "USER_NOT_FOUND" 에러 메시지 확인

---

## 🛡️ Phase 2: 미들웨어 보호 테스트

### Test 2.1: 미인증 사용자 리다이렉트 테스트
**목적**: 보호된 라우트가 올바르게 보호되는지 확인

**절차**:
1. 브라우저에서 로그아웃 (또는 시크릿 창 사용)
2. 다음 URL들에 직접 접속 시도:
   - `/write`
   - `/settings`
   - `/profile/edit`

**예상 결과**:
- 모든 보호된 라우트에서 `/login`으로 자동 리다이렉트
- URL에 `callbackUrl` 쿼리 파라미터 포함 확인
- 예: `/login?callbackUrl=%2Fwrite`

### Test 2.2: 인증된 사용자의 인증 페이지 접근 차단
**목적**: 로그인한 사용자가 인증 페이지에 접근할 때 홈으로 리다이렉트되는지 확인

**절차**:
1. 로그인 상태에서 다음 URL 접속 시도:
   - `/login`
   - `/register`
   - `/forgot-password`

**예상 결과**:
- 모든 인증 페이지에서 `/`(홈)으로 자동 리다이렉트

### Test 2.3: API 라우트 보호 테스트
**목적**: 보호된 API 엔드포인트가 올바르게 보호되는지 확인

**절차**:
1. 로그아웃 상태에서 브라우저 콘솔 실행:
```javascript
// 독후감 생성 API 테스트
fetch('/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Review',
    content: 'Test content',
    bookId: 'some-book-id'
  })
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
```

**예상 결과**:
- 401 상태 코드 반환
- `"errorType": "UNAUTHORIZED"` 메시지 포함

---

## 🔄 Phase 3: 세션 자동 갱신 테스트

### Test 3.1: 자동 갱신 주기 확인
**목적**: 5분마다 자동으로 세션이 갱신되는지 확인

**절차**:
1. 로그인 후 Network 탭 모니터링 시작
2. 5분 대기 (또는 브라우저 콘솔에서 수동 테스트)
3. `/api/auth/session` 요청 발생 확인

**수동 테스트**:
```javascript
// useSessionRefresh 훅 동작 확인
setInterval(() => {
  console.log('Checking session refresh at:', new Date().toLocaleTimeString())
}, 60000) // 1분마다 로그 출력
```

### Test 3.2: 윈도우 포커스 시 갱신 확인
**목적**: 윈도우 포커스 시 세션이 갱신되는지 확인

**절차**:
1. 로그인 상태에서 다른 탭 또는 애플리케이션으로 이동
2. Network 탭 열어둔 상태에서 ReadZone 탭으로 다시 포커스
3. `/api/auth/session` 요청 발생 확인

### Test 3.3: 토큰 만료 임박 시 갱신 확인
**목적**: 토큰 만료 임박 시 자동 갱신되는지 확인

**절차** (수동 테스트):
```javascript
// 브라우저 콘솔에서 실행 - 만료 시간 확인
fetch('/api/auth/session')
  .then(r => {
    console.log('Refresh header:', r.headers.get('X-Token-Refresh-Required'))
    console.log('Expires in:', r.headers.get('X-Token-Expires-In'), 'seconds')
    return r.json()
  })
  .then(data => {
    const expiresAt = new Date(data.expires)
    const now = new Date()
    const remainingTime = (expiresAt - now) / 1000 / 60 // 분 단위
    console.log('Session expires at:', expiresAt)
    console.log('Remaining time:', remainingTime, 'minutes')
  })
```

---

## 🏥 Phase 4: 에러 처리 및 복구 테스트

### Test 4.1: 세션 만료 시 동작 확인
**목적**: 세션이 만료되었을 때 올바른 처리가 이루어지는지 확인

**절차**:
1. 브라우저 개발자 도구 → Application → Cookies
2. 세션 토큰 쿠키 수동 삭제
3. 보호된 페이지나 API 호출 시도

**예상 결과**:
- 보호된 페이지: 로그인 페이지로 리다이렉트
- API 호출: 401 에러 응답

### Test 4.2: 네트워크 에러 시 처리 확인
**목적**: 네트워크 에러 시 적절한 에러 처리가 이루어지는지 확인

**절차**:
1. 브라우저 개발자 도구 → Network → Offline 체크
2. 세션 갱신 시도 (페이지 포커스 등)
3. Network → Online 복원

**예상 결과**:
- 오프라인 시 에러 토스트 메시지가 과도하게 표시되지 않아야 함
- 온라인 복원 시 자동으로 세션 갱신 재시도

---

## 📊 성능 테스트

### Test 5.1: 미들웨어 응답 시간 측정
**목적**: 미들웨어 처리 시간이 요구사항(< 50ms)을 충족하는지 확인

**절차**:
```javascript
// 브라우저 콘솔에서 실행
const measureMiddlewareTime = async () => {
  const start = performance.now()
  const response = await fetch('/write')
  const end = performance.now()
  
  console.log(`Middleware + Page load time: ${end - start}ms`)
  console.log('Response status:', response.status)
}

// 여러 번 실행하여 평균 측정
for(let i = 0; i < 5; i++) {
  await measureMiddlewareTime()
  await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 대기
}
```

### Test 5.2: 세션 검증 응답 시간 측정
**목적**: 세션 검증 시간이 요구사항(< 100ms)을 충족하는지 확인

**절차**:
```javascript
// 브라우저 콘솔에서 실행
const measureSessionTime = async () => {
  const start = performance.now()
  const response = await fetch('/api/auth/session')
  const end = performance.now()
  
  console.log(`Session validation time: ${end - start}ms`)
  console.log('Session data:', await response.json())
}

// 여러 번 측정
for(let i = 0; i < 10; i++) {
  await measureSessionTime()
  await new Promise(resolve => setTimeout(resolve, 500)) // 0.5초 대기
}
```

---

## ✅ 테스트 체크리스트

### 필수 확인 사항
- [ ] 로그인 후 세션에 user.id 포함 확인
- [ ] 독후감 작성 시 Foreign Key 에러 해결 확인
- [ ] 미인증 사용자 보호된 라우트 접근 차단
- [ ] 인증된 사용자 인증 페이지 리다이렉트
- [ ] API 라우트 보호 동작 확인
- [ ] 5분마다 자동 세션 갱신
- [ ] 윈도우 포커스 시 세션 갱신
- [ ] 세션 만료 시 적절한 처리

### 성능 요구사항 확인
- [ ] 미들웨어 처리 시간 < 50ms
- [ ] 세션 검증 시간 < 100ms
- [ ] 자동 갱신이 백그라운드에서 동작

### 사용성 확인
- [ ] 사용자에게 불필요한 알림 최소화
- [ ] 세션 만료 시 자연스러운 재인증 유도
- [ ] 진행 중인 작업 보존 (드래프트 등)

---

## 🚨 문제 해결

### 일반적인 문제와 해결책

#### 1. "세션에 user.id가 없습니다"
**원인**: JWT 콜백에서 user.id가 토큰에 저장되지 않음
**해결**: `src/lib/auth.ts`의 JWT 콜백 확인

#### 2. "Foreign Key 제약 조건 위반"
**원인**: 세션의 user.id와 데이터베이스의 User ID 불일치
**해결**: User 존재 확인 로직이 올바르게 동작하는지 확인

#### 3. "미들웨어에서 무한 리다이렉트"
**원인**: 미들웨어 설정에서 제외 경로 누락
**해결**: `middleware.ts`의 `config.matcher` 확인

#### 4. "세션이 자동 갱신되지 않음"
**원인**: SessionProvider 설정 문제 또는 훅 미동작
**해결**: `useSessionRefresh` 훅이 올바르게 호출되는지 확인

---

## 📈 성공 지표 달성 확인

### 정량적 지표
- **Foreign Key 에러**: 0건 (독후감 작성 테스트 통과)
- **세션 유지율**: 95% 이상 (자동 갱신 테스트 통과)
- **자동 갱신 성공률**: 99% 이상 (갱신 실패 시나리오 제외)
- **응답 시간**: 세션 검증 < 100ms, 미들웨어 < 50ms

### 정성적 지표
- 사용자 경험 개선 (불필요한 로그아웃 감소)
- 개발자 디버깅 용이성 (명확한 에러 메시지)
- 시스템 안정성 (자동 복구 메커니즘)
- 보안 수준 (토큰 만료 관리)

---

**테스트 완료 시**: 모든 체크리스트 항목이 통과되면 구현이 성공적으로 완료된 것으로 간주합니다.

**문제 발생 시**: 위의 문제 해결 섹션을 참조하거나, 구현 담당자에게 문의하시기 바랍니다.
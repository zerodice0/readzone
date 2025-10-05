# 02. Phase 1: 긴급 수정사항

> 우선순위: 🔴 긴급 (즉시 적용)
> 예상 소요 시간: 15분
> 목표: 이미지 선택 시 "변경사항 저장" 버튼 활성화 및 영구 저장

## 📋 목차

- [문제 상황](#문제-상황)
- [근본 원인 분석](#근본-원인-분석)
- [수정 사항](#수정-사항)
- [검증 방법](#검증-방법)

---

## 문제 상황

### 현재 버그

1. ❌ 프로필 이미지 선택 시 **"변경사항 저장" 버튼이 활성화되지 않음**
2. ❌ 이미지가 화면에는 표시되지만 **새로고침하면 사라짐**
3. ❌ 실제로 저장되지 않아 **영구적으로 유지되지 않음**

### 사용자 경험

```
[현재 흐름]
1. 사용자가 프로필 이미지 선택
2. 이미지가 미리보기로 표시됨 ✅
3. BUT, "변경사항 저장" 버튼이 비활성화 상태 유지 ❌
4. 저장 불가능 ❌
5. 페이지 새로고침 → 이미지 사라짐 ❌
```

```
[기대 흐름]
1. 사용자가 프로필 이미지 선택
2. 이미지가 미리보기로 표시됨 ✅
3. "변경사항 저장" 버튼 즉시 활성화 ✅
4. 버튼 클릭 → 서버에 저장 ✅
5. 페이지 새로고침 → 이미지 유지 ✅
```

---

## 근본 원인 분석

### 원인 1: markAsChanged() 잘못된 구현

**파일**: `packages/frontend/src/hooks/useSettings.ts:79`

```typescript
// ❌ 잘못된 구현
markAsChanged: () => store.setActiveTab(store.activeTab)  // 탭 변경일 뿐, 플래그 설정 안됨
```

**문제점**:
- `markAsChanged()`가 실제로 `hasUnsavedChanges` 플래그를 변경하지 않음
- `setActiveTab()`만 호출하여 의미 없는 동작만 수행

### 원인 2: 이미지 로컬 상태에만 저장

**파일**: `packages/frontend/src/components/settings/sections/ProfileSettings.tsx:81`

```typescript
// ❌ 문제: 로컬 상태에만 저장
setFormData(prev => ({ ...prev, profileImage: imageUrl }))
```

**문제점**:
- 업로드된 이미지 URL이 컴포넌트 로컬 상태(`formData`)에만 저장됨
- Zustand store(`settingsStore`)에 반영되지 않음
- 페이지 새로고침 시 store에서 데이터를 다시 불러오면서 로컬 상태 손실

### 원인 3: authStore 동기화 누락

**문제점**:
- 프로필 이미지가 변경되어도 `authStore`의 사용자 정보는 업데이트되지 않음
- 헤더/네비게이션 바의 프로필 이미지가 즉시 반영되지 않음

---

## 수정 사항

### 수정 1: settingsStore에 markAsChanged 액션 추가

**파일**: `packages/frontend/src/store/settingsStore.ts`

**위치**: 537번째 줄 근처, `setActiveTab` 다음에 추가

```typescript
// ✅ 새로운 액션 추가
markAsChanged: () => set((state) => {
  state.hasUnsavedChanges = true
}),

setActiveTab: (tab) => set((state) => {
  state.activeTab = tab
}),
```

**변경 이유**:
- `hasUnsavedChanges` 플래그를 직접 `true`로 설정하는 전용 액션
- 간단하고 명확한 동작

### 수정 2: useSettings 훅 수정

**파일**: `packages/frontend/src/hooks/useSettings.ts`

**변경 전**:
```typescript
markAsChanged: () => store.setActiveTab(store.activeTab), // Trigger change detection
```

**변경 후**:
```typescript
markAsChanged: store.markAsChanged,  // ✅ store 액션 직접 연결
```

**변경 이유**:
- 잘못된 우회 로직 제거
- store의 markAsChanged 액션을 직접 연결

### 수정 3: 이미지 업로드 후 store 동기화

**파일**: `packages/frontend/src/components/settings/sections/ProfileSettings.tsx`

**위치**: `handleImageChange` 함수 내부 (73-89번째 줄)

**변경 전**:
```typescript
try {
  setValidationErrors({})

  // 이미지 선택 즉시 변경사항으로 표시
  markAsChanged()

  const imageUrl = await uploadProfileImage(file)

  setFormData(prev => ({ ...prev, profileImage: imageUrl }))  // ❌ 로컬만
} catch (error) {
  console.error('Profile image upload failed:', error)
}
```

**변경 후**:
```typescript
try {
  setValidationErrors({})

  // 이미지 선택 즉시 변경사항으로 표시
  markAsChanged()

  const imageUrl = await uploadProfileImage(file)

  // ✅ 로컬 상태 업데이트
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
}
```

**import 추가 필요**:
```typescript
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'
```

**변경 이유**:
1. **settingsStore 동기화**: 페이지 새로고침 시 이미지 유지
2. **authStore 동기화**: 헤더/네비게이션 프로필 이미지 즉시 반영
3. **낙관적 업데이트**: 사용자에게 즉각적인 피드백 제공

---

## 검증 방법

### 1. 변경사항 버튼 활성화 테스트

```
1. 브라우저에서 http://localhost:3000/settings 접속
2. 로그인 상태 확인
3. 프로필 이미지 "이미지 선택" 버튼 클릭
4. 이미지 파일 선택 (JPG, PNG, WebP)
5. ✅ "변경사항 저장" 버튼이 파란색으로 활성화되는지 확인
6. ✅ 버튼에 마우스 오버 시 hover 효과 있는지 확인
```

### 2. 이미지 영구 저장 테스트

```
1. 위 테스트 계속 진행
2. "변경사항 저장" 버튼 클릭
3. ✅ "저장 중..." 텍스트 표시 확인
4. ✅ 저장 완료 후 버튼 비활성화 확인
5. 브라우저 F5 (새로고침)
6. ✅ 선택한 이미지가 그대로 표시되는지 확인
```

### 3. authStore 동기화 테스트

```
1. 프로필 이미지 업로드 (저장은 하지 않음)
2. ✅ 상단 헤더/네비게이션 바의 프로필 이미지 즉시 변경 확인
3. 다른 페이지로 이동 (예: 홈)
4. ✅ 헤더의 프로필 이미지가 변경된 이미지로 표시되는지 확인
```

### 4. 개발자 도구 확인

```
1. 브라우저 개발자 도구 (F12) → Console 탭
2. 이미지 업로드 시 에러 메시지 없는지 확인
3. Network 탭에서 POST /api/users/:id/avatar 요청 성공 확인
4. Application 탭 → Local Storage → settings-store 확인
   ✅ hasUnsavedChanges: true 설정되었는지 확인
```

### 5. 에러 시나리오 테스트

```
1. 5MB 이상 파일 업로드 시도
   ✅ "파일 크기는 5MB 이하여야 합니다" 에러 표시
2. GIF 파일 업로드 시도
   ✅ "JPG, PNG, WebP 형식만 지원됩니다" 에러 표시
3. 네트워크 연결 끊고 업로드 시도
   ✅ "네트워크 오류" 메시지 표시
```

---

## 예상 효과

| 항목 | 현재 | 수정 후 | 개선율 |
|------|------|---------|--------|
| 버튼 활성화 | ❌ 작동 안함 | ✅ 즉시 활성화 | 100% |
| 이미지 유지 | ❌ 새로고침 시 사라짐 | ✅ 영구 저장 | 100% |
| 헤더 동기화 | ❌ 업데이트 안됨 | ✅ 즉시 반영 | 100% |
| 사용자 경험 | ⭐ 1/5 | ⭐⭐⭐⭐⭐ 5/5 | 400% |

---

## 다음 단계

수정 완료 후:
- ✅ 모든 검증 테스트 통과 확인
- ✅ TypeScript 타입 체크 (`npm run type-check`)
- ✅ Lint 검사 (`npm run lint`)
- 다음: [Phase 2 최적화](./03-phase2-optimizations.md)
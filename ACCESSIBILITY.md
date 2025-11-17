# ReadZone 접근성 체크리스트

## ✅ 완료된 항목

### 1. Reduced Motion 지원

- [x] CSS `prefers-reduced-motion` 미디어 쿼리 추가
- [x] 모든 애니메이션 비활성화 (사용자가 동작 감소 설정 시)
- [x] Framer Motion 애니메이션에 대한 유틸리티 함수 생성 (`lib/motion.ts`)
- [x] Header 컴포넌트에 reduced motion 지원 적용

### 2. Skip to Content 링크

- [x] "본문으로 건너뛰기" 링크 추가
- [x] 시각적으로 숨김 처리 (스크린 리더용)
- [x] 포커스 시 표시되도록 스타일링
- [x] main 요소에 `id="main-content"` 추가
- [x] main 요소에 `role="main"` 추가

### 3. ARIA 속성

- [x] 네비게이션에 `aria-label="주요 네비게이션"` 추가
- [x] main 요소에 `role="main"` 추가
- [x] 스크린 리더 전용 텍스트 유틸리티 클래스 추가 (`.sr-only`)

## 📋 색상 대비 검증 필요

### WCAG AA 기준 (4.5:1)

현재 색상 팔레트:

- Primary: `#f59e0b` (amber-500)
- Primary Dark: `#d97706` (amber-600)
- Foreground: `#1c1917` (stone-900)
- Stone-700: `#44403c`
- Stone-600: `#57534e`

#### 검증이 필요한 조합:

1. **텍스트 대비**
   - [ ] `stone-700` (#44403c) on white (#ffffff) - 링크 텍스트
   - [ ] `stone-600` (#57534e) on white - 보조 텍스트
   - [ ] `primary-600` (#d97706) on white - 로고, 강조 텍스트

2. **버튼 대비**
   - [ ] White text on `primary` (#f59e0b) - 주요 버튼
   - [ ] `primary-600` (#d97706) on white - 아웃라인 버튼

3. **경계선 대비**
   - [ ] `border` (stone-200, #e7e5e4) - 카드 테두리

### 권장 개선 사항

만약 대비율이 4.5:1 미만이라면:

- `stone-700` → `stone-800` 사용 고려
- `primary-600` 유지 (충분한 대비)
- 중요 텍스트는 `stone-900` 사용

## 🔍 테스트 도구

### 온라인 도구

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Calculator](https://contrast-ratio.com/)

### 브라우저 확장

- axe DevTools (Chrome/Firefox)
- WAVE Evaluation Tool

### 자동화 테스트

```bash
# Lighthouse 접근성 점수 측정 (목표: 95+)
npm run lighthouse
```

## 🎯 다음 단계

1. 색상 대비 자동 테스트 도구 실행
2. 키보드 네비게이션 전체 테스트
3. 스크린 리더 테스트 (NVDA/VoiceOver)
4. 모든 폼에 적절한 label 연결 확인
5. 이미지에 alt 텍스트 추가 확인

## 📚 참고 문서

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
- [A11y Project](https://www.a11yproject.com/)

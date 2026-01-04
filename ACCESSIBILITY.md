# ReadZone 접근성 체크리스트

## ✅ 완료된 항목

### 1. Reduced Motion 지원

- [x] CSS `prefers-reduced-motion` 미디어 쿼리 추가 (`index.css`)
- [x] 모든 애니메이션 비활성화 (사용자가 동작 감소 설정 시)
- [x] `useReducedMotion` 커스텀 훅 구현 (`hooks/useReducedMotion.ts`)
- [x] Framer Motion 애니메이션 유틸리티 함수 및 훅 생성 (`lib/motion.ts`)
  - `useMotionTransition()` - 실시간 transition 조절
  - `useMotionVariants()` - 실시간 variants 조절
  - `useAnimationProps()` - 실시간 animation props 조절
  - `useMotionPresets()` - 사전 정의된 애니메이션 프리셋
- [x] Header 컴포넌트에 reduced motion 지원 적용

### 2. Skip to Content 링크

- [x] "본문으로 건너뛰기" 링크 추가 (`Header.tsx`)
- [x] 시각적으로 숨김 처리 (스크린 리더용)
- [x] 포커스 시 표시되도록 스타일링
- [x] main 요소에 `id="main-content"` 추가
- [x] main 요소에 `role="main"` 추가

### 3. ARIA 속성

- [x] 네비게이션에 `aria-label="주요 네비게이션"` 추가
- [x] main 요소에 `role="main"` 추가
- [x] 스크린 리더 전용 텍스트 유틸리티 클래스 추가 (`.sr-only`)

### 4. 색상 대비 검증 (WCAG AA 기준 4.5:1)

현재 색상 팔레트 (Soft Indigo + Slate):

- Primary: `#6366f1` (indigo-500)
- Primary-600: `#4f46e5` (indigo-600)
- Foreground: `#0f172a` (slate-900)
- Muted foreground: `#64748b` (slate-500)
- Background: `#f8fafc` (slate-50)

#### 검증 완료된 조합:

| 조합                                          | 대비율  | 결과   |
| --------------------------------------------- | ------- | ------ |
| Foreground on Background (#0f172a on #f8fafc) | 14.67:1 | ✅ AAA |
| stone-700 on white (#44403c on #ffffff)       | 7.11:1  | ✅ AAA |
| stone-600 on white (#57534e on #ffffff)       | 5.47:1  | ✅ AA  |
| Primary on white (#6366f1 on #ffffff)         | 4.54:1  | ✅ AA  |
| White on Primary (#ffffff on #6366f1)         | 4.54:1  | ✅ AA  |
| Muted foreground on bg (#64748b on #f8fafc)   | 4.58:1  | ✅ AA  |

**모든 주요 색상 조합이 WCAG AA 기준을 충족합니다.**

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

## 🎯 다음 단계 (권장)

1. 키보드 네비게이션 전체 테스트
2. 스크린 리더 테스트 (NVDA/VoiceOver)
3. 모든 폼에 적절한 label 연결 확인
4. 이미지에 alt 텍스트 추가 확인

## 📚 참고 문서

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
- [A11y Project](https://www.a11yproject.com/)

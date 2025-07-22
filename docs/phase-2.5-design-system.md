# Phase 2.5: Design System (디자인 시스템)

## 목표
Threads와 Instagram을 참고하여 ReadZone만의 독서 커뮤니티 특화 디자인 시스템을 구축합니다.

## 범위

### 1. 디자인 토큰
- [ ] 컬러 팔레트 정의
- [ ] 타이포그래피 시스템
- [ ] 간격 및 레이아웃 그리드
- [ ] 그림자 및 효과
- [ ] 애니메이션 타이밍

### 2. 컴포넌트 리디자인
- [ ] 독후감 카드 (Threads 스타일)
- [ ] 프로필 카드
- [ ] 도서 정보 표시
- [ ] 인터랙션 버튼 (좋아요, 댓글, 공유)
- [ ] 추천/비추천 뱃지

### 3. 페이지 레이아웃
- [ ] 피드 레이아웃 개선
- [ ] 로그인/회원가입 UI 개선
- [ ] 모바일 우선 반응형 디자인
- [ ] 다크모드 지원

### 4. 독서 특화 UI
- [ ] 도서 표지 디스플레이
- [ ] 읽기 진행률 표시
- [ ] 장르별 색상 코딩
- [ ] 독서 통계 비주얼라이제이션

## 디자인 레퍼런스

### 1. Threads 참고 요소
```
- 깔끔한 텍스트 중심 레이아웃
- 미니멀한 카드 디자인
- 부드러운 그림자 효과
- 간결한 프로필 표시
- 실시간 인터랙션 애니메이션
```

### 2. Instagram 참고 요소
```
- 시각적 계층 구조
- 카드 기반 콘텐츠 구성
- 하트 애니메이션
- 스토리 형식의 하이라이트
- 그리드/리스트 뷰 전환
```

### 3. 독서 플랫폼 특화 요소
```
- Goodreads: 별점 시스템, 도서 메타데이터
- 리디북스: 한국형 도서 UI, 리뷰 레이아웃
- 밀리의 서재: 독서 노트, 하이라이트 기능
```

## 컬러 시스템

### 주요 색상
```css
:root {
  /* Primary - 따뜻한 빨간색 (독서의 열정) */
  --primary-50: #fef2f2;
  --primary-100: #fee2e2;
  --primary-200: #fecaca;
  --primary-300: #fca5a5;
  --primary-400: #f87171;
  --primary-500: #ef4444;
  --primary-600: #dc2626;
  --primary-700: #b91c1c;
  --primary-800: #991b1b;
  --primary-900: #7f1d1d;

  /* Neutral - 읽기 좋은 그레이 스케일 */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;

  /* Semantic Colors */
  --success: #22c55e;  /* 추천 */
  --danger: #ef4444;   /* 비추천 */
  --warning: #f59e0b;  /* 주의 */
  --info: #3b82f6;     /* 정보 */
}
```

### 다크모드
```css
[data-theme="dark"] {
  /* 배경 색상 */
  --background: #0a0a0a;           /* 거의 검정 (gray-950) */
  --background-secondary: #18181b;  /* gray-900 */
  --card-bg: #27272a;              /* gray-800 */
  --card-hover: #3f3f46;           /* gray-700 */
  
  /* 텍스트 색상 - 가독성을 위한 충분한 대비 */
  --text-primary: #fafafa;         /* gray-50 - 제목, 중요 텍스트 */
  --text-secondary: #d4d4d8;       /* gray-300 - 본문, 일반 텍스트 */
  --text-tertiary: #a1a1aa;        /* gray-400 - 보조 텍스트, 메타 정보 */
  --text-disabled: #71717a;        /* gray-500 - 비활성 텍스트 */
  
  /* 테두리 및 구분선 */
  --border: #3f3f46;               /* gray-700 */
  --border-subtle: #27272a;        /* gray-800 - 미묘한 구분선 */
  
  /* 인터랙션 색상 - 다크모드에 맞게 조정 */
  --primary: #ef4444;              /* 변경 없음 */
  --primary-hover: #dc2626;        /* 호버 시 더 진하게 */
  --primary-text: #fecaca;         /* primary-200 - 링크 등 */
  
  /* 시맨틱 색상 - 다크모드 최적화 */
  --success: #4ade80;              /* green-400 - 밝은 초록 */
  --success-bg: #166534;           /* green-900 - 배경용 */
  --danger: #f87171;               /* red-400 - 밝은 빨강 */
  --danger-bg: #7f1d1d;            /* red-900 - 배경용 */
  --warning: #fbbf24;              /* yellow-400 - 밝은 노랑 */
  --warning-bg: #78350f;           /* yellow-900 - 배경용 */
  --info: #60a5fa;                 /* blue-400 - 밝은 파랑 */
  --info-bg: #1e3a8a;              /* blue-900 - 배경용 */
  
  /* 그림자 - 다크모드에서는 더 강하게 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.7);
}
```

### 라이트/다크 모드 전환
```css
/* 부드러운 테마 전환 */
:root {
  color-scheme: light dark;
}

* {
  transition: background-color 0.3s ease, 
              border-color 0.3s ease,
              color 0.3s ease;
}

/* 미디어 쿼리로 시스템 설정 따르기 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* 다크모드 변수 적용 */
  }
}
```

## 타이포그래피

### 폰트 시스템
```css
:root {
  /* 폰트 패밀리 */
  --font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-serif: "Noto Serif KR", serif;
  
  /* 폰트 크기 */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  
  /* 줄 높이 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* 폰트 굵기 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

## 컴포넌트 디자인

### 독후감 카드 (Threads 스타일)
```typescript
interface ReviewCardDesign {
  layout: 'vertical' | 'horizontal';
  showBookCover: boolean;
  contentPreview: {
    lines: 3;
    maxChars: 200;
  };
  interactions: {
    like: { animation: 'heart-burst' };
    comment: { showCount: true };
    share: { options: ['link', 'kakao', 'twitter'] };
  };
}
```

### 인터랙션 패턴
```css
/* 호버 효과 */
.interactive-element {
  transition: all 0.2s ease;
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 클릭 애니메이션 */
@keyframes click-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

## 레이아웃 시스템

### 그리드 시스템
```css
.container {
  --max-width: 1280px;
  --content-width: 680px;  /* 독서에 최적화된 너비 */
  --gutter: 1rem;
}

/* 반응형 브레이크포인트 */
--mobile: 0px;      /* 모바일 우선 */
--tablet: 640px;    /* 태블릿 */
--laptop: 1024px;   /* 노트북 */
--desktop: 1280px;  /* 데스크톱 */
```

### 간격 시스템
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

## 애니메이션 가이드

### 트랜지션
```css
:root {
  --transition-fast: 150ms;
  --transition-normal: 300ms;
  --transition-slow: 500ms;
  
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

### 마이크로 인터랙션
- 좋아요: 하트 버스트 애니메이션
- 댓글: 슬라이드 업 효과
- 공유: 리플 효과
- 스크롤: 패럴랙스 효과

## 독서 특화 요소

### 도서 표지 디스플레이
```css
.book-cover {
  aspect-ratio: 3/4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

/* 다크모드에서 도서 표지 */
[data-theme="dark"] .book-cover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--border-subtle);
}

.book-spine {
  background: linear-gradient(90deg, rgba(0,0,0,0.1) 0%, transparent 2px);
}
```

### 추천/비추천 뱃지
```css
.badge-recommend {
  background: var(--success);
  color: white;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: var(--text-sm);
}

.badge-not-recommend {
  background: var(--danger);
  /* 동일한 스타일 */
}
```

### 읽기 진행률
```css
.reading-progress {
  height: 4px;
  background: var(--gray-200);
  border-radius: 2px;
  overflow: hidden;
}

/* 다크모드에서 진행률 바 */
[data-theme="dark"] .reading-progress {
  background: var(--gray-700);
}

.reading-progress-bar {
  background: var(--primary-500);
  transition: width var(--transition-normal) var(--ease-out);
}

/* 다크모드에서 더 밝은 프라이머리 색상 */
[data-theme="dark"] .reading-progress-bar {
  background: var(--primary-400);
}
```

## 텍스트 가독성 가이드라인

### WCAG 대비율 기준
```css
/* 라이트 모드 대비율 */
.light-mode-contrast {
  /* 일반 텍스트: 4.5:1 이상 */
  --text-on-white: var(--gray-700);     /* 7:1 */
  --text-secondary: var(--gray-600);    /* 4.6:1 */
  
  /* 큰 텍스트 (18px+): 3:1 이상 */
  --heading-on-white: var(--gray-900);   /* 19:1 */
  
  /* 비활성 상태는 예외 */
  --text-disabled: var(--gray-400);     /* 2.9:1 */
}

/* 다크 모드 대비율 */
.dark-mode-contrast {
  /* 일반 텍스트: 4.5:1 이상 */
  --text-on-dark: var(--gray-50);       /* 15:1 */
  --text-secondary: var(--gray-300);    /* 8:1 */
  
  /* 큰 텍스트 (18px+): 3:1 이상 */
  --heading-on-dark: var(--gray-50);    /* 15:1 */
  
  /* 비활성 상태는 예외 */
  --text-disabled: var(--gray-500);     /* 3.8:1 */
}
```

### 사용 예시
```css
/* 제목 */
h1, h2, h3 {
  color: var(--text-primary);
}

/* 본문 */
p, .body-text {
  color: var(--text-secondary);
}

/* 메타 정보 (날짜, 작성자 등) */
.meta-info {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

/* 링크 */
a {
  color: var(--primary-text);
}

/* 비활성 요소 */
:disabled, .disabled {
  color: var(--text-disabled);
}
```

## 구현 계획

### Phase 1: 디자인 토큰 적용
1. CSS 변수 시스템 구축
2. Tailwind 커스텀 설정
3. 다크모드 토글 구현

### Phase 2: 컴포넌트 리디자인
1. 독후감 카드 개선
2. 버튼 및 폼 요소 스타일링
3. 네비게이션 개선

### Phase 3: 페이지 레이아웃
1. 피드 페이지 리뉴얼
2. 인증 페이지 UI 개선
3. 프로필 페이지 디자인

### Phase 4: 인터랙션 및 애니메이션
1. 마이크로 인터랙션 추가
2. 페이지 전환 효과
3. 로딩 및 스켈레톤 UI

## 완료 기준

### 필수 완료 사항
1. ✅ **디자인 토큰**: 일관된 디자인 시스템 구축
2. ✅ **반응형**: 모든 디바이스에서 최적화된 UI
3. ✅ **접근성**: WCAG 2.1 AA 기준 충족
4. ✅ **성능**: 부드러운 애니메이션 (60fps)
5. ✅ **다크모드**: 시스템 설정 연동

### 검증 방법
1. 스토리북으로 컴포넌트 문서화
2. 다양한 디바이스에서 UI 테스트
3. Lighthouse 점수 90점 이상
4. 사용자 피드백 수집

## 예상 결과물

### Before (현재)
- 기본적인 HTML 스타일
- 일관성 없는 간격과 색상
- 모바일 최적화 부족

### After (목표)
- Threads 스타일의 깔끔한 피드
- Instagram 수준의 인터랙션
- 독서 특화 UI 요소
- 일관된 디자인 시스템

## 참고 자료
- [Threads 디자인 분석](https://threads.net)
- [Instagram 디자인 시스템](https://about.instagram.com/brand)
- [Material Design 3](https://m3.material.io)
- [Tailwind UI 예제](https://tailwindui.com)
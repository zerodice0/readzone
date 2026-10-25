# ReadZone 디자인 시스템

> 따뜻하고 아늑한 독서 공간을 디지털로 구현한 ReadZone의 디자인 시스템 가이드

## 🎨 디자인 철학

ReadZone은 **"Warm & Inviting"** 독서 환경을 추구합니다. 마치 도서관의 따뜻한 조명과 아늑한 분위기를 연상시키는 디자인 언어를 사용합니다.

### 핵심 원칙

1. **따뜻함 (Warmth)**: 황금빛 amber 컬러를 primary로 사용하여 독서등의 따뜻한 빛을 재현
2. **우아함 (Elegance)**: Serif 폰트로 책의 고전적인 아름다움을 표현
3. **생동감 (Liveliness)**: 섬세한 애니메이션으로 페이지를 넘기는 듯한 경험 제공
4. **깊이감 (Depth)**: 3D 효과와 그라디언트로 물리적 질감 구현

---

## 🎨 색상 팔레트

### Primary Colors (Amber/Orange)

```css
/* Warm amber tones - 따뜻한 독서등 느낌 */
--primary-50: #fffbeb;
--primary-100: #fef3c7;
--primary-200: #fde68a;
--primary-300: #fcd34d;
--primary-400: #fbbf24;
--primary-500: #f59e0b; /* Main primary */
--primary-600: #d97706;
--primary-700: #b45309;
--primary-800: #92400e;
--primary-900: #78350f;
```

### Neutral Colors (Stone)

```css
/* Natural paper tones - 종이의 자연스러운 느낌 */
--stone-50: #fafaf9;
--stone-100: #f5f5f4;
--stone-200: #e7e5e4;
--stone-300: #d6d3d1;
--stone-400: #a8a29e;
--stone-500: #78716c;
--stone-600: #57534e;
--stone-700: #44403c;
--stone-800: #292524;
--stone-900: #1c1917;
```

### Semantic Colors

```css
/* Success - Green */
--green-500: #22c55e;
--green-600: #16a34a;

/* Error - Red */
--red-500: #ef4444;
--red-600: #dc2626;
--red-700: #b91c1c;

/* Info - Blue */
--blue-500: #3b82f6;
--blue-600: #2563eb;
```

### 사용 가이드라인

- **Primary (Amber)**: CTA 버튼, 링크, 강조 요소, 호버 상태
- **Stone**: 텍스트, 배경, 경계선, 카드
- **Green**: 추천 독후감, 성공 메시지
- **Red**: 비추천 독후감, 에러 메시지, 삭제 액션

---

## ✍️ 타이포그래피

### 폰트 패밀리

```css
/* Serif - 책 제목, 헤딩 */
font-family: 'Crimson Text', Georgia, serif;

/* Sans-serif - 본문, UI 요소 */
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### 타입 스케일

| 용도       | 클래스                         | 크기 | 폰트  | 사용처         |
| ---------- | ------------------------------ | ---- | ----- | -------------- |
| Hero       | `text-4xl font-bold`           | 36px | Sans  | 페이지 타이틀  |
| H1         | `text-3xl font-bold`           | 30px | Sans  | 섹션 제목      |
| H2         | `text-2xl font-semibold`       | 24px | Sans  | 서브 섹션      |
| Book Title | `font-serif text-xl font-bold` | 20px | Serif | 책 제목        |
| Body Large | `text-lg`                      | 18px | Sans  | 중요 본문      |
| Body       | `text-base`                    | 16px | Sans  | 일반 본문      |
| Small      | `text-sm`                      | 14px | Sans  | 보조 텍스트    |
| Tiny       | `text-xs`                      | 12px | Sans  | 라벨, 메타정보 |

### 타이포그래피 사용 원칙

1. **책 제목은 항상 Serif 폰트 사용**: 고전적이고 우아한 느낌
2. **본문과 UI는 Sans-serif 사용**: 가독성과 현대적 느낌
3. **Line Height**: 본문은 `leading-relaxed` (1.625) 사용하여 읽기 편안하게
4. **Font Weight**:
   - 제목: `font-bold` (700)
   - 부제목: `font-semibold` (600)
   - 본문: `font-normal` (400)

---

## 🎭 애니메이션 시스템

### 애니메이션 원칙

ReadZone의 모든 애니메이션은 **책을 읽는 경험**에서 영감을 받습니다:

- 페이지를 넘기는 듯한 부드러운 전환
- 책을 들어올리는 듯한 3D 호버 효과
- 독서등의 따뜻한 빛이 퍼지는 듯한 그로우 효과

### 핵심 Animation Variants

#### 1. Page Transitions (페이지 전환)

```typescript
// 페이지 진입/퇴장
pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};
```

#### 2. Staggered Lists (순차 나열)

```typescript
// 카드 리스트가 차례로 나타남
containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // 80ms 간격
      delayChildren: 0.1,
    },
  },
};

cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4 },
  },
};
```

#### 3. 3D Card Hover (카드 호버)

```typescript
// ReviewCard 3D tilt effect
const x = useMotionValue(0);
const y = useMotionValue(0);
const rotateX = useTransform(y, [-100, 100], [5, -5]);
const rotateY = useTransform(x, [-100, 100], [-5, 5]);

// 마우스 위치에 따라 카드가 3D로 기울어짐
style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
```

#### 4. Like/Bookmark Animations (인터랙션)

```typescript
// Heart beat animation
likeVariants = {
  rest: { scale: 1 },
  liked: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    transition: { duration: 0.6 },
  },
};

// Bounce animation
bookmarkVariants = {
  rest: { y: 0 },
  bookmarked: {
    y: [0, -8, 2, -4, 0],
    transition: { duration: 0.5 },
  },
};
```

#### 5. Micro-interactions (미세 상호작용)

```typescript
// Button press
whileTap={{ scale: 0.95 }}

// Button hover
whileHover={{ scale: 1.05, y: -2 }}

// Icon spin on selection
animate={{ rotate: isSelected ? 360 : 0 }}

// Search icon pulse
animate={{ scale: isSearching ? [1, 1.2, 1] : 1 }}
```

### 타이밍 & 이징

```typescript
// 부드러운 커스텀 이징
ease: [0.25, 0.1, 0.25, 1] // Cubic bezier

// 지속 시간 가이드
- 빠른 피드백: 0.1-0.2초
- 일반 전환: 0.3-0.4초
- 복잡한 애니메이션: 0.5-0.6초
- 페이지 전환: 0.4초
```

---

## 🧩 컴포넌트 시스템

### Button Variants

```tsx
// Default - Primary action
<Button variant="default">독후감 작성</Button>

// Warm - Special CTA with gradient
<Button variant="warm">시작하기</Button>

// Outline - Secondary action
<Button variant="outline">취소</Button>

// Ghost - Tertiary action
<Button variant="ghost">더보기</Button>

// Destructive - Dangerous action
<Button variant="destructive">삭제</Button>

// Success - Positive action
<Button variant="success">완료</Button>
```

### Card Components

#### ReviewCard

- **3D Tilt Effect**: 마우스 움직임에 따라 카드가 기울어짐
- **Gradient Glow**: 호버 시 따뜻한 amber 그라디언트 빛
- **Book Cover 3D**: 책 표지가 독립적으로 회전
- **Animated Badges**: 추천/별점 배지에 그라디언트 적용
- **Like/Bookmark Animations**: 클릭 시 심장 박동/바운스 효과

#### BookCard

- **Serif Title**: 책 제목에는 항상 serif 폰트 사용
- **Hover Lift**: 호버 시 약간 들어올려짐
- **Color Transition**: 부드러운 색상 전환

### Empty States

```tsx
<EmptyState
  icon={BookOpen}
  title="독후감이 없습니다"
  description="첫 번째 독후감을 작성해보세요"
  action={{ label: '작성하기', onClick: handleCreate }}
/>
```

### Loading States

```tsx
<LoadingState message="로딩 중..." size="md" fullPage={false} />
```

---

## 🎯 그라디언트 시스템

### Warm Gradient (따뜻한 빛)

```css
/* 호버 시 카드 배경 */
background: radial-gradient(
  circle at 50% 0%,
  rgba(251, 191, 36, 0.08) 0%,
  transparent 70%
);

/* Primary 버튼 */
background: linear-gradient(
  to right,
  #fbbf24,
  /* primary-400 */ #d97706 /* primary-600 */
);
```

### Badge Gradients

```css
/* 추천 배지 */
background: linear-gradient(to right, #22c55e, #16a34a);

/* 비추천 배지 */
background: linear-gradient(to right, #ef4444, #dc2626);

/* 평점 배지 */
background: linear-gradient(to right, #fbbf24, #f59e0b);
```

---

## 📐 레이아웃 & 스페이싱

### Container Widths

```css
/* Feed & Detail pages */
max-width: 768px; /* max-w-3xl */

/* Form pages */
max-width: 1024px; /* max-w-4xl */
```

### Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

### Border Radius

```css
/* Small components */
--radius-md: 8px; /* rounded-lg */

/* Cards & containers */
--radius-xl: 12px; /* rounded-xl */

/* Full round */
--radius-full: 9999px; /* rounded-full */
```

---

## 🎪 그림자 시스템

### Shadow Levels

```css
/* Subtle - Default cards */
shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Default - Elevated cards */
shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Medium - Book covers */
shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Large - Modals */
shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Warm glow - Hover states */
0 20px 25px -5px rgba(245, 158, 11, 0.15),
0 10px 10px -5px rgba(245, 158, 11, 0.1),
0 0 20px rgba(245, 158, 11, 0.2);
```

---

## ♿ 접근성 (Accessibility)

### 필수 사항

1. **색상 대비**: 모든 텍스트는 WCAG AA 기준 준수 (4.5:1 이상)
2. **키보드 네비게이션**: 모든 인터랙티브 요소에 `tabIndex` 제공
3. **ARIA 레이블**: 아이콘 버튼에는 `aria-label` 필수
4. **Focus States**: `focus:ring-2 focus:ring-primary-500` 적용
5. **Screen Reader**: 중요한 상태 변화에 `aria-live` 사용

### 예시

```tsx
<Button
  aria-label="좋아요"
  title="이 독후감이 마음에 들어요"
>
  <Heart aria-hidden="true" />
</Button>

<div role="status" aria-live="polite">
  검색 결과: {count}개
</div>
```

---

## 📱 반응형 디자인

### Breakpoints

```css
/* Mobile first approach */
sm: 640px; /* Small devices */
md: 768px; /* Tablets */
lg: 1024px; /* Desktops */
xl: 1280px; /* Large screens */
```

### 사용 패턴

```tsx
{/* Mobile: Stacked, Desktop: Side-by-side */}
<div className="flex flex-col sm:flex-row gap-4">

{/* Mobile: Full width, Desktop: Fixed */}
<img className="w-24 h-32 sm:w-32 sm:h-44" />

{/* Hide on mobile */}
<nav className="hidden md:flex">
```

---

## 🎨 사용 예시

### 완전한 ReviewCard 구조

```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  style={{ rotateX, rotateY }}
  whileHover={{ scale: 1.02 }}
>
  <Card className="group relative overflow-hidden">
    {/* Warm glow overlay */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100
                    bg-[radial-gradient(...)]"
    />

    {/* Top accent line */}
    <div
      className="absolute top-0 h-1 bg-linear-to-r
                    from-primary-400 via-primary-500 to-primary-400
                    opacity-0 group-hover:opacity-100"
    />

    {/* Content */}
    <CardContent>
      <h3
        className="font-serif font-bold text-xl
                     group-hover:text-primary-700"
      >
        {bookTitle}
      </h3>

      {/* Gradient badge */}
      <Badge className="bg-linear-to-r from-green-500 to-green-600">추천</Badge>
    </CardContent>
  </Card>
</motion.div>
```

---

## 🚀 베스트 프랙티스

### Do's ✅

- Serif 폰트는 책 제목에만 사용
- 모든 상호작용에 미세한 애니메이션 추가
- Amber 색상으로 따뜻함 강조
- 3D 효과로 깊이감 제공
- 접근성 레이블 항상 포함

### Don'ts ❌

- 과도한 애니메이션으로 산만하게 만들지 말 것
- Primary 색상을 배경에 과다 사용하지 말 것
- Serif 폰트를 본문 텍스트에 사용하지 말 것
- 애니메이션 없이 상태 변경하지 말 것
- 색상만으로 정보 전달하지 말 것

---

## 📦 컴포넌트 파일 위치

```
src/
├── components/
│   ├── ui/              # Base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── loading-state.tsx
│   │   └── empty-state.tsx
│   ├── ReviewCard/      # Feature components
│   │   └── ReviewCard.tsx
│   ├── feed/
│   │   └── FeedFilters.tsx
│   └── layout/
│       └── Header.tsx
├── utils/
│   ├── animations.ts    # Animation variants
│   └── toast.ts         # Toast utilities
└── styles/
    └── globals.css      # Global styles
```

---

## 🎓 참고 자료

### 디자인 시스템 학습

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

### 디자인 영감

- 도서관의 따뜻한 조명
- 종이책의 물리적 질감
- 페이지를 넘기는 경험
- 독서등의 amber 빛

---

## 📝 버전 히스토리

### v1.0.0 (Current)

- ✅ Warm 디자인 시스템 구축
- ✅ Framer Motion 애니메이션 시스템
- ✅ ReviewCard 3D 효과
- ✅ 페이지 전환 애니메이션
- ✅ 마이크로 인터랙션
- ✅ Toast 알림 시스템
- ✅ 접근성 개선

---

## 💡 향후 개선 사항

- [ ] Dark mode 구현 (따뜻한 밤 독서 느낌)
- [ ] 커스텀 커서 (책 아이콘)
- [ ] 페이지 넘김 제스처 (모바일)
- [ ] 북마크 저장 시 책갈피 애니메이션
- [ ] Reading progress indicator
- [ ] 개인화 테마 설정

---

**만든 사람**: ReadZone Team
**마지막 업데이트**: 2025-01-17
**라이선스**: MIT

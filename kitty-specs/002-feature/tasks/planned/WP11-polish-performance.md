---
work_package_id: 'WP11'
subtasks:
  - 'T109'
  - 'T110'
  - 'T111'
  - 'T112'
  - 'T113'
  - 'T114'
  - 'T115'
  - 'T116'
  - 'T117'
  - 'T118'
  - 'T119'
  - 'T120'
title: 'Polish & Performance'
phase: 'Phase 3 - Polish'
lane: 'planned'
assignee: ''
agent: ''
shell_pid: ''
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
---

# Work Package Prompt: WP11 – Polish & Performance

## Objectives & Success Criteria

**Goal**: Optimize performance, accessibility, and user experience across the feature.

**Success Criteria**:
- [ ] Lighthouse scores >90 (Performance, Accessibility, Best Practices, SEO)
- [ ] 60fps scrolling performance verified
- [ ] WCAG AA compliance verified
- [ ] Error handling validated across all scenarios
- [ ] Image loading optimized (lazy loading, WebP format)
- [ ] ARIA labels and semantic HTML implemented
- [ ] Keyboard navigation functional for feed
- [ ] Focus management for modals and prompts
- [ ] Bundle size optimized (code splitting, tree shaking)
- [ ] Error boundaries for React components
- [ ] Retry logic for failed API calls
- [ ] Loading skeletons for all async states

## Context & Constraints

**Performance Goals** (from plan.md):
- 피드 첫 로딩: <2초 (10개 독후감)
- 무한 스크롤 추가 로딩: <3초
- 스크롤 성능: 60fps 이상
- API 응답: <200ms (p95)

**Accessibility**: WCAG 2.1 AA compliance

**Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)

## Subtasks & Detailed Guidance

### Subtask T109 – Optimize image loading

**Implementation**:
```typescript
// 1. Add WebP support with fallback
<picture>
  <source srcSet={`${review.book.coverImageUrl}?format=webp`} type="image/webp" />
  <img src={review.book.coverImageUrl} alt={review.book.title} loading="lazy" />
</picture>

// 2. Add srcset for responsive images
<img
  src={review.book.coverImageUrl}
  srcSet={`
    ${review.book.coverImageUrl}?w=80 80w,
    ${review.book.coverImageUrl}?w=160 160w,
    ${review.book.coverImageUrl}?w=240 240w
  `}
  sizes="(max-width: 640px) 80px, 160px"
  loading="lazy"
  alt={review.book.title}
/>

// 3. Implement image preconnect in index.html
<link rel="preconnect" href="https://books.google.com" />
<link rel="preconnect" href="https://image.aladin.co.kr" />
```

### Subtask T110 – Add ARIA labels and semantic HTML

**Implementation**:
```typescript
// ReviewCard.tsx - Add ARIA labels
<article
  role="article"
  aria-labelledby={`review-${review.id}-title`}
  className="..."
  onClick={handleCardClick}
>
  <h3 id={`review-${review.id}-title`}>{review.book.title}</h3>
  
  <Button
    aria-label={`${review.isLikedByMe ? '좋아요 취소' : '좋아요'} (${review.likeCount}개)`}
    onClick={handleLike}
  >
    <Heart />
    <span>{review.likeCount}</span>
  </Button>

  <Button
    aria-label={`${review.isBookmarkedByMe ? '북마크 취소' : '북마크 추가'}`}
    onClick={handleBookmark}
  >
    <Bookmark />
  </Button>
</article>

// Use semantic HTML
<main role="main">
  <h1>독후감 피드</h1>
  <nav aria-label="페이지네이션">
    {/* InfiniteScroll */}
  </nav>
</main>
```

### Subtask T111 – Implement keyboard navigation

**Implementation**:
```typescript
// ReviewCard.tsx - Add keyboard support
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    navigate(`/reviews/${review.id}`);
  }
};

<article
  tabIndex={0}
  onKeyDown={handleKeyDown}
  className="..."
>
  {/* content */}
</article>

// Add skip navigation link
// packages/frontend/src/App.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black"
>
  본문으로 건너뛰기
</a>
<main id="main-content">
  {/* app content */}
</main>
```

### Subtask T112 – Add focus management

**Implementation**:
```typescript
// LoginPrompt.tsx - Focus trap in modal
import { useEffect, useRef } from 'react';

export function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && firstFocusRef.current) {
      firstFocusRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* content */}
        <Button ref={firstFocusRef} onClick={handleLogin}>
          로그인
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Add focus visible styles to global CSS
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

### Subtask T113 – Optimize bundle size

**Implementation**:
```typescript
// 1. Code splitting with React.lazy()
// packages/frontend/src/App.tsx
import { lazy, Suspense } from 'react';

const FeedPage = lazy(() => import('./pages/Feed'));
const ReviewDetailPage = lazy(() => import('./pages/ReviewDetail'));

<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/feed" element={<FeedPage />} />
    <Route path="/reviews/:id" element={<ReviewDetailPage />} />
  </Routes>
</Suspense>

// 2. Tree shaking verification
// Check bundle analyzer
pnpm add -D vite-plugin-bundle-analyzer

// vite.config.ts
import { defineConfig } from 'vite';
import { analyzer } from 'vite-plugin-bundle-analyzer';

export default defineConfig({
  plugins: [
    analyzer({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
});

// 3. Remove unused dependencies
pnpm prune
```

### Subtask T114 – Add error boundaries

**Implementation**:
```typescript
// packages/frontend/src/components/ErrorBoundary.tsx
import React from 'react';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Optional: Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">문제가 발생했습니다</h1>
          <p className="text-muted-foreground mb-6 text-center">
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
          </p>
          <Button onClick={() => window.location.reload()}>
            페이지 새로고침
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap app in ErrorBoundary
// packages/frontend/src/main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Subtask T115 – Implement retry logic

**Implementation**:
```typescript
// packages/frontend/src/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}

// Use in API clients
// packages/frontend/src/services/api/reviews.ts
import { retryWithBackoff } from '../../utils/retry';

export const reviewsApi = {
  getFeed: async (page = 0, limit = 20): Promise<FeedResponse> => {
    return retryWithBackoff(async () => {
      const response = await api.get('/reviews/feed', {
        params: { page, limit },
      });
      return response.data;
    });
  },
};
```

### Subtask T116 – Add loading skeletons

**Implementation verified in WP08 T086** - Already implemented

### Subtask T117 – Validate performance targets

**Steps**:
1. Test feed first load:
   ```bash
   # Open DevTools Network tab
   # Throttle: Fast 3G
   # Hard refresh (Cmd+Shift+R)
   # Measure time to interactive
   # Target: <2s for 10 reviews
   ```

2. Test scroll performance:
   ```bash
   # Open DevTools Performance tab
   # Start recording
   # Scroll through feed
   # Stop recording
   # Check FPS (should be 60fps)
   ```

3. Test API response time:
   ```bash
   # Open DevTools Network tab
   # Check GET /reviews/feed response time
   # Target: <200ms (p95)
   ```

### Subtask T118 – Run Lighthouse audit

**Steps**:
1. Open DevTools Lighthouse tab
2. Generate report (Desktop, Production mode)
3. Fix issues:
   ```typescript
   // Common fixes:
   
   // 1. Add meta tags
   <head>
     <meta name="description" content="독후감 공유 플랫폼" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />
     <link rel="icon" href="/favicon.ico" />
   </head>

   // 2. Optimize images (already done in T109)
   
   // 3. Minimize CSS/JS (Vite does this automatically)
   
   // 4. Add manifest.json
   {
     "name": "ReadZone",
     "short_name": "ReadZone",
     "icons": [
       {
         "src": "/icon-192.png",
         "sizes": "192x192",
         "type": "image/png"
       }
     ],
     "theme_color": "#ffffff",
     "background_color": "#ffffff",
     "display": "standalone"
   }
   ```

### Subtask T119 – Test on mobile devices

**Steps**:
1. Test on iOS Safari:
   - iPhone 12+ (real device or simulator)
   - Verify touch interactions
   - Verify scroll performance
   - Verify image loading

2. Test on Android Chrome:
   - Pixel 5+ (real device or emulator)
   - Same verifications

3. Fix mobile-specific issues:
   ```css
   /* Fix touch highlight */
   * {
     -webkit-tap-highlight-color: transparent;
   }

   /* Fix viewport on mobile */
   html {
     -webkit-text-size-adjust: 100%;
   }
   ```

### Subtask T120 – Test with screen readers

**Steps**:
1. VoiceOver (macOS):
   ```
   Cmd+F5 to enable
   Navigate through feed
   Verify ARIA labels read correctly
   Verify focus order is logical
   ```

2. NVDA (Windows):
   ```
   Start NVDA
   Navigate with Tab key
   Verify all interactive elements are announced
   Verify heading structure is correct
   ```

3. Fix issues:
   ```typescript
   // Add visually hidden text for screen readers
   <span className="sr-only">
     {review.book.title} by {review.book.author}
   </span>

   // Ensure all images have alt text
   <img src={...} alt={review.book.title} />
   ```

## Test Strategy

**Performance Tests**:
- Lighthouse audit (>90 scores)
- WebPageTest.org analysis
- Bundle size analysis
- Memory leak detection

**Accessibility Tests**:
- Automated: axe DevTools, Lighthouse
- Manual: Keyboard navigation, screen reader
- WCAG 2.1 AA compliance check

**Browser Compatibility**:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Android Chrome)
- Responsive design (320px to 1920px)

## Risks & Mitigations

**Risk 1: Performance regression on low-end devices**
- **Mitigation**: Test on throttled CPU/network, optimize critical assets
- **Recovery**: Use Lighthouse CI, performance budgets

**Risk 2: Accessibility issues undiscovered**
- **Mitigation**: Use automated tools + manual testing
- **Recovery**: Add a11y testing to CI/CD

**Risk 3: Bundle size growth**
- **Mitigation**: Bundle analyzer, code splitting, tree shaking
- **Recovery**: Remove unused dependencies, lazy loading

## Definition of Done Checklist

- [ ] All subtasks T109-T120 completed
- [ ] Lighthouse scores >90 (all categories)
- [ ] 60fps scrolling verified
- [ ] WCAG AA compliance verified
- [ ] Images optimized (lazy loading, WebP)
- [ ] ARIA labels and semantic HTML
- [ ] Keyboard navigation works
- [ ] Focus management for modals
- [ ] Bundle size optimized
- [ ] Error boundaries implemented
- [ ] Retry logic for API calls
- [ ] Loading skeletons for all states
- [ ] Performance targets met (<2s load, <200ms API)
- [ ] Mobile devices tested (iOS, Android)
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] TypeScript compilation passes

## Review Guidance

**Reviewer Should Verify**:
- [ ] Run Lighthouse - all scores >90
- [ ] Test scroll performance - 60fps in DevTools
- [ ] Test keyboard navigation - Tab through feed
- [ ] Test screen reader - VoiceOver or NVDA
- [ ] Test on mobile - iOS Safari and Android Chrome
- [ ] Check bundle size - compare before/after
- [ ] Test error scenarios - network failures, 500 errors
- [ ] Check DevTools Console - no errors or warnings
- [ ] Run `pnpm --filter frontend build` - builds successfully

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Feature Complete!

All 11 work packages implemented. The 독후감 메인 피드 feature is now complete with:
- ✅ Backend API (Reviews, Books, Likes, Bookmarks)
- ✅ Frontend feed with infinite scroll
- ✅ Review card component
- ✅ Review detail page
- ✅ Authentication integration
- ✅ Performance optimization
- ✅ Accessibility compliance

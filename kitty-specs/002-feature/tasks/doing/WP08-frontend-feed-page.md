---
work_package_id: 'WP08'
subtasks:
  - 'T081'
  - 'T082'
  - 'T083'
  - 'T084'
  - 'T085'
  - 'T086'
  - 'T087'
  - 'T088'
  - 'T089'
  - 'T090'
  - 'T091'
title: 'Frontend - Feed Page'
phase: 'Phase 2 - Frontend  (MVP)'
lane: 'doing'
assignee: ''
agent: 'claude'
shell_pid: '58509'
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
---

# Work Package Prompt: WP08 – Frontend - Feed Page (MVP)

## Objectives & Success Criteria

**Goal**: Implement FeedPage component integrating feed store, ReviewCard list, and InfiniteScroll.

**Success Criteria**:

- [ ] FeedPage component created and exported
- [ ] Feed store integrated with useEffect for initial load
- [ ] Reviews array mapped to ReviewCard components
- [ ] InfiniteScroll component integrated at list end
- [ ] Loading skeleton for initial load displayed
- [ ] Empty state shown when no reviews ("아직 작성된 독후감이 없습니다")
- [ ] Error state with retry button implemented
- [ ] Route `/feed` added to React Router
- [ ] FeedPage set as home route (`/` redirects to `/feed`)
- [ ] Page-level responsive layout applied (container, padding)
- [ ] First load <2s (10 reviews), scroll performance 60fps

## Context & Constraints

**Related Documents**:

- `kitty-specs/002-feature/spec.md` - Feed page requirements
- `kitty-specs/002-feature/plan.md` - Performance goals, tech stack

**Constraints**:

- Must display 20 reviews per page
- Loading skeleton during initial fetch
- Empty and error states required
- Mobile-first responsive design
- Accessible keyboard navigation

**Architectural Decisions**:

- FeedPage as container component
- ReviewCard as presentational component
- InfiniteScroll for pagination
- React Router for routing

## Subtasks & Detailed Guidance

### Subtask T081 – Create FeedPage component

**Purpose**: Create FeedPage component structure.

**Steps**:

1. Create directory: `packages/frontend/src/pages/Feed`
2. Create file: `packages/frontend/src/pages/Feed/FeedPage.tsx`
3. Implement component:

   ```typescript
   import { useEffect } from 'react';
   import { useFeedStore } from '../../stores/feedStore';
   import { ReviewCard } from '../../components/ReviewCard';
   import { InfiniteScroll } from '../../components/InfiniteScroll';
   import { Skeleton } from '../../components/ui/skeleton';
   import { Button } from '../../components/ui/button';

   export function FeedPage() {
     const {
       reviews,
       isLoading,
       hasMore,
       error,
       loadFeed,
       loadMore,
       reset,
     } = useFeedStore();

     useEffect(() => {
       // Implementation in T083
     }, []);

     // Implementation in T084-T088

     return (
       <div className="container mx-auto px-4 py-8 max-w-4xl">
         <h1 className="text-3xl font-bold mb-8">독후감 피드</h1>

         {/* Loading skeleton - T086 */}
         {/* Error state - T088 */}
         {/* Empty state - T087 */}
         {/* Review list - T084 */}
         {/* Infinite scroll - T085 */}
       </div>
     );
   }
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (single component)

---

### Subtask T082 – Create index file for export

**Purpose**: Export FeedPage from index file.

**Steps**:

1. Create file: `packages/frontend/src/pages/Feed/index.tsx`
2. Add export:
   ```typescript
   export { FeedPage } from './FeedPage';
   ```

**Files**: `packages/frontend/src/pages/Feed/index.tsx`

**Parallel?**: Yes (can proceed in parallel with T081)

---

### Subtask T083 – Integrate feedStore with useEffect

**Purpose**: Load initial feed data on mount.

**Steps**:

1. Update FeedPage.tsx useEffect:

   ```typescript
   useEffect(() => {
     // Reset store on mount (clear previous state)
     reset();

     // Load initial feed
     loadFeed();

     // No cleanup needed (store persists)
   }, [loadFeed, reset]);
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (depends on T081)

**Notes**:

- reset() clears previous state (important for navigation)
- loadFeed() fetches first page (page=0)
- Dependencies: loadFeed, reset (from store)

---

### Subtask T084 – Map reviews array to ReviewCard components

**Purpose**: Display review list.

**Steps**:

1. Update FeedPage.tsx return statement:

   ```typescript
   return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <h1 className="text-3xl font-bold mb-8">독후감 피드</h1>

       {/* Loading skeleton */}
       {/* Error state */}
       {/* Empty state */}

       {/* Review list */}
       {!isLoading && !error && reviews.length > 0 && (
         <div className="space-y-6">
           {reviews.map((review) => (
             <ReviewCard key={review.id} review={review} />
           ))}
         </div>
       )}

       {/* Infinite scroll */}
     </div>
   );
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (depends on T081, T083)

**Notes**:

- Use `space-y-6` for spacing between cards
- Only show when not loading, no error, and reviews exist

---

### Subtask T085 – Integrate InfiniteScroll component

**Purpose**: Add infinite scroll at list end.

**Steps**:

1. Update FeedPage.tsx return statement:

   ```typescript
   return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <h1 className="text-3xl font-bold mb-8">독후감 피드</h1>

       {/* Loading skeleton */}
       {/* Error state */}
       {/* Empty state */}

       {/* Review list */}
       {!isLoading && !error && reviews.length > 0 && (
         <>
           <div className="space-y-6">
             {reviews.map((review) => (
               <ReviewCard key={review.id} review={review} />
             ))}
           </div>

           {/* Infinite scroll */}
           <InfiniteScroll
             isLoading={isLoading}
             hasMore={hasMore}
             onLoadMore={loadMore}
           />
         </>
       )}
     </div>
   );
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (depends on T084)

---

### Subtask T086 – Implement loading skeleton

**Purpose**: Show skeleton UI during initial load.

**Steps**:

1. Update FeedPage.tsx return statement:

   ```typescript
   import { Skeleton } from '../../components/ui/skeleton';

   return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <h1 className="text-3xl font-bold mb-8">독후감 피드</h1>

       {/* Loading skeleton */}
       {isLoading && reviews.length === 0 && (
         <div className="space-y-6">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="border rounded-lg p-6 space-y-4">
               <div className="flex gap-4">
                 <Skeleton className="w-20 h-28 rounded" />
                 <div className="flex-1 space-y-2">
                   <Skeleton className="h-4 w-32" />
                   <Skeleton className="h-5 w-64" />
                   <Skeleton className="h-4 w-48" />
                 </div>
               </div>
               <Skeleton className="h-20 w-full" />
               <div className="flex gap-2">
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-8 w-16" />
               </div>
             </div>
           ))}
         </div>
       )}

       {/* Error state */}
       {/* Empty state */}
       {/* Review list */}
       {/* Infinite scroll */}
     </div>
   );
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (depends on T081)

**Notes**:

- Show 3 skeleton cards during initial load
- Only show when isLoading=true and no reviews yet

---

### Subtask T087 – Implement empty state

**Purpose**: Show empty state when no reviews exist.

**Steps**:

1. Update FeedPage.tsx return statement:

   ```typescript
   import { FileText } from 'lucide-react';
   import { Button } from '../../components/ui/button';
   import { useNavigate } from 'react-router-dom';

   export function FeedPage() {
     const navigate = useNavigate();
     // ... existing code

     return (
       <div className="container mx-auto px-4 py-8 max-w-4xl">
         <h1 className="text-3xl font-bold mb-8">독후감 피드</h1>

         {/* Loading skeleton */}
         {/* Error state */}

         {/* Empty state */}
         {!isLoading && !error && reviews.length === 0 && (
           <div className="flex flex-col items-center justify-center py-16 text-center">
             <FileText className="w-16 h-16 text-muted-foreground mb-4" />
             <h2 className="text-xl font-semibold mb-2">
               아직 작성된 독후감이 없습니다
             </h2>
             <p className="text-muted-foreground mb-6">
               첫 번째 독후감을 작성해 보세요!
             </p>
             <Button onClick={() => navigate('/reviews/new')}>
               독후감 작성하기
             </Button>
           </div>
         )}

         {/* Review list */}
         {/* Infinite scroll */}
       </div>
     );
   }
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (depends on T081)

**Notes**:

- Show when not loading, no error, and no reviews
- Include CTA button to create first review

---

### Subtask T088 – Implement error state with retry button

**Purpose**: Show error message with retry option.

**Steps**:

1. Update FeedPage.tsx return statement:

   ```typescript
   import { AlertCircle } from 'lucide-react';

   return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <h1 className="text-3xl font-bold mb-8">독후감 피드</h1>

       {/* Loading skeleton */}

       {/* Error state */}
       {error && (
         <div className="flex flex-col items-center justify-center py-16 text-center">
           <AlertCircle className="w-16 h-16 text-destructive mb-4" />
           <h2 className="text-xl font-semibold mb-2">
             독후감을 불러올 수 없습니다
           </h2>
           <p className="text-muted-foreground mb-6">{error}</p>
           <Button onClick={() => loadFeed()} variant="outline">
             다시 시도
           </Button>
         </div>
       )}

       {/* Empty state */}
       {/* Review list */}
       {/* Infinite scroll */}
     </div>
   );
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (depends on T081)

**Notes**:

- Show when error exists
- Display error message from store
- Retry button calls loadFeed()

---

### Subtask T089 – Add route to React Router

**Purpose**: Configure `/feed` route.

**Steps**:

1. Open or create `packages/frontend/src/App.tsx` (or router config file)
2. Add FeedPage route:

   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
   import { FeedPage } from './pages/Feed';

   export function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path="/feed" element={<FeedPage />} />
           {/* Other routes */}
           <Route path="*" element={<Navigate to="/feed" replace />} />
         </Routes>
       </BrowserRouter>
     );
   }
   ```

**Files**: `packages/frontend/src/App.tsx`

**Parallel?**: No (depends on T081)

**Notes**:

- Install react-router-dom if not already: `pnpm add react-router-dom`
- Wildcard route redirects to `/feed`

---

### Subtask T090 – Set FeedPage as home route

**Purpose**: Redirect root path to `/feed`.

**Steps**:

1. Verify redirect in App.tsx (implemented in T089):
   ```typescript
   <Routes>
     <Route path="/" element={<Navigate to="/feed" replace />} />
     <Route path="/feed" element={<FeedPage />} />
     {/* Other routes */}
   </Routes>
   ```

**Files**: `packages/frontend/src/App.tsx`

**Parallel?**: No (depends on T089)

**Validation**:

- Navigate to `http://localhost:5173/`
- Verify redirect to `http://localhost:5173/feed`

---

### Subtask T091 – Add page-level responsive layout

**Purpose**: Apply container, padding, and responsive styles.

**Steps**:

1. Verify responsive layout in FeedPage.tsx (implemented in T081):

   ```typescript
   return (
     <div className="container mx-auto px-4 py-8 max-w-4xl">
       <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">
         독후감 피드
       </h1>

       {/* Content */}
     </div>
   );
   ```

2. Add responsive adjustments:

   ```typescript
   <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl">
     <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center sm:text-left">
       독후감 피드
     </h1>

     <div className="space-y-4 sm:space-y-6">
       {/* Review cards */}
     </div>
   </div>
   ```

**Files**: `packages/frontend/src/pages/Feed/FeedPage.tsx`

**Parallel?**: No (final polish step)

**Notes**:

- container: Centers content and applies max-width
- px-4 sm:px-6 lg:px-8: Responsive horizontal padding
- py-6 sm:py-8: Responsive vertical padding
- max-w-4xl: Maximum width for readability

---

## Test Strategy

**Component Tests**:

- Test FeedPage renders loading skeleton on mount
- Test FeedPage renders review list after load
- Test FeedPage renders empty state when no reviews
- Test FeedPage renders error state on API error
- Test retry button calls loadFeed()

**Integration Tests**:

- Test with real feed store and API
- Test infinite scroll triggers loadMore
- Test navigation to review detail
- Test responsive layout on different screen sizes

**E2E Tests**:

- Navigate to / - redirects to /feed
- Navigate to /feed - displays feed
- Scroll to bottom - loads more reviews
- Click review card - navigates to detail

## Risks & Mitigations

**Risk 1: Slow initial load**

- **Impact**: Poor first impression, high bounce rate
- **Mitigation**: Loading skeleton, optimize API response time, implement SSR (Phase 2)
- **Recovery**: Add performance monitoring, optimize queries

**Risk 2: Memory leak from store subscriptions**

- **Impact**: Performance degradation over time
- **Mitigation**: Zustand handles cleanup automatically, verify no leaks in DevTools
- **Recovery**: Add manual cleanup in useEffect if needed

**Risk 3: Poor mobile experience**

- **Impact**: Users leave site
- **Mitigation**: Mobile-first responsive design, test on real devices
- **Recovery**: Use BrowserStack or real device testing

## Definition of Done Checklist

- [ ] All subtasks T081-T091 completed and validated
- [ ] FeedPage component created and exported
- [ ] Feed store integrated with useEffect for initial load
- [ ] Reviews array mapped to ReviewCard components
- [ ] InfiniteScroll component integrated at list end
- [ ] Loading skeleton displays during initial load (3 cards)
- [ ] Empty state shows when no reviews
- [ ] Error state with retry button displays on error
- [ ] Route `/feed` added to React Router
- [ ] Root path `/` redirects to `/feed`
- [ ] Page-level responsive layout applied
- [ ] First load <2s (10 reviews) - verified in DevTools Network
- [ ] Scroll performance 60fps - verified in DevTools Performance
- [ ] Mobile responsive - tested on mobile viewport
- [ ] TypeScript compilation passes: `pnpm --filter frontend type-check`

## Review Guidance

**Key Acceptance Checkpoints**:

1. **Feed Loading**: Initial load displays skeleton, then reviews
2. **Infinite Scroll**: Scrolling to bottom loads more reviews
3. **States**: Empty, error, and loading states work correctly
4. **Routing**: `/` redirects to `/feed`, route works correctly
5. **Performance**: <2s load, 60fps scroll, responsive layout

**Reviewer Should Verify**:

- [ ] Navigate to http://localhost:5173/ - redirects to /feed
- [ ] View feed page - loading skeleton appears
- [ ] After load - review cards display
- [ ] Scroll to bottom - more reviews load
- [ ] Test empty state - manually clear reviews in DevTools
- [ ] Test error state - block API in DevTools Network tab
- [ ] Click retry button - reloads feed
- [ ] Test responsive - resize browser window
- [ ] Check DevTools Network - first load <2s
- [ ] Check DevTools Performance - scroll 60fps
- [ ] Run `pnpm --filter frontend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

This completes the MVP! The feed is now functional with:

- Review list display
- Infinite scroll pagination
- Like/bookmark functionality
- Responsive design

Next enhancements (WP09-WP11):

- **WP09**: Frontend - Review Detail Page (individual review view)
- **WP10**: Frontend - Authentication Integration (login prompts)
- **WP11**: Polish & Performance (optimization, accessibility, testing)
- 2025-11-09T01:14:57Z – claude – shell_pid=58509 – lane=doing – Started implementation

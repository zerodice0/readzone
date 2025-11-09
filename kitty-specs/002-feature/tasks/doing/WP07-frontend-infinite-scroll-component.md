---
work_package_id: 'WP07'
subtasks:
  - 'T074'
  - 'T075'
  - 'T076'
  - 'T077'
  - 'T078'
  - 'T079'
  - 'T080'
title: 'Frontend - Infinite Scroll Component'
phase: 'Phase 2 - Frontend'
lane: 'doing'
assignee: 'claude'
agent: 'claude'
shell_pid: '30743'
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
  - timestamp: '2025-11-09T08:30:00Z'
    lane: 'doing'
    agent: 'claude'
    shell_pid: '30743'
    action: 'Started WP07 implementation'
---

# Work Package Prompt: WP07 – Frontend - Infinite Scroll Component

## Objectives & Success Criteria

**Goal**: Implement InfiniteScroll component using Intersection Observer with 800px threshold.

**Success Criteria**:

- [ ] InfiniteScroll component created
- [ ] Intersection Observer configured with rootMargin: '800px'
- [ ] Sentinel element at list bottom for observer target
- [ ] Loading spinner displays while isLoading=true
- [ ] "모든 독후감을 확인했습니다" message shows when hasMore=false
- [ ] Cleanup logic disconnects observer on unmount
- [ ] Edge cases handled (tall screens, rapid scrolling)
- [ ] No multiple loadMore() calls on fast scrolling

## Context & Constraints

**Related Documents**:

- `kitty-specs/002-feature/spec.md` - Infinite scroll requirements (800px threshold)
- `kitty-specs/002-feature/plan.md` - Performance goals (60fps scrolling)

**Constraints**:

- Must use Intersection Observer API (not scroll event)
- rootMargin: '800px' for screen-size-independent triggering
- Prevent concurrent loadMore calls with isLoading flag
- 60fps scroll performance target
- Fallback for browsers without Intersection Observer support

**Architectural Decisions**:

- Intersection Observer for performance
- Sentinel element pattern for clean separation
- No external libraries (react-infinite-scroll, etc.)

## Subtasks & Detailed Guidance

### Subtask T074 – Create InfiniteScroll component

**Purpose**: Create component structure with Intersection Observer.

**Steps**:

1. Create directory: `packages/frontend/src/components/InfiniteScroll`
2. Create file: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`
3. Implement component:

   ```typescript
   import { useEffect, useRef } from 'react';

   interface InfiniteScrollProps {
     isLoading: boolean;
     hasMore: boolean;
     onLoadMore: () => void;
     children?: React.ReactNode;
   }

   export function InfiniteScroll({
     isLoading,
     hasMore,
     onLoadMore,
     children,
   }: InfiniteScrollProps) {
     const sentinelRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
       // Implementation in T075
     }, [isLoading, hasMore, onLoadMore]);

     return (
       <>
         {children}

         {/* Sentinel element - implementation in T076 */}

         {/* Loading spinner - implementation in T077 */}

         {/* End message - implementation in T078 */}
       </>
     );
   }
   ```

4. Create index file: `packages/frontend/src/components/InfiniteScroll/index.tsx`
   ```typescript
   export { InfiniteScroll } from './InfiniteScroll';
   ```

**Files**:

- `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`
- `packages/frontend/src/components/InfiniteScroll/index.tsx`

**Parallel?**: No (single component, sequential logic)

---

### Subtask T075 – Implement Intersection Observer

**Purpose**: Set up Intersection Observer with 800px rootMargin.

**Steps**:

1. Update InfiniteScroll.tsx useEffect:

   ```typescript
   useEffect(() => {
     const sentinel = sentinelRef.current;
     if (!sentinel) return;

     // Don't observe if loading or no more items
     if (isLoading || !hasMore) return;

     const observer = new IntersectionObserver(
       (entries) => {
         // If sentinel is visible, load more
         if (entries[0].isIntersecting) {
           onLoadMore();
         }
       },
       {
         rootMargin: '800px', // Trigger 800px before sentinel
         threshold: 0, // Trigger as soon as any part is visible
       }
     );

     observer.observe(sentinel);

     // Cleanup implementation in T079
     return () => {
       observer.disconnect();
     };
   }, [isLoading, hasMore, onLoadMore]);
   ```

**Files**: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`

**Parallel?**: No (depends on T074)

**Notes**:

- rootMargin: '800px' triggers before user reaches bottom
- threshold: 0 triggers as soon as sentinel enters viewport + rootMargin
- Observer disabled when isLoading or !hasMore

---

### Subtask T076 – Create sentinel element

**Purpose**: Add target element for Intersection Observer.

**Steps**:

1. Update InfiniteScroll.tsx return statement:

   ```typescript
   return (
     <>
       {children}

       {/* Sentinel element for Intersection Observer */}
       {hasMore && (
         <div
           ref={sentinelRef}
           className="h-1 w-full"
           aria-hidden="true"
         />
       )}

       {/* Loading spinner */}
       {/* End message */}
     </>
   );
   ```

**Files**: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`

**Parallel?**: No (depends on T074)

**Notes**:

- Sentinel is invisible (h-1 height)
- Only rendered when hasMore=true
- aria-hidden for accessibility

---

### Subtask T077 – Add loading spinner

**Purpose**: Display loading indicator while fetching more items.

**Steps**:

1. Update InfiniteScroll.tsx return statement:

   ```typescript
   import { Loader2 } from 'lucide-react';

   return (
     <>
       {children}

       {/* Sentinel element */}
       {hasMore && (
         <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
       )}

       {/* Loading spinner */}
       {isLoading && (
         <div className="flex justify-center items-center py-8">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
           <span className="ml-2 text-sm text-muted-foreground">
             독후감을 불러오는 중...
           </span>
         </div>
       )}

       {/* End message */}
     </>
   );
   ```

**Files**: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`

**Parallel?**: No (depends on T074)

**Notes**:

- Use Loader2 icon from lucide-react with spin animation
- Display loading text for better UX

---

### Subtask T078 – Add end-of-feed message

**Purpose**: Display message when all items loaded.

**Steps**:

1. Update InfiniteScroll.tsx return statement:

   ```typescript
   return (
     <>
       {children}

       {/* Sentinel element */}
       {hasMore && (
         <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
       )}

       {/* Loading spinner */}
       {isLoading && (
         <div className="flex justify-center items-center py-8">
           <Loader2 className="w-8 h-8 animate-spin text-primary" />
           <span className="ml-2 text-sm text-muted-foreground">
             독후감을 불러오는 중...
           </span>
         </div>
       )}

       {/* End of feed message */}
       {!hasMore && !isLoading && (
         <div className="flex justify-center items-center py-8 text-center">
           <div>
             <p className="text-sm text-muted-foreground mb-2">
               모든 독후감을 확인했습니다
             </p>
             <p className="text-xs text-muted-foreground">
               새로운 독후감이 작성되면 여기에 표시됩니다
             </p>
           </div>
         </div>
       )}
     </>
   );
   ```

**Files**: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`

**Parallel?**: No (depends on T074)

---

### Subtask T079 – Implement cleanup logic

**Purpose**: Disconnect observer on component unmount.

**Steps**:

1. Verify cleanup in useEffect (implemented in T075):

   ```typescript
   useEffect(() => {
     const sentinel = sentinelRef.current;
     if (!sentinel) return;

     if (isLoading || !hasMore) return;

     const observer = new IntersectionObserver(
       (entries) => {
         if (entries[0].isIntersecting) {
           onLoadMore();
         }
       },
       {
         rootMargin: '800px',
         threshold: 0,
       }
     );

     observer.observe(sentinel);

     // Cleanup: disconnect observer
     return () => {
       observer.disconnect();
     };
   }, [isLoading, hasMore, onLoadMore]);
   ```

2. Test cleanup:
   - Navigate away from feed page
   - Verify no memory leaks in DevTools Memory profiler

**Files**: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`

**Parallel?**: No (verification step)

**Notes**:

- Cleanup runs when component unmounts or dependencies change
- Prevents memory leaks and stale observers

---

### Subtask T080 – Handle edge cases

**Purpose**: Test and fix edge cases for robust implementation.

**Steps**:

1. **Tall screens** (more than 1 page fits on screen):
   - Initial load should trigger loadMore automatically
   - Solution: Observer with rootMargin triggers even on tall screens
2. **Rapid scrolling**:
   - Prevent multiple loadMore() calls
   - Solution: isLoading flag in feedStore prevents concurrent calls
   - Test: Scroll quickly, verify only one request at a time
3. **Browser compatibility**:
   - Check Intersection Observer support
   - Add polyfill or fallback:

   ```typescript
   useEffect(() => {
     if (!('IntersectionObserver' in window)) {
       console.warn(
         'IntersectionObserver not supported, using scroll fallback'
       );
       // Fallback to scroll event listener
       const handleScroll = () => {
         if (isLoading || !hasMore) return;
         const scrollPosition = window.innerHeight + window.scrollY;
         const threshold = document.body.offsetHeight - 800;
         if (scrollPosition >= threshold) {
           onLoadMore();
         }
       };
       window.addEventListener('scroll', handleScroll);
       return () => window.removeEventListener('scroll', handleScroll);
     }

     // ... existing Intersection Observer code
   }, [isLoading, hasMore, onLoadMore]);
   ```

**Files**: `packages/frontend/src/components/InfiniteScroll/InfiniteScroll.tsx`

**Parallel?**: No (testing and verification)

**Validation**:

- Test on different screen sizes (mobile, tablet, desktop)
- Test rapid scrolling
- Test on browsers without Intersection Observer (IE11)

---

## Test Strategy

**Component Tests**:

- Test InfiniteScroll renders sentinel when hasMore=true
- Test loading spinner shows when isLoading=true
- Test end message shows when hasMore=false
- Test onLoadMore called when sentinel intersects
- Test cleanup disconnects observer

**Integration Tests**:

- Test with feed store (real data)
- Test pagination works correctly
- Test concurrent calls prevented
- Test on different screen sizes

**Performance Tests**:

- Measure scroll performance (60fps target)
- Test with 1000+ items in feed
- Test memory usage (no leaks)

## Risks & Mitigations

**Risk 1: Multiple loadMore() calls on fast scrolling**

- **Impact**: Duplicate API requests, incorrect pagination
- **Mitigation**: Use isLoading flag in feedStore to prevent concurrent calls
- **Recovery**: Verify isLoading check in both component and store

**Risk 2: Observer not supported in old browsers**

- **Impact**: Infinite scroll doesn't work
- **Mitigation**: Add polyfill or fallback to scroll event listener
- **Recovery**: Use intersection-observer polyfill package

**Risk 3: Performance issues with many items**

- **Impact**: Slow scrolling, janky animations
- **Mitigation**: Use React.memo() for ReviewCard, virtualization for very long lists
- **Recovery**: Implement react-window for virtualized scrolling (Phase 2)

## Definition of Done Checklist

- [ ] All subtasks T074-T080 completed and validated
- [ ] InfiniteScroll component created
- [ ] Intersection Observer configured with rootMargin: '800px'
- [ ] Sentinel element at list bottom for observer target
- [ ] Loading spinner displays while isLoading=true
- [ ] End-of-feed message shows when hasMore=false
- [ ] Cleanup logic disconnects observer on unmount
- [ ] Edge cases handled (tall screens, rapid scrolling)
- [ ] isLoading flag prevents multiple loadMore() calls
- [ ] Fallback for browsers without Intersection Observer
- [ ] Scroll performance 60fps (verified in DevTools)
- [ ] No memory leaks (verified in DevTools Memory profiler)
- [ ] TypeScript compilation passes: `pnpm --filter frontend type-check`

## Review Guidance

**Key Acceptance Checkpoints**:

1. **Observer Configuration**: rootMargin: '800px', threshold: 0
2. **Edge Case Handling**: Tall screens, rapid scrolling, browser compatibility
3. **Performance**: 60fps scrolling, no memory leaks
4. **UX**: Loading spinner, end message, smooth transitions

**Reviewer Should Verify**:

- [ ] Scroll to bottom - loadMore triggered 800px before end
- [ ] Test rapid scrolling - only one loadMore call at a time
- [ ] Test tall screen - loadMore triggers automatically
- [ ] Navigate away - observer disconnects (no leaks)
- [ ] Test on mobile - scroll performance 60fps
- [ ] Test on old browser - fallback works (if applicable)
- [ ] Check DevTools Performance - 60fps during scroll
- [ ] Check DevTools Memory - no leaks after navigation
- [ ] Run `pnpm --filter frontend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP07 is done, the following work packages can proceed:

- **WP08**: Frontend - Feed Page (depends on WP06 and WP07)

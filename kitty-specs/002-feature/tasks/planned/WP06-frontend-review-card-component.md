---
work_package_id: 'WP06'
subtasks:
  - 'T061'
  - 'T062'
  - 'T063'
  - 'T064'
  - 'T065'
  - 'T066'
  - 'T067'
  - 'T068'
  - 'T069'
  - 'T070'
  - 'T071'
  - 'T072'
  - 'T073'
title: 'Frontend - Review Card Component'
phase: 'Phase 2 - Frontend'
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

# Work Package Prompt: WP06 – Frontend - Review Card Component

## Objectives & Success Criteria

**Goal**: Implement ReviewCard component displaying book cover, title, author, review excerpt, likes, bookmarks, recommend status.

**Success Criteria**:
- [ ] shadcn/ui installed and configured
- [ ] shadcn/ui Card, Button, Skeleton components added
- [ ] ReviewCard component created with all data fields
- [ ] Book cover displays with lazy loading and error fallback
- [ ] Review excerpt truncated to max 150 chars
- [ ] Relative time display (e.g., "3시간 전")
- [ ] Recommend/not recommend icon display (actual icons, not emoji)
- [ ] Like button with count and active state
- [ ] Bookmark button with active state
- [ ] Share button opens share modal/options
- [ ] Click handler navigates to review detail
- [ ] Responsive styling (mobile-first, Tailwind CSS)
- [ ] Hover effects and transitions

## Context & Constraints

**Related Documents**:
- `kitty-specs/002-feature/spec.md` - UI requirements
- `kitty-specs/002-feature/plan.md` - Frontend tech stack (React 18, shadcn/ui, Tailwind CSS)

**Constraints**:
- Must use shadcn/ui Card component as base
- Icons from lucide-react (ThumbsUp, ThumbsDown, Bookmark, Share)
- Mobile-first responsive design
- Accessibility: ARIA labels, keyboard navigation
- Image lazy loading for performance

**Architectural Decisions**:
- shadcn/ui for consistent design system
- Tailwind CSS for styling
- React Router for navigation
- date-fns for relative time formatting

## Subtasks & Detailed Guidance

### Subtask T061 – Install shadcn/ui

**Purpose**: Set up shadcn/ui design system.

**Steps**:
1. Initialize shadcn/ui:
   ```bash
   cd packages/frontend
   npx shadcn-ui@latest init
   ```
2. Answer prompts:
   - TypeScript: Yes
   - Style: Default
   - Base color: Slate
   - CSS variables: Yes
   - Tailwind config: Yes
   - Components location: src/components/ui
   - Utils location: src/lib/utils
   - React Server Components: No
   - Write config: Yes
3. Verify files created:
   - `components.json`
   - `src/lib/utils.ts`
   - Updated `tailwind.config.js`

**Files**:
- `packages/frontend/components.json`
- `packages/frontend/src/lib/utils.ts`
- `packages/frontend/tailwind.config.js`

**Parallel?**: Yes

**Validation**:
```bash
cat components.json
pnpm --filter frontend type-check
```

---

### Subtask T062 – Add shadcn/ui components

**Purpose**: Install Card, Button, Skeleton components.

**Steps**:
1. Add components:
   ```bash
   cd packages/frontend
   npx shadcn-ui@latest add card button skeleton
   ```
2. Verify components created:
   ```bash
   ls src/components/ui/
   # Should show: card.tsx, button.tsx, skeleton.tsx
   ```

**Files**:
- `packages/frontend/src/components/ui/card.tsx`
- `packages/frontend/src/components/ui/button.tsx`
- `packages/frontend/src/components/ui/skeleton.tsx`

**Parallel?**: No (depends on T061)

---

### Subtask T063 – Create ReviewCard component

**Purpose**: Create ReviewCard component structure.

**Steps**:
1. Create directory: `packages/frontend/src/components/ReviewCard`
2. Create file: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`
3. Implement component:
   ```typescript
   import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
   import { Button } from '../ui/button';
   import { ThumbsUp, ThumbsDown, Bookmark, Share2 } from 'lucide-react';
   import type { Review } from '../../types/review';
   import { useFeedStore } from '../../stores/feedStore';
   import { useNavigate } from 'react-router-dom';
   import { formatDistanceToNow } from 'date-fns';
   import { ko } from 'date-fns/locale';

   interface ReviewCardProps {
     review: Review;
   }

   export function ReviewCard({ review }: ReviewCardProps) {
     const navigate = useNavigate();
     const toggleLike = useFeedStore((state) => state.toggleLike);
     const toggleBookmark = useFeedStore((state) => state.toggleBookmark);

     const handleCardClick = (e: React.MouseEvent) => {
       // Don't navigate if clicking on buttons
       if ((e.target as HTMLElement).closest('button')) return;
       navigate(`/reviews/${review.id}`);
     };

     const handleLike = (e: React.MouseEvent) => {
       e.stopPropagation();
       toggleLike(review.id);
     };

     const handleBookmark = (e: React.MouseEvent) => {
       e.stopPropagation();
       toggleBookmark(review.id);
     };

     const handleShare = (e: React.MouseEvent) => {
       e.stopPropagation();
       // TODO: Implement share functionality
       navigator.clipboard.writeText(window.location.origin + `/reviews/${review.id}`);
       alert('링크가 복사되었습니다');
     };

     const relativeTime = formatDistanceToNow(new Date(review.publishedAt), {
       addSuffix: true,
       locale: ko,
     });

     return (
       <Card
         className="cursor-pointer transition-shadow hover:shadow-lg"
         onClick={handleCardClick}
       >
         <CardHeader className="flex flex-row gap-4 space-y-0">
           {/* Book cover - implemented in T064 */}
           <div className="flex-1">
             {/* User info */}
             <div className="flex items-center gap-2 mb-2">
               <img
                 src={review.user.profileImage || '/default-avatar.png'}
                 alt={review.user.name}
                 className="w-8 h-8 rounded-full"
               />
               <div>
                 <p className="font-semibold text-sm">{review.user.name}</p>
                 <p className="text-xs text-muted-foreground">{relativeTime}</p>
               </div>
             </div>

             {/* Book title and author */}
             <h3 className="font-bold text-lg mb-1">{review.book.title}</h3>
             <p className="text-sm text-muted-foreground mb-2">{review.book.author}</p>

             {/* Review title */}
             {review.title && (
               <h4 className="font-semibold text-md mb-2">{review.title}</h4>
             )}
           </div>
         </CardHeader>

         <CardContent>
           {/* Review excerpt - implemented in T065 */}
           {/* Recommend icon - implemented in T067 */}
         </CardContent>

         <CardFooter className="flex justify-between items-center">
           {/* Like button - implemented in T068 */}
           {/* Bookmark button - implemented in T069 */}
           {/* Share button - implemented in T070 */}
         </CardFooter>
       </Card>
     );
   }
   ```
4. Create index file: `packages/frontend/src/components/ReviewCard/index.tsx`
   ```typescript
   export { ReviewCard } from './ReviewCard';
   ```

**Files**:
- `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`
- `packages/frontend/src/components/ReviewCard/index.tsx`

**Parallel?**: No (depends on T061, T062)

**Notes**:
- Install date-fns: `pnpm add date-fns`
- Install lucide-react: `pnpm add lucide-react`

---

### Subtask T064 – Implement book cover display

**Purpose**: Display book cover with lazy loading and error fallback.

**Steps**:
1. Update ReviewCard.tsx to add book cover:
   ```typescript
   import { useState } from 'react';

   // Inside ReviewCard component, in CardHeader
   const [imageError, setImageError] = useState(false);

   // Add book cover image
   <div className="shrink-0">
     <img
       src={imageError ? '/placeholder-book.png' : review.book.coverImageUrl || '/placeholder-book.png'}
       alt={review.book.title}
       className="w-20 h-28 object-cover rounded shadow-sm"
       loading="lazy"
       onError={() => setImageError(true)}
     />
   </div>
   ```
2. Create placeholder image: `packages/frontend/public/placeholder-book.png`
   - Use a simple gray rectangle with book icon
   - Or download from https://via.placeholder.com/80x112?text=Book

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

**Notes**:
- `loading="lazy"` enables native lazy loading
- `onError` handler switches to placeholder on failure

---

### Subtask T065 – Implement review excerpt truncation

**Purpose**: Display review content truncated to 150 chars.

**Steps**:
1. Update ReviewCard.tsx in CardContent:
   ```typescript
   <CardContent>
     <p className="text-sm text-foreground line-clamp-3">
       {review.content.length > 150
         ? review.content.substring(0, 150) + '...'
         : review.content}
     </p>
   </CardContent>
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

**Notes**:
- Use CSS `line-clamp-3` for 3-line truncation
- Or use JS substring for exact 150 char limit

---

### Subtask T066 – Implement relative time display

**Purpose**: Display relative time (e.g., "3시간 전").

**Steps**:
1. Verify date-fns implementation in T063:
   ```typescript
   import { formatDistanceToNow } from 'date-fns';
   import { ko } from 'date-fns/locale';

   const relativeTime = formatDistanceToNow(new Date(review.publishedAt), {
     addSuffix: true,
     locale: ko,
   });
   ```
2. For dates older than 1 year, show absolute date:
   ```typescript
   const getDisplayTime = (publishedAt: string) => {
     const date = new Date(publishedAt);
     const now = new Date();
     const yearDiff = now.getFullYear() - date.getFullYear();

     if (yearDiff >= 1) {
       return date.toLocaleDateString('ko-KR');
     }

     return formatDistanceToNow(date, {
       addSuffix: true,
       locale: ko,
     });
   };
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

---

### Subtask T067 – Implement recommend/not recommend icon

**Purpose**: Display recommendation status with icons (not emoji).

**Steps**:
1. Update ReviewCard.tsx in CardContent:
   ```typescript
   import { ThumbsUp, ThumbsDown } from 'lucide-react';

   <CardContent>
     {/* Review excerpt */}
     <p className="text-sm text-foreground line-clamp-3 mb-2">
       {review.content.length > 150
         ? review.content.substring(0, 150) + '...'
         : review.content}
     </p>

     {/* Recommend status */}
     <div className="flex items-center gap-1 text-sm">
       {review.isRecommended ? (
         <>
           <ThumbsUp className="w-4 h-4 text-green-600" />
           <span className="text-green-600 font-medium">추천</span>
         </>
       ) : (
         <>
           <ThumbsDown className="w-4 h-4 text-red-600" />
           <span className="text-red-600 font-medium">비추천</span>
         </>
       )}
       {review.rating && (
         <span className="ml-2 text-muted-foreground">
           ⭐ {review.rating}/5
         </span>
       )}
     </div>
   </CardContent>
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

---

### Subtask T068 – Implement like button

**Purpose**: Display like button with count and active state.

**Steps**:
1. Update ReviewCard.tsx in CardFooter:
   ```typescript
   import { Heart } from 'lucide-react';

   <CardFooter className="flex justify-between items-center">
     <div className="flex gap-2">
       {/* Like button */}
       <Button
         variant="ghost"
         size="sm"
         onClick={handleLike}
         className={review.isLikedByMe ? 'text-red-500' : ''}
       >
         <Heart
           className={`w-4 h-4 mr-1 ${review.isLikedByMe ? 'fill-current' : ''}`}
         />
         <span>{review.likeCount}</span>
       </Button>

       {/* Bookmark button - implemented in T069 */}
     </div>

     {/* Share button - implemented in T070 */}
   </CardFooter>
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

**Notes**:
- Use `Heart` icon from lucide-react
- Active state: filled heart with red color
- Inactive state: outline heart with default color

---

### Subtask T069 – Implement bookmark button

**Purpose**: Display bookmark button with active state.

**Steps**:
1. Update ReviewCard.tsx in CardFooter:
   ```typescript
   import { Bookmark } from 'lucide-react';

   {/* Bookmark button */}
   <Button
     variant="ghost"
     size="sm"
     onClick={handleBookmark}
     className={review.isBookmarkedByMe ? 'text-blue-500' : ''}
   >
     <Bookmark
       className={`w-4 h-4 ${review.isBookmarkedByMe ? 'fill-current' : ''}`}
     />
   </Button>
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

---

### Subtask T070 – Implement share button

**Purpose**: Display share button that opens share modal/options.

**Steps**:
1. Update ReviewCard.tsx in CardFooter:
   ```typescript
   import { Share2 } from 'lucide-react';

   {/* Share button */}
   <Button variant="ghost" size="sm" onClick={handleShare}>
     <Share2 className="w-4 h-4" />
   </Button>
   ```
2. For MVP, use simple clipboard copy:
   ```typescript
   const handleShare = (e: React.MouseEvent) => {
     e.stopPropagation();
     const url = `${window.location.origin}/reviews/${review.id}`;
     navigator.clipboard.writeText(url);
     // TODO: Replace with toast notification
     alert('링크가 복사되었습니다');
   };
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

**Notes**:
- Future enhancement: Share modal with social media options

---

### Subtask T071 – Add click handler for navigation

**Purpose**: Navigate to review detail page on card click.

**Steps**:
1. Verify navigation implementation in T063:
   ```typescript
   import { useNavigate } from 'react-router-dom';

   const navigate = useNavigate();

   const handleCardClick = (e: React.MouseEvent) => {
     // Don't navigate if clicking on buttons
     if ((e.target as HTMLElement).closest('button')) return;
     navigate(`/reviews/${review.id}`);
   };
   ```
2. Add `onClick={handleCardClick}` to Card component
3. Test that buttons don't trigger navigation (event.stopPropagation)

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on T063)

---

### Subtask T072 – Add responsive styling

**Purpose**: Mobile-first responsive design with Tailwind CSS.

**Steps**:
1. Update ReviewCard.tsx with responsive classes:
   ```typescript
   <Card className="cursor-pointer transition-shadow hover:shadow-lg w-full max-w-2xl">
     <CardHeader className="flex flex-col sm:flex-row gap-4 space-y-0 p-4 sm:p-6">
       {/* Book cover */}
       <div className="shrink-0 self-center sm:self-start">
         <img
           src={...}
           className="w-20 h-28 sm:w-24 sm:h-32 object-cover rounded shadow-sm"
           loading="lazy"
         />
       </div>

       <div className="flex-1 text-center sm:text-left">
         {/* User info */}
         <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
           {/* ... */}
         </div>

         {/* Book and review info */}
         <h3 className="font-bold text-lg sm:text-xl mb-1">{review.book.title}</h3>
         <p className="text-sm sm:text-base text-muted-foreground mb-2">
           {review.book.author}
         </p>
       </div>
     </CardHeader>

     <CardContent className="p-4 sm:p-6">
       {/* Content */}
     </CardContent>

     <CardFooter className="flex flex-wrap justify-between items-center gap-2 p-4 sm:p-6">
       {/* Buttons */}
     </CardFooter>
   </Card>
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (depends on all previous subtasks)

**Notes**:
- Mobile: Vertical layout, centered text
- Desktop: Horizontal layout, left-aligned text
- Use Tailwind breakpoints: sm, md, lg

---

### Subtask T073 – Add hover effects and transitions

**Purpose**: Improve UX with smooth transitions and hover states.

**Steps**:
1. Update Card component:
   ```typescript
   <Card className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02]">
   ```
2. Add button hover effects:
   ```typescript
   <Button
     variant="ghost"
     size="sm"
     className="transition-colors hover:bg-accent hover:text-accent-foreground"
     onClick={handleLike}
   >
   ```
3. Add image hover effect:
   ```typescript
   <img
     className="w-20 h-28 object-cover rounded shadow-sm transition-transform hover:scale-105"
   />
   ```

**Files**: `packages/frontend/src/components/ReviewCard/ReviewCard.tsx`

**Parallel?**: No (final polish step)

**Notes**:
- Use Tailwind transition utilities
- Keep animations subtle (200ms duration)
- Ensure accessibility (no reliance on hover for functionality)

---

## Test Strategy

**Component Tests**:
- Render ReviewCard with mock data
- Test like button click triggers store action
- Test bookmark button click triggers store action
- Test share button copies link to clipboard
- Test card click navigates to detail page
- Test button clicks don't trigger card navigation

**Visual Tests**:
- Test responsive layout (mobile, tablet, desktop)
- Test hover states and transitions
- Test with missing images (fallback)
- Test with very long content (truncation)

**Accessibility Tests**:
- Test keyboard navigation (Tab, Enter)
- Test ARIA labels and roles
- Test with screen reader
- Test color contrast (WCAG AA)

## Risks & Mitigations

**Risk 1: Image loading performance issues**
- **Impact**: Slow page load, poor UX
- **Mitigation**: Lazy loading with `loading="lazy"`, Intersection Observer
- **Recovery**: Add skeleton loading state

**Risk 2: Inconsistent styling across browsers**
- **Impact**: Broken layout on some browsers
- **Mitigation**: Test on Chrome, Firefox, Safari; use Tailwind's cross-browser utilities
- **Recovery**: Add browser-specific CSS fixes

**Risk 3: Accessibility issues**
- **Impact**: Unusable for keyboard/screen reader users
- **Mitigation**: Follow WCAG 2.1 AA guidelines, add ARIA labels
- **Recovery**: Use automated tools (axe, Lighthouse), manual testing

## Definition of Done Checklist

- [ ] All subtasks T061-T073 completed and validated
- [ ] shadcn/ui installed and configured
- [ ] Card, Button, Skeleton components added
- [ ] ReviewCard component created with all data fields
- [ ] Book cover displays with lazy loading and error fallback
- [ ] Review excerpt truncated to max 150 chars
- [ ] Relative time display working ("3시간 전")
- [ ] Recommend/not recommend icon display (not emoji)
- [ ] Like button with count and active state working
- [ ] Bookmark button with active state working
- [ ] Share button copies link to clipboard
- [ ] Click handler navigates to review detail
- [ ] Responsive styling works (mobile, tablet, desktop)
- [ ] Hover effects and transitions smooth
- [ ] Accessibility: keyboard navigation works
- [ ] TypeScript compilation passes: `pnpm --filter frontend type-check`
- [ ] Component renders without errors in browser

## Review Guidance

**Key Acceptance Checkpoints**:
1. **UI Completeness**: All elements display correctly
2. **Interactivity**: Like, bookmark, share, navigation work
3. **Responsive Design**: Mobile-first, works on all screen sizes
4. **Accessibility**: Keyboard navigation, ARIA labels

**Reviewer Should Verify**:
- [ ] View ReviewCard in browser - all elements visible
- [ ] Click like button - store action triggered, optimistic update
- [ ] Click bookmark button - store action triggered, optimistic update
- [ ] Click share button - link copied to clipboard
- [ ] Click card - navigates to review detail
- [ ] Click button on card - does NOT navigate
- [ ] Test on mobile - responsive layout works
- [ ] Test on desktop - hover effects work
- [ ] Tab through card - keyboard navigation works
- [ ] Run `pnpm --filter frontend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP06 is done, the following work packages can proceed:
- **WP07**: Frontend - Infinite Scroll Component (can proceed in parallel)
- **WP08**: Frontend - Feed Page (depends on WP06 and WP07)

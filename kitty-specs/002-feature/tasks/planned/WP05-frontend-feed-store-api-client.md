---
work_package_id: 'WP05'
subtasks:
  - 'T049'
  - 'T050'
  - 'T051'
  - 'T052'
  - 'T053'
  - 'T054'
  - 'T055'
  - 'T056'
  - 'T057'
  - 'T058'
  - 'T059'
  - 'T060'
title: 'Frontend - Feed Store & API Client'
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

# Work Package Prompt: WP05 – Frontend - Feed Store & API Client

## Objectives & Success Criteria

**Goal**: Implement Zustand feed store with pagination, infinite scroll state, and API client for reviews, likes, bookmarks.

**Success Criteria**:
- [ ] Zustand installed and configured
- [ ] TypeScript interfaces for Review and Book defined
- [ ] Axios API clients for reviews, likes, bookmarks created
- [ ] Feed store with reviews array, pagination state implemented
- [ ] loadFeed() action fetches initial feed (page=0)
- [ ] loadMore() action fetches next page (page++)
- [ ] toggleLike() action with optimistic update and rollback
- [ ] toggleBookmark() action with optimistic update and rollback
- [ ] Loading, error, and hasMore state management working
- [ ] Axios interceptors for auth token configured

## Context & Constraints

**Related Documents**:
- `kitty-specs/002-feature/contracts/reviews-api.md` - Reviews API spec
- `kitty-specs/002-feature/contracts/likes-api.md` - Likes API spec
- `kitty-specs/002-feature/contracts/bookmarks-api.md` - Bookmarks API spec
- `kitty-specs/002-feature/plan.md` - Frontend tech stack (React 18, Zustand, Axios)

**Constraints**:
- Must use Zustand for state management
- Optimistic updates for like/bookmark toggles
- Rollback mechanism on API errors
- TypeScript strict mode compliance
- Prevent concurrent API calls with isLoading flag

**Architectural Decisions**:
- Zustand for global state (lighter than Redux)
- Axios for HTTP client with interceptors
- Optimistic UI updates for better UX
- Error handling with toast notifications

## Subtasks & Detailed Guidance

### Subtask T049 – Install Zustand

**Purpose**: Add Zustand state management library.

**Steps**:
1. Install Zustand:
   ```bash
   cd packages/frontend
   pnpm add zustand
   ```
2. Verify installation:
   ```bash
   grep zustand package.json
   ```

**Files**: `packages/frontend/package.json`

**Parallel?**: Yes

**Validation**:
```bash
pnpm --filter frontend type-check
```

---

### Subtask T050 – Create types/review.ts

**Purpose**: Define TypeScript interfaces for Review entity.

**Steps**:
1. Create file: `packages/frontend/src/types/review.ts`
2. Define interfaces based on API contracts:
   ```typescript
   export interface Review {
     id: string;
     title: string | null;
     content: string;
     isRecommended: boolean;
     rating: number | null;
     readStatus: 'READING' | 'COMPLETED' | 'DROPPED';
     status: 'DRAFT' | 'PUBLISHED' | 'DELETED';
     likeCount: number;
     bookmarkCount: number;
     viewCount: number;
     publishedAt: string;
     createdAt: string;
     updatedAt: string;
     user: UserSummary;
     book: BookSummary;
     isLikedByMe?: boolean;
     isBookmarkedByMe?: boolean;
   }

   export interface UserSummary {
     id: string;
     name: string;
     profileImage: string | null;
   }

   export interface BookSummary {
     id: string;
     title: string;
     author: string;
     coverImageUrl: string | null;
   }

   export interface FeedResponse {
     data: Review[];
     meta: {
       page: number;
       limit: number;
       total: number;
       hasMore: boolean;
       timestamp: string;
     };
   }
   ```

**Files**: `packages/frontend/src/types/review.ts`

**Parallel?**: Yes

---

### Subtask T051 – Create types/book.ts

**Purpose**: Define TypeScript interfaces for Book entity.

**Steps**:
1. Create file: `packages/frontend/src/types/book.ts`
2. Define interfaces:
   ```typescript
   export interface Book {
     id: string;
     isbn: string | null;
     title: string;
     author: string;
     publisher: string | null;
     publishedDate: string | null;
     coverImageUrl: string | null;
     description: string | null;
     pageCount: number | null;
     language: string | null;
     externalId: string | null;
     externalSource: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL' | null;
     createdAt: string;
     updatedAt: string;
     reviewCount?: number;
   }

   export interface BookSearchResult {
     externalId: string;
     externalSource: 'GOOGLE_BOOKS' | 'ALADIN' | 'MANUAL';
     isbn: string | null;
     title: string;
     author: string;
     publisher: string | null;
     publishedDate: string | null;
     coverImageUrl: string | null;
     description: string | null;
     pageCount: number | null;
     language: string | null;
   }
   ```

**Files**: `packages/frontend/src/types/book.ts`

**Parallel?**: Yes

---

### Subtask T052 – Create services/api/reviews.ts

**Purpose**: Create Axios client for reviews API.

**Steps**:
1. Create file: `packages/frontend/src/services/api/reviews.ts`
2. Implement API methods:
   ```typescript
   import axios from 'axios';
   import type { FeedResponse, Review } from '../../types/review';

   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

   const api = axios.create({
     baseURL: API_URL,
     timeout: 10000,
   });

   // Add auth token interceptor
   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('auth_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   export const reviewsApi = {
     getFeed: async (page = 0, limit = 20): Promise<FeedResponse> => {
       const response = await api.get('/reviews/feed', {
         params: { page, limit },
       });
       return response.data;
     },

     getReview: async (id: string): Promise<{ data: Review }> => {
       const response = await api.get(`/reviews/${id}`);
       return response.data;
     },

     createReview: async (data: any): Promise<{ data: Review }> => {
       const response = await api.post('/reviews', data);
       return response.data;
     },

     updateReview: async (id: string, data: any): Promise<{ data: Review }> => {
       const response = await api.patch(`/reviews/${id}`, data);
       return response.data;
     },

     deleteReview: async (id: string): Promise<void> => {
       await api.delete(`/reviews/${id}`);
     },
   };
   ```

**Files**: `packages/frontend/src/services/api/reviews.ts`

**Parallel?**: Yes

---

### Subtask T053 – Create services/api/likes.ts

**Purpose**: Create Axios client for likes API.

**Steps**:
1. Create file: `packages/frontend/src/services/api/likes.ts`
2. Implement API methods:
   ```typescript
   import axios from 'axios';

   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

   const api = axios.create({
     baseURL: API_URL,
     timeout: 10000,
   });

   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('auth_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   export const likesApi = {
     toggleLike: async (reviewId: string): Promise<{
       data: { isLiked: boolean; likeCount: number };
     }> => {
       const response = await api.post(`/reviews/${reviewId}/like`);
       return response.data;
     },

     getReviewLikes: async (reviewId: string, page = 0, limit = 20) => {
       const response = await api.get(`/reviews/${reviewId}/likes`, {
         params: { page, limit },
       });
       return response.data;
     },

     getUserLikes: async (page = 0, limit = 20) => {
       const response = await api.get('/users/me/likes', {
         params: { page, limit },
       });
       return response.data;
     },
   };
   ```

**Files**: `packages/frontend/src/services/api/likes.ts`

**Parallel?**: Yes

---

### Subtask T054 – Create services/api/bookmarks.ts

**Purpose**: Create Axios client for bookmarks API.

**Steps**:
1. Create file: `packages/frontend/src/services/api/bookmarks.ts`
2. Implement API methods:
   ```typescript
   import axios from 'axios';

   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

   const api = axios.create({
     baseURL: API_URL,
     timeout: 10000,
   });

   api.interceptors.request.use((config) => {
     const token = localStorage.getItem('auth_token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   export const bookmarksApi = {
     toggleBookmark: async (reviewId: string): Promise<{
       data: { isBookmarked: boolean; bookmarkCount: number };
     }> => {
       const response = await api.post(`/reviews/${reviewId}/bookmark`);
       return response.data;
     },

     getUserBookmarks: async (page = 0, limit = 20) => {
       const response = await api.get('/users/me/bookmarks', {
         params: { page, limit },
       });
       return response.data;
     },

     deleteBookmark: async (id: string): Promise<void> => {
       await api.delete(`/bookmarks/${id}`);
     },
   };
   ```

**Files**: `packages/frontend/src/services/api/bookmarks.ts`

**Parallel?**: Yes

---

### Subtask T055 – Create stores/feedStore.ts

**Purpose**: Implement Zustand store for feed state management.

**Steps**:
1. Create file: `packages/frontend/src/stores/feedStore.ts`
2. Define store:
   ```typescript
   import { create } from 'zustand';
   import type { Review } from '../types/review';
   import { reviewsApi } from '../services/api/reviews';
   import { likesApi } from '../services/api/likes';
   import { bookmarksApi } from '../services/api/bookmarks';

   interface FeedStore {
     reviews: Review[];
     page: number;
     hasMore: boolean;
     isLoading: boolean;
     error: string | null;

     loadFeed: () => Promise<void>;
     loadMore: () => Promise<void>;
     toggleLike: (reviewId: string) => Promise<void>;
     toggleBookmark: (reviewId: string) => Promise<void>;
     reset: () => void;
   }

   export const useFeedStore = create<FeedStore>((set, get) => ({
     reviews: [],
     page: 0,
     hasMore: true,
     isLoading: false,
     error: null,

     loadFeed: async () => {
       // Implemented in T056
     },

     loadMore: async () => {
       // Implemented in T057
     },

     toggleLike: async (reviewId: string) => {
       // Implemented in T058
     },

     toggleBookmark: async (reviewId: string) => {
       // Implemented in T059
     },

     reset: () => {
       set({
         reviews: [],
         page: 0,
         hasMore: true,
         isLoading: false,
         error: null,
       });
     },
   }));
   ```

**Files**: `packages/frontend/src/stores/feedStore.ts`

**Parallel?**: No (depends on types and API clients)

---

### Subtask T056 – Implement loadFeed() action

**Purpose**: Fetch initial feed data (page 0).

**Steps**:
1. Update `loadFeed` method in feedStore.ts:
   ```typescript
   loadFeed: async () => {
     const { isLoading } = get();
     if (isLoading) return;

     set({ isLoading: true, error: null });

     try {
       const response = await reviewsApi.getFeed(0, 20);
       set({
         reviews: response.data,
         page: 0,
         hasMore: response.meta.hasMore,
         isLoading: false,
       });
     } catch (error: any) {
       set({
         error: error.message || '피드를 불러오는데 실패했습니다',
         isLoading: false,
       });
     }
   },
   ```

**Files**: `packages/frontend/src/stores/feedStore.ts`

**Parallel?**: No (depends on T055)

**Validation**:
- Test in browser console: `useFeedStore.getState().loadFeed()`
- Verify reviews populated

---

### Subtask T057 – Implement loadMore() action

**Purpose**: Fetch next page of feed data (pagination).

**Steps**:
1. Update `loadMore` method in feedStore.ts:
   ```typescript
   loadMore: async () => {
     const { isLoading, hasMore, page } = get();
     if (isLoading || !hasMore) return;

     set({ isLoading: true, error: null });

     try {
       const nextPage = page + 1;
       const response = await reviewsApi.getFeed(nextPage, 20);
       set((state) => ({
         reviews: [...state.reviews, ...response.data],
         page: nextPage,
         hasMore: response.meta.hasMore,
         isLoading: false,
       }));
     } catch (error: any) {
       set({
         error: error.message || '더 많은 독후감을 불러오는데 실패했습니다',
         isLoading: false,
       });
     }
   },
   ```

**Files**: `packages/frontend/src/stores/feedStore.ts`

**Parallel?**: No (depends on T056)

---

### Subtask T058 – Implement toggleLike() with optimistic update

**Purpose**: Like toggle with optimistic UI update and rollback on error.

**Steps**:
1. Update `toggleLike` method in feedStore.ts:
   ```typescript
   toggleLike: async (reviewId: string) => {
     const { reviews } = get();
     const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
     if (reviewIndex === -1) return;

     const review = reviews[reviewIndex];
     const prevIsLiked = review.isLikedByMe || false;
     const prevLikeCount = review.likeCount;

     // Optimistic update
     const optimisticReviews = [...reviews];
     optimisticReviews[reviewIndex] = {
       ...review,
       isLikedByMe: !prevIsLiked,
       likeCount: prevIsLiked ? prevLikeCount - 1 : prevLikeCount + 1,
     };
     set({ reviews: optimisticReviews });

     try {
       const response = await likesApi.toggleLike(reviewId);
       
       // Update with server response
       const updatedReviews = [...get().reviews];
       updatedReviews[reviewIndex] = {
         ...updatedReviews[reviewIndex],
         isLikedByMe: response.data.isLiked,
         likeCount: response.data.likeCount,
       };
       set({ reviews: updatedReviews });
     } catch (error: any) {
       // Rollback on error
       const rollbackReviews = [...get().reviews];
       rollbackReviews[reviewIndex] = {
         ...rollbackReviews[reviewIndex],
         isLikedByMe: prevIsLiked,
         likeCount: prevLikeCount,
       };
       set({ 
         reviews: rollbackReviews,
         error: error.message || '좋아요 처리에 실패했습니다',
       });
     }
   },
   ```

**Files**: `packages/frontend/src/stores/feedStore.ts`

**Parallel?**: No (depends on T055)

---

### Subtask T059 – Implement toggleBookmark() with optimistic update

**Purpose**: Bookmark toggle with optimistic UI update and rollback on error.

**Steps**:
1. Update `toggleBookmark` method in feedStore.ts:
   ```typescript
   toggleBookmark: async (reviewId: string) => {
     const { reviews } = get();
     const reviewIndex = reviews.findIndex((r) => r.id === reviewId);
     if (reviewIndex === -1) return;

     const review = reviews[reviewIndex];
     const prevIsBookmarked = review.isBookmarkedByMe || false;
     const prevBookmarkCount = review.bookmarkCount;

     // Optimistic update
     const optimisticReviews = [...reviews];
     optimisticReviews[reviewIndex] = {
       ...review,
       isBookmarkedByMe: !prevIsBookmarked,
       bookmarkCount: prevIsBookmarked ? prevBookmarkCount - 1 : prevBookmarkCount + 1,
     };
     set({ reviews: optimisticReviews });

     try {
       const response = await bookmarksApi.toggleBookmark(reviewId);
       
       // Update with server response
       const updatedReviews = [...get().reviews];
       updatedReviews[reviewIndex] = {
         ...updatedReviews[reviewIndex],
         isBookmarkedByMe: response.data.isBookmarked,
         bookmarkCount: response.data.bookmarkCount,
       };
       set({ reviews: updatedReviews });
     } catch (error: any) {
       // Rollback on error
       const rollbackReviews = [...get().reviews];
       rollbackReviews[reviewIndex] = {
         ...rollbackReviews[reviewIndex],
         isBookmarkedByMe: prevIsBookmarked,
         bookmarkCount: prevBookmarkCount,
       };
       set({ 
         reviews: rollbackReviews,
         error: error.message || '북마크 처리에 실패했습니다',
       });
     }
   },
   ```

**Files**: `packages/frontend/src/stores/feedStore.ts`

**Parallel?**: No (depends on T055)

---

### Subtask T060 – Add loading, error, and hasMore state management

**Purpose**: Verify state management for UI feedback.

**Steps**:
1. Verify state shape in feedStore.ts:
   - `isLoading: boolean` - prevents concurrent API calls
   - `error: string | null` - displays error messages
   - `hasMore: boolean` - controls infinite scroll behavior
2. Test state transitions:
   ```typescript
   // Initial state
   { isLoading: false, error: null, hasMore: true }
   
   // During loadFeed
   { isLoading: true, error: null, hasMore: true }
   
   // After successful load
   { isLoading: false, error: null, hasMore: response.meta.hasMore }
   
   // After error
   { isLoading: false, error: 'Error message', hasMore: true }
   ```

**Files**: `packages/frontend/src/stores/feedStore.ts`

**Parallel?**: No (verification step)

**Validation**:
- Test loading state prevents concurrent calls
- Test error state displays message
- Test hasMore=false prevents loadMore

---

## Test Strategy

**Unit Tests**:
- feedStore actions (loadFeed, loadMore, toggleLike, toggleBookmark)
- Mock API clients with Vitest
- Test optimistic updates and rollbacks
- Test state transitions

**Integration Tests**:
- Test with real backend API
- Test pagination behavior
- Test error handling and recovery
- Test concurrent action prevention

**Browser Tests**:
- Test in React DevTools
- Verify Zustand state updates
- Test network failures and rollbacks

## Risks & Mitigations

**Risk 1: Race condition between loadFeed and loadMore**
- **Impact**: Duplicate data, incorrect pagination
- **Mitigation**: Use isLoading flag to prevent concurrent calls
- **Recovery**: Reset store and reload

**Risk 2: Stale data after optimistic update**
- **Impact**: UI shows incorrect state
- **Mitigation**: Implement rollback mechanism on error
- **Recovery**: Server response always overrides optimistic update

**Risk 3: Authentication token expiration**
- **Impact**: API calls fail with 401
- **Mitigation**: Axios interceptor catches 401, triggers login
- **Recovery**: Redirect to login page, preserve returnUrl

**Risk 4: Memory leak from store subscriptions**
- **Impact**: Performance degradation
- **Mitigation**: Zustand handles cleanup automatically
- **Recovery**: Verify no leaks in DevTools Memory profiler

## Definition of Done Checklist

- [ ] All subtasks T049-T060 completed and validated
- [ ] Zustand installed and configured
- [ ] TypeScript interfaces for Review and Book defined
- [ ] Axios API clients for reviews, likes, bookmarks created
- [ ] Feed store with reviews array, pagination state implemented
- [ ] loadFeed() action fetches initial feed
- [ ] loadMore() action fetches next page
- [ ] toggleLike() action with optimistic update and rollback
- [ ] toggleBookmark() action with optimistic update and rollback
- [ ] Loading, error, and hasMore state management working
- [ ] Axios interceptors for auth token configured
- [ ] isLoading flag prevents concurrent calls
- [ ] Error handling with toast notifications (optional)
- [ ] TypeScript compilation passes: `pnpm --filter frontend type-check`

## Review Guidance

**Key Acceptance Checkpoints**:
1. **State Management**: Zustand store working correctly
2. **API Integration**: All API clients functional
3. **Optimistic Updates**: Like/bookmark toggles update UI immediately
4. **Error Handling**: Rollback on errors, clear error messages

**Reviewer Should Verify**:
- [ ] Test loadFeed() - populates reviews array
- [ ] Test loadMore() - appends to reviews array
- [ ] Test toggleLike() - optimistic update and rollback
- [ ] Test toggleBookmark() - optimistic update and rollback
- [ ] Test isLoading flag - prevents concurrent calls
- [ ] Test error handling - displays error messages
- [ ] Check browser DevTools - Zustand state updates correctly
- [ ] Run `pnpm --filter frontend type-check` - passes

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

Once WP05 is done, the following work packages can proceed in parallel:
- **WP06**: Frontend - Review Card Component (depends on WP05 types and store)
- **WP07**: Frontend - Infinite Scroll Component (depends on WP05 store)

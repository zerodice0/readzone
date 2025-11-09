---
work_package_id: 'WP10'
subtasks:
  - 'T102'
  - 'T103'
  - 'T104'
  - 'T105'
  - 'T106'
  - 'T107'
  - 'T108'
title: 'Frontend - Authentication Integration'
phase: 'Phase 2 - Frontend'
lane: 'for_review'
assignee: ''
agent: 'claude'
shell_pid: '50827'
history:
  - timestamp: '2025-11-08T17:52:47Z'
    lane: 'planned'
    agent: 'system'
    shell_pid: ''
    action: 'Prompt generated via /spec-kitty.tasks'
---

# Work Package Prompt: WP10 – Frontend - Authentication Integration

## Objectives & Success Criteria

**Goal**: Integrate authentication state for like/bookmark actions; show login prompt for unauthenticated users.

**Success Criteria**:

- [ ] AuthStore created or updated with isAuthenticated check
- [ ] isAuthenticated check in feedStore actions (toggleLike, toggleBookmark)
- [ ] Login prompt modal/toast for unauthenticated interactions
- [ ] ReviewCard like/bookmark buttons check auth state
- [ ] Redirect to login page with returnUrl on prompt accept
- [ ] ReturnUrl handling in login flow
- [ ] Conditional rendering for non-logged-in users (optional)
- [ ] Toast notifications for better UX

## Context & Constraints

**Related Documents**:

- Existing auth system (assumed to exist from WP01-002 context)
- Authentication API endpoints

**Constraints**:

- Must preserve existing auth system
- Non-breaking changes to feed functionality
- Graceful degradation for non-authenticated users

**Architectural Decisions**:

- AuthStore for global auth state
- Modal or toast for login prompts
- sessionStorage for returnUrl preservation

## Subtasks & Detailed Guidance

### Subtask T102 – Create or update authStore

**Implementation**:

```typescript
// packages/frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // Call login API
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });

        localStorage.setItem('auth_token', data.token);
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('auth_token');
      },

      checkAuth: () => {
        const token = localStorage.getItem('auth_token');
        set({ isAuthenticated: !!token });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Subtask T103 – Implement isAuthenticated check in feedStore

**Implementation**:

```typescript
// Update feedStore.ts
import { useAuthStore } from './authStore';

toggleLike: async (reviewId: string) => {
  // Check authentication
  if (!useAuthStore.getState().isAuthenticated) {
    // Show login prompt (T104)
    return;
  }

  // Existing logic...
},

toggleBookmark: async (reviewId: string) => {
  // Check authentication
  if (!useAuthStore.getState().isAuthenticated) {
    // Show login prompt (T104)
    return;
  }

  // Existing logic...
},
```

### Subtask T104 – Create login prompt modal

**Implementation**:

```typescript
// packages/frontend/src/components/LoginPrompt.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginPrompt({ isOpen, onClose, message }: LoginPromptProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Store current URL for return after login
    sessionStorage.setItem('returnUrl', window.location.pathname);
    navigate('/login');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인이 필요합니다</DialogTitle>
          <DialogDescription>
            {message || '이 기능을 사용하려면 로그인이 필요합니다.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleLogin}>
            로그인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Add shadcn/ui dialog:

```bash
npx shadcn-ui@latest add dialog
```

Update feedStore to use login prompt:

```typescript
import { useLoginPromptStore } from './loginPromptStore';

toggleLike: async (reviewId: string) => {
  if (!useAuthStore.getState().isAuthenticated) {
    useLoginPromptStore.getState().show('좋아요를 누르려면 로그인이 필요합니다');
    return;
  }
  // ...
},
```

### Subtask T105 – Update ReviewCard buttons

**Implementation**:

```typescript
// In ReviewCard.tsx
import { useAuthStore } from '../../stores/authStore';

export function ReviewCard({ review }: ReviewCardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      // Show login prompt
      return;
    }

    toggleLike(review.id);
  };

  // Similar for handleBookmark
}
```

### Subtask T106 – Redirect to login with returnUrl

**Implementation**:

```typescript
// In login page
useEffect(() => {
  const returnUrl = sessionStorage.getItem('returnUrl');
  if (returnUrl && isAuthenticated) {
    sessionStorage.removeItem('returnUrl');
    navigate(returnUrl);
  }
}, [isAuthenticated, navigate]);
```

### Subtask T107 – Implement returnUrl handling

**Implementation verified in T106**

### Subtask T108 – Conditional rendering (optional)

**Implementation**:

```typescript
// Option 1: Hide buttons for non-authenticated users
{isAuthenticated && (
  <Button onClick={handleLike}>
    <Heart />
  </Button>
)}

// Option 2: Show but disable (better UX - shows features exist)
<Button
  onClick={handleLike}
  disabled={!isAuthenticated}
  title={!isAuthenticated ? '로그인이 필요합니다' : undefined}
>
  <Heart />
</Button>
```

## Definition of Done Checklist

- [ ] All subtasks T102-T108 completed
- [ ] AuthStore created/updated
- [ ] isAuthenticated check in feedStore
- [ ] Login prompt modal created
- [ ] ReviewCard buttons check auth
- [ ] Redirect to login with returnUrl
- [ ] ReturnUrl handling works
- [ ] Toast notifications implemented (optional)
- [ ] TypeScript compilation passes

## Review Guidance

**Reviewer Should Verify**:

- [ ] Log out, click like button - login prompt shows
- [ ] Click login in prompt - redirects to login with returnUrl
- [ ] Log in - redirects back to original page
- [ ] Like button works after login
- [ ] Bookmark button works after login

## Activity Log

- 2025-11-08T17:52:47Z – system – lane=planned – Prompt created.

---

### Next Steps After Completion

- **WP11**: Polish & Performance (final optimization)
- 2025-11-09T01:49:05Z – claude – shell_pid=50827 – lane=doing – Started implementation
- 2025-11-09T01:55:32Z – claude – shell_pid=50827 – lane=for_review – Completed implementation - ready for review

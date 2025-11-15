# ReadZone UI Design System

**Date:** 2025-01-15
**Status:** In Progress
**Design Direction:** Modern Book Platform (Warm & Inviting)

## Design Philosophy

ReadZone aims to create a warm, inviting reading environment that:
- Showcases book covers prominently
- Ensures excellent text readability for long reviews
- Provides a comfortable, library-like atmosphere
- Balances modern web design with traditional book aesthetics

## Color System

### Primary Palette (Warm Amber/Orange)

Inspired by reading lights and cozy libraries, our primary color evokes warmth and focus.

```css
--primary-50: #fffbeb   /* Very light cream - backgrounds */
--primary-100: #fef3c7  /* Light beige - hover states */
--primary-200: #fde68a  /* Soft yellow - subtle accents */
--primary-300: #fcd34d  /* Warm gold - borders */
--primary-400: #fbbf24  /* Amber - secondary actions */
--primary-500: #f59e0b  /* Main orange - primary actions, links */
--primary-600: #d97706  /* Deep orange - hover on primary */
--primary-700: #b45309  /* Dark amber - pressed states */
```

### Background Colors (Warm Neutral)

Creating a paper-like reading environment:

```css
--background: #fafaf9      /* Main background (warm off-white) */
--surface: #ffffff         /* Card backgrounds (pure white) */
--surface-dim: #f5f5f4    /* Subtle separators */
```

### Text Colors (Dark Brown Scale)

Softer than pure black for reduced eye strain:

```css
--text-primary: #1c1917    /* Headings, body text (dark brown) */
--text-secondary: #57534e  /* Subheadings (medium gray) */
--text-tertiary: #a8a29e   /* Meta information (light gray) */
```

### Semantic Colors

```css
--success: #10b981   /* Green for positive actions */
--warning: #f59e0b   /* Amber for warnings (reuse primary) */
--error: #ef4444     /* Red for errors */
--info: #3b82f6      /* Blue for informational */
```

## Typography

### Font Families

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

--font-serif: 'Georgia', 'Cambria', 'Times New Roman', serif;
--font-mono: 'Consolas', 'Monaco', 'Courier New', monospace;
```

### Scale

```css
--text-xs: 0.75rem     /* 12px - small labels */
--text-sm: 0.875rem    /* 14px - secondary text */
--text-base: 1rem      /* 16px - body text */
--text-lg: 1.125rem    /* 18px - large body */
--text-xl: 1.25rem     /* 20px - h4 */
--text-2xl: 1.5rem     /* 24px - h3 */
--text-3xl: 1.875rem   /* 30px - h2 */
--text-4xl: 2.25rem    /* 36px - h1 */
```

### Usage

- **Headings:** Sans-serif, bold
- **Body text:** Sans-serif, regular
- **Book titles:** Serif for elegance
- **Code/IDs:** Monospace

## Spacing System

Using 4px base unit (Tailwind default):

```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
```

**Common patterns:**
- Card padding: 24px (p-6)
- Section gaps: 32px (gap-8)
- Container max-width: 1280px (max-w-7xl)
- Content max-width: 768px (max-w-3xl)

## Component Specifications

### ReviewCard

**Layout:**
- White card on warm background
- Book cover: 80x112px (mobile), 96x128px (desktop)
- Border radius: 12px
- Shadow: subtle (shadow-md)
- Padding: 24px
- Hover: lift effect (scale-102, shadow-lg)

**Content hierarchy:**
1. Book cover (left, visual anchor)
2. Book title (serif, text-xl, bold)
3. Author name (text-sm, secondary)
4. Review excerpt (line-clamp-3)
5. Meta info (rating, recommend badge)
6. Actions (like, bookmark, share)

**Interactive states:**
- Hover: scale + shadow increase
- Focus: 2px primary ring
- Active like: red fill
- Active bookmark: blue fill

### FeedPage Layout

```
┌─────────────────────────────────────┐
│  Header (sticky)                    │
│  "독후감 피드" + Actions             │
├─────────────────────────────────────┤
│  Main Content (max-w-3xl, centered) │
│  ┌──────────────────────────────┐  │
│  │  ReviewCard                   │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  ReviewCard                   │  │
│  └──────────────────────────────┘  │
│  ...                                │
│  [ Load More Button ]               │
└─────────────────────────────────────┘
```

### ReviewDetailPage Layout

```
┌─────────────────────────────────────┐
│  Back button                        │
├─────────────────────────────────────┤
│  Author info (avatar + date)        │
├─────────────────────────────────────┤
│  Book info card (horizontal)        │
│  ┌────┐                             │
│  │img │ Title, Author, Rating       │
│  └────┘                             │
├─────────────────────────────────────┤
│  Review content (prose styling)     │
│  - Max width: 65ch                  │
│  - Line height: 1.7                 │
│  - Serif font option for readability│
├─────────────────────────────────────┤
│  Actions (like, bookmark, share)    │
└─────────────────────────────────────┘
```

## Required shadcn/ui Components

Currently installed:
- ✅ button
- ✅ card
- ✅ dialog
- ✅ skeleton

Need to add:
- [ ] badge (for status, tags)
- [ ] avatar (for user profiles)
- [ ] separator (for visual division)
- [ ] scroll-area (for long content)
- [ ] toast (for notifications - replace alerts)

## Implementation Plan

### Phase 1: Foundation (30min)
1. Update `index.css` with new color variables
2. Update `tailwind.config.js` with warm palette
3. Test light/dark mode compatibility

### Phase 2: Component Library (1h)
1. Install missing shadcn/ui components
2. Create custom components:
   - `BookCover` - image with fallback
   - `ReviewMeta` - rating + recommend badge
   - `UserAvatar` - consistent user display

### Phase 3: Page Styling (2-3h)
1. **FeedPage**
   - Update ReviewCard with new design
   - Improve spacing and layout
   - Add empty state design

2. **ReviewDetailPage**
   - Book info card redesign
   - Prose styling for review content
   - Better action buttons layout

3. **DashboardPage**
   - Stats cards with icons
   - Quick actions grid
   - Recent activity timeline

4. **ProfilePage**
   - Header with gradient
   - Info cards layout
   - Settings sections

### Phase 4: Polish (1h)
1. Loading states (skeletons)
2. Error states
3. Empty states
4. Animations and transitions
5. Mobile responsiveness check

## Success Criteria

- [ ] All pages follow consistent color system
- [ ] Typography hierarchy is clear
- [ ] Interactive elements have proper states
- [ ] Mobile responsive (320px - 1920px)
- [ ] Accessibility maintained (WCAG 2.1 AA)
- [ ] Dark mode works (optional)
- [ ] Performance not degraded

## Design Decisions Log

**2025-01-15:**
- Chose warm amber/orange as primary color (reading light metaphor)
- Warm off-white background instead of pure white (reduced eye strain)
- Dark brown text instead of pure black (softer, more book-like)
- Card-based layouts for content organization
- Serif fonts for book titles (traditional book aesthetics)

## References

- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Color inspiration: Goodreads, Literal.club
- Layout inspiration: Medium, Substack

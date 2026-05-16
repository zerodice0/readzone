# Custom Clerk Auth Loop Report

Status: APPROVE
Timestamp: 2026-05-16T02:06:46Z
Rounds: 5

## Input

- Replace exposed Clerk prebuilt UI with first-party custom UI connected to Clerk.
- Review whether the custom flow has security issues.
- Remove orphan legacy JWT/API auth code.
- Run an unlimited review loop with both a critical reviewer and a security reviewer.

## Implementation Summary

- Added custom Clerk-connected sign-in and sign-up pages:
  - `packages/frontend/src/features/auth/pages/SignInPage.tsx`
  - `packages/frontend/src/features/auth/pages/SignUpPage.tsx`
- Replaced prebuilt Clerk UI usage in routing, header, dashboard account profile, and protected route handling.
- Added custom auth behavior:
  - relative-only `redirect_url` handling to avoid open redirects
  - password sign-in
  - TOTP and backup-code second-factor sign-in
  - email-code sign-up verification
  - password reset with generic request response to avoid account enumeration
  - signed-in-user redirect away from auth pages
- Added custom account security controls in dashboard:
  - profile update through Clerk user resource
  - MFA/TOTP status
  - TOTP setup and verification
  - backup-code display only after successful TOTP verification
  - explicit confirmation before disabling TOTP
  - active session listing and non-current session revocation
- Hardened email verification banner:
  - sends Clerk email-code verification
  - only hides after returned verification status is `verified`
- Removed orphan legacy JWT/API auth files:
  - `packages/frontend/src/components/ProtectedRoute.tsx`
  - `packages/frontend/src/features/auth/pages/ForgotPasswordPage.tsx`
  - `packages/frontend/src/features/auth/pages/ResetPasswordPage.tsx`
  - `packages/frontend/src/features/user/components/EditProfileForm.tsx`
  - `packages/frontend/src/features/user/pages/ProfilePage.tsx`
  - `packages/frontend/src/lib/api-client.ts`
  - `packages/frontend/src/lib/auth-context.tsx`
  - `packages/frontend/src/services/api/bookmarks.ts`
  - `packages/frontend/src/services/api/likes.ts`
  - `packages/frontend/src/services/api/reviews.ts`
  - `packages/frontend/src/stores/feedStore.ts`

## Verification Evidence

- `pnpm --filter @geuldarak/frontend lint`: pass
- `pnpm --filter @geuldarak/frontend type-check`: pass
- `pnpm --filter @geuldarak/frontend build`: pass
  - Vite still reports existing large chunk warnings for `index` and `DashboardPage`.
- `git diff --check`: pass
- Prebuilt/legacy auth search:
  - `UserButton`, `UserProfile`, `RedirectToSignIn`, Clerk prebuilt JSX, legacy auth token storage, legacy auth context/API client, `dangerouslySetInnerHTML`, and console logging were searched in the changed auth surfaces.
  - Remaining matches were only custom component/type names: `SignInPage`, `SignUpPage`, `SignInStep`, `SignUpStep`.
- Legacy deleted-file reference search across `packages/frontend/src`: no remaining matches.

## Review Results

Critical reviewer:

- Round 5 verdict: APPROVE
- Blocking findings: none
- Remaining non-blocking note: replacing `window.confirm` with the app dialog later would improve design/accessibility consistency.

Security reviewer:

- Round 5 verdict: APPROVE
- Critical/high/medium/low findings: 0
- Confirmed no release-blocking issue in account enumeration, unsafe redirect, token storage, XSS, legacy JWT/API auth, Clerk prebuilt UI exposure, MFA, or session management scope.

## Manual QA Checklist

- Sign up with email/password and complete email-code verification.
- Sign in with password.
- Try sign-in with an incorrect password and confirm the error is generic enough.
- Start password reset for both existing and non-existing email addresses and confirm the request response is indistinguishable.
- Complete password reset with a valid email code.
- Enable TOTP, verify with an authenticator code, and confirm backup codes only show after activation.
- Sign in with TOTP and backup code when second factor is required.
- Disable TOTP and confirm the confirmation prompt appears before disabling.
- Open account tab from multiple sessions and revoke a non-current session.
- Confirm protected routes redirect to `/sign-in` and return only to same-origin relative paths.

## Open Items

- If Clerk social/OAuth/passkey strategies are enabled in the Clerk dashboard, the current custom UI intentionally does not expose them. Product should confirm whether those strategies should remain disabled or be added to the custom UI.
- The existing Vite chunk-size warning remains out of scope for this auth change.
- Worktree includes unrelated pre-existing changes outside this task, including `packages/backend/convex/aladin.ts`, review/book-detail files, and `packages/frontend/src/utils/html.ts`.

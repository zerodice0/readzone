/**
 * Clerk Authentication Configuration for Convex
 *
 * This file configures Clerk as the authentication provider for Convex.
 * Clerk handles:
 * - User authentication (email/password, OAuth)
 * - Session management
 * - Multi-factor authentication (MFA)
 * - User profile management
 *
 * CLERK_ISSUER_DOMAIN is set in Convex Dashboard → Settings → Environment Variables
 */

export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
};

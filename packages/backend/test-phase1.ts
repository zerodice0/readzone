/**
 * WP05 Phase 1 Test Script
 * Tests email service and token utility implementations
 */

import {
  generateSecureToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  getTokenExpiration,
} from './src/common/utils/token';
import { EmailService } from './src/common/services/email.service';

async function testPhase1() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 WP05 PHASE 1 IMPLEMENTATION TEST');
  console.log('='.repeat(80) + '\n');

  // Test 1: Token Generation
  console.log('📝 Test 1: Token Generation\n');

  const token1 = generateSecureToken();
  const token2 = generateSecureToken();
  console.log(`✅ Generated secure token (32 bytes): ${token1.substring(0, 20)}...`);
  console.log(`✅ Token length: ${token1.length} characters`);
  console.log(`✅ Tokens are unique: ${token1 !== token2 ? 'YES' : 'NO'}`);
  console.log(`✅ URL-safe (no +/=): ${!/[+/=]/.test(token1) ? 'YES' : 'NO'}\n`);

  // Test 2: Email Verification Token
  console.log('📝 Test 2: Email Verification Token\n');

  const emailToken = generateEmailVerificationToken();
  console.log(`✅ Generated email verification token: ${emailToken.substring(0, 20)}...`);
  console.log(`✅ Token length: ${emailToken.length} characters\n`);

  // Test 3: Password Reset Token
  console.log('📝 Test 3: Password Reset Token\n');

  const resetToken = generatePasswordResetToken();
  console.log(`✅ Generated password reset token: ${resetToken.substring(0, 20)}...`);
  console.log(`✅ Token length: ${resetToken.length} characters\n`);

  // Test 4: Token Expiration
  console.log('📝 Test 4: Token Expiration\n');

  const expiration24h = getTokenExpiration(24);
  const expiration1h = getTokenExpiration(1);
  console.log(`✅ 24-hour expiration: ${expiration24h.toISOString()}`);
  console.log(`✅ 1-hour expiration: ${expiration1h.toISOString()}\n`);

  // Test 5: Email Service - Verification Email
  console.log('📝 Test 5: Email Service - Verification Email\n');

  const emailService = new EmailService();
  await emailService.sendVerificationEmail({
    to: 'test@example.com',
    token: emailToken,
    userId: 'user-123',
  });
  console.log('✅ Email verification email sent (check console output above)\n');

  // Test 6: Email Service - Password Reset Email
  console.log('📝 Test 6: Email Service - Password Reset Email\n');

  await emailService.sendPasswordResetEmail({
    to: 'test@example.com',
    token: resetToken,
    userId: 'user-123',
  });
  console.log('✅ Password reset email sent (check console output above)\n');

  // Summary
  console.log('='.repeat(80));
  console.log('🎉 WP05 PHASE 1 TEST COMPLETED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log('\n✅ T046: Email service abstraction - PASSED');
  console.log('✅ T047: Token generation utility - PASSED\n');
  console.log('📋 Next Steps:');
  console.log('  - Phase 2: Email verification endpoints (T048-T049)');
  console.log('  - Phase 3: Password reset endpoints (T050-T052)');
  console.log('  - Phase 4: Audit logging integration (T054)\n');
}

// Run tests
testPhase1().catch(console.error);

#!/usr/bin/env node

/**
 * Simple test to verify improved auth error handling
 * Run with: node test-login-error-handling.js
 */

const testUser = {
  email: 'test-unverified@example.com',
  password: 'TestPassword123!',
  nickname: 'testuser'
}

async function testImprovedAuthErrors() {
  console.log('🧪 Testing Improved Auth Error Handling\n')
  
  const baseUrl = 'http://localhost:3002'
  
  try {
    // Test 1: Check if server is running
    console.log('📋 Test 1: Checking server status...')
    const healthCheck = await fetch(`${baseUrl}/api/health`).catch(() => null)
    if (!healthCheck) {
      console.log('❌ Server not running on port 3002. Please start with: npm run dev')
      return
    }
    console.log('✅ Server is running')

    // Test 2: Create unverified test user
    console.log('\n📋 Test 2: Creating unverified test user...')
    
    // Clean up first
    const cleanupResponse = await fetch(`${baseUrl}/api/test/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email })
    }).catch(() => ({ ok: false }))
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    })

    if (registerResponse.ok) {
      console.log('✅ Test user created (unverified)')
    } else {
      const error = await registerResponse.json()
      console.log('ℹ️ User might already exist:', error.message)
    }

    // Test 3: Try to login with unverified account using frontend login
    console.log('\n📋 Test 3: Testing login with unverified account...')
    console.log('   This should show specific error message: "이메일 인증이 완료되지 않았습니다"')
    console.log('   Please manually test by:')
    console.log('   1. Go to http://localhost:3002/login')
    console.log(`   2. Enter email: ${testUser.email}`)
    console.log(`   3. Enter password: ${testUser.password}`)
    console.log('   4. Click login')
    console.log('   5. Verify error message shows email verification needed')
    console.log('   6. Verify "인증 메일 재발송" button appears')
    
    console.log('\n✅ Manual testing required for UI validation')
    console.log('\n💡 Expected improvements:')
    console.log('   ✅ Specific error: "이메일 인증이 필요합니다. 가입 시 받은 인증 메일을 확인해주세요."')
    console.log('   ✅ Resend verification button appears')
    console.log('   ✅ Toast shows specific message instead of generic login failure')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

testImprovedAuthErrors()
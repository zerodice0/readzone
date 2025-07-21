import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with login/register options', async ({ page }) => {
    // Check if we can access the app
    await expect(page).toHaveTitle(/ReadZone/);
    
    // Check for navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Navigate to login page
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check page title
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('should navigate to register page', async ({ page }) => {
    // Navigate to register page
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');
    
    // Check register form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="displayName"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check page title
    await expect(page.locator('h1')).toContainText('회원가입');
  });

  test('should show validation errors on login form', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
    await expect(page.locator('text=비밀번호를 입력해주세요')).toBeVisible();
  });

  test('should show validation errors on register form', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=이메일을 입력해주세요')).toBeVisible();
    await expect(page.locator('text=사용자명을 입력해주세요')).toBeVisible();
    await expect(page.locator('text=닉네임을 입력해주세요')).toBeVisible();
    await expect(page.locator('text=비밀번호를 입력해주세요')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    // Check for email validation error
    await expect(page.locator('text=올바른 이메일 형식을 입력해주세요')).toBeVisible();
  });

  test('should validate password confirmation on register', async ({ page }) => {
    await page.goto('/register');
    
    // Fill form with mismatched passwords
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password456');
    
    await page.click('button[type="submit"]');
    
    // Check for password mismatch error
    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible();
  });

  test('should handle login attempt with mock server error', async ({ page }) => {
    // Mock API response
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: '이메일 또는 비밀번호가 올바르지 않습니다.'
          }
        })
      });
    });

    await page.goto('/login');
    
    // Fill and submit login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    await expect(page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    // Start at login page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    // Go to register
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');
    await expect(page.locator('h1')).toContainText('회원가입');
    
    // Go back to login
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/auth/login', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com' },
            token: 'mock-token'
          }
        })
      });
    });

    await page.goto('/login');
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check loading state
    await expect(submitButton).toBeDisabled();
    await expect(page.locator('text=로그인 중')).toBeVisible();
  });
});
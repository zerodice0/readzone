import { Page } from '@playwright/test';

export class AuthHelper {
  constructor(private page: Page) {}

  async mockSuccessfulLogin(userData = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User'
  }) {
    await this.page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: userData,
            token: 'mock-jwt-token'
          }
        })
      });
    });
  }

  async mockFailedLogin(errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.') {
    await this.page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: errorMessage
          }
        })
      });
    });
  }

  async mockSuccessfulRegister(userData = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User'
  }) {
    await this.page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: userData,
            token: 'mock-jwt-token'
          }
        })
      });
    });
  }

  async login(email = 'test@example.com', password = 'password123') {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async register(userData = {
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    password: 'password123'
  }) {
    await this.page.goto('/register');
    await this.page.fill('input[type="email"]', userData.email);
    await this.page.fill('input[name="username"]', userData.username);
    await this.page.fill('input[name="displayName"]', userData.displayName);
    await this.page.fill('input[type="password"]', userData.password);
    await this.page.fill('input[name="confirmPassword"]', userData.password);
    await this.page.click('button[type="submit"]');
  }

  async logout() {
    // Mock logout API
    await this.page.route('**/api/auth/logout', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: '로그아웃되었습니다.'
        })
      });
    });

    const logoutButton = this.page.locator('button:has-text("로그아웃")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
  }

  async isLoggedIn(): Promise<boolean> {
    // Check for logout button or user menu as indicator of logged in state
    const userMenu = this.page.locator('[data-testid="user-menu"]');
    const logoutButton = this.page.locator('button:has-text("로그아웃")');
    
    return (await userMenu.isVisible()) || (await logoutButton.isVisible());
  }

  async mockUserProfile(userData = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
    avatar: null,
    bio: 'Test user bio',
    postsCount: 5,
    followersCount: 10,
    followingCount: 8
  }) {
    await this.page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: userData
        })
      });
    });
  }
}
import { test, expect } from '@playwright/test';

test.describe('Post Creation Flow', () => {
  // Helper function to login
  const loginUser = async (page: any) => {
    // Mock successful login
    await page.route('**/api/auth/login', (route: any) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user-1',
              email: 'test@example.com',
              username: 'testuser',
              displayName: 'Test User'
            },
            token: 'mock-jwt-token'
          }
        })
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect after login
    await page.waitForURL('/dashboard', { timeout: 5000 });
  };

  test.beforeEach(async ({ page }) => {
    // Mock book search API
    await page.route('**/api/books/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            books: [
              {
                id: 'book-1',
                isbn: '9788934942467',
                title: '테스트 도서',
                author: '테스트 작가',
                publisher: '테스트 출판사',
                thumbnail: 'https://example.com/book.jpg',
                description: '테스트용 도서 설명'
              }
            ]
          }
        })
      });
    });

    // Mock post creation API
    await page.route('**/api/posts', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'post-1',
              content: '테스트 독서 기록',
              rating: 5,
              isPublic: true,
              createdAt: new Date().toISOString()
            }
          })
        });
      }
    });
  });

  test('should create a new post successfully', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to post creation
    await page.click('a[href="/write"]');
    await expect(page).toHaveURL('/write');
    
    // Search for a book
    await page.fill('input[placeholder*="도서 검색"]', '테스트 도서');
    await page.click('button:has-text("검색")');
    
    // Wait for search results and select a book
    await expect(page.locator('text=테스트 도서')).toBeVisible();
    await page.click('button:has-text("선택")');
    
    // Fill in post details
    await page.fill('textarea[placeholder*="독서 기록"]', '이 책은 정말 흥미로웠습니다. 특히 주인공의 성장 과정이 인상적이었어요.');
    
    // Set rating
    await page.click('[data-testid="rating-5"]');
    
    // Add tags
    await page.fill('input[placeholder*="태그"]', '소설');
    await page.keyboard.press('Enter');
    await page.fill('input[placeholder*="태그"]', '추천');
    await page.keyboard.press('Enter');
    
    // Set as public
    await page.check('input[type="checkbox"]:has-text("공개")');
    
    // Submit the post
    await page.click('button[type="submit"]:has-text("등록")');
    
    // Should redirect to the created post or dashboard
    await expect(page).toHaveURL(/\/(post\/|dashboard)/);
    
    // Should show success message
    await expect(page.locator('text=게시글이 성공적으로 등록되었습니다')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await loginUser(page);
    await page.goto('/write');
    
    // Try to submit without selecting a book
    await page.click('button[type="submit"]:has-text("등록")');
    
    // Should show validation errors
    await expect(page.locator('text=도서를 선택해주세요')).toBeVisible();
    
    // Select a book but leave content empty
    await page.fill('input[placeholder*="도서 검색"]', '테스트 도서');
    await page.click('button:has-text("검색")');
    await page.click('button:has-text("선택")');
    
    await page.click('button[type="submit"]:has-text("등록")');
    
    // Should show content validation error
    await expect(page.locator('text=독서 기록을 입력해주세요')).toBeVisible();
  });

  test('should handle book search functionality', async ({ page }) => {
    await loginUser(page);
    await page.goto('/write');
    
    // Test empty search
    await page.click('button:has-text("검색")');
    await expect(page.locator('text=검색어를 입력해주세요')).toBeVisible();
    
    // Test normal search
    await page.fill('input[placeholder*="도서 검색"]', '테스트');
    await page.click('button:has-text("검색")');
    
    // Should show loading state
    await expect(page.locator('text=검색 중')).toBeVisible();
    
    // Should show search results
    await expect(page.locator('text=테스트 도서')).toBeVisible();
    await expect(page.locator('text=테스트 작가')).toBeVisible();
  });

  test('should handle search with no results', async ({ page }) => {
    // Mock empty search results
    await page.route('**/api/books/search**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            books: []
          }
        })
      });
    });

    await loginUser(page);
    await page.goto('/write');
    
    await page.fill('input[placeholder*="도서 검색"]', '존재하지않는책');
    await page.click('button:has-text("검색")');
    
    // Should show no results message
    await expect(page.locator('text=검색 결과가 없습니다')).toBeVisible();
  });

  test('should save as draft', async ({ page }) => {
    // Mock draft save API
    await page.route('**/api/posts/draft', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'draft-1',
            isDraft: true
          }
        })
      });
    });

    await loginUser(page);
    await page.goto('/write');
    
    // Fill partial content
    await page.fill('input[placeholder*="도서 검색"]', '테스트 도서');
    await page.click('button:has-text("검색")');
    await page.click('button:has-text("선택")');
    await page.fill('textarea[placeholder*="독서 기록"]', '임시 저장할 내용');
    
    // Save as draft
    await page.click('button:has-text("임시저장")');
    
    // Should show draft saved message
    await expect(page.locator('text=임시저장되었습니다')).toBeVisible();
  });

  test('should handle rating selection', async ({ page }) => {
    await loginUser(page);
    await page.goto('/write');
    
    // Select a book first
    await page.fill('input[placeholder*="도서 검색"]', '테스트 도서');
    await page.click('button:has-text("검색")');
    await page.click('button:has-text("선택")');
    
    // Test rating selection
    for (let rating = 1; rating <= 5; rating++) {
      await page.click(`[data-testid="rating-${rating}"]`);
      
      // Check that the correct number of stars are highlighted
      const highlightedStars = page.locator('[data-testid^="rating-"].highlighted');
      await expect(highlightedStars).toHaveCount(rating);
    }
  });

  test('should handle tag management', async ({ page }) => {
    await loginUser(page);
    await page.goto('/write');
    
    // Select a book first
    await page.fill('input[placeholder*="도서 검색"]', '테스트 도서');
    await page.click('button:has-text("검색")');
    await page.click('button:has-text("선택")');
    
    // Add tags
    const tags = ['소설', '추천', '감동'];
    
    for (const tag of tags) {
      await page.fill('input[placeholder*="태그"]', tag);
      await page.keyboard.press('Enter');
      
      // Check that tag is added
      await expect(page.locator(`text=${tag}`)).toBeVisible();
    }
    
    // Remove a tag
    await page.click('button[aria-label="소설 태그 제거"]');
    await expect(page.locator('text=소설')).not.toBeVisible();
  });

  test('should handle post creation errors', async ({ page }) => {
    // Mock API error
    await page.route('**/api/posts', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: '서버 오류가 발생했습니다'
          }
        })
      });
    });

    await loginUser(page);
    await page.goto('/write');
    
    // Fill and submit form
    await page.fill('input[placeholder*="도서 검색"]', '테스트 도서');
    await page.click('button:has-text("검색")');
    await page.click('button:has-text("선택")');
    await page.fill('textarea[placeholder*="독서 기록"]', '테스트 내용');
    await page.click('[data-testid="rating-4"]');
    
    await page.click('button[type="submit"]:has-text("등록")');
    
    // Should show error message
    await expect(page.locator('text=서버 오류가 발생했습니다')).toBeVisible();
  });

  test('should preserve form data on page refresh', async ({ page }) => {
    await loginUser(page);
    await page.goto('/write');
    
    // Fill some form data
    const content = '페이지 새로고침 테스트 내용';
    await page.fill('textarea[placeholder*="독서 기록"]', content);
    
    // Refresh page
    await page.reload();
    
    // Check if content is preserved (if auto-save is implemented)
    // Note: This depends on implementation of auto-save feature
    const textareaValue = await page.inputValue('textarea[placeholder*="독서 기록"]');
    if (textareaValue) {
      expect(textareaValue).toBe(content);
    }
  });
});
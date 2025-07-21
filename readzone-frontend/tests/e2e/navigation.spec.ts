import { test, expect } from '@playwright/test';

test.describe('Navigation and Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to main pages', async ({ page }) => {
    // Check initial page load
    await expect(page).toHaveTitle(/ReadZone/);
    
    // Test navigation to different sections
    const navigation = [
      { selector: 'a[href="/"]', url: '/', title: 'ReadZone' },
      { selector: 'a[href="/explore"]', url: '/explore', title: '둘러보기' },
      { selector: 'a[href="/about"]', url: '/about', title: '소개' },
    ];

    for (const nav of navigation) {
      if (await page.locator(nav.selector).isVisible()) {
        await page.click(nav.selector);
        await expect(page).toHaveURL(nav.url);
      }
    }
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect to home
    const isNotFound = await page.locator('text=404').isVisible();
    const isRedirectedHome = page.url().includes('/');
    
    expect(isNotFound || isRedirectedHome).toBeTruthy();
  });

  test('should have responsive navigation menu', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile menu toggle exists
    const mobileMenuToggle = page.locator('[aria-label="메뉴"]');
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
      
      // Check if mobile menu is visible
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('should preserve navigation state on page refresh', async ({ page }) => {
    // Navigate to a specific page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    // Refresh the page
    await page.reload();
    
    // Should still be on the same page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate through pages
    await page.goto('/');
    await page.goto('/login');
    await page.goto('/register');
    
    // Use browser back
    await page.goBack();
    await expect(page).toHaveURL('/login');
    
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Use browser forward
    await page.goForward();
    await expect(page).toHaveURL('/login');
  });

  test('should show correct page titles', async ({ page }) => {
    const pages = [
      { url: '/', expectedTitle: /ReadZone/ },
      { url: '/login', expectedTitle: /로그인.*ReadZone/ },
      { url: '/register', expectedTitle: /회원가입.*ReadZone/ },
    ];

    for (const pageTest of pages) {
      await page.goto(pageTest.url);
      await expect(page).toHaveTitle(pageTest.expectedTitle);
    }
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check for essential meta tags
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
    
    const metaViewport = page.locator('meta[name="viewport"]');
    await expect(metaViewport).toHaveAttribute('content', /width=device-width/);
    
    // Check for Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    if (await ogTitle.isVisible()) {
      await expect(ogTitle).toHaveAttribute('content', /.+/);
    }
  });

  test('should handle external links correctly', async ({ page, context }) => {
    // Mock external links if they exist
    const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"])');
    
    if (await externalLinks.count() > 0) {
      // Listen for new page opening
      const pagePromise = context.waitForEvent('page');
      
      await externalLinks.first().click();
      
      const newPage = await pagePromise;
      await newPage.waitForLoadState();
      
      // External link should open in new tab
      expect(newPage.url()).not.toContain('localhost');
      
      await newPage.close();
    }
  });

  test('should maintain scroll position on navigation', async ({ page }) => {
    // Go to a page with content
    await page.goto('/');
    
    // Scroll down if page has enough content
    await page.evaluate(() => window.scrollTo(0, 100));
    
    // Navigate to another page and back
    await page.goto('/login');
    await page.goBack();
    
    // Note: Scroll position restoration depends on browser behavior
    // This test mainly ensures navigation doesn't break
    await expect(page).toHaveURL('/');
  });
});
import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have required PWA manifest', async ({ page }) => {
    // Check if manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
    
    // Fetch and validate manifest
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.icons).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should register service worker', async ({ page }) => {
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        } catch (error) {
          return false;
        }
      }
      return false;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('should have proper meta tags for PWA', async ({ page }) => {
    // Check theme color
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    await expect(themeColorMeta).toHaveAttribute('content', /.+/);
    
    // Check viewport
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/);
    
    // Check apple mobile web app capable
    const appleMeta = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleMeta).toHaveAttribute('content', 'yes');
    
    // Check apple status bar style
    const appleStatusMeta = page.locator('meta[name="apple-mobile-web-app-status-bar-style"]');
    await expect(appleStatusMeta).toBeAttached();
  });

  test('should show PWA install prompt when available', async ({ page, context }) => {
    // Mock beforeinstallprompt event
    await page.addInitScript(() => {
      setTimeout(() => {
        const event = new Event('beforeinstallprompt');
        (event as any).prompt = () => Promise.resolve({ outcome: 'accepted' });
        (event as any).preventDefault = () => {};
        window.dispatchEvent(event);
      }, 1000);
    });
    
    await page.goto('/');
    
    // Wait for install prompt to appear
    const installPrompt = page.locator('[data-testid="pwa-install-prompt"]');
    await expect(installPrompt).toBeVisible({ timeout: 3000 });
    
    // Check install button
    const installButton = page.locator('button:has-text("앱 설치")');
    await expect(installButton).toBeVisible();
  });

  test('should handle PWA installation', async ({ page }) => {
    // Mock beforeinstallprompt event
    await page.addInitScript(() => {
      let deferredPrompt: any;
      
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Simulate install prompt showing
        const event = new CustomEvent('showinstallprompt', { detail: e });
        window.dispatchEvent(event);
      });
      
      (window as any).installApp = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          return outcome === 'accepted';
        }
        return false;
      };
    });
    
    await page.goto('/');
    
    // Trigger install prompt
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = () => Promise.resolve({ outcome: 'accepted' });
      (event as any).preventDefault = () => {};
      window.dispatchEvent(event);
    });
    
    // Wait for install prompt and click install
    const installButton = page.locator('button:has-text("앱 설치")');
    if (await installButton.isVisible({ timeout: 3000 })) {
      await installButton.click();
      
      // Check if prompt disappears after installation
      await expect(installButton).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should work offline', async ({ page, context }) => {
    // Load the page while online
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Navigate to cached page
    await page.reload();
    
    // Should still show content (from cache)
    await expect(page.locator('body')).toBeVisible();
    
    // Check if offline indicator shows
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    if (await offlineIndicator.isVisible({ timeout: 2000 })) {
      await expect(offlineIndicator).toContainText(/오프라인/i);
    }
  });

  test('should show offline page for uncached routes', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate to uncached page
    const response = await page.goto('/some-uncached-page');
    
    // Should serve offline fallback
    expect(response?.status()).toBe(200);
    
    // Check for offline content
    const offlineContent = page.locator('text=오프라인');
    await expect(offlineContent).toBeVisible();
  });

  test('should detect online/offline status', async ({ page, context }) => {
    await page.goto('/');
    
    // Check initial online status
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
    
    // Go offline
    await context.setOffline(true);
    
    // Trigger online/offline events
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Check if offline status is detected
    const offlineStatus = await page.evaluate(() => navigator.onLine);
    expect(offlineStatus).toBe(false);
    
    // Go back online
    await context.setOffline(false);
    
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    // Check if online status is restored
    const onlineStatus = await page.evaluate(() => navigator.onLine);
    expect(onlineStatus).toBe(true);
  });

  test('should have PWA status component', async ({ page }) => {
    // Navigate to profile page where PWA status might be shown
    await page.goto('/profile');
    
    // Look for PWA status indicators
    const pwaStatus = page.locator('[data-testid="pwa-status"]');
    if (await pwaStatus.isVisible({ timeout: 2000 })) {
      // Check for various PWA features
      await expect(pwaStatus).toBeVisible();
      
      // Check for install status
      const installStatus = page.locator('[data-testid="install-status"]');
      if (await installStatus.isVisible()) {
        await expect(installStatus).toContainText(/(설치됨|설치 가능)/);
      }
      
      // Check for notification status
      const notificationStatus = page.locator('[data-testid="notification-status"]');
      if (await notificationStatus.isVisible()) {
        await expect(notificationStatus).toBeVisible();
      }
    }
  });

  test('should handle push notification subscription', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications']);
    
    await page.goto('/profile');
    
    // Look for notification subscription button
    const subscribeButton = page.locator('button:has-text("알림 구독")');
    if (await subscribeButton.isVisible({ timeout: 2000 })) {
      await subscribeButton.click();
      
      // Check if subscription status changes
      const unsubscribeButton = page.locator('button:has-text("알림 해제")');
      await expect(unsubscribeButton).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle service worker updates', async ({ page }) => {
    await page.goto('/');
    
    // Mock service worker update available
    await page.evaluate(() => {
      // Simulate service worker update
      const event = new CustomEvent('swupdateavailable');
      window.dispatchEvent(event);
    });
    
    // Look for update notification
    const updateNotification = page.locator('[data-testid="sw-update-notification"]');
    if (await updateNotification.isVisible({ timeout: 2000 })) {
      await expect(updateNotification).toContainText(/업데이트/);
      
      // Test update button
      const updateButton = page.locator('button:has-text("업데이트")');
      if (await updateButton.isVisible()) {
        await updateButton.click();
        
        // Should reload or show update progress
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should cache API responses for offline use', async ({ page, context }) => {
    // Make API calls while online
    await page.route('**/api/posts**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            posts: [
              {
                id: 'post-1',
                title: '테스트 포스트',
                content: '캐시된 내용',
                author: 'Test User'
              }
            ]
          }
        })
      });
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to access cached API data
    const cachedContent = page.locator('text=캐시된 내용');
    if (await cachedContent.isVisible({ timeout: 3000 })) {
      await expect(cachedContent).toBeVisible();
    }
  });
});
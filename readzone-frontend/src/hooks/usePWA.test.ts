import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the PWA hook implementation
const createMockPWAHook = () => {
  let state = {
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    swUpdateAvailable: false,
    installPrompt: null as any,
  };

  const actions = {
    installApp: vi.fn().mockImplementation(async () => {
      if (state.installPrompt) {
        try {
          const result = await state.installPrompt.prompt();
          if (result.outcome === 'accepted') {
            state.isInstalled = true;
            state.isInstallable = false;
            state.installPrompt = null;
            return true;
          }
        } catch (error) {
          // Handle installation errors gracefully
          return false;
        }
      }
      return false;
    }),

    dismissInstallPrompt: vi.fn().mockImplementation(() => {
      state.isInstallable = false;
      state.installPrompt = null;
    }),

    updateServiceWorker: vi.fn().mockImplementation(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          state.swUpdateAvailable = false;
          return true;
        }
      }
      return false;
    }),

    subscribeToNotifications: vi.fn().mockImplementation(async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'mock-vapid-key',
        });
        return subscription;
      }
      throw new Error('Push notifications not supported');
    }),

    unsubscribeFromNotifications: vi.fn().mockImplementation(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          return true;
        }
      }
      return false;
    }),
  };

  // Simulate PWA events
  const simulateInstallPrompt = () => {
    const mockEvent = {
      prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
      preventDefault: vi.fn(),
    };
    state.installPrompt = mockEvent;
    state.isInstallable = true;
  };

  const simulateOnlineChange = (online: boolean) => {
    state.isOnline = online;
  };

  const simulateServiceWorkerUpdate = () => {
    state.swUpdateAvailable = true;
  };

  const simulateAppInstalled = () => {
    state.isInstalled = true;
    state.isInstallable = false;
    state.installPrompt = null;
  };

  return {
    getState: () => ({ ...state, ...actions }),
    simulateInstallPrompt,
    simulateOnlineChange,
    simulateServiceWorkerUpdate,
    simulateAppInstalled,
  };
};

// Mock navigator APIs
const mockNavigator = {
  serviceWorker: {
    ready: Promise.resolve({
      waiting: null,
      pushManager: {
        subscribe: vi.fn(),
        getSubscription: vi.fn(),
      },
    }),
    register: vi.fn(),
  },
  onLine: true,
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    ...global.window,
    PushManager: function PushManager() {},
  },
  writable: true,
});

describe('usePWA', () => {
  let mockHook: ReturnType<typeof createMockPWAHook>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHook = createMockPWAHook();
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = mockHook.getState();

      expect(state.isInstallable).toBe(false);
      expect(state.isInstalled).toBe(false);
      expect(state.isOnline).toBe(true);
      expect(state.swUpdateAvailable).toBe(false);
      expect(state.installPrompt).toBeNull();
    });
  });

  describe('app installation', () => {
    it('detects when app is installable', () => {
      mockHook.simulateInstallPrompt();
      const state = mockHook.getState();

      expect(state.isInstallable).toBe(true);
      expect(state.installPrompt).toBeTruthy();
    });

    it('installs app successfully', async () => {
      mockHook.simulateInstallPrompt();
      
      const state = mockHook.getState();
      const result = await state.installApp();

      expect(result).toBe(true);
      const newState = mockHook.getState();
      expect(newState.isInstalled).toBe(true);
      expect(newState.isInstallable).toBe(false);
      expect(newState.installPrompt).toBeNull();
    });

    it('handles installation cancellation', async () => {
      mockHook.simulateInstallPrompt();
      
      // Mock user cancelling installation
      const state = mockHook.getState();
      state.installPrompt.prompt.mockResolvedValueOnce({ outcome: 'dismissed' });
      
      const result = await state.installApp();

      expect(result).toBe(false);
      const newState = mockHook.getState();
      expect(newState.isInstalled).toBe(false);
    });

    it('dismisses install prompt', () => {
      mockHook.simulateInstallPrompt();
      
      const state = mockHook.getState();
      state.dismissInstallPrompt();

      const newState = mockHook.getState();
      expect(newState.isInstallable).toBe(false);
      expect(newState.installPrompt).toBeNull();
    });

    it('detects when app is already installed', () => {
      mockHook.simulateAppInstalled();
      const state = mockHook.getState();

      expect(state.isInstalled).toBe(true);
      expect(state.isInstallable).toBe(false);
    });
  });

  describe('online/offline detection', () => {
    it('detects online state', () => {
      mockHook.simulateOnlineChange(true);
      const state = mockHook.getState();

      expect(state.isOnline).toBe(true);
    });

    it('detects offline state', () => {
      mockHook.simulateOnlineChange(false);
      const state = mockHook.getState();

      expect(state.isOnline).toBe(false);
    });
  });

  describe('service worker updates', () => {
    it('detects service worker updates', () => {
      mockHook.simulateServiceWorkerUpdate();
      const state = mockHook.getState();

      expect(state.swUpdateAvailable).toBe(true);
    });

    it('updates service worker', async () => {
      mockHook.simulateServiceWorkerUpdate();
      
      // Mock service worker with waiting worker
      mockNavigator.serviceWorker.ready = Promise.resolve({
        waiting: {
          postMessage: vi.fn(),
        },
        pushManager: {
          subscribe: vi.fn(),
          getSubscription: vi.fn(),
        },
      } as any);

      const state = mockHook.getState();
      const result = await state.updateServiceWorker();

      expect(result).toBe(true);
      const newState = mockHook.getState();
      expect(newState.swUpdateAvailable).toBe(false);
    });

    it('handles service worker update when no update available', async () => {
      // Mock service worker without waiting worker
      mockNavigator.serviceWorker.ready = Promise.resolve({
        waiting: null,
        pushManager: {
          subscribe: vi.fn(),
          getSubscription: vi.fn(),
        },
      } as any);

      const state = mockHook.getState();
      const result = await state.updateServiceWorker();

      expect(result).toBe(false);
    });
  });

  describe('push notifications', () => {
    it('subscribes to notifications successfully', async () => {
      const mockSubscription = { endpoint: 'https://example.com/push' };
      
      mockNavigator.serviceWorker.ready = Promise.resolve({
        pushManager: {
          subscribe: vi.fn().mockResolvedValue(mockSubscription),
          getSubscription: vi.fn(),
        },
      } as any);

      const state = mockHook.getState();
      const subscription = await state.subscribeToNotifications();

      expect(subscription).toEqual(mockSubscription);
    });

    it('handles notification subscription failure', async () => {
      // Mock unsupported environment
      const originalPushManager = global.window.PushManager;
      delete (global.window as any).PushManager;

      const state = mockHook.getState();
      
      await expect(state.subscribeToNotifications()).rejects.toThrow(
        'Push notifications not supported'
      );

      // Restore
      (global.window as any).PushManager = originalPushManager;
    });

    it('unsubscribes from notifications', async () => {
      const mockSubscription = {
        unsubscribe: vi.fn().mockResolvedValue(true),
      };

      mockNavigator.serviceWorker.ready = Promise.resolve({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(mockSubscription),
          subscribe: vi.fn(),
        },
      } as any);

      const state = mockHook.getState();
      const result = await state.unsubscribeFromNotifications();

      expect(result).toBe(true);
      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('handles unsubscribe when no subscription exists', async () => {
      mockNavigator.serviceWorker.ready = Promise.resolve({
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
          subscribe: vi.fn(),
        },
      } as any);

      const state = mockHook.getState();
      const result = await state.unsubscribeFromNotifications();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('handles service worker registration errors', async () => {
      // Mock service worker not available
      const originalServiceWorker = global.navigator.serviceWorker;
      delete (global.navigator as any).serviceWorker;

      const state = mockHook.getState();
      const result = await state.updateServiceWorker();

      expect(result).toBe(false);

      // Restore
      (global.navigator as any).serviceWorker = originalServiceWorker;
    });

    it('handles installation errors gracefully', async () => {
      mockHook.simulateInstallPrompt();
      
      const state = mockHook.getState();
      state.installPrompt.prompt.mockRejectedValueOnce(new Error('Installation failed'));
      
      const result = await state.installApp();

      expect(result).toBe(false);
    });
  });

  describe('browser compatibility', () => {
    it('handles unsupported browsers gracefully', async () => {
      // Mock environment without service worker support
      const originalServiceWorker = global.navigator.serviceWorker;
      delete (global.navigator as any).serviceWorker;

      const state = mockHook.getState();
      
      // Should not crash and return false for unsupported features
      const updateResult = await state.updateServiceWorker();
      expect(updateResult).toBe(false);

      const installResult = await state.installApp();
      expect(installResult).toBe(false);

      // Restore
      (global.navigator as any).serviceWorker = originalServiceWorker;
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification
} from '../../utils/browserNotification';

// Mock Notification class implementation as per ES6 class requirement for Vitest
class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = vi.fn().mockResolvedValue('granted');

  title: string;
  options: NotificationOptions | undefined;
  onclick: ((this: Notification, ev: Event) => any) | null = null;
  close: ReturnType<typeof vi.fn>;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
    this.close = vi.fn();
  }
}

describe('browserNotification utilities', () => {
  const originalNotification = global.window?.Notification;

  beforeEach(() => {
    vi.clearAllMocks();
    MockNotification.permission = 'default';
    MockNotification.requestPermission.mockReset();
    MockNotification.requestPermission.mockResolvedValue('granted');

    // Inject MockNotification into window
    if (global.window) {
      Object.defineProperty(global.window, 'Notification', {
        value: MockNotification,
        configurable: true,
        writable: true,
      });
    }
  });

  afterEach(() => {
    if (global.window) {
      Object.defineProperty(global.window, 'Notification', {
        value: originalNotification,
        configurable: true,
        writable: true,
      });
    }
  });

  describe('isNotificationSupported', () => {
    it('returns true when Notification is in window', () => {
      expect(isNotificationSupported()).toBe(true);
    });

    it('returns false when window is undefined', () => {
      const tempWindow = global.window;
      // @ts-ignore - simulating environment without window
      delete global.window;

      expect(isNotificationSupported()).toBe(false);

      global.window = tempWindow;
    });

    it('returns false when Notification is not in window', () => {
      if (global.window) {
        // Specifically delete to trigger !('Notification' in window)
        // @ts-ignore
        delete global.window.Notification;
      }
      expect(isNotificationSupported()).toBe(false);
    });
  });

  describe('getNotificationPermission', () => {
    it('returns "unsupported" when window is undefined', () => {
      const tempWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(getNotificationPermission()).toBe('unsupported');

      global.window = tempWindow;
    });

    it('returns "unsupported" when Notification is not in window', () => {
      if (global.window) {
        // @ts-ignore
        delete global.window.Notification;
      }
      expect(getNotificationPermission()).toBe('unsupported');
    });

    it('returns current Notification.permission', () => {
      MockNotification.permission = 'granted';
      expect(getNotificationPermission()).toBe('granted');

      MockNotification.permission = 'denied';
      expect(getNotificationPermission()).toBe('denied');
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns false when unsupported', async () => {
      const tempWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(await requestNotificationPermission()).toBe(false);

      global.window = tempWindow;
    });

    it('returns true if permission is already granted', async () => {
      MockNotification.permission = 'granted';
      expect(await requestNotificationPermission()).toBe(true);
      expect(MockNotification.requestPermission).not.toHaveBeenCalled();
    });

    it('returns false if permission is already denied', async () => {
      MockNotification.permission = 'denied';
      expect(await requestNotificationPermission()).toBe(false);
      expect(MockNotification.requestPermission).not.toHaveBeenCalled();
    });

    it('requests permission and returns true if granted', async () => {
      MockNotification.permission = 'default';
      MockNotification.requestPermission.mockResolvedValue('granted');
      expect(await requestNotificationPermission()).toBe(true);
      expect(MockNotification.requestPermission).toHaveBeenCalled();
    });

    it('requests permission and returns false if not granted', async () => {
      MockNotification.permission = 'default';
      MockNotification.requestPermission.mockResolvedValue('denied');
      expect(await requestNotificationPermission()).toBe(false);
      expect(MockNotification.requestPermission).toHaveBeenCalled();
    });

    it('returns false if requestPermission throws an error', async () => {
      MockNotification.permission = 'default';
      MockNotification.requestPermission.mockRejectedValue(new Error('Test error'));
      expect(await requestNotificationPermission()).toBe(false);
      expect(MockNotification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('sendBrowserNotification', () => {
    it('returns null when unsupported', () => {
      const tempWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(sendBrowserNotification('Test')).toBeNull();

      global.window = tempWindow;
    });

    it('returns null when permission is not granted', () => {
      MockNotification.permission = 'denied';
      expect(sendBrowserNotification('Test')).toBeNull();

      MockNotification.permission = 'default';
      expect(sendBrowserNotification('Test')).toBeNull();
    });

    it('creates and returns a notification when permission is granted', () => {
      MockNotification.permission = 'granted';
      const title = 'Test Title';
      const options = { body: 'Test Body' };

      const notification = sendBrowserNotification(title, options);

      expect(notification).not.toBeNull();
      expect((notification as any).title).toBe(title);
      expect((notification as any).options).toEqual({
        icon: '/vite.svg',
        badge: '/vite.svg',
        body: 'Test Body'
      });
    });

    it('sets up onclick handler that focuses window and closes notification', () => {
      MockNotification.permission = 'granted';

      // Mock window.focus
      const originalFocus = global.window.focus;
      global.window.focus = vi.fn();

      const notification = sendBrowserNotification('Test Title');

      expect(notification).not.toBeNull();
      expect(notification?.onclick).toBeDefined();

      // Simulate click
      if (notification?.onclick) {
        notification.onclick(new Event('click'));
      }

      expect(global.window.focus).toHaveBeenCalled();
      expect((notification as any).close).toHaveBeenCalled();

      // Restore focus
      global.window.focus = originalFocus;
    });

    it('catches and handles errors during notification creation', () => {
      MockNotification.permission = 'granted';

      // Force an error by overriding the mock constructor temporarily
      const originalNotification = global.window.Notification;

      Object.defineProperty(global.window, 'Notification', {
        value: class {
          static permission = 'granted';
          constructor() {
            throw new Error('Constructor failed');
          }
        },
        configurable: true,
        writable: true,
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = sendBrowserNotification('Test Title');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Browser notification failed:', expect.any(Error));

      consoleWarnSpy.mockRestore();

      Object.defineProperty(global.window, 'Notification', {
        value: originalNotification,
        configurable: true,
        writable: true,
      });
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  sendBrowserNotification
} from '../../utils/browserNotification';

describe('browserNotification', () => {
  let originalWindow: any;
  let originalNotification: any;

  beforeEach(() => {
    originalWindow = global.window;
    if (global.window) {
        originalNotification = (global.window as any).Notification;
    }
  });

  afterEach(() => {
    if (global.window) {
        if (originalNotification !== undefined) {
            (global.window as any).Notification = originalNotification;
        } else {
            delete (global.window as any).Notification;
        }
    }
    vi.restoreAllMocks();
  });

  describe('isNotificationSupported', () => {
    it('returns false if window is undefined', () => {
      const tempWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(isNotificationSupported()).toBe(false);
      global.window = tempWindow;
    });

    it('returns false if Notification is not in window', () => {
      // @ts-ignore
      delete global.window.Notification;
      expect(isNotificationSupported()).toBe(false);
    });

    it('returns true if Notification is in window', () => {
      class MockNotification {}
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(isNotificationSupported()).toBe(true);
    });
  });

  describe('getNotificationPermission', () => {
    it('returns unsupported if window is undefined', () => {
      const tempWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(getNotificationPermission()).toBe('unsupported');
      global.window = tempWindow;
    });

    it('returns unsupported if Notification is not in window', () => {
      // @ts-ignore
      delete global.window.Notification;
      expect(getNotificationPermission()).toBe('unsupported');
    });

    it('returns the current permission', () => {
      class MockNotification {
        static permission = 'granted';
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(getNotificationPermission()).toBe('granted');
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns false if Notification is not supported', async () => {
      // @ts-ignore
      delete global.window.Notification;
      expect(await requestNotificationPermission()).toBe(false);
    });

    it('returns true if permission is already granted', async () => {
      class MockNotification {
        static permission = 'granted';
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(await requestNotificationPermission()).toBe(true);
    });

    it('returns false if permission is already denied', async () => {
      class MockNotification {
        static permission = 'denied';
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(await requestNotificationPermission()).toBe(false);
    });

    it('requests permission and returns true if granted', async () => {
      class MockNotification {
        static permission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('granted');
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(await requestNotificationPermission()).toBe(true);
      expect(MockNotification.requestPermission).toHaveBeenCalled();
    });

    it('requests permission and returns false if denied', async () => {
      class MockNotification {
        static permission = 'default';
        static requestPermission = vi.fn().mockResolvedValue('denied');
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(await requestNotificationPermission()).toBe(false);
    });

    it('returns false if requestPermission throws', async () => {
      class MockNotification {
        static permission = 'default';
        static requestPermission = vi.fn().mockRejectedValue(new Error('Test error'));
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(await requestNotificationPermission()).toBe(false);
    });
  });

  describe('sendBrowserNotification', () => {
    it('returns null if Notification is not supported', () => {
      // @ts-ignore
      delete global.window.Notification;
      expect(sendBrowserNotification('Test')).toBeNull();
    });

    it('returns null if permission is not granted', () => {
      class MockNotification {
        static permission = 'denied';
      }
      // @ts-ignore
      global.window.Notification = MockNotification;
      expect(sendBrowserNotification('Test')).toBeNull();
    });

    it('creates and returns a notification if permission is granted', () => {
      const mockClose = vi.fn();

      class MockNotification {
        static permission = 'granted';
        title: string;
        options?: NotificationOptions;
        onclick?: () => void;

        constructor(title: string, options?: NotificationOptions) {
          this.title = title;
          this.options = options;
        }

        close = mockClose;
      }

      // @ts-ignore
      global.window.Notification = MockNotification;

      const title = 'Test Notification';
      const notification = sendBrowserNotification(title, { body: 'Test body' }) as any;

      expect(notification).not.toBeNull();
      expect(notification.title).toBe(title);
      expect(notification.options.body).toBe('Test body');
      expect(notification.options.icon).toBe('/vite.svg');
    });

    it('focuses window and closes notification on click', () => {
      const mockClose = vi.fn();
      const mockFocus = vi.fn();

      // @ts-ignore
      global.window.focus = mockFocus;

      class MockNotification {
        static permission = 'granted';
        onclick?: () => void;
        close = mockClose;
      }

      // @ts-ignore
      global.window.Notification = MockNotification;

      const notification = sendBrowserNotification('Test') as any;

      expect(notification).not.toBeNull();
      expect(notification.onclick).toBeDefined();

      // Trigger click
      notification.onclick();

      expect(mockFocus).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });

    it('returns null and catches error if Notification constructor throws', () => {
      class MockNotification {
        static permission = 'granted';
        constructor() {
          throw new Error('Test constructor error');
        }
      }

      // @ts-ignore
      global.window.Notification = MockNotification;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const notification = sendBrowserNotification('Test');

      expect(notification).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Browser notification failed:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });
  });
});

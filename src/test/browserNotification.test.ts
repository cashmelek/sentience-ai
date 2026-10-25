import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  sendBrowserNotification
} from '../utils/browserNotification';

describe('browserNotification', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    // Save the original window object
    originalWindow = { ...window };

    // We will clear out the mock Notification in beforeEach
    // so each test can set it up as needed.
    if ('Notification' in window) {
      // @ts-ignore
      delete window.Notification;
    }
  });

  afterEach(() => {
    // Restore window properties
    vi.restoreAllMocks();

    // Restore window
    // @ts-ignore
    if (originalWindow.Notification) {
      // @ts-ignore
      window.Notification = originalWindow.Notification;
    }
  });

  describe('isNotificationSupported', () => {
    it('should return false when Notification is not in window', () => {
      // @ts-ignore
      delete window.Notification;
      expect(isNotificationSupported()).toBe(false);
    });

    it('should return true when Notification is in window', () => {
      // @ts-ignore
      window.Notification = {};
      expect(isNotificationSupported()).toBe(true);
    });
  });

  describe('getNotificationPermission', () => {
    it('should return unsupported when Notification is not in window', () => {
      // @ts-ignore
      delete window.Notification;
      expect(getNotificationPermission()).toBe('unsupported');
    });

    it('should return the current permission', () => {
      // @ts-ignore
      window.Notification = { permission: 'granted' };
      expect(getNotificationPermission()).toBe('granted');

      // @ts-ignore
      window.Notification = { permission: 'denied' };
      expect(getNotificationPermission()).toBe('denied');

      // @ts-ignore
      window.Notification = { permission: 'default' };
      expect(getNotificationPermission()).toBe('default');
    });
  });

  describe('requestNotificationPermission', () => {
    it('should return false if window is undefined or Notification is missing', async () => {
      // @ts-ignore
      delete window.Notification;
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });

    it('should return true immediately if permission is already granted', async () => {
      // @ts-ignore
      window.Notification = { permission: 'granted' };
      const result = await requestNotificationPermission();
      expect(result).toBe(true);
    });

    it('should return false immediately if permission is denied', async () => {
      // @ts-ignore
      window.Notification = { permission: 'denied' };
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });

    it('should call requestPermission and return true if granted', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('granted');
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: requestPermissionMock
      };

      const result = await requestNotificationPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should call requestPermission and return false if denied', async () => {
      const requestPermissionMock = vi.fn().mockResolvedValue('denied');
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: requestPermissionMock
      };

      const result = await requestNotificationPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false if requestPermission throws', async () => {
      const requestPermissionMock = vi.fn().mockRejectedValue(new Error('error'));
      // @ts-ignore
      window.Notification = {
        permission: 'default',
        requestPermission: requestPermissionMock
      };

      const result = await requestNotificationPermission();
      expect(requestPermissionMock).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('sendBrowserNotification', () => {
    it('should return null if Notification is not in window', () => {
      // @ts-ignore
      delete window.Notification;
      const result = sendBrowserNotification('Title');
      expect(result).toBeNull();
    });

    it('should return null if permission is not granted', () => {
      // @ts-ignore
      window.Notification = { permission: 'default' };
      const result = sendBrowserNotification('Title');
      expect(result).toBeNull();
    });

    it('should create and return Notification when granted', () => {
      const mockClose = vi.fn();
      class NotificationMock {
        title: string;
        options: any;
        close = mockClose;
        onclick: (() => void) | null = null;

        static permission = 'granted';

        constructor(title: string, options?: any) {
          this.title = title;
          this.options = options;
        }
      }

      // @ts-ignore
      window.Notification = NotificationMock;

      const options = { body: 'body text' };
      const result = sendBrowserNotification('Title', options);

      expect(result).not.toBeNull();
      // Check that it returned an instance of our mock class
      expect(result).toBeInstanceOf(NotificationMock);
      // Check that it saved the correct options internally
      // @ts-ignore
      expect(result.title).toBe('Title');
      // @ts-ignore
      expect(result.options).toEqual({
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options
      });

      // test onclick functionality
      // We need to mock window.focus
      const focusSpy = vi.spyOn(window, 'focus').mockImplementation(() => {});

      if (result) {
        // @ts-ignore
        result.onclick();
        expect(focusSpy).toHaveBeenCalled();
        expect(mockClose).toHaveBeenCalled();
      }
    });

    it('should catch error and return null if Notification constructor throws', () => {
      class NotificationMock {
        static permission = 'granted';
        constructor() {
          throw new Error('Test error');
        }
      }

      // @ts-ignore
      window.Notification = NotificationMock;

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = sendBrowserNotification('Title');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Browser notification failed:', expect.any(Error));
    });
  });
});

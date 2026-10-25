import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase and other modules before importing the file to be tested
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
  CACHE_SIZE_UNLIMITED: -1
}));

// We need to provide a mock config for the local fallback to prevent errors
vi.mock('../../firebase-applet-config.json', () => ({
  default: {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id',
  }
}));

import {
  isQuotaError,
  isQuotaExhausted,
  setQuotaExhausted,
  resetQuotaStatus,
  onQuotaChange
} from '../lib/firebase';

describe('Firebase Quota and Error Handling', () => {
  beforeEach(() => {
    resetQuotaStatus();
    vi.clearAllMocks();
  });

  describe('isQuotaError', () => {
    it('returns false for null or undefined errors', () => {
      expect(isQuotaError(null)).toBe(false);
      expect(isQuotaError(undefined)).toBe(false);
    });

    it('returns false for empty error objects or unknown errors', () => {
      expect(isQuotaError({})).toBe(false);
      expect(isQuotaError({ code: 'not-found', message: 'Document not found' })).toBe(false);
      expect(isQuotaError(new Error('Some other error'))).toBe(false);
    });

    it('returns true when error code is resource-exhausted', () => {
      const error = { code: 'resource-exhausted', message: 'Quota exceeded.' };
      expect(isQuotaError(error)).toBe(true);
      expect(isQuotaExhausted()).toBe(true);
    });

    it('returns true when error message contains "Quota exceeded"', () => {
      const error = { code: 'unknown', message: 'Some details... Quota exceeded for this project.' };
      expect(isQuotaError(error)).toBe(true);
      expect(isQuotaExhausted()).toBe(true);
    });

    it('returns true when error message contains "resource-exhausted"', () => {
      const error = new Error('Firebase error: resource-exhausted. Please check limits.');
      expect(isQuotaError(error)).toBe(true);
      expect(isQuotaExhausted()).toBe(true);
    });
  });

  describe('Quota State Management', () => {
    it('initializes with quota not exhausted', () => {
      expect(isQuotaExhausted()).toBe(false);
    });

    it('updates state with setQuotaExhausted', () => {
      setQuotaExhausted(true);
      expect(isQuotaExhausted()).toBe(true);

      setQuotaExhausted(false);
      expect(isQuotaExhausted()).toBe(false);
    });

    it('resets state with resetQuotaStatus', () => {
      setQuotaExhausted(true);
      resetQuotaStatus();
      expect(isQuotaExhausted()).toBe(false);
    });

    it('notifies listeners when quota status changes', () => {
      const listener = vi.fn();
      const unsubscribe = onQuotaChange(listener);

      setQuotaExhausted(true);
      expect(listener).toHaveBeenCalledWith(true);
      expect(listener).toHaveBeenCalledTimes(1);

      // Should not notify if state doesn't change
      setQuotaExhausted(true);
      expect(listener).toHaveBeenCalledTimes(1);

      setQuotaExhausted(false);
      expect(listener).toHaveBeenCalledWith(false);
      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
      setQuotaExhausted(true);
      expect(listener).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
    });
  });
});

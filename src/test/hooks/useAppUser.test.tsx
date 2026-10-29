import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppUser } from '../../hooks/useAppUser';
import { getDoc } from 'firebase/firestore';
import { isQuotaError, setQuotaExhausted } from '../../lib/firebase';
import type { User } from 'firebase/auth';

// Mock Firebase internal configs
vi.mock('../../../firebase-applet-config.json', () => ({
  default: {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-sender-id',
    appId: 'test-app-id'
  }
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
}));

// Mock firestore methods
vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  initializeFirestore: vi.fn(),
  persistentLocalCache: vi.fn(),
  persistentMultipleTabManager: vi.fn(),
  CACHE_SIZE_UNLIMITED: 'CACHE_SIZE_UNLIMITED'
}));

// Mock our custom firebase lib wrappers
vi.mock('../../lib/firebase', () => ({
  db: {},
  isQuotaError: vi.fn(),
  setQuotaExhausted: vi.fn(),
}));

describe('useAppUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls setQuotaExhausted when getDoc throws a quota error', async () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' } as User;
    const mockError = new Error('Quota exceeded');

    // Setup getDoc to throw the error
    vi.mocked(getDoc).mockRejectedValueOnce(mockError);
    // Setup isQuotaError to return true for this error
    vi.mocked(isQuotaError).mockReturnValueOnce(true);

    const { result } = renderHook(() => useAppUser(mockUser));

    // Wait for the async fetchAppUser to complete and handle the error
    await waitFor(() => {
      expect(getDoc).toHaveBeenCalled();
    });

    expect(isQuotaError).toHaveBeenCalledWith(mockError);
    expect(setQuotaExhausted).toHaveBeenCalledWith(true);
  });
});

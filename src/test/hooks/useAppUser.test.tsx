import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppUser } from '../../hooks/useAppUser';
import * as firebase from '../../lib/firebase';
import * as firestore from 'firebase/firestore';

vi.mock('../../lib/firebase', () => ({
  db: {},
  isQuotaError: vi.fn(),
  setQuotaExhausted: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn()
}));

describe('useAppUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call setQuotaExhausted when getDoc throws a quota error', async () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' } as any;
    const quotaError = new Error('Quota exceeded');

    vi.mocked(firestore.getDoc).mockRejectedValueOnce(quotaError);
    vi.mocked(firebase.isQuotaError).mockReturnValueOnce(true);

    renderHook(() => useAppUser(mockUser));

    await waitFor(() => {
      expect(firebase.isQuotaError).toHaveBeenCalledWith(quotaError);
      expect(firebase.setQuotaExhausted).toHaveBeenCalledWith(true);
    });
  });

  it('should call setQuotaExhausted when setDoc throws a quota error', async () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' } as any;
    const quotaError = new Error('Quota exceeded');

    // getDoc returns false (doesn't exist), triggering setDoc
    vi.mocked(firestore.getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => null
    } as any);

    vi.mocked(firestore.setDoc).mockRejectedValueOnce(quotaError);
    vi.mocked(firebase.isQuotaError).mockReturnValue(true);

    renderHook(() => useAppUser(mockUser));

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalled();
      expect(firebase.setQuotaExhausted).toHaveBeenCalledWith(true);
    });
  });

  it('should call setQuotaExhausted when updateDoc throws a quota error on reset', async () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' } as any;
    const quotaError = new Error('Quota exceeded');
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // getDoc returns true, and lastResetDate is yesterday, triggering updateDoc
    vi.mocked(firestore.getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        role: 'user',
        lastResetDate: yesterday
      })
    } as any);

    vi.mocked(firestore.updateDoc).mockRejectedValueOnce(quotaError);
    vi.mocked(firebase.isQuotaError).mockReturnValue(true);

    renderHook(() => useAppUser(mockUser));

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalled();
      expect(firebase.setQuotaExhausted).toHaveBeenCalledWith(true);
    });
  });
});

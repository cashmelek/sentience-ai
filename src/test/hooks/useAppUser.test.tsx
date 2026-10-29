import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useAppUser } from '../../hooks/useAppUser';
import { getDoc } from 'firebase/firestore';
import { isQuotaError, setQuotaExhausted } from '../../lib/firebase';
import type { User } from 'firebase/auth';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
  isQuotaError: vi.fn(),
  setQuotaExhausted: vi.fn(),
}));

describe('useAppUser hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call setQuotaExhausted when getDoc throws a quota error', async () => {
    // Setup error that looks like a quota error
    const quotaError = new Error('Quota exceeded');
    (quotaError as any).code = 'resource-exhausted';

    // Mock getDoc to throw the error
    (getDoc as Mock).mockRejectedValueOnce(quotaError);

    // Mock isQuotaError to return true for this error
    (isQuotaError as Mock).mockImplementation((err) => err === quotaError);

    // Render the hook with a fake user
    const mockUser = { uid: 'user123', email: 'test@test.com' } as User;
    renderHook(() => useAppUser(mockUser));

    // Wait for the async effect to complete and assert
    await waitFor(() => {
      expect(isQuotaError).toHaveBeenCalledWith(quotaError);
      expect(setQuotaExhausted).toHaveBeenCalledWith(true);
    });
  });
});

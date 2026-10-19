import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, resetQuotaStatus } from '../lib/firebase';

/**
 * B20 Adım 5 (Core Refactor): Firebase auth dinleyicisi App.tsx'ten ayrıştırıldı.
 * Davranış birebir korunmuştur.
 */

export function useAuthListener() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) resetQuotaStatus();
    });
    return () => unsubscribe();
  }, []);

  return { user, setUser, authLoading };
}

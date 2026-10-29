import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, isQuotaError, setQuotaExhausted } from '../lib/firebase';
import type { AppUser } from '../types';

export const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com', 'yasindemir111@gmail.com'];

/**
 * B20 Adım 5 (Core Refactor): users/{uid} dokümanı kurulumu, günlük kullanım
 * sıfırlaması ve admin türetmesi App.tsx'ten ayrıştırıldı. Davranış birebir korunmuştur.
 */
export function useAppUser(user: User | null) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const hasResetToday = useRef<string | null>(null);
  const isAdmin = (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) || appUser?.role === 'admin';

  useEffect(() => {
    if (!user) {
      setAppUser(null);
      hasResetToday.current = null;
      return;
    }

    const fetchAppUser = async () => {
      const userRef = doc(db, 'users', user.uid);
      const today = new Date().toISOString().split('T')[0];

      try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          const newUser: AppUser = {
            uid: user.uid,
            email: user.email,
            role: isAdmin ? 'admin' : 'user',
            plan: 'free',
            dailyUsage: 0,
            lastResetDate: today,
            createdAt: new Date().toISOString(),
            onboarding: {
              profileComplete: true,
              firstHumanize: false,
              firstAnalysis: false,
              firstDraft: false,
              dismissed: false
            }
          };
          await setDoc(userRef, newUser).catch(err => {
            if (isQuotaError(err)) { setQuotaExhausted(true); }
          });
          setAppUser(newUser);
        } else {
          const data = docSnap.data() as any;
          const userCreatedAt = data.createdAt || new Date().toISOString();

          const isHardcodedAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
          if (isHardcodedAdmin && data.role !== 'admin') {
            await updateDoc(userRef, { role: 'admin' }).catch(console.error);
          }

          if (data.lastResetDate !== today && hasResetToday.current !== today) {
            hasResetToday.current = today;
            await updateDoc(userRef, { dailyUsage: 0, lastResetDate: today, createdAt: userCreatedAt }).catch(err => {
              if (isQuotaError(err)) { setQuotaExhausted(true); }
            });
            setAppUser({ uid: user.uid, ...data, dailyUsage: 0, lastResetDate: today, createdAt: userCreatedAt } as AppUser);
          } else {
            setAppUser({
              uid: user.uid,
              ...data,
              createdAt: userCreatedAt,
              onboarding: data.onboarding || {
                profileComplete: true,
                firstHumanize: false,
                firstAnalysis: false,
                firstDraft: false,
                dismissed: false
              }
            } as AppUser);
          }
        }
      } catch (error) {
        if (isQuotaError(error)) {
          setQuotaExhausted(true);
        }
      }
    };

    fetchAppUser();
  }, [user, isAdmin]);

  return { appUser, setAppUser, isAdmin };
}

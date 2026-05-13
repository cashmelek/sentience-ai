import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Vercel ortamında VITE_ değişkenleri kullanılır, yoksa yerel JSON'a bakılır.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId
};

const app = initializeApp(firebaseConfig);

// Firestore'u offline cache ile başlat — kota aşımında bile çalışabilsin
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

export const auth = getAuth(app);

// Kota aşım durumu yönetimi
let _quotaExhausted = false;
const _quotaListeners: Array<(exhausted: boolean) => void> = [];

export function isQuotaExhausted(): boolean {
  return _quotaExhausted;
}

export function setQuotaExhausted(value: boolean): void {
  if (_quotaExhausted !== value) {
    _quotaExhausted = value;
    if (value) {
      console.error("🚨 FIREBASE KOTA AŞILDI: Uygulama kısıtlı moda geçti.");
    }
    _quotaListeners.forEach(fn => fn(value));
  }
}

export function onQuotaChange(listener: (exhausted: boolean) => void): () => void {
  _quotaListeners.push(listener);
  return () => {
    const idx = _quotaListeners.indexOf(listener);
    if (idx >= 0) _quotaListeners.splice(idx, 1);
  };
}

/**
 * Firestore hata kodunu kontrol eder.
 * 'resource-exhausted' → kota aşımı anlamına gelir.
 */
export function isQuotaError(error: any): boolean {
  if (!error) return false;
  const code = error?.code || '';
  const message = error?.message || '';
  const isQuota = code === 'resource-exhausted' || 
         message.includes('Quota exceeded') || 
         message.includes('resource-exhausted');
  
  if (isQuota) {
    setQuotaExhausted(true);
  }
  return isQuota;
}

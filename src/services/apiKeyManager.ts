import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, addDoc, query, where, updateDoc, increment } from 'firebase/firestore';

export interface ApiKeyMetadata {
  id?: string;
  provider: 'gemini' | 'google-search';
  index?: number;
  maskedKey: string;
  status: 'active' | 'exhausted' | 'invalid';
  usageCount: number;
  lastUsed?: any;
  updatedAt?: any;
  isDynamic?: boolean;
  value?: string;
}

class ApiKeyManager {
  private geminiPool: { key: string; isDynamic: boolean; id?: string; usageCount: number }[] = [];
  private searchPool: { key: string; isDynamic: boolean; id?: string; usageCount: number }[] = [];
  private currentGeminiIndex = 0;
  private currentSearchIndex = 0;

  constructor() {
    this.initFromEnv();
    this.syncWithFirestore();
  }

  private initFromEnv() {
    const rawGemini = import.meta.env.VITE_GEMINI_API_KEY || "";
    const envGemini = rawGemini.split(",").map(k => k.trim()).filter(Boolean);
    this.geminiPool = envGemini.map(key => ({ key, isDynamic: false, usageCount: 0 }));

    const rawSearch = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || "";
    const envSearch = rawSearch.split(",").map(k => k.trim()).filter(Boolean);
    this.searchPool = envSearch.map(key => ({ key, isDynamic: false, usageCount: 0 }));
  }

  async syncWithFirestore() {
    try {
      const snap = await getDocs(collection(db, 'apiKeys'));
      const dbKeys = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      // Havuzları temizle ve ENV anahtarlarını hazırla
      this.initFromEnv();

      dbKeys.forEach(dk => {
        if (dk.isDynamic) {
          const item = { key: dk.value, isDynamic: true, id: dk.id, usageCount: dk.usageCount || 0 };
          if (dk.provider === 'gemini') this.geminiPool.push(item);
          else this.searchPool.push(item);
        } else {
          // ENV anahtarlarının DB'deki kullanım sayılarını eşle
          const pool = dk.provider === 'gemini' ? this.geminiPool : this.searchPool;
          if (typeof dk.index === 'number' && pool[dk.index] && !pool[dk.index].isDynamic) {
            pool[dk.index].usageCount = dk.usageCount || 0;
            pool[dk.index].id = dk.id;
          }
        }
      });
    } catch (e) {
      console.error("[ApiKeyManager] Sync Error:", e);
    }
  }

  /**
   * Bir anahtarın kullanım sayısını artırır ve Firestore'a yazar.
   */
  async incrementUsage(provider: 'gemini' | 'google-search') {
    const pool = provider === 'gemini' ? this.geminiPool : this.searchPool;
    const index = provider === 'gemini' ? this.currentGeminiIndex : this.currentSearchIndex;
    const item = pool[index];

    if (!item) return;

    item.usageCount++;
    
    try {
      const keyId = item.id || `${provider}_${index}`;
      const keyRef = doc(db, 'apiKeys', keyId);
      
      await setDoc(keyRef, {
        provider,
        index,
        usageCount: increment(1),
        lastUsed: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDynamic: item.isDynamic,
        maskedKey: item.id ? undefined : `${item.key.substring(0, 6)}...` // Sadece yeni döküman ise yaz
      }, { merge: true });

      // Eğer Search limiti dolduysa (100) otomatik rotasyon yap
      if (provider === 'google-search' && item.usageCount >= 100) {
        await this.setKeyStatus(keyId, 'exhausted');
        this.rotateSearchKey();
      }
    } catch (e) {
      console.error("Increment usage failed:", e);
    }
  }

  async addNewKey(provider: 'gemini' | 'google-search', keyValue: string) {
    if (!keyValue || keyValue.length < 10) throw new Error("Geçersiz API Anahtarı");
    const masked = `${keyValue.substring(0, 6)}...${keyValue.substring(keyValue.length - 4)}`;
    await addDoc(collection(db, 'apiKeys'), {
      provider,
      value: keyValue,
      maskedKey: masked,
      status: 'active',
      usageCount: 0,
      isDynamic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await this.syncWithFirestore();
    return true;
  }

  private async setKeyStatus(id: string, status: 'active' | 'exhausted' | 'invalid') {
    await updateDoc(doc(db, 'apiKeys', id), { status, updatedAt: serverTimestamp() });
  }

  getGeminiKey(): string {
    if (this.geminiPool.length === 0) throw new Error("Gemini API anahtarı bulunamadı.");
    return this.geminiPool[this.currentGeminiIndex].key;
  }

  getSearchKey(): string {
    if (this.searchPool.length === 0) return import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || "";
    return this.searchPool[this.currentSearchIndex].key;
  }

  rotateGeminiKey(): boolean {
    if (this.geminiPool.length <= 1) return false;
    this.currentGeminiIndex = (this.currentGeminiIndex + 1) % this.geminiPool.length;
    return true;
  }

  rotateSearchKey(): boolean {
    if (this.searchPool.length <= 1) return false;
    this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchPool.length;
    return true;
  }

  async resetAllKeys() {
    const snap = await getDocs(collection(db, 'apiKeys'));
    for (const d of snap.docs) {
      await updateDoc(d.ref, { usageCount: 0, status: 'active', updatedAt: serverTimestamp() });
    }
    this.currentGeminiIndex = 0;
    this.currentSearchIndex = 0;
    await this.syncWithFirestore();
    return true;
  }

  getHealth() {
    return {
      gemini: { total: this.geminiPool.length, currentIndex: this.currentGeminiIndex },
      search: { total: this.searchPool.length, currentIndex: this.currentSearchIndex }
    };
  }
}

export const apiKeyManager = new ApiKeyManager();

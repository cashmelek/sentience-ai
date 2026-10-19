import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, addDoc, query, where, updateDoc, increment, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface ApiKeyMetadata {
  id?: string;
  provider: 'gemini' | 'google-search';
  index?: number;
  maskedKey: string;
  status: 'active' | 'exhausted' | 'invalid' | 'busy';
  usageCount: number;
  lastUsed?: any;
  updatedAt?: any;
  isDynamic?: boolean;
  value?: string;
}

export interface PoolItem {
  key: string;
  isDynamic: boolean;
  id?: string;
  usageCount: number;
  status: 'active' | 'exhausted' | 'invalid' | 'busy';
}

class ApiKeyManager {
  private geminiPool: PoolItem[] = [];
  private searchPool: PoolItem[] = [];
  private currentGeminiIndex = 0;
  private currentSearchIndex = 0;
  private unsubscribe: Unsubscribe | null = null;

  constructor() {
    this.initFromEnv();
    this.startLiveSync();
  }

  private initFromEnv() {
    const rawGemini = import.meta.env.VITE_GEMINI_API_KEY || "";
    const envGemini = rawGemini.split(",").map(k => k.trim()).filter(Boolean);
    this.geminiPool = envGemini.map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));

    const rawSearch = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || "";
    const envSearch = rawSearch.split(",").map(k => k.trim()).filter(Boolean);
    this.searchPool = envSearch.map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));
  }

  public getActiveKeysCount(provider: 'gemini' | 'google-search'): number {
    const pool = provider === 'gemini' ? this.geminiPool : this.searchPool;
    return pool.filter(p => p.status === 'active' || p.status === 'busy').length;
  }

  async syncWithFirestore() {
    const snap = await getDocs(collection(db, 'apiKeys'));
    this.processSnapshot(snap.docs);
  }

  private processSnapshot(docs: any[]) {
    console.log("[ApiKeyManager] Syncing pools with DB data...");
    const dbKeys = docs.map(d => ({ id: d.id, ...d.data() } as any));
    
    this.initFromEnv();

    // ENV anahtarlarını dökümanlarla eşleştir veya oluştur
    this.geminiPool.forEach((p, idx) => {
       const maskedLocal = this.getMaskedKey(p.key);
       const match = dbKeys.find(dk => dk.provider === 'gemini' && !dk.isDynamic && (dk.maskedKey === maskedLocal || dk.value === p.key));
       if (match) {
         p.id = match.id;
         p.status = match.status || 'active';
         p.usageCount = match.usageCount || 0;
       } else {
         if (auth.currentUser) {
           const docId = `gemini_${maskedLocal.replace(/[^a-zA-Z0-9]/g, '_')}`;
           setDoc(doc(db, 'apiKeys', docId), {
             provider: 'gemini',
             maskedKey: maskedLocal,
             status: 'active',
             usageCount: 0,
             isDynamic: false,
             index: idx,
             createdAt: serverTimestamp(),
             updatedAt: serverTimestamp()
           }).catch(() => {});
         }
       }
    });

    this.searchPool.forEach((p, idx) => {
       const maskedLocal = this.getMaskedKey(p.key);
       const match = dbKeys.find(dk => dk.provider === 'google-search' && !dk.isDynamic && (dk.maskedKey === maskedLocal || dk.value === p.key));
       if (match) {
         p.id = match.id;
         p.status = match.status || 'active';
         p.usageCount = match.usageCount || 0;
       } else {
         if (auth.currentUser) {
           const docId = `google_search_${maskedLocal.replace(/[^a-zA-Z0-9]/g, '_')}`;
           setDoc(doc(db, 'apiKeys', docId), {
             provider: 'google-search',
             maskedKey: maskedLocal,
             status: 'active',
             usageCount: 0,
             isDynamic: false,
             index: idx,
             createdAt: serverTimestamp(),
             updatedAt: serverTimestamp()
           }).catch(() => {});
         }
       }
    });

    // Dinamik anahtarları ekle
    dbKeys.filter(dk => dk.isDynamic && dk.value).forEach(dk => {
      const pool = dk.provider === 'gemini' ? this.geminiPool : this.searchPool;
      const existingIdx = pool.findIndex(p => p.key === dk.value);
      if (existingIdx !== -1) {
        pool[existingIdx].status = dk.status || 'active';
        pool[existingIdx].usageCount = dk.usageCount || 0;
        pool[existingIdx].id = dk.id;
      } else {
        pool.push({ key: dk.value, isDynamic: true, id: dk.id, usageCount: dk.usageCount || 0, status: dk.status || 'active' });
      }
    });
  }

  private startLiveSync() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = onSnapshot(collection(db, 'apiKeys'), (snap) => {
      this.processSnapshot(snap.docs);
    });
  }

  public getMaskedKey(key: string): string {
    if (!key) return "******";
    if (key.includes('...')) return key;
    if (key.length <= 12) return `${key.substring(0, 4)}...`;
    return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  }

  private findNextAvailableIndex(provider: 'gemini' | 'google-search'): number {
    const pool = provider === 'gemini' ? this.geminiPool : this.searchPool;
    const startIndex = provider === 'gemini' ? this.currentGeminiIndex : this.currentSearchIndex;
    if (pool.length === 0) return -1;
    for (let i = 0; i < pool.length; i++) {
      const idx = (startIndex + i) % pool.length;
      if (pool[idx].status === 'active' || pool[idx].status === 'busy') {
        if (provider === 'gemini') this.currentGeminiIndex = idx;
        else this.currentSearchIndex = idx;
        return idx;
      }
    }
    return -1;
  }

  async markCurrentKeyExhausted(provider: 'gemini' | 'google-search') {
    const id = this.getCurrentKeyId(provider);
    if (!id) return;
    try {
      await updateDoc(doc(db, 'apiKeys', id), { 
        status: 'exhausted', 
        usageCount: 5,
        updatedAt: serverTimestamp() 
      });
    } catch (e) {}
  }

  async markCurrentKeyInvalid(provider: 'gemini' | 'google-search') {
    const id = this.getCurrentKeyId(provider);
    if (!id) return;
    try {
      await updateDoc(doc(db, 'apiKeys', id), { 
        status: 'invalid',
        updatedAt: serverTimestamp() 
      });
    } catch (e) {}
  }

  private getCurrentKeyId(provider: 'gemini' | 'google-search'): string | null {
    const pool = provider === 'gemini' ? this.geminiPool : this.searchPool;
    const index = provider === 'gemini' ? this.currentGeminiIndex : this.currentSearchIndex;
    return pool[index]?.id || null;
  }

  async setKeyActivity(provider: 'gemini' | 'google-search', isBusy: boolean) {
    const id = this.getCurrentKeyId(provider);
    if (!id) return;
    try {
      await updateDoc(doc(db, 'apiKeys', id), { status: isBusy ? 'busy' : 'active', updatedAt: serverTimestamp() });
    } catch (e) {}
  }

  async incrementUsage(provider: 'gemini' | 'google-search') {
    const id = this.getCurrentKeyId(provider);
    if (!id) return;
    try {
      const pool = provider === 'gemini' ? this.geminiPool : this.searchPool;
      const index = provider === 'gemini' ? this.currentGeminiIndex : this.currentSearchIndex;
      const item = pool[index];
      
      const maxRequests = 5;
      const newUsage = (item.usageCount || 0) + 1;
      const newStatus = newUsage >= maxRequests ? 'exhausted' : item.status;
      await updateDoc(doc(db, 'apiKeys', id), { usageCount: newUsage, status: newStatus, lastUsed: serverTimestamp(), updatedAt: serverTimestamp() });
      if (newStatus === 'exhausted') {
        if (provider === 'gemini') this.rotateGeminiKey();
        else this.rotateSearchKey();
      }
    } catch (e) {}
  }

  async verifyKeyHealth(keyId: string, provider: 'gemini' | 'google-search', keyValue: string): Promise<boolean> {
    try {
      if (provider === 'gemini') {
        const { GoogleGenAI } = await import("@google/genai");
        const client = new GoogleGenAI({ apiKey: keyValue });
        await client.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: 'user', parts: [{ text: "hi" }] }],
          config: { maxOutputTokens: 5 }
        });
      }
      
      await updateDoc(doc(db, 'apiKeys', keyId), { status: 'active', usageCount: 0, updatedAt: serverTimestamp() });
      return true;
    } catch (e: any) {
      console.error("[ApiKeyManager] Key verification failed:", e);
      if (e.message?.includes("API key not valid") || e.status === 400) {
        await updateDoc(doc(db, 'apiKeys', keyId), { status: 'invalid', updatedAt: serverTimestamp() });
      }
      return false;
    }
  }

  async addNewKey(provider: 'gemini' | 'google-search', keyValue: string) {
    if (!keyValue || keyValue.length < 10) throw new Error("Geçersiz API Anahtarı");
    const masked = this.getMaskedKey(keyValue);
    await addDoc(collection(db, 'apiKeys'), { provider, value: keyValue, maskedKey: masked, status: 'active', usageCount: 0, isDynamic: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return true;
  }

  async resetAllKeys() {
    const snap = await getDocs(collection(db, 'apiKeys'));
    for (const d of snap.docs) { await updateDoc(d.ref, { usageCount: 0, status: 'active', updatedAt: serverTimestamp() }); }
    return true;
  }

  getGeminiKey(): string {
    const idx = this.findNextAvailableIndex('gemini');
    return idx === -1 ? (this.geminiPool[0]?.key || "") : this.geminiPool[idx].key;
  }

  getSearchKey(): string {
    const idx = this.findNextAvailableIndex('google-search');
    return idx === -1 ? (this.searchPool[0]?.key || "") : this.searchPool[idx].key;
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

  getHealth() {
    return {
      gemini: { total: this.geminiPool.length, currentIndex: this.currentGeminiIndex },
      search: { total: this.searchPool.length, currentIndex: this.currentSearchIndex }
    };
  }
}

export const apiKeyManager = new ApiKeyManager();

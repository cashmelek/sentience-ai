import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection, getDocs, addDoc, query, where, updateDoc, increment, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface ApiKeyMetadata {
  id?: string;
  provider: 'gemini' | 'google-search' | 'core-api' | 'openalex' | 'opencitations';
  index?: number;
  label?: string;
  dailyLimit?: number;
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
  private corePool: PoolItem[] = [];
  private openAlexPool: PoolItem[] = [];
  private openCitationsPool: PoolItem[] = [];
  private currentGeminiIndex = 0;
  private currentSearchIndex = 0;
  private currentCoreIndex = 0;
  private currentOpenAlexIndex = 0;
  private currentOpenCitationsIndex = 0;
  private unsubscribe: Unsubscribe | null = null;

  constructor() {
    this.initFromEnv();
    this.startLiveSync();
  }

  private parseEnvKeys(raw: string): string[] {
    if (!raw) return [];
    let cleaned = raw.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned
      .split(",")
      .map(k => k.trim().replace(/^["']|["']$/g, '').trim())
      .filter(Boolean);
  }

  private initFromEnv() {
    this.geminiPool = this.parseEnvKeys(import.meta.env.VITE_GEMINI_API_KEY || "").map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));
    this.searchPool = this.parseEnvKeys(import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || "").map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));
    this.corePool = this.parseEnvKeys(import.meta.env.VITE_CORE_API_KEY || "").map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));
    this.openAlexPool = this.parseEnvKeys(import.meta.env.VITE_OPENALEX_API_KEY || "").map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));
    this.openCitationsPool = this.parseEnvKeys(import.meta.env.VITE_OPENCITATIONS_API_KEY || "").map(key => ({ key, isDynamic: false, usageCount: 0, status: 'active' }));
  }

  public getActiveKeysCount(provider: 'gemini' | 'google-search' | 'core-api' | 'openalex' | 'opencitations'): number {
    const pool = provider === 'gemini' ? this.geminiPool 
      : provider === 'google-search' ? this.searchPool 
      : provider === 'openalex' ? this.openAlexPool 
      : provider === 'opencitations' ? this.openCitationsPool
      : this.corePool;
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

    // ENV havuzundan çıkarılmış eski ENV anahtarlarını DB'den otomatik temizle
    if (auth.currentUser) {
      dbKeys.filter(dk => !dk.isDynamic).forEach(dk => {
        const pool = dk.provider === 'gemini' ? this.geminiPool 
          : dk.provider === 'google-search' ? this.searchPool 
          : dk.provider === 'openalex' ? this.openAlexPool 
          : dk.provider === 'opencitations' ? this.openCitationsPool 
          : this.corePool;
        const stillExists = pool.some(p => this.getMaskedKey(p.key) === dk.maskedKey || p.key === dk.value);
        if (!stillExists) {
          deleteDoc(doc(db, 'apiKeys', dk.id)).catch(() => {});
        }
      });
    }

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

    this.corePool.forEach((p, idx) => {
       const maskedLocal = this.getMaskedKey(p.key);
       const match = dbKeys.find(dk => dk.provider === 'core-api' && !dk.isDynamic && (dk.maskedKey === maskedLocal || dk.value === p.key));
       if (match) {
         p.id = match.id;
         p.status = match.status || 'active';
         p.usageCount = match.usageCount || 0;
       } else {
         if (auth.currentUser) {
           const docId = `core_api_${maskedLocal.replace(/[^a-zA-Z0-9]/g, '_')}`;
           setDoc(doc(db, 'apiKeys', docId), {
             provider: 'core-api',
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

    this.openAlexPool.forEach((p, idx) => {
       const maskedLocal = this.getMaskedKey(p.key);
       const match = dbKeys.find(dk => dk.provider === 'openalex' && !dk.isDynamic && (dk.maskedKey === maskedLocal || dk.value === p.key));
       if (match) {
         p.id = match.id;
         p.status = match.status || 'active';
         p.usageCount = match.usageCount || 0;
       } else {
         if (auth.currentUser) {
           const docId = `openalex_${maskedLocal.replace(/[^a-zA-Z0-9]/g, '_')}`;
           setDoc(doc(db, 'apiKeys', docId), {
             provider: 'openalex',
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

    this.openCitationsPool.forEach((p, idx) => {
       const maskedLocal = this.getMaskedKey(p.key);
       const match = dbKeys.find(dk => dk.provider === 'opencitations' && !dk.isDynamic && (dk.maskedKey === maskedLocal || dk.value === p.key));
       if (match) {
         p.id = match.id;
         p.status = match.status || 'active';
         p.usageCount = match.usageCount || 0;
       } else {
         if (auth.currentUser) {
           const docId = `opencitations_${maskedLocal.replace(/[^a-zA-Z0-9]/g, '_')}`;
           setDoc(doc(db, 'apiKeys', docId), {
             provider: 'opencitations',
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
      const pool = dk.provider === 'gemini' ? this.geminiPool 
        : dk.provider === 'google-search' ? this.searchPool 
        : dk.provider === 'openalex' ? this.openAlexPool 
        : dk.provider === 'opencitations' ? this.openCitationsPool
        : this.corePool;
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
    const clean = key.replace(/["']/g, '').trim();
    if (clean.includes('...')) return clean;
    if (clean.length <= 12) return `${clean.substring(0, 4)}...`;
    return `${clean.substring(0, 6)}...${clean.substring(clean.length - 4)}`;
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
    const maxRequests = provider === 'gemini' ? 1500 : 100;
    try {
      await updateDoc(doc(db, 'apiKeys', id), { 
        status: 'exhausted', 
        usageCount: maxRequests,
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
      
      const maxRequests = provider === 'gemini' ? 1500 : 100;
      const newUsage = (item.usageCount || 0) + 1;
      const newStatus = newUsage >= maxRequests ? 'exhausted' : item.status;
      await updateDoc(doc(db, 'apiKeys', id), { usageCount: newUsage, status: newStatus, lastUsed: serverTimestamp(), updatedAt: serverTimestamp() });
      if (newStatus === 'exhausted') {
        if (provider === 'gemini') this.rotateGeminiKey();
        else this.rotateSearchKey();
      }
    } catch (e) {}
  }

  async verifyKeyHealth(keyId: string, provider: 'gemini' | 'google-search' | 'core-api' | 'openalex' | 'opencitations', keyValue?: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const pool = provider === 'gemini' ? this.geminiPool 
        : provider === 'google-search' ? this.searchPool 
        : provider === 'openalex' ? this.openAlexPool 
        : provider === 'opencitations' ? this.openCitationsPool
        : this.corePool;

      let keyToTest = keyValue;
      if (!keyToTest) {
        const item = pool.find(p => p.id === keyId);
        if (item?.key) keyToTest = item.key;
      }

      if (!keyToTest) {
        const snap = await getDoc(doc(db, 'apiKeys', keyId));
        if (snap.exists()) {
          const data = snap.data();
          keyToTest = data.value;
          if (!keyToTest && typeof data.index === 'number' && pool[data.index]) {
            keyToTest = pool[data.index].key;
          } else if (!keyToTest && pool.length > 0) {
            const cleanMask = (data.maskedKey || '').replace(/["']/g, '').trim();
            const matchedPool = pool.find(p => this.getMaskedKey(p.key) === cleanMask || this.getMaskedKey(p.key) === data.maskedKey);
            if (matchedPool) keyToTest = matchedPool.key;
            else if (!data.isDynamic) keyToTest = pool[0]?.key;
          }
        }
      }

      if (!keyToTest && pool.length > 0 && !keyId.startsWith('custom_')) {
        keyToTest = pool[0]?.key;
      }

      if (!keyToTest) throw new Error("Anahtar değeri bulunamadı");
      keyToTest = keyToTest.replace(/^["']|["']$/g, '').trim();

      if (provider === 'gemini') {
        const { GoogleGenAI } = await import("@google/genai");
        const client = new GoogleGenAI({ apiKey: keyToTest });
        const candidateModels = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-2.0-flash"];
        let tested = false;
        let lastErr: any = null;

        for (const candidateModel of candidateModels) {
          try {
            await client.models.generateContent({
              model: candidateModel,
              contents: [{ role: 'user', parts: [{ text: "ping" }] }],
              config: { maxOutputTokens: 2 }
            });
            tested = true;
            break;
          } catch (mErr: any) {
            lastErr = mErr;
            const errMsg = String(mErr.message || '');
            if (errMsg.includes("no longer available") || errMsg.includes("not found") || mErr.status === 404) {
              continue;
            }
            throw mErr;
          }
        }
        if (!tested && lastErr) throw lastErr;
      } else if (provider === 'openalex') {
        const cleanKey = keyToTest.trim();
        const res = await fetch(`https://api.openalex.org/works?per-page=1&api_key=${encodeURIComponent(cleanKey)}`, {
          headers: { 'User-Agent': 'SentienceAI-AcademicVerifier/1.0' }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const err: any = new Error(errData?.message || `OpenAlex Yanıtı: HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }
      } else if (provider === 'core-api') {
        const cleanKey = keyToTest.trim();
        const res = await fetch(`https://api.core.ac.uk/v3/search/works?q=test&limit=1&api_key=${encodeURIComponent(cleanKey)}`, {
          headers: { 
            'Authorization': `Bearer ${cleanKey}`,
            'Accept': 'application/json'
          }
        });
        if (!res.ok) {
          // Eğer CORE 401 döndüyse, bu anahtarın OpenAlex için alınıp alınmadığını sına
          if (res.status === 401) {
            try {
              const alexRes = await fetch(`https://api.openalex.org/works?per-page=1&api_key=${encodeURIComponent(cleanKey)}`, {
                headers: { 'User-Agent': 'SentienceAI-AcademicVerifier/1.0' }
              });
              if (alexRes.ok) {
                await updateDoc(doc(db, 'apiKeys', keyId), {
                  provider: 'openalex',
                  label: 'OpenAlex API',
                  status: 'active',
                  dailyLimit: 10000,
                  usageCount: 0,
                  updatedAt: serverTimestamp()
                });
                return { success: true, message: 'OpenAlex anahtarı olarak doğrulandı ve güncellendi.' };
              }
            } catch {}
          }
          const errData = await res.json().catch(() => ({}));
          const err: any = new Error(errData?.message || `CORE API Yanıtı: HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }
      } else if (provider === 'opencitations') {
        const cleanKey = keyToTest.trim();
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (cleanKey && cleanKey.length > 5) {
          headers['authorization'] = cleanKey;
        }
        const res = await fetch(`https://api.opencitations.net/index/v2/citation-count/doi:10.1108/jd-12-2013-0166`, { headers });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const err: any = new Error(errData?.message || `OpenCitations Yanıtı: HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }
      } else if (provider === 'google-search') {
        const cx = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || "d26f174f711604ed3";
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${keyToTest}&cx=${cx}&q=ping&num=1`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const err: any = new Error(errData?.error?.message || `HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }
      }
      
      await updateDoc(doc(db, 'apiKeys', keyId), { status: 'active', usageCount: 0, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e: any) {
      console.error("[ApiKeyManager] Key verification failed:", e);
      const msg = String(e.message || '');
      const status = e.status || 0;
      
      const isInvalid = 
        status === 400 || 
        status === 401 || 
        status === 403 ||
        msg.includes("API key not valid") || 
        msg.includes("Invalid or missing API key") ||
        msg.includes("Invalid token") ||
        msg.includes("API_KEY_INVALID") ||
        msg.includes("not valid");

      const isQuota = 
        status === 429 || 
        msg.includes("429") || 
        msg.includes("quota") || 
        msg.includes("Resource has been exhausted");

      const targetStatus = isInvalid ? 'invalid' : isQuota ? 'exhausted' : 'active';
      
      await updateDoc(doc(db, 'apiKeys', keyId), { 
        status: targetStatus, 
        updatedAt: serverTimestamp() 
      });
      return { success: false, error: e.message || 'Bilinmeyen hata' };
    }
  }

  async toggleKeyStatus(keyId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'active' ? 'exhausted' : 'active';
    const updatePayload: any = { status: nextStatus, updatedAt: serverTimestamp() };
    if (nextStatus === 'active') {
      updatePayload.usageCount = 0;
    }
    await updateDoc(doc(db, 'apiKeys', keyId), updatePayload);
  }

  async addNewKey(provider: 'gemini' | 'google-search' | 'core-api' | 'openalex' | 'opencitations', keyValue: string, label?: string, dailyLimit?: number) {
    if (!keyValue || keyValue.length < 5) throw new Error("Geçersiz API Anahtarı");
    const masked = this.getMaskedKey(keyValue);
    const defaultLimit = provider === 'gemini' ? 1500 : provider === 'openalex' ? 10000 : provider === 'opencitations' ? 5000 : provider === 'core-api' ? 500 : 100;
    await addDoc(collection(db, 'apiKeys'), {
      provider,
      label: label || (provider === 'gemini' ? 'Gemini Havuz' : provider === 'openalex' ? 'OpenAlex Havuz' : provider === 'opencitations' ? 'OpenCitations Havuz' : provider === 'core-api' ? 'CORE Havuz' : 'Google Search Havuz'),
      dailyLimit: dailyLimit || defaultLimit,
      value: keyValue,
      maskedKey: masked,
      status: 'active',
      usageCount: 0,
      isDynamic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async resetAllKeys() {
    const snap = await getDocs(collection(db, 'apiKeys'));
    for (const d of snap.docs) { await updateDoc(d.ref, { usageCount: 0, status: 'active', updatedAt: serverTimestamp() }); }
    this.geminiPool.forEach(p => { p.status = 'active'; p.usageCount = 0; });
    this.searchPool.forEach(p => { p.status = 'active'; p.usageCount = 0; });
    this.corePool.forEach(p => { p.status = 'active'; p.usageCount = 0; });
    this.openAlexPool.forEach(p => { p.status = 'active'; p.usageCount = 0; });
    this.openCitationsPool.forEach(p => { p.status = 'active'; p.usageCount = 0; });
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

  getCoreKey(): string {
    const pool = this.corePool;
    if (pool.length === 0) return "";
    for (let i = 0; i < pool.length; i++) {
      const idx = (this.currentCoreIndex + i) % pool.length;
      if (pool[idx].status === 'active' || pool[idx].status === 'busy') {
        this.currentCoreIndex = idx;
        return pool[idx].key;
      }
    }
    return pool[0]?.key || "";
  }

  getOpenAlexKey(): string {
    const pool = this.openAlexPool;
    if (pool.length === 0) return "";
    for (let i = 0; i < pool.length; i++) {
      const idx = (this.currentOpenAlexIndex + i) % pool.length;
      if (pool[idx].status === 'active' || pool[idx].status === 'busy') {
        this.currentOpenAlexIndex = idx;
        return pool[idx].key;
      }
    }
    return pool[0]?.key || "";
  }

  getOpenCitationsKey(): string {
    const pool = this.openCitationsPool;
    if (pool.length === 0) return "";
    for (let i = 0; i < pool.length; i++) {
      const idx = (this.currentOpenCitationsIndex + i) % pool.length;
      if (pool[idx].status === 'active' || pool[idx].status === 'busy') {
        this.currentOpenCitationsIndex = idx;
        return pool[idx].key;
      }
    }
    return pool[0]?.key || "";
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

  rotateCoreKey(): boolean {
    if (this.corePool.length <= 1) return false;
    this.currentCoreIndex = (this.currentCoreIndex + 1) % this.corePool.length;
    return true;
  }

  rotateOpenAlexKey(): boolean {
    if (this.openAlexPool.length <= 1) return false;
    this.currentOpenAlexIndex = (this.currentOpenAlexIndex + 1) % this.openAlexPool.length;
    return true;
  }

  rotateOpenCitationsKey(): boolean {
    if (this.openCitationsPool.length <= 1) return false;
    this.currentOpenCitationsIndex = (this.currentOpenCitationsIndex + 1) % this.openCitationsPool.length;
    return true;
  }

  getHealth() {
    return {
      gemini: { total: this.geminiPool.length, currentIndex: this.currentGeminiIndex },
      search: { total: this.searchPool.length, currentIndex: this.currentSearchIndex },
      core: { total: this.corePool.length, currentIndex: this.currentCoreIndex },
      openalex: { total: this.openAlexPool.length, currentIndex: this.currentOpenAlexIndex },
      opencitations: { total: this.openCitationsPool.length, currentIndex: this.currentOpenCitationsIndex }
    };
  }
}

export const apiKeyManager = new ApiKeyManager();

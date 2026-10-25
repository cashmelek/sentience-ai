import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Plus, Trash2, Code2, Terminal, Shield, Sparkles } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export interface DeveloperToken {
  id: string;
  name: string;
  token: string;
  scope: 'all' | 'detect' | 'analyze';
  dailyLimit: number;
  usageCount: number;
  createdAt: string;
}

export function DeveloperApiView() {
  const [tokens, setTokens] = useState<DeveloperToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenScope, setNewTokenScope] = useState<'all' | 'detect' | 'analyze'>('all');
  const [newTokenLimit, setNewTokenLimit] = useState(1000);
  const [isCreating, setIsCreating] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'detect' | 'analyze'>('detect');

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const q = query(collection(db, 'developerTokens'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DeveloperToken[];
      setTokens(list);
    } catch {
      const saved = localStorage.getItem('sentience_developer_tokens');
      if (saved) {
        try {
          setTokens(JSON.parse(saved));
        } catch {
          setTokens([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) {
      toast.error('Token adı gereklidir');
      return;
    }

    const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const fullToken = `stn_${newTokenScope}_${randomSuffix}`;

    const tokenObj: Omit<DeveloperToken, 'id'> = {
      name: newTokenName.trim(),
      token: fullToken,
      scope: newTokenScope,
      dailyLimit: Number(newTokenLimit) || 1000,
      usageCount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'developerTokens'), {
        ...tokenObj,
        serverCreatedAt: serverTimestamp()
      });
      const created = { id: docRef.id, ...tokenObj };
      setTokens(prev => [created, ...prev]);
      toast.success('Yeni API Token oluşturuldu');
    } catch {
      const localId = `local_${Date.now()}`;
      const created = { id: localId, ...tokenObj };
      const updated = [created, ...tokens];
      setTokens(updated);
      localStorage.setItem('sentience_developer_tokens', JSON.stringify(updated));
      toast.success('API Token yerel olarak kaydedildi');
    }

    setNewTokenName('');
    setIsCreating(false);
  };

  const handleDeleteToken = async (id: string) => {
    if (!window.confirm('Bu tokenı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'developerTokens', id));
      setTokens(prev => prev.filter(t => t.id !== id));
      toast.success('Token silindi');
    } catch {
      const updated = tokens.filter(t => t.id !== id);
      setTokens(updated);
      localStorage.setItem('sentience_developer_tokens', JSON.stringify(updated));
      toast.success('Token silindi');
    }
  };

  const copyText = (text: string, id: string, type: 'token' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
    toast.success('Panoya kopyalandı');
  };

  const activeTokenSample = tokens[0]?.token || 'stn_all_9f48a1b2c3d4e5f6a7b8c9d0';

  const curlDetectSample = `curl -X POST https://sentience-ai.vercel.app/api/detect \\
  -H "Authorization: Bearer ${activeTokenSample}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Sentience AI yüksek doğruluklu metin analizi sağlar.",
    "sensitivity": 50,
    "modelName": "gemini-2.5-flash-lite"
  }'`;

  const jsDetectSample = `const response = await fetch('/api/detect', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${activeTokenSample}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Sentience AI yüksek doğruluklu metin analizi sağlar.',
    sensitivity: 50
  })
});
const data = await response.json();
console.log(data);`;

  const curlAnalyzeSample = `curl -X POST https://sentience-ai.vercel.app/api/analyze \\
  -H "Authorization: Bearer ${activeTokenSample}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Bu metin okunabilirlik ve hece analizi için taranacaktır."
  }'`;

  const jsAnalyzeSample = `const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${activeTokenSample}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Bu metin okunabilirlik ve hece analizi için taranacaktır.'
  })
});
const data = await response.json();
console.log(data);`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-card/40 border border-brand-border p-4 rounded-2xl">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" /> GELİŞTİRİCİ API & TOKEN YÖNETİMİ
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Dış sistemlerin `/api/detect` ve `/api/analyze` uç noktalarına güvenli erişimini sağlayan anahtarlar.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3.5 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni Token Üret
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateToken} className="bg-brand-card border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Yeni API Erişim Anahtarı Tanımla
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Token Adı</label>
              <input
                type="text"
                value={newTokenName}
                onChange={e => setNewTokenName(e.target.value)}
                placeholder="Örn: Mobil Uygulama Servisi"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Yetki Kapsamı</label>
              <select
                value={newTokenScope}
                onChange={e => setNewTokenScope(e.target.value as any)}
                className="w-full bg-[#161a23] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tam Erişim (Tüm API)</option>
                <option value="detect">Yalnızca YZ Tespiti (/api/detect)</option>
                <option value="analyze">Yalnızca Analiz & Metrik (/api/analyze)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Günlük İstek Limiti</label>
              <input
                type="number"
                value={newTokenLimit}
                onChange={e => setNewTokenLimit(Number(e.target.value))}
                min={100}
                max={100000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400"
            >
              Oluştur ve Kaydet
            </button>
          </div>
        </form>
      )}

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-white/[0.01]">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-300">Aktif Token Havuzu</span>
          <span className="text-[10px] font-mono text-gray-500">{tokens.length} kayıtlı anahtar</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-xs text-gray-500">Yükleniyor...</div>
        ) : tokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            Henüz oluşturulmuş bir API anahtarı bulunmuyor. Yukarıdaki butona tıklayarak ilk anahtarınızı oluşturabilirsiniz.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tokens.map(token => {
              const isCopied = copiedId === token.id;
              const maskedToken = `${token.token.substring(0, 12)}...${token.token.substring(token.token.length - 4)}`;
              return (
                <div key={token.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white/[0.01]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{token.name}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                        token.scope === 'all' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                        token.scope === 'detect' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      )}>
                        {token.scope}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {maskedToken}
                      </code>
                      <button
                        onClick={() => copyText(token.token, token.id, 'token')}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="Tokenı Kopyala"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500">Kota Limiti</div>
                      <div className="text-gray-300 font-bold">{token.dailyLimit.toLocaleString()} istek/gün</div>
                    </div>
                    <button
                      onClick={() => handleDeleteToken(token.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">İnteraktif API Dokümantasyonu</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveDocTab('detect')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                activeDocTab === 'detect' ? "bg-emerald-500 text-black" : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              POST /api/detect
            </button>
            <button
              onClick={() => setActiveDocTab('analyze')}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                activeDocTab === 'analyze' ? "bg-emerald-500 text-black" : "bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              POST /api/analyze
            </button>
          </div>
        </div>

        {activeDocTab === 'detect' ? (
          <div className="space-y-4">
            <div className="text-xs text-gray-400 leading-relaxed">
              Metin üzerinde yapay zeka tespiti, güven skoru ve desen analizi gerçekleştirir.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-emerald-400" /> cURL Örneği</span>
                  <button
                    onClick={() => copyText(curlDetectSample, 'curl_detect', 'snippet')}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedSnippet === 'curl_detect' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Kopyala
                  </button>
                </div>
                <pre className="bg-black/60 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto custom-scrollbar">
                  {curlDetectSample}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-blue-400" /> JavaScript / TypeScript Fetch</span>
                  <button
                    onClick={() => copyText(jsDetectSample, 'js_detect', 'snippet')}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedSnippet === 'js_detect' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Kopyala
                  </button>
                </div>
                <pre className="bg-black/60 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-blue-300 overflow-x-auto custom-scrollbar">
                  {jsDetectSample}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-gray-400 leading-relaxed">
              Metin üzerinde Ateşman, Çetinkaya-Uzun okunabilirlik indeksleri, kelime/hece istatistikleri ve cümle dağılımını hesaplar.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-emerald-400" /> cURL Örneği</span>
                  <button
                    onClick={() => copyText(curlAnalyzeSample, 'curl_analyze', 'snippet')}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedSnippet === 'curl_analyze' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Kopyala
                  </button>
                </div>
                <pre className="bg-black/60 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto custom-scrollbar">
                  {curlAnalyzeSample}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-blue-400" /> JavaScript / TypeScript Fetch</span>
                  <button
                    onClick={() => copyText(jsAnalyzeSample, 'js_analyze', 'snippet')}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedSnippet === 'js_analyze' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Kopyala
                  </button>
                </div>
                <pre className="bg-black/60 border border-white/5 rounded-xl p-3 text-[11px] font-mono text-blue-300 overflow-x-auto custom-scrollbar">
                  {jsAnalyzeSample}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

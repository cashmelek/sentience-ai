import React, { useState, useEffect, useCallback } from 'react';
import { db, auth, isQuotaError, setQuotaExhausted, isQuotaExhausted } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AppUser, PLAN_LIMITS, SubscriptionPlan } from '../types';
import { apiKeyManager } from '../services/apiKeyManager';
import {
  collection, query, doc, updateDoc, deleteDoc, where, getDocs, getDoc,
  writeBatch, orderBy, limit, addDoc, setDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import {
  Users, ShieldCheck, Zap, Activity, Check, Search, Database, Settings,
  AlertTriangle, Save, Trash2, RefreshCw, History, User as UserIcon,
  Key, RotateCw, Heart, Plus, X, GraduationCap, Cpu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com', 'yasindemir111@gmail.com'];

export function AdminPanel() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalProjects: 0, totalTones: 0, trainingReadyCount: 0 });
  const [apiKeysStatus, setApiKeysStatus] = useState<any[]>([]);
  const [view, setView] = useState<'users' | 'sentinel'>('users');
  const [quotaWarning, setQuotaWarning] = useState(false);
  
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ provider: 'gemini' as 'gemini' | 'google-search', value: '' });
  const [isAddingKey, setIsAddingKey] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    sentinelEnabled: true,
    auditorModel: 'gemini-2.0-flash',
    ghostWriterModel: 'gemini-2.0-flash',
    customModelId: '',
    useCustomModel: false
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user?.email?.toLowerCase()?.trim() || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'apiKeys'), orderBy('provider'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setApiKeysStatus(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const fetchAllData = useCallback(async () => {
    if (isQuotaExhausted()) setQuotaWarning(true);
    setIsRefreshing(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
      setUsers(usersData);

      const trainingQuery = query(collection(db, 'projects'), where('isTrainingReady', '==', true), where('isTrained', '!=', true));
      const trainingSnap = await getDocs(trainingQuery);
      
      setStats(prev => ({ 
        ...prev, 
        totalProjects: usersData.reduce((a, u) => a + (u.dailyUsage || 0), 0),
        trainingReadyCount: trainingSnap.size 
      }));

      const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
      if (settingsSnap.exists()) setSystemSettings(prev => ({ ...prev, ...settingsSnap.data() }));

    } catch (err: any) {
      if (isQuotaError(err)) setQuotaExhausted(true);
    }
    setLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        ...systemSettings, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      toast.success('Sistem ayarları güncellendi.');
    } catch { toast.error('Ayarlar kaydedilemedi.'); }
    finally { setIsSaving(false); }
  };

  const handleRotateKey = (type: 'gemini' | 'search') => {
    const success = type === 'gemini' ? apiKeyManager.rotateGeminiKey() : apiKeyManager.rotateSearchKey();
    if (success) toast.success(`${type.toUpperCase()} anahtarı döndürüldü.`);
    else toast.error('Hata oluştu.');
  };

  const handleAddKey = async () => {
    if (!newKey.value) return;
    setIsAddingKey(true);
    try {
      await apiKeyManager.addNewKey(newKey.provider, newKey.value);
      toast.success('Yeni anahtar eklendi.');
      setNewKey({ ...newKey, value: '' });
      setShowAddKey(false);
    } catch (e: any) { toast.error(e.message || 'Anahtar eklenemedi.'); }
    finally { setIsAddingKey(false); }
  };

  const handleDeleteAPIKey = async (id: string) => {
    if (!window.confirm('Bu anahtarı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'apiKeys', id));
      await apiKeyManager.syncWithFirestore();
      toast.success('Anahtar silindi.');
    } catch { toast.error('Silme başarısız.'); }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<AppUser>) => {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
      toast.success('Kullanıcı güncellendi.');
      fetchAllData();
    } catch { toast.error('Hata.'); }
  };

  const isAdmin = currentUserEmail ? ADMIN_EMAILS.includes(currentUserEmail) : false;

  if (authLoading || loading) return <div className="flex-1 p-8 flex items-center justify-center"><Activity className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  if (!isAdmin) return <div className="flex-1 p-8 flex items-center justify-center text-red-500 font-black uppercase tracking-widest">YETKİSİZ ERİŞİM</div>;

  return (
    <div className="flex-1 p-4 lg:p-8 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
      {quotaWarning && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-xs font-bold text-amber-400 uppercase">Firestore Kota Sınırı Aşıldı</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <h2 className="text-xl lg:text-2xl font-black text-white tracking-tighter flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-500" /> YÖNETİM PANELİ
        </h2>
        <div className="flex items-center gap-4">
           <button onClick={fetchAllData} disabled={isRefreshing} className="p-2 bg-brand-card border border-brand-border rounded-xl"><RefreshCw className={cn("w-4 h-4 text-emerald-500", isRefreshing && "animate-spin")} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricItem icon={Users} label="Kullanıcı" value={users.length} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        <MetricItem icon={Activity} label="Günlük Yük" value={stats.totalProjects} color="text-blue-500" bgColor="bg-blue-500/10" />
        <MetricItem icon={GraduationCap} label="Eğitime Hazır" value={stats.trainingReadyCount} color="text-amber-400" bgColor="bg-amber-500/10" />
        <MetricItem icon={Database} label="Toplam Proje" value={stats.totalProjects} color="text-purple-500" bgColor="bg-purple-500/10" />
        <MetricItem icon={ShieldCheck} label="Admin" value={ADMIN_EMAILS.length} color="text-red-500" bgColor="bg-red-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Model Management - NEW */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-500" /> MODEL DÖNDÜRME (FINE-TUNING)</h3>
            <div className="space-y-4">
              <ToggleItem label="Tuned Model Kullan" sub="Eğitilmiş özel modeli aktif eder" value={systemSettings.useCustomModel} onChange={(v: any) => setSystemSettings(s => ({ ...s, useCustomModel: v }))} />
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Aktif Model ID</span>
                <input 
                  type="text" 
                  placeholder="tunedModels/sentience-v1..." 
                  value={systemSettings.customModelId}
                  onChange={(e) => setSystemSettings(s => ({ ...s, customModelId: e.target.value }))}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                />
                <p className="text-[9px] text-gray-600 italic">Not: Tuned model aktifken tüm kullanıcılar otomatik olarak bu modele yönlendirilir.</p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Yedek Model (Fallback)</span>
                <select value={systemSettings.ghostWriterModel} onChange={(e) => setSystemSettings(s => ({ ...s, ghostWriterModel: e.target.value }))} className="w-full bg-brand-bg border border-brand-border rounded-xl p-2 text-xs text-gray-300">
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                </select>
              </div>

              <button onClick={handleSaveSettings} disabled={isSaving} className="w-full py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} MODELİ AKTİF ET
              </button>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Key className="w-4 h-4 text-blue-500" /> API ANAHTARLARI</h3>
              <button onClick={() => setShowAddKey(!showAddKey)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            
            <AnimatePresence>
              {showAddKey && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden border-b border-brand-border pb-4 space-y-3">
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setNewKey({ ...newKey, provider: 'gemini' })} className={cn("py-2 text-[9px] font-black rounded-xl border transition-all", newKey.provider === 'gemini' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-white/5 border-brand-border text-gray-500")}>GEMINI</button>
                     <button onClick={() => setNewKey({ ...newKey, provider: 'google-search' })} className={cn("py-2 text-[9px] font-black rounded-xl border transition-all", newKey.provider === 'google-search' ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-white/5 border-brand-border text-gray-500")}>SEARCH</button>
                   </div>
                   <input type="password" placeholder="Anahtarı Yapıştırın" value={newKey.value} onChange={(e) => setNewKey({ ...newKey, value: e.target.value })} className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-xs text-white" />
                   <button onClick={handleAddKey} disabled={isAddingKey} className="w-full py-2 bg-emerald-500 text-black rounded-xl text-[9px] font-black">EKLE</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
               <div>
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold text-gray-400 uppercase">Gemini Havuzu</span><button onClick={() => handleRotateKey('gemini')} className="text-[9px] font-black text-emerald-500"><RotateCw className="w-3 h-3 inline mr-1" /> DÖNDÜR</button></div>
                  <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                    {apiKeysStatus.filter(k => k.provider === 'gemini').map((k: any) => (
                      <div key={k.id} className="p-2 bg-white/[0.02] border border-brand-border rounded-lg flex items-center justify-between group">
                         <div className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full", k.status === 'active' ? "bg-emerald-500" : "bg-red-500")} /><span className="text-[10px] font-mono text-gray-300">{k.maskedKey}</span></div>
                         {k.isDynamic && <button onClick={() => handleDeleteAPIKey(k.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Kullanıcı Yönetimi</h3>
            <span className="text-[10px] text-gray-600 font-mono">{users.length} Kayıt</span>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-brand-border bg-white/[0.02]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Kullanıcı</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Kota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><div className="text-sm text-gray-300">{u.email}</div><div className="text-[9px] text-gray-600 font-mono">{u.uid}</div></td>
                    <td className="px-6 py-4">
                      <select defaultValue={u.plan} onChange={(e) => handleUpdateUser(u.uid, { plan: e.target.value as any })} className="bg-brand-bg border border-brand-border text-[10px] rounded px-2 py-1 text-gray-300">
                        <option value="free">Ücretsiz</option><option value="pro">Pro</option><option value="premium">Premium</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{u.dailyUsage || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const MetricItem = ({ icon: Icon, label, value, color, bgColor }: any) => (
  <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg">
    <div className={cn("p-3 rounded-xl", bgColor)}><Icon className={cn("w-5 h-5", color)} /></div>
    <div><div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">{label}</div><div className="text-2xl font-black text-white">{value}</div></div>
  </div>
);

const ToggleItem = ({ label, sub, value, onChange }: any) => (
  <div className="flex items-center justify-between p-2 hover:bg-white/[0.02] rounded-xl transition-colors">
    <div className="flex flex-col"><span className="text-xs font-bold text-gray-300">{label}</span><span className="text-[9px] text-gray-500">{sub}</span></div>
    <button onClick={() => onChange(!value)} className={cn("w-10 h-5 rounded-full relative transition-all", value ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-gray-700")}>
      <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm", value ? "left-6" : "left-1")} />
    </button>
  </div>
);

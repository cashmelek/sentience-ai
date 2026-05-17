import React, { useState, useEffect, useCallback } from 'react';
import { db, auth, isQuotaError, setQuotaExhausted, isQuotaExhausted } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AppUser, PLAN_LIMITS, SubscriptionPlan } from '../types';
import { apiKeyManager } from '../services/apiKeyManager';
import {
  collection,
  query,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  getDoc,
  writeBatch,
  orderBy,
  limit,
  addDoc,
  setDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import {
  Users, ShieldCheck, Zap, Activity, MoreVertical, Check, Search,
  Server, Database, Settings, Globe, Cpu, AlertTriangle, Save,
  Trash2, RefreshCw, MessageSquare, History, ChevronDown, ChevronRight, User as UserIcon,
  Key, RotateCw, Heart, Plus, X, GraduationCap
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
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalProjects: 0, totalTones: 0, trainingReadyCount: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [sentinelLogs, setSentinelLogs] = useState<any[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [tones, setTones] = useState<any[]>([]);
  const [apiKeysStatus, setApiKeysStatus] = useState<any[]>([]);
  const [view, setView] = useState<'users' | 'tones' | 'sentinel'>('users');
  const [assigningUser, setAssigningUser] = useState<AppUser | null>(null);
  const [quotaWarning, setQuotaWarning] = useState(false);
  
  // API Key Management
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ provider: 'gemini' as 'gemini' | 'google-search', value: '' });
  const [isAddingKey, setIsAddingKey] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'Size daha iyi bir deneyim sunmak için sistemimizi güncelliyoruz. Lütfen kısa bir süre sonra tekrar deneyin.',
    defaultIntensity: 80,
    apiStatus: 'online',
    sentinelEnabled: true,
    sentinelStatus: 'online' as 'online' | 'error' | 'quota_full',
    sentinelLastMessage: '',
    auditorSensitivity: 70,
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
      // 1. Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(d => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email || 'Email Yok',
          role: (data.role === 'admin' ? 'admin' : 'user'),
          plan: (['free', 'pro', 'premium'].includes(data.plan) ? data.plan : 'free') as SubscriptionPlan,
          dailyUsage: typeof data.dailyUsage === 'number' ? data.dailyUsage : 0,
          lastResetDate: data.lastResetDate || ''
        } as AppUser;
      });
      setUsers(usersData);

      // 2. Training Metrics
      const trainingQuery = query(collection(db, 'projects'), where('isTrainingReady', '==', true), where('isTrained', '!=', true));
      const trainingSnap = await getDocs(trainingQuery);
      
      // 3. Tones
      const tonesSnap = await getDocs(collection(db, 'customTones'));
      setTones(tonesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      setStats({
        totalProjects: usersData.reduce((a, u) => a + (u.dailyUsage || 0), 0),
        totalTones: tonesSnap.size,
        trainingReadyCount: trainingSnap.size 
      });

      // 4. System Settings
      const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setSystemSettings(prev => ({ ...prev, ...data }));
      }

      // 5. Logs
      const qLogs = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(15));
      const logsSnap = await getDocs(qLogs);
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const qSentinel = query(collection(db, 'sentinelLogs'), orderBy('timestamp', 'desc'), limit(100));
      const sentinelSnap = await getDocs(qSentinel);
      setSentinelLogs(sentinelSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err: any) {
      if (isQuotaError(err)) setQuotaExhausted(true);
      console.error('Data fetch error:', err);
    }
    setLoading(false);
    setIsRefreshing(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const logAction = async (action: string, target: string) => {
    try {
      await addDoc(collection(db, 'activityLogs'), {
        action,
        target,
        admin: auth.currentUser?.email,
        timestamp: serverTimestamp()
      });
    } catch (e) { console.error('Log error:', e); }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'system'), { 
        ...systemSettings, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      logAction('Settings Updated', 'Global');
      toast.success('Ayarlar güncellendi.');
    } catch { toast.error('Hata.'); }
    finally { setIsSaving(false); }
  };

  const handleRotateKey = (type: 'gemini' | 'search') => {
    const success = type === 'gemini' ? apiKeyManager.rotateGeminiKey() : apiKeyManager.rotateSearchKey();
    if (success) {
      toast.success(`${type.toUpperCase()} anahtarı döndürüldü.`);
      logAction('Key Rotated', type);
    } else toast.error('Hata.');
  };

  const handleResetAPIKeys = async () => {
    if (!window.confirm('Tüm API anahtarlarını sıfırlamak istiyor musunuz?')) return;
    try {
      await apiKeyManager.resetAllKeys();
      toast.success('Sıfırlandı.');
      logAction('All Keys Reset', 'API Manager');
    } catch { toast.error('Hata.'); }
  };

  const handleAddKey = async () => {
    if (!newKey.value) return;
    setIsAddingKey(true);
    try {
      await apiKeyManager.addNewKey(newKey.provider, newKey.value);
      toast.success('Eklendi.');
      setNewKey({ ...newKey, value: '' });
      setShowAddKey(false);
      logAction('New Key Added', newKey.provider);
    } catch (e: any) { toast.error(e.message); }
    finally { setIsAddingKey(false); }
  };

  const handleDeleteAPIKey = async (id: string) => {
    if (!window.confirm('Silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'apiKeys', id));
      await apiKeyManager.syncWithFirestore();
      toast.success('Silindi.');
    } catch { toast.error('Hata.'); }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<AppUser>) => {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
      setEditingUser(null);
      toast.success('Güncellendi.');
      fetchAllData();
    } catch { toast.error('Hata.'); }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (ADMIN_EMAILS.includes(email)) return toast.error('Admin silinemez!');
    if (!window.confirm(`${email} silinsin mi?`)) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      toast.success('Silindi.');
      fetchAllData();
    } catch { toast.error('Hata.'); }
  };

  const handleResetAllUsage = async () => {
    if (!window.confirm('Tüm kotaları sıfırla?')) return;
    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, 'users'));
      snapshot.docs.forEach((userDoc) => batch.update(userDoc.ref, { dailyUsage: 0 }));
      await batch.commit();
      toast.success('Sıfırlandı.');
      fetchAllData();
    } catch { toast.error('Hata.'); }
    finally { setIsResetting(false); }
  };

  const handleDeleteTone = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" silinsin mi?`)) return;
    try {
      await deleteDoc(doc(db, 'customTones', id));
      toast.success('Silindi.');
      fetchAllData();
    } catch { toast.error('Hata.'); }
  };

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredUsers = users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTones = tones.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const groupedLogs = sentinelLogs.reduce((acc: any[], log) => {
    const lastGroup = acc[acc.length - 1];
    const logTime = log.timestamp?.toDate ? log.timestamp.toDate().getTime() : 0;
    const lastTime = lastGroup?.timestamp?.toDate ? lastGroup.timestamp.toDate().getTime() : 0;
    if (lastGroup && lastGroup.userEmail === log.userEmail && Math.abs(logTime - lastTime) < 5000) {
      lastGroup.subLogs = [...(lastGroup.subLogs || []), log];
      if (!lastGroup.message.includes(log.message)) lastGroup.message += ` | ${log.message}`;
    } else acc.push({ ...log, subLogs: [log] });
    return acc;
  }, []);

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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-brand-card border border-brand-border rounded-xl p-1">
            <button onClick={() => setView('users')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'users' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>Kullanıcılar</button>
            <button onClick={() => setView('tones')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'tones' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>Tarzlar</button>
            <button onClick={() => setView('sentinel')} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", view === 'sentinel' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>Sentinel</button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm w-full sm:w-64 text-gray-300 outline-none focus:border-emerald-500 transition-colors" />
          </div>
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
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Cpu className="w-4 h-4 text-emerald-500" /> MODEL DÖNDÜRME</h3>
            <div className="space-y-4">
              <ToggleItem label="Tuned Model Kullan" sub="Eğitilmiş modeli aktif eder" value={systemSettings.useCustomModel} onChange={(v: any) => setSystemSettings(s => ({ ...s, useCustomModel: v }))} />
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Aktif Model ID</span>
                <input type="text" placeholder="tunedModels/sentience-v1..." value={systemSettings.customModelId} onChange={(e) => setSystemSettings(s => ({ ...s, customModelId: e.target.value }))} className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500" />
              </div>
              <button onClick={handleSaveSettings} disabled={isSaving} className="w-full py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} MODELİ GÜNCELLE
              </button>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Key className="w-4 h-4 text-blue-500" /> API HAVUZU</h3>
              <button onClick={() => setShowAddKey(!showAddKey)} className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <AnimatePresence>
              {showAddKey && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden border-b border-brand-border pb-4 space-y-3">
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setNewKey({ ...newKey, provider: 'gemini' })} className={cn("py-2 text-[9px] font-black rounded-xl border transition-all", newKey.provider === 'gemini' ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" : "bg-white/5 border-brand-border text-gray-500")}>GEMINI</button>
                     <button onClick={() => setNewKey({ ...newKey, provider: 'google-search' })} className={cn("py-2 text-[9px] font-black rounded-xl border transition-all", newKey.provider === 'google-search' ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-white/5 border-brand-border text-gray-500")}>SEARCH</button>
                   </div>
                   <input type="password" placeholder="Anahtar" value={newKey.value} onChange={(e) => setNewKey({ ...newKey, value: e.target.value })} className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-xs text-white" />
                   <button onClick={handleAddKey} disabled={isAddingKey} className="w-full py-2 bg-emerald-500 text-black rounded-xl text-[9px] font-black">EKLE</button>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-4">
               <div>
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold text-gray-400 uppercase">Gemini</span><button onClick={() => handleRotateKey('gemini')} className="text-[9px] font-black text-emerald-500"><RotateCw className="w-3 h-3 inline mr-1" /> DÖNDÜR</button></div>
                  <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                    {apiKeysStatus.filter(k => k.provider === 'gemini').map((k: any) => (
                      <div key={k.id} className="p-2 bg-white/[0.02] border border-brand-border rounded-lg flex items-center justify-between group">
                         <div className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full", k.status === 'active' ? "bg-emerald-500" : "bg-red-500")} /><span className="text-[10px] font-mono text-gray-300">{k.maskedKey}</span></div>
                         {k.isDynamic && <button onClick={() => handleDeleteAPIKey(k.id)} className="opacity-0 group-hover:opacity-100 text-red-500"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-bold text-gray-400 uppercase">Search (100)</span><button onClick={() => handleRotateKey('search')} className="text-[9px] font-black text-blue-500"><RotateCw className="w-3 h-3 inline mr-1" /> DÖNDÜR</button></div>
                  <div className="grid grid-cols-1 gap-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {apiKeysStatus.filter(k => k.provider === 'google-search').map((k: any) => (
                      <div key={k.id} className="p-3 bg-white/[0.02] border border-brand-border rounded-xl space-y-2 group">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full", k.status === 'active' ? "bg-blue-500" : "bg-red-500")} /><span className="text-[10px] font-mono text-gray-300">{k.maskedKey}</span></div>
                            <span className="text-[10px] text-gray-500">{k.usageCount || 0}/100</span>
                         </div>
                         <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className={cn("h-full transition-all duration-700", (k.usageCount || 0) > 80 ? "bg-red-500" : "bg-blue-500")} style={{ width: `${Math.min(k.usageCount || 0, 100)}%` }} /></div>
                      </div>
                    ))}
                  </div>
               </div>
               <button onClick={handleResetAPIKeys} className="w-full py-2 bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase"><Heart className="w-3 h-3 inline mr-1" /> SIFIRLA</button>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-4 h-4 text-orange-500" /> AKTİVİTE GÜNLÜĞÜ</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {logs.map(log => (
                <div key={log.id} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl">
                  <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-300 uppercase">{log.action}</span><span className="text-[8px] text-gray-600">{log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : ''}</span></div>
                  <div className="text-[9px] text-gray-500 truncate">{log.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[1200px]">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{view === 'users' ? 'Kullanıcı Yönetimi' : view === 'tones' ? 'Tarz Yönetimi' : 'Sentinel Logları'}</h3>
            <span className="text-[10px] text-gray-600 font-mono">{view === 'users' ? filteredUsers.length : view === 'tones' ? filteredTones.length : groupedLogs.length} Kayıt</span>
          </div>
          <div className="overflow-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-white/[0.02]">
                  {view === 'users' ? (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Kullanıcı</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Plan</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Kota</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-right">İşlem</th>
                    </>
                  ) : view === 'tones' ? (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Tarz Adı</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Açıklama</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-right">İşlem</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Kullanıcı</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500">Özet</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 text-right">Tarih</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {view === 'users' ? filteredUsers.map(u => (
                  <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4"><div className="text-sm text-gray-300 font-bold">{u.email}</div><div className="text-[9px] text-gray-600 font-mono">{u.uid}</div></td>
                    <td className="px-6 py-4">
                      <select defaultValue={u.plan} onChange={(e) => handleUpdateUser(u.uid, { plan: e.target.value as any })} className="bg-brand-bg border border-brand-border text-[10px] rounded px-2 py-1 text-gray-300">
                        <option value="free">Ücretsiz</option><option value="pro">Pro</option><option value="premium">Premium</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{u.dailyUsage || 0}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setAssigningUser(u)} className="p-1 text-gray-600 hover:text-emerald-500 mr-2"><UserIcon className="w-4 h-4" /></button>
                       <button onClick={() => handleDeleteUser(u.uid, u.email)} className="p-1 text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                )) : view === 'tones' ? filteredTones.map(t => (
                   <tr key={t.id} className="hover:bg-white/[0.02]">
                     <td className="px-6 py-4 text-sm text-gray-300">{t.name}</td>
                     <td className="px-6 py-4 text-xs text-gray-500 truncate max-w-xs">{t.description}</td>
                     <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteTone(t.id, t.name)} className="text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                   </tr>
                )) : groupedLogs.map(log => {
                   const isExpanded = expandedLogs.includes(log.id);
                   return (
                     <React.Fragment key={log.id}>
                        <tr onClick={() => toggleLogExpansion(log.id)} className="hover:bg-white/[0.02] cursor-pointer">
                          <td className="px-6 py-4"><div className="flex items-center gap-2">{isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} <div className="text-[11px] font-bold text-gray-300">{log.userEmail}</div></div></td>
                          <td className="px-6 py-4 text-xs text-gray-500 truncate max-w-md">{log.message}</td>
                          <td className="px-6 py-4 text-[10px] text-gray-600 text-right">{log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : ''}</td>
                        </tr>
                        {isExpanded && (
                          <tr><td colSpan={3} className="bg-black/20 p-4">
                             <div className="space-y-2 border-l-2 border-emerald-500/30 pl-4">
                               {log.subLogs?.map((sub: any, idx: number) => (<div key={idx} className="text-xs text-gray-400">[{sub.status.toUpperCase()}] {sub.message} <span className="text-[10px] opacity-50">{sub.duration}ms</span></div>))}
                             </div>
                          </td></tr>
                        )}
                     </React.Fragment>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {assigningUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-brand-card border border-brand-border rounded-[32px] p-8 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="text-lg font-black text-white">PLAN ATAMA</h3>
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10"><div className="text-sm font-bold text-white">{assigningUser.email}</div></div>
            <div className="grid grid-cols-1 gap-3">
              {['free', 'pro', 'premium'].map((p) => (
                <button key={p} onClick={() => handleUpdateUser(assigningUser.uid, { plan: p as any })} className={cn("p-4 rounded-2xl border text-left transition-all", assigningUser.plan === p ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-white/5 border-brand-border text-gray-400 hover:border-white/20")}>
                  <div className="text-[10px] font-black uppercase">{p} Plan</div>
                </button>
              ))}
            </div>
            <button onClick={() => setAssigningUser(null)} className="w-full py-3 text-gray-500 text-xs">Vazgeç</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const MetricItem = ({ icon: Icon, label, value, color, bgColor }: any) => (
  <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg group hover:border-white/10 transition-all">
    <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", bgColor)}><Icon className={cn("w-5 h-5", color)} /></div>
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

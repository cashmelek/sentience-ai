import React, { useState, useEffect, useCallback } from 'react';
import { db, auth, isQuotaError, setQuotaExhausted, isQuotaExhausted } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AppUser, PLAN_LIMITS, SubscriptionPlan } from '../types';
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
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Users, ShieldCheck, Zap, Activity, MoreVertical, Check, Search, 
  Server, Database, Settings, Globe, Cpu, AlertTriangle, Save, 
  Trash2, RefreshCw, MessageSquare, History, ChevronDown, ChevronRight, User as UserIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com'];

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
  const [stats, setStats] = useState({ totalProjects: 0, totalTones: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [sentinelLogs, setSentinelLogs] = useState<any[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [tones, setTones] = useState<any[]>([]);
  const [view, setView] = useState<'users' | 'tones' | 'sentinel'>('users');
  const [assigningUser, setAssigningUser] = useState<AppUser | null>(null);
  const [quotaWarning, setQuotaWarning] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'Size daha iyi bir deneyim sunmak için sistemimizi güncelliyoruz. Lütfen kısa bir süre sonra tekrar deneyin.',
    defaultIntensity: 80,
    apiStatus: 'online',
    sentinelEnabled: true,
    sentinelStatus: 'online' as 'online' | 'error' | 'quota_full',
    sentinelLastMessage: '',
    auditorSensitivity: 70,
    auditorModel: 'gemini-2.5-flash',
    ghostWriterModel: 'gemini-2.5-flash'
  });

  // Auth state'i güvenli şekilde izle
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user?.email?.toLowerCase() || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Tüm admin verilerini tek seferde çek
  const fetchAllData = useCallback(async () => {
    if (isQuotaExhausted()) {
      setQuotaWarning(true);
      setLoading(false);
      return;
    }

    setIsRefreshing(true);
    try {
      // 1. Kullanıcılar
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
      setStats(prev => ({ ...prev, totalProjects: usersData.reduce((a, u) => a + (u.dailyUsage || 0), 0) }));
    } catch (err: any) {
      if (isQuotaError(err)) { setQuotaExhausted(true); setQuotaWarning(true); }
      else console.error('Kullanıcı verileri hatası:', err);
    }

    // 2. Tonlar
    try {
      const tonesSnap = await getDocs(collection(db, 'customTones'));
      setStats(prev => ({ ...prev, totalTones: tonesSnap.size }));
      setTones(tonesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      if (isQuotaError(err)) { setQuotaExhausted(true); setQuotaWarning(true); }
      else console.error('Ton verileri hatası:', err);
    }

    // 3. Sistem Ayarları
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'system'));
      if (settingsSnap.exists()) {
        setSystemSettings(prev => ({ ...prev, ...settingsSnap.data() }));
      }
    } catch (err: any) {
      if (isQuotaError(err)) { setQuotaExhausted(true); setQuotaWarning(true); }
      else console.error('Ayar verileri hatası:', err);
    }

    // 4. Aktivite Logları
    try {
      const qLogs = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(15));
      const logsSnap = await getDocs(qLogs);
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      if (isQuotaError(err)) { setQuotaExhausted(true); setQuotaWarning(true); }
      else console.error('Log verileri hatası:', err);
    }

    // 5. Sentinel Logları
    try {
      const qSentinel = query(collection(db, 'sentinelLogs'), orderBy('timestamp', 'desc'), limit(100));
      const sentinelSnap = await getDocs(qSentinel);
      setSentinelLogs(sentinelSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      if (isQuotaError(err)) { setQuotaExhausted(true); setQuotaWarning(true); }
      else console.error('Sentinel verileri hatası:', err);
    }

    if (!isQuotaExhausted()) {
      setLastRefresh(new Date());
      setQuotaWarning(false);
    }
    setLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const logAction = async (action: string, target: string) => {
    try {
      await addDoc(collection(db, 'activityLogs'), {
        action,
        target,
        admin: auth.currentUser?.email,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error('Log hatası:', e);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'settings', 'system'), {
        ...systemSettings,
        updatedAt: new Date().toISOString()
      });
      logAction('Sistem Ayarları Güncellendi', 'Global Settings');
      toast.success('Sistem ayarları başarıyla güncellendi.');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<AppUser>) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updates);
      logAction('Kullanıcı Güncellendi', uid);
      setEditingUser(null);
      toast.success('Kullanıcı güncellendi.');
      fetchAllData(); // Veriyi tazele
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata oluştu:', error);
      toast.error('Kullanıcı güncellenemedi.');
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (ADMIN_EMAILS.includes(email)) {
      toast.error('Yönetici hesabı silinemez!');
      return;
    }
    if (!window.confirm(`${email} kullanıcısını silmek istediğinizden emin misiniz?`)) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
      logAction('Kullanıcı Silindi', email);
      toast.success('Kullanıcı silindi.');
      fetchAllData();
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
      toast.error('Kullanıcı silinemedi.');
    }
  };

  const handleResetAllUsage = async () => {
    if (!window.confirm('Tüm kullanıcıların günlük kullanım kotalarını sıfırlamak istediğinizden emin misiniz?')) return;
    
    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      const snapshot = await getDocs(collection(db, 'users'));
      snapshot.docs.forEach((userDoc) => {
        batch.update(userDoc.ref, { dailyUsage: 0 });
      });
      await batch.commit();
      logAction('Tüm Kotalar Sıfırlandı', 'All Users');
      toast.success('Tüm kotalar sıfırlandı.');
      fetchAllData();
    } catch (error) {
      console.error('Kotalar sıfırlanırken hata:', error);
      toast.error('Kotalar sıfırlanamadı.');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredUsers = (users || []).filter(u => {
    try {
      const search = (searchTerm || '').toLowerCase();
      const email = (u?.email || '').toLowerCase();
      return email.includes(search);
    } catch (e) { return false; }
  });

  const filteredTones = tones.filter(t => {
    const search = searchTerm.toLowerCase();
    const name = (t.name || '').toLowerCase();
    return name.includes(search);
  });

  const filteredSentinelLogs = sentinelLogs.filter(log => {
    const search = searchTerm.toLowerCase();
    const email = (log.userEmail || '').toLowerCase();
    const msg = (log.message || '').toLowerCase();
    return email.includes(search) || msg.includes(search);
  });

  // Logları yazı bazlı grupla (Kullanıcı + Tarih Penceresi)
  const groupedLogs = filteredSentinelLogs.reduce((acc: any[], log) => {
    const lastGroup = acc[acc.length - 1];
    const logTime = log.timestamp?.toDate ? log.timestamp.toDate().getTime() : 0;
    const lastTime = lastGroup?.timestamp?.toDate ? lastGroup.timestamp.toDate().getTime() : 0;
    
    // Eğer aynı kullanıcı ve son logdan 5 saniye içindeyse aynı "yazı" kabul et
    if (lastGroup && lastGroup.userEmail === log.userEmail && Math.abs(logTime - lastTime) < 5000) {
      lastGroup.subLogs = [...(lastGroup.subLogs || []), log];
      // Mesajı birleştir veya güncelle
      if (!lastGroup.message.includes(log.message)) {
        lastGroup.message += ` | ${log.message}`;
      }
    } else {
      acc.push({ ...log, subLogs: [log] });
    }
    return acc;
  }, []);

  const handleDeleteTone = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" tarzını silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteDoc(doc(db, 'customTones', id));
      logAction('Tarz Silindi', name);
      toast.success('Tarz silindi.');
      fetchAllData();
    } catch (error) {
      console.error('Tarz silinemedi:', error);
      toast.error('Tarz silinemedi.');
    }
  };

  const toggleLogExpansion = (id: string) => {
    setExpandedLogs(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'pro' || u.plan === 'premium').length;
  const totalAPIUsage = users.reduce((acc, u) => acc + (u.dailyUsage || 0), 0);
  const isAdmin = currentUserEmail ? ADMIN_EMAILS.includes(currentUserEmail) : false;

  if (authLoading) return <div className="flex-1 p-8 flex items-center justify-center"><Activity className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  if (!isAdmin) return <div className="flex-1 p-8 flex items-center justify-center"><div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center max-w-md"><AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-bold text-white">YETKİSİZ ERİŞİM</h2></div></div>;
  if (loading) return <div className="flex-1 p-8 flex items-center justify-center"><Activity className="w-8 h-8 text-emerald-500 animate-spin" /></div>;

  return (
    <div className="flex-1 p-4 lg:p-8 flex flex-col gap-6 lg:gap-8 h-full overflow-y-auto custom-scrollbar">
      {quotaWarning && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1"><p className="text-sm font-bold text-amber-400">Firestore Kota Sınırına Ulaşıldı</p></div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" /> YÖNETİM PANELİ
          </h2>
        </div>
        
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
          <button onClick={fetchAllData} disabled={isRefreshing} className="p-2 bg-brand-card border border-brand-border rounded-xl hover:border-emerald-500/30 transition-all"><RefreshCw className={cn("w-4 h-4 text-emerald-500", isRefreshing && "animate-spin")} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricItem icon={Users} label="Toplam Kullanıcı" value={totalUsers} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        <MetricItem icon={Zap} label="Premium Üyeler" value={proUsers} color="text-amber-500" bgColor="bg-amber-500/10" />
        <MetricItem icon={Activity} label="Günlük API Yükü" value={totalAPIUsage} color="text-blue-500" bgColor="bg-blue-500/10" />
        <MetricItem icon={Database} label="Toplam Proje" value={stats.totalProjects} color="text-purple-500" bgColor="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><Settings className="w-4 h-4 text-amber-500" /> SİSTEM AYARLARI</h3>
            <div className="space-y-4">
              <ToggleItem label="Bakım Modu" sub="Siteyi kapatır" value={systemSettings.maintenanceMode} onChange={(v) => setSystemSettings(s => ({ ...s, maintenanceMode: v }))} />
              <ToggleItem label="Sentinel Servisi" sub="İntihal denetimi" value={systemSettings.sentinelEnabled} onChange={(v) => setSystemSettings(s => ({ ...s, sentinelEnabled: v }))} />
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300">Auditor Analiz Modeli</span>
                <select value={systemSettings.auditorModel} onChange={(e) => setSystemSettings(s => ({ ...s, auditorModel: e.target.value }))} className="w-full bg-brand-bg border border-brand-border rounded-xl p-2 text-xs text-gray-300 outline-none focus:border-emerald-500">
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Hızlı)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Derin)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300">GhostWriter Modeli</span>
                <select value={systemSettings.ghostWriterModel} onChange={(e) => setSystemSettings(s => ({ ...s, ghostWriterModel: e.target.value }))} className="w-full bg-brand-bg border border-brand-border rounded-xl p-2 text-xs text-gray-300 outline-none focus:border-emerald-500">
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={handleSaveSettings} disabled={isSaving} className="py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2">
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} KAYDET
                </button>
                <button onClick={handleResetAllUsage} disabled={isResetting} className="py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2">
                   KOTA SIFIRLA
                </button>
              </div>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-4 h-4 text-blue-500" /> SON AKTİVİTELER</h3>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl">
                  <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-bold text-gray-300">{log.action}</span><span className="text-[8px] text-gray-600">{log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : ''}</span></div>
                  <div className="text-[9px] text-gray-500 truncate">{log.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
              {view === 'users' ? 'KULLANICI YÖNETİMİ' : view === 'tones' ? 'TARZ YÖNETİMİ' : 'SENTINEL LOGLARI'}
            </h3>
            <span className="text-[10px] text-gray-600 font-mono">
              {view === 'users' ? filteredUsers.length : view === 'tones' ? filteredTones.length : groupedLogs.length} Sonuç
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-white/[0.02]">
                  {view === 'users' ? (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Kullanıcı (E-posta)</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Rol</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Plan</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Kota</th>
                    </>
                  ) : view === 'tones' ? (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Tarz Adı</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Açıklama</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Tarih</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Kullanıcı / Durum</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Mesaj Özeti</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Tarih</th>
                    </>
                  )}
                  {view !== 'sentinel' && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">İşlem</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {view === 'users' ? (
                  filteredUsers.map(u => {
                    const isEditing = editingUser === u.uid;
                    return (
                      <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4"><div className="text-sm font-medium text-gray-300">{u.email}</div><div className="text-[9px] text-gray-600 font-mono">{u.uid}</div></td>
                        <td className="px-6 py-4">
                          {isEditing && !ADMIN_EMAILS.includes(u.email || '') ? (
                            <select defaultValue={u.role} onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as 'admin' | 'user' })} className="bg-brand-bg border border-brand-border text-[10px] rounded-md px-2 py-1 text-gray-300">
                              <option value="user">Kullanıcı</option>
                              <option value="admin">Yönetici</option>
                            </select>
                          ) : (
                            <span className={cn("px-2 py-1 text-[10px] font-bold uppercase rounded-md border", u.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20")}>{u.role}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select defaultValue={u.plan} onChange={(e) => handleUpdateUser(u.uid, { plan: e.target.value as SubscriptionPlan })} className="bg-brand-bg border border-brand-border text-[10px] rounded-md px-2 py-1 text-gray-300">
                              <option value="free">Ücretsiz</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                            </select>
                          ) : (
                            <span className={cn("px-2 py-1 text-[10px] font-bold uppercase rounded-md border", u.plan === 'premium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : u.plan === 'pro' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20")}>{u.plan}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-gray-500">{u.dailyUsage} / {u.role === 'admin' ? '∞' : (PLAN_LIMITS[u.plan] || 10)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setAssigningUser(u)} className="p-1.5 text-gray-600 hover:text-blue-500 transition-colors" title="Plan Atama"><UserIcon className="w-4 h-4" /></button>
                            <button onClick={() => setEditingUser(isEditing ? null : u.uid)} className="p-1.5 text-gray-600 hover:text-emerald-500 transition-colors">{isEditing ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}</button>
                            <button onClick={() => handleDeleteUser(u.uid, u.email || '')} className="p-1.5 text-gray-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : view === 'tones' ? (
                  filteredTones.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-300">{t.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">{t.description}</td>
                      <td className="px-6 py-4 text-[10px] text-gray-500 text-right">{t.createdAt?.toDate ? new Date(t.createdAt.toDate()).toLocaleDateString() : ''}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteTone(t.id, t.name)} className="p-1.5 text-gray-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  groupedLogs.map(log => {
                    const isExpanded = expandedLogs.includes(log.id);
                    return (
                      <React.Fragment key={log.id}>
                        <tr onClick={() => toggleLogExpansion(log.id)} className="hover:bg-white/[0.02] transition-all cursor-pointer group border-b border-brand-border/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                              <div className="flex flex-col">
                                <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                                  <UserIcon className="w-3 h-3 text-emerald-500/50" /> {log.userEmail || 'Anonim'}
                                </div>
                                <div className={cn("text-[9px] font-black uppercase mt-1", log.status === 'success' ? "text-emerald-500" : "text-red-500")}>
                                  {log.status === 'success' ? 'BAŞARILI' : 'HATA'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-500 truncate max-w-md">
                              {log.subLogs?.length > 1 ? `${log.subLogs.length} İşlem (Toplu)` : log.message}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-gray-600 text-right font-mono">
                            {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString('tr-TR') : ''}
                          </td>
                        </tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <tr>
                              <td colSpan={3} className="px-0 bg-black/20">
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="p-6 border-l-2 border-emerald-500/30 mx-6 my-2 space-y-6">
                                    <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 mb-4">
                                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">KULLANICI BİLGİSİ</div>
                                      <div className="text-sm font-bold text-white flex items-center gap-2">
                                        <UserIcon className="w-4 h-4 text-emerald-500" />
                                        Kullanıcı maili : <span className="text-emerald-400">{log.userEmail || 'ismail.kaleci@gmail.com'}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      {log.subLogs?.map((sub: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black text-gray-500 uppercase">{idx + 1}. İŞLEM</span>
                                            <span className="text-[10px] font-mono text-gray-600">{sub.duration}ms</span>
                                          </div>
                                          <div className="text-xs text-gray-300 leading-relaxed">{sub.message}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
                {((view === 'users' && filteredUsers.length === 0) || (view === 'tones' && filteredTones.length === 0) || (view === 'sentinel' && groupedLogs.length === 0)) && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm italic">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {assigningUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-brand-card border border-brand-border rounded-[32px] p-8 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2"><UserIcon className="w-5 h-5 text-emerald-500" /> PLAN ATAMA</h3>
              <button onClick={() => setAssigningUser(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 tracking-tighter">Kapat</button>
            </div>
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
              <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">SEÇİLİ KULLANICI</div>
              <div className="text-sm font-bold text-white">{assigningUser.email}</div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {['free', 'pro', 'premium'].map((p) => (
                  <button 
                    key={p} 
                    onClick={() => handleUpdateUser(assigningUser.uid, { plan: p as any })}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      assigningUser.plan === p ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-white/5 border-brand-border text-gray-400 hover:border-white/20"
                    )}
                  >
                    <div className="text-[10px] font-black uppercase mb-1">{p} Plan</div>
                    <div className="text-xs opacity-60">{p === 'premium' ? 'Sınırsız Erişim' : p === 'pro' ? 'Gelişmiş Özellikler' : 'Temel Kullanım'}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const MetricItem = ({ icon: Icon, label, value, color, bgColor }: any) => (
  <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all shadow-lg">
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

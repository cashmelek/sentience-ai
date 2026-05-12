import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AppUser, PLAN_LIMITS, SubscriptionPlan } from '../types';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  where, 
  getDocs, 
  writeBatch, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Users, ShieldCheck, Zap, Activity, MoreVertical, Check, Search, 
  Server, Database, Settings, Globe, Cpu, AlertTriangle, Save, 
  Trash2, RefreshCw, MessageSquare, History 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'ismail.kaleci@gmail.com';

export function AdminPanel() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalProjects: 0, totalTones: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [sentinelLogs, setSentinelLogs] = useState<any[]>([]);
  const [tones, setTones] = useState<any[]>([]);
  const [view, setView] = useState<'users' | 'tones' | 'sentinel'>('users');
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'Size daha iyi bir deneyim sunmak için sistemimizi güncelliyoruz. Lütfen kısa bir süre sonra tekrar deneyin.',
    defaultIntensity: 80,
    apiStatus: 'online',
    sentinelEnabled: true,
    sentinelStatus: 'online' as 'online' | 'error' | 'quota_full',
    sentinelLastMessage: ''
  });

  // Auth state'i güvenli şekilde izle
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user?.email?.toLowerCase() || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      try {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            uid: doc.id,
            email: d.email || 'Email Yok',
            role: (d.role === 'admin' ? 'admin' : 'user'),
            plan: (['free', 'pro', 'premium'].includes(d.plan) ? d.plan : 'free') as SubscriptionPlan,
            dailyUsage: typeof d.dailyUsage === 'number' ? d.dailyUsage : 0,
            lastResetDate: d.lastResetDate || ''
          } as AppUser;
        });
        setUsers(data);
      } catch (err) {
        console.error("Kullanıcı verileri işlenirken hata:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Firestore onSnapshot hatası (users):", error);
      setLoading(false);
    });

    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      setStats(prev => ({ ...prev, totalProjects: snap.size }));
    });

    const unsubTones = onSnapshot(collection(db, 'customTones'), (snap) => {
      setStats(prev => ({ ...prev, totalTones: snap.size }));
      setTones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'system'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSystemSettings(prev => ({ ...prev, ...data }));
      }
    });

    const qLogs = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(10));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qSentinelLogs = query(collection(db, 'sentinelLogs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubSentinelLogs = onSnapshot(qSentinelLogs, (snap) => {
      setSentinelLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubProjects();
      unsubTones();
      unsubSettings();
      unsubLogs();
      unsubSentinelLogs();
    };
  }, []);

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
      await logAction('Sistem Ayarları Güncellendi', 'Global Settings');
      alert('Sistem ayarları başarıyla güncellendi.');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      alert('Ayarlar kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async (uid: string, updates: Partial<AppUser>) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updates);
      await logAction('Kullanıcı Güncellendi', uid);
      setEditingUser(null);
    } catch (error) {
      console.error('Kullanıcı güncellenirken hata oluştu:', error);
      alert('Kullanıcı güncellenemedi.');
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (email === 'ismail.kaleci@gmail.com') {
      alert('Yönetici hesabı silinemez!');
      return;
    }
    if (!window.confirm(`${email} kullanıcısını silmek istediğinizden emin misiniz?`)) return;

    try {
      await deleteDoc(doc(db, 'users', uid));
      await logAction('Kullanıcı Silindi', email);
      alert('Kullanıcı başarıyla silindi.');
    } catch (error) {
      console.error('Kullanıcı silinirken hata:', error);
      alert('Kullanıcı silinemedi.');
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
      await logAction('Tüm Kotalar Sıfırlandı', 'All Users');
      alert('Tüm kotalar başarıyla sıfırlandı.');
    } catch (error) {
      console.error('Kotalar sıfırlanırken hata:', error);
      alert('Kotalar sıfırlanamadı.');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredUsers = (users || []).filter(u => {
    try {
      const search = (searchTerm || '').toLowerCase();
      const email = (u?.email || '').toLowerCase();
      const role = (u?.role || '').toLowerCase();
      const plan = (u?.plan || '').toLowerCase();
      
      return email.includes(search) || role.includes(search) || plan.includes(search);
    } catch (e) {
      return false;
    }
  });

  const filteredTones = tones.filter(t => {
    const search = searchTerm.toLowerCase();
    const name = (t.name || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return name.includes(search) || desc.includes(search);
  });

  const handleDeleteTone = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" tarzını silmek istediğinizden emin misiniz?`)) return;
    try {
      await deleteDoc(doc(db, 'customTones', id));
      await logAction('Tarz Silindi', name);
    } catch (error) {
      console.error('Tarz silinemedi:', error);
      alert('Tarz silinirken bir hata oluştu.');
    }
  };

  const totalUsers = users.length;
  const proUsers = users.filter(u => u.plan === 'pro' || u.plan === 'premium').length;
  const totalAPIUsage = users.reduce((acc, u) => acc + (u.dailyUsage || 0), 0);


  const isAdmin = currentUserEmail === ADMIN_EMAIL;

  // Auth yüklenirken bekle
  if (authLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-emerald-500">
          <Activity className="w-8 h-8 animate-spin" />
          <span className="text-sm font-mono uppercase tracking-widest font-bold">KİMLİK DOĞRULANIYOR...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">YETKİSİZ ERİŞİM</h2>
          <p className="text-sm text-gray-400">Bu sayfayı görüntülemek için gerekli yetkilere sahip değilsiniz.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-emerald-500">
          <Activity className="w-8 h-8 animate-spin" />
          <span className="text-sm font-mono uppercase tracking-widest font-bold">Veriler Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-8 flex flex-col gap-6 lg:gap-8 h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            YÖNETİM PANELİ
          </h2>
          <p className="text-xs lg:text-sm text-gray-400 mt-1">Sistemdeki tüm kullanıcıları, kota kullanımlarını ve abonelik planlarını yönetin.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-brand-card border border-brand-border rounded-xl p-1">
            <button 
              onClick={() => setView('users')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'users' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Kullanıcılar
            </button>
            <button 
              onClick={() => setView('tones')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'tones' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Tarzlar
            </button>
            <button 
              onClick={() => setView('sentinel')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                view === 'sentinel' ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Sentinel
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder={view === 'users' ? "Kullanıcı ara..." : "Tarz ara..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors w-full sm:w-64 text-gray-300"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg hover:border-emerald-500/20 transition-all group">
          <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform"><Users className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">Toplam Kullanıcı</div>
            <div className="text-2xl font-black text-white">{totalUsers}</div>
          </div>
        </div>
        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg hover:border-amber-500/20 transition-all group">
          <div className="p-3 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform"><Zap className="w-5 h-5 text-amber-500" /></div>
          <div>
            <div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">Premium Üyeler</div>
            <div className="text-2xl font-black text-white">{proUsers}</div>
          </div>
        </div>
        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg hover:border-blue-500/20 transition-all group">
          <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform"><Activity className="w-5 h-5 text-blue-500" /></div>
          <div>
            <div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">Günlük API Yükü</div>
            <div className="text-2xl font-black text-white">{totalAPIUsage}</div>
          </div>
        </div>
        <div className="p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-4 shadow-lg hover:border-purple-500/20 transition-all group">
          <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform"><Database className="w-5 h-5 text-purple-500" /></div>
          <div>
            <div className="text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">Toplam Proje</div>
            <div className="text-2xl font-black text-white">{stats.totalProjects}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" /> SİSTEM SAĞLIĞI
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-brand-border">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-gray-300">Gemini AI Model</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded uppercase">gemini-pro</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-brand-border">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-gray-300">API Durumu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">ONLINE</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-brand-border">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-gray-300">Firestore G/Ç</span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">KARARLI</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-brand-border">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("w-4 h-4", systemSettings.sentinelStatus === 'online' ? "text-emerald-500" : "text-red-500")} />
                  <span className="text-xs font-bold text-gray-300">Sentinel (İntihal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", systemSettings.sentinelStatus === 'online' ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                  <span className={cn("text-[10px] font-bold uppercase", systemSettings.sentinelStatus === 'online' ? "text-emerald-500" : "text-red-500")}>
                    {systemSettings.sentinelStatus === 'online' ? 'ONLINE' : systemSettings.sentinelStatus === 'quota_full' ? 'QUOTA FULL' : 'ERROR'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" /> SİSTEM AYARLARI
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-300">Bakım Modu</span>
                  <span className="text-[9px] text-gray-500">Siteyi erişime kapatır</span>
                </div>
                <button 
                  onClick={() => setSystemSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    systemSettings.maintenanceMode ? "bg-red-500" : "bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    systemSettings.maintenanceMode ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-300">Sentinel Servisi</span>
                  <span className="text-[9px] text-gray-500">İntihal denetimini yönetir</span>
                </div>
                <button 
                  onClick={() => setSystemSettings(s => ({ ...s, sentinelEnabled: !s.sentinelEnabled }))}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    systemSettings.sentinelEnabled ? "bg-emerald-500" : "bg-gray-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    systemSettings.sentinelEnabled ? "left-6" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <MessageSquare className="w-3 h-3 text-gray-500" /> Bakım Mesajı
                </span>
                <textarea 
                  value={systemSettings.maintenanceMessage}
                  onChange={(e) => setSystemSettings(s => ({ ...s, maintenanceMessage: e.target.value }))}
                  className="w-full h-20 bg-brand-bg border border-brand-border rounded-xl p-3 text-[10px] text-gray-400 outline-none focus:border-emerald-500 transition-colors resize-none"
                  placeholder="Bakım sırasında gösterilecek mesaj..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-300">Varsayılan Yoğunluk</span>
                  <span className="text-[10px] font-mono text-emerald-500">{systemSettings.defaultIntensity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={systemSettings.defaultIntensity}
                  onChange={(e) => setSystemSettings(s => ({ ...s, defaultIntensity: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className={cn(
                    "py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSaving ? <Activity className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  KAYDET
                </button>
                <button 
                  onClick={handleResetAllUsage}
                  disabled={isResetting}
                  className={cn(
                    "py-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-2",
                    isResetting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isResetting ? <Activity className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  KOTA SIFIRLA
                </button>
              </div>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" /> SON AKTİVİTELER
            </h3>
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-300">{log.action}</span>
                    <span className="text-[8px] font-mono text-gray-600">
                      {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : '...'}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-500 truncate">{log.target}</div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-center py-4 text-[10px] text-gray-600 italic">Henüz aktivite yok.</div>}
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Kritik Uyarı</span>
              <p className="text-[10px] text-gray-500 mt-1">Sistem ayarlarında yapılacak değişiklikler tüm kullanıcıları gerçek zamanlı olarak etkileyecektir.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
              {view === 'users' ? 'KULLANICI YÖNETİMİ' : 'TARZ YÖNETİMİ'}
            </h3>
            <span className="text-[10px] text-gray-600 font-mono">
              {view === 'users' ? filteredUsers.length : view === 'tones' ? filteredTones.length : sentinelLogs.length} Sonuç
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
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Günlük Kota (İşlem)</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Tarz Adı</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Açıklama</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Oluşturan</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Tarih</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {view === 'users' ? (
                  filteredUsers.map((u) => {
                    if (!u) return null;
                    const plan = (u.plan || 'free') as SubscriptionPlan;
                    const limitValue = u.role === 'admin' ? 'Sınırsız' : (PLAN_LIMITS[plan] || 10);
                    const isEditing = editingUser === u.uid;

                    return (
                      <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-300">{u.email || 'Bilinmeyen Kullanıcı'}</div>
                          <div className="text-[10px] text-gray-600 font-mono mt-0.5">{u.uid}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing && u.email !== 'ismail.kaleci@gmail.com' ? (
                            <select 
                              className="bg-brand-bg border border-brand-border text-xs rounded-md px-2 py-1 text-gray-300 outline-none focus:border-emerald-500"
                              defaultValue={u.role}
                              onChange={(e) => handleUpdateUser(u.uid, { role: e.target.value as 'admin' | 'user' })}
                            >
                              <option value="user">Kullanıcı</option>
                              <option value="admin">Yönetici</option>
                            </select>
                          ) : (
                            <span className={cn(
                              "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md",
                              u.role === 'admin' ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                            )}>
                              {u.role === 'admin' ? "Yönetici" : "Kullanıcı"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select 
                              className="bg-brand-bg border border-brand-border text-xs rounded-md px-2 py-1 text-gray-300 outline-none focus:border-emerald-500"
                              defaultValue={u.plan}
                              onChange={(e) => handleUpdateUser(u.uid, { plan: e.target.value as SubscriptionPlan })}
                            >
                              <option value="free">Ücretsiz</option>
                              <option value="pro">Pro</option>
                              <option value="premium">Premium</option>
                            </select>
                          ) : (
                            <span className={cn(
                              "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border",
                              u.plan === 'premium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                              u.plan === 'pro' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                              "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            )}>
                              {u.plan === 'premium' ? "Premium" : u.plan === 'pro' ? "Pro" : "Ücretsiz"}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 bg-brand-border rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all", u.role === 'admin' ? "bg-emerald-500" : (u.dailyUsage >= (limitValue as number) ? "bg-red-500" : "bg-emerald-500"))} 
                                style={{ width: u.role === 'admin' ? '100%' : `${Math.min(100, (u.dailyUsage / (limitValue as number)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-400">{u.dailyUsage} / {limitValue}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isEditing ? (
                              <button onClick={() => setEditingUser(null)} className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-md transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button 
                                  onClick={() => setEditingUser(u.uid)} 
                                  className="p-1.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.uid, u.email || '')} 
                                  className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  filteredTones.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-300">{t.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-500 max-w-xs truncate">{t.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] text-gray-400 font-mono">{t.userId || 'Sistem'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] text-gray-500">
                          {t.createdAt?.toDate ? new Date(t.createdAt.toDate()).toLocaleDateString() : '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteTone(t.id, t.name)} 
                          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {((view === 'users' && filteredUsers.length === 0) || (view === 'tones' && filteredTones.length === 0)) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                      Arama kriterlerine uygun {view === 'users' ? 'kullanıcı' : view === 'tones' ? 'tarz' : 'kayıt'} bulunamadı.
                    </td>
                  </tr>
                )}
                {view === 'sentinel' && sentinelLogs.length > 0 && (
                  sentinelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className={cn(
                          "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border inline-block",
                          log.status === 'success' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {log.status === 'success' ? 'Başarılı' : 'Hata'}
                        </div>
                      </td>
                      <td className="px-6 py-4" colSpan={2}>
                        <div className="text-xs text-gray-300">{log.message}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] text-gray-500 font-mono">{log.duration}ms</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-[10px] text-gray-600">
                          {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : '...'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {view === 'sentinel' && sentinelLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                      Henüz Sentinel logu bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

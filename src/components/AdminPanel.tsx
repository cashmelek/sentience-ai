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
  Key, RotateCw, Heart, Plus, X, GraduationCap, Cloud, Wifi, WifiOff, Loader2, Sliders, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';
import toast from 'react-hot-toast';
import {
  checkLocalModelHealth,
  getLocalModelConfig,
  isLocalModelEnabled
} from '../services/localModelService';

const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com', 'yasindemir111@gmail.com'];

type AdminTab = 'users' | 'models' | 'api-keys' | 'sentinel';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userSubView, setUserSubView] = useState<'users' | 'tones' | 'logs'>('users');
  const [assigningUser, setAssigningUser] = useState<AppUser | null>(null);
  const [quotaWarning, setQuotaWarning] = useState(false);
  
  // Local / Cloud Engine State
  const initialLocalCfg = getLocalModelConfig();
  const [modelSource, setModelSource] = useState<'gemini' | 'local'>(() =>
    isLocalModelEnabled() ? 'local' : 'gemini'
  );
  const [localUrl, setLocalUrl] = useState(initialLocalCfg.baseUrl);
  const [localModelName, setLocalModelName] = useState(initialLocalCfg.modelName);
  const [localStatus, setLocalStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [localStatusMessage, setLocalStatusMessage] = useState<string>('');
  const [localModels, setLocalModels] = useState<string[]>([]);

  // API Key Management
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState({ provider: 'gemini' as 'gemini' | 'google-search', value: '' });
  const [isAddingKey, setIsAddingKey] = useState(false);

  // Mevcut Gemini modelleri ve açıklamaları
  const GEMINI_MODELS = [
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Hızlı ve uygun fiyatlı - Tüm işlemler için varsayılan model',
      quota: 'Düşük - Test aşamasında güvenli seçim',
      speed: 'Çok Hızlı',
      recommended: true
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Daha yeni ve güçlü - Karmaşık metinler için daha iyi muhakeme',
      quota: 'Orta - Test aşamasında dikkatli kullanın',
      speed: 'Hızlı',
      recommended: false
    },
    {
      id: 'gemini-3.1-pro',
      name: 'Gemini 3.1 Pro',
      description: 'En gelişmiş muhakeme - Derin analiz ve karmaşık yapılar için',
      quota: 'Yüksek - Test aşamasında sadece kritik işlemler',
      speed: 'Orta',
      recommended: false
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      description: 'Hafif ve ekonomik - Basit işlemler için kota dostu',
      quota: 'Çok Düşük - Test aşamasında sık kullanıma için uygun',
      speed: 'Çok Hızlı',
      recommended: false
    }
  ];

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
    useCustomModel: false,
    // İntihal tespiti ayarları
    sentinelSearchPhrasesCount: 10,
    sentinelMinWordCount: 8,
    sentinelUseDynamicSimilarity: true,
    sentinelTrustFilter: true,
    sentinelRegionFilter: true,
    // B22: kapılı özelliklerin herkese açıklığı (varsayılan kapalı = yalnız admin + yetki verilenler)
    featureAccess: { promoSite: false, classroom: false, trainingData: false }
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
          lastResetDate: data.lastResetDate || '',
          featureGrants: data.featureGrants || {}
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

  // B22: kullanıcı bazlı özellik yetkisi aç/kapa (users/{uid}.featureGrants — rules kendi yazımını engeller)
  const toggleFeatureGrant = (u: AppUser, f: 'promoSite' | 'classroom' | 'trainingData') => {
    const grants = { ...(u.featureGrants || {}), [f]: !u.featureGrants?.[f] };
    handleUpdateUser(u.uid, { featureGrants: grants });
    logAction(f === 'promoSite' ? 'Feature Grant: Site' : f === 'classroom' ? 'Feature Grant: Sinif' : 'Feature Grant: Veri', u.email);
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

  const testLocalModel = async (urlOverride?: string) => {
    setLocalStatus('checking');
    try {
      const res = await checkLocalModelHealth({
        baseUrl: urlOverride || localUrl,
        modelName: localModelName
      });
      setLocalStatus(res.ok ? 'online' : 'offline');
      setLocalStatusMessage(res.message);
      if (res.ok && res.models) {
        setLocalModels(res.models);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setLocalStatus('offline');
      setLocalStatusMessage(err.message || 'Bağlantı hatası');
      toast.error('Lokal sunucuya erişilemedi.');
    }
  };

  const handleSaveLocalEngine = () => {
    try {
      localStorage.setItem('sentience_use_local_model', modelSource === 'local' ? 'true' : 'false');
      localStorage.setItem('sentience_local_model_url', localUrl.trim());
      localStorage.setItem('sentience_local_model_name', localModelName.trim());
      toast.success('Motor ayarları kaydedildi.');
      logAction('Engine Config Updated', `${modelSource.toUpperCase()}: ${localModelName}`);
    } catch {
      toast.error('Ayarlar kaydedilemedi.');
    }
  };

  const handleSwitchModelSource = (src: 'gemini' | 'local') => {
    setModelSource(src);
    try {
      localStorage.setItem('sentience_use_local_model', src === 'local' ? 'true' : 'false');
    } catch {}
    toast.success(`Aktif motor: ${src === 'local' ? 'Yerel Model (Ollama)' : 'Bulut (Gemini)'}`);
    if (src === 'local') {
      testLocalModel();
    }
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

      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-500" /> YÖNETİM PANELİ
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Sistem ayarları, model motorları, API havuzu ve kullanıcı kontrolleri</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-gray-500 font-mono hidden md:inline">
              Son yenileme: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={fetchAllData} 
            disabled={isRefreshing} 
            className="px-3.5 py-2 bg-brand-card border border-brand-border rounded-xl text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 hover:border-emerald-500/30 transition-all"
          >
            <RefreshCw className={cn("w-4 h-4 text-emerald-500", isRefreshing && "animate-spin")} /> Yenile
          </button>
        </div>
      </div>

      {/* İstatistik Metrikleri */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricItem icon={Users} label="Kullanıcı" value={users.length} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        <MetricItem icon={Activity} label="Günlük Yük" value={stats.totalProjects} color="text-blue-500" bgColor="bg-blue-500/10" />
        <MetricItem icon={GraduationCap} label="Eğitime Hazır" value={stats.trainingReadyCount} color="text-amber-400" bgColor="bg-amber-500/10" />
        <MetricItem icon={Database} label="Toplam Proje" value={stats.totalProjects} color="text-purple-500" bgColor="bg-purple-500/10" />
        <MetricItem icon={ShieldCheck} label="Admin Sayısı" value={ADMIN_EMAILS.length} color="text-red-500" bgColor="bg-red-500/10" />
      </div>

      {/* Ana Navigasyon Sekmeleri (Aşağıya Uzayan Sayfayı Bölme) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-brand-border pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'users'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <Users className="w-4 h-4" /> Kullanıcılar & Tarzlar
          <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", activeTab === 'users' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-gray-400")}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'models'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <Cpu className="w-4 h-4" /> Model & Yapay Zeka Motoru
          <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold", activeTab === 'models' ? "bg-black/20 text-black font-bold" : "bg-sky-500/10 text-sky-400 border border-sky-500/20")}>
            {modelSource === 'local' ? 'Ollama' : 'Gemini'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('api-keys')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'api-keys'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <Key className="w-4 h-4" /> API Havuzu & Kotalar
          <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", activeTab === 'api-keys' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-gray-400")}>
            {apiKeysStatus.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sentinel')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'sentinel'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <ShieldCheck className="w-4 h-4" /> İntihal & Sentinel
        </button>
      </div>

      {/* SEKME 1: KULLANICILAR & TARZLAR */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-card/40 border border-brand-border p-3 rounded-2xl">
            <div className="flex bg-brand-bg border border-brand-border rounded-xl p-1">
              <button 
                onClick={() => setUserSubView('users')} 
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", userSubView === 'users' ? "bg-emerald-500 text-black shadow-md font-black" : "text-gray-400 hover:text-gray-200")}
              >
                Kullanıcılar ({filteredUsers.length})
              </button>
              <button 
                onClick={() => setUserSubView('tones')} 
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", userSubView === 'tones' ? "bg-emerald-500 text-black shadow-md font-black" : "text-gray-400 hover:text-gray-200")}
              >
                Özel Tarzlar ({filteredTones.length})
              </button>
              <button 
                onClick={() => setUserSubView('logs')} 
                className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", userSubView === 'logs' ? "bg-emerald-500 text-black shadow-md font-black" : "text-gray-400 hover:text-gray-200")}
              >
                Aktivite Günlüğü ({logs.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Kullanıcı veya tarz ara..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-9 pr-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs w-full sm:w-64 text-gray-200 outline-none focus:border-emerald-500 transition-colors" 
                />
              </div>
              <button 
                onClick={handleResetAllUsage} 
                disabled={isResetting} 
                title="Tüm kullanıcı günlük kullanım sayaçlarını sıfırlar"
                className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap"
              >
                Kotaları Sıfırla
              </button>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-brand-border bg-white/[0.02]">
                    {userSubView === 'users' ? (
                      <>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Kullanıcı</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Plan</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Yetkiler</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Günlük Kullanım</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500 text-right">İşlemler</th>
                      </>
                    ) : userSubView === 'tones' ? (
                      <>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Tarz Adı</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Açıklama / Kural</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500 text-right">İşlem</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Admin / Kullanıcı</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Eylem</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Hedef</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500 text-right">Zaman</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {userSubView === 'users' ? filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="text-xs sm:text-sm text-gray-300 font-bold truncate max-w-[200px] sm:max-w-none">{u.email}</div>
                        <div className="text-[9px] text-gray-600 font-mono">{u.uid}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5">
                        <select 
                          value={u.plan} 
                          onChange={(e) => handleUpdateUser(u.uid, { plan: e.target.value as any })} 
                          className="bg-brand-bg border border-brand-border text-[10px] font-bold rounded-lg px-2.5 py-1.5 text-gray-300 outline-none focus:border-emerald-500"
                        >
                          <option value="free">Ücretsiz Plan</option>
                          <option value="pro">Pro Plan</option>
                          <option value="premium">Premium Plan</option>
                        </select>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5">
                        {/* B22: kullanıcı bazlı özellik yetki anahtarları */}
                        <div className="flex flex-wrap gap-1">
                          {([['promoSite', 'Site'], ['classroom', 'Sınıf'], ['trainingData', 'Veri']] as const).map(([f, label]) => (
                            <button
                              key={f}
                              onClick={() => toggleFeatureGrant(u, f)}
                              title={`${label} erişimini aç/kapat`}
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border transition-colors",
                                u.featureGrants?.[f]
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-white/5 text-gray-600 border-white/10 hover:text-gray-400"
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5">
                        <span className="text-xs font-mono font-bold text-emerald-400">{u.dailyUsage || 0}</span>
                        <span className="text-[10px] text-gray-500 ml-1">kelime/işlem</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <button 
                          onClick={() => setAssigningUser(u)} 
                          title="Hızlı Plan Ata"
                          className="p-1.5 text-gray-500 hover:text-emerald-400 bg-white/5 rounded-lg border border-white/5 mr-2 transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.uid, u.email)} 
                          title="Kullanıcıyı Sil"
                          className="p-1.5 text-gray-500 hover:text-red-400 bg-white/5 rounded-lg border border-white/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )) : userSubView === 'tones' ? filteredTones.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-gray-200">{t.name}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-[10px] sm:text-xs text-gray-400">{t.description || 'Açıklama belirtilmemiş'}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <button onClick={() => handleDeleteTone(t.id, t.name)} className="p-1.5 text-gray-500 hover:text-red-400 bg-white/5 rounded-lg border border-white/5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 sm:px-6 py-3 text-xs text-gray-300 font-mono truncate max-w-[150px]">{log.admin || 'Sistem'}</td>
                      <td className="px-4 sm:px-6 py-3 text-xs font-bold text-emerald-400 uppercase">{log.action}</td>
                      <td className="px-4 sm:px-6 py-3 text-xs text-gray-400 truncate max-w-[200px]">{log.target}</td>
                      <td className="px-4 sm:px-6 py-3 text-[10px] text-gray-500 text-right font-mono">
                        {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 2: MODEL & YAPAY ZEKA MOTORU (Header'dan Taşınan Model Seçiciyi İçerir) */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Kolon: Aktif Motor Kaynağı (Bulut Gemini / Yerel Ollama) + Tuned Model */}
          <div className="space-y-6">
            {/* Header'dan Taşınan Model Kaynağı ve Yerel Sunucu Kontrol Kartı */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <div className="flex items-center gap-2.5">
                  {modelSource === 'local' ? (
                    <Cpu className="w-5 h-5 text-violet-400" />
                  ) : (
                    <Cloud className="w-5 h-5 text-sky-400" />
                  )}
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      AKTİF MODEL MOTORU SEÇİMİ
                    </h3>
                    <p className="text-[10px] text-gray-500 font-normal">
                      Metin analizi ve insanlaştırmada çalışacak birincil motor
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className={cn("w-2 h-2 rounded-full", modelSource === 'local' ? (localStatus === 'online' ? "bg-emerald-400 animate-pulse" : "bg-violet-400") : "bg-sky-400")} />
                  <span className="text-[10px] font-mono font-bold text-gray-300 uppercase">
                    {modelSource === 'local' ? 'Yerel Sunucu' : 'Bulut (Google)'}
                  </span>
                </div>
              </div>

              {/* İki Seçenek: Gemini vs Ollama */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchModelSource('gemini')}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 relative",
                    modelSource === 'gemini'
                      ? "bg-sky-500/10 border-sky-500/40 text-white shadow-lg shadow-sky-500/10"
                      : "bg-white/[0.02] border-brand-border text-gray-400 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Cloud className={cn("w-5 h-5", modelSource === 'gemini' ? "text-sky-400" : "text-gray-500")} />
                    {modelSource === 'gemini' && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Gemini (Bulut)</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Google AI Studio API anahtarları ile yüksek hız ve kararlılık</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchModelSource('local')}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 relative",
                    modelSource === 'local'
                      ? "bg-violet-500/10 border-violet-500/40 text-white shadow-lg shadow-violet-500/10"
                      : "bg-white/[0.02] border-brand-border text-gray-400 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Cpu className={cn("w-5 h-5", modelSource === 'local' ? "text-violet-400" : "text-gray-500")} />
                    {modelSource === 'local' && <Check className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Yerel Model (Ollama)</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Lokal GPU/CPU üzerinde gizli, limitsiz ve kotasız çalıştırma</div>
                  </div>
                </button>
              </div>

              {/* Yerel Model Detay Ayarları & Canlı Bağlantı Kontrolü */}
              {modelSource === 'local' && (
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-300 flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5" /> Ollama / LM Studio Yapılandırması
                    </span>
                    <div className="flex items-center gap-1.5">
                      {localStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                      {localStatus === 'online' && <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
                      {localStatus === 'offline' && <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                      <span className={cn("text-[10px] font-bold uppercase", localStatus === 'online' ? "text-emerald-400" : localStatus === 'offline' ? "text-red-400" : "text-gray-400")}>
                        {localStatus === 'checking' ? 'Kontrol...' : localStatus === 'online' ? 'Çevrimiçi' : localStatus === 'offline' ? 'Çevrimdışı' : 'Test Edilmedi'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Sunucu API Endpoint URL</label>
                    <input
                      type="text"
                      value={localUrl}
                      onChange={(e) => setLocalUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Model Adı (Tag)</label>
                    <input
                      type="text"
                      value={localModelName}
                      onChange={(e) => setLocalModelName(e.target.value)}
                      placeholder="sentience-humanizer:latest veya llama3"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 font-mono"
                    />
                  </div>

                  {localModels.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-bold uppercase text-gray-500">Sunucuda Bulunan Modeller (Seçmek için tıkla)</div>
                      <div className="flex flex-wrap gap-1.5">
                        {localModels.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setLocalModelName(m)}
                            className={cn("px-2 py-1 rounded-lg text-[10px] font-mono border transition-all", localModelName === m ? "bg-violet-600/30 border-violet-500 text-violet-300" : "bg-white/5 border-white/10 text-gray-400 hover:text-white")}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => testLocalModel(localUrl)}
                      disabled={localStatus === 'checking'}
                      className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      {localStatus === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />} BAĞLANTIYI TEST ET
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLocalEngine}
                      className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                    >
                      <Save className="w-3.5 h-3.5" /> MOTORU KAYDET
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Özel Eğitilmiş Model (Tuned Model) */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-500" /> ÖZEL MODEL EĞİTİMİ (TUNED MODEL)
              </h3>
              <div className="space-y-4">
                <ToggleItem 
                  label="Tuned Model Kullan" 
                  sub="Google Vertex AI / Studio üzerinde fine-tune edilmiş modeli aktif eder" 
                  value={systemSettings.useCustomModel} 
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, useCustomModel: v }))} 
                />
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Aktif Model ID</span>
                  <input 
                    type="text" 
                    placeholder="tunedModels/sentience-v1..." 
                    value={systemSettings.customModelId} 
                    onChange={(e) => setSystemSettings(s => ({ ...s, customModelId: e.target.value }))} 
                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono" 
                  />
                </div>
                <button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving} 
                  className="w-full py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} TUNED MODEL AYARINI KAYDET
                </button>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Gemini Model Seçimi & Kota Yönetimi */}
          <div className="space-y-6">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
                <Zap className="w-4 h-4 text-blue-500" /> GEMİNİ BULUT MODEL KONTROLÜ
                <InfoTooltip text="Denetçi ve İnsanlaştırma servisleri için ayrı model varyantları seçebilirsiniz. Kota dostu kullanım için 2.0 Flash önerilir." />
              </h3>

              <div className="space-y-4">
                {/* Denetçi Modeli */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">YZ Tespiti (Denetçi) Modeli</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{systemSettings.auditorModel}</span>
                  </div>
                  <select 
                    value={systemSettings.auditorModel} 
                    onChange={(e) => setSystemSettings(s => ({ ...s, auditorModel: e.target.value }))}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {GEMINI_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} — {model.speed} ({model.quota})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-gray-500 leading-relaxed">
                    {GEMINI_MODELS.find(m => m.id === systemSettings.auditorModel)?.description}
                  </p>
                </div>

                {/* İnsanlaştırma Modeli */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">İnsanlaştırma Modeli</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{systemSettings.ghostWriterModel}</span>
                  </div>
                  <select 
                    value={systemSettings.ghostWriterModel} 
                    onChange={(e) => setSystemSettings(s => ({ ...s, ghostWriterModel: e.target.value }))}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {GEMINI_MODELS.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} — {model.speed} ({model.quota})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-gray-500 leading-relaxed">
                    {GEMINI_MODELS.find(m => m.id === systemSettings.ghostWriterModel)?.description}
                  </p>
                </div>

                {/* Kota ve Test Uyarısı */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-[10px] font-black uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" /> Model Kota Optimizasyonu
                  </div>
                  <p className="text-[9px] text-gray-400 leading-normal">
                    Gemini 2.0 Flash modeli en yüksek istek limitine (15 RPM / 1M TPM) sahiptir. 2.5 ve 3.1 Pro modelleri kota aşımına daha duyarlıdır.
                  </p>
                </div>

                <button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving} 
                  className="w-full py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} GEMİNİ MODEL AYARLARINI KAYDET
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 3: API HAVUZU & KOTALAR */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-card/40 border border-brand-border p-4 rounded-2xl">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-500" /> DİNAMİK API ANAHTAR ROTASYONU
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Kota tükendiğinde otomatik olarak bir sonraki aktif anahtara geçiş yapılır
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddKey(!showAddKey)} 
                className="px-3.5 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-400 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Anahtar Ekle
              </button>
              <button 
                onClick={handleResetAPIKeys} 
                className="px-3 py-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Havuzu Sıfırla
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAddKey && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-brand-card border border-brand-border rounded-2xl p-5 space-y-4">
                <div className="text-xs font-black text-white uppercase">YENİ API ANAHTARI EKLE</div>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button onClick={() => setNewKey({ ...newKey, provider: 'gemini' })} className={cn("py-2.5 text-xs font-black rounded-xl border transition-all", newKey.provider === 'gemini' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-white/5 border-brand-border text-gray-400")}>GEMINI API</button>
                  <button onClick={() => setNewKey({ ...newKey, provider: 'google-search' })} className={cn("py-2.5 text-xs font-black rounded-xl border transition-all", newKey.provider === 'google-search' ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/5 border-brand-border text-gray-400")}>SEARCH API</button>
                </div>
                <input type="password" placeholder="AIzaSy... veya arama anahtarı" value={newKey.value} onChange={(e) => setNewKey({ ...newKey, value: e.target.value })} className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-emerald-500" />
                <button onClick={handleAddKey} disabled={isAddingKey} className="px-6 py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase">KAYDET VE HAVUZA EKLE</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gemini Anahtarları */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <span className="text-xs font-black text-gray-300 uppercase flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" /> Gemini Anahtarları ({apiKeysStatus.filter(k => k.provider === 'gemini').length})
                </span>
                <button onClick={() => handleRotateKey('gemini')} className="text-[10px] font-black text-emerald-400 flex items-center gap-1 hover:underline">
                  <RotateCw className="w-3 h-3" /> DÖNDÜR
                </button>
              </div>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {apiKeysStatus.filter(k => k.provider === 'gemini').map((k: any) => (
                  <div key={k.id} className="p-3 bg-white/[0.02] border border-brand-border rounded-xl flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-2 h-2 rounded-full", k.status === 'active' ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                      <span className="text-xs font-mono text-gray-300">{k.maskedKey}</span>
                      <span className="text-[9px] text-gray-500 font-mono">({k.isDynamic ? 'Dinamik' : 'Env'})</span>
                    </div>
                    {k.isDynamic && (
                      <button onClick={() => handleDeleteAPIKey(k.id)} className="text-gray-500 hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Google Search Anahtarları */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <span className="text-xs font-black text-gray-300 uppercase flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-blue-500" /> Google Search Anahtarları (100 Sorgu/Gün)
                </span>
                <button onClick={() => handleRotateKey('search')} className="text-[10px] font-black text-blue-400 flex items-center gap-1 hover:underline">
                  <RotateCw className="w-3 h-3" /> DÖNDÜR
                </button>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {apiKeysStatus.filter(k => k.provider === 'google-search').map((k: any) => (
                  <div key={k.id} className="p-3.5 bg-white/[0.02] border border-brand-border rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", k.status === 'active' ? "bg-blue-400 animate-pulse" : "bg-red-400")} />
                        <span className="text-xs font-mono text-gray-300">{k.maskedKey}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-400">{k.usageCount || 0} / 100</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-700", (k.usageCount || 0) > 80 ? "bg-red-500" : "bg-blue-500")} 
                        style={{ width: `${Math.min(k.usageCount || 0, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 4: İNTİHAL & SENTINEL YÖNETİMİ */}
      {activeTab === 'sentinel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
              <ShieldCheck className="w-4 h-4 text-purple-500" /> İNTİHAL MOTORU PARAMETRELERİ
              <InfoTooltip text="Google Search Grounding ve canlı tarama hassasiyetini buradan ince ayar yapabilirsiniz." />
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Taranacak Cümle Sayısı</span>
                  <span className="text-xs font-mono text-purple-400 font-bold">{systemSettings.sentinelSearchPhrasesCount}</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="20" 
                  value={systemSettings.sentinelSearchPhrasesCount} 
                  onChange={(e) => setSystemSettings(s => ({ ...s, sentinelSearchPhrasesCount: parseInt(e.target.value) }))}
                  className="w-full h-1.5 accent-purple-500 bg-white/10 rounded-full cursor-pointer"
                />
                <p className="text-[9px] text-gray-500">Metinden kaç cümle Google üzerinde aranacak (yüksek = derin tarama, daha fazla sorgu)</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Minimum Kelime Eşiği</span>
                  <span className="text-xs font-mono text-purple-400 font-bold">{systemSettings.sentinelMinWordCount}</span>
                </div>
                <input 
                  type="range" 
                  min="4" 
                  max="12" 
                  value={systemSettings.sentinelMinWordCount} 
                  onChange={(e) => setSystemSettings(s => ({ ...s, sentinelMinWordCount: parseInt(e.target.value) }))}
                  className="w-full h-1.5 accent-purple-500 bg-white/10 rounded-full cursor-pointer"
                />
                <p className="text-[9px] text-gray-500">Cümlenin intihal sayılması için en az kaç kelimeden oluşması gerektiği</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-brand-border">
                <ToggleItem 
                  label="Dinamik Benzerlik Skoru" 
                  sub="Snippet ve cümle arası Levenshtein/shingle karşılaştırması" 
                  value={systemSettings.sentinelUseDynamicSimilarity} 
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, sentinelUseDynamicSimilarity: v }))} 
                />
                <ToggleItem 
                  label="Güvenilirlik Filtresi" 
                  sub="Düşük kaliteli blog veya spam kaynakları intihal listesinden filtreler" 
                  value={systemSettings.sentinelTrustFilter} 
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, sentinelTrustFilter: v }))} 
                />
                <ToggleItem 
                  label="Bölge / Dil Filtresi" 
                  sub="Yerli ve yabancı kaynak ayrımı yaparak önceliklendirir" 
                  value={systemSettings.sentinelRegionFilter} 
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, sentinelRegionFilter: v }))} 
                />
              </div>

              <button 
                onClick={handleSaveSettings} 
                disabled={isSaving} 
                className="w-full py-3 bg-purple-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} İNTİHAL AYARLARINI GÜNCELLE
              </button>
            </div>
          </div>

          {/* B22: Özellik Erişim Anahtarları — kapalıyken yalnız admin + Kullanıcılar sekmesinden yetki verilenler görür */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
              <Globe className="w-4 h-4 text-emerald-500" /> ÖZELLİK ERİŞİM ANAHTARLARI
              <InfoTooltip text="Kapalıyken bu bölümleri yalnızca admin ve Kullanıcılar sekmesinden tek tek yetki verilen kişiler görür. Açtığınızda tüm kullanıcılara görünür olur."
              />
            </h3>
            <div className="space-y-2">
              <ToggleItem
                label="Tanıtım Sitesini Görüntüle"
                sub="Sol alt menüdeki tanıtım sitesi bağlantısı"
                value={systemSettings.featureAccess.promoSite}
                onChange={(v: any) => setSystemSettings(s => ({ ...s, featureAccess: { ...s.featureAccess, promoSite: v } }))}
              />
              <ToggleItem
                label="Sınıflarım"
                sub="Sol alt menü butonu ve sınıf/ödev çalışma alanı"
                value={systemSettings.featureAccess.classroom}
                onChange={(v: any) => setSystemSettings(s => ({ ...s, featureAccess: { ...s.featureAccess, classroom: v } }))}
              />
              <ToggleItem
                label="Veri İndir (JSONL)"
                sub="Eğitim verisi dışa aktarma butonu"
                value={systemSettings.featureAccess.trainingData}
                onChange={(v: any) => setSystemSettings(s => ({ ...s, featureAccess: { ...s.featureAccess, trainingData: v } }))}
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full py-3 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} ERİŞİM AYARLARINI KAYDET
            </button>
          </div>
          </div>

          {/* Sentinel Logları */}
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" /> SENTINEL DENETİM GEÇMİŞİ
              </h3>
              <span className="text-[10px] font-mono text-gray-500">{groupedLogs.length} Kayıt</span>
            </div>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
              {groupedLogs.map(log => {
                const isExpanded = expandedLogs.includes(log.id);
                return (
                  <div key={log.id} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl">
                    <div onClick={() => toggleLogExpansion(log.id)} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                        <span className="text-xs font-bold text-gray-300">{log.userEmail || 'Anonim'}</span>
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono">
                        {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 pl-5 truncate">{log.message}</div>
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-brand-border pl-5 space-y-1">
                        {log.subLogs?.map((sub: any, idx: number) => (
                          <div key={idx} className="text-[9px] font-mono text-gray-500">
                            [{sub.status?.toUpperCase()}] {sub.message} {sub.duration ? `(${sub.duration}ms)` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
  <div className="p-4 sm:p-5 bg-brand-card border border-brand-border rounded-2xl flex items-center gap-3 sm:gap-4 shadow-lg group hover:border-white/10 transition-all">
    <div className={cn("p-2 sm:p-3 rounded-xl transition-transform group-hover:scale-110", bgColor)}><Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", color)} /></div>
    <div><div className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-500 tracking-widest mb-0.5">{label}</div><div className="text-xl sm:text-2xl font-black text-white">{value}</div></div>
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

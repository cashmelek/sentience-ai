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
  Users, ShieldCheck, ShieldAlert, CheckCircle2, Filter, Zap, Activity, MoreVertical, Check, Search, Link2, Clock,
  Server, Database, Settings, Globe, Cpu, AlertTriangle, Save,
  Trash2, RefreshCw, MessageSquare, History, ChevronDown, ChevronRight, User as UserIcon,
  Key, RotateCw, Heart, Plus, X, GraduationCap, Cloud, Wifi, WifiOff, Loader2, Sliders, Layers, Code2, BookOpen, LayoutDashboard, Edit3, Eye, EyeOff, ExternalLink, Building2, School
} from 'lucide-react';
import { InstitutionLicense } from '../types/classroom';
import {
  listInstitutionLicenses,
  createInstitutionLicense,
  updateInstitutionLicense,
  deleteInstitutionLicense
} from '../services/institutionLicenseService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';
import toast from 'react-hot-toast';
import { DeveloperApiView } from './DeveloperApiView';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types/blog';
import { landingCmsService, DEFAULT_LANDING_CONFIG, LandingCmsConfig } from '../services/landingCmsService';
import { verifyPlagiarism } from '../services/sentinelService';
import {
  checkLocalModelHealth,
  getLocalModelConfig,
  isLocalModelEnabled,
  testModelInference
} from '../services/localModelService';

const ADMIN_EMAILS = ['ismail.kaleci@gmail.com', 'tonguc.urunler@gmail.com', 'yasindemir111@gmail.com'];

type AdminTab = 'users' | 'academic-licenses' | 'models' | 'api-keys' | 'dev-api' | 'sentinel' | 'blog' | 'landing-cms';

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
  const [stats, setStats] = useState({ totalProjects: 0, dailyLoad: 0, totalTones: 0, trainingReadyCount: 0 });
  const [logs, setLogs] = useState<any[]>([]);
  const [sentinelLogs, setSentinelLogs] = useState<any[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [tones, setTones] = useState<any[]>([]);
  const [apiKeysStatus, setApiKeysStatus] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userSubView, setUserSubView] = useState<'users' | 'tones' | 'logs'>('users');
  const [assigningUser, setAssigningUser] = useState<AppUser | null>(null);
  const [viewingTone, setViewingTone] = useState<any | null>(null);
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
  const [localLatency, setLocalLatency] = useState<number | null>(null);
  const [cloudLatency, setCloudLatency] = useState<number | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [dryRunPrompt, setDryRunPrompt] = useState('Sentience AI sistemini 1 cümle ile açıkla.');
  const [dryRunOutput, setDryRunOutput] = useState('');
  const [dryRunLatency, setDryRunLatency] = useState<number | null>(null);
  const [isRunningDryRun, setIsRunningDryRun] = useState(false);
  const [sentinelFilter, setSentinelFilter] = useState<'all' | 'clean' | 'violation'>('all');
  const [sentinelTestText, setSentinelTestText] = useState('Yapay zeka modelleri doğal dil işleme süreçlerinde derin öğrenme algoritmalarını kullanır.');
  const [sentinelTestResult, setSentinelTestResult] = useState<any | null>(null);
  const [isRunningSentinelTest, setIsRunningSentinelTest] = useState(false);

  // API Key Management
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKey, setNewKey] = useState<{ provider: 'gemini' | 'core-api' | 'openalex' | 'opencitations'; value: string }>({ provider: 'gemini', value: '' });
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Blog Yönetimi State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogSearchTerm, setBlogSearchTerm] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postForm, setPostForm] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    category: 'Akademik Etik & Özgünlük',
    readTime: '7 dk okuma',
    date: 'Ekim 2026',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
    summary: '',
    leadParagraph: '',
    published: true
  });

  // Landing Page CMS State
  const [cmsConfig, setCmsConfig] = useState<LandingCmsConfig>(DEFAULT_LANDING_CONFIG);
  const [cmsSaving, setCmsSaving] = useState(false);

  // Kurumsal Lisanslar & Roller State
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'instructor' | 'user' | 'admin'>('all');
  const [licenses, setLicenses] = useState<InstitutionLicense[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [showCreateLicenseModal, setShowCreateLicenseModal] = useState(false);
  const [licenseForm, setLicenseForm] = useState({
    code: '',
    institutionName: '',
    department: '',
    contactEmail: '',
    maxInstructors: 50,
    maxStudents: 1000,
    expiresAt: '2027-12-31',
    isActive: true,
    notes: ''
  });

  const fetchLicenses = useCallback(async () => {
    setLicensesLoading(true);
    try {
      const data = await listInstitutionLicenses();
      setLicenses(data);
    } catch {
      toast.error('Kurumsal lisanslar yüklenemedi.');
    } finally {
      setLicensesLoading(false);
    }
  }, []);

  const fetchBlogPosts = useCallback(async () => {
    setBlogLoading(true);
    try {
      const posts = await blogService.fetchAllPosts(true);
      setBlogPosts(posts);
    } catch {
      toast.error('Blog yazıları alınamadı.');
    } finally {
      setBlogLoading(false);
    }
  }, []);

  const fetchCmsConfig = useCallback(async () => {
    try {
      const cfg = await landingCmsService.fetchConfig(true);
      if (cfg) setCmsConfig(cfg);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchCmsConfig();
  }, [fetchCmsConfig]);

  useEffect(() => {
    if (activeTab === 'blog') {
      fetchBlogPosts();
    } else if (activeTab === 'landing-cms') {
      fetchCmsConfig();
    } else if (activeTab === 'academic-licenses') {
      fetchLicenses();
    }
  }, [activeTab, fetchBlogPosts, fetchCmsConfig, fetchLicenses]);

  const handleTogglePostPublish = async (post: BlogPost) => {
    try {
      if (post.docId) {
        await blogService.updatePost(post.docId, { published: !post.published });
      }
      setBlogPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, published: !p.published } : p))
      );
      toast.success(post.published ? 'Yazı taslağa alındı.' : 'Yazı yayına alındı.');
    } catch {
      toast.error('Durum güncellenemedi.');
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (!window.confirm(`"${post.title}" başlıklı yazıyı silmek istediğinize emin misiniz?`)) return;
    try {
      if (post.docId) {
        await blogService.deletePost(post.docId);
      }
      setBlogPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success('Yazı silindi.');
    } catch {
      toast.error('Yazı silinemedi.');
    }
  };

  const handleSaveBlogPost = async () => {
    if (!postForm.title || !postForm.slug) {
      toast.error('Başlık ve bağlantı (slug) zorunludur.');
      return;
    }
    try {
      if (editingPost?.docId) {
        await blogService.updatePost(editingPost.docId, postForm);
        toast.success('Yazı güncellendi.');
      } else {
        await blogService.createPost(postForm);
        toast.success('Yeni yazı oluşturuldu.');
      }
      setEditingPost(null);
      setIsCreatingPost(false);
      fetchBlogPosts();
    } catch {
      toast.error('Yazı kaydedilemedi.');
    }
  };

  const handleSeedBlogDefaults = async () => {
    try {
      const count = await blogService.seedDefaultPosts();
      toast.success(`${count} adet varsayılan makale veritabanına aktarıldı.`);
      fetchBlogPosts();
    } catch {
      toast.error('Senkronizasyon hatası.');
    }
  };

  const handleSaveCmsConfig = async () => {
    setCmsSaving(true);
    try {
      await landingCmsService.updateConfig(cmsConfig);
      await fetchCmsConfig();
      toast.success('Landing Page ve Footer ayarları kaydedildi.');
    } catch (err: any) {
      console.error('CMS kaydetme hatası:', err);
      toast.error(err?.message || 'Kaydetme hatası.');
    } finally {
      setCmsSaving(false);
    }
  };

  // Mevcut Gemini modelleri ve açıklamaları (Güncel 2026 Protokolü)
  const GEMINI_MODELS = [
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      description: 'Yeni nesil yüksek hızlı ve dengeli model - Analiz ve insanlaştırma için varsayılan',
      quota: 'Düşük - Kararlı ve önerilen',
      speed: 'Çok Hızlı',
      recommended: true
    },
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      description: 'Yüksek verimli multimodal ve ultra hızlı çıkarım modeli',
      quota: 'Düşük - Yüksek hız',
      speed: 'Ultra Hızlı',
      recommended: false
    },
    {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      description: 'Önceki nesil kararlı flash model - Kota dostu',
      quota: 'Standart Kota',
      speed: 'Çok Hızlı',
      recommended: false
    },
    {
      id: 'gemini-3.1-pro',
      name: 'Gemini 3.1 Pro',
      description: 'En gelişmiş muhakeme - Derin analiz ve karmaşık yapılar için',
      quota: 'Yüksek - Sadece kritik işlemler',
      speed: 'Orta',
      recommended: false
    },
    {
      id: 'gemini-3.1-flash-lite',
      name: 'Gemini 3.1 Flash Lite',
      description: 'Hafif ve ekonomik - Basit işlemler için kota dostu',
      quota: 'Çok Düşük - Sık kullanıma uygun',
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
    auditorModel: 'gemini-2.5-flash',
    ghostWriterModel: 'gemini-2.5-flash',
    customModelId: '',
    useCustomModel: false,
    // Model & Yapay Zeka Parametreleri
    modelTemperature: 0.7,
    modelTopP: 0.95,
    fallbackToCloudOnFailure: true,
    // İntihal tespiti ayarları
    sentinelSearchPhrasesCount: 10,
    sentinelMinWordCount: 8,
    sentinelUseDynamicSimilarity: true,
    sentinelTrustFilter: true,
    sentinelRegionFilter: true,
    // Akademik Protokol Eşikleri & Çapraz Doğrulama (GEMINI.md Madde 5.1)
    sentinelMaxPlagiarismRate: 15,
    sentinelPerSourceLimit: 3,
    sentinelAcademicCrossCheck: {
      crossref: true,
      semanticScholar: true,
      pubmed: true,
      core: true
    },
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

      // 2. Projects & Training Metrics
      let totalProjectsCount = 0;
      let trainingReadyCount = 0;
      try {
        const projectsSnap = await getDocs(collection(db, 'projects'));
        totalProjectsCount = projectsSnap.size;
        trainingReadyCount = projectsSnap.docs.filter(d => d.data().isTrainingReady && !d.data().isTrained).length;
      } catch (pe) {
        console.warn('Projects count fetch warning:', pe);
      }
      
      // 3. Tones
      const tonesSnap = await getDocs(collection(db, 'customTones'));
      setTones(tonesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 4. Blog Posts (Sayaç için peşin yükleme)
      fetchBlogPosts();

      setStats({
        dailyLoad: usersData.reduce((a, u) => a + (u.dailyUsage || 0), 0),
        totalProjects: totalProjectsCount,
        totalTones: tonesSnap.size,
        trainingReadyCount
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
      toast.success('Ayarlar başarıyla güncellendi.');
    } catch (err: any) {
      console.error('Settings save error:', err);
      toast.error('Ayarlar kaydedilemedi: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRotateKey = (type: 'gemini' | 'core-api' | 'openalex' | 'opencitations') => {
    let success = false;
    if (type === 'gemini') success = apiKeyManager.rotateGeminiKey();
    else if (type === 'core-api') success = apiKeyManager.rotateCoreKey();
    else if (type === 'openalex') success = apiKeyManager.rotateOpenAlexKey();
    else if (type === 'opencitations') success = apiKeyManager.rotateOpenCitationsKey();

    if (success) {
      toast.success(`${type.toUpperCase()} anahtarı döndürüldü.`);
      logAction('Key Rotated', type);
    } else {
      toast.error(`${type.toUpperCase()} havuzunda döndürülecek başka anahtar yok veya tek anahtar mevcut.`);
    }
  };

  const handleToggleKeyStatus = async (keyId: string, currentStatus: string) => {
    try {
      await apiKeyManager.toggleKeyStatus(keyId, currentStatus);
      toast.success(currentStatus === 'active' ? 'Anahtar pasife alındı.' : 'Anahtar aktifleştirildi.');
    } catch (e: any) {
      toast.error('Durum değiştirilemedi: ' + e.message);
    }
  };

  const handleTestKey = async (keyId: string, provider: 'gemini' | 'core-api' | 'openalex' | 'opencitations', explicitKey?: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await apiKeyManager.verifyKeyHealth(keyId, provider, explicitKey);
      if (res.success) {
        toast.success(res.message || `${provider.toUpperCase()} anahtarı sağlıklı ve aktif!`);
        logAction('Key Health Verified', `${provider}: ${keyId}`);
      } else {
        toast.error(`Doğrulanamadı: ${res.error || 'Bilinmeyen hata'}`);
      }
    } catch (e: any) {
      toast.error('Test hatası: ' + e.message);
    } finally {
      setTestingKeyId(null);
    }
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

  const handleSetUserRole = async (u: AppUser, newRole: 'user' | 'admin' | 'student' | 'instructor') => {
    if (ADMIN_EMAILS.includes(u.email) && newRole !== 'admin') {
      return toast.error('Ana yönetici rolü değiştirilemez!');
    }
    const academicProfile = newRole === 'student' ? 'student' : (newRole === 'instructor' ? 'academic' : 'professional');
    try {
      await updateDoc(doc(db, 'users', u.uid), {
        role: newRole,
        academicProfile
      });
      const roleLabels: Record<string, string> = {
        admin: 'Yönetici',
        instructor: 'Akademisyen / Eğitmen',
        student: 'Öğrenci',
        user: 'Standart Üye'
      };
      toast.success(`${u.email} rolü "${roleLabels[newRole]}" olarak güncellendi.`);
      logAction('User Role Changed', `${u.email} -> ${newRole}`);
      fetchAllData();
    } catch {
      toast.error('Rol güncellenemedi.');
    }
  };

  const handleCreateLicense = async () => {
    if (!licenseForm.code.trim() || !licenseForm.institutionName.trim()) {
      return toast.error('Yetki kodu ve kurum adı zorunludur.');
    }
    try {
      await createInstitutionLicense(licenseForm);
      toast.success(`"${licenseForm.code.toUpperCase()}" kurumsal lisansı oluşturuldu.`);
      setShowCreateLicenseModal(false);
      setLicenseForm({
        code: '',
        institutionName: '',
        department: '',
        contactEmail: '',
        maxInstructors: 50,
        maxStudents: 1000,
        expiresAt: '2027-12-31',
        isActive: true,
        notes: ''
      });
      fetchLicenses();
    } catch {
      toast.error('Lisans oluşturulamadı.');
    }
  };

  const handleToggleLicense = async (lic: InstitutionLicense) => {
    try {
      await updateInstitutionLicense(lic.id, { isActive: !lic.isActive });
      toast.success(`Lisans durumu ${!lic.isActive ? 'Aktif' : 'Pasif'} yapıldı.`);
      fetchLicenses();
    } catch {
      toast.error('Durum değiştirilemedi.');
    }
  };

  const handleDeleteLicense = async (lic: InstitutionLicense) => {
    if (!window.confirm(`"${lic.code}" kodlu kurumsal lisansı silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteInstitutionLicense(lic.id);
      toast.success('Lisans silindi.');
      fetchLicenses();
    } catch {
      toast.error('Lisans silinemedi.');
    }
  };

  const handleToggleRole = async (u: AppUser) => {
    if (ADMIN_EMAILS.includes(u.email)) {
      return toast.error('Ana yönetici rolü değiştirilemez!');
    }
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', u.uid), { role: newRole });
      toast.success(`${u.email} rolü "${newRole === 'admin' ? 'Yönetici' : 'Üye'}" olarak güncellendi.`);
      logAction('User Role Changed', `${u.email} -> ${newRole}`);
      fetchAllData();
    } catch {
      toast.error('Rol güncellenemedi.');
    }
  };

  const handleResetSingleUserUsage = async (uid: string, email: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { dailyUsage: 0 });
      toast.success(`${email} kullanıcısının günlük kotası sıfırlandı.`);
      logAction('Single User Quota Reset', email);
      fetchAllData();
    } catch {
      toast.error('Kota sıfırlanamadı.');
    }
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

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      u.email?.toLowerCase().includes(term) ||
      (u.institutionName && u.institutionName.toLowerCase().includes(term));
    if (!matchesSearch) return false;

    if (userRoleFilter === 'all') return true;
    if (userRoleFilter === 'admin') return u.role === 'admin';
    if (userRoleFilter === 'student') return u.role === 'student' || u.academicProfile === 'student';
    if (userRoleFilter === 'instructor') return u.role === 'instructor' || u.academicProfile === 'academic';
    if (userRoleFilter === 'user') return (u.role === 'user' || !u.role) && u.academicProfile !== 'student' && u.academicProfile !== 'academic';
    return true;
  });
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

  const filteredSentinelLogs = groupedLogs.filter((log: any) => {
    if (sentinelFilter === 'all') return true;
    const isViolationOrError =
      log.status === 'error' ||
      log.status === 'violation' ||
      log.message?.toLowerCase().includes('ihlal') ||
      log.message?.toLowerCase().includes('hata') ||
      log.message?.toLowerCase().includes('kota') ||
      (log.subLogs || []).some((s: any) => s.status === 'error' || s.status === 'violation' || s.message?.toLowerCase().includes('ihlal'));
    return sentinelFilter === 'violation' ? isViolationOrError : !isViolationOrError;
  });

  const testLocalModel = async (urlOverride?: string) => {
    setLocalStatus('checking');
    try {
      const res = await checkLocalModelHealth({
        baseUrl: urlOverride || localUrl,
        modelName: localModelName
      });
      setLocalStatus(res.ok ? 'online' : 'offline');
      setLocalStatusMessage(res.message);
      if (res.latencyMs) setLocalLatency(res.latencyMs);
      if (res.ok && res.models) {
        setLocalModels(res.models);
        toast.success(`Yerel model bağlandı (${res.latencyMs || 0} ms)`);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setLocalStatus('offline');
      setLocalStatusMessage(err.message || 'Bağlantı hatası');
      toast.error('Lokal sunucuya erişilemedi.');
    }
  };

  const handleTestCloud = async () => {
    setIsTestingCloud(true);
    try {
      const res = await testModelInference('gemini', 'ping', {
        modelName: systemSettings.ghostWriterModel || 'gemini-2.5-flash',
        temperature: systemSettings.modelTemperature ?? 0.7,
        topP: systemSettings.modelTopP ?? 0.95
      });
      if (res.error) {
        toast.error('Bulut testi hatası: ' + res.error);
      } else {
        setCloudLatency(res.latencyMs);
        toast.success(`Gemini Bulut aktif ve sağlıklı (${res.latencyMs} ms)`);
      }
    } catch (e: any) {
      toast.error('Bağlantı hatası: ' + e.message);
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleRunDryRun = async () => {
    if (!dryRunPrompt.trim()) return;
    setIsRunningDryRun(true);
    setDryRunOutput('');
    setDryRunLatency(null);
    try {
      const res = await testModelInference(modelSource, dryRunPrompt, {
        modelName: modelSource === 'local' ? localModelName : (systemSettings.ghostWriterModel || 'gemini-2.5-flash'),
        temperature: systemSettings.modelTemperature ?? 0.7,
        topP: systemSettings.modelTopP ?? 0.95
      });
      if (res.error) {
        setDryRunOutput(`Hata: ${res.error}`);
        toast.error('Test çıkarımı başarısız.');
      } else {
        setDryRunOutput(res.output);
        setDryRunLatency(res.latencyMs);
        toast.success(`Çıkarım tamamlandı (${res.latencyMs} ms)`);
      }
    } catch (e: any) {
      setDryRunOutput(`Hata: ${e.message}`);
      toast.error('Çıkarım hatası.');
    } finally {
      setIsRunningDryRun(false);
    }
  };

  const handleRunSentinelTest = async () => {
    if (!sentinelTestText.trim()) return;
    setIsRunningSentinelTest(true);
    setSentinelTestResult(null);
    try {
      const res = await verifyPlagiarism(sentinelTestText, true, 0, {
        searchPhrasesCount: systemSettings.sentinelSearchPhrasesCount,
        minWordCount: systemSettings.sentinelMinWordCount,
        useDynamicSimilarity: systemSettings.sentinelUseDynamicSimilarity,
        trustFilter: systemSettings.sentinelTrustFilter,
        regionFilter: systemSettings.sentinelRegionFilter,
        maxPlagiarismRate: systemSettings.sentinelMaxPlagiarismRate,
        perSourceLimit: systemSettings.sentinelPerSourceLimit,
        academicCrossCheck: systemSettings.sentinelAcademicCrossCheck
      });
      setSentinelTestResult(res);
      toast.success('Sentinel intihal denetimi tamamlandı.');
      logAction('Sentinel Live Test', `Skor: %${Math.round((res.similarityScore || 0) * 100)}`);
    } catch (e: any) {
      toast.error('Sentinel testi hatası: ' + e.message);
    } finally {
      setIsRunningSentinelTest(false);
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
        <MetricItem icon={Activity} label="Günlük Yük" value={stats.dailyLoad ?? 0} color="text-blue-500" bgColor="bg-blue-500/10" />
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
          onClick={() => setActiveTab('academic-licenses')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'academic-licenses'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <Building2 className="w-4 h-4 text-emerald-400" /> Kurumsal Lisanslar
          <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", activeTab === 'academic-licenses' ? "bg-black/20 text-black font-bold" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20")}>
            {licenses.length}
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

        <button
          onClick={() => setActiveTab('dev-api')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'dev-api'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <Code2 className="w-4 h-4" /> Geliştirici API
        </button>

        <button
          onClick={() => setActiveTab('blog')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'blog'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <BookOpen className="w-4 h-4" /> Blog Yönetimi
          <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", activeTab === 'blog' ? "bg-black/20 text-black font-bold" : "bg-white/10 text-gray-400")}>
            {blogPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('landing-cms')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeTab === 'landing-cms'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-brand-card/60 border border-brand-border text-gray-400 hover:text-white hover:bg-brand-card"
          )}
        >
          <LayoutDashboard className="w-4 h-4" /> Landing & Footer CMS
        </button>
      </div>

      {/* SEKME 1: KULLANICILAR & TARZLAR */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-card/40 border border-brand-border p-3 rounded-2xl flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
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

              {/* Kullanıcı Plan Dağılım Sayaçları ve Rol Filtreleri */}
              {userSubView === 'users' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-brand-bg border border-brand-border rounded-xl p-1">
                    {(['all', 'student', 'instructor', 'user', 'admin'] as const).map(roleKey => (
                      <button
                        key={roleKey}
                        onClick={() => setUserRoleFilter(roleKey)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                          userRoleFilter === roleKey
                            ? "bg-emerald-500 text-black font-black shadow-sm"
                            : "text-gray-400 hover:text-white"
                        )}
                      >
                        {roleKey === 'all' ? `Tümü (${users.length})`
                          : roleKey === 'student' ? `Öğrenci (${users.filter(u => u.role === 'student' || u.academicProfile === 'student').length})`
                          : roleKey === 'instructor' ? `Eğitmen (${users.filter(u => u.role === 'instructor' || u.academicProfile === 'academic').length})`
                          : roleKey === 'admin' ? `Admin (${users.filter(u => u.role === 'admin').length})`
                          : `Standart (${users.filter(u => (u.role === 'user' || !u.role) && u.academicProfile !== 'student' && u.academicProfile !== 'academic').length})`
                        }
                      </button>
                    ))}
                  </div>

                  <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-brand-border text-[10px] font-mono">
                    <span className="text-gray-400">Ücretsiz: <strong className="text-white font-bold">{users.filter(u => u.plan === 'free').length}</strong></span>
                    <span className="text-gray-600">|</span>
                    <span className="text-blue-400">Pro: <strong className="text-white font-bold">{users.filter(u => u.plan === 'pro').length}</strong></span>
                    <span className="text-gray-600">|</span>
                    <span className="text-purple-400">Premium: <strong className="text-white font-bold">{users.filter(u => u.plan === 'premium').length}</strong></span>
                  </div>
                </div>
              )}
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
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-brand-border bg-white/[0.02]">
                    {userSubView === 'users' ? (
                      <>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Kullanıcı</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Rol</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Plan</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Yetkiler</th>
                        <th className="px-4 sm:px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Günlük Kota / Doluluk</th>
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
                  {userSubView === 'users' ? filteredUsers.map(u => {
                    const charLimit = PLAN_LIMITS[u.plan]?.dailyChars || 10000;
                    const usage = u.dailyUsage || 0;
                    const usagePercent = Math.min(Math.round((usage / charLimit) * 100), 100);

                    return (
                      <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-300 font-bold truncate max-w-[200px] sm:max-w-none">{u.email}</span>
                            {ADMIN_EMAILS.includes(u.email) && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[8px] font-black rounded uppercase">Süper Admin</span>
                            )}
                          </div>
                          <div className="text-[9px] text-gray-600 font-mono">{u.uid}</div>
                          {u.institutionName && (
                            <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-0.5 font-medium">
                              <School className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[220px]">{u.institutionName}</span>
                            </div>
                          )}
                        </td>

                        {/* Rol Hücresi (Admin / Eğitmen / Öğrenci / Üye) */}
                        <td className="px-4 sm:px-6 py-3.5">
                          <select
                            value={u.role || (u.academicProfile === 'student' ? 'student' : u.academicProfile === 'academic' ? 'instructor' : 'user')}
                            disabled={ADMIN_EMAILS.includes(u.email)}
                            onChange={(e) => handleSetUserRole(u, e.target.value as any)}
                            title={ADMIN_EMAILS.includes(u.email) ? 'Süper Admin (Sabit)' : 'Kullanıcı rolünü değiştir'}
                            className={cn(
                              "text-[10px] font-black uppercase rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer transition-all",
                              u.role === 'admin'
                                ? "bg-red-500/15 text-red-400 border-red-500/30"
                                : (u.role === 'instructor' || u.academicProfile === 'academic')
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : (u.role === 'student' || u.academicProfile === 'student')
                                ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                : "bg-white/5 text-gray-300 border-white/10"
                            )}
                          >
                            <option value="user" className="bg-[#0f141a] text-gray-300">Standart Üye</option>
                            <option value="student" className="bg-[#0f141a] text-sky-400">🎓 Öğrenci</option>
                            <option value="instructor" className="bg-[#0f141a] text-emerald-400">🏛️ Eğitmen / Akademisyen</option>
                            <option value="admin" className="bg-[#0f141a] text-red-400">🛡️ Yönetici (Admin)</option>
                          </select>
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

                        {/* Görsel Kota Doluluk Çubuğu */}
                        <td className="px-4 sm:px-6 py-3.5 min-w-[160px]">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-gray-300 font-bold">{usage.toLocaleString()} / {charLimit.toLocaleString()}</span>
                              <span className={cn(
                                "font-bold",
                                usagePercent > 85 ? "text-red-400" : usagePercent > 50 ? "text-amber-400" : "text-emerald-400"
                              )}>%{usagePercent}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  usagePercent > 85 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                                )} 
                                style={{ width: `${usagePercent}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleResetSingleUserUsage(u.uid, u.email)} 
                              title="Bu Kullanıcının Kotasını Sıfırla"
                              className="p-1.5 text-gray-400 hover:text-emerald-400 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border transition-colors"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => setAssigningUser(u)} 
                              title="Hızlı Plan Ata"
                              className="p-1.5 text-gray-400 hover:text-blue-400 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border transition-colors"
                            >
                              <UserIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.uid, u.email)} 
                              title="Kullanıcıyı Sil"
                              className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : userSubView === 'tones' ? filteredTones.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-gray-200">{t.name}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-[10px] sm:text-xs text-gray-400 truncate max-w-[300px]">{t.description || 'Açıklama belirtilmemiş'}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setViewingTone(t)} 
                            title="Tarz Detayını İncele" 
                            className="p-1.5 text-gray-400 hover:text-sky-400 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTone(t.id, t.name)} 
                            title="Tarzı Sil" 
                            className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg border border-brand-border transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

      {/* SEKME: KURUMSAL LİSANSLAR & ENSTİTÜ YÖNETİMİ */}
      {activeTab === 'academic-licenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-card/40 border border-brand-border p-4 rounded-2xl flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Kurumsal Lisans Anahtarları & Enstitü Ağları</h3>
                <p className="text-xs text-gray-400">Üniversiteler, enstitüler ve akademik birimler için yetkilendirme kodları yönetimi</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLicenses}
                disabled={licensesLoading}
                className="p-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl transition-all"
                title="Yenile"
              >
                <RefreshCw className={cn("w-4 h-4", licensesLoading && "animate-spin")} />
              </button>
              <button
                onClick={() => setShowCreateLicenseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Yeni Kurumsal Lisans Tanımla
              </button>
            </div>
          </div>

          {/* Lisans Özet Sayaçları */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-brand-card border border-brand-border p-4 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Building2 className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Toplam Kurum</div>
                <div className="text-xl font-black text-white">{licenses.length}</div>
              </div>
            </div>
            <div className="bg-brand-card border border-brand-border p-4 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Key className="w-5 h-5 text-blue-400" /></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Aktif Kodlar</div>
                <div className="text-xl font-black text-white">{licenses.filter(l => l.isActive).length}</div>
              </div>
            </div>
            <div className="bg-brand-card border border-brand-border p-4 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><GraduationCap className="w-5 h-5 text-purple-400" /></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Eğitmen Kapasitesi</div>
                <div className="text-xl font-black text-white">{licenses.reduce((acc, l) => acc + (l.maxInstructors || 0), 0)}</div>
              </div>
            </div>
            <div className="bg-brand-card border border-brand-border p-4 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Users className="w-5 h-5 text-amber-400" /></div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Öğrenci Kontenjanı</div>
                <div className="text-xl font-black text-white">{licenses.reduce((acc, l) => acc + (l.maxStudents || 0), 0)}</div>
              </div>
            </div>
          </div>

          {/* Lisans Tablosu */}
          <div className="bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-brand-border bg-white/[0.02]">
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Yetki Kodu</th>
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Kurum / Üniversite</th>
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Bölüm / İletişim</th>
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Eğitmen / Öğrenci Kotası</th>
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Bitiş Tarihi</th>
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500">Durum</th>
                    <th className="px-6 py-3.5 text-[10px] font-black uppercase text-gray-500 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {licenses.map(lic => (
                    <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lic.code);
                            toast.success(`"${lic.code}" panoya kopyalandı.`);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                          title="Kodu kopyala"
                        >
                          <Key className="w-3 h-3" />
                          {lic.code}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-gray-400" />
                          {lic.institutionName}
                        </div>
                        {lic.notes && <div className="text-[10px] text-gray-500 mt-0.5">{lic.notes}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-300">{lic.department || 'Genel Akademik'}</div>
                        {lic.contactEmail && <div className="text-[10px] text-gray-500 font-mono">{lic.contactEmail}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono text-gray-300">
                          Eğitmen: <strong className="text-emerald-400">{lic.usedInstructors || 0}</strong>/{lic.maxInstructors}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                          Öğrenci: {lic.usedStudents || 0}/{lic.maxStudents}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {lic.expiresAt || 'Süresiz'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleLicense(lic)}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all flex items-center gap-1",
                            lic.isActive
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border-red-500/30"
                          )}
                        >
                          {lic.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {lic.isActive ? 'Aktif' : 'Pasif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteLicense(lic)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Lisansı Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {licenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-xs text-gray-500">
                        Kayıtlı kurumsal lisans anahtarı bulunamadı. Yeni bir lisans tanımlayabilirsiniz.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lisans Oluşturma Modalı */}
          <AnimatePresence>
            {showCreateLicenseModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0f141a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Yeni Kurumsal Lisans Tanımla</h3>
                    </div>
                    <button onClick={() => setShowCreateLicenseModal(false)} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Kurumsal Yetki Kodu (Örn: INST-ITU-2026)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={licenseForm.code}
                          onChange={(e) => setLicenseForm({ ...licenseForm, code: e.target.value.toUpperCase() })}
                          placeholder="INST-XXXX-2026"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white uppercase outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
                            setLicenseForm({ ...licenseForm, code: `INST-${rand}-2026` });
                          }}
                          className="px-3 py-2 bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-bold rounded-xl"
                        >
                          Otomatik Kod
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Üniversite / Kurum Adı</label>
                      <input
                        type="text"
                        value={licenseForm.institutionName}
                        onChange={(e) => setLicenseForm({ ...licenseForm, institutionName: e.target.value })}
                        placeholder="Örn: İstanbul Teknik Üniversitesi"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Fakülte / Bölüm</label>
                        <input
                          type="text"
                          value={licenseForm.department}
                          onChange={(e) => setLicenseForm({ ...licenseForm, department: e.target.value })}
                          placeholder="Örn: Fen Bilimleri Enstitüsü"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Yetkili E-posta</label>
                        <input
                          type="email"
                          value={licenseForm.contactEmail}
                          onChange={(e) => setLicenseForm({ ...licenseForm, contactEmail: e.target.value })}
                          placeholder="dekanlik@itu.edu.tr"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Eğitmen Kotası</label>
                        <input
                          type="number"
                          value={licenseForm.maxInstructors}
                          onChange={(e) => setLicenseForm({ ...licenseForm, maxInstructors: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Öğrenci Kotası</label>
                        <input
                          type="number"
                          value={licenseForm.maxStudents}
                          onChange={(e) => setLicenseForm({ ...licenseForm, maxStudents: parseInt(e.target.value) || 0 })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Son Geçerlilik</label>
                        <input
                          type="date"
                          value={licenseForm.expiresAt}
                          onChange={(e) => setLicenseForm({ ...licenseForm, expiresAt: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Not / Protokol Açıklaması</label>
                      <input
                        type="text"
                        value={licenseForm.notes}
                        onChange={(e) => setLicenseForm({ ...licenseForm, notes: e.target.value })}
                        placeholder="Örn: 2026-2027 YÖK Protokol Anlaşması"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowCreateLicenseModal(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateLicense}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      Lisansı Kaydet
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Kolon: Aktif Motor Kaynağı (Bulut Gemini / Yerel Ollama) + Hiperparametreler */}
          <div className="space-y-6">
            {/* Model Kaynağı ve Yerel Sunucu Kontrol Kartı */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className={cn("w-2 h-2 rounded-full", modelSource === 'local' ? (localStatus === 'online' ? "bg-emerald-400 animate-pulse" : "bg-violet-400") : "bg-sky-400")} />
                    <span className="text-[10px] font-mono font-bold text-gray-300 uppercase">
                      {modelSource === 'local' ? 'Yerel Sunucu' : 'Bulut (Google)'}
                    </span>
                  </div>
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
                    <div className="flex items-center gap-1.5">
                      {cloudLatency && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {cloudLatency} ms
                        </span>
                      )}
                      {modelSource === 'gemini' && <Check className="w-4 h-4 text-sky-400" />}
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      {localLatency && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          {localLatency} ms
                        </span>
                      )}
                      {modelSource === 'local' && <Check className="w-4 h-4 text-violet-400" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Yerel Model (Ollama)</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Lokal GPU/CPU üzerinde gizli, limitsiz ve kotasız çalıştırma</div>
                  </div>
                </button>
              </div>

              {/* Bulut Motor Hızlı Ping Testi */}
              {modelSource === 'gemini' && (
                <div className="p-3 bg-sky-500/5 border border-sky-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-[11px] font-bold text-white block">Bulut Motor Sağlık & Hız Kontrolü</span>
                      <span className="text-[9px] text-gray-400">Aktif Gemini anahtarına doğrudan ping atar</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestCloud}
                    disabled={isTestingCloud}
                    className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition flex items-center gap-1 text-[10px] font-black uppercase"
                  >
                    {isTestingCloud ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                    HIZI TEST ET
                  </button>
                </div>
              )}

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

            {/* İnference Hiperparametreleri & Yedekleme (Fallback) Kartı */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
                <Sliders className="w-4 h-4 text-emerald-500" /> İNFERENCE HİPERPARAMETRELERİ & YEDEKLEME
                <InfoTooltip text="Metin üretimindeki kesinlik/yaratıcılık seviyesi ile yerel model arızalarında otomatik buluta geçiş kuralını belirler." />
              </h3>

              <div className="space-y-4">
                {/* Temperature Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-300">Yaratıcılık / Kesinlik (Temperature)</span>
                    <span className="font-mono font-bold text-emerald-400">{systemSettings.modelTemperature ?? 0.7}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={systemSettings.modelTemperature ?? 0.7}
                    onChange={(e) => setSystemSettings(s => ({ ...s, modelTemperature: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-brand-border"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>0.0 (Deterministik / Kesin)</span>
                    <span>1.0 (Yaratıcı / Esnek)</span>
                  </div>
                </div>

                {/* Top-P Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-300">Örnekleme Çeşitliliği (Top-P)</span>
                    <span className="font-mono font-bold text-emerald-400">{systemSettings.modelTopP ?? 0.95}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={systemSettings.modelTopP ?? 0.95}
                    onChange={(e) => setSystemSettings(s => ({ ...s, modelTopP: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-brand-border"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>0.1 (Odaklı Kelimeler)</span>
                    <span>1.0 (Geniş Dağılım)</span>
                  </div>
                </div>

                {/* Otomatik Fallback Toggle */}
                <div className="pt-2">
                  <ToggleItem
                    label="Otomatik Bulut Yedekleme (Fallback)"
                    sub="Yerel model çevrimdışı olduğunda veya hata verdiğinde kesintisiz olarak Gemini Bulut motoruna devreder"
                    value={systemSettings.fallbackToCloudOnFailure ?? true}
                    onChange={(v: boolean) => {
                      setSystemSettings(s => ({ ...s, fallbackToCloudOnFailure: v }));
                      try {
                        localStorage.setItem('sentience_fallback_to_cloud', String(v));
                      } catch {}
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} HİPERPARAMETRELERİ KAYDET
                </button>
              </div>
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

          {/* Sağ Kolon: Gemini Model Seçimi & Canlı Çıkarım Test Kutusu (Dry-Run) */}
          <div className="space-y-6">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
                <Zap className="w-4 h-4 text-blue-500" /> GEMİNİ BULUT MODEL KONTROLÜ
                <InfoTooltip text="Denetçi ve İnsanlaştırma servisleri için ayrı model varyantları seçebilirsiniz. Önerilen model Gemini 2.5 Flash'tır." />
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
                        {model.name} — {model.speed} ({model.quota}) {model.recommended ? '★ Önerilen' : ''}
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
                        {model.name} — {model.speed} ({model.quota}) {model.recommended ? '★ Önerilen' : ''}
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
                    Gemini 2.5 Flash ve 3.8 Flash modelleri güncel kotayla uyumlu ve kararlıdır. 3.1 Pro derin muhakeme için ayrılmıştır.
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

            {/* Canlı Motor Testi & Dry-Run Çıkarım Kutusu */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" /> CANLI MOTOR TESTİ & DRY-RUN
                  <InfoTooltip text="Seçilen aktif motora doğrudan test cümlesi göndererek anlık yanıtını ve gecikme süresini (ms) test eder." />
                </h3>
                {dryRunLatency && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Süre: {dryRunLatency} ms
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                    <span>Test Promptu</span>
                    <span className="text-gray-500 font-mono">Hedef: {modelSource === 'local' ? 'Ollama (' + localModelName + ')' : 'Gemini (' + (systemSettings.ghostWriterModel || 'gemini-2.5-flash') + ')'}</span>
                  </div>
                  <input
                    type="text"
                    value={dryRunPrompt}
                    onChange={(e) => setDryRunPrompt(e.target.value)}
                    placeholder="Test edilecek prompt..."
                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunDryRun}
                  disabled={isRunningDryRun || !dryRunPrompt.trim()}
                  className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-black text-[10px] rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRunningDryRun ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  ÇIKARIM TESTİNİ ÇALIŞTIR
                </button>

                {dryRunOutput && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Model Yanıtı
                    </span>
                    <div className="p-3 bg-brand-bg/80 border border-brand-border rounded-xl text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                      {dryRunOutput}
                    </div>
                  </div>
                )}
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                  <button onClick={() => setNewKey({ ...newKey, provider: 'gemini' })} className={cn("py-2.5 text-xs font-black rounded-xl border transition-all", newKey.provider === 'gemini' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-white/5 border-brand-border text-gray-400")}>GEMINI API</button>
                  <button onClick={() => setNewKey({ ...newKey, provider: 'core-api' })} className={cn("py-2.5 text-xs font-black rounded-xl border transition-all", newKey.provider === 'core-api' ? "bg-purple-500/10 border-purple-500 text-purple-400" : "bg-white/5 border-brand-border text-gray-400")}>CORE API</button>
                  <button onClick={() => setNewKey({ ...newKey, provider: 'openalex' })} className={cn("py-2.5 text-xs font-black rounded-xl border transition-all", newKey.provider === 'openalex' ? "bg-sky-500/10 border-sky-500 text-sky-400" : "bg-white/5 border-brand-border text-gray-400")}>OPENALEX</button>
                  <button onClick={() => setNewKey({ ...newKey, provider: 'opencitations' })} className={cn("py-2.5 text-xs font-black rounded-xl border transition-all", newKey.provider === 'opencitations' ? "bg-amber-500/10 border-amber-500 text-amber-400" : "bg-white/5 border-brand-border text-gray-400")}>OPENCITATIONS</button>
                </div>
                <input type="password" placeholder="API Anahtarı veya Token..." value={newKey.value} onChange={(e) => setNewKey({ ...newKey, value: e.target.value })} className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-emerald-500" />
                <button onClick={handleAddKey} disabled={isAddingKey} className="px-6 py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase">KAYDET VE HAVUZA EKLE</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4 Anahtar Havuzu Grid (Gemini + CORE + OpenAlex + OpenCitations) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Gemini Anahtarları */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <span className="text-xs font-black text-gray-300 uppercase flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" /> Gemini Anahtarları ({apiKeysStatus.filter(k => k.provider === 'gemini').length})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-brand-border">
                    <Clock className="w-3 h-3 text-emerald-400" /> Sıfırlanma: {timeUntilReset}
                  </span>
                  <button onClick={() => handleRotateKey('gemini')} className="text-[10px] font-black text-emerald-400 flex items-center gap-1 hover:underline">
                    <RotateCw className="w-3 h-3" /> DÖNDÜR
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {apiKeysStatus.filter(k => k.provider === 'gemini').length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Kayıtlı Gemini anahtarı bulunamadı.</div>
                ) : (
                  apiKeysStatus.filter(k => k.provider === 'gemini').map((k: any) => {
                    const limit = k.dailyLimit || 1500;
                    const usage = k.usageCount || 0;
                    const isExhausted = k.status === 'exhausted' || usage >= limit;
                    const isTesting = testingKeyId === k.id;
                    const percent = Math.min(Math.round((usage / limit) * 100), 100);

                    return (
                      <div key={k.id} className="p-3.5 bg-white/[0.02] border border-brand-border rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              title="Durumu Aktif / Pasif Değiştir"
                              className={cn(
                                "w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 cursor-pointer shrink-0",
                                k.status === 'active' ? "bg-emerald-400 animate-pulse" : "bg-red-400"
                              )}
                            />
                            <span className="text-xs font-mono text-gray-200 font-bold truncate">{k.maskedKey}</span>
                            <span className="text-[9px] text-gray-500 font-mono shrink-0">({k.isDynamic ? 'Dinamik' : 'Env'})</span>
                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0", k.status === 'active' ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10")}>
                              {k.status === 'active' ? 'Aktif' : 'Tükenmiş/Pasif'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleTestKey(k.id, 'gemini', k.value)}
                              disabled={isTesting}
                              title="Sağlık Testi Yap (Ping)"
                              className="px-2 py-1 rounded-lg border border-brand-border text-gray-400 hover:text-emerald-400 hover:border-emerald-500/40 transition flex items-center gap-1 text-[10px] font-bold bg-white/5"
                            >
                              {isTesting ? <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> : <Activity className="w-3 h-3" />}
                              <span className="hidden sm:inline">Test Et</span>
                            </button>
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-brand-border transition-colors"
                            >
                              {k.status === 'active' ? 'Pasif' : 'Aktif'}
                            </button>
                            {k.isDynamic && (
                              <button onClick={() => handleDeleteAPIKey(k.id)} title="Anahtarı Sil" className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Kota Barı */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Günlük İstek: {usage} / {limit}</span>
                            <span className={percent > 85 ? "text-red-400 font-bold" : "text-gray-400"}>%{percent}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-700", percent > 85 ? "bg-red-500" : "bg-emerald-500")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Zamanlayıcı (Ertesi güne kalan süre) */}
                        {isExhausted && (
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-red-400 animate-pulse" />
                              Günlük Kota Doldu
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-300">
                              Yenilenmeye: {timeUntilReset}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. CORE API Havuzu */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <span className="text-xs font-black text-gray-300 uppercase flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-purple-400" /> CORE API ({apiKeysStatus.filter(k => k.provider === 'core-api').length})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-brand-border">
                    <Clock className="w-3 h-3 text-purple-400" /> Sıfırlanma: {timeUntilReset}
                  </span>
                  <button onClick={() => handleRotateKey('core-api')} className="text-[10px] font-black text-purple-400 flex items-center gap-1 hover:underline">
                    <RotateCw className="w-3 h-3" /> DÖNDÜR
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {apiKeysStatus.filter(k => k.provider === 'core-api').length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Kayıtlı CORE API anahtarı bulunamadı.</div>
                ) : (
                  apiKeysStatus.filter(k => k.provider === 'core-api').map((k: any) => {
                    const limit = k.dailyLimit || 500;
                    const usage = k.usageCount || 0;
                    const isExhausted = k.status === 'exhausted' || usage >= limit;
                    const isTesting = testingKeyId === k.id;
                    const percent = Math.min(Math.round((usage / limit) * 100), 100);

                    return (
                      <div key={k.id} className="p-3.5 bg-white/[0.02] border border-brand-border rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              title="Durumu Aktif / Pasif Değiştir"
                              className={cn(
                                "w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 cursor-pointer shrink-0",
                                k.status === 'active' ? "bg-purple-400 animate-pulse" : "bg-red-400"
                              )}
                            />
                            <span className="text-xs font-mono text-gray-200 font-bold truncate">{k.maskedKey}</span>
                            <span className="text-[9px] text-gray-500 font-mono shrink-0">({k.isDynamic ? 'Dinamik' : 'Env'})</span>
                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0", k.status === 'active' ? "text-purple-400 bg-purple-500/10" : "text-red-400 bg-red-500/10")}>
                              {k.status === 'active' ? 'Aktif' : 'Tükenmiş/Pasif'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleTestKey(k.id, 'core-api', k.value)}
                              disabled={isTesting}
                              title="Sağlık Testi Yap (Ping)"
                              className="px-2 py-1 rounded-lg border border-brand-border text-gray-400 hover:text-purple-400 hover:border-purple-500/40 transition flex items-center gap-1 text-[10px] font-bold bg-white/5"
                            >
                              {isTesting ? <Loader2 className="w-3 h-3 animate-spin text-purple-400" /> : <Activity className="w-3 h-3" />}
                              <span className="hidden sm:inline">Test Et</span>
                            </button>
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-brand-border transition-colors"
                            >
                              {k.status === 'active' ? 'Pasif' : 'Aktif'}
                            </button>
                            {k.isDynamic && (
                              <button onClick={() => handleDeleteAPIKey(k.id)} title="Anahtarı Sil" className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Kota Barı */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Günlük İstek: {usage} / {limit}</span>
                            <span className={percent > 85 ? "text-red-400 font-bold" : "text-gray-400"}>%{percent}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-700", percent > 85 ? "bg-red-500" : "bg-purple-500")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Zamanlayıcı (Ertesi güne kalan süre) */}
                        {isExhausted && (
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-red-400 animate-pulse" />
                              Günlük Kota Doldu
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-300">
                              Yenilenmeye: {timeUntilReset}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. OpenAlex API Havuzu */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <span className="text-xs font-black text-gray-300 uppercase flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> OpenAlex Havuzu ({apiKeysStatus.filter(k => k.provider === 'openalex').length})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-brand-border">
                    <Clock className="w-3 h-3 text-sky-400" /> Sıfırlanma: {timeUntilReset}
                  </span>
                  <button onClick={() => handleRotateKey('openalex')} className="text-[10px] font-black text-sky-400 flex items-center gap-1 hover:underline">
                    <RotateCw className="w-3 h-3" /> DÖNDÜR
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {apiKeysStatus.filter(k => k.provider === 'openalex').length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Kayıtlı OpenAlex anahtarı bulunamadı.</div>
                ) : (
                  apiKeysStatus.filter(k => k.provider === 'openalex').map((k: any) => {
                    const limit = k.dailyLimit || 100000;
                    const usage = k.usageCount || 0;
                    const isExhausted = k.status === 'exhausted' || usage >= limit;
                    const isTesting = testingKeyId === k.id;
                    const percent = Math.min(Math.round((usage / limit) * 100), 100);

                    return (
                      <div key={k.id} className="p-3.5 bg-white/[0.02] border border-brand-border rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              title="Durumu Aktif / Pasif Değiştir"
                              className={cn(
                                "w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 cursor-pointer shrink-0",
                                k.status === 'active' ? "bg-sky-400 animate-pulse" : "bg-red-400"
                              )}
                            />
                            <span className="text-xs font-mono text-gray-200 font-bold truncate">{k.maskedKey}</span>
                            <span className="text-[9px] text-gray-500 font-mono shrink-0">({k.isDynamic ? 'Dinamik' : 'Env'})</span>
                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0", k.status === 'active' ? "text-sky-400 bg-sky-500/10" : "text-red-400 bg-red-500/10")}>
                              {k.status === 'active' ? 'Aktif' : 'Tükenmiş/Pasif'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleTestKey(k.id, 'openalex', k.value)}
                              disabled={isTesting}
                              title="Sağlık Testi Yap (Ping)"
                              className="px-2 py-1 rounded-lg border border-brand-border text-gray-400 hover:text-sky-400 hover:border-sky-500/40 transition flex items-center gap-1 text-[10px] font-bold bg-white/5"
                            >
                              {isTesting ? <Loader2 className="w-3 h-3 animate-spin text-sky-400" /> : <Activity className="w-3 h-3" />}
                              <span className="hidden sm:inline">Test Et</span>
                            </button>
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-brand-border transition-colors"
                            >
                              {k.status === 'active' ? 'Pasif' : 'Aktif'}
                            </button>
                            {k.isDynamic && (
                              <button onClick={() => handleDeleteAPIKey(k.id)} title="Anahtarı Sil" className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Kota Barı */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Günlük İstek: {usage} / 100k</span>
                            <span className={percent > 85 ? "text-red-400 font-bold" : "text-gray-400"}>%{percent}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-700 bg-sky-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Zamanlayıcı (Ertesi güne kalan süre) */}
                        {isExhausted && (
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-red-400 animate-pulse" />
                              Günlük Kota Doldu
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-300">
                              Yenilenmeye: {timeUntilReset}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. OpenCitations Havuzu */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <span className="text-xs font-black text-gray-300 uppercase flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-amber-400" /> OpenCitations ({apiKeysStatus.filter(k => k.provider === 'opencitations').length})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-brand-border">
                    <Clock className="w-3 h-3 text-amber-400" /> Sıfırlanma: {timeUntilReset}
                  </span>
                  <button onClick={() => handleRotateKey('opencitations')} className="text-[10px] font-black text-amber-400 flex items-center gap-1 hover:underline">
                    <RotateCw className="w-3 h-3" /> DÖNDÜR
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {apiKeysStatus.filter(k => k.provider === 'opencitations').length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Kayıtlı OpenCitations anahtarı bulunamadı.</div>
                ) : (
                  apiKeysStatus.filter(k => k.provider === 'opencitations').map((k: any) => {
                    const limit = k.dailyLimit || 5000;
                    const usage = k.usageCount || 0;
                    const isExhausted = k.status === 'exhausted' || usage >= limit;
                    const isTesting = testingKeyId === k.id;
                    const percent = Math.min(Math.round((usage / limit) * 100), 100);

                    return (
                      <div key={k.id} className="p-3.5 bg-white/[0.02] border border-brand-border rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              title="Durumu Aktif / Pasif Değiştir"
                              className={cn(
                                "w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 cursor-pointer shrink-0",
                                k.status === 'active' ? "bg-amber-400 animate-pulse" : "bg-red-400"
                              )}
                            />
                            <span className="text-xs font-mono text-gray-200 font-bold truncate">{k.maskedKey}</span>
                            <span className="text-[9px] text-gray-500 font-mono shrink-0">({k.isDynamic ? 'Dinamik' : 'Env'})</span>
                            <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0", k.status === 'active' ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10")}>
                              {k.status === 'active' ? 'Aktif' : 'Tükenmiş/Pasif'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleTestKey(k.id, 'opencitations', k.value)}
                              disabled={isTesting}
                              title="Sağlık Testi Yap (Ping)"
                              className="px-2 py-1 rounded-lg border border-brand-border text-gray-400 hover:text-amber-400 hover:border-amber-500/40 transition flex items-center gap-1 text-[10px] font-bold bg-white/5"
                            >
                              {isTesting ? <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> : <Activity className="w-3 h-3" />}
                              <span className="hidden sm:inline">Test Et</span>
                            </button>
                            <button
                              onClick={() => handleToggleKeyStatus(k.id, k.status)}
                              className="text-[10px] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-brand-border transition-colors"
                            >
                              {k.status === 'active' ? 'Pasif' : 'Aktif'}
                            </button>
                            {k.isDynamic && (
                              <button onClick={() => handleDeleteAPIKey(k.id)} title="Anahtarı Sil" className="text-gray-500 hover:text-red-400 p-1">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Kota Barı */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Günlük İstek: {usage} / 5.000</span>
                            <span className={percent > 85 ? "text-red-400 font-bold" : "text-gray-400"}>%{percent}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-700", percent > 85 ? "bg-red-500" : "bg-amber-500")}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Zamanlayıcı (Ertesi güne kalan süre) */}
                        {isExhausted && (
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-red-400 animate-pulse" />
                              Günlük Kota Doldu
                            </span>
                            <span className="text-[10px] font-mono font-bold text-red-300">
                              Yenilenmeye: {timeUntilReset}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEKME 4: İNTİHAL & SENTINEL YÖNETİMİ */}
      {activeTab === 'sentinel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Kolon: İntihal Parametreleri, Akademik Protokol ve Doğrulama Havuzu */}
          <div className="space-y-6">
            {/* 1. İntihal Parametreleri & Akademik Protokol Eşikleri (GEMINI.md Madde 5.1) */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
                <ShieldCheck className="w-4 h-4 text-purple-500" /> İNTİHAL MOTORU & AKADEMİK PROTOKOL
                <InfoTooltip text="GEMINI.md Protokolü 5. Bölüm ve Turnitin uyum eşiklerini buradan yapılandırabilirsiniz." />
              </h3>

              <div className="space-y-4">
                {/* Azami Genel İntihal Sınırı */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Maksimum Genel İntihal Sınırı</span>
                    <span className="text-xs font-mono text-purple-400 font-bold">%{systemSettings.sentinelMaxPlagiarismRate ?? 15}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={systemSettings.sentinelMaxPlagiarismRate ?? 15}
                    onChange={(e) => setSystemSettings(s => ({ ...s, sentinelMaxPlagiarismRate: parseInt(e.target.value) }))}
                    className="w-full h-1.5 accent-purple-500 bg-white/10 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>%5 (Sıkı Akademik)</span>
                    <span>%15 (Protokol Standardı)</span>
                    <span>%30 (Esnek)</span>
                  </div>
                </div>

                {/* Kaynak Başına Benzerlik Sınırı */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Kaynak Başına Benzerlik Limiti</span>
                    <span className="text-xs font-mono text-purple-400 font-bold">%{systemSettings.sentinelPerSourceLimit ?? 3}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={systemSettings.sentinelPerSourceLimit ?? 3}
                    onChange={(e) => setSystemSettings(s => ({ ...s, sentinelPerSourceLimit: parseInt(e.target.value) }))}
                    className="w-full h-1.5 accent-purple-500 bg-white/10 rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                    <span>%1 (Yüksek Orijinallik)</span>
                    <span>%3 (Protokol Limiti)</span>
                    <span>%10 (Geniş Pay)</span>
                  </div>
                </div>

                {/* Taranacak Cümle Sayısı */}
                <div className="space-y-2 pt-2 border-t border-brand-border">
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
                  <p className="text-[9px] text-gray-500">Metinden kaç cümle Google / Çapraz havuzda taranacak</p>
                </div>

                {/* Minimum Kelime Eşiği */}
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

                {/* Gelişmiş Filtreler */}
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
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} İNTİHAL & PROTOKOL AYARLARINI GÜNCELLE
                </button>
              </div>
            </div>

            {/* 2. Otoriter Çapraz Doğrulama Havuzu (CrossCheck) */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
                <Database className="w-4 h-4 text-emerald-400" /> OTORİTER ÇAPRAZ DOĞRULAMA HAVUZU
                <InfoTooltip text="Turnitin ve akademik yayın standartlarına göre kaynak doğrulamasında taranacak otoriter veri tabanları." />
              </h3>

              <div className="space-y-2">
                <ToggleItem
                  label="Crossref Doğrulaması"
                  sub="Resmi DOI, akademik dergi ve yayın tescil kayıtlarında çapraz kontrol"
                  value={systemSettings.sentinelAcademicCrossCheck?.crossref ?? true}
                  onChange={(v: boolean) => setSystemSettings(s => ({
                    ...s,
                    sentinelAcademicCrossCheck: { ...(s.sentinelAcademicCrossCheck || { crossref: true, semanticScholar: true, pubmed: true, core: true }), crossref: v }
                  }))}
                />
                <ToggleItem
                  label="Semantic Scholar Ağı"
                  sub="Yapay zeka destekli 200M+ akademik makale ve atıf grafiğinde benzerlik taraması"
                  value={systemSettings.sentinelAcademicCrossCheck?.semanticScholar ?? true}
                  onChange={(v: boolean) => setSystemSettings(s => ({
                    ...s,
                    sentinelAcademicCrossCheck: { ...(s.sentinelAcademicCrossCheck || { crossref: true, semanticScholar: true, pubmed: true, core: true }), semanticScholar: v }
                  }))}
                />
                <ToggleItem
                  label="PubMed & arXiv Arşivi"
                  sub="Tıp, biyoloji, fizik ve bilgisayar bilimleri açık erişimli ön baskı ve hakemli makaleler"
                  value={systemSettings.sentinelAcademicCrossCheck?.pubmed ?? true}
                  onChange={(v: boolean) => setSystemSettings(s => ({
                    ...s,
                    sentinelAcademicCrossCheck: { ...(s.sentinelAcademicCrossCheck || { crossref: true, semanticScholar: true, pubmed: true, core: true }), pubmed: v }
                  }))}
                />
                <ToggleItem
                  label="CORE API Açık Erişim Havuzu"
                  sub="Dünya genelinde üniversite ve kurumsal arşivlerdeki açık erişim tam metinleri"
                  value={systemSettings.sentinelAcademicCrossCheck?.core ?? true}
                  onChange={(v: boolean) => setSystemSettings(s => ({
                    ...s,
                    sentinelAcademicCrossCheck: { ...(s.sentinelAcademicCrossCheck || { crossref: true, semanticScholar: true, pubmed: true, core: true }), core: v }
                  }))}
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} DOĞRULAMA HAVUZUNU KAYDET
              </button>
            </div>

            {/* 3. B22: Özellik Erişim Anahtarları */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
                <Globe className="w-4 h-4 text-emerald-500" /> ÖZELLİK ERİŞİM ANAHTARLARI
                <InfoTooltip text="Kapalıyken bu bölümleri yalnızca admin ve Kullanıcılar sekmesinden tek tek yetki verilen kişiler görür. Açtığınızda tüm kullanıcılara görünür olur." />
              </h3>
              <div className="space-y-2">
                <ToggleItem
                  label="Tanıtım Sitesini Görüntüle"
                  sub="Sol alt menüdeki tanıtım sitesi bağlantısı"
                  value={systemSettings.featureAccess?.promoSite ?? false}
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, featureAccess: { ...s.featureAccess, promoSite: v } }))}
                />
                <ToggleItem
                  label="Sınıflarım"
                  sub="Sol alt menü butonu ve sınıf/ödev çalışma alanı"
                  value={systemSettings.featureAccess?.classroom ?? false}
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, featureAccess: { ...s.featureAccess, classroom: v } }))}
                />
                <ToggleItem
                  label="Veri İndir (JSONL)"
                  sub="Eğitim verisi dışa aktarma butonu"
                  value={systemSettings.featureAccess?.trainingData ?? false}
                  onChange={(v: any) => setSystemSettings(s => ({ ...s, featureAccess: { ...s.featureAccess, trainingData: v } }))}
                />
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-2.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} ERİŞİM AYARLARINI KAYDET
              </button>
            </div>
          </div>

          {/* Sağ Kolon: Canlı Sentinel Testi & Filtrelenebilir Denetim Geçmişi */}
          <div className="space-y-6">
            {/* 4. Canlı Sentinel İntihal Simülasyonu (Dry-Run Test) */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-400" /> CANLI SENTINEL İNTİHAL DENETİMİ
                  <InfoTooltip text="Sistemin intihal motorunu ve akademik protokol kuralını doğrudan test edin." />
                </h3>
                {sentinelTestResult && (
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded border",
                    (sentinelTestResult.similarityScore || 0) > 0.15 ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  )}>
                    Benzerlik: %{Math.round((sentinelTestResult.similarityScore || 0) * 100)}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Test Edilecek Metin / Alıntı</label>
                  <textarea
                    rows={3}
                    value={sentinelTestText}
                    onChange={(e) => setSentinelTestText(e.target.value)}
                    placeholder="İntihal ve kaynak taraması yapılacak test metni..."
                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 font-mono resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunSentinelTest}
                  disabled={isRunningSentinelTest || !sentinelTestText.trim()}
                  className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-black font-black text-[10px] rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/20"
                >
                  {isRunningSentinelTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  SENTINEL İNTİHAL TARAMASINI ÇALIŞTIR
                </button>

                {sentinelTestResult && (
                  <div className="space-y-3 pt-2 border-t border-brand-border">
                    {/* Akademik Uyumluluk Kartı */}
                    <div className={cn(
                      "p-3 rounded-xl border flex items-start gap-2.5",
                      sentinelTestResult.academicCompliance?.isCompliant !== false
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/5 border-red-500/30 text-red-300"
                    )}>
                      {sentinelTestResult.academicCompliance?.isCompliant !== false ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div className="text-xs space-y-1">
                        <div className="font-bold">
                          {sentinelTestResult.academicCompliance?.isCompliant !== false
                            ? 'Akademik Protokol Standardına Uygun'
                            : 'Akademik Protokol İhlali Tespit Edildi'}
                        </div>
                        {sentinelTestResult.academicCompliance?.violations?.length > 0 && (
                          <ul className="text-[10px] space-y-0.5 list-disc list-inside text-red-400 font-mono">
                            {sentinelTestResult.academicCompliance.violations.map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Tespit Edilen Kaynaklar */}
                    {sentinelTestResult.sources && sentinelTestResult.sources.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Eşleşen Kaynaklar ({sentinelTestResult.sources.length})</span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                          {sentinelTestResult.sources.map((src: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-brand-bg border border-brand-border rounded-xl flex items-center justify-between text-xs">
                              <div className="min-w-0 pr-2">
                                <span className="font-bold text-gray-200 block truncate">{src.title || src.url}</span>
                                <a href={src.url} target="_blank" rel="noreferrer" className="text-[10px] text-purple-400 hover:underline flex items-center gap-1 truncate">
                                  {src.url} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              </div>
                              <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 shrink-0">
                                %{Math.round((src.similarity || 0) * 100)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white/[0.02] border border-brand-border rounded-xl text-center text-[10px] text-gray-500">
                        Doğrudan eşleşen harici intihal kaynağı bulunamadı (Özgün metin).
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Filtrelenebilir Sentinel Denetim Geçmişi */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider">
                    SENTINEL DENETİM GEÇMİŞİ
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500">({filteredSentinelLogs.length})</span>
                </div>

                {/* Filtreleme Butonları */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-brand-border">
                  <button
                    type="button"
                    onClick={() => setSentinelFilter('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                      sentinelFilter === 'all' ? "bg-purple-500 text-black font-black" : "text-gray-400 hover:text-white"
                    )}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => setSentinelFilter('clean')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                      sentinelFilter === 'clean' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:text-white"
                    )}
                  >
                    Temiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setSentinelFilter('violation')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                      sentinelFilter === 'violation' ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-gray-400 hover:text-white"
                    )}
                  >
                    İhlal / Hata
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredSentinelLogs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">Seçilen filtrede log kaydı bulunamadı.</div>
                ) : (
                  filteredSentinelLogs.map((log: any) => {
                    const isExpanded = expandedLogs.includes(log.id);
                    const isViolation =
                      log.status === 'error' ||
                      log.status === 'violation' ||
                      log.message?.toLowerCase().includes('ihlal') ||
                      log.message?.toLowerCase().includes('hata');

                    return (
                      <div key={log.id} className="p-3 bg-white/[0.01] border border-brand-border rounded-xl">
                        <div onClick={() => toggleLogExpansion(log.id)} className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2 min-w-0">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              isViolation ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                            )} />
                            <span className="text-xs font-bold text-gray-300 truncate">{log.userEmail || 'Anonim'}</span>
                            {isViolation && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                                İhlal
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-gray-600 font-mono shrink-0">
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
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEKME: GELİŞTİRİCİ API */}
      {activeTab === 'dev-api' && (
        <DeveloperApiView />
      )}

      {/* SEKME: BLOG YÖNETİMİ */}
      {activeTab === 'blog' && (
        <div className="space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> BLOG YAZILARI & EDİTORYAL YÖNETİM
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Akademik etik, intihal ve yapay zeka tespiti blog içeriklerini yönetin, yeni yazılar ekleyin veya taslağa alın.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSeedBlogDefaults}
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-brand-border hover:bg-white/10 text-gray-300 text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  Varsayılanları Senkronize Et
                </button>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setPostForm({
                      title: '',
                      slug: '',
                      category: 'Akademik Etik & Özgünlük',
                      readTime: '7 dk okuma',
                      date: 'Ekim 2026',
                      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
                      summary: '',
                      leadParagraph: '',
                      published: true
                    });
                    setIsCreatingPost(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Yeni Yazı Ekle
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={blogSearchTerm}
                onChange={(e) => setBlogSearchTerm(e.target.value)}
                placeholder="Başlık, kategori veya özet ara..."
                className="w-full pl-11 pr-4 py-2.5 bg-black/40 border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {blogLoading ? (
              <div className="p-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Yazılar yükleniyor...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {blogPosts
                  .filter(
                    (p) =>
                      p.title.toLowerCase().includes(blogSearchTerm.toLowerCase()) ||
                      p.category.toLowerCase().includes(blogSearchTerm.toLowerCase()) ||
                      p.slug.toLowerCase().includes(blogSearchTerm.toLowerCase())
                  )
                  .map((post) => (
                    <div
                      key={post.id}
                      className="p-4 bg-white/[0.01] border border-brand-border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-brand-border/80 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={post.image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=300'}
                          alt={post.title}
                          className="w-16 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                              #{post.id}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-emerald-400/90 px-2 py-0.5 rounded bg-emerald-500/10">
                              {post.category}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {post.readTime}
                            </span>
                            {post.published !== false ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <Eye className="w-2.5 h-2.5" /> Yayında
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <EyeOff className="w-2.5 h-2.5" /> Taslak
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{post.title}</h4>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{post.summary}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                          title="Önizle"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleTogglePostPublish(post)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5",
                            post.published !== false
                              ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                          )}
                        >
                          {post.published !== false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {post.published !== false ? 'Taslağa Al' : 'Yayınla'}
                        </button>

                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setPostForm({ ...post });
                            setIsCreatingPost(true);
                          }}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeletePost(post)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {isCreatingPost && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-brand-card border border-brand-border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
                <div className="p-5 border-b border-brand-border flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    {editingPost ? 'Yazıyı Düzenle' : 'Yeni Blog Yazısı Oluştur'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsCreatingPost(false);
                      setEditingPost(null);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Başlık</label>
                    <input
                      type="text"
                      value={postForm.title || ''}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      placeholder="Makale başlığı..."
                      className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bağlantı (Slug)</label>
                      <input
                        type="text"
                        value={postForm.slug || ''}
                        onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                        placeholder="ornek-yazi-basligi"
                        className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kategori</label>
                      <input
                        type="text"
                        value={postForm.category || ''}
                        onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                        placeholder="Akademik Etik & Özgünlük"
                        className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Okuma Süresi</label>
                      <input
                        type="text"
                        value={postForm.readTime || ''}
                        onChange={(e) => setPostForm({ ...postForm, readTime: e.target.value })}
                        placeholder="7 dk okuma"
                        className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Görsel URL</label>
                      <input
                        type="text"
                        value={postForm.image || ''}
                        onChange={(e) => setPostForm({ ...postForm, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kısa Özet</label>
                    <textarea
                      rows={2}
                      value={postForm.summary || ''}
                      onChange={(e) => setPostForm({ ...postForm, summary: e.target.value })}
                      placeholder="Makalenin arama ve liste görünümünde çıkacak özeti..."
                      className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giriş Paragrafı (Lead)</label>
                    <textarea
                      rows={3}
                      value={postForm.leadParagraph || ''}
                      onChange={(e) => setPostForm({ ...postForm, leadParagraph: e.target.value })}
                      placeholder="Yazının başında kalın puntoyla görüntülenecek giriş metni..."
                      className="w-full px-3 py-2 bg-black/50 border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="publishedCheck"
                      checked={postForm.published !== false}
                      onChange={(e) => setPostForm({ ...postForm, published: e.target.checked })}
                      className="rounded accent-emerald-500"
                    />
                    <label htmlFor="publishedCheck" className="text-xs font-bold text-gray-300 cursor-pointer">
                      Yazıyı hemen yayına al (Herkes görsün)
                    </label>
                  </div>
                </div>

                <div className="p-4 border-t border-brand-border flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsCreatingPost(false);
                      setEditingPost(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSaveBlogPost}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEKME: LANDING PAGE & FOOTER CMS */}
      {activeTab === 'landing-cms' && (
        <div className="space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" /> LANDING PAGE & FOOTER CMS
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Hero başlıkları, duyuru şeridi, istatistik sayaçları ve kurumsal footer bilgilerini tek panelden güncelleyin.
                </p>
              </div>

              <button
                onClick={handleSaveCmsConfig}
                disabled={cmsSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                {cmsSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Tüm Değişiklikleri Kaydet
              </button>
            </div>

            {/* Bölüm 1: Duyuru Şeridi */}
            <div className="p-4 bg-white/[0.01] border border-brand-border rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">1. Duyuru Şeridi (Üst Banner)</span>
                <ToggleItem
                  label=""
                  sub="Aktif"
                  value={cmsConfig.announcement.enabled}
                  onChange={(v) =>
                    setCmsConfig({ ...cmsConfig, announcement: { ...cmsConfig.announcement, enabled: v } })
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Duyuru Metni</label>
                  <input
                    type="text"
                    value={cmsConfig.announcement.text}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        announcement: { ...cmsConfig.announcement, text: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Buton / Link Metni</label>
                  <input
                    type="text"
                    value={cmsConfig.announcement.linkText}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        announcement: { ...cmsConfig.announcement, linkText: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bölüm 2: Hero Alanı */}
            <div className="p-4 bg-white/[0.01] border border-brand-border rounded-xl space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">2. Hero Alanı</span>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Üst Rozet Metni</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.badge}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, badge: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ana Başlık (Title)</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.title}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, title: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alt Açıklama (Subtitle)</label>
                  <textarea
                    rows={2}
                    value={cmsConfig.hero.subtitle}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, subtitle: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Birincil Buton (CTA)</label>
                    <input
                      type="text"
                      value={cmsConfig.hero.ctaPrimary}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          hero: { ...cmsConfig.hero, ctaPrimary: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">İkincil Buton (Kılavuz)</label>
                    <input
                      type="text"
                      value={cmsConfig.hero.ctaSecondary}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          hero: { ...cmsConfig.hero, ctaSecondary: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bölüm 3: İstatistik Sayaçları */}
            <div className="p-4 bg-white/[0.01] border border-brand-border rounded-xl space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">3. İstatistik Sayaçları</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {cmsConfig.stats.map((stat, idx) => (
                  <div key={stat.id || idx} className="p-3 bg-black/40 border border-brand-border rounded-xl space-y-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase">Değer</label>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => {
                          const updated = [...cmsConfig.stats];
                          updated[idx] = { ...updated[idx], value: e.target.value };
                          setCmsConfig({ ...cmsConfig, stats: updated });
                        }}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-brand-border rounded-lg text-emerald-400 font-mono text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase">Başlık</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => {
                          const updated = [...cmsConfig.stats];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setCmsConfig({ ...cmsConfig, stats: updated });
                        }}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-brand-border rounded-lg text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase">Açıklama</label>
                      <input
                        type="text"
                        value={stat.description}
                        onChange={(e) => {
                          const updated = [...cmsConfig.stats];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setCmsConfig({ ...cmsConfig, stats: updated });
                        }}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-brand-border rounded-lg text-gray-400 text-[10px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bölüm 4: Kurumsal Footer & İletişim */}
            <div className="p-4 bg-white/[0.01] border border-brand-border rounded-xl space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">4. Kurumsal Footer & İletişim</span>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Footer Açıklama Metni</label>
                  <textarea
                    rows={2}
                    value={cmsConfig.footer.description}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        footer: { ...cmsConfig.footer, description: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Destek E-postası</label>
                    <input
                      type="email"
                      value={cmsConfig.footer.email}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          footer: { ...cmsConfig.footer, email: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Telefon Numarası</label>
                    <input
                      type="text"
                      value={cmsConfig.footer.phone}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          footer: { ...cmsConfig.footer, phone: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Çalışma Saatleri</label>
                    <input
                      type="text"
                      value={cmsConfig.footer.workingHours}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          footer: { ...cmsConfig.footer, workingHours: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Fiziksel Adres</label>
                  <input
                    type="text"
                    value={cmsConfig.footer.address}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        footer: { ...cmsConfig.footer, address: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Twitter / X URL</label>
                    <input
                      type="text"
                      value={cmsConfig.footer.twitterUrl}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          footer: { ...cmsConfig.footer, twitterUrl: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">GitHub URL</label>
                    <input
                      type="text"
                      value={cmsConfig.footer.githubUrl}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          footer: { ...cmsConfig.footer, githubUrl: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={cmsConfig.footer.linkedinUrl}
                      onChange={(e) =>
                        setCmsConfig({
                          ...cmsConfig,
                          footer: { ...cmsConfig.footer, linkedinUrl: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Telif Hakkı Metni (Copyright)</label>
                  <input
                    type="text"
                    value={cmsConfig.footer.copyright}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        footer: { ...cmsConfig.footer, copyright: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-brand-border rounded-xl text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bölüm 5: Footer Görünürlük & Modül Aç/Kapa Kontrolleri */}
            <div className="p-4 bg-white/[0.01] border border-brand-border rounded-xl space-y-4">
              <div className="border-b border-brand-border pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">5. Footer Görünürlük &amp; Modül Aç / Kapa Yönetimi</span>
                <span className="text-[10px] text-gray-400">Footer bileşenlerini, sütunlarını, iletişim detaylarını ve yasal linkleri tek tıkla açıp kapatın.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Sütunlar & Ana Bloklar */}
                <div className="p-3 bg-black/40 border border-brand-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Ana Sütunlar &amp; Bloklar</span>
                  <ToggleItem
                    label="Çözümler & Modüller Sütunu"
                    sub="Denetçi, İnsanlaştırma, Sentinel, StyleMaster"
                    value={cmsConfig.footer.showModulesCol ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showModulesCol: val } })}
                  />
                  <ToggleItem
                    label="Rehber & İçerik Sütunu"
                    sub="Kılavuz, Blog, Fiyatlandırma, Hukuki metinler"
                    value={cmsConfig.footer.showGuidesCol ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showGuidesCol: val } })}
                  />
                  <ToggleItem
                    label="Kurumsal İletişim Sütunu"
                    sub="Adres, e-posta, telefon ve çalışma saatleri"
                    value={cmsConfig.footer.showContactCol ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showContactCol: val } })}
                  />
                  <ToggleItem
                    label="Alt Telif Çubuğu (Bottom Bar)"
                    sub="En alttaki telif bandı ve hızlı linkler"
                    value={cmsConfig.footer.showBottomBar ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showBottomBar: val } })}
                  />
                </div>

                {/* Rozetler & İletişim Detayları */}
                <div className="p-3 bg-black/40 border border-brand-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Rozetler &amp; İletişim Alanları</span>
                  <ToggleItem
                    label="Güven Rozetleri"
                    sub="YÖK / TÜBİTAK ve Sıfır-Veri etiketleri"
                    value={cmsConfig.footer.showTrustBadges ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showTrustBadges: val } })}
                  />
                  <ToggleItem
                    label="Sosyal Medya İkonları"
                    sub="Twitter/X, GitHub ve LinkedIn butonları"
                    value={cmsConfig.footer.showSocialLinks ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showSocialLinks: val } })}
                  />
                  <ToggleItem
                    label="Fiziksel Adres Satırı"
                    sub="Kurumsal ofis ve Ar-Ge adresi"
                    value={cmsConfig.footer.showAddress ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showAddress: val } })}
                  />
                  <ToggleItem
                    label="E-posta Satırı"
                    sub="Destek e-posta adresi bağlantısı"
                    value={cmsConfig.footer.showEmail ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showEmail: val } })}
                  />
                  <ToggleItem
                    label="Telefon Satırı"
                    sub="Çağrı merkezi / telefon bağlantısı"
                    value={cmsConfig.footer.showPhone ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showPhone: val } })}
                  />
                  <ToggleItem
                    label="Çalışma Saatleri"
                    sub="Haftalık mesai ve destek saatleri"
                    value={cmsConfig.footer.showWorkingHours ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showWorkingHours: val } })}
                  />
                </div>

                {/* Hukuki Linkler & Sözleşmeler */}
                <div className="p-3 bg-black/40 border border-brand-border rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Yasal &amp; Hukuki Sözleşmeler</span>
                  <ToggleItem
                    label="Gizlilik Politikası Linki"
                    sub="11 maddelik resmi gizlilik politikası"
                    value={cmsConfig.footer.showPrivacy ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showPrivacy: val } })}
                  />
                  <ToggleItem
                    label="KVKK Aydınlatma Metni"
                    sub="6698 sayılı kanun aydınlatma metni"
                    value={cmsConfig.footer.showKvkk ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showKvkk: val } })}
                  />
                  <ToggleItem
                    label="Kullanıcı Sözleşmesi"
                    sub="Kullanım ve hizmet şartları sözleşmesi"
                    value={cmsConfig.footer.showTerms ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showTerms: val } })}
                  />
                  <ToggleItem
                    label="Çerez Politikası"
                    sub="Zorunlu çerez bilgilendirme linki"
                    value={cmsConfig.footer.showCookies ?? true}
                    onChange={(val: boolean) => setCmsConfig({ ...cmsConfig, footer: { ...cmsConfig.footer, showCookies: val } })}
                  />
                </div>
              </div>
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

      {viewingTone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-brand-card border border-brand-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase">{viewingTone.name}</h3>
              </div>
              <button onClick={() => setViewingTone(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Tarz Açıklaması / Kural</span>
                <div className="p-3 bg-brand-bg rounded-xl border border-brand-border text-gray-300 leading-relaxed font-mono">
                  {viewingTone.description || 'Açıklama belirtilmemiş.'}
                </div>
              </div>
              {viewingTone.sampleText && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Örnek Referans Metin</span>
                  <div className="p-3 bg-brand-bg rounded-xl border border-brand-border text-gray-400 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar font-mono">
                    {viewingTone.sampleText}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-brand-border">
                <span>Oluşturan: {viewingTone.createdBy || viewingTone.userId || 'Bilinmiyor'}</span>
                <span>ID: {viewingTone.id}</span>
              </div>
            </div>
            <button onClick={() => setViewingTone(null)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-gray-300 transition-colors">
              Kapat
            </button>
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

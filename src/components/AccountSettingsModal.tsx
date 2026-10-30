import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  CreditCard, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert,
  ChevronRight,
  LogOut,
  Settings,
  Mail,
  Zap,
  Info,
  Bell,
  GraduationCap,
  Building2,
  Key,
  ShieldCheck,
  Copy,
  Check,
  Download,
  FileText,
  Clock,
  Sparkles,
  Award,
  Palette
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { AppUser, PLAN_LIMITS } from '../types';
import { requestNotificationPermission, getNotificationPermission, isNotificationSupported } from '../utils/browserNotification';
import { validateInstitutionCode } from '../services/institutionLicenseService';
import { ORDERED_THEMES, getCurrentTheme, applyTheme } from '../services/themeService';

interface AccountSettingsModalProps {
  user: AppUser;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'word' | 'theme' | 'subscription' | 'danger'>('profile');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [copiedUid, setCopiedUid] = useState(false);
  const [institutionCodeInput, setInstitutionCodeInput] = useState('');
  const [isActivatingCode, setIsActivatingCode] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => getCurrentTheme().id);

  const isAcademicOrAdmin = user.role === 'student' || user.role === 'instructor' || user.role === 'admin';

  useEffect(() => {
    if (!isAcademicOrAdmin && (activeTab === 'academic' || activeTab === 'word')) {
      setActiveTab('profile');
    }
  }, [isAcademicOrAdmin, activeTab]);

  const handleSelectTheme = (themeId: string) => {
    const updated = applyTheme(themeId);
    setCurrentThemeId(updated.id);
    toast.success(`${updated.name} teması uygulandı.`);
  };

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      toast.success('Öğrenci / Masaüstü Tokeni panoya kopyalandı!');
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleActivateInstitution = async () => {
    if (!institutionCodeInput.trim()) {
      toast.error('Lütfen bir kurumsal lisans anahtarı girin.');
      return;
    }
    setIsActivatingCode(true);
    try {
      const res = await validateInstitutionCode(institutionCodeInput);
      if (!res.valid || !res.license) {
        toast.error(res.error || 'Geçersiz kurumsal lisans kodu.');
        return;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        institution: res.license.institutionName,
        institutionDomain: res.license.department || res.license.institutionName,
        plan: user.plan === 'premium' ? 'premium' : 'pro',
        featureGrants: {
          ...(user.featureGrants || {}),
          classroom: true,
        }
      });
      toast.success(`Tebrikler! ${res.license.institutionName} lisansı başarıyla tanımlandı.`);
      setInstitutionCodeInput('');
    } catch (err: any) {
      toast.error('Lisans aktifleştirme sırasında bir hata oluştu: ' + (err?.message || ''));
    } finally {
      setIsActivatingCode(false);
    }
  };

  const handleToggleNotification = async () => {
    if (!isNotificationSupported()) {
      toast.error('Tarayıcınız bildirim özelliğini desteklemiyor.');
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      toast.success('Tarayıcı bildirimleri etkinleştirildi.');
    } else {
      toast.error('Bildirim izni verilmedi veya engellendi.');
    }
  };

  const handleCancelSubscription = async () => {
    if (user.plan === 'free') return;
    
    if (!confirm('Ücretli üyeliğinizi iptal etmek istediğinize emin misiniz? Mevcut dönem sonuna kadar özelliklere erişmeye devam edeceksiniz.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cancelAtPeriodEnd: true,
      });
      toast.success('Üyeliğiniz dönem sonunda iptal edilecek şekilde güncellendi.');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('İptal işlemi sırasında bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== 'SİL') {
      toast.error('Lütfen silme işlemini onaylamak için "SİL" yazın.');
      return;
    }

    setIsProcessing(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Oturum bulunamadı.');

      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(currentUser);
      
      toast.success('Hesabınız ve tüm verileriniz başarıyla silindi.');
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Bu işlem için yeniden oturum açmanız gerekiyor. Güvenlik gereği lütfen çıkış yapıp tekrar girin.');
      } else {
        toast.error('Hesap silme işlemi sırasında bir hata oluştu.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    ...(isAcademicOrAdmin ? [
      { id: 'academic', label: 'Akademik & Kurum', icon: GraduationCap },
      { id: 'word', label: 'Word Eklentisi', icon: FileText },
    ] : []),
    { id: 'theme', label: 'Görünüm & Tema', icon: Palette },
    { id: 'subscription', label: 'Abonelik & Kotalar', icon: CreditCard },
    { id: 'danger', label: 'Hesabı Kapat', icon: ShieldAlert },
  ];

  const planLimit = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
  const dailyUsage = user.dailyUsage || 0;
  const usagePct = Math.min(100, Math.round((dailyUsage / planLimit.dailyChars) * 100));

  const roleLabel = user.role === 'student' 
    ? 'Öğrenci Hesabı' 
    : user.role === 'instructor' 
    ? 'Akademisyen / Eğitmen' 
    : user.role === 'admin' 
    ? 'Platform Yöneticisi' 
    : 'Standart Kullanıcı';

  const roleBadgeColor = user.role === 'student'
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : user.role === 'instructor'
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : user.role === 'admin'
    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    : 'bg-white/10 text-gray-400 border-white/10';

  const isEduEmail = Boolean(user.email && (user.email.endsWith('.edu.tr') || user.email.includes('.edu')));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[540px]"
      >
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white/[0.02] border-r border-white/5 p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between lg:block">
            <h2 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-500" /> AYARLAR
            </h2>
            <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300 border border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden lg:block pt-6 border-t border-white/5">
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-3 px-4 py-3 w-full text-xs font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Oturumu Kapat
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar relative">
          <button onClick={onClose} className="hidden lg:block absolute top-6 right-8 p-2 text-gray-600 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Profil & Kimlik</h3>
                  <p className="text-gray-500 text-sm">Hesap detaylarınızı ve platform kimliğinizi yönetin.</p>
                </div>

                <div className="grid gap-3.5">
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Mail className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">E-posta & Statü</div>
                        <div className="text-white font-bold text-sm">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${roleBadgeColor}`}>
                        {roleLabel}
                      </span>
                      {isEduEmail && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                          <Check className="w-3 h-3" /> Akademik E-posta
                        </span>
                      )}
                    </div>
                  </div>

                  {isAcademicOrAdmin && (
                    <div className="bg-gradient-to-r from-emerald-500/10 via-white/[0.02] to-transparent border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 shrink-0">
                          <Key className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Öğrenci / Masaüstü Tokeni</span>
                            <span className="text-[10px] text-gray-500">(Word Eklentisi İçin)</span>
                          </div>
                          <div className="text-white font-mono text-xs truncate max-w-[280px] sm:max-w-[320px]">
                            {user.uid}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleCopyUid}
                        className="px-3.5 py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
                      >
                        {copiedUid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedUid ? 'Kopyalandı' : 'Tokeni Kopyala'}
                      </button>
                    </div>
                  )}

                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Zap className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Mevcut Plan</div>
                        <div className="text-white font-bold uppercase tracking-tight text-sm">{user.plan} Planı</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      Günlük Limit: <strong className="text-white">{(planLimit.dailyChars / 1000).toLocaleString('tr-TR')}k</strong> karakter
                    </span>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Bell className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Masaüstü Bildirimleri</div>
                        <div className="text-white text-xs font-semibold">
                          {notifPermission === 'granted' ? 'Etkin (Arka planda analiz bitince uyarır)' : notifPermission === 'denied' ? 'Engellendi' : 'İzin Verilmedi'}
                        </div>
                      </div>
                    </div>
                    {notifPermission !== 'granted' && (
                      <button
                        onClick={handleToggleNotification}
                        className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-bold transition-colors"
                      >
                        İzin Ver
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-3.5">
                  <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Sentience AI, akademik dürüstlük ve KVKK protokollerini titizlikle uygular. Analiz edilen metinler asla üçüncü taraf modellere eğitim verisi olarak aktarılmaz.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'academic' && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Akademik & Kurumsal Entegrasyon</h3>
                  <p className="text-gray-500 text-sm">Üniversite lisansınızı bağlayın, sınıf kodlarınızı ve adli mühür politikalarını yönetin.</p>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bağlı Üniversite / Kurum</div>
                      <div className="text-white font-bold text-sm">
                        {user.institution || 'Henüz bir üniversiteye bağlı değilsiniz'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <label className="block text-xs font-bold text-gray-400 mb-2">
                      Kurumsal Lisans Anahtarı Aktifleştirme
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={institutionCodeInput}
                        onChange={(e) => setInstitutionCodeInput(e.target.value.toUpperCase())}
                        placeholder="Örn: INST-EDU-2026 veya okul lisans kodu"
                        className="flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono outline-none focus:border-emerald-500/50"
                      />
                      <button
                        onClick={handleActivateInstitution}
                        disabled={isActivatingCode}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {isActivatingCode ? 'Doğrulanıyor...' : 'Kodu Etkinleştir'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Üniversiteniz tarafından sağlanan lisans anahtarı, hesabınıza ek intihal tarama kotası ve kurumsal sınıf erişimi tanımlar.
                    </p>
                  </div>
                </div>

                {/* Adli Mühür Görünürlük Politikası (Kullanıcı Sorusuna Özel) */}
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5" />
                    Word Adli Mührü Kime Görünür ve Neyi Kanıtlar?
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" /> Öğrenci Tarafı
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        Öğrenci, belgenin kendi UID'si ve SHA-256 damgasıyla bağlandığını görür. Haksız yapay zeka ithamlarına karşı kendi organik yazım kanıtı olarak saklar.
                      </p>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-xl p-3.5 space-y-1">
                      <div className="font-bold text-blue-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> Öğretmen & Jüri Tarafı
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        Öğretmen, ödev teslim raporunda belgenin Word eklentisiyle mühürlendiğini, organik sürede yazıldığını ve dışarıdan toplu yapıştırılmadığını yeşil adli kalkanla teyit eder.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'word' && (
              <motion.div
                key="word"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Microsoft Word Adli Bilişim Eklentisi</h3>
                  <p className="text-gray-500 text-sm">Masaüstü Word eklentisi entegrasyonu, token eşleşmesi ve adli mühürleme adımları.</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-500/10 via-white/[0.02] to-transparent border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm">Sentience AI Word Masaüstü Eklentisi</div>
                        <div className="text-xs text-gray-400">Sürüm v2.5.2 • Güvenilen Katalog Standartı</div>
                      </div>
                    </div>
                    <a
                      href="/downloads/SentienceWordSetup.zip"
                      download
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors self-start sm:self-auto shrink-0"
                    >
                      <Download className="w-4 h-4" /> Setup İndir (.zip)
                    </a>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Word Eklentisine Girilecek Öğrenci Kimliği / Token
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={user.uid}
                        className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono text-xs select-all outline-none"
                      />
                      <button
                        onClick={handleCopyUid}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedUid ? 'Kopyalandı' : 'Kopyala'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">3 Adımda Masaüstü Kullanım</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-emerald-400 font-bold">1. Kurulumu Çalıştırın</span>
                      <p className="text-gray-400 text-[11px]">İndirilen zip içindeki setup'ı açıp tek tıkla kurun.</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-emerald-400 font-bold">2. Word'de Eklentiyi Açın</span>
                      <p className="text-gray-400 text-[11px]">Ekle &gt; Eklentilerim &gt; Paylaşılan Klasör altından Sentience AI'ı seçin.</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-1">
                      <span className="text-emerald-400 font-bold">3. Belgeyi Mühürleyin</span>
                      <p className="text-gray-400 text-[11px]">Tokeninizi girip mühürleyin ve Ctrl+S ile kaydedin.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'theme' && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Arayüz Renkleri & Tema</h3>
                  <p className="text-gray-500 text-sm">21st.dev topluluk temalarından ilham alan, açıktan koyuya sıralanmış renk paletlerinden dilediğinizi seçin.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {ORDERED_THEMES.map((theme) => {
                    const isSelected = currentThemeId === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'bg-white/[0.07] border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            {theme.toneLabel}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${theme.colors.accent}15`,
                              borderColor: `${theme.colors.accent}40`,
                              color: theme.colors.accent
                            }}
                          >
                            {theme.badge}
                          </span>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-white flex items-center justify-between">
                            <span>{theme.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {theme.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: theme.colors.bg }}
                              title="Arka Plan"
                            />
                            <span
                              className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: theme.colors.card }}
                              title="Kart & Panel"
                            />
                            <span
                              className="w-5 h-5 rounded-full shadow-sm"
                              style={{
                                backgroundColor: theme.colors.accent,
                                boxShadow: `0 0 8px ${theme.colors.accent}`
                              }}
                              title="Aksan & Vurgu"
                            />
                          </div>
                          <span className="text-[10px] font-mono font-medium text-gray-500">
                            {theme.colors.accent}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Kotalar & Üyelik</h3>
                  <p className="text-gray-500 text-sm">Günlük karakter kullanımınızı ve aktif aboneliğinizi görüntüleyin.</p>
                </div>

                {/* Kullanım Kotaları Barı */}
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-400">Günlük Karakter Analiz Kotası</span>
                    <span className="text-white font-mono font-bold">
                      {dailyUsage.toLocaleString('tr-TR')} / {planLimit.dailyChars.toLocaleString('tr-TR')} Karakter (%{usagePct})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        usagePct > 90 ? 'bg-red-500' : usagePct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Her gece 00:00 UTC'de sıfırlanır</span>
                    <span>Kalan: {(planLimit.dailyChars - dailyUsage).toLocaleString('tr-TR')} Karakter</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
                  <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest">
                      AKTİF PLAN: {user.plan.toUpperCase()}
                    </div>
                    
                    {user.plan === 'free' ? (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-xs leading-relaxed max-w-md">
                          Ücretsiz planda günlük {(planLimit.dailyChars / 1000).toLocaleString('tr-TR')}k karakter kotası ve standart analiz özellikleri yer alır. Akademik veya Pro plana geçerek limitlerinizi 10 katına çıkarabilirsiniz.
                        </p>
                        {isAcademicOrAdmin && (
                          <button 
                            onClick={() => setActiveTab('academic')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all"
                          >
                            Üniversite Kodunu Girin <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-white">{user.plan === 'premium' ? '599' : '199'} TL</span>
                          <span className="text-gray-500 text-xs font-bold">/ aylık (veya Kurumsal Kapsam)</span>
                        </div>
                        
                        <div className="pt-2 flex flex-col sm:flex-row gap-3">
                          <button 
                            disabled={isProcessing}
                            onClick={handleCancelSubscription}
                            className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            {isProcessing ? 'İşleniyor...' : 'Aboneliği İptal Et'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'danger' && (
              <motion.div
                key="danger"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-red-500 tracking-tight mb-1">Tehlikeli Bölge</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Hesabınızı kapatmak geri döndürülemez bir işlemdir. Tüm projeleriniz, geçmiş analizleriniz ve lisans haklarınız kalıcı olarak tasfiye edilecektir.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      Onaylamak için "SİL" yazın
                    </label>
                    <input 
                      type="text" 
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      placeholder="SİL"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 transition-all font-black text-center tracking-[0.4em] text-sm"
                    />
                  </div>

                  <button 
                    disabled={isProcessing || confirmDelete !== 'SİL'}
                    onClick={handleDeleteAccount}
                    className="w-full py-3.5 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-400 disabled:opacity-30 disabled:hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(239,68,68,0.2)]"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isProcessing ? 'HESAP SİLİNİYOR...' : 'SENTIENCE HESABIMI KALICI OLARAK SİL'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

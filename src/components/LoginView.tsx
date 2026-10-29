import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint,
  Mail,
  Lock,
  Github,
  Twitter,
  ArrowRight,
  X,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Briefcase,
  Building2,
  ShieldCheck,
  School,
  Search,
  ChevronDown,
  Check,
  Key
} from 'lucide-react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { translateError } from '../services/geminiService';
import { cn } from '../lib/utils';
import { validateInstitutionCode } from '../services/institutionLicenseService';
import toast, { Toaster } from 'react-hot-toast';
import { TURKISH_UNIVERSITIES, type TurkishUniversity } from '../data/turkishUniversities';

interface LoginViewProps {
  isAdmin: boolean;
  onBack: () => void;
}

export function LoginView({ isAdmin, onBack }: LoginViewProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountRole, setAccountRole] = useState<'academic' | 'student' | 'professional'>('academic');
  const [selectedUni, setSelectedUni] = useState<string>('Uşak Üniversitesi');
  const [companyName, setCompanyName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [instructorCode, setInstructorCode] = useState('');
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const currentUni = TURKISH_UNIVERSITIES.find(u => u.name === selectedUni);
  const selectedUniDomain = currentUni?.domain || '';
  const isEduEmail = /@(?:[a-zA-Z0-9-]+\.)*edu(?:\.[a-zA-Z]{2,})?$/i.test(email.trim());
  const detectedDomain = isEduEmail ? email.trim().split('@')[1] : null;

  const filteredUniversities = useMemo(() => {
    const q = uniSearchQuery.trim().toLowerCase();
    if (!q) return TURKISH_UNIVERSITIES;
    return TURKISH_UNIVERSITIES.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.domain.toLowerCase().includes(q) ||
      (u.city && u.city.toLowerCase().includes(q))
    );
  }, [uniSearchQuery]);

  const handleSocialLogin = async (providerName: 'google' | 'github' | 'twitter') => {
    if (isSubmitting) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();
    else provider = new TwitterAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      toast.success("Giriş yapıldı");
    } catch (error: any) {
      console.error("Sosyal Giriş Hatası:", error);
      const translated = translateError(error, isAdmin);
      setErrorMessage(translated);
      toast.error(translated);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    let cleanEmail = email.trim();
    if (!isLoginView && accountRole !== 'professional' && !cleanEmail.includes('@') && selectedUniDomain) {
      cleanEmail = `${cleanEmail}@${selectedUniDomain}`;
      setEmail(cleanEmail);
    }
    if (!cleanEmail || !password) {
      const msg = "Lütfen e-posta ve şifrenizi girin.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (!isLoginView && accountRole === 'academic' && selectedUniDomain && !cleanEmail.endsWith(`@${selectedUniDomain}`)) {
      if (!/@(?:[a-zA-Z0-9-]+\.)*edu(?:\.[a-zA-Z]{2,})?$/i.test(cleanEmail)) {
        const msg = `Akademisyen kaydı için lütfen üniversitenize ait resmi kurumsal e-posta adresinizi (@${selectedUniDomain}) kullanınız.`;
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    }
    if (!isLoginView && accountRole === 'academic') {
      const trimmedCode = instructorCode.trim().toUpperCase();
      const codeCheck = await validateInstitutionCode(trimmedCode);
      if (!codeCheck.valid) {
        const msg = codeCheck.error || "Akademisyen hesabı açmak için geçerli bir Kurumsal Lisans Anahtarı (Örn: INST-EDU-2026) girmelisiniz.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    }
    if (password.length < 6) {
      const msg = "Şifreniz en az 6 karakter olmalıdır.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        toast.success("Giriş başarılı, sisteme bağlanılıyor...");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email: cleanEmail,
          role: accountRole === 'academic' ? 'instructor' : (accountRole === 'student' ? 'student' : 'user'),
          academicProfile: accountRole,
          institution: accountRole === 'professional' ? (companyName.trim() || 'Bireysel / İş Dünyası') : (selectedUni || detectedDomain || 'Bağımsız'),
          institutionDomain: accountRole === 'professional' ? (cleanEmail.includes('@') ? cleanEmail.split('@')[1] : null) : (selectedUniDomain || detectedDomain || null),
          companyName: accountRole === 'professional' && companyName.trim() ? companyName.trim() : null,
          enrolledClassCode: accountRole === 'student' && classCode.trim() ? classCode.trim() : null,
          plan: 'free',
          dailyUsage: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          onboarding: {
            profileComplete: true,
            firstHumanize: false,
            firstAnalysis: false,
            firstDraft: false,
            dismissed: false
          }
        }, { merge: true }).catch(() => {});
        toast.success("Kaydınız başarıyla tamamlandı!");
      }
    } catch (error: any) {
      console.error("Kimlik Doğrulama Hatası:", error);
      const translated = translateError(error, isAdmin);
      setErrorMessage(translated);
      toast.error(translated);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      const msg = "Lütfen şifre sıfırlama bağlantısı gönderilecek e-posta adresini girin.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setResetSent(true);
      toast.success("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (error: any) {
      console.error("Şifre Sıfırlama Hatası:", error);
      const translated = translateError(error, isAdmin);
      setErrorMessage(translated);
      toast.error(translated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 bg-mesh relative overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse-soft" />
        <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full animate-pulse-soft" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 font-black tracking-tighter text-3xl text-emerald-500 mb-4 cursor-pointer" onClick={onBack}>
            <Fingerprint className="w-10 h-10 shadow-[0_0_20px_rgba(16,185,129,0.4)]" /> <span lang="en">SENTIENCE</span>
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">YZ İnsanlaştırma ve İntihal Denetimi</p>
        </div>

        <div className="glass-panel p-8 rounded-[32px] border border-white/10 shadow-3xl bg-black/40 backdrop-blur-2xl">
          {isResettingPassword ? (
            <div>
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Şifremi Unuttum</h3>
                <p className="text-xs text-gray-400">
                  Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <div className="text-xs leading-relaxed font-semibold">
                    {errorMessage}
                  </div>
                </div>
              )}

              {resetSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                  <p className="text-xs text-emerald-400 font-bold">
                    Şifre sıfırlama bağlantısı gönderildi! Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setResetSent(false);
                    }}
                    className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Giriş Ekranına Dön
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-POSTA ADRESİ</label>
                    <div className="relative group">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700 disabled:opacity-50"
                        placeholder="ornek@mail.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsResettingPassword(false);
                      setErrorMessage(null);
                    }}
                    className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors text-center"
                  >
                    Giriş Yapmaya Dön
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="flex gap-4 p-1 bg-white/5 rounded-2xl mb-8">
                <button type="button" onClick={() => { setIsLoginView(true); setErrorMessage(null); }} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", isLoginView ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>GİRİŞ YAP</button>
                <button type="button" onClick={() => { setIsLoginView(false); setErrorMessage(null); }} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", !isLoginView ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>KAYIT OL</button>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <div className="text-xs leading-relaxed font-semibold">
                    {errorMessage}
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-5">
                {!isLoginView && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">KULLANICI TİPİ</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountRole('academic')}
                        className={cn(
                          "p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5",
                          accountRole === 'academic'
                            ? "bg-emerald-500/10 border-emerald-500 text-white font-bold"
                            : "bg-white/[0.02] border-white/5 text-gray-400 hover:text-white"
                        )}
                      >
                        <GraduationCap className={cn("w-4 h-4 shrink-0", accountRole === 'academic' ? "text-emerald-400" : "text-gray-500")} />
                        <div>
                          <div className="text-xs">Akademisyen</div>
                          <div className="text-[9px] text-gray-500">Öğretim & Sınıf</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountRole('student')}
                        className={cn(
                          "p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5",
                          accountRole === 'student'
                            ? "bg-blue-500/10 border-blue-500 text-white font-bold"
                            : "bg-white/[0.02] border-white/5 text-gray-400 hover:text-white"
                        )}
                      >
                        <BookOpen className={cn("w-4 h-4 shrink-0", accountRole === 'student' ? "text-blue-400" : "text-gray-500")} />
                        <div>
                          <div className="text-xs">Öğrenci</div>
                          <div className="text-[9px] text-gray-500">Ödev & Tez</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountRole('professional')}
                        className={cn(
                          "p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5",
                          accountRole === 'professional'
                            ? "bg-purple-500/10 border-purple-500 text-white font-bold"
                            : "bg-white/[0.02] border-white/5 text-gray-400 hover:text-white"
                        )}
                      >
                        <Briefcase className={cn("w-4 h-4 shrink-0", accountRole === 'professional' ? "text-purple-400" : "text-gray-500")} />
                        <div>
                          <div className="text-xs">Profesyonel</div>
                          <div className="text-[9px] text-gray-500">İş & Yayınevi</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {!isLoginView && accountRole !== 'professional' && (
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ÜNİVERSİTE / KURUM SEÇİMİ</label>
                      {selectedUniDomain && (
                        <span className="text-[9px] text-emerald-400 font-mono">@{selectedUniDomain}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUniDropdownOpen(prev => !prev)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-left text-white outline-none focus:border-emerald-500/50 transition-all flex items-center justify-between"
                    >
                      <School className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <span className="truncate pr-2 font-medium">{selectedUni || 'Üniversite Seçin'}</span>
                      <ChevronDown className={cn("w-4 h-4 text-gray-500 shrink-0 transition-transform", isUniDropdownOpen && "rotate-180")} />
                    </button>

                    {isUniDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsUniDropdownOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-neutral-900/95 border border-white/10 rounded-2xl shadow-2xl p-2 backdrop-blur-xl flex flex-col max-h-80 overflow-hidden">
                          <div className="p-1.5 border-b border-white/10 sticky top-0 bg-neutral-900/90 z-10 flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                            <input
                              type="text"
                              autoFocus
                              value={uniSearchQuery}
                              onChange={e => setUniSearchQuery(e.target.value)}
                              placeholder="Üniversite veya şehir ara (örn: Uşak, Boğaziçi)..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-gray-500 outline-none focus:border-emerald-500/50"
                            />
                            {uniSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setUniSearchQuery('')}
                                className="text-gray-400 hover:text-white text-xs px-2"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          <div className="overflow-y-auto max-h-60 mt-1 space-y-0.5 pr-1 divide-y divide-white/5">
                            {filteredUniversities.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-500">
                                Eşleşen üniversite bulunamadı.
                              </div>
                            ) : (
                              filteredUniversities.map(u => (
                                <button
                                  type="button"
                                  key={u.name}
                                  onClick={() => {
                                    setSelectedUni(u.name);
                                    if (u.domain && email.includes('@')) {
                                      const prefix = email.split('@')[0];
                                      setEmail(`${prefix}@${u.domain}`);
                                    }
                                    setIsUniDropdownOpen(false);
                                    setUniSearchQuery('');
                                  }}
                                  className={cn(
                                    "w-full p-2.5 text-left rounded-xl flex items-center justify-between transition-colors",
                                    selectedUni === u.name ? "bg-emerald-500/10 text-emerald-300" : "hover:bg-white/5 text-gray-300"
                                  )}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="text-xs font-semibold truncate text-white">{u.name}</div>
                                    <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                                      <span>{u.type === 'state' ? 'Devlet' : u.type === 'foundation' ? 'Vakıf' : 'Kurum'}</span>
                                      {u.city && <span>• {u.city}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {u.domain && <span className="text-[10px] font-mono text-emerald-400">@{u.domain}</span>}
                                    {selectedUni === u.name && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {!isLoginView && accountRole === 'academic' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">EĞİTMEN LİSANS / YETKİ ANAHTARI</label>
                      <span className="text-[9px] text-amber-400 font-mono">Zorunlu</span>
                    </div>
                    <div className="relative group">
                      <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                      <input
                        type="text"
                        value={instructorCode}
                        onChange={e => setInstructorCode(e.target.value.toUpperCase())}
                        placeholder="Örn: INST-EDU-2026 (Bölüm Yetki Anahtarı)"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700 font-mono uppercase"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 ml-1">
                      Sınıf açma yetkisi için kurumunuzca tanımlanmış anahtarı giriniz (Demo: INST-EDU-2026).
                    </p>
                  </div>
                )}

                {!isLoginView && accountRole === 'professional' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">KURUM / ŞİRKET / YAYINEVİ (OPSİYONEL)</label>
                      <span className="text-[9px] text-purple-400">İş & Yayıncılık</span>
                    </div>
                    <div className="relative group">
                      <Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Örn: Hukuk Bürosu, Yayınevi, Medya veya Şirket Adı"
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-700"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-POSTA ADRESİ</label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700 disabled:opacity-50"
                      placeholder={!isLoginView && accountRole !== 'professional' && selectedUniDomain ? `ornek@${selectedUniDomain}` : (!isLoginView && accountRole === 'professional' ? "ornek@sirketiniz.com veya e-posta" : "ornek@mail.com")}
                      required
                    />
                  </div>
                  {!isLoginView && accountRole !== 'professional' && selectedUniDomain && !email.includes('@') && email.trim().length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEmail(`${email.trim()}@${selectedUniDomain}`)}
                      className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 mt-1 ml-1"
                    >
                      <span>Otomatik tamamla:</span>
                      <span className="font-mono underline">{email.trim()}@{selectedUniDomain}</span>
                    </button>
                  )}
                  {isEduEmail && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold mt-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Kurumsal Üniversite E-postası Doğrulandı ({detectedDomain})</span>
                    </div>
                  )}
                </div>

                {!isLoginView && accountRole === 'student' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">SINIF / DERS KODU (OPSİYONEL)</label>
                      <span className="text-[9px] text-gray-600 font-mono">Hocanızdan aldığınız kod</span>
                    </div>
                    <input
                      type="text"
                      value={classCode}
                      onChange={e => setClassCode(e.target.value.toUpperCase())}
                      placeholder="Örn: BIL401-ABC"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-xs font-mono uppercase tracking-wider text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-700"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ŞİFRE (EN AZ 6 KARAKTER)</label>
                    {isLoginView && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsResettingPassword(true);
                          setErrorMessage(null);
                        }}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Şifremi Unuttum?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700 disabled:opacity-50" placeholder="••••••••" required />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <span>İşlem Yapılıyor...</span>
                  ) : (
                    <>
                      {isLoginView ? 'Sisteme Bağlan' : 'Kaydını Tamamla'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[#0c0c0c] px-4 text-gray-600">Veya İle Devam Et</span></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button type="button" disabled={isSubmitting} onClick={() => handleSocialLogin('google')} className="flex items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="Google" /></button>
                <button type="button" disabled={isSubmitting} onClick={() => handleSocialLogin('github')} className="flex items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"><Github className="w-5 h-5 text-gray-500 group-hover:text-white transition-all" /></button>
                <button type="button" disabled={isSubmitting} onClick={() => handleSocialLogin('twitter')} className="flex items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group disabled:opacity-50"><Twitter className="w-5 h-5 text-gray-500 group-hover:text-[#1DA1F2] transition-all" /></button>
              </div>
            </>
          )}

          <button onClick={onBack} className="w-full mt-8 text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center justify-center gap-2">
            <X className="w-3 h-3" /> Ana Sayfaya Dön
          </button>
        </div>
      </motion.div>
    </div>
  );
}

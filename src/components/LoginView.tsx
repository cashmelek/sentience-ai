import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint,
  Mail,
  Lock,
  Github,
  Twitter,
  ArrowRight,
  X
} from 'lucide-react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { translateError } from '../services/geminiService';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

/**
 * B20 Adım 5 (Core Refactor): giriş/kayıt ekranı App.tsx'ten ayrıştırıldı.
 * E-posta/şifre ve sekme durumu bu bileşene taşındı; davranış birebir korunmuştur.
 * Kural 2: "ajan" dili özellik diliyle değiştirildi.
 */
interface LoginViewProps {
  isAdmin: boolean;
  onBack: () => void;
}

export function LoginView({ isAdmin, onBack }: LoginViewProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSocialLogin = async (providerName: 'google' | 'github' | 'twitter') => {
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();
    else provider = new TwitterAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Giriş yapıldı");
    } catch (error: any) {
      toast.error(translateError(error, isAdmin));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Giriş yapıldı");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Kayıt başarılı");
      }
    } catch (error: any) {
      toast.error(translateError(error, isAdmin));
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 bg-mesh relative overflow-hidden">
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
          <div className="flex gap-4 p-1 bg-white/5 rounded-2xl mb-8">
            <button onClick={() => setIsLoginView(true)} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", isLoginView ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>GİRİŞ YAP</button>
            <button onClick={() => setIsLoginView(false)} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", !isLoginView ? "bg-emerald-500 text-black shadow-lg" : "text-gray-500 hover:text-gray-300")}>KAYIT OL</button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-POSTA ADRESİ</label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700" placeholder="ornek@mail.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">ŞİFRE</label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-700" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 mt-4">
              {isLoginView ? 'Sisteme Bağlan' : 'Kaydını Tamamla'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-[#0c0c0c] px-4 text-gray-600">Veya İle Devam Et</span></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all" alt="Google" /></button>
            <button onClick={() => handleSocialLogin('github')} className="flex items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"><Github className="w-5 h-5 text-gray-500 group-hover:text-white transition-all" /></button>
            <button onClick={() => handleSocialLogin('twitter')} className="flex items-center justify-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"><Twitter className="w-5 h-5 text-gray-500 group-hover:text-[#1DA1F2] transition-all" /></button>
          </div>

          <button onClick={onBack} className="w-full mt-8 text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center justify-center gap-2">
            <X className="w-3 h-3" /> Ana Sayfaya Dön
          </button>
        </div>
      </motion.div>
    </div>
  );
}

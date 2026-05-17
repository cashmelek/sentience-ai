import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { AppUser } from '../types';

interface AccountSettingsModalProps {
  user: AppUser;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'danger'>('profile');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  const handleCancelSubscription = async () => {
    if (user.plan === 'free') return;
    
    if (!confirm('Ücretli üyeliğinizi iptal etmek istediğinize emin misiniz? Mevcut dönem sonuna kadar özelliklere erişmeye devam edeceksiniz.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cancelAtPeriodEnd: true,
        // Gerçek bir ödeme sisteminde (Stripe vb.) burada subscription.update çağrısı yapılır
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

      // 1. Veritabanındaki kullanıcı verilerini sil (veya anonimleştir)
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Auth kullanıcısını sil
      await deleteUser(currentUser);
      
      toast.success('Hesabınız ve tüm verileriniz başarıyla silindi.');
      window.location.reload(); // Uygulamayı sıfırla
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
    { id: 'subscription', label: 'Abonelik', icon: CreditCard },
    { id: 'danger', label: 'Hesabı Kapat', icon: ShieldAlert },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[500px]"
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
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Profil Bilgileri</h3>
                  <p className="text-gray-500 text-sm">Hesap detaylarınızı ve kullanım özetinizi görüntüleyin.</p>
                </div>

                <div className="grid gap-4">
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Mail className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">E-posta Adresi</div>
                      <div className="text-white font-bold">{user.email}</div>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-0.5">Mevcut Plan</div>
                      <div className="text-white font-bold uppercase tracking-tighter">{user.plan} Planı</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-500/5 rounded-[24px] border border-emerald-500/10">
                  <div className="flex items-start gap-4">
                    <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-emerald-500">Güvenlik Notu</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Sentience AI, verilerinizin gizliliğine önem verir. Analiz ettiğiniz metinler asla üçüncü taraflarla paylaşılmaz ve istediğiniz an geçmişinizi silebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'subscription' && (
              <motion.div
                key="subscription"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-2">Üyelik Yönetimi</h3>
                  <p className="text-gray-500 text-sm">Aboneliğinizi güncelleyin veya iptal edin.</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-32 h-32 text-emerald-500" />
                  </div>
                  
                  <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                      AKTİF PLAN: {user.plan.toUpperCase()}
                    </div>
                    
                    {user.plan === 'free' ? (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                          Şu anda ücretsiz planı kullanıyorsunuz. Günlük 5.000 kelime limiti ve standart analiz özelliklerine sahipsiniz. Premium'a geçerek limitlerinizi artırabilirsiniz.
                        </p>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">
                          Planları Görüntüle <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white">{user.plan === 'premium' ? '599' : '199'} TL</span>
                          <span className="text-gray-500 text-xs font-bold">/ aylık</span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                            Sınırsız Sentinel Doğrulama
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 
                            Yüksek Öncelikli İşlem Sırası
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                          <button 
                            disabled={isProcessing}
                            onClick={handleCancelSubscription}
                            className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            {isProcessing ? 'İşleniyor...' : 'Aboneliği İptal Et'}
                          </button>
                          <p className="text-[10px] text-gray-500 italic max-w-[200px]">
                            * İptal ettiğinizde mevcut haklarınız dönem sonuna kadar devam eder.
                          </p>
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
                className="space-y-8"
              >
                <div className="p-6 bg-red-500/5 rounded-3xl border border-red-500/10 flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-red-500 tracking-tight mb-2">Tehlikeli Bölge</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Hesabınızı kapatmak geri döndürülemez bir işlemdir. Tüm projeleriniz, geçmiş analizleriniz ve abonelik haklarınız kalıcı olarak silinecektir.
                    </p>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      Onaylamak için "SİL" yazın
                    </label>
                    <input 
                      type="text" 
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      placeholder="SİL"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-red-500/50 transition-all font-black text-center tracking-[0.5em]"
                    />
                  </div>

                  <button 
                    disabled={isProcessing || confirmDelete !== 'SİL'}
                    onClick={handleDeleteAccount}
                    className="w-full py-5 bg-red-500 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] hover:bg-red-400 disabled:opacity-30 disabled:hover:bg-red-500 transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(239,68,68,0.2)]"
                  >
                    <Trash2 className="w-5 h-5" />
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

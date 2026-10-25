import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  FileText,
  Lock,
  ExternalLink,
  ChevronRight,
  Globe,
  Github,
  Twitter,
  Linkedin,
  X,
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { landingCmsService, DEFAULT_LANDING_CONFIG, LandingCmsConfig } from '../services/landingCmsService';

interface FooterProps {
  onNavigateGuide?: () => void;
  onNavigateBlog?: () => void;
  onNavigatePricing?: () => void;
}

export function Footer({ onNavigateGuide, onNavigateBlog, onNavigatePricing }: FooterProps) {
  const [footerConfig, setFooterConfig] = useState<LandingCmsConfig['footer']>(DEFAULT_LANDING_CONFIG.footer);
  const [activeLegalModal, setActiveLegalModal] = useState<'kvkk' | 'terms' | 'cookies' | 'privacy' | null>(null);

  useEffect(() => {
    let isMounted = true;
    landingCmsService.fetchConfig().then((cfg) => {
      if (isMounted && cfg?.footer) {
        setFooterConfig(cfg.footer);
      }
    });

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LandingCmsConfig>;
      if (isMounted && customEvent.detail?.footer) {
        setFooterConfig(customEvent.detail.footer);
      }
    };

    window.addEventListener('sentience_cms_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('sentience_cms_updated', handleUpdate);
    };
  }, []);

  const handleGoGuide = () => {
    if (onNavigateGuide) onNavigateGuide();
    if (window.location.pathname !== '/guide') {
      window.history.pushState({}, '', '/guide');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoBlog = () => {
    if (onNavigateBlog) onNavigateBlog();
    if (window.location.pathname !== '/blog') {
      window.history.pushState({}, '', '/blog');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoPricing = () => {
    if (onNavigatePricing) {
      onNavigatePricing();
    } else {
      const el = document.getElementById('pricing');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.history.pushState({}, '', '/#pricing');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const handleNavigateModule = (guideSectionId: string, anchorId: string) => {
    const isHome = window.location.pathname === '/' || window.location.pathname === '';
    const el = document.getElementById(anchorId);
    if (isHome && el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.history.pushState({}, '', `/guide#${guideSectionId}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const {
    showTrustBadges = true,
    showSocialLinks = true,
    showModulesCol = true,
    showGuidesCol = true,
    showContactCol = true,
    showAddress = true,
    showEmail = true,
    showPhone = true,
    showWorkingHours = true,
    showPrivacy = true,
    showKvkk = true,
    showTerms = true,
    showCookies = true,
    showBottomBar = true
  } = footerConfig || {};

  return (
    <>
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-300 font-sans">
        {/* Main Footer Container */}
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            {/* Col 1: Brand & Bio (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <span className="text-xl font-black tracking-tight text-white uppercase">
                  SENTIENCE <span className="text-emerald-400 font-mono text-xs">AI</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                {footerConfig.description}
              </p>

              {/* Trust Badges */}
              {showTrustBadges && (
                <div className="pt-2 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    YÖK / TÜBİTAK Uyumlu
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    Sıfır-Veri & KVKK
                  </div>
                </div>
              )}

              {/* Social Links */}
              {showSocialLinks && (
                <div className="pt-2 flex items-center gap-3">
                  <a
                    href={footerConfig.twitterUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-400 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href={footerConfig.githubUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-400 transition-colors"
                    aria-label="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                  <a
                    href={footerConfig.linkedinUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-400 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Col 2: Çözümler & Modüller (3 cols) */}
            {showModulesCol && (
              <div className="lg:col-span-3 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Çözümler & Modüller
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li>
                    <button
                      onClick={() => handleNavigateModule('denetci-modulu', 'demo')}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      Denetçi (YZ Risk Tespiti & Entropi)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigateModule('insanlastirma-modulu', 'demo')}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      İnsanlaştırma (Doğal Sentaks Motoru)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigateModule('sentinel-modulu', 'features')}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      Sentinel (Canlı İntihal & DOI Doğrulama)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigateModule('stylemaster-modulu', 'features')}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      StyleMaster (Özel Akademik Ton Hafızası)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigateModule('sinif-ve-egitmen', 'guide')}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      Sınıflarım & Enstitü Onay Havuzu
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {/* Col 3: Hızlı Bağlantılar & Rehberler (2 cols) */}
            {showGuidesCol && (
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Rehber & İçerik
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li>
                    <button
                      onClick={handleGoGuide}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      Kullanım Kılavuzu
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleGoBlog}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      Akademik Blog
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleGoPricing}
                      className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      Fiyatlandırma
                    </button>
                  </li>
                  {showPrivacy && (
                    <li>
                      <button
                        onClick={() => setActiveLegalModal('privacy')}
                        className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        Gizlilik Politikası
                      </button>
                    </li>
                  )}
                  {showTerms && (
                    <li>
                      <button
                        onClick={() => setActiveLegalModal('terms')}
                        className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        Kullanıcı Sözleşmesi
                      </button>
                    </li>
                  )}
                  {showKvkk && (
                    <li>
                      <button
                        onClick={() => setActiveLegalModal('kvkk')}
                        className="hover:text-emerald-400 transition-colors text-left flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        KVKK Aydınlatma
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Col 4: İletişim & Kurumsal (3 cols) */}
            {showContactCol && (
              <div className="lg:col-span-3 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Kurumsal İletişim
                </h4>
                <ul className="space-y-3 text-xs text-slate-400">
                  {showAddress && (
                    <li className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{footerConfig.address}</span>
                    </li>
                  )}
                  {showEmail && (
                    <li className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                      <a
                        href={`mailto:${footerConfig.email}`}
                        className="hover:text-white transition-colors font-mono"
                      >
                        {footerConfig.email}
                      </a>
                    </li>
                  )}
                  {showPhone && (
                    <li className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <a
                        href={`tel:${footerConfig.phone}`}
                        className="hover:text-white transition-colors font-mono"
                      >
                        {footerConfig.phone}
                      </a>
                    </li>
                  )}
                  {showWorkingHours && (
                    <li className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{footerConfig.workingHours}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          {showBottomBar && (
            <div className="mt-14 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>{footerConfig.copyright}</p>
              <div className="flex items-center gap-6">
                {showPrivacy && (
                  <button
                    onClick={() => setActiveLegalModal('privacy')}
                    className="hover:text-slate-300 transition-colors"
                  >
                    Gizlilik Politikası
                  </button>
                )}
                {showKvkk && (
                  <button
                    onClick={() => setActiveLegalModal('kvkk')}
                    className="hover:text-slate-300 transition-colors"
                  >
                    KVKK &amp; Gizlilik
                  </button>
                )}
                {showTerms && (
                  <button
                    onClick={() => setActiveLegalModal('terms')}
                    className="hover:text-slate-300 transition-colors"
                  >
                    Kullanım Şartları
                  </button>
                )}
                {showCookies && (
                  <button
                    onClick={() => setActiveLegalModal('cookies')}
                    className="hover:text-slate-300 transition-colors"
                  >
                    Çerez Politikası
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Legal Modals */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {activeLegalModal === 'privacy' && 'Gizlilik Politikası'}
                  {activeLegalModal === 'kvkk' && 'KVKK Aydınlatma Metni'}
                  {activeLegalModal === 'terms' && 'Kullanıcı Sözleşmesi ve Hizmet Şartları'}
                  {activeLegalModal === 'cookies' && 'Çerez (Cookie) Politikası'}
                </h3>
              </div>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeLegalModal === 'privacy' && (
                <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">Resmi Politika Metni</span>
                    <span className="text-[10px] text-slate-500 font-mono">Son güncelleme: 29 Ocak 2026</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">1. Giriş</h4>
                    <p>
                      <strong className="text-white">Sentience AI (Sentience AI A.Ş.)</strong> olarak kullanıcılarımızın kişisel ve akademik verilerinin gizliliğini en üst düzeyde korumayı taahhüt ediyoruz. Bu Gizlilik Politikası; platformumuzu (sentience.ai) ziyaret ettiğinizde veya sunduğumuz yapay zeka tespiti, metin insanlaştırma ve intihal denetim araçlarını kullandığınızda verilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklamaktadır.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">2. Toplanan Veriler</h4>
                    <p className="mb-1.5">Hizmetlerimizi kesintisiz sunabilmek için aşağıdaki veri kategorileri toplanmaktadır:</p>
                    <ul className="space-y-1.5 text-slate-400 pl-1">
                      <li>
                        <strong className="text-slate-200">Hesap Bilgileri:</strong> Ad ve soyad, e-posta adresi (bireysel veya .edu.tr kurumsal e-posta), telefon numarası (isteğe bağlı), güvenli tek yönlü hash ile şifrelenmiş parola kayıtları.
                      </li>
                      <li>
                        <strong className="text-slate-200">Doküman &amp; Metin Verileri:</strong> Analiz edilmek üzere editöre girilen veya dosya (.docx, .pdf, .txt) olarak yüklenen ham metinler (analiz süresince geçici olarak işlenir), üretilen intihal oranları, YZ risk skorları ve doğrulama raporları.
                      </li>
                      <li>
                        <strong className="text-slate-200">Teknik &amp; Güvenlik Verileri:</strong> IP adresi, tarayıcı türü ve sürümü, cihaz/işletim sistemi bilgileri, oturum kayıtları ve SHA-256 dijital orijinallik makbuzları.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">3. Verilerin Kullanımı</h4>
                    <p className="mb-1.5">Toplanan veriler aşağıdaki amaçlarla kullanılır:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Denetçi (YZ risk tespiti ve entropi analizi) hizmetini sunmak</li>
                      <li>İnsanlaştırma (doğal sentaks ve akademik ritim dönüşümü) hizmetini yürütmek</li>
                      <li>Sentinel (akademik çapraz veritabanı taraması ve canlı DOI doğrulaması) hizmetini sağlamak</li>
                      <li>StyleMaster (özel ton ve akademik üslup hafızası) profilini oluşturmak</li>
                      <li>Hesap yönetimi, kota takibi ve kullanıcı kimlik doğrulamasını gerçekleştirmek</li>
                      <li>Kullanıcı desteği sağlamak ve hizmet performansını iyileştirmek</li>
                      <li>Yasal ve idari mevzuat yükümlülüklerini yerine getirmek</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">4. Veri Güvenliği</h4>
                    <p className="mb-1.5">Verilerinizi korumak için endüstri standardı ve akademik seviyede güvenlik önlemleri uyguluyoruz:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Uçtan uca 256-bit SSL/TLS şifreleme ile veri iletimi</li>
                      <li>Şifrelerin ve kimlik verilerinin tuzlanmış (salted) güvenli hash algoritmaları ile saklanması</li>
                      <li>Yönetici Salt Okunur (Admin Read-Only) mimarisi ile ham metin erişim blokajı</li>
                      <li>Düzenli bağımsız siber güvenlik ve sızma denetimleri</li>
                      <li>Role-based (rol tabanlı) erişim kontrolü ve çok faktörlü yetkilendirme</li>
                      <li>Gelişmiş güvenlik duvarları ve izinsiz giriş tespit sistemleri</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">5. Doküman ve Akademik Metin Gizliliği</h4>
                    <p className="mb-1.5">Yüklediğiniz tez, makale ve akademik taslakların gizliliği Sentience AI için en temel taahhüttür:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 mb-2">
                      <li>Dokümanlar yalnızca talep ettiğiniz analiz ve dönüşüm süresince RAM bellekte işlenir.</li>
                      <li>Dokümanlar hiçbir harici yapay zeka modelinin (ChatGPT, Claude, Gemini vb.) eğitim veri tabanına aktarılmaz.</li>
                      <li>Dokümanlar Turnitin veya harici açık karşılaştırma depolarına haberiniz olmadan eklenmez; sonraki taramalarınızda kendi kendine çakışma yaşanmaz.</li>
                      <li>Dokümanlarınız hiçbir üçüncü taraf veya reklam şirketiyle paylaşılmaz.</li>
                      <li>Analiz tamamlandığında geçici metin verileri bellekten güvenli şekilde derhal silinir.</li>
                    </ul>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 font-semibold text-xs">
                      Sıfır-Veri (Zero-Data Retention) İlkemiz: &quot;Metinleriniz sadece sizin kontrolünüzdedir; sistem hiçbir akademik taslağınızı sahiplenmez.&quot;
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">6. Çerezler (Cookies)</h4>
                    <p className="mb-1.5">Platformumuzda kullanıcı deneyimini sağlamak için aşağıdaki çerez türleri kullanılmaktadır:</p>
                    <ul className="space-y-1 text-slate-400 pl-1 mb-2">
                      <li><strong className="text-slate-200">Zorunlu Çerezler:</strong> Güvenli oturum yönetimi ve kimlik doğrulama için elzemdir.</li>
                      <li><strong className="text-slate-200">İşlevsel Çerezler:</strong> Seçilen modül, tema ve dil tercihlerinizi hatırlamak için kullanılır.</li>
                      <li><strong className="text-slate-200">Analitik Çerezler:</strong> Platform performansını ölçümlemek ve hata oranlarını düşürmek için anonim olarak kullanılır.</li>
                    </ul>
                    <p className="text-slate-400 text-xs">
                      Tarayıcı ayarlarınız üzerinden çerez tercihlerinizi yönetebilirsiniz; ancak zorunlu çerezlerin kapatılması platformun bazı özelliklerinin çalışmasını engelleyebilir.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">7. Üçüncü Taraf Paylaşımı</h4>
                    <p className="mb-1.5">Kişisel verileriniz aşağıdaki zorunlu durumlar haricinde hiçbir üçüncü tarafa aktarılmaz:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Yetkili adli merciler veya mahkeme kararıyla zorunlu kılınan yasal yükümlülükler</li>
                      <li>Ödeme ve abonelik işlemlerinin tamamlanması için lisanslı güvenli ödeme kuruluşları</li>
                      <li>Kullanıcının açık ve yazılı onayının bulunduğu özel durumlar</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">8. Veri Saklama Süresi</h4>
                    <p className="mb-1.5">Verileriniz işleme amaçlarının gerektirdiği yasal süreler boyunca muhafaza edilir:</p>
                    <ul className="space-y-1 text-slate-400 pl-1">
                      <li><strong className="text-slate-200">Hesap Bilgileri:</strong> Hesap aktif olduğu sürece ve hesap kapatıldıktan sonra 30 gün</li>
                      <li><strong className="text-slate-200">Analiz Raporları &amp; Karekod Kayıtları:</strong> Doğrulama arşivi kapsamında 1 yıl</li>
                      <li><strong className="text-slate-200">Yüklenen Dokümanlar:</strong> Analiz tamamlandıktan hemen sonra bellekten silinir</li>
                      <li><strong className="text-slate-200">Ödeme &amp; Fatura Kayıtları:</strong> Mali mevzuat gereği 10 yıl</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">9. Kullanıcı Hakları</h4>
                    <p className="mb-1.5">6698 sayılı KVKK ve ilgili veri koruma mevzuatı kapsamında aşağıdaki haklara sahipsiniz:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 mb-2">
                      <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                      <li>İşlenen verileriniz hakkında bilgi talep etme</li>
                      <li>Verilerin eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                      <li>Kanuni şartlar çerçevesinde verilerin silinmesini veya yok edilmesini talep etme</li>
                      <li>Otomatik sistemlerle analiz neticesinde aleyhinize bir sonucun çıkmasına itiraz etme</li>
                      <li>Veri taşınabilirliği ve işleme onayını dilediğiniz an geri çekme hakkı</li>
                    </ul>
                    <p className="text-slate-400 text-xs">
                      Bu haklarınızı kullanmak için <a href="mailto:privacy@sentience.ai" className="text-emerald-400 hover:underline">privacy@sentience.ai</a> veya <a href="mailto:kvkk@sentience.ai" className="text-emerald-400 hover:underline">kvkk@sentience.ai</a> adresine başvurabilirsiniz.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">10. Değişiklikler ve Güncellemeler</h4>
                    <p>
                      Sentience AI, teknolojik ve mevzuatsal gelişmelere bağlı olarak bu Gizlilik Politikasını zaman zaman güncelleyebilir. Önemli değişiklikler kayıtlı e-posta adresiniz üzerinden veya web sitemizde belirgin bir duyuru ile bildirilir.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="font-bold text-white text-sm mb-1">11. İletişim Bilgileri</h4>
                    <p className="text-slate-300"><strong className="text-white">Veri Sorumlusu:</strong> Sentience AI A.Ş. (sentience.ai)</p>
                    <p className="text-slate-400"><strong className="text-slate-300">Merkez &amp; Ar-Ge:</strong> Bilkent Cyberpark, Tepe Binası No:418, Çankaya / Ankara, Türkiye</p>
                    <p className="text-slate-400"><strong className="text-slate-300">Gizlilik E-postası:</strong> <a href="mailto:privacy@sentience.ai" className="text-emerald-400 hover:underline">privacy@sentience.ai</a></p>
                    <p className="text-slate-400"><strong className="text-slate-300">Kurumsal Telefon:</strong> +90 (850) 308 00 00</p>
                  </div>
                </div>
              )}
              {activeLegalModal === 'kvkk' && (
                <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">1. Veri Sorumlusu</h4>
                    <p>
                      6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında, kişisel verileriniz; veri sorumlusu olarak <strong className="text-white">Sentience AI A.Ş. (Sentience AI Platformu - sentience.ai)</strong> tarafından aşağıda açıklanan kapsamda işlenebilecektir.
                    </p>
                    <p className="mt-1 text-slate-400">
                      <strong className="text-slate-300">Merkez &amp; Ar-Ge Adresi:</strong> Bilkent Cyberpark, Tepe Binası No:418, Çankaya / Ankara, Türkiye
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">2. Kişisel Verilerin İşlenme Amacı</h4>
                    <p className="mb-1.5">Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Bireysel ve üniversite kurumsal üyelik işlemlerinin gerçekleştirilmesi</li>
                      <li>Yapay zeka risk tespiti ve entropi analizi hizmetinin (Denetçi Modülü) sunulması</li>
                      <li>Akademik sentaks iyileştirme ve doğal ritim oluşturma hizmetinin (İnsanlaştırma Modülü) sunulması</li>
                      <li>Çapraz akademik veritabanı benzerlik ve canlı DOI doğrulama hizmetinin (Sentinel Modülü) sunulması</li>
                      <li>Kurumsal ve akademik ton profili oluşturma hizmetinin (StyleMaster Modülü) sunulması</li>
                      <li>Eğitmen sınıf yönetimi, ödev teslimi (Sınıflarım) ve lisansüstü tez inceleme süreçlerinin (Enstitü Onay Havuzu) yürütülmesi</li>
                      <li>Abonelik, kelime kotaları, ödeme ve e-fatura işlemlerinin yürütülmesi</li>
                      <li>Müşteri memnuniyeti, teknik destek ve Geliştirici API hizmetlerinin sağlanması</li>
                      <li>YÖK, TÜBİTAK ve akademik etik standartlarına uyumluluk analizleri ile yasal yükümlülüklerin yerine getirilmesi</li>
                      <li>Sıfır-Veri (Zero-Data) ve Yönetici Salt Okunur (Admin Read-Only) bilgi güvenliği süreçlerinin yürütülmesi</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">3. İşlenen Kişisel Veriler</h4>
                    <p className="mb-1.5">İşlenen kişisel veri kategorileri şunlardır:</p>
                    <ul className="space-y-1 text-slate-400">
                      <li><strong className="text-slate-200">Kimlik Bilgileri:</strong> Ad, soyad, akademik unvan</li>
                      <li><strong className="text-slate-200">İletişim Bilgileri:</strong> E-posta adresi (bireysel veya .edu.tr kurumsal e-posta), telefon numarası</li>
                      <li><strong className="text-slate-200">Finansal Bilgiler:</strong> Abonelik planı, ödeme sağlayıcı işlem referansı, fatura bilgileri</li>
                      <li><strong className="text-slate-200">İşlem Güvenliği:</strong> IP adresi, cihaz ve tarayıcı bilgileri, oturum kayıtları, SHA-256 dijital orijinallik makbuzları</li>
                      <li><strong className="text-slate-200">Hizmet Kullanım Verileri:</strong> Yüklenen tez, makale ve ödev metinleri (yalnızca RAM üzerinde geçici analiz edilir; hiçbir yapay zeka modeline eğitim verisi olarak aktarılmaz), benzerlik ve YZ olasılık raporları, karekodlu doğrulama kayıtları</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">4. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi</h4>
                    <p className="mb-1">Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 mb-2">
                      <li>Web platformu kayıt formları ve Google OAuth yetkilendirmesi aracılığıyla</li>
                      <li>Hizmet kullanımı ve analiz motorlarının çalışması sırasında otomatik olarak</li>
                      <li>Eğitmenler tarafından öğrenci adına yükleme süreçlerinde sunulan KVKK onay mekanizmasıyla</li>
                      <li>Destek merkezi ve kurumsal iletişim kanalları ile irtibat sırasında</li>
                    </ul>
                    <p className="mb-1">Hukuki sebepler:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Sözleşmenin kurulması ve ifası (KVKK m.5/2-c)</li>
                      <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi (KVKK m.5/2-ç)</li>
                      <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaatler (KVKK m.5/2-f)</li>
                      <li>Açık rıza gerektiren hallerde açık rızanız (KVKK m.5/1)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">5. Kişisel Verilerin Aktarımı</h4>
                    <p className="mb-1.5">Kişisel verileriniz aşağıdaki taraflarla paylaşılabilir:</p>
                    <ul className="space-y-1 text-slate-400 mb-2">
                      <li><strong className="text-slate-200">Ödeme Kuruluşları:</strong> Güvenli ödeme ve abonelik tahsilat süreçleri için</li>
                      <li><strong className="text-slate-200">Yasal Merciler:</strong> Kanuni zorunluluklar ve yetkili kamu kurumları talepleri kapsamında</li>
                      <li><strong className="text-slate-200">Altyapı Sağlayıcılar:</strong> Güvenli bulut altyapısı ve teknik destek hizmetleri için</li>
                    </ul>
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 font-medium space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Sıfır-Veri &amp; Admin Read-Only Güvencesi
                      </div>
                      <p className="text-xs text-emerald-200/90 leading-relaxed">
                        Yüklediğiniz akademik metinler hiçbir üçüncü taraf genel amaçlı LLM modelinin eğitim havuzuna aktarılmaz; platform yöneticileri dahi projelerinizdeki ham metinleri okuyamaz. Geçici analiz tamamlandığında metinler bellekten derhal imha edilir.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">6. Kişisel Verilerin Saklanma Süresi</h4>
                    <p className="mb-1.5">Kişisel verileriniz işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri dahilinde muhafaza edilir:</p>
                    <ul className="space-y-1 text-slate-400">
                      <li><strong className="text-slate-200">Üyelik bilgileri:</strong> Üyelik sona erdikten sonra 30 gün</li>
                      <li><strong className="text-slate-200">Fatura ve ödeme bilgileri:</strong> 10 yıl (Vergi Usul Kanunu yasal zorunluluğu)</li>
                      <li><strong className="text-slate-200">Analiz raporları ve dijital makbuzlar:</strong> 1 yıl (karekodlu doğrulama arşivi)</li>
                      <li><strong className="text-slate-200">Yüklenen akademik dokümanlar:</strong> Analiz tamamlandığında derhal silinir (Eğitmen tarafından &quot;Sınıf Deposuna Ekle&quot; seçilmediği sürece)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">7. Veri Güvenliği Önlemleri</h4>
                    <p className="mb-1.5">KVKK nın 12. maddesi gereği, kişisel verilerinizin güvenliği için gerekli tüm teknik ve idari tedbirler alınmaktadır:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>256-bit SSL/TLS uçtan uca şifreleme</li>
                      <li>Admin Read-Only mimarisi ile ham metin erişim engeli</li>
                      <li>Sıfır-Veri (Zero-Data Retention) protokolü</li>
                      <li>Güvenli veri merkezleri ve role-based erişim denetimi</li>
                      <li>Düzenli güvenlik ve sızma denetimleri</li>
                      <li>Personel bilgi güvenliği ve gizlilik eğitimleri</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">8. KVKK Kapsamında Haklarınız</h4>
                    <p className="mb-1.5">KVKK nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                      <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                      <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
                      <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                      <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                      <li>KVKK nın 7. maddesi kapsamında silinmesini veya yok edilmesini isteme</li>
                      <li>Düzeltme, silme veya yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                      <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                      <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">9. Başvuru Yöntemi</h4>
                    <p className="mb-1.5">Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:</p>
                    <ul className="space-y-1 text-slate-400 mb-2">
                      <li><strong className="text-slate-200">E-posta:</strong> <a href="mailto:kvkk@sentience.ai" className="text-emerald-400 hover:underline">kvkk@sentience.ai</a></li>
                      <li><strong className="text-slate-200">Kayıtlı Elektronik Posta (KEP):</strong> <a href="mailto:sentience@hs01.kep.tr" className="text-emerald-400 hover:underline">sentience@hs01.kep.tr</a></li>
                    </ul>
                    <p className="text-slate-400">
                      Başvurunuzda kimliğinizi doğrulayan belgeler ve talebinizin açık bir şekilde belirtilmesi gerekmektedir. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="font-bold text-white text-sm mb-1">İletişim Bilgileri</h4>
                    <p className="text-slate-300"><strong className="text-white">Veri Sorumlusu:</strong> Sentience AI A.Ş. (Sentience AI Platformu - sentience.ai)</p>
                    <p className="text-slate-400"><strong className="text-slate-300">Merkez &amp; Ar-Ge:</strong> Bilkent Cyberpark, Tepe Binası No:418, Çankaya / Ankara, Türkiye</p>
                    <p className="text-slate-400"><strong className="text-slate-300">E-posta:</strong> <a href="mailto:kvkk@sentience.ai" className="text-emerald-400 hover:underline">kvkk@sentience.ai</a> / <a href="mailto:destek@sentience.ai" className="text-emerald-400 hover:underline">destek@sentience.ai</a></p>
                    <p className="text-slate-400"><strong className="text-slate-300">Telefon:</strong> +90 (850) 308 00 00</p>
                  </div>
                </div>
              )}

              {activeLegalModal === 'terms' && (
                <>
                  <p>
                    Sentience AI hizmetlerini kullanan her bireysel ve kurumsal kullanıcı, YÖK Bilimsel Araştırma ve Yayın Etiği Yönergesi ne ve Fikir ve Sanat Eserleri Kanunu na uymayı taahhüt eder.
                  </p>
                  <h4 className="font-bold text-white pt-2">Kullanım Sınırları ve Kötüye Kullanım</h4>
                  <p>
                    Sistemin sağladığı analiz ve doğrulama araçları yalnızca araştırmacılara bilimsel dürüstlüklerini korumaları amacıyla sunulmaktadır. Hileli karakter ekleme, görünmez sembollerle dedektörleri aldatma amaçlı kullanım kesinlikle yasaktır ve tespiti halinde hesap feshedilir.
                  </p>
                </>
              )}

              {activeLegalModal === 'cookies' && (
                <>
                  <p>
                    Sentience AI web uygulamasında yalnızca temel oturum yönetimi ve güvenlik fonksiyonları için gerekli zorunlu çerezler kullanılmaktadır. Üçüncü taraf reklam veya izleme çerezi barındırılmaz.
                  </p>
                  <p>
                    Tarayıcı ayarlarınız üzerinden çerezleri dilediğiniz zaman silebilir veya engelleyebilirsiniz.
                  </p>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

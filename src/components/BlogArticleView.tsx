import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint,
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Bookmark,
  ChevronDown,
  Globe,
  Twitter,
  Linkedin,
  Copy,
  ExternalLink,
  BookOpen,
  Mail,
  Zap,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { BlogPost } from '../types/blog';
import { Footer } from './Footer';
export type { BlogPost };

interface BlogArticleViewProps {
  post: BlogPost;
  onBack: () => void;
  onGoHome?: () => void;
  onSelectPost: (p: BlogPost) => void;
  allPosts: BlogPost[];
  onGetStarted: (text?: string) => void;
  onLogin: () => void;
}

export function BlogArticleView({
  post,
  onBack,
  onGoHome,
  onSelectPost,
  allPosts,
  onGetStarted,
  onLogin
}: BlogArticleViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleShare = (type: 'copy' | 'twitter' | 'linkedin') => {
    const url = window.location.href;
    if (type === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success("Bağlantı panoya kopyalandı!");
    } else if (type === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (type === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }
    toast.success("Bülten aboneliğiniz alındı!");
    setNewsletterEmail('');
  };

  const relatedPosts = allPosts.filter(p => p.id !== post.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-[100] border-b border-white/5 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Blog'a Dön</span>
            </button>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <button
              onClick={onGoHome || onBack}
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            >
              <Fingerprint className="w-7 h-7 text-emerald-500" />
              <span className="text-xl font-black tracking-tighter hidden sm:inline"><span lang="en">SENTIENCE</span></span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all mr-2">GİRİŞ YAP</button>
            <button onClick={() => onGetStarted()} className="px-6 py-2.5 bg-emerald-500 text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 shadow-xl shadow-emerald-500/20">HEMEN BAŞLA</button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="pt-28 lg:pt-36 pb-24 px-6 max-w-6xl mx-auto">
        {/* Article Breadcrumbs & Header */}
        <header className="mb-10 lg:mb-14">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">
            <button onClick={onGoHome || onBack} className="hover:text-white transition-colors">Ana Sayfa</button>
            <span>/</span>
            <button onClick={onBack} className="hover:text-white transition-colors">Blog</button>
            <span>/</span>
            <span className="text-emerald-400 truncate max-w-xs">{post.category}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>{post.date}</span>
            </div>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-8 text-white">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/10 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-xs">
                S
              </div>
              <div>
                <div className="font-bold text-white">Sentience Akademik Araştırma Kurulu</div>
                <div className="text-[10px] text-gray-500">YÖK &amp; Uluslararası İntihal Analiz Birimi</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mr-1">Paylaş:</span>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-all"
                title="X'te Paylaş"
              >
                <Twitter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-all"
                title="LinkedIn'de Paylaş"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-all"
                title="Bağlantıyı Kopyala"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hero Featured Image */}
          <div className="mt-8 rounded-[32px] overflow-hidden border border-white/10 shadow-3xl h-[280px] sm:h-[420px] lg:h-[480px] w-full relative">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        </header>

        {/* 2-Column Article Layout (Left Sticky TOC + Right Rich Content) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sidebar (Col-span-4) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            {/* Table of Contents Box */}
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/10 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4" />
                <span>Bu Yazıda (İçindekiler)</span>
              </div>
              <nav className="space-y-2">
                {post.toc.map((item, idx) => (
                  <a
                    key={idx}
                    href={`#${item.id}`}
                    className="block text-xs text-gray-400 hover:text-white hover:translate-x-1 transition-all py-1.5 leading-relaxed font-medium"
                  >
                    <span className="text-emerald-500 font-bold mr-2">{idx + 1}.</span>
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Newsletter Subscription Card */}
            <div className="p-6 rounded-[24px] bg-gradient-to-br from-blue-950/20 to-emerald-950/20 border border-blue-500/20 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 mb-2">
                <Mail className="w-4 h-4" />
                <span>Akademik Bülten</span>
              </div>
              <h4 className="text-base font-bold text-white mb-2">YÖK ve Turnitin Güncellemeleri</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium mb-4">
                Yapay zeka tespiti, intihal algoritmaları ve DergiPark standartlarındaki son gelişmeleri haftalık olarak e-posta ile alın.
              </p>
              <form onSubmit={handleNewsletter} className="space-y-2.5">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="E-posta adresiniz..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                >
                  Ücretsiz Abone Ol
                </button>
              </form>
            </div>

            {/* Direct Tool CTA Card */}
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-emerald-500/20 shadow-xl text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-2">Metniniz Risk Taşıyor mu?</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium mb-4">
                Çalışmanızı resmi Turnitin sistemine teslim etmeden önce Denetçi modülü ile analiz edin.
              </p>
              <button
                onClick={() => onGetStarted()}
                className="w-full py-3 bg-emerald-500 text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                Hemen Test Et
              </button>
            </div>
          </aside>

          {/* Right Main Content (Col-span-8) */}
          <article className="lg:col-span-8 space-y-12 leading-relaxed">
            {/* Lead Intro Paragraph */}
            <div className="p-6 lg:p-8 rounded-[28px] bg-white/[0.02] border-l-4 border-l-emerald-500 border-white/5 text-base lg:text-lg text-gray-200 font-medium leading-relaxed shadow-lg">
              {post.leadParagraph}
            </div>

            {/* Sections */}
            {post.sections.map((sec, sIdx) => (
              <section key={sIdx} id={sec.id} className="pt-6 border-t border-white/10">
                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight mb-6">
                  {sec.title}
                </h2>

                <div className="space-y-4 text-gray-300 text-sm lg:text-base leading-relaxed font-normal">
                  {sec.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>

                {/* In-Content CTA Banner if exists */}
                {sec.callout && (
                  <div className="mt-8 p-6 lg:p-8 rounded-[24px] bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 justify-center sm:justify-start">
                        <Zap className="w-4 h-4 fill-emerald-400" />
                        <span>Akademik Güvence</span>
                      </div>
                      <h4 className="text-lg lg:text-xl font-bold text-white">{sec.callout.title}</h4>
                      <p className="text-xs text-gray-400 max-w-md">{sec.callout.desc}</p>
                    </div>
                    <button
                      onClick={() => onGetStarted()}
                      className="px-6 py-3.5 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      {sec.callout.ctaText}
                    </button>
                  </div>
                )}
              </section>
            ))}

            {/* Article FAQs Accordion */}
            {post.faqs.length > 0 && (
              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Sıkça Sorulan Sorular</span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-6">
                  Konuyla İlgili Merak Edilenler
                </h3>
                <div className="space-y-3">
                  {post.faqs.map((faq, fIdx) => {
                    const isOpen = openFaq === fIdx;
                    return (
                      <div
                        key={fIdx}
                        className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden transition-all hover:border-white/10"
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                          className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm lg:text-base text-white"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0", isOpen && "rotate-180 text-emerald-400")} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 pt-0 text-xs lg:text-sm text-gray-400 leading-relaxed font-medium border-t border-white/5 pt-3">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Final Article Banner */}
            <div className="p-8 lg:p-12 rounded-[32px] bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-black/60 border border-emerald-500/40 text-center space-y-6 shadow-3xl">
              <h3 className="text-2xl lg:text-3xl font-black text-white">
                Çalışmanızı Turnitin ve YÖK Standartlarında Güvenceye Alın
              </h3>
              <p className="text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                Denetçi, İnsanlaştırma, Sentinel ve StyleMaster modülleriyle sıfır halüsinasyon, %100 özgünlük ve yasal intihal sınırlarını koruyun.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => onGetStarted()}
                  className="px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/30 flex items-center gap-3"
                >
                  Metnini Şimdi Analiz Et <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Tüm Blog Yazılarına Dön
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Related Articles Carousel / Grid */}
        <section className="mt-24 pt-16 border-t border-white/10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-white">İlginizi Çekebilecek Diğer Rehberler</h3>
              <p className="text-xs text-gray-400 mt-1">Akademik yayıncılık ve yapay zeka analizlerinde derinleşin.</p>
            </div>
            <button
              onClick={onBack}
              className="text-xs font-bold text-emerald-400 hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectPost(rel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer p-5 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 rounded-2xl overflow-hidden mb-4 relative">
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold uppercase text-emerald-400">
                      {rel.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2 font-medium">
                    {rel.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-emerald-400">
                  <span>Yazıyı İncele</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer
        onNavigateGuide={() => {
          window.history.pushState({}, '', '/guide');
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateBlog={onBack}
        onNavigatePricing={() => {
          if (onGetStarted) {
            onGetStarted();
          } else {
            window.history.pushState({}, '', '/#pricing');
            window.dispatchEvent(new PopStateEvent('popstate'));
            setTimeout(() => {
              document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
          }
        }}
      />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Fingerprint,
  Search,
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ArrowLeft,
  Mail,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BLOG_POSTS } from '../data/blogPosts';
import { BlogPost } from '../types/blog';
import { blogService } from '../services/blogService';
import { Footer } from './Footer';

interface BlogIndexViewProps {
  onSelectPost: (post: BlogPost) => void;
  onGoHome: () => void;
  onLogin: () => void;
  onGetStarted: () => void;
}

export function BlogIndexView({
  onSelectPost,
  onGoHome,
  onLogin,
  onGetStarted
}: BlogIndexViewProps) {
  const [posts, setPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [newsletterEmail, setNewsletterEmail] = useState('');

  React.useEffect(() => {
    blogService.fetchAllPosts(false).then((data) => {
      if (data && data.length > 0) setPosts(data);
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => set.add(p.category));
    return ['Tümü', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesCategory = selectedCategory === 'Tümü' || p.category === selectedCategory;
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, searchQuery, selectedCategory]);

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    toast.success('Akademik bültenimize kaydınız başarıyla alındı!');
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-mesh text-white font-sans selection:bg-emerald-500/30">
      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          >
            <Fingerprint className="w-8 h-8 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
            <span className="text-2xl font-black tracking-tighter">SENTIENCE</span>
          </button>

          <div className="hidden md:flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            <button onClick={onGoHome} className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Ana Sayfa
            </button>
            <span className="text-white/10">|</span>
            <span className="text-emerald-400">Akademik Rehber ve Blog</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogin}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-all px-4 py-2.5"
            >
              GİRİŞ YAP
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 bg-emerald-500 text-black rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              HEMEN BAŞLA
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.25em] mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Bilgi &amp; Araştırma Merkezi
          </div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 uppercase">
            Akademik Rehber ve Blog
          </h1>
          <p className="text-gray-400 text-sm lg:text-base font-normal leading-relaxed">
            YÖK lisansüstü tez kuralları, DergiPark indeksleri, Turnitin yapay zeka filtreleri ve bağımsız doğruluk araştırmaları üzerine güncel analizler.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Makalelerde ara..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Featured Post Card */}
        {featuredPost && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelectPost(featuredPost)}
            className="group cursor-pointer rounded-[32px] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-emerald-500/40 overflow-hidden transition-all shadow-2xl mb-12 grid grid-cols-1 lg:grid-cols-12 gap-0"
          >
            <div className="lg:col-span-7 h-64 lg:h-96 w-full overflow-hidden relative">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                Öne Çıkan İnceleme
              </div>
            </div>

            <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
                  <span className="text-emerald-400">{featuredPost.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {featuredPost.date}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}</span>
                </div>

                <h2 className="text-xl lg:text-2xl font-black text-white leading-tight mb-4 group-hover:text-emerald-400 transition-colors">
                  {featuredPost.title}
                </h2>

                <p className="text-sm text-gray-400 leading-relaxed font-normal mb-6">
                  {featuredPost.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Makaleyi Oku</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid Posts */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
            {gridPosts.map((post) => (
              <motion.article
                key={post.id}
                whileHover={{ y: -6 }}
                onClick={() => onSelectPost(post)}
                className="group cursor-pointer rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 overflow-hidden flex flex-col transition-all shadow-xl"
              >
                <div className="h-44 w-full overflow-hidden relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-3">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-gray-400 leading-relaxed font-normal line-clamp-3 mb-4">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Yazıyı İncele</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          searchQuery && (
            <div className="text-center py-16 text-gray-500 text-sm">
              "{searchQuery}" aramasına uygun makale bulunamadı.
            </div>
          )
        )}

        {/* Newsletter Section */}
        <div className="rounded-[32px] bg-gradient-to-br from-emerald-950/20 to-black/60 border border-emerald-500/20 p-8 lg:p-12 text-center max-w-3xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Akademik Dürüstlük Bülteni</h3>
          <p className="text-sm text-gray-400 max-w-lg mx-auto mb-6">
            YÖK ve Turnitin güncellemeleri, intihal ve yapay zeka etiği üzerine aylık derinlemesine incelemeler doğrudan gelen kutunuzda.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="akademik@universite.edu.tr"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all shrink-0"
            >
              Abone Ol
            </button>
          </form>
        </div>
      </main>

      <Footer
        onNavigateGuide={() => {
          window.history.pushState({}, '', '/guide');
          window.dispatchEvent(new PopStateEvent('popstate'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateBlog={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
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

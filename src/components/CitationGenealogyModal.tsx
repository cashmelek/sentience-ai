import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitFork,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  X,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { CitationGenealogy } from '../services/citationService';
import type { PlagiarismSource } from '../services/sentinelService';
import { AcademicSearchService } from '../services/academicSearchService';

interface CitationGenealogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  genealogy: CitationGenealogy | null;
  source: PlagiarismSource | null;
}

export function CitationGenealogyModal({
  isOpen,
  onClose,
  genealogy,
  source
}: CitationGenealogyModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [openCitationsData, setOpenCitationsData] = React.useState<{
    references: string[];
    citations: string[];
    citationCount: number;
    loading: boolean;
    doi?: string;
  } | null>(null);

  React.useEffect(() => {
    if (!isOpen || !source) return;
    const textToScan = `${source.url || ''} ${source.snippet || ''} ${source.matchedText || ''}`;
    const doiMatch = textToScan.match(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/);
    if (doiMatch) {
      const doi = doiMatch[1].replace(/[.,;]$/, '');
      setOpenCitationsData({ references: [], citations: [], citationCount: 0, loading: true, doi });
      AcademicSearchService.fetchOpenCitationsChain(doi).then(data => {
        setOpenCitationsData({ ...data, loading: false, doi });
      }).catch(() => {
        setOpenCitationsData(null);
      });
    } else {
      setOpenCitationsData(null);
    }
  }, [isOpen, source]);

  if (!isOpen || !genealogy) return null;

  const handleCopyRoot = (citationText: string) => {
    navigator.clipboard.writeText(citationText);
    setCopied(true);
    toast.success('Kök kaynak atıfı panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2000);
  };

  const rootNode = genealogy.nodes.find(n => n.role === 'root') || genealogy.nodes[0];
  const suggestedCitation = `${rootNode.author}${rootNode.year ? ` (${rootNode.year})` : ''}. İdeoloji Üzerine Tezler.`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                  Atıf Soy Kütüğü & Köken Doğrulama
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    SENTINEL DOĞRULAMASI
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  İkincil atıf çözümlemesi ve birincil kaynak kök haritası
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Atıf Ağacı / Hiyerarşi */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              ATIF AKIŞ ZİNCİRİ (SOY KÜTÜĞÜ)
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                {genealogy.nodes.map((node, i) => (
                  <React.Fragment key={i}>
                    <div className="flex-1 w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-1">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
                        {node.role === 'root' ? '1. Kök Kaynak' : node.role === 'intermediate' ? '2. Aktaran Kaynak' : '3. Sizin Metniniz'}
                      </div>
                      <div className="text-sm font-black text-white">
                        {node.author} {node.year ? `(${node.year})` : ''}
                      </div>
                      {node.pages && (
                        <div className="text-[10px] font-mono text-emerald-400">
                          s. {node.pages}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 leading-tight">
                        {node.description}
                      </div>
                    </div>
                    {i < genealogy.nodes.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-emerald-500/60 shrink-0 hidden md:block" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Orijinal Pasaj & İspat */}
          {source?.snippet && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                AKADEMİK VERİTABANINDA YAKALANAN KÖK PASAJ
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 italic leading-relaxed">
                "{source.snippet}"
              </div>
            </div>
          )}

          {/* OpenCitations DOI Atıf Doğrulaması */}
          {openCitationsData && (
            <div className="p-3.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-between text-xs text-teal-300">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span>OpenCitations DOI Doğrulaması:</span>
                <span className="font-bold text-white font-mono">
                  {openCitationsData.loading ? 'Sorgulanıyor...' : `${openCitationsData.citationCount} Aktaran Atıf / ${openCitationsData.references.length} Referans`}
                </span>
              </div>
              <span className="text-[10px] font-mono text-teal-400 font-bold px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30">
                OPENCITATIONS COCI
              </span>
            </div>
          )}

          {/* Akademik Öneri & Doğrudan Kök Atıf Kopyalama */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-300">
                  {genealogy.summary}
                </div>
                <div className="text-[11px] text-emerald-400/80 leading-relaxed">
                  {genealogy.recommendation}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="text-[11px] font-mono text-gray-300 truncate">
                Önerilen Doğrudan Atıf: <span className="text-white font-bold">{suggestedCitation}</span>
              </div>
              <button
                onClick={() => handleCopyRoot(suggestedCitation)}
                className="px-3 py-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-emerald-500/20"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopyalandı' : 'Kök Atıfı Kopyala'}
              </button>
            </div>
          </div>

          {/* Alt Kısım */}
          <div className="flex justify-between items-center pt-2 text-xs">
            {source?.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors font-mono text-[11px]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                Orijinal Kaynağı Görüntüle
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-colors ml-auto"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

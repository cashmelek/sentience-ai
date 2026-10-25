import { useState } from 'react';
import {
  Gauge,
  ShieldCheck,
  Search,
  Zap,
  BarChart3,
  Highlighter,
  Copy,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  GitFork,
  FileSearch,
  Check,
  Activity,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { ScoreCircle, AuditMetricCard, MetricProgress } from '../AuditorMetrics';
import { GrammarPanel } from '../GrammarPanel';
import { formatCitation, parseCitationGenealogy, CitationGenealogy } from '../../services/citationService';
import { CitationGenealogyModal } from '../CitationGenealogyModal';
import type { GrammarSuggestion } from '../../services/geminiService';
import type { MLAnalysisResult } from '../../services/mlService';
import type { CombinedAnalysisResult, AuditorResult, CitationStyle } from '../../types';

/**
 * B20 Adım 5 (Core Refactor): denetçi analiz paneli + Sentinel canlı kaynak paneli +
 * derin metrikler + gramer paneli App.tsx'ten ayrıştırıldı. Davranış birebir korunmuştur.
 */

export type SentinelFilter = 'all' | 'not_cited_or_quoted' | 'missing_quotations' | 'missing_citation' | 'cited_and_quoted' | 'exclude_quotes' | 'exclude_minor' | 'exclude_bibliography';

export type ReadabilityPosition = { start: number; end: number; text: string };

interface AuditorSidebarProps {
  className?: string;
  localAuditorSensitivity: number;
  onSensitivityChange: (value: number) => void;
  auditorResult: AuditorResult | null;
  analysis: CombinedAnalysisResult | null;
  mlAnalysis: MLAnalysisResult | null;
  inputText: string;
  onReadabilityHover: (position: ReadabilityPosition | null) => void;
  // Gramer
  grammarSuggestions: GrammarSuggestion[];
  onGrammarApply: (suggestion: GrammarSuggestion) => void;
  onGrammarDismiss: (suggestion: GrammarSuggestion) => void;
  onGrammarDismissAll: () => void;
  onGrammarHover: (suggestion: GrammarSuggestion | null) => void;
  hoveredGrammar: GrammarSuggestion | null;
  grammarHoverFound: boolean;
  // Sentinel
  sentinelFilter: SentinelFilter;
  onSentinelFilterChange: (filter: SentinelFilter) => void;
  hoveredSourceUrl: string | null;
  onSourceHover: (url: string | null) => void;
  onInsightHover: (sentence: string) => void;
  onInsightHoverEnd: () => void;
  onCopyCitations: (style: CitationStyle) => void;
  onRemovePlagiarism: () => void;
  canHumanize: boolean;
  onApplySanitizedText?: (cleanText: string) => void;
}

export function AuditorSidebar(props: AuditorSidebarProps) {
  const {
    className,
    localAuditorSensitivity,
    onSensitivityChange,
    auditorResult,
    analysis,
    mlAnalysis,
    inputText,
    onReadabilityHover,
    grammarSuggestions,
    onGrammarApply,
    onGrammarDismiss,
    onGrammarDismissAll,
    onGrammarHover,
    hoveredGrammar,
    grammarHoverFound,
    sentinelFilter,
    onSentinelFilterChange,
    hoveredSourceUrl,
    onSourceHover,
    onInsightHover,
    onInsightHoverEnd,
    onCopyCitations,
    onRemovePlagiarism,
    canHumanize,
    onApplySanitizedText
  } = props;

  const [activeGenealogy, setActiveGenealogy] = useState<{
    genealogy: CitationGenealogy;
    source: any;
  } | null>(null);
  const [copiedQueryUrl, setCopiedQueryUrl] = useState<string | null>(null);

  const handleCopySearchSnippet = (snippet: string, url: string) => {
    const cleanSnippet = snippet.replace(/[“”"']/g, '').split(/[.!?]/)[0].trim().slice(0, 60);
    navigator.clipboard.writeText(cleanSnippet);
    setCopiedQueryUrl(url);
    toast.success(`PDF içi arama ifadesi kopyalandı: "${cleanSnippet}"`);
    setTimeout(() => setCopiedQueryUrl(null), 2500);
  };

  // B22: Sentinel tarama durumu — 'ok' dışında hiçbir "özgün/temiz" iddiası gösterilemez
  const scanStatus = analysis?.scanStatus ?? 'ok';
  const scanOk = scanStatus === 'ok';
  const scanFailText: Record<string, string> = {
    disabled: 'Sentinel kapalı — canlı tarama yapılmadı, sonuç yok.',
    offline: 'Ağ erişimi yok — tarama yapılamadı, sonuç yok.',
    not_configured: 'Google Search yapılandırılmamış (API anahtarı / Engine ID eksik) — tarama yapılamadı.',
    failed: 'Google Search istekleri başarısız (kota veya anahtar hatası) — güvenilir sonuç alınamadı.'
  };

  return (
    <div className={cn("w-full lg:w-80 flex-col gap-6 shrink-0 h-full max-h-full overflow-y-auto custom-scrollbar pb-8 relative z-20", className)}>
      <div className="p-6 glass-panel rounded-[24px] space-y-6 overflow-visible">
        <div className="flex items-center justify-between"><h3 className="text-[12px] font-bold text-gray-400 flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-500/70" /> Denetçi Analiz</h3><div className="flex flex-col items-end gap-1"><div className="flex items-center gap-2"><span className="text-[7px] font-black text-gray-600 uppercase tracking-wider">Hassasiyet</span><span className="text-[10px] font-mono text-emerald-500 font-bold">%{localAuditorSensitivity}</span></div><input type="range" min="0" max="100" value={localAuditorSensitivity} onChange={(e) => onSensitivityChange(parseInt(e.target.value))} className="w-24 h-1 accent-emerald-500 bg-white/10 rounded-full cursor-pointer" /></div></div>
        {auditorResult ? (() => {
          const rawScore = auditorResult?.score ?? 0;
          const aiScore = rawScore > 1 ? rawScore / 100 : Math.max(0, rawScore);

          const allSources = analysis?.sources || [];
          const BIB_REGEX = /kaynak[\u00e7c]a|references|bibliography|bibliyografya/i;
          const activeSources = allSources.filter((s: any) => {
            if (sentinelFilter === 'exclude_quotes') {
              return s.matchGroup !== 'cited_and_quoted' && !/^["“«].*["”»]$/.test((s.matchedText || '').trim());
            }
            if (sentinelFilter === 'exclude_minor') {
              return (s.matchedText || s.snippet || '').trim().split(/\s+/).length >= 10;
            }
            if (sentinelFilter === 'exclude_bibliography') {
              return !BIB_REGEX.test(s.title || '') && !BIB_REGEX.test(s.snippet || '');
            }
            if (sentinelFilter !== 'all') {
              return s.matchGroup === sentinelFilter;
            }
            return true;
          });

          const rawPlg = typeof auditorResult?.metrics?.plagiarism === 'number' && !isNaN(auditorResult.metrics.plagiarism)
            ? auditorResult.metrics.plagiarism
            : (typeof analysis?.similarityScore === 'number' && !isNaN(analysis.similarityScore) ? analysis.similarityScore / 100 : 0);
          const basePlgScore = rawPlg > 1 ? rawPlg / 100 : Math.max(0, rawPlg);
          const isFilterActive = sentinelFilter !== 'all';
          const plgScore = (isFilterActive && allSources.length > 0)
            ? (activeSources.length / allSources.length) * basePlgScore
            : basePlgScore;
          const plgPct = Math.round(plgScore * 100);

          return (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-8 mb-6">
                <ScoreCircle score={aiScore} label="YZ Olasılığı" size={140} type="ai" />
                <ScoreCircle score={plgScore} label={isFilterActive ? "Net Orijinallik" : "Orijinallik"} size={140} color={plgScore > 0.2 ? '#ef4444' : '#10b981'} inverse type="plagiarism" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <AuditMetricCard title="YZ TESPİTİ" value={`%${Math.round(aiScore * 100)}`} percentage={aiScore} icon={ShieldCheck} color="text-red-500" detail={aiScore > 0.7 ? "Yüksek ihtimalle YZ" : "Doğal içerik yapısı"} />
                <AuditMetricCard 
                  title={isFilterActive ? "İNTİHAL (FİLTRELİ)" : "İNTİHAL"} 
                  value={scanOk ? `%${plgPct}` : '—'} 
                  percentage={plgScore} 
                  icon={Search} 
                  color="text-amber-500" 
                  detail={scanOk ? (isFilterActive ? `Filtrelenmiş net benzerlik (${activeSources.length}/${allSources.length} kaynak)` : `Canlı kaynak eşleşmesi (${analysis?.queriesRun ?? 0} sorgu)`) : 'Tarama yapılamadı — veri yok'} 
                />
                {auditorResult.integrityReport && !auditorResult.integrityReport.isClean && (
                  <div className="p-4 bg-red-500/[0.06] border border-red-500/20 rounded-2xl">
                    <div className="text-[12px] font-bold text-red-400 mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                        Bütünlük Bayrağı — {auditorResult.integrityReport.totalFlags} Sorun
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">Turnitin Uyumlu</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {auditorResult.integrityReport.hasHomoglyphs && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold">
                          ⚠ Harf İkamesi ({auditorResult.integrityReport.homoglyphCount})
                        </span>
                      )}
                      {auditorResult.integrityReport.hasHiddenChars && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-semibold">
                          ⚠ Gizli Karakter ({auditorResult.integrityReport.hiddenCharCount})
                        </span>
                      )}
                      {auditorResult.integrityReport.hasHiddenTextPatterns && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-semibold">
                          ⚠ Gizli Metin/Stil ({auditorResult.integrityReport.hiddenTextPatternCount})
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 mb-3">
                      {auditorResult.integrityReport.details.slice(0, 5).map((d, i) => (
                        <div key={i} className="text-[10px] text-gray-400 font-mono bg-black/20 p-1.5 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-red-400 font-bold">{d.codePoint}</span>
                            {d.word && <span className="text-gray-300 font-sans italic text-[10px]">"{d.word}"</span>}
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            {d.description || (d.type === 'homoglyph' ? `'${d.expected}' yerine ikame` : 'Gizli karakter')}
                            <span className="text-gray-600 ml-1.5">@pos {d.index}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {auditorResult.integrityReport.details.length > 5 && (
                      <div className="text-[10px] text-gray-500 mb-2 font-mono">+{auditorResult.integrityReport.details.length - 5} manipülasyon daha...</div>
                    )}
                    {onApplySanitizedText && (
                      <button
                        onClick={() => onApplySanitizedText(auditorResult.integrityReport!.sanitizedText)}
                        className="w-full mt-1 py-1.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-red-400" />
                        Metni Hilelerden Arındır
                      </button>
                    )}
                  </div>
                )}
                {auditorResult.integrityReport?.isClean && (
                  <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-[11px] text-emerald-400 font-semibold">Bütünlük Temiz — Manipülasyon İzi Bulunamadı</span>
                  </div>
                )}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl"><div className="text-[12px] font-bold text-gray-400 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500/70" /> Analiz Muhakemesi</div><div className="text-[15px] text-gray-300 leading-relaxed italic border-l-3 border-emerald-500/40 pl-4 py-1">"{auditorResult.reasoning}"</div></div>
              </div>
            </div>
          );

        })() : (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto text-gray-600">
              <ShieldCheck className="w-6 h-6 text-emerald-500/40" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-300">Henüz Analiz Yapılmadı</p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-[220px] mx-auto leading-relaxed">
                Giriş metninizi yapıştırıp <span className="text-emerald-500 font-semibold">Denetçi Analizi</span> butonuna tıklayarak YZ olasılığı ve intihal taramasını başlatın.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sentinel Canlı Kaynak Paneli */}
      {analysis && (
        <div className="p-6 glass-panel rounded-[24px] space-y-4 overflow-visible">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-gray-400 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-500/70" /> Sentinel Kaynakları
            </h3>
            <span className={cn(
              "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
              analysis.sources && analysis.sources.length > 0
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : scanOk
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-gray-500/10 text-gray-400 border-gray-500/20"
            )}>
              {analysis.sources && analysis.sources.length > 0
                ? `${analysis.sources.length} Eşleşme`
                : scanOk ? '%100 Özgün' : 'Tarama Verisi Yok'}
            </span>
          </div>
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {(['all', 'not_cited_or_quoted', 'missing_quotations', 'missing_citation', 'cited_and_quoted', 'exclude_quotes', 'exclude_minor', 'exclude_bibliography'] as const).map(f => {
                const labels: Record<string, string> = {
                  all: 'Tümü',
                  not_cited_or_quoted: '🔴 Atıfsız',
                  missing_quotations: '🟠 Tırnak Eksik',
                  missing_citation: '🟡 Kaynak Eksik',
                  cited_and_quoted: '🟢 Meşru',
                  exclude_quotes: '💬 Alıntıyı H.Tut',
                  exclude_minor: '∅ <10 Kel. Gizle',
                  exclude_bibliography: '📖 Kaynakçayı H.Tut'
                };
                return (
                  <button
                    key={f}
                    onClick={() => onSentinelFilterChange(f)}
                    className={cn(
                      'text-[9px] px-2 py-0.5 rounded-full border font-bold transition-all',
                      sentinelFilter === f
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                        : 'bg-white/[0.03] border-white/10 text-gray-500 hover:text-gray-300'
                    )}
                  >{labels[f]}</button>
                );
              })}
            </div>
          )}

          {analysis.sources && analysis.sources.length > 0 ? (
            <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/5">
                <span className="text-[10px] text-gray-400 font-bold">Kaynak Listesi</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCopyCitations('apa')}
                    className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                    title="Tüm kaynakları APA formatında panoya kopyala"
                  >
                    <Copy className="w-2.5 h-2.5" /> Kaynakça (APA)
                  </button>
                  <button
                    onClick={onRemovePlagiarism}
                    disabled={!canHumanize}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                    title="Tüm intihalleri gidermek için insanlaştırma motorunu çalıştır"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> İntihali Kaldır
                  </button>
                </div>
              </div>
              {(() => {
                const BIBLIOGRAPHY_KEYWORDS = /kaynak[\u00e7c]a|references|bibliography|bibliyografya/i;
                const filteredSources = analysis.sources.filter((s: any) => {
                  if (sentinelFilter === 'exclude_quotes') {
                    return s.matchGroup !== 'cited_and_quoted' && !/^["“«].*["”»]$/.test((s.matchedText || '').trim());
                  }
                  if (sentinelFilter === 'exclude_minor') {
                    return (s.matchedText || s.snippet || '').trim().split(/\s+/).length >= 10;
                  }
                  if (sentinelFilter === 'exclude_bibliography') {
                    return !BIBLIOGRAPHY_KEYWORDS.test(s.title || '') && !BIBLIOGRAPHY_KEYWORDS.test(s.snippet || '');
                  }
                  if (sentinelFilter !== 'all') {
                    return s.matchGroup === sentinelFilter;
                  }
                  return true;
                });
                return (
                  <>
                    {filteredSources.length === 0 && (
                      <div className="text-[10px] text-gray-600 italic text-center py-4">Bu filtre için eşleşme bulunamadı.</div>
                    )}
                    {filteredSources.map((s: any, idx: number) => {
                      const isCardActive = hoveredSourceUrl === s.url;
                      const cardMatchedText = s.matchedText || s.snippet || '';
                      return (
                        <div
                          key={idx}
                          id={`sentinel-card-${encodeURIComponent(s.url || '')}`}
                          className={cn(
                            "p-3 border rounded-xl transition-all duration-300 text-left group cursor-default",
                            isCardActive
                              ? "bg-amber-500/10 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                              : "bg-white/[0.02] border-white/5 hover:border-amber-500/30"
                          )}
                          onMouseEnter={() => {
                            if (s.url) {
                              onSourceHover(s.url);
                              if (cardMatchedText) {
                                onInsightHover(cardMatchedText);
                              }
                            }
                          }}
                          onMouseLeave={() => {
                            onSourceHover(null);
                            onInsightHoverEnd();
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {s.matchGroup && (
                                <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-black shrink-0 border flex items-center gap-1', {
                                  'bg-rose-500/15 text-rose-400 border-rose-500/30': s.matchGroup === 'not_cited_or_quoted',
                                  'bg-amber-500/15 text-amber-400 border-amber-500/30': s.matchGroup === 'missing_quotations',
                                  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30': s.matchGroup === 'missing_citation',
                                  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30': s.matchGroup === 'cited_and_quoted',
                                  'bg-purple-500/15 text-purple-400 border-purple-500/30': s.matchGroup === 'peer_match',
                                  'bg-indigo-500/15 text-indigo-400 border-indigo-500/30': s.matchGroup === 'self_plagiarism',
                                })}>
                                  <span>
                                    {s.matchGroup === 'not_cited_or_quoted' ? '🔴' :
                                     s.matchGroup === 'missing_quotations' ? '🟠' :
                                     s.matchGroup === 'missing_citation' ? '🟡' :
                                     s.matchGroup === 'cited_and_quoted' ? '🟢' :
                                     s.matchGroup === 'peer_match' ? '👥' :
                                     s.matchGroup === 'self_plagiarism' ? '🔄' : '🔴'}
                                  </span>
                                  <span>
                                    {s.matchGroup === 'not_cited_or_quoted' ? 'Atıf Yok' :
                                     s.matchGroup === 'missing_quotations' ? 'Tırnak Eksik' :
                                     s.matchGroup === 'missing_citation' ? 'Atıf Eksik' :
                                     s.matchGroup === 'cited_and_quoted' ? 'Doğru Atıf' :
                                     s.matchGroup === 'peer_match' ? 'Eş-Öğrenci' :
                                     s.matchGroup === 'self_plagiarism' ? 'Öz-İntihal' : 'Atıf Yok'}
                                  </span>
                                </span>
                              )}
                              {s.region && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-blue-500/15 text-blue-400">
                                  {s.region === 'domestic' ? '🇹🇷 Yerli' : s.region === 'academic' ? '🎓 Akademik' : '🌍 Yabancı'}
                                </span>
                              )}
                              {s.trust === 'high' && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-emerald-500/15 text-emerald-400" title="Domain türü güvenilir olarak değerlendiriliyor (içerik doğrulaması değildir)">
                                  GÜVENİLİR
                                </span>
                              )}
                              <span className={cn(
                                "text-[11px] font-bold line-clamp-1 transition-colors",
                                isCardActive ? "text-amber-300" : "text-gray-200 group-hover:text-amber-400"
                              )}>
                                {s.title || 'İnternet Kaynağı'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(formatCitation(s, 'apa'));
                                  toast.success("APA atfı panoya kopyalandı");
                                }}
                                className="text-gray-500 hover:text-amber-400 p-0.5 transition-colors"
                                title="Bu kaynağın APA atfını kopyala"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {s.url && (
                                <a href={s.url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-400 p-0.5" title="Kaynağa Git" onClick={e => e.stopPropagation()}>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          {(s.snippet || s.matchedSnippet || s.matchedText) && (() => {
                            const gen = parseCitationGenealogy(s.matchedText || inputText, s.snippet || s.matchedSnippet || '');
                            const isForeign = s.region === 'international' || /^[a-zA-Z\s,.:;-]+$/.test((s.snippet || '').slice(0, 40));
                            return (
                              <div className="space-y-1.5">
                                <p className={cn(
                                  "text-[10px] line-clamp-2 italic leading-relaxed transition-colors",
                                  isCardActive ? "text-amber-200/80" : "text-gray-400"
                                )}>
                                  "{s.snippet || s.matchedSnippet || s.matchedText}"
                                </p>
                                {s.snippet && s.matchedText && s.snippet !== s.matchedText && (
                                  <p className="text-[8px] text-gray-500 font-mono truncate" title={`Google Özet Pasajı: ${s.snippet}`}>
                                    🔍 Özet: {s.snippet}
                                  </p>
                                )}

                                {/* Atıf Soy Kütüğü Kompakt Barı */}
                                {gen && gen.hasChain && (
                                  <div className="mt-1.5 p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 truncate">
                                      <GitFork className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">
                                        {gen.nodes.map(n => n.author).join(' → ')}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveGenealogy({ genealogy: gen, source: s });
                                      }}
                                      className="px-1.5 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded text-[7px] font-black uppercase tracking-wider shrink-0 transition-colors"
                                    >
                                      Soy Kütüğü
                                    </button>
                                  </div>
                                )}

                                {/* Yabancı Kaynak / PDF İçi Arama Aksiyonu */}
                                {isForeign && s.snippet && (
                                  <div className="flex items-center justify-between gap-1 pt-1 text-[8px]">
                                    <span className="text-gray-500 font-mono truncate">
                                      PDF Arama İfadesi
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopySearchSnippet(s.snippet, s.url);
                                      }}
                                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold transition-colors"
                                      title="PDF belgesinde Ctrl+F ile bulmak için eşleşen pasajı kopyalar"
                                    >
                                      {copiedQueryUrl === s.url ? <Check className="w-2.5 h-2.5" /> : <FileSearch className="w-2.5 h-2.5" />}
                                      {copiedQueryUrl === s.url ? 'Kopyalandı' : 'PDF İçi Ara'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          {s.similarity !== undefined && (
                            <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <span>Benzerlik</span>
                                {s.semanticScore !== undefined && (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold" title="Vektör Embedding ile Semantik Anlam Benzerliği">
                                    %{s.semanticScore} Semantik
                                  </span>
                                )}
                              </div>
                              <span className={cn("font-bold", s.similarity > 0.3 ? "text-red-400" : "text-amber-400")}>
                                %{Math.round(s.similarity * 100)}
                              </span>
                            </div>
                          )}
                          {isCardActive && (
                            <div className="mt-2 flex items-center gap-1 text-[9px] text-amber-400/70 font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              Metin Vurgulaniyor
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          ) : scanOk ? (
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[10px] text-emerald-400/90 font-medium leading-tight">
                Canlı web taramasında {analysis.queriesRun ?? 0} sorgu yapıldı; intihal tespit edilmedi.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-300/90 font-medium leading-tight">
                {scanFailText[scanStatus]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Derin Metrikler & Detaylı Dil Analizi */}
      {(mlAnalysis || auditorResult?.metrics || analysis?.metrics) && (() => {
        const metrics = (auditorResult?.metrics || analysis?.metrics || {}) as any;
        const readability = typeof mlAnalysis?.readabilityScore === 'number'
          ? mlAnalysis.readabilityScore
          : (typeof metrics.readability === 'number' ? (metrics.readability > 1 ? metrics.readability / 100 : metrics.readability) : 0.7);

        const atesmanVal = typeof mlAnalysis?.metrics?.atesman === 'number'
          ? Math.round(mlAnalysis.metrics.atesman)
          : (typeof metrics.atesman === 'number' ? Math.round(metrics.atesman) : null);

        const cetinkayaVal = typeof mlAnalysis?.metrics?.cetinkayaUzun === 'number'
          ? Math.round(mlAnalysis.metrics.cetinkayaUzun)
          : (typeof metrics.cetinkayaUzun === 'number' ? Math.round(metrics.cetinkayaUzun) : null);

        const bezirciVal = typeof mlAnalysis?.metrics?.bezirciYilmaz === 'number'
          ? mlAnalysis.metrics.bezirciYilmaz
          : (typeof metrics.bezirciYilmaz === 'number' ? metrics.bezirciYilmaz : null);

        const lixVal = typeof mlAnalysis?.metrics?.lix === 'number'
          ? Math.round(mlAnalysis.metrics.lix)
          : (typeof metrics.lix === 'number' ? Math.round(metrics.lix) : null);

        const rawPerplexity = typeof metrics.perplexity === 'number' ? metrics.perplexity : null;
        const perplexityPct = rawPerplexity !== null
          ? (rawPerplexity > 1 ? Math.min(1, rawPerplexity / 100) : rawPerplexity)
          : null;

        const rawBurstiness = typeof metrics.burstiness === 'number' ? metrics.burstiness : null;
        const burstinessPct = rawBurstiness !== null
          ? (rawBurstiness > 1 ? Math.min(1, rawBurstiness / 100) : rawBurstiness)
          : null;

        const rawStructure = typeof metrics.structureScore === 'number' ? metrics.structureScore : null;
        const structurePct = rawStructure !== null
          ? (rawStructure > 1 ? Math.min(1, rawStructure / 100) : rawStructure)
          : null;

        const wordCount = mlAnalysis?.metrics?.wordCount ?? (inputText ? inputText.trim().split(/\s+/).filter(Boolean).length : 0);
        const sentenceCount = mlAnalysis?.metrics?.sentenceCount ?? (inputText ? inputText.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0);
        const syllableCount = mlAnalysis?.metrics?.syllableCount;

        return (
          <div className="p-6 glass-panel rounded-[24px] space-y-5 overflow-visible">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-gray-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500/70" /> Derin Metrikler
              </h3>
              {metrics.complexity && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono">
                  {metrics.complexity}
                </span>
              )}
            </div>

            {/* İstatistik Rozetleri */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Kelime</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">{wordCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Cümle</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">{sentenceCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                <div className="text-[8px] font-black uppercase text-gray-500 tracking-wider">Hece</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">{syllableCount ?? '-'}</div>
              </div>
            </div>

            <div className="space-y-3.5 pt-1">
              <MetricProgress
                icon={Highlighter}
                label="OKUNABİLİRLİK"
                value={`%${Math.round(readability * 100)}`}
                percentage={readability}
              />

              {perplexityPct !== null && (
                <MetricProgress
                  icon={Zap}
                  label="PERPLEXITY (KELİME ÇEŞİTLİLİĞİ)"
                  value={rawPerplexity! > 1 ? `${Math.round(rawPerplexity!)}` : `%${Math.round(perplexityPct * 100)}`}
                  percentage={perplexityPct}
                />
              )}

              {burstinessPct !== null && (
                <MetricProgress
                  icon={Activity}
                  label="BURSTINESS (RİTİM DALGALANMASI)"
                  value={`%${Math.round(burstinessPct * 100)}`}
                  percentage={burstinessPct}
                />
              )}

              {structurePct !== null && (
                <MetricProgress
                  icon={Layers}
                  label="YAPI & TUTARLILIK"
                  value={`%${Math.round(structurePct * 100)}`}
                  percentage={structurePct}
                />
              )}
            </div>

            {(atesmanVal !== null || cetinkayaVal !== null || bezirciVal !== null || lixVal !== null) && (
              <div className="pt-2 border-t border-white/5 space-y-2">
                <div className="text-[9px] font-black uppercase text-gray-500 tracking-wider">TÜRKÇE OKUNABİLİRLİK ENDEKSLERİ</div>
                <div className="grid grid-cols-2 gap-2">
                  {atesmanVal !== null && (
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">Ateşman İndeksi</div>
                      <div className="text-xs font-mono font-black text-emerald-400 mt-0.5">{atesmanVal} <span className="text-[8px] text-gray-500 font-normal">/ 100</span></div>
                    </div>
                  )}
                  {cetinkayaVal !== null && (
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">Çetinkaya-Uzun</div>
                      <div className="text-xs font-mono font-black text-sky-400 mt-0.5">{cetinkayaVal} <span className="text-[8px] text-gray-500 font-normal">/ 100</span></div>
                    </div>
                  )}
                  {bezirciVal !== null && (
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">Bezirci-Yılmaz</div>
                      <div className="text-xs font-mono font-black text-amber-400 mt-0.5">{bezirciVal} <span className="text-[8px] text-gray-500 font-normal">YOD</span></div>
                    </div>
                  )}
                  {lixVal !== null && (
                    <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">LIX Endeksi</div>
                      <div className="text-xs font-mono font-black text-purple-400 mt-0.5">{lixVal} <span className="text-[8px] text-gray-500 font-normal">Puan</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {mlAnalysis?.recommendations && mlAnalysis.recommendations.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-[9px] text-gray-500 font-bold uppercase mb-2 tracking-widest">ÖNERİLER</div>
                <div className="space-y-2">
                  {mlAnalysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-gray-400 flex gap-2 leading-relaxed cursor-pointer hover:text-emerald-400 transition-colors group"
                      onMouseEnter={() => {
                        if (rec.position) {
                          onReadabilityHover(rec.position);
                        }
                      }}
                      onMouseLeave={() => {
                        onReadabilityHover(null);
                      }}
                    >
                      <span className="text-emerald-500">•</span>
                      <span>{rec.text}</span>
                      {rec.position && (
                        <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          (Satır: {inputText.substring(0, rec.position.start).split('\n').length})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
      {grammarSuggestions.length > 0 && (
        <GrammarPanel
          suggestions={grammarSuggestions}
          onApply={onGrammarApply}
          onDismiss={(suggestion) => {
            onGrammarDismiss(suggestion);
          }}
          onDismissAll={onGrammarDismissAll}
          onHover={onGrammarHover}
          hoveredSuggestion={hoveredGrammar}
          hoverFound={grammarHoverFound}
        />
      )}

      {/* Atıf Soy Kütüğü & Köken Doğrulama Modalı */}
      <CitationGenealogyModal
        isOpen={!!activeGenealogy}
        onClose={() => setActiveGenealogy(null)}
        genealogy={activeGenealogy?.genealogy || null}
        source={activeGenealogy?.source || null}
      />
    </div>
  );
}

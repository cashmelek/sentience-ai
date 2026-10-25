import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Database,
  Download,
  FileDown,
  FileText,
  FileUp,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  X,
  Zap,
  Filter,
  BarChart3,
  Activity,
  BookOpen,
  Highlighter,
  AlertCircle,
  AlertTriangle,
  Layers,
  Send,
  CheckCircle2,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getSubmissionFileUrl, forwardSubmissionToInstitute } from '../../services/classroomService';
import { toast } from 'sonner';
import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { fmtDateTime, scoreColor, scoreBarClass, pct, normalizeScore } from './format';
import { exportSubmissionReportPDF, exportInstituteApprovalPDF, matchGroupLabel, trustLabel } from './submissionExport';
import { detectIntegrityFlags } from '../../ml/textFeatures';

export const MOSAIC_PALETTE = [
  { border: 'border-rose-500/40', bg: 'bg-rose-500/15', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', hex: '#f43f5e', name: 'Gül Kurusu' },
  { border: 'border-blue-500/40', bg: 'bg-blue-500/15', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', hex: '#3b82f6', name: 'Mavi' },
  { border: 'border-amber-500/40', bg: 'bg-amber-500/15', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', hex: '#f59e0b', name: 'Sarı' },
  { border: 'border-emerald-500/40', bg: 'bg-emerald-500/15', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', hex: '#10b981', name: 'Zümrüt' },
  { border: 'border-purple-500/40', bg: 'bg-purple-500/15', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', hex: '#a855f7', name: 'Mor' },
  { border: 'border-cyan-500/40', bg: 'bg-cyan-500/15', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', hex: '#06b6d4', name: 'Cam Göbeği' },
  { border: 'border-orange-500/40', bg: 'bg-orange-500/15', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', hex: '#f97316', name: 'Turuncu' },
  { border: 'border-pink-500/40', bg: 'bg-pink-500/15', text: 'text-pink-400', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/30', hex: '#ec4899', name: 'Pembe' }
];

const matchGroupBadge: Record<string, { label: string; cls: string; icon: string }> = {
  not_cited_or_quoted: { label: 'Atıf & Tırnak Yok', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30', icon: '🔴' },
  missing_quotations: { label: 'Tırnak Eksik', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: '🟠' },
  missing_citation: { label: 'Kaynakça Eksik', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: '🟡' },
  cited_and_quoted: { label: 'Doğru Atıf', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: '🟢' },
  peer_match: { label: 'Eş-Öğrenci Eşleşmesi', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: '👥' },
  self_plagiarism: { label: 'Öz-İntihal', cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: '🔄' },
};

interface SubmissionReportViewProps {
  cls: ClassRoom;
  assignment: Assignment;
  submission: Submission;
  canExclude: boolean;
  busy?: boolean;
  onToggleExclude: (url: string, excluded: boolean) => void;
  onRerun: () => void;
  onClose: () => void;
  onSaveGrade?: (grade: number | null, feedback: string) => Promise<void>;
}

export function SubmissionReportView({
  cls,
  assignment,
  submission,
  canExclude,
  busy,
  onToggleExclude,
  onRerun,
  onClose,
  onSaveGrade,
}: SubmissionReportViewProps) {
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [excludeQuotes, setExcludeQuotes] = useState(false);
  const [excludeBibliography, setExcludeBibliography] = useState(false);
  const [excludeMinorPercent, setExcludeMinorPercent] = useState(false);
  const [minWordMatch, setMinWordMatch] = useState<number>(0);
  const [isWordThresholdOpen, setIsWordThresholdOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'alpha'>('desc');
  const [viewTab, setViewTab] = useState<'sources' | 'mosaic'>('sources');
  const [isForwardedToInstitute, setIsForwardedToInstitute] = useState(Boolean(submission.forwardedToInstitute));
  const [forwarding, setForwarding] = useState(false);
  const [gradeInput, setGradeInput] = useState<string>(
    typeof submission.grade === 'number' ? String(submission.grade) : ''
  );
  const [feedbackInput, setFeedbackInput] = useState<string>(submission.feedback || '');
  const [savingGrade, setSavingGrade] = useState(false);
  const [showIntegrityDetails, setShowIntegrityDetails] = useState(false);

  const integrity = useMemo(() => detectIntegrityFlags(submission.text || ''), [submission.text]);

  const handleSaveGradeClick = async () => {
    if (!onSaveGrade) return;
    const parsed = gradeInput.trim() === '' ? null : Number(gradeInput);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      toast.error('Not 0 ile 100 arasında bir sayı olmalıdır');
      return;
    }
    setSavingGrade(true);
    try {
      await onSaveGrade(parsed, feedbackInput);
    } finally {
      setSavingGrade(false);
    }
  };

  const excluded = new Set(submission.excludedSourceUrls || []);
  const sources = submission.sources || [];
  const rawSimilarity = submission.similarityScore ?? 0;
  const normalizedRaw = rawSimilarity > 1 ? rawSimilarity / 100 : rawSimilarity;

  const bibliographyIndex = (() => {
    const match = submission.text.match(/(?:\n|\r)\s*(?:kaynakça|kaynaklar|referanslar|bibliography|references)\s*(?::|\n|\r)/i);
    return match && match.index !== undefined ? match.index : -1;
  })();

  const getSourceFilterStatus = (s: any) => {
    if (excluded.has(s.url)) {
      return { isFiltered: true, reason: 'Manuel Dışlandı' };
    }
    if (excludeQuotes) {
      if (s.matchGroup === 'cited_and_quoted') {
        return { isFiltered: true, reason: 'Alıntı Filtresi (Tırnak İçi Doğru Atıf)' };
      }
      if (s.matchedText && (/^["“«].*["”»]$/.test(s.matchedText.trim()) || s.matchedSnippet?.includes('"'))) {
        return { isFiltered: true, reason: 'Alıntı Filtresi (Tırnak İçi)' };
      }
    }
    if (excludeBibliography && bibliographyIndex !== -1 && s.matchedText) {
      const pos = submission.text.indexOf(s.matchedText);
      if (pos >= bibliographyIndex) {
        return { isFiltered: true, reason: 'Kaynakça Bölümünden Hariç Tutuldu' };
      }
    }
    if (excludeMinorPercent && s.similarity !== undefined && s.similarity < 0.01) {
      return { isFiltered: true, reason: '%1 Altı Mikro Benzerlik' };
    }
    if (minWordMatch > 0) {
      const words = (s.matchedText || s.snippet || '').trim().split(/\s+/).filter(Boolean).length;
      if (words < minWordMatch) {
        return { isFiltered: true, reason: `${minWordMatch} Kelimeden Az Mikro Eşleşme` };
      }
    }
    return { isFiltered: false, reason: '' };
  };

  const activeSources = sources.filter(s => !getSourceFilterStatus(s).isFiltered);
  const netSimilarity = sources.length > 0
    ? (activeSources.length / sources.length) * normalizedRaw
    : normalizedRaw;
  const isAnyFilterActive = excludeQuotes || excludeBibliography || excludeMinorPercent || minWordMatch > 0 || excluded.size > 0;

  const bibliographyEntries = (() => {
    if (bibliographyIndex === -1) return [];
    const bibText = submission.text.substring(bibliographyIndex);
    return bibText
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length > 20 && !/^(kaynakça|kaynaklar|referanslar|bibliography|references)/i.test(line));
  })();

  const totalReferencesCount = Math.max(bibliographyEntries.length, sources.length);
  const verifiedReferencesCount = sources.filter(s =>
    s.trust === 'high' ||
    s.trust === 'medium' ||
    s.matchGroup === 'cited_and_quoted' ||
    s.url.includes('doi.org') ||
    s.url.includes('dergipark') ||
    s.url.includes('crossref') ||
    s.url.includes('arxiv') ||
    s.url.includes('.edu') ||
    s.url.includes('.gov')
  ).length;

  const referenceScore = totalReferencesCount > 0
    ? Math.min(100, Math.round((verifiedReferencesCount / totalReferencesCount) * 100))
    : 100;

  const downloadText = () => {
    const blob = new Blob([submission.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submission.title.replace(/[^\wçÇğĞıİöÖşŞüÜ -]/g, '').slice(0, 60) || 'teslim'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOriginalFile = async () => {
    if (!submission.storagePath) {
      downloadText();
      return;
    }
    try {
      const url = await getSubmissionFileUrl(submission.storagePath);
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err?.message || 'Orijinal dosya indirilemedi');
    }
  };

  const copyHash = async () => {
    if (!submission.digitalReceipt) return;
    try {
      await navigator.clipboard.writeText(submission.digitalReceipt.sha256);
      toast.success('SHA-256 özeti kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  const handleForwardToInstitute = async () => {
    if (isForwardedToInstitute) {
      toast.info('Bu çalışma zaten Enstitü / Jüri onay havuzuna iletilmiştir.');
      return;
    }
    const confirmed = window.confirm(
      'Bu çalışmayı ve benzerlik analizini resmi onay için Lisansüstü Eğitim Enstitüsü / Jüri havuzuna iletmek istiyor musunuz?'
    );
    if (!confirmed) return;
    setForwarding(true);
    try {
      await forwardSubmissionToInstitute(cls.id, assignment.id, submission.id);
      setIsForwardedToInstitute(true);
      toast.success('Çalışma ve benzerlik raporu Enstitü / Jüri havuzuna resmi olarak iletildi.');
    } catch (err: any) {
      toast.error(err?.message || 'İletim işlemi başarısız oldu.');
    } finally {
      setForwarding(false);
    }
  };

  // Mozaik İntihal (Patchwriting) Dinamik Renklendirmesi
  const renderedMosaicSegments = useMemo(() => {
    const rawText = submission.text || '';
    if (!rawText || activeSources.length === 0) {
      return [{ text: rawText, sourceIndex: -1, sourceUrl: '' }];
    }

    interface MatchOccur {
      start: number;
      end: number;
      sourceIndex: number;
      sourceUrl: string;
    }
    const occurrences: MatchOccur[] = [];

    activeSources.forEach((src) => {
      const originalIdx = sources.findIndex(s => s.url === src.url);
      const needle = (src.matchedText || src.snippet || '').trim();
      if (needle.length < 10) return;

      let pos = 0;
      while (pos < rawText.length) {
        const found = rawText.indexOf(needle, pos);
        if (found === -1) break;
        occurrences.push({
          start: found,
          end: found + needle.length,
          sourceIndex: originalIdx !== -1 ? originalIdx : 0,
          sourceUrl: src.url
        });
        pos = found + needle.length;
      }
    });

    if (occurrences.length === 0) {
      return [{ text: rawText, sourceIndex: -1, sourceUrl: '' }];
    }

    occurrences.sort((a, b) => a.start - b.start);

    const segments: Array<{ text: string; sourceIndex: number; sourceUrl: string }> = [];
    let cur = 0;
    for (const occ of occurrences) {
      if (occ.start > cur) {
        segments.push({ text: rawText.slice(cur, occ.start), sourceIndex: -1, sourceUrl: '' });
      }
      if (occ.end > cur) {
        const segStart = Math.max(cur, occ.start);
        segments.push({ text: rawText.slice(segStart, occ.end), sourceIndex: occ.sourceIndex, sourceUrl: occ.sourceUrl });
        cur = occ.end;
      }
    }
    if (cur < rawText.length) {
      segments.push({ text: rawText.slice(cur), sourceIndex: -1, sourceUrl: '' });
    }
    return segments;
  }, [submission.text, activeSources, sources]);

  const wordCount = submission.text.trim().split(/\s+/).filter(Boolean).length;
  const pageCount = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Üst Menü Barı (Kılavuz Sayfa 7: Üçlü Rapor & Enstitü İletimi) */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{cls.name} · {assignment.title}</p>
            <h2 className="text-lg font-black text-white truncate">{submission.title}</h2>
            <p className="text-[11px] text-gray-500">{submission.studentName} · {submission.studentEmail}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canExclude && (
              <button
                onClick={onRerun}
                disabled={busy}
                title="Skoru yeniden hesapla"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Yeniden Hesapla
              </button>
            )}

            {/* Rapor Tuşu 1: Özet Rapor (Karekodlu Tek Sayfalık Resmi Belge) */}
            <button
              onClick={() => exportInstituteApprovalPDF(cls, assignment, submission, {
                excludeQuotes,
                excludeBibliography,
                excludeMinorPercent,
                minWordMatch,
                netSimilarity,
                referenceScore
              })}
              title="Kılavuz Sayfa 9: 1 Sayfalık Karekodlu Resmi Enstitü / Yayın Etiği Onay Belgesi"
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-400 hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Özet Belge (Enstitü)
            </button>

            {/* Rapor Tuşu 2: İşlenmiş Rapor (Detaylı PDF) */}
            <button
              onClick={() => exportSubmissionReportPDF(cls, assignment, submission)}
              title="Kılavuz Sayfa 7-8: Metin içi alıntıların işaretlendiği tam işlenmiş rapor"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5" /> İşlenmiş Rapor
            </button>

            {/* Rapor Tuşu 3: Orijinal Doküman */}
            <button
              onClick={handleDownloadOriginalFile}
              title="Kılavuz Sayfa 8: Yüklenen orijinal dokümana erişim"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
            >
              <FileUp className="w-3.5 h-3.5" /> Orijinal Doküman
            </button>

            {/* Enstitüye İlet Butonu (Kılavuz Sayfa 8) */}
            {isForwardedToInstitute ? (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> İletildi
              </div>
            ) : (
              <button
                onClick={handleForwardToInstitute}
                disabled={forwarding}
                title="Kılavuz Sayfa 8: Dokümanı lisansüstü enstitü onay havuzuna gönder"
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{forwarding ? 'İletiliyor...' : 'Enstitüye İlet'}</span>
              </button>
            )}

            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Enstitü İletim Durumu Bildirimi */}
          {isForwardedToInstitute && (
            <div className={cn(
              "p-4 border rounded-2xl flex flex-col gap-2 text-xs",
              submission.instituteDecision === 'approved'
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : submission.instituteDecision === 'revision_required'
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : submission.instituteDecision === 'rejected'
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            )}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn(
                    "w-4 h-4 shrink-0",
                    submission.instituteDecision === 'approved' ? "text-emerald-400"
                      : submission.instituteDecision === 'revision_required' ? "text-amber-400"
                      : submission.instituteDecision === 'rejected' ? "text-red-400"
                      : "text-emerald-400"
                  )} />
                  <span className="font-semibold">
                    {submission.instituteDecision === 'approved'
                      ? 'Enstitü / Jüri Kararı: ONAYLANDI (Resmi Yayın Etiği Mührü Verildi)'
                      : submission.instituteDecision === 'revision_required'
                      ? 'Enstitü / Jüri Kararı: REVİZYON VE DÜZELTME İSTENDİ'
                      : submission.instituteDecision === 'rejected'
                      ? 'Enstitü / Jüri Kararı: YAYIN ETİĞİ VE BENZERLİK GEREĞİ REDDEDİLDİ'
                      : 'Bu çalışma resmi inceleme için Lisansüstü Eğitim Enstitüsü / Jüri Havuzuna iletilmiştir.'}
                  </span>
                </div>
                <span className={cn(
                  "text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border",
                  submission.instituteDecision === 'approved' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : submission.instituteDecision === 'revision_required' ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    : submission.instituteDecision === 'rejected' ? "bg-red-500/20 text-red-300 border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {submission.instituteDecision === 'approved' ? 'JÜRİDEN ONAYLI'
                    : submission.instituteDecision === 'revision_required' ? 'REVİZYON'
                    : submission.instituteDecision === 'rejected' ? 'RED'
                    : 'KURUL İNCELEMESİNDE'}
                </span>
              </div>
              {submission.instituteNotes && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-gray-300">
                  <strong className="text-white">Jüri / Kurul Açıklaması:</strong> {submission.instituteNotes}
                </div>
              )}
            </div>
          )}

          {/* Turnitin Standart Bütünlük Bayrakları (Integrity Flags) */}
          {integrity && !integrity.isClean ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      Turnitin Bütünlük Bayrağı (Integrity Flag)
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                        {integrity.totalFlags} Manipülasyon İzi
                      </span>
                    </h4>
                    <p className="text-xs text-rose-200/70">
                      Bu belgede intihal tespit motorlarını atlatmaya yönelik kasıtlı harf ikameleri veya gizli karakterler saptandı.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIntegrityDetails(!showIntegrityDetails)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                >
                  {showIntegrityDetails ? 'Detayları Gizle' : 'Manipülasyonları İncele'}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 border-t border-rose-500/20">
                {integrity.hasHomoglyphs && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    Kiril/Yunan Harf İkamesi: {integrity.homoglyphCount} adet
                  </span>
                )}
                {integrity.hasHiddenChars && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                    Görünmez/Sıfır Genişlikli Karakter: {integrity.hiddenCharCount} adet
                  </span>
                )}
                {integrity.hasHiddenTextPatterns && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    Gizli Stil/HTML Kalıbı: {integrity.hiddenTextPatternCount} adet
                  </span>
                )}
              </div>

              {showIntegrityDetails && (
                <div className="mt-3 p-3 bg-black/40 rounded-xl border border-rose-500/20 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  <p className="text-[11px] font-bold text-rose-300">Tespit Edilen Karakter ve Konum Ayrıntıları:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {integrity.details.map((d, i) => (
                      <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-rose-400 font-bold">{d.codePoint}</span>
                          <span className="text-gray-500 font-mono text-[10px]">Pozisyon: {d.index}</span>
                        </div>
                        {d.word && (
                          <div className="text-gray-200 text-[11px]">
                            Kelime: <span className="font-semibold text-amber-300">"{d.word}"</span>
                          </div>
                        )}
                        <div className="text-gray-400 text-[10px]">
                          {d.description || (d.type === 'homoglyph' ? `'${d.expected}' yerine ikame edilmiş` : 'Gizli manipülasyon')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">
                  Turnitin Bütünlük Doğrulaması: Temiz
                </span>
                <span className="text-[11px] text-gray-500 hidden sm:inline">
                  (Harf ikamesi veya görünmez karakter manipülasyonu bulunamadı)
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                0 Bayrak
              </span>
            </div>
          )}

          {/* 3 Sütunlu Karar Destek Metrik Şeridi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-amber-400" /> Net Benzerlik
                </p>
                {isAnyFilterActive && (
                  <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Filtreli
                  </span>
                )}
              </div>
              <p className={`text-3xl font-black ${scoreColor(netSimilarity)}`}>{pct(netSimilarity)}</p>
              {isAnyFilterActive && (
                <p className="text-[9px] text-gray-500 font-mono mt-1">Ham Oran: {pct(rawSimilarity)}</p>
              )}
              <div className="mt-2.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${scoreBarClass(netSimilarity)} rounded-full transition-all`} style={{ width: `${Math.round(normalizeScore(netSimilarity) * 100)}%` }} />
              </div>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" /> YZ Tespiti
                </p>
                <span className="text-[8px] font-mono text-gray-500 uppercase">AI Olasılığı</span>
              </div>
              <p className={`text-3xl font-black ${scoreColor(submission.aiScore)}`}>{pct(submission.aiScore)}</p>
              <p className="text-[9px] text-gray-500 font-mono mt-1">Plagix AI Modeli</p>
              <div className="mt-2.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${scoreBarClass(submission.aiScore)} rounded-full transition-all`} style={{ width: `${Math.round(normalizeScore(submission.aiScore) * 100)}%` }} />
              </div>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-blue-400" /> Kaynak Doğrulama
                </p>
                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  %{referenceScore}
                </span>
              </div>
              <p className="text-3xl font-black text-white">
                {verifiedReferencesCount} <span className="text-sm font-semibold text-gray-500">/ {totalReferencesCount}</span>
              </p>
              <p className="text-[9px] text-gray-500 font-mono mt-1">Plagix Ref Eşdeğeri</p>
              <div className="mt-2.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${referenceScore}%` }} />
              </div>
            </div>
          </div>

          {/* Dinamik Rapor Filtreleme Motoru (Kılavuz Sayfa 10) */}
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Dinamik Filtreleme Parametreleri</h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono">
                  {activeSources.length} / {sources.length} Aktif Kaynak
                </span>
                {isAnyFilterActive && (
                  <button
                    onClick={() => {
                      setExcludeQuotes(false);
                      setExcludeBibliography(false);
                      setExcludeMinorPercent(false);
                      setMinWordMatch(0);
                    }}
                    className="text-[9px] text-amber-400 hover:underline font-mono"
                  >
                    Filtreleri Sıfırla
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-all">
                <input
                  type="checkbox"
                  checked={excludeQuotes}
                  onChange={(e) => setExcludeQuotes(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span className="text-[10px] font-bold text-gray-300">Alıntıları Çıkar ("...")</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-all">
                <input
                  type="checkbox"
                  checked={excludeBibliography}
                  onChange={(e) => setExcludeBibliography(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span className="text-[10px] font-bold text-gray-300">Kaynakçayı Çıkar</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.05] transition-all">
                <input
                  type="checkbox"
                  checked={excludeMinorPercent}
                  onChange={(e) => setExcludeMinorPercent(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded"
                />
                <span className="text-[10px] font-bold text-gray-300">%1 Altı Mikro Gizle</span>
              </label>

              <div className="relative">
                <div className="flex items-center justify-between gap-1 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] font-bold text-gray-300 pl-1 shrink-0">Kelime Eşiği:</span>
                  <button
                    type="button"
                    onClick={() => setIsWordThresholdOpen(!isWordThresholdOpen)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 hover:border-emerald-500/40 text-[10px] font-mono text-emerald-400 transition-all"
                  >
                    <span>{minWordMatch === 0 ? 'Yok' : `> ${minWordMatch} kelime`}</span>
                    <ChevronDown className={cn("w-3 h-3 text-emerald-400 transition-transform duration-200", isWordThresholdOpen && "rotate-180")} />
                  </button>
                </div>

                {isWordThresholdOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsWordThresholdOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-36 bg-[#0f141a] border border-white/15 rounded-xl shadow-2xl p-1 z-50 backdrop-blur-xl">
                      {[
                        { val: 0, label: 'Yok' },
                        { val: 5, label: '> 5 kelime' },
                        { val: 8, label: '> 8 kelime' },
                        { val: 10, label: '> 10 kelime' },
                        { val: 15, label: '> 15 kelime' }
                      ].map((opt) => {
                        const isSelected = minWordMatch === opt.val;
                        return (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => {
                              setMinWordMatch(opt.val);
                              setIsWordThresholdOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-mono flex items-center justify-between transition-colors",
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dijital Makbuz */}
          {submission.digitalReceipt && (
            <div className="p-3.5 bg-emerald-500/[0.05] border border-emerald-500/15 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Dijital Makbuz (SHA-256)</p>
                  <button onClick={copyHash} className="group flex items-center gap-2 mt-0.5" title="Kopyala">
                    <span className="text-xs font-mono text-gray-300 break-all">{submission.digitalReceipt.sha256.slice(0, 36)}...</span>
                    <Copy className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-gray-500 font-mono text-right">
                {wordCount} kelime · ~{pageCount} sayfa · {fmtDateTime(submission.digitalReceipt.submittedAt)}
              </div>
            </div>
          )}

          {/* Eğitmen Notlandırma ve Geri Bildirim Bölümü */}
          {canExclude && onSaveGrade && (
            <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Akademik Notlandırma &amp; Değerlendirme</h3>
                </div>
                {submission.gradedAt && (
                  <span className="text-[10px] text-gray-500 font-mono">Son: {fmtDateTime(submission.gradedAt)}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Not (0 - 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    placeholder="Örn: 85"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Eğitmen Notu</label>
                  <textarea
                    rows={2}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Öğrenciye iletilecek akademik değerlendirme notu..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider self-center mr-1">Hızlı Rubrik:</span>
                    {[
                      'Mükemmel Akademik Dürüstlük',
                      'Kaynakça Formatı Gözden Geçirilmeli',
                      'Doğrudan Alıntılarda Tırnak İşareti Eksik',
                      'Özgünlük Yetersiz — Revizyon Gerekli'
                    ].map((rubricText) => (
                      <button
                        key={rubricText}
                        type="button"
                        onClick={() => setFeedbackInput(prev => prev ? `${prev} | ${rubricText}` : rubricText)}
                        className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-gray-400 hover:text-white transition-all"
                      >
                        + {rubricText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveGradeClick}
                  disabled={savingGrade}
                  className="px-4 py-2 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {savingGrade ? 'Kaydediliyor...' : 'Değerlendirmeyi Kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* Görünüm Sekmeleri: Eşleşen Kaynaklar vs Mozaik İntihal (Kılavuz Sayfa 9-10) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewTab('sources')}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    viewTab === 'sources'
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" /> Eşleşen Kaynaklar ({sources.length})
                </button>

                <button
                  onClick={() => setViewTab('mosaic')}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    viewTab === 'mosaic'
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Highlighter className="w-3.5 h-3.5" /> İşlenmiş Metin (Mozaik İntihal)
                </button>
              </div>

              {viewTab === 'sources' && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 font-bold">Sıralama:</span>
                  <div className="flex bg-white/5 border border-white/5 rounded-lg p-0.5 text-[9px] font-mono">
                    <button
                      onClick={() => setSortOrder('desc')}
                      className={cn("px-2 py-0.5 rounded transition-all", sortOrder === 'desc' ? "bg-white/10 text-white font-bold" : "text-gray-500 hover:text-gray-300")}
                      title="Orana Göre Azalan"
                    >
                      % ↓
                    </button>
                    <button
                      onClick={() => setSortOrder('asc')}
                      className={cn("px-2 py-0.5 rounded transition-all", sortOrder === 'asc' ? "bg-white/10 text-white font-bold" : "text-gray-500 hover:text-gray-300")}
                      title="Orana Göre Artan"
                    >
                      % ↑
                    </button>
                    <button
                      onClick={() => setSortOrder('alpha')}
                      className={cn("px-2 py-0.5 rounded transition-all", sortOrder === 'alpha' ? "bg-white/10 text-white font-bold" : "text-gray-500 hover:text-gray-300")}
                      title="A-Z Sıralı"
                    >
                      A-Z
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* TAB 1: İŞLENMİŞ METİN & MOZAİK İNTİHAL GÖRÜNÜMÜ (Kılavuz Sayfa 9-10) */}
            {viewTab === 'mosaic' && (
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-2">
                    <Highlighter className="w-3.5 h-3.5 text-amber-400" />
                    <span>Her kaynak farklı bir renkle işaretlenmiştir. Çıkarılan kaynakların boyaması otomatik kalkar.</span>
                  </span>
                  <span className="font-mono text-[10px] text-gray-500">{activeSources.length} Aktif Kaynak</span>
                </div>

                <div className="p-5 bg-black/40 border border-white/5 rounded-2xl text-xs leading-relaxed text-gray-300 max-h-96 overflow-y-auto whitespace-pre-wrap font-serif select-text custom-scrollbar">
                  {renderedMosaicSegments.map((seg, sIdx) => {
                    if (seg.sourceIndex === -1) {
                      return <span key={sIdx}>{seg.text}</span>;
                    }
                    const palette = MOSAIC_PALETTE[seg.sourceIndex % MOSAIC_PALETTE.length];
                    return (
                      <mark
                        key={sIdx}
                        className={cn(
                          "px-1 py-0.5 rounded border font-sans font-medium transition-all inline cursor-pointer",
                          palette.bg,
                          palette.text,
                          palette.border
                        )}
                        title={`Kaynak [${seg.sourceIndex + 1}]: ${seg.sourceUrl}`}
                      >
                        <sup className="font-mono font-bold mr-0.5 text-[9px]">[{seg.sourceIndex + 1}]</sup>
                        {seg.text}
                      </mark>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: EŞLEŞEN KAYNAKLAR (Kılavuz Sayfa 10: Çıkar / Ekle tuşları) */}
            {viewTab === 'sources' && (
              <div className="space-y-3">
                {sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 py-1">
                    <button
                      onClick={() => setMatchFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${matchFilter === 'all' ? 'bg-white/10 text-white font-black' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Tümü ({sources.length})
                    </button>
                    {['not_cited_or_quoted', 'missing_quotations', 'missing_citation', 'cited_and_quoted'].map((mg) => {
                      const count = sources.filter(s => s.matchGroup === mg).length;
                      if (count === 0) return null;
                      const conf = matchGroupBadge[mg];
                      return (
                        <button
                          key={mg}
                          onClick={() => setMatchFilter(mg)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1 ${matchFilter === mg ? `${conf.cls} font-black` : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200'}`}
                        >
                          <span>{conf.icon}</span>
                          <span>{conf.label}</span>
                          <span className="opacity-60 font-mono">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {sources.length === 0 ? (
                  <div className="py-10 border border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-sm text-gray-500 font-bold">Eşleşen kaynak bulunamadı.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sources
                      .filter((s) => {
                        if (matchFilter === 'all') return true;
                        if (matchFilter === 'repository') return s.url.startsWith('internal://');
                        return s.matchGroup === matchFilter;
                      })
                      .sort((a, b) => {
                        if (sortOrder === 'desc') return (b.similarity || 0) - (a.similarity || 0);
                        if (sortOrder === 'asc') return (a.similarity || 0) - (b.similarity || 0);
                        return (a.title || a.url).localeCompare(b.title || b.url, 'tr');
                      })
                      .map((s) => {
                        const originalIdx = sources.findIndex(src => src.url === s.url);
                        const palette = MOSAIC_PALETTE[originalIdx % MOSAIC_PALETTE.length];
                        const isExcluded = excluded.has(s.url);
                        const filterStatus = getSourceFilterStatus(s);
                        const isEffectivelyExcluded = isExcluded || filterStatus.isFiltered;
                        const isInternal = s.url.startsWith('internal://repository/');
                        const isVector = s.url.startsWith('internal://vector/');
                        const mg = matchGroupBadge[s.matchGroup] || { label: s.matchGroup, cls: 'bg-white/5 text-gray-400 border-white/10', icon: '📄' };

                        return (
                          <div
                            key={s.url}
                            className={`p-4 bg-white/[0.03] border rounded-2xl transition-all ${isEffectivelyExcluded ? 'border-white/5 opacity-50 bg-black/40' : 'border-white/5'}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Mozaik Renk Şeridi & Numarası */}
                              <div className={cn("px-2 py-1 rounded-lg border font-mono font-black text-xs shrink-0 flex items-center justify-center", palette.badge, isEffectivelyExcluded && "opacity-40")}>
                                #{originalIdx + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isVector ? (
                                    <span className={cn("text-sm font-bold text-purple-400 flex items-center gap-1.5 truncate max-w-[420px]", isEffectivelyExcluded && "line-through opacity-70")}>
                                      <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                      {s.title || 'Semantik Vektör Eşleşmesi'}
                                    </span>
                                  ) : isInternal ? (
                                    <span className={cn("text-sm font-bold text-indigo-400 flex items-center gap-1.5 truncate max-w-[420px]", isEffectivelyExcluded && "line-through opacity-70")}>
                                      <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      {s.title || 'Sınıf İçi Teslim Deposu'}
                                    </span>
                                  ) : (
                                    <a href={s.url} target="_blank" rel="noreferrer" className={cn("text-sm font-bold text-blue-400 hover:text-blue-300 truncate max-w-[420px] flex items-center gap-1", isEffectivelyExcluded && "line-through opacity-70")}>
                                      <span>{s.title || s.url}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                    </a>
                                  )}

                                  {s.similarity !== undefined && (
                                    <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                      %{Math.round(s.similarity * 100)} Benzerlik
                                    </span>
                                  )}

                                  {filterStatus.isFiltered && (
                                    <span className="text-[8px] font-mono font-black uppercase text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                      {filterStatus.reason}
                                    </span>
                                  )}

                                  {s.trust && (
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                      Güven: {trustLabel[s.trust] || s.trust}
                                    </span>
                                  )}

                                  {s.matchGroup && (
                                    <span className={`text-[8px] font-black uppercase tracking-wider border px-1.5 py-0.5 rounded flex items-center gap-1 ${mg.cls}`}>
                                      <span>{mg.icon}</span>
                                      <span>{mg.label}</span>
                                    </span>
                                  )}
                                </div>

                                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{s.snippet || s.matchedText || ''}</p>
                                <p className="text-[10px] text-gray-600 mt-1 truncate">
                                  {isVector ? 'Geçmiş Proje Vektör Benzerliği' : isInternal ? 'Sınıf Deposu Parmak İzi Karşılaştırması' : s.url}
                                </p>
                              </div>

                              {/* Kılavuz Sayfa 10: Çıkar / Ekle Butonu */}
                              {canExclude && (
                                <button
                                  type="button"
                                  onClick={() => onToggleExclude(s.url, !isExcluded)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all shrink-0",
                                    isExcluded
                                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                                  )}
                                >
                                  {isExcluded ? 'Ekle' : 'Çıkar'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

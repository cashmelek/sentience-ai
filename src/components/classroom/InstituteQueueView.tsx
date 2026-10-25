import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileText,
  User,
  GraduationCap,
  RefreshCw,
  Search,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import type { InstituteQueueItem } from '../../services/classroomService';
import { setInstituteDecision } from '../../services/classroomService';
import { fmtDateTime, scoreColor, pct } from './format';
import { toast } from 'sonner';

interface InstituteQueueViewProps {
  items: InstituteQueueItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenReport: (item: InstituteQueueItem) => void;
  reviewerName: string;
}

export function InstituteQueueView({
  items,
  loading,
  onRefresh,
  onOpenReport,
  reviewerName
}: InstituteQueueViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revision' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [decisionModalItem, setDecisionModalItem] = useState<InstituteQueueItem | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<'approved' | 'revision_required' | 'rejected'>('approved');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredItems = items
    .filter(item => {
      const decision = item.submission.instituteDecision || 'pending';
      if (filter === 'pending') return decision === 'pending';
      if (filter === 'approved') return decision === 'approved';
      if (filter === 'revision') return decision === 'revision_required';
      if (filter === 'rejected') return decision === 'rejected';
      return true;
    })
    .filter(item => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.submission.title.toLowerCase().includes(q) ||
        item.submission.studentName.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q) ||
        item.assignmentTitle.toLowerCase().includes(q)
      );
    });

  const handleApplyDecision = async () => {
    if (!decisionModalItem) return;
    setSubmitting(true);
    try {
      await setInstituteDecision(
        decisionModalItem.classId,
        decisionModalItem.assignmentId,
        decisionModalItem.submission.studentId,
        selectedDecision,
        notes,
        reviewerName
      );
      toast.success(
        selectedDecision === 'approved'
          ? 'Çalışma resmi jüriden onaylandı ve mühürlendi.'
          : selectedDecision === 'revision_required'
          ? 'Öğrenciye düzeltme ve revizyon talebi iletildi.'
          : 'Çalışma yayın etiği gerekçesiyle reddedildi.'
      );
      setDecisionModalItem(null);
      setNotes('');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Karar işlenirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Üst Başlık & Arama */}
      <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Lisansüstü Eğitim Enstitüsü &amp; Jüri Onay Havuzu</h4>
            <p className="text-[10px] text-gray-500 font-mono">Resmi onay ve yayın etiği incelemesine iletilen lisansüstü tez ve ödevler</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tez, öğrenci veya sınıf ara..."
              className="bg-black/30 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all disabled:opacity-40"
            title="Havuzu Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Durum Filtre Butonları */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'all', label: `Tümü (${items.length})` },
          { key: 'pending', label: `İnceleme Bekleyenler (${items.filter(i => (i.submission.instituteDecision || 'pending') === 'pending').length})` },
          { key: 'approved', label: `Onaylananlar (${items.filter(i => i.submission.instituteDecision === 'approved').length})` },
          { key: 'revision', label: `Revizyon İstenenler (${items.filter(i => i.submission.instituteDecision === 'revision_required').length})` },
          { key: 'rejected', label: `Reddedilenler (${items.filter(i => i.submission.instituteDecision === 'rejected').length})` },
        ].map(b => (
          <button
            key={b.key}
            onClick={() => setFilter(b.key as any)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              filter === b.key
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-xs font-mono">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
          Enstitü havuzu taranıyor...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 border border-dashed border-white/10 rounded-3xl text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-gray-400">Bu filtrede enstitüye iletilen çalışma bulunmuyor.</p>
          <p className="text-[11px] text-gray-600">Öğrenciler ve araştırmacılar benzerlik raporundaki "Enstitüye İlet" butonuna bastığında çalışmalar bu havuzda toplanır.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map(item => {
            const decision = item.submission.instituteDecision || 'pending';
            return (
              <div
                key={`${item.classId}-${item.assignmentId}-${item.submission.id}`}
                className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl transition-all flex items-center justify-between flex-wrap gap-3"
              >
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {item.className} · {item.assignmentTitle}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      İletim: {fmtDateTime(item.submission.forwardedToInstituteAt)}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-white mt-1">{item.submission.title}</h5>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-gray-300">
                      <User className="w-3 h-3 text-gray-500" /> {item.submission.studentName} ({item.submission.studentEmail})
                    </span>
                    <span className="font-mono">
                      Benzerlik: <strong className={scoreColor(item.submission.similarityScore)}>{pct(item.submission.similarityScore)}</strong>
                    </span>
                    <span className="font-mono">
                      YZ: <strong className="text-purple-400">{pct(item.submission.aiScore)}</strong>
                    </span>
                  </div>

                  {item.submission.instituteNotes && (
                    <p className="text-[10px] text-gray-400 bg-black/30 p-2 rounded-lg mt-2 border border-white/5 font-mono">
                      <strong className="text-white">Jüri Notu:</strong> {item.submission.instituteNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Durum Rozeti */}
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                    decision === 'approved'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : decision === 'revision_required'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : decision === 'rejected'
                      ? 'bg-red-500/15 text-red-400 border-red-500/30'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  }`}>
                    {decision === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {decision === 'revision_required' && <AlertTriangle className="w-3 h-3" />}
                    {decision === 'rejected' && <XCircle className="w-3 h-3" />}
                    {decision === 'pending' && <Clock className="w-3 h-3" />}
                    <span>
                      {decision === 'approved' ? 'Onaylandı'
                        : decision === 'revision_required' ? 'Revizyon'
                        : decision === 'rejected' ? 'Reddedildi'
                        : 'İnceleme Bekliyor'}
                    </span>
                  </span>

                  {/* Raporu İncele */}
                  <button
                    onClick={() => onOpenReport(item)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Raporu Aç</span>
                  </button>

                  {/* Jüri Kararı Ver */}
                  <button
                    onClick={() => {
                      setDecisionModalItem(item);
                      setSelectedDecision(
                        item.submission.instituteDecision && item.submission.instituteDecision !== 'pending'
                          ? item.submission.instituteDecision
                          : 'approved'
                      );
                      setNotes(item.submission.instituteNotes || '');
                    }}
                    className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Karar Ver</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jüri Kararı Verme Modalı */}
      {decisionModalItem && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDecisionModalItem(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white">Lisansüstü Jüri &amp; Enstitü Kararı</h3>
              </div>
              <button onClick={() => setDecisionModalItem(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 text-xs">
              <p className="text-gray-400"><strong className="text-white">Belge:</strong> {decisionModalItem.submission.title}</p>
              <p className="text-gray-400"><strong className="text-white">Öğrenci:</strong> {decisionModalItem.submission.studentName} ({decisionModalItem.submission.studentEmail})</p>
              <p className="text-gray-400"><strong className="text-white">Ders / Sınıf:</strong> {decisionModalItem.className}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Karar Türü</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDecision('approved')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedDecision === 'approved'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                  <div className="text-xs">Onayla</div>
                  <div className="text-[9px] opacity-70">Yayın Mührü Ver</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('revision_required')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedDecision === 'revision_required'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <div className="text-xs">Düzeltme</div>
                  <div className="text-[9px] opacity-70">Revizyon İste</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('rejected')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedDecision === 'rejected'
                      ? 'bg-red-500/20 border-red-500 text-red-300 font-black'
                      : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <XCircle className="w-5 h-5 mx-auto mb-1 text-red-400" />
                  <div className="text-xs">Reddet</div>
                  <div className="text-[9px] opacity-70">Etiğe Aykırı</div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Jüri / Kurul Açıklama &amp; Gerekçe Notu</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Örn: Yapılan kaynakça denetimi ve %10 benzerlik oranı enstitü standartlarına uygundur..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModalItem(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleApplyDecision}
                className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {submitting ? 'İşleniyor...' : 'Kararı Onayla & Sisteme İşle'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

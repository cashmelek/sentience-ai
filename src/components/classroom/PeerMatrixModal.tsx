import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, X, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Assignment, ClassRoom, Submission } from '../../types/classroom';
import { cn } from '../../lib/utils';
import { scoreColor, pct } from './format';

interface PeerMatrixModalProps {
  cls: ClassRoom;
  assignment: Assignment;
  submissions: Submission[];
  onClose: () => void;
  onOpenReport: (s: Submission) => void;
}

// 4-gram tabanlı shingle benzerlik hesabı (Jaccard Similarity)
function computeJaccardSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;
  const wordsA = textA.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '').split(/\s+/).filter(Boolean);
  const wordsB = textB.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/g, '').split(/\s+/).filter(Boolean);

  if (wordsA.length < 5 || wordsB.length < 5) return 0;

  const shinglesA = new Set<string>();
  for (let i = 0; i <= wordsA.length - 4; i++) {
    shinglesA.add(wordsA.slice(i, i + 4).join(' '));
  }

  const shinglesB = new Set<string>();
  for (let i = 0; i <= wordsB.length - 4; i++) {
    shinglesB.add(wordsB.slice(i, i + 4).join(' '));
  }

  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;

  let intersection = 0;
  shinglesA.forEach((shingle) => {
    if (shinglesB.has(shingle)) intersection++;
  });

  const union = shinglesA.size + shinglesB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function PeerMatrixModal({
  cls,
  assignment,
  submissions,
  onClose,
  onOpenReport,
}: PeerMatrixModalProps) {
  const [selectedPair, setSelectedPair] = useState<{ subA: Submission; subB: Submission; score: number } | null>(null);

  // Sınıf içi tüm teslim çiftlerinin çapraz benzerlik matrisi
  const matrixData = useMemo(() => {
    const list = submissions.filter((s) => s.text && s.text.trim().length > 30);
    const pairs: { subA: Submission; subB: Submission; score: number }[] = [];

    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const score = computeJaccardSimilarity(list[i].text, list[j].text);
        if (score > 0.05) { // %5 ve üzeri benzerlikleri listele
          pairs.push({
            subA: list[i],
            subB: list[j],
            score,
          });
        }
      }
    }

    pairs.sort((a, b) => b.score - a.score);
    return { list, pairs };
  }, [submissions]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3">
            <Users className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-1">Sınıf İçi Eş-Düzey (Peer-to-Peer) Kopya Matrisi</h2>
          <p className="text-xs text-gray-400">
            {cls.name} &bull; {assignment.title} için aynı sınıftaki öğrencilerin birbirleri arasındaki iç metin benzerliği analiz edilir.
          </p>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Taranan Teslim</span>
            <span className="text-lg font-black text-white">{matrixData.list.length}</span>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Kritik Eşleşme (&gt;%20)</span>
            <span className="text-lg font-black text-rose-400">
              {matrixData.pairs.filter((p) => p.score >= 0.2).length}
            </span>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center">
            <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Şüpheli Çift (&gt;%5)</span>
            <span className="text-lg font-black text-amber-400">{matrixData.pairs.length}</span>
          </div>
        </div>

        {/* Eşleşen Çiftler Listesi */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-[180px] max-h-[320px]">
          {matrixData.pairs.length === 0 ? (
            <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-gray-300 font-bold">Sınıf içi şüpheli eşleşme bulunamadı.</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Öğrencilerin teslimleri birbirlerinden bağımsız ve özgün görünüyor.</p>
            </div>
          ) : (
            matrixData.pairs.map((pair, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs",
                  pair.score >= 0.2
                    ? "bg-rose-500/[0.04] border-rose-500/20"
                    : "bg-white/[0.03] border-white/5"
                )}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{pair.subA.studentName}</p>
                    <p className="text-[10px] text-gray-500 truncate">{pair.subA.title}</p>
                  </div>

                  <span className="text-gray-500 shrink-0 font-mono text-[10px]">&harr;</span>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{pair.subB.studentName}</p>
                    <p className="text-[10px] text-gray-500 truncate">{pair.subB.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className={cn("text-sm font-black font-mono block", scoreColor(pair.score))}>
                      {pct(pair.score)}
                    </span>
                    <span className="text-[9px] text-gray-500">İç Benzerlik</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReport(pair.subA);
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-all"
                    title="A Raporunu Aç"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
          <span className="text-[10px] text-gray-500">
            * 4-gram shingle jaccard algoritması ile hesaplanmıştır.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
}

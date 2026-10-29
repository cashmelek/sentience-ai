import { useMemo, useState, type ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, FileUp, Loader2, ShieldCheck, UploadCloud, X, Sparkles, CheckCircle2, Lock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import type { AppUser } from '../../types';
import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { SUBMISSION_LIMITS } from '../../types/classroom';
import {
  submitText, scoreSubmission, markSubmissionFailed,
  checkSubmissionQuota, todayIso, uploadSubmissionFile
} from '../../services/classroomService';
import { parseDocumentFile } from '../../services/fileParseService';
import { fmtDate } from './format';
import { SocraticCoachModal } from './SocraticCoachModal';
import { useWritingTelemetry } from '../../hooks/useWritingTelemetry';

interface StudentSubmitViewProps {
  cls: ClassRoom;
  assignment: Assignment;
  appUser: AppUser;
  scoringConfig: { sentinelEnabled: boolean; auditorModel: string; sensitivity: number };
  existingSubmission?: Submission | null;
  onBack: () => void;
  onDone: (submission: Submission) => void;
}

type Phase = 'edit' | 'submitting' | 'scoring';

export function StudentSubmitView({
  cls,
  assignment,
  appUser,
  scoringConfig,
  existingSubmission,
  onBack,
  onDone,
}: StudentSubmitViewProps) {
  const [title, setTitle] = useState(existingSubmission?.title || `${assignment.title} - Teslim`);
  const [text, setText] = useState(existingSubmission?.text || '');
  const [phase, setPhase] = useState<Phase>('edit');
  // B21 Faz 2: dosya yükleme modu (PDF/DOCX). Varsayılan 'text' — mevcut davranış korunur
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [noRepositoryOverride, setNoRepositoryOverride] = useState(Boolean(assignment.noRepository));

  // Ön Teslim Taslak Kontrolü (Turnitin Draft Coach) State'leri
  const [draftChecking, setDraftChecking] = useState(false);
  const [draftResult, setDraftResult] = useState<{ similarityScore: number; aiScore: number } | null>(
    existingSubmission?.lastDraftScores ? {
      similarityScore: existingSubmission.lastDraftScores.similarityScore,
      aiScore: existingSubmission.lastDraftScores.aiScore,
    } : null
  );
  const [draftCount, setDraftCount] = useState<number>(existingSubmission?.draftCheckCount || 0);
  const [showSocraticCoach, setShowSocraticCoach] = useState(false);
  const { handleKeyDown, handlePaste, getTelemetry } = useWritingTelemetry();
  const maxDrafts = assignment.maxDraftChecks ?? 2;
  const isDraftAllowed = assignment.allowDraftCheck !== false;
  const remainingDrafts = Math.max(0, maxDrafts - draftCount);

  const today = todayIso();
  const usedToday = appUser.submissionResetDate === today ? (appUser.submissionUsage || 0) : 0;
  const quota = useMemo(() => checkSubmissionQuota(appUser.plan, usedToday), [appUser.plan, usedToday]);
  const planLimit = SUBMISSION_LIMITS[appUser.plan] ?? SUBMISSION_LIMITS.free;

  const canSubmit =
    title.trim().length > 0 &&
    text.trim().length >= 50 &&
    phase === 'edit' &&
    !parsing &&
    quota.allowed &&
    (mode === 'text' || (mode === 'file' && !!file));

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = ''; // aynı dosyanın yeniden seçilebilmesi için
    if (!selected) return;
    setParsing(true);
    try {
      const parsed = await parseDocumentFile(selected);
      setFile(selected);
      setText(parsed.text);
      toast.success(`${parsed.fileName} okundu (${parsed.pageCount ? `${parsed.pageCount} sayfa, ` : ''}${parsed.text.length} karakter)`);
    } catch (err: any) {
      setFile(null);
      toast.error(err?.message || 'Dosya okunamadı');
    } finally {
      setParsing(false);
    }
  };

  const handleRunDraftCheck = async () => {
    if (!text.trim() || text.trim().length < 50) {
      toast.error('Taslak kontrolü için en az 50 karakter metin girmelisiniz.');
      return;
    }
    if (remainingDrafts <= 0) {
      toast.error('Bu ödev için tanımlanan ön taslak kontrol haklarınız doldu.');
      return;
    }
    setDraftChecking(true);
    try {
      // Taslak kontrolü repository'e kaydetmeden doğrudan hafif skorlama çalıştırır
      const scores = await scoreSubmission(
        { text: text.trim(), ...scoringConfig },
        { classId: cls.id, assignmentId: assignment.id, studentId: appUser.uid }
      );
      const nextCount = draftCount + 1;
      setDraftCount(nextCount);
      setDraftResult({
        similarityScore: scores.similarityScore,
        aiScore: scores.aiScore
      });
      toast.success(`Taslak kontrolü tamamlandı! Kalan hak: ${Math.max(0, maxDrafts - nextCount)}`);
    } catch (err: any) {
      toast.error(err?.message || 'Taslak kontrolü sırasında hata oluştu.');
    } finally {
      setDraftChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase('submitting');
    try {
      // Dosya önce Storage'a yüklenir; yazma başarısızsa Firestore dokümanı hiç oluşmaz
      let fileMeta: { fileName: string; storagePath: string } | undefined;
      if (mode === 'file' && file) {
        fileMeta = await uploadSubmissionFile(appUser.uid, cls.id, assignment.id, file);
      }
      const telemetry = getTelemetry(text.trim().length, mode);
      const submission = await submitText(appUser, cls.id, assignment.id, {
        title,
        text: text.trim(),
        file: fileMeta,
        noRepository: noRepositoryOverride,
        telemetry
      });
      setPhase('scoring');
      toast.success('Teslim alındı, skorlar hesaplanıyor...');
      try {
        // B21 Faz 2: skor sunucuda hesaplanır (scoreSubmission CF); CF yoksa istemci yedeği devreye girer
        const scores = await scoreSubmission(
          { text: text.trim(), ...scoringConfig },
          { classId: cls.id, assignmentId: assignment.id, studentId: appUser.uid }
        );
        onDone({ ...submission, ...scores, status: 'scored' });
      } catch (err) {
        console.error(err);
        await markSubmissionFailed(cls.id, assignment.id, appUser.uid).catch(() => {});
        toast.warning('Teslim alındı ancak skorlama sırasında hata oluştu; eğitmen yeniden hesaplayabilir.');
        onDone(submission);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Teslim başarısız');
      setPhase('edit');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} disabled={phase !== 'edit'} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all disabled:opacity-40">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{cls.name} • {cls.instructorName || 'Akademisyen'}</p>
          <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{assignment.title}</h3>
          <p className="text-xs text-gray-500">Son teslim: <span className="text-amber-500 font-bold">{fmtDate(assignment.dueDate)}</span></p>
        </div>
      </div>

      {/* Sıkı Akademik İzolasyon & Sokratik Koç Bandı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white uppercase tracking-tight">Akademik Bütünlük Modu Aktif</span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">Kilitli</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Bu teslimat alanında sentetik insanlaştırma araçları kapalıdır. Metin kaliteniz için Sokratik danışmanlığı kullanabilirsiniz.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSocraticCoach(true)}
          disabled={text.trim().length < 30}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5" /> Sokratik Koç
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 p-4 bg-blue-500/[0.06] border border-blue-500/10 rounded-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-xs text-gray-300">
            Teslim ettiğiniz metin için <span className="font-bold text-white">SHA-256 dijital makbuz</span> oluşturulur.
            {!assignment.noRepository && ' Bu ödevde teslimler sınıf deposunda saklanır.'}
          </p>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${quota.remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          Kota: {Math.max(0, quota.remaining)}/{planLimit}
        </span>
      </div>

      {!quota.allowed && (
        <div className="p-4 bg-red-500/[0.06] border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold">
          Günlük teslim kotanız doldu. Limit yarın sıfırlanır veya planınızı yükseltebilirsiniz.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Teslim Başlığı</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={phase !== 'edit'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all disabled:opacity-60"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setMode('text')}
            disabled={phase !== 'edit'}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${mode === 'text' ? 'bg-blue-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Metin Yapıştır
          </button>
          <button
            type="button"
            onClick={() => setMode('file')}
            disabled={phase !== 'edit'}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${mode === 'file' ? 'bg-blue-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Dosya Yükle (PDF/DOCX)
          </button>
        </div>
        {mode === 'file' && (
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-dashed border-white/15 rounded-xl">
            <FileUp className="w-5 h-5 text-blue-400 shrink-0" />
            {file ? (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {text.trim().length} karakter çıkarıldı
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={phase !== 'edit'}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 transition-all disabled:opacity-40"
                  title="Dosyayı kaldır"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <label className="flex-1 cursor-pointer">
                <span className="text-xs text-gray-400">
                  {parsing ? 'Dosya okunuyor...' : 'PDF veya DOCX seçin (en fazla 20 MB)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  disabled={parsing || phase !== 'edit'}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {mode === 'file' ? 'Dosyadan Çıkarılan Metin' : 'Metniniz'}
            </label>
            <span className="text-[10px] font-bold text-gray-600">{text.trim().length} karakter (min. 50)</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={phase !== 'edit'}
            rows={14}
            placeholder={mode === 'file' ? 'Dosya seçildiğinde çıkarılan metin burada görünür; düzenleyebilirsiniz...' : 'Ödev metninizi buraya yapıştırın...'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all resize-y disabled:opacity-60 custom-scrollbar"
          />
        </div>

        {/* Ön Teslim Taslak Kontrolü (Turnitin Draft Coach) Kutusu */}
        {isDraftAllowed && (
          <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Ön Teslim Taslak Kontrolü (Draft Coach)</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Kalan Hak: {remainingDrafts} / {maxDrafts}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunDraftCheck}
                disabled={draftChecking || remainingDrafts <= 0 || text.trim().length < 50 || phase !== 'edit'}
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center gap-1.5"
              >
                {draftChecking ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Taslak Taranıyor...</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> Taslağı Şimdi Kontrol Et</>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              Nihai teslimi yapmadan önce taslağınızı ön kontrolden geçirebilirsiniz. Bu işlem metninizi havuza kaydetmez ve resmi teslim sayılmaz.
            </p>

            {draftResult && (
              <div className="p-3 bg-black/40 border border-emerald-500/20 rounded-xl flex items-center justify-around text-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Taslak Benzerlik</span>
                  <span className="text-sm font-black text-amber-400">
                    %{Math.round((draftResult.similarityScore > 1 ? draftResult.similarityScore : draftResult.similarityScore * 100))}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 block">Taslak YZ Skoru</span>
                  <span className="text-sm font-black text-purple-400">
                    %{Math.round((draftResult.aiScore > 1 ? draftResult.aiScore : draftResult.aiScore * 100))}
                  </span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-right">
                  <span className="text-[9px] text-emerald-400 font-bold block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Ön Tarama Hazır
                  </span>
                  <span className="text-[8px] text-gray-500">Gerekiyorsa alıntıları düzeltin</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Ön Değerlendirme Modu (Havuza Kaydetme)</span>
            </div>
            <p className="text-[10px] text-gray-500">
              İşaretlendiğinde metin kurum/sınıf havuzuna kaydedilmez; gelecekteki nihai tesliminizle öz-intihal çakışması oluşturmaz.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={noRepositoryOverride}
              onChange={e => setNoRepositoryOverride(e.target.checked)}
              disabled={phase !== 'edit'}
              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
            />
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 text-black font-black rounded-xl hover:bg-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
        >
          {phase === 'edit' && (<><UploadCloud className="w-4 h-4" /> Teslim Et ve Skorla</>)}
          {phase === 'submitting' && (<><Loader2 className="w-4 h-4 animate-spin" /> Teslim Alınıyor...</>)}
          {phase === 'scoring' && (<><Loader2 className="w-4 h-4 animate-spin" /> Benzerlik + YZ Skoru Hesaplanıyor...</>)}
        </button>

        {phase === 'scoring' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[11px] text-gray-500">
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            Bu işlem web araması içerdiği için birkaç dakika sürebilir; sayfayı kapatmayın.
          </motion.p>
        )}
      </div>

      <SocraticCoachModal
        isOpen={showSocraticCoach}
        onClose={() => setShowSocraticCoach(false)}
        text={text}
      />
    </div>
  );
}

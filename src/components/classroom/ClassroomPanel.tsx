import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { GraduationCap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import type { AppUser } from '../../types';
import type { ClassRoom, Assignment, Enrollment, Submission } from '../../types/classroom';
import * as svc from '../../services/classroomService';
import { KvkkConsentModal } from './KvkkConsentModal';
import { ClassFormModal } from './ClassFormModal';
import { JoinClassModal } from './JoinClassModal';
import { AssignmentForm } from './AssignmentForm';
import { InstructorClassesView } from './InstructorClassesView';
import { InstructorClassDetail } from './InstructorClassDetail';
import { AssignmentDetailView } from './AssignmentDetailView';
import { StudentClassView } from './StudentClassView';
import { StudentSubmitView } from './StudentSubmitView';
import { SubmissionReportView } from './SubmissionReportView';
import { OnBehalfSubmitModal } from './OnBehalfSubmitModal';
import { exportSubmissionsCSV, exportSubmissionsExcel } from './submissionExport';

export interface ClassroomPanelProps {
  appUser: AppUser;
  scoringConfig: { sentinelEnabled: boolean; auditorModel: string; sensitivity: number };
  onClose: () => void;
}

type View =
  | { type: 'list' }
  | { type: 'class'; cls: ClassRoom; role: 'instructor' | 'student' }
  | { type: 'assignment'; cls: ClassRoom; assignment: Assignment }
  | { type: 'submit'; cls: ClassRoom; assignment: Assignment };

const subKey = (classId: string, assignmentId: string) => `${classId}/${assignmentId}`;

export function ClassroomPanel({ appUser, scoringConfig, onClose }: ClassroomPanelProps) {
  const [consent, setConsent] = useState(!!appUser.kvkkAcceptedAt);
  const [tab, setTab] = useState<'teaching' | 'enrolled'>('teaching');
  const [data, setData] = useState<{ teaching: ClassRoom[]; enrolled: ClassRoom[] }>({ teaching: [], enrolled: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ type: 'list' });

  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({});
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [mySubs, setMySubs] = useState<Record<string, Submission | undefined>>({});

  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [reportCtx, setReportCtx] = useState<{ cls: ClassRoom; assignment: Assignment; submission: Submission } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // B21 Faz 2: öğrenci adına teslim bağlamı
  const [behalfCtx, setBehalfCtx] = useState<{ cls: ClassRoom; assignment: Assignment } | null>(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      setData(await svc.listMyClasses(appUser.uid));
    } catch (err: any) {
      toast.error(err?.message || 'Sınıflar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [appUser.uid]);

  useEffect(() => {
    if (consent) loadClasses();
  }, [consent, loadClasses]);

  const loadAssignments = async (classId: string) => {
    const list = await svc.listAssignments(classId);
    setAssignments((prev) => ({ ...prev, [classId]: list }));
    return list;
  };

  const openClass = async (cls: ClassRoom, role: 'instructor' | 'student') => {
    try {
      const list = await loadAssignments(cls.id);
      if (role === 'instructor') {
        const enr = await svc.listEnrollments(cls.id);
        setEnrollments((prev) => ({ ...prev, [cls.id]: enr }));
      } else {
        const mine: Record<string, Submission | undefined> = {};
        for (const a of list) {
          mine[a.id] = await svc.getMySubmission(cls.id, a.id, appUser.uid);
        }
        setMySubs(mine);
      }
      setView({ type: 'class', cls, role });
    } catch (err: any) {
      toast.error(err?.message || 'Sınıf açılamadı');
    }
  };

  const openAssignment = async (cls: ClassRoom, assignment: Assignment) => {
    try {
      const list = await svc.listSubmissions(cls.id, assignment.id);
      setSubmissions((prev) => ({ ...prev, [subKey(cls.id, assignment.id)]: list }));
      setView({ type: 'assignment', cls, assignment });
    } catch (err: any) {
      toast.error(err?.message || 'Ödev açılamadı');
    }
  };

  // --- Sınıf işlemleri ---

  const handleCreateClass = async (form: { name: string; subject: string; term: string }) => {
    try {
      const cls = await svc.createClass(appUser, form);
      toast.success(`Sınıf oluşturuldu — Kod: ${cls.classCode} · Anahtar: ${cls.enrollmentKey}`);
      await loadClasses();
    } catch (err: any) {
      toast.error(err?.message || 'Sınıf oluşturulamadı');
    }
  };

  const handleUpdateClass = async (form: { name: string; subject: string; term: string }) => {
    if (!editingClass) return;
    try {
      await svc.updateClass(editingClass.id, form);
      toast.success('Sınıf güncellendi');
      await loadClasses();
      setView((v) => (v.type === 'class' && v.cls.id === editingClass.id ? { ...v, cls: { ...v.cls, ...form } } : v));
    } catch (err: any) {
      toast.error(err?.message || 'Güncelleme başarısız');
    }
  };

  const handleArchiveToggle = async (cls: ClassRoom) => {
    try {
      await svc.updateClass(cls.id, { archived: !cls.archived });
      toast.success(cls.archived ? 'Sınıf arşivden çıkarıldı' : 'Sınıf arşivlendi');
      await loadClasses();
    } catch (err: any) {
      toast.error(err?.message || 'İşlem başarısız');
    }
  };

  const handleRegenerateKey = async (cls: ClassRoom) => {
    if (!window.confirm('Kayıt anahtarı yenilensin mi? Eski anahtar geçersiz olur.')) return;
    try {
      const key = await svc.regenerateEnrollmentKey(appUser.uid, cls.id);
      toast.success(`Yeni kayıt anahtarı: ${key}`);
      await loadClasses();
    } catch (err: any) {
      toast.error(err?.message || 'Anahtar yenilenemedi');
    }
  };

  const handleJoin = async (classCode: string, enrollmentKey: string) => {
    try {
      await svc.joinClass(appUser, classCode, enrollmentKey);
      toast.success('Sınıfa kayıt tamamlandı');
      setShowJoin(false);
      setTab('enrolled');
      await loadClasses();
    } catch (err: any) {
      toast.error(err?.message || 'Kayıt başarısız');
      throw err;
    }
  };

  const handleRemoveEnrollment = async (classId: string, studentId: string, name: string) => {
    if (!window.confirm(`${name} sınıftan çıkarılsın mı? Teslimleri kalır.`)) return;
    try {
      await svc.removeEnrollment(classId, studentId);
      toast.success('Öğrenci çıkarıldı');
      setEnrollments((prev) => ({ ...prev, [classId]: (prev[classId] || []).filter((e) => e.studentId !== studentId) }));
    } catch (err: any) {
      toast.error(err?.message || 'İşlem başarısız');
    }
  };

  // --- Ödev işlemleri ---

  // B21 Faz 2: toplu öğrenci listesi — bekleme kayıtları (hesabı olmayan öğrenciler)
  const handleBulkEnroll = async (classId: string, entries: Array<{ name: string; email: string }>) => {
    try {
      const res = await svc.bulkEnrollStudents(appUser.uid, classId, entries);
      const skipNote = res.skipped.length > 0 ? ` · ${res.skipped.length} satır atlandı (${res.skipped[0].reason})` : '';
      toast.success(`${res.added} öğrenci eklendi${skipNote}`);
      const enr = await svc.listEnrollments(classId);
      setEnrollments((prev) => ({ ...prev, [classId]: enr }));
    } catch (err: any) {
      toast.error(err?.message || 'Liste içe aktarılamadı');
    }
  };

  const handleCreateAssignment = async (form: {
    title: string; instructions: string; startDate: string; dueDate: string; noRepository: boolean;
  }) => {
    if (view.type !== 'class' || view.role !== 'instructor') return;
    try {
      await svc.createAssignment(appUser.uid, view.cls.id, form);
      toast.success('Ödev oluşturuldu');
      await loadAssignments(view.cls.id);
    } catch (err: any) {
      toast.error(err?.message || 'Ödev oluşturulamadı');
    }
  };

  const handleUpdateAssignment = async (form: {
    title: string; instructions: string; startDate: string; dueDate: string; noRepository: boolean;
  }) => {
    if (!editingAssignment) return;
    try {
      await svc.updateAssignment(editingAssignment.classId, editingAssignment.id, form);
      toast.success('Ödev güncellendi');
      await loadAssignments(editingAssignment.classId);
      setView((v) =>
        v.type === 'assignment' && v.assignment.id === editingAssignment.id
          ? { ...v, assignment: { ...v.assignment, ...form } }
          : v
      );
    } catch (err: any) {
      toast.error(err?.message || 'Güncelleme başarısız');
    }
  };

  const handleDeleteAssignment = async (cls: ClassRoom, a: Assignment) => {
    if (!window.confirm(`"${a.title}" ödevi silinsin mi? Teslimler erişilemez hale gelir.`)) return;
    try {
      await svc.deleteAssignment(cls.id, a.id);
      toast.success('Ödev silindi');
      await loadAssignments(cls.id);
    } catch (err: any) {
      toast.error(err?.message || 'Silme başarısız');
    }
  };

  // --- Teslim işlemleri ---

  const refreshSubmissions = async (cls: ClassRoom, assignment: Assignment) => {
    const list = await svc.listSubmissions(cls.id, assignment.id);
    setSubmissions((prev) => ({ ...prev, [subKey(cls.id, assignment.id)]: list }));
    return list;
  };

  const handleRerun = async (cls: ClassRoom, assignment: Assignment, s: Submission) => {
    setBusyId(s.id);
    try {
      // B21 Faz 2: eğitmen "Yeniden Çalıştır" aksiyonu skoru sunucuda hesaplar (yetki: sınıf eğitmeni)
      const scores = await svc.scoreSubmission(
        { text: s.text, ...scoringConfig },
        { classId: cls.id, assignmentId: assignment.id, studentId: s.studentId }
      );
      await refreshSubmissions(cls, assignment);
      if (reportCtx?.submission.id === s.id) {
        setReportCtx({ cls, assignment, submission: { ...s, ...scores, status: 'scored' } });
      }
      toast.success('Skorlar yeniden hesaplandı');
    } catch (err: any) {
      toast.error(err?.message || 'Yeniden hesaplama başarısız');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleExclude = async (url: string, excluded: boolean) => {
    if (!reportCtx) return;
    const { cls, assignment, submission } = reportCtx;
    try {
      await svc.setSourceExcluded(cls.id, assignment.id, submission.studentId, url, excluded);
      const current = submission.excludedSourceUrls || [];
      const next = excluded ? Array.from(new Set([...current, url])) : current.filter((u) => u !== url);
      setReportCtx({ cls, assignment, submission: { ...submission, excludedSourceUrls: next } });
    } catch (err: any) {
      toast.error(err?.message || 'Kaynak dışlama başarısız');
    }
  };

  const handleSubmitDone = async (cls: ClassRoom, assignment: Assignment, s: Submission) => {
    setView({ type: 'class', cls, role: 'student' });
    try {
      const mine = await svc.getMySubmission(cls.id, assignment.id, appUser.uid);
      setMySubs((prev) => ({ ...prev, [assignment.id]: mine || s }));
      if ((mine || s).status === 'scored') {
        setReportCtx({ cls, assignment, submission: (mine || s) as Submission });
      }
    } catch {
      setMySubs((prev) => ({ ...prev, [assignment.id]: s }));
    }
  };

  const handleDownloadCsv = (cls: ClassRoom, assignment: Assignment) => {
    const list = submissions[subKey(cls.id, assignment.id)] || [];
    exportSubmissionsCSV(cls, assignment, list);
  };

  const handleDownloadExcel = (cls: ClassRoom, assignment: Assignment) => {
    const list = submissions[subKey(cls.id, assignment.id)] || [];
    exportSubmissionsExcel(cls, assignment, list);
  };

  // --- KVKK ---

  const handleAcceptKvkk = async () => {
    try {
      await svc.acceptKvkk(appUser.uid);
      setConsent(true);
      toast.success('Aydınlatma metni onaylandı');
    } catch (err: any) {
      toast.error(err?.message || 'Onay kaydedilemedi');
    }
  };

  const handleDeclineKvkk = () => {
    toast.info('Sınıf özelliğini kullanmak için aydınlatma metnini onaylamanız gerekir.');
    onClose();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {!consent && (
        <KvkkConsentModal onAccept={handleAcceptKvkk} onDecline={handleDeclineKvkk} />
      )}

      {view.type === 'list' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-500" /> Sınıflarım
              </h3>
              <p className="text-xs text-gray-500 mt-1">Sınıf oluşturun ya da kod ile katılın; teslimler otomatik skorlanır.</p>
            </div>
            <button
              onClick={loadClasses}
              className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
            {(
              [
                ['teaching', `Verdiğim Sınıflar (${data.teaching.length})`],
                ['enrolled', `Katıldığım Sınıflar (${data.enrolled.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  tab === key ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : tab === 'teaching' ? (
            <InstructorClassesView
              classes={data.teaching}
              onCreate={() => { setEditingClass(null); setShowClassForm(true); }}
              onOpen={(cls) => openClass(cls, 'instructor')}
              onEdit={(cls) => { setEditingClass(cls); setShowClassForm(true); }}
              onArchiveToggle={handleArchiveToggle}
              onRegenerateKey={handleRegenerateKey}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Katıldığım Sınıflar</h3>
                  <p className="text-xs text-gray-500 mt-1">Eğitmeninizin verdiği kod ve anahtar ile katılın.</p>
                </div>
                <button
                  onClick={() => setShowJoin(true)}
                  className="px-4 py-2.5 bg-blue-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all"
                >
                  Sınıfa Katıl
                </button>
              </div>
              {data.enrolled.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl">
                  <GraduationCap className="w-12 h-12 text-gray-700 mb-4" />
                  <p className="text-sm text-gray-500 font-bold">Henüz bir sınıfa katılmadınız.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.enrolled.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => openClass(cls, 'student')}
                      className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 hover:border-blue-500/30 transition-all cursor-pointer"
                    >
                      <h4 className="font-black text-white truncate">{cls.name}</h4>
                      <p className="text-[11px] text-gray-500 truncate mt-1">
                        Eğitmen: {cls.instructorName}
                        {cls.subject && ` · ${cls.subject}`}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-3">{cls.studentCount ?? 0} öğrenci</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {view.type === 'class' && view.role === 'instructor' && (
        <InstructorClassDetail
          cls={view.cls}
          assignments={assignments[view.cls.id] || []}
          enrollments={enrollments[view.cls.id] || []}
          onBack={() => { setView({ type: 'list' }); setTab('teaching'); loadClasses(); }}
          onCreateAssignment={() => { setEditingAssignment(null); setShowAssignmentForm(true); }}
          onEditAssignment={(a) => { setEditingAssignment(a); setShowAssignmentForm(true); }}
          onDeleteAssignment={(a) => handleDeleteAssignment(view.cls, a)}
          onOpenAssignment={(a) => openAssignment(view.cls, a)}
          onRemoveEnrollment={(studentId, name) => handleRemoveEnrollment(view.cls.id, studentId, name)}
          onBulkEnroll={(entries) => handleBulkEnroll(view.cls.id, entries)}
        />
      )}

      {view.type === 'class' && view.role === 'student' && (
        <StudentClassView
          cls={view.cls}
          assignments={assignments[view.cls.id] || []}
          mySubmissions={mySubs}
          onBack={() => { setView({ type: 'list' }); setTab('enrolled'); loadClasses(); }}
          onSubmit={(a) => setView({ type: 'submit', cls: view.cls, assignment: a })}
          onViewReport={(a, s) => setReportCtx({ cls: view.cls, assignment: a, submission: s })}
        />
      )}

      {view.type === 'assignment' && (
        <AssignmentDetailView
          cls={view.cls}
          assignment={view.assignment}
          submissions={submissions[subKey(view.cls.id, view.assignment.id)] || []}
          busyId={busyId}
          onBack={() => openClass(view.cls, 'instructor')}
          onOpenReport={(s) => setReportCtx({ cls: view.cls, assignment: view.assignment, submission: s })}
          onRerun={(s) => handleRerun(view.cls, view.assignment, s)}
          onDownloadCsv={() => handleDownloadCsv(view.cls, view.assignment)}
          onDownloadExcel={() => handleDownloadExcel(view.cls, view.assignment)}
          canSubmitOnBehalf={(enrollments[view.cls.id] || []).length > 0}
          onOpenBehalf={() => setBehalfCtx({ cls: view.cls, assignment: view.assignment })}
        />
      )}

      {view.type === 'submit' && (
        <StudentSubmitView
          cls={view.cls}
          assignment={view.assignment}
          appUser={appUser}
          scoringConfig={scoringConfig}
          onBack={() => openClass(view.cls, 'student')}
          onDone={(s) => handleSubmitDone(view.cls, view.assignment, s)}
        />
      )}

      <AnimatePresence>
        {showClassForm && (
          <ClassFormModal
            initial={editingClass}
            onClose={() => setShowClassForm(false)}
            onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
          />
        )}
        {showJoin && (
          <JoinClassModal onClose={() => setShowJoin(false)} onSubmit={handleJoin} />
        )}
        {showAssignmentForm && view.type === 'class' && (
          <AssignmentForm
            initial={editingAssignment}
            onClose={() => setShowAssignmentForm(false)}
            onSubmit={editingAssignment ? handleUpdateAssignment : handleCreateAssignment}
          />
        )}
        {reportCtx && (
          <SubmissionReportView
            cls={reportCtx.cls}
            assignment={reportCtx.assignment}
            submission={reportCtx.submission}
            canExclude={reportCtx.cls.instructorId === appUser.uid}
            busy={busyId === reportCtx.submission.id}
            onToggleExclude={handleToggleExclude}
            onRerun={() => handleRerun(reportCtx.cls, reportCtx.assignment, reportCtx.submission)}
            onClose={() => setReportCtx(null)}
          />
        )}
        {behalfCtx && (
          <OnBehalfSubmitModal
            cls={behalfCtx.cls}
            assignment={behalfCtx.assignment}
            enrollments={enrollments[behalfCtx.cls.id] || []}
            instructor={appUser}
            scoringConfig={scoringConfig}
            onClose={() => setBehalfCtx(null)}
            onDone={async (s) => {
              const ctx = behalfCtx;
              setBehalfCtx(null);
              await refreshSubmissions(ctx.cls, ctx.assignment);
              if (s.status === 'scored') {
                setReportCtx({ cls: ctx.cls, assignment: ctx.assignment, submission: s });
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, limit, serverTimestamp, increment, writeBatch
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../lib/firebase';
import type { AppUser, SubscriptionPlan } from '../types';
import type {
  ClassRoom, Assignment, Enrollment, Submission, SubmissionScores, DigitalReceipt, ClassroomTabData, SubmissionAnnotation
} from '../types/classroom';
import { SUBMISSION_LIMITS } from '../types/classroom';
import { verifyPlagiarism } from './sentinelService';
import { detectAI } from './geminiService';
import { queryInternalVaultMatches } from './internalVaultService';

// --- Saf yardımcılar (birim testi için dışa açık) ---

// 0/O ve 1/I karışmasın diye çıkarılmış alfabe
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomCode(length: number, alphabet: string = CODE_ALPHABET): string {
  const bytes = new Uint32Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, v => alphabet[v % alphabet.length]).join('');
}

export const generateClassCode = (): string => randomCode(6);
export const generateEnrollmentKey = (): string => randomCode(10);

export function normalizeCodeInput(input: string): string {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function checkSubmissionQuota(plan: SubscriptionPlan, usedToday: number) {
  const quotaLimit = SUBMISSION_LIMITS[plan] ?? SUBMISSION_LIMITS.free;
  return { allowed: usedToday < quotaLimit, limit: quotaLimit, remaining: Math.max(0, quotaLimit - usedToday) };
}

// Günlük sıfırlama: resetDate bugün değilse sayaç 1'den başlar
export function nextSubmissionCounter(usedToday: number, resetDate: string, today: string): number {
  return resetDate === today ? usedToday + 1 : 1;
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

// --- Firestore referansları ---

const classRef = (classId: string) => doc(db, 'classes', classId);
const assignmentsCol = (classId: string) => collection(db, 'classes', classId, 'assignments');
const submissionsCol = (classId: string, assignmentId: string) =>
  collection(db, 'classes', classId, 'assignments', assignmentId, 'submissions');
const submissionRef = (classId: string, assignmentId: string, studentId: string) =>
  doc(db, 'classes', classId, 'assignments', assignmentId, 'submissions', studentId);
const enrollmentRef = (classId: string, studentId: string) =>
  doc(db, 'classes', classId, 'enrollments', studentId);
const mirrorRef = (uid: string, classId: string) =>
  doc(db, 'users', uid, 'classEnrollments', classId);

// --- Sınıf yaşam döngüsü ---

export async function createClass(
  instructor: AppUser,
  data: { name: string; subject?: string; term?: string }
): Promise<ClassRoom> {
  const name = data.name.trim();
  if (!name) throw new Error('Sınıf adı zorunludur.');

  let classCode = generateClassCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const snap = await getDocs(query(collection(db, 'classes'), where('classCode', '==', classCode), limit(1)));
    if (snap.empty) break;
    classCode = generateClassCode();
    if (attempt === 4) throw new Error('Benzersiz sınıf kodu üretilemedi, lütfen tekrar deneyin.');
  }

  const enrollmentKey = generateEnrollmentKey();
  const ref = await addDoc(collection(db, 'classes'), {
    instructorId: instructor.uid,
    instructorName: instructor.email?.split('@')[0] || 'Eğitmen',
    instructorEmail: instructor.email || '',
    name,
    subject: data.subject?.trim() || '',
    term: data.term?.trim() || '',
    classCode,
    enrollmentKey,
    studentCount: 0,
    archived: false,
    createdAt: serverTimestamp()
  });

  return {
    id: ref.id,
    instructorId: instructor.uid,
    instructorName: instructor.email?.split('@')[0] || 'Eğitmen',
    instructorEmail: instructor.email || '',
    name,
    subject: data.subject?.trim() || '',
    term: data.term?.trim() || '',
    classCode,
    enrollmentKey,
    studentCount: 0,
    archived: false,
    createdAt: new Date().toISOString()
  };
}

export async function updateClass(classId: string, data: { name?: string; subject?: string; term?: string; archived?: boolean }): Promise<void> {
  const patch: Record<string, any> = {};
  if (data.name !== undefined) patch.name = data.name.trim();
  if (data.subject !== undefined) patch.subject = data.subject.trim();
  if (data.term !== undefined) patch.term = data.term.trim();
  if (data.archived !== undefined) patch.archived = data.archived;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(classRef(classId), patch);
}

export async function regenerateEnrollmentKey(instructorId: string, classId: string): Promise<string> {
  const cls = await getClass(classId);
  if (!cls || cls.instructorId !== instructorId) throw new Error('Bu sınıfı yönetme yetkiniz yok.');
  const enrollmentKey = generateEnrollmentKey();
  await updateDoc(classRef(classId), { enrollmentKey });
  return enrollmentKey;
}

// --- Kayıt (enrollment) ---

export interface ClassPreview {
  id: string;
  name: string;
  subject: string;
  term: string;
  instructorName: string;
  instructorEmail: string;
  archived: boolean;
}

export async function lookupClassByCode(rawCode: string): Promise<ClassPreview | null> {
  const classCode = normalizeCodeInput(rawCode);
  if (classCode.length < 4) return null;
  const snap = await getDocs(query(collection(db, 'classes'), where('classCode', '==', classCode), limit(1)));
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  const d = docSnap.data();
  return {
    id: docSnap.id,
    name: d.name || '',
    subject: d.subject || '',
    term: d.term || '',
    instructorName: d.instructorName || (d.instructorEmail ? d.instructorEmail.split('@')[0] : 'Eğitmen'),
    instructorEmail: d.instructorEmail || '',
    archived: Boolean(d.archived)
  };
}

export async function joinClass(student: AppUser, rawCode: string, rawKey: string): Promise<string> {
  const classCode = normalizeCodeInput(rawCode);
  const enrollmentKey = normalizeCodeInput(rawKey);
  if (classCode.length < 4) throw new Error('Geçerli bir sınıf kodu girin.');
  if (!enrollmentKey) throw new Error('Kayıt anahtarı zorunludur.');

  const snap = await getDocs(query(collection(db, 'classes'), where('classCode', '==', classCode), limit(1)));
  if (snap.empty) throw new Error('Bu kodla eşleşen sınıf bulunamadı.');
  const classDoc = snap.docs[0];
  const cls = classDoc.data() as ClassRoom;
  if (cls.archived) throw new Error('Bu sınıf arşivlenmiş; yeni kayıt alınmıyor.');
  if (cls.enrollmentKey !== enrollmentKey) throw new Error('Kayıt anahtarı hatalı.');

  const classId = classDoc.id;
  const existing = await getDoc(enrollmentRef(classId, student.uid));
  if (existing.exists()) throw new Error('Bu sınıfa zaten kayıtlısınız.');

  // B21 Faz 2: eğitmen listesinden gelen bekleme kaydı varsa gerçek kayıtla değiştirilir
  // (studentCount artmaz: bekleme kaydı silinir, yerine uid'li kayıt geçer)
  const pendingSnap = await getDocs(query(
    collection(db, 'classes', classId, 'enrollments'),
    where('studentEmail', '==', (student.email || '').toLowerCase()),
    limit(1)
  ));
  const pendingDoc = pendingSnap.docs.find((d) => d.data()?.pending === true);

  const batch = writeBatch(db);
  batch.set(enrollmentRef(classId, student.uid), {
    studentId: student.uid,
    studentName: student.email?.split('@')[0] || 'Öğrenci',
    studentEmail: student.email || '',
    joinedAt: serverTimestamp(),
    addedBy: 'self'
  });
  batch.set(mirrorRef(student.uid, classId), { classId, joinedAt: serverTimestamp() });
  if (pendingDoc) {
    batch.delete(pendingDoc.ref);
  } else {
    batch.update(classRef(classId), { studentCount: increment(1) });
  }
  await batch.commit();
  return classId;
}

export async function leaveClass(uid: string, classId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(enrollmentRef(classId, uid));
  batch.delete(mirrorRef(uid, classId));
  batch.update(classRef(classId), { studentCount: increment(-1) });
  await batch.commit();
}

export async function removeEnrollment(classId: string, studentId: string): Promise<void> {
  const enr = await getDoc(enrollmentRef(classId, studentId));
  if (!enr.exists()) return;
  const batch = writeBatch(db);
  batch.delete(enrollmentRef(classId, studentId));
  batch.delete(mirrorRef(studentId, classId));
  batch.update(classRef(classId), { studentCount: increment(-1) });
  await batch.commit();
}

// --- B21 Faz 2: toplu öğrenci listesi + öğrenci adına teslim ---

export interface BulkEnrollResult {
  added: number;
  skipped: Array<{ email: string; reason: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bekleme kaydı kimliği: hesap açılana kadar deterministik, e-postadan türetilir
export function pendingEnrollmentId(email: string): string {
  return `pending_${(email || '').trim().toLowerCase()}`;
}

// "Ad Soyad, eposta" satırlarını ayrıştırır (virgül / noktalı virgül / sekme ayıracı; yalnız eposta da olur)
export function parseBulkRoster(raw: string): Array<{ name: string; email: string }> {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
      const emailPart = parts.find((p) => p.includes('@'));
      if (!emailPart) return null;
      const name = parts.filter((p) => p !== emailPart).join(' ');
      return { name, email: emailPart };
    })
    .filter((x): x is { name: string; email: string } => x !== null);
}

// Hesabı olmayan öğrenciler için bekleme kaydı açar; joinClass gerçek kaydı devralır.
// Not: bekleme kayıtlarının Firestore kuralları eğitmen yazımına açıktır (deploy ayrı onaylı).
export async function bulkEnrollStudents(
  instructorUid: string,
  classId: string,
  entries: Array<{ name: string; email: string }>
): Promise<BulkEnrollResult> {
  const existing = await listEnrollments(classId);
  const knownEmails = new Set(existing.map((e) => (e.studentEmail || '').toLowerCase()));

  const accepted: Array<{ name: string; email: string }> = [];
  const skipped: BulkEnrollResult['skipped'] = [];
  for (const entry of entries) {
    const email = (entry.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      skipped.push({ email, reason: 'geçersiz e-posta' });
      continue;
    }
    if (knownEmails.has(email)) {
      skipped.push({ email, reason: 'zaten kayıtlı' });
      continue;
    }
    knownEmails.add(email);
    accepted.push({ name: (entry.name || '').trim(), email });
  }

  // Firestore toplu yazı limiti (500) altında kalmak için parçalı commit
  const BATCH_LIMIT = 400;
  let added = 0;
  for (let i = 0; i < accepted.length; i += BATCH_LIMIT) {
    const chunk = accepted.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const entry of chunk) {
      const id = pendingEnrollmentId(entry.email);
      batch.set(enrollmentRef(classId, id), {
        studentId: id,
        studentName: entry.name || entry.email.split('@')[0],
        studentEmail: entry.email,
        joinedAt: serverTimestamp(),
        addedBy: instructorUid,
        pending: true
      });
    }
    batch.update(classRef(classId), { studentCount: increment(chunk.length) });
    await batch.commit();
    added += chunk.length;
  }
  return { added, skipped };
}

// Eğitmen, kayıtlı (veya beklemedeki) öğrenci adına teslim açar; submittedBy eğitmen uid'i olur.
// Firestore kuralı eğitmen yazısına zaten izin verir; teslim dokümanı öğrenci kimliğiyle açılır.
export async function submitOnBehalf(
  instructor: AppUser,
  classId: string,
  assignmentId: string,
  enrollment: Enrollment,
  payload: { title: string; text: string; file?: { fileName: string; storagePath: string }; noRepository?: boolean }
): Promise<Submission> {
  const title = payload.title.trim();
  const text = payload.text.trim();
  if (!title) throw new Error('Teslim başlığı zorunludur.');
  if (text.length < 50) throw new Error('Metin çok kısa (en az 50 karakter).');

  const asgSnap = await getDoc(doc(assignmentsCol(classId), assignmentId));

  const receipt: DigitalReceipt = {
    sha256: await sha256Hex(text),
    submittedAt: new Date().toISOString(),
    textLength: text.length
  };

  const data = {
    studentId: enrollment.studentId,
    studentName: enrollment.studentName,
    studentEmail: enrollment.studentEmail,
    submittedBy: instructor.uid,
    title,
    text,
    status: 'received',
    excludedSourceUrls: [],
    digitalReceipt: receipt,
    noRepository: Boolean(payload.noRepository || (asgSnap.exists() && (asgSnap.data() as any)?.noRepository)),
    createdAt: serverTimestamp(),
    ...(payload.file ? { fileName: payload.file.fileName, storagePath: payload.file.storagePath } : {})
  };
  await setDoc(submissionRef(classId, assignmentId, enrollment.studentId), data);
  return { id: enrollment.studentId, ...data, createdAt: new Date().toISOString() } as Submission;
}

// --- Okuma ---

export async function getClass(classId: string): Promise<ClassRoom | null> {
  const snap = await getDoc(classRef(classId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as any) } : null;
}

export async function listMyClasses(uid: string): Promise<ClassroomTabData> {
  const teachingSnap = await getDocs(
    query(collection(db, 'classes'), where('instructorId', '==', uid), orderBy('createdAt', 'desc'))
  );
  const teaching = teachingSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ClassRoom[];

  const mirrorSnap = await getDocs(
    query(collection(db, 'users', uid, 'classEnrollments'), orderBy('joinedAt', 'desc'))
  );
  const enrolled: ClassRoom[] = [];
  for (const d of mirrorSnap.docs) {
    const c = await getDoc(classRef(d.data().classId as string));
    if (c.exists()) enrolled.push({ id: c.id, ...(c.data() as any) } as ClassRoom);
  }
  return { teaching, enrolled };
}

export async function listEnrollments(classId: string): Promise<Enrollment[]> {
  const snap = await getDocs(query(collection(db, 'classes', classId, 'enrollments'), orderBy('joinedAt', 'asc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Enrollment[];
}

// --- Ödevler ---

export async function createAssignment(
  instructorId: string,
  classId: string,
  data: {
    title: string;
    instructions?: string;
    startDate?: string;
    dueDate?: string;
    noRepository?: boolean;
    allowStudentViewReport?: boolean;
    allowLateSubmissions?: boolean;
  }
): Promise<Assignment> {
  const title = data.title.trim();
  if (!title) throw new Error('Ödev başlığı zorunludur.');
  const payload = {
    classId,
    title,
    instructions: data.instructions?.trim() || '',
    startDate: data.startDate || '',
    dueDate: data.dueDate || '',
    noRepository: data.noRepository ?? false,
    allowStudentViewReport: data.allowStudentViewReport !== false,
    allowLateSubmissions: data.allowLateSubmissions !== false,
    createdBy: instructorId,
    createdAt: serverTimestamp()
  };
  const ref = await addDoc(assignmentsCol(classId), payload);
  return { id: ref.id, ...payload, createdAt: new Date().toISOString() } as Assignment;
}

export async function updateAssignment(
  classId: string,
  assignmentId: string,
  data: Partial<{ title: string; instructions: string; startDate: string; dueDate: string; noRepository: boolean }>
): Promise<void> {
  const patch: Record<string, any> = {};
  if (data.title !== undefined) patch.title = data.title.trim();
  if (data.instructions !== undefined) patch.instructions = data.instructions.trim();
  if (data.startDate !== undefined) patch.startDate = data.startDate;
  if (data.dueDate !== undefined) patch.dueDate = data.dueDate;
  if (data.noRepository !== undefined) patch.noRepository = data.noRepository;
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(assignmentsCol(classId), assignmentId), patch);
}

export async function deleteAssignment(classId: string, assignmentId: string): Promise<void> {
  await deleteDoc(doc(assignmentsCol(classId), assignmentId));
}

export async function listAssignments(classId: string): Promise<Assignment[]> {
  const snap = await getDocs(query(assignmentsCol(classId), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Assignment[];
}

// --- B21 Faz 2: dosya yükleme (PDF/DOCX, <=20 MB) ---

export const MAX_SUBMISSION_FILE_BYTES = 20 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export function validateSubmissionFile(file: { type: string; size: number }): void {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    throw new Error('Desteklenmeyen dosya türü (yalnızca PDF ve DOCX).');
  }
  if (file.size > MAX_SUBMISSION_FILE_BYTES) {
    throw new Error('Dosya 20 MB sınırını aşıyor.');
  }
}

// Storage yolu; storage.rules aynı şablonla kilitlenir
export const submissionFilePath = (
  classId: string,
  assignmentId: string,
  studentId: string,
  fileName: string
): string => `classes/${classId}/assignments/${assignmentId}/submissions/${studentId}/${Date.now()}_${fileName}`;

// Storage istemcisi tembel oluşturulur: firebase/storage paketi yalnızca bu modülün
// bulunduğu (tembel) chunk'a girer, açılış bundle'ını şişirmez
const submissionStorage = () => getStorage(getApp());

export async function uploadSubmissionFile(
  studentId: string,
  classId: string,
  assignmentId: string,
  file: File
): Promise<{ fileName: string; storagePath: string }> {
  validateSubmissionFile(file);
  const storagePath = submissionFilePath(classId, assignmentId, studentId, file.name);
  await uploadBytes(ref(submissionStorage(), storagePath), file, { contentType: file.type });
  return { fileName: file.name, storagePath };
}

// Eğitmen/öğrenci teslim dosyasını görüntülemek için kısa süreli indirme URL'si üretir
export function getSubmissionFileUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(submissionStorage(), storagePath));
}

// --- Teslimler ---

export async function submitText(
  student: AppUser,
  classId: string,
  assignmentId: string,
  payload: { title: string; text: string; file?: { fileName: string; storagePath: string }; noRepository?: boolean }
): Promise<Submission> {
  const title = payload.title.trim();
  const text = payload.text.trim();
  if (!title) throw new Error('Teslim başlığı zorunludur.');
  if (text.length < 50) throw new Error('Metin çok kısa (en az 50 karakter).');

  const today = todayIso();
  const usedToday = student.submissionResetDate === today ? (student.submissionUsage || 0) : 0;
  const quota = checkSubmissionQuota(student.plan, usedToday);
  if (!quota.allowed) {
    throw new Error(`Günlük teslim kotası doldu (${student.plan} planı: ${quota.limit} teslim/gün). Limit yarın sıfırlanır.`);
  }

  const asgSnap = await getDoc(doc(assignmentsCol(classId), assignmentId));
  let isLate = false;
  let lateDurationMinutes: number | undefined;
  if (asgSnap.exists()) {
    const asgData = asgSnap.data();
    if (asgData.dueDate) {
      const dueTime = new Date(asgData.dueDate).getTime();
      if (!isNaN(dueTime) && dueTime < Date.now()) {
        if (asgData.allowLateSubmissions === false) {
          throw new Error('Bu ödev için son teslim tarihi dolmuştur ve gecikmiş teslim kabul edilmemektedir.');
        }
        isLate = true;
        lateDurationMinutes = Math.round((Date.now() - dueTime) / 60000);
      }
    }
  }

  const receipt: DigitalReceipt = {
    sha256: await sha256Hex(text),
    submittedAt: new Date().toISOString(),
    textLength: text.length,
    academicIntegrityLocked: true,
    isolationProtocol: 'Strict-Academic-Partitioning-v1'
  };

  const data = {
    studentId: student.uid,
    studentName: student.email?.split('@')[0] || 'Öğrenci',
    studentEmail: student.email || '',
    title,
    text,
    status: 'received',
    excludedSourceUrls: [],
    digitalReceipt: receipt,
    academicIntegrityLocked: true,
    noRepository: Boolean(payload.noRepository || (asgSnap.exists() && (asgSnap.data() as any)?.noRepository)),
    createdAt: serverTimestamp(),
    isLate,
    ...(isLate && typeof lateDurationMinutes === 'number' ? { lateDurationMinutes } : {}),
    ...(payload.file ? { fileName: payload.file.fileName, storagePath: payload.file.storagePath } : {})
  };
  await setDoc(submissionRef(classId, assignmentId, student.uid), data);

  await updateDoc(doc(db, 'users', student.uid), {
    submissionUsage: nextSubmissionCounter(student.submissionUsage || 0, student.submissionResetDate || '', today),
    submissionResetDate: today
  });

  return { id: student.uid, ...data, createdAt: new Date().toISOString() } as Submission;
}

export async function updateSubmissionScores(
  classId: string,
  assignmentId: string,
  studentId: string,
  scores: SubmissionScores & { status?: Submission['status']; scoredBy?: Submission['scoredBy'] }
): Promise<void> {
  await updateDoc(submissionRef(classId, assignmentId, studentId), {
    similarityScore: scores.similarityScore,
    aiScore: scores.aiScore,
    sources: scores.sources,
    sentenceScores: scores.sentenceScores || [],
    metrics: scores.metrics || {},
    status: scores.status || 'scored',
    scoredBy: scores.scoredBy || 'client',
    scoredAt: serverTimestamp(),
    ...(scores.hasInternalGeneratorMatch !== undefined ? { hasInternalGeneratorMatch: scores.hasInternalGeneratorMatch } : {}),
    ...(scores.internalGeneratorSimilarity !== undefined ? { internalGeneratorSimilarity: scores.internalGeneratorSimilarity } : {})
  });
}

export async function markSubmissionFailed(classId: string, assignmentId: string, studentId: string): Promise<void> {
  await updateDoc(submissionRef(classId, assignmentId, studentId), { status: 'failed' });
}

export async function gradeSubmission(
  classId: string,
  assignmentId: string,
  studentId: string,
  payload: { grade?: number | null; feedback?: string; gradedBy?: string; rubricScores?: any[] }
): Promise<void> {
  const updateData: Record<string, any> = {
    gradedAt: serverTimestamp(),
  };
  if (payload.grade !== undefined) {
    updateData.grade = payload.grade;
  }
  if (payload.feedback !== undefined) {
    updateData.feedback = payload.feedback.trim();
  }
  if (payload.gradedBy) {
    updateData.gradedBy = payload.gradedBy;
  }
  if (payload.rubricScores !== undefined) {
    updateData.rubricScores = payload.rubricScores;
  }
  await updateDoc(submissionRef(classId, assignmentId, studentId), updateData);
}

export async function updateSubmissionAnnotations(
  classId: string,
  assignmentId: string,
  studentId: string,
  annotations: SubmissionAnnotation[]
): Promise<void> {
  await updateDoc(submissionRef(classId, assignmentId, studentId), {
    annotations
  });
}

export async function listSubmissions(classId: string, assignmentId: string): Promise<Submission[]> {
  const snap = await getDocs(query(submissionsCol(classId, assignmentId), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Submission[];
}

export function subscribeSubmissions(
  classId: string,
  assignmentId: string,
  callback: (submissions: Submission[]) => void
): () => void {
  const q = query(submissionsCol(classId, assignmentId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Submission[];
    callback(list);
  }, (err) => {
    console.error('Submissions live sync error:', err);
  });
}

export async function getMySubmission(classId: string, assignmentId: string, studentId: string): Promise<Submission | null> {
  const snap = await getDoc(submissionRef(classId, assignmentId, studentId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Submission) : null;
}

export async function forwardSubmissionToInstitute(
  classId: string,
  assignmentId: string,
  studentId: string,
  notes?: string
): Promise<void> {
  const snap = await getDoc(submissionRef(classId, assignmentId, studentId));
  if (!snap.exists()) throw new Error('Teslim bulunamadı.');
  await updateDoc(submissionRef(classId, assignmentId, studentId), {
    forwardedToInstitute: true,
    forwardedToInstituteAt: new Date().toISOString(),
    instituteDecision: 'pending',
    ...(notes ? { instituteNotes: notes.trim() } : {})
  });
}

export interface InstituteQueueItem {
  classId: string;
  className: string;
  cls: ClassRoom;
  assignmentId: string;
  assignmentTitle: string;
  assignment: Assignment;
  submission: Submission;
}

export async function setInstituteDecision(
  classId: string,
  assignmentId: string,
  studentId: string,
  decision: 'approved' | 'revision_required' | 'rejected',
  notes: string,
  reviewerName: string
): Promise<void> {
  const snap = await getDoc(submissionRef(classId, assignmentId, studentId));
  if (!snap.exists()) throw new Error('Teslim bulunamadı.');
  await updateDoc(submissionRef(classId, assignmentId, studentId), {
    instituteDecision: decision,
    instituteNotes: notes.trim(),
    instituteDecidedAt: new Date().toISOString(),
    instituteDecidedBy: reviewerName
  });
}

export async function listInstituteQueue(instructorUid: string, isAdmin = false): Promise<InstituteQueueItem[]> {
  const classesSnap = isAdmin
    ? await getDocs(query(collection(db, 'classes'), orderBy('createdAt', 'desc'), limit(50)))
    : await getDocs(query(collection(db, 'classes'), where('instructorId', '==', instructorUid), limit(30)));

  const queue: InstituteQueueItem[] = [];

  for (const cDoc of classesSnap.docs) {
    const cls = { id: cDoc.id, ...(cDoc.data() as any) } as ClassRoom;
    const asgSnap = await getDocs(query(assignmentsCol(cDoc.id), limit(20)));
    for (const aDoc of asgSnap.docs) {
      const asg = { id: aDoc.id, ...(aDoc.data() as any) } as Assignment;
      const subSnap = await getDocs(query(submissionsCol(cDoc.id, aDoc.id), where('forwardedToInstitute', '==', true)));
      for (const sDoc of subSnap.docs) {
        const sub = { id: sDoc.id, ...(sDoc.data() as any) } as Submission;
        queue.push({
          classId: cls.id,
          className: cls.name,
          cls,
          assignmentId: asg.id,
          assignmentTitle: asg.title,
          assignment: asg,
          submission: sub
        });
      }
    }
  }

  return queue.sort((a, b) => {
    const dateA = a.submission.forwardedToInstituteAt || a.submission.createdAt || '';
    const dateB = b.submission.forwardedToInstituteAt || b.submission.createdAt || '';
    return dateB.localeCompare(dateA);
  });
}

// Kaynak dışlama Turnitin modelinde eğitmen yetkisindedir
export async function setSourceExcluded(
  classId: string,
  assignmentId: string,
  studentId: string,
  url: string,
  excluded: boolean
): Promise<void> {
  const snap = await getDoc(submissionRef(classId, assignmentId, studentId));
  if (!snap.exists()) throw new Error('Teslim bulunamadı.');
  const current: string[] = snap.data().excludedSourceUrls || [];
  const next = excluded ? Array.from(new Set([...current, url])) : current.filter(u => u !== url);
  await updateDoc(submissionRef(classId, assignmentId, studentId), { excludedSourceUrls: next });
}

// --- KVKK aydınlatma onayı (D2) ---

export async function acceptKvkk(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { kvkkAcceptedAt: new Date().toISOString() });
}

// --- Teslim skorlama (B21 Faz 2 §21.5: sunucu-öncelikli, istemci yalnız yedek) ---

export interface SubmissionScoringInput {
  text: string;
  sentinelEnabled: boolean;
  auditorModel: string;
  sensitivity: number;
}

export interface SubmissionScoringTarget {
  classId: string;
  assignmentId: string;
  studentId: string;
}

export type ScoredSubmission = SubmissionScores & { scoredBy: 'server' | 'client' };

// Functions istemcisi tembel oluşturulur (storage'taki aynı gerekçe: bundle şişmesin)
const submissionFunctions = () => getFunctions(getApp());

// Skorlar sunucuda hesaplanır ve Cloud Function tarafından Firestore'a yazılır;
// istemci sonucu yalnız görüntüler (skor sahteciliği kapısı — B21 §21.11).
export async function scoreSubmissionOnServer(
  target: SubmissionScoringTarget,
  config: Omit<SubmissionScoringInput, 'text'>
): Promise<SubmissionScores> {
  const call = httpsCallable(submissionFunctions(), 'scoreSubmission');
  const res = await call({ ...target, ...config });
  return res.data as SubmissionScores;
}

// Kimlik/yetki hatalarında istemci yedeğine düşülmez; hata kullanıcıya görünür.
const SCORING_FALLBACK_BLOCKED_CODES = new Set(['functions/unauthenticated', 'functions/permission-denied']);

export async function scoreSubmission(
  input: SubmissionScoringInput,
  target: SubmissionScoringTarget
): Promise<ScoredSubmission> {
  try {
    const scores = await scoreSubmissionOnServer(target, {
      sentinelEnabled: input.sentinelEnabled,
      auditorModel: input.auditorModel,
      sensitivity: input.sensitivity
    });
    return { ...scores, scoredBy: 'server' };
  } catch (err: any) {
    if (SCORING_FALLBACK_BLOCKED_CODES.has(String(err?.code || ''))) throw err;
    console.warn('[classroom] Sunucu-tarafı skorlama kullanılamadı, istemci yedeğine düşülüyor:', err?.code || err?.message);
  }
  // Faz 1 yedeği: CF dağıtılı değilse/erişilemezse skor istemcide hesaplanır ve yazılır.
  const scores = await runSubmissionScoring(input);
  await updateSubmissionScores(target.classId, target.assignmentId, target.studentId, {
    ...scores,
    scoredBy: 'client'
  });
  return { ...scores, scoredBy: 'client' };
}

// İstemci-tarafı skor motoru (yedek yol; CF erişilebilir olduğunda bu kullanılmaz)
export async function runSubmissionScoring(input: SubmissionScoringInput): Promise<SubmissionScores> {
  const [plagiarism, ai, vaultMatch] = await Promise.all([
    verifyPlagiarism(input.text, input.sentinelEnabled, 0, {
      searchPhrasesCount: 10,
      minWordCount: 8,
      useDynamicSimilarity: true,
      trustFilter: true,
      regionFilter: true
    }),
    detectAI(input.text, input.sensitivity, input.auditorModel),
    queryInternalVaultMatches(input.text).catch(() => ({ hasMatch: false, maxSimilarity: 0 }))
  ]);

  const sources = [...(plagiarism.sources || [])];
  let hasInternalGeneratorMatch = false;
  let internalGeneratorSimilarity = 0;

  if (vaultMatch && vaultMatch.hasMatch) {
    hasInternalGeneratorMatch = true;
    internalGeneratorSimilarity = Math.round(vaultMatch.maxSimilarity * 100);
    const vaultId = 'matchedVaultId' in vaultMatch ? vaultMatch.matchedVaultId : 'vault-match';
    sources.push({
      title: 'Platform İçi Sentetik Üretim İzi (Humanizer Vault)',
      url: `internal-vault://synthetic-generator/${vaultId || 'vault-match'}`,
      similarity: vaultMatch.maxSimilarity,
      snippet: 'Bu metin platformun İnsanlaştırma / StyleMaster motoru tarafından üretilmiş bir çıktıyla parmak izi eşleşmesi göstermektedir.',
      matchedText: 'Platform içi sentetik parmak izi eşleşmesi',
      trust: 'high',
      matchGroup: 'internal_generator'
    });
  }

  return {
    similarityScore: plagiarism.similarityScore ?? 0,
    aiScore: ai.score ?? 0,
    sources,
    sentenceScores: ai.sentenceScores ?? [],
    metrics: ai.metrics ?? {},
    hasInternalGeneratorMatch,
    ...(hasInternalGeneratorMatch ? { internalGeneratorSimilarity } : {})
  };
}

export function generateTextShingles(text: string, k = 5): string[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = normalized.split(' ').filter((w) => w.length > 1);
  if (words.length < k) {
    return words.length > 0 ? [words.join(' ')] : [];
  }
  const set = new Set<string>();
  for (let i = 0; i <= words.length - k; i++) {
    set.add(words.slice(i, i + k).join(' '));
  }
  return Array.from(set);
}

export function computeShingleOverlap(currShingles: string[], repoShingles: string[]): number {
  if (!currShingles.length || !repoShingles.length) return 0;
  const repoSet = new Set(repoShingles);
  let matched = 0;
  for (const s of currShingles) {
    if (repoSet.has(s)) matched++;
  }
  return Math.min(1, Math.round((matched / currShingles.length) * 100) / 100);
}

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AppUser } from '../types';
import type { ClassRoom, Assignment, Enrollment, Submission } from '../types/classroom';

export const DEMO_CLASS_ID = 'demo-class-yz501';
export const DEMO_ASSIGNMENT_ID = 'demo-assignment-tez';
export const DEMO_STUDENT_AHMET_ID = 'demo-student-ahmet';
export const DEMO_STUDENT_MEHMET_ID = 'demo-student-mehmet';

export async function seedClassroomDemo(appUser: AppUser): Promise<{ classId: string; assignmentId: string }> {
  const isStudent = appUser.academicProfile === 'student' || appUser.email === 'deneme@deneme.com';

  const instructorId = appUser.uid;
  const instructorName = (appUser.email === 'ismail.kaleci@gmail.com' ? 'Doç. Dr. İsmail Kaleci' : ((appUser as any).name || 'Doç. Dr. İsmail Kaleci'));
  const instructorEmail = isStudent ? 'ismail.kaleci@gmail.com' : (appUser.email || 'ismail.kaleci@gmail.com');

  const classData: Omit<ClassRoom, 'id'> = {
    instructorId,
    instructorName,
    instructorEmail,
    name: 'YZ-501: Akademik Araştırma ve Yayın Etiği',
    subject: 'Sosyal ve Fen Bilimleri Enstitüsü',
    term: '2026-2027 Güz',
    classCode: 'SENT26',
    enrollmentKey: 'DEMO-2026',
    studentCount: 2,
    archived: false,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'classes', DEMO_CLASS_ID), classData);

  const assignmentData: Omit<Assignment, 'id'> = {
    classId: DEMO_CLASS_ID,
    title: 'Dönem Sonu Tez Literatür Taraması ve Metodoloji Raporu',
    instructions: 'YÖK standartlarına uygun literatür sentezi ve özgün metodoloji bölümü. Tırnak içi alıntılar ve kaynakça doğru formatlanmalıdır. Öğrenci ön kontrol (Draft Coach) 3 hak ile sınırlandırılmıştır.',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    noRepository: false,
    allowStudentViewReport: true,
    allowLateSubmissions: true,
    allowDraftCheck: true,
    maxDraftChecks: 3,
    rubricCriteria: [
      { id: 'c1', title: 'Dil ve Akademik Üslup', description: 'Akademik terminoloji, tarafsız anlatım ve sentaks doğruluğu', weight: 20, maxPoints: 100 },
      { id: 'c2', title: 'Kaynak & Atıf Bütünlüğü', description: 'APA 7 / IEEE formatına uygunluk, DOI doğrulaması ve tırnak içi alıntılar', weight: 30, maxPoints: 100 },
      { id: 'c3', title: 'Özgünlük ve Sentez', description: 'Metinlerin sentezlenme düzeyi, düşük benzerlik oranı (%15 altı)', weight: 30, maxPoints: 100 },
      { id: 'c4', title: 'Metodolojik Tutarlılık', description: 'Araştırma deseni, yöntem geçerliliği ve veri toplama şeffaflığı', weight: 20, maxPoints: 100 }
    ],
    createdBy: instructorId,
    createdAt: serverTimestamp()
  };
  await setDoc(doc(db, 'classes', DEMO_CLASS_ID, 'assignments', DEMO_ASSIGNMENT_ID), assignmentData);

  const studentAhmetUid = (isStudent && appUser.email === 'deneme@deneme.com') ? appUser.uid : DEMO_STUDENT_AHMET_ID;

  const enrAhmet: Omit<Enrollment, 'id'> = {
    addedBy: instructorId,
    studentId: studentAhmetUid,
    studentName: 'Ahmet Yılmaz (YL Araştırmacısı)',
    studentEmail: 'deneme@deneme.com',
    joinedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'classes', DEMO_CLASS_ID, 'enrollments', studentAhmetUid), enrAhmet);

  const enrMehmet: Omit<Enrollment, 'id'> = {
    addedBy: instructorId,
    studentId: DEMO_STUDENT_MEHMET_ID,
    studentName: 'Mehmet Demir',
    studentEmail: 'ogrenci2@deneme.com',
    joinedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'classes', DEMO_CLASS_ID, 'enrollments', DEMO_STUDENT_MEHMET_ID), enrMehmet);

  const textAhmet = `Giriş ve Kuramsal Çerçeve:
Bu araştırmada, büyük dil modellerinin akademik metin üretimindeki rolü ve etik sınırları incelenmektedir. Yapay zeka destekli araştırma süreçleri, literatür taramasını hızlandırmakta ancak veri kirliliği ve halüsinasyon riskini beraberinde getirmektedir.

Literatür Taraması ve Sentinel Doğrulaması:
Bu nedenle YÖK ve üniversite enstitüleri tarafından belirlenen %15 intihal tavanı ve Sentinel doğrulama mekanizmaları akademik bütünlüğün korunmasında kritik rol oynamaktadır. Araştırmacının bilgiye ulaşma sürecinde doğrudan aktarılan blok tanımlar tırnak içinde belirtilmiş ve kaynakçalar eksiksiz gösterilmiştir.

Metodoloji ve Sonuç:
Araştırma karma yöntem (mixed-method) yaklaşımıyla tasarlanmış olup 120 lisansüstü tez üzerinde deneysel benzerlik analizi gerçekleştirilmiştir. Elde edilen bulgular, doğru filtreleme kriterleri (kaynakça ve tırnak muafiyeti) uygulandığında sahte pozitiflerin %80 oranında elendiğini kanıtlamaktadır.`;

  const subAhmet: Omit<Submission, 'id'> = {
    studentId: studentAhmetUid,
    studentName: 'Ahmet Yılmaz (YL Araştırmacısı)',
    studentEmail: 'deneme@deneme.com',
    title: 'Yapay Zeka Destekli Akademik Yazımda Özgünlük ve Etik Sınırlar',
    fileName: 'ahmet_yilmaz_tez_taslak_v2.docx',
    text: textAhmet,
    status: 'scored',
    similarityScore: 14,
    aiScore: 8,
    draftCheckCount: 1,
    lastDraftScores: {
      similarityScore: 32,
      aiScore: 24,
      checkedAt: new Date(Date.now() - 3600000).toISOString()
    },
    grade: 91,
    feedback: 'Literatür sentezi başarılı ve analitik derinlik tatmin edici. Metin içi QuickMarks etiketlerindeki önerileri dikkate alarak savunma öncesi nihai versiyonu hazırlayınız.',
    gradedAt: serverTimestamp(),
    gradedBy: instructorName,
    rubricScores: [
      { criterionId: 'c1', points: 90 },
      { criterionId: 'c2', points: 85 },
      { criterionId: 'c3', points: 95 },
      { criterionId: 'c4', points: 95 }
    ],
    annotations: [
      {
        id: 'ann-1',
        startOffset: 45,
        endOffset: 120,
        selectedText: 'büyük dil modellerinin akademik metin üretimindeki rolü ve etik sınırları',
        comment: 'Bu kuramsal iddia için 2024 ve sonrası güncel bir kaynakça atfı (örn. Smith et al.) eklenmelidir.',
        category: 'citation',
        quickMarkLabel: '[Kaynak Eksik]',
        createdAt: new Date().toISOString(),
        createdBy: instructorName
      },
      {
        id: 'ann-2',
        startOffset: 250,
        endOffset: 335,
        selectedText: '%15 intihal tavanı ve Sentinel doğrulama mekanizmaları',
        comment: 'YÖK mevzuat metnini doğrudan aktarırken çift tırnak ("...") içine alınız.',
        category: 'plagiarism',
        quickMarkLabel: '[Tırnak Eksik]',
        createdAt: new Date().toISOString(),
        createdBy: instructorName
      },
      {
        id: 'ann-3',
        startOffset: 410,
        endOffset: 485,
        selectedText: 'doğrudan aktarılan blok tanımlar tırnak içinde belirtilmiş',
        comment: 'Paragraf sonundaki nedensellik bağlacını güçlendiriniz.',
        category: 'style',
        quickMarkLabel: '[İfade Güçlendir]',
        createdAt: new Date().toISOString(),
        createdBy: instructorName
      }
    ],
    digitalReceipt: {
      sha256: 'a7c93e4f8b2d1c5e6a9f0b3d5e7c1a2f4b6d8e0c2a4f6b8d0e2c4a6f8b0d2e4c',
      submittedAt: new Date().toISOString(),
      textLength: textAhmet.length,
      academicIntegrityLocked: true,
      isolationProtocol: 'Strict-Academic-Partitioning-v1'
    },
    academicIntegrityLocked: true,
    telemetry: {
      totalTypingTimeMs: 7200000,
      pasteCount: 2,
      pastedCharCount: 220,
      typedCharCount: textAhmet.length - 220,
      deleteCount: 142,
      pasteRatio: 0.12,
      processScore: 94,
      authorshipStatus: 'verified_organic',
      legitimateQuotesCount: 2
    },
    createdAt: serverTimestamp(),
    scoredAt: serverTimestamp(),
    scoredBy: 'client'
  };
  await setDoc(doc(db, 'classes', DEMO_CLASS_ID, 'assignments', DEMO_ASSIGNMENT_ID, 'submissions', studentAhmetUid), subAhmet);

  const textMehmet = `Giriş ve Kuramsal Çerçeve:
Bu araştırmada, büyük dil modellerinin akademik metin üretimindeki rolü ve etik sınırları detaylıca incelenmektedir. Yapay zeka destekli araştırma süreçleri, literatür taramasını hızlandırmakta ancak veri kirliliği ve halüsinasyon riskini beraberinde getirmektedir.

Literatür Taraması ve Sentinel Doğrulaması:
Bu nedenle YÖK ve üniversite enstitüleri tarafından belirlenen %15 intihal tavanı ve Sentinel doğrulama mekanizmaları akademik bütünlüğün korunmasında kritik rol oynamaktadır. Araştırmacının bilgiye ulaşma sürecinde doğrudan aktarılan blok tanımlar tırnak içinde belirtilmiştir.`;

  const subMehmet: Omit<Submission, 'id'> = {
    studentId: DEMO_STUDENT_MEHMET_ID,
    studentName: 'Mehmet Demir',
    studentEmail: 'ogrenci2@deneme.com',
    title: 'Akademik Araştırmada YZ Riskleri ve Literatür Özeti',
    fileName: 'mehmet_demir_odev1.docx',
    text: textMehmet,
    status: 'scored',
    similarityScore: 42,
    aiScore: 35,
    academicIntegrityLocked: true,
    hasInternalGeneratorMatch: true,
    internalGeneratorSimilarity: 94,
    sources: [
      {
        title: 'Platform İçi Sentetik Üretim İzi (Humanizer Vault)',
        url: 'internal-vault://synthetic-generator/demo-vault-doc',
        similarity: 0.94,
        snippet: 'Bu metin platformun İnsanlaştırma / StyleMaster motoru tarafından üretilmiş bir çıktıyla %94 parmak izi eşleşmesi göstermektedir.',
        matchedText: 'Platform içi sentetik parmak izi eşleşmesi',
        trust: 'high',
        matchGroup: 'internal_generator'
      }
    ],
    draftCheckCount: 2,
    telemetry: {
      totalTypingTimeMs: 12000,
      pasteCount: 1,
      pastedCharCount: textMehmet.length,
      typedCharCount: 0,
      deleteCount: 0,
      pasteRatio: 0.98,
      processScore: 24,
      authorshipStatus: 'unverified_bulk_paste',
      legitimateQuotesCount: 0
    },
    createdAt: serverTimestamp(),
    scoredAt: serverTimestamp(),
    scoredBy: 'client'
  };
  await setDoc(doc(db, 'classes', DEMO_CLASS_ID, 'assignments', DEMO_ASSIGNMENT_ID, 'submissions', DEMO_STUDENT_MEHMET_ID), subMehmet);

  await setDoc(doc(db, 'users', appUser.uid, 'classEnrollments', DEMO_CLASS_ID), {
    classId: DEMO_CLASS_ID,
    joinedAt: serverTimestamp()
  });

  return { classId: DEMO_CLASS_ID, assignmentId: DEMO_ASSIGNMENT_ID };
}

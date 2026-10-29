import type { SubscriptionPlan } from './index';
import type { PlagiarismSource } from '../services/sentinelService';

export interface ClassRoom {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  name: string;
  subject?: string;
  term?: string;
  classCode: string;
  enrollmentKey: string;
  studentCount: number;
  archived?: boolean;
  createdAt: any;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description?: string;
  weight: number; // Yüzde ağırlık (örn: 30)
  maxPoints: number; // Azami puan (örn: 100)
}

export interface RubricScoreItem {
  criterionId: string;
  points: number; // Verilen puan
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  instructions?: string;
  startDate?: string;
  dueDate?: string;
  // D2: depo varsayılanı AÇIK; ödev başına kapatılabilir (KVKK aydınlatması 21.8'e bak)
  noRepository: boolean;
  // D4: Öğrencinin benzerlik raporunu görüp göremeyeceği (varsayılan: true)
  allowStudentViewReport?: boolean;
  // D5: Süresi geçen ödevlere gecikmiş teslim izni (varsayılan: true)
  allowLateSubmissions?: boolean;
  // D6: Ön teslim taslak kontrol izni (Turnitin Draft Coach / Pre-submission)
  allowDraftCheck?: boolean;
  maxDraftChecks?: number; // Varsayılan: 2
  // Kriter Bazlı Rubrik Tanımı
  rubricCriteria?: RubricCriterion[];
  createdBy: string;
  createdAt: any;
}

export interface Enrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  joinedAt: any;
  addedBy: 'self' | string;
  // B21 Faz 2: eğitmen listesinden eklenen, hesabı olmayan öğrenci (joinClass'ta gerçek uid'li kayda devredilir)
  pending?: boolean;
}

export type SubmissionStatus = 'received' | 'processing' | 'scored' | 'failed';

export interface DigitalReceipt {
  sha256: string;
  submittedAt: string;
  textLength: number;
  academicIntegrityLocked?: boolean;
  isolationProtocol?: string;
}

export interface SubmissionScores {
  similarityScore: number;
  aiScore: number;
  sources: PlagiarismSource[];
  sentenceScores?: any[];
  metrics?: any;
  hasInternalGeneratorMatch?: boolean;
  internalGeneratorSimilarity?: number;
  watermarkResult?: WatermarkAnalysisResult;
  hasWatermarkSignature?: boolean;
  watermarkScore?: number;
  hasDisclosureDiscrepancy?: boolean;
  disclosureDiscrepancyReason?: string;
}

export type AuthorshipStatus = 'verified_organic' | 'mixed_with_citations' | 'unverified_bulk_paste' | 'file_upload';

export interface DocxForensicReport {
  totalEditingTimeMinutes: number;
  revisionNumber: number;
  wordCount: number;
  wpm: number;
  application?: string;
  created?: string;
  modified?: string;
  creator?: string;
  lastModifiedBy?: string;
  isSuspiciousBulkPaste: boolean;
  forensicReason?: string;
  addinSessionId?: string;
  addinStudentUid?: string;
  isAddinVerified?: boolean;
  hasClipboardToken?: boolean;
  clipboardOriginAccount?: string;
}

export interface WritingTelemetry {
  totalTypingTimeMs: number;
  pasteCount: number;
  pastedCharCount: number;
  typedCharCount: number;
  deleteCount: number;
  pasteRatio: number; // 0..1
  processScore: number; // 0..100
  authorshipStatus: AuthorshipStatus;
  legitimateQuotesCount?: number;
  docxForensics?: DocxForensicReport;
}

export type AIDisclosureLevel = 'none' | 'assisted' | 'generated';

export interface AICategoryDisclosure {
  level: AIDisclosureLevel;
  tools?: string[];
  notes?: string;
}

export interface AIDisclosureMatrix {
  literatureSearch: AICategoryDisclosure;
  proofreading: AICategoryDisclosure;
  ideation: AICategoryDisclosure;
  dataAnalysis: AICategoryDisclosure;
  textDrafting: AICategoryDisclosure;
  toolsUsed: string[];
  statementText?: string;
  isCertified: boolean;
  certifiedAt: string;
}

export interface WatermarkAnalysisResult {
  watermarkScore: number; // 0..100
  hasWatermarkSignature: boolean;
  confidence: 'none' | 'low' | 'moderate' | 'high' | 'definitive';
  greenTokenRatio: number; // 0..1
  entropyVariance: number;
  detectedPatternCount: number;
  details: string;
}

export interface SubmissionAnnotation {
  id: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  comment: string;
  category?: 'grammar' | 'citation' | 'plagiarism' | 'style' | 'general';
  quickMarkLabel?: string;
  createdAt: string;
  createdBy: string;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  // B21 Faz 2: teslimi fiilen gönderen kullanıcı (kendi teslimi = studentId; adına teslimde = eğitmen uid)
  submittedBy?: string;
  title: string;
  fileName?: string;
  text: string;
  storagePath?: string;
  status: SubmissionStatus;
  excludedSourceUrls?: string[];
  digitalReceipt?: DigitalReceipt;
  createdAt: any;
  similarityScore?: number;
  aiScore?: number;
  sources?: PlagiarismSource[];
  sentenceScores?: any[];
  metrics?: any;
  scoredAt?: any;
  // B21 Faz 2: skorun üretildiği yer — sunucu-tarafı CF (asıl) veya istemci yedeği
  scoredBy?: 'server' | 'client';
  // Eğitmen değerlendirmesi ve notlandırma
  grade?: number;
  feedback?: string;
  gradedAt?: any;
  gradedBy?: string;
  rubricScores?: RubricScoreItem[];
  // Satır içi öğretmen notları ve QuickMarks
  annotations?: SubmissionAnnotation[];
  // Gecikmiş teslim bilgisi
  isLate?: boolean;
  lateDurationMinutes?: number;
  noRepository?: boolean;
  academicIntegrityLocked?: boolean;
  hasInternalGeneratorMatch?: boolean;
  internalGeneratorSimilarity?: number;
  telemetry?: WritingTelemetry;
  docxForensics?: DocxForensicReport;
  aiDisclosure?: AIDisclosureMatrix;
  watermarkResult?: WatermarkAnalysisResult;
  hasWatermarkSignature?: boolean;
  watermarkScore?: number;
  hasDisclosureDiscrepancy?: boolean;
  disclosureDiscrepancyReason?: string;
  // Ön teslim taslak sayacı
  draftCheckCount?: number;
  lastDraftScores?: {
    similarityScore: number;
    aiScore: number;
    checkedAt: string;
  };
  forwardedToInstitute?: boolean;
  forwardedToInstituteAt?: string;
  instituteDecision?: 'pending' | 'approved' | 'revision_required' | 'rejected';
  instituteNotes?: string;
}

export interface RepositoryEntry {
  id: string;
  classId: string;
  assignmentId: string;
  assignmentTitle?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  shingles: string[];
  sampleSnippet?: string;
  createdAt: any;
}

// D3: teslim bazlı kota, mevcut karakter kotalarına (PLAN_LIMITS) ek katmandır
export const SUBMISSION_LIMITS: Record<SubscriptionPlan, number> = {
  free: 10,
  pro: 100,
  premium: 500
};

export interface ClassroomTabData {
  teaching: ClassRoom[];
  enrolled: ClassRoom[];
}

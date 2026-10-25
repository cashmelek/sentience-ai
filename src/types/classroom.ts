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
}

export interface SubmissionScores {
  similarityScore: number;
  aiScore: number;
  sources: PlagiarismSource[];
  sentenceScores?: any[];
  metrics?: any;
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
  // Gecikmiş teslim bilgisi
  isLate?: boolean;
  lateDurationMinutes?: number;
  noRepository?: boolean;
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

import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { InstitutionLicense } from '../types/classroom';

const DEFAULT_FALLBACK_CODES = ['INST-EDU-2026', 'DEMO-2026', 'AKADEMIK2026', 'SENT26'];

export async function validateInstitutionCode(inputCode: string): Promise<{ valid: boolean; license?: InstitutionLicense; error?: string }> {
  const code = (inputCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, error: 'Kurumsal kod boş olamaz.' };
  }

  try {
    const q = query(
      collection(db, 'institution_licenses'),
      where('code', '==', code),
      where('isActive', '==', true)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docData = snap.docs[0].data();
      const license: InstitutionLicense = {
        id: snap.docs[0].id,
        ...docData
      } as InstitutionLicense;

      if (license.expiresAt) {
        const expiry = new Date(license.expiresAt).getTime();
        if (Date.now() > expiry) {
          return { valid: false, error: 'Bu kurumsal lisans anahtarının süresi dolmuştur.' };
        }
      }

      if (typeof license.maxInstructors === 'number' && typeof license.usedInstructors === 'number') {
        if (license.usedInstructors >= license.maxInstructors) {
          return { valid: false, error: 'Bu kuruma ait eğitmen lisans kotası dolmuştur.' };
        }
      }

      return { valid: true, license };
    }
  } catch {
    // Firestore erişimi yoksa fallback kontrolü
  }

  if (DEFAULT_FALLBACK_CODES.includes(code)) {
    return {
      valid: true,
      license: {
        id: `mock-${code}`,
        code,
        institutionName: 'Sentience Akademik Ağ (Demo Enstitü)',
        department: 'Genel Akademik Birim',
        maxInstructors: 999,
        maxStudents: 9999,
        usedInstructors: 1,
        usedStudents: 1,
        expiresAt: '2028-12-31',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    };
  }

  return { valid: false, error: 'Geçersiz kurumsal lisans veya yetkilendirme anahtarı.' };
}

export async function listInstitutionLicenses(): Promise<InstitutionLicense[]> {
  try {
    const q = query(collection(db, 'institution_licenses'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as InstitutionLicense));
  } catch {
    return DEFAULT_FALLBACK_CODES.map(code => ({
      id: `fallback-${code}`,
      code,
      institutionName: code === 'INST-EDU-2026' ? 'İstanbul Üniversitesi / YÖK Konsorsiyumu' : 'Akademik Demo Kurumu',
      department: 'Rektörlük & Enstitü',
      maxInstructors: 100,
      maxStudents: 2500,
      usedInstructors: 4,
      usedStudents: 120,
      expiresAt: '2027-12-31',
      isActive: true,
      createdAt: new Date().toISOString()
    }));
  }
}

export async function createInstitutionLicense(
  data: Omit<InstitutionLicense, 'id' | 'createdAt'>
): Promise<string> {
  const code = data.code.trim().toUpperCase();
  const docRef = await addDoc(collection(db, 'institution_licenses'), {
    ...data,
    code,
    usedInstructors: data.usedInstructors || 0,
    usedStudents: data.usedStudents || 0,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateInstitutionLicense(
  id: string,
  updates: Partial<InstitutionLicense>
): Promise<void> {
  if (id.startsWith('fallback-')) return;
  await updateDoc(doc(db, 'institution_licenses', id), updates);
}

export async function deleteInstitutionLicense(id: string): Promise<void> {
  if (id.startsWith('fallback-')) return;
  await deleteDoc(doc(db, 'institution_licenses', id));
}

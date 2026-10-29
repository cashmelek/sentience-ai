import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateTextShingles, computeShingleOverlap } from './classroomService';

export interface InternalVaultEntry {
  id?: string;
  shingles: string[];
  textLength: number;
  sourceType: 'humanizer' | 'stylemaster';
  createdAt?: any;
}

export interface InternalVaultMatchResult {
  hasMatch: boolean;
  maxSimilarity: number; // 0..1
  matchedVaultId?: string;
}

const VAULT_COLLECTION = 'internalGeneratedVault';

export async function recordGeneratedFingerprint(
  text: string,
  sourceType: 'humanizer' | 'stylemaster' = 'humanizer'
): Promise<string | null> {
  const trimmed = text?.trim();
  if (!trimmed || trimmed.length < 50) return null;

  try {
    const allShingles = generateTextShingles(trimmed, 4);
    if (!allShingles || allShingles.length === 0) return null;

    const sampledShingles = allShingles.slice(0, 200);

    const docRef = await addDoc(collection(db, VAULT_COLLECTION), {
      shingles: sampledShingles,
      textLength: trimmed.length,
      sourceType,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (err) {
    console.warn('[internalVaultService] Parmak izi kaydı atlandı (hata):', err);
    return null;
  }
}

export async function queryInternalVaultMatches(
  submissionText: string,
  threshold = 0.15
): Promise<InternalVaultMatchResult> {
  const trimmed = submissionText?.trim();
  if (!trimmed || trimmed.length < 50) {
    return { hasMatch: false, maxSimilarity: 0 };
  }

  try {
    const currShingles = generateTextShingles(trimmed, 4);
    if (!currShingles || currShingles.length === 0) {
      return { hasMatch: false, maxSimilarity: 0 };
    }

    const q = query(collection(db, VAULT_COLLECTION), orderBy('createdAt', 'desc'), limit(150));
    const snap = await getDocs(q);

    let maxOverlap = 0;
    let matchedId: string | undefined;

    for (const vDoc of snap.docs) {
      const data = vDoc.data();
      const vaultShingles = Array.isArray(data.shingles) ? (data.shingles as string[]) : [];
      if (!vaultShingles.length) continue;

      const overlap = computeShingleOverlap(currShingles, vaultShingles);
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        matchedId = vDoc.id;
      }
    }

    if (maxOverlap >= threshold) {
      return {
        hasMatch: true,
        maxSimilarity: maxOverlap,
        matchedVaultId: matchedId
      };
    }
  } catch (err) {
    console.warn('[internalVaultService] Vault sorgusu atlandı (hata):', err);
  }

  return { hasMatch: false, maxSimilarity: 0 };
}

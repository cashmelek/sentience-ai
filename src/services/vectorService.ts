/**
 * Sentience AI - Vektör Veritabanı Servisi (Sentinel Semantik Hafızası)
 *
 * Embedding motoru: Xenova/paraphrase-multilingual-MiniLM-L12-v2
 *   50+ dil (Türkçe dahil), 384 boyut, cosine uyumlu, yerel browser çalışır.
 *
 * Gelecek: LiteRT-LM üzerinden EmbeddingGemma entegrasyonu (bkz. vectorEngine.ts)
 */

import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { vectorEngine } from './vectorEngine';

export interface TextChunk {
  text: string;
  index: number;
  metadata: {
    projectId?: string;
    userId: string;
    source?: string;
    timestamp: any;
  };
}

const IS_VECTOR_ENABLED = true;

export const chunkText = (text: string, chunkSize: number = 800): string[] => {
  if (!text) return [];
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};

export const generateEmbedding = async (
  text: string,
  provider: 'cloud' | 'local' | 'browser' = 'cloud'
): Promise<number[]> => {
  return vectorEngine.generateEmbedding(text, provider);
};

export const saveToVectorStore = async (
  text: string,
  userId: string,
  projectId?: string
): Promise<void> => {
  if (!text || !userId) return;
  const chunks = chunkText(text);
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);
    try {
      await addDoc(collection(db, 'vector_embeddings'), {
        userId,
        projectId: projectId || null,
        text: chunks[i],
        vector: embedding,
        dimensions: vectorEngine.dimensions,
        chunkIndex: i,
        createdAt: serverTimestamp(),
        engine: 'transformers-js',
        model: 'paraphrase-multilingual-MiniLM-L12-v2',
      });
    } catch (err) {
      console.error('[VectorStore] Kayıt hatası:', err);
    }
  }
};

export interface SemanticMatch {
  text: string;
  similarity: number;
  projectId: string | null;
  chunkIndex: number;
}

/**
 * Firestore vector_embeddings koleksiyonunda semantik benzerlik araması yapar.
 * Kullanıcının geçmiş projeleriyle kosinüs benzerliği karşılaştırır.
 *
 * threshold: 0.82 → yüksek güvenilirlik eşiği (yanlış pozitif oranı düşük)
 * limit: 5 → Sentinel kaynak listesine eklenecek maks. vektör eşleşmesi
 */
export const semanticSearch = async (
  queryText: string,
  userId: string,
  threshold = 0.82,
  limit = 5
): Promise<SemanticMatch[]> => {
  if (!IS_VECTOR_ENABLED || !queryText || !userId) return [];
  try {
    const { getDocs, query, where, orderBy } = await import('firebase/firestore');
    const queryVec = await generateEmbedding(queryText);

    const snap = await getDocs(
      query(
        collection(db, 'vector_embeddings'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    );

    const results: SemanticMatch[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!Array.isArray(d.vector) || d.vector.length !== queryVec.length) return;
      const sim = vectorEngine.cosineSimilarity(queryVec, d.vector as number[]);
      if (sim >= threshold) {
        results.push({
          text: d.text as string,
          similarity: sim,
          projectId: d.projectId as string | null,
          chunkIndex: d.chunkIndex as number,
        });
      }
    });

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, limit);
  } catch (err) {
    console.error('[SemanticSearch] Hata:', err);
    return [];
  }
};

/**
 * Sentience AI - Merkezi Vektör Motoru (Universal Vector Engine)
 *
 * Aktif model: Xenova/paraphrase-multilingual-MiniLM-L12-v2
 *   - 384 boyutlu, ~115 MB, 50+ dil (Türkçe dahil), cosine uyumlu
 *   - Kaynak: https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
 *
 * Gelecek yükseltme notu (Gemma 2 Embedding):
 *   google/gemma-2-2b tabanlı EmbeddingGemma modelleri ~3.5 GB ağırlık gerektirir,
 *   browser ortamında WebGPU zorunlu ve pratik değildir. Kullanım hazır olduğunda
 *   LiteRT-LM (@tensorflow/tfjs + WASM) pipeline ile entegre edilecek.
 *   Mevcut çok dilli model bu aşamada Türkçe metinler için yeterli kalitededir.
 */

import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

class VectorEngine {
  private static instance: VectorEngine;
  private extractor: any = null;
  private readonly modelName = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
  public readonly dimensions = 384;

  private constructor() {}

  public static getInstance(): VectorEngine {
    if (!VectorEngine.instance) {
      VectorEngine.instance = new VectorEngine();
    }
    return VectorEngine.instance;
  }

  private async init() {
    if (!this.extractor) {
      this.extractor = await pipeline('feature-extraction', this.modelName);
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      await this.init();
      const output = await this.extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('[VectorEngine] Embedding hatası:', error);
      return new Array(this.dimensions).fill(0);
    }
  }

  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }
}

export const vectorEngine = VectorEngine.getInstance();

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
import { apiKeyManager } from './apiKeyManager';
import { getLocalModelConfig } from './localModelService';

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

  public async generateCloudEmbedding(text: string): Promise<number[]> {
    const key = apiKeyManager.getGeminiKey();
    if (!key) throw new Error("Aktif Gemini API anahtarı bulunamadı");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Embedding API HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.embedding?.values || [];
  }

  public async generateLocalEmbedding(text: string): Promise<number[]> {
    const config = getLocalModelConfig();
    const endpoint = config.baseUrl.replace(/\/v1$/, '');
    const res = await fetch(`${endpoint}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'bge-m3',
        prompt: text
      })
    });
    if (!res.ok) {
      throw new Error(`Yerel Ollama embedding hatası: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.embedding || [];
  }

  public async generateBrowserEmbedding(text: string): Promise<number[]> {
    await this.init();
    const output = await this.extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  public async generateEmbedding(text: string, provider: 'cloud' | 'local' | 'browser' = 'cloud'): Promise<number[]> {
    try {
      if (provider === 'cloud') {
        try {
          return await this.generateCloudEmbedding(text);
        } catch (cloudErr) {
          console.warn('[VectorEngine] Cloud embedding başarısız, browser motoruna geçiliyor:', cloudErr);
          return await this.generateBrowserEmbedding(text);
        }
      } else if (provider === 'local') {
        try {
          return await this.generateLocalEmbedding(text);
        } catch (localErr) {
          console.warn('[VectorEngine] Yerel Ollama embedding başarısız, browser motoruna geçiliyor:', localErr);
          return await this.generateBrowserEmbedding(text);
        }
      }
      return await this.generateBrowserEmbedding(text);
    } catch (error) {
      console.error('[VectorEngine] Embedding hatası:', error);
      return new Array(this.dimensions).fill(0);
    }
  }

  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
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

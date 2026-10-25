import type { WorkerRequest, WorkerResponse } from './worker';
import type { TextFeatureSet } from './textFeatures';
import type { MLAnalysisResult } from '../services/mlService';

class MLWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
  private isSupported = typeof window !== 'undefined' && typeof Worker !== 'undefined';

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (!this.isSupported) return;
    try {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, success, data, error } = e.data;
        const entry = this.pending.get(id);
        if (!entry) return;
        this.pending.delete(id);
        if (success) {
          entry.resolve(data);
        } else {
          entry.reject(new Error(error || 'Worker hatası'));
        }
      };
      this.worker.onerror = () => {
        this.worker = null;
      };
    } catch {
      this.worker = null;
    }
  }

  public async runTask<T>(type: WorkerRequest['type'], text: string): Promise<T> {
    if (!this.worker) {
      throw new Error('Worker devrede değil');
    }

    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ id, type, text });
    });
  }
}

export const mlWorkerClient = new MLWorkerClient();

export async function runWorkerDeepMLAnalysis(text: string): Promise<MLAnalysisResult | null> {
  try {
    return await mlWorkerClient.runTask<MLAnalysisResult>('DEEP_ML_ANALYSIS', text);
  } catch {
    return null;
  }
}

export async function runWorkerTextFeatures(text: string): Promise<TextFeatureSet | null> {
  try {
    return await mlWorkerClient.runTask<TextFeatureSet>('ANALYZE_FEATURES', text);
  } catch {
    return null;
  }
}

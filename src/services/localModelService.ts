import { GoogleGenAI } from '@google/genai';
import { apiKeyManager } from './apiKeyManager';

export interface LocalModelConfig {
  baseUrl: string;
  modelName: string;
  apiKey?: string;
  temperature?: number;
  topP?: number;
}

export const getLocalModelConfig = (): LocalModelConfig => {
  const envUrl = (import.meta as any).env?.VITE_LOCAL_MODEL_URL;
  const envModel = (import.meta as any).env?.VITE_LOCAL_MODEL_NAME;
  const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('sentience_local_model_url') : null;
  const localModel = typeof localStorage !== 'undefined' ? localStorage.getItem('sentience_local_model_name') : null;

  return {
    baseUrl: (localUrl || envUrl || 'http://localhost:11434/v1').replace(/\/+$/, ''),
    modelName: localModel || envModel || 'sentience-humanizer:latest',
    temperature: 0.7
  };
};

export const isLocalModelEnabled = (): boolean => {
  const envEnabled = (import.meta as any).env?.VITE_USE_LOCAL_MODEL === 'true';
  const localEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('sentience_use_local_model') === 'true';
  return envEnabled || localEnabled;
};

export const checkLocalModelHealth = async (config?: Partial<LocalModelConfig>): Promise<{ ok: boolean; message: string; models?: string[]; latencyMs?: number }> => {
  const cfg = { ...getLocalModelConfig(), ...config };
  const startTime = performance.now();
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { 'Authorization': `Bearer ${cfg.apiKey}` } : {})
      }
    });
    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      return { ok: false, message: `Sunucu yanit vermedi (HTTP ${res.status})`, latencyMs };
    }

    const data = await res.json();
    const modelList = Array.isArray(data?.data) ? data.data.map((m: any) => m.id || m.name) : [];
    return { ok: true, message: 'Lokal sunucu erisilebilir', models: modelList, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return { ok: false, message: `Lokal sunucuya baglanilamadi: ${err.message || err}`, latencyMs };
  }
};

export const callLocalModelChat = async (
  systemPrompt: string,
  userPrompt: string,
  configOverride?: Partial<LocalModelConfig>
): Promise<string> => {
  const cfg = { ...getLocalModelConfig(), ...configOverride };

  const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { 'Authorization': `Bearer ${cfg.apiKey}` } : {})
    },
    body: JSON.stringify({
      model: cfg.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: cfg.temperature ?? 0.7,
      top_p: cfg.topP ?? 0.95,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Lokal model API hatasi (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Lokal model bos yanit dondurdu.');
  }

  return content;
};

export const testModelInference = async (
  engine: 'gemini' | 'local',
  prompt: string,
  config?: { modelName?: string; temperature?: number; topP?: number }
): Promise<{ output: string; latencyMs: number; error?: string }> => {
  const startTime = performance.now();
  try {
    if (engine === 'local') {
      const output = await callLocalModelChat(
        'Sen bir YZ asistanısın. Kullanıcının sorusuna kısa ve net yanıt ver. Sadece {"response": "..."} formatında JSON dön.',
        prompt,
        config
      );
      const latencyMs = Math.round(performance.now() - startTime);
      return { output, latencyMs };
    } else {
      const apiKey = apiKeyManager.getGeminiKey();
      if (!apiKey) throw new Error('Kullanılabilir aktif Gemini API anahtarı yok.');
      const client = new GoogleGenAI({ apiKey });
      const res = await client.models.generateContent({
        model: config?.modelName || 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: config?.temperature ?? 0.7,
          topP: config?.topP ?? 0.95,
          maxOutputTokens: 120
        }
      });
      const latencyMs = Math.round(performance.now() - startTime);
      return { output: res.text || '', latencyMs };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return { output: '', latencyMs, error: err.message || 'Model testi başarısız.' };
  }
};

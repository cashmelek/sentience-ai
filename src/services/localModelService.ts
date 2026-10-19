export interface LocalModelConfig {
  baseUrl: string;
  modelName: string;
  apiKey?: string;
  temperature?: number;
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

export const checkLocalModelHealth = async (config?: Partial<LocalModelConfig>): Promise<{ ok: boolean; message: string; models?: string[] }> => {
  const cfg = { ...getLocalModelConfig(), ...config };
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { 'Authorization': `Bearer ${cfg.apiKey}` } : {})
      }
    });

    if (!res.ok) {
      return { ok: false, message: `Sunucu yanit vermedi (HTTP ${res.status})` };
    }

    const data = await res.json();
    const modelList = Array.isArray(data?.data) ? data.data.map((m: any) => m.id || m.name) : [];
    return { ok: true, message: 'Lokal sunucu erisilebilir', models: modelList };
  } catch (err: any) {
    return { ok: false, message: `Lokal sunucuya baglanilamadi: ${err.message || err}` };
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

import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    return (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY || '';
  } catch {
    return (import.meta as any).env.VITE_GEMINI_API_KEY || '';
  }
};

const apiKey = getApiKey();
export const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-initialization' });

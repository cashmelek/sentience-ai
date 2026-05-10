import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.GOOGLE_GENAI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENAI_API_KEY = process.env.GEMINI_API_KEY;
}

const ai = genkit({
  plugins: [googleAI()],
});

export const summarizeFlow = ai.defineFlow(
  {
    name: "summarizeFlow",
    inputSchema: z.object({
      text: z.string().min(20),
    }),
    outputSchema: z.object({
      summary: z.string(),
    }),
  },
  async ({ text }) => {
    const response = await ai.generate({
      model: googleAI.model("gemini-2.5-flash"),
      prompt: `Metni Türkçe, kısa ve maddeli biçimde özetle:\n\n${text}`,
    });

    return {
      summary: response.text ?? "",
    };
  }
);

export const humanizeFlow = ai.defineFlow(
  {
    name: "humanizeFlow",
    inputSchema: z.object({
      text: z.string(),
      tone: z.string(),
      intensity: z.number(),
    }),
    outputSchema: z.object({
      humanizedText: z.string(),
      aiScore: z.number(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model("gemini-2.5-flash"),
      prompt: `Metni '${input.tone}' tonunda ve %${input.intensity} yoğunlukta insanileştir: ${input.text}`,
    });

    // Basit bir skorlama mantığı (Genkit ile daha karmaşık hale getirilebilir)
    return {
      humanizedText: response.text ?? "",
      aiScore: 0.1, // Örnek değer
    };
  }
);

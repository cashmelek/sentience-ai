import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as dotenv from "dotenv";

// Load env variables
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("HATA: GEMINI_API_KEY veya VITE_GEMINI_API_KEY bulunamadı. Lütfen .env.local dosyanızı kontrol edin.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const filePath = "sentience_tuning_data.jsonl";

  if (!fs.existsSync(filePath)) {
    console.error(`HATA: ${filePath} dosyası bulunamadı.`);
    console.error("Lütfen önce uygulamadaki 'Eğitim Verisi İndir' butonuna basarak dosyayı indirin ve bu klasöre koyun.");
    process.exit(1);
  }

  console.log("1. Eğitim dosyası (JSONL) yükleniyor...");
  try {
    // Note: The new SDK might use ai.files.upload or similar
    // @ts-ignore
    const file = await ai.files.upload({
      file: filePath,
      config: {
        mimeType: "application/jsonl",
      }
    });

    console.log(`Dosya yüklendi! URI: ${file.uri}`);

    console.log("2. Model eğitimi (Tuning) başlatılıyor...");
    // @ts-ignore
    const tuningJob = await ai.tunings.create({
      baseModel: "models/gemini-2.5-flash",
      displayName: "Sentience-AI-Tuned",
      trainingData: {
        fileId: file.name
      }
    });

    console.log("=========================================");
    console.log("BAŞARILI! Eğitim süreci başlatıldı.");
    console.log("Model Adı:", tuningJob.name);
    console.log("=========================================");
    console.log("Eğitimin tamamlanması biraz zaman alabilir.");
    console.log("Eğitim bittiğinde, projenizdeki .env.local dosyasına şu satırı ekleyin/değiştirin:");
    console.log(`VITE_GEMINI_MODEL=${tuningJob.name}`);

  } catch (error: any) {
    console.error("Bir hata oluştu:", error.message || error);
  }
}

main();

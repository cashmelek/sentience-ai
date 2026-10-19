import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const rawApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const apiKey = rawApiKey.split(",")[0].trim();

if (!apiKey) {
  console.error("HATA: GEMINI_API_KEY bulunamadi. .env.local dosyasini kontrol edin.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const MIN_RECORDS = 200;
const BASE_MODEL = "models/gemini-2.0-flash-lite";

async function main() {
  const filePath = "sentience_tuning_data.jsonl";
  const statsPath = "sentience_tuning_stats.json";

  if (!fs.existsSync(filePath)) {
    console.error(`HATA: ${filePath} bulunamadi.`);
    console.error("Once: npx ts-node scripts/generate_training_data.ts");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  console.log(`Yuklenen kayit sayisi: ${lines.length}`);

  if (lines.length < MIN_RECORDS) {
    console.error(`HATA: Minimum ${MIN_RECORDS} kayit gerekli, mevcut: ${lines.length}`);
    console.error("Daha fazla metin insanlastirarak veri havuzunu genisletin.");
    process.exit(1);
  }

  for (const [i, line] of lines.entries()) {
    try {
      JSON.parse(line);
    } catch {
      console.error(`HATA: Satir ${i + 1} gecersiz JSON: ${line.slice(0, 80)}`);
      process.exit(1);
    }
  }
  console.log("JSON dogrulama: Tum satirlar gecerli.");

  console.log("\n1. Egitim dosyasi Gemini'ye yukleniyor...");
  try {
    // @ts-ignore
    const file = await ai.files.upload({
      file: filePath,
      config: { mimeType: "application/jsonl" }
    });

    console.log(`Dosya yuklendi. URI: ${file.uri}`);

    console.log("\n2. Fine-tuning baslatiliyor...");
    const examples = lines.map(line => {
      const entry = JSON.parse(line);
      return {
        textInput: entry.contents?.[0]?.parts?.[0]?.text || "",
        output: entry.contents?.[1]?.parts?.[0]?.text || ""
      };
    });

    // @ts-ignore
    const tuningJob = await ai.tunings.tune({
      baseModel: BASE_MODEL,
      trainingDataset: { examples },
      config: {
        tunedModelDisplayName: `Sentience-AI-${Date.now()}`
      }
    });

    const jobInfo = {
      started_at: new Date().toISOString(),
      job_name: tuningJob.name,
      base_model: BASE_MODEL,
      record_count: lines.length,
    };

    fs.writeFileSync("tuning_job.json", JSON.stringify(jobInfo, null, 2));

    console.log("\n=========================================");
    console.log("BASARILI! Fine-tuning basladi.");
    console.log("Job Name:", tuningJob.name);
    console.log("Kayit sayisi:", lines.length);
    console.log("=========================================");
    console.log("Egitim bitince .env.local'a ekle:");
    console.log(`VITE_GEMINI_MODEL=${tuningJob.name}`);

    if (fs.existsSync(statsPath)) {
      const stats = JSON.parse(fs.readFileSync(statsPath, "utf-8"));
      console.log("\nKalite istatistikleri:");
      console.log("  Toplam cekilen:", stats.total_fetched);
      console.log("  Kalite secti:", stats.passed, `(%${Math.round(stats.passed / stats.total_fetched * 100)})`);
    }

  } catch (error: any) {
    const msg = error.message || String(error);
    if (msg.includes("501") || msg.includes("UNIMPLEMENTED")) {
      console.warn("\n[BILGI] Google Gemini Developer API uzerinde dogrudan programmatic fine-tuning API anahtarlari icin kisitlanmis veya Vertex AI / AI Studio Web UI'a tasinmistir.");
      console.warn("Egitimi hemen baslatmak icin 2 secenek:");
      console.warn("1. Google AI Studio (https://aistudio.google.com/):");
      console.warn("   'Tune a model' veya 'Create tuned model' seceneginden 'sentience_tuning_data.jsonl' dosyasini yukleyin.");
      console.warn("2. Google Cloud Vertex AI (sentience-ai-free-2026 projesi):");
      console.warn("   Model Garden > Gemini Supervised Tuning uzerinden JSONL'i GCS'e yukleyip egitim baslatin.");
      console.warn("\nHazirlanan veri seti: sentience_tuning_data.jsonl (210 kayit)");
      process.exit(0);
    }
    console.error("Hata:", msg);
    process.exit(1);
  }
}

main();

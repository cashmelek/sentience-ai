import * as fs from "fs";
import * as path from "path";

const INPUT_JSONL = "sentience_tuning_data.jsonl";
const OUTPUT_DIR = "datasets";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(INPUT_JSONL)) {
  console.error(`HATA: ${INPUT_JSONL} bulunamadi.`);
  console.error("Once calistirin: npm run generate:training -- --synthetic");
  process.exit(1);
}

const lines = fs.readFileSync(INPUT_JSONL, "utf-8").split("\n").filter(l => l.trim());
console.log(`Okunan kayit sayisi: ${lines.length}`);

const alpacaData: any[] = [];
const sharegptData: any[] = [];
const openaiChatLines: string[] = [];

const SYSTEM_INSTRUCTION = "Sen profesyonel bir akademik ve edebi metin insanlastirma uzmanisin. Sana verilen metni Copyleaks ve Turnitin tespit sistemlerinde sifir YZ skoru alacak sekilde, dogal Turkce ritmi (burstiness) ve sifir klise (slop) ile yeniden yazarsin.";

for (const line of lines) {
  try {
    const parsed = JSON.parse(line);
    const userText = parsed.contents?.[0]?.parts?.[0]?.text || "";
    const modelText = parsed.contents?.[1]?.parts?.[0]?.text || "";

    if (!userText || !modelText) continue;

    // 1. Alpaca Formati (Unsloth, Axolotl, LLaMA-Factory)
    alpacaData.push({
      instruction: SYSTEM_INSTRUCTION,
      input: userText,
      output: modelText
    });

    // 2. ShareGPT Formati (FastChat, Axolotl, vLLM)
    sharegptData.push({
      conversations: [
        { from: "system", value: SYSTEM_INSTRUCTION },
        { from: "human", value: userText },
        { from: "gpt", value: modelText }
      ]
    });

    // 3. OpenAI Chat JSONL Formati (TRL SFTTrainer, Ollama, HuggingFace)
    openaiChatLines.push(JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userText },
        { role: "assistant", content: modelText }
      ]
    }));
  } catch (err) {
    // skip invalid line
  }
}

// Dosyalari kaydet
const alpacaPath = path.join(OUTPUT_DIR, "alpaca_format.json");
const sharegptPath = path.join(OUTPUT_DIR, "sharegpt_format.json");
const openaiPath = path.join(OUTPUT_DIR, "openai_chat_format.jsonl");
const modelfilePath = path.join(OUTPUT_DIR, "Modelfile");

fs.writeFileSync(alpacaPath, JSON.stringify(alpacaData, null, 2), "utf-8");
fs.writeFileSync(sharegptPath, JSON.stringify(sharegptData, null, 2), "utf-8");
fs.writeFileSync(openaiPath, openaiChatLines.join("\n"), "utf-8");

const modelFileContent = `FROM llama3.1:8b

# Sentience AI - Lokal Insanlastirma Model Tanimlamasi
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER stop "<|eot_id|>"
PARAMETER stop "<|end_of_text|>"

SYSTEM """
${SYSTEM_INSTRUCTION}
"""
`;

fs.writeFileSync(modelfilePath, modelFileContent, "utf-8");

console.log("\n=========================================");
console.log("BASARILI! Lokal egitim veri setleri olusturuldu:");
console.log(`1. Alpaca Formati (Unsloth / Axolotl) : ${alpacaPath} (${alpacaData.length} kayit)`);
console.log(`2. ShareGPT Formati (vLLM / FastChat) : ${sharegptPath} (${sharegptData.length} kayit)`);
console.log(`3. OpenAI Chat Formati (TRL / SFT)   : ${openaiPath} (${openaiChatLines.length} kayit)`);
console.log(`4. Ollama Modelfile                   : ${modelfilePath}`);
console.log("=========================================\n");

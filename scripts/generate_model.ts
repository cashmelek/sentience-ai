import * as tf from "@tensorflow/tfjs";
import * as fs from "fs";
import * as path from "path";

async function generateModel() {
  const modelDir = path.join(process.cwd(), "public", "models", "text-classifier");
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 8, inputShape: [3], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
  model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });

  console.log("Model dosyaları oluşturuluyor...");
  
  // Model mimarisini kaydet
  const modelJSON = model.toJSON();
  fs.writeFileSync(path.join(modelDir, "model.json"), JSON.stringify(modelJSON, null, 2));
  
  console.log(`Model şuraya oluşturuldu: ${modelDir}`);
  console.log("Bu dosya artık Firebase Storage'a yüklenmeye hazır.");
}

generateModel().catch(console.error);

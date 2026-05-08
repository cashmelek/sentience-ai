import { simpleReadabilityScore } from "./textFeatures";

const sample =
  "Bu bir örnek metindir. Amaç, metinden özellik çıkarıp basit bir makine öğrenmesi skorlaması üretmektir.";

const score = simpleReadabilityScore(sample);
// eslint-disable-next-line no-console
console.log("ML demo skoru:", score);

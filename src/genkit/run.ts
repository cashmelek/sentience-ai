import { summarizeFlow } from "./index";

const sample = await summarizeFlow({
  text: "Sentience AI, kullanıcının metnini insan diline yakın bir biçimde yeniden yazar, dil bilgisi önerileri üretir ve intihal riskine dair analiz sunar.",
});

// eslint-disable-next-line no-console
console.log("Genkit test sonucu:", sample.summary);

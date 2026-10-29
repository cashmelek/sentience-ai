const vowels = "aeıioöuüAEIİOÖUÜ";
const countSyllablesOld = (word: string): number => {
  let count = 0;
  for (let char of word) {
    if (vowels.includes(char)) count++;
  }
  return Math.max(1, count);
};

const countSyllablesNew = (word: string): number => {
  const count = word.match(/[aeıioöuüAEIİOÖUÜ]/g)?.length || 0;
  return Math.max(1, count);
};

// Based on the user prompt it should use case insensitive flag:
// `word.match(/[aeıioöuü]/gi)?.length || 0`
// BUT wait, Turkish characters "ı" and "İ" are not matched correctly with "i" flag usually.
// Let's test this in JS.
const countSyllablesPrompt = (word: string): number => {
  const count = word.match(/[aeıioöuü]/gi)?.length || 0;
  return Math.max(1, count);
};

console.log("I is matched correctly? ", countSyllablesPrompt("İIıi"));

const testWords = [
  "merhaba", "türkiye", "açık", "üniversite", "bilgisayar", "programlama",
  "öğretmenlik", "mühendislik", "geliştirici", "optimizasyon", "verimlilik",
  "karakteristik", "deneyim", "karşılaştırma", "değerlendirme"
];

const iterations = 5000000;

console.log("Benchmarking...");

const startOld = performance.now();
for (let i = 0; i < iterations; i++) {
  for (let word of testWords) {
    countSyllablesOld(word);
  }
}
const endOld = performance.now();
console.log(`Old approach: ${endOld - startOld}ms`);

const startNew = performance.now();
for (let i = 0; i < iterations; i++) {
  for (let word of testWords) {
    countSyllablesNew(word);
  }
}
const endNew = performance.now();
console.log(`New approach: ${endNew - startNew}ms`);
console.log(`Improvement: ${((endOld - startOld) - (endNew - startNew)) / (endOld - startOld) * 100}%`);

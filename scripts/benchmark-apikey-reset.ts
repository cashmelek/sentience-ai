const mockDocs = Array.from({ length: 50 }).map((_, i) => ({
  ref: `ref-${i}`
}));

async function originalResetAllKeys() {
  const snap = { docs: mockDocs };
  for (const d of snap.docs) {
    // simulate updateDoc delay
    await new Promise(r => setTimeout(r, 20));
  }
}

async function optimizedResetAllKeys() {
  const snap = { docs: mockDocs };

  // Example optimization using Promise.all
  const promises = snap.docs.map(d => new Promise(r => setTimeout(r, 20)));
  await Promise.all(promises);
}

async function runBenchmark() {
  console.log("Benchmarking original resetAllKeys (sequential await)...");
  const startOriginal = performance.now();
  await originalResetAllKeys();
  const endOriginal = performance.now();
  console.log(`Original Time: ${(endOriginal - startOriginal).toFixed(2)} ms`);

  console.log("\nBenchmarking optimized resetAllKeys (Promise.all)...");
  const startOptimized = performance.now();
  await optimizedResetAllKeys();
  const endOptimized = performance.now();
  console.log(`Optimized Time: ${(endOptimized - startOptimized).toFixed(2)} ms`);

  console.log(`\nImprovement: ${((endOriginal - startOriginal) / (endOptimized - startOptimized)).toFixed(2)}x faster`);
}

runBenchmark().catch(console.error);

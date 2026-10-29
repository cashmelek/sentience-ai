import { performance } from 'perf_hooks';

async function updateDoc(ref: any, data: any) {
  return new Promise(resolve => setTimeout(resolve, 10)); // 10ms network latency
}

const docs = Array.from({ length: 50 }).map((_, i) => ({ ref: i }));

async function runSequential() {
  const start = performance.now();
  for (const d of docs) {
    await updateDoc(d.ref, { usageCount: 0, status: 'active' });
  }
  return performance.now() - start;
}

async function runConcurrent() {
  const start = performance.now();
  await Promise.all(docs.map(d => updateDoc(d.ref, { usageCount: 0, status: 'active' })));
  return performance.now() - start;
}

async function run() {
  const seqTime = await runSequential();
  const conTime = await runConcurrent();
  console.log(`Sequential time: ${seqTime.toFixed(2)} ms`);
  console.log(`Concurrent time: ${conTime.toFixed(2)} ms`);
}

run();

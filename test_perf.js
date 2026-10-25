import { performance } from 'perf_hooks';

// Simulate generateEmbedding function
async function generateEmbedding(text, provider) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([Math.random(), Math.random(), Math.random()]);
        }, 50); // Simulate 50ms IO operation
    });
}

// Simulate vectorEngine.cosineSimilarity
const vectorEngine = {
    cosineSimilarity: (v1, v2) => {
        return Math.random();
    }
};

async function testSequential(allSources) {
    const sentenceVecCache = new Map();
    const start = performance.now();

    for (const src of allSources) {
        if (!src.snippet || !src.matchedText) continue;

        let sentVec = sentenceVecCache.get(src.matchedText);
        if (!sentVec) {
          sentVec = await generateEmbedding(src.matchedText, 'cloud');
          sentenceVecCache.set(src.matchedText, sentVec);
        }

        const snippetVec = await generateEmbedding(src.snippet, 'cloud');
        const semScore = vectorEngine.cosineSimilarity(sentVec, snippetVec);
        src.semanticScore = Math.round(semScore * 100);
    }

    const end = performance.now();
    return end - start;
}

async function testConcurrent(allSources) {
    const sentenceVecCache = new Map();
    const start = performance.now();

    // To properly cache, we still need to process items somewhat carefully if they share matchedText.
    // However, if we process them all concurrently, we might make duplicate requests for the same matchedText.
    // Let's implement a promise cache for matchedText.
    const sentVecPromises = new Map();

    const promises = allSources.map(async (src) => {
        if (!src.snippet || !src.matchedText) return;

        let sentVecPromise = sentVecPromises.get(src.matchedText);
        if (!sentVecPromise) {
          sentVecPromise = generateEmbedding(src.matchedText, 'cloud');
          sentVecPromises.set(src.matchedText, sentVecPromise);
        }

        const snippetVecPromise = generateEmbedding(src.snippet, 'cloud');

        const [sentVec, snippetVec] = await Promise.all([sentVecPromise, snippetVecPromise]);

        const semScore = vectorEngine.cosineSimilarity(sentVec, snippetVec);
        src.semanticScore = Math.round(semScore * 100);
    });

    await Promise.all(promises);

    const end = performance.now();
    return end - start;
}

async function run() {
    const allSources = [];
    for (let i = 0; i < 20; i++) {
        allSources.push({
            snippet: `snippet ${i}`,
            matchedText: `matchedText ${i % 5}` // Some duplication to test cache
        });
    }

    const tSeq = await testSequential(JSON.parse(JSON.stringify(allSources)));
    console.log(`Sequential time: ${tSeq.toFixed(2)} ms`);

    const tCon = await testConcurrent(JSON.parse(JSON.stringify(allSources)));
    console.log(`Concurrent time: ${tCon.toFixed(2)} ms`);
}

run();

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs, updateDoc } from 'firebase/firestore';

// Mock firebase configuration before importing components
vi.mock('../../firebase-applet-config.json', () => ({
  default: {
    apiKey: "mock-api-key",
    authDomain: "mock-auth-domain",
    projectId: "mock-project-id",
    storageBucket: "mock-storage-bucket",
    messagingSenderId: "mock-sender-id",
    appId: "mock-app-id"
  }
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApp: vi.fn(),
  getApps: vi.fn(() => []),
}));

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    initializeFirestore: vi.fn(),
    persistentLocalCache: vi.fn(),
    persistentMultipleTabManager: vi.fn(),
    CACHE_SIZE_UNLIMITED: -1,
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

import { apiKeyManager } from '../services/apiKeyManager';

describe('apiKeyManager performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures resetAllKeys execution time', async () => {
    const NUM_DOCS = 100;
    const mockDocs = Array(NUM_DOCS).fill(0).map((_, i) => ({
      ref: `ref-${i}`,
      data: () => ({}),
    }));

    (getDocs as any).mockResolvedValue({ docs: mockDocs });

    // Simulate a 10ms delay for each updateDoc call
    (updateDoc as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 10)));

    const start = performance.now();
    await apiKeyManager.resetAllKeys();
    const end = performance.now();

    const duration = end - start;
    console.log(`[PERF] resetAllKeys took ${duration.toFixed(2)} ms for ${NUM_DOCS} docs`);

    // In serial it would take ~1000ms. In parallel (Promise.all) it should take ~10ms.
    expect(duration).toBeLessThan(200);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { getDocs, getDoc } from 'firebase/firestore';

vi.mock('./src/lib/firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
  increment: vi.fn(),
  writeBatch: vi.fn()
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn()
}));

vi.mock('firebase/storage', () => ({
  getDownloadURL: vi.fn(),
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn()
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn()
}));

import { listMyClasses } from './src/services/classroomService';

describe('Benchmark listMyClasses', () => {
  it('should measure time to fetch N docs', async () => {
    const NUM_DOCS = 50;
    const mockDocs = Array.from({ length: NUM_DOCS }, (_, i) => ({
      data: () => ({ classId: `class_${i}` })
    }));

    const getDocsMock = getDocs as any;
    const getDocMock = getDoc as any;

    getDocsMock.mockImplementation(async (q: any) => {
      // Very hacky but works for mock testing
      if (getDocsMock.mock.calls.length === 1) {
        return { docs: [] };
      }
      return { docs: mockDocs };
    });

    getDocMock.mockImplementation(async (ref: any) => {
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate network latency
      return {
        exists: () => true,
        id: ref ? ref.id : 'mockId',
        data: () => ({ name: 'Mock Class' })
      };
    });

    const start = performance.now();
    await listMyClasses('test_uid');
    const end = performance.now();

    console.log(`Execution time for ${NUM_DOCS} simulated sequential getDoc calls (10ms latency each): ${Math.round(end - start)}ms`);
    expect(end - start).toBeGreaterThan(0);
  });
});

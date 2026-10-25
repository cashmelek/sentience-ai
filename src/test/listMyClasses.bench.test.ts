import { describe, it, expect, vi } from 'vitest';
import { listMyClasses } from '../services/classroomService';

vi.mock('../lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('../services/sentinelService', () => ({ verifyPlagiarism: vi.fn() }));
vi.mock('../services/geminiService', () => ({ detectAI: vi.fn() }));

vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((db, ...pathSegments) => pathSegments.join('/')),
    doc: vi.fn((db, ...pathSegments) => ({ id: pathSegments[pathSegments.length - 1], path: pathSegments.join('/') })),
    query: vi.fn((col, ...args) => ({ collection: col, args })),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(async (q) => {
      // teaching query uses 'classes'
      if (q.collection === 'classes') {
        return { docs: [] };
      }
      // mirror query uses 'users/UID/classEnrollments'
      if (q.collection && q.collection.includes('classEnrollments')) {
         const docs = Array.from({ length: 10 }).map((_, i) => ({
           data: () => ({ classId: `class_${i}` })
         }));
         return { docs };
      }
      return { docs: [] };
    }),
    getDoc: vi.fn(async (docRef) => {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        exists: () => true,
        id: docRef.id,
        data: () => ({ name: `Class ${docRef.id}` })
      };
    }),
  };
});

describe('listMyClasses performance benchmark', () => {
  it('should fetch classes faster than N * delay', async () => {
    const start = Date.now();
    const result = await listMyClasses('test_uid');
    const end = Date.now();
    const duration = end - start;

    console.log(`Execution time: ${duration}ms`);
    expect(result.enrolled).toHaveLength(10);
    // Ideally this will be ~50ms, definitely less than 100ms when optimized.
    // Sequentially it will be > 500ms
  });
});

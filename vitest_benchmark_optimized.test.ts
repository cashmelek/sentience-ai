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

import type { ClassRoom, ClassroomTabData } from './src/types/classroom';
import { db } from './src/lib/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';

// Mock listMyClasses optimized implementation
async function listMyClassesOptimized(uid: string): Promise<ClassroomTabData> {
  const teachingSnap = await getDocs(
    query(collection(db as any, 'classes'), where('instructorId', '==', uid), orderBy('createdAt', 'desc'))
  );
  const teaching = teachingSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ClassRoom[];

  const mirrorSnap = await getDocs(
    query(collection(db as any, 'users', uid, 'classEnrollments'), orderBy('joinedAt', 'desc'))
  );

  // OPTIMIZED PART
  const classRefMock = (id: string) => doc(db as any, "classes", id);
  const enrolledPromises = mirrorSnap.docs.map(async (d) => {
    const c = await getDoc(classRefMock(d.data().classId as string));
    if (c.exists()) return { id: c.id, ...(c.data() as any) } as ClassRoom;
    return null;
  });

  const enrolledResults = await Promise.all(enrolledPromises);
  const enrolled = enrolledResults.filter((c): c is ClassRoom => c !== null);

  return { teaching, enrolled };
}

describe('Benchmark listMyClasses Optimized', () => {
  it('should measure time to fetch N docs concurrently', async () => {
    const NUM_DOCS = 50;
    const mockDocs = Array.from({ length: NUM_DOCS }, (_, i) => ({
      data: () => ({ classId: `class_${i}` })
    }));

    const getDocsMock = getDocs as any;
    const getDocMock = getDoc as any;

    getDocsMock.mockImplementation(async (q: any) => {
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
    await listMyClassesOptimized('test_uid');
    const end = performance.now();

    console.log(`Execution time for ${NUM_DOCS} simulated concurrent getDoc calls (10ms latency each): ${Math.round(end - start)}ms`);
    expect(end - start).toBeGreaterThan(0);
  });
});

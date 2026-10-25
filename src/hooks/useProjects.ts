import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, isQuotaError, setQuotaExhausted } from '../lib/firebase';
import type { Project } from '../types';
import { DEMO_PROJECTS } from '../services/demoProjectsService';

/**
 * B20 Adım 5 (Core Refactor): proje listesi durumu ve sorgusu App.tsx'ten ayrıştırıldı.
 * Davranış birebir korunmuştur (sayfalama: varsayılan 20, hasMoreProjects eşiği).
 */
export function useProjects(user: User | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLimit, setProjectsLimit] = useState(20);
  const [hasMoreProjects, setHasMoreProjects] = useState(false);

  const fetchProjects = useCallback(async (limitCount = projectsLimit) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const docsData = snapshot.docs.map(d => {
        const data = { id: d.id, ...d.data() } as Project;
        const demoMatch = DEMO_PROJECTS.find(demo => demo.title?.trim().toLowerCase() === data.title?.trim().toLowerCase());
        return demoMatch ? { ...data, ...demoMatch } as Project : data;
      });
      let sharedDocs: Project[] = [];
      if (user.email) {
        try {
          const sharedQ = query(
            collection(db, 'projects'),
            where('collaborators', 'array-contains', user.email),
            limit(10)
          );
          const sharedSnap = await getDocs(sharedQ);
          sharedDocs = sharedSnap.docs.map(d => ({ id: d.id, ...d.data(), isShared: true } as Project));
        } catch {}
      }

      const allDocs = [...docsData, ...sharedDocs.filter(s => !docsData.some(d => d.id === s.id))];
      setProjects(allDocs);
      setHasMoreProjects(snapshot.docs.length >= limitCount);
    } catch (error) {
      if (isQuotaError(error)) {
        setQuotaExhausted(true);
      }
    }
  }, [user, projectsLimit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, setProjects, fetchProjects, projectsLimit, setProjectsLimit, hasMoreProjects };
}

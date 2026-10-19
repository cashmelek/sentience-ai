import { useState, useCallback, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, isQuotaError, setQuotaExhausted } from '../lib/firebase';
import type { Project } from '../types';

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
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
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

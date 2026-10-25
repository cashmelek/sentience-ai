import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost } from '../types/blog';
import { BLOG_POSTS as DEFAULT_POSTS } from '../data/blogPosts';

const COLLECTION_NAME = 'blog_posts';

let memoryCache: BlogPost[] | null = null;

export const blogService = {
  async fetchAllPosts(includeDrafts = false): Promise<BlogPost[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = includeDrafts
        ? query(colRef, orderBy('id', 'asc'))
        : query(colRef, where('published', '!=', false));

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return DEFAULT_POSTS;
      }

      const posts: BlogPost[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.id ?? 1,
          docId: docSnap.id,
          slug: data.slug || '',
          title: data.title || '',
          category: data.category || 'Akademik',
          readTime: data.readTime || '5 dk okuma',
          date: data.date || '2026',
          image: data.image || '',
          summary: data.summary || '',
          leadParagraph: data.leadParagraph || '',
          published: data.published !== false,
          order: data.order ?? data.id ?? 0,
          toc: Array.isArray(data.toc) ? data.toc : [],
          sections: Array.isArray(data.sections) ? data.sections : [],
          faqs: Array.isArray(data.faqs) ? data.faqs : []
        };
      });

      posts.sort((a, b) => a.id - b.id);
      memoryCache = posts;
      return posts;
    } catch {
      return DEFAULT_POSTS;
    }
  },

  async fetchPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      if (memoryCache) {
        const found = memoryCache.find((p) => p.slug === slug);
        if (found) return found;
      }

      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('slug', '==', slug));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        return {
          id: data.id ?? 1,
          docId: docSnap.id,
          slug: data.slug || '',
          title: data.title || '',
          category: data.category || 'Akademik',
          readTime: data.readTime || '5 dk okuma',
          date: data.date || '2026',
          image: data.image || '',
          summary: data.summary || '',
          leadParagraph: data.leadParagraph || '',
          published: data.published !== false,
          order: data.order ?? data.id ?? 0,
          toc: Array.isArray(data.toc) ? data.toc : [],
          sections: Array.isArray(data.sections) ? data.sections : [],
          faqs: Array.isArray(data.faqs) ? data.faqs : []
        };
      }

      return DEFAULT_POSTS.find((p) => p.slug === slug) || null;
    } catch {
      return DEFAULT_POSTS.find((p) => p.slug === slug) || null;
    }
  },

  async createPost(post: Partial<BlogPost>): Promise<string> {
    const colRef = collection(db, COLLECTION_NAME);
    const existing = await this.fetchAllPosts(true);
    const nextId = existing.length > 0 ? Math.max(...existing.map((p) => p.id)) + 1 : 1;

    const payload = {
      ...post,
      id: post.id || nextId,
      published: post.published !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(colRef, payload);
    memoryCache = null;
    return docRef.id;
  },

  async updatePost(docId: string, data: Partial<BlogPost>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    memoryCache = null;
  },

  async deletePost(docId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await deleteDoc(docRef);
    memoryCache = null;
  },

  async seedDefaultPosts(): Promise<number> {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) return 0;

    let count = 0;
    for (const post of DEFAULT_POSTS) {
      await addDoc(colRef, {
        ...post,
        published: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      count++;
    }
    memoryCache = null;
    return count;
  }
};

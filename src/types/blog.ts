export interface BlogPost {
  id: number;
  docId?: string;
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
  summary: string;
  leadParagraph: string;
  published?: boolean;
  order?: number;
  toc: { id: string; title: string }[];
  sections: {
    id: string;
    title: string;
    paragraphs: string[];
    callout?: {
      title: string;
      desc: string;
      ctaText: string;
    };
  }[];
  faqs: { q: string; a: string }[];
}

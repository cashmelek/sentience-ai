// B21 Faz 2 — Teslim dosyası ayrıştırma (PDF/DOCX -> metin)
// Sınırlar: yalnızca PDF ve DOCX, en fazla 20 MB (B21 §21.5)
import * as pdfjsLib from 'pdfjs-dist';
// Worker ayrı chunk olarak sunulur (?url) — ana bundle'ı şişirmez
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { extractRawText } from 'mammoth';

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20 MB

export const ACCEPTED_DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ParsedDocument {
  fileName: string;
  fileSize: number;
  contentType: string;
  pageCount?: number;
  text: string;
}

export function isSupportedDocument(file: { type: string; size: number }): boolean {
  return Boolean(ACCEPTED_DOCUMENT_TYPES[file.type]) && file.size <= MAX_DOCUMENT_BYTES;
}

async function parsePdf(file: File): Promise<{ text: string; pageCount: number }> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '));
  }
  return { text: pages.join('\n\n'), pageCount: pdf.numPages };
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await extractRawText({ arrayBuffer });
  return result.value;
}

export async function parseDocumentFile(file: File): Promise<ParsedDocument> {
  if (!ACCEPTED_DOCUMENT_TYPES[file.type]) {
    throw new Error('Desteklenmeyen dosya türü (yalnızca PDF ve DOCX).');
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Dosya 20 MB sınırını aşıyor.');
  }

  const isPdf = file.type === 'application/pdf';
  const parsed = isPdf
    ? await parsePdf(file)
    : { text: await parseDocx(file), pageCount: undefined };

  // Kontrollü karakterler temizlenir; ayrıştırıcı çıktısı ham depolanan metne dönüşür
  const text = parsed.text.replace(/\u0000/g, ' ').trim();
  if (text.length < 50) {
    throw new Error('Dosyadan okunan metin çok kısa (en az 50 karakter).');
  }

  return {
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type,
    pageCount: parsed.pageCount,
    text
  };
}

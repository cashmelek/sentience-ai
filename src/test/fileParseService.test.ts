import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSupportedDocument, parseDocumentFile, MAX_DOCUMENT_BYTES } from '../services/fileParseService';

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'mock-worker-url' }));

vi.mock('pdfjs-dist', () => {
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(),
  };
});

vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

describe('fileParseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupportedDocument', () => {
    it('returns false for unsupported file type', () => {
      const file = { type: 'image/png', size: 1024 };
      expect(isSupportedDocument(file)).toBe(false);
    });

    it('returns false for file exceeding size limit', () => {
      const file = { type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 };
      expect(isSupportedDocument(file)).toBe(false);
    });

    it('returns true for valid file type and size', () => {
      const file = { type: 'application/pdf', size: 1024 };
      expect(isSupportedDocument(file)).toBe(true);
    });
  });

  describe('parseDocumentFile', () => {
    it('throws an error for unsupported file type', async () => {
      const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
      await expect(parseDocumentFile(file)).rejects.toThrow('Desteklenmeyen dosya türü (yalnızca PDF ve DOCX).');
    });

    it('throws an error for file size exceeding limit', async () => {
      const file = { name: 'large.pdf', type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 } as File;
      await expect(parseDocumentFile(file)).rejects.toThrow('Dosya 20 MB sınırını aşıyor.');
    });

    it('throws an error when text is too short', async () => {
      const { extractRawText } = await import('mammoth');
      vi.mocked(extractRawText).mockResolvedValueOnce({ value: 'short text', messages: [] });

      const file = new File(['dummy'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      await expect(parseDocumentFile(file)).rejects.toThrow('Dosyadan okunan metin çok kısa (en az 50 karakter).');
    });

    it('successfully parses a DOCX file', async () => {
      const { extractRawText } = await import('mammoth');
      const validText = 'a'.repeat(60); // min 50 chars
      vi.mocked(extractRawText).mockResolvedValueOnce({ value: validText, messages: [] });

      const file = new File(['dummy content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const result = await parseDocumentFile(file);

      expect(result.text).toBe(validText);
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(result.fileName).toBe('test.docx');
    });

    it('successfully parses a PDF file', async () => {
      const { getDocument } = await import('pdfjs-dist');
      const validText = 'b'.repeat(60);
      const mockPdf = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: validText }]
          })
        })
      };

      vi.mocked(getDocument).mockReturnValue({ promise: Promise.resolve(mockPdf) } as any);

      const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
      const result = await parseDocumentFile(file);

      expect(result.text).toBe(validText);
      expect(result.pageCount).toBe(1);
      expect(result.contentType).toBe('application/pdf');
    });
  });
});

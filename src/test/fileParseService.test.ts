import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSupportedDocument, parseDocumentFile, MAX_DOCUMENT_BYTES } from '../services/fileParseService';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import * as docxForensicService from '../services/docxForensicService';

// Mock dependencies
vi.mock('mammoth', () => ({
  extractRawText: vi.fn(),
}));

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
}));

vi.mock('../services/docxForensicService', () => ({
  extractDocxForensics: vi.fn(),
}));

// We need to mock the worker import
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'mock-worker-url'
}));

describe('fileParseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupportedDocument', () => {
    it('returns true for valid PDF within size limits', () => {
      const file = { type: 'application/pdf', size: 1024 * 1024 }; // 1MB
      expect(isSupportedDocument(file)).toBe(true);
    });

    it('returns true for valid DOCX within size limits', () => {
      const file = { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024 * 1024 };
      expect(isSupportedDocument(file)).toBe(true);
    });

    it('returns false for unsupported file types', () => {
      const file = { type: 'text/plain', size: 1024 * 1024 };
      expect(isSupportedDocument(file)).toBe(false);
    });

    it('returns false for files exceeding max size', () => {
      const file = { type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 };
      expect(isSupportedDocument(file)).toBe(false);
    });
  });

  describe('parseDocumentFile', () => {
    it('throws error for unsupported file type', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      await expect(parseDocumentFile(file)).rejects.toThrow('Desteklenmeyen dosya türü (yalnızca PDF ve DOCX).');
    });

    it('throws error for file exceeding max size', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MAX_DOCUMENT_BYTES + 1 });
      await expect(parseDocumentFile(file)).rejects.toThrow('Dosya 20 MB sınırını aşıyor.');
    });

    it('throws error when extracted text is too short', async () => {
      const file = new File(['content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Mock mammoth to return short text
      vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: 'Too short', messages: [] });
      vi.mocked(docxForensicService.extractDocxForensics).mockResolvedValue(undefined);

      await expect(parseDocumentFile(file)).rejects.toThrow('Dosyadan okunan metin çok kısa (en az 50 karakter).');
    });

    it('successfully parses a valid DOCX file', async () => {
      const file = new File(['mock content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      const longText = 'This is a sufficiently long text that exceeds the fifty character minimum requirement for the document parser to accept it.';
      vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: longText, messages: [] });

      const mockForensics = { author: 'Test User', creationDate: new Date().toISOString() };
      vi.mocked(docxForensicService.extractDocxForensics).mockResolvedValue(mockForensics);

      const result = await parseDocumentFile(file);

      expect(result.text).toBe(longText);
      expect(result.fileName).toBe('test.docx');
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(result.docxForensics).toEqual(mockForensics);
      expect(result.pageCount).toBeUndefined();
    });

    it('successfully parses a valid PDF file', async () => {
      const file = new File(['mock content'], 'test.pdf', { type: 'application/pdf' });

      const longText = 'This is a sufficiently long text that exceeds the fifty character minimum requirement for the document parser to accept it.';

      const mockPdfDoc = {
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: longText }]
          })
        })
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdfDoc)
      } as any);

      const result = await parseDocumentFile(file);

      expect(result.text).toBe(longText);
      expect(result.fileName).toBe('test.pdf');
      expect(result.contentType).toBe('application/pdf');
      expect(result.pageCount).toBe(1);
      expect(result.docxForensics).toBeUndefined();
    });
  });
});

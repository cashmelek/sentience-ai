import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseDocumentFile, isSupportedDocument, MAX_DOCUMENT_BYTES, ACCEPTED_DOCUMENT_TYPES } from '../services/fileParseService';
import * as pdfjsLib from 'pdfjs-dist';
import { extractRawText } from 'mammoth';

// Mock dependencies
vi.mock('pdfjs-dist', () => {
  return {
    getDocument: vi.fn(),
    GlobalWorkerOptions: {
      workerSrc: ''
    }
  };
});

vi.mock('mammoth', () => {
  return {
    extractRawText: vi.fn()
  };
});

// Mock vite specific ?url import
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => {
  return {
    default: 'mock-worker-url'
  };
});

describe('fileParseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupportedDocument', () => {
    it('returns false for unsupported types', () => {
      expect(isSupportedDocument({ type: 'text/plain', size: 1024 })).toBe(false);
      expect(isSupportedDocument({ type: 'image/jpeg', size: 1024 })).toBe(false);
    });

    it('returns false for files exceeding max bytes', () => {
      expect(isSupportedDocument({ type: 'application/pdf', size: MAX_DOCUMENT_BYTES + 1 })).toBe(false);
    });

    it('returns true for supported types within size limits', () => {
      expect(isSupportedDocument({ type: 'application/pdf', size: MAX_DOCUMENT_BYTES })).toBe(true);
      expect(isSupportedDocument({ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024 })).toBe(true);
    });
  });

  describe('parseDocumentFile', () => {
    it('throws error for unsupported file type', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      await expect(parseDocumentFile(file)).rejects.toThrow('Desteklenmeyen dosya türü (yalnızca PDF ve DOCX).');
    });

    it('throws error for file exceeding size limit', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: MAX_DOCUMENT_BYTES + 1 });
      await expect(parseDocumentFile(file)).rejects.toThrow('Dosya 20 MB sınırını aşıyor.');
    });

    it('throws error if parsed text is less than 50 characters', async () => {
      const file = new File(['test'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      vi.mocked(extractRawText).mockResolvedValue({ value: 'short text', messages: [] });
      await expect(parseDocumentFile(file)).rejects.toThrow('Dosyadan okunan metin çok kısa (en az 50 karakter).');
    });

    it('successfully parses DOCX file', async () => {
      const file = new File(['test content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const longText = 'This is a sufficiently long text that exceeds the fifty character minimum requirement for the document parsing service.';
      vi.mocked(extractRawText).mockResolvedValue({ value: longText, messages: [] });

      const result = await parseDocumentFile(file);

      expect(result.fileName).toBe('test.docx');
      expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(result.text).toBe(longText);
      expect(result.pageCount).toBeUndefined();
      expect(extractRawText).toHaveBeenCalledTimes(1);
    });

    it('successfully parses PDF file', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const longText1 = 'This is the first page with sufficiently long text for parsing.';
      const longText2 = 'This is the second page with more text to ensure minimum length.';

      const mockPdf = {
        numPages: 2,
        getPage: vi.fn().mockImplementation((pageNum) => {
          return Promise.resolve({
            getTextContent: vi.fn().mockResolvedValue({
              items: [{ str: pageNum === 1 ? longText1 : longText2 }]
            })
          });
        })
      };

      vi.mocked(pdfjsLib.getDocument).mockReturnValue({
        promise: Promise.resolve(mockPdf)
      } as any);

      const result = await parseDocumentFile(file);

      expect(result.fileName).toBe('test.pdf');
      expect(result.contentType).toBe('application/pdf');
      expect(result.pageCount).toBe(2);
      expect(result.text).toBe(`${longText1}\n\n${longText2}`);
      expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1);
    });

    it('removes null characters from parsed text', async () => {
      const file = new File(['test content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const textWithNulls = 'This text contains\u0000 null\u0000 characters that should be replaced with spaces. This text is long enough to pass validation.';
      const expectedText = 'This text contains  null  characters that should be replaced with spaces. This text is long enough to pass validation.';
      vi.mocked(extractRawText).mockResolvedValue({ value: textWithNulls, messages: [] });

      const result = await parseDocumentFile(file);

      expect(result.text).toBe(expectedText);
    });
  });
});

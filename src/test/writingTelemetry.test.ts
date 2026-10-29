import { describe, it, expect } from 'vitest';
import { calculateProcessScore } from '../hooks/useWritingTelemetry';
import type { WritingTelemetry, Submission } from '../types/classroom';

describe('Faz 3: Yapıştırma ve Yazım Hızı Telemetrisi (Authorship Provenance)', () => {
  it('Doğrudan klavyeyle yazılan ve revizyon içeren metinlerde verified_organic üretmelidir', () => {
    const res = calculateProcessScore(
      3200, // typed chars
      150,  // pasted chars
      180,  // backspace/delete count
      5400000, // 90 mins
      3350, // total length
      1,    // legitimate quotes count
      'text'
    );

    expect(res.authorshipStatus).toBe('verified_organic');
    expect(res.processScore).toBeGreaterThanOrEqual(85);
    expect(res.pasteRatio).toBeLessThan(0.1);
  });

  it('Toplu dış yapıştırma (%95+ yapıştırma, sıfır geri silme) durumunda unverified_bulk_paste üretmelidir', () => {
    const res = calculateProcessScore(
      20,    // typed chars
      5000,  // pasted chars
      1,     // delete count
      15000, // 15 seconds
      5020,  // total length
      0,     // quotes count
      'text'
    );

    expect(res.authorshipStatus).toBe('unverified_bulk_paste');
    expect(res.processScore).toBeLessThanOrEqual(35);
    expect(res.pasteRatio).toBeGreaterThan(0.9);
  });

  it('Meşru alıntılar yapıştırıldığında mixed_with_citations üretmeli ve ceza puanı kesmemelidir', () => {
    const res = calculateProcessScore(
      2200, // typed chars
      800,  // pasted chars (legitimate citations)
      45,   // delete count
      3600000, // 60 mins
      3000, // total length
      3,    // legitimate quotes count
      'text'
    );

    expect(res.authorshipStatus).toBe('mixed_with_citations');
    expect(res.processScore).toBeGreaterThanOrEqual(75);
  });

  it('Dosya yükleme (PDF/DOCX) modunda telemetri dosya yüklemesi olarak sınıflandırılmalıdır', () => {
    const res = calculateProcessScore(
      0,
      0,
      0,
      0,
      12000,
      0,
      'file'
    );

    expect(res.authorshipStatus).toBe('file_upload');
    expect(res.processScore).toBe(100);
    expect(res.pasteRatio).toBe(0);
  });

  it('Submission veri modelinde telemetri alanlarını doğrulamalıdır', () => {
    const mockTelemetry: WritingTelemetry = {
      totalTypingTimeMs: 7200000,
      pasteCount: 2,
      pastedCharCount: 300,
      typedCharCount: 2700,
      deleteCount: 120,
      pasteRatio: 0.1,
      processScore: 92,
      authorshipStatus: 'verified_organic',
      legitimateQuotesCount: 2
    };

    const mockSub: Partial<Submission> = {
      id: 'sub-tel-01',
      title: 'Yazım Biyometrisi Analizi',
      telemetry: mockTelemetry
    };

    expect(mockSub.telemetry?.authorshipStatus).toBe('verified_organic');
    expect(mockSub.telemetry?.processScore).toBe(92);
    expect(mockSub.telemetry?.deleteCount).toBe(120);
  });
});

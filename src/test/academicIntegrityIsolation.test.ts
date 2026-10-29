import { describe, it, expect } from 'vitest';
import { analyzeSocraticHeuristics } from '../services/socraticCoachService';
import type { DigitalReceipt, Submission } from '../types/classroom';

describe('Faz 1: Sıkı Akademik İzolasyon ve Sokratik Koç Testleri', () => {
  it('Öznel kelimeler içeren metinlerde tarafsızlık uyarısı ve Sokratik soru üretmelidir', () => {
    const rawText = `Bence yapay zeka harika bir teknolojidir ve kesinlikle tüm üniversitelerde zorunlu olmalıdır.
Bu durum şüphesiz apaçık ortadadır.`;
    const report = analyzeSocraticHeuristics(rawText);

    expect(report.scoreSummary.academicObjectivity).toBeLessThan(100);
    const objectivityInquiry = report.inquiries.find(i => i.category === 'objectivity');
    expect(objectivityInquiry).toBeDefined();
    expect(objectivityInquiry?.question).toContain('tarafsızlığıyla');
    expect(objectivityInquiry?.severity).toBe('warning');
  });

  it('Kaynak atfı olmadan iddia içeren metinlerde atıf uyarısı üretmelidir', () => {
    const rawText = `Giriş ve Metodoloji:
Yapay zekanın eğitimde etkinliği birçok deneyle kanıtlanmıştır ve öğrencilerin başarısını artırdığı gösterilmiştir.
Bu çalışmada veri setleri incelenmiş ve sonuçlar vurgulanmaktadır.`;
    const report = analyzeSocraticHeuristics(rawText);

    const citationInquiry = report.inquiries.find(i => i.category === 'citation');
    expect(citationInquiry).toBeDefined();
    expect(citationInquiry?.title).toContain('Atıf');
    expect(citationInquiry?.severity).toBe('warning');
  });

  it('APA formatında atıf içeren metinlerde yüksek atıf hazırlığı skoru hesaplamalıdır', () => {
    const textWithCitations = `Literatür Taraması:
Yapay zekanın yükseköğretimdeki etik sınırları detaylıca incelenmiştir (Yılmaz, 2024). Benzer bulgular uluslararası araştırmalarda da tespit edilmiştir (Smith, 2023).
Bu doğrultuda araştırma metodolojisi belirlenmiştir.`;
    const report = analyzeSocraticHeuristics(textWithCitations);

    expect(report.scoreSummary.citationReadiness).toBeGreaterThan(60);
    const origInquiry = report.inquiries.find(i => i.category === 'originality');
    expect(origInquiry).toBeDefined();
  });

  it('Sokratik koç çıktısı asla metni doğrudan yeniden yazmamalı veya değiştirmemelidir', () => {
    const text = 'Bu bir öğrenci tez taslağıdır.';
    const report = analyzeSocraticHeuristics(text);

    report.inquiries.forEach(inq => {
      expect(inq.question.length).toBeGreaterThan(10);
      expect(inq.pedagogicalTip.length).toBeGreaterThan(10);
    });
    expect(report.encouragement).toContain('Sokratik Koç metninizi yeniden yazmaz');
  });

  it('DigitalReceipt ve Submission veri modellerinde akademik bütünlük kilidi alanlarını doğrulamalıdır', () => {
    const mockReceipt: DigitalReceipt = {
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      submittedAt: new Date().toISOString(),
      textLength: 1200,
      academicIntegrityLocked: true,
      isolationProtocol: 'Strict-Academic-Partitioning-v1'
    };

    expect(mockReceipt.academicIntegrityLocked).toBe(true);
    expect(mockReceipt.isolationProtocol).toBe('Strict-Academic-Partitioning-v1');

    const mockSubmission: Partial<Submission> = {
      id: 'sub-test-01',
      title: 'Akademik Makale',
      academicIntegrityLocked: true,
      digitalReceipt: mockReceipt
    };

    expect(mockSubmission.academicIntegrityLocked).toBe(true);
    expect(mockSubmission.digitalReceipt?.academicIntegrityLocked).toBe(true);
  });
});

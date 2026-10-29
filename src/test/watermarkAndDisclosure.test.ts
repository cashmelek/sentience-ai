import { describe, it, expect } from 'vitest';
import { analyzeStatisticalWatermark, checkDisclosureDiscrepancy } from '../services/watermarkService';
import { AIDisclosureMatrix } from '../types/classroom';

describe('Statistical Rhythm Watermark & AI Disclosure Suite', () => {
  it('handles empty and short texts safely', () => {
    const emptyResult = analyzeStatisticalWatermark('');
    expect(emptyResult.watermarkScore).toBe(0);
    expect(emptyResult.hasWatermarkSignature).toBe(false);

    const shortResult = analyzeStatisticalWatermark('Kısa bir metin.');
    expect(shortResult.watermarkScore).toBe(0);
    expect(shortResult.confidence).toBe('none');
  });

  it('computes statistical watermark metrics on sufficient text', () => {
    const sampleText = `
      Bu araştırmada yapay zeka modellerinin eğitim süreçlerindeki etkisi incelenmiştir.
      Geliştirilen metodoloji kapsamında farklı veri setleri kullanılarak analizler yapılmıştır.
      Elde edilen bulgular literatürdeki önceki çalışmalarla karşılaştırılmış ve anlamlı farklılıklar kaydedilmiştir.
      Gelecek çalışmalarda örneklem boyutunun artırılması ve farklı disiplinlerdeki uygulamaların gözlemlenmesi hedeflenmektedir.
    `;
    const result = analyzeStatisticalWatermark(sampleText);
    expect(typeof result.watermarkScore).toBe('number');
    expect(result.watermarkScore).toBeGreaterThanOrEqual(0);
    expect(result.watermarkScore).toBeLessThanOrEqual(100);
    expect(typeof result.greenTokenRatio).toBe('number');
    expect(typeof result.entropyVariance).toBe('number');
    expect(typeof result.details).toBe('string');
  });

  it('detects discrepancy when student declares no AI text drafting but internal vault similarity is high', () => {
    const disclosure: AIDisclosureMatrix = {
      literatureSearch: { level: 'none' },
      proofreading: { level: 'none' },
      ideation: { level: 'none' },
      dataAnalysis: { level: 'none' },
      textDrafting: { level: 'none' },
      toolsUsed: [],
      statementText: 'Metin tamamen özgün yazılmıştır.',
      isCertified: true,
      certifiedAt: new Date().toISOString()
    };

    const check = checkDisclosureDiscrepancy(disclosure, {
      internalGeneratorSimilarity: 94,
      aiScore: 0.85
    });

    expect(check.hasDiscrepancy).toBe(true);
    expect(check.reason).toContain('%94');
  });

  it('detects discrepancy when student declares no AI text drafting but watermark signature is definitive', () => {
    const disclosure: AIDisclosureMatrix = {
      literatureSearch: { level: 'assisted', tools: ['Perplexity'] },
      proofreading: { level: 'none' },
      ideation: { level: 'none' },
      dataAnalysis: { level: 'none' },
      textDrafting: { level: 'none' },
      toolsUsed: ['Perplexity'],
      isCertified: true,
      certifiedAt: new Date().toISOString()
    };

    const check = checkDisclosureDiscrepancy(disclosure, {
      hasWatermarkSignature: true,
      watermarkScore: 82
    });

    expect(check.hasDiscrepancy).toBe(true);
    expect(check.reason).toContain('istatistiksel YZ ritim filigranı');
  });

  it('passes cleanly when student honestly discloses AI drafting or when metrics are organic', () => {
    const honestDisclosure: AIDisclosureMatrix = {
      literatureSearch: { level: 'assisted', tools: ['Connected Papers'] },
      proofreading: { level: 'assisted', tools: ['Grammarly'] },
      ideation: { level: 'none' },
      dataAnalysis: { level: 'none' },
      textDrafting: { level: 'assisted', tools: ['ChatGPT'] },
      toolsUsed: ['ChatGPT', 'Grammarly'],
      statementText: 'Giriş bölümü taslağında ChatGPT kullanılmış, sonrasında düzenlenmiştir.',
      isCertified: true,
      certifiedAt: new Date().toISOString()
    };

    const checkHonest = checkDisclosureDiscrepancy(honestDisclosure, {
      internalGeneratorSimilarity: 72,
      aiScore: 0.65
    });
    expect(checkHonest.hasDiscrepancy).toBe(false);

    const cleanDisclosure: AIDisclosureMatrix = {
      literatureSearch: { level: 'none' },
      proofreading: { level: 'none' },
      ideation: { level: 'none' },
      dataAnalysis: { level: 'none' },
      textDrafting: { level: 'none' },
      toolsUsed: [],
      isCertified: true,
      certifiedAt: new Date().toISOString()
    };

    const checkClean = checkDisclosureDiscrepancy(cleanDisclosure, {
      internalGeneratorSimilarity: 5,
      watermarkScore: 12,
      aiScore: 0.08
    });
    expect(checkClean.hasDiscrepancy).toBe(false);
  });
});

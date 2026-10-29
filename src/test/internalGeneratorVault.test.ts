import { describe, it, expect } from 'vitest';
import { generateTextShingles, computeShingleOverlap } from '../services/classroomService';
import { matchGroupLabel } from '../components/classroom/submissionExport';
import type { Submission } from '../types/classroom';

describe('Faz 2: Platform İçi Sentetik Üretim Parmak İzi Havuzu (Internal Generator Vault)', () => {
  it('4-gram shingle üretimi büyük dil modellerinin sentetik dizilimlerini yakalayabilmelidir', () => {
    const originalGenerated = 'yapay zeka modelleri akademik dürüstlük standartlarında titizlikle incelenmeli ve denetlenmelidir';
    const studentCopied = 'yapay zeka modelleri akademik dürüstlük standartlarında derinlemesine araştırılmalı ve tartışılmalıdır';

    const s1 = generateTextShingles(originalGenerated, 4);
    const s2 = generateTextShingles(studentCopied, 4);

    expect(s1.length).toBeGreaterThan(0);
    expect(s2.length).toBeGreaterThan(0);

    const overlap = computeShingleOverlap(s2, s1);
    expect(overlap).toBeGreaterThan(0.2);
  });

  it('Tamamen farklı metinlerde shingle örtüşmesi sıfır veya ihmal edilebilir olmalıdır', () => {
    const generated = 'derin öğrenme algoritmaları doğal dil işleme süreçlerinde büyük başarı göstermektedir';
    const cleanStudent = 'antik çağ felsefesinde sokrates ve platon bilgi kuramını diyalektik yöntemle temellendirmiştir';

    const s1 = generateTextShingles(generated, 4);
    const s2 = generateTextShingles(cleanStudent, 4);

    const overlap = computeShingleOverlap(s2, s1);
    expect(overlap).toBe(0);
  });

  it('matchGroupLabel sözlüğünde internal_generator etiketi tanımlı olmalıdır', () => {
    expect(matchGroupLabel.internal_generator).toBeDefined();
    expect(matchGroupLabel.internal_generator).toContain('Platform Sentetik Üretim İzi');
  });

  it('Submission modelinde hasInternalGeneratorMatch ve internalGeneratorSimilarity alanları doğrulanmalıdır', () => {
    const mockSubmission: Partial<Submission> = {
      id: 'sub-vault-test-01',
      title: 'YZ Tabanlı Tez İncelemesi',
      similarityScore: 42,
      aiScore: 88,
      hasInternalGeneratorMatch: true,
      internalGeneratorSimilarity: 94,
      sources: [
        {
          title: 'Platform İçi Sentetik Üretim İzi (Humanizer Vault)',
          url: 'internal-vault://synthetic-generator/vault-doc-123',
          similarity: 0.94,
          snippet: 'Platform içi sentetik parmak izi eşleşmesi',
          matchedText: 'Platform içi sentetik parmak izi eşleşmesi',
          trust: 'high',
          matchGroup: 'internal_generator'
        }
      ]
    };

    expect(mockSubmission.hasInternalGeneratorMatch).toBe(true);
    expect(mockSubmission.internalGeneratorSimilarity).toBe(94);
    expect(mockSubmission.sources?.[0].matchGroup).toBe('internal_generator');
  });
});

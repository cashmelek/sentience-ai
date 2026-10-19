import { describe, it, expect, vi } from 'vitest';

// Firestore/Gemini zinciri test ortamında başlatılmasın; yalnız saf fonksiyonlar test edilir
vi.mock('../lib/firebase', () => ({ db: {}, auth: {} }));
vi.mock('../services/sentinelService', () => ({ verifyPlagiarism: vi.fn() }));
vi.mock('../services/geminiService', () => ({ detectAI: vi.fn() }));

import {
  randomCode,
  generateClassCode,
  generateEnrollmentKey,
  normalizeCodeInput,
  checkSubmissionQuota,
  nextSubmissionCounter,
  sha256Hex,
  parseBulkRoster,
  pendingEnrollmentId,
  generateTextShingles,
  computeShingleOverlap,
} from '../services/classroomService';

const CODE_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

describe('randomCode', () => {
  it('ürettiği kod istenen uzunlukta ve alfabe dışına çıkmaz', () => {
    const code = randomCode(12);
    expect(code).toHaveLength(12);
    expect(code).toMatch(CODE_RE);
  });

  it('özel alfabeyle tek karakterli alfabe üretir', () => {
    expect(randomCode(5, 'A')).toBe('AAAAA');
    expect(randomCode(3, 'XY')).toMatch(/^[XY]{3}$/);
  });

  it('varsayılan alfabe karışıktır (öngörülebilir tek harfe düşmez)', () => {
    const code = randomCode(200);
    expect(new Set(code).size).toBeGreaterThan(1);
  });
});

describe('generateClassCode / generateEnrollmentKey', () => {
  it('sınıf kodu 6, kayıt anahtarı 10 karakterdir ve 0/O/1/I içermez', () => {
    expect(generateClassCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(generateEnrollmentKey()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
  });
});

describe('normalizeCodeInput', () => {
  it('küçük harfi büyütür ve alfasayısal olmayanları atar', () => {
    expect(normalizeCodeInput('ab12-cd')).toBe('AB12CD');
    expect(normalizeCodeInput('  o1o ')).toBe('O1O');
    expect(normalizeCodeInput('abc')).toBe('ABC');
  });

  it('boş/yalnızca işaret girdisinde boş dize döner', () => {
    expect(normalizeCodeInput('')).toBe('');
    expect(normalizeCodeInput(' - - ')).toBe('');
  });
});

describe('checkSubmissionQuota (D3 teslim kotası)', () => {
  it('plan limitleri free 10 / pro 100 / premium 500 üzerinden çalışır', () => {
    expect(checkSubmissionQuota('free', 0)).toEqual({ allowed: true, limit: 10, remaining: 10 });
    expect(checkSubmissionQuota('pro', 99)).toEqual({ allowed: true, limit: 100, remaining: 1 });
    expect(checkSubmissionQuota('premium', 499)).toEqual({ allowed: true, limit: 500, remaining: 1 });
  });

  it('limit dolunca allowed=false ve remaining 0 olur', () => {
    expect(checkSubmissionQuota('free', 10)).toEqual({ allowed: false, limit: 10, remaining: 0 });
    expect(checkSubmissionQuota('pro', 100).allowed).toBe(false);
    expect(checkSubmissionQuota('premium', 500).allowed).toBe(false);
  });

  it('limit aşımında remaining negatife düşmez', () => {
    expect(checkSubmissionQuota('free', 15).remaining).toBe(0);
  });

  it('bilinmeyen plan free limitine düşer', () => {
    expect(checkSubmissionQuota('admin' as any, 10).limit).toBe(10);
  });
});

describe('nextSubmissionCounter (günlük sıfırlama)', () => {
  it('resetDate bugünse sayacı bir artırır', () => {
    expect(nextSubmissionCounter(5, '2026-10-08', '2026-10-08')).toBe(6);
    expect(nextSubmissionCounter(0, '2026-10-08', '2026-10-08')).toBe(1);
  });

  it('resetDate eskiyse sayaç 1den başlar', () => {
    expect(nextSubmissionCounter(5, '2026-10-07', '2026-10-08')).toBe(1);
    expect(nextSubmissionCounter(9, '', '2026-10-08')).toBe(1);
  });
});

describe('sha256Hex (dijital makbuz)', () => {
  it('bilinen SHA-256 vektörlerini üretir', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('aynı metin aynı özeti, farklı metin farklı özeti verir', async () => {
    const a1 = await sha256Hex('aynı metin');
    const a2 = await sha256Hex('aynı metin');
    const b = await sha256Hex('farklı metin');
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });
});

describe('parseBulkRoster (B21 Faz 2: toplu öğrenci listesi)', () => {
  it('virgül/noktalı virgül/sekme ayıraçlarını ve yalnız-eposta satırlarını ayrıştırır', () => {
    const raw = 'Ayşe Yılmaz, ayse@ornek.edu\nMehmet Kaya;mehmet@ornek.edu\nzeynep@ornek.edu\nAli Veli\tali@ornek.edu';
    expect(parseBulkRoster(raw)).toEqual([
      { name: 'Ayşe Yılmaz', email: 'ayse@ornek.edu' },
      { name: 'Mehmet Kaya', email: 'mehmet@ornek.edu' },
      { name: '', email: 'zeynep@ornek.edu' },
      { name: 'Ali Veli', email: 'ali@ornek.edu' },
    ]);
  });

  it('boş satırları atar ve e-posta içermeyen satırları dışlar', () => {
    expect(parseBulkRoster('\n\nsadece isim\n')).toEqual([]);
    expect(parseBulkRoster('  \n ayse@ornek.edu \n')).toEqual([{ name: '', email: 'ayse@ornek.edu' }]);
  });

  it('satır içi ekstra parçalar isme eklenir', () => {
    expect(parseBulkRoster('Kaya, Mehmet, mehmet@ornek.edu')).toEqual([
      { name: 'Kaya Mehmet', email: 'mehmet@ornek.edu' },
    ]);
  });

  it('CRLF satır sonlarını da destekler', () => {
    expect(parseBulkRoster('a@b.c\r\nd@e.f')).toEqual([
      { name: '', email: 'a@b.c' },
      { name: '', email: 'd@e.f' },
    ]);
  });
});

describe('pendingEnrollmentId (B21 Faz 2: bekleme kaydı kimliği)', () => {
  it('epostayı küçültür, boşlukları kırpar ve pending_ öneki ekler', () => {
    expect(pendingEnrollmentId('  Ayse@Ornek.EDU ')).toBe('pending_ayse@ornek.edu');
  });

  it('aynı eposta için deterministiktir', () => {
    expect(pendingEnrollmentId('a@b.c')).toBe(pendingEnrollmentId('a@b.c'));
    expect(pendingEnrollmentId('A@B.C')).toBe(pendingEnrollmentId('a@b.c'));
  });
});

describe('generateTextShingles & computeShingleOverlap (B21 Faz 3: Sınıf Deposu)', () => {
  it('boş metinde boş dizi döner', () => {
    expect(generateTextShingles('')).toEqual([]);
    expect(generateTextShingles('   ')).toEqual([]);
  });

  it('k değerinden az kelime olduğunda tek parça döner', () => {
    expect(generateTextShingles('yapay zeka modeli', 5)).toEqual(['yapay zeka modeli']);
  });

  it('5-gram ardışık kelime dizilerini doğru üretir', () => {
    const text = 'Sentience AI akademik dürüstlük ve intihal denetimi sağlar';
    const shingles = generateTextShingles(text, 5);
    expect(shingles.length).toBeGreaterThan(0);
    expect(shingles).toContain('sentience ai akademik dürüstlük ve');
    expect(shingles).toContain('ai akademik dürüstlük ve intihal');
  });

  it('birebir aynı metinlerde %100 örtüşme hesaplar', () => {
    const text = 'Bu metin sınıf deposunda öz intihal ve eş öğrenci tespiti için saklanır.';
    const s1 = generateTextShingles(text, 4);
    const s2 = generateTextShingles(text, 4);
    expect(computeShingleOverlap(s1, s2)).toBe(1);
  });

  it('tamamen farklı metinlerde %0 örtüşme döner', () => {
    const s1 = generateTextShingles('elma armut kiraz vişne kayısı şeftali kavun', 4);
    const s2 = generateTextShingles('kuantum fiziği görelilik kuramı termodinamik yasaları mekanik', 4);
    expect(computeShingleOverlap(s1, s2)).toBe(0);
  });

  it('kısmi kopyalamada doğru orantılı örtüşme verir', () => {
    const base = 'Türkiye Cumhuriyeti demokratik laik sosyal bir hukuk devletidir temel ilkeler korunur';
    const copy = 'Türkiye Cumhuriyeti demokratik laik sosyal bir hukuk devletidir farklı konularda yeni cümleler eklenmiştir';
    const s1 = generateTextShingles(base, 4);
    const s2 = generateTextShingles(copy, 4);
    const overlap = computeShingleOverlap(s2, s1);
    expect(overlap).toBeGreaterThan(0.2);
    expect(overlap).toBeLessThan(1);
  });
});

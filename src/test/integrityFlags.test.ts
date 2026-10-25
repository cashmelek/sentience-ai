import { describe, it, expect } from 'vitest';
import { detectIntegrityFlags } from '../ml/textFeatures';

describe('detectIntegrityFlags (Turnitin Bütünlük Bayrakları)', () => {
  it('temiz metinde sıfır bayrak ve isClean=true dönmelidir', () => {
    const text = 'Bu tamamen özgün ve etik kurallara uygun Türkçe bir araştırma makalesidir.';
    const report = detectIntegrityFlags(text);

    expect(report.isClean).toBe(true);
    expect(report.totalFlags).toBe(0);
    expect(report.hasHomoglyphs).toBe(false);
    expect(report.hasHiddenChars).toBe(false);
    expect(report.hasHiddenTextPatterns).toBe(false);
    expect(report.sanitizedText).toBe(text);
  });

  it('Kiril harf ikamelerini (homoglyph) yakalamalı ve temizlemelidir', () => {
    // '\u0430' (Kiril 'a') ve '\u043E' (Kiril 'o')
    const manipulated = 'Bu bir \u0430kademik \u043Ekul makalesidir.';
    const report = detectIntegrityFlags(manipulated);

    expect(report.isClean).toBe(false);
    expect(report.hasHomoglyphs).toBe(true);
    expect(report.homoglyphCount).toBe(2);
    expect(report.details.some(d => d.type === 'homoglyph' && d.expected === 'a')).toBe(true);
    expect(report.details.some(d => d.type === 'homoglyph' && d.expected === 'o')).toBe(true);
    expect(report.sanitizedText).toBe('Bu bir akademik okul makalesidir.');
  });

  it('sıfır genişlikli gizli karakterleri (zero-width) tespit etmelidir', () => {
    // 0x200B (Zero-width space)
    const textWithHidden = 'Bu bir gizli\u200Bkarakter içeren metindir.';
    const report = detectIntegrityFlags(textWithHidden);

    expect(report.isClean).toBe(false);
    expect(report.hasHiddenChars).toBe(true);
    expect(report.hiddenCharCount).toBe(1);
    expect(report.details[0].type).toBe('hidden_char');
    expect(report.sanitizedText).toBe('Bu bir gizlikarakter içeren metindir.');
  });

  it('CSS ile gizlenmiş görünmez metin kalıplarını saptamalıdır', () => {
    const textWithCss = 'Normal metin <span style="display:none">Kopya içerik</span> devam ediyor.';
    const report = detectIntegrityFlags(textWithCss);

    expect(report.isClean).toBe(false);
    expect(report.hasHiddenTextPatterns).toBe(true);
    expect(report.hiddenTextPatternCount).toBe(1);
    expect(report.details.some(d => d.type === 'hidden_text_pattern')).toBe(true);
  });
});

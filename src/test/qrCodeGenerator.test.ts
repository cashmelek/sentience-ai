import { describe, it, expect } from 'vitest';
import { generateQRCodeSvg } from '../utils/qrCodeGenerator';

describe('generateQRCodeSvg', () => {
  it('generates a valid SVG string wrapper with default size (110)', () => {
    const svg = generateQRCodeSvg('https://example.com');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110"');
    expect(svg).toContain('</svg>');
  });

  it('generates a valid SVG string wrapper with a custom size', () => {
    const svg = generateQRCodeSvg('https://example.com', 200);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"');
    expect(svg).toContain('</svg>');
  });

  it('contains <rect> elements and a background <rect> with #ffffff', () => {
    const svg = generateQRCodeSvg('https://example.com');
    expect(svg).toContain('<rect width="110" height="110" fill="#ffffff"/>');
    // Ensure it has some black rects for the QR code data/markers
    expect(svg).toContain('fill="#111827"');
    // We expect multiple rects
    const rectCount = (svg.match(/<rect /g) || []).length;
    expect(rectCount).toBeGreaterThan(1);
  });

  it('results in different <rect> patterns for different URL inputs', () => {
    const svg1 = generateQRCodeSvg('https://example.com');
    const svg2 = generateQRCodeSvg('https://different.com');

    // They should have the same structure but different inner rects based on the hash
    expect(svg1).not.toBe(svg2);
  });

  it('handles empty strings without throwing exceptions', () => {
    expect(() => {
      const svg = generateQRCodeSvg('');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }).not.toThrow();
  });
});

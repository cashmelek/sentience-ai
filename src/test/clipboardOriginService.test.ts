import { describe, it, expect } from 'vitest';
import { generateOriginSignature, copyTextWithOriginToken } from '../services/clipboardOriginService';

describe('clipboardOriginService', () => {
  it('generates consistent deterministic signature token', () => {
    const text = 'Bu bir akademik makale giriş cümlesidir.';
    const sig1 = generateOriginSignature(text, 'test@uni.edu.tr');
    expect(sig1).toContain('SIG-');
    expect(sig1.length).toBeGreaterThan(10);
  });

  it('safely handles empty text without error', async () => {
    const res = await copyTextWithOriginToken('');
    expect(res).toBe(false);
  });
});

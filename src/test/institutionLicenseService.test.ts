import { describe, it, expect } from 'vitest';
import { validateInstitutionCode } from '../services/institutionLicenseService';

describe('institutionLicenseService', () => {
  it('validates default fallback institutional license keys', async () => {
    const validCodes = ['INST-EDU-2026', 'DEMO-2026', 'AKADEMIK2026', 'SENT26'];
    for (const code of validCodes) {
      const res = await validateInstitutionCode(code);
      expect(res.valid).toBe(true);
      expect(res.license?.code).toBe(code);
    }
  });

  it('rejects invalid or blank license keys', async () => {
    const emptyRes = await validateInstitutionCode('');
    expect(emptyRes.valid).toBe(false);

    const invalidRes = await validateInstitutionCode('INVALID-KEY-1234');
    expect(invalidRes.valid).toBe(false);
  });
});

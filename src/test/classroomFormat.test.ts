import { describe, it, expect } from 'vitest';
import { fmtDate, fmtDateTime, scoreColor, scoreBarClass, pct } from '../components/classroom/format';

// Saat dilimi bağımsız olsun diye zaman bileşenli yerel ISO girdiler kullanılır
describe('fmtDate', () => {
  it('boş girdide tire döner', () => {
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate(undefined)).toBe('—');
    expect(fmtDate('')).toBe('—');
  });

  it('ISO tarihi gg.aa.yyyy biçiminde yazar', () => {
    expect(fmtDate('2026-10-08T12:00:00')).toBe('08.10.2026');
  });

  it('Firestore Timestamp benzeri nesnede toDate() kullanır', () => {
    const tsLike = { toDate: () => new Date(2026, 9, 8) };
    expect(fmtDate(tsLike)).toBe('08.10.2026');
  });

  it('geçersiz girdide tire döner', () => {
    expect(fmtDate('geçersiz')).toBe('—');
  });
});

describe('fmtDateTime', () => {
  it('boş girdide tire döner', () => {
    expect(fmtDateTime(null)).toBe('—');
  });

  it('ISO tarih-saati gg.aa.yyyy ss:dd biçiminde yazar', () => {
    expect(fmtDateTime('2026-10-08T14:05:00')).toBe('08.10.2026 14:05');
  });
});

describe('Turnitin tarzı skor renk dilimleri', () => {
  it('scoreColor eşiklerde emerald/amber/red verir', () => {
    expect(scoreColor(undefined)).toBe('text-gray-500');
    expect(scoreColor(null)).toBe('text-gray-500');
    expect(scoreColor(NaN)).toBe('text-gray-500');
    expect(scoreColor(0)).toBe('text-emerald-500');
    expect(scoreColor(0.14)).toBe('text-emerald-500');
    expect(scoreColor(0.15)).toBe('text-amber-500');
    expect(scoreColor(0.39)).toBe('text-amber-500');
    expect(scoreColor(0.4)).toBe('text-red-500');
    expect(scoreColor(0.95)).toBe('text-red-500');
  });

  it('scoreBarClass aynı eşiklerde bg- sınıfları verir', () => {
    expect(scoreBarClass(undefined)).toBe('bg-gray-700');
    expect(scoreBarClass(0.1)).toBe('bg-emerald-500');
    expect(scoreBarClass(0.2)).toBe('bg-amber-500');
    expect(scoreBarClass(0.5)).toBe('bg-red-500');
  });

  it('pct skoru yuvarlanmış yüzdeye çevirir', () => {
    expect(pct(undefined)).toBe('—');
    expect(pct(null)).toBe('—');
    expect(pct(0)).toBe('%0');
    expect(pct(0.075)).toBe('%8');
    expect(pct(0.567)).toBe('%57');
    expect(pct(1)).toBe('%100');
  });
});

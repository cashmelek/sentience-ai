// Sınıf görünümlerinde ortak kullanılan küçük biçimlendirme yardımcıları

export function fmtDate(value: any): string {
  if (!value) return '—';
  try {
    const d = typeof value === 'object' && typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

export function fmtDateTime(value: any): string {
  if (!value) return '—';
  try {
    const d = typeof value === 'object' && typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value);
    if (isNaN(d.getTime())) return '—';
    return `${fmtDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '—';
  }
}

export function normalizeScore(score?: number | null): number {
  if (score === undefined || score === null || isNaN(score)) return 0;
  return score > 1 ? score / 100 : score;
}

// Benzerlik/Yz skoru için Turnitin tarzı renk dilimi (yüksek = kırmızı)
export function scoreColor(score?: number | null): string {
  if (score === undefined || score === null || isNaN(score)) return 'text-gray-500';
  const val = normalizeScore(score);
  if (val < 0.15) return 'text-emerald-500';
  if (val < 0.4) return 'text-amber-500';
  return 'text-red-500';
}

export function scoreBarClass(score?: number | null): string {
  if (score === undefined || score === null || isNaN(score)) return 'bg-gray-700';
  const val = normalizeScore(score);
  if (val < 0.15) return 'bg-emerald-500';
  if (val < 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

export function pct(score?: number | null): string {
  if (score === undefined || score === null || isNaN(score)) return '—';
  const norm = score > 1 ? score : score * 100;
  return `%${Math.round(Math.min(100, Math.max(0, norm)))}`;
}

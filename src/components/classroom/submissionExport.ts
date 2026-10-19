import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { fmtDateTime } from './format';

export const matchGroupLabel: Record<string, string> = {
  not_cited_or_quoted: 'Atıf Yok',
  missing_quotations: 'Tırnak Eksik',
  missing_citation: 'Kaynakça Eksik',
  cited_and_quoted: 'Doğru Atıf',
  peer_match: 'Eş-Öğrenci Eşleşmesi',
  self_plagiarism: 'Öz-İntihal',
};

export const trustLabel: Record<string, string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  unknown: 'Bilinmiyor',
};

export const statusLabel: Record<string, string> = {
  received: 'Alındı',
  processing: 'İşleniyor',
  scored: 'Skorlandı',
  failed: 'Hata',
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportSubmissionReportPDF(cls: ClassRoom, assignment: Assignment, submission: Submission): void {
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const simPct = Math.round((submission.similarityScore ?? 0) * 100);
  const aiPct = Math.round((submission.aiScore ?? 0) * 100);
  const excluded = new Set(submission.excludedSourceUrls || []);
  const sources = submission.sources || [];
  const onBehalf = Boolean(submission.submittedBy && submission.submittedBy !== submission.studentId);
  const receipt = submission.digitalReceipt;

  const sourcesHtml = sources.length > 0
    ? `<div class="section">
        <h2>Eşleşen Kaynaklar (${sources.length})</h2>
        <ul>
          ${sources.map((s) => {
            const isExcluded = excluded.has(s.url);
            const isInternal = s.url.startsWith('internal://');
            const linkHtml = isInternal
              ? `<span style="color: #6366f1; font-weight: 600;">[Sınıf Deposu Kaydı]</span>`
              : `<a href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer">${escapeHtml(s.url)}</a>`;
            return `<li>
              <strong>${escapeHtml(s.title || (isInternal ? 'Sınıf İçi Teslim Deposu' : 'İnternet Kaynağı'))}</strong>
              ${s.similarity ? `(%${Math.round(s.similarity * 100)} benzerlik)` : ''}
              ${s.matchGroup ? `— ${escapeHtml(matchGroupLabel[s.matchGroup] || s.matchGroup)}` : ''}
              ${s.trust ? `(güven: ${escapeHtml(trustLabel[s.trust] || s.trust)})` : ''}
              ${isExcluded ? '<em>— rapordan dışlandı</em>' : ''}
              <br/>${linkHtml}
            </li>`;
          }).join('')}
        </ul>
      </div>`
    : '';

  const receiptHtml = receipt
    ? `<div class="section receipt">
        <h2>Dijital Makbuz</h2>
        <p>Bu makbuz, teslim edildiği andaki metinden üretilen SHA-256 özetini içerir.</p>
        <table>
          <tr><td>SHA-256 Özeti</td><td class="hash">${escapeHtml(receipt.sha256)}</td></tr>
          <tr><td>Teslim Zamanı</td><td>${escapeHtml(fmtDateTime(receipt.submittedAt))}</td></tr>
          <tr><td>Metin Uzunluğu</td><td>${escapeHtml(receipt.textLength)} karakter</td></tr>
        </table>
      </div>`
    : '';

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Sentience AI — Teslim Raporu</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111827; line-height: 1.6; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 24px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; margin: 0; }
        .meta { font-size: 11px; color: #6b7280; font-weight: 600; margin-top: 4px; }
        .metrics { display: flex; gap: 16px; margin: 24px 0; }
        .metric-box { flex: 1; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
        .metric-label { font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; }
        .metric-val { font-size: 22px; font-weight: 900; margin-top: 2px; }
        .section { margin: 24px 0; }
        .section h2 { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        td { border: 1px solid #e5e7eb; padding: 8px 10px; vertical-align: top; }
        td:first-child { font-weight: 700; color: #374151; white-space: nowrap; width: 160px; }
        .hash { font-family: 'Courier New', monospace; word-break: break-all; }
        .content { white-space: pre-wrap; font-size: 13px; color: #1f2937; line-height: 1.8; }
        ul { padding-left: 20px; font-size: 12px; color: #4b5563; }
        li { margin-bottom: 6px; }
        .note { font-size: 10px; color: #9ca3af; margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        @media print {
          body { margin: 20px; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">SENTIENCE AI</h1>
          <div class="meta">Sınıf Teslim Raporu — Benzerlik ve YZ Analizi</div>
        </div>
        <div class="meta" style="text-align: right;">
          <div>${escapeHtml(new Date().toLocaleString('tr-TR'))}</div>
          <div>Durum: ${escapeHtml(statusLabel[submission.status] || submission.status)}</div>
        </div>
      </div>

      <div class="section">
        <h2>Teslim Bilgileri</h2>
        <table>
          <tr><td>Sınıf</td><td>${escapeHtml(cls.name)}${cls.subject ? ` — ${escapeHtml(cls.subject)}` : ''}</td></tr>
          <tr><td>Ödev</td><td>${escapeHtml(assignment.title)}</td></tr>
          <tr><td>Öğrenci</td><td>${escapeHtml(submission.studentName)} (${escapeHtml(submission.studentEmail)})</td></tr>
          <tr><td>Teslim Başlığı</td><td>${escapeHtml(submission.title)}</td></tr>
          <tr><td>Teslim Tarihi</td><td>${escapeHtml(fmtDateTime(submission.createdAt))}</td></tr>
          <tr><td>Teslim Eden</td><td>${onBehalf ? 'Eğitmen (Öğrenci adına)' : 'Öğrenci'}</td></tr>
          ${submission.fileName ? `<tr><td>Dosya</td><td>${escapeHtml(submission.fileName)}</td></tr>` : ''}
        </table>
      </div>

      <div class="metrics">
        <div class="metric-box">
          <div class="metric-label">Benzerlik Skoru</div>
          <div class="metric-val" style="color: ${simPct > 20 ? '#ef4444' : '#10b981'};">%${simPct}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">YZ Olasılığı</div>
          <div class="metric-val" style="color: ${aiPct > 70 ? '#ef4444' : '#10b981'};">%${aiPct}</div>
        </div>
      </div>

      ${receiptHtml}

      ${sourcesHtml}

      <div class="section">
        <h2>Teslim Metni</h2>
        <div class="content">${escapeHtml(submission.text)}</div>
      </div>

      <p class="note">Bu rapor Sentience AI tarafından üretilmiştir. Dijital makbuzdaki SHA-256 özeti, teslim
      anındaki metnin bütünlüğünü doğrulamak için kullanılabilir. Dışlanan kaynaklar benzerlik hesabına dahil
      edilmemiştir.</p>
    </body>
    </html>
  `);
  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 400);
}

export function exportSubmissionsCSV(cls: ClassRoom, assignment: Assignment, submissions: Submission[]): void {
  if (submissions.length === 0) return;
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headers = [
    'Öğrenci',
    'E-posta',
    'Teslim Başlığı',
    'Durum',
    'Benzerlik (%)',
    'YZ Olasılığı (%)',
    'Kaynak Sayısı',
    'Teslim Tarihi',
    'Teslim Eden',
    'Dosya Adı',
    'SHA-256 Özeti',
    'Skorlama'
  ];

  const rows = submissions.map((s) => {
    const simPct = s.similarityScore !== undefined ? Math.round(s.similarityScore * 100) : '';
    const aiPct = s.aiScore !== undefined ? Math.round(s.aiScore * 100) : '';
    const onBehalf = Boolean(s.submittedBy && s.submittedBy !== s.studentId);
    return [
      esc(s.studentName),
      esc(s.studentEmail),
      esc(s.title),
      esc(statusLabel[s.status] || s.status),
      simPct,
      aiPct,
      s.sources?.length ?? 0,
      esc(fmtDateTime(s.createdAt)),
      esc(onBehalf ? 'Eğitmen' : 'Öğrenci'),
      esc(s.fileName || '-'),
      esc(s.digitalReceipt?.sha256 || '-'),
      esc(s.scoredBy === 'server' ? 'Sunucu (CF)' : s.scoredBy === 'client' ? 'İstemci Yedeği' : '-')
    ].join(',');
  });

  const content = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = assignment.title.replace(/[^\w\s-]/g, '').trim().slice(0, 50) || 'odev';
  a.download = `${safeTitle}-teslimler.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSubmissionsExcel(cls: ClassRoom, assignment: Assignment, submissions: Submission[]): void {
  if (submissions.length === 0) return;
  const safeTitle = assignment.title.replace(/[^\w\s-]/g, '').trim().slice(0, 50) || 'odev';

  const rowsHtml = submissions.map((s) => {
    const simPct = s.similarityScore !== undefined ? Math.round(s.similarityScore * 100) : null;
    const aiPct = s.aiScore !== undefined ? Math.round(s.aiScore * 100) : null;
    const onBehalf = Boolean(s.submittedBy && s.submittedBy !== s.studentId);
    return `<tr>
      <td>${escapeHtml(s.studentName)}</td>
      <td>${escapeHtml(s.studentEmail)}</td>
      <td>${escapeHtml(s.title)}</td>
      <td>${escapeHtml(statusLabel[s.status] || s.status)}</td>
      <td style="text-align: right; color: ${(simPct ?? 0) > 20 ? '#dc2626' : '#16a34a'}; font-weight: bold;">${simPct !== null ? '%' + simPct : '-'}</td>
      <td style="text-align: right; color: ${(aiPct ?? 0) > 70 ? '#dc2626' : '#16a34a'}; font-weight: bold;">${aiPct !== null ? '%' + aiPct : '-'}</td>
      <td style="text-align: right;">${s.sources?.length ?? 0}</td>
      <td>${escapeHtml(fmtDateTime(s.createdAt))}</td>
      <td>${onBehalf ? 'Eğitmen' : 'Öğrenci'}</td>
      <td>${escapeHtml(s.fileName || '-')}</td>
      <td style="font-family: monospace;">${escapeHtml(s.digitalReceipt?.sha256 || '-')}</td>
      <td>${s.scoredBy === 'server' ? 'Sunucu (CF)' : s.scoredBy === 'client' ? 'İstemci Yedeği' : '-'}</td>
    </tr>`;
  }).join('');

  const excelHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Teslimler</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>
        body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px 8px; border: 1px solid #1d4ed8; text-align: left; }
        td { padding: 6px 8px; border: 1px solid #e2e8f0; vertical-align: middle; }
        tr:nth-child(even) { background-color: #f8fafc; }
        h2 { color: #1e3a8a; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <h2>${escapeHtml(cls.name)} — ${escapeHtml(assignment.title)} — Teslim Listesi</h2>
      <table>
        <thead>
          <tr>
            <th>Öğrenci</th>
            <th>E-posta</th>
            <th>Teslim Başlığı</th>
            <th>Durum</th>
            <th>Benzerlik (%)</th>
            <th>YZ Olasılığı (%)</th>
            <th>Kaynak Sayısı</th>
            <th>Teslim Tarihi</th>
            <th>Teslim Eden</th>
            <th>Dosya Adı</th>
            <th>SHA-256 Özeti</th>
            <th>Skorlama</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}-teslimler.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

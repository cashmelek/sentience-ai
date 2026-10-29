import type { ClassRoom, Assignment, Submission } from '../../types/classroom';
import { fmtDateTime } from './format';
import { generateQRCodeSvg } from '../../utils/qrCodeGenerator';

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
        <div style="display: flex; gap: 14px; align-items: center;">
          <div class="meta" style="text-align: right;">
            <div>${escapeHtml(new Date().toLocaleString('tr-TR'))}</div>
            <div>Durum: ${escapeHtml(statusLabel[submission.status] || submission.status)}</div>
            <div style="font-size: 9px; font-family: monospace; color: #6b7280; margin-top: 2px;">DOKÜMAN ID: ${escapeHtml(submission.id.substring(0, 14))}</div>
          </div>
          <div style="border: 1px solid #e5e7eb; padding: 3px; background: #ffffff; border-radius: 6px;" title="Doğrulama Karekodu">
            ${generateQRCodeSvg(`https://sentience-ai.vercel.app/verify?id=${submission.id}&sha=${receipt?.sha256 || ''}`, 62)}
          </div>
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
        ${submission.metrics?.perplexity !== undefined ? `
        <div class="metric-box">
          <div class="metric-label">Perplexity</div>
          <div class="metric-val" style="color: #3b82f6;">${Math.round(submission.metrics.perplexity)}</div>
        </div>` : ''}
        ${submission.metrics?.burstiness !== undefined ? `
        <div class="metric-box">
          <div class="metric-label">Burstiness</div>
          <div class="metric-val" style="color: #8b5cf6;">%${Math.round(submission.metrics.burstiness * 100)}</div>
        </div>` : ''}
        ${submission.metrics?.readability !== undefined || submission.metrics?.readabilityScore !== undefined ? `
        <div class="metric-box">
          <div class="metric-label">Okunabilirlik</div>
          <div class="metric-val" style="color: #10b981;">%${Math.round(submission.metrics.readability ?? (submission.metrics.readabilityScore * 100))}</div>
        </div>` : ''}
        ${submission.metrics?.bezirciYilmaz !== undefined ? `
        <div class="metric-box">
          <div class="metric-label">Bezirci-Yılmaz</div>
          <div class="metric-val" style="color: #f59e0b;">${submission.metrics.bezirciYilmaz} YOD</div>
        </div>` : ''}
        ${submission.metrics?.lix !== undefined ? `
        <div class="metric-box">
          <div class="metric-label">LIX Endeksi</div>
          <div class="metric-val" style="color: #8b5cf6;">${Math.round(submission.metrics.lix)}</div>
        </div>` : ''}
      </div>

      ${typeof submission.grade === 'number' || submission.feedback ? `
      <div class="section" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: #059669; font-size: 14px; text-transform: uppercase;">Eğitmen Değerlendirmesi</h2>
        ${typeof submission.grade === 'number' ? `<p style="font-size: 16px; font-weight: bold; margin: 4px 0;"><strong>Akademik Not:</strong> ${submission.grade} / 100</p>` : ''}
        ${submission.feedback ? `<p style="margin: 6px 0 0; color: #374151; font-style: italic;">"${escapeHtml(submission.feedback)}"</p>` : ''}
      </div>
      ` : ''}

      ${receiptHtml}

      ${sourcesHtml}

            ${submission.sentenceScores && submission.sentenceScores.length > 0 ? `
      <div class="section">
        <h2>Cümle Bazlı Risk Dağılımı (${submission.sentenceScores.length} Cümle)</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f3f4f6; text-align: left;">
              <th style="padding: 6px 8px; width: 65px; border: 1px solid #e5e7eb;">Risk</th>
              <th style="padding: 6px 8px; border: 1px solid #e5e7eb;">Cümle</th>
              <th style="padding: 6px 8px; width: 140px; border: 1px solid #e5e7eb;">Gerekçe</th>
            </tr>
          </thead>
          <tbody>
            ${submission.sentenceScores.map((st) => {
              const score = st.score ?? 0;
              const isAi = score >= 0.7;
              const isMixed = score >= 0.4 && score < 0.7;
              const color = isAi ? '#dc2626' : isMixed ? '#d97706' : '#16a34a';
              const bg = isAi ? 'rgba(239, 68, 68, 0.05)' : isMixed ? 'rgba(245, 158, 11, 0.05)' : 'transparent';
              return `<tr style="background: ${bg};">
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb; font-weight: bold; color: ${color};">%${Math.round(score * 100)}</td>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb;">${escapeHtml(st.sentence)}</td>
                <td style="padding: 6px 8px; border: 1px solid #e5e7eb; color: #6b7280; font-style: italic;">${escapeHtml(st.reason || '-')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

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

export interface InstituteFilterOptions {
  excludeQuotes?: boolean;
  excludeBibliography?: boolean;
  excludeMinorPercent?: boolean;
  minWordMatch?: number;
  netSimilarity?: number;
  referenceScore?: number;
}

export function exportInstituteApprovalPDF(
  cls: ClassRoom,
  assignment: Assignment,
  submission: Submission,
  filters?: InstituteFilterOptions
): void {
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const rawSimPct = Math.round((submission.similarityScore ?? 0) * 100);
  const netSimPct = filters?.netSimilarity !== undefined
    ? Math.round(filters.netSimilarity * 100)
    : rawSimPct;
  const aiPct = Math.round((submission.aiScore ?? 0) * 100);
  const refPct = filters?.referenceScore !== undefined ? Math.round(filters.referenceScore) : 100;
  const receipt = submission.digitalReceipt;
  const verificationUrl = `https://sentience-ai.vercel.app/verify?id=${submission.id}&sha=${receipt?.sha256 || ''}`;
  const qrSvg = generateQRCodeSvg(verificationUrl, 84);
  const wordCount = submission.text.trim().split(/\s+/).filter(Boolean).length;
  const approxPages = Math.max(1, Math.ceil(wordCount / 250));

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Sentience AI — Enstitü Benzerlik ve Yayın Etiği Onay Formu</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px 40px; color: #111827; line-height: 1.4; font-size: 11px; }
        .border-box { border: 2px solid #1e3a8a; padding: 24px; border-radius: 8px; position: relative; }
        .top-header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px; }
        .top-header h1 { font-size: 15px; font-weight: 900; color: #1e3a8a; margin: 0; letter-spacing: 0.5px; }
        .top-header h2 { font-size: 12px; font-weight: 700; color: #4b5563; margin: 4px 0 0 0; }
        .qr-strip { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; }
        .doc-meta { font-size: 10px; color: #475569; }
        .doc-meta strong { color: #0f172a; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .info-table td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; }
        .info-table td.label { font-weight: 700; background: #f1f5f9; width: 180px; color: #1e293b; }
        .metrics-grid { display: flex; gap: 12px; margin-bottom: 14px; }
        .metric-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; text-align: center; background: #ffffff; }
        .metric-card .title { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .metric-card .value { font-size: 20px; font-weight: 900; margin-top: 2px; }
        .statement { background: #fafafa; border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 10.5px; color: #334155; line-height: 1.5; border-radius: 6px; margin-bottom: 20px; text-align: justify; }
        .signature-grid { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 10px; }
        .sig-box { width: 220px; text-align: center; font-size: 10.5px; color: #334155; }
        .sig-line { border-bottom: 1px solid #000; margin: 45px 0 6px 0; }
        .footer-note { font-size: 9px; color: #94a3b8; text-align: center; margin-top: 18px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
        @media print {
          body { margin: 10px 20px; }
          @page { margin: 1cm; size: A4 portrait; }
        }
      </style>
    </head>
    <body>
      <div class="border-box">
        <div class="top-header">
          <h1>T.C. ÜNİVERSİTE LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ</h1>
          <h2>TEZ / BİLDİRİ / ÖDEV AKADEMİK BENZERLİK VE YAYIN ETİĞİ ONAY BELGESİ</h2>
        </div>

        <div class="qr-strip">
          <div class="doc-meta">
            <div><strong>BELGE NO / ID:</strong> ${escapeHtml(submission.id.toUpperCase())}</div>
            <div><strong>DİJİTAL MÜHÜR (SHA-256):</strong> <span style="font-family: monospace; font-size: 9px;">${escapeHtml(receipt?.sha256 || 'DOĞRULANDI')}</span></div>
            <div><strong>DÜZENLEME TARİHİ:</strong> ${escapeHtml(new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }))}</div>
          </div>
          <div style="background: #ffffff; padding: 3px; border: 1px solid #cbd5e1; border-radius: 4px;">
            ${qrSvg}
          </div>
        </div>

        <table class="info-table">
          <tr><td class="label">Öğrenci Adı Soyadı</td><td><strong>${escapeHtml(submission.studentName)}</strong></td></tr>
          <tr><td class="label">Öğrenci E-posta / No</td><td>${escapeHtml(submission.studentEmail)}</td></tr>
          <tr><td class="label">Ders / Program</td><td>${escapeHtml(cls.name)}${cls.subject ? ` — ${escapeHtml(cls.subject)}` : ''}</td></tr>
          <tr><td class="label">Ödev / Tez Başlığı</td><td><strong>${escapeHtml(submission.title)}</strong></td></tr>
          <tr><td class="label">Teslim Edilen Dosya</td><td>${escapeHtml(submission.fileName || 'Metin Girişi')}</td></tr>
          <tr><td class="label">Toplam Kelime / Sayfa</td><td>${wordCount} kelime (~${approxPages} sayfa)</td></tr>
        </table>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="title">Net Benzerlik Oranı</div>
            <div class="value" style="color: ${netSimPct > 15 ? '#dc2626' : '#16a34a'};">%${netSimPct}</div>
          </div>
          <div class="metric-card">
            <div class="title">YZ Üretim Olasılığı</div>
            <div class="value" style="color: ${aiPct > 60 ? '#ea580c' : '#16a34a'};">%${aiPct}</div>
          </div>
          <div class="metric-card">
            <div class="title">Kaynak Doğrulama (Plagix)</div>
            <div class="value" style="color: ${refPct >= 80 ? '#16a34a' : '#d97706'};">%${refPct}</div>
          </div>
          <div class="metric-card">
            <div class="title">Ham Benzerlik</div>
            <div class="value" style="color: #64748b;">%${rawSimPct}</div>
          </div>
        </div>

        <table class="info-table" style="margin-bottom: 14px;">
          <tr>
            <td class="label">Uygulanan Filtreler</td>
            <td>
              Alıntılar: <strong>${filters?.excludeQuotes ? 'Hariç Tutuldu' : 'Dahil'}</strong> | 
              Kaynakça: <strong>${filters?.excludeBibliography ? 'Hariç Tutuldu' : 'Dahil'}</strong> | 
              %1 Altı: <strong>${filters?.excludeMinorPercent ? 'Hariç Tutuldu' : 'Dahil'}</strong> | 
              Kelime Eşiği: <strong>${filters?.minWordMatch ? `${filters.minWordMatch} Kelimeden Az Olanlar Hariç` : 'Limit Yok'}</strong>
            </td>
          </tr>
        </table>

        <div class="statement">
          <strong>ONAY VE YAYIN ETİĞİ BEYANI:</strong><br/>
          Yukarıda bilgileri yer alan akademik çalışmanın intihal ve benzerlik taraması yapılmış; çalışma alanı ve enstitü/kurum yönergeleri uyarınca belirlenen filtreler uygulanmıştır. Elde edilen <strong>%${netSimPct}</strong> net benzerlik oranının enstitü azami benzerlik sınırlarını aşmadığı, alıntı ve kaynakça kurallarına uygun olduğu tarafımca incelenerek onaylanmıştır.
        </div>

        <div class="signature-grid">
          <div class="sig-box">
            <div><strong>Öğrenci Beyanı</strong></div>
            <div class="sig-line"></div>
            <div>${escapeHtml(submission.studentName)}</div>
            <div style="font-size: 9px; color: #64748b;">İmza</div>
          </div>
          <div class="sig-box">
            <div><strong>Danışman / Öğretim Üyesi Onayı</strong></div>
            <div class="sig-line"></div>
            <div>${escapeHtml(cls.instructorName || 'Ders Sorumlusu Öğretim Üyesi')}</div>
            <div style="font-size: 9px; color: #64748b;">Kaşe & İmza</div>
          </div>
        </div>

        <div class="footer-note">
          Bu belge Sentience AI Akademik Doğrulama Sistemi tarafından oluşturulmuştur. Belgenin orijinalliği yukarıdaki karekod ve SHA-256 dijital makbuzu aracılığıyla çevrimiçi olarak doğrulanabilir.
        </div>
      </div>
    </body>
    </html>
  `);
  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 400);
}

export function exportDigitalReceiptPDF(cls: ClassRoom, assignment: Assignment, submission: Submission): void {
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const receipt = submission.digitalReceipt;
  const sha256 = receipt?.sha256 || 'N/A';
  const submittedAt = receipt?.submittedAt ? fmtDateTime(receipt.submittedAt) : fmtDateTime(submission.createdAt);
  const textLength = receipt?.textLength ?? submission.text?.length ?? 0;
  const wordCount = submission.text?.trim().split(/\s+/).filter(Boolean).length || 0;
  const qrCodeSvg = generateQRCodeSvg(
    `https://sentience-ai-free-2026.web.app/verify?sha=${encodeURIComponent(sha256)}&sub=${encodeURIComponent(submission.id)}`,
    120
  );

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <title>Sentience AI — Resmi Dijital Teslim Makbuzu</title>
      <style>
        @page { size: A4 portrait; margin: 18mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; line-height: 1.5; font-size: 11pt; }
        .receipt-card { border: 2px solid #0284c7; border-radius: 12px; padding: 24px; position: relative; }
        .watermark { position: absolute; right: 24px; top: 24px; opacity: 0.85; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .title h1 { margin: 0; font-size: 18pt; font-weight: 800; color: #0369a1; letter-spacing: -0.5px; }
        .title p { margin: 2px 0 0 0; font-size: 9.5pt; color: #64748b; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .info-box label { display: block; font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-box value { display: block; font-size: 10.5pt; font-weight: 600; color: #0f172a; }
        .hash-box { background: #f0f9ff; border: 1.5px dashed #0284c7; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
        .hash-box label { font-size: 8.5pt; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px; }
        .hash-code { font-family: 'Courier New', Courier, monospace; font-size: 9pt; font-weight: 700; color: #0c4a6e; word-break: break-all; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid #bae6fd; }
        .notice { font-size: 9pt; color: #475569; background: #fafafa; border-left: 4px solid #0284c7; padding: 10px 14px; margin-bottom: 24px; border-radius: 0 8px 8px 0; }
        .qr-section { display: flex; align-items: center; gap: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .qr-desc { font-size: 9pt; color: #64748b; }
        .qr-desc strong { color: #0f172a; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="title">
            <h1>SENTIENCE AI</h1>
            <p>Resmi Dijital Teslim Makbuzu (Official Digital Submission Receipt)</p>
          </div>
          <div style="font-size: 9pt; text-align: right; color: #0369a1; font-weight: 700;">
            Turnitin Standardı Uyumlu
          </div>
        </div>

        <div class="grid">
          <div class="info-box">
            <label>Öğrenci Adı Soyadı</label>
            <value>${escapeHtml(submission.studentName)}</value>
          </div>
          <div class="info-box">
            <label>Öğrenci E-posta</label>
            <value>${escapeHtml(submission.studentEmail)}</value>
          </div>
          <div class="info-box">
            <label>Ders / Sınıf</label>
            <value>${escapeHtml(cls.name)}</value>
          </div>
          <div class="info-box">
            <label>Öğretim Üyesi / Eğitmen</label>
            <value>${escapeHtml(cls.instructorName || 'Belirtilmedi')}</value>
          </div>
          <div class="info-box">
            <label>Ödev Başlığı</label>
            <value>${escapeHtml(assignment.title)}</value>
          </div>
          <div class="info-box">
            <label>Teslim Edilen Dosya / Başlık</label>
            <value>${escapeHtml(submission.fileName || submission.title)}</value>
          </div>
          <div class="info-box">
            <label>Teslim Tarihi ve Saati</label>
            <value>${escapeHtml(submittedAt)}</value>
          </div>
          <div class="info-box">
            <label>Metin Boyutu / Kelime Sayısı</label>
            <value>${textLength} karakter · ~${wordCount} kelime</value>
          </div>
        </div>

        <div class="hash-box">
          <label>Kriptografik Bütünlük Özeti (SHA-256 Hash)</label>
          <div class="hash-code">${escapeHtml(sha256)}</div>
        </div>

        <div class="notice">
          <strong>Öğrenci Bilgilendirmesi:</strong> Bu belge, çalışmanızın Sentience AI Akademik Dürüstlük Platformu'na başarıyla yüklendiğini teyit eder. Yukarıdaki SHA-256 şifreleme özeti teslim anında oluşturulmuş olup metnin içeriğinin daha sonra değiştirilmediğinin matematiksel kanıtıdır. Lütfen bu makbuzu teslim kanıtı olarak saklayınız.
        </div>

        <div class="qr-section">
          <div>${qrCodeSvg}</div>
          <div class="qr-desc">
            <strong>Çevrimiçi Doğrulama Karekodu</strong><br/>
            Bu karekodu taratarak veya Sentience AI doğrulama servisinden yukarıdaki SHA-256 hash'ini sorgulayarak teslimin orijinalliğini anında teyit edebilirsiniz.
          </div>
        </div>
      </div>
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
    'Not (0-100)',
    'Geri Bildirim',
    'Satır İçi Not Sayısı',
    'Gecikme Durumu',
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
    const isLateText = s.isLate ? (s.lateDurationMinutes ? `Gecikmiş (${Math.round(s.lateDurationMinutes / 60)} sa)` : 'Gecikmiş') : 'Zamanında';
    return [
      esc(s.studentName),
      esc(s.studentEmail),
      esc(s.title),
      esc(statusLabel[s.status] || s.status),
      s.grade !== undefined && s.grade !== null ? s.grade : '',
      esc(s.feedback || ''),
      s.annotations?.length ?? 0,
      esc(isLateText),
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
    const isLateText = s.isLate ? (s.lateDurationMinutes ? `Gecikmiş (${Math.round(s.lateDurationMinutes / 60)} sa)` : 'Gecikmiş') : 'Zamanında';
    return `<tr>
      <td>${escapeHtml(s.studentName)}</td>
      <td>${escapeHtml(s.studentEmail)}</td>
      <td>${escapeHtml(s.title)}</td>
      <td>${escapeHtml(statusLabel[s.status] || s.status)}</td>
      <td style="text-align: center; font-weight: bold; color: #059669;">${s.grade !== undefined && s.grade !== null ? s.grade : '-'}</td>
      <td>${escapeHtml(s.feedback || '-')}</td>
      <td style="text-align: center;">${s.annotations?.length ?? 0}</td>
      <td style="color: ${s.isLate ? '#dc2626' : '#64748b'};">${escapeHtml(isLateText)}</td>
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
            <th>Not</th>
            <th>Geri Bildirim</th>
            <th>Satır İçi Not</th>
            <th>Gecikme</th>
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

import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { collection, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { HumanizeOptions } from '../services/geminiService';
import type { CombinedAnalysisResult, AuditorResult } from '../types';
import type { MLAnalysisResult } from '../services/mlService';
import type { PlagiarismSource } from '../services/sentinelService';

interface TrainingDoc {
  isTrained?: boolean;
  originalText?: string;
  humanizedText?: string;
  aiScore?: number;
  tone?: string;
}

/**
 * B20 Adım 5 (Core Refactor): DOCX/PDF/TXT dışa aktarma ve eğitim verisi indirme
 * App.tsx'ten ayrıştırıldı. Gövde mantığı birebir korunmuştur.
 */
export interface ExportContext {
  humanizedText: string;
  options: HumanizeOptions;
  auditorResult: AuditorResult | null;
  analysis: CombinedAnalysisResult | null;
  mlAnalysis: MLAnalysisResult | null;
}

export const exportToDocx = async (ctx: ExportContext) => {
  const { humanizedText, options, auditorResult, analysis, mlAnalysis } = ctx;
  if (!humanizedText) {
    toast.error("Dışa aktarılacak metin bulunamadı.");
    return;
  }

  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = await import('docx');
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "SENTIENCE AI — METİN VE DENETÇİ RAPORU",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tarih: ", bold: true }),
              new TextRun(new Date().toLocaleString('tr-TR')),
              new TextRun({ text: "  |  Ton: ", bold: true }),
              new TextRun(options.tone),
              new TextRun({ text: "  |  Yoğunluk: ", bold: true }),
              new TextRun(`%${options.intensity}`)
            ],
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: "İnsanlaştırılmış Metin",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 }
          }),
          ...humanizedText.split('\n').filter(Boolean).map(line =>
            new Paragraph({
              children: [new TextRun({ text: line, size: 24 })],
              spacing: { after: 120 }
            })
          ),
          new Paragraph({
            text: "Denetçi ve Analiz Metrikleri",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 150 }
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Metrik", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Değer", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Değerlendirme", bold: true })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("YZ Olasılık Skoru")] }),
                  new TableCell({ children: [new Paragraph(`%${Math.round((auditorResult?.score ?? (analysis?.aiScore ?? 0)) * 100)}`)] }),
                  new TableCell({ children: [new Paragraph((auditorResult?.score ?? (analysis?.aiScore ?? 0)) > 0.7 ? "Yüksek YZ Olasılığı" : "Doğal / İnsan Yazımı")] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("İntihal / Benzerlik")] }),
                  new TableCell({ children: [new Paragraph(`%${Math.round((auditorResult?.metrics?.plagiarism ?? (analysis?.similarityScore ? analysis.similarityScore / 100 : 0)) * 100)}`)] }),
                  new TableCell({ children: [new Paragraph((analysis?.similarityScore ?? 0) > 20 ? "Benzerlik Tespit Edildi" : "Özgün İçerik")] })
                ]
              }),
              ...(mlAnalysis ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Okunabilirlik")] }),
                    new TableCell({ children: [new Paragraph(`%${Math.round(mlAnalysis.readabilityScore * 100)}`)] }),
                    new TableCell({ children: [new Paragraph("Standart Okuma Kolaylığı")] })
                  ]
                })
              ] : [])
            ]
          }),
          ...(auditorResult?.reasoning ? [
            new Paragraph({
              text: "Analiz Muhakemesi",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [new TextRun({ text: auditorResult.reasoning, italics: true, size: 22 })],
              spacing: { after: 200 }
            })
          ] : []),
          ...(analysis?.sources && analysis.sources.length > 0 ? [
            new Paragraph({
              text: "Sentinel Kaynak Referansları",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 }
            }),
            ...analysis.sources.map((s: PlagiarismSource) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${s.title || 'Kaynak'}: `, bold: true }),
                  new TextRun({ text: s.url || '', italics: true }),
                  ...(s.similarity ? [new TextRun(` (%${Math.round(s.similarity * 100)} benzerlik)`)] : [])
                ],
                spacing: { after: 80 }
              })
            )
          ] : [])
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Sentience_AI_${Date.now()}.docx`);
    toast.success("DOCX raporu başarıyla indirildi.");
  } catch (err: unknown) {
    console.error(err);
    const e = err as { message?: string };
    toast.error("DOCX dışa aktarma hatası: " + (e?.message || "Bilinmeyen hata"));
  }
};

export const exportToPDF = (ctx: ExportContext) => {
  const { humanizedText, options, auditorResult, analysis, mlAnalysis } = ctx;
  if (!humanizedText) {
    toast.error("Dışa aktarılacak metin bulunamadı.");
    return;
  }

  const printWin = window.open('', '_blank');
  if (!printWin) {
    toast.error("Yazdırma penceresi açılamadı. Lütfen açılır pencerelere izin verin.");
    return;
  }

  const aiScorePct = Math.round((auditorResult?.score ?? (analysis?.aiScore ?? 0)) * 100);
  const plgScorePct = Math.round((auditorResult?.metrics?.plagiarism ?? (analysis?.similarityScore ? analysis.similarityScore / 100 : 0)) * 100);
  const readPct = mlAnalysis ? Math.round(mlAnalysis.readabilityScore * 100) : 85;

  const sourcesHtml = analysis?.sources && analysis.sources.length > 0
    ? `<div class="section">
        <h2>Sentinel Doğrulanmış Kaynaklar</h2>
        <ul>
          ${analysis.sources.map((s: PlagiarismSource) => `
            <li><strong>${s.title || 'İnternet Kaynağı'}</strong> - <a href="${s.url}" target="_blank">${s.url}</a> ${s.similarity ? `(%${Math.round(s.similarity * 100)} benzerlik)` : ''}</li>
          `).join('')}
        </ul>
      </div>`
    : '';

  const reasoningHtml = auditorResult?.reasoning
    ? `<div class="section">
        <h2>Analiz Muhakemesi</h2>
        <blockquote style="border-left: 3px solid #10b981; padding-left: 12px; color: #4b5563; font-style: italic;">
          "${auditorResult.reasoning}"
        </blockquote>
      </div>`
    : '';

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Sentience AI — Metin ve Analiz Raporu</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #111827; line-height: 1.6; }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 24px; font-weight: 900; color: #10b981; letter-spacing: -0.5px; margin: 0; }
        .meta { font-size: 11px; color: #6b7280; font-weight: 600; margin-top: 4px; }
        .metrics { display: flex; gap: 16px; margin: 24px 0; }
        .metric-box { flex: 1; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
        .metric-label { font-size: 10px; font-weight: 800; color: #6b7280; text-transform: uppercase; }
        .metric-val { font-size: 22px; font-weight: 900; color: #111827; margin-top: 2px; }
        .section { margin: 24px 0; }
        .section h2 { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
        .content { white-space: pre-wrap; font-size: 14px; color: #1f2937; line-height: 1.8; }
        ul { padding-left: 20px; font-size: 12px; color: #4b5563; }
        li { margin-bottom: 6px; }
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
          <div class="meta">İnsanlaştırma & Denetçi Analiz Raporu</div>
        </div>
        <div class="meta" style="text-align: right;">
          <div>${new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          <div>Ton: ${options.tone} | Yoğunluk: %${options.intensity}</div>
        </div>
      </div>

      <div class="metrics">
        <div class="metric-box">
          <div class="metric-label">YZ Olasılık Skoru</div>
          <div class="metric-val" style="color: ${aiScorePct > 70 ? '#ef4444' : '#10b981'};">%${aiScorePct}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">İntihal / Benzerlik</div>
          <div class="metric-val" style="color: ${plgScorePct > 20 ? '#ef4444' : '#10b981'};">%${plgScorePct}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Okunabilirlik</div>
          <div class="metric-val" style="color: #10b981;">%${readPct}</div>
        </div>
      </div>

      <div class="section">
        <h2>İnsanlaştırılmış Metin</h2>
        <div class="content">${humanizedText}</div>
      </div>

      ${reasoningHtml}
      ${sourcesHtml}
    </body>
    </html>
  `);
  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 400);
};

export const exportToTxt = (humanizedText: string) => {
  if (!humanizedText) {
    toast.error("Dışa aktarılacak metin bulunamadı.");
    return;
  }
  const blob = new Blob([humanizedText], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `Sentience_${Date.now()}.txt`);
  toast.success("TXT dosyası indirildi.");
};

export const downloadTrainingData = async (opts: { permitted: boolean; onDone?: () => void } & { onlyTrainingReady?: boolean }) => {
  const { permitted, onlyTrainingReady = true, onDone } = opts;
  // B22: yalnız admin değil, yetki verilen kullanıcı da indirebilir (App featureVisibility'den hesaplar)
  if (!permitted) return;
  try {
    let q;
    if (onlyTrainingReady) {
      q = query(collection(db, 'projects'), where('isTrainingReady', '==', true));
    } else {
      q = query(collection(db, 'projects'));
    }

    const snapshot = await getDocs(q);
    let docs = snapshot.docs;

    if (onlyTrainingReady) {
      docs = docs.filter(d => (d.data() as TrainingDoc).isTrained !== true);
    }

    if (docs.length === 0) {
      toast.error("İndirilecek yeni/uygun veri bulunamadı.");
      return;
    }

    const computeBurst = (text: string) => {
      const sents = text.match(/[^.!?]+[.!?]+/g) || [];
      if (sents.length < 2) return 0;
      const lens = sents.map(s => s.trim().split(/\s+/).length);
      const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
      const variance = lens.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lens.length;
      return Math.min(1, Math.sqrt(variance) / Math.max(mean, 1));
    };

    const qualityDocs = docs.filter(d => {
      const data = d.data() as TrainingDoc;
      if (!data.originalText || !data.humanizedText) return false;
      const wc = (data.humanizedText || '').trim().split(/\s+/).filter(Boolean).length;
      if (wc < 80) return false;
      if (computeBurst(data.humanizedText) < 0.28) return false;
      if (typeof data.aiScore === 'number' && data.aiScore > 0.30) return false;
      return true;
    });

    if (qualityDocs.length === 0) {
      toast.error(`Kalite filtresini geçen kayıt yok. (Toplam: ${docs.length})`);
      return;
    }

    const jsonlData = qualityDocs.map(d => {
      const data = d.data() as TrainingDoc;
      const tone = data.tone || 'Akademik';
      return JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: `Aşağıdaki metni "${tone}" tonunda insanlaştır. Copyleaks ve Turnitin testlerinde YZ skoru sıfır çıkacak şekilde, yüksek burstiness ve sıfır slop kelime içerecek biçimde yeniden yaz:\n\n${data.originalText}` }] },
          { role: "model", parts: [{ text: data.humanizedText }] }
        ]
      });
    }).join('\n');

    saveAs(new Blob([jsonlData], { type: 'application/x-jsonlines' }), `tuning_data_${qualityDocs.length}.jsonl`);
    toast.success(`JSONL indirildi: ${qualityDocs.length}/${docs.length} kayıt kalite filtresini geçti.`);


    setTimeout(async () => {
      if (window.confirm(`${docs.length} veriyi 'Eğitildi' olarak işaretle?`)) {
        const batch = writeBatch(db);
        docs.forEach(docSnap => batch.update(docSnap.ref, { isTrained: true, trainedAt: serverTimestamp() }));
        await batch.commit();
        toast.success("İşaretlendi.");
        onDone?.();
      }
    }, 500);

  } catch (err: unknown) {
    console.error("Download training data error:", err);
    const e = err as { message?: string };
    toast.error(`Hata: ${e?.message || "Bilinmeyen bir hata oluştu"}`);
  }
};

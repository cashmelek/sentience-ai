import JSZip from 'jszip';
import { DocxForensicReport } from '../types/classroom';

const getTagValue = (xml: string, tag: string): string => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match && match[1] ? match[1].trim() : '';
};

const getCustomProperty = (xml: string, propName: string): string => {
  const regex = new RegExp(`name="${propName}"[\\s\\S]*?<vt:lpwstr>([\\s\\S]*?)<\\/vt:lpwstr>`, 'i');
  const match = xml.match(regex);
  return match && match[1] ? match[1].trim() : '';
};

export const extractDocxForensics = async (
  arrayBuffer: ArrayBuffer,
  extractedWordCount: number,
  expectedStudentUid?: string
): Promise<DocxForensicReport> => {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    let appXml = '';
    let coreXml = '';
    let customXml = '';
    let documentXml = '';

    const appFile = zip.file('docProps/app.xml');
    if (appFile) {
      appXml = await appFile.async('string');
    }

    const coreFile = zip.file('docProps/core.xml');
    if (coreFile) {
      coreXml = await coreFile.async('string');
    }

    const customFile = zip.file('docProps/custom.xml');
    if (customFile) {
      customXml = await customFile.async('string');
    }

    const docFile = zip.file('word/document.xml');
    if (docFile) {
      documentXml = await docFile.async('string');
    }

    const rawTotalTime = getTagValue(appXml, 'TotalTime');
    const totalEditingTimeMinutes = rawTotalTime ? parseInt(rawTotalTime, 10) : 0;

    const rawWords = getTagValue(appXml, 'Words');
    const docxWordCount = rawWords ? parseInt(rawWords, 10) : extractedWordCount;
    const wordCount = Math.max(docxWordCount, extractedWordCount);

    const application = getTagValue(appXml, 'Application') || undefined;

    const rawRevision = getTagValue(coreXml, 'cp:revision');
    const revisionNumber = rawRevision ? parseInt(rawRevision, 10) : 1;

    const created = getTagValue(coreXml, 'dcterms:created') || undefined;
    const modified = getTagValue(coreXml, 'dcterms:modified') || undefined;
    const creator = getTagValue(coreXml, 'dc:creator') || undefined;
    const lastModifiedBy = getTagValue(coreXml, 'cp:lastModifiedBy') || undefined;

    const addinSessionId = customXml ? getCustomProperty(customXml, 'sentience_session_id') : undefined;
    const addinStudentUid = customXml ? getCustomProperty(customXml, 'sentience_student_uid') : undefined;

    const isAddinVerified = Boolean(
      addinStudentUid &&
      expectedStudentUid &&
      addinStudentUid === expectedStudentUid
    );

    const hasClipboardToken = Boolean(
      documentXml && (
        documentXml.includes('sentience-origin') ||
        documentXml.includes('sentience-token') ||
        documentXml.includes('sentience_sig')
      )
    );

    let clipboardOriginAccount: string | undefined;
    if (hasClipboardToken) {
      const match = documentXml.match(/sentience-origin="([^"]+)"/);
      if (match && match[1]) {
        clipboardOriginAccount = match[1];
      }
    }

    const effectiveTime = totalEditingTimeMinutes > 0 ? totalEditingTimeMinutes : 0.5;
    const wpm = Math.round(wordCount / effectiveTime);

    let isSuspiciousBulkPaste = false;
    let forensicReason = '';

    if (wordCount >= 200 && (totalEditingTimeMinutes <= 2 || wpm > 200)) {
      isSuspiciousBulkPaste = true;
      forensicReason = `Word düzenleme süresi (${totalEditingTimeMinutes} dk) kelime sayısına (${wordCount} kelime) göre anormal derecede düşüktür (${wpm} kelime/dk). Metin Word içerisine dışarıdan toplu yapıştırılmıştır.`;
    } else if (hasClipboardToken) {
      isSuspiciousBulkPaste = true;
      forensicReason = `Word belgesi XML dokusunda platform içi pano köken damgası saptanmıştır${clipboardOriginAccount ? ` (Kaynak Hesap: ${clipboardOriginAccount})` : ''}.`;
    } else {
      isSuspiciousBulkPaste = false;
      forensicReason = `Word adli düzenleme süresi (${totalEditingTimeMinutes} dk, ${revisionNumber} revizyon) organik yazım standartlarıyla uyumludur.`;
    }

    return {
      totalEditingTimeMinutes,
      revisionNumber,
      wordCount,
      wpm,
      application,
      created,
      modified,
      creator,
      lastModifiedBy,
      isSuspiciousBulkPaste,
      forensicReason,
      addinSessionId: addinSessionId || undefined,
      addinStudentUid: addinStudentUid || undefined,
      isAddinVerified: isAddinVerified || undefined,
      hasClipboardToken,
      clipboardOriginAccount
    };
  } catch (err: any) {
    return {
      totalEditingTimeMinutes: 0,
      revisionNumber: 1,
      wordCount: extractedWordCount,
      wpm: 0,
      isSuspiciousBulkPaste: false,
      forensicReason: 'Word adli bilişim meta verileri okunamadı veya dosya korumalı.'
    };
  }
};

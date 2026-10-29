import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { extractDocxForensics } from '../services/docxForensicService';

describe('Docx Forensic Telemetry Suite', () => {
  it('handles corrupted or empty buffers safely', async () => {
    const emptyBuffer = new ArrayBuffer(0);
    const result = await extractDocxForensics(emptyBuffer, 100);
    expect(result.totalEditingTimeMinutes).toBe(0);
    expect(result.revisionNumber).toBe(1);
    expect(result.isSuspiciousBulkPaste).toBe(false);
  });

  it('detects anomalous bulk paste when totalEditingTime is very low for large word count', async () => {
    const zip = new JSZip();
    zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
        <TotalTime>1</TotalTime>
        <Words>600</Words>
        <Application>Microsoft Office Word</Application>
      </Properties>
    `);
    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties">
        <cp:revision>1</cp:revision>
        <dc:creator>Test User</dc:creator>
      </cp:coreProperties>
    `);

    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const result = await extractDocxForensics(arrayBuffer, 600);

    expect(result.totalEditingTimeMinutes).toBe(1);
    expect(result.revisionNumber).toBe(1);
    expect(result.wpm).toBeGreaterThan(200);
    expect(result.isSuspiciousBulkPaste).toBe(true);
    expect(result.forensicReason).toContain('anormal derecede düşüktür');
  });

  it('certifies organic authorship when totalEditingTime and revisions are realistic', async () => {
    const zip = new JSZip();
    zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
        <TotalTime>85</TotalTime>
        <Words>750</Words>
        <Application>Microsoft Office Word</Application>
      </Properties>
    `);
    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties">
        <cp:revision>26</cp:revision>
        <dc:creator>Ahmet Yılmaz</dc:creator>
      </cp:coreProperties>
    `);

    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const result = await extractDocxForensics(arrayBuffer, 750);

    expect(result.totalEditingTimeMinutes).toBe(85);
    expect(result.revisionNumber).toBe(26);
    expect(result.wpm).toBeLessThan(100);
    expect(result.isSuspiciousBulkPaste).toBe(false);
    expect(result.forensicReason).toContain('organik yazım standartlarıyla uyumludur');
  });

  it('detects embedded custom addin identity metadata when present', async () => {
    const zip = new JSZip();
    zip.file('docProps/app.xml', `<Properties><TotalTime>40</TotalTime><Words>300</Words></Properties>`);
    zip.file('docProps/core.xml', `<cp:coreProperties><cp:revision>12</cp:revision></cp:coreProperties>`);
    zip.file('docProps/custom.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties">
        <property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="sentience_session_id">
          <vt:lpwstr>sess_test_987</vt:lpwstr>
        </property>
        <property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="3" name="sentience_student_uid">
          <vt:lpwstr>student_123</vt:lpwstr>
        </property>
      </Properties>
    `);

    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const result = await extractDocxForensics(arrayBuffer, 300, 'student_123');

    expect(result.addinSessionId).toBe('sess_test_987');
    expect(result.addinStudentUid).toBe('student_123');
    expect(result.isAddinVerified).toBe(true);
  });
});

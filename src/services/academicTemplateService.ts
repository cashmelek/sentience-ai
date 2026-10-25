import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';

/**
 * Normalizes Turkish characters specifically for jsPDF default fonts (Helvetica/WinAnsi).
 * Preserves ö, Ö, ç, Ç, ü, Ü (valid WinAnsi Latin-1).
 * Maps ğ, Ğ, ş, Ş, ı, İ to standard ASCII representations to prevent corrupt glyphs.
 */
function normalizeForPdf(str: string): string {
  return str
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I');
}

/**
 * 1. Akademik Dürüstlük ve Özgünlük Taahhütnamesi Şablonu (.docx)
 */
export async function downloadIntegrityPledgeDocx(): Promise<void> {
  try {
    toast.loading('Akademik Taahhütname (.docx) hazırlanıyor...', { id: 'docx-pledge' });
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      Table,
      TableRow,
      TableCell,
      WidthType,
      AlignmentType,
      BorderStyle
    } = await import('docx');

    const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const cellBorders = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle
    };

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'T.C.',
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),
            new Paragraph({
              text: '[ÜNİVERSİTE ADI GİRİNİZ]',
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),
            new Paragraph({
              text: 'LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ MÜDÜRLÜĞÜNE',
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'BİLİMSEL ETİK VE AKADEMİK DÜRÜSTLÜK TAAHHÜTNAMESİ',
                  bold: true,
                  size: 26,
                  color: '0F172A'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: 'Öğrencinin Adı Soyadı', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      children: [new Paragraph('[Adınızı ve Soyadınızı Yazınız]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Öğrenci Numarası', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Öğrenci Numaranızı Yazınız]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Anabilim Dalı / Program', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Anabilim Dalı / Tezli Yüksek Lisans / Doktora]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Danışman Öğretim Üyesi', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Unvanı, Adı ve Soyadı]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Tez / Çalışma Başlığı', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Tez veya Akademik Çalışmanızın Tam Başlığı]')]
                    })
                  ]
                })
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 250 } }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Yukarıda bilgileri belirtilen tez / araştırma çalışması ile ilgili olarak aşağıdaki hususları taahhüt ederim:',
                  italics: true
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '1. ', bold: true }),
                new TextRun(
                  'Bu tez/çalışmanın planlanması, veri toplanması, laboratuvar ve saha araştırmaları ile yazım aşamalarında YÖK Bilimsel Araştırma ve Yayın Etiği Yönergesi hükümlerine ve tüm akademik dürüstlük ilkelerine titizlikle uyulduğunu,'
                )
              ],
              spacing: { after: 140 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '2. ', bold: true }),
                new TextRun(
                  'Çalışmada yararlanılan tüm yerli ve yabancı kaynakların, veri setlerinin, grafik ve görsel unsurların akademik atıf standartlarına (APA 7 / IEEE vb.) uygun olarak eksiksiz referans gösterildiğini,'
                )
              ],
              spacing: { after: 140 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '3. ', bold: true }),
                new TextRun(
                  'Çalışmanın Sentience AI / Turnitin benzerlik tarama sistemine tabi tutulduğunu, alıntılar ve kaynakça hariç tutulduğunda net benzerlik oranının enstitü tarafından belirlenen azami sınırın (%20) altında olduğunu,'
                )
              ],
              spacing: { after: 140 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '4. ', bold: true }),
                new TextRun(
                  'Üretken yapay zeka araçlarının yalnızca dil denetimi, biçimlendirme ve literatür organizasyonunda destek amaçlı kullanıldığını; çalışmanın özgün hipotezlerinin, analizlerinin ve sonuçlarının doğrudan şahsım tarafından üretildiğini,'
                )
              ],
              spacing: { after: 140 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '5. ', bold: true }),
                new TextRun(
                  'Aksine bir durumun tespiti halinde doğacak her türlü akademik, idari ve hukuki yaptırımı kabul ettiğimi şerefim üzerine beyan ve taahhüt ederim.'
                )
              ],
              spacing: { after: 350 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'ÖĞRENCİ', bold: true })], alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: 'Tarih: ..... / ..... / 202...', alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
                        new Paragraph({ text: 'İmza: .....................................', alignment: AlignmentType.CENTER, spacing: { before: 160 } })
                      ]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'TEZ DANIŞMANI ONAYI', bold: true })], alignment: AlignmentType.CENTER }),
                        new Paragraph({ text: 'Unvan, Ad Soyad: ........................', alignment: AlignmentType.CENTER, spacing: { before: 100 } }),
                        new Paragraph({ text: 'İmza / Mühür: ............................', alignment: AlignmentType.CENTER, spacing: { before: 160 } })
                      ]
                    })
                  ]
                })
              ]
            }),
            new Paragraph({
              text: 'Sentience AI Akademik Bütünlük ve Doğrulama Sistemi — Resmi Şablon Belgesi',
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
              children: [
                new TextRun({
                  text: '\nNot: Bu form enstitü tez teslim dosyasında tezin ilk sayfalarından sonra yer almalıdır.',
                  size: 18,
                  italics: true,
                  color: '64748B'
                })
              ]
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'Akademik_Durustluk_ve_Ozgunluk_Taahhutnamesi.docx');
    toast.success('Taahhütname (.docx) başarıyla indirildi.', { id: 'docx-pledge' });
  } catch (error) {
    console.error('Docx export failed:', error);
    toast.error('Belge oluşturulurken hata oluştu.', { id: 'docx-pledge' });
  }
}

/**
 * 2. YÖK Uyumlu Tez Benzerlik Raporu Kapak Sayfası (.pdf)
 * Kullanıcının onayladığı Seçenek 2: Üniversite / YÖK enstitü standartlarına uygun,
 * model şablon uyarısı içeren kurumsal PDF belgesi.
 */
export async function downloadThesisSimilarityCoverPdf(): Promise<void> {
  try {
    toast.loading('Tez Kapak Sayfası (.pdf) oluşturuluyor...', { id: 'pdf-thesis' });
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Outer border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.rect(10, 10, 190, 277);

    // Inner subtle border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(12, 12, 186, 273);

    // Top Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(13, 13, 184, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(normalizeForPdf('T.C. [UNIVERSITENIZIN ADI] LISANSUSTU EGITIM ENSTITUSU'), 105, 21, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(normalizeForPdf('TEZ CALISMASI BENZERLIK VE AKADEMIK BUTUNLUK ONAY BELGESI'), 105, 27, { align: 'center' });

    // Model Notice Strip (User Option 2 Requirement)
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.roundedRect(16, 35, 178, 10, 2, 2, 'FD');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(
      normalizeForPdf('[ ORNEK SABLON BELGE — Universitenizin Lisansustu Egitim Enstitusu Standartlarina Gore Duzenleyiniz ]'),
      105,
      41.5,
      { align: 'center' }
    );

    // Section 1: Thesis & Student Metadata Table
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(normalizeForPdf('1. TEZ VE OGRENCI BILGILERI'), 16, 52);

    const rowsMeta = [
      ['Ogrenci No / TC Kimlik', '2023901048 / 10000000000'],
      ['Adi ve Soyadi', '[Ogrenci Ad Soyad Giriniz]'],
      ['Anabilim Dali / Program', 'Bilgisayar Muhendisligi / Tezli Yuksek Lisans'],
      ['Tez Danismani', 'Prof. Dr. [Danisman Ad Soyad Giriniz]'],
      ['Tezin Basligi', '[Tez Calismasinin Tam Basligi Buraya Gelecektir]'],
      ['Toplam Sayfa / Sozcuk', '142 Sayfa / 38.450 Sozcuk']
    ];

    let startY = 56;
    doc.setFontSize(8);
    rowsMeta.forEach(([col1, col2]) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(16, startY, 55, 6.5, 'FD');
      doc.rect(71, startY, 123, 6.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(normalizeForPdf(col1), 18, startY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(normalizeForPdf(col2), 74, startY + 4.5);
      startY += 6.5;
    });

    // Section 2: Sentinel & Similarity Audit Results
    startY += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(normalizeForPdf('2. SENTIENCE AI / SENTINEL BENZERLIK TARAMA SONUCLARI'), 16, startY);

    startY += 4;
    // Parameter checklist strip
    doc.setFillColor(241, 245, 249);
    doc.rect(16, startY, 178, 7, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(
      normalizeForPdf('Filtreler: [X] Kaynakca Haric  |  [X] Dogrudan Alintilar (Tirnak) Haric  |  [X] 5 Kelimeden Az Eslesmeler Haric'),
      105,
      startY + 4.8,
      { align: 'center' }
    );

    startY += 10;
    // Score cards grid
    const cards = [
      { label: 'GENEL BENZERLIK', val: '% 12', note: 'Enstitu Esigi: Max %20', ok: true },
      { label: 'TEKIL KAYNAK MAX', val: '% 3', note: 'Enstitu Esigi: Max %5', ok: true },
      { label: 'YZ ORISINALLIK', val: '% 96', note: 'Sentinel Guven Skoru', ok: true },
      { label: 'BUTUNLUK BAYRAKLARI', val: '0 ADET', note: 'Homoglif / Gizli Karakter', ok: true }
    ];

    cards.forEach((c, idx) => {
      const cardX = 16 + idx * 45;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(cardX, startY, 43, 20, 1.5, 1.5, 'FD');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(normalizeForPdf(c.label), cardX + 21.5, startY + 4.5, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 149, 106); // emerald dark
      doc.text(c.val, cardX + 21.5, startY + 12, { align: 'center' });

      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(normalizeForPdf(c.note), cardX + 21.5, startY + 17, { align: 'center' });
    });

    // Section 3: Advisor Declaration & Statement
    startY += 26;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(normalizeForPdf('3. DANISMAN DEGERLENDIRMESI VE ONAYI'), 16, startY);

    startY += 4;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(16, startY, 178, 24, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const declText = normalizeForPdf(
      'Yukarida basligi ve bilgileri yer alan tez calismasinin Sentience AI ve Sentinel intihal tespit sistemi kullanilarak gerceklestirilen benzerlik taramasi tarafimca incelenmistir. Calismanin YOK ve Enstitu Lisansustu Tez Yazim ve Benzerlik Kilavuzundaki etik kurallara ve benzerlik orani sinirlarina tam uygunluk gosterdigi, tezin savunma sinavina girmesinde akademik butunluk acisindan bir sakinca bulunmadigi beyan ve onaylanir.'
    );
    doc.text(declText, 19, startY + 5, { maxWidth: 172, lineHeightFactor: 1.4 });

    // Section 4: Signature Blocks
    startY += 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(normalizeForPdf('4. IMZA VE ONAY HEYETI'), 16, startY);

    startY += 4;
    const signBoxes = [
      { role: 'TEZ OGRENCISI', name: '[Ad Soyad]', date: 'Tarih: ..... / ..... / 202...', sign: 'Imza: .........................' },
      { role: 'TEZ DANISMANI', name: 'Prof. Dr. [Danisman]', date: 'Tarih: ..... / ..... / 202...', sign: 'Imza: .........................' },
      { role: 'ANABILIM DALI BASKANI', name: 'Prof. Dr. [Bolum Baskani]', date: 'Tarih: ..... / ..... / 202...', sign: 'Imza / Muhur: ..............' }
    ];

    signBoxes.forEach((s, idx) => {
      const boxX = 16 + idx * 60;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(boxX, startY, 58, 28, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(normalizeForPdf(s.role), boxX + 29, startY + 6, { align: 'center' });

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(normalizeForPdf(s.name), boxX + 29, startY + 12, { align: 'center' });
      doc.text(s.date, boxX + 29, startY + 18, { align: 'center' });
      doc.text(normalizeForPdf(s.sign), boxX + 29, startY + 24, { align: 'center' });
    });

    // Footer with Digital Receipt & SHA-256
    startY += 34;
    doc.setDrawColor(203, 213, 225);
    doc.line(16, startY, 194, startY);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      normalizeForPdf('Sentience AI Akademik Dogrulama Sistemi — Rapor ID: STC-2026-YOK-94812 — SHA-256 Guvenlik Dogrulamasi'),
      105,
      startY + 4.5,
      { align: 'center' }
    );
    doc.text(
      normalizeForPdf('Bu belge YÖK Tez Merkezi ve Lisansustu Enstituler icin ornek standart formatta uretilmistir.'),
      105,
      startY + 8,
      { align: 'center' }
    );

    doc.save('YOK_Uyumlu_Tez_Benzerlik_Raporu_Kapak_Sayfasi.pdf');
    toast.success('YÖK Uyumlu Tez Kapak Sayfası (.pdf) başarıyla indirildi.', { id: 'pdf-thesis' });
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('PDF oluşturulurken hata oluştu.', { id: 'pdf-thesis' });
  }
}

/**
 * 3. APA 7 & IEEE Hızlı Kaynak Gösterme Kılavuzu (.pdf)
 */
export async function downloadCitationGuidePdf(): Promise<void> {
  try {
    toast.loading('Atıf Kılavuzu (.pdf) hazırlanıyor...', { id: 'pdf-cite' });
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Page Frame
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Header Title Strip
    doc.setFillColor(15, 23, 42);
    doc.rect(12, 12, 186, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('SENTIENCE AI — AKADEMIK KAYNAK GOSTERME KILAVUZU', 105, 21, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('APA 7. Baski & IEEE Standartlari Hizli Basvuru Rehberi', 105, 27, { align: 'center' });

    let y = 38;

    // SECTION 1: APA 7
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(normalizeForPdf('BOLUM 1: APA 7. BASKI STANDARTLARI (Sosyal, Beseri ve Saglik Bilimleri)'), 17, y + 5);

    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeForPdf('A. Metin Ici Atif Kurallari:'), 16, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const apaRules = [
      '• Tek Yazar: ...yapilan arastirmalarda (Yilmaz, 2023) veya Yilmaz (2023) tarafindan belirtildigi uzere...',
      '• Iki Yazar: ...literaturde (Demir & Kaya, 2022) / Demir ve Kaya (2022) bulgularina gore...',
      '• Uc ve Daha Fazla Yazar: Ilk atiftan itibaren "vd." kullanilir: (Aydin vd., 2024) veya Aydin vd. (2024)...',
      '• Dogrudan Alinti: Tırnak icinde sayfa no ile verilir: (Yilmaz, 2023, s. 45).'
    ];
    apaRules.forEach((r) => {
      doc.text(normalizeForPdf(r), 18, y);
      y += 4.5;
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(normalizeForPdf('B. Kaynakca (References) Formati:'), 16, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const apaRefs = [
      '• Dergi Makalesi: Yazar, A. A., & Yazar, B. B. (2024). Makale basligi. Dergi Adi, 12(3), 105-118. https://doi.org/...',
      '• Kitap: Yazar, A. A. (2023). Kitabin tam adi (2. bs.). Yayinevi Adi.',
      '• Tez: Yilmaz, M. (2022). Tezin basligi [Yuksek lisans / Doktora tezi, Universite Adi]. YOK Tez Merkezi.',
      '• Web Kaynagi: Kurum Adi. (2024, 15 Mart). Sayfa basligi. https://www.ornek.gov.tr'
    ];
    apaRefs.forEach((r) => {
      doc.text(normalizeForPdf(r), 18, y);
      y += 4.5;
    });

    // SECTION 2: IEEE
    y += 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(normalizeForPdf('BOLUM 2: IEEE FORMAT STANDARTLARI (Muhendislik, Bilgisayar, Fen Bilimleri)'), 17, y + 5);

    y += 10;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeForPdf('A. Numaralandirma ve Metin Ici Atif:'), 16, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const ieeeRules = [
      '• Koseli Parantez Numaralandirma: Calismada atif sirasina gore [1], [2], [3] seklinde atanir.',
      '• Coklu Atif: Ayni anda yapilan atiflar: [1], [3] veya uc ve fazlasi icin [4]-[7] seklinde gruplanir.',
      '• Cumle Ici Kullanimi: "[2] numarali kaynakta gosterildigi uzere..." veya "...kanitlanmistir [3]."'
    ];
    ieeeRules.forEach((r) => {
      doc.text(normalizeForPdf(r), 18, y);
      y += 4.5;
    });

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(normalizeForPdf('B. Kaynakca Formati:'), 16, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const ieeeRefs = [
      '• [1] J. K. Author, "Name of paper," IEEE Trans. Autom. Control, vol. 55, no. 2, pp. 240-252, Feb. 2024.',
      '• [2] G. O. Young, "Synthetic structure," in Plastics, 2nd ed., vol. 3, J. Peters, Ed. New York: McGraw-Hill, 2023, pp. 15-64.',
      '• [3] M. Yilmaz and E. Kaya, "Deep learning in anomaly detection," in Proc. IEEE ICASSP, 2023, pp. 120-125.'
    ];
    ieeeRefs.forEach((r) => {
      doc.text(normalizeForPdf(r), 18, y);
      y += 4.5;
    });

    // SECTION 3: AI CITATION
    y += 5;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(normalizeForPdf('BOLUM 3: YAPAY ZEKA VE SENTIENCE AI ARACLARININ BILDIRIMI'), 17, y + 5);

    y += 10;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const aiTexts = [
      '1. Dil modelleri ve yapay zeka sistemleri fikri hak sahibi kabul edilmediginden "Yazar" olarak atiflanamaz.',
      '2. Metin duzenleme, gramer denetimi veya kod refactor islemleri icin kullanildiginda Tezin "Yontem" veya "Tesekkur"',
      '   bolumunde model adi, surumu, erisim tarihi ve kullanilan istem (prompt) amaci acikca belirtilmelidir.',
      '3. Ornek Aciklama Cumlesi: "Bu calismanin Turkce gramer ve imla denetiminde Sentience AI akademik asistanindan faydalanilmistir."'
    ];
    aiTexts.forEach((t) => {
      doc.text(normalizeForPdf(t), 18, y);
      y += 4.5;
    });

    // Footer
    doc.setDrawColor(203, 213, 225);
    doc.line(16, 274, 194, 274);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sentience AI Akademik Dokumantasyon Merkezi — https://sentience.ai', 105, 279, { align: 'center' });

    doc.save('APA7_ve_IEEE_Hizli_Kaynak_Gosterme_Kilavuzu.pdf');
    toast.success('Atıf Kılavuzu (.pdf) başarıyla indirildi.', { id: 'pdf-cite' });
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('Kılavuz oluşturulurken hata oluştu.', { id: 'pdf-cite' });
  }
}

/**
 * 4. Sentience Kurumsal Platform Tanıtım Broşürü (.pdf)
 */
export async function downloadPlatformBrochurePdf(): Promise<void> {
  try {
    toast.loading('Kurumsal Broşür (.pdf) hazırlanıyor...', { id: 'pdf-brochure' });
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Dark luxury modern header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 48, 'F');

    doc.setTextColor(52, 211, 153); // emerald green
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('SENTIENCE AI', 20, 22);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(normalizeForPdf('Akademik Butunluk, Gelismis Intihal & Yapay Zeka Denetim Platformu'), 20, 31);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(normalizeForPdf('Turkiye ve Dunya Universiteleri Icin Kurumsal Standart'), 20, 38);

    let y = 58;

    // Executive Summary
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(normalizeForPdf('KURUMSAL VIZYON VE GENEL BAKIS'), 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const summary = normalizeForPdf(
      'Sentience AI; lisansustu enstituler, akademik dergiler, fakulteler ve arastirma kurumlari icin gelistirilmis hibrit yapay zeka tespiti ve intihal denetim ekosistemidir. Turnitin uyumlu butunluk bayraklari, Turkiye Turkcesi morfolojisine ozel egitilmis stilometri motoru ve guvenli sinif mimarisiyle akademik sahtekarliklara karsi tam koruma saglar.'
    );
    doc.text(summary, 20, y, { maxWidth: 170, lineHeightFactor: 1.4 });

    y += 24;

    // 4 Key Pillars (2x2 Grid)
    const pillars = [
      {
        title: '1. Sentinel Intihal ve Benzerlik Motoru',
        desc: 'Milyarlarca internet sayfasi, acik erisim akademik arsivler ve kurum ici sinif depolari uzerinde eszamanli tarama yapar. Alintilari ve kaynakcalari otomatik ayristirir.'
      },
      {
        title: '2. Turnitin Uyumlu Butunluk Bayraklari',
        desc: 'Kiril ve Yunan alfabelerinden kopyalanan benzer harfleri (Homoglifler) ve kelime aralarina gizlenen sifir genislikli ozel karakterleri milisaniyeler icinde tespit eder.'
      },
      {
        title: '3. Cok Katmanli Hibrit YZ Denetimi',
        desc: 'Perplexity, burstiness, sozcuk cesitliligi ve derin ogrenme modellerini harmanlayarak %98 uzerinde dogrulukla insan ve yapay zeka metinlerini ayirt eder.'
      },
      {
        title: '4. Enstitu ve Sinif Yonetim Mimarisi',
        desc: 'Egitmenler icin odev acma, zaman damgali dijital makbuz, karekodlu dogrulama ve juri uyumlu YÖK tez raporlama ciktilari sunar.'
      }
    ];

    pillars.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const px = 20 + col * 88;
      const py = y + row * 40;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(px, py, 82, 35, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(normalizeForPdf(p.title), px + 4, py + 7, { maxWidth: 74 });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(normalizeForPdf(p.desc), px + 4, py + 14, { maxWidth: 74, lineHeightFactor: 1.35 });
    });

    y += 88;

    // Enterprise Security Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(20, y, 170, 36, 'F');

    doc.setTextColor(52, 211, 153);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(normalizeForPdf('VERI GUVENLIGI, KVKK VE GIZLILIK TAAHHUDU'), 26, y + 8);

    doc.setTextColor(241, 245, 249);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const secText = normalizeForPdf(
      'Sentience AI sistemine yuklenen tez, makale ve ogrenci odevleri hicbir kosulda harici yapay zeka modellerini egitmek uzere kullanilmaz. Tum belgeler SHA-256 kriptografik ozetleme ve sifrelenmis veri tabanlarinda guvenle saklanir. KVKK ve GDPR akademik gizlilik ilkeleriyle %100 uyumludur.'
    );
    doc.text(secText, 26, y + 15, { maxWidth: 158, lineHeightFactor: 1.35 });

    // Contact Footer
    y += 50;
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y, 190, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Iletisim & Kurumsal Entegrasyon:', 20, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('E-posta: kurumsal@sentience.ai  |  Web: https://sentience.ai  |  Destek: destek@sentience.ai', 20, y + 11);

    doc.save('Sentience_Kurumsal_Platform_Tanitim_Brosuru.pdf');
    toast.success('Platform Tanıtım Broşürü (.pdf) başarıyla indirildi.', { id: 'pdf-brochure' });
  } catch (error) {
    console.error('PDF export failed:', error);
    toast.error('Broşür oluşturulurken hata oluştu.', { id: 'pdf-brochure' });
  }
}

/**
 * 5. Yapay Zeka Tespit İtiraz ve İnceleme Başvuru Dilekçesi Şablonu (.docx)
 */
export async function downloadAiAppealPetitionDocx(): Promise<void> {
  try {
    toast.loading('İtiraz Dilekçesi (.docx) hazırlanıyor...', { id: 'docx-appeal' });
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      Table,
      TableRow,
      TableCell,
      WidthType,
      AlignmentType,
      BorderStyle
    } = await import('docx');

    const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
    const cellBorders = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle
    };

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'T.C.',
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),
            new Paragraph({
              text: '[ÜNİVERSİTE ADI GİRİNİZ]',
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 }
            }),
            new Paragraph({
              text: '[FAKÜLTE / ENSTİTÜ ADI GİRİNİZ] DEKANLIĞINA / MÜDÜRLÜĞÜNE',
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
              spacing: { after: 280 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'KONU: ',
                  bold: true
                }),
                new TextRun('Yapay Zeka (AI) Tespit Raporuna İtiraz ve Bağımsız İnceleme Başvurusu')
              ],
              spacing: { after: 220 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: 'Öğrencinin Adı Soyadı', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      children: [new Paragraph('[Adınızı ve Soyadınızı Yazınız]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Öğrenci No / T.C. Kimlik', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Öğrenci Numaranız / T.C. Kimlik No]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Bölümü / Programı', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Bölüm / Anabilim Dalı / Lisans veya Lisansüstü]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Ders / Tez Kodu ve Adı', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Ödevin / Tezin Ait Olduğu Ders veya Tez Başlığı]')]
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph({ children: [new TextRun({ text: 'Öğretim Üyesi / Danışman', bold: true })] })]
                    }),
                    new TableCell({
                      borders: cellBorders,
                      children: [new Paragraph('[Dersi Veren Öğretim Üyesi veya Tez Danışmanı]')]
                    })
                  ]
                })
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'AÇIKLAMALAR VE GEREKÇELER:',
              heading: HeadingLevel.HEADING_3,
              spacing: { after: 140 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '1. ', bold: true }),
                new TextRun(
                  'Yukarıda bilgileri yer alan ders/tez kapsamında teslim etmiş olduğum akademik çalışma hakkında, otomatik yapay zeka tespit aracı tarafından yüksek oranda yapay zeka üretimi olduğu iddiasıyla rapor düzenlendiği tarafıma bildirilmiştir.'
                )
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '2. ', bold: true }),
                new TextRun(
                  'Bahse konu çalışma tamamen şahsım tarafından literatür taraması, şahsi muhakeme ve araştırma metodolojisi ile özgün olarak kaleme alınmış olup; hiçbir aşamasında üretken dil modelleriyle doğrudan içerik üretilmemiştir.'
                )
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '3. ', bold: true }),
                new TextRun(
                  'Uluslararası akademik literatürde ve Stanford Üniversitesi Human-Centered AI Enstitüsü raporlarında açıkça kanıtlandığı üzere; otomatik yapay zeka dedektörleri, özellikle akademik standartlara, formel dil kurallarına ve anadili Türkçe olan yazarlara ait insan metinlerinde %20-%35 oranında Yanlış Pozitif (False Positive) üretmektedir.'
                )
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '4. ', bold: true }),
                new TextRun(
                  'Çalışmanın şahsıma ait olduğunu ispatlamak adına; kelime işlemci (Google Docs / MS Word) ortamındaki zaman damgalı versiyon düzenleme geçmişi kayıtları, taslak çalışma notları, alıntı fişleri ve kaynak dosyaları dilekçem ekinde (Ek-1 ve Ek-2) sunulmuştur.'
                )
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '5. ', bold: true }),
                new TextRun(
                  'Sentience AI çok katmanlı stilometri ve morfoloji denetim sisteminde çalışmamın kelime çeşitliliği, patlama (burstiness) ve insan dili doğallığı açısından incelenerek teyit edildiği ek raporda görülmektedir.'
                )
              ],
              spacing: { after: 120 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: '6. ', bold: true }),
                new TextRun(
                  'YÖK ölçme ve değerlendirme ilkeleri uyarınca salt istatistiksel bir yazılım çıktısının kesin delil sayılamayacağı göz önüne alınarak; çalışmamın alan uzmanı bağımsız bir komisyon / jüri tarafından içerik ve sözlü savunma yöntemiyle incelenmesini, hakkımdaki haksız kararın iptal edilerek not/onay düzeltmesinin yapılmasını saygılarımla arz ederim.'
                )
              ],
              spacing: { after: 260 }
            }),
            new Paragraph({
              text: 'EKLER:',
              heading: HeadingLevel.HEADING_3,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: 'Ek-1: Zaman Damgalı Düzenleme ve Versiyon Geçmişi Raporu (Google Docs / Word Değişiklik Günlüğü)\nEk-2: Araştırma Notları, Taslak Çizimleri ve Kaynakça Fişleri\nEk-3: Sentience AI Ayrıntılı Stilometrik Bütünlük ve İnsan Yazımı Doğrulama Raporu',
              spacing: { after: 300 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Tarih: ..... / ..... / 202...\n', bold: true }),
                new TextRun({ text: 'Başvuruyu Yapan Öğrencinin Adı Soyadı: [Ad Soyad]\n' }),
                new TextRun({ text: 'İmza: .................................................' })
              ],
              alignment: AlignmentType.RIGHT,
              spacing: { after: 200 }
            })
          ]
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'Yapay_Zeka_Tespit_Itiraz_Dilekcesi_Sablonu.docx');
    toast.success('İtiraz Dilekçesi (.docx) başarıyla indirildi.', { id: 'docx-appeal' });
  } catch (error) {
    console.error('Docx export failed:', error);
    toast.error('Dilekçe oluşturulurken hata oluştu.', { id: 'docx-appeal' });
  }
}

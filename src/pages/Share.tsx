import { useEffect, useState } from 'react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';
import { FileText, Loader2, Share2, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translations } from '../data/translations';

// Load jsPDF dynamically from CDN with polling fallback to prevent duplicate scripts and race conditions
function loadJsPDF(): Promise<any> {
  return new Promise((resolve, reject) => {
    // 1. If it's already fully loaded, resolve immediately
    const jsPDFClass = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
    if (jsPDFClass) {
      resolve({ jsPDF: jsPDFClass });
      return;
    }

    // 2. Check if a script is already in the process of loading
    const existingScript = document.querySelector('script[src*="jspdf"]');
    if (existingScript) {
      // Poll until the global object is populated
      const interval = setInterval(() => {
        const jsPDFClassActive = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (jsPDFClassActive) {
          clearInterval(interval);
          resolve({ jsPDF: jsPDFClassActive });
        }
      }, 50);

      // Timeout after 10 seconds to prevent permanent hang
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timeout waiting for pre-loaded jsPDF script to initialize'));
      }, 10000);
      return;
    }

    // 3. If no script is present, create and append it
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.async = true;
    script.onload = () => {
      // Small timeout to ensure the browser has fully parsed the UMD bundle exports
      setTimeout(() => {
        const jsPDFClassActive = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
        if (jsPDFClassActive) {
          resolve({ jsPDF: jsPDFClassActive });
        } else {
          reject(new Error('jsPDF loaded but constructor not found on window'));
        }
      }, 20);
    };
    script.onerror = (err) => {
      reject(err);
    };
    document.body.appendChild(script);
  });
}

export function Share() {
  const tiradas = useTrainingStore((state) => state.tiradas);
  const rounds = useTrainingStore((state) => state.rounds);
  const userPhone = useTrainingStore((state) => state.userPhone);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [sharingId, setSharingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Pre-load jsPDF on component mount to keep the user interaction gesture fresh for native sharing
  useEffect(() => {
    loadJsPDF().catch((err) => console.error('Error pre-loading jsPDF:', err));
  }, []);

  // Generate a premium typographic PDF document in the selected language
  const generatePDF = async (tiradaId: string) => {
    const tirada = tiradas.find((t) => t.id === tiradaId);
    if (!tirada) return null;
    const sessionRounds = rounds
      .filter((r) => r.sessionId === tiradaId)
      .sort((a, b) => a.roundNumber - b.roundNumber);
    const modality = findModality(tirada.modalityId);

    const jspdfModule = await loadJsPDF();
    const { jsPDF } = jspdfModule;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color Palette matching the app style
    const colorPrimary = [16, 24, 39]; // #101827 (slate-900)
    const colorAccent = [37, 99, 235]; // #2563eb (blue-600)
    const colorLight = [243, 244, 246]; // #f3f4f6 (gray-100)
    const colorBorder = [209, 213, 219]; // #d1d5db (gray-300)
    const colorText = [55, 65, 81]; // #374151 (gray-700)
    const colorTextMuted = [107, 114, 128]; // #6b7280 (gray-500)

    // Draw an elegant white header box with a black outline
    doc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setLineWidth(0.4);
    doc.rect(15, 12, 180, 26, 'S'); // 'S' draws the outline border

    // Header Text in Black
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Tiro22', 20, 20);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(t.share_pdf_title, 20, 26);
    doc.text(t.share_pdf_sub, 20, 31);

    // Top-right header metadata inside the box
    const formattedDate = formatDate(tirada.date);
    doc.setFontSize(9.5);
    doc.text(`${t.share_excel_meta_date}: ${formattedDate}`, 190, 20, { align: 'right' });
    if (userPhone) {
      doc.text(`${t.share_excel_meta_phone}: ${userPhone}`, 190, 26, { align: 'right' });
    }

    // Session Info Card
    doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
    doc.rect(15, 48, 180, 32, 'F');

    doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
    doc.setLineWidth(0.2);
    doc.rect(15, 48, 180, 32, 'S');

    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(t.share_pdf_info_title, 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(colorText[0], colorText[1], colorText[2]);

    const typeLabel = tirada.type === 'competicion' ? t.new_tirada_type_competition : t.new_tirada_type_training;

    // Left Column Info
    doc.text(`${t.share_pdf_info_modality}: ${modality.name}`, 20, 62);
    doc.text(`${t.share_pdf_info_caliber}: ${modality.caliber} · ${t.share_pdf_info_distance}: ${modality.distance}`, 20, 70);

    // Right Column Info
    doc.text(`${t.share_pdf_info_type}: ${typeLabel}`, 110, 62);
    doc.text(`${t.share_pdf_info_result}: ${tirada.totalScore} pts (${tirada.totalShots} ${t.share_stats_shots} · ${t.share_stats_average} ${formatAverage(tirada.averageScore)})`, 110, 70);

    // Section Header: Tandas Detail
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(t.share_pdf_detail_title, 15, 90);

    // Table Column Headers
    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(15, 94, 180, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(t.share_pdf_table_tanda, 18, 99.5);
    doc.text('D1', 55, 99.5, { align: 'center' });
    doc.text('D2', 75, 99.5, { align: 'center' });
    doc.text('D3', 95, 99.5, { align: 'center' });
    doc.text('D4', 115, 99.5, { align: 'center' });
    doc.text('D5', 135, 99.5, { align: 'center' });
    doc.text(t.share_pdf_table_total, 180, 99.5, { align: 'right' });

    // Table Rows
    let y = 102;
    let competitionCount = 0;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorText[0], colorText[1], colorText[2]);

    sessionRounds.forEach((round, idx) => {
      // Alternate row background
      if (idx % 2 === 1) {
        doc.setFillColor(250, 250, 250);
        doc.rect(15, y, 180, 7.5, 'F');
      }

      // Bottom border for the row
      doc.setDrawColor(230, 230, 230);
      doc.line(15, y + 7.5, 195, y + 7.5);

      // Round type Label
      let label = '';
      if (round.isPrueba) {
        label = t.new_round_title_prueba;
        doc.setTextColor(37, 99, 235); // Blue color for Prueba round
        doc.setFont('helvetica', 'bold');
      } else {
        competitionCount++;
        label = `${t.new_round_title_tanda} ${competitionCount}`;
        doc.setTextColor(colorText[0], colorText[1], colorText[2]);
        doc.setFont('helvetica', 'normal');
      }

      doc.text(label, 18, y + 5);

      // Individual Shot Values
      doc.setFont('helvetica', 'normal');
      if (round.isPrueba) {
        doc.setTextColor(37, 99, 235);
      } else {
        doc.setTextColor(colorText[0], colorText[1], colorText[2]);
      }

      for (let i = 0; i < 5; i++) {
        const shot = round.shots[i];
        const valStr = shot === undefined ? '-' : shot === 0 ? 'M' : String(shot);
        doc.text(valStr, 55 + i * 20, y + 5, { align: 'center' });
      }

      // Round Total
      doc.setFont('helvetica', 'bold');
      doc.text(`${round.totalScore} pts`, 180, y + 5, { align: 'right' });

      y += 7.5;
    });

    // Additional Stats Watermark and summaries
    y += 5;
    if (y < 270) {
      doc.setDrawColor(colorBorder[0], colorBorder[1], colorBorder[2]);
      doc.line(15, y, 195, y);
      y += 6;

      // Stats Summary inside PDF
      doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(t.share_pdf_stats_title, 15, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(colorText[0], colorText[1], colorText[2]);

      const validRounds = sessionRounds.filter((r) => !r.isPrueba);
      const bestRoundVal = validRounds.reduce((max, r) => (r.totalScore > max ? r.totalScore : max), 0);
      const worstRoundVal = validRounds.reduce((min, r) => (r.totalScore < min ? r.totalScore : min), 50);

      doc.text(`${t.share_pdf_stats_best}: ${bestRoundVal ? bestRoundVal + '/50 pts' : '-'}`, 15, y + 5);
      doc.text(`${t.share_pdf_stats_worst}: ${bestRoundVal ? worstRoundVal + '/50 pts' : '-'}`, 110, y + 5);
    }

    // Watermark at the bottom
    doc.setTextColor(colorTextMuted[0], colorTextMuted[1], colorTextMuted[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text(
      t.share_pdf_watermark,
      105,
      287,
      { align: 'center' }
    );

    return doc;
  };

  const handleShare = async (tiradaId: string) => {
    setSharingId(tiradaId);
    try {
      const tirada = tiradas.find((t) => t.id === tiradaId);
      if (!tirada) return;
      const modality = findModality(tirada.modalityId);

      const doc = await generatePDF(tiradaId);
      if (!doc) return;

      const pdfBlob = doc.output('blob');
      const formattedDate = formatDate(tirada.date);
      const filename = `Tirada_${modality.name.replace(/\s+/g, '_')}_${formattedDate.replace(/\//g, '-')}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const typeLabel = tirada.type === 'competicion' ? t.new_tirada_type_competition : t.new_tirada_type_training;

      // Clean formatted message summary for WhatsApp sharing
      const textSummary = `🏆 *Tiro22 - ${t.share_pdf_title}* 🏆
----------------------------------
🎯 *${t.share_pdf_info_modality}:* ${modality.name.replace(' .22 LR', '')}
📅 *${t.share_excel_meta_date}:* ${formattedDate}
📝 *${t.share_pdf_info_type}:* ${typeLabel}
📊 *${t.share_pdf_info_result}:* ${tirada.totalScore} pts (${tirada.totalShots} ${t.share_stats_shots})
📈 *${t.share_pdf_info_average}:* ${formatAverage(tirada.averageScore)}
----------------------------------
Generado por Tiro22 · Agencia Pixer`;

      const runFallback = () => {
        doc.save(filename);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textSummary)}`;
        window.open(whatsappUrl, '_blank');
      };

      // Check if native sharing is supported on this device/browser
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `${t.share_pdf_title} - ${modality.name}`,
            text: textSummary
          });
        } catch (shareErr) {
          console.warn('Native share failed or cancelled, executing fallback:', shareErr);
          // Only skip fallback if the user intentionally cancelled/aborted the native share sheet
          if (shareErr instanceof Error && shareErr.name === 'AbortError') {
            console.log('Native share aborted by the user.');
          } else {
            runFallback();
          }
        }
      } else {
        runFallback();
      }
    } catch (err) {
      console.error('Error sharing tirada:', err);
      alert('No se pudo generar o compartir el reporte. Por favor, inténtelo de nuevo.');
    } finally {
      setSharingId(null);
    }
  };

  const handleExcelExport = (tiradaId: string) => {
    setExportingId(tiradaId);
    try {
      const tirada = tiradas.find((t) => t.id === tiradaId);
      if (!tirada) return;

      const sessionRounds = rounds
        .filter((r) => r.sessionId === tiradaId)
        .sort((a, b) => a.roundNumber - b.roundNumber);
      const modality = findModality(tirada.modalityId);

      const formattedDate = formatDate(tirada.date);
      const sessionTypeLabel = tirada.type === 'competicion' ? t.new_tirada_type_competition : t.new_tirada_type_training;

      // Build Excel-compatible CSV rows
      const csvRows: string[] = [];

      // Metadata section at the top of the file
      csvRows.push(`${t.share_excel_meta_title}`);
      csvRows.push('');
      csvRows.push(`${t.share_pdf_info_modality};${modality.name}`);
      csvRows.push(`${t.share_pdf_info_caliber};${modality.caliber}`);
      csvRows.push(`${t.share_pdf_info_distance};${modality.distance}`);
      csvRows.push(`${t.share_pdf_info_type};${sessionTypeLabel}`);
      csvRows.push(`${t.share_excel_meta_date};${formattedDate}`);
      if (userPhone) {
        csvRows.push(`${t.share_excel_meta_phone};${userPhone}`);
      }
      csvRows.push(`${t.share_pdf_info_result};${tirada.totalScore} pts (${tirada.totalShots} ${t.share_stats_shots})`);
      csvRows.push(`${t.share_pdf_info_average};${formatAverage(tirada.averageScore)}`);
      csvRows.push('');

      // Detail Table Column Headers
      const headers = [
        t.share_excel_round_num,
        'D1',
        'D2',
        'D3',
        'D4',
        'D5',
        t.share_pdf_table_total,
        t.share_excel_round_average,
        t.share_excel_best_shot,
        t.share_excel_worst_shot
      ];
      csvRows.push(headers.join(';'));

      // Detail Table Rows
      let competitionCount = 0;
      sessionRounds.forEach((round) => {
        let label = '';
        if (round.isPrueba) {
          label = t.new_round_title_prueba;
        } else {
          competitionCount++;
          label = `${t.new_round_title_tanda} ${competitionCount}`;
        }

        const shot1 = round.shots[0] === undefined ? '-' : round.shots[0] === 0 ? 'M' : String(round.shots[0]);
        const shot2 = round.shots[1] === undefined ? '-' : round.shots[1] === 0 ? 'M' : String(round.shots[1]);
        const shot3 = round.shots[2] === undefined ? '-' : round.shots[2] === 0 ? 'M' : String(round.shots[2]);
        const shot4 = round.shots[3] === undefined ? '-' : round.shots[3] === 0 ? 'M' : String(round.shots[3]);
        const shot5 = round.shots[4] === undefined ? '-' : round.shots[4] === 0 ? 'M' : String(round.shots[4]);

        const totalStr = `${round.totalScore} pts`;
        const avgStr = formatAverage(round.averageScore);
        const bestStr = round.bestShot === undefined ? '-' : round.bestShot === 0 ? 'M' : String(round.bestShot);
        const worstStr = round.worstShot === undefined ? '-' : round.worstShot === 0 ? 'M' : String(round.worstShot);

        const row = [
          label,
          shot1,
          shot2,
          shot3,
          shot4,
          shot5,
          totalStr,
          avgStr,
          bestStr,
          worstStr
        ];
        csvRows.push(row.join(';'));
      });

      // Join lines using Windows carriage returns for best Excel compatibility
      const csvContent = csvRows.join('\r\n');

      // Use a UTF-8 BOM so Excel opens special characters (accents, French glyphs) correctly automatically
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const filenameDate = formattedDate.replace(/\//g, '-');
      const cleanModalityName = modality.name.replace(/\s+/g, '_');
      
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Tirada_${cleanModalityName}_${filenameDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('No se pudo exportar el reporte a Excel. Por favor, inténtelo de nuevo.');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="page list-page">
      <header className="compact-header compact-header--row">
        <div>
          <h1>{t.share_title}</h1>
          <p>{t.share_subtitle}</p>
        </div>
        <div className="header-logo-container">
          <img
            src={`${import.meta.env.BASE_URL}logo-pixer.png`}
            alt="Agencia Pixer"
            className="header-logo"
          />
        </div>
      </header>

      <section className="share-dashboard">
        {tiradas.length === 0 ? (
          <div className="empty-share-card">
            <Target size={48} className="empty-icon" />
            <h3>{t.share_empty_title}</h3>
            <p>{t.share_empty_desc}</p>
            <Link to="/nueva-tirada" className="primary-button">
              {t.share_empty_btn}
            </Link>
          </div>
        ) : (
          <div className="simple-list share-list">
            {tiradas.map((tirada) => {
              const modality = findModality(tirada.modalityId);
              const isSharing = sharingId === tirada.id;
              const isExporting = exportingId === tirada.id;

              return (
                <article key={tirada.id} className="share-session-card">
                  <div className="share-session-card__body">
                    <div className="share-session-card__info">
                      <strong>{modality.name.replace(' .22 LR', '')}</strong>
                      <span>
                        {formatDate(tirada.date)} · {tirada.type === 'competicion' ? t.new_tirada_type_competition : t.new_tirada_type_training}
                      </span>
                      <p className="share-session-card__stats">
                        <span>{tirada.totalScore} pts</span>
                        <i className="bullet" />
                        <span>{tirada.totalShots} {t.share_stats_shots}</span>
                        <i className="bullet" />
                        <span>{t.share_stats_average} {formatAverage(tirada.averageScore)}</span>
                      </p>
                    </div>

                    <div className="share-session-card__actions">
                      <button
                        type="button"
                        className="primary-button share-button"
                        onClick={() => handleShare(tirada.id)}
                        disabled={isSharing || isExporting}
                        aria-label="Compartir PDF"
                      >
                        {isSharing ? (
                          <>
                            <Loader2 size={18} className="spinner" />
                            <span>{t.share_btn_processing}</span>
                          </>
                        ) : (
                          <>
                            <Share2 size={18} />
                            <span>{t.share_btn_share}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="ghost-button excel-button"
                        onClick={() => handleExcelExport(tirada.id)}
                        disabled={isSharing || isExporting}
                        aria-label="Exportar Excel"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 size={18} className="spinner" />
                            <span>{t.share_btn_processing}</span>
                          </>
                        ) : (
                          <>
                            <FileText size={18} />
                            <span>{t.share_btn_excel}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';
import { Calendar, ChevronRight, FileText, Loader2, Share2, Target, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const weapons = useTrainingStore((state) => state.weapons);
  const userPhone = useTrainingStore((state) => state.userPhone);
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Pre-load jsPDF on component mount to keep the user interaction gesture fresh for native sharing
  useEffect(() => {
    loadJsPDF().catch((err) => console.error('Error pre-loading jsPDF:', err));
  }, []);

  // Generate a premium typographic PDF document
  const generatePDF = async (tiradaId: string) => {
    const tirada = tiradas.find((t) => t.id === tiradaId);
    if (!tirada) return null;
    const sessionRounds = rounds
      .filter((r) => r.sessionId === tiradaId)
      .sort((a, b) => a.roundNumber - b.roundNumber);
    const modality = findModality(tirada.modalityId);
    const weapon = weapons.find((w) => w.id === tirada.weaponId);

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
    doc.text('REPORTE OFICIAL DE TIRADA', 20, 26);
    doc.text('Desarrollado por Agencia Pixer', 20, 31);

    // Top-right header metadata inside the box
    const formattedDate = formatDate(tirada.date);
    doc.setFontSize(9.5);
    doc.text(`Fecha: ${formattedDate}`, 190, 20, { align: 'right' });
    if (userPhone) {
      doc.text(`Tlf: ${userPhone}`, 190, 26, { align: 'right' });
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
    doc.text('INFORMACIÓN GENERAL', 20, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(colorText[0], colorText[1], colorText[2]);

    // Left Column Info
    doc.text(`Modalidad: ${modality.name.replace(' .22 LR', '')}`, 20, 62);
    doc.text(`Calibre: ${modality.caliber} · Distancia: ${modality.distance}`, 20, 67);
    doc.text(`Arma: ${weapon ? weapon.name : 'No especificada'}`, 20, 72);

    // Right Column Info
    doc.text(`Tipo: ${tirada.type === 'competicion' ? 'Competición' : 'Entrenamiento'}`, 110, 62);
    doc.text(`Resultado: ${tirada.totalScore} pts / ${tirada.totalShots} disparos`, 110, 67);
    doc.text(`Media: ${formatAverage(tirada.averageScore)}`, 110, 72);

    // Section Header: Tandas Detail
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DETALLE DE LAS TANDAS', 15, 90);

    // Table Column Headers
    doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.rect(15, 94, 180, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Tanda', 18, 99.5);
    doc.text('D1', 55, 99.5, { align: 'center' });
    doc.text('D2', 75, 99.5, { align: 'center' });
    doc.text('D3', 95, 99.5, { align: 'center' });
    doc.text('D4', 115, 99.5, { align: 'center' });
    doc.text('D5', 135, 99.5, { align: 'center' });
    doc.text('Total', 180, 99.5, { align: 'right' });

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
        label = 'Prueba';
        doc.setTextColor(37, 99, 235); // Blue color for Prueba round
        doc.setFont('helvetica', 'bold');
      } else {
        competitionCount++;
        label = `Tanda ${competitionCount}`;
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
      doc.text('Resumen Estadístico:', 15, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(colorText[0], colorText[1], colorText[2]);

      const validRounds = sessionRounds.filter((r) => !r.isPrueba);
      const bestRoundVal = validRounds.reduce((max, r) => (r.totalScore > max ? r.totalScore : max), 0);
      const worstRoundVal = validRounds.reduce((min, r) => (r.totalScore < min ? r.totalScore : min), 50);

      doc.text(`Tanda oficial más alta: ${bestRoundVal ? bestRoundVal + '/50 pts' : '-'}`, 15, y + 5);
      doc.text(`Tanda oficial más baja: ${bestRoundVal ? worstRoundVal + '/50 pts' : '-'}`, 110, y + 5);
    }

    // Watermark at the bottom
    doc.setTextColor(colorTextMuted[0], colorTextMuted[1], colorTextMuted[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.text(
      'Este reporte fue generado de manera automática por Tiro22 en colaboración con Agencia Pixer.',
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

      // Clean formatted message summary for WhatsApp
      const textSummary = `🏆 *Tiro22 - Resumen de Tirada* 🏆
----------------------------------
🎯 *Modalidad:* ${modality.name.replace(' .22 LR', '')}
📅 *Fecha:* ${formattedDate}
📝 *Tipo:* ${tirada.type === 'competicion' ? 'Competición' : 'Entrenamiento'}
📊 *Resultado:* ${tirada.totalScore} pts (${tirada.totalShots} disparos)
📈 *Media:* ${formatAverage(tirada.averageScore)}
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
            title: `Reporte de Tirada - ${modality.name}`,
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

  return (
    <div className="page list-page">
      <header className="compact-header compact-header--row">
        <div>
          <h1>Compartir</h1>
          <p>Exporta reportes oficiales de tus tiradas y compártelos.</p>
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
            <h3>No hay tiradas registradas</h3>
            <p>
              Registra y completa tu primera tirada para poder generar reportes en PDF y compartirlos con tus contactos.
            </p>
            <Link to="/nueva-tirada" className="primary-button">
              Comenzar Tirada
            </Link>
          </div>
        ) : (
          <div className="simple-list share-list">
            {tiradas.map((tirada) => {
              const modality = findModality(tirada.modalityId);
              const isSharing = sharingId === tirada.id;

              return (
                <article key={tirada.id} className="share-session-card">
                  <div className="share-session-card__body">
                    <div className="share-session-card__info">
                      <strong>{modality.name.replace(' .22 LR', '')}</strong>
                      <span>
                        {formatDate(tirada.date)} · {tirada.type === 'competicion' ? 'Competición' : 'Entrenamiento'}
                      </span>
                      <p className="share-session-card__stats">
                        <span>{tirada.totalScore} pts</span>
                        <i className="bullet" />
                        <span>{tirada.totalShots} disparos</span>
                        <i className="bullet" />
                        <span>Media {formatAverage(tirada.averageScore)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="primary-button share-button"
                      onClick={() => handleShare(tirada.id)}
                      disabled={isSharing}
                      aria-label="Compartir PDF"
                    >
                      {isSharing ? (
                        <>
                          <Loader2 size={18} className="spinner" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={18} />
                          <span>Compartir</span>
                        </>
                      )}
                    </button>
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

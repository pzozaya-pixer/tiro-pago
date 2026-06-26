import { useState } from 'react';
import { AlertTriangle, Crosshair, Gauge, Target, Trash2 } from 'lucide-react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import type { Tirada } from '../types';
import { formatAverage, formatDate } from '../lib/scoring';
import { translations } from '../data/translations';

export function TiradaRow({ tirada }: { tirada: Tirada }) {
  const modality = findModality(tirada.modalityId);
  const icon = modality?.weaponType === 'rifle' ? <Target size={24} /> : <Crosshair size={24} />;
  const deleteTirada = useTrainingStore((state) => state.deleteTirada);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDelete = () => {
    deleteTirada(tirada.id);
    setShowConfirmModal(false);
  };

  return (
    <>
      <article className="session-row">
        <div className="session-row__icon">{tirada.modalityId.includes('rapid') ? <Gauge size={24} /> : icon}</div>
        <div className="session-row__body">
          <h3>{modality ? modality.name.replace(' .22 LR', '') : 'Modalidad'}</h3>
          <p>
            {formatDate(tirada.date)} <span /> {tirada.totalShots} {t.share_stats_shots}
          </p>
        </div>
        <div className="session-row__score">
          <strong>{tirada.totalScore}</strong>
          <span>{t.share_stats_average} {formatAverage(tirada.averageScore)}</span>
        </div>
        <button
          className="delete-session-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirmModal(true);
          }}
          aria-label="Borrar tirada"
        >
          <Trash2 size={20} />
        </button>
      </article>

      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__icon">
              <AlertTriangle size={36} color="var(--red)" />
            </div>
            <h3>{t.history_delete_modal_title}</h3>
            <p>
              {language === 'en'
                ? `This action will permanently delete this session of ${modality ? modality.name.replace(' .22 LR', '') : ''} and all its associated rounds. This operation cannot be undone.`
                : language === 'fr'
                ? `Cette action supprimera définitivement cette session de ${modality ? modality.name.replace(' .22 LR', '') : ''} et toutes ses séries associées. Cette opération ne peut pas être annulée.`
                : `Esta acción borrará de forma permanente esta tirada de ${modality ? modality.name.replace(' .22 LR', '') : ''} y todas sus tandas asociadas. Esta operación no se puede deshacer.`}
            </p>
            <div className="modal-card__actions">
              <button className="modal-btn modal-btn--secondary" onClick={() => setShowConfirmModal(false)}>
                {t.history_delete_modal_btn_cancel}
              </button>
              <button className="modal-btn modal-btn--danger" onClick={handleDelete}>
                {t.history_delete_modal_btn_delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

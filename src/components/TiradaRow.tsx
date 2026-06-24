import { useState } from 'react';
import { AlertTriangle, Crosshair, Gauge, Target, Trash2 } from 'lucide-react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import type { Tirada } from '../types';
import { formatAverage, formatDate } from '../lib/scoring';

export function TiradaRow({ tirada }: { tirada: Tirada }) {
  const modality = findModality(tirada.modalityId);
  const icon = modality.weaponType === 'rifle' ? <Target size={24} /> : <Crosshair size={24} />;
  const deleteTirada = useTrainingStore((state) => state.deleteTirada);
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
          <h3>{modality.name.replace(' .22 LR', '')}</h3>
          <p>
            {formatDate(tirada.date)} <span /> {tirada.totalShots} disparos
          </p>
        </div>
        <div className="session-row__score">
          <strong>{tirada.totalScore}</strong>
          <span>Media {formatAverage(tirada.averageScore)}</span>
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
            <h3>¿Eliminar tirada?</h3>
            <p>
              Esta acción borrará de forma permanente esta tirada de <strong>{modality.name.replace(' .22 LR', '')}</strong> y todas sus tandas asociadas. Esta operación no se puede deshacer.
            </p>
            <div className="modal-card__actions">
              <button className="modal-btn modal-btn--secondary" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn--danger" onClick={handleDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

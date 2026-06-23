import { Crosshair, Gauge, Target, Trash2 } from 'lucide-react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import type { Tirada } from '../types';
import { formatAverage, formatDate } from '../lib/scoring';

export function TiradaRow({ tirada }: { tirada: Tirada }) {
  const modality = findModality(tirada.modalityId);
  const icon = modality.weaponType === 'rifle' ? <Target size={24} /> : <Crosshair size={24} />;
  const deleteTirada = useTrainingStore((state) => state.deleteTirada);

  return (
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
          if (confirm('¿Seguro que deseas borrar esta tirada y todas sus tandas?')) {
            deleteTirada(tirada.id);
          }
        }}
        aria-label="Borrar tirada"
      >
        <Trash2 size={20} />
      </button>
    </article>
  );
}

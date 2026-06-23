import { Crosshair, Gauge, Target, Trash2 } from 'lucide-react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import type { TrainingSession } from '../types';
import { formatAverage, formatDate } from '../lib/scoring';

export function SessionRow({ session }: { session: TrainingSession }) {
  const modality = findModality(session.modalityId);
  const icon = modality.weaponType === 'rifle' ? <Target size={24} /> : <Crosshair size={24} />;
  const deleteSession = useTrainingStore((state) => state.deleteSession);

  return (
    <article className="session-row">
      <div className="session-row__icon">{session.modalityId.includes('rapid') ? <Gauge size={24} /> : icon}</div>
      <div className="session-row__body">
        <h3>{modality.name.replace(' .22 LR', '')}</h3>
        <p>
          {formatDate(session.date)} <span /> {session.totalShots} disparos
        </p>
      </div>
      <div className="session-row__score">
        <strong>{session.totalScore}</strong>
        <span>Media {formatAverage(session.averageScore)}</span>
      </div>
      <button
        className="delete-session-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (confirm('¿Seguro que deseas borrar esta sesión y todas sus tandas?')) {
            deleteSession(session.id);
          }
        }}
        aria-label="Borrar sesión"
      >
        <Trash2 size={20} />
      </button>
    </article>
  );
}

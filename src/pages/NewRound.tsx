import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Crosshair, Eraser, Save, Tag } from 'lucide-react';
import { useMemo, useState } from 'react';
import { modalities } from '../data/modalities';
import { formatAverage, scoreRound } from '../lib/scoring';
import { findModality, useTrainingStore } from '../store/useTrainingStore';

const scoreButtons = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 'M'] as const;

export function NewRound() {
  const navigate = useNavigate();
  const activeSession = useTrainingStore((state) => state.getActiveSession());
  const createSession = useTrainingStore((state) => state.createSession);
  const saveRound = useTrainingStore((state) => state.saveRound);
  const rounds = useTrainingStore((state) => state.rounds);
  const [selectedModalityId, setSelectedModalityId] = useState(activeSession?.modalityId ?? modalities[0].id);
  const [shots, setShots] = useState<number[]>([]);
  const modality = findModality(activeSession?.modalityId ?? selectedModalityId);
  const sessionRounds = activeSession ? rounds.filter((round) => round.sessionId === activeSession.id) : [];
  const stats = useMemo(() => scoreRound(shots), [shots]);
  const isComplete = shots.length === 5;

  function addShot(score: number | 'M') {
    if (shots.length >= 5) return;
    setShots((current) => [...current, score === 'M' ? 0 : score]);
  }

  function handleSave() {
    const session =
      activeSession ??
      createSession({
        modalityId: selectedModalityId,
        type: 'entrenamiento',
        date: new Date().toISOString()
      });

    saveRound({ sessionId: session.id, shots });
    navigate('/sesiones');
  }

  return (
    <div className="page page--round">
      <header className="round-topbar">
        <Link to="/" aria-label="Volver">
          <ArrowLeft size={30} />
        </Link>
        <h1>Nueva Tanda</h1>
        <span />
      </header>

      <section className="round-context">
        <div className="round-context__main">
          <Crosshair size={46} />
          <div>
            {activeSession ? (
              <>
                <strong>{modality.name.replace(' .22 LR', '')}</strong>
                <span>{modality.caliber}</span>
              </>
            ) : (
              <select value={selectedModalityId} onChange={(event) => setSelectedModalityId(event.target.value)}>
                {modalities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="round-context__distance">
          <Crosshair size={28} />
          <strong>{modality.distance}</strong>
        </div>
        <div className="round-context__meta">
          <span>
            <CalendarDays size={18} />
            {new Date().toLocaleDateString('es-ES')}
          </span>
          <span>
            <Tag size={18} />
            {activeSession?.type ?? 'entrenamiento'}
          </span>
          <Link to="/nueva-sesion">Cambiar</Link>
        </div>
      </section>

      <section className="score-panel">
        <div className="round-title">
          <h2>Tanda {sessionRounds.length + 1}</h2>
          <div>
            <strong>Disparos</strong> {Math.min(shots.length + 1, 5)}/5
            <span className="shot-dots">
              {Array.from({ length: 5 }).map((_, index) => (
                <i key={index} className={index < shots.length ? 'is-done' : ''} />
              ))}
            </span>
          </div>
        </div>

        <div className="shot-slots">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={shots[index] !== undefined ? 'shot-slot is-filled' : 'shot-slot'}>
              <span>{index + 1}</span>
              <strong>{shots[index] ?? '-'}</strong>
            </div>
          ))}
        </div>

        <p className="score-panel__hint">Selecciona la puntuación</p>
        <div className="score-grid">
          {scoreButtons.map((score) => (
            <button key={score} onClick={() => addShot(score)} disabled={isComplete}>
              <strong>{score}</strong>
              {score === 'M' && <span>Fallo</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="stats-strip">
        <div>
          <Crosshair />
          <span>Total tanda</span>
          <strong>{stats.totalScore} / 50</strong>
        </div>
        <div>
          <Check />
          <span>Media</span>
          <strong>{formatAverage(stats.averageScore)}</strong>
        </div>
        <div>
          <Check />
          <span>Mejor</span>
          <strong>{shots.length ? stats.bestShot : '-'}</strong>
        </div>
        <div>
          <Check />
          <span>Peor</span>
          <strong>{shots.length ? stats.worstShot : '-'}</strong>
        </div>
      </section>

      <div className="round-actions">
        <button className="ghost-button" type="button" onClick={() => setShots((current) => current.slice(0, -1))}>
          <Eraser size={20} />
          Borrar último
        </button>
        <button className="primary-button" type="button" disabled={!isComplete} onClick={handleSave}>
          <Save size={22} />
          Guardar Tanda
        </button>
      </div>
    </div>
  );
}

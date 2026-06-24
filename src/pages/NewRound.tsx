import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Crosshair, Eraser, Save, Tag, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { modalities } from '../data/modalities';
import { formatAverage, scoreRound } from '../lib/scoring';
import { findModality, useTrainingStore } from '../store/useTrainingStore';

const scoreButtons = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 'M'] as const;

export function NewRound() {
  const navigate = useNavigate();
  const activeTirada = useTrainingStore((state) => state.getActiveTirada());
  const createTirada = useTrainingStore((state) => state.createTirada);
  const saveRound = useTrainingStore((state) => state.saveRound);
  const rounds = useTrainingStore((state) => state.rounds);
  const [selectedModalityId, setSelectedModalityId] = useState(activeTirada?.modalityId ?? modalities[0].id);
  const [shots, setShots] = useState<number[]>([]);
  const [isPrueba, setIsPrueba] = useState(false);
  const modality = findModality(activeTirada?.modalityId ?? selectedModalityId);
  const sessionRounds = activeTirada ? rounds.filter((round) => round.sessionId === activeTirada.id) : [];
  const competitionRounds = useMemo(() => sessionRounds.filter((r) => !r.isPrueba), [sessionRounds]);
  const stats = useMemo(() => scoreRound(shots), [shots]);
  const isComplete = shots.length === 5;

  const isCompetitionCompleted = activeTirada?.type === 'competicion' && competitionRounds.length >= 12;

  const scorePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Desplazar automáticamente al panel de puntuación para centrar la interfaz en móviles
    const timer = setTimeout(() => {
      if (scorePanelRef.current) {
        scorePanelRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [isCompetitionCompleted]);

  function addShot(score: number | 'M') {
    if (shots.length >= 5) return;
    setShots((current) => [...current, score === 'M' ? 0 : score]);
  }

  function handleSave() {
    const tirada =
      activeTirada ??
      createTirada({
        modalityId: selectedModalityId,
        type: 'entrenamiento',
        date: new Date().toISOString()
      });

    saveRound({ sessionId: tirada.id, shots, isPrueba });
    navigate('/');
  }

  return (
    <div className="page page--round">
      <header className="round-topbar">
        <Link to="/" aria-label="Volver">
          <ArrowLeft size={30} />
        </Link>
        <h1>Nueva Tanda</h1>
        <div className="header-logo-container round-topbar__logo">
          <img src={`${import.meta.env.BASE_URL}logo-pixer.png`} alt="Agencia Pixer" className="header-logo" />
        </div>
      </header>

      <section className="round-context">
        <div className="round-context__main">
          <Crosshair size={46} />
          <div>
            {activeTirada ? (
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
            {activeTirada?.type ?? 'entrenamiento'}
          </span>
          <Link to="/nueva-tirada">Cambiar</Link>
        </div>
      </section>

      {isCompetitionCompleted ? (
        <section className="score-panel competition-completed-panel">
          <div className="completed-card">
            <Trophy size={64} className="completed-icon" />
            <h2>Competición Completada</h2>
            <p>Has alcanzado el límite oficial de 12 tandas puntuables (60 disparos) para esta competición.</p>
            <Link to="/" className="primary-button return-button">
              Volver al Inicio
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="score-panel" ref={scorePanelRef}>
            <div className="round-title">
              <h2>
                {isPrueba
                  ? 'Tanda de Prueba'
                  : `Tanda ${
                      activeTirada?.type === 'competicion'
                        ? competitionRounds.length + 1
                        : sessionRounds.length + 1
                    }`}
              </h2>
              <div>
                <strong>Disparos</strong> {Math.min(shots.length + 1, 5)}/5
                <span className="shot-dots">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <i key={index} className={index < shots.length ? 'is-done' : ''} />
                  ))}
                </span>
              </div>
            </div>

            {activeTirada?.type === 'competicion' && sessionRounds.length === 0 && (
              <div className="prueba-toggle-container">
                <label className="prueba-toggle-label">
                  <input
                    type="checkbox"
                    checked={isPrueba}
                    onChange={(e) => {
                      setIsPrueba(e.target.checked);
                      // Limpiar disparos cuando se cambia el modo para evitar inconsistencias
                      setShots([]);
                    }}
                    className="prueba-toggle-input"
                  />
                  <span className="prueba-toggle-slider" />
                  <span className="prueba-toggle-text">¿Es una tanda de prueba (entrenamiento inicial)?</span>
                </label>
              </div>
            )}

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

            <div className="round-actions" style={{ marginTop: '20px' }}>
              <button className="ghost-button" type="button" onClick={() => setShots((current) => current.slice(0, -1))}>
                <Eraser size={20} />
                Borrar último
              </button>
              <button className="primary-button" type="button" disabled={!isComplete} onClick={handleSave}>
                <Save size={22} />
                Guardar Tanda
              </button>
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
        </>
      )}
    </div>
  );
}

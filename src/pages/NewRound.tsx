import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, Crosshair, Eraser, Save, Tag, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatAverage, scoreRound } from '../lib/scoring';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import { translations } from '../data/translations';

const scoreButtons = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 'M'] as const;

export function NewRound() {
  const navigate = useNavigate();
  const activeTirada = useTrainingStore((state) => state.getActiveTirada());
  const createTirada = useTrainingStore((state) => state.createTirada);
  const saveRound = useTrainingStore((state) => state.saveRound);
  const rounds = useTrainingStore((state) => state.rounds);
  const modalities = useTrainingStore((state) => state.modalities);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [selectedModalityId, setSelectedModalityId] = useState(activeTirada?.modalityId ?? modalities[0]?.id ?? '');
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

  // Helper for translating "Miss" sublabel on the M button
  const getMissLabel = () => {
    if (language === 'en') return 'Miss';
    if (language === 'fr') return 'Manqué';
    return 'Fallo';
  };

  return (
    <div className="page page--round">
      <header className="round-topbar">
        <Link to="/" aria-label="Volver">
          <ArrowLeft size={30} />
        </Link>
        <h1>{t.new_round_title}</h1>
        <div className="header-logo-container round-topbar__logo">
          <img src={`${import.meta.env.BASE_URL}logo-pixer.png`} alt="Agencia Pixer" className="header-logo" />
        </div>
      </header>

      {modality && (
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
              {activeTirada?.type === 'competicion' ? t.new_tirada_type_competition : t.new_tirada_type_training}
            </span>
            <Link to="/nueva-tirada">{language === 'en' ? 'Change' : language === 'fr' ? 'Modifier' : 'Cambiar'}</Link>
          </div>
        </section>
      )}

      {isCompetitionCompleted ? (
        <section className="score-panel competition-completed-panel">
          <div className="completed-card">
            <Trophy size={64} className="completed-icon" />
            <h2>{t.new_round_completed_title}</h2>
            <p>{t.new_round_completed_desc}</p>
            <Link to="/" className="primary-button return-button">
              {t.new_round_completed_btn}
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="score-panel" ref={scorePanelRef}>
            <div className="round-title">
              <h2>
                {isPrueba
                  ? t.new_round_title_prueba
                  : `${t.new_round_title_tanda} ${
                      activeTirada?.type === 'competicion'
                        ? competitionRounds.length + 1
                        : sessionRounds.length + 1
                    }`}
              </h2>
              <div>
                <strong>{t.new_round_shots}</strong> {Math.min(shots.length + 1, 5)}/5
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
                      setShots([]);
                    }}
                    className="prueba-toggle-input"
                  />
                  <span className="prueba-toggle-slider" />
                  <span className="prueba-toggle-text">{t.new_round_prueba_toggle}</span>
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

            <p className="score-panel__hint">{t.new_round_hint}</p>
            <div className="score-grid">
              {scoreButtons.map((score) => (
                <button key={score} onClick={() => addShot(score)} disabled={isComplete}>
                  <strong>{score}</strong>
                  {score === 'M' && <span>{getMissLabel()}</span>}
                </button>
              ))}
            </div>

            <div className="round-actions" style={{ marginTop: '20px' }}>
              <button className="ghost-button" type="button" onClick={() => setShots((current) => current.slice(0, -1))}>
                <Eraser size={20} />
                {t.new_round_btn_delete_last}
              </button>
              <button className="primary-button" type="button" disabled={!isComplete} onClick={handleSave}>
                <Save size={22} />
                {t.new_round_btn_save}
              </button>
            </div>
          </section>

          <section className="stats-strip">
            <div>
              <Crosshair />
              <span>{t.new_round_stat_total}</span>
              <strong>{stats.totalScore} / 50</strong>
            </div>
            <div>
              <Check />
              <span>{t.new_round_stat_average}</span>
              <strong>{formatAverage(stats.averageScore)}</strong>
            </div>
            <div>
              <Check />
              <span>{t.new_round_stat_best}</span>
              <strong>{shots.length ? stats.bestShot : '-'}</strong>
            </div>
            <div>
              <Check />
              <span>{t.new_round_stat_worst}</span>
              <strong>{shots.length ? stats.worstShot : '-'}</strong>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

import { findModality, useTrainingStore } from '../store/useTrainingStore';
import { formatAverage } from '../lib/scoring';

export function History() {
  const sessions = useTrainingStore((state) => state.sessions);
  const rounds = useTrainingStore((state) => state.rounds);
  const bestRound = rounds.reduce((best, round) => (round.totalScore > (best?.totalScore ?? -1) ? round : best), rounds[0]);
  const worstRound = rounds.reduce((worst, round) => (round.totalScore < (worst?.totalScore ?? 99) ? round : worst), rounds[0]);
  const totalShots = sessions.reduce((sum, session) => sum + session.totalShots, 0);
  const totalScore = sessions.reduce((sum, session) => sum + session.totalScore, 0);

  return (
    <div className="page list-page">
      <header className="compact-header">
        <h1>Historial</h1>
        <p>Evolución básica por modalidad y tandas registradas.</p>
      </header>

      <div className="history-grid">
        <article>
          <span>Total disparos</span>
          <strong>{totalShots}</strong>
        </article>
        <article>
          <span>Media global</span>
          <strong>{formatAverage(totalShots ? totalScore / totalShots : 0)}</strong>
        </article>
        <article>
          <span>Mejor tanda</span>
          <strong>{bestRound ? `${bestRound.totalScore}/50` : '-'}</strong>
        </article>
        <article>
          <span>Peor tanda</span>
          <strong>{worstRound ? `${worstRound.totalScore}/50` : '-'}</strong>
        </article>
      </div>

      <section>
        <h2>Histórico por modalidad</h2>
        <div className="simple-list">
          {sessions.map((session) => (
            <article key={session.id}>
              <strong>{findModality(session.modalityId).name}</strong>
              <span>{session.totalShots} disparos · media {formatAverage(session.averageScore)}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

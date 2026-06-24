import { useState } from 'react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function History() {
  const tiradas = useTrainingStore((state) => state.tiradas);
  const rounds = useTrainingStore((state) => state.rounds);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const bestRound = rounds.reduce((best, round) => (round.totalScore > (best?.totalScore ?? -1) ? round : best), rounds[0]);
  const worstRound = rounds.reduce((worst, round) => (round.totalScore < (worst?.totalScore ?? 99) ? round : worst), rounds[0]);
  const totalShots = tiradas.reduce((sum, tirada) => sum + tirada.totalShots, 0);
  const totalScore = tiradas.reduce((sum, tirada) => sum + tirada.totalScore, 0);

  return (
    <div className="page list-page">
      <header className="compact-header compact-header--row">
        <div>
          <h1>Historial</h1>
          <p>Evolución básica por modalidad y tandas registradas.</p>
        </div>
        <div className="header-logo-container">
          <img
            src={`${import.meta.env.BASE_URL}logo-pixer.png`}
            alt="Agencia Pixer"
            className="header-logo"
          />
        </div>
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
        <h2>Histórico de tiradas</h2>
        <div className="simple-list">
          {tiradas.map((tirada) => {
            const isExpanded = expandedSessionId === tirada.id;
            const sessionRounds = rounds
              .filter((r) => r.sessionId === tirada.id)
              .sort((a, b) => a.roundNumber - b.roundNumber);
            const modality = findModality(tirada.modalityId);

            return (
              <article
                key={tirada.id}
                className="history-session-card"
                onClick={() => setExpandedSessionId(isExpanded ? null : tirada.id)}
              >
                <div className="history-session-card__header">
                  <div>
                    <strong>{modality.name.replace(' .22 LR', '')}</strong>
                    <span>
                      {formatDate(tirada.date)} · {tirada.totalShots} disparos · media {formatAverage(tirada.averageScore)}
                    </span>
                  </div>
                  <div className="history-session-card__toggle">
                    {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="session-detail-rounds" onClick={(e) => e.stopPropagation()}>
                    {sessionRounds.length === 0 ? (
                      <p className="no-rounds-text">No hay tandas registradas en esta tirada.</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="rounds-table">
                          <thead>
                            <tr>
                              <th>Tanda</th>
                              <th className="text-center">D1</th>
                              <th className="text-center">D2</th>
                              <th className="text-center">D3</th>
                              <th className="text-center">D4</th>
                              <th className="text-center">D5</th>
                              <th className="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sessionRounds.map((round) => (
                              <tr key={round.id}>
                                <td className="round-num-col">Tanda {round.roundNumber}</td>
                                {Array.from({ length: 5 }).map((_, shotIdx) => {
                                  const shot = round.shots[shotIdx];
                                  return (
                                    <td key={shotIdx} className="shot-val-col">
                                      {shot === undefined ? '-' : shot === 0 ? 'M' : shot}
                                    </td>
                                  );
                                })}
                                <td className="round-total-col text-right">{round.totalScore} pts</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

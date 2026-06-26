import { useState } from 'react';
import { findModality, useTrainingStore } from '../store/useTrainingStore';
import { formatAverage, formatDate } from '../lib/scoring';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { translations } from '../data/translations';

export function History() {
  const tiradas = useTrainingStore((state) => state.tiradas);
  const rounds = useTrainingStore((state) => state.rounds);
  const language = useTrainingStore((state) => state.language);
  const t = translations[language];

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  return (
    <div className="page list-page">
      <header className="compact-header">
        <h1>{t.history_title}</h1>
        <p>{t.history_subtitle}</p>
      </header>

      <section>
        <h2>{t.history_section_title}</h2>
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
                    <strong>{modality ? modality.name.replace(' .22 LR', '') : 'Modalidad'}</strong>
                    <span>
                      {formatDate(tirada.date)} · {tirada.totalShots} {t.share_stats_shots} · {t.share_stats_average.toLowerCase()} {formatAverage(tirada.averageScore)}
                    </span>
                  </div>
                  <div className="history-session-card__toggle">
                    {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="session-detail-rounds" onClick={(e) => e.stopPropagation()}>
                    {sessionRounds.length === 0 ? (
                      <p className="no-rounds-text">{t.history_no_rounds}</p>
                    ) : (
                      <div className="table-responsive">
                        <table className="rounds-table">
                          <thead>
                            <tr>
                              <th>{t.share_pdf_table_tanda}</th>
                              <th className="text-center">D1</th>
                              <th className="text-center">D2</th>
                              <th className="text-center">D3</th>
                              <th className="text-center">D4</th>
                              <th className="text-center">D5</th>
                              <th className="text-right">{t.share_pdf_table_total}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              let competitionCount = 0;
                              return sessionRounds.map((round) => {
                                const roundLabel = round.isPrueba ? t.new_round_title_prueba : `${t.new_round_title_tanda} ${++competitionCount}`;
                                return (
                                  <tr key={round.id}>
                                    <td className="round-num-col">{roundLabel}</td>
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
                                );
                              });
                            })()}
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

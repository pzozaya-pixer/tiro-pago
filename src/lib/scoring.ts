import type { Round, TrainingSession } from '../types';

export function scoreRound(shots: number[]) {
  const totalScore = shots.reduce((sum, shot) => sum + shot, 0);
  const averageScore = shots.length ? totalScore / shots.length : 0;
  const bestShot = shots.length ? Math.max(...shots) : 0;
  const worstShot = shots.length ? Math.min(...shots) : 0;

  return {
    totalScore,
    averageScore,
    bestShot,
    worstShot
  };
}

export function recalculateSession(session: TrainingSession, rounds: Round[]): TrainingSession {
  const totalScore = rounds.reduce((sum, round) => sum + round.totalScore, 0);
  const totalShots = rounds.reduce((sum, round) => sum + round.shots.length, 0);

  return {
    ...session,
    totalScore,
    totalShots,
    averageScore: totalShots ? totalScore / totalShots : 0
  };
}

export function formatAverage(value: number) {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  });
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
}

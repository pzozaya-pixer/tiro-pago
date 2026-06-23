import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { modalities } from '../data/modalities';
import { createId } from '../lib/id';
import { recalculateSession, scoreRound } from '../lib/scoring';
import { enqueueSync, flushQueue } from '../lib/sync';
import type { Round, SessionType, TrainingSession, Weapon } from '../types';

const demoUserId = 'demo-user';

type TrainingState = {
  sessions: TrainingSession[];
  rounds: Round[];
  weapons: Weapon[];
  activeSessionId?: string;
  createSession: (input: {
    modalityId: string;
    weaponId?: string;
    type: SessionType;
    date: string;
    notes?: string;
  }) => TrainingSession;
  saveRound: (input: { sessionId: string; shots: number[] }) => Round;
  setActiveSession: (sessionId: string) => void;
  getActiveSession: () => TrainingSession | undefined;
  loadFromApi: () => Promise<void>;
  deleteSession: (id: string) => void;
};

const today = new Date().toISOString();

const seedSessions: TrainingSession[] = [
  {
    id: 'seed-session-1',
    userId: demoUserId,
    modalityId: 'pistol-25',
    type: 'entrenamiento',
    date: '2026-06-22T09:00:00.000Z',
    totalScore: 264,
    totalShots: 30,
    averageScore: 8.8,
    createdAt: '2026-06-22T09:00:00.000Z'
  },
  {
    id: 'seed-session-2',
    userId: demoUserId,
    modalityId: 'rifle-50',
    type: 'entrenamiento',
    date: '2026-06-20T10:30:00.000Z',
    totalScore: 558,
    totalShots: 60,
    averageScore: 9.3,
    createdAt: '2026-06-20T10:30:00.000Z'
  },
  {
    id: 'seed-session-3',
    userId: demoUserId,
    modalityId: 'rapid-pistol-25',
    type: 'competicion',
    date: '2026-06-18T17:15:00.000Z',
    totalScore: 248,
    totalShots: 30,
    averageScore: 8.27,
    createdAt: '2026-06-18T17:15:00.000Z'
  }
];

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      sessions: seedSessions,
      rounds: [],
      weapons: [
        {
          id: 'weapon-pistol',
          userId: demoUserId,
          name: 'Pistola estándar .22',
          type: 'pistol',
          caliber: '.22 LR',
          notes: 'Arma de entrenamiento',
          createdAt: today
        },
        {
          id: 'weapon-rifle',
          userId: demoUserId,
          name: 'Carabina match .22',
          type: 'rifle',
          caliber: '.22 LR',
          notes: 'Carabina principal',
          createdAt: today
        }
      ],
      activeSessionId: 'seed-session-1',
      createSession: (input) => {
        const session: TrainingSession = {
          id: createId('session'),
          userId: demoUserId,
          modalityId: input.modalityId,
          weaponId: input.weaponId,
          type: input.type,
          date: input.date,
          notes: input.notes,
          totalScore: 0,
          totalShots: 0,
          averageScore: 0,
          createdAt: new Date().toISOString()
        };

        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id
        }));
        enqueueSync({ type: 'session:create', payload: session });

        const provider = import.meta.env.VITE_DATA_PROVIDER ?? 'local';
        if (provider === 'api' && navigator.onLine) {
          flushQueue(import.meta.env.VITE_API_URL ?? '/api').catch(console.error);
        }

        return session;
      },
      saveRound: ({ sessionId, shots }) => {
        const sessionRounds = get().rounds.filter((round) => round.sessionId === sessionId);
        const scored = scoreRound(shots);
        const round: Round = {
          id: createId('round'),
          sessionId,
          roundNumber: sessionRounds.length + 1,
          shots,
          ...scored,
          createdAt: new Date().toISOString()
        };

        set((state) => {
          const nextRounds = [round, ...state.rounds];
          return {
            rounds: nextRounds,
            sessions: state.sessions.map((session) =>
              session.id === sessionId
                ? recalculateSession(
                    session,
                    nextRounds.filter((item) => item.sessionId === sessionId)
                  )
                : session
            )
          };
        });
        enqueueSync({ type: 'round:create', payload: round });

        const provider = import.meta.env.VITE_DATA_PROVIDER ?? 'local';
        if (provider === 'api' && navigator.onLine) {
          flushQueue(import.meta.env.VITE_API_URL ?? '/api').catch(console.error);
        }

        return round;
      },
      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
      getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return sessions.find((session) => session.id === activeSessionId);
      },
      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
          rounds: state.rounds.filter((round) => round.sessionId !== id),
          activeSessionId: state.activeSessionId === id ? undefined : state.activeSessionId
        }));
        enqueueSync({ type: 'session:delete', payload: { id } });

        const provider = import.meta.env.VITE_DATA_PROVIDER ?? 'local';
        if (provider === 'api' && navigator.onLine) {
          flushQueue(import.meta.env.VITE_API_URL ?? '/api').catch(console.error);
        }
      },
      loadFromApi: async () => {
        const provider = import.meta.env.VITE_DATA_PROVIDER ?? 'local';
        if (provider !== 'api') return;

        const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
        try {
          // 1. Enviar datos locales en cola antes de descargar
          await flushQueue(apiUrl);

          // 2. Descargar sesiones con sus tandas
          const response = await fetch(`${apiUrl}/sessions`);
          if (response.ok) {
            const remoteSessions = await response.json();

            const sessionsList: TrainingSession[] = remoteSessions.map((s: any) => ({
              id: s.id,
              userId: s.userId,
              modalityId: s.modalityId,
              weaponId: s.weaponId,
              type: s.type,
              date: s.date,
              notes: s.notes,
              totalScore: s.totalScore,
              totalShots: s.totalShots,
              averageScore: s.averageScore,
              createdAt: s.createdAt
            }));

            const roundsList: Round[] = remoteSessions.flatMap((s: any) =>
              (s.rounds ?? []).map((r: any) => ({
                id: r.id,
                sessionId: r.sessionId,
                roundNumber: r.roundNumber,
                shots: [r.shot1, r.shot2, r.shot3, r.shot4, r.shot5],
                totalScore: r.totalScore,
                averageScore: r.averageScore,
                bestShot: r.bestShot,
                worstShot: r.worstShot,
                createdAt: r.createdAt
              }))
            );

            set({
              sessions: sessionsList.length ? sessionsList : seedSessions,
              rounds: roundsList
            });
          }
        } catch (error) {
          console.error('Error loading data from API:', error);
        }
      }
    }),
    {
      name: 'tiro22-training-store',
      version: 1
    }
  )
);

export function findModality(modalityId: string) {
  return modalities.find((modality) => modality.id === modalityId) ?? modalities[0];
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { modalities as seedModalities } from '../data/modalities';
import { createId } from '../lib/id';
import { recalculateSession, scoreRound } from '../lib/scoring';
import { enqueueSync, flushQueue } from '../lib/sync';
import type { Round, TiradaType, Tirada, Weapon, Modality } from '../types';
import type { Language } from '../data/translations';

type TrainingState = {
  userEmail: string | null;
  tiradas: Tirada[];
  rounds: Round[];
  weapons: Weapon[];
  modalities: Modality[];
  language: Language;
  activeTiradaId?: string;
  registerUser: (email: string) => Promise<void>;
  createTirada: (input: {
    modalityId: string;
    weaponId?: string;
    type: TiradaType;
    date: string;
    notes?: string;
  }) => Tirada;
  saveRound: (input: {
    sessionId: string;
    shots: number[];
    isPrueba?: boolean;
  }) => Round;
  setActiveTirada: (tiradaId: string) => void;
  getActiveTirada: () => Tirada | undefined;
  loadFromApi: () => Promise<void>;
  deleteTirada: (id: string) => void;
  setLanguage: (lang: Language) => void;
  addModality: (input: Omit<Modality, 'id' | 'createdAt'>) => Modality;
  updateModality: (id: string, input: Partial<Modality>) => void;
  deleteModality: (id: string) => void;
};

const today = new Date().toISOString();

const seedTiradas: Tirada[] = [
  {
    id: 'seed-session-1',
    userId: 'demo-user',
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
    userId: 'demo-user',
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
    userId: 'demo-user',
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
      userEmail: null,
      tiradas: seedTiradas,
      rounds: [],
      weapons: [
        {
          id: 'weapon-pistol',
          userId: 'demo-user',
          name: 'Pistola estándar .22',
          type: 'pistol',
          caliber: '.22 LR',
          notes: 'Arma de entrenamiento',
          createdAt: today
        },
        {
          id: 'weapon-rifle',
          userId: 'demo-user',
          name: 'Carabina match .22',
          type: 'rifle',
          caliber: '.22 LR',
          notes: 'Carabina principal',
          createdAt: today
        }
      ],
      modalities: seedModalities,
      language: 'es',
      setLanguage: (lang) => set({ language: lang }),
      addModality: (input) => {
        const modality: Modality = {
          id: createId('modality'),
          ...input,
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          modalities: [...state.modalities, modality]
        }));
        return modality;
      },
      updateModality: (id, input) => {
        set((state) => ({
          modalities: state.modalities.map((m) => (m.id === id ? { ...m, ...input } : m))
        }));
      },
      deleteModality: (id) => {
        set((state) => ({
          modalities: state.modalities.filter((m) => m.id !== id)
        }));
      },
      activeTiradaId: 'seed-session-1',
      registerUser: async (email) => {
        set({ userEmail: email });
  
        // Registrar en el backend si el proveedor es api
        const provider = import.meta.env.VITE_DATA_PROVIDER ?? 'local';
        if (provider === 'api') {
          const apiUrl = import.meta.env.VITE_API_URL ?? '/api';
          try {
            await fetch(`${apiUrl}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
          } catch (error) {
            console.error('Error registering user on backend:', error);
          }
        }
      },
      createTirada: (input) => {
        const userId = get().userEmail ?? 'demo-user';
        const tirada: Tirada = {
          id: createId('session'), // Mantenemos el prefijo de ID 'session' para compatibilidad
          userId,
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
          tiradas: [tirada, ...state.tiradas],
          activeTiradaId: tirada.id
        }));
        enqueueSync({ type: 'session:create', payload: tirada as any }); // Sigue encolándose como 'session:create' para compatibilidad con la API

        const provider = import.meta.env.VITE_DATA_PROVIDER ?? 'local';
        if (provider === 'api' && navigator.onLine) {
          flushQueue(import.meta.env.VITE_API_URL ?? '/api').catch(console.error);
        }

        return tirada;
      },
      saveRound: ({ sessionId, shots, isPrueba }) => {
        const sessionRounds = get().rounds.filter((round) => round.sessionId === sessionId);
        const scored = scoreRound(shots);
        const round: Round = {
          id: createId('round'),
          sessionId,
          roundNumber: sessionRounds.length + 1,
          shots,
          isPrueba,
          ...scored,
          createdAt: new Date().toISOString()
        };

        set((state) => {
          const nextRounds = [round, ...state.rounds];
          return {
            rounds: nextRounds,
            tiradas: state.tiradas.map((tirada) =>
              tirada.id === sessionId
                ? (recalculateSession(
                    tirada as any,
                    nextRounds.filter((item) => item.sessionId === sessionId)
                  ) as any)
                : tirada
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
      setActiveTirada: (tiradaId) => set({ activeTiradaId: tiradaId }),
      getActiveTirada: () => {
        const { activeTiradaId, tiradas } = get();
        return tiradas.find((tirada) => tirada.id === activeTiradaId);
      },
      deleteTirada: (id) => {
        set((state) => ({
          tiradas: state.tiradas.filter((tirada) => tirada.id !== id),
          rounds: state.rounds.filter((round) => round.sessionId !== id),
          activeTiradaId: state.activeTiradaId === id ? undefined : state.activeTiradaId
        }));
        enqueueSync({ type: 'session:delete', payload: { id } as any });

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

          // 2. Descargar tiradas (sesiones) con sus tandas
          const response = await fetch(`${apiUrl}/sessions`);
          if (response.ok) {
            const remoteSessions = await response.json();

            const tiradasList: Tirada[] = remoteSessions.map((s: any) => ({
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
                isPrueba: r.isPrueba,
                createdAt: r.createdAt
              }))
            );

            set({
              tiradas: tiradasList.length ? tiradasList : seedTiradas,
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
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          return {
            ...persistedState,
            userEmail: persistedState.userPhone || null,
            version: 2
          };
        }
        return persistedState;
      }
    }
  )
);

export function findModality(modalityId: string) {
  const storeModalities = useTrainingStore.getState().modalities || seedModalities;
  return storeModalities.find((modality) => modality.id === modalityId) ?? storeModalities[0] ?? seedModalities[0];
}

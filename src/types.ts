export type WeaponType = 'pistol' | 'rifle';
export type SessionType = 'entrenamiento' | 'competicion';
export type DataProvider = 'local' | 'api' | 'supabase';

export type Modality = {
  id: string;
  name: string;
  distance: string;
  weaponType: WeaponType;
  caliber: string;
  shotsPerRound: number;
  maxScorePerShot: number;
  createdAt: string;
};

export type Weapon = {
  id: string;
  userId: string;
  name: string;
  type: WeaponType;
  caliber: string;
  notes?: string;
  createdAt: string;
};

export type TrainingSession = {
  id: string;
  userId: string;
  modalityId: string;
  weaponId?: string;
  type: SessionType;
  date: string;
  notes?: string;
  totalScore: number;
  totalShots: number;
  averageScore: number;
  createdAt: string;
};

export type Round = {
  id: string;
  sessionId: string;
  roundNumber: number;
  shots: number[];
  totalScore: number;
  averageScore: number;
  bestShot: number;
  worstShot: number;
  createdAt: string;
};

export type SessionWithRounds = TrainingSession & {
  modality: Modality;
  rounds: Round[];
};

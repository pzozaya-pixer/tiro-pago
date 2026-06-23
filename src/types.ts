export type WeaponType = 'pistol' | 'rifle';
export type TiradaType = 'entrenamiento' | 'competicion';
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

export type Tirada = {
  id: string;
  userId: string;
  modalityId: string;
  weaponId?: string;
  type: TiradaType;
  date: string;
  notes?: string;
  totalScore: number;
  totalShots: number;
  averageScore: number;
  createdAt: string;
};

export type Round = {
  id: string;
  sessionId: string; // Mantenemos sessionId para mapeo directo con la base de datos relacional
  roundNumber: number;
  shots: number[];
  totalScore: number;
  averageScore: number;
  bestShot: number;
  worstShot: number;
  createdAt: string;
};

export type TiradaWithRounds = Tirada & {
  modality: Modality;
  rounds: Round[];
};

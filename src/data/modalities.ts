import type { Modality } from '../types';

const now = new Date('2026-06-23T00:00:00.000Z').toISOString();

export const modalities: Modality[] = [
  {
    id: 'pistol-25',
    name: 'Pistola 25 m .22 LR',
    distance: '25 m',
    weaponType: 'pistol',
    caliber: '.22 LR',
    shotsPerRound: 5,
    maxScorePerShot: 10,
    createdAt: now
  },
  {
    id: 'rapid-pistol-25',
    name: 'Pistola velocidad 25 m .22 LR',
    distance: '25 m',
    weaponType: 'pistol',
    caliber: '.22 LR',
    shotsPerRound: 5,
    maxScorePerShot: 10,
    createdAt: now
  },
  {
    id: 'rifle-50',
    name: 'Carabina 50 m .22 LR',
    distance: '50 m',
    weaponType: 'rifle',
    caliber: '.22 LR',
    shotsPerRound: 5,
    maxScorePerShot: 10,
    createdAt: now
  },
  {
    id: 'rifle-3p-50',
    name: 'Carabina 3 posiciones 50 m .22 LR',
    distance: '50 m',
    weaponType: 'rifle',
    caliber: '.22 LR',
    shotsPerRound: 5,
    maxScorePerShot: 10,
    createdAt: now
  }
];

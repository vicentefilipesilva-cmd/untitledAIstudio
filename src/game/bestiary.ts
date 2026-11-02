import { BestiaryEntryId } from '../types/game';

export interface BestiaryEntry {
  id: BestiaryEntryId;
  name: string;
  description: string;
  hp: number;
  damage: string;
}

export const BESTIARY_ENTRIES: BestiaryEntry[] = [
  {
    id: 'boar',
    name: 'Wild Boar',
    description: 'A stubborn woodland beast that charges intruders on sight.',
    hp: 3,
    damage: '1'
  },
  {
    id: 'wolf',
    name: 'Grey Wolf',
    description: 'A quick hunter that pursues travelers who stray from the trail.',
    hp: 4,
    damage: '1'
  },
  {
    id: 'bandit',
    name: 'Road Bandit',
    description: 'An armed outlaw who preys on merchants and isolated settlements.',
    hp: 5,
    damage: '1'
  },
  {
    id: 'corrupt_knight',
    name: 'Corrupt Knight',
    description: 'A royal enforcer who has turned the Crown’s authority against the people.',
    hp: 8,
    damage: '2'
  },
  {
    id: 'king',
    name: 'King Raymond IV',
    description: 'The tyrant of Aethelgard, protected by royal steel and a relentless shockwave attack.',
    hp: 24,
    damage: '1–2'
  }
];

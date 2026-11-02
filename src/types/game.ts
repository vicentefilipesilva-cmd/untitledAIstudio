/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SCREEN_WIDTH = 240;
export const SCREEN_HEIGHT = 160;
export const TILE_SIZE = 16;

export const DIR_DOWN = 0;
export const DIR_UP = 1;
export const DIR_LEFT = 2;
export const DIR_RIGHT = 3;

export type Direction = 0 | 1 | 2 | 3;

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TileDef {
  name: string;
  sprite: string;
  topSprite?: string;
  solid: boolean;
  interactable?: string;
}

export interface NPCData {
  id: string;
  name: string;
  sprite: string;
  x: number;
  y: number;
  facing: Direction;
  dialogueId?: string;
}

export interface EnemyData {
  type: 'boar' | 'wolf' | 'bandit' | 'corrupt_knight';
  x: number;
  y: number;
  patrolAxis?: 'x' | 'y';
  patrolMin?: number;
  patrolMax?: number;
  isQuestTarget?: string;
  neutralUntilProvoked?: boolean;
}

export interface ExitTrigger {
  trigger: Bounds;
  targetMap: string;
  targetX: number;
  targetY: number;
  targetFacing: Direction;
  condition?: 'canEnterTown' | 'canEnterRoute1' | 'canEnterHighroad' | 'hasWineIntel' | 'canEnterCastle';
  lockMessage?: string;
}

export interface DoorData {
  x: number;
  y: number;
  targetMap: string;
  targetX: number;
  targetY: number;
  targetFacing: Direction;
}

export interface PuzzleDefinition {
  id: string;
  type: 'lever-sequence' | 'push-block' | 'target-sequence';
  hint: string;
  levers?: Point[];
  targets?: Point[];
  sequence?: number[];
  block?: Point;
  plate?: Point;
  barriers: Point[];
  gates: Point[];
  secrets?: Point[];
  traps?: Point[];
  chest: Point;
  rewardCoins: number;
}

export interface PuzzleProgress {
  solved: boolean;
  sequence: number[];
  block?: Point;
  chestClaimed: boolean;
}

export interface MapData {
  id: string;
  name: string;
  region: string;
  music: 'village' | 'forest' | 'town' | 'road' | 'boss';
  width: number;
  height: number;
  layout: string[];
  exits: ExitTrigger[];
  doors?: DoorData[];
  npcs: NPCData[];
  enemies: EnemyData[];
  altar?: { x: number; y: number; active: boolean };
  puzzles?: PuzzleDefinition[];
  puzzleProgress?: Record<string, PuzzleProgress>;
  bigTrees?: Point[];
  signText?: string;
}

export interface DialoguePage {
  speaker: string;
  text: string;
  speakerSprite?: string;
}

export const QUEST_STATE = {
  NOT_STARTED: 0,
  SEARCHING_HAT: 1,
  FOUND_HAT_SWORD: 2,
  TALKED_AFTER_SWORD: 3,
  ENTERED_AIGUEMORTE: 4,
  ORPHAN_FLOUR_QUEST: 5,
  ORPHAN_FLOUR_RESOLVED: 6,
  REACHED_VAL_DE_LOIRE: 7,
  FORGE_LEDGER_QUEST: 8,
  HAS_SHIELD_AND_UPGRADE: 9,
  JOURNEY_TO_BEAUVAIS_TOURS: 10,
  WINE_TRAIL_REVEAL_QUEST: 11,
  HAS_ROYAL_DECREE_PROOF: 12,
  CAMINHO_REAL_CONFRONTATION: 13,
  CONFRONTING_KING: 14,
  VICTORY_LIBERATION: 15
} as const;

export type QuestStateType = typeof QUEST_STATE[keyof typeof QUEST_STATE];

export interface QuestLogItem {
  id: string;
  title: string;
  act: 'Act I' | 'Act II' | 'Act III' | 'Epilogue';
  location: string;
  description: string;
  completed: boolean;
  reward?: string;
}

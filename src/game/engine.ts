/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bounds, CityStoryQuestId, Direction, DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, MapData, Point, PuzzleDefinition, PuzzleProgress, QUEST_STATE, QuestStateType, SCREEN_HEIGHT, SCREEN_WIDTH, SideQuestProgress, TILE_SIZE } from '../types/game';
import { audioManager } from './audio';
import { dialogueManager } from './dialogue';
import { BossKing, Enemy, NearbyInteractable, NPC, Pickup, Player, PlayerInventory } from './entities';
import { isExpandedWorldMap, TILE_DEFS, WORLD_MAP_OFFSET, WORLD_MAPS } from './maps';
import { completePuzzle, getPuzzleProgress, sealPuzzleBarriers } from './puzzles';
import { spriteManager } from './sprites';

const CANVAS_RENDER_SCALE = 2;
const SAVE_KEY = 'aethelgard_save';
const SAVE_WORLD_VERSION = 2;

interface GameSaveData {
  worldMapVersion?: number;
  mapId: string;
  x: number;
  y: number;
  facing: Direction;
  hearts?: number;
  coins?: number;
  hasSword?: boolean;
  hasHat?: boolean;
  hasMap?: boolean;
  hasShield?: boolean;
  hasWhetstone?: boolean;
  hasFlour?: boolean;
  hasWineBarrel?: boolean;
  hasRoyalDecree?: boolean;
  swordDamage?: number;
  questState?: QuestStateType;
  playerHasIronOre?: boolean;
  puzzleProgress?: Record<string, Record<string, PuzzleProgress>>;
  sideQuestProgress?: Record<string, SideQuestProgress>;
  cityStoryQuestProgress?: Record<CityStoryQuestId, 'active' | 'ready' | 'completed'>;
}

const isGameSaveData = (value: unknown): value is GameSaveData => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (typeof data.mapId !== 'string') return false;
  const map = WORLD_MAPS[data.mapId];
  if (!map) return false;

  const booleanFields = [
    'hasSword', 'hasHat', 'hasMap', 'hasShield', 'hasWhetstone',
    'hasFlour', 'hasWineBarrel', 'hasRoyalDecree', 'playerHasIronOre'
  ];

  return typeof data.x === 'number' && Number.isFinite(data.x) &&
    typeof data.y === 'number' && Number.isFinite(data.y) &&
    data.x >= 0 && data.x < map.width * TILE_SIZE &&
    data.y >= 0 && data.y < map.height * TILE_SIZE &&
    (data.facing === DIR_DOWN || data.facing === DIR_UP ||
      data.facing === DIR_LEFT || data.facing === DIR_RIGHT) &&
    (data.worldMapVersion === undefined || data.worldMapVersion === SAVE_WORLD_VERSION) &&
    (data.hearts === undefined || (typeof data.hearts === 'number' && Number.isInteger(data.hearts) &&
      data.hearts >= 1 && data.hearts <= 4)) &&
    (data.coins === undefined || (typeof data.coins === 'number' && Number.isSafeInteger(data.coins) && data.coins >= 0)) &&
    (data.swordDamage === undefined || data.swordDamage === 1 || data.swordDamage === 2) &&
    (data.questState === undefined || (typeof data.questState === 'number' && Number.isInteger(data.questState) &&
      data.questState >= QUEST_STATE.NOT_STARTED && data.questState <= QUEST_STATE.VICTORY_LIBERATION)) &&
    booleanFields.every(field => data[field] === undefined || typeof data[field] === 'boolean') &&
    dialogueManager.isValidSideQuestProgress(data.sideQuestProgress) &&
    dialogueManager.isValidCityStoryQuestProgress(data.cityStoryQuestProgress) &&
    isSavedPuzzleProgress(data.puzzleProgress);
};

function isSavedPuzzleProgress(value: unknown): value is Record<string, Record<string, PuzzleProgress>> | undefined {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([mapId, progressById]) => {
    const map = WORLD_MAPS[mapId];
    if (!map || !progressById || typeof progressById !== 'object' || Array.isArray(progressById)) return false;
    return Object.entries(progressById).every(([puzzleId, progress]) => {
      const puzzle = map.puzzles?.find(entry => entry.id === puzzleId);
      if (!puzzle || !progress || typeof progress !== 'object' || Array.isArray(progress)) return false;
      const saved = progress as Record<string, unknown>;
      const sequenceLength = puzzle.sequence?.length ?? 0;
      return typeof saved.solved === 'boolean' &&
        typeof saved.chestClaimed === 'boolean' &&
        (!saved.chestClaimed || saved.solved === true) &&
        Array.isArray(saved.sequence) &&
        saved.sequence.length <= sequenceLength &&
        saved.sequence.every(index => Number.isInteger(index) && index >= 0 && index < sequenceLength) &&
        (puzzle.type !== 'push-block' || !!saved.block) &&
        (saved.block === undefined || (
          !!saved.block && typeof saved.block === 'object' &&
          typeof (saved.block as Record<string, unknown>).x === 'number' &&
          Number.isInteger((saved.block as Record<string, unknown>).x) &&
          typeof (saved.block as Record<string, unknown>).y === 'number' &&
          Number.isInteger((saved.block as Record<string, unknown>).y) &&
          (saved.block as Point).x >= 0 && (saved.block as Point).x < map.width &&
          (saved.block as Point).y >= 0 && (saved.block as Point).y < map.height
        ));
    });
  });
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public camera: Point = { x: 0, y: 0 };

  public currentMapId = 'village';
  public currentMapData: MapData = WORLD_MAPS['village'];
  public player: Player;
  public npcs: NPC[] = [];
  public enemies: Enemy[] = [];
  public pickups: Pickup[] = [];

  public boss: BossKing | null = null;
  public bossActive = false;
  public nearbyInteractable: NearbyInteractable | null = null;

  public transitioning = false;
  public isPaused = false;
  public fadeAlpha = 0;
  public fadeDirection = 0;
  public pendingMapChange: { mapId: string; targetX: number; targetY: number; targetFacing: Direction } | null = null;
  public placeBannerTimer = 0;
  public placeBannerName = '';

  public isVictory = false;
  public victoryTimer = 0;
  public isGameOver = false;
  public gameOverJinglePlayed = false;

  /** Inventory frozen at death so Try Again never drops sword/shield/quest gear. */
  private inventoryAtDeath: PlayerInventory | null = null;

  public keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false,
    interact: false,
    shield: false
  };

  // GBA Visual Effects & Polish
  public particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; maxLife: number; type?: string }[] = [];
  public damageTexts: { x: number; y: number; text: string; color: string; life: number; maxLife: number; vy: number }[] = [];
  public screenShake = 0;
  public hitStop = 0;
  private ambientTimer = 0;

  private isBooted = false;
  private animationFrameId: number | null = null;
  private kingConfrontationTimer: number | null = null;
  private enemyDropListener: EventListener | null = null;
  private readonly saveAfterDialogue = () => {
    dialogueManager.syncQuestLog();
    this.autoSave();
  };
  private readonly runtimeMaps: Record<string, MapData> = {};
  private savedPuzzleProgress: Record<string, Record<string, PuzzleProgress>> = {};
  private readonly trapCooldowns: Record<string, number> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = SCREEN_WIDTH * CANVAS_RENDER_SCALE;
    this.canvas.height = SCREEN_HEIGHT * CANVAS_RENDER_SCALE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create the game canvas rendering context.');
    this.ctx = context;
    this.ctx.setTransform(CANVAS_RENDER_SCALE, 0, 0, CANVAS_RENDER_SCALE, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    dialogueManager.onCloseCallback = this.saveAfterDialogue;

    this.player = new Player(8 * 16 + WORLD_MAP_OFFSET, 7 * 16 + WORLD_MAP_OFFSET);
    this.setupDropListener();

    const loaded = this.loadSavedGame();
    if (!loaded) {
      this.loadMap('village', 8 * 16 + WORLD_MAP_OFFSET, 7 * 16 + WORLD_MAP_OFFSET, DIR_DOWN);
    }
    this.isBooted = true;
  }

  public spawnDamageText(x: number, y: number, text: string, color = '#facc15') {
    this.damageTexts.push({
      x,
      y,
      text,
      color,
      life: 28,
      maxLife: 28,
      vy: -0.6
    });
  }

  public spawnParticles(x: number, y: number, count = 4, color = '#4ade80', type = 'spark') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() < 0.5 ? 2 : 1,
        life: 18 + Math.floor(Math.random() * 14),
        maxLife: 32,
        type
      });
    }
  }

  private cutGrassInFront() {
    let checkCol = Math.floor((this.player.x + 6) / TILE_SIZE);
    let checkRow = Math.floor((this.player.y + 5) / TILE_SIZE);

    if (this.player.facing === DIR_DOWN) checkRow++;
    else if (this.player.facing === DIR_UP) checkRow--;
    else if (this.player.facing === DIR_LEFT) checkCol--;
    else if (this.player.facing === DIR_RIGHT) checkCol++;

    const layout = this.currentMapData.layout;
    if (checkRow >= 0 && checkRow < layout.length && checkCol >= 0 && checkCol < layout[checkRow].length) {
      const tileChar = layout[checkRow][checkCol];
      if (tileChar === 'F') {
        const rowArr = layout[checkRow].split('');
        rowArr[checkCol] = '.';
        layout[checkRow] = rowArr.join('');
        audioManager.playGrassCut();
        this.spawnParticles(checkCol * TILE_SIZE + 8, checkRow * TILE_SIZE + 8, 6, '#4ade80', 'leaf');
        if (Math.random() < 0.4) {
          const type = Math.random() < 0.35 ? 'heart' : 'coin';
          this.pickups.push(new Pickup(type, checkCol * TILE_SIZE + 2, checkRow * TILE_SIZE + 2));
        }
      }
    }
  }

  private setupDropListener() {
    this.enemyDropListener = ((e: CustomEvent) => {
      const { x, y, type } = e.detail;
      this.pickups.push(new Pickup(type, x, y));
    }) as EventListener;
    window.addEventListener('enemyDrop', this.enemyDropListener);
  }

  public releaseInputs() {
    this.keys.up = false;
    this.keys.down = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.attack = false;
    this.keys.interact = false;
    this.keys.shield = false;
    this.player.isMoving = false;
    this.player.isBlocking = false;
    this.player.chargeTimer = 0;
    this.player.isCharged = false;
  }

  public handleKeyDown(k: string) {
    audioManager.init();
    const lower = k.toLowerCase();

    if (lower === 'w' || k === 'ArrowUp') this.keys.up = true;
    if (lower === 's' || k === 'ArrowDown') this.keys.down = true;
    if (lower === 'a' || k === 'ArrowLeft') this.keys.left = true;
    if (lower === 'd' || k === 'ArrowRight') this.keys.right = true;

    if (this.isGameOver) {
      if (lower === 't') {
        audioManager.playButtonClick();
        this.tryAgainFromCheckpoint();
        return;
      }
      if (lower === 'm') {
        this.restartGame();
        return;
      }
    }

    // Dash with Shift or C
    if (k === 'Shift' || lower === 'c') {
      this.handleActionPress('dash');
      return;
    }

    if (lower === ' ' || lower === 'z' || lower === 'r') {
      if (!this.keys.attack) {
        this.handleActionPress('attack');
      }
      this.keys.attack = true;
    }

    if (lower === 'e' || lower === 'enter') {
      if (!this.keys.interact) {
        this.handleActionPress('interact');
      }
      this.keys.interact = true;
    }

    if (lower === 'x' || lower === 'q' || lower === 'l') {
      this.keys.shield = true;
    }
  }

  public handleKeyUp(k: string) {
    const lower = k.toLowerCase();
    if (lower === 'w' || k === 'ArrowUp') this.keys.up = false;
    if (lower === 's' || k === 'ArrowDown') this.keys.down = false;
    if (lower === 'a' || k === 'ArrowLeft') this.keys.left = false;
    if (lower === 'd' || k === 'ArrowRight') this.keys.right = false;
    if (lower === ' ' || lower === 'z' || lower === 'r') {
      if (this.player.isCharged) {
        this.player.triggerSpinAttack(this.enemies, this.boss, (x, y, dmg) => {
          this.screenShake = 4;
          this.spawnDamageText(x, y, `-${dmg}`, '#f59e0b');
          this.spawnParticles(x, y, 6, '#67e8f9', 'spark');
        });
      }
      this.keys.attack = false;
    }
    if (lower === 'e' || lower === 'enter') this.keys.interact = false;
    if (lower === 'x' || lower === 'q' || lower === 'l') this.keys.shield = false;
  }

  public handleActionPress(type: 'attack' | 'interact' | 'shield' | 'dash') {
    audioManager.init();
    if (this.isVictory && this.victoryTimer > 2) {
      this.restartGame();
      return;
    }
    if (this.isGameOver) {
      audioManager.playButtonClick();
      this.tryAgainFromCheckpoint();
      return;
    }
    if (dialogueManager.isOpen) {
      dialogueManager.advance();
      return;
    }

    if (type === 'dash') {
      this.player.triggerDash((x, y) => this.spawnParticles(x, y, 3, '#94a3b8', 'dust'));
      return;
    }

    if (type === 'interact') {
      if (this.nearbyInteractable) {
        if (this.nearbyInteractable.type === 'door' && this.nearbyInteractable.door) {
          const door = this.nearbyInteractable.door;
          this.changeMapWithTransition(door.targetMap, door.targetX, door.targetY, door.targetFacing);
        } else if (this.nearbyInteractable.type === 'puzzle-lever' && this.nearbyInteractable.puzzleId !== undefined &&
          this.nearbyInteractable.elementIndex !== undefined) {
          const puzzle = this.currentMapData.puzzles?.find(entry => entry.id === this.nearbyInteractable?.puzzleId);
          if (puzzle) this.advancePuzzleSequence(puzzle, this.nearbyInteractable.elementIndex);
        } else if (this.nearbyInteractable.type === 'puzzle-chest' && this.nearbyInteractable.puzzleId !== undefined) {
          const puzzle = this.currentMapData.puzzles?.find(entry => entry.id === this.nearbyInteractable?.puzzleId);
          if (puzzle) {
            const progress = getPuzzleProgress(this.currentMapData, puzzle);
            if (progress.solved && !progress.chestClaimed) {
              progress.chestClaimed = true;
              this.player.coins += puzzle.rewardCoins;
              dialogueManager.recordPuzzleChestClaimed(puzzle.id);
              this.spawnParticles(puzzle.chest.x * TILE_SIZE + 8, puzzle.chest.y * TILE_SIZE + 8, 8, '#facc15', 'spark');
              audioManager.playItemGet();
              this.autoSave();
            }
          }
        } else if (this.nearbyInteractable.type === 'puzzle-target' || this.nearbyInteractable.type === 'puzzle-block') {
          return;
        } else {
          if (this.nearbyInteractable.type === 'npc' && this.nearbyInteractable.entity) {
            this.nearbyInteractable.entity.turnToward(this.player.x + 6, this.player.y + 5);
          }
          dialogueManager.handleInteraction(this.nearbyInteractable, this.player, () => this.autoSave());
        }
      }
    } else if (type === 'attack') {
      if (this.nearbyInteractable?.type === 'puzzle-target') {
        if (this.player.hasSword) {
          this.player.attack(this.enemies, this.boss, undefined, bounds => this.handlePuzzleAttack(bounds));
        }
      } else if (!this.player.hasSword && this.nearbyInteractable) {
        dialogueManager.handleInteraction(this.nearbyInteractable, this.player, () => this.autoSave());
      } else {
        this.cutGrassInFront();
        this.player.attack(this.enemies, this.boss, (x, y, dmg) => {
          this.screenShake = Math.max(this.screenShake, 3);
          this.hitStop = 2;
          this.spawnDamageText(x, y, `-${dmg}`, dmg > 1 ? '#f59e0b' : '#facc15');
          this.spawnParticles(x, y, 5, '#fef08a', 'spark');
        });
      }
    }
  }

  private advancePuzzleSequence(puzzle: PuzzleDefinition, elementIndex: number) {
    const sequence = puzzle.sequence;
    if (!sequence?.length) return;
    const progress = getPuzzleProgress(this.currentMapData, puzzle);
    if (progress.solved) return;
    if (sequence[progress.sequence.length] !== elementIndex) {
      progress.sequence = [];
      this.spawnDamageText(this.player.x + 6, this.player.y - 4, 'RESET', '#f87171');
      this.autoSave();
      return;
    }
    progress.sequence.push(elementIndex);
    this.spawnParticles(this.player.x + 6, this.player.y + 5, 3, '#4ade80', 'spark');
    if (progress.sequence.length === sequence.length) {
      completePuzzle(this.currentMapData, puzzle, progress);
      const gate = puzzle.gates[0];
      if (gate) this.spawnParticles(gate.x * TILE_SIZE + 8, gate.y * TILE_SIZE + 8, 12, '#facc15', 'spark');
    }
    this.autoSave();
  }

  private handlePuzzleAttack(bounds: Bounds) {
    for (const puzzle of this.currentMapData.puzzles || []) {
      if (puzzle.type !== 'target-sequence' || !puzzle.targets) continue;
      if (getPuzzleProgress(this.currentMapData, puzzle).solved) continue;
      const targetIndex = puzzle.targets.findIndex(target =>
        bounds.x < (target.x + 1) * TILE_SIZE &&
        bounds.x + bounds.w > target.x * TILE_SIZE &&
        bounds.y < (target.y + 1) * TILE_SIZE &&
        bounds.y + bounds.h > target.y * TILE_SIZE
      );
      if (targetIndex >= 0) {
        this.advancePuzzleSequence(puzzle, targetIndex);
        return;
      }
    }
  }

  private checkPuzzleTraps() {
    for (const key of Object.keys(this.trapCooldowns)) {
      if (this.trapCooldowns[key] > 0) this.trapCooldowns[key]--;
    }
    const tileX = Math.floor((this.player.x + 6) / TILE_SIZE);
    const tileY = Math.floor((this.player.y + 5) / TILE_SIZE);
    for (const puzzle of this.currentMapData.puzzles || []) {
      const progress = getPuzzleProgress(this.currentMapData, puzzle);
      if (progress.solved || !puzzle.traps?.some(trap => trap.x === tileX && trap.y === tileY)) continue;
      const key = `${this.currentMapId}:${puzzle.id}`;
      const cooldown = this.trapCooldowns[key] ?? 0;
      if (cooldown > 0) continue;
      this.trapCooldowns[key] = 45;
      this.player.takeDamage(1, tileX * TILE_SIZE + 8, tileY * TILE_SIZE + 8, (x, y) => {
        this.spawnParticles(x, y, 4, '#93c5fd', 'spark');
      });
      this.screenShake = Math.max(this.screenShake, 2);
      this.spawnParticles(tileX * TILE_SIZE + 8, tileY * TILE_SIZE + 8, 5, '#f87171', 'spark');
      this.autoSave();
    }
  }

  public loadMap(mapId: string, targetX: number, targetY: number, targetFacing: Direction = DIR_DOWN) {
    const sourceMap = WORLD_MAPS[mapId];
    if (!sourceMap) {
      console.error(`Cannot load unknown map "${mapId}".`);
      return;
    }
    let mapData = this.runtimeMaps[mapId];
    if (!mapData) {
      const savedProgress = this.savedPuzzleProgress[mapId] || {};
      mapData = {
        ...sourceMap,
        layout: [...sourceMap.layout],
        puzzles: sourceMap.puzzles?.map(puzzle => ({
          ...puzzle,
          levers: puzzle.levers?.map(point => ({ ...point })),
          targets: puzzle.targets?.map(point => ({ ...point })),
          sequence: puzzle.sequence ? [...puzzle.sequence] : undefined,
          block: puzzle.block ? { ...puzzle.block } : undefined,
          plate: puzzle.plate ? { ...puzzle.plate } : undefined,
          barriers: puzzle.barriers.map(point => ({ ...point })),
          gates: puzzle.gates.map(point => ({ ...point })),
          secrets: puzzle.secrets?.map(point => ({ ...point })),
          traps: puzzle.traps?.map(point => ({ ...point })),
          chest: { ...puzzle.chest }
        })),
        puzzleProgress: Object.fromEntries(Object.entries(savedProgress).map(([id, progress]) => [
          id,
          { ...progress, sequence: [...progress.sequence], block: progress.block ? { ...progress.block } : undefined }
        ]))
      };
      for (const puzzle of mapData.puzzles || []) {
        if (getPuzzleProgress(mapData, puzzle).solved) {
          completePuzzle(mapData, puzzle);
          if (getPuzzleProgress(mapData, puzzle).chestClaimed) {
            dialogueManager.recordPuzzleChestClaimed(puzzle.id);
          }
        } else {
          sealPuzzleBarriers(mapData, puzzle);
        }
      }
      this.runtimeMaps[mapId] = mapData;
    }
    this.clearKingConfrontationTimer();

    // Preserve inventory across map loads / death respawns
    const inventory = this.player.captureInventory();

    this.currentMapId = mapId;
    this.currentMapData = mapData;
    this.placeBannerName = mapData.name;
    this.placeBannerTimer = 180;

    this.player.x = targetX;
    this.player.y = targetY;
    this.player.facing = targetFacing;
    this.player.applyInventory(inventory);
    this.syncEquipmentFromQuestProgress();
    this.player.resolveSpawnCollision(mapData);

    this.player.checkpointMapId = mapId;
    this.player.checkpointX = this.player.x;
    this.player.checkpointY = this.player.y;
    this.player.checkpointFacing = targetFacing;

    this.npcs = (mapData.npcs || []).map(d => new NPC(d));
    this.enemies = (mapData.enemies || []).map(d => new Enemy(d));
    this.pickups = [];

    if (mapId === 'capital' && !this.bossActive && dialogueManager.questState < QUEST_STATE.VICTORY_LIBERATION) {
      this.boss = new BossKing(9 * 16, 3 * 16);
      audioManager.stopMusic();
      this.kingConfrontationTimer = window.setTimeout(() => {
        this.kingConfrontationTimer = null;
        if (this.currentMapId !== 'capital' || this.isGameOver || this.isVictory || this.bossActive) return;
        dialogueManager.triggerKingConfrontation(() => this.startBossBattle());
      }, 500);
    } else {
      if (mapData.music) {
        audioManager.startMusic(mapData.music);
      }
    }

    this.updateCamera();
    if (this.isBooted) {
      this.autoSave();
    }
  }

  /** Re-grant story equipment from quest progress so death/save never soft-strip gear. */
  public syncEquipmentFromQuestProgress() {
    if (dialogueManager.questState >= QUEST_STATE.FOUND_HAT_SWORD) {
      this.player.hasSword = true;
    }
    if (dialogueManager.questState >= QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
      this.player.hasShield = true;
      this.player.hasWhetstone = true;
      this.player.swordDamage = Math.max(this.player.swordDamage, 2);
    }
  }

  public startBossBattle() {
    this.bossActive = true;
    audioManager.startMusic('boss');
  }

  public triggerKingDefeated() {
    this.bossActive = false;
    audioManager.stopMusic();
    dialogueManager.triggerVictoryEpilogue(() => {
      this.isVictory = true;
      this.victoryTimer = 0;
    });
  }

  public changeMapWithTransition(mapId: string, targetX: number, targetY: number, targetFacing: Direction) {
    if (this.transitioning) return;
    if (!WORLD_MAPS[mapId]) {
      console.error(`Cannot enter unknown map "${mapId}".`);
      return;
    }
    this.transitioning = true;
    this.fadeDirection = 1;
    this.fadeAlpha = 0;
    this.pendingMapChange = { mapId, targetX, targetY, targetFacing };
  }

  public checkExitTriggers() {
    if (this.transitioning || dialogueManager.isOpen) return;

    // Generous probe so map edges / bridge approaches still fire transitions
    const pb = this.player.getBounds();
    const probe = {
      x: pb.x - 2,
      y: pb.y - 2,
      w: pb.w + 4,
      h: pb.h + 4
    };

    for (const exit of this.currentMapData.exits || []) {
      const t = exit.trigger;
      if (probe.x < t.x + t.w && probe.x + probe.w > t.x && probe.y < t.y + t.h && probe.y + probe.h > t.y) {
        const pushBack = () => {
          const mapW = this.currentMapData.width * TILE_SIZE;
          const mapH = this.currentMapData.height * TILE_SIZE;
          if (t.x > 15 * TILE_SIZE) this.player.x = Math.max(0, this.player.x - TILE_SIZE);
          else if (t.x < 2 * TILE_SIZE) this.player.x = Math.min(mapW - this.player.width, this.player.x + TILE_SIZE);
          else if (t.y < 2 * TILE_SIZE) this.player.y = Math.min(mapH - this.player.height, this.player.y + TILE_SIZE);
          else if (t.y > 10 * TILE_SIZE) this.player.y = Math.max(0, this.player.y - TILE_SIZE);
          // Keep player off rivers / walls after a locked-gate bump
          this.player.resolveSpawnCollision(this.currentMapData);
        };

        if (exit.condition === 'canEnterTown') {
          if (dialogueManager.questState < QUEST_STATE.TALKED_AFTER_SWORD) {
            pushBack();
            dialogueManager.startDialogue([
              { speaker: 'Young Hero', text: exit.lockMessage || "I must return the straw hat to Le Doyen Tobias in Oakhaven first!" }
            ]);
            return;
          }
        } else if (exit.condition === 'canEnterRoute1') {
          if (dialogueManager.questState < QUEST_STATE.ORPHAN_FLOUR_RESOLVED) {
            pushBack();
            dialogueManager.startDialogue([
              { speaker: 'Le Garde de la Garnison', text: exit.lockMessage || "The northern gate to Route 1 is barred! Help Madame Renée recover the orphans' flour first." }
            ]);
            return;
          }
        } else if (exit.condition === 'canEnterHighroad') {
          if (dialogueManager.questState < QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
            pushBack();
            dialogueManager.startDialogue([
              { speaker: 'Maître Pierre', text: exit.lockMessage || "The highroad to the north is perilous without a shield and honed blade!" }
            ]);
            return;
          }
        } else if (exit.condition === 'hasWineIntel') {
          if (dialogueManager.questState < QUEST_STATE.HAS_ROYAL_DECREE_PROOF) {
            pushBack();
            dialogueManager.startDialogue([
              { speaker: 'Le Garde Royal', text: exit.lockMessage || "The imperial gate is barred! Recover the royal decree in La Forêt d'Ombre first." }
            ]);
            return;
          }
        } else if (exit.condition === 'canEnterRoute4') {
          if (dialogueManager.cityStoryQuestProgress['orleans-ledger'] !== 'completed') {
            pushBack();
            dialogueManager.startDialogue([
              { speaker: 'Le Citoyen d’Orléans', text: exit.lockMessage || 'The northern gate stays closed until the civic ledger is returned to the city council.' }
            ]);
            return;
          }
        } else if (exit.condition === 'canEnterRoute5') {
          if (dialogueManager.cityStoryQuestProgress['tours-archive'] !== 'completed') {
            pushBack();
            dialogueManager.startDialogue([
              { speaker: 'Le Moine de Tours', text: exit.lockMessage || 'The northern road stays closed until the chapel archive is reopened.' }
            ]);
            return;
          }
        }

        this.changeMapWithTransition(exit.targetMap, exit.targetX, exit.targetY, exit.targetFacing);
        return;
      }
    }
  }

  public updateCamera() {
    const targetX = this.player.x + this.player.width / 2 - SCREEN_WIDTH / 2;
    const targetY = this.player.y + this.player.height / 2 - SCREEN_HEIGHT / 2;
    const maxCamX = Math.max(0, this.currentMapData.width * TILE_SIZE - SCREEN_WIDTH);
    const maxCamY = Math.max(0, this.currentMapData.height * TILE_SIZE - SCREEN_HEIGHT);
    this.camera.x = Math.max(0, Math.min(maxCamX, Math.floor(targetX)));
    this.camera.y = Math.max(0, Math.min(maxCamY, Math.floor(targetY)));
  }

  public update() {
    this.updateVisualEffects();
    if (this.isPaused) return;

    if (this.transitioning) {
      if (this.fadeDirection === 1) {
        this.fadeAlpha += 0.1;
        if (this.fadeAlpha >= 1) {
          this.fadeAlpha = 1;
          if (this.pendingMapChange) {
            const p = this.pendingMapChange;
            this.loadMap(p.mapId, p.targetX, p.targetY, p.targetFacing);
            this.pendingMapChange = null;
          }
          this.fadeDirection = -1;
        }
      } else if (this.fadeDirection === -1) {
        this.fadeAlpha -= 0.1;
        if (this.fadeAlpha <= 0) {
          this.fadeAlpha = 0;
          this.transitioning = false;
        }
      }
      return;
    }

    if (this.isVictory) {
      this.victoryTimer += 0.05;
      return;
    }

    if (this.player.isDead) {
      if (!this.isGameOver) {
        // Freeze inventory the moment death is confirmed
        this.inventoryAtDeath = this.player.captureInventory();
        this.isGameOver = true;
        if (!this.gameOverJinglePlayed) {
          this.gameOverJinglePlayed = true;
          audioManager.stopMusic();
          audioManager.playGameOverJingle();
        }
      }
      return;
    }

    dialogueManager.update();
    if (dialogueManager.isOpen) return;
    if (this.hitStop > 0) {
      this.hitStop--;
      return;
    }

    // Pass this.npcs to checkNearbyInteraction
    this.player.update(this.keys, this.currentMapData, this.npcs, interactable => {
      this.nearbyInteractable = interactable;
    }, undefined, () => this.autoSave());
    this.checkPuzzleTraps();

    for (const enemy of this.enemies) {
      enemy.update(this.player, (x, y) => {
        this.screenShake = Math.max(this.screenShake, 2);
        this.spawnParticles(x, y, 4, '#93c5fd', 'spark');
      });
      // Quest drops check
      if (enemy.isDead && enemy.isQuestTarget) {
        if (enemy.isQuestTarget === 'flour_bandit' && !this.player.hasFlour) {
          this.player.hasFlour = true;
          audioManager.playItemGet();
        }
        if (enemy.isQuestTarget === 'iron_ore_bandit' && !window.playerHasIronOre) {
          window.playerHasIronOre = true;
          audioManager.playItemGet();
        }
        if (enemy.isQuestTarget === 'royal_convoy_lord' && !this.player.hasRoyalDecree) {
          this.player.hasRoyalDecree = true;
          this.player.hasWineBarrel = true;
          audioManager.playItemGet();
        }
        const cityQuestId: CityStoryQuestId | null =
          enemy.isQuestTarget === 'orleans_ledger_guard' ? 'orleans-ledger'
            : enemy.isQuestTarget === 'tours_archive_guard' ? 'tours-archive'
              : null;
        if (cityQuestId && dialogueManager.markCityStoryQuestReady(cityQuestId)) {
          const item = cityQuestId === 'orleans-ledger' ? 'the civic ledger' : 'the chapel archive key';
          dialogueManager.startDialogue([{ speaker: 'Young Hero', text: `I recovered ${item}. I should return it to its rightful keeper.` }]);
          audioManager.playItemGet();
          this.autoSave();
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.isDead || e.hurtTimer > 0);

    if (this.bossActive && this.boss) {
      this.boss.update(this.player, this.currentMapData, () => this.triggerKingDefeated(), (x, y) => {
        this.screenShake = Math.max(this.screenShake, 2);
        this.spawnParticles(x, y, 5, '#93c5fd', 'spark');
      });
    }

    for (const pickup of this.pickups) {
      pickup.update(this.player);
    }
    this.pickups = this.pickups.filter(p => !p.markedForRemoval);

    this.checkExitTriggers();
    this.updateCamera();
  }

  private updateVisualEffects() {
    if (this.placeBannerTimer > 0 && !dialogueManager.isOpen) this.placeBannerTimer--;

    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life--;
    }
    this.particles = this.particles.filter(particle => particle.life > 0);

    for (const damageText of this.damageTexts) {
      damageText.y += damageText.vy;
      damageText.life--;
    }
    this.damageTexts = this.damageTexts.filter(damageText => damageText.life > 0);

    this.screenShake *= 0.82;
    if (this.screenShake < 0.1) this.screenShake = 0;

    if (this.currentMapId === 'forest' || this.currentMapId === 'village') {
      if (this.ambientTimer > 0) {
        this.ambientTimer--;
      } else {
        this.ambientTimer = 45 + Math.floor(Math.random() * 90);
        const x = this.camera.x + Math.random() * SCREEN_WIDTH;
        const y = this.camera.y + Math.random() * SCREEN_HEIGHT;
        this.particles.push({
          x, y, vx: 0, vy: -0.12, color: '#b8f29b',
          size: 1, life: 36, maxLife: 36, type: 'firefly'
        });
      }
    }
  }

  public tryAgainFromCheckpoint() {
    this.releaseInputs();
    this.isGameOver = false;
    this.gameOverJinglePlayed = false;
    this.bossActive = false;
    this.boss = null;
    this.player.isDead = false;
    this.player.hearts = this.player.maxHearts;
    this.player.invulnerableTimer = 90;
    this.player.isAttacking = false;
    this.player.attackTimer = 0;
    this.player.attackCooldown = 0;
    this.player.isDashing = false;
    this.player.dashTimer = 0;
    this.player.dashCooldown = 0;
    this.player.isSpinning = false;
    this.player.spinTimer = 0;
    this.player.isCharged = false;
    this.player.chargeTimer = 0;
    this.player.isBlocking = false;
    this.player.knockbackX = 0;
    this.player.knockbackY = 0;
    this.player.afterimages = [];
    this.player.walkAnimTimer = 0;
    this.player.walkFrame = 0;

    // Restore exact pre-death inventory, then re-sync from quest flags as a safety net
    if (this.inventoryAtDeath) {
      this.player.applyInventory(this.inventoryAtDeath);
    }
    this.syncEquipmentFromQuestProgress();
    this.inventoryAtDeath = null;

    const mapId = this.player.checkpointMapId || 'village';
    const x = this.player.checkpointX ?? 8 * 16;
    const y = this.player.checkpointY ?? 7 * 16;
    const facing = this.player.checkpointFacing ?? DIR_DOWN;

    this.loadMap(mapId, x, y, facing);
    const mapData = WORLD_MAPS[mapId];
    if (mapData && mapData.music) {
      audioManager.startMusic(mapData.music);
    }
  }

  public restartGame() {
    this.clearKingConfrontationTimer();
    dialogueManager.cancel();
    this.releaseInputs();
    this.transitioning = false;
    this.fadeAlpha = 0;
    this.fadeDirection = 0;
    this.pendingMapChange = null;
    this.nearbyInteractable = null;
    this.hitStop = 0;
    this.screenShake = 0;
    this.particles = [];
    this.damageTexts = [];
    this.isGameOver = false;
    this.isVictory = false;
    this.victoryTimer = 0;
    this.bossActive = false;
    this.boss = null;
    this.inventoryAtDeath = null;
    this.player.isDead = false;
    this.player.hearts = this.player.maxHearts;
    this.player.invulnerableTimer = 0;
    this.player.isAttacking = false;
    this.player.attackTimer = 0;
    this.player.attackCooldown = 0;
    this.player.isBlocking = false;
    this.player.isDashing = false;
    this.player.dashTimer = 0;
    this.player.dashCooldown = 0;
    this.player.isSpinning = false;
    this.player.spinTimer = 0;
    this.player.isCharged = false;
    this.player.chargeTimer = 0;
    this.player.knockbackX = 0;
    this.player.knockbackY = 0;
    this.player.afterimages = [];
    this.player.walkAnimTimer = 0;
    this.player.walkFrame = 0;
    this.player.applyInventory({
      hasSword: false,
      hasHat: false,
      hasMap: false,
      hasShield: false,
      hasWhetstone: false,
      hasFlour: false,
      hasWineBarrel: false,
      hasRoyalDecree: false,
      swordDamage: 1,
      coins: 0
    });
    window.playerHasIronOre = false;
    dialogueManager.questState = QUEST_STATE.NOT_STARTED;
    dialogueManager.resetSideQuests();
    dialogueManager.resetCityStoryQuests();
    dialogueManager.syncQuestLog();

    this.removeSavedGame();
    this.savedPuzzleProgress = {};
    for (const mapId of Object.keys(this.runtimeMaps)) delete this.runtimeMaps[mapId];
    for (const key of Object.keys(this.trapCooldowns)) delete this.trapCooldowns[key];
    this.loadMap('village', 8 * 16 + WORLD_MAP_OFFSET, 7 * 16 + WORLD_MAP_OFFSET, DIR_DOWN);
  }

  private removeSavedGame() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (error) {
      console.warn('Unable to remove the saved game from browser storage.', error);
    }
  }

  public autoSave() {
    try {
      const data = {
        worldMapVersion: SAVE_WORLD_VERSION,
        mapId: this.currentMapId,
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        hearts: this.player.hearts,
        coins: this.player.coins,
        hasSword: this.player.hasSword,
        hasHat: this.player.hasHat,
        hasMap: this.player.hasMap,
        hasShield: this.player.hasShield,
        hasWhetstone: this.player.hasWhetstone,
        hasFlour: this.player.hasFlour,
        hasWineBarrel: this.player.hasWineBarrel,
        hasRoyalDecree: this.player.hasRoyalDecree,
        swordDamage: this.player.swordDamage,
        questState: dialogueManager.questState,
        sideQuestProgress: dialogueManager.sideQuestProgress,
        cityStoryQuestProgress: dialogueManager.cityStoryQuestProgress,
        playerHasIronOre: window.playerHasIronOre,
        puzzleProgress: this.getSavedPuzzleProgress()
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Unable to save the game to browser storage.', error);
    }
  }

  public loadSavedGame(): boolean {
    let raw: string | null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (error) {
      console.warn('Unable to read the saved game from browser storage.', error);
      return false;
    }
    if (!raw) return false;

    try {
      const savedData: unknown = JSON.parse(raw);
      if (!isGameSaveData(savedData)) {
        throw new Error('The saved game has an unsupported or invalid format.');
      }
      const data = savedData;
      this.savedPuzzleProgress = data.puzzleProgress ?? {};
      this.player.hearts = Math.min(this.player.maxHearts, Math.max(1, data.hearts ?? this.player.maxHearts));
      this.player.applyInventory({
        hasSword: data.hasSword === true,
        hasHat: data.hasHat === true,
        hasMap: data.hasMap === true,
        hasShield: data.hasShield === true,
        hasWhetstone: data.hasWhetstone === true,
        hasFlour: data.hasFlour === true,
        hasWineBarrel: data.hasWineBarrel === true,
        hasRoyalDecree: data.hasRoyalDecree === true,
        swordDamage: data.swordDamage ?? 1,
        coins: data.coins ?? 0
      });
      dialogueManager.questState = data.questState ?? QUEST_STATE.NOT_STARTED;
      dialogueManager.sideQuestProgress = data.sideQuestProgress ?? {};
      dialogueManager.cityStoryQuestProgress = data.cityStoryQuestProgress ?? {};
      dialogueManager.syncQuestLog();
      window.playerHasIronOre = data.playerHasIronOre === true;
      this.syncEquipmentFromQuestProgress();

      const savedMapOffset = data.worldMapVersion === undefined && isExpandedWorldMap(data.mapId)
        ? WORLD_MAP_OFFSET
        : 0;
      this.loadMap(data.mapId, data.x + savedMapOffset, data.y + savedMapOffset, data.facing);
      return true;
    } catch (error) {
      console.warn('The saved game could not be loaded. Starting a new adventure.', error);
      this.removeSavedGame();
      return false;
    }
  }

  private getSavedPuzzleProgress(): Record<string, Record<string, PuzzleProgress>> {
    const saved: Record<string, Record<string, PuzzleProgress>> = {};
    for (const [mapId, mapData] of Object.entries(this.runtimeMaps)) {
      const mapProgress: Record<string, PuzzleProgress> = {};
      for (const puzzle of mapData.puzzles || []) {
        const progress = getPuzzleProgress(mapData, puzzle);
        mapProgress[puzzle.id] = {
          ...progress,
          sequence: [...progress.sequence],
          block: progress.block ? { ...progress.block } : undefined
        };
      }
      saved[mapId] = mapProgress;
    }
    return saved;
  }

  public render() {
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.save();
    const shakeX = this.screenShake ? (Math.random() * 2 - 1) * this.screenShake : 0;
    const shakeY = this.screenShake ? (Math.random() * 2 - 1) * this.screenShake : 0;
    this.ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

    this.renderMapTiles();
    this.renderPuzzleProps();

    if (this.currentMapData.altar) {
      const a = this.currentMapData.altar;
      if (a.active && dialogueManager.questState < QUEST_STATE.FOUND_HAT_SWORD) {
        spriteManager.draw(this.ctx, 'item_sword_shrine', a.x, a.y);
      } else {
        spriteManager.draw(this.ctx, 'tile_cobble', a.x, a.y);
      }
    }

    this.renderDepthSortedActors();
    this.renderVisualEffects();

    this.ctx.restore();

    this.renderHUD();
    dialogueManager.draw(this.ctx, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.renderPlaceBanner();

    if (this.fadeAlpha > 0) {
      this.ctx.fillStyle = `rgba(8, 10, 16, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    if (this.isGameOver) this.renderGameOver();
    if (this.isVictory) this.renderVictory();
  }

  private renderPlaceBanner() {
    if (this.placeBannerTimer <= 0 || !this.placeBannerName || dialogueManager.isOpen) return;

    const remaining = this.placeBannerTimer;
    const entrance = Math.min(1, (180 - remaining) / 8);
    const fade = Math.min(1, remaining / 14);
    this.ctx.save();
    this.ctx.font = 'bold 7px monospace';
    const width = Math.min(224, Math.max(92, Math.ceil(this.ctx.measureText(this.placeBannerName).width + 28)));
    const x = Math.floor((SCREEN_WIDTH - width) / 2);
    const y = Math.floor(8 - (1 - entrance) * 5);

    this.ctx.globalAlpha = fade;
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(x, y, width, 19);
    this.ctx.fillStyle = '#493018';
    this.ctx.fillRect(x + 2, y + 2, width - 4, 15);
    this.ctx.fillStyle = '#d9ad54';
    this.ctx.fillRect(x + 3, y + 2, width - 6, 1);
    this.ctx.fillRect(x + 3, y + 16, width - 6, 1);
    this.ctx.fillStyle = '#f6e5ad';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.placeBannerName, SCREEN_WIDTH / 2, y + 10, width - 16);
    this.ctx.restore();
  }

  private renderVisualEffects() {
    for (const particle of this.particles) {
      const fade = Math.min(1, particle.life / Math.max(1, particle.maxLife));
      this.ctx.globalAlpha = particle.type === 'firefly'
        ? fade * (0.45 + 0.55 * Math.sin(Date.now() / 90 + particle.x))
        : fade;
      this.ctx.fillStyle = particle.color;
      const x = Math.round(particle.x);
      const y = Math.round(particle.y);
      if (particle.type === 'spark') {
        this.ctx.fillRect(x - 1, y, particle.size + 2, 1);
        this.ctx.fillRect(x, y - 1, 1, particle.size + 2);
      } else {
        this.ctx.fillRect(x, y, particle.size, particle.size);
      }
    }

    this.ctx.globalAlpha = 1;
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 7px monospace';
    for (const damageText of this.damageTexts) {
      this.ctx.globalAlpha = Math.min(1, damageText.life / Math.max(1, damageText.maxLife));
      this.ctx.fillStyle = '#080a10';
      this.ctx.fillText(damageText.text, damageText.x + 1, damageText.y + 1);
      this.ctx.fillStyle = damageText.color;
      this.ctx.fillText(damageText.text, damageText.x, damageText.y);
    }
    this.ctx.globalAlpha = 1;
    this.ctx.textAlign = 'start';
  }

  private renderMapTiles() {
    const layout = this.currentMapData.layout;
    if (!layout || layout.length === 0) return;
    const terrainTheme = this.getTerrainTheme();

    const startCol = Math.max(0, Math.floor(this.camera.x / TILE_SIZE));
    const endCol = Math.min(this.currentMapData.width - 1, Math.ceil((this.camera.x + SCREEN_WIDTH) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(this.camera.y / TILE_SIZE));
    const endRow = Math.min(this.currentMapData.height - 1, Math.ceil((this.camera.y + SCREEN_HEIGHT) / TILE_SIZE));

    for (let r = startRow; r <= endRow; r++) {
      const rowStr = layout[r];
      if (!rowStr) continue;
      for (let c = startCol; c <= endCol; c++) {
        const char = rowStr[c] || '.';
        const def = TILE_DEFS[char] || TILE_DEFS['.'];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const grassVariant = (c + r) % 2 === 0 ? 'tile_grass' : 'tile_grass_alt';

        if (char === 'T' || char === 'H' || char === 'S' || char === 'G') {
          spriteManager.draw(this.ctx, grassVariant, x, y);
        }

        if (char === 'T') {
          spriteManager.drawShadow(this.ctx, x + 8, y + 15, 15);
        }

        if (def && def.sprite) {
          const leftWater = rowStr[c - 1] === 'W';
          const rightWater = rowStr[c + 1] === 'W';
          const isBridgeDeck = (char === 'C' || char === 'D') && (leftWater || rightWater);
          const baseSprite = char === 'W'
            ? `tile_water_${Math.floor(Date.now() / 350) % 3}`
            : isBridgeDeck ? 'tile_bridge'
              : def.sprite === 'tile_grass' ? grassVariant : def.sprite;
          const regionalSprite = `tile_${terrainTheme}_${baseSprite.slice('tile_'.length)}`;
          const sprite = spriteManager.sprites[regionalSprite] ? regionalSprite : baseSprite;
          spriteManager.draw(this.ctx, sprite, x, y);

          if (isBridgeDeck) {
            this.ctx.fillStyle = '#361b07';
            this.ctx.fillRect(x + (leftWater ? 0 : TILE_SIZE - 2), y, 2, TILE_SIZE);
            this.ctx.fillStyle = '#8a5228';
            this.ctx.fillRect(x + (leftWater ? 1 : TILE_SIZE - 3), y, 1, TILE_SIZE);
            this.ctx.fillStyle = '#d8a460';
            for (let postY = y + 2; postY < y + TILE_SIZE; postY += 6) {
              this.ctx.fillRect(x + (leftWater ? 0 : TILE_SIZE - 2), postY, 2, 2);
            }
          }
        }

        if (char === 'D') {
          const grassNeighbors = [
            rowStr[c - 1],
            rowStr[c + 1],
            layout[r - 1]?.[c],
            layout[r + 1]?.[c]
          ];
          this.ctx.fillStyle = '#78481c';
          if (grassNeighbors[0] === '.') {
            for (let edgeY = 1; edgeY < TILE_SIZE; edgeY += 4) this.ctx.fillRect(x, y + edgeY, 1, 2);
          }
          if (grassNeighbors[1] === '.') {
            for (let edgeY = 3; edgeY < TILE_SIZE; edgeY += 4) this.ctx.fillRect(x + TILE_SIZE - 1, y + edgeY, 1, 2);
          }
          if (grassNeighbors[2] === '.') {
            for (let edgeX = 1; edgeX < TILE_SIZE; edgeX += 4) this.ctx.fillRect(x + edgeX, y, 2, 1);
          }
          if (grassNeighbors[3] === '.') {
            for (let edgeX = 3; edgeX < TILE_SIZE; edgeX += 4) this.ctx.fillRect(x + edgeX, y + TILE_SIZE - 1, 2, 1);
          }
        }

        if (char === 'W') {
          const rowAbove = layout[r - 1];
          const rowBelow = layout[r + 1];
          this.ctx.fillStyle = '#123b73';
          if (rowStr[c - 1] !== 'W') this.ctx.fillRect(x, y, 1, TILE_SIZE);
          if (rowStr[c + 1] !== 'W') this.ctx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
          if (rowAbove?.[c] !== 'W') this.ctx.fillRect(x, y, TILE_SIZE, 1);
          if (rowBelow?.[c] !== 'W') this.ctx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
          if ((c * 7 + r * 3) % 5 === 0 && Math.floor(Date.now() / 120) % 3 === 0) {
            this.ctx.fillStyle = '#d4f4ff';
            this.ctx.fillRect(x + 5, y + 6, 1, 1);
          }
        }

      }
    }
  }

  private renderPuzzleProps() {
    for (const puzzle of this.currentMapData.puzzles || []) {
      const progress = getPuzzleProgress(this.currentMapData, puzzle);
      const cell = (point: Point) => ({ x: point.x * TILE_SIZE, y: point.y * TILE_SIZE });
      if (!progress.solved) {
        for (const gate of puzzle.gates) {
          const { x, y } = cell(gate);
          this.ctx.fillStyle = '#38291f';
          this.ctx.fillRect(x + 2, y + 1, 12, 14);
          this.ctx.fillStyle = '#c49a54';
          this.ctx.fillRect(x + 4, y + 2, 2, 12);
          this.ctx.fillRect(x + 9, y + 2, 2, 12);
          this.ctx.fillRect(x + 3, y + 5, 10, 2);
          this.ctx.fillRect(x + 3, y + 10, 10, 2);
        }
        for (const trap of puzzle.traps || []) {
          const { x, y } = cell(trap);
          this.ctx.fillStyle = '#7f1d1d';
          this.ctx.fillRect(x + 2, y + 11, 12, 3);
          this.ctx.fillStyle = '#ef4444';
          for (let spike = 0; spike < 3; spike++) {
            this.ctx.fillRect(x + 4 + spike * 4, y + 8, 2, 4);
          }
        }
      }

      for (let index = 0; index < (puzzle.levers || []).length; index++) {
        const lever = puzzle.levers?.[index];
        if (!lever) continue;
        const { x, y } = cell(lever);
        const activated = progress.sequence.includes(index);
        const leverColor = activated ? '#4ade80' : '#f2c66d';
        this.ctx.fillStyle = '#38291f';
        this.ctx.fillRect(x + 2, y + 12, 12, 3);
        this.ctx.fillStyle = '#c49a54';
        this.ctx.fillRect(x + 3, y + 11, 10, 2);
        this.ctx.fillStyle = '#38291f';
        this.ctx.fillRect(x + 6, y + 3, 5, 9);
        this.ctx.fillStyle = leverColor;
        this.ctx.fillRect(x + 7, y + 4, 3, 7);
        this.ctx.fillStyle = '#38291f';
        this.ctx.fillRect(x + 3, y + 2, 8, 3);
        this.ctx.fillStyle = leverColor;
        this.ctx.fillRect(x + 4, y + 2, 6, 2);
      }

      for (let index = 0; index < (puzzle.targets || []).length; index++) {
        const target = puzzle.targets?.[index];
        if (!target) continue;
        const { x, y } = cell(target);
        const activated = progress.solved || progress.sequence.includes(index);
        this.ctx.fillStyle = '#5b211e';
        this.ctx.fillRect(x + 3, y + 3, 10, 10);
        this.ctx.fillStyle = activated ? '#4ade80' : '#ef4444';
        this.ctx.fillRect(x + 6, y + 6, 4, 4);
        this.ctx.fillStyle = '#fde68a';
        this.ctx.fillRect(x + 7, y + 4, 2, 8);
        this.ctx.fillRect(x + 4, y + 7, 8, 2);
      }

      if (puzzle.plate) {
        const { x, y } = cell(puzzle.plate);
        this.ctx.fillStyle = progress.solved ? '#4ade80' : '#8b6b35';
        this.ctx.fillRect(x + 2, y + 12, 12, 2);
        this.ctx.fillRect(x + 3, y + 10, 10, 2);
      }

      if (progress.block) {
        const { x, y } = cell(progress.block);
        this.ctx.fillStyle = '#50351f';
        this.ctx.fillRect(x + 1, y + 2, 14, 13);
        this.ctx.fillStyle = '#a8753c';
        this.ctx.fillRect(x + 3, y + 4, 10, 9);
        this.ctx.fillStyle = '#e0b56d';
        this.ctx.fillRect(x + 5, y + 6, 6, 2);
        this.ctx.fillRect(x + 5, y + 10, 6, 1);
      }

      if (progress.solved) {
        const { x, y } = cell(puzzle.chest);
        this.ctx.fillStyle = progress.chestClaimed ? '#6b4d2d' : '#8a4b20';
        this.ctx.fillRect(x + 2, y + 7, 12, 7);
        this.ctx.fillStyle = progress.chestClaimed ? '#9a713e' : '#d7a643';
        this.ctx.fillRect(x + 2, y + 5, 12, 4);
        this.ctx.fillStyle = '#f5d477';
        this.ctx.fillRect(x + 7, y + 8, 2, 3);
      }
    }
  }

  private getTerrainTheme(): 'pastoral' | 'woodland' | 'road' | 'town' | 'riverTown' | 'market' | 'cathedral' | 'vineyardTown' | 'royal' {
    const mapId = this.currentMapId;
    if (mapId === 'forest') return 'woodland';
    if (mapId.startsWith('route')) return 'road';
    if (mapId === 'royalRoad' || mapId === 'capital') return 'royal';
    if (mapId === 'village' || mapId.startsWith('oakhaven_')) return 'pastoral';
    if (mapId === 'aiguemorte') return 'riverTown';
    if (mapId === 'val_de_loire' || mapId === 'orleans') return 'market';
    if (mapId === 'tours') return 'cathedral';
    if (mapId === 'dijon') return 'vineyardTown';
    return 'town';
  }

  private renderDepthSortedActors() {
    const layout = this.currentMapData.layout;
    const startCol = Math.max(0, Math.floor(this.camera.x / TILE_SIZE));
    const endCol = Math.min(this.currentMapData.width - 1, Math.ceil((this.camera.x + SCREEN_WIDTH) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(this.camera.y / TILE_SIZE));
    const endRow = Math.min(this.currentMapData.height - 1, Math.ceil((this.camera.y + SCREEN_HEIGHT) / TILE_SIZE));
    const renderQueue: Array<{ depth: number; draw: () => void }> = [];

    for (let r = startRow; r <= endRow; r++) {
      const row = layout[r];
      if (!row) continue;
      for (let c = startCol; c <= endCol; c++) {
        const def = TILE_DEFS[row[c] || '.'];
        if (def?.topSprite) {
          const topSprite = def.topSprite;
          renderQueue.push({
            depth: r * TILE_SIZE + 8,
            draw: () => spriteManager.draw(this.ctx, topSprite, c * TILE_SIZE, (r - 1) * TILE_SIZE)
          });
        }
      }
    }

    for (const pickup of this.pickups) {
      renderQueue.push({ depth: pickup.y + pickup.height, draw: () => pickup.draw(this.ctx) });
    }
    for (const npc of this.npcs) {
      renderQueue.push({ depth: npc.y + npc.height, draw: () => npc.draw(this.ctx) });
    }
    for (const enemy of this.enemies) {
      renderQueue.push({ depth: enemy.y + enemy.height, draw: () => enemy.draw(this.ctx) });
    }
    if (this.boss && (this.bossActive || this.currentMapId === 'capital')) {
      const boss = this.boss;
      renderQueue.push({ depth: boss.y + boss.height, draw: () => boss.draw(this.ctx) });
    }
    renderQueue.push({ depth: this.player.y + this.player.height, draw: () => this.player.draw(this.ctx) });

    renderQueue.sort((a, b) => a.depth - b.depth);
    for (const item of renderQueue) item.draw();
  }

  private renderHUD() {
    const inventoryItems = [
      this.player.hasHat && dialogueManager.questState < QUEST_STATE.TALKED_AFTER_SWORD,
      this.player.hasSword,
      this.player.hasMap,
      this.player.hasShield,
      this.player.hasFlour && dialogueManager.questState < QUEST_STATE.ORPHAN_FLOUR_RESOLVED,
      this.player.hasRoyalDecree && dialogueManager.questState < QUEST_STATE.HAS_ROYAL_DECREE_PROOF
    ].filter(Boolean).length;
    this.ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
    this.ctx.fillRect(1, 1, Math.max(56, 61 + inventoryItems * 15), 29);
    const heartSpacing = 9;
    for (let i = 0; i < this.player.maxHearts; i++) {
      const sprite = i < this.player.hearts ? 'hud_heart_full' : 'hud_heart_empty';
      this.ctx.globalAlpha = this.player.hearts === 1 && i === 0 && Math.floor(Date.now() / 180) % 2 === 0 ? 0.4 : 1;
      spriteManager.draw(this.ctx, sprite, 4 + i * heartSpacing, 4);
    }
    this.ctx.globalAlpha = 1;

    let invX = 61;
    if (this.player.hasHat && dialogueManager.questState < QUEST_STATE.TALKED_AFTER_SWORD) {
      spriteManager.draw(this.ctx, 'item_hat', invX, 2);
      invX += 15;
    }
    if (this.player.hasSword) {
      spriteManager.draw(this.ctx, this.player.hasWhetstone ? 'item_sword_upgraded' : 'item_sword', invX, 2);
      invX += 15;
    }
    if (this.player.hasMap) {
      spriteManager.draw(this.ctx, 'item_map', invX, 2);
      invX += 15;
    }
    if (this.player.hasShield) {
      spriteManager.draw(this.ctx, 'item_shield', invX, 2);
      invX += 15;
    }
    if (this.player.hasFlour && dialogueManager.questState < QUEST_STATE.ORPHAN_FLOUR_RESOLVED) {
      spriteManager.draw(this.ctx, 'item_flour', invX, 2);
      invX += 15;
    }
    if (this.player.hasRoyalDecree && dialogueManager.questState < QUEST_STATE.HAS_ROYAL_DECREE_PROOF) {
      spriteManager.draw(this.ctx, 'item_decree', invX, 2);
    }

    spriteManager.draw(this.ctx, 'item_coin', 1, 15);
    this.ctx.fillStyle = '#ffe454';
    this.ctx.font = 'bold 7px sans-serif';
    this.ctx.fillText(String(this.player.coins), 17, 26);

    if (this.nearbyInteractable && !dialogueManager.isOpen) {
      const bx = Math.max(11, Math.min(SCREEN_WIDTH - 11, this.player.x + 6 - this.camera.x));
      const spriteTop = this.player.y + this.player.spriteOffset.y - this.camera.y;
      const by = Math.max(13, spriteTop - 13);
      const prompt = this.nearbyInteractable.type === 'door'
        ? 'E ENTER'
        : this.nearbyInteractable.type === 'puzzle-lever'
          ? 'E PULL'
          : this.nearbyInteractable.type === 'puzzle-target'
            ? 'ATTACK'
            : this.nearbyInteractable.type === 'puzzle-block'
              ? 'PUSH'
            : this.nearbyInteractable.type === 'puzzle-chest'
              ? 'E OPEN'
        : this.nearbyInteractable.type === 'altar' && !this.player.hasSword
          ? 'E TAKE'
          : 'E TALK';
      const promptWidth = prompt.length * 5 + 6;
      this.ctx.fillStyle = '#101a2b';
      this.ctx.fillRect(bx - promptWidth / 2, by - 1, promptWidth, 11);
      this.ctx.strokeStyle = '#e8c66a';
      this.ctx.strokeRect(bx - promptWidth / 2 - 0.5, by - 1.5, promptWidth + 1, 12);
      this.ctx.fillStyle = '#fff2bd';
      this.ctx.font = 'bold 7px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(prompt, bx, by + 7);
      this.ctx.textAlign = 'start';
      if (this.nearbyInteractable.hint) {
        this.ctx.fillStyle = 'rgba(8, 10, 16, 0.8)';
        this.ctx.fillRect(2, SCREEN_HEIGHT - 10, SCREEN_WIDTH - 4, 8);
        this.ctx.fillStyle = '#fff2bd';
        this.ctx.font = '6px sans-serif';
        this.ctx.fillText(`Hint: ${this.nearbyInteractable.hint}`, 5, SCREEN_HEIGHT - 4, SCREEN_WIDTH - 10);
      }
    }
  }

  private renderGameOver() {
    this.ctx.fillStyle = 'rgba(8, 10, 16, 0.92)';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = '#0c1421';
    this.ctx.fillRect(20, 28, SCREEN_WIDTH - 40, 104);
    this.ctx.strokeStyle = '#080a10';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(20, 28, SCREEN_WIDTH - 40, 104);
    this.ctx.strokeStyle = '#c8a45c';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(23, 31, SCREEN_WIDTH - 46, 98);
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#c82838';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, 56);
    this.ctx.fillStyle = '#fff2bd';
    this.ctx.font = 'bold 8px sans-serif';
    this.ctx.fillText('T  TRY AGAIN', SCREEN_WIDTH / 2, 84);
    this.ctx.fillText('M  RESTART ADVENTURE', SCREEN_WIDTH / 2, 103);
    this.ctx.textAlign = 'start';
  }

  private renderVictory() {
    this.ctx.fillStyle = 'rgba(18, 24, 44, 0.94)';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = '#111d31';
    this.ctx.fillRect(12, 20, SCREEN_WIDTH - 24, 120);
    this.ctx.strokeStyle = '#080a10';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(12, 20, SCREEN_WIDTH - 24, 120);
    this.ctx.strokeStyle = '#e8c66a';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(15, 23, SCREEN_WIDTH - 30, 114);
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffe454';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillText('LIBERATION!', SCREEN_WIDTH / 2, 44);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 8px sans-serif';
    this.ctx.fillText('The Kingdom of Aethelgard is free!', SCREEN_WIDTH / 2, 73);
    this.ctx.fillText('Protector of the Realm and its People', SCREEN_WIDTH / 2, 91);
    this.ctx.fillStyle = '#90a8c4';
    this.ctx.fillText('SPACE / A  RESTART', SCREEN_WIDTH / 2, 119);
    this.ctx.textAlign = 'start';
  }

  public start() {
    if (this.animationFrameId !== null) return;
    const loop = () => {
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private clearKingConfrontationTimer() {
    if (this.kingConfrontationTimer === null) return;
    window.clearTimeout(this.kingConfrontationTimer);
    this.kingConfrontationTimer = null;
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clearKingConfrontationTimer();
    if (this.enemyDropListener) {
      window.removeEventListener('enemyDrop', this.enemyDropListener);
      this.enemyDropListener = null;
    }
    if (dialogueManager.onCloseCallback === this.saveAfterDialogue) {
      dialogueManager.onCloseCallback = null;
    }
  }
}

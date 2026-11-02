/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bounds, DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UP, Direction, DoorData, EnemyData, MapData, NPCData, TILE_SIZE } from '../types/game';
import { audioManager } from './audio';
import { TILE_DEFS, WORLD_MAP_OFFSET } from './maps';
import { completePuzzle, getPuzzleProgress } from './puzzles';
import { spriteManager } from './sprites';

function drawHitSparks(ctx: CanvasRenderingContext2D, x: number, y: number, timer: number, duration: number) {
  const elapsed = duration - timer;
  if (elapsed < 0 || elapsed > 9) return;

  const sparks = [
    { x: -5, y: -3, dx: -0.45, dy: -0.35 },
    { x: 4, y: -5, dx: 0.4, dy: -0.4 },
    { x: 6, y: 2, dx: 0.5, dy: 0.15 },
    { x: -4, y: 5, dx: -0.35, dy: 0.35 }
  ];

  ctx.save();
  for (const spark of sparks) {
    const sparkX = Math.round(x + spark.x + spark.dx * elapsed);
    const sparkY = Math.round(y + spark.y + spark.dy * elapsed);
    ctx.fillStyle = elapsed % 4 < 2 ? '#fbbf24' : '#f97316';
    ctx.fillRect(sparkX, sparkY, 2, 2);
    if (elapsed < 4) {
      ctx.fillStyle = '#fff1b8';
      ctx.fillRect(sparkX, sparkY, 1, 1);
    }
  }
  ctx.restore();
}

export class Entity {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public markedForRemoval: boolean = false;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public getBounds(): Bounds {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  public collidesWith(other: Bounds): boolean {
    return (
      this.x < other.x + other.w &&
      this.x + this.width > other.x &&
      this.y < other.y + other.h &&
      this.y + this.height > other.y
    );
  }
}

export interface PlayerInventory {
  hasSword: boolean;
  hasHat: boolean;
  hasMap: boolean;
  hasShield: boolean;
  hasWhetstone: boolean;
  hasFlour: boolean;
  hasWineBarrel: boolean;
  hasRoyalDecree: boolean;
  swordDamage: number;
  coins: number;
}

export interface NearbyInteractable {
  type: 'npc' | 'altar' | 'sign' | 'door' | 'puzzle-lever' | 'puzzle-target' | 'puzzle-block' | 'puzzle-chest';
  entity?: NPC;
  text?: string;
  door?: DoorData;
  puzzleId?: string;
  elementIndex?: number;
  hint?: string;
}

export class Player extends Entity {
  public spriteOffset = { x: -6, y: -14 };
  public baseSpeed = 1.4;
  public facing: Direction = DIR_DOWN;
  public walkAnimTimer = 0;
  public walkFrame = 0;
  public isMoving = false;

  // Inventory & Upgrades
  public hasSword = false;
  public hasHat = false;
  public hasMap = false;
  public hasShield = false;
  public hasWhetstone = false;
  public hasFlour = false;
  public hasWineBarrel = false;
  public hasRoyalDecree = false;
  public swordDamage = 1;

  // Combat States
  public isAttacking = false;
  public attackTimer = 0;
  public attackCooldown = 0;
  public isBlocking = false;

  // GBA Pegasus Dash
  public isDashing = false;
  public dashTimer = 0;
  public dashCooldown = 0;
  public dashDx = 0;
  public dashDy = 0;
  public afterimages: { x: number; y: number; facing: Direction; alpha: number }[] = [];

  // GBA Charged Spin Attack
  public isSpinning = false;
  public spinTimer = 0;
  public chargeTimer = 0;
  public isCharged = false;

  // Health & Stats
  public maxHearts = 4;
  public hearts = 4;
  public invulnerableTimer = 0;
  public isDead = false;
  public coins = 0;

  // Checkpoints
  public checkpointMapId = 'village';
  public checkpointX = 8 * 16 + WORLD_MAP_OFFSET;
  public checkpointY = 7 * 16 + WORLD_MAP_OFFSET;
  public checkpointFacing: Direction = DIR_DOWN;
  public knockbackX = 0;
  public knockbackY = 0;

  constructor(x: number, y: number) {
    super(x, y, 12, 10);
  }

  public captureInventory(): PlayerInventory {
    return {
      hasSword: this.hasSword,
      hasHat: this.hasHat,
      hasMap: this.hasMap,
      hasShield: this.hasShield,
      hasWhetstone: this.hasWhetstone,
      hasFlour: this.hasFlour,
      hasWineBarrel: this.hasWineBarrel,
      hasRoyalDecree: this.hasRoyalDecree,
      swordDamage: this.swordDamage,
      coins: this.coins
    };
  }

  public applyInventory(inv: PlayerInventory) {
    this.hasSword = inv.hasSword;
    this.hasHat = inv.hasHat;
    this.hasMap = inv.hasMap;
    this.hasShield = inv.hasShield;
    this.hasWhetstone = inv.hasWhetstone;
    this.hasFlour = inv.hasFlour;
    this.hasWineBarrel = inv.hasWineBarrel;
    this.hasRoyalDecree = inv.hasRoyalDecree;
    this.swordDamage = inv.swordDamage;
    this.coins = inv.coins;
  }

  /** Idle / walk / dash sprite that always reflects equipped sword & shield. */
  public getEquippedBodySprite(facing: Direction = this.facing, frame = 0): string {
    const dirs = ['down', 'up', 'left', 'right'];
    const dirStr = dirs[facing] ?? 'down';
    const fi = Math.max(0, Math.min(2, frame));
    if (this.hasSword || this.hasShield) return `player_equipped_${dirStr}_${fi}`;
    return `player_${dirStr}_${fi}`;
  }

  public getBlockSprite(): string {
    if (this.hasSword) return `player_shield_sword_${this.facing}`;
    return `player_shield_${this.facing}`;
  }

  public update(
    keys: { up: boolean; down: boolean; left: boolean; right: boolean; shield: boolean; attack?: boolean },
    mapData: MapData,
    npcs: NPC[],
    onNearbyCheck: (interactable: NearbyInteractable | null) => void,
    onDust?: (x: number, y: number) => void,
    onPuzzleChanged?: () => void
  ) {
    if (this.isDead) return;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;

    // Update afterimages
    for (const ai of this.afterimages) {
      ai.alpha -= 0.1;
    }
    this.afterimages = this.afterimages.filter(ai => ai.alpha > 0);

    // Charge sword if holding attack and has sword
    if (this.hasSword && keys.attack && !this.isAttacking && !this.isSpinning && !this.isBlocking && !this.isDashing) {
      this.chargeTimer++;
      if (this.chargeTimer === 28) {
        audioManager.playChargeHold();
        this.isCharged = true;
      }
    }

    // Handle Dash movement
    if (this.isDashing) {
      this.dashTimer--;
      const speed = this.baseSpeed * 2.3;
      this.moveWithCollision(this.dashDx * speed, this.dashDy * speed, mapData, onPuzzleChanged);

      if (this.dashTimer % 2 === 0) {
        this.afterimages.push({
          x: Math.floor(this.x + this.spriteOffset.x),
          y: Math.floor(this.y + this.spriteOffset.y),
          facing: this.facing,
          alpha: 0.6
        });
        if (onDust) onDust(this.x + 6, this.y + 10);
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
      return;
    }

    // Handle Spin Attack
    if (this.isSpinning) {
      this.spinTimer--;
      if (this.spinTimer <= 0) {
        this.isSpinning = false;
      }
      return;
    }

    this.isBlocking = Boolean(this.hasShield && keys.shield && !this.isAttacking);

    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
      return;
    }

    // Knockback dampening
    if (Math.abs(this.knockbackX) > 0.1 || Math.abs(this.knockbackY) > 0.1) {
      this.moveWithCollision(this.knockbackX, this.knockbackY, mapData, onPuzzleChanged);
      this.knockbackX *= 0.8;
      this.knockbackY *= 0.8;
      return;
    }

    let dx = 0;
    let dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      audioManager.playStep();
      let speed = this.isBlocking ? this.baseSpeed * 0.5 : this.baseSpeed;
      if (dx !== 0 && dy !== 0) speed /= Math.SQRT2;

      if (dx !== 0 && dy === 0) {
        this.facing = dx > 0 ? DIR_RIGHT : DIR_LEFT;
      } else if (dy !== 0 && dx === 0) {
        this.facing = dy > 0 ? DIR_DOWN : DIR_UP;
      }

      this.moveWithCollision(dx * speed, dy * speed, mapData, onPuzzleChanged);

      this.walkAnimTimer += 0.2;
      if (this.walkAnimTimer >= 1) {
        this.walkAnimTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 4;
      }
    } else {
      this.walkAnimTimer = 0;
      this.walkFrame = 0;
    }

    this.checkNearbyInteraction(mapData, npcs, onNearbyCheck);
  }

  public triggerDash(onDust?: (x: number, y: number) => void) {
    if (this.dashCooldown > 0 || this.isDead || this.isAttacking || this.isSpinning) return;

    let dx = 0;
    let dy = 0;
    if (this.facing === DIR_RIGHT) dx = 1;
    else if (this.facing === DIR_LEFT) dx = -1;
    else if (this.facing === DIR_DOWN) dy = 1;
    else if (this.facing === DIR_UP) dy = -1;

    this.dashDx = dx;
    this.dashDy = dy;
    this.isDashing = true;
    this.dashTimer = 9;
    this.dashCooldown = 18;
    this.invulnerableTimer = 14;
    audioManager.playDash();
    if (onDust) onDust(this.x + 6, this.y + 10);
  }

  public triggerSpinAttack(
    enemies: Enemy[],
    boss: BossKing | null,
    onHit?: (x: number, y: number, dmg: number) => void
  ) {
    if (!this.hasSword || this.isDead) return;
    this.isSpinning = true;
    this.spinTimer = 16;
    this.attackCooldown = 22;
    this.isCharged = false;
    this.chargeTimer = 0;
    audioManager.playSpinAttack();

    const range = 28;
    const dmg = Math.round(this.swordDamage * 1.5) || 2;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const eb = enemy.getBounds();
      const dist = Math.hypot((eb.x + eb.w / 2) - (this.x + this.width / 2), (eb.y + eb.h / 2) - (this.y + this.height / 2));
      if (dist < range) {
        const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
        enemy.takeDamage(dmg, Math.cos(angle) * 5, Math.sin(angle) * 5);
        if (onHit) onHit(enemy.x + 8, enemy.y, dmg);
      }
    }

    if (boss && !boss.isDead) {
      const bb = boss.getBounds();
      const dist = Math.hypot((bb.x + bb.w / 2) - (this.x + this.width / 2), (bb.y + bb.h / 2) - (this.y + this.height / 2));
      if (dist < range) {
        const angle = Math.atan2(boss.y - this.y, boss.x - this.x);
        boss.takeDamage(dmg, Math.cos(angle) * 3, Math.sin(angle) * 3);
        if (onHit) onHit(boss.x + 8, boss.y, dmg);
      }
    }
  }

  public attack(
    enemies: Enemy[],
    boss: BossKing | null,
    onHit?: (x: number, y: number, dmg: number) => void,
    onSwing?: (bounds: Bounds) => void
  ) {
    if (!this.hasSword || this.isAttacking || this.isSpinning || this.attackCooldown > 0 || this.isDead || this.isBlocking) return;

    if (this.isCharged) {
      this.triggerSpinAttack(enemies, boss, onHit);
      return;
    }

    this.isAttacking = true;
    this.attackTimer = 10;
    this.attackCooldown = 15;
    this.chargeTimer = 0;
    audioManager.playSword();

    const range = 18;
    let hx = this.x;
    let hy = this.y;
    let hw = 16;
    let hh = 16;

    let kx = 0;
    let ky = 0;
    if (this.facing === DIR_DOWN) {
      hy += 10;
      hh = range;
      ky = 3;
    } else if (this.facing === DIR_UP) {
      hy -= range;
      hh = range;
      ky = -3;
    } else if (this.facing === DIR_LEFT) {
      hx -= range;
      hw = range;
      kx = -3;
    } else if (this.facing === DIR_RIGHT) {
      hx += this.width;
      hw = range;
      kx = 3;
    }
    onSwing?.({ x: hx, y: hy, w: hw, h: hh });

    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const eb = enemy.getBounds();
      if (hx < eb.x + eb.w && hx + hw > eb.x && hy < eb.y + eb.h && hy + hh > eb.y) {
        enemy.takeDamage(this.swordDamage, kx, ky);
        if (onHit) onHit(enemy.x + 8, enemy.y, this.swordDamage);
      }
    }

    if (boss && !boss.isDead) {
      const bb = boss.getBounds();
      if (hx < bb.x + bb.w && hx + hw > bb.x && hy < bb.y + bb.h && hy + hh > bb.y) {
        boss.takeDamage(this.swordDamage, kx * 0.5, ky * 0.5);
        if (onHit) onHit(boss.x + 8, boss.y, this.swordDamage);
      }
    }
  }

  public takeDamage(
    amount: number,
    sourceX: number,
    sourceY: number,
    onBlock?: (x: number, y: number) => void
  ) {
    if (this.invulnerableTimer > 0 || this.isDead) return;

    if (this.isBlocking) {
      audioManager.playShieldBlock();
      this.knockbackX = (this.x - sourceX) * 0.4;
      this.knockbackY = (this.y - sourceY) * 0.4;
      if (onBlock) onBlock(this.x + 6, this.y + 4);
      return;
    }

    this.hearts = Math.max(0, this.hearts - amount);
    this.invulnerableTimer = 45;
    audioManager.playPlayerHurt();

    const angle = Math.atan2(this.y - sourceY, this.x - sourceX);
    this.knockbackX = Math.cos(angle) * 3;
    this.knockbackY = Math.sin(angle) * 3;

    if (this.hearts <= 0) {
      this.isDead = true;
    }
  }

  public heal(amount: number) {
    this.hearts = Math.min(this.maxHearts, this.hearts + amount);
    audioManager.playHeartPickup();
  }

  public upgradeSword() {
    this.hasWhetstone = true;
    this.swordDamage = 2;
    audioManager.playSwordUpgrade();
  }

  private moveWithCollision(dx: number, dy: number, mapData: MapData, onPuzzleChanged?: () => void) {
    const newX = this.x + dx;
    if (!this.isBlockedAt(newX, this.y, mapData) &&
      !this.tryPushPuzzleBlock(newX, this.y, dx, 0, mapData, onPuzzleChanged)) {
      this.x = newX;
    }
    const newY = this.y + dy;
    if (!this.isBlockedAt(this.x, newY, mapData) &&
      !this.tryPushPuzzleBlock(this.x, newY, 0, dy, mapData, onPuzzleChanged)) {
      this.y = newY;
    }
    // Keep inside map; exits fire via overlapping edge triggers, not by leaving bounds
    this.x = Math.max(0, Math.min(mapData.width * TILE_SIZE - this.width, this.x));
    this.y = Math.max(0, Math.min(mapData.height * TILE_SIZE - this.height, this.y));
  }

  private tryPushPuzzleBlock(
    x: number,
    y: number,
    dx: number,
    dy: number,
    mapData: MapData,
    onPuzzleChanged?: () => void
  ): boolean {
    if ((dx === 0) === (dy === 0)) return false;
    const targetX = Math.floor((x + 6) / TILE_SIZE);
    const targetY = Math.floor((y + 5) / TILE_SIZE);
    for (const puzzle of mapData.puzzles || []) {
      if (puzzle.type !== 'push-block' || !puzzle.block || !puzzle.plate) continue;
      const progress = getPuzzleProgress(mapData, puzzle);
      if (!progress.block) continue;
      if (targetX !== progress.block.x || targetY !== progress.block.y) continue;
      if (progress.solved) return true;

      const nextBlock = {
        x: progress.block.x + Math.sign(dx),
        y: progress.block.y + Math.sign(dy)
      };
      const tile = mapData.layout[nextBlock.y]?.[nextBlock.x];
      if (this.isTileBlocking(tile)) return true;
      const overlapsOtherBlock = (mapData.puzzles || []).some(other => {
        if (other.id === puzzle.id || other.type !== 'push-block') return false;
        const otherProgress = getPuzzleProgress(mapData, other);
        return otherProgress.block?.x === nextBlock.x && otherProgress.block?.y === nextBlock.y;
      });
      if (overlapsOtherBlock) return true;

      progress.block = nextBlock;
      if (nextBlock.x === puzzle.plate.x && nextBlock.y === puzzle.plate.y) {
        completePuzzle(mapData, puzzle, progress);
      }
      onPuzzleChanged?.();
      return false;
    }
    return false;
  }

  private isTileBlocking(char: string | undefined): boolean {
    if (!char) return true;
    const def = TILE_DEFS[char];
    // Unknown tiles and rivers/water ('W') / solid scenery always block
    if (!def) return true;
    return def.solid === true;
  }

  /**
   * Zelda-style feet collision: only the lower hitbox tests tiles so river banks
   * and doorway/map-edge transitions feel fair while water stays impassable.
   */
  public isBlockedAt(x: number, y: number, mapData: MapData): boolean {
    const insetX = 2;
    const feetTop = y + this.height - 6;
    const left = Math.floor((x + insetX) / TILE_SIZE);
    const right = Math.floor((x + this.width - 1 - insetX) / TILE_SIZE);
    const top = Math.floor(feetTop / TILE_SIZE);
    const bottom = Math.floor((y + this.height - 1) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (r < 0 || r >= mapData.height || c < 0 || c >= mapData.width) {
          return true;
        }
        const char = mapData.layout[r]?.[c];
        if (this.isTileBlocking(char)) return true;
      }
    }
    return false;
  }

  /** Nudge spawn/checkpoint onto the nearest walkable tile (avoids river/wall softlocks). */
  public resolveSpawnCollision(mapData: MapData) {
    if (!this.isBlockedAt(this.x, this.y, mapData)) return;
    const originX = this.x;
    const originY = this.y;
    const radii = [4, 8, 12, 16, 24, 32];
    for (const radius of radii) {
      for (let dy = -radius; dy <= radius; dy += 4) {
        for (let dx = -radius; dx <= radius; dx += 4) {
          const nx = originX + dx;
          const ny = originY + dy;
          if (nx < 0 || ny < 0) continue;
          if (nx > mapData.width * TILE_SIZE - this.width) continue;
          if (ny > mapData.height * TILE_SIZE - this.height) continue;
          if (!this.isBlockedAt(nx, ny, mapData)) {
            this.x = nx;
            this.y = ny;
            return;
          }
        }
      }
    }
  }

  private checkNearbyInteraction(
    mapData: MapData,
    npcs: NPC[],
    onNearbyCheck: (interactable: NearbyInteractable | null) => void
  ) {
    const playerX = this.x + 6;
    const playerY = this.y + 5;
    for (const npc of npcs) {
      const dx = npc.x + 8 - playerX;
      const dy = npc.y + 8 - playerY;
      const distance = Math.hypot(dx, dy);
      if (distance > 80) continue;

      const isLookingAtNpc =
        (this.facing === DIR_DOWN && dy > 0 && Math.abs(dx) < Math.max(12, dy * 0.45)) ||
        (this.facing === DIR_UP && dy < 0 && Math.abs(dx) < Math.max(12, -dy * 0.45)) ||
        (this.facing === DIR_LEFT && dx < 0 && Math.abs(dy) < Math.max(12, -dx * 0.45)) ||
        (this.facing === DIR_RIGHT && dx > 0 && Math.abs(dy) < Math.max(12, dx * 0.45));

      if (distance <= 28 || isLookingAtNpc) npc.turnToward(playerX, playerY);
    }

    for (const door of mapData.doors || []) {
      const dist = Math.hypot(playerX - (door.x + 8), playerY - (door.y + 8));
      if (dist < 24) {
        onNearbyCheck({ type: 'door', door });
        return;
      }
    }

    for (const puzzle of mapData.puzzles || []) {
      const progress = getPuzzleProgress(mapData, puzzle);
      if (progress.solved) {
        const chestDistance = Math.hypot(playerX - (puzzle.chest.x * TILE_SIZE + 8), playerY - (puzzle.chest.y * TILE_SIZE + 8));
        if (!progress.chestClaimed && chestDistance < 28) {
          onNearbyCheck({ type: 'puzzle-chest', puzzleId: puzzle.id, hint: puzzle.hint });
          return;
        }
        continue;
      }
      if (puzzle.type === 'push-block' && progress.block && puzzle.plate) {
        const blockDistance = Math.hypot(playerX - (progress.block.x * TILE_SIZE + 8), playerY - (progress.block.y * TILE_SIZE + 8));
        const plateDistance = Math.hypot(playerX - (puzzle.plate.x * TILE_SIZE + 8), playerY - (puzzle.plate.y * TILE_SIZE + 8));
        if (blockDistance < 26 || plateDistance < 26) {
          onNearbyCheck({ type: 'puzzle-block', puzzleId: puzzle.id, hint: puzzle.hint });
          return;
        }
      }
      const elements = puzzle.type === 'lever-sequence' ? puzzle.levers
        : puzzle.type === 'target-sequence' ? puzzle.targets
          : undefined;
      if (!elements) continue;
      for (let index = 0; index < elements.length; index++) {
        const point = elements[index];
        const distance = Math.hypot(playerX - (point.x * TILE_SIZE + 8), playerY - (point.y * TILE_SIZE + 8));
        if (distance > 26) continue;
        onNearbyCheck({
          type: puzzle.type === 'lever-sequence' ? 'puzzle-lever' : 'puzzle-target',
          puzzleId: puzzle.id,
          elementIndex: index,
          hint: puzzle.hint
        });
        return;
      }
    }

    // 1. Scan NPCs in talking distance (28px)
    for (const npc of npcs) {
      const dist = Math.hypot(playerX - (npc.x + 8), playerY - (npc.y + 8));
      if (dist < 28) {
        onNearbyCheck({ type: 'npc', entity: npc });
        return;
      }
    }

    // 2. Altar check (30px)
    if (mapData.altar && mapData.altar.active) {
      const dist = Math.hypot((this.x + 6) - (mapData.altar.x + 8), (this.y + 5) - (mapData.altar.y + 8));
      if (dist < 30) {
        onNearbyCheck({ type: 'altar' });
        return;
      }
    }

    // 3. Sign check (within 1 tile)
    const centerC = Math.floor((this.x + 6) / TILE_SIZE);
    const centerR = Math.floor((this.y + 5) / TILE_SIZE);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerR + dr;
        const c = centerC + dc;
        if (mapData.layout[r]?.[c] === 'S' && mapData.signText) {
          onNearbyCheck({ type: 'sign', text: mapData.signText });
          return;
        }
      }
    }

    onNearbyCheck(null);
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    spriteManager.drawShadow(ctx, this.x + 6, this.y + 10, 12);

    // Draw dash afterimages with current equipment
    for (const ai of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = ai.alpha;
      spriteManager.draw(ctx, this.getEquippedBodySprite(ai.facing, 0), ai.x, ai.y);
      if (this.hasHat) spriteManager.drawTravelerHat(ctx, ai.x, ai.y);
      ctx.restore();
    }

    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) return;
    const dx = Math.floor(this.x + this.spriteOffset.x);
    const dy = Math.floor(this.y + this.spriteOffset.y);

    if (this.isBlocking) {
      spriteManager.draw(ctx, this.getEquippedBodySprite(this.facing, 0), dx, dy);
    } else if (this.isSpinning) {
      const spinFrame = Math.floor((16 - this.spinTimer) / 4) % 4;
      spriteManager.draw(ctx, this.getEquippedBodySprite(this.facing, spinFrame % 3), dx, dy);

      ctx.save();
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x + 6, this.y + 5, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.isAttacking) {
      spriteManager.draw(ctx, this.getEquippedBodySprite(this.facing, 0), dx, dy);

      const slashOffsets = [
        { name: 'slash_down', ox: dx, oy: dy + 20 },
        { name: 'slash_up', ox: dx, oy: dy - 10 },
        { name: 'slash_left', ox: dx - 10, oy: dy + 4 },
        { name: 'slash_right', ox: dx + 10, oy: dy + 4 }
      ];
      const so = slashOffsets[this.facing];
      spriteManager.draw(ctx, so.name, so.ox, so.oy);
    } else {
      const walkingFrames = this.hasSword || this.hasShield
        ? [0, 1, 2, 1] as const
        : [0, 1, 0, 2] as const;
      const fi = this.isMoving ? walkingFrames[this.walkFrame] : 0;
      spriteManager.draw(ctx, this.getEquippedBodySprite(this.facing, fi), dx, dy);
    }

    if (this.hasHat) spriteManager.drawTravelerHat(ctx, dx, dy);

    // Charged blade glowing sparkle
    if (this.isCharged && !this.isAttacking && !this.isSpinning && this.hasSword) {
      const sparkFrame = Math.floor(Date.now() / 90) % 2;
      ctx.fillStyle = sparkFrame === 0 ? '#fef08a' : '#67e8f9';
      const sx = dx + (this.facing === DIR_RIGHT ? 14 : 2);
      const sy = dy + 2;
      ctx.fillRect(sx, sy, 2, 2);
      ctx.fillRect(sx - 1, sy + 2, 3, 3);
    }
  }
}

export class NPC extends Entity {
  public id: string;
  public name: string;
  public sprite: string;
  public facing: Direction;

  constructor(data: NPCData) {
    super(data.x, data.y, 16, 16);
    this.id = data.id;
    this.name = data.name;
    this.sprite = data.sprite;
    this.facing = data.facing;
  }

  public turnToward(x: number, y: number) {
    const dx = x - (this.x + 8);
    const dy = y - (this.y + 8);
    this.facing = Math.abs(dx) > Math.abs(dy)
      ? dx < 0 ? DIR_LEFT : DIR_RIGHT
      : dy < 0 ? DIR_UP : DIR_DOWN;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    spriteManager.drawShadow(ctx, this.x + 8, this.y + 15, 13);
    spriteManager.drawNpc(ctx, this.sprite, this.x - 4, this.y - 8, this.facing);
  }
}

export class Enemy extends Entity {
  public type: 'boar' | 'wolf' | 'bandit' | 'corrupt_knight';
  public maxHp: number;
  public hp: number;
  public damage: number;
  public speed: number;
  public aggroRange = 75;
  public isDead = false;
  public isQuestTarget?: string;
  public neutralUntilProvoked = false;
  public isProvoked = false;

  public patrolAxis: 'x' | 'y';
  public patrolMin: number;
  public patrolMax: number;
  public patrolDir = 1;
  public hurtTimer = 0;
  public attackCooldown = 0;
  public animTimer = 0;
  public animFrame = 0;

  constructor(data: EnemyData) {
    super(data.x, data.y, 14, 12);
    this.type = data.type;
    this.isQuestTarget = data.isQuestTarget;
    this.neutralUntilProvoked = data.neutralUntilProvoked || false;

    this.maxHp = data.type === 'boar' ? 3 : data.type === 'wolf' ? 4 : data.type === 'bandit' ? 5 : 8;
    this.hp = this.maxHp;
    this.damage = data.type === 'corrupt_knight' ? 2 : 1;
    this.speed = data.type === 'boar' ? 0.6 : data.type === 'wolf' ? 0.7 : data.type === 'bandit' ? 0.65 : 0.7;

    this.patrolAxis = data.patrolAxis || 'x';
    this.patrolMin = data.patrolMin || data.x - 24;
    this.patrolMax = data.patrolMax || data.x + 24;
  }

  public update(player: Player, onBlock?: (x: number, y: number) => void) {
    if (this.isDead) return;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      return;
    }

    const dist = Math.hypot(this.x + 7 - (player.x + 6), this.y + 6 - (player.y + 5));
    const canAggro = !this.neutralUntilProvoked || this.isProvoked;

    if (canAggro && dist < this.aggroRange && !player.isDead) {
      const angle = Math.atan2(player.y + 5 - (this.y + 6), player.x + 6 - (this.x + 7));
      this.x += Math.cos(angle) * (this.speed * 1.15);
      this.y += Math.sin(angle) * (this.speed * 1.15);

      if (this.collidesWith(player.getBounds()) && this.attackCooldown <= 0) {
        player.takeDamage(this.damage, this.x + 7, this.y + 6, onBlock);
        this.attackCooldown = 45;
      }
    } else {
      if (this.patrolAxis === 'x') {
        this.x += this.patrolDir * this.speed;
        if (this.x > this.patrolMax || this.x < this.patrolMin) this.patrolDir *= -1;
      } else {
        this.y += this.patrolDir * this.speed;
        if (this.y > this.patrolMax || this.y < this.patrolMin) this.patrolDir *= -1;
      }
    }

    this.animTimer += 0.1;
    if (this.animTimer >= 1) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 3;
    }
  }

  public takeDamage(amount: number, kx: number, ky: number) {
    if (this.hurtTimer > 0 || this.isDead) return;
    this.isProvoked = true;
    this.hp -= amount;
    this.hurtTimer = 12;
    this.x += kx;
    this.y += ky;
    audioManager.playHit();

    if (this.hp <= 0) {
      this.isDead = true;
      audioManager.playEnemyDefeat();
      if (Math.random() < 0.65) {
        window.dispatchEvent(new CustomEvent('enemyDrop', { detail: { x: this.x, y: this.y, type: Math.random() < 0.25 ? 'heart' : 'coin' } }));
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    const dx = Math.floor(this.x - 5);
    const dy = Math.floor(this.y - 10);
    spriteManager.drawShadow(ctx, this.x + 8, this.y + 14, 12);

    spriteManager.draw(ctx, `enemy_${this.type}_${this.animFrame}`, dx, dy);
    if (this.hurtTimer > 0) drawHitSparks(ctx, this.x + 7, this.y + 1, this.hurtTimer, 12);

    // Health bar above enemy
    const barW = 18;
    const barH = 2;
    const barX = Math.floor(this.x + (this.width - barW) / 2);
    const barY = Math.floor(this.y - 12);

    ctx.fillStyle = '#080a10';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#881018';
    ctx.fillRect(barX, barY, barW, barH);

    const fillRatio = Math.max(0, this.hp / this.maxHp);
    const fillW = Math.floor(barW * fillRatio);
    ctx.fillStyle = fillRatio > 0.5 ? '#4ade80' : fillRatio > 0.25 ? '#facc15' : '#ef4444';
    ctx.fillRect(barX, barY, fillW, barH);
  }
}

export interface Shockwave {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export class BossKing extends Entity {
  public maxHp = 24;
  public hp = 24;
  public isDead = false;
  public hurtTimer = 0;
  public attackCooldown = 0;
  public actionTimer = 70;
  public animTimer = 0;
  public animFrame = 0;
  public shockwaves: Shockwave[] = [];

  constructor(x: number, y: number) {
    super(x, y, 16, 16);
  }

  public update(player: Player, mapData: MapData, onDefeated: () => void, onBlock?: (x: number, y: number) => void) {
    if (this.isDead) return;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    const phase = this.hp <= this.maxHp / 2 ? 2 : 1;
    const speed = phase === 2 ? 0.85 : 0.55;
    const angle = Math.atan2(player.y + 5 - (this.y + 8), player.x + 6 - (this.x + 8));

    this.x += Math.cos(angle) * speed;
    this.y += Math.sin(angle) * speed;
    this.x = Math.max(TILE_SIZE, Math.min(mapData.width * TILE_SIZE - this.width - TILE_SIZE, this.x));
    this.y = Math.max(TILE_SIZE * 2, Math.min(mapData.height * TILE_SIZE - this.height - TILE_SIZE, this.y));

    this.animTimer += 0.12;
    if (this.animTimer >= 1) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 3;
    }

    if (this.collidesWith(player.getBounds()) && this.attackCooldown <= 0) {
      player.takeDamage(phase === 2 ? 2 : 1, this.x + 8, this.y + 8, onBlock);
      this.attackCooldown = 50;
      this.animFrame = 1;
    }

    this.actionTimer--;
    if (this.actionTimer <= 0) {
      this.actionTimer = phase === 2 ? 48 : 78;
      audioManager.playBossShockwave();
      this.shockwaves.push({
        x: this.x + 2,
        y: this.y + 2,
        vx: Math.cos(angle) * (1.2 + phase * 0.25),
        vy: Math.sin(angle) * (1.2 + phase * 0.25),
        life: 90
      });
      if (phase === 2) {
        this.shockwaves.push({
          x: this.x + 2,
          y: this.y + 2,
          vx: Math.cos(angle + 0.35) * 1.35,
          vy: Math.sin(angle + 0.35) * 1.35,
          life: 90
        });
      }
    }

    for (const sw of this.shockwaves) {
      sw.x += sw.vx;
      sw.y += sw.vy;
      sw.life--;
      if (player.collidesWith({ x: sw.x, y: sw.y, w: 12, h: 12 })) {
        player.takeDamage(1, sw.x, sw.y, onBlock);
        sw.life = 0;
      }
    }
    this.shockwaves = this.shockwaves.filter(sw => sw.life > 0);

    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      onDefeated();
    }
  }

  public takeDamage(amount: number, kx: number, ky: number) {
    if (this.hurtTimer > 0 || this.isDead) return;
    this.hp -= Math.max(1, amount);
    this.hurtTimer = 22;
    this.x += kx;
    this.y += ky;
    audioManager.playHit();
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    spriteManager.drawShadow(ctx, this.x + 8, this.y + 15, 14);
    spriteManager.draw(ctx, `boss_king_${this.animFrame}`, Math.floor(this.x - 4), Math.floor(this.y - 8));
    if (this.hurtTimer > 0) drawHitSparks(ctx, this.x + 8, this.y + 4, this.hurtTimer, 22);
    for (const sw of this.shockwaves) {
      spriteManager.draw(ctx, 'boss_shockwave', sw.x, sw.y);
    }

    // Boss health bar above King Raymond IV
    const bBarW = 26;
    const bBarH = 3;
    const bBarX = Math.floor(this.x + (this.width - bBarW) / 2);
    const bBarY = Math.floor(this.y - 15);

    ctx.fillStyle = '#080a10';
    ctx.fillRect(bBarX - 1, bBarY - 1, bBarW + 2, bBarH + 2);
    ctx.fillStyle = '#881018';
    ctx.fillRect(bBarX, bBarY, bBarW, bBarH);
    const bFill = Math.max(0, Math.floor(bBarW * (this.hp / this.maxHp)));
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bBarX, bBarY, bFill, bBarH);

    ctx.font = '5px monospace';
    ctx.fillStyle = '#ffe454';
    ctx.fillText('Roi Raymond IV', bBarX - 4, bBarY - 2);
  }
}

export class Pickup extends Entity {
  public type: 'coin' | 'heart';

  constructor(type: 'coin' | 'heart', x: number, y: number) {
    super(x, y, 10, 10);
    this.type = type;
  }

  public update(player: Player) {
    if (this.collidesWith(player.getBounds())) {
      if (this.type === 'coin') {
        player.coins += 1;
        audioManager.playCoinsCollect();
        this.markedForRemoval = true;
      } else if (this.type === 'heart') {
        if (player.hearts < player.maxHearts) {
          player.heal(1);
          this.markedForRemoval = true;
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    if (this.type === 'coin') {
      ctx.fillStyle = '#ffe454';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 6, 6);
    } else {
      spriteManager.draw(ctx, 'hud_heart_full', Math.floor(this.x), Math.floor(this.y));
    }
  }
}

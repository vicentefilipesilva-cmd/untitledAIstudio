// entities.js - Player, NPCs, Balanced Enemies & Boss Mechanics

const DIR_DOWN = 0;
const DIR_UP = 1;
const DIR_LEFT = 2;
const DIR_RIGHT = 3;

class Entity {
  constructor(x, y, width, height) {
    this.x = x; this.y = y; this.width = width; this.height = height;
    this.solid = false; this.markedForRemoval = false;
  }
  getBounds() { return { x: this.x, y: this.y, w: this.width, h: this.height }; }
  collidesWith(other) {
    return (this.x < other.x + other.w && this.x + this.width > other.x && this.y < other.y + other.h && this.y + this.height > other.y);
  }
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y, 12, 10);
    this.spriteOffset = { x: -2, y: -6 };
    this.baseSpeed = 1.4;
    this.facing = DIR_DOWN;
    this.lastCardinalDir = DIR_DOWN;
    this.walkAnimTimer = 0; this.walkFrame = 0; this.isMoving = false;

    this.hasSword = false; this.hasHat = false; this.hasShield = false; this.hasWhetstone = false;
    this.swordDamage = 1;

    this.isAttacking = false; this.attackTimer = 0; this.attackCooldown = 0; this.attackHitbox = null;
    this.isBlocking = false;

    this.maxHearts = 4; this.hearts = 4; this.invulnerableTimer = 0; this.isDead = false;
    this.coins = 0;

    this.checkpointMapId = 'village'; this.checkpointX = 8 * 16; this.checkpointY = 7 * 16;
    this.knockbackX = 0; this.knockbackY = 0;
  }

  update(keys, mapData, enemies, npcs, game) {
    if (this.isDead) return;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    this.isBlocking = Boolean(this.hasShield && keys.shield && !this.isAttacking);

    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) { this.isAttacking = false; this.attackHitbox = null; }
      return;
    }

    if (Math.abs(this.knockbackX) > 0.1 || Math.abs(this.knockbackY) > 0.1) {
      this.moveWithCollision(this.knockbackX, this.knockbackY, mapData);
      this.knockbackX *= 0.8; this.knockbackY *= 0.8;
      return;
    }

    let dx = 0; let dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isMoving) {
      audioManager.playStep();
      let speed = this.isBlocking ? (this.baseSpeed * 0.5) : this.baseSpeed;
      if (dx !== 0 && dy !== 0) speed /= Math.SQRT2;

      if (dx !== 0 && dy === 0) { this.facing = dx > 0 ? DIR_RIGHT : DIR_LEFT; }
      else if (dy !== 0 && dx === 0) { this.facing = dy > 0 ? DIR_DOWN : DIR_UP; }

      this.moveWithCollision(dx * speed, dy * speed, mapData);

      this.walkAnimTimer += 0.2;
      if (this.walkAnimTimer >= 1) { this.walkAnimTimer = 0; this.walkFrame = (this.walkFrame + 1) % 4; }
    } else {
      this.walkAnimTimer = 0; this.walkFrame = 0;
    }

    this.checkNearbyInteraction(npcs, mapData, game);
  }

  attack(enemies, boss) {
    if (!this.hasSword || this.isAttacking || this.attackCooldown > 0 || this.isDead || this.isBlocking) return;

    this.isAttacking = true;
    this.attackTimer = 10;
    this.attackCooldown = 15;
    audioManager.playSword();

    const range = 16;
    let hx = this.x, hy = this.y, hw = 16, hh = 16;
    if (this.facing === DIR_DOWN) { hy += 10; hh = range; }
    else if (this.facing === DIR_UP) { hy -= range; hh = range; }
    else if (this.facing === DIR_LEFT) { hx -= range; hw = range; }
    else if (this.facing === DIR_RIGHT) { hx += this.width; hw = range; }

    let kx = 0, ky = 0;
    if (this.facing === DIR_DOWN) ky = 3;
    if (this.facing === DIR_UP) ky = -3;
    if (this.facing === DIR_LEFT) kx = -3;
    if (this.facing === DIR_RIGHT) kx = 3;

    for (let enemy of enemies) {
      if (enemy.isDead) continue;
      const eb = enemy.getBounds();
      if (hx < eb.x + eb.w && hx + hw > eb.x && hy < eb.y + eb.h && hy + hh > eb.y) {
        enemy.takeDamage(this.swordDamage, kx, ky);
      }
    }

    if (boss && !boss.isDead) {
      const bb = boss.getBounds();
      if (hx < bb.x + bb.w && hx + hw > bb.x && hy < bb.y + bb.h && hy + hh > bb.y) {
        boss.takeDamage(this.swordDamage, kx * 0.5, ky * 0.5);
      }
    }
  }

  takeDamage(amount, sourceX, sourceY) {
    if (this.invulnerableTimer > 0 || this.isDead) return;

    if (this.isBlocking) {
      audioManager.playShieldBlock();
      this.knockbackX = (this.x - sourceX) * 0.5;
      this.knockbackY = (this.y - sourceY) * 0.5;
      return;
    }

    this.hearts = Math.max(0, this.hearts - amount);
    this.invulnerableTimer = 45;
    audioManager.playPlayerHurt();

    const angle = Math.atan2(this.y - sourceY, this.x - sourceX);
    this.knockbackX = Math.cos(angle) * 3;
    this.knockbackY = Math.sin(angle) * 3;

    if (this.hearts <= 0) { this.isDead = true; }
  }

  heal(amount) { this.hearts = Math.min(this.maxHearts, this.hearts + amount); audioManager.playHeartPickup(); }
  upgradeSword() { this.hasWhetstone = true; this.swordDamage = 2; audioManager.playSwordUpgrade(); }

  moveWithCollision(dx, dy, mapData) {
    const newX = this.x + dx;
    if (!this.checkCollisionAt(newX, this.y, mapData)) { this.x = newX; }
    const newY = this.y + dy;
    if (!this.checkCollisionAt(this.x, newY, mapData)) { this.y = newY; }
    this.x = Math.max(0, Math.min(mapData.width * TILE_SIZE - this.width, this.x));
    this.y = Math.max(0, Math.min(mapData.height * TILE_SIZE - this.height, this.y));
  }

  checkCollisionAt(x, y, mapData) {
    const left = Math.floor(x / TILE_SIZE), right = Math.floor((x + this.width - 0.1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE), bottom = Math.floor((y + this.height - 0.1) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (r < 0 || r >= mapData.height || c < 0 || c >= mapData.width) continue;
        if (TILE_DEFS[mapData.layout[r][c]]?.solid) return true;
      }
    }
    return false;
  }

  checkNearbyInteraction(npcs, mapData, game) {
    game.nearbyInteractable = null;
    for (let npc of npcs) {
      if (Math.hypot((this.x + 6) - (npc.x + 8), (this.y + 5) - (npc.y + 8)) < 24) {
        game.nearbyInteractable = { type: 'npc', entity: npc };
        return;
      }
    }
    if (mapData.altar && mapData.altar.active) {
      if (Math.hypot((this.x + 6) - (mapData.altar.x + 8), (this.y + 5) - (mapData.altar.y + 8)) < 24) {
        game.nearbyInteractable = { type: 'altar', data: mapData.altar };
        return;
      }
    }
    // #region agent log
    if (!this._dbgSignLogged) {
      this._dbgSignLogged = true;
      fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'E',location:'entities.js:checkNearbyInteraction',message:'interaction scan',data:{npcCount:(npcs||[]).length,hasAltar:!!(mapData&&mapData.altar),player:{x:this.x,y:this.y},mapId:game&&game.currentMapId},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
  }

  draw(ctx) {
    if (this.isDead) return;
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) return;
    const dx = Math.floor(this.x + this.spriteOffset.x), dy = Math.floor(this.y + this.spriteOffset.y);

    if (this.isBlocking) {
      spriteManager.draw(ctx, `player_shield_${this.facing}`, dx, dy);
    } else if (this.isAttacking) {
      spriteManager.draw(ctx, `player_attack_${this.facing}`, dx, dy);
    } else {
      let fi = (this.isMoving && (this.walkFrame === 1 || this.walkFrame === 3)) ? 1 : 0;
      const dirs = ['down', 'up', 'left', 'right'];
      spriteManager.draw(ctx, `player_${dirs[this.facing]}_${fi}`, dx, dy);
    }
  }
}

class NPC extends Entity {
  constructor(data) {
    super(data.x, data.y, 16, 16);
    this.id = data.id; this.name = data.name; this.sprite = data.sprite; this.solid = true;
  }
  draw(ctx) { spriteManager.draw(ctx, this.sprite, this.x, this.y); }
}

class Enemy extends Entity {
  constructor(type, x, y, options = {}) {
    super(x, y, 14, 12);
    this.type = type; this.isQuestBandit = options.isQuestBandit || false;
    this.maxHp = (type === 'boar') ? 3 : (type === 'wolf') ? 4 : (type === 'bandit') ? 5 : 8;
    this.hp = this.maxHp;
    this.damage = (type === 'corrupt_knight') ? 2 : 1;
    this.speed = 0.6; this.aggroRange = 75;
    this.isDead = false;
    this.patrolAxis = options.patrolAxis || 'x';
    this.patrolMin = options.patrolMin || x - 24;
    this.patrolMax = options.patrolMax || x + 24;
    this.patrolDir = 1;
    this.hurtTimer = 0; this.attackCooldown = 0;
    this.animTimer = 0; this.animFrame = 0;
  }

  update(player, mapData, pickups, game) {
    if (this.isDead) return;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.hurtTimer > 0) { this.hurtTimer--; return; }

    const dist = Math.hypot((this.x + 7) - (player.x + 6), (this.y + 6) - (player.y + 5));

    if (dist < this.aggroRange && !player.isDead) {
      const angle = Math.atan2((player.y + 5) - (this.y + 6), (player.x + 6) - (this.x + 7));
      this.x += Math.cos(angle) * (this.speed * 1.2);
      this.y += Math.sin(angle) * (this.speed * 1.2);

      if (this.collidesWith(player.getBounds()) && this.attackCooldown <= 0) {
        player.takeDamage(this.damage, this.x + 7, this.y + 6);
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
    if (this.animTimer >= 1) { this.animTimer = 0; this.animFrame = (this.animFrame + 1) % 2; }
  }

  takeDamage(amount, kx, ky) {
    if (this.hurtTimer > 0 || this.isDead) return;
    this.hp -= amount;
    this.hurtTimer = 12;
    this.x += kx; this.y += ky;
    audioManager.playHit();

    if (this.hp <= 0) {
      this.isDead = true;
      audioManager.playEnemyDefeat();
      if (this.isQuestBandit) { window.playerHasRetrievedLedger = true; }
      if (Math.random() < 0.6) window.activePickups.push(new Pickup('coin', this.x, this.y));
    }
  }

  draw(ctx) {
    if (this.isDead) return;
    const dx = Math.floor(this.x - 1), dy = Math.floor(this.y - 2);
    if (this.hurtTimer > 0) {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(dx, dy, 16, 16);
      return;
    }
    spriteManager.draw(ctx, `enemy_${this.type}_${this.animFrame}`, dx, dy);
  }
}

class BossKing extends Entity {
  constructor(x, y, maxHp = 24) {
    super(x, y, 16, 16);
    this.maxHp = (typeof maxHp === 'number' && maxHp > 1) ? maxHp : 24;
    this.hp = this.maxHp;
    this.isDead = false;
    this.hurtTimer = 0;
    this.attackCooldown = 0;
    this.actionTimer = 70;
    this.animTimer = 0;
    this.animFrame = 0;
    this.shockwaves = [];
    this._dbgHitCount = 0;
  }
  update(player, mapData, game) {
    if (this.isDead) return;
    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    const phase = this.hp <= this.maxHp / 2 ? 2 : 1;
    const speed = phase === 2 ? 0.85 : 0.55;
    const angle = Math.atan2((player.y + 5) - (this.y + 8), (player.x + 6) - (this.x + 8));
    this.x += Math.cos(angle) * speed;
    this.y += Math.sin(angle) * speed;
    this.x = Math.max(TILE_SIZE, Math.min(mapData.width * TILE_SIZE - this.width - TILE_SIZE, this.x));
    this.y = Math.max(TILE_SIZE * 2, Math.min(mapData.height * TILE_SIZE - this.height - TILE_SIZE, this.y));

    this.animTimer += 0.12;
    if (this.animTimer >= 1) {
      this.animTimer = 0;
      this.animFrame = this.animFrame === 0 ? 1 : 0;
    }

    if (this.collidesWith(player.getBounds()) && this.attackCooldown <= 0) {
      player.takeDamage(phase === 2 ? 2 : 1, this.x + 8, this.y + 8);
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
    }

    for (let sw of this.shockwaves) {
      sw.x += sw.vx; sw.y += sw.vy; sw.life--;
      if (player.collidesWith({ x: sw.x, y: sw.y, w: 12, h: 12 })) {
        player.takeDamage(1, sw.x, sw.y); sw.life = 0;
      }
    }
    this.shockwaves = this.shockwaves.filter(sw => sw.life > 0);
  }
  takeDamage(amount, kx, ky) {
    if (this.hurtTimer > 0 || this.isDead) return;
    const hpBefore = this.hp;
    this.hp -= Math.max(1, amount | 0);
    this.hurtTimer = 22;
    this.x += kx; this.y += ky;
    this._dbgHitCount++;
    audioManager.playHit();
    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'post-fix',hypothesisId:'K',location:'entities.js:BossKing.takeDamage',message:'boss hit',data:{hpBefore,amount,hpAfter:this.hp,maxHp:this.maxHp,hitCount:this._dbgHitCount,died:this.hp<=0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (this.hp <= 0) { this.isDead = true; window.game.triggerKingDefeated(); }
  }
  draw(ctx) {
    if (this.isDead) return;
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 16, 16);
    } else {
      spriteManager.draw(ctx, `boss_king_${this.animFrame}`, Math.floor(this.x), Math.floor(this.y));
    }
    for (let sw of this.shockwaves) {
      spriteManager.draw(ctx, 'boss_shockwave', sw.x, sw.y);
    }
  }
}

class Pickup extends Entity {
  constructor(type, x, y) { super(x, y, 10, 10); this.type = type; }
  update(player) {
    if (this.collidesWith(player.getBounds())) {
      if (this.type === 'coin') { player.coins++; audioManager.playCoinsCollect(); this.markedForRemoval = true; }
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#ffe454';
    ctx.fillRect(Math.floor(this.x), Math.floor(this.y), 6, 6);
  }
}
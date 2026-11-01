// game.js - Core 2D Game Loop, Camera, Shield Controls, Boss Battle & English HUD

const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.canvas.width = SCREEN_WIDTH;
    this.canvas.height = SCREEN_HEIGHT;

    this.ctx.fillStyle = '#448c14';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    this.camera = { x: 0, y: 0 };

    this.currentMapId = 'village';
    this.currentMapData = WORLD_MAPS['village'];
    this.player = new Player(8 * 16, 7 * 16);
    this.npcs = [];
    this.enemies = [];
    this.pickups = [];
    window.activePickups = this.pickups;

    this.boss = null;
    this.bossActive = false;
    this.nearbyInteractable = null;

    this.transitioning = false;
    this.fadeAlpha = 0;
    this.fadeDirection = 0;
    this.pendingMapChange = null;

    this.isVictory = false;
    this.victoryTimer = 0;
    this.isGameOver = false;
    this.gameOverJinglePlayed = false;
    this.gameOverHover = null;

    this.keys = {
      up: false, down: false, left: false, right: false,
      attack: false, interact: false, shield: false
    };

    this.initInputs();
    this.loadMap('village', 8 * 16, 7 * 16, DIR_DOWN);
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      audioManager.init();
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = true;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = true;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = true;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = true;

      if (this.isGameOver) {
        if (k === 't') { audioManager.playButtonClick(); this.tryAgainFromCheckpoint(); return; }
        if (k === 'm') { this.returnToMainMenu(); return; }
      }

      if (k === ' ' || k === 'z' || k === 'j') {
        if (!this.keys.attack) { this.handleActionPress('attack'); }
        this.keys.attack = true;
      }

      if (k === 'e' || k === 'enter' || k === 'c') {
        if (!this.keys.interact) { this.handleActionPress('interact'); }
        this.keys.interact = true;
      }

      if (k === 'x' || e.key === 'Shift') {
        this.keys.shield = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (k === ' ' || k === 'z' || k === 'j') this.keys.attack = false;
      if (k === 'e' || k === 'enter' || k === 'c') this.keys.interact = false;
      if (k === 'x' || e.key === 'Shift') this.keys.shield = false;
    });

    this.setupVirtualGamepad();
  }

  setupVirtualGamepad() {
    const bindBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (e) => { e.preventDefault(); audioManager.init(); onDown(); };
      const end = (e) => { e.preventDefault(); onUp(); };
      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
    };

    bindBtn('btn-up', () => { this.keys.up = true; }, () => { this.keys.up = false; });
    bindBtn('btn-down', () => { this.keys.down = true; }, () => { this.keys.down = false; });
    bindBtn('btn-left', () => { this.keys.left = true; }, () => { this.keys.left = false; });
    bindBtn('btn-right', () => { this.keys.right = true; }, () => { this.keys.right = false; });

    bindBtn('btn-a', () => { this.handleActionPress('attack'); this.keys.attack = true; }, () => { this.keys.attack = false; });
    bindBtn('btn-b', () => { this.handleActionPress('interact'); this.keys.interact = true; }, () => { this.keys.interact = false; });
    bindBtn('btn-x', () => { this.keys.shield = true; }, () => { this.keys.shield = false; });

    this.canvas.addEventListener('click', (e) => {
      audioManager.init();
      if (this.isGameOver) {
        audioManager.playButtonClick();
        this.tryAgainFromCheckpoint();
        return;
      }
      if (dialogueManager.isOpen) {
        dialogueManager.advance();
      }
    });
  }

  handleActionPress(type) {
    if (this.isVictory && this.victoryTimer > 2) { this.returnToMainMenu(); return; }
    if (this.isGameOver) { audioManager.playButtonClick(); this.tryAgainFromCheckpoint(); return; }
    if (dialogueManager.isOpen) { dialogueManager.advance(); return; }

    if (type === 'interact') {
      if (this.nearbyInteractable) {
        dialogueManager.handleInteraction(this.nearbyInteractable, this);
      }
    } else if (type === 'attack') {
      if (!this.player.hasSword && this.nearbyInteractable) {
        dialogueManager.handleInteraction(this.nearbyInteractable, this);
      } else {
        this.player.attack(this.enemies, this.boss);
      }
    }
  }

  loadMap(mapId, targetX, targetY, targetFacing = DIR_DOWN) {
    const mapData = WORLD_MAPS[mapId];
    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'B',location:'game.js:loadMap',message:'loadMap called',data:{mapId,hasMap:!!mapData,knownMaps:Object.keys(WORLD_MAPS||{}),targetX,targetY},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!mapData) return;

    this.currentMapId = mapId;
    this.currentMapData = mapData;

    this.player.x = targetX;
    this.player.y = targetY;
    this.player.facing = targetFacing;
    this.player.lastCardinalDir = targetFacing;

    this.player.checkpointMapId = mapId;
    this.player.checkpointX = targetX;
    this.player.checkpointY = targetY;
    this.player.checkpointFacing = targetFacing;

    this.npcs = (mapData.npcs || []).map(d => new NPC(d));
    this.enemies = (mapData.enemies || []).map(d => new Enemy(d.type, d.x, d.y, d));
    this.pickups = [];
    window.activePickups = this.pickups;

    if (mapId === 'capital' && mapData.boss && !this.bossActive && dialogueManager.questState < QUEST_STATE.VICTORY_LIBERATION) {
      this.boss = new BossKing(mapData.boss.x, mapData.boss.y, mapData.boss.maxHp);
      audioManager.stopMusic();
      setTimeout(() => { dialogueManager.triggerKingConfrontation(this); }, 500);
    } else {
      if (mapData.music) { audioManager.startMusic(mapData.music); }
    }

    this.updateCamera();
  }

  startBossBattle() {
    this.bossActive = true;
    audioManager.startMusic('boss');
    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'post-fix',hypothesisId:'M',location:'game.js:startBossBattle',message:'boss battle started',data:{bossActive:this.bossActive,hp:this.boss&&this.boss.hp,maxHp:this.boss&&this.boss.maxHp},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  triggerKingDefeated() {
    this.bossActive = false;
    audioManager.stopMusic();
    dialogueManager.triggerVictoryEpilogue(this);
  }

  triggerVictoryScreen() {
    this.isVictory = true;
    this.victoryTimer = 0;
  }

  changeMapWithTransition(mapId, targetX, targetY, targetFacing) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.fadeDirection = 1;
    this.fadeAlpha = 0;
    this.pendingMapChange = { mapId, targetX, targetY, targetFacing };
  }

  checkExitTriggers() {
    if (this.transitioning || dialogueManager.isOpen) return;
    const pb = this.player.getBounds();

    for (let exit of (this.currentMapData.exits || [])) {
      const t = exit.trigger;
      if (pb.x < t.x + t.w && pb.x + pb.w > t.x && pb.y < t.y + t.h && pb.y + pb.h > t.y) {
        if (exit.condition === 'canEnterTown') {
          if (dialogueManager.questState < QUEST_STATE.TALKED_AFTER_SWORD) {
            this.player.x -= 12;
            dialogueManager.startDialogue([
              { speaker: 'Guard', text: 'The road to Val-de-Loire is open only to those who have found the legendary sword!' }
            ]);
            return;
          }
        } else if (exit.condition === 'canEnterHighroad') {
          if (dialogueManager.questState < QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
            this.player.x -= 12;
            dialogueManager.startDialogue([
              { speaker: 'Master Pierre', text: 'The Royal Road is dangerous. Help me recover the stolen ledger first!' }
            ]);
            return;
          }
        }
        // #region agent log
        fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'post-fix',hypothesisId:'B',location:'game.js:checkExitTriggers',message:'exit taken',data:{from:this.currentMapId,targetMap:exit.targetMap,hasMap:!!WORLD_MAPS[exit.targetMap],knownMaps:Object.keys(WORLD_MAPS)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        this.changeMapWithTransition(exit.targetMap, exit.targetX, exit.targetY, exit.targetFacing);
        return;
      }
    }
  }

  updateCamera() {
    let targetX = this.player.x + (this.player.width / 2) - (SCREEN_WIDTH / 2);
    let targetY = this.player.y + (this.player.height / 2) - (SCREEN_HEIGHT / 2);
    const maxCamX = Math.max(0, this.currentMapData.width * TILE_SIZE - SCREEN_WIDTH);
    const maxCamY = Math.max(0, this.currentMapData.height * TILE_SIZE - SCREEN_HEIGHT);
    this.camera.x = Math.max(0, Math.min(maxCamX, Math.floor(targetX)));
    this.camera.y = Math.max(0, Math.min(maxCamY, Math.floor(targetY)));
  }

  update() {
    if (this.transitioning) {
      if (this.fadeDirection === 1) {
        this.fadeAlpha += 0.1;
        if (this.fadeAlpha >= 1) {
          this.fadeAlpha = 1;
          const p = this.pendingMapChange;
          this.loadMap(p.mapId, p.targetX, p.targetY, p.targetFacing);
          this.fadeDirection = -1;
        }
      } else if (this.fadeDirection === -1) {
        this.fadeAlpha -= 0.1;
        if (this.fadeAlpha <= 0) { this.fadeAlpha = 0; this.transitioning = false; }
      }
      return;
    }

    if (this.isVictory) { this.victoryTimer += 0.05; return; }

    if (this.player.isDead) {
      if (!this.isGameOver) {
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

    this.player.update(this.keys, this.currentMapData, this.enemies, this.npcs, this);

    for (let enemy of this.enemies) {
      enemy.update(this.player, this.currentMapData, this.pickups, this);
    }
    this.enemies = this.enemies.filter(e => !e.isDead || e.hurtTimer > 0);

    if (this.bossActive && this.boss) {
      this.boss.update(this.player, this.currentMapData, this);
    }

    for (let pickup of this.pickups) {
      pickup.update(this.player);
    }
    this.pickups = this.pickups.filter(p => !p.markedForRemoval);

    this.checkExitTriggers();
    this.updateCamera();
  }

  tryAgainFromCheckpoint() {
    this.isGameOver = false;
    this.gameOverJinglePlayed = false;
    this.bossActive = false;
    this.boss = null;
    this.player.isDead = false;
    this.player.hearts = this.player.maxHearts;
    this.player.invulnerableTimer = 90;
    this.loadMap(this.player.checkpointMapId, this.player.checkpointX, this.player.checkpointY, this.player.checkpointFacing);
    const mapData = WORLD_MAPS[this.player.checkpointMapId];
    if (mapData && mapData.music) { audioManager.startMusic(mapData.music); }
  }

  returnToMainMenu() {
    audioManager.playButtonClick();
    this.restartGame();
  }

  restartGame() {
    this.isGameOver = false;
    this.isVictory = false;
    this.victoryTimer = 0;
    this.bossActive = false;
    this.boss = null;
    this.player.isDead = false;
    this.player.hearts = this.player.maxHearts;
    this.player.hasSword = false;
    this.player.hasHat = false;
    this.player.hasShield = false;
    this.player.hasWhetstone = false;
    this.player.swordDamage = 1;
    this.player.coins = 0;
    window.playerHasRetrievedLedger = false;
    dialogueManager.questState = QUEST_STATE.NOT_STARTED;
    if (WORLD_MAPS['forest'].altar) { WORLD_MAPS['forest'].altar.active = true; }
    this.loadMap('village', 8 * 16, 7 * 16, DIR_DOWN);
  }

  render() {
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    this.renderMapTiles();

    if (this.currentMapData.altar) {
      const a = this.currentMapData.altar;
      if (a.active) { spriteManager.draw(this.ctx, 'item_sword_shrine', a.x, a.y); }
      else { spriteManager.draw(this.ctx, 'tile_cobble', a.x, a.y); }
    }

    for (let pickup of this.pickups) { pickup.draw(this.ctx); }
    for (let npc of this.npcs) { npc.draw(this.ctx); }
    for (let enemy of this.enemies) { enemy.draw(this.ctx); }
    if (this.boss && (this.bossActive || this.currentMapId === 'capital')) { this.boss.draw(this.ctx); }
    this.player.draw(this.ctx);

    for (let tree of (this.currentMapData.bigTrees || [])) {
      spriteManager.draw(this.ctx, 'tree_big', tree.x, tree.y);
    }
    this.ctx.restore();

    this.renderHUD();
    dialogueManager.draw(this.ctx, SCREEN_WIDTH, SCREEN_HEIGHT);

    if (this.fadeAlpha > 0) {
      this.ctx.fillStyle = `rgba(8, 10, 16, ${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    if (this.isGameOver) { this.renderGameOver(); }
    if (this.isVictory) { this.renderVictory(); }
  }

  renderMapTiles() {
    const layout = this.currentMapData.layout;
    if (!layout || layout.length === 0) return;

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

        if (char === 'T' || char === 'H' || char === 'S') {
          spriteManager.draw(this.ctx, 'tile_grass', c * TILE_SIZE, r * TILE_SIZE);
        }

        if (def && def.sprite) {
          spriteManager.draw(this.ctx, def.sprite, c * TILE_SIZE, r * TILE_SIZE);
        }

        if (def && def.topSprite) {
          spriteManager.draw(this.ctx, def.topSprite, c * TILE_SIZE, (r - 1) * TILE_SIZE);
        }
      }
    }
  }

  renderHUD() {
    const heartSpacing = 9;
    for (let i = 0; i < this.player.maxHearts; i++) {
      const sprite = (i < this.player.hearts) ? 'hud_heart_full' : 'hud_heart_empty';
      spriteManager.draw(this.ctx, sprite, 4 + (i * heartSpacing), 4);
    }

    let invX = SCREEN_WIDTH - 14;
    if (this.player.hasHat && dialogueManager.questState < QUEST_STATE.FOUND_HAT_SWORD) {
      spriteManager.draw(this.ctx, 'item_hat', invX, 2);
      invX -= 15;
    }
    if (this.player.hasSword) {
      spriteManager.draw(this.ctx, this.player.hasWhetstone ? 'item_sword_upgraded' : 'item_sword', invX, 2);
      invX -= 15;
    }
    if (this.player.hasShield) {
      spriteManager.draw(this.ctx, 'item_shield', invX, 2);
    }

    this.ctx.fillStyle = '#ffe454';
    this.ctx.font = '6px monospace';
    this.ctx.fillText(`💰:${this.player.coins}`, 4, 22);

    if (this.nearbyInteractable && !dialogueManager.isOpen) {
      const bx = this.player.x + 6 - this.camera.x;
      const by = this.player.y - 12 - this.camera.y;
      this.ctx.fillStyle = '#080a10';
      this.ctx.fillRect(bx - 7, by - 1, 14, 11);
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.fillText('! [E]', bx - 5, by + 7);
    }
  }

  renderGameOver() {
    this.ctx.fillStyle = 'rgba(8, 10, 16, 0.9)';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = '#c82838';
    this.ctx.font = '10px monospace';
    this.ctx.fillText('GAME OVER', 50, 50);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '7px monospace';
    this.ctx.fillText('Press [T] to Try Again', 28, 80);
  }

  renderVictory() {
    this.ctx.fillStyle = 'rgba(20, 26, 48, 0.95)';
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = '#ffe454';
    this.ctx.font = '9px monospace';
    this.ctx.fillText('VICTORY!', 55, 30);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '7px monospace';
    this.ctx.fillText('The kingdom is free!', 28, 60);
  }

  start() {
    const loop = () => {
      try {
        this.update();
        this.render();
      } catch (err) {
        console.error("Game loop error:", err);
        var el = document.getElementById('debug-error');
        if (!el) {
          el = document.createElement('div');
          el.id = 'debug-error';
          el.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#c82838;color:white;z-index:999999;font-size:13px;padding:14px;font-family:monospace;';
          document.body ? document.body.appendChild(el) : document.documentElement.appendChild(el);
        }
        el.innerHTML = '<strong>Game Loop Error:</strong> ' + err.message + '<br><pre style="font-size:10px;">' + (err.stack || '') + '</pre>';
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

function bootGame() {
  if (window.game) return;
  try {
    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'A',location:'game.js:bootGame',message:'boot start',data:{hasSpriteManager:typeof spriteManager,hasWORLD_MAPS:typeof WORLD_MAPS,hasAudio:typeof audioManager},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    window.game = new GameEngine();
    window.game.start();
    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'A',location:'game.js:bootGame',message:'boot success',data:{mapId:window.game.currentMapId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'A',location:'game.js:bootGame',message:'boot threw',data:{error:String(err&&err.message),stack:String(err&&err.stack).slice(0,500)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error("GameEngine failed to start:", err);
    var el = document.getElementById('debug-error');
    if (!el) {
      el = document.createElement('div');
      el.id = 'debug-error';
      el.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#c82838;color:white;z-index:999999;font-size:13px;padding:14px;font-family:monospace;';
      document.body ? document.body.appendChild(el) : document.documentElement.appendChild(el);
    }
    el.innerHTML = '<strong>Game Startup Error:</strong> ' + err.message;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
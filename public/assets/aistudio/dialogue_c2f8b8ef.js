// dialogue.js - Story Progression & Fixed Inventory Handlers

const QUEST_STATE = {
  NOT_STARTED: 0,
  SEARCHING_HAT: 1,
  FOUND_HAT_SWORD: 2,
  TALKED_AFTER_SWORD: 3,
  REACHED_TOWN: 4,
  HAS_SHIELD_AND_UPGRADE: 6,
  CONFRONTING_KING: 8,
  VICTORY_LIBERATION: 9
};

class DialogueSystem {
  constructor() {
    this.questState = QUEST_STATE.NOT_STARTED;
    this.isOpen = false;
    this.pages = [];
    this.currentPageIndex = 0;
    this.currentSpeaker = '';
    this.displayedText = '';
    this.fullText = '';
    this.charIndex = 0;
    this.typewriterTimer = 0;
    this.isPageComplete = false;
    this.onCompleteCallback = null;
    this.typeSpeed = 1.5;
    this.cursorBlinkTimer = 0;
  }

  startDialogue(pages, onComplete = null) {
    if (!pages || pages.length === 0) return;
    this.pages = pages;
    this.currentPageIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;
    this.loadPage(0);
    // #region agent log
    const sample = (pages[0] && pages[0].text) || '';
    fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'post-fix',hypothesisId:'G',location:'dialogue.js:startDialogue',message:'dialogue opened',data:{speaker:pages[0]&&pages[0].speaker,chars:sample.length,hasPortuguese:/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(sample),preview:String(sample).slice(0,90)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  loadPage(index) {
    const page = this.pages[index];
    this.currentSpeaker = page.speaker || '';
    this.fullText = page.text;
    this.displayedText = '';
    this.charIndex = 0;
    this.typewriterTimer = 0;
    this.isPageComplete = false;
    this._dbgWrapLogged = false;
  }

  wrapLines(ctx, text, maxWidth) {
    const paragraphs = String(text || '').split('\n');
    const lines = [];
    for (const para of paragraphs) {
      const words = para.split(' ');
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(test).width > maxWidth) {
          lines.push(line);
          if (ctx.measureText(word).width > maxWidth) {
            let chunk = '';
            for (const ch of word) {
              const next = chunk + ch;
              if (chunk && ctx.measureText(next).width > maxWidth) {
                lines.push(chunk);
                chunk = ch;
              } else {
                chunk = next;
              }
            }
            line = chunk;
          } else {
            line = word;
          }
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
    }
    return lines.length ? lines : [''];
  }

  advance() {
    if (!this.isOpen) return;
    if (!this.isPageComplete) {
      this.displayedText = this.fullText;
      this.charIndex = this.fullText.length;
      this.isPageComplete = true;
    } else {
      this.currentPageIndex++;
      if (this.currentPageIndex < this.pages.length) {
        this.loadPage(this.currentPageIndex);
      } else {
        this.close();
      }
    }
  }

  close() {
    this.isOpen = false;
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }

  update() {
    if (!this.isOpen) return;
    this.cursorBlinkTimer += 0.08;
    if (!this.isPageComplete) {
      this.typewriterTimer++;
      if (this.typewriterTimer >= this.typeSpeed) {
        this.typewriterTimer = 0;
        if (this.charIndex < this.fullText.length) {
          this.displayedText += this.fullText[this.charIndex];
          this.charIndex++;
          audioManager.playTextBlip();
        } else {
          this.isPageComplete = true;
        }
      }
    }
  }

  draw(ctx, screenW, screenH) {
    if (!this.isOpen) return;
    const innerW = screenW - 20;
    ctx.font = '7px monospace';
    const lines = this.wrapLines(ctx, this.displayedText, innerW);
    const lineH = 8;
    const boxH = Math.min(58, Math.max(40, 18 + lines.length * lineH));
    const boxY = screenH - boxH - 3, boxX = 4, boxW = screenW - 8;

    ctx.fillStyle = '#080a10';
    ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    let textStartY = boxY + 12;
    if (this.currentSpeaker) {
      ctx.font = '7px monospace';
      const nameW = Math.min(boxW - 8, ctx.measureText(this.currentSpeaker).width + 10);
      ctx.fillStyle = '#1f2638';
      ctx.fillRect(boxX + 4, boxY - 6, nameW, 10);
      ctx.fillStyle = '#ffe454';
      ctx.fillText(this.currentSpeaker, boxX + 8, boxY + 1);
      textStartY = boxY + 14;
    }

    ctx.fillStyle = '#080a10';
    ctx.font = '7px monospace';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], boxX + 6, textStartY + (i * lineH));
    }

    // #region agent log
    if (!this._dbgWrapLogged) {
      this._dbgWrapLogged = true;
      ctx.font = '7px monospace';
      const rawW = ctx.measureText(String(this.fullText || '').replace(/\n/g, ' ')).width;
      const wrapped = this.wrapLines(ctx, this.fullText, innerW);
      const maxLine = wrapped.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
      fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'post-fix',hypothesisId:'F',location:'dialogue.js:draw',message:'dialogue wrap metrics',data:{rawW,innerW,maxLine,lineCount:wrapped.length,overflowUnwrapped:rawW>innerW,overflowAfterWrap:maxLine>innerW,hasPortuguese:/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(this.fullText||'')},timestamp:Date.now()})}).catch(()=>{});
    }
    // #endregion
  }

  handleInteraction(interactable, game) {
    if (this.isOpen) { this.advance(); return; }
    if (!interactable) return;

    if (interactable.type === 'sign') {
      this.startDialogue([{ speaker: 'NOTICE', text: interactable.text }]);
      return;
    }

    if (interactable.type === 'altar') {
      this.handleAltarInteraction(game);
      return;
    }

    if (interactable.type === 'npc') {
      const npc = interactable.entity;
      if (npc.id === 'oldman') {
        this.handleOldManDialogue(game);
      } else if (npc.id === 'blacksmith') {
        this.handleBlacksmithDialogue(game);
      } else {
        this.startDialogue([{ speaker: npc.name, text: 'King Raymond IV has crushed our people with unjust taxes...' }]);
      }
    }
  }

  handleOldManDialogue(game) {
    if (this.questState === QUEST_STATE.NOT_STARTED) {
      this.startDialogue([
        { speaker: 'Elder Tobias', text: 'Hello, lad! I went berry-picking in the woods and left my straw hat behind.' },
        { speaker: 'Elder Tobias', text: 'Would you fetch it from the stone altar to the north? Watch for the boars!' }
      ], () => { this.questState = QUEST_STATE.SEARCHING_HAT; });
    } else if (this.questState === QUEST_STATE.FOUND_HAT_SWORD) {
      this.startDialogue([
        { speaker: 'Elder Tobias', text: 'My hat! Thank you, my boy!' },
        { speaker: 'Elder Tobias', text: 'Wait... that sword at your hip! It is the legendary Wind-Cleaver!' },
        { speaker: 'Young Hero', text: 'The sword chose me! I will go to Val-de-Loire and stand against the King\'s tyranny!' }
      ], () => {
        game.player.hasHat = false;
        this.questState = QUEST_STATE.TALKED_AFTER_SWORD;
        audioManager.playQuestDone();
      });
    } else {
      this.startDialogue([
        { speaker: 'Elder Tobias', text: 'May the winds guide your steel, young hero!' }
      ]);
    }
  }

  handleAltarInteraction(game) {
    if (this.questState < QUEST_STATE.FOUND_HAT_SWORD) {
      this.startDialogue([
        { speaker: 'Narrator', text: 'You found Tobias\'s straw hat and the legendary sword set in the stone!' },
        { speaker: 'SYSTEM', text: 'Obtained the Straw Hat and the Legendary Sword!' }
      ], () => {
        game.player.hasHat = true;
        game.player.hasSword = true;
        this.questState = QUEST_STATE.FOUND_HAT_SWORD;
        if (game.currentMapData.altar) game.currentMapData.altar.active = false;
        audioManager.playItemGet();
      });
    }
  }

  handleBlacksmithDialogue(game) {
    if (this.questState < QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
      if (window.playerHasRetrievedLedger) {
        this.startDialogue([
          { speaker: 'Master Pierre', text: 'You recovered the forge ledger! Take this Knight\'s Shield (hold [X] to guard) and let me hone your blade.' },
          { speaker: 'SYSTEM', text: 'Sword damage doubled (1 -> 2)! Shield obtained!' }
        ], () => {
          game.player.hasShield = true;
          game.player.upgradeSword();
          this.questState = QUEST_STATE.HAS_SHIELD_AND_UPGRADE;
        });
      } else {
        this.startDialogue([
          { speaker: 'Master Pierre', text: 'Greetings. Bandits stole my ledger on the King\'s orders. Defeat them and I will give you a shield!' }
        ], () => { this.questState = QUEST_STATE.REACHED_TOWN; });
      }
    } else {
      this.startDialogue([
        { speaker: 'Master Pierre', text: 'Use the shield with [X] against the corrupt knights!' }
      ]);
    }
  }

  triggerKingConfrontation(game) {
    this.startDialogue([
      { speaker: 'King Raymond IV', text: 'Who dares enter my citadel?! Prepare to die, insolent boy!' }
    ], () => { game.startBossBattle(); });
  }

  triggerVictoryEpilogue(game) {
    this.startDialogue([
      { speaker: 'Narrator', text: 'The tyrant is defeated. Peace and freedom have returned to the realm of Aethelgard.' }
    ], () => {
      this.questState = QUEST_STATE.VICTORY_LIBERATION;
      audioManager.playVictory();
      // #region agent log
      fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'C',location:'dialogue.js:triggerVictoryEpilogue',message:'victory callback',data:{hasTrigger:typeof game.triggerVictoryScreen,hasIsVictory:'isVictory' in game},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      game.triggerVictoryScreen();
    });
  }
}

const dialogueManager = new DialogueSystem();

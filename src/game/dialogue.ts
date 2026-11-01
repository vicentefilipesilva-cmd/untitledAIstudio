/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DialoguePage, QUEST_STATE, QuestLogItem, QuestStateType } from '../types/game';
import { audioManager } from './audio';
import { NearbyInteractable, Player } from './entities';
import { spriteManager } from './sprites';

export class DialogueSystem {
  public questState: QuestStateType = QUEST_STATE.NOT_STARTED;
  public isOpen = false;
  public pages: DialoguePage[] = [];
  public currentPageIndex = 0;
  public currentSpeaker = '';
  public displayedText = '';
  public fullText = '';
  public charIndex = 0;
  public typewriterTimer = 0;
  public isPageComplete = false;
  public onCompleteCallback: (() => void) | null = null;
  public typeSpeed = 1.4;
  public onCloseCallback: (() => void) | null = null;

  public questLog: QuestLogItem[] = [
    {
      id: 'hat_quest',
      title: "The Elder's Hat and the Stone Altar",
      act: 'Act I',
      location: "Le Hameau d'Oakhaven & Le Bois des Murmures",
      description: "Recover Tobias's straw hat forgotten near the ancient stone altar in the woods.",
      completed: false,
      reward: 'Wind-Cleaver Legendary Sword'
    },
    {
      id: 'flour_quest',
      title: "The Orphans' Flour",
      act: 'Act II',
      location: 'Aiguemorte',
      description: 'Defeat the garrison rogue to recover the confiscated flour bags for Madame Renée and the village orphans.',
      completed: false,
      reward: 'Route 1 Clearance & Gold Coins'
    },
    {
      id: 'forge_quest',
      title: 'The Silenced Forge and the Knight Shield',
      act: 'Act II',
      location: 'Val-de-Loire',
      description: 'Clear the bandit hideout on Route 1 to recover Maître Pierre’s stolen high-grade iron ore.',
      completed: false,
      reward: "Knight's Heater Shield [X] & Honed Blade (Damage 1 -> 2)"
    },
    {
      id: 'wine_quest',
      title: 'The Secret of the Confiscated Barrels',
      act: 'Act II',
      location: "Route 5 & Dijon (La Forêt d'Ombre)",
      description: 'Intercept the royal noble convoy in the dark woods to recover the vintage barrels and discover the King’s seal.',
      completed: false,
      reward: 'Royal Corruption Decree & Chemin Royal Gate Clearance'
    },
    {
      id: 'final_quest',
      title: 'The Shadow Over the Crown',
      act: 'Act III',
      location: 'Le Chemin Royal & Le Château Noir',
      description: 'Advance past the royal guard captains on the highway and defeat tyrant King Raymond IV in his citadel.',
      completed: false,
      reward: 'Liberation of Aethelgard & Peace'
    }
  ];

  public startDialogue(pages: DialoguePage[], onComplete: (() => void) | null = null) {
    if (!pages || pages.length === 0) return;
    this.pages = pages;
    this.currentPageIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;
    this.loadPage(0);
  }

  public loadPage(index: number) {
    const page = this.pages[index];
    this.currentSpeaker = page.speaker || '';
    this.fullText = page.text;
    this.displayedText = '';
    this.charIndex = 0;
    this.typewriterTimer = 0;
    this.isPageComplete = false;
  }

  public wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const paragraphs = String(text || '').split('\n');
    const lines: string[] = [];

    for (const para of paragraphs) {
      const words = para.split(' ');
      let line = '';
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (line && ctx.measureText(test).width > maxWidth) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
    }
    return lines.length ? lines : [''];
  }

  public advance() {
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

  public close() {
    this.isOpen = false;
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
    this.onCloseCallback?.();
  }

  public syncQuestLog() {
    const completionStates = [
      QUEST_STATE.TALKED_AFTER_SWORD,
      QUEST_STATE.ORPHAN_FLOUR_RESOLVED,
      QUEST_STATE.HAS_SHIELD_AND_UPGRADE,
      QUEST_STATE.HAS_ROYAL_DECREE_PROOF,
      QUEST_STATE.VICTORY_LIBERATION
    ];
    this.questLog.forEach((quest, index) => {
      quest.completed = this.questState >= completionStates[index];
    });
  }

  public cancel() {
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
  }

  public update() {
    if (!this.isOpen) return;
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

  private getSpeakerPortrait(speaker: string): string | null {
    const s = speaker.toLowerCase();
    if (s.includes('tobias') || s.includes('moine') || s.includes('scholar') || s.includes('citoyen')) return 'npc_oldman';
    if (s.includes('renée') || s.includes('baker')) return 'npc_baker';
    if (s.includes('pierre') || s.includes('blacksmith') || s.includes('maître')) return 'npc_blacksmith';
    if (s.includes('marc') || s.includes('vigneron') || s.includes('vintner')) return 'npc_vintner';
    if (s.includes('aldric') || s.includes('marchand') || s.includes('merchant')) return 'npc_merchant';
    if (s.includes('garde') || s.includes('guard') || s.includes('knight')) return 'npc_guard';
    if (s.includes('raymond') || s.includes('roi') || s.includes('king')) return 'boss_king_0';
    if (s.includes('hero') || s.includes('young') || s.includes('player')) return 'player_down_0';
    return null;
  }

  public draw(ctx: CanvasRenderingContext2D, screenW: number, screenH: number) {
    if (!this.isOpen) return;

    const portraitSprite = this.getSpeakerPortrait(this.currentSpeaker);
    const hasPortrait = Boolean(portraitSprite);

    const boxX = 6;
    const boxW = screenW - 12;
    const innerW = hasPortrait ? boxW - 46 : boxW - 16;
    const textStartX = hasPortrait ? boxX + 40 : boxX + 8;

    ctx.font = '9px sans-serif';
    const lines = this.wrapLines(ctx, this.displayedText, innerW);
    const lineH = 11;
    const minHeight = hasPortrait ? 50 : 40;
    const boxH = Math.min(70, Math.max(minHeight, 22 + lines.length * lineH));
    const boxY = screenH - boxH - 6;

    ctx.fillStyle = 'rgba(8, 10, 16, 0.58)';
    ctx.fillRect(boxX + 3, boxY + 3, boxW, boxH);
    ctx.fillStyle = '#080a10';
    ctx.fillRect(boxX - 2, boxY - 2, boxW + 4, boxH + 4);
    ctx.fillStyle = '#b58c45';
    ctx.fillRect(boxX - 1, boxY - 1, boxW + 2, boxH + 2);
    ctx.fillStyle = '#172538';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#e8c66a';
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);

    // Speaker Name Tag
    if (this.currentSpeaker) {
      ctx.font = 'bold 8px sans-serif';
      const nameW = Math.min(boxW - 12, ctx.measureText(this.currentSpeaker).width + 12);
      ctx.fillStyle = '#b58c45';
      ctx.fillRect(boxX + 6, boxY - 7, nameW, 11);
      ctx.fillStyle = '#101a2b';
      ctx.fillRect(boxX + 7, boxY - 6, nameW - 2, 9);
      ctx.fillStyle = '#ffe8a3';
      ctx.fillText(this.currentSpeaker, boxX + 11, boxY + 1);
    }

    // Portrait Frame
    if (hasPortrait && portraitSprite) {
      const portX = boxX + 6;
      const portY = boxY + 8;
      ctx.fillStyle = '#080a10';
      ctx.fillRect(portX - 2, portY - 2, 30, 30);
      ctx.fillStyle = '#c8a45c';
      ctx.fillRect(portX - 1, portY - 1, 28, 28);
      ctx.fillStyle = '#101a2b';
      ctx.fillRect(portX, portY, 26, 26);

      // Draw portrait sprite centered
      spriteManager.draw(ctx, portraitSprite, portX + 5, portY + 5);
    }

    // Dialogue text rendering
    const textStartY = boxY + 14;
    ctx.fillStyle = '#f4ecd8';
    ctx.font = '9px sans-serif';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], textStartX, textStartY + 2 + i * lineH);
    }

    // Animated continuation arrow
    if (this.isPageComplete) {
      const bounce = Math.floor(Date.now() / 250) % 2 === 0 ? 0 : 2;
      ctx.fillStyle = '#b45309';
      ctx.font = '8px monospace';
      ctx.fillText('▼', boxX + boxW - 12, boxY + boxH - 4 - bounce);
    }
  }

  // Interaction dispatcher
  public handleInteraction(
    interactable: NearbyInteractable,
    player: Player,
    onMapReceived?: () => void
  ) {
    if (this.isOpen) {
      this.advance();
      return;
    }

    if (interactable.type === 'sign') {
      this.startDialogue([{ speaker: 'NOTICE', text: interactable.text || '...' }]);
      return;
    }

    if (interactable.type === 'door') return;

    if (interactable.type === 'altar') {
      this.handleAltarInteraction(player);
      return;
    }

    if (interactable.type === 'npc' && interactable.entity) {
      const npc = interactable.entity;
      if (npc.id === 'oldman') {
        this.handleOldManDialogue(player);
      } else if (npc.id === 'village_guard') {
        this.handleVillageGuardDialogue();
      } else if (npc.id === 'baker_woman') {
        this.handleBakerDialogue(player);
      } else if (npc.id === 'town_guard') {
        if (!player.hasMap) {
          this.startDialogue(
            [
              { speaker: npc.name, text: 'You have a long road ahead, young traveler. This is a map of the kingdom and its safest roads.' },
              { speaker: npc.name, text: 'Keep it close. The route north from Aiguemorte leads to Val-de-Loire, and the roads beyond are marked too.' }
            ],
            () => {
              player.hasMap = true;
              audioManager.playItemGet();
              onMapReceived?.();
            }
          );
        } else {
          this.startDialogue([{ speaker: npc.name, text: 'Keep that map close. The royal roads grow more dangerous the farther north you travel.' }]);
        }
      } else if (npc.id === 'blacksmith') {
        this.handleBlacksmithDialogue(player);
      } else if (npc.id === 'merchant') {
        this.handleMerchantDialogue();
      } else if (npc.id === 'orleans_citizen') {
        this.startDialogue([{ speaker: "Le Citoyen d'Orléans", text: 'The lords in Le Château Noir bleed our lands dry. Word has it the King has forsaken his knightly oath.' }]);
      } else if (npc.id === 'tours_scholar') {
        this.startDialogue([{ speaker: 'Le Moine de Tours', text: 'Ancient scriptures foretold of a righteous youth who would raise the Wind-Cleaver to cleanse the throne of Aethelgard.' }]);
      } else if (npc.id === 'vintner') {
        this.handleVintnerDialogue(player);
      } else if (npc.id === 'cottage_resident') {
        this.startDialogue([{ speaker: npc.name, text: "I mend cloaks for the villagers. The roads are safer when neighbors look after one another." }]);
      } else if (npc.id === 'cottage_child') {
        this.startDialogue([{ speaker: npc.name, text: "I saw a bright sword shining in the forest! The old altar must be magic." }]);
      } else if (npc.id === 'innkeeper') {
        this.startDialogue([{ speaker: npc.name, text: "Welcome, traveler. Rest your feet, and remember: the north road leads into the Whispering Woods." }]);
      } else if (npc.id === 'traveler') {
        this.startDialogue([{ speaker: npc.name, text: "I came from Aiguemorte. The people there need brave friends more than they need gold." }]);
      } else if (npc.id === 'bakery_helper') {
        this.startDialogue([{ speaker: npc.name, text: "Madame Renée shares every loaf she can spare. The children have not forgotten her kindness." }]);
      } else if (npc.id === 'bakery_child') {
        this.startDialogue([{ speaker: npc.name, text: "When the flour is returned, Madame Renée promised we could bake bread for everyone!" }]);
      } else if (npc.id === 'town_resident') {
        this.startDialogue([{ speaker: npc.name, text: "The taxes grow heavier each season. We keep helping each other, even when the Crown will not." }]);
      } else if (npc.id === 'town_child') {
        this.startDialogue([{ speaker: npc.name, text: "I want to be a knight who protects people, not one who frightens them." }]);
      } else {
        this.startDialogue([{ speaker: npc.name, text: 'The Crown demands ever higher taxes. May God watch over our roads!' }]);
      }
    }
  }

  public handleVillageGuardDialogue() {
    if (this.questState === QUEST_STATE.NOT_STARTED) {
      this.startDialogue([
        { speaker: "Le Garde d'Oakhaven", text: 'Greetings, lad! Le Doyen Tobias is searching for you by his cottage.' }
      ]);
    } else if (this.questState === QUEST_STATE.SEARCHING_HAT) {
      this.startDialogue([
        { speaker: "Le Garde d'Oakhaven", text: 'The woods to the north are swarming with wild boars. Keep to the trail and be careful!' }
      ]);
    } else if (this.questState === QUEST_STATE.FOUND_HAT_SWORD) {
      this.startDialogue([
        { speaker: "Le Garde d'Oakhaven", text: 'Take the straw hat back to Le Doyen Tobias before leaving the village!' }
      ]);
    } else {
      this.startDialogue([
        { speaker: "Le Garde d'Oakhaven", text: 'The northern trail through the forest leads towards Aiguemorte and the Royal Highway. May your steel guide you true!' }
      ]);
    }
  }

  // Act I: Le Doyen Tobias & The Altar
  public handleOldManDialogue(player: Player) {
    // Safety check: ensure story gear is never lost after death / reload
    if (this.questState >= QUEST_STATE.FOUND_HAT_SWORD) {
      player.hasSword = true;
    }
    if (this.questState >= QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
      player.hasShield = true;
      player.hasWhetstone = true;
      player.swordDamage = Math.max(player.swordDamage, 2);
    }

    if (this.questState === QUEST_STATE.NOT_STARTED) {
      this.startDialogue(
        [
          { speaker: 'Le Doyen Tobias', text: 'Hello, young lad! I went berry-picking in the woods to the north and carelessly left my straw hat behind.' },
          { speaker: 'Le Doyen Tobias', text: 'Could you fetch it from the ancient stone altar in the woods? Watch out for the wild boars!' }
        ],
        () => {
          this.questState = QUEST_STATE.SEARCHING_HAT;
        }
      );
    } else if (this.questState === QUEST_STATE.SEARCHING_HAT) {
      this.startDialogue([
        { speaker: 'Le Doyen Tobias', text: 'The stone altar lies in the northwest corner of the forest. Please find my straw hat!' }
      ]);
    } else if (this.questState === QUEST_STATE.FOUND_HAT_SWORD) {
      this.startDialogue(
        [
          { speaker: 'Le Doyen Tobias', text: 'My hat! Thank you kindly, my boy!' },
          { speaker: 'Le Doyen Tobias', text: 'Wait... that blade at your side! It is the legendary Wind-Cleaver, relic of the realm’s ancient guardians!' },
          { speaker: 'Young Hero', text: 'The sword chose my wrist! I feel a calling to march towards the Capital and serve the realm.' },
          { speaker: 'Le Doyen Tobias', text: 'If you possess the courage to bear such steel, your place is no longer with the hoe. Journey north to Aiguemorte, and may the winds protect you!' }
        ],
        () => {
          player.hasHat = false;
          player.hasSword = true;
          this.questState = QUEST_STATE.TALKED_AFTER_SWORD;
          this.questLog[0].completed = true;
          audioManager.playQuestDone();
        }
      );
    } else {
      player.hasSword = true;
      this.startDialogue([
        { speaker: 'Le Doyen Tobias', text: 'The road to Aiguemorte and Val-de-Loire is open to the north through the woods. Honor your people!' }
      ]);
    }
  }

  public handleAltarInteraction(player: Player) {
    if (this.questState < QUEST_STATE.FOUND_HAT_SWORD) {
      player.hasHat = true;
      player.hasSword = true;
      this.questState = QUEST_STATE.FOUND_HAT_SWORD;
      this.startDialogue(
        [
          { speaker: 'Narrator', text: 'You found Tobias’s straw hat and an ancient sword embedded deep in the sacred stone!' },
          { speaker: 'SYSTEM', text: 'You drew the Legendary Wind-Cleaver from the stone! (Press [SPACE] or [Z] to slash)' }
        ],
        () => {
          audioManager.playItemGet();
        }
      );
    } else if (!player.hasSword) {
      // Re-grant sword if lost
      player.hasSword = true;
      this.startDialogue([
        { speaker: 'Stone Altar', text: 'The ancient spirits recognize your valor. The Wind-Cleaver returns to your grip!' }
      ], () => {
        audioManager.playItemGet();
      });
    } else {
      this.startDialogue([
        { speaker: 'Stone Altar', text: 'The stone pedestal rests in quiet reverence. The chosen blade travels with you.' }
      ]);
    }
  }

  // Act II: Aiguemorte - The Orphans' Flour
  public handleBakerDialogue(player: Player) {
    if (this.questState < QUEST_STATE.ORPHAN_FLOUR_QUEST) {
      this.startDialogue(
        [
          { speaker: 'Madame Renée', text: '...Please don’t strike me! Ah... you are not one of the crown’s enforcers?' },
          { speaker: 'Madame Renée', text: 'Royal taxmen seized all the flour meant for the village orphans under the guise of a "security tax"!' },
          { speaker: 'Madame Renée', text: 'One of the corrupt rogues is still lurking near the eastern battlements with the stolen flour bags...' }
        ],
        () => {
          this.questState = QUEST_STATE.ORPHAN_FLOUR_QUEST;
        }
      );
    } else if (player.hasFlour && this.questState === QUEST_STATE.ORPHAN_FLOUR_QUEST) {
      this.startDialogue(
        [
          { speaker: 'Madame Renée', text: 'The flour! The children will have warm bread this week! God bless your kind heart, lad!' },
          { speaker: 'Madame Renée', text: 'Take these coins and warm bread. The northern gate to Route 1 and Val-de-Loire is open!' }
        ],
        () => {
          player.hasFlour = false;
          player.coins += 15;
          player.heal(2);
          this.questState = QUEST_STATE.ORPHAN_FLOUR_RESOLVED;
          this.questLog[1].completed = true;
          audioManager.playQuestDone();
        }
      );
    } else if (this.questState === QUEST_STATE.ORPHAN_FLOUR_RESOLVED) {
      this.startDialogue([
        { speaker: 'Madame Renée', text: 'Thank you once more! Be wary of the noble knights in Val-de-Loire and Tours.' }
      ]);
    } else {
      this.startDialogue([
        { speaker: 'Madame Renée', text: 'Defeat the corrupt rogue by the eastern walls to recover the flour!' }
      ]);
    }
  }

  // Act II: Val-de-Loire - The Silenced Forge and the Shield
  public handleBlacksmithDialogue(player: Player) {
    if (this.questState >= QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
      player.hasShield = true;
      player.hasWhetstone = true;
      player.swordDamage = Math.max(player.swordDamage, 2);
      player.hasSword = true;
    }

    if (this.questState < QUEST_STATE.FORGE_LEDGER_QUEST) {
      this.startDialogue(
        [
          { speaker: 'Maître Pierre', text: 'My hearth is dark. A gang of highwaymen stole my shipment of special iron ore on Route 1...' },
          { speaker: 'Maître Pierre', text: 'Worse yet, the noble knights stood by and took bribes to look the other way!' },
          { speaker: 'Maître Pierre', text: 'Recover my iron, and I will forge you a Knight’s Heater Shield and hone your blade for the road ahead!' }
        ],
        () => {
          this.questState = QUEST_STATE.FORGE_LEDGER_QUEST;
        }
      );
    } else if (player.hasWhetstone || this.questState >= QUEST_STATE.HAS_SHIELD_AND_UPGRADE) {
      player.hasShield = true;
      this.startDialogue([
        { speaker: 'Maître Pierre', text: 'Your steel shield deflects all frontal attacks! Hold [X] or [SHIFT] to guard!' }
      ]);
    } else if (window.playerHasIronOre) {
      this.startDialogue(
        [
          { speaker: 'Maître Pierre', text: 'You brought the iron ore back! Let me kindle the coals and strike the anvil...' },
          { speaker: 'SYSTEM', text: 'Maître Pierre forged the Knight’s Shield (Hold [X] / [SHIFT] to Guard) and honed your blade (Damage doubled: 1 -> 2)!' }
        ],
        () => {
          window.playerHasIronOre = false;
          player.hasShield = true;
          player.upgradeSword();
          this.questState = QUEST_STATE.HAS_SHIELD_AND_UPGRADE;
          this.questLog[2].completed = true;
          audioManager.playSwordUpgrade();
        }
      );
    } else {
      this.startDialogue([
        { speaker: 'Maître Pierre', text: 'The stolen iron is with the bandit camp on Route 1 to the south!' }
      ]);
    }
  }

  // Act II: Trilha do Vinho - The Secret of the Confiscated Barrels
  public handleVintnerDialogue(player: Player) {
    if (this.questState < QUEST_STATE.WINE_TRAIL_REVEAL_QUEST) {
      this.startDialogue(
        [
          { speaker: 'Marc le Vigneron', text: 'They smashed my cart! Nobles from Le Château Noir confiscated our finest vintage under false claims of royal contraband!' },
          { speaker: 'Marc le Vigneron', text: 'They intend to resell it at exorbitant prices in the capital. Their armed escort fled into the dark woods of La Forêt d’Ombre!' }
        ],
        () => {
          this.questState = QUEST_STATE.WINE_TRAIL_REVEAL_QUEST;
        }
      );
    } else if (player.hasRoyalDecree) {
      this.startDialogue(
        [
          { speaker: 'Marc le Vigneron', text: 'You recovered the barrels! But... what is that parchment in your hands?' },
          { speaker: 'Young Hero', text: 'It is an imperial decree bearing the gold wax seal of King Raymond IV. He personally commanded the extortion of our villages!' },
          { speaker: 'Marc le Vigneron', text: 'The King himself?! Then the entire chivalry is rotten from the crown down... Let the truth be proclaimed on Le Chemin Royal!' }
        ],
        () => {
          player.hasRoyalDecree = false;
          player.hasWineBarrel = false;
          this.questState = QUEST_STATE.HAS_ROYAL_DECREE_PROOF;
          this.questLog[3].completed = true;
          audioManager.playQuestDone();
        }
      );
    } else {
      this.startDialogue([
        { speaker: 'Marc le Vigneron', text: 'Intercept the corrupt noble convoy in La Forêt d’Ombre to the east!' }
      ]);
    }
  }

  public handleMerchantDialogue() {
    this.startDialogue([
      { speaker: 'Aldric le Marchand', text: 'Greetings, traveler! I carry supplies from the grand cities. Keep your honor untarnished by the court’s greed.' }
    ]);
  }

  // Act III: Climax confrontation & Victory
  public triggerKingConfrontation(onStartBattle: () => void) {
    this.startDialogue(
      [
        { speaker: 'Le Roi Raymond IV', text: 'Who dares defile my throne room in peasant rags?!' },
        { speaker: 'Young Hero', text: 'I stand for the people of Oakhaven, Aiguemorte, and the vineyards! Your tyrannical decree exploited the weak and disgraced true chivalry!' },
        { speaker: 'Le Roi Raymond IV', text: 'Insolent whelp! The Crown takes what it desires, and any who defy it are crushed beneath royal steel! Prepare to die!' }
      ],
      () => {
        this.questState = QUEST_STATE.CONFRONTING_KING;
        onStartBattle();
      }
    );
  }

  public triggerVictoryEpilogue(onVictoryScreen: () => void) {
    this.startDialogue(
      [
        { speaker: 'Le Roi Raymond IV', text: 'How... how could a mere commoner break through the Crown’s guard...?!' },
        { speaker: 'Narrator', text: 'The legendary sword glows with radiant pure light. The tyranny of Raymond IV has ended.' },
        { speaker: 'Narrator', text: 'The youth rejects the corrupted mantle of noble flattery, taking up the mantle of Protector of the People!' },
        { speaker: 'Narrator', text: 'From the fields of Oakhaven to the halls of Le Château Noir, a new era of freedom and justice dawns across Aethelgard!' }
      ],
      () => {
        this.questState = QUEST_STATE.VICTORY_LIBERATION;
        this.questLog[4].completed = true;
        audioManager.playVictory();
        onVictoryScreen();
      }
    );
  }
}

declare global {
  interface Window {
    playerHasIronOre?: boolean;
  }
}

export const dialogueManager = new DialogueSystem();

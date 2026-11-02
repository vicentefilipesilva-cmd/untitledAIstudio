/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BESTIARY_ENTRIES } from '../game/bestiary';
import { dialogueManager } from '../game/dialogue';
import { GameEngine } from '../game/engine';
import { spriteManager } from '../game/sprites';
import { BestiaryEntryId } from '../types/game';

type JournalTab = 'quests' | 'bestiary';

interface QuestJournalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine | null;
  activeTab: JournalTab;
  onSwitchTab: (tab: JournalTab) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'ACTIVE',
  ready: 'READY TO TURN IN',
  completed: 'COMPLETED'
};

const BESTIARY_SPRITES: Record<BestiaryEntryId, string> = {
  boar: 'enemy_boar_0',
  wolf: 'enemy_wolf_0',
  bandit: 'enemy_bandit_0',
  corrupt_knight: 'enemy_corrupt_knight_0',
  king: 'boss_king_0'
};

const EnemyPortrait: React.FC<{ enemyId: BestiaryEntryId }> = ({ enemyId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    spriteManager.draw(context, BESTIARY_SPRITES[enemyId], 8, 8, 2);
  }, [enemyId]);

  return <canvas ref={canvasRef} width={64} height={64} className="h-16 w-16 image-rendering-pixelated" aria-hidden="true" />;
};

export const QuestJournal: React.FC<QuestJournalProps> = ({
  isOpen,
  onClose,
  engine,
  activeTab,
  onSwitchTab
}) => {
  const [selectedEnemy, setSelectedEnemy] = useState<BestiaryEntryId>('boar');
  if (!isOpen) return null;

  const quests = dialogueManager.questLog;
  const selectedEntry = BESTIARY_ENTRIES.find(entry => entry.id === selectedEnemy) ?? BESTIARY_ENTRIES[0];
  const defeatedCount = dialogueManager.bestiaryDefeats[selectedEntry.id] ?? 0;
  const unlockedEnemies = BESTIARY_ENTRIES.filter(entry => (dialogueManager.bestiaryDefeats[entry.id] ?? 0) > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080b13]/90 p-3 font-mono text-[#e8e4c9] sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="journal-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col border-4 border-[#d6a94f] bg-[#171c2c] p-1 shadow-[0_0_0_4px_#59452b,8px_8px_0_8px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-center justify-between border-b-2 border-[#59452b] bg-[#242b40] px-4 py-3">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#c8aa65]">FIELD RECORDS // AETHELGARD</p>
            <h2 id="journal-title" className="mt-1 text-lg font-bold tracking-wider text-[#f4d276] sm:text-xl">
              ADVENTURER&apos;S JOURNAL
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close journal"
            className="border-2 border-[#856a3d] bg-[#171c2c] px-3 py-1 text-lg font-bold text-[#f4d276] hover:bg-[#343c53]"
          >
            X
          </button>
        </div>

        <div className="grid grid-cols-2 border-b-2 border-[#59452b] bg-[#111624]">
          {(['quests', 'bestiary'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => onSwitchTab(tab)}
              aria-pressed={activeTab === tab}
              className={`border-r border-[#59452b] px-3 py-3 text-xs font-bold tracking-[0.2em] last:border-r-0 sm:text-sm ${
                activeTab === tab
                  ? 'bg-[#d6a94f] text-[#171c2c]'
                  : 'text-[#b5b6b0] hover:bg-[#252d40] hover:text-[#f4d276]'
              }`}
            >
              {activeTab === tab ? '▶ ' : ''}[ {tab.toUpperCase()} ]
            </button>
          ))}
        </div>

        {activeTab === 'quests' ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#59452b] pb-3 text-[10px] uppercase tracking-wider text-[#c8aa65]">
              <span>Current location: <strong className="text-[#f4d276]">{engine?.currentMapData.name ?? 'Unknown'}</strong></span>
              <span>Gold: <strong className="text-[#f4d276]">{engine?.player.coins ?? 0}</strong></span>
            </div>
            <div className="space-y-2">
              {quests.map(quest => {
                const discovered = quest.discovered === true;
                const status = discovered ? STATUS_LABELS[quest.status ?? 'active'] : 'UNDISCOVERED';
                return (
                  <article
                    key={quest.id}
                    className={`border-2 p-3 ${
                      !discovered
                        ? 'border-[#34394a] bg-[#111624] text-[#777d8c]'
                        : quest.completed
                          ? 'border-[#557657] bg-[#15231f]'
                          : 'border-[#6f5933] bg-[#202437]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className={`text-sm font-bold ${discovered ? 'text-[#f4d276]' : 'tracking-[0.2em]'}`}>
                        {discovered ? quest.title : '???'}
                      </h3>
                      <span className="border border-current px-2 py-1 text-[9px] font-bold tracking-wider">
                        {status}
                      </span>
                    </div>
                    {!discovered ? (
                      <p className="mt-2 text-xs">Speak to local inhabitants to discover this quest.</p>
                    ) : (
                      <>
                        <dl className="mt-2 grid gap-x-4 gap-y-1 text-[10px] sm:grid-cols-2">
                          <div><dt className="inline text-[#9da3b0]">LOCATION: </dt><dd className="inline text-[#e8e4c9]">{quest.location}</dd></div>
                          <div><dt className="inline text-[#9da3b0]">GIVER: </dt><dd className="inline text-[#e8e4c9]">{quest.giver}</dd></div>
                        </dl>
                        <p className="mt-2 text-xs leading-relaxed text-[#d3d2c5]">{quest.description}</p>
                        {quest.objective && (
                          <p className="mt-2 border-l-2 border-[#d6a94f] pl-2 text-[10px] leading-relaxed text-[#c8aa65]">
                            OBJECTIVE: {quest.objective}
                          </p>
                        )}
                        {quest.reward && (
                          <p className="mt-2 text-[10px] text-[#92b88a]">REWARD: {quest.reward}</p>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[minmax(150px,0.85fr)_1.5fr]">
            <nav aria-label="Enemy entries" className="min-h-0 overflow-y-auto border-b-2 border-[#59452b] bg-[#111624] p-2 sm:border-b-0 sm:border-r-2">
              <p className="px-2 py-2 text-[10px] tracking-wider text-[#c8aa65]">
                REVEALED: {unlockedEnemies}/{BESTIARY_ENTRIES.length}
              </p>
              {BESTIARY_ENTRIES.map(entry => {
                const isUnlocked = (dialogueManager.bestiaryDefeats[entry.id] ?? 0) > 0;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEnemy(entry.id)}
                    aria-pressed={selectedEnemy === entry.id}
                    className={`mb-1 block w-full border px-2 py-2 text-left text-xs ${
                      selectedEnemy === entry.id
                        ? 'border-[#d6a94f] bg-[#343149] text-[#f4d276]'
                        : 'border-transparent text-[#c5c6bf] hover:border-[#59452b] hover:bg-[#202437]'
                    }`}
                  >
                    {selectedEnemy === entry.id ? '▶ ' : '  '}
                    {isUnlocked ? entry.name : '???'}
                  </button>
                );
              })}
            </nav>

            <div className="min-h-0 overflow-y-auto p-5">
              {defeatedCount > 0 ? (
                <>
                  <p className="text-[10px] tracking-[0.3em] text-[#c8aa65]">CREATURE RECORD</p>
                  <h3 className="mt-2 text-xl font-bold text-[#f4d276]">{selectedEntry.name}</h3>
                  <div className="my-4 flex h-28 items-center justify-center border-2 border-dashed border-[#59452b] bg-[#111624]">
                    <EnemyPortrait enemyId={selectedEntry.id} />
                  </div>
                  <p className="text-sm leading-relaxed text-[#d3d2c5]">{selectedEntry.description}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
                    <div className="border border-[#59452b] bg-[#111624] p-3">
                      <dt className="text-[10px] tracking-wider text-[#9da3b0]">HEALTH</dt>
                      <dd className="mt-1 text-lg font-bold text-[#e88378]">{selectedEntry.hp} HP</dd>
                    </div>
                    <div className="border border-[#59452b] bg-[#111624] p-3">
                      <dt className="text-[10px] tracking-wider text-[#9da3b0]">DAMAGE</dt>
                      <dd className="mt-1 text-lg font-bold text-[#e88378]">{selectedEntry.damage}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[10px] text-[#9da3b0]">DEFEATED: {defeatedCount}</p>
                </>
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
                  <span className="text-5xl text-[#777d8c]">???</span>
                  <p className="mt-4 max-w-xs text-xs leading-relaxed text-[#a5a9b2]">
                    This record is sealed. Defeat at least one of this enemy to reveal its entry.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#59452b] bg-[#111624] px-4 py-3 text-[9px] tracking-wider text-[#a5a9b2] sm:text-[10px]">
          <span>← / → SWITCH SECTION</span>
          <span>J / TAB CLOSE</span>
          <button type="button" onClick={onClose} className="border border-[#856a3d] px-3 py-1 text-[#f4d276] hover:bg-[#343c53]">
            CLOSE
          </button>
        </footer>
      </section>
    </div>
  );
};

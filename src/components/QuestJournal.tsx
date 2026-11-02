/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { dialogueManager } from '../game/dialogue';
import { GameEngine } from '../game/engine';

interface QuestJournalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine | null;
}

export const QuestJournal: React.FC<QuestJournalProps> = ({ isOpen, onClose, engine }) => {
  if (!isOpen) return null;

  const player = engine?.player;
  const currentMap = engine?.currentMapData;
  const quests = dialogueManager.questLog;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-600/60 rounded-xl shadow-2xl p-6 text-slate-200 font-sans max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-lg font-bold tracking-wide text-amber-400 uppercase">
              Aethelgard Adventure Journal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Current Location & Equipment Status */}
        <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 mb-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">Current Location:</span>
            <span className="text-amber-300 font-medium">{currentMap?.name || 'Kingdom of Aethelgard'}</span>
            <span className="text-slate-500 block text-[10px] mt-0.5">{currentMap?.region}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">Arsenal & Gold:</span>
            <div className="flex flex-wrap gap-1 text-[11px]">
              <span className={`px-1.5 py-0.5 rounded ${player?.hasSword ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'text-slate-500'}`}>
                {player?.hasWhetstone ? '⚔️ Honed Blade (2 Damage)' : player?.hasSword ? '⚔️ Wind-Cleaver (1 Damage)' : 'No Weapon'}
              </span>
              {player?.hasShield && (
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700">
                  🛡️ Knight Shield [X]
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                💰 {player?.coins || 0} Coins
              </span>
            </div>
          </div>
        </div>

        {/* Quests List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Main & Side Quests
          </h3>

          {quests.map(quest => (
            <div
              key={quest.id}
              className={`p-3 rounded-lg border text-xs ${
                quest.completed
                  ? 'bg-emerald-950/20 border-emerald-800/40'
                  : quest.status === 'ready'
                    ? 'bg-amber-950/30 border-amber-700/70'
                  : 'bg-slate-800/60 border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{quest.completed ? '✅' : quest.status === 'ready' ? '🎁' : '⏳'}</span>
                  {quest.title}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  quest.completed ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {quest.completed ? 'COMPLETED' : quest.status?.toUpperCase() || quest.act}
                </span>
              </div>
              
              <div className="text-[11px] text-slate-400 mb-1.5">
                📍 <span className="text-slate-300">{quest.location}</span>
              </div>
              <p className="text-slate-300 leading-relaxed mb-2 text-[11px]">
                {quest.description}
              </p>

              {quest.objective && (
                <p className={`leading-relaxed mb-2 text-[11px] ${
                  quest.status === 'ready' ? 'text-amber-300' : 'text-slate-400'
                }`}>
                  Objective: {quest.objective}
                </p>
              )}

              {quest.reward && (
                <div className="text-[10px] text-amber-400/90 font-mono bg-black/40 rounded px-2 py-1">
                  🎁 Reward: {quest.reward}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer controls tip */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400 flex justify-between items-center">
          <span>Press <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-amber-300">TAB</kbd> or <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-amber-300">J</kbd> to close</span>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs"
          >
            Close Journal
          </button>
        </div>

      </div>
    </div>
  );
};

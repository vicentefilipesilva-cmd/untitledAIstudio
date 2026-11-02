/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { GBAConsole } from './components/GBAConsole';
import { MapBlueprintModal } from './components/MapBlueprintModal';
import { QuestJournal } from './components/QuestJournal';
import { audioManager } from './game/audio';
import { GameEngine } from './game/engine';

export default function App() {
  const appRootRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [scanlinesActive, setScanlinesActive] = useState(true);
  const [journalOpen, setJournalOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [hasMap, setHasMap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');

  useEffect(() => {
    const updateFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === appRootRef.current);
    };
    const handleFullscreenExit = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement === appRootRef.current) {
        void document.exitFullscreen().catch(error => {
          setFullscreenError(error instanceof Error ? error.message : 'Could not leave fullscreen mode.');
        });
      }
    };
    document.addEventListener('fullscreenchange', updateFullscreen);
    window.addEventListener('keydown', handleFullscreenExit);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreen);
      window.removeEventListener('keydown', handleFullscreenExit);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    setFullscreenError('');
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (appRootRef.current?.requestFullscreen) {
        await appRootRef.current.requestFullscreen();
      } else {
        setFullscreenError('Fullscreen is not supported by this browser.');
      }
    } catch (error) {
      setFullscreenError(error instanceof Error ? error.message : 'Could not change fullscreen mode.');
    }
  }, []);

  const toggleMusic = () => {
    audioManager.init();
    const state = audioManager.toggleMusic();
    setMusicOn(state);
  };

  const toggleFilter = () => {
    setScanlinesActive(prev => !prev);
  };

  const toggleJournal = useCallback(() => {
    setJournalOpen(isOpen => !isOpen);
    setMapOpen(false);
  }, []);
  const toggleMap = useCallback(() => {
    setHasMap(Boolean(engineRef.current?.player.hasMap));
    setMapOpen(isOpen => !isOpen);
    setJournalOpen(false);
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.isPaused = journalOpen || mapOpen;
    if (engine.isPaused) engine.releaseInputs();
  }, [journalOpen, mapOpen]);

  const handleRestart = () => {
    if (window.confirm("Are you sure you want to restart your adventure from Le Hameau d'Oakhaven?")) {
      engineRef.current?.restartGame();
    }
  };

  return (
    <div ref={appRootRef} className="app-shell min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar Contract (Clean 3-zone Header) */}
      <header className="app-header flex items-center justify-between gap-6 px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">⚔️</span>
          <span className="text-base font-bold tracking-tight text-amber-400 whitespace-nowrap">
            Legend of the Chivalric Fall
          </span>
          <span className="text-[10px] text-indigo-400 font-mono hidden sm:inline font-bold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60">
            GBA-Inspired Pixel Adventure
          </span>
        </div>

        {/* Zone 2: Navigation & Utility Controls */}
        <nav className="flex items-center gap-2 sm:gap-3 text-xs">
          <button
            onClick={toggleMusic}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap ${
              musicOn
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>{musicOn ? '🎵' : '🔇'}</span>
            <span>Music: {musicOn ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={toggleFilter}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap ${
              scanlinesActive
                ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/80 hover:bg-indigo-900/60'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>📺</span>
            <span>TFT Filter: {scanlinesActive ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={toggleJournal}
            className="px-3 py-1.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap"
          >
            <span>📜</span>
            <span>Journal (SELECT)</span>
          </button>

          <button
            onClick={toggleMap}
            className="px-3 py-1.5 rounded-lg bg-blue-950/40 text-blue-300 border border-blue-800/80 hover:bg-blue-900/60 transition-colors flex items-center gap-1.5 font-medium whitespace-nowrap"
          >
            <span>🗺️</span>
            <span>Map (START)</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 text-xs font-semibold text-slate-100 bg-indigo-700 hover:bg-indigo-600 rounded-lg border border-indigo-500 transition-colors whitespace-nowrap"
            title="Play fullscreen (press Esc to leave)"
          >
            Fullscreen
          </button>
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            title="Restart adventure from the beginning"
          >
            Restart
          </button>
        </div>
      </header>
      {fullscreenError && (
        <p role="alert" className="px-4 py-2 text-sm text-rose-300 bg-rose-950/60">
          Fullscreen could not be changed: {fullscreenError}
        </p>
      )}

      {/* Main Content Area */}
      <main className="app-main flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 gap-8 max-w-7xl mx-auto w-full">
        
        <GBAConsole
          engineRef={engineRef}
          scanlinesActive={scanlinesActive}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onOpenJournal={toggleJournal}
          onOpenMap={toggleMap}
          isOverlayOpen={journalOpen || mapOpen}
        />

        {/* Companion Adventure Guide & Story Details */}
        <div className="game-guide w-full max-w-xl flex flex-col gap-5">
          
          {/* Story Intro Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🛡️</span>
              <h2 className="text-sm font-bold tracking-wide text-amber-400 uppercase">
                The Kingdom of Aethelgard & The Chivalric Fall
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Born in <strong>Le Hameau d'Oakhaven</strong>, your lifelong dream was to serve in the royal court as a knight of honor. Upon drawing the legendary <em>Wind-Cleaver</em> from the stone altar in <strong>Le Bois des Murmures</strong>, your journey takes you toward the capital. But what you discover throughout the towns of France is not chivalric honor, but brutal extortion ordered by <strong>Le Roi Raymond IV</strong> himself.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold block">Act I</span>
                <span className="text-slate-400">Village & Altar</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold block">Act II</span>
                <span className="text-slate-400">Towns & Forests</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-amber-400 font-bold block">Act III</span>
                <span className="text-slate-400">Le Château Noir</span>
              </div>
            </div>
          </div>

          {/* Controls Guide Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
              <span>⌨️</span>
              <span>Computer Controls</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Movement & Shield */}
              <div className="space-y-2.5">
                <div>
                  <strong className="text-slate-200 block mb-1">Move:</strong>
                  <div className="flex gap-1 font-mono text-[11px]">
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-amber-300">W</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-amber-300">A</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-amber-300">S</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-amber-300">D</span>
                    <span className="text-slate-500 self-center">or Arrows</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Move in any direction with your keyboard.
                  </span>
                </div>

                <div>
                  <strong className="text-slate-200 block mb-1">Shield / Dash:</strong>
                  <div className="flex gap-1 font-mono text-[11px]">
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-blue-300">Q</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-blue-300">L</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-blue-300">X</span>
                    <span className="text-slate-500 self-center">Dash:</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-blue-300">SHIFT</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-blue-300">C</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Hold X, Q, or L to block. Press Shift or C to dash.
                  </span>
                </div>
              </div>

              {/* Attack & Interact */}
              <div className="space-y-2.5">
                <div>
                  <strong className="text-slate-200 block mb-1">Attack:</strong>
                  <div className="flex gap-1 font-mono text-[11px]">
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-rose-300">SPACE</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-rose-300">Z</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-rose-300">R</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Fight with your sword and strike marked switches in order.
                  </span>
                </div>

                <div>
                  <strong className="text-slate-200 block mb-1">Talk / Interact:</strong>
                  <div className="flex gap-1 font-mono text-[11px]">
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-purple-300">E</span>
                    <span className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-purple-300">ENTER</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Talk, enter houses, pull levers, open chests, or push blocks onto plates.
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Side Quests Highlights */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-400">Notable Side Quests:</span>
              <button
                onClick={toggleJournal}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                View All Quests &raquo;
              </button>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              <li>🥖 <strong>The Orphans' Flour:</strong> Assist Madame Renée in Aiguemorte by recovering food from garrison rogues. In towns, guards remain peaceful unless provoked!</li>
              <li>⚒️ <strong>The Silenced Forge:</strong> Recover Maître Pierre's iron ore on Route 1 to earn the Knight Shield and 2x blade damage!</li>
              <li>🍇 <strong>The Secret of the Barrels:</strong> Uncover King Raymond IV's wax seal decree in the dark woods of Dijon.</li>
            </ul>
          </div>

        </div>

      </main>

      {/* Modals */}
      <QuestJournal
        isOpen={journalOpen}
        onClose={() => setJournalOpen(false)}
        engine={engineRef.current}
      />

      <MapBlueprintModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        currentMapId={engineRef.current?.currentMapId || 'village'}
        hasMap={hasMap}
      />

    </div>
  );
}

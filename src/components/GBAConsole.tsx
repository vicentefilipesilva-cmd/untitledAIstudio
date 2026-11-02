/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';

interface GBAConsoleProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  scanlinesActive: boolean;
  isFullscreen: boolean;
  isOverlayOpen: boolean;
  isJournalOpen: boolean;
  onToggleFullscreen: () => void;
  onOpenJournal: () => void;
  onSwitchJournalTab: (direction: 'left' | 'right') => void;
  onOpenMap: () => void;
}

export const GBAConsole: React.FC<GBAConsoleProps> = ({
  engineRef,
  scanlinesActive,
  isFullscreen,
  isOverlayOpen,
  isJournalOpen,
  onToggleFullscreen,
  onOpenJournal,
  onSwitchJournalTab,
  onOpenMap
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onOpenJournalRef = useRef(onOpenJournal);
  const onOpenMapRef = useRef(onOpenMap);
  const isOverlayOpenRef = useRef(isOverlayOpen);
  const isJournalOpenRef = useRef(isJournalOpen);
  const onSwitchJournalTabRef = useRef(onSwitchJournalTab);

  useEffect(() => {
    onOpenJournalRef.current = onOpenJournal;
    onOpenMapRef.current = onOpenMap;
    isOverlayOpenRef.current = isOverlayOpen;
    isJournalOpenRef.current = isJournalOpen;
    onSwitchJournalTabRef.current = onSwitchJournalTab;
  }, [isOverlayOpen, isJournalOpen, onOpenJournal, onOpenMap, onSwitchJournalTab]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat && ['shift', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      const lower = e.key.toLowerCase();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'Tab' || lower === 'j') {
        e.preventDefault();
        if (!e.repeat) onOpenJournalRef.current();
        return;
      }
      if (isJournalOpenRef.current && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!e.repeat) onSwitchJournalTabRef.current(e.key === 'ArrowLeft' ? 'left' : 'right');
        return;
      }
      if (lower === 'm' && !engine.isGameOver) {
        e.preventDefault();
        if (!e.repeat) onOpenMapRef.current();
        return;
      }
      if (isOverlayOpenRef.current) {
        engine.releaseInputs();
        return;
      }
      engine.handleKeyDown(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => engine.handleKeyUp(e.key);
    const handleBlur = () => engine.releaseInputs();
    const handleVisibilityChange = () => {
      if (document.hidden) engine.releaseInputs();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      engine.stop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <section className={`game-stage ${isFullscreen ? 'game-stage-fullscreen' : ''}`} aria-label="Game screen">
      <div className="game-screen-wrap">
        <canvas
          ref={canvasRef}
          className="game-screen image-rendering-pixelated"
          onClick={() => engineRef.current?.handleActionPress('interact')}
          aria-label="Legend of the Chivalric Fall game. Use WASD or arrow keys to move."
          title="Click to interact; use WASD or arrow keys to move"
        />
        {scanlinesActive && (
          <div
            className="game-scanlines"
            aria-hidden="true"
            style={{
              backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.28) 50%)',
              backgroundSize: '100% 4px'
            }}
          />
        )}
        <div className={`game-screen-controls ${isFullscreen ? 'game-screen-controls-fullscreen' : ''}`}>
          <button type="button" onClick={onOpenJournal} title="Open journal (J)">
            Journal <kbd>J</kbd>
          </button>
          <button type="button" onClick={onOpenMap} title="Open map (M)">
            Map <kbd>M</kbd>
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Leave fullscreen (Esc)' : 'Play fullscreen'}
          >
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>
      {!isFullscreen && (
        <p className="game-controls-hint">
          Move: WASD / arrows <span>·</span> Interact: E / Enter <span>·</span> Attack: Space / Z <span>·</span> Journal: J / Tab <span>·</span> Fullscreen: button above
        </p>
      )}
    </section>
  );
};

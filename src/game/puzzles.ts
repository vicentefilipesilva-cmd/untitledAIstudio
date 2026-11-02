/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapData, PuzzleDefinition, PuzzleProgress } from '../types/game';

export function getPuzzleProgress(mapData: MapData, puzzle: PuzzleDefinition): PuzzleProgress {
  const progress = mapData.puzzleProgress ?? (mapData.puzzleProgress = {});
  return progress[puzzle.id] ?? (progress[puzzle.id] = {
    solved: false,
    sequence: [],
    block: puzzle.block ? { ...puzzle.block } : undefined,
    chestClaimed: false
  });
}

export function completePuzzle(
  mapData: MapData,
  puzzle: PuzzleDefinition,
  progress = getPuzzleProgress(mapData, puzzle)
) {
  progress.solved = true;
  progress.sequence = [];
  openPuzzleBarriers(mapData, puzzle);
}

export function sealPuzzleBarriers(mapData: MapData, puzzle: PuzzleDefinition) {
  setPuzzleBarrierTile(mapData, puzzle, 'M');
}

export function openPuzzleBarriers(mapData: MapData, puzzle: PuzzleDefinition) {
  setPuzzleBarrierTile(mapData, puzzle, 'D');
}

function setPuzzleBarrierTile(mapData: MapData, puzzle: PuzzleDefinition, tile: 'D' | 'M') {
  for (const point of puzzle.barriers) {
    const row = mapData.layout[point.y];
    if (!row || point.x < 0 || point.x >= row.length) continue;
    const tiles = row.split('');
    tiles[point.x] = tile;
    mapData.layout[point.y] = tiles.join('');
  }
}

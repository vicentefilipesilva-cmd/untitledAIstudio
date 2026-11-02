/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapData, NPCData, TILE_SIZE, TileDef } from '../types/game';

export const TILE_DEFS: Record<string, TileDef> = {
  '.': { name: 'grass', sprite: 'tile_grass', solid: false },
  'F': { name: 'flowers', sprite: 'tile_grass_flowers', solid: false },
  'D': { name: 'dirt', sprite: 'tile_dirt', solid: false },
  'C': { name: 'cobble', sprite: 'tile_cobble', solid: false },
  // Rivers / canals — always impassable (bridge tiles stay C/D and remain walkable)
  'W': { name: 'water', sprite: 'tile_water', solid: true },
  'T': { name: 'tree_trunk', sprite: 'tile_tree_trunk', topSprite: 'tile_tree_top', solid: true },
  'H': { name: 'fence', sprite: 'tile_fence', solid: true },
  'R': { name: 'slate_roof', sprite: 'tile_roof_slate', solid: true },
  'L': { name: 'timber_wall', sprite: 'tile_wall_timber', solid: true },
  'I': { name: 'timber_window', sprite: 'tile_wall_window', solid: true },
  'E': { name: 'gothic_door', sprite: 'tile_door_gothic', solid: false },
  'S': { name: 'sign', sprite: 'tile_sign', solid: true, interactable: 'sign' },
  'M': { name: 'gothic_stone_wall', sprite: 'tile_gothic_stone', solid: true },
  'N': { name: 'royal_banner', sprite: 'tile_banner', solid: true },
  'P': { name: 'stained_glass', sprite: 'tile_stained_glass', solid: true },
  'K': { name: 'royal_throne', sprite: 'tile_royal_throne', solid: true },
  'V': { name: 'red_carpet', sprite: 'tile_carpet', solid: false },
  'Y': { name: 'blacksmith_anvil', sprite: 'tile_anvil', solid: true, interactable: 'anvil' },
  'A': { name: 'ancient_altar', sprite: 'item_sword_shrine', solid: true, interactable: 'altar' },
  'G': { name: 'vineyard', sprite: 'tile_vineyard', solid: true },
  'X': { name: 'village fountain', sprite: 'tile_fountain', solid: true },
  'Z': { name: 'mossy standing stone', sprite: 'tile_standing_stone', solid: true },
  '?': { name: 'Aiguemorte lighthouse', sprite: 'tile_lighthouse', solid: true },
  'J': { name: 'Orléans market stall', sprite: 'tile_market_stall', solid: true },
  '!': { name: 'Tours bell tower', sprite: 'tile_bell_tower', solid: true },
  'O': { name: 'oak_floor', sprite: 'tile_oak_floor', solid: false },
  'B': { name: 'bed', sprite: 'tile_bed', solid: true },
  'U': { name: 'bookshelf', sprite: 'tile_bookshelf', solid: true },
  'Q': { name: 'table', sprite: 'tile_house_table', solid: true }
};

const createHouseInterior = (
  id: string,
  name: string,
  returnMap: string,
  outsideDoorX: number,
  outsideDoorY: number,
  residents: NPCData[],
  style = 0
): MapData => {
  const layout: string[][] = Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 12 }, (_, x) => x === 0 || x === 11 || y === 0 || y === 9 ? 'M' : 'O')
  );
  const furniture = [
    [[2, 2, 'U'], [8, 2, 'U'], [2, 4, 'B'], [6, 4, 'Q']],
    [[2, 2, 'U'], [3, 2, 'U'], [8, 3, 'U'], [8, 4, 'B'], [5, 4, 'Q']],
    [[8, 2, 'U'], [8, 3, 'U'], [2, 5, 'B'], [3, 4, 'Q'], [8, 5, 'Q']]
  ][style % 3] as Array<[number, number, string]>;
  for (const [x, y, tile] of furniture) layout[y][x] = tile;
  layout[8][5] = 'E';

  if (style === 1) {
    for (let x = 2; x <= 9; x++) layout[6][x] = 'V';
  } else if (style === 2) {
    for (let x = 2; x <= 9; x++) layout[6][x] = 'C';
  }

  return {
    id,
    name,
    region: 'A quiet home',
    music: 'village',
    width: 12,
    height: 10,
    layout: layout.map(row => row.join('')),
    exits: [],
    doors: [{
      x: 5 * 16,
      y: 8 * 16,
      targetMap: returnMap,
      targetX: outsideDoorX * 16,
      targetY: outsideDoorY * 16 - 4,
      targetFacing: 0
    }],
    npcs: residents,
    enemies: []
  };
};

type VenueStyle = 'tavern' | 'bakery' | 'forge' | 'barracks' | 'market' | 'chapel' | 'wine-cellar';

const createVenueInterior = (
  id: string,
  name: string,
  returnMap: string,
  outsideDoorX: number,
  outsideDoorY: number,
  style: VenueStyle,
  residents: NPCData[] = []
): MapData => {
  const map = createHouseInterior(id, name, returnMap, outsideDoorX, outsideDoorY, residents);
  const layout = map.layout.map(row => row.split(''));
  const setTile = (x: number, y: number, tile: string) => {
    layout[y][x] = tile;
  };

  if (style === 'forge' || style === 'market' || style === 'wine-cellar') {
    for (let y = 1; y < 9; y++) {
      for (let x = 1; x < 11; x++) setTile(x, y, 'C');
    }
  }
  if (style === 'tavern') {
    for (const [x, y] of [[3, 3], [8, 3], [3, 6], [8, 6]]) setTile(x, y, 'Q');
    for (let x = 2; x <= 9; x++) setTile(x, 2, 'V');
  } else if (style === 'bakery') {
    setTile(8, 2, 'Y');
    setTile(2, 2, 'U');
    setTile(8, 3, 'Q');
  } else if (style === 'forge') {
    setTile(8, 2, 'Y');
    setTile(2, 2, 'U');
    setTile(9, 3, 'Q');
  } else if (style === 'barracks') {
    setTile(2, 2, 'B');
    setTile(8, 2, 'B');
    setTile(2, 5, 'B');
    setTile(8, 5, 'B');
    setTile(9, 2, 'U');
  } else if (style === 'market') {
    setTile(3, 2, 'J');
    setTile(7, 2, 'J');
    setTile(8, 5, 'Q');
  } else if (style === 'chapel') {
    for (let y = 2; y <= 7; y++) {
      setTile(5, y, 'V');
      setTile(6, y, 'V');
    }
    setTile(5, 2, 'Q');
    setTile(2, 4, 'Q');
    setTile(9, 4, 'Q');
  } else if (style === 'wine-cellar') {
    setTile(2, 2, 'G');
    setTile(3, 2, 'G');
    setTile(8, 2, 'U');
    setTile(8, 3, 'U');
    setTile(8, 5, 'Q');
  }

  map.layout = layout.map(row => row.join(''));
  return map;
};

export const WORLD_MAPS: Record<string, MapData> = {
  village: {
    id: 'village',
    name: "Le Hameau d'Oakhaven",
    region: 'Act I: The Spark of Ambition',
    music: 'village',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTTTDDTTTTTTTTT",
      "T........DD........T",
      "T.RRRR...DD...RRRR.T",
      "T.LLIE...DD...ILIE.T",
      "T.HH.H...DD...HHHH.T",
      "T........DD........T",
      "T..C..C..DD..C..C..T",
      "T..C..C..DD..C..C..T",
      "T..CCCC..DD..FFFF..T",
      "T........DD..FFFF..T",
      "T...S....DD........T",
      "T.HHHH...DD...HHHH.T",
      "T........DD........T",
      "TTTTTTTTTTTTTTTTTTTT"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'forest',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1
      }
    ],
    doors: [
      { x: 5 * 16, y: 3 * 16, targetMap: 'oakhaven_cottage', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 },
      { x: 17 * 16, y: 2 * 16, targetMap: 'oakhaven_inn', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 }
    ],
    npcs: [],
    enemies: [],
    signText: "Oakhaven Village\n▲ North: Le Bois des Murmures (Forest)\nFollow the dirt road north to reach the Capital."
  },

  forest: {
    id: 'forest',
    name: 'Le Bois des Murmures',
    region: 'Act I: The Spark of Ambition',
    music: 'forest',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T........TT........T",
      "T.A......TT........T",
      "T.DDDDDDDDD........T",
      "T........DD........T",
      "T........DDDDDDDDDDD",
      "T........DDDDDDDDDDD",
      "T........DD........T",
      "T.TTTT...DD...TTTT.T",
      "T.TTTT...DD...TTTT.T",
      "T........DD........T",
      "T........DD........T",
      "T........DD........T",
      "TTTTTTTTTDDTTTTTTTTT"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'village',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      },
      {
        trigger: { x: 19 * 16 + 2, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'aiguemorte',
        targetX: 1 * 16 + 4,
        targetY: 5 * 16 + 4,
        targetFacing: 3,
        condition: 'canEnterTown',
        lockMessage: "The eastern trail to Aiguemorte is barred! Return the straw hat to Le Doyen Tobias in Oakhaven first."
      }
    ],
    npcs: [],
    enemies: [
      { type: 'boar', x: 5 * 16, y: 8 * 16, patrolAxis: 'x', patrolMin: 3 * 16, patrolMax: 7 * 16 },
      { type: 'wolf', x: 14 * 16, y: 9 * 16, patrolAxis: 'y', patrolMin: 8 * 16, patrolMax: 11 * 16 }
    ],
    altar: { x: 2 * 16, y: 2 * 16, active: true },
    signText: "Le Bois des Murmures: Sacred Stone Altar in the Northwest corner (▲).\n▶ East: Road leads toward the walled city of Aiguemorte."
  },

  aiguemorte: {
    id: 'aiguemorte',
    name: 'Aiguemorte',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMM..MMMMMMMMM",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M........DD........M",
      "..DDDDDDDDDDDDDDDD.M",
      "..DDDDDDDDDDDDDDDD.M",
      "M........DD........M",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M...S....DD........M",
      "M........DD........M",
      "MMMMMMMMMMMMMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 0, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'forest',
        targetX: 18 * 16 - 4,
        targetY: 5 * 16 + 4,
        targetFacing: 2
      },
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'route1',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1,
        condition: 'canEnterRoute1',
        lockMessage: "Garrison guards have barricaded the northern exit! Help Madame Renée recover the orphans' flour first."
      }
    ],
    doors: [
      { x: 5 * 16, y: 2 * 16, targetMap: 'aiguemorte_bakery', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 },
      { x: 17 * 16, y: 9 * 16, targetMap: 'aiguemorte_home', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 }
    ],
    npcs: [],
    enemies: [
      { type: 'bandit', x: 16 * 16, y: 8 * 16, patrolAxis: 'x', patrolMin: 14 * 16, patrolMax: 18 * 16, isQuestTarget: 'flour_bandit', neutralUntilProvoked: true }
    ],
    signText: "Aiguemorte: 'Heavy crown taxes empty the granaries, while orphans starve.'\n▲ North: Route 1 to Val-de-Loire | ◀ West: Le Bois des Murmures."
  },

  route1: {
    id: 'route1',
    name: 'Route 1 (Le Chemin Fluvial)',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T..................T",
      "T...TTTT....TTTT...T",
      "T...TTTT....TTTT...T",
      "T........DD........T",
      "DDDDDDDDDDD........T",
      "DDDDDDDDDDD........T",
      "T........DD........T",
      "TWWWWWWWCDDCWWWWWWWT",
      "TWWWWWWWCDDCWWWWWWWT",
      "T........DD........T",
      "T........DD........T",
      "T........DD........T",
      "TTTTTTTTTDDTTTTTTTTT"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'aiguemorte',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      },
      {
        trigger: { x: 0, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'val_de_loire',
        targetX: 18 * 16 - 4,
        targetY: 5 * 16 + 4,
        targetFacing: 2
      }
    ],
    npcs: [],
    enemies: [
      { type: 'wolf', x: 5 * 16, y: 2 * 16, patrolAxis: 'x', patrolMin: 3 * 16, patrolMax: 7 * 16 },
      { type: 'bandit', x: 14 * 16, y: 3 * 16, patrolAxis: 'y', patrolMin: 2 * 16, patrolMax: 5 * 16, isQuestTarget: 'iron_ore_bandit' }
    ],
    signText: "Route 1: Stone bridge over the Loire River.\n◀ West: Val-de-Loire | ▼ South: Aiguemorte."
  },

  val_de_loire: {
    id: 'val_de_loire',
    name: 'Val-de-Loire',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMM..MMMMMMMMM",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M........DD........M",
      "M.DDDDDDDDDDDDDDDD..",
      "M.DDDDDDDE.DDDDDDD..",
      "M........DD........M",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M...S....DD........M",
      "M........DD........M",
      "MMMMMMMMMMMMMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 19 * 16 + 2, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'route1',
        targetX: 1 * 16 + 4,
        targetY: 5 * 16 + 4,
        targetFacing: 3
      },
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'route2',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1,
        condition: 'canEnterHighroad',
        lockMessage: "Maître Pierre warns: The royal highroad is perilous without a shield and honed blade!"
      }
    ],
    doors: [
      { x: 9 * 16, y: 6 * 16, targetMap: 'val_de_loire_forge', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 },
      { x: 17 * 16, y: 2 * 16, targetMap: 'val_de_loire_market', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 }
    ],
    npcs: [],
    enemies: [],
    signText: "Val-de-Loire Forge: Maître Pierre's Anvil. 'True steel remembers honor.'\n▲ North: Route 2 to Orléans | ▶ East: Route 1."
  },

  route2: {
    id: 'route2',
    name: 'Route 2 (Le Pont Royal)',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T..................T",
      "T...TTTT....TTTT...T",
      "T...TTTT....TTTT...T",
      "T........DD........T",
      "T........DDDDDDDDDDD",
      "T........DDDDDDDDDDD",
      "T........DD........T",
      "TWWWWWWWCDDCWWWWWWWT",
      "TWWWWWWWCDDCWWWWWWWT",
      "T........DD........T",
      "T........DD........T",
      "T........DD........T",
      "TTTTTTTTTDDTTTTTTTTT"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'val_de_loire',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      },
      {
        trigger: { x: 19 * 16 + 2, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'orleans',
        targetX: 1 * 16 + 4,
        targetY: 5 * 16 + 4,
        targetFacing: 3
      }
    ],
    npcs: [],
    enemies: [
      { type: 'bandit', x: 4 * 16, y: 3 * 16, patrolAxis: 'x', patrolMin: 3 * 16, patrolMax: 6 * 16 },
      { type: 'wolf', x: 15 * 16, y: 3 * 16, patrolAxis: 'y', patrolMin: 2 * 16, patrolMax: 5 * 16 }
    ],
    signText: "Route 2: Grand stone bridge crossing toward Orléans.\n▶ East: Orléans | ▼ South: Val-de-Loire."
  },

  orleans: {
    id: 'orleans',
    name: 'Orléans',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMM..MMMMMMMMM",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M........DD........M",
      "..DDDDDDDDDDDDDDDD.M",
      "..DDDDDDDDDDDDDDDD.M",
      "M........DD........M",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M...S....DD........M",
      "M........DD........M",
      "MMMMMMMMMMMMMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 0, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'route2',
        targetX: 18 * 16 - 4,
        targetY: 5 * 16 + 4,
        targetFacing: 2
      },
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'route4',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1,
        condition: 'canEnterRoute4',
        lockMessage: 'The northern gate is sealed. Recover Orléans’s civic ledger from the corrupt royal knight, then return it to the city council.'
      }
    ],
    doors: [
      { x: 5 * 16, y: 2 * 16, targetMap: 'orleans_market', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 }
    ],
    npcs: [],
    enemies: [
      { type: 'corrupt_knight', x: 12 * 16, y: 7 * 16, patrolAxis: 'x', patrolMin: 11 * 16, patrolMax: 13 * 16, isQuestTarget: 'orleans_ledger_guard', neutralUntilProvoked: true }
    ],
    signText: "Orléans: Ancient bastions and trade markets.\n▲ North: Route 4 to Tours | ◀ West: Route 2."
  },

  route4: {
    id: 'route4',
    name: 'Route 4 (Le Col des Collines)',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T..................T",
      "T...TTTT....TTTT...T",
      "T...TTTT....TTTT...T",
      "T........DD........T",
      "DDDDDDDDDDD........T",
      "DDDDDDDDDDD........T",
      "T........DD........T",
      "T..FFFF..DD..FFFF..T",
      "T..FFFF..DD..FFFF..T",
      "T........DD........T",
      "T........DD........T",
      "T........DD........T",
      "TTTTTTTTTDDTTTTTTTTT"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'orleans',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      },
      {
        trigger: { x: 0, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'tours',
        targetX: 18 * 16 - 4,
        targetY: 5 * 16 + 4,
        targetFacing: 2
      }
    ],
    npcs: [],
    enemies: [
      { type: 'wolf', x: 5 * 16, y: 2 * 16, patrolAxis: 'x', patrolMin: 3 * 16, patrolMax: 7 * 16 },
      { type: 'corrupt_knight', x: 14 * 16, y: 8 * 16, patrolAxis: 'y', patrolMin: 7 * 16, patrolMax: 10 * 16 }
    ],
    signText: "Route 4: Mountain trail through the hills.\n◀ West: Tours | ▼ South: Orléans."
  },

  tours: {
    id: 'tours',
    name: 'Tours',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMM..MMMMMMMMM",
      "M.PPM..M.DD..MPPM..M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M........DD........M",
      "M.DDDDDDDDDDDDDDDD..",
      "M.DDDDDDDDDDDDDDDD..",
      "M........DD........M",
      "M.RRRR...DD...RRRR.M",
      "M.LLIE...DD...ILIE.M",
      "M.HH.H...DD...HHHH.M",
      "M...S....DD........M",
      "M........DD........M",
      "MMMMMMMMMMMMMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 19 * 16 + 2, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'route4',
        targetX: 1 * 16 + 4,
        targetY: 5 * 16 + 4,
        targetFacing: 3
      },
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'route5',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1,
        condition: 'canEnterRoute5',
        lockMessage: 'The northern road is closed. Help the scholar recover the chapel archive key and reopen the Tours archive first.'
      }
    ],
    doors: [
      { x: 5 * 16, y: 2 * 16, targetMap: 'tours_chapel', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 }
    ],
    npcs: [],
    enemies: [
      { type: 'corrupt_knight', x: 12 * 16, y: 7 * 16, patrolAxis: 'x', patrolMin: 11 * 16, patrolMax: 13 * 16, isQuestTarget: 'tours_archive_guard', neutralUntilProvoked: true }
    ],
    signText: "Tours: Gothic spires reflecting upon serene waters.\n▲ North: Route 5 to Dijon vineyards | ▶ East: Route 4."
  },

  route5: {
    id: 'route5',
    name: 'Route 5 (La Sente du Vignoble)',
    region: 'Act II: The Trial of Towns and Woods',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T.GGGG...DD...GGGG.T",
      "T.GGGG...DD...GGGG.T",
      "T........DD........T",
      "T........DD........T",
      "T........DDDDDDDDDDD",
      "T........DDDDDDDDDDD",
      "T........DD........T",
      "T.GGGG...DD...GGGG.T",
      "T.GGGG...DD...GGGG.T",
      "T........DD........T",
      "T........DD........T",
      "T........DD........T",
      "TTTTTTTTTDDTTTTTTTTT"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'tours',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      },
      {
        trigger: { x: 19 * 16 + 2, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'dijon',
        targetX: 1 * 16 + 4,
        targetY: 5 * 16 + 4,
        targetFacing: 3
      }
    ],
    npcs: [],
    enemies: [
      { type: 'bandit', x: 5 * 16, y: 3 * 16, patrolAxis: 'x', patrolMin: 3 * 16, patrolMax: 7 * 16 },
      { type: 'wolf', x: 14 * 16, y: 9 * 16, patrolAxis: 'y', patrolMin: 8 * 16, patrolMax: 11 * 16 }
    ],
    signText: "Route 5: Sunlit vineyard hills of the French countryside.\n▶ East: Dijon | ▼ South: Tours."
  },

  dijon: {
    id: 'dijon',
    name: "Dijon & La Forêt d'Ombre",
    region: 'Act II: The Trial of Towns and Woods',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMM..MMMMMMMMM",
      "M.GGGG...DD...GGGG.M",
      "M.GGGG...DD...GGGG.M",
      "M........DD........M",
      "M.RRRR...DD...RRRR.M",
      "..DDDDDDDDDDDDDDDD.M",
      "..DDDDDDDDDDDDDDDD.M",
      "M........DD........M",
      "M..CCCC..DD..CCCC..M",
      "M..CCCC..DD..CCCC..M",
      "M.HH.H...DD...HHHH.M",
      "M...S....DD........M",
      "M........DD........M",
      "MMMMMMMMMMMMMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 0, y: 5 * 16 - 4, w: 14, h: 2 * 16 + 8 },
        targetMap: 'route5',
        targetX: 18 * 16 - 4,
        targetY: 5 * 16 + 4,
        targetFacing: 2
      },
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'royalRoad',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1,
        condition: 'hasWineIntel',
        lockMessage: "The Imperial gate is locked! Intercept the noble convoy in the dark woods to recover the royal orders."
      }
    ],
    doors: [
      { x: 16 * 16, y: 3 * 16, targetMap: 'dijon_wine_cellar', targetX: 5 * 16, targetY: 7 * 16, targetFacing: 0 }
    ],
    npcs: [],
    enemies: [
      { type: 'corrupt_knight', x: 16 * 16, y: 8 * 16, patrolAxis: 'x', patrolMin: 14 * 16, patrolMax: 18 * 16, isQuestTarget: 'royal_convoy_lord', neutralUntilProvoked: true }
    ],
    signText: "Dijon & La Forêt d'Ombre: 'Where sweet vintage meets royal greed.'\n▲ North: Le Chemin Royal | ◀ West: Route 5."
  },

  royalRoad: {
    id: 'royalRoad',
    name: 'Le Chemin Royal',
    region: 'Act III: The Shadow Over the Crown',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMM..MMMMMMMMM",
      "M.N....N.DD.N....N.M",
      "M........DD........M",
      "M..CCCC..DD..CCCC..M",
      "M..CCCC..DD..CCCC..M",
      "M........DD........M",
      "M.N....N.DD.N....N.M",
      "M........DD........M",
      "M..CCCC..DD..CCCC..M",
      "M..CCCC..DD..CCCC..M",
      "M........DD........M",
      "M.N....N.DD.N....N.M",
      "M........DD........M",
      "MMMMMMMMM..MMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'dijon',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      },
      {
        trigger: { x: 9 * 16 - 4, y: 0, w: 2 * 16 + 8, h: 14 },
        targetMap: 'capital',
        targetX: 9 * 16 + 4,
        targetY: 12 * 16,
        targetFacing: 1
      }
    ],
    npcs: [],
    enemies: [
      { type: 'corrupt_knight', x: 5 * 16, y: 5 * 16, patrolAxis: 'x', patrolMin: 3 * 16, patrolMax: 7 * 16 },
      { type: 'corrupt_knight', x: 15 * 16, y: 7 * 16, patrolAxis: 'x', patrolMin: 13 * 16, patrolMax: 17 * 16 }
    ],
    signText: "Le Chemin Royal: Broad paved highway leading directly to Le Château Noir.\n▲ North: Le Château Noir | ▼ South: Dijon."
  },

  capital: {
    id: 'capital',
    name: 'Le Château Noir (Throne Room)',
    region: 'Act III & Climax: The Final Duel',
    music: 'boss',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMMMMMMMMMMMMM",
      "MPPMNNMMK..KMMNNMPPM",
      "MMMMMMMMKVVKMMMMMMMM",
      "CCCCCCCCCVVCCCCCCCCC",
      "C.M......VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "CCCCCCCCCVVCCCCCCCCC",
      "CCCCCCCCCVVCCCCCCCCC",
      "MMMMMMMMM..MMMMMMMMM"
    ],
    exits: [
      {
        trigger: { x: 9 * 16 - 4, y: 13 * 16 + 2, w: 2 * 16 + 8, h: 14 },
        targetMap: 'royalRoad',
        targetX: 9 * 16 + 4,
        targetY: 1 * 16 + 4,
        targetFacing: 0
      }
    ],
    npcs: [],
    enemies: [],
    signText: "Le Château Noir Throne Room: The seat of King Raymond IV's tyrannical reign."
  },

  oakhaven_cottage: createHouseInterior('oakhaven_cottage', "Tobias's Cottage", 'village', 5, 3, [
    { id: 'oldman', name: 'Le Doyen Tobias', sprite: 'npc_oldman', x: 4 * 16, y: 4 * 16, facing: 3 },
    { id: 'cottage_resident', name: 'Élise the Weaver', sprite: 'npc_baker', x: 7 * 16, y: 4 * 16, facing: 2 },
    { id: 'cottage_child', name: 'Little Étienne', sprite: 'npc_merchant', x: 5 * 16, y: 6 * 16, facing: 0 }
  ]),
  oakhaven_inn: createVenueInterior('oakhaven_inn', "The Oakhaven Hearth", 'village', 17, 5, 'tavern', [
    { id: 'innkeeper', name: 'Perrine the Innkeeper', sprite: 'npc_vintner', x: 4 * 16, y: 4 * 16, facing: 3 },
    { id: 'traveler', name: 'A Traveling Peddler', sprite: 'npc_merchant', x: 7 * 16, y: 4 * 16, facing: 2 }
  ]),
  aiguemorte_bakery: createVenueInterior('aiguemorte_bakery', "Madame Renée's Bakery", 'aiguemorte', 5, 2, 'bakery', [
    { id: 'baker_woman', name: 'Madame Renée', sprite: 'npc_baker', x: 4 * 16, y: 4 * 16, facing: 3 },
    { id: 'bakery_helper', name: 'Luc the Baker', sprite: 'npc_civilian', x: 6 * 16, y: 5 * 16, facing: 3 },
    { id: 'bakery_child', name: 'A Hungry Orphan', sprite: 'npc_baker', x: 7 * 16, y: 6 * 16, facing: 2 }
  ]),
  aiguemorte_home: createHouseInterior('aiguemorte_home', "Aiguemorte Townhouse", 'aiguemorte', 17, 9, [
    { id: 'town_resident', name: 'Margot the Seamstress', sprite: 'npc_civilian', x: 4 * 16, y: 4 * 16, facing: 3 },
    { id: 'town_child', name: 'Young Perrin', sprite: 'npc_merchant', x: 7 * 16, y: 4 * 16, facing: 2 }
  ]),
  village_barracks: createVenueInterior('village_barracks', "Oakhaven Watch Barracks", 'village', 15, 4, 'barracks', [
    { id: 'village_guard', name: "Le Garde d'Oakhaven", sprite: 'npc_guard', x: 5 * 16, y: 4 * 16, facing: 3 }
  ]),
  aiguemorte_barracks: createVenueInterior('aiguemorte_barracks', 'Aiguemorte Garrison', 'aiguemorte', 30, 8, 'barracks', [
    { id: 'town_guard', name: 'Le Garde de la Garnison', sprite: 'npc_guard', x: 5 * 16, y: 4 * 16, facing: 3 }
  ]),
  val_de_loire_forge: createVenueInterior('val_de_loire_forge', "Maître Pierre's Forge", 'val_de_loire', 9, 6, 'forge', [
    { id: 'blacksmith', name: 'Maître Pierre', sprite: 'npc_blacksmith', x: 4 * 16, y: 4 * 16, facing: 3 }
  ]),
  val_de_loire_market: createVenueInterior('val_de_loire_market', 'Val-de-Loire Trading House', 'val_de_loire', 17, 2, 'market', [
    { id: 'merchant', name: 'Aldric le Marchand', sprite: 'npc_merchant', x: 5 * 16, y: 4 * 16, facing: 3 }
  ]),
  orleans_market: createVenueInterior('orleans_market', "Orléans Merchants' Hall", 'orleans', 5, 2, 'market', [
    { id: 'orleans_citizen', name: "Le Citoyen d'Orléans", sprite: 'npc_civilian', x: 5 * 16, y: 4 * 16, facing: 3 }
  ]),
  tours_chapel: createVenueInterior('tours_chapel', 'Tours Cathedral Chapter House', 'tours', 5, 2, 'chapel', [
    { id: 'tours_scholar', name: 'Le Moine de Tours', sprite: 'npc_civilian', x: 4 * 16, y: 5 * 16, facing: 3 }
  ]),
  dijon_wine_cellar: createVenueInterior('dijon_wine_cellar', 'Dijon Wine Cellar', 'dijon', 16, 3, 'wine-cellar', [
    { id: 'vintner', name: 'Marc le Vigneron', sprite: 'npc_vintner', x: 5 * 16, y: 4 * 16, facing: 3 }
  ]),
};

const EXPANSION_MARGIN = 6;
export const WORLD_MAP_OFFSET = EXPANSION_MARGIN * 16;
type MapEdge = 'north' | 'south' | 'west' | 'east';

const SETTLEMENT_EXPANSIONS = [
  {
    mapId: 'village',
    border: 'T',
    landmark: 'X',
    citizens: [
      ['Bastien the Shepherd', 'npc_vintner', 'oakhaven_woodcutter'],
      ['Perrin the Cooper', 'npc_merchant', 'oakhaven_miller']
    ],
    homes: [
      ['oakhaven_miller', "The Miller's Cottage", 'Théo the Miller', 'npc_merchant', 'Lucie the Baker', 'npc_baker'],
      ['oakhaven_herbalist', 'Alix’s Herb Garden', 'Alix the Herbalist', 'npc_baker', 'Noël the Gatherer', 'npc_civilian'],
      ['oakhaven_woodcutter', 'The Woodcutter’s Lodge', 'Armand the Woodcutter', 'npc_civilian', 'Jeannette the Spinner', 'npc_vintner']
    ]
  },
  {
    mapId: 'aiguemorte',
    border: 'M',
    landmark: '?',
    citizens: [
      ['Étienne the Ferryman', 'npc_merchant', 'aiguemorte_ferryman'],
      ['Sabine the Potter', 'npc_baker', 'aiguemorte_potter'],
      ['Hugo the Lamplighter', 'npc_civilian', 'aiguemorte_lamplighter']
    ],
    homes: [
      ['aiguemorte_ferryman', 'The Ferryman’s House', 'Gaston the Boatman', 'npc_merchant', 'Agnès the Net-Mender', 'npc_baker'],
      ['aiguemorte_potter', 'Sabine’s Pottery', 'Rémi the Apprentice', 'npc_baker', 'Jeanne the Seamstress', 'npc_merchant'],
      ['aiguemorte_lamplighter', 'The Lamplighter’s Home', 'Luc the Lamplighter', 'npc_civilian', 'Jeanne the Lantern-Maker', 'npc_vintner']
    ]
  },
  {
    mapId: 'val_de_loire',
    border: 'M',
    landmark: 'Y',
    citizens: [
      ['Clémence the Smith', 'npc_civilian', 'val_de_loire_forge'],
      ['Gaspard the Boatman', 'npc_merchant', 'loire_boatman'],
      ['Adèle the Scribe', 'npc_civilian', 'loire_scribe']
    ],
    homes: [
      ['loire_smith', 'The Smith’s Home', 'Benoît the Apprentice', 'npc_civilian', 'Lise the Weaver', 'npc_merchant'],
      ['loire_boatman', 'The Boatman’s House', 'Céline the Weaver', 'npc_merchant', 'Noël the Net-Mender', 'npc_baker'],
      ['loire_scribe', 'The Scribe’s Rooms', 'Paule the Candle-Maker', 'npc_civilian', 'Jules the Copyist', 'npc_vintner']
    ]
  },
  {
    mapId: 'orleans',
    border: 'M',
    landmark: 'J',
    citizens: [
      ['Lucette the Flower Seller', 'npc_baker', 'orleans_flower'],
      ['Martin the Canal Pilot', 'npc_merchant', 'orleans_canal'],
      ['Héloïse the Bell Ringer', 'npc_civilian', 'orleans_scriptorium']
    ],
    homes: [
      ['orleans_flower', 'The Flower Seller’s Home', 'Perrin the Gardener', 'npc_baker', 'Marie the Florist', 'npc_merchant'],
      ['orleans_scriptorium', 'The Scriptorium', 'Renaud the Copyist', 'npc_civilian', 'Jules the Errand Boy', 'npc_merchant'],
      ['orleans_canal', 'The Canal Pilot’s House', 'Émilie the Spinner', 'npc_merchant', 'Noël the Boatman', 'npc_vintner']
    ]
  },
  {
    mapId: 'tours',
    border: 'M',
    landmark: '!',
    citizens: [
      ['Père Mathieu the Bell Keeper', 'npc_civilian', 'tours_chapel'],
      ['Isabeau the Baker', 'npc_baker', 'tours_baker'],
      ['Robin the River Trader', 'npc_merchant', 'tours_trader']
    ],
    homes: [
      ['tours_bellkeeper', 'The Bell Keeper’s House', 'Colette the Candlemaker', 'npc_civilian', 'Nicolas the Bell Apprentice', 'npc_baker'],
      ['tours_baker', 'Isabeau’s Bakery', 'Julien the Baker', 'npc_baker', 'Marthe the Cook', 'npc_merchant'],
      ['tours_trader', 'The River Trader’s Home', 'Aline the Weaver', 'npc_merchant', 'Gautier the Boatman', 'npc_vintner']
    ]
  },
  {
    mapId: 'dijon',
    border: 'M',
    landmark: 'G',
    citizens: [
      ['Colin the Cooper', 'npc_merchant', 'dijon_cooper'],
      ['Berthe the Preserver', 'npc_baker', 'dijon_cellar']
    ],
    homes: [
      ['dijon_vintner', 'The Vintner’s House', 'Léon the Cellarman', 'npc_vintner', 'Alix the Weaver', 'npc_merchant'],
      ['dijon_cooper', 'Colin’s Cooperage', 'Jeanne the Preserver', 'npc_merchant', 'Rémi the Cooper', 'npc_baker'],
      ['dijon_cellar', 'The Old Cellar House', 'Amaury the Grape Picker', 'npc_baker', 'Hélène the Preserver', 'npc_civilian']
    ]
  }
] as const;

const OUTDOOR_RESIDENTS: Record<string, NPCData[]> = {
  village: [{
    id: 'village_gardener',
    name: 'Margot the Gardener',
    sprite: 'npc_baker',
    x: 7 * TILE_SIZE,
    y: 18 * TILE_SIZE,
    facing: 0
  }],
  dijon: [{
    id: 'dijon_vintner_outdoors',
    name: 'Marguerite the Vintner',
    sprite: 'npc_vintner',
    x: 22 * TILE_SIZE,
    y: 17 * TILE_SIZE,
    facing: 2
  }]
};

const OUTDOOR_CITIZEN_PLACEMENTS: Record<string, Array<{ index: number; x: number; y: number; facing: NPCData['facing'] }>> = {
  village: [{ index: 0, x: 9, y: 18, facing: 0 }],
  aiguemorte: [
    { index: 0, x: 7, y: 18, facing: 0 },
    { index: 2, x: 24, y: 18, facing: 2 }
  ],
  val_de_loire: [
    { index: 0, x: 7, y: 18, facing: 0 },
    { index: 1, x: 24, y: 18, facing: 2 }
  ],
  orleans: [
    { index: 0, x: 8, y: 18, facing: 0 },
    { index: 2, x: 24, y: 18, facing: 2 }
  ],
  tours: [
    { index: 1, x: 8, y: 18, facing: 0 },
    { index: 2, x: 24, y: 18, facing: 2 }
  ],
  dijon: [{ index: 0, x: 8, y: 18, facing: 0 }]
};

const EXPANDED_MAP_IDS = new Set(['village', 'forest', ...SETTLEMENT_EXPANSIONS.map(settlement => settlement.mapId)]);
export const isExpandedWorldMap = (mapId: string) => EXPANDED_MAP_IDS.has(mapId);

const getExitEdge = (exit: MapData['exits'][number], map: MapData): MapEdge | null => {
  const { x, y, w, h } = exit.trigger;
  if (x <= 0) return 'west';
  if (x + w >= map.width * TILE_SIZE) return 'east';
  if (y <= 0) return 'north';
  if (y + h >= map.height * TILE_SIZE) return 'south';
  return null;
};

const expandWorldMap = (map: MapData, border: string) => {
  const oldWidth = map.width;
  const oldHeight = map.height;
  const newWidth = oldWidth + EXPANSION_MARGIN * 2;
  const newHeight = oldHeight + EXPANSION_MARGIN * 2;
  const grid = Array.from({ length: newHeight }, () => Array(newWidth).fill('.'));

  for (let x = 0; x < newWidth; x++) {
    grid[0][x] = border;
    grid[newHeight - 1][x] = border;
  }
  for (let y = 0; y < newHeight; y++) {
    grid[y][0] = border;
    grid[y][newWidth - 1] = border;
  }

  map.layout.forEach((row, y) => {
    for (let x = 0; x < oldWidth; x++) {
      grid[y + EXPANSION_MARGIN][x + EXPANSION_MARGIN] = row[x] || '.';
    }
  });

  const openOldTile = (x: number, y: number) => {
    grid[y + EXPANSION_MARGIN][x + EXPANSION_MARGIN] = 'D';
  };
  if (map.id === 'forest') {
    [[9, 0], [3, 13], [14, 13], [19, 5], [19, 6], [0, 7]].forEach(([x, y]) => openOldTile(x, y));
  } else {
    [[3, 13], [16, 13], [19, 6], [19, 10], [0, 7]].forEach(([x, y]) => openOldTile(x, y));
  }

  const offset = EXPANSION_MARGIN * TILE_SIZE;
  map.exits.forEach(exit => {
    const trigger = exit.trigger;
    const edge = getExitEdge(exit, { ...map, width: oldWidth, height: oldHeight });
    const startX = Math.floor(trigger.x / TILE_SIZE) + EXPANSION_MARGIN;
    const endX = Math.floor((trigger.x + trigger.w - 1) / TILE_SIZE) + EXPANSION_MARGIN;
    const startY = Math.floor(trigger.y / TILE_SIZE) + EXPANSION_MARGIN;
    const endY = Math.floor((trigger.y + trigger.h - 1) / TILE_SIZE) + EXPANSION_MARGIN;

    if (edge === 'north' || edge === 'south') {
      for (let x = startX; x <= endX; x++) {
        const firstRow = edge === 'north' ? 0 : startY;
        const lastRow = edge === 'north' ? endY : newHeight - 1;
        for (let y = firstRow; y <= lastRow; y++) grid[y][x] = 'D';
      }
    } else if (edge === 'west' || edge === 'east') {
      for (let y = startY; y <= endY; y++) {
        const firstColumn = edge === 'west' ? 0 : startX;
        const lastColumn = edge === 'west' ? endX : newWidth - 1;
        for (let x = firstColumn; x <= lastColumn; x++) grid[y][x] = 'D';
      }
    }

    trigger.x = edge === 'west'
      ? 0
      : edge === 'east'
        ? newWidth * TILE_SIZE - trigger.w
        : trigger.x + offset;
    trigger.y = edge === 'north'
      ? 0
      : edge === 'south'
        ? newHeight * TILE_SIZE - trigger.h
        : trigger.y + offset;
  });
  (map.doors || []).forEach(door => {
    door.x += offset;
    door.y += offset;
  });
  map.npcs.forEach(npc => {
    npc.x += offset;
    npc.y += offset;
  });
  map.enemies.forEach(enemy => {
    enemy.x += offset;
    if (enemy.y !== undefined) enemy.y += offset;
    if (enemy.patrolMin !== undefined) enemy.patrolMin += offset;
    if (enemy.patrolMax !== undefined) enemy.patrolMax += offset;
  });
  if (map.altar) {
    map.altar.x += offset;
    map.altar.y += offset;
  }

  map.width = newWidth;
  map.height = newHeight;
  map.layout = grid.map(row => row.join(''));
};

for (const mapId of EXPANDED_MAP_IDS) {
  const map = WORLD_MAPS[mapId];
  if (!map) throw new Error(`Missing world map for expansion: ${mapId}`);
  const settlement = SETTLEMENT_EXPANSIONS.find(entry => entry.mapId === mapId);
  expandWorldMap(map, settlement?.border || 'T');
}

const ROUTE_MAP_IDS = ['route1', 'route2', 'route4', 'route5', 'royalRoad'];

const createLabyrinthRoute = (map: MapData) => {
  const width = 40;
  const height = 30;
  const wall = map.id === 'royalRoad' ? 'M' : 'T';
  const floor = map.id === 'royalRoad' ? 'C' : 'D';
  const originalExits = map.exits.map(exit => ({
    exit,
    edge: getExitEdge(exit, map)
  }));
  const grid = Array.from({ length: height }, () => Array(width).fill(wall));
  let seed = [...map.id].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 17);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const neighbors = (x: number, y: number) => {
    const options = [[0, -2], [2, 0], [0, 2], [-2, 0]];
    for (let index = options.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [options[index], options[swap]] = [options[swap], options[index]];
    }
    return options
      .map(([dx, dy]) => [x + dx, y + dy] as const)
      .filter(([nx, ny]) => nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === wall);
  };
  const carve = (x: number, y: number) => {
    grid[y][x] = floor;
  };
  const connectEntrance = (edge: MapEdge, x: number, y: number) => {
    if (edge === 'north' || edge === 'south') {
      const row = edge === 'north' ? 0 : height - 1;
      const innerRow = edge === 'north' ? 1 : height - 2;
      carve(x, row);
      carve(x, innerRow);
      if (x % 2 === 0) carve(x - 1, innerRow);
    } else {
      const column = edge === 'west' ? 0 : width - 1;
      const innerColumn = edge === 'west' ? 1 : width - 2;
      carve(column, y);
      carve(innerColumn, y);
      if (y % 2 === 0) carve(innerColumn, y - 1);
    }
  };
  const stack: Array<[number, number]> = [[1, 1]];
  carve(1, 1);
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const [nextX, nextY] = neighbors(x, y)[0] || [];
    if (nextX === undefined || nextY === undefined) {
      stack.pop();
      continue;
    }
    carve((x + nextX) / 2, (y + nextY) / 2);
    carve(nextX, nextY);
    stack.push([nextX, nextY]);
  }

  for (const { exit, edge } of originalExits) {
    if (!edge) throw new Error(`Route exit is not on a map edge: ${map.id} -> ${exit.targetMap}`);
    const centerX = Math.floor((exit.trigger.x + exit.trigger.w / 2) / TILE_SIZE);
    const centerY = Math.floor((exit.trigger.y + exit.trigger.h / 2) / TILE_SIZE);
    const openingX = edge === 'west' ? 0 : edge === 'east' ? width - 1 : Math.max(2, Math.min(width - 3, centerX));
    const openingY = edge === 'north' ? 0 : edge === 'south' ? height - 1 : Math.max(2, Math.min(height - 3, centerY));
    connectEntrance(edge, openingX, openingY);
    exit.trigger = edge === 'west'
      ? { x: 0, y: openingY * TILE_SIZE - 8, w: 14, h: 32 }
      : edge === 'east'
        ? { x: width * TILE_SIZE - 14, y: openingY * TILE_SIZE - 8, w: 14, h: 32 }
        : edge === 'north'
          ? { x: openingX * TILE_SIZE - 8, y: 0, w: 32, h: 14 }
          : { x: openingX * TILE_SIZE - 8, y: height * TILE_SIZE - 14, w: 32, h: 14 };
  }

  for (let x = 14; x <= 30; x++) {
    grid[10][x] = wall;
    grid[20][x] = wall;
  }
  for (let y = 11; y <= 19; y++) {
    grid[y][14] = wall;
    grid[y][30] = wall;
    for (let x = 15; x <= 29; x++) carve(x, y);
  }
  carve(14, 15);
  for (let x = 10; x <= 15; x++) carve(x, 15);
  for (let x = 2; x <= width - 3; x++) carve(x, 1);
  for (let y = 1; y < height - 1; y++) {
    carve(2, y);
    carve(width - 3, y);
  }
  for (const { exit, edge } of originalExits) {
    const centerX = Math.floor((exit.trigger.x + exit.trigger.w / 2) / TILE_SIZE);
    const centerY = Math.floor((exit.trigger.y + exit.trigger.h / 2) / TILE_SIZE);
    if (edge === 'north' || edge === 'south') {
      for (let y = 1; y < height - 1; y++) carve(centerX, y);
    } else {
      const spineX = edge === 'west' ? 2 : width - 3;
      const openingX = edge === 'west' ? 1 : width - 2;
      for (let y = 1; y <= centerY; y++) carve(spineX, y);
      carve(openingX, centerY);
    }
  }

  map.enemies.forEach((enemy, index) => {
    const x = 4 + (index * 5) % 8;
    const y = 4 + (index * 7) % 22;
    for (let corridorX = x - 1; corridorX <= x + 1; corridorX++) carve(corridorX, y);
    enemy.x = x * TILE_SIZE;
    enemy.y = y * TILE_SIZE;
    enemy.patrolAxis = 'x';
    enemy.patrolMin = (x - 1) * TILE_SIZE;
    enemy.patrolMax = (x + 1) * TILE_SIZE;
  });

  map.width = width;
  map.height = height;
  const puzzleClues: Record<string, string> = {
    route1: 'Push the carved block onto its matching floor plate.',
    route2: 'Pull the bridge levers in this order: middle, left, right.',
    route4: 'Strike the trail markers in this order: left, right, middle.',
    route5: 'Push the vineyard stone onto its matching floor plate.',
    royalRoad: 'Strike the royal seals in this order: right, left, middle.'
  };
  grid[2][4] = 'S';
  map.layout = grid.map(row => row.join(''));
  map.signText = `${map.signText || map.name}\nTrail puzzle: ${puzzleClues[map.id]} Solve the sealed gate to uncover a hidden cache.`;
}

for (const mapId of ROUTE_MAP_IDS) {
  const route = WORLD_MAPS[mapId];
  if (!route) throw new Error(`Missing route map for labyrinth generation: ${mapId}`);
  createLabyrinthRoute(route);
}

const expandForestRoute = (map: MapData) => {
  const oldWidth = map.width;
  const oldHeight = map.height;
  const width = 40;
  const height = 30;
  const originalExits = map.exits.map(exit => ({ exit, edge: getExitEdge(exit, map) }));
  const grid = Array.from({ length: height }, () => Array(width).fill('T'));
  map.layout.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) grid[y][x] = row[x] || '.';
  });
  const carve = (x: number, y: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) grid[y][x] = 'D';
  };
  const seedCells = Array.from({ length: 42 }, (_, index) => [33 + (index % 3) * 2, 1 + Math.floor(index / 3) * 2] as const)
    .filter(([x, y]) => x < 38 && y < 28);
  let seed = 811;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };
  const carved = new Set<string>();
  const stack: Array<readonly [number, number]> = [];
  if (seedCells[0]) {
    stack.push(seedCells[0]);
    carved.add(seedCells[0].join(','));
    carve(seedCells[0][0], seedCells[0][1]);
  }
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = [[0, -2], [2, 0], [0, 2], [-2, 0]]
      .map(([dx, dy]) => [x + dx, y + dy] as const)
      .filter(([nx, ny]) => seedCells.some(([sx, sy]) => sx === nx && sy === ny) && !carved.has(`${nx},${ny}`));
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nextX, nextY] = options[Math.floor(random() * options.length)];
    carve((x + nextX) / 2, (y + nextY) / 2);
    carve(nextX, nextY);
    carved.add(`${nextX},${nextY}`);
    stack.push([nextX, nextY]);
  }
  for (let x = oldWidth - 3; x < width; x++) carve(x, 15);
  for (let y = oldHeight - 1; y < height; y++) carve(15, y);
  for (let x = 11; x <= 19; x++) carve(x, 27);

  for (const { exit, edge } of originalExits) {
    if (edge === 'east') {
      exit.trigger.x = width * TILE_SIZE - exit.trigger.w;
      exit.trigger.y = 15 * TILE_SIZE - 8;
      for (let x = oldWidth - 1; x < width; x++) carve(x, 15);
    } else if (edge === 'south') {
      exit.trigger.y = height * TILE_SIZE - exit.trigger.h;
      exit.trigger.x = 15 * TILE_SIZE - 8;
      for (let y = oldHeight - 1; y < height; y++) carve(15, y);
    }
  }
  map.width = width;
  map.height = height;
  map.layout = grid.map(row => row.join(''));
};

expandForestRoute(WORLD_MAPS.forest);

const puzzlePoint = (x: number, y: number) => ({ x, y });

WORLD_MAPS.forest.puzzles = [{
  id: 'whispering-levers',
  type: 'lever-sequence',
  hint: 'Maëlle says: pull the middle lever, then the left, then the right.',
  levers: [puzzlePoint(17, 18), puzzlePoint(10, 18), puzzlePoint(24, 18)],
  sequence: [0, 1, 2],
  barriers: [puzzlePoint(25, 16), puzzlePoint(25, 17), puzzlePoint(25, 18)],
  gates: [puzzlePoint(25, 17)],
  secrets: [puzzlePoint(26, 17), puzzlePoint(27, 17)],
  traps: [puzzlePoint(23, 17), puzzlePoint(24, 17)],
  chest: puzzlePoint(28, 17),
  rewardCoins: 20
}];

WORLD_MAPS.route1.puzzles = [{
  id: 'river-stone-block',
  type: 'push-block',
  hint: 'Push the carved block onto the matching floor plate.',
  block: puzzlePoint(18, 15),
  plate: puzzlePoint(21, 15),
  barriers: Array.from({ length: 11 }, (_, index) => puzzlePoint(26, 10 + index)),
  gates: [puzzlePoint(26, 15)],
  secrets: [puzzlePoint(27, 15), puzzlePoint(28, 15)],
  chest: puzzlePoint(29, 15),
  rewardCoins: 25
}];

WORLD_MAPS.route2.puzzles = [{
  id: 'bridge-floor-levers',
  type: 'lever-sequence',
  hint: 'The bridge stones are marked middle, left, right. Pull the matching floor levers in that order.',
  levers: [puzzlePoint(17, 14), puzzlePoint(21, 12), puzzlePoint(24, 16)],
  sequence: [1, 0, 2],
  barriers: Array.from({ length: 11 }, (_, index) => puzzlePoint(26, 10 + index)),
  gates: [puzzlePoint(26, 15)],
  secrets: [puzzlePoint(27, 14), puzzlePoint(28, 14)],
  traps: [puzzlePoint(24, 14), puzzlePoint(25, 14)],
  chest: puzzlePoint(29, 14),
  rewardCoins: 30
}];

WORLD_MAPS.route4.puzzles = [{
  id: 'hilltop-target-switches',
  type: 'target-sequence',
  hint: 'Strike the three trail markers in the order shown by their symbols: left, right, middle.',
  targets: [puzzlePoint(17, 14), puzzlePoint(21, 14), puzzlePoint(24, 14)],
  sequence: [0, 2, 1],
  barriers: Array.from({ length: 11 }, (_, index) => puzzlePoint(26, 10 + index)),
  gates: [puzzlePoint(26, 15)],
  secrets: [puzzlePoint(27, 14), puzzlePoint(28, 14)],
  traps: [puzzlePoint(24, 15), puzzlePoint(25, 15)],
  chest: puzzlePoint(29, 14),
  rewardCoins: 30
}];

WORLD_MAPS.route5.puzzles = [{
  id: 'vineyard-stone-block',
  type: 'push-block',
  hint: 'Push the carved vineyard stone onto the matching floor plate to lift the gate.',
  block: puzzlePoint(18, 15),
  plate: puzzlePoint(21, 15),
  barriers: Array.from({ length: 11 }, (_, index) => puzzlePoint(26, 10 + index)),
  gates: [puzzlePoint(26, 15)],
  secrets: [puzzlePoint(26, 15), puzzlePoint(27, 15)],
  traps: [puzzlePoint(23, 15), puzzlePoint(24, 15)],
  chest: puzzlePoint(28, 15),
  rewardCoins: 35
}];

WORLD_MAPS.royalRoad.puzzles = [{
  id: 'royal-road-seal-switches',
  type: 'target-sequence',
  hint: 'Strike the royal seals in the order shown by the road markers: right, left, middle.',
  openTile: 'C',
  targets: [puzzlePoint(17, 14), puzzlePoint(21, 14), puzzlePoint(24, 14)],
  sequence: [2, 0, 1],
  barriers: Array.from({ length: 11 }, (_, index) => puzzlePoint(26, 10 + index)),
  gates: [puzzlePoint(26, 15)],
  secrets: [puzzlePoint(27, 14), puzzlePoint(28, 14)],
  traps: [puzzlePoint(24, 15), puzzlePoint(25, 15)],
  chest: puzzlePoint(29, 14),
  rewardCoins: 40
}];

WORLD_MAPS.dijon.puzzles = [{
  id: 'shadow-switches',
  type: 'target-sequence',
  hint: 'Strike the vine-marked switches in the order shown: right, left, middle.',
  targets: [puzzlePoint(20, 18), puzzlePoint(22, 18), puzzlePoint(18, 18)],
  sequence: [1, 2, 0],
  barriers: [puzzlePoint(25, 17), puzzlePoint(25, 18), puzzlePoint(25, 19)],
  gates: [puzzlePoint(25, 18)],
  secrets: [puzzlePoint(26, 18), puzzlePoint(27, 18)],
  traps: [puzzlePoint(23, 18), puzzlePoint(24, 18)],
  chest: puzzlePoint(28, 18),
  rewardCoins: 30
}];

for (const map of Object.values(WORLD_MAPS)) {
  for (const exit of map.exits) {
    if (EXPANDED_MAP_IDS.has(exit.targetMap)) {
      const targetMap = WORLD_MAPS[exit.targetMap];
      const returnExit = targetMap.exits.find(candidate => candidate.targetMap === map.id);
      const edge = returnExit && getExitEdge(returnExit, targetMap);
      if (!edge) {
        exit.targetX += WORLD_MAP_OFFSET;
        exit.targetY += WORLD_MAP_OFFSET;
        continue;
      }

      const trigger = returnExit.trigger;
      if (edge === 'west' || edge === 'east') {
        exit.targetX = edge === 'west'
          ? TILE_SIZE + 2
          : targetMap.width * TILE_SIZE - TILE_SIZE - 12;
        exit.targetY = trigger.y + trigger.h / 2 - 5;
        exit.targetFacing = edge === 'west' ? 3 : 2;
      } else {
        exit.targetX = trigger.x + trigger.w / 2 - 6;
        exit.targetY = edge === 'north'
          ? TILE_SIZE + 2
          : targetMap.height * TILE_SIZE - TILE_SIZE - 10;
        exit.targetFacing = edge === 'north' ? 0 : 1;
      }
    } else if (ROUTE_MAP_IDS.includes(exit.targetMap)) {
      const targetMap = WORLD_MAPS[exit.targetMap];
      const returnExit = targetMap.exits.find(candidate => candidate.targetMap === map.id);
      const edge = returnExit && getExitEdge(returnExit, targetMap);
      if (!edge) throw new Error(`Missing return route exit for ${map.id} -> ${exit.targetMap}.`);
      const trigger = returnExit.trigger;
      if (edge === 'west' || edge === 'east') {
        exit.targetX = edge === 'west'
          ? TILE_SIZE + 2
          : targetMap.width * TILE_SIZE - TILE_SIZE - 12;
        exit.targetY = trigger.y + trigger.h / 2 - 5;
        exit.targetFacing = edge === 'west' ? 3 : 2;
      } else {
        exit.targetX = trigger.x + trigger.w / 2 - 6;
        exit.targetY = edge === 'north'
          ? TILE_SIZE + 2
          : targetMap.height * TILE_SIZE - TILE_SIZE - 10;
        exit.targetFacing = edge === 'north' ? 0 : 1;
      }
    }
  }
  for (const door of map.doors || []) {
    if (EXPANDED_MAP_IDS.has(door.targetMap)) {
      door.targetX += EXPANSION_MARGIN * 16;
      door.targetY += EXPANSION_MARGIN * 16;
    }
  }
}

for (const [mapId, x, y] of [
  ['village_barracks', 15 * TILE_SIZE, 4 * TILE_SIZE - 4],
  ['aiguemorte_barracks', 30 * TILE_SIZE, 8 * TILE_SIZE - 4]
] as const) {
  const returnDoor = WORLD_MAPS[mapId].doors?.[0];
  if (!returnDoor) throw new Error(`Missing return door for ${mapId}.`);
  returnDoor.targetX = x;
  returnDoor.targetY = y;
}

const addDistrictBuilding = (map: MapData, startX: number, roofY: number) => {
  const rows = [
    ['R', 'R', 'R', 'R'],
    ['L', 'L', 'I', 'E'],
    ['H', 'H', '.', '.']
  ];
  rows.forEach((row, rowOffset) => {
    row.forEach((tile, columnOffset) => {
      const current = map.layout[roofY + rowOffset].split('');
      current[startX + columnOffset] = tile;
      map.layout[roofY + rowOffset] = current.join('');
    });
  });
};

for (const [mapId, targetMap] of [
  ['village', 'village_barracks'],
  ['aiguemorte', 'aiguemorte_barracks']
] as const) {
  const map = WORLD_MAPS[mapId];
  const isOakhaven = mapId === 'village';
  const buildingX = isOakhaven ? 11 : 27;
  const buildingY = isOakhaven ? 2 : 5;
  const doorX = buildingX + 3;
  const doorY = buildingY + 1;
  addDistrictBuilding(map, buildingX, buildingY);
  map.doors = map.doors || [];
  map.doors.push({
    x: doorX * TILE_SIZE,
    y: doorY * TILE_SIZE,
    targetMap,
    targetX: 5 * 16,
    targetY: 7 * 16,
    targetFacing: 0
  });
}

for (const settlement of SETTLEMENT_EXPANSIONS) {
  const map = WORLD_MAPS[settlement.mapId];
  const houseY = map.height - 5;
  const houseXs = [3, 13, 23];
  const roadY = houseY - 1;
  const road = map.layout[roadY].split('');
  for (let x = 3; x < map.width - 3; x++) road[x] = 'D';
  map.layout[roadY] = road.join('');

  settlement.homes.forEach((home, index) => {
    const [houseId, houseName, firstName, firstSprite, secondName, secondSprite] = home;
    const houseX = houseXs[index];
    addDistrictBuilding(map, houseX, houseY);
    map.doors = map.doors || [];
    map.doors.push({
      x: (houseX + 3) * 16,
      y: (houseY + 1) * 16,
      targetMap: houseId,
      targetX: 5 * 16,
      targetY: 7 * 16,
      targetFacing: 0
    });
    WORLD_MAPS[houseId] = createHouseInterior(houseId, houseName, map.id, houseX + 2, houseY + 2, [
      { id: `${houseId}_resident`, name: firstName, sprite: firstSprite, x: 4 * 16, y: 4 * 16, facing: 3 },
      { id: `${houseId}_family`, name: secondName, sprite: secondSprite, x: 7 * 16, y: 4 * 16, facing: 2 }
    ], index);
  });

  settlement.citizens.forEach(([name, sprite, interiorId], index) => {
    const interior = WORLD_MAPS[interiorId];
    if (!interior) throw new Error(`Missing NPC interior "${interiorId}" for ${settlement.mapId}.`);
    const outdoorPlacement = OUTDOOR_CITIZEN_PLACEMENTS[settlement.mapId]?.find(placement => placement.index === index);
    const resident: NPCData = {
      id: `${settlement.mapId}_citizen_${index + 1}`,
      name,
      sprite,
      x: outdoorPlacement ? outdoorPlacement.x * TILE_SIZE : 5 * TILE_SIZE,
      y: outdoorPlacement ? outdoorPlacement.y * TILE_SIZE : 6 * TILE_SIZE,
      facing: outdoorPlacement ? outdoorPlacement.facing : 0
    };
    if (outdoorPlacement) map.npcs.push(resident);
    else interior.npcs.push(resident);
  });

  const landmarkX = settlement.mapId === 'village' ? 19 : settlement.mapId === 'dijon' ? 19 : 18;
  const landmarkY = map.height - 7;
  const landmarkRow = map.layout[landmarkY].split('');
  landmarkRow[landmarkX] = settlement.landmark;
  map.layout[landmarkY] = landmarkRow.join('');

  for (const x of [6, 8, 24, 27]) {
    const flowerRow = map.layout[map.height - 8].split('');
    flowerRow[x] = 'F';
    map.layout[map.height - 8] = flowerRow.join('');
  }
  if (settlement.mapId === 'dijon') {
    for (let x = 16; x <= 20; x++) {
      const vineRow = map.layout[map.height - 9].split('');
      vineRow[x] = 'G';
      map.layout[map.height - 9] = vineRow.join('');
    }
  }
}

for (const [mapId, residents] of Object.entries(OUTDOOR_RESIDENTS)) {
  const map = WORLD_MAPS[mapId];
  if (!map) throw new Error(`Missing settlement map for outdoor residents: ${mapId}.`);
  map.npcs.push(...residents);
}

const dijonCellarEntrance = WORLD_MAPS.dijon.layout[9].split('');
dijonCellarEntrance[22] = 'E';
WORLD_MAPS.dijon.layout[9] = dijonCellarEntrance.join('');

const forest = WORLD_MAPS.forest;
for (const [x, y] of [[15, 20], [16, 20], [21, 21], [22, 21], [7, 22], [8, 22], [26, 17], [27, 17]]) {
  const row = forest.layout[y].split('');
  row[x] = 'T';
  forest.layout[y] = row.join('');
}
forest.layout[20] = forest.layout[20].split('').map((tile, x) => x >= 9 && x <= 21 ? 'D' : tile).join('');
forest.layout[22] = forest.layout[22].split('').map((tile, x) => x >= 12 && x <= 14 ? 'F' : tile).join('');
forest.layout[21] = forest.layout[21].split('').map((tile, x) => x === 18 ? 'Z' : tile).join('');
forest.npcs.push({
  id: 'woods_forager',
  name: 'Maëlle the Forager',
  sprite: 'npc_vintner',
  x: 19 * 16,
  y: 22 * 16,
  facing: 2
});

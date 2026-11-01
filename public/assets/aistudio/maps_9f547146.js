// maps.js - 15th-Century French Medieval World Maps & Collision Grids

const TILE_SIZE = 16;

const TILE_DEFS = {
  '.': { name: 'grass', sprite: 'tile_grass', solid: false },
  'F': { name: 'flowers', sprite: 'tile_grass_flowers', solid: false },
  'D': { name: 'dirt', sprite: 'tile_dirt', solid: false },
  'C': { name: 'cobble', sprite: 'tile_cobble', solid: false },
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
  'A': { name: 'ancient_altar', sprite: 'item_sword_shrine', solid: true, interactable: 'altar' }
};

const WORLD_MAPS = {
  village: {
    id: 'village',
    name: 'Oakhaven Village',
    music: 'village',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTT..TTTTTTTTTT",
      "T........D.........T",
      "T.RRRR...D...RRRR..T",
      "T.LLIE...D...ILIE..T",
      "T.HH.H...D...HHHH..T",
      "T........D.........T",
      "T..C..C..DDDDDDDDDD.",
      "T..C..C..D.........T",
      "T..CCCC..D..FFFF...T",
      "T........D..FFFF...T",
      "T...S....D.........T",
      "T.HHHH...D...HHHH..T",
      "T........D.........T",
      "TTTTTTTTTTTTTTTTTTTT"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 0, w: 2 * 16, h: 12 },
        targetMap: 'forest',
        targetX: 8 * 16,
        targetY: 12 * 16,
        targetFacing: 1
      },
      {
        trigger: { x: 19 * 16 - 2, y: 6 * 16, w: 18, h: 2 * 16 },
        targetMap: 'city2',
        targetX: 1 * 16,
        targetY: 6 * 16,
        targetFacing: 3,
        condition: 'canEnterTown'
      }
    ],
    npcs: [
      { id: 'oldman', name: 'Elder Tobias', sprite: 'npc_oldman', x: 6 * 16, y: 4 * 16, facing: 0 },
      { id: 'village_guard', name: 'Guard', sprite: 'npc_guard', x: 18 * 16, y: 5 * 16, facing: 2 }
    ],
    enemies: [],
    signText: "Oakhaven Village\n<- Village | ^ Forest | -> Val-de-Loire"
  },

  forest: {
    id: 'forest',
    name: 'Whispering Weald',
    music: 'forest',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTT..TTTTTTTTTT",
      "T........D.........T",
      "T.A......D.........T",
      "T........D.........T",
      "T..DDDDDDDDDDDDDD..T",
      "T..D............D..T",
      "T..D............D..T",
      "T..D............D..T",
      "T..D............D..T",
      "T..DDDDDDDDDDDDDD..T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "TTTTTTTT..TTTTTTTTTT"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 13 * 16, w: 2 * 16, h: 12 },
        targetMap: 'village',
        targetX: 8 * 16,
        targetY: 2 * 16,
        targetFacing: 0
      },
      {
        trigger: { x: 8 * 16, y: 0, w: 2 * 16, h: 12 },
        targetMap: 'city1',
        targetX: 8 * 16,
        targetY: 12 * 16,
        targetFacing: 1
      }
    ],
    npcs: [],
    enemies: [
      { type: 'boar', x: 5 * 16, y: 6 * 16, patrolAxis: 'x', patrolMin: 4 * 16, patrolMax: 8 * 16 },
      { type: 'wolf', x: 14 * 16, y: 8 * 16, patrolAxis: 'x', patrolMin: 12 * 16, patrolMax: 17 * 16 }
    ],
    altar: { x: 2 * 16, y: 2 * 16, active: true }
  },

  city1: {
    id: 'city1',
    name: 'Aiguemorte (1st City)',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMM..MMMMMMMMMM",
      "M.RRRR...D...RRRR..M",
      "M.LLIE...D...ILIE..M",
      "M.HH.H...D...HHHH..M",
      "M........D.........M",
      "M..CCCC..D..CCCC...M",
      "M..CCCC..D..CCCC...M",
      "M........D.........M",
      "M.RRRR...D...RRRR..M",
      "M.LLIE...D...ILIE..M",
      "M.HH.H...D...HHHH..M",
      "M........D.........M",
      "M........D.........M",
      "MMMMMMMM..MMMMMMMMMM"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 13 * 16, w: 2 * 16, h: 12 },
        targetMap: 'forest',
        targetX: 8 * 16,
        targetY: 2 * 16,
        targetFacing: 0
      },
      {
        trigger: { x: 8 * 16, y: 0, w: 2 * 16, h: 12 },
        targetMap: 'route1',
        targetX: 8 * 16,
        targetY: 12 * 16,
        targetFacing: 1
      }
    ],
    npcs: [
      { id: 'town_citizen', name: 'Villager', sprite: 'npc_oldman', x: 4 * 16, y: 6 * 16, facing: 3 }
    ],
    enemies: [],
    signText: "Aiguemorte: 'King Raymond IV crushed us with brutal taxes!'"
  },

  route1: {
    id: 'route1',
    name: 'Route 1',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "TTTTTTTT..TTTTTTTTTT",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "T........D.........T",
      "TTTTTTTT..TTTTTTTTTT"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 13 * 16, w: 2 * 16, h: 12 },
        targetMap: 'city1',
        targetX: 8 * 16,
        targetY: 2 * 16,
        targetFacing: 0
      },
      {
        trigger: { x: 8 * 16, y: 0, w: 2 * 16, h: 12 },
        targetMap: 'city2',
        targetX: 8 * 16,
        targetY: 12 * 16,
        targetFacing: 1
      }
    ],
    npcs: [],
    enemies: [
      { type: 'wolf', x: 6 * 16, y: 5 * 16, patrolAxis: 'x', patrolMin: 4 * 16, patrolMax: 10 * 16 },
      { type: 'bandit', x: 14 * 16, y: 8 * 16, patrolAxis: 'y', patrolMin: 6 * 16, patrolMax: 10 * 16 }
    ]
  },

  city2: {
    id: 'city2',
    name: 'Val-de-Loire (2nd City)',
    music: 'town',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMM..MMMMMMMMMM",
      "M.RRRR...D...RRRR..M",
      "M.LLIE...D...ILIE..M",
      "M.HH.H...D...HHHH..M",
      "M........D.........M",
      "D..CCCC..Y...CCCC..M",
      "D..CCCC..D...CCCC..M",
      "M........D.........M",
      "M.RRRR...D...RRRR..M",
      "M.LLIE...D...ILIE..M",
      "M.HH.H...D...HHHH..M",
      "M........D.........M",
      "M........D.........M",
      "MMMMMMMM..MMMMMMMMMM"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 13 * 16, w: 2 * 16, h: 12 },
        targetMap: 'route1',
        targetX: 8 * 16,
        targetY: 2 * 16,
        targetFacing: 0
      },
      {
        trigger: { x: 8 * 16, y: 0, w: 2 * 16, h: 12 },
        targetMap: 'royalRoad',
        targetX: 8 * 16,
        targetY: 12 * 16,
        targetFacing: 1,
        condition: 'canEnterHighroad'
      },
      {
        trigger: { x: 0, y: 5 * 16, w: 12, h: 2 * 16 },
        targetMap: 'village',
        targetX: 17 * 16,
        targetY: 6 * 16,
        targetFacing: 2
      }
    ],
    npcs: [
      { id: 'blacksmith', name: 'Master Pierre', sprite: 'npc_blacksmith', x: 10 * 16, y: 5 * 16, facing: 3 },
      { id: 'merchant', name: 'Aldric', sprite: 'npc_merchant', x: 3 * 16, y: 4 * 16, facing: 0 }
    ],
    enemies: [
      { type: 'bandit', x: 16 * 16, y: 8 * 16, patrolAxis: 'x', patrolMin: 14 * 16, patrolMax: 18 * 16, isQuestBandit: true }
    ],
    signText: "Val-de-Loire: Master Pierre's Forge."
  },

  royalRoad: {
    id: 'royalRoad',
    name: 'Royal Road',
    music: 'road',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMM..MMMMMMMMMM",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "M........D.........M",
      "MMMMMMMM..MMMMMMMMMM"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 13 * 16, w: 2 * 16, h: 12 },
        targetMap: 'city2',
        targetX: 8 * 16,
        targetY: 2 * 16,
        targetFacing: 0
      },
      {
        trigger: { x: 8 * 16, y: 0, w: 2 * 16, h: 12 },
        targetMap: 'capital',
        targetX: 8 * 16,
        targetY: 12 * 16,
        targetFacing: 1
      }
    ],
    npcs: [],
    enemies: [
      { type: 'corrupt_knight', x: 6 * 16, y: 5 * 16, patrolAxis: 'x', patrolMin: 4 * 16, patrolMax: 10 * 16 },
      { type: 'corrupt_knight', x: 14 * 16, y: 8 * 16, patrolAxis: 'y', patrolMin: 6 * 16, patrolMax: 10 * 16 }
    ],
    signText: "Royal Road: Patrolled by Royal Knights."
  },

  capital: {
    id: 'capital',
    name: 'Château Noir (Castle)',
    music: 'boss',
    width: 20,
    height: 14,
    layout: [
      "MMMMMMMMMMMMMMMMMMMM",
      "MPPMNNMMK..KMMNNMPPM",
      "MMMMMMMMKVVKMMMMMMMM",
      "CCCCCCCCCVVCCCCCCCCC",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "C........VV........C",
      "CCCCCCCCCVVCCCCCCCCC",
      "CCCCCCCCCCCCCCCCCCCC",
      "MMMMMMMM..MMMMMMMMMM"
    ],
    bigTrees: [],
    exits: [
      {
        trigger: { x: 8 * 16, y: 13 * 16, w: 2 * 16, h: 12 },
        targetMap: 'royalRoad',
        targetX: 8 * 16,
        targetY: 2 * 16,
        targetFacing: 0
      }
    ],
    npcs: [],
    enemies: [],
    boss: {
      type: 'boss_king',
      name: 'King Raymond IV',
      x: 9 * 16,
      y: 3 * 16,
      maxHp: 24
    }
  }
};
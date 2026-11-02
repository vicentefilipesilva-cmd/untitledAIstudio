/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DIR_LEFT, DIR_RIGHT, DIR_UP, Direction } from '../types/game';

// High-Quality Pokémon GBC/GBA Style Pixel Art Generator
// Features 15th-Century French Medieval Architecture, Shaded Trees, Shield Poses & Boss

const PLAYER_FRONT_HEAD = [
  "......hhHH......",
  "....hhHHHHHH....",
  "...hHHHHHHHHh...",
  "..hHHssssssHHh..",
  "..hHsississHHh..",
  "...hHssssssHh...",
  "....hHHHHHh....."
];

const PLAYER_SIDE_HEAD = [
  "......hhHH......",
  "....hhHHHHHH....",
  "...hHHHHHHHHh...",
  "..hHHssssHHHh...",
  "..hHHssikHHHh...",
  "...hHHddsssHh...",
  "....hHHHHHh....."
];

const PLAYER_BACK_HEAD = [
  "......hhHH......",
  "....hhHHHHHH....",
  "...hHHHHHHHHh...",
  "..hHHHHHHHHHHh..",
  "..hHHHHHHHHHHh..",
  "...hHHHHHHHHh...",
  "....hhHHHHhh...."
];

export class SpriteManager {
  public sprites: Record<string, HTMLCanvasElement> = {};
  public palette!: Record<string, string>;

  constructor() {
    this.initPalette();
    this.generateAllSprites();
  }

  private initPalette() {
    this.palette = {
      black: '#080a10',
      darkNavy: '#141824',
      outline: '#182331',
      groundShadow: 'rgba(10, 20, 28, 0.42)',
      white: '#f8fafc',
      cream: '#ede6d6',
      transparent: 'rgba(0,0,0,0)',

      // 15th-Century French Architecture (Stone, Slate & Timber)
      slateRoofLight: '#4d5d78',
      slateRoofMid: '#344059',
      slateRoofDark: '#1f2638',
      timberBeam: '#4e2f18',
      timberBeamDark: '#2e1808',
      mortarWall: '#d9cdb8',
      mortarShadow: '#b0a086',
      gothicStoneLight: '#a0aab8',
      gothicStoneMid: '#687384',
      gothicStoneDark: '#3e4858',
      stainedGlassBlue: '#2888d8',
      stainedGlassGold: '#f0b828',
      stainedGlassRed: '#c82838',

      // Lush Nature (Pokémon Style Shading)
      grassLight: '#68b820',
      grassMidLight: '#58a81a',
      grassMid: '#448c14',
      grassDark: '#20580c',
      grassShade: '#123806',
      leafHighlight: '#9ce038',
      barkLight: '#8a5228',
      barkMid: '#5c3314',
      barkDark: '#361b07',
      dirtLight: '#d8a460',
      dirtMidLight: '#c58a4d',
      dirtMid: '#b07838',
      dirtDark: '#78481c',
      waterLight: '#68b4f8',
      waterMidLight: '#4698e8',
      waterMid: '#2c7cd8',
      waterDark: '#144c98',

      // Hero Colors
      skinLight: '#fcd0a4',
      skinMid: '#e4a06c',
      skinDark: '#b86c40',
      hairBlonde: '#cc7440',
      hairDark: '#733d2f',
      tunicBlue: '#287ca1',
      tunicDark: '#194f73',
      heroCoat: '#527b45',
      heroCoatDark: '#354f37',
      heroAccent: '#d7b154',
      heroAccentDark: '#795b31',
      bootsBrown: '#5c381c',

      // Weapons & Shield (Steel & Gold)
      steelHighlight: '#ffffff',
      steelLight: '#d8e8f8',
      steelMid: '#90a8c4',
      steelDark: '#4c6480',
      goldLight: '#ffe454',
      goldMid: '#e4b018',
      goldDark: '#9c6808',

      // Shield Specifics (French Royal Blue with Fleur / Brass trim)
      shieldBorder: '#f0c028',
      shieldBlue: '#1c4888',
      shieldEmblem: '#ffffff',

      // French Royal & Corrupt Knight Palette
      knightSteel: '#546070',
      knightDark: '#242a34',
      knightPlume: '#9e1428',
      kingGold: '#ffd020',
      kingMantle: '#941024',
      kingMantleErmine: '#f8fafc',
      kingArmor: '#383048',

      // Enemies
      boarBristle: '#74341c',
      boarDark: '#441a0a',
      wolfGrey: '#647082',
      wolfDark: '#364050',
      banditCloth: '#2e3040',
      banditLeather: '#7c4424'
    };
  }

  private createCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  private drawMatrix(
    ctx: CanvasRenderingContext2D,
    matrix: string[],
    colorMap: Record<string, string>,
    ox = 0,
    oy = 0,
    scale = 1
  ) {
    for (let r = 0; r < matrix.length; r++) {
      const line = matrix[r];
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char !== '.' && colorMap[char]) {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect((ox + c) * scale, (oy + r) * scale, scale, scale);
        }
      }
    }
  }

  private outlineSprite(source: HTMLCanvasElement) {
    const outlined = this.createCanvas(source.width, source.height);
    const ctx = outlined.ctx;
    ctx.drawImage(source, -1, 0);
    ctx.drawImage(source, 1, 0);
    ctx.drawImage(source, 0, -1);
    ctx.drawImage(source, 0, 1);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = this.palette.outline;
    ctx.fillRect(0, 0, source.width, source.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(source, 0, 0);
    return outlined.canvas;
  }

  private shadeTile(
    ctx: CanvasRenderingContext2D,
    base: string,
    highlights: string[],
    shadows: string[]
  ) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 16, 16);
    highlights.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(2 + (index * 5) % 12, 2 + (index * 7) % 12, 2, 1);
    });
    shadows.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(4 + (index * 7) % 10, 5 + (index * 3) % 10, 1, 2);
    });
  }

  private makeStrideFrame(source: HTMLCanvasElement) {
    const frame = this.createCanvas(source.width, source.height);
    frame.ctx.drawImage(source, 0, 0);
    frame.ctx.clearRect(0, source.height - 5, source.width, 5);
    frame.ctx.drawImage(
      source,
      0, source.height - 5, source.width, 5,
      1, source.height - 5, source.width - 1, 5
    );
    return this.outlineSprite(frame.canvas);
  }

  public drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, width = 10) {
    ctx.save();
    ctx.fillStyle = this.palette.groundShadow;
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), width / 2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public generateAllSprites() {
    this.generatePlayerSprites();
    this.generatePlayerShieldSprites();
    for (const direction of ['down', 'up', 'left', 'right']) {
      for (let walkingFrame = 0; walkingFrame < 3; walkingFrame++) {
        this.sprites[`player_equipped_${direction}_${walkingFrame}`] =
          this.sprites[`player_gear_${direction}_${walkingFrame}`];
      }
    }
    this.generateArchitectureTiles();
    this.generateHouseInteriorTiles();
    this.generateForestAndNatureTiles();
    this.generateRegionalTiles();
    this.generateNPCSprites();
    this.generateEnemySprites();
    this.generateBossSprites();
    this.generateItemAndHUDSprites();
    this.generateVFXSprites();
    this.polishCharacterSprites();
    this.loadPlayerReferenceSprites();
    this.loadNPCReferenceSprites();
    this.loadCitizenCreatureSprites();
  }

  private loadCitizenCreatureSprites() {
    const image = new Image();
    image.onerror = () => console.error('Unable to load public/assets/citizen-creature-reference.png');
    image.onload = () => {
      const frame = (column: number, rowY: number) =>
        this.createNPCReferenceFrame(image, 24 + column * 65, rowY, 50, 51);
      const mirror = (source: HTMLCanvasElement) => {
        const flipped = this.createCanvas(source.width, source.height);
        flipped.ctx.translate(source.width, 0);
        flipped.ctx.scale(-1, 1);
        flipped.ctx.drawImage(source, 0, 0);
        return flipped.canvas;
      };
      const registerCivilian = (spriteName: string, group: number) => {
        const firstColumn = group * 3;
        const profile = frame(firstColumn + 2, 128);
        const profileFacesRight = group % 2 === 0;
        const left = profileFacesRight ? mirror(profile) : profile;
        const right = profileFacesRight ? profile : mirror(profile);
        const directions = {
          down: frame(firstColumn, 128),
          up: frame(firstColumn + 1, 128),
          left,
          right
        };
        for (const [direction, sprite] of Object.entries(directions)) {
          this.sprites[`${spriteName}_${direction}`] = sprite;
        }
        this.sprites[spriteName] = directions.down;
      };

      registerCivilian('npc_baker', 0);
      registerCivilian('npc_vintner', 1);
      registerCivilian('npc_merchant', 2);
      registerCivilian('npc_civilian', 3);

      for (let walkingFrame = 0; walkingFrame < 3; walkingFrame++) {
        this.sprites[`enemy_bandit_${walkingFrame}`] = frame(walkingFrame, 214);
        this.sprites[`enemy_wolf_${walkingFrame}`] = frame(walkingFrame, 386);
        this.sprites[`enemy_boar_${walkingFrame}`] = frame(walkingFrame, 558);
      }
    };
    image.src = `${import.meta.env.BASE_URL}assets/citizen-creature-reference.png`;
  }

  private loadNPCReferenceSprites() {
    const image = new Image();
    image.onerror = () => console.error('Unable to load public/assets/npc-king-reference.png');
    image.onload = () => {
      const frame = (column: number, rowY: number) =>
        this.createNPCReferenceFrame(image, 24 + column * 65, rowY, 50, 51);
      const registerDirections = (spriteName: string, rowY: number) => {
        const directions = {
          down: frame(0, rowY),
          up: frame(4, rowY),
          left: frame(3, rowY),
          right: frame(5, rowY)
        };
        for (const [direction, sprite] of Object.entries(directions)) {
          this.sprites[`${spriteName}_${direction}`] = sprite;
        }
        this.sprites[spriteName] = directions.down;
      };

      registerDirections('npc_oldman', 128);
      registerDirections('npc_blacksmith', 214);
      registerDirections('npc_guard', 299);

      for (let walkingFrame = 0; walkingFrame < 3; walkingFrame++) {
        this.sprites[`enemy_corrupt_knight_${walkingFrame}`] = frame(walkingFrame, 386);
        this.sprites[`boss_king_${walkingFrame}`] = frame(walkingFrame, 468);
      }
    };
    image.src = `${import.meta.env.BASE_URL}assets/npc-king-reference.png`;
  }

  private createNPCReferenceFrame(
    image: HTMLImageElement,
    cellX: number,
    cellY: number,
    width: number,
    height: number
  ) {
    const source = this.createCanvas(width, height);
    source.ctx.imageSmoothingEnabled = false;
    source.ctx.drawImage(image, cellX + 2, cellY + 2, width, height, 0, 0, width, height);
    const pixels = source.ctx.getImageData(0, 0, width, height);
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let queueStart = 0;
    let queueEnd = 0;

    const isSheetBackground = (pixel: number) => {
      const index = pixel * 4;
      const red = pixels.data[index];
      const green = pixels.data[index + 1];
      const blue = pixels.data[index + 2];
      return Math.min(red, green, blue) > 140 &&
        Math.max(red, green, blue) - Math.min(red, green, blue) < 50;
    };
    const enqueueBackground = (x: number, y: number) => {
      const pixel = y * width + x;
      if (visited[pixel] || !isSheetBackground(pixel)) return;
      visited[pixel] = 1;
      queue[queueEnd++] = pixel;
    };

    for (let x = 0; x < width; x++) {
      enqueueBackground(x, 0);
      enqueueBackground(x, height - 1);
    }
    for (let y = 1; y < height - 1; y++) {
      enqueueBackground(0, y);
      enqueueBackground(width - 1, y);
    }

    while (queueStart < queueEnd) {
      const pixel = queue[queueStart++];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      pixels.data[pixel * 4 + 3] = 0;
      if (x > 0) enqueueBackground(x - 1, y);
      if (x < width - 1) enqueueBackground(x + 1, y);
      if (y > 0) enqueueBackground(x, y - 1);
      if (y < height - 1) enqueueBackground(x, y + 1);
    }

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (pixels.data[(y * width + x) * 4 + 3] === 0) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    const frame = this.createCanvas(24, 24);
    if (maxX < minX || maxY < minY) return frame.canvas;
    source.ctx.putImageData(pixels, 0, 0);
    const spriteWidth = maxX - minX + 1;
    const spriteHeight = maxY - minY + 1;
    const scale = Math.min(22 / spriteWidth, 22 / spriteHeight);
    const drawWidth = Math.max(1, Math.round(spriteWidth * scale));
    const drawHeight = Math.max(1, Math.round(spriteHeight * scale));
    frame.ctx.imageSmoothingEnabled = false;
    frame.ctx.drawImage(
      source.canvas,
      minX, minY, spriteWidth, spriteHeight,
      Math.floor((24 - drawWidth) / 2),
      Math.floor((24 - drawHeight) / 2),
      drawWidth, drawHeight
    );
    return frame.canvas;
  }

  private loadPlayerReferenceSprites() {
    const baseImage = new Image();
    baseImage.onerror = () => console.error('Unable to load public/assets/player-views.png');
    baseImage.onload = () => {
      const crop = (x: number, y: number, width: number, height: number) =>
        this.createPlayerViewFrame(baseImage, x, y, width, height);
      const frontFrames = [
        crop(447, 332, 132, 132),
        crop(20, 70, 130, 130),
        crop(304, 70, 131, 130)
      ];
      const backFrames = [
        crop(875, 70, 131, 130),
        crop(875, 329, 131, 140),
        crop(875, 70, 131, 130)
      ];
      const leftFrames = [
        crop(447, 70, 132, 130),
        crop(447, 205, 132, 122),
        crop(447, 205, 132, 122)
      ];
      const rightFrames = [
        crop(590, 70, 132, 130),
        crop(590, 205, 132, 122),
        crop(590, 205, 132, 122)
      ];
      const directionFrames = {
        down: frontFrames,
        up: backFrames,
        left: rightFrames,
        right: leftFrames
      };

      for (const [direction, frames] of Object.entries(directionFrames)) {
        for (let walkingFrame = 0; walkingFrame < frames.length; walkingFrame++) {
          const frame = frames[walkingFrame];
          this.sprites[`player_${direction}_${walkingFrame}`] = frame;
          this.sprites[`player_sword_${direction}_${walkingFrame}`] =
            this.createPlayerEquipmentSprite(frame, true, false);
          this.sprites[`player_shield_gear_${direction}_${walkingFrame}`] =
            this.createPlayerEquipmentSprite(frame, false, true);
        }
      }

      const blockDirections = [frontFrames[0], backFrames[0], rightFrames[0], leftFrames[0]];
      blockDirections.forEach((frame, direction) => {
        this.sprites[`player_shield_${direction}`] = this.createPlayerEquipmentSprite(frame, false, true);
        this.sprites[`player_attack_${direction}`] = this.createPlayerEquipmentSprite(frame, true, false);
      });
    };
    baseImage.src = `${import.meta.env.BASE_URL}assets/player-views.png`;

    const equippedImage = new Image();
    equippedImage.onerror = () => console.error('Unable to load public/assets/equipped-hero-reference.png');
    equippedImage.onload = () => {
      const animationColumns = [592, 735, 878];
      const rowOffsets = { down: 70, up: 170, left: 275, right: 377 };
      const crop = (x: number, y: number) =>
        this.createNPCReferenceFrame(equippedImage, x, y, 128, 100);
      const mirror = (source: HTMLCanvasElement) => {
        const flipped = this.createCanvas(source.width, source.height);
        flipped.ctx.translate(source.width, 0);
        flipped.ctx.scale(-1, 1);
        flipped.ctx.drawImage(source, 0, 0);
        return flipped.canvas;
      };
      const downFrames = animationColumns.map(x => crop(x, rowOffsets.down));
      const upFrames = animationColumns.map(x => crop(x, rowOffsets.up));
      const leftFrames = animationColumns.map(x => crop(x, rowOffsets.left));
      const rightFrames = leftFrames.map(mirror);
      const directionFrames = {
        down: downFrames,
        up: upFrames,
        left: leftFrames,
        right: rightFrames,
      };

      Object.entries(directionFrames).forEach(([direction, frames]) =>
        frames.forEach((frame, walkingFrame) => {
          this.sprites[`player_equipped_${direction}_${walkingFrame}`] = frame;
        })
      );
    };
    equippedImage.src = `${import.meta.env.BASE_URL}assets/equipped-hero-reference.png`;
  }

  private createPlayerViewFrame(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const source = this.createCanvas(width, height);
    source.ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    const pixels = source.ctx.getImageData(0, 0, width, height);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const index = (py * width + px) * 4;
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        const high = Math.max(red, green, blue);
        const low = Math.min(red, green, blue);
        if (high > 80 && high - low < 24) {
          pixels.data[index + 3] = 0;
          continue;
        }
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }

    const frame = this.createCanvas(24, 24);
    if (maxX < minX || maxY < minY) return frame.canvas;
    const spriteWidth = maxX - minX + 1;
    const spriteHeight = maxY - minY + 1;
    const scale = Math.min(22 / spriteWidth, 22 / spriteHeight);
    const drawWidth = Math.max(1, Math.round(spriteWidth * scale));
    const drawHeight = Math.max(1, Math.round(spriteHeight * scale));
    source.ctx.putImageData(pixels, 0, 0);
    frame.ctx.drawImage(
      source.canvas,
      minX, minY, spriteWidth, spriteHeight,
      Math.floor((24 - drawWidth) / 2),
      Math.floor((24 - drawHeight) / 2),
      drawWidth, drawHeight
    );
    return frame.canvas;
  }

  private createPlayerEquipmentSprite(base: HTMLCanvasElement, sword: boolean, shield: boolean) {
    const equipment = this.createCanvas(base.width, base.height);
    equipment.ctx.drawImage(base, 0, 0);

    if (shield) {
      equipment.ctx.fillStyle = this.palette.outline;
      equipment.ctx.fillRect(1, 13, 7, 8);
      equipment.ctx.fillStyle = this.palette.goldMid;
      equipment.ctx.fillRect(2, 14, 5, 6);
      equipment.ctx.fillStyle = this.palette.shieldBlue;
      equipment.ctx.fillRect(3, 15, 3, 4);
      equipment.ctx.fillStyle = this.palette.shieldEmblem;
      equipment.ctx.fillRect(4, 16, 1, 2);
    }

    if (sword) {
      equipment.ctx.fillStyle = this.palette.outline;
      equipment.ctx.fillRect(18, 7, 3, 12);
      equipment.ctx.fillStyle = this.palette.steelLight;
      equipment.ctx.fillRect(19, 8, 1, 8);
      equipment.ctx.fillStyle = this.palette.goldMid;
      equipment.ctx.fillRect(17, 15, 5, 2);
      equipment.ctx.fillRect(19, 17, 2, 3);
      equipment.ctx.fillStyle = this.palette.bootsBrown;
      equipment.ctx.fillRect(19, 19, 2, 2);
    }

    return equipment.canvas;
  }

  private polishCharacterSprites() {
    const characterPrefixes = ['player_', 'npc_', 'enemy_', 'boss_king_'];
    const characterSprites = Object.keys(this.sprites).filter(name =>
      characterPrefixes.some(prefix => name.startsWith(prefix))
    );

    for (const name of characterSprites) {
      const source = this.sprites[name];
      const enlarged = this.createCanvas(24, 24);
      enlarged.ctx.drawImage(source, 0, 0, 24, 24);

      if (name.startsWith('enemy_corrupt_knight_')) {
        this.drawCorruptKnightAccents(enlarged.ctx);
      }
      if (name.startsWith('boss_king_')) this.drawRoyalMantleAccents(enlarged.ctx);
      this.sprites[name] = enlarged.canvas;
    }
  }

  public drawTravelerHat(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#493018';
    ctx.fillRect(x + 8, y, 9, 4);
    ctx.fillStyle = '#a8752e';
    ctx.fillRect(x + 9, y + 1, 7, 2);
    ctx.fillStyle = '#e6c46c';
    ctx.fillRect(x + 10, y + 1, 3, 1);
    ctx.fillStyle = '#765020';
    ctx.fillRect(x + 5, y + 4, 15, 1);
    ctx.fillStyle = '#a8752e';
    ctx.fillRect(x + 7, y + 3, 12, 1);
    ctx.fillRect(x + 6, y + 5, 3, 1);
    ctx.fillRect(x + 17, y + 5, 2, 1);
  }

  private drawCorruptKnightAccents(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#171a28';
    ctx.fillRect(2, 3, 3, 4);
    ctx.fillRect(19, 3, 3, 4);
    ctx.fillStyle = '#a22b55';
    ctx.fillRect(3, 2, 2, 4);
    ctx.fillRect(19, 2, 2, 4);
    ctx.fillStyle = '#ed7590';
    ctx.fillRect(4, 3, 1, 2);
    ctx.fillRect(19, 3, 1, 2);
    ctx.fillStyle = '#342a49';
    ctx.fillRect(3, 12, 4, 5);
    ctx.fillRect(17, 12, 4, 5);
    ctx.fillStyle = '#b83c61';
    ctx.fillRect(4, 13, 2, 2);
    ctx.fillRect(18, 13, 2, 2);
  }

  private drawRoyalMantleAccents(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#f2c64f';
    ctx.fillRect(7, 10, 2, 7);
    ctx.fillRect(15, 10, 2, 7);
    ctx.fillStyle = '#f8ead0';
    ctx.fillRect(8, 8, 8, 2);
    ctx.fillStyle = '#9b1f35';
    ctx.fillRect(10, 11, 4, 5);
  }

  // 1. Player Movement & Attack
  private generatePlayerSprites() {
    const p = this.palette;
    const cmap: Record<string, string> = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': p.hairBlonde,
      'H': p.hairDark,
      'i': '#4a3035',
      't': p.heroCoat,
      'T': p.heroCoatDark,
      'a': p.heroAccent,
      'A': p.heroAccentDark,
      'b': p.bootsBrown,
      'w': p.white,
      'm': p.steelLight,
      'M': p.steelDark,
      'g': p.goldMid,
      'G': p.shieldBorder,
      'B': p.shieldBlue,
      'e': p.shieldEmblem
    };

    const down_idle = [
      ...PLAYER_FRONT_HEAD,
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "....ttggtt......",
      "...bb..bb.......",
      "...bb..bb.......",
      "..bbbb..bbbb....",
      "................"
    ];
    const down_walk1 = [
      ...PLAYER_FRONT_HEAD,
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "....ttggtt......",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    const down_walk2 = [
      ...PLAYER_FRONT_HEAD,
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "....ttggtt......",
      ".........bbbb...",
      "....bb...bbbb...",
      "....bb..........",
      "................"
    ];

    const up_idle = [
      ...PLAYER_BACK_HEAD,
      "....ddssdd......",
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "....ttggtt......",
      "...bb..bb.......",
      "...bb..bb.......",
      "..bbbb..bbbb....",
      "................"
    ];
    const up_walk1 = [
      ...PLAYER_BACK_HEAD,
      "....ddssdd......",
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "....ttggtt......",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    const up_walk2 = [
      ...PLAYER_BACK_HEAD,
      "....ddssdd......",
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "....ttggtt......",
      ".........bbbb...",
      "....bb...bbbb...",
      "....bb..........",
      "................"
    ];

    const left_idle = [
      ...PLAYER_SIDE_HEAD,
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "....ttggtt......",
      "...bb..bb.......",
      "...bb..bb.......",
      "..bbbb..bbbb....",
      "................"
    ];
    const left_walk1 = [
      ...PLAYER_SIDE_HEAD,
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "....ttggtt......",
      "....bbbb........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    const left_walk2 = [
      ...PLAYER_SIDE_HEAD,
      "....ttattt......",
      "...tttTTttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "....ttggtt......",
      ".........bbbb...",
      "....bb...bbbb...",
      "....bb..........",
      "................"
    ];

    const mirror = (m: string[]) => m.map(row => row.split('').reverse().join(''));

    const overlayMatrix = (base: string[], overlay: Record<number, Record<number, string>>): string[] => {
      return base.map((row, r) => {
        if (!overlay[r]) return row;
        const chars = row.split('');
        for (const [colStr, char] of Object.entries(overlay[r])) {
          const c = parseInt(colStr, 10);
          if (c >= 0 && c < chars.length) {
            chars[c] = char;
          }
        }
        return chars.join('');
      });
    };

    const mergeOverlays = (
      o1: Record<number, Record<number, string>>,
      o2: Record<number, Record<number, string>>
    ): Record<number, Record<number, string>> => {
      const res: Record<number, Record<number, string>> = {};
      for (const [r, row] of Object.entries(o1)) {
        res[+r] = { ...row };
      }
      for (const [r, row] of Object.entries(o2)) {
        res[+r] = { ...(res[+r] || {}), ...row };
      }
      return res;
    };

    const sword_down: Record<number, Record<number, string>> = {
      8: { 13: 'g' },
      9: { 12: 'g', 13: 'm', 14: 'g' },
      10: { 13: 'm' },
      11: { 13: 'm' },
      12: { 13: 'M' },
      13: { 13: 'w' }
    };

    const sword_up: Record<number, Record<number, string>> = {
      4: { 13: 'w' },
      5: { 13: 'm' },
      6: { 13: 'm' },
      7: { 12: 'g', 13: 'm', 14: 'g' },
      8: { 13: 'g' }
    };

    const sword_left: Record<number, Record<number, string>> = {
      7: { 1: 'w' },
      8: { 1: 'm', 2: 'm' },
      9: { 2: 'm' },
      10: { 2: 'g', 3: 'g' }
    };

    const shield_down: Record<number, Record<number, string>> = {
      7: { 1: 'G', 2: 'G', 3: 'G' },
      8: { 1: 'G', 2: 'B', 3: 'B', 4: 'G' },
      9: { 1: 'G', 2: 'B', 3: 'e', 4: 'G' },
      10: { 1: 'G', 2: 'B', 3: 'B', 4: 'G' },
      11: { 2: 'G', 3: 'B', 4: 'G' },
      12: { 2: 'G', 3: 'G' }
    };

    const shield_up: Record<number, Record<number, string>> = {
      7: { 1: 'G', 2: 'G', 3: 'G' },
      8: { 1: 'G', 2: 'B', 3: 'B', 4: 'G' },
      9: { 1: 'G', 2: 'B', 3: 'e', 4: 'G' },
      10: { 2: 'G', 3: 'B', 4: 'G' },
      11: { 3: 'G' }
    };

    const shield_left: Record<number, Record<number, string>> = {
      6: { 11: 'G', 12: 'G' },
      7: { 11: 'G', 12: 'B', 13: 'G' },
      8: { 11: 'G', 12: 'e', 13: 'G' },
      9: { 11: 'G', 12: 'B', 13: 'G' },
      10: { 12: 'G' }
    };

    const store = (name: string, matrix: string[]) => {
      const c = this.createCanvas(16, 16);
      this.drawMatrix(c.ctx, matrix, cmap);
      this.sprites[name] = this.outlineSprite(c.canvas);
    };

    // 1. Base player (unequipped before finding the sword)
    store('player_down_0', down_idle);
    store('player_down_1', down_walk1);
    store('player_down_2', down_walk2);

    store('player_up_0', up_idle);
    store('player_up_1', up_walk1);
    store('player_up_2', up_walk2);

    store('player_left_0', left_idle);
    store('player_left_1', left_walk1);
    store('player_left_2', left_walk2);

    store('player_right_0', mirror(left_idle));
    store('player_right_1', mirror(left_walk1));
    store('player_right_2', mirror(left_walk2));

    // 2. Player with Sword always in hand
    store('player_sword_down_0', overlayMatrix(down_idle, sword_down));
    store('player_sword_down_1', overlayMatrix(down_walk1, sword_down));
    store('player_sword_down_2', overlayMatrix(down_walk2, sword_down));

    store('player_sword_up_0', overlayMatrix(up_idle, sword_up));
    store('player_sword_up_1', overlayMatrix(up_walk1, sword_up));
    store('player_sword_up_2', overlayMatrix(up_walk2, sword_up));

    store('player_sword_left_0', overlayMatrix(left_idle, sword_left));
    store('player_sword_left_1', overlayMatrix(left_walk1, sword_left));
    store('player_sword_left_2', overlayMatrix(left_walk2, sword_left));

    store('player_sword_right_0', mirror(overlayMatrix(left_idle, sword_left)));
    store('player_sword_right_1', mirror(overlayMatrix(left_walk1, sword_left)));
    store('player_sword_right_2', mirror(overlayMatrix(left_walk2, sword_left)));

    // 3. Player with BOTH Sword and Shield in hand
    const gear_down = mergeOverlays(sword_down, shield_down);
    const gear_up = mergeOverlays(sword_up, shield_up);
    const gear_left = mergeOverlays(sword_left, shield_left);

    store('player_gear_down_0', overlayMatrix(down_idle, gear_down));
    store('player_gear_down_1', overlayMatrix(down_walk1, gear_down));
    store('player_gear_down_2', overlayMatrix(down_walk2, gear_down));

    store('player_gear_up_0', overlayMatrix(up_idle, gear_up));
    store('player_gear_up_1', overlayMatrix(up_walk1, gear_up));
    store('player_gear_up_2', overlayMatrix(up_walk2, gear_up));

    store('player_gear_left_0', overlayMatrix(left_idle, gear_left));
    store('player_gear_left_1', overlayMatrix(left_walk1, gear_left));
    store('player_gear_left_2', overlayMatrix(left_walk2, gear_left));

    store('player_gear_right_0', mirror(overlayMatrix(left_idle, gear_left)));
    store('player_gear_right_1', mirror(overlayMatrix(left_walk1, gear_left)));
    store('player_gear_right_2', mirror(overlayMatrix(left_walk2, gear_left)));

    for (const direction of ['down', 'up', 'left', 'right']) {
      for (let walkingFrame = 0; walkingFrame < 3; walkingFrame++) {
        this.sprites[`player_equipped_${direction}_${walkingFrame}`] =
          this.sprites[`player_gear_${direction}_${walkingFrame}`];
      }
    }

    const down_attack = [
      ...PLAYER_FRONT_HEAD.slice(0, 5),
      "....tttttt......",
      "..stttddttts....",
      "..dttttttttd....",
      "....bb..bb......",
      "....bb..bb.g....",
      "...........M....",
      "...........m....",
      "...........m....",
      "...........m....",
      "...........m....",
      "...........w...."
    ];
    const up_attack = [
      "...........w....",
      "...........m....",
      "...........m....",
      "...........m....",
      "...........M....",
      "....hhhhhh.g....",
      "...hhhhhhhh.....",
      "..hHHHHHHHHh....",
      "...hhhhhhhh.....",
      "....tttttt......",
      "..sttTTTTtts....",
      "..ddttttttdd....",
      "....bb..bb......",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];
    const left_attack = [
      ...PLAYER_SIDE_HEAD.slice(0, 5),
      "....ttttt.......",
      "wmMmsttwttt.....",
      "....stttTtt.....",
      "....dtttttt.....",
      "....ttTTtt......",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................",
      "................",
      "................"
    ];

    store('player_attack_0', down_attack);
    store('player_attack_1', up_attack);
    store('player_attack_2', left_attack);
    store('player_attack_3', mirror(left_attack));
  }

  // 2. Shield Stances
  private generatePlayerShieldSprites() {
    const p = this.palette;
    const cmap: Record<string, string> = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': p.hairBlonde,
      'H': p.hairDark,
      'i': '#4a3035',
      't': p.heroCoat,
      'T': p.heroCoatDark,
      'a': p.heroAccent,
      'A': p.heroAccentDark,
      'b': p.bootsBrown,
      'w': p.white,
      'g': p.shieldBorder,
      'B': p.shieldBlue,
      'e': p.shieldEmblem,
      'm': p.steelLight,
      'M': p.steelDark,
      'o': p.goldMid
    };

    const shield_down = [
      ...PLAYER_FRONT_HEAD,
      "....tttttt......",
      "..gggggggggg....",
      "..gBBBBBBBBg....",
      "..gBBBeBBBBg....",
      "..gBBeEeBBBg....",
      "..gBBBeBBBBg....",
      "...gBBBBBBg.....",
      "....gBBBBg......",
      "......gg........",
    ];

    // Guard pose with Wind-Cleaver still visible at the hip / over the shield edge
    const shield_sword_down = [
      ...PLAYER_FRONT_HEAD,
      "....tttttt......",
      "..ggggggggggo...",
      "..gBBBBBBBBgM...",
      "..gBBBeBBBBgm...",
      "..gBBeEeBBBgm...",
      "..gBBBeBBBBgm...",
      "...gBBBBBBg.m...",
      "....gBBBBg..m...",
      ".....gBBg...w...",
    ];

    const shield_up = [
      "....gggggg......",
      "...gBBBBBBg.....",
      "..gBBBeBBBBg....",
      "..gBBeEeBBBg....",
      "..gBBBeBBBBg....",
      "...gBBBBBBg.....",
      "....gBBBBg......",
      ".....gBBg.......",
      "......gg........",
      "....tttttt......",
      "..sttTTTTtts....",
      "..ddttttttdd....",
      "....bb..bb......",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];

    const shield_sword_up = [
      "....gggggg...w..",
      "...gBBBBBBg.m...",
      "..gBBBeBBBBgm...",
      "..gBBeEeBBBgm...",
      "..gBBBeBBBBgM...",
      "...gBBBBBBgo....",
      "....gBBBBg......",
      ".....gBBg.......",
      "......gg........",
      "....tttttt......",
      "..sttTTTTtts....",
      "..ddttttttdd....",
      "....bb..bb......",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];

    const shield_left = [
      ...PLAYER_SIDE_HEAD.slice(0, 4),
      ".gggssdssss.....",
      "gBBBgttttt......",
      "gBeBgsttwttt....",
      "gBeBgstttTtt....",
      "gBBBgtttttt.....",
      ".gBBgttTTtt.....",
      "..gg.bb.bb......",
      ".....bb.bb......",
      "....bbb.bbb.....",
      "................",
      "................",
      "................"
    ];

    const shield_sword_left = [
      ...PLAYER_SIDE_HEAD.slice(0, 4),
      ".gggssdssss.....",
      "gBBBgttttt......",
      "gBeBgsttwttt....",
      "gBeBgstttTttwmM.",
      "gBBBgtttttto....",
      ".gBBgttTTtt.....",
      "..gg.bb.bb......",
      ".....bb.bb......",
      "....bbb.bbb.....",
      "................",
      "................",
      "................"
    ];

    const mirror = (m: string[]) => m.map(row => row.split('').reverse().join(''));

    const store = (name: string, matrix: string[]) => {
      const c = this.createCanvas(16, 16);
      this.drawMatrix(c.ctx, matrix, cmap);
      this.sprites[name] = this.outlineSprite(c.canvas);
    };

    store('player_shield_0', shield_down);
    store('player_shield_1', shield_up);
    store('player_shield_2', shield_left);
    store('player_shield_3', mirror(shield_left));

    store('player_shield_sword_0', shield_sword_down);
    store('player_shield_sword_1', shield_sword_up);
    store('player_shield_sword_2', shield_sword_left);
    store('player_shield_sword_3', mirror(shield_sword_left));
  }

  // 3. 15th-Century Medieval Architecture
  private generateArchitectureTiles() {
    const p = this.palette;

    // Slate Roof (Ardoise)
    const cSlate = this.createCanvas(16, 16);
    const sctx = cSlate.ctx;
    sctx.fillStyle = p.slateRoofMid;
    sctx.fillRect(0, 0, 16, 16);
    sctx.fillStyle = p.slateRoofLight;
    sctx.fillRect(0, 0, 16, 2);
    sctx.fillRect(0, 7, 16, 1);
    sctx.fillRect(0, 8, 16, 1);
    sctx.fillStyle = p.slateRoofDark;
    sctx.fillRect(0, 6, 16, 1);
    sctx.fillRect(0, 15, 16, 1);
    for (let c = 0; c < 16; c += 4) {
      sctx.fillRect(c, 0, 1, 8);
      sctx.fillRect(c + 2, 8, 1, 8);
      sctx.fillStyle = p.slateRoofLight;
      sctx.fillRect(c + 1, 3, 2, 1);
      sctx.fillRect(c + 3, 11, 1, 1);
      sctx.fillStyle = p.slateRoofDark;
    }
    this.sprites['tile_roof_slate'] = cSlate.canvas;

    // Half-Timbered Wall (Colombage)
    const cTimber = this.createCanvas(16, 16);
    const tctx = cTimber.ctx;
    tctx.fillStyle = p.mortarWall;
    tctx.fillRect(0, 0, 16, 16);
    tctx.fillStyle = p.mortarShadow;
    tctx.fillRect(3, 4, 2, 1);
    tctx.fillRect(10, 11, 2, 1);
    tctx.fillStyle = p.timberBeam;
    tctx.fillRect(0, 0, 2, 16);
    tctx.fillRect(14, 0, 2, 16);
    tctx.fillRect(0, 0, 16, 2);
    tctx.fillRect(0, 14, 16, 2);
    tctx.fillStyle = p.barkLight;
    tctx.fillRect(1, 3, 1, 9);
    tctx.fillRect(3, 1, 10, 1);
    tctx.fillRect(14, 3, 1, 9);
    for (let i = 2; i < 14; i++) {
      tctx.fillRect(i, i, 2, 1);
    }
    tctx.fillStyle = p.timberBeamDark;
    tctx.fillRect(0, 15, 16, 1);
    tctx.fillRect(15, 0, 1, 16);
    this.sprites['tile_wall_timber'] = cTimber.canvas;

    // Window Wall
    const cWin = this.createCanvas(16, 16);
    cWin.ctx.drawImage(cTimber.canvas, 0, 0);
    const wctx = cWin.ctx;
    wctx.fillStyle = p.timberBeamDark;
    wctx.fillRect(4, 4, 8, 8);
    wctx.fillStyle = p.waterLight;
    wctx.fillRect(5, 5, 6, 6);
    wctx.fillStyle = p.waterMid;
    wctx.fillRect(6, 6, 4, 4);
    wctx.fillStyle = p.darkNavy;
    wctx.fillRect(7, 5, 1, 6);
    wctx.fillRect(5, 7, 6, 1);
    wctx.fillStyle = p.waterLight;
    wctx.fillRect(6, 6, 1, 1);
    this.sprites['tile_wall_window'] = cWin.canvas;

    // Gothic Door
    const cDoor = this.createCanvas(16, 16);
    cDoor.ctx.drawImage(cTimber.canvas, 0, 0);
    const dctx = cDoor.ctx;
    dctx.fillStyle = p.gothicStoneDark;
    dctx.beginPath();
    dctx.moveTo(3, 16);
    dctx.lineTo(3, 6);
    dctx.lineTo(8, 2);
    dctx.lineTo(13, 6);
    dctx.lineTo(13, 16);
    dctx.closePath();
    dctx.fill();
    dctx.fillStyle = p.timberBeam;
    dctx.fillRect(4, 5, 8, 11);
    dctx.fillStyle = p.goldMid;
    dctx.fillRect(5, 10, 2, 2);
    this.sprites['tile_door_gothic'] = cDoor.canvas;

    // Gothic Stone Wall
    const cStoneWall = this.createCanvas(16, 16);
    const swctx = cStoneWall.ctx;
    swctx.fillStyle = p.gothicStoneMid;
    swctx.fillRect(0, 0, 16, 16);
    swctx.fillStyle = p.gothicStoneDark;
    swctx.fillRect(0, 0, 16, 1);
    swctx.fillRect(0, 8, 16, 1);
    swctx.fillRect(0, 15, 16, 1);
    swctx.fillRect(0, 0, 1, 8);
    swctx.fillRect(8, 0, 1, 8);
    swctx.fillRect(4, 8, 1, 8);
    swctx.fillRect(12, 8, 1, 8);
    swctx.fillStyle = p.gothicStoneLight;
    swctx.fillRect(1, 1, 6, 1);
    swctx.fillRect(9, 1, 6, 1);
    swctx.fillRect(5, 9, 6, 1);
    this.sprites['tile_gothic_stone'] = cStoneWall.canvas;

    // Stained Glass Cathedral Window
    const cRose = this.createCanvas(16, 16);
    cRose.ctx.drawImage(cStoneWall.canvas, 0, 0);
    const rwctx = cRose.ctx;
    rwctx.fillStyle = p.gothicStoneDark;
    rwctx.beginPath();
    rwctx.arc(8, 8, 6, 0, Math.PI * 2);
    rwctx.fill();
    rwctx.fillStyle = p.stainedGlassBlue;
    rwctx.beginPath();
    rwctx.arc(8, 8, 5, 0, Math.PI * 2);
    rwctx.fill();
    rwctx.fillStyle = p.stainedGlassRed;
    rwctx.fillRect(6, 6, 4, 4);
    rwctx.fillStyle = p.stainedGlassGold;
    rwctx.fillRect(7, 7, 2, 2);
    this.sprites['tile_stained_glass'] = cRose.canvas;

    // Royal Crimson Throne
    const cThrone = this.createCanvas(16, 16);
    const trctx = cThrone.ctx;
    trctx.fillStyle = p.gothicStoneMid;
    trctx.fillRect(0, 0, 16, 16);
    trctx.fillStyle = p.goldMid;
    trctx.fillRect(2, 0, 12, 14);
    trctx.fillStyle = p.kingMantle;
    trctx.fillRect(4, 2, 8, 10);
    trctx.fillStyle = p.goldLight;
    trctx.fillRect(7, 0, 2, 3);
    trctx.fillRect(3, 11, 10, 4);
    this.sprites['tile_royal_throne'] = cThrone.canvas;

    // Royal Banner (Fleur-de-lis)
    const cBanner = this.createCanvas(16, 16);
    cBanner.ctx.drawImage(cStoneWall.canvas, 0, 0);
    const bnctx = cBanner.ctx;
    bnctx.fillStyle = p.shieldBlue;
    bnctx.fillRect(3, 1, 10, 13);
    bnctx.fillStyle = p.goldLight;
    bnctx.fillRect(7, 3, 2, 6);
    bnctx.fillRect(5, 5, 6, 2);
    bnctx.fillRect(4, 6, 2, 2);
    bnctx.fillRect(10, 6, 2, 2);
    bnctx.fillStyle = p.goldDark;
    bnctx.fillRect(6, 9, 4, 2);
    this.sprites['tile_banner'] = cBanner.canvas;

    // Red Carpet
    const cCarpet = this.createCanvas(16, 16);
    const cpctx = cCarpet.ctx;
    cpctx.fillStyle = p.gothicStoneMid;
    cpctx.fillRect(0, 0, 16, 16);
    cpctx.fillStyle = p.kingMantle;
    cpctx.fillRect(2, 0, 12, 16);
    cpctx.fillStyle = p.goldMid;
    cpctx.fillRect(2, 0, 1, 16);
    cpctx.fillRect(13, 0, 1, 16);
    this.sprites['tile_carpet'] = cCarpet.canvas;

    // Vineyard Grape Trellis (for Trilha do Vinho / Dijon)
    const cVine = this.createCanvas(16, 16);
    const vctx = cVine.ctx;
    vctx.fillStyle = p.grassMid;
    vctx.fillRect(0, 0, 16, 16);
    vctx.fillStyle = p.timberBeamDark;
    vctx.fillRect(2, 1, 2, 14);
    vctx.fillRect(12, 1, 2, 14);
    vctx.fillRect(2, 4, 12, 2);
    vctx.fillRect(2, 10, 12, 2);
    vctx.fillStyle = '#682058'; // Rich wine grapes
    vctx.fillRect(4, 5, 3, 3);
    vctx.fillRect(9, 5, 3, 3);
    vctx.fillRect(5, 11, 3, 3);
    vctx.fillRect(8, 11, 3, 3);
    this.sprites['tile_vineyard'] = cVine.canvas;

    const cFountain = this.createCanvas(16, 16);
    const fctx = cFountain.ctx;
    fctx.fillStyle = p.gothicStoneDark;
    fctx.fillRect(2, 5, 12, 9);
    fctx.fillStyle = p.gothicStoneLight;
    fctx.fillRect(3, 6, 10, 7);
    fctx.fillStyle = p.waterMid;
    fctx.fillRect(4, 8, 8, 4);
    fctx.fillStyle = p.waterLight;
    fctx.fillRect(5, 8, 3, 1);
    fctx.fillRect(8, 7, 1, 2);
    fctx.fillStyle = p.gothicStoneDark;
    fctx.fillRect(1, 13, 14, 2);
    fctx.fillStyle = p.goldMid;
    fctx.fillRect(7, 3, 2, 3);
    this.sprites['tile_fountain'] = cFountain.canvas;

    const cStandingStone = this.createCanvas(16, 16);
    const stoneCtx = cStandingStone.ctx;
    stoneCtx.fillStyle = p.gothicStoneDark;
    stoneCtx.fillRect(4, 12, 8, 3);
    stoneCtx.fillStyle = p.grassDark;
    stoneCtx.fillRect(2, 14, 12, 2);
    stoneCtx.fillStyle = p.gothicStoneMid;
    stoneCtx.fillRect(5, 3, 6, 10);
    stoneCtx.fillRect(4, 5, 8, 6);
    stoneCtx.fillStyle = p.gothicStoneLight;
    stoneCtx.fillRect(6, 4, 2, 6);
    stoneCtx.fillRect(8, 11, 2, 1);
    stoneCtx.fillStyle = p.goldDark;
    stoneCtx.fillRect(8, 6, 1, 3);
    stoneCtx.fillRect(7, 7, 3, 1);
    this.sprites['tile_standing_stone'] = cStandingStone.canvas;

    const lighthouse = this.createCanvas(16, 16);
    const lightCtx = lighthouse.ctx;
    lightCtx.fillStyle = p.gothicStoneDark;
    lightCtx.fillRect(4, 14, 8, 2);
    lightCtx.fillStyle = p.gothicStoneMid;
    lightCtx.fillRect(5, 6, 6, 8);
    lightCtx.fillRect(4, 9, 8, 2);
    lightCtx.fillStyle = p.gothicStoneLight;
    lightCtx.fillRect(6, 7, 2, 5);
    lightCtx.fillStyle = p.stainedGlassRed;
    lightCtx.fillRect(6, 3, 4, 3);
    lightCtx.fillStyle = p.goldLight;
    lightCtx.fillRect(7, 4, 2, 1);
    lightCtx.fillStyle = p.gothicStoneDark;
    lightCtx.fillRect(5, 2, 6, 1);
    this.sprites['tile_lighthouse'] = lighthouse.canvas;

    const marketStall = this.createCanvas(16, 16);
    const marketCtx = marketStall.ctx;
    marketCtx.fillStyle = p.timberBeamDark;
    marketCtx.fillRect(3, 4, 2, 10);
    marketCtx.fillRect(11, 4, 2, 10);
    marketCtx.fillRect(2, 13, 12, 2);
    marketCtx.fillStyle = p.stainedGlassRed;
    marketCtx.fillRect(2, 3, 12, 2);
    marketCtx.fillRect(3, 1, 3, 2);
    marketCtx.fillRect(10, 1, 3, 2);
    marketCtx.fillStyle = p.goldLight;
    marketCtx.fillRect(6, 1, 4, 4);
    marketCtx.fillStyle = p.dirtMid;
    marketCtx.fillRect(5, 8, 6, 5);
    marketCtx.fillStyle = p.dirtLight;
    marketCtx.fillRect(6, 9, 4, 2);
    this.sprites['tile_market_stall'] = marketStall.canvas;

    const bellTower = this.createCanvas(16, 16);
    const towerCtx = bellTower.ctx;
    towerCtx.fillStyle = p.gothicStoneDark;
    towerCtx.fillRect(3, 5, 10, 10);
    towerCtx.fillStyle = p.gothicStoneMid;
    towerCtx.fillRect(4, 6, 8, 8);
    towerCtx.fillStyle = p.gothicStoneLight;
    towerCtx.fillRect(6, 7, 4, 5);
    towerCtx.fillStyle = p.black;
    towerCtx.fillRect(7, 8, 2, 4);
    towerCtx.fillStyle = p.goldMid;
    towerCtx.fillRect(7, 9, 2, 2);
    towerCtx.fillStyle = p.gothicStoneDark;
    towerCtx.fillRect(2, 4, 12, 2);
    towerCtx.fillRect(5, 2, 6, 2);
    towerCtx.fillRect(7, 0, 2, 2);
    towerCtx.fillStyle = p.goldLight;
    towerCtx.fillRect(7, 3, 2, 1);
    this.sprites['tile_bell_tower'] = bellTower.canvas;
  }

  private generateHouseInteriorTiles() {
    const p = this.palette;

    const floor = this.createCanvas(16, 16);
    floor.ctx.fillStyle = '#9b6b3b';
    floor.ctx.fillRect(0, 0, 16, 16);
    floor.ctx.fillStyle = '#bd8950';
    floor.ctx.fillRect(1, 1, 14, 6);
    floor.ctx.fillRect(1, 9, 14, 6);
    floor.ctx.fillStyle = '#754a2a';
    floor.ctx.fillRect(0, 7, 16, 1);
    floor.ctx.fillRect(0, 15, 16, 1);
    floor.ctx.fillRect(7, 1, 1, 6);
    floor.ctx.fillRect(11, 9, 1, 6);
    this.sprites['tile_oak_floor'] = floor.canvas;

    const bed = this.createCanvas(16, 16);
    bed.ctx.drawImage(floor.canvas, 0, 0);
    bed.ctx.fillStyle = p.darkNavy;
    bed.ctx.fillRect(2, 3, 12, 10);
    bed.ctx.fillStyle = '#8f3344';
    bed.ctx.fillRect(3, 5, 10, 7);
    bed.ctx.fillStyle = '#e8d9bd';
    bed.ctx.fillRect(3, 4, 5, 3);
    bed.ctx.fillStyle = '#c8a45c';
    bed.ctx.fillRect(2, 3, 12, 1);
    this.sprites['tile_bed'] = bed.canvas;

    const shelf = this.createCanvas(16, 16);
    shelf.ctx.drawImage(floor.canvas, 0, 0);
    shelf.ctx.fillStyle = p.timberBeamDark;
    shelf.ctx.fillRect(2, 1, 12, 14);
    shelf.ctx.fillStyle = p.timberBeam;
    shelf.ctx.fillRect(3, 2, 10, 12);
    shelf.ctx.fillStyle = '#d8c49c';
    shelf.ctx.fillRect(4, 3, 3, 4);
    shelf.ctx.fillRect(8, 3, 4, 4);
    shelf.ctx.fillStyle = p.shieldBlue;
    shelf.ctx.fillRect(4, 9, 3, 4);
    shelf.ctx.fillStyle = p.kingMantle;
    shelf.ctx.fillRect(8, 9, 4, 4);
    shelf.ctx.fillStyle = p.timberBeamDark;
    shelf.ctx.fillRect(2, 7, 12, 1);
    this.sprites['tile_bookshelf'] = shelf.canvas;

    const table = this.createCanvas(16, 16);
    table.ctx.drawImage(floor.canvas, 0, 0);
    table.ctx.fillStyle = p.timberBeamDark;
    table.ctx.fillRect(2, 4, 12, 7);
    table.ctx.fillStyle = '#a86c35';
    table.ctx.fillRect(3, 4, 10, 5);
    table.ctx.fillStyle = '#d39a55';
    table.ctx.fillRect(4, 5, 8, 1);
    table.ctx.fillStyle = p.timberBeamDark;
    table.ctx.fillRect(4, 11, 2, 4);
    table.ctx.fillRect(10, 11, 2, 4);
    this.sprites['tile_house_table'] = table.canvas;
  }

  // 4. Forest & Outdoor Tiles
  private generateForestAndNatureTiles() {
    const p = this.palette;

    // Grass
    const cGrass = this.createCanvas(16, 16);
    const gctx = cGrass.ctx;
    this.shadeTile(gctx, p.grassMid, [p.grassMidLight, p.grassLight], [p.grassDark, p.grassShade]);
    gctx.fillStyle = p.grassLight;
    gctx.fillRect(3, 3, 1, 2);
    gctx.fillRect(11, 7, 1, 2);
    gctx.fillRect(6, 12, 1, 2);
    gctx.fillStyle = p.grassDark;
    gctx.fillRect(4, 4, 1, 1);
    gctx.fillRect(12, 8, 1, 1);
    this.sprites['tile_grass'] = cGrass.canvas;

    const cGrassAlt = this.createCanvas(16, 16);
    this.shadeTile(cGrassAlt.ctx, p.grassMidLight, [p.grassLight, p.leafHighlight], [p.grassMid, p.grassDark]);
    cGrassAlt.ctx.fillStyle = p.grassLight;
    cGrassAlt.ctx.fillRect(2, 10, 2, 1);
    cGrassAlt.ctx.fillRect(11, 3, 2, 1);
    this.sprites['tile_grass_alt'] = cGrassAlt.canvas;

    // Wildflowers
    const cFlowers = this.createCanvas(16, 16);
    cFlowers.ctx.drawImage(cGrass.canvas, 0, 0);
    cFlowers.ctx.fillStyle = p.stainedGlassRed;
    cFlowers.ctx.fillRect(5, 5, 2, 2);
    cFlowers.ctx.fillStyle = p.goldLight;
    cFlowers.ctx.fillRect(6, 6, 1, 1);
    cFlowers.ctx.fillStyle = p.white;
    cFlowers.ctx.fillRect(11, 10, 2, 2);
    this.sprites['tile_grass_flowers'] = cFlowers.canvas;

    // Dirt
    const cDirt = this.createCanvas(16, 16);
    const dctx = cDirt.ctx;
    this.shadeTile(dctx, p.dirtMid, [p.dirtMidLight, p.dirtLight], [p.dirtDark, p.timberBeamDark]);
    dctx.fillStyle = p.dirtLight;
    dctx.fillRect(3, 3, 9, 1);
    dctx.fillRect(4, 12, 8, 1);
    dctx.fillStyle = p.dirtMid;
    dctx.fillRect(2, 4, 4, 2);
    dctx.fillRect(9, 10, 5, 2);
    dctx.fillStyle = p.dirtDark;
    dctx.fillRect(6, 5, 1, 1);
    dctx.fillRect(11, 11, 1, 1);
    this.sprites['tile_dirt'] = cDirt.canvas;

    // Cobblestone
    const cCobble = this.createCanvas(16, 16);
    const cbctx = cCobble.ctx;
    cbctx.fillStyle = p.gothicStoneMid;
    cbctx.fillRect(0, 0, 16, 16);
    cbctx.fillStyle = p.gothicStoneLight;
    cbctx.fillRect(1, 1, 6, 6);
    cbctx.fillRect(9, 1, 6, 6);
    cbctx.fillRect(1, 9, 6, 6);
    cbctx.fillRect(9, 9, 6, 6);
    cbctx.fillStyle = p.gothicStoneDark;
    cbctx.fillRect(0, 0, 16, 1);
    cbctx.fillRect(0, 8, 16, 1);
    cbctx.fillRect(0, 0, 1, 16);
    cbctx.fillRect(8, 0, 1, 16);
    this.sprites['tile_cobble'] = cCobble.canvas;

    const cBridge = this.createCanvas(16, 16);
    const brctx = cBridge.ctx;
    brctx.fillStyle = p.barkDark;
    brctx.fillRect(0, 0, 16, 16);
    brctx.fillStyle = p.barkMid;
    brctx.fillRect(1, 0, 14, 16);
    brctx.fillStyle = p.barkLight;
    for (let y = 1; y < 16; y += 4) {
      brctx.fillRect(2, y, 12, 2);
      brctx.fillStyle = p.barkDark;
      brctx.fillRect(2, y + 2, 12, 1);
      brctx.fillStyle = p.barkLight;
      brctx.fillRect(3, y, 1, 1);
      brctx.fillRect(12, y, 1, 1);
    }
    this.sprites['tile_bridge'] = cBridge.canvas;

    // Water
    for (let frame = 0; frame < 3; frame++) {
      const cWater = this.createCanvas(16, 16);
      const wctx = cWater.ctx;
      this.shadeTile(wctx, p.waterMid, [p.waterMidLight, p.waterLight], [p.waterDark, p.darkNavy]);
      const flowY = (frame * 3) % 8;
      wctx.fillStyle = p.waterLight;
      wctx.fillRect(1 + frame * 2, 3 + flowY, 5, 1);
      wctx.fillRect(9 - frame, (10 + flowY) % 15, 4, 1);
      wctx.fillStyle = p.waterDark;
      wctx.fillRect(1 + frame * 2, 4 + flowY, 5, 1);
      wctx.fillRect(9 - frame, (11 + flowY) % 16, 4, 1);
      this.sprites[`tile_water_${frame}`] = cWater.canvas;
    }
    this.sprites['tile_water'] = this.sprites['tile_water_0'];

    // Tree Trunk
    const cTrunk = this.createCanvas(16, 16);
    const trkctx = cTrunk.ctx;
    trkctx.fillStyle = p.grassMid;
    trkctx.fillRect(0, 0, 16, 16);
    trkctx.fillStyle = p.grassShade;
    trkctx.fillRect(2, 12, 12, 2);
    trkctx.fillStyle = p.barkMid;
    trkctx.fillRect(4, 0, 8, 13);
    trkctx.fillStyle = p.barkDark;
    trkctx.fillRect(4, 0, 3, 13);
    trkctx.fillRect(3, 11, 10, 3);
    trkctx.fillStyle = p.barkLight;
    trkctx.fillRect(9, 2, 2, 8);
    this.sprites['tile_tree_trunk'] = cTrunk.canvas;

    // Tree Top
    const cTreeTop = this.createCanvas(16, 16);
    const ttctx = cTreeTop.ctx;
    ttctx.fillStyle = p.grassShade;
    ttctx.fillRect(2, 7, 12, 7);
    ttctx.fillRect(4, 4, 8, 3);
    ttctx.fillRect(6, 2, 4, 2);
    ttctx.fillStyle = p.grassDark;
    ttctx.fillRect(3, 6, 10, 7);
    ttctx.fillRect(5, 3, 6, 4);
    ttctx.fillStyle = p.grassMid;
    ttctx.fillRect(4, 5, 8, 6);
    ttctx.fillRect(6, 3, 5, 3);
    ttctx.fillStyle = p.leafHighlight;
    ttctx.fillRect(5, 4, 3, 2);
    ttctx.fillRect(8, 7, 2, 1);
    ttctx.fillStyle = p.grassDark;
    ttctx.fillRect(4, 11, 8, 2);
    this.sprites['tile_tree_top'] = cTreeTop.canvas;

    // Large Pokémon GBC Forest Tree (32x32)
    const cBigTree = this.createCanvas(32, 32);
    const btctx = cBigTree.ctx;
    btctx.fillStyle = p.grassShade;
    btctx.fillRect(4, 8, 24, 12);
    btctx.fillRect(7, 4, 18, 5);
    btctx.fillRect(10, 1, 12, 4);
    btctx.fillStyle = p.grassDark;
    btctx.fillRect(5, 8, 22, 10);
    btctx.fillRect(8, 4, 17, 5);
    btctx.fillRect(11, 2, 11, 3);
    btctx.fillStyle = p.grassMid;
    btctx.fillRect(7, 8, 17, 8);
    btctx.fillRect(9, 5, 14, 4);
    btctx.fillRect(12, 3, 8, 3);
    btctx.fillStyle = p.leafHighlight;
    btctx.fillRect(9, 6, 5, 2);
    btctx.fillRect(16, 9, 4, 1);
    btctx.fillStyle = p.grassDark;
    btctx.fillRect(6, 16, 20, 3);
    btctx.fillStyle = p.barkMid;
    btctx.fillRect(11, 18, 10, 13);
    btctx.fillStyle = p.barkDark;
    btctx.fillRect(11, 18, 4, 13);
    btctx.fillRect(9, 27, 14, 4);
    btctx.fillStyle = p.barkLight;
    btctx.fillRect(17, 20, 2, 8);
    this.sprites['tree_big'] = cBigTree.canvas;

    // Fence
    const cFence = this.createCanvas(16, 16);
    cFence.ctx.fillStyle = p.grassMid;
    cFence.ctx.fillRect(0, 0, 16, 16);
    cFence.ctx.fillStyle = p.timberBeamDark;
    cFence.ctx.fillRect(0, 5, 16, 2);
    cFence.ctx.fillRect(0, 10, 16, 2);
    cFence.ctx.fillRect(2, 3, 3, 11);
    cFence.ctx.fillRect(11, 3, 3, 11);
    this.sprites['tile_fence'] = cFence.canvas;

    // Signpost
    const cSign = this.createCanvas(16, 16);
    cSign.ctx.fillStyle = p.grassMid;
    cSign.ctx.fillRect(0, 0, 16, 16);
    cSign.ctx.fillStyle = p.dirtLight;
    cSign.ctx.fillRect(2, 3, 12, 8);
    cSign.ctx.fillStyle = p.dirtDark;
    cSign.ctx.strokeRect(2.5, 3.5, 11, 7);
    cSign.ctx.fillRect(7, 11, 2, 5);
    this.sprites['tile_sign'] = cSign.canvas;

    // Blacksmith Forge Anvil
    const cAnvil = this.createCanvas(16, 16);
    cAnvil.ctx.fillStyle = p.gothicStoneMid;
    cAnvil.ctx.fillRect(0, 0, 16, 16);
    cAnvil.ctx.fillStyle = p.steelDark;
    cAnvil.ctx.fillRect(3, 4, 10, 4);
    cAnvil.ctx.fillRect(5, 8, 6, 5);
    cAnvil.ctx.fillRect(2, 13, 12, 2);
    cAnvil.ctx.fillStyle = p.steelLight;
    cAnvil.ctx.fillRect(4, 4, 8, 1);
    this.sprites['tile_anvil'] = cAnvil.canvas;
  }

  private generateRegionalTiles() {
    const themes = {
      pastoral: { tint: '#c7ce62', alpha: 0.22 },
      woodland: { tint: '#075641', alpha: 0.32 },
      road: { tint: '#bd8b3e', alpha: 0.2 },
      town: { tint: '#71879e', alpha: 0.22 },
      riverTown: { tint: '#168c91', alpha: 0.27 },
      market: { tint: '#d77842', alpha: 0.24 },
      cathedral: { tint: '#7861a8', alpha: 0.26 },
      vineyardTown: { tint: '#914b71', alpha: 0.27 },
      royal: { tint: '#3e324f', alpha: 0.28 }
    };
    const tileNames = [
      'tile_grass',
      'tile_grass_alt',
      'tile_grass_flowers',
      'tile_dirt',
      'tile_cobble',
      'tile_bridge',
      'tile_water_0',
      'tile_water_1',
      'tile_water_2'
    ];

    for (const [themeName, theme] of Object.entries(themes)) {
      for (const tileName of tileNames) {
        const source = this.sprites[tileName];
        if (!source) continue;

        const regional = this.createCanvas(source.width, source.height);
        regional.ctx.drawImage(source, 0, 0);
        regional.ctx.globalCompositeOperation = 'source-atop';
        regional.ctx.globalAlpha = theme.alpha;
        regional.ctx.fillStyle = theme.tint;
        regional.ctx.fillRect(0, 0, source.width, source.height);
        regional.ctx.globalAlpha = 1;
        regional.ctx.globalCompositeOperation = 'source-over';

        const suffix = tileName.slice('tile_'.length);
        this.sprites[`tile_${themeName}_${suffix}`] = regional.canvas;
      }
    }
  }

  // 5. NPC Sprites
  private generateNPCSprites() {
    const p = this.palette;

    // Elder Tobias
    const elderMap: Record<string, string> = {
      '.': p.transparent,
      'w': p.white,
      'b': p.cream,
      's': p.skinLight,
      'd': p.skinMid,
      'r': '#416b38',
      'c': p.barkMid,
      'k': p.black
    };
    const elderMatrix = [
      ".....bbbb.......",
      "....bbbbbb......",
      "...bbssdsbb.....",
      "...bsskdsbb.....",
      "...bbbbbbbb.....",
      "...bbbbbbbb.....",
      "....bbbbbb......",
      "....rrrrrr.c....",
      "...rrrrrrrr.c...",
      "..srrrrrrrrs.c..",
      "..drrrrrrrrd..c.",
      "...rrrrrrrr...c.",
      "...rrrrrrrr...c.",
      "....rrrrrr....c.",
      "....bb..bb....c.",
      "................"
    ];
    const cElder = this.createCanvas(16, 16);
    this.drawMatrix(cElder.ctx, elderMatrix, elderMap);
    this.sprites['npc_oldman'] = this.outlineSprite(cElder.canvas);

    // Master Pierre (Blacksmith)
    const smithMap: Record<string, string> = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': '#3c2415',
      'a': p.banditLeather,
      't': p.cream,
      'b': p.bootsBrown,
      'm': p.steelLight
    };
    const smithMatrix = [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "..hhssssdshh....",
      "..hssssssss.....",
      "..hssksssssh....",
      "..hhhhhhhhhh....",
      "...hhhhhhhh.....",
      "....ttattt......",
      "...ttaaattt.....",
      "..sttaaaatts.m..",
      "..dttaaaatts.m..",
      "...daaaaaad..m..",
      "....aaaaaa...m..",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];
    const cSmith = this.createCanvas(16, 16);
    this.drawMatrix(cSmith.ctx, smithMatrix, smithMap);
    this.sprites['npc_blacksmith'] = this.outlineSprite(cSmith.canvas);

    // Baker Woman (Aiguemorte Orphan Flour Quest)
    const bakerMap: Record<string, string> = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'g': '#888899', // Grey hair bun
      'w': p.white,   // White baker apron & scarf
      'b': '#553322', // Dress
      'f': '#ffffff'  // Flour dusting
    };
    const bakerMatrix = [
      "......gggg......",
      ".....gggggg.....",
      "....gwwwwwwg....",
      "....gssssssg....",
      "....gskssksg....",
      ".....ssddss.....",
      "....wwwwwwww....",
      "...wwwwwwwwww...",
      "..swwfwwwwffws..",
      "..dwwfffffffwd..",
      "...bbffffffbb...",
      "...bbffffffbb...",
      "...bbbbbbbbbb...",
      "....bb....bb....",
      "....bb....bb....",
      "................"
    ];
    const cBaker = this.createCanvas(16, 16);
    this.drawMatrix(cBaker.ctx, bakerMatrix, bakerMap);
    this.sprites['npc_baker'] = this.outlineSprite(cBaker.canvas);

    // Vintner Marc (Vineyard Region / Dijon)
    const vintnerMap: Record<string, string> = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': '#c8a030', // Straw vineyard hat
      'g': '#206030', // Green tunic
      'b': p.bootsBrown,
      'v': '#782068'  // Wine barrel / grapes
    };
    const vintnerMatrix = [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "..hhhhhhhhhh....",
      "....ssssss......",
      "....skssks......",
      ".....dddd.......",
      "....gggggg......",
      "...gggggggg.....",
      "..sggggggggs....",
      "..dggggggggd....",
      "...gggggggg.vv..",
      "....gggggg..vv..",
      "....bb..bb......",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];
    const cVintner = this.createCanvas(16, 16);
    this.drawMatrix(cVintner.ctx, vintnerMatrix, vintnerMap);
    this.sprites['npc_vintner'] = this.outlineSprite(cVintner.canvas);

    // Corrupt Royal Guard / Knight
    const knightMap: Record<string, string> = {
      '.': p.transparent,
      'P': p.knightPlume,
      'g': p.knightSteel,
      'G': p.knightDark,
      'k': p.black,
      'y': p.goldMid,
      'm': p.steelLight,
      'M': p.steelDark
    };
    const knightMatrix = [
      "....PPP.........",
      "...PPPP.........",
      "....ggg.....m...",
      "...ggggg...mm...",
      "...gkkkg..mMm...",
      "...ggggg.m.M.m..",
      "....yyy....M....",
      "...ggPgg...M....",
      "..yggPggy..M....",
      "..ggggggg..M....",
      "..ggggggg..M....",
      "...gGGgG...M....",
      "...gg..gg..M....",
      "...gg..gg..M....",
      "..ggg..ggg.M....",
      "................"
    ];
    const cKnight = this.createCanvas(16, 16);
    this.drawMatrix(cKnight.ctx, knightMatrix, knightMap);
    this.sprites['npc_guard'] = this.outlineSprite(cKnight.canvas);

    // Merchant Aldric
    const merchantMap: Record<string, string> = {
      '.': p.transparent,
      'S': p.skinLight,
      'h': p.timberBeamDark,
      'H': p.timberBeam,
      'r': '#942028',
      'R': '#641018',
      'g': p.goldMid,
      'G': p.goldDark,
      'b': p.dirtMid,
      'B': p.dirtDark,
      'k': p.black,
      'e': p.skinDark
    };
    const merchantMatrix = [
      "...hhhhh........",
      "...HHHHH........",
      "...SSSSS........",
      "...SeSS..........",
      "..RRRRRRR.......",
      "..rrRRRrr.......",
      "..rrRgRrr.......",
      "..rrrrrrrBBB....",
      "..rrrrrrrBgB....",
      "..rrrrrrrBBB....",
      "...rrRrrr.......",
      "...rr.rr........",
      "...rr.rr........",
      "..RRR.RRR.......",
      "................",
      "................"
    ];
    const cMerchant = this.createCanvas(16, 16);
    this.drawMatrix(cMerchant.ctx, merchantMatrix, merchantMap);
    this.sprites['npc_merchant'] = this.outlineSprite(cMerchant.canvas);
  }

  // 6. Enemy Sprites
  private generateEnemySprites() {
    const p = this.palette;

    // Wild Boar
    const boarMap: Record<string, string> = {
      '.': p.transparent,
      'b': p.boarBristle,
      'B': p.boarDark,
      't': p.cream,
      'r': p.stainedGlassRed,
      'k': p.black
    };
    const boar1 = [
      "................",
      ".....bbbb.......",
      "....bbbbbb......",
      "...bbrbbbbb.....",
      "..bbkbbbbbb.....",
      ".tbbbbBbbbB.....",
      "ttbbbbBbbbB.....",
      ".tbbBBBBBBB.....",
      "..bbBBBBBBB.....",
      "...bbbbbbbb.....",
      "....bbbbbbb.....",
      "....BB..BB......",
      "....BB..BB......",
      "....BB..BB......",
      "....kk..kk......",
      "................"
    ];
    const boar2 = [
      "................",
      ".....bbbb.......",
      "....bbbbbb......",
      "...bbrbbbbb.....",
      "..bbkbbbbbb.....",
      ".tbbbbBbbbB.....",
      "ttbbbbBbbbB.....",
      ".tbbBBBBBBB.....",
      "..bbBBBBBBB.....",
      "...bbbbbbbb.....",
      "....bbbbbbb.....",
      "....BB...BB.....",
      "...BBB...BBB....",
      "....kk...kk.....",
      "................",
      "................"
    ];

    const store = (name: string, m: string[], cmap: Record<string, string>) => {
      const c = this.createCanvas(16, 16);
      this.drawMatrix(c.ctx, m, cmap);
      this.sprites[name] = this.outlineSprite(c.canvas);
    };
    store('enemy_boar_0', boar1, boarMap);
    store('enemy_boar_1', boar2, boarMap);

    // Wolf
    const wolfMap: Record<string, string> = {
      '.': p.transparent,
      'w': p.wolfGrey,
      'W': p.wolfDark,
      'r': p.stainedGlassRed,
      'k': p.black
    };
    const wolf1 = [
      "...w.....w......",
      "..ww.....ww.....",
      "..www...www.....",
      "...wwr.rww......",
      "...wwwwwww......",
      "....wwkww.......",
      "....wwwwww......",
      "...wwwwwwww.....",
      "..wwwwwwwwww....",
      ".wwwwwwwwwwww...",
      "..wwwwwwwwww....",
      "...WWWWWWWW.....",
      "...WW....WW.....",
      "...WW....WW.....",
      "..kkk....kkk....",
      "................"
    ];
    const wolf2 = [
      "...w.....w......",
      "..ww.....ww.....",
      "..www...www.....",
      "...wwr.rww......",
      "...wwwwwww......",
      "....wwkww.......",
      "....wwwwww......",
      "...wwwwwwww.....",
      "..wwwwwwwwww....",
      ".wwwwwwwwwwww...",
      "..wwwwwwwwww....",
      "...WWWWWWWW.....",
      "..WWW....WWW....",
      "...WW....WW.....",
      "...kk....kk.....",
      "................"
    ];
    store('enemy_wolf_0', wolf1, wolfMap);
    store('enemy_wolf_1', wolf2, wolfMap);

    // Bandit / Rogue
    const banditMap: Record<string, string> = {
      '.': p.transparent,
      'c': p.banditCloth,
      'l': p.banditLeather,
      's': p.skinLight,
      'k': p.black,
      'r': p.stainedGlassRed,
      'm': p.steelLight,
      'M': p.steelDark,
      'b': p.bootsBrown
    };
    const bandit1 = [
      "....cccc........",
      "...cccccc.......",
      "..ccksskcc......",
      "..ccsssscc......",
      "...crrrrc.......",
      "....llll........",
      "...llllll..M....",
      "..slllllls.m....",
      "..sllkllll.m....",
      "..sllllllm.m....",
      "...llllll..M....",
      "....cccc........",
      "....bb.bb.......",
      "....bb.bb.......",
      "...bbb.bbb......",
      "................"
    ];
    const bandit2 = [
      "....cccc........",
      "...cccccc.......",
      "..ccksskcc......",
      "..ccsssscc......",
      "...crrrrc.......",
      "....llll........",
      "...llllll..M....",
      "..slllllls.m....",
      "..sllkllll.m....",
      "..sllllllm.m....",
      "...llllll..M....",
      "....cccc........",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    store('enemy_bandit_0', bandit1, banditMap);
    store('enemy_bandit_1', bandit2, banditMap);

    // Corrupt Knight Enemy
    this.sprites['enemy_corrupt_knight_0'] = this.sprites['npc_guard'];
    this.sprites['enemy_corrupt_knight_1'] = this.sprites['npc_guard'];
    for (const type of ['boar', 'wolf', 'bandit', 'corrupt_knight']) {
      this.sprites[`enemy_${type}_2`] = this.makeStrideFrame(this.sprites[`enemy_${type}_0`]);
    }
  }

  // 7. Boss King Raymond IV
  private generateBossSprites() {
    const p = this.palette;
    const kingMap: Record<string, string> = {
      '.': p.transparent,
      'c': p.kingGold,
      'g': p.goldLight,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'a': p.kingArmor,
      'A': '#201830',
      'm': p.kingMantle,
      'w': p.kingMantleErmine,
      'S': p.steelLight,
      'D': p.steelDark,
      'b': p.bootsBrown
    };

    const king_idle = [
      ".....cggc.......",
      "....cggggc......",
      "....dssssd......",
      "....ssksks......",
      "....dssssd......",
      "...wwaaaa.D.....",
      "..wmaaaaaa.S....",
      ".wmaAaaaaa.S....",
      ".mmaAaaaaa.S....",
      ".mmmaaaaamm.....",
      ".mmmaaaaamm.....",
      "..m.aaaa.m......",
      "....AAAA........",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];

    const king_attack = [
      ".....cggc...S...",
      "....cggggc..S...",
      "....dssssd..S...",
      "....ssksks..S...",
      "....dssssd.DD...",
      "...wwaaaa..gg...",
      "..wmaaaaaa..m...",
      ".wmaAaaaaa..m...",
      ".mmaAaaaaa..m...",
      ".mmmaaaaamm.....",
      ".mmmaaaaamm.....",
      "..m.aaaa.m......",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];

    const c1 = this.createCanvas(16, 16);
    this.drawMatrix(c1.ctx, king_idle, kingMap);
    this.sprites['boss_king_0'] = this.outlineSprite(c1.canvas);

    const c2 = this.createCanvas(16, 16);
    this.drawMatrix(c2.ctx, king_attack, kingMap);
    this.sprites['boss_king_1'] = this.outlineSprite(c2.canvas);
    this.sprites['boss_king_2'] = this.makeStrideFrame(this.sprites['boss_king_0']);

    // Shockwave
    const cSw = this.createCanvas(16, 16);
    const swctx = cSw.ctx;
    swctx.strokeStyle = p.goldLight;
    swctx.lineWidth = 2;
    swctx.beginPath();
    swctx.arc(8, 8, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    swctx.stroke();
    swctx.strokeStyle = p.stainedGlassRed;
    swctx.lineWidth = 1;
    swctx.beginPath();
    swctx.arc(8, 7, 5, 0.2 * Math.PI, 0.8 * Math.PI);
    swctx.stroke();
    this.sprites['boss_shockwave'] = cSw.canvas;
  }

  // 8. Items & HUD Sprites
  private generateItemAndHUDSprites() {
    const p = this.palette;

    const coin = this.createCanvas(16, 16);
    coin.ctx.fillStyle = p.goldDark;
    coin.ctx.fillRect(5, 3, 7, 10);
    coin.ctx.fillStyle = p.goldMid;
    coin.ctx.fillRect(4, 4, 7, 9);
    coin.ctx.fillStyle = p.goldLight;
    coin.ctx.fillRect(5, 5, 4, 1);
    coin.ctx.fillRect(5, 7, 2, 4);
    this.sprites['item_coin'] = coin.canvas;

    const mapItem = this.createCanvas(16, 16);
    mapItem.ctx.fillStyle = '#6e4b22';
    mapItem.ctx.fillRect(3, 3, 10, 11);
    mapItem.ctx.fillStyle = '#e8d8ae';
    mapItem.ctx.fillRect(4, 2, 8, 11);
    mapItem.ctx.fillStyle = '#6aa6a1';
    mapItem.ctx.fillRect(5, 4, 6, 6);
    mapItem.ctx.fillStyle = '#d7bd73';
    mapItem.ctx.fillRect(7, 4, 1, 6);
    mapItem.ctx.fillRect(5, 6, 6, 1);
    mapItem.ctx.fillStyle = '#8b452a';
    mapItem.ctx.fillRect(4, 12, 8, 1);
    this.sprites['item_map'] = this.outlineSprite(mapItem.canvas);

    // Straw Hat
    const hatMap: Record<string, string> = {
      '.': p.transparent,
      's': '#e8c040',
      'd': p.dirtMid,
      'r': p.stainedGlassRed,
      'R': '#881018'
    };
    const hatMatrix = [
      "................",
      "................",
      "......ssss......",
      ".....ssssss.....",
      "....ssssssss....",
      "....rrrrrrrr....",
      "...RRRRRRRRRR...",
      "..ssssssssssss..",
      ".ssssssssssssss.",
      ".ssddddddddddss.",
      "..dddddddddddd..",
      "................",
      "................",
      "................",
      "................",
      "................"
    ];
    const cH = this.createCanvas(16, 16);
    this.drawMatrix(cH.ctx, hatMatrix, hatMap);
    this.sprites['item_hat'] = cH.canvas;

    // Ancient Sword in Stone Altar
    const swordShrine = [
      ".......w........",
      "......wmM.......",
      "......wmM.......",
      "......wmM.......",
      "......wmM.......",
      ".....ggGgg......",
      ".......G........",
      "......ssss......",
      "....ssssssss....",
      "...ssslssSsss...",
      "..ssssSSSSssss..",
      ".ssssSdSSdsssss.",
      ".ssssddddssssss.",
      "SddddddddddddddS",
      "dddddddddddddddd",
      "................"
    ];
    const swordMap: Record<string, string> = {
      '.': p.transparent,
      'w': p.white,
      'm': p.steelLight,
      'M': p.steelDark,
      'g': p.goldLight,
      'G': p.goldDark,
      's': p.gothicStoneLight,
      'S': p.gothicStoneMid,
      'd': p.gothicStoneDark,
      'l': p.grassLight
    };
    const cSw = this.createCanvas(16, 16);
    this.drawMatrix(cSw.ctx, swordShrine, swordMap);
    this.sprites['item_sword_shrine'] = cSw.canvas;

    // Normal Sword
    const swordAlone = [
      ".............w..",
      "............wmM.",
      "...........wmM..",
      "..........wmM...",
      ".........wmM....",
      "........wmM.....",
      ".......wmM......",
      "......wmM.......",
      ".....ggGgg......",
      "....ggGgg.......",
      "......G.........",
      ".....G..........",
      "....g...........",
      "................",
      "................",
      "................"
    ];
    const cSwA = this.createCanvas(16, 16);
    this.drawMatrix(cSwA.ctx, swordAlone, swordMap);
    this.sprites['item_sword'] = cSwA.canvas;

    // Honed Sword
    const honedMap: Record<string, string> = {
      '.': p.transparent,
      'w': p.white,
      'm': '#e0f4ff',
      'M': p.steelLight,
      'g': p.goldLight,
      'G': p.goldMid
    };
    const cHoned = this.createCanvas(16, 16);
    this.drawMatrix(cHoned.ctx, swordAlone, honedMap);
    this.sprites['item_sword_upgraded'] = cHoned.canvas;

    // Heater Shield
    const shieldMap: Record<string, string> = {
      '.': p.transparent,
      'g': p.shieldBorder,
      'G': p.goldDark,
      'B': p.shieldBlue,
      'b': '#0e2448',
      'e': p.white
    };
    const shieldItem = [
      "................",
      "...gggggggggg...",
      "..gBBBBBBBBBBg..",
      "..gBBBBBeBBBBg..",
      "..gBBBBeeeBBBg..",
      "..gBBBBeEeBBBg..",
      "..gBBBeeeBBBBg..",
      "..gBBBBBeBBBBg..",
      "..gBBBBBBBBBBg..",
      "...gBBBBBBBBg...",
      "....gBBBBBBg....",
      ".....gBBBBg.....",
      "......gBBg......",
      ".......gg.......",
      "................",
      "................"
    ];
    const cSh = this.createCanvas(16, 16);
    this.drawMatrix(cSh.ctx, shieldItem, shieldMap);
    this.sprites['item_shield'] = cSh.canvas;

    // Stolen Flour Sack (Aiguemorte Quest)
    const flourMap: Record<string, string> = {
      '.': p.transparent,
      'c': '#e6d8b8',
      'C': '#baa482',
      'r': '#8c4420',
      'w': '#ffffff'
    };
    const flourMatrix = [
      "................",
      ".......rr.......",
      "......rccr......",
      ".....rccccr.....",
      "....rccccccr....",
      "...rccccccccr...",
      "...rccwwccccr...",
      "...rcwwwwcccr...",
      "...rccwwccccr...",
      "...rCCCCCCCCr...",
      "...rCCCCCCCCr...",
      "....rCCCCCCr....",
      ".....rCCCCr.....",
      "................",
      "................",
      "................"
    ];
    const cFlour = this.createCanvas(16, 16);
    this.drawMatrix(cFlour.ctx, flourMatrix, flourMap);
    this.sprites['item_flour'] = cFlour.canvas;

    // Confiscated Wine Barrel (Vineyard Quest)
    const barrelMap: Record<string, string> = {
      '.': p.transparent,
      'b': p.barkLight,
      'B': p.barkMid,
      'd': p.barkDark,
      's': p.steelMid,
      'S': p.steelDark
    };
    const barrelMatrix = [
      "................",
      "....dddddddd....",
      "...dBBBBBBBBd...",
      "..dsSSSSSSSSsd..",
      "..dBBbBBbBBBd...",
      ".dBBbBBbBBBBBd..",
      ".dsSSSSSSSSSSd..",
      ".dBBbBBbBBBBBd..",
      ".dBBbBBbBBBBBd..",
      ".dsSSSSSSSSSSd..",
      "..dBBbBBbBBBd...",
      "..dsSSSSSSSSsd..",
      "...dBBBBBBBBd...",
      "....dddddddd....",
      "................",
      "................"
    ];
    const cBarrel = this.createCanvas(16, 16);
    this.drawMatrix(cBarrel.ctx, barrelMatrix, barrelMap);
    this.sprites['item_barrel'] = cBarrel.canvas;

    // Royal Decree Document (Proof of King's corruption)
    const docMap: Record<string, string> = {
      '.': p.transparent,
      'p': '#fff8e8',
      'P': '#d8c8a8',
      'i': '#202020',
      'r': p.kingMantle,
      'g': p.goldLight
    };
    const docMatrix = [
      "................",
      "...ppppppppp....",
      "...piiiiiiiPp...",
      "...piiiiiiiPp...",
      "...pPPPPPPPPP...",
      "...piiiiiiiPp...",
      "...piiiiiiiPp...",
      "...pPPPPPPPPP...",
      "...p...rr...p...",
      "...p..rgrr..p...",
      "...p...rr...p...",
      "...pPPPPPPPPP...",
      "...pppppppppp...",
      "................",
      "................",
      "................"
    ];
    const cDoc = this.createCanvas(16, 16);
    this.drawMatrix(cDoc.ctx, docMatrix, docMap);
    this.sprites['item_decree'] = cDoc.canvas;

    // Hearts HUD
    const heartMap: Record<string, string> = {
      '.': p.transparent,
      'r': p.stainedGlassRed,
      'd': '#881018',
      'h': '#f87888',
      'w': p.white
    };
    const heartFull = [
      ".rr.rr.",
      "rhhrhhr",
      "rrrrrrr",
      ".rrrrr.",
      "..rrr..",
      "...r..."
    ];
    const cHF = this.createCanvas(8, 8);
    this.drawMatrix(cHF.ctx, heartFull, heartMap, 0, 1);
    this.sprites['hud_heart_full'] = cHF.canvas;

    const heartEmptyMap: Record<string, string> = {
      '.': p.transparent,
      'd': p.gothicStoneDark,
      'g': p.gothicStoneMid
    };
    const heartEmpty = [
      ".dd.dd.",
      "dggdggd",
      "d.....d",
      ".d...d.",
      "..d.d..",
      "...d..."
    ];
    const cHE = this.createCanvas(8, 8);
    this.drawMatrix(cHE.ctx, heartEmpty, heartEmptyMap, 0, 1);
    this.sprites['hud_heart_empty'] = cHE.canvas;
  }

  // 9. VFX
  private generateVFXSprites() {
    const p = this.palette;

    const createArc = (startA: number, endA: number, ox: number, oy: number) => {
      const c = this.createCanvas(16, 16);
      const ctx = c.ctx;
      ctx.strokeStyle = p.white;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, 7, startA, endA);
      ctx.stroke();
      ctx.strokeStyle = p.steelLight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ox, oy, 6, startA, endA);
      ctx.stroke();
      return c.canvas;
    };

    this.sprites['slash_down'] = createArc(0.2 * Math.PI, 0.8 * Math.PI, 8, 2);
    this.sprites['slash_up'] = createArc(1.2 * Math.PI, 1.8 * Math.PI, 8, 14);
    this.sprites['slash_left'] = createArc(0.7 * Math.PI, 1.3 * Math.PI, 14, 8);
    this.sprites['slash_right'] = createArc(-0.3 * Math.PI, 0.3 * Math.PI, 2, 8);

    // Spark
    const cSpark = this.createCanvas(16, 16);
    const spctx = cSpark.ctx;
    spctx.fillStyle = p.goldLight;
    spctx.fillRect(7, 2, 2, 12);
    spctx.fillRect(2, 7, 12, 2);
    spctx.fillStyle = p.white;
    spctx.fillRect(6, 6, 4, 4);
    this.sprites['vfx_block_spark'] = cSpark.canvas;
  }

  public draw(ctx: CanvasRenderingContext2D, spriteName: string, x: number, y: number, scale = 1) {
    const s = this.sprites[spriteName];
    if (s) {
      ctx.drawImage(s, Math.floor(x), Math.floor(y), s.width * scale, s.height * scale);
    }
  }

  public drawNpc(ctx: CanvasRenderingContext2D, spriteName: string, x: number, y: number, facing: Direction) {
    const directionName = ['down', 'up', 'left', 'right'][facing];
    const directionalSprite = this.sprites[`${spriteName}_${directionName}`];
    if (directionalSprite) {
      this.draw(ctx, `${spriteName}_${directionName}`, x, y);
      return;
    }

    if (facing === DIR_LEFT) {
      ctx.save();
      ctx.translate(x + 24, y);
      ctx.scale(-1, 1);
      this.draw(ctx, spriteName, 0, 0);
      ctx.restore();
      ctx.fillStyle = this.palette.darkNavy;
      ctx.fillRect(x + 7, y + 7, 1, 1);
      return;
    }

    this.draw(ctx, spriteName, x, y);
    if (facing === DIR_RIGHT) {
      ctx.fillStyle = this.palette.darkNavy;
      ctx.fillRect(x + 16, y + 7, 1, 1);
      return;
    }
    if (facing !== DIR_UP) return;

    const backOfHeadColors: Record<string, string> = {
      npc_oldman: '#d8cbb5',
      npc_blacksmith: '#3c2415',
      npc_baker: '#888899',
      npc_vintner: '#c8a030',
      npc_guard: '#687384',
      npc_merchant: '#4e2f18'
    };
    ctx.fillStyle = backOfHeadColors[spriteName] || this.palette.darkNavy;
    ctx.fillRect(x + 7, y + 5, 10, 5);
  }
}

export const spriteManager = new SpriteManager();

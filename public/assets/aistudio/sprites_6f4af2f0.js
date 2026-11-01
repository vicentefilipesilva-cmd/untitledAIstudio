// sprites.js - High-Quality Pokémon GBC/GBA Style Pixel Art Generator
// Features 15th-Century French Medieval Architecture, Shaded Trees, Shield Poses & Boss

class SpriteManager {
  constructor() {
    this.sprites = {};
    this.initPalette();
    this.generateAllSprites();
  }

  initPalette() {
    // Rich 15th-Century French Medieval & Pokémon GBC/GBA inspired palette
    this.palette = {
      // Outlines & Neutrals
      black: '#080a10',
      darkNavy: '#141824',
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
      grassMid: '#448c14',
      grassDark: '#20580c',
      grassShade: '#123806',
      leafHighlight: '#9ce038',
      barkLight: '#8a5228',
      barkMid: '#5c3314',
      barkDark: '#361b07',
      dirtLight: '#d8a460',
      dirtMid: '#b07838',
      dirtDark: '#78481c',
      waterLight: '#68b4f8',
      waterMid: '#2c7cd8',
      waterDark: '#144c98',

      // Hero Colors
      skinLight: '#fcd0a4',
      skinMid: '#e4a06c',
      skinDark: '#b86c40',
      hairBlonde: '#d49428',
      hairDark: '#945c10',
      tunicBlue: '#2c6898',
      tunicDark: '#183c5e',
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

  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  drawMatrix(ctx, matrix, colorMap, ox = 0, oy = 0, scale = 1) {
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

  generateAllSprites() {
    try {
      this.generatePlayerSprites();
      this.generatePlayerShieldSprites();
      this.generateArchitectureTiles();
      this.generateForestAndNatureTiles();
      this.generateNPCSprites();
      this.generateEnemySprites();
      this.generateBossSprites();
      this.generateItemAndHUDSprites();
      this.generateVFXSprites();
      // #region agent log
      fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'A',location:'sprites.js:generateAllSprites',message:'sprites generated',data:{count:Object.keys(this.sprites).length,hasMerchant:!!this.sprites['npc_merchant'],merchantPalette:{skin:!!this.palette.skin,brownDark:!!this.palette.brownDark,red:!!this.palette.red}},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7648/ingest/5e94b2c4-6e39-485e-9a39-ae4d33b04b08',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f4c471'},body:JSON.stringify({sessionId:'f4c471',runId:'pre',hypothesisId:'A',location:'sprites.js:generateAllSprites',message:'sprite generation threw',data:{error:String(err&&err.message),stack:String(err&&err.stack).slice(0,400)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw err;
    }
  }

  /* -------------------------------------------------------------------------
     1. PLAYER SPRITES (Walking, Attacking, Shield-Guard in 4 Directions)
  ------------------------------------------------------------------------- */
  generatePlayerSprites() {
    const p = this.palette;
    const cmap = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': p.hairBlonde,
      'H': p.hairDark,
      't': p.tunicBlue,
      'T': p.tunicDark,
      'b': p.bootsBrown,
      'w': p.white,
      'm': p.steelLight,
      'M': p.steelDark,
      'g': p.goldMid
    };

    // --- DOWN IDLE & WALK ---
    const down_idle = [
      "....hhhhhh......",
      "...hhshhshh.....",
      "..hhdssddshh....",
      "..hssssssss.....",
      "..hssksdsdsh....",
      "...ssdssssd.....",
      "...ssdddsss.....",
      "....tttttt......",
      "...ttwttwtt.....",
      "..stttddttts....",
      "..stttddttts....",
      "..ddttttttdd....",
      "....bb..bb......",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];
    const down_walk1 = [
      "....hhhhhh......",
      "...hhshhshh.....",
      "..hhdssddshh....",
      "..hssssssss.....",
      "..hssksdsdsh....",
      "...ssdssssd.....",
      "...ssdddsss.....",
      "....tttttt......",
      "...ttwttwtt.....",
      "..stttddttts....",
      "..stttddtttd....",
      "...dtttttt......",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    const down_walk2 = [
      "....hhhhhh......",
      "...hhshhshh.....",
      "..hhdssddshh....",
      "..hssssssss.....",
      "..hssksdsdsh....",
      "...ssdssssd.....",
      "...ssdddsss.....",
      "....tttttt......",
      "...ttwttwtt.....",
      "..stttddttts....",
      "..dtttddttts....",
      "......ttttttd...",
      ".........bbbb...",
      "....bb...bbbb...",
      "....bb..........",
      "................"
    ];

    // --- UP IDLE & WALK ---
    const up_idle = [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "..hhhhhhhhhh....",
      "..hHhHHHHhHh....",
      "..hHHHHHHHHh....",
      "...hhhhhhhh.....",
      "....dssssd......",
      "....tttttt......",
      "...tttttttt.....",
      "..sttTTTTtts....",
      "..sttTTTTtts....",
      "..ddttttttdd....",
      "....bb..bb......",
      "....bb..bb......",
      "...bbb..bbb.....",
      "................"
    ];
    const up_walk1 = [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "..hhhhhhhhhh....",
      "..hHhHHHHhHh....",
      "..hHHHHHHHHh....",
      "...hhhhhhhh.....",
      "....dssssd......",
      "....tttttt......",
      "...tttttttt.....",
      "..sttTTTTtts....",
      "..sttTTTTttd....",
      "...dtttttt......",
      "...bbbb.........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    const up_walk2 = [
      "....hhhhhh......",
      "...hhhhhhhh.....",
      "..hhhhhhhhhh....",
      "..hHhHHHHhHh....",
      "..hHHHHHHHHh....",
      "...hhhhhhhh.....",
      "....dssssd......",
      "....tttttt......",
      "...tttttttt.....",
      "..sttTTTTtts....",
      "..dttTTTTtts....",
      "......ttttttd...",
      ".........bbbb...",
      "....bb...bbbb...",
      "....bb..........",
      "................"
    ];

    // --- LEFT IDLE & WALK ---
    const left_idle = [
      ".....hhhhh......",
      "....hhhhhhh.....",
      "...hhsssdhhh....",
      "...hsssssshh....",
      "...ssksdsssh....",
      "...ssssdssss....",
      "....ssdsss......",
      "....ttttt.......",
      "...sttwttt......",
      "...stttTtt......",
      "...dtttttt......",
      "....ttTTtt......",
      "....bb.bb.......",
      "....bb.bb.......",
      "...bbb.bbb......",
      "................"
    ];
    const left_walk1 = [
      ".....hhhhh......",
      "....hhhhhhh.....",
      "...hhsssdhhh....",
      "...hsssssshh....",
      "...ssksdsssh....",
      "...ssssdssss....",
      "....ssdsss......",
      "....ttttt.......",
      "...sttwttt......",
      "...stttTtt......",
      "...dtttttt......",
      "....ttTTtt......",
      "....bbbb........",
      "...bbbb..bb.....",
      ".........bb.....",
      "................"
    ];
    const left_walk2 = [
      ".....hhhhh......",
      "....hhhhhhh.....",
      "...hhsssdhhh....",
      "...hsssssshh....",
      "...ssksdsssh....",
      "...ssssdssss....",
      "....ssdsss......",
      "....ttttt.......",
      "...sttwttt......",
      "...stttTtt......",
      "...dtttttt......",
      "....ttTTtt......",
      ".........bbbb...",
      "....bb...bbbb...",
      "....bb..........",
      "................"
    ];

    const mirror = (m) => m.map(row => row.split('').reverse().join(''));

    const store = (name, matrix) => {
      const c = this.createCanvas(16, 16);
      this.drawMatrix(c.ctx, matrix, cmap);
      this.sprites[name] = c.canvas;
    };

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

    // Attack poses
    const down_attack = [
      "....hhhhhh......",
      "...hhshhshh.....",
      "..hssssssss.....",
      "..hssksdsdsh....",
      "...ssdddsss.....",
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
      ".....hhhhh......",
      "....hhhhhhh.....",
      "...hsssssshh....",
      "...ssksdsssh....",
      "...ssssdssss....",
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

  /* -------------------------------------------------------------------------
     2. SHIELD DEFENSE SPRITES (Hero in Blocking Stance with Heater Shield)
  ------------------------------------------------------------------------- */
  generatePlayerShieldSprites() {
    const p = this.palette;
    const cmap = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': p.hairBlonde,
      'H': p.hairDark,
      't': p.tunicBlue,
      'T': p.tunicDark,
      'b': p.bootsBrown,
      'w': p.white,
      'g': p.shieldBorder, // Gold/Brass rim
      'B': p.shieldBlue,   // French Azure Blue
      'e': p.shieldEmblem  // White fleur/cross
    };

    // Shield Down (facing front with shield raised defensively)
    const shield_down = [
      "....hhhhhh......",
      "...hhshhshh.....",
      "..hssssssss.....",
      "..hssksdsdsh....",
      "...ssdddsss.....",
      "....tttttt......",
      "..gggggggggg....",
      "..gBBBBBBBBg....",
      "..gBBBeBBBBg....",
      "..gBBeEeBBBg....",
      "..gBBBeBBBBg....",
      "...gBBBBBBg.....",
      "....gBBBBg......",
      ".....gBBg.......",
      "......gg........",
      "................"
    ];

    // Shield Up (facing away with shield on back/held high)
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

    // Shield Left (facing left holding heater shield forward)
    const shield_left = [
      ".....hhhhh......",
      "....hhhhhhh.....",
      "...hsssssshh....",
      "...ssksdsssh....",
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

    const mirror = (m) => m.map(row => row.split('').reverse().join(''));

    const store = (name, matrix) => {
      const c = this.createCanvas(16, 16);
      this.drawMatrix(c.ctx, matrix, cmap);
      this.sprites[name] = c.canvas;
    };

    store('player_shield_0', shield_down);
    store('player_shield_1', shield_up);
    store('player_shield_2', shield_left);
    store('player_shield_3', mirror(shield_left));
  }

  /* -------------------------------------------------------------------------
     3. 15th-CENTURY FRENCH MEDIEVAL ARCHITECTURE TILES (Slate, Timber, Stone)
  ------------------------------------------------------------------------- */
  generateArchitectureTiles() {
    const p = this.palette;

    // Slate Roof (Ardoise) - Steep angled 15th-century French shingles
    const cSlate = this.createCanvas(16, 16);
    const sctx = cSlate.ctx;
    sctx.fillStyle = p.slateRoofMid;
    sctx.fillRect(0, 0, 16, 16);
    // Overlapping slate tile pattern
    sctx.fillStyle = p.slateRoofLight;
    sctx.fillRect(0, 0, 16, 2);
    sctx.fillRect(0, 8, 16, 2);
    sctx.fillStyle = p.slateRoofDark;
    sctx.fillRect(0, 7, 16, 1);
    sctx.fillRect(0, 15, 16, 1);
    for (let c = 0; c < 16; c += 4) {
      sctx.fillRect(c, 0, 1, 8);
      sctx.fillRect(c + 2, 8, 1, 8);
    }
    this.sprites['tile_roof_slate'] = cSlate.canvas;

    // Half-Timbered Wall (Colombage) - Cream mortar with dark oak timber frame
    const cTimber = this.createCanvas(16, 16);
    const tctx = cTimber.ctx;
    tctx.fillStyle = p.mortarWall;
    tctx.fillRect(0, 0, 16, 16);
    // Subtle plaster texture
    tctx.fillStyle = p.mortarShadow;
    tctx.fillRect(3, 4, 2, 1);
    tctx.fillRect(10, 11, 2, 1);
    // Dark timber beams: side posts, top rail, diagonal brace
    tctx.fillStyle = p.timberBeam;
    tctx.fillRect(0, 0, 2, 16);
    tctx.fillRect(14, 0, 2, 16);
    tctx.fillRect(0, 0, 16, 2);
    tctx.fillRect(0, 14, 16, 2);
    // Diagonal brace
    for (let i = 2; i < 14; i++) {
      tctx.fillRect(i, i, 2, 1);
    }
    tctx.fillStyle = p.timberBeamDark;
    tctx.fillRect(0, 15, 16, 1);
    tctx.fillRect(15, 0, 1, 16);
    this.sprites['tile_wall_timber'] = cTimber.canvas;

    // Half-timbered Wall with Leaded Glass Window
    const cWin = this.createCanvas(16, 16);
    cWin.ctx.drawImage(cTimber.canvas, 0, 0);
    const wctx = cWin.ctx;
    wctx.fillStyle = p.timberBeamDark;
    wctx.fillRect(4, 4, 8, 8);
    wctx.fillStyle = p.waterLight;
    wctx.fillRect(5, 5, 6, 6);
    wctx.fillStyle = p.darkNavy;
    wctx.fillRect(7, 5, 1, 6);
    wctx.fillRect(5, 7, 6, 1);
    this.sprites['tile_wall_window'] = cWin.canvas;

    // French Gothic Arched Wooden Doorway
    const cDoor = this.createCanvas(16, 16);
    cDoor.ctx.drawImage(cTimber.canvas, 0, 0);
    const dctx = cDoor.ctx;
    dctx.fillStyle = p.gothicStoneDark;
    // Pointed Gothic arch outline
    dctx.beginPath();
    dctx.moveTo(3, 16);
    dctx.lineTo(3, 6);
    dctx.lineTo(8, 2);
    dctx.lineTo(13, 6);
    dctx.lineTo(13, 16);
    dctx.closePath();
    dctx.fill();
    // Heavy wooden door planks
    dctx.fillStyle = p.timberBeam;
    dctx.fillRect(4, 5, 8, 11);
    dctx.fillStyle = p.goldMid;
    dctx.fillRect(5, 10, 2, 2); // Brass ring handle
    this.sprites['tile_door_gothic'] = cDoor.canvas;

    // Gothic Stone Wall (Grand Citadel / Capital)
    const cStoneWall = this.createCanvas(16, 16);
    const swctx = cStoneWall.ctx;
    swctx.fillStyle = p.gothicStoneMid;
    swctx.fillRect(0, 0, 16, 16);
    // Fine ashlar stone blocks
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

    // Gothic Rose / Stained Glass Cathedral Window (Throne Room)
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

    // Royal Crimson Throne of King Raymond IV
    const cThrone = this.createCanvas(16, 16);
    const trctx = cThrone.ctx;
    trctx.fillStyle = p.gothicStoneMid;
    trctx.fillRect(0, 0, 16, 16); // Stone floor underneath
    // Gilded Gothic Throne Backrest
    trctx.fillStyle = p.goldMid;
    trctx.fillRect(2, 0, 12, 14);
    trctx.fillStyle = p.kingMantle;
    trctx.fillRect(4, 2, 8, 10);
    trctx.fillStyle = p.goldLight;
    trctx.fillRect(7, 0, 2, 3); // Gilded spire crest
    trctx.fillRect(3, 11, 10, 4);
    this.sprites['tile_royal_throne'] = cThrone.canvas;

    // French Fleur-de-lis Royal Citadel Banner
    const cBanner = this.createCanvas(16, 16);
    cBanner.ctx.drawImage(cStoneWall.canvas, 0, 0);
    const bnctx = cBanner.ctx;
    bnctx.fillStyle = p.shieldBlue;
    bnctx.fillRect(3, 1, 10, 13);
    bnctx.fillStyle = p.goldLight;
    // Stylized Fleur-de-lis
    bnctx.fillRect(7, 3, 2, 6);
    bnctx.fillRect(5, 5, 6, 2);
    bnctx.fillRect(4, 6, 2, 2);
    bnctx.fillRect(10, 6, 2, 2);
    bnctx.fillStyle = p.goldDark;
    bnctx.fillRect(6, 9, 4, 2);
    this.sprites['tile_banner'] = cBanner.canvas;

    // Throne Room Red Carpet (Tapis Royal)
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
  }

  /* -------------------------------------------------------------------------
     4. FOREST & NATURE TILES (Shaded Pokémon Style Trees with Solid Collision)
  ------------------------------------------------------------------------- */
  generateForestAndNatureTiles() {
    const p = this.palette;

    // Vibrant Grass (Pokémon GBC style)
    const cGrass = this.createCanvas(16, 16);
    const gctx = cGrass.ctx;
    gctx.fillStyle = p.grassMid;
    gctx.fillRect(0, 0, 16, 16);
    gctx.fillStyle = p.grassLight;
    gctx.fillRect(3, 3, 1, 2);
    gctx.fillRect(11, 7, 1, 2);
    gctx.fillRect(6, 12, 1, 2);
    gctx.fillStyle = p.grassDark;
    gctx.fillRect(4, 4, 1, 1);
    gctx.fillRect(12, 8, 1, 1);
    this.sprites['tile_grass'] = cGrass.canvas;

    // Grass with wildflowers
    const cFlowers = this.createCanvas(16, 16);
    cFlowers.ctx.drawImage(cGrass.canvas, 0, 0);
    cFlowers.ctx.fillStyle = p.stainedGlassRed;
    cFlowers.ctx.fillRect(5, 5, 2, 2);
    cFlowers.ctx.fillStyle = p.goldLight;
    cFlowers.ctx.fillRect(6, 6, 1, 1);
    cFlowers.ctx.fillStyle = p.white;
    cFlowers.ctx.fillRect(11, 10, 2, 2);
    this.sprites['tile_grass_flowers'] = cFlowers.canvas;

    // Worn Dirt Path
    const cDirt = this.createCanvas(16, 16);
    const dctx = cDirt.ctx;
    dctx.fillStyle = p.dirtLight;
    dctx.fillRect(0, 0, 16, 16);
    dctx.fillStyle = p.dirtMid;
    dctx.fillRect(2, 4, 4, 2);
    dctx.fillRect(9, 10, 5, 2);
    dctx.fillStyle = p.dirtDark;
    dctx.fillRect(6, 5, 1, 1);
    dctx.fillRect(11, 11, 1, 1);
    this.sprites['tile_dirt'] = cDirt.canvas;

    // Cobblestone Paving (French medieval road & village square)
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

    // Water with animated ripple shading
    const cWater = this.createCanvas(16, 16);
    const wctx = cWater.ctx;
    wctx.fillStyle = p.waterMid;
    wctx.fillRect(0, 0, 16, 16);
    wctx.fillStyle = p.waterLight;
    wctx.fillRect(2, 4, 4, 1);
    wctx.fillRect(10, 8, 4, 1);
    wctx.fillStyle = p.waterDark;
    wctx.fillRect(2, 5, 4, 1);
    wctx.fillRect(10, 9, 4, 1);
    this.sprites['tile_water'] = cWater.canvas;

    // Single Tile Tree Trunk (16x16) - Sturdy oak with solid collision
    const cTrunk = this.createCanvas(16, 16);
    const trkctx = cTrunk.ctx;
    trkctx.fillStyle = p.grassMid;
    trkctx.fillRect(0, 0, 16, 16);
    trkctx.fillStyle = p.barkMid;
    trkctx.fillRect(4, 0, 8, 13);
    trkctx.fillStyle = p.barkDark;
    trkctx.fillRect(4, 0, 3, 13);
    trkctx.fillRect(3, 11, 10, 3); // Roots
    trkctx.fillStyle = p.barkLight;
    trkctx.fillRect(9, 2, 2, 8);
    this.sprites['tile_tree_trunk'] = cTrunk.canvas;

    // Single Tile Tree Top (16x16)
    const cTreeTop = this.createCanvas(16, 16);
    const ttctx = cTreeTop.ctx;
    ttctx.fillStyle = p.grassDark;
    ttctx.beginPath();
    ttctx.arc(8, 9, 7, 0, Math.PI * 2);
    ttctx.fill();
    ttctx.fillStyle = p.grassMid;
    ttctx.beginPath();
    ttctx.arc(8, 8, 6, 0, Math.PI * 2);
    ttctx.fill();
    ttctx.fillStyle = p.leafHighlight;
    ttctx.beginPath();
    ttctx.arc(6, 5, 3, 0, Math.PI * 2);
    ttctx.fill();
    this.sprites['tile_tree_top'] = cTreeTop.canvas;

    // Large Pokémon GBC/GBA Shaded Forest Tree (32x32 Composite)
    const cBigTree = this.createCanvas(32, 32);
    const btctx = cBigTree.ctx;
    // Foliage background & shadow
    btctx.fillStyle = p.grassShade;
    btctx.beginPath();
    btctx.arc(16, 13, 14, 0, Math.PI * 2);
    btctx.fill();
    // Foliage midtone
    btctx.fillStyle = p.grassMid;
    btctx.beginPath();
    btctx.arc(15, 12, 13, 0, Math.PI * 2);
    btctx.fill();
    // Foliage highlights (Puffy Pokémon canopy clouds)
    btctx.fillStyle = p.leafHighlight;
    btctx.beginPath();
    btctx.arc(11, 9, 6, 0, Math.PI * 2);
    btctx.fill();
    btctx.beginPath();
    btctx.arc(19, 10, 5, 0, Math.PI * 2);
    btctx.fill();
    // Heavy Trunk with Roots
    btctx.fillStyle = p.barkMid;
    btctx.fillRect(11, 18, 10, 13);
    btctx.fillStyle = p.barkDark;
    btctx.fillRect(11, 18, 4, 13);
    btctx.fillRect(9, 27, 14, 4); // Root base flare
    btctx.fillStyle = p.barkLight;
    btctx.fillRect(17, 20, 2, 8);
    this.sprites['tree_big'] = cBigTree.canvas;

    // Wooden Fence
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

  /* -------------------------------------------------------------------------
     5. NPC SPRITES (Elder Tobias, Blacksmith Pierre, Corrupt Knights)
  ------------------------------------------------------------------------- */
  generateNPCSprites() {
    const p = this.palette;

    // --- ELDER TOBIAS (Oakhaven Village) ---
    const elderMap = {
      '.': p.transparent,
      'w': p.white,
      'b': p.cream,
      's': p.skinLight,
      'd': p.skinMid,
      'r': '#4a3d68', // French rustic purple robe
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
    this.sprites['npc_oldman'] = cElder.canvas;

    // --- BLACKSMITH PIERRE (Val-de-Loire Town) ---
    const smithMap = {
      '.': p.transparent,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'h': '#3c2415', // Dark brown beard & hair
      'a': p.banditLeather, // Leather apron
      't': p.cream, // Cloth shirt
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
    this.sprites['npc_blacksmith'] = cSmith.canvas;

    // --- CORRUPT ROYAL KNIGHT (Oppressive Citadel Guards) ---
    const knightMap = {
      '.': p.transparent,
      'P': p.knightPlume, // Tyrannical crimson plume
      'g': p.knightSteel, // Dark gothic steel
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
    this.sprites['npc_guard'] = cKnight.canvas;

    // --- MERCHANT ALDRIC (Travelling Coin Trader with Satchel) ---
    const merchantMap = {
      '.': p.transparent,
      'S': p.skin,       // Skin
      'h': p.brownDark,  // Brown leather hood
      'H': p.brownMid,
      'r': p.red,        // Red cloak / merchant tunic
      'R': p.redDark,
      'g': p.goldMid,    // Gold coins / trim
      'G': p.goldDark,
      'b': p.brownMid,   // Leather satchel
      'B': p.brownDark,
      'k': p.black,
      'e': p.skinDark    // Eye / shadow
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
    this.sprites['npc_merchant'] = cMerchant.canvas;
  }

  /* -------------------------------------------------------------------------
     6. ENEMY SPRITES (Scaled Physical Beasts & Rogues)
  ------------------------------------------------------------------------- */
  generateEnemySprites() {
    const p = this.palette;

    // --- WILD BOAR ---
    const boarMap = {
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
    const store = (name, m, cmap) => {
      const c = this.createCanvas(16, 16);
      this.drawMatrix(c.ctx, m, cmap);
      this.sprites[name] = c.canvas;
    };
    store('enemy_boar_0', boar1, boarMap);
    store('enemy_boar_1', boar2, boarMap);

    // --- CORRUPT HIGHROAD WOLF ---
    const wolfMap = {
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

    // --- CORRUPT ROGUE / BANDIT ---
    const banditMap = {
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

    // --- CORRUPT ROYAL KNIGHT ENEMY (Elite Oppressors on Highroad) ---
    this.sprites['enemy_corrupt_knight_0'] = this.sprites['npc_guard'];
    this.sprites['enemy_corrupt_knight_1'] = this.sprites['npc_guard'];
  }

  /* -------------------------------------------------------------------------
     7. FINAL BOSS: THE TYRANT KING (King Raymond IV)
  ------------------------------------------------------------------------- */
  generateBossSprites() {
    const p = this.palette;
    const kingMap = {
      '.': p.transparent,
      'c': p.kingGold,          // Ornate Royal Crown
      'g': p.goldLight,
      'k': p.black,
      's': p.skinLight,
      'd': p.skinMid,
      'a': p.kingArmor,         // Dark Royal Gothic Plate Armor
      'A': '#201830',
      'm': p.kingMantle,        // Crimson Ermine Velvet Cape
      'w': p.kingMantleErmine,  // White ermine fur trim
      'S': p.steelLight,        // Royal Greatsword
      'D': p.steelDark,
      'b': p.bootsBrown
    };

    // King Idle Frame (16x16)
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

    // King Attack / Cleave Frame
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
    this.sprites['boss_king_0'] = c1.canvas;

    const c2 = this.createCanvas(16, 16);
    this.drawMatrix(c2.ctx, king_attack, kingMap);
    this.sprites['boss_king_1'] = c2.canvas;

    // Boss Royal Shockwave Projectile (Wave of tyrannical force)
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

  /* -------------------------------------------------------------------------
     8. ITEMS & HUD SPRITES (Sword, Honed Sword, Heater Shield, Hat)
  ------------------------------------------------------------------------- */
  generateItemAndHUDSprites() {
    const p = this.palette;

    // Straw Hat
    const hatMap = {
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
    const swordMap = {
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

    // Honed Legendary Sword (Upgraded Blade with Radiant Glow)
    const honedMap = {
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

    // Knight's Heater Shield Item
    const shieldMap = {
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

    // Whetstone (Sword Upgrade Material)
    const stoneMap = {
      '.': p.transparent,
      's': p.gothicStoneLight,
      'm': p.gothicStoneMid,
      'd': p.gothicStoneDark,
      'g': p.goldLight
    };
    const whetstone = [
      "................",
      "................",
      "......sssss.....",
      ".....smmmmmd....",
      "....smmmmmmmd...",
      "...smmmmmmmmm...",
      "...smmmmmmmmm...",
      "....dmmmmmmmd...",
      ".....dmmmmmd....",
      "......ddddd.....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ];
    const cWht = this.createCanvas(16, 16);
    this.drawMatrix(cWht.ctx, whetstone, stoneMap);
    this.sprites['item_whetstone'] = cWht.canvas;

    // Heart Icon & HUD
    const heartMap = {
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

    const heartEmptyMap = {
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

    // Heart Drop Pickup (16x16)
    const heartMatrix = [
      "................",
      "...rrr...rrr....",
      "..rhhhr.rhhhr...",
      ".rhwwwhrrhwwr...",
      ".rhwhhrrhwhhr...",
      ".rrrrrrrrrrrrr..",
      "..rrrrrrrrrrr...",
      "..drrrrrrrrrdd..",
      "...rrrrrrrrr....",
      "....rrrrrrr.....",
      ".....drrrd......",
      "......rrr.......",
      ".......r........",
      "................",
      "................",
      "................"
    ];
    const cHt = this.createCanvas(16, 16);
    this.drawMatrix(cHt.ctx, heartMatrix, heartMap);
    this.sprites['item_heart'] = cHt.canvas;
  }

  /* -------------------------------------------------------------------------
     9. VFX (Sword Slash Arcs & Block Spark)
  ------------------------------------------------------------------------- */
  generateVFXSprites() {
    const p = this.palette;

    // Slash Arcs
    const createArc = (startA, endA, ox, oy) => {
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

    // Shield Clang Spark Particle
    const cSpark = this.createCanvas(16, 16);
    const spctx = cSpark.ctx;
    spctx.fillStyle = p.goldLight;
    spctx.fillRect(7, 2, 2, 12);
    spctx.fillRect(2, 7, 12, 2);
    spctx.fillStyle = p.white;
    spctx.fillRect(6, 6, 4, 4);
    this.sprites['vfx_block_spark'] = cSpark.canvas;
  }

  draw(ctx, spriteName, x, y, scale = 1) {
    const s = this.sprites[spriteName];
    if (s) {
      ctx.drawImage(s, Math.floor(x), Math.floor(y), s.width * scale, s.height * scale);
    }
  }
}

// Global sprite singleton
const spriteManager = new SpriteManager();

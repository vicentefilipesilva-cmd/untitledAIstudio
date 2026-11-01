# Legend of the Chivalric Fall: The Kingdom of Aethelgard (GBC Adventure)

A 15th-Century French Medieval Game Boy Color top-down action-adventure RPG inspired by classic *Pokémon GBC/GBA* and *The Legend of Zelda: Oracle of Seasons/Ages*. Players experience a 3-act journey as a humble peasant from Oakhaven Village who finds a legendary sword, discovers kingdom-wide oppression, and rises to overthrow tyrant King Raymond IV.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This plan incorporates the full storyline provided for Acts I, II, and III, the specific side quests (A Farinha dos Órfãos, A Forja Silenciada e o Escudo, O Segredo dos Barris Confiscados), and the vertical multi-tier overworld map layout from the attached blueprint.

- **Art & Engine Style**: Authentic 160×144 GBC pixel resolution rendered on HTML5 Canvas with nearest-neighbor integer scaling, optional LCD scanlines filter, and an authentic Game Boy Color handheld chassis with virtual D-Pad and action buttons.
- **Combat Mechanics**: Real-time 8-way directional movement, sword slash attacks (A / Space / Z), and directional Shield Guard (X / Shift) to deflect physical projectiles and enemy strikes.
- **Narrative Progression**: 3 full story acts translated into interactive quest states with typewriter dialogue boxes, NPC interactions, and narrative plot reveals.
- **Audio Architecture**: Procedural 8-bit Web Audio API chiptune synthesizer (pulse wave channels, triangle bass, noise channel for sfx) with zero external audio assets required.
- **State Persistence**: Automatic `localStorage` game saving across transitions, preserving checkpoints, inventory, coins, sword upgrades, and quest flags.

---

## 1. Overview & Core Concept

- **Protagonist**: A humble peasant youth in Oakhaven Village who dreams of becoming a royal knight, only to discover the noble crown is corrupt to its core.
- **Visual Presentation**: Vibrant 15th-century French medieval aesthetic (timbered walls, slate shingles, gothic arches, stained glass, vineyards, and lush oak forests) styled in the classic palette of late-era Game Boy Color and early Game Boy Advance titles.
- **Core Loop**: Explore interconnected maps $\rightarrow$ talk with villagers and accept side quests $\rightarrow$ defeat wild beasts, bandits, and corrupt knights $\rightarrow$ solve environmental roadblocks with quest items $\rightarrow$ confront King Raymond IV in Château Noir.

---

## 2. Overworld & Map Blueprint Architecture

Based on the blueprint diagram, the Kingdom of Aethelgard is structured as a vertical progression of 13 interconnected zones:

```
┌────────────────────────────────────────────────────────────────────────┐
│  TIER 7: Château Noir Castle (Capital & Throne Room - Boss Battle)     │
│  [M] Gothic Walls · [P] Stained Glass · [K] Royal Throne · [V] Carpet  │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│  TIER 6: Caminho Real (Royal Road)                                     │
│  [N] Royal Banners · [M] Stone Battlements · Corrupt Royal Knights     │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│  TIER 5: Dijon City / Château-Neuf & Trilha do Vinho (Bosque Sombrio)  │
│  Vineyards · Wine Cellars · Side Quest: O Segredo dos Barris           │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│  TIER 4: Orléans & Tours Cities (Route 2 & Route 4)                    │
│  Gothic Canals · Bridges · Cathedrals · River Crossings                │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│  TIER 3: Val-de-Loire City & Route 1                                   │
│  [Y] Master Pierre's Forge · Aldric the Merchant · Stolen Ledger Quest │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│  TIER 2: Aiguemorte City (1ª Cidade)                                   │
│  Walled Fortress · Padeira Idosa · Side Quest: A Farinha dos Órfãos    │
└──────────────────────────────────▲─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│  TIER 1: Whispering Weald (Floresta) & Oakhaven Village                │
│  [A] Ancient Sword Altar · Tobias's Lost Straw Hat · Boars & Wolves    │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Zone Specifications

1. **Oakhaven Village (Aldeia Inicial)**:
   - *Atmosphere*: Peaceful French agricultural village with thatched roofs and fences.
   - *Key Entities*: Elder Tobias outside his cottage; village notice sign.
   - *Goal*: Accept Tobias's favor to fetch his straw hat from the northern woods.
2. **Whispering Weald (Floresta)**:
   - *Atmosphere*: Dense forest canopy with winding dirt trail and wild boars.
   - *Key Entities*: Ancient Stone Altar with the embedded legendary sword ("Wind-Cleaver").
   - *Goal*: Defeat boars, recover Tobias's hat, draw the sword from stone, and return to Tobias.
3. **Aiguemorte City (1ª Cidade)**:
   - *Atmosphere*: High fortified stone walls, timbered houses, and heavy oppression.
   - *Key Quest*: **A Farinha dos Órfãos** — Talk to the elder baker woman near the ramparts; recover the confiscated bags of flour from corrupt garrison guards.
4. **Route 1**:
   - *Atmosphere*: River road lined with willows and bandit hideouts.
   - *Enemies*: Rogues and forest wolves.
5. **Val-de-Loire City (2ª Cidade)**:
   - *Atmosphere*: Bustling river market town, anvil, and watermill.
   - *Key Quest*: **A Forja Silenciada e o Escudo** — Help blacksmith Master Pierre recover his stolen high-grade iron ore from a bandit camp; receive the Knight's Heater Shield (Guard [X]) and blade hone upgrade (sword damage $1 \rightarrow 2$).
   - *NPC*: Aldric the Merchant offering health restores and tips.
6. **Orléans & Tours (Cidades 3 e 4)**:
   - *Atmosphere*: Gothic cathedrals, stained glass reflections in canal waters, training duelists.
   - *Gameplay*: Highroad checkpoints testing combat readiness and shield deflection timing.
7. **Trilha do Vinho, Bosque Sombrio & Château-Neuf (Cidade 5/6)**:
   - *Atmosphere*: Sunlit vineyard hills juxtaposed with dark treacherous woods.
   - *Key Quest*: **O Segredo dos Barris Confiscados** — Rescue captive vintners, intercept the noble lord's carriage, and discover official royal decrees with King Raymond IV's seal ordering the extortion of the people.
8. **Caminho Real (Royal Road)**:
   - *Atmosphere*: Grand paved boulevard lined with crimson royal banners and elite knights.
   - *Challenge*: Defeat the King's guard captains in duel combat.
9. **Château Noir Castle (Capital & Throne Room)**:
   - *Atmosphere*: Dark gothic stone citadel, towering arched windows, crimson royal carpet.
   - *Climax Battle*: Multi-phase boss encounter with King Raymond IV (greatsword cleaves, golden shockwaves, speed enrage).

---

## 3. Core Mechanics & Controls

### Character & Combat (Pokémon / Zelda GBC Style)
- **Sprite Dimensions**: 16×16 pixel grid for characters and tiles.
- **Directional Animations**: 4 cardinal facing directions (Down, Up, Left, Right) with walking frames and 8-way movement vector normalization.
- **Sword Strike (Button A / Space / Z)**: Immediate 16px directional arc hitbox with knockback and hit flash on enemies.
- **Heater Shield Guard (Button X / Shift)**: Raises the blue-and-gold fleur shield, halves movement speed, and completely negates oncoming physical strikes and projectiles with a metallic clang!
- **Health System**: Heart container HUD (starting at 4 hearts, 1/2 heart damage ticks).
- **Inventory Bar**: Visual HUD displaying Straw Hat, Wind-Cleaver Sword (normal or honed glow), Knight's Shield, and Coin purse.

### Game Controls Layout

| Action | Keyboard | Handheld Virtual Pad |
| :--- | :--- | :--- |
| **Move** (8-way) | `W` `A` `S` `D` / Arrow Keys | Virtual D-Pad (Up, Down, Left, Right) |
| **Attack** | `SPACE` / `Z` | Button `A` |
| **Interact / Advance** | `E` / `ENTER` | Button `B` |
| **Shield Guard** | `X` / `SHIFT` | Button `X` (Shield) |
| **Select / Menu** | `TAB` / `C` | Button `SELECT` |
| **Start / Pause** | `ESC` / `P` | Button `START` |

---

## 4. Technical Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Container                                │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   GameBoy Shell / Retro Bezel (D-Pad, A/B/X Buttons, Audio)    │   │
│   │                                                                │   │
│   │   ┌────────────────────────────────────────────────────────┐   │   │
│   │   │           HTML5 Canvas (160 x 144 Native Scaled)       │   │   │
│   │   │                                                        │   │   │
│   │   │  [GameEngine] ───────────► [WorldMap System]           │   │   │
│   │   │        │                         │                     │   │   │
│   │   │        ▼                         ▼                     │   │   │
│   │   │  [EntityManager]           [SpriteManager]             │   │   │
│   │   │   (Player, NPC, Enemies)   (15th c. Tiles & Sprites)   │   │   │
│   │   │        │                         │                     │   │   │
│   │   │        ▼                         ▼                     │   │   │
│   │   │  [DialogueSystem]          [RetroAudio Synthesizer]    │   │   │
│   │   │   (Quests, Typewriter)     (8-bit Chiptune Loops)      │   │   │
│   │   │        │                                               │   │   │
│   │   │        ▼                                               │   │   │
│   │   │  [SaveState / LocalStorage]                            │   │   │
│   │   └────────────────────────────────────────────────────────┘   │   │
│   └────────────────────────────────────────────────────────────────┘   │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Companion Journal & Quest Tracker (Sidebar / Modal View)     │   │
│   │   - Active Quests & Clues · Inventory Details · Map Location   │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

1. **`sprites.ts` / `SpriteManager`**:
   - Generates procedural GBC color palettes and sprite bitmaps for player, NPCs (Elder Tobias, Pierre, Baker woman, Vintner, King), enemies (boars, wolves, bandits, corrupt knights), and full 15th-century French architectural tilesets.
2. **`maps.ts` / `WORLD_MAPS`**:
   - Tile layouts, collision arrays, warps, exit triggers, enemy spawns, and NPC anchor positions for all 13 world tiers.
3. **`dialogue.ts` / `DialogueSystem`**:
   - Typewriter text box with speaker badges, Portuguese & English narrative scripts, quest state machine transitions, and interactive choices.
4. **`audio.ts` / `RetroAudio`**:
   - Web Audio API synthesizer generating chiptune pulse waveforms, metallic shield block ping, sword slashes, item fanfares, and 5 zone music tracks (Village, Forest, Town, Road, Boss).
5. **`entities.ts`**:
   - Physics, 8-way movement, hitbox collision resolution, patrol AI, knockback, and Boss King behavior state machine.
6. **`game.ts` / `GameEngine`**:
   - 60fps fixed-step game loop, smooth scrolling camera centering on player, transition fades, HUD rendering, and game-over/checkpoint respawn loop.

---

## 5. Execution Steps

1. **Step 1: Core Engine & Handheld Integration**:
   - Package all game modules into a clean TypeScript React application with Vite.
   - Configure the Game Boy Color physical console shell with responsive touch controls, scanline toggle, and audio switch.
2. **Step 2: World Map Expansion**:
   - Implement the complete vertical map progression matching the blueprint (Oakhaven $\rightarrow$ Forest $\rightarrow$ Aiguemorte $\rightarrow$ Route 1 $\rightarrow$ Val-de-Loire $\rightarrow$ Orléans/Tours $\rightarrow$ Vineyards/Dark Woods $\rightarrow$ Royal Road $\rightarrow$ Château Noir).
3. **Step 3: Side Quests & Narrative Logic**:
   - Implement the 3 primary side quests with dialogues, trigger zones, inventory flags, and rewards:
     - *A Farinha dos Órfãos* (Aiguemorte)
     - *A Forja Silenciada e o Escudo* (Val-de-Loire)
     - *O Segredo dos Barris Confiscados* (Trilha do Vinho)
4. **Step 4: Boss Climax & Polish**:
   - Polish King Raymond IV's boss encounter with shockwaves, enraged charge phase, and triumphant epilogue sequence.
   - Add auto-save to `localStorage` and a clean in-game Quest Log / Journal viewer.

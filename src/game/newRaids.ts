import { buildEnemies, EnemySpawn, withUndergroundPassage } from './level';
import { Platform, StageDef } from './types';

const FLOOR = 860;
const HEIGHT = 1080;

// ============================================================================
// RAID 5: THE MUSHROOM KINGDOM (4 Fungal Realms + Mycelium Sovereign!)
// Signature Gimmick: Bouncy Toadstool Spring-Caps ('bounce_cap') + Towering
// Vertical Canopy Climbs + 100% Bespoke Fungal Enemies (Spore Hopper,
// Mycelium Spitter, Toadstool Roller)!
// ============================================================================
const M1_W = 4160;
const M1_STAGE: StageDef = withUndergroundPassage(
  {
    index: 0,
    roomNumber: 1,
    raidId: 'mushroom_kingdom',
    environment: 'mushroom',
    name: 'Room 1/4 · Bioluminescent Sporewood',
    bossName: 'Mycelial Hulk',
    worldWidth: M1_W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3180,
    exitDoorX: 4060,
    theme: {
      skyTop: '#061a1b',
      skyBottom: '#133d3a',
      moonColor: '#a7f3d0',
      parallaxColor: '#0c2b29',
      archColor: 'rgba(16, 82, 71, 0.56)',
      windowColor: 'rgba(52, 211, 153, 0.3)',
      stoneFill: '#1c2d2a',
      stoneTop: '#34d399',
      bossFloorTop: '#10b981',
    },
    platforms: [
      { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'wall-right', x: M1_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'm1-g1', x: 0, y: FLOOR, w: 1280, h: 220, style: 'stone' },
      // Bouncy Toadstool launch pads into high canopy rafters!
      { id: 'm1-bounce1', x: 290, y: 836, w: 110, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm1-cap2', x: 470, y: 625, w: 205, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm1-bounce2', x: 730, y: 605, w: 105, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm1-cap4', x: 960, y: 415, w: 260, h: 22, oneWay: true, style: 'rafter' },
      // Split chasm with bouncy mushroom stepping pads!
      { id: 'm1-g2', x: 1410, y: 805, w: 740, h: 275, style: 'stone' },
      { id: 'm1-bounce3', x: 1320, y: 740, w: 105, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm1-cap5', x: 1460, y: 530, w: 220, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm1-cap6', x: 1760, y: 665, w: 190, h: 20, oneWay: true, style: 'bridge' },
      { id: 'm1-cap7', x: 1960, y: 495, w: 230, h: 22, oneWay: true, style: 'rafter' },
      // Sunken glade before boss
      { id: 'm1-g3', x: 2280, y: FLOOR, w: 780, h: 220, style: 'stone' },
      { id: 'm1-bounce4', x: 2370, y: 836, w: 110, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm1-cap9', x: 2560, y: 590, w: 240, h: 20, oneWay: true, style: 'rafter' },
      // Mini-boss arena with side bounce caps!
      { id: 'm1-boss', x: 3200, y: FLOOR, w: 960, h: 220, style: 'boss_floor' },
      { id: 'm1-bp1', x: 3320, y: 836, w: 100, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm1-bp2', x: 3860, y: 836, w: 100, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm1-br', x: 3500, y: 585, w: 290, h: 20, oneWay: true, style: 'rafter' },
    ],
    torches: [
      { x: 170, y: 755, phase: 0.4 },
      { x: 650, y: 755, phase: 1.8 },
      { x: 1120, y: 755, phase: 3.1 },
      { x: 1620, y: 695, phase: 1.2 },
      { x: 2480, y: 755, phase: 2.6 },
      { x: 3420, y: 735, phase: 0.9 },
      { x: 3860, y: 735, phase: 2.5 },
    ],
    interactables: [
      { id: 'm1-brazier', kind: 'brazier', x: 200, y: FLOOR, label: 'Spore Lantern (+2 MP)', used: false },
      { id: 'm1-chest1', kind: 'chest', x: 1090, y: 415, label: 'Canopy Cap Cache (+Potion & Shards)', used: false },
      { id: 'm1-altar', kind: 'upgrade_altar', x: 1760, y: 805, label: 'Mycelium Shrine (Choose 1 of 3)', used: false },
      { id: 'm1-font', kind: 'fountain', x: 3240, y: FLOOR, label: 'Dewdrop Pool (+2 HP / +2 MP)', used: false },
      { id: 'm1-door', kind: 'exit_door', x: 4060, y: FLOOR, label: 'Enter Room 2 · Bouncing Cap Spire', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'm1-h1', x: 410, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: 'm1-h2', x: 1520, y: 805, w: 66, h: 96, kind: 'curtain' },
      { id: 'm1-h3', x: 2560, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
    ],
    createEnemies: (m = 1, f = 0) =>
      buildEnemies(
        [
          { type: 'spore_hopper', x: 560, y: FLOOR, facing: -1, patrolRadius: 120 },
          { type: 'mycelium_spitter', x: 580, y: 625, facing: -1, patrolRadius: 50 },
          { type: 'spore_hopper', x: 1060, y: 415, facing: -1, patrolRadius: 85 },
          { type: 'cap_brute', x: 1680, y: 805, facing: -1, patrolRadius: 140 },
          { type: 'mycelium_spitter', x: 2060, y: 495, facing: -1, patrolRadius: 65 },
          { type: 'cap_brute', x: 2740, y: FLOOR, facing: -1, patrolRadius: 140 },
          { type: 'boss_goblin_behemoth', x: 3820, y: FLOOR, facing: -1, patrolRadius: 230, customName: 'Mycelial Hulk', customHp: 19 },
        ],
        0,
        m,
        f
      ),
  },
  {
    idPrefix: 'm1',
    startX: 460,
    endX: 1180,
    grateInX: 505,
    grateOutX: 1030,
    chestLabel: 'Root-Tunnel Spore Vault (+Potion & Shards)',
  }
);

const M2_W = 4240;
const M2_STAGE: StageDef = withUndergroundPassage(
  {
    index: 1,
    roomNumber: 2,
    raidId: 'mushroom_kingdom',
    environment: 'mushroom',
    name: 'Room 2/4 · Bouncing Cap Spire',
    bossName: 'Spore Matriarch',
    worldWidth: M2_W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3260,
    exitDoorX: 4140,
    theme: {
      skyTop: '#0d0c24',
      skyBottom: '#1f2b52',
      moonColor: '#c4b5fd',
      parallaxColor: '#151a38',
      archColor: 'rgba(88, 28, 135, 0.45)',
      windowColor: 'rgba(56, 189, 248, 0.34)',
      stoneFill: '#1f233d',
      stoneTop: '#38bdf8',
      bossFloorTop: '#a855f7',
    },
    platforms: [
      { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'wall-right', x: M2_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'm2-g1', x: 0, y: FLOOR, w: 720, h: 220, style: 'stone' },
      // Vertical Spring-Toadstool Spire!
      { id: 'm2-b0', x: 250, y: 836, w: 115, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-t2', x: 430, y: 630, w: 220, h: 18, oneWay: true, style: 'bridge' },
      { id: 'm2-b1', x: 470, y: 606, w: 105, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-t4', x: 540, y: 390, w: 260, h: 20, oneWay: true, style: 'rafter' },
      // Mid chasm pillars + bouncy trampoline chain!
      { id: 'm2-pil1', x: 860, y: 740, w: 130, h: 340, style: 'pillar' },
      { id: 'm2-b2', x: 872, y: 716, w: 106, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-sky1', x: 1020, y: 455, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm2-pil2', x: 1180, y: 675, w: 130, h: 405, style: 'pillar' },
      { id: 'm2-sky2', x: 1350, y: 465, w: 220, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      // Wide lower meadow with hidden under-tunnel
      { id: 'm2-g2', x: 1460, y: FLOOR, w: 1580, h: 220, style: 'stone' },
      { id: 'm2-b3', x: 1640, y: 836, w: 110, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-mid2', x: 1960, y: 585, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm2-b4', x: 2420, y: 836, w: 110, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-mid4', x: 2660, y: 575, w: 240, h: 20, oneWay: true, style: 'rafter' },
      // Boss chamber
      { id: 'm2-boss', x: 3280, y: FLOOR, w: 960, h: 220, style: 'boss_floor' },
      { id: 'm2-bp1', x: 3420, y: 836, w: 100, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-bp2', x: 3860, y: 836, w: 100, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm2-br', x: 3600, y: 575, w: 250, h: 20, oneWay: true, style: 'rafter' },
    ],
    torches: [
      { x: 160, y: 755, phase: 0.2 },
      { x: 920, y: 635, phase: 1.6 },
      { x: 1640, y: 755, phase: 2.9 },
      { x: 2260, y: 755, phase: 1.1 },
      { x: 2820, y: 755, phase: 3.4 },
      { x: 3560, y: 735, phase: 0.7 },
      { x: 3940, y: 735, phase: 2.3 },
    ],
    interactables: [
      { id: 'm2-chest-top', kind: 'chest', x: 660, y: 390, label: 'Spire Apex Cache (+Potion & Shards)', used: false },
      { id: 'm2-altar', kind: 'upgrade_altar', x: 2090, y: 585, label: 'Luminous Cap Relic (Choose 1 of 3)', used: false },
      { id: 'm2-font', kind: 'fountain', x: 3340, y: FLOOR, label: 'Biolume Well (+2 HP / +2 MP)', used: false },
      { id: 'm2-door', kind: 'exit_door', x: 4140, y: FLOOR, label: 'Enter Room 3 · Sunken Spore Chasm', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'm2-h1', x: 1510, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: 'm2-h2', x: 2300, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
    ],
    createEnemies: (m = 1, f = 0) =>
      buildEnemies(
        [
          { type: 'mycelium_spitter', x: 540, y: 630, facing: -1, patrolRadius: 50 },
          { type: 'spore_hopper', x: 1120, y: 455, facing: -1, patrolRadius: 95 },
          { type: 'mycelium_spitter', x: 1860, y: FLOOR, facing: -1, patrolRadius: 80 },
          { type: 'cap_brute', x: 2220, y: FLOOR, facing: -1, patrolRadius: 140 },
          { type: 'spore_hopper', x: 2740, y: 575, facing: -1, patrolRadius: 90 },
          { type: 'cap_brute', x: 2860, y: FLOOR, facing: -1, patrolRadius: 120 },
          { type: 'boss_goblin_shaman', x: 3860, y: 650, facing: -1, patrolRadius: 230, customName: 'Spore Matriarch', customHp: 22 },
        ],
        1,
        m,
        f
      ),
  },
  {
    idPrefix: 'm2',
    startX: 1780,
    endX: 2760,
    grateInX: 1820,
    grateOutX: 2610,
    chestLabel: 'Mycelium Burrow Vault (+Potion & Shards)',
  }
);

const M3_W = 4180;
const M3_STAGE: StageDef = withUndergroundPassage(
  {
    index: 2,
    roomNumber: 3,
    raidId: 'mushroom_kingdom',
    environment: 'mushroom',
    name: 'Room 3/4 · Sunken Spore Chasm',
    bossName: 'Blight Stalker',
    worldWidth: M3_W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3200,
    exitDoorX: 4080,
    theme: {
      skyTop: '#061914',
      skyBottom: '#1c3b2c',
      moonColor: '#bbf7d0',
      parallaxColor: '#0c261c',
      archColor: 'rgba(20, 83, 45, 0.62)',
      windowColor: 'rgba(74, 222, 128, 0.28)',
      stoneFill: '#1e2c24',
      stoneTop: '#4ade80',
      bossFloorTop: '#22c55e',
    },
    platforms: [
      { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'wall-right', x: M3_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'm3-g1', x: 0, y: FLOOR, w: 680, h: 220, style: 'stone' },
      // Bouncy Toadstool Chasm Gauntlet — bounce from cap to cap across the abyss!
      { id: 'm3-b1', x: 760, y: 800, w: 130, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm3-b2', x: 1040, y: 740, w: 130, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm3-b3', x: 1310, y: 690, w: 190, h: 18, oneWay: true, style: 'bridge' },
      { id: 'm3-hi1', x: 870, y: 500, w: 240, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm3-hi2', x: 1210, y: 455, w: 250, h: 20, oneWay: true, style: 'rafter' },
      // Island stronghold with under-tunnel
      { id: 'm3-g2', x: 1580, y: FLOOR, w: 1460, h: 220, style: 'stone' },
      { id: 'm3-p1', x: 1750, y: 745, w: 190, h: 18, oneWay: true, style: 'bridge' },
      { id: 'm3-p2', x: 2060, y: 615, w: 240, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm3-b4', x: 2420, y: 836, w: 115, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm3-p4', x: 2660, y: 585, w: 230, h: 20, oneWay: true, style: 'rafter' },
      // Boss zone
      { id: 'm3-boss', x: 3220, y: FLOOR, w: 960, h: 220, style: 'boss_floor' },
      { id: 'm3-bp1', x: 3360, y: 836, w: 100, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm3-bp2', x: 3820, y: 836, w: 100, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm3-br', x: 3550, y: 580, w: 240, h: 20, oneWay: true, style: 'rafter' },
    ],
    torches: [
      { x: 180, y: 755, phase: 0.4 },
      { x: 1720, y: 755, phase: 1.5 },
      { x: 2320, y: 755, phase: 2.7 },
      { x: 2880, y: 755, phase: 0.8 },
      { x: 3520, y: 735, phase: 1.9 },
      { x: 3880, y: 735, phase: 3.1 },
    ],
    interactables: [
      { id: 'm3-chest1', kind: 'chest', x: 1340, y: 455, label: 'High Cap Cache (+Potion & Shards)', used: false },
      { id: 'm3-altar', kind: 'upgrade_altar', x: 2170, y: 615, label: 'Fungal Altar (Choose 1 of 3)', used: false },
      { id: 'm3-font', kind: 'fountain', x: 3280, y: FLOOR, label: 'Nectar Spring (+2 HP / +2 MP)', used: false },
      { id: 'm3-door', kind: 'exit_door', x: 4080, y: FLOOR, label: 'Enter Room 4 · Royal Spore Court', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'm3-h1', x: 310, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: 'm3-h2', x: 1920, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) =>
      buildEnemies(
        [
          { type: 'spore_hopper', x: 460, y: FLOOR, facing: -1, patrolRadius: 110 },
          { type: 'mycelium_spitter', x: 990, y: 500, facing: -1, patrolRadius: 65 },
          { type: 'spore_hopper', x: 1900, y: FLOOR, facing: -1, patrolRadius: 120 },
          { type: 'cap_brute', x: 2340, y: FLOOR, facing: 1, patrolRadius: 145 },
          { type: 'mycelium_spitter', x: 2770, y: 585, facing: -1, patrolRadius: 60 },
          { type: 'boss_bone_reaver', x: 3800, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Blight Stalker', customHp: 25 },
        ],
        1,
        m,
        f
      ),
  },
  {
    idPrefix: 'm3',
    startX: 1680,
    endX: 2880,
    grateInX: 1730,
    grateOutX: 2720,
    chestLabel: 'Sunken Mycelium Cache (+Potion & Shards)',
  }
);

const M4_W = 4320;
const M4_STAGE: StageDef = withUndergroundPassage(
  {
    index: 3,
    roomNumber: 4,
    raidId: 'mushroom_kingdom',
    environment: 'mushroom',
    name: 'Room 4/4 · Royal Spore Court',
    bossName: 'Amanita Guard Captain',
    worldWidth: M4_W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3320,
    exitDoorX: 4220,
    theme: {
      skyTop: '#160824',
      skyBottom: '#2d144a',
      moonColor: '#f5d0fe',
      parallaxColor: '#1f0d36',
      archColor: 'rgba(107, 33, 168, 0.56)',
      windowColor: 'rgba(52, 211, 153, 0.34)',
      stoneFill: '#241a38',
      stoneTop: '#10b981',
      bossFloorTop: '#ec4899',
    },
    platforms: [
      { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'wall-right', x: M4_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'm4-g1', x: 0, y: FLOOR, w: 1460, h: 220, style: 'stone' },
      { id: 'm4-b1', x: 340, y: 836, w: 115, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm4-p2', x: 600, y: 595, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm4-b2', x: 1020, y: 836, w: 115, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm4-pil', x: 1590, y: 720, w: 140, h: 360, style: 'pillar' },
      { id: 'm4-g2', x: 1860, y: FLOOR, w: 1320, h: 220, style: 'stone' },
      { id: 'm4-b3', x: 2040, y: 836, w: 115, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm4-p5', x: 2340, y: 585, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'm4-p6', x: 2740, y: 730, w: 200, h: 18, oneWay: true, style: 'bridge' },
      { id: 'm4-boss', x: 3340, y: FLOOR, w: 980, h: 220, style: 'boss_floor' },
      { id: 'm4-bp1', x: 3480, y: 836, w: 105, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm4-bp2', x: 3940, y: 836, w: 105, h: 24, oneWay: true, style: 'bounce_cap' },
      { id: 'm4-br', x: 3680, y: 575, w: 250, h: 20, oneWay: true, style: 'rafter' },
    ],
    torches: [
      { x: 190, y: 755, phase: 0.3 },
      { x: 880, y: 755, phase: 1.7 },
      { x: 2100, y: 755, phase: 2.4 },
      { x: 2780, y: 755, phase: 3.8 },
      { x: 3600, y: 735, phase: 0.9 },
      { x: 4000, y: 735, phase: 2.1 },
    ],
    interactables: [
      { id: 'm4-chest1', kind: 'chest', x: 740, y: 595, label: 'Royal Cap Chest (+Potion & Shards)', used: false },
      { id: 'm4-altar', kind: 'upgrade_altar', x: 2475, y: 585, label: 'Spore Court Relic (Choose 1 of 3)', used: false },
      { id: 'm4-font', kind: 'fountain', x: 3400, y: FLOOR, label: 'Crown Spring (+2 HP / +2 MP)', used: false },
      { id: 'm4-door', kind: 'exit_door', x: 4220, y: FLOOR, label: 'Enter Throne of the Mycelium Sovereign (Big Boss)', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'm4-h1', x: 480, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: 'm4-h2', x: 2220, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
    ],
    createEnemies: (m = 1, f = 0) =>
      buildEnemies(
        [
          { type: 'cap_brute', x: 720, y: FLOOR, facing: -1, patrolRadius: 145 },
          { type: 'mycelium_spitter', x: 1180, y: FLOOR, facing: -1, patrolRadius: 75 },
          { type: 'cap_brute', x: 2260, y: FLOOR, facing: -1, patrolRadius: 130 },
          { type: 'spore_hopper', x: 2480, y: 585, facing: -1, patrolRadius: 95 },
          { type: 'mycelium_spitter', x: 2840, y: 730, facing: -1, patrolRadius: 65 },
          { type: 'boss_executioner', x: 3920, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Amanita Guard Captain', customHp: 28 },
        ],
        2,
        m,
        f
      ),
  },
  {
    idPrefix: 'm4',
    startX: 1960,
    endX: 3040,
    grateInX: 2010,
    grateOutX: 2880,
    chestLabel: 'Royal Root-Vault (+Potion & Shards)',
  }
);

const M5_W = 1660;
const M5_STAGE: StageDef = {
  index: 4,
  roomNumber: 5,
  raidId: 'mushroom_kingdom',
  environment: 'mushroom',
  isBigBossRoom: true,
  name: 'Final Boss · Mycelium Sovereign Throne',
  bossName: 'Sporelord Amanita · Mycelium Sovereign',
  worldWidth: M5_W,
  worldHeight: HEIGHT,
  floorY: FLOOR,
  bossZoneStartX: 200,
  exitDoorX: 1560,
  theme: {
    skyTop: '#081e1c',
    skyBottom: '#271242',
    moonColor: '#6ee7b7',
    parallaxColor: '#13242b',
    archColor: 'rgba(16, 185, 129, 0.42)',
    windowColor: 'rgba(236, 72, 153, 0.35)',
    stoneFill: '#1a272a',
    stoneTop: '#34d399',
    bossFloorTop: '#ec4899',
  },
  platforms: [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: M5_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'm5-floor', x: 0, y: FLOOR, w: M5_W, h: 220, style: 'boss_floor' },
    { id: 'm5-cap-l', x: 240, y: 836, w: 120, h: 24, oneWay: true, style: 'bounce_cap' },
    { id: 'm5-cap-c', x: 710, y: 655, w: 240, h: 20, oneWay: true, style: 'rafter' },
    { id: 'm5-cap-r', x: 1290, y: 836, w: 120, h: 24, oneWay: true, style: 'bounce_cap' },
    { id: 'm5-cap-hi', x: 690, y: 495, w: 280, h: 20, oneWay: true, style: 'rafter' },
  ],
  torches: [
    { x: 210, y: 735, phase: 0.5 },
    { x: 600, y: 735, phase: 1.9 },
    { x: 1060, y: 735, phase: 3.1 },
    { x: 1450, y: 735, phase: 0.9 },
  ],
  interactables: [
    { id: 'm5-door', kind: 'exit_door', x: 1560, y: FLOOR, label: 'Claim Mycelial Crown & Return to Camp', used: false, locked: true },
  ],
  hidingSpots: [],
  createEnemies: (m = 1, f = 0) =>
    buildEnemies(
      [
        {
          type: 'boss_mushroom_sovereign',
          x: 1220,
          y: FLOOR,
          facing: -1,
          patrolRadius: 400,
          isBigBoss: true,
        },
      ],
      0,
      m,
      f
    ),
};

export const MUSHROOM_RAID_ROOMS: StageDef[] = [M1_STAGE, M2_STAGE, M3_STAGE, M4_STAGE, M5_STAGE];

// ============================================================================
// RAID 6: SAND FORTRESS (4 Sun Bastions + Pharaoh-Khan Sethra!)
// Signature Gimmick: Monumental Stepped Pyramid Ascents, Crumbling Sandstone
// Bridges & 100% Bespoke Desert Enemies (Dune Mirage-Stalker, Sun-Scarab Roller,
// Solar Obelisk Priest)!
// ============================================================================
function buildSandRoom(
  index: number,
  roomNumber: number,
  name: string,
  bossName: string,
  nextLabel: string,
  variant: 'rampart' | 'pyramid' | 'windbridge' | 'sanctum',
  spawns: EnemySpawn[]
): StageDef {
  const W = 4240;
  const platforms: Platform[] = [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
  ];

  if (variant === 'rampart') {
    // Stepped Fortress Battlements with sandstone walls & battlements
    platforms.push(
      { id: 'sf-g1', x: 0, y: FLOOR, w: 1480, h: 220, style: 'stone' },
      { id: 'sf-wall1', x: 560, y: 740, w: 95, h: 120, style: 'pillar' },
      { id: 'sf-b1', x: 260, y: 740, w: 220, h: 18, oneWay: true, style: 'bridge' },
      { id: 'sf-b2', x: 680, y: 635, w: 270, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-b3', x: 1050, y: 740, w: 210, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: 'sf-g2', x: 1640, y: FLOOR, w: 1460, h: 220, style: 'stone' },
      { id: 'sf-wall2', x: 2240, y: 710, w: 110, h: 150, style: 'pillar' },
      { id: 'sf-b4', x: 1820, y: 720, w: 220, h: 18, oneWay: true, style: 'bridge' },
      { id: 'sf-b5', x: 2180, y: 570, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-b6', x: 2620, y: 720, w: 220, h: 18, oneWay: true, style: 'bridge' }
    );
  } else if (variant === 'pyramid') {
    // True Giant Stepped Pyramid Ziggurat climb to y=390 and terraced descent!
    platforms.push(
      { id: 'sf-g1', x: 0, y: FLOOR, w: 3120, h: 220, style: 'stone' },
      { id: 'sf-z1', x: 420, y: 760, w: 280, h: 18, oneWay: true, style: 'bridge' },
      { id: 'sf-z2', x: 740, y: 650, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-z3', x: 1080, y: 535, w: 310, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-z4', x: 1450, y: 415, w: 360, h: 22, oneWay: true, style: 'rafter' },
      { id: 'sf-z5', x: 1890, y: 535, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-z6', x: 2260, y: 655, w: 270, h: 18, oneWay: true, style: 'bridge' },
      { id: 'sf-z7', x: 2600, y: 760, w: 250, h: 18, oneWay: true, style: 'bridge' }
    );
  } else if (variant === 'windbridge') {
    // Crumbling Sandstone Bridges over deep Desert Chasms!
    platforms.push(
      { id: 'sf-g1', x: 0, y: FLOOR, w: 680, h: 220, style: 'stone' },
      { id: 'sf-w1', x: 760, y: 790, w: 200, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: 'sf-w2', x: 1060, y: 700, w: 200, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: 'sf-w3', x: 1360, y: 610, w: 220, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-hi', x: 940, y: 505, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-g2', x: 1700, y: FLOOR, w: 1400, h: 220, style: 'stone' },
      { id: 'sf-w4', x: 1940, y: 730, w: 210, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: 'sf-w5', x: 2320, y: 600, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-w6', x: 2720, y: 730, w: 210, h: 18, oneWay: true, style: 'bridge' }
    );
  } else {
    // Twin Solar Obelisk Corridor with high vantage walkways
    platforms.push(
      { id: 'sf-g1', x: 0, y: FLOOR, w: 1320, h: 220, style: 'stone' },
      { id: 'sf-ob1', x: 640, y: 660, w: 110, h: 200, style: 'pillar' },
      { id: 'sf-s1', x: 340, y: 740, w: 190, h: 18, oneWay: true, style: 'bridge' },
      { id: 'sf-s2', x: 820, y: 590, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-g2', x: 1480, y: FLOOR, w: 1620, h: 220, style: 'stone' },
      { id: 'sf-ob2', x: 2160, y: 650, w: 115, h: 210, style: 'pillar' },
      { id: 'sf-s3', x: 1780, y: 735, w: 210, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: 'sf-s4', x: 2360, y: 590, w: 270, h: 20, oneWay: true, style: 'rafter' },
      { id: 'sf-s5', x: 2720, y: 740, w: 200, h: 18, oneWay: true, style: 'bridge' }
    );
  }

  // Boss zone
  platforms.push(
    { id: `sf${roomNumber}-boss`, x: 3260, y: FLOOR, w: 980, h: 220, style: 'boss_floor' },
    { id: `sf${roomNumber}-bp1`, x: 3420, y: 755, w: 155, h: 18, oneWay: true, style: 'bridge' },
    { id: `sf${roomNumber}-bp2`, x: 3840, y: 755, w: 155, h: 18, oneWay: true, style: 'bridge' },
    { id: `sf${roomNumber}-br`, x: 3620, y: 580, w: 220, h: 20, oneWay: true, style: 'rafter' }
  );

  const stage: StageDef = {
    index,
    roomNumber,
    raidId: 'sand_fortress',
    environment: 'sand',
    name,
    bossName,
    worldWidth: W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3240,
    exitDoorX: 4140,
    theme: {
      skyTop: roomNumber % 2 === 1 ? '#5c240c' : '#080d22',
      skyBottom: roomNumber % 2 === 1 ? '#c96f24' : '#261a42',
      moonColor: roomNumber % 2 === 1 ? '#fef08a' : '#e2e8f0',
      parallaxColor: roomNumber % 2 === 1 ? '#5e2f12' : '#161430',
      archColor: roomNumber % 2 === 1 ? 'rgba(138, 72, 24, 0.56)' : 'rgba(62, 46, 92, 0.56)',
      windowColor: roomNumber % 2 === 1 ? 'rgba(253, 224, 71, 0.34)' : 'rgba(186, 230, 253, 0.3)',
      stoneFill: roomNumber % 2 === 1 ? '#5c391a' : '#312328',
      stoneTop: roomNumber % 2 === 1 ? '#eab308' : '#b88856',
      bossFloorTop: '#facc15',
    },
    platforms,
    torches: [
      { x: 180, y: 755, phase: 0.3 },
      { x: 960, y: 755, phase: 1.5 },
      { x: 1920, y: 755, phase: 2.6 },
      { x: 2740, y: 755, phase: 3.8 },
      { x: 3540, y: 735, phase: 0.9 },
      { x: 3940, y: 735, phase: 2.2 },
    ],
    interactables: [
      { id: `sf${roomNumber}-brz`, kind: 'brazier', x: 210, y: FLOOR, label: 'Solar Brazier (+2 MP)', used: false },
      { id: `sf${roomNumber}-chest`, kind: 'chest', x: variant === 'pyramid' ? 1620 : 1040, y: variant === 'pyramid' ? 415 : 505, label: 'Sun-Vault Chest (+Potion & Shards)', used: false },
      { id: `sf${roomNumber}-altar`, kind: 'upgrade_altar', x: 2300, y: FLOOR, label: 'Dune Obelisk (Choose 1 of 3)', used: false },
      { id: `sf${roomNumber}-font`, kind: 'fountain', x: 3320, y: FLOOR, label: 'Oasis Basin (+2 HP / +2 MP)', used: false },
      { id: `sf${roomNumber}-door`, kind: 'exit_door', x: 4140, y: FLOOR, label: nextLabel, used: false, locked: true },
    ],
    hidingSpots: [
      { id: `sf${roomNumber}-h1`, x: 420, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: `sf${roomNumber}-h2`, x: 2040, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(spawns, Math.floor(index / 2), m, f),
  };

  return withUndergroundPassage(stage, {
    idPrefix: `sf${roomNumber}`,
    startX: 1800,
    endX: 2940,
    grateInX: 1850,
    grateOutX: 2790,
    chestLabel: 'Buried Pharaoh Tomb (+Potion & Shards)',
  });
}

const SF_BOSS_W = 1680;
const SF5_STAGE: StageDef = {
  index: 4,
  roomNumber: 5,
  raidId: 'sand_fortress',
  environment: 'sand',
  isBigBossRoom: true,
  name: 'Final Boss · Solar Throne of Sethra',
  bossName: 'Pharaoh-Khan Sethra · Dune Sovereign',
  worldWidth: SF_BOSS_W,
  worldHeight: HEIGHT,
  floorY: FLOOR,
  bossZoneStartX: 200,
  exitDoorX: 1580,
  theme: {
    skyTop: '#5c2008',
    skyBottom: '#ca711c',
    moonColor: '#fef9c3',
    parallaxColor: '#59290d',
    archColor: 'rgba(161, 98, 7, 0.56)',
    windowColor: 'rgba(253, 224, 71, 0.42)',
    stoneFill: '#5c3615',
    stoneTop: '#f59e0b',
    bossFloorTop: '#fde047',
  },
  platforms: [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: SF_BOSS_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'sf5-floor', x: 0, y: FLOOR, w: SF_BOSS_W, h: 220, style: 'boss_floor' },
    { id: 'sf5-p1', x: 260, y: 745, w: 180, h: 18, oneWay: true, style: 'bridge' },
    { id: 'sf5-p2', x: 720, y: 655, w: 240, h: 20, oneWay: true, style: 'rafter' },
    { id: 'sf5-p3', x: 1240, y: 745, w: 180, h: 18, oneWay: true, style: 'bridge' },
    { id: 'sf5-hi', x: 700, y: 500, w: 280, h: 20, oneWay: true, style: 'rafter' },
  ],
  torches: [
    { x: 220, y: 735, phase: 0.4 },
    { x: 640, y: 735, phase: 1.8 },
    { x: 1040, y: 735, phase: 2.9 },
    { x: 1460, y: 735, phase: 1.1 },
  ],
  interactables: [
    { id: 'sf5-door', kind: 'exit_door', x: 1580, y: FLOOR, label: 'Claim Sunscarab Seal & Return to Camp', used: false, locked: true },
  ],
  hidingSpots: [],
  createEnemies: (m = 1, f = 0) =>
    buildEnemies(
      [{ type: 'boss_sand_pharaoh', x: 1240, y: FLOOR, facing: -1, patrolRadius: 420, isBigBoss: true }],
      0,
      m,
      f
    ),
};

export const SAND_RAID_ROOMS: StageDef[] = [
  buildSandRoom(0, 1, 'Room 1/4 · Sun-Baked Ramparts', 'Dune Raider Chief', 'Enter Room 2 · Stepped Ziggurat', 'rampart', [
    { type: 'scarab_swarmer', x: 460, y: FLOOR, facing: -1, patrolRadius: 120 },
    { type: 'dune_stalker', x: 1120, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'sun_acolyte', x: 2060, y: 620, facing: -1, patrolRadius: 140 },
    { type: 'scarab_swarmer', x: 2420, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'dune_stalker', x: 2820, y: FLOOR, facing: -1, patrolRadius: 120 },
    { type: 'boss_goblin_chief', x: 3860, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Dune Raider Chief', customHp: 20 },
  ]),
  buildSandRoom(1, 2, 'Room 2/4 · Stepped Ziggurat', 'Mirage Blade-Lord', 'Enter Room 3 · Wind-Bridge Chasm', 'pyramid', [
    { type: 'scarab_swarmer', x: 620, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'sun_acolyte', x: 1620, y: 365, facing: -1, patrolRadius: 120 },
    { type: 'dune_stalker', x: 2060, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'sun_acolyte', x: 2480, y: 560, facing: -1, patrolRadius: 150 },
    { type: 'scarab_swarmer', x: 2840, y: FLOOR, facing: -1, patrolRadius: 120 },
    { type: 'boss_vampire_duelist', x: 3860, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Mirage Blade-Lord', customHp: 23 },
  ]),
  buildSandRoom(2, 3, 'Room 3/4 · Wind-Bridge Chasm', 'Sandstone Titan', 'Enter Room 4 · Obelisk Sanctum', 'windbridge', [
    { type: 'sun_acolyte', x: 1080, y: 460, facing: -1, patrolRadius: 150 },
    { type: 'dune_stalker', x: 1960, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'scarab_swarmer', x: 2380, y: FLOOR, facing: -1, patrolRadius: 145 },
    { type: 'sun_acolyte', x: 2660, y: 520, facing: -1, patrolRadius: 155 },
    { type: 'boss_colossus', x: 3860, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Sandstone Titan', customHp: 26 },
  ]),
  buildSandRoom(3, 4, 'Room 4/4 · Obelisk Sanctum', 'Royal Vizier Khem', 'Enter Solar Throne of Sethra (Big Boss)', 'sanctum', [
    { type: 'dune_stalker', x: 940, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'sun_acolyte', x: 1920, y: 610, facing: -1, patrolRadius: 150 },
    { type: 'scarab_swarmer', x: 2420, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'dune_stalker', x: 2800, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'boss_infernal_knight', x: 3880, y: FLOOR, facing: -1, patrolRadius: 250, customName: 'Royal Vizier Khem', customHp: 29 },
  ]),
  SF5_STAGE,
];

// ============================================================================
// RAID 7: ALIEN SHIP (4 Mothership Decks + Void Archon Xel'Vora!)
// Signature Gimmick: Low-Gravity Orbital Decks (0.80x gravity in engine!) +
// Multi-Deck Bulkhead Shafts & 100% Bespoke Xeno-Tech Enemies (Plasma Saucer-
// Drone, Xeno Leaper, Exo-Rail Walker)!
// ============================================================================
function buildAlienRoom(
  index: number,
  roomNumber: number,
  name: string,
  bossName: string,
  nextLabel: string,
  deckKind: 'hangar' | 'reactor' | 'airlock' | 'bridge',
  spawns: EnemySpawn[]
): StageDef {
  const W = 4240;
  const platforms: Platform[] = [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
  ];

  if (deckKind === 'hangar') {
    // Low-G Dual-Tier Mothership Bay with soaring upper gantries
    platforms.push(
      { id: 'al-g1', x: 0, y: FLOOR, w: 1480, h: 220, style: 'obsidian' },
      { id: 'al-d1', x: 240, y: 705, w: 280, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-d2', x: 600, y: 545, w: 340, h: 18, oneWay: true, style: 'rafter' },
      { id: 'al-d3', x: 1020, y: 705, w: 260, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-g2', x: 1640, y: FLOOR, w: 1460, h: 220, style: 'obsidian' },
      { id: 'al-d4', x: 1780, y: 680, w: 280, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-d5', x: 2180, y: 500, w: 340, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-d6', x: 2620, y: 680, w: 260, h: 18, oneWay: true, style: 'bridge' }
    );
  } else if (deckKind === 'reactor') {
    // Vertical 4-Deck Reactor Elevator Core!
    platforms.push(
      { id: 'al-g1', x: 0, y: FLOOR, w: 1120, h: 220, style: 'obsidian' },
      { id: 'al-r1', x: 240, y: 720, w: 240, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-r2', x: 540, y: 565, w: 260, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-r3', x: 840, y: 415, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-r4', x: 1240, y: 540, w: 260, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: 'al-g2', x: 1540, y: FLOOR, w: 1560, h: 220, style: 'obsidian' },
      { id: 'al-r5', x: 1740, y: 710, w: 240, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-r6', x: 2080, y: 545, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-r7', x: 2480, y: 410, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-r8', x: 2740, y: 710, w: 220, h: 18, oneWay: true, style: 'bridge' }
    );
  } else if (deckKind === 'airlock') {
    // Wide Zero-G Spacewalk Catwalks with long low-gravity leaps!
    platforms.push(
      { id: 'al-g1', x: 0, y: FLOOR, w: 620, h: 220, style: 'obsidian' },
      { id: 'al-a1', x: 750, y: 760, w: 200, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-a2', x: 1060, y: 630, w: 210, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-a3', x: 1360, y: 520, w: 220, h: 18, oneWay: true, style: 'rafter' },
      { id: 'al-a4', x: 960, y: 425, w: 280, h: 18, oneWay: true, style: 'rafter' },
      { id: 'al-g2', x: 1640, y: FLOOR, w: 1460, h: 220, style: 'obsidian' },
      { id: 'al-a5', x: 1860, y: 695, w: 240, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-a6', x: 2280, y: 530, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-a7', x: 2720, y: 695, w: 220, h: 18, oneWay: true, style: 'bridge' }
    );
  } else {
    // Command Bridge dual-level security promenade
    platforms.push(
      { id: 'al-g1', x: 0, y: FLOOR, w: 1400, h: 220, style: 'obsidian' },
      { id: 'al-c1', x: 280, y: 705, w: 280, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-c2', x: 660, y: 535, w: 340, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-c3', x: 1100, y: 705, w: 240, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-g2', x: 1540, y: FLOOR, w: 1560, h: 220, style: 'obsidian' },
      { id: 'al-c4', x: 1760, y: 695, w: 260, h: 18, oneWay: true, style: 'bridge' },
      { id: 'al-c5', x: 2140, y: 525, w: 340, h: 20, oneWay: true, style: 'rafter' },
      { id: 'al-c6', x: 2620, y: 695, w: 260, h: 18, oneWay: true, style: 'bridge' }
    );
  }

  platforms.push(
    { id: `al${roomNumber}-boss`, x: 3260, y: FLOOR, w: 980, h: 220, style: 'boss_floor' },
    { id: `al${roomNumber}-bp1`, x: 3420, y: 710, w: 175, h: 18, oneWay: true, style: 'bridge' },
    { id: `al${roomNumber}-bp2`, x: 3840, y: 710, w: 175, h: 18, oneWay: true, style: 'bridge' },
    { id: `al${roomNumber}-br`, x: 3600, y: 525, w: 250, h: 20, oneWay: true, style: 'rafter' }
  );

  const stage: StageDef = {
    index,
    roomNumber,
    raidId: 'alien_ship',
    environment: 'alien',
    name,
    bossName,
    worldWidth: W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3240,
    exitDoorX: 4140,
    theme: {
      skyTop: '#020617',
      skyBottom: '#0c2338',
      moonColor: '#67e8f9',
      parallaxColor: '#071526',
      archColor: 'rgba(14, 116, 144, 0.45)',
      windowColor: 'rgba(34, 211, 238, 0.34)',
      stoneFill: '#111c2b',
      stoneTop: '#06b6d4',
      bossFloorTop: '#22d3ee',
    },
    platforms,
    torches: [
      { x: 180, y: 755, phase: 0.4 },
      { x: 960, y: 755, phase: 1.7 },
      { x: 1960, y: 755, phase: 2.8 },
      { x: 2740, y: 755, phase: 1.1 },
      { x: 3560, y: 735, phase: 0.6 },
      { x: 3960, y: 735, phase: 2.4 },
    ],
    interactables: [
      { id: `al${roomNumber}-brz`, kind: 'brazier', x: 210, y: FLOOR, label: 'Plasma Cell (+2 MP)', used: false },
      { id: `al${roomNumber}-chest`, kind: 'chest', x: 1040, y: deckKind === 'airlock' ? 425 : deckKind === 'reactor' ? 415 : 535, label: 'Xeno Pod Cache (+Potion & Shards)', used: false },
      { id: `al${roomNumber}-altar`, kind: 'upgrade_altar', x: 2300, y: FLOOR, label: 'Quantum Console (Choose 1 of 3)', used: false },
      { id: `al${roomNumber}-font`, kind: 'fountain', x: 3320, y: FLOOR, label: 'Nano-Med Bay (+2 HP / +2 MP)', used: false },
      { id: `al${roomNumber}-door`, kind: 'exit_door', x: 4140, y: FLOOR, label: nextLabel, used: false, locked: true },
    ],
    hidingSpots: [
      { id: `al${roomNumber}-h1`, x: 420, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: `al${roomNumber}-h2`, x: 2020, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(spawns, Math.floor(index / 2), m, f),
  };

  return withUndergroundPassage(stage, {
    idPrefix: `al${roomNumber}`,
    startX: 1760,
    endX: 2920,
    grateInX: 1810,
    grateOutX: 2760,
    chestLabel: 'Maintenance Duct Vault (+Potion & Shards)',
  });
}

const AL5_W = 1680;
const AL5_STAGE: StageDef = {
  index: 4,
  roomNumber: 5,
  raidId: 'alien_ship',
  environment: 'alien',
  isBigBossRoom: true,
  name: 'Final Boss · Singularity Bridge',
  bossName: 'Void Archon Xel\'Vora · Star Harvester',
  worldWidth: AL5_W,
  worldHeight: HEIGHT,
  floorY: FLOOR,
  bossZoneStartX: 200,
  exitDoorX: 1580,
  theme: {
    skyTop: '#020617',
    skyBottom: '#161b3a',
    moonColor: '#a5f3fc',
    parallaxColor: '#091128',
    archColor: 'rgba(6, 182, 212, 0.45)',
    windowColor: 'rgba(129, 140, 248, 0.4)',
    stoneFill: '#0f172a',
    stoneTop: '#22d3ee',
    bossFloorTop: '#818cf8',
  },
  platforms: [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: AL5_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'al5-floor', x: 0, y: FLOOR, w: AL5_W, h: 220, style: 'boss_floor' },
    { id: 'al5-p1', x: 260, y: 710, w: 190, h: 18, oneWay: true, style: 'bridge' },
    { id: 'al5-p2', x: 720, y: 615, w: 240, h: 20, oneWay: true, style: 'rafter' },
    { id: 'al5-p3', x: 1230, y: 710, w: 190, h: 18, oneWay: true, style: 'bridge' },
    { id: 'al5-hi', x: 690, y: 455, w: 300, h: 20, oneWay: true, style: 'rafter' },
  ],
  torches: [
    { x: 210, y: 735, phase: 0.3 },
    { x: 630, y: 735, phase: 1.7 },
    { x: 1050, y: 735, phase: 2.9 },
    { x: 1460, y: 735, phase: 1.2 },
  ],
  interactables: [
    { id: 'al5-door', kind: 'exit_door', x: 1580, y: FLOOR, label: 'Claim Singularity Core & Return to Camp', used: false, locked: true },
  ],
  hidingSpots: [],
  createEnemies: (m = 1, f = 0) =>
    buildEnemies(
      [{ type: 'boss_alien_archon', x: 1220, y: 640, facing: -1, patrolRadius: 420, isBigBoss: true }],
      0,
      m,
      f
    ),
};

export const ALIEN_RAID_ROOMS: StageDef[] = [
  buildAlienRoom(0, 1, 'Room 1/4 · Low-G Docking Hangar', 'Cyber-Enforcer Unit', 'Enter Room 2 · Plasma Reactor Shaft', 'hangar', [
    { type: 'void_stalker', x: 580, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'plasma_drone', x: 1020, y: 540, facing: -1, patrolRadius: 180 },
    { type: 'mech_turret', x: 2080, y: FLOOR, facing: -1, patrolRadius: 110 },
    { type: 'plasma_drone', x: 2560, y: 520, facing: -1, patrolRadius: 170 },
    { type: 'void_stalker', x: 2840, y: FLOOR, facing: -1, patrolRadius: 120 },
    { type: 'boss_cinder_warden', x: 3860, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Cyber-Enforcer Unit', customHp: 21 },
  ]),
  buildAlienRoom(1, 2, 'Room 2/4 · Plasma Reactor Shaft', 'Void Probe-Alpha', 'Enter Room 3 · Zero-G Airlock', 'reactor', [
    { type: 'plasma_drone', x: 760, y: 520, facing: -1, patrolRadius: 180 },
    { type: 'mech_turret', x: 1960, y: FLOOR, facing: -1, patrolRadius: 110 },
    { type: 'void_stalker', x: 2440, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'plasma_drone', x: 2660, y: 490, facing: -1, patrolRadius: 185 },
    { type: 'boss_malakor', x: 3860, y: 640, facing: -1, patrolRadius: 240, customName: 'Void Probe-Alpha', customHp: 24 },
  ]),
  buildAlienRoom(2, 3, 'Room 3/4 · Zero-G Airlock', 'Star-Golem MK-IX', 'Enter Room 4 · Command Deck', 'airlock', [
    { type: 'plasma_drone', x: 1080, y: 510, facing: -1, patrolRadius: 185 },
    { type: 'void_stalker', x: 2020, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'mech_turret', x: 2480, y: FLOOR, facing: -1, patrolRadius: 105 },
    { type: 'plasma_drone', x: 2820, y: 530, facing: -1, patrolRadius: 175 },
    { type: 'boss_slag_titan', x: 3860, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Star-Golem MK-IX', customHp: 27 },
  ]),
  buildAlienRoom(3, 4, 'Room 4/4 · Command Deck', 'Archon Praetorian', 'Enter Singularity Bridge (Big Boss)', 'bridge', [
    { type: 'mech_turret', x: 960, y: FLOOR, facing: -1, patrolRadius: 110 },
    { type: 'plasma_drone', x: 1320, y: 520, facing: -1, patrolRadius: 180 },
    { type: 'void_stalker', x: 2120, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'mech_turret', x: 2680, y: FLOOR, facing: -1, patrolRadius: 110 },
    { type: 'boss_pyre_matriarch', x: 3880, y: 640, facing: -1, patrolRadius: 240, customName: 'Archon Praetorian', customHp: 30 },
  ]),
  AL5_STAGE,
];

// ============================================================================
// RAID 8: DRAGON CRANE (4 Cloud Sanctuaries + Celestial Crane-Wyrm Longhe!)
// Signature Gimmick: Emerald Updraft Wind Vents ('wind_pad') + Soaring Cloud-
// Peak Pagodas & 100% Bespoke Cloud-Peak Enemies (Crane Sky-Acrobat,
// Jade Lantern-Golem, Cloud Wyrmling)!
// ============================================================================
function buildDragonCraneRoom(
  index: number,
  roomNumber: number,
  name: string,
  bossName: string,
  nextLabel: string,
  peakKind: 'gate' | 'pagoda' | 'clouds' | 'crest',
  spawns: EnemySpawn[]
): StageDef {
  const W = 4260;
  const platforms: Platform[] = [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
  ];

  if (peakKind === 'gate') {
    platforms.push(
      { id: 'dc-g1', x: 0, y: FLOOR, w: 1460, h: 220, style: 'stone' },
      { id: 'dc-w1', x: 300, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-p2', x: 560, y: 575, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-p3', x: 1020, y: 745, w: 210, h: 18, oneWay: true, style: 'timber' },
      { id: 'dc-g2', x: 1620, y: FLOOR, w: 1500, h: 220, style: 'stone' },
      { id: 'dc-w2', x: 1840, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-p5', x: 2120, y: 550, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-p6', x: 2620, y: 720, w: 220, h: 18, oneWay: true, style: 'timber' }
    );
  } else if (peakKind === 'pagoda') {
    // Soaring 4-Tier Wind-Pagoda Ascent!
    platforms.push(
      { id: 'dc-g1', x: 0, y: FLOOR, w: 1200, h: 220, style: 'stone' },
      { id: 'dc-w1', x: 300, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-e2', x: 540, y: 600, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-w2', x: 640, y: 576, w: 110, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-e4', x: 740, y: 385, w: 320, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-g2', x: 1380, y: FLOOR, w: 1740, h: 220, style: 'stone' },
      { id: 'dc-w3', x: 1620, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-e6', x: 1980, y: 545, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-e7', x: 2540, y: 690, w: 240, h: 18, oneWay: true, style: 'timber' }
    );
  } else if (peakKind === 'clouds') {
    // Floating Jade Cloud-Isles connected by Wind Updrafts over a Mountain Abyss!
    platforms.push(
      { id: 'dc-g1', x: 0, y: FLOOR, w: 680, h: 220, style: 'stone' },
      { id: 'dc-w1', x: 540, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-c1', x: 780, y: 675, w: 200, h: 18, oneWay: true, style: 'timber' },
      { id: 'dc-w2', x: 1080, y: 720, w: 120, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-c3', x: 1360, y: 545, w: 240, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-hi', x: 960, y: 445, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-g2', x: 1680, y: FLOOR, w: 1440, h: 220, style: 'stone' },
      { id: 'dc-w3', x: 1920, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-c5', x: 2240, y: 560, w: 290, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-c6', x: 2740, y: 725, w: 210, h: 18, oneWay: true, style: 'timber' }
    );
  } else {
    // Dragon's Crest twin-ridge updraft arena
    platforms.push(
      { id: 'dc-g1', x: 0, y: FLOOR, w: 1360, h: 220, style: 'stone' },
      { id: 'dc-w1', x: 360, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-r2', x: 680, y: 565, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-r3', x: 1080, y: 740, w: 220, h: 18, oneWay: true, style: 'timber' },
      { id: 'dc-g2', x: 1520, y: FLOOR, w: 1600, h: 220, style: 'stone' },
      { id: 'dc-w2', x: 1840, y: 836, w: 115, h: 24, oneWay: true, style: 'wind_pad' },
      { id: 'dc-r5', x: 2180, y: 555, w: 310, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dc-r6', x: 2680, y: 730, w: 230, h: 18, oneWay: true, style: 'timber' }
    );
  }

  platforms.push(
    { id: `dc${roomNumber}-boss`, x: 3280, y: FLOOR, w: 980, h: 220, style: 'boss_floor' },
    { id: `dc${roomNumber}-bp1`, x: 3420, y: 836, w: 110, h: 24, oneWay: true, style: 'wind_pad' },
    { id: `dc${roomNumber}-bp2`, x: 3920, y: 836, w: 110, h: 24, oneWay: true, style: 'wind_pad' },
    { id: `dc${roomNumber}-br`, x: 3620, y: 560, w: 250, h: 20, oneWay: true, style: 'rafter' }
  );

  const stage: StageDef = {
    index,
    roomNumber,
    raidId: 'dragon_crane',
    environment: 'dragon',
    name,
    bossName,
    worldWidth: W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3260,
    exitDoorX: 4160,
    theme: {
      skyTop: roomNumber % 2 === 1 ? '#071c1f' : '#1b1122',
      skyBottom: roomNumber % 2 === 1 ? '#184e4a' : '#4a2138',
      moonColor: '#fef3c7',
      parallaxColor: '#0e2c2f',
      archColor: 'rgba(16, 102, 87, 0.48)',
      windowColor: 'rgba(251, 191, 36, 0.3)',
      stoneFill: '#1c2b2c',
      stoneTop: '#34d399',
      bossFloorTop: '#f59e0b',
    },
    platforms,
    torches: [
      { x: 180, y: 755, phase: 0.4 },
      { x: 960, y: 755, phase: 1.6 },
      { x: 1960, y: 755, phase: 2.8 },
      { x: 2780, y: 755, phase: 3.9 },
      { x: 3560, y: 735, phase: 0.8 },
      { x: 3960, y: 735, phase: 2.2 },
    ],
    interactables: [
      { id: `dc${roomNumber}-brz`, kind: 'brazier', x: 210, y: FLOOR, label: 'Jade Incense (+2 MP)', used: false },
      { id: `dc${roomNumber}-chest`, kind: 'chest', x: peakKind === 'pagoda' ? 880 : 1060, y: peakKind === 'pagoda' ? 385 : peakKind === 'clouds' ? 445 : 565, label: 'Cloud Pagoda Chest (+Potion & Shards)', used: false },
      { id: `dc${roomNumber}-altar`, kind: 'upgrade_altar', x: 2320, y: FLOOR, label: 'Crane Shrine (Choose 1 of 3)', used: false },
      { id: `dc${roomNumber}-font`, kind: 'fountain', x: 3340, y: FLOOR, label: 'Celestial Spring (+2 HP / +2 MP)', used: false },
      { id: `dc${roomNumber}-door`, kind: 'exit_door', x: 4160, y: FLOOR, label: nextLabel, used: false, locked: true },
    ],
    hidingSpots: [
      { id: `dc${roomNumber}-h1`, x: 480, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: `dc${roomNumber}-h2`, x: 2060, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(spawns, Math.floor(index / 2), m, f),
  };

  return withUndergroundPassage(stage, {
    idPrefix: `dc${roomNumber}`,
    startX: 1780,
    endX: 2940,
    grateInX: 1830,
    grateOutX: 2790,
    chestLabel: 'Dragon-Vein Grotto Vault (+Potion & Shards)',
  });
}

const DC5_W = 1700;
const DC5_STAGE: StageDef = {
  index: 4,
  roomNumber: 5,
  raidId: 'dragon_crane',
  environment: 'dragon',
  isBigBossRoom: true,
  name: 'Final Boss · Summit of the Dragon Crane',
  bossName: 'Longhe · Celestial Crane-Wyrm',
  worldWidth: DC5_W,
  worldHeight: HEIGHT,
  floorY: FLOOR,
  bossZoneStartX: 200,
  exitDoorX: 1600,
  theme: {
    skyTop: '#06191d',
    skyBottom: '#1d4d4f',
    moonColor: '#fde68a',
    parallaxColor: '#0c292d',
    archColor: 'rgba(52, 211, 153, 0.36)',
    windowColor: 'rgba(251, 191, 36, 0.38)',
    stoneFill: '#18292b',
    stoneTop: '#34d399',
    bossFloorTop: '#fbbf24',
  },
  platforms: [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: DC5_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'dc5-floor', x: 0, y: FLOOR, w: DC5_W, h: 220, style: 'boss_floor' },
    { id: 'dc5-p1', x: 250, y: 836, w: 120, h: 24, oneWay: true, style: 'wind_pad' },
    { id: 'dc5-p2', x: 720, y: 645, w: 260, h: 20, oneWay: true, style: 'rafter' },
    { id: 'dc5-p3', x: 1320, y: 836, w: 120, h: 24, oneWay: true, style: 'wind_pad' },
    { id: 'dc5-hi', x: 690, y: 490, w: 320, h: 20, oneWay: true, style: 'rafter' },
  ],
  torches: [
    { x: 210, y: 735, phase: 0.4 },
    { x: 630, y: 735, phase: 1.7 },
    { x: 1070, y: 735, phase: 2.9 },
    { x: 1480, y: 735, phase: 1.1 },
  ],
  interactables: [
    { id: 'dc5-door', kind: 'exit_door', x: 1600, y: FLOOR, label: 'Claim Jade Feather Pearl & Return to Camp', used: false, locked: true },
  ],
  hidingSpots: [],
  createEnemies: (m = 1, f = 0) =>
    buildEnemies(
      [{ type: 'boss_dragon_crane', x: 1240, y: 645, facing: -1, patrolRadius: 440, isBigBoss: true }],
      0,
      m,
      f
    ),
};

export const DRAGON_CRANE_RAID_ROOMS: StageDef[] = [
  buildDragonCraneRoom(0, 1, 'Room 1/4 · Jade Torii Steps', 'Crane Blade-Master', 'Enter Room 2 · Misty Pagoda Spire', 'gate', [
    { type: 'crane_disciple', x: 620, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'jade_sentinel', x: 1020, y: 540, facing: -1, patrolRadius: 165 },
    { type: 'crane_disciple', x: 2080, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'cloud_wyrmling', x: 2560, y: 500, facing: -1, patrolRadius: 185 },
    { type: 'boss_vampire_duelist', x: 3880, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Crane Blade-Master', customHp: 21 },
  ]),
  buildDragonCraneRoom(1, 2, 'Room 2/4 · Misty Pagoda Spire', 'Storm-Wing Matron', 'Enter Room 3 · Cloud-Bridge Ridge', 'pagoda', [
    { type: 'jade_sentinel', x: 740, y: 500, facing: -1, patrolRadius: 160 },
    { type: 'crane_disciple', x: 1880, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'cloud_wyrmling', x: 2340, y: 510, facing: -1, patrolRadius: 185 },
    { type: 'jade_sentinel', x: 2740, y: 520, facing: -1, patrolRadius: 165 },
    { type: 'boss_banshee', x: 3880, y: 645, facing: -1, patrolRadius: 240, customName: 'Storm-Wing Matron', customHp: 24 },
  ]),
  buildDragonCraneRoom(2, 3, 'Room 3/4 · Cloud-Bridge Ridge', 'Jade Stone-Dragon', 'Enter Room 4 · Dragon-Crane Crest', 'clouds', [
    { type: 'cloud_wyrmling', x: 1100, y: 490, facing: -1, patrolRadius: 190 },
    { type: 'crane_disciple', x: 2040, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'jade_sentinel', x: 2520, y: 520, facing: -1, patrolRadius: 170 },
    { type: 'cloud_wyrmling', x: 2820, y: 510, facing: -1, patrolRadius: 185 },
    { type: 'boss_gargoyle_king', x: 3880, y: 645, facing: -1, patrolRadius: 240, customName: 'Jade Stone-Dragon', customHp: 27 },
  ]),
  buildDragonCraneRoom(3, 4, 'Room 4/4 · Dragon-Crane Crest', 'Grandmaster Shen', 'Enter Summit of the Dragon Crane (Big Boss)', 'crest', [
    { type: 'crane_disciple', x: 960, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'cloud_wyrmling', x: 1360, y: 500, facing: -1, patrolRadius: 185 },
    { type: 'jade_sentinel', x: 2140, y: 520, facing: -1, patrolRadius: 170 },
    { type: 'crane_disciple', x: 2680, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'boss_bone_reaver', x: 3900, y: FLOOR, facing: -1, patrolRadius: 250, customName: 'Grandmaster Shen', customHp: 30 },
  ]),
  DC5_STAGE,
];

// ============================================================================
// RAID 9: CORRUPTED DWARVEN MINES (4 Crystal Shafts + Thane Borin!)
// Signature Gimmick: Deep Amethyst Crystal Drifts, Multi-Tier Rail Trestles,
// Secret Smuggler Rail-Tunnels, and Bespoke Dwarven Enemies (Pick-Miner,
// Crystal Keg-Sapper, Runed Vault-Golem)!
// ============================================================================
function buildDwarvenMinesRoom(
  index: number,
  roomNumber: number,
  name: string,
  bossName: string,
  nextLabel: string,
  mineKind: 'shaft' | 'rail_trestle' | 'crystal_vein' | 'treasury',
  spawns: EnemySpawn[]
): StageDef {
  const W = 4260;
  const platforms: Platform[] = [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
  ];

  if (mineKind === 'shaft') {
    platforms.push(
      { id: 'dm-g1', x: 0, y: FLOOR, w: 1520, h: 220, style: 'stone' },
      { id: 'dm-t1', x: 420, y: 745, w: 260, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-r1', x: 820, y: 610, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-p1', x: 1180, y: 735, w: 180, h: 125, style: 'pillar' },
      { id: 'dm-g2', x: 1640, y: FLOOR, w: 1500, h: 220, style: 'stone' },
      { id: 'dm-t2', x: 1920, y: 725, w: 260, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-r2', x: 2340, y: 585, w: 320, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-t3', x: 2740, y: 730, w: 240, h: 18, oneWay: true, style: 'timber' }
    );
  } else if (mineKind === 'rail_trestle') {
    // High iron minecart rail bridges spanning deep quarry chasms
    platforms.push(
      { id: 'dm-g1', x: 0, y: FLOOR, w: 860, h: 220, style: 'stone' },
      { id: 'dm-rt1', x: 380, y: 735, w: 240, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-rt2', x: 740, y: 635, w: 420, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-rt3', x: 1260, y: 720, w: 280, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-g2', x: 1460, y: FLOOR, w: 1680, h: 220, style: 'stone' },
      { id: 'dm-rt4', x: 1760, y: 675, w: 340, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-rt5', x: 2220, y: 545, w: 320, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-rt6', x: 2660, y: 715, w: 280, h: 18, oneWay: true, style: 'timber' }
    );
  } else if (mineKind === 'crystal_vein') {
    // Tiered amethyst geode cavern with flanking stone pillars & upper bypasses
    platforms.push(
      { id: 'dm-g1', x: 0, y: FLOOR, w: 1380, h: 220, style: 'stone' },
      { id: 'dm-cv1', x: 360, y: 740, w: 240, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-cv2', x: 720, y: 625, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-cv3', x: 1080, y: 500, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-g2', x: 1520, y: FLOOR, w: 1620, h: 220, style: 'stone' },
      { id: 'dm-cv4', x: 1780, y: 740, w: 120, h: 120, style: 'pillar' },
      { id: 'dm-cv5', x: 2040, y: 615, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-cv6', x: 2480, y: 730, w: 240, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-cv7', x: 2820, y: 605, w: 230, h: 20, oneWay: true, style: 'rafter' }
    );
  } else {
    // Gilded Vault approaches: grand pillared dwarven highway
    platforms.push(
      { id: 'dm-g1', x: 0, y: FLOOR, w: 1480, h: 220, style: 'stone' },
      { id: 'dm-tr1', x: 460, y: 725, w: 260, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-tr2', x: 860, y: 590, w: 300, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-tr3', x: 1220, y: 735, w: 140, h: 125, style: 'pillar' },
      { id: 'dm-g2', x: 1600, y: FLOOR, w: 1540, h: 220, style: 'stone' },
      { id: 'dm-tr4', x: 1940, y: 720, w: 280, h: 18, oneWay: true, style: 'timber' },
      { id: 'dm-tr5', x: 2340, y: 570, w: 310, h: 20, oneWay: true, style: 'rafter' },
      { id: 'dm-tr6', x: 2740, y: 720, w: 240, h: 18, oneWay: true, style: 'timber' }
    );
  }

  platforms.push(
    { id: `dm${roomNumber}-boss`, x: 3280, y: FLOOR, w: 980, h: 220, style: 'boss_floor' },
    { id: `dm${roomNumber}-bp1`, x: 3440, y: 720, w: 220, h: 18, oneWay: true, style: 'timber' },
    { id: `dm${roomNumber}-bp2`, x: 3860, y: 720, w: 220, h: 18, oneWay: true, style: 'timber' },
    { id: `dm${roomNumber}-br`, x: 3630, y: 575, w: 260, h: 20, oneWay: true, style: 'rafter' }
  );

  const stage: StageDef = {
    index,
    roomNumber,
    raidId: 'dwarven_mines',
    environment: 'dwarven_mines',
    name,
    bossName,
    worldWidth: W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3260,
    exitDoorX: 4160,
    theme: {
      skyTop: roomNumber % 2 === 1 ? '#0c0817' : '#120a1c',
      skyBottom: roomNumber % 2 === 1 ? '#231639' : '#2d1a3d',
      moonColor: '#e9d5ff',
      parallaxColor: '#171126',
      archColor: 'rgba(139, 92, 246, 0.34)',
      windowColor: 'rgba(245, 158, 11, 0.35)',
      stoneFill: '#242031',
      stoneTop: '#8b5cf6',
      bossFloorTop: '#f59e0b',
    },
    platforms,
    torches: [
      { x: 180, y: 755, phase: 0.3 },
      { x: 960, y: 755, phase: 1.5 },
      { x: 1940, y: 755, phase: 2.7 },
      { x: 2780, y: 755, phase: 3.8 },
      { x: 3560, y: 735, phase: 0.9 },
      { x: 3960, y: 735, phase: 2.1 },
    ],
    interactables: [
      { id: `dm${roomNumber}-brz`, kind: 'brazier', x: 210, y: FLOOR, label: 'Runic Forge Brazier (+2 MP)', used: false },
      {
        id: `dm${roomNumber}-chest`,
        kind: 'chest',
        x: mineKind === 'crystal_vein' ? 1180 : 940,
        y: mineKind === 'crystal_vein' ? 500 : mineKind === 'rail_trestle' ? 635 : 610,
        label: 'Dwarven Strongbox (+Potion & Shards)',
        used: false,
      },
      { id: `dm${roomNumber}-altar`, kind: 'upgrade_altar', x: 2300, y: FLOOR, label: 'Runestone Shrine (Choose 1 of 3)', used: false },
      { id: `dm${roomNumber}-font`, kind: 'fountain', x: 3340, y: FLOOR, label: 'Mineral Wellspring (+2 HP / +2 MP)', used: false },
      { id: `dm${roomNumber}-door`, kind: 'exit_door', x: 4160, y: FLOOR, label: nextLabel, used: false, locked: true },
    ],
    hidingSpots: [
      { id: `dm${roomNumber}-h1`, x: 490, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: `dm${roomNumber}-h2`, x: 2060, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(spawns, Math.floor(index / 2), m, f),
  };

  return withUndergroundPassage(stage, {
    idPrefix: `dm${roomNumber}`,
    startX: 1740,
    endX: 2940,
    grateInX: 1800,
    grateOutX: 2800,
    chestLabel: 'Smuggler Ore-Cart Stash (+Potion & Shards)',
  });
}

const DM5_W = 1720;
const DM5_STAGE: StageDef = {
  index: 4,
  roomNumber: 5,
  raidId: 'dwarven_mines',
  environment: 'dwarven_mines',
  isBigBossRoom: true,
  name: 'Final Boss · Corrupted Heart-Vein Vault',
  bossName: 'Thane Borin · The Gilded Hollow',
  worldWidth: DM5_W,
  worldHeight: HEIGHT,
  floorY: FLOOR,
  bossZoneStartX: 200,
  exitDoorX: 1620,
  theme: {
    skyTop: '#0b0616',
    skyBottom: '#2b1644',
    moonColor: '#f5d0fe',
    parallaxColor: '#160f26',
    archColor: 'rgba(192, 132, 252, 0.36)',
    windowColor: 'rgba(251, 191, 36, 0.42)',
    stoneFill: '#211c30',
    stoneTop: '#a855f7',
    bossFloorTop: '#f59e0b',
  },
  platforms: [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: DM5_W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'dm5-floor', x: 0, y: FLOOR, w: DM5_W, h: 220, style: 'boss_floor' },
    { id: 'dm5-p1', x: 240, y: 715, w: 230, h: 18, oneWay: true, style: 'timber' },
    { id: 'dm5-p2', x: 740, y: 605, w: 260, h: 20, oneWay: true, style: 'rafter' },
    { id: 'dm5-p3', x: 1240, y: 715, w: 230, h: 18, oneWay: true, style: 'timber' },
  ],
  torches: [
    { x: 210, y: 735, phase: 0.3 },
    { x: 640, y: 735, phase: 1.4 },
    { x: 1080, y: 735, phase: 2.6 },
    { x: 1500, y: 735, phase: 3.7 },
  ],
  interactables: [
    {
      id: 'dm5-door',
      kind: 'exit_door',
      x: 1620,
      y: FLOOR,
      label: 'Claim Heart of the Deep Vein & Return to Camp',
      used: false,
      locked: true,
    },
  ],
  hidingSpots: [],
  createEnemies: (m = 1, f = 0) =>
    buildEnemies(
      [{ type: 'boss_dwarf_king', x: 1260, y: FLOOR, facing: -1, patrolRadius: 430, isBigBoss: true }],
      0,
      m,
      f
    ),
};

export const DWARVEN_MINES_RAID_ROOMS: StageDef[] = [
  buildDwarvenMinesRoom(0, 1, 'Room 1/4 · Amethyst Entry Shaft', 'Foreman Grudak', 'Enter Room 2 · Iron Rail Trestles', 'shaft', [
    { type: 'dwarf_miner', x: 640, y: FLOOR, facing: -1, patrolRadius: 125 },
    { type: 'dwarf_sapper', x: 960, y: 610, facing: -1, patrolRadius: 110 },
    { type: 'dwarf_miner', x: 2080, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'runed_golem', x: 2620, y: FLOOR, facing: -1, patrolRadius: 115 },
    { type: 'boss_cinder_warden', x: 3880, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Foreman Grudak', customHp: 21 },
  ]),
  buildDwarvenMinesRoom(1, 2, 'Room 2/4 · Iron Rail Trestles', 'Blaster Captain Durn', 'Enter Room 3 · Deep Crystal Vein', 'rail_trestle', [
    { type: 'dwarf_sapper', x: 900, y: 635, facing: -1, patrolRadius: 130 },
    { type: 'dwarf_miner', x: 1920, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'dwarf_sapper', x: 2380, y: 545, facing: -1, patrolRadius: 125 },
    { type: 'runed_golem', x: 2780, y: FLOOR, facing: -1, patrolRadius: 120 },
    { type: 'boss_goblin_sapper', x: 3880, y: FLOOR, facing: -1, patrolRadius: 240, customName: 'Blaster Captain Durn', customHp: 24 },
  ]),
  buildDwarvenMinesRoom(2, 3, 'Room 3/4 · Deep Crystal Vein', 'Amethyst Runeguard', 'Enter Room 4 · Gilded Treasury Drift', 'crystal_vein', [
    { type: 'dwarf_miner', x: 760, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'dwarf_sapper', x: 1180, y: 500, facing: -1, patrolRadius: 110 },
    { type: 'runed_golem', x: 2120, y: FLOOR, facing: -1, patrolRadius: 125 },
    { type: 'dwarf_miner', x: 2640, y: FLOOR, facing: -1, patrolRadius: 135 },
    { type: 'boss_slag_titan', x: 3880, y: FLOOR, facing: -1, patrolRadius: 245, customName: 'Amethyst Runeguard', customHp: 28 },
  ]),
  buildDwarvenMinesRoom(3, 4, 'Room 4/4 · Gilded Treasury Drift', 'Master Runesmith Korin', 'Enter Heart-Vein Vault (Big Boss)', 'treasury', [
    { type: 'runed_golem', x: 960, y: FLOOR, facing: -1, patrolRadius: 125 },
    { type: 'dwarf_sapper', x: 1020, y: 590, facing: -1, patrolRadius: 115 },
    { type: 'dwarf_miner', x: 2060, y: FLOOR, facing: -1, patrolRadius: 140 },
    { type: 'runed_golem', x: 2740, y: FLOOR, facing: -1, patrolRadius: 130 },
    { type: 'boss_executioner', x: 3900, y: FLOOR, facing: -1, patrolRadius: 250, customName: 'Master Runesmith Korin', customHp: 31 },
  ]),
  DM5_STAGE,
];

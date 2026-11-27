import {
  Enemy,
  EnemyType,
  Facing,
  HidingSpot,
  Interactable,
  Platform,
  RaidId,
  StageDef,
  TorchProp,
} from './types';

export interface EnemySpawn {
  type: EnemyType;
  x: number;
  y: number;
  facing: Facing;
  patrolRadius: number;
  customName?: string;
  customHp?: number;
  customScaleW?: number;
  customScaleH?: number;
  isBigBoss?: boolean;
}

export const ENEMY_SPECS: Record<
  EnemyType,
  {
    name: string;
    baseW: number;
    baseH: number;
    hp: number;
    visionRange: number;
    isBoss: boolean;
    isBigBoss?: boolean;
  }
> = {
  // Nocturne Castle Roster
  ghoul: { name: 'Ghoul', baseW: 28, baseH: 46, hp: 2, visionRange: 210, isBoss: false },
  skeleton: { name: 'Skeleton', baseW: 26, baseH: 48, hp: 3, visionRange: 270, isBoss: false },
  bat: { name: 'Night Bat', baseW: 32, baseH: 22, hp: 2, visionRange: 280, isBoss: false },
  knight: { name: 'Halberd Knight', baseW: 34, baseH: 56, hp: 4, visionRange: 240, isBoss: false },
  boss_vampire_duelist: {
    name: 'Baron Bloodfang',
    baseW: 44,
    baseH: 72,
    hp: 15,
    visionRange: 520,
    isBoss: true,
  },
  boss_colossus: {
    name: 'Clockwork Colossus',
    baseW: 62,
    baseH: 88,
    hp: 22,
    visionRange: 520,
    isBoss: true,
  },
  boss_malakor: {
    name: 'Hollow Inquisitor',
    baseW: 48,
    baseH: 82,
    hp: 24,
    visionRange: 560,
    isBoss: true,
  },
  boss_gargoyle_king: {
    name: 'Obsidian Gargoyle Lord',
    baseW: 58,
    baseH: 82,
    hp: 28,
    visionRange: 560,
    isBoss: true,
  },
  boss_valerius: {
    name: 'Lord Valerius · Crimson Sovereign',
    baseW: 76,
    baseH: 118,
    hp: 64,
    visionRange: 620,
    isBoss: true,
    isBigBoss: true,
  },

  // Goblin War-Camp Roster
  goblin_grunt: { name: 'Goblin Raider', baseW: 24, baseH: 38, hp: 2, visionRange: 240, isBoss: false },
  goblin_archer: { name: 'Goblin Archer', baseW: 24, baseH: 40, hp: 2, visionRange: 310, isBoss: false },
  goblin_bomber: { name: 'Goblin Sapper', baseW: 26, baseH: 40, hp: 3, visionRange: 290, isBoss: false },
  goblin_shaman: { name: 'Goblin Shaman', baseW: 26, baseH: 44, hp: 3, visionRange: 300, isBoss: false },
  goblin_brute: { name: 'Hobgoblin Crusher', baseW: 38, baseH: 58, hp: 5, visionRange: 250, isBoss: false },
  boss_goblin_chief: {
    name: 'Skritch the Knife-Chief',
    baseW: 42,
    baseH: 62,
    hp: 15,
    visionRange: 520,
    isBoss: true,
  },
  boss_goblin_sapper: {
    name: 'Bombo the Mad Sapper',
    baseW: 48,
    baseH: 68,
    hp: 21,
    visionRange: 540,
    isBoss: true,
  },
  boss_goblin_shaman: {
    name: 'Hex-Lord Zog',
    baseW: 46,
    baseH: 74,
    hp: 25,
    visionRange: 560,
    isBoss: true,
  },
  boss_goblin_behemoth: {
    name: 'Grimjaw the Siege-Hulk',
    baseW: 62,
    baseH: 88,
    hp: 30,
    visionRange: 560,
    isBoss: true,
  },
  boss_goblin_warlord: {
    name: 'Warchief Kragmash · Goblin King',
    baseW: 84,
    baseH: 124,
    hp: 68,
    visionRange: 620,
    isBoss: true,
    isBigBoss: true,
  },

  // Weeping Necropolis (Cemetery) Roster
  grave_hound: { name: 'Crypt Hound', baseW: 36, baseH: 30, hp: 2, visionRange: 250, isBoss: false },
  wraith: { name: 'Grave Wraith', baseW: 30, baseH: 48, hp: 3, visionRange: 300, isBoss: false },
  gargoyle: { name: 'Tomb Gargoyle', baseW: 36, baseH: 46, hp: 3, visionRange: 300, isBoss: false },
  acolyte: { name: 'Crypt Acolyte', baseW: 26, baseH: 48, hp: 3, visionRange: 300, isBoss: false },
  boss_gravedigger: {
    name: 'Mortis the Gravedigger',
    baseW: 54,
    baseH: 80,
    hp: 16,
    visionRange: 540,
    isBoss: true,
  },
  boss_banshee: {
    name: 'Wailing Banshee',
    baseW: 48,
    baseH: 78,
    hp: 22,
    visionRange: 560,
    isBoss: true,
  },
  boss_executioner: {
    name: 'Crypt Executioner',
    baseW: 60,
    baseH: 90,
    hp: 26,
    visionRange: 540,
    isBoss: true,
  },
  boss_bone_reaver: {
    name: 'Bone Reaver Lord',
    baseW: 56,
    baseH: 88,
    hp: 30,
    visionRange: 560,
    isBoss: true,
  },
  boss_necromancer: {
    name: 'Vespera · Arch-Necromancer',
    baseW: 74,
    baseH: 118,
    hp: 66,
    visionRange: 620,
    isBoss: true,
    isBigBoss: true,
  },

  // Brimstone Sanctum (Volcanic Foundry) Roster
  ember_imp: { name: 'Magma Imp', baseW: 30, baseH: 32, hp: 2, visionRange: 295, isBoss: false },
  obsidian_guard: { name: 'Obsidian Sentinel', baseW: 38, baseH: 60, hp: 4, visionRange: 250, isBoss: false },
  boss_cinder_warden: {
    name: 'Cinder Warden',
    baseW: 54,
    baseH: 82,
    hp: 17,
    visionRange: 540,
    isBoss: true,
  },
  boss_pyre_matriarch: {
    name: 'Pyre Matriarch',
    baseW: 50,
    baseH: 82,
    hp: 23,
    visionRange: 560,
    isBoss: true,
  },
  boss_slag_titan: {
    name: 'Slag Colossus',
    baseW: 64,
    baseH: 92,
    hp: 28,
    visionRange: 540,
    isBoss: true,
  },
  boss_infernal_knight: {
    name: 'Ashen Dread-Knight',
    baseW: 56,
    baseH: 88,
    hp: 31,
    visionRange: 560,
    isBoss: true,
  },
  boss_forge_lord: {
    name: 'Ignis · Infernal Forge-Lord',
    baseW: 86,
    baseH: 126,
    hp: 70,
    visionRange: 640,
    isBoss: true,
    isBigBoss: true,
  },

  // Eclipse Citadel — THE BIG BAD END BOSS
  boss_eclipse_overlord: {
    name: 'Draculor · Eclipse Overlord',
    baseW: 92,
    baseH: 138,
    hp: 95,
    visionRange: 680,
    isBoss: true,
    isBigBoss: true,
  },
};

export function isFlyingEnemyType(type: EnemyType): boolean {
  return (
    type === 'bat' ||
    type === 'goblin_shaman' ||
    type === 'wraith' ||
    type === 'gargoyle' ||
    type === 'ember_imp' ||
    type === 'boss_malakor' ||
    type === 'boss_gargoyle_king' ||
    type === 'boss_goblin_shaman' ||
    type === 'boss_banshee' ||
    type === 'boss_necromancer' ||
    type === 'boss_pyre_matriarch'
  );
}

export function buildEnemies(
  spawns: EnemySpawn[],
  roomHpBonus = 0,
  raidHpMult = 1.0,
  raidFlatBonus = 0
): Enemy[] {
  return spawns.map((spawn, idx) => {
    const spec = ENEMY_SPECS[spawn.type];
    const baseHp =
      spawn.customHp !== undefined
        ? spawn.customHp
        : spec.isBoss
          ? spec.hp
          : spec.hp + roomHpBonus;
    const scaledHp = spec.isBoss
      ? Math.max(baseHp, Math.round(baseHp * raidHpMult))
      : Math.max(baseHp, Math.round(baseHp * raidHpMult) + (raidFlatBonus > 0 && baseHp <= 3 ? 1 : 0));

    return {
      id: idx + 1,
      type: spawn.type,
      name: spawn.customName ?? spec.name,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      baseW: spawn.customScaleW ?? spec.baseW,
      baseH: spawn.customScaleH ?? spec.baseH,
      facing: spawn.facing,
      hp: scaledHp,
      maxHp: scaledHp,
      isBoss: spec.isBoss,
      isBigBoss: Boolean(spawn.isBigBoss || spec.isBigBoss),
      enraged: false,
      summoned: false,
      homeX: spawn.x,
      homeY: spawn.y,
      patrolRadius: spawn.patrolRadius,
      visionRange: spec.visionRange,
      alerted: false,
      alertTimer: 0,
      onGround: !isFlyingEnemyType(spawn.type),
      attackCooldown: 1.0 + (idx % 3) * 0.3,
      attackChargeTimer: 0,
      chargeDuration: 0,
      pendingAttackKind: undefined,
      lungeTimer: 0,
      chargeVx: 0,
      chargeVy: 0,
      stateTimer: 0,
      flashTimer: 0,
      invulnTimer: 0,
      bossHitCounter: 0,
      hurtStunTimer: 0,
      burnTimer: 0,
      burnTickTimer: 0,
      animTime: idx * 0.7,
      dead: false,
    };
  });
}

// ============================================================================
// BASE CAMP — In front of Nocturne Castle with Campfire, 3 Heroes & Crafting Forge
// ============================================================================
export const CAMP_FIRE_X = 460;
const CAMP_FLOOR = 860;
const CAMP_WIDTH = 1360;
const CAMP_HEIGHT = 1080;

export const CAMP_STAGE: StageDef = {
  index: -1,
  roomNumber: 0,
  isCamp: true,
  environment: 'castle',
  name: 'Base Camp · Castle Gates',
  bossName: '',
  worldWidth: CAMP_WIDTH,
  worldHeight: CAMP_HEIGHT,
  floorY: CAMP_FLOOR,
  bossZoneStartX: 99999,
  theme: {
    skyTop: '#070910',
    skyBottom: '#181c2b',
    moonColor: '#e9dfc7',
    parallaxColor: '#0e121d',
    archColor: 'rgba(18, 22, 33, 0.5)',
    windowColor: 'rgba(200, 35, 51, 0.3)',
    stoneFill: '#1d1c22',
    stoneTop: '#3c3734',
    bossFloorTop: '#7a252e',
  },
  platforms: [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: CAMP_HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: CAMP_WIDTH, y: 0, w: 40, h: CAMP_HEIGHT, style: 'pillar' },
    { id: 'camp-ground', x: 0, y: CAMP_FLOOR, w: CAMP_WIDTH, h: 220, style: 'camp_ground' },
    // Practice stone pillar & rafters so Ronin wall-cling and Minstrel whip-grappling can be tested in Camp!
    { id: 'camp-practice-pillar', x: 165, y: 740, w: 68, h: 120, style: 'pillar' },
    { id: 'camp-practice-rafter-l', x: 250, y: 635, w: 185, h: 18, oneWay: true, style: 'rafter' },
    { id: 'camp-practice-crumble', x: 465, y: 615, w: 145, h: 16, oneWay: true, style: 'bridge', crumbling: true },
    { id: 'camp-practice-rafter-r', x: 645, y: 605, w: 205, h: 18, oneWay: true, style: 'rafter' },
  ],
  torches: [
    { x: 125, y: 760, phase: 0.4 },
    { x: 1110, y: 740, phase: 2.1 },
    { x: 1275, y: 740, phase: 3.5 },
  ],
  interactables: [
    {
      id: 'camp-hero-hunter',
      kind: 'camp_hero_hunter',
      x: 335,
      y: CAMP_FLOOR,
      label: 'Play Vampire Hunter (Fast · Double Jump)',
      used: false,
    },
    {
      id: 'camp-hero-brute',
      kind: 'camp_hero_brute',
      x: 550,
      y: CAMP_FLOOR,
      label: 'Play Iron Brute (Heavy · High Jump)',
      used: false,
    },
    {
      id: 'camp-hero-ronin',
      kind: 'camp_hero_ronin',
      x: 635,
      y: CAMP_FLOOR,
      label: 'Play Ronin Swordsman (Katana · Wall Cling)',
      used: false,
    },
    {
      id: 'camp-hero-minstrel',
      kind: 'camp_hero_minstrel',
      x: 720,
      y: CAMP_FLOOR,
      label: 'Play The Minstrel (Whip-Zip · Encore Waltz)',
      used: false,
    },
    {
      id: 'camp-weapon-rack',
      kind: 'camp_weapon_rack',
      x: 845,
      y: CAMP_FLOOR,
      label: 'Armory & Loadout (Inventory [I])',
      used: false,
    },
    {
      id: 'camp-craft-bench',
      kind: 'camp_craft_bench',
      x: 995,
      y: CAMP_FLOOR,
      label: 'Crafting Forge & Blood Altar',
      used: false,
    },
    {
      id: 'camp-raid-gate',
      kind: 'camp_raid_gate',
      x: 1205,
      y: CAMP_FLOOR,
      label: 'Choose Raid (1 of 2 Stages · End Boss Raid)',
      used: false,
    },
  ],
  hidingSpots: [],
  createEnemies: () => [],
};

// ============================================================================
// RAID 1: NOCTURNE CASTLE (4 Rooms with Mini-Bosses + 1 Final Big Boss Room)
// ============================================================================
const R1_FLOOR = 860;
const R1_WIDTH = 4320;
const R1_HEIGHT = 1080;

const ROOM_1_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: R1_HEIGHT, style: 'pillar' },
  { id: 'wall-right', x: R1_WIDTH, y: 0, w: 40, h: R1_HEIGHT, style: 'pillar' },

  { id: 'ground-1', x: 0, y: R1_FLOOR, w: 980, h: 220, style: 'stone' },
  { id: 'plat-1a', x: 260, y: 782, w: 140, h: 18, oneWay: true, style: 'bridge' },
  { id: 'plat-1b', x: 460, y: 710, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 'plat-1c', x: 700, y: 780, w: 150, h: 18, oneWay: true, style: 'bridge' },
  { id: 'rafter-1', x: 520, y: 545, w: 200, h: 20, oneWay: true, style: 'rafter' },
  { id: 'rafter-1-hi', x: 830, y: 445, w: 195, h: 20, oneWay: true, style: 'rafter' },
  { id: 'rafter-1-crumble', x: 1055, y: 465, w: 175, h: 16, oneWay: true, style: 'bridge', crumbling: true },

  { id: 'ground-2a', x: 1095, y: R1_FLOOR, w: 280, h: 220, style: 'stone' },
  { id: 'plat-2a', x: 1170, y: 778, w: 160, h: 18, oneWay: true, style: 'bridge' },
  { id: 'plat-2b', x: 1380, y: 710, w: 180, h: 18, oneWay: true, style: 'bridge', crumbling: true },
  { id: 'rafter-2', x: 1270, y: 540, w: 230, h: 20, oneWay: true, style: 'rafter' },
  { id: 'rafter-2-hi', x: 1620, y: 450, w: 230, h: 20, oneWay: true, style: 'rafter' },
  { id: 'rafter-2-crumble', x: 1890, y: 470, w: 215, h: 16, oneWay: true, style: 'bridge', crumbling: true },
  { id: 'ground-2b', x: 1490, y: R1_FLOOR, w: 540, h: 220, style: 'stone' },
  { id: 'plat-2c', x: 1640, y: 784, w: 150, h: 18, oneWay: true, style: 'bridge' },
  { id: 'plat-2d', x: 1830, y: 716, w: 140, h: 18, oneWay: true, style: 'bridge' },

  { id: 'ground-3a', x: 2030, y: 810, w: 500, h: 270, style: 'stone' },
  { id: 'plat-3a', x: 2090, y: 728, w: 150, h: 18, oneWay: true, style: 'bridge' },
  { id: 'plat-3b', x: 2290, y: 658, w: 220, h: 18, oneWay: true, style: 'bridge' },
  { id: 'rafter-3', x: 2150, y: 495, w: 260, h: 20, oneWay: true, style: 'rafter' },
  { id: 'rafter-3-crumble', x: 2435, y: 485, w: 180, h: 16, oneWay: true, style: 'bridge', crumbling: true },
  { id: 'rafter-3-hi', x: 2640, y: 485, w: 230, h: 20, oneWay: true, style: 'rafter' },
  { id: 'ground-3b', x: 2645, y: R1_FLOOR, w: 460, h: 220, style: 'stone' },
  { id: 'plat-3c', x: 2740, y: 776, w: 160, h: 18, oneWay: true, style: 'bridge' },

  { id: 'pillar-4a', x: 3205, y: 770, w: 110, h: 310, style: 'pillar' },
  { id: 'rafter-4', x: 3250, y: 590, w: 170, h: 20, oneWay: true, style: 'rafter' },

  { id: 'boss-floor', x: 3420, y: R1_FLOOR, w: 900, h: 220, style: 'boss_floor' },
  { id: 'boss-plat-l', x: 3550, y: 776, w: 130, h: 18, oneWay: true, style: 'bridge' },
  { id: 'boss-plat-r', x: 3960, y: 776, w: 130, h: 18, oneWay: true, style: 'bridge' },
  { id: 'boss-rafter', x: 3740, y: 605, w: 180, h: 20, oneWay: true, style: 'rafter' },
  { id: 'boss-rafter-hi-l', x: 3495, y: 510, w: 145, h: 18, oneWay: true, style: 'rafter' },
  { id: 'boss-rafter-hi-r', x: 4010, y: 510, w: 145, h: 18, oneWay: true, style: 'rafter' },
];

const ROOM_1_TORCHES: TorchProp[] = [
  { x: 140, y: 750, phase: 0.2 },
  { x: 420, y: 750, phase: 1.5 },
  { x: 760, y: 750, phase: 2.9 },
  { x: 1210, y: 750, phase: 0.8 },
  { x: 1680, y: 750, phase: 2.1 },
  { x: 2180, y: 700, phase: 3.7 },
  { x: 2440, y: 700, phase: 1.1 },
  { x: 2820, y: 750, phase: 4.2 },
  { x: 3560, y: 735, phase: 0.5 },
  { x: 3860, y: 735, phase: 1.9 },
  { x: 4160, y: 735, phase: 3.3 },
];

const ROOM_1_INTERACTABLES: Interactable[] = [
  { id: 'r1-brazier', kind: 'brazier', x: 210, y: R1_FLOOR, label: 'Light Brazier (+2 MP)', used: false },
  { id: 'r1-chest-1', kind: 'chest', x: 615, y: 545, label: 'Open High Chest (+Potion & Shards)', used: false },
  { id: 'r1-chest-hi', kind: 'chest', x: 1735, y: 450, label: 'High-Road Relic Cache (+Shards & XP)', used: false },
  { id: 'r1-altar', kind: 'upgrade_altar', x: 1580, y: R1_FLOOR, label: 'Claim Relic Blessing (Choose 1 of 3)', used: false },
  { id: 'r1-chest-2', kind: 'chest', x: 2280, y: 495, label: 'Open Gallery Chest (+Potion & Shards)', used: false },
  { id: 'r1-fountain', kind: 'fountain', x: 3485, y: R1_FLOOR, label: 'Sanctum Font (+2 HP / +2 MP)', used: false },
  { id: 'r1-door', kind: 'exit_door', x: 4225, y: R1_FLOOR, label: 'Enter Room 2 · Clockwork Belfry', used: false, locked: true },
];

const ROOM_1_HIDING: HidingSpot[] = [
  { id: 'r1-hide-1', x: 350, y: R1_FLOOR, w: 66, h: 96, kind: 'alcove' },
  { id: 'r1-hide-2', x: 1620, y: R1_FLOOR, w: 66, h: 96, kind: 'curtain' },
  { id: 'r1-hide-3', x: 2130, y: 810, w: 66, h: 96, kind: 'alcove' },
  { id: 'r1-hide-4', x: 2730, y: R1_FLOOR, w: 66, h: 96, kind: 'curtain' },
];

const ROOM_1_SPAWNS: EnemySpawn[] = [
  { type: 'ghoul', x: 600, y: R1_FLOOR, facing: -1, patrolRadius: 95, customHp: 2 },
  { type: 'skeleton', x: 925, y: 445, facing: -1, patrolRadius: 55, customHp: 2 },
  { type: 'bat', x: 840, y: 615, facing: -1, patrolRadius: 130, customHp: 1 },
  { type: 'skeleton', x: 1280, y: R1_FLOOR, facing: -1, patrolRadius: 85, customHp: 2 },
  { type: 'ghoul', x: 1740, y: R1_FLOOR, facing: -1, patrolRadius: 100, customHp: 2 },
  { type: 'skeleton', x: 1715, y: 450, facing: -1, patrolRadius: 65, customHp: 2 },
  { type: 'bat', x: 2180, y: 605, facing: -1, patrolRadius: 145, customHp: 2 },
  { type: 'skeleton', x: 2420, y: 658, facing: -1, patrolRadius: 60, customHp: 2 },
  { type: 'skeleton', x: 2755, y: 485, facing: -1, patrolRadius: 65, customHp: 2 },
  { type: 'knight', x: 2880, y: R1_FLOOR, facing: -1, patrolRadius: 95, customHp: 3 },
  {
    type: 'boss_vampire_duelist',
    x: 4000,
    y: R1_FLOOR,
    facing: -1,
    patrolRadius: 240,
    customName: 'Baron Bloodfang',
    customHp: 15,
  },
];

// ROOM 2 / 4: CLOCKWORK BELFRY
const R2_FLOOR = 860;
const R2_WIDTH = 4400;
const R2_HEIGHT = 1080;

const ROOM_2_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: R2_HEIGHT, style: 'pillar' },
  { id: 'wall-right', x: R2_WIDTH, y: 0, w: 40, h: R2_HEIGHT, style: 'pillar' },

  { id: 's2-g1', x: 0, y: R2_FLOOR, w: 720, h: 220, style: 'stone' },
  { id: 's2-p1', x: 280, y: 780, w: 150, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-p2', x: 490, y: 705, w: 160, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-r1', x: 560, y: 530, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 's2-pil1', x: 830, y: 760, w: 140, h: 320, style: 'pillar' },
  { id: 's2-pil2', x: 1080, y: 700, w: 150, h: 380, style: 'pillar' },
  { id: 's2-r2', x: 960, y: 540, w: 220, h: 20, oneWay: true, style: 'rafter' },
  { id: 's2-g2', x: 1340, y: R2_FLOOR, w: 680, h: 220, style: 'stone' },
  { id: 's2-p3', x: 1470, y: 775, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-p4', x: 1710, y: 700, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-r3', x: 1580, y: 520, w: 240, h: 20, oneWay: true, style: 'rafter' },

  { id: 's2-g3', x: 2130, y: 790, w: 580, h: 290, style: 'stone' },
  { id: 's2-p5', x: 2210, y: 705, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-p6', x: 2460, y: 635, w: 180, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-r4', x: 2320, y: 470, w: 250, h: 20, oneWay: true, style: 'rafter' },

  { id: 's2-pil3', x: 2820, y: 780, w: 130, h: 300, style: 'pillar' },
  { id: 's2-r5-crumble', x: 2590, y: 475, w: 165, h: 16, oneWay: true, style: 'bridge', crumbling: true },
  { id: 's2-r5-hi', x: 2780, y: 475, w: 240, h: 20, oneWay: true, style: 'rafter' },
  { id: 's2-r6-hi', x: 1230, y: 410, w: 210, h: 20, oneWay: true, style: 'rafter' },
  { id: 's2-r6-crumble', x: 1470, y: 445, w: 155, h: 16, oneWay: true, style: 'bridge', crumbling: true },
  { id: 's2-g4', x: 3060, y: R2_FLOOR, w: 320, h: 220, style: 'stone' },

  { id: 's2-boss', x: 3490, y: R2_FLOOR, w: 910, h: 220, style: 'boss_floor' },
  { id: 's2-bp1', x: 3630, y: 770, w: 140, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-bp2', x: 4040, y: 770, w: 140, h: 18, oneWay: true, style: 'bridge' },
  { id: 's2-br', x: 3820, y: 590, w: 200, h: 20, oneWay: true, style: 'rafter' },
  { id: 's2-br-hi', x: 3590, y: 485, w: 160, h: 18, oneWay: true, style: 'rafter' },
];

const ROOM_2_TORCHES: TorchProp[] = [
  { x: 160, y: 750, phase: 0.4 },
  { x: 520, y: 620, phase: 1.9 },
  { x: 900, y: 660, phase: 2.6 },
  { x: 1420, y: 750, phase: 0.9 },
  { x: 1860, y: 750, phase: 3.1 },
  { x: 2240, y: 680, phase: 1.4 },
  { x: 2560, y: 680, phase: 4.0 },
  { x: 3180, y: 750, phase: 2.2 },
  { x: 3640, y: 735, phase: 0.7 },
  { x: 3940, y: 735, phase: 2.4 },
  { x: 4250, y: 735, phase: 3.8 },
];

const ROOM_2_INTERACTABLES: Interactable[] = [
  { id: 'r2-brazier', kind: 'brazier', x: 210, y: R2_FLOOR, label: 'Clock Brazier (+2 MP)', used: false },
  { id: 'r2-chest1', kind: 'chest', x: 670, y: 530, label: 'Belfry Chest (+Potion & Shards)', used: false },
  { id: 'r2-chest-hi', kind: 'chest', x: 1335, y: 410, label: 'High-Road Relic Cache (+Shards & XP)', used: false },
  { id: 'r2-altar', kind: 'upgrade_altar', x: 1690, y: R2_FLOOR, label: 'Belfry Relic (Choose 1 of 3)', used: false },
  { id: 'r2-shrine', kind: 'shrine', x: 2440, y: 470, label: 'Flame Gear Shrine (Ignite Weapon)', used: false },
  { id: 'r2-font', kind: 'fountain', x: 3560, y: R2_FLOOR, label: 'Belfry Font (+2 HP / +2 MP)', used: false },
  { id: 'r2-door', kind: 'exit_door', x: 4305, y: R2_FLOOR, label: 'Enter Room 3 · Hanging Nave', used: false, locked: true },
];

const ROOM_2_HIDING: HidingSpot[] = [
  { id: 'r2-hide-1', x: 340, y: R2_FLOOR, w: 66, h: 96, kind: 'curtain' },
  { id: 'r2-hide-2', x: 1405, y: R2_FLOOR, w: 66, h: 96, kind: 'alcove' },
  { id: 'r2-hide-3', x: 2180, y: 790, w: 66, h: 96, kind: 'curtain' },
  { id: 'r2-hide-4', x: 3110, y: R2_FLOOR, w: 66, h: 96, kind: 'alcove' },
];

const ROOM_2_SPAWNS: EnemySpawn[] = [
  { type: 'skeleton', x: 560, y: R2_FLOOR, facing: -1, patrolRadius: 95 },
  { type: 'bat', x: 760, y: 600, facing: -1, patrolRadius: 170 },
  { type: 'skeleton', x: 1155, y: 700, facing: -1, patrolRadius: 45 },
  { type: 'skeleton', x: 1335, y: 410, facing: -1, patrolRadius: 55 },
  { type: 'knight', x: 1580, y: R2_FLOOR, facing: 1, patrolRadius: 120 },
  { type: 'ghoul', x: 1900, y: R2_FLOOR, facing: -1, patrolRadius: 90 },
  { type: 'bat', x: 1980, y: 590, facing: -1, patrolRadius: 180 },
  { type: 'knight', x: 2360, y: 790, facing: 1, patrolRadius: 145 },
  { type: 'skeleton', x: 2540, y: 635, facing: -1, patrolRadius: 65 },
  { type: 'skeleton', x: 2895, y: 475, facing: -1, patrolRadius: 75 },
  { type: 'bat', x: 2780, y: 610, facing: -1, patrolRadius: 170 },
  { type: 'knight', x: 3250, y: R2_FLOOR, facing: -1, patrolRadius: 90 },
  {
    type: 'boss_colossus',
    x: 4090,
    y: R2_FLOOR,
    facing: -1,
    patrolRadius: 240,
    customName: 'Clockwork Colossus',
    customHp: 20,
  },
];

// ROOM 3 / 4: HANGING NAVE
const R3_FLOOR = 860;
const R3_WIDTH = 3760;
const R3_HEIGHT = 1080;

const ROOM_3_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: R3_HEIGHT, style: 'pillar' },
  { id: 'wall-right', x: R3_WIDTH, y: 0, w: 40, h: R3_HEIGHT, style: 'pillar' },

  { id: 'r3-g1', x: 0, y: R3_FLOOR, w: 780, h: 220, style: 'stone' },
  { id: 'r3-p1', x: 290, y: 775, w: 155, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-p2', x: 520, y: 690, w: 175, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-r1', x: 420, y: 520, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 'r3-pil1', x: 890, y: 770, w: 140, h: 310, style: 'pillar' },
  { id: 'r3-pil2', x: 1140, y: 715, w: 150, h: 365, style: 'pillar' },
  { id: 'r3-r2', x: 1020, y: 540, w: 230, h: 20, oneWay: true, style: 'rafter' },

  { id: 'r3-g2', x: 1410, y: R3_FLOOR, w: 740, h: 220, style: 'stone' },
  { id: 'r3-p3', x: 1560, y: 775, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-p4', x: 1830, y: 695, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-r3', x: 1700, y: 515, w: 230, h: 20, oneWay: true, style: 'rafter' },

  { id: 'r3-g3', x: 2270, y: 815, w: 460, h: 265, style: 'stone' },
  { id: 'r3-p5', x: 2390, y: 730, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-r4-hi', x: 2340, y: 515, w: 230, h: 20, oneWay: true, style: 'rafter' },
  { id: 'r3-r5-hi', x: 750, y: 430, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 'r3-boss', x: 2850, y: R3_FLOOR, w: 910, h: 220, style: 'boss_floor' },
  { id: 'r3-bp1', x: 3000, y: 770, w: 145, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-bp2', x: 3410, y: 770, w: 145, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r3-br', x: 3190, y: 610, w: 200, h: 20, oneWay: true, style: 'rafter' },
  { id: 'r3-br-hi', x: 3190, y: 465, w: 190, h: 18, oneWay: true, style: 'rafter' },
];

const ROOM_3_TORCHES: TorchProp[] = [
  { x: 160, y: 750, phase: 0.2 },
  { x: 540, y: 750, phase: 1.4 },
  { x: 960, y: 670, phase: 2.7 },
  { x: 1520, y: 750, phase: 0.8 },
  { x: 1960, y: 750, phase: 3.1 },
  { x: 2420, y: 705, phase: 1.6 },
  { x: 3010, y: 735, phase: 0.9 },
  { x: 3320, y: 735, phase: 2.2 },
  { x: 3610, y: 735, phase: 3.6 },
];

const ROOM_3_INTERACTABLES: Interactable[] = [
  { id: 'r3-brazier', kind: 'brazier', x: 210, y: R3_FLOOR, label: 'Nave Brazier (+2 MP)', used: false },
  { id: 'r3-chest1', kind: 'chest', x: 530, y: 520, label: 'Nave Chest (+Potion & Shards)', used: false },
  { id: 'r3-altar', kind: 'upgrade_altar', x: 1760, y: R3_FLOOR, label: 'Nave Relic (Choose 1 of 3)', used: false },
  { id: 'r3-font', kind: 'fountain', x: 2920, y: R3_FLOOR, label: 'Nave Font (+2 HP / +2 MP)', used: false },
  { id: 'r3-door', kind: 'exit_door', x: 3665, y: R3_FLOOR, label: 'Enter Room 4 · Crimson Sanctum', used: false, locked: true },
];

const ROOM_3_HIDING: HidingSpot[] = [
  { id: 'r3-hide-1', x: 350, y: R3_FLOOR, w: 66, h: 96, kind: 'alcove' },
  { id: 'r3-hide-2', x: 1470, y: R3_FLOOR, w: 66, h: 96, kind: 'curtain' },
  { id: 'r3-hide-3', x: 2330, y: 815, w: 66, h: 96, kind: 'alcove' },
];

const ROOM_3_SPAWNS: EnemySpawn[] = [
  { type: 'knight', x: 580, y: R3_FLOOR, facing: -1, patrolRadius: 100 },
  { type: 'bat', x: 840, y: 600, facing: -1, patrolRadius: 150 },
  { type: 'skeleton', x: 1210, y: 715, facing: -1, patrolRadius: 45 },
  { type: 'knight', x: 1620, y: R3_FLOOR, facing: 1, patrolRadius: 120 },
  { type: 'skeleton', x: 1980, y: R3_FLOOR, facing: -1, patrolRadius: 95 },
  { type: 'bat', x: 2150, y: 590, facing: -1, patrolRadius: 170 },
  { type: 'knight', x: 2560, y: 815, facing: -1, patrolRadius: 95 },
  {
    type: 'boss_malakor',
    x: 3440,
    y: 690,
    facing: -1,
    patrolRadius: 230,
    customName: 'Hollow Inquisitor',
    customHp: 23,
  },
];

// ROOM 4 / 4: CRIMSON SANCTUM
const R4_FLOOR = 860;
const R4_WIDTH = 4500;
const R4_HEIGHT = 1080;

const ROOM_4_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: R4_HEIGHT, style: 'pillar' },
  { id: 'wall-right', x: R4_WIDTH, y: 0, w: 40, h: R4_HEIGHT, style: 'pillar' },

  { id: 's3-g1', x: 0, y: R4_FLOOR, w: 860, h: 220, style: 'stone' },
  { id: 's3-p1', x: 310, y: 775, w: 160, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-p2', x: 560, y: 695, w: 180, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-r1', x: 430, y: 520, w: 230, h: 20, oneWay: true, style: 'rafter' },

  { id: 's3-g2', x: 980, y: 810, w: 620, h: 270, style: 'stone' },
  { id: 's3-p3', x: 1120, y: 725, w: 180, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-r2', x: 1240, y: 535, w: 250, h: 20, oneWay: true, style: 'rafter' },

  { id: 's3-pil1', x: 1715, y: 770, w: 125, h: 310, style: 'pillar' },
  { id: 's3-pil2', x: 1955, y: 710, w: 125, h: 370, style: 'pillar' },
  { id: 's3-r3', x: 1800, y: 550, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 's3-g3', x: 2195, y: R4_FLOOR, w: 660, h: 220, style: 'stone' },
  { id: 's3-p4', x: 2320, y: 775, w: 160, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-p5', x: 2560, y: 695, w: 170, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-r4', x: 2430, y: 510, w: 240, h: 20, oneWay: true, style: 'rafter' },

  { id: 's3-g4', x: 2970, y: 810, w: 460, h: 270, style: 'stone' },
  { id: 's3-p6', x: 3090, y: 720, w: 180, h: 18, oneWay: true, style: 'bridge' },

  { id: 's3-boss', x: 3550, y: R4_FLOOR, w: 950, h: 220, style: 'boss_floor' },
  { id: 's3-bp1', x: 3690, y: 770, w: 145, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-bp2', x: 4140, y: 770, w: 145, h: 18, oneWay: true, style: 'bridge' },
  { id: 's3-br1', x: 3900, y: 625, w: 200, h: 20, oneWay: true, style: 'rafter' },
];

const ROOM_4_TORCHES: TorchProp[] = [
  { x: 150, y: 750, phase: 0.3 },
  { x: 640, y: 750, phase: 1.8 },
  { x: 1140, y: 700, phase: 2.5 },
  { x: 1480, y: 700, phase: 0.9 },
  { x: 2300, y: 750, phase: 3.1 },
  { x: 2680, y: 750, phase: 1.2 },
  { x: 3180, y: 700, phase: 4.1 },
  { x: 3720, y: 735, phase: 0.6 },
  { x: 4000, y: 735, phase: 2.0 },
  { x: 4320, y: 735, phase: 3.4 },
];

const ROOM_4_INTERACTABLES: Interactable[] = [
  { id: 'r4-brazier', kind: 'brazier', x: 200, y: R4_FLOOR, label: 'Blood Brazier (+2 MP)', used: false },
  { id: 'r4-chest1', kind: 'chest', x: 540, y: 520, label: 'Cathedral Chest (+Potion & Shards)', used: false },
  { id: 'r4-altar', kind: 'upgrade_altar', x: 1320, y: 810, label: 'Cathedral Relic (Choose 1 of 3)', used: false },
  { id: 'r4-chest2', kind: 'chest', x: 2550, y: 510, label: 'Choir Loft Chest (+Potion & Shards)', used: false },
  { id: 'r4-font', kind: 'fountain', x: 3620, y: R4_FLOOR, label: 'Altar Font (+2 HP / +2 MP)', used: false },
  { id: 'r4-door', kind: 'exit_door', x: 4405, y: R4_FLOOR, label: 'Enter Throne of Nocturne (Big Boss)', used: false, locked: true },
];

const ROOM_4_HIDING: HidingSpot[] = [
  { id: 'r4-hide-1', x: 350, y: R4_FLOOR, w: 66, h: 96, kind: 'curtain' },
  { id: 'r4-hide-2', x: 1030, y: 810, w: 66, h: 96, kind: 'alcove' },
  { id: 'r4-hide-3', x: 2260, y: R4_FLOOR, w: 66, h: 96, kind: 'curtain' },
  { id: 'r4-hide-4', x: 3030, y: 810, w: 66, h: 96, kind: 'alcove' },
];

const ROOM_4_SPAWNS: EnemySpawn[] = [
  { type: 'knight', x: 610, y: R4_FLOOR, facing: 1, patrolRadius: 120 },
  { type: 'bat', x: 790, y: 600, facing: -1, patrolRadius: 170 },
  { type: 'skeleton', x: 1180, y: 810, facing: -1, patrolRadius: 100 },
  { type: 'knight', x: 1460, y: 810, facing: -1, patrolRadius: 110 },
  { type: 'bat', x: 1840, y: 580, facing: -1, patrolRadius: 190 },
  { type: 'skeleton', x: 2015, y: 710, facing: -1, patrolRadius: 40 },
  { type: 'knight', x: 2450, y: R4_FLOOR, facing: 1, patrolRadius: 130 },
  { type: 'ghoul', x: 2720, y: R4_FLOOR, facing: -1, patrolRadius: 100 },
  { type: 'bat', x: 2910, y: 595, facing: -1, patrolRadius: 180 },
  { type: 'knight', x: 3250, y: 810, facing: -1, patrolRadius: 110 },
  {
    type: 'boss_gargoyle_king',
    x: 4160,
    y: 685,
    facing: -1,
    patrolRadius: 240,
    customName: 'Obsidian Gargoyle Lord',
    customHp: 28,
  },
];

// FINAL BOSS (ROOM 5): THRONE OF NOCTURNE — COLOSSAL BIG BOSS ONLY!
const R5_FLOOR = 860;
const R5_WIDTH = 1640;
const R5_HEIGHT = 1080;

const ROOM_5_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: R5_HEIGHT, style: 'pillar' },
  { id: 'wall-right', x: R5_WIDTH, y: 0, w: 40, h: R5_HEIGHT, style: 'pillar' },
  { id: 'r5-floor', x: 0, y: R5_FLOOR, w: R5_WIDTH, h: 220, style: 'boss_floor' },
  { id: 'r5-wall-l', x: 145, y: 695, w: 56, h: 165, style: 'pillar' },
  { id: 'r5-p1', x: 310, y: 760, w: 175, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r5-p2', x: 710, y: 680, w: 220, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r5-p3', x: 1150, y: 760, w: 175, h: 18, oneWay: true, style: 'bridge' },
  { id: 'r5-rafter', x: 685, y: 525, w: 270, h: 20, oneWay: true, style: 'rafter' },
  { id: 'r5-rafter-l', x: 325, y: 575, w: 185, h: 18, oneWay: true, style: 'rafter' },
  { id: 'r5-rafter-r', x: 1125, y: 575, w: 185, h: 18, oneWay: true, style: 'rafter' },
];

const ROOM_5_TORCHES: TorchProp[] = [
  { x: 180, y: 615, phase: 0.4 },
  { x: 480, y: 735, phase: 1.6 },
  { x: 820, y: 735, phase: 2.8 },
  { x: 1160, y: 735, phase: 1.1 },
  { x: 1450, y: 735, phase: 3.4 },
];

const ROOM_5_INTERACTABLES: Interactable[] = [
  { id: 'r5-door', kind: 'exit_door', x: 1545, y: R5_FLOOR, label: 'Return Victorious to Base Camp', used: false, locked: true },
];

const ROOM_5_SPAWNS: EnemySpawn[] = [
  {
    type: 'boss_valerius',
    x: 1210,
    y: R5_FLOOR,
    facing: -1,
    patrolRadius: 380,
    customName: 'Lord Valerius · Crimson Sovereign',
    customHp: 64,
    customScaleW: 76,
    customScaleH: 118,
    isBigBoss: true,
  },
];

export const NOCTURNE_RAID_ROOMS: StageDef[] = [
  {
    index: 0,
    roomNumber: 1,
    raidId: 'nocturne_castle',
    environment: 'castle',
    name: 'Room 1/4 · Outer Courtyard',
    bossName: 'Baron Bloodfang',
    worldWidth: R1_WIDTH,
    worldHeight: R1_HEIGHT,
    floorY: R1_FLOOR,
    bossZoneStartX: 3390,
    exitDoorX: 4225,
    theme: {
      // Room 1: Open-Air Moonlit Silver Courtyard (Cool Midnight Blue & Mist)
      skyTop: '#081326',
      skyBottom: '#1d3152',
      moonColor: '#eef4ff',
      parallaxColor: '#101d33',
      archColor: 'rgba(28, 42, 66, 0.58)',
      windowColor: 'rgba(147, 197, 253, 0.25)',
      stoneFill: '#242c3d',
      stoneTop: '#4c5d7d',
      bossFloorTop: '#7c2d3c',
    },
    platforms: ROOM_1_PLATFORMS,
    torches: ROOM_1_TORCHES,
    interactables: ROOM_1_INTERACTABLES,
    hidingSpots: ROOM_1_HIDING,
    createEnemies: (m = 1, f = 0) => buildEnemies(ROOM_1_SPAWNS, 0, m, f),
  },
  {
    index: 1,
    roomNumber: 2,
    raidId: 'nocturne_castle',
    environment: 'castle',
    name: 'Room 2/4 · Clockwork Belfry',
    bossName: 'Clockwork Colossus',
    worldWidth: R2_WIDTH,
    worldHeight: R2_HEIGHT,
    floorY: R2_FLOOR,
    bossZoneStartX: 3460,
    exitDoorX: 4305,
    theme: {
      // Room 2: Warm Brass & Amber Clocktower Interior
      skyTop: '#171008',
      skyBottom: '#332211',
      moonColor: '#fcd34d',
      parallaxColor: '#21160b',
      archColor: 'rgba(66, 44, 22, 0.72)',
      windowColor: 'rgba(245, 158, 11, 0.26)',
      stoneFill: '#33271d',
      stoneTop: '#785a3a',
      bossFloorTop: '#b45309',
    },
    platforms: ROOM_2_PLATFORMS,
    torches: ROOM_2_TORCHES,
    interactables: ROOM_2_INTERACTABLES,
    hidingSpots: ROOM_2_HIDING,
    createEnemies: (m = 1, f = 0) => buildEnemies(ROOM_2_SPAWNS, 0, m, f),
  },
  {
    index: 2,
    roomNumber: 3,
    raidId: 'nocturne_castle',
    environment: 'castle',
    name: 'Room 3/4 · Hanging Nave',
    bossName: 'Hollow Inquisitor',
    worldWidth: R3_WIDTH,
    worldHeight: R3_HEIGHT,
    floorY: R3_FLOOR,
    bossZoneStartX: 2820,
    exitDoorX: 3665,
    theme: {
      // Room 3: Royal Stained-Glass Cathedral (Deep Violet, Sapphire & Gold)
      skyTop: '#100a24',
      skyBottom: '#28184d',
      moonColor: '#e9d5ff',
      parallaxColor: '#190f36',
      archColor: 'rgba(46, 28, 79, 0.72)',
      windowColor: 'rgba(139, 92, 246, 0.34)',
      stoneFill: '#281f3d',
      stoneTop: '#5e4687',
      bossFloorTop: '#9d2b6b',
    },
    platforms: ROOM_3_PLATFORMS,
    torches: ROOM_3_TORCHES,
    interactables: ROOM_3_INTERACTABLES,
    hidingSpots: ROOM_3_HIDING,
    createEnemies: (m = 1, f = 0) => buildEnemies(ROOM_3_SPAWNS, 1, m, f),
  },
  {
    index: 3,
    roomNumber: 4,
    raidId: 'nocturne_castle',
    environment: 'castle',
    name: 'Room 4/4 · Crimson Sanctum',
    bossName: 'Obsidian Gargoyle Lord',
    worldWidth: R4_WIDTH,
    worldHeight: R4_HEIGHT,
    floorY: R4_FLOOR,
    bossZoneStartX: 3520,
    exitDoorX: 4405,
    theme: {
      // Room 4: Blood-Moon Candlelit Crypt & Velvet Banners
      skyTop: '#1c060c',
      skyBottom: '#40111f',
      moonColor: '#fb7185',
      parallaxColor: '#290a13',
      archColor: 'rgba(69, 18, 31, 0.72)',
      windowColor: 'rgba(225, 29, 72, 0.34)',
      stoneFill: '#331c24',
      stoneTop: '#782d42',
      bossFloorTop: '#be123c',
    },
    platforms: ROOM_4_PLATFORMS,
    torches: ROOM_4_TORCHES,
    interactables: ROOM_4_INTERACTABLES,
    hidingSpots: ROOM_4_HIDING,
    createEnemies: (m = 1, f = 0) => buildEnemies(ROOM_4_SPAWNS, 2, m, f),
  },
  {
    index: 4,
    roomNumber: 5,
    raidId: 'nocturne_castle',
    environment: 'castle',
    isBigBossRoom: true,
    name: 'Final Boss · Throne of Nocturne',
    bossName: 'Lord Valerius · Crimson Sovereign',
    worldWidth: R5_WIDTH,
    worldHeight: R5_HEIGHT,
    floorY: R5_FLOOR,
    bossZoneStartX: 160,
    exitDoorX: 1545,
    theme: {
      // Room 5: Colossal Blood-Moon Sovereign Throne Room
      skyTop: '#1a0409',
      skyBottom: '#420c1a',
      moonColor: '#ff3b5c',
      parallaxColor: '#260710',
      archColor: 'rgba(64, 15, 28, 0.75)',
      windowColor: 'rgba(220, 38, 38, 0.42)',
      stoneFill: '#2f151e',
      stoneTop: '#882036',
      bossFloorTop: '#dc2626',
    },
    platforms: ROOM_5_PLATFORMS,
    torches: ROOM_5_TORCHES,
    interactables: ROOM_5_INTERACTABLES,
    hidingSpots: [],
    createEnemies: (m = 1, f = 0) => buildEnemies(ROOM_5_SPAWNS, 0, m, f),
  },
];

// ============================================================================
// RAID 2: GOBLIN WAR-CAMP (4 Rooms with Mini-Bosses + 1 Final Big Boss Room)
// Features all 5 Goblin types + 3 distinct Goblin Bosses + Palisade Wall-Cling Towers!
// ============================================================================
const G_FLOOR = 860;
const G_HEIGHT = 1080;

// GOBLIN ROOM 1/4: OUTSKIRTS STOCKADE — Mini-Boss: Skritch the Knife-Chief
const G1_WIDTH = 3980;
const G1_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },
  { id: 'wall-right', x: G1_WIDTH, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },

  { id: 'g1-f1', x: 0, y: G_FLOOR, w: 940, h: 220, style: 'stone' },
  { id: 'g1-t1', x: 310, y: 772, w: 160, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-tower1', x: 560, y: 715, w: 92, h: 145, style: 'palisade' },
  { id: 'g1-t2', x: 675, y: 660, w: 180, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-r1', x: 510, y: 525, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g1-f2', x: 1060, y: 815, w: 840, h: 265, style: 'stone' },
  { id: 'g1-t3', x: 1180, y: 730, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-tower2', x: 1465, y: 670, w: 96, h: 145, style: 'palisade' },
  { id: 'g1-t4', x: 1610, y: 675, w: 180, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-r2', x: 1380, y: 500, w: 240, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g1-pil', x: 2015, y: 760, w: 120, h: 320, style: 'palisade' },
  { id: 'g1-f3', x: 2250, y: G_FLOOR, w: 720, h: 220, style: 'stone' },
  { id: 'g1-t5', x: 2410, y: 770, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-t6', x: 2660, y: 695, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-r3-hi', x: 2490, y: 515, w: 240, h: 20, oneWay: true, style: 'rafter' },
  { id: 'g1-r4-hi', x: 960, y: 455, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g1-boss', x: 3080, y: G_FLOOR, w: 900, h: 220, style: 'boss_floor' },
  { id: 'g1-bp1', x: 3230, y: 770, w: 140, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-bp2', x: 3630, y: 770, w: 140, h: 18, oneWay: true, style: 'timber' },
  { id: 'g1-br', x: 3410, y: 605, w: 190, h: 20, oneWay: true, style: 'rafter' },
  { id: 'g1-br-hi', x: 3410, y: 470, w: 180, h: 18, oneWay: true, style: 'rafter' },
];

const G1_SPAWNS: EnemySpawn[] = [
  { type: 'goblin_grunt', x: 510, y: G_FLOOR, facing: -1, patrolRadius: 90, customHp: 2 },
  { type: 'goblin_archer', x: 760, y: 660, facing: -1, patrolRadius: 50, customHp: 2 },
  { type: 'goblin_bomber', x: 1320, y: 815, facing: -1, patrolRadius: 80, customHp: 2 },
  { type: 'goblin_grunt', x: 1740, y: 815, facing: -1, patrolRadius: 90, customHp: 2 },
  { type: 'goblin_archer', x: 2740, y: 695, facing: -1, patrolRadius: 55, customHp: 2 },
  { type: 'goblin_brute', x: 2560, y: G_FLOOR, facing: -1, patrolRadius: 95, customHp: 4 },
  {
    type: 'boss_goblin_chief',
    x: 3660,
    y: G_FLOOR,
    facing: -1,
    patrolRadius: 240,
    customName: 'Skritch the Knife-Chief',
    customHp: 13,
  },
];

// GOBLIN ROOM 2/4: SAPPER POWDER PITS — Mini-Boss: Bombo the Mad Sapper
const G2_WIDTH = 4080;
const G2_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },
  { id: 'wall-right', x: G2_WIDTH, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },

  { id: 'g2-f1', x: 0, y: G_FLOOR, w: 780, h: 220, style: 'stone' },
  { id: 'g2-t1', x: 290, y: 775, w: 160, h: 18, oneWay: true, style: 'timber' },
  { id: 'g2-t2', x: 520, y: 695, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g2-r1', x: 430, y: 525, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g2-pil1', x: 900, y: 745, w: 125, h: 335, style: 'palisade' },
  { id: 'g2-pil2', x: 1140, y: 690, w: 125, h: 390, style: 'palisade' },
  { id: 'g2-r2', x: 1000, y: 525, w: 230, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g2-f2', x: 1385, y: G_FLOOR, w: 820, h: 220, style: 'stone' },
  { id: 'g2-tower1', x: 1660, y: 720, w: 88, h: 140, style: 'palisade' },
  { id: 'g2-t3', x: 1820, y: 760, w: 175, h: 18, oneWay: true, style: 'timber' },
  { id: 'g2-r3', x: 1640, y: 515, w: 240, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g2-f3', x: 2320, y: 805, w: 740, h: 275, style: 'stone' },
  { id: 'g2-t4', x: 2480, y: 715, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g2-t5', x: 2740, y: 645, w: 175, h: 18, oneWay: true, style: 'timber' },

  { id: 'g2-boss', x: 3170, y: G_FLOOR, w: 910, h: 220, style: 'boss_floor' },
  { id: 'g2-bp1', x: 3320, y: 770, w: 145, h: 18, oneWay: true, style: 'timber' },
  { id: 'g2-bp2', x: 3730, y: 770, w: 145, h: 18, oneWay: true, style: 'timber' },
  { id: 'g2-br', x: 3510, y: 600, w: 195, h: 20, oneWay: true, style: 'rafter' },
];

const G2_SPAWNS: EnemySpawn[] = [
  { type: 'goblin_bomber', x: 560, y: G_FLOOR, facing: -1, patrolRadius: 95 },
  { type: 'goblin_archer', x: 610, y: 695, facing: -1, patrolRadius: 55 },
  { type: 'goblin_shaman', x: 1080, y: 600, facing: -1, patrolRadius: 120 },
  { type: 'goblin_grunt', x: 1520, y: G_FLOOR, facing: -1, patrolRadius: 90 },
  { type: 'goblin_brute', x: 1950, y: G_FLOOR, facing: -1, patrolRadius: 110 },
  { type: 'goblin_bomber', x: 1900, y: 760, facing: -1, patrolRadius: 65 },
  { type: 'goblin_shaman', x: 2560, y: 620, facing: -1, patrolRadius: 120 },
  { type: 'goblin_grunt', x: 2720, y: 805, facing: -1, patrolRadius: 110 },
  { type: 'goblin_archer', x: 2820, y: 645, facing: -1, patrolRadius: 65 },
  {
    type: 'boss_goblin_sapper',
    x: 3760,
    y: G_FLOOR,
    facing: -1,
    patrolRadius: 240,
    customName: 'Bombo the Mad Sapper',
    customHp: 21,
  },
];

// GOBLIN ROOM 3/4: TOTEM BOG HOLLOW — Mini-Boss: Hex-Lord Zog
const G3_WIDTH = 4120;
const G3_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },
  { id: 'wall-right', x: G3_WIDTH, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },

  { id: 'g3-f1', x: 0, y: G_FLOOR, w: 820, h: 220, style: 'stone' },
  { id: 'g3-t1', x: 310, y: 772, w: 165, h: 18, oneWay: true, style: 'timber' },
  { id: 'g3-t2', x: 560, y: 690, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g3-r1', x: 450, y: 520, w: 220, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g3-f2', x: 940, y: 810, w: 720, h: 270, style: 'stone' },
  { id: 'g3-tower1', x: 1230, y: 685, w: 95, h: 125, style: 'palisade' },
  { id: 'g3-t3', x: 1410, y: 715, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g3-r2', x: 1220, y: 515, w: 240, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g3-pil1', x: 1785, y: 760, w: 130, h: 320, style: 'palisade' },
  { id: 'g3-pil2', x: 2030, y: 705, w: 130, h: 375, style: 'palisade' },
  { id: 'g3-f3', x: 2280, y: G_FLOOR, w: 800, h: 220, style: 'stone' },
  { id: 'g3-t4', x: 2430, y: 775, w: 170, h: 18, oneWay: true, style: 'timber' },
  { id: 'g3-t5', x: 2700, y: 695, w: 170, h: 18, oneWay: true, style: 'timber' },

  { id: 'g3-boss', x: 3200, y: G_FLOOR, w: 920, h: 220, style: 'boss_floor' },
  { id: 'g3-bp1', x: 3350, y: 770, w: 145, h: 18, oneWay: true, style: 'timber' },
  { id: 'g3-bp2', x: 3760, y: 770, w: 145, h: 18, oneWay: true, style: 'timber' },
  { id: 'g3-br', x: 3530, y: 600, w: 200, h: 20, oneWay: true, style: 'rafter' },
];

const G3_SPAWNS: EnemySpawn[] = [
  { type: 'goblin_shaman', x: 640, y: 620, facing: -1, patrolRadius: 120 },
  { type: 'goblin_grunt', x: 560, y: G_FLOOR, facing: -1, patrolRadius: 100 },
  { type: 'goblin_brute', x: 1120, y: 810, facing: -1, patrolRadius: 95 },
  { type: 'goblin_bomber', x: 1490, y: 715, facing: -1, patrolRadius: 65 },
  { type: 'goblin_shaman', x: 1920, y: 600, facing: -1, patrolRadius: 130 },
  { type: 'goblin_archer', x: 2095, y: 705, facing: -1, patrolRadius: 45 },
  { type: 'goblin_brute', x: 2560, y: G_FLOOR, facing: -1, patrolRadius: 120 },
  { type: 'goblin_bomber', x: 2780, y: 695, facing: -1, patrolRadius: 60 },
  { type: 'goblin_grunt', x: 2940, y: G_FLOOR, facing: -1, patrolRadius: 90 },
  {
    type: 'boss_goblin_shaman',
    x: 3800,
    y: 690,
    facing: -1,
    patrolRadius: 240,
    customName: 'Hex-Lord Zog',
    customHp: 24,
  },
];

// GOBLIN ROOM 4/4: WAR-BEAST PALISADE — Mini-Boss: Grimjaw the Ironjaw
const G4_WIDTH = 4240;
const G4_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },
  { id: 'wall-right', x: G4_WIDTH, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },

  { id: 'g4-f1', x: 0, y: G_FLOOR, w: 840, h: 220, style: 'stone' },
  { id: 'g4-tower1', x: 420, y: 710, w: 94, h: 150, style: 'palisade' },
  { id: 'g4-t1', x: 560, y: 700, w: 180, h: 18, oneWay: true, style: 'timber' },
  { id: 'g4-r1', x: 430, y: 525, w: 230, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g4-f2', x: 960, y: 805, w: 780, h: 275, style: 'stone' },
  { id: 'g4-t2', x: 1120, y: 720, w: 175, h: 18, oneWay: true, style: 'timber' },
  { id: 'g4-t3', x: 1410, y: 660, w: 180, h: 18, oneWay: true, style: 'timber' },
  { id: 'g4-r2', x: 1260, y: 500, w: 240, h: 20, oneWay: true, style: 'rafter' },

  { id: 'g4-pil1', x: 1860, y: 745, w: 130, h: 335, style: 'palisade' },
  { id: 'g4-pil2', x: 2110, y: 695, w: 130, h: 385, style: 'palisade' },
  { id: 'g4-f3', x: 2360, y: G_FLOOR, w: 840, h: 220, style: 'stone' },
  { id: 'g4-tower2', x: 2660, y: 720, w: 94, h: 140, style: 'palisade' },
  { id: 'g4-t4', x: 2820, y: 745, w: 175, h: 18, oneWay: true, style: 'timber' },

  { id: 'g4-boss', x: 3310, y: G_FLOOR, w: 930, h: 220, style: 'boss_floor' },
  { id: 'g4-bp1', x: 3460, y: 770, w: 145, h: 18, oneWay: true, style: 'timber' },
  { id: 'g4-bp2', x: 3890, y: 770, w: 145, h: 18, oneWay: true, style: 'timber' },
  { id: 'g4-br', x: 3655, y: 605, w: 200, h: 20, oneWay: true, style: 'rafter' },
];

const G4_SPAWNS: EnemySpawn[] = [
  { type: 'goblin_grunt', x: 330, y: G_FLOOR, facing: -1, patrolRadius: 90 },
  { type: 'goblin_archer', x: 640, y: 700, facing: -1, patrolRadius: 60 },
  { type: 'goblin_brute', x: 1180, y: 805, facing: -1, patrolRadius: 110 },
  { type: 'goblin_bomber', x: 1500, y: 660, facing: -1, patrolRadius: 65 },
  { type: 'goblin_shaman', x: 1620, y: 615, facing: -1, patrolRadius: 120 },
  { type: 'goblin_archer', x: 2175, y: 695, facing: -1, patrolRadius: 45 },
  { type: 'goblin_grunt', x: 2510, y: G_FLOOR, facing: -1, patrolRadius: 95 },
  { type: 'goblin_brute', x: 2940, y: G_FLOOR, facing: -1, patrolRadius: 115 },
  { type: 'goblin_shaman', x: 3020, y: 640, facing: -1, patrolRadius: 120 },
  {
    type: 'boss_goblin_behemoth',
    x: 3920,
    y: G_FLOOR,
    facing: -1,
    patrolRadius: 240,
    customName: 'Grimjaw the Siege-Hulk',
    customHp: 30,
  },
];

// GOBLIN FINAL BOSS (ROOM 5): WARCHIEF'S BONE THRONE — COLOSSAL BIG BOSS ONLY!
const G5_WIDTH = 1660;
const G5_PLATFORMS: Platform[] = [
  { id: 'wall-left', x: -40, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },
  { id: 'wall-right', x: G5_WIDTH, y: 0, w: 40, h: G_HEIGHT, style: 'palisade' },
  { id: 'g5-floor', x: 0, y: G_FLOOR, w: G5_WIDTH, h: 220, style: 'boss_floor' },
  { id: 'g5-tower-l', x: 145, y: 695, w: 60, h: 165, style: 'palisade' },
  { id: 'g5-p1', x: 315, y: 760, w: 175, h: 18, oneWay: true, style: 'timber' },
  { id: 'g5-p2', x: 720, y: 680, w: 220, h: 18, oneWay: true, style: 'timber' },
  { id: 'g5-p3', x: 1170, y: 760, w: 175, h: 18, oneWay: true, style: 'timber' },
  { id: 'g5-rafter', x: 695, y: 525, w: 270, h: 20, oneWay: true, style: 'rafter' },
];

const G5_SPAWNS: EnemySpawn[] = [
  {
    type: 'boss_goblin_warlord',
    x: 1230,
    y: G_FLOOR,
    facing: -1,
    patrolRadius: 380,
    customName: 'Warchief Kragmash · Goblin King',
    customHp: 68,
    customScaleW: 84,
    customScaleH: 124,
    isBigBoss: true,
  },
];

export const GOBLIN_RAID_ROOMS: StageDef[] = [
  {
    index: 0,
    roomNumber: 1,
    raidId: 'goblin_camp',
    environment: 'goblin_camp',
    name: 'Room 1/4 · Outskirts Stockade',
    bossName: 'Skritch the Knife-Chief',
    worldWidth: G1_WIDTH,
    worldHeight: G_HEIGHT,
    floorY: G_FLOOR,
    bossZoneStartX: 3050,
    exitDoorX: 3890,
    theme: {
      // Goblin Room 1: Open Moonlit Pine Forest Stockade
      skyTop: '#091a12',
      skyBottom: '#1c3d2c',
      moonColor: '#dcfce7',
      parallaxColor: '#10291c',
      archColor: 'rgba(30, 56, 38, 0.65)',
      windowColor: 'rgba(74, 222, 128, 0.28)',
      stoneFill: '#243021',
      stoneTop: '#4e6b3d',
      bossFloorTop: '#854d0e',
    },
    platforms: G1_PLATFORMS,
    torches: [
      { x: 150, y: 750, phase: 0.3 },
      { x: 605, y: 635, phase: 1.5 },
      { x: 1190, y: 705, phase: 2.8 },
      { x: 1510, y: 590, phase: 0.9 },
      { x: 2380, y: 750, phase: 2.1 },
      { x: 3220, y: 735, phase: 0.6 },
      { x: 3530, y: 735, phase: 1.9 },
      { x: 3820, y: 735, phase: 3.4 },
    ],
    interactables: [
      { id: 'g1-brazier', kind: 'brazier', x: 205, y: G_FLOOR, label: 'Camp Bonfire (+2 MP)', used: false },
      { id: 'g1-chest1', kind: 'chest', x: 620, y: 525, label: 'Watchtower Chest (+Potion & Shards)', used: false },
      { id: 'g1-altar', kind: 'upgrade_altar', x: 1320, y: 815, label: 'Forest Totem (Choose 1 of 3)', used: false },
      { id: 'g1-font', kind: 'fountain', x: 3145, y: G_FLOOR, label: 'Spring Basin (+2 HP / +2 MP)', used: false },
      { id: 'g1-door', kind: 'exit_door', x: 3890, y: G_FLOOR, label: 'Enter Room 2 · Sapper Powder Pits', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'g1-hide-1', x: 350, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: 'g1-hide-2', x: 1120, y: 815, w: 66, h: 96, kind: 'alcove' },
      { id: 'g1-hide-3', x: 2320, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(G1_SPAWNS, 0, m, f),
  },
  {
    index: 1,
    roomNumber: 2,
    raidId: 'goblin_camp',
    environment: 'goblin_camp',
    name: 'Room 2/4 · Sapper Powder Pits',
    bossName: 'Bombo the Mad Sapper',
    worldWidth: G2_WIDTH,
    worldHeight: G_HEIGHT,
    floorY: G_FLOOR,
    bossZoneStartX: 3140,
    exitDoorX: 3985,
    theme: {
      // Goblin Room 2: Smoky Ember-Lit Quarry & Powder Scaffolding
      skyTop: '#1a1107',
      skyBottom: '#3d2511',
      moonColor: '#fde68a',
      parallaxColor: '#26180a',
      archColor: 'rgba(66, 40, 18, 0.72)',
      windowColor: 'rgba(249, 115, 22, 0.34)',
      stoneFill: '#33261a',
      stoneTop: '#7a5934',
      bossFloorTop: '#c2410c',
    },
    platforms: G2_PLATFORMS,
    torches: [
      { x: 160, y: 750, phase: 0.4 },
      { x: 640, y: 750, phase: 1.7 },
      { x: 1200, y: 610, phase: 2.3 },
      { x: 1705, y: 640, phase: 1.0 },
      { x: 2560, y: 695, phase: 3.1 },
      { x: 3320, y: 735, phase: 0.8 },
      { x: 3630, y: 735, phase: 2.4 },
      { x: 3920, y: 735, phase: 3.9 },
    ],
    interactables: [
      { id: 'g2-brazier', kind: 'brazier', x: 210, y: G_FLOOR, label: 'Powder Brazier (+2 MP)', used: false },
      { id: 'g2-chest1', kind: 'chest', x: 540, y: 525, label: 'Sapper Stash (+Potion & Shards)', used: false },
      { id: 'g2-altar', kind: 'upgrade_altar', x: 1560, y: G_FLOOR, label: 'War Totem (Choose 1 of 3)', used: false },
      { id: 'g2-shrine', kind: 'shrine', x: 1760, y: 515, label: 'Oil Flame Shrine (Ignite Weapon)', used: false },
      { id: 'g2-font', kind: 'fountain', x: 3240, y: G_FLOOR, label: 'Pit Spring (+2 HP / +2 MP)', used: false },
      { id: 'g2-door', kind: 'exit_door', x: 3985, y: G_FLOOR, label: 'Enter Room 3 · Totem Bog Hollow', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'g2-hide-1', x: 340, y: G_FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: 'g2-hide-2', x: 1440, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: 'g2-hide-3', x: 2380, y: 805, w: 66, h: 96, kind: 'alcove' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(G2_SPAWNS, 0, m, f),
  },
  {
    index: 2,
    roomNumber: 3,
    raidId: 'goblin_camp',
    environment: 'goblin_camp',
    name: 'Room 3/4 · Totem Bog Hollow',
    bossName: 'Hex-Lord Zog',
    worldWidth: G3_WIDTH,
    worldHeight: G_HEIGHT,
    floorY: G_FLOOR,
    bossZoneStartX: 3170,
    exitDoorX: 4025,
    theme: {
      // Goblin Room 3: Bioluminescent Emerald Swamp & Shaman Totems
      skyTop: '#051918',
      skyBottom: '#103c36',
      moonColor: '#a7f3d0',
      parallaxColor: '#092623',
      archColor: 'rgba(16, 61, 53, 0.72)',
      windowColor: 'rgba(16, 185, 129, 0.36)',
      stoneFill: '#1c332d',
      stoneTop: '#347864',
      bossFloorTop: '#16a34a',
    },
    platforms: G3_PLATFORMS,
    torches: [
      { x: 150, y: 750, phase: 0.2 },
      { x: 640, y: 750, phase: 1.5 },
      { x: 1275, y: 605, phase: 2.9 },
      { x: 2090, y: 625, phase: 1.1 },
      { x: 2620, y: 750, phase: 3.3 },
      { x: 3350, y: 735, phase: 0.7 },
      { x: 3670, y: 735, phase: 2.1 },
      { x: 3960, y: 735, phase: 3.6 },
    ],
    interactables: [
      { id: 'g3-brazier', kind: 'brazier', x: 205, y: G_FLOOR, label: 'Bog Brazier (+2 MP)', used: false },
      { id: 'g3-chest1', kind: 'chest', x: 560, y: 520, label: 'Bog Chest (+Potion & Shards)', used: false },
      { id: 'g3-altar', kind: 'upgrade_altar', x: 1120, y: 810, label: 'Hex Totem (Choose 1 of 3)', used: false },
      { id: 'g3-font', kind: 'fountain', x: 3265, y: G_FLOOR, label: 'Moss Font (+2 HP / +2 MP)', used: false },
      { id: 'g3-door', kind: 'exit_door', x: 4025, y: G_FLOOR, label: 'Enter Room 4 · War-Beast Palisade', used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'g3-hide-1', x: 360, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: 'g3-hide-2', x: 1005, y: 810, w: 66, h: 96, kind: 'alcove' },
      { id: 'g3-hide-3', x: 2345, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(G3_SPAWNS, 1, m, f),
  },
  {
    index: 3,
    roomNumber: 4,
    raidId: 'goblin_camp',
    environment: 'goblin_camp',
    name: 'Room 4/4 · War-Beast Palisade',
    bossName: 'Grimjaw the Siege-Hulk',
    worldWidth: G4_WIDTH,
    worldHeight: G_HEIGHT,
    floorY: G_FLOOR,
    bossZoneStartX: 3280,
    exitDoorX: 4145,
    theme: {
      // Goblin Room 4: Stormy Crimson-Ochre War Fortress & Bone Arches
      skyTop: '#1f0b09',
      skyBottom: '#471a14',
      moonColor: '#fdba74',
      parallaxColor: '#2e120d',
      archColor: 'rgba(71, 28, 19, 0.72)',
      windowColor: 'rgba(234, 88, 12, 0.36)',
      stoneFill: '#36221c',
      stoneTop: '#824732',
      bossFloorTop: '#d97706',
    },
    platforms: G4_PLATFORMS,
    torches: [
      { x: 160, y: 750, phase: 0.4 },
      { x: 465, y: 630, phase: 1.9 },
      { x: 1180, y: 695, phase: 2.5 },
      { x: 1920, y: 665, phase: 0.9 },
      { x: 2705, y: 640, phase: 3.1 },
      { x: 3470, y: 735, phase: 0.6 },
      { x: 3780, y: 735, phase: 2.2 },
      { x: 4070, y: 735, phase: 3.7 },
    ],
    interactables: [
      { id: 'g4-brazier', kind: 'brazier', x: 205, y: G_FLOOR, label: 'War Brazier (+2 MP)', used: false },
      { id: 'g4-chest1', kind: 'chest', x: 545, y: 525, label: 'Palisade Chest (+Potion & Shards)', used: false },
      { id: 'g4-altar', kind: 'upgrade_altar', x: 1320, y: 805, label: 'Warchief Relic (Choose 1 of 3)', used: false },
      { id: 'g4-font', kind: 'fountain', x: 3380, y: G_FLOOR, label: 'War Font (+2 HP / +2 MP)', used: false },
      { id: 'g4-door', kind: 'exit_door', x: 4145, y: G_FLOOR, label: "Enter Warchief's Bone Throne (Big Boss)", used: false, locked: true },
    ],
    hidingSpots: [
      { id: 'g4-hide-1', x: 280, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
      { id: 'g4-hide-2', x: 1020, y: 805, w: 66, h: 96, kind: 'alcove' },
      { id: 'g4-hide-3', x: 2430, y: G_FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(G4_SPAWNS, 2, m, f),
  },
  {
    index: 4,
    roomNumber: 5,
    raidId: 'goblin_camp',
    environment: 'goblin_camp',
    isBigBossRoom: true,
    name: "Final Boss · Warchief's Bone Throne",
    bossName: 'Warchief Kragmash · Goblin King',
    worldWidth: G5_WIDTH,
    worldHeight: G_HEIGHT,
    floorY: G_FLOOR,
    bossZoneStartX: 160,
    exitDoorX: 1565,
    theme: {
      // Goblin Room 5: Colossal Bone-Skull Pyre Arena
      skyTop: '#1c0f06',
      skyBottom: '#47220a',
      moonColor: '#fb923c',
      parallaxColor: '#2b1608',
      archColor: 'rgba(74, 35, 13, 0.75)',
      windowColor: 'rgba(249, 115, 22, 0.44)',
      stoneFill: '#382418',
      stoneTop: '#965125',
      bossFloorTop: '#ea580c',
    },
    platforms: G5_PLATFORMS,
    torches: [
      { x: 175, y: 615, phase: 0.4 },
      { x: 480, y: 735, phase: 1.6 },
      { x: 830, y: 735, phase: 2.8 },
      { x: 1180, y: 735, phase: 1.1 },
      { x: 1470, y: 735, phase: 3.4 },
    ],
    interactables: [
      { id: 'g5-door', kind: 'exit_door', x: 1565, y: G_FLOOR, label: 'Return Victorious to Base Camp', used: false, locked: true },
    ],
    hidingSpots: [],
    createEnemies: (m = 1, f = 0) => buildEnemies(G5_SPAWNS, 0, m, f),
  },
];

export const RAID_ROOMS = NOCTURNE_RAID_ROOMS;
export const STAGES = NOCTURNE_RAID_ROOMS;

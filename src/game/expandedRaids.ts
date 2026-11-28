import { buildEnemies, EnemySpawn, withUndergroundPassage } from './level';
import { EnemyType, Platform, RaidId, StageDef, StageTheme } from './types';

const FLOOR = 860;
const HEIGHT = 1080;

interface RoomBuilderConfig {
  raidId: RaidId;
  env: NonNullable<StageDef['environment']>;
  prefix: string;
  index: number;
  roomNumber: number;
  name: string;
  bossName: string;
  nextLabel: string;
  theme: StageTheme;
  layoutKind: 'high_spire' | 'split_decks' | 'stepped_keep' | 'gauntlet_hall';
  spawns: EnemySpawn[];
  brazierLabel: string;
  chestLabel: string;
  altarLabel: string;
  fountainLabel: string;
  tunnelChestLabel: string;
  extraPlatforms?: Platform[];
}

function makeExpandedRoom(cfg: RoomBuilderConfig): StageDef {
  const W = 4260;
  const platforms: Platform[] = [
    { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: 'wall-right', x: W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
    { id: `${cfg.prefix}${cfg.roomNumber}-f1`, x: 0, y: FLOOR, w: 1220, h: 220, style: 'stone' },
    { id: `${cfg.prefix}${cfg.roomNumber}-f2`, x: 1350, y: FLOOR, w: 1840, h: 220, style: 'stone' },
  ];

  if (cfg.layoutKind === 'high_spire') {
    platforms.push(
      { id: `${cfg.prefix}${cfg.roomNumber}-p1`, x: 340, y: 720, w: 230, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p2`, x: 640, y: 585, w: 240, h: 18, oneWay: true, style: 'bridge' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p3`, x: 960, y: 465, w: 320, h: 20, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p4`, x: 1180, y: 745, w: 190, h: 16, oneWay: true, style: 'timber', crumbling: true },
      { id: `${cfg.prefix}${cfg.roomNumber}-p5`, x: 1580, y: 660, w: 260, h: 18, oneWay: true, style: 'bridge' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p6`, x: 1960, y: 525, w: 290, h: 20, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p7`, x: 2420, y: 690, w: 280, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p8`, x: 2820, y: 555, w: 240, h: 20, oneWay: true, style: 'rafter' }
    );
  } else if (cfg.layoutKind === 'split_decks') {
    platforms.push(
      { id: `${cfg.prefix}${cfg.roomNumber}-p1`, x: 300, y: 725, w: 260, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p2`, x: 680, y: 620, w: 320, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p3`, x: 1160, y: 710, w: 240, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: `${cfg.prefix}${cfg.roomNumber}-p4`, x: 1520, y: 615, w: 360, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p5`, x: 1740, y: 475, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p6`, x: 2180, y: 680, w: 310, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p7`, x: 2640, y: 560, w: 320, h: 20, oneWay: true, style: 'rafter' }
    );
  } else if (cfg.layoutKind === 'stepped_keep') {
    platforms.push(
      { id: `${cfg.prefix}${cfg.roomNumber}-pl1`, x: 610, y: 685, w: 72, h: 175, style: 'pillar' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p1`, x: 350, y: 735, w: 230, h: 18, oneWay: true, style: 'stone' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p2`, x: 740, y: 605, w: 320, h: 18, oneWay: true, style: 'stone' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p3`, x: 1185, y: 735, w: 195, h: 18, oneWay: true, style: 'bridge' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p4`, x: 1540, y: 695, w: 280, h: 18, oneWay: true, style: 'stone' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p5`, x: 1940, y: 560, w: 320, h: 20, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}${cfg.roomNumber}-pl2`, x: 2450, y: 660, w: 76, h: 200, style: 'pillar' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p6`, x: 2560, y: 640, w: 290, h: 18, oneWay: true, style: 'stone' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p7`, x: 2920, y: 525, w: 240, h: 20, oneWay: true, style: 'rafter' }
    );
  } else {
    platforms.push(
      { id: `${cfg.prefix}${cfg.roomNumber}-p1`, x: 320, y: 715, w: 240, h: 18, oneWay: true, style: 'bridge' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p2`, x: 690, y: 590, w: 280, h: 18, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p3`, x: 1170, y: 730, w: 210, h: 18, oneWay: true, style: 'bridge', crumbling: true },
      { id: `${cfg.prefix}${cfg.roomNumber}-p4`, x: 1520, y: 680, w: 300, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p5`, x: 1920, y: 540, w: 280, h: 20, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p6`, x: 2340, y: 660, w: 320, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}${cfg.roomNumber}-p7`, x: 2770, y: 545, w: 270, h: 20, oneWay: true, style: 'rafter' }
    );
  }

  if (cfg.extraPlatforms) {
    platforms.push(...cfg.extraPlatforms);
  }

  platforms.push(
    { id: `${cfg.prefix}${cfg.roomNumber}-boss`, x: 3280, y: FLOOR, w: 980, h: 220, style: 'boss_floor' },
    { id: `${cfg.prefix}${cfg.roomNumber}-bp1`, x: 3440, y: 720, w: 220, h: 18, oneWay: true, style: 'timber' },
    { id: `${cfg.prefix}${cfg.roomNumber}-bp2`, x: 3860, y: 720, w: 220, h: 18, oneWay: true, style: 'timber' },
    { id: `${cfg.prefix}${cfg.roomNumber}-br`, x: 3630, y: 575, w: 260, h: 20, oneWay: true, style: 'rafter' }
  );

  const stage: StageDef = {
    index: cfg.index,
    roomNumber: cfg.roomNumber,
    raidId: cfg.raidId,
    environment: cfg.env,
    name: cfg.name,
    bossName: cfg.bossName,
    worldWidth: W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 3260,
    exitDoorX: 4160,
    theme: cfg.theme,
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
      { id: `${cfg.prefix}${cfg.roomNumber}-brz`, kind: 'brazier', x: 210, y: FLOOR, label: cfg.brazierLabel, used: false },
      {
        id: `${cfg.prefix}${cfg.roomNumber}-chest`,
        kind: 'chest',
        x: cfg.layoutKind === 'high_spire' ? 1110 : 880,
        y: cfg.layoutKind === 'high_spire' ? 465 : 605,
        label: cfg.chestLabel,
        used: false,
      },
      { id: `${cfg.prefix}${cfg.roomNumber}-altar`, kind: 'upgrade_altar', x: 2300, y: FLOOR, label: cfg.altarLabel, used: false },
      { id: `${cfg.prefix}${cfg.roomNumber}-font`, kind: 'fountain', x: 3340, y: FLOOR, label: cfg.fountainLabel, used: false },
      { id: `${cfg.prefix}${cfg.roomNumber}-door`, kind: 'exit_door', x: 4160, y: FLOOR, label: cfg.nextLabel, used: false, locked: true },
    ],
    hidingSpots: [
      { id: `${cfg.prefix}${cfg.roomNumber}-h1`, x: 490, y: FLOOR, w: 66, h: 96, kind: 'alcove' },
      { id: `${cfg.prefix}${cfg.roomNumber}-h2`, x: 2060, y: FLOOR, w: 66, h: 96, kind: 'curtain' },
    ],
    createEnemies: (m = 1, f = 0) => buildEnemies(cfg.spawns, Math.floor(cfg.index / 2), m, f),
  };

  return withUndergroundPassage(stage, {
    idPrefix: `${cfg.prefix}${cfg.roomNumber}`,
    startX: 1740,
    endX: 2940,
    grateInX: 1800,
    grateOutX: 2800,
    chestLabel: cfg.tunnelChestLabel,
  });
}

function makeFinalBossRoom(cfg: {
  raidId: RaidId;
  env: NonNullable<StageDef['environment']>;
  prefix: string;
  name: string;
  bossName: string;
  bossType: EnemyType;
  doorLabel: string;
  theme: StageTheme;
  extraPlatforms?: Platform[];
}): StageDef {
  const W = 1720;
  return {
    index: 4,
    roomNumber: 5,
    raidId: cfg.raidId,
    environment: cfg.env,
    isBigBossRoom: true,
    name: cfg.name,
    bossName: cfg.bossName,
    worldWidth: W,
    worldHeight: HEIGHT,
    floorY: FLOOR,
    bossZoneStartX: 200,
    exitDoorX: 1620,
    theme: cfg.theme,
    platforms: [
      { id: 'wall-left', x: -40, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: 'wall-right', x: W, y: 0, w: 40, h: HEIGHT, style: 'pillar' },
      { id: `${cfg.prefix}5-floor`, x: 0, y: FLOOR, w: W, h: 220, style: 'boss_floor' },
      { id: `${cfg.prefix}5-p1`, x: 240, y: 715, w: 230, h: 18, oneWay: true, style: 'timber' },
      { id: `${cfg.prefix}5-p2`, x: 740, y: 605, w: 260, h: 20, oneWay: true, style: 'rafter' },
      { id: `${cfg.prefix}5-p3`, x: 1240, y: 715, w: 230, h: 18, oneWay: true, style: 'timber' },
      ...(cfg.extraPlatforms ?? []),
    ],
    torches: [
      { x: 210, y: 735, phase: 0.3 },
      { x: 640, y: 735, phase: 1.4 },
      { x: 1080, y: 735, phase: 2.6 },
      { x: 1500, y: 735, phase: 3.7 },
    ],
    interactables: [
      {
        id: `${cfg.prefix}5-door`,
        kind: 'exit_door',
        x: 1620,
        y: FLOOR,
        label: cfg.doorLabel,
        used: false,
        locked: true,
      },
    ],
    hidingSpots: [],
    createEnemies: (m = 1, f = 0) =>
      buildEnemies(
        [{ type: cfg.bossType, x: 1260, y: FLOOR, facing: -1, patrolRadius: 430, isBigBoss: true }],
        2,
        m,
        f
      ),
  };
}

// ============================================================================
// THEMES FOR ALL 7 NEW WORLDS
// ============================================================================
const CYBERPUNK_THEME_A: StageTheme = {
  skyTop: '#060718',
  skyBottom: '#1c0f36',
  moonColor: '#f472b6',
  parallaxColor: '#10122a',
  archColor: 'rgba(236, 72, 153, 0.34)',
  windowColor: 'rgba(34, 211, 238, 0.42)',
  stoneFill: '#181c2e',
  stoneTop: '#ec4899',
  bossFloorTop: '#22d3ee',
};

const CYBERPUNK_THEME_B: StageTheme = {
  skyTop: '#040b18',
  skyBottom: '#122240',
  moonColor: '#22d3ee',
  parallaxColor: '#0e162c',
  archColor: 'rgba(34, 211, 238, 0.34)',
  windowColor: 'rgba(236, 72, 153, 0.42)',
  stoneFill: '#141a2b',
  stoneTop: '#22d3ee',
  bossFloorTop: '#ec4899',
};

const PIRATE_ISLAND_THEME: StageTheme = {
  skyTop: '#172554',
  skyBottom: '#b45309',
  moonColor: '#fde047',
  parallaxColor: '#1e293b',
  archColor: 'rgba(245, 158, 11, 0.34)',
  windowColor: 'rgba(253, 224, 71, 0.4)',
  stoneFill: '#78350f',
  stoneTop: '#f59e0b',
  bossFloorTop: '#fbbf24',
};

const PIRATE_SHIP_THEME: StageTheme = {
  skyTop: '#0c182c',
  skyBottom: '#1e3a5f',
  moonColor: '#fef3c7',
  parallaxColor: '#132238',
  archColor: 'rgba(217, 119, 6, 0.36)',
  windowColor: 'rgba(251, 191, 36, 0.42)',
  stoneFill: '#451a03',
  stoneTop: '#d97706',
  bossFloorTop: '#f59e0b',
};

const PARADOX_RIFT_THEME: StageTheme = {
  skyTop: '#09051a',
  skyBottom: '#2e1065',
  moonColor: '#a5b4fc',
  parallaxColor: '#1b1038',
  archColor: 'rgba(129, 140, 248, 0.38)',
  windowColor: 'rgba(45, 212, 191, 0.4)',
  stoneFill: '#1e1636',
  stoneTop: '#818cf8',
  bossFloorTop: '#2dd4bf',
};

const MANSION_THEME_A: StageTheme = {
  skyTop: '#160812',
  skyBottom: '#3b1024',
  moonColor: '#fde68a',
  parallaxColor: '#240c1a',
  archColor: 'rgba(225, 29, 72, 0.34)',
  windowColor: 'rgba(251, 191, 36, 0.45)',
  stoneFill: '#2b1d26',
  stoneTop: '#e11d48',
  bossFloorTop: '#fbbf24',
};

const MANSION_THEME_B: StageTheme = {
  skyTop: '#120b1c',
  skyBottom: '#2d152c',
  moonColor: '#fef08a',
  parallaxColor: '#201026',
  archColor: 'rgba(245, 158, 11, 0.36)',
  windowColor: 'rgba(244, 63, 94, 0.4)',
  stoneFill: '#2a2130',
  stoneTop: '#fbbf24',
  bossFloorTop: '#e11d48',
};

const UNDERWATER_THEME_A: StageTheme = {
  skyTop: '#031526',
  skyBottom: '#0c4a6e',
  moonColor: '#7dd3fc',
  parallaxColor: '#072a42',
  archColor: 'rgba(56, 189, 248, 0.36)',
  windowColor: 'rgba(45, 212, 191, 0.45)',
  stoneFill: '#12354a',
  stoneTop: '#0ea5e9',
  bossFloorTop: '#2dd4bf',
};

const UNDERWATER_THEME_B: StageTheme = {
  skyTop: '#021a24',
  skyBottom: '#115e59',
  moonColor: '#99f6e4',
  parallaxColor: '#08333b',
  archColor: 'rgba(45, 212, 191, 0.36)',
  windowColor: 'rgba(56, 189, 248, 0.42)',
  stoneFill: '#103b45',
  stoneTop: '#2dd4bf',
  bossFloorTop: '#38bdf8',
};

const FROST_THEME_A: StageTheme = {
  skyTop: '#061529',
  skyBottom: '#1d4ed8',
  moonColor: '#e0f2fe',
  parallaxColor: '#0f294a',
  archColor: 'rgba(125, 211, 252, 0.38)',
  windowColor: 'rgba(52, 211, 153, 0.42)',
  stoneFill: '#1e3552',
  stoneTop: '#7dd3fc',
  bossFloorTop: '#38bdf8',
};

const FROST_THEME_B: StageTheme = {
  skyTop: '#071a2b',
  skyBottom: '#0f766e',
  moonColor: '#f0f9ff',
  parallaxColor: '#123045',
  archColor: 'rgba(56, 189, 248, 0.4)',
  windowColor: 'rgba(167, 243, 208, 0.45)',
  stoneFill: '#223b54',
  stoneTop: '#bae6fd',
  bossFloorTop: '#34d399',
};

const BARBARIC_THEME_A: StageTheme = {
  skyTop: '#1c0c09',
  skyBottom: '#6b2012',
  moonColor: '#fdba74',
  parallaxColor: '#2d130d',
  archColor: 'rgba(239, 68, 68, 0.36)',
  windowColor: 'rgba(249, 115, 22, 0.44)',
  stoneFill: '#3b241d',
  stoneTop: '#dc2626',
  bossFloorTop: '#f97316',
};

const BARBARIC_THEME_B: StageTheme = {
  skyTop: '#18100d',
  skyBottom: '#572214',
  moonColor: '#fed7aa',
  parallaxColor: '#291712',
  archColor: 'rgba(249, 115, 22, 0.38)',
  windowColor: 'rgba(239, 68, 68, 0.42)',
  stoneFill: '#36231c',
  stoneTop: '#f97316',
  bossFloorTop: '#ef4444',
};

// ============================================================================
// 10. NEON SPIRE 2099 (Cyberpunk Night City)
// ============================================================================
export const CYBERPUNK_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'cyberpunk_city',
    env: 'cyberpunk',
    prefix: 'cy',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Rain-Slicked Sector 7 Alley',
    bossName: 'Chrome Enforcer V-04',
    nextLabel: 'Ascend to Holo-Highway',
    theme: CYBERPUNK_THEME_A,
    layoutKind: 'high_spire',
    brazierLabel: 'Neon Power Cell (+2 MP)',
    chestLabel: 'Black-Market Cyber Cache (+Potion & Shards)',
    altarLabel: 'Holo-Relay Terminal (Choose 1 of 3)',
    fountainLabel: 'Nano-Med Station (+2 HP / +2 MP)',
    tunnelChestLabel: 'Sub-Grid Smuggler Locker (+Potion & Shards)',
    spawns: [
      { type: 'void_stalker', x: 760, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'plasma_drone', x: 1120, y: 420, facing: -1, patrolRadius: 170 },
      { type: 'mech_turret', x: 1720, y: FLOOR, facing: -1, patrolRadius: 90 },
      { type: 'goblin_bomber', x: 2140, y: 525, facing: -1, patrolRadius: 130 },
      { type: 'void_stalker', x: 2660, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'boss_goblin_sapper', x: 3790, y: FLOOR, facing: -1, patrolRadius: 340 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'cyberpunk_city',
    env: 'cyberpunk',
    prefix: 'cy',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Magenta Holo-Highway',
    bossName: 'Pulse-Drone Matriarch',
    nextLabel: 'Enter Chrome Server Core',
    theme: CYBERPUNK_THEME_B,
    layoutKind: 'split_decks',
    brazierLabel: 'Neon Power Cell (+2 MP)',
    chestLabel: 'Syndicate Drop-Pod (+Potion & Shards)',
    altarLabel: 'Neural Upgrade Deck (Choose 1 of 3)',
    fountainLabel: 'Nano-Med Station (+2 HP / +2 MP)',
    tunnelChestLabel: 'Maintenance Conduit Stash (+Potion & Shards)',
    spawns: [
      { type: 'plasma_drone', x: 740, y: 560, facing: -1, patrolRadius: 170 },
      { type: 'void_stalker', x: 1080, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'mech_turret', x: 1690, y: 615, facing: -1, patrolRadius: 110 },
      { type: 'plasma_drone', x: 2220, y: 460, facing: -1, patrolRadius: 180 },
      { type: 'void_stalker', x: 2780, y: FLOOR, facing: -1, patrolRadius: 180 },
      { type: 'boss_banshee', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'cyberpunk_city',
    env: 'cyberpunk',
    prefix: 'cy',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Overclock Server Core',
    bossName: 'Mecha-Sentinel K-12',
    nextLabel: 'Ascend to Penthouse Skybridge',
    theme: CYBERPUNK_THEME_A,
    layoutKind: 'stepped_keep',
    brazierLabel: 'Neon Power Cell (+2 MP)',
    chestLabel: 'Encrypted Vault Pod (+Potion & Shards)',
    altarLabel: 'Mainframe Shrine (Choose 1 of 3)',
    fountainLabel: 'Nano-Med Station (+2 HP / +2 MP)',
    tunnelChestLabel: 'Cooling-Duct Stash (+Potion & Shards)',
    spawns: [
      { type: 'mech_turret', x: 840, y: 605, facing: -1, patrolRadius: 110 },
      { type: 'void_stalker', x: 1420, y: FLOOR, facing: -1, patrolRadius: 180 },
      { type: 'plasma_drone', x: 1960, y: 490, facing: -1, patrolRadius: 190 },
      { type: 'goblin_bomber', x: 2620, y: 640, facing: -1, patrolRadius: 130 },
      { type: 'mech_turret', x: 2940, y: FLOOR, facing: -1, patrolRadius: 120 },
      { type: 'boss_colossus', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'cyberpunk_city',
    env: 'cyberpunk',
    prefix: 'cy',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Spire Penthouse Skybridge',
    bossName: 'Cyber-Vanguard Executioner',
    nextLabel: 'Enter Spire 2099 Crown',
    theme: CYBERPUNK_THEME_B,
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'Neon Power Cell (+2 MP)',
    chestLabel: 'Executive Armory Case (+Potion & Shards)',
    altarLabel: 'Overclock Terminal (Choose 1 of 3)',
    fountainLabel: 'Nano-Med Station (+2 HP / +2 MP)',
    tunnelChestLabel: 'Cable-Tray Smuggler Box (+Potion & Shards)',
    spawns: [
      { type: 'void_stalker', x: 760, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'plasma_drone', x: 1220, y: 510, facing: -1, patrolRadius: 190 },
      { type: 'mech_turret', x: 1700, y: FLOOR, facing: -1, patrolRadius: 120 },
      { type: 'void_stalker', x: 2220, y: FLOOR, facing: -1, patrolRadius: 190 },
      { type: 'plasma_drone', x: 2760, y: 490, facing: -1, patrolRadius: 180 },
      { type: 'boss_executioner', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'cyberpunk_city',
    env: 'cyberpunk',
    prefix: 'cy',
    name: 'Final Boss · Neon Spire 2099 Penthouse',
    bossName: 'Synth-Shogun Zero · Chrome Overlord',
    bossType: 'boss_alien_archon',
    doorLabel: 'Claim Overclock Neural Chip & Return to Camp',
    theme: CYBERPUNK_THEME_A,
  }),
];

// ============================================================================
// 11. SKULLTIDE COVE & ARMADA (Treasure Island & Pirate Ship)
// ============================================================================
export const PIRATE_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'pirate_armada',
    env: 'pirate',
    prefix: 'pi',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Treasure Island Beachhead',
    bossName: 'Quartermaster Redbeard',
    nextLabel: 'Board the Corsair Brigantine',
    theme: PIRATE_ISLAND_THEME,
    layoutKind: 'high_spire',
    brazierLabel: 'Rum-Fire Lantern (+2 MP)',
    chestLabel: 'Buried Doubloon Chest (+Potion & Shards)',
    altarLabel: 'Tide-Carved Idol (Choose 1 of 3)',
    fountainLabel: 'Freshwater Spring (+2 HP / +2 MP)',
    tunnelChestLabel: 'Smuggler Sea-Cave Stash (+Potion & Shards)',
    spawns: [
      { type: 'goblin_grunt', x: 760, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'goblin_archer', x: 1080, y: 465, facing: -1, patrolRadius: 120 },
      { type: 'goblin_bomber', x: 1680, y: FLOOR, facing: -1, patrolRadius: 140 },
      { type: 'goblin_grunt', x: 2260, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'knight', x: 2760, y: FLOOR, facing: -1, patrolRadius: 140 },
      { type: 'boss_goblin_chief', x: 3790, y: FLOOR, facing: -1, patrolRadius: 340 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'pirate_armada',
    env: 'pirate',
    prefix: 'pi',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Corsair Galleon Main Deck',
    bossName: 'Powder-Keg Bosun',
    nextLabel: 'Cross to Skeleton Reef',
    theme: PIRATE_SHIP_THEME,
    layoutKind: 'split_decks',
    brazierLabel: 'Ship Lantern (+2 MP)',
    chestLabel: 'Captain’s Plunder Chest (+Potion & Shards)',
    altarLabel: 'Figurehead Shrine (Choose 1 of 3)',
    fountainLabel: 'Cask of Spiced Grog (+2 HP / +2 MP)',
    tunnelChestLabel: 'Lower Bilge Contraband (+Potion & Shards)',
    spawns: [
      { type: 'goblin_bomber', x: 780, y: 620, facing: -1, patrolRadius: 140 },
      { type: 'goblin_archer', x: 1540, y: 615, facing: -1, patrolRadius: 130 },
      { type: 'knight', x: 1860, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_bomber', x: 2320, y: 680, facing: -1, patrolRadius: 140 },
      { type: 'goblin_brute', x: 2820, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'boss_goblin_sapper', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'pirate_armada',
    env: 'pirate',
    prefix: 'pi',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Skull-Rock Treasure Cavern',
    bossName: 'First Mate Ironhook',
    nextLabel: 'Board Dreadtide’s Flagship',
    theme: PIRATE_ISLAND_THEME,
    layoutKind: 'stepped_keep',
    brazierLabel: 'Rum-Fire Lantern (+2 MP)',
    chestLabel: 'Gilded Bullion Vault (+Potion & Shards)',
    altarLabel: 'Buccaneer Totem (Choose 1 of 3)',
    fountainLabel: 'Lagoon Wellspring (+2 HP / +2 MP)',
    tunnelChestLabel: 'Hidden Reef Tunnel Chest (+Potion & Shards)',
    spawns: [
      { type: 'goblin_grunt', x: 790, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'bat', x: 1180, y: 540, facing: -1, patrolRadius: 170 },
      { type: 'goblin_archer', x: 1720, y: 695, facing: -1, patrolRadius: 130 },
      { type: 'goblin_brute', x: 2200, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_bomber', x: 2740, y: 640, facing: -1, patrolRadius: 140 },
      { type: 'boss_goblin_behemoth', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'pirate_armada',
    env: 'pirate',
    prefix: 'pi',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Black Armada Quarterdeck',
    bossName: 'Cursed Deck-Master',
    nextLabel: 'Challenge Captain Dreadtide',
    theme: PIRATE_SHIP_THEME,
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'Ship Lantern (+2 MP)',
    chestLabel: 'Armada War-Chest (+Potion & Shards)',
    altarLabel: 'Compass Altar (Choose 1 of 3)',
    fountainLabel: 'Spiced Grog Barrel (+2 HP / +2 MP)',
    tunnelChestLabel: 'Gun-Deck Powder Stash (+Potion & Shards)',
    spawns: [
      { type: 'knight', x: 780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_archer', x: 1140, y: 590, facing: -1, patrolRadius: 140 },
      { type: 'goblin_bomber', x: 1660, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_brute', x: 2240, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'knight', x: 2800, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_bone_reaver', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'pirate_armada',
    env: 'pirate',
    prefix: 'pi',
    name: 'Final Boss · Flagship Black Sovereign',
    bossName: 'Captain Dreadtide · Corsair Admiral',
    bossType: 'boss_goblin_warlord',
    doorLabel: 'Claim Corsair Gold Compass & Return to Camp',
    theme: PIRATE_SHIP_THEME,
  }),
];

// ============================================================================
// 12. THE GHOST PARADOX (Zero Connection Between Rooms!)
// Room 1: Ghost Pirate Galleon ('pirate')
// Room 2: Haunted Aristocrat Manor ('mansion')
// Room 3: Glitched Neon Alley ('cyberpunk')
// Room 4: Drowned Abyssal Ruin ('underwater')
// Room 5: Shattered Paradox Rift ('paradox')
// ============================================================================
export const GHOST_PARADOX_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'ghost_paradox',
    env: 'pirate',
    prefix: 'gp',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Spectral Ghost Galleon (Rift I)',
    bossName: 'Phantom Quartermaster',
    nextLabel: 'Step Through Door → Haunted Mansion',
    theme: {
      ...PIRATE_SHIP_THEME,
      skyTop: '#080e24',
      skyBottom: '#1c254a',
      stoneTop: '#818cf8',
      bossFloorTop: '#2dd4bf',
    },
    layoutKind: 'split_decks',
    brazierLabel: 'Ghost-Flame Lantern (+2 MP)',
    chestLabel: 'Phasing Sea-Chest (+Potion & Shards)',
    altarLabel: 'Rift Obelisk (Choose 1 of 3)',
    fountainLabel: 'Ectoplasm Basin (+2 HP / +2 MP)',
    tunnelChestLabel: 'Haunted Hold Stash (+Potion & Shards)',
    spawns: [
      { type: 'skeleton', x: 760, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'wraith', x: 1180, y: 540, facing: -1, patrolRadius: 180 },
      { type: 'goblin_bomber', x: 1720, y: 615, facing: -1, patrolRadius: 140 },
      { type: 'wraith', x: 2240, y: 560, facing: -1, patrolRadius: 180 },
      { type: 'skeleton', x: 2780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_banshee', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'ghost_paradox',
    env: 'mansion',
    prefix: 'gp',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Haunted Victorian Foyer (Rift II)',
    bossName: 'Spectral Butler Vex',
    nextLabel: 'Step Through Door → Glitched Neon Alley',
    theme: {
      ...MANSION_THEME_B,
      skyTop: '#100824',
      skyBottom: '#2d164a',
      stoneTop: '#a78bfa',
    },
    layoutKind: 'stepped_keep',
    brazierLabel: 'Floating Candelabra (+2 MP)',
    chestLabel: 'Paradox Heirloom Trunk (+Potion & Shards)',
    altarLabel: 'Mirrored Hearth (Choose 1 of 3)',
    fountainLabel: 'Silver Goblet Font (+2 HP / +2 MP)',
    tunnelChestLabel: 'Secret Cellar Rift-Box (+Potion & Shards)',
    spawns: [
      { type: 'acolyte', x: 820, y: 605, facing: -1, patrolRadius: 140 },
      { type: 'bat', x: 1240, y: 520, facing: -1, patrolRadius: 180 },
      { type: 'knight', x: 1740, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'wraith', x: 2220, y: 520, facing: -1, patrolRadius: 180 },
      { type: 'gargoyle', x: 2740, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'boss_vampire_duelist', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'ghost_paradox',
    env: 'cyberpunk',
    prefix: 'gp',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Glitched Neon Alley (Rift III)',
    bossName: 'Corrupted Holo-Specter',
    nextLabel: 'Step Through Door → Drowned Abyss',
    theme: {
      ...CYBERPUNK_THEME_A,
      skyTop: '#07051c',
      skyBottom: '#2b124d',
    },
    layoutKind: 'high_spire',
    brazierLabel: 'Glitched Relay (+2 MP)',
    chestLabel: 'Anomalous Data-Vault (+Potion & Shards)',
    altarLabel: 'Chrono Terminal (Choose 1 of 3)',
    fountainLabel: 'Phase-Mend Pod (+2 HP / +2 MP)',
    tunnelChestLabel: 'Static Conduit Stash (+Potion & Shards)',
    spawns: [
      { type: 'void_stalker', x: 780, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'plasma_drone', x: 1180, y: 450, facing: -1, patrolRadius: 190 },
      { type: 'wraith', x: 1740, y: 550, facing: -1, patrolRadius: 180 },
      { type: 'mech_turret', x: 2360, y: FLOOR, facing: -1, patrolRadius: 120 },
      { type: 'void_stalker', x: 2820, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'boss_malakor', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'ghost_paradox',
    env: 'underwater',
    prefix: 'gp',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Drowned Echo Hall (Rift IV)',
    bossName: 'Sunken Rift-Warden',
    nextLabel: 'Enter The Paradox Core',
    theme: {
      ...UNDERWATER_THEME_A,
      skyTop: '#050d26',
      skyBottom: '#1c2b59',
      stoneTop: '#818cf8',
    },
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'Tide-Lantern (+2 MP)',
    chestLabel: 'Timeless Sunken Reliquary (+Potion & Shards)',
    altarLabel: 'Paradox Pearl Shrine (Choose 1 of 3)',
    fountainLabel: 'Astral Tide-Pool (+2 HP / +2 MP)',
    tunnelChestLabel: 'Flooded Rift Stash (+Potion & Shards)',
    spawns: [
      { type: 'wraith', x: 760, y: 560, facing: -1, patrolRadius: 180 },
      { type: 'jade_sentinel', x: 1240, y: 580, facing: -1, patrolRadius: 150 },
      { type: 'void_stalker', x: 1740, y: FLOOR, facing: -1, patrolRadius: 180 },
      { type: 'gargoyle', x: 2320, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'wraith', x: 2820, y: 520, facing: -1, patrolRadius: 190 },
      { type: 'boss_executioner', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'ghost_paradox',
    env: 'paradox',
    prefix: 'gp',
    name: 'Final Boss · Shattered Paradox Sanctum',
    bossName: 'The Paradox Phantom · Fractured Echo',
    bossType: 'boss_necromancer',
    doorLabel: 'Claim Paradox Fractured Glass & Return to Camp',
    theme: PARADOX_RIFT_THEME,
  }),
];

// ============================================================================
// 13. VELVET BLOOD CHATEAU (Rich Noble Mansion)
// ============================================================================
export const NOBLE_MANSION_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'noble_mansion',
    env: 'mansion',
    prefix: 'nm',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Grand Marble Vestibule',
    bossName: 'Captain of the House Guard',
    nextLabel: 'Enter the Velvet Ballroom',
    theme: MANSION_THEME_A,
    layoutKind: 'stepped_keep',
    brazierLabel: 'Gilded Candelabra (+2 MP)',
    chestLabel: 'Aristocrat Jewelry Coffer (+Potion & Shards)',
    altarLabel: 'Marble Bust Shrine (Choose 1 of 3)',
    fountainLabel: 'Rose-Wine Fountain (+2 HP / +2 MP)',
    tunnelChestLabel: 'Vintage Wine-Cellar Chest (+Potion & Shards)',
    spawns: [
      { type: 'skeleton', x: 760, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'bat', x: 1160, y: 520, facing: -1, patrolRadius: 170 },
      { type: 'knight', x: 1720, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'acolyte', x: 2140, y: 560, facing: -1, patrolRadius: 130 },
      { type: 'knight', x: 2740, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_vampire_duelist', x: 3790, y: FLOOR, facing: -1, patrolRadius: 340 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'noble_mansion',
    env: 'mansion',
    prefix: 'nm',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Chandelier Banquet Gallery',
    bossName: 'Lady Carmilla the Maître',
    nextLabel: 'Ascend to the Royal Library',
    theme: MANSION_THEME_B,
    layoutKind: 'high_spire',
    brazierLabel: 'Gilded Candelabra (+2 MP)',
    chestLabel: 'Silverware Treasury (+Potion & Shards)',
    altarLabel: 'Velvet Canopy Altar (Choose 1 of 3)',
    fountainLabel: 'Crystal Chalice Font (+2 HP / +2 MP)',
    tunnelChestLabel: 'Servant Corridor Stash (+Potion & Shards)',
    spawns: [
      { type: 'ghoul', x: 760, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'acolyte', x: 1120, y: 465, facing: -1, patrolRadius: 130 },
      { type: 'bat', x: 1680, y: 540, facing: -1, patrolRadius: 170 },
      { type: 'knight', x: 2220, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'acolyte', x: 2780, y: 555, facing: -1, patrolRadius: 140 },
      { type: 'boss_banshee', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'noble_mansion',
    env: 'mansion',
    prefix: 'nm',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Gilded Portrait Library',
    bossName: 'Clockwork Majordomo',
    nextLabel: 'Enter the Crimson Conservatory',
    theme: MANSION_THEME_A,
    layoutKind: 'split_decks',
    brazierLabel: 'Gilded Candelabra (+2 MP)',
    chestLabel: 'Sealed Tax-Vault Chest (+Potion & Shards)',
    altarLabel: 'Archivist Lectern (Choose 1 of 3)',
    fountainLabel: 'Rose-Wine Fountain (+2 HP / +2 MP)',
    tunnelChestLabel: 'Secret Bookcase Stash (+Potion & Shards)',
    spawns: [
      { type: 'knight', x: 800, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'acolyte', x: 1520, y: 615, facing: -1, patrolRadius: 140 },
      { type: 'gargoyle', x: 1960, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'bat', x: 2380, y: 520, facing: -1, patrolRadius: 180 },
      { type: 'knight', x: 2820, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_colossus', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'noble_mansion',
    env: 'mansion',
    prefix: 'nm',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Masquerade Terrace',
    bossName: 'Inquisitor of House Vane',
    nextLabel: 'Enter Duke Vane’s Salon',
    theme: MANSION_THEME_B,
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'Gilded Candelabra (+2 MP)',
    chestLabel: 'Duke’s Tribute Chest (+Potion & Shards)',
    altarLabel: 'Crimson Signet Shrine (Choose 1 of 3)',
    fountainLabel: 'Crystal Chalice Font (+2 HP / +2 MP)',
    tunnelChestLabel: 'Under-Terrace Vault (+Potion & Shards)',
    spawns: [
      { type: 'knight', x: 760, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'bat', x: 1220, y: 510, facing: -1, patrolRadius: 180 },
      { type: 'acolyte', x: 1680, y: 680, facing: -1, patrolRadius: 140 },
      { type: 'knight', x: 2240, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'wraith', x: 2800, y: 510, facing: -1, patrolRadius: 180 },
      { type: 'boss_malakor', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'noble_mansion',
    env: 'mansion',
    prefix: 'nm',
    name: 'Final Boss · Velvet Blood Grand Salon',
    bossName: 'Duke Aurelius Vane · Gilded Sovereign',
    bossType: 'boss_valerius',
    doorLabel: 'Claim Gilded Velvet Signet & Return to Camp',
    theme: MANSION_THEME_A,
  }),
];

// ============================================================================
// 14. SUNKEN PELAGIA (Underwater City)
// ============================================================================
export const UNDERWATER_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'underwater_city',
    env: 'underwater',
    prefix: 'uw',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Bioluminescent Coral Gate',
    bossName: 'Reef-Shell Colossus',
    nextLabel: 'Enter Sea-Glass Aqueduct',
    theme: UNDERWATER_THEME_A,
    layoutKind: 'high_spire',
    brazierLabel: 'Pearl Luminescence (+2 MP)',
    chestLabel: 'Sunken Amphora Cache (+Potion & Shards)',
    altarLabel: 'Coral Tide-Altar (Choose 1 of 3)',
    fountainLabel: 'Air-Bubble Spring (+2 HP / +2 MP)',
    tunnelChestLabel: 'Flooded Pipe Vault (+Potion & Shards)',
    extraPlatforms: [
      { id: 'uw1-up1', x: 460, y: 842, w: 72, h: 18, oneWay: true, style: 'wind_pad' },
      { id: 'uw1-up2', x: 1840, y: 842, w: 72, h: 18, oneWay: true, style: 'wind_pad' },
    ],
    spawns: [
      { type: 'spore_hopper', x: 760, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'cloud_wyrmling', x: 1140, y: 470, facing: -1, patrolRadius: 180 },
      { type: 'jade_sentinel', x: 1700, y: FLOOR, facing: -1, patrolRadius: 140 },
      { type: 'mycelium_spitter', x: 2140, y: 525, facing: -1, patrolRadius: 130 },
      { type: 'spore_hopper', x: 2740, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_mushroom_sovereign', x: 3790, y: FLOOR, facing: -1, patrolRadius: 340 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'underwater_city',
    env: 'underwater',
    prefix: 'uw',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Sea-Glass Tunnel Promenade',
    bossName: 'Tide-Siren Oracle',
    nextLabel: 'Descend to Kelp Spire Plaza',
    theme: UNDERWATER_THEME_B,
    layoutKind: 'split_decks',
    brazierLabel: 'Pearl Luminescence (+2 MP)',
    chestLabel: 'Nautilus Strongbox (+Potion & Shards)',
    altarLabel: 'Trench Pearl Shrine (Choose 1 of 3)',
    fountainLabel: 'Air-Bubble Spring (+2 HP / +2 MP)',
    tunnelChestLabel: 'Pressure-Vent Stash (+Potion & Shards)',
    spawns: [
      { type: 'jade_sentinel', x: 780, y: 620, facing: -1, patrolRadius: 140 },
      { type: 'cloud_wyrmling', x: 1220, y: 500, facing: -1, patrolRadius: 180 },
      { type: 'cap_brute', x: 1760, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'wraith', x: 2240, y: 520, facing: -1, patrolRadius: 180 },
      { type: 'jade_sentinel', x: 2780, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'boss_banshee', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'underwater_city',
    env: 'underwater',
    prefix: 'uw',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Giant Kelp Dome',
    bossName: 'Abyssal Shell-Guard',
    nextLabel: 'Approach Pelagia’s Throne Dome',
    theme: UNDERWATER_THEME_A,
    layoutKind: 'stepped_keep',
    brazierLabel: 'Pearl Luminescence (+2 MP)',
    chestLabel: 'Sunken Treasury Chest (+Potion & Shards)',
    altarLabel: 'Leviathan Statue (Choose 1 of 3)',
    fountainLabel: 'Air-Bubble Spring (+2 HP / +2 MP)',
    tunnelChestLabel: 'Submerged Conduit Stash (+Potion & Shards)',
    spawns: [
      { type: 'spore_hopper', x: 780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'mycelium_spitter', x: 1120, y: 605, facing: -1, patrolRadius: 130 },
      { type: 'cap_brute', x: 1740, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'cloud_wyrmling', x: 2180, y: 490, facing: -1, patrolRadius: 190 },
      { type: 'jade_sentinel', x: 2740, y: 640, facing: -1, patrolRadius: 150 },
      { type: 'boss_gargoyle_king', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'underwater_city',
    env: 'underwater',
    prefix: 'uw',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Trench Conduit Approach',
    bossName: 'Deep-Sea Sentinel',
    nextLabel: 'Enter Archon Nereus’s Dome',
    theme: UNDERWATER_THEME_B,
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'Pearl Luminescence (+2 MP)',
    chestLabel: 'Royal Pearl Coffer (+Potion & Shards)',
    altarLabel: 'Abyssal Conduit (Choose 1 of 3)',
    fountainLabel: 'Air-Bubble Spring (+2 HP / +2 MP)',
    tunnelChestLabel: 'Deep Trench Cache (+Potion & Shards)',
    spawns: [
      { type: 'jade_sentinel', x: 780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'cloud_wyrmling', x: 1220, y: 500, facing: -1, patrolRadius: 190 },
      { type: 'cap_brute', x: 1740, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'wraith', x: 2260, y: 500, facing: -1, patrolRadius: 180 },
      { type: 'jade_sentinel', x: 2800, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_alien_archon', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'underwater_city',
    env: 'underwater',
    prefix: 'uw',
    name: 'Final Boss · Pearl Throne of Sunken Pelagia',
    bossName: 'Archon Nereus · Abyssal Leviathan',
    bossType: 'boss_dragon_crane',
    doorLabel: 'Claim Abyssal Tide Pearl & Return to Camp',
    theme: UNDERWATER_THEME_A,
  }),
];

// ============================================================================
// 15. FROSTWARDEN CITADEL (Frost Wardens)
// ============================================================================
export const FROST_WARDENS_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'frost_wardens',
    env: 'frost',
    prefix: 'fw',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Aurora Outer Ramparts',
    bossName: 'Glacier Halberdier Captain',
    nextLabel: 'Enter the Rime Cloister',
    theme: FROST_THEME_A,
    layoutKind: 'stepped_keep',
    brazierLabel: 'Blue-Flame Hearth (+2 MP)',
    chestLabel: 'Frosted Supply Chest (+Potion & Shards)',
    altarLabel: 'Ice-Rune Pillar (Choose 1 of 3)',
    fountainLabel: 'Thermal Melt-Pool (+2 HP / +2 MP)',
    tunnelChestLabel: 'Glacier Vault Stash (+Potion & Shards)',
    spawns: [
      { type: 'knight', x: 780, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'acolyte', x: 1100, y: 605, facing: -1, patrolRadius: 130 },
      { type: 'gargoyle', x: 1720, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'wraith', x: 2180, y: 520, facing: -1, patrolRadius: 170 },
      { type: 'knight', x: 2760, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_cinder_warden', x: 3790, y: FLOOR, facing: -1, patrolRadius: 340 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'frost_wardens',
    env: 'frost',
    prefix: 'fw',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Permafrost Bell-Tower',
    bossName: 'Cryo-Seer Isolde',
    nextLabel: 'Cross the Ice-Bridge',
    theme: FROST_THEME_B,
    layoutKind: 'high_spire',
    brazierLabel: 'Blue-Flame Hearth (+2 MP)',
    chestLabel: 'Warden Armory Chest (+Potion & Shards)',
    altarLabel: 'Aurora Obelisk (Choose 1 of 3)',
    fountainLabel: 'Thermal Melt-Pool (+2 HP / +2 MP)',
    tunnelChestLabel: 'Sub-Ice Tunnel Cache (+Potion & Shards)',
    spawns: [
      { type: 'acolyte', x: 780, y: 585, facing: -1, patrolRadius: 140 },
      { type: 'gargoyle', x: 1180, y: 465, facing: -1, patrolRadius: 160 },
      { type: 'runed_golem', x: 1760, y: FLOOR, facing: -1, patrolRadius: 140 },
      { type: 'wraith', x: 2240, y: 500, facing: -1, patrolRadius: 180 },
      { type: 'knight', x: 2780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_pyre_matriarch', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'frost_wardens',
    env: 'frost',
    prefix: 'fw',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Frozen Battlement Bridges',
    bossName: 'Rime-Forged Golem',
    nextLabel: 'Ascend to Borealis Keep',
    theme: FROST_THEME_A,
    layoutKind: 'split_decks',
    brazierLabel: 'Blue-Flame Hearth (+2 MP)',
    chestLabel: 'Citadel Relic Coffer (+Potion & Shards)',
    altarLabel: 'Warden Oathstone (Choose 1 of 3)',
    fountainLabel: 'Thermal Melt-Pool (+2 HP / +2 MP)',
    tunnelChestLabel: 'Ice-Cellar Stash (+Potion & Shards)',
    spawns: [
      { type: 'knight', x: 800, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'gargoyle', x: 1520, y: 615, facing: -1, patrolRadius: 150 },
      { type: 'runed_golem', x: 1940, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'acolyte', x: 2360, y: 680, facing: -1, patrolRadius: 140 },
      { type: 'knight', x: 2820, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_slag_titan', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'frost_wardens',
    env: 'frost',
    prefix: 'fw',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Hall of Frozen Kings',
    bossName: 'Frost-Blade Champion',
    nextLabel: 'Confront High Warden Borealis',
    theme: FROST_THEME_B,
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'Blue-Flame Hearth (+2 MP)',
    chestLabel: 'High-Warden Chest (+Potion & Shards)',
    altarLabel: 'Glacier Crest Shrine (Choose 1 of 3)',
    fountainLabel: 'Thermal Melt-Pool (+2 HP / +2 MP)',
    tunnelChestLabel: 'Frozen Crypt Stash (+Potion & Shards)',
    spawns: [
      { type: 'runed_golem', x: 780, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'wraith', x: 1220, y: 520, facing: -1, patrolRadius: 180 },
      { type: 'knight', x: 1720, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'gargoyle', x: 2260, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'acolyte', x: 2780, y: 545, facing: -1, patrolRadius: 150 },
      { type: 'boss_infernal_knight', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'frost_wardens',
    env: 'frost',
    prefix: 'fw',
    name: 'Final Boss · Summit of Frostwarden Citadel',
    bossName: 'High Warden Borealis · Glacier Sentinel',
    bossType: 'boss_colossus',
    doorLabel: 'Claim Glacial Warden Shard & Return to Camp',
    theme: FROST_THEME_A,
  }),
];

// ============================================================================
// 16. IRONHORN BLOODLANDS (Barbaric Nation)
// ============================================================================
export const BARBARIC_RAID_ROOMS: StageDef[] = [
  makeExpandedRoom({
    raidId: 'barbaric_nation',
    env: 'barbaric',
    prefix: 'bn',
    index: 0,
    roomNumber: 1,
    name: 'Room 1/4 · Mammoth-Tusk Border Gate',
    bossName: 'Blood-Axe Champion',
    nextLabel: 'March into the War-Camp',
    theme: BARBARIC_THEME_A,
    layoutKind: 'split_decks',
    brazierLabel: 'War-Pyre Brazier (+2 MP)',
    chestLabel: 'Clan Spoils Chest (+Potion & Shards)',
    altarLabel: 'Bone-Totem Shrine (Choose 1 of 3)',
    fountainLabel: 'Blood-Mead Cauldron (+2 HP / +2 MP)',
    tunnelChestLabel: 'Raider Pit-Stash (+Potion & Shards)',
    spawns: [
      { type: 'dwarf_miner', x: 760, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_archer', x: 1120, y: 620, facing: -1, patrolRadius: 130 },
      { type: 'goblin_brute', x: 1720, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_shaman', x: 2180, y: 680, facing: -1, patrolRadius: 140 },
      { type: 'dwarf_miner', x: 2760, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_goblin_chief', x: 3790, y: FLOOR, facing: -1, patrolRadius: 340 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'barbaric_nation',
    env: 'barbaric',
    prefix: 'bn',
    index: 1,
    roomNumber: 2,
    name: 'Room 2/4 · Spiked Timber Palisade',
    bossName: 'Bone-Caller Shaman',
    nextLabel: 'Cross the Red-Earth Canyon',
    theme: BARBARIC_THEME_B,
    layoutKind: 'high_spire',
    brazierLabel: 'War-Pyre Brazier (+2 MP)',
    chestLabel: 'Ironhorn Loot Crate (+Potion & Shards)',
    altarLabel: 'Skull-Banner Altar (Choose 1 of 3)',
    fountainLabel: 'Blood-Mead Cauldron (+2 HP / +2 MP)',
    tunnelChestLabel: 'Under-Trench Stash (+Potion & Shards)',
    spawns: [
      { type: 'goblin_grunt', x: 760, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'goblin_shaman', x: 1120, y: 465, facing: -1, patrolRadius: 140 },
      { type: 'obsidian_guard', x: 1740, y: FLOOR, facing: -1, patrolRadius: 150 },
      { type: 'goblin_brute', x: 2260, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_archer', x: 2820, y: 555, facing: -1, patrolRadius: 130 },
      { type: 'boss_goblin_shaman', x: 3790, y: FLOOR, facing: -1, patrolRadius: 350 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'barbaric_nation',
    env: 'barbaric',
    prefix: 'bn',
    index: 2,
    roomNumber: 3,
    name: 'Room 3/4 · Pit-Hulk Proving Grounds',
    bossName: 'Grim-Tusk Behemoth',
    nextLabel: 'Approach the Great War-Pyre',
    theme: BARBARIC_THEME_A,
    layoutKind: 'stepped_keep',
    brazierLabel: 'War-Pyre Brazier (+2 MP)',
    chestLabel: 'Champion’s War-Chest (+Potion & Shards)',
    altarLabel: 'Ironhorn Monolith (Choose 1 of 3)',
    fountainLabel: 'Blood-Mead Cauldron (+2 HP / +2 MP)',
    tunnelChestLabel: 'Gladiator Den Stash (+Potion & Shards)',
    spawns: [
      { type: 'goblin_brute', x: 800, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_shaman', x: 1120, y: 605, facing: -1, patrolRadius: 140 },
      { type: 'obsidian_guard', x: 1740, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'dwarf_miner', x: 2260, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'goblin_brute', x: 2780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_goblin_behemoth', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeExpandedRoom({
    raidId: 'barbaric_nation',
    env: 'barbaric',
    prefix: 'bn',
    index: 3,
    roomNumber: 4,
    name: 'Room 4/4 · Ironhorn Bone-Citadel',
    bossName: 'War-Hulk Executioner',
    nextLabel: 'Challenge Warchief Kragg',
    theme: BARBARIC_THEME_B,
    layoutKind: 'gauntlet_hall',
    brazierLabel: 'War-Pyre Brazier (+2 MP)',
    chestLabel: 'Warchief Tribute Vault (+Potion & Shards)',
    altarLabel: 'Bloodclan Shrine (Choose 1 of 3)',
    fountainLabel: 'Blood-Mead Cauldron (+2 HP / +2 MP)',
    tunnelChestLabel: 'Bone-Vault Stash (+Potion & Shards)',
    spawns: [
      { type: 'obsidian_guard', x: 780, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'goblin_shaman', x: 1220, y: 590, facing: -1, patrolRadius: 140 },
      { type: 'goblin_brute', x: 1740, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'obsidian_guard', x: 2260, y: FLOOR, facing: -1, patrolRadius: 170 },
      { type: 'goblin_brute', x: 2800, y: FLOOR, facing: -1, patrolRadius: 160 },
      { type: 'boss_dwarf_king', x: 3790, y: FLOOR, facing: -1, patrolRadius: 360 },
    ],
  }),
  makeFinalBossRoom({
    raidId: 'barbaric_nation',
    env: 'barbaric',
    prefix: 'bn',
    name: 'Final Boss · Great Pyre of Ironhorn',
    bossName: 'Warchief Kragg Ironhorn · Blood-Titan',
    bossType: 'boss_forge_lord',
    doorLabel: 'Claim Ironhorn War-Tusk & Return to Camp',
    theme: BARBARIC_THEME_A,
  }),
];

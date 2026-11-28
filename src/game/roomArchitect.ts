import { buildEnemies, EnemySpawn, withUndergroundPassage } from './level';
import { EnemyType, HidingSpot, Interactable, Platform, RaidId, StageDef, TorchProp } from './types';

export type RoomArchetype =
  | 'sky_spire'
  | 'sunken_depths'
  | 'swarm_gauntlet'
  | 'split_citadel'
  | 'switchback_keep'
  | 'catacomb_vault';

interface RaidBiomeRoster {
  ground: EnemyType[];
  ranged: EnemyType[];
  heavy: EnemyType[];
  aerial: EnemyType[];
  highPlatformStyle: Platform['style'];
  midPlatformStyle: Platform['style'];
  assistPadStyle?: Platform['style'];
}

const BIOME_ROSTERS: Record<RaidId, RaidBiomeRoster> = {
  nocturne_castle: {
    ground: ['ghoul', 'skeleton'],
    ranged: ['skeleton'],
    heavy: ['knight'],
    aerial: ['bat'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
  goblin_camp: {
    ground: ['goblin_grunt', 'goblin_bomber'],
    ranged: ['goblin_archer', 'goblin_shaman'],
    heavy: ['goblin_brute'],
    aerial: ['goblin_shaman'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
  weeping_necropolis: {
    ground: ['grave_hound', 'acolyte'],
    ranged: ['acolyte', 'wraith'],
    heavy: ['gargoyle'],
    aerial: ['wraith', 'gargoyle'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'stone',
  },
  brimstone_sanctum: {
    ground: ['obsidian_guard', 'ember_imp'],
    ranged: ['ember_imp'],
    heavy: ['obsidian_guard'],
    aerial: ['ember_imp'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'bridge',
  },
  mushroom_kingdom: {
    ground: ['spore_hopper', 'cap_brute'],
    ranged: ['mycelium_spitter'],
    heavy: ['cap_brute'],
    aerial: ['spore_hopper'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
    assistPadStyle: 'bounce_cap',
  },
  sand_fortress: {
    ground: ['dune_stalker', 'scarab_swarmer'],
    ranged: ['sun_acolyte'],
    heavy: ['dune_stalker'],
    aerial: ['sun_acolyte'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
  alien_ship: {
    ground: ['void_stalker', 'mech_turret'],
    ranged: ['plasma_drone', 'mech_turret'],
    heavy: ['mech_turret'],
    aerial: ['plasma_drone'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'bridge',
  },
  dragon_crane: {
    ground: ['crane_disciple'],
    ranged: ['jade_sentinel'],
    heavy: ['crane_disciple'],
    aerial: ['cloud_wyrmling', 'jade_sentinel'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
    assistPadStyle: 'wind_pad',
  },
  dwarven_mines: {
    ground: ['dwarf_miner', 'dwarf_sapper'],
    ranged: ['dwarf_sapper'],
    heavy: ['runed_golem'],
    aerial: ['dwarf_sapper'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
  cyberpunk_city: {
    ground: ['void_stalker', 'goblin_bomber'],
    ranged: ['plasma_drone', 'mech_turret'],
    heavy: ['mech_turret'],
    aerial: ['plasma_drone'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'bridge',
  },
  pirate_armada: {
    ground: ['goblin_grunt', 'goblin_bomber'],
    ranged: ['goblin_archer', 'goblin_bomber'],
    heavy: ['knight', 'goblin_brute'],
    aerial: ['bat', 'goblin_archer'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
  ghost_paradox: {
    ground: ['skeleton', 'void_stalker'],
    ranged: ['wraith', 'plasma_drone', 'acolyte'],
    heavy: ['gargoyle', 'mech_turret'],
    aerial: ['wraith', 'bat'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'stone',
  },
  noble_mansion: {
    ground: ['skeleton', 'ghoul'],
    ranged: ['acolyte', 'bat'],
    heavy: ['knight'],
    aerial: ['bat', 'wraith'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'stone',
  },
  underwater_city: {
    ground: ['spore_hopper', 'jade_sentinel'],
    ranged: ['mycelium_spitter', 'jade_sentinel'],
    heavy: ['cap_brute', 'jade_sentinel'],
    aerial: ['cloud_wyrmling', 'wraith'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'bridge',
    assistPadStyle: 'wind_pad',
  },
  frost_wardens: {
    ground: ['knight', 'acolyte'],
    ranged: ['acolyte', 'wraith'],
    heavy: ['runed_golem', 'gargoyle'],
    aerial: ['gargoyle', 'wraith'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'stone',
  },
  barbaric_nation: {
    ground: ['dwarf_miner', 'goblin_grunt'],
    ranged: ['goblin_shaman', 'goblin_archer'],
    heavy: ['goblin_brute', 'obsidian_guard'],
    aerial: ['goblin_shaman'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
  eclipse_gauntlet: {
    ground: ['ghoul', 'knight'],
    ranged: ['skeleton'],
    heavy: ['obsidian_guard'],
    aerial: ['bat'],
    highPlatformStyle: 'rafter',
    midPlatformStyle: 'timber',
  },
};

const ARCHETYPE_ORDER: RoomArchetype[] = [
  'sky_spire',
  'sunken_depths',
  'switchback_keep',
  'swarm_gauntlet',
  'split_citadel',
  'catacomb_vault',
];

const ARCHETYPE_BADGE: Record<RoomArchetype, string> = {
  sky_spire: 'Sky Citadel',
  sunken_depths: 'Abyssal Shafts',
  swarm_gauntlet: 'Bastion Gauntlet',
  split_citadel: 'Twin-Track Labyrinth',
  switchback_keep: 'Switchback Keep',
  catacomb_vault: 'Catacomb Vault',
};

function pickFrom<T>(arr: T[], idx: number): T {
  return arr[((idx % arr.length) + arr.length) % arr.length];
}

/**
 * Elaborates each standard raid room (Rooms 1..4) into a complex, multi-route
 * architectural setpiece — rotating 6 distinct vertical & subterranean designs
 * (Sky Citadel, Abyssal Shafts, Switchback Keep, Bastion Gauntlet, Twin-Track
 * Labyrinth, and Catacomb Vault) with stealth loops, crumbling bridges, wall
 * piers, high treasure lofts, and layered enemy patrols.
 */
export function elaborateRaidRooms(
  raidId: RaidId,
  raidSeedIndex: number,
  stages: StageDef[]
): StageDef[] {
  const roster = BIOME_ROSTERS[raidId];

  return stages.map((rawStage, idx) => {
    if (rawStage.isCamp || rawStage.isBigBossRoom || rawStage.isBossGauntletRoom) {
      return rawStage;
    }

    const archetype = ARCHETYPE_ORDER[(raidSeedIndex * 2 + idx) % ARCHETYPE_ORDER.length];
    const floorY = rawStage.floorY;
    const safeMaxX = Math.min(rawStage.bossZoneStartX - 110, rawStage.worldWidth - 1080);
    const idTag = `arch-${raidId.slice(0, 3)}-r${rawStage.roomNumber}`;

    let stage: StageDef = rawStage;
    const extraPlatforms: Platform[] = [];
    const extraTorches: TorchProp[] = [];
    const extraInteractables: Interactable[] = [];
    const extraHiding: HidingSpot[] = [];
    const extraSpawns: EnemySpawn[] = [];

    if (archetype === 'sky_spire') {
      // SKY CITADEL: 4-tier soaring rooftop & spire-bridge network with vertical wall-jump chimney,
      // crumbling skywalk, elevated stealth alcove, and high treasure loft!
      const hiY1 = floorY - 315;
      const hiY2 = floorY - 455;
      const hiY3 = floorY - 585;

      if (roster.assistPadStyle) {
        extraPlatforms.push(
          { id: `${idTag}-pad1`, x: 450, y: floorY - 24, w: 108, h: 24, oneWay: true, style: roster.assistPadStyle },
          { id: `${idTag}-pad2`, x: 1580, y: floorY - 24, w: 108, h: 24, oneWay: true, style: roster.assistPadStyle }
        );
      } else {
        extraPlatforms.push(
          { id: `${idTag}-step1`, x: 440, y: floorY - 118, w: 155, h: 18, oneWay: true, style: roster.midPlatformStyle },
          { id: `${idTag}-step2`, x: 635, y: floorY - 222, w: 165, h: 18, oneWay: true, style: roster.midPlatformStyle }
        );
      }

      extraPlatforms.push(
        // Vertical spire pier for wall-jump & stealth ambush drops
        { id: `${idTag}-spire-pier`, x: 1075, y: hiY1 - 40, w: 46, h: 195, style: 'pillar' },
        { id: `${idTag}-hi1`, x: 785, y: hiY1, w: 270, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-hi2`, x: 1150, y: hiY2, w: 310, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-crumble-sky`, x: 1475, y: hiY2 - 55, w: 120, h: 16, oneWay: true, style: 'bridge', crumbling: true },
        { id: `${idTag}-hi3`, x: 1615, y: hiY3, w: 335, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-mid-shortcut`, x: 1660, y: hiY1 + 25, w: 240, h: 18, oneWay: true, style: roster.midPlatformStyle, crumbling: true },
        { id: `${idTag}-hi4`, x: 2010, y: hiY2, w: 300, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-hi5`, x: Math.min(2380, safeMaxX - 270), y: hiY1, w: 260, h: 20, oneWay: true, style: roster.highPlatformStyle }
      );

      extraTorches.push(
        { x: 1300, y: hiY2 - 64, phase: 0.7 },
        { x: 1780, y: hiY3 - 64, phase: 2.1 },
        { x: 2160, y: hiY2 - 64, phase: 3.4 }
      );

      extraHiding.push(
        { id: `${idTag}-sky-hide1`, x: 1220, y: hiY2, w: 62, h: 90, kind: 'curtain' },
        { id: `${idTag}-sky-hide2`, x: 1840, y: floorY, w: 64, h: 92, kind: 'alcove' }
      );

      extraInteractables.push({
        id: `${idTag}-sky-chest`,
        kind: 'chest',
        x: 1780,
        y: hiY3,
        label: 'Sky-Citadel Loft Cache (+Potion & Shards)',
        used: false,
      });

      extraSpawns.push(
        { type: pickFrom(roster.ranged, idx), x: 920, y: hiY1, facing: -1, patrolRadius: 95 },
        { type: pickFrom(roster.ground, idx + 1), x: 1320, y: hiY2, facing: -1, patrolRadius: 115 },
        { type: pickFrom(roster.aerial, idx), x: 1780, y: hiY3 - 48, facing: -1, patrolRadius: 145 },
        { type: pickFrom(roster.heavy, idx), x: 1790, y: hiY3, facing: -1, patrolRadius: 110 },
        { type: pickFrom(roster.ground, idx), x: 2150, y: hiY2, facing: -1, patrolRadius: 110 },
        { type: pickFrom(roster.ranged, idx + 1), x: Math.min(2490, safeMaxX - 110), y: hiY1, facing: -1, patrolRadius: 90 }
      );
    } else if (archetype === 'sunken_depths') {
      // ABYSSAL SHAFTS: 2-level subterranean descent with split undercrofts, hanging climb rungs,
      // flanking mid-surface battlements, and deep cellar guards!
      const alreadyHasFrontUg = stage.platforms.some(
        (pl) => pl.style === 'underground' && pl.x < 1300
      );
      if (!alreadyHasFrontUg) {
        stage = withUndergroundPassage(stage, {
          idPrefix: `${idTag}-front`,
          startX: 440,
          endX: 1580,
          grateInX: 500,
          grateOutX: 1410,
          chestLabel: 'Deep Undercroft Strongbox (+Potion & Shards)',
        });
      }

      const deepFloorY = floorY + 276;
      const expandedHeight = Math.max(stage.worldHeight, floorY + 470);
      const deepPlatforms: Platform[] = stage.platforms.map((pl) =>
        pl.id === 'wall-left' || pl.id === 'wall-right' ? { ...pl, h: expandedHeight } : pl
      );

      const deepStartX = 650;
      const deepEndX = 1350;
      const finalPlats: Platform[] = [];
      for (const pl of deepPlatforms) {
        if (pl.style === 'underground' && pl.x < 1000 && pl.x + pl.w > 1000) {
          if (pl.x < deepStartX) {
            finalPlats.push({ ...pl, id: `${pl.id}-dL`, w: deepStartX - pl.x });
          }
          finalPlats.push(
            { id: `${idTag}-sub-grate1`, x: deepStartX, y: pl.y, w: 115, h: 16, oneWay: true, style: 'grate' },
            { id: `${idTag}-sub-bridge`, x: deepStartX + 115, y: pl.y, w: deepEndX - deepStartX - 230, h: 22, style: 'underground' },
            { id: `${idTag}-sub-grate2`, x: deepEndX - 115, y: pl.y, w: 115, h: 16, oneWay: true, style: 'grate' }
          );
          if (pl.x + pl.w > deepEndX) {
            finalPlats.push({ ...pl, id: `${pl.id}-dR`, x: deepEndX, w: pl.x + pl.w - deepEndX });
          }
        } else {
          finalPlats.push(pl);
        }
      }

      finalPlats.push(
        {
          id: `${idTag}-deep-floor`,
          x: deepStartX - 30,
          y: deepFloorY,
          w: deepEndX - deepStartX + 60,
          h: expandedHeight - deepFloorY,
          style: 'underground',
        },
        { id: `${idTag}-deep-rung1`, x: deepStartX + 14, y: floorY + 210, w: 88, h: 14, oneWay: true, style: 'bridge' },
        { id: `${idTag}-deep-rung2`, x: deepEndX - 102, y: floorY + 210, w: 88, h: 14, oneWay: true, style: 'bridge' },
        // Elevated surface overwatch gallery spanning above the shaft exit
        { id: `${idTag}-surf-gal1`, x: 1640, y: floorY - 195, w: 250, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-surf-gal2`, x: 1960, y: floorY - 310, w: 270, h: 18, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-surf-crumble`, x: Math.min(2280, safeMaxX - 240), y: floorY - 220, w: 200, h: 16, oneWay: true, style: 'bridge', crumbling: true }
      );

      stage = {
        ...stage,
        worldHeight: expandedHeight,
        platforms: finalPlats,
      };

      extraTorches.push(
        { x: deepStartX + 95, y: deepFloorY - 72, phase: 0.6 },
        { x: (deepStartX + deepEndX) * 0.5, y: deepFloorY - 72, phase: 2.2 },
        { x: deepEndX - 95, y: deepFloorY - 72, phase: 3.7 }
      );

      extraHiding.push(
        { id: `${idTag}-ug-hide`, x: 1000, y: deepFloorY, w: 66, h: 92, kind: 'alcove' },
        { id: `${idTag}-surf-hide`, x: 1750, y: floorY, w: 64, h: 92, kind: 'curtain' }
      );

      extraInteractables.push({
        id: `${idTag}-deep-shrine`,
        kind: 'brazier',
        x: 1000,
        y: deepFloorY,
        label: 'Deep Cavern Brazier (+2 MP)',
        used: false,
      });

      extraSpawns.push(
        { type: pickFrom(roster.ground, idx), x: 860, y: floorY + 148, facing: -1, patrolRadius: 110 },
        { type: pickFrom(roster.heavy, idx), x: 1020, y: deepFloorY, facing: -1, patrolRadius: 150 },
        { type: pickFrom(roster.ranged, idx), x: 1210, y: deepFloorY, facing: -1, patrolRadius: 90 },
        { type: pickFrom(roster.ranged, idx + 1), x: 1760, y: floorY - 195, facing: -1, patrolRadius: 95 },
        { type: pickFrom(roster.aerial, idx), x: 2090, y: floorY - 360, facing: -1, patrolRadius: 130 },
        { type: pickFrom(roster.ground, idx + 1), x: Math.min(2560, safeMaxX - 120), y: floorY, facing: -1, patrolRadius: 120 }
      );
    } else if (archetype === 'switchback_keep') {
      // SWITCHBACK KEEP: Zig-zagging tiered fortress ascent with overlapping ambush decks,
      // solid bastion walls for vertical leaps/wall-clings, and crumbling cross-bridges!
      const tier1 = floorY - 140;
      const tier2 = floorY - 275;
      const tier3 = floorY - 415;
      const tier4 = floorY - 540;

      extraPlatforms.push(
        { id: `${idTag}-sb-wall1`, x: 760, y: tier2, w: 54, h: 275, style: 'pillar' },
        { id: `${idTag}-sb-t1`, x: 520, y: tier1, w: 225, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-sb-t2`, x: 830, y: tier2, w: 280, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-sb-t3`, x: 580, y: tier3, w: 260, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-sb-cr1`, x: 870, y: tier3 - 35, w: 165, h: 16, oneWay: true, style: 'bridge', crumbling: true },
        { id: `${idTag}-sb-t4`, x: 1085, y: tier4, w: 320, h: 20, oneWay: true, style: roster.highPlatformStyle },
        // Second switchback descent tower
        { id: `${idTag}-sb-wall2`, x: 1620, y: tier2, w: 54, h: 275, style: 'pillar' },
        { id: `${idTag}-sb-d1`, x: 1475, y: tier3, w: 260, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-sb-d2`, x: 1715, y: tier2, w: 290, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-sb-cr2`, x: 2045, y: tier2 - 40, w: 165, h: 16, oneWay: true, style: 'bridge', crumbling: true },
        { id: `${idTag}-sb-d3`, x: Math.min(2260, safeMaxX - 250), y: tier1, w: 245, h: 18, oneWay: true, style: roster.midPlatformStyle }
      );

      extraTorches.push(
        { x: 710, y: tier3 - 64, phase: 0.5 },
        { x: 1245, y: tier4 - 64, phase: 1.9 },
        { x: 1860, y: tier2 - 64, phase: 3.1 }
      );

      extraHiding.push(
        { id: `${idTag}-sb-h1`, x: 960, y: floorY, w: 66, h: 94, kind: 'alcove' },
        { id: `${idTag}-sb-h2`, x: 1180, y: tier4, w: 62, h: 88, kind: 'curtain' },
        { id: `${idTag}-sb-h3`, x: 1840, y: floorY, w: 66, h: 94, kind: 'alcove' }
      );

      extraInteractables.push({
        id: `${idTag}-sb-chest`,
        kind: 'chest',
        x: 1245,
        y: tier4,
        label: 'Keep Battlement Strongbox (+Potion & Shards)',
        used: false,
      });

      extraSpawns.push(
        { type: pickFrom(roster.ground, idx), x: 630, y: tier1, facing: -1, patrolRadius: 90 },
        { type: pickFrom(roster.ranged, idx), x: 960, y: tier2, facing: -1, patrolRadius: 105 },
        { type: pickFrom(roster.heavy, idx), x: 1265, y: tier4, facing: -1, patrolRadius: 115 },
        { type: pickFrom(roster.aerial, idx), x: 1590, y: tier3 - 55, facing: -1, patrolRadius: 135 },
        { type: pickFrom(roster.ground, idx + 1), x: 1860, y: tier2, facing: -1, patrolRadius: 110 },
        { type: pickFrom(roster.ranged, idx + 1), x: Math.min(2380, safeMaxX - 105), y: tier1, facing: -1, patrolRadius: 95 }
      );
    } else if (archetype === 'swarm_gauntlet') {
      // BASTION GAUNTLET: High enemy density (+8 foes!), 3-tier overlapping kill-box decks,
      // fortified stealth curtains & tactical flanking bridges for massive Shadow Chains!
      const lowY = floorY - 145;
      const midY = floorY - 275;
      const upperY = floorY - 415;

      extraPlatforms.push(
        { id: `${idTag}-g1`, x: 580, y: lowY, w: 255, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-g2`, x: 910, y: midY, w: 265, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-g3`, x: 1235, y: upperY, w: 295, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-g-cr`, x: 1560, y: midY, w: 175, h: 16, oneWay: true, style: 'bridge', crumbling: true },
        { id: `${idTag}-g4`, x: 1790, y: lowY, w: 270, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-g5`, x: 2085, y: midY, w: 265, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-g6`, x: Math.min(2390, safeMaxX - 245), y: upperY, w: 250, h: 20, oneWay: true, style: roster.highPlatformStyle }
      );

      extraHiding.push(
        { id: `${idTag}-h1`, x: 990, y: floorY, w: 66, h: 96, kind: 'curtain' },
        { id: `${idTag}-h2`, x: 1380, y: upperY, w: 62, h: 88, kind: 'curtain' },
        { id: `${idTag}-h3`, x: 1700, y: floorY, w: 66, h: 96, kind: 'alcove' },
        { id: `${idTag}-h4`, x: Math.min(2640, safeMaxX - 80), y: floorY, w: 66, h: 96, kind: 'curtain' }
      );

      extraSpawns.push(
        { type: pickFrom(roster.ground, idx), x: 700, y: lowY, facing: -1, patrolRadius: 95 },
        { type: pickFrom(roster.ranged, idx), x: 1040, y: midY, facing: -1, patrolRadius: 95 },
        { type: pickFrom(roster.ground, idx + 1), x: 1140, y: floorY, facing: 1, patrolRadius: 110 },
        { type: pickFrom(roster.heavy, idx), x: 1380, y: upperY, facing: -1, patrolRadius: 115 },
        { type: pickFrom(roster.ground, idx), x: 1920, y: lowY, facing: -1, patrolRadius: 105 },
        { type: pickFrom(roster.aerial, idx), x: 2180, y: midY - 65, facing: -1, patrolRadius: 130 },
        { type: pickFrom(roster.ground, idx + 1), x: 2290, y: floorY, facing: -1, patrolRadius: 130 },
        { type: pickFrom(roster.ranged, idx + 1), x: Math.min(2515, safeMaxX - 105), y: upperY, facing: -1, patrolRadius: 95 }
      );
    } else if (archetype === 'catacomb_vault') {
      // CATACOMB VAULT: Dual-loop figure-8 layout combining a front undercroft tunnel,
      // an elevated central gallery, and a rear secret cellar beneath the approach!
      const alreadyHasFrontUg = stage.platforms.some(
        (pl) => pl.style === 'underground' && pl.x < 1300
      );
      if (!alreadyHasFrontUg) {
        stage = withUndergroundPassage(stage, {
          idPrefix: `${idTag}-cv-front`,
          startX: 520,
          endX: 1360,
          grateInX: 580,
          grateOutX: 1210,
          chestLabel: 'Catacomb Relic Vault (+Potion & Shards)',
        });
      }

      const hiY = floorY - 340;
      const midY = floorY - 190;
      extraPlatforms.push(
        { id: `${idTag}-cv-step1`, x: 460, y: floorY - 120, w: 150, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-cv-mid1`, x: 780, y: midY, w: 250, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-cv-hi1`, x: 1060, y: hiY, w: 320, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-cv-cr1`, x: 1415, y: hiY - 30, w: 175, h: 16, oneWay: true, style: 'bridge', crumbling: true },
        { id: `${idTag}-cv-hi2`, x: 1640, y: hiY, w: 310, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-cv-pillar`, x: 1990, y: midY, w: 50, h: 190, style: 'pillar' },
        { id: `${idTag}-cv-mid2`, x: Math.min(2090, safeMaxX - 260), y: midY, w: 265, h: 18, oneWay: true, style: roster.midPlatformStyle }
      );

      extraTorches.push(
        { x: 1220, y: hiY - 64, phase: 0.9 },
        { x: 1790, y: hiY - 64, phase: 2.4 }
      );

      extraHiding.push(
        { id: `${idTag}-cv-h1`, x: 900, y: floorY + 148, w: 62, h: 88, kind: 'alcove' },
        { id: `${idTag}-cv-h2`, x: 1760, y: hiY, w: 62, h: 88, kind: 'curtain' }
      );

      extraSpawns.push(
        { type: pickFrom(roster.ground, idx), x: 880, y: floorY + 148, facing: -1, patrolRadius: 115 },
        { type: pickFrom(roster.ranged, idx), x: 910, y: midY, facing: -1, patrolRadius: 95 },
        { type: pickFrom(roster.heavy, idx), x: 1220, y: hiY, facing: -1, patrolRadius: 120 },
        { type: pickFrom(roster.aerial, idx), x: 1520, y: hiY - 60, facing: -1, patrolRadius: 135 },
        { type: pickFrom(roster.ground, idx + 1), x: 1790, y: hiY, facing: -1, patrolRadius: 115 },
        { type: pickFrom(roster.ranged, idx + 1), x: Math.min(2210, safeMaxX - 110), y: midY, facing: -1, patrolRadius: 95 }
      );
    } else {
      // SPLIT CITADEL: True 3-lane twin-track labyrinth — soaring upper battlements,
      // treacherous crumbling mid-catwalks, and guarded lower trench with ambush drop piers!
      const midY = floorY - 195;
      const hiY = floorY - 395;

      extraPlatforms.push(
        { id: `${idTag}-sp-step`, x: 495, y: floorY - 130, w: 175, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-sp-mid1`, x: 830, y: midY, w: 260, h: 18, oneWay: true, style: roster.midPlatformStyle, crumbling: true },
        { id: `${idTag}-sp-pier1`, x: 1130, y: midY - 35, w: 48, h: 230, style: 'pillar' },
        { id: `${idTag}-sp-hi1`, x: 920, y: hiY, w: 315, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-sp-hi2`, x: 1380, y: hiY - 55, w: 315, h: 20, oneWay: true, style: roster.highPlatformStyle },
        { id: `${idTag}-sp-mid2`, x: 1410, y: midY + 10, w: 255, h: 18, oneWay: true, style: roster.midPlatformStyle },
        { id: `${idTag}-sp-mid3`, x: 1760, y: midY, w: 260, h: 18, oneWay: true, style: roster.midPlatformStyle, crumbling: true },
        { id: `${idTag}-sp-hi3`, x: Math.min(2100, safeMaxX - 310), y: hiY, w: 305, h: 20, oneWay: true, style: roster.highPlatformStyle }
      );

      extraTorches.push(
        { x: 1075, y: hiY - 64, phase: 1.2 },
        { x: 1535, y: hiY - 118, phase: 2.8 },
        { x: Math.min(2250, safeMaxX - 150), y: hiY - 64, phase: 4.1 }
      );

      extraInteractables.push({
        id: `${idTag}-split-chest`,
        kind: 'chest',
        x: 1535,
        y: hiY - 55,
        label: 'Upper Gallery Strongbox (+Potion & Shards)',
        used: false,
      });

      extraHiding.push(
        { id: `${idTag}-sp-hide1`, x: 1510, y: floorY, w: 66, h: 96, kind: 'alcove' },
        { id: `${idTag}-sp-hide2`, x: 1510, y: midY + 10, w: 62, h: 88, kind: 'curtain' }
      );

      extraSpawns.push(
        { type: pickFrom(roster.ranged, idx), x: 1080, y: hiY, facing: -1, patrolRadius: 115 },
        { type: pickFrom(roster.ground, idx), x: 1460, y: floorY, facing: 1, patrolRadius: 120 },
        { type: pickFrom(roster.ground, idx + 1), x: 1535, y: midY + 10, facing: -1, patrolRadius: 95 },
        { type: pickFrom(roster.aerial, idx), x: 1890, y: midY - 75, facing: -1, patrolRadius: 140 },
        { type: pickFrom(roster.heavy, idx), x: Math.min(2250, safeMaxX - 155), y: hiY, facing: -1, patrolRadius: 110 }
      );
    }

    const baseCreateEnemies = stage.createEnemies;
    const roomHpBonus = Math.floor(idx / 2);

    return {
      ...stage,
      name: `${stage.name} · ${ARCHETYPE_BADGE[archetype]}`,
      platforms: [...stage.platforms, ...extraPlatforms],
      torches: [...stage.torches, ...extraTorches],
      interactables: [...stage.interactables, ...extraInteractables],
      hidingSpots: [...stage.hidingSpots, ...extraHiding],
      createEnemies: (hpMult = 1, flatHpBonus = 0) => {
        const base = baseCreateEnemies(hpMult, flatHpBonus);
        const added = buildEnemies(extraSpawns, roomHpBonus, hpMult, flatHpBonus).map((e, i) => ({
          ...e,
          id: 200 + i + 1,
        }));
        return [...base, ...added];
      },
    };
  });
}

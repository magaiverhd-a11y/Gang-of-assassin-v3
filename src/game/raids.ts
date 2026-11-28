import {
  BARBARIC_RAID_ROOMS,
  CYBERPUNK_RAID_ROOMS,
  FROST_WARDENS_RAID_ROOMS,
  GHOST_PARADOX_RAID_ROOMS,
  NOBLE_MANSION_RAID_ROOMS,
  PIRATE_RAID_ROOMS,
  UNDERWATER_RAID_ROOMS,
} from './expandedRaids';
import {
  BRIMSTONE_RAID_ROOMS,
  ECLIPSE_GAUNTLET_ROOMS,
  NECROPOLIS_RAID_ROOMS,
} from './extraRaids';
import { GOBLIN_RAID_ROOMS, NOCTURNE_RAID_ROOMS } from './level';
import {
  ALIEN_RAID_ROOMS,
  DRAGON_CRANE_RAID_ROOMS,
  DWARVEN_MINES_RAID_ROOMS,
  MUSHROOM_RAID_ROOMS,
  SAND_RAID_ROOMS,
} from './newRaids';
import { elaborateRaidRooms } from './roomArchitect';
import { RaidId, StageDef } from './types';

export const RAIDS_BY_ID: Record<RaidId, StageDef[]> = {
  nocturne_castle: elaborateRaidRooms('nocturne_castle', 0, NOCTURNE_RAID_ROOMS),
  goblin_camp: elaborateRaidRooms('goblin_camp', 1, GOBLIN_RAID_ROOMS),
  weeping_necropolis: elaborateRaidRooms('weeping_necropolis', 2, NECROPOLIS_RAID_ROOMS),
  brimstone_sanctum: elaborateRaidRooms('brimstone_sanctum', 3, BRIMSTONE_RAID_ROOMS),
  mushroom_kingdom: elaborateRaidRooms('mushroom_kingdom', 4, MUSHROOM_RAID_ROOMS),
  sand_fortress: elaborateRaidRooms('sand_fortress', 5, SAND_RAID_ROOMS),
  alien_ship: elaborateRaidRooms('alien_ship', 6, ALIEN_RAID_ROOMS),
  dragon_crane: elaborateRaidRooms('dragon_crane', 7, DRAGON_CRANE_RAID_ROOMS),
  dwarven_mines: elaborateRaidRooms('dwarven_mines', 8, DWARVEN_MINES_RAID_ROOMS),
  cyberpunk_city: elaborateRaidRooms('cyberpunk_city', 9, CYBERPUNK_RAID_ROOMS),
  pirate_armada: elaborateRaidRooms('pirate_armada', 10, PIRATE_RAID_ROOMS),
  ghost_paradox: elaborateRaidRooms('ghost_paradox', 11, GHOST_PARADOX_RAID_ROOMS),
  noble_mansion: elaborateRaidRooms('noble_mansion', 12, NOBLE_MANSION_RAID_ROOMS),
  underwater_city: elaborateRaidRooms('underwater_city', 13, UNDERWATER_RAID_ROOMS),
  frost_wardens: elaborateRaidRooms('frost_wardens', 14, FROST_WARDENS_RAID_ROOMS),
  barbaric_nation: elaborateRaidRooms('barbaric_nation', 15, BARBARIC_RAID_ROOMS),
  eclipse_gauntlet: ECLIPSE_GAUNTLET_ROOMS,
};

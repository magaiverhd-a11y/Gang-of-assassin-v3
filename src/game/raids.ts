import {
  BRIMSTONE_RAID_ROOMS,
  ECLIPSE_GAUNTLET_ROOMS,
  NECROPOLIS_RAID_ROOMS,
} from './extraRaids';
import { GOBLIN_RAID_ROOMS, NOCTURNE_RAID_ROOMS } from './level';
import { RaidId, StageDef } from './types';

export const RAIDS_BY_ID: Record<RaidId, StageDef[]> = {
  nocturne_castle: NOCTURNE_RAID_ROOMS,
  goblin_camp: GOBLIN_RAID_ROOMS,
  weeping_necropolis: NECROPOLIS_RAID_ROOMS,
  brimstone_sanctum: BRIMSTONE_RAID_ROOMS,
  eclipse_gauntlet: ECLIPSE_GAUNTLET_ROOMS,
};

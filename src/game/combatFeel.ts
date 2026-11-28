// attacks-v1: weapon-tier attack patterns and affinity combat feel (moderate numbers).
// Visual previews in Tune stay visual-only; these helpers always use the real element and real evo tier.
import { COMBINED_ELEMENTS, getActiveElementDef } from './defaults';
import { getFxProfile, type FxProfile } from './affinityFx';
import type { BaseElementId, CombinedElementId, Enemy, Player, TuningConfig, WeaponId } from './types';

export interface CombatTuning {
  /** Evolved weapons (every 5 upgrades) change the attack itself and ability [3]. */
  weaponEvoAttacks: boolean;
  /** Affinities change the basic attack and ability [3] (not just particles). */
  affinityAttacks: boolean;
  /** How much extra reach / size each evo tier adds. 1 = default. */
  evoReach: number;
  /** How strong the extra waves / pulses / finishers are. */
  evoPower: number;
  /** How strong affinity combat effects are (reach, splash, knockback, trails). */
  affinityPower: number;
  /** Wizard bolts and nova use the muted affinity palette instead of the bright element colour. */
  mutedBolts: boolean;
}

export const DEFAULT_COMBAT_TUNING: CombatTuning = {
  weaponEvoAttacks: true,
  affinityAttacks: true,
  evoReach: 1,
  evoPower: 1,
  affinityPower: 1,
  mutedBolts: true,
};

export function combatTune(t: TuningConfig): CombatTuning {
  return t.combat ?? DEFAULT_COMBAT_TUNING;
}

export function evoCombatTier(p: Player, t: TuningConfig): number {
  if (!combatTune(t).weaponEvoAttacks) return 0;
  return Math.min(5, Math.floor((1 + Math.max(0, p.weaponDamageBonus)) / 5));
}

export interface AffinityFlags {
  fire: boolean;
  water: boolean;
  air: boolean;
  earth: boolean;
  light: boolean;
  shadow: boolean;
  storm: boolean;
  glacial: boolean;
  venom: boolean;
  blood: boolean;
  metal: boolean;
  arcane: boolean;
  combined: boolean;
  id: string | null;
  profile: FxProfile | null;
}

const EMPTY_FLAGS: AffinityFlags = {
  fire: false,
  water: false,
  air: false,
  earth: false,
  light: false,
  shadow: false,
  storm: false,
  glacial: false,
  venom: false,
  blood: false,
  metal: false,
  arcane: false,
  combined: false,
  id: null,
  profile: null,
};

export function affFlags(p: Player, t: TuningConfig): AffinityFlags {
  if (!combatTune(t).affinityAttacks) return EMPTY_FLAGS;
  const def = getActiveElementDef(p.baseElements, p.combinedElement);
  if (!def) return EMPTY_FLAGS;
  const flags: AffinityFlags = { ...EMPTY_FLAGS, combined: def.isCombined, id: def.id, profile: getFxProfile(def.id) };
  if (!def.isCombined) {
    (flags as unknown as Record<string, unknown>)[def.id] = true;
    return flags;
  }
  const parents = (COMBINED_ELEMENTS[def.id as CombinedElementId]?.parents ?? []) as BaseElementId[];
  for (const el of parents) (flags as unknown as Record<string, unknown>)[el] = true;
  return flags;
}

/** Reach multiplier for melee hitboxes (and auto-attack reach). */
export function attackReachMul(weapon: WeaponId | string, tier: number, flags: AffinityFlags, c: CombatTuning): number {
  let m = 1 + 0.08 * tier * c.evoReach;
  if (weapon === 'rapier' || weapon === 'naginata' || weapon === 'whip' || weapon === 'estoc_spear' || weapon === 'joust_lance') {
    m += 0.03 * tier * c.evoReach;
  }
  if (flags.air || flags.storm) m += 0.12 * c.affinityPower;
  if (flags.metal) m += 0.06 * c.affinityPower;
  return m;
}

export function attackHeightMul(weapon: WeaponId | string, tier: number, flags: AffinityFlags, c: CombatTuning): number {
  let m = 1 + 0.04 * tier * c.evoReach;
  if (tier >= 1 && (weapon === 'whip' || weapon === 'ribbon_whip' || weapon === 'silk_whip' || weapon === 'rapier' || weapon === 'estoc_spear')) {
    m += 0.1 * c.evoReach;
  }
  if (tier >= 2 && (weapon === 'katana' || weapon === 'sword' || weapon === 'greataxe' || weapon === 'cleaver_greatsword' || weapon === 'war_fans')) {
    m += 0.08 * c.evoReach;
  }
  if (flags.earth || flags.glacial || flags.metal) m += 0.08 * c.affinityPower;
  return m;
}

/** Startup time multiplier (air/storm is snappier, earth a touch heavier). */
export function startupMul(_weapon: WeaponId | string, tier: number, flags: AffinityFlags, c: CombatTuning): number {
  let m = 1 - Math.min(0.18, tier * 0.035);
  if (flags.air || flags.storm) m *= 1 - 0.14 * c.affinityPower;
  if (flags.earth) m *= 1 + 0.04 * c.affinityPower;
  if (tier >= 2 && (_weapon === 'rapier' || _weapon === 'ash_wraps' || _weapon === 'shadow_daggers' || _weapon === 'estoc_spear' || _weapon === 'short_blade' || _weapon === 'war_fans')) {
    m *= 0.92;
  }
  return Math.max(0.62, m);
}

/** Extra hit pulses during the active window (second swing / afterimage / finisher). */
export function extraPulses(weapon: WeaponId | string, tier: number): number {
  if (tier >= 3) {
    if (
      weapon === 'rapier' ||
      weapon === 'estoc_spear' ||
      weapon === 'short_blade' ||
      weapon === 'war_fans' ||
      weapon === 'cleaver_greatsword' ||
      weapon === 'joust_lance' ||
      weapon === 'meteor_flail' ||
      weapon === 'ash_wraps' ||
      weapon === 'shadow_daggers' ||
      weapon === 'naginata' ||
      weapon === 'greataxe' ||
      weapon === 'ribbon_whip' ||
      weapon === 'silk_whip' ||
      weapon === 'katana' ||
      weapon === 'hammer' ||
      weapon === 'shield_mace' ||
      weapon === 'kusarigama'
    ) {
      return 1;
    }
  }
  if (tier >= 2 && (weapon === 'rapier' || weapon === 'estoc_spear' || weapon === 'war_fans' || weapon === 'kusarigama')) return 1;
  return 0;
}

export type EvoWaveKind = 'sword_wave' | 'katana_wave' | 'storm_arc' | 'player_quake';

export interface EvoWaveSpec {
  kind: EvoWaveKind;
  count: number;
  speed: number;
  radius: number;
  life: number;
  /** Vertical offsets around the swing origin, in player-scale pixels. */
  yOff: number[];
}

/** Projectiles / waves spawned when a basic attack becomes active, per weapon and evo tier. */
export function swingWaves(weapon: WeaponId | string, tier: number, c: CombatTuning): EvoWaveSpec[] {
  if (tier <= 0) return [];
  const p = c.evoPower;
  const out: EvoWaveSpec[] = [];
  const add = (spec: EvoWaveSpec) => out.push(spec);

  switch (weapon) {
    case 'whip':
      if (tier >= 3) add({ kind: 'sword_wave', count: 1, speed: 420 * p, radius: 16 + 4 * p, life: 0.45, yOff: [0] });
      break;
    case 'hammer':
      if (tier >= 2) add({ kind: 'player_quake', count: 1, speed: 340 * p, radius: 14 + 3 * p, life: 0.7, yOff: [0] });
      if (tier >= 3) add({ kind: 'player_quake', count: 1, speed: 260 * p, radius: 16 + 4 * p, life: 0.55, yOff: [0] });
      break;
    case 'katana':
      if (tier >= 2) add({ kind: 'katana_wave', count: 1, speed: 500 * p, radius: 20 + 4 * p, life: 0.7, yOff: [0] });
      if (tier >= 3) add({ kind: 'katana_wave', count: 1, speed: 460 * p, radius: 18 + 3 * p, life: 0.65, yOff: [-18] });
      break;
    case 'sword':
      if (tier >= 2) add({ kind: 'sword_wave', count: 1, speed: 470 * p, radius: 18 + 4 * p, life: 0.75, yOff: [0] });
      if (tier >= 3) add({ kind: 'sword_wave', count: 2, speed: 430 * p, radius: 16 + 3 * p, life: 0.7, yOff: [-16, 16] });
      break;
    case 'naginata':
      if (tier >= 2) add({ kind: 'storm_arc', count: 1, speed: 520 * p, radius: 18 + 4 * p, life: 0.7, yOff: [0] });
      if (tier >= 3) add({ kind: 'storm_arc', count: 1, speed: 480 * p, radius: 16 + 3 * p, life: 0.6, yOff: [-20] });
      break;
    case 'greataxe':
      if (tier >= 2) add({ kind: 'player_quake', count: 1, speed: 280 * p, radius: 16 + 3 * p, life: 0.5, yOff: [0] });
      break;
    case 'ash_wraps':
      if (tier >= 2) add({ kind: 'player_quake', count: 1, speed: 300 * p, radius: 14 + 3 * p, life: 0.35, yOff: [0] });
      if (tier >= 3) add({ kind: 'player_quake', count: 1, speed: 360 * p, radius: 16 + 4 * p, life: 0.4, yOff: [0] });
      break;
    case 'ribbon_whip':
    case 'silk_whip':
      if (tier >= 2) add({ kind: 'sword_wave', count: 1, speed: 400 * p, radius: 14 + 3 * p, life: 0.4, yOff: [0] });
      if (tier >= 3) add({ kind: 'storm_arc', count: 1, speed: 440 * p, radius: 14 + 3 * p, life: 0.5, yOff: [0] });
      break;
    case 'cleaver_greatsword':
      if (tier >= 2) add({ kind: 'sword_wave', count: 1, speed: 410 * p, radius: 22 + 4 * p, life: 0.65, yOff: [0] });
      break;
    case 'joust_lance':
      if (tier >= 2) add({ kind: 'storm_arc', count: 1, speed: 540 * p, radius: 16 + 3 * p, life: 0.55, yOff: [0] });
      break;
    case 'meteor_flail':
      if (tier >= 2) add({ kind: 'player_quake', count: 1, speed: 320 * p, radius: 18 + 4 * p, life: 0.65, yOff: [0] });
      break;
    case 'war_fans':
      if (tier >= 2) add({ kind: 'storm_arc', count: 1, speed: 460 * p, radius: 14 + 3 * p, life: 0.35, yOff: [0] });
      break;
    case 'shield_mace':
      if (tier >= 2) add({ kind: 'player_quake', count: 1, speed: 310 * p, radius: 16 + 3 * p, life: 0.5, yOff: [0] });
      break;
    case 'kusarigama':
      if (tier >= 2) add({ kind: 'storm_arc', count: 1, speed: 440 * p, radius: 14 + 3 * p, life: 0.45, yOff: [0] });
      break;
    case 'solar_glaive':
      if (tier >= 2) add({ kind: 'sword_wave', count: 1, speed: 490 * p, radius: 18 + 4 * p, life: 0.6, yOff: [0] });
      break;
    case 'prism_gauntlets':
      if (tier >= 2) add({ kind: 'storm_arc', count: 1, speed: 500 * p, radius: 14 + 3 * p, life: 0.42, yOff: [0] });
      break;
    default:
      break;
  }
  return out;
}

/** Extra bolts the Wizard fires on a basic attack at high tiers. */
export function wizardExtraBolts(tier: number): number {
  if (tier >= 3) return 1;
  return 0;
}

export function wizardBoltPierce(tier: number, flags: AffinityFlags): boolean {
  return tier >= 2 || flags.air;
}

export interface AffinityHitMods {
  kbMul: number;
  stunAdd: number;
  bonusDamage: number;
  lifestealChance: number;
  splashR: number;
  splashDmg: number;
  burn: number;
  chill: number;
  wither: number;
  pull: boolean;
}

export function affinityHitMods(
  flags: AffinityFlags,
  enemy: Enemy,
  c: CombatTuning,
  skill3: boolean
): AffinityHitMods {
  const p = c.affinityPower;
  const skill = skill3 ? 1.25 : 1;
  const mods: AffinityHitMods = {
    kbMul: 1,
    stunAdd: 0,
    bonusDamage: 0,
    lifestealChance: 0,
    splashR: 0,
    splashDmg: 0,
    burn: 0,
    chill: 0,
    wither: 0,
    pull: false,
  };
  if (flags.fire) {
    mods.burn = Math.max(mods.burn, (skill3 ? 3.2 : 2.2) * p);
    mods.splashR = Math.max(mods.splashR, 46 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
  }
  if (flags.water) {
    mods.chill = Math.max(mods.chill, (skill3 ? 3.0 : 2.0) * p);
    mods.kbMul *= 1 + 0.2 * p * skill;
  }
  if (flags.air) {
    mods.pull = skill3;
    mods.kbMul *= 1 + 0.08 * p;
  }
  if (flags.earth) {
    mods.kbMul *= 1 + 0.4 * p * skill;
    mods.stunAdd += (skill3 ? 0.22 : 0.12) * p;
    mods.splashR = Math.max(mods.splashR, 52 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
  }
  if (flags.light) {
    mods.splashR = Math.max(mods.splashR, 50 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
    if (enemy.isBoss) mods.bonusDamage += skill3 ? 2 : 1;
  }
  if (flags.shadow) {
    mods.wither = Math.max(mods.wither, (skill3 ? 3.6 : 2.6) * p);
    mods.lifestealChance = (skill3 ? 0.28 : 0.16) * p;
    if (!enemy.alerted) mods.bonusDamage += skill3 ? 2 : 1;
  }
  if (flags.storm) {
    mods.stunAdd += (skill3 ? 0.2 : 0.1) * p;
    mods.splashR = Math.max(mods.splashR, 64 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
  }
  if (flags.glacial) {
    mods.chill = Math.max(mods.chill, (skill3 ? 4.2 : 3.0) * p);
    mods.bonusDamage += enemy.chillTimer && enemy.chillTimer > 0 ? 1 : 0;
  }
  if (flags.venom) {
    mods.burn = Math.max(mods.burn, (skill3 ? 4.0 : 2.8) * p);
    mods.wither = Math.max(mods.wither, (skill3 ? 3.2 : 2.2) * p);
    mods.splashR = Math.max(mods.splashR, 54 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
  }
  if (flags.blood) {
    mods.bonusDamage += skill3 ? 2 : 1;
    mods.lifestealChance = Math.max(mods.lifestealChance, (skill3 ? 0.32 : 0.2) * p);
  }
  if (flags.metal) {
    mods.kbMul *= 1 + 0.28 * p * skill;
    mods.stunAdd += (skill3 ? 0.18 : 0.1) * p;
    mods.splashR = Math.max(mods.splashR, 56 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
  }
  if (flags.arcane) {
    mods.splashR = Math.max(mods.splashR, 62 * p * skill);
    mods.splashDmg = Math.max(mods.splashDmg, 1);
    mods.bonusDamage += skill3 ? 1 : 0;
  }
  return mods;
}

export function skillZoneRadius(flags: AffinityFlags, c: CombatTuning): number {
  const p = c.affinityPower;
  if (flags.fire) return 28 * p;
  if (flags.earth) return 34 * p;
  if (flags.light) return 36 * p;
  if (flags.shadow) return 30 * p;
  if (flags.water) return 32 * p;
  if (flags.air) return 30 * p;
  if (flags.storm) return 38 * p;
  if (flags.glacial) return 34 * p;
  if (flags.venom) return 36 * p;
  if (flags.blood) return 32 * p;
  if (flags.metal) return 36 * p;
  if (flags.arcane) return 40 * p;
  return 0;
}

export function mutedBoltColors(p: Player): { c1: string; c2: string } {
  const def = getActiveElementDef(p.baseElements, p.combinedElement);
  if (!def) return { c1: '#8b90b0', c2: '#2a2c40' };
  const pal = getFxProfile(def.id).pal;
  return { c1: pal.mid, c2: pal.dark };
}

export function isSkill3Active(p: Player): boolean {
  return (
    p.backdashTimer > 0 ||
    p.dashAttackTimer > 0 ||
    p.katanaMegaSlashTimer > 0 ||
    p.katanaChargeTimer > 0 ||
    p.hammerLeapState !== 'none' ||
    p.rapierLungeTimer > 0 ||
    p.axeSpinTimer > 0 ||
    p.naginataVaultTimer > 0 ||
    p.monkDashTimer > 0 ||
    p.wizardNovaTimer > 0 ||
    p.assassinStepTimer > 0 ||
    p.assassinMarkCastTimer > 0 ||
    p.minstrelDanceTimer > 0
  );
}

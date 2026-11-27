import {
  AbilityDef,
  AbilityId,
  ArtifactDef,
  ArtifactId,
  BaseElementId,
  BossTuning,
  CharacterDef,
  CharacterTuning,
  EnemyTuning,
  EnemyType,
  KillFreezeTuning,
  FxTuning,
  CharacterId,
  CombinedElementId,
  CraftRecipe,
  ElementDef,
  ElementId,
  ItemDef,
  ItemId,
  RaidDef,
  RaidId,
  SpecialItemDef,
  SpecialItemId,
  TuningConfig,
  WeaponDef,
  WeaponId,
} from './types';
import { ENEMY_SPECS } from './level';

export const STANDARD_RAID_ORDER: RaidId[] = [
  'nocturne_castle',
  'goblin_camp',
  'weeping_necropolis',
  'brimstone_sanctum',
];

export const RAIDS_REQUIRED_FOR_END_RAID = 3;

export const RAID_ORDER: RaidId[] = [
  'nocturne_castle',
  'goblin_camp',
  'weeping_necropolis',
  'brimstone_sanctum',
  'eclipse_gauntlet',
];

export const RAIDS: Record<RaidId, RaidDef> = {
  nocturne_castle: {
    id: 'nocturne_castle',
    name: 'Nocturne Castle',
    subtitle: '4 Chambers + Crimson Sovereign',
    description:
      'Haunted gothic halls guarded by Baron Bloodfang, Clockwork Colossus, Hollow Inquisitor, Obsidian Gargoyle, and towering Lord Valerius.',
    finalBossName: 'Lord Valerius · Crimson Sovereign',
    accent: '#c82333',
  },
  goblin_camp: {
    id: 'goblin_camp',
    name: 'Goblin War-Camp',
    subtitle: '4 Encampments + Goblin King',
    description:
      'Moonlit stockades and powder pits ruled by Skritch, Bombo the Sapper, Hex-Lord Zog, Grimjaw the Siege-Hulk, and colossal Warchief Kragmash.',
    finalBossName: 'Warchief Kragmash · Goblin King',
    accent: '#22c55e',
  },
  weeping_necropolis: {
    id: 'weeping_necropolis',
    name: 'Weeping Necropolis',
    subtitle: '4 Crypts + Arch-Necromancer',
    description:
      'Cursed graveyards and sunken ossuaries haunted by Wraiths, Gargoyles, Acolytes, the Gravedigger, Banshee, Executioner, Bone Reaver, and Vespera.',
    finalBossName: 'Vespera · Arch-Necromancer',
    accent: '#a855f7',
  },
  brimstone_sanctum: {
    id: 'brimstone_sanctum',
    name: 'Brimstone Sanctum',
    subtitle: '4 Forges + Infernal Forge-Lord',
    description:
      'Volcanic lava foundries patrolled by Magma Imps and Obsidian Sentinels beneath the Cinder Warden, Pyre Matriarch, Slag Colossus, and Ignis.',
    finalBossName: 'Ignis · Infernal Forge-Lord',
    accent: '#f97316',
  },
  eclipse_gauntlet: {
    id: 'eclipse_gauntlet',
    name: 'Eclipse Citadel',
    subtitle: 'END RAID · 4 Duo-Boss Chambers + Eclipse Overlord',
    description:
      'The climactic Boss Gauntlet! Battle pairs of returning lords in every chamber before facing the colossal Big Bad End Boss, Draculor.',
    finalBossName: 'Draculor · Eclipse Overlord',
    accent: '#ff2e63',
    isEndRaid: true,
  },
};

export function getRaidOrderScaling(tier: number): {
  tier: number;
  hpMult: number;
  flatHpBonus: number;
  chargeSpeedMult: number;
  label: string;
  detail: string;
} {
  if (tier <= 1) {
    return {
      tier: 1,
      hpMult: 1.0,
      flatHpBonus: 0,
      chargeSpeedMult: 1.0,
      label: '1st Raid · Normal',
      detail: 'Standard enemy health and attack charge speed.',
    };
  }
  if (tier === 2) {
    return {
      tier: 2,
      hpMult: 1.25,
      flatHpBonus: 1,
      chargeSpeedMult: 1.26,
      label: '2nd Raid · Hardened',
      detail: 'Enemies have +25% HP and charge their attacks faster.',
    };
  }
  const hpMult = Number((1 + (tier - 1) * 0.25).toFixed(2));
  const chargeSpeedMult = Number((1 + (tier - 1) * 0.24).toFixed(2));
  return {
    tier,
    hpMult,
    flatHpBonus: tier - 1,
    chargeSpeedMult,
    label: `Raid #${tier} · Escalated`,
    detail: `Enemies have +${Math.round((hpMult - 1) * 100)}% HP and ${chargeSpeedMult}x faster attack charge.`,
  };
}

export const CHARACTER_ORDER: CharacterId[] = ['hunter', 'brute', 'ronin', 'minstrel', 'monk', 'wizard'];

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  hunter: {
    id: 'hunter',
    name: 'Vampire Hunter',
    title: 'White-Haired Dhampir',
    description:
      'Fastest runner with a crisp Double Jump, Vampire Killer Whip, Backdash, and starting spell Fireball.',
    traitSummary: 'Fast · Double Jump · Starts w/ Fireball',
    defaultWeapon: 'whip',
    defaultAbility: 'fireball',
    baseHp: 10,
    baseMp: 10,
    baseW: 28,
    baseH: 52,
    crouchBaseH: 31,
    speedMult: 1.12,
    jumpMult: 1.0,
    airJumps: 1,
    canWallCling: false,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#c82333',
  },
  brute: {
    id: 'brute',
    name: 'Iron Brute',
    title: 'War Hammer Juggernaut',
    description:
      'Armored titan with heavy damage, +4 Max HP, a towering single jump, and starting spell Fire Weapon.',
    traitSummary: 'Heavy Dmg · High Jump · Starts w/ Fire Weapon',
    defaultWeapon: 'hammer',
    defaultAbility: 'fire_weapon',
    baseHp: 14,
    baseMp: 8,
    baseW: 36,
    baseH: 60,
    crouchBaseH: 38,
    speedMult: 0.84,
    jumpMult: 1.18,
    airJumps: 0,
    canWallCling: false,
    bonusBaseDamage: 1,
    bonusWeaponDamage: 1,
    accent: '#f97316',
  },
  ronin: {
    id: 'ronin',
    name: 'Ronin Swordsman',
    title: 'Wandering Iaido Blade',
    description:
      'Nimble samurai with Katana Mega Slash, Mega Man-style Wall Cling & Wall Jump, and starting spell Shadow Dash.',
    traitSummary: 'Katana · Wall Cling · Starts w/ Shadow Dash',
    defaultWeapon: 'katana',
    defaultAbility: 'dash_attack',
    baseHp: 10,
    baseMp: 10,
    baseW: 28,
    baseH: 52,
    crouchBaseH: 32,
    speedMult: 1.06,
    jumpMult: 1.0,
    airJumps: 0,
    canWallCling: true,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#f43f5e',
  },
  minstrel: {
    id: 'minstrel',
    name: 'The Minstrel',
    title: 'Acrobatic Ribbon-Whip Bard',
    description:
      'Graceful acrobat who aims her whip in 8 directions (including the floor!) to zip invulnerably in slow-motion! Crouch + [1] for a normal ribbon lash. Mid-zip: [1] re-whip, [2] bounce-vault, [3] Encore Waltz.',
    traitSummary: '8-Way Whip-Zip Slow-Mo · Crouch Lash · Encore Waltz',
    defaultWeapon: 'ribbon_whip',
    defaultAbility: 'gas_bomb',
    baseHp: 9,
    baseMp: 11,
    baseW: 26,
    baseH: 50,
    crouchBaseH: 30,
    speedMult: 1.1,
    jumpMult: 1.05,
    airJumps: 1,
    canWallCling: false,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#ec4899',
  },
  monk: {
    id: 'monk',
    name: 'The Ash Monk',
    title: 'Bone-Wrapped Pilgrim of the Pyre',
    description:
      'Barehanded zealot in ash-grey robes. Very short reach but lightning-fast 3-hit fist chains that hit hard. [3] Pyre Dash: a long, wide, invulnerable charge that hurls everything aside. Starts with Cinder Palm.',
    traitSummary: 'Fists · 3-Hit Chain · Pyre Dash · Starts w/ Cinder Palm',
    defaultWeapon: 'ash_wraps',
    defaultAbility: 'cinder_palm',
    baseHp: 11,
    baseMp: 9,
    baseW: 28,
    baseH: 52,
    crouchBaseH: 31,
    speedMult: 1.1,
    jumpMult: 1.04,
    airJumps: 0,
    canWallCling: false,
    bonusBaseDamage: 1,
    bonusWeaponDamage: 0,
    accent: '#d6d3d1',
  },
  wizard: {
    id: 'wizard',
    name: 'The Sable Wizard',
    title: 'Elementalist of the Drowned Spire',
    description:
      'Robed spellcaster with a spire staff. [1] fires a mid-range elemental bolt that takes the colour and effect of your Affinity. [3] Repulsion Nova blasts every foe around him away — into pits, they die. Starts with Chain of Storms.',
    traitSummary: 'Ranged Bolt · Repulsion Nova · Starts w/ Chain of Storms',
    defaultWeapon: 'spire_staff',
    defaultAbility: 'chain_storm',
    baseHp: 8,
    baseMp: 13,
    baseW: 26,
    baseH: 54,
    crouchBaseH: 32,
    speedMult: 1.0,
    jumpMult: 1.0,
    airJumps: 0,
    canWallCling: false,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#3b82f6',
  },
};

export const WEAPON_ORDER: WeaponId[] = [
  'whip',
  'rapier',
  'hammer',
  'greataxe',
  'katana',
  'naginata',
  'ribbon_whip',
  'silk_whip',
  'ash_wraps',
  'spire_staff',
  'sword',
];

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  whip: {
    id: 'whip',
    name: 'Vampire Killer Whip',
    shortName: 'Whip',
    description: 'Hunter exclusive. Long straight horizontal lash with classic precision reach.',
    skillName: 'Backdash',
    skillDescription:
      'Quick evasive backward dash with i-frames. Tier 3 unleashes a Parting Shock Snap behind you!',
    skillCooldown: 0.52,
    accent: '#e5a93c',
    ownerChar: 'hunter',
    isMainWeapon: true,
  },
  rapier: {
    id: 'rapier',
    name: 'Crimson Rapier',
    shortName: 'Rapier',
    description: 'Hunter exclusive. Lightning-fast piercing thrust with +15% Crit Chance.',
    skillName: 'Phantom Lunge',
    skillDescription:
      'Blinks forward in an invulnerable blood-lance pierce through foes. Tier 3 triggers a Bloodburst Explosion!',
    skillCooldown: 1.05,
    accent: '#fb7185',
    ownerChar: 'hunter',
  },
  hammer: {
    id: 'hammer',
    name: 'Titan War Hammer',
    shortName: 'Hammer',
    description: 'Brute exclusive. Charges overhead before slamming down in a huge shockwave boom.',
    skillName: 'Meteor Slam',
    skillDescription:
      'Leaps high into the air and crashes down into the ground for MASSIVE area damage & twin quakes! Tier 3 ignites a Lava Ring!',
    skillCooldown: 1.65,
    accent: '#f97316',
    ownerChar: 'brute',
    isMainWeapon: true,
  },
  greataxe: {
    id: 'greataxe',
    name: 'Obsidian Greataxe',
    shortName: 'Greataxe',
    description: 'Brute exclusive. Heavy sweeping cleave with massive stagger and brutal reach.',
    skillName: 'Cyclone Cleave',
    skillDescription:
      'Spins relentlessly forward with unstoppable heavy axe slashes on both sides! Tier 3 erupts blazing Firestorm Sparks!',
    skillCooldown: 1.5,
    accent: '#f59e0b',
    ownerChar: 'brute',
  },
  katana: {
    id: 'katana',
    name: 'Crimson Katana',
    shortName: 'Katana',
    description: 'Ronin exclusive. Swift, sweeping wide iaijutsu slash that cleaves front, above, and below.',
    skillName: 'Iaijutsu Gale',
    skillDescription:
      'Charges stance briefly then unleashes a massive wide screen-cleaving slash! Tier 3 launches a blazing Gale Arc!',
    skillCooldown: 1.35,
    accent: '#f43f5e',
    ownerChar: 'ronin',
    isMainWeapon: true,
  },
  naginata: {
    id: 'naginata',
    name: 'Storm Naginata',
    shortName: 'Naginata',
    description: 'Ronin exclusive. Long-reach crescent polearm that sweeps far ahead and high overhead.',
    skillName: 'Tempest Vault',
    skillDescription:
      'Vaults in a spinning lightning-polearm arc that slices foes, shatters projectiles, and fires Storm Arcs! Tier 3 calls Lightning!',
    skillCooldown: 1.25,
    accent: '#38bdf8',
    ownerChar: 'ronin',
  },
  ribbon_whip: {
    id: 'ribbon_whip',
    name: 'Rose Ribbon-Whip',
    shortName: 'Ribbon Whip',
    description:
      'Minstrel exclusive. Hold directions + [1] to grapple floors, rafters, pillars & braziers in tactical slow-motion! Crouch + [1] for a normal ribbon lash.',
    skillName: 'Encore Waltz',
    skillDescription:
      'Spins midair in a dazzling musical ribbon dance, striking nearby foes 3 times, deflecting projectiles, and ending in a golden crescendo burst!',
    skillCooldown: 1.25,
    accent: '#ec4899',
    ownerChar: 'minstrel',
    isMainWeapon: true,
  },
  silk_whip: {
    id: 'silk_whip',
    name: 'Siren Silk-Whip',
    shortName: 'Silk Whip',
    description:
      'Minstrel exclusive. Extended harmonic ribbon-whip with longer 8-way grapple reach (including floors!), slow-mo zip, +15% Crit, and Crouch + [1] sonic lash.',
    skillName: 'Crescendo Waltz',
    skillDescription:
      'Expanded Encore Waltz with wider sonic ribbons, projectile shatter, and a thunderous rose-gold finale shockwave!',
    skillCooldown: 1.15,
    accent: '#f472b6',
    ownerChar: 'minstrel',
  },
  ash_wraps: {
    id: 'ash_wraps',
    name: 'Ashen Fist-Wraps',
    shortName: 'Fist-Wraps',
    description:
      'Monk exclusive. Bone-bound linen wraps. Very short reach, very fast 3-hit chain: jab, jab, then a heavy palm that hurls the foe back.',
    skillName: 'Pyre Dash',
    skillDescription:
      'A long, wide, invulnerable power dash wreathed in ash and embers that strikes and hurls aside everything it passes. Awakened: ends in an Ash Burst. Mythic: twin bursts.',
    skillCooldown: 1.3,
    accent: '#d6d3d1',
    ownerChar: 'monk',
    isMainWeapon: true,
  },
  spire_staff: {
    id: 'spire_staff',
    name: 'Drowned Spire Staff',
    shortName: 'Spire Staff',
    description:
      'Wizard exclusive. Fires a mid-range elemental bolt that follows your Affinity (fire burns, water chills, air pierces, earth staggers, light smites, shadow rends). Every 4th bolt is Overcharged.',
    skillName: 'Repulsion Nova',
    skillDescription:
      'Detonates a ring of force around the Wizard that hurls every nearby foe away and up, shattering projectiles. Foes pushed into pits die.',
    skillCooldown: 2.0,
    accent: '#3b82f6',
    ownerChar: 'wizard',
    isMainWeapon: true,
  },
  sword: {
    id: 'sword',
    name: 'Silver Broadsword',
    shortName: 'Sword',
    description: 'Any Hero. Fast wide crescent slash hitting enemies in front, above, and below.',
    skillName: 'Blade Wave',
    skillDescription:
      'Launches a piercing silver crescent wave. Tier 3 unleashes Twin Cross-Waves!',
    skillCooldown: 1.05,
    accent: '#93c5fd',
  },
};

export function canCharacterUseWeapon(charId: CharacterId, weaponId: WeaponId): boolean {
  const owner = WEAPONS[weaponId].ownerChar;
  return !owner || owner === charId;
}

export function getEvolutionTierName(tier: number): string {
  if (tier <= 0) return 'Base';
  if (tier === 1) return 'Awakened';
  if (tier === 2) return 'Mythic';
  return 'Transcendent';
}

// Weapon Upgrade Progression — dramatic Visual, Audio & Key [3] Skill Evolution every 5 upgrades!
// Note: nextLevel = player.weaponDamageBonus + 2 (so 5 upgrades = nextLevel 6, 10 upgrades = nextLevel 11, 15 upgrades = nextLevel 16)
export function getWeaponMilestoneInfo(nextLevel: number): {
  tag: string;
  title: string;
  description: string;
} {
  const nextUpgrades = Math.max(1, nextLevel - 1);
  if (nextUpgrades % 5 === 0) {
    const evoTier = nextUpgrades / 5;
    const tierName = getEvolutionTierName(evoTier);
    if (evoTier === 1) {
      return {
        tag: '★ AWAKENED EVO',
        title: `Weapon Evolution I · ${tierName} (+${nextUpgrades})`,
        description:
          '5-UPGRADE EVOLUTION! New glowing energy trails, resonant forge audio, +1 dmg & evolved Key [3] Skills (extra wave, double seismic ring, arc lightning & wider flurry)!',
      };
    }
    if (evoTier === 2) {
      return {
        tag: '★★ MYTHIC EVO',
        title: `Weapon Evolution II · ${tierName} (+${nextUpgrades})`,
        description:
          '10-UPGRADE EVOLUTION! Blazing dual-aura weapon arcs, thunderous cathedral audio, +1 dmg & Mythic Key [3] Skills (triple wave, twin quakes, storm nova)!',
      };
    }
    return {
      tag: '★★★ TRANSCENDENT',
      title: `Weapon Evolution ${evoTier} · ${tierName} (+${nextUpgrades})`,
      description:
        '15+ UPGRADE EVOLUTION! Astral storm trails, celestial resonance audio, +1 dmg & massive screen-shaking Key [3] devastation!',
    };
  }

  const nextEvoTier = Math.floor(nextUpgrades / 5) + 1;
  const progressInTier = nextUpgrades % 5;
  const nextTierName = getEvolutionTierName(nextEvoTier);
  return {
    tag: `+1 DMG (${progressInTier}/5)`,
    title: `Weapon Mastery +${nextUpgrades}`,
    description: `+1 weapon & Key [3] skill damage (${progressInTier}/5 upgrades toward ${nextTierName} Visual & Audio Evolution).`,
  };
}

export function getWeaponCurrentTag(level: number): string {
  const upgrades = Math.max(0, level - 1);
  const tier = Math.floor(upgrades / 5);
  const rem = upgrades % 5;
  if (tier === 0) return upgrades === 0 ? 'Base' : `${rem}/5 → Awakened`;
  return `${getEvolutionTierName(tier)} (${rem}/5)`;
}

// Spell Slot Upgrade Progression — dramatic Visual, Audio & Effect Evolution every 5 upgrades!
// Note: nextLevel = slotLevel + 1 (so 5 upgrades = nextLevel 6, 10 upgrades = nextLevel 11, 15 upgrades = nextLevel 16)
export function getSpellMilestoneInfo(
  abilityId: AbilityId,
  nextLevel: number
): { tag: string; summary: string } {
  const nextUpgrades = Math.max(1, nextLevel - 1);
  if (nextUpgrades % 5 === 0) {
    const evoTier = nextUpgrades / 5;
    const tierName = getEvolutionTierName(evoTier);
    switch (abilityId) {
      case 'fireball':
        return {
          tag: `★ ${tierName.toUpperCase()} EVO`,
          summary:
            evoTier === 1
              ? '5-UPGRADE EVOLUTION! Twin blazing firebolts, roaring blast shockwave, burning trail & resonant cast audio!'
              : 'MYTHIC EVOLUTION! Triple inferno volley with massive shockwaves & thunderous flame acoustics!',
        };
      case 'dash_attack':
        return {
          tag: `★ ${tierName.toUpperCase()} EVO`,
          summary:
            evoTier === 1
              ? '5-UPGRADE EVOLUTION! Extended phantom dash with crimson blast wake, burn & sonic boom audio!'
              : 'MYTHIC EVOLUTION! Double shockwave phantom blitz with blazing afterimages & +1 dmg!',
        };
      case 'grapple':
        return {
          tag: `★ ${tierName.toUpperCase()} EVO`,
          summary:
            evoTier === 1
              ? '5-UPGRADE EVOLUTION! Scorched Chain Slam releases an AoE shockwave, burns & siphons +1 MP!'
              : 'MYTHIC EVOLUTION! Twin chain detonation with massive shockwave & +1 MP siphon!',
        };
      case 'gas_bomb':
        return {
          tag: `★ ${tierName.toUpperCase()} EVO`,
          summary:
            evoTier === 1
              ? '5-UPGRADE EVOLUTION! Launches twin volatile flasks that shatter into huge igniting clouds!'
              : 'MYTHIC EVOLUTION! Triple plague barrage with colossal blast rings & lingering toxic inferno!',
        };
      case 'fire_weapon':
        return {
          tag: `★ ${tierName.toUpperCase()} EVO`,
          summary:
            evoTier === 1
              ? '5-UPGRADE EVOLUTION! Solar Overdrive: fiery impact shockwaves, burn DoT & +35% crit chance!'
              : 'MYTHIC EVOLUTION! Supernova Blade: massive flame nova bursts on strike & +50% crit!',
        };
    }
  }

  const nextEvoTier = Math.floor(nextUpgrades / 5) + 1;
  const progressInTier = nextUpgrades % 5;
  const nextTierName = getEvolutionTierName(nextEvoTier);
  return {
    tag: `+1 PWR (${progressInTier}/5)`,
    summary: `+1 spell power & faster cast (${progressInTier}/5 toward ${nextTierName} Spell Evolution).`,
  };
}

export function getSpellCurrentTag(level: number): string {
  const upgrades = Math.max(0, level - 1);
  const tier = Math.floor(upgrades / 5);
  const rem = upgrades % 5;
  if (tier === 0) return upgrades === 0 ? 'Base' : `${rem}/5 → Awakened`;
  return `${getEvolutionTierName(tier)} (${rem}/5)`;
}

// ============================================================================
// ELEMENTAL AFFINITY SYSTEM (Every 5 Levels: 6 Base Elements → 15 Combinations)
// ============================================================================
export const BASE_ELEMENT_ORDER: BaseElementId[] = [
  'water',
  'fire',
  'air',
  'earth',
  'light',
  'shadow',
];

export const BASE_ELEMENTS: Record<BaseElementId, ElementDef> = {
  water: {
    id: 'water',
    name: 'Water',
    title: 'Tidal Current',
    shortDesc: 'Chills foes (-40% speed) & restores +1 MP every 4 hits.',
    description:
      'Infuses your strikes with freezing tidewater: slows enemies for 2.6s, splashes nearby foes, and restores +1 MP every 4th hit.',
    primaryColor: '#38bdf8',
    secondaryColor: '#0ea5e9',
    glowColor: '#bae6fd',
    isCombined: false,
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    title: 'Cinder Flame',
    shortDesc: 'Ignites enemies for blazing Burn DoT & fiery ember bursts.',
    description:
      'Wreathes your weapon in roaring embers: scorches struck foes with 3.5s Burn DoT and detonates fiery sparks on crits.',
    primaryColor: '#f97316',
    secondaryColor: '#ef4444',
    glowColor: '#fed7aa',
    isCombined: false,
  },
  air: {
    id: 'air',
    name: 'Air',
    title: 'Gale Zephyr',
    shortDesc: '+16% Move Speed & sweeping Wind Blades hit distant foes.',
    description:
      'Channel the howling gale: +16% movement speed, faster jump flow, and every 2nd strike launches a slicing Wind Crescent.',
    primaryColor: '#5eead4',
    secondaryColor: '#a7f3d0',
    glowColor: '#ccfbf1',
    isCombined: false,
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    title: 'Stone Bastion',
    shortDesc: '+1 Armor Shield per room & erupts jagged Stone Spikes.',
    description:
      'Grants +1 free Armor Shield entering every chamber and erupts heavy Stone Spikes beneath struck foes for bonus stagger & AoE.',
    primaryColor: '#d97706',
    secondaryColor: '#a16207',
    glowColor: '#fde68a',
    isCombined: false,
  },
  light: {
    id: 'light',
    name: 'Light',
    title: 'Radiant Dawn',
    shortDesc: 'Calls down Radiant Sky Beams & +25% Boss/Undead damage.',
    description:
      'Smites enemies with golden beams from above for +1 radiant AoE damage, +25% boss damage, and chance to heal +1 HP on kills.',
    primaryColor: '#fde047',
    secondaryColor: '#f59e0b',
    glowColor: '#fef9c3',
    isCombined: false,
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    title: 'Umbral Veil',
    shortDesc: '+18% Crit Chance, stronger Assassinations & Void Drain.',
    description:
      'Envelops your blade in nocturnal mist: +18% crit chance, +2 assassination damage, and shadowy tendrils slash nearby enemies.',
    primaryColor: '#a855f7',
    secondaryColor: '#6d28d9',
    glowColor: '#e9d5ff',
    isCombined: false,
  },
};

export const COMBINED_ELEMENTS: Record<CombinedElementId, ElementDef> = {
  steam: {
    id: 'steam',
    name: 'Steam',
    title: 'Water + Fire',
    shortDesc: 'Scalding Vapor Explosions burn, slow & restore MP.',
    description:
      'Fuses Water & Fire into pressurized Steam: every strike bursts in a scalding mist ring that slows, burns, and restores MP every 3 hits.',
    primaryColor: '#fb923c',
    secondaryColor: '#38bdf8',
    glowColor: '#ffedd5',
    isCombined: true,
    parents: ['water', 'fire'],
  },
  frost: {
    id: 'frost',
    name: 'Frost',
    title: 'Water + Air',
    shortDesc: 'Glacial Shatter freezes foes & fires piercing Ice Shards.',
    description:
      'Fuses Water & Air into Glacial Frost: +14% speed, deep freeze slow, and strikes shatter icy gale shards into surrounding foes.',
    primaryColor: '#67e8f9',
    secondaryColor: '#93c5fd',
    glowColor: '#ecfeff',
    isCombined: true,
    parents: ['water', 'air'],
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    title: 'Water + Earth',
    shortDesc: 'Verdant Thorns erupt +1 Armor Shield & heal on kills.',
    description:
      'Fuses Water & Earth into Living Nature: +1 Armor Shield per room, erupting Briar Spikes, and every 5th kill restores +1 HP & +1 MP.',
    primaryColor: '#4ade80',
    secondaryColor: '#22c55e',
    glowColor: '#dcfce7',
    isCombined: true,
    parents: ['water', 'earth'],
  },
  prism: {
    id: 'prism',
    name: 'Prism',
    title: 'Water + Light',
    shortDesc: 'Refracted Rainbow Beams split across multiple enemies!',
    description:
      'Fuses Water & Light into Radiant Prism: calls down splitting rainbow beams that chill, restore MP, and deal heavy boss damage.',
    primaryColor: '#f472b6',
    secondaryColor: '#38bdf8',
    glowColor: '#fef08a',
    isCombined: true,
    parents: ['water', 'light'],
  },
  abyss: {
    id: 'abyss',
    name: 'Abyss',
    title: 'Water + Shadow',
    shortDesc: 'Crushing Deep Tide pulls foes, slows & boosts crits (+18%).',
    description:
      'Fuses Water & Shadow into the Crushing Abyss: dark tidal vortices pull & chill enemies, +18% crit, and siphon MP on crits.',
    primaryColor: '#6366f1',
    secondaryColor: '#0284c7',
    glowColor: '#c7d2fe',
    isCombined: true,
    parents: ['water', 'shadow'],
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning',
    title: 'Fire + Air',
    shortDesc: 'Jagged Chain Lightning arcs across 3 foes +18% Speed!',
    description:
      'Fuses Fire & Air into Storm Lightning: +18% move speed and strikes unleash crackling Chain Lightning bolts jumping between nearby foes!',
    primaryColor: '#60a5fa',
    secondaryColor: '#facc15',
    glowColor: '#fef08a',
    isCombined: true,
    parents: ['fire', 'air'],
  },
  magma: {
    id: 'magma',
    name: 'Magma',
    title: 'Fire + Earth',
    shortDesc: 'Volcanic Eruptions shatter armor, burn & grant +1 Shield.',
    description:
      'Fuses Fire & Earth into Molten Magma: +1 Armor Shield per room and heavy strikes erupt volcanic lava pillars with massive AoE burn!',
    primaryColor: '#ef4444',
    secondaryColor: '#f59e0b',
    glowColor: '#fecaca',
    isCombined: true,
    parents: ['fire', 'earth'],
  },
  solar: {
    id: 'solar',
    name: 'Solar',
    title: 'Fire + Light',
    shortDesc: 'Blinding Solar Flares rain down +30% Boss Damage & Burn!',
    description:
      'Fuses Fire & Light into Solar Radiance: scorching sky-beams incinerate targets in huge bursts with +30% damage against bosses.',
    primaryColor: '#facc15',
    secondaryColor: '#f97316',
    glowColor: '#fef9c3',
    isCombined: true,
    parents: ['fire', 'light'],
  },
  hellfire: {
    id: 'hellfire',
    name: 'Hellfire',
    title: 'Fire + Shadow',
    shortDesc: 'Cursed Black-Violet Flames inflict lethal Burn & +20% Crit!',
    description:
      'Fuses Fire & Shadow into Abyssal Hellfire: +20% crit chance, violent crimson-violet flame eruptions, and devastating assassination bursts.',
    primaryColor: '#e11d48',
    secondaryColor: '#9333ea',
    glowColor: '#fbcfe8',
    isCombined: true,
    parents: ['fire', 'shadow'],
  },
  sandstorm: {
    id: 'sandstorm',
    name: 'Sandstorm',
    title: 'Air + Earth',
    shortDesc: 'Whirling Desert Gales shred crowds +14% Speed & +1 Shield.',
    description:
      'Fuses Air & Earth into Raging Sandstorm: +14% move speed, +1 Armor Shield per room, and howling abrasive wind waves cleave wide rooms.',
    primaryColor: '#fbbf24',
    secondaryColor: '#b45309',
    glowColor: '#fef3c7',
    isCombined: true,
    parents: ['air', 'earth'],
  },
  aether: {
    id: 'aether',
    name: 'Aether',
    title: 'Air + Light',
    shortDesc: 'Celestial Tempest +20% Speed, sky arcs & rapid MP flow!',
    description:
      'Fuses Air & Light into Pure Aether: +20% speed, luminous astral wind beams pierce across the screen and replenish MP rapidly.',
    primaryColor: '#e0f2fe',
    secondaryColor: '#fde047',
    glowColor: '#ffffff',
    isCombined: true,
    parents: ['air', 'light'],
  },
  phantom: {
    id: 'phantom',
    name: 'Phantom',
    title: 'Air + Shadow',
    shortDesc: 'Spectral Slash echoes every strike +20% Speed & +22% Crit!',
    description:
      'Fuses Air & Shadow into Phantom Wraith: +20% speed, +22% crit, ghostly wind blades echo your attacks, and assassinations explode with shadow mist.',
    primaryColor: '#c084fc',
    secondaryColor: '#2dd4bf',
    glowColor: '#f3e8ff',
    isCombined: true,
    parents: ['air', 'shadow'],
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal',
    title: 'Earth + Light',
    shortDesc: '+2 Armor Shields per room & shattering Radiant Crystals!',
    description:
      'Fuses Earth & Light into Prismatic Crystal: +2 Armor Shields every chamber and strikes erupt shimmering crystal spires that burst into shards.',
    primaryColor: '#f0abfc',
    secondaryColor: '#fcd34d',
    glowColor: '#fae8ff',
    isCombined: true,
    parents: ['earth', 'light'],
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian',
    title: 'Earth + Shadow',
    shortDesc: 'Razor Black-Glass Spikes deal brutal Crit AoE & +1 Shield.',
    description:
      'Fuses Earth & Shadow into Volcanic Obsidian: +1 Armor Shield per room, +18% crit, and jagged black-glass spikes impale nearby foes.',
    primaryColor: '#7c3aed',
    secondaryColor: '#475569',
    glowColor: '#ddd6fe',
    isCombined: true,
    parents: ['earth', 'shadow'],
  },
  eclipse: {
    id: 'eclipse',
    name: 'Eclipse',
    title: 'Light + Shadow',
    shortDesc: 'Twin Sun-Moon Collapse: +25% Crit, +30% Boss Dmg & Nova!',
    description:
      'Fuses Light & Shadow into the Forbidden Eclipse: +25% crit, +30% boss damage, and strikes trigger golden-violet Eclipse Novas!',
    primaryColor: '#fbbf24',
    secondaryColor: '#9333ea',
    glowColor: '#fef08a',
    isCombined: true,
    parents: ['light', 'shadow'],
  },
};

const COMBINED_PAIR_LOOKUP: Record<string, CombinedElementId> = {
  'fire+water': 'steam',
  'air+water': 'frost',
  'earth+water': 'nature',
  'light+water': 'prism',
  'shadow+water': 'abyss',
  'air+fire': 'lightning',
  'earth+fire': 'magma',
  'fire+light': 'solar',
  'fire+shadow': 'hellfire',
  'air+earth': 'sandstorm',
  'air+light': 'aether',
  'air+shadow': 'phantom',
  'earth+light': 'crystal',
  'earth+shadow': 'obsidian',
  'light+shadow': 'eclipse',
};

export function getCombinedElementId(
  a: BaseElementId,
  b: BaseElementId
): CombinedElementId | null {
  if (a === b) return null;
  const key = a < b ? `${a}+${b}` : `${b}+${a}`;
  return COMBINED_PAIR_LOOKUP[key] ?? null;
}

export function getActiveElementDef(
  baseElements: BaseElementId[],
  combinedElement: CombinedElementId | null
): ElementDef | null {
  if (combinedElement && COMBINED_ELEMENTS[combinedElement]) {
    return COMBINED_ELEMENTS[combinedElement];
  }
  if (baseElements.length > 0) {
    return BASE_ELEMENTS[baseElements[0]] ?? null;
  }
  return null;
}

export const ABILITY_ORDER: AbilityId[] = [
  'fireball',
  'dash_attack',
  'grapple',
  'gas_bomb',
  'fire_weapon',
  'cinder_palm',
  'chain_storm',
];

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    shortName: 'Fireball',
    manaCost: 1,
    cooldown: 0.6,
    description: 'Hurls an explosive firebolt. Evolves with Burn (Lv3), Inferno Blast (Lv4), and Twin Bolts (Lv5).',
    accent: '#f97316',
  },
  dash_attack: {
    id: 'dash_attack',
    name: 'Forward Dash Attack',
    shortName: 'Dash Slash',
    manaCost: 2,
    cooldown: 1.35,
    description: 'Surges rapidly forward, piercing foes. Evolves with Searing Burn (Lv3) & Shockwave Wake (Lv4).',
    accent: '#ef4444',
  },
  grapple: {
    id: 'grapple',
    name: 'Grappling Hook',
    shortName: 'Grapple',
    manaCost: 1,
    cooldown: 0.85,
    description: 'Fires a chain hook upward (hold W for straight up) to latch rafters or strike foes.',
    accent: '#94a3b8',
  },
  gas_bomb: {
    id: 'gas_bomb',
    name: 'Gas Bomb',
    shortName: 'Gas Bomb',
    manaCost: 2,
    cooldown: 2.1,
    description: 'Shatters an alchemical flask into a toxic cloud. Evolves with Volatile Burn (Lv3) & Impact Blast (Lv4).',
    accent: '#22c55e',
  },
  fire_weapon: {
    id: 'fire_weapon',
    name: 'Fire Weapon',
    shortName: 'Fire Buff',
    manaCost: 2,
    cooldown: 4.0,
    description: 'Ignites your weapon for fire damage & +20% crit. Evolves with Cinder Burn (Lv3) & Flame Surge (Lv4).',
    accent: '#f59e0b',
  },
  cinder_palm: {
    id: 'cinder_palm',
    name: 'Cinder Palm',
    shortName: 'Cinder Palm',
    manaCost: 2,
    cooldown: 1.6,
    description: 'A thrust of the open palm releases a cone of ash and embers: heavy damage, stun and a huge shove. Evolves with Burn (Lv3) and a wider cone (every 5 levels).',
    accent: '#a8a29e',
  },
  chain_storm: {
    id: 'chain_storm',
    name: 'Chain of Storms',
    shortName: 'Chain Storm',
    manaCost: 3,
    cooldown: 2.2,
    description: 'Calls lightning that leaps between up to 3 nearby foes (more every 5 levels), stunning them. Takes your Affinity colour.',
    accent: '#60a5fa',
  },
};

export const ITEM_ORDER: ItemId[] = [
  'health_potion',
  'mana_potion',
  'armor_potion',
];

export const ITEMS: Record<ItemId, ItemDef> = {
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    shortName: 'Health',
    description: 'Restores +2 HP immediately.',
    accent: '#dc2626',
  },
  mana_potion: {
    id: 'mana_potion',
    name: 'Mana Potion',
    shortName: 'Mana',
    description: 'Restores +2 MP immediately.',
    accent: '#3b82f6',
  },
  armor_potion: {
    id: 'armor_potion',
    name: 'Armor Potion',
    shortName: 'Armor',
    description: 'Grants 2 iron shield charges for 14s that block incoming hits.',
    accent: '#cbd5e1',
  },
};

export const SPECIAL_ITEM_ORDER: SpecialItemId[] = ['eclipse_hourglass', 'hero_tag_horn'];

export const SPECIAL_ITEMS: Record<SpecialItemId, SpecialItemDef> = {
  eclipse_hourglass: {
    id: 'eclipse_hourglass',
    name: 'Eclipse Hourglass',
    shortName: 'Hourglass',
    description:
      'Rare limited relic [6]: Shatters time for 4.2s, slowing all enemies to a crawl, dealing 8 Cataclysm DMG + Burn to every foe on screen, and restoring +2 MP.',
    cooldown: 10,
    maxCharges: 3,
    accent: '#c084fc',
  },
  hero_tag_horn: {
    id: 'hero_tag_horn',
    name: 'Phantom Tag Horn',
    shortName: 'Tag Horn',
    description:
      'Rare limited relic [6]: Summons TWO phantom companion heroes beside you for a synchronized team-up strike — slamming, slashing, and healing +1 HP & +2 MP!',
    cooldown: 7,
    maxCharges: 3,
    accent: '#38bdf8',
  },
};

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    id: 'craft_hp_potion',
    name: 'Brew Health Potion',
    description: 'Adds +1 Health Potion (+2 HP) to your inventory.',
    cost: 2,
    category: 'potion',
    itemId: 'health_potion',
    accent: '#dc2626',
  },
  {
    id: 'craft_mp_potion',
    name: 'Distill Mana Potion',
    description: 'Adds +1 Mana Potion (+2 MP) to your inventory.',
    cost: 2,
    category: 'potion',
    itemId: 'mana_potion',
    accent: '#3b82f6',
  },
  {
    id: 'craft_armor_potion',
    name: 'Smelt Iron Flask',
    description: 'Adds +1 Armor Potion (2 shield hits) to your inventory.',
    cost: 3,
    category: 'potion',
    itemId: 'armor_potion',
    accent: '#cbd5e1',
  },
  {
    id: 'craft_rapier',
    name: 'Forge Crimson Rapier (Hunter)',
    description: 'Vampire Hunter exclusive. Fast +15% Crit piercing blade with Phantom Lunge [3].',
    cost: 4,
    category: 'weapon',
    weaponId: 'rapier',
    accent: '#fb7185',
  },
  {
    id: 'craft_greataxe',
    name: 'Forge Obsidian Greataxe (Brute)',
    description: 'Iron Brute exclusive. Heavy sweeping cleave with Cyclone Cleave [3] tornado.',
    cost: 4,
    category: 'weapon',
    weaponId: 'greataxe',
    accent: '#f59e0b',
  },
  {
    id: 'craft_naginata',
    name: 'Forge Storm Naginata (Ronin)',
    description: 'Ronin exclusive. Long crescent polearm with Tempest Vault [3] lightning strike.',
    cost: 4,
    category: 'weapon',
    weaponId: 'naginata',
    accent: '#38bdf8',
  },
  {
    id: 'craft_silk_whip',
    name: 'Weave Siren Silk-Whip (Minstrel)',
    description: 'Minstrel exclusive. Longer grapple reach, +15% Crit, and expanded Crescendo Waltz [3].',
    cost: 4,
    category: 'weapon',
    weaponId: 'silk_whip',
    accent: '#f472b6',
  },
  {
    id: 'craft_sword',
    name: 'Forge Silver Broadsword (Any Hero)',
    description: 'Universal weapon for any hero. Fast crescent slash with Blade Wave [3].',
    cost: 4,
    category: 'weapon',
    weaponId: 'sword',
    accent: '#93c5fd',
  },
  {
    id: 'craft_eclipse_hourglass',
    name: 'Charge Eclipse Hourglass [6]',
    description: 'Adds +1 Special Item charge (max 3): 4.2s Time Freeze + 8 Screen-Wide DMG + Burn + 2 MP.',
    cost: 4,
    category: 'special_item',
    specialItemId: 'eclipse_hourglass',
    accent: '#c084fc',
  },
  {
    id: 'craft_hero_tag_horn',
    name: 'Charge Phantom Tag Horn [6]',
    description: 'Adds +1 Tag Horn charge (max 3): Summon twin companion hero echoes for a devastating team-up strike & +1 HP/+2 MP!',
    cost: 4,
    category: 'special_item',
    specialItemId: 'hero_tag_horn',
    accent: '#38bdf8',
  },
];

// Permanent Craftable ARTIFACTS — Kept across deaths and shared by ALL characters!
export const ARTIFACT_ORDER: ArtifactId[] = [
  'crimson_fang',
  'moonstone_signet',
  'vampire_crest',
  'soul_anvil',
  'everflask',
  'grimoire_ember',
  'bloodsteel_edge',
  'undying_heart',
  'arcane_conduit',
];

export const ARTIFACTS: Record<ArtifactId, ArtifactDef> = {
  crimson_fang: {
    id: 'crimson_fang',
    name: 'Crimson Fang Pendant',
    description: 'Permanent Artifact (all heroes): +1 Max HP & +1 HP recovered per raid room.',
    coreCost: 1,
    shardCost: 2,
    accent: '#dc2626',
  },
  moonstone_signet: {
    id: 'moonstone_signet',
    name: 'Moonstone Signet',
    description: 'Permanent Artifact (all heroes): +2 Max MP & +1 MP recovered per raid room.',
    coreCost: 1,
    shardCost: 2,
    accent: '#3b82f6',
  },
  vampire_crest: {
    id: 'vampire_crest',
    name: "Vampire Lord's Crest",
    description: 'Permanent Artifact (all heroes): +12% Crit Chance and critical hits restore +1 MP.',
    coreCost: 2,
    shardCost: 3,
    accent: '#e5a93c',
  },
  soul_anvil: {
    id: 'soul_anvil',
    name: "Blacksmith's Soul Anvil",
    description: 'Permanent Artifact (all heroes): Starts every raid with +1 Weapon Mastery Tier.',
    coreCost: 2,
    shardCost: 4,
    accent: '#f97316',
  },
  everflask: {
    id: 'everflask',
    name: "Alchemist's Everflask",
    description: 'Permanent Artifact (all heroes): Starts every raid with +1 extra Health, Mana, and Armor potion.',
    coreCost: 2,
    shardCost: 3,
    accent: '#22c55e',
  },

  // SACRIFICE ARTIFACTS — Sacrifice a carried Spell or Upgrade to forge permanent new powers!
  grimoire_ember: {
    id: 'grimoire_ember',
    name: 'Grimoire Ember',
    description: 'Permanent Power (all heroes): Every spell you cast automatically inflicts Burning Embers DoT!',
    coreCost: 1,
    shardCost: 0,
    isSacrifice: true,
    sacrificeType: 'spell',
    sacrificeLabel: 'Sacrifice 1 Unlocked Spell (when you own 2+ spells)',
    accent: '#f97316',
  },
  bloodsteel_edge: {
    id: 'bloodsteel_edge',
    name: 'Bloodsteel Edge',
    description: 'Permanent Power (all heroes): +1 Base Weapon Tier & critical strikes detonate an AoE shockwave!',
    coreCost: 1,
    shardCost: 0,
    isSacrifice: true,
    sacrificeType: 'weapon_power',
    sacrificeLabel: 'Sacrifice 1 Carried Weapon Mastery Tier',
    accent: '#ef4444',
  },
  undying_heart: {
    id: 'undying_heart',
    name: 'Undying Heart',
    description: 'Permanent Power (all heroes): +1 Max HP & once per raid survive a fatal blow with 2 HP!',
    coreCost: 1,
    shardCost: 0,
    isSacrifice: true,
    sacrificeType: 'max_hp',
    sacrificeLabel: 'Sacrifice 1 Carried Max HP Upgrade',
    accent: '#ff4d6d',
  },
  arcane_conduit: {
    id: 'arcane_conduit',
    name: 'Arcane Conduit',
    description: 'Permanent Power (all heroes): +2 Max MP & killing any enemy has a 30% chance to restore +1 MP!',
    coreCost: 1,
    shardCost: 0,
    isSacrifice: true,
    sacrificeType: 'slot_level',
    sacrificeLabel: 'Sacrifice 1 Carried Spell Slot Level (Lv 2+)',
    accent: '#60a5fa',
  },
};

// ===== Tuning v2 defaults (values mirror the original hard-coded constants) =====
export const DEFAULT_KILL_FREEZE: KillFreezeTuning = {
  enabled: true,
  freezeMs: 260,
  bossFreezeMult: 1.0,
  slowMoScale: 0.35,
  slowMoMs: 320,
  zoomPunch: 0.14,
  flash: true,
  flashAlpha: 0.68,
  impactFrameMs: 95,
  shake: 16.5,
  shakeMs: 380,
  holdUntilKey: false,
};

const CHARACTER_SPECIAL_DEFAULTS = {
  backdashSec: 0.2,
  hammerMeteorDamage: 4,
  katanaMegaBonus: 1,
  zipSlowMo: 0.42,
  zipDurationSec: 0.78,
  monkDashLength: 340,
  monkDashSec: 0.3,
  monkDashWidth: 96,
  monkDashHeightMult: 1.35,
  monkDashDamage: 3,
  monkDashKnockback: 430,
  monkDashCooldown: 1.3,
  monkComboBonus: 1,
  wizardBoltSpeed: 760,
  wizardBoltRange: 360,
  wizardBoltDamage: 1,
  wizardNovaRadius: 150,
  wizardNovaForce: 560,
  wizardNovaLift: 150,
  wizardNovaDamage: 2,
  wizardNovaCooldown: 2.0,
};

export function buildDefaultCharacterTuning(): Record<CharacterId, CharacterTuning> {
  const out = {} as Record<CharacterId, CharacterTuning>;
  for (const id of CHARACTER_ORDER) {
    const c = CHARACTERS[id];
    out[id] = {
      baseHp: c.baseHp,
      baseMp: c.baseMp,
      speedMult: c.speedMult,
      jumpMult: c.jumpMult,
      airJumps: c.airJumps,
      canWallCling: c.canWallCling,
      bonusBaseDamage: c.bonusBaseDamage,
      bonusWeaponDamage: c.bonusWeaponDamage,
      // Monk: very short reach, very fast fists. Wizard: bolt range lives in its own sliders.
      attackTimeMult: id === 'monk' ? 0.7 : id === 'wizard' ? 1.1 : 1.0,
      attackRangeMult: id === 'monk' ? 0.6 : 1.0,
      spellCostMult: 1.0,
      spellCooldownMult: 1.0,
      assassinDamageMult: 1.0,
      assassinMpReward: 2,
      assassinIFramesSec: 0.42,
      shadowChainSec: 2.8,
      ...CHARACTER_SPECIAL_DEFAULTS,
    };
  }
  return out;
}

export const REGULAR_ENEMY_ORDER: EnemyType[] = (Object.keys(ENEMY_SPECS) as EnemyType[]).filter(
  (t) => !ENEMY_SPECS[t].isBoss
);
export const BOSS_ORDER: EnemyType[] = (Object.keys(ENEMY_SPECS) as EnemyType[]).filter(
  (t) => ENEMY_SPECS[t].isBoss
);

export function buildDefaultEnemyTuning(bosses: boolean): Record<string, EnemyTuning | BossTuning> {
  const out: Record<string, EnemyTuning | BossTuning> = {};
  for (const t of bosses ? BOSS_ORDER : REGULAR_ENEMY_ORDER) {
    const base: EnemyTuning = {
      hpMult: 1.0,
      damageMult: 1.0,
      speedMult: 1.0,
      visionMult: 1.0,
      reactionSec: 0.5,
      windupMult: 1.0,
      cooldownMult: 1.0,
    };
    out[t] = bosses
      ? { ...base, phase2At: 0.52, phase2OnMiniBoss: false, enrageSpeed: 1.24, invulnMult: 1.0 }
      : base;
  }
  return out;
}

export const DEFAULT_FX_TUNING: FxTuning = {
  affinityFx: true,
  intensity: 1.0,
  mobileIntensity: 0.7,
  movementFx: true,
  attackFx: true,
  statusFx: true,
  runAura: true,
  trailLength: 1.0,
  particleCap: 320,
  mobileParticleCap: 140,
  elementShakeMult: 1.0,
  elementHitstopMult: 1.0,
  weaponEvoFx: true,
  weaponEvoGlow: 1.0,
  tierUpMoment: true,
  previewElement: 0,
  previewEvoTier: 0,
};

export const DEFAULT_TUNING: TuningConfig = {
  zoom: 1.08,
  playerScale: 1.0,
  enemyScale: 1.0,

  moveSpeed: 248,
  jumpForce: 548,
  gravity: 1380,
  coyoteTimeMs: 135,
  jumpBufferMs: 145,

  airControl: 92,
  airMaxSpeedMult: 1.0,
  airDrag: 60,
  airTurnFacing: true,
  jumpCutMultiplier: 0.5,
  fallGravityMult: 1.35,
  apexHangGravityMult: 0.72,
  maxFallSpeed: 880,
  airJumps: 1,
  allowAirBackdash: true,
  lockAirDirectionOnAttack: true,

  attackStartupMs: 52,
  attackActiveMs: 135,
  attackRecoveryMs: 105,
  attackRange: 90,
  jumpLockWhenAttacking: false,
  freezeOnAttack: true,
  hitstopMs: 42,
  weaponCritChance: 25,
  critMultiplier: 3,
  assassinationEnabled: true,

  playerHitStunMs: 190,
  airKnockbackX: 225,
  airKnockbackY: 315,

  cameraOffsetY: -125,
  cameraDeadzoneX: 95,
  cameraDeadzoneY: 65,
  cameraSmoothing: 0.14,
  critShakeIntensity: 10,
  showCameraGuide: false,
  cameraLookAhead: 0,

  mobileZoom: 0.8,
  mobileLookAhead: 70,
  mobileCameraOffsetY: -80,
  mobileDeckPct: 29,
  mobileAutoAttack: true,
  mobileAutoAttackRange: 1.0,
  mobileAutoAttackPriority: 0,
  mobileAutoAssassinate: false,
  mobileHaptics: true,
  mobileBtnTopLeft: 2,
  mobileBtnTopRight: 1,
  mobileBtnBottomLeft: 3,
  mobileBtnBottomRight: 0,
  mobileMiniButtons: true,

  gameSpeed: 1.0,
  shakeMult: 1.0,
  zoomPunchMult: 1.0,
  flashMult: 1.0,
  playerDamageMult: 1.0,
  enemyDamageMult: 1.0,
  bossDamageMult: 1.0,
  playerInvulnSec: 1.25,
  stealthVisionMult: 1.0,
  crouchStealthMult: 0.52,
  chainStealthMult: 0.35,
  closeSenseNormal: 95,
  closeSenseCrouch: 44,
  closeSenseChain: 34,
  visionHeight: 110,
  hideBreakDistance: 42,

  fallDeathEnabled: true,
  fallDeathBossMode: 0,
  fallDeathBossDamagePct: 25,
  knockbackMult: 1.0,
  ledgeShoveAssist: true,

  killFreeze: DEFAULT_KILL_FREEZE,
  fx: DEFAULT_FX_TUNING,
  characters: buildDefaultCharacterTuning(),
  enemies: buildDefaultEnemyTuning(false) as Record<string, EnemyTuning>,
  bosses: buildDefaultEnemyTuning(true) as Record<string, BossTuning>,
};


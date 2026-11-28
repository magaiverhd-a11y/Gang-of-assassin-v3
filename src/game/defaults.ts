import {
  AbilityDef,
  AbilityId,
  ArtifactDef,
  ArtifactId,
  BaseElementId,
  BossCharmDef,
  BossCharmId,
  BossTuning,
  CharacterDef,
  CharacterTuning,
  CharmSynergyDef,
  CharmSynergyId,
  EnemyTuning,
  EnemyType,
  KillFreezeTuning,
  CombatTuning,
  FxTuning,
  SoundTuning,
  CharacterId,
  CombinedElementId,
  CraftRecipe,
  ElementDef,
  ElementId,
  GoldPrepRecipe,
  HeroSkinDef,
  HeroSkinId,
  ItemDef,
  ItemId,
  RaidDef,
  RaidId,
  SacrificeAltarDef,
  SacrificeAltarStat,
  SpecialItemDef,
  SpecialItemId,
  TuningConfig,
  WeaponDef,
  WeaponId,
} from './types';
import { ENEMY_SPECS } from './level';
export {
  BASE_ELEMENT_ORDER,
  BASE_ELEMENTS,
  COMBINED_ELEMENTS,
  getCombinedElementId,
  getActiveElementDef,
  CURSED_RELIC_ORDER,
  CURSED_RELICS,
} from './elementFusions';

export const MAX_POWER_LEVEL = 25;

export const STANDARD_RAID_ORDER: RaidId[] = [
  'nocturne_castle',
  'goblin_camp',
  'weeping_necropolis',
  'brimstone_sanctum',
  'mushroom_kingdom',
  'sand_fortress',
  'alien_ship',
  'dragon_crane',
  'dwarven_mines',
  'cyberpunk_city',
  'pirate_armada',
  'ghost_paradox',
  'noble_mansion',
  'underwater_city',
  'frost_wardens',
  'barbaric_nation',
];

export const RAIDS_REQUIRED_FOR_END_RAID = 3;

export const RAID_ORDER: RaidId[] = [
  'nocturne_castle',
  'goblin_camp',
  'weeping_necropolis',
  'brimstone_sanctum',
  'mushroom_kingdom',
  'sand_fortress',
  'alien_ship',
  'dragon_crane',
  'dwarven_mines',
  'cyberpunk_city',
  'pirate_armada',
  'ghost_paradox',
  'noble_mansion',
  'underwater_city',
  'frost_wardens',
  'barbaric_nation',
  'eclipse_gauntlet',
];

export const RAIDS: Record<RaidId, RaidDef> = {
  nocturne_castle: {
    id: 'nocturne_castle',
    name: 'Nocturne Castle',
    subtitle: '4 Chambers + Crimson Sovereign',
    description:
      'Haunted gothic halls & subterranean crypt passages guarded by Baron Bloodfang, Clockwork Colossus, Hollow Inquisitor, Obsidian Gargoyle, and towering Lord Valerius.',
    gimmick: 'Gothic Halls & Secret Crypts',
    enemySummary: 'Ghouls · Skeletons · Night Bats · Halberd Knights',
    finalBossName: 'Lord Valerius · Crimson Sovereign',
    accent: '#c82333',
  },
  goblin_camp: {
    id: 'goblin_camp',
    name: 'Goblin War-Camp',
    subtitle: '4 Encampments + Goblin King',
    description:
      'Moonlit stockades and sapper tunnels ruled by Skritch, Bombo the Sapper, Hex-Lord Zog, Grimjaw the Siege-Hulk, and colossal Warchief Kragmash.',
    gimmick: 'Timber Watchtowers & Sapper Tunnels',
    enemySummary: 'Raiders · Archers · Sappers · Shamans · Brutes',
    finalBossName: 'Warchief Kragmash · Goblin King',
    accent: '#22c55e',
  },
  weeping_necropolis: {
    id: 'weeping_necropolis',
    name: 'Weeping Necropolis',
    subtitle: '4 Crypts + Arch-Necromancer',
    description:
      'Cursed graveyards and sunken ossuary tunnels haunted by Wraiths, Gargoyles, Acolytes, the Gravedigger, Banshee, Executioner, Bone Reaver, and Vespera.',
    gimmick: 'Misty Mausoleums & Sunken Ossuaries',
    enemySummary: 'Crypt Hounds · Wraiths · Gargoyles · Acolytes',
    finalBossName: 'Vespera · Arch-Necromancer',
    accent: '#a855f7',
  },
  brimstone_sanctum: {
    id: 'brimstone_sanctum',
    name: 'Brimstone Sanctum',
    subtitle: '4 Forges + Infernal Forge-Lord',
    description:
      'Volcanic lava foundries and magma under-ducts patrolled by Magma Imps and Obsidian Sentinels beneath the Cinder Warden, Pyre Matriarch, Slag Colossus, and Ignis.',
    gimmick: 'Molten Catwalks & Magma Ducts',
    enemySummary: 'Magma Imps · Obsidian Sentinels · Slag Titans',
    finalBossName: 'Ignis · Infernal Forge-Lord',
    accent: '#f97316',
  },
  mushroom_kingdom: {
    id: 'mushroom_kingdom',
    name: 'The Mushroom Kingdom',
    subtitle: '4 Fungal Realms + Mycelium Sovereign',
    description:
      'Bioluminescent toadstool canopies, bouncy spring-caps, and glowing mycelium root-tunnels ruled by the towering Mycelium Sovereign.',
    gimmick: 'Bouncy Toadstool Caps & Root Tunnels',
    enemySummary: 'Spore Hoppers · Mycelium Spitters · Cap Brutes',
    finalBossName: 'Sporelord Amanita · Mycelium Sovereign',
    accent: '#10b981',
  },
  sand_fortress: {
    id: 'sand_fortress',
    name: 'Sand Fortress',
    subtitle: '4 Sun Bastions + Pharaoh-Khan Sethra',
    description:
      'Sun-scorched sandstone citadels alternating blazing desert noon and starlit desert nights, with crumbling sand-bridges over buried catacombs.',
    gimmick: 'Blazing Noon & Desert Nights · Crumble Bridges',
    enemySummary: 'Dune Stalkers · Sun-Scarabs · Solar Priests',
    finalBossName: 'Pharaoh-Khan Sethra · Dune Sovereign',
    accent: '#eab308',
  },
  alien_ship: {
    id: 'alien_ship',
    name: 'Alien Ship',
    subtitle: '4 Mothership Decks + Void Archon',
    description:
      'Orbital dreadnought corridors, low-gravity reactor shafts, and neon plasma maintenance vents commanded by Void Archon Xel\'Vora.',
    gimmick: 'Zero-G Reactor Shafts & Plasma Conduits',
    enemySummary: 'Plasma Drones · Xeno Leapers · Exo-Rail Walkers',
    finalBossName: 'Void Archon Xel\'Vora · Star Harvester',
    accent: '#06b6d4',
  },
  dragon_crane: {
    id: 'dragon_crane',
    name: 'Dragon Crane',
    subtitle: '4 Cloud Sanctuaries + Celestial Crane-Wyrm',
    description:
      'Mist-veiled jade mountain peaks, emerald wind-updraft pads, hanging cloud pagodas, and subterranean dragon-vein grottos watched over by Longhe.',
    gimmick: 'Emerald Wind Updrafts & Cloud Pagodas',
    enemySummary: 'Sky-Acrobats · Jade Lantern-Golems · Cloud Wyrmlings',
    finalBossName: 'Longhe · Celestial Crane-Wyrm',
    accent: '#34d399',
  },
  dwarven_mines: {
    id: 'dwarven_mines',
    name: 'Corrupted Dwarven Mines',
    subtitle: '4 Crystal Shafts + Thane Borin',
    description:
      'Deep subterranean halls veined with corrupted amethyst, iron minecart trestles, explosive sapper drifts, and runic treasury vaults ruled by Thane Borin.',
    gimmick: 'Amethyst Crystal Veins & Rail-Shaft Tunnels',
    enemySummary: 'Corrupted Miners · Keg Sappers · Runed Golems',
    finalBossName: 'Thane Borin · The Gilded Hollow',
    accent: '#a855f7',
  },
  cyberpunk_city: {
    id: 'cyberpunk_city',
    name: 'Neon Spire 2099',
    subtitle: '4 Cyber-Districts + Synth-Shogun Zero',
    description:
      'Rain-slicked midnight skyscrapers, holographic skyline highways, chrome catwalks, and high-voltage under-grids patrolled by security drones and cyber-stalkers.',
    gimmick: 'Neon Rain Skyline & Chrome Catwalks',
    enemySummary: 'Cyber Drones · Holo-Stalkers · Rail Turrets · Bomb-Techs',
    finalBossName: 'Synth-Shogun Zero · Chrome Overlord',
    accent: '#ec4899',
  },
  pirate_armada: {
    id: 'pirate_armada',
    name: 'Skulltide Cove & Armada',
    subtitle: '4 Isles & Galleons + Captain Dreadtide',
    description:
      'Sun-scorched treasure beaches and buried smuggler grottos giving way to towering cursed pirate galleon decks, swaying rigging, and blackpowder broadsides.',
    gimmick: 'Treasure Beaches & Pirate Ship Decks',
    enemySummary: 'Corsair Raiders · Deck Gunners · Powder Bombers · Cutlass Mates',
    finalBossName: 'Captain Dreadtide · Corsair Admiral',
    accent: '#f59e0b',
  },
  ghost_paradox: {
    id: 'ghost_paradox',
    name: 'The Ghost Paradox',
    subtitle: '4 Fractured Realms + The Paradox Phantom',
    description:
      'A haunted dimensional anomaly with zero connection between chambers—leap from a ghost pirate ship straight into a cursed mansion, neon alley, sunken ruin, and astral rift!',
    gimmick: 'Unconnected Shifting Realms Every Room',
    enemySummary: 'Rift Wraiths · Spectral Corsairs · Glitched Drones · Stone Horrors',
    finalBossName: 'The Paradox Phantom · Fractured Echo',
    accent: '#818cf8',
  },
  noble_mansion: {
    id: 'noble_mansion',
    name: 'Velvet Blood Chateau',
    subtitle: '4 Gilded Wings + Duke Aurelius Vane',
    description:
      'Opulent aristocratic ballrooms, crystal chandeliers, marble staircases, velvet banquet galleries, and hidden wine vaults ruled by an immortal gilded bloodline.',
    gimmick: 'Crystal Chandeliers & Marble Galleries',
    enemySummary: 'House Duelists · Gilded Knights · Velvet Bats · Blood Priests',
    finalBossName: 'Duke Aurelius Vane · Gilded Sovereign',
    accent: '#e11d48',
  },
  underwater_city: {
    id: 'underwater_city',
    name: 'Sunken Pelagia',
    subtitle: '4 Coral Domes + Archon Nereus',
    description:
      'A drowned bioluminescent marble metropolis beneath the abyss—traverse glowing glass sea-tunnels, swaying kelp spires, and pearl-dome sanctums guarded by tide-born beasts.',
    gimmick: 'Bioluminescent Coral & Sea-Glass Tunnels',
    enemySummary: 'Abyssal Wyrms · Coral Sentinels · Tide Hoppers · Deep Wraiths',
    finalBossName: 'Archon Nereus · Abyssal Leviathan',
    accent: '#0ea5e9',
  },
  frost_wardens: {
    id: 'frost_wardens',
    name: 'Frostwarden Citadel',
    subtitle: '4 Glacial Keeps + High Warden Borealis',
    description:
      'Sub-zero ice battlements and translucent crystal towers swept by northern aurora blizzards, defended by unyielding glacier knights and frost-rune sentinels.',
    gimmick: 'Northern Aurora & Glacial Ice Keeps',
    enemySummary: 'Frost Halberdiers · Ice Gargoyles · Glacier Golems · Cryo-Acolytes',
    finalBossName: 'High Warden Borealis · Glacier Sentinel',
    accent: '#38bdf8',
  },
  barbaric_nation: {
    id: 'barbaric_nation',
    name: 'Ironhorn Bloodlands',
    subtitle: '4 War-Strongholds + Warchief Kragg',
    description:
      'Savage red-earth steppes, mammoth-tusk war-gates, roaring bonfire arenas, and spiked timber palisades ruled by the undefeated Ironhorn Bloodclans.',
    gimmick: 'Mammoth-Tusk Gates & Bonfire Palisades',
    enemySummary: 'Clan Berserkers · War-Hulks · Bone Shamans · Ironhorn Raiders',
    finalBossName: 'Warchief Kragg Ironhorn · Blood-Titan',
    accent: '#dc2626',
  },
  eclipse_gauntlet: {
    id: 'eclipse_gauntlet',
    name: 'Eclipse Citadel',
    subtitle: 'END RAID · 4 Duo-Boss Chambers + Eclipse Overlord',
    description:
      'The climactic Boss Gauntlet! Battle pairs of returning lords in every chamber before facing the colossal Big Bad End Boss, Draculor.',
    gimmick: '4 Duo-Boss Chambers + Final Overlord',
    enemySummary: 'Returning Raid Lords · Draculor Overlord',
    finalBossName: 'Draculor · Eclipse Overlord',
    accent: '#ff2e63',
    isEndRaid: true,
  },
};

export const BOSS_CHARM_ORDER: BossCharmId[] = [
  'crimson_chalice',
  'blackpowder_idol',
  'phylactery_locket',
  'molten_anvil_heart',
  'mycelial_crown',
  'sunscarab_seal',
  'singularity_core',
  'jade_feather_pearl',
  'deep_vein_heart',
  'neon_overclock_chip',
  'cursed_compass',
  'paradox_hourglass',
  'velvet_signet',
  'abyssal_trident_pearl',
  'glacial_aegis_shard',
  'ironhorn_war_tusk',
  'astral_eclipse_prism',
];

export const RAID_BOSS_CHARM: Record<RaidId, BossCharmId> = {
  nocturne_castle: 'crimson_chalice',
  goblin_camp: 'blackpowder_idol',
  weeping_necropolis: 'phylactery_locket',
  brimstone_sanctum: 'molten_anvil_heart',
  mushroom_kingdom: 'mycelial_crown',
  sand_fortress: 'sunscarab_seal',
  alien_ship: 'singularity_core',
  dragon_crane: 'jade_feather_pearl',
  dwarven_mines: 'deep_vein_heart',
  cyberpunk_city: 'neon_overclock_chip',
  pirate_armada: 'cursed_compass',
  ghost_paradox: 'paradox_hourglass',
  noble_mansion: 'velvet_signet',
  underwater_city: 'abyssal_trident_pearl',
  frost_wardens: 'glacial_aegis_shard',
  barbaric_nation: 'ironhorn_war_tusk',
  eclipse_gauntlet: 'astral_eclipse_prism',
};

export const BOSS_CHARMS: Record<BossCharmId, BossCharmDef> = {
  crimson_chalice: {
    id: 'crimson_chalice',
    raidId: 'nocturne_castle',
    name: 'Crimson Chalice',
    bossName: 'Lord Valerius',
    pursuitLore: 'The First Vampire\'s blood-grail sought to eclipse the moon forever.',
    effectSummary: '+15% Crit Chance · Every 5th kill siphons +1 HP & +2 MP.',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.55)',
    sigil: '🍷',
  },
  blackpowder_idol: {
    id: 'blackpowder_idol',
    raidId: 'goblin_camp',
    name: 'Blackpowder Idol',
    bossName: 'Warchief Kragmash',
    pursuitLore: 'A volatile goblin war-totem packed with alchemical siege powder.',
    effectSummary: 'Crits & Assassinations detonate a fiery blast wave (+35% AoE splash).',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.55)',
    sigil: '💣',
  },
  phylactery_locket: {
    id: 'phylactery_locket',
    raidId: 'weeping_necropolis',
    name: 'Phylactery Locket',
    bossName: 'Vespera',
    pursuitLore: 'Vespera\'s bound soul-vessel overflowing with restless spectral essence.',
    effectSummary: '+25% Spell Damage · Kills unleash a homing soul bolt & restore +1 MP.',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.55)',
    sigil: '🔮',
  },
  molten_anvil_heart: {
    id: 'molten_anvil_heart',
    raidId: 'brimstone_sanctum',
    name: 'Molten Anvil Heart',
    bossName: 'Ignis',
    pursuitLore: 'The living furnace-core forged to quench the fires of the deep earth.',
    effectSummary: 'Start every room with +1 Armor · +20% Weapon Damage & Guard Break.',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.55)',
    sigil: '🔥',
  },
  mycelial_crown: {
    id: 'mycelial_crown',
    raidId: 'mushroom_kingdom',
    name: 'Mycelial Crown',
    bossName: 'Sporelord Amanita',
    pursuitLore: 'A crown of luminous royal mycelium that commands the deep forest hive.',
    effectSummary: 'Kills & Assassinations burst healing/toxic spore clouds & cut cooldowns by 18%.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.55)',
    sigil: '🍄',
  },
  sunscarab_seal: {
    id: 'sunscarab_seal',
    raidId: 'sand_fortress',
    name: 'Sunscarab Seal',
    bossName: 'Pharaoh-Khan Sethra',
    pursuitLore: 'The golden royal scarab that bends desert mirages and solar storms.',
    effectSummary: '+14% Move Speed · Assassinations & dodges scorch nearby foes in golden sand.',
    color: '#eab308',
    glow: 'rgba(234,179,8,0.55)',
    sigil: '🪲',
  },
  singularity_core: {
    id: 'singularity_core',
    raidId: 'alien_ship',
    name: 'Singularity Core',
    bossName: 'Void Archon Xel\'Vora',
    pursuitLore: 'A stabilized pocket black-hole harvested to power an alien mothership.',
    effectSummary: 'Spells & Crits pull foes inward with a plasma pulse (+25% bonus Void dmg).',
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.55)',
    sigil: '⚛️',
  },
  jade_feather_pearl: {
    id: 'jade_feather_pearl',
    raidId: 'dragon_crane',
    name: 'Jade Feather Pearl',
    bossName: 'Longhe',
    pursuitLore: 'The sky-pearl coveted by mountain dragons for effortless flight and gale-blades.',
    effectSummary: '+12% Jump Power · Airborne & Drop-Assassination strikes deal +45% dmg & launch gale arcs.',
    color: '#34d399',
    glow: 'rgba(52,211,153,0.55)',
    sigil: '🪶',
  },
  deep_vein_heart: {
    id: 'deep_vein_heart',
    raidId: 'dwarven_mines',
    name: 'Heart of the Deep Vein',
    bossName: 'Thane Borin',
    pursuitLore: 'A royal dwarven amethyst-gold core pulsing with corrupt subterranean ore-light.',
    effectSummary: '+30% Gold from all sources · Crits & heavy strikes shatter violet crystal shards (+25% dmg).',
    color: '#c084fc',
    glow: 'rgba(192,132,252,0.58)',
    sigil: '💎',
  },
  neon_overclock_chip: {
    id: 'neon_overclock_chip',
    raidId: 'cyberpunk_city',
    name: 'Overclock Neural Chip',
    bossName: 'Synth-Shogun Zero',
    pursuitLore: 'Illegal chrome wetware humming with magenta lightning from Spire 2099.',
    effectSummary: '+16% Move & Attack Tempo · Crits discharge neon cyber-sparks (+20% bonus dmg).',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.58)',
    sigil: '⚡',
  },
  cursed_compass: {
    id: 'cursed_compass',
    raidId: 'pirate_armada',
    name: 'Corsair Gold Compass',
    bossName: 'Captain Dreadtide',
    pursuitLore: 'A salt-crusted brass compass whose needle always points toward forbidden plunder.',
    effectSummary: '+40% Gold from all kills & bosses · Assassinations burst bonus golden shrapnel.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.58)',
    sigil: '🧭',
  },
  paradox_hourglass: {
    id: 'paradox_hourglass',
    raidId: 'ghost_paradox',
    name: 'Paradox Fractured Glass',
    bossName: 'The Paradox Phantom',
    pursuitLore: 'Sands of five shattered timelines falling upward inside a spectral frame.',
    effectSummary: '-22% All Spell & Skill Cooldowns · Kills restore +1 MP across fractured space.',
    color: '#818cf8',
    glow: 'rgba(129,140,248,0.58)',
    sigil: '⏳',
  },
  velvet_signet: {
    id: 'velvet_signet',
    raidId: 'noble_mansion',
    name: 'Gilded Velvet Signet',
    bossName: 'Duke Aurelius Vane',
    pursuitLore: 'The ruby wax-seal of House Vane, worn by generations of crimson aristocrats.',
    effectSummary: '+18% Crit Chance & +25% Gold · Every Crit siphons +1 MP immediately.',
    color: '#e11d48',
    glow: 'rgba(225,29,72,0.58)',
    sigil: '💍',
  },
  abyssal_trident_pearl: {
    id: 'abyssal_trident_pearl',
    raidId: 'underwater_city',
    name: 'Abyssal Tide Pearl',
    bossName: 'Archon Nereus',
    pursuitLore: 'A luminescent sea-orb from the sunken heart of Pelagia that commands ocean pressure.',
    effectSummary: '+14% Jump Power · Attacks splash chilling tide ripples that slow foes.',
    color: '#0ea5e9',
    glow: 'rgba(14,165,233,0.58)',
    sigil: '🐚',
  },
  glacial_aegis_shard: {
    id: 'glacial_aegis_shard',
    raidId: 'frost_wardens',
    name: 'Glacial Warden Shard',
    bossName: 'High Warden Borealis',
    pursuitLore: 'An unmelting diamond of northern aurora frost carved from the Citadel spire.',
    effectSummary: 'Start every room with +1 Armor · Heavy & Spell hits freeze-chill foes (-35% speed).',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.58)',
    sigil: '❄️',
  },
  ironhorn_war_tusk: {
    id: 'ironhorn_war_tusk',
    raidId: 'barbaric_nation',
    name: 'Ironhorn War-Tusk',
    bossName: 'Warchief Kragg Ironhorn',
    pursuitLore: 'A notched mammoth ivory trophy bound in blood-forged iron chains.',
    effectSummary: '+25% Weapon Damage · Brutal melee hits stagger and shatter enemy guards.',
    color: '#dc2626',
    glow: 'rgba(220,38,38,0.58)',
    sigil: '🪓',
  },
  astral_eclipse_prism: {
    id: 'astral_eclipse_prism',
    raidId: 'eclipse_gauntlet',
    name: 'Astral Eclipse Prism',
    bossName: 'Draculor',
    pursuitLore: 'The supreme shard of the eternal eclipse that binds every realm together.',
    effectSummary: '+18% All Damage · Extended Parry/Evade windows & +25% Boss Gold/Score.',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.6)',
    sigil: '🌒',
  },
};

export const CHARM_SYNERGIES: CharmSynergyDef[] = [
  {
    id: 'blood_and_powder',
    name: 'Blood & Powder',
    charms: ['crimson_chalice', 'blackpowder_idol'],
    summary: 'Explosive blast waves siphon +1 HP every 4 detonations & gain +40% blast radius.',
    color: '#fb7185',
  },
  {
    id: 'plague_necromancy',
    name: 'Plague Necromancy',
    charms: ['phylactery_locket', 'mycelial_crown'],
    summary: 'Spore bursts summon twin homing soul-spores & cut spell MP costs by 1 (min 1).',
    color: '#c084fc',
  },
  {
    id: 'solar_singularity',
    name: 'Solar Singularity',
    charms: ['sunscarab_seal', 'singularity_core'],
    summary: 'Gravity pulls ignite enemies in solar plasma for +35% burn damage & +10% speed.',
    color: '#38bdf8',
  },
  {
    id: 'skyforged_tempest',
    name: 'Skyforged Tempest',
    charms: ['molten_anvil_heart', 'jade_feather_pearl'],
    summary: 'Airborne strikes hammer foes with molten gale waves (+30% crit damage & +1 extra Armor/room).',
    color: '#fbbf24',
  },
  {
    id: 'eclipse_sovereign',
    name: 'Eclipse Sovereign',
    charms: ['crimson_chalice', 'astral_eclipse_prism'],
    summary: 'Every Crit & Assassination restores +1 MP & extends Shadow Chain Momentum by +1.5s.',
    color: '#f43f5e',
  },
  {
    id: 'mycelial_mirage',
    name: 'Mycelial Mirage',
    charms: ['mycelial_crown', 'sunscarab_seal'],
    summary: 'Crouch-stealth & Shadow Chain turn you near-invisible (-35% foe vision) with toxic trail bursts.',
    color: '#34d399',
  },
  {
    id: 'astral_crane',
    name: 'Astral Crane',
    charms: ['singularity_core', 'jade_feather_pearl'],
    summary: 'Aerial attacks pull enemies into mid-air combos and launch piercing starlight feathers.',
    color: '#2dd4bf',
  },
  {
    id: 'forge_of_souls',
    name: 'Forge of Souls',
    charms: ['phylactery_locket', 'molten_anvil_heart'],
    summary: 'Melee hits charge spell power (+20% weapon & spell dmg) and ignite soul bolts.',
    color: '#f97316',
  },
  {
    id: 'crimson_spores',
    name: 'Crimson Spores',
    charms: ['crimson_chalice', 'mycelial_crown'],
    summary: 'Assassinations erupt crimson bloom clouds that heal +1 HP and refresh weapon skill CD.',
    color: '#ec4899',
  },
  {
    id: 'sunfire_ordnance',
    name: 'Sunfire Ordnance',
    charms: ['blackpowder_idol', 'sunscarab_seal'],
    summary: 'Blast waves leave scorching desert embers & grant +25% bonus gold from kills.',
    color: '#f59e0b',
  },
  {
    id: 'void_alchemist',
    name: 'Void Alchemist',
    charms: ['blackpowder_idol', 'singularity_core'],
    summary: 'Explosions implode enemies first, then detonate for +45% Void-Blast shockwave damage.',
    color: '#22d3ee',
  },
  {
    id: 'celestial_chalice',
    name: 'Celestial Chalice',
    charms: ['jade_feather_pearl', 'astral_eclipse_prism'],
    summary: 'Double aerial/drop-assassination loot & +25% overall crit multiplier across all weapons.',
    color: '#a7f3d0',
  },
  {
    id: 'gilded_furnace',
    name: 'Gilded Furnace',
    charms: ['deep_vein_heart', 'molten_anvil_heart'],
    summary: 'Crystal shatters ignite molten armor sparks (+1 extra Armor/room & +25% weapon damage).',
    color: '#f59e0b',
  },
  {
    id: 'crystal_singularity',
    name: 'Crystal Singularity',
    charms: ['deep_vein_heart', 'singularity_core'],
    summary: 'Void pulls fracture amethyst shards outward (+30% crit splash & +20% bonus gold).',
    color: '#e879f9',
  },
  {
    id: 'neon_paradox',
    name: 'Glitched Overclock',
    charms: ['neon_overclock_chip', 'paradox_hourglass'],
    summary: 'Time-warped reflexes grant +12% speed and cut all cooldowns by another 15%.',
    color: '#f472b6',
  },
  {
    id: 'gilded_corsair',
    name: 'Aristocrat Plunder',
    charms: ['cursed_compass', 'velvet_signet'],
    summary: 'Doubles treasure luck (+50% Gold total) and crits burst golden blood-sparks.',
    color: '#fbbf24',
  },
  {
    id: 'frozen_abyss',
    name: 'Permafrost Trench',
    charms: ['abyssal_trident_pearl', 'glacial_aegis_shard'],
    summary: 'Chilled foes take +30% shatter damage & every room begins with +1 extra Armor.',
    color: '#38bdf8',
  },
  {
    id: 'iron_glacier',
    name: 'Berserker Frostguard',
    charms: ['ironhorn_war_tusk', 'glacial_aegis_shard'],
    summary: 'Heavy strikes erupt jagged frost shockwaves (+25% weapon dmg & guard break).',
    color: '#fb7185',
  },
  {
    id: 'cyber_corsair',
    name: 'Chrome Buccaneer',
    charms: ['neon_overclock_chip', 'cursed_compass'],
    summary: 'Assassinations chain neon lightning & shower bonus gold across the deck.',
    color: '#22d3ee',
  },
];

export function computeActiveCharmSynergies(owned: BossCharmId[]): CharmSynergyDef[] {
  if (owned.length < 2) return [];
  const set = new Set<BossCharmId>(owned);
  return CHARM_SYNERGIES.filter((s) => set.has(s.charms[0]) && set.has(s.charms[1]));
}

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
      hpMult: 0.75,
      flatHpBonus: 0,
      chargeSpeedMult: 1.03,
      label: '1st Raid · Measured',
      detail: '25% lighter enemy HP and calmer 1.03x attack windups for early raids.',
    };
  }
  if (tier === 2) {
    return {
      tier: 2,
      hpMult: 0.94,
      flatHpBonus: 1,
      chargeSpeedMult: 1.21,
      label: '2nd Raid · Hardened',
      detail: 'Enemies step up to 94% base HP and 1.21x attack charge speed.',
    };
  }
  const hpMult = Number((0.75 + (tier - 1) * 0.19).toFixed(2));
  const chargeSpeedMult = Number((1.03 + (tier - 1) * 0.18).toFixed(2));
  return {
    tier,
    hpMult,
    flatHpBonus: Math.max(0, tier - 1),
    chargeSpeedMult,
    label: `Raid #${tier} · Escalated`,
    detail: `Enemies scale to ${Math.round(hpMult * 100)}% HP and ${chargeSpeedMult}x attack charge speed.`,
  };
}

export const CHARACTER_ORDER: CharacterId[] = [
  'hunter',
  'brute',
  'ronin',
  'minstrel',
  'monk',
  'wizard',
  'assassin',
  'ranger',
  'vanguard',
  'dancer',
  'bouncer',
];

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
      'Barehanded zealot in ash-grey robes. Very short reach but lightning-fast 3-hit fist chains that hit hard. Hold jump on the ground to charge a very high leap. [3] Pyre Dash aims in 8 directions — a downward dash slams into the ground. Starts with Cinder Palm.',
    traitSummary: 'Fists · Charged Leap · 8-Way Pyre Dash · Starts w/ Cinder Palm',
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
      'Robed spellcaster with a spire staff. [1] fires a mid-range elemental bolt that takes the colour and effect of your Affinity. Tap jump again in the air to float for 2 seconds — you can move, and you will not drop until the float ends. [3] Repulsion Nova blasts every foe around him away — into pits, they die. Starts with Chain of Storms.',
    traitSummary: 'Ranged Bolt · Air Float · Repulsion Nova · Starts w/ Chain of Storms',
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
  assassin: {
    id: 'assassin',
    name: 'The Hollow Assassin',
    title: 'Hooded Blade of the Last Candle',
    description:
      'Masked killer in charcoal leather and dark crimson. The deadliest assassin in the castle: bigger stealth and execute bonuses, quieter to enemies, and he can execute from a distance. [1] twin daggers (crouch + [1] throws one). [3] Mark for Death brands a foe from very far — press [3] again to shadow-step and execute it; a marked boss takes extra damage. Jump again in the air to Shadow Blink. Starts with Venom Needles.',
    traitSummary: 'Twin Daggers · Mark for Death · Shadow Blink · Starts w/ Venom Needles',
    defaultWeapon: 'shadow_daggers',
    defaultAbility: 'venom_needles',
    baseHp: 9,
    baseMp: 11,
    baseW: 26,
    baseH: 52,
    crouchBaseH: 31,
    speedMult: 1.08,
    jumpMult: 1.0,
    airJumps: 0,
    canWallCling: false,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#9f1239',
  },
  ranger: {
    id: 'ranger',
    name: 'Dusk Ranger',
    title: 'Repeater Crossbow Marksman',
    description:
      'Nimble ranged marksman armed with a Burst Crossbow that fires rapid 3-bolt spread volleys. [3] Vault Volley backflips out of danger while loosing a 5-bolt piercing fan! Starts with Bola Snare.',
    traitSummary: 'Ranged 3-Bolt Burst · Double Jump · Starts w/ Bola Snare',
    defaultWeapon: 'burst_crossbow',
    defaultAbility: 'ricochet_snare',
    baseHp: 9,
    baseMp: 11,
    baseW: 26,
    baseH: 52,
    crouchBaseH: 31,
    speedMult: 1.12,
    jumpMult: 1.03,
    airJumps: 1,
    canWallCling: false,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#10b981',
  },
  vanguard: {
    id: 'vanguard',
    name: 'Iron Vanguard',
    title: 'Tower-Shield Bastion Tank',
    description:
      'Heavily armored frontline tank (+5 Max HP & +2 free Armor Shield every room!). Swinging the Tower Shield & Mace automatically blocks frontal strikes and projectiles while knocking foes off ledges. Starts with Bastion Shockwave.',
    traitSummary: 'High HP & Armor · Auto-Guard · Starts w/ Bastion Shockwave',
    defaultWeapon: 'shield_mace',
    defaultAbility: 'aegis_slam',
    baseHp: 15,
    baseMp: 8,
    baseW: 36,
    baseH: 58,
    crouchBaseH: 36,
    speedMult: 0.88,
    jumpMult: 1.04,
    airJumps: 0,
    canWallCling: false,
    bonusBaseDamage: 1,
    bonusWeaponDamage: 0,
    accent: '#38bdf8',
  },
  dancer: {
    id: 'dancer',
    name: 'Sun Blade-Dancer',
    title: 'Looping Chakram Acrobat',
    description:
      'Graceful mid-range skirmisher who hurls Twin Chakrams that pierce enemies going out and loop back to slice their backs as you move! [3] Chakram Warp teleports to your blade. Starts with Solar Lotus Ring.',
    traitSummary: 'Looping Chakrams · Double Jump · Starts w/ Solar Lotus Ring',
    defaultWeapon: 'twin_chakram',
    defaultAbility: 'solar_bloom',
    baseHp: 9,
    baseMp: 11,
    baseW: 26,
    baseH: 50,
    crouchBaseH: 30,
    speedMult: 1.14,
    jumpMult: 1.06,
    airJumps: 1,
    canWallCling: false,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#fbbf24',
  },
  bouncer: {
    id: 'bouncer',
    name: 'Prism Striker',
    title: 'Ricochet Physics Bouncer',
    description:
      'High-velocity kinetic lancer whose attacks penetrate straight through foes and ricochet off surfaces & walls! Every 5 weapon levels adds +1 bounce and evolves [3] Glass Walls into a full 4-wall Box! Starts with Refracted Prism Ray.',
    traitSummary: 'Penetrating Bounce · Glass Box [3] · Starts w/ Prism Ray',
    defaultWeapon: 'prism_lance',
    defaultAbility: 'prism_beam',
    baseHp: 10,
    baseMp: 10,
    baseW: 26,
    baseH: 50,
    crouchBaseH: 30,
    speedMult: 1.12,
    jumpMult: 1.08,
    airJumps: 1,
    canWallCling: true,
    bonusBaseDamage: 0,
    bonusWeaponDamage: 0,
    accent: '#22d3ee',
  },
};

export const WEAPON_ORDER: WeaponId[] = [
  'whip',
  'rapier',
  'sword',
  'hammer',
  'greataxe',
  'meteor_flail',
  'katana',
  'naginata',
  'cleaver_greatsword',
  'ribbon_whip',
  'silk_whip',
  'war_fans',
  'ash_wraps',
  'kusarigama',
  'spire_staff',
  'orbiting_grimoire',
  'arcane_wand',
  'shadow_daggers',
  'short_blade',
  'burst_crossbow',
  'estoc_spear',
  'shield_mace',
  'joust_lance',
  'twin_chakram',
  'solar_glaive',
  'prism_lance',
  'prism_gauntlets',
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
  shadow_daggers: {
    id: 'shadow_daggers',
    name: 'Twin Nightfangs',
    shortName: 'Twin Daggers',
    description:
      'Assassin exclusive. Two black-bladed daggers: a fast 3-hit chain (stab, slash, cross-slash). Short-to-medium reach. Crouch + [1] throws a dagger that executes unaware foes from range.',
    skillName: 'Mark for Death',
    skillDescription:
      'Brands a foe from very far away. Press again to shadow-step behind the marked foe and execute it (non-bosses). A marked boss takes extra damage for a few seconds. Awakened: a longer mark and a ghost-dagger volley on execute. Mythic: the mark also lands on a second nearby foe. Transcendent: 35% faster cooldown and a shadow burst on execute.',
    skillCooldown: 6,
    accent: '#9f1239',
    ownerChar: 'assassin',
    isMainWeapon: true,
  },
  sword: {
    id: 'sword',
    name: 'Silver Broadsword',
    shortName: 'Sword',
    description: 'Hunter exclusive. Fast wide crescent slash hitting enemies in front, above, and below.',
    skillName: 'Blade Wave',
    skillDescription:
      'Launches a piercing silver crescent wave. Tier 3 unleashes Twin Cross-Waves!',
    skillCooldown: 1.05,
    accent: '#93c5fd',
    ownerChar: 'hunter',
  },
  estoc_spear: {
    id: 'estoc_spear',
    name: 'Needle Estoc',
    shortName: 'Quick Thrust',
    description: 'Ranger exclusive. Lightning-fast narrow forward pierce with crisp crit precision for close quarters.',
    skillName: 'Triple Thrust Flurry',
    skillDescription: 'Dashes forward with a rapid triple-piercing lunge that shreds guard.',
    skillCooldown: 1.15,
    accent: '#38bdf8',
    ownerChar: 'ranger',
  },
  short_blade: {
    id: 'short_blade',
    name: 'Swift Dirk',
    shortName: 'Quick Slash',
    description: 'Assassin exclusive. Ultra-rapid compact crescent cuts with almost zero recovery.',
    skillName: 'Flicker Cut',
    skillDescription: 'Instant razor-wave snap slash at close range with high crit chance.',
    skillCooldown: 0.9,
    accent: '#f472b6',
    ownerChar: 'assassin',
  },
  cleaver_greatsword: {
    id: 'cleaver_greatsword',
    name: 'Cleaver Greatsword',
    shortName: 'Charge Cleave',
    description: 'Ronin exclusive. Slow wide charging slash: single click [1] winds up and unleashes a towering cleave!',
    skillName: 'Titan Crescent',
    skillDescription: 'Unleashes a massive wide shock-arc that cleaves entire rows of enemies.',
    skillCooldown: 1.65,
    accent: '#f59e0b',
    ownerChar: 'ronin',
  },
  joust_lance: {
    id: 'joust_lance',
    name: 'Imperial War-Lance',
    shortName: 'Charge Thrust',
    description: 'Vanguard exclusive. Slow long charging thrust: single click [1] charges an ultra-long armor-piercing skewer!',
    skillName: 'Comet Skewer',
    skillDescription: 'Surges forward with a blazing ultra-long piercing lance thrust.',
    skillCooldown: 1.6,
    accent: '#fbbf24',
    ownerChar: 'vanguard',
  },
  arcane_wand: {
    id: 'arcane_wand',
    name: 'Arcane Bolt Wand',
    shortName: 'Ranged Wand',
    description: 'Wizard exclusive. Rapid ranged wand that fires crisp elemental arcane bolts across the room.',
    skillName: 'Starburst Volley',
    skillDescription: 'Fires a 3-way fan of piercing arcane bolts tuned to your Affinity.',
    skillCooldown: 1.35,
    accent: '#818cf8',
    ownerChar: 'wizard',
  },
  war_fans: {
    id: 'war_fans',
    name: 'Crescent War Fans',
    shortName: 'Wide Short',
    description: 'Minstrel exclusive. Super wide, very short quick weapon: lightning-fast 220° arc hitting front, above & behind!',
    skillName: 'Cyclone Petal Spin',
    skillDescription: 'Whirls steel fans 360° around the hero, deflecting bolts & shredding close foes.',
    skillCooldown: 1.25,
    accent: '#2dd4bf',
    ownerChar: 'minstrel',
  },
  meteor_flail: {
    id: 'meteor_flail',
    name: 'Seismic Impact Flail',
    shortName: 'Impact AoE',
    description: 'Brute exclusive. Heavy slam that detonates a huge shockwave damaging ALL foes around the impact point!',
    skillName: 'Crater Detonation',
    skillDescription: 'Slams the ground to trigger twin expanding seismic rings with heavy stagger.',
    skillCooldown: 1.85,
    accent: '#ef4444',
    ownerChar: 'brute',
  },
  orbiting_grimoire: {
    id: 'orbiting_grimoire',
    name: 'Orbiting Grimoire',
    shortName: 'Grimoire Orbs',
    description:
      'Wizard exclusive. 3 elemental orbs orbit around you. [1] launches an orb forward that explodes in an elemental AoE blast on contact! [3] cycles the active element (Fire, Glacial, Storm, Venom, Shadow, Light).',
    skillName: 'Shift Element',
    skillDescription:
      'Instantly cycles your Orbiting Grimoire element (Fire · Glacial · Storm · Venom · Shadow · Light) and refills an orb with an elemental pulse!',
    skillCooldown: 0.45,
    accent: '#c084fc',
    ownerChar: 'wizard',
  },
  burst_crossbow: {
    id: 'burst_crossbow',
    name: 'Dusk Burst Crossbow',
    shortName: 'Burst X-Bow',
    description:
      'Ranger exclusive. Fires a crisp 3-bolt fan volley with snappy reload rhythm and deadly crit precision.',
    skillName: 'Vault Volley',
    skillDescription:
      'Backflips gracefully out of danger with i-frames while loosing a 5-bolt piercing spread!',
    skillCooldown: 1.3,
    accent: '#10b981',
    ownerChar: 'ranger',
    isMainWeapon: true,
  },
  shield_mace: {
    id: 'shield_mace',
    name: 'Tower Shield & Mace',
    shortName: 'Shield & Mace',
    description:
      'Vanguard exclusive. Heavy blunt mace strikes that automatically raise your Tower Shield to block frontal hits & projectiles while slamming foes off ledges!',
    skillName: 'Bulwark Bash',
    skillDescription:
      'Charges forward behind your armored Tower Shield, breaking guards, stunning foes, and hurling them flying!',
    skillCooldown: 1.45,
    accent: '#38bdf8',
    ownerChar: 'vanguard',
    isMainWeapon: true,
  },
  kusarigama: {
    id: 'kusarigama',
    name: 'Chain-Sickle (Kusarigama)',
    shortName: 'Chain-Sickle',
    description:
      'Monk exclusive. Fast close-range sickle slashes fused with a weighted mid-range chain that yanks distant archers & casters straight into melee range!',
    skillName: 'Chain Tempest',
    skillDescription:
      'Whirls the weighted chain 360° around the Monk, dragging all nearby enemies inward and shredding them in a flurry!',
    skillCooldown: 1.35,
    accent: '#f59e0b',
    ownerChar: 'monk',
  },
  twin_chakram: {
    id: 'twin_chakram',
    name: 'Solar Twin Chakrams',
    shortName: 'Chakrams',
    description:
      'Blade-Dancer exclusive. Mid-range thrown blades that slice through enemies going out and loop back toward your live position for double back-hits!',
    skillName: 'Chakram Warp / Vortex',
    skillDescription:
      'If a Chakram is mid-flight, blink-warp directly to it in an invulnerable slashing cyclone! Otherwise deploy a hovering Razor Vortex trap.',
    skillCooldown: 1.4,
    accent: '#fbbf24',
    ownerChar: 'dancer',
    isMainWeapon: true,
  },
  solar_glaive: {
    id: 'solar_glaive',
    name: 'Solar Crescent Glaive',
    shortName: 'Sun Glaive',
    description:
      'Blade-Dancer exclusive. Sweeping twin-ended sun poleblade with wide graceful arcs and scorching crit edges.',
    skillName: 'Sunburst Spin-Dash',
    skillDescription:
      'Invulnerable 360° spinning golden dash-slash that cleaves foes, leaves a burning sun ring, and resets your air jump!',
    skillCooldown: 1.35,
    accent: '#f97316',
    ownerChar: 'dancer',
  },
  prism_lance: {
    id: 'prism_lance',
    name: 'Prism Ricochet Lance',
    shortName: 'Prism Lance',
    description:
      'Prism Striker exclusive. Penetrates straight through enemies into physics ricochet flight! Starts with 2 bounces (+1 every 5 weapon levels); final surface impact explodes!',
    skillName: 'Prism Glass Wall',
    skillDescription:
      'Summons a crystalline Glass Wall behind the nearest foe so you ricochet right back through them! Evolves into a full 4-wall Glass Box Machine!',
    skillCooldown: 1.5,
    accent: '#22d3ee',
    ownerChar: 'bouncer',
    isMainWeapon: true,
  },
  prism_gauntlets: {
    id: 'prism_gauntlets',
    name: 'Prism Pinball Gauntlets',
    shortName: 'Prism Fists',
    description:
      'Prism Striker exclusive. Rapid kinetic crystal fists that trigger agile short-burst ricochets and heavy knockback!',
    skillName: 'Ricochet Nova Slam',
    skillDescription:
      'Launches 4 bouncing crystal shards in an X-cross while vaulting upward into an explosive prism shockwave!',
    skillCooldown: 1.45,
    accent: '#e879f9',
    ownerChar: 'bouncer',
  },
};

export const BASE_ARCHETYPE_WEAPONS: WeaponId[] = [];

export function canCharacterUseWeapon(charId: CharacterId, weaponId: WeaponId): boolean {
  return WEAPONS[weaponId].ownerChar === charId;
}

export function getEvolutionTierName(tier: number): string {
  if (tier <= 0) return 'Base';
  if (tier === 1) return 'Awakened';
  if (tier === 2) return 'Mythic';
  if (tier === 3) return 'Transcendent';
  if (tier === 4) return 'Sovereign';
  return 'Apex';
}

// Route 1: Basic Attack Weapon Upgrade Progression (Max Lv 25 — Ascends every 5 levels!)
// Lightest raw damage route (free MP, no cooldown), upgrades Damage + Swing Speed + Arc/Reach!
export function getWeaponMilestoneInfo(nextLevel: number): {
  tag: string;
  title: string;
  description: string;
} {
  const clamped = Math.min(MAX_POWER_LEVEL, Math.max(2, nextLevel));
  if (clamped % 5 === 0) {
    const evoTier = clamped / 5;
    const tierName = getEvolutionTierName(evoTier);
    const stars = '★'.repeat(Math.min(5, evoTier));
    return {
      tag: `${stars} ${tierName.toUpperCase()} ASCENSION`,
      title: `Weapon Basic Lv ${clamped}/25 · ${tierName}`,
      description:
        evoTier === 1
          ? 'ASCENSION I (Lv 5)! Glowing trails, +1 flat dmg, faster swing speed & wider arc reach!'
          : evoTier === 2
            ? 'ASCENSION II (Lv 10)! Dual-aura arcs, +1 flat dmg & basic swings unleash bonus energy waves!'
            : evoTier === 3
              ? 'ASCENSION III (Lv 15)! Extra echo strike pulse on swings, huge arc reach & rapid attack tempo!'
              : evoTier === 4
                ? 'ASCENSION IV (Lv 20)! Sovereign storm-trails, +1 flat dmg, colossal sweep arc & blazing speed!'
                : 'APEX ASCENSION V (Lv 25 MAX)! Supreme weapon mastery: twin waves, maximum speed & sweeping reach!',
    };
  }

  const nextEvoTier = Math.floor(clamped / 5) + 1;
  const progressInTier = clamped % 5;
  const nextTierName = getEvolutionTierName(nextEvoTier);
  const grantsFlat = clamped % 4 === 0;
  return {
    tag: grantsFlat ? `+1 DMG · SPD · ARC (${progressInTier}/5)` : `+4% DMG · SPD · ARC (${progressInTier}/5)`,
    title: `Basic Weapon Lv ${clamped}/25`,
    description: grantsFlat
      ? `+1 flat attack dmg, +1.5% speed & +1.5% wider weapon arc (${progressInTier}/5 toward ${nextTierName} Ascension).`
      : `+4% basic dmg, +1.5% attack speed & +1.5% wider arc (${progressInTier}/5 toward ${nextTierName} Ascension).`,
  };
}

// Route 2: Weapon Power [3] Special Upgrade Progression (Max Lv 25 — Middle Power Tier!)
// Free MP, medium cooldown — stronger damage & cooldown scaling than Basic Attacks!
export function getWeaponPowerMilestoneInfo(nextLevel: number): {
  tag: string;
  title: string;
  description: string;
} {
  const clamped = Math.min(MAX_POWER_LEVEL, Math.max(2, nextLevel));
  if (clamped % 5 === 0) {
    const evoTier = clamped / 5;
    const tierName = getEvolutionTierName(evoTier);
    const stars = '★'.repeat(Math.min(5, evoTier));
    return {
      tag: `${stars} ${tierName.toUpperCase()} [3] ASCENSION`,
      title: `Weapon Power [3] Lv ${clamped}/25 · ${tierName}`,
      description:
        evoTier === 1
          ? 'ASCENSION I (Lv 5)! Extra special waves/arrows/walls, wider blast radius, +1 flat dmg & snappier cooldown!'
          : evoTier === 2
            ? 'ASCENSION II (Lv 10)! Triple waves, 3-wall prism cages, massive shockwaves & resonant [3] power!'
            : evoTier === 3
              ? 'ASCENSION III (Lv 15)! Full 4-wall prism box, colossal elemental volleys, +1 flat dmg & huge stun!'
              : evoTier === 4
                ? 'ASCENSION IV (Lv 20)! Sovereign [3] overdrive: blazing multi-wave blasts & rapid recharge!'
                : 'APEX ASCENSION V (Lv 25 MAX)! Ultimate Weapon Power mastery — devastating zero-mana special devastation!',
    };
  }

  const nextEvoTier = Math.floor(clamped / 5) + 1;
  const progressInTier = clamped % 5;
  const nextTierName = getEvolutionTierName(nextEvoTier);
  const grantsFlat = clamped % 3 === 0;
  return {
    tag: grantsFlat ? `+1 FLAT · -2.5% CD (${progressInTier}/5)` : `+10% PWR · -2.5% CD (${progressInTier}/5)`,
    title: `Weapon Power [3] Lv ${clamped}/25`,
    description: grantsFlat
      ? `+1 flat [3] special dmg, +10% power & -2.5% cooldown (${progressInTier}/5 toward ${nextTierName} Ascension).`
      : `+10% [3] special damage & -2.5% cooldown (${progressInTier}/5 toward ${nextTierName} Ascension).`,
  };
}

export function getWeaponCurrentTag(level: number): string {
  const tier = Math.floor(Math.max(0, level) / 5);
  const rem = level % 5;
  if (level >= MAX_POWER_LEVEL) return 'Apex MAX (25)';
  if (tier === 0) return `Lv ${level}/25 (${rem}/5 → Awakened)`;
  return `${getEvolutionTierName(tier)} (${rem}/5)`;
}

// Route 3: Spell Slot Upgrade Progression (Max Lv 25 — STRONGEST Route, Costs Mana!)
export function getSpellMilestoneInfo(
  abilityId: AbilityId,
  nextLevel: number
): { tag: string; summary: string } {
  const clamped = Math.min(MAX_POWER_LEVEL, Math.max(2, nextLevel));
  if (clamped % 5 === 0) {
    const evoTier = clamped / 5;
    const tierName = getEvolutionTierName(evoTier);
    const stars = '★'.repeat(Math.min(5, evoTier));
    switch (abilityId) {
      case 'fireball':
        return {
          tag: `${stars} ${tierName.toUpperCase()} SPELL`,
          summary:
            evoTier === 1
              ? 'ASCENSION I (Lv 5)! Twin blazing firebolts, roaring blast shockwave & heavy burning trail!'
              : `ASCENSION ${evoTier} (Lv ${clamped})! Multi-bolt inferno volley with colossal blast waves & massive Spell DMG!`,
        };
      case 'dash_attack':
        return {
          tag: `${stars} ${tierName.toUpperCase()} SPELL`,
          summary:
            evoTier === 1
              ? 'ASCENSION I (Lv 5)! Extended phantom dash with crimson blast wake, burn & sonic boom!'
              : `ASCENSION ${evoTier} (Lv ${clamped})! Multi-shockwave phantom blitz with huge piercing damage!`,
        };
      case 'grapple':
        return {
          tag: `${stars} ${tierName.toUpperCase()} SPELL`,
          summary:
            evoTier === 1
              ? 'ASCENSION I (Lv 5)! Scorched Chain Slam releases an AoE shockwave, burns & siphons +1 MP!'
              : `ASCENSION ${evoTier} (Lv ${clamped})! Massive chain detonation shockwave with bonus MP siphon!`,
        };
      case 'gas_bomb':
        return {
          tag: `${stars} ${tierName.toUpperCase()} SPELL`,
          summary:
            evoTier === 1
              ? 'ASCENSION I (Lv 5)! Launches twin volatile flasks that shatter into huge igniting clouds!'
              : `ASCENSION ${evoTier} (Lv ${clamped})! Colossal plague barrage with toxic inferno blast rings!`,
        };
      case 'fire_weapon':
        return {
          tag: `${stars} ${tierName.toUpperCase()} SPELL`,
          summary:
            evoTier === 1
              ? 'ASCENSION I (Lv 5)! Solar Overdrive: fiery impact shockwaves, heavy Burn & +35% crit!'
              : `ASCENSION ${evoTier} (Lv ${clamped})! Supernova Blade: massive flame nova bursts on strike & huge crit!`,
        };
      default:
        return {
          tag: `${stars} ${tierName.toUpperCase()} SPELL`,
          summary:
            evoTier === 1
              ? 'ASCENSION I (Lv 5)! Expanded area, extra projectiles/targets, stronger status effects & huge Spell DMG!'
              : `ASCENSION ${evoTier} (Lv ${clamped})! Colossal arcane scaling, extra multi-hits & supreme spell potency!`,
        };
    }
  }

  const nextEvoTier = Math.floor(clamped / 5) + 1;
  const progressInTier = clamped % 5;
  const nextTierName = getEvolutionTierName(nextEvoTier);
  const grantsFlat = clamped % 2 === 0;
  return {
    tag: grantsFlat ? `+1 FLAT · +14% PWR (${progressInTier}/5)` : `+14% PWR · -3% CD (${progressInTier}/5)`,
    summary: grantsFlat
      ? `Strongest route! +1 flat spell dmg, +14% spell power & -3% cooldown (${progressInTier}/5 toward ${nextTierName}).`
      : `Strongest route! +14% spell power & -3% cooldown; +1 flat dmg every 2 levels (${progressInTier}/5 toward ${nextTierName}).`,
  };
}

export function getSpellCurrentTag(level: number): string {
  const tier = Math.floor(Math.max(0, level) / 5);
  const rem = level % 5;
  if (level >= MAX_POWER_LEVEL) return 'Apex MAX (25)';
  if (tier === 0) return `Lv ${level}/25 (${rem}/5 → Awakened)`;
  return `${getEvolutionTierName(tier)} (${rem}/5)`;
}

export const ABILITY_ORDER: AbilityId[] = [
  'fireball',
  'fire_weapon',
  'dash_attack',
  'gas_bomb',
  'cinder_palm',
  'chain_storm',
  'venom_needles',
  'ricochet_snare',
  'aegis_slam',
  'solar_bloom',
  'prism_beam',
  'grapple',
  'frost_nova',
  'phantom_blades',
  'meteor_call',
  'blood_siphon',
];

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    shortName: 'Fireball',
    manaCost: 1,
    cooldown: 0.58,
    description: 'Hurls an explosive firebolt (1 MP). Ascends every 5 levels up to Lv 25 with Twin/Triple Inferno volleys!',
    accent: '#f97316',
    starterChar: 'hunter',
  },
  dash_attack: {
    id: 'dash_attack',
    name: 'Forward Dash Attack',
    shortName: 'Dash Slash',
    manaCost: 1,
    cooldown: 1.25,
    description: 'Surges rapidly forward, piercing foes (1 MP). Ascends every 5 levels with blazing shockwave wakes!',
    accent: '#ef4444',
    starterChar: 'ronin',
  },
  grapple: {
    id: 'grapple',
    name: 'Grappling Hook',
    shortName: 'Grapple',
    manaCost: 1,
    cooldown: 0.85,
    description: 'Forge Spell · Fires a chain hook upward (1 MP) to latch rafters or slam foes.',
    accent: '#94a3b8',
    forgeOnly: true,
  },
  gas_bomb: {
    id: 'gas_bomb',
    name: 'Gas Bomb',
    shortName: 'Gas Bomb',
    manaCost: 1,
    cooldown: 1.9,
    description: 'Shatters an alchemical flask into a toxic cloud (1 MP). Ascends every 5 levels with multi-flask barrages!',
    accent: '#22c55e',
    starterChar: 'minstrel',
  },
  fire_weapon: {
    id: 'fire_weapon',
    name: 'Fire Weapon',
    shortName: 'Fire Buff',
    manaCost: 1,
    cooldown: 3.6,
    description: 'Ignites your weapon for fiery burst damage & +25% crit (1 MP). Ascends into Supernova Blade!',
    accent: '#f59e0b',
    starterChar: 'brute',
  },
  cinder_palm: {
    id: 'cinder_palm',
    name: 'Cinder Palm',
    shortName: 'Cinder Palm',
    manaCost: 1,
    cooldown: 1.45,
    description: 'Open-palm blast releasing a cone of embers: heavy damage, stun & shove (1 MP). Ascends every 5 levels.',
    accent: '#a8a29e',
    starterChar: 'monk',
  },
  chain_storm: {
    id: 'chain_storm',
    name: 'Chain of Storms',
    shortName: 'Chain Storm',
    manaCost: 2,
    cooldown: 2.1,
    description: 'Calls devastating lightning that leaps between foes, stunning them (2 MP). Takes your Affinity colour.',
    accent: '#60a5fa',
    starterChar: 'wizard',
  },
  venom_needles: {
    id: 'venom_needles',
    name: 'Venom Needles',
    shortName: 'Venom',
    manaCost: 1,
    cooldown: 1.35,
    description: 'Flicks a fan of poisoned needles (1 MP, more every 5 levels) inflicting lethal toxic damage.',
    accent: '#4d7c0f',
    starterChar: 'assassin',
  },
  ricochet_snare: {
    id: 'ricochet_snare',
    name: 'Bola Snare',
    shortName: 'Bola Snare',
    manaCost: 1,
    cooldown: 1.5,
    description: 'Ranger starter · Weighted hunter bola (1 MP) that pierces, binds, stuns & bursts with shrapnel!',
    accent: '#10b981',
    starterChar: 'ranger',
  },
  aegis_slam: {
    id: 'aegis_slam',
    name: 'Bastion Shockwave',
    shortName: 'Aegis Slam',
    manaCost: 1,
    cooldown: 2.2,
    description: 'Vanguard starter · Grants +1 Armor Shield and slams twin iron shockwaves across the floor (1 MP)!',
    accent: '#38bdf8',
    starterChar: 'vanguard',
  },
  solar_bloom: {
    id: 'solar_bloom',
    name: 'Solar Lotus Ring',
    shortName: 'Solar Ring',
    manaCost: 1,
    cooldown: 1.65,
    description: 'Blade-Dancer starter · Expanding ring of radiant sun-petals that slice & burn nearby foes (1 MP)!',
    accent: '#fbbf24',
    starterChar: 'dancer',
  },
  prism_beam: {
    id: 'prism_beam',
    name: 'Refracted Prism Ray',
    shortName: 'Prism Ray',
    manaCost: 1,
    cooldown: 1.6,
    description: 'Prism Striker starter · Blinding crystalline ray piercing enemies in a line & bursting prism shards (1 MP)!',
    accent: '#22d3ee',
    starterChar: 'bouncer',
  },
  frost_nova: {
    id: 'frost_nova',
    name: 'Glacial Ring',
    shortName: 'Frost Nova',
    manaCost: 1,
    cooldown: 2.0,
    description: 'Forge New Spell · Freezing crystalline nova chilling & staggering all nearby foes (1 MP)!',
    accent: '#67e8f9',
    forgeOnly: true,
  },
  phantom_blades: {
    id: 'phantom_blades',
    name: 'Spectral Knives',
    shortName: 'Ghost Blades',
    manaCost: 1,
    cooldown: 1.55,
    description: 'Forge New Spell · Summons 5 homing spirit knives that seek out nearby enemies and pierce shields (1 MP)!',
    accent: '#c084fc',
    forgeOnly: true,
  },
  meteor_call: {
    id: 'meteor_call',
    name: 'Cataclysm Meteor',
    shortName: 'Meteor Call',
    manaCost: 2,
    cooldown: 2.6,
    description: 'Forge New Spell · Calls down a blazing sky meteor onto the nearest foe with a massive crater & Burn (2 MP)!',
    accent: '#fb7185',
    forgeOnly: true,
  },
  blood_siphon: {
    id: 'blood_siphon',
    name: 'Crimson Siphon',
    shortName: 'Blood Siphon',
    manaCost: 2,
    cooldown: 3.0,
    description: 'Forge New Spell · Unleashes crimson tendrils draining all nearby foes and restoring +1 HP on hit (2 MP)!',
    accent: '#dc2626',
    forgeOnly: true,
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

export const SPECIAL_ITEM_ORDER: SpecialItemId[] = [
  'eclipse_hourglass',
  'hero_tag_horn',
  'smoke_vial',
  'fire_bomb',
];

export const SPECIAL_ITEMS: Record<SpecialItemId, SpecialItemDef> = {
  eclipse_hourglass: {
    id: 'eclipse_hourglass',
    name: 'Eclipse Hourglass',
    shortName: 'Hourglass',
    description:
      'Rare relic [6]: Shatters time for 4.2s, slowing all enemies to a crawl, dealing 8 Cataclysm DMG + Burn to every foe on screen, and restoring +2 MP.',
    cooldown: 10,
    maxCharges: 3,
    accent: '#c084fc',
  },
  hero_tag_horn: {
    id: 'hero_tag_horn',
    name: 'Phantom Tag Horn',
    shortName: 'Tag Horn',
    description:
      'Rare relic [6]: Summons TWO phantom companion heroes beside you for a synchronized team-up strike — slamming, slashing, and healing +1 HP & +2 MP!',
    cooldown: 7,
    maxCharges: 3,
    accent: '#38bdf8',
  },
  smoke_vial: {
    id: 'smoke_vial',
    name: 'Shadow Smoke Vial',
    shortName: 'Smoke Vial',
    description:
      'Simple tactical item [6]: Shatters an obscuring smoke bomb that blinds & stuns nearby foes and grants 3.5s Shadow Ambush stealth for instant backstabs!',
    cooldown: 6,
    maxCharges: 3,
    accent: '#94a3b8',
    isSimple: true,
  },
  fire_bomb: {
    id: 'fire_bomb',
    name: 'Alchemist Fire Bomb',
    shortName: 'Fire Bomb',
    description:
      'Simple tactical item [6]: Detonates a blazing alchemical flask around you for crisp AoE fire damage, guard-break stagger, and 4s Burn!',
    cooldown: 5,
    maxCharges: 3,
    accent: '#fb923c',
    isSimple: true,
  },
};

export const HERO_SKIN_ORDER: HeroSkinId[] = [
  'default',
  'crimson_moon',
  'gilded_saint',
  'abyssal_knight',
  'phantom_ivory',
];

export const HERO_SKINS: Record<HeroSkinId, HeroSkinDef> = {
  default: {
    id: 'default',
    name: 'Classic Oath',
    description: 'Signature castle vestments of this hero.',
    coreCost: 0,
    accent: '#cbd5e1',
    filter: 'none',
    auraColor: 'transparent',
  },
  crimson_moon: {
    id: 'crimson_moon',
    name: 'Crimson Bloodmoon',
    description: 'Scarlet-drenched moonlight attire with a deep ruby aura.',
    coreCost: 1,
    accent: '#f43f5e',
    filter: 'hue-rotate(-24deg) saturate(1.45) contrast(1.08)',
    auraColor: 'rgba(244, 63, 94, 0.36)',
  },
  gilded_saint: {
    id: 'gilded_saint',
    name: 'Gilded Cathedral',
    description: 'Burnished gold-and-ivory regalia blessed with radiant shimmer.',
    coreCost: 2,
    accent: '#fbbf24',
    filter: 'sepia(0.45) saturate(1.65) brightness(1.12)',
    auraColor: 'rgba(251, 191, 36, 0.36)',
  },
  abyssal_knight: {
    id: 'abyssal_knight',
    name: 'Abyssal Eclipse',
    description: 'Midnight violet shadow-plate forged in cursed chambers.',
    coreCost: 2,
    accent: '#a855f7',
    filter: 'hue-rotate(215deg) saturate(1.35) brightness(0.95)',
    auraColor: 'rgba(168, 85, 247, 0.4)',
  },
  phantom_ivory: {
    id: 'phantom_ivory',
    name: 'Spectral Ivory',
    description: 'Ghostly silver-cyan frostweave shimmering with moonlit mist.',
    coreCost: 3,
    accent: '#67e8f9',
    filter: 'hue-rotate(145deg) saturate(0.85) brightness(1.18)',
    auraColor: 'rgba(103, 232, 249, 0.38)',
  },
};

export const GOLD_PREP_RECIPES: GoldPrepRecipe[] = [
  {
    id: 'gold_hp_potion',
    name: 'Health Potion',
    description: 'Restores +2 HP immediately when used [5].',
    goldCost: 15,
    category: 'potion',
    itemId: 'health_potion',
    accent: '#dc2626',
  },
  {
    id: 'gold_mp_potion',
    name: 'Mana Potion',
    description: 'Restores +2 MP immediately when used [5].',
    goldCost: 15,
    category: 'potion',
    itemId: 'mana_potion',
    accent: '#3b82f6',
  },
  {
    id: 'gold_armor_potion',
    name: 'Armor Potion',
    description: 'Grants 2 iron shield charges for 14s that block incoming hits [5].',
    goldCost: 20,
    category: 'potion',
    itemId: 'armor_potion',
    accent: '#cbd5e1',
  },
  {
    id: 'gold_smoke_vial',
    name: 'Shadow Smoke Vial (+1 Charge)',
    description: 'Simple special item [6]: Blinds foes & grants 3.5s instant Ambush stealth (max 3).',
    goldCost: 25,
    category: 'special_item',
    specialItemId: 'smoke_vial',
    accent: '#94a3b8',
  },
  {
    id: 'gold_fire_bomb',
    name: 'Alchemist Fire Bomb (+1 Charge)',
    description: 'Simple special item [6]: Blazing AoE fire burst with guard-break & 4s Burn (max 3).',
    goldCost: 25,
    category: 'special_item',
    specialItemId: 'fire_bomb',
    accent: '#fb923c',
  },
];

export const SACRIFICE_ALTAR_ORDER: SacrificeAltarStat[] = [
  'hp',
  'mp',
  'weapon',
  'spell',
  'regen',
  'agility',
];

export const SACRIFICE_ALTAR_OFFERINGS: Record<SacrificeAltarStat, SacrificeAltarDef> = {
  hp: {
    stat: 'hp',
    name: 'Blood Vessel Offering',
    relicLabel: 'HP Relic Levels',
    bonusLabel: '+1 Permanent Starting Max HP (All Heroes)',
    description: 'Sacrifice 10 HP Relic levels from this run + 2 Boss Cores to grant +1 permanent Max HP to every hero forever.',
    coreCost: 2,
    levelsRequired: 10,
    accent: '#ef4444',
  },
  mp: {
    stat: 'mp',
    name: 'Astral Chalice Offering',
    relicLabel: 'MP Relic Levels',
    bonusLabel: '+1 Permanent Starting Max MP (All Heroes)',
    description: 'Sacrifice 10 MP Relic levels from this run + 2 Boss Cores to grant +1 permanent Max MP to every hero forever.',
    coreCost: 2,
    levelsRequired: 10,
    accent: '#60a5fa',
  },
  weapon: {
    stat: 'weapon',
    name: 'Forged Steel Offering',
    relicLabel: 'Weapon Relic Levels',
    bonusLabel: '+1 Permanent Starting Weapon Lv (All Heroes)',
    description: 'Sacrifice 10 Weapon Relic levels from this run + 2 Boss Cores to start every future run with +1 Weapon Lv on all heroes.',
    coreCost: 2,
    levelsRequired: 10,
    accent: '#f59e0b',
  },
  spell: {
    stat: 'spell',
    name: 'Grimoire Ash Offering',
    relicLabel: 'Spell Relic Levels',
    bonusLabel: '+1 Permanent Starting Spell Lv (All Heroes)',
    description: 'Sacrifice 10 Spell Relic levels from this run + 2 Boss Cores to start every future run with +1 Spell Lv on all heroes.',
    coreCost: 2,
    levelsRequired: 10,
    accent: '#a855f7',
  },
  regen: {
    stat: 'regen',
    name: 'Undying Hearth Offering',
    relicLabel: 'Regen Relic Levels',
    bonusLabel: '+1 Permanent Room Regen (All Heroes)',
    description: 'Sacrifice 10 Regen Relic levels from this run + 2 Boss Cores to grant +1 HP/MP room recovery to every hero forever.',
    coreCost: 2,
    levelsRequired: 10,
    accent: '#34d399',
  },
  agility: {
    stat: 'agility',
    name: 'Shadow Gale Offering',
    relicLabel: 'Shadow / Agility Levels',
    bonusLabel: '+4% Permanent Crit & Speed (All Heroes)',
    description: 'Sacrifice 10 Shadow/Agility Relic levels from this run + 2 Boss Cores for permanent +4% Crit & +4% Speed on all heroes.',
    coreCost: 2,
    levelsRequired: 10,
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
    name: 'Forge Silver Broadsword (Hunter)',
    description: 'Vampire Hunter exclusive. Fast crescent slash with Blade Wave [3].',
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
  freezeMs: 280,
  bossFreezeMult: 1.0,
  slowMoScale: 0.26,
  slowMoMs: 420,
  zoomPunch: 0.16,
  flash: true,
  flashAlpha: 0.72,
  impactFrameMs: 115,
  shake: 17.5,
  shakeMs: 400,
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
  monkChargeTime: 0.55,
  monkChargeJumpMult: 1.65,
  monkDashDirections: true,
  wizardBoltSpeed: 760,
  wizardBoltRange: 360,
  wizardBoltDamage: 1,
  wizardNovaRadius: 150,
  wizardNovaForce: 560,
  wizardNovaLift: 150,
  wizardNovaDamage: 2,
  wizardNovaCooldown: 2.0,
  wizardFloatDuration: 2.0,
  wizardFloatMoveSpeed: 1.0,
  assassinVisionMult: 0.62,
  assassinExecRange: 320,
  assassinExecHpPct: 0.25,
  assassinMarkRange: 1100,
  assassinMarkDuration: 9,
  assassinMarkCooldown: 6,
  assassinBossMarkBonusPct: 50,
  assassinBossMarkDuration: 8,
  assassinDaggerRange: 460,
  assassinDaggerDamage: 2,
  assassinDaggerCooldown: 0.7,
  assassinBlinkDistance: 190,
  assassinBlinkIFrames: 0.28,
  assassinComboBonus: 1,
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
      attackTimeMult: id === 'monk' ? 0.7 : id === 'wizard' ? 1.1 : id === 'assassin' ? 0.62 : 1.0,
      attackRangeMult: id === 'monk' ? 0.6 : id === 'assassin' ? 0.82 : 1.0,
      spellCostMult: 1.0,
      spellCooldownMult: 1.0,
      // The Assassin is the best at stealth kills: bigger execute damage, MP reward, i-frames and chain.
      assassinDamageMult: id === 'assassin' ? 1.6 : 1.0,
      assassinMpReward: id === 'assassin' ? 3 : 2,
      assassinIFramesSec: id === 'assassin' ? 0.6 : 0.42,
      shadowChainSec: id === 'assassin' ? 4.4 : 2.8,
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


export const DEFAULT_COMBAT_TUNING: CombatTuning = {
  weaponEvoAttacks: true,
  affinityAttacks: true,
  evoReach: 1.0,
  evoPower: 1.0,
  affinityPower: 1.0,
  mutedBolts: true,
};

export const DEFAULT_SOUND_TUNING: SoundTuning = {
  musicVol: 60,
  ambienceVol: 55,
  sfxVol: 90,
  footstepVol: 100,
  musicOn: true,
  ambienceOn: true,
  footstepsOn: true,
  uiSounds: true,
  combatCooldownSec: 10,
  crossfadeSec: 1.8,
  heavyFoeCount: 4,
};

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
  mobileBtnBottomLeft: 4,
  mobileBtnBottomRight: 5,
  mobileMiniButtons: false,
  mobileJumpThreshold: 0.55,
  mobileTapMs: 220,

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
  combat: DEFAULT_COMBAT_TUNING,
  sound: DEFAULT_SOUND_TUNING,
  characters: buildDefaultCharacterTuning(),
  enemies: buildDefaultEnemyTuning(false) as Record<string, EnemyTuning>,
  bosses: buildDefaultEnemyTuning(true) as Record<string, BossTuning>,
};


import type {
  BaseElementId,
  CombinedElementId,
  CursedRelicDef,
  CursedRelicId,
  ElementalStatusId,
  ElementDef,
} from './types';

// ============================================================================
// 12 BASE AFFINITIES — Every Affinity Shapes Your Playstyle!
// Max Level: 5 for Pure Single Affinity · 4 for Dual Fused Affinity
// ============================================================================
export const BASE_ELEMENT_ORDER: BaseElementId[] = [
  'water',
  'fire',
  'air',
  'earth',
  'light',
  'shadow',
  'storm',
  'glacial',
  'venom',
  'blood',
  'metal',
  'arcane',
];

export const BASE_ELEMENTS: Record<BaseElementId, ElementDef> = {
  water: {
    id: 'water',
    name: 'Water',
    title: 'Tidal Flow',
    playstyleTag: 'MANA FLOW · TEMPO',
    shortDesc: 'Chills foes (-35% speed) & restores +1 MP every 4 hits (faster with Lv).',
    description:
      'Channel ceaseless tidewater: chills struck enemies, splashes nearby foes, and replenishes +1 MP on steady strike chains.',
    primaryColor: '#38bdf8',
    secondaryColor: '#0284c7',
    glowColor: '#bae6fd',
    isCombined: false,
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    title: 'Cinder Inferno',
    playstyleTag: 'BURN · BURST DPS',
    shortDesc: 'Ignites enemies with blazing Burn DoT & explosive ember crits.',
    description:
      'Wreathe every strike in roaring flame: scorches enemies with heavy Burn DoT and detonates fiery shockwaves on critical hits.',
    primaryColor: '#f97316',
    secondaryColor: '#dc2626',
    glowColor: '#fed7aa',
    isCombined: false,
  },
  air: {
    id: 'air',
    name: 'Air',
    title: 'Gale Zephyr',
    playstyleTag: 'AGILITY · WIND BLADES',
    shortDesc: '+16% Move Speed, snappier swings & slicing Wind Crescents.',
    description:
      'Move like a tempest: +16% speed (scales per Lv), faster basic attack startup, and sweeping wind blades cleave distant foes.',
    primaryColor: '#2dd4bf',
    secondaryColor: '#10b981',
    glowColor: '#ccfbf1',
    isCombined: false,
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    title: 'Stone Juggernaut',
    playstyleTag: 'TANK · ARMOR & STAGGER',
    shortDesc: '+1 Max HP when taken or deepened. +1 Armor Shield per room for each affinity level.',
    description:
      'Taking Earth, and each time you deepen a single Earth affinity, grants +1 Max HP. Each affinity level also gives +1 Armor Shield at the start of every room.',
    primaryColor: '#d97706',
    secondaryColor: '#92400e',
    glowColor: '#fde68a',
    isCombined: false,
  },
  light: {
    id: 'light',
    name: 'Light',
    title: 'Radiant Dawn',
    playstyleTag: 'BOSS SLAYER · HOLY HEAL',
    shortDesc: 'Calls Radiant Sky Beams, +25% Boss DMG & heals +1 HP on kills.',
    description:
      'Smite darkness with golden heaven-beams: +25% Boss damage (scales per Lv), radiant AoE smites, and divine healing sparks on kills.',
    primaryColor: '#fde047',
    secondaryColor: '#f59e0b',
    glowColor: '#fef9c3',
    isCombined: false,
  },
  shadow: {
    id: 'shadow',
    name: 'Shadow',
    title: 'Umbral Assassin',
    playstyleTag: 'STEALTH · ASSASSINATION',
    shortDesc: 'Enemies see -30% shorter, easier Assassinations, +18% Crit & Void Drain.',
    description:
      'Master the silent kill: shrinks enemy vision cones (-30% to -55%), widens backstab & drop-assassination triggers, +18% crit, and +2 assassination DMG.',
    primaryColor: '#a855f7',
    secondaryColor: '#6d28d9',
    glowColor: '#e9d5ff',
    isCombined: false,
  },
  storm: {
    id: 'storm',
    name: 'Storm',
    title: 'Crackling Thunder',
    playstyleTag: 'CHAIN SHOCK · HASTE',
    shortDesc: 'Arcs chain lightning across foes, stuns crowds & +12% cooldown haste.',
    description:
      'Supercharge strikes with jumping thunderbolts that stun crowds and accelerate weapon & spell cooldowns.',
    primaryColor: '#60a5fa',
    secondaryColor: '#facc15',
    glowColor: '#dbeafe',
    isCombined: false,
  },
  glacial: {
    id: 'glacial',
    name: 'Glacial',
    title: 'Rime Shatter',
    playstyleTag: 'FREEZE · SHATTER CRIT',
    shortDesc: 'Deep-freezes foes (-50% speed) & shatters chilled foes for bonus burst.',
    description:
      'Encase blades in absolute-zero glacier ice that slows enemies to a crawl and shatters chilled targets for extra critical burst.',
    primaryColor: '#7dd3fc',
    secondaryColor: '#2563eb',
    glowColor: '#f0f9ff',
    isCombined: false,
  },
  venom: {
    id: 'venom',
    name: 'Venom',
    title: 'Corrosive Blight',
    playstyleTag: 'POISON · ARMOR MELT',
    shortDesc: 'Stacks lethal Poison DoT, melts shields & erupts toxic mist on kill.',
    description:
      'Coat attacks in virulent blight that ticks corrosive poison damage, strips enemy guards, and spreads toxic bursts when foes fall.',
    primaryColor: '#84cc16',
    secondaryColor: '#15803d',
    glowColor: '#ecfccb',
    isCombined: false,
  },
  blood: {
    id: 'blood',
    name: 'Blood',
    title: 'Sanguine Rite',
    playstyleTag: 'BERSERKER · LIFESTEAL',
    shortDesc: '+16% Raw Strike DMG & siphons +1 HP every 5 enemy kills.',
    description:
      'Fuel relentless crimson aggression: boosts raw weapon strike damage, empowers crits, and siphons vitality back on kill streaks.',
    primaryColor: '#f43f5e',
    secondaryColor: '#9f1239',
    glowColor: '#fecdd3',
    isCombined: false,
  },
  metal: {
    id: 'metal',
    name: 'Metal',
    title: 'Iron Bulwark',
    playstyleTag: 'COUNTER · IRON SHRAPNEL',
    shortDesc: '+1 Armor Shield per room, sharper Parries & steel shrapnel cleaves.',
    description:
      'Forge unyielding battle-steel: grants +1 Armor Shield every room, wider parry-guard timing, and launches razor iron splinters on heavy hits.',
    primaryColor: '#cbd5e1',
    secondaryColor: '#475569',
    glowColor: '#f8fafc',
    isCombined: false,
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane',
    title: 'Astral Weaver',
    playstyleTag: 'SPELLWEAVER · MAX MP',
    shortDesc: '+2 Max MP, +14% Spell Haste & strikes fire homing Astral Bolts.',
    description:
      'Channel pure starlight sorcery: expands Max MP by +2, speeds up all spell cooldowns, and weaves homing arcane sparks into basic attacks.',
    primaryColor: '#e879f9',
    secondaryColor: '#4f46e5',
    glowColor: '#fae8ff',
    isCombined: false,
  },
};

// ============================================================================
// ALL 66 UNIQUE DUAL FUSIONS (12 × 11 / 2 = 66 — ZERO REPEATS, ZERO MISMATCHES!)
// ============================================================================
interface FusionSpec {
  id: CombinedElementId;
  name: string;
  parents: [BaseElementId, BaseElementId];
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  shortDesc: string;
  description: string;
}

const FUSION_SPECS: FusionSpec[] = [
  // WATER + ... (11)
  {
    id: 'steam',
    name: 'Steam',
    parents: ['water', 'fire'],
    primaryColor: '#fb923c',
    secondaryColor: '#38bdf8',
    glowColor: '#ffedd5',
    shortDesc: 'Chill lasts 1s longer.',
    description: 'Steam (water + fire). Chill lasts 1s longer.',
  },
  {
    id: 'mist',
    name: 'Mist',
    parents: ['water', 'air'],
    primaryColor: '#67e8f9',
    secondaryColor: '#5eead4',
    glowColor: '#ecfeff',
    shortDesc: 'Chill lasts 2s longer.',
    description: 'Mist (water + air). Chill lasts 2s longer.',
  },
  {
    id: 'nature',
    name: 'Nature',
    parents: ['water', 'earth'],
    primaryColor: '#4ade80',
    secondaryColor: '#0ea5e9',
    glowColor: '#dcfce7',
    shortDesc: 'Chill lasts 3s longer.',
    description: 'Nature (water + earth). Chill lasts 3s longer.',
  },
  {
    id: 'prism',
    name: 'Prism',
    parents: ['water', 'light'],
    primaryColor: '#f472b6',
    secondaryColor: '#38bdf8',
    glowColor: '#fef08a',
    shortDesc: 'Every 2nd hit restores 1 MP.',
    description: 'Prism (water + light). Every 2nd hit restores 1 MP.',
  },
  {
    id: 'abyss',
    name: 'Abyss',
    parents: ['water', 'shadow'],
    primaryColor: '#6366f1',
    secondaryColor: '#0284c7',
    glowColor: '#c7d2fe',
    shortDesc: 'Every 3rd hit restores 1 MP.',
    description: 'Abyss (water + shadow). Every 3rd hit restores 1 MP.',
  },
  {
    id: 'maelstrom',
    name: 'Maelstrom',
    parents: ['water', 'storm'],
    primaryColor: '#38bdf8',
    secondaryColor: '#facc15',
    glowColor: '#e0f2fe',
    shortDesc: 'Every 4th hit restores 1 MP.',
    description: 'Maelstrom (water + storm). Every 4th hit restores 1 MP.',
  },
  {
    id: 'permafrost',
    name: 'Permafrost',
    parents: ['water', 'glacial'],
    primaryColor: '#60a5fa',
    secondaryColor: '#e0f2fe',
    glowColor: '#ffffff',
    shortDesc: 'Every 5th hit restores 1 MP.',
    description: 'Permafrost (water + glacial). Every 5th hit restores 1 MP.',
  },
  {
    id: 'mire',
    name: 'Mire',
    parents: ['water', 'venom'],
    primaryColor: '#22c55e',
    secondaryColor: '#0ea5e9',
    glowColor: '#bbf7d0',
    shortDesc: 'Every 6th hit restores 1 MP.',
    description: 'Mire (water + venom). Every 6th hit restores 1 MP.',
  },
  {
    id: 'ichor',
    name: 'Ichor',
    parents: ['water', 'blood'],
    primaryColor: '#f43f5e',
    secondaryColor: '#38bdf8',
    glowColor: '#ffe4e6',
    shortDesc: '+1 max MP when you fuse.',
    description: 'Ichor (water + blood). +1 max MP when you fuse.',
  },
  {
    id: 'quicksilver',
    name: 'Quicksilver',
    parents: ['water', 'metal'],
    primaryColor: '#94a3b8',
    secondaryColor: '#38bdf8',
    glowColor: '#f1f5f9',
    shortDesc: '+2 max MP when you fuse.',
    description: 'Quicksilver (water + metal). +2 max MP when you fuse.',
  },
  {
    id: 'aether_tide',
    name: 'Glass Tide',
    parents: ['water', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#38bdf8',
    glowColor: '#f3e8ff',
    shortDesc: '+3 max MP when you fuse.',
    description: 'Glass Tide (water + arcane). +3 max MP when you fuse.',
  },

  // FIRE + ... (10)
  {
    id: 'wildfire',
    name: 'Wildfire',
    parents: ['fire', 'air'],
    primaryColor: '#fb923c',
    secondaryColor: '#2dd4bf',
    glowColor: '#ffedd5',
    shortDesc: 'Burns last 1s longer.',
    description: 'Wildfire (fire + air). Burns last 1s longer.',
  },
  {
    id: 'magma',
    name: 'Magma',
    parents: ['fire', 'earth'],
    primaryColor: '#ef4444',
    secondaryColor: '#d97706',
    glowColor: '#fecaca',
    shortDesc: 'Burns last 2s longer.',
    description: 'Magma (fire + earth). Burns last 2s longer.',
  },
  {
    id: 'solar',
    name: 'Solar',
    parents: ['fire', 'light'],
    primaryColor: '#facc15',
    secondaryColor: '#f97316',
    glowColor: '#fef9c3',
    shortDesc: 'Burns last 3s longer.',
    description: 'Solar (fire + light). Burns last 3s longer.',
  },
  {
    id: 'hellfire',
    name: 'Hellfire',
    parents: ['fire', 'shadow'],
    primaryColor: '#e11d48',
    secondaryColor: '#9333ea',
    glowColor: '#fbcfe8',
    shortDesc: 'Spells deal +1 damage.',
    description: 'Hellfire (fire + shadow). Spells deal +1 damage.',
  },
  {
    id: 'plasma',
    name: 'Plasma',
    parents: ['fire', 'storm'],
    primaryColor: '#f97316',
    secondaryColor: '#60a5fa',
    glowColor: '#fde68a',
    shortDesc: 'Spells deal +2 damage.',
    description: 'Plasma (fire + storm). Spells deal +2 damage.',
  },
  {
    id: 'frostburn',
    name: 'Frostburn',
    parents: ['fire', 'glacial'],
    primaryColor: '#fb7185',
    secondaryColor: '#7dd3fc',
    glowColor: '#f0f9ff',
    shortDesc: 'Spells deal +3 damage.',
    description: 'Frostburn (fire + glacial). Spells deal +3 damage.',
  },
  {
    id: 'plaguefire',
    name: 'Plaguefire',
    parents: ['fire', 'venom'],
    primaryColor: '#84cc16',
    secondaryColor: '#f97316',
    glowColor: '#ecfccb',
    shortDesc: '+3% crit chance.',
    description: 'Plaguefire (fire + venom). +3% crit chance.',
  },
  {
    id: 'sanguine_flame',
    name: 'Sanguine Flame',
    parents: ['fire', 'blood'],
    primaryColor: '#ef4444',
    secondaryColor: '#be123c',
    glowColor: '#fee2e2',
    shortDesc: '+5% crit chance.',
    description: 'Sanguine Flame (fire + blood). +5% crit chance.',
  },
  {
    id: 'molten_steel',
    name: 'Molten Steel',
    parents: ['fire', 'metal'],
    primaryColor: '#f97316',
    secondaryColor: '#cbd5e1',
    glowColor: '#ffedd5',
    shortDesc: '+7% crit chance.',
    description: 'Molten Steel (fire + metal). +7% crit chance.',
  },
  {
    id: 'starfire',
    name: 'Starfire',
    parents: ['fire', 'arcane'],
    primaryColor: '#f472b6',
    secondaryColor: '#f97316',
    glowColor: '#fdf2f8',
    shortDesc: '+9% crit chance.',
    description: 'Starfire (fire + arcane). +9% crit chance.',
  },

  // AIR + ... (9)
  {
    id: 'sandstorm',
    name: 'Sandstorm',
    parents: ['air', 'earth'],
    primaryColor: '#fbbf24',
    secondaryColor: '#b45309',
    glowColor: '#fef3c7',
    shortDesc: '+4% move speed.',
    description: 'Sandstorm (air + earth). +4% move speed.',
  },
  {
    id: 'aether',
    name: 'Dawn Wind',
    parents: ['air', 'light'],
    primaryColor: '#e0f2fe',
    secondaryColor: '#fde047',
    glowColor: '#ffffff',
    shortDesc: '+6% move speed.',
    description: 'Dawn Wind (air + light). +6% move speed.',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    parents: ['air', 'shadow'],
    primaryColor: '#c084fc',
    secondaryColor: '#2dd4bf',
    glowColor: '#f3e8ff',
    shortDesc: '+8% move speed.',
    description: 'Phantom (air + shadow). +8% move speed.',
  },
  {
    id: 'tempest',
    name: 'Tempest',
    parents: ['air', 'storm'],
    primaryColor: '#38bdf8',
    secondaryColor: '#5eead4',
    glowColor: '#e0f2fe',
    shortDesc: '+10% move speed.',
    description: 'Tempest (air + storm). +10% move speed.',
  },
  {
    id: 'blizzard',
    name: 'Blizzard',
    parents: ['air', 'glacial'],
    primaryColor: '#93c5fd',
    secondaryColor: '#5eead4',
    glowColor: '#f0f9ff',
    shortDesc: '+12% move speed.',
    description: 'Blizzard (air + glacial). +12% move speed.',
  },
  {
    id: 'miasma',
    name: 'Miasma',
    parents: ['air', 'venom'],
    primaryColor: '#a3e635',
    secondaryColor: '#2dd4bf',
    glowColor: '#ecfccb',
    shortDesc: '+8% knockback.',
    description: 'Miasma (air + venom). +8% knockback.',
  },
  {
    id: 'crimson_gale',
    name: 'Crimson Gale',
    parents: ['air', 'blood'],
    primaryColor: '#fb7185',
    secondaryColor: '#2dd4bf',
    glowColor: '#ffe4e6',
    shortDesc: '+14% knockback.',
    description: 'Crimson Gale (air + blood). +14% knockback.',
  },
  {
    id: 'razorwind',
    name: 'Razorwind',
    parents: ['air', 'metal'],
    primaryColor: '#e2e8f0',
    secondaryColor: '#2dd4bf',
    glowColor: '#ffffff',
    shortDesc: '+20% knockback.',
    description: 'Razorwind (air + metal). +20% knockback.',
  },
  {
    id: 'zephyr_rune',
    name: 'Star Gust',
    parents: ['air', 'arcane'],
    primaryColor: '#d8b4fe',
    secondaryColor: '#2dd4bf',
    glowColor: '#faf5ff',
    shortDesc: '+26% knockback.',
    description: 'Star Gust (air + arcane). +26% knockback.',
  },

  // EARTH + ... (8)
  {
    id: 'crystal',
    name: 'Crystal',
    parents: ['earth', 'light'],
    primaryColor: '#f0abfc',
    secondaryColor: '#fcd34d',
    glowColor: '#fae8ff',
    shortDesc: '+1 armor at the start of each room.',
    description: 'Crystal (earth + light). +1 armor at the start of each room.',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    parents: ['earth', 'shadow'],
    primaryColor: '#7c3aed',
    secondaryColor: '#475569',
    glowColor: '#ddd6fe',
    shortDesc: '+2 armor at the start of each room.',
    description: 'Obsidian (earth + shadow). +2 armor at the start of each room.',
  },
  {
    id: 'thunderquake',
    name: 'Thunderquake',
    parents: ['earth', 'storm'],
    primaryColor: '#f59e0b',
    secondaryColor: '#60a5fa',
    glowColor: '#fef3c7',
    shortDesc: '+3 armor at the start of each room.',
    description: 'Thunderquake (earth + storm). +3 armor at the start of each room.',
  },
  {
    id: 'tundra',
    name: 'Tundra',
    parents: ['earth', 'glacial'],
    primaryColor: '#7dd3fc',
    secondaryColor: '#b45309',
    glowColor: '#e0f2fe',
    shortDesc: '+1 max HP when you fuse.',
    description: 'Tundra (earth + glacial). +1 max HP when you fuse.',
  },
  {
    id: 'rotstone',
    name: 'Rotstone',
    parents: ['earth', 'venom'],
    primaryColor: '#84cc16',
    secondaryColor: '#a16207',
    glowColor: '#ecfccb',
    shortDesc: '+2 max HP when you fuse.',
    description: 'Rotstone (earth + venom). +2 max HP when you fuse.',
  },
  {
    id: 'crimson_titan',
    name: 'Crimson Titan',
    parents: ['earth', 'blood'],
    primaryColor: '#e11d48',
    secondaryColor: '#b45309',
    glowColor: '#fecdd3',
    shortDesc: '+3 max HP when you fuse.',
    description: 'Crimson Titan (earth + blood). +3 max HP when you fuse.',
  },
  {
    id: 'adamant',
    name: 'Adamant',
    parents: ['earth', 'metal'],
    primaryColor: '#cbd5e1',
    secondaryColor: '#d97706',
    glowColor: '#ffffff',
    shortDesc: 'Weapon skill [3] deals +1 damage.',
    description: 'Adamant (earth + metal). Weapon skill [3] deals +1 damage.',
  },
  {
    id: 'runestone',
    name: 'Runestone',
    parents: ['earth', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#d97706',
    glowColor: '#f3e8ff',
    shortDesc: 'Weapon skill [3] deals +2 damage.',
    description: 'Runestone (earth + arcane). Weapon skill [3] deals +2 damage.',
  },

  // LIGHT + ... (7)
  {
    id: 'eclipse',
    name: 'Eclipse',
    parents: ['light', 'shadow'],
    primaryColor: '#fbbf24',
    secondaryColor: '#9333ea',
    glowColor: '#fef08a',
    shortDesc: '+6% damage against bosses.',
    description: 'Eclipse (light + shadow). +6% damage against bosses.',
  },
  {
    id: 'radiant_bolt',
    name: 'Dawn Arc',
    parents: ['light', 'storm'],
    primaryColor: '#fde047',
    secondaryColor: '#60a5fa',
    glowColor: '#fef9c3',
    shortDesc: '+10% damage against bosses.',
    description: 'Dawn Arc (light + storm). +10% damage against bosses.',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    parents: ['light', 'glacial'],
    primaryColor: '#fde047',
    secondaryColor: '#7dd3fc',
    glowColor: '#fef9c3',
    shortDesc: '+14% damage against bosses.',
    description: 'Aurora (light + glacial). +14% damage against bosses.',
  },
  {
    id: 'purifying_bane',
    name: 'Radiant Blight',
    parents: ['light', 'venom'],
    primaryColor: '#bef264',
    secondaryColor: '#fde047',
    glowColor: '#f7fee7',
    shortDesc: '+18% damage against bosses.',
    description: 'Radiant Blight (light + venom). +18% damage against bosses.',
  },
  {
    id: 'seraph_blood',
    name: 'Seraphic Blood',
    parents: ['light', 'blood'],
    primaryColor: '#fb7185',
    secondaryColor: '#fde047',
    glowColor: '#fff1f2',
    shortDesc: '+11% crit chance.',
    description: 'Seraphic Blood (light + blood). +11% crit chance.',
  },
  {
    id: 'gilded_aegis',
    name: 'Gilded Aegis',
    parents: ['light', 'metal'],
    primaryColor: '#fde047',
    secondaryColor: '#cbd5e1',
    glowColor: '#fefce8',
    shortDesc: 'Blind lasts 1s longer.',
    description: 'Gilded Aegis (light + metal). Blind lasts 1s longer.',
  },
  {
    id: 'celestial',
    name: 'Chapel Light',
    parents: ['light', 'arcane'],
    primaryColor: '#fef08a',
    secondaryColor: '#e879f9',
    glowColor: '#ffffff',
    shortDesc: 'Blind lasts 2s longer.',
    description: 'Chapel Light (light + arcane). Blind lasts 2s longer.',
  },

  // SHADOW + ... (6)
  {
    id: 'void_thunder',
    name: 'Grave Spark',
    parents: ['shadow', 'storm'],
    primaryColor: '#a855f7',
    secondaryColor: '#60a5fa',
    glowColor: '#e9d5ff',
    shortDesc: 'Blind lasts 3s longer.',
    description: 'Grave Spark (shadow + storm). Blind lasts 3s longer.',
  },
  {
    id: 'black_ice',
    name: 'Black Ice',
    parents: ['shadow', 'glacial'],
    primaryColor: '#818cf8',
    secondaryColor: '#7dd3fc',
    glowColor: '#e0e7ff',
    shortDesc: 'Every 3th kill restores 1 HP.',
    description: 'Black Ice (shadow + glacial). Every 3th kill restores 1 HP.',
  },
  {
    id: 'nightshade',
    name: 'Nightshade',
    parents: ['shadow', 'venom'],
    primaryColor: '#a3e635',
    secondaryColor: '#9333ea',
    glowColor: '#ecfccb',
    shortDesc: 'Every 4th kill restores 1 HP.',
    description: 'Nightshade (shadow + venom). Every 4th kill restores 1 HP.',
  },
  {
    id: 'bloodmoon',
    name: 'Bloodmoon',
    parents: ['shadow', 'blood'],
    primaryColor: '#e11d48',
    secondaryColor: '#7e22ce',
    glowColor: '#fda4af',
    shortDesc: 'Every 5th kill restores 1 HP.',
    description: 'Bloodmoon (shadow + blood). Every 5th kill restores 1 HP.',
  },
  {
    id: 'dusksteel',
    name: 'Dusksteel',
    parents: ['shadow', 'metal'],
    primaryColor: '#94a3b8',
    secondaryColor: '#7c3aed',
    glowColor: '#e2e8f0',
    shortDesc: 'Every 6th kill restores 1 HP.',
    description: 'Dusksteel (shadow + metal). Every 6th kill restores 1 HP.',
  },
  {
    id: 'void_star',
    name: 'Void Star',
    parents: ['shadow', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#4f46e5',
    glowColor: '#f3e8ff',
    shortDesc: 'Every 7th kill restores 1 HP.',
    description: 'Void Star (shadow + arcane). Every 7th kill restores 1 HP.',
  },

  // STORM + ... (5)
  {
    id: 'hailstorm',
    name: 'Sleet Volley',
    parents: ['storm', 'glacial'],
    primaryColor: '#60a5fa',
    secondaryColor: '#bae6fd',
    glowColor: '#f0f9ff',
    shortDesc: 'Stuns last 0.1s longer.',
    description: 'Sleet Volley (storm + glacial). Stuns last 0.1s longer.',
  },
  {
    id: 'acid_storm',
    name: 'Vitriol Rain',
    parents: ['storm', 'venom'],
    primaryColor: '#84cc16',
    secondaryColor: '#60a5fa',
    glowColor: '#ecfccb',
    shortDesc: 'Stuns last 0.2s longer.',
    description: 'Vitriol Rain (storm + venom). Stuns last 0.2s longer.',
  },
  {
    id: 'crimson_storm',
    name: 'Scarlet Squall',
    parents: ['storm', 'blood'],
    primaryColor: '#f43f5e',
    secondaryColor: '#facc15',
    glowColor: '#ffe4e6',
    shortDesc: 'Stuns last 0.3s longer.',
    description: 'Scarlet Squall (storm + blood). Stuns last 0.3s longer.',
  },
  {
    id: 'magnet_arc',
    name: 'Magnet Arc',
    parents: ['storm', 'metal'],
    primaryColor: '#93c5fd',
    secondaryColor: '#cbd5e1',
    glowColor: '#eff6ff',
    shortDesc: 'Skill and spell cooldowns recover 3% faster.',
    description: 'Magnet Arc (storm + metal). Skill and spell cooldowns recover 3% faster.',
  },
  {
    id: 'astral_storm',
    name: 'Rune Circuit',
    parents: ['storm', 'arcane'],
    primaryColor: '#818cf8',
    secondaryColor: '#facc15',
    glowColor: '#eef2ff',
    shortDesc: 'Skill and spell cooldowns recover 5% faster.',
    description: 'Rune Circuit (storm + arcane). Skill and spell cooldowns recover 5% faster.',
  },

  // GLACIAL + ... (4)
  {
    id: 'rimeblight',
    name: 'Rimeblight',
    parents: ['glacial', 'venom'],
    primaryColor: '#4ade80',
    secondaryColor: '#7dd3fc',
    glowColor: '#dcfce7',
    shortDesc: 'The first poison hit adds 1 extra stack.',
    description: 'Rimeblight (glacial + venom). The first poison hit adds 1 extra stack.',
  },
  {
    id: 'frost_vein',
    name: 'Frostvein',
    parents: ['glacial', 'blood'],
    primaryColor: '#f43f5e',
    secondaryColor: '#7dd3fc',
    glowColor: '#ffe4e6',
    shortDesc: 'Basic attacks deal +1 damage.',
    description: 'Frostvein (glacial + blood). Basic attacks deal +1 damage.',
  },
  {
    id: 'cryosteel',
    name: 'Cryosteel',
    parents: ['glacial', 'metal'],
    primaryColor: '#bae6fd',
    secondaryColor: '#64748b',
    glowColor: '#f8fafc',
    shortDesc: 'Weapon skill [3] deals +3 damage.',
    description: 'Cryosteel (glacial + metal). Weapon skill [3] deals +3 damage.',
  },
  {
    id: 'astral_rime',
    name: 'Moon Rime',
    parents: ['glacial', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#7dd3fc',
    glowColor: '#f5f3ff',
    shortDesc: '+4 max MP when you fuse.',
    description: 'Moon Rime (glacial + arcane). +4 max MP when you fuse.',
  },

  // VENOM + ... (3)
  {
    id: 'hematoxin',
    name: 'Hematoxin',
    parents: ['venom', 'blood'],
    primaryColor: '#84cc16',
    secondaryColor: '#e11d48',
    glowColor: '#f7fee7',
    shortDesc: 'The first poison hit adds 2 extra stacks.',
    description: 'Hematoxin (venom + blood). The first poison hit adds 2 extra stacks.',
  },
  {
    id: 'rustbane',
    name: 'Rustbane',
    parents: ['venom', 'metal'],
    primaryColor: '#a3e635',
    secondaryColor: '#94a3b8',
    glowColor: '#ecfccb',
    shortDesc: 'Potions heal +1.',
    description: 'Rustbane (venom + metal). Potions heal +1.',
  },
  {
    id: 'eldritch_rot',
    name: 'Eldritch Blight',
    parents: ['venom', 'arcane'],
    primaryColor: '#a3e635',
    secondaryColor: '#c084fc',
    glowColor: '#f7fee7',
    shortDesc: 'Potions heal +2.',
    description: 'Eldritch Blight (venom + arcane). Potions heal +2.',
  },

  // BLOOD + ... (2)
  {
    id: 'iron_siphon',
    name: 'Iron Siphon',
    parents: ['blood', 'metal'],
    primaryColor: '#e11d48',
    secondaryColor: '#cbd5e1',
    glowColor: '#ffe4e6',
    shortDesc: 'Skill and spell cooldowns recover 7% faster.',
    description: 'Iron Siphon (blood + metal). Skill and spell cooldowns recover 7% faster.',
  },
  {
    id: 'hemomancy',
    name: 'Hemomancy',
    parents: ['blood', 'arcane'],
    primaryColor: '#f43f5e',
    secondaryColor: '#c084fc',
    glowColor: '#fce7f3',
    shortDesc: 'Skill and spell cooldowns recover 9% faster.',
    description: 'Hemomancy (blood + arcane). Skill and spell cooldowns recover 9% faster.',
  },

  // METAL + ARCANE (1)
  {
    id: 'chrono_forge',
    name: 'Chrono-Forge',
    parents: ['metal', 'arcane'],
    primaryColor: '#e2e8f0',
    secondaryColor: '#e879f9',
    glowColor: '#ffffff',
    shortDesc: 'Skill and spell cooldowns recover 11% faster.',
    description: 'Chrono-Forge (metal + arcane). Skill and spell cooldowns recover 11% faster.',
  },
];

export const COMBINED_ELEMENTS: Record<CombinedElementId, ElementDef> = {} as Record<
  CombinedElementId,
  ElementDef
>;

const COMBINED_PAIR_LOOKUP: Record<string, CombinedElementId> = {};

for (const spec of FUSION_SPECS) {
  const [a, b] = spec.parents;
  COMBINED_ELEMENTS[spec.id] = {
    id: spec.id,
    name: spec.name,
    title: `${BASE_ELEMENTS[a].name} + ${BASE_ELEMENTS[b].name}`,
    playstyleTag: `${BASE_ELEMENTS[a].name.toUpperCase()} × ${BASE_ELEMENTS[b].name.toUpperCase()}`,
    shortDesc: spec.shortDesc,
    description: spec.description,
    primaryColor: spec.primaryColor,
    secondaryColor: spec.secondaryColor,
    glowColor: spec.glowColor,
    isCombined: true,
    parents: [a, b],
  };
  const key = a < b ? `${a}+${b}` : `${b}+${a}`;
  COMBINED_PAIR_LOOKUP[key] = spec.id;
}

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

// ============================================================================
// SPECIAL UNIQUE CURSED ROOM RELICS (Exclusive to Shattered Mirror Cathedral!)
// ============================================================================
export const CURSED_RELIC_ORDER: CursedRelicId[] = [
  'mirror_prism_crown',
  'shattered_hourglass',
  'bloodglass_chalice',
  'phantom_veil_cloak',
  'void_mirror_edge',
  'cathedral_aegis_shard',
];

export const CURSED_RELICS: Record<CursedRelicId, CursedRelicDef> = {
  mirror_prism_crown: {
    id: 'mirror_prism_crown',
    name: 'Mirror Prism Crown',
    tagline: 'Cursed Unique Relic · Echo Strikes',
    description:
      'Every 3rd basic strike refracts a phantom crystal slash that deals +60% bonus echo damage and bursts prism shards.',
    accent: '#67e8f9',
  },
  shattered_hourglass: {
    id: 'shattered_hourglass',
    name: 'Shattered Hourglass',
    tagline: 'Cursed Unique Relic · Time Rift',
    description:
      'All [3] Weapon Power & Spell cooldowns recharge 30% faster, and every enemy kill shaves 0.5s off active cooldowns.',
    accent: '#c084fc',
  },
  bloodglass_chalice: {
    id: 'bloodglass_chalice',
    name: 'Bloodglass Chalice',
    tagline: 'Cursed Unique Relic · Alchemical Mirror',
    description:
      'Drinking any Potion also grants +1 Prismatic Armor Shield and unleashes a shattering crystal shockwave around you.',
    accent: '#f472b6',
  },
  phantom_veil_cloak: {
    id: 'phantom_veil_cloak',
    name: 'Phantom Veil Cloak',
    tagline: 'Cursed Unique Relic · Mirror Decoy',
    description:
      'Assassinations and [3] Skills erupt a blinding mirror flash that stuns nearby foes and grants +25% Crit Chance for 4s.',
    accent: '#a855f7',
  },
  void_mirror_edge: {
    id: 'void_mirror_edge',
    name: 'Void Mirror Edge',
    tagline: 'Cursed Unique Relic · Prism Siphon',
    description:
      '+25% Critical Hit Damage, and landing a Critical Hit shatters crystal energy that restores +1 MP (2s cooldown).',
    accent: '#38bdf8',
  },
  cathedral_aegis_shard: {
    id: 'cathedral_aegis_shard',
    name: 'Cathedral Aegis Shard',
    tagline: 'Cursed Unique Relic · Reflective Bulwark',
    description:
      'Start every chamber with +2 Prismatic Armor Shields; whenever a shield blocks a hit, reflect 3 prism damage back to nearby foes.',
    accent: '#fde047',
  },
};

// ============================================================================
// 12-ELEMENT RESISTANCE, WEAKNESS & STATUS EFFECT MATRIX
// ============================================================================
export interface ElementMatchupDef {
  weakTo: BaseElementId[];
  resists: BaseElementId[];
  status: ElementalStatusId;
  statusName: string;
  statusColor: string;
}

export const ELEMENT_MATCHUPS: Record<BaseElementId, ElementMatchupDef> = {
  fire: {
    weakTo: ['water', 'glacial', 'earth'],
    resists: ['fire', 'venom', 'metal'],
    status: 'burn',
    statusName: 'BURN',
    statusColor: '#fb923c',
  },
  water: {
    weakTo: ['storm', 'glacial', 'venom'],
    resists: ['water', 'fire', 'earth'],
    status: 'freeze',
    statusName: 'CHILL',
    statusColor: '#38bdf8',
  },
  air: {
    weakTo: ['glacial', 'storm', 'metal'],
    resists: ['air', 'earth', 'venom'],
    status: 'stun',
    statusName: 'GALE STUN',
    statusColor: '#2dd4bf',
  },
  earth: {
    weakTo: ['water', 'air', 'venom'],
    resists: ['earth', 'storm', 'fire'],
    status: 'stun',
    statusName: 'QUAKE STUN',
    statusColor: '#d97706',
  },
  light: {
    weakTo: ['shadow', 'blood', 'arcane'],
    resists: ['light', 'venom', 'glacial'],
    status: 'blind',
    statusName: 'BLINDED',
    statusColor: '#fde047',
  },
  shadow: {
    weakTo: ['light', 'fire', 'arcane'],
    resists: ['shadow', 'blood', 'air'],
    status: 'blind',
    statusName: 'UMBRAL BLIND',
    statusColor: '#a855f7',
  },
  storm: {
    weakTo: ['earth', 'air', 'arcane'],
    resists: ['storm', 'water', 'metal'],
    status: 'stun',
    statusName: 'SHOCK STUN',
    statusColor: '#60a5fa',
  },
  glacial: {
    weakTo: ['fire', 'metal', 'earth'],
    resists: ['glacial', 'water', 'air'],
    status: 'freeze',
    statusName: 'FROZEN',
    statusColor: '#7dd3fc',
  },
  venom: {
    weakTo: ['fire', 'light', 'air'],
    resists: ['venom', 'water', 'earth'],
    status: 'poison',
    statusName: 'POISON',
    statusColor: '#84cc16',
  },
  blood: {
    weakTo: ['light', 'glacial', 'metal'],
    resists: ['blood', 'shadow', 'venom'],
    status: 'poison',
    statusName: 'BLEED',
    statusColor: '#f43f5e',
  },
  metal: {
    weakTo: ['fire', 'storm', 'water'],
    resists: ['metal', 'glacial', 'air'],
    status: 'stun',
    statusName: 'STAGGER',
    statusColor: '#cbd5e1',
  },
  arcane: {
    weakTo: ['shadow', 'metal', 'blood'],
    resists: ['arcane', 'light', 'storm'],
    status: 'blind',
    statusName: 'HEX',
    statusColor: '#e879f9',
  },
};

export interface ElementDamageEval {
  mult: number;
  relation: 'weak' | 'resist' | 'neutral';
  triggerEl?: BaseElementId;
}

/**
 * Evaluates attacking element(s) against a defender's BaseElementId.
 * Weakness wins over Resistance if a dual-affinity attacker hits a weak point!
 */
export function evaluateElementalMatchup(
  attackElements: BaseElementId[],
  defenderElement?: BaseElementId
): ElementDamageEval {
  if (!defenderElement || attackElements.length === 0) {
    return { mult: 1, relation: 'neutral' };
  }
  const matchup = ELEMENT_MATCHUPS[defenderElement];
  if (!matchup) return { mult: 1, relation: 'neutral' };

  for (const el of attackElements) {
    if (matchup.weakTo.includes(el)) {
      return { mult: 1.5, relation: 'weak', triggerEl: el };
    }
  }
  let allResisted = true;
  let resistedEl: BaseElementId | undefined;
  for (const el of attackElements) {
    if (matchup.resists.includes(el)) {
      resistedEl = el;
    } else {
      allResisted = false;
    }
  }
  if (allResisted && resistedEl) {
    return { mult: 0.65, relation: 'resist', triggerEl: resistedEl };
  }
  return { mult: 1, relation: 'neutral', triggerEl: attackElements[0] };
}

/**
 * How a defender with one or more elements takes a single incoming element.
 * Any weakness wins. Otherwise any resistance reduces the hit.
 */
export function defenseAgainst(
  defenderElements: BaseElementId[],
  attackElement: BaseElementId
): ElementDamageEval {
  let best: ElementDamageEval = { mult: 1, relation: 'neutral' };
  for (const defender of defenderElements) {
    const ev = evaluateElementalMatchup([attackElement], defender);
    if (ev.relation === 'weak') return ev;
    if (ev.relation === 'resist') best = ev;
  }
  return best;
}

/** Natural element of an enemy based on its archetype and active raid theme. */
export function getEnemyElement(
  enemyType: string,
  raidId?: string
): BaseElementId {
  // Type-specific iconic overrides first
  switch (enemyType) {
    case 'ember_imp':
    case 'boss_cinder_warden':
    case 'boss_pyre_matriarch':
    case 'boss_forge_lord':
      return 'fire';
    case 'obsidian_guard':
    case 'boss_slag_titan':
    case 'boss_infernal_knight':
    case 'runed_golem':
    case 'boss_dwarf_king':
    case 'boss_colossus':
      return 'earth';
    case 'dwarf_miner':
    case 'dwarf_sapper':
    case 'knight':
    case 'mech_turret':
    case 'boss_executioner':
    case 'boss_goblin_warlord':
      return 'metal';
    case 'spore_hopper':
    case 'mycelium_spitter':
    case 'cap_brute':
    case 'boss_mushroom_sovereign':
    case 'goblin_shaman':
    case 'boss_goblin_shaman':
      return 'venom';
    case 'plasma_drone':
    case 'boss_alien_archon':
    case 'acolyte':
    case 'boss_necromancer':
    case 'boss_malakor':
    case 'boss_eclipse_overlord':
      return 'arcane';
    case 'sun_acolyte':
    case 'boss_sand_pharaoh':
      return 'light';
    case 'wraith':
    case 'void_stalker':
    case 'boss_banshee':
    case 'bat':
    case 'boss_gravedigger':
      return 'shadow';
    case 'boss_vampire_duelist':
    case 'boss_valerius':
    case 'ghoul':
    case 'grave_hound':
    case 'boss_bone_reaver':
      return 'blood';
    case 'cloud_wyrmling':
    case 'crane_disciple':
    case 'boss_dragon_crane':
    case 'gargoyle':
    case 'boss_gargoyle_king':
      return 'air';
    case 'jade_sentinel':
      return 'storm';
    default:
      break;
  }

  // Raid theme fallback so every raid has cohesive elemental flavor!
  switch (raidId) {
    case 'brimstone_sanctum':
      return 'fire';
    case 'underwater_city':
    case 'pirate_armada':
      return 'water';
    case 'frost_wardens':
      return 'glacial';
    case 'cyberpunk_city':
      return 'storm';
    case 'mushroom_kingdom':
    case 'goblin_camp':
      return 'venom';
    case 'dwarven_mines':
      return 'earth';
    case 'barbaric_nation':
      return 'metal';
    case 'nocturne_castle':
    case 'noble_mansion':
      return 'blood';
    case 'weeping_necropolis':
    case 'ghost_paradox':
      return 'shadow';
    case 'sand_fortress':
      return 'light';
    case 'dragon_crane':
      return 'air';
    case 'alien_ship':
    case 'eclipse_gauntlet':
      return 'arcane';
    default:
      return 'shadow';
  }
}

/** Intrinsic element of each Spell (combines with player's affinity!). */
export function getSpellIntrinsicElement(abilityId: string): BaseElementId | null {
  switch (abilityId) {
    case 'fireball':
    case 'fire_weapon':
    case 'cinder_palm':
    case 'meteor_call':
      return 'fire';
    case 'frost_nova':
      return 'glacial';
    case 'chain_storm':
      return 'storm';
    case 'gas_bomb':
    case 'venom_needles':
      return 'venom';
    case 'solar_bloom':
      return 'light';
    case 'prism_beam':
      return 'arcane';
    case 'blood_siphon':
      return 'blood';
    case 'phantom_blades':
    case 'dash_attack':
      return 'shadow';
    case 'aegis_slam':
      return 'earth';
    case 'grapple':
    case 'ricochet_snare':
      return 'metal';
    default:
      return null;
  }
}


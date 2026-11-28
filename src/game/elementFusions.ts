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
    shortDesc: '+1 Max HP, +1 Armor Shield per room (scales per Lv) & Stone Spikes.',
    description:
      'Become an unbreakable fortress: grants +1 Max HP, free Armor Shields every chamber (more each Lv), heavy knockback, and erupting stone spikes.',
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
    shortDesc: 'Scalding vapor blasts chill, burn & rapidly restore MP.',
    description: 'Fuses Water + Fire into pressurized Steam: scalding rings chill, burn, and replenish +1 MP every 3 hits.',
  },
  {
    id: 'mist',
    name: 'Mist',
    parents: ['water', 'air'],
    primaryColor: '#67e8f9',
    secondaryColor: '#5eead4',
    glowColor: '#ecfeff',
    shortDesc: '+16% Speed, chilling hydro-gales & smooth MP flow.',
    description: 'Fuses Water + Air into Phantom Mist: swift hydro-wind waves chill crowds while feeding MP and evasion.',
  },
  {
    id: 'nature',
    name: 'Nature',
    parents: ['water', 'earth'],
    primaryColor: '#4ade80',
    secondaryColor: '#0ea5e9',
    glowColor: '#dcfce7',
    shortDesc: '+1 Max HP, +1 Armor/room, Briar Spikes & HP/MP heal on kills.',
    description: 'Fuses Water + Earth into Living Nature: grants tanky shields & HP while erupting briar spikes that restore HP & MP every 5 kills.',
  },
  {
    id: 'prism',
    name: 'Prism',
    parents: ['water', 'light'],
    primaryColor: '#f472b6',
    secondaryColor: '#38bdf8',
    glowColor: '#fef08a',
    shortDesc: 'Splitting rainbow beams chill, +25% Boss DMG & rapid MP flow.',
    description: 'Fuses Water + Light into Radiant Prism: refracts sky beams across multiple foes with chills, boss damage & MP recovery.',
  },
  {
    id: 'abyss',
    name: 'Abyss',
    parents: ['water', 'shadow'],
    primaryColor: '#6366f1',
    secondaryColor: '#0284c7',
    glowColor: '#c7d2fe',
    shortDesc: 'Stealthy deep-tide vortices pull foes, chill & siphon MP on crits.',
    description: 'Fuses Water + Shadow into Crushing Abyss: stealth veil + dark tidal vortices that chill, pull foes, and grant MP on crits.',
  },
  {
    id: 'maelstrom',
    name: 'Maelstrom',
    parents: ['water', 'storm'],
    primaryColor: '#38bdf8',
    secondaryColor: '#facc15',
    glowColor: '#e0f2fe',
    shortDesc: 'Electrified tidal chains shock, chill & refund MP on combos.',
    description: 'Fuses Water + Storm into Raging Maelstrom: conducts chain lightning through chilled enemies while accelerating MP & cooldowns.',
  },
  {
    id: 'permafrost',
    name: 'Permafrost',
    parents: ['water', 'glacial'],
    primaryColor: '#60a5fa',
    secondaryColor: '#e0f2fe',
    glowColor: '#ffffff',
    shortDesc: 'Absolute-zero freeze, heavy shatter bursts & +1 MP every 3 hits.',
    description: 'Fuses Water + Glacial into Eternal Permafrost: locks foes in deep frost, shatters chilled targets, and rapidly restores MP.',
  },
  {
    id: 'mire',
    name: 'Mire',
    parents: ['water', 'venom'],
    primaryColor: '#22c55e',
    secondaryColor: '#0ea5e9',
    glowColor: '#bbf7d0',
    shortDesc: 'Venomous bog-tides slow, poison & sustain MP effortlessly.',
    description: 'Fuses Water + Venom into Toxic Mire: drowns enemies in chilling acidic sludge that ticks poison while flowing MP.',
  },
  {
    id: 'ichor',
    name: 'Ichor',
    parents: ['water', 'blood'],
    primaryColor: '#f43f5e',
    secondaryColor: '#38bdf8',
    glowColor: '#ffe4e6',
    shortDesc: 'Crimson tides chill foes, boost strike DMG & drain HP + MP.',
    description: 'Fuses Water + Blood into Living Ichor: empowering strikes that chill foes while sustaining both HP and MP.',
  },
  {
    id: 'quicksilver',
    name: 'Quicksilver',
    parents: ['water', 'metal'],
    primaryColor: '#94a3b8',
    secondaryColor: '#38bdf8',
    glowColor: '#f1f5f9',
    shortDesc: 'Liquid-steel shields (+1/room), fluid chills & flowing MP.',
    description: 'Fuses Water + Metal into Quicksilver: grants sleek armor shields each room while splashing liquid metal waves that restore MP.',
  },
  {
    id: 'aether_tide',
    name: 'Aether Tide',
    parents: ['water', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#38bdf8',
    glowColor: '#f3e8ff',
    shortDesc: '+2 Max MP, homing tidal stars, chills & endless mana sustain.',
    description: 'Fuses Water + Arcane into Aether Tide: expands Max MP, hastens spells, and launches chilling homing star-waves.',
  },

  // FIRE + ... (10)
  {
    id: 'wildfire',
    name: 'Wildfire',
    parents: ['fire', 'air'],
    primaryColor: '#fb923c',
    secondaryColor: '#2dd4bf',
    glowColor: '#ffedd5',
    shortDesc: '+16% Speed, roaring fire-gales & sweeping burning crescents.',
    description: 'Fuses Fire + Air into Roaring Wildfire: high-speed wind-fed flames that cleave rooms in blazing crescents.',
  },
  {
    id: 'magma',
    name: 'Magma',
    parents: ['fire', 'earth'],
    primaryColor: '#ef4444',
    secondaryColor: '#d97706',
    glowColor: '#fecaca',
    shortDesc: '+1 Max HP, +1 Armor/room & volcanic lava pillar eruptions!',
    description: 'Fuses Fire + Earth into Molten Magma: tanky stone shields paired with heavy volcanic spikes that scorch everything around you.',
  },
  {
    id: 'solar',
    name: 'Solar',
    parents: ['fire', 'light'],
    primaryColor: '#facc15',
    secondaryColor: '#f97316',
    glowColor: '#fef9c3',
    shortDesc: 'Blinding solar sky-flares deal +30% Boss DMG & intense Burn!',
    description: 'Fuses Fire + Light into Solar Radiance: scorching heaven-beams incinerate bosses and detonate radiant fire bursts.',
  },
  {
    id: 'hellfire',
    name: 'Hellfire',
    parents: ['fire', 'shadow'],
    primaryColor: '#e11d48',
    secondaryColor: '#9333ea',
    glowColor: '#fbcfe8',
    shortDesc: 'Stealthy black-violet flames, +20% Crit & explosive backstabs!',
    description: 'Fuses Fire + Shadow into Abyssal Hellfire: stealth veil + brutal critical burns and detonating assassination flames.',
  },
  {
    id: 'plasma',
    name: 'Plasma',
    parents: ['fire', 'storm'],
    primaryColor: '#f97316',
    secondaryColor: '#60a5fa',
    glowColor: '#fde68a',
    shortDesc: 'Superheated chain arcs burn, shock & speed up cooldowns!',
    description: 'Fuses Fire + Storm into Solar Plasma: searing chain lightning arcs that ignite and stagger every enemy they jump through.',
  },
  {
    id: 'frostburn',
    name: 'Frostburn',
    parents: ['fire', 'glacial'],
    primaryColor: '#fb7185',
    secondaryColor: '#7dd3fc',
    glowColor: '#f0f9ff',
    shortDesc: 'Thermal-shock hits both Freeze & Burn for shattering crits!',
    description: 'Fuses Fire + Glacial into Thermal Frostburn: simultaneously deep-chills and ignites targets for devastating thermal shatters.',
  },
  {
    id: 'plaguefire',
    name: 'Plaguefire',
    parents: ['fire', 'venom'],
    primaryColor: '#84cc16',
    secondaryColor: '#f97316',
    glowColor: '#ecfccb',
    shortDesc: 'Volatile toxic wildfire stacks Burn + Poison & blasts on kill.',
    description: 'Fuses Fire + Venom into Volatile Plaguefire: coats foes in combustible poison that detonates into emerald-orange blasts.',
  },
  {
    id: 'sanguine_flame',
    name: 'Sanguine Flame',
    parents: ['fire', 'blood'],
    primaryColor: '#ef4444',
    secondaryColor: '#be123c',
    glowColor: '#fee2e2',
    shortDesc: 'Boiling crimson flames boost strike DMG, Burn & lifesteal!',
    description: 'Fuses Fire + Blood into Sanguine Flame: ignites enemies in arterial fire while empowering strikes and siphoning HP.',
  },
  {
    id: 'molten_steel',
    name: 'Molten Steel',
    parents: ['fire', 'metal'],
    primaryColor: '#f97316',
    secondaryColor: '#cbd5e1',
    glowColor: '#ffedd5',
    shortDesc: '+1 Armor/room, white-hot forged shields & searing shrapnel!',
    description: 'Fuses Fire + Metal into Molten Steel: forge-heated armor guards each room and blasts glowing slag shrapnel on hit.',
  },
  {
    id: 'starfire',
    name: 'Starfire',
    parents: ['fire', 'arcane'],
    primaryColor: '#f472b6',
    secondaryColor: '#f97316',
    glowColor: '#fdf2f8',
    shortDesc: '+2 Max MP, faster spells & blazing homing star-embers!',
    description: 'Fuses Fire + Arcane into Astral Starfire: expands mana pool and launches homing burning star-bolts with every combo.',
  },

  // AIR + ... (9)
  {
    id: 'sandstorm',
    name: 'Sandstorm',
    parents: ['air', 'earth'],
    primaryColor: '#fbbf24',
    secondaryColor: '#b45309',
    glowColor: '#fef3c7',
    shortDesc: '+14% Speed, +1 Max HP, +1 Armor/room & scything dust gales.',
    description: 'Fuses Air + Earth into Raging Sandstorm: blends swift gale mobility with stone shields and wide abrasive shockwaves.',
  },
  {
    id: 'aether',
    name: 'Aether',
    parents: ['air', 'light'],
    primaryColor: '#e0f2fe',
    secondaryColor: '#fde047',
    glowColor: '#ffffff',
    shortDesc: '+20% Speed, celestial sky beams & +25% Boss DMG!',
    description: 'Fuses Air + Light into Pure Aether: blazing speed, luminous heaven-beams, and radiant wind strikes.',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    parents: ['air', 'shadow'],
    primaryColor: '#c084fc',
    secondaryColor: '#2dd4bf',
    glowColor: '#f3e8ff',
    shortDesc: '+18% Speed, stealth veil, +22% Crit & ghostly wind backstabs!',
    description: 'Fuses Air + Shadow into Phantom Wraith: silent sprint speed, tiny enemy vision cones, and echoing spectral blades.',
  },
  {
    id: 'tempest',
    name: 'Tempest',
    parents: ['air', 'storm'],
    primaryColor: '#38bdf8',
    secondaryColor: '#5eead4',
    glowColor: '#e0f2fe',
    shortDesc: '+20% Speed, chain thunder arcs & rapid cooldown haste!',
    description: 'Fuses Air + Storm into Howling Tempest: ferocious agility paired with leaping storm lightning and faster skills.',
  },
  {
    id: 'blizzard',
    name: 'Blizzard',
    parents: ['air', 'glacial'],
    primaryColor: '#93c5fd',
    secondaryColor: '#5eead4',
    glowColor: '#f0f9ff',
    shortDesc: '+16% Speed, deep-freeze gales & piercing ice wind blades!',
    description: 'Fuses Air + Glacial into Arctic Blizzard: swift frozen winds lock down rooms and shatter chilled enemies.',
  },
  {
    id: 'miasma',
    name: 'Miasma',
    parents: ['air', 'venom'],
    primaryColor: '#a3e635',
    secondaryColor: '#2dd4bf',
    glowColor: '#ecfccb',
    shortDesc: '+16% Speed & wide drifting toxic gale clouds!',
    description: 'Fuses Air + Venom into Virulent Miasma: swift wind blades carry corrosive venom across entire chambers.',
  },
  {
    id: 'crimson_gale',
    name: 'Crimson Gale',
    parents: ['air', 'blood'],
    primaryColor: '#fb7185',
    secondaryColor: '#2dd4bf',
    glowColor: '#ffe4e6',
    shortDesc: '+16% Speed, +16% Strike DMG & blood-reaping wind slashes!',
    description: 'Fuses Air + Blood into Crimson Gale: blistering attack speed and sanguine wind blades that siphon HP on streaks.',
  },
  {
    id: 'razorwind',
    name: 'Razorwind',
    parents: ['air', 'metal'],
    primaryColor: '#e2e8f0',
    secondaryColor: '#2dd4bf',
    glowColor: '#ffffff',
    shortDesc: '+15% Speed, +1 Armor/room & steel-edged slicing cyclonic arcs!',
    description: 'Fuses Air + Metal into Razorwind: agile steel armor shields paired with flying metallic wind blades.',
  },
  {
    id: 'zephyr_rune',
    name: 'Astral Gale',
    parents: ['air', 'arcane'],
    primaryColor: '#d8b4fe',
    secondaryColor: '#2dd4bf',
    glowColor: '#faf5ff',
    shortDesc: '+16% Speed, +2 Max MP, fast spells & homing wind-stars!',
    description: 'Fuses Air + Arcane into Astral Gale: weightless speed, expanded mana, and homing starlight crescents.',
  },

  // EARTH + ... (8)
  {
    id: 'crystal',
    name: 'Crystal',
    parents: ['earth', 'light'],
    primaryColor: '#f0abfc',
    secondaryColor: '#fcd34d',
    glowColor: '#fae8ff',
    shortDesc: '+1 Max HP, +2 Armor Shields/room & radiant crystal spires!',
    description: 'Fuses Earth + Light into Prismatic Crystal: supreme defensive shields paired with shattering radiant spires and boss damage.',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    parents: ['earth', 'shadow'],
    primaryColor: '#7c3aed',
    secondaryColor: '#475569',
    glowColor: '#ddd6fe',
    shortDesc: '+1 Max HP, +1 Armor/room, stealth veil & black-glass crit spikes!',
    description: 'Fuses Earth + Shadow into Volcanic Obsidian: armored shadow assassin — harder to spot, shielded, with lethal crit spikes.',
  },
  {
    id: 'thunderquake',
    name: 'Thunderquake',
    parents: ['earth', 'storm'],
    primaryColor: '#f59e0b',
    secondaryColor: '#60a5fa',
    glowColor: '#fef3c7',
    shortDesc: '+1 Max HP, +1 Armor/room & electrified seismic chain quakes!',
    description: 'Fuses Earth + Storm into Thunderquake: armored juggernaut strikes that erupt lightning-charged ground spikes.',
  },
  {
    id: 'tundra',
    name: 'Tundra',
    parents: ['earth', 'glacial'],
    primaryColor: '#7dd3fc',
    secondaryColor: '#b45309',
    glowColor: '#e0f2fe',
    shortDesc: '+1 Max HP, +1 Armor/room & glacial boulders that freeze & shatter!',
    description: 'Fuses Earth + Glacial into Frozen Tundra: stone-and-ice bulwark whose heavy spikes deep-freeze and shatter foes.',
  },
  {
    id: 'rotstone',
    name: 'Rotstone',
    parents: ['earth', 'venom'],
    primaryColor: '#84cc16',
    secondaryColor: '#a16207',
    glowColor: '#ecfccb',
    shortDesc: '+1 Max HP, +1 Armor/room & venomous stone eruptions!',
    description: 'Fuses Earth + Venom into Blighted Rotstone: unyielding armor paired with corrosive spikes that melt crowds.',
  },
  {
    id: 'crimson_titan',
    name: 'Crimson Titan',
    parents: ['earth', 'blood'],
    primaryColor: '#e11d48',
    secondaryColor: '#b45309',
    glowColor: '#fecdd3',
    shortDesc: '+1 Max HP, +1 Armor/room, +16% Strike DMG & HP drain!',
    description: 'Fuses Earth + Blood into Crimson Titan: the ultimate bruiser — bonus HP, armor shields, heavy strikes, and lifesteal.',
  },
  {
    id: 'adamant',
    name: 'Adamant',
    parents: ['earth', 'metal'],
    primaryColor: '#cbd5e1',
    secondaryColor: '#d97706',
    glowColor: '#ffffff',
    shortDesc: '+1 Max HP, +2 Armor Shields/room & colossal iron-quake slams!',
    description: 'Fuses Earth + Metal into Living Adamant: maximum fortress defense (+2 shields every room) and shattering seismic iron spikes.',
  },
  {
    id: 'runestone',
    name: 'Runestone',
    parents: ['earth', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#d97706',
    glowColor: '#f3e8ff',
    shortDesc: '+1 Max HP, +2 Max MP, +1 Armor/room & arcane monolith spikes!',
    description: 'Fuses Earth + Arcane into Ancient Runestone: battle-mage fortress with extra HP, MP, armor, and homing rune spikes.',
  },

  // LIGHT + ... (7)
  {
    id: 'eclipse',
    name: 'Eclipse',
    parents: ['light', 'shadow'],
    primaryColor: '#fbbf24',
    secondaryColor: '#9333ea',
    glowColor: '#fef08a',
    shortDesc: 'Stealth veil, +25% Crit, +30% Boss DMG & Sun-Moon Novas!',
    description: 'Fuses Light + Shadow into Forbidden Eclipse: golden-violet novas uniting shadow assassinations with radiant boss-slaying power.',
  },
  {
    id: 'radiant_bolt',
    name: "Heaven's Bolt",
    parents: ['light', 'storm'],
    primaryColor: '#fde047',
    secondaryColor: '#60a5fa',
    glowColor: '#fef9c3',
    shortDesc: 'Holy chain thunderbolts deal +25% Boss DMG & speed cooldowns!',
    description: "Fuses Light + Storm into Heaven's Bolt: sky-splitting golden lightning chains that annihilate bosses and crowds alike.",
  },
  {
    id: 'aurora',
    name: 'Aurora',
    parents: ['light', 'glacial'],
    primaryColor: '#fde047',
    secondaryColor: '#7dd3fc',
    glowColor: '#fef9c3',
    shortDesc: 'Prism frost sky-beams freeze foes & deal +30% Boss DMG!',
    description: 'Fuses Light + Glacial into Polar Aurora: radiant beams freeze enemies solid and shatter bosses in luminous bursts.',
  },
  {
    id: 'purifying_bane',
    name: 'Radiant Blight',
    parents: ['light', 'venom'],
    primaryColor: '#bef264',
    secondaryColor: '#fde047',
    glowColor: '#f7fee7',
    shortDesc: 'Searing holy venom corrodes bosses (+25% DMG) & heals on kill!',
    description: 'Fuses Light + Venom into Radiant Blight: purifying beams infect foes with luminous poison while healing you on kills.',
  },
  {
    id: 'seraph_blood',
    name: 'Seraphic Blood',
    parents: ['light', 'blood'],
    primaryColor: '#fb7185',
    secondaryColor: '#fde047',
    glowColor: '#fff1f2',
    shortDesc: 'Holy lifesteal, +16% Strike DMG & +25% Boss Smite beams!',
    description: 'Fuses Light + Blood into Seraphic Blood: radiant crimson smites with relentless damage and double HP sustain.',
  },
  {
    id: 'gilded_aegis',
    name: 'Gilded Aegis',
    parents: ['light', 'metal'],
    primaryColor: '#fde047',
    secondaryColor: '#cbd5e1',
    glowColor: '#fefce8',
    shortDesc: '+1 Armor/room, +25% Boss DMG & golden steel sky beams!',
    description: 'Fuses Light + Metal into Gilded Aegis: paladin-grade iron shields combined with boss-shredding radiant smites.',
  },
  {
    id: 'celestial',
    name: 'Celestial',
    parents: ['light', 'arcane'],
    primaryColor: '#fef08a',
    secondaryColor: '#e879f9',
    glowColor: '#ffffff',
    shortDesc: '+2 Max MP, fast spells, homing star beams & +30% Boss DMG!',
    description: 'Fuses Light + Arcane into Celestial Chorus: supreme astral spellcasting with golden homing stars and sky beams.',
  },

  // SHADOW + ... (6)
  {
    id: 'void_thunder',
    name: 'Void Thunder',
    parents: ['shadow', 'storm'],
    primaryColor: '#a855f7',
    secondaryColor: '#60a5fa',
    glowColor: '#e9d5ff',
    shortDesc: 'Stealth veil, +18% Crit & dark chain lightning ambushes!',
    description: 'Fuses Shadow + Storm into Void Thunder: silent stalking paired with violet chain bolts that stun entire rooms.',
  },
  {
    id: 'black_ice',
    name: 'Black Ice',
    parents: ['shadow', 'glacial'],
    primaryColor: '#818cf8',
    secondaryColor: '#7dd3fc',
    glowColor: '#e0e7ff',
    shortDesc: 'Stealth veil, deep-freeze chills & lethal shattering crits!',
    description: 'Fuses Shadow + Glacial into Black Ice: creeps unseen to freeze foes solid and shatter them with brutal crits.',
  },
  {
    id: 'nightshade',
    name: 'Nightshade',
    parents: ['shadow', 'venom'],
    primaryColor: '#a3e635',
    secondaryColor: '#9333ea',
    glowColor: '#ecfccb',
    shortDesc: 'Master Stealth, venomous assassinations & toxic shadow mist!',
    description: 'Fuses Shadow + Venom into Nightshade: shrunk enemy vision, lethal backstabs, and corrosive poison clouds.',
  },
  {
    id: 'bloodmoon',
    name: 'Bloodmoon',
    parents: ['shadow', 'blood'],
    primaryColor: '#e11d48',
    secondaryColor: '#7e22ce',
    glowColor: '#fda4af',
    shortDesc: 'Stealth veil, +24% Crit, brutal assassinations & HP siphon!',
    description: 'Fuses Shadow + Blood into Bloodmoon: apex nocturnal predator with massive crit damage, stealth, and lifesteal.',
  },
  {
    id: 'dusksteel',
    name: 'Dusksteel',
    parents: ['shadow', 'metal'],
    primaryColor: '#94a3b8',
    secondaryColor: '#7c3aed',
    glowColor: '#e2e8f0',
    shortDesc: '+1 Armor/room, stealth veil, +18% Crit & dark steel blades!',
    description: 'Fuses Shadow + Metal into Dusksteel: shadow-forged armor shields paired with razor-sharp ambush crits.',
  },
  {
    id: 'void_star',
    name: 'Void Star',
    parents: ['shadow', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#4f46e5',
    glowColor: '#f3e8ff',
    shortDesc: '+2 Max MP, stealth veil, fast spells & homing dark stars!',
    description: 'Fuses Shadow + Arcane into Void Star: shadow-mage mastery with reduced enemy vision, fast spells, and homing dark bolts.',
  },

  // STORM + ... (5)
  {
    id: 'hailstorm',
    name: 'Hailstorm',
    parents: ['storm', 'glacial'],
    primaryColor: '#60a5fa',
    secondaryColor: '#bae6fd',
    glowColor: '#f0f9ff',
    shortDesc: 'Freezing chain lightning locks down & shatters whole rooms!',
    description: 'Fuses Storm + Glacial into Violent Hailstorm: jumping electric ice arcs freeze, stun, and shatter crowds.',
  },
  {
    id: 'acid_storm',
    name: 'Acid Storm',
    parents: ['storm', 'venom'],
    primaryColor: '#84cc16',
    secondaryColor: '#60a5fa',
    glowColor: '#ecfccb',
    shortDesc: 'Corrosive chain arcs spread poison & shred armor across foes!',
    description: 'Fuses Storm + Venom into Acid Storm: lightning leaps between targets spreading virulent poison and stun.',
  },
  {
    id: 'crimson_storm',
    name: 'Crimson Storm',
    parents: ['storm', 'blood'],
    primaryColor: '#f43f5e',
    secondaryColor: '#facc15',
    glowColor: '#ffe4e6',
    shortDesc: 'Blood-red chain thunderbolts boost strike DMG & siphon HP!',
    description: 'Fuses Storm + Blood into Crimson Storm: arterial lightning jumps across enemies while draining life.',
  },
  {
    id: 'magnet_arc',
    name: 'Magnet Arc',
    parents: ['storm', 'metal'],
    primaryColor: '#93c5fd',
    secondaryColor: '#cbd5e1',
    glowColor: '#eff6ff',
    shortDesc: '+1 Armor/room, magnetic chain arcs & iron lightning bursts!',
    description: 'Fuses Storm + Metal into Magnet Arc: electrified iron armor shields and conductive lightning chains.',
  },
  {
    id: 'astral_storm',
    name: 'Astral Storm',
    parents: ['storm', 'arcane'],
    primaryColor: '#818cf8',
    secondaryColor: '#facc15',
    glowColor: '#eef2ff',
    shortDesc: '+2 Max MP, rapid cooldown haste & homing arcane lightning!',
    description: 'Fuses Storm + Arcane into Astral Storm: ultimate spell haste paired with chaining star-thunder.',
  },

  // GLACIAL + ... (4)
  {
    id: 'rimeblight',
    name: 'Rimeblight',
    parents: ['glacial', 'venom'],
    primaryColor: '#4ade80',
    secondaryColor: '#7dd3fc',
    glowColor: '#dcfce7',
    shortDesc: 'Freezing venom slows foes to a crawl while corroding them!',
    description: 'Fuses Glacial + Venom into Rimeblight: locks crowds in toxic frost that shatters and poisons over time.',
  },
  {
    id: 'frost_vein',
    name: 'Frostvein',
    parents: ['glacial', 'blood'],
    primaryColor: '#f43f5e',
    secondaryColor: '#7dd3fc',
    glowColor: '#ffe4e6',
    shortDesc: 'Frozen crimson strikes shatter chilled foes & drain HP!',
    description: 'Fuses Glacial + Blood into Frostvein: deep-freezes targets then shatters them with life-draining raw power.',
  },
  {
    id: 'cryosteel',
    name: 'Cryosteel',
    parents: ['glacial', 'metal'],
    primaryColor: '#bae6fd',
    secondaryColor: '#64748b',
    glowColor: '#f8fafc',
    shortDesc: '+1 Armor/room, frost-plated shields & shattering ice-steel!',
    description: 'Fuses Glacial + Metal into Cryosteel: permafrost-forged armor shields and brittle-shattering steel strikes.',
  },
  {
    id: 'astral_rime',
    name: 'Astral Rime',
    parents: ['glacial', 'arcane'],
    primaryColor: '#c084fc',
    secondaryColor: '#7dd3fc',
    glowColor: '#f5f3ff',
    shortDesc: '+2 Max MP, fast spells & homing freezing crystal stars!',
    description: 'Fuses Glacial + Arcane into Astral Rime: cosmic ice magic that freezes targets with homing starlight shards.',
  },

  // VENOM + ... (3)
  {
    id: 'hematoxin',
    name: 'Hematoxin',
    parents: ['venom', 'blood'],
    primaryColor: '#84cc16',
    secondaryColor: '#e11d48',
    glowColor: '#f7fee7',
    shortDesc: 'Vampiric venom boosts strike DMG, stacks poison & drains HP!',
    description: 'Fuses Venom + Blood into Hematoxin: toxic blood blades melt enemies and siphon vitality on kills.',
  },
  {
    id: 'rustbane',
    name: 'Rustbane',
    parents: ['venom', 'metal'],
    primaryColor: '#a3e635',
    secondaryColor: '#94a3b8',
    glowColor: '#ecfccb',
    shortDesc: '+1 Armor/room, acid-coated steel & instant shield-shredding!',
    description: 'Fuses Venom + Metal into Rustbane: armored bulwark whose corrosive steel blades dissolve enemy defenses.',
  },
  {
    id: 'eldritch_rot',
    name: 'Eldritch Blight',
    parents: ['venom', 'arcane'],
    primaryColor: '#a3e635',
    secondaryColor: '#c084fc',
    glowColor: '#f7fee7',
    shortDesc: '+2 Max MP, fast spells & homing toxic rune bolts!',
    description: 'Fuses Venom + Arcane into Eldritch Blight: accelerates spellcasting while firing homing corrosive star-spores.',
  },

  // BLOOD + ... (2)
  {
    id: 'iron_siphon',
    name: 'Iron Siphon',
    parents: ['blood', 'metal'],
    primaryColor: '#e11d48',
    secondaryColor: '#cbd5e1',
    glowColor: '#ffe4e6',
    shortDesc: '+1 Armor/room, +16% Strike DMG & vampiric iron shrapnel!',
    description: 'Fuses Blood + Metal into Iron Siphon: armored crimson warrior with heavy strike damage and steady lifesteal.',
  },
  {
    id: 'hemomancy',
    name: 'Hemomancy',
    parents: ['blood', 'arcane'],
    primaryColor: '#f43f5e',
    secondaryColor: '#c084fc',
    glowColor: '#fce7f3',
    shortDesc: '+2 Max MP, fast spells, homing blood stars & HP siphon!',
    description: 'Fuses Blood + Arcane into Forbidden Hemomancy: crimson sorcery fueling rapid spells, high damage, and life drain.',
  },

  // METAL + ARCANE (1)
  {
    id: 'chrono_forge',
    name: 'Chrono-Forge',
    parents: ['metal', 'arcane'],
    primaryColor: '#e2e8f0',
    secondaryColor: '#e879f9',
    glowColor: '#ffffff',
    shortDesc: '+1 Armor/room, +2 Max MP, +16% Spell Haste & homing rune blades!',
    description: 'Fuses Metal + Arcane into Chrono-Forge: runic clockwork armor with expanded mana, rapid cooldowns, and astral steel bolts.',
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


import { LoreFragmentDef, RaidId } from './types';

export const LORE_STORAGE_KEY = 'crimson_nocturne_collected_lore_v1';

export const LORE_FRAGMENTS: LoreFragmentDef[] = [
  // 1. Nocturne Castle
  {
    id: 'nocturne_1',
    raidId: 'nocturne_castle',
    order: 1,
    title: 'Ledger of the Red Tithe',
    excerpt: 'Every winter moon, Lord Valerius demanded a chalice of blood from the valley bailiffs—and returned their couriers hollow-eyed and ageless.',
  },
  {
    id: 'nocturne_2',
    raidId: 'nocturne_castle',
    order: 2,
    title: 'Clockwork Wardens',
    excerpt: 'When living guards began deserting the upper parapets, the castle artificers bound brass pistons to captive shades so the halls would never sleep.',
  },
  {
    id: 'nocturne_3',
    raidId: 'nocturne_castle',
    order: 3,
    title: 'The Shattered Choir',
    excerpt: 'Stained glass in the nave still hums at midnight. The bells were melted down to cast Baron Bloodfang’s dueling blades.',
  },
  {
    id: 'nocturne_4',
    raidId: 'nocturne_castle',
    order: 4,
    title: 'Valerius’s Pact',
    excerpt: 'Before the Eclipse opened, Valerius drank from a fallen star-chalice. He believed he had conquered dusk—until dusk claimed his throne.',
  },

  // 2. Goblin War-Camp
  {
    id: 'goblin_1',
    raidId: 'goblin_camp',
    order: 1,
    title: 'Scrap-Iron Treaty',
    excerpt: 'Seven quarrelsome tribes only united when Warchief Kragmash forged a war-banner from stolen siege chains and blackpowder kegs.',
  },
  {
    id: 'goblin_2',
    raidId: 'goblin_camp',
    order: 2,
    title: 'Bombo’s Notebook',
    excerpt: 'Half-singed parchment filled with crude fuse diagrams: “Double the brimstone, halve the wick, run faster than the sentry.”',
  },
  {
    id: 'goblin_3',
    raidId: 'goblin_camp',
    order: 3,
    title: 'Hex-Lord’s Totem',
    excerpt: 'Zog carved the Blackpowder Idol from meteorite coal. Whenever the goblins chant beneath it, their arrows spark with green fire.',
  },
  {
    id: 'goblin_4',
    raidId: 'goblin_camp',
    order: 4,
    title: 'The Siege Below',
    excerpt: 'Beneath the timber palisades stretch stolen dwarven sapping tunnels—dug to undermine the castle gates in a single explosive night.',
  },

  // 3. Weeping Necropolis
  {
    id: 'necropolis_1',
    raidId: 'weeping_necropolis',
    order: 1,
    title: 'Epitaph of the Silent Watch',
    excerpt: 'The cemetery was built to honor fallen knights, yet every tombstone faces inward—a warning meant to keep something from walking out.',
  },
  {
    id: 'necropolis_2',
    raidId: 'weeping_necropolis',
    order: 2,
    title: 'Mortis’s Iron Spade',
    excerpt: 'The old gravedigger refused to abandon his post when the mist rose. He still digs fresh trenches for intruders before they even fall.',
  },
  {
    id: 'necropolis_3',
    raidId: 'weeping_necropolis',
    order: 3,
    title: 'Choir of Banshees',
    excerpt: 'Vespera trapped the grief of a drowned abbey inside silver lanterns. When a lantern cracks, the wail freezes bone and blade alike.',
  },
  {
    id: 'necropolis_4',
    raidId: 'weeping_necropolis',
    order: 4,
    title: 'The Bound Phylactery',
    excerpt: 'Vespera’s locket holds no single soul, but a braided chorus of sovereigns—allowing her to knit shattered bone back into dread lords.',
  },

  // 4. Brimstone Sanctum
  {
    id: 'brimstone_1',
    raidId: 'brimstone_sanctum',
    order: 1,
    title: 'The Crucible Charter',
    excerpt: 'Once a royal foundry smelting sun-steel, the Sanctum sank into a volcanic fissure the night Ignis stoked the Great Hearth too deep.',
  },
  {
    id: 'brimstone_2',
    raidId: 'brimstone_sanctum',
    order: 2,
    title: 'Obsidian Oath',
    excerpt: 'The Sentinels poured molten basalt into their own armor seams so fear could never make their hands tremble before the furnace.',
  },
  {
    id: 'brimstone_3',
    raidId: 'brimstone_sanctum',
    order: 3,
    title: 'Cinder Ledger',
    excerpt: 'Slag Colossi were never meant for war. They were built to haul white-hot ore—until the Eclipse turned their furnace cores feral.',
  },
  {
    id: 'brimstone_4',
    raidId: 'brimstone_sanctum',
    order: 4,
    title: 'Heart of the Anvil',
    excerpt: 'Ignis hammer-struck a living ember into his chest to become an immortal smith. Every strike of his maul rings like a dying star.',
  },

  // 5. The Mushroom Kingdom
  {
    id: 'mushroom_1',
    raidId: 'mushroom_kingdom',
    order: 1,
    title: 'Mycelial Chorus',
    excerpt: 'The roots beneath the bioluminescent caps whisper in a slow, sweet rhythm. Travelers who linger too long forget their own names.',
  },
  {
    id: 'mushroom_2',
    raidId: 'mushroom_kingdom',
    order: 2,
    title: 'Spore-Keeper’s Warning',
    excerpt: 'Never crush a crimson cap indoors. Its spores remember every footstep and guide the Toadstool Rollers straight to your camp.',
  },
  {
    id: 'mushroom_3',
    raidId: 'mushroom_kingdom',
    order: 3,
    title: 'The Canopy Bloom',
    excerpt: 'When sunlight vanished during the first Eclipse, the royal toadstools grew taller than cathedrals, feeding on moon-dew and fallen armor.',
  },
  {
    id: 'mushroom_4',
    raidId: 'mushroom_kingdom',
    order: 4,
    title: 'Crown of Amanita',
    excerpt: 'Sporelord Amanita was once a forest druid who merged with the oldest root-crown to preserve the grove—only to become its jealous monarch.',
  },

  // 6. Sand Fortress
  {
    id: 'sand_1',
    raidId: 'sand_fortress',
    order: 1,
    title: 'Chronicle of Two Skies',
    excerpt: 'In the high dunes, noon burns iron white-hot and midnight freezes the marrow. Only sandstone obelisks remember the oasis that came before.',
  },
  {
    id: 'sand_2',
    raidId: 'sand_fortress',
    order: 2,
    title: 'Mirage Assassins',
    excerpt: 'The Dune Stalkers train inside blinding sandstorms, stepping where the wind shifts so no sentry ever hears their approach.',
  },
  {
    id: 'sand_3',
    raidId: 'sand_fortress',
    order: 3,
    title: 'Scarab Clockwork',
    excerpt: 'Beneath the sunken courtyards roll brass sun-scarabs, eternally polishing the buried solar seals that keep the citadel aloft.',
  },
  {
    id: 'sand_4',
    raidId: 'sand_fortress',
    order: 4,
    title: 'Seal of Pharaoh-Khan Sethra',
    excerpt: 'Sethra locked the desert’s last golden sun inside his royal scarab, swearing his empire would outlive both oceans and stars.',
  },

  // 7. Alien Ship
  {
    id: 'alien_1',
    raidId: 'alien_ship',
    order: 1,
    title: 'Telemetry Log 00-X',
    excerpt: '“Atmospheric breach complete. Local biosphere exhibits anomalous arcane resonance. Deploying harvester drones to collect sovereign relics.”',
  },
  {
    id: 'alien_2',
    raidId: 'alien_ship',
    order: 2,
    title: 'Gravity Well Notes',
    excerpt: 'The mothership’s decks bend gravity along cyan conduit rails, letting Xeno Leapers stalk ceilings as easily as iron floors.',
  },
  {
    id: 'alien_3',
    raidId: 'alien_ship',
    order: 3,
    title: 'Specimen Vault VII',
    excerpt: 'Rows of stasis cylinders hold shattered blades and glowing ores from a hundred conquered worlds—labeled only by energy yield.',
  },
  {
    id: 'alien_4',
    raidId: 'alien_ship',
    order: 4,
    title: 'The Singularity Drive',
    excerpt: 'Void Archon Xel’Vora binds a collapsed star inside the bridge core, steering the dreadnought across the rift toward the Eclipse Citadel.',
  },

  // 8. Dragon Crane
  {
    id: 'dragon_1',
    raidId: 'dragon_crane',
    order: 1,
    title: 'Scroll of the First Updraft',
    excerpt: 'Monks carved emerald wind-vents into the sheer cliffs so disciples could soar between cloud pagodas without touching earth.',
  },
  {
    id: 'dragon_2',
    raidId: 'dragon_crane',
    order: 2,
    title: 'Lanterns of Jade',
    excerpt: 'Each floating lantern-golem guards a mountain oath. When storm clouds darken the summit, their amber eyes ignite like watchtowers.',
  },
  {
    id: 'dragon_3',
    raidId: 'dragon_crane',
    order: 3,
    title: 'Feather and Scale',
    excerpt: 'The Sky-Acrobats model every strike on the crane’s descent: silent in the mist, swift as a lightning strike, gone before the echo.',
  },
  {
    id: 'dragon_4',
    raidId: 'dragon_crane',
    order: 4,
    title: 'Oath of Longhe',
    excerpt: 'Celestial Crane-Wyrm Longhe guards the Jade Feather Pearl at the roof of the world, testing every warrior who dares climb the gale.',
  },

  // 9. Corrupted Dwarven Mines
  {
    id: 'dwarven_1',
    raidId: 'dwarven_mines',
    order: 1,
    title: 'Foreman’s Slate — Drift 4',
    excerpt: '“We struck a violet crystal seam deeper than the ancient kings ever mapped. The lanterns stopped flickering—and began humming in our skulls.”',
  },
  {
    id: 'dwarven_2',
    raidId: 'dwarven_mines',
    order: 2,
    title: 'Sapper’s Fuse Tally',
    excerpt: 'When the amethyst blight crept up the rail-shafts, the dwarven sappers collapsed three galleries behind them—yet the purple light bled straight through stone.',
  },
  {
    id: 'dwarven_3',
    raidId: 'dwarven_mines',
    order: 3,
    title: 'Runes of the Vault Golems',
    excerpt: 'The Runed Golems were carved to protect the guild treasury from dragons. Corrupted by the Deep Vein, they now seal every miner inside forever.',
  },
  {
    id: 'dwarven_4',
    raidId: 'dwarven_mines',
    order: 4,
    title: 'Crown of Thane Borin',
    excerpt: 'Thane Borin forged the Heart of the Deep Vein into his own gilded breastplate to stave off ruin—turning himself into the mines’ undying hollow king.',
  },

  // 10. Neon Spire 2099 (Cyberpunk Night City)
  {
    id: 'cyber_1',
    raidId: 'cyberpunk_city',
    order: 1,
    title: 'Encrypted Alley Log // 04:19',
    excerpt: '“The sky hasn’t been seen since Sector 7 went vertical. Down here, only neon signs and drone spotlights tell you whether it’s midnight or noon.”',
  },
  {
    id: 'cyber_2',
    raidId: 'cyberpunk_city',
    order: 2,
    title: 'Chrome Syndicate Directive',
    excerpt: 'Every security turret on the rain-slicked skyways is slaved to the Overclock Grid. Hack one relay, and the whole block locks down in magenta plasma.',
  },
  {
    id: 'cyber_3',
    raidId: 'cyberpunk_city',
    order: 3,
    title: 'Ghost in the Wetware',
    excerpt: 'Runners who jack into the Spire’s neural backbone swear they hear medieval sword-steel clashing beneath the bass hum of the servers.',
  },
  {
    id: 'cyber_4',
    raidId: 'cyberpunk_city',
    order: 4,
    title: 'Synth-Shogun Zero’s Decree',
    excerpt: 'Built to guard the megacity’s highest penthouse, Synth-Shogun Zero severed his corporate leash and crowned himself absolute ruler of Spire 2099.',
  },

  // 11. Skulltide Cove & Armada (Treasure Island & Pirate Ship)
  {
    id: 'pirate_1',
    raidId: 'pirate_armada',
    order: 1,
    title: 'Quartermaster’s Salt-Stained Map',
    excerpt: '“Three paces east of the split palm, where the tide hides the brass hatch—that’s where Dreadtide buried half the Spanish Crown’s bullion.”',
  },
  {
    id: 'pirate_2',
    raidId: 'pirate_armada',
    order: 2,
    title: 'Articles of the Black Armada',
    excerpt: 'Every deckhand swears on gunpowder and rum: no soul leaves Skulltide Cove without paying the Admiral’s toll in steel or doubloons.',
  },
  {
    id: 'pirate_3',
    raidId: 'pirate_armada',
    order: 3,
    title: 'Curse of the Gunpowder Hold',
    excerpt: 'When the flagship struck the obsidian reef, the gold refused to sink. Instead, the ship rose back out of the surf with green fire in its lanterns.',
  },
  {
    id: 'pirate_4',
    raidId: 'pirate_armada',
    order: 4,
    title: 'Log of Captain Dreadtide',
    excerpt: '“My compass doesn’t point north, matey. It points to whatever empire still thinks its vault is safe from the tide.”',
  },

  // 12. The Ghost Paradox (Disconnected Shifting Realms)
  {
    id: 'paradox_1',
    raidId: 'ghost_paradox',
    order: 1,
    title: 'Torn Ship-Log Found Inside a Ballroom',
    excerpt: '“I stepped through the captain’s cabin door and landed on red velvet carpet. A chandelier burned above the ocean waves—none of these rooms belong together.”',
  },
  {
    id: 'paradox_2',
    raidId: 'ghost_paradox',
    order: 2,
    title: 'Static Behind the Wallpaper',
    excerpt: 'Peel back the haunted manor’s gilded plaster and you will find humming fiber-optic cables dripping with seawater from a city ten leagues down.',
  },
  {
    id: 'paradox_3',
    raidId: 'ghost_paradox',
    order: 3,
    title: 'Cartographer’s Breakdown',
    excerpt: 'Every door in the Ghost Paradox connects two places that never shared a century, a map, or a sky. Memory is the only mortar holding them upright.',
  },
  {
    id: 'paradox_4',
    raidId: 'ghost_paradox',
    order: 4,
    title: 'Whisper of the Paradox Phantom',
    excerpt: 'Born from every unfinished voyage and forgotten room, the Paradox Phantom stitches stolen realities into an endless haunted labyrinth.',
  },

  // 13. Velvet Blood Chateau (Rich Noble Mansion)
  {
    id: 'mansion_1',
    raidId: 'noble_mansion',
    order: 1,
    title: 'Invitation to the Midnight Masquerade',
    excerpt: '“House Vane requests the pleasure of your company in the Grand Gallery. Formal attire required; departure before dawn is strictly discouraged.”',
  },
  {
    id: 'mansion_2',
    raidId: 'noble_mansion',
    order: 2,
    title: 'Ledger of the Gilded Cellars',
    excerpt: 'Beneath the polished marble halls lie casks older than the kingdom—and coffers stacked with tax-gold wrung from ten starving provinces.',
  },
  {
    id: 'mansion_3',
    raidId: 'noble_mansion',
    order: 3,
    title: 'Fencing Master’s Epitaph',
    excerpt: 'The Duke’s household guards still salute portraits of long-dead ancestors, their rapiers gleaming beneath chandeliers that never run out of wax.',
  },
  {
    id: 'mansion_4',
    raidId: 'noble_mansion',
    order: 4,
    title: 'Signet of Duke Aurelius Vane',
    excerpt: 'Refusing to let age claim his fortune, Aurelius Vane sealed his manor in eternal banquet twilight, dueling every trespasser on crimson silk.',
  },

  // 14. Sunken Pelagia (Underwater City)
  {
    id: 'underwater_1',
    raidId: 'underwater_city',
    order: 1,
    title: 'Hydro-Architect’s Pearl Tablet',
    excerpt: '“When the surface empires burned, Pelagia sealed its crystal domes and sank willingly beneath the trench, lit forever by living coral.”',
  },
  {
    id: 'underwater_2',
    raidId: 'underwater_city',
    order: 2,
    title: 'Chorus of the Glass Tunnels',
    excerpt: 'Walk the pressure-bridges long enough and you can hear giant leviathans singing through the sea-glass, vibrating in the marble under your boots.',
  },
  {
    id: 'underwater_3',
    raidId: 'underwater_city',
    order: 3,
    title: 'Tide-Shaper’s Warning',
    excerpt: 'The kelp towers were never mere gardens—they anchor Pelagia’s air vents against the crushing dark of the abyssal plain.',
  },
  {
    id: 'underwater_4',
    raidId: 'underwater_city',
    order: 4,
    title: 'Oath of Archon Nereus',
    excerpt: 'Crowned with the Abyssal Tide Pearl, Archon Nereus swore no surface conqueror would ever plunder the sunken capital—living or drowned.',
  },

  // 15. Frostwarden Citadel (Frost Wardens)
  {
    id: 'frost_1',
    raidId: 'frost_wardens',
    order: 1,
    title: 'Watchman’s Frozen Tally',
    excerpt: '“Day 412 of the whiteout. The northern aurora burns green over the ramparts, and our breath freezes before it leaves our visors.”',
  },
  {
    id: 'frost_2',
    raidId: 'frost_wardens',
    order: 2,
    title: 'Codex of the Glacier Wall',
    excerpt: 'The Frost Wardens do not forge steel with fire—they quench iron in glacial meltwater and bind it with aurora shards that never thaw.',
  },
  {
    id: 'frost_3',
    raidId: 'frost_wardens',
    order: 3,
    title: 'Hymn of the Ice Golems',
    excerpt: 'When the northern horns sound, statues along the battlements crack their rime shells and march without feeling cold, pain, or mercy.',
  },
  {
    id: 'frost_4',
    raidId: 'frost_wardens',
    order: 4,
    title: 'Vigil of High Warden Borealis',
    excerpt: 'Encased in living permafrost, Borealis guards the Citadel’s summit alone, believing any warmth from the south brings only ruin.',
  },

  // 16. Ironhorn Bloodlands (Barbaric Nation)
  {
    id: 'barbaric_1',
    raidId: 'barbaric_nation',
    order: 1,
    title: 'Carved Tusk Marker — Border Ridge',
    excerpt: '“Past the mammoth ribs, no king’s writ has weight. Only strength of arm, heat of the war-fire, and the roar of the clan drums decide who walks out.”',
  },
  {
    id: 'barbaric_2',
    raidId: 'barbaric_nation',
    order: 2,
    title: 'Chant of the Bone-Shamans',
    excerpt: 'Before every raid, the Bloodclans paint their timber palisades in red ochre and strike iron shields until sparks leap into the steppe wind.',
  },
  {
    id: 'barbaric_3',
    raidId: 'barbaric_nation',
    order: 3,
    title: 'Trial of the Pit-Hulks',
    excerpt: 'An Ironhorn warrior earns no name until they shatter a stone monolith bare-handed or wrestle a war-beast beneath the smoking braziers.',
  },
  {
    id: 'barbaric_4',
    raidId: 'barbaric_nation',
    order: 4,
    title: 'Saga of Warchief Kragg Ironhorn',
    excerpt: 'Uniting seven warring tribes under a single mammoth-tusk banner, Kragg awaits any challenger bold enough to test his axe beside the Great Pyre.',
  },

  // 17. Eclipse Citadel
  {
    id: 'eclipse_1',
    raidId: 'eclipse_gauntlet',
    order: 1,
    title: 'Fracture of the Realms',
    excerpt: 'Where the black sun hangs motionless, shards of every conquered kingdom drift together like moths drawn to a cold flame.',
  },
  {
    id: 'eclipse_2',
    raidId: 'eclipse_gauntlet',
    order: 2,
    title: 'Echoes of the Fallen Lords',
    excerpt: 'Draculor does not let defeated warlords rest. He binds their remnants in pairs to test whether any challenger is worthy of the throne.',
  },
  {
    id: 'eclipse_3',
    raidId: 'eclipse_gauntlet',
    order: 3,
    title: 'The Prism’s Cost',
    excerpt: 'To forge the Astral Eclipse Prism, the Citadel drained dawn from a dozen horizons, leaving only crimson dusk and silver ash.',
  },
  {
    id: 'eclipse_4',
    raidId: 'eclipse_gauntlet',
    order: 4,
    title: 'Last Testament of the Watch',
    excerpt: '“Strike from shadow, shatter the prism, and let morning return. If you fall, leave this page where the next hunter can find it.”',
  },
];

export const LORE_BY_ID: Record<string, LoreFragmentDef> = Object.fromEntries(
  LORE_FRAGMENTS.map((item) => [item.id, item])
);

export const LORE_BY_RAID: Record<RaidId, LoreFragmentDef[]> = LORE_FRAGMENTS.reduce(
  (acc, item) => {
    if (!acc[item.raidId]) acc[item.raidId] = [];
    acc[item.raidId].push(item);
    return acc;
  },
  {} as Record<RaidId, LoreFragmentDef[]>
);

export function loadCollectedLoreIds(): string[] {
  try {
    const raw = localStorage.getItem(LORE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && Boolean(LORE_BY_ID[id]));
  } catch {
    return [];
  }
}

export function saveCollectedLoreIds(ids: string[]): void {
  try {
    const unique = Array.from(new Set(ids.filter((id) => Boolean(LORE_BY_ID[id]))));
    localStorage.setItem(LORE_STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // Ignore storage quota or sandbox restrictions
  }
}

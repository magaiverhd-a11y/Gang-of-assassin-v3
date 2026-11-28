import type { CombinedElementId } from './types';

export type FusionStat =
  | 'armor'
  | 'basic'
  | 'blind'
  | 'boss'
  | 'burn'
  | 'cd'
  | 'crit'
  | 'freeze'
  | 'hp'
  | 'knock'
  | 'leech'
  | 'mana'
  | 'mp'
  | 'poison'
  | 'pot'
  | 'skill'
  | 'speed'
  | 'spell'
  | 'stun'

export interface FusionGift {
  id: CombinedElementId;
  name: string;
  parents: string;
  stat: FusionStat;
  amount: number;
  blurb: string;
}

export const FUSION_GIFTS: Record<CombinedElementId, FusionGift> = {
  steam: { id: 'steam', name: 'Steam', parents: 'water + fire', stat: 'freeze', amount: 1, blurb: 'Steam (water + fire). Chill lasts 1s longer.' },
  mist: { id: 'mist', name: 'Mist', parents: 'water + air', stat: 'freeze', amount: 2, blurb: 'Mist (water + air). Chill lasts 2s longer.' },
  nature: { id: 'nature', name: 'Nature', parents: 'water + earth', stat: 'freeze', amount: 3, blurb: 'Nature (water + earth). Chill lasts 3s longer.' },
  prism: { id: 'prism', name: 'Prism', parents: 'water + light', stat: 'mana', amount: 2, blurb: 'Prism (water + light). Every 2nd hit restores 1 MP.' },
  abyss: { id: 'abyss', name: 'Abyss', parents: 'water + shadow', stat: 'mana', amount: 3, blurb: 'Abyss (water + shadow). Every 3rd hit restores 1 MP.' },
  maelstrom: { id: 'maelstrom', name: 'Maelstrom', parents: 'water + storm', stat: 'mana', amount: 4, blurb: 'Maelstrom (water + storm). Every 4th hit restores 1 MP.' },
  permafrost: { id: 'permafrost', name: 'Permafrost', parents: 'water + glacial', stat: 'mana', amount: 5, blurb: 'Permafrost (water + glacial). Every 5th hit restores 1 MP.' },
  mire: { id: 'mire', name: 'Mire', parents: 'water + venom', stat: 'mana', amount: 6, blurb: 'Mire (water + venom). Every 6th hit restores 1 MP.' },
  ichor: { id: 'ichor', name: 'Ichor', parents: 'water + blood', stat: 'mp', amount: 1, blurb: 'Ichor (water + blood). +1 max MP when you fuse.' },
  quicksilver: { id: 'quicksilver', name: 'Quicksilver', parents: 'water + metal', stat: 'mp', amount: 2, blurb: 'Quicksilver (water + metal). +2 max MP when you fuse.' },
  aether_tide: { id: 'aether_tide', name: 'Glass Tide', parents: 'water + arcane', stat: 'mp', amount: 3, blurb: 'Glass Tide (water + arcane). +3 max MP when you fuse.' },
  wildfire: { id: 'wildfire', name: 'Wildfire', parents: 'fire + air', stat: 'burn', amount: 1, blurb: 'Wildfire (fire + air). Burns last 1s longer.' },
  magma: { id: 'magma', name: 'Magma', parents: 'fire + earth', stat: 'burn', amount: 2, blurb: 'Magma (fire + earth). Burns last 2s longer.' },
  solar: { id: 'solar', name: 'Solar', parents: 'fire + light', stat: 'burn', amount: 3, blurb: 'Solar (fire + light). Burns last 3s longer.' },
  hellfire: { id: 'hellfire', name: 'Hellfire', parents: 'fire + shadow', stat: 'spell', amount: 1, blurb: 'Hellfire (fire + shadow). Spells deal +1 damage.' },
  plasma: { id: 'plasma', name: 'Plasma', parents: 'fire + storm', stat: 'spell', amount: 2, blurb: 'Plasma (fire + storm). Spells deal +2 damage.' },
  frostburn: { id: 'frostburn', name: 'Frostburn', parents: 'fire + glacial', stat: 'spell', amount: 3, blurb: 'Frostburn (fire + glacial). Spells deal +3 damage.' },
  plaguefire: { id: 'plaguefire', name: 'Plaguefire', parents: 'fire + venom', stat: 'crit', amount: 3, blurb: 'Plaguefire (fire + venom). +3% crit chance.' },
  sanguine_flame: { id: 'sanguine_flame', name: 'Sanguine Flame', parents: 'fire + blood', stat: 'crit', amount: 5, blurb: 'Sanguine Flame (fire + blood). +5% crit chance.' },
  molten_steel: { id: 'molten_steel', name: 'Molten Steel', parents: 'fire + metal', stat: 'crit', amount: 7, blurb: 'Molten Steel (fire + metal). +7% crit chance.' },
  starfire: { id: 'starfire', name: 'Starfire', parents: 'fire + arcane', stat: 'crit', amount: 9, blurb: 'Starfire (fire + arcane). +9% crit chance.' },
  sandstorm: { id: 'sandstorm', name: 'Sandstorm', parents: 'air + earth', stat: 'speed', amount: 4, blurb: 'Sandstorm (air + earth). +4% move speed.' },
  aether: { id: 'aether', name: 'Dawn Wind', parents: 'air + light', stat: 'speed', amount: 6, blurb: 'Dawn Wind (air + light). +6% move speed.' },
  phantom: { id: 'phantom', name: 'Phantom', parents: 'air + shadow', stat: 'speed', amount: 8, blurb: 'Phantom (air + shadow). +8% move speed.' },
  tempest: { id: 'tempest', name: 'Tempest', parents: 'air + storm', stat: 'speed', amount: 10, blurb: 'Tempest (air + storm). +10% move speed.' },
  blizzard: { id: 'blizzard', name: 'Blizzard', parents: 'air + glacial', stat: 'speed', amount: 12, blurb: 'Blizzard (air + glacial). +12% move speed.' },
  miasma: { id: 'miasma', name: 'Miasma', parents: 'air + venom', stat: 'knock', amount: 8, blurb: 'Miasma (air + venom). +8% knockback.' },
  crimson_gale: { id: 'crimson_gale', name: 'Crimson Gale', parents: 'air + blood', stat: 'knock', amount: 14, blurb: 'Crimson Gale (air + blood). +14% knockback.' },
  razorwind: { id: 'razorwind', name: 'Razorwind', parents: 'air + metal', stat: 'knock', amount: 20, blurb: 'Razorwind (air + metal). +20% knockback.' },
  zephyr_rune: { id: 'zephyr_rune', name: 'Star Gust', parents: 'air + arcane', stat: 'knock', amount: 26, blurb: 'Star Gust (air + arcane). +26% knockback.' },
  crystal: { id: 'crystal', name: 'Crystal', parents: 'earth + light', stat: 'armor', amount: 1, blurb: 'Crystal (earth + light). +1 armor at the start of each room.' },
  obsidian: { id: 'obsidian', name: 'Obsidian', parents: 'earth + shadow', stat: 'armor', amount: 2, blurb: 'Obsidian (earth + shadow). +2 armor at the start of each room.' },
  thunderquake: { id: 'thunderquake', name: 'Thunderquake', parents: 'earth + storm', stat: 'armor', amount: 3, blurb: 'Thunderquake (earth + storm). +3 armor at the start of each room.' },
  tundra: { id: 'tundra', name: 'Tundra', parents: 'earth + glacial', stat: 'hp', amount: 1, blurb: 'Tundra (earth + glacial). +1 max HP when you fuse.' },
  rotstone: { id: 'rotstone', name: 'Rotstone', parents: 'earth + venom', stat: 'hp', amount: 2, blurb: 'Rotstone (earth + venom). +2 max HP when you fuse.' },
  crimson_titan: { id: 'crimson_titan', name: 'Crimson Titan', parents: 'earth + blood', stat: 'hp', amount: 3, blurb: 'Crimson Titan (earth + blood). +3 max HP when you fuse.' },
  adamant: { id: 'adamant', name: 'Adamant', parents: 'earth + metal', stat: 'skill', amount: 1, blurb: 'Adamant (earth + metal). Weapon skill [3] deals +1 damage.' },
  runestone: { id: 'runestone', name: 'Runestone', parents: 'earth + arcane', stat: 'skill', amount: 2, blurb: 'Runestone (earth + arcane). Weapon skill [3] deals +2 damage.' },
  eclipse: { id: 'eclipse', name: 'Eclipse', parents: 'light + shadow', stat: 'boss', amount: 6, blurb: 'Eclipse (light + shadow). +6% damage against bosses.' },
  radiant_bolt: { id: 'radiant_bolt', name: 'Dawn Arc', parents: 'light + storm', stat: 'boss', amount: 10, blurb: 'Dawn Arc (light + storm). +10% damage against bosses.' },
  aurora: { id: 'aurora', name: 'Aurora', parents: 'light + glacial', stat: 'boss', amount: 14, blurb: 'Aurora (light + glacial). +14% damage against bosses.' },
  purifying_bane: { id: 'purifying_bane', name: 'Radiant Blight', parents: 'light + venom', stat: 'boss', amount: 18, blurb: 'Radiant Blight (light + venom). +18% damage against bosses.' },
  seraph_blood: { id: 'seraph_blood', name: 'Seraphic Blood', parents: 'light + blood', stat: 'crit', amount: 11, blurb: 'Seraphic Blood (light + blood). +11% crit chance.' },
  gilded_aegis: { id: 'gilded_aegis', name: 'Gilded Aegis', parents: 'light + metal', stat: 'blind', amount: 1, blurb: 'Gilded Aegis (light + metal). Blind lasts 1s longer.' },
  celestial: { id: 'celestial', name: 'Chapel Light', parents: 'light + arcane', stat: 'blind', amount: 2, blurb: 'Chapel Light (light + arcane). Blind lasts 2s longer.' },
  void_thunder: { id: 'void_thunder', name: 'Grave Spark', parents: 'shadow + storm', stat: 'blind', amount: 3, blurb: 'Grave Spark (shadow + storm). Blind lasts 3s longer.' },
  black_ice: { id: 'black_ice', name: 'Black Ice', parents: 'shadow + glacial', stat: 'leech', amount: 3, blurb: 'Black Ice (shadow + glacial). Every 3rd kill restores 1 HP.' },
  nightshade: { id: 'nightshade', name: 'Nightshade', parents: 'shadow + venom', stat: 'leech', amount: 4, blurb: 'Nightshade (shadow + venom). Every 4th kill restores 1 HP.' },
  bloodmoon: { id: 'bloodmoon', name: 'Bloodmoon', parents: 'shadow + blood', stat: 'leech', amount: 5, blurb: 'Bloodmoon (shadow + blood). Every 5th kill restores 1 HP.' },
  dusksteel: { id: 'dusksteel', name: 'Dusksteel', parents: 'shadow + metal', stat: 'leech', amount: 6, blurb: 'Dusksteel (shadow + metal). Every 6th kill restores 1 HP.' },
  void_star: { id: 'void_star', name: 'Void Star', parents: 'shadow + arcane', stat: 'leech', amount: 7, blurb: 'Void Star (shadow + arcane). Every 7th kill restores 1 HP.' },
  hailstorm: { id: 'hailstorm', name: 'Sleet Volley', parents: 'storm + glacial', stat: 'stun', amount: 1, blurb: 'Sleet Volley (storm + glacial). Stuns last 0.1s longer.' },
  acid_storm: { id: 'acid_storm', name: 'Vitriol Rain', parents: 'storm + venom', stat: 'stun', amount: 2, blurb: 'Vitriol Rain (storm + venom). Stuns last 0.2s longer.' },
  crimson_storm: { id: 'crimson_storm', name: 'Scarlet Squall', parents: 'storm + blood', stat: 'stun', amount: 3, blurb: 'Scarlet Squall (storm + blood). Stuns last 0.3s longer.' },
  magnet_arc: { id: 'magnet_arc', name: 'Magnet Arc', parents: 'storm + metal', stat: 'cd', amount: 3, blurb: 'Magnet Arc (storm + metal). Skill and spell cooldowns recover 3% faster.' },
  astral_storm: { id: 'astral_storm', name: 'Rune Circuit', parents: 'storm + arcane', stat: 'cd', amount: 5, blurb: 'Rune Circuit (storm + arcane). Skill and spell cooldowns recover 5% faster.' },
  rimeblight: { id: 'rimeblight', name: 'Rimeblight', parents: 'glacial + venom', stat: 'poison', amount: 1, blurb: 'Rimeblight (glacial + venom). The first poison hit adds 1 extra stack.' },
  frost_vein: { id: 'frost_vein', name: 'Frostvein', parents: 'glacial + blood', stat: 'basic', amount: 1, blurb: 'Frostvein (glacial + blood). Basic attacks deal +1 damage.' },
  cryosteel: { id: 'cryosteel', name: 'Cryosteel', parents: 'glacial + metal', stat: 'skill', amount: 3, blurb: 'Cryosteel (glacial + metal). Weapon skill [3] deals +3 damage.' },
  astral_rime: { id: 'astral_rime', name: 'Moon Rime', parents: 'glacial + arcane', stat: 'mp', amount: 4, blurb: 'Moon Rime (glacial + arcane). +4 max MP when you fuse.' },
  hematoxin: { id: 'hematoxin', name: 'Hematoxin', parents: 'venom + blood', stat: 'poison', amount: 2, blurb: 'Hematoxin (venom + blood). The first poison hit adds 2 extra stacks.' },
  rustbane: { id: 'rustbane', name: 'Rustbane', parents: 'venom + metal', stat: 'pot', amount: 1, blurb: 'Rustbane (venom + metal). Potions heal +1.' },
  eldritch_rot: { id: 'eldritch_rot', name: 'Eldritch Blight', parents: 'venom + arcane', stat: 'pot', amount: 2, blurb: 'Eldritch Blight (venom + arcane). Potions heal +2.' },
  iron_siphon: { id: 'iron_siphon', name: 'Iron Siphon', parents: 'blood + metal', stat: 'cd', amount: 7, blurb: 'Iron Siphon (blood + metal). Skill and spell cooldowns recover 7% faster.' },
  hemomancy: { id: 'hemomancy', name: 'Hemomancy', parents: 'blood + arcane', stat: 'cd', amount: 9, blurb: 'Hemomancy (blood + arcane). Skill and spell cooldowns recover 9% faster.' },
  chrono_forge: { id: 'chrono_forge', name: 'Chrono-Forge', parents: 'metal + arcane', stat: 'cd', amount: 11, blurb: 'Chrono-Forge (metal + arcane). Skill and spell cooldowns recover 11% faster.' },
};

export function fusionGift(id: CombinedElementId | null | undefined): FusionGift | null {
  if (!id) return null;
  return FUSION_GIFTS[id] ?? null;
}

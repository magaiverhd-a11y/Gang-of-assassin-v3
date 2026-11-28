# Nocturne Castle — affinity-v1 (Affinity FX + Weapon Evolution visuals)

Branch `affinity-v1` (from `chars-v1`) in `/workspace/gang-of-assassin/tuning-v2-wt`. Not pushed.
Single-file build: `nocturne-castle-affinity-v1.html` (open directly in a browser; `?mobile` forces phone layout).
Patch vs chars-v1: `affinity-v1.patch`.

## What changed (visual/feel only — no power-growth rebalance)
New files: `src/game/affinityFx.ts` (element profiles, palettes, tier looks), `fxSystem.ts` (pooled, capped particle
system that watches the player: footsteps, jump, double jump, landing, dash, swing, hit), `fxDraw.ts` (decals, wake,
aura, statuses, tier-up), `fxSwing.ts` (element + tier swing overlays), `weaponEvo.ts` (evolved weapons in hand).
Hooked into renderer, engine (hit feel, tier-up moment), characterAnim (all heroes' held weapons), sprites (swing),
audio (`playWeaponTierUp`), types/defaults (`tuning.fx`), Tune panel (new **Affinity FX** tab).

Per-element hit feel: shake multiplier + extra hit-stop, scaled by the Element Shake / Element Hit-Stop sliders.
The only gameplay-adjacent change is this small extra shake/hit-stop; damage, crit and scaling are untouched.

## Affinities (tone: muted, grim, weighty)
| Element | Movement | Attacks | Shake / hit-stop |
|---|---|---|---|
| Fire | rising embers + char smoke, scorched footprints, burning wake, ember burst on double jump, scorch on landing | ember burst, scorch decal, foes smoulder (burn flames) | 1.15x / +8 ms |
| Water | drips + cold mist, wet footprints with ripples, spray on jumps, splash ring on landing | splash, foes get frost rime | 0.9x / +4 ms |
| Air | grey wind streaks, swept dust, long fast pale wake, gust ring on double jump | quick gust slashes, wind spiral stagger | 0.7x / none (fast, light) |
| Earth | heavy grit + dust clouds, cracked footprints, big landing quake + floor crack | rock shards, floor crack, daze stars | 1.55x / +18 ms (heaviest) |
| Light | slow pale-gold motes, faint sigil footprints | thin holy gleam, burning sigil brand + light shaft | 1.0x / +10 ms |
| Shadow | sinking shade wisps, black smoke pooling at feet | implosion with dark tendrils, wither | 0.95x / +14 ms |

Combined elements (all 15: Steam, Frost, Nature, Prism, Abyss, Lightning, Magma, Solar, Hellfire, Sandstorm, Aether,
Phantom, Crystal, Obsidian, Eclipse) mix both parents: the first parent drives the effect shapes, the second adds its
particles/colours, in muted versions of the combined element's own colours; shake = average of parents (+0.1),
hit-stop = the heavier parent.

## Weapon evolution (every 5 weapon upgrades)
Applies to all 11 weapons: whip, hammer (Brute), katana, sword, rapier, naginata, greataxe, ribbon whip, Monk's
ash wraps (fists), Wizard's staff.
- **Awakened (5)** — weapon ~9% bigger; amber glow, worn steel edge, glowing rune on the blade/head; swing gets a
  bright metal edge + runes along the arc; rune ring on impact.
- **Mythic (10)** — ~18% bigger; reforged dark blood-steel: serrated back/guard wings (blades), spikes + double bit
  (axe), barbs + blade tip (whips), iron knuckle band + spikes (fists), iron crown + ring + bigger crystal (staff);
  blood-red glow, smoulders when idle; swing gets serrated afterimage / barbed spearhead; metal shards on impact.
- **Transcendent (15)** — ~27% bigger; void-glass black metal with a bright fissure, orbiting glyphs/shards, spectral
  second lash (whips), flame gauntlets (fists), large dark crystal (staff); violet-white glow; swing gets a dark core
  arc with a lightning fissure; impact gleam + extra shake/hit-stop.
- **Tier-up moment** — "<WEAPON> EVOLVED" + tier name text, forge flash in the tier colour, rune circle on the ground,
  light pillar, shake + short hit-stop + zoom punch, and a new anvil/bell sound (`playWeaponTierUp`).

## Tune panel → Affinity FX tab
Affinity FX on/off, Intensity (PC / Phone), Movement FX, Body Aura, Wake Length, Attack FX, Status FX, Element Shake,
Element Hit-Stop, Particle Cap (PC 320 / Phone 140), Weapon Evo Visuals, Evo Glow, Evolution Moment, and two
visual-only previews: Preview Affinity (any of the 21) and Preview Weapon Tier.

## Verification
- `npm run lint` (tsc) and `npm run build` pass; single-file build passes.
- Headless Chrome, 16 runs (`test-scripts/test_affinity.py`): desktop 1400x820 for all 6 heroes (own element + a
  combined element, Ronin with all 6 base elements, close-up tier passes 0-3 for all heroes) and phone 390x844
  (Monk, Wizard, Brute). **0 page errors**, ~60 fps headless, peak particles 33-106 (cap 320 desktop / 140 phone).
  Tier-up moment fired in hunter/monk runs. Panel test (`test_panel.py`) desktop+phone: tab works, selects save to
  localStorage, 0 page errors. Single-file test (`test_single.py`, file://) desktop+phone: 0 page errors.
- Screenshots: `screenshots/` (full frames), `crops/` (player close-ups).
- Contact sheets: `contact-sheet.png` (all), `contact-sheet-affinities-base.png`,
  `contact-sheet-affinities-heroes-combined.png`, `contact-sheet-weapon-tiers.png`, `contact-sheet-mobile-tierup.png`.

## Known issues / notes
- Wizard bolt projectile still uses the real (bright) element colour; only the staff/FX use the muted palette.
- Some existing weapon visuals (Ronin's big red slash, Hunter's golden chain whip) are bright and partly cover the
  subtler tier layers in attacks; tier changes are clearest on the weapon in hand.
- Hunter whip and Monk fists are small at default zoom; their tier changes read best at zoom ~1.5-2.
- Preview options are visual only (they don't give real element effects or damage).
- Minstrel attack shots show the vault/ribbon rather than a landed hit (her attack style).
- Element crit bonuses (fire/shadow/combined) can still cause crit flashes; the test retries those frames.
- Desktop panel test logged one 404 (missing favicon on the local test server), not a game error.

# Nocturne Castle — attacks-v1 (weapon-tier attacks + affinity on attack & ability [3])

Branch `attacks-v1` (from `moves-v1`) in `/workspace/gang-of-assassin/attacks-v1-wt`. Not pushed.
Single-file build: `nocturne-castle-attacks-v1.html` (open directly in a browser; `?mobile` forces phone layout).
Patch vs moves-v1: `attacks-v1.patch`.

This follows affinity-v1. That work changed the weapon in hand and the particles around movement and swings. This work changes the **attack itself** and **ability [3] (Weapon Skill)** for every hero, with Tune knobs. No overall power-growth rebalance (weapon damage per upgrade is unchanged). Numbers stay moderate.

## Weapon evolution — the attack itself (every 5 upgrades)
Applies to all 11 weapons: whip, hammer, katana, sword, rapier, naginata, greataxe, ribbon whip, silk whip, Monk's ash wraps, Wizard's staff.
Each step is about +10% reach (a little more on whip / rapier / naginata), plus a new pattern. Toggle: Tune → Attack Feel → "Evo Changes Attacks". Sliders: Evo Reach, Evo Waves.

| Tier | Basic attack | Ability [3] |
|---|---|---|
| **Awakened (5)** | Longer / larger hitbox. Whip tip is thicker. A small impact ring on the swing. | Slightly longer / stronger skill (existing scaling). Monk dash ends in an Ash Burst. Hammer meteor is labelled Awakened. |
| **Mythic (10)** | A travelling wave or aftershock on the swing (whip/ribbon tip crack, hammer seismic, katana/sword/naginata arc, greataxe quake, Monk palm shock, rapier afterimage pulse). | Extra skill projectiles / echoes (sword fan, naginata arcs, hammer twin floor waves, Monk second burst). Labels: Mythic Cataclysm / Mythic Symphony / etc. |
| **Transcendent (15)** | Another wave or a second hit pulse (double thrust, double palm, two-hit naginata/greataxe/katana, hammer delayed quake, Wizard fires a second muted bolt). ~30% more reach. | Unique finishers: katana fires a second gale arc, hammer a third pair of floor waves, Monk a third dash burst, Wizard nova radiates four bolts. |

The old bright Ronin crimson slash and Hunter gold chain are toned down when Affinity / Evo visuals are on, so the tier layers and extra waves are visible. The katana ability [3] mega-slash is still a wide crimson iaido (its identity), with the extra waves sitting on top at high tiers.

## Affinities — basic attack and ability [3]
Toggle: "Affinity Changes Attacks". Slider: Affinity Power. Combined elements mix both parents (both behaviours apply).

| Element | Basic attack | Ability [3] |
|---|---|---|
| **Fire** | Burn, a small splash around the target | A burning trail left behind dashes / leaps / slams / snaps (fire patches that keep burning) |
| **Water** | Chill / slow, slightly stronger shove | A push wave that knocks nearby foes outward; wet patches; chill on the trail |
| **Air** | Longer reach, slightly faster startup, bolts and waves pierce | A gust that pulls nearby foes into the skill so the follow-through connects |
| **Earth** | Heavier knockback, brief stagger, a small shock splash, slightly heavier startup | A ground shock and a stronger shove on everyone nearby; brief earth patches that stun |
| **Light** | Holy burst splash; bonus damage vs bosses (kept, plus +1 on the hit) | A holy burst around the caster; patches of light; the boss bonus applies on the skill's hits |
| **Shadow** | Wither cling DoT, chance to steal 1 HP, bonus damage vs unaware foes | Wither on nearby foes; a shadow trail; stronger lifesteal and unaware bonus on the skill |

Wizard bolts and nova now use the **muted** affinity palette (toggle: Muted Wizard Bolts), not the bright element colour.

## Tune panel
New tab **Attack Feel** (after Affinity FX):
- Evo Changes Attacks, Evo Reach, Evo Waves
- Affinity Changes Attacks, Affinity Power
- Muted Wizard Bolts

These change combat feel. They do not change weapon damage growth. Off returns the previous attack behaviour. Affinity FX preview still visual-only.

## Verification
- `npm run lint` (tsc) and `npm run build` pass; single-file build passes (~974 kB).
- Headless Chrome, 16 runs (`test-scripts/test_attacks.py`): desktop 1400x820 for all 6 heroes (own element + a combined element, Ronin with all 6 base elements, close-up tier 0–3 attack + ability [3] for every hero) and phone 390x844 (Monk, Wizard, Brute). **0 page errors**, ~60 fps headless. Peak particles 50–216 (cap 320 desktop / 140 phone; one Monk phone run peaked at 139).
- Screenshots: `screenshots/` (268 full frames), `crops/` (268 close-ups).
- Contact sheets: `contact-sheet.png` (all), `contact-sheet-weapon-tiers.png`, `contact-sheet-affinities-heroes.png`, `contact-sheet-affinities-base.png`, `contact-sheet-mobile.png`.

## Known issues / notes
- The Ronin's ability [3] iaido is still a wide crimson slash; element colour shows on the follow-through and in the basic attack. High-tier waves are easier to see on the basic attack than during the mega-slash.
- Some ability [3] screenshots catch a crit flash (fire / shadow / combined still add crit chance even with weapon crit set to 0). The test retries those frames when they wash out; a few skill shots still show a flash.
- Minstrel ability [3] at Transcendent still displays the "MYTHIC SYMPHONY!" text (the move itself is larger). Hammer Transcendent keeps the "MYTHIC CATACLYSM!" label.
- Affinity patches (fire trail, etc.) tick once per enemy so they stay moderate; they apply status more than raw damage.
- Existing mid-upgrade extras (e.g. whip tip burst at weapon level 4, before Awakened) were left in place so mid-run power is not nerfed. The 5 / 10 / 15 steps add reach, waves and extra pulses on top.

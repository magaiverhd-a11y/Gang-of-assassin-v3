# Nocturne Castle — sound-v1 (ABP-4)

Branch `sound-v1` (worktree `/workspace/gang-of-assassin/sound-v1-wt`), based on `assassin-v1`. Not pushed.
Build: `nocturne-castle-sound-v1.html` — 14,630,376 B (≈13.95 MiB, ≈9.7 MB gzip), single file, works from file://.
Built Fri 2026-11-27 (America/Bahia).

## What is wired
- **Audio engine** (`src/game/audio.ts`): Web Audio sample engine, DynamicsCompressor (-6 dB, 4:1) as in the picker, buses: music slider^1.6, ambience slider^1.6, sfx slider^1.4. x3/x4 variants = round-robin. All 132 SFX clips are decoded on first gesture.
- **Mixer defaults** ambience 55 / music 60 / sfx 90 (+ footsteps 100). Tune → **Sound** tab: sliders, on/off toggles, UI sounds toggle, combat cooldown (10 s), crossfade (1.8 s), heavy-foe count (4).
- **Music** (`src/game/soundDirector.ts`, same for all 5 levels):
  - Stealth + light combat pool: Gothic organ + choir, Stealth pulse, Dark Theme (JaggedStone).
  - Heavy combat + boss pool: Drake boss music (Juhani Junkala), Panther boss music (Emma_MA), Laments of the War (Cethiel).
  - Stealth while exploring → combat layer when a fight starts (stealth pauses at its position) → after 10 s with no combat, crossfade back to stealth *where it stopped* → bosses / 4+ foes use the heavy pool. Equal-power crossfades.
  - Ambience always on, random per level from the 17 v2 options; excludes "Abandon Hope" and the first crypt ambience.
- **SFX**: picks from `tools/sound/picks-v2.txt` (latest picks; second-paste weapon section supersedes) → byte-identical clips from the picker (`tools/sound/build_audio.py` re-runs the pipeline; `resolved-picks.json` has the mapping).
- **Footsteps**: loud (footstep slider on top of sfx), round-robin 4 clips, mapped to tile materials by environment + platform style:
  - castle: stone / wood (bridge, rafter, timber) / carpet (boss floor) / dirt (camp ground)
  - goblin camp: dirt floor, wood palisade/timber, mud boss floor, gravel ledges
  - cemetery: grass floor, bones (crypt slab, boss floor), wood, gravel
  - foundry: stone, metal (bridge/rafter/boss floor), gravel (obsidian)
  - eclipse: stone, snow (bridge), wood (rafter), carpet (boss floor)
- **Heroes**: Monk fists → hit light/heavy layered; Wizard bolt → fire roar, overcharge/Nova → ethereal (+ boom); Assassin daggers → rapier (steps 1–2), sword (cross-slash), throw → rapier pitched, Mark → muffled heartbeat (sneak ready), Execute → assassination sound, blink/shadow step → dash.
- **UI sounds**: click / hover / back / confirm / error through delegated handlers (`data-snd`), crafting & upgrades.
- **Credits**: in-game Credits modal (36 sources, CC-BY items incl. Alba MacKenna CC-BY 4.0) from the Tune → Sound tab (and a header button). Generated from `credits-v2.md`.

## Tests (headless Chrome, `test-scripts/test_sound.py`, audio-log based)
- Desktop 55/55 PASS, `?mobile` 50/50 PASS, zero page errors / console errors (`run-desktop-4.log`, `run-mobile-2.log`, `result-*.json`).
- file:// load of the single file OK on both (`file_test.py`: context running, 132/132 clips decoded, no errors).
- Event→clip table (80 events each assert the right clip), round-robin variants, mixer gains vs picker curves (default and stored 20/30/70), music: stealth → combat (stealth pauses at its position) → 10 s → crossfade back to stealth resume position, heavy foes, boss, pools only from the right lists, ambience random per stage and never excluded ones, game over/victory, footsteps per environment, UI sounds, credits.
- `npm run lint` (tsc) and `npm run build` pass.
- Screenshots: `screenshots/` (credits + Tune Sound tab, desktop + mobile).

## Assumptions / not exactly matched
- "First crypt ambience (bird/bat sounds)" = Blob "Crypt ambience (procedural)" (`b_crypt_a`, chirpy generator). Excluded as an assumption.
- Procedural (no clip picked): `hammer_charge`, `shadow_chain` stay synthesized.
- Water footstep set is shipped but no level tile maps to it.
- Victory plays `victory`, then `raid_complete` 1.8 s later (my design; picks listed both).
- Non-boss enemy attack uses the goblin attack x3 clips (picker default slot); generic `alert` throttled to 900 ms.
- Blob SFX pack source license not independently verified.

## Commits (branch sound-v1)
See `commits.txt` / `sound-v1.patch`.

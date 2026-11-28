import { sound } from './audio';
import { AMBIENCE, HEAVY_MUSIC, LIGHT_MUSIC, TrackDef } from './audioManifest';
import type { GameEngine } from './engine';
import type { Enemy, Platform, SoundTuning, TuningConfig } from './types';

/**
 * sound-v1 director.
 *  - MusicDirector: always-on ambience + stealth / combat / heavy / boss music with crossfades.
 *    Stealth pauses where it stops when a fight starts and resumes from there after the combat cooldown.
 *  - EventWatcher: events the engine never announced (footsteps, landing, enemy alert / swing, boss intro,
 *    backstab-ready, victory / defeat), detected by diffing engine state each frame.
 */

export type MusicMode = 'stealth' | 'combat' | 'heavy' | 'boss' | 'silent';

const ELITES = new Set(['knight', 'obsidian_guard', 'goblin_brute', 'acolyte']);

function rand<T>(arr: T[], not?: (T | null)[]): T {
  const pool = not ? arr.filter((a) => !not.includes(a)) : arr;
  const from = pool.length ? pool : arr;
  return from[Math.floor(Math.random() * from.length)];
}

/** Equal-power gain ramp (same curve as the sound picker's crossfades). */
function ramp(ctx: AudioContext, g: GainNode, to: number, dur: number): void {
  const t = ctx.currentTime;
  const from = g.gain.value;
  const gp = g.gain as AudioParam & { cancelAndHoldAtTime?: (t: number) => AudioParam };
  if (gp.cancelAndHoldAtTime) gp.cancelAndHoldAtTime(t);
  else {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(from, t);
  }
  if (dur <= 0.06) {
    g.gain.setValueAtTime(to, t + 0.01);
    return;
  }
  const n = 64;
  const cur = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    cur[i] = to > from ? from + (to - from) * Math.sin((x * Math.PI) / 2) : to + (from - to) * Math.cos((x * Math.PI) / 2);
  }
  g.gain.setValueCurveAtTime(cur, t + 0.02, dur);
}

class Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
  /** ctx time at which the buffer's position 0 would have played. */
  t0: number;
  dur: number;
  constructor(public ctx: AudioContext, public track: TrackDef, buf: AudioBuffer, bus: AudioNode, offset: number, startLevel: number) {
    this.dur = buf.duration;
    this.gain = ctx.createGain();
    this.gain.gain.value = startLevel;
    this.gain.connect(bus);
    this.src = ctx.createBufferSource();
    this.src.buffer = buf;
    this.src.loop = true;
    this.src.connect(this.gain);
    const off = ((offset % buf.duration) + buf.duration) % buf.duration;
    this.src.start(0, off);
    this.t0 = ctx.currentTime - off;
  }
  pos(): number {
    return (this.ctx.currentTime - this.t0) % this.dur;
  }
  fadeTo(level: number, dur: number): void {
    ramp(this.ctx, this.gain, level, dur);
  }
  stopAfter(sec: number): void {
    try {
      this.src.stop(this.ctx.currentTime + sec);
    } catch {
      // already stopped
    }
    const src = this.src;
    const gain = this.gain;
    src.onended = () => {
      try {
        gain.disconnect();
      } catch {
        // ignore
      }
    };
  }
}

export interface MusicDebug {
  mode: MusicMode;
  stage: string;
  stealth: string | null;
  stealthPos: number | null;
  stealthPaused: number | null;
  fight: string | null;
  fightPos: number | null;
  ambience: string | null;
  quietFor: number;
  cooldown: number;
  picks: { stealth: string | null; combat: string | null; heavy: string | null; boss: string | null };
}

export class MusicDirector {
  mode: MusicMode = 'silent';
  private stageKey = '';
  private tok = 0;
  private stealthVoice: Voice | null = null;
  private stealthTrack: TrackDef | null = null;
  private stealthPaused = 0;
  private fightVoice: Voice | null = null;
  private fightTrack: TrackDef | null = null;
  private ambVoice: Voice | null = null;
  private ambTrack: TrackDef | null = null;
  private lastAmb: TrackDef | null = null;
  private lastStealth: TrackDef | null = null;
  private picks: { stealth: TrackDef | null; combat: TrackDef | null; heavy: TrackDef | null; boss: TrackDef | null } = {
    stealth: null,
    combat: null,
    heavy: null,
    boss: null,
  };
  quietFor = 0;
  cooldown = 10;
  private ping = false;
  private silent = false;
  private xf = 1.8;

  constructor() {
    sound.onCombat = () => {
      this.ping = true;
    };
  }

  debug(): MusicDebug {
    return {
      mode: this.mode,
      stage: this.stageKey,
      stealth: this.stealthTrack?.id ?? null,
      stealthPos: this.stealthVoice ? this.stealthVoice.pos() : null,
      stealthPaused: this.stealthVoice ? null : this.stealthPaused,
      fight: this.fightTrack?.id ?? null,
      fightPos: this.fightVoice ? this.fightVoice.pos() : null,
      ambience: this.ambTrack?.id ?? null,
      quietFor: this.quietFor,
      cooldown: this.cooldown,
      picks: {
        stealth: this.picks.stealth?.id ?? null,
        combat: this.picks.combat?.id ?? null,
        heavy: this.picks.heavy?.id ?? null,
        boss: this.picks.boss?.id ?? null,
      },
    };
  }

  private log(event: string, detail?: string, kind: 'music' | 'amb' | 'state' = 'music', clip?: string): void {
    sound.log.push({ t: Math.round(performance.now()), kind, event, clip, detail });
  }

  update(engine: GameEngine, dt: number, snd: SoundTuning): void {
    const ctx = sound.context;
    if (!ctx || ctx.state !== 'running' || !sound.isMixerReady) return;
    this.cooldown = snd.combatCooldownSec;
    this.xf = snd.crossfadeSec;
    const status = engine.status;

    // Run end screens: fade the score out, the defeat / victory stings carry the moment.
    if (status === 'GAME_OVER' || status === 'VICTORY') {
      if (!this.silent) {
        this.silent = true;
        this.goSilent(status === 'VICTORY' ? 1.5 : 2.6);
      }
      return;
    }
    const playing = status === 'PLAYING' || status === 'CAMP' || status === 'CHOOSING_UPGRADE' || status === 'CRAFTING' || status === 'INVENTORY' || status === 'MAP' || status === 'RAID_SELECT';
    if (!playing) return;

    const key = `${engine.activeRaidId}|${engine.stageIndex}|${engine.currentStage.isCamp ? 'camp' : 'room'}|${engine.isCursedChamber ? 'cursed' : ''}`;
    if (key !== this.stageKey || this.silent) {
      this.silent = false;
      this.enterStage(key, engine);
    }

    if (status !== 'PLAYING') {
      this.ping = false;
      return; // menus / camp: stay in stealth, no fight logic
    }

    const f = this.assessFight(engine, snd);
    this.ping = false;
    if (f.fight) this.quietFor = 0;
    else this.quietFor += dt;

    let want: MusicMode = this.mode;
    const rank = { stealth: 0, silent: 0, combat: 1, heavy: 2, boss: 3 } as const;
    if (f.boss) want = 'boss';
    else if (f.heavy && rank[this.mode] < 2) want = 'heavy';
    else if (f.fight && this.mode === 'stealth') want = 'combat';
    else if (this.mode !== 'stealth' && this.quietFor >= this.cooldown) want = 'stealth';
    if (want !== this.mode) void this.transition(want);
  }

  private assessFight(engine: GameEngine, snd: SoundTuning): { fight: boolean; heavy: boolean; boss: boolean } {
    const p = engine.player;
    let engaged = 0;
    let elite = false;
    let boss = false;
    for (const e of engine.enemies) {
      if (e.dead) continue;
      const dx = Math.abs(e.x - p.x);
      const dy = Math.abs(e.y - p.y);
      if (e.isBoss) {
        if (e.alerted || (dx < 950 && dy < 700)) boss = true;
        continue;
      }
      if (e.alerted && dx < 1150 && dy < 750) {
        engaged++;
        if (ELITES.has(e.type)) elite = true;
      }
    }
    const fight = this.ping || engaged > 0 || boss;
    const heavy = boss || engaged >= snd.heavyFoeCount || elite;
    return { fight, heavy, boss };
  }

  /** New room / camp: random ambience + a fresh set of tracks for this level. */
  private enterStage(key: string, engine: GameEngine): void {
    this.stageKey = key;
    this.tok++;
    this.quietFor = 0;
    this.ping = false;
    const stealth = rand(LIGHT_MUSIC, [this.lastStealth]);
    this.picks = {
      stealth,
      combat: rand(LIGHT_MUSIC, [stealth]),
      heavy: rand(HEAVY_MUSIC),
      boss: null,
    };
    this.picks.boss = rand(HEAVY_MUSIC, [this.picks.heavy]);
    this.lastStealth = stealth;
    const amb = rand(AMBIENCE, [this.lastAmb]);
    this.lastAmb = amb;
    this.log('stage_enter', `${key} stealth=${stealth.id} combat=${this.picks.combat!.id} heavy=${this.picks.heavy!.id} boss=${this.picks.boss.id} amb=${amb.id}`, 'state');
    void this.startAmbience(amb);
    void this.resetToStealth(stealth);
    // Warm the fight tracks in the background so the first transition is instant.
    const hasBoss = engine.enemies.some((e) => e.isBoss);
    setTimeout(() => {
      if (this.stageKey !== key) return;
      void sound.loadBuffer(this.picks.combat!.file);
      void sound.loadBuffer(this.picks.heavy!.file);
      if (hasBoss) void sound.loadBuffer(this.picks.boss!.file);
    }, 1500);
  }

  private async startAmbience(track: TrackDef): Promise<void> {
    const ctx = sound.context;
    const bus = sound.ambience;
    if (!ctx || !bus) return;
    const my = this.stageKey;
    const buf = await sound.loadBuffer(track.file);
    if (!buf || my !== this.stageKey) return;
    const old = this.ambVoice;
    if (old) {
      old.fadeTo(0, 2.4);
      old.stopAfter(2.6);
    }
    this.ambVoice = new Voice(ctx, track, buf, bus, 0, 0);
    this.ambVoice.fadeTo(1, 2.4);
    this.ambTrack = track;
    this.log('ambience_start', track.title, 'amb', track.file);
    this.evict();
  }

  private async resetToStealth(track: TrackDef): Promise<void> {
    const ctx = sound.context;
    const bus = sound.music;
    if (!ctx || !bus) return;
    const my = this.stageKey;
    const buf = await sound.loadBuffer(track.file);
    if (!buf || my !== this.stageKey) return;
    const myTok = ++this.tok;
    if (this.stealthVoice) {
      this.stealthVoice.fadeTo(0, 1.4);
      this.stealthVoice.stopAfter(1.6);
    }
    if (this.fightVoice) {
      this.fightVoice.fadeTo(0, 1.4);
      this.fightVoice.stopAfter(1.6);
      this.fightVoice = null;
      this.fightTrack = null;
    }
    if (myTok !== this.tok) return;
    this.stealthTrack = track;
    this.stealthPaused = 0;
    this.stealthVoice = new Voice(ctx, track, buf, bus, 0, 0);
    this.stealthVoice.fadeTo(1, 1.8);
    this.mode = 'stealth';
    this.log('stealth_start', track.title, 'music', track.file);
    this.evict();
  }

  private goSilent(sec: number): void {
    this.tok++;
    for (const v of [this.stealthVoice, this.fightVoice, this.ambVoice]) {
      if (v) {
        v.fadeTo(0, sec);
        v.stopAfter(sec + 0.2);
      }
    }
    this.stealthVoice = null;
    this.fightVoice = null;
    this.ambVoice = null;
    this.fightTrack = null;
    this.ambTrack = null;
    this.stealthPaused = 0;
    this.stageKey = '';
    this.mode = 'silent';
    this.log('silent', `fade ${sec}s`, 'state');
  }

  private trackFor(mode: MusicMode): TrackDef | null {
    if (mode === 'combat') return this.picks.combat;
    if (mode === 'heavy') return this.picks.heavy;
    if (mode === 'boss') return this.picks.boss;
    return this.picks.stealth;
  }

  private async transition(to: MusicMode): Promise<void> {
    const ctx = sound.context;
    const bus = sound.music;
    if (!ctx || !bus) return;
    const myTok = ++this.tok;
    const from = this.mode;
    this.mode = to;
    this.quietFor = to === 'stealth' ? this.quietFor : 0;
    const xf = this.xf;

    if (to === 'stealth') {
      // fight fades out, the stealth track resumes from where it stopped
      const track = this.stealthTrack ?? this.picks.stealth;
      if (!track) return;
      const buf = await sound.loadBuffer(track.file);
      if (!buf || myTok !== this.tok) return;
      if (this.fightVoice) {
        this.fightVoice.fadeTo(0, xf + 0.7);
        this.fightVoice.stopAfter(xf + 0.9);
        this.fightVoice = null;
        this.fightTrack = null;
      }
      const resumeAt = this.stealthPaused;
      if (!this.stealthVoice) {
        this.stealthVoice = new Voice(ctx, track, buf, bus, resumeAt, 0);
        this.stealthTrack = track;
      }
      this.stealthVoice.fadeTo(1, xf);
      this.log('stealth_resume', `from=${from} resumeAt=${resumeAt.toFixed(2)} actualPos=${this.stealthVoice.pos().toFixed(2)}`, 'music', track.file);
      return;
    }

    const track = this.trackFor(to);
    if (!track) return;
    const buf = await sound.loadBuffer(track.file);
    if (!buf || myTok !== this.tok) return;
    if (this.stealthVoice) {
      // remember exactly where the explore track stopped
      this.stealthPaused = this.stealthVoice.pos();
      this.stealthVoice.fadeTo(0, xf);
      this.stealthVoice.stopAfter(xf + 0.15);
      this.stealthVoice = null;
      this.log('stealth_pause', `at=${this.stealthPaused.toFixed(2)}`, 'music', this.stealthTrack?.file);
    }
    if (this.fightVoice) {
      this.fightVoice.fadeTo(0, xf);
      this.fightVoice.stopAfter(xf + 0.15);
    }
    this.fightVoice = new Voice(ctx, track, buf, bus, 0, 0);
    this.fightVoice.fadeTo(1, xf);
    this.fightTrack = track;
    this.log(`${to}_start`, `from=${from} ${track.title}`, 'music', track.file);
    this.evict();
  }

  /** Drop decoded music buffers we no longer need (each is ~20 MB decoded). */
  private evict(): void {
    const keep = new Set<string>();
    for (const t of [this.ambTrack, this.stealthTrack, this.fightTrack, this.picks.combat, this.picks.heavy, this.picks.boss, this.picks.stealth]) if (t) keep.add(t.file);
    sound.releaseBuffers((f) => (f.startsWith('music/') || f.startsWith('amb/')) && !keep.has(f));
  }
}

// ---------------------------------------------------------------------------
// Terrain: map each level's platform styles to the picked footstep sets.
// ---------------------------------------------------------------------------
export function terrainFor(env: string | undefined, plat: Platform | null, isFloor: boolean): string {
  const style = plat?.style ?? 'stone';
  switch (env ?? 'castle') {
    case 'goblin_camp':
      if (style === 'palisade' || style === 'timber' || style === 'rafter' || style === 'bridge') return 'wood';
      if (style === 'boss_floor') return 'mud';
      if (style === 'pillar') return 'stone';
      return isFloor ? 'dirt' : 'gravel';
    case 'cemetery':
      if (style === 'crypt_slab') return 'bones';
      if (style === 'rafter' || style === 'bridge') return 'wood';
      if (style === 'boss_floor') return 'bones';
      if (style === 'pillar') return 'stone';
      return isFloor ? 'grass' : 'gravel';
    case 'foundry':
      if (style === 'obsidian') return 'gravel';
      if (style === 'bridge' || style === 'rafter' || style === 'boss_floor') return 'metal';
      return 'stone';
    case 'eclipse':
      if (style === 'bridge') return 'snow';
      if (style === 'rafter') return 'wood';
      if (style === 'boss_floor') return 'carpet';
      return 'stone';
    default: // castle + camp
      if (style === 'camp_ground') return 'dirt';
      if (style === 'bridge' || style === 'rafter' || style === 'timber') return 'wood';
      if (style === 'boss_floor') return 'carpet';
      return 'stone';
  }
}

interface EnemySnap {
  alerted: boolean;
  charging: boolean;
}

export class EventWatcher {
  private lastX = 0;
  private stride = 0;
  private lastStepAt = -10;
  private wasGround = true;
  private airVy = 0;
  private snaps = new Map<number, EnemySnap>();
  private introduced = new Set<number>();
  private prevStatus = '';
  private prevStage = '';
  private backstab = false;
  private backstabAt = -10;
  private acc = 0;
  private now = 0;
  /** Last terrain used (for tests / debug). */
  lastTerrain = '';

  update(engine: GameEngine, dt: number, tuning: TuningConfig): void {
    if (!sound.context || sound.context.state !== 'running') return;
    this.now += dt;
    const status = engine.status;
    if (status !== this.prevStatus) {
      if (status === 'GAME_OVER') sound.playDefeat();
      if (status === 'VICTORY') {
        sound.playVictory();
        setTimeout(() => sound.playRaidComplete(), 1800);
      }
      this.prevStatus = status;
    }
    if (status !== 'PLAYING' && status !== 'CAMP') return;
    const stageKey = `${engine.activeRaidId}|${engine.stageIndex}`;
    if (stageKey !== this.prevStage) {
      this.prevStage = stageKey;
      this.snaps.clear();
      this.introduced.clear();
      this.lastX = engine.player.x;
      this.stride = 0;
    }
    this.footsteps(engine, dt, tuning);
    if (status === 'PLAYING' && !engine.currentStage.isCamp) {
      this.enemyEvents(engine);
      this.acc += dt;
      if (this.acc >= 0.12) {
        this.acc = 0;
        this.backstabReady(engine, tuning);
      }
    }
  }

  private footsteps(engine: GameEngine, dt: number, tuning: TuningConfig): void {
    const p = engine.player;
    const dx = Math.abs(p.x - this.lastX);
    this.lastX = p.x;
    // Landing
    if (!p.onGround) this.airVy = Math.max(this.airVy, p.vy);
    if (p.onGround && !this.wasGround) {
      if (this.airVy > 260) sound.playLand(this.airVy);
      this.airVy = 0;
      this.stride = 0;
    }
    this.wasGround = p.onGround;
    if (!tuning.sound.footstepsOn || !p.onGround || dx > 40 || dx / Math.max(dt, 0.001) < 40) {
      if (!p.onGround) this.stride = 0;
      return;
    }
    const striding = p.crouching ? 50 : 74;
    this.stride += dx;
    if (this.stride >= striding && this.now - this.lastStepAt > 0.14) {
      this.stride = 0;
      this.lastStepAt = this.now;
      const terrain = this.terrainUnder(engine);
      this.lastTerrain = terrain;
      sound.playFootstep(terrain, p.crouching);
    }
  }

  terrainUnder(engine: GameEngine): string {
    const p = engine.player;
    let best: Platform | null = null;
    for (const pl of engine.platforms) {
      if (p.x < pl.x - 2 || p.x > pl.x + pl.w + 2) continue;
      if (Math.abs(pl.y - p.y) > 8) continue;
      if (pl.crumbling && !engine.isPlatformSolid(pl)) continue;
      best = pl;
      break;
    }
    const isFloor = best ? Math.abs(best.y - engine.currentStage.floorY) < 3 : false;
    return terrainFor(engine.currentStage.environment, best, isFloor);
  }

  private enemyEvents(engine: GameEngine): void {
    const p = engine.player;
    const seen = new Set<number>();
    for (const e of engine.enemies) {
      seen.add(e.id);
      const prev = this.snaps.get(e.id);
      const charging = e.attackChargeTimer > 0 || (e.attackSwingTimer ?? 0) > 0;
      const near = Math.abs(e.x - p.x) < 1200 && Math.abs(e.y - p.y) < 800;
      if (!e.dead && prev && near) {
        if (e.isBoss) {
          if (!this.introduced.has(e.id) && (e.alerted || Math.abs(e.x - p.x) < 950)) {
            this.introduced.add(e.id);
            sound.playBossIntro();
          }
        } else {
          if (e.alerted && !prev.alerted) sound.playEnemyAlert(e.type);
          if (charging && !prev.charging) sound.playEnemyAttack();
        }
      } else if (!e.dead && e.isBoss && near && !this.introduced.has(e.id) && (e.alerted || Math.abs(e.x - p.x) < 950)) {
        this.introduced.add(e.id);
        sound.playBossIntro();
      }
      this.snaps.set(e.id, { alerted: e.alerted, charging });
    }
    for (const id of this.snaps.keys()) if (!seen.has(id)) this.snaps.delete(id);
  }

  private backstabReady(engine: GameEngine, tuning: TuningConfig): void {
    let ready = false;
    try {
      ready = engine.findAssassinationTarget(tuning) !== null;
    } catch {
      ready = false;
    }
    if (ready && !this.backstab && this.now - this.backstabAt > 1.6) {
      this.backstabAt = this.now;
      sound.playBackstabReady();
    }
    this.backstab = ready;
  }
}

export class SoundDirector {
  readonly music = new MusicDirector();
  readonly events = new EventWatcher();

  update(engine: GameEngine, dt: number, tuning: TuningConfig): void {
    const s = tuning.sound;
    sound.setMixer({
      music: s.musicVol,
      ambience: s.ambienceVol,
      sfx: s.sfxVol,
      footsteps: s.footstepVol / 100,
      musicOn: s.musicOn,
      ambienceOn: s.ambienceOn,
    });
    this.events.update(engine, dt, tuning);
    this.music.update(engine, dt, s);
  }
}

export const soundDirector = new SoundDirector();
export type { Enemy };

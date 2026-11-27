import { ElementId, EnemyType, WeaponId } from './types';

/**
 * Procedural Gothic Foley & Modal Audio Engine
 * - Master DynamicsCompressor + Gothic Stone Hall Convolver Reverb bus
 * - Soft-clipping analog saturation for punchy low-end impacts
 * - Multi-layered filtered noise Foley + inharmonic metallic modal partials (zero raw 8-bit buzzers)
 * - Optional external sample override registry (custom .wav/.mp3 files can be registered via loadCustomSample)
 */
class SoundBank {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private reverbBus: GainNode | null = null;
  private saturator: WaveShaperNode | null = null;
  private whiteNoise: AudioBuffer | null = null;
  private customSamples = new Map<string, AudioBuffer>();
  public muted = false;

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.initBuses(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private initBuses(ctx: AudioContext): void {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;

    const master = ctx.createGain();
    master.gain.value = 0.92;

    const dry = ctx.createGain();
    dry.gain.value = 0.92;

    // Warm Gothic Stone Hall Reverb (stereo damped impulse response)
    const convolver = ctx.createConvolver();
    convolver.buffer = this.buildHallImpulse(ctx, 1.15, 2.7);
    const revFilter = ctx.createBiquadFilter();
    revFilter.type = 'lowpass';
    revFilter.frequency.value = 2800;
    const revGain = ctx.createGain();
    revGain.gain.value = 0.28;

    // Soft-clipping analog punch saturator
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i * 2) / 512 - 1;
      curve[i] = Math.tanh(x * 2.2);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';

    dry.connect(comp);
    revGain.connect(convolver).connect(revFilter).connect(comp);
    shaper.connect(dry);
    comp.connect(master).connect(ctx.destination);

    this.masterGain = master;
    this.dryBus = dry;
    this.reverbBus = revGain;
    this.saturator = shaper;

    // Pre-generate 2 seconds of clean white noise for zero-alloc Foley bursts
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.whiteNoise = buf;
  }

  private buildHallImpulse(ctx: AudioContext, durationSec: number, decay: number): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * durationSec);
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const env = Math.pow(1 - t, decay);
        const raw = (Math.random() * 2 - 1) * env;
        // Gentle stone-wall damping
        lp = lp * 0.58 + raw * 0.42;
        data[i] = lp;
      }
    }
    return impulse;
  }

  /** Optional hook: load an external .wav/.mp3 sample to override any named sound effect. */
  public async loadCustomSample(key: string, url: string): Promise<boolean> {
    const ctx = this.ensure();
    if (!ctx) return false;
    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      const arr = await res.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr);
      this.customSamples.set(key, decoded);
      return true;
    } catch {
      return false;
    }
  }

  private tryPlayCustom(key: string, volume = 0.75, rate = 1): boolean {
    const buf = this.customSamples.get(key);
    const ctx = this.ctx;
    if (!buf || !ctx || !this.dryBus) return false;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(this.dryBus);
    if (this.reverbBus) g.connect(this.reverbBus);
    src.start(ctx.currentTime);
    return true;
  }

  private route(node: AudioNode, wet = 0.25, drive = false): void {
    if (!this.dryBus || !this.reverbBus || !this.saturator) return;
    if (drive) {
      node.connect(this.saturator);
    } else {
      node.connect(this.dryBus);
    }
    if (wet > 0) {
      const send = this.ctx!.createGain();
      send.gain.value = wet;
      node.connect(send).connect(this.reverbBus);
    }
  }

  private playNoiseBurst(
    startTime: number,
    duration: number,
    filterType: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    q: number,
    vol: number,
    wet = 0.22,
    attack = 0.004,
    drive = false
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.whiteNoise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteNoise;
    const offset = Math.random() * Math.max(0.05, this.whiteNoise.duration - duration - 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, freqStart), startTime);
    if (freqEnd !== freqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startTime + duration);
    }

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + Math.min(attack, duration * 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter).connect(g);
    this.route(g, wet, drive);
    src.start(startTime, offset, duration + 0.02);
  }

  private playSubPunch(
    startTime: number,
    freqStart: number,
    freqEnd: number,
    duration: number,
    vol: number,
    drive = true,
    wet = 0.14
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(22, freqEnd), startTime + duration);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(g);
    this.route(g, wet, drive);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playMetallicRing(
    startTime: number,
    baseFreq: number,
    duration: number,
    vol: number,
    ratios: readonly number[] = [1, 2.32, 3.74, 5.18],
    wet = 0.45
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ratios.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const f = baseFreq * ratio;
      osc.frequency.setValueAtTime(f, startTime);
      osc.frequency.exponentialRampToValueAtTime(f * 0.96, startTime + duration);

      const g = ctx.createGain();
      const partialVol = vol / (1 + idx * 0.85);
      const partialDur = duration / (1 + idx * 0.35);
      g.gain.setValueAtTime(0.0001, startTime);
      g.gain.linearRampToValueAtTime(partialVol, startTime + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + partialDur);

      osc.connect(g);
      this.route(g, wet, false);
      osc.start(startTime);
      osc.stop(startTime + partialDur + 0.02);
    });
  }

  private playHarpNote(startTime: number, freq: number, duration: number, vol: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    // Plucked warm harp/celesta: fundamental sine + soft 2nd harmonic + gentle lowpass
    for (const [mult, vScale] of [
      [1, 1],
      [2, 0.32],
      [3, 0.1],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, startTime);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, startTime);
      g.gain.linearRampToValueAtTime(vol * vScale, startTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration / mult);
      osc.connect(g);
      this.route(g, 0.55, false);
      osc.start(startTime);
      osc.stop(startTime + duration / mult + 0.03);
    }
  }

  // ===========================================================================
  // MOVEMENT & CLOAK FOLEY
  // ===========================================================================
  public playJump(): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('jump', 0.6)) return;
    const now = ctx.currentTime;
    // Grounded leather boot push + subtle cloak lift (no cartoon boing!)
    this.playSubPunch(now, 105, 58, 0.065, 0.16, false, 0.08);
    this.playNoiseBurst(now, 0.085, 'bandpass', 480, 1250, 1.3, 0.11, 0.14, 0.006);
  }

  public playBackdash(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('backdash', 0.65)) return;
    const now = ctx.currentTime;
    // Crisp dark cloak snap & swift air rush
    this.playNoiseBurst(now, 0.13 + evoTier * 0.03, 'bandpass', 1450 + evoTier * 260, 340, 1.4, 0.2 + evoTier * 0.03, 0.28, 0.005);
    this.playSubPunch(now, 145, 55, 0.09 + evoTier * 0.03, 0.15 + evoTier * 0.04, evoTier >= 1, 0.1);
    this.playEvolutionOvertones(now, evoTier, 587.33);
  }

  private playEvolutionOvertones(now: number, evoTier: number, baseFreq: number): void {
    if (evoTier <= 0) return;
    // Tier 1 (5+ upgrades — Awakened): shimmering harmonic resonance + warm sub pulse
    this.playSubPunch(now, 118, 42, 0.14, 0.16, true, 0.26);
    this.playMetallicRing(now + 0.01, baseFreq, 0.24, 0.058, [1, 1.5, 2.0, 3.0], 0.52);
    if (evoTier >= 2) {
      // Tier 2 (10+ upgrades — Mythic): cathedral octave chord + rushing plasma wind
      this.playNoiseBurst(now, 0.2, 'bandpass', 2800, 720, 1.6, 0.14, 0.45, 0.008);
      this.playHarpNote(now + 0.015, baseFreq * 0.5, 0.32, 0.065);
      this.playHarpNote(now + 0.03, baseFreq * 1.5, 0.34, 0.055);
    }
    if (evoTier >= 3) {
      // Tier 3+ (15+ upgrades — Transcendent): celestial bell chord + deep seismic bloom
      this.playSubPunch(now, 88, 28, 0.24, 0.22, true, 0.4);
      this.playHarpNote(now + 0.02, baseFreq * 2.0, 0.4, 0.06);
    }
  }

  // ===========================================================================
  // DISTINCT WEAPON FOLEY (Layered Air Slice, Leather Crack & Modal Steel)
  // ===========================================================================
  public playWhip(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('whip', 0.8)) return;
    const now = ctx.currentTime;
    // 1. Leather/silk body sweep
    this.playNoiseBurst(now, 0.085 + evoTier * 0.02, 'bandpass', 520 + evoTier * 180, 2100, 1.9, 0.2 + evoTier * 0.03, 0.24, 0.008);
    // 2. Sharp supersonic whip snap at tip!
    this.playNoiseBurst(now + 0.034, 0.036 + evoTier * 0.015, 'highpass', 2400, 1400, 0.9, 0.34 + evoTier * 0.04, 0.38, 0.002, true);
    this.playSubPunch(now + 0.034, 240, 80, 0.045 + evoTier * 0.02, 0.18 + evoTier * 0.05, true, 0.12);
    this.playEvolutionOvertones(now + 0.02, evoTier, 880);
  }

  public playSwordSlash(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('sword', 0.8)) return;
    const now = ctx.currentTime;
    // Clean steel blade wind cleave + subtle tempered steel ring
    this.playNoiseBurst(now, 0.13 + evoTier * 0.025, 'bandpass', 2400 + evoTier * 300, 460, 1.35, 0.24 + evoTier * 0.03, 0.3, 0.004);
    this.playMetallicRing(now, 690, 0.12 + evoTier * 0.06, 0.055 + evoTier * 0.015, [1, 2.41, 3.88], 0.36 + evoTier * 0.1);
    this.playEvolutionOvertones(now, evoTier, 698.46);
  }

  public playKatanaSlash(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('katana', 0.8)) return;
    const now = ctx.currentTime;
    // Razor-thin iaido air slice + cold crystalline katana ring
    this.playNoiseBurst(now, 0.095 + evoTier * 0.025, 'bandpass', 3600 + evoTier * 350, 920, 1.8, 0.24 + evoTier * 0.03, 0.34, 0.003);
    this.playMetallicRing(now, 1520, 0.17 + evoTier * 0.07, 0.065 + evoTier * 0.015, [1, 1.62, 2.74, 4.12], 0.52 + evoTier * 0.1);
    this.playEvolutionOvertones(now, evoTier, 1046.5);
  }

  public playRapierThrust(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('rapier', 0.75)) return;
    const now = ctx.currentTime;
    // Whip-fast needle pierce + tight fencing ping
    this.playNoiseBurst(now, 0.065 + evoTier * 0.02, 'highpass', 3100, 1800, 1.2, 0.2 + evoTier * 0.03, 0.25, 0.002);
    this.playMetallicRing(now, 1880, 0.095 + evoTier * 0.05, 0.055 + evoTier * 0.015, [1, 2.15], 0.35 + evoTier * 0.12);
    this.playEvolutionOvertones(now, evoTier, 1174.66);
  }

  public playNaginataSlash(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('naginata', 0.8)) return;
    const now = ctx.currentTime;
    // Long sweeping polearm wind rush + electric edge whisper
    this.playNoiseBurst(now, 0.16 + evoTier * 0.03, 'bandpass', 1750 + evoTier * 320, 320, 1.6, 0.26 + evoTier * 0.03, 0.32, 0.006);
    this.playMetallicRing(now, 1080, 0.15 + evoTier * 0.06, 0.05 + evoTier * 0.015, [1, 2.24, 3.91], 0.42 + evoTier * 0.12);
    this.playEvolutionOvertones(now, evoTier, 783.99);
  }

  public playGreataxeSwing(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('greataxe', 0.85)) return;
    const now = ctx.currentTime;
    // Massive heavy wind cleave + deep iron weight
    this.playNoiseBurst(now, 0.22 + evoTier * 0.04, 'bandpass', 620 + evoTier * 140, 140, 1.1, 0.32 + evoTier * 0.04, 0.32, 0.012, true);
    this.playSubPunch(now + 0.02, 130, 34, 0.18 + evoTier * 0.05, 0.28 + evoTier * 0.06, true, 0.2 + evoTier * 0.08);
    this.playEvolutionOvertones(now + 0.01, evoTier, 440);
  }

  public playHammerCharge(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Heavy iron heft inhale (low wind + subtle steel tension)
    this.playNoiseBurst(now, 0.18, 'bandpass', 240, 760, 1.5, 0.14, 0.22, 0.04);
    this.playSubPunch(now, 72, 118, 0.16, 0.14, false, 0.15);
  }

  public playHammerBoom(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('hammer_boom', 0.9)) return;
    const now = ctx.currentTime;
    // 1. Saturated seismic impact drop
    this.playSubPunch(now, 150, 24, 0.36 + evoTier * 0.08, 0.44 + evoTier * 0.06, true, 0.26 + evoTier * 0.1);
    // 2. Heavy stone & gravel impact shatter
    this.playNoiseBurst(now, 0.26 + evoTier * 0.05, 'lowpass', 1400 + evoTier * 300, 160, 0.9, 0.34 + evoTier * 0.04, 0.42, 0.003, true);
    // 3. Delayed scattering rubble pebbles
    this.playNoiseBurst(now + 0.06, 0.18 + evoTier * 0.05, 'bandpass', 1900, 520, 2.4, 0.15 + evoTier * 0.03, 0.35, 0.008);
    // 4. Deep iron anvil thud
    this.playMetallicRing(now, 210, 0.24 + evoTier * 0.08, 0.075 + evoTier * 0.02, [1, 1.58, 2.71], 0.38 + evoTier * 0.12);
    this.playEvolutionOvertones(now, evoTier, 329.63);
  }

  // ===========================================================================
  // SPELLS, ITEMS, LEVEL-UP & WORLD INTERACTIONS
  // ===========================================================================
  public playUpgradePick(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((f, i) => this.playHarpNote(now + i * 0.055, f, 0.48, 0.11));
  }

  public playLevelUp(): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('level_up', 0.85)) return;
    const now = ctx.currentTime;
    // Resonant cathedral bell + golden rising harp chord
    this.playSubPunch(now, 146.8, 73.4, 0.45, 0.24, false, 0.35);
    this.playMetallicRing(now, 587.33, 0.72, 0.06, [1, 2.0, 3.0, 4.18], 0.65);
    const notes = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0];
    notes.forEach((f, i) => this.playHarpNote(now + 0.03 + i * 0.055, f, 0.62, 0.115));
  }

  public playShadowChain(chainCount = 1): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const pitchBoost = Math.pow(1.08, Math.min(6, Math.max(0, chainCount - 1)));
    // Swift phantom cloak wind + rising ghostly silver chime
    this.playNoiseBurst(now, 0.16, 'bandpass', 1800 * pitchBoost, 520, 1.9, 0.18, 0.42, 0.004);
    this.playHarpNote(now, 659.25 * pitchBoost, 0.36, 0.09);
    this.playHarpNote(now + 0.05, 987.77 * pitchBoost, 0.42, 0.085);
  }

  /** Minstrel Encore Waltz / phantom-echo dance: quick rising harp arpeggio (intensity 1-3). */
  public playMinstrelDance(intensity = 1): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const level = Math.max(1, Math.min(3, Math.round(intensity)));
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51].slice(0, 2 + level);
    notes.forEach((f, i) => this.playHarpNote(now + i * 0.06, f, 0.38, 0.075));
    this.playNoiseBurst(now, 0.14, 'bandpass', 2400, 900, 1.6, 0.12, 0.3, 0.004);
  }

  public playSlowMoPulse(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Soft rose-gold time-dilation breath
    this.playSubPunch(now, 128, 62, 0.24, 0.18, false, 0.34);
    this.playHarpNote(now, 523.25, 0.32, 0.055);
  }

  public playBrazierSnap(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Sharp iron chain link snapping!
    this.playMetallicRing(now, 1420, 0.16, 0.11, [1, 1.48, 2.67, 3.85], 0.45);
    this.playNoiseBurst(now, 0.09, 'highpass', 2200, 900, 1.1, 0.2, 0.28, 0.002);
  }

  public playBrazierCrash(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Heavy iron cauldron crash + roaring flame explosion!
    this.playSubPunch(now, 145, 28, 0.38, 0.42, true, 0.3);
    this.playMetallicRing(now, 310, 0.32, 0.1, [1, 1.41, 2.28, 3.31], 0.55);
    this.playNoiseBurst(now, 0.42, 'bandpass', 950, 210, 0.9, 0.36, 0.48, 0.005, true);
    this.playNoiseBurst(now + 0.04, 0.28, 'highpass', 1800, 620, 1.2, 0.18, 0.38, 0.01);
  }

  public playCrumble(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Staggered stone masonry crack + gravel fall
    this.playSubPunch(now, 96, 36, 0.22, 0.22, true, 0.25);
    for (let i = 0; i < 4; i++) {
      this.playNoiseBurst(now + i * 0.045, 0.075, 'bandpass', 720 + i * 260, 260, 2.2, 0.15, 0.32, 0.003);
    }
  }

  public playFireball(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('fireball', 0.8)) return;
    const now = ctx.currentTime;
    // Organic roaring flame whoosh + warm ignition thump
    this.playSubPunch(now, 165, 52, 0.14 + evoTier * 0.05, 0.22 + evoTier * 0.05, true, 0.2 + evoTier * 0.08);
    this.playNoiseBurst(now, 0.24 + evoTier * 0.06, 'bandpass', 920 + evoTier * 220, 240, 1.05, 0.28 + evoTier * 0.04, 0.36, 0.012, true);
    this.playEvolutionOvertones(now, evoTier, 523.25);
  }

  public playGrapple(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Crisp metallic latch clink + taut rope zip
    this.playMetallicRing(now, 1280, 0.09 + evoTier * 0.05, 0.07 + evoTier * 0.015, [1, 1.72, 2.95], 0.3 + evoTier * 0.1);
    this.playNoiseBurst(now, 0.08 + evoTier * 0.025, 'bandpass', 1400, 2800, 2.0, 0.12 + evoTier * 0.03, 0.2, 0.003);
    this.playEvolutionOvertones(now, evoTier, 880);
  }

  public playGasBreak(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Glass vial shatter (high tinkles) + pressurized toxic hiss
    this.playMetallicRing(now, 2650, 0.09 + evoTier * 0.05, 0.065 + evoTier * 0.015, [1, 1.38, 1.94, 2.77], 0.35 + evoTier * 0.1);
    this.playNoiseBurst(now + 0.015, 0.28 + evoTier * 0.06, 'highpass', 1800, 680, 1.1, 0.2 + evoTier * 0.04, 0.32, 0.01);
    this.playEvolutionOvertones(now, evoTier, 622.25);
  }

  public playBuff(evoTier = 0): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playHarpNote(now, 440, 0.34 + evoTier * 0.08, 0.09 + evoTier * 0.015);
    this.playHarpNote(now + 0.06, 659.25, 0.38 + evoTier * 0.08, 0.09 + evoTier * 0.015);
    this.playNoiseBurst(now, 0.18 + evoTier * 0.05, 'bandpass', 600, 2200, 2.2, 0.08 + evoTier * 0.03, 0.4, 0.02);
    this.playEvolutionOvertones(now, evoTier, 880);
  }

  public playWeaponEvolution(tier = 1): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Grand cathedral forge strike + ascending mythic chord!
    this.playSubPunch(now, 138, 32, 0.5, 0.36, true, 0.45);
    this.playMetallicRing(now, 523.25 * (1 + Math.min(2, tier - 1) * 0.15), 0.85, 0.1, [1, 1.5, 2.0, 3.0, 4.0], 0.7);
    this.playNoiseBurst(now + 0.02, 0.36, 'bandpass', 1800, 420, 1.2, 0.22, 0.55, 0.02);
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.playHarpNote(now + 0.04 + i * 0.05, f, 0.72, 0.11));
  }

  public playElementalAwaken(isFusion: boolean, elementId: ElementId): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const rootByEl: Partial<Record<ElementId, number>> = {
      water: 329.63,
      fire: 293.66,
      air: 392.0,
      earth: 220.0,
      light: 440.0,
      shadow: 246.94,
    };
    const root = rootByEl[elementId] ?? 349.23;
    this.playSubPunch(now, isFusion ? 160 : 120, 34, isFusion ? 0.65 : 0.45, isFusion ? 0.38 : 0.28, true, 0.5);
    this.playNoiseBurst(now, isFusion ? 0.55 : 0.35, 'bandpass', 620, 2600, 1.4, 0.2, 0.55, 0.03);
    const ratios = isFusion ? [1, 1.25, 1.5, 2, 2.5, 3, 4] : [1, 1.25, 1.5, 2, 3];
    ratios.forEach((r, i) => {
      this.playHarpNote(now + 0.03 + i * 0.06, root * r, isFusion ? 0.85 : 0.62, 0.105);
    });
    if (isFusion) {
      this.playMetallicRing(now + 0.08, root * 2, 0.9, 0.085, [1, 1.5, 2.0, 3.0], 0.75);
    }
  }

  public playElementalProc(elementId: ElementId): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    switch (elementId) {
      case 'lightning':
        this.playNoiseBurst(now, 0.14, 'highpass', 3400, 1400, 1.2, 0.22, 0.38, 0.002, true);
        this.playMetallicRing(now, 1960, 0.14, 0.065, [1, 1.47, 2.63], 0.42);
        break;
      case 'fire':
      case 'magma':
      case 'hellfire':
      case 'steam':
        this.playNoiseBurst(now, 0.18, 'bandpass', 1100, 280, 1.1, 0.2, 0.36, 0.006, true);
        this.playSubPunch(now, 140, 44, 0.12, 0.18, true, 0.22);
        break;
      case 'water':
      case 'frost':
      case 'abyss':
        this.playNoiseBurst(now, 0.16, 'bandpass', 2200, 620, 2.2, 0.15, 0.4, 0.004);
        this.playHarpNote(now, 1046.5, 0.24, 0.06);
        break;
      case 'air':
      case 'sandstorm':
      case 'aether':
      case 'phantom':
        this.playNoiseBurst(now, 0.16, 'bandpass', 2600, 520, 1.6, 0.16, 0.42, 0.004);
        this.playHarpNote(now, 1318.5, 0.22, 0.055);
        break;
      case 'earth':
      case 'nature':
      case 'crystal':
      case 'obsidian':
        this.playSubPunch(now, 125, 36, 0.16, 0.24, true, 0.24);
        this.playNoiseBurst(now, 0.14, 'lowpass', 950, 220, 1.1, 0.18, 0.3, 0.003);
        break;
      case 'light':
      case 'solar':
      case 'prism':
      case 'eclipse':
        this.playMetallicRing(now, 1174.66, 0.28, 0.06, [1, 1.5, 2.0, 3.0], 0.55);
        this.playHarpNote(now, 1567.98, 0.3, 0.07);
        break;
      case 'shadow':
        this.playSubPunch(now, 96, 38, 0.15, 0.18, false, 0.35);
        this.playNoiseBurst(now, 0.15, 'bandpass', 900, 260, 2.0, 0.15, 0.44, 0.006);
        break;
    }
  }

  public playArmorBlock(): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('block', 0.8)) return;
    const now = ctx.currentTime;
    // Authentic heavy steel-on-steel shield deflection clang!
    this.playSubPunch(now, 210, 95, 0.07, 0.2, true, 0.12);
    this.playMetallicRing(now, 920, 0.22, 0.12, [1, 1.44, 2.29, 3.41], 0.48);
    this.playNoiseBurst(now, 0.04, 'highpass', 2800, 1600, 1.0, 0.18, 0.25, 0.002);
  }

  public playInteract(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playHarpNote(now, 523.25, 0.22, 0.085);
    this.playHarpNote(now + 0.055, 783.99, 0.28, 0.08);
  }

  // ===========================================================================
  // VISCERAL FLESH/BLOOD IMPACTS, CRITS, ASSASSINATIONS & ORGANIC ENEMY DEATHS
  // ===========================================================================
  public playBloodSplatter(intensity = 1): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = Math.min(0.28, 0.08 + intensity * 0.048);
    // Wet organic dual-band splash (low squelch + crisp spray droplets)
    this.playNoiseBurst(
      now,
      dur,
      'bandpass',
      1150 + intensity * 240,
      260,
      2.3,
      Math.min(0.32, 0.14 * intensity),
      0.24,
      0.003
    );
    this.playNoiseBurst(
      now + 0.018,
      dur * 0.85,
      'bandpass',
      2400,
      780,
      2.8,
      Math.min(0.2, 0.085 * intensity),
      0.28,
      0.004
    );
  }

  public playHit(heavy = false, weapon?: WeaponId): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom(heavy ? 'hit_heavy' : 'hit', 0.85)) return;
    const now = ctx.currentTime;

    // 1. Meaty punchy body thump (saturated sub kick + low-mid impact burst)
    this.playSubPunch(now, heavy ? 145 : 185, heavy ? 34 : 52, heavy ? 0.15 : 0.095, heavy ? 0.38 : 0.28, true, 0.16);
    this.playNoiseBurst(now, heavy ? 0.085 : 0.055, 'lowpass', heavy ? 900 : 1250, 220, 0.9, heavy ? 0.28 : 0.2, 0.16, 0.002, true);

    // 2. Subtle steel flesh-cut shimmer for bladed weapons
    if (weapon === 'katana' || weapon === 'rapier' || weapon === 'sword' || weapon === 'naginata') {
      this.playMetallicRing(now, 1480, 0.075, 0.045, [1, 2.28], 0.32);
    }

    // 3. Wet blood splash
    this.playBloodSplatter(heavy ? 1.3 : 0.9);
  }

  public playCrit(): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('crit', 0.9)) return;
    const now = ctx.currentTime;

    // 1. Deep saturated impact punch
    this.playSubPunch(now, 190, 32, 0.24, 0.42, true, 0.22);
    // 2. Bright razor steel critical ring in cathedral reverb
    this.playMetallicRing(now, 1340, 0.26, 0.1, [1, 1.5, 2.38, 3.62], 0.58);
    // 3. Heavy flesh slash & arterial burst
    this.playNoiseBurst(now, 0.12, 'bandpass', 2600, 420, 1.4, 0.24, 0.34, 0.002, true);
    this.playBloodSplatter(1.65);
  }

  public playAssassinate(): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('assassinate', 0.95)) return;
    const now = ctx.currentTime;

    // Beat 1 (0ms): Cold anime katana flash glint ringing in stone hall
    this.playMetallicRing(now, 2180, 0.34, 0.11, [1, 1.5, 2.42, 3.31], 0.72);
    // Beat 2 (+38ms): Devastating sub-bass severing drop + razor blood-rend
    const cutT = now + 0.038;
    this.playSubPunch(cutT, 168, 24, 0.38, 0.48, true, 0.28);
    this.playNoiseBurst(cutT, 0.24, 'bandpass', 2400, 260, 1.3, 0.34, 0.42, 0.003, true);
    this.playBloodSplatter(2.1);
  }

  public playEnemyDeath(
    enemyType: EnemyType,
    isBoss: boolean,
    isBigBoss: boolean,
    wasAssassination = false
  ): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crisp lethal finisher thud + blood burst
    this.playSubPunch(now, isBoss ? 135 : 165, 36, isBoss ? 0.22 : 0.12, isBoss ? 0.32 : 0.22, true, 0.2);
    this.playBloodSplatter(isBigBoss ? 2.2 : isBoss ? 1.8 : wasAssassination ? 1.9 : 1.25);

    if (enemyType === 'skeleton' || enemyType === 'boss_bone_reaver' || enemyType === 'boss_gravedigger') {
      // Dry rattling bones clattering on stone floor (tight resonant bandpass noise clicks!)
      const boneFreqs = [1180, 1620, 940, 1890, 790, 1340];
      boneFreqs.forEach((f, idx) => {
        const t = now + 0.025 + idx * 0.038;
        this.playNoiseBurst(t, 0.034, 'bandpass', f, f * 0.78, 8.5, 0.22 * (1 - idx * 0.1), 0.38, 0.002);
      });
    } else if (enemyType.includes('goblin')) {
      // Breathy guttural goblin choke/grunt + body collapse thump
      const pitch =
        enemyType.includes('brute') || enemyType.includes('behemoth') || enemyType.includes('warlord')
          ? 0.6
          : 1.0;
      this.playNoiseBurst(now + 0.015, 0.26, 'bandpass', 980 * pitch, 240 * pitch, 3.8, 0.24, 0.3, 0.008, true);
      this.playSubPunch(now + 0.02, 260 * pitch, 72 * pitch, 0.22, 0.2, true, 0.22);
    } else if (
      enemyType === 'wraith' ||
      enemyType === 'acolyte' ||
      enemyType === 'boss_banshee' ||
      enemyType === 'boss_malakor' ||
      enemyType === 'boss_necromancer'
    ) {
      // Haunting airy spectral wind-exhale + ghostly cathedral shimmer
      const dur = isBoss ? 0.62 : 0.4;
      this.playNoiseBurst(now + 0.01, dur, 'bandpass', isBoss ? 1280 : 1650, 260, 5.2, 0.22, 0.68, 0.03);
      this.playMetallicRing(now + 0.02, isBoss ? 520 : 680, dur, 0.055, [1, 1.49], 0.7);
    } else if (
      enemyType === 'knight' ||
      enemyType === 'obsidian_guard' ||
      enemyType === 'boss_colossus' ||
      enemyType === 'boss_executioner' ||
      enemyType === 'boss_slag_titan' ||
      enemyType === 'boss_cinder_warden' ||
      enemyType === 'boss_infernal_knight' ||
      enemyType === 'boss_forge_lord'
    ) {
      // Heavy iron armor crash & hollow plate clangs echoing on stone!
      this.playMetallicRing(now + 0.015, 420, 0.28, 0.11, [1, 1.39, 2.18, 3.24], 0.52);
      this.playMetallicRing(now + 0.11, 290, 0.24, 0.09, [1, 1.52, 2.44], 0.48);
      this.playSubPunch(now + 0.09, 105, 32, 0.18, 0.28, true, 0.22);
    } else if (
      enemyType === 'bat' ||
      enemyType === 'gargoyle' ||
      enemyType === 'ember_imp' ||
      enemyType === 'grave_hound' ||
      enemyType === 'boss_gargoyle_king' ||
      enemyType === 'boss_pyre_matriarch'
    ) {
      // Organic creature screech (high resonant filtered noise + wing puff)
      const isHound = enemyType === 'grave_hound';
      this.playNoiseBurst(now + 0.01, 0.22, 'bandpass', isHound ? 640 : 2100, isHound ? 180 : 420, 4.2, 0.22, 0.36, 0.005);
      this.playSubPunch(now + 0.01, isHound ? 220 : 540, isHound ? 68 : 160, 0.18, 0.14, false, 0.2);
    } else {
      // Ghoul / Vampire / Overlord: visceral low guttural exhale + crimson ash burst
      const dur = isBoss ? 0.52 : 0.3;
      this.playNoiseBurst(now + 0.015, dur, 'bandpass', 580, 145, 2.8, 0.25, 0.36, 0.01, true);
      this.playSubPunch(now + 0.015, isBoss ? 145 : 190, 42, dur, 0.24, true, 0.24);
    }
  }

  public playBossEnergySprout(isBigBoss: boolean): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = isBigBoss ? 1.75 : 1.1;

    // 1. Massive seismic bass detonation
    this.playSubPunch(now, isBigBoss ? 130 : 145, 22, isBigBoss ? 0.7 : 0.45, isBigBoss ? 0.5 : 0.38, true, 0.42);
    // 2. Surging dark energy wind swell
    this.playNoiseBurst(now + 0.04, dur, 'bandpass', 320, isBigBoss ? 2400 : 1700, 2.4, isBigBoss ? 0.28 : 0.2, 0.58, 0.2);
    // 3. Harmonic gothic organ / choir-like fifths swelling upward
    const bases = isBigBoss ? [110, 164.8, 220, 329.6] : [146.8, 220, 293.6];
    bases.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(f * (isBigBoss ? 2.0 : 1.5), now + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(isBigBoss ? 0.075 : 0.055, now + 0.28);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(g);
      this.route(g, 0.65, false);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    });
    // 4. Crackling energy pulses
    const pulseCount = isBigBoss ? 6 : 3;
    for (let i = 0; i < pulseCount; i++) {
      const t = now + 0.16 + i * (dur / (pulseCount + 1));
      this.playNoiseBurst(t, 0.11, 'bandpass', 1200 + i * 320, 480, 2.5, isBigBoss ? 0.18 : 0.12, 0.45, 0.004);
    }
  }

  public playRelicCrystallize(isBigBoss: boolean): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    this.playSubPunch(now, isBigBoss ? 115 : 135, 42, isBigBoss ? 0.5 : 0.32, isBigBoss ? 0.34 : 0.24, false, 0.38);
    const notes = isBigBoss
      ? [329.63, 440, 554.37, 659.25, 880, 1108.73, 1318.51]
      : [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((f, i) => {
      this.playHarpNote(now + i * 0.045, f, isBigBoss ? 0.78 : 0.52, isBigBoss ? 0.115 : 0.09);
    });
  }

  public playPlayerHurt(isBoss = false): void {
    const ctx = this.ensure();
    if (!ctx || this.tryPlayCustom('player_hurt', 0.85)) return;
    const now = ctx.currentTime;
    // Heavy dull impact thud + sharp breath cut (no buzzy sawtooth)
    this.playSubPunch(now, isBoss ? 135 : 165, 36, 0.2, isBoss ? 0.38 : 0.28, true, 0.22);
    this.playNoiseBurst(now, 0.14, 'lowpass', 950, 180, 1.0, isBoss ? 0.28 : 0.2, 0.2, 0.003, true);
    this.playBloodSplatter(isBoss ? 1.4 : 0.95);
  }

  public playParry(isDeflect = false): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Resounding steel-on-steel clash + high golden harmonic ring!
    this.playSubPunch(now, isDeflect ? 190 : 165, 58, 0.14, isDeflect ? 0.24 : 0.32, false, 0.28);
    this.playNoiseBurst(now, 0.075, 'highpass', 3200, 1400, 1.8, 0.26, 0.34, 0.002);
    this.playMetallicRing(now, isDeflect ? 1180 : 940, 0.36, 0.14, [1, 1.48, 2.26, 3.12], 0.55);
    this.playHarpNote(now + 0.02, isDeflect ? 1174.66 : 1046.5, 0.34, 0.09);
    this.playHarpNote(now + 0.055, isDeflect ? 1567.98 : 1318.51, 0.42, 0.08);
  }

  public playSecretReveal(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crumbling gothic stone wall rumble + classic ascending secret discovery melody!
    this.playSubPunch(now, 115, 36, 0.28, 0.32, true, 0.35);
    this.playNoiseBurst(now, 0.24, 'bandpass', 620, 190, 1.6, 0.24, 0.42, 0.006, true);
    const notes = [523.25, 622.25, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((f, i) => {
      this.playHarpNote(now + 0.07 + i * 0.068, f, 0.48, 0.095);
    });
  }

  public playCursedShrine(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Deep ominous blood-cathedral tritone organ swell + eerie dark shimmer
    this.playSubPunch(now, 92, 26, 0.55, 0.42, true, 0.45);
    this.playNoiseBurst(now + 0.02, 0.46, 'bandpass', 780, 220, 3.4, 0.2, 0.62, 0.05);
    const freqs = [110, 155.56, 220, 311.13];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.96, now + 0.65);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(920, now);
      filter.frequency.exponentialRampToValueAtTime(240, now + 0.65);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
      osc.connect(filter);
      filter.connect(g);
      this.route(g, 0.68, false);
      osc.start(now);
      osc.stop(now + 0.72);
    });
  }

  public playHeroTagIn(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crisp dimensional phantom blink + heroic dual chime!
    this.playNoiseBurst(now, 0.16, 'bandpass', 640, 2600, 2.8, 0.22, 0.52, 0.01);
    this.playSubPunch(now + 0.03, 180, 72, 0.14, 0.2, false, 0.3);
    this.playHarpNote(now + 0.02, 587.33, 0.32, 0.09);
    this.playHarpNote(now + 0.07, 880, 0.4, 0.095);
    this.playHarpNote(now + 0.12, 1174.66, 0.46, 0.085);
  }
}

export const sound = new SoundBank();

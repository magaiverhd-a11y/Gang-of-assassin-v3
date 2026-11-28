// Affinity FX particle system: emitters, per-frame update, hit hook. (affinity-v1)
import {
  BASE_FEEL,
  BaseKind,
  evoFxOn,
  FxPalette,
  realTier,
  tierLook,
  visualElement,
  visualTier,
  weaponSwingShape,
} from './affinityFx';
import type { Enemy, FxTuning, Player, TuningConfig } from './types';

export type PK = 'ember' | 'spark' | 'smoke' | 'mist' | 'drop' | 'streak' | 'grit' | 'shard' | 'mote' | 'wisp' | 'flake';

export interface FxP {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  kind: PK;
  color: string;
  color2: string;
  rot: number;
  vr: number;
  g: number;
  drag: number;
  curl: number;
}

export interface FxRing {
  x: number;
  y: number;
  r0: number;
  r1: number;
  life: number;
  max: number;
  color: string;
  width: number;
  flat: number;
  glyphs: number;
  spin: number;
}

export interface FxDecal {
  x: number;
  y: number;
  life: number;
  max: number;
  kind: BaseKind;
  pal: FxPalette;
  size: number;
  seed: number;
}

export interface FxStatus {
  kind: BaseKind;
  t: number;
  max: number;
  pal: FxPalette;
}

export interface TrailPt {
  x: number;
  y: number;
  life: number;
}

export interface TierUpAnim {
  t: number;
  max: number;
  tier: number;
  glow: string;
  core: string;
}

export interface FxHost {
  onWeaponTierUp(tier: number, prevTier: number, withMoment: boolean): void;
}

export interface HitFeel {
  shakeMul: number;
  hitstopAddMs: number;
  extraShake: number;
}

type PIn = Omit<FxP, 'rot' | 'vr' | 'g' | 'drag' | 'curl' | 'color2'> & Partial<FxP>;

const DASH_KEYS = ['backdashTimer', 'dashAttackTimer', 'monkDashTimer', 'rapierLungeTimer', 'naginataVaultTimer', 'minstrelVaultTimer', 'assassinBlinkTimer', 'assassinStepTimer'] as const;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class AffinityFx {
  public mobile = false;
  public particles: FxP[] = [];
  public rings: FxRing[] = [];
  public decals: FxDecal[] = [];
  public trail: TrailPt[] = [];
  public statuses = new Map<number, FxStatus>();
  public tierUp: TierUpAnim | null = null;
  public stats = { steps: 0, jumps: 0, doubleJumps: 0, lands: 0, dashes: 0, swings: 0, hits: 0, tierUps: 0, peak: 0 };
  public fx: FxTuning | null = null;

  private lastPlayer: Player | null = null;
  private prevOnGround = true;
  private prevVy = 0;
  private prevAirJumps = 0;
  private prevDash = false;
  private prevAttack: Player['attackState'] = 'idle';
  private prevX = 0;
  private stride = 0;
  private stepFoot = 0;
  private emitAcc = 0;
  private weaponAcc = 0;
  private lastTier = 0;

  constructor(private host: FxHost) {}

  reset(): void {
    this.particles.length = 0;
    this.rings.length = 0;
    this.decals.length = 0;
    this.trail.length = 0;
    this.statuses.clear();
    this.tierUp = null;
  }

  get intensity(): number {
    const fx = this.fx;
    if (!fx) return 1;
    return Math.max(0, this.mobile ? fx.mobileIntensity : fx.intensity);
  }

  get cap(): number {
    const fx = this.fx;
    if (!fx) return this.mobile ? 140 : 320;
    return Math.max(10, this.mobile ? fx.mobileParticleCap : fx.particleCap);
  }

  private count(n: number): number {
    const v = n * this.intensity;
    const whole = Math.floor(v);
    return whole + (Math.random() < v - whole ? 1 : 0);
  }

  private push(p: PIn): void {
    if (this.particles.length >= this.cap) return;
    this.particles.push({ rot: Math.random() * Math.PI * 2, vr: 0, g: 0, drag: 0, curl: 0, color2: p.color, ...p } as FxP);
  }

  private ring(r: Partial<FxRing> & { x: number; y: number; r1: number; color: string }): void {
    if (this.rings.length > 40) return;
    this.rings.push({ r0: 4, life: 0.3, max: 0.3, width: 2, flat: 1, glyphs: 0, spin: 0, ...r } as FxRing);
  }

  private decal(x: number, y: number, kind: BaseKind, pal: FxPalette, size: number, life = 1.6): void {
    if (this.decals.length > 40) this.decals.shift();
    this.decals.push({ x, y, kind, pal, size, life, max: life, seed: Math.random() * 100 });
  }

  // ---- emitters ----------------------------------------------------------
  private emitBody(kind: BaseKind, pal: FxPalette, x: number, y: number, h: number, moving: boolean): void {
    const bx = x + rnd(-10, 10);
    const by = y - rnd(0.1, 0.9) * h;
    switch (kind) {
      case 'fire':
        this.push({ x: bx, y: by, vx: rnd(-12, 12), vy: rnd(-70, -30), life: rnd(0.5, 0.9), max: 0.9, size: rnd(1.2, 2.2), kind: 'ember', color: pal.mid, color2: pal.core, curl: rnd(-2, 2) });
        if (Math.random() < 0.35) this.push({ x: bx, y: by - 6, vx: rnd(-8, 8), vy: rnd(-30, -14), life: 0.9, max: 0.9, size: rnd(4, 7), kind: 'smoke', color: pal.smoke });
        break;
      case 'water':
        this.push({ x: bx, y: by, vx: rnd(-6, 6), vy: rnd(10, 30), life: 0.6, max: 0.6, size: rnd(1.2, 1.9), kind: 'drop', color: pal.mid, color2: pal.core, g: 380 });
        if (Math.random() < 0.3) this.push({ x: x + rnd(-14, 14), y: y - rnd(2, 10), vx: rnd(-10, 10), vy: rnd(-8, -2), life: 1.0, max: 1.0, size: rnd(5, 9), kind: 'mist', color: pal.mid });
        break;
      case 'air':
        this.push({ x: x + rnd(-22, 22), y: by, vx: (moving ? -1 : 1) * rnd(40, 110) * (Math.random() < 0.5 ? 1 : -1), vy: rnd(-12, 6), life: 0.45, max: 0.45, size: rnd(6, 13), kind: 'streak', color: pal.mid, curl: rnd(-3, 3) });
        break;
      case 'earth':
        this.push({ x: bx, y: y - rnd(0, 0.35) * h, vx: rnd(-20, 20), vy: rnd(-40, -10), life: 0.7, max: 0.7, size: rnd(1.4, 2.4), kind: 'grit', color: pal.mid, g: 420, vr: rnd(-8, 8) });
        break;
      case 'light':
        this.push({ x: bx, y: by, vx: rnd(-5, 5), vy: rnd(-26, -10), life: rnd(0.9, 1.4), max: 1.4, size: rnd(1, 1.8), kind: 'mote', color: pal.mid, color2: pal.core });
        break;
      case 'shadow':
        this.push({ x: bx, y: by, vx: rnd(-10, 10), vy: rnd(8, 24), life: rnd(0.7, 1.1), max: 1.1, size: rnd(3, 6), kind: 'wisp', color: pal.dark, color2: pal.mid, curl: rnd(-2.5, 2.5) });
        break;
    }
  }

  private emitGround(kind: BaseKind, pal: FxPalette, x: number, y: number, dir: number, power: number, withDecal: boolean): void {
    const n = Math.max(1, Math.round(3 * power));
    switch (kind) {
      case 'fire':
        for (let i = 0; i < this.count(n + 1); i++)
          this.push({ x: x + rnd(-4, 4), y: y - 1, vx: -dir * rnd(10, 50) + rnd(-20, 20), vy: rnd(-90, -40) * power, life: rnd(0.35, 0.7), max: 0.7, size: rnd(1.1, 2), kind: 'ember', color: pal.mid, color2: pal.core, g: 60 });
        if (withDecal) this.decal(x, y, 'fire', pal, 6 + power * 2, 1.4);
        break;
      case 'water':
        for (let i = 0; i < this.count(n + 1); i++)
          this.push({ x: x + rnd(-4, 4), y: y - 1, vx: rnd(-60, 60), vy: rnd(-120, -50) * power, life: 0.5, max: 0.5, size: rnd(1.2, 2), kind: 'drop', color: pal.mid, color2: pal.core, g: 620 });
        if (withDecal) this.decal(x, y, 'water', pal, 7 + power * 2, 1.2);
        break;
      case 'air':
        for (let i = 0; i < this.count(n); i++)
          this.push({ x: x + rnd(-6, 6), y: y - rnd(1, 6), vx: -dir * rnd(60, 140), vy: rnd(-20, 0), life: 0.35, max: 0.35, size: rnd(6, 12), kind: 'streak', color: pal.mid, curl: rnd(-2, 2) });
        this.push({ x, y: y - 3, vx: -dir * 30, vy: -6, life: 0.6, max: 0.6, size: 5 + power * 2, kind: 'mist', color: pal.smoke });
        break;
      case 'earth':
        for (let i = 0; i < this.count(n + 1); i++)
          this.push({ x: x + rnd(-5, 5), y: y - 2, vx: rnd(-55, 55), vy: rnd(-130, -50) * power, life: 0.6, max: 0.6, size: rnd(1.4, 2.6), kind: 'grit', color: i % 2 ? pal.mid : pal.dark, g: 700, vr: rnd(-10, 10) });
        for (let i = 0; i < this.count(1 + power); i++)
          this.push({ x: x + rnd(-6, 6), y: y - 3, vx: rnd(-30, 30), vy: rnd(-16, -4), life: 0.9, max: 0.9, size: rnd(5, 9) * power, kind: 'smoke', color: pal.smoke });
        if (withDecal && power > 1.2) this.decal(x, y, 'earth', pal, 8 + power * 4, 2.0);
        break;
      case 'light':
        for (let i = 0; i < this.count(n); i++)
          this.push({ x: x + rnd(-5, 5), y: y - 2, vx: rnd(-14, 14), vy: rnd(-50, -20), life: 0.9, max: 0.9, size: rnd(1, 1.6), kind: 'mote', color: pal.mid, color2: pal.core });
        if (withDecal) this.decal(x, y, 'light', pal, 6 + power * 2, 1.6);
        break;
      case 'shadow':
        for (let i = 0; i < this.count(n); i++)
          this.push({ x: x + rnd(-6, 6), y: y - 2, vx: rnd(-40, 40), vy: rnd(-14, 2), life: 0.9, max: 0.9, size: rnd(4, 7), kind: 'smoke', color: pal.smoke });
        if (withDecal) this.decal(x, y, 'shadow', pal, 8 + power * 2, 1.4);
        break;
    }
  }

  private emitBurst(kind: BaseKind, pal: FxPalette, x: number, y: number, power: number, flat: boolean): void {
    const n = this.count(8 * power);
    for (let i = 0; i < n; i++) {
      const a = flat ? Math.PI + (i / Math.max(1, n - 1)) * Math.PI + rnd(-0.1, 0.1) : (i / n) * Math.PI * 2;
      const sp = rnd(70, 170) * power;
      const vx = Math.cos(a) * sp;
      const vy = Math.sin(a) * sp * (flat ? 0.55 : 1);
      switch (kind) {
        case 'fire':
          this.push({ x, y, vx, vy: vy - 30, life: rnd(0.35, 0.6), max: 0.6, size: rnd(1.3, 2.3), kind: 'ember', color: pal.mid, color2: pal.core, drag: 2 });
          break;
        case 'water':
          this.push({ x, y, vx, vy: vy - 40, life: 0.55, max: 0.55, size: rnd(1.3, 2.2), kind: 'drop', color: pal.mid, color2: pal.core, g: 520 });
          break;
        case 'air':
          this.push({ x, y, vx: vx * 1.3, vy, life: 0.32, max: 0.32, size: rnd(8, 15), kind: 'streak', color: pal.mid, curl: 2.5 });
          break;
        case 'earth':
          this.push({ x, y, vx, vy: vy - 50, life: 0.6, max: 0.6, size: rnd(1.6, 3), kind: i % 3 === 0 ? 'shard' : 'grit', color: i % 2 ? pal.mid : pal.dark, color2: pal.core, g: 640, vr: rnd(-12, 12) });
          break;
        case 'light':
          this.push({ x, y, vx: vx * 0.6, vy: vy * 0.6 - 20, life: 0.7, max: 0.7, size: rnd(1.1, 1.8), kind: 'mote', color: pal.mid, color2: pal.core, drag: 2.5 });
          break;
        case 'shadow':
          this.push({ x, y, vx: vx * 0.7, vy: vy * 0.7, life: 0.7, max: 0.7, size: rnd(4, 7), kind: 'wisp', color: pal.dark, color2: pal.mid, drag: 3, curl: rnd(-3, 3) });
          break;
      }
    }
    if (kind === 'earth' || kind === 'water' || kind === 'shadow') {
      for (let i = 0; i < this.count(2 * power); i++)
        this.push({ x: x + rnd(-10, 10), y, vx: rnd(-40, 40), vy: rnd(-20, -5), life: 0.9, max: 0.9, size: rnd(6, 10) * power, kind: kind === 'water' ? 'mist' : 'smoke', color: kind === 'water' ? pal.mid : pal.smoke });
    }
  }

  private emitHit(kind: BaseKind, pal: FxPalette, x: number, y: number, dir: number, power: number, floorY: number): void {
    const n = this.count(9 * power);
    switch (kind) {
      case 'fire':
        for (let i = 0; i < n; i++) {
          const a = rnd(-1.2, 1.2) + (dir > 0 ? 0 : Math.PI);
          const sp = rnd(90, 260) * power;
          this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rnd(0.3, 0.6), max: 0.6, size: rnd(1.2, 2.4), kind: i % 3 === 0 ? 'spark' : 'ember', color: pal.mid, color2: pal.core, g: 140, drag: 1.5 });
        }
        for (let i = 0; i < this.count(3 * power); i++)
          this.push({ x: x + rnd(-6, 6), y: y + rnd(-6, 6), vx: dir * rnd(10, 40), vy: rnd(-40, -15), life: 0.8, max: 0.8, size: rnd(6, 10), kind: 'smoke', color: pal.smoke });
        this.ring({ x, y, r1: 26 * power, color: pal.mid, life: 0.2, max: 0.2, width: 2.5 });
        break;
      case 'water':
        for (let i = 0; i < n + 2; i++) {
          const a = -Math.PI / 2 + rnd(-1.1, 1.1) + dir * 0.4;
          const sp = rnd(110, 240) * power;
          this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6, max: 0.6, size: rnd(1.3, 2.4), kind: 'drop', color: pal.mid, color2: pal.core, g: 700 });
        }
        for (let i = 0; i < this.count(2 * power); i++)
          this.push({ x, y, vx: dir * rnd(10, 40), vy: rnd(-20, 0), life: 0.8, max: 0.8, size: rnd(8, 12), kind: 'mist', color: pal.mid });
        this.ring({ x, y, r1: 30 * power, color: pal.core, life: 0.28, max: 0.28, width: 1.5, flat: 0.45 });
        break;
      case 'air':
        for (let i = 0; i < this.count(5 * power); i++) {
          const a = rnd(-0.6, 0.6) + (dir > 0 ? 0 : Math.PI);
          this.push({ x: x - dir * 10, y: y + rnd(-14, 14), vx: Math.cos(a) * rnd(220, 360), vy: Math.sin(a) * 60, life: 0.26, max: 0.26, size: rnd(12, 22), kind: 'streak', color: pal.core, curl: rnd(-4, 4) });
        }
        this.ring({ x, y, r1: 44 * power, color: pal.mid, life: 0.22, max: 0.22, width: 1.4 });
        for (let i = 0; i < this.count(2); i++)
          this.push({ x, y, vx: dir * rnd(60, 100), vy: rnd(-10, 10), life: 0.5, max: 0.5, size: rnd(6, 9), kind: 'mist', color: pal.smoke });
        break;
      case 'earth':
        for (let i = 0; i < n + 2; i++) {
          const a = -Math.PI / 2 + rnd(-1.3, 1.3);
          const sp = rnd(120, 280) * power;
          this.push({ x, y, vx: Math.cos(a) * sp + dir * 40, vy: Math.sin(a) * sp, life: 0.7, max: 0.7, size: rnd(1.8, 3.6), kind: i % 2 ? 'shard' : 'grit', color: i % 3 ? pal.mid : pal.dark, color2: pal.core, g: 900, vr: rnd(-14, 14) });
        }
        for (let i = 0; i < this.count(3 * power); i++)
          this.push({ x: x + rnd(-14, 14), y: floorY - 4, vx: rnd(-50, 50), vy: rnd(-24, -6), life: 1.0, max: 1.0, size: rnd(8, 14), kind: 'smoke', color: pal.smoke });
        if (power >= 1) this.decal(x, floorY, 'earth', pal, 12 + power * 6, 2.2);
        break;
      case 'light':
        this.ring({ x, y, r1: 34 * power, color: pal.core, life: 0.24, max: 0.24, width: 1.3, glyphs: power >= 1.3 ? 6 : 0, spin: 2 });
        for (let i = 0; i < n; i++) {
          const a = rnd(0, Math.PI * 2);
          const sp = rnd(30, 110) * power;
          this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.8, max: 0.8, size: rnd(1.1, 2), kind: 'mote', color: pal.mid, color2: pal.core, drag: 2.5 });
        }
        this.push({ x, y, vx: 0, vy: 0, life: 0.2, max: 0.2, size: 30 * power, kind: 'spark', color: pal.core, color2: pal.core, rot: Math.PI / 2 });
        this.push({ x, y, vx: 0, vy: 0, life: 0.18, max: 0.18, size: 20 * power, kind: 'spark', color: pal.core, color2: pal.core, rot: 0 });
        break;
      case 'shadow':
        for (let i = 0; i < n; i++) {
          const a = rnd(0, Math.PI * 2);
          const d = rnd(18, 34) * power;
          this.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d * 4, vy: -Math.sin(a) * d * 4, life: 0.25, max: 0.25, size: rnd(3, 6), kind: 'wisp', color: pal.dark, color2: pal.mid, drag: 6 });
        }
        for (let i = 0; i < this.count(5 * power); i++) {
          const a = rnd(-1.4, 1.4) + (dir > 0 ? 0 : Math.PI);
          this.push({ x, y, vx: Math.cos(a) * rnd(120, 220), vy: Math.sin(a) * rnd(60, 160), life: 0.42, max: 0.42, size: rnd(10, 18), kind: 'streak', color: pal.mid, curl: rnd(-6, 6), drag: 2 });
        }
        for (let i = 0; i < this.count(3 * power); i++)
          this.push({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-20, 20), vy: rnd(-10, 10), life: 0.9, max: 0.9, size: rnd(8, 13), kind: 'smoke', color: pal.smoke });
        this.ring({ x, y, r0: 34 * power, r1: 6, color: pal.mid, life: 0.2, max: 0.2, width: 2 });
        break;
    }
  }

  private emitSwing(kind: BaseKind, pal: FxPalette, p: Player, scale: number, range: number, shape: string, tier: number): void {
    const h = p.baseH * scale;
    const cx = p.x + p.facing * 14 * scale;
    const cy = p.y - h * 0.56;
    const n = this.count(6 + tier * 2);
    for (let i = 0; i < n; i++) {
      let x: number;
      let y: number;
      let tx: number;
      let ty: number;
      if (shape === 'arc') {
        const t = i / Math.max(1, n - 1);
        const a = -Math.PI * 0.6 + t * Math.PI * 1.15;
        const r = range * scale * (1.0 + tier * 0.1);
        x = cx + Math.cos(a) * r * p.facing;
        y = cy + Math.sin(a) * r;
        tx = -Math.sin(a) * p.facing;
        ty = Math.cos(a);
      } else {
        const t = rnd(0.2, 1);
        x = p.x + p.facing * range * scale * t;
        y = cy + rnd(-4, 4);
        tx = p.facing;
        ty = 0;
      }
      const sp = rnd(40, 110);
      switch (kind) {
        case 'fire':
          this.push({ x, y, vx: tx * sp, vy: ty * sp - 50, life: 0.45, max: 0.45, size: rnd(1.2, 2.2), kind: 'ember', color: pal.mid, color2: pal.core });
          break;
        case 'water':
          this.push({ x, y, vx: tx * sp, vy: ty * sp - 20, life: 0.5, max: 0.5, size: rnd(1.2, 2), kind: 'drop', color: pal.mid, color2: pal.core, g: 600 });
          break;
        case 'air':
          this.push({ x, y, vx: tx * sp * 2.2, vy: ty * sp * 2.2, life: 0.22, max: 0.22, size: rnd(8, 14), kind: 'streak', color: pal.core, curl: rnd(-3, 3) });
          break;
        case 'earth':
          this.push({ x, y, vx: tx * sp, vy: ty * sp - 40, life: 0.55, max: 0.55, size: rnd(1.4, 2.6), kind: 'grit', color: pal.mid, g: 800, vr: rnd(-10, 10) });
          break;
        case 'light':
          this.push({ x, y, vx: tx * sp * 0.4, vy: ty * sp * 0.4 - 20, life: 0.6, max: 0.6, size: rnd(1, 1.7), kind: 'mote', color: pal.mid, color2: pal.core, drag: 2 });
          break;
        case 'shadow':
          this.push({ x, y, vx: tx * sp * 0.6, vy: ty * sp * 0.6 + 10, life: 0.6, max: 0.6, size: rnd(3, 6), kind: 'wisp', color: pal.dark, color2: pal.mid, drag: 2, curl: rnd(-2, 2) });
          break;
      }
    }
  }

  // ---- hooks -------------------------------------------------------------
  onHit(p: Player, enemy: Enemy, x: number, y: number, dir: number, opts: { heavy: boolean; crit: boolean; source: string; floorY: number }): HitFeel {
    const fx = this.fx;
    const feel: HitFeel = { shakeMul: 1, hitstopAddMs: 0, extraShake: 0 };
    this.stats.hits += 1;
    const tier = evoFxOn(fx) ? visualTier(p, fx) : 0;
    const prof = !fx || fx.affinityFx ? visualElement(p, fx) : null;
    const power = (opts.heavy ? 1.35 : 1) * (opts.crit ? 1.4 : 1);
    const melee = opts.source === 'weapon' || opts.source === 'dash' || opts.source === 'hammer_meteor';

    if (prof && (!fx || fx.attackFx)) {
      this.emitHit(prof.primary, prof.pal, x, y, dir, power, opts.floorY);
      if (prof.combined) this.emitHit(prof.secondary, prof.pal2, x, y, dir, power * 0.5, opts.floorY);
      const sm = fx ? fx.elementShakeMult : 1;
      const hm = fx ? fx.elementHitstopMult : 1;
      feel.shakeMul = Math.max(0.2, 1 + (prof.shake - 1) * sm);
      if (melee) feel.hitstopAddMs = prof.hitstopMs * hm;
    }
    if (prof && (!fx || fx.statusFx) && !enemy.dead) {
      this.statuses.set(enemy.id, { kind: prof.primary, t: 1.4, max: 1.4, pal: prof.pal });
    }

    if (tier >= 1 && melee) {
      const look = tierLook(tier);
      const glow = prof ? prof.pal.mid : look.glow;
      const core = prof ? prof.pal.core : look.glowCore;
      this.ring({ x, y, r1: 22 + tier * 12, color: glow, life: 0.24, max: 0.24, width: 1.5 + tier * 0.6, glyphs: 4 + tier * 2, spin: 3 });
      if (tier >= 2) {
        for (let i = 0; i < this.count(6 + tier * 2); i++) {
          const a = rnd(0, Math.PI * 2);
          const sp = rnd(120, 260);
          this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.4, max: 0.4, size: rnd(2, 3.4), kind: 'shard', color: look.metal, color2: core, g: 500, vr: rnd(-16, 16) });
        }
      }
      if (tier >= 3) {
        this.push({ x, y, vx: 0, vy: 0, life: 0.22, max: 0.22, size: 70, kind: 'spark', color: core, color2: core, rot: Math.PI / 2 + dir * 0.25 });
        this.ring({ x, y, r1: 70, color: core, life: 0.3, max: 0.3, width: 1.2 });
        feel.extraShake = 2.5;
        feel.hitstopAddMs += 10;
      }
    }
    return feel;
  }

  update(dt: number, p: Player, enemies: Enemy[], tuning: TuningConfig, floorY: number): void {
    const fx = tuning.fx ?? null;
    this.fx = fx;
    const scale = tuning.playerScale;
    const h = p.baseH * scale;

    if (p !== this.lastPlayer) {
      this.lastPlayer = p;
      this.prevOnGround = p.onGround;
      this.prevVy = p.vy;
      this.prevAirJumps = p.airJumpsRemaining;
      this.prevDash = false;
      this.prevAttack = p.attackState;
      this.prevX = p.x;
      this.lastTier = realTier(p);
      this.trail.length = 0;
    }

    // ---- Weapon evolution tier-up moment ----
    const tierNow = realTier(p);
    if (tierNow > this.lastTier) {
      const prev = this.lastTier;
      this.lastTier = tierNow;
      this.stats.tierUps += 1;
      const moment = !fx || (fx.tierUpMoment && fx.weaponEvoFx);
      this.host.onWeaponTierUp(tierNow, prev, moment);
      if (moment) this.startTierUp(p, scale, tierNow);
    } else if (tierNow < this.lastTier) {
      this.lastTier = tierNow;
    }

    const prof = !fx || fx.affinityFx ? visualElement(p, fx) : null;
    const moveOn = !fx || fx.movementFx;
    const speed = Math.abs(p.vx);
    const dashing = DASH_KEYS.some((k) => (p[k] as number) > 0) || p.minstrelZipActive || p.hammerLeapState !== 'none';

    if (prof && moveOn) {
      const kind = prof.primary;
      const pal = prof.pal;
      const alt = () => (prof.combined && Math.random() < 0.45 ? { k: prof.secondary, pl: prof.pal2 } : { k: kind, pl: pal });

      if (p.onGround && speed > 50) {
        this.stride += Math.abs(p.x - this.prevX);
        if (this.stride >= 30 * scale) {
          this.stride = 0;
          this.stepFoot ^= 1;
          this.stats.steps += 1;
          const a = alt();
          this.emitGround(a.k, a.pl, p.x + (this.stepFoot ? 5 : -5) * scale, p.y, p.vx >= 0 ? 1 : -1, Math.min(1.4, 0.6 + speed / 400), true);
        }
      } else {
        this.stride = 0;
      }

      if (this.prevOnGround && !p.onGround && p.vy < -150) {
        this.stats.jumps += 1;
        const a = alt();
        this.emitGround(a.k, a.pl, p.x, p.y, p.facing, 1.1, false);
        this.ring({ x: p.x, y: p.y, r1: 22, color: pal.mid, life: 0.22, max: 0.22, width: 1.3, flat: 0.3 });
      }
      if (!p.onGround && p.airJumpsRemaining < this.prevAirJumps && p.vy < -100) {
        this.stats.doubleJumps += 1;
        this.emitBurst(kind, pal, p.x, p.y - 4, 1.1, false);
        if (prof.combined) this.emitBurst(prof.secondary, prof.pal2, p.x, p.y - 4, 0.6, false);
        this.ring({ x: p.x, y: p.y - 2, r1: 34, color: pal.mid, life: 0.3, max: 0.3, width: 2, flat: 0.35, glyphs: 6, spin: 4 });
      }
      if (!this.prevOnGround && p.onGround && this.prevVy > 260) {
        this.stats.lands += 1;
        const pw = Math.min(2, 0.6 + (this.prevVy - 260) / 500);
        this.emitBurst(kind, pal, p.x, p.y - 2, pw, true);
        this.emitGround(kind, pal, p.x, p.y, p.facing, pw, true);
        if (pw > 1.1) this.ring({ x: p.x, y: p.y, r1: 30 + pw * 22, color: pal.mid, life: 0.3, max: 0.3, width: 2, flat: 0.22 });
      }
      if (dashing && !this.prevDash) {
        this.stats.dashes += 1;
        this.emitBurst(kind, pal, p.x, p.y - h * 0.5, 1.2, false);
        if (prof.combined) this.emitBurst(prof.secondary, prof.pal2, p.x, p.y - h * 0.5, 0.6, false);
        this.ring({ x: p.x, y: p.y - h * 0.5, r1: 40, color: pal.mid, life: 0.22, max: 0.22, width: 1.6, flat: 0.8 });
      }
      if (dashing) {
        const n = this.count(dt * 60);
        for (let i = 0; i < n; i++) {
          const a = alt();
          this.emitBody(a.k, a.pl, p.x, p.y, h, true);
        }
      }
      if (!fx || fx.runAura) {
        const rate = (speed > 60 ? 16 : 4) * (1 + Math.min(0.6, p.elementResonance * 0.15)) * (prof.combined ? 1.2 : 1);
        this.emitAcc += dt * rate * this.intensity;
        while (this.emitAcc >= 1) {
          this.emitAcc -= 1;
          const a = alt();
          this.emitBody(a.k, a.pl, p.x, p.y, h, speed > 60);
        }
      }
    }

    // Wake trail
    const trailMul = fx ? fx.trailLength : 1;
    if (prof && moveOn && trailMul > 0 && (dashing || speed > 230 || (!p.onGround && speed > 160))) {
      this.trail.push({ x: p.x, y: p.y - h * 0.5, life: 0.22 * trailMul + (dashing ? 0.12 : 0) });
      if (this.trail.length > 24) this.trail.shift();
    }
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    // Swing start
    if (p.attackState === 'active' && this.prevAttack !== 'active') {
      this.stats.swings += 1;
      if (prof && (!fx || fx.attackFx)) {
        const tier = evoFxOn(fx) ? visualTier(p, fx) : 0;
        const shape = weaponSwingShape(p.attackWeapon);
        const range = tuning.attackRange * (shape === 'fist' ? 0.6 : 1);
        this.emitSwing(prof.primary, prof.pal, p, scale, range, shape, tier);
        if (prof.combined) this.emitSwing(prof.secondary, prof.pal2, p, scale, range, shape, 0);
      }
    }

    // Evolved weapon at rest smoulders (tier 2+)
    const vt = evoFxOn(fx) ? visualTier(p, fx) : 0;
    if (vt >= 2 && p.attackState === 'idle') {
      this.weaponAcc += dt * (vt >= 3 ? 7 : 4) * this.intensity;
      while (this.weaponAcc >= 1) {
        this.weaponAcc -= 1;
        const look = tierLook(vt);
        const c = prof ? prof.pal : { mid: look.glow, core: look.glowCore, smoke: '#1a1416', dark: '#120d12' };
        const wx = p.x + p.facing * rnd(6, 18) * scale;
        const wy = p.y - h * rnd(0.25, 0.6);
        if (Math.random() < 0.6) this.push({ x: wx, y: wy, vx: rnd(-6, 6), vy: rnd(-40, -18), life: 0.7, max: 0.7, size: rnd(1, 1.7), kind: 'ember', color: c.mid, color2: c.core });
        else this.push({ x: wx, y: wy, vx: rnd(-5, 5), vy: rnd(-22, -10), life: 0.9, max: 0.9, size: rnd(3, 5), kind: 'smoke', color: c.smoke });
      }
    }

    // Statuses
    for (const [id, st] of this.statuses) {
      st.t -= dt;
      if (st.t <= 0) this.statuses.delete(id);
    }
    if (!fx || fx.statusFx) {
      const rate = this.intensity;
      const es = tuning.enemyScale;
      for (const e of enemies) {
        if (e.dead) {
          this.statuses.delete(e.id);
          continue;
        }
        const eh = e.baseH * es;
        const ew = e.baseW * es;
        if (e.burnTimer > 0 && Math.random() < dt * 22 * rate) {
          const pl = BASE_FEEL.fire.pal;
          this.push({ x: e.x + rnd(-0.3, 0.3) * ew, y: e.y - rnd(0.1, 0.8) * eh, vx: rnd(-10, 10), vy: rnd(-80, -40), life: 0.5, max: 0.5, size: rnd(1.2, 2.2), kind: 'ember', color: pl.mid, color2: pl.core });
          if (Math.random() < 0.3) this.push({ x: e.x, y: e.y - eh * 0.8, vx: rnd(-8, 8), vy: rnd(-30, -15), life: 0.9, max: 0.9, size: rnd(5, 8), kind: 'smoke', color: pl.smoke });
        }
        if ((e.chillTimer ?? 0) > 0 && Math.random() < dt * 8 * rate) {
          const pl = BASE_FEEL.water.pal;
          this.push({ x: e.x + rnd(-0.3, 0.3) * ew, y: e.y - rnd(0.2, 0.9) * eh, vx: rnd(-4, 4), vy: rnd(5, 20), life: 0.8, max: 0.8, size: rnd(1.2, 2), kind: 'flake', color: pl.core, g: 40 });
        }
        const st = this.statuses.get(e.id);
        if (st && st.kind === 'shadow' && Math.random() < dt * 10 * rate) {
          this.push({ x: e.x + rnd(-12, 12), y: e.y - rnd(0, 0.4) * eh, vx: rnd(-6, 6), vy: rnd(-30, -10), life: 0.7, max: 0.7, size: rnd(3, 5), kind: 'wisp', color: st.pal.dark, color2: st.pal.mid, curl: rnd(-3, 3) });
        }
      }
    }

    // Integrate
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (q.curl) {
        const c = Math.cos(q.curl * dt);
        const s = Math.sin(q.curl * dt);
        const vx = q.vx * c - q.vy * s;
        q.vy = q.vx * s + q.vy * c;
        q.vx = vx;
      }
      if (q.drag) {
        const d = Math.max(0, 1 - q.drag * dt);
        q.vx *= d;
        q.vy *= d;
      }
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.rot += q.vr * dt;
      if ((q.kind === 'grit' || q.kind === 'shard' || q.kind === 'drop') && q.y > floorY && q.vy > 0 && q.y - floorY < 40) {
        q.y = floorY;
        q.vy *= -0.25;
        q.vx *= 0.5;
        if (q.kind === 'drop') q.life = Math.min(q.life, 0.06);
      }
    }
    this.stats.peak = Math.max(this.stats.peak, this.particles.length);

    for (let i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].life -= dt;
      if (this.decals[i].life <= 0) this.decals.splice(i, 1);
    }
    if (this.tierUp) {
      this.tierUp.t -= dt;
      if (this.tierUp.t <= 0) this.tierUp = null;
    }

    this.prevOnGround = p.onGround;
    this.prevVy = p.vy;
    this.prevAirJumps = p.airJumpsRemaining;
    this.prevDash = dashing;
    this.prevAttack = p.attackState;
    this.prevX = p.x;
  }

  private startTierUp(p: Player, scale: number, tier: number): void {
    const prof = visualElement(p, this.fx);
    const look = tierLook(tier);
    const glow = prof ? prof.pal.mid : look.glow;
    const core = prof ? prof.pal.core : look.glowCore;
    this.tierUp = { t: 1.4, max: 1.4, tier, glow, core };
    const h = p.baseH * scale;
    for (let i = 0; i < 26 + tier * 8; i++) {
      const a = -Math.PI / 2 + rnd(-0.9, 0.9);
      const sp = rnd(160, 360);
      this.push({ x: p.x + p.facing * 10, y: p.y - h * 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(0.5, 0.9), max: 0.9, size: rnd(1.2, 2.4), kind: i % 4 === 0 ? 'shard' : 'spark', color: i % 4 === 0 ? look.metal : glow, color2: core, g: 520, vr: rnd(-12, 12) });
    }
    for (let i = 0; i < 6; i++)
      this.push({ x: p.x + rnd(-14, 14), y: p.y - 4, vx: rnd(-40, 40), vy: rnd(-30, -10), life: 1.2, max: 1.2, size: rnd(9, 14), kind: 'smoke', color: '#1b1518' });
    this.ring({ x: p.x, y: p.y - 2, r1: 90 + tier * 20, color: glow, life: 0.6, max: 0.6, width: 2.2, flat: 0.28, glyphs: 8 + tier * 2, spin: 1.5 });
    this.ring({ x: p.x, y: p.y - h * 0.5, r1: 70 + tier * 16, color: core, life: 0.35, max: 0.35, width: 1.4 });
  }
}

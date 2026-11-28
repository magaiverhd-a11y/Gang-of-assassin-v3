// ============================================================================
// AFFINITY FX (affinity-v1)
// Grim, weighty elemental effects for every hero: movement (steps, jumps,
// landings, dashes, wake, body aura), attacks (swing trails, hit sparks,
// impact feel), status visuals on foes, and weapon-evolution tier visuals.
// Visual only — nothing here changes damage or power.
// ============================================================================
import {
  BASE_ELEMENT_ORDER,
  BASE_ELEMENTS,
  COMBINED_ELEMENTS,
  getActiveElementDef,
  getEvolutionTierName,
  WEAPONS,
} from './defaults';
import type {
  BaseElementId,
  CombinedElementId,
  ElementId,
  Enemy,
  FxTuning,
  Player,
  TuningConfig,
  WeaponId,
} from './types';

export const FX_ELEMENT_ORDER: ElementId[] = [
  ...BASE_ELEMENT_ORDER,
  ...(Object.keys(COMBINED_ELEMENTS) as CombinedElementId[]),
];

export function fxElementLabel(id: ElementId): string {
  const def = (BASE_ELEMENTS as Record<string, { name: string }>)[id] ?? (COMBINED_ELEMENTS as Record<string, { name: string }>)[id];
  return def ? def.name : id;
}

export interface FxPalette {
  core: string;
  mid: string;
  dark: string;
  smoke: string;
}

type BaseKind = BaseElementId;

interface BaseFeel {
  pal: FxPalette;
  shake: number;
  hitstopMs: number;
  look: string;
}

const BASE_FEEL: Record<BaseKind, BaseFeel> = {
  fire: {
    pal: { core: '#ffd8a0', mid: '#d4612a', dark: '#6e1d0c', smoke: '#2a1f1b' },
    shake: 1.15,
    hitstopMs: 8,
    look: 'Rising embers and char smoke, scorched footprints, burning wake; hits burst into embers and leave foes smouldering.',
  },
  water: {
    pal: { core: '#d7ecf2', mid: '#4b8aa6', dark: '#173548', smoke: '#2b3b45' },
    shake: 0.9,
    hitstopMs: 4,
    look: 'Dripping water and cold mist, wet footprints with ripples; hits splash and frost foes with rime.',
  },
  air: {
    pal: { core: '#eef4f1', mid: '#93b5ab', dark: '#3a524d', smoke: '#5d6b67' },
    shake: 0.7,
    hitstopMs: 0,
    look: 'Grey wind streaks and swept dust, a fast pale wake; hits are quick gust slashes that stagger foes with a wind spiral.',
  },
  earth: {
    pal: { core: '#e6cfa1', mid: '#8a6a3e', dark: '#33251a', smoke: '#4d4236' },
    shake: 1.55,
    hitstopMs: 18,
    look: 'Heavy grit and dust clouds, cracked footprints and big landing quakes; hits throw rock shards, crack the floor and daze foes.',
  },
  light: {
    pal: { core: '#fff3d6', mid: '#cfae5c', dark: '#5e4a1e', smoke: '#3b3527' },
    shake: 1.0,
    hitstopMs: 10,
    look: 'Slow pale-gold motes and faint glowing sigil footprints; hits flash a thin holy gleam and brand foes with a burning sigil.',
  },
  shadow: {
    pal: { core: '#c7b3e2', mid: '#583e82', dark: '#160d22', smoke: '#100a17' },
    shake: 0.95,
    hitstopMs: 14,
    look: 'Sinking shade wisps and black smoke pooling at the feet; hits implode with dark tendrils that cling to foes (wither).',
  },
};

export interface FxProfile {
  id: ElementId;
  name: string;
  pal: FxPalette;
  pal2: FxPalette;
  primary: BaseKind;
  secondary: BaseKind;
  combined: boolean;
  shake: number;
  hitstopMs: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Desaturate + darken toward a cold charcoal so neon UI colours read as dark fantasy. */
function mute(hex: string, desat = 0.35, darken = 0.18): string {
  const [r, g, b] = hexToRgb(hex);
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  const dr = r + (l - r) * desat;
  const dg = g + (l - g) * desat;
  const db = b + (l - b) * desat;
  return toHex(dr * (1 - darken) + 20 * darken, dg * (1 - darken) + 18 * darken, db * (1 - darken) + 24 * darken);
}

const rgbaCache = new Map<string, string>();
export function rgba(hex: string, a: number): string {
  const aa = Math.max(0, Math.min(1, a));
  const key = `${hex}|${aa.toFixed(2)}`;
  let v = rgbaCache.get(key);
  if (!v) {
    const [r, g, b] = hexToRgb(hex);
    v = `rgba(${r},${g},${b},${aa.toFixed(2)})`;
    if (rgbaCache.size > 4000) rgbaCache.clear();
    rgbaCache.set(key, v);
  }
  return v;
}

const profileCache = new Map<ElementId, FxProfile>();

export function getFxProfile(id: ElementId): FxProfile {
  const cached = profileCache.get(id);
  if (cached) return cached;
  let prof: FxProfile;
  if ((BASE_ELEMENTS as Record<string, unknown>)[id]) {
    const k = id as BaseKind;
    const f = BASE_FEEL[k];
    prof = { id, name: BASE_ELEMENTS[k].name, pal: f.pal, pal2: f.pal, primary: k, secondary: k, combined: false, shake: f.shake, hitstopMs: f.hitstopMs };
  } else {
    const def = COMBINED_ELEMENTS[id as CombinedElementId];
    const [a, b] = (def.parents ?? ['fire', 'shadow']) as [BaseKind, BaseKind];
    const fa = BASE_FEEL[a];
    const fb = BASE_FEEL[b];
    prof = {
      id,
      name: def.name,
      pal: {
        core: mute(def.glowColor, 0.25, 0.04),
        mid: mute(def.primaryColor, 0.35, 0.16),
        dark: mute(def.secondaryColor, 0.45, 0.62),
        smoke: fa.pal.smoke,
      },
      pal2: fb.pal,
      primary: a,
      secondary: b,
      combined: true,
      shake: (fa.shake + fb.shake) * 0.5 + 0.1,
      hitstopMs: Math.max(fa.hitstopMs, fb.hitstopMs),
    };
  }
  profileCache.set(id, prof);
  return prof;
}

export function describeElementFx(id: ElementId): string {
  const p = getFxProfile(id);
  if (!p.combined) return BASE_FEEL[p.primary].look;
  return `Mix of ${BASE_ELEMENTS[p.primary].name} (main) and ${BASE_ELEMENTS[p.secondary].name} effects in ${p.name} colours.`;
}

// ---------------------------------------------------------------------------
// Weapon evolution tier palettes
// ---------------------------------------------------------------------------
export interface TierLook {
  tier: number;
  name: string;
  metal: string;
  metalEdge: string;
  glow: string;
  glowCore: string;
}

export const TIER_LOOKS: TierLook[] = [
  { tier: 0, name: 'Base', metal: '#cbd5e1', metalEdge: '#f8fafc', glow: '#94a3b8', glowCore: '#e2e8f0' },
  { tier: 1, name: 'Awakened', metal: '#9aa3ad', metalEdge: '#e9dcc3', glow: '#c98a3e', glowCore: '#ffd9a1' },
  { tier: 2, name: 'Mythic', metal: '#4a3f45', metalEdge: '#d9a07a', glow: '#a8323a', glowCore: '#ffb39a' },
  { tier: 3, name: 'Transcendent', metal: '#211c26', metalEdge: '#cfd6e6', glow: '#8f86c9', glowCore: '#f1eeff' },
];

export function tierLook(tier: number): TierLook {
  return TIER_LOOKS[Math.max(0, Math.min(3, tier))];
}

// ---------------------------------------------------------------------------
// Per-frame render context (set by the renderer before drawing)
// ---------------------------------------------------------------------------
interface RenderCtx {
  fx: FxTuning | null;
  time: number;
  mobile: boolean;
}
const RC: RenderCtx = { fx: null, time: 0, mobile: false };

export function setFxRenderContext(fx: FxTuning | undefined, time: number, mobile: boolean): void {
  RC.fx = fx ?? null;
  RC.time = time;
  RC.mobile = mobile;
}

export function getRenderFx(): FxTuning | null {
  return RC.fx;
}

export function isMobileRender(): boolean {
  return RC.mobile;
}

export function fxTime(): number {
  return RC.time;
}

export function visualElement(p: Player, fx: FxTuning | null = RC.fx): FxProfile | null {
  if (fx && fx.previewElement > 0) {
    const id = FX_ELEMENT_ORDER[Math.round(fx.previewElement) - 1];
    if (id) return getFxProfile(id);
  }
  const def = getActiveElementDef(p.baseElements, p.combinedElement);
  return def ? getFxProfile(def.id) : null;
}

export function realTier(p: Player): number {
  return Math.floor(Math.max(0, p.weaponDamageBonus) / 5);
}

export function visualTier(p: Player, fx: FxTuning | null = RC.fx): number {
  if (fx && fx.previewEvoTier > 0) return Math.round(fx.previewEvoTier) - 1;
  return realTier(p);
}

export function evoFxOn(fx: FxTuning | null = RC.fx): boolean {
  return !fx || fx.weaponEvoFx;
}

export function evoGlow(fx: FxTuning | null = RC.fx): number {
  return fx ? fx.weaponEvoGlow : 1;
}

function affinityOn(fx: FxTuning | null = RC.fx): boolean {
  return !fx || fx.affinityFx;
}

export function affinityFxEnabled(): boolean {
  return affinityOn();
}

/** Glow / core colours for an evolved weapon: affinity colours if any, else the tier's own. */
export function evoColors(p: Player): { glow: string; core: string; dark: string; look: TierLook; tier: number } {
  const tier = evoFxOn() ? visualTier(p) : 0;
  const look = tierLook(tier);
  const el = affinityOn() ? visualElement(p) : null;
  if (el && tier >= 1) return { glow: el.pal.mid, core: el.pal.core, dark: el.pal.dark, look, tier };
  return { glow: look.glow, core: look.glowCore, dark: '#120d12', look, tier };
}

// ---------------------------------------------------------------------------
// Rune glyphs
// ---------------------------------------------------------------------------
const GLYPHS: number[][][] = [
  [[0, -1, 0, 1], [-0.6, -0.4, 0.6, 0.2]],
  [[-0.6, -1, 0.6, 1], [0.6, -1, -0.6, 1], [-0.7, 0, 0.7, 0]],
  [[0, -1, 0, 1], [0, -1, 0.6, -0.4], [0, 0, -0.6, 0.5]],
  [[-0.6, 1, 0, -1], [0, -1, 0.6, 1], [-0.35, 0.2, 0.35, 0.2]],
  [[-0.5, -1, -0.5, 1], [-0.5, -0.2, 0.5, -0.8], [-0.5, -0.2, 0.5, 0.6]],
  [[0, -1, 0.6, 0], [0.6, 0, 0, 1], [0, 1, -0.6, 0], [-0.6, 0, 0, -1]],
];

export function drawGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, idx: number, color: string, lw = 1.2): void {
  const g = GLYPHS[Math.abs(Math.floor(idx)) % GLYPHS.length];
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (const s of g) {
    ctx.moveTo(x + s[0] * size, y + s[1] * size);
    ctx.lineTo(x + s[2] * size, y + s[3] * size);
  }
  ctx.stroke();
}

export function weaponSwingShape(w: WeaponId): 'arc' | 'line' | 'lash' | 'cast' | 'fist' {
  switch (w) {
    case 'sword':
    case 'katana':
    case 'greataxe':
    case 'naginata':
    case 'hammer':
      return 'arc';
    case 'rapier':
    case 'shadow_daggers':
      return 'line';
    case 'whip':
    case 'ribbon_whip':
    case 'silk_whip':
      return 'lash';
    case 'spire_staff':
      return 'cast';
    case 'ash_wraps':
      return 'fist';
  }
  return 'arc';
}

export function weaponDisplayName(w: WeaponId): string {
  return WEAPONS[w]?.name ?? w;
}

export function tierName(t: number): string {
  return getEvolutionTierName(t);
}

export { BASE_FEEL };
export type { BaseKind };

// In-hand weapon evolution visuals (Awakened / Mythic / Transcendent). (affinity-v1)
// Drawn in the weapon's local space (hand at origin, weapon pointing +y) after the base weapon.
import { drawGlyph, evoColors, evoGlow, fxTime, rgba, TierLook } from './affinityFx';
import type { Player, WeaponId } from './types';

export interface HeldEvo {
  tier: number;
  glow: string;
  core: string;
  dark: string;
  look: TierLook;
  time: number;
  glowMul: number;
}

let CUR: HeldEvo | null = null;

export function setHeldEvo(p: Player | null): void {
  if (!p) {
    CUR = null;
    return;
  }
  const c = evoColors(p);
  CUR = c.tier > 0 ? { tier: c.tier, glow: c.glow, core: c.core, dark: c.dark, look: c.look, time: fxTime(), glowMul: evoGlow() } : null;
}

export function heldEvo(): HeldEvo | null {
  return CUR;
}

/** Size growth of the held weapon per tier. */
export function heldScale(): number {
  return CUR ? 1 + CUR.tier * 0.09 : 1;
}

type Pt = [number, number];

function spineOf(weapon: WeaponId): { pts: Pt[]; w: number } | null {
  switch (weapon) {
    case 'sword':
      return { pts: [[0, 3], [0, 11], [0, 20]], w: 3 };
    case 'katana':
      return { pts: [[0, 6], [2.2, 12], [2.8, 18], [1.5, 25]], w: 2.2 };
    case 'rapier':
      return { pts: [[0, 6], [0, 16], [0, 26]], w: 1.7 };
    case 'shadow_daggers':
      return { pts: [[0, 3.6], [0.3, 8.5], [0.1, 14]], w: 1.7 };
    case 'naginata':
      return { pts: [[-0.5, 18], [2, 23], [2, 28], [0.5, 32]], w: 2.6 };
    default:
      return null;
  }
}

function headOf(weapon: WeaponId): { poly: Pt[]; c: Pt; out: Pt } | null {
  switch (weapon) {
    case 'greataxe':
      return { poly: [[-1, 12], [7, 12.5], [12, 16], [11, 24], [-1, 22]], c: [5, 18], out: [1, 0] };
    case 'hammer':
      return { poly: [[-6.5, 14], [6.5, 14], [6.5, 22], [-6.5, 22]], c: [0, 18], out: [0, 1] };
    default:
      return null;
  }
}

function strokePts(ctx: CanvasRenderingContext2D, pts: Pt[], s: number, ox = 0): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo((p[0] + ox) * s, p[1] * s) : ctx.lineTo((p[0] + ox) * s, p[1] * s)));
  ctx.stroke();
}

function along(pts: Pt[], t: number): Pt {
  const n = pts.length - 1;
  const f = Math.max(0, Math.min(0.9999, t)) * n;
  const i = Math.floor(f);
  const r = f - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
}

function halo(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, a: number): void {
  const g = ctx.createRadialGradient(x, y, 0.5, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function orbitGlyphs(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, s: number, ev: HeldEvo, n = 3): void {
  for (let i = 0; i < n; i++) {
    const a = ev.time * 2.2 + (i / n) * Math.PI * 2;
    drawGlyph(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1.8 * s, i + 2, ev.core, Math.max(0.8, 0.5 * s));
  }
}

/** Overlay for a held weapon. `s` = final scale used for the base weapon. */
export function drawHeldWeaponEvo(ctx: CanvasRenderingContext2D, weapon: WeaponId, s: number): void {
  const ev = CUR;
  if (!ev) return;
  const t = ev.tier;
  const gm = ev.glowMul;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const sp = spineOf(weapon);
  if (sp) {
    const { pts, w } = sp;
    const tip = pts[pts.length - 1];
    if (t >= 2) {
      // reforged blade: darker metal, broader
      ctx.strokeStyle = ev.look.metal;
      ctx.lineWidth = w * (t >= 3 ? 1.6 : 1.3) * s;
      strokePts(ctx, pts, s);
      // serrated back edge
      ctx.fillStyle = ev.look.metal;
      ctx.strokeStyle = rgba(ev.glow, 0.8);
      ctx.lineWidth = Math.max(0.6, 0.35 * s);
      for (let i = 1; i <= 4; i++) {
        const a = along(pts, i / 5.2);
        const b = along(pts, i / 5.2 + 0.08);
        ctx.beginPath();
        ctx.moveTo((a[0] - w * 0.6) * s, a[1] * s);
        ctx.lineTo((a[0] - w * 0.6 - 2.4) * s, (a[1] + 1.6) * s);
        ctx.lineTo((b[0] - w * 0.6) * s, b[1] * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // wider crossguard wings
      const g0 = pts[0];
      ctx.strokeStyle = ev.look.metalEdge;
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath();
      ctx.moveTo((g0[0] - 5.5) * s, (g0[1] - 2.5) * s);
      ctx.quadraticCurveTo(g0[0] * s, (g0[1] + 0.5) * s, (g0[0] + 5.5) * s, (g0[1] - 2.5) * s);
      ctx.stroke();
    }
    // edge highlight
    ctx.strokeStyle = t >= 3 ? ev.core : ev.look.metalEdge;
    ctx.globalAlpha = t >= 3 ? 0.9 : 0.75;
    ctx.lineWidth = Math.max(0.6, 0.45 * s);
    strokePts(ctx, pts, s, w * 0.45);
    ctx.globalAlpha = 1;
    if (t >= 3) {
      // glowing fissure down the black blade
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = ev.core;
      ctx.lineWidth = Math.max(0.7, 0.55 * s);
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const p = along(pts, i / 10);
        const j = (i % 2 ? 0.6 : -0.6) * w * 0.4;
        if (i === 0) ctx.moveTo((p[0] + j) * s, p[1] * s);
        else ctx.lineTo((p[0] + j) * s, p[1] * s);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    // runes along the blade
    const nR = t >= 2 ? 3 : 2;
    for (let i = 0; i < nR; i++) {
      const p = along(pts, 0.25 + i * 0.22);
      drawGlyph(ctx, p[0] * s, p[1] * s, 1.2 * s, i + t, t >= 2 ? ev.core : ev.glow, Math.max(0.6, 0.35 * s));
    }
    ctx.globalCompositeOperation = 'lighter';
    halo(ctx, tip[0] * s, tip[1] * s, (5 + t * 3) * s, ev.glow, Math.min(0.9, 0.3 * t * gm));
    if (t >= 3) {
      const mid = along(pts, 0.55);
      halo(ctx, mid[0] * s, mid[1] * s, 12 * s, ev.glow, 0.22 * gm);
      ctx.globalCompositeOperation = 'source-over';
      orbitGlyphs(ctx, mid[0] * s, mid[1] * s, 7 * s, 3.5 * s, s, ev);
    }
    ctx.restore();
    return;
  }

  const hd = headOf(weapon);
  if (hd) {
    const { poly, c, out } = hd;
    if (t >= 2) {
      ctx.fillStyle = ev.look.metal;
      ctx.beginPath();
      poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0] * s, p[1] * s) : ctx.lineTo(p[0] * s, p[1] * s)));
      ctx.closePath();
      ctx.fill();
      if (weapon === 'greataxe') {
        // second bit: double-headed war axe
        ctx.beginPath();
        poly.forEach((p, i) => (i === 0 ? ctx.moveTo(-p[0] * s * 0.8, p[1] * s) : ctx.lineTo(-p[0] * s * 0.8, p[1] * s)));
        ctx.closePath();
        ctx.fill();
      }
      // spikes
      ctx.fillStyle = ev.look.metalEdge;
      const spikes: [Pt, Pt][] =
        weapon === 'hammer'
          ? [[[-4, 22], [0, 1]], [[0, 22], [0, 1]], [[4, 22], [0, 1]], [[-6.5, 18], [-1, 0]], [[6.5, 18], [1, 0]]]
          : [[[3, 12.2], [0, -1]], [[0, 22.5], [0, 1]], [[-1, 17], [-1, 0]]];
      for (const [p, d] of spikes) {
        ctx.beginPath();
        ctx.moveTo((p[0] - d[1] * 1.2) * s, (p[1] - d[0] * 1.2) * s);
        ctx.lineTo((p[0] + d[0] * 3.2) * s, (p[1] + d[1] * 3.2) * s);
        ctx.lineTo((p[0] + d[1] * 1.2) * s, (p[1] + d[0] * 1.2) * s);
        ctx.fill();
      }
    }
    // glowing edge
    ctx.strokeStyle = t >= 3 ? ev.core : ev.glow;
    ctx.lineWidth = Math.max(0.8, (0.5 + t * 0.25) * s);
    ctx.beginPath();
    poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0] * s, p[1] * s) : ctx.lineTo(p[0] * s, p[1] * s)));
    ctx.closePath();
    ctx.stroke();
    drawGlyph(ctx, c[0] * s, c[1] * s, 2.2 * s, t, ev.core, Math.max(0.7, 0.45 * s));
    if (t >= 3) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = ev.core;
      ctx.lineWidth = Math.max(0.7, 0.5 * s);
      ctx.beginPath();
      ctx.moveTo((c[0] - 3) * s, (c[1] - 3) * s);
      ctx.lineTo((c[0] + 0.5) * s, (c[1] - 0.5) * s);
      ctx.lineTo((c[0] - 1) * s, (c[1] + 1) * s);
      ctx.lineTo((c[0] + 3) * s, (c[1] + 3.5) * s);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
    halo(ctx, (c[0] + out[0] * 4) * s, (c[1] + out[1] * 4) * s, (7 + t * 3) * s, ev.glow, Math.min(0.9, 0.28 * t * gm));
    ctx.globalCompositeOperation = 'source-over';
    if (t >= 3) orbitGlyphs(ctx, c[0] * s, c[1] * s, 11 * s, 5 * s, s, ev);
    ctx.restore();
    return;
  }

  if (weapon === 'whip' || weapon === 'ribbon_whip' || weapon === 'silk_whip') {
    const ribbon = weapon !== 'whip';
    // dangling evolved tail with barbs
    const tail: Pt[] = ribbon ? [[0, 8], [-3, 12], [2, 15], [-3, 18], [-1, 20 + t]] : [[1, 12], [2.5, 14.5], [0.5, 17], [1.5, 19 + t]];
    ctx.strokeStyle = t >= 3 ? ev.dark : t >= 2 ? ev.look.metal : ev.glow;
    ctx.lineWidth = (ribbon ? 1.6 : 1.3) * s;
    strokePts(ctx, tail, s);
    ctx.strokeStyle = ev.glow;
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = Math.max(0.5, 0.4 * s);
    strokePts(ctx, tail, s, 0.7);
    ctx.globalAlpha = 1;
    if (t >= 2) {
      ctx.fillStyle = ev.look.metalEdge;
      for (let i = 1; i < tail.length; i++) {
        const p = tail[i];
        ctx.beginPath();
        ctx.moveTo((p[0] - 1) * s, p[1] * s);
        ctx.lineTo((p[0] + 1.8) * s, (p[1] - 1.8) * s);
        ctx.lineTo((p[0] + 0.6) * s, (p[1] + 1) * s);
        ctx.fill();
      }
      // blade tip
      const e = tail[tail.length - 1];
      ctx.beginPath();
      ctx.moveTo((e[0] - 1.6) * s, e[1] * s);
      ctx.lineTo(e[0] * s, (e[1] + 4.5) * s);
      ctx.lineTo((e[0] + 1.6) * s, e[1] * s);
      ctx.fill();
    }
    drawGlyph(ctx, 0, 4 * s, 1.5 * s, t, ev.core, Math.max(0.6, 0.4 * s));
    ctx.globalCompositeOperation = 'lighter';
    const e = tail[tail.length - 1];
    halo(ctx, e[0] * s, e[1] * s, (4 + t * 3) * s, ev.glow, Math.min(0.9, 0.3 * t * gm));
    if (t >= 3) {
      // spectral second lash
      ctx.strokeStyle = rgba(ev.core, 0.55);
      ctx.lineWidth = Math.max(0.6, 0.6 * s);
      const sw = Math.sin(ev.time * 6) * 2;
      strokePts(ctx, tail.map(([x, y]) => [x * -0.8 + sw, y + 1] as Pt), s);
      ctx.globalCompositeOperation = 'source-over';
      orbitGlyphs(ctx, 0, 14 * s, 7 * s, 4 * s, s, ev);
    }
    ctx.restore();
    return;
  }
  ctx.restore();
}

/** Brute's upright hammer (head toward -y). */
export function drawBruteHammerEvo(ctx: CanvasRenderingContext2D, s: number): void {
  if (!CUR) return;
  ctx.save();
  ctx.scale(20 / 13, -1.45);
  drawHeldWeaponEvo(ctx, 'hammer', s);
  ctx.restore();
}

/** Monk fists: rune wraps → spiked iron knuckles → burning gauntlet. */
export function drawFistEvo(ctx: CanvasRenderingContext2D, hx: number, hy: number, ex: number, ey: number, scale: number): void {
  const ev = CUR;
  if (!ev) return;
  const t = ev.tier;
  const s = scale;
  ctx.save();
  ctx.lineCap = 'round';
  // runes on the forearm wraps
  const mx = (hx + ex) / 2;
  const my = (hy + ey) / 2;
  drawGlyph(ctx, mx, my, 2.2 * s, t, t >= 2 ? ev.core : ev.glow, Math.max(0.8, 0.6 * s));
  if (t >= 2) {
    // iron knuckle band + spikes
    const ang = Math.atan2(hy - ey, hx - ex);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(ang);
    ctx.fillStyle = ev.look.metal;
    ctx.fillRect(-2 * s, -5 * s, 4 * s, 10 * s);
    ctx.fillStyle = ev.look.metalEdge;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(2 * s, (i * 3.2 - 1.3) * s);
      ctx.lineTo(6.5 * s, i * 3.2 * s);
      ctx.lineTo(2 * s, (i * 3.2 + 1.3) * s);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = ev.look.metal;
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(ex + (hx - ex) * 0.7, ey + (hy - ey) * 0.7 - 3 * s);
    ctx.lineTo(ex + (hx - ex) * 0.7, ey + (hy - ey) * 0.7 + 3 * s);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  halo(ctx, hx, hy, (7 + t * 4) * s, ev.glow, Math.min(0.9, 0.35 * t * ev.glowMul));
  if (t >= 3) {
    // gauntlet of flame: licking tongues around fist and forearm
    ctx.fillStyle = rgba(ev.glow, 0.55);
    for (let i = 0; i < 4; i++) {
      const k = i / 3;
      const px = ex + (hx - ex) * (0.4 + k * 0.6);
      const py = ey + (hy - ey) * (0.4 + k * 0.6);
      const fh = (8 + Math.sin(ev.time * 14 + i * 2) * 3) * s;
      ctx.beginPath();
      ctx.moveTo(px - 3 * s, py);
      ctx.quadraticCurveTo(px - 3.4 * s, py - fh * 0.6, px + Math.sin(ev.time * 9 + i) * 1.6 * s, py - fh);
      ctx.quadraticCurveTo(px + 3.4 * s, py - fh * 0.6, px + 3 * s, py);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // orbiting prayer beads
    for (let i = 0; i < 3; i++) {
      const a = ev.time * 3 + (i / 3) * Math.PI * 2;
      ctx.fillStyle = i === 0 ? ev.core : ev.glow;
      ctx.beginPath();
      ctx.arc(hx + Math.cos(a) * 10 * s, hy + Math.sin(a) * 5 * s, 1.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Wizard staff head: bigger crystal → iron crown → orbiting shards + halo. */
export function drawStaffEvo(ctx: CanvasRenderingContext2D, cx: number, cy: number, upx: number, upy: number, handX: number, handY: number, scale: number): void {
  const ev = CUR;
  if (!ev) return;
  const t = ev.tier;
  const s = scale;
  ctx.save();
  ctx.lineCap = 'round';
  const px = -upy;
  const py = upx;
  if (t >= 3) {
    // fissure running down the shaft
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(ev.core, 0.8);
    ctx.lineWidth = Math.max(0.6, 0.6 * s);
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const x = cx + (handX - cx) * k + px * (i % 2 ? 0.8 : -0.8) * s;
      const y = cy + (handY - cy) * k + py * (i % 2 ? 0.8 : -0.8) * s;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  if (t >= 2) {
    // iron crown: three horns cradling the crystal
    ctx.strokeStyle = ev.look.metal;
    ctx.lineWidth = 1.5 * s;
    for (const side of [-1, 0, 1]) {
      const bx = cx - upx * 3 * s + px * side * 4 * s;
      const by = cy - upy * 3 * s + py * side * 4 * s;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + px * side * 4 * s + upx * 6 * s, by + py * side * 4 * s + upy * 6 * s, cx + px * side * 2 * s + upx * (side === 0 ? 11 : 9) * s, cy + py * side * 2 * s + upy * (side === 0 ? 11 : 9) * s);
      ctx.stroke();
    }
    ctx.strokeStyle = ev.look.metalEdge;
    ctx.lineWidth = Math.max(0.6, 0.5 * s);
    ctx.beginPath();
    ctx.arc(cx, cy, 6.5 * s, 0, Math.PI * 2);
    ctx.stroke();
  }
  // evolved crystal (bigger each tier)
  const cs = (3.6 + t * 1.6) * s;
  ctx.globalCompositeOperation = 'lighter';
  halo(ctx, cx, cy, (12 + t * 6) * s, ev.glow, Math.min(0.9, 0.3 * t * ev.glowMul));
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = t >= 3 ? ev.dark : ev.glow;
  ctx.beginPath();
  ctx.moveTo(cx + upx * cs * 1.3, cy + upy * cs * 1.3);
  ctx.lineTo(cx + px * cs * 0.7, cy + py * cs * 0.7);
  ctx.lineTo(cx - upx * cs, cy - upy * cs);
  ctx.lineTo(cx - px * cs * 0.7, cy - py * cs * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ev.core;
  ctx.lineWidth = Math.max(0.6, 0.6 * s);
  ctx.stroke();
  // rune ring(s) around the head
  for (let r = 0; r < Math.min(2, t); r++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ev.time * (r ? -1.4 : 1.1));
    ctx.scale(1, 0.45);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = ev.glow;
    ctx.lineWidth = Math.max(0.6, 0.5 * s);
    const rr = (10 + r * 4) * s;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      drawGlyph(ctx, Math.cos(a) * rr, Math.sin(a) * rr, 1.5 * s, k + r, ev.core, Math.max(0.6, 0.4 * s));
    }
    ctx.restore();
  }
  if (t >= 3) {
    for (let i = 0; i < 3; i++) {
      const a = ev.time * 2.4 + (i / 3) * Math.PI * 2;
      const sx = cx + Math.cos(a) * 13 * s;
      const sy = cy + Math.sin(a) * 6 * s;
      ctx.fillStyle = ev.look.metal;
      ctx.strokeStyle = ev.core;
      ctx.lineWidth = Math.max(0.5, 0.4 * s);
      ctx.beginPath();
      ctx.moveTo(sx, sy - 3 * s);
      ctx.lineTo(sx + 1.5 * s, sy);
      ctx.lineTo(sx, sy + 3 * s);
      ctx.lineTo(sx - 1.5 * s, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

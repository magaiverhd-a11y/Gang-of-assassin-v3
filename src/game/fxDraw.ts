// Affinity FX drawing: decals, wake, aura, particles, rings, statuses, tier-up. (affinity-v1)
import { BASE_FEEL, drawGlyph, FxPalette, rgba, visualElement } from './affinityFx';
import type { AffinityFx } from './fxSystem';
import type { AffinityZone, Enemy, Player, TuningConfig } from './types';

export function drawFxBehind(ctx: CanvasRenderingContext2D, sys: AffinityFx, p: Player, scale: number, time: number): void {
  const fx = sys.fx;
  for (const d of sys.decals) {
    const a = Math.min(1, d.life / d.max) * 0.85;
    ctx.save();
    if (d.kind === 'fire') {
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = '#140c09';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 0.5, d.size, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * Math.max(0, d.life / d.max - 0.3);
      ctx.fillStyle = d.pal.mid;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.size * 0.55, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'water') {
      const prog = 1 - d.life / d.max;
      ctx.globalAlpha = a * 0.7;
      ctx.strokeStyle = d.pal.core;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.size * (0.6 + prog * 1.2), 1.2 + prog * 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgba(d.pal.dark, 0.5);
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 0.5, d.size * 0.7, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'earth') {
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#17110c';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const dir = i - 2;
        const len = d.size * (0.6 + ((d.seed * (i + 3)) % 1) * 0.6);
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + dir * len * 0.45, d.y + 1 + Math.abs(dir) * 0.6);
        ctx.lineTo(d.x + dir * len * 0.8, d.y + 0.5);
      }
      ctx.stroke();
    } else if (d.kind === 'light') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * 0.6;
      ctx.translate(d.x, d.y - 0.5);
      ctx.scale(1, 0.32);
      drawGlyph(ctx, 0, 0, d.size * 0.6, Math.floor(d.seed), d.pal.mid, 1.6);
    } else if (d.kind === 'shadow') {
      ctx.globalAlpha = a * 0.75;
      ctx.fillStyle = d.pal.dark;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + 0.5, d.size * (1.2 - (d.life / d.max) * 0.3), 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const prof = !fx || fx.affinityFx ? visualElement(p, fx) : null;
  const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;

  // Wake trail
  if (prof && sys.trail.length > 1) {
    ctx.save();
    ctx.lineCap = 'round';
    const glowy = prof.primary === 'fire' || prof.primary === 'light';
    const tr = sys.trail;
    for (let i = 1; i < tr.length; i++) {
      const f = i / tr.length;
      ctx.globalAlpha = 0.3 * f * Math.min(1, tr[i].life / 0.25);
      ctx.strokeStyle = prof.primary === 'shadow' ? prof.pal.dark : prof.primary === 'earth' ? prof.pal.smoke : prof.pal.mid;
      ctx.lineWidth = h * (0.18 + f * 0.42);
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y);
      ctx.lineTo(tr[i].x, tr[i].y);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = glowy ? 'lighter' : 'source-over';
    for (let i = 1; i < tr.length; i++) {
      const f = i / tr.length;
      ctx.globalAlpha = (glowy ? 0.4 : 0.3) * f;
      ctx.strokeStyle = prof.combined && i % 2 ? prof.pal2.mid : prof.pal.core;
      ctx.lineWidth = Math.max(1, h * 0.05 * f);
      ctx.beginPath();
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y - h * 0.12);
      ctx.lineTo(tr[i].x, tr[i].y - h * 0.12);
      ctx.moveTo(tr[i - 1].x, tr[i - 1].y + h * 0.14);
      ctx.lineTo(tr[i].x, tr[i].y + h * 0.14);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Ground aura
  if (prof && (!fx || fx.runAura)) {
    ctx.save();
    const pulse = 0.85 + Math.sin(time * 3.1) * 0.15;
    const res = 1 + Math.min(0.4, p.elementResonance * 0.1);
    const r = 26 * scale * res;
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.22);
    const dark = prof.primary === 'shadow';
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
    g.addColorStop(0, rgba(dark ? prof.pal.dark : prof.pal.mid, (dark ? 0.75 : 0.32) * pulse));
    g.addColorStop(1, rgba(prof.pal.dark, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    if (prof.combined) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = prof.pal2.mid;
      ctx.lineWidth = 1.2 / 0.22;
      ctx.setLineDash([10, 9]);
      ctx.rotate(time * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
    if (prof.primary === 'fire' || prof.primary === 'light' || prof.primary === 'shadow') {
      ctx.save();
      const hx = p.x;
      const hy = p.y - h * 0.5;
      const gr = ctx.createRadialGradient(hx, hy, 2, hx, hy, h * 0.75);
      gr.addColorStop(0, rgba(dark ? prof.pal.dark : prof.pal.mid, dark ? 0.32 : 0.12));
      gr.addColorStop(1, rgba(prof.pal.dark, 0));
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(hx, hy, h * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Tier-up rune circle on the ground
  if (sys.tierUp) {
    const tu = sys.tierUp;
    const prog = 1 - tu.t / tu.max;
    const a = Math.min(1, tu.t / 0.4);
    ctx.save();
    ctx.translate(p.x, p.y - 1);
    ctx.scale(1, 0.26);
    ctx.globalAlpha = a * 0.85;
    ctx.strokeStyle = tu.glow;
    ctx.lineWidth = 2.4 / 0.26;
    const r = (54 + tu.tier * 10) * scale * Math.min(1, prog * 4);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.2 / 0.26;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    const n = 8 + tu.tier * 2;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + time * 0.8;
      drawGlyph(ctx, Math.cos(ang) * r * 0.89, Math.sin(ang) * r * 0.89, (4.2 * scale) / 0.5, i, tu.core, 1.4 / 0.26);
    }
    ctx.restore();
  }
}

export function drawFxFront(ctx: CanvasRenderingContext2D, sys: AffinityFx, p: Player, enemies: Enemy[], tuning: TuningConfig, time: number): void {
  const fx = sys.fx;
  if (!fx || fx.statusFx) {
    const es = tuning.enemyScale;
    for (const e of enemies) {
      if (e.dead) continue;
      const ew = e.baseW * es;
      const eh = e.baseH * es;
      const cx = e.x;
      const cy = e.y - eh * 0.5;
      if (e.burnTimer > 0) drawBurn(ctx, cx, e.y, ew, eh, time, e.id);
      if ((e.chillTimer ?? 0) > 0) drawRime(ctx, cx, cy, ew, eh, e.id);
      const st = sys.statuses.get(e.id);
      if (!st) continue;
      const a = Math.min(1, st.t / 0.5);
      if (st.kind === 'air') drawWindSpiral(ctx, cx, cy, ew, eh, time, a, st.pal);
      else if (st.kind === 'earth') drawDaze(ctx, cx, e.y - eh - 4, ew, time, a, st.pal);
      else if (st.kind === 'light') drawBrand(ctx, cx, cy, eh, time, a, st.pal, e.id);
      else if (st.kind === 'shadow') drawWither(ctx, cx, e.y, ew, eh, time, a, st.pal, e.id);
    }
  }

  for (const r of sys.rings) {
    const prog = 1 - r.life / r.max;
    const rad = r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - prog, 2));
    ctx.save();
    ctx.globalAlpha = Math.min(1, (r.life / r.max) * 1.4) * 0.85;
    ctx.translate(r.x, r.y);
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width;
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(0.5, rad), Math.max(0.5, rad * r.flat), 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < r.glyphs; i++) {
      const ang = (i / r.glyphs) * Math.PI * 2 + prog * r.spin;
      drawGlyph(ctx, Math.cos(ang) * rad, Math.sin(ang) * rad * r.flat, 3.2, i, r.color, 1.1);
    }
    ctx.restore();
  }

  ctx.save();
  for (const q of sys.particles) {
    if (q.kind === 'ember' || q.kind === 'spark' || q.kind === 'mote') continue;
    const a = Math.max(0, q.life / q.max);
    switch (q.kind) {
      case 'smoke':
        ctx.globalAlpha = a * 0.38;
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (1.8 - a * 0.8), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'mist':
        ctx.globalAlpha = a * 0.22;
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (1.6 - a * 0.6), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'drop': {
        ctx.globalAlpha = Math.min(1, a * 1.5);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(Math.atan2(q.vy, q.vx));
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, q.size * 1.8, q.size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = q.color2;
        ctx.fillRect(q.size * 0.3, -q.size * 0.3, q.size * 0.7, q.size * 0.4);
        ctx.restore();
        break;
      }
      case 'streak': {
        ctx.globalAlpha = a * 0.6;
        const sp = Math.hypot(q.vx, q.vy) || 1;
        const len = q.size * (0.5 + a * 0.5);
        const ux = q.vx / sp;
        const uy = q.vy / sp;
        ctx.strokeStyle = q.color;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.quadraticCurveTo(q.x - ux * len * 0.5 + uy * q.curl * 1.2, q.y - uy * len * 0.5 - ux * q.curl * 1.2, q.x - ux * len, q.y - uy * len);
        ctx.stroke();
        break;
      }
      case 'grit':
        ctx.globalAlpha = Math.min(1, a * 1.6);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillStyle = q.color;
        ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size * 0.8);
        ctx.restore();
        break;
      case 'shard':
        ctx.globalAlpha = Math.min(1, a * 1.6);
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.moveTo(0, -q.size * 1.4);
        ctx.lineTo(q.size * 0.8, q.size * 0.6);
        ctx.lineTo(-q.size * 0.7, q.size * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = q.color2;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
        break;
      case 'wisp':
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = q.color;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (1.3 - a * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = a * 0.5;
        ctx.strokeStyle = q.color2;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * 0.9, q.rot, q.rot + 1.6);
        ctx.stroke();
        break;
      case 'flake': {
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = q.color;
        ctx.lineWidth = 0.8;
        const s = q.size;
        ctx.beginPath();
        ctx.moveTo(q.x - s, q.y);
        ctx.lineTo(q.x + s, q.y);
        ctx.moveTo(q.x, q.y - s);
        ctx.lineTo(q.x, q.y + s);
        ctx.stroke();
        break;
      }
      default:
        break;
    }
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const q of sys.particles) {
    if (q.kind !== 'ember' && q.kind !== 'spark' && q.kind !== 'mote') continue;
    const a = Math.max(0, q.life / q.max);
    if (q.kind === 'ember') {
      const flick = 0.75 + 0.25 * Math.sin(time * 40 + q.rot * 10);
      ctx.globalAlpha = Math.min(1, a * 1.3) * flick;
      ctx.fillStyle = a > 0.55 ? q.color2 : q.color;
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
      ctx.globalAlpha = a * 0.25;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size * 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (q.kind === 'spark') {
      ctx.globalAlpha = Math.min(1, a * 1.5);
      ctx.strokeStyle = q.color2;
      const still = q.vx === 0 && q.vy === 0;
      ctx.lineWidth = still ? 1.4 : 1.2;
      ctx.beginPath();
      if (still) {
        const L = q.size * (0.6 + 0.4 * a);
        ctx.moveTo(q.x - Math.cos(q.rot) * L, q.y - Math.sin(q.rot) * L);
        ctx.lineTo(q.x + Math.cos(q.rot) * L, q.y + Math.sin(q.rot) * L);
      } else {
        const sp = Math.hypot(q.vx, q.vy) || 1;
        const L = Math.min(14, sp * 0.03) + q.size;
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - (q.vx / sp) * L, q.y - (q.vy / sp) * L);
      }
      ctx.stroke();
    } else {
      ctx.globalAlpha = Math.min(1, a * 1.2) * 0.9;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = q.color2;
      ctx.fillRect(q.x - q.size * 0.4, q.y - q.size * 0.4, q.size * 0.8, q.size * 0.8);
    }
  }
  ctx.restore();

  if (sys.tierUp) {
    const tu = sys.tierUp;
    const prog = 1 - tu.t / tu.max;
    const h = p.baseH * tuning.playerScale;
    const a = Math.min(1, tu.t / 0.5) * (prog < 0.1 ? prog / 0.1 : 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const w = (14 + tu.tier * 4) * (1 - prog * 0.6);
    const g = ctx.createLinearGradient(p.x - w, 0, p.x + w, 0);
    g.addColorStop(0, rgba(tu.glow, 0));
    g.addColorStop(0.5, rgba(tu.core, 0.45 * a));
    g.addColorStop(1, rgba(tu.glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(p.x - w, p.y - h * 2.4, w * 2, h * 2.4);
    ctx.restore();
  }
}

function drawBurn(ctx: CanvasRenderingContext2D, cx: number, footY: number, ew: number, eh: number, time: number, seed: number): void {
  const pal = BASE_FEEL.fire.pal;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#0c0705';
  ctx.beginPath();
  ctx.ellipse(cx, footY - eh * 0.3, ew * 0.42, eh * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const ph = time * 7 + i * 2.1 + seed;
    const fx = cx + (i - 1) * ew * 0.25 + Math.sin(ph) * 2;
    const base = footY - eh * (0.15 + (0.2 * ((i * 37 + seed) % 3)) / 3);
    const fh = eh * (0.28 + 0.1 * Math.sin(ph * 1.7));
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pal.mid;
    ctx.beginPath();
    ctx.moveTo(fx - 4, base);
    ctx.quadraticCurveTo(fx - 5, base - fh * 0.5, fx + Math.sin(ph * 2) * 3, base - fh);
    ctx.quadraticCurveTo(fx + 5, base - fh * 0.5, fx + 4, base);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pal.core;
    ctx.beginPath();
    ctx.moveTo(fx - 1.6, base);
    ctx.quadraticCurveTo(fx, base - fh * 0.55, fx + 1.6, base);
    ctx.fill();
  }
  ctx.restore();
}

function drawRime(ctx: CanvasRenderingContext2D, cx: number, cy: number, ew: number, eh: number, seed: number): void {
  const pal = BASE_FEEL.water.pal;
  ctx.save();
  ctx.strokeStyle = rgba(pal.core, 0.75);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + seed;
    const x = cx + Math.cos(a) * ew * 0.5;
    const y = cy + Math.sin(a) * eh * 0.45;
    const s = 3 + (i % 3);
    ctx.moveTo(x - s, y);
    ctx.lineTo(x + s, y);
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y + s);
    ctx.moveTo(x - s * 0.6, y - s * 0.6);
    ctx.lineTo(x + s * 0.6, y + s * 0.6);
  }
  ctx.stroke();
  ctx.restore();
}

function drawWindSpiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, ew: number, eh: number, time: number, a: number, pal: FxPalette): void {
  ctx.save();
  ctx.globalAlpha = 0.55 * a;
  ctx.strokeStyle = pal.core;
  ctx.lineWidth = 1.1;
  for (let k = 0; k < 2; k++) {
    const rot = time * 9 + k * Math.PI;
    ctx.beginPath();
    ctx.ellipse(cx, cy + (k - 0.5) * eh * 0.35, ew * 0.7, eh * 0.16, 0, rot, rot + 2.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDaze(ctx: CanvasRenderingContext2D, cx: number, y: number, ew: number, time: number, a: number, pal: FxPalette): void {
  ctx.save();
  ctx.globalAlpha = 0.9 * a;
  for (let i = 0; i < 3; i++) {
    const ang = time * 5 + (i / 3) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? pal.mid : pal.dark;
    ctx.save();
    ctx.translate(cx + Math.cos(ang) * ew * 0.45, y + Math.sin(ang) * 3);
    ctx.rotate(ang * 2);
    ctx.beginPath();
    ctx.moveTo(-2.6, -1.6);
    ctx.lineTo(2.4, -2.2);
    ctx.lineTo(2.8, 1.8);
    ctx.lineTo(-2, 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBrand(ctx: CanvasRenderingContext2D, cx: number, cy: number, eh: number, time: number, a: number, pal: FxPalette, seed: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.75 * a * (0.8 + 0.2 * Math.sin(time * 6));
  ctx.strokeStyle = pal.mid;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy - eh * 0.05, 7, 0, Math.PI * 2);
  ctx.stroke();
  drawGlyph(ctx, cx, cy - eh * 0.05, 4.5, seed, pal.core, 1.4);
  ctx.restore();
}

function drawWither(ctx: CanvasRenderingContext2D, cx: number, footY: number, ew: number, eh: number, time: number, a: number, pal: FxPalette, seed: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  for (const pass of [0, 1]) {
    ctx.globalAlpha = (pass ? 0.5 : 0.75) * a;
    ctx.strokeStyle = pass ? pal.mid : pal.dark;
    ctx.lineWidth = pass ? 0.9 : 2.2;
    for (let i = 0; i < 3; i++) {
      const bx = cx + (i - 1) * ew * 0.3;
      const sw = Math.sin(time * 4 + i * 1.7 + seed) * 5;
      ctx.beginPath();
      ctx.moveTo(bx, footY);
      ctx.bezierCurveTo(bx + sw, footY - eh * 0.25, bx - sw, footY - eh * 0.45, bx + sw * 0.6, footY - eh * (0.55 + 0.08 * i));
      ctx.stroke();
    }
  }
  ctx.restore();
}


export function drawAffinityZones(ctx: CanvasRenderingContext2D, zones: AffinityZone[]): void {
  for (const z of zones) {
    const a = Math.max(0, z.life / z.maxLife);
    const pal = BASE_FEEL[z.kind]?.pal;
    if (!pal) continue;
    ctx.save();
    ctx.globalAlpha = a * 0.7;
    const g = ctx.createRadialGradient(z.x, z.y, 2, z.x, z.y, z.r);
    g.addColorStop(0, rgba(pal.core, 0.45));
    g.addColorStop(0.55, rgba(pal.mid, 0.28));
    g.addColorStop(1, rgba(pal.dark, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(z.x, z.y, z.r, z.r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = a * 0.85;
    ctx.strokeStyle = pal.mid;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(z.x, z.y, z.r * 0.86, z.r * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

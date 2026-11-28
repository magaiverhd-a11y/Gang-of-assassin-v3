// Element + weapon-tier swing overlay (replaces the old evo slash overlay). (affinity-v1)
import { drawGlyph, evoFxOn, evoGlow, fxTime, getRenderFx, rgba, tierLook, visualElement, visualTier, weaponSwingShape } from './affinityFx';
import type { Player } from './types';

export function drawAffinitySwing(ctx: CanvasRenderingContext2D, p: Player, scale: number, range: number): void {
  const fx = getRenderFx();
  if (p.attackState !== 'active') return;
  const prof = !fx || (fx.affinityFx && fx.attackFx) ? visualElement(p, fx) : null;
  const tier = evoFxOn(fx) ? visualTier(p, fx) : 0;
  if (!prof && tier <= 0) return;
  const glowMul = evoGlow(fx);
  const look = tierLook(tier);
  const glow = prof ? prof.pal.mid : look.glow;
  const core = prof ? prof.pal.core : look.glowCore;
  const dark = prof ? prof.pal.dark : '#120d12';
  const shape = weaponSwingShape(p.attackWeapon);
  const time = fxTime();
  const h = (p.attackWasCrouching ? p.crouchBaseH : p.baseH) * scale;
  const f = p.facing;

  ctx.save();
  ctx.lineCap = 'round';

  if (shape === 'cast') {
    const tipX = p.x + f * 20 * scale;
    const tipY = p.y - h * 0.66;
    const n = 1 + tier;
    for (let i = 0; i < n; i++) {
      const r = (10 + i * 7) * scale;
      ctx.save();
      ctx.translate(tipX + f * i * 6 * scale, tipY);
      ctx.scale(0.4, 1);
      ctx.rotate(time * (i % 2 ? -3 : 3));
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = i === 0 ? core : glow;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      const g = 4 + i * 2;
      for (let k = 0; k < g; k++) {
        const a = (k / g) * Math.PI * 2;
        drawGlyph(ctx, Math.cos(a) * r, Math.sin(a) * r, 2.6, k + i, glow, 1);
      }
      ctx.restore();
    }
    if (tier >= 3) {
      const rg = ctx.createRadialGradient(tipX, tipY, 1, tipX, tipY, 26 * scale);
      rg.addColorStop(0, rgba(core, 0.45 * glowMul));
      rg.addColorStop(1, rgba(glow, 0));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 26 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (shape === 'arc') {
    const cx = p.x + f * 16 * scale;
    const cy = p.y - h * 0.55;
    const R = range * scale * (1.08 + tier * 0.12);
    const startA = f === 1 ? -Math.PI * 0.66 : Math.PI * 0.34;
    const endA = f === 1 ? Math.PI * 0.56 : Math.PI * 1.66;
    const arcAt = (i: number, n: number) => startA + ((endA - startA) * (i + 0.5)) / n;
    if (prof) {
      const k = prof.primary;
      if (k === 'shadow' || k === 'earth') {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = k === 'shadow' ? dark : prof.pal.smoke;
        ctx.lineWidth = (k === 'shadow' ? 16 : 13) * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.9, startA, endA);
        ctx.stroke();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = glow;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.98, startA + 0.05, endA - 0.05);
        ctx.stroke();
        if (k === 'earth') {
          ctx.fillStyle = prof.pal.mid;
          for (let i = 0; i < 7; i++) {
            const a = arcAt(i, 7);
            const rx = cx + Math.cos(a) * R;
            const ry = cy + Math.sin(a) * R;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(a) * 7 * scale, ry + Math.sin(a) * 7 * scale - 2);
            ctx.lineTo(rx + Math.cos(a + 0.1) * 2 * scale, ry + Math.sin(a + 0.1) * 2 * scale);
            ctx.fill();
          }
        } else {
          // shadow: tendrils curling off the arc
          ctx.strokeStyle = prof.pal.mid;
          ctx.lineWidth = 1.2 * scale;
          ctx.globalAlpha = 0.6;
          for (let i = 0; i < 5; i++) {
            const a = arcAt(i, 5);
            const rx = cx + Math.cos(a) * R * 0.95;
            const ry = cy + Math.sin(a) * R * 0.95;
            const sw = Math.sin(time * 18 + i) * 5 * scale;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.quadraticCurveTo(rx + Math.cos(a) * 8 * scale + sw, ry + Math.sin(a) * 8 * scale, rx + Math.cos(a) * 14 * scale, ry + Math.sin(a) * 14 * scale + sw);
            ctx.stroke();
          }
        }
      } else {
        ctx.globalCompositeOperation = k === 'fire' || k === 'light' ? 'lighter' : 'source-over';
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = glow;
        ctx.lineWidth = (k === 'air' ? 5 : 11) * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.92, startA, endA);
        ctx.stroke();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = core;
        ctx.lineWidth = 1.6 * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.99, startA + 0.04, endA - 0.04);
        ctx.stroke();
        if (k === 'air') {
          ctx.globalAlpha = 0.5;
          for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.arc(cx, cy, R * (0.92 - i * 0.12), startA + i * 0.15, endA - i * 0.15);
            ctx.stroke();
          }
        } else if (k === 'water') {
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          for (let i = 0; i <= 24; i++) {
            const a = startA + ((endA - startA) * i) / 24;
            const rr = R * (0.84 + Math.sin(i * 1.3 + time * 20) * 0.025);
            if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
            else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          }
          ctx.stroke();
        } else if (k === 'fire') {
          ctx.fillStyle = glow;
          ctx.globalAlpha = 0.5;
          for (let i = 0; i < 6; i++) {
            const a = arcAt(i, 6);
            const rx = cx + Math.cos(a) * R * 0.98;
            const ry = cy + Math.sin(a) * R * 0.98;
            const tl = (7 + Math.sin(time * 30 + i) * 3) * scale;
            ctx.beginPath();
            ctx.moveTo(rx - 3 * scale, ry);
            ctx.quadraticCurveTo(rx + Math.cos(a) * tl * 0.5, ry - tl, rx + 3 * scale, ry);
            ctx.fill();
          }
        } else if (k === 'light') {
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 1;
          for (let i = 0; i < 7; i++) {
            const a = arcAt(i, 7);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.02);
            ctx.lineTo(cx + Math.cos(a) * R * 1.14, cy + Math.sin(a) * R * 1.14);
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
      if (prof.combined) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = prof.pal2.mid;
        ctx.lineWidth = 2.2 * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.8, startA + 0.12, endA - 0.12);
        ctx.stroke();
      }
    }
    if (tier >= 1) {
      ctx.globalAlpha = Math.min(1, 0.7 * glowMul);
      ctx.strokeStyle = look.metalEdge;
      ctx.lineWidth = (1.4 + tier * 0.5) * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.04, startA + 0.06, endA - 0.06);
      ctx.stroke();
      const n = 3 + tier * 2;
      for (let i = 0; i < n; i++) {
        const a = arcAt(i, n);
        drawGlyph(ctx, cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86, 2.6 * scale, i, glow, 1.1);
      }
    }
    if (tier >= 2) {
      ctx.globalAlpha = Math.min(1, 0.75 * glowMul);
      ctx.fillStyle = glow;
      ctx.beginPath();
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const a = startA + ((endA - startA) * i) / n;
        const rr = R * (i % 2 ? 1.14 : 1.06);
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      for (let i = n; i >= 0; i--) {
        const a = startA + ((endA - startA) * i) / n;
        ctx.lineTo(cx + Math.cos(a) * R * 1.03, cy + Math.sin(a) * R * 1.03);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = Math.min(1, 0.42 * glowMul);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 8 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.92, startA - f * 0.3, endA - f * 0.3);
      ctx.stroke();
    }
    if (tier >= 3) {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#0b080d';
      ctx.lineWidth = 10 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, startA + 0.1, endA - 0.1);
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, 0.95 * glowMul);
      ctx.strokeStyle = core;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const a = startA + 0.1 + ((endA - startA - 0.2) * i) / n;
        const rr = R * (1.22 + (i % 2 ? 0.025 : -0.025));
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.22 * glowMul;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 10 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, startA - f * 0.6, endA - f * 0.6);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Thrusts / lashes / fists
  const fy = p.y - h * (shape === 'fist' ? 0.6 : 0.56);
  const L = range * scale * (shape === 'fist' ? 0.62 : shape === 'line' ? 1.2 : 1.1) * (1 + tier * 0.1);
  const x0 = p.x + f * 8 * scale;
  const x1 = x0 + f * L;
  const wave = (t: number) => (shape === 'lash' ? Math.sin(t * Math.PI * 3 + time * 30) * 4 * scale * (1 - t) : 0);
  const pathLine = (yOff: number) => {
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const x = x0 + (x1 - x0) * t;
      const y = fy + yOff + wave(t);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };
  if (prof) {
    const k = prof.primary;
    const darkBody = k === 'shadow' || k === 'earth';
    ctx.globalCompositeOperation = !darkBody && (k === 'fire' || k === 'light') ? 'lighter' : 'source-over';
    ctx.globalAlpha = darkBody ? 0.55 : 0.42;
    ctx.strokeStyle = darkBody ? (k === 'shadow' ? dark : prof.pal.smoke) : glow;
    ctx.lineWidth = (shape === 'fist' ? 12 : 8) * scale;
    pathLine(0);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = darkBody ? glow : core;
    ctx.lineWidth = 1.5 * scale;
    pathLine(0);
    ctx.stroke();
    if (k === 'air') {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = core;
      pathLine(-5 * scale);
      ctx.stroke();
      pathLine(5 * scale);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (prof.combined) {
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = prof.pal2.mid;
      ctx.lineWidth = 1.6 * scale;
      pathLine(3 * scale);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = darkBody ? glow : core;
    ctx.beginPath();
    ctx.arc(x1, fy + wave(1), (shape === 'fist' ? 4 : 2.6) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  if (tier >= 1) {
    ctx.globalAlpha = Math.min(1, 0.75 * glowMul);
    ctx.strokeStyle = look.metalEdge;
    ctx.lineWidth = (1 + tier * 0.5) * scale;
    pathLine(-(4 + tier) * scale);
    ctx.stroke();
    const n = 2 + tier * 2;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      drawGlyph(ctx, x0 + (x1 - x0) * t, fy + wave(t) + 6 * scale, 2.4 * scale, i, glow, 1);
    }
  }
  if (tier >= 2) {
    ctx.globalAlpha = Math.min(1, 0.8 * glowMul);
    ctx.fillStyle = glow;
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      const x = x0 + (x1 - x0) * t;
      const y = fy + wave(t);
      ctx.beginPath();
      ctx.moveTo(x - f * 3 * scale, y - 1.5 * scale);
      ctx.lineTo(x + f * 3 * scale, y - 5 * scale);
      ctx.lineTo(x + f * 1 * scale, y + 0.5 * scale);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x1 + f * 12 * scale, fy + wave(1));
    ctx.lineTo(x1 - f * 3 * scale, fy - 6 * scale + wave(1));
    ctx.lineTo(x1 - f * 3 * scale, fy + 6 * scale + wave(1));
    ctx.closePath();
    ctx.fill();
  }
  if (tier >= 3) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#0b080d';
    ctx.lineWidth = 5 * scale;
    pathLine(-11 * scale);
    ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, 0.9 * glowMul);
    ctx.strokeStyle = core;
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      const x = x0 + (x1 - x0) * t;
      const y = fy - 11 * scale + wave(t) + (i % 2 ? 1.5 : -1.5) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const rg = ctx.createRadialGradient(x1, fy, 1, x1, fy, 22 * scale);
    rg.addColorStop(0, rgba(core, 0.5 * glowMul));
    rg.addColorStop(1, rgba(glow, 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x1, fy, 22 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

import { Enemy, GroundHazard } from './types';

function snap30(t: number): number {
  return Math.floor(t * 30) / 30;
}

function limb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string,
  outline = '#090b12'
): void {
  ctx.lineCap = 'round';
  ctx.strokeStyle = outline;
  ctx.lineWidth = width + 2.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function roundedPoly(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  fill: string,
  stroke = '#090b12',
  lineWidth = 1.6
): void {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (lineWidth > 0) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawEyeGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0.5, x, y, r * 2.6);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + r * 0.2, y - r * 0.2, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  w: number,
  isFlying: boolean,
  scale: number
): void {
  ctx.save();
  ctx.fillStyle = isFlying ? 'rgba(5, 7, 12, 0.28)' : 'rgba(5, 7, 12, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 1, w * (isFlying ? 0.36 : 0.48), Math.max(3, 5 * scale), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlowingCape(
  ctx: CanvasRenderingContext2D,
  shoulderX: number,
  shoulderY: number,
  w: number,
  h: number,
  t: number,
  color: string,
  trimColor?: string
): void {
  const wave1 = Math.sin(t * 5.2) * w * 0.14;
  const wave2 = Math.cos(t * 6.4) * w * 0.12;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(shoulderX - w * 0.26, shoulderY);
  ctx.quadraticCurveTo(
    shoulderX - w * 0.68 + wave1 * 0.5,
    shoulderY + h * 0.42,
    shoulderX - w * 0.8 + wave1,
    -h * 0.04
  );
  ctx.lineTo(shoulderX - w * 0.35 + wave2, -h * 0.12);
  ctx.lineTo(shoulderX + w * 0.18 + wave1 * 0.4, -h * 0.04);
  ctx.lineTo(shoulderX + w * 0.3, shoulderY + h * 0.06);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#090b12';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  if (trimColor) {
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(shoulderX - w * 0.78 + wave1, -h * 0.06);
    ctx.lineTo(shoulderX - w * 0.35 + wave2, -h * 0.14);
    ctx.lineTo(shoulderX + w * 0.16 + wave1 * 0.4, -h * 0.06);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBatWing(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dir: -1 | 1,
  span: number,
  height: number,
  flap: number,
  membrane: string,
  bone: string
): void {
  const tipX = ox + dir * span;
  const tipY = oy - height * 0.55 + flap;
  const midX = ox + dir * span * 0.56;
  const midY = oy - height * 0.78 + flap * 0.65;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(midX, midY);
  ctx.lineTo(tipX, tipY);
  ctx.quadraticCurveTo(ox + dir * span * 0.72, oy + height * 0.18 + flap * 0.3, ox + dir * span * 0.52, oy + height * 0.32);
  ctx.quadraticCurveTo(ox + dir * span * 0.32, oy + height * 0.12, ox + dir * span * 0.18, oy + height * 0.28);
  ctx.closePath();
  ctx.fillStyle = membrane;
  ctx.fill();
  ctx.strokeStyle = '#090b12';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing finger ribs
  ctx.strokeStyle = bone;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(midX, midY);
  ctx.lineTo(tipX, tipY);
  ctx.moveTo(midX, midY);
  ctx.lineTo(ox + dir * span * 0.52, oy + height * 0.3);
  ctx.moveTo(midX, midY);
  ctx.lineTo(ox + dir * span * 0.24, oy + height * 0.24);
  ctx.stroke();
  ctx.restore();
}

function drawBipedLegs(
  ctx: CanvasRenderingContext2D,
  hipY: number,
  w: number,
  stridePhase: number,
  isMoving: boolean,
  isAirborne: boolean,
  thighColor: string,
  bootColor: string,
  legW: number
): void {
  const s = isAirborne ? 0.55 : isMoving ? Math.sin(stridePhase) : 0;
  const c = isAirborne ? 0.35 : isMoving ? Math.cos(stridePhase) : 0;
  const strideX = w * 0.28;

  // Back leg
  const bxKnee = -s * strideX * 0.5 - w * 0.08;
  const byKnee = hipY * 0.52 - Math.max(0, -c) * 4;
  const bxFoot = -s * strideX - w * 0.1;
  const byFoot = isAirborne ? -6 : -Math.max(0, -c) * 5;
  limb(ctx, -w * 0.08, hipY, bxKnee, byKnee, legW, thighColor);
  limb(ctx, bxKnee, byKnee, bxFoot, byFoot, legW * 0.9, bootColor);

  // Front leg
  const fxKnee = s * strideX * 0.55 + w * 0.1;
  const fyKnee = hipY * 0.52 - Math.max(0, c) * 4;
  const fxFoot = s * strideX + w * 0.12;
  const fyFoot = isAirborne ? -3 : -Math.max(0, c) * 5;
  limb(ctx, w * 0.08, hipY, fxKnee, fyKnee, legW, thighColor);
  limb(ctx, fxKnee, fyKnee, fxFoot, fyFoot, legW * 0.9, bootColor);
}

function drawTowerShield(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  trim: string,
  emblem: string,
  glowing: boolean
): void {
  ctx.save();
  if (glowing) {
    ctx.shadowColor = trim;
    ctx.shadowBlur = 10;
  }
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y - h * 0.5);
  ctx.lineTo(x + w * 0.5, y - h * 0.5);
  ctx.lineTo(x + w * 0.5, y + h * 0.22);
  ctx.lineTo(x, y + h * 0.55);
  ctx.lineTo(x - w * 0.5, y + h * 0.22);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Inner emblem diamond
  ctx.fillStyle = emblem;
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.24);
  ctx.lineTo(x + w * 0.26, y);
  ctx.lineTo(x, y + h * 0.24);
  ctx.lineTo(x - w * 0.26, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawGroundHazard(
  ctx: CanvasRenderingContext2D,
  hazard: GroundHazard,
  time: number
): void {
  const palette =
    hazard.kind === 'hex_pillar'
      ? { warn: '#34d399', outer: 'rgba(16, 185, 129, 0.55)', mid: '#34d399', core: '#ecfdf5' }
      : hazard.kind === 'eclipse_pillar'
        ? { warn: '#ff334b', outer: 'rgba(200, 35, 51, 0.58)', mid: '#ff334b', core: '#ffd166' }
        : hazard.kind === 'bone_spike'
          ? { warn: '#cbd5e1', outer: 'rgba(148, 163, 184, 0.45)', mid: '#e7e5e4', core: '#2dd4bf' }
          : { warn: '#f97316', outer: 'rgba(234, 88, 12, 0.55)', mid: '#f97316', core: '#fef08a' };

  ctx.save();
  ctx.translate(hazard.x, hazard.y);

  if (hazard.warnTimer > 0) {
    const prog = 1 - hazard.warnTimer / Math.max(0.1, hazard.maxWarn);
    const pulse = 0.55 + Math.sin(time * 28) * 0.25;

    // Ground warning rune ellipse
    ctx.fillStyle = palette.outer;
    ctx.globalAlpha = 0.28 + prog * 0.45;
    ctx.beginPath();
    ctx.ellipse(0, -2, hazard.width * (0.55 + prog * 0.1), 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shrinking crisp lock-in ring
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = palette.warn;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, -2, hazard.width * (0.95 - prog * 0.45), 11 * (1 - prog * 0.35), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rising vertical warning laser guide lines
    ctx.globalAlpha = 0.2 + prog * 0.5;
    ctx.strokeStyle = palette.core;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(-hazard.width * 0.38, 0);
    ctx.lineTo(-hazard.width * 0.38, -hazard.height * (0.4 + prog * 0.6));
    ctx.moveTo(hazard.width * 0.38, 0);
    ctx.lineTo(hazard.width * 0.38, -hazard.height * (0.4 + prog * 0.6));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // Active Eruption Column!
  const activeFrac = Math.max(0, hazard.activeTimer / Math.max(0.08, hazard.maxActive));
  const widthScale = activeFrac > 0.25 ? 1 : activeFrac / 0.25;
  const colW = hazard.width * widthScale;
  const colH = hazard.height * Math.min(1, (1 - activeFrac) * 8 + 0.35);

  if (hazard.kind === 'bone_spike') {
    // Jagged colossal erupting bone spear!
    roundedPoly(
      ctx,
      [
        [-colW * 0.48, 0],
        [-colW * 0.22, -colH * 0.68],
        [0, -colH],
        [colW * 0.24, -colH * 0.66],
        [colW * 0.48, 0],
      ],
      palette.mid,
      '#090b12',
      2
    );
    roundedPoly(
      ctx,
      [
        [-colW * 0.14, -4],
        [0, -colH * 0.84],
        [colW * 0.14, -4],
      ],
      palette.core,
      palette.core,
      0
    );
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, -colH);
    grad.addColorStop(0, palette.mid);
    grad.addColorStop(0.65, palette.outer);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(-colW * 0.56, -colH, colW * 1.12, colH);

    // Bright crackling core beam
    const jitter = Math.sin(time * 42 + hazard.id) * 4;
    ctx.fillStyle = palette.core;
    ctx.globalAlpha = 0.85 * widthScale;
    ctx.beginPath();
    ctx.moveTo(-colW * 0.26, 0);
    ctx.quadraticCurveTo(-colW * 0.18 + jitter, -colH * 0.5, 0, -colH * 0.98);
    ctx.quadraticCurveTo(colW * 0.18 + jitter, -colH * 0.5, colW * 0.26, 0);
    ctx.closePath();
    ctx.fill();

    // Base blast crown
    ctx.fillStyle = palette.core;
    ctx.beginPath();
    ctx.ellipse(0, -3, colW * 0.68, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawDetailedEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  scale: number,
  assassinationEnabled: boolean
): void {
  const w = enemy.baseW * scale;
  const h = enemy.baseH * scale;
  const t = snap30(enemy.animTime);
  const isFlashing = enemy.flashTimer > 0;
  const flashWhite = isFlashing && Math.floor(enemy.flashTimer * 40) % 2 === 0;
  const isBossInvuln = enemy.isBoss && enemy.invulnTimer > 0;

  const isCharging = enemy.attackChargeTimer > 0 && !enemy.dead;
  const chargeDur = Math.max(0.22, enemy.chargeDuration || 0.55);
  const chargeProg = isCharging ? Math.max(0, Math.min(1, 1 - enemy.attackChargeTimer / chargeDur)) : 0;
  const isLunging = enemy.lungeTimer > 0;
  const isSwinging = (enemy.attackSwingTimer ?? 0) > 0;
  const isHurt = enemy.hurtStunTimer > 0 && !enemy.isBoss;
  const isMoving = Math.abs(enemy.vx) > 10 && enemy.onGround;
  const isAirborne = !enemy.onGround;
  const stridePhase = t * (Math.abs(enemy.vx) > 120 ? 15 : 8.5);
  const bob = isMoving ? Math.abs(Math.sin(stridePhase)) * -3.5 * scale : Math.sin(t * 3.8) * 1.8 * scale;

  const pick = (normal: string, hitTint = '#ff6b6b'): string =>
    flashWhite ? '#ffffff' : isFlashing ? hitTint : normal;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (isBossInvuln) {
    ctx.globalAlpha = Math.floor(enemy.invulnTimer * 24) % 2 === 0 ? 0.45 : 0.92;
  }

  // Stealth vision cone for unalerted non-boss enemies
  if (!enemy.alerted && assassinationEnabled && enemy.type !== 'bat' && !enemy.isBoss) {
    const wedgeLen = Math.min(enemy.visionRange * 0.45, 96);
    ctx.fillStyle = 'rgba(229, 169, 60, 0.075)';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.65);
    ctx.lineTo(enemy.facing * wedgeLen, -h * 0.95);
    ctx.lineTo(enemy.facing * wedgeLen, -h * 0.14);
    ctx.closePath();
    ctx.fill();
  }

  // Enraged Phase II Aura behind Big Bosses
  if (enemy.enraged && !enemy.dead) {
    const pulseR = Math.max(w, h) * (0.76 + Math.sin(t * 9) * 0.08);
    const aura = ctx.createRadialGradient(0, -h * 0.52, w * 0.1, 0, -h * 0.52, pulseR);
    aura.addColorStop(0, 'rgba(255, 51, 75, 0.46)');
    aura.addColorStop(0.55, 'rgba(249, 115, 22, 0.22)');
    aura.addColorStop(1, 'rgba(200, 35, 51, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -h * 0.52, pulseR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground shadow
  const flyingVisual =
    enemy.type === 'bat' ||
    enemy.type === 'goblin_shaman' ||
    enemy.type === 'wraith' ||
    enemy.type === 'gargoyle' ||
    enemy.type === 'ember_imp' ||
    enemy.type === 'boss_malakor' ||
    enemy.type === 'boss_gargoyle_king' ||
    enemy.type === 'boss_goblin_shaman' ||
    enemy.type === 'boss_banshee' ||
    enemy.type === 'boss_necromancer' ||
    enemy.type === 'boss_pyre_matriarch';
  drawGroundShadow(ctx, w, flyingVisual, scale);

  // Squash / Stretch + Wind-up Crouch + Hurt Recoil Transform
  ctx.scale(enemy.facing, 1);
  let sx = 1;
  let sy = 1;
  let lean = 0;
  if (isHurt) {
    lean = -0.22;
    sx = 0.92;
    sy = 1.06;
  } else if (isCharging) {
    const tremor = Math.sin(t * 48) * 0.025 * chargeProg;
    sx = 1 + 0.1 * chargeProg + tremor;
    sy = 1 - 0.1 * chargeProg;
    lean = -0.14 * chargeProg;
  } else if (isLunging) {
    sx = 1.12;
    sy = 0.9;
    lean = 0.24;
  } else if (isSwinging) {
    lean = 0.18;
  }

  ctx.rotate(lean);
  ctx.scale(sx, sy);

  // Weapon windup angle helper
  const windupLift = isCharging ? -chargeProg * h * 0.24 : isSwinging ? h * 0.12 : 0;

  switch (enemy.type) {
    // =========================================================================
    // NOCTURNE CASTLE — REGULAR ENEMIES
    // =========================================================================
    case 'ghoul': {
      const skin = pick('#5f7d5e');
      const darkSkin = pick('#3c523c');
      const cloth = pick('#2d3336');
      drawBipedLegs(ctx, -h * 0.36, w, stridePhase, isMoving, isAirborne, cloth, darkSkin, 4.5 * scale);

      // Hunched tattered burial torso
      roundedPoly(
        ctx,
        [
          [-w * 0.42, -h * 0.32],
          [-w * 0.32, -h * 0.74 + bob],
          [w * 0.28, -h * 0.72 + bob],
          [w * 0.34, -h * 0.28],
        ],
        cloth
      );
      // Exposed spine/ribs accent
      ctx.fillStyle = pick('#c4c9b8');
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-w * 0.12, -h * (0.62 - i * 0.08) + bob, w * 0.32, Math.max(1.8, 2.2 * scale));
      }
      // Hunched gaunt skull-head with jutting jaw
      roundedPoly(
        ctx,
        [
          [-w * 0.12, -h * 0.98 + bob],
          [w * 0.38, -h * 0.96 + bob],
          [w * 0.44, -h * 0.74 + bob],
          [w * 0.22, -h * 0.68 + bob],
          [-w * 0.14, -h * 0.74 + bob],
        ],
        skin
      );
      // Snapping jaw
      ctx.fillStyle = '#180d10';
      ctx.fillRect(w * 0.16, -h * 0.78 + bob, w * 0.22, h * (isCharging ? 0.11 : 0.05));
      drawEyeGlow(ctx, w * 0.24, -h * 0.87 + bob, 2.5 * scale, enemy.alerted ? '#ff334b' : '#a7f3d0');

      // Elongated bone-clawed arms reaching forward
      const reachY = -h * 0.56 + bob + (isCharging ? -h * 0.14 : isLunging ? h * 0.06 : 0);
      limb(ctx, w * 0.06, -h * 0.64 + bob, w * 0.58, reachY, 4 * scale, skin);
      // Curved claws
      ctx.strokeStyle = pick('#e7e5e4');
      ctx.lineWidth = 1.8 * scale;
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.58, reachY + c * 2.5 * scale);
        ctx.lineTo(w * 0.78, reachY + (c * 3.5 + 3) * scale);
        ctx.stroke();
      }
      break;
    }

    case 'skeleton': {
      const bone = pick('#e2dccd');
      const shade = pick('#9e9584');
      drawFlowingCape(ctx, -w * 0.05, -h * 0.72 + bob, w * 0.9, h * 0.68, t, pick('#3a1c24'));
      drawBipedLegs(ctx, -h * 0.38, w, stridePhase, isMoving, isAirborne, bone, shade, 3.6 * scale);

      // Spine & Gothic Ribcage
      limb(ctx, 0, -h * 0.38, 0, -h * 0.74 + bob, 4 * scale, shade);
      for (let r = 0; r < 3; r++) {
        const ry = -h * (0.68 - r * 0.09) + bob;
        limb(ctx, -w * 0.28, ry, w * 0.28, ry, 3 * scale, bone);
      }
      // Pelvis
      roundedPoly(ctx, [[-w * 0.26, -h * 0.42], [w * 0.26, -h * 0.42], [w * 0.16, -h * 0.32], [-w * 0.16, -h * 0.32]], bone);

      // Detailed Skull & Cracked Helm Brow
      roundedPoly(
        ctx,
        [
          [-w * 0.26, -h * 0.98 + bob],
          [w * 0.28, -h * 0.98 + bob],
          [w * 0.34, -h * 0.78 + bob],
          [w * 0.22, -h * 0.71 + bob],
          [-w * 0.16, -h * 0.72 + bob],
        ],
        bone
      );
      // Hollow jaw teeth
      ctx.fillStyle = '#0f1117';
      ctx.fillRect(w * 0.02, -h * 0.78 + bob, w * 0.26, h * 0.06);
      drawEyeGlow(ctx, w * 0.16, -h * 0.87 + bob, 2.8 * scale, enemy.alerted ? '#ff334b' : '#fbbf24');

      // Throwing arm holding a bone raised high when telegraphing
      const throwX = isCharging ? -w * 0.22 : w * 0.38;
      const throwY = isCharging ? -h * 1.04 + bob : -h * 0.62 + bob;
      limb(ctx, w * 0.1, -h * 0.68 + bob, throwX, throwY, 3.2 * scale, bone);
      // Held Bone Club/Projectile
      ctx.save();
      ctx.translate(throwX, throwY);
      ctx.rotate(isCharging ? -0.8 : 0.4);
      ctx.fillStyle = bone;
      ctx.fillRect(-3 * scale, -10 * scale, 5 * scale, 16 * scale);
      ctx.beginPath();
      ctx.arc(-1 * scale, -10 * scale, 3.2 * scale, 0, Math.PI * 2);
      ctx.arc(-1 * scale, 6 * scale, 3.2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'bat': {
      const flap = Math.sin(t * (isCharging ? 28 : 16)) * h * 0.52;
      const membrane = pick('#4c2661');
      const fur = pick('#2b1838');
      drawBatWing(ctx, -w * 0.1, -h * 0.5, -1, w * 0.88, h * 0.82, flap, membrane, pick('#7e4b96'));
      drawBatWing(ctx, w * 0.1, -h * 0.5, 1, w * 0.88, h * 0.82, flap, membrane, pick('#7e4b96'));

      // Furry body + pointed bat ears + fangs
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.48, w * 0.28, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = fur;
      ctx.fill();
      ctx.strokeStyle = '#090b12';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pointed ears
      roundedPoly(ctx, [[-w * 0.18, -h * 0.72], [-w * 0.24, -h * 1.05], [-w * 0.04, -h * 0.8]], fur);
      roundedPoly(ctx, [[w * 0.04, -h * 0.8], [w * 0.24, -h * 1.05], [w * 0.2, -h * 0.72]], fur);

      // Tiny white fangs
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(w * 0.04, -h * 0.36, 2 * scale, 4 * scale);
      ctx.fillRect(w * 0.14, -h * 0.36, 2 * scale, 4 * scale);
      drawEyeGlow(ctx, w * 0.12, -h * 0.58, 2.8 * scale, isCharging ? '#fde047' : '#ff334b');
      break;
    }

    case 'knight': {
      const steel = pick('#75849c');
      const darkSteel = pick('#343e52');
      const plume = pick('#c82333');
      drawFlowingCape(ctx, -w * 0.08, -h * 0.76 + bob, w * 0.92, h * 0.72, t, pick('#611420'), '#e5a93c');
      drawBipedLegs(ctx, -h * 0.36, w, stridePhase, isMoving, isAirborne, darkSteel, steel, 5.5 * scale);

      // Gothic Breastplate & Heraldic Tabard
      roundedPoly(
        ctx,
        [
          [-w * 0.4, -h * 0.76 + bob],
          [w * 0.4, -h * 0.76 + bob],
          [w * 0.32, -h * 0.32 + bob],
          [-w * 0.32, -h * 0.32 + bob],
        ],
        steel
      );
      ctx.fillStyle = pick('#8f1d2c');
      ctx.fillRect(-w * 0.16, -h * 0.68 + bob, w * 0.32, h * 0.38);
      ctx.fillStyle = '#e5a93c';
      ctx.fillRect(-w * 0.04, -h * 0.64 + bob, w * 0.08, h * 0.26);

      // Pauldron
      ctx.beginPath();
      ctx.arc(-w * 0.32, -h * 0.72 + bob, w * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = darkSteel;
      ctx.fill();
      ctx.strokeStyle = '#090b12';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Plumed Sallet Helm
      roundedPoly(
        ctx,
        [
          [-w * 0.28, -h * 1.0 + bob],
          [w * 0.26, -h * 1.0 + bob],
          [w * 0.36, -h * 0.84 + bob],
          [w * 0.22, -h * 0.74 + bob],
          [-w * 0.28, -h * 0.74 + bob],
        ],
        steel
      );
      // Sweeping crimson crest plume
      roundedPoly(
        ctx,
        [
          [-w * 0.05, -h * 1.0 + bob],
          [-w * 0.45, -h * 1.15 + bob],
          [-w * 0.6, -h * 0.96 + bob],
          [-w * 0.22, -h * 0.92 + bob],
        ],
        plume
      );
      // Glowing visor slit
      ctx.fillStyle = '#090b12';
      ctx.fillRect(w * 0.02, -h * 0.89 + bob, w * 0.28, 4 * scale);
      drawEyeGlow(ctx, w * 0.18, -h * 0.87 + bob, 2.2 * scale, enemy.alerted ? '#ff334b' : '#93c5fd');

      // Ornate Halberd Polearm (tilts forward when charging/lunging)
      ctx.save();
      ctx.translate(w * 0.22, -h * 0.58 + bob + windupLift * 0.5);
      ctx.rotate(isLunging ? 1.15 : isCharging ? -0.45 : 0.22);
      limb(ctx, 0, h * 0.45, 0, -h * 0.58, 3.6 * scale, '#6e4e37');
      // Axe-blade + spearhead
      roundedPoly(
        ctx,
        [
          [0, -h * 0.74],
          [w * 0.14, -h * 0.5],
          [w * 0.44, -h * 0.42],
          [w * 0.34, -h * 0.22],
          [0, -h * 0.28],
        ],
        pick('#e2e8f0')
      );
      ctx.restore();

      // Front Tower Shield (visibly raised when shieldActive is true!)
      if (enemy.shieldActive) {
        drawTowerShield(
          ctx,
          w * 0.42,
          -h * 0.5 + bob,
          w * 0.44,
          h * 0.46,
          darkSteel,
          '#cbd5e1',
          '#e5a93c',
          true
        );
      }
      break;
    }

    // =========================================================================
    // GOBLIN WAR-CAMP — REGULAR ENEMIES (5 DISTINCT CLASSES)
    // =========================================================================
    case 'goblin_grunt': {
      const skin = pick('#5fa143');
      const tunic = pick('#4e3623');
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase * 1.2, isMoving, isAirborne, tunic, '#291d14', 4 * scale);

      // Hunched ragged tunic & war-belt
      roundedPoly(ctx, [[-w * 0.36, -h * 0.66 + bob], [w * 0.34, -h * 0.64 + bob], [w * 0.28, -h * 0.3], [-w * 0.3, -h * 0.3]], tunic);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-w * 0.32, -h * 0.42 + bob, w * 0.62, 4 * scale);

      // Pointy long goblin ear + cheeky fierce head + warpaint
      roundedPoly(ctx, [[-w * 0.22, -h * 0.84 + bob], [-w * 0.74, -h * 0.98 + bob], [-w * 0.16, -h * 0.72 + bob]], skin);
      roundedPoly(ctx, [[-w * 0.26, -h * 0.98 + bob], [w * 0.3, -h * 0.96 + bob], [w * 0.36, -h * 0.68 + bob], [-w * 0.24, -h * 0.66 + bob]], skin);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, -h * 0.8 + bob, w * 0.24, 3 * scale);
      drawEyeGlow(ctx, w * 0.14, -h * 0.87 + bob, 2.6 * scale, isCharging ? '#ff334b' : '#fde047');

      // Jagged iron shiv thrusting forward
      const armY = -h * 0.5 + bob + windupLift * 0.5;
      limb(ctx, w * 0.12, -h * 0.56 + bob, w * 0.42, armY, 3.6 * scale, skin);
      roundedPoly(ctx, [[w * 0.42, armY - 4 * scale], [w * 0.98, armY], [w * 0.42, armY + 4 * scale]], pick('#cbd5e1'));
      break;
    }

    case 'goblin_archer': {
      const skin = pick('#528a3d');
      const cloak = pick('#253b25');
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase, isMoving, isAirborne, '#2b241c', '#1a1510', 3.8 * scale);

      // Leaf-camo hood & quiver on back
      roundedPoly(ctx, [[-w * 0.52, -h * 0.84 + bob], [-w * 0.3, -h * 0.82 + bob], [-w * 0.22, -h * 0.42 + bob], [-w * 0.44, -h * 0.44 + bob]], '#6b4226');
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-w * 0.5, -h * 0.92 + bob, 5 * scale, 6 * scale);
      ctx.fillRect(-w * 0.42, -h * 0.94 + bob, 5 * scale, 6 * scale);

      roundedPoly(ctx, [[-w * 0.34, -h * 0.72 + bob], [w * 0.32, -h * 0.72 + bob], [w * 0.38, -h * 0.28], [-w * 0.36, -h * 0.28]], cloak);
      roundedPoly(ctx, [[-w * 0.36, -h * 1.0 + bob], [w * 0.3, -h * 0.98 + bob], [w * 0.34, -h * 0.7 + bob], [-w * 0.36, -h * 0.7 + bob]], cloak);
      ctx.fillStyle = skin;
      ctx.fillRect(-w * 0.06, -h * 0.92 + bob, w * 0.34, h * 0.22);
      drawEyeGlow(ctx, w * 0.16, -h * 0.84 + bob, 2.5 * scale, isCharging ? '#fef08a' : '#facc15');

      // Drawn Recurve Bow (bends tightly when charging!)
      const pull = isCharging ? chargeProg * 9 * scale : 2 * scale;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 3.2 * scale;
      ctx.beginPath();
      ctx.arc(w * 0.24, -h * 0.56 + bob, h * 0.3, -Math.PI * 0.46, Math.PI * 0.46);
      ctx.stroke();
      // Bowstring
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.24, -h * 0.84 + bob);
      ctx.lineTo(w * 0.22 - pull, -h * 0.56 + bob);
      ctx.lineTo(w * 0.24, -h * 0.28 + bob);
      ctx.stroke();
      // Arrow
      ctx.fillStyle = isCharging ? '#fef08a' : '#e2e8f0';
      ctx.fillRect(w * 0.18 - pull, -h * 0.58 + bob, w * 0.65, 2.5 * scale);
      break;
    }

    case 'goblin_bomber': {
      const skin = pick('#6ba342');
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase, isMoving, isAirborne, '#36261d', '#1c140f', 4 * scale);

      // Strapped wooden powder keg on back
      roundedPoly(ctx, [[-w * 0.64, -h * 0.78 + bob], [-w * 0.24, -h * 0.78 + bob], [-w * 0.24, -h * 0.34 + bob], [-w * 0.64, -h * 0.34 + bob]], '#78350f');
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-w * 0.64, -h * 0.6 + bob, w * 0.4, 4 * scale);

      roundedPoly(ctx, [[-w * 0.34, -h * 0.68 + bob], [w * 0.34, -h * 0.68 + bob], [w * 0.32, -h * 0.3], [-w * 0.32, -h * 0.3]], '#3b2b22');
      // Head + Oversized Brass Aviator Goggles
      roundedPoly(ctx, [[-w * 0.26, -h * 0.98 + bob], [w * 0.28, -h * 0.96 + bob], [w * 0.32, -h * 0.68 + bob], [-w * 0.26, -h * 0.68 + bob]], skin);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-w * 0.04, -h * 0.9 + bob, w * 0.36, h * 0.14);
      ctx.fillStyle = isCharging ? '#fef08a' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(w * 0.18, -h * 0.83 + bob, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Sputtering black-powder bomb raised high!
      const bombY = isCharging ? -h * 1.16 + bob : -h * 0.74 + bob;
      limb(ctx, w * 0.12, -h * 0.58 + bob, w * 0.3, bombY + 6 * scale, 3.6 * scale, skin);
      ctx.beginPath();
      ctx.arc(w * 0.32, bombY, 7.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#18181b';
      ctx.fill();
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      drawEyeGlow(ctx, w * 0.35, bombY - 9 * scale, (isCharging ? 4.5 : 3) * scale, '#f97316');
      break;
    }

    case 'goblin_shaman': {
      const hover = Math.sin(t * 4.5) * 5 * scale;
      const robe = pick('#153d33');
      // Floating emerald talisman motes
      for (let i = 0; i < 2; i++) {
        const a = t * 3.5 + i * Math.PI;
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * w * 0.62, -h * 0.55 + hover + Math.sin(a) * 8 * scale, 3.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      roundedPoly(
        ctx,
        [
          [-w * 0.38, -h * 0.74 + hover],
          [w * 0.36, -h * 0.74 + hover],
          [w * 0.48, -h * 0.06 + hover],
          [0, -h * 0.18 + hover],
          [-w * 0.52, -h * 0.06 + hover],
        ],
        robe
      );
      // Feathered Tribal Beast-Skull Mask
      roundedPoly(ctx, [[-w * 0.28, -h * 1.0 + hover], [w * 0.3, -h * 1.0 + hover], [w * 0.34, -h * 0.7 + hover], [-w * 0.26, -h * 0.7 + hover]], pick('#e7e5e4'));
      // Feathers
      roundedPoly(ctx, [[-w * 0.24, -h * 1.0 + hover], [-w * 0.42, -h * 1.2 + hover], [-w * 0.08, -h * 1.0 + hover]], '#10b981');
      roundedPoly(ctx, [[0, -h * 1.0 + hover], [-w * 0.06, -h * 1.24 + hover], [w * 0.14, -h * 1.0 + hover]], '#f59e0b');
      drawEyeGlow(ctx, w * 0.14, -h * 0.85 + hover, 3 * scale, '#10b981');

      // Bone Totem Staff
      limb(ctx, w * 0.38, -h * 0.08 + hover, w * 0.42, -h * 0.94 + hover + windupLift * 0.4, 3.6 * scale, '#85654c');
      drawEyeGlow(ctx, w * 0.42, -h * 0.96 + hover + windupLift * 0.4, (isCharging ? 7.5 : 5) * scale, '#34d399');
      break;
    }

    case 'goblin_brute': {
      const skin = pick('#4c7535');
      const iron = pick('#475569');
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase, isMoving, isAirborne, '#3a2b22', iron, 7 * scale);

      // Massive hunched muscular torso
      roundedPoly(ctx, [[-w * 0.48, -h * 0.8 + bob], [w * 0.48, -h * 0.78 + bob], [w * 0.36, -h * 0.3], [-w * 0.4, -h * 0.3]], skin);
      // Leather harness + spiked shoulder pad
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, -h * 0.74 + bob);
      ctx.lineTo(w * 0.34, -h * 0.36 + bob);
      ctx.stroke();
      roundedPoly(ctx, [[-w * 0.56, -h * 0.86 + bob], [-w * 0.12, -h * 0.84 + bob], [-w * 0.18, -h * 0.62 + bob], [-w * 0.54, -h * 0.64 + bob]], iron);
      // Pauldron spikes
      roundedPoly(ctx, [[-w * 0.46, -h * 0.86 + bob], [-w * 0.52, -h * 1.0 + bob], [-w * 0.36, -h * 0.86 + bob]], '#e2e8f0');

      // Tusked Hobgoblin Head
      roundedPoly(ctx, [[-w * 0.24, -h * 1.0 + bob], [w * 0.3, -h * 0.98 + bob], [w * 0.34, -h * 0.74 + bob], [-w * 0.22, -h * 0.74 + bob]], skin);
      // Ivory tusks
      roundedPoly(ctx, [[w * 0.16, -h * 0.76 + bob], [w * 0.26, -h * 0.86 + bob], [w * 0.26, -h * 0.74 + bob]], '#fef3c7');
      drawEyeGlow(ctx, w * 0.16, -h * 0.89 + bob, 3 * scale, '#ff334b');

      // Giant Iron-Studded War Club
      const clubLift = isCharging ? -h * 0.26 : isSwinging ? h * 0.16 : 0;
      limb(ctx, w * 0.26, -h * 0.54 + bob, w * 0.44, -h * 0.64 + bob + clubLift, 6.5 * scale, skin);
      roundedPoly(
        ctx,
        [
          [w * 0.36, -h * 0.32 + bob + clubLift],
          [w * 0.52, -h * 0.32 + bob + clubLift],
          [w * 0.64, -h * 0.98 + bob + clubLift],
          [w * 0.3, -h * 0.98 + bob + clubLift],
        ],
        '#5c3c24'
      );
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(w * 0.32, -h * 0.92 + bob + clubLift, w * 0.3, 4 * scale);
      ctx.fillRect(w * 0.34, -h * 0.78 + bob + clubLift, w * 0.26, 4 * scale);
      break;
    }

    // =========================================================================
    // WEEPING NECROPOLIS & BRIMSTONE — REGULAR ENEMIES
    // =========================================================================
    case 'grave_hound': {
      // Quadruped Skeletal-Pelt Crypt Hound with 4-leg gallop cycle!
      const fur = pick('#2b343b');
      const bone = pick('#e2ded5');
      const gallop = isMoving || isLunging ? Math.sin(t * 18) : 0;

      // 4 articulated hound legs
      limb(ctx, -w * 0.34, -h * 0.48, -w * 0.44 - gallop * 8 * scale, 0, 4.2 * scale, fur);
      limb(ctx, -w * 0.24, -h * 0.48, -w * 0.22 + gallop * 8 * scale, 0, 4 * scale, '#1c2329');
      limb(ctx, w * 0.22, -h * 0.48, w * 0.36 + gallop * 9 * scale, 0, 4.2 * scale, fur);
      limb(ctx, w * 0.14, -h * 0.48, w * 0.12 - gallop * 7 * scale, 0, 4 * scale, '#1c2329');

      // Tail whip
      limb(ctx, -w * 0.44, -h * 0.64, -w * 0.68, -h * 0.82 + Math.sin(t * 10) * 5 * scale, 3 * scale, bone);

      // Lean body + exposed ribs
      roundedPoly(
        ctx,
        [
          [-w * 0.48, -h * 0.7 + bob * 0.4],
          [w * 0.32, -h * 0.76 + bob * 0.4],
          [w * 0.34, -h * 0.4 + bob * 0.4],
          [-w * 0.44, -h * 0.42 + bob * 0.4],
        ],
        fur
      );
      ctx.fillStyle = bone;
      for (let r = 0; r < 3; r++) {
        ctx.fillRect(-w * 0.26 + r * w * 0.14, -h * 0.64 + bob * 0.4, 3 * scale, h * 0.2);
      }

      // Snarling Bone Skull Muzzle + Spectral Teal Mane
      roundedPoly(ctx, [[w * 0.14, -h * 0.96 + bob * 0.3], [w * 0.62, -h * 0.84 + bob * 0.3], [w * 0.56, -h * 0.58 + bob * 0.3], [w * 0.16, -h * 0.62 + bob * 0.3]], bone);
      // Spectral mane spikes
      roundedPoly(ctx, [[w * 0.04, -h * 0.74], [w * 0.14, -h * 1.12], [w * 0.28, -h * 0.88]], '#2dd4bf');
      drawEyeGlow(ctx, w * 0.36, -h * 0.82 + bob * 0.3, 2.8 * scale, isCharging ? '#ff334b' : '#2dd4bf');
      break;
    }

    case 'wraith': {
      const hover = Math.sin(t * 4.5) * 6 * scale;
      ctx.save();
      ctx.globalAlpha *= isCharging ? 0.96 : 0.78;
      // Trailing ectoplasmic wisps
      roundedPoly(
        ctx,
        [
          [-w * 0.38, -h * 0.82 + hover],
          [w * 0.34, -h * 0.82 + hover],
          [w * 0.48, -h * 0.04 + hover],
          [w * 0.14, -h * 0.2 + hover + Math.sin(t * 8) * 4 * scale],
          [-w * 0.16, -h * 0.04 + hover],
          [-w * 0.52, -h * 0.18 + hover],
        ],
        pick('#163b4d')
      );
      // Hood & Shadow Void
      roundedPoly(ctx, [[-w * 0.3, -h * 1.02 + hover], [w * 0.28, -h * 1.0 + hover], [w * 0.34, -h * 0.72 + hover], [-w * 0.32, -h * 0.72 + hover]], '#0a1622');
      drawEyeGlow(ctx, w * 0.12, -h * 0.86 + hover, 3.2 * scale, '#5eead4');
      // Clawing spectral hands
      limb(ctx, w * 0.1, -h * 0.64 + hover, w * 0.52, -h * 0.58 + hover + windupLift * 0.4, 3.5 * scale, '#5eead4', '#0e2c3a');
      ctx.restore();
      break;
    }

    case 'gargoyle': {
      const hover = Math.sin(t * 4.8) * 5 * scale;
      const flap = Math.sin(t * 13) * 12 * scale;
      const stone = pick('#57606f');
      const darkStone = pick('#333b48');
      drawBatWing(ctx, -w * 0.08, -h * 0.56 + hover, -1, w * 0.85, h * 0.66, flap, darkStone, '#747d8c');
      drawBatWing(ctx, w * 0.08, -h * 0.56 + hover, 1, w * 0.85, h * 0.66, flap, darkStone, '#747d8c');

      roundedPoly(ctx, [[-w * 0.3, -h * 0.82 + hover], [w * 0.3, -h * 0.82 + hover], [w * 0.24, -h * 0.18 + hover], [-w * 0.24, -h * 0.18 + hover]], stone);
      // Glowing amber rune on chest
      ctx.fillStyle = isCharging ? '#fef08a' : '#f59e0b';
      ctx.fillRect(-w * 0.08, -h * 0.64 + hover, w * 0.16, h * 0.16);
      // Curled stone horns
      roundedPoly(ctx, [[-w * 0.22, -h * 0.82 + hover], [-w * 0.42, -h * 1.06 + hover], [-w * 0.1, -h * 0.88 + hover]], '#94a3b8');
      roundedPoly(ctx, [[w * 0.1, -h * 0.88 + hover], [w * 0.42, -h * 1.06 + hover], [w * 0.22, -h * 0.82 + hover]], '#94a3b8');
      drawEyeGlow(ctx, w * 0.12, -h * 0.72 + hover, 3 * scale, '#facc15');
      break;
    }

    case 'acolyte': {
      const robe = pick('#183633');
      drawBipedLegs(ctx, -h * 0.26, w, stridePhase, isMoving, isAirborne, '#0f201e', '#0a1413', 4 * scale);
      roundedPoly(ctx, [[-w * 0.36, -h * 0.74 + bob], [w * 0.34, -h * 0.74 + bob], [w * 0.44, -h * 0.04], [-w * 0.42, -h * 0.04]], robe);
      // Teal ritual stole
      ctx.fillStyle = '#2dd4bf';
      ctx.fillRect(-w * 0.08, -h * 0.72 + bob, w * 0.16, h * 0.56);
      // Pointed cultist hood + bone mask
      roundedPoly(ctx, [[-w * 0.28, -h * 0.74 + bob], [0, -h * 1.1 + bob], [w * 0.3, -h * 0.74 + bob]], '#0e1f1d');
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(0, -h * 0.92 + bob, w * 0.24, h * 0.16);
      drawEyeGlow(ctx, w * 0.14, -h * 0.86 + bob, 2.6 * scale, '#2dd4bf');

      // Swinging Soul-Lantern Staff
      limb(ctx, w * 0.34, -h * 0.06, w * 0.36, -h * 0.92 + bob + windupLift * 0.4, 3.2 * scale, '#78716c');
      const sway = Math.sin(t * 5) * 4 * scale;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.36, -h * 0.9 + bob + windupLift * 0.4);
      ctx.lineTo(w * 0.54 + sway, -h * 0.76 + bob + windupLift * 0.4);
      ctx.stroke();
      drawEyeGlow(ctx, w * 0.54 + sway, -h * 0.74 + bob + windupLift * 0.4, (isCharging ? 6.5 : 4.5) * scale, '#2dd4bf');
      break;
    }

    case 'ember_imp': {
      const hover = Math.sin(t * 7) * 5 * scale;
      const flap = Math.sin(t * 18) * 11 * scale;
      drawBatWing(ctx, -w * 0.08, -h * 0.52 + hover, -1, w * 0.8, h * 0.72, flap, pick('#9a3412'), '#fb923c');
      drawBatWing(ctx, w * 0.08, -h * 0.52 + hover, 1, w * 0.8, h * 0.72, flap, pick('#9a3412'), '#fb923c');
      // Barbed demon tail
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.6 * scale;
      ctx.beginPath();
      ctx.moveTo(-w * 0.16, -h * 0.24 + hover);
      ctx.quadraticCurveTo(-w * 0.6, -h * 0.08 + hover, -w * 0.45, -h * 0.36 + hover + Math.sin(t * 9) * 5);
      ctx.stroke();

      roundedPoly(ctx, [[-w * 0.28, -h * 0.82 + hover], [w * 0.28, -h * 0.82 + hover], [w * 0.24, -h * 0.2 + hover], [-w * 0.24, -h * 0.2 + hover]], pick('#dc2626'));
      // Glowing lava belly
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(w * 0.04, -h * 0.44 + hover, w * 0.16, h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Demon horns
      roundedPoly(ctx, [[-w * 0.18, -h * 0.82 + hover], [-w * 0.32, -h * 1.06 + hover], [-w * 0.04, -h * 0.84 + hover]], '#291518');
      roundedPoly(ctx, [[w * 0.04, -h * 0.84 + hover], [w * 0.32, -h * 1.06 + hover], [w * 0.18, -h * 0.82 + hover]], '#291518');
      drawEyeGlow(ctx, w * 0.12, -h * 0.68 + hover, 3 * scale, '#fef08a');
      break;
    }

    case 'obsidian_guard': {
      const basalt = pick('#231b21');
      const lava = '#f97316';
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase, isMoving, isAirborne, basalt, '#140e12', 6 * scale);
      roundedPoly(ctx, [[-w * 0.44, -h * 0.78 + bob], [w * 0.44, -h * 0.78 + bob], [w * 0.36, -h * 0.3], [-w * 0.36, -h * 0.3]], basalt);
      // Glowing volcanic fissure veins
      ctx.strokeStyle = lava;
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(-w * 0.26, -h * 0.68 + bob);
      ctx.lineTo(0, -h * 0.56 + bob);
      ctx.lineTo(w * 0.24, -h * 0.66 + bob);
      ctx.moveTo(0, -h * 0.56 + bob);
      ctx.lineTo(0, -h * 0.36 + bob);
      ctx.stroke();

      // Crowned Basalt Helm
      roundedPoly(ctx, [[-w * 0.3, -h * 1.02 + bob], [w * 0.3, -h * 1.02 + bob], [w * 0.34, -h * 0.76 + bob], [-w * 0.3, -h * 0.76 + bob]], basalt);
      drawEyeGlow(ctx, w * 0.14, -h * 0.89 + bob, 3.2 * scale, '#f97316');

      // Blazing Volcanic Greatsword
      ctx.save();
      ctx.translate(w * 0.24, -h * 0.56 + bob + windupLift * 0.5);
      ctx.rotate(isLunging ? 1.1 : isCharging ? -0.55 : 0.18);
      roundedPoly(ctx, [[-3 * scale, 10 * scale], [3 * scale, 10 * scale], [5 * scale, -h * 0.58], [0, -h * 0.68], [-5 * scale, -h * 0.58]], pick('#fb923c'), '#7c2d12', 1.6);
      ctx.restore();

      if (enemy.shieldActive) {
        drawTowerShield(ctx, w * 0.44, -h * 0.5 + bob, w * 0.44, h * 0.48, basalt, '#f97316', '#fef08a', true);
      }
      break;
    }

    // =========================================================================
    // NOCTURNE CASTLE — 5 UNIQUE BOSSES
    // =========================================================================
    case 'boss_vampire_duelist': {
      // Baron Bloodfang — Aristocratic Opera-Cape Fencing Vampire
      drawFlowingCape(ctx, -w * 0.06, -h * 0.82 + bob, w * 1.15, h * 0.82, t * 1.2, pick('#5c0f24'), '#e5a93c');
      drawBipedLegs(ctx, -h * 0.38, w, stridePhase, isMoving, isAirborne, '#1b1624', '#0f0c14', 5.2 * scale);

      // Tailored Gothic Coat + High Crimson Opera Collar
      roundedPoly(ctx, [[-w * 0.32, -h * 0.76 + bob], [w * 0.32, -h * 0.76 + bob], [w * 0.26, -h * 0.34], [-w * 0.28, -h * 0.34]], pick('#1d1828'));
      roundedPoly(ctx, [[-w * 0.34, -h * 0.76 + bob], [-w * 0.48, -h * 1.02 + bob], [-w * 0.16, -h * 0.82 + bob]], pick('#7f122d'));
      ctx.fillStyle = '#e5a93c';
      ctx.fillRect(-w * 0.26, -h * 0.54 + bob, w * 0.52, 4 * scale);

      // Pale Noble Head + Swept Silver Hair
      roundedPoly(ctx, [[-w * 0.22, -h * 0.98 + bob], [w * 0.24, -h * 0.98 + bob], [w * 0.26, -h * 0.76 + bob], [-w * 0.2, -h * 0.76 + bob]], pick('#ebe4dc'));
      roundedPoly(ctx, [[-w * 0.3, -h * 0.94 + bob], [-w * 0.08, -h * 1.08 + bob], [w * 0.28, -h * 1.0 + bob], [-w * 0.24, -h * 0.86 + bob]], '#cbd5e1');
      drawEyeGlow(ctx, w * 0.12, -h * 0.88 + bob, 3.2 * scale, '#ff334b');

      // Baroque Crimson Rapier Thrust
      const thrustX = isLunging ? w * 1.25 : isCharging ? w * 0.55 : w * 0.95;
      const thrustY = -h * 0.58 + bob + (isCharging ? -6 * scale : 0);
      limb(ctx, w * 0.14, -h * 0.64 + bob, w * 0.36, thrustY, 4.5 * scale, '#1d1828');
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.2 * scale;
      ctx.beginPath();
      ctx.moveTo(w * 0.34, thrustY);
      ctx.lineTo(thrustX, thrustY);
      ctx.stroke();
      ctx.strokeStyle = '#fff1f2';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, thrustY);
      ctx.lineTo(thrustX, thrustY);
      ctx.stroke();
      // Gold basket hilt
      ctx.fillStyle = '#e5a93c';
      ctx.beginPath();
      ctx.arc(w * 0.36, thrustY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'boss_colossus': {
      // Clockwork Colossus — Brass & Iron Automaton with Spinning Chest Gears!
      const iron = pick('#505b70');
      const dark = pick('#242936');
      const brass = pick('#d99b38');
      drawBipedLegs(ctx, -h * 0.32, w, stridePhase * 0.8, isMoving, isAirborne, dark, iron, 9.5 * scale);

      // Colossal Boiler-Plate Chest
      roundedPoly(ctx, [[-w * 0.52, -h * 0.82 + bob], [w * 0.52, -h * 0.82 + bob], [w * 0.44, -h * 0.28], [-w * 0.44, -h * 0.28]], iron);
      // Heavy Pauldrons with Steam Chimneys
      roundedPoly(ctx, [[-w * 0.64, -h * 0.86 + bob], [-w * 0.3, -h * 0.86 + bob], [-w * 0.32, -h * 0.58 + bob], [-w * 0.62, -h * 0.62 + bob]], dark);
      roundedPoly(ctx, [[w * 0.3, -h * 0.86 + bob], [w * 0.64, -h * 0.86 + bob], [w * 0.62, -h * 0.62 + bob], [w * 0.32, -h * 0.58 + bob]], dark);

      // Rotating Brass Clockwork Gear Core!
      ctx.save();
      ctx.translate(0, -h * 0.56 + bob);
      ctx.rotate(t * (isCharging ? 9 : 2.5));
      ctx.strokeStyle = brass;
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.2, 0, Math.PI * 2);
      ctx.stroke();
      for (let g = 0; g < 6; g++) {
        const ga = (g * Math.PI) / 3;
        ctx.fillStyle = brass;
        ctx.fillRect(Math.cos(ga) * w * 0.2 - 3 * scale, Math.sin(ga) * w * 0.2 - 3 * scale, 6 * scale, 6 * scale);
      }
      drawEyeGlow(ctx, 0, 0, 5 * scale, '#f59e0b');
      ctx.restore();

      // Horned Automaton Greathelm
      roundedPoly(ctx, [[-w * 0.26, -h * 1.02 + bob], [w * 0.26, -h * 1.02 + bob], [w * 0.3, -h * 0.8 + bob], [-w * 0.3, -h * 0.8 + bob]], iron);
      roundedPoly(ctx, [[-w * 0.28, -h * 0.96 + bob], [-w * 0.48, -h * 1.18 + bob], [-w * 0.16, -h * 1.0 + bob]], '#cbd5e1');
      roundedPoly(ctx, [[w * 0.16, -h * 1.0 + bob], [w * 0.48, -h * 1.18 + bob], [w * 0.28, -h * 0.96 + bob]], '#cbd5e1');
      drawEyeGlow(ctx, w * 0.12, -h * 0.9 + bob, 4 * scale, '#f59e0b');

      // Chained Wrecking Mace
      const maceY = -h * 0.64 + bob + windupLift;
      limb(ctx, w * 0.46, -h * 0.66 + bob, w * 0.54, maceY, 7 * scale, dark);
      limb(ctx, w * 0.54, maceY, w * 0.56, maceY - h * 0.36, 4.5 * scale, '#6e4e37');
      ctx.beginPath();
      ctx.arc(w * 0.56, maceY - h * 0.4, w * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = iron;
      ctx.fill();
      ctx.strokeStyle = brass;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      break;
    }

    case 'boss_malakor': {
      // Hollow Inquisitor — Levitating Cathedral Arch-Lich with Rotating Triple-Ring Halo!
      const hover = Math.sin(t * 3.8) * 6 * scale;
      // Rotating arcane halo
      ctx.save();
      ctx.translate(0, -h * 0.82 + hover);
      ctx.rotate(t * 1.6);
      ctx.strokeStyle = '#d946ef';
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * w * 0.6, Math.sin(a) * w * 0.6, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Ornate Liturgical Vestments
      roundedPoly(
        ctx,
        [
          [-w * 0.44, -h * 0.8 + hover],
          [w * 0.42, -h * 0.8 + hover],
          [w * 0.58, -h * 0.04 + hover],
          [0, -h * 0.16 + hover],
          [-w * 0.62, -h * 0.04 + hover],
        ],
        pick('#45102d')
      );
      ctx.fillStyle = '#e5a93c';
      ctx.fillRect(-w * 0.1, -h * 0.78 + hover, w * 0.2, h * 0.6);

      // Tall Inquisitor Mitre Crown & Shadowed Visage
      roundedPoly(ctx, [[-w * 0.28, -h * 0.78 + hover], [-w * 0.18, -h * 1.18 + hover], [0, -h * 1.04 + hover], [w * 0.18, -h * 1.18 + hover], [w * 0.28, -h * 0.78 + hover]], pick('#210918'), '#e5a93c', 1.8);
      drawEyeGlow(ctx, w * 0.1, -h * 0.88 + hover, 4 * scale, '#ff2e63');

      // Floating Censer-Staff
      limb(ctx, w * 0.48, -h * 0.14 + hover, w * 0.52, -h * 0.92 + hover + windupLift * 0.5, 4 * scale, '#78716c');
      drawEyeGlow(ctx, w * 0.52, -h * 0.96 + hover + windupLift * 0.5, (isCharging ? 10 : 7) * scale, '#e879f9');
      break;
    }

    case 'boss_gargoyle_king': {
      // Obsidian Gargoyle Lord — Towering Winged Cathedral Stone Demon
      const hover = Math.sin(t * 4.2) * 6 * scale;
      const flap = Math.sin(t * 10.5) * 18 * scale;
      const stone = pick('#3e4756');
      drawBatWing(ctx, -w * 0.1, -h * 0.62 + hover, -1, w * 1.08, h * 0.74, flap, pick('#272e3a'), '#64748b');
      drawBatWing(ctx, w * 0.1, -h * 0.62 + hover, 1, w * 1.08, h * 0.74, flap, pick('#272e3a'), '#64748b');

      // Cracked Granite Musculature & Claws
      roundedPoly(ctx, [[-w * 0.42, -h * 0.8 + hover], [w * 0.42, -h * 0.8 + hover], [w * 0.3, -h * 0.16 + hover], [-w * 0.3, -h * 0.16 + hover]], stone);
      // Glowing Amber Crack Fissures
      ctx.strokeStyle = isCharging ? '#fef08a' : '#f59e0b';
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, -h * 0.72 + hover);
      ctx.lineTo(0, -h * 0.54 + hover);
      ctx.lineTo(w * 0.22, -h * 0.66 + hover);
      ctx.stroke();

      // Crowned Horned Stone Head
      roundedPoly(ctx, [[-w * 0.28, -h * 1.02 + hover], [w * 0.28, -h * 1.02 + hover], [w * 0.32, -h * 0.78 + hover], [-w * 0.28, -h * 0.78 + hover]], stone);
      roundedPoly(ctx, [[-w * 0.26, -h * 0.96 + hover], [-w * 0.54, -h * 1.24 + hover], [-w * 0.1, -h * 1.02 + hover]], '#cbd5e1');
      roundedPoly(ctx, [[w * 0.1, -h * 1.02 + hover], [w * 0.54, -h * 1.24 + hover], [w * 0.26, -h * 0.96 + hover]], '#cbd5e1');
      drawEyeGlow(ctx, w * 0.12, -h * 0.9 + hover, 4.2 * scale, '#facc15');
      break;
    }

    case 'boss_valerius': {
      // Lord Valerius · Crimson Sovereign (HUGE Final Boss!)
      const flap = Math.sin(t * 7.5) * 12 * scale;
      if (enemy.enraged) {
        // Phase II Unleashed Crimson Demon Wings!
        drawBatWing(ctx, -w * 0.1, -h * 0.68, -1, w * 1.05, h * 0.68, flap, '#7a0c21', '#ffd166');
        drawBatWing(ctx, w * 0.1, -h * 0.68, 1, w * 1.05, h * 0.68, flap, '#7a0c21', '#ffd166');
      }
      drawFlowingCape(ctx, -w * 0.08, -h * 0.88 + bob, w * 1.28, h * 0.88, t, pick('#6b0d1d'), '#ffd166');
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase * 0.8, isMoving, isAirborne, '#161220', '#2b1e2e', 8 * scale);

      // Sovereign Obsidian-Gold Plate Torso
      roundedPoly(ctx, [[-w * 0.42, -h * 0.82 + bob], [w * 0.42, -h * 0.82 + bob], [w * 0.34, -h * 0.28], [-w * 0.34, -h * 0.28]], pick('#1b1626'));
      // Gold rib filigree & ruby medallion
      ctx.fillStyle = '#e5a93c';
      ctx.fillRect(-w * 0.3, -h * 0.72 + bob, w * 0.6, 5 * scale);
      ctx.fillRect(-w * 0.24, -h * 0.56 + bob, w * 0.48, 4 * scale);
      drawEyeGlow(ctx, 0, -h * 0.66 + bob, 5.5 * scale, '#ff334b');

      // High Gothic Vampire Collar & Pale Crowned Visage
      roundedPoly(ctx, [[-w * 0.44, -h * 0.8 + bob], [-w * 0.58, -h * 1.06 + bob], [-w * 0.2, -h * 0.84 + bob]], '#6b0d1d', '#e5a93c', 1.8);
      roundedPoly(ctx, [[-w * 0.24, -h * 1.0 + bob], [w * 0.24, -h * 1.0 + bob], [w * 0.26, -h * 0.78 + bob], [-w * 0.24, -h * 0.78 + bob]], pick('#e6ded6'));
      // 3-Spire Blood-Gold Crown
      roundedPoly(
        ctx,
        [
          [-w * 0.28, -h * 0.98 + bob],
          [-w * 0.24, -h * 1.14 + bob],
          [-w * 0.08, -h * 1.04 + bob],
          [0, -h * 1.18 + bob],
          [w * 0.08, -h * 1.04 + bob],
          [w * 0.24, -h * 1.14 + bob],
          [w * 0.28, -h * 0.98 + bob],
        ],
        '#ffd166'
      );
      drawEyeGlow(ctx, w * 0.11, -h * 0.9 + bob, 4.2 * scale, '#ff334b');

      // Crimson Sovereign Claymore
      ctx.save();
      ctx.translate(w * 0.36, -h * 0.56 + bob + windupLift * 0.6);
      ctx.rotate(isCharging ? -0.6 : isSwinging ? 0.95 : 0.12);
      roundedPoly(ctx, [[-4 * scale, 12 * scale], [4 * scale, 12 * scale], [6 * scale, -h * 0.58], [0, -h * 0.72], [-6 * scale, -h * 0.58]], '#dc2626', '#ffd166', 1.8);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-14 * scale, 6 * scale, 28 * scale, 5 * scale);
      ctx.restore();
      break;
    }

    // =========================================================================
    // GOBLIN WAR-CAMP — 5 UNIQUE BOSSES
    // =========================================================================
    case 'boss_goblin_chief': {
      // Skritch the Knife-Chief — Dual-Scimitar Acrobatic Assassin
      drawFlowingCape(ctx, -w * 0.08, -h * 0.78 + bob, w * 1.1, h * 0.72, t * 1.4, pick('#8c1d28'));
      drawBipedLegs(ctx, -h * 0.36, w, stridePhase * 1.2, isMoving, isAirborne, '#292524', '#18181b', 5.5 * scale);
      roundedPoly(ctx, [[-w * 0.36, -h * 0.72 + bob], [w * 0.36, -h * 0.72 + bob], [w * 0.3, -h * 0.32], [-w * 0.32, -h * 0.32]], '#292524');
      ctx.fillStyle = '#e5a93c';
      ctx.fillRect(-w * 0.34, -h * 0.44 + bob, w * 0.68, 5 * scale);

      // Scarred Goblin Head + Red Bandana + Long Pointed Ears
      const skin = pick('#518f38');
      roundedPoly(ctx, [[-w * 0.24, -h * 0.86 + bob], [-w * 0.72, -h * 1.02 + bob], [-w * 0.16, -h * 0.74 + bob]], skin);
      roundedPoly(ctx, [[-w * 0.28, -h * 1.0 + bob], [w * 0.3, -h * 0.98 + bob], [w * 0.34, -h * 0.7 + bob], [-w * 0.26, -h * 0.7 + bob]], skin);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-w * 0.32, -h * 0.98 + bob, w * 0.66, h * 0.1);
      drawEyeGlow(ctx, w * 0.14, -h * 0.85 + bob, 3.5 * scale, '#facc15');

      // Dual Curved Scimitars
      const bladeY = -h * 0.56 + bob + windupLift * 0.5;
      roundedPoly(ctx, [[w * 0.24, bladeY], [w * 0.96, bladeY - 12 * scale], [w * 0.86, bladeY + 6 * scale], [w * 0.24, bladeY + 8 * scale]], '#e2e8f0');
      roundedPoly(ctx, [[-w * 0.24, bladeY + 8 * scale], [-w * 0.82, bladeY - 6 * scale], [-w * 0.72, bladeY + 10 * scale], [-w * 0.22, bladeY + 14 * scale]], '#94a3b8');
      break;
    }

    case 'boss_goblin_sapper': {
      // Bombo the Mad Sapper — Heavy Keg-Cannon Demolitionist
      const skin = pick('#5b943a');
      drawBipedLegs(ctx, -h * 0.32, w, stridePhase, isMoving, isAirborne, '#292524', '#18181b', 6 * scale);
      // Huge iron-hooped powder keg strapped on back
      roundedPoly(ctx, [[-w * 0.74, -h * 0.88 + bob], [-w * 0.24, -h * 0.88 + bob], [-w * 0.24, -h * 0.32 + bob], [-w * 0.74, -h * 0.32 + bob]], '#78350f');
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-w * 0.74, -h * 0.66 + bob, w * 0.5, 6 * scale);

      roundedPoly(ctx, [[-w * 0.38, -h * 0.72 + bob], [w * 0.38, -h * 0.72 + bob], [w * 0.36, -h * 0.3], [-w * 0.36, -h * 0.3]], '#3b2b22');
      roundedPoly(ctx, [[-w * 0.26, -h * 1.0 + bob], [w * 0.28, -h * 0.98 + bob], [w * 0.32, -h * 0.7 + bob], [-w * 0.26, -h * 0.7 + bob]], skin);
      // Glowing Brass Goggles
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-w * 0.06, -h * 0.92 + bob, w * 0.4, h * 0.14);
      drawEyeGlow(ctx, w * 0.18, -h * 0.85 + bob, 4.2 * scale, '#fef08a');

      // Hand-Held Iron Bomb Cannon
      const canY = -h * 0.52 + bob + windupLift * 0.4;
      roundedPoly(ctx, [[w * 0.08, canY - 10 * scale], [w * 0.76, canY - 14 * scale], [w * 0.76, canY + 12 * scale], [w * 0.08, canY + 8 * scale]], '#334155', '#f59e0b', 1.8);
      if (isCharging) {
        drawEyeGlow(ctx, w * 0.8, canY, 7 * scale, '#f97316');
      }
      break;
    }

    case 'boss_goblin_shaman': {
      // Hex-Lord Zog — Towering Antlered Skull Witch-King with 3 Orbiting Voodoo Totems!
      const hover = Math.sin(t * 3.8) * 6 * scale;
      for (let i = 0; i < 3; i++) {
        const a = t * 2.6 + (i * Math.PI * 2) / 3;
        const ox = Math.cos(a) * w * 0.72;
        const oy = -h * 0.62 + hover + Math.sin(a) * 14 * scale;
        drawEyeGlow(ctx, ox, oy, 5 * scale, '#34d399');
      }
      roundedPoly(ctx, [[-w * 0.44, -h * 0.78 + hover], [w * 0.4, -h * 0.78 + hover], [w * 0.56, -h * 0.04 + hover], [0, -h * 0.16 + hover], [-w * 0.6, -h * 0.04 + hover]], pick('#113b30'));
      // Antlered Giant Beast-Skull Mask
      roundedPoly(ctx, [[-w * 0.32, -h * 1.02 + hover], [w * 0.34, -h * 1.02 + hover], [w * 0.36, -h * 0.72 + hover], [-w * 0.3, -h * 0.72 + hover]], pick('#f5f5f4'));
      limb(ctx, -w * 0.28, -h * 0.98 + hover, -w * 0.56, -h * 1.28 + hover, 4 * scale, '#a8a29e');
      limb(ctx, w * 0.28, -h * 0.98 + hover, w * 0.56, -h * 1.28 + hover, 4 * scale, '#a8a29e');
      drawEyeGlow(ctx, w * 0.12, -h * 0.86 + hover, 4.2 * scale, '#10b981');

      limb(ctx, w * 0.48, -h * 0.1 + hover, w * 0.52, -h * 0.94 + hover + windupLift * 0.4, 4.5 * scale, '#785a46');
      drawEyeGlow(ctx, w * 0.52, -h * 0.98 + hover + windupLift * 0.4, (isCharging ? 10 : 7) * scale, '#34d399');
      break;
    }

    case 'boss_goblin_behemoth': {
      // Grimjaw the Siege-Hulk — Massive Battering-Ram Gauntlet Ogre
      const skin = pick('#3f692b');
      const iron = pick('#475569');
      drawBipedLegs(ctx, -h * 0.3, w, stridePhase * 0.8, isMoving, isAirborne, '#292524', iron, 9 * scale);
      roundedPoly(ctx, [[-w * 0.56, -h * 0.84 + bob], [w * 0.56, -h * 0.84 + bob], [w * 0.44, -h * 0.28], [-w * 0.46, -h * 0.28]], skin);
      // Spiked Siege Pauldrons
      roundedPoly(ctx, [[-w * 0.68, -h * 0.9 + bob], [-w * 0.24, -h * 0.86 + bob], [-w * 0.3, -h * 0.6 + bob], [-w * 0.66, -h * 0.64 + bob]], iron);
      roundedPoly(ctx, [[w * 0.24, -h * 0.86 + bob], [w * 0.68, -h * 0.9 + bob], [w * 0.66, -h * 0.64 + bob], [w * 0.3, -h * 0.6 + bob]], iron);

      // Iron-Jawed Head
      roundedPoly(ctx, [[-w * 0.28, -h * 1.02 + bob], [w * 0.3, -h * 1.02 + bob], [w * 0.34, -h * 0.78 + bob], [-w * 0.26, -h * 0.78 + bob]], skin);
      ctx.fillStyle = iron;
      ctx.fillRect(-w * 0.16, -h * 0.86 + bob, w * 0.48, h * 0.1);
      drawEyeGlow(ctx, w * 0.14, -h * 0.92 + bob, 4 * scale, '#ff334b');

      // Enormous Spiked Wrecking-Ram Gauntlet
      const fistY = -h * 0.48 + bob + windupLift * 0.7;
      roundedPoly(ctx, [[w * 0.34, fistY - 14 * scale], [w * 0.84, fistY - 16 * scale], [w * 0.88, fistY + 16 * scale], [w * 0.34, fistY + 14 * scale]], '#64748b', '#e5a93c', 2);
      break;
    }

    case 'boss_goblin_warlord': {
      // Warchief Kragmash · Goblin King (HUGE Final Boss!)
      const skin = pick('#3c6e29');
      const iron = pick('#334155');
      drawFlowingCape(ctx, -w * 0.1, -h * 0.86 + bob, w * 1.24, h * 0.86, t, pick('#7f1d1d'), '#f97316');
      drawBipedLegs(ctx, -h * 0.32, w, stridePhase * 0.75, isMoving, isAirborne, iron, '#1e293b', 10 * scale);

      roundedPoly(ctx, [[-w * 0.54, -h * 0.82 + bob], [w * 0.54, -h * 0.82 + bob], [w * 0.44, -h * 0.28], [-w * 0.44, -h * 0.28]], skin);
      // Giant Skull-Trophy Shoulder Pauldrons
      ctx.beginPath();
      ctx.arc(-w * 0.48, -h * 0.78 + bob, w * 0.2, 0, Math.PI * 2);
      ctx.arc(w * 0.48, -h * 0.78 + bob, w * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#e7e5e4';
      ctx.fill();
      ctx.strokeStyle = '#090b12';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Crowned Horned Warlord Helm
      roundedPoly(ctx, [[-w * 0.3, -h * 1.02 + bob], [w * 0.32, -h * 1.02 + bob], [w * 0.34, -h * 0.78 + bob], [-w * 0.28, -h * 0.78 + bob]], skin);
      roundedPoly(ctx, [[-w * 0.34, -h * 0.98 + bob], [-w * 0.26, -h * 1.14 + bob], [0, -h * 1.04 + bob], [w * 0.26, -h * 1.14 + bob], [w * 0.34, -h * 0.98 + bob]], '#ffd166');
      roundedPoly(ctx, [[-w * 0.32, -h * 1.02 + bob], [-w * 0.58, -h * 1.28 + bob], [-w * 0.18, -h * 1.06 + bob]], '#f5f5f4');
      roundedPoly(ctx, [[w * 0.18, -h * 1.06 + bob], [w * 0.58, -h * 1.28 + bob], [w * 0.32, -h * 1.02 + bob]], '#f5f5f4');
      drawEyeGlow(ctx, w * 0.14, -h * 0.9 + bob, 4.6 * scale, '#ff334b');

      // Colossal Molten-Edged War-Cleaver
      ctx.save();
      ctx.translate(w * 0.42, -h * 0.58 + bob + windupLift * 0.8);
      ctx.rotate(isCharging ? -0.65 : isSwinging ? 0.9 : 0.15);
      limb(ctx, 0, h * 0.36, 0, -h * 0.56, 6 * scale, '#5c3c24');
      roundedPoly(ctx, [[0, -h * 0.62], [w * 0.52, -h * 0.54], [w * 0.44, -h * 0.2], [0, -h * 0.26]], '#334155', '#f97316', 2.4);
      ctx.restore();
      break;
    }

    // =========================================================================
    // WEEPING NECROPOLIS — 5 UNIQUE BOSSES
    // =========================================================================
    case 'boss_gravedigger': {
      // Mortis the Gravedigger — Wide-Brimmed Undertaker with Coffin & Iron Grave-Spade!
      // Wooden Coffin strapped diagonally to back
      ctx.save();
      ctx.translate(-w * 0.32, -h * 0.56 + bob);
      ctx.rotate(-0.22);
      roundedPoly(ctx, [[-w * 0.2, -h * 0.38], [w * 0.2, -h * 0.38], [w * 0.26, -h * 0.14], [w * 0.16, h * 0.34], [-w * 0.16, h * 0.34], [-w * 0.26, -h * 0.14]], '#4a3222', '#1e140e', 1.8);
      ctx.restore();

      drawBipedLegs(ctx, -h * 0.34, w, stridePhase, isMoving, isAirborne, '#232826', '#141716', 6.5 * scale);
      roundedPoly(ctx, [[-w * 0.42, -h * 0.78 + bob], [w * 0.42, -h * 0.78 + bob], [w * 0.48, -h * 0.16], [-w * 0.46, -h * 0.16]], pick('#2d3330'));

      // Wide-Brimmed Pilgrim Hat & Shadowed Face
      roundedPoly(ctx, [[-w * 0.24, -h * 0.96 + bob], [w * 0.26, -h * 0.96 + bob], [w * 0.28, -h * 0.76 + bob], [-w * 0.24, -h * 0.76 + bob]], '#131615');
      roundedPoly(ctx, [[-w * 0.62, -h * 0.94 + bob], [w * 0.62, -h * 0.94 + bob], [w * 0.56, -h * 0.87 + bob], [-w * 0.56, -h * 0.87 + bob]], '#1b1f1e');
      roundedPoly(ctx, [[-w * 0.28, -h * 1.14 + bob], [w * 0.28, -h * 1.14 + bob], [w * 0.32, -h * 0.94 + bob], [-w * 0.32, -h * 0.94 + bob]], '#1b1f1e');
      drawEyeGlow(ctx, w * 0.12, -h * 0.84 + bob, 3.6 * scale, '#a7f3d0');

      // Swinging Oil Lantern on Hip
      drawEyeGlow(ctx, -w * 0.26, -h * 0.36 + bob + Math.sin(t * 6) * 3, 5 * scale, '#34d399');

      // Heavy Iron Grave-Spade
      ctx.save();
      ctx.translate(w * 0.36, -h * 0.56 + bob + windupLift * 0.7);
      ctx.rotate(isCharging ? -0.55 : isLunging ? 1.15 : 0.15);
      limb(ctx, 0, h * 0.42, 0, -h * 0.46, 4.5 * scale, '#785a46');
      roundedPoly(ctx, [[-w * 0.2, -h * 0.44], [w * 0.2, -h * 0.44], [w * 0.16, -h * 0.64], [0, -h * 0.74], [-w * 0.16, -h * 0.64]], '#94a3b8');
      ctx.restore();
      break;
    }

    case 'boss_banshee': {
      // Wailing Banshee — Flowing Spectral Bridal Queen with Sonic Ribbons!
      const hover = Math.sin(t * 4.2) * 7 * scale;
      ctx.save();
      ctx.globalAlpha *= 0.86;
      // Expanding sonic shimmer aura when charging wail
      if (isCharging) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, -h * 0.65 + hover, w * (0.65 + chargeProg * 0.45), 0, Math.PI * 2);
        ctx.stroke();
      }
      // Flowing Spectral Gown & Torn Silver Veil
      roundedPoly(
        ctx,
        [
          [-w * 0.42, -h * 0.84 + hover],
          [w * 0.38, -h * 0.84 + hover],
          [w * 0.62, -h * 0.04 + hover],
          [w * 0.18, -h * 0.22 + hover],
          [-w * 0.18, -h * 0.04 + hover],
          [-w * 0.68, -h * 0.14 + hover],
        ],
        pick('#164e63')
      );
      // Floating luminous hair tendrils
      roundedPoly(ctx, [[-w * 0.26, -h * 1.02 + hover], [-w * 0.72, -h * 0.86 + hover + Math.sin(t * 7) * 6], [-w * 0.48, -h * 0.56 + hover], [-w * 0.16, -h * 0.78 + hover]], '#a5f3fc');
      roundedPoly(ctx, [[-w * 0.24, -h * 1.02 + hover], [w * 0.24, -h * 1.02 + hover], [w * 0.24, -h * 0.78 + hover], [-w * 0.24, -h * 0.78 + hover]], '#ecfeff');
      // Silver Tiara Crown
      roundedPoly(ctx, [[-w * 0.24, -h * 1.02 + hover], [0, -h * 1.18 + hover], [w * 0.24, -h * 1.02 + hover]], '#cffafe');
      drawEyeGlow(ctx, w * 0.1, -h * 0.9 + hover, 4 * scale, '#22d3ee');
      ctx.restore();
      break;
    }

    case 'boss_executioner': {
      // Crypt Executioner — Pointed Crimson-Stained Hood & Colossal Headsman Cleaver
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase * 0.85, isMoving, isAirborne, '#1f2937', '#111827', 8.5 * scale);
      roundedPoly(ctx, [[-w * 0.46, -h * 0.78 + bob], [w * 0.46, -h * 0.78 + bob], [w * 0.4, -h * 0.28], [-w * 0.4, -h * 0.28]], pick('#262d3a'));
      // Leather butcher apron
      ctx.fillStyle = '#4c1622';
      ctx.fillRect(-w * 0.3, -h * 0.68 + bob, w * 0.6, h * 0.5);
      // Pointed Executioner Hood
      roundedPoly(ctx, [[-w * 0.34, -h * 0.74 + bob], [0, -h * 1.2 + bob], [w * 0.34, -h * 0.74 + bob]], pick('#3b1520'));
      drawEyeGlow(ctx, w * 0.1, -h * 0.88 + bob, 3.8 * scale, '#ff334b');

      // Gargantuan Notched Executioner Greataxe
      ctx.save();
      ctx.translate(w * 0.38, -h * 0.56 + bob + windupLift * 0.75);
      ctx.rotate(isCharging ? -0.7 : isSwinging ? 0.95 : 0.18);
      limb(ctx, 0, h * 0.42, 0, -h * 0.56, 5.5 * scale, '#5c3c24');
      roundedPoly(ctx, [[0, -h * 0.64], [w * 0.54, -h * 0.58], [w * 0.58, -h * 0.22], [0, -h * 0.3]], '#cbd5e1', '#991b2e', 2);
      ctx.restore();
      break;
    }

    case 'boss_bone_reaver': {
      // Bone Reaver Lord — Skeletal Reaper Knight with Soul-Core Ribcage & Twin Curved Bone Scythe!
      drawFlowingCape(ctx, -w * 0.08, -h * 0.8 + bob, w * 1.15, h * 0.78, t, pick('#182436'), '#2dd4bf');
      drawBipedLegs(ctx, -h * 0.36, w, stridePhase, isMoving, isAirborne, '#1e293b', '#e7e5e4', 6.5 * scale);
      roundedPoly(ctx, [[-w * 0.4, -h * 0.78 + bob], [w * 0.4, -h * 0.78 + bob], [w * 0.32, -h * 0.32], [-w * 0.32, -h * 0.32]], '#151f2e');
      // Glowing Soul Core behind Exposed Ribcage
      drawEyeGlow(ctx, 0, -h * 0.56 + bob, 6.5 * scale, '#2dd4bf');
      ctx.fillStyle = pick('#e7e5e4');
      for (let r = 0; r < 4; r++) {
        ctx.fillRect(-w * 0.34, -h * (0.7 - r * 0.09) + bob, w * 0.68, 3.2 * scale);
      }
      // Horned Skull Helm
      roundedPoly(ctx, [[-w * 0.28, -h * 1.02 + bob], [w * 0.28, -h * 1.02 + bob], [w * 0.3, -h * 0.78 + bob], [-w * 0.26, -h * 0.78 + bob]], pick('#e7e5e4'));
      roundedPoly(ctx, [[-w * 0.24, -h * 0.98 + bob], [-w * 0.48, -h * 1.2 + bob], [-w * 0.1, -h * 1.02 + bob]], '#94a3b8');
      roundedPoly(ctx, [[w * 0.1, -h * 1.02 + bob], [w * 0.48, -h * 1.2 + bob], [w * 0.24, -h * 0.98 + bob]], '#94a3b8');
      drawEyeGlow(ctx, w * 0.12, -h * 0.9 + bob, 3.8 * scale, '#2dd4bf');

      // Colossal Curved Bone Scythe
      ctx.save();
      ctx.translate(w * 0.36, -h * 0.56 + bob + windupLift * 0.6);
      ctx.rotate(isCharging ? -0.6 : isSwinging ? 0.95 : 0.14);
      limb(ctx, 0, h * 0.46, 0, -h * 0.56, 4.5 * scale, '#78716c');
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.56);
      ctx.quadraticCurveTo(w * 0.96, -h * 0.66, w * 0.78, -h * 0.14);
      ctx.quadraticCurveTo(w * 0.54, -h * 0.42, 0, -h * 0.38);
      ctx.closePath();
      ctx.fillStyle = '#e7e5e4';
      ctx.fill();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'boss_necromancer': {
      // Vespera · Arch-Necromancer (HUGE Final Boss!)
      const hover = Math.sin(t * 3.0) * 6 * scale;
      const glow = enemy.enraged ? '#ff334b' : '#2dd4bf';
      // Dual Counter-Rotating Phylactery Orbital Rings!
      ctx.save();
      ctx.translate(0, -h * 0.8 + hover);
      ctx.rotate(t * 1.4);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3.5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.fillStyle = i % 2 === 0 ? '#ffd166' : glow;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * w * 0.68, Math.sin(a) * w * 0.68, 4.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Towering Sovereign Necromancer Vestments
      roundedPoly(
        ctx,
        [
          [-w * 0.52, -h * 0.84 + hover],
          [w * 0.48, -h * 0.84 + hover],
          [w * 0.72, -h * 0.02 + hover],
          [w * 0.18, -h * 0.16 + hover],
          [-w * 0.18, -h * 0.04 + hover],
          [-w * 0.78, -h * 0.02 + hover],
        ],
        pick('#0e2928')
      );
      // Rib-Bone Mantle Shoulder Collar
      roundedPoly(ctx, [[-w * 0.56, -h * 0.84 + hover], [w * 0.52, -h * 0.84 + hover], [w * 0.4, -h * 0.7 + hover], [-w * 0.44, -h * 0.7 + hover]], '#e7e5e4');
      // Crescent Crown & Shadowed Lich Visage
      roundedPoly(ctx, [[-w * 0.28, -h * 1.02 + hover], [w * 0.28, -h * 1.02 + hover], [w * 0.3, -h * 0.8 + hover], [-w * 0.28, -h * 0.8 + hover]], '#111b1e');
      roundedPoly(ctx, [[-w * 0.34, -h * 1.0 + hover], [-w * 0.42, -h * 1.2 + hover], [-w * 0.14, -h * 1.04 + hover], [0, -h * 1.18 + hover], [w * 0.14, -h * 1.04 + hover], [w * 0.42, -h * 1.2 + hover], [w * 0.34, -h * 1.0 + hover]], '#ffd166');
      drawEyeGlow(ctx, w * 0.1, -h * 0.9 + hover, 5 * scale, glow);

      // Towering Soul-Lantern Scythe Staff
      limb(ctx, w * 0.48, -h * 0.06 + hover, w * 0.52, -h * 1.0 + hover + windupLift * 0.4, 5.5 * scale, '#57534e');
      drawEyeGlow(ctx, w * 0.52, -h * 1.02 + hover + windupLift * 0.4, (isCharging ? 13 : 9.5) * scale, glow);
      break;
    }

    // =========================================================================
    // BRIMSTONE SANCTUM — 5 UNIQUE BOSSES
    // =========================================================================
    case 'boss_cinder_warden': {
      // Cinder Warden — Chained Iron-Grate Furnace Jailer!
      drawFlowingCape(ctx, -w * 0.08, -h * 0.8 + bob, w * 1.05, h * 0.76, t, pick('#7c2d12'), '#fb923c');
      drawBipedLegs(ctx, -h * 0.34, w, stridePhase, isMoving, isAirborne, '#2b1d1c', '#181010', 7.5 * scale);
      roundedPoly(ctx, [[-w * 0.44, -h * 0.78 + bob], [w * 0.44, -h * 0.78 + bob], [w * 0.38, -h * 0.3], [-w * 0.38, -h * 0.3]], pick('#332322'));
      // Glowing Furnace Grate Helmet (Fire burning inside iron bars!)
      roundedPoly(ctx, [[-w * 0.3, -h * 1.04 + bob], [w * 0.3, -h * 1.04 + bob], [w * 0.32, -h * 0.78 + bob], [-w * 0.3, -h * 0.78 + bob]], '#1f1616');
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-w * 0.2, -h * 0.98 + bob, w * 0.44, h * 0.16);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-w * 0.12, -h * 0.94 + bob, w * 0.28, h * 0.08);
      // Vertical iron cage bars across face
      ctx.fillStyle = '#1f1616';
      for (let b = -1; b <= 2; b++) {
        ctx.fillRect(b * w * 0.11, -h * 1.02 + bob, 3 * scale, h * 0.22);
      }

      // Chained Flaming Censer-Flail
      const flailX = isLunging ? w * 0.95 : w * 0.56;
      const flailY = -h * 0.54 + bob + windupLift * 0.6;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3 * scale;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(w * 0.26, -h * 0.58 + bob);
      ctx.lineTo(flailX, flailY);
      ctx.stroke();
      ctx.setLineDash([]);
      drawEyeGlow(ctx, flailX, flailY, 9 * scale, '#f97316');
      break;
    }

    case 'boss_pyre_matriarch': {
      // Pyre Matriarch — Floating Flame-Crowned Priestess with 3 Orbiting Ember Orbs!
      const hover = Math.sin(t * 4.0) * 6 * scale;
      for (let i = 0; i < 3; i++) {
        const a = t * 3.0 + (i * Math.PI * 2) / 3;
        drawEyeGlow(ctx, Math.cos(a) * w * 0.74, -h * 0.65 + hover + Math.sin(a) * 14 * scale, 5.5 * scale, '#f97316');
      }
      roundedPoly(ctx, [[-w * 0.42, -h * 0.8 + hover], [w * 0.4, -h * 0.8 + hover], [w * 0.58, -h * 0.04 + hover], [0, -h * 0.16 + hover], [-w * 0.62, -h * 0.04 + hover]], pick('#4c1212'), '#f97316', 1.6);
      // Crown of Living Flame Horns
      roundedPoly(ctx, [[-w * 0.24, -h * 1.0 + hover], [w * 0.24, -h * 1.0 + hover], [w * 0.26, -h * 0.78 + hover], [-w * 0.24, -h * 0.78 + hover]], '#2a0c0e');
      roundedPoly(ctx, [[-w * 0.24, -h * 0.98 + hover], [-w * 0.44, -h * 1.24 + hover], [-w * 0.06, -h * 1.02 + hover]], '#f97316');
      roundedPoly(ctx, [[w * 0.06, -h * 1.02 + hover], [w * 0.44, -h * 1.24 + hover], [w * 0.24, -h * 0.98 + hover]], '#f97316');
      drawEyeGlow(ctx, w * 0.1, -h * 0.89 + hover, 4.2 * scale, '#fef08a');
      break;
    }

    case 'boss_slag_titan': {
      // Slag Colossus — Hulking Asymmetric Molten Basalt Golem!
      const rock = pick('#2b201e');
      drawBipedLegs(ctx, -h * 0.28, w, stridePhase * 0.75, isMoving, isAirborne, rock, '#171010', 11 * scale);
      // Craggy Volcanic Torso
      roundedPoly(ctx, [[-w * 0.58, -h * 0.86 + bob], [-w * 0.34, -h * 0.94 + bob], [w * 0.38, -h * 0.92 + bob], [w * 0.58, -h * 0.82 + bob], [w * 0.48, -h * 0.26], [-w * 0.48, -h * 0.26]], rock);
      // Pouring Molten Lava Chest Veins
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4.5 * scale;
      ctx.beginPath();
      ctx.moveTo(-w * 0.36, -h * 0.74 + bob);
      ctx.lineTo(0, -h * 0.62 + bob);
      ctx.lineTo(w * 0.36, -h * 0.74 + bob);
      ctx.moveTo(0, -h * 0.62 + bob);
      ctx.lineTo(0, -h * 0.32 + bob);
      ctx.stroke();
      // Small sunken molten head
      roundedPoly(ctx, [[-w * 0.26, -h * 1.04 + bob], [w * 0.28, -h * 1.04 + bob], [w * 0.3, -h * 0.84 + bob], [-w * 0.26, -h * 0.84 + bob]], rock);
      drawEyeGlow(ctx, w * 0.12, -h * 0.94 + bob, 4.5 * scale, '#fef08a');
      // Colossal Asymmetric Magma Fist
      const fistY = -h * 0.44 + bob + windupLift * 0.8;
      roundedPoly(ctx, [[w * 0.36, fistY - 18 * scale], [w * 0.88, fistY - 20 * scale], [w * 0.92, fistY + 20 * scale], [w * 0.34, fistY + 18 * scale]], rock, '#f97316', 2.6);
      break;
    }

    case 'boss_infernal_knight': {
      // Ashen Dread-Knight — Sleek Demon Plate Knight with Swept Bull-Horns & Blazing Claymore!
      drawFlowingCape(ctx, -w * 0.08, -h * 0.82 + bob, w * 1.18, h * 0.82, t * 1.2, pick('#7f1d1d'), '#f97316');
      drawBipedLegs(ctx, -h * 0.36, w, stridePhase, isMoving, isAirborne, '#211316', '#120a0c', 6.5 * scale);
      roundedPoly(ctx, [[-w * 0.4, -h * 0.8 + bob], [w * 0.4, -h * 0.8 + bob], [w * 0.32, -h * 0.32], [-w * 0.32, -h * 0.32]], pick('#261519'));
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-w * 0.24, -h * 0.62 + bob, w * 0.48, 4.5 * scale);

      // Swept Bull-Horned Demon Helm
      roundedPoly(ctx, [[-w * 0.26, -h * 1.02 + bob], [w * 0.26, -h * 1.02 + bob], [w * 0.3, -h * 0.78 + bob], [-w * 0.26, -h * 0.78 + bob]], '#1c0f12');
      roundedPoly(ctx, [[-w * 0.22, -h * 0.96 + bob], [-w * 0.58, -h * 1.2 + bob], [-w * 0.14, -h * 1.02 + bob]], '#fb923c');
      roundedPoly(ctx, [[w * 0.14, -h * 1.02 + bob], [w * 0.58, -h * 1.2 + bob], [w * 0.22, -h * 0.96 + bob]], '#fb923c');
      drawEyeGlow(ctx, w * 0.12, -h * 0.9 + bob, 3.8 * scale, '#f97316');

      // Towering Volcanic Claymore
      ctx.save();
      ctx.translate(w * 0.34, -h * 0.56 + bob + windupLift * 0.6);
      ctx.rotate(isCharging ? -0.65 : isSwinging ? 0.95 : 0.16);
      roundedPoly(ctx, [[-4 * scale, 12 * scale], [4 * scale, 12 * scale], [6 * scale, -h * 0.62], [0, -h * 0.76], [-6 * scale, -h * 0.62]], '#f97316', '#fef08a', 1.8);
      ctx.restore();
      break;
    }

    case 'boss_forge_lord': {
      // Ignis · Infernal Forge-Lord (HUGE Final Boss!)
      const dark = pick('#1d1416');
      const lava = enemy.enraged ? '#fef08a' : '#f97316';
      drawFlowingCape(ctx, -w * 0.1, -h * 0.86 + bob, w * 1.25, h * 0.86, t, '#7c2d12', lava);
      drawBipedLegs(ctx, -h * 0.3, w, stridePhase * 0.75, isMoving, isAirborne, dark, '#3b2422', 11 * scale);

      roundedPoly(ctx, [[-w * 0.56, -h * 0.84 + bob], [w * 0.56, -h * 0.84 + bob], [w * 0.46, -h * 0.26], [-w * 0.46, -h * 0.26]], dark);
      // Roaring Furnace Chest Grate
      ctx.fillStyle = lava;
      ctx.fillRect(-w * 0.36, -h * 0.68 + bob, w * 0.72, h * 0.2);
      ctx.fillStyle = dark;
      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(i * w * 0.13 - 2 * scale, -h * 0.7 + bob, 4 * scale, h * 0.24);
      }
      // Bellows-Chimney Shoulder Pauldrons venting embers
      roundedPoly(ctx, [[-w * 0.66, -h * 0.96 + bob], [-w * 0.36, -h * 0.96 + bob], [-w * 0.34, -h * 0.68 + bob], [-w * 0.66, -h * 0.68 + bob]], '#332424');
      roundedPoly(ctx, [[w * 0.36, -h * 0.96 + bob], [w * 0.66, -h * 0.96 + bob], [w * 0.66, -h * 0.68 + bob], [w * 0.34, -h * 0.68 + bob]], '#332424');
      drawEyeGlow(ctx, -w * 0.51, -h * 1.0 + bob, 5.5 * scale, '#f97316');
      drawEyeGlow(ctx, w * 0.51, -h * 1.0 + bob, 5.5 * scale, '#f97316');

      // Anvil-Crowned Horned Helm
      roundedPoly(ctx, [[-w * 0.3, -h * 1.04 + bob], [w * 0.3, -h * 1.04 + bob], [w * 0.32, -h * 0.82 + bob], [-w * 0.3, -h * 0.82 + bob]], dark);
      roundedPoly(ctx, [[-w * 0.38, -h * 1.12 + bob], [w * 0.38, -h * 1.12 + bob], [w * 0.28, -h * 1.02 + bob], [-w * 0.28, -h * 1.02 + bob]], '#64748b');
      drawEyeGlow(ctx, w * 0.14, -h * 0.92 + bob, 5 * scale, lava);

      // Colossal Molten Forge-Hammer
      ctx.save();
      ctx.translate(w * 0.44, -h * 0.56 + bob + windupLift * 0.85);
      ctx.rotate(isCharging ? -0.68 : isSwinging ? 0.95 : 0.14);
      limb(ctx, 0, h * 0.4, 0, -h * 0.58, 7 * scale, '#57534e');
      roundedPoly(ctx, [[-w * 0.28, -h * 0.72], [w * 0.34, -h * 0.72], [w * 0.34, -h * 0.46], [-w * 0.28, -h * 0.46]], '#291a18', lava, 3);
      ctx.restore();
      break;
    }

    // =========================================================================
    // ECLIPSE CITADEL — BIG BAD FINAL END BOSS
    // =========================================================================
    case 'boss_eclipse_overlord': {
      // Draculor · Eclipse Overlord (GARGANTUAN Final End Boss!)
      const hover = Math.sin(t * 2.8) * 5 * scale;
      const flap = Math.sin(t * 6.5) * 16 * scale;
      const cloak = pick('#450514');
      const armor = pick('#130f1c');
      const gold = '#ffd166';

      // Spinning Celestial Blood-Eclipse Ring (Black Sun + Golden Corona!)
      ctx.save();
      ctx.translate(0, -h * 0.86 + hover);
      ctx.rotate(t * 1.1);
      ctx.fillStyle = '#07040a';
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.64, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = enemy.enraged ? gold : '#ff334b';
      ctx.lineWidth = 5 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.68, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.fillStyle = i % 2 === 0 ? gold : '#ff334b';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * w * 0.76, Math.sin(a) * w * 0.76, 4.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Massive Dynamic Bat-Demon Wings
      drawBatWing(ctx, -w * 0.14, -h * 0.72 + hover, -1, w * 1.24, h * 0.72, flap, cloak, gold);
      drawBatWing(ctx, w * 0.14, -h * 0.72 + hover, 1, w * 1.24, h * 0.72, flap, cloak, gold);
      drawFlowingCape(ctx, -w * 0.08, -h * 0.86 + hover, w * 1.32, h * 0.86, t, cloak, gold);

      // Towering Gilded Gothic Plate Body
      roundedPoly(ctx, [[-w * 0.44, -h * 0.82 + hover], [w * 0.44, -h * 0.82 + hover], [w * 0.36, -h * 0.08 + hover], [-w * 0.36, -h * 0.08 + hover]], armor, gold, 2);
      ctx.fillStyle = gold;
      ctx.fillRect(-w * 0.34, -h * 0.68 + hover, w * 0.68, 6 * scale);
      ctx.fillRect(-w * 0.26, -h * 0.52 + hover, w * 0.52, 5 * scale);
      drawEyeGlow(ctx, 0, -h * 0.62 + hover, 7 * scale, '#ff334b');

      // Sovereign Crown & Pale Vampire Visage
      roundedPoly(ctx, [[-w * 0.26, -h * 1.02 + hover], [w * 0.26, -h * 1.02 + hover], [w * 0.28, -h * 0.8 + hover], [-w * 0.26, -h * 0.8 + hover]], pick('#e6dfd7'));
      roundedPoly(ctx, [[-w * 0.34, -h * 1.0 + hover], [-w * 0.32, -h * 1.2 + hover], [-w * 0.12, -h * 1.06 + hover], [0, -h * 1.24 + hover], [w * 0.12, -h * 1.06 + hover], [w * 0.32, -h * 1.2 + hover], [w * 0.34, -h * 1.0 + hover]], gold);
      drawEyeGlow(ctx, w * 0.12, -h * 0.91 + hover, 5 * scale, '#ff334b');

      // Enormous Pulsing Eclipse Claymore
      ctx.save();
      ctx.translate(w * 0.42, -h * 0.58 + hover + windupLift * 0.65);
      ctx.rotate(isCharging ? -0.65 : isSwinging ? 0.95 : 0.14);
      roundedPoly(ctx, [[-5 * scale, 16 * scale], [5 * scale, 16 * scale], [8 * scale, -h * 0.64], [0, -h * 0.8], [-8 * scale, -h * 0.64]], '#ff334b', gold, 2.2);
      ctx.fillStyle = gold;
      ctx.fillRect(-18 * scale, 8 * scale, 36 * scale, 6 * scale);
      ctx.restore();
      break;
    }

    // =========================================================================
    // 4 NEW RAID BIG BOSSES — BESPOKE ELABORATE SILHOUETTES
    // =========================================================================
    case 'boss_mushroom_sovereign': {
      // Mycelior · The Spore Sovereign (Colossal Bioluminescent Toadstool Monarch!)
      const sway = Math.sin(t * 2.5) * 4 * scale;
      const glow = enemy.enraged ? '#f472b6' : '#34d399';
      const capCol = pick('#6d28d9');
      const stalkCol = pick('#e2e8f0');

      // Rooted Fungal Tendrils & Spore Cape
      drawFlowingCape(ctx, -w * 0.08, -h * 0.65 + bob, w * 1.15, h * 0.65, t, '#3b0764', glow);
      drawBipedLegs(ctx, -h * 0.25, w * 0.9, stridePhase * 0.7, isMoving, isAirborne, '#cbd5e1', '#475569', 10 * scale);

      // Thick Mycelial Stalk Torso with glowing cyan gills
      roundedPoly(ctx, [[-w * 0.34, -h * 0.72 + bob], [w * 0.34, -h * 0.72 + bob], [w * 0.42, -h * 0.18], [-w * 0.42, -h * 0.18]], stalkCol, glow, 2);
      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(-w * 0.22, -h * 0.56 + bob, w * 0.44, h * 0.16);
      ctx.globalAlpha = 1;

      // Giant Royal Bioluminescent Mushroom Dome Crown!
      ctx.fillStyle = capCol;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.ellipse(sway, -h * 0.84 + bob, w * 0.78, h * 0.32, 0, Math.PI, 0);
      ctx.lineTo(w * 0.78 + sway, -h * 0.72 + bob);
      ctx.quadraticCurveTo(sway, -h * 0.64 + bob, -w * 0.78 + sway, -h * 0.72 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing Spore Spots across the Toadstool Crown
      for (const [sx, sy, sr] of [[-0.44, -0.94, 7], [-0.14, -1.04, 8.5], [0.22, -0.98, 7.5], [0.48, -0.88, 6]]) {
        drawEyeGlow(ctx, sx * w + sway, sy * h + bob, sr * scale, glow);
      }
      // Three luminous eyes beneath the cap gill shadow
      drawEyeGlow(ctx, -w * 0.12, -h * 0.68 + bob, 4.5 * scale, '#fde047');
      drawEyeGlow(ctx, w * 0.14, -h * 0.68 + bob, 5.2 * scale, '#fde047');
      drawEyeGlow(ctx, 0, -h * 0.63 + bob, 3.5 * scale, glow);

      // Fungal Spore-Lantern Staff
      ctx.save();
      ctx.translate(w * 0.46, -h * 0.5 + bob + windupLift * 0.75);
      ctx.rotate(isCharging ? -0.58 : isSwinging ? 0.85 : 0.12);
      limb(ctx, 0, h * 0.38, 0, -h * 0.54, 6.5 * scale, '#78350f');
      drawEyeGlow(ctx, 0, -h * 0.58, 11 * scale, glow);
      ctx.restore();
      break;
    }

    case 'boss_sand_pharaoh': {
      // Khafra-Ra · The Sun-Scarab Pharaoh (Gilded Desert Colossus!)
      const hover = Math.sin(t * 2.2) * 3.5 * scale;
      const gold = '#fbbf24';
      const lapis = pick('#1d4ed8');
      const obs = pick('#1c1917');

      // Levitating Radiant Solar Scarab Halo behind head!
      ctx.save();
      ctx.translate(0, -h * 0.94 + hover);
      ctx.rotate(t * 0.75);
      ctx.strokeStyle = enemy.enraged ? '#fef08a' : gold;
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * w * 0.74, Math.sin(a) * w * 0.74);
        ctx.lineTo(Math.cos(a + 0.14) * w * 0.56, Math.sin(a + 0.14) * w * 0.56);
        ctx.lineTo(Math.cos(a - 0.14) * w * 0.56, Math.sin(a - 0.14) * w * 0.56);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      drawFlowingCape(ctx, -w * 0.08, -h * 0.8 + hover, w * 1.2, h * 0.8, t, '#78350f', gold);
      drawBipedLegs(ctx, -h * 0.28, w, stridePhase * 0.7, isMoving, isAirborne, obs, gold, 10 * scale);

      // Sarcophagus Plate & Golden Pectoral Collar
      roundedPoly(ctx, [[-w * 0.44, -h * 0.8 + hover], [w * 0.44, -h * 0.8 + hover], [w * 0.34, -h * 0.22], [-w * 0.34, -h * 0.22]], obs, gold, 2.5);
      ctx.fillStyle = lapis;
      ctx.fillRect(-w * 0.34, -h * 0.74 + hover, w * 0.68, h * 0.12);
      drawEyeGlow(ctx, 0, -h * 0.62 + hover, 7 * scale, '#f59e0b');

      // Striped Gold & Lapis Nemes Pharaoh Headdress + Jackal Crown
      roundedPoly(ctx, [[-w * 0.46, -h * 0.8 + hover], [-w * 0.34, -h * 1.1 + hover], [w * 0.34, -h * 1.1 + hover], [w * 0.46, -h * 0.8 + hover]], gold, lapis, 2.5);
      roundedPoly(ctx, [[-w * 0.22, -h * 1.04 + hover], [w * 0.22, -h * 1.04 + hover], [w * 0.2, -h * 0.82 + hover], [-w * 0.2, -h * 0.82 + hover]], obs);
      // Tall Jackal Ears
      roundedPoly(ctx, [[-w * 0.22, -h * 1.08 + hover], [-w * 0.16, -h * 1.32 + hover], [-w * 0.06, -h * 1.08 + hover]], gold);
      roundedPoly(ctx, [[w * 0.06, -h * 1.08 + hover], [w * 0.16, -h * 1.32 + hover], [w * 0.22, -h * 1.08 + hover]], gold);
      drawEyeGlow(ctx, w * 0.1, -h * 0.93 + hover, 5 * scale, '#38bdf8');

      // Curved Golden Sun-Khopesh Greatsword
      ctx.save();
      ctx.translate(w * 0.44, -h * 0.56 + hover + windupLift * 0.75);
      ctx.rotate(isCharging ? -0.64 : isSwinging ? 0.92 : 0.16);
      ctx.strokeStyle = gold;
      ctx.lineWidth = 8 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 14 * scale);
      ctx.lineTo(0, -h * 0.28);
      ctx.quadraticCurveTo(w * 0.28, -h * 0.48, -w * 0.06, -h * 0.72);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'boss_alien_archon': {
      // Xylar-9 · The Void Archon (Floating Cosmic Biomechanical Dreadnought!)
      const hover = Math.sin(t * 3.4) * 8 * scale;
      const cyan = enemy.enraged ? '#e879f9' : '#22d3ee';
      const hull = pick('#0f172a');

      // 4 Orbiting Plasma Pylon Pods!
      for (let i = 0; i < 4; i++) {
        const a = t * 1.8 + (i * Math.PI) / 2;
        const px = Math.cos(a) * w * 0.78;
        const py = -h * 0.62 + hover + Math.sin(a) * h * 0.22;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = cyan;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(px, py, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawEyeGlow(ctx, px, py, 4.5 * scale, cyan);
      }

      // Levitating Energy Tentacles beneath carapace
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 4 * scale;
      for (let i = -2; i <= 2; i++) {
        const tx = i * w * 0.14;
        const wave = Math.sin(t * 5 + i * 1.4) * 14 * scale;
        ctx.beginPath();
        ctx.moveTo(tx, -h * 0.34 + hover);
        ctx.quadraticCurveTo(tx + wave, -h * 0.14 + hover, tx - wave * 0.6, 6 + hover);
        ctx.stroke();
      }

      // Sleek Biomechanical Exo-Torso + Singularity Core
      roundedPoly(ctx, [[-w * 0.42, -h * 0.82 + hover], [w * 0.42, -h * 0.82 + hover], [w * 0.24, -h * 0.3 + hover], [-w * 0.24, -h * 0.3 + hover]], hull, cyan, 2.4);
      drawEyeGlow(ctx, 0, -h * 0.58 + hover, 11 * scale, cyan);

      // Elongated Crystalline Alien Dome Cranium
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 2.5 * scale;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.98 + hover, w * 0.32, h * 0.24, -0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Glowing Visor Slit
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-w * 0.12, -h * 0.96 + hover, w * 0.34, 5 * scale);
      drawEyeGlow(ctx, w * 0.12, -h * 0.94 + hover, 6 * scale, cyan);

      // Twin Plasma Energy Blades
      ctx.save();
      ctx.translate(w * 0.42, -h * 0.62 + hover + windupLift * 0.6);
      ctx.rotate(isCharging ? -0.52 : isSwinging ? 0.88 : 0.2);
      roundedPoly(ctx, [[-4 * scale, 10 * scale], [4 * scale, 10 * scale], [10 * scale, -h * 0.58], [0, -h * 0.72], [-6 * scale, -h * 0.54]], cyan, '#ffffff', 1.8);
      ctx.restore();
      break;
    }

    case 'boss_dragon_crane': {
      // Shen-Luan · The Jade Dragon-Crane (Celestial Winged Sovereign!)
      const hover = Math.sin(t * 3.0) * 9 * scale;
      const flap = Math.sin(t * 7.2) * 20 * scale;
      const jade = enemy.enraged ? '#fde047' : '#10b981';
      const cream = pick('#f8fafc');
      const gold = '#fbbf24';

      // Celestial Jade Cloud Halo Ring
      ctx.save();
      ctx.translate(0, -h * 0.78 + hover);
      ctx.rotate(-t * 0.9);
      ctx.strokeStyle = gold;
      ctx.lineWidth = 3.5 * scale;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Enormous Feathered Dragon-Crane Wings
      drawBatWing(ctx, -w * 0.14, -h * 0.68 + hover, -1, w * 1.38, h * 0.72, flap, cream, jade);
      drawBatWing(ctx, w * 0.14, -h * 0.68 + hover, 1, w * 1.38, h * 0.72, flap, cream, jade);

      // Sweeping Ribbon Tail Feathers
      drawFlowingCape(ctx, -w * 0.08, -h * 0.5 + hover, w * 1.1, h * 0.72, t * 1.4, jade, gold);

      // Regal Jade-Scaled Crane Body
      roundedPoly(ctx, [[-w * 0.34, -h * 0.76 + hover], [w * 0.34, -h * 0.76 + hover], [w * 0.26, -h * 0.24 + hover], [-w * 0.26, -h * 0.24 + hover]], cream, gold, 2.2);
      drawEyeGlow(ctx, 0, -h * 0.56 + hover, 8.5 * scale, jade);

      // Sinuous Dragon-Crane Neck, Crimson Crest, Antler Horns & Golden Beak
      ctx.strokeStyle = cream;
      ctx.lineWidth = 11 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.74 + hover);
      ctx.quadraticCurveTo(-w * 0.12, -h * 0.96 + hover, w * 0.1, -h * 1.12 + hover);
      ctx.stroke();
      // Golden Dragon Antlers + Crimson Crane Crown
      roundedPoly(ctx, [[0, -h * 1.16 + hover], [-w * 0.16, -h * 1.34 + hover], [-w * 0.04, -h * 1.16 + hover]], gold);
      roundedPoly(ctx, [[w * 0.06, -h * 1.16 + hover], [w * 0.2, -h * 1.32 + hover], [w * 0.14, -h * 1.14 + hover]], '#ef4444');
      // Sharp Golden Beak
      roundedPoly(ctx, [[w * 0.14, -h * 1.16 + hover], [w * 0.44, -h * 1.1 + hover], [w * 0.14, -h * 1.04 + hover]], gold);
      drawEyeGlow(ctx, w * 0.14, -h * 1.12 + hover, 4.5 * scale, '#ef4444');

      // Orbiting Jade Pearl Orb!
      const orbX = w * 0.52 + Math.cos(t * 4) * 10 * scale;
      const orbY = -h * 0.82 + hover + Math.sin(t * 4) * 10 * scale;
      drawEyeGlow(ctx, orbX, orbY, 10 * scale, jade);
      break;
    }

    // ===== MUSHROOM KINGDOM BESPOKE ENEMIES =====
    case 'spore_hopper': {
      const squash = enemy.onGround ? Math.sin(t * 9) * 0.08 : -0.14;
      const cap = pick('#ec4899');
      const stem = pick('#fef3c7');
      // Bouncy stem body
      ctx.fillStyle = stem;
      ctx.fillRect(-w * 0.24, -h * (0.55 - squash), w * 0.48, h * (0.55 - squash));
      // Spotted magenta mushroom cap
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.ellipse(0, -h * (0.58 - squash), w * 0.56, h * 0.36, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fdf2f8';
      ctx.beginPath();
      ctx.arc(-w * 0.22, -h * 0.72, 3.8 * scale, 0, Math.PI * 2);
      ctx.arc(w * 0.16, -h * 0.76, 4.4 * scale, 0, Math.PI * 2);
      ctx.fill();
      drawEyeGlow(ctx, w * 0.1, -h * 0.36, 3.2 * scale, '#a3e635');
      break;
    }

    case 'mycelium_spitter': {
      const cap = pick('#84cc16');
      const stalk = pick('#3f6212');
      // Rooted fungal stalk
      roundedPoly(ctx, [[-w * 0.32, 0], [-w * 0.2, -h * 0.68], [w * 0.2, -h * 0.68], [w * 0.32, 0]], stalk);
      // Glowing toxic funnel cap
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.72, w * 0.52, h * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      drawEyeGlow(ctx, w * 0.14, -h * 0.72, 4.5 * scale, '#fef08a');
      break;
    }

    case 'cap_brute': {
      const cap = pick('#7e22ce');
      const body = pick('#e2e8f0');
      // Hulking fungal brute legs & torso
      ctx.fillStyle = body;
      ctx.fillRect(-w * 0.34, -h * 0.68, w * 0.68, h * 0.68);
      // Massive Armored Toadstool Shield-Cap!
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.72, w * 0.64, h * 0.34, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5 * scale;
      ctx.stroke();
      drawEyeGlow(ctx, w * 0.16, -h * 0.48, 4.2 * scale, '#f43f5e');
      break;
    }

    // ===== SAND FORTRESS BESPOKE ENEMIES =====
    case 'dune_stalker': {
      const cloth = pick('#d97706');
      const wrap = pick('#fef3c7');
      // Nimble desert nomad robes + flowing scarf
      drawFlowingCape(ctx, -w * 0.14, -h * 0.76, w * 0.62, h * 0.48, t * 2, cloth, '#fbbf24');
      roundedPoly(ctx, [[-w * 0.26, 0], [-w * 0.22, -h * 0.76], [w * 0.22, -h * 0.76], [w * 0.28, 0]], '#78350f');
      // Turban hood
      ctx.fillStyle = wrap;
      ctx.beginPath();
      ctx.arc(0, -h * 0.84, w * 0.3, 0, Math.PI * 2);
      ctx.fill();
      drawEyeGlow(ctx, w * 0.12, -h * 0.84, 3 * scale, '#fbbf24');
      // Curved golden scimitar
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 3.2 * scale;
      ctx.beginPath();
      ctx.arc(w * 0.28, -h * 0.56, w * 0.36, -Math.PI * 0.4, Math.PI * 0.35);
      ctx.stroke();
      break;
    }

    case 'scarab_swarmer': {
      const shell = pick('#eab308');
      const dark = '#451a03';
      const skitter = Math.sin(t * 22) * 3 * scale;
      // Low armored golden beetle carapace
      ctx.fillStyle = dark;
      ctx.fillRect(-w * 0.42, -h * 0.26 + skitter * 0.3, w * 0.84, h * 0.24);
      ctx.fillStyle = shell;
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.44, w * 0.48, h * 0.42, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Mandibles & glowing ruby eyes
      drawEyeGlow(ctx, w * 0.34, -h * 0.34, 3 * scale, '#ef4444');
      break;
    }

    case 'sun_acolyte': {
      const hover = Math.sin(t * 3.5) * 6 * scale;
      const robe = pick('#b45309');
      const gold = '#fde047';
      // Floating solar disk behind head
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.arc(0, -h * 0.82 + hover, w * 0.38, 0, Math.PI * 2);
      ctx.stroke();
      // Levitating golden robes
      roundedPoly(ctx, [[0, -h * 0.92 + hover], [w * 0.34, -h * 0.14 + hover], [-w * 0.34, -h * 0.14 + hover]], robe, gold, 1.5);
      drawEyeGlow(ctx, w * 0.1, -h * 0.74 + hover, 3.6 * scale, '#fef08a');
      break;
    }

    // ===== ALIEN SHIP BESPOKE ENEMIES =====
    case 'plasma_drone': {
      const hover = Math.sin(t * 5) * 5 * scale;
      const hull = pick('#0f172a');
      const cyan = '#38bdf8';
      // Sleek octagonal hovering plasma drone
      roundedPoly(ctx, [[-w * 0.46, -h * 0.5 + hover], [0, -h * 0.92 + hover], [w * 0.46, -h * 0.5 + hover], [0, -h * 0.12 + hover]], hull, cyan, 2.2);
      drawEyeGlow(ctx, w * 0.16, -h * 0.52 + hover, 5 * scale, '#38bdf8');
      break;
    }

    case 'void_stalker': {
      const shell = pick('#3b0764');
      const neon = '#c084fc';
      // Tall hunched xeno-stalker with glowing plasma claws
      roundedPoly(ctx, [[-w * 0.24, 0], [-w * 0.3, -h * 0.72], [w * 0.24, -h * 0.88], [w * 0.34, -h * 0.48], [w * 0.18, 0]], shell, neon, 1.8);
      drawEyeGlow(ctx, w * 0.22, -h * 0.76, 3.6 * scale, '#38bdf8');
      // Energy wrist blades
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(w * 0.14, -h * 0.5);
      ctx.lineTo(w * 0.62, -h * 0.44);
      ctx.stroke();
      break;
    }

    case 'mech_turret': {
      const armor = pick('#334155');
      const trim = '#f43f5e';
      // Heavy tripod base + armored rail cannon housing
      roundedPoly(ctx, [[-w * 0.44, 0], [-w * 0.32, -h * 0.38], [w * 0.32, -h * 0.38], [w * 0.44, 0]], '#1e293b');
      roundedPoly(ctx, [[-w * 0.36, -h * 0.84], [w * 0.36, -h * 0.84], [w * 0.36, -h * 0.36], [-w * 0.36, -h * 0.36]], armor, trim, 2);
      // Twin laser rail barrel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w * 0.24, -h * 0.68, w * 0.42, 8 * scale);
      drawEyeGlow(ctx, w * 0.18, -h * 0.64, 4.5 * scale, trim);
      break;
    }

    // ===== DRAGON CRANE BESPOKE ENEMIES =====
    case 'crane_disciple': {
      const robe = pick('#f8fafc');
      const jade = '#10b981';
      // Flowing martial sash & conical bamboo hat
      drawFlowingCape(ctx, -w * 0.12, -h * 0.7, w * 0.56, h * 0.45, t * 2.4, jade, '#fde047');
      roundedPoly(ctx, [[-w * 0.24, 0], [-w * 0.2, -h * 0.78], [w * 0.2, -h * 0.78], [w * 0.24, 0]], robe, jade, 1.6);
      // Bamboo conical hat
      roundedPoly(ctx, [[-w * 0.48, -h * 0.82], [0, -h * 1.06], [w * 0.48, -h * 0.82]], '#d97706', '#fde68a', 1.4);
      drawEyeGlow(ctx, w * 0.12, -h * 0.78, 2.8 * scale, '#34d399');
      break;
    }

    case 'jade_sentinel': {
      const hover = Math.sin(t * 3.8) * 6 * scale;
      const jade = pick('#059669');
      const gold = '#fbbf24';
      // Floating carved emerald lantern spirit
      roundedPoly(ctx, [[0, -h * 0.96 + hover], [w * 0.38, -h * 0.54 + hover], [0, -h * 0.12 + hover], [-w * 0.38, -h * 0.54 + hover]], jade, gold, 2);
      drawEyeGlow(ctx, 0, -h * 0.54 + hover, 5.5 * scale, '#a7f3d0');
      break;
    }

    case 'cloud_wyrmling': {
      const wave = Math.sin(t * 5.2) * 7 * scale;
      const teal = pick('#14b8a6');
      const gold = '#fbbf24';
      // Sinuous winged sky-drake silhouette
      drawBatWing(ctx, -w * 0.08, -h * 0.58 + wave, -1, w * 0.72, h * 0.45, Math.sin(t * 10) * 10 * scale, '#f0fdfa', teal);
      drawBatWing(ctx, w * 0.08, -h * 0.58 + wave, 1, w * 0.72, h * 0.45, Math.sin(t * 10) * 10 * scale, '#f0fdfa', teal);
      ctx.strokeStyle = teal;
      ctx.lineWidth = 7 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, -h * 0.4 + wave);
      ctx.quadraticCurveTo(0, -h * 0.74 + wave, w * 0.42, -h * 0.58 + wave);
      ctx.stroke();
      drawEyeGlow(ctx, w * 0.36, -h * 0.62 + wave, 3.6 * scale, gold);
      break;
    }

    case 'dwarf_miner': {
      const stride = Math.sin(t * 7.5) * 4.5 * scale;
      const iron = pick('#475569');
      const amethyst = '#a855f7';
      const beard = '#d6c7a9';
      // Stocky dwarven boots
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w * 0.28 + stride * 0.5, -h * 0.22, w * 0.22, h * 0.22);
      ctx.fillRect(w * 0.06 - stride * 0.5, -h * 0.22, w * 0.22, h * 0.22);
      // Heavy iron mining vest + shoulder pad with amethyst crystal growth
      ctx.fillStyle = iron;
      ctx.fillRect(-w * 0.36, -h * 0.68, w * 0.72, h * 0.48);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(-w * 0.36, -h * 0.44, w * 0.72, h * 0.08);
      // Braided beard
      ctx.fillStyle = beard;
      ctx.beginPath();
      ctx.moveTo(-w * 0.22, -h * 0.64);
      ctx.lineTo(w * 0.22, -h * 0.64);
      ctx.lineTo(w * 0.14, -h * 0.34);
      ctx.lineTo(-w * 0.14, -h * 0.34);
      ctx.closePath();
      ctx.fill();
      // Iron miner helm with glowing corrupted crystal lamp
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -h * 0.74, w * 0.34, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-w * 0.38, -h * 0.75, w * 0.76, h * 0.08);
      // Glowing amethyst crystal erupting from helm & shoulder
      ctx.fillStyle = amethyst;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, -h * 0.88);
      ctx.lineTo(w * 0.3, -h * 0.98);
      ctx.lineTo(w * 0.28, -h * 0.76);
      ctx.closePath();
      ctx.fill();
      drawEyeGlow(ctx, w * 0.14, -h * 0.69, 3.2 * scale, '#e879f9');
      // Heavy crystal-tipped pickaxe
      ctx.save();
      ctx.translate(w * 0.24, -h * 0.5);
      ctx.rotate(isCharging ? -1.1 : 0.2 + Math.sin(t * 5) * 0.12);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 8 * scale);
      ctx.lineTo(0, -24 * scale);
      ctx.stroke();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 4.5 * scale;
      ctx.beginPath();
      ctx.moveTo(-14 * scale, -18 * scale);
      ctx.quadraticCurveTo(0, -28 * scale, 15 * scale, -16 * scale);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'dwarf_sapper': {
      const bob = Math.abs(Math.sin(t * 8)) * 3 * scale;
      const coat = pick('#581c87');
      // Sturdy boots & heavy leather apron
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-w * 0.26, -h * 0.22, w * 0.2, h * 0.22);
      ctx.fillRect(w * 0.08, -h * 0.22, w * 0.2, h * 0.22);
      ctx.fillStyle = coat;
      ctx.fillRect(-w * 0.34, -h * 0.66 - bob, w * 0.68, h * 0.46);
      // Explosive crystal powder keg strapped on back
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-w * 0.46, -h * 0.74 - bob, w * 0.3, h * 0.4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-w * 0.46, -h * 0.66 - bob, w * 0.3, h * 0.06);
      ctx.fillRect(-w * 0.46, -h * 0.48 - bob, w * 0.3, h * 0.06);
      // Sparking fuse above keg
      drawEyeGlow(ctx, -w * 0.32, -h * 0.82 - bob, 3.6 * scale, '#facc15');
      // Brass goggles & hood
      ctx.fillStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(0, -h * 0.74 - bob, w * 0.3, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(w * 0.02, -h * 0.73 - bob, w * 0.26, h * 0.11);
      drawEyeGlow(ctx, w * 0.15, -h * 0.68 - bob, 3 * scale, '#fef08a');
      // Glowing crystal satchel bomb held forward
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(w * 0.36, -h * 0.48 - bob, 7 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5d0fe';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }

    case 'runed_golem': {
      const stomp = Math.sin(t * 4.2) * 2.5 * scale;
      const slate = pick('#334155');
      const rune = '#c084fc';
      // Massive stone legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w * 0.34, -h * 0.32 + stomp, w * 0.26, h * 0.32);
      ctx.fillRect(w * 0.08, -h * 0.32 - stomp, w * 0.26, h * 0.32);
      // Angular dwarven masonry torso with gilded trim
      ctx.fillStyle = slate;
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, -h * 0.84);
      ctx.lineTo(w * 0.48, -h * 0.84);
      ctx.lineTo(w * 0.36, -h * 0.28);
      ctx.lineTo(-w * 0.36, -h * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      // Glowing amethyst chest rune diamond
      ctx.fillStyle = rune;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.72);
      ctx.lineTo(w * 0.16, -h * 0.58);
      ctx.lineTo(0, -h * 0.44);
      ctx.lineTo(-w * 0.16, -h * 0.58);
      ctx.closePath();
      ctx.fill();
      // Massive crystal-studded gauntlets
      ctx.fillStyle = '#475569';
      ctx.fillRect(w * 0.32, -h * 0.64, w * 0.24, h * 0.36);
      ctx.fillRect(-w * 0.56, -h * 0.64, w * 0.24, h * 0.36);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(w * 0.38, -h * 0.36, w * 0.14, h * 0.12);
      // Recessed gilded dwarven helm visor
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-w * 0.24, -h * 0.96, w * 0.48, h * 0.18);
      ctx.strokeStyle = '#fbbf24';
      ctx.strokeRect(-w * 0.24, -h * 0.96, w * 0.48, h * 0.18);
      drawEyeGlow(ctx, w * 0.08, -h * 0.87, 4.2 * scale, '#e879f9');
      break;
    }

    case 'boss_dwarf_king': {
      // THANE BORIN · THE GILDED HOLLOW — Towering Runed Dwarven Monarch with Amethyst Great-Maul!
      const sway = Math.sin(t * 3.4) * 3.5 * scale;
      const armor = pick(enemy.enraged ? '#581c87' : '#2e2442');
      const gold = '#f59e0b';
      const crystal = enemy.enraged ? '#f0abfc' : '#a855f7';

      // Royal tattered violet-gold cloak
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(-w * 0.44, -h * 0.8);
      ctx.lineTo(w * 0.32, -h * 0.8);
      ctx.lineTo(-w * 0.56, -h * 0.04);
      ctx.lineTo(-w * 0.12, -h * 0.06);
      ctx.closePath();
      ctx.fill();

      // Massive gilded greaves
      ctx.fillStyle = '#1e1b2e';
      ctx.fillRect(-w * 0.32, -h * 0.3, w * 0.24, h * 0.3);
      ctx.fillRect(w * 0.08, -h * 0.3, w * 0.24, h * 0.3);
      ctx.fillStyle = gold;
      ctx.fillRect(-w * 0.34, -h * 0.3, w * 0.28, h * 0.06);
      ctx.fillRect(w * 0.06, -h * 0.3, w * 0.28, h * 0.06);

      // Broad runed dwarven cuirass with glowing Heart of the Deep Vein core!
      ctx.fillStyle = armor;
      ctx.beginPath();
      ctx.moveTo(-w * 0.48, -h * 0.82 + sway);
      ctx.lineTo(w * 0.48, -h * 0.82 + sway);
      ctx.lineTo(w * 0.38, -h * 0.26 + sway);
      ctx.lineTo(-w * 0.38, -h * 0.26 + sway);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = gold;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glowing Heart of the Deep Vein embedded in chest
      const heartPulse = 1 + Math.sin(t * 7) * 0.15;
      ctx.fillStyle = crystal;
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.72 + sway);
      ctx.lineTo(w * 0.16 * heartPulse, -h * 0.56 + sway);
      ctx.lineTo(0, -h * 0.4 + sway);
      ctx.lineTo(-w * 0.16 * heartPulse, -h * 0.56 + sway);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -h * 0.56 + sway, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Giant jagged amethyst crystal pauldrons erupting off both shoulders
      ctx.fillStyle = crystal;
      ctx.beginPath();
      ctx.moveTo(-w * 0.42, -h * 0.78 + sway);
      ctx.lineTo(-w * 0.64, -h * 0.96 + sway);
      ctx.lineTo(-w * 0.32, -h * 0.92 + sway);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.42, -h * 0.78 + sway);
      ctx.lineTo(w * 0.62, -h * 0.95 + sway);
      ctx.lineTo(w * 0.3, -h * 0.9 + sway);
      ctx.closePath();
      ctx.fill();

      // Armored golden beard plate + spiked Runic Crown
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, -h * 0.78 + sway);
      ctx.lineTo(w * 0.24, -h * 0.78 + sway);
      ctx.lineTo(w * 0.16, -h * 0.56 + sway);
      ctx.lineTo(-w * 0.16, -h * 0.56 + sway);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-w * 0.24, -h * 0.96 + sway, w * 0.48, h * 0.18);
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(-w * 0.28, -h * 0.94 + sway);
      ctx.lineTo(-w * 0.2, -h * 1.1 + sway);
      ctx.lineTo(-w * 0.08, -h * 0.98 + sway);
      ctx.lineTo(0, -h * 1.14 + sway);
      ctx.lineTo(w * 0.08, -h * 0.98 + sway);
      ctx.lineTo(w * 0.2, -h * 1.1 + sway);
      ctx.lineTo(w * 0.28, -h * 0.94 + sway);
      ctx.closePath();
      ctx.fill();
      drawEyeGlow(ctx, w * 0.1, -h * 0.87 + sway, 5 * scale, '#f0abfc');

      // Colossal Runed Amethyst Great-Maul!
      ctx.save();
      ctx.translate(w * 0.36, -h * 0.55 + sway);
      ctx.rotate(isCharging ? -1.05 : 0.25 + Math.sin(t * 4) * 0.1);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 22 * scale);
      ctx.lineTo(0, -44 * scale);
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(-20 * scale, -56 * scale, 40 * scale, 22 * scale);
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2.4;
      ctx.strokeRect(-20 * scale, -56 * scale, 40 * scale, 22 * scale);
      ctx.fillStyle = crystal;
      ctx.fillRect(-14 * scale, -51 * scale, 28 * scale, 12 * scale);
      ctx.restore();
      break;
    }
  }

  ctx.restore();

  // Boss post-hit invulnerability ward shimmer
  if (isBossInvuln && !enemy.dead) {
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.72)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - h * 0.52, Math.max(w, h) * 0.56, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ENHANCED DIRECTIONAL & COLOR-CODED ATTACK TELEGRAPH SYSTEM!
  if (isCharging) {
    const cx = enemy.x;
    const cy = enemy.y - h * 0.56;
    const ringR = Math.max(10, w * 0.92 * (1.22 - chargeProg * 0.78));
    const kind = enemy.pendingAttackKind ?? '';
    const telegraphColor =
      kind === 'hop' || kind === 'teleport' || kind === 'blink' || kind === 'vault'
        ? '#60a5fa'
        : kind === 'dive' || kind === 'charge' || kind === 'lunge' || kind === 'pounce' || kind === 'leap' || kind === 'eclipse' || kind === 'chain'
          ? '#ff334b'
          : kind === 'slam' || kind === 'stomp' || kind === 'bomb' || kind === 'bomb_low' || kind === 'bomb_rain' || kind === 'lava' || kind === 'tombstone' || kind === 'pillars'
            ? '#f59e0b'
            : kind === 'hex' || kind === 'hex_fork' || kind === 'hex_fan' || kind === 'summon'
              ? '#34d399'
              : kind === 'wail' || kind === 'scythe' || kind === 'shards'
                ? '#22d3ee'
                : '#38bdf8';

    ctx.save();
    ctx.strokeStyle = telegraphColor;
    ctx.globalAlpha = 0.42 + chargeProg * 0.58;
    ctx.lineWidth = 2 + chargeProg * 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Directional Threat Arrow for charges / dives / lunges so player reads trajectory immediately!
    if (kind === 'charge' || kind === 'lunge' || kind === 'chain') {
      const arrowLen = (48 + chargeProg * 36) * scale;
      ctx.beginPath();
      ctx.moveTo(cx + enemy.facing * w * 0.45, cy);
      ctx.lineTo(cx + enemy.facing * (w * 0.45 + arrowLen), cy);
      ctx.stroke();
      ctx.fillStyle = telegraphColor;
      ctx.beginPath();
      ctx.moveTo(cx + enemy.facing * (w * 0.45 + arrowLen + 10), cy);
      ctx.lineTo(cx + enemy.facing * (w * 0.45 + arrowLen - 2), cy - 7);
      ctx.lineTo(cx + enemy.facing * (w * 0.45 + arrowLen - 2), cy + 7);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'dive' && (enemy.chargeVx !== 0 || enemy.chargeVy !== 0)) {
      const a = Math.atan2(enemy.chargeVy, enemy.chargeVx);
      const len = 62 + chargeProg * 42;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Crisp weapon glint spark right before release
    if (chargeProg > 0.5) {
      const gx = cx + enemy.facing * w * 0.36;
      const gy = cy - h * 0.16;
      const sr = (4 + (chargeProg - 0.5) * 12) * scale;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = (chargeProg - 0.5) * 2.0;
      ctx.beginPath();
      ctx.moveTo(gx, gy - sr);
      ctx.lineTo(gx + sr * 0.3, gy - sr * 0.3);
      ctx.lineTo(gx + sr, gy);
      ctx.lineTo(gx + sr * 0.3, gy + sr * 0.3);
      ctx.lineTo(gx, gy + sr);
      ctx.lineTo(gx - sr * 0.3, gy + sr * 0.3);
      ctx.lineTo(gx - sr, gy);
      ctx.lineTo(gx - sr * 0.3, gy - sr * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // Burning Embers DoT flames flickering over enemy
  if (enemy.burnTimer > 0 && !enemy.dead) {
    ctx.save();
    for (let f = 0; f < 3; f++) {
      const fx = enemy.x + Math.sin(enemy.animTime * 11 + f * 2.1) * (w * 0.34);
      const fy = enemy.y - h * (0.28 + f * 0.24);
      const flick = Math.cos(enemy.animTime * 14 + f * 1.7) * 3 * scale;
      ctx.fillStyle = f % 2 === 0 ? 'rgba(249, 115, 22, 0.88)' : 'rgba(250, 204, 21, 0.88)';
      ctx.beginPath();
      ctx.moveTo(fx, fy - 11 * scale - flick);
      ctx.lineTo(fx + 5 * scale, fy);
      ctx.lineTo(fx - 5 * scale, fy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (enemy.alertTimer > 0) {
    ctx.save();
    ctx.font = `700 ${Math.round(14 * Math.max(0.85, scale))}px "Cinzel", serif`;
    ctx.fillStyle = '#ff4757';
    ctx.textAlign = 'center';
    ctx.fillText('!', enemy.x, enemy.y - h - 12);
    ctx.restore();
  }

  if (!enemy.isBoss && enemy.hp < enemy.maxHp && enemy.hp > 0) {
    const barW = Math.max(26, w * 0.88);
    const barH = 4;
    const bx = enemy.x - barW / 2;
    const by = enemy.y - h - 10;
    ctx.fillStyle = '#0b0d13';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#c82333';
    ctx.fillRect(bx, by, barW * (enemy.hp / enemy.maxHp), barH);
  }
}

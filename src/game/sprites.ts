import { drawAffinitySwing } from './fxSwing';
/**
 * Simple, modular Canvas 2D sprite & tile drawing functions.
 * Every visual piece is isolated here with clean shapes and palette constants
 * so you can easily change colors, proportions, or swap in custom sprite sheets.
 */

import { drawAnimatedPlayer, drawCampHeroFigure } from './characterAnim';
import { getActiveElementDef } from './defaults';
import { drawDetailedEnemySprite, drawGroundHazard } from './enemyRenderer';
export { drawGroundHazard };
import {
  Afterimage,
  BossDeathSequence,
  CharacterId,
  ElementalArc,
  Enemy,
  GasCloud,
  GrappleState,
  HangingBrazier,
  HidingSpot,
  Interactable,
  PhantomAlly,
  Platform,
  Player,
  Projectile,
  SecretWall,
  ShockwaveRing,
  StageTheme,
  TorchProp,
} from './types';

export const SPRITE_PALETTE = {
  bridgeFill: '#3b2b24',
  bridgeTop: '#63493c',
  rafterFill: '#2f2936',
  rafterTop: '#6f778c',
  stoneLine: '#151822',

  // Player (Vampire Hunter)
  playerCloak: '#8f1d2c',
  playerArmor: '#2f384d',
  playerTrim: '#c9a66b',
  playerSkin: '#e6ccb2',
  playerHair: '#1c181a',
  whipCore: '#f6ebd2',
  whipEdge: '#e5a93c',

  // Enemies
  ghoulSkin: '#607a60',
  ghoulCloth: '#323836',
  skeletonBone: '#ddd6c7',
  skeletonJoint: '#8a8275',
  batWing: '#3a2449',
  batEye: '#ef4444',
  knightSteel: '#68748a',
  knightPlume: '#b82534',
  knightSpear: '#cbd5e1',

  // Boss 1: Lord Valerius
  bossCloak: '#6e0f1d',
  bossArmor: '#1c1926',
  bossGold: '#e5a93c',
  bossEye: '#ff334b',

  // Boss 2: Iron Colossus
  colossusIron: '#525b6e',
  colossusDark: '#262b38',
  colossusGlow: '#f59e0b',

  // Boss 3: Arch-Lich Malakor
  lichRobe: '#4a1230',
  lichTrim: '#d946ef',
  lichEye: '#ff2e63',
};

export function drawPlatformTile(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  theme: StageTheme,
  crumble?: { state: 'intact' | 'shaking' | 'broken'; timer: number },
  time = 0
): void {
  let { x, y } = p;
  const { w, h, style } = p;

  if (p.crumbling && crumble?.state === 'broken') {
    // Faint dashed ghost outline so players can anticipate when the crumbling ledge reforms
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 178, 128, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  const isShaking = Boolean(p.crumbling && crumble?.state === 'shaking');
  if (isShaking) {
    x += Math.sin(time * 72) * 2.8;
    y += Math.cos(time * 58) * 1.4;
  }

  if (style === 'bridge') {
    ctx.fillStyle = p.crumbling ? '#4d3326' : SPRITE_PALETTE.bridgeFill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isShaking ? '#f59e0b' : p.crumbling ? '#8c5f44' : SPRITE_PALETTE.bridgeTop;
    ctx.fillRect(x, y, w, 4);

    ctx.fillStyle = '#241914';
    for (let px = x + 28; px < x + w; px += 28) {
      ctx.fillRect(px, y + 2, 2, h - 2);
    }

    if (p.crumbling) {
      // Visual fracture cracks & hanging rubble bits so crumbling high-road ledges read immediately!
      ctx.strokeStyle = isShaking ? '#fde68a' : '#1b110d';
      ctx.lineWidth = isShaking ? 1.8 : 1.3;
      ctx.beginPath();
      for (let cx = x + 24; cx < x + w - 18; cx += 42) {
        ctx.moveTo(cx, y + 1);
        ctx.lineTo(cx + 6, y + h * 0.55);
        ctx.lineTo(cx - 2, y + h);
      }
      ctx.stroke();
    }
    return;
  }

  if (style === 'rafter') {
    ctx.fillStyle = SPRITE_PALETTE.rafterFill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = SPRITE_PALETTE.rafterTop;
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = '#181a24';
    ctx.fillRect(x, y + h - 3, w, 3);

    ctx.strokeStyle = '#9aa3b8';
    ctx.lineWidth = 1.5;
    for (let rx = x + 36; rx < x + w - 20; rx += 64) {
      ctx.beginPath();
      ctx.arc(rx, y + h + 4, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }

  if (style === 'timber') {
    // Rough-hewn Goblin timber walkway with rope bindings & iron nails
    ctx.fillStyle = '#422c1b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6b472b';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#26180e';
    ctx.fillRect(x, y + h - 3, w, 3);
    for (let px = x + 22; px < x + w; px += 24) {
      ctx.fillStyle = '#2b1b10';
      ctx.fillRect(px, y + 1, 2, h - 2);
    }
    // Rope lashes on ends
    ctx.fillStyle = '#a18052';
    ctx.fillRect(x + 6, y, 5, h);
    ctx.fillRect(x + w - 11, y, 5, h);
    return;
  }

  if (style === 'palisade') {
    // Sharpened vertical log palisade tower (ideal for Wall Cling!)
    ctx.fillStyle = '#332216';
    ctx.fillRect(x, y, w, h);
    const logW = 14;
    for (let lx = x; lx < x + w; lx += logW) {
      const lw = Math.min(logW - 1, x + w - lx);
      ctx.fillStyle = Math.floor((lx - x) / logW) % 2 === 0 ? '#4d3320' : '#3d2819';
      ctx.fillRect(lx, y + 6, lw, h - 6);
      // Sharpened log bevel top
      ctx.fillStyle = '#735032';
      ctx.fillRect(lx + 1, y, Math.max(2, lw - 2), 6);
    }
    // Iron/rope horizontal binding bands
    ctx.fillStyle = '#8c6d46';
    ctx.fillRect(x, y + 18, w, 5);
    if (h > 75) {
      ctx.fillRect(x, y + Math.floor(h * 0.58), w, 5);
    }
    // Subtle lighter side grip rim so Ronin players can clearly read climbable vertical walls
    ctx.fillStyle = 'rgba(214, 180, 128, 0.28)';
    ctx.fillRect(x, y + 4, 2, h - 4);
    ctx.fillRect(x + w - 2, y + 4, 2, h - 4);
    return;
  }

  if (style === 'camp_ground') {
    // Earthy gothic courtyard approach & dirt camp clearing
    ctx.fillStyle = '#18161c';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2d2824';
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = '#3b372c';
    ctx.fillRect(x, y, w, 4);

    // Subtle cobblestone flagstone accents leading toward castle gate
    ctx.fillStyle = '#252229';
    for (let cx = x + 16; cx < x + w; cx += 52) {
      ctx.fillRect(cx, y + 6, 32, 6);
    }
    // Small dark grass tufts on camp clearing
    ctx.fillStyle = '#2b3d30';
    for (let gx = x + 40; gx < x + w - 220; gx += 78) {
      ctx.fillRect(gx, y - 4, 3, 4);
      ctx.fillRect(gx + 5, y - 6, 2, 6);
      ctx.fillRect(gx + 9, y - 3, 2, 3);
    }
    return;
  }

  if (style === 'crypt_slab') {
    // Mossy weathered graveyard stone slab with engraved runes
    ctx.fillStyle = '#202629';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#3a4a45';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#121618';
    ctx.fillRect(x, y + h - 3, w, 3);
    // Vertical grave slab seams + faint mossy caps
    for (let sx = x + 36; sx < x + w; sx += 42) {
      ctx.fillStyle = '#121719';
      ctx.fillRect(sx, y + 3, 2, h - 4);
      ctx.fillStyle = '#2f5e4e';
      ctx.fillRect(sx - 8, y, 10, 3);
    }
    return;
  }

  if (style === 'obsidian') {
    // Dark volcanic basalt with glowing molten orange cracks
    ctx.fillStyle = '#191418';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#3b2422';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#0e0a0c';
    ctx.fillRect(x, y + h - 3, w, 3);
    for (let ox = x + 28; ox < x + w - 12; ox += 48) {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(ox, y + 5, 2, Math.min(h - 7, 14));
      ctx.fillStyle = '#facc15';
      ctx.fillRect(ox, y + 5, 1, Math.min(h - 9, 8));
    }
    return;
  }

  ctx.fillStyle = theme.stoneFill;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = style === 'boss_floor' ? theme.bossFloorTop : theme.stoneTop;
  ctx.fillRect(x, y, w, 7);

  ctx.strokeStyle = SPRITE_PALETTE.stoneLine;
  ctx.lineWidth = 1;
  const brickH = 22;
  const brickW = 44;
  ctx.beginPath();
  for (let row = 0; row * brickH < h; row++) {
    const by = y + 7 + row * brickH;
    if (by >= y + h) break;
    ctx.moveTo(x, by);
    ctx.lineTo(x + w, by);
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let bx = x + offset; bx < x + w; bx += brickW) {
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, Math.min(by + brickH, y + h));
    }
  }
  ctx.stroke();
}

export function drawHangingBrazier(
  ctx: CanvasRenderingContext2D,
  b: HangingBrazier,
  time: number,
  nearPlayer: boolean
): void {
  if (b.state === 'smashed') {
    const fade = Math.max(0, Math.min(1, b.smashTimer / 1.4));
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    // Scorched ember pile on the floor
    const glow = ctx.createRadialGradient(b.x, b.y - 4, 4, b.x, b.y - 4, 48);
    glow.addColorStop(0, 'rgba(249, 115, 22, 0.55)');
    glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(b.x, b.y - 4, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#262129';
    ctx.fillRect(b.x - 16, b.y - 6, 32, 6);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(b.x - 10, b.y - 8, 20, 3);
    ctx.restore();
    return;
  }

  const sway = b.state === 'hanging' ? Math.sin(time * 2.1 + b.swayPhase) * 3.5 : 0;
  const bx = b.x + sway;
  const by = b.y;

  ctx.save();
  // Iron suspension chain up to overhead anchor
  if (b.state === 'hanging') {
    ctx.strokeStyle = nearPlayer ? '#fde047' : '#64748b';
    ctx.lineWidth = nearPlayer ? 2.5 : 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(b.x, b.anchorY);
    ctx.lineTo(bx, by - 16);
    ctx.stroke();
    ctx.setLineDash([]);

    // Chain ring shackle at top
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.anchorY + 3, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Warm fire aura around cauldron
  const flicker = Math.sin(time * 13 + b.swayPhase) * 3;
  const auraR = b.state === 'falling' ? 68 : 52 + flicker;
  const aura = ctx.createRadialGradient(bx, by - 14, 4, bx, by - 14, auraR);
  aura.addColorStop(0, 'rgba(251, 146, 60, 0.42)');
  aura.addColorStop(0.55, 'rgba(234, 88, 12, 0.16)');
  aura.addColorStop(1, 'rgba(234, 88, 12, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(bx, by - 14, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Roaring flames inside iron basin
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(bx - 14, by - 12);
  ctx.quadraticCurveTo(bx - 6, by - 36 - flicker, bx, by - 26);
  ctx.quadraticCurveTo(bx + 7, by - 38 + flicker * 0.5, bx + 14, by - 12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.moveTo(bx - 8, by - 12);
  ctx.quadraticCurveTo(bx, by - 29 - flicker * 0.6, bx + 8, by - 12);
  ctx.closePath();
  ctx.fill();

  // Heavy wrought-iron cauldron bowl
  ctx.fillStyle = '#272a36';
  ctx.beginPath();
  ctx.moveTo(bx - 18, by - 12);
  ctx.lineTo(bx + 18, by - 12);
  ctx.lineTo(bx + 12, by + 4);
  ctx.lineTo(bx - 12, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = nearPlayer ? '#fde047' : '#525b70';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Bottom iron spike
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(bx - 5, by + 4);
  ctx.lineTo(bx + 5, by + 4);
  ctx.lineTo(bx, by + 11);
  ctx.closePath();
  ctx.fill();

  // Crisp prompt badge when player is close enough to hit or snap with [0]
  if (nearPlayer && b.state === 'hanging') {
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.fillText('HIT / [0] DROP', bx, by - 38);
  }
  ctx.restore();
}

export function drawMinstrelAimReticle(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number },
  time: number
): void {
  const pulse = 1 + Math.sin(time * 10) * 0.14;
  const r = 10 * pulse;

  ctx.save();
  ctx.translate(anchor.x, anchor.y);

  // Outer rose-gold diamond ring
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  // Rotating inner cardinal ticks
  ctx.rotate(time * 2.8);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    ctx.lineTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTorch(ctx: CanvasRenderingContext2D, torch: TorchProp, time: number): void {
  const flicker = Math.sin(time * 11 + torch.phase) * 2.2;
  const glowR = 54 + flicker * 3;

  const grad = ctx.createRadialGradient(torch.x, torch.y - 10, 2, torch.x, torch.y - 10, glowR);
  grad.addColorStop(0, 'rgba(245, 165, 58, 0.28)');
  grad.addColorStop(1, 'rgba(245, 165, 58, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(torch.x, torch.y - 10, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3b3e4c';
  ctx.fillRect(torch.x - 3, torch.y - 4, 6, 16);
  ctx.fillRect(torch.x - 6, torch.y - 6, 12, 4);

  ctx.fillStyle = '#e58e26';
  ctx.beginPath();
  ctx.moveTo(torch.x, torch.y - 20 - flicker * 0.5);
  ctx.lineTo(torch.x + 5, torch.y - 9);
  ctx.lineTo(torch.x, torch.y - 6);
  ctx.lineTo(torch.x - 5, torch.y - 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fce38a';
  ctx.beginPath();
  ctx.moveTo(torch.x, torch.y - 15 - flicker * 0.3);
  ctx.lineTo(torch.x + 2.5, torch.y - 9);
  ctx.lineTo(torch.x, torch.y - 7);
  ctx.lineTo(torch.x - 2.5, torch.y - 9);
  ctx.closePath();
  ctx.fill();
}

export function drawCampfire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  const f1 = Math.sin(time * 10.5) * 4.5;
  const f2 = Math.cos(time * 14.2) * 3.5;

  ctx.save();
  ctx.translate(x, y);

  // Huge warm radial campfire illumination onto camp & heroes
  const glowR = 175 + f1 * 3.5;
  const glow = ctx.createRadialGradient(0, -24, 8, 0, -24, glowR);
  glow.addColorStop(0, 'rgba(255, 162, 54, 0.44)');
  glow.addColorStop(0.45, 'rgba(234, 88, 12, 0.16)');
  glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -24, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Crossed charred logs
  ctx.fillStyle = '#3b2418';
  ctx.save();
  ctx.rotate(-0.22);
  ctx.fillRect(-26, -12, 52, 9);
  ctx.restore();
  ctx.save();
  ctx.rotate(0.24);
  ctx.fillRect(-24, -10, 48, 8);
  ctx.restore();

  // Outer crimson-orange flame tongues
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(-20, -6);
  ctx.quadraticCurveTo(-24, -28, -8 + f2 * 0.4, -44 - f1);
  ctx.quadraticCurveTo(0, -58 - f1 * 1.2, 10 - f2 * 0.4, -40 + f2);
  ctx.quadraticCurveTo(22, -24, 18, -6);
  ctx.closePath();
  ctx.fill();

  // Inner bright amber-gold flame core
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(-12, -7);
  ctx.quadraticCurveTo(-11, -24, -2 + f2 * 0.3, -36 - f1 * 0.8);
  ctx.quadraticCurveTo(6, -28, 12, -7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fffbeb';
  ctx.beginPath();
  ctx.moveTo(-5, -7);
  ctx.quadraticCurveTo(0, -24 - f1 * 0.5, 5, -7);
  ctx.closePath();
  ctx.fill();

  // Stone fireplace hearth ring in front of the flames
  const stones = [-26, -16, -5, 6, 17, 25];
  for (let i = 0; i < stones.length; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#474c5c' : '#353a47';
    ctx.fillRect(stones[i] - 6, -9, 12, 9);
    ctx.fillStyle = '#62697d';
    ctx.fillRect(stones[i] - 5, -9, 10, 2);
  }

  // Rising glowing fire embers
  for (let i = 0; i < 7; i++) {
    const cycle = (time * 0.75 + i * 0.37) % 1;
    const ex = Math.sin(time * 2.5 + i * 1.9) * 18;
    const ey = -18 - cycle * 88;
    const alpha = Math.max(0, 1 - cycle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#fb923c';
    ctx.fillRect(ex - 1.5, ey - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawInteractable(
  ctx: CanvasRenderingContext2D,
  item: Interactable,
  isNearby: boolean,
  time: number,
  activeCharacterId: CharacterId = 'hunter',
  playerScale = 1
): void {
  ctx.save();
  ctx.translate(item.x, item.y);

  switch (item.kind) {
    case 'chest': {
      ctx.fillStyle = '#4a3228';
      ctx.fillRect(-16, -20, 32, 20);
      ctx.fillStyle = '#8b6f47';
      ctx.fillRect(-16, -20, 32, 4);
      ctx.fillRect(-3, -18, 6, 8);
      if (item.used) {
        ctx.fillStyle = '#2a1d17';
        ctx.fillRect(-14, -27, 28, 7);
      } else {
        ctx.fillStyle = '#e5a93c';
        ctx.fillRect(-2, -14, 4, 4);
      }
      break;
    }

    case 'boss_chest':
    case 'boss_relic': {
      // Floating Arcane Boss Relic forged from sprouted Boss Soul Energy!
      const isBig = Boolean(item.isBigBossRelic);
      const accent = item.relicColor ?? (isBig ? '#ff334b' : '#ffd166');
      const coreColor = isBig ? '#fff5d6' : '#fef9c3';
      const hoverY = -58 + Math.sin(time * 3.8) * 9;

      if (item.used) {
        // Residual fading rune circle on the stone floor once absorbed
        ctx.strokeStyle = 'rgba(229, 169, 60, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -3, 20, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      // Vertical skyward energy pillar
      const beamW = isBig ? 62 : 40;
      const beamH = isBig ? 220 : 155;
      const beamPulse = 0.28 + Math.sin(time * 6) * 0.1;
      const beam = ctx.createLinearGradient(0, -beamH, 0, 0);
      beam.addColorStop(0, `${accent}00`);
      beam.addColorStop(0.6, `${accent}${Math.round(beamPulse * 255).toString(16).padStart(2, '0')}`);
      beam.addColorStop(1, `${accent}00`);
      ctx.fillStyle = beam;
      ctx.fillRect(-beamW / 2, -beamH, beamW, beamH);

      // Glowing floor summoning rune
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.65 + Math.sin(time * 5) * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, -3, isBig ? 34 : 24, isBig ? 9 : 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Radiant halo aura behind floating crystal
      const auraR = isBig ? 58 : 40;
      const aura = ctx.createRadialGradient(0, hoverY, 4, 0, hoverY, auraR);
      aura.addColorStop(0, coreColor);
      aura.addColorStop(0.4, `${accent}88`);
      aura.addColorStop(1, `${accent}00`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, hoverY, auraR, 0, Math.PI * 2);
      ctx.fill();

      // Rotating arcane halo rings around the floating relic
      ctx.save();
      ctx.translate(0, hoverY);
      ctx.strokeStyle = accent;
      ctx.lineWidth = isBig ? 2.8 : 2;
      ctx.save();
      ctx.rotate(time * 1.9);
      ctx.scale(1, 0.38);
      ctx.beginPath();
      ctx.arc(0, 0, isBig ? 34 : 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.rotate(-time * 2.4);
      ctx.scale(0.42, 1);
      ctx.strokeStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 0, isBig ? 30 : 21, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (isBig) {
        ctx.save();
        ctx.rotate(time * 1.2 + Math.PI / 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Faceted Levitating Diamond Relic Core!
      const rx = isBig ? 17 : 12;
      const ry = isBig ? 25 : 18;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(0, -ry);
      ctx.lineTo(rx, 0);
      ctx.lineTo(0, ry);
      ctx.lineTo(-rx, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#090b10';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner incandescent highlight facet
      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.moveTo(0, -ry * 0.62);
      ctx.lineTo(rx * 0.52, -ry * 0.05);
      ctx.lineTo(0, ry * 0.45);
      ctx.lineTo(-rx * 0.45, -ry * 0.05);
      ctx.closePath();
      ctx.fill();

      // Orbiting crystalline energy shards
      const shardCount = isBig ? 6 : 4;
      for (let i = 0; i < shardCount; i++) {
        const a = time * 2.8 + (i * Math.PI * 2) / shardCount;
        const sx = Math.cos(a) * (isBig ? 29 : 21);
        const sy = Math.sin(a) * (isBig ? 14 : 10);
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#ffd166';
        ctx.beginPath();
        ctx.arc(sx, sy, isBig ? 3.2 : 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Rising luminous motes from floor to relic
      for (let m = 0; m < (isBig ? 8 : 5); m++) {
        const cycle = (time * 0.85 + m * 0.23) % 1;
        const mx = Math.sin(time * 3 + m * 2.1) * (isBig ? 22 : 14);
        const my = -cycle * (isBig ? 115 : 88);
        ctx.globalAlpha = (1 - cycle) * 0.85;
        ctx.fillStyle = m % 2 === 0 ? accent : '#ffffff';
        ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;
      break;
    }

    case 'exit_door':
    case 'camp_raid_gate': {
      const isLocked = Boolean(item.locked);
      const isCampGate = item.kind === 'camp_raid_gate';
      const doorW = isCampGate ? 88 : 74;
      const doorH = isCampGate ? 148 : 132;

      // Stone gothic arch frame
      ctx.fillStyle = '#242938';
      ctx.beginPath();
      ctx.moveTo(-doorW / 2 - 12, 0);
      ctx.lineTo(-doorW / 2 - 12, -doorH + 34);
      ctx.quadraticCurveTo(0, -doorH - 22, doorW / 2 + 12, -doorH + 34);
      ctx.lineTo(doorW / 2 + 12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#47506b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner doorway void / golden open glow
      ctx.beginPath();
      ctx.moveTo(-doorW / 2, 0);
      ctx.lineTo(-doorW / 2, -doorH + 34);
      ctx.quadraticCurveTo(0, -doorH - 8, doorW / 2, -doorH + 34);
      ctx.lineTo(doorW / 2, 0);
      ctx.closePath();

      if (isLocked) {
        ctx.fillStyle = '#090a10';
        ctx.fill();
        // Heavy iron portcullis bars + crimson boss seal
        ctx.fillStyle = '#3b4257';
        for (let bx = -doorW / 2 + 10; bx <= doorW / 2 - 10; bx += 14) {
          ctx.fillRect(bx - 2, -doorH + 22, 4, doorH - 22);
        }
        ctx.fillRect(-doorW / 2, -doorH * 0.48, doorW, 5);
        // Glowing red lock sigil
        ctx.fillStyle = '#c82333';
        ctx.beginPath();
        ctx.arc(0, -doorH * 0.46, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        const portalGrad = ctx.createLinearGradient(0, -doorH, 0, 0);
        portalGrad.addColorStop(0, isCampGate ? '#3d101c' : '#2a2216');
        portalGrad.addColorStop(1, isCampGate ? '#991b2e' : '#e5a93c');
        ctx.fillStyle = portalGrad;
        ctx.fill();

        const glow = ctx.createRadialGradient(0, -doorH * 0.45, 8, 0, -doorH * 0.45, 92);
        glow.addColorStop(
          0,
          isCampGate ? 'rgba(220, 38, 38, 0.34)' : 'rgba(229, 169, 60, 0.36)'
        );
        glow.addColorStop(1, 'rgba(229, 169, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -doorH * 0.45, 92, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'cursed_door': {
      const doorW = 74;
      const doorH = 132;
      const pulse = Math.sin(time * 5.2) * 0.5 + 0.5;

      // Towering Crimson-Violet Cursed Archway
      ctx.fillStyle = '#1f1024';
      ctx.beginPath();
      ctx.moveTo(-doorW / 2 - 14, 0);
      ctx.lineTo(-doorW / 2 - 14, -doorH + 34);
      ctx.quadraticCurveTo(0, -doorH - 26, doorW / 2 + 14, -doorH + 34);
      ctx.lineTo(doorW / 2 + 14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Swirling Cursed Portal Core
      ctx.beginPath();
      ctx.moveTo(-doorW / 2, 0);
      ctx.lineTo(-doorW / 2, -doorH + 34);
      ctx.quadraticCurveTo(0, -doorH - 8, doorW / 2, -doorH + 34);
      ctx.lineTo(doorW / 2, 0);
      ctx.closePath();
      const portalGrad = ctx.createLinearGradient(0, -doorH, 0, 0);
      portalGrad.addColorStop(0, '#2e0722');
      portalGrad.addColorStop(0.55, '#9f1239');
      portalGrad.addColorStop(1, '#7e22ce');
      ctx.fillStyle = portalGrad;
      ctx.fill();

      // Pulsing outer cursed aura
      const aura = ctx.createRadialGradient(0, -doorH * 0.48, 8, 0, -doorH * 0.48, 96 + pulse * 14);
      aura.addColorStop(0, `rgba(244, 63, 94, ${0.4 + pulse * 0.2})`);
      aura.addColorStop(0.55, `rgba(168, 85, 247, ${0.22 + pulse * 0.1})`);
      aura.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -doorH * 0.48, 96 + pulse * 14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Skull Keystone above Cursed Door
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, -doorH + 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1f0716';
      ctx.fillRect(-4, -doorH + 4, 3, 3);
      ctx.fillRect(1, -doorH + 4, 3, 3);
      break;
    }

    case 'cursed_shrine': {
      const pulse = Math.sin(time * 5.8) * 3;
      // Obsidian Blood Pedestal
      ctx.fillStyle = '#1b1122';
      ctx.fillRect(-22, -12, 44, 12);
      ctx.fillRect(-13, -44, 26, 32);
      ctx.fillStyle = '#4c1d3d';
      ctx.fillRect(-18, -48, 36, 6);

      if (!item.used) {
        const glow = ctx.createRadialGradient(0, -64 + pulse, 4, 0, -64 + pulse, 56);
        glow.addColorStop(0, 'rgba(244, 63, 94, 0.52)');
        glow.addColorStop(0.55, 'rgba(168, 85, 247, 0.24)');
        glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -64 + pulse, 56, 0, Math.PI * 2);
        ctx.fill();

        // Floating Crimson Blood Chalice / Sigil
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, -78 + pulse);
        ctx.lineTo(12, -62 + pulse);
        ctx.lineTo(0, -48 + pulse);
        ctx.lineTo(-12, -62 + pulse);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      break;
    }

    case 'secret_cache': {
      const floatY = Math.sin(time * 5) * 3.5;
      const isRelic = Boolean(item.isBigBossRelic);
      const glowCol = isRelic ? 'rgba(192, 132, 252, 0.45)' : 'rgba(255, 209, 102, 0.45)';
      if (!item.used) {
        const glow = ctx.createRadialGradient(0, -24 + floatY, 3, 0, -24 + floatY, 44);
        glow.addColorStop(0, glowCol);
        glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -24 + floatY, 44, 0, Math.PI * 2);
        ctx.fill();
      }
      // Ornate Secret Coffer
      ctx.fillStyle = item.used ? '#292c38' : '#582f1b';
      ctx.fillRect(-16, -22, 32, 22);
      ctx.strokeStyle = item.used ? '#475569' : isRelic ? '#c084fc' : '#ffd166';
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -22, 32, 22);
      ctx.fillStyle = item.used ? '#475569' : '#fde047';
      ctx.fillRect(-4, -15, 8, 6);
      break;
    }

    case 'camp_hero_hunter': {
      const isSelected = activeCharacterId === 'hunter';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'hunter', 0, 0, 1, playerScale, time, false);
      } else {
        // Subtle camp seat/log marker where Hunter rests when not active
        ctx.fillStyle = '#33241c';
        ctx.fillRect(-16, -9, 32, 9);
      }
      break;
    }

    case 'camp_hero_brute': {
      const isSelected = activeCharacterId === 'brute';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'brute', 0, 0, -1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#33241c';
        ctx.fillRect(-18, -10, 36, 10);
      }
      break;
    }

    case 'camp_hero_ronin': {
      const isSelected = activeCharacterId === 'ronin';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'ronin', 0, 0, -1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#33241c';
        ctx.fillRect(-16, -9, 32, 9);
      }
      break;
    }

    case 'camp_hero_minstrel': {
      const isSelected = activeCharacterId === 'minstrel';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'minstrel', 0, 0, -1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#33241c';
        ctx.fillRect(-15, -9, 30, 9);
      }
      break;
    }

    case 'camp_hero_monk': {
      const isSelected = activeCharacterId === 'monk';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'monk', 0, 0, -1, playerScale, time, false);
      } else {
        // Prayer mat where the Monk kneels when not active
        ctx.fillStyle = '#3f3a36';
        ctx.fillRect(-18, -4, 36, 4);
      }
      break;
    }

    case 'camp_hero_wizard': {
      const isSelected = activeCharacterId === 'wizard';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'wizard', 0, 0, 1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-14, -8, 28, 8);
      }
      break;
    }

    case 'camp_weapon_rack': {
      // Gothic timber weapon rack displaying Whip, Sword, Katana, and War Hammer
      ctx.fillStyle = '#3b2820';
      ctx.fillRect(-34, -56, 6, 56);
      ctx.fillRect(28, -56, 6, 56);
      ctx.fillRect(-38, -52, 76, 6);
      ctx.fillRect(-36, -22, 72, 5);

      // Whip coiled on left
      ctx.strokeStyle = '#e5a93c';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-20, -34, 6.5, 0, Math.PI * 1.6);
      ctx.stroke();

      // Silver Broadsword
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-7, -50, 4, 34);
      ctx.fillStyle = '#e5a93c';
      ctx.fillRect(-12, -24, 14, 3);

      // Crimson Katana
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(5, -52, 3, 36);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(4, -23, 5, 10);

      // War Hammer on right
      ctx.fillStyle = '#78716c';
      ctx.fillRect(17, -46, 4, 34);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(11, -50, 15, 9);
      break;
    }

    case 'camp_craft_bench': {
      // Blacksmith Anvil + Glowing Forge Coals + Alchemy Shelf
      const pulse = Math.sin(time * 6.5) * 4;
      const forgeGlow = ctx.createRadialGradient(-16, -24, 3, -16, -24, 56 + pulse);
      forgeGlow.addColorStop(0, 'rgba(249, 115, 22, 0.36)');
      forgeGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = forgeGlow;
      ctx.beginPath();
      ctx.arc(-16, -24, 56 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Stone forge hearth
      ctx.fillStyle = '#2d3242';
      ctx.fillRect(-34, -28, 34, 28);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-30, -32, 26, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-24, -31, 14, 3);

      // Iron Anvil right beside forge
      ctx.fillStyle = '#475569';
      ctx.fillRect(8, -12, 24, 12);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(4, -24);
      ctx.lineTo(36, -24);
      ctx.lineTo(42, -18);
      ctx.lineTo(30, -12);
      ctx.lineTo(10, -12);
      ctx.closePath();
      ctx.fill();

      // Glowing potion bottles on bench edge
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-28, -42, 6, 10);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-18, -44, 6, 12);
      break;
    }

    case 'brazier': {
      ctx.fillStyle = '#33394a';
      ctx.fillRect(-10, -8, 20, 8);
      ctx.fillRect(-5, -24, 10, 16);
      ctx.fillStyle = '#505870';
      ctx.fillRect(-14, -30, 28, 7);

      if (item.used) {
        const flick = Math.sin(time * 12) * 3;
        const glow = ctx.createRadialGradient(0, -38, 2, 0, -38, 52);
        glow.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
        glow.addColorStop(1, 'rgba(96, 165, 250, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -38, 52, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(0, -52 - flick);
        ctx.lineTo(10, -31);
        ctx.lineTo(-10, -31);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'fountain': {
      ctx.fillStyle = '#3f4659';
      ctx.fillRect(-20, -14, 40, 14);
      ctx.fillRect(-10, -34, 20, 20);
      ctx.fillStyle = item.used ? '#3a3240' : '#c82333';
      ctx.fillRect(-16, -18, 32, 5);
      if (!item.used) {
        const pulse = Math.sin(time * 6) * 2;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-3, -36 - pulse, 6, 20 + pulse);
      }
      break;
    }

    case 'shrine': {
      ctx.fillStyle = '#2d3142';
      ctx.fillRect(-13, -44, 26, 44);
      ctx.fillStyle = item.used ? '#494e63' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(7, -25);
      ctx.lineTo(0, -14);
      ctx.lineTo(-7, -25);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'upgrade_altar': {
      ctx.fillStyle = '#2c2938';
      ctx.fillRect(-18, -10, 36, 10);
      ctx.fillRect(-11, -34, 22, 24);
      ctx.fillStyle = '#5c4b3a';
      ctx.fillRect(-15, -38, 30, 5);

      if (!item.used) {
        const floatY = Math.sin(time * 4.5) * 4;
        const glow = ctx.createRadialGradient(0, -56 + floatY, 3, 0, -56 + floatY, 44);
        glow.addColorStop(0, 'rgba(229, 169, 60, 0.45)');
        glow.addColorStop(1, 'rgba(229, 169, 60, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -56 + floatY, 44, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.moveTo(0, -68 + floatY);
        ctx.lineTo(10, -56 + floatY);
        ctx.lineTo(0, -44 + floatY);
        ctx.lineTo(-10, -56 + floatY);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
  }

  // Interactive prompt label
  const hidePrompt =
    item.used ||
    (item.kind === 'camp_hero_hunter' && activeCharacterId === 'hunter') ||
    (item.kind === 'camp_hero_brute' && activeCharacterId === 'brute') ||
    (item.kind === 'camp_hero_ronin' && activeCharacterId === 'ronin') ||
    (item.kind === 'camp_hero_minstrel' && activeCharacterId === 'minstrel') ||
    (item.kind === 'camp_hero_monk' && activeCharacterId === 'monk') ||
    (item.kind === 'camp_hero_wizard' && activeCharacterId === 'wizard');

  if (isNearby && !hidePrompt) {
    const bob = Math.sin(time * 6) * 2.5;
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const text = item.locked ? 'LOCKED — Defeat Room Boss' : `[0] ${item.label}`;
    const tw = ctx.measureText(text).width;
    const py =
      item.kind === 'exit_door' || item.kind === 'cursed_door' || item.kind === 'camp_raid_gate'
        ? -164
        : item.kind === 'upgrade_altar' ||
            item.kind === 'cursed_shrine' ||
            item.kind === 'boss_chest' ||
            item.kind === 'boss_relic'
          ? -108
          : -76;
    ctx.fillStyle = 'rgba(11, 13, 19, 0.92)';
    ctx.fillRect(-tw / 2 - 8, py + bob, tw + 16, 20);
    ctx.strokeStyle =
      item.locked
        ? '#c82333'
        : item.kind === 'cursed_door' || item.kind === 'cursed_shrine'
          ? '#f43f5e'
          : '#e5a93c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-tw / 2 - 8, py + bob, tw + 16, 20);
    ctx.fillStyle = item.locked ? '#fca5a5' : '#f3efe6';
    ctx.fillText(text, 0, py + 14 + bob);
  }

  ctx.restore();
}

export function drawBossDeathSequence(
  ctx: CanvasRenderingContext2D,
  seq: BossDeathSequence,
  time: number
): void {
  const prog = Math.max(0, Math.min(1, 1 - seq.timer / seq.duration));
  const isBig = seq.isBigBoss;
  const cx = seq.x;
  const cy = seq.y - 38;
  const relicY = seq.floorY - 58;
  const curY = cy + (relicY - cy) * Math.min(1, prog * 1.15);

  ctx.save();

  // Phase 1 (0..0.75): Blazing Energy Beams Sprouting Violently Outward from the Slain Boss!
  const beamCount = isBig ? 14 : 9;
  const sproutStrength = prog < 0.72 ? Math.sin((prog / 0.72) * Math.PI) : (1 - prog) * 2.5;
  for (let i = 0; i < beamCount; i++) {
    const baseAngle = -Math.PI + (i / (beamCount - 1)) * Math.PI + Math.sin(time * 4 + i) * 0.08;
    const len = (isBig ? 290 : 185) * (0.45 + sproutStrength * 0.85) * (0.7 + ((i * 37) % 10) * 0.04);
    const width = (isBig ? 14 : 9) * (0.4 + sproutStrength * 0.7);
    ctx.save();
    ctx.translate(cx, curY);
    ctx.rotate(baseAngle);
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.28, seq.color);
    grad.addColorStop(0.7, seq.secondaryColor);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.globalAlpha = Math.max(0, Math.min(0.95, sproutStrength * 1.1));
    ctx.beginPath();
    ctx.moveTo(0, -width * 0.35);
    ctx.lineTo(len, -width * 1.1);
    ctx.lineTo(len * 1.08, 0);
    ctx.lineTo(len, width * 1.1);
    ctx.lineTo(0, width * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Towering vertical soul pillar erupting skyward
  const pillarW = (isBig ? 96 : 56) * (0.35 + Math.sin(prog * Math.PI) * 0.85);
  const pillarGrad = ctx.createLinearGradient(cx, seq.floorY, cx, seq.floorY - (isBig ? 460 : 310));
  pillarGrad.addColorStop(0, seq.color);
  pillarGrad.addColorStop(0.45, seq.secondaryColor);
  pillarGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = Math.sin(prog * Math.PI) * (isBig ? 0.68 : 0.5);
  ctx.fillStyle = pillarGrad;
  ctx.fillRect(cx - pillarW / 2, seq.floorY - (isBig ? 460 : 310), pillarW, isBig ? 460 : 310);

  // Expanding concentric soul-rings
  ctx.globalAlpha = Math.max(0, 1 - prog * 0.6);
  const ringR = (isBig ? 135 : 88) * (1 - prog * 0.65) + Math.sin(time * 24) * 5;
  ctx.strokeStyle = seq.color;
  ctx.lineWidth = isBig ? 4.5 : 3;
  ctx.beginPath();
  ctx.arc(cx, curY, Math.max(12, ringR), 0, Math.PI * 2);
  ctx.stroke();

  if (isBig) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    ctx.arc(cx, curY, Math.max(18, ringR * 1.38), time * 3, time * 3 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Condensing blinding core flash right before relic materializes!
  const coreR = (isBig ? 44 : 28) * (0.4 + Math.pow(prog, 1.5) * 1.1);
  const coreGlow = ctx.createRadialGradient(cx, curY, 2, cx, curY, coreR * 2.1);
  coreGlow.addColorStop(0, '#ffffff');
  coreGlow.addColorStop(0.45, seq.color);
  coreGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(cx, curY, coreR * 2.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawExecutionMark(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  scale: number,
  time: number
): void {
  const h = enemy.baseH * scale;
  const cx = enemy.x;
  const cy = enemy.y - h - 22 + Math.sin(time * 10) * 3;
  const pulse = 1 + Math.sin(time * 14) * 0.14;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);

  // Crimson assassination diamond reticle
  ctx.strokeStyle = '#ff334b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.stroke();

  // Inner fang dot
  ctx.fillStyle = '#fff1f2';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  // Subtle execution label
  ctx.font = '800 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff334b';
  ctx.fillText('EXECUTE', 0, -13);
  ctx.restore();
}

export function drawHidingSpotBack(
  ctx: CanvasRenderingContext2D,
  spot: HidingSpot
): void {
  const topY = spot.y - spot.h;
  ctx.save();

  if (spot.kind === 'alcove') {
    // Deep shadowy recessed stone niche behind player
    ctx.fillStyle = '#07080e';
    ctx.beginPath();
    ctx.moveTo(spot.x + 4, spot.y);
    ctx.lineTo(spot.x + 4, topY + 26);
    ctx.quadraticCurveTo(spot.x + spot.w / 2, topY - 4, spot.x + spot.w - 4, topY + 26);
    ctx.lineTo(spot.x + spot.w - 4, spot.y);
    ctx.closePath();
    ctx.fill();

    // Inner rim highlight so the alcove reads clearly in dark hallways
    ctx.strokeStyle = '#31374d';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Velvet drapery rod & dark shadow behind curtain
    ctx.fillStyle = 'rgba(7, 8, 14, 0.78)';
    ctx.fillRect(spot.x + 3, topY + 8, spot.w - 6, spot.h - 8);

    // Ornate iron & gold curtain rod
    ctx.fillStyle = '#7c6742';
    ctx.fillRect(spot.x - 6, topY + 4, spot.w + 12, 5);
    ctx.fillStyle = '#d4a346';
    ctx.fillRect(spot.x - 8, topY + 3, 5, 7);
    ctx.fillRect(spot.x + spot.w + 3, topY + 3, 5, 7);
  }

  ctx.restore();
}

export function drawHidingSpotFront(
  ctx: CanvasRenderingContext2D,
  spot: HidingSpot,
  playerInside: boolean
): void {
  const topY = spot.y - spot.h;
  ctx.save();

  // Become translucent when the player hides inside so they remain clearly visible through cover
  ctx.globalAlpha = playerInside ? 0.34 : 0.84;

  if (spot.kind === 'alcove') {
    // Stone gothic archway veil in front of the niche
    const veilGrad = ctx.createLinearGradient(spot.x, topY, spot.x, spot.y);
    veilGrad.addColorStop(0, '#141724');
    veilGrad.addColorStop(1, '#090b12');
    ctx.fillStyle = veilGrad;
    ctx.beginPath();
    ctx.moveTo(spot.x + 4, spot.y);
    ctx.lineTo(spot.x + 4, topY + 26);
    ctx.quadraticCurveTo(spot.x + spot.w / 2, topY - 4, spot.x + spot.w - 4, topY + 26);
    ctx.lineTo(spot.x + spot.w - 4, spot.y);
    ctx.closePath();
    ctx.fill();

    // Left & right carved stone pillars
    ctx.fillStyle = '#2b3042';
    ctx.fillRect(spot.x, topY + 20, 7, spot.h - 20);
    ctx.fillRect(spot.x + spot.w - 7, topY + 20, 7, spot.h - 20);
    ctx.fillStyle = '#474f69';
    ctx.fillRect(spot.x, topY + 20, 2, spot.h - 20);
    ctx.fillRect(spot.x + spot.w - 2, topY + 20, 2, spot.h - 20);
  } else {
    // Heavy crimson gothic curtain folds in front of the player
    const folds = 4;
    const foldW = spot.w / folds;
    for (let i = 0; i < folds; i++) {
      const fx = spot.x + i * foldW;
      ctx.fillStyle = i % 2 === 0 ? '#5c1424' : '#430e1a';
      ctx.fillRect(fx, topY + 9, foldW + 0.5, spot.h - 11);
      ctx.fillStyle = 'rgba(218, 165, 76, 0.28)';
      ctx.fillRect(fx + 1, topY + 9, 2, spot.h - 11);
    }
    // Gold bottom hem trim
    ctx.fillStyle = '#c89b3c';
    ctx.fillRect(spot.x, spot.y - 5, spot.w, 3);
  }

  ctx.restore();

  // Crisp silhouette outline + HIDDEN badge when player is concealed inside
  if (playerInside) {
    ctx.save();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(spot.x + 2, topY + 6, spot.w - 4, spot.h - 8);
    ctx.setLineDash([]);

    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(11, 13, 19, 0.85)';
    ctx.fillRect(spot.x + spot.w / 2 - 28, topY - 18, 56, 15);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    ctx.strokeRect(spot.x + spot.w / 2 - 28, topY - 18, 56, 15);
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('HIDDEN', spot.x + spot.w / 2, topY - 7);
    ctx.restore();
  }
}

export function drawAfterimage(
  ctx: CanvasRenderingContext2D,
  ghost: Afterimage,
  baseW: number,
  baseH: number,
  crouchBaseH: number,
  scale: number
): void {
  const alpha = (ghost.life / ghost.maxLife) * 0.42;
  const w = baseW * scale;
  const h = (ghost.crouching ? crouchBaseH : baseH) * scale;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.translate(ghost.x, ghost.y);
  ctx.scale(ghost.facing, 1);
  ctx.fillStyle = ghost.color;
  ctx.fillRect(-w * 0.36, -h, w * 0.72, h);
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -h * 0.72);
  ctx.lineTo(-w * 0.68, -h * 0.14);
  ctx.lineTo(-w * 0.12, -h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scale: number
): void {
  drawAnimatedPlayer(ctx, player, scale);
}

export function drawWeaponAttack(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scale: number,
  range: number
): void {
  const isFlaming = player.fireWeaponTimer > 0;
  const weaponLv = 1 + player.weaponDamageBonus;
  const evoTier = Math.floor(Math.max(0, player.weaponDamageBonus) / 5);
  const activeEl = getActiveElementDef(player.baseElements, player.combinedElement);

  // affinity-v1: element-styled swing + weapon-evolution tier layers (runes, serrated edge, fissure core)
  drawAffinitySwing(ctx, player, scale, range);

  // 0. KATANA KEY [3] — Charged Huge Wide Iaijutsu Mega Slash (renders even when attackState === 'idle'!)
  if (player.katanaMegaSlashTimer > 0) {
    const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
    const progress =
      player.katanaMegaSlashMax > 0
        ? player.katanaMegaSlashTimer / player.katanaMegaSlashMax
        : 0;
    const cx = player.x + player.facing * 20 * scale;
    const cy = player.y - h * 0.56;
    const megaRadius = range * scale * (weaponLv >= 4 ? 2.15 : 1.9);
    const startA = player.facing === 1 ? -Math.PI * 0.78 : Math.PI * 0.22;
    const endA = player.facing === 1 ? Math.PI * 0.68 : Math.PI * 1.78;

    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 1.5);

    const grad = ctx.createRadialGradient(cx, cy, megaRadius * 0.2, cx, cy, megaRadius);
    grad.addColorStop(0, 'rgba(244, 63, 94, 0.05)');
    grad.addColorStop(0.65, isFlaming ? 'rgba(249, 115, 22, 0.38)' : 'rgba(244, 63, 94, 0.36)');
    grad.addColorStop(1, 'rgba(255, 228, 230, 0.55)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, megaRadius, startA, endA, false);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isFlaming ? '#fb923c' : '#f43f5e';
    ctx.lineWidth = Math.max(10, 18 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, megaRadius * 0.88, startA, endA, false);
    ctx.stroke();

    ctx.strokeStyle = '#fff1f2';
    ctx.lineWidth = Math.max(4, 6 * scale);
    ctx.beginPath();
    ctx.arc(cx, cy, megaRadius * 0.96, startA, endA, false);
    ctx.stroke();

    // Inner gleaming crimson shock crescent
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.arc(cx, cy, megaRadius * 0.72, startA + 0.12, endA - 0.12, false);
    ctx.stroke();
    ctx.restore();
  }

  // 0B. WAR HAMMER KEY [3] — Meteor Slam Leap & Plunge Aura!
  if (player.hammerLeapState !== 'none') {
    const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
    const cx = player.x;
    const cy = player.y - h * 0.52;
    const isSlam = player.hammerLeapState === 'slamming';
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 8 * scale, cx, cy, (isSlam ? 58 : 42) * scale);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.72)');
    grad.addColorStop(0.5, isSlam ? 'rgba(234, 88, 12, 0.45)' : 'rgba(251, 146, 60, 0.34)');
    grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, (isSlam ? 58 : 42) * scale, 0, Math.PI * 2);
    ctx.fill();

    if (isSlam) {
      // Blazing vertical meteor trail streak behind plunging hammer!
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
      ctx.lineWidth = Math.max(8, 14 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 68 * scale);
      ctx.lineTo(cx, cy + 14 * scale);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(3, 5 * scale);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 54 * scale);
      ctx.lineTo(cx, cy + 10 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 0C. CRIMSON RAPIER KEY [3] — Phantom Lunge Crimson Lance Wake!
  if (player.rapierLungeTimer > 0) {
    const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
    const cy = player.y - h * 0.56;
    const tipX = player.x + player.facing * 78 * scale;
    const tailX = player.x - player.facing * 92 * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.lineWidth = Math.max(10, 16 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, cy);
    ctx.lineTo(tipX, cy);
    ctx.stroke();

    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = Math.max(3, 4.5 * scale);
    ctx.beginPath();
    ctx.moveTo(tailX + player.facing * 20 * scale, cy);
    ctx.lineTo(tipX, cy);
    ctx.stroke();

    // Lance diamond tip
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.moveTo(tipX + player.facing * 16 * scale, cy);
    ctx.lineTo(tipX - player.facing * 6 * scale, cy - 10 * scale);
    ctx.lineTo(tipX - player.facing * 6 * scale, cy + 10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 0C-2. MONK KEY [3] — Pyre Dash: ash-and-ember wake that follows the 8-way dash direction.
  if (player.monkDashTimer > 0) {
    const h = player.baseH * scale;
    const cy = player.y - h * 0.55;
    const dx = player.monkDashDirX ?? player.facing;
    const dy = player.monkDashDirY ?? 0;
    const ang = Math.atan2(dy, dx || player.facing);
    const len = 150 * scale;
    ctx.save();
    ctx.translate(player.x, cy);
    ctx.rotate(ang);
    const grad = ctx.createLinearGradient(-len, 0, 30 * scale, 0);
    grad.addColorStop(0, 'rgba(41, 37, 36, 0)');
    grad.addColorStop(0.45, evoTier >= 1 ? 'rgba(194, 65, 12, 0.28)' : 'rgba(87, 83, 78, 0.32)');
    grad.addColorStop(1, evoTier >= 2 ? 'rgba(253, 230, 138, 0.55)' : 'rgba(214, 211, 209, 0.5)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-len * 0.4, 0, len * 0.75, h * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wind streaks trailing behind the dash
    ctx.strokeStyle = evoTier >= 2 ? 'rgba(253, 230, 138, 0.7)' : 'rgba(231, 229, 228, 0.55)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      const yy = i * h * 0.22;
      const jitter = ((player.animTime * 37 + i * 13) % 1) * 30 * scale;
      ctx.beginPath();
      ctx.moveTo(-(len - jitter), yy);
      ctx.lineTo(-(20 * scale + jitter * 0.3), yy);
      ctx.stroke();
    }
    // Chi spearhead in front of the leading fist
    ctx.fillStyle = evoTier >= 1 ? 'rgba(234, 88, 12, 0.55)' : 'rgba(231, 229, 228, 0.5)';
    ctx.beginPath();
    ctx.moveTo(52 * scale, 0);
    ctx.quadraticCurveTo(18 * scale, -h * 0.62, -6 * scale, -h * 0.66);
    ctx.lineTo(-6 * scale, h * 0.5);
    ctx.quadraticCurveTo(18 * scale, h * 0.46, 52 * scale, 0);
    ctx.fill();
    ctx.restore();
  }

  // 0C-3. WIZARD KEY [3] — Repulsion Nova: rune circle flaring under and around the Wizard.
  if (player.wizardNovaTimer > 0) {
    const h = player.baseH * scale;
    const prog = 1 - player.wizardNovaTimer / 0.34;
    const col = activeEl ? activeEl.primaryColor : '#a5b4fc';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85 * (1 - prog);
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(2, 3 * scale);
    const rr = (30 + prog * 70) * scale;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 2, rr * 1.6, rr * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 2, rr * 1.1, rr * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Glyph ticks around the floor circle
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12 + prog * 1.5;
      const gx = player.x + Math.cos(a) * rr * 1.35;
      const gy = player.y - 2 + Math.sin(a) * rr * 0.3;
      ctx.fillRect(gx - 1.5 * scale, gy - 3 * scale, 3 * scale, 6 * scale);
    }
    // Inner pressure sphere
    const g2 = ctx.createRadialGradient(player.x, player.y - h * 0.5, 2, player.x, player.y - h * 0.5, (40 + prog * 60) * scale);
    g2.addColorStop(0, 'rgba(224, 231, 255, 0.55)');
    g2.addColorStop(1, 'rgba(49, 46, 129, 0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(player.x, player.y - h * 0.5, (40 + prog * 60) * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 0D. OBSIDIAN GREATAXE KEY [3] — 360° Spinning Molten Cyclone Cleave!
  if (player.axeSpinTimer > 0) {
    const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
    const cx = player.x;
    const cy = player.y - h * 0.52;
    const spinR = 104 * scale;
    const spinA = player.animTime * 24;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinA);

    ctx.fillStyle = isFlaming ? 'rgba(249, 115, 22, 0.22)' : 'rgba(234, 88, 12, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, spinR, 0, Math.PI * 2);
    ctx.fill();

    // Twin swirling double-bladed axe arcs
    for (let k = 0; k < 2; k++) {
      const a0 = k * Math.PI;
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(8, 13 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, spinR * 0.88, a0, a0 + Math.PI * 0.68);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(3, 4.5 * scale);
      ctx.beginPath();
      ctx.arc(0, 0, spinR * 0.95, a0 + 0.06, a0 + Math.PI * 0.64);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 0E. STORM NAGINATA KEY [3] — Tempest Vault Spinning Lightning Crescent!
  if (player.naginataVaultTimer > 0) {
    const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
    const cx = player.x + player.facing * 8 * scale;
    const cy = player.y - h * 0.55;
    const vaultR = 114 * scale;
    const spinA = player.animTime * 20 * player.facing;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinA);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, vaultR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = Math.max(8, 13 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, vaultR * 0.9, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.stroke();

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = Math.max(3, 4.5 * scale);
    ctx.beginPath();
    ctx.arc(0, 0, vaultR * 0.96, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  if (player.attackState === 'idle') return;

  const h = (player.attackWasCrouching ? player.crouchBaseH : player.baseH) * scale;
  const originX = player.x + player.facing * (player.baseW * scale * 0.4);
  const originY = player.y - h * 0.56;
  const reach = range * scale;
  const weapon = player.attackWeapon;

  ctx.save();

  // 0M. MONK ASHEN FIST-WRAPS — short knuckle streaks; the 3rd strike is an open-palm shock.
  if (weapon === 'ash_wraps') {
    const palm = player.monkComboStep === 2;
    const fy = originY - h * 0.04 + (player.monkComboStep === 1 ? -4 * scale : 0);
    const fistReach = reach * (palm ? 1.25 : 1);
    const startX = player.x + player.facing * 8 * scale;
    const endX = startX + player.facing * fistReach;
    const ember = evoTier >= 1 || isFlaming;
    if (player.attackState === 'startup') {
      ctx.fillStyle = palm ? 'rgba(214, 211, 209, 0.35)' : 'rgba(168, 162, 158, 0.25)';
      ctx.beginPath();
      ctx.arc(player.x - player.facing * 4 * scale, fy, (palm ? 10 : 6) * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.attackState === 'active') {
      ctx.lineCap = 'round';
      ctx.strokeStyle = ember ? 'rgba(234, 88, 12, 0.45)' : 'rgba(168, 162, 158, 0.42)';
      ctx.lineWidth = Math.max(6, (palm ? 16 : 9) * scale);
      ctx.beginPath();
      ctx.moveTo(startX, fy);
      ctx.lineTo(endX, fy);
      ctx.stroke();
      ctx.strokeStyle = evoTier >= 2 ? '#fde68a' : '#f5f5f4';
      ctx.lineWidth = Math.max(2, (palm ? 4 : 2.6) * scale);
      ctx.beginPath();
      ctx.moveTo(startX + player.facing * fistReach * 0.35, fy);
      ctx.lineTo(endX, fy);
      ctx.stroke();
      if (palm) {
        // Open-palm shock: a short cone of pressure
        ctx.fillStyle = ember ? 'rgba(234, 88, 12, 0.32)' : 'rgba(231, 229, 228, 0.3)';
        ctx.beginPath();
        ctx.moveTo(endX - player.facing * 6 * scale, fy);
        ctx.lineTo(endX + player.facing * 30 * scale, fy - 26 * scale);
        ctx.quadraticCurveTo(endX + player.facing * 42 * scale, fy, endX + player.facing * 30 * scale, fy + 26 * scale);
        ctx.closePath();
        ctx.fill();
      }
      // Knuckle impact star
      ctx.fillStyle = ember ? '#fdba74' : '#e7e5e4';
      const st = (palm ? 9 : 5.5) * scale;
      ctx.beginPath();
      ctx.moveTo(endX + player.facing * st, fy);
      ctx.lineTo(endX, fy - st * 0.7);
      ctx.lineTo(endX - player.facing * st * 0.5, fy);
      ctx.lineTo(endX, fy + st * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // 0W. WIZARD SPIRE STAFF — gathering rune at the staff head, then a muzzle flare as the bolt leaves.
  if (weapon === 'spire_staff') {
    const col = activeEl ? activeEl.primaryColor : '#a5b4fc';
    const tipX = player.x + player.facing * 20 * scale;
    const tipY = player.y - h * 0.66;
    ctx.globalCompositeOperation = 'lighter';
    if (player.attackState === 'startup') {
      const prog = player.attackTotalStartup > 0 ? 1 - player.attackTimer / player.attackTotalStartup : 1;
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.5 + prog * 0.4;
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.arc(tipX, tipY, (14 - prog * 8) * scale, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const fade = player.attackState === 'active' ? 1 : 0.45;
      const g = ctx.createRadialGradient(tipX, tipY, 1, tipX, tipY, 22 * scale);
      g.addColorStop(0, `rgba(224, 231, 255, ${0.8 * fade})`);
      g.addColorStop(1, 'rgba(49, 46, 129, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 22 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // 1A. KATANA — Swift Wide Iaido Crimson-Silver Slash (Tier 4+: Phantom Reach)
  if (weapon === 'katana') {
    const slashRadius = reach * (weaponLv >= 4 ? 1.46 : 1.24);
    const cx = player.x + player.facing * 14 * scale;
    const cy = player.y - h * 0.56;

    if (player.attackState === 'startup') {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = Math.max(2, 3 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x - player.facing * 10 * scale, cy + 8 * scale);
      ctx.lineTo(player.x - player.facing * 26 * scale, cy + 2 * scale);
      ctx.stroke();
    } else if (player.attackState === 'active') {
      const startA = player.facing === 1 ? -Math.PI * 0.68 : Math.PI * 0.32;
      const endA = player.facing === 1 ? Math.PI * 0.56 : Math.PI * 1.68;

      ctx.fillStyle = isFlaming ? 'rgba(249, 115, 22, 0.24)' : 'rgba(244, 63, 94, 0.24)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, slashRadius, startA, endA, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isFlaming ? '#fb923c' : '#f43f5e';
      ctx.lineWidth = Math.max(6, 11 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, slashRadius * 0.89, startA, endA, false);
      ctx.stroke();

      ctx.strokeStyle = '#fff5f7';
      ctx.lineWidth = Math.max(2.5, 4 * scale);
      ctx.beginPath();
      ctx.arc(cx, cy, slashRadius * 0.96, startA, endA, false);
      ctx.stroke();
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.42)';
      ctx.lineWidth = Math.max(2, 3 * scale);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4 * scale);
      ctx.lineTo(cx + player.facing * slashRadius * 0.72, cy + 16 * scale);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 1B. SWORD — Wide Crescent Slash (Tier 4+: Grand Cleave +25% reach)
  if (weapon === 'sword') {
    const slashRadius = reach * (weaponLv >= 4 ? 1.28 : 1.02);
    const cx = player.x + player.facing * 12 * scale;
    const cy = player.y - h * 0.55;

    if (player.attackState === 'startup') {
      ctx.strokeStyle = isFlaming ? '#fb923c' : '#cbd5e1';
      ctx.lineWidth = Math.max(2.5, 4 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x - player.facing * 6 * scale, cy - 10 * scale);
      ctx.lineTo(player.x - player.facing * 24 * scale, cy - 34 * scale);
      ctx.stroke();
    } else if (player.attackState === 'active') {
      // Wide sweeping crescent arc covering front, above, and below
      const startA = player.facing === 1 ? -Math.PI * 0.62 : Math.PI * 0.38;
      const endA = player.facing === 1 ? Math.PI * 0.52 : Math.PI * 1.62;

      ctx.fillStyle = isFlaming ? 'rgba(249, 115, 22, 0.24)' : 'rgba(147, 197, 253, 0.22)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, slashRadius, startA, endA, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isFlaming ? '#fb923c' : '#93c5fd';
      ctx.lineWidth = Math.max(6, 12 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, slashRadius * 0.88, startA, endA, false);
      ctx.stroke();

      ctx.strokeStyle = isFlaming ? '#fef08a' : '#f8fafc';
      ctx.lineWidth = Math.max(2.5, 4 * scale);
      ctx.beginPath();
      ctx.arc(cx, cy, slashRadius * 0.94, startA, endA, false);
      ctx.stroke();
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = isFlaming ? 'rgba(249, 115, 22, 0.4)' : 'rgba(147, 197, 253, 0.38)';
      ctx.lineWidth = Math.max(2, 3 * scale);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 8 * scale);
      ctx.lineTo(cx + player.facing * slashRadius * 0.65, cy + 22 * scale);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 2. WAR HAMMER — Overhead Charge -> Big Boom AoE Slam! (Tier 4+: Seismic Boom)
  if (weapon === 'hammer') {
    const boomCenterX = player.x + player.facing * (34 * scale);
    const boomCenterY = player.y - h * 0.32;
    const boomRadius = reach * (weaponLv >= 4 ? 1.42 : 1.25);

    if (player.attackState === 'startup') {
      const progress =
        player.attackTotalStartup > 0
          ? 1 - Math.max(0, player.attackTimer / player.attackTotalStartup)
          : 1;
      const headX = player.x - player.facing * (12 * scale);
      const headY = player.y - h - 18 * scale;

      // Charging energy ring shrinking / glowing bright as hammer charges up
      const chargeR = (38 - progress * 20) * scale;
      ctx.strokeStyle = isFlaming ? '#f97316' : '#fbbf24';
      ctx.lineWidth = Math.max(2, (2 + progress * 3) * scale);
      ctx.beginPath();
      ctx.arc(headX, headY, Math.max(6, chargeR), 0, Math.PI * 2);
      ctx.stroke();

      // Hammer shaft + massive iron head raised overhead
      ctx.strokeStyle = '#785a46';
      ctx.lineWidth = Math.max(3, 5 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - h * 0.65);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      ctx.fillStyle = progress > 0.72 ? '#fef08a' : '#94a3b8';
      ctx.fillRect(headX - 16 * scale, headY - 10 * scale, 32 * scale, 20 * scale);
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(headX - 16 * scale, headY - 10 * scale, 32 * scale, 20 * scale);
    } else if (player.attackState === 'active') {
      // BIG BOOM AoE blast dome!
      const grad = ctx.createRadialGradient(
        boomCenterX,
        boomCenterY,
        8 * scale,
        boomCenterX,
        boomCenterY,
        boomRadius
      );
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.72)');
      grad.addColorStop(0.5, isFlaming ? 'rgba(249, 115, 22, 0.45)' : 'rgba(234, 88, 12, 0.36)');
      grad.addColorStop(1, 'rgba(200, 35, 51, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(boomCenterX, boomCenterY, boomRadius, 0, Math.PI * 2);
      ctx.fill();

      // Slammed hammer on ground
      ctx.strokeStyle = '#785a46';
      ctx.lineWidth = Math.max(3.5, 5 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x + player.facing * 8 * scale, player.y - h * 0.55);
      ctx.lineTo(boomCenterX, player.y - 10 * scale);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(boomCenterX - 18 * scale, player.y - 22 * scale, 36 * scale, 22 * scale);
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = '#785a46';
      ctx.lineWidth = Math.max(3, 4.5 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x + player.facing * 8 * scale, player.y - h * 0.55);
      ctx.lineTo(boomCenterX * 0.99, player.y - 12 * scale);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(boomCenterX - 16 * scale, player.y - 20 * scale, 32 * scale, 18 * scale);
    }

    ctx.restore();
    return;
  }

  // 2B. CRIMSON RAPIER — Ultra-Fast Long Piercing Fencing Needle (Tier 4+: Triple Flurry!)
  if (weapon === 'rapier') {
    const thrustReach = reach * (weaponLv >= 4 ? 1.24 : 1.12);
    const tipX = originX + player.facing * thrustReach;

    if (player.attackState === 'startup') {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = Math.max(2, 3 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x - player.facing * 6 * scale, originY + 2 * scale);
      ctx.lineTo(player.x - player.facing * 24 * scale, originY + 4 * scale);
      ctx.stroke();
    } else if (player.attackState === 'active') {
      const needleOffsets = weaponLv >= 4 ? [-11 * scale, 0, 11 * scale] : [0];
      for (let i = 0; i < needleOffsets.length; i++) {
        const ny = originY + needleOffsets[i];
        const lenScale = i === 1 || needleOffsets.length === 1 ? 1 : 0.88;
        const endX = originX + player.facing * thrustReach * lenScale;

        ctx.strokeStyle = isFlaming ? 'rgba(249, 115, 22, 0.5)' : 'rgba(244, 63, 94, 0.48)';
        ctx.lineWidth = Math.max(5, 8 * scale);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(originX - player.facing * 8 * scale, ny);
        ctx.lineTo(endX, ny);
        ctx.stroke();

        ctx.strokeStyle = '#fff1f2';
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.beginPath();
        ctx.moveTo(originX, ny);
        ctx.lineTo(endX, ny);
        ctx.stroke();
      }
      // Sharp crimson glint diamond at needle tip
      ctx.fillStyle = isFlaming ? '#fde047' : '#fda4af';
      ctx.beginPath();
      ctx.moveTo(tipX + player.facing * 12 * scale, originY);
      ctx.lineTo(tipX - player.facing * 4 * scale, originY - 6 * scale);
      ctx.lineTo(tipX - player.facing * 4 * scale, originY + 6 * scale);
      ctx.closePath();
      ctx.fill();
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.36)';
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + player.facing * thrustReach * 0.45, originY + 2 * scale);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 2C. OBSIDIAN GREATAXE — Heavy Wide Overhead-to-Floor Molten Cleave!
  if (weapon === 'greataxe') {
    const axeRadius = reach * (weaponLv >= 4 ? 1.48 : 1.32);
    const cx = player.x + player.facing * 18 * scale;
    const cy = player.y - h * 0.48;

    if (player.attackState === 'startup') {
      const headX = player.x - player.facing * 16 * scale;
      const headY = player.y - h - 14 * scale;
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(2.5, 4 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - h * 0.6);
      ctx.lineTo(headX, headY);
      ctx.stroke();
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(headX, headY, 13 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.attackState === 'active') {
      const startA = player.facing === 1 ? -Math.PI * 0.78 : Math.PI * 0.22;
      const endA = player.facing === 1 ? Math.PI * 0.56 : Math.PI * 1.78;

      ctx.fillStyle = isFlaming ? 'rgba(249, 115, 22, 0.3)' : 'rgba(234, 88, 12, 0.26)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, axeRadius, startA, endA, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = Math.max(9, 15 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, axeRadius * 0.88, startA, endA, false);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(3, 5 * scale);
      ctx.beginPath();
      ctx.arc(cx, cy, axeRadius * 0.96, startA, endA, false);
      ctx.stroke();
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.42)';
      ctx.lineWidth = Math.max(3, 4.5 * scale);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 8 * scale);
      ctx.lineTo(cx + player.facing * axeRadius * 0.72, player.y - 6 * scale);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 2D. STORM NAGINATA — Long-Reach Sweeping Crescent Lightning Polearm!
  if (weapon === 'naginata') {
    const poleRadius = reach * (weaponLv >= 4 ? 1.56 : 1.38);
    const cx = player.x + player.facing * 20 * scale;
    const cy = player.y - h * 0.56;

    if (player.attackState === 'startup') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = Math.max(2, 3.2 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x - player.facing * 12 * scale, cy + 6 * scale);
      ctx.lineTo(player.x - player.facing * 32 * scale, cy - 10 * scale);
      ctx.stroke();
    } else if (player.attackState === 'active') {
      const startA = player.facing === 1 ? -Math.PI * 0.62 : Math.PI * 0.38;
      const endA = player.facing === 1 ? Math.PI * 0.44 : Math.PI * 1.62;

      ctx.fillStyle = isFlaming ? 'rgba(249, 115, 22, 0.24)' : 'rgba(56, 189, 248, 0.22)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, poleRadius, startA, endA, false);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isFlaming ? '#fb923c' : '#38bdf8';
      ctx.lineWidth = Math.max(6, 11 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, poleRadius * 0.9, startA, endA, false);
      ctx.stroke();

      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = Math.max(2.5, 4 * scale);
      ctx.beginPath();
      ctx.arc(cx, cy, poleRadius * 0.97, startA, endA, false);
      ctx.stroke();
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = Math.max(2, 3 * scale);
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6 * scale);
      ctx.lineTo(cx + player.facing * poleRadius * 0.76, cy + 16 * scale);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 2E. MINSTREL ROSE RIBBON-WHIP & SIREN SILK-WHIP — Graceful Flowing Harmonic Ribbon Lash!
  if (weapon === 'ribbon_whip' || weapon === 'silk_whip') {
    const isSilk = weapon === 'silk_whip';
    const whipLen = reach * (isSilk ? 1.24 : 1.08);
    const endX = originX + player.facing * whipLen;
    const primary = isFlaming ? '#fb923c' : isSilk ? '#f9a8d4' : '#ec4899';
    const glowCol = isFlaming ? 'rgba(249, 115, 22, 0.45)' : 'rgba(236, 72, 153, 0.42)';

    if (player.attackState === 'startup') {
      ctx.strokeStyle = primary;
      ctx.lineWidth = Math.max(2.2, 3.2 * scale);
      ctx.beginPath();
      ctx.moveTo(player.x - player.facing * 6 * scale, originY - 4 * scale);
      ctx.quadraticCurveTo(
        player.x - player.facing * 26 * scale,
        originY - 18 * scale,
        player.x - player.facing * 18 * scale,
        originY + 8 * scale
      );
      ctx.stroke();
    } else if (player.attackState === 'active') {
      const midX = originX + player.facing * whipLen * 0.5;
      // Wide flowing ribbon glow
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = Math.max(8, 13 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.bezierCurveTo(
        originX + player.facing * whipLen * 0.28,
        originY - 16 * scale,
        midX + player.facing * whipLen * 0.2,
        originY + 14 * scale,
        endX,
        originY - 4 * scale
      );
      ctx.stroke();

      // Core silk ribbon + golden edge
      ctx.strokeStyle = primary;
      ctx.lineWidth = Math.max(3, 4.5 * scale);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.bezierCurveTo(
        originX + player.facing * whipLen * 0.3,
        originY + 10 * scale,
        midX + player.facing * whipLen * 0.18,
        originY - 12 * scale,
        endX,
        originY - 4 * scale
      );
      ctx.stroke();

      // Sparkling rose-gold ribbon tip blossom
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(endX, originY - 4 * scale, (isSilk ? 8.5 : 6.5) * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.attackState === 'recovery') {
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = Math.max(2, 2.8 * scale);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.quadraticCurveTo(
        originX + player.facing * whipLen * 0.26,
        originY + 14 * scale,
        originX + player.facing * whipLen * 0.5,
        originY + 8 * scale
      );
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // 3. WHIP — Classic Straight Castlevania Chain Lash
  if (player.attackState === 'startup') {
    ctx.strokeStyle = isFlaming ? '#f97316' : SPRITE_PALETTE.whipEdge;
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(player.x - player.facing * 8 * scale, originY - 4 * scale);
    ctx.quadraticCurveTo(
      player.x - player.facing * 28 * scale,
      originY - 14 * scale,
      player.x - player.facing * 20 * scale,
      originY + 8 * scale
    );
    ctx.stroke();
  } else if (player.attackState === 'active') {
    const endX = originX + player.facing * reach;

    ctx.strokeStyle = isFlaming ? 'rgba(249, 115, 22, 0.55)' : 'rgba(229, 169, 60, 0.38)';
    ctx.lineWidth = Math.max(6, (isFlaming ? 14 : 9) * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, originY);
    ctx.stroke();

    ctx.strokeStyle = isFlaming ? '#fef08a' : SPRITE_PALETTE.whipCore;
    ctx.lineWidth = Math.max(2, (isFlaming ? 4.2 : 3.2) * scale);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, originY);
    ctx.stroke();

    const tipSize = (isFlaming ? 9 : weaponLv >= 4 ? 10 : 6.5) * scale;
    ctx.fillStyle = isFlaming ? '#fb923c' : weaponLv >= 4 ? '#ffd166' : '#fff5d6';
    ctx.beginPath();
    ctx.moveTo(endX + player.facing * tipSize, originY);
    ctx.lineTo(endX, originY - tipSize * 0.75);
    ctx.lineTo(endX - player.facing * tipSize * 0.6, originY);
    ctx.lineTo(endX, originY + tipSize * 0.75);
    ctx.closePath();
    ctx.fill();

    // Tier 4+ Morning Star glowing chain tip aura
    if (weaponLv >= 4) {
      ctx.strokeStyle = isFlaming ? '#fb923c' : '#ffd166';
      ctx.lineWidth = Math.max(2, 2.5 * scale);
      ctx.beginPath();
      ctx.arc(endX, originY, 15 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (player.attackState === 'recovery') {
    const endX = originX + player.facing * reach * 0.45;
    ctx.strokeStyle = isFlaming ? 'rgba(249, 115, 22, 0.5)' : 'rgba(229, 169, 60, 0.45)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, originY + 5 * scale);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawShockwaveRing(ctx: CanvasRenderingContext2D, ring: ShockwaveRing): void {
  const alpha = Math.max(0, ring.life / ring.maxLife);
  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = ring.color;
  ctx.lineWidth = 3 + alpha * 5;
  ctx.beginPath();
  ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawGrappleHook(
  ctx: CanvasRenderingContext2D,
  player: Player,
  grapple: GrappleState,
  scale: number
): void {
  if (!grapple.active) return;

  const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
  const startX = player.x + player.facing * 6 * scale;
  const startY = player.y - h * 0.62;

  ctx.save();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(grapple.x, grapple.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(grapple.y - startY, grapple.x - startX);
  ctx.translate(grapple.x, grapple.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-4, -6);
  ctx.lineTo(-1, 0);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawGasCloud(
  ctx: CanvasRenderingContext2D,
  cloud: GasCloud,
  time: number
): void {
  const fade = Math.min(1, (cloud.life / cloud.maxLife) * 1.5);
  const pulse = 1 + Math.sin(time * 5 + cloud.id) * 0.06;
  const r = cloud.radius * pulse;

  ctx.save();
  ctx.globalAlpha = Math.max(0, fade * 0.62);
  const grad = ctx.createRadialGradient(cloud.x, cloud.y, r * 0.15, cloud.x, cloud.y, r);
  grad.addColorStop(0, 'rgba(74, 222, 128, 0.55)');
  grad.addColorStop(0.6, 'rgba(22, 163, 74, 0.34)');
  grad.addColorStop(1, 'rgba(22, 163, 74, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cloud.x, cloud.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(134, 239, 172, 0.32)';
  for (let i = 0; i < 4; i++) {
    const a = time * 1.3 + i * 1.57 + cloud.id;
    const px = cloud.x + Math.cos(a) * (r * 0.42);
    const py = cloud.y + Math.sin(a * 1.3) * (r * 0.32);
    ctx.beginPath();
    ctx.arc(px, py, 10 + (i % 2) * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  scale: number,
  assassinationEnabled: boolean
): void {
  drawDetailedEnemySprite(ctx, enemy, scale, assassinationEnabled);
}

export function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile): void {
  ctx.save();
  ctx.translate(proj.x, proj.y);
  ctx.rotate(proj.rotation);

  if (proj.kind === 'bone') {
    ctx.fillStyle = SPRITE_PALETTE.skeletonBone;
    ctx.fillRect(-7, -2.5, 14, 5);
    ctx.beginPath();
    ctx.arc(-7, -2.5, 3, 0, Math.PI * 2);
    ctx.arc(-7, 2.5, 3, 0, Math.PI * 2);
    ctx.arc(7, -2.5, 3, 0, Math.PI * 2);
    ctx.arc(7, 2.5, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'arcane_bolt') {
    // Element-tinted bolt: dark halo, comet tail, bright core.
    const c1 = proj.color ?? '#a5b4fc';
    const c2 = proj.color2 ?? '#312e81';
    const dir = proj.vx >= 0 ? 1 : -1;
    const r = proj.radius;
    ctx.rotate(-proj.rotation);
    ctx.globalCompositeOperation = 'lighter';
    const tail = ctx.createLinearGradient(-dir * r * 6, 0, 0, 0);
    tail.addColorStop(0, 'rgba(0,0,0,0)');
    tail.addColorStop(1, c1);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(-dir * r * 6, 0);
    ctx.quadraticCurveTo(-dir * r * 2, -r * 0.9, 0, -r * 0.8);
    ctx.lineTo(0, r * 0.8);
    ctx.quadraticCurveTo(-dir * r * 2, r * 0.9, -dir * r * 6, 0);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(dir * r * 0.2, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (proj.overcharged) {
      ctx.strokeStyle = '#e0e7ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.7 + Math.sin(proj.life * 40) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (proj.kind === 'fireball') {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.42)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'gas_flask') {
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(0, 1, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bbf7d0';
    ctx.fillRect(-2.5, -proj.radius - 3, 5, 4);
  } else if (proj.kind === 'sword_wave') {
    // Silver Broadsword Key 3 Crescent Blade Wave
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.45)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(-10, 0, proj.radius * 1.45, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-8, 0, proj.radius * 1.45, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
  } else if (proj.kind === 'player_quake') {
    // War Hammer Key 3 Seismic Ground Shockwave
    ctx.fillStyle = 'rgba(249, 115, 22, 0.42)';
    ctx.fillRect(-16, -28, 32, 28);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(0, -30);
    ctx.lineTo(14, 0);
    ctx.closePath();
    ctx.fill();
  } else if (proj.kind === 'shockwave') {
    // Colossus ground wave
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fillRect(-14, -22, 28, 22);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(0, -24);
    ctx.lineTo(12, 0);
    ctx.closePath();
    ctx.fill();
  } else if (proj.kind === 'katana_wave') {
    // Ronin Crimson Katana Tier 3+ Blazing Gale Arc
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.48)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(-14, 0, proj.radius * 1.6, -Math.PI * 0.48, Math.PI * 0.48);
    ctx.stroke();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-11, 0, proj.radius * 1.6, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();
    ctx.strokeStyle = '#fff1f2';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-9, 0, proj.radius * 1.6, -Math.PI * 0.44, Math.PI * 0.44);
    ctx.stroke();
  } else if (proj.kind === 'goblin_arrow') {
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-12, -1.5, 22, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(7, -4.5);
    ctx.lineTo(7, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-13, -3.5, 5, 2);
    ctx.fillRect(-13, 1.5, 5, 2);
  } else if (proj.kind === 'goblin_bomb') {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, -proj.radius - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -proj.radius - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'goblin_hex') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.38)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'goblin_dagger') {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-4, -3.5);
    ctx.lineTo(-4, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-9, -2, 6, 4);
  } else if (proj.kind === 'lich_bolt') {
    ctx.fillStyle = 'rgba(217, 70, 239, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e879f9';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'soul_skull') {
    ctx.fillStyle = 'rgba(45, 212, 191, 0.38)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.arc(0, -1, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(-3.5, -2.5, 2.5, 2.5);
    ctx.fillRect(1.5, -2.5, 2.5, 2.5);
  } else if (proj.kind === 'tombstone') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(-9, -11, 18, 22);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-7, -9, 14, 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-2, -4, 4, 10);
    ctx.fillRect(-5, -1, 10, 3);
  } else if (proj.kind === 'banshee_wail') {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ecfeff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  } else if (proj.kind === 'bone_scythe') {
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.35, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.05, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
  } else if (proj.kind === 'stone_shard') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2, -2, 6, 2);
  } else if (proj.kind === 'crimson_wave') {
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(255, 51, 75, 0.52)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(-12, 0, proj.radius * 1.55, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-9, 0, proj.radius * 1.55, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();
  } else if (proj.kind === 'lava_orb') {
    ctx.fillStyle = 'rgba(234, 88, 12, 0.48)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'storm_arc') {
    const dir = proj.vx >= 0 ? 1 : -1;
    ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(-10, 0, proj.radius * 1.55, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(-8, 0, proj.radius * 1.55, -Math.PI * 0.44, Math.PI * 0.44);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(200, 35, 51, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff0f3';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSparkleParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  rotation: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;

  ctx.beginPath();
  const inner = size * 0.28;
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? size : inner;
    const angle = (i * Math.PI) / 4;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawMinstrelEffects(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scale: number,
  time: number
): void {
  const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
  const cx = player.x;
  const cy = player.y - h * 0.55;

  // 1. Taut Glowing Rose-Gold Whip-Grapple Tether during invulnerable Whip-Zip!
  if (player.minstrelZipActive) {
    const ax = player.minstrelZipX;
    const ay = player.minstrelZipY;
    const isSilk = player.weapon === 'silk_whip';

    ctx.save();
    // Outer rose aura
    ctx.strokeStyle = isSilk ? 'rgba(249, 168, 212, 0.55)' : 'rgba(236, 72, 153, 0.55)';
    ctx.lineWidth = Math.max(6, 9 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Inner incandescent golden-silk ribbon core
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const mx = (cx + ax) * 0.5 + Math.sin(time * 36) * 4 * scale;
    const my = (cy + ay) * 0.5 + Math.cos(time * 36) * 4 * scale;
    ctx.quadraticCurveTo(mx, my, ax, ay);
    ctx.stroke();

    // Glowing anchor star where the whip latched onto the surface!
    const pulse = 1 + Math.sin(time * 24) * 0.2;
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(ax, ay, 8 * scale * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ax, ay, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Encore Waltz / Crescendo Waltz (Key 3) — Orbiting Ribbons & Musical Notes!
  if (player.minstrelDanceTimer > 0) {
    const isSilk = player.weapon === 'silk_whip';
    const radius = (isSilk ? 104 : 84) * scale;
    ctx.save();
    ctx.translate(cx, cy);

    // Swirling rose-gold ribbon spirals
    for (let ring = 0; ring < 2; ring++) {
      ctx.save();
      ctx.rotate(time * (ring === 0 ? 11 : -9) + ring * Math.PI);
      ctx.strokeStyle = ring === 0 ? '#ec4899' : '#fbbf24';
      ctx.lineWidth = Math.max(3, (ring === 0 ? 5.5 : 3.5) * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, radius * (ring === 0 ? 0.92 : 0.72), 0, Math.PI * 1.35);
      ctx.stroke();
      ctx.restore();
    }

    // Soft radiant stage spotlight glow
    const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, radius);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.22)');
    grad.addColorStop(0.6, 'rgba(236, 72, 153, 0.18)');
    grad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Floating musical notes orbiting the Minstrel!
    ctx.font = `700 ${Math.round(15 * scale)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const notes = ['♪', '♫', '♪', '♬', '♫', '♪'];
    for (let i = 0; i < notes.length; i++) {
      const a = time * 6.5 + (i * Math.PI * 2) / notes.length;
      const nx = Math.cos(a) * (radius * 0.85);
      const ny = Math.sin(a) * (radius * 0.56);
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#f9a8d4';
      ctx.fillText(notes[i], nx, ny);
    }
    ctx.restore();
  }
}

export function drawElementalPlayerAura(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scale: number,
  time: number
): void {
  const activeEl = getActiveElementDef(player.baseElements, player.combinedElement);
  const evoTier = Math.floor(Math.max(0, player.weaponDamageBonus) / 5);
  if (!activeEl && evoTier <= 0) return;

  const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;
  const cx = player.x;
  const cy = player.y - h * 0.52;
  const primary = activeEl ? activeEl.primaryColor : evoTier >= 2 ? '#c084fc' : '#fde047';
  const secondary = activeEl ? activeEl.secondaryColor : '#f97316';
  const glow = activeEl ? activeEl.glowColor : '#fef9c3';
  const isCombined = Boolean(activeEl?.isCombined);
  const resScale = 1 + Math.min(0.4, player.elementResonance * 0.12);

  ctx.save();
  ctx.translate(cx, cy);

  // Soft radiant elemental halo behind the hero
  const haloR = (34 + (isCombined ? 10 : 0) + evoTier * 4) * scale * resScale;
  const grad = ctx.createRadialGradient(0, 0, 4 * scale, 0, 0, haloR);
  grad.addColorStop(0, `${primary}44`);
  grad.addColorStop(0.55, `${secondary}22`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Rotating arcane sigil ring for Elemental Affinity (dual intertwined rings for Combined Elements!)
  if (activeEl) {
    ctx.save();
    ctx.rotate(time * 1.4);
    ctx.strokeStyle = primary;
    ctx.globalAlpha = 0.48;
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.setLineDash([8 * scale, 7 * scale]);
    ctx.beginPath();
    ctx.ellipse(0, h * 0.34, 24 * scale * resScale, 7.5 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (isCombined) {
      ctx.save();
      ctx.rotate(-time * 2.1);
      ctx.strokeStyle = secondary;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = Math.max(1.4, 1.8 * scale);
      ctx.beginPath();
      ctx.arc(0, 0, 30 * scale * resScale, 0, Math.PI * 1.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 30 * scale * resScale, Math.PI, Math.PI * 2.25);
      ctx.stroke();
      ctx.restore();
    }

    // Orbiting elemental motes (4 for Base Element, 6 dual-color spiral for Combined Element)
    const moteCount = isCombined ? 6 : 4;
    for (let i = 0; i < moteCount; i++) {
      const ang = time * (isCombined ? 3.4 : 2.6) + (i * Math.PI * 2) / moteCount;
      const rx = (28 + (i % 2) * 6) * scale * resScale;
      const ry = (18 + (i % 2) * 5) * scale * resScale;
      const mx = Math.cos(ang) * rx;
      const my = Math.sin(ang) * ry;
      const col = i % 2 === 0 ? primary : secondary;
      const mSize = (isCombined ? 3.8 : 3.1) * scale;

      ctx.fillStyle = col;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(mx, my, mSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = glow;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(mx, my, mSize * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawElementalArc(ctx: CanvasRenderingContext2D, arc: ElementalArc): void {
  const frac = Math.max(0, arc.life / Math.max(0.001, arc.maxLife));
  ctx.save();
  ctx.globalAlpha = Math.min(1, frac * 1.5);

  if (arc.kind === 'lightning') {
    const segs = 7;
    const pts: Array<{ x: number; y: number }> = [{ x: arc.x1, y: arc.y1 }];
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      const jitter = Math.sin(arc.seed * 7.3 + i * 19.1) * 18;
      pts.push({
        x: arc.x1 + (arc.x2 - arc.x1) * t + jitter * 0.45,
        y: arc.y1 + (arc.y2 - arc.y1) * t + jitter,
      });
    }
    pts.push({ x: arc.x2, y: arc.y2 });

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 7 * frac + 2;
    ctx.beginPath();
    pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    ctx.strokeStyle = arc.secondaryColor;
    ctx.lineWidth = 3.5 * frac + 1;
    ctx.beginPath();
    pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();
  } else if (arc.kind === 'beam') {
    const beamW = 36 * (0.35 + frac * 0.65);
    const grad = ctx.createLinearGradient(arc.x1 - beamW, 0, arc.x1 + beamW, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.28, `${arc.secondaryColor}88`);
    grad.addColorStop(0.5, arc.color);
    grad.addColorStop(0.72, `${arc.secondaryColor}88`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(arc.x1 - beamW, Math.min(arc.y1, arc.y2), beamW * 2, Math.abs(arc.y2 - arc.y1));

    // Bright central radiant core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(arc.x1 - beamW * 0.2, Math.min(arc.y1, arc.y2), beamW * 0.4, Math.abs(arc.y2 - arc.y1));

    // Ground flare disc
    ctx.fillStyle = arc.color;
    ctx.beginPath();
    ctx.ellipse(arc.x2, arc.y2, beamW * 1.45, 11 * frac + 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (arc.kind === 'spikes') {
    const count = 5;
    const baseY = arc.y1;
    const maxH = Math.abs(arc.y1 - arc.y2) * (0.45 + Math.sin(Math.min(1, 1 - frac) * Math.PI) * 0.65);
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const sx = arc.x1 + (arc.x2 - arc.x1) * t;
      const distFromMid = Math.abs(t - 0.5) * 2;
      const sh = maxH * (1 - distFromMid * 0.45);
      const sw = 12;
      ctx.fillStyle = i % 2 === 0 ? arc.color : arc.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(sx - sw, baseY);
      ctx.lineTo(sx, baseY - sh);
      ctx.lineTo(sx + sw, baseY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = frac * 0.65;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, baseY - sh);
      ctx.lineTo(sx + sw * 0.3, baseY - sh * 0.25);
      ctx.stroke();
    }
  } else {
    // Sweeping Elemental Wave crescent
    const prog = 1 - frac;
    const cx = arc.x1 + (arc.x2 - arc.x1) * prog;
    const cy = arc.y1;
    const dir = arc.x2 >= arc.x1 ? 1 : -1;
    const rad = 36 + prog * 28;
    const a0 = dir === 1 ? -Math.PI * 0.48 : Math.PI * 0.52;
    const a1 = dir === 1 ? Math.PI * 0.48 : Math.PI * 1.48;

    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 11 * frac + 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, rad, a0, a1, false);
    ctx.stroke();

    ctx.strokeStyle = arc.secondaryColor;
    ctx.lineWidth = 5 * frac + 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 0.85, a0 + 0.1, a1 - 0.1, false);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, rad * 1.04, a0 + 0.18, a1 - 0.18, false);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawSecretWall(
  ctx: CanvasRenderingContext2D,
  wall: SecretWall,
  time: number
): void {
  if (wall.broken) return;
  ctx.save();
  const pulse = 0.35 + Math.sin(time * 3.8 + wall.x * 0.02) * 0.25;

  // Cracked Gothic Stone Masonry Block
  ctx.fillStyle = wall.flashTimer > 0 ? '#fde68a' : '#262b3d';
  ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  ctx.strokeStyle = '#47506b';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

  // Brick course seams
  ctx.strokeStyle = '#151822';
  ctx.lineWidth = 1.2;
  for (let by = wall.y + 18; by < wall.y + wall.h; by += 18) {
    ctx.beginPath();
    ctx.moveTo(wall.x, by);
    ctx.lineTo(wall.x + wall.w, by);
    ctx.stroke();
  }

  // Tell-tale pulsing golden/violet fracture lines so keen-eyed explorers spot the secret!
  ctx.strokeStyle = wall.rewardRelic
    ? `rgba(192, 132, 252, ${0.42 + pulse * 0.45})`
    : `rgba(255, 209, 102, ${0.38 + pulse * 0.42})`;
  ctx.lineWidth = wall.hp < wall.maxHp ? 2.4 : 1.5;
  ctx.beginPath();
  ctx.moveTo(wall.x + wall.w * 0.28, wall.y + 10);
  ctx.lineTo(wall.x + wall.w * 0.56, wall.y + wall.h * 0.34);
  ctx.lineTo(wall.x + wall.w * 0.32, wall.y + wall.h * 0.62);
  ctx.lineTo(wall.x + wall.w * 0.7, wall.y + wall.h - 10);
  ctx.stroke();

  if (wall.hp < wall.maxHp) {
    ctx.beginPath();
    ctx.moveTo(wall.x + wall.w * 0.72, wall.y + 16);
    ctx.lineTo(wall.x + wall.w * 0.42, wall.y + wall.h * 0.5);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawPhantomAlly(
  ctx: CanvasRenderingContext2D,
  ally: PhantomAlly,
  playerScale: number,
  time: number
): void {
  const frac = Math.max(0, Math.min(1, ally.timer / Math.max(0.01, ally.maxTimer)));
  const alpha = frac > 0.8 ? (1 - frac) / 0.2 : Math.min(0.88, frac * 1.45);
  ctx.save();

  // Dimensional Tag-In Portal Halo behind Phantom Ally
  const aura = ctx.createRadialGradient(ally.x, ally.y - 34, 4, ally.x, ally.y - 34, 52);
  aura.addColorStop(0, `${ally.color}88`);
  aura.addColorStop(0.55, `${ally.color}30`);
  aura.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(ally.x, ally.y - 34, 52, 0, Math.PI * 2);
  ctx.fill();

  // Luminous spectral companion hero figure
  ctx.globalAlpha = alpha * 0.86;
  drawCampHeroFigure(ctx, ally.characterId, ally.x, ally.y, ally.facing, playerScale * 1.05, time * 2.2, true);

  ctx.restore();
}

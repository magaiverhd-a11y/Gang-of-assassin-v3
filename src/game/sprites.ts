import { getRenderFx, rgba, visualElement } from './affinityFx';
import { mutedBoltColors } from './combatFeel';
import { drawAffinitySwing } from './fxSwing';
/**
 * Simple, modular Canvas 2D sprite & tile drawing functions.
 * Every visual piece is isolated here with clean shapes and palette constants
 * so you can easily change colors, proportions, or swap in custom sprite sheets.
 */

import { drawAnimatedPlayer, drawCampHeroFigure } from './characterAnim';
import { BOSS_CHARMS, getActiveElementDef } from './defaults';
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
  StageDef,
  StageTheme,
  TorchProp,
  WorldPickup,
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
  time = 0,
  environment: StageDef['environment'] = 'castle'
): void {
  let { x, y } = p;
  const { w, h, style } = p;
  const env = environment ?? 'castle';

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

  if (style === 'grate') {
    // Drop-through Underground Secret Iron Grate Hatch (Press DOWN+JUMP to enter!)
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = '#0b0e14';
    for (let gx = x + 8; gx < x + w - 8; gx += 14) {
      ctx.fillRect(gx, y + 3, 7, Math.max(4, h - 5));
    }
    // Subtle downward golden shimmer cue hinting at secret underground tunnel
    const pulse = 0.25 + Math.sin(time * 3.8 + x * 0.02) * 0.14;
    ctx.fillStyle = `rgba(250, 204, 21, ${pulse})`;
    ctx.fillRect(x + 4, y + h, w - 8, 2);
    return;
  }

  if (style === 'bounce_cap') {
    // Mushroom Kingdom Bouncy Toadstool Pad — neon magenta/emerald spring cap!
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x + w * 0.36, y + h * 0.45, w * 0.28, h * 0.85);
    const pulse = 1 + Math.sin(time * 5.2 + x * 0.04) * 0.04;
    ctx.fillStyle = '#db2777';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.48, (w / 2) * pulse, h * 0.65, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.fillRect(x + 4, y + h * 0.4, w - 8, 4);
    ctx.fillStyle = '#fdf2f8';
    for (let sx = x + 14; sx < x + w - 12; sx += 22) {
      ctx.beginPath();
      ctx.arc(sx, y + h * 0.22, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (style === 'wind_pad') {
    // Dragon Crane Emerald Updraft Column — carved jade vent + rising wind ribbons!
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(x + 2, y, w - 4, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 4, 6, h - 4);
    ctx.fillRect(x + w - 6, y + 4, 6, h - 4);
    ctx.save();
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.62)';
    ctx.lineWidth = 2;
    for (let wx = x + 12; wx < x + w - 8; wx += 18) {
      const lift = (time * 85 + wx * 3) % 52;
      ctx.beginPath();
      ctx.moveTo(wx, y - lift);
      ctx.quadraticCurveTo(wx + 5, y - lift - 10, wx, y - lift - 20);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (style === 'underground') {
    // Subterranean Vault Floor with dark carved masonry & glowing mineral veins
    ctx.fillStyle = '#141722';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2d3548';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    for (let sx = x + 18; sx < x + w - 16; sx += 56) {
      ctx.fillRect(sx, y + 8, 18, 2);
    }
    return;
  }

  // =========================================================================
  // BIOME-UNIQUE BRIDGES, RAFTERS & TIMBER WALKWAYS
  // =========================================================================
  if (style === 'bridge' || style === 'rafter' || style === 'timber') {
    if (env === 'sand') {
      // Sand Fortress: Carved Cedar & Gilded Sandstone Lintel with Turquoise Mosaic Inlay!
      ctx.fillStyle = p.crumbling ? '#6e3d1c' : '#78441e';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = isShaking ? '#fde047' : '#d99b38';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#45230c';
      ctx.fillRect(x, y + h - 3, w, 3);
      // Gilded & turquoise inlaid mosaic dots
      for (let mx = x + 16; mx < x + w - 12; mx += 26) {
        ctx.fillStyle = '#14b8a6';
        ctx.fillRect(mx, y + 7, 6, 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(mx + 12, y + 7, 4, 4);
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'dragon') {
      // Dragon Crane: Curved Vermilion Pagoda Deck with Upturned Gilded Eaves & Jade Trim!
      ctx.fillStyle = p.crumbling ? '#5c1919' : '#7f1d1d';
      ctx.fillRect(x, y, w, h);
      // Scalloped jade ceramic top edge
      ctx.fillStyle = isShaking ? '#fde047' : '#10b981';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x, y + 5, w, 2);
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(x, y + h - 3, w, 3);
      // Upturned pagoda eave tips on both ends
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x - 10, y - 3);
      ctx.lineTo(x + 8, y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + w, y + 5);
      ctx.lineTo(x + w + 10, y - 3);
      ctx.lineTo(x + w - 8, y);
      ctx.closePath();
      ctx.fill();
      // Carved golden lattice squares along beam
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      for (let bx = x + 18; bx < x + w - 14; bx += 28) {
        ctx.fillRect(bx, y + 9, 10, Math.max(3, h - 13));
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'dwarven_mines') {
      // Corrupted Dwarven Mines: Riveted Iron Minecart Rail Trestle with Timber Sleepers & Amethyst Bolts!
      ctx.fillStyle = p.crumbling ? '#3b2421' : '#3a2b28';
      ctx.fillRect(x, y + 4, w, Math.max(4, h - 4));
      // Wooden cross-ties / sleepers
      ctx.fillStyle = '#5c4033';
      for (let sx = x + 6; sx < x + w - 8; sx += 22) {
        ctx.fillRect(sx, y + 5, 11, Math.max(3, h - 7));
      }
      // Gleaming iron minecart top rail bar
      ctx.fillStyle = isShaking ? '#fde047' : '#94a3b8';
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, y + 4, w, 2);
      // Glowing amethyst rivet accents
      ctx.fillStyle = '#c084fc';
      for (let rx = x + 14; rx < x + w - 12; rx += 44) {
        ctx.fillRect(rx, y + 7, 4, 4);
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'cyberpunk') {
      // Neon Spire 2099: Brushed Chrome Catwalk with Magenta/Cyan Neon Circuit Strip!
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y + 3, w, Math.max(4, h - 6));
      const neonPulse = 0.72 + Math.sin(time * 5 + x * 0.03) * 0.22;
      ctx.fillStyle = isShaking ? '#fde047' : (Math.floor(x / 180) % 2 === 0 ? `rgba(236,72,153,${neonPulse})` : `rgba(34,211,238,${neonPulse})`);
      ctx.fillRect(x, y, w, 3.5);
      ctx.fillStyle = '#1e293b';
      for (let gx = x + 10; gx < x + w - 8; gx += 18) {
        ctx.fillRect(gx, y + 6, 8, Math.max(3, h - 9));
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'pirate') {
      // Skulltide Cove & Armada: Weathered Pirate Ship Deck Planks with Rope-Lashing & Brass Nails!
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(x, y + 2, w, Math.max(4, h - 2));
      ctx.fillStyle = isShaking ? '#fde047' : '#92400e';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#3b1d0a';
      for (let px = x + 28; px < x + w - 10; px += 36) {
        ctx.fillRect(px, y + 1, 2, h - 2);
      }
      ctx.fillStyle = '#fbbf24';
      for (let bx = x + 10; bx < x + w - 8; bx += 36) {
        ctx.fillRect(bx, y + 7, 3, 3);
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'paradox') {
      // The Ghost Paradox: Glitching Spectral Prism Bridge with Floating Rift Edges!
      const gl = Math.sin(time * 7 + x * 0.05) * 2;
      ctx.fillStyle = '#1e1636';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = isShaking ? '#fde047' : '#818cf8';
      ctx.fillRect(x, y, w, 3);
      ctx.fillStyle = 'rgba(45, 212, 191, 0.55)';
      ctx.fillRect(x + gl, y + h - 3, w, 3);
      for (let rx = x + 14; rx < x + w - 14; rx += 32) {
        ctx.fillStyle = rx % 64 === 0 ? 'rgba(167,139,250,0.45)' : 'rgba(45,212,191,0.35)';
        ctx.fillRect(rx, y + 5, 14, Math.max(3, h - 10));
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'mirror_cathedral') {
      // SHATTERED MIRROR CATHEDRAL: Suspended Gothic Prism-Glass Balcony with Silver Tracery & Specular Sheen!
      const shimmer = Math.sin(time * 3.8 + x * 0.03) * 0.14;
      ctx.fillStyle = '#1d1638';
      ctx.fillRect(x, y + 3, w, Math.max(4, h - 3));
      // Translucent mirrored glass face
      ctx.fillStyle = `rgba(103, 232, 249, ${0.26 + shimmer})`;
      ctx.fillRect(x + 2, y + 4, Math.max(2, w - 4), Math.max(2, h - 7));
      // Luminous crystalline mirror top edge
      ctx.fillStyle = isShaking ? '#fde047' : '#e0f2fe';
      ctx.fillRect(x, y, w, 3);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(x, y + 3, w, 2);
      // Diagonal glass specular reflection streaks & gothic crystal facets
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.52)';
      ctx.lineWidth = 1.4;
      for (let gx = x + 10; gx < x + w - 10; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, y + h - 2);
        ctx.lineTo(gx + 10, y + 4);
        ctx.stroke();
      }
      // Hanging crystal prism drop below balcony center
      if (w >= 72) {
        const cx = x + w * 0.5;
        ctx.fillStyle = 'rgba(192, 132, 252, 0.65)';
        ctx.beginPath();
        ctx.moveTo(cx - 6, y + h);
        ctx.lineTo(cx, y + h + 9);
        ctx.lineTo(cx + 6, y + h);
        ctx.closePath();
        ctx.fill();
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'mansion') {
      // Velvet Blood Chateau: Carved Gold-Trimmed Balcony with Plush Crimson Carpet Runner!
      ctx.fillStyle = '#3b1d28';
      ctx.fillRect(x, y + 4, w, Math.max(4, h - 4));
      ctx.fillStyle = isShaking ? '#fde047' : '#be123c';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x, y + 5, w, 2);
      for (let gx = x + 16; gx < x + w - 12; gx += 26) {
        ctx.fillRect(gx, y + 9, 6, Math.max(3, h - 11));
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'underwater') {
      // Sunken Pelagia: Glowing Sea-Glass Aqueduct Platform with Coral & Pearl Trim!
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(x, y + 2, w, Math.max(4, h - 2));
      ctx.fillStyle = isShaking ? '#fde047' : '#38bdf8';
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = 'rgba(153, 246, 228, 0.45)';
      for (let bx = x + 12; bx < x + w - 12; bx += 30) {
        ctx.fillRect(bx, y + 6, 14, Math.max(3, h - 9));
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'frost') {
      // Frostwarden Citadel: Frosted Glacial Ice-Beam with Hanging Icicle Tips!
      ctx.fillStyle = '#1e3a5f';
      ctx.fillRect(x, y + 3, w, Math.max(4, h - 3));
      ctx.fillStyle = isShaking ? '#fde047' : '#bae6fd';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#7dd3fc';
      for (let ix = x + 12; ix < x + w - 10; ix += 24) {
        ctx.beginPath();
        ctx.moveTo(ix, y + h);
        ctx.lineTo(ix + 5, y + h + 8);
        ctx.lineTo(ix + 10, y + h);
        ctx.closePath();
        ctx.fill();
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'barbaric') {
      // Ironhorn Bloodlands: Rough-Hewn Spiked Timber Bridge with Iron Straps & Bone Studs!
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x, y + 3, w, Math.max(4, h - 3));
      ctx.fillStyle = isShaking ? '#fde047' : '#9a3412';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = '#64748b';
      for (let sx = x + 14; sx < x + w - 12; sx += 40) {
        ctx.fillRect(sx, y, 7, h);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(sx + 2, y + 6, 3, 4);
        ctx.fillStyle = '#64748b';
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'mushroom') {
      // Mushroom Kingdom: Curved Bioluminescent Fungal Shelf-Cap Platform with Ribbed Gills!
      ctx.fillStyle = '#3b1c4a';
      ctx.fillRect(x + 4, y + 6, w - 8, h - 6);
      // Ribbed gill underside lines
      ctx.fillStyle = '#6b21a8';
      for (let gx = x + 10; gx < x + w - 8; gx += 12) {
        ctx.fillRect(gx, y + 6, 3, h - 7);
      }
      // Glowing spotted fungal top cap
      ctx.fillStyle = isShaking ? '#fde047' : '#a855f7';
      ctx.fillRect(x, y, w, 7);
      ctx.fillStyle = '#34d399';
      for (let sx = x + 14; sx < x + w - 12; sx += 28) {
        ctx.fillRect(sx, y + 1, 9, 3);
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'alien') {
      // Alien Ship: Hard-Light Plasma Catwalk with Metallic Emitter Caps!
      const pulse = 0.72 + Math.sin(time * 5 + x * 0.02) * 0.2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, w, h);
      // Glowing plasma beam center
      ctx.fillStyle = isShaking ? '#f43f5e' : `rgba(34, 211, 238, ${0.42 * pulse})`;
      ctx.fillRect(x + 12, y + 2, Math.max(4, w - 24), h - 4);
      ctx.fillStyle = isShaking ? '#fde047' : '#67e8f9';
      ctx.fillRect(x + 10, y, Math.max(4, w - 20), 3);
      // Metallic side emitter clamps
      ctx.fillStyle = '#475569';
      ctx.fillRect(x, y - 1, 12, h + 2);
      ctx.fillRect(x + w - 12, y - 1, 12, h + 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 3, y + 4, 6, 4);
      ctx.fillRect(x + w - 9, y + 4, 6, 4);
      // Grid tick segments
      ctx.fillStyle = 'rgba(224, 242, 254, 0.35)';
      for (let ax = x + 26; ax < x + w - 20; ax += 24) {
        ctx.fillRect(ax, y + 3, 2, h - 6);
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    if (env === 'foundry') {
      // Brimstone Sanctum: Riveted Forged Cast-Iron Grate with Molten Under-Glow!
      ctx.fillStyle = '#261a18';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = isShaking ? '#fde047' : '#78350f';
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x + 2, y + h - 2, w - 4, 2);
      // Iron rivets & grate slots
      for (let rx = x + 14; rx < x + w - 10; rx += 22) {
        ctx.fillStyle = '#110b0a';
        ctx.fillRect(rx, y + 5, 10, Math.max(4, h - 9));
        ctx.fillStyle = '#f97316';
        ctx.fillRect(rx - 5, y + 6, 2, 2);
      }
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
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
      ctx.fillStyle = '#a18052';
      ctx.fillRect(x + 6, y, 5, h);
      ctx.fillRect(x + w - 11, y, 5, h);
      return;
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
      if (p.crumbling) drawCrumbleCracks(ctx, x, y, w, h, isShaking);
      return;
    }

    // Default Castle / Necropolis / Eclipse Rafter
    ctx.fillStyle = SPRITE_PALETTE.rafterFill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = env === 'eclipse' ? '#be123c' : SPRITE_PALETTE.rafterTop;
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

  if (style === 'palisade') {
    // Sharpened vertical log palisade tower (ideal for Wall Cling!)
    ctx.fillStyle = '#332216';
    ctx.fillRect(x, y, w, h);
    const logW = 14;
    for (let lx = x; lx < x + w; lx += logW) {
      const lw = Math.min(logW - 1, x + w - lx);
      ctx.fillStyle = Math.floor((lx - x) / logW) % 2 === 0 ? '#4d3320' : '#3d2819';
      ctx.fillRect(lx, y + 6, lw, h - 6);
      ctx.fillStyle = '#735032';
      ctx.fillRect(lx + 1, y, Math.max(2, lw - 2), 6);
    }
    ctx.fillStyle = '#8c6d46';
    ctx.fillRect(x, y + 18, w, 5);
    if (h > 75) {
      ctx.fillRect(x, y + Math.floor(h * 0.58), w, 5);
    }
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
    ctx.fillStyle = '#252229';
    for (let cx = x + 16; cx < x + w; cx += 52) {
      ctx.fillRect(cx, y + 6, 32, 6);
    }
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

  // =========================================================================
  // BIOME-UNIQUE SOLID FLOORS, PILLARS & BOSS ARENA TILES!
  // =========================================================================
  const isBoss = style === 'boss_floor';
  const isPillar = style === 'pillar';

  if (env === 'sand') {
    // SAND FORTRESS: Wind-Rippled Golden Sand Floor + Carved Hieroglyphic Sandstone Masonry!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);

    if (isPillar) {
      // Fluted sandstone fortress monolith with gilded collar & carved hieroglyph bands
      ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
      ctx.fillRect(x + 4, y + 12, Math.max(4, w * 0.24), h - 12);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x, y, w, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x, y, w, 3);
      for (let gy = y + 26; gy < y + h - 18; gy += 36) {
        ctx.fillStyle = 'rgba(20, 10, 4, 0.45)';
        ctx.fillRect(x, gy, w, 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.28)';
        ctx.fillRect(x + 8, gy + 10, Math.max(4, w - 16), 4);
      }
      return;
    }

    // Sandstone ashlar block strata underneath
    ctx.strokeStyle = 'rgba(38, 18, 6, 0.48)';
    ctx.lineWidth = 1.2;
    const bh = 26;
    const bw = 54;
    ctx.beginPath();
    for (let row = 0; row * bh < h - 16; row++) {
      const by = y + 16 + row * bh;
      ctx.moveTo(x, by);
      ctx.lineTo(x + w, by);
      const off = row % 2 === 0 ? 0 : bw / 2;
      for (let bx = x + off; bx < x + w; bx += bw) {
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, Math.min(by + bh, y + h));
      }
    }
    ctx.stroke();

    // Soft sculpted wind-blown sand layer on top with curved dune wave crests!
    ctx.fillStyle = isBoss ? '#d97706' : '#b46924';
    ctx.fillRect(x, y, w, 15);
    ctx.fillStyle = isBoss ? '#facc15' : theme.stoneTop;
    ctx.beginPath();
    ctx.moveTo(x, y + 9);
    for (let sx = x; sx <= x + w; sx += 32) {
      const wave = Math.sin(sx * 0.045) * 2.5;
      ctx.lineTo(sx, y + 8 + wave);
    }
    ctx.lineTo(x + w, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();

    // Sunlit / moonlit sand crest shimmer & wind ripple arcs
    ctx.fillStyle = isBoss ? '#fef08a' : 'rgba(254, 240, 138, 0.65)';
    ctx.fillRect(x, y, w, 2.5);
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.28)';
    ctx.lineWidth = 1.5;
    for (let rx = x + 18; rx < x + w - 26; rx += 56) {
      ctx.beginPath();
      ctx.moveTo(rx, y + 11);
      ctx.quadraticCurveTo(rx + 14, y + 7, rx + 28, y + 11);
      ctx.stroke();
    }
    // Boss arena inlaid turquoise & gold chevron frieze
    if (isBoss) {
      for (let tx = x + 14; tx < x + w - 18; tx += 36) {
        ctx.fillStyle = '#0d9488';
        ctx.fillRect(tx, y + 17, 14, 5);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(tx + 18, y + 17, 8, 5);
      }
    }
    return;
  }

  if (env === 'dragon') {
    // DRAGON CRANE: Mountain Cliff Crags + Imperial Scalloped Jade Roof Tiles & Vermilion Pillars!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);

    if (isPillar) {
      // Vermilion lacquered pagoda column with gold collars & jade band!
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(248, 113, 113, 0.22)';
      ctx.fillRect(x + 4, y, Math.max(4, w * 0.24), h);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y, w, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x, y + 10, w, 4);
      if (h > 90) {
        ctx.fillRect(x, y + Math.floor(h * 0.5), w, 4);
      }
      return;
    }

    // Layered jagged mountain rock strata + carved cloud-scroll reliefs
    ctx.strokeStyle = 'rgba(6, 20, 24, 0.55)';
    ctx.lineWidth = 1.2;
    const bh = 26;
    const bw = 56;
    ctx.beginPath();
    for (let row = 0; row * bh < h - 18; row++) {
      const by = y + 18 + row * bh;
      ctx.moveTo(x, by);
      ctx.lineTo(x + w, by);
      const off = row % 2 === 0 ? 0 : bw / 2;
      for (let bx = x + off; bx < x + w; bx += bw) {
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + (row % 2 === 0 ? 5 : -5), Math.min(by + bh, y + h));
      }
    }
    ctx.stroke();

    // Imperial scalloped jade-ceramic roof tile top strip!
    ctx.fillStyle = isBoss ? '#991b1b' : '#065f46';
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = isBoss ? '#fbbf24' : '#34d399';
    for (let tx = x; tx < x + w; tx += 22) {
      const tw = Math.min(20, x + w - tx);
      ctx.beginPath();
      ctx.arc(tx + tw * 0.5, y + 8, tw * 0.48, Math.PI, 0);
      ctx.fill();
    }
    // Crisp imperial gold ridge bar & cloud-scroll motifs
    ctx.fillStyle = isBoss ? '#fef08a' : '#fbbf24';
    ctx.fillRect(x, y + 11, w, 2.5);
    ctx.strokeStyle = isBoss ? 'rgba(251, 191, 36, 0.42)' : 'rgba(52, 211, 153, 0.34)';
    ctx.lineWidth = 1.4;
    for (let cx = x + 26; cx < x + w - 26; cx += 64) {
      ctx.beginPath();
      ctx.arc(cx, y + 26, 7, Math.PI, 0);
      ctx.arc(cx + 12, y + 26, 5, 0, Math.PI);
      ctx.stroke();
    }
    return;
  }

  if (env === 'cyberpunk') {
    // NEON SPIRE 2099: Rain-Slicked Cyber-Asphalt, Steel Panel Grid & Glowing Neon Curb!
    ctx.fillStyle = '#111626';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.16)';
    ctx.lineWidth = 1.2;
    for (let gx = x + 48; gx < x + w; gx += 48) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 10);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y + 36; gy < y + h; gy += 36) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    ctx.fillStyle = isBoss ? '#22d3ee' : '#ec4899';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x, y + 5, w, 2);
    return;
  }

  if (env === 'pirate') {
    // SKULLTIDE COVE & ARMADA: Sun-Warm Beach Sand OR Heavy Timber Pirate Galleon Decking!
    const isIsland = theme.stoneFill === '#78350f';
    ctx.fillStyle = isIsland ? '#78350f' : '#451a03';
    ctx.fillRect(x, y, w, h);
    if (isIsland) {
      // Golden treasure beach sand crust + buried pebbles
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x, y, w, 14);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      for (let sx = x + 18; sx < x + w - 18; sx += 54) {
        ctx.fillRect(sx, y + 24, 14, 5);
      }
    } else {
      // Heavy timber hull planks + brass cannon-port rings
      ctx.strokeStyle = 'rgba(20, 8, 2, 0.65)';
      ctx.lineWidth = 1.6;
      for (let py = y + 18; py < y + h; py += 20) {
        ctx.beginPath();
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();
      }
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x, y, w, 7);
      ctx.fillStyle = '#1c1917';
      for (let cx = x + 70; cx < x + w - 60; cx += 160) {
        ctx.fillRect(cx, y + 28, 26, 22);
        ctx.strokeStyle = '#fbbf24';
        ctx.strokeRect(cx, y + 28, 26, 22);
      }
    }
    return;
  }

  if (env === 'paradox') {
    // THE GHOST PARADOX: Fractured Chessboard Void Tiles & Glowing Spectral Rift Lines!
    ctx.fillStyle = '#17102c';
    ctx.fillRect(x, y, w, h);
    const tile = 32;
    for (let ry = y + 8; ry < y + h; ry += tile) {
      for (let rx = x; rx < x + w; rx += tile) {
        if (((Math.floor(rx / tile) + Math.floor(ry / tile)) & 1) === 0) {
          ctx.fillStyle = 'rgba(129, 140, 248, 0.14)';
          ctx.fillRect(rx, ry, tile, tile);
        }
      }
    }
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(x, y + 5, w, 2);
    return;
  }

  if (env === 'mirror_cathedral') {
    // SHATTERED MIRROR CATHEDRAL: Polished Obsidian-Mirror Marble, Prism Glare Bands & Silver Fracture Seams!
    ctx.fillStyle = '#141126';
    ctx.fillRect(x, y, w, h);

    if (isPillar) {
      // Reflective crystal cathedral buttress pillar
      ctx.fillStyle = '#1e193b';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(103, 232, 249, 0.22)';
      ctx.fillRect(x + 3, y, Math.max(4, w * 0.3), h);
      ctx.fillStyle = 'rgba(244, 114, 182, 0.16)';
      ctx.fillRect(x + w - Math.max(4, w * 0.22) - 2, y, Math.max(4, w * 0.22), h);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      return;
    }

    // Diagonal mirror-glass reflection bands across obsidian floor
    const tileW = 54;
    for (let rx = x; rx < x + w; rx += tileW) {
      const idx = Math.floor(rx / tileW);
      ctx.fillStyle =
        idx % 3 === 0
          ? 'rgba(103, 232, 249, 0.14)'
          : idx % 3 === 1
            ? 'rgba(192, 132, 252, 0.12)'
            : 'rgba(244, 114, 182, 0.1)';
      ctx.beginPath();
      ctx.moveTo(rx, y + 8);
      ctx.lineTo(Math.min(x + w, rx + 26), y + 8);
      ctx.lineTo(Math.min(x + w, rx + 8), y + Math.min(h, 58));
      ctx.lineTo(rx, y + Math.min(h, 58));
      ctx.closePath();
      ctx.fill();
    }

    // Cracked silver-crystal fracture seams
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.22)';
    ctx.lineWidth = 1.2;
    for (let fx = x + 36; fx < x + w - 28; fx += 86) {
      ctx.beginPath();
      ctx.moveTo(fx, y + 8);
      ctx.lineTo(fx + 14, y + 26);
      ctx.lineTo(fx + 4, y + 46);
      ctx.stroke();
    }

    // Razor-crisp reflective mirror floor surface trim
    ctx.fillStyle = isBoss ? '#f472b6' : '#67e8f9';
    ctx.fillRect(x, y, w, 5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = 'rgba(192, 132, 252, 0.55)';
    ctx.fillRect(x, y + 5, w, 2.5);
    return;
  }

  if (env === 'mansion') {
    // VELVET BLOOD CHATEAU: Polished Cream-and-Burgundy Marble Floor with Gilded Trim!
    ctx.fillStyle = '#2b1b24';
    ctx.fillRect(x, y, w, h);
    const tw = 44;
    for (let rx = x; rx < x + w; rx += tw) {
      ctx.fillStyle = Math.floor(rx / tw) % 2 === 0 ? 'rgba(248, 250, 252, 0.12)' : 'rgba(190, 18, 60, 0.16)';
      ctx.fillRect(rx, y + 10, tw - 1, Math.min(34, h - 10));
    }
    ctx.fillStyle = isBoss ? '#fbbf24' : '#be123c';
    ctx.fillRect(x, y, w, 7);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x, y + 7, w, 2.5);
    return;
  }

  if (env === 'underwater') {
    // SUNKEN PELAGIA: Pearl-Marble Ruin Masonry & Glowing Bioluminescent Coral Crust!
    ctx.fillStyle = '#0e3147';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.4;
    for (let gy = y + 26; gy < y + h; gy += 26) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(x, y + 6, w, 3);
    for (let cx = x + 36; cx < x + w - 36; cx += 96) {
      ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
      ctx.beginPath();
      ctx.arc(cx, y + 20, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (env === 'frost') {
    // FROSTWARDEN CITADEL: Glazed Ice-Crystal Ashlar Blocks & Shimmering Snow-Drift Top!
    ctx.fillStyle = '#1b3454';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
    ctx.lineWidth = 1.4;
    for (let rx = x + 52; rx < x + w; rx += 52) {
      ctx.beginPath();
      ctx.moveTo(rx, y + 10);
      ctx.lineTo(rx - 14, y + h);
      ctx.stroke();
    }
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x, y, w, 7);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x, y + 7, w, 4);
    return;
  }

  if (env === 'barbaric') {
    // IRONHORN BLOODLANDS: Cracked Red-Earth Tundra Basalt, War-Paint Stripes & Bone Stakes!
    ctx.fillStyle = '#382018';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isBoss ? '#f97316' : '#b91c1c';
    ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(x, y + 8, w, 6);
    ctx.strokeStyle = 'rgba(15, 7, 5, 0.65)';
    ctx.lineWidth = 2;
    for (let cx = x + 42; cx < x + w - 30; cx += 88) {
      ctx.beginPath();
      ctx.moveTo(cx, y + 14);
      ctx.lineTo(cx + 14, y + 42);
      ctx.lineTo(cx - 4, y + 68);
      ctx.stroke();
    }
    return;
  }

  if (env === 'dwarven_mines') {
    // CORRUPTED DWARVEN MINES: Chiseled Dwarven Basalt, Glowing Amethyst Ore Veins & Gilded Keystone Pillars!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);

    if (isPillar) {
      // Gilded dwarven rune-pillar with angular chevrons and amethyst inlay
      ctx.fillStyle = '#2c253d';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x, y, w, 8);
      ctx.fillRect(x, y + h - 8, w, 8);
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(x + Math.floor(w * 0.3), y + 14, Math.max(6, Math.floor(w * 0.4)), Math.max(8, h - 28));
      ctx.fillStyle = '#c084fc';
      for (let ry = y + 24; ry < y + h - 22; ry += 32) {
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, ry - 6);
        ctx.lineTo(x + w * 0.5 + 6, ry);
        ctx.lineTo(x + w * 0.5, ry + 6);
        ctx.lineTo(x + w * 0.5 - 6, ry);
        ctx.closePath();
        ctx.fill();
      }
      return;
    }

    // Crisp angular dwarven ashlar masonry courses
    ctx.strokeStyle = 'rgba(10, 7, 20, 0.62)';
    ctx.lineWidth = 1.4;
    const bh = 28;
    const bw = 60;
    ctx.beginPath();
    for (let row = 0; row * bh < h - 16; row++) {
      const by = y + 16 + row * bh;
      ctx.moveTo(x, by);
      ctx.lineTo(x + w, by);
      const off = row % 2 === 0 ? 0 : bw / 2;
      for (let bx = x + off; bx < x + w; bx += bw) {
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, Math.min(by + bh, y + h));
      }
    }
    ctx.stroke();

    // Glowing corrupted amethyst ore veins running diagonally through stone
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.36)';
    ctx.lineWidth = 2.5;
    for (let vx = x + 38; vx < x + w - 40; vx += 140) {
      ctx.beginPath();
      ctx.moveTo(vx, y + 20);
      ctx.lineTo(vx + 22, y + 48);
      ctx.lineTo(vx + 10, y + 76);
      ctx.stroke();
      ctx.fillStyle = 'rgba(232, 121, 249, 0.55)';
      ctx.fillRect(vx + 18, y + 44, 6, 6);
    }

    // Top surface: Heavy dwarven flagstone with iron rail trim (or gilded royal vault floor for boss)
    ctx.fillStyle = isBoss ? '#92400e' : '#3b2e5a';
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = isBoss ? '#fbbf24' : '#94a3b8';
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = isBoss ? '#e879f9' : '#a855f7';
    for (let tx = x + 16; tx < x + w - 16; tx += 48) {
      ctx.fillRect(tx, y + 6, 14, 3);
    }
    return;
  }

  if (env === 'mushroom') {
    // MUSHROOM KINGDOM: Mycelium Root Soil + Spongy Moss Turf + Glowing Baby Toadstools!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);

    if (isPillar) {
      // Striated giant mushroom stalk with glowing violet shelf-caps!
      ctx.fillStyle = '#312e47';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.14)';
      for (let sx = x + 6; sx < x + w - 4; sx += 14) {
        ctx.fillRect(sx, y + 8, 4, h - 8);
      }
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x, y, w, 9);
      ctx.fillStyle = '#34d399';
      ctx.fillRect(x, y + 9, w, 3);
      return;
    }

    // Glowing underground mycelium root veins
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.22)';
    ctx.lineWidth = 1.5;
    for (let mx = x + 20; mx < x + w - 20; mx += 64) {
      ctx.beginPath();
      ctx.moveTo(mx, y + 12);
      ctx.quadraticCurveTo(mx + 14, y + 36, mx - 6, Math.min(y + h, y + 66));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
    for (let vx = x + 48; vx < x + w - 20; vx += 82) {
      ctx.beginPath();
      ctx.moveTo(vx, y + 14);
      ctx.quadraticCurveTo(vx - 16, y + 40, vx + 10, Math.min(y + h, y + 72));
      ctx.stroke();
    }

    // Spongy emerald moss cap
    ctx.fillStyle = isBoss ? '#7e22ce' : '#065f46';
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = isBoss ? '#e879f9' : theme.stoneTop;
    ctx.fillRect(x, y, w, 5);
    // Tiny glowing baby mushrooms sprouting along top edge!
    for (let sx = x + 28; sx < x + w - 24; sx += 74) {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(sx - 1.5, y - 6, 3, 6);
      ctx.fillStyle = (sx / 74) % 2 === 0 ? '#e879f9' : '#34d399';
      ctx.beginPath();
      ctx.arc(sx, y - 6, 5.5, Math.PI, 0);
      ctx.fill();
    }
    return;
  }

  if (env === 'alien') {
    // ALIEN SHIP: Beveled Titanium Hull Decking + Pulsing Cyan Plasma Conduit!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);

    if (isPillar) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + w * 0.5 - 3, y + 10, 6, h - 10);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(x, y, w, 7);
      for (let cy = y + 32; cy < y + h - 16; cy += 48) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, cy, w, 8);
      }
      return;
    }

    // Sleek angled metallic hull plating seams
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1.2;
    const panelW = 64;
    for (let px = x + panelW; px < x + w; px += panelW) {
      ctx.beginPath();
      ctx.moveTo(px, y + 10);
      ctx.lineTo(px - 10, y + 26);
      ctx.lineTo(px - 10, Math.min(y + h, y + 84));
      ctx.stroke();
    }
    // Metallic top rail + pulsing neon cyan energy strip
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, w, 10);
    const glowA = 0.65 + Math.sin(time * 4.2 + x * 0.01) * 0.25;
    ctx.fillStyle = isBoss ? `rgba(232, 121, 249, ${glowA})` : `rgba(34, 211, 238, ${glowA})`;
    ctx.fillRect(x, y, w, 3.5);
    ctx.fillStyle = isBoss ? 'rgba(232, 121, 249, 0.32)' : 'rgba(56, 189, 248, 0.28)';
    ctx.fillRect(x, y + 12, w, 2.5);
    // Hazard chevrons on boss deck
    if (isBoss) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      for (let hx = x + 16; hx < x + w - 16; hx += 34) {
        ctx.fillRect(hx, y + 5, 14, 3);
      }
    }
    return;
  }

  if (env === 'foundry') {
    // BRIMSTONE SANCTUM: Dark Volcanic Basalt + Glowing Molten Lava Cracks!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isBoss ? theme.bossFloorTop : '#57281e';
    ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x, y, w, 2.5);

    // Jagged basalt cracks glowing with molten lava!
    const lavaPulse = 0.65 + Math.sin(time * 3.5 + x * 0.02) * 0.25;
    ctx.strokeStyle = `rgba(249, 115, 22, ${lavaPulse})`;
    ctx.lineWidth = 1.6;
    for (let lx = x + 30; lx < x + w - 20; lx += 68) {
      ctx.beginPath();
      ctx.moveTo(lx, y + 8);
      ctx.lineTo(lx - 8, y + 26);
      ctx.lineTo(lx + 6, Math.min(y + h, y + 48));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(10, 6, 6, 0.65)';
    ctx.lineWidth = 1;
    drawBrickGrid(ctx, x, y + 8, w, h - 8, 48, 24);
    return;
  }

  if (env === 'cemetery') {
    // WEEPING NECROPOLIS: Cracked Mossy Graveyard Flagstones & Pale Runes!
    ctx.fillStyle = theme.stoneFill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isBoss ? theme.bossFloorTop : '#3f524c';
    ctx.fillRect(x, y, w, 8);
    // Creeping moss clumps & ghostly teal sigils
    ctx.fillStyle = '#15803d';
    for (let mx = x + 14; mx < x + w - 18; mx += 48) {
      ctx.fillRect(mx, y - 2, 16, 4);
    }
    ctx.strokeStyle = 'rgba(12, 16, 22, 0.65)';
    ctx.lineWidth = 1.2;
    drawBrickGrid(ctx, x, y + 8, w, h - 8, 52, 24);
    return;
  }

  if (env === 'goblin_camp') {
    // GOBLIN CAMP: Packed Forest Earth, Pebbles & Wild Jagged Grass Blades!
    ctx.fillStyle = '#261d16';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isBoss ? '#7c2d12' : '#2d4728';
    ctx.fillRect(x, y, w, 10);
    ctx.fillStyle = isBoss ? theme.bossFloorTop : '#4d7c3f';
    ctx.fillRect(x, y, w, 4);
    // Wild grass blades poking up on forest earth
    if (!isBoss && !isPillar) {
      ctx.fillStyle = '#4d7c3f';
      for (let gx = x + 18; gx < x + w - 16; gx += 44) {
        ctx.fillRect(gx, y - 5, 2, 5);
        ctx.fillRect(gx + 4, y - 7, 2, 7);
        ctx.fillRect(gx + 8, y - 4, 2, 4);
      }
    }
    // Embedded stones in packed earth strata
    ctx.fillStyle = '#3b2e24';
    for (let sx = x + 22; sx < x + w - 22; sx += 54) {
      ctx.fillRect(sx, y + 18, 16, 8);
      ctx.fillRect(sx + 24, y + 36, 12, 6);
    }
    return;
  }

  if (env === 'eclipse') {
    // ECLIPSE CITADEL: Fractured Black Obsidian & Crimson-Gold Celestial Veins!
    ctx.fillStyle = '#120816';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = isBoss ? '#ff2e63' : '#881337';
    ctx.fillRect(x, y, w, 7);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 7, w, 2);
    ctx.strokeStyle = 'rgba(255, 46, 99, 0.24)';
    ctx.lineWidth = 1.2;
    drawBrickGrid(ctx, x, y + 9, w, h - 9, 46, 24);
    return;
  }

  // NOCTURNE CASTLE (Default): Ornate Gothic Dressed Masonry + Royal Crimson Boss Carpet!
  ctx.fillStyle = theme.stoneFill;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = isBoss ? theme.bossFloorTop : theme.stoneTop;
  ctx.fillRect(x, y, w, 7);
  if (isBoss) {
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 7, w, 2);
  }
  ctx.strokeStyle = SPRITE_PALETTE.stoneLine;
  ctx.lineWidth = 1;
  drawBrickGrid(ctx, x, y + 7, w, h - 7, 44, 22);
}

function drawBrickGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  brickW: number,
  brickH: number
): void {
  if (h <= 0) return;
  ctx.beginPath();
  for (let row = 0; row * brickH < h; row++) {
    const by = y + row * brickH;
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

function drawCrumbleCracks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isShaking: boolean
): void {
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
      const doorW = 76;
      const doorH = 136;
      const pulse = Math.sin(time * 5.2) * 0.5 + 0.5;

      // Towering Shattered Mirror Cathedral Gothic Pointed Archway
      ctx.fillStyle = '#151026';
      ctx.beginPath();
      ctx.moveTo(-doorW / 2 - 14, 0);
      ctx.lineTo(-doorW / 2 - 14, -doorH + 40);
      ctx.quadraticCurveTo(-doorW * 0.24, -doorH - 8, 0, -doorH - 22);
      ctx.quadraticCurveTo(doorW * 0.24, -doorH - 8, doorW / 2 + 14, -doorH + 40);
      ctx.lineTo(doorW / 2 + 14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Swirling Prismatic Mirror Portal Core
      ctx.beginPath();
      ctx.moveTo(-doorW / 2, 0);
      ctx.lineTo(-doorW / 2, -doorH + 40);
      ctx.quadraticCurveTo(-doorW * 0.2, -doorH + 4, 0, -doorH - 6);
      ctx.quadraticCurveTo(doorW * 0.2, -doorH + 4, doorW / 2, -doorH + 40);
      ctx.lineTo(doorW / 2, 0);
      ctx.closePath();
      const portalGrad = ctx.createLinearGradient(-doorW / 2, -doorH, doorW / 2, 0);
      portalGrad.addColorStop(0, '#0f172a');
      portalGrad.addColorStop(0.35, '#0e7490');
      portalGrad.addColorStop(0.68, '#7e22ce');
      portalGrad.addColorStop(1, '#be185d');
      ctx.fillStyle = portalGrad;
      ctx.fill();

      // Shattered glass fracture lines & bright diagonal mirror reflections inside archway
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-doorW * 0.32, -doorH + 28);
      ctx.lineTo(doorW * 0.28, -doorH + 64);
      ctx.moveTo(-doorW * 0.22, -doorH + 78);
      ctx.lineTo(doorW * 0.34, -doorH + 104);
      ctx.moveTo(0, -doorH + 12);
      ctx.lineTo(-doorW * 0.14, -doorH + 54);
      ctx.lineTo(doorW * 0.12, -doorH + 92);
      ctx.stroke();

      // Orbiting floating mirror shards around the portal frame
      for (let i = 0; i < 4; i++) {
        const ang = time * 1.9 + i * (Math.PI / 2);
        const sx = Math.cos(ang) * (doorW * 0.62);
        const sy = -doorH * 0.52 + Math.sin(ang) * 44;
        ctx.fillStyle = i % 2 === 0 ? '#e0f2fe' : '#f472b6';
        ctx.beginPath();
        ctx.moveTo(sx, sy - 6);
        ctx.lineTo(sx + 5, sy);
        ctx.lineTo(sx, sy + 6);
        ctx.lineTo(sx - 5, sy);
        ctx.closePath();
        ctx.fill();
      }

      // Pulsing outer prism cathedral aura
      const aura = ctx.createRadialGradient(0, -doorH * 0.48, 8, 0, -doorH * 0.48, 98 + pulse * 14);
      aura.addColorStop(0, `rgba(103, 232, 249, ${0.38 + pulse * 0.18})`);
      aura.addColorStop(0.52, `rgba(244, 114, 182, ${0.22 + pulse * 0.1})`);
      aura.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, -doorH * 0.48, 98 + pulse * 14, 0, Math.PI * 2);
      ctx.fill();

      // Faceted Prism Diamond Keystone above the Mirror Arch
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(0, -doorH - 18);
      ctx.lineTo(9, -doorH - 6);
      ctx.lineTo(0, -doorH + 6);
      ctx.lineTo(-9, -doorH - 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      break;
    }

    case 'cursed_shrine': {
      const pulse = Math.sin(time * 5.8) * 3;
      // Obsidian-Silver Shattered Mirror Pedestal
      ctx.fillStyle = '#18132b';
      ctx.fillRect(-24, -12, 48, 12);
      ctx.fillRect(-14, -46, 28, 34);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-20, -50, 40, 5);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(-18, -45, 36, 2);

      if (!item.used) {
        const glow = ctx.createRadialGradient(0, -68 + pulse, 4, 0, -68 + pulse, 58);
        glow.addColorStop(0, 'rgba(103, 232, 249, 0.54)');
        glow.addColorStop(0.55, 'rgba(244, 114, 182, 0.26)');
        glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -68 + pulse, 58, 0, Math.PI * 2);
        ctx.fill();

        // Floating Fractured Mirror Prism Crystal
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(0, -86 + pulse);
        ctx.lineTo(13, -68 + pulse);
        ctx.lineTo(0, -50 + pulse);
        ctx.lineTo(-13, -68 + pulse);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, -86 + pulse);
        ctx.lineTo(13, -68 + pulse);
        ctx.lineTo(0, -50 + pulse);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1.8;
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
        drawCampHeroFigure(ctx, 'ronin', 0, 0, 1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#33241c';
        ctx.fillRect(-16, -9, 32, 9);
      }
      break;
    }

    case 'camp_hero_minstrel': {
      const isSelected = activeCharacterId === 'minstrel';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'minstrel', 0, 0, 1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#33241c';
        ctx.fillRect(-15, -9, 30, 9);
      }
      break;
    }

    case 'camp_hero_monk': {
      const isSelected = activeCharacterId === 'monk';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'monk', 0, 0, 1, playerScale, time, false);
      } else {
        // Prayer mat where the Monk kneels atop the Mountain Summit when not active
        ctx.fillStyle = '#3f3a36';
        ctx.fillRect(-18, -4, 36, 4);
      }
      break;
    }

    case 'camp_hero_assassin': {
      const isSelected = activeCharacterId === 'assassin';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'assassin', 0, 0, -1, playerScale, time, false);
      } else {
        // Scorched whetstone and a snuffed candle where the Assassin lurks on the Battlements
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-14, -6, 28, 6);
        ctx.fillStyle = '#9f1239';
        ctx.fillRect(6, -12, 3, 6);
      }
      break;
    }

    case 'camp_hero_wizard': {
      const isSelected = activeCharacterId === 'wizard';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'wizard', 0, 0, -1, playerScale, time, false);
        // 3 softly orbiting Grimoire Orbs showing off the Orbiting Grimoire tome
        const orbCols = ['#f97316', '#38bdf8', '#c084fc'];
        for (let i = 0; i < 3; i++) {
          const a = time * 2.2 + (i * Math.PI * 2) / 3;
          const ox = Math.cos(a) * 26;
          const oy = -34 + Math.sin(a) * 10;
          ctx.save();
          ctx.fillStyle = orbCols[i];
          ctx.shadowColor = orbCols[i];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(ox, oy, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ox - 1, oy - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(-14, -8, 28, 8);
      }
      break;
    }

    case 'camp_hero_ranger': {
      const isSelected = activeCharacterId === 'ranger';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'ranger', 0, 0, 1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(-14, -8, 28, 8);
      }
      break;
    }

    case 'camp_hero_vanguard': {
      const isSelected = activeCharacterId === 'vanguard';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'vanguard', 0, 0, -1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(-18, -10, 36, 10);
      }
      break;
    }

    case 'camp_hero_dancer': {
      const isSelected = activeCharacterId === 'dancer';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'dancer', 0, 0, -1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#881337';
        ctx.fillRect(-15, -8, 30, 8);
      }
      break;
    }

    case 'camp_hero_bouncer': {
      const isSelected = activeCharacterId === 'bouncer';
      if (!isSelected) {
        drawCampHeroFigure(ctx, 'bouncer', 0, 0, -1, playerScale, time, false);
      } else {
        ctx.fillStyle = '#164e63';
        ctx.fillRect(-15, -8, 30, 8);
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
    (item.kind === 'camp_hero_wizard' && activeCharacterId === 'wizard') ||
    (item.kind === 'camp_hero_assassin' && activeCharacterId === 'assassin') ||
    (item.kind === 'camp_hero_ranger' && activeCharacterId === 'ranger') ||
    (item.kind === 'camp_hero_vanguard' && activeCharacterId === 'vanguard') ||
    (item.kind === 'camp_hero_dancer' && activeCharacterId === 'dancer') ||
    (item.kind === 'camp_hero_bouncer' && activeCharacterId === 'bouncer');

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

/** Assassin's Death Mark: a crimson skull brand over the foe's head with a draining timer ring (and a brand on the body). */
export function drawDeathMark(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  scale: number,
  time: number,
  executeKey: string
): void {
  const timer = enemy.markTimer ?? 0;
  if (timer <= 0 || enemy.dead) return;
  const maxT = Math.max(0.1, enemy.markMaxTimer ?? timer);
  const frac = Math.max(0, Math.min(1, timer / maxT));
  const h = enemy.baseH * scale;
  const cx = enemy.x;
  const cy = enemy.y - h - 30 + Math.sin(time * 5) * 2;
  const fading = timer < 1.6 && Math.floor(time * 10) % 2 === 0;
  const boss = !!enemy.isBoss;

  ctx.save();
  ctx.globalAlpha = fading ? 0.45 : 1;
  // Body brand: a glowing slashed sigil over the chest
  ctx.save();
  ctx.translate(cx, enemy.y - h * 0.55);
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, Math.max(14, h * 0.32));
  g.addColorStop(0, 'rgba(244, 63, 94, 0.5)');
  g.addColorStop(1, 'rgba(127, 29, 29, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(14, h * 0.32), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(254, 205, 211, 0.85)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.moveTo(-11, -11);
  ctx.lineTo(11, 11);
  ctx.moveTo(11, -11);
  ctx.lineTo(-11, 11);
  ctx.stroke();
  ctx.restore();

  ctx.translate(cx, cy);
  // Timer ring
  ctx.strokeStyle = 'rgba(28, 25, 23, 0.85)';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = boss ? '#fbbf24' : '#f43f5e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  // Skull
  ctx.fillStyle = '#f5f5f4';
  ctx.beginPath();
  ctx.arc(0, -1.5, 6.2, Math.PI, 0);
  ctx.lineTo(4.2, 4);
  ctx.lineTo(-4.2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.arc(-2.4, -1, 1.7, 0, Math.PI * 2);
  ctx.arc(2.4, -1, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-0.6, 1.4, 1.2, 1.6);
  ctx.fillStyle = '#44403c';
  for (let i = -1; i <= 1; i++) ctx.fillRect(i * 2 - 0.4, 3.6, 0.8, 2);
  // Label
  ctx.font = '800 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = boss ? '#fbbf24' : '#fb7185';
  ctx.fillText(boss ? 'MARKED +DMG' : `EXECUTE [${executeKey}]`, 0, -19);
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
  const renderFx = getRenderFx();
  const feelOn = !!(renderFx && ((renderFx.affinityFx && renderFx.attackFx) || renderFx.weaponEvoFx));
  const feelProf = feelOn ? visualElement(player, renderFx) : null;
  const feelColor = feelProf?.pal.mid ?? null;

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
    const col = feelOn ? mutedBoltColors(player).c1 : activeEl ? activeEl.primaryColor : '#a5b4fc';
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

  // 0X. ASSASSIN TWIN DAGGERS — quick steel streaks; the 3rd strike is a crossing double slash in crimson.
  if (weapon === 'shadow_daggers') {
    const cross = player.assassinComboStep === 2;
    const stepN = player.assassinComboStep;
    const fy = originY - h * 0.02 + (stepN === 1 ? 5 * scale : -2 * scale);
    const dReach = reach * (cross ? 1.35 : 1.05);
    const sx = player.x + player.facing * 6 * scale;
    const ex = sx + player.facing * dReach;
    const crimson = evoTier >= 2 ? '#fb7185' : '#be123c';
    if (player.attackState === 'startup') {
      ctx.fillStyle = cross ? 'rgba(159, 18, 57, 0.28)' : 'rgba(120, 113, 108, 0.22)';
      ctx.beginPath();
      ctx.arc(player.x - player.facing * 6 * scale, fy, (cross ? 11 : 6) * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.attackState === 'active') {
      ctx.lineCap = 'round';
      const drawSlash = (y0: number, y1: number, widthMul: number, col: string, core: string) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(4, 8 * scale * widthMul);
        ctx.beginPath();
        ctx.moveTo(sx, y0);
        ctx.quadraticCurveTo((sx + ex) / 2, (y0 + y1) / 2 - 10 * scale * widthMul, ex, y1);
        ctx.stroke();
        ctx.strokeStyle = core;
        ctx.lineWidth = Math.max(1.5, 2.4 * scale * widthMul);
        ctx.beginPath();
        ctx.moveTo(sx + player.facing * dReach * 0.3, (y0 * 0.65 + y1 * 0.35));
        ctx.quadraticCurveTo((sx + ex) / 2, (y0 + y1) / 2 - 10 * scale * widthMul, ex, y1);
        ctx.stroke();
      };
      if (cross) {
        drawSlash(fy - 16 * scale, fy + 12 * scale, 1.2, 'rgba(159, 18, 57, 0.5)', '#fecdd3');
        drawSlash(fy + 16 * scale, fy - 12 * scale, 1.2, 'rgba(159, 18, 57, 0.5)', '#fecdd3');
      } else {
        const dir = stepN === 1 ? 1 : -1;
        drawSlash(fy - dir * 8 * scale, fy + dir * 6 * scale, 1, 'rgba(168, 162, 158, 0.42)', evoTier >= 1 ? '#fda4af' : '#f5f5f4');
      }
      ctx.fillStyle = crimson;
      const st = (cross ? 8 : 5) * scale;
      ctx.beginPath();
      ctx.moveTo(ex + player.facing * st, fy);
      ctx.lineTo(ex, fy - st * 0.7);
      ctx.lineTo(ex - player.facing * st * 0.5, fy);
      ctx.lineTo(ex, fy + st * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // 0W. WIZARD SPIRE STAFF — gathering rune at the staff head, then a muzzle flare as the bolt leaves.
  if (weapon === 'spire_staff') {
    const col = feelOn ? mutedBoltColors(player).c1 : activeEl ? activeEl.primaryColor : '#a5b4fc';
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

      if (!feelOn) {
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
      } else {
        ctx.strokeStyle = feelColor ?? '#9aa3ad';
        ctx.lineWidth = Math.max(2, 3.2 * scale);
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, slashRadius * 0.96, startA, endA, false);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
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

      if (!feelOn) {
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
      } else {
        ctx.strokeStyle = feelColor ?? '#9aa3ad';
        ctx.lineWidth = Math.max(2, 3.2 * scale);
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, slashRadius * 0.94, startA, endA, false);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
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

        ctx.strokeStyle = feelOn ? (feelColor ?? 'rgba(160,140,150,0.45)') : isFlaming ? 'rgba(249, 115, 22, 0.5)' : 'rgba(244, 63, 94, 0.48)';
        ctx.lineWidth = Math.max(feelOn ? 2.5 : 5, (feelOn ? 3.5 : 8) * scale);
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

  // 2B. SPECIALTY & NEW WEAPON VISUALS (+ Hold-to-Charge Aura!)
  if (
    player.attackWeapon === 'estoc_spear' ||
    player.attackWeapon === 'short_blade' ||
    player.attackWeapon === 'cleaver_greatsword' ||
    player.attackWeapon === 'joust_lance' ||
    player.attackWeapon === 'arcane_wand' ||
    player.attackWeapon === 'war_fans' ||
    player.attackWeapon === 'meteor_flail' ||
    player.attackWeapon === 'solar_glaive' ||
    player.attackWeapon === 'prism_gauntlets'
  ) {
    const wep = player.attackWeapon;
    // Charge aura ring for charging weapons during startup
    if (player.attackState === 'startup' && (wep === 'cleaver_greatsword' || wep === 'joust_lance')) {
      const chFrac = Math.min(1, player.weaponChargeTimer / 0.95);
      const col = wep === 'cleaver_greatsword' ? '#fb923c' : '#facc15';
      ctx.strokeStyle = col;
      ctx.lineWidth = (2.5 + chFrac * 4.5) * scale;
      ctx.globalAlpha = 0.45 + chFrac * 0.5;
      ctx.beginPath();
      ctx.arc(player.x, originY, (22 + chFrac * 24) * scale, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * Math.max(0.2, chFrac));
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (player.attackState === 'active') {
      const elCol = activeEl?.primaryColor ?? (isFlaming ? '#fb923c' : null);
      if (wep === 'estoc_spear' || wep === 'joust_lance') {
        const isLance = wep === 'joust_lance';
        const mult = isLance ? 1.85 * (1 + Math.min(0.45, player.weaponChargeTimer * 0.42)) : 1.18;
        const endX = originX + player.facing * reach * mult;
        ctx.strokeStyle = elCol ?? (isLance ? '#facc15' : '#38bdf8');
        ctx.lineWidth = (isLance ? 13 : 7) * scale;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(endX, originY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = (isLance ? 5 : 2.6) * scale;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(endX, originY);
        ctx.stroke();
        // Piercing needle tip cone
        ctx.fillStyle = elCol ?? (isLance ? '#fef08a' : '#e0f2fe');
        ctx.beginPath();
        ctx.moveTo(endX + player.facing * (isLance ? 26 : 16) * scale, originY);
        ctx.lineTo(endX - player.facing * 8 * scale, originY - (isLance ? 12 : 6) * scale);
        ctx.lineTo(endX - player.facing * 8 * scale, originY + (isLance ? 12 : 6) * scale);
        ctx.closePath();
        ctx.fill();
      } else if (wep === 'short_blade' || wep === 'cleaver_greatsword' || wep === 'solar_glaive') {
        const isGreat = wep === 'cleaver_greatsword';
        const isSolar = wep === 'solar_glaive';
        const r = reach * (isGreat ? 1.55 * (1 + Math.min(0.42, player.weaponChargeTimer * 0.4)) : isSolar ? 1.38 : 0.78);
        const startA = player.facing === 1 ? -Math.PI * 0.72 : Math.PI * 0.28;
        const endA = player.facing === 1 ? Math.PI * 0.56 : Math.PI * 1.72;
        ctx.strokeStyle = elCol ?? (isSolar ? '#fbbf24' : isGreat ? '#fb923c' : '#cbd5e1');
        ctx.lineWidth = (isGreat ? 22 : isSolar ? 16 : 9) * scale;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.62;
        ctx.beginPath();
        ctx.arc(player.x, originY, r, startA, endA, false);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = isSolar ? '#fef08a' : '#ffffff';
        ctx.lineWidth = (isGreat ? 6 : isSolar ? 4.5 : 3) * scale;
        ctx.beginPath();
        ctx.arc(player.x, originY, r * 1.03, startA, endA, false);
        ctx.stroke();
      } else if (wep === 'prism_gauntlets') {
        // Crystal kinetic burst punch forward!
        const endX = originX + player.facing * reach * 0.92;
        ctx.strokeStyle = elCol ?? '#e879f9';
        ctx.lineWidth = 14 * scale;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(endX, originY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc(endX, originY, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
      } else if (wep === 'war_fans') {
        // Super wide, very short 300-degree close crescent flourish!
        const r = Math.max(50, reach * 0.62);
        ctx.strokeStyle = elCol ?? '#2dd4bf';
        ctx.lineWidth = 14 * scale;
        ctx.globalAlpha = 0.58;
        ctx.beginPath();
        ctx.arc(player.x, originY, r, -Math.PI * 0.9, Math.PI * 0.75);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#f0fdfa';
        ctx.lineWidth = 3.5 * scale;
        ctx.beginPath();
        ctx.arc(player.x, originY, r * 0.92, -Math.PI * 0.85, Math.PI * 0.7);
        ctx.stroke();
      } else if (wep === 'meteor_flail') {
        // Heavy iron chain + explosive impact sphere at impact point!
        const impX = player.x + player.facing * 72 * scale;
        const impY = player.y - h * 0.28;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3 * scale;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(impX, impY);
        ctx.stroke();
        ctx.setLineDash([]);
        const grad = ctx.createRadialGradient(impX, impY, 8, impX, impY, Math.max(115, reach * 1.38));
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
        grad.addColorStop(0.45, 'rgba(239, 68, 68, 0.45)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(impX, impY, Math.max(115, reach * 1.38), 0, Math.PI * 2);
        ctx.fill();
      } else if (wep === 'arcane_wand') {
        // Crisp glowing wand tip cast ring
        const tipX = originX + player.facing * 26 * scale;
        ctx.strokeStyle = elCol ?? '#818cf8';
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.arc(tipX, originY, 13 * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
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

    ctx.strokeStyle = feelOn
      ? (feelColor ? feelColor : 'rgba(160, 140, 110, 0.45)')
      : isFlaming ? 'rgba(249, 115, 22, 0.55)' : 'rgba(229, 169, 60, 0.38)';
    ctx.lineWidth = Math.max(3, ((feelOn ? 5 : isFlaming ? 14 : 9)) * scale);
    ctx.lineCap = 'round';
    if (feelOn) ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, originY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = feelOn ? (feelProf?.pal.core ?? '#e8e0d0') : isFlaming ? '#fef08a' : SPRITE_PALETTE.whipCore;
    ctx.lineWidth = Math.max(2, (feelOn ? 2.4 : isFlaming ? 4.2 : 3.2) * scale);
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
  if (enemy.isMirrorPhantom) {
    const ew = enemy.baseW * scale;
    const eh = enemy.baseH * scale;
    const shimmer = 0.68 + Math.sin(enemy.animTime * 8) * 0.1;
    // Prismatic crystal aura behind Mirror Phantom
    ctx.save();
    const aura = ctx.createRadialGradient(
      enemy.x,
      enemy.y - eh * 0.5,
      4,
      enemy.x,
      enemy.y - eh * 0.5,
      Math.max(ew, eh) * 0.72
    );
    aura.addColorStop(0, 'rgba(103, 232, 249, 0.34)');
    aura.addColorStop(0.6, 'rgba(244, 114, 182, 0.18)');
    aura.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y - eh * 0.5, Math.max(ew, eh) * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Translucent mirror reflection sprite with crystalline refraction tint
    ctx.globalAlpha = shimmer;
    drawDetailedEnemySprite(ctx, enemy, scale, assassinationEnabled);

    // Prismatic cyan-rose crystalline frame & floating shard diamond above phantom
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - eh - 18);
    ctx.lineTo(enemy.x + 6, enemy.y - eh - 11);
    ctx.lineTo(enemy.x, enemy.y - eh - 4);
    ctx.lineTo(enemy.x - 6, enemy.y - eh - 11);
    ctx.closePath();
    ctx.fillStyle = 'rgba(224, 242, 254, 0.8)';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
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
  } else if (proj.kind === 'thrown_dagger') {
    // Thrown dagger: spinning steel blade (spectral ones are crimson ghosts).
    const ghost = !!proj.pierce;
    const spin = ghost ? 0 : Math.sin(proj.life * 40) * 0.0;
    ctx.rotate(spin);
    if (ghost) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(190, 18, 60, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(0, -3.2);
      ctx.lineTo(0, 3.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = ghost ? '#fda4af' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-7, -2.2);
    ctx.lineTo(7, 0);
    ctx.lineTo(-7, 2.2);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ghost ? '#be123c' : '#1c1917';
    ctx.fillRect(-13, -1.3, 5, 2.6);
    ctx.fillStyle = '#9f1239';
    ctx.fillRect(-10, -1.3, 1.4, 2.6);
    ctx.fillStyle = ghost ? '#44403c' : '#44403c';
    ctx.fillRect(-9, -3.4, 1.6, 6.8);
  } else if (proj.kind === 'venom_needle') {
    const col = proj.color ?? '#65a30d';
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(0, -2.4);
    ctx.lineTo(0, 2.4);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(-7, -0.9, 12, 1.8);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(5, -1.4);
    ctx.lineTo(10, 0);
    ctx.lineTo(5, 1.4);
    ctx.closePath();
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
  } else if (proj.kind === 'grimoire_orb') {
    const c1 = proj.color ?? '#f97316';
    const r = proj.radius;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = c1;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'crossbow_bolt') {
    ctx.fillStyle = proj.color ?? '#34d399';
    ctx.fillRect(-13, -1.8, 22, 3.6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(9, -3.4);
    ctx.lineTo(16, 0);
    ctx.lineTo(9, 3.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-15, -3.5, 5, 7);
  } else if (proj.kind === 'chakram') {
    const r = proj.radius;
    ctx.strokeStyle = proj.returning ? '#fb7185' : '#fbbf24';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    for (let b = 0; b < 4; b++) {
      const a = (b * Math.PI) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
      ctx.lineTo(Math.cos(a + 0.35) * (r - 2), Math.sin(a + 0.35) * (r - 2));
      ctx.lineTo(Math.cos(a - 0.35) * (r - 2), Math.sin(a - 0.35) * (r - 2));
      ctx.closePath();
      ctx.fill();
    }
  } else if (proj.kind === 'chakram_vortex') {
    const r = proj.radius;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'spore_glob') {
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ecfccb';
    ctx.beginPath();
    ctx.arc(-2, -2, proj.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (proj.kind === 'rail_beam') {
    const col = proj.color ?? '#38bdf8';
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col;
    ctx.fillRect(-18, -3.5, 36, 7);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-16, -1.5, 32, 3);
  } else if (proj.kind === 'jade_bolt') {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = proj.color ?? '#34d399';
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
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

export function drawWorldPickup(
  ctx: CanvasRenderingContext2D,
  pickup: WorldPickup,
  time: number
): void {
  const bob = Math.sin(time * 4.5 + pickup.bobPhase) * 3.5;
  const x = pickup.x;
  const y = pickup.y - 10 + bob;

  ctx.save();
  if (pickup.kind === 'gold') {
    const spinW = Math.max(2.5, Math.abs(Math.cos(time * 5.2 + pickup.bobPhase)) * 7);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, spinW, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (pickup.kind === 'hp_goblet' || pickup.kind === 'mp_goblet') {
    const isHp = pickup.kind === 'hp_goblet';
    const col = isHp ? '#ef4444' : '#38bdf8';
    const glow = isHp ? 'rgba(239, 68, 68, 0.34)' : 'rgba(56, 189, 248, 0.34)';
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 2, 15, 0, Math.PI * 2);
    ctx.fill();
    // Chalice cup
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x - 5, y + 4, 10, 3);
    ctx.fillRect(x - 1.5, y - 1, 3, 6);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 9);
    ctx.lineTo(x + 7, y - 9);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x - 4, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.3;
    ctx.stroke();
  } else if (pickup.kind === 'map_relic') {
    // Gleaming Ancient Map Relic Gem
    const pulse = 1 + Math.sin(time * 5 + pickup.bobPhase) * 0.14;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.26)';
    ctx.beginPath();
    ctx.arc(x, y - 3, 18 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x + 9, y - 3);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 9, y - 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pickup.kind === 'boss_charm' && pickup.charmId) {
    // Mythic Signature Boss Charm Orb + Rotating Halo + Nameplate!
    const charm = BOSS_CHARMS[pickup.charmId];
    const accent = charm?.color ?? '#f59e0b';
    const pulse = 1 + Math.sin(time * 4.2) * 0.15;
    const grad = ctx.createRadialGradient(x, y - 8, 4, x, y - 8, 36 * pulse);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, accent);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 8, 36 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Rotating sacred sigil ring
    ctx.save();
    ctx.translate(x, y - 8);
    ctx.rotate(time * 1.8);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Jewel core
    ctx.fillStyle = accent;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 21);
    ctx.lineTo(x + 11, y - 8);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 11, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Floating charm name tag
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef3c7';
    ctx.fillText(charm?.name.toUpperCase() ?? 'BOSS CHARM', x, y - 28);
  } else if (pickup.kind === 'lore_fragment') {
    // Glowing Ancient Lore Scroll Fragment
    const pulse = 1 + Math.sin(time * 4.5 + pickup.bobPhase) * 0.14;
    const grad = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 24 * pulse);
    grad.addColorStop(0, 'rgba(254, 243, 199, 0.82)');
    grad.addColorStop(0.5, 'rgba(229, 169, 60, 0.34)');
    grad.addColorStop(1, 'rgba(229, 169, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y - 6, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Rolled parchment scroll with crimson wax seal
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.6;
    ctx.fillRect(x - 8, y - 14, 16, 16);
    ctx.strokeRect(x - 8, y - 14, 16, 16);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x - 10, y - 15, 20, 3);
    ctx.fillRect(x - 10, y + 1, 20, 3);
    // Ink lines + wax seal
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x - 5, y - 10, 10, 1.5);
    ctx.fillRect(x - 5, y - 6, 8, 1.5);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x + 3, y - 2, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('LORE', x, y - 21);
  }
  ctx.restore();
}

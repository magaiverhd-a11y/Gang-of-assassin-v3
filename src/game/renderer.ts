import { setFxRenderContext } from './affinityFx';
import { drawAffinityZones, drawFxBehind, drawFxFront } from './fxDraw';
import { GameEngine } from './engine';
import { CAMP_FIRE_X } from './level';
import {
  drawAfterimage,
  drawBossDeathSequence,
  drawCampfire,
  drawElementalArc,
  drawElementalPlayerAura,
  drawEnemySprite,
  drawDeathMark,
  drawExecutionMark,
  drawGasCloud,
  drawGrappleHook,
  drawGroundHazard,
  drawHangingBrazier,
  drawHidingSpotBack,
  drawHidingSpotFront,
  drawInteractable,
  drawMinstrelAimReticle,
  drawMinstrelEffects,
  drawPhantomAlly,
  drawPlatformTile,
  drawPlayerSprite,
  drawProjectile,
  drawSecretWall,
  drawShockwaveRing,
  drawSparkleParticle,
  drawTorch,
  drawWeaponAttack,
  drawWorldPickup,
} from './sprites';
import { Enemy, Platform, Player, StageDef, StageTheme, TuningConfig } from './types';

function drawUnitStatuses(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pips: { label: string; color: string }[]
): void {
  if (pips.length === 0) return;
  ctx.save();
  ctx.font = 'bold 8px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = 28;
  const start = x - (pips.length * (w + 3)) / 2;
  pips.forEach((pip, i) => {
    const px = start + i * (w + 3);
    ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
    ctx.fillRect(px, y, w, 12);
    ctx.strokeStyle = pip.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, y, w, 12);
    ctx.fillStyle = pip.color;
    ctx.fillText(pip.label, px + w / 2, y + 6);
  });
  ctx.restore();
}

function enemyStatusPips(enemy: Enemy): { label: string; color: string }[] {
  const pips: { label: string; color: string }[] = [];
  if (enemy.burnTimer > 0) pips.push({ label: `BRN ${Math.ceil(enemy.burnTimer)}`, color: '#fb923c' });
  if ((enemy.freezeTimer ?? 0) > 0) pips.push({ label: `ICE ${Math.ceil(enemy.freezeTimer ?? 0)}`, color: '#7dd3fc' });
  else if ((enemy.chillTimer ?? 0) > 0) pips.push({ label: `SLW ${Math.ceil(enemy.chillTimer ?? 0)}`, color: '#38bdf8' });
  if ((enemy.stunTimer ?? 0) > 0) pips.push({ label: `STN ${Math.ceil(enemy.stunTimer ?? 0)}`, color: '#fde047' });
  if ((enemy.poisonTimer ?? 0) > 0) {
    pips.push({ label: `PSN${enemy.poisonStacks ?? 1} ${Math.ceil(enemy.poisonTimer ?? 0)}`, color: '#84cc16' });
  }
  if ((enemy.blindTimer ?? 0) > 0) pips.push({ label: `BLD ${Math.ceil(enemy.blindTimer ?? 0)}`, color: '#e879f9' });
  return pips;
}

function playerStatusPips(p: Player): { label: string; color: string }[] {
  const pips: { label: string; color: string }[] = [];
  if (p.statusBurnTimer > 0) pips.push({ label: `BRN ${Math.ceil(p.statusBurnTimer)}`, color: '#fb923c' });
  if (p.statusFreezeTimer > 0) pips.push({ label: `ICE ${Math.ceil(p.statusFreezeTimer)}`, color: '#7dd3fc' });
  else if (p.statusSoakedTimer > 0) pips.push({ label: `SLW ${Math.ceil(p.statusSoakedTimer)}`, color: '#38bdf8' });
  if (p.statusStunTimer > 0) pips.push({ label: `STN ${Math.ceil(p.statusStunTimer)}`, color: '#fde047' });
  if (p.statusPoisonTimer > 0) pips.push({ label: `PSN${p.statusPoisonStacks} ${Math.ceil(p.statusPoisonTimer)}`, color: '#84cc16' });
  if (p.statusBlindTimer > 0) pips.push({ label: `BLD ${Math.ceil(p.statusBlindTimer)}`, color: '#e879f9' });
  return pips;
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  tuning: TuningConfig,
  viewportW: number,
  viewportH: number
): void {
  // Tuning v2: render with the same per-character tuning the engine simulates with.
  tuning = engine.effectiveTuning ?? tuning;
  setFxRenderContext(tuning.fx, engine.time, engine.fx.mobile);
  const stage = engine.currentStage;
  const theme = stage.theme;

  // 1. Stage-themed Sky / Interior Backdrop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, viewportH);
  skyGrad.addColorStop(0, theme.skyTop);
  skyGrad.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewportW, viewportH);

  // Biome Celestial Sky: Scorching Desert Sun, Starlit Desert Night, Ringed Alien Planet, or Moon
  const env = stage.environment ?? 'castle';
  const isSandNight = env === 'sand' && stage.roomNumber % 2 === 0 && !stage.isBigBossRoom;
  const isSandSun = env === 'sand' && !isSandNight;
  const moonX = stage.isCamp
    ? viewportW * 0.64
    : stage.isBigBossRoom
      ? viewportW * 0.5
      : viewportW * 0.76 - (engine.camera.x / stage.worldWidth) * 90;
  const moonY = stage.isBigBossRoom ? viewportH * 0.24 : viewportH * 0.18;
  const moonR = isSandSun
    ? stage.isBigBossRoom
      ? 68
      : 54
    : stage.isBigBossRoom
      ? 54
      : stage.isCamp
        ? 44
        : 36;

  if (isSandSun) {
    // BLAZING DESERT SUN: Scorching concentric solar corona + sweeping sunrays!
    const sunHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 5.2);
    sunHalo.addColorStop(0, 'rgba(254, 249, 195, 0.92)');
    sunHalo.addColorStop(0.28, 'rgba(251, 191, 36, 0.45)');
    sunHalo.addColorStop(0.62, 'rgba(234, 88, 12, 0.18)');
    sunHalo.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunHalo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 5.2, 0, Math.PI * 2);
    ctx.fill();

    // Subtle shimmering solar heat rings
    ctx.save();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.48 + Math.sin(engine.time * 1.8) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
  } else if (isSandNight) {
    // STRONG DESERT NIGHT: Twinkling starfield + glowing silver crescent moon!
    ctx.save();
    for (let i = 0; i < 48; i++) {
      const sx = ((i * 97 + 31) % viewportW + viewportW) % viewportW;
      const sy = (i * 53 + 19) % (viewportH * 0.56);
      const tw = 0.35 + Math.sin(engine.time * 2.4 + i * 1.7) * 0.45;
      ctx.fillStyle = i % 5 === 0 ? `rgba(253, 224, 71, ${tw})` : `rgba(224, 242, 254, ${tw})`;
      const sz = i % 4 === 0 ? 2.6 : 1.6;
      ctx.fillRect(sx, sy, sz, sz);
    }
    const nightGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, moonR * 4.4);
    nightGlow.addColorStop(0, 'rgba(224, 242, 254, 0.36)');
    nightGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.14)');
    nightGlow.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = nightGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.4, 0, Math.PI * 2);
    ctx.fill();
    // Crescent moon silhouette
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.skyTop;
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.42, moonY - moonR * 0.16, moonR * 0.88, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (env === 'alien') {
    // ALIEN SHIP DEEP SPACE: Ringed Gas Giant Planet beyond viewport!
    const planetGlow = ctx.createRadialGradient(moonX, moonY, 16, moonX, moonY, moonR * 4.5);
    planetGlow.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
    planetGlow.addColorStop(0.55, 'rgba(168, 85, 247, 0.16)');
    planetGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = planetGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(moonX, moonY);
    const pGrad = ctx.createLinearGradient(-moonR, -moonR, moonR, moonR);
    pGrad.addColorStop(0, '#67e8f9');
    pGrad.addColorStop(0.55, '#1d4ed8');
    pGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(0, 0, moonR * 1.12, 0, Math.PI * 2);
    ctx.fill();
    // Tilted luminous planetary rings
    ctx.rotate(-0.28);
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, moonR * 2.15, moonR * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(232, 121, 249, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, moonR * 2.5, moonR * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (env === 'mirror_cathedral') {
    // SHATTERED MIRROR CATHEDRAL SKY: Fractured Prism Moon & Prismatic Refraction Halos!
    ctx.save();
    const prismGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, moonR * 4.8);
    prismGlow.addColorStop(0, 'rgba(224, 242, 254, 0.45)');
    prismGlow.addColorStop(0.42, 'rgba(103, 232, 249, 0.2)');
    prismGlow.addColorStop(0.72, 'rgba(244, 114, 182, 0.14)');
    prismGlow.addColorStop(1, 'rgba(15, 10, 34, 0)');
    ctx.fillStyle = prismGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.8, 0, Math.PI * 2);
    ctx.fill();

    // Rotating prismatic refraction rings
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.65 + Math.sin(engine.time * 1.8) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.24)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.25 - Math.sin(engine.time * 1.4) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Shattered crescent-crystal moon fragments
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    // Sharp prism fracture fissure splitting the moon
    ctx.strokeStyle = '#0b081b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(moonX - moonR * 0.7, moonY - moonR * 0.65);
    ctx.lineTo(moonX + moonR * 0.1, moonY);
    ctx.lineTo(moonX - moonR * 0.2, moonY + moonR * 0.85);
    ctx.moveTo(moonX + moonR * 0.1, moonY);
    ctx.lineTo(moonX + moonR * 0.85, moonY - moonR * 0.25);
    ctx.stroke();
    ctx.restore();
  } else {
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 14, moonX, moonY, moonR * 4.2);
    moonGlow.addColorStop(0, `${theme.moonColor}4a`);
    moonGlow.addColorStop(1, `${theme.moonColor}00`);
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.moonColor;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
  }

  if (stage.isCamp) {
    drawCampCastleSilhouette(ctx, engine.camera.x, viewportW, viewportH);
  } else {
    drawRoomParallax(ctx, stage, engine.camera.x, viewportW, viewportH, engine.time);
  }

  // 2. World Space Transform (Zoom + Impact Zoom-Punch + Camera + Shake)
  const effectiveZoom = tuning.zoom * (1 + engine.cameraZoomPunch * (tuning.zoomPunchMult ?? 1));
  ctx.save();
  ctx.translate(
    Math.round(viewportW / 2 + engine.camera.offsetX),
    Math.round(viewportH / 2 + engine.camera.offsetY)
  );
  ctx.scale(effectiveZoom, effectiveZoom);
  ctx.translate(-engine.camera.x, -engine.camera.y);

  if (stage.isCamp) {
    drawCampScenery(ctx, stage.floorY);
  } else {
    drawRoomArchitecture(ctx, stage, engine.time);
    if (!stage.isBigBossRoom) {
      drawBossGateMarker(ctx, stage.bossZoneStartX, theme);
    }
  }

  for (const torch of stage.torches) {
    drawTorch(ctx, torch, engine.time);
  }

  drawSoftPlatformSupports(ctx, engine.platforms, stage);

  for (const plat of engine.platforms) {
    drawPlatformTile(
      ctx,
      plat,
      theme,
      engine.crumbleStates.get(plat.id),
      engine.time,
      stage.environment
    );
  }

  // Breakable Secret Walls (cracked masonry with subtle golden/violet fracture glint)
  for (const sw of engine.secretWalls) {
    drawSecretWall(ctx, sw, engine.time);
  }

  // Prism Striker Crystalline Glass Walls (Evolving 1-to-4-Wall Bounce Box Machine!)
  for (const gw of engine.glassWalls) {
    const fade = Math.min(1, gw.life / 0.8);
    const flashAlpha = gw.flashTimer > 0 ? 0.55 : 0;
    ctx.save();
    ctx.globalAlpha = fade;
    // Outer crystalline glow
    ctx.fillStyle = gw.flashTimer > 0 ? '#ffffff' : gw.color;
    ctx.globalAlpha = fade * (0.28 + flashAlpha * 0.5);
    ctx.fillRect(gw.x - 4, gw.y - 4, gw.w + 8, gw.h + 8);
    // Translucent glass pane core
    ctx.globalAlpha = fade * (0.48 + flashAlpha * 0.4);
    ctx.fillStyle = gw.flashTimer > 0 ? '#e0f2fe' : gw.color;
    ctx.fillRect(gw.x, gw.y, gw.w, gw.h);
    // Crisp bright prism edge border
    ctx.globalAlpha = fade * 0.95;
    ctx.strokeStyle = gw.flashTimer > 0 ? '#ffffff' : '#cffafe';
    ctx.lineWidth = gw.flashTimer > 0 ? 3 : 2;
    ctx.strokeRect(gw.x, gw.y, gw.w, gw.h);
    // Specular glass sheen diagonal streaks
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (gw.orientation === 'vertical') {
      for (let sy = gw.y + 18; sy < gw.y + gw.h - 14; sy += 34) {
        ctx.moveTo(gw.x + 2, sy);
        ctx.lineTo(gw.x + gw.w - 2, sy - 12);
      }
    } else {
      for (let sx = gw.x + 20; sx < gw.x + gw.w - 14; sx += 38) {
        ctx.moveTo(sx, gw.y + 2);
        ctx.lineTo(sx - 12, gw.y + gw.h - 2);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // High-Road Hanging Fire Braziers (Snap chains to drop fiery AoE onto enemies below!)
  for (const brazier of engine.hangingBraziers) {
    const nearP =
      brazier.state === 'hanging' &&
      Math.hypot(engine.player.x - brazier.x, engine.player.y - 28 - brazier.y) < 110;
    drawHangingBrazier(ctx, brazier, engine.time, nearP);
  }

  // Persistent Room Blood Splatters on Stone & Platforms
  for (const stain of engine.bloodStains) {
    ctx.save();
    ctx.globalAlpha = stain.alpha;
    ctx.fillStyle = stain.color;
    ctx.beginPath();
    ctx.ellipse(stain.x, stain.y + 1.5, stain.width * 0.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const spot of stage.hidingSpots) {
    drawHidingSpotBack(ctx, spot);
  }

  // In Camp, draw the crackling fireplace behind the characters standing in front of the fire!
  if (stage.isCamp) {
    drawCampfire(ctx, CAMP_FIRE_X, stage.floorY, engine.time);
  }

  const nearby = engine.getNearbyInteractable();
  for (const item of engine.interactables) {
    drawInteractable(
      ctx,
      item,
      nearby?.id === item.id,
      engine.time,
      engine.player.characterId,
      tuning.playerScale
    );
  }

  // World Pickups (Gold Coins, HP/MP Goblets, Scattered Map Relics & Mythic Boss Charms!)
  for (const pickup of engine.pickups) {
    drawWorldPickup(ctx, pickup, engine.time);
  }

  for (const cloud of engine.gasClouds) {
    drawGasCloud(ctx, cloud, engine.time);
  }

  for (const hazard of engine.groundHazards) {
    drawGroundHazard(ctx, hazard, engine.time);
  }

  for (const enemy of engine.enemies) {
    if (enemy.dead) continue;

    // Subtle readable patrol vision cone for unalerted non-boss enemies (scales with raid tier & room depth)
    if (!enemy.alerted && !enemy.isBoss && !stage.isCamp) {
      const visionScale = Math.min(
        1.5,
        0.65 + (engine.getRaidOrderTier() - 1) * 0.18 + Math.max(0, stage.roomNumber - 1) * 0.05
      );
      const coneLen = Math.max(95, Math.min(340, enemy.visionRange * visionScale));
      const eyeY = enemy.y - enemy.baseH * tuning.enemyScale * 0.68;
      const tipX = enemy.x + enemy.facing * coneLen;
      ctx.save();
      const coneGrad = ctx.createLinearGradient(enemy.x, eyeY, tipX, eyeY);
      coneGrad.addColorStop(0, 'rgba(251, 191, 36, 0.14)');
      coneGrad.addColorStop(0.75, 'rgba(251, 191, 36, 0.06)');
      coneGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(enemy.x, eyeY);
      ctx.lineTo(tipX, eyeY - 34);
      ctx.lineTo(tipX, eyeY + 34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    drawEnemySprite(ctx, enemy, tuning.enemyScale, tuning.assassinationEnabled);

    // Pulsing EXECUTE reticle when player can land a Backstab, Ambush, or Vertical Drop-Assassination!
    const isBehindUnalerted =
      !enemy.alerted &&
      !enemy.isBoss &&
      (engine.player.x - enemy.x) * enemy.facing < 22 &&
      Math.hypot(engine.player.x - enemy.x, engine.player.y - enemy.y) < 235;
    const isAboveDropTarget =
      !enemy.alerted &&
      !enemy.isBoss &&
      engine.player.y < enemy.y - 34 &&
      Math.abs(engine.player.x - enemy.x) < 145;
    const isStealthAmbush =
      (engine.player.isHidden || engine.player.ambushTimer > 0) &&
      !enemy.isBoss &&
      Math.hypot(engine.player.x - enemy.x, engine.player.y - enemy.y) < 245;

    drawUnitStatuses(ctx, enemy.x, enemy.y - enemy.baseH * tuning.enemyScale - 18, enemyStatusPips(enemy));

    if (enemy.chillTimer && enemy.chillTimer > 0) {
      const ew = enemy.baseW * tuning.enemyScale;
      const eh = enemy.baseH * tuning.enemyScale;
      ctx.save();
      ctx.fillStyle = 'rgba(103, 232, 249, 0.22)';
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.72)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y - eh * 0.5, ew * 0.58, eh * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (
      tuning.assassinationEnabled &&
      !stage.isCamp &&
      (isBehindUnalerted || isAboveDropTarget || isStealthAmbush)
    ) {
      drawExecutionMark(ctx, enemy, tuning.enemyScale, engine.time);
    }

    if ((enemy.markTimer ?? 0) > 0 && !enemy.dead) {
      drawDeathMark(ctx, enemy, tuning.enemyScale, engine.time, engine.fx.mobile ? 'tap' : '0');
    }
  }

  for (const seq of engine.bossDeathSequences) {
    drawBossDeathSequence(ctx, seq, engine.time);
  }

  // Assassin: brief crimson beam from the hero to a freshly branded foe.
  for (const mb of engine.markBeams) {
    const k = Math.max(0, mb.life / mb.maxLife);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(190, 18, 60, ${0.55 * k})`;
    ctx.lineWidth = 6 * k + 1;
    ctx.beginPath();
    ctx.moveTo(mb.x1, mb.y1);
    ctx.lineTo(mb.x2, mb.y2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(254, 205, 211, ${0.9 * k})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  for (const ghost of engine.afterimages) {
    drawAfterimage(
      ctx,
      ghost,
      engine.player.baseW,
      engine.player.baseH,
      engine.player.crouchBaseH,
      tuning.playerScale
    );
  }

  drawGrappleHook(ctx, engine.player, engine.player.grapple, tuning.playerScale);
  drawMinstrelEffects(ctx, engine.player, tuning.playerScale, engine.time);

  // Minstrel 8-way directional whip target reticle
  if (engine.minstrelAimAnchor) {
    drawMinstrelAimReticle(ctx, engine.minstrelAimAnchor, engine.time);
  }

  // Shadow Chain Momentum violet-crimson stealth aura around player
  if (engine.player.shadowChainTimer > 0) {
    const p = engine.player;
    const ph = (p.crouching ? p.crouchBaseH : p.baseH) * tuning.playerScale;
    const aura = ctx.createRadialGradient(p.x, p.y - ph * 0.5, 4, p.x, p.y - ph * 0.5, 44);
    aura.addColorStop(0, 'rgba(192, 132, 252, 0.32)');
    aura.addColorStop(0.55, 'rgba(244, 63, 94, 0.16)');
    aura.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(p.x, p.y - ph * 0.5, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tuning.fx?.affinityFx ?? true) {
    drawFxBehind(ctx, engine.fx, engine.player, tuning.playerScale, engine.time);
  } else {
    drawElementalPlayerAura(ctx, engine.player, tuning.playerScale, engine.time);
  }
  drawAffinityZones(ctx, engine.affinityZones);
  for (const ally of engine.phantomAllies) {
    drawPhantomAlly(ctx, ally, tuning.playerScale, engine.time);
  }
  drawPlayerSprite(ctx, engine.player, tuning.playerScale);
  {
    const p = engine.player;
    const ph = (p.crouching ? p.crouchBaseH : p.baseH) * tuning.playerScale;
    drawUnitStatuses(ctx, p.x, p.y - ph - 16, playerStatusPips(p));
  }
  drawWeaponAttack(ctx, engine.player, tuning.playerScale, engine.effectiveTuning?.attackRange ?? tuning.attackRange);
  drawFxFront(ctx, engine.fx, engine.player, engine.enemies, tuning, engine.time);

  for (const spot of stage.hidingSpots) {
    const inside =
      engine.player.isHidden &&
      engine.player.x >= spot.x &&
      engine.player.x <= spot.x + spot.w &&
      engine.player.y >= spot.y - spot.h &&
      engine.player.y <= spot.y + 10;
    drawHidingSpotFront(ctx, spot, inside);
  }

  for (const ring of engine.shockwaves) {
    drawShockwaveRing(ctx, ring);
  }

  for (const arc of engine.elementalArcs) {
    drawElementalArc(ctx, arc);
  }

  for (const proj of engine.projectiles) {
    drawProjectile(ctx, proj);
  }

  for (const pt of engine.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    if (pt.kind === 'sparkle') {
      drawSparkleParticle(ctx, pt.x, pt.y, pt.size, pt.color, pt.rotation, alpha);
    } else if (pt.kind === 'blood') {
      const spd = Math.hypot(pt.vx, pt.vy);
      const ang = Math.atan2(pt.vy, pt.vx);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.4);
      ctx.translate(pt.x, pt.y);
      ctx.rotate(ang);
      ctx.fillStyle = pt.color;
      const len = Math.max(pt.size, Math.min(pt.size * 3.4, spd * 0.026));
      ctx.beginPath();
      ctx.ellipse(0, 0, len, pt.size * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pt.kind === 'blood_mist') {
      ctx.save();
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = pt.color;
      const r = pt.size * (1.7 - alpha * 0.7);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pt.kind === 'energy_wisp') {
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha * 1.3);
      const glow = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, pt.size * 2.4);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.45, pt.color);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      ctx.restore();
    }
  }

  // Razor-Sharp Anime Slash Cut Lines (Kills, Crits, Assassinations!)
  for (const sl of engine.slashLines) {
    const p = Math.max(0, sl.life / sl.maxLife);
    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.rotate(sl.angle);
    ctx.globalAlpha = Math.min(1, p * 1.6);
    const halfLen = sl.length * (1.15 - p * 0.25);
    const halfW = sl.width * (0.25 + p * 0.75);

    ctx.fillStyle = sl.color;
    ctx.beginPath();
    ctx.moveTo(-halfLen, 0);
    ctx.lineTo(0, -halfW);
    ctx.lineTo(halfLen, 0);
    ctx.lineTo(0, halfW);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = sl.coreColor;
    ctx.beginPath();
    ctx.moveTo(-halfLen * 0.85, 0);
    ctx.lineTo(0, -halfW * 0.36);
    ctx.lineTo(halfLen * 0.85, 0);
    ctx.lineTo(0, halfW * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  for (const dn of engine.damageNumbers) {
    const alpha = Math.min(1, (dn.life / dn.maxLife) * 1.45);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.textAlign = 'center';

    if (dn.subtext) {
      ctx.font = `700 ${Math.round(10 * dn.scale)}px "Cinzel", serif`;
      ctx.fillStyle = dn.color;
      ctx.fillText(dn.subtext, dn.x, dn.y - 16 * dn.scale);
    }

    ctx.font = `700 ${Math.round(17 * dn.scale)}px "JetBrains Mono", monospace`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#080a10';
    ctx.strokeText(dn.text, dn.x, dn.y);
    ctx.fillStyle = dn.color;
    ctx.fillText(dn.text, dn.x, dn.y);
    ctx.restore();
  }

  if (tuning.showCameraGuide) {
    ctx.save();
    ctx.strokeStyle = 'rgba(229, 169, 60, 0.45)';
    ctx.lineWidth = 1.5 / tuning.zoom;
    ctx.setLineDash([6 / tuning.zoom, 4 / tuning.zoom]);
    ctx.strokeRect(
      engine.camera.targetX - tuning.cameraDeadzoneX,
      engine.camera.anchorY - tuning.cameraDeadzoneY,
      tuning.cameraDeadzoneX * 2,
      tuning.cameraDeadzoneY * 2
    );
    ctx.restore();
  }

  // World-space Dramatic Impact Flash-Freeze Slash Cross (Critical / Assassination!)
  if (engine.impactBurstTimer > 0 && engine.impactBurstMax > 0) {
    const p = Math.max(0, engine.impactBurstTimer / engine.impactBurstMax);
    const sc = engine.impactBurstScale * (1.28 - p * 0.22);
    const bx = engine.impactBurstX;
    const by = engine.impactBurstY;

    ctx.save();
    ctx.translate(bx, by);
    ctx.globalAlpha = Math.min(1, p * 1.45);

    const flashGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 74 * sc);
    flashGlow.addColorStop(0, '#ffffff');
    flashGlow.addColorStop(0.35, engine.impactBurstColor);
    flashGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = flashGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 74 * sc, 0, Math.PI * 2);
    ctx.fill();

    // Diagonal Anime Critical Slash Cross
    for (const ang of [-0.52, 0.58]) {
      ctx.save();
      ctx.rotate(ang);
      ctx.fillStyle = engine.impactBurstColor;
      ctx.beginPath();
      ctx.moveTo(-98 * sc, 0);
      ctx.lineTo(0, -11 * sc * p);
      ctx.lineTo(98 * sc, 0);
      ctx.lineTo(0, 11 * sc * p);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-76 * sc, 0);
      ctx.lineTo(0, -4.5 * sc * p);
      ctx.lineTo(76 * sc, 0);
      ctx.lineTo(0, 4.5 * sc * p);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  ctx.restore();

  // 2A-0. Shattered Mirror Cathedral Atmospheric Prism Vignette & Corner Crystal Glints
  if (engine.isCursedChamber) {
    const pulse = 0.84 + Math.sin(engine.time * 3.0) * 0.16;
    ctx.save();
    const cursedVig = ctx.createRadialGradient(
      viewportW / 2,
      viewportH / 2,
      Math.min(viewportW, viewportH) * 0.28,
      viewportW / 2,
      viewportH / 2,
      Math.max(viewportW, viewportH) * 0.74
    );
    cursedVig.addColorStop(0, 'rgba(103, 232, 249, 0.01)');
    cursedVig.addColorStop(0.66, `rgba(126, 34, 206, ${0.11 * pulse})`);
    cursedVig.addColorStop(1, `rgba(15, 23, 56, ${0.42 * pulse})`);
    ctx.fillStyle = cursedVig;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // Subtle crystalline mirror crack glints at screen corners
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.22 * pulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 42);
    ctx.lineTo(36, 18);
    ctx.lineTo(74, 0);
    ctx.moveTo(viewportW, 48);
    ctx.lineTo(viewportW - 38, 22);
    ctx.lineTo(viewportW - 82, 0);
    ctx.stroke();
    ctx.restore();
  }

  // 2A. Eclipse Hourglass Time-Freeze Arcane Overlay!
  if (engine.eclipseFreezeTimer > 0) {
    const ep = Math.min(1, engine.eclipseFreezeTimer / 0.8);
    ctx.save();
    const timeVig = ctx.createRadialGradient(
      viewportW / 2,
      viewportH / 2,
      Math.min(viewportW, viewportH) * 0.2,
      viewportW / 2,
      viewportH / 2,
      Math.max(viewportW, viewportH) * 0.72
    );
    timeVig.addColorStop(0, `rgba(192, 132, 252, ${0.06 * ep})`);
    timeVig.addColorStop(0.65, `rgba(88, 28, 135, ${0.22 * ep})`);
    timeVig.addColorStop(1, `rgba(15, 5, 32, ${0.58 * ep})`);
    ctx.fillStyle = timeVig;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // Subtle spinning golden-violet eclipse clock ring around viewport center
    ctx.translate(viewportW / 2, viewportH / 2);
    ctx.strokeStyle = `rgba(216, 180, 254, ${0.26 * ep})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.rotate(engine.time * 0.45);
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(viewportW, viewportH) * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 2A-2. Minstrel Whip-Zip Tactical Slow-Motion Rose-Gold Vignette
  if (engine.player.minstrelZipActive) {
    ctx.save();
    const slowVig = ctx.createRadialGradient(
      viewportW / 2,
      viewportH / 2,
      Math.min(viewportW, viewportH) * 0.26,
      viewportW / 2,
      viewportH / 2,
      Math.max(viewportW, viewportH) * 0.72
    );
    slowVig.addColorStop(0, 'rgba(244, 114, 182, 0.03)');
    slowVig.addColorStop(0.7, 'rgba(190, 24, 93, 0.14)');
    slowVig.addColorStop(1, 'rgba(24, 6, 20, 0.44)');
    ctx.fillStyle = slowVig;
    ctx.fillRect(0, 0, viewportW, viewportH);
    ctx.restore();
  }

  // 2B. Screen-Space Impact Flash-Freeze & Anime Execution Impact Frame!
  if (engine.impactFrameTimer > 0) {
    const fp = Math.min(1, engine.impactFrameTimer / 0.085);
    ctx.save();
    // High-contrast dramatic crimson-noir flash border & anime radial focus lines!
    const focusVig = ctx.createRadialGradient(
      viewportW / 2,
      viewportH / 2,
      Math.min(viewportW, viewportH) * 0.18,
      viewportW / 2,
      viewportH / 2,
      Math.max(viewportW, viewportH) * 0.68
    );
    focusVig.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    focusVig.addColorStop(0.55, 'rgba(136, 19, 55, 0.28)');
    focusVig.addColorStop(1, 'rgba(7, 4, 10, 0.82)');
    ctx.fillStyle = focusVig;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // Crisp radial anime action focus lines around edges
    ctx.strokeStyle = engine.impactBurstColor;
    ctx.globalAlpha = fp * 0.55;
    ctx.lineWidth = 2;
    const cx = viewportW / 2;
    const cy = viewportH / 2;
    const maxR = Math.hypot(cx, cy);
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI * 2) / 20 + 0.13;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (maxR * 0.52), cy + Math.sin(a) * (maxR * 0.52));
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();
    }
    ctx.restore();
  }

  const flashMult = tuning.flashMult ?? 1;
  if (engine.screenFlashAlpha * flashMult > 0.005) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.68, engine.screenFlashAlpha * flashMult);
    ctx.fillStyle = engine.screenFlashColor;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // High-contrast dramatic rim framing during big flash-freezes
    if (engine.screenFlashAlpha > 0.22) {
      const vig = ctx.createRadialGradient(
        viewportW / 2,
        viewportH / 2,
        Math.min(viewportW, viewportH) * 0.25,
        viewportW / 2,
        viewportH / 2,
        Math.max(viewportW, viewportH) * 0.72
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(8,10,16,0.55)');
      ctx.globalAlpha = Math.min(0.7, engine.screenFlashAlpha * flashMult * 1.4);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, viewportW, viewportH);
    }
    ctx.restore();
  }

  if (engine.player.statusBlindTimer > 0) {
    ctx.save();
    const vig = ctx.createRadialGradient(
      viewportW / 2,
      viewportH / 2,
      Math.min(viewportW, viewportH) * 0.18,
      viewportW / 2,
      viewportH / 2,
      Math.max(viewportW, viewportH) * 0.62
    );
    vig.addColorStop(0, 'rgba(20, 12, 32, 0.05)');
    vig.addColorStop(1, 'rgba(8, 6, 16, 0.72)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, viewportW, viewportH);
    ctx.restore();
  }

  // 3. Smooth Room / Camp Transition Curtain Fade
  if (engine.transitionAlpha > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(7, 9, 15, ${Math.min(1, engine.transitionAlpha)})`;
    ctx.fillRect(0, 0, viewportW, viewportH);

    if (engine.transitionAlpha > 0.25 && engine.transitionLabel) {
      ctx.globalAlpha = Math.min(1, (engine.transitionAlpha - 0.25) / 0.6);
      ctx.textAlign = 'center';
      ctx.font = '700 22px "Cinzel", serif';
      ctx.fillStyle = '#e5a93c';
      ctx.fillText(engine.transitionLabel, viewportW / 2, viewportH / 2 - 8);
      if (engine.transitionSublabel) {
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(engine.transitionSublabel, viewportW / 2, viewportH / 2 + 18);
      }
    }
    ctx.restore();
  }

  // Tuning v2: "freeze until key" badge (small, top-center so screenshots stay clean)
  if (engine.killFreezeHold) {
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const label = 'FROZEN · press any key / tap to resume';
    const w = ctx.measureText(label).width + 18;
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'rgba(8,10,16,0.75)';
    ctx.fillRect(viewportW / 2 - w / 2, 8, w, 20);
    ctx.fillStyle = '#e5a93c';
    ctx.fillText(label, viewportW / 2, 22);
    ctx.restore();
  }
}

// ============================================================================
// DISTINCT PARALLAX LAYER PER ROOM (All 10 rooms have unmistakable identity!)
// ============================================================================
function drawRoomParallax(
  ctx: CanvasRenderingContext2D,
  stage: StageDef,
  camX: number,
  viewportW: number,
  viewportH: number,
  time: number
): void {
  const theme = stage.theme;
  const rn = stage.roomNumber;
  const env = stage.environment ?? 'castle';
  const isGoblin = env === 'goblin_camp';

  ctx.save();

  if (env === 'sand') {
    // SAND FORTRESS PARALLAX: Sweeping Rolling Dunes, Stepped Pyramids & Desert Sun / Night!
    const isNight = rn % 2 === 0 && !stage.isBigBossRoom;

    // Distant stepped pyramids & fortress silhouettes on the far horizon
    const farShift = -(camX * 0.06) % 520;
    ctx.fillStyle = isNight ? '#13132b' : '#7a3b14';
    for (let x = farShift - 520; x < viewportW + 520; x += 520) {
      // Great stepped desert pyramid
      ctx.beginPath();
      ctx.moveTo(x + 40, viewportH * 0.78);
      ctx.lineTo(x + 175, viewportH * 0.34);
      ctx.lineTo(x + 310, viewportH * 0.78);
      ctx.closePath();
      ctx.fill();
      // Sunlit / moonlit side highlight on pyramid face
      ctx.fillStyle = isNight ? 'rgba(186, 230, 253, 0.08)' : 'rgba(253, 224, 71, 0.16)';
      ctx.beginPath();
      ctx.moveTo(x + 175, viewportH * 0.34);
      ctx.lineTo(x + 215, viewportH * 0.78);
      ctx.lineTo(x + 310, viewportH * 0.78);
      ctx.closePath();
      ctx.fill();
      // Distant desert citadel domes & twin watch-minarets
      ctx.fillStyle = isNight ? '#13132b' : '#7a3b14';
      ctx.fillRect(x + 365, viewportH * 0.56, 90, viewportH * 0.32);
      ctx.beginPath();
      ctx.arc(x + 410, viewportH * 0.56, 36, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x + 352, viewportH * 0.44, 14, viewportH * 0.4);
      ctx.fillRect(x + 454, viewportH * 0.46, 14, viewportH * 0.38);
    }

    // Back rolling dune ridge
    const dune1Shift = -(camX * 0.11) % 460;
    ctx.fillStyle = isNight ? '#1b1736' : '#964b19';
    ctx.beginPath();
    ctx.moveTo(-460, viewportH);
    for (let x = dune1Shift - 460; x <= viewportW + 460; x += 460) {
      ctx.quadraticCurveTo(x + 115, viewportH * 0.54, x + 230, viewportH * 0.65);
      ctx.quadraticCurveTo(x + 345, viewportH * 0.74, x + 460, viewportH * 0.6);
    }
    ctx.lineTo(viewportW + 460, viewportH);
    ctx.closePath();
    ctx.fill();

    // Foreground sweeping sand dunes with bright sunlit / moonlit crest edges!
    const dune2Shift = -(camX * 0.18) % 380;
    ctx.fillStyle = theme.parallaxColor;
    ctx.beginPath();
    ctx.moveTo(-380, viewportH);
    for (let x = dune2Shift - 380; x <= viewportW + 380; x += 380) {
      ctx.quadraticCurveTo(x + 95, viewportH * 0.64, x + 195, viewportH * 0.74);
      ctx.quadraticCurveTo(x + 285, viewportH * 0.81, x + 380, viewportH * 0.68);
    }
    ctx.lineTo(viewportW + 380, viewportH);
    ctx.closePath();
    ctx.fill();

    // Rim highlight tracing the foreground dune crest
    ctx.strokeStyle = isNight ? 'rgba(186, 230, 253, 0.22)' : 'rgba(253, 224, 71, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = dune2Shift - 380; x <= viewportW + 380; x += 380) {
      if (x === dune2Shift - 380) {
        ctx.moveTo(x, viewportH * 0.68);
      }
      ctx.quadraticCurveTo(x + 95, viewportH * 0.64, x + 195, viewportH * 0.74);
      ctx.quadraticCurveTo(x + 285, viewportH * 0.81, x + 380, viewportH * 0.68);
    }
    ctx.stroke();

    // Blowing horizontal wind-swept desert sand dust wisps!
    ctx.strokeStyle = isNight ? 'rgba(203, 213, 225, 0.14)' : 'rgba(254, 240, 138, 0.24)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 16; i++) {
      const wx = ((i * 117 - time * (135 + (i % 4) * 30)) % (viewportW + 140) + (viewportW + 140)) % (viewportW + 140) - 70;
      const wy = viewportH * (0.28 + ((i * 37) % 62) / 100);
      const wlen = 28 + (i % 3) * 18;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + wlen, wy + 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'dwarven_mines') {
    // CORRUPTED DWARVEN MINES PARALLAX: Vaulted Subterranean Caverns, Giant Amethyst Crystal Spires & Distant Timber Derricks!
    const farShift = -(camX * 0.08) % 440;
    ctx.fillStyle = '#140d24';
    for (let x = farShift - 440; x < viewportW + 440; x += 440) {
      // Subterranean cavern stalactites hanging from ceiling
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, viewportH * 0.24);
      ctx.lineTo(x + 170, viewportH * 0.1);
      ctx.lineTo(x + 280, viewportH * 0.28);
      ctx.lineTo(x + 370, viewportH * 0.14);
      ctx.lineTo(x + 440, 0);
      ctx.closePath();
      ctx.fill();

      // Glowing giant amethyst geode spires rising in the background chasm
      const pulse = 0.22 + Math.sin(time * 2.2 + x * 0.01) * 0.08;
      ctx.fillStyle = `rgba(168, 85, 247, ${pulse})`;
      ctx.beginPath();
      ctx.moveTo(x + 120, viewportH);
      ctx.lineTo(x + 150, viewportH * 0.42);
      ctx.lineTo(x + 186, viewportH);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 295, viewportH);
      ctx.lineTo(x + 322, viewportH * 0.52);
      ctx.lineTo(x + 354, viewportH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#140d24';
    }

    // Mid-ground subterranean mine arches & timber hoisting towers
    const midShift = -(camX * 0.16) % 360;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = midShift - 360; x < viewportW + 360; x += 360) {
      ctx.fillRect(x + 40, viewportH * 0.3, 28, viewportH * 0.7);
      ctx.fillRect(x + 220, viewportH * 0.25, 34, viewportH * 0.75);
      // Warm dwarven forge lantern glow in distance
      ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.beginPath();
      ctx.arc(x + 237, viewportH * 0.46, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.parallaxColor;
    }

    // Drifting purple crystal dust motes
    ctx.fillStyle = 'rgba(216, 180, 254, 0.45)';
    for (let m = 0; m < 18; m++) {
      const mx = ((m * 137 - camX * 0.14 + time * 12) % (viewportW + 40) + viewportW + 40) % (viewportW + 40) - 20;
      const my = ((m * 89 + Math.sin(time * 1.4 + m) * 28) % viewportH + viewportH) % viewportH;
      ctx.fillRect(mx, my, 2.5, 2.5);
    }
    ctx.restore();
    return;
  }

  if (env === 'cyberpunk') {
    // NEON SPIRE 2099 PARALLAX: Towering Holographic Skyscrapers, Neon Billboards & Falling Neon Rain!
    const farShift = -(camX * 0.08) % 520;
    for (let x = farShift - 520; x < viewportW + 520; x += 520) {
      ctx.fillStyle = '#0c1026';
      ctx.fillRect(x + 20, viewportH * 0.14, 96, viewportH * 0.86);
      ctx.fillRect(x + 142, viewportH * 0.06, 128, viewportH * 0.94);
      ctx.fillRect(x + 296, viewportH * 0.2, 86, viewportH * 0.8);
      ctx.fillRect(x + 404, viewportH * 0.1, 102, viewportH * 0.9);
      // Glowing magenta & cyan hologram billboard strips
      ctx.fillStyle = 'rgba(236, 72, 153, 0.34)';
      ctx.fillRect(x + 162, viewportH * 0.18, 86, 18);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.36)';
      ctx.fillRect(x + 38, viewportH * 0.28, 56, 12);
      ctx.fillRect(x + 422, viewportH * 0.22, 66, 16);
      // Tiny window grids
      ctx.fillStyle = 'rgba(125, 211, 252, 0.24)';
      for (let wy = viewportH * 0.36; wy < viewportH * 0.82; wy += 24) {
        ctx.fillRect(x + 158, wy, 18, 6);
        ctx.fillRect(x + 190, wy, 18, 6);
        ctx.fillRect(x + 222, wy, 18, 6);
      }
    }
    // Sweeping vertical rain streaks
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.28)';
    ctx.lineWidth = 1.2;
    for (let r = 0; r < 42; r++) {
      const rx = ((r * 83 - camX * 0.22 - time * 110) % (viewportW + 40) + viewportW + 40) % (viewportW + 40) - 20;
      const ry = ((r * 67 + time * 420) % (viewportH + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 6, ry + 22);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'pirate') {
    // SKULLTIDE COVE & ARMADA PARALLAX: Tropical Sunset Sea, Distant Galleon Sails & Palm Silhouettes!
    const farShift = -(camX * 0.06) % 560;
    // Ocean horizon sheen
    ctx.fillStyle = 'rgba(14, 116, 144, 0.24)';
    ctx.fillRect(0, viewportH * 0.68, viewportW, viewportH * 0.32);
    for (let x = farShift - 560; x < viewportW + 560; x += 560) {
      // Distant pirate galleon silhouette on horizon
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(x + 70, viewportH * 0.72);
      ctx.lineTo(x + 190, viewportH * 0.72);
      ctx.lineTo(x + 172, viewportH * 0.78);
      ctx.lineTo(x + 88, viewportH * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x + 126, viewportH * 0.44, 5, viewportH * 0.28);
      // Billowing mainsail
      ctx.fillStyle = 'rgba(254, 243, 199, 0.22)';
      ctx.beginPath();
      ctx.moveTo(x + 131, viewportH * 0.47);
      ctx.quadraticCurveTo(x + 176, viewportH * 0.56, x + 131, viewportH * 0.68);
      ctx.closePath();
      ctx.fill();
      // Tropical island volcanic crag & palm silhouettes
      ctx.fillStyle = '#132036';
      ctx.beginPath();
      ctx.moveTo(x + 310, viewportH * 0.75);
      ctx.lineTo(x + 410, viewportH * 0.48);
      ctx.lineTo(x + 510, viewportH * 0.75);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (env === 'paradox') {
    // THE GHOST PARADOX PARALLAX: Floating Shattered Doors, Swirling Spectral Rift & Inverted Clocks!
    const farShift = -(camX * 0.08) % 460;
    for (let x = farShift - 460; x < viewportW + 460; x += 460) {
      const bob = Math.sin(time * 1.4 + x * 0.01) * 14;
      // Floating glowing dimensional doorway
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 90, viewportH * 0.22 + bob, 56, 108);
      ctx.fillStyle = 'rgba(45, 212, 191, 0.16)';
      ctx.fillRect(x + 94, viewportH * 0.22 + bob + 4, 48, 100);
      // Floating fractured clock dial
      ctx.strokeStyle = 'rgba(196, 181, 253, 0.34)';
      ctx.beginPath();
      ctx.arc(x + 320, viewportH * 0.32 - bob, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 320, viewportH * 0.32 - bob);
      ctx.lineTo(x + 320 + Math.cos(time * 0.8) * 30, viewportH * 0.32 - bob + Math.sin(time * 0.8) * 30);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'mirror_cathedral') {
    // SHATTERED MIRROR CATHEDRAL PARALLAX: Gothic Stained-Glass Rose Windows, Prism Light Beams & Drifting Mirror Shards!
    const farShift = -(camX * 0.08) % 440;
    for (let x = farShift - 440; x < viewportW + 440; x += 440) {
      // Diagonal cyan-magenta cathedral prism shafts
      ctx.fillStyle = 'rgba(103, 232, 249, 0.07)';
      ctx.beginPath();
      ctx.moveTo(x + 40, 0);
      ctx.lineTo(x + 125, 0);
      ctx.lineTo(x + 255, viewportH);
      ctx.lineTo(x + 145, viewportH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 114, 182, 0.055)';
      ctx.beginPath();
      ctx.moveTo(x + 210, 0);
      ctx.lineTo(x + 275, 0);
      ctx.lineTo(x + 390, viewportH);
      ctx.lineTo(x + 300, viewportH);
      ctx.closePath();
      ctx.fill();

      // Shattered Gothic Rose Window Silhouette
      const rx = x + 220;
      const ry = viewportH * 0.32;
      ctx.strokeStyle = 'rgba(165, 180, 252, 0.34)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rx, ry, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.24)';
      ctx.lineWidth = 1.4;
      for (let spoke = 0; spoke < 8; spoke++) {
        const a = (spoke * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(a) * 58, ry + Math.sin(a) * 58);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(244, 114, 182, 0.14)';
      ctx.beginPath();
      ctx.arc(rx, ry, 18, 0, Math.PI * 2);
      ctx.fill();

      // Slowly tumbling floating mirror glass shards
      const bob = Math.sin(time * 1.5 + x * 0.015) * 16;
      ctx.save();
      ctx.translate(x + 95, viewportH * 0.44 + bob);
      ctx.rotate(Math.sin(time * 0.7 + x) * 0.4);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.2)';
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(14, -4);
      ctx.lineTo(4, 22);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    return;
  }

  if (env === 'mansion') {
    // VELVET BLOOD CHATEAU PARALLAX: Tall Baroque Arched Windows, Draped Velvet Curtains & Chandelier Glow!
    const farShift = -(camX * 0.1) % 380;
    for (let x = farShift - 380; x < viewportW + 380; x += 380) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
      ctx.beginPath();
      ctx.arc(x + 190, viewportH * 0.34, 48, Math.PI, 0);
      ctx.lineTo(x + 238, viewportH * 0.72);
      ctx.lineTo(x + 142, viewportH * 0.72);
      ctx.closePath();
      ctx.fill();
      // Crimson drapery panels flanking window
      ctx.fillStyle = 'rgba(136, 19, 55, 0.42)';
      ctx.fillRect(x + 124, viewportH * 0.2, 26, viewportH * 0.56);
      ctx.fillRect(x + 230, viewportH * 0.2, 26, viewportH * 0.56);
    }
    ctx.restore();
    return;
  }

  if (env === 'underwater') {
    // SUNKEN PELAGIA PARALLAX: Shimmering Surface Caustic Light Shafts, Sunken Domes & Rising Bubbles!
    const farShift = -(camX * 0.07) % 480;
    for (let x = farShift - 480; x < viewportW + 480; x += 480) {
      // Diagonal sunlit ocean caustic shafts
      ctx.fillStyle = 'rgba(125, 211, 252, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x + 60, 0);
      ctx.lineTo(x + 150, 0);
      ctx.lineTo(x + 260, viewportH);
      ctx.lineTo(x + 140, viewportH);
      ctx.closePath();
      ctx.fill();
      // Distant sunken glass dome silhouette
      ctx.fillStyle = '#072a42';
      ctx.beginPath();
      ctx.arc(x + 340, viewportH * 0.72, 92, Math.PI, 0);
      ctx.lineTo(x + 432, viewportH);
      ctx.lineTo(x + 248, viewportH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Rising underwater bubbles
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
    ctx.lineWidth = 1.2;
    for (let b = 0; b < 24; b++) {
      const bx = ((b * 97 - camX * 0.14 + Math.sin(time * 2 + b) * 14) % (viewportW + 30) + viewportW + 30) % (viewportW + 30) - 15;
      const by = ((viewportH - ((b * 71 + time * 42) % (viewportH + 30))) + viewportH) % viewportH;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5 + (b % 3), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'frost') {
    // FROSTWARDEN CITADEL PARALLAX: Dancing Northern Aurora Ribbons, Glacier Peaks & Driving Snow!
    const auroraGrad = ctx.createLinearGradient(0, 0, viewportW, viewportH * 0.42);
    auroraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.18)');
    auroraGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.24)');
    auroraGrad.addColorStop(1, 'rgba(167, 139, 250, 0.16)');
    ctx.fillStyle = auroraGrad;
    ctx.beginPath();
    ctx.moveTo(0, viewportH * 0.18);
    for (let ax = 0; ax <= viewportW; ax += 80) {
      ctx.lineTo(ax, viewportH * 0.16 + Math.sin(ax * 0.008 + time * 0.9) * 34);
    }
    ctx.lineTo(viewportW, viewportH * 0.36);
    ctx.lineTo(0, viewportH * 0.36);
    ctx.closePath();
    ctx.fill();
    const farShift = -(camX * 0.08) % 440;
    ctx.fillStyle = '#0d2642';
    for (let x = farShift - 440; x < viewportW + 440; x += 440) {
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.lineTo(x + 110, viewportH * 0.32);
      ctx.lineTo(x + 215, viewportH * 0.58);
      ctx.lineTo(x + 325, viewportH * 0.24);
      ctx.lineTo(x + 440, viewportH);
      ctx.closePath();
      ctx.fill();
    }
    // Falling snow flurries
    ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
    for (let s = 0; s < 36; s++) {
      const sx = ((s * 91 - camX * 0.2 - time * 55) % (viewportW + 30) + viewportW + 30) % (viewportW + 30) - 15;
      const sy = ((s * 59 + time * 95) % (viewportH + 30)) - 15;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8 + (s % 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (env === 'barbaric') {
    // IRONHORN BLOODLANDS PARALLAX: Red-Sky Steppe Mesas, Giant Mammoth-Tusk Gates & Rising War-Embers!
    const farShift = -(camX * 0.08) % 480;
    ctx.fillStyle = '#29120d';
    for (let x = farShift - 480; x < viewportW + 480; x += 480) {
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.lineTo(x + 80, viewportH * 0.48);
      ctx.lineTo(x + 230, viewportH * 0.45);
      ctx.lineTo(x + 310, viewportH * 0.68);
      ctx.lineTo(x + 410, viewportH * 0.5);
      ctx.lineTo(x + 480, viewportH);
      ctx.closePath();
      ctx.fill();
      // Colossal curved mammoth tusk silhouette
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.22)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x + 155, viewportH * 0.76);
      ctx.quadraticCurveTo(x + 125, viewportH * 0.56, x + 175, viewportH * 0.44);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(249, 115, 22, 0.65)';
    for (let e = 0; e < 24; e++) {
      const ex = ((e * 113 - camX * 0.16 + time * 26) % (viewportW + 40) + viewportW + 40) % (viewportW + 40) - 20;
      const ey = ((viewportH - ((e * 73 + time * 68) % viewportH)) + viewportH) % viewportH;
      ctx.fillRect(ex, ey, 2.5, 2.5);
    }
    ctx.restore();
    return;
  }

  if (env === 'dragon') {
    // DRAGON CRANE PARALLAX: Misty Mountain Karst Crags, Cliffside Pagodas, Clouds & Soaring Cranes!
    const farShift = -(camX * 0.07) % 480;
    ctx.fillStyle = rn % 2 === 1 ? '#0c2c30' : '#261730';
    for (let x = farShift - 480; x < viewportW + 480; x += 480) {
      // Dramatic steep Chinese ink-painting karst mountain spires
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.lineTo(x + 70, viewportH * 0.28);
      ctx.lineTo(x + 145, viewportH * 0.56);
      ctx.lineTo(x + 250, viewportH * 0.18);
      ctx.lineTo(x + 345, viewportH * 0.52);
      ctx.lineTo(x + 425, viewportH * 0.34);
      ctx.lineTo(x + 480, viewportH);
      ctx.closePath();
      ctx.fill();

      // Silhouetted multi-tier cliffside pagoda perched atop the tall summit!
      const px = x + 250;
      const py = viewportH * 0.18;
      ctx.fillStyle = rn % 2 === 1 ? '#082024' : '#1b0f24';
      ctx.fillRect(px - 14, py - 34, 28, 38);
      for (let tier = 0; tier < 3; tier++) {
        const ty = py - 8 - tier * 13;
        const tw = 26 - tier * 5;
        ctx.beginPath();
        ctx.moveTo(px - tw - 5, ty + 3);
        ctx.quadraticCurveTo(px - tw * 0.4, ty + 2, px, ty - 7);
        ctx.quadraticCurveTo(px + tw * 0.4, ty + 2, px + tw + 5, ty + 3);
        ctx.lineTo(px + tw - 4, ty + 6);
        ctx.lineTo(px - tw + 4, ty + 6);
        ctx.closePath();
        ctx.fill();
      }
      // Golden pagoda spire tip
      ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.fillRect(px - 1.5, py - 52, 3, 12);
      ctx.fillStyle = rn % 2 === 1 ? '#0c2c30' : '#261730';
    }

    // Drifting luminous mountain mist / scroll-cloud bank
    const mistShift = (time * 10 - camX * 0.1) % (viewportW + 340);
    const mistGrad = ctx.createLinearGradient(0, viewportH * 0.46, 0, viewportH * 0.84);
    mistGrad.addColorStop(0, 'rgba(167, 243, 208, 0)');
    mistGrad.addColorStop(0.5, rn % 2 === 1 ? 'rgba(52, 211, 153, 0.14)' : 'rgba(251, 191, 36, 0.11)');
    mistGrad.addColorStop(1, 'rgba(167, 243, 208, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, viewportH * 0.46, viewportW, viewportH * 0.38);

    ctx.fillStyle = 'rgba(209, 250, 229, 0.09)';
    for (let c = 0; c < 5; c++) {
      const cx = ((mistShift + c * 280) % (viewportW + 340)) - 170;
      const cy = viewportH * (0.34 + (c % 3) * 0.13);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 110, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mid-ground craggy mountain cliffs & pine ridges
    const midShift = -(camX * 0.15) % 380;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = midShift - 380; x < viewportW + 380; x += 380) {
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.lineTo(x + 85, viewportH * 0.56);
      ctx.lineTo(x + 190, viewportH * 0.68);
      ctx.lineTo(x + 295, viewportH * 0.48);
      ctx.lineTo(x + 380, viewportH);
      ctx.closePath();
      ctx.fill();
    }

    // Animated Soaring Mountain Cranes gliding across the misty peaks!
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.72)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const bx = ((i * 230 + time * (28 + i * 5)) % (viewportW + 120)) - 60;
      const by = viewportH * (0.18 + (i % 3) * 0.11) + Math.sin(time * 1.4 + i * 2) * 14;
      const flap = Math.sin(time * 4.5 + i * 1.9) * 7;
      ctx.beginPath();
      ctx.moveTo(bx - 16, by - flap);
      ctx.quadraticCurveTo(bx - 6, by - 5 - flap * 0.3, bx, by);
      ctx.quadraticCurveTo(bx + 6, by - 5 - flap * 0.3, bx + 16, by - flap);
      ctx.stroke();
    }

    // Drifting floating wind petals & glowing embers
    for (let i = 0; i < 16; i++) {
      const px = ((i * 93 + time * 32) % (viewportW + 60)) - 30;
      const py = ((i * 61 + Math.sin(time * 1.8 + i) * 24 + time * 10) % (viewportH * 0.85));
      ctx.fillStyle = i % 2 === 0 ? 'rgba(52, 211, 153, 0.52)' : 'rgba(251, 191, 36, 0.5)';
      ctx.beginPath();
      ctx.ellipse(px, py, 3.5, 1.8, time + i, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (env === 'mushroom') {
    // MUSHROOM KINGDOM PARALLAX: Colossal Bioluminescent Toadstool Canopy Forest & Drifting Spores!
    const farShift = -(camX * 0.1) % 360;
    for (let x = farShift - 360; x < viewportW + 360; x += 360) {
      const capY = viewportH * 0.44 + ((Math.abs(Math.floor(x)) * 13) % 70);
      // Giant silhouette stalk
      ctx.fillStyle = theme.parallaxColor;
      ctx.fillRect(x + 145, capY, 44, viewportH - capY);
      // Enormous fungal umbrella dome
      ctx.beginPath();
      ctx.ellipse(x + 167, capY + 8, 125, 58, 0, Math.PI, 0);
      ctx.fill();
      // Bioluminescent glowing spots on distant canopy dome
      ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.beginPath();
      ctx.arc(x + 118, capY - 22, 11, 0, Math.PI * 2);
      ctx.arc(x + 178, capY - 34, 14, 0, Math.PI * 2);
      ctx.arc(x + 225, capY - 16, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Floating luminous fungal spores rising through the air
    for (let i = 0; i < 22; i++) {
      const cycle = (time * 0.14 + i * 0.19) % 1;
      const sx = ((i * 89 + Math.sin(time * 1.1 + i * 1.6) * 32) % viewportW + viewportW) % viewportW;
      const sy = viewportH * (0.98 - cycle * 0.85);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(52, 211, 153, ${(1 - cycle) * 0.65})`
        : `rgba(232, 121, 249, ${(1 - cycle) * 0.58})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (env === 'alien') {
    // ALIEN SHIP PARALLAX: Deep Cosmic Starfield, Glowing Nebula Clouds & Hull Observation Girders!
    for (let i = 0; i < 55; i++) {
      const sx = ((i * 101 - camX * 0.03) % viewportW + viewportW) % viewportW;
      const sy = (i * 67 + 13) % (viewportH * 0.82);
      const tw = 0.3 + Math.sin(time * 3 + i * 1.3) * 0.45;
      ctx.fillStyle = i % 4 === 0 ? `rgba(103, 232, 249, ${tw})` : `rgba(226, 232, 240, ${tw})`;
      ctx.fillRect(sx, sy, i % 5 === 0 ? 2.5 : 1.5, i % 5 === 0 ? 2.5 : 1.5);
    }
    // Swirling cosmic nebula wash
    const neb = ctx.createRadialGradient(
      viewportW * 0.32,
      viewportH * 0.36,
      20,
      viewportW * 0.32,
      viewportH * 0.36,
      viewportW * 0.42
    );
    neb.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    neb.addColorStop(0.5, 'rgba(168, 85, 247, 0.12)');
    neb.addColorStop(1, 'rgba(2, 6, 23, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // Distant angled starship superstructure beams
    const ribShift = -(camX * 0.14) % 340;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.72)';
    ctx.lineWidth = 14;
    for (let x = ribShift - 340; x < viewportW + 340; x += 340) {
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.lineTo(x + 95, viewportH * 0.12);
      ctx.lineTo(x + 190, viewportH);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'cemetery') {
    // WEEPING NECROPOLIS PARALLAX: Graveyard Headstones, Mausoleum Spires & Spectral Soul Wisps
    const hillShift = -(camX * 0.1) % 380;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = hillShift - 380; x < viewportW + 380; x += 380) {
      // Rolling graveyard knoll
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.quadraticCurveTo(x + 190, viewportH * 0.56, x + 380, viewportH);
      ctx.closePath();
      ctx.fill();
      // Silhouetted crosses & mausoleum spires
      ctx.fillRect(x + 86, viewportH * 0.44, 8, 92);
      ctx.fillRect(x + 68, viewportH * 0.48, 44, 8);
      ctx.fillRect(x + 250, viewportH * 0.5, 58, viewportH * 0.5);
      ctx.beginPath();
      ctx.moveTo(x + 242, viewportH * 0.5);
      ctx.lineTo(x + 279, viewportH * 0.34);
      ctx.lineTo(x + 316, viewportH * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    // Spectral floating violet-teal soul wisps
    for (let i = 0; i < 16; i++) {
      const cycle = (time * 0.18 + i * 0.21) % 1;
      const wx = ((i * 107 + Math.sin(time * 1.2 + i) * 34) % viewportW + viewportW) % viewportW;
      const wy = viewportH * (0.95 - cycle * 0.72);
      ctx.fillStyle = i % 2 === 0
        ? `rgba(192, 132, 252, ${(1 - cycle) * 0.55})`
        : `rgba(94, 234, 212, ${(1 - cycle) * 0.5})`;
      ctx.beginPath();
      ctx.arc(wx, wy, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (rn === 5) {
      // Giant Necromantic Runic Circle behind Vespera's Mausoleum
      const cx = viewportW * 0.5;
      const cy = viewportH * 0.34;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.38)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 108, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 74, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'foundry') {
    // BRIMSTONE SANCTUM PARALLAX: Volcanic Basalt Peaks, Glowing Lava Falls & Rising Ash Sparks
    const peakShift = -(camX * 0.12) % 420;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = peakShift - 420; x < viewportW + 420; x += 420) {
      ctx.beginPath();
      ctx.moveTo(x, viewportH);
      ctx.lineTo(x + 95, viewportH * 0.36);
      ctx.lineTo(x + 215, viewportH * 0.58);
      ctx.lineTo(x + 335, viewportH * 0.28);
      ctx.lineTo(x + 420, viewportH);
      ctx.closePath();
      ctx.fill();

      // Molten lava cascade strip glowing down volcanic crag
      const lx = x + 332;
      const lavaG = ctx.createLinearGradient(lx, viewportH * 0.36, lx, viewportH);
      lavaG.addColorStop(0, 'rgba(251, 146, 60, 0.42)');
      lavaG.addColorStop(1, 'rgba(220, 38, 38, 0.12)');
      ctx.fillStyle = lavaG;
      ctx.fillRect(lx - 8, viewportH * 0.36, 16, viewportH * 0.64);
      ctx.fillStyle = theme.parallaxColor;
    }
    const magmaMist = ctx.createLinearGradient(0, viewportH * 0.66, 0, viewportH);
    magmaMist.addColorStop(0, 'rgba(249, 115, 22, 0)');
    magmaMist.addColorStop(1, 'rgba(234, 88, 12, 0.26)');
    ctx.fillStyle = magmaMist;
    ctx.fillRect(0, viewportH * 0.66, viewportW, viewportH * 0.34);

    for (let i = 0; i < 20; i++) {
      const cycle = (time * 0.28 + i * 0.15) % 1;
      const ex = ((i * 79 + Math.sin(time * 2 + i) * 28) % viewportW + viewportW) % viewportW;
      const ey = viewportH * (1 - cycle * 0.92);
      ctx.fillStyle = `rgba(253, 186, 116, ${(1 - cycle) * 0.72})`;
      ctx.fillRect(ex, ey, 3, 3);
    }
    ctx.restore();
    return;
  }

  if (env === 'eclipse') {
    // ECLIPSE CITADEL PARALLAX: Giant Black Solar Eclipse w/ Blazing Crimson Corona & Floating Obsidian Spires
    const cx = viewportW * 0.5;
    const cy = viewportH * 0.26;
    const corona = ctx.createRadialGradient(cx, cy, 48, cx, cy, 175);
    corona.addColorStop(0, 'rgba(255, 46, 99, 0.65)');
    corona.addColorStop(0.45, 'rgba(190, 18, 60, 0.24)');
    corona.addColorStop(1, 'rgba(190, 18, 60, 0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, 175, 0, Math.PI * 2);
    ctx.fill();

    // Black eclipsed core
    ctx.fillStyle = '#07030a';
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff2e63';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const spireShift = -(camX * 0.14) % 340;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = spireShift - 340; x < viewportW + 340; x += 340) {
      ctx.fillRect(x + 50, viewportH * 0.42, 46, viewportH * 0.58);
      ctx.beginPath();
      ctx.moveTo(x + 42, viewportH * 0.42);
      ctx.lineTo(x + 73, viewportH * 0.22);
      ctx.lineTo(x + 104, viewportH * 0.42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (isGoblin) {
    if (rn === 1) {
      // GOBLIN ROOM 1: Open Moonlit Evergreen Pine Mountains & Drifting Fireflies
      const farShift = -(camX * 0.08) % 420;
      ctx.fillStyle = '#0c1f15';
      for (let x = farShift - 420; x < viewportW + 420; x += 420) {
        ctx.beginPath();
        ctx.moveTo(x, viewportH);
        ctx.lineTo(x + 120, viewportH * 0.42);
        ctx.lineTo(x + 250, viewportH * 0.58);
        ctx.lineTo(x + 340, viewportH * 0.34);
        ctx.lineTo(x + 420, viewportH);
        ctx.closePath();
        ctx.fill();
      }
      // Mid-ground pine trees
      const pineShift = -(camX * 0.16) % 130;
      ctx.fillStyle = theme.parallaxColor;
      for (let x = pineShift - 130; x < viewportW + 130; x += 130) {
        const h = 150 + ((Math.abs(Math.floor(x)) * 17) % 60);
        ctx.beginPath();
        ctx.moveTo(x + 40, viewportH - h);
        ctx.lineTo(x - 12, viewportH);
        ctx.lineTo(x + 92, viewportH);
        ctx.closePath();
        ctx.fill();
      }
      // Glowing forest fireflies
      for (let i = 0; i < 14; i++) {
        const fx = ((i * 113 + time * 16) % (viewportW + 80)) - 40;
        const fy = viewportH * 0.35 + Math.sin(time * 1.4 + i * 2.1) * 90 + (i % 4) * 38;
        ctx.fillStyle = `rgba(163, 230, 53, ${0.3 + Math.sin(time * 3 + i) * 0.25})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (rn === 2) {
      // GOBLIN ROOM 2: Sapper Powder Quarry — Wooden Mine Derricks & Glowing Coal Furnaces
      const shift = -(camX * 0.14) % 340;
      ctx.fillStyle = theme.parallaxColor;
      for (let x = shift - 340; x < viewportW + 340; x += 340) {
        // Mine shaft scaffolding towers
        ctx.fillRect(x + 40, viewportH * 0.28, 12, viewportH * 0.72);
        ctx.fillRect(x + 128, viewportH * 0.28, 12, viewportH * 0.72);
        ctx.fillRect(x + 30, viewportH * 0.28, 120, 10);
        // Cross-braces
        ctx.strokeStyle = theme.parallaxColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x + 46, viewportH * 0.32);
        ctx.lineTo(x + 134, viewportH * 0.56);
        ctx.moveTo(x + 134, viewportH * 0.32);
        ctx.lineTo(x + 46, viewportH * 0.56);
        ctx.stroke();
        // Distant glowing furnace dome
        const glow = ctx.createRadialGradient(x + 250, viewportH * 0.78, 8, x + 250, viewportH * 0.78, 95);
        glow.addColorStop(0, 'rgba(249, 115, 22, 0.36)');
        glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x + 250, viewportH * 0.78, 95, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.parallaxColor;
      }
      // Rising glowing quarry embers
      for (let i = 0; i < 16; i++) {
        const cycle = (time * 0.24 + i * 0.19) % 1;
        const ex = ((i * 97 + Math.sin(time + i) * 28) % viewportW + viewportW) % viewportW;
        const ey = viewportH * (1 - cycle * 0.85);
        ctx.fillStyle = `rgba(251, 146, 60, ${(1 - cycle) * 0.65})`;
        ctx.fillRect(ex, ey, 3, 3);
      }
    } else if (rn === 3) {
      // GOBLIN ROOM 3: Totem Bog Hollow — Gnarled Swamp Willows & Bioluminescent Mist
      const shift = -(camX * 0.12) % 300;
      ctx.fillStyle = theme.parallaxColor;
      for (let x = shift - 300; x < viewportW + 300; x += 300) {
        // Twisted swamp willow trunk + hanging vines
        ctx.fillRect(x + 90, viewportH * 0.24, 22, viewportH * 0.76);
        ctx.beginPath();
        ctx.arc(x + 100, viewportH * 0.26, 78, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#0e3630';
        ctx.lineWidth = 3;
        for (let v = -60; v <= 60; v += 24) {
          const sway = Math.sin(time * 1.4 + v) * 8;
          ctx.beginPath();
          ctx.moveTo(x + 100 + v, viewportH * 0.26);
          ctx.quadraticCurveTo(x + 100 + v + sway, viewportH * 0.5, x + 100 + v + sway * 1.4, viewportH * 0.7);
          ctx.stroke();
        }
      }
      // Glowing emerald bog fog layer at bottom
      const fog = ctx.createLinearGradient(0, viewportH * 0.68, 0, viewportH);
      fog.addColorStop(0, 'rgba(16, 185, 129, 0)');
      fog.addColorStop(1, 'rgba(16, 185, 129, 0.24)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, viewportH * 0.68, viewportW, viewportH * 0.32);
    } else if (rn === 4) {
      // GOBLIN ROOM 4: War-Beast Palisade — Spiked War-Fortress Walls & Storm Clouds
      const shift = -(camX * 0.14) % 320;
      ctx.fillStyle = theme.parallaxColor;
      for (let x = shift - 320; x < viewportW + 320; x += 320) {
        // Giant sharpened palisade spikes silhouette
        for (let s = 0; s < 8; s++) {
          const sx = x + s * 40;
          const topY = viewportH * (0.42 + (s % 2) * 0.05);
          ctx.beginPath();
          ctx.moveTo(sx, viewportH);
          ctx.lineTo(sx, topY + 24);
          ctx.lineTo(sx + 18, topY);
          ctx.lineTo(sx + 36, topY + 24);
          ctx.lineTo(sx + 36, viewportH);
          ctx.closePath();
          ctx.fill();
        }
        // Distant orange bonfire glow
        const fireG = ctx.createRadialGradient(x + 160, viewportH * 0.72, 10, x + 160, viewportH * 0.72, 110);
        fireG.addColorStop(0, 'rgba(234, 88, 12, 0.34)');
        fireG.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = fireG;
        ctx.beginPath();
        ctx.arc(x + 160, viewportH * 0.72, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.parallaxColor;
      }
    } else {
      // GOBLIN ROOM 5: Warchief's Bone Throne — Huge Tribal War-Standards & Ember Sky
      const cx = viewportW * 0.5;
      const pyre = ctx.createRadialGradient(cx, viewportH * 0.65, 20, cx, viewportH * 0.65, viewportW * 0.45);
      pyre.addColorStop(0, 'rgba(249, 115, 22, 0.32)');
      pyre.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = pyre;
      ctx.fillRect(0, 0, viewportW, viewportH);

      ctx.fillStyle = theme.parallaxColor;
      for (const side of [-1, 1]) {
        const bx = cx + side * (viewportW * 0.34);
        ctx.fillRect(bx - 10, viewportH * 0.22, 20, viewportH * 0.78);
        ctx.beginPath();
        ctx.moveTo(bx - 55, viewportH * 0.26);
        ctx.lineTo(bx + 55, viewportH * 0.26);
        ctx.lineTo(bx, viewportH * 0.48);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // NOCTURNE CASTLE PARALLAX (5 Completely Distinct Architectural Wings!)
  // =========================================================================
  if (rn === 1) {
    // ROOM 1: Outer Courtyard — Starry Open Sky, Drifting Moonlight Clouds & Distant Castle Keep
    ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
    for (let i = 0; i < 32; i++) {
      const sx = (i * 89 + 41) % viewportW;
      const sy = (i * 53 + 17) % (viewportH * 0.42);
      const twinkle = 0.45 + Math.sin(time * 2.5 + i) * 0.4;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2.5 : 1.5, i % 3 === 0 ? 2.5 : 1.5);
    }
    ctx.globalAlpha = 1;

    // Slow drifting mist clouds across the moon
    const cloudShift = (time * 8 - camX * 0.04) % (viewportW + 300);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
    for (let c = 0; c < 4; c++) {
      const cx = ((cloudShift + c * 310) % (viewportW + 300)) - 150;
      const cy = viewportH * (0.16 + (c % 2) * 0.12);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 130, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant silhouette of Nocturne Castle spires across the courtyard valley
    const offset = -(camX * 0.12) % 460;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = offset - 460; x < viewportW + 460; x += 460) {
      ctx.fillRect(x + 60, viewportH * 0.44, 70, viewportH * 0.56);
      ctx.beginPath();
      ctx.moveTo(x + 52, viewportH * 0.44);
      ctx.lineTo(x + 95, viewportH * 0.24);
      ctx.lineTo(x + 138, viewportH * 0.44);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x + 130, viewportH * 0.62, 330, viewportH * 0.38);
      for (let m = 0; m < 7; m++) {
        ctx.fillRect(x + 140 + m * 44, viewportH * 0.59, 20, 18);
      }
    }
  } else if (rn === 2) {
    // ROOM 2: Clockwork Belfry — GIANT SLOWLY ROTATING BRASS GEARS!
    const gearShift = -(camX * 0.16) % 440;
    for (let x = gearShift - 440; x < viewportW + 440; x += 440) {
      drawClockworkGear(ctx, x + 120, viewportH * 0.36, 98, 12, time * 0.28, 'rgba(120, 82, 36, 0.34)');
      drawClockworkGear(ctx, x + 285, viewportH * 0.58, 66, 9, -time * 0.42, 'rgba(180, 118, 42, 0.28)');
      drawClockworkGear(ctx, x + 375, viewportH * 0.26, 52, 8, time * 0.55, 'rgba(146, 95, 38, 0.26)');
    }
    // Warm amber diagonal tower light beams
    ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
    for (let b = 0; b < 3; b++) {
      const bx = viewportW * (0.2 + b * 0.32);
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + 90, 0);
      ctx.lineTo(bx - 60, viewportH);
      ctx.lineTo(bx - 160, viewportH);
      ctx.closePath();
      ctx.fill();
    }
  } else if (rn === 3) {
    // ROOM 3: Hanging Nave — Stained-Glass Rose Medallions & Slanted Sapphire/Violet Light Shafts!
    const navShift = -(camX * 0.14) % 360;
    for (let x = navShift - 360; x < viewportW + 360; x += 360) {
      const rx = x + 180;
      const ry = viewportH * 0.34;
      // Glowing stained-glass rose window
      const roseGlow = ctx.createRadialGradient(rx, ry, 10, rx, ry, 86);
      roseGlow.addColorStop(0, 'rgba(192, 132, 252, 0.34)');
      roseGlow.addColorStop(0.55, 'rgba(96, 165, 250, 0.2)');
      roseGlow.addColorStop(1, 'rgba(96, 165, 250, 0)');
      ctx.fillStyle = roseGlow;
      ctx.beginPath();
      ctx.arc(rx, ry, 86, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rx, ry, 52, 0, Math.PI * 2);
      ctx.stroke();

      // Slanted cathedral light beam
      ctx.fillStyle = 'rgba(167, 139, 250, 0.065)';
      ctx.beginPath();
      ctx.moveTo(rx - 36, ry + 10);
      ctx.lineTo(rx + 36, ry + 10);
      ctx.lineTo(rx - 90, viewportH);
      ctx.lineTo(rx - 190, viewportH);
      ctx.closePath();
      ctx.fill();
    }
  } else if (rn === 4) {
    // ROOM 4: Crimson Sanctum — Blood-Red Catacomb Vaults & Rising Scarlet Embers
    const shift = -(camX * 0.14) % 300;
    ctx.fillStyle = theme.parallaxColor;
    for (let x = shift - 300; x < viewportW + 300; x += 300) {
      ctx.fillRect(x, viewportH * 0.18, 44, viewportH * 0.82);
      const glow = ctx.createRadialGradient(x + 170, viewportH * 0.65, 8, x + 170, viewportH * 0.65, 105);
      glow.addColorStop(0, 'rgba(225, 29, 72, 0.25)');
      glow.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x + 170, viewportH * 0.65, 105, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.parallaxColor;
    }
    for (let i = 0; i < 16; i++) {
      const cycle = (time * 0.22 + i * 0.17) % 1;
      const ex = ((i * 83 + Math.sin(time * 1.4 + i) * 24) % viewportW + viewportW) % viewportW;
      const ey = viewportH * (1 - cycle * 0.9);
      ctx.fillStyle = `rgba(251, 113, 133, ${(1 - cycle) * 0.6})`;
      ctx.fillRect(ex, ey, 2.8, 2.8);
    }
  } else {
    // ROOM 5: Throne of Nocturne — Colossal Blood-Moon Rose Oculus centered in the Throne Hall!
    const cx = viewportW * 0.5;
    const cy = viewportH * 0.3;
    ctx.strokeStyle = 'rgba(255, 77, 109, 0.36)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 112, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let a = 0; a < 12; a++) {
      const ang = (a * Math.PI) / 6 + time * 0.04;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * 112, cy + Math.sin(ang) * 112);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawClockworkGear(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  teeth: number,
  angle: number,
  color: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // Outer toothed rim
  ctx.lineWidth = Math.max(8, radius * 0.16);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < teeth; i++) {
    const a = (i * Math.PI * 2) / teeth;
    ctx.save();
    ctx.rotate(a);
    ctx.fillRect(radius * 0.86, -radius * 0.09, radius * 0.18, radius * 0.18);
    ctx.restore();
  }

  // Inner spokes & hub
  ctx.lineWidth = Math.max(4, radius * 0.08);
  for (let s = 0; s < 4; s++) {
    const a = (s * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8);
    ctx.lineTo(-Math.cos(a) * radius * 0.8, -Math.sin(a) * radius * 0.8);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================================================
// DISTINCT WORLD-SPACE ARCHITECTURE PER ROOM
// ============================================================================
function drawRoomArchitecture(
  ctx: CanvasRenderingContext2D,
  stage: StageDef,
  time: number
): void {
  const { worldWidth: worldW, worldHeight: worldH, floorY, theme, roomNumber: rn } = stage;
  const env = stage.environment ?? 'castle';
  const isGoblin = env === 'goblin_camp';

  ctx.save();

  // Subterranean Secret Cavern Backdrop whenever room has an Underground Secret Passage!
  if (worldH > floorY + 110) {
    const ugGrad = ctx.createLinearGradient(0, floorY, 0, worldH);
    ugGrad.addColorStop(0, '#090b12');
    ugGrad.addColorStop(0.5, '#111626');
    ugGrad.addColorStop(1, '#070910');
    ctx.fillStyle = ugGrad;
    ctx.fillRect(0, floorY, worldW, worldH - floorY);
    // Vaulted underground stone arches & glowing crystal veins
    for (let ux = 160; ux < worldW - 120; ux += 240) {
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(ux, floorY + 120, 92, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.beginPath();
      ctx.arc(ux, floorY + 75, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (env === 'mushroom') {
    // The Mushroom Kingdom: Giant Bioluminescent Fungal Stalks, Glowing Spotted Caps & Shelf Fungi!
    for (let x = 110; x < worldW; x += 260) {
      const capH = 220 + ((x * 37) % 160);
      // Curved striated fungal stalk
      ctx.fillStyle = 'rgba(38, 33, 68, 0.78)';
      ctx.fillRect(x - 16, floorY - capH, 32, capH);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.12)';
      ctx.fillRect(x - 8, floorY - capH, 6, capH);
      // Glowing gill underside
      ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x, floorY - capH + 4, 86, 14, 0, 0, Math.PI);
      ctx.fill();
      // Giant purple/magenta umbrella cap
      ctx.fillStyle = 'rgba(109, 40, 217, 0.65)';
      ctx.beginPath();
      ctx.ellipse(x, floorY - capH, 96, 46, 0, Math.PI, 0);
      ctx.fill();
      // Glowing bioluminescent spots
      ctx.fillStyle = 'rgba(52, 211, 153, 0.55)';
      ctx.beginPath();
      ctx.arc(x - 34, floorY - capH - 18, 9, 0, Math.PI * 2);
      ctx.arc(x + 22, floorY - capH - 25, 11, 0, Math.PI * 2);
      ctx.arc(x + 54, floorY - capH - 12, 7, 0, Math.PI * 2);
      ctx.fill();
      // Small side shelf-fungi on stalk
      ctx.fillStyle = 'rgba(192, 132, 252, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + 20, floorY - capH * 0.45, 22, 8, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (env === 'sand') {
    // Sand Fortress: Carved Sandstone Obelisks, Lotus Columns, Desert Archways, Sand Mounds & Banners!
    const isNight = rn % 2 === 0 && !stage.isBigBossRoom;
    for (let x = 110; x < worldW; x += 290) {
      // Sculpted desert sand drift mound banked along base
      ctx.fillStyle = isNight ? 'rgba(72, 54, 62, 0.48)' : 'rgba(180, 105, 36, 0.44)';
      ctx.beginPath();
      ctx.moveTo(x - 75, floorY);
      ctx.quadraticCurveTo(x + 20, floorY - 52, x + 135, floorY);
      ctx.closePath();
      ctx.fill();

      // Tapered sandstone temple column with lotus capital
      ctx.fillStyle = isNight ? 'rgba(66, 52, 78, 0.72)' : 'rgba(138, 72, 24, 0.65)';
      ctx.beginPath();
      ctx.moveTo(x - 4, floorY);
      ctx.lineTo(x + 4, 185);
      ctx.lineTo(x + 42, 185);
      ctx.lineTo(x + 50, floorY);
      ctx.closePath();
      ctx.fill();
      // Flared lotus capital & gilded collar
      ctx.fillStyle = isNight ? 'rgba(148, 163, 184, 0.35)' : 'rgba(217, 119, 6, 0.72)';
      ctx.beginPath();
      ctx.moveTo(x - 10, 162);
      ctx.lineTo(x + 56, 162);
      ctx.lineTo(x + 44, 192);
      ctx.lineTo(x + 2, 192);
      ctx.closePath();
      ctx.fill();
      // Carved hieroglyphic bars down column
      ctx.fillStyle = isNight ? 'rgba(186, 230, 253, 0.24)' : 'rgba(253, 224, 71, 0.3)';
      for (let gy = 220; gy < floorY - 50; gy += 42) {
        ctx.fillRect(x + 11, gy, 24, 4);
        ctx.fillRect(x + 16, gy + 9, 14, 3);
      }

      // Fluttering crimson & gold desert wind banner between columns
      const bx = x + 150;
      const flutter = Math.sin(time * 2.8 + x * 0.015) * 8;
      ctx.fillStyle = isNight ? 'rgba(99, 102, 241, 0.42)' : 'rgba(185, 28, 28, 0.55)';
      ctx.beginPath();
      ctx.moveTo(bx - 16, 250);
      ctx.lineTo(bx + 16, 250);
      ctx.lineTo(bx + 16 + flutter, 430);
      ctx.lineTo(bx + flutter, 458);
      ctx.lineTo(bx - 16 + flutter, 430);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Diagonal scorching desert sunbeams (day) or glowing desert oasis lanterns (night)
      if (!isNight) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.065)';
        ctx.beginPath();
        ctx.moveTo(x + 85, 0);
        ctx.lineTo(x + 185, 0);
        ctx.lineTo(x + 85, floorY);
        ctx.lineTo(x - 15, floorY);
        ctx.closePath();
        ctx.fill();
      } else {
        const lanternGlow = ctx.createRadialGradient(bx, 252, 4, bx, 252, 48);
        lanternGlow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
        lanternGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = lanternGlow;
        ctx.beginPath();
        ctx.arc(bx, 252, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(bx - 5, 245, 10, 14);
      }
    }
    ctx.restore();
    return;
  }

  if (env === 'alien') {
    // Alien Ship: Angled Starship Bulkhead Ribs, Deep Space Viewports & Pulsing Cyan Plasma Conduits
    for (let x = 100; x < worldW; x += 270) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(x, 130, 38, floorY - 130);
      const pulse = 0.45 + Math.sin(time * 3.2 + x * 0.02) * 0.25;
      ctx.fillStyle = `rgba(34, 211, 238, ${pulse})`;
      ctx.fillRect(x + 16, 145, 6, floorY - 145);
      // Angled mechanical bulkhead struts
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 38, 195);
      ctx.lineTo(x + 84, 148);
      ctx.moveTo(x, 195);
      ctx.lineTo(x - 46, 148);
      ctx.stroke();

      // Panoramic hexagonal starfield viewport
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.52)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 84, 210);
      ctx.lineTo(x + 196, 210);
      ctx.lineTo(x + 214, 265);
      ctx.lineTo(x + 196, 320);
      ctx.lineTo(x + 84, 320);
      ctx.lineTo(x + 66, 265);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Twinkling stars inside viewport
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(x + 102, 240, 2, 2);
      ctx.fillRect(x + 160, 264, 3, 3);
      ctx.fillRect(x + 132, 294, 2, 2);
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(x + 178, 236, 2, 2);
    }
    ctx.fillStyle = '#090f1d';
    ctx.fillRect(0, 0, worldW, 148);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(0, 145, worldW, 5);
    ctx.restore();
    return;
  }

  if (env === 'dwarven_mines') {
    // Corrupted Dwarven Mines: Angular Runic Stone Arches, Glowing Amethyst Crystal Clusters & Hanging Forge Lanterns!
    for (let x = 110; x < worldW; x += 300) {
      // Heavy bevelled dwarven stone support columns
      ctx.fillStyle = 'rgba(34, 27, 51, 0.85)';
      ctx.fillRect(x, 150, 32, floorY - 150);
      ctx.fillRect(x + 128, 150, 32, floorY - 150);
      // Angular dwarven arch lintel with gilded chevron trim
      ctx.beginPath();
      ctx.moveTo(x - 10, 210);
      ctx.lineTo(x + 40, 150);
      ctx.lineTo(x + 120, 150);
      ctx.lineTo(x + 170, 210);
      ctx.lineTo(x + 148, 224);
      ctx.lineTo(x + 112, 178);
      ctx.lineTo(x + 48, 178);
      ctx.lineTo(x + 12, 224);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glowing corrupted amethyst crystal cluster erupting from the column base
      const glow = 0.45 + Math.sin(time * 3 + x * 0.02) * 0.14;
      ctx.fillStyle = `rgba(168, 85, 247, ${glow})`;
      ctx.beginPath();
      ctx.moveTo(x + 28, floorY);
      ctx.lineTo(x + 44, floorY - 58);
      ctx.lineTo(x + 56, floorY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(232, 121, 249, ${glow * 0.9})`;
      ctx.beginPath();
      ctx.moveTo(x + 46, floorY);
      ctx.lineTo(x + 62, floorY - 38);
      ctx.lineTo(x + 70, floorY);
      ctx.closePath();
      ctx.fill();

      // Hanging amber mine lantern swaying from arch center
      const lx = x + 80 + Math.sin(time * 1.5 + x) * 4;
      const ly = 238;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + 80, 178);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      const lg = ctx.createRadialGradient(lx, ly + 8, 2, lx, ly + 8, 36);
      lg.addColorStop(0, 'rgba(251, 191, 36, 0.48)');
      lg.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly + 8, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(lx - 4, ly + 3, 8, 10);
    }
    // Rugged cavern stone ceiling
    ctx.fillStyle = '#130c21';
    ctx.fillRect(0, 0, worldW, 146);
    ctx.fillStyle = '#581c87';
    ctx.fillRect(0, 142, worldW, 5);
    ctx.restore();
    return;
  }

  if (env === 'cyberpunk') {
    // Neon Spire 2099: Holographic Streetlamp Pylons & Glowing Magenta/Cyan Sign Towers!
    for (let x = 130; x < worldW; x += 320) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(x, 190, 18, floorY - 190);
      const isPink = (x / 320) % 2 === 0;
      ctx.fillStyle = isPink ? 'rgba(236, 72, 153, 0.45)' : 'rgba(34, 211, 238, 0.45)';
      ctx.fillRect(x + 18, 260, 56, 98);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + 26, 278, 38, 6);
      ctx.fillRect(x + 26, 294, 28, 5);
      ctx.fillRect(x + 26, 314, 42, 6);
    }
    ctx.restore();
    return;
  }

  if (env === 'pirate') {
    // Skulltide Cove & Armada: Towering Timber Ship Masts, Rigging Lines & Swaying Ship Lanterns!
    for (let x = 150; x < worldW; x += 360) {
      ctx.fillStyle = 'rgba(69, 26, 3, 0.78)';
      ctx.fillRect(x, 120, 26, floorY - 120);
      ctx.fillRect(x - 68, 250, 162, 14);
      // Rope rigging diagonals
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.36)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 13, 180);
      ctx.lineTo(x - 85, floorY);
      ctx.moveTo(x + 13, 180);
      ctx.lineTo(x + 112, floorY);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'paradox') {
    // The Ghost Paradox: Floating Spectral Archways & Fractured Floating Columns!
    for (let x = 140; x < worldW; x += 330) {
      const floatY = Math.sin(time * 1.8 + x * 0.02) * 16;
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.42)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, 220 + floatY, 92, 210);
      ctx.fillStyle = 'rgba(45, 212, 191, 0.14)';
      ctx.fillRect(x + 8, 228 + floatY, 76, 194);
    }
    ctx.restore();
    return;
  }

  if (env === 'mirror_cathedral') {
    // SHATTERED MIRROR CATHEDRAL ARCHITECTURE: Pointed Crystal Arches, Reflective Mirror Monoliths & Floor Sheen!
    for (let x = 110; x < worldW; x += 310) {
      // Towering reflective obsidian mirror monolith behind the hall
      ctx.fillStyle = 'rgba(26, 20, 52, 0.8)';
      ctx.fillRect(x, 150, 52, floorY - 150);
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.34)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 150, 52, floorY - 150);
      // Slanted mirror specular reflection band across monolith
      ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
      ctx.beginPath();
      ctx.moveTo(x + 4, 220);
      ctx.lineTo(x + 48, 172);
      ctx.lineTo(x + 48, 226);
      ctx.lineTo(x + 4, 274);
      ctx.closePath();
      ctx.fill();
      // Pointed gothic prism arch connecting pillars
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.28)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 52, 290);
      ctx.quadraticCurveTo(x + 155, 135, x + 310, 290);
      ctx.stroke();
      // Floating shattered crystal spire hanging from ceiling
      const bob = Math.sin(time * 2.1 + x * 0.02) * 8;
      ctx.fillStyle = 'rgba(244, 114, 182, 0.22)';
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.4)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x + 175, 165 + bob);
      ctx.lineTo(x + 190, 202 + bob);
      ctx.lineTo(x + 175, 242 + bob);
      ctx.lineTo(x + 160, 202 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Fractured cathedral vault ceiling border
    ctx.fillStyle = '#0d091f';
    ctx.fillRect(0, 0, worldW, 146);
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(0, 143, worldW, 3);
    ctx.fillStyle = 'rgba(244, 114, 182, 0.55)';
    ctx.fillRect(0, 146, worldW, 2);
    ctx.restore();
    return;
  }

  if (env === 'mansion') {
    // Velvet Blood Chateau: Marble Columns, Crystal Chandeliers & Gilded Wall Panels!
    for (let x = 120; x < worldW; x += 320) {
      ctx.fillStyle = 'rgba(59, 34, 48, 0.78)';
      ctx.fillRect(x, 148, 26, floorY - 148);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.fillRect(x - 4, 148, 34, 10);
      // Hanging crystal chandelier between columns
      const cx = x + 160;
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 146);
      ctx.lineTo(cx, 228);
      ctx.stroke();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.48)';
      ctx.beginPath();
      ctx.arc(cx, 238, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1b0b16';
    ctx.fillRect(0, 0, worldW, 146);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 143, worldW, 4);
    ctx.restore();
    return;
  }

  if (env === 'underwater') {
    // Sunken Pelagia: Coral-Wrapped Pearl Arches & Swaying Giant Kelp Strands!
    for (let x = 130; x < worldW; x += 310) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.42)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x + 20, floorY);
      ctx.quadraticCurveTo(x + 20 + Math.sin(time * 1.4 + x) * 26, floorY - 220, x + 24, 220);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(x + 150, 320, 74, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'frost') {
    // Frostwarden Citadel: Translucent Glacial Ice Pillars & Frosted Warden Banners!
    for (let x = 130; x < worldW; x += 320) {
      ctx.fillStyle = 'rgba(125, 211, 252, 0.22)';
      ctx.fillRect(x, 160, 34, floorY - 160);
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 160, 34, floorY - 160);
      // Deep cobalt warden pennant banner
      ctx.fillStyle = 'rgba(30, 64, 175, 0.65)';
      ctx.beginPath();
      ctx.moveTo(x + 95, 210);
      ctx.lineTo(x + 145, 210);
      ctx.lineTo(x + 145, 345);
      ctx.lineTo(x + 120, 375);
      ctx.lineTo(x + 95, 345);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (env === 'barbaric') {
    // Ironhorn Bloodlands: Spiked Timber Palisade Stakes & Curved Mammoth-Tusk Archways!
    for (let x = 120; x < worldW; x += 300) {
      ctx.fillStyle = 'rgba(69, 26, 3, 0.82)';
      for (let s = 0; s < 4; s++) {
        const sx = x + s * 24;
        ctx.beginPath();
        ctx.moveTo(sx, floorY);
        ctx.lineTo(sx, 290 + (s % 2) * 35);
        ctx.lineTo(sx + 8, 255 + (s % 2) * 35);
        ctx.lineTo(sx + 16, 290 + (s % 2) * 35);
        ctx.lineTo(sx + 16, floorY);
        ctx.closePath();
        ctx.fill();
      }
      // Curved ivory tusk gate
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.48)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x + 170, floorY);
      ctx.quadraticCurveTo(x + 150, floorY - 180, x + 205, floorY - 255);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (env === 'dragon') {
    // Dragon Crane Sanctum: Tiered Curved-Eave Pagoda Structures, Bamboo Groves, Crane Reliefs & Sky Lanterns!
    for (let x = 120; x < worldW; x += 310) {
      // Swaying emerald bamboo grove cluster behind pagoda
      ctx.strokeStyle = 'rgba(16, 102, 87, 0.52)';
      ctx.lineWidth = 5;
      for (let b = 0; b < 3; b++) {
        const bx = x + 175 + b * 24;
        const sway = Math.sin(time * 1.3 + bx * 0.02) * 8;
        ctx.beginPath();
        ctx.moveTo(bx, floorY);
        ctx.quadraticCurveTo(bx + sway * 0.5, floorY - 190, bx + sway, floorY - 370);
        ctx.stroke();
        // Bamboo node joints & leaves
        ctx.fillStyle = 'rgba(52, 211, 153, 0.36)';
        for (let ny = floorY - 90; ny > floorY - 330; ny -= 70) {
          ctx.fillRect(bx + sway * 0.4 - 4, ny, 8, 2);
          ctx.beginPath();
          ctx.ellipse(bx + sway * 0.4 + 12, ny - 6, 12, 3, -0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Vermilion Pagoda Torii Structure (twin columns + curved upturned imperial jade-tile roof!)
      ctx.fillStyle = 'rgba(127, 29, 29, 0.72)';
      ctx.fillRect(x, 220, 26, floorY - 220);
      ctx.fillRect(x + 104, 220, 26, floorY - 220);
      // Horizontal vermilion crossbeam with gold trim
      ctx.fillStyle = 'rgba(153, 27, 27, 0.78)';
      ctx.fillRect(x - 16, 255, 162, 14);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.62)';
      ctx.fillRect(x - 16, 255, 162, 3);
      ctx.fillRect(x - 4, floorY - 26, 34, 8);
      ctx.fillRect(x + 100, floorY - 26, 34, 8);

      // Upturned curved imperial jade-tile pagoda roof!
      ctx.fillStyle = 'rgba(6, 95, 70, 0.85)';
      ctx.beginPath();
      ctx.moveTo(x - 42, 232);
      ctx.quadraticCurveTo(x + 15, 226, x + 65, 186);
      ctx.quadraticCurveTo(x + 115, 226, x + 172, 232);
      ctx.lineTo(x + 152, 246);
      ctx.lineTo(x - 22, 246);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Carved golden Crane Emblem Medallion hanging under center beam
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.48)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 65, 302, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 51, 304);
      ctx.quadraticCurveTo(x + 65, 290, x + 79, 304);
      ctx.stroke();

      // Floating glowing golden sky lantern beside pagoda
      const ly = 280 + Math.sin(time * 1.4 + x * 0.02) * 18;
      const lx = x + 225;
      const lGlow = ctx.createRadialGradient(lx, ly, 4, lx, ly, 38);
      lGlow.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
      lGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = lGlow;
      ctx.beginPath();
      ctx.arc(lx, ly, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(lx - 9, ly - 13, 18, 24);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(lx - 6, ly - 9, 12, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(lx - 10, ly - 14, 20, 3);
      ctx.fillRect(lx - 10, ly + 10, 20, 3);
    }
    ctx.restore();
    return;
  }

  if (env === 'cemetery') {
    if (rn === 1) {
      // Open-Air Weeping Graveyard: Leaning Headstones, Stone Crosses & Wrought-Iron Cemetery Gate
      for (let x = 90; x < worldW; x += 220) {
        ctx.fillStyle = 'rgba(48, 56, 76, 0.72)';
        // Rounded tombstone
        ctx.beginPath();
        ctx.arc(x + 40, floorY - 42, 18, Math.PI, 0);
        ctx.lineTo(x + 58, floorY);
        ctx.lineTo(x + 22, floorY);
        ctx.closePath();
        ctx.fill();
        // Tall gothic stone cross
        ctx.fillRect(x + 132, floorY - 108, 12, 108);
        ctx.fillRect(x + 114, floorY - 88, 48, 10);
      }
    } else if (rn === 5) {
      // Vespera's Mausoleum: Giant Bone Archway & Soul-Orb Altar
      const cx = worldW * 0.52;
      for (const dx of [-420, -210, 210, 420]) {
        ctx.fillStyle = theme.archColor;
        ctx.fillRect(cx + dx - 20, 145, 40, floorY - 145);
      }
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.42)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, floorY - 180, 135, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#13081f';
      ctx.fillRect(0, 0, worldW, 145);
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(0, 145, worldW, 7);
    } else {
      // Crypt Catacombs & Ossuary Vaults: Recessed Skull Niches & Hanging Funeral Lanterns
      for (let x = 140; x < worldW; x += 310) {
        ctx.fillStyle = theme.archColor;
        ctx.fillRect(x, 145, 38, worldH - 145);
        // Hanging iron censer lantern
        const lx = x + 155;
        const sway = Math.sin(time * 1.6 + x * 0.01) * 7;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 150);
        ctx.lineTo(lx + sway, 310);
        ctx.stroke();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.55)';
        ctx.beginPath();
        ctx.arc(lx + sway, 322, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#0e0a1a';
      ctx.fillRect(0, 0, worldW, 148);
      ctx.fillStyle = '#5b21b6';
      ctx.fillRect(0, 145, worldW, 7);
    }
    ctx.restore();
    return;
  }

  if (env === 'foundry') {
    // Brimstone Sanctum: Colossal Smelter Columns, Hanging Iron Chains & Glowing Magma Troughs
    for (let x = 140; x < worldW; x += 320) {
      ctx.fillStyle = theme.archColor;
      ctx.fillRect(x, 145, 42, worldH - 145);
      // Glowing molten channel running down pillar
      ctx.fillStyle = 'rgba(249, 115, 22, 0.32)';
      ctx.fillRect(x + 17, 155, 8, worldH - 155);
      // Heavy forged chain links
      ctx.strokeStyle = 'rgba(120, 113, 108, 0.48)';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(x + 165, 148);
      ctx.lineTo(x + 165, 410);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#1c0a06';
    ctx.fillRect(0, 0, worldW, 148);
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(0, 145, worldW, 7);
    ctx.restore();
    return;
  }

  if (env === 'eclipse') {
    // Eclipse Citadel: Obsidian Monolith Pillars & Crimson Gauntlet Banners
    for (let x = 140; x < worldW; x += 320) {
      ctx.fillStyle = theme.archColor;
      ctx.fillRect(x, 145, 44, worldH - 145);
      ctx.fillStyle = 'rgba(255, 46, 99, 0.42)';
      ctx.fillRect(x + 18, 155, 8, worldH - 155);
    }
    ctx.fillStyle = '#12030e';
    ctx.fillRect(0, 0, worldW, 148);
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(0, 145, worldW, 7);
    ctx.restore();
    return;
  }

  if (isGoblin) {
    if (rn === 1) {
      // GOBLIN ROOM 1: Open-Air Timber Stockade Fence & Distant Watchtowers (NO ceiling!)
      for (let x = 90; x < worldW; x += 260) {
        // Wooden stockade fence panels along courtyard ground
        ctx.fillStyle = 'rgba(42, 31, 20, 0.72)';
        for (let p = 0; p < 7; p++) {
          const px = x + p * 22;
          ctx.beginPath();
          ctx.moveTo(px, floorY);
          ctx.lineTo(px, floorY - 125);
          ctx.lineTo(px + 9, floorY - 145);
          ctx.lineTo(px + 18, floorY - 125);
          ctx.lineTo(px + 18, floorY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(92, 66, 40, 0.55)';
        ctx.fillRect(x, floorY - 90, 154, 8);
        ctx.fillRect(x, floorY - 36, 154, 8);
      }
    } else if (rn === 2) {
      // GOBLIN ROOM 2: Sapper Powder Pits — Timber Mine Beams, Powder Kegs & Overhead Rafters
      for (let x = 140; x < worldW; x += 300) {
        ctx.fillStyle = theme.archColor;
        ctx.fillRect(x, 150, 26, worldH - 150);
        // Diagonal timber mine braces
        ctx.strokeStyle = 'rgba(94, 62, 32, 0.55)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(x + 26, 220);
        ctx.lineTo(x + 90, 155);
        ctx.moveTo(x, 220);
        ctx.lineTo(x - 64, 155);
        ctx.stroke();

        // Decorative background powder keg stacks
        const kx = x + 140;
        ctx.fillStyle = '#3b2416';
        ctx.fillRect(kx - 18, floorY - 34, 24, 34);
        ctx.fillRect(kx + 10, floorY - 34, 24, 34);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(kx - 18, floorY - 26, 24, 4);
        ctx.fillRect(kx + 10, floorY - 26, 24, 4);
      }
      // Wooden mine ceiling timber
      ctx.fillStyle = '#24160b';
      ctx.fillRect(0, 0, worldW, 148);
      ctx.fillStyle = '#5c3c20';
      ctx.fillRect(0, 145, worldW, 9);
    } else if (rn === 3) {
      // GOBLIN ROOM 3: Totem Bog Hollow — Carved Glowing Emerald Skull Totems & Swamp Reeds!
      for (let x = 180; x < worldW; x += 340) {
        // Tall carved shaman totem pole
        ctx.fillStyle = '#1b2e26';
        ctx.fillRect(x - 16, floorY - 260, 32, 260);
        ctx.fillStyle = '#2c4c3f';
        ctx.fillRect(x - 28, floorY - 220, 56, 16);
        ctx.fillRect(x - 24, floorY - 140, 48, 14);
        // Glowing emerald totem eyes
        const pulse = 0.55 + Math.sin(time * 3.5 + x) * 0.35;
        ctx.fillStyle = `rgba(52, 211, 153, ${pulse})`;
        ctx.fillRect(x - 10, floorY - 200, 6, 6);
        ctx.fillRect(x + 4, floorY - 200, 6, 6);
        ctx.fillRect(x - 8, floorY - 120, 5, 5);
        ctx.fillRect(x + 3, floorY - 120, 5, 5);
      }
    } else if (rn === 4) {
      // GOBLIN ROOM 4: War-Beast Palisade — Giant Beast Ribcage Arches & Hanging Iron Cages!
      for (let x = 190; x < worldW; x += 360) {
        // Colossal curved bone ribcage arch
        ctx.strokeStyle = 'rgba(214, 203, 186, 0.28)';
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(x - 95, floorY);
        ctx.quadraticCurveTo(x - 75, 420, x, 330);
        ctx.quadraticCurveTo(x + 75, 420, x + 95, floorY);
        ctx.stroke();

        // Hanging iron cage swaying gently from chains
        const cx = x + 180;
        const sway = Math.sin(time * 1.6 + x) * 8;
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx, 150);
        ctx.lineTo(cx + sway, 370);
        ctx.stroke();
        ctx.strokeRect(cx + sway - 20, 370, 40, 54);
        ctx.beginPath();
        ctx.moveTo(cx + sway - 7, 370);
        ctx.lineTo(cx + sway - 7, 424);
        ctx.moveTo(cx + sway + 7, 370);
        ctx.lineTo(cx + sway + 7, 424);
        ctx.stroke();
      }
      ctx.fillStyle = '#210e0a';
      ctx.fillRect(0, 0, worldW, 148);
      ctx.fillStyle = '#6b2f1d';
      ctx.fillRect(0, 145, worldW, 8);
    } else {
      // GOBLIN ROOM 5: Warchief's Bone Throne — Giant Horned Skull Monument in Center!
      const cx = worldW * 0.52;
      // Giant crossed war-axes behind skull
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(cx - 190, floorY - 380);
      ctx.lineTo(cx + 190, floorY - 40);
      ctx.moveTo(cx + 190, floorY - 380);
      ctx.lineTo(cx - 190, floorY - 40);
      ctx.stroke();

      // Colossal Beast Skull Throne Arch
      ctx.fillStyle = 'rgba(214, 203, 186, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, floorY - 220, 125, Math.PI, 0);
      ctx.lineTo(cx + 95, floorY - 120);
      ctx.lineTo(cx - 95, floorY - 120);
      ctx.closePath();
      ctx.fill();
      // Glowing ember eye sockets
      ctx.fillStyle = 'rgba(249, 115, 22, 0.55)';
      ctx.beginPath();
      ctx.arc(cx - 46, floorY - 215, 24, 0, Math.PI * 2);
      ctx.arc(cx + 46, floorY - 215, 24, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // =========================================================================
  // NOCTURNE CASTLE ARCHITECTURE (5 Unmistakably Distinct Rooms!)
  // =========================================================================
  if (rn === 1) {
    // ROOM 1: Outer Courtyard — OPEN AIR (NO ceiling!), Wrought-Iron Fence & Dead Courtyard Trees!
    for (let x = 80; x < worldW; x += 280) {
      // Stone courtyard fence pillar
      ctx.fillStyle = 'rgba(42, 54, 78, 0.72)';
      ctx.fillRect(x, floorY - 128, 22, 128);
      ctx.fillRect(x - 4, floorY - 134, 30, 8);
      // Wrought-iron fence spears between pillars
      ctx.fillStyle = 'rgba(24, 33, 52, 0.78)';
      ctx.fillRect(x + 22, floorY - 102, 258, 4);
      ctx.fillRect(x + 22, floorY - 32, 258, 4);
      for (let fx = x + 38; fx < x + 275; fx += 24) {
        ctx.fillRect(fx, floorY - 118, 3, 118);
      }
      // Bare gothic winter tree silhouette every other bay
      if ((x / 280) % 2 === 0) {
        const tx = x + 150;
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(tx, floorY);
        ctx.lineTo(tx - 6, floorY - 220);
        ctx.moveTo(tx - 4, floorY - 150);
        ctx.lineTo(tx - 65, floorY - 235);
        ctx.moveTo(tx - 4, floorY - 175);
        ctx.lineTo(tx + 58, floorY - 255);
        ctx.stroke();
      }
    }
  } else if (rn === 2) {
    // ROOM 2: Clockwork Belfry — Brass Iron Columns, Swinging Pendulums & Circular Clock Windows!
    for (let x = 150; x < worldW; x += 340) {
      ctx.fillStyle = theme.archColor;
      ctx.fillRect(x, 130, 34, worldH - 130);
      ctx.fillStyle = 'rgba(180, 122, 48, 0.35)';
      ctx.fillRect(x + 4, 130, 5, worldH - 130);

      // Swinging brass pendulum between columns
      const px = x + 170;
      const swing = Math.sin(time * 1.7 + x * 0.01) * 0.32;
      ctx.save();
      ctx.translate(px, 152);
      ctx.rotate(swing);
      ctx.strokeStyle = 'rgba(217, 155, 58, 0.45)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 290);
      ctx.stroke();
      ctx.fillStyle = 'rgba(217, 155, 58, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 295, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Circular clock-face oculus behind
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(px, 470, 52, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(0, 0, worldW, 148);
    ctx.fillStyle = '#8a6234';
    ctx.fillRect(0, 145, worldW, 7);
  } else if (rn === 3) {
    // ROOM 3: Hanging Nave — Tall Colorful Stained-Glass Lancet Windows & Hanging Chains!
    for (let x = 150; x < worldW; x += 320) {
      ctx.fillStyle = theme.archColor;
      ctx.fillRect(x, 125, 36, worldH - 125);

      const wx = x + 160;
      // Glowing stained-glass lancet window (sapphire -> violet -> gold gradient!)
      const winGrad = ctx.createLinearGradient(wx, 250, wx, 610);
      winGrad.addColorStop(0, 'rgba(96, 165, 250, 0.42)');
      winGrad.addColorStop(0.5, 'rgba(167, 139, 250, 0.38)');
      winGrad.addColorStop(1, 'rgba(245, 158, 11, 0.26)');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.moveTo(wx - 34, 610);
      ctx.lineTo(wx - 34, 330);
      ctx.quadraticCurveTo(wx, 240, wx + 34, 330);
      ctx.lineTo(wx + 34, 610);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.32)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Window lead mullions
      ctx.beginPath();
      ctx.moveTo(wx, 275);
      ctx.lineTo(wx, 610);
      ctx.moveTo(wx - 34, 440);
      ctx.lineTo(wx + 34, 440);
      ctx.stroke();

      // Hanging cathedral iron chains
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x + 80, 150);
      ctx.lineTo(x + 80, 420);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#120a24';
    ctx.fillRect(0, 0, worldW, 148);
    ctx.fillStyle = '#6c4f9c';
    ctx.fillRect(0, 145, worldW, 7);
  } else if (rn === 4) {
    // ROOM 4: Crimson Sanctum — Rib-Vaulted Blood Pillars & Tall Velvet Crimson Banners!
    for (let x = 140; x < worldW; x += 300) {
      ctx.fillStyle = theme.archColor;
      ctx.fillRect(x, 130, 40, worldH - 130);

      // Tall royal crimson hanging tapestry banner with gold trim
      const bx = x + 150;
      const flutter = Math.sin(time * 2.2 + x * 0.02) * 5;
      ctx.fillStyle = 'rgba(153, 27, 46, 0.62)';
      ctx.beginPath();
      ctx.moveTo(bx - 28, 220);
      ctx.lineTo(bx + 28, 220);
      ctx.lineTo(bx + 28 + flutter, 515);
      ctx.lineTo(bx + flutter, 555);
      ctx.lineTo(bx - 28 + flutter, 515);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(229, 169, 60, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fillStyle = '#1f070e';
    ctx.fillRect(0, 0, worldW, 148);
    ctx.fillStyle = '#9e2640';
    ctx.fillRect(0, 145, worldW, 7);
  } else {
    // ROOM 5: Throne of Nocturne — Grand Crimson Carpet, Marble Colonnade & Sovereign Throne!
    const cx = worldW * 0.52;
    // Marble columns framing throne hall
    for (const dx of [-460, -240, 240, 460]) {
      ctx.fillStyle = 'rgba(74, 22, 36, 0.72)';
      ctx.fillRect(cx + dx - 22, 145, 44, floorY - 145);
      ctx.fillStyle = 'rgba(229, 169, 60, 0.45)';
      ctx.fillRect(cx + dx - 26, 152, 52, 8);
      ctx.fillRect(cx + dx - 26, floorY - 14, 52, 14);
    }
    // Towering Gothic Sovereign Throne in center background
    ctx.fillStyle = '#240b14';
    ctx.fillRect(cx - 58, floorY - 210, 116, 210);
    ctx.beginPath();
    ctx.moveTo(cx - 64, floorY - 210);
    ctx.lineTo(cx, floorY - 305);
    ctx.lineTo(cx + 64, floorY - 210);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e5a93c';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Ruby velvet cushion back
    ctx.fillStyle = '#991b2e';
    ctx.fillRect(cx - 34, floorY - 190, 68, 130);

    ctx.fillStyle = '#1c040a';
    ctx.fillRect(0, 0, worldW, 145);
    ctx.fillStyle = '#c82333';
    ctx.fillRect(0, 145, worldW, 7);
  }

  ctx.restore();
}

function drawCampCastleSilhouette(
  ctx: CanvasRenderingContext2D,
  camX: number,
  viewportW: number,
  viewportH: number
): void {
  const shift = -(camX - 500) * 0.08;
  const base = viewportH * 0.78;
  const cx = viewportW * 0.56 + shift;

  ctx.save();

  // Distant mountain crags
  ctx.fillStyle = '#0c101b';
  ctx.beginPath();
  ctx.moveTo(0, viewportH);
  ctx.lineTo(0, base - 45);
  ctx.lineTo(viewportW * 0.22, base - 115);
  ctx.lineTo(viewportW * 0.45, base - 65);
  ctx.lineTo(viewportW * 0.72, base - 135);
  ctx.lineTo(viewportW, base - 70);
  ctx.lineTo(viewportW, viewportH);
  ctx.closePath();
  ctx.fill();

  // Towering Nocturne Castle Silhouette looming right behind the camp!
  ctx.fillStyle = '#111524';
  ctx.fillRect(cx - 210, base - 160, 420, 190);
  ctx.fillRect(cx - 65, base - 275, 130, 290);
  ctx.beginPath();
  ctx.moveTo(cx - 75, base - 275);
  ctx.lineTo(cx, base - 360);
  ctx.lineTo(cx + 75, base - 275);
  ctx.closePath();
  ctx.fill();

  const spires = [
    { dx: -175, w: 54, h: 235, tip: 75 },
    { dx: -105, w: 40, h: 205, tip: 55 },
    { dx: 105, w: 40, h: 215, tip: 55 },
    { dx: 175, w: 58, h: 250, tip: 80 },
  ];
  for (const s of spires) {
    ctx.fillRect(cx + s.dx - s.w / 2, base - s.h, s.w, s.h + 40);
    ctx.beginPath();
    ctx.moveTo(cx + s.dx - s.w / 2 - 6, base - s.h);
    ctx.lineTo(cx + s.dx, base - s.h - s.tip);
    ctx.lineTo(cx + s.dx + s.w / 2 + 6, base - s.h);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(220, 38, 38, 0.52)';
  for (const wx of [-175, -35, 0, 35, 175]) {
    ctx.fillRect(cx + wx - 4, base - 195, 8, 22);
  }
  ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.fillRect(cx - 5, base - 255, 10, 28);

  ctx.fillStyle = '#14192b';
  for (let bx = cx - 210; bx < cx + 210; bx += 22) {
    ctx.fillRect(bx, base - 172, 12, 14);
  }

  ctx.restore();
}

function drawCampScenery(ctx: CanvasRenderingContext2D, floorY: number): void {
  ctx.save();

  // ZONE A: Small Mountain craggy peak backdrop behind the stepped western ledges
  ctx.fillStyle = '#121622';
  ctx.beginPath();
  ctx.moveTo(0, floorY);
  ctx.lineTo(0, floorY - 310);
  ctx.lineTo(125, floorY - 375);
  ctx.lineTo(255, floorY - 295);
  ctx.lineTo(390, floorY - 210);
  ctx.lineTo(480, floorY);
  ctx.closePath();
  ctx.fill();
  // Mountain ridge highlights
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, floorY - 310);
  ctx.lineTo(125, floorY - 375);
  ctx.lineTo(255, floorY - 295);
  ctx.lineTo(390, floorY - 210);
  ctx.stroke();

  // Stone shrine lantern atop the Monk's Mountain Summit (y = 615)
  ctx.fillStyle = '#2b3040';
  ctx.fillRect(66, 582, 16, 33);
  ctx.fillRect(60, 576, 28, 7);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.78)';
  ctx.fillRect(70, 586, 8, 10);
  ctx.fillStyle = '#3b4257';
  ctx.beginPath();
  ctx.moveTo(56, 576);
  ctx.lineTo(74, 562);
  ctx.lineTo(92, 576);
  ctx.closePath();
  ctx.fill();

  // ZONE B: Hunter's dark gothic canvas tent & log benches framing the Campfire Hearth (CAMP_FIRE_X = 685)
  ctx.fillStyle = '#1b1721';
  ctx.beginPath();
  ctx.moveTo(468, floorY);
  ctx.lineTo(548, floorY - 118);
  ctx.lineTo(628, floorY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3c303a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0c0a10';
  ctx.beginPath();
  ctx.moveTo(524, floorY);
  ctx.lineTo(548, floorY - 74);
  ctx.lineTo(572, floorY);
  ctx.closePath();
  ctx.fill();

  // Cozy timber log benches flanking the campfire
  ctx.fillStyle = '#3b2518';
  ctx.fillRect(605, floorY - 10, 44, 10);
  ctx.fillRect(722, floorY - 10, 44, 10);
  ctx.fillStyle = '#5c3b28';
  ctx.fillRect(607, floorY - 10, 40, 3);
  ctx.fillRect(724, floorY - 10, 40, 3);

  // Festive hanging lantern string beneath the Minstrel's elevated stage rafter (x = 580..790, y = 745)
  ctx.strokeStyle = 'rgba(229, 169, 60, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(585, 763);
  ctx.quadraticCurveTo(685, 786, 785, 763);
  ctx.stroke();
  for (const lx of [618, 662, 708, 752]) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(lx, 774, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ZONE C: Arcane Rune Arch behind Wizard's terrace (x = 1035, y = 760) & Crystal Spires on Prism Striker's ledge (x = 1175, y = 665)
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(1035, 718, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.25)';
  ctx.beginPath();
  ctx.arc(1035, 718, 25, 0, Math.PI * 2);
  ctx.stroke();

  // Glowing crystal cluster framing Prism Striker's upper Crystal Spire ledge (y = 665)
  const crystals = [
    { x: 1110, h: 46, w: 12, col: '#22d3ee' },
    { x: 1124, h: 30, w: 9, col: '#67e8f9' },
    { x: 1232, h: 52, w: 13, col: '#38bdf8' },
    { x: 1244, h: 32, w: 9, col: '#a855f7' },
  ];
  for (const cr of crystals) {
    ctx.fillStyle = cr.col;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.moveTo(cr.x - cr.w / 2, 665);
    ctx.lineTo(cr.x, 665 - cr.h);
    ctx.lineTo(cr.x + cr.w / 2, 665);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ZONE D: Lantern Pavilion crimson-gold banners flanking the Blade-Dancer's bridge (x = 1295..1475, y = 735)
  for (const bx of [1306, 1464]) {
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(bx - 6, 753, 12, 42);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(bx - 6, 753, 12, 3);
    ctx.beginPath();
    ctx.moveTo(bx - 6, 795);
    ctx.lineTo(bx, 807);
    ctx.lineTo(bx + 6, 795);
    ctx.closePath();
    ctx.fill();
  }

  // Gothic pines framing the open glades between zones
  const trees = [472, 918, 1230, 1502];
  for (const tx of trees) {
    ctx.fillStyle = '#111420';
    ctx.fillRect(tx - 6, floorY - 180, 12, 180);
    ctx.beginPath();
    ctx.moveTo(tx - 44, floorY - 70);
    ctx.lineTo(tx, floorY - 215);
    ctx.lineTo(tx + 44, floorY - 70);
    ctx.closePath();
    ctx.fill();
  }

  // ZONE E: Imposing Castle Gate Bastion & Battlements on the far right (x = 1555..1840)
  ctx.fillStyle = '#1a1e2b';
  ctx.fillRect(1555, floorY - 260, 285, 260);
  ctx.fillStyle = '#2d3347';
  ctx.fillRect(1550, floorY - 268, 295, 10);
  for (let bx = 1558; bx < 1835; bx += 34) {
    ctx.fillRect(bx, floorY - 286, 20, 18);
  }

  // Subtle grounded camp section labels etched softly above landmarks
  ctx.font = '600 10px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(229, 169, 60, 0.58)';
  ctx.fillText('MOUNTAIN SUMMIT', 140, 526);
  ctx.fillText('CAMPFIRE · HEARTH', CAMP_FIRE_X, floorY - 82);
  ctx.fillText('ARCANE TERRACE & ARMORY', 1035, floorY - 72);
  ctx.fillText('CRAFTING FORGE', 1325, floorY - 72);
  ctx.fillText('CHOOSE RAID GATE', 1640, floorY - 180);

  ctx.restore();
}

function findSupportBottomY(
  colX: number,
  topY: number,
  platforms: Platform[],
  stage: StageDef
): number {
  let bestY = stage.worldHeight;
  for (const other of platforms) {
    if (other.oneWay) continue;
    if (colX >= other.x + 2 && colX <= other.x + other.w - 2 && other.y >= topY) {
      if (other.y < bestY) {
        bestY = other.y;
      }
    }
  }
  return bestY;
}

function drawSoftPlatformSupports(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  stage: StageDef
): void {
  const env = stage.environment ?? 'castle';
  const isGoblin = env === 'goblin_camp';
  const isCemetery = env === 'cemetery';
  const isOpenAir =
    stage.isCamp ||
    env === 'sand' ||
    env === 'dragon' ||
    env === 'mushroom' ||
    (stage.roomNumber === 1 && (env === 'castle' || isGoblin || isCemetery)) ||
    (isGoblin && (stage.roomNumber === 3 || stage.roomNumber === 5));

  ctx.save();

  for (const p of platforms) {
    if (!p.oneWay) continue;
    if (p.style === 'bounce_cap' || p.style === 'wind_pad' || p.style === 'grate') continue;

    const leftColX = p.x + Math.min(18, p.w * 0.16);
    const rightColX = p.x + p.w - Math.min(18, p.w * 0.16);
    const topUnderY = p.y + p.h;

    if (env === 'sand') {
      // Sand Fortress: Tapered Sandstone Piers & Warm Desert Archways
      const bottomL = findSupportBottomY(leftColX, topUnderY, platforms, stage);
      const bottomR = findSupportBottomY(rightColX, topUnderY, platforms, stage);
      ctx.fillStyle = 'rgba(92, 54, 21, 0.85)';
      ctx.fillRect(leftColX - 7, topUnderY, 14, bottomL - topUnderY);
      ctx.fillRect(rightColX - 7, topUnderY, 14, bottomR - topUnderY);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(leftColX - 10, topUnderY, 20, 6);
      ctx.fillRect(rightColX - 10, topUnderY, 20, 6);
      if (rightColX - leftColX > 40) {
        const archH = Math.min(30, (rightColX - leftColX) * 0.22);
        ctx.strokeStyle = 'rgba(180, 105, 36, 0.72)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(leftColX, topUnderY + archH);
        ctx.quadraticCurveTo(p.x + p.w / 2, topUnderY - 2, rightColX, topUnderY + archH);
        ctx.stroke();
      }
      continue;
    }

    if (env === 'dragon') {
      // Dragon Crane: Vermilion Lacquered Pagoda Posts & Stepped Dougong Brackets
      const bottomL = findSupportBottomY(leftColX, topUnderY, platforms, stage);
      const bottomR = findSupportBottomY(rightColX, topUnderY, platforms, stage);
      ctx.fillStyle = 'rgba(127, 29, 29, 0.88)';
      ctx.fillRect(leftColX - 6, topUnderY, 12, bottomL - topUnderY);
      ctx.fillRect(rightColX - 6, topUnderY, 12, bottomR - topUnderY);
      // Stepped gold-trimmed dougong bracket caps
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(leftColX - 12, topUnderY, 24, 5);
      ctx.fillRect(rightColX - 12, topUnderY, 24, 5);
      ctx.fillStyle = '#065f46';
      ctx.fillRect(leftColX - 9, topUnderY + 5, 18, 5);
      ctx.fillRect(rightColX - 9, topUnderY + 5, 18, 5);
      // Vermilion diagonal knee braces
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(leftColX, topUnderY + 28);
      ctx.lineTo(leftColX + 24, topUnderY);
      ctx.moveTo(rightColX, topUnderY + 28);
      ctx.lineTo(rightColX - 24, topUnderY);
      ctx.stroke();
      continue;
    }

    if (env === 'dwarven_mines') {
      // Corrupted Dwarven Mines: Heavy Timber & Riveted Iron Mine-Trestle Braces
      const bottomL = findSupportBottomY(leftColX, topUnderY, platforms, stage);
      const bottomR = findSupportBottomY(rightColX, topUnderY, platforms, stage);
      ctx.fillStyle = 'rgba(66, 46, 38, 0.9)';
      ctx.fillRect(leftColX - 6, topUnderY, 12, bottomL - topUnderY);
      ctx.fillRect(rightColX - 6, topUnderY, 12, bottomR - topUnderY);
      // Riveted iron bracket plates
      ctx.fillStyle = '#64748b';
      ctx.fillRect(leftColX - 10, topUnderY, 20, 7);
      ctx.fillRect(rightColX - 10, topUnderY, 20, 7);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.72)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(leftColX, topUnderY + 32);
      ctx.lineTo(leftColX + 26, topUnderY);
      ctx.moveTo(rightColX, topUnderY + 32);
      ctx.lineTo(rightColX - 26, topUnderY);
      ctx.stroke();
      continue;
    }

    if (env === 'mushroom') {
      // Mushroom Kingdom: Organic Striated Fungal Stalks supporting Shelf Caps
      const midX = p.x + p.w / 2;
      const bottomM = findSupportBottomY(midX, topUnderY, platforms, stage);
      ctx.fillStyle = 'rgba(56, 46, 82, 0.82)';
      ctx.fillRect(midX - 10, topUnderY, 20, bottomM - topUnderY);
      ctx.fillStyle = 'rgba(192, 132, 252, 0.25)';
      ctx.fillRect(midX - 5, topUnderY, 5, bottomM - topUnderY);
      continue;
    }

    if (env === 'alien') {
      // Alien Ship: Angled Steel Struts & Glowing Cyan Plasma Tethers
      const ceilingY = 148;
      for (const cx of [leftColX, rightColX]) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, ceilingY);
        ctx.lineTo(cx, p.y);
        ctx.stroke();
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 6, ceilingY, 12, 6);
        ctx.fillRect(cx - 5, p.y - 5, 10, 5);
      }
      continue;
    }

    if (p.style === 'rafter' && !isOpenAir) {
      // Indoor overhead catwalk / rafter: heavy wrought-iron hanging chains up to the ceiling!
      const ceilingY = 148;
      const chainXs = p.w >= 260 ? [leftColX, p.x + p.w / 2, rightColX] : [leftColX, rightColX];

      for (const cx of chainXs) {
        // Chain core shadow
        ctx.strokeStyle = '#181c28';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, ceilingY);
        ctx.lineTo(cx, p.y);
        ctx.stroke();

        // Interlocking metallic iron links
        ctx.strokeStyle = '#5c667d';
        ctx.lineWidth = 2;
        for (let ly = ceilingY + 4; ly < p.y - 2; ly += 11) {
          ctx.strokeRect(cx - 2.5, ly, 5, 8);
        }

        // Ceiling anchor shackle & rafter collar clamp
        ctx.fillStyle = '#3c4559';
        ctx.fillRect(cx - 8, ceilingY, 16, 8);
        ctx.fillRect(cx - 7, p.y - 6, 14, 7);
        ctx.fillStyle = '#9aa3b8';
        ctx.fillRect(cx - 2, p.y - 4, 4, 3);
      }

      // Under-rafter iron girder brackets
      ctx.strokeStyle = 'rgba(72, 82, 105, 0.75)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftColX, topUnderY);
      ctx.lineTo(leftColX + 18, topUnderY + 14);
      ctx.lineTo(rightColX - 18, topUnderY + 14);
      ctx.lineTo(rightColX, topUnderY);
      ctx.stroke();
      continue;
    }

    if (p.style === 'timber' || (p.style === 'rafter' && isGoblin)) {
      // Goblin Camp timber watchtower scaffolding: vertical log stilts + X-cross-bracing + rope lashings!
      const bottomL = findSupportBottomY(leftColX, topUnderY, platforms, stage);
      const bottomR = findSupportBottomY(rightColX, topUnderY, platforms, stage);
      const spanBottom = Math.min(bottomL, bottomR);

      // Vertical timber stilts
      ctx.fillStyle = '#2d1d12';
      ctx.fillRect(leftColX - 5, topUnderY, 10, bottomL - topUnderY);
      ctx.fillRect(rightColX - 5, topUnderY, 10, bottomR - topUnderY);
      ctx.fillStyle = '#4a311f';
      ctx.fillRect(leftColX - 3, topUnderY, 3, bottomL - topUnderY);
      ctx.fillRect(rightColX - 3, topUnderY, 3, bottomR - topUnderY);

      // Center post for wider decks
      if (p.w >= 210) {
        const midX = p.x + p.w / 2;
        const bottomM = findSupportBottomY(midX, topUnderY, platforms, stage);
        ctx.fillStyle = '#26180f';
        ctx.fillRect(midX - 4, topUnderY, 8, bottomM - topUnderY);
      }

      // Cross-braced X-struts between stilts so it reads unmistakably as a wooden tower/scaffold
      const braceStep = 74;
      ctx.strokeStyle = 'rgba(74, 49, 31, 0.78)';
      ctx.lineWidth = 4;
      for (let by = topUnderY + 6; by + 34 < spanBottom; by += braceStep) {
        const nextY = Math.min(spanBottom - 4, by + braceStep);
        ctx.beginPath();
        ctx.moveTo(leftColX, by);
        ctx.lineTo(rightColX, nextY);
        ctx.moveTo(rightColX, by);
        ctx.lineTo(leftColX, nextY);
        ctx.stroke();

        // Horizontal cross-rung & rope bindings
        ctx.fillStyle = '#3b2617';
        ctx.fillRect(leftColX, by - 2, rightColX - leftColX, 5);
        ctx.fillStyle = '#9a7b4f';
        ctx.fillRect(leftColX - 6, by - 3, 12, 5);
        ctx.fillRect(rightColX - 6, by - 3, 12, 5);
      }

      // Diagonal top knee braces directly beneath the deck
      ctx.strokeStyle = '#5c3c24';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(leftColX, topUnderY + 26);
      ctx.lineTo(leftColX + 26, topUnderY);
      ctx.moveTo(rightColX, topUnderY + 26);
      ctx.lineTo(rightColX - 26, topUnderY);
      ctx.stroke();
      continue;
    }

    // Castle Stone/Timber Bridges & Open-Air Gantries: Gothic arched masonry piers + iron trusses!
    const bottomL = findSupportBottomY(leftColX, topUnderY, platforms, stage);
    const bottomR = findSupportBottomY(rightColX, topUnderY, platforms, stage);
    const archSpanW = rightColX - leftColX;

    // Gothic stone piers anchoring both ends down to the ground or pit below
    ctx.fillStyle = 'rgba(26, 29, 42, 0.88)';
    ctx.fillRect(leftColX - 7, topUnderY, 14, bottomL - topUnderY);
    ctx.fillRect(rightColX - 7, topUnderY, 14, bottomR - topUnderY);
    // Highlighted masonry edge + carved capitals
    ctx.fillStyle = 'rgba(74, 83, 108, 0.55)';
    ctx.fillRect(leftColX - 5, topUnderY, 4, bottomL - topUnderY);
    ctx.fillRect(rightColX - 5, topUnderY, 4, bottomR - topUnderY);
    ctx.fillStyle = '#3d455c';
    ctx.fillRect(leftColX - 10, topUnderY, 20, 7);
    ctx.fillRect(rightColX - 10, topUnderY, 20, 7);

    // Arched bridge under-span & iron truss struts
    if (archSpanW > 40) {
      const archH = Math.min(34, archSpanW * 0.24);
      ctx.strokeStyle = 'rgba(78, 86, 112, 0.72)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(leftColX, topUnderY + archH);
      ctx.quadraticCurveTo(p.x + p.w / 2, topUnderY - 2, rightColX, topUnderY + archH);
      ctx.stroke();

      // Wrought-iron diagonal truss struts beneath bridge deck
      ctx.strokeStyle = 'rgba(54, 60, 80, 0.72)';
      ctx.lineWidth = 2.5;
      const segs = Math.max(2, Math.floor(archSpanW / 44));
      const segW = archSpanW / segs;
      for (let s = 0; s < segs; s++) {
        const sx = leftColX + s * segW;
        ctx.beginPath();
        ctx.moveTo(sx, topUnderY);
        ctx.lineTo(sx + segW / 2, topUnderY + 14);
        ctx.lineTo(sx + segW, topUnderY);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawBossGateMarker(
  ctx: CanvasRenderingContext2D,
  bossStartX: number,
  theme: StageTheme
): void {
  const gx = bossStartX + 20;
  ctx.fillStyle = '#1b1622';
  ctx.fillRect(gx, 320, 30, 540);
  ctx.fillStyle = theme.bossFloorTop;
  ctx.fillRect(gx + 6, 360, 18, 16);
  ctx.fillRect(gx + 6, 540, 18, 16);
}

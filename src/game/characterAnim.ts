import { affinityFxEnabled, visualElement, visualTier } from './affinityFx';
import { drawBruteHammerEvo, drawFistEvo, drawHeldWeaponEvo, drawStaffEvo, heldScale, setHeldEvo } from './weaponEvo';
import { getActiveElementDef } from './defaults';
import { CharacterId, Facing, Player, WeaponId } from './types';

interface LimbPose {
  bodyOffsetY: number;
  torsoTilt: number;
  headTilt: number;
  leftHipAngle: number;
  leftKneeAngle: number;
  rightHipAngle: number;
  rightKneeAngle: number;
  frontShoulderAngle: number;
  frontElbowAngle: number;
  backShoulderAngle: number;
  backElbowAngle: number;
  coatSweep: number;
  hairLift: number;
  squashX: number;
  squashY: number;
}

// Quantize animation clock to a silky 30 FPS anime step rate
function snap30fps(t: number): number {
  return Math.floor(t * 30) / 30;
}

function drawLimbSegment(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  angle: number,
  len: number,
  thickness: number,
  color: string,
  highlight?: string
): { x: number; y: number } {
  const x2 = x1 + Math.sin(angle) * len;
  const y2 = y1 + Math.cos(angle) * len;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (highlight) {
    ctx.strokeStyle = highlight;
    ctx.lineWidth = Math.max(1, thickness * 0.28);
    ctx.beginPath();
    ctx.moveTo(x1 + 0.6, y1);
    ctx.lineTo(x2 + 0.6, y2);
    ctx.stroke();
  }
  ctx.restore();
  return { x: x2, y: y2 };
}

function computePose(
  player: Player,
  scale: number
): LimbPose {
  const t30 = snap30fps(player.animTime);
  const speed = Math.abs(player.vx);
  const isMoving = speed > 14 && player.onGround;
  const isAirborne = !player.onGround;

  // Base idle breathing pose
  const breath = Math.sin(t30 * 3.4);
  const pose: LimbPose = {
    bodyOffsetY: breath * 1.1 * scale,
    torsoTilt: 0.04,
    headTilt: breath * 0.03,
    leftHipAngle: -0.14,
    leftKneeAngle: 0.16,
    rightHipAngle: 0.18,
    rightKneeAngle: 0.12,
    frontShoulderAngle: 0.24,
    frontElbowAngle: -0.45,
    backShoulderAngle: -0.22,
    backElbowAngle: -0.28,
    coatSweep: -0.12 + Math.sin(t30 * 3.8) * 0.08,
    hairLift: Math.sin(t30 * 4.2) * 0.08,
    squashX: 1,
    squashY: 1,
  };

  // 0A. LEDGE PULL-UP / MANTLE (All Characters)
  if (player.ledgeGrabActive) {
    const prog =
      player.ledgeGrabDuration > 0
        ? 1 - player.ledgeGrabTimer / player.ledgeGrabDuration
        : 1;
    pose.torsoTilt = 0.28 + prog * 0.18;
    pose.headTilt = -0.18;
    pose.bodyOffsetY = (1 - prog) * 3 * scale;
    pose.leftHipAngle = 0.85 * (1 - prog * 0.4);
    pose.leftKneeAngle = 1.25;
    pose.rightHipAngle = -0.15 + prog * 0.55;
    pose.rightKneeAngle = 0.95;
    // Arms reach up & push down to vault onto ledge
    pose.frontShoulderAngle = -2.25 + prog * 2.55;
    pose.frontElbowAngle = -0.55;
    pose.backShoulderAngle = -2.1 + prog * 2.45;
    pose.backElbowAngle = -0.55;
    pose.coatSweep = -0.45;
    pose.hairLift = -0.25;
    return pose;
  }

  // 0B. MEGA MAN-STYLE WALL CLING / WALL SLIDE (Ronin)
  if (player.wallClingDir !== 0 && !player.onGround) {
    pose.torsoTilt = -0.1;
    pose.headTilt = 0.05;
    pose.leftHipAngle = 0.55;
    pose.leftKneeAngle = 0.9;
    pose.rightHipAngle = 0.25;
    pose.rightKneeAngle = 0.45;
    // Front hand braced solidly against the wall, back hand poised on katana hilt
    pose.frontShoulderAngle = -2.05;
    pose.frontElbowAngle = 0.45;
    pose.backShoulderAngle = 0.45;
    pose.backElbowAngle = -0.95;
    pose.coatSweep = -0.75 + Math.sin(t30 * 14) * 0.08;
    pose.hairLift = -0.68;
    return pose;
  }

  // 0C. KATANA CHARGED HUGE WIDE SLASH (Key 3 Iaijutsu Gale)
  if (player.katanaChargeTimer > 0) {
    const shudder = Math.sin(t30 * 52) * 0.04;
    pose.torsoTilt = 0.36 + shudder;
    pose.headTilt = -0.22;
    pose.bodyOffsetY = 5 * scale;
    pose.leftHipAngle = 0.72;
    pose.leftKneeAngle = 1.12;
    pose.rightHipAngle = -0.52;
    pose.rightKneeAngle = 0.95;
    // Coiled low iaido draw grip at hip
    pose.frontShoulderAngle = 0.65;
    pose.frontElbowAngle = -1.45;
    pose.backShoulderAngle = -0.35;
    pose.backElbowAngle = -1.1;
    pose.coatSweep = -0.82;
    pose.hairLift = -0.45;
    pose.squashX = 1.08;
    pose.squashY = 0.92;
    return pose;
  }

  if (player.katanaMegaSlashTimer > 0) {
    pose.torsoTilt = 0.46;
    pose.headTilt = -0.16;
    pose.bodyOffsetY = 2.2 * scale;
    pose.leftHipAngle = 0.65;
    pose.leftKneeAngle = 0.72;
    pose.rightHipAngle = -0.72;
    pose.rightKneeAngle = 0.4;
    pose.frontShoulderAngle = 1.62;
    pose.frontElbowAngle = -0.05;
    pose.backShoulderAngle = -1.25;
    pose.backElbowAngle = -0.25;
    pose.coatSweep = -1.05;
    pose.hairLift = -0.75;
    return pose;
  }

  // 0D. HAMMER KEY [3] METEOR LEAP SLAM (Big Jump -> Plunging Overhead Crash!)
  if (player.hammerLeapState !== 'none') {
    const plunging = player.hammerLeapState === 'slamming';
    pose.torsoTilt = plunging ? 0.48 : -0.16;
    pose.headTilt = plunging ? 0.14 : -0.15;
    pose.leftHipAngle = plunging ? 0.68 : 0.85;
    pose.leftKneeAngle = plunging ? 0.75 : 1.18;
    pose.rightHipAngle = plunging ? -0.45 : -0.25;
    pose.rightKneeAngle = 0.65;
    pose.frontShoulderAngle = plunging ? 0.75 : -2.65;
    pose.frontElbowAngle = -0.25;
    pose.backShoulderAngle = plunging ? 0.55 : -2.45;
    pose.backElbowAngle = -0.3;
    pose.coatSweep = plunging ? -1.1 : -0.4;
    pose.hairLift = plunging ? -0.8 : 0.25;
    return pose;
  }

  // 0E. CRIMSON RAPIER KEY [3] PHANTOM LUNGE
  if (player.rapierLungeTimer > 0) {
    pose.torsoTilt = 0.48;
    pose.headTilt = -0.22;
    pose.bodyOffsetY = 3.5 * scale;
    pose.leftHipAngle = 0.88;
    pose.leftKneeAngle = 0.75;
    pose.rightHipAngle = -0.95;
    pose.rightKneeAngle = 0.22;
    pose.frontShoulderAngle = 1.58;
    pose.frontElbowAngle = 0.0;
    pose.backShoulderAngle = -1.35;
    pose.backElbowAngle = -0.25;
    pose.coatSweep = -1.1;
    pose.hairLift = -0.85;
    return pose;
  }

  // 0F. OBSIDIAN GREATAXE KEY [3] CYCLONE CLEAVE
  if (player.axeSpinTimer > 0) {
    const spin = Math.sin(t30 * 32);
    pose.torsoTilt = 0.24 * spin;
    pose.bodyOffsetY = 2.5 * scale;
    pose.leftHipAngle = 0.45 * spin;
    pose.leftKneeAngle = 0.55;
    pose.rightHipAngle = -0.45 * spin;
    pose.rightKneeAngle = 0.55;
    pose.frontShoulderAngle = 1.55 * spin;
    pose.frontElbowAngle = -0.15;
    pose.backShoulderAngle = -1.55 * spin;
    pose.backElbowAngle = -0.15;
    pose.coatSweep = -0.85;
    return pose;
  }

  // 0G. STORM NAGINATA KEY [3] TEMPEST VAULT
  if (player.naginataVaultTimer > 0) {
    pose.torsoTilt = 0.32;
    pose.headTilt = -0.12;
    pose.leftHipAngle = 0.78;
    pose.leftKneeAngle = 1.1;
    pose.rightHipAngle = -0.58;
    pose.rightKneeAngle = 0.65;
    pose.frontShoulderAngle = 1.35;
    pose.frontElbowAngle = -0.2;
    pose.backShoulderAngle = -1.1;
    pose.backElbowAngle = -0.4;
    pose.coatSweep = -1.0;
    pose.hairLift = -0.7;
    return pose;
  }

  // 0H. MINSTREL WHIP-ZIP FLIGHT (Invulnerable acrobat glide along whip tether!)
  if (player.minstrelZipActive) {
    pose.torsoTilt = 0.62;
    pose.headTilt = -0.22;
    pose.bodyOffsetY = -2 * scale;
    pose.leftHipAngle = -0.78;
    pose.leftKneeAngle = 0.55;
    pose.rightHipAngle = -0.52;
    pose.rightKneeAngle = 0.92;
    pose.frontShoulderAngle = -1.95;
    pose.frontElbowAngle = -0.15;
    pose.backShoulderAngle = 0.85;
    pose.backElbowAngle = -0.35;
    pose.coatSweep = -1.25;
    pose.hairLift = -0.95;
    pose.squashX = 1.1;
    pose.squashY = 0.92;
    return pose;
  }

  // 0I. MINSTREL VAULT THROW-LAUNCH (Acrobatic tuck-cannonball!)
  if (player.minstrelVaultTimer > 0) {
    const spin = Math.sin(t30 * 28);
    pose.torsoTilt = 0.44 + spin * 0.22;
    pose.headTilt = -0.15;
    pose.leftHipAngle = 0.95;
    pose.leftKneeAngle = 1.25;
    pose.rightHipAngle = 0.65;
    pose.rightKneeAngle = 1.15;
    pose.frontShoulderAngle = 1.25;
    pose.frontElbowAngle = -0.45;
    pose.backShoulderAngle = -0.95;
    pose.backElbowAngle = -0.5;
    pose.coatSweep = -1.1;
    pose.hairLift = -0.8;
    return pose;
  }

  // 0J. MINSTREL ENCORE WALTZ DANCE (Key 3 Musical Spinning Ribbon Dance!)
  if (player.minstrelDanceTimer > 0) {
    const spin = Math.sin(t30 * 24);
    pose.torsoTilt = spin * 0.24;
    pose.headTilt = -spin * 0.14;
    pose.bodyOffsetY = Math.sin(t30 * 16) * 2.5 * scale;
    pose.leftHipAngle = 0.65 * spin;
    pose.leftKneeAngle = 0.45;
    pose.rightHipAngle = -0.72 * spin;
    pose.rightKneeAngle = 0.68;
    pose.frontShoulderAngle = -1.65 + spin * 0.45;
    pose.frontElbowAngle = -0.35;
    pose.backShoulderAngle = 1.35 - spin * 0.45;
    pose.backElbowAngle = -0.35;
    pose.coatSweep = -0.95 + spin * 0.35;
    pose.hairLift = -0.65;
    return pose;
  }

  // 0K. MONK PYRE DASH (Key 3: 8-way charge, lead fist thrust; dive when slamming down)
  if (player.monkDashTimer > 0) {
    const slam = player.monkDashSlam || player.monkDashDirY > 0.35;
    const rising = player.monkDashDirY < -0.35;
    if (slam) {
      pose.torsoTilt = 0.95;
      pose.headTilt = 0.35;
      pose.bodyOffsetY = 2 * scale;
      pose.leftHipAngle = 1.15;
      pose.leftKneeAngle = 1.2;
      pose.rightHipAngle = 0.35;
      pose.rightKneeAngle = 0.7;
      pose.frontShoulderAngle = 2.1;
      pose.frontElbowAngle = 0.15;
      pose.backShoulderAngle = -0.4;
      pose.backElbowAngle = -1.1;
      pose.coatSweep = -1.35;
      pose.hairLift = 0.85;
      pose.squashX = 0.92;
      pose.squashY = 1.1;
    } else if (rising) {
      pose.torsoTilt = -0.35;
      pose.headTilt = -0.2;
      pose.bodyOffsetY = -3 * scale;
      pose.leftHipAngle = -0.7;
      pose.leftKneeAngle = 0.85;
      pose.rightHipAngle = 0.55;
      pose.rightKneeAngle = 0.45;
      pose.frontShoulderAngle = 1.85;
      pose.frontElbowAngle = 0.1;
      pose.backShoulderAngle = -1.55;
      pose.backElbowAngle = -0.3;
      pose.coatSweep = 0.7;
      pose.hairLift = 0.95;
      pose.squashX = 0.96;
      pose.squashY = 1.06;
    } else {
      pose.torsoTilt = 0.58;
      pose.headTilt = -0.24;
      pose.bodyOffsetY = 4 * scale;
      pose.leftHipAngle = 1.0;
      pose.leftKneeAngle = 0.95;
      pose.rightHipAngle = -1.0;
      pose.rightKneeAngle = 0.25;
      pose.frontShoulderAngle = 1.6;
      pose.frontElbowAngle = 0.0;
      pose.backShoulderAngle = -1.35;
      pose.backElbowAngle = -0.5;
      pose.coatSweep = -1.2;
      pose.hairLift = -0.9;
      pose.squashX = 1.08;
      pose.squashY = 0.94;
    }
    return pose;
  }

  // 0K-2. MONK CHARGED JUMP (hold jump on the ground: deep crouch, fists gathered)
  if (player.characterId === 'monk' && player.monkChargeTimer > 0 && player.onGround) {
    const c = Math.min(1, player.monkCharge);
    pose.torsoTilt = 0.42 + c * 0.22;
    pose.headTilt = -0.18;
    pose.bodyOffsetY = (5 + c * 3) * scale;
    pose.leftHipAngle = 0.95;
    pose.leftKneeAngle = 1.35;
    pose.rightHipAngle = -0.7;
    pose.rightKneeAngle = 1.28;
    pose.frontShoulderAngle = 0.85 - c * 0.2;
    pose.frontElbowAngle = -1.45;
    pose.backShoulderAngle = 0.55;
    pose.backElbowAngle = -1.5;
    pose.coatSweep = -0.55;
    pose.hairLift = -0.15 + c * 0.2;
    pose.squashX = 1.06 + c * 0.06;
    pose.squashY = 0.92 - c * 0.04;
    return pose;
  }

  // 0L. MONK CINDER PALM (Spell: wide-stance open-palm thrust)
  if (player.monkPalmTimer > 0) {
    pose.torsoTilt = 0.32;
    pose.headTilt = -0.12;
    pose.bodyOffsetY = 4.5 * scale;
    pose.leftHipAngle = 0.82;
    pose.leftKneeAngle = 0.9;
    pose.rightHipAngle = -0.78;
    pose.rightKneeAngle = 0.3;
    pose.frontShoulderAngle = 1.52;
    pose.frontElbowAngle = 0.05;
    pose.backShoulderAngle = -0.6;
    pose.backElbowAngle = -1.5;
    pose.coatSweep = -0.9;
    pose.hairLift = -0.6;
    return pose;
  }

  // 0M. WIZARD REPULSION NOVA (Key 3: arms flung wide and up, robe flaring)
  if (player.wizardNovaTimer > 0) {
    const prog = 1 - player.wizardNovaTimer / 0.34;
    pose.torsoTilt = -0.12;
    pose.headTilt = -0.2;
    pose.bodyOffsetY = (prog < 0.3 ? 3 : -1) * scale;
    pose.leftHipAngle = 0.35;
    pose.leftKneeAngle = 0.3;
    pose.rightHipAngle = -0.35;
    pose.rightKneeAngle = 0.3;
    pose.frontShoulderAngle = prog < 0.3 ? 0.4 : 2.45;
    pose.frontElbowAngle = prog < 0.3 ? -1.4 : 0.15;
    pose.backShoulderAngle = prog < 0.3 ? -0.4 : -2.45;
    pose.backElbowAngle = prog < 0.3 ? -1.2 : -0.15;
    pose.coatSweep = 0.65;
    pose.hairLift = 0.55;
    return pose;
  }

  // 0N. WIZARD AIR FLOAT (second jump: hover, robe lifting, staff steady)
  if (player.characterId === 'wizard' && player.wizardFloatTimer > 0) {
    const bob = Math.sin(player.animTime * 7) * 1.6 * scale;
    pose.torsoTilt = -0.06;
    pose.headTilt = -0.08;
    pose.bodyOffsetY = -6 * scale + bob;
    pose.leftHipAngle = -0.2;
    pose.leftKneeAngle = 0.45;
    pose.rightHipAngle = 0.25;
    pose.rightKneeAngle = 0.35;
    pose.frontShoulderAngle = 0.55;
    pose.frontElbowAngle = -0.7;
    pose.backShoulderAngle = -0.85;
    pose.backElbowAngle = -0.4;
    pose.coatSweep = 0.55;
    pose.hairLift = 0.7;
    pose.squashX = 0.97;
    pose.squashY = 1.05;
    return pose;
  }

  // 1. TAKING DAMAGE IN AIR (dramatic tumble recoil!)
  if (player.hitStunTimer > 0 && player.isAirKnockback) {
    pose.torsoTilt = -0.58;
    pose.headTilt = -0.35;
    pose.bodyOffsetY = -2 * scale;
    pose.leftHipAngle = 0.72;
    pose.leftKneeAngle = 0.95;
    pose.rightHipAngle = -0.28;
    pose.rightKneeAngle = 0.55;
    pose.frontShoulderAngle = -1.65;
    pose.frontElbowAngle = -0.3;
    pose.backShoulderAngle = -2.1;
    pose.backElbowAngle = -0.4;
    pose.coatSweep = -0.78;
    pose.hairLift = -0.62;
    return pose;
  }

  // 2. TAKING DAMAGE ON FLOOR (staggered hunched flinch!)
  if (player.hitStunTimer > 0) {
    const shudder = Math.sin(t30 * 48) * 0.06;
    pose.torsoTilt = -0.28 + shudder;
    pose.headTilt = -0.26;
    pose.bodyOffsetY = 3.2 * scale;
    pose.leftHipAngle = -0.34;
    pose.leftKneeAngle = 0.52;
    pose.rightHipAngle = 0.36;
    pose.rightKneeAngle = 0.42;
    pose.frontShoulderAngle = 0.75;
    pose.frontElbowAngle = -1.35;
    pose.backShoulderAngle = -0.68;
    pose.backElbowAngle = -0.6;
    pose.coatSweep = -0.48;
    pose.hairLift = -0.35;
    pose.squashX = 1.07;
    pose.squashY = 0.93;
    return pose;
  }

  // 3. DASH ATTACK / BACKDASH
  if (player.dashAttackTimer > 0) {
    pose.torsoTilt = 0.42;
    pose.headTilt = -0.18;
    pose.bodyOffsetY = 3 * scale;
    pose.leftHipAngle = -0.82;
    pose.leftKneeAngle = 0.45;
    pose.rightHipAngle = 0.68;
    pose.rightKneeAngle = 0.72;
    pose.frontShoulderAngle = 1.45;
    pose.frontElbowAngle = -0.08;
    pose.backShoulderAngle = -1.15;
    pose.backElbowAngle = -0.35;
    pose.coatSweep = -0.95;
    pose.hairLift = -0.65;
    return pose;
  }

  if (player.backdashTimer > 0) {
    pose.torsoTilt = -0.24;
    pose.headTilt = 0.1;
    pose.bodyOffsetY = 2.5 * scale;
    pose.leftHipAngle = 0.58;
    pose.leftKneeAngle = 0.52;
    pose.rightHipAngle = -0.52;
    pose.rightKneeAngle = 0.3;
    pose.frontShoulderAngle = 0.85;
    pose.frontElbowAngle = -0.9;
    pose.backShoulderAngle = -0.85;
    pose.backElbowAngle = -0.5;
    pose.coatSweep = 0.52;
    pose.hairLift = 0.36;
    return pose;
  }

  // 4. JUMPING & FALLING (smooth velocity-driven anime air poses!)
  if (isAirborne) {
    const rising = player.vy < -65;
    const falling = player.vy > 85;
    if (rising) {
      pose.torsoTilt = 0.14;
      pose.headTilt = -0.08;
      pose.leftHipAngle = 0.66;
      pose.leftKneeAngle = 1.05;
      pose.rightHipAngle = -0.28;
      pose.rightKneeAngle = 0.45;
      pose.frontShoulderAngle = -0.55;
      pose.frontElbowAngle = -0.75;
      pose.backShoulderAngle = -0.88;
      pose.backElbowAngle = -0.45;
      pose.coatSweep = -0.22;
      pose.hairLift = 0.25;
      pose.squashX = 0.94;
      pose.squashY = 1.06;
    } else if (falling) {
      pose.torsoTilt = 0.08;
      pose.headTilt = 0.12;
      pose.leftHipAngle = 0.38;
      pose.leftKneeAngle = 0.58;
      pose.rightHipAngle = -0.34;
      pose.rightKneeAngle = 0.32;
      pose.frontShoulderAngle = -1.25;
      pose.frontElbowAngle = -0.55;
      pose.backShoulderAngle = -1.48;
      pose.backElbowAngle = -0.45;
      pose.coatSweep = -0.66;
      pose.hairLift = -0.58;
    } else {
      pose.torsoTilt = 0.18;
      pose.leftHipAngle = 0.52;
      pose.leftKneeAngle = 0.88;
      pose.rightHipAngle = -0.18;
      pose.rightKneeAngle = 0.56;
      pose.frontShoulderAngle = -0.82;
      pose.frontElbowAngle = -0.65;
      pose.backShoulderAngle = -1.05;
      pose.backElbowAngle = -0.5;
      pose.coatSweep = -0.45;
      pose.hairLift = -0.2;
    }
  } else if (player.crouching) {
    if (isMoving) {
      // Smooth low stealth crouch-walk cycle!
      const sneakCycle = t30 * 9.6;
      const s = Math.sin(sneakCycle);
      const c = Math.cos(sneakCycle);
      pose.torsoTilt = 0.34 + Math.abs(s) * 0.06;
      pose.headTilt = -0.14;
      pose.bodyOffsetY = 2.6 * scale + Math.abs(c) * 1.6 * scale;
      pose.leftHipAngle = 0.52 + s * 0.48;
      pose.leftKneeAngle = Math.max(0.85, 1.15 - c * 0.35);
      pose.rightHipAngle = -0.18 - s * 0.48;
      pose.rightKneeAngle = Math.max(0.85, 1.15 + c * 0.35);
      pose.frontShoulderAngle = 0.48 - s * 0.28;
      pose.frontElbowAngle = -0.82;
      pose.backShoulderAngle = -0.42 + s * 0.28;
      pose.backElbowAngle = -0.7;
      pose.coatSweep = -0.42 + s * 0.12;
      pose.hairLift = -0.18;
    } else {
      pose.torsoTilt = 0.24;
      pose.headTilt = -0.1;
      pose.bodyOffsetY = 2.5 * scale;
      pose.leftHipAngle = 0.78;
      pose.leftKneeAngle = 1.25;
      pose.rightHipAngle = -0.42;
      pose.rightKneeAngle = 1.15;
      pose.frontShoulderAngle = 0.45;
      pose.frontElbowAngle = -0.7;
      pose.backShoulderAngle = -0.45;
      pose.backElbowAngle = -0.6;
      pose.coatSweep = -0.32;
    }
  } else if (isMoving) {
    const runRate = player.characterId === 'brute' ? 10.2 : player.characterId === 'hunter' ? 14.2 : 13.4;
    const cycle = t30 * runRate;
    const s = Math.sin(cycle);
    const c = Math.cos(cycle);
    const bob = Math.abs(c) * 3.4 * scale;

    pose.bodyOffsetY = -bob + 1.8 * scale;
    pose.torsoTilt = player.characterId === 'brute' ? 0.18 : 0.25;
    pose.headTilt = -0.09 + s * 0.04;

    pose.leftHipAngle = s * 0.78;
    pose.leftKneeAngle = Math.max(0.12, -c * 0.92 + 0.34);
    pose.rightHipAngle = -s * 0.78;
    pose.rightKneeAngle = Math.max(0.12, c * 0.92 + 0.34);

    pose.frontShoulderAngle = -s * 0.72 + 0.12;
    pose.frontElbowAngle = -0.82 + Math.max(0, -s) * 0.35;
    pose.backShoulderAngle = s * 0.72 - 0.12;
    pose.backElbowAngle = -0.78 + Math.max(0, s) * 0.35;

    pose.coatSweep = -0.58 + Math.sin(cycle * 2) * 0.12;
    pose.hairLift = -0.36 + Math.sin(cycle * 2 - 0.6) * 0.11;
  }

  // 7. LANDING COMPRESSION
  if (player.landTimer > 0 && player.onGround) {
    const pLand = Math.min(1, player.landTimer / 0.16);
    const curve = Math.sin(pLand * Math.PI);
    pose.bodyOffsetY += curve * 5.2 * scale;
    pose.torsoTilt += curve * 0.16;
    pose.leftKneeAngle += curve * 0.52;
    pose.rightKneeAngle += curve * 0.48;
    pose.squashX = 1 + curve * 0.13;
    pose.squashY = 1 - curve * 0.12;
    pose.coatSweep -= curve * 0.25;
  }

  // 8. WEAPON SWING KINEMATICS
  if (player.attackState !== 'idle') {
    const weapon = player.attackWeapon;
    if (weapon === 'hammer' || weapon === 'greataxe') {
      if (player.attackState === 'startup') {
        const prog =
          player.attackTotalStartup > 0
            ? Math.max(0, Math.min(1, 1 - player.attackTimer / player.attackTotalStartup))
            : 1;
        pose.torsoTilt = -0.22 * prog;
        pose.frontShoulderAngle = -2.45 * prog - 0.3;
        pose.frontElbowAngle = -0.35;
        pose.backShoulderAngle = -2.25 * prog - 0.2;
        pose.backElbowAngle = -0.4;
        pose.hairLift = 0.22;
      } else if (player.attackState === 'active') {
        pose.torsoTilt = 0.44;
        pose.bodyOffsetY += 3 * scale;
        pose.frontShoulderAngle = weapon === 'greataxe' ? 1.48 : 1.18;
        pose.frontElbowAngle = -0.1;
        pose.backShoulderAngle = weapon === 'greataxe' ? 0.6 : 0.95;
        pose.backElbowAngle = -0.2;
        pose.coatSweep = -0.72;
        pose.hairLift = -0.45;
      } else {
        pose.torsoTilt = 0.26;
        pose.frontShoulderAngle = 0.72;
        pose.frontElbowAngle = -0.35;
        pose.backShoulderAngle = 0.45;
        pose.backElbowAngle = -0.45;
      }
    } else if (weapon === 'ash_wraps') {
      // Monk chain: lead jab, rear jab, then a deep open-palm strike.
      const step = player.monkComboStep;
      const st = player.attackState;
      if (step === 2) {
        pose.torsoTilt = st === 'startup' ? -0.08 : 0.4;
        pose.bodyOffsetY += (st === 'startup' ? 2 : 4.5) * scale;
        pose.leftHipAngle = 0.8;
        pose.leftKneeAngle = 0.85;
        pose.rightHipAngle = -0.75;
        pose.rightKneeAngle = 0.3;
        pose.frontShoulderAngle = st === 'startup' ? 0.2 : st === 'active' ? 1.55 : 1.2;
        pose.frontElbowAngle = st === 'startup' ? -1.7 : 0.02;
        pose.backShoulderAngle = -0.7;
        pose.backElbowAngle = -1.4;
        pose.coatSweep = -0.85;
      } else {
        const lead = step === 0;
        const extended = st === 'active' ? 1.58 : st === 'recovery' ? 1.0 : 0.55;
        const elbow = st === 'active' ? 0.0 : st === 'recovery' ? -0.5 : -1.6;
        pose.torsoTilt = 0.22 + (st === 'active' ? 0.12 : 0);
        pose.leftHipAngle = 0.45;
        pose.leftKneeAngle = 0.5;
        pose.rightHipAngle = -0.4;
        pose.rightKneeAngle = 0.35;
        if (lead) {
          pose.frontShoulderAngle = extended;
          pose.frontElbowAngle = elbow;
          pose.backShoulderAngle = 0.5;
          pose.backElbowAngle = -1.7;
        } else {
          pose.backShoulderAngle = extended;
          pose.backElbowAngle = elbow;
          pose.frontShoulderAngle = 0.5;
          pose.frontElbowAngle = -1.7;
        }
        pose.coatSweep = -0.6;
      }
    } else if (weapon === 'spire_staff') {
      if (player.attackState === 'startup') {
        pose.torsoTilt = -0.08;
        pose.frontShoulderAngle = 0.15;
        pose.frontElbowAngle = -1.2;
        pose.backShoulderAngle = 0.9;
        pose.backElbowAngle = -0.6;
      } else if (player.attackState === 'active') {
        pose.torsoTilt = 0.22;
        pose.frontShoulderAngle = 1.35;
        pose.frontElbowAngle = -0.1;
        pose.backShoulderAngle = -0.6;
        pose.coatSweep = -0.55;
      } else {
        pose.torsoTilt = 0.12;
        pose.frontShoulderAngle = 0.95;
        pose.frontElbowAngle = -0.35;
      }
    } else if (weapon === 'rapier') {
      if (player.attackState === 'startup') {
        pose.torsoTilt = -0.14;
        pose.frontShoulderAngle = 0.45;
        pose.frontElbowAngle = -1.45;
        pose.backShoulderAngle = -0.85;
      } else if (player.attackState === 'active') {
        pose.torsoTilt = 0.38;
        pose.frontShoulderAngle = 1.56;
        pose.frontElbowAngle = 0.0;
        pose.backShoulderAngle = -1.25;
        pose.coatSweep = -0.85;
      } else {
        pose.torsoTilt = 0.14;
        pose.frontShoulderAngle = 0.95;
        pose.frontElbowAngle = -0.45;
      }
    } else if (weapon === 'sword' || weapon === 'katana' || weapon === 'naginata') {
      if (player.attackState === 'startup') {
        pose.torsoTilt = -0.18;
        pose.frontShoulderAngle = weapon === 'katana' ? -1.85 : -2.15;
        pose.frontElbowAngle = -0.6;
        pose.backShoulderAngle = -0.75;
      } else if (player.attackState === 'active') {
        pose.torsoTilt = 0.34;
        pose.frontShoulderAngle = 1.54;
        pose.frontElbowAngle = -0.05;
        pose.backShoulderAngle = -1.0;
        pose.coatSweep = -0.76;
      } else {
        pose.torsoTilt = 0.16;
        pose.frontShoulderAngle = 0.82;
        pose.frontElbowAngle = -0.42;
      }
    } else {
      if (player.attackState === 'startup') {
        pose.torsoTilt = -0.22;
        pose.frontShoulderAngle = -1.65;
        pose.frontElbowAngle = -0.7;
        pose.backShoulderAngle = 0.45;
      } else if (player.attackState === 'active') {
        pose.torsoTilt = 0.28;
        pose.frontShoulderAngle = 1.55;
        pose.frontElbowAngle = -0.04;
        pose.backShoulderAngle = -0.88;
        pose.coatSweep = -0.65;
      } else {
        pose.torsoTilt = 0.1;
        pose.frontShoulderAngle = 0.92;
        pose.frontElbowAngle = -0.38;
      }
    }
  } else if (player.wizardCastTimer > 0 && player.characterId === 'wizard') {
    // Wizard spell cast (Chain of Storms): staff thrust forward
    pose.torsoTilt = 0.18;
    pose.frontShoulderAngle = 1.3;
    pose.frontElbowAngle = -0.15;
    pose.backShoulderAngle = -0.7;
    pose.coatSweep = -0.5;
  }

  return pose;
}

function drawIdleHeldWeapon(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponId,
  scale: number,
  trimGold: string,
  ember = '#f97316'
): void {
  // affinity-v1: evolved weapons grow per tier and get their tier overlay
  const s = scale * heldScale();
  drawIdleHeldWeaponBase(ctx, weapon, s, trimGold, ember);
  drawHeldWeaponEvo(ctx, weapon, s);
}

function drawIdleHeldWeaponBase(
  ctx: CanvasRenderingContext2D,
  weapon: WeaponId,
  scale: number,
  trimGold: string,
  ember = '#f97316'
): void {
  if (weapon === 'katana') {
    ctx.fillStyle = '#9f1239';
    ctx.fillRect(-1.5 * scale, -2 * scale, 3 * scale, 7 * scale);
    ctx.fillStyle = trimGold;
    ctx.fillRect(-4 * scale, 4.5 * scale, 8 * scale, 2 * scale);
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 6 * scale);
    ctx.quadraticCurveTo(3.5 * scale, 16 * scale, 1.5 * scale, 25 * scale);
    ctx.stroke();
  } else if (weapon === 'rapier') {
    // Sleek Crimson Rapier with ornate basket hilt
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.arc(0, 3 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = trimGold;
    ctx.lineWidth = 1.3 * scale;
    ctx.stroke();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.7 * scale;
    ctx.beginPath();
    ctx.moveTo(0, 5 * scale);
    ctx.lineTo(0, 26 * scale);
    ctx.stroke();
  } else if (weapon === 'naginata') {
    // Long Storm Naginata polearm with curved azure blade
    ctx.fillStyle = '#5c3c24';
    ctx.fillRect(-1.4 * scale, -10 * scale, 2.8 * scale, 28 * scale);
    ctx.fillStyle = trimGold;
    ctx.fillRect(-2.6 * scale, 16 * scale, 5.2 * scale, 2.4 * scale);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-1 * scale, 18 * scale);
    ctx.quadraticCurveTo(4 * scale, 25 * scale, 0.5 * scale, 32 * scale);
    ctx.lineTo(-2 * scale, 20 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (weapon === 'greataxe') {
    // Massive Obsidian Greataxe with molten edge
    ctx.fillStyle = '#57534e';
    ctx.fillRect(-2.2 * scale, -4 * scale, 4.4 * scale, 26 * scale);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-1 * scale, 12 * scale);
    ctx.quadraticCurveTo(13 * scale, 14 * scale, 11 * scale, 24 * scale);
    ctx.lineTo(-1 * scale, 22 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
  } else if (weapon === 'sword') {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-1.5 * scale, 2 * scale, 3 * scale, 18 * scale);
    ctx.fillStyle = trimGold;
    ctx.fillRect(-4.5 * scale, 1 * scale, 9 * scale, 2.5 * scale);
  } else if (weapon === 'hammer') {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(-1.8 * scale, -2 * scale, 3.6 * scale, 20 * scale);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6.5 * scale, 14 * scale, 13 * scale, 8 * scale);
    ctx.fillStyle = ember;
    ctx.fillRect(-5 * scale, 17 * scale, 10 * scale, 2 * scale);
  } else {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-1.6 * scale, 0, 3.2 * scale, 9 * scale);
    ctx.strokeStyle = trimGold;
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(1 * scale, 10 * scale, 4 * scale, 0, Math.PI * 1.5);
    ctx.stroke();
  }
}

// ============================================================================
// 1. ANIME YOUNG ADULT BOY (White Hair, Dark Vampiric Coat & Crimson Lining)
// ============================================================================
function drawAnimeVampireBoy(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  pose: LimbPose,
  flash: boolean,
  isHurt: boolean,
  weapon: WeaponId,
  attackState: Player['attackState']
): void {
  const hipY = -h * 0.44 + pose.bodyOffsetY;
  const shoulderY = -h * 0.74 + pose.bodyOffsetY;
  const thighLen = h * 0.23;
  const shinLen = h * 0.22;
  const upperArmLen = h * 0.16;
  const foreArmLen = h * 0.16;

  ctx.scale(pose.squashX, pose.squashY);

  const coatOuter = flash ? '#ffffff' : '#131622';
  const coatMid = flash ? '#ffffff' : '#1e2336';
  const coatCrimson = flash ? '#ffffff' : '#8f1628';
  const pantsCol = flash ? '#ffffff' : '#0f111a';
  const bootCol = flash ? '#ffffff' : '#1c1d26';
  const trimGold = flash ? '#ffffff' : '#d8a648';
  const skinCol = flash ? '#ffffff' : '#f1e5dd';
  const hairMain = flash ? '#ffffff' : '#edf2fa';
  const hairShade = flash ? '#ffffff' : '#b7c3d9';

  // Back Coat Tail
  ctx.save();
  ctx.translate(-w * 0.1, shoulderY + 2 * scale);
  ctx.rotate(pose.torsoTilt + pose.coatSweep * 0.72);
  ctx.fillStyle = coatCrimson;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, 0);
  ctx.quadraticCurveTo(-w * 0.56, h * 0.34, -w * 0.68, h * 0.64);
  ctx.lineTo(-w * 0.08, h * 0.56);
  ctx.lineTo(w * 0.14, h * 0.18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = coatOuter;
  ctx.beginPath();
  ctx.moveTo(-w * 0.22, 0);
  ctx.quadraticCurveTo(-w * 0.62, h * 0.32, -w * 0.74, h * 0.61);
  ctx.lineTo(-w * 0.26, h * 0.58);
  ctx.lineTo(w * 0.04, h * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back Arm
  const backShoulderX = -w * 0.1 + Math.sin(pose.torsoTilt) * 3 * scale;
  const backElbow = drawLimbSegment(ctx, backShoulderX, shoulderY, pose.backShoulderAngle, upperArmLen, 4.6 * scale, coatOuter);
  drawLimbSegment(ctx, backElbow.x, backElbow.y, pose.backShoulderAngle + pose.backElbowAngle, foreArmLen, 4.0 * scale, coatMid);

  // Back Leg
  const backKnee = drawLimbSegment(ctx, -w * 0.06, hipY, pose.rightHipAngle, thighLen, 5.6 * scale, pantsCol);
  const backFoot = drawLimbSegment(ctx, backKnee.x, backKnee.y, pose.rightHipAngle - pose.rightKneeAngle, shinLen, 5.0 * scale, bootCol);
  ctx.fillStyle = bootCol;
  ctx.fillRect(backFoot.x - 1.5 * scale, backFoot.y - 2.5 * scale, 7 * scale, 3.8 * scale);

  // Front Leg
  const frontKnee = drawLimbSegment(ctx, w * 0.06, hipY, pose.leftHipAngle, thighLen, 5.8 * scale, '#161926');
  const frontFoot = drawLimbSegment(ctx, frontKnee.x, frontKnee.y, pose.leftHipAngle - pose.leftKneeAngle, shinLen, 5.2 * scale, '#242736', '#434a66');
  ctx.fillStyle = '#242736';
  ctx.fillRect(frontFoot.x - 1.5 * scale, frontFoot.y - 2.5 * scale, 7.5 * scale, 3.8 * scale);

  // Torso
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt);

  const torsoH = h * 0.34;
  ctx.fillStyle = coatMid;
  ctx.beginPath();
  ctx.moveTo(-w * 0.3, -torsoH);
  ctx.lineTo(w * 0.3, -torsoH);
  ctx.lineTo(w * 0.23, 3 * scale);
  ctx.lineTo(-w * 0.25, 3 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = coatCrimson;
  ctx.beginPath();
  ctx.moveTo(w * 0.04, -torsoH + 1 * scale);
  ctx.lineTo(w * 0.22, -torsoH + 2 * scale);
  ctx.lineTo(w * 0.14, -torsoH * 0.45);
  ctx.lineTo(w * 0.02, -torsoH * 0.58);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = trimGold;
  ctx.fillRect(-w * 0.26, -3 * scale, w * 0.52, 2.8 * scale);
  ctx.fillRect(w * 0.08, -torsoH + 4 * scale, 3 * scale, 3 * scale);

  ctx.fillStyle = coatOuter;
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, -torsoH + 2 * scale);
  ctx.lineTo(-w * 0.42, -torsoH - 7 * scale);
  ctx.lineTo(w * 0.05, -torsoH - 5 * scale);
  ctx.lineTo(w * 0.18, -torsoH + 2 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = coatCrimson;
  ctx.lineWidth = Math.max(1.2, 1.6 * scale);
  ctx.beginPath();
  ctx.moveTo(-w * 0.37, -torsoH - 6 * scale);
  ctx.lineTo(w * 0.05, -torsoH - 4 * scale);
  ctx.stroke();

  ctx.fillStyle = coatOuter;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, 0);
  ctx.lineTo(-w * 0.42 + pose.coatSweep * 10 * scale, h * 0.24);
  ctx.lineTo(-w * 0.04, h * 0.21);
  ctx.lineTo(w * 0.1, 0);
  ctx.closePath();
  ctx.fill();

  // Head & White Hair
  ctx.save();
  ctx.translate(w * 0.04, -torsoH - 3.5 * scale);
  ctx.rotate(pose.headTilt);

  const headR = w * 0.33;
  ctx.fillStyle = hairShade;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, -headR * 1.1);
  ctx.quadraticCurveTo(
    -headR * 1.6,
    -headR * 0.2 + pose.hairLift * 14 * scale,
    -headR * 1.75,
    headR * 0.9 + pose.hairLift * 18 * scale
  );
  ctx.lineTo(-headR * 0.75, headR * 0.55 + pose.hairLift * 10 * scale);
  ctx.lineTo(-headR * 1.15, headR * 1.15 + pose.hairLift * 15 * scale);
  ctx.lineTo(-headR * 0.2, headR * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.65, -headR * 1.05);
  ctx.lineTo(headR * 0.85, -headR * 0.95);
  ctx.lineTo(headR * 0.92, -headR * 0.15);
  ctx.lineTo(headR * 0.62, headR * 0.45);
  ctx.lineTo(-headR * 0.35, headR * 0.32);
  ctx.closePath();
  ctx.fill();

  if (!flash) {
    if (isHurt) {
      ctx.strokeStyle = '#1b1d28';
      ctx.lineWidth = Math.max(1.2, 1.5 * scale);
      ctx.beginPath();
      ctx.moveTo(headR * 0.22, -headR * 0.38);
      ctx.lineTo(headR * 0.7, -headR * 0.22);
      ctx.moveTo(headR * 0.7, -headR * 0.38);
      ctx.lineTo(headR * 0.22, -headR * 0.22);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0c0d14';
      ctx.fillRect(headR * 0.22, -headR * 0.46, headR * 0.52, headR * 0.34);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(headR * 0.34, -headR * 0.42, headR * 0.34, headR * 0.26);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(headR * 0.48, -headR * 0.4, Math.max(1.2, 1.5 * scale), Math.max(1.2, 1.5 * scale));
    }
  }

  ctx.fillStyle = hairMain;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.95, -headR * 0.4);
  ctx.lineTo(-headR * 1.15, -headR * 1.15);
  ctx.lineTo(-headR * 0.45, -headR * 1.55);
  ctx.lineTo(headR * 0.15, -headR * 1.38);
  ctx.lineTo(headR * 0.72, -headR * 1.48);
  ctx.lineTo(headR * 1.12, -headR * 0.92);
  ctx.lineTo(headR * 1.04, -headR * 0.32);
  ctx.lineTo(headR * 0.64, -headR * 0.62);
  ctx.lineTo(headR * 0.35, -headR * 0.2);
  ctx.lineTo(headR * 0.05, -headR * 0.58);
  ctx.lineTo(-headR * 0.22, -headR * 0.05);
  ctx.lineTo(-headR * 0.55, -headR * 0.35);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.restore();

  // Front Arm + Held Weapon
  const fShoulderX = w * 0.08 + Math.sin(pose.torsoTilt) * 4 * scale;
  const fElbow = drawLimbSegment(ctx, fShoulderX, shoulderY + 1 * scale, pose.frontShoulderAngle, upperArmLen, 5.0 * scale, coatMid, '#343c57');
  const fHand = drawLimbSegment(ctx, fElbow.x, fElbow.y, pose.frontShoulderAngle + pose.frontElbowAngle, foreArmLen, 4.3 * scale, coatOuter);

  ctx.fillStyle = flash ? '#ffffff' : '#2a2f42';
  ctx.beginPath();
  ctx.arc(fHand.x, fHand.y, 2.6 * scale, 0, Math.PI * 2);
  ctx.fill();

  if (attackState === 'idle') {
    ctx.save();
    ctx.translate(fHand.x, fHand.y);
    ctx.rotate(pose.frontShoulderAngle + pose.frontElbowAngle + 0.45);
    drawIdleHeldWeapon(ctx, weapon, scale, trimGold);
    ctx.restore();
  }
}

// ============================================================================
// 2. IRON BRUTE (Heavy Armored Juggernaut with War Hammer)
// ============================================================================
function drawIronBrute(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  pose: LimbPose,
  flash: boolean,
  weapon: WeaponId,
  attackState: Player['attackState']
): void {
  const hipY = -h * 0.4 + pose.bodyOffsetY;
  const shoulderY = -h * 0.74 + pose.bodyOffsetY;
  const thighLen = h * 0.21;
  const shinLen = h * 0.2;
  const upperArmLen = h * 0.18;
  const foreArmLen = h * 0.17;

  ctx.scale(pose.squashX, pose.squashY);

  const ironDark = flash ? '#ffffff' : '#222631';
  const ironPlate = flash ? '#ffffff' : '#3a4152';
  const ironEdge = flash ? '#ffffff' : '#64748b';
  const cloakFur = flash ? '#ffffff' : '#4a231c';
  const ember = flash ? '#ffffff' : '#f97316';

  ctx.save();
  ctx.translate(-w * 0.15, shoulderY);
  ctx.rotate(pose.torsoTilt + pose.coatSweep * 0.55);
  ctx.fillStyle = cloakFur;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, 0);
  ctx.lineTo(-w * 0.58, h * 0.52);
  ctx.lineTo(-w * 0.05, h * 0.48);
  ctx.lineTo(w * 0.12, h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const backElbow = drawLimbSegment(ctx, -w * 0.12, shoulderY + 2 * scale, pose.backShoulderAngle, upperArmLen, 7.2 * scale, ironDark);
  drawLimbSegment(ctx, backElbow.x, backElbow.y, pose.backShoulderAngle + pose.backElbowAngle, foreArmLen, 6.6 * scale, ironPlate);

  const backKnee = drawLimbSegment(ctx, -w * 0.1, hipY, pose.rightHipAngle, thighLen, 8.2 * scale, ironDark);
  const backFoot = drawLimbSegment(ctx, backKnee.x, backKnee.y, pose.rightHipAngle - pose.rightKneeAngle, shinLen, 8.0 * scale, ironPlate);
  ctx.fillStyle = ironDark;
  ctx.fillRect(backFoot.x - 2 * scale, backFoot.y - 3 * scale, 10 * scale, 5 * scale);

  const frontKnee = drawLimbSegment(ctx, w * 0.1, hipY, pose.leftHipAngle, thighLen, 8.6 * scale, ironPlate);
  const frontFoot = drawLimbSegment(ctx, frontKnee.x, frontKnee.y, pose.leftHipAngle - pose.leftKneeAngle, shinLen, 8.4 * scale, ironPlate, ironEdge);
  ctx.fillStyle = ironPlate;
  ctx.fillRect(frontFoot.x - 2 * scale, frontFoot.y - 3 * scale, 10.5 * scale, 5 * scale);

  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt);

  const torsoH = h * 0.36;
  ctx.fillStyle = ironPlate;
  ctx.beginPath();
  ctx.moveTo(-w * 0.45, -torsoH);
  ctx.lineTo(w * 0.44, -torsoH);
  ctx.lineTo(w * 0.32, 4 * scale);
  ctx.lineTo(-w * 0.34, 4 * scale);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = ironEdge;
  ctx.fillRect(-w * 0.34, -torsoH + 4 * scale, w * 0.68, 3.5 * scale);
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(-w * 0.35, -3 * scale, w * 0.7, 5 * scale);
  ctx.fillStyle = ember;
  ctx.fillRect(-3 * scale, -2.5 * scale, 6 * scale, 4 * scale);

  ctx.fillStyle = ironPlate;
  ctx.beginPath();
  ctx.arc(w * 0.12, -torsoH + 2 * scale, w * 0.28, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = ironEdge;
  ctx.lineWidth = 1.6 * scale;
  ctx.stroke();

  ctx.save();
  ctx.translate(w * 0.05, -torsoH - 3 * scale);
  ctx.rotate(pose.headTilt);

  const hr = w * 0.28;
  ctx.fillStyle = ironPlate;
  ctx.fillRect(-hr, -hr * 1.7, hr * 2, hr * 1.85);
  ctx.fillStyle = ironDark;
  ctx.fillRect(-hr * 0.2, -hr * 1.15, hr * 1.15, hr * 0.42);
  ctx.fillStyle = ember;
  ctx.fillRect(hr * 0.2, -hr * 1.02, hr * 0.58, hr * 0.18);

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(-hr * 0.8, -hr * 1.4);
  ctx.quadraticCurveTo(-hr * 1.7, -hr * 1.9, -hr * 1.45, -hr * 2.6);
  ctx.moveTo(hr * 0.65, -hr * 1.4);
  ctx.quadraticCurveTo(hr * 1.4, -hr * 1.9, hr * 1.15, -hr * 2.55);
  ctx.stroke();

  ctx.restore();
  ctx.restore();

  const fElbow = drawLimbSegment(ctx, w * 0.12, shoulderY + 3 * scale, pose.frontShoulderAngle, upperArmLen, 7.8 * scale, ironPlate, ironEdge);
  const fHand = drawLimbSegment(ctx, fElbow.x, fElbow.y, pose.frontShoulderAngle + pose.frontElbowAngle, foreArmLen, 7.2 * scale, ironDark);

  if (attackState === 'idle') {
    ctx.save();
    ctx.translate(fHand.x, fHand.y);
    ctx.rotate(pose.frontShoulderAngle + pose.frontElbowAngle - 1.1);
    if (weapon === 'hammer') {
      ctx.fillStyle = '#57534e';
      ctx.fillRect(-2.4 * scale, -24 * scale, 4.8 * scale, 32 * scale);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-10 * scale, -32 * scale, 20 * scale, 12 * scale);
      ctx.fillStyle = ember;
      ctx.fillRect(-8 * scale, -28 * scale, 16 * scale, 2.5 * scale);
      drawBruteHammerEvo(ctx, scale);
    } else {
      ctx.rotate(1.55);
      drawIdleHeldWeapon(ctx, weapon, scale, '#e5a93c', ember);
    }
    ctx.restore();
  }
}

// ============================================================================
// 3. RONIN SWORDSMAN (Dark Indigo Haori, Crimson Scarf, Kasa Hat & Katana!)
// ============================================================================
function drawRoninSwordsman(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  pose: LimbPose,
  flash: boolean,
  isHurt: boolean,
  weapon: WeaponId,
  attackState: Player['attackState']
): void {
  const hipY = -h * 0.44 + pose.bodyOffsetY;
  const shoulderY = -h * 0.74 + pose.bodyOffsetY;
  const thighLen = h * 0.23;
  const shinLen = h * 0.22;
  const upperArmLen = h * 0.16;
  const foreArmLen = h * 0.16;

  ctx.scale(pose.squashX, pose.squashY);

  const kimonoDark = flash ? '#ffffff' : '#111827';
  const haoriIndigo = flash ? '#ffffff' : '#1e293b';
  const scarfRed = flash ? '#ffffff' : '#e11d48';
  const scarfShade = flash ? '#ffffff' : '#9f1239';
  const hakamaCol = flash ? '#ffffff' : '#0f172a';
  const wrapWhite = flash ? '#ffffff' : '#cbd5e1';
  const kasaCol = flash ? '#ffffff' : '#3b2e26';
  const kasaRim = flash ? '#ffffff' : '#b45309';
  const skinCol = flash ? '#ffffff' : '#ebd7c7';
  const goldTrim = flash ? '#ffffff' : '#e5a93c';

  // Flowing Crimson Ronin Scarf trailing dynamically behind!
  ctx.save();
  ctx.translate(-w * 0.12, shoulderY - 1 * scale);
  ctx.rotate(pose.torsoTilt + pose.coatSweep * 0.85);
  ctx.fillStyle = scarfShade;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-w * 0.75, h * 0.1 + pose.hairLift * 14 * scale, -w * 1.15, h * 0.24 + pose.hairLift * 18 * scale);
  ctx.lineTo(-w * 0.95, h * 0.34 + pose.hairLift * 15 * scale);
  ctx.quadraticCurveTo(-w * 0.45, h * 0.18, w * 0.1, h * 0.09);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = scarfRed;
  ctx.beginPath();
  ctx.moveTo(0, -1 * scale);
  ctx.quadraticCurveTo(-w * 0.65, h * 0.05 + pose.hairLift * 10 * scale, -w * 1.0, h * 0.16 + pose.hairLift * 14 * scale);
  ctx.lineTo(-w * 0.82, h * 0.24 + pose.hairLift * 12 * scale);
  ctx.quadraticCurveTo(-w * 0.38, h * 0.12, w * 0.08, h * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back Arm
  const backShoulderX = -w * 0.08 + Math.sin(pose.torsoTilt) * 3 * scale;
  const backElbow = drawLimbSegment(ctx, backShoulderX, shoulderY, pose.backShoulderAngle, upperArmLen, 5.2 * scale, kimonoDark);
  drawLimbSegment(ctx, backElbow.x, backElbow.y, pose.backShoulderAngle + pose.backElbowAngle, foreArmLen, 4.2 * scale, wrapWhite);

  // Back Leg (Wide pleated hakama + shin wraps)
  const backKnee = drawLimbSegment(ctx, -w * 0.06, hipY, pose.rightHipAngle, thighLen, 6.8 * scale, hakamaCol);
  const backFoot = drawLimbSegment(ctx, backKnee.x, backKnee.y, pose.rightHipAngle - pose.rightKneeAngle, shinLen, 4.6 * scale, wrapWhite);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(backFoot.x - 1.5 * scale, backFoot.y - 2 * scale, 7 * scale, 3 * scale);

  // Front Leg
  const frontKnee = drawLimbSegment(ctx, w * 0.06, hipY, pose.leftHipAngle, thighLen, 7.2 * scale, haoriIndigo);
  const frontFoot = drawLimbSegment(ctx, frontKnee.x, frontKnee.y, pose.leftHipAngle - pose.leftKneeAngle, shinLen, 4.8 * scale, wrapWhite);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(frontFoot.x - 1.5 * scale, frontFoot.y - 2 * scale, 7.5 * scale, 3 * scale);

  // Torso (Samurai Haori Jacket + Obi Sash + Sheathed Katana Scabbard at hip)
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt);

  const torsoH = h * 0.34;
  ctx.fillStyle = haoriIndigo;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -torsoH);
  ctx.lineTo(w * 0.32, -torsoH);
  ctx.lineTo(w * 0.26, 4 * scale);
  ctx.lineTo(-w * 0.28, 4 * scale);
  ctx.closePath();
  ctx.fill();

  // Crossed kimono lapel
  ctx.strokeStyle = scarfRed;
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -torsoH + 1 * scale);
  ctx.lineTo(w * 0.18, -3 * scale);
  ctx.stroke();

  // Crimson Obi Waist Sash
  ctx.fillStyle = scarfRed;
  ctx.fillRect(-w * 0.3, -4 * scale, w * 0.58, 5 * scale);

  // Lacquered Katana Saya (scabbard) angled across hip
  ctx.strokeStyle = '#090b10';
  ctx.lineWidth = 3.2 * scale;
  ctx.beginPath();
  ctx.moveTo(-w * 0.65, -2 * scale);
  ctx.lineTo(w * 0.3, 4 * scale);
  ctx.stroke();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  ctx.moveTo(w * 0.18, 3 * scale);
  ctx.lineTo(w * 0.3, 4 * scale);
  ctx.stroke();

  // Head + Conical Ronin Kasa Straw/Lacquer Hat!
  ctx.save();
  ctx.translate(w * 0.04, -torsoH - 3.5 * scale);
  ctx.rotate(pose.headTilt);

  const headR = w * 0.32;

  // Face beneath hat shadow
  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.5, -headR * 0.7);
  ctx.lineTo(headR * 0.8, -headR * 0.6);
  ctx.lineTo(headR * 0.85, 0);
  ctx.lineTo(headR * 0.5, headR * 0.45);
  ctx.lineTo(-headR * 0.35, headR * 0.35);
  ctx.closePath();
  ctx.fill();

  // High crimson neck scarf wrap
  ctx.fillStyle = scarfRed;
  ctx.fillRect(-headR * 0.65, headR * 0.15, headR * 1.45, headR * 0.36);

  // Sharp glowing amber-crimson samurai eye beneath brim
  if (!flash) {
    if (isHurt) {
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(headR * 0.25, -headR * 0.28);
      ctx.lineTo(headR * 0.68, -headR * 0.14);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(headR * 0.24, -headR * 0.32, headR * 0.48, headR * 0.24);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(headR * 0.38, -headR * 0.28, headR * 0.26, headR * 0.16);
    }
  }

  // Iconic Ronin Wide Conical Kasa Hat!
  ctx.fillStyle = kasaCol;
  ctx.beginPath();
  ctx.moveTo(-headR * 1.85, -headR * 0.38);
  ctx.lineTo(0, -headR * 1.62);
  ctx.lineTo(headR * 1.95, -headR * 0.32);
  ctx.quadraticCurveTo(0, -headR * 0.58, -headR * 1.85, -headR * 0.38);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = kasaRim;
  ctx.lineWidth = Math.max(1.4, 1.8 * scale);
  ctx.beginPath();
  ctx.moveTo(-headR * 1.82, -headR * 0.38);
  ctx.quadraticCurveTo(0, -headR * 0.58, headR * 1.92, -headR * 0.32);
  ctx.stroke();

  ctx.restore(); // end head
  ctx.restore(); // end torso

  // Front Arm + Held Katana / Weapon
  const fShoulderX = w * 0.08 + Math.sin(pose.torsoTilt) * 4 * scale;
  const fElbow = drawLimbSegment(ctx, fShoulderX, shoulderY + 1 * scale, pose.frontShoulderAngle, upperArmLen, 5.4 * scale, haoriIndigo, '#475569');
  const fHand = drawLimbSegment(ctx, fElbow.x, fElbow.y, pose.frontShoulderAngle + pose.frontElbowAngle, foreArmLen, 4.2 * scale, wrapWhite);

  ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
  ctx.beginPath();
  ctx.arc(fHand.x, fHand.y, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  if (attackState === 'idle') {
    ctx.save();
    ctx.translate(fHand.x, fHand.y);
    ctx.rotate(pose.frontShoulderAngle + pose.frontElbowAngle + 0.42);
    drawIdleHeldWeapon(ctx, weapon, scale, goldTrim);
    ctx.restore();
  }
}

function drawMinstrel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  pose: LimbPose,
  flash: boolean,
  isHurt: boolean,
  weapon: WeaponId,
  attackState: Player['attackState']
): void {
  const cloakRose = flash ? '#ffffff' : '#9d174d';
  const cloakBright = flash ? '#ffffff' : '#ec4899';
  const bodiceDark = flash ? '#ffffff' : '#2e1065';
  const silkCream = flash ? '#ffffff' : '#fdf2f8';
  const goldTrim = flash ? '#ffffff' : '#fbbf24';
  const hairCol = flash ? '#ffffff' : '#7c2d12';
  const hairHighlight = flash ? '#ffffff' : '#c2410c';
  const skinCol = flash ? '#ffffff' : '#fde2d0';
  const bootCol = flash ? '#ffffff' : '#3b1d2e';
  const tightsCol = flash ? '#ffffff' : '#1e1b2e';

  const hipY = -h * 0.41 + pose.bodyOffsetY;
  const shoulderY = -h * 0.72 + pose.bodyOffsetY;
  const thighLen = h * 0.21;
  const shinLen = h * 0.2;
  const upperArmLen = h * 0.16;
  const foreArmLen = h * 0.15;

  ctx.scale(pose.squashX, pose.squashY);

  // Flowing Bard Ribbon-Cloak trailing behind
  ctx.save();
  ctx.translate(0, shoulderY + 1 * scale);
  ctx.rotate(pose.coatSweep * 0.75);
  ctx.fillStyle = cloakRose;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, 0);
  ctx.quadraticCurveTo(-w * 0.68, h * 0.26, -w * 0.85, h * 0.56);
  ctx.lineTo(-w * 0.36, h * 0.54);
  ctx.quadraticCurveTo(-w * 0.25, h * 0.28, w * 0.02, h * 0.14);
  ctx.closePath();
  ctx.fill();

  // Golden silk ribbon streamer
  ctx.strokeStyle = cloakBright;
  ctx.lineWidth = Math.max(1.8, 2.4 * scale);
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, 2 * scale);
  ctx.quadraticCurveTo(-w * 0.78, h * 0.18, -w * 0.96, h * 0.42);
  ctx.stroke();
  ctx.restore();

  // Back Arm
  const backShoulderX = -w * 0.08 + Math.sin(pose.torsoTilt) * 2.5 * scale;
  const backElbow = drawLimbSegment(ctx, backShoulderX, shoulderY, pose.backShoulderAngle, upperArmLen, 3.9 * scale, silkCream);
  drawLimbSegment(ctx, backElbow.x, backElbow.y, pose.backShoulderAngle + pose.backElbowAngle, foreArmLen, 3.4 * scale, skinCol);

  // Back Leg
  const backKnee = drawLimbSegment(ctx, -w * 0.06, hipY, pose.rightHipAngle, thighLen, 4.6 * scale, tightsCol);
  const backFoot = drawLimbSegment(ctx, backKnee.x, backKnee.y, pose.rightHipAngle - pose.rightKneeAngle, shinLen, 4.2 * scale, bootCol, goldTrim);
  ctx.fillStyle = bootCol;
  ctx.fillRect(backFoot.x - 1.5 * scale, backFoot.y - 2.2 * scale, 6.5 * scale, 3.4 * scale);

  // Front Leg
  const frontKnee = drawLimbSegment(ctx, w * 0.06, hipY, pose.leftHipAngle, thighLen, 4.8 * scale, tightsCol);
  const frontFoot = drawLimbSegment(ctx, frontKnee.x, frontKnee.y, pose.leftHipAngle - pose.leftKneeAngle, shinLen, 4.4 * scale, bootCol, goldTrim);
  ctx.fillStyle = bootCol;
  ctx.fillRect(frontFoot.x - 1.5 * scale, frontFoot.y - 2.2 * scale, 7 * scale, 3.5 * scale);

  // Torso (Corset bodice + flared minstrel skirt)
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt);

  const torsoH = h * 0.32;
  // Flared minstrel skirt
  ctx.fillStyle = cloakRose;
  ctx.beginPath();
  ctx.moveTo(-w * 0.24, -1 * scale);
  ctx.lineTo(w * 0.24, -1 * scale);
  ctx.lineTo(w * 0.36, h * 0.16);
  ctx.lineTo(-w * 0.42 + pose.coatSweep * 6 * scale, h * 0.17);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = Math.max(1.2, 1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(-w * 0.4 + pose.coatSweep * 6 * scale, h * 0.16);
  ctx.lineTo(w * 0.35, h * 0.15);
  ctx.stroke();

  // Fitted plum corset bodice with cream ruffled collar
  ctx.fillStyle = bodiceDark;
  ctx.beginPath();
  ctx.moveTo(-w * 0.24, -torsoH);
  ctx.lineTo(w * 0.24, -torsoH);
  ctx.lineTo(w * 0.2, 1 * scale);
  ctx.lineTo(-w * 0.2, 1 * scale);
  ctx.closePath();
  ctx.fill();

  // Gold bodice lacing & sash
  ctx.fillStyle = goldTrim;
  ctx.fillRect(-w * 0.22, -2.5 * scale, w * 0.44, 2.5 * scale);
  ctx.fillStyle = silkCream;
  ctx.fillRect(-w * 0.1, -torsoH + 2 * scale, w * 0.22, torsoH * 0.45);

  // Head + Flowing Auburn Hair + Plumed Bard Hat
  ctx.save();
  ctx.translate(w * 0.04, -torsoH - 3.5 * scale);
  ctx.rotate(pose.headTilt);

  const headR = w * 0.33;

  // Long flowing hair trailing behind head
  ctx.save();
  ctx.rotate(pose.hairLift * 0.65);
  ctx.fillStyle = hairCol;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.4, -headR * 0.8);
  ctx.quadraticCurveTo(-headR * 1.85, -headR * 0.15, -headR * 1.95, headR * 1.55);
  ctx.lineTo(-headR * 0.85, headR * 1.35);
  ctx.quadraticCurveTo(-headR * 0.9, headR * 0.2, -headR * 0.2, -headR * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hairHighlight;
  ctx.beginPath();
  ctx.moveTo(-headR * 0.55, -headR * 0.5);
  ctx.quadraticCurveTo(-headR * 1.5, 0, -headR * 1.55, headR * 1.1);
  ctx.lineTo(-headR * 1.15, headR * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Face
  ctx.fillStyle = skinCol;
  ctx.beginPath();
  ctx.arc(0, -headR * 0.15, headR * 0.95, 0, Math.PI * 2);
  ctx.fill();

  // Bangs
  ctx.fillStyle = hairCol;
  ctx.beginPath();
  ctx.arc(0, -headR * 0.35, headR * 0.95, Math.PI, Math.PI * 2);
  ctx.fill();

  // Expressive emerald-gold eye
  if (!flash) {
    if (isHurt) {
      ctx.strokeStyle = '#3b1d2e';
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.moveTo(headR * 0.2, -headR * 0.25);
      ctx.lineTo(headR * 0.62, -headR * 0.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(headR * 0.25, -headR * 0.32, headR * 0.42, headR * 0.28);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(headR * 0.36, -headR * 0.26, headR * 0.24, headR * 0.18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(headR * 0.48, -headR * 0.28, headR * 0.12, headR * 0.1);
    }
  }

  // Jaunty Feathered Crimson Bard Cap!
  ctx.fillStyle = cloakRose;
  ctx.beginPath();
  ctx.moveTo(-headR * 1.25, -headR * 0.55);
  ctx.quadraticCurveTo(0, -headR * 1.55, headR * 1.32, -headR * 0.45);
  ctx.quadraticCurveTo(0, -headR * 0.72, -headR * 1.25, -headR * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = goldTrim;
  ctx.lineWidth = Math.max(1.2, 1.5 * scale);
  ctx.stroke();

  // Tall golden-pink plume feather sweeping back!
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = Math.max(2, 2.8 * scale);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-headR * 0.45, -headR * 0.95);
  ctx.quadraticCurveTo(-headR * 1.45, -headR * 1.95, -headR * 2.15, -headR * 1.35);
  ctx.stroke();

  ctx.restore(); // end head
  ctx.restore(); // end torso

  // Front Arm + Held Ribbon-Whip
  const fShoulderX = w * 0.08 + Math.sin(pose.torsoTilt) * 2.5 * scale;
  const fElbow = drawLimbSegment(ctx, fShoulderX, shoulderY + 0.5 * scale, pose.frontShoulderAngle, upperArmLen, 4.1 * scale, silkCream);
  const fHand = drawLimbSegment(ctx, fElbow.x, fElbow.y, pose.frontShoulderAngle + pose.frontElbowAngle, foreArmLen, 3.5 * scale, skinCol);

  if (attackState === 'idle') {
    ctx.save();
    ctx.translate(fHand.x, fHand.y);
    ctx.rotate(pose.frontShoulderAngle + pose.frontElbowAngle + 0.45);
    if (weapon === 'ribbon_whip' || weapon === 'silk_whip') {
      // Ornate golden wand handle + fluttering silk ribbon coil!
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-1.5 * scale, -2 * scale, 3 * scale, 11 * scale);
      ctx.strokeStyle = weapon === 'silk_whip' ? '#f9a8d4' : '#ec4899';
      ctx.lineWidth = Math.max(1.8, 2.3 * scale);
      ctx.beginPath();
      ctx.moveTo(0, 8 * scale);
      ctx.bezierCurveTo(-10 * scale, 14 * scale, 9 * scale, 18 * scale, -5 * scale, 24 * scale);
      ctx.stroke();
      drawHeldWeaponEvo(ctx, weapon, scale * heldScale());
    } else {
      drawIdleHeldWeapon(ctx, weapon, scale, goldTrim);
    }
    ctx.restore();
  }
}

// ============================================================================
// 5. THE ASH MONK (Charcoal Robes, Ash-Grey Sash, Bone Wraps & Prayer Beads)
// ============================================================================
function drawAshMonk(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  pose: LimbPose,
  flash: boolean,
  isHurt: boolean,
  weapon: WeaponId,
  attackState: Player['attackState'],
  emberGlow: number
): void {
  const hipY = -h * 0.43 + pose.bodyOffsetY;
  const shoulderY = -h * 0.74 + pose.bodyOffsetY;
  const thighLen = h * 0.22;
  const shinLen = h * 0.22;
  const upperArmLen = h * 0.165;
  const foreArmLen = h * 0.16;

  ctx.scale(pose.squashX, pose.squashY);

  const robeDark = flash ? '#ffffff' : '#1c1917';
  const robe = flash ? '#ffffff' : '#292524';
  const robeEdge = flash ? '#ffffff' : '#44403c';
  const sash = flash ? '#ffffff' : '#78716c';
  const wraps = flash ? '#ffffff' : '#d6d3d1';
  const wrapShade = flash ? '#ffffff' : '#a8a29e';
  const skin = flash ? '#ffffff' : '#c9b49a';
  const skinShade = flash ? '#ffffff' : '#a38f77';
  const bone = flash ? '#ffffff' : '#e7e0cf';
  const ashMark = flash ? '#ffffff' : '#57534e';

  // Long robe tail / sash ends trailing behind
  ctx.save();
  ctx.translate(-w * 0.1, hipY - 2 * scale);
  ctx.rotate(pose.torsoTilt + pose.coatSweep * 0.7);
  ctx.fillStyle = robeDark;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, 0);
  ctx.quadraticCurveTo(-w * 0.62, h * 0.18, -w * 0.78, h * 0.36 + pose.hairLift * 6 * scale);
  ctx.lineTo(-w * 0.32, h * 0.38);
  ctx.lineTo(w * 0.1, h * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = sash;
  ctx.beginPath();
  ctx.moveTo(-w * 0.12, -1 * scale);
  ctx.quadraticCurveTo(-w * 0.6, h * 0.08 + pose.hairLift * 8 * scale, -w * 0.82, h * 0.22 + pose.hairLift * 10 * scale);
  ctx.lineTo(-w * 0.7, h * 0.26 + pose.hairLift * 10 * scale);
  ctx.quadraticCurveTo(-w * 0.45, h * 0.12, -w * 0.02, h * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back arm (bare shoulder, wrapped forearm)
  const backShoulderX = -w * 0.1 + Math.sin(pose.torsoTilt) * 3 * scale;
  const backElbow = drawLimbSegment(ctx, backShoulderX, shoulderY, pose.backShoulderAngle, upperArmLen, 5.6 * scale, skinShade);
  const backHand = drawLimbSegment(ctx, backElbow.x, backElbow.y, pose.backShoulderAngle + pose.backElbowAngle, foreArmLen, 5.0 * scale, wrapShade);
  ctx.fillStyle = wrapShade;
  ctx.beginPath();
  ctx.arc(backHand.x, backHand.y, 3.1 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Back leg (loose dark trousers, bone shin wraps)
  const backKnee = drawLimbSegment(ctx, -w * 0.06, hipY, pose.rightHipAngle, thighLen, 7.4 * scale, robeDark);
  const backFoot = drawLimbSegment(ctx, backKnee.x, backKnee.y, pose.rightHipAngle - pose.rightKneeAngle, shinLen, 4.6 * scale, wrapShade);
  ctx.fillStyle = skinShade;
  ctx.fillRect(backFoot.x - 1.5 * scale, backFoot.y - 2 * scale, 7 * scale, 2.6 * scale);

  // Front leg
  const frontKnee = drawLimbSegment(ctx, w * 0.06, hipY, pose.leftHipAngle, thighLen, 7.8 * scale, robe);
  const frontFoot = drawLimbSegment(ctx, frontKnee.x, frontKnee.y, pose.leftHipAngle - pose.leftKneeAngle, shinLen, 4.8 * scale, wraps);
  ctx.fillStyle = skin;
  ctx.fillRect(frontFoot.x - 1.5 * scale, frontFoot.y - 2 * scale, 7.5 * scale, 2.6 * scale);

  // Torso: robe crossed over one shoulder, sash, prayer beads
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt);
  const torsoH = h * 0.33;

  // Bare chest underneath
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -torsoH);
  ctx.lineTo(w * 0.34, -torsoH);
  ctx.lineTo(w * 0.28, 3 * scale);
  ctx.lineTo(-w * 0.3, 3 * scale);
  ctx.closePath();
  ctx.fill();
  // Robe wrapping diagonally (leaves front shoulder bare)
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -torsoH);
  ctx.lineTo(-w * 0.02, -torsoH);
  ctx.lineTo(w * 0.32, -torsoH * 0.18);
  ctx.lineTo(w * 0.3, 4 * scale);
  ctx.lineTo(-w * 0.32, 4 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = robeEdge;
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.moveTo(-w * 0.02, -torsoH);
  ctx.lineTo(w * 0.32, -torsoH * 0.18);
  ctx.stroke();
  // Ash-grey sash
  ctx.fillStyle = sash;
  ctx.fillRect(-w * 0.33, -3.5 * scale, w * 0.64, 4.6 * scale);
  // Prayer beads (bone)
  ctx.fillStyle = bone;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const bx = -w * 0.2 + t * w * 0.42;
    const by = -torsoH + 3 * scale + Math.sin(t * Math.PI) * 6 * scale;
    ctx.beginPath();
    ctx.arc(bx, by, (i === 3 ? 1.9 : 1.3) * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head: shaved, ash marks, stern brow
  ctx.save();
  ctx.translate(w * 0.05, -torsoH - 4 * scale);
  ctx.rotate(pose.headTilt);
  const hr = w * 0.27;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(hr * 0.1, -hr * 0.55, hr * 0.92, hr * 1.02, 0, 0, Math.PI * 2);
  ctx.fill();
  // Jaw shadow
  ctx.fillStyle = skinShade;
  ctx.beginPath();
  ctx.moveTo(-hr * 0.5, hr * 0.0);
  ctx.lineTo(hr * 0.9, -hr * 0.1);
  ctx.lineTo(hr * 0.55, hr * 0.38);
  ctx.lineTo(-hr * 0.3, hr * 0.32);
  ctx.closePath();
  ctx.fill();
  // Three ash stripes across the scalp
  ctx.strokeStyle = ashMark;
  ctx.lineWidth = 1.2 * scale;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-hr * 0.55 + i * hr * 0.35, -hr * 1.42);
    ctx.lineTo(-hr * 0.35 + i * hr * 0.35, -hr * 0.95);
    ctx.stroke();
  }
  if (!flash) {
    if (isHurt) {
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(hr * 0.25, -hr * 0.55);
      ctx.lineTo(hr * 0.75, -hr * 0.42);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(hr * 0.22, -hr * 0.72, hr * 0.62, hr * 0.14);
      ctx.fillStyle = emberGlow > 0 ? '#f59e0b' : '#e7e5e4';
      ctx.fillRect(hr * 0.42, -hr * 0.6, hr * 0.26, hr * 0.14);
    }
  }
  ctx.restore();
  ctx.restore();

  // Front arm: bare shoulder, bone-wrapped forearm and fist
  const fShoulderX = w * 0.1 + Math.sin(pose.torsoTilt) * 4 * scale;
  const fElbow = drawLimbSegment(ctx, fShoulderX, shoulderY + 1 * scale, pose.frontShoulderAngle, upperArmLen, 5.8 * scale, skin);
  const fHand = drawLimbSegment(ctx, fElbow.x, fElbow.y, pose.frontShoulderAngle + pose.frontElbowAngle, foreArmLen, 5.2 * scale, wraps, '#f5f5f4');
  ctx.fillStyle = wraps;
  ctx.beginPath();
  ctx.arc(fHand.x, fHand.y, 3.4 * scale, 0, Math.PI * 2);
  ctx.fill();
  // Ember glow on the knuckles (evolution / Pyre Dash)
  if (emberGlow > 0 && !flash) {
    const g = ctx.createRadialGradient(fHand.x, fHand.y, 0.5, fHand.x, fHand.y, 9 * scale * emberGlow);
    g.addColorStop(0, 'rgba(251, 146, 60, 0.75)');
    g.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(fHand.x, fHand.y, 9 * scale * emberGlow, 0, Math.PI * 2);
    ctx.fill();
  }

  if (weapon === 'ash_wraps' && !flash) {
    drawFistEvo(ctx, fHand.x, fHand.y, fElbow.x, fElbow.y, scale);
  }

  if (attackState === 'idle' && weapon !== 'ash_wraps') {
    ctx.save();
    ctx.translate(fHand.x, fHand.y);
    ctx.rotate(pose.frontShoulderAngle + pose.frontElbowAngle + 0.42);
    drawIdleHeldWeapon(ctx, weapon, scale, '#a8a29e');
    ctx.restore();
  }
}

// ============================================================================
// 6. THE SABLE WIZARD (Deep Blue-Black Hooded Robe, Spire Staff, Element Glow)
// ============================================================================
function drawSableWizard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scale: number,
  pose: LimbPose,
  flash: boolean,
  isHurt: boolean,
  weapon: WeaponId,
  attackState: Player['attackState'],
  glow: string,
  glowPower: number
): void {
  const hipY = -h * 0.42 + pose.bodyOffsetY;
  const shoulderY = -h * 0.75 + pose.bodyOffsetY;
  const thighLen = h * 0.21;
  const shinLen = h * 0.21;
  const upperArmLen = h * 0.16;
  const foreArmLen = h * 0.15;

  ctx.scale(pose.squashX, pose.squashY);

  const robeBlack = flash ? '#ffffff' : '#0b1020';
  const robeBlue = flash ? '#ffffff' : '#172554';
  const robeMid = flash ? '#ffffff' : '#1e3a8a';
  const trim = flash ? '#ffffff' : '#94a3b8';
  const skin = flash ? '#ffffff' : '#b9a48e';
  const beard = flash ? '#ffffff' : '#9ca3af';
  const wood = flash ? '#ffffff' : '#2b1d14';
  const glowCol = flash ? '#ffffff' : glow;

  // Back cape / cloak panel
  ctx.save();
  ctx.translate(-w * 0.08, shoulderY + 2 * scale);
  ctx.rotate(pose.torsoTilt + pose.coatSweep * 0.6);
  ctx.fillStyle = robeBlack;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, 0);
  ctx.quadraticCurveTo(-w * 0.7, h * 0.3, -w * 0.72 + pose.hairLift * 6 * scale, h * 0.74);
  ctx.lineTo(w * 0.05, h * 0.72);
  ctx.lineTo(w * 0.2, h * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Back arm (wide sleeve)
  const backShoulderX = -w * 0.08 + Math.sin(pose.torsoTilt) * 3 * scale;
  const backElbow = drawLimbSegment(ctx, backShoulderX, shoulderY, pose.backShoulderAngle, upperArmLen, 6.2 * scale, robeBlack);
  const backHand = drawLimbSegment(ctx, backElbow.x, backElbow.y, pose.backShoulderAngle + pose.backElbowAngle, foreArmLen, 6.8 * scale, robeBlue);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(backHand.x, backHand.y, 2.4 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Legs mostly hidden by the long robe: dark boots peeking out
  const backKnee = drawLimbSegment(ctx, -w * 0.05, hipY, pose.rightHipAngle, thighLen, 6.4 * scale, robeBlack);
  const backFoot = drawLimbSegment(ctx, backKnee.x, backKnee.y, pose.rightHipAngle - pose.rightKneeAngle, shinLen, 5.0 * scale, robeBlack);
  ctx.fillStyle = '#0f0f12';
  ctx.fillRect(backFoot.x - 1.5 * scale, backFoot.y - 2.4 * scale, 7.5 * scale, 3 * scale);
  const frontKnee = drawLimbSegment(ctx, w * 0.05, hipY, pose.leftHipAngle, thighLen, 6.8 * scale, robeBlue);
  const frontFoot = drawLimbSegment(ctx, frontKnee.x, frontKnee.y, pose.leftHipAngle - pose.leftKneeAngle, shinLen, 5.2 * scale, robeBlue);
  ctx.fillStyle = '#0f0f12';
  ctx.fillRect(frontFoot.x - 1.5 * scale, frontFoot.y - 2.4 * scale, 8 * scale, 3 * scale);

  // Robe skirt: flared trapezoid over the thighs, swept by motion
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt * 0.6);
  const sweep = pose.coatSweep * 7 * scale;
  ctx.fillStyle = robeBlue;
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, -2 * scale);
  ctx.lineTo(w * 0.3, -2 * scale);
  ctx.lineTo(w * 0.44 + sweep * 0.3, h * 0.33);
  ctx.lineTo(-w * 0.5 + sweep, h * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 1.1 * scale;
  ctx.beginPath();
  ctx.moveTo(w * 0.44 + sweep * 0.3, h * 0.33);
  ctx.lineTo(-w * 0.5 + sweep, h * 0.35);
  ctx.stroke();
  // Front opening seam
  ctx.strokeStyle = robeMid;
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.moveTo(w * 0.08, 0);
  ctx.lineTo(w * 0.14 + sweep * 0.2, h * 0.33);
  ctx.stroke();
  ctx.restore();

  // Torso + hood
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(pose.torsoTilt);
  const torsoH = h * 0.34;
  ctx.fillStyle = robeBlue;
  ctx.beginPath();
  ctx.moveTo(-w * 0.36, -torsoH);
  ctx.lineTo(w * 0.34, -torsoH);
  ctx.lineTo(w * 0.3, 2 * scale);
  ctx.lineTo(-w * 0.32, 2 * scale);
  ctx.closePath();
  ctx.fill();
  // Silver-thread rune sash
  ctx.fillStyle = robeBlack;
  ctx.fillRect(-w * 0.32, -4 * scale, w * 0.62, 4.2 * scale);
  ctx.fillStyle = glowCol;
  ctx.globalAlpha = 0.6 + glowPower * 0.4;
  ctx.fillRect(-1.5 * scale, -3.4 * scale, 3 * scale, 3 * scale);
  ctx.globalAlpha = 1;
  // Mantle collar
  ctx.fillStyle = robeBlack;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -torsoH + 1 * scale);
  ctx.quadraticCurveTo(0, -torsoH + 9 * scale, w * 0.4, -torsoH + 1 * scale);
  ctx.lineTo(w * 0.3, -torsoH - 2 * scale);
  ctx.lineTo(-w * 0.32, -torsoH - 2 * scale);
  ctx.closePath();
  ctx.fill();

  // Head in a tall pointed hood: shadowed face, glowing eyes, short grey beard
  ctx.save();
  ctx.translate(w * 0.04, -torsoH - 4 * scale);
  ctx.rotate(pose.headTilt);
  const hr = w * 0.3;
  // Hood back & tip (sways with motion)
  ctx.fillStyle = robeBlack;
  ctx.beginPath();
  ctx.moveTo(-hr * 1.05, hr * 0.35);
  ctx.quadraticCurveTo(-hr * 1.25, -hr * 1.1, -hr * 0.4 + pose.hairLift * 4 * scale, -hr * 2.35);
  ctx.quadraticCurveTo(hr * 0.6, -hr * 1.6, hr * 1.1, -hr * 0.6);
  ctx.lineTo(hr * 1.0, hr * 0.4);
  ctx.closePath();
  ctx.fill();
  // Face opening (deep shadow)
  ctx.fillStyle = flash ? '#ffffff' : '#05070d';
  ctx.beginPath();
  ctx.ellipse(hr * 0.35, -hr * 0.35, hr * 0.62, hr * 0.72, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Lower face & beard
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(hr * 0.45, -hr * 0.02, hr * 0.38, hr * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = beard;
  ctx.beginPath();
  ctx.moveTo(hr * 0.05, hr * 0.05);
  ctx.lineTo(hr * 0.85, hr * 0.0);
  ctx.lineTo(hr * 0.5, hr * 0.75);
  ctx.closePath();
  ctx.fill();
  // Glowing eyes in the dark of the hood
  if (!flash) {
    if (isHurt) {
      ctx.strokeStyle = glowCol;
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(hr * 0.3, -hr * 0.45);
      ctx.lineTo(hr * 0.75, -hr * 0.35);
      ctx.stroke();
    } else {
      ctx.fillStyle = glowCol;
      ctx.fillRect(hr * 0.32, -hr * 0.5, hr * 0.18, hr * 0.12);
      ctx.fillRect(hr * 0.62, -hr * 0.48, hr * 0.16, hr * 0.11);
    }
  }
  // Hood rim trim
  ctx.strokeStyle = robeMid;
  ctx.lineWidth = 1.4 * scale;
  ctx.beginPath();
  ctx.ellipse(hr * 0.35, -hr * 0.35, hr * 0.66, hr * 0.76, 0.15, -Math.PI * 0.6, Math.PI * 0.55);
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // Front arm (wide sleeve) + staff
  const fShoulderX = w * 0.08 + Math.sin(pose.torsoTilt) * 4 * scale;
  const fElbow = drawLimbSegment(ctx, fShoulderX, shoulderY + 1 * scale, pose.frontShoulderAngle, upperArmLen, 6.4 * scale, robeMid);
  const fHand = drawLimbSegment(ctx, fElbow.x, fElbow.y, pose.frontShoulderAngle + pose.frontElbowAngle, foreArmLen, 7.0 * scale, robeBlue, '#3b82f6');

  if (weapon === 'spire_staff') {
    // Staff stays mostly upright and tilts forward as the arm thrusts.
    const tilt = Math.max(-0.35, Math.min(1.15, (pose.frontShoulderAngle - 0.25) * 0.7));
    const up = { x: Math.sin(tilt), y: -Math.cos(tilt) };
    const topLen = h * 0.6;
    const botLen = h * 0.4;
    const topX = fHand.x + up.x * topLen;
    const topY = fHand.y + up.y * topLen;
    ctx.strokeStyle = wood;
    ctx.lineWidth = 2.6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fHand.x - up.x * botLen, fHand.y - up.y * botLen);
    ctx.lineTo(topX, topY);
    ctx.stroke();
    // Iron ferrule bands
    ctx.strokeStyle = trim;
    ctx.lineWidth = 3.4 * scale;
    ctx.beginPath();
    ctx.moveTo(fHand.x + up.x * topLen * 0.82, fHand.y + up.y * topLen * 0.82);
    ctx.lineTo(fHand.x + up.x * topLen * 0.86, fHand.y + up.y * topLen * 0.86);
    ctx.stroke();
    // Twisted spire head cradling the element crystal
    ctx.strokeStyle = wood;
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.arc(topX + up.x * 4 * scale, topY + up.y * 4 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
    const cx = topX + up.x * 4 * scale;
    const cy = topY + up.y * 4 * scale;
    if (!flash) {
      const gr = (9 + glowPower * 8) * scale;
      const g = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, gr);
      g.addColorStop(0, '#f8fafc');
      g.addColorStop(0.3, glowCol);
      g.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = flash ? '#ffffff' : glowCol;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 3.6 * scale);
    ctx.lineTo(cx + 2.4 * scale, cy);
    ctx.lineTo(cx, cy + 3.6 * scale);
    ctx.lineTo(cx - 2.4 * scale, cy);
    ctx.closePath();
    ctx.fill();
    if (!flash) drawStaffEvo(ctx, cx, cy, up.x, up.y, fHand.x, fHand.y, scale);
  } else if (attackState === 'idle') {
    ctx.save();
    ctx.translate(fHand.x, fHand.y);
    ctx.rotate(pose.frontShoulderAngle + pose.frontElbowAngle + 0.42);
    drawIdleHeldWeapon(ctx, weapon, scale, '#94a3b8');
    ctx.restore();
  }
  // Hand over the staff
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(fHand.x, fHand.y, 2.5 * scale, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAnimatedPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  scale: number
): void {
  const w = player.baseW * scale;
  const h = (player.crouching ? player.crouchBaseH : player.baseH) * scale;

  ctx.save();
  setHeldEvo(player);

  if (player.isHidden) {
    ctx.globalAlpha = 0.64;
  } else if (
    player.invulnTimer > 0 &&
    player.backdashTimer <= 0 &&
    player.dashAttackTimer <= 0 &&
    player.rapierLungeTimer <= 0 &&
    player.monkDashTimer <= 0 &&
    player.hammerLeapState === 'none' &&
    !player.minstrelZipActive &&
    player.minstrelDanceTimer <= 0 &&
    Math.floor(player.invulnTimer * 18) % 2 === 0 &&
    player.flashTimer <= 0
  ) {
    ctx.globalAlpha = 0.42;
  }

  ctx.translate(player.x, player.y);

  // Minstrel Invulnerable Rose-Gold Ribbon Shimmer while Whip-Zipping or Vaulting!
  if (player.minstrelZipActive || player.minstrelVaultTimer > 0) {
    ctx.save();
    const glow = ctx.createRadialGradient(0, -h * 0.5, 4, 0, -h * 0.5, 34 * scale);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.55)');
    glow.addColorStop(0.55, 'rgba(236, 72, 153, 0.38)');
    glow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -h * 0.5, 34 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = player.minstrelZipActive ? '#fde047' : '#f472b6';
    ctx.lineWidth = Math.max(1.6, 2.2 * scale);
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.5, w * 0.92, h * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Armor potion shield aura
  if (player.armorShield > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.72)';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.5, w * 0.9, h * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Fire Weapon buff aura
  if (player.fireWeaponTimer > 0) {
    const glow = ctx.createRadialGradient(
      player.facing * w * 0.3,
      -h * 0.56,
      2,
      player.facing * w * 0.3,
      -h * 0.56,
      28 * scale
    );
    glow.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
    glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.facing * w * 0.3, -h * 0.56, 28 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Monk charged-jump ember aura + meter (drawn before facing flip so the meter stays upright)
  if (player.characterId === 'monk' && player.monkChargeTimer > 0 && player.onGround) {
    const c = Math.min(1, player.monkCharge);
    const hx = 0;
    const hy = -h * 0.45;
    ctx.save();
    const glow = ctx.createRadialGradient(hx, hy, 4 * scale, hx, hy, (36 + c * 18) * scale);
    glow.addColorStop(0, `rgba(253, 230, 138, ${0.18 + c * 0.35})`);
    glow.addColorStop(0.45, `rgba(194, 65, 12, ${0.16 + c * 0.28})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(hx, hy, (36 + c * 18) * scale, 0, Math.PI * 2);
    ctx.fill();
    // Charge ring
    ctx.strokeStyle = 'rgba(41, 37, 36, 0.7)';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(hx, -h - 10 * scale, 11 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = c >= 1 ? '#fde68a' : '#ea580c';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(hx, -h - 10 * scale, 11 * scale, -Math.PI / 2, -Math.PI / 2 + c * Math.PI * 2, false);
    ctx.stroke();
    if (c >= 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.7 + Math.sin(player.animTime * 16) * 0.25;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.arc(hx, -h - 10 * scale, 14 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // Wizard air-float runes and glow under his feet
  if (player.characterId === 'wizard' && player.wizardFloatTimer > 0) {
    const vel = visualElement(player);
    const c1 = vel?.pal.mid ?? '#818cf8';
    const c2 = vel?.pal.core ?? '#e0e7ff';
    const t = player.animTime;
    ctx.save();
    const aura = ctx.createRadialGradient(0, 4 * scale, 2 * scale, 0, 4 * scale, 34 * scale);
    aura.addColorStop(0, c2 + '99');
    aura.addColorStop(0.45, c1 + '66');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 6 * scale, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c1;
    ctx.lineWidth = 1.6 * scale;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 6 * scale, 16 * scale, 5.5 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 6 * scale, 22 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Orbiting runes
    for (let i = 0; i < 5; i++) {
      const a = t * 2.4 + (i * Math.PI * 2) / 5;
      const rx = Math.cos(a) * 18 * scale;
      const ry = 6 * scale + Math.sin(a) * 6 * scale;
      ctx.globalAlpha = 0.7 + Math.sin(t * 6 + i) * 0.25;
      ctx.fillStyle = i % 2 === 0 ? c2 : c1;
      ctx.fillRect(rx - 2 * scale, ry - 3.5 * scale, 4 * scale, 7 * scale);
    }
    ctx.restore();
  }

  // Katana Iaijutsu Charge Glint Ring!
  if (player.katanaChargeTimer > 0) {
    const prog =
      player.katanaChargeMax > 0
        ? 1 - player.katanaChargeTimer / player.katanaChargeMax
        : 1;
    const chargeR = (44 - prog * 26) * scale;
    ctx.save();
    ctx.strokeStyle = prog > 0.7 ? '#fef08a' : '#f43f5e';
    ctx.lineWidth = Math.max(2, (2 + prog * 3) * scale);
    ctx.beginPath();
    ctx.arc(0, -h * 0.45, Math.max(8, chargeR), 0, Math.PI * 2);
    ctx.stroke();
    const gx = player.facing * 6 * scale;
    const gy = -h * 0.44;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(gx - 12 * scale, gy);
    ctx.lineTo(gx + 12 * scale, gy);
    ctx.moveTo(gx, gy - 12 * scale);
    ctx.lineTo(gx, gy + 12 * scale);
    ctx.stroke();
    ctx.restore();
  }

  // When wall-clinging, face the wall nicely so braced hand & boots press into the vertical edge
  const renderFacing = player.wallClingDir !== 0 ? player.wallClingDir : player.facing;
  ctx.scale(renderFacing, 1);

  const pose = computePose(player, scale);
  const flash = player.flashTimer > 0;
  const isHurt = player.hitStunTimer > 0;

  if (player.characterId === 'brute') {
    drawIronBrute(ctx, w, h, scale, pose, flash, player.weapon, player.attackState);
  } else if (player.characterId === 'ronin') {
    drawRoninSwordsman(ctx, w, h, scale, pose, flash, isHurt, player.weapon, player.attackState);
  } else if (player.characterId === 'minstrel') {
    drawMinstrel(ctx, w, h, scale, pose, flash, isHurt, player.weapon, player.attackState);
  } else if (player.characterId === 'monk') {
    const evo = visualTier(player);
    const emberGlow =
      player.monkDashTimer > 0 || player.monkPalmTimer > 0
        ? 1.2
        : player.monkChargeTimer > 0
          ? 0.45 + player.monkCharge * 1.1
          : evo >= 1
            ? 0.6 + evo * 0.2
            : 0;
    drawAshMonk(ctx, w, h, scale, pose, flash, isHurt, player.weapon, player.attackState, emberGlow);
  } else if (player.characterId === 'wizard') {
    const vel = visualElement(player);
    const realEl = getActiveElementDef(player.baseElements, player.combinedElement);
    const el = vel ? { primaryColor: affinityFxEnabled() ? vel.pal.mid : realEl?.primaryColor ?? vel.pal.mid } : null;
    const evo = visualTier(player);
    const power =
      player.wizardNovaTimer > 0 || player.wizardCastTimer > 0 || player.attackState === 'active' || player.wizardFloatTimer > 0
        ? 1
        : 0.25 + evo * 0.25;
    drawSableWizard(ctx, w, h, scale, pose, flash, isHurt, player.weapon, player.attackState, el ? el.primaryColor : '#a5b4fc', power);
  } else {
    drawAnimeVampireBoy(ctx, w, h, scale, pose, flash, isHurt, player.weapon, player.attackState);
  }

  // Forward Dash Attack spear flash
  if (player.dashAttackTimer > 0) {
    ctx.fillStyle = player.fireWeaponTimer > 0 ? '#fb923c' : '#fef08a';
    ctx.beginPath();
    ctx.moveTo(w * 0.55, -h * 0.66);
    ctx.lineTo(w * 2.25, -h * 0.54);
    ctx.lineTo(w * 0.55, -h * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  setHeldEvo(null);
  ctx.restore();
}

// Render idle hero stand-ins by the Campfire so players see all selectable heroes in Camp!
export function drawCampHeroFigure(
  ctx: CanvasRenderingContext2D,
  characterId: CharacterId,
  x: number,
  y: number,
  facing: Facing,
  scale: number,
  time: number,
  isSelected: boolean
): void {
  const t30 = snap30fps(time);
  const w = (characterId === 'brute' ? 36 : characterId === 'minstrel' || characterId === 'wizard' ? 26 : 28) * scale;
  const h = (characterId === 'brute' ? 60 : characterId === 'minstrel' ? 50 : characterId === 'wizard' ? 54 : 52) * scale;
  const phaseOffset =
    characterId === 'brute'
      ? 1.4
      : characterId === 'ronin'
        ? 2.8
        : characterId === 'minstrel'
          ? 4.2
          : characterId === 'monk'
            ? 5.1
            : characterId === 'wizard'
              ? 0.7
              : 0;
  const breath = Math.sin(t30 * 3.0 + phaseOffset);

  const pose: LimbPose = {
    bodyOffsetY: breath * 1.0 * scale,
    torsoTilt: 0.03,
    headTilt: breath * 0.03,
    leftHipAngle: -0.14,
    leftKneeAngle: 0.14,
    rightHipAngle: 0.18,
    rightKneeAngle: 0.1,
    frontShoulderAngle: 0.22,
    frontElbowAngle: -0.45,
    backShoulderAngle: -0.2,
    backElbowAngle: -0.3,
    coatSweep: -0.1 + Math.sin(t30 * 3.4 + phaseOffset) * 0.08,
    hairLift: Math.sin(t30 * 3.8 + phaseOffset) * 0.08,
    squashX: 1,
    squashY: 1,
  };

  ctx.save();
  ctx.translate(x, y);

  if (!isSelected) {
    ctx.scale(facing, 1);
    if (characterId === 'brute') {
      drawIronBrute(ctx, w, h, scale, pose, false, 'hammer', 'idle');
    } else if (characterId === 'ronin') {
      drawRoninSwordsman(ctx, w, h, scale, pose, false, false, 'katana', 'idle');
    } else if (characterId === 'minstrel') {
      drawMinstrel(ctx, w, h, scale, pose, false, false, 'ribbon_whip', 'idle');
    } else if (characterId === 'monk') {
      // Meditative guard: fists low, chin down
      drawAshMonk(ctx, w, h, scale, { ...pose, frontShoulderAngle: 0.55, frontElbowAngle: -1.55, backShoulderAngle: 0.3, backElbowAngle: -1.6 }, false, false, 'ash_wraps', 'idle', 0);
    } else if (characterId === 'wizard') {
      drawSableWizard(ctx, w, h, scale, pose, false, false, 'spire_staff', 'idle', '#a5b4fc', 0.3 + Math.max(0, Math.sin(t30 * 2.2)) * 0.3);
    } else {
      drawAnimeVampireBoy(ctx, w, h, scale, pose, false, false, 'whip', 'idle');
    }
  }

  ctx.restore();
}

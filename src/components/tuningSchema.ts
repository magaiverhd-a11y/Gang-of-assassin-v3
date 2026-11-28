import { BOSS_ORDER, CHARACTERS, CHARACTER_ORDER, REGULAR_ENEMY_ORDER } from '../game/defaults';
import { FX_ELEMENT_ORDER, fxElementLabel } from '../game/affinityFx';
import { ENEMY_SPECS } from '../game/level';
import { CharacterId, TuningConfig } from '../game/types';

export type Fmt = 'x' | 'ms' | 'px' | 'pct' | 'frac' | 'int' | 'n2' | 'sec' | 'pxs';

export interface SliderDef {
  kind: 'slider';
  path: string[];
  label: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  fmt: Fmt;
}

export interface ToggleDef {
  kind: 'toggle';
  path: string[];
  label: string;
  desc: string;
}

export interface SelectDef {
  kind: 'select';
  path: string[];
  label: string;
  desc: string;
  /** Option labels; the stored value is the option index (a number, so copy/paste & merge stay simple). */
  options: string[];
}

export type ItemDef = SliderDef | ToggleDef | SelectDef;

export interface GroupDef {
  id: string;
  title: string;
  subtitle?: string;
  items: ItemDef[];
  /** Collapsed by default (long lists such as per-enemy groups). */
  collapsed?: boolean;
}

export interface TabDef {
  id: string;
  label: string;
  accent?: string;
  /** Top-level tuning keys this tab owns (used by "Reset tab" and "Copy tab"). */
  roots: string[];
  groups: GroupDef[];
  /** Extra action rendered at the top of the tab. */
  action?: 'testFreeze' | 'credits';
  note?: string;
}

const S = (
  path: string | string[],
  label: string,
  desc: string,
  min: number,
  max: number,
  step: number,
  fmt: Fmt
): SliderDef => ({ kind: 'slider', path: Array.isArray(path) ? path : [path], label, desc, min, max, step, fmt });

const T = (path: string | string[], label: string, desc: string): ToggleDef => ({
  kind: 'toggle',
  path: Array.isArray(path) ? path : [path],
  label,
  desc,
});

const SEL = (path: string | string[], label: string, desc: string, options: string[]): SelectDef => ({
  kind: 'select',
  path: Array.isArray(path) ? path : [path],
  label,
  desc,
  options,
});

/** Actions a mobile corner button can perform (index = stored tuning value). */
export const MOBILE_ACTION_LABELS = [
  'Jump',
  'Dash / Weapon Skill',
  'Spell',
  'Interact / Assassinate',
  'Item',
  'Special Relic',
  'Attack (manual)',
];

export function formatValue(v: number, fmt: Fmt): string {
  switch (fmt) {
    case 'x':
      return `${v.toFixed(2)}x`;
    case 'ms':
      return `${Math.round(v)} ms`;
    case 'px':
      return `${Math.round(v)} px`;
    case 'pxs':
      return `${Math.round(v)} px/s`;
    case 'pct':
      return `${Math.round(v)}%`;
    case 'frac':
      return `${Math.round(v * 100)}%`;
    case 'int':
      return `${Math.round(v)}`;
    case 'sec':
      return `${v.toFixed(2)} s`;
    default:
      return v.toFixed(2);
  }
}

// ---------------------------------------------------------------------------
// GENERAL
// ---------------------------------------------------------------------------
const GENERAL_ROOTS = [
  'fallDeathEnabled', 'fallDeathBossMode', 'fallDeathBossDamagePct', 'knockbackMult', 'ledgeShoveAssist',
  'gameSpeed', 'hitstopMs', 'shakeMult', 'zoomPunchMult', 'flashMult', 'critShakeIntensity',
  'zoom', 'playerScale', 'enemyScale',
  'cameraOffsetY', 'cameraDeadzoneX', 'cameraDeadzoneY', 'cameraSmoothing', 'showCameraGuide', 'cameraLookAhead',
  'mobileZoom', 'mobileLookAhead', 'mobileCameraOffsetY', 'mobileDeckPct', 'mobileAutoAttack',
  'mobileAutoAttackRange', 'mobileAutoAttackPriority', 'mobileAutoAssassinate', 'mobileHaptics',
  'mobileBtnTopLeft', 'mobileBtnTopRight', 'mobileBtnBottomLeft', 'mobileBtnBottomRight', 'mobileMiniButtons', 'mobileJumpThreshold', 'mobileTapMs',
  'moveSpeed', 'jumpForce', 'gravity', 'coyoteTimeMs', 'jumpBufferMs',
  'airControl', 'airMaxSpeedMult', 'airDrag', 'airJumps', 'jumpCutMultiplier', 'apexHangGravityMult',
  'fallGravityMult', 'maxFallSpeed', 'lockAirDirectionOnAttack', 'airTurnFacing', 'allowAirBackdash',
  'attackStartupMs', 'attackActiveMs', 'attackRecoveryMs', 'attackRange', 'weaponCritChance',
  'critMultiplier', 'playerDamageMult', 'jumpLockWhenAttacking', 'freezeOnAttack', 'assassinationEnabled',
  'enemyDamageMult', 'bossDamageMult', 'playerInvulnSec', 'playerHitStunMs', 'airKnockbackX', 'airKnockbackY',
  'stealthVisionMult', 'crouchStealthMult', 'chainStealthMult', 'closeSenseNormal', 'closeSenseCrouch',
  'closeSenseChain', 'visionHeight', 'hideBreakDistance',
];

const generalTab: TabDef = {
  id: 'general',
  label: 'General',
  roots: GENERAL_ROOTS,
  groups: [
    {
      id: 'g-feel',
      title: 'Game Speed & Feel',
      items: [
        S('gameSpeed', 'Game Speed', 'Global time scale for the whole game (world, enemies, player). 1.00x is normal; lower for slow-motion testing.', 0.25, 2, 0.05, 'x'),
        S('hitstopMs', 'Hitstop Freeze', 'Brief micro-pause on impact when your weapon strikes an enemy to give hits extra weight.', 0, 120, 5, 'ms'),
        S('shakeMult', 'Screen Shake (All)', 'Multiplies every camera shake in the game (hits, crits, bosses, explosions). 0 turns shake off.', 0, 2.5, 0.05, 'x'),
        S('critShakeIntensity', 'Crit Shake Intensity', 'Strength of the screen shake triggered on Critical hits (assassination shake lives in the Kill FX tab).', 0, 24, 1, 'px'),
        S('zoomPunchMult', 'Zoom Punch (All)', 'Multiplies every camera zoom-punch on heavy hits, crits and kills.', 0, 2.5, 0.05, 'x'),
        S('flashMult', 'Screen Flash (All)', 'Multiplies every full-screen impact flash (hurt, crit, parry, kill). 0 disables flashes.', 0, 1.5, 0.05, 'x'),
      ],
    },
    {
      id: 'g-scale',
      title: 'Zoom & Scale',
      items: [
        S('zoom', 'Game Zoom', 'Controls how close or wide the camera views the castle. Lower values show more of the grand map at once.', 0.6, 2.2, 0.05, 'x'),
        S('playerScale', 'Character Size', "Scales the player's sprite, collision hitbox, and weapon reach proportionally.", 0.6, 1.8, 0.05, 'x'),
        S('enemyScale', 'Enemy Size', 'Scales all enemy types and their hitboxes simultaneously.', 0.6, 1.8, 0.05, 'x'),
      ],
    },
    {
      id: 'g-camera',
      title: 'Camera',
      items: [
        S('cameraOffsetY', 'Camera Height Offset', 'Shifts the camera vertically relative to the player. Negative values raise the camera so the player sits lower on screen.', -260, 80, 5, 'px'),
        S('cameraDeadzoneX', 'Horizontal Deadzone', 'How far left or right the player can move before the camera starts scrolling.', 0, 220, 5, 'px'),
        S('cameraDeadzoneY', 'Vertical Deadzone', 'Vertical buffer before the camera shifts. Keeps normal jumps steady without screen bobbing.', 0, 180, 5, 'px'),
        S('cameraSmoothing', 'Camera Smoothing', 'How quickly the camera catches up once the player pushes past the deadzone. Higher values track more tightly.', 0.04, 0.5, 0.02, 'n2'),
        T('showCameraGuide', 'Show Deadzone Guide', 'Draws a dashed amber frame showing the camera deadzone window in real time.'),
        S('cameraLookAhead', 'Camera Look-Ahead', 'Leads the camera ahead of the way the hero faces (desktop/landscape). Mobile portrait uses its own value below.', 0, 220, 5, 'px'),
      ],
    },
    {
      id: 'g-mobile',
      title: 'Mobile (Portrait Phone)',
      subtitle: 'Portrait phone layout only (or ?mobile in the URL)',
      items: [
        S('mobileZoom', 'Mobile Zoom', 'Camera zoom in portrait at a 390 px wide phone (scales with screen width). Higher = closer, bigger hero; lower = see more of the room.', 0.45, 1.4, 0.01, 'x'),
        S('mobileLookAhead', 'Mobile Look-Ahead', 'How far the camera leads in the direction the hero faces, so you can see foes coming.', 0, 220, 5, 'px'),
        S('mobileCameraOffsetY', 'Mobile Camera Height', 'Vertical camera offset in portrait. Negative raises the camera so the hero sits lower and you see more above.', -260, 80, 5, 'px'),
        S('mobileDeckPct', 'Control Deck Height', 'Height of the bottom control deck as a % of the screen. The game view gets the rest and is never covered.', 26, 44, 1, 'pct'),
        T('mobileAutoAttack', 'Auto-Attack', 'Swing automatically when an aware enemy is in weapon range. Never attacks unaware enemies, so stealth is not broken.'),
        S('mobileAutoAttackRange', 'Auto-Attack Range', 'Multiplies the weapon reach used to decide when to swing. Below 1 waits until foes are closer.', 0.5, 1.6, 0.05, 'x'),
        SEL('mobileAutoAttackPriority', 'Auto-Attack Target', 'Which foe auto-attack picks when several are in range.', ['Nearest', 'Lowest HP', 'Bosses / strongest first', 'Only in front (never turn)']),
        T('mobileAutoAssassinate', 'Auto-Assassinate', 'Off: tap the joystick to backstab (the stick glows red when one is lined up). On: auto-attack also backstabs unaware foes from behind.'),
        T('mobileHaptics', 'Vibration', 'Short vibration on button presses and stronger pulses on kills (Android Chrome; iPhone browsers ignore it).'),
        S('mobileJumpThreshold', 'Stick Jump Threshold', 'How far you must push the joystick up to jump. Higher needs a more deliberate upward flick. Holding up after the flick does not jump again; a second flick in the air is a double jump (for heroes who have one). Down stays crouch; push deeper to drop through platforms.', 0.35, 0.8, 0.01, 'frac'),
        S('mobileTapMs', 'Stick Tap Time', 'How quickly you must lift your thumb off the joystick for it to count as Interact / Execute. Longer is more forgiving; shorter avoids accidental taps while steering.', 80, 400, 10, 'ms'),
        SEL('mobileBtnTopLeft', 'Top-Left Button', 'Action of the top-left corner button. Default: Spell [4].', MOBILE_ACTION_LABELS),
        SEL('mobileBtnTopRight', 'Top-Right Button', 'Action of the top-right corner button. Default: Dash / weapon skill [3].', MOBILE_ACTION_LABELS),
        SEL('mobileBtnBottomLeft', 'Bottom-Left Button', 'Action of the bottom-left corner button. Default: Item [5].', MOBILE_ACTION_LABELS),
        SEL('mobileBtnBottomRight', 'Bottom-Right Button', 'Action of the bottom-right corner button (best thumb spot). Default: Special relic [6].', MOBILE_ACTION_LABELS),
        T('mobileMiniButtons', 'Item & Relic Mini Buttons', 'Off by default in v2, because Item and Relic are full corner buttons. Turn on to also show two small buttons beside the stick.'),
      ],
    },
    {
      id: 'g-move',
      title: 'Movement & Forgiveness',
      subtitle: 'Base values — each hero multiplies these in their own tab',
      items: [
        S('moveSpeed', 'Move Speed', 'Base horizontal walking speed (multiplied by each hero\'s Speed ×).', 120, 420, 5, 'pxs'),
        S('jumpForce', 'Jump Force', 'Base upward launch strength (multiplied by each hero\'s Jump ×).', 360, 780, 10, 'int'),
        S('gravity', 'Gravity', 'Downward pull on the player and enemies. Higher gravity creates heavier, snappier jump arcs.', 700, 2200, 20, 'int'),
        S('coyoteTimeMs', 'Coyote Time', 'Grace window after walking off a ledge where pressing Jump still succeeds.', 0, 250, 5, 'ms'),
        S('jumpBufferMs', 'Jump Buffer', 'Pressing Jump slightly before landing triggers a jump the moment you touch ground.', 0, 250, 5, 'ms'),
      ],
    },
    {
      id: 'g-air',
      title: 'Air Control',
      items: [
        S('airControl', 'Air Steering', 'How strongly A/D steers you in mid-air. 0% locks your jump arc; 100% gives instant mid-air control.', 0, 100, 5, 'pct'),
        S('airMaxSpeedMult', 'Air Max Speed', 'Horizontal speed multiplier while airborne relative to ground speed.', 0.5, 1.4, 0.05, 'x'),
        S('airDrag', 'Air Drag (Brake)', 'How quickly you slow down horizontally when releasing A/D mid-jump.', 0, 100, 5, 'pct'),
        S('airJumps', 'Extra Air Jumps (heroes with air jumps)', 'Minimum extra air jumps for heroes that have air jumps (Hunter, Minstrel). Heroes with 0 in their own tab stay at 0.', 0, 3, 1, 'int'),
        S('jumpCutMultiplier', 'Short-Hop Cut', 'Upward velocity multiplier when releasing Jump early. 1.00x forces fixed full-height jumps.', 0.25, 1, 0.05, 'x'),
        S('apexHangGravityMult', 'Apex Hang Gravity', 'Reduces gravity near the top of your jump for extra hang time.', 0.4, 1, 0.04, 'x'),
        S('fallGravityMult', 'Fall Gravity Boost', 'Increases gravity while descending so landings feel weighty.', 0.8, 2.2, 0.05, 'x'),
        S('maxFallSpeed', 'Max Fall Speed', 'Caps terminal falling speed during long drops.', 400, 1200, 20, 'pxs'),
        T('lockAirDirectionOnAttack', 'Lock Air Direction on Attack', 'Locks horizontal direction, velocity, and facing while attacking in mid-air.'),
        T('airTurnFacing', 'Mid-Air Turn Facing', 'Allows flipping facing in mid-air when pressing A or D.'),
        T('allowAirBackdash', 'Allow Air Backdash', 'Lets you Backdash (key 3) once in mid-air; refreshes on landing.'),
      ],
    },
    {
      id: 'g-combat',
      title: 'Combat & Weapon',
      subtitle: 'Base values — each hero has attack speed / range multipliers',
      items: [
        S('attackStartupMs', 'Attack Startup', 'Wind-up delay before a strike becomes active. Lower values feel snappier.', 15, 200, 5, 'ms'),
        S('attackActiveMs', 'Attack Active', 'How long the weapon hitbox stays live.', 50, 260, 5, 'ms'),
        S('attackRecoveryMs', 'Attack Recovery', 'Cooldown after a swing before you can swing again.', 30, 300, 5, 'ms'),
        S('attackRange', 'Weapon Range', 'Base horizontal reach of weapon attacks in pixels.', 44, 150, 2, 'px'),
        S('weaponCritChance', 'Weapon Crit Chance', 'Base chance for attacks to land a Critical hit.', 0, 100, 5, 'pct'),
        S('critMultiplier', 'Crit Multiplier', 'Damage multiplier on a Critical hit.', 1, 6, 0.5, 'x'),
        S('playerDamageMult', 'Player Damage (All)', 'Multiplies all damage the player deals (weapons, spells, assassinations).', 0.25, 4, 0.05, 'x'),
        T('jumpLockWhenAttacking', 'Jump Lock When Attacking', 'Prevents jumping while your attack swing is active.'),
        T('freezeOnAttack', 'Freeze on Attack', 'Locks horizontal ground movement while swinging. Turn off to run and attack freely.'),
        T('assassinationEnabled', 'Backstab Assassination', 'Hitting an unaware enemy from behind (or from above) is an instant lethal assassination on regular foes.'),
      ],
    },
    {
      id: 'g-fall',
      title: 'Fall Death & Knockback',
      subtitle: 'Enemies knocked into pits die — all heroes',
      items: [
        T('fallDeathEnabled', 'Fall Death', 'Enemies knocked or pushed into a pit / below the level die with full XP and drop credit. Off: they reappear at their post.'),
        SEL('fallDeathBossMode', 'Bosses That Fall', 'Boss arenas are mostly solid, but if a boss does fall: take big damage and return to the arena, die instantly, or just return.', ['Big damage + return', 'Instant kill', 'No damage, return']),
        S('fallDeathBossDamagePct', 'Boss Fall Damage', '% of max HP a boss loses when it falls (Big damage mode).', 0, 100, 1, 'pct'),
        S('knockbackMult', 'Knockback (All Heroes)', 'Multiplies how far every hero\'s hits push enemies (bosses barely move).', 0, 3, 0.05, 'x'),
        T('ledgeShoveAssist', 'Ledge Shove', 'A hit on a regular enemy standing near a pit edge shoves it over the edge (any hero, any weapon).'),
      ],
    },
    {
      id: 'g-hurt',
      title: 'Damage Taken & Hit Reaction',
      items: [
        S('enemyDamageMult', 'Enemy Damage (All)', 'Multiplies damage from all regular enemies (stacks with each enemy\'s own Damage ×). 0 = god mode vs. enemies.', 0, 4, 0.05, 'x'),
        S('bossDamageMult', 'Boss Damage (All)', 'Multiplies damage from all bosses (stacks with each boss\'s own Damage ×).', 0, 4, 0.05, 'x'),
        S('playerInvulnSec', 'Hurt Invulnerability', 'Seconds of invulnerability after the player takes a hit.', 0.2, 3, 0.05, 'sec'),
        S('playerHitStunMs', 'Ground Hitstun (Stuck)', 'How long the player is stuck in place when hit on the ground.', 60, 500, 10, 'ms'),
        S('airKnockbackX', 'Air Knockback X', 'Horizontal pushback when struck mid-air.', 80, 480, 10, 'int'),
        S('airKnockbackY', 'Air Knockback Y', 'Upward pop when struck mid-air.', 140, 540, 10, 'int'),
      ],
    },
    {
      id: 'g-stealth',
      title: 'Stealth & Detection',
      items: [
        S('stealthVisionMult', 'Enemy Vision (All)', 'Multiplies every enemy\'s detection range (stacks with per-enemy Vision ×).', 0.2, 2.5, 0.05, 'x'),
        S('crouchStealthMult', 'Crouch-Walk Stealth', 'Enemy vision multiplier while you crouch-walk. Lower = sneakier.', 0.1, 1, 0.02, 'x'),
        S('chainStealthMult', 'Shadow Chain Stealth', 'Enemy vision multiplier during Shadow Chain (after an assassination).', 0.1, 1, 0.02, 'x'),
        S('closeSenseNormal', 'Back Sense (Standing)', 'Distance at which an enemy notices you behind its back while you stand/run.', 0, 200, 2, 'px'),
        S('closeSenseCrouch', 'Back Sense (Crouching)', 'Distance at which an enemy notices you behind its back while you crouch.', 0, 200, 2, 'px'),
        S('closeSenseChain', 'Back Sense (Shadow Chain)', 'Distance at which an enemy notices you behind its back during Shadow Chain.', 0, 200, 2, 'px'),
        S('visionHeight', 'Vision Height', 'Max vertical distance a ground enemy can spot you (drop-assassination window).', 30, 300, 5, 'px'),
        S('hideBreakDistance', 'Hide Break Distance', 'When you hide, alerted enemies farther than this lose track of you.', 0, 200, 2, 'px'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// KILL FX (Assassination Freeze)
// ---------------------------------------------------------------------------
const K = (k: string) => ['killFreeze', k];
const killTab: TabDef = {
  id: 'killfx',
  label: 'Kill FX',
  accent: '#ff334b',
  roots: ['killFreeze'],
  action: 'testFreeze',
  note: 'Fires on every stealth assassination (backstab, drop attack, ambush). Use Test Freeze to preview on your hero.',
  groups: [
    {
      id: 'k-freeze',
      title: 'Assassination Freeze',
      items: [
        T(K('enabled'), 'Assassination Freeze', 'Master toggle. Off = assassinations use the normal small hit-stop only.'),
        S(K('freezeMs'), 'Freeze Duration', 'Full world freeze (hit-stop) when an assassination lands. Original game value: 260 ms.', 0, 1500, 10, 'ms'),
        S(K('bossFreezeMult'), 'Boss Freeze ×', 'Freeze duration multiplier when assassinating a boss.', 0.25, 3, 0.05, 'x'),
        T(K('holdUntilKey'), 'Freeze Until Key Press', 'Screenshot / tuning mode: the game stays frozen on the kill frame until you press any key or tap the game.'),
      ],
    },
    {
      id: 'k-slow',
      title: 'Slow-Motion',
      items: [
        S(K('slowMoScale'), 'Slow-Mo Speed', 'World speed during the slow-mo after the freeze. 1.00x = no slow-mo.', 0.05, 1, 0.05, 'x'),
        S(K('slowMoMs'), 'Slow-Mo Duration', 'How long the slow-motion lasts after the freeze ends (real time). 0 = off.', 0, 2000, 20, 'ms'),
      ],
    },
    {
      id: 'k-cam',
      title: 'Camera, Flash & Shake',
      items: [
        S(K('zoomPunch'), 'Zoom Punch', 'Camera zoom-in punch on the kill (0.14 = original).', 0, 0.5, 0.01, 'n2'),
        S(K('shake'), 'Shake Strength', 'Camera shake on the kill (original ≈ 16.5).', 0, 40, 0.5, 'px'),
        S(K('shakeMs'), 'Shake Duration', 'How long the kill shake lasts.', 0, 1200, 10, 'ms'),
        T(K('flash'), 'Kill Flash', 'Crimson screen flash + high-contrast impact frame on the kill.'),
        S(K('flashAlpha'), 'Flash Strength', 'Opacity of the crimson kill flash.', 0, 1, 0.02, 'n2'),
        S(K('impactFrameMs'), 'Impact Frame', 'Length of the high-contrast impact frame.', 0, 400, 5, 'ms'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// AFFINITY & WEAPON EVOLUTION FX (visual only)
// ---------------------------------------------------------------------------
const F = (k: string) => ['fx', k];
const fxTab: TabDef = {
  id: 'fx',
  label: 'Affinity FX',
  accent: '#c2763a',
  roots: ['fx'],
  note: 'Visual only — none of these change damage or power. Preview options let you see any affinity / weapon tier on your current hero.',
  groups: [
    {
      id: 'fx-aff',
      title: 'Elemental Affinity Effects',
      items: [
        T(F('affinityFx'), 'Affinity FX', 'Master switch. Off = the old simple aura only.'),
        S(F('intensity'), 'Intensity (PC)', 'Amount of affinity particles and effects on desktop.', 0, 2, 0.05, 'x'),
        S(F('mobileIntensity'), 'Intensity (Phone)', 'Amount of affinity particles and effects in the phone layout.', 0, 2, 0.05, 'x'),
        T(F('movementFx'), 'Movement FX', 'Footsteps, jump / double-jump bursts, landing impacts and dash wakes in your element.'),
        T(F('runAura'), 'Body Aura', 'Low ground glow and motes coming off the hero while running or standing.'),
        S(F('trailLength'), 'Wake Length', 'Elemental wake behind the hero when sprinting or dashing. 0 = off.', 0, 2, 0.05, 'x'),
        T(F('attackFx'), 'Attack FX', 'Element-styled swing trails, hit sparks and impacts.'),
        T(F('statusFx'), 'Status FX', 'Burn flames, frost rime, wind stagger, earth daze, holy brand and shadow wither on struck foes.'),
        S(F('elementShakeMult'), 'Element Shake', 'Per-element impact shake (earth heavy, air light). 0 = same shake for every element.', 0, 2, 0.05, 'x'),
        S(F('elementHitstopMult'), 'Element Hit-Stop', 'Per-element extra hit freeze (earth and shadow longer, air none). 0 = off.', 0, 2, 0.05, 'x'),
        S(F('particleCap'), 'Particle Cap (PC)', 'Most affinity particles alive at once on desktop.', 40, 800, 10, 'int'),
        S(F('mobileParticleCap'), 'Particle Cap (Phone)', 'Most affinity particles alive at once on phone. Lower = smoother.', 20, 400, 10, 'int'),
      ],
    },
    {
      id: 'fx-evo',
      title: 'Weapon Evolution (every 5 upgrades)',
      items: [
        T(F('weaponEvoFx'), 'Weapon Evo Visuals', 'Evolved weapons change shape, size, colour, runes and attack trails at Awakened / Mythic / Transcendent.'),
        S(F('weaponEvoGlow'), 'Evo Glow', 'Glow strength on evolved weapons and their trails.', 0, 2, 0.05, 'x'),
        T(F('tierUpMoment'), 'Evolution Moment', 'Forge flash, rune circle, short text and sound when a weapon evolves. Off = text and sound only.'),
      ],
    },
    {
      id: 'fx-preview',
      title: 'Preview (visual only)',
      items: [
        SEL(F('previewElement'), 'Preview Affinity', 'Shows the effects of any affinity on your hero. The real element effects in combat do not change.', ['Off', ...FX_ELEMENT_ORDER.map(fxElementLabel)]),
        SEL(F('previewEvoTier'), 'Preview Weapon Tier', 'Shows a weapon tier on your hero. Damage does not change.', ['Off', 'Base', 'Awakened', 'Mythic', 'Transcendent']),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PER CHARACTER
// ---------------------------------------------------------------------------
const CHAR_TAB_LABEL: Record<CharacterId, string> = {
  hunter: 'Hunter',
  brute: 'Brute',
  ronin: 'Ronin',
  minstrel: 'Minstrel',
  monk: 'Monk',
  wizard: 'Wizard',
  assassin: 'Assassin',
  ranger: 'Ranger',
  vanguard: 'Vanguard',
  dancer: 'Dancer',
  bouncer: 'Striker',
};

function assassinGroups(P: (k: string) => string[]): GroupDef[] {
  return [
    {
      id: 'assassin-mark',
      title: 'Mark for Death [3]',
      subtitle: 'Brand a foe from very far; press [3] again to shadow-step and execute it',
      items: [
        S(P('assassinMarkRange'), 'Mark Range', 'How far away a foe can be marked (and executed). Very long on purpose.', 300, 2000, 20, 'px'),
        S(P('assassinMarkDuration'), 'Mark Duration', 'Seconds a regular foe stays marked. Press [3] again before it ends to execute it.', 2, 20, 0.5, 'sec'),
        S(P('assassinMarkCooldown'), 'Mark Cooldown', 'Seconds before [3] is ready again after an execute or a boss mark (weapon evolutions shorten it).', 0.5, 20, 0.25, 'sec'),
        S(P('assassinBossMarkBonusPct'), 'Boss Mark Bonus Damage', 'A marked boss takes this much extra damage from every hit (bosses cannot be executed).', 0, 200, 5, 'pct'),
        S(P('assassinBossMarkDuration'), 'Boss Mark Duration', 'Seconds a boss stays marked.', 2, 20, 0.5, 'sec'),
      ],
    },
    {
      id: 'assassin-execute',
      title: 'Execute From Distance',
      subtitle: 'Interact ([0] / stick tap) shadow-steps to a foe and executes it',
      items: [
        S(P('assassinExecRange'), 'Execute Range', 'How far the Assassin can shadow-step to execute an unaware or low-HP foe with Interact.', 80, 900, 10, 'px'),
        S(P('assassinExecHpPct'), 'Low-HP Execute Threshold', 'Alerted regular foes at or below this share of max HP can also be executed from range.', 0, 0.8, 0.05, 'frac'),
        S(P('assassinVisionMult'), 'Enemy Detection ×', 'Multiplies how far foes can spot the Assassin (lower = quieter, harder to see).', 0.2, 1.5, 0.02, 'x'),
      ],
    },
    {
      id: 'assassin-blink',
      title: 'Shadow Blink (Jump again in the air)',
      subtitle: 'Once per airtime. On a phone, flick the stick up a second time in the air',
      items: [
        S(P('assassinBlinkDistance'), 'Blink Distance', 'How far the blink travels in the held direction. It passes through foes but stops at solid walls.', 60, 420, 5, 'px'),
        S(P('assassinBlinkIFrames'), 'Blink I-Frames', 'Invulnerability after a blink.', 0, 1, 0.02, 'sec'),
      ],
    },
    {
      id: 'assassin-dagger',
      title: 'Daggers',
      subtitle: '[1] twin daggers · crouch + [1] throws one',
      items: [
        S(P('assassinComboBonus'), 'Cross-Slash (3rd Hit) Bonus', 'Extra damage on the cross-slash that ends the dagger chain.', 0, 6, 1, 'int'),
        S(P('assassinDaggerRange'), 'Thrown Dagger Range', 'Flight range of the thrown dagger (crouch + [1]). It kills unaware regular foes.', 120, 900, 10, 'px'),
        S(P('assassinDaggerDamage'), 'Thrown Dagger Damage', 'Base damage on an aware target (weapon level adds on top).', 1, 8, 1, 'int'),
        S(P('assassinDaggerCooldown'), 'Thrown Dagger Cooldown', 'Seconds between throws.', 0.2, 4, 0.05, 'sec'),
      ],
    },
  ];
}

function characterTab(id: CharacterId): TabDef {
  const c = CHARACTERS[id];
  const P = (k: string) => ['characters', id, k];
  const special: ItemDef[] =
    id === 'hunter'
      ? [S(P('backdashSec'), 'Backdash Length', 'Base duration of the whip Backdash (key 3) before evolution bonuses.', 0.08, 0.6, 0.01, 'sec')]
      : id === 'brute'
        ? [S(P('hammerMeteorDamage'), 'Hammer Meteor Damage', 'Base damage of the Hammer Meteor slam (before weapon level bonuses).', 1, 15, 1, 'int')]
        : id === 'ronin'
          ? [S(P('katanaMegaBonus'), 'Mega Slash Bonus Damage', 'Extra damage while the charged Katana Mega Slash is active.', 0, 8, 1, 'int')]
          : id === 'monk'
            ? [
                S(P('monkDashLength'), 'Pyre Dash Length', 'Distance covered by the Pyre Dash [3] (before evolution bonuses).', 120, 700, 10, 'px'),
                S(P('monkDashSec'), 'Pyre Dash Duration', 'How long the dash lasts. Shorter = faster dash over the same length. I-frames last the whole dash.', 0.12, 0.7, 0.01, 'sec'),
                S(P('monkDashWidth'), 'Pyre Dash Hitbox Width', 'Width of the dash hitbox around the Monk.', 40, 220, 2, 'px'),
                S(P('monkDashHeightMult'), 'Pyre Dash Hitbox Height ×', 'Hitbox height as a multiple of the Monk\'s height (1.35 = taller than him).', 0.6, 3, 0.05, 'x'),
                S(P('monkDashDamage'), 'Pyre Dash Damage', 'Base damage of the dash (weapon level and hero bonus add on top).', 1, 12, 1, 'int'),
                S(P('monkDashKnockback'), 'Pyre Dash Knockback', 'How hard the dash hurls foes aside (also lifts them).', 0, 900, 10, 'int'),
                S(P('monkDashCooldown'), 'Pyre Dash Cooldown', 'Seconds between dashes (each fist hit shaves 0.2s off — Unbroken Flow).', 0.3, 5, 0.05, 'sec'),
                S(P('monkComboBonus'), 'Palm (3rd Hit) Bonus Damage', 'Extra damage on the heavy palm that ends the 3-hit fist chain.', 0, 6, 1, 'int'),
                S(P('monkChargeTime'), 'Charged Jump Time', 'How long you must hold jump on the ground for a fully charged high leap. A short tap is a normal jump. On a phone, hold the stick up to charge, then release to jump.', 0.2, 1.5, 0.05, 'sec'),
                S(P('monkChargeJumpMult'), 'Charged Jump Height ×', 'Jump-force multiplier at full charge (1.65 is a very high leap). Scales smoothly with how long you held.', 1.1, 2.4, 0.05, 'x'),
                T(P('monkDashDirections'), 'Directional Pyre Dash', 'On: Pyre Dash [3] follows the held direction, including diagonals and up. A downward dash in the air slams into the ground with an impact. Off: always dashes forward (the original dash).'),
              ]
            : id === 'assassin'
              ? []
              : id === 'wizard'
              ? [
                  S(P('wizardBoltSpeed'), 'Bolt Speed', 'Flight speed of the elemental bolt [1].', 200, 1600, 10, 'pxs'),
                  S(P('wizardBoltRange'), 'Bolt Range', 'How far the bolt flies before fading. Mobile auto-attack fires at foes inside ~90% of this.', 120, 700, 10, 'px'),
                  S(P('wizardBoltDamage'), 'Bolt Damage', 'Base bolt damage (weapon level adds on top; every 4th bolt is Overcharged: +1, pierces).', 1, 8, 1, 'int'),
                  S(P('wizardNovaRadius'), 'Nova Radius', 'Radius of the Repulsion Nova [3] around the Wizard.', 60, 360, 5, 'px'),
                  S(P('wizardNovaForce'), 'Nova Force', 'Horizontal push of the nova (falls off a little toward the edge).', 0, 1200, 10, 'int'),
                  S(P('wizardNovaLift'), 'Nova Lift', 'Upward pop of the nova so foes fly in an arc.', 0, 700, 10, 'int'),
                  S(P('wizardNovaDamage'), 'Nova Damage', 'Base nova damage (weapon level adds on top).', 0, 10, 1, 'int'),
                  S(P('wizardNovaCooldown'), 'Nova Cooldown', 'Seconds between novas.', 0.3, 8, 0.05, 'sec'),
                  S(P('wizardFloatDuration'), 'Air Float Duration', 'How long the Wizard hovers after a second jump in the air. He does not fall until this ends. Resets when he lands. On a phone, flick the stick up a second time in the air.', 0.6, 4, 0.1, 'sec'),
                  S(P('wizardFloatMoveSpeed'), 'Air Float Move ×', 'Horizontal move-speed multiplier while floating.', 0.4, 2, 0.05, 'x'),
                ]
              : [
                  S(P('zipSlowMo'), 'Whip-Zip Enemy Slow-Mo', 'Enemy speed while the Minstrel is whip-zipping (0.42 = original).', 0.05, 1, 0.01, 'x'),
                  S(P('zipDurationSec'), 'Whip-Zip Max Duration', 'Maximum time a whip-zip lasts before it auto-ends.', 0.3, 2, 0.02, 'sec'),
                ];
  return {
    id: `char-${id}`,
    label: CHAR_TAB_LABEL[id],
    accent: c.accent,
    roots: ['characters.' + id],
    note: `${c.name} · ${c.title}. HP / MP / bonus damage apply on the next run or hero switch; everything else is live.`,
    groups: [
      {
        id: `${id}-stats`,
        title: 'Stats',
        items: [
          S(P('baseHp'), 'Base HP', 'Starting max HP (before artifacts and upgrades).', 1, 40, 1, 'int'),
          S(P('baseMp'), 'Base MP', 'Starting max MP (before artifacts and upgrades).', 0, 40, 1, 'int'),
        ],
      },
      {
        id: `${id}-move`,
        title: 'Movement',
        items: [
          S(P('speedMult'), 'Speed ×', 'Multiplies General → Move Speed for this hero.', 0.5, 1.8, 0.01, 'x'),
          S(P('jumpMult'), 'Jump ×', 'Multiplies General → Jump Force for this hero.', 0.6, 1.6, 0.01, 'x'),
          S(P('airJumps'), 'Air Jumps', 'Extra mid-air jumps (0 = single jump).', 0, 3, 1, 'int'),
          T(P('canWallCling'), 'Wall Cling & Wall Jump', 'Lets this hero cling to and jump off walls (Ronin by default).'),
        ],
      },
      {
        id: `${id}-attack`,
        title: 'Attack',
        items: [
          S(P('bonusBaseDamage'), 'Bonus Base Damage', 'Flat damage added to every weapon hit.', 0, 6, 1, 'int'),
          S(P('bonusWeaponDamage'), 'Starting Weapon Level Bonus', 'Free weapon damage levels at the start of a run.', 0, 6, 1, 'int'),
          S(P('attackTimeMult'), 'Attack Time ×', 'Multiplies startup, active and recovery time. Lower = faster attacks.', 0.4, 2, 0.05, 'x'),
          S(P('attackRangeMult'), 'Attack Range ×', 'Multiplies General → Weapon Range for this hero.', 0.5, 2, 0.05, 'x'),
        ],
      },
      {
        id: `${id}-spells`,
        title: 'Skills & Spells',
        items: [
          S(P('spellCostMult'), 'Spell MP Cost ×', 'Multiplies the MP cost of every spell cast by this hero (rounded).', 0, 3, 0.25, 'x'),
          S(P('spellCooldownMult'), 'Spell Cooldown ×', 'Multiplies spell cooldowns for this hero.', 0.1, 3, 0.05, 'x'),
        ],
      },
      {
        id: `${id}-assassin`,
        title: 'Assassination',
        items: [
          S(P('assassinDamageMult'), 'Assassination Damage ×', 'Multiplies assassination damage (only matters vs. bosses — regular foes always die).', 0.25, 4, 0.05, 'x'),
          S(P('assassinMpReward'), 'MP Reward', 'MP restored on each assassination.', 0, 10, 1, 'int'),
          S(P('assassinIFramesSec'), 'Assassination I-Frames', 'Invulnerability after an assassination.', 0, 2, 0.02, 'sec'),
          S(P('shadowChainSec'), 'Shadow Chain Duration', 'Base length of the speed + stealth burst after an assassination.', 0, 8, 0.1, 'sec'),
        ],
      },
      ...(id === 'assassin' ? assassinGroups(P) : [{ id: `${id}-special`, title: 'Signature Move', items: special }]),
    ],
  };
}

// ---------------------------------------------------------------------------
// ENEMIES & BOSSES
// ---------------------------------------------------------------------------
function enemyItems(table: 'enemies' | 'bosses', type: string): ItemDef[] {
  const P = (k: string) => [table, type, k];
  const items: ItemDef[] = [
    S(P('hpMult'), 'HP ×', `Multiplies HP (base ${ENEMY_SPECS[type as keyof typeof ENEMY_SPECS].hp}, before raid scaling). Applies on room load.`, 0.25, 5, 0.05, 'x'),
    S(P('damageMult'), 'Damage ×', 'Multiplies contact, projectile and hazard damage from this type (rounded, min 1).', 0, 4, 0.05, 'x'),
    S(P('speedMult'), 'Speed ×', 'Time scale of this type\'s whole AI: movement, cooldowns and windups.', 0.25, 2.5, 0.05, 'x'),
    S(P('windupMult'), 'Attack Windup ×', 'Telegraph time before attacks. Higher = easier to read and dodge.', 0.25, 3, 0.05, 'x'),
    S(P('cooldownMult'), 'Attack Cooldown ×', 'Time between attacks. Lower = more aggressive.', 0.2, 3, 0.05, 'x'),
  ];
  if (table === 'enemies') {
    items.push(
      S(P('visionMult'), 'Detection Range ×', `Multiplies vision (base ${ENEMY_SPECS[type as keyof typeof ENEMY_SPECS].visionRange}px).`, 0.2, 3, 0.05, 'x'),
      S(P('reactionSec'), 'Reaction Delay', 'Seconds from spotting you to its first attack.', 0, 2, 0.05, 'sec')
    );
  } else {
    items.push(
      S(P('phase2At'), 'Phase II at HP', 'HP fraction that triggers Phase II enrage (big boss rooms).', 0, 0.95, 0.01, 'frac'),
      T(P('phase2OnMiniBoss'), 'Phase II in Mini-Boss Rooms', 'Also allow the enrage phase when this boss appears as a regular room boss.'),
      S(P('enrageSpeed'), 'Enrage Speed', 'Pace multiplier while enraged (original 1.24x).', 1, 2.5, 0.02, 'x'),
      S(P('invulnMult'), 'Anti-Combo I-Frames ×', 'Multiplies the post-hit invulnerability that stops combo-locking.', 0, 3, 0.05, 'x'),
      S(P('reactionSec'), 'Opening Delay', 'Seconds before the first attack once the fight starts.', 0, 3, 0.05, 'sec')
    );
  }
  return items;
}

const prettyType = (t: string) => ENEMY_SPECS[t as keyof typeof ENEMY_SPECS]?.name ?? t;

const enemiesTab: TabDef = {
  id: 'enemies',
  label: 'Enemies',
  roots: ['enemies'],
  note: 'Per enemy type. Damage and Vision stack with the General multipliers.',
  groups: REGULAR_ENEMY_ORDER.map((t) => ({
    id: `e-${t}`,
    title: prettyType(t),
    subtitle: t,
    items: enemyItems('enemies', t),
    collapsed: true,
  })),
};

const bossesTab: TabDef = {
  id: 'bosses',
  label: 'Bosses',
  roots: ['bosses'],
  note: 'Per boss. Phase II = enrage at an HP threshold.',
  groups: BOSS_ORDER.map((t) => ({
    id: `b-${t}`,
    title: prettyType(t),
    subtitle: t.replace(/^boss_/, ''),
    items: enemyItems('bosses', t),
    collapsed: true,
  })),
};


const C = (k: string) => ['combat', k];
const combatTab: TabDef = {
  id: 'combat',
  label: 'Attack Feel',
  accent: '#8f86c9',
  roots: ['combat'],
  note: 'These change the attack itself and ability [3] (Weapon Skill). Numbers stay moderate and do not change weapon damage growth. Off = original attack behaviour.',
  groups: [
    {
      id: 'combat-evo',
      title: 'Weapon Evolution Attacks (every 5 upgrades)',
      items: [
        T(C('weaponEvoAttacks'), 'Evo Changes Attacks', 'Awakened / Mythic / Transcendent change reach, hit pattern, extra waves and a bigger ability [3]. Off = only the visual weapon changes.'),
        S(C('evoReach'), 'Evo Reach', 'How much longer / larger each evolution tier makes the attack and ability [3].', 0, 2, 0.05, 'x'),
        S(C('evoPower'), 'Evo Waves', 'How strong the extra waves, pulses and finishers are at Mythic and Transcendent.', 0, 2, 0.05, 'x'),
      ],
    },
    {
      id: 'combat-aff',
      title: 'Affinity Attacks & Ability [3]',
      items: [
        T(C('affinityAttacks'), 'Affinity Changes Attacks', 'Each element changes the basic attack and ability [3] (burn splash, chill push, air reach/pierce, earth shockwave, holy burst, shadow wither/lifesteal). Combined elements mix both parents.'),
        S(C('affinityPower'), 'Affinity Power', 'How strong those affinity attack and ability [3] effects are.', 0, 2, 0.05, 'x'),
        T(C('mutedBolts'), 'Muted Wizard Bolts', 'Wizard bolts and nova use the muted affinity colours instead of the bright element colour.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// SOUND (sound-v1)
// ---------------------------------------------------------------------------
const SND = (k: string) => ['sound', k];
const soundTab: TabDef = {
  id: 'sound',
  label: 'Sound',
  accent: '#7c8bd6',
  roots: ['sound'],
  action: 'credits',
  note: 'Mixer, music rules and footsteps. Defaults match the sound picker mixer (ambience 55 / music 60 / sfx 90).',
  groups: [
    {
      id: 'snd-mix',
      title: 'Mixer',
      items: [
        S(SND('musicVol'), 'Music', 'Volume of the stealth / combat / boss music.', 0, 100, 1, 'pct'),
        S(SND('ambienceVol'), 'Ambience', 'Volume of the always-on ambience bed.', 0, 100, 1, 'pct'),
        S(SND('sfxVol'), 'Sound Effects', 'Volume of weapons, hits, enemies, UI and footsteps.', 0, 100, 1, 'pct'),
        S(SND('footstepVol'), 'Footsteps', 'How loud footsteps are on top of the sound-effects volume.', 0, 200, 5, 'pct'),
        T(SND('musicOn'), 'Music', 'Turn the soundtrack off or on.'),
        T(SND('ambienceOn'), 'Ambience', 'Turn the ambience bed off or on.'),
        T(SND('footstepsOn'), 'Footsteps', 'Terrain footsteps while walking and running.'),
        T(SND('uiSounds'), 'Menu / UI sounds', 'Clicks, confirm, back, hover and error sounds in menus.'),
      ],
    },
    {
      id: 'snd-music',
      title: 'Music rules',
      items: [
        S(SND('combatCooldownSec'), 'Back to stealth after', 'Seconds without combat before the music returns to the stealth track where it stopped.', 2, 30, 1, 'sec'),
        S(SND('crossfadeSec'), 'Crossfade', 'Length of the smooth music crossfades.', 0.4, 5, 0.1, 'sec'),
        S(SND('heavyFoeCount'), 'Heavy combat at', 'Number of alerted foes (or any elite) that switches fights to the heavy / boss music pool.', 2, 12, 1, 'int'),
      ],
    },
  ],
};

export const TUNING_TABS: TabDef[] = [
  generalTab,
  killTab,
  fxTab,
  combatTab,
  soundTab,
  ...CHARACTER_ORDER.map(characterTab),
  enemiesTab,
  bossesTab,
];

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------
export function getAt(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export function setAt(t: TuningConfig, path: string[], value: unknown): TuningConfig {
  const walk = (node: unknown, i: number): unknown => {
    const obj = (node ?? {}) as Record<string, unknown>;
    if (i === path.length - 1) return { ...obj, [path[i]]: value };
    return { ...obj, [path[i]]: walk(obj[path[i]], i + 1) };
  };
  return walk(t, 0) as TuningConfig;
}

/** Copy the tab's roots from `src` into `dst` (used by Reset tab). */
export function copyRoots(dst: TuningConfig, src: TuningConfig, roots: string[]): TuningConfig {
  let out = dst;
  for (const r of roots) {
    const path = r.split('.');
    out = setAt(out, path, JSON.parse(JSON.stringify(getAt(src, path))));
  }
  return out;
}

export function pickRoots(src: TuningConfig, roots: string[]): Record<string, unknown> {
  let out: Record<string, unknown> = {};
  for (const r of roots) {
    const path = r.split('.');
    out = setAt(out as unknown as TuningConfig, path, getAt(src, path)) as unknown as Record<string, unknown>;
  }
  return out;
}

export function countItems(tab: TabDef): number {
  return tab.groups.reduce((n, g) => n + g.items.length, 0);
}

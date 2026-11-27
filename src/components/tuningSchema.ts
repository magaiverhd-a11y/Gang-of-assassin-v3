import { BOSS_ORDER, CHARACTERS, CHARACTER_ORDER, REGULAR_ENEMY_ORDER } from '../game/defaults';
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

export type ItemDef = SliderDef | ToggleDef;

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
  action?: 'testFreeze';
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
  'gameSpeed', 'hitstopMs', 'shakeMult', 'zoomPunchMult', 'flashMult', 'critShakeIntensity',
  'zoom', 'playerScale', 'enemyScale',
  'cameraOffsetY', 'cameraDeadzoneX', 'cameraDeadzoneY', 'cameraSmoothing', 'showCameraGuide',
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
// PER CHARACTER
// ---------------------------------------------------------------------------
const CHAR_TAB_LABEL: Record<CharacterId, string> = {
  hunter: 'Hunter',
  brute: 'Brute',
  ronin: 'Ronin',
  minstrel: 'Minstrel',
};

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
      { id: `${id}-special`, title: 'Signature Move', items: special },
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

export const TUNING_TABS: TabDef[] = [
  generalTab,
  killTab,
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

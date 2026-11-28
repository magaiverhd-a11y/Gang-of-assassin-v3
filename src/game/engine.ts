import { sound } from './audio';
import { AffinityFx } from './fxSystem';
import { tierLook, visualElement } from './affinityFx';
import {
  AffinityFlags,
  affFlags,
  affinityHitMods,
  attackHeightMul,
  attackReachMul,
  combatTune,
  evoCombatTier,
  extraPulses,
  isSkill3Active,
  mutedBoltColors,
  skillZoneRadius,
  startupMul,
  swingWaves,
  wizardBoltPierce,
  wizardExtraBolts,
} from './combatFeel';
import {
  ABILITIES,
  ABILITY_ORDER,
  ARTIFACTS,
  BASE_ELEMENTS,
  BASE_ELEMENT_ORDER,
  BOSS_CHARMS,
  canCharacterUseWeapon,
  CHARACTERS,
  COMBINED_ELEMENTS,
  computeActiveCharmSynergies,
  DEFAULT_TUNING,
  CRAFT_RECIPES,
  GOLD_PREP_RECIPES,
  HERO_SKINS,
  RAID_BOSS_CHARM,
  SACRIFICE_ALTAR_OFFERINGS,
  getActiveElementDef,
  getCombinedElementId,
  getEvolutionTierName,
  getRaidOrderScaling,
  getSpellMilestoneInfo,
  getWeaponMilestoneInfo,
  RAIDS,
  RAIDS_REQUIRED_FOR_END_RAID,
  SPECIAL_ITEMS,
  STANDARD_RAID_ORDER,
  WEAPONS,
  WEAPON_ORDER,
} from './defaults';
import { CAMP_HERO_SPOTS, CAMP_STAGE, ENEMY_SPECS, isFlyingEnemyType } from './level';
import { LORE_BY_ID, LORE_BY_RAID, loadCollectedLoreIds, saveCollectedLoreIds } from './lore';
import { RAIDS_BY_ID } from './raids';
import {
  EnemyTuning,
  CharacterTuning,
  CharacterDef,
  BossTuning,
  AbilityId,
  AffinityZone,
  Afterimage,
  ArtifactId,
  BaseElementId,
  BloodStain,
  BossCharmId,
  GlassWall,
  BossDeathSequence,
  BossHudBar,
  CameraState,
  CharacterId,
  CharacterUnlockState,
  CharmSynergyId,
  DamageNumber,
  ElementalArc,
  Enemy,
  EnemyType,
  GameStatus,
  GasCloud,
  GroundHazard,
  HangingBrazier,
  HeroSkinId,
  HudSnapshot,
  InputState,
  Interactable,
  ItemId,
  Particle,
  PhantomAlly,
  Platform,
  Player,
  Projectile,
  RaidId,
  Rect,
  SacrificeAltarStat,
  SecretWall,
  ShockwaveRing,
  SlashLine,
  SpecialItemId,
  StageDef,
  WorldPickup,
  TuningConfig,
  UpgradeOption,
  WeaponId,
} from './types';

/** Optional per-hit overrides (knockback, bonus damage, assassination guard) used by the Monk & Wizard kits. */
interface HitOpts {
  kbX?: number;
  kbY?: number;
  dirX?: number;
  bonusDamage?: number;
  noAssassinate?: boolean;
  guardBreak?: boolean;
  stun?: number;
  /** Assassin: count this hit as a stealth execution on a regular foe, wherever it stands. */
  forceAssassinate?: boolean;
  /** Assassin: label shown on an execution. */
  callout?: string;
  /** Assassin: kind of hit for the execution flavour. */
  assassinViaDagger?: boolean;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class GameEngine {
  public stageIndex = -1;
  public currentStage: StageDef = CAMP_STAGE;
  public player: Player;
  public enemies: Enemy[] = [];
  public interactables: Interactable[] = [];
  public platforms: Platform[] = [];
  public projectiles: Projectile[] = [];
  public gasClouds: GasCloud[] = [];
  public groundHazards: GroundHazard[] = [];
  /** attacks-v1: elemental patches left by attacks and ability [3]. */
  public affinityZones: AffinityZone[] = [];
  private attackPulseTimer = 0;
  private attackPulsesLeft = 0;
  private affinityTrailAcc = 0;
  public hangingBraziers: HangingBrazier[] = [];
  public secretWalls: SecretWall[] = [];
  public glassWalls: GlassWall[] = [];
  private nextGlassWallId = 1;
  public phantomAllies: PhantomAlly[] = [];
  public crumbleStates = new Map<string, { state: 'intact' | 'shaking' | 'broken'; timer: number }>();
  public minstrelAimAnchor: { x: number; y: number } | null = null;
  public shockwaves: ShockwaveRing[] = [];
  public afterimages: Afterimage[] = [];
  public particles: Particle[] = [];
  /** affinity-v1: elemental affinity + weapon evolution visual effects. */
  public fx: AffinityFx = new AffinityFx({
    onWeaponTierUp: (tier, _prev, moment) => this.onWeaponTierUp(tier, moment),
  });
  public bloodStains: BloodStain[] = [];
  public slashLines: SlashLine[] = [];
  /** Assassin: brief beam from the hero to a freshly marked foe. */
  public markBeams: { x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number }[] = [];
  /** Assassin: short cooldown between interact shadow-step executes. */
  private assassinStepCd = 0;
  public elementalArcs: ElementalArc[] = [];
  public bossDeathSequences: BossDeathSequence[] = [];
  public damageNumbers: DamageNumber[] = [];
  public camera: CameraState;
  public status: GameStatus = 'CAMP';
  private frameInput: InputState | null = null;

  // Persistent Meta Progression (Permanent Artifacts & Boss Cores survive death across ALL heroes!)
  public selectedCharacter: CharacterId = 'hunter';
  public activeRaidId: RaidId = 'nocturne_castle';
  public raidsClearedInRun: RaidId[] = [];
  public raidsClearedCountInRun = 0;
  public offeredRaids: RaidId[] = ['nocturne_castle', 'goblin_camp'];
  public shards = 4;
  public bossCores = 0;
  public gold = 30;
  public ownedArtifacts: ArtifactId[] = [];
  public undyingUsed = false;
  public raidsCompleted = 0;
  public roomsCleared: number[] = [];

  // Run Hero Commitment + Testing Override (Free Hero Switcher anywhere/anytime while testing!)
  public runHeroLocked: CharacterId | null = null;
  public testFreeHeroSwitch = true;

  // Permanent Per-Character Unlocks (Boss Shards -> Weapons, Spells, Specials & Skins kept forever per character)
  public characterUnlocks: Record<CharacterId, CharacterUnlockState> = {
    hunter: { weapons: ['whip'], spells: ['fireball'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    brute: { weapons: ['hammer'], spells: ['fire_weapon'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    ronin: { weapons: ['katana'], spells: ['dash_attack'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    minstrel: { weapons: ['ribbon_whip'], spells: ['gas_bomb'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    monk: { weapons: ['ash_wraps'], spells: ['cinder_palm'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    wizard: { weapons: ['spire_staff'], spells: ['chain_storm'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    assassin: { weapons: ['shadow_daggers'], spells: ['venom_needles'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    ranger: { weapons: ['burst_crossbow'], spells: ['ricochet_snare'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    vanguard: { weapons: ['shield_mace'], spells: ['aegis_slam'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    dancer: { weapons: ['twin_chakram'], spells: ['solar_bloom'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
    bouncer: { weapons: ['prism_lance'], spells: ['prism_beam'], specials: ['eclipse_hourglass', 'smoke_vial', 'fire_bomb'], skins: ['default'] },
  };
  public selectedSkins: Record<CharacterId, HeroSkinId> = {
    hunter: 'default',
    brute: 'default',
    ronin: 'default',
    minstrel: 'default',
    monk: 'default',
    wizard: 'default',
    assassin: 'default',
    ranger: 'default',
    vanguard: 'default',
    dancer: 'default',
    bouncer: 'default',
  };
  // Permanent Cross-Hero Sacrifice Altar Bonuses (Sacrifice 10 Relic Levels + 2 Boss Cores -> applies to ALL heroes forever!)
  public permAltarBonuses: Record<SacrificeAltarStat, number> = {
    hp: 0,
    mp: 0,
    weapon: 0,
    spell: 0,
    regen: 0,
    agility: 0,
  };

  // World Pickups (Gold Coins, HP/MP Goblets, Scattered Map Relics, Mythic Boss Charms) & End-of-Raid Scorecard
  public pickups: WorldPickup[] = [];
  private nextPickupId = 1;
  public raidGoldEarned = 0;
  public raidDamageDealt = 0;
  public raidElapsedSeconds = 0;
  public raidMapRelicsCollected = 0;

  // Run-Scoped Mythic Boss Charms & Cross-Charm Synergies (Every run builds unique charm combinations!)
  public bossCharms: BossCharmId[] = [];
  public lastBossCharmDrop: BossCharmId | null = null;
  private chaliceKillCounter = 0;
  private blastSiphonCounter = 0;

  // Room Boss Relic, Cursed Chamber Branching & Smooth Transition State
  public bossDefeatedHandled = false;
  public isCursedChamber = false;
  private cursedDoorRoomIndex = 0;
  public transitionAlpha = 0;
  public transitionLabel = '';
  public transitionSublabel = '';
  private transitionPhase: 'none' | 'fade_out' | 'hold' | 'fade_in' = 'none';
  private transitionHoldTimer = 0;
  private transitionMidCallback: (() => void) | null = null;
  private modalReturnStatus: 'CAMP' | 'PLAYING' = 'CAMP';

  // Hitstop Flash Freeze, Zoom Punch, Anime Impact Frames & World-Space Impact Burst
  public screenFlashAlpha = 0;
  public screenFlashColor = '#ffffff';
  public impactBurstX = 0;
  public impactBurstY = 0;
  public impactBurstTimer = 0;
  public impactBurstMax = 0.22;
  public impactBurstColor = '#ffd166';
  public impactBurstScale = 1;
  public cameraZoomPunch = 0;
  /** Smoothed camera look-ahead (world px), see tuning.cameraLookAhead. */
  private cameraLookOffset = 0;
  public impactFrameTimer = 0;
  public comboCount = 0;
  public comboTimer = 0;
  public eclipseFreezeTimer = 0;

  public pendingUpgrades: UpgradeOption[] = [];
  public upgradePromptTitle = '';
  private pendingLevelUpLevels: number[] = [];
  private levelUpDelayTimer = 0;
  private elementalHitCounter = 0;
  private elementalKillCounter = 0;

  public time = 0;
  public hitstopTimer = 0;
  public assassinations = 0;
  /** Foes killed by falling into pits (all heroes). */
  private latchedPresses = { attack: false, skill: false, spell: false, item: false, special: false, jump: false, interact: false };
  public fallKills = 0;
  public crits = 0;
  public parries = 0;
  public secretsFound = 0;
  public totalEnemies = 0;
  private nextProjectileId = 1;
  private nextCloudId = 1;
  private nextHazardId = 1;
  private nextBrazierId = 1;
  private nextBossDeathId = 1;
  private nextPhantomId = 1;
  private nextEnemyId = 9000;
  private afterimageAccum = 0;
  private shadowAfterimageAccum = 0;

  // ===== Tuning v2 state =====
  /** Last raw tuning passed in by the UI (used by helpers that do not receive tuning). */
  private tuning: TuningConfig = DEFAULT_TUNING;
  /** Tuning with per-character overrides baked in (renderer uses this too). */
  public effectiveTuning: TuningConfig = DEFAULT_TUNING;
  /** Assassination slow-motion (real-time seconds left + world time scale). */
  public killSlowTimer = 0;
  public killSlowScale = 1;
  /** "Freeze until key" mode: world is held after an assassination until released. */
  public killFreezeHold = false;
  /** Hold requested; engages once the kill hit-stop has finished so the held frame is readable. */
  private killFreezeHoldPending = false;
  /** Collected lore fragment IDs persisted across sessions in localStorage. */
  public collectedLoreIds: string[] = loadCollectedLoreIds();
  /** At most 1 uncollected lore scroll spawns per raid run, assigned to one room (1..4). */
  private activeRaidLorePlan: { roomNumber: number; loreId: string } | null = null;
  public lastLoreToast: { id: string; title: string; raidName: string; count: number } | null = null;
  private lastLoreToastTimer = 0;

  /** Character definition with live tuning overrides applied. */
  private cdef(id: CharacterId): CharacterDef {
    const base = CHARACTERS[id];
    const t = this.tuning.characters?.[id];
    if (!t) return base;
    return {
      ...base,
      baseHp: Math.max(1, Math.round(t.baseHp)),
      baseMp: Math.max(0, Math.round(t.baseMp)),
      speedMult: t.speedMult,
      jumpMult: t.jumpMult,
      airJumps: Math.max(0, Math.round(t.airJumps)),
      canWallCling: t.canWallCling,
      bonusBaseDamage: Math.round(t.bonusBaseDamage),
      bonusWeaponDamage: Math.round(t.bonusWeaponDamage),
    };
  }

  private charTune(id: CharacterId = this.player.characterId): CharacterTuning {
    return this.tuning.characters?.[id] ?? DEFAULT_TUNING.characters[id];
  }

  private enemyTune(enemy: Enemy): EnemyTuning & Partial<BossTuning> {
    const table = enemy.isBoss ? this.tuning.bosses : this.tuning.enemies;
    const fallback = enemy.isBoss ? DEFAULT_TUNING.bosses : DEFAULT_TUNING.enemies;
    return table?.[enemy.type] ?? fallback[enemy.type] ?? DEFAULT_TUNING.enemies.ghoul;
  }

  /** Scale damage an enemy deals to the player (per type x global). */
  private getBossBaseDamage(enemy?: Enemy): number {
    if (this.activeRaidId === 'eclipse_gauntlet') return 2;
    const tier = this.getRaidOrderTier();
    const room = this.currentStage?.roomNumber ?? 1;
    // Early stages: bosses deal 1 damage; deeper raids/rooms grow to 2 damage.
    if (tier <= 1) return 1;
    if (tier === 2 && room <= 2 && !enemy?.isBigBoss) return 1;
    return 2;
  }

  private scaleEnemyDamage(amount: number, enemy: Enemy): number {
    if (amount <= 0) return 0;
    const base = enemy.isBoss ? this.getBossBaseDamage(enemy) : 1;
    const mult =
      this.enemyTune(enemy).damageMult *
      (enemy.isBoss ? this.tuning.bossDamageMult : this.tuning.enemyDamageMult);
    if (mult === 1) return base;
    if (mult <= 0) return 0;
    return Math.max(1, Math.round(base * mult));
  }

  /** Build the tuning the engine actually runs with: global values x current hero's overrides. */
  public buildEffectiveTuning(tuning: TuningConfig): TuningConfig {
    this.tuning = tuning;
    const ct = this.charTune(this.player?.characterId ?? this.selectedCharacter);
    const eff: TuningConfig = {
      ...tuning,
      attackStartupMs: tuning.attackStartupMs * ct.attackTimeMult,
      attackActiveMs: tuning.attackActiveMs * ct.attackTimeMult,
      attackRecoveryMs: tuning.attackRecoveryMs * ct.attackTimeMult,
      attackRange: tuning.attackRange * ct.attackRangeMult,
    };
    this.effectiveTuning = eff;
    return eff;
  }

  /** Release the "freeze until key" hold. Returns true if a hold was active. */
  public releaseKillFreeze(): boolean {
    if (!this.killFreezeHold) return false;
    this.killFreezeHold = false;
    this.killFreezeHoldPending = false;
    return true;
  }

  /** Fire the configured assassination freeze package at a world point (used by kills and the panel's Test button). */
  public triggerKillFreeze(x: number, y: number, isBoss: boolean, tuning: TuningConfig): void {
    const kf = tuning.killFreeze;
    if (!kf || !kf.enabled) {
      // Freeze disabled: plain hit-stop like a normal heavy hit.
      this.hitstopTimer = Math.max(this.hitstopTimer, tuning.hitstopMs / 1000);
      this.triggerShake(Math.max(8, tuning.critShakeIntensity), 0.24);
      return;
    }
    const bossMult = isBoss ? kf.bossFreezeMult : 1;
    this.hitstopTimer = Math.max(this.hitstopTimer, (kf.freezeMs / 1000) * bossMult);
    if (kf.shake > 0) this.triggerShake(kf.shake, kf.shakeMs / 1000);
    if (kf.zoomPunch > 0) this.cameraZoomPunch = Math.max(this.cameraZoomPunch, kf.zoomPunch);
    if (kf.flash) {
      this.impactFrameTimer = Math.max(this.impactFrameTimer, kf.impactFrameMs / 1000);
      this.triggerImpactFlash('#ff334b', kf.flashAlpha, x, y, 1.75, 0.34);
    }
    if (kf.slowMoMs > 0 && kf.slowMoScale < 1) {
      // Slow-mo starts after the freeze ends (timer only ticks once hit-stop is over).
      this.killSlowTimer = Math.max(this.killSlowTimer, kf.slowMoMs / 1000);
      this.killSlowScale = Math.max(0.05, kf.slowMoScale);
    }
    if (kf.holdUntilKey) {
      this.killFreezeHoldPending = true;
    }
  }

  /** Panel "Test Freeze" button: plays the assassination impact on the hero without needing a target. */
  public previewKillFreeze(tuning: TuningConfig): void {
    const p = this.player;
    const x = p.x + p.facing * 30;
    const y = p.y - p.baseH * tuning.playerScale * 0.55;
    sound.playAssassinate();
    this.spawnSparkles(x, y, 34, '#ff334b', '#fff5d6', 1.8);
    this.spawnSlashLine(x, y, p.facing > 0 ? -0.58 : Math.PI + 0.58, 260, 12, '#ff334b', '#ffffff', 0.34);
    this.shockwaves.push({ x, y, radius: 14, maxRadius: 155, color: '#ff334b', life: 0.3, maxLife: 0.3 });
    this.spawnDamageNumber(x, y - 18, 'FREEZE TEST', '#ff334b', 1.3);
    this.triggerKillFreeze(x, y, false, tuning);
  }

  constructor(tuning: TuningConfig) {
    this.tuning = tuning;
    this.buildEffectiveTuning(tuning);
    this.player = this.createFreshPlayer(CAMP_STAGE.floorY, this.selectedCharacter);
    this.camera = this.createCamera(this.player, tuning);
    this.rollOfferedRaids();
    this.enterCamp(tuning, false, false);
  }

  public hasArtifact(id: ArtifactId): boolean {
    return this.ownedArtifacts.includes(id);
  }

  public isEndRaidUnlocked(): boolean {
    const standardCleared = this.raidsClearedInRun.filter((r) =>
      STANDARD_RAID_ORDER.includes(r)
    ).length;
    return standardCleared >= RAIDS_REQUIRED_FOR_END_RAID;
  }

  public rollOfferedRaids(): void {
    if (this.isEndRaidUnlocked()) {
      this.offeredRaids = ['eclipse_gauntlet'];
      return;
    }
    const remaining = STANDARD_RAID_ORDER.filter((r) => !this.raidsClearedInRun.includes(r));
    if (remaining.length === 0) {
      this.offeredRaids = ['eclipse_gauntlet'];
      return;
    }
    this.offeredRaids = shuffle(remaining).slice(0, Math.min(3, remaining.length));
  }

  public triggerImpactFlash(
    color: string,
    alpha: number,
    x: number,
    y: number,
    scale = 1,
    burstDur = 0.22
  ): void {
    this.screenFlashColor = color;
    this.screenFlashAlpha = Math.max(this.screenFlashAlpha, alpha);
    this.impactBurstX = x;
    this.impactBurstY = y;
    this.impactBurstColor = color;
    this.impactBurstScale = scale;
    this.impactBurstMax = burstDur;
    this.impactBurstTimer = burstDur;
  }

  private spawnBossMinion(type: EnemyType, x: number, y: number): void {
    const liveSummons = this.enemies.filter((e) => !e.dead && e.summoned).length;
    if (liveSummons >= 2) return;
    const spec = ENEMY_SPECS[type];
    const scaling = getRaidOrderScaling(this.getRaidOrderTier());
    const hp = Math.max(2, Math.round(spec.hp * scaling.hpMult));
    const clampX = Math.max(
      this.currentStage.bossZoneStartX + 90,
      Math.min(this.currentStage.worldWidth - 110, x)
    );
    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      name: spec.name,
      x: clampX,
      y,
      vx: 0,
      vy: 0,
      baseW: spec.baseW,
      baseH: spec.baseH,
      facing: this.player.x >= clampX ? 1 : -1,
      hp,
      maxHp: hp,
      isBoss: false,
      summoned: true,
      homeX: clampX,
      homeY: y,
      patrolRadius: 150,
      visionRange: 520,
      alerted: true,
      alertTimer: 0.4,
      onGround: !isFlyingEnemyType(type),
      attackCooldown: 0.9,
      attackChargeTimer: 0,
      chargeDuration: 0.55,
      pendingAttackKind: '',
      lungeTimer: 0,
      chargeVx: 0,
      chargeVy: 0,
      stateTimer: 0,
      flashTimer: 0.14,
      invulnTimer: 0,
      bossHitCounter: 0,
      hurtStunTimer: 0,
      burnTimer: 0,
      burnTickTimer: 0,
      animTime: 0,
      dead: false,
    });
    this.applyEnemyHpTuning(this.enemies[this.enemies.length - 1]);
    this.spawnSparkles(clampX, y - spec.baseH * 0.5, 14, '#2dd4bf', '#ffffff', 1.1);
  }

  private applyEnemyHpTuning(e: Enemy): void {
    const m = this.enemyTune(e).hpMult;
    if (m === 1) return;
    e.maxHp = Math.max(1, Math.round(e.maxHp * m));
    e.hp = e.maxHp;
  }

  public getRaidOrderTier(): number {
    return 1 + this.raidsClearedCountInRun;
  }

  public getCurrentRaidRooms(): StageDef[] {
    return RAIDS_BY_ID[this.activeRaidId];
  }

  private getRoomPaceMult(): number {
    // Room 1 starts approachable while keeping enemy charges brisk, ramping smoothly across rooms!
    const rn = this.currentStage.roomNumber;
    if (rn <= 1) return 0.96;
    if (rn === 2) return 1.06;
    if (rn === 3) return 1.15;
    if (rn === 4) return 1.24;
    return 1.26;
  }

  private getArtifactBaseBonuses() {
    const altar = this.permAltarBonuses;
    return {
      maxHp: (this.hasArtifact('crimson_fang') ? 1 : 0) + (this.hasArtifact('undying_heart') ? 1 : 0) + altar.hp,
      maxMp: (this.hasArtifact('moonstone_signet') ? 2 : 0) + (this.hasArtifact('arcane_conduit') ? 2 : 0) + altar.mp,
      hpRegen: (this.hasArtifact('crimson_fang') ? 1 : 0) + altar.regen,
      mpRegen: (this.hasArtifact('moonstone_signet') ? 1 : 0) + altar.regen,
      weaponTier: (this.hasArtifact('soul_anvil') ? 1 : 0) + (this.hasArtifact('bloodsteel_edge') ? 1 : 0) + altar.weapon,
      spellTier: altar.spell,
      extraPotions: this.hasArtifact('everflask') ? 1 : 0,
    };
  }

  private getWeaponFlatBonus(weaponLv: number): number {
    // Rebalanced slower scaling: +1 flat damage every 3 weapon levels (+5% dmg & +1% crit each level in hit calc)
    return Math.floor(Math.max(0, weaponLv - 1) / 3);
  }

  private getSpellFlatBonus(slotLv: number): number {
    // Rebalanced slower scaling: +1 flat spell damage every 3 spell levels (+10% spell dmg each level in hit calc)
    return Math.floor(Math.max(0, slotLv - 1) / 3);
  }

  public getRaidScoreAndRank(): { score: number; rank: 'S' | 'A' | 'B' | 'C' } {
    const speedBonus = Math.max(0, Math.round(1200 - this.raidElapsedSeconds * 4));
    const score = Math.max(
      0,
      Math.round(
        this.raidDamageDealt * 10 +
          this.raidGoldEarned * 8 +
          this.assassinations * 180 +
          this.parries * 140 +
          this.secretsFound * 220 +
          this.raidMapRelicsCollected * 150 +
          this.roomsCleared.length * 350 +
          (this.status === 'VICTORY' ? 1000 + speedBonus : Math.round(speedBonus * 0.25))
      )
    );
    const rank: 'S' | 'A' | 'B' | 'C' =
      score >= 5200 ? 'S' : score >= 3200 ? 'A' : score >= 1600 ? 'B' : 'C';
    return { score, rank };
  }

  private getWeaponEvoTier(): number {
    return Math.floor(Math.max(0, this.player.weaponDamageBonus) / 5);
  }

  private getSpellEvoTier(slotLv: number): number {
    return Math.floor(Math.max(0, slotLv - 1) / 5);
  }

  private hasElement(el: BaseElementId): boolean {
    return this.player.baseElements.includes(el);
  }

  private createFreshPlayer(floorY: number, charId: CharacterId): Player {
    const cDef = this.cdef(charId);
    const art = this.getArtifactBaseBonuses();
    const unlocks = this.characterUnlocks[charId];
    const maxHp = cDef.baseHp + art.maxHp;
    const maxMp = cDef.baseMp + art.maxMp;
    const startSpellLv = 1 + art.spellTier;

    return {
      characterId: charId,
      x: 410,
      y: floorY,
      vx: 0,
      vy: 0,
      baseW: cDef.baseW,
      baseH: cDef.baseH,
      crouchBaseH: cDef.crouchBaseH,
      facing: 1,
      onGround: true,
      crouching: false,

      // Simple integer HP & MP + Per-Room Regen (1 MP/room at Lv 1, 0 HP/room until upgraded or Artifact)
      hp: maxHp,
      maxHp,
      mp: maxMp,
      maxMp,
      hpRegenLevel: art.hpRegen,
      mpRegenLevel: 1 + art.mpRegen,
      hpRegenAccum: 0,
      mpRegenAccum: 0,

      coyoteTimer: 0,
      jumpBufferTimer: 0,
      dropThroughTimer: 0,
      airJumpsRemaining: cDef.airJumps,
      airBackdashUsed: false,
      jumpCutApplied: false,

      wallClingDir: 0,
      wallJumpLockTimer: 0,

      ledgeGrabActive: false,
      ledgeGrabTimer: 0,
      ledgeGrabDuration: 0.16,
      ledgeStartX: 0,
      ledgeStartY: 0,
      ledgeTargetX: 0,
      ledgeTargetY: 0,
      ledgeCooldown: 0,

      weapon: cDef.defaultWeapon,
      unlockedWeapons: WEAPON_ORDER.filter(
        (w) => canCharacterUseWeapon(charId, w) && (w === cDef.defaultWeapon || unlocks.weapons.includes(w))
      ),
      weaponDamageBonus: cDef.bonusWeaponDamage + art.weaponTier,

      attackState: 'idle',
      attackTimer: 0,
      attackTotalStartup: 0.052,
      attackWasCrouching: false,
      attackWasAirborne: false,
      attackWeapon: cDef.defaultWeapon,
      attackHitIds: new Set<number>(),
      attackBufferTimer: 0,

      katanaChargeTimer: 0,
      katanaChargeMax: 0.34,
      katanaMegaSlashTimer: 0,
      katanaMegaSlashMax: 0.24,
      katanaMegaHitIds: new Set<number>(),

      hammerLeapState: 'none',
      hammerLeapTimer: 0,
      rapierLungeTimer: 0,
      rapierLungeHitIds: new Set<number>(),
      axeSpinTimer: 0,
      axeSpinTickTimer: 0,
      naginataVaultTimer: 0,
      naginataVaultHitIds: new Set<number>(),

      minstrelZipActive: false,
      minstrelZipX: 0,
      minstrelZipY: 0,
      minstrelZipTimer: 0,
      minstrelZipHitIds: new Set<number>(),
      minstrelVaultTimer: 0,
      minstrelVaultHitIds: new Set<number>(),
      minstrelDanceTimer: 0,
      minstrelDanceTickTimer: 0,

      monkDashTimer: 0,
      monkDashHitIds: new Set<number>(),
      monkComboStep: 0,
      monkComboTimer: 0,
      monkPalmTimer: 0,
      monkChargeTimer: 0,
      monkCharge: 0,
      monkDashDirX: 1,
      monkDashDirY: 0,
      monkDashSlam: false,
      wizardNovaTimer: 0,
      wizardBoltCount: 0,
      wizardCastTimer: 0,
      wizardFloatTimer: 0,
      wizardFloatUsed: false,
      assassinStepTimer: 0,
      assassinBlinkTimer: 0,
      assassinBlinkUsed: false,
      assassinThrowTimer: 0,
      assassinThrowCooldown: 0,
      assassinMarkCastTimer: 0,
      assassinComboStep: 0,
      assassinComboTimer: 0,

      isHidden: false,
      ambushTimer: 0,
      shadowChainTimer: 0,
      shadowChainCount: 0,
      level: 1,
      xp: 0,
      xpToNext: 5,
      assassinTrainingLevel: 0,
      swiftFootworkLevel: 0,
      baseElements: [],
      combinedElement: null,
      elementResonance: 0,
      parryWindowTimer: 0,
      parryCooldownTimer: 0,
      weaponChargeTimer: 0,
      grimoireElementIndex: 0,
      grimoireOrbs: 3,
      grimoireOrbRechargeTimer: 0,
      shieldGuardActive: false,
      vanguardBashTimer: 0,
      vanguardBashHitIds: new Set<number>(),
      bounceActive: false,
      bouncesLeft: 0,
      maxBounces: 2,
      bounceTimer: 0,
      bounceSpeed: 640,
      bounceHitIds: new Set<number>(),
      bounceWallCooldown: 0,
      bounceDistLeft: 0,
      bounceCountDone: 0,
      tagPartner: null,
      tagPartnerCooldown: 0,
      cursedGlassVulnerable: false,
      skin: this.selectedSkins[charId] ?? 'default',
      runRelicLevels: { hp: 0, mp: 0, weapon: 0, spell: 0, regen: 0, agility: 0 },
      backdashTimer: 0,
      weaponSkillCooldown: 0,
      dashAttackTimer: 0,
      dashAttackLevel: 1,
      dashAttackHitIds: new Set<number>(),
      fireWeaponTimer: 0,
      fireWeaponLevel: 1,
      armorShield: charId === 'vanguard' ? 2 : 0,
      armorTimer: charId === 'vanguard' ? 25 : 0,

      // Single Equipped Spell Slot (Key 4) with each Hero's signature + permanently unlocked spells!
      unlockedAbilities: ABILITY_ORDER.filter(
        (a) => a === cDef.defaultAbility || unlocks.spells.includes(a)
      ),
      unlockedAbilitySlots: 1,
      abilitySlots: [
        cDef.defaultAbility,
        ABILITY_ORDER.find((a) => a !== cDef.defaultAbility) ?? 'dash_attack',
        ABILITY_ORDER.find(
          (a) => a !== cDef.defaultAbility && a !== (ABILITY_ORDER.find((b) => b !== cDef.defaultAbility) ?? 'dash_attack')
        ) ?? 'grapple',
      ] as [AbilityId, AbilityId, AbilityId],
      abilitySlotLevels: [startSpellLv, startSpellLv, startSpellLv],
      abilityCooldowns: {
        fireball: 0,
        dash_attack: 0,
        grapple: 0,
        gas_bomb: 0,
        fire_weapon: 0,
        cinder_palm: 0,
        chain_storm: 0,
        venom_needles: 0,
        ricochet_snare: 0,
        aegis_slam: 0,
        solar_bloom: 0,
        prism_beam: 0,
        frost_nova: 0,
        phantom_blades: 0,
        meteor_call: 0,
        blood_siphon: 0,
      },

      // Single Equipped Item Slot (Key 5) + Single Special Item Slot (Key 6)
      itemSlots: ['health_potion', 'mana_potion', 'armor_potion'],
      itemCounts: {
        health_potion: 2 + art.extraPotions,
        mana_potion: 2 + art.extraPotions,
        armor_potion: 1 + art.extraPotions,
      },
      specialItemSlot: unlocks.specials[0] ?? 'eclipse_hourglass',
      specialItemCounts: {
        eclipse_hourglass: 1,
        hero_tag_horn: 0,
        smoke_vial: 1,
        fire_bomb: 1,
      },
      specialItemCooldown: 0,
      grapple: {
        active: false,
        phase: 'extending',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        maxLength: 350,
        timer: 0,
        slotLevel: 1,
      },

      hitStunTimer: 0,
      isAirKnockback: false,
      invulnTimer: 0,
      flashTimer: 0,
      animTime: 0,
      landTimer: 0,
    };
  }

  private createCamera(player: Player, tuning: TuningConfig): CameraState {
    const startY = player.y + tuning.cameraOffsetY;
    const startX = this.currentStage.isCamp ? Math.max(460, player.x + 80) : player.x + 120;
    return {
      x: startX,
      y: startY,
      targetX: startX,
      targetY: startY,
      anchorY: startY,
      shakeTime: 0,
      shakeDuration: 0.22,
      shakeMagnitude: 0,
      offsetX: 0,
      offsetY: 0,
    };
  }

  public startRoomTransition(
    label: string,
    sublabel: string,
    onMidpoint: () => void
  ): void {
    if (this.transitionPhase !== 'none') return;
    this.transitionLabel = label;
    this.transitionSublabel = sublabel;
    this.transitionMidCallback = onMidpoint;
    this.transitionPhase = 'fade_out';
    this.transitionAlpha = 0;
  }

  public enterCamp(tuning: TuningConfig, withFade = true, preserveRaidUpgrades = true): void {
    const doLoad = () => {
      this.stageIndex = -1;
      this.currentStage = CAMP_STAGE;
      this.platforms = CAMP_STAGE.platforms;
      this.enemies = [];
      this.interactables = CAMP_STAGE.interactables.map((it) => ({ ...it, used: false }));
      this.totalEnemies = 0;
      this.bossDefeatedHandled = false;
      this.roomsCleared = [];
      this.undyingUsed = false;

      this.projectiles = [];
      this.gasClouds = [];
      this.groundHazards = [];
      this.affinityZones = [];
      this.attackPulsesLeft = 0;
      this.hangingBraziers = [];
      this.secretWalls = [];
      this.phantomAllies = [];
      this.pickups = [];
      this.isCursedChamber = false;
      this.crumbleStates.clear();
      this.minstrelAimAnchor = null;
      this.shockwaves = [];
      this.afterimages = [];
      this.particles = [];
      this.fx.reset();
      this.bloodStains = [];
      this.slashLines = [];
      this.markBeams = [];
      this.elementalArcs = [];
      this.bossDeathSequences = [];
      this.damageNumbers = [];
      this.hitstopTimer = 0;
      this.cameraZoomPunch = 0;
      this.impactFrameTimer = 0;
      this.comboCount = 0;
      this.comboTimer = 0;
      this.eclipseFreezeTimer = 0;
      this.pendingUpgrades = [];
      this.pendingLevelUpLevels = [];
      this.levelUpDelayTimer = 0;

      const heroSpot = CAMP_HERO_SPOTS[this.selectedCharacter] ?? {
        x: 590,
        y: CAMP_STAGE.floorY,
        facing: 1 as const,
      };
      const campSpawnX = heroSpot.x;
      const campSpawnY = heroSpot.y;

      if (preserveRaidUpgrades && this.player) {
        // Surviving / winning a raid carries ALL relics, spells, & gear back into Base Camp across ALL heroes!
        const p = this.player;
        const art = this.getArtifactBaseBonuses();
        p.x = campSpawnX;
        p.y = campSpawnY;
        p.vx = 0;
        p.vy = 0;
        p.facing = heroSpot.facing;
        p.onGround = true;
        p.crouching = false;
        p.hp = p.maxHp;
        p.mp = p.maxMp;
        p.attackState = 'idle';
        p.backdashTimer = 0;
        p.weaponSkillCooldown = 0;
        p.specialItemCooldown = 0;
        p.dashAttackTimer = 0;
        p.katanaChargeTimer = 0;
        p.katanaMegaSlashTimer = 0;
        p.hammerLeapState = 'none';
        p.hammerLeapTimer = 0;
        p.rapierLungeTimer = 0;
        p.axeSpinTimer = 0;
        p.naginataVaultTimer = 0;
        p.minstrelZipActive = false;
        p.minstrelZipTimer = 0;
        p.minstrelVaultTimer = 0;
        p.minstrelDanceTimer = 0;
        p.ambushTimer = 0;
        p.shadowChainTimer = 0;
        p.shadowChainCount = 0;
        p.wallClingDir = 0;
        p.ledgeGrabActive = false;
        p.grapple.active = false;
        p.hitStunTimer = 0;
        p.invulnTimer = 0;
        p.dropThroughTimer = 0;
        p.isHidden = false;
        p.landTimer = 0;
        // Restock base potions up to artifact minimum
        p.itemCounts.health_potion = Math.max(p.itemCounts.health_potion, 2 + art.extraPotions);
        p.itemCounts.mana_potion = Math.max(p.itemCounts.mana_potion, 2 + art.extraPotions);
        p.itemCounts.armor_potion = Math.max(p.itemCounts.armor_potion, 1 + art.extraPotions);
        // Ensure offered raids reflect current progress
        if (
          this.offeredRaids.length === 0 ||
          this.offeredRaids.some((r) => r !== 'eclipse_gauntlet' && this.raidsClearedInRun.includes(r)) ||
          (this.isEndRaidUnlocked() && !this.offeredRaids.includes('eclipse_gauntlet'))
        ) {
          this.rollOfferedRaids();
        }
      } else {
        // On Death: wipe run relics & unlock hero commitment for a fresh run; Permanent Unlocks, Artifacts & Altar Bonuses endure!
        this.raidsClearedInRun = [];
        this.raidsClearedCountInRun = 0;
        this.runHeroLocked = null;
        this.bossCharms = [];
        this.lastBossCharmDrop = null;
        this.rollOfferedRaids();
        this.player = this.createFreshPlayer(campSpawnY, this.selectedCharacter);
        this.player.x = campSpawnX;
        this.player.y = campSpawnY;
        this.player.facing = heroSpot.facing;
      }

      this.status = 'CAMP';
      this.camera = this.createCamera(this.player, tuning);
    };

    if (withFade) {
      this.startRoomTransition(
        'Base Camp · Castle Gates',
        preserveRaidUpgrades
          ? 'Upgrades carried home · Prepare by the fire'
          : 'Fallen · Permanent Artifacts endured the night',
        doLoad
      );
    } else {
      doLoad();
    }
  }

  public openRaidSelect(): void {
    if (!this.currentStage.isCamp) return;
    sound.playInteract();
    this.status = 'RAID_SELECT';
  }

  public startRaid(tuning: TuningConfig, raidId?: RaidId): void {
    const targetRaid = raidId ?? this.offeredRaids[0] ?? this.activeRaidId;
    if (targetRaid === 'eclipse_gauntlet' && !this.isEndRaidUnlocked()) {
      return;
    }

    this.activeRaidId = targetRaid;
    // Commit to the chosen hero for the duration of this run (unless Test Free Hero Switch is ON!)
    if (!this.runHeroLocked) {
      this.runHeroLocked = this.selectedCharacter;
    }
    const rooms = this.getCurrentRaidRooms();
    const room1 = rooms[0];
    const raidDef = RAIDS[this.activeRaidId];
    const scaling = getRaidOrderScaling(this.getRaidOrderTier());
    this.roomsCleared = [];
    this.undyingUsed = false;
    this.isCursedChamber = false;
    this.raidGoldEarned = 0;
    this.raidDamageDealt = 0;
    this.raidElapsedSeconds = 0;
    this.raidMapRelicsCollected = 0;
    // Choose 1 random standard room (Room 1, 2, or 3) where defeating the boss unlocks BOTH a Normal Door & a Cursed Door!
    this.cursedDoorRoomIndex = Math.floor(Math.random() * 3);

    // Schedule at most 1 uncollected lore fragment for this raid run (in a random room 1..4)
    const raidLore = LORE_BY_RAID[targetRaid] ?? [];
    const uncollected = raidLore.filter((l) => !this.collectedLoreIds.includes(l.id));
    if (uncollected.length > 0) {
      const pick = uncollected[Math.floor(Math.random() * uncollected.length)];
      this.activeRaidLorePlan = {
        roomNumber: 1 + Math.floor(Math.random() * 4),
        loreId: pick.id,
      };
    } else {
      this.activeRaidLorePlan = null;
    }

    const subtitle =
      targetRaid === 'eclipse_gauntlet'
        ? `END BOSS GAUNTLET · 4 Duo-Boss Chambers + Final Overlord · ${this.cdef(this.selectedCharacter).name}`
        : `${scaling.label} · 4 Rooms + Big Boss · ${this.cdef(this.selectedCharacter).name}`;

    this.startRoomTransition(`${raidDef.name} · ${room1.name}`, subtitle, () => {
      // Preserve the hero's full Camp loadout & carried upgrades when marching into Room 1!
      this.loadStage(0, tuning, true, false, false);
      this.assassinations = 0;
      this.crits = 0;
      this.parries = 0;
      this.secretsFound = 0;
    });
  }

  public setTestFreeHeroSwitch(enabled: boolean): void {
    this.testFreeHeroSwitch = enabled;
    sound.playInteract();
  }

  public selectCharacter(charId: CharacterId, tuning: TuningConfig): void {
    // Allow switching anywhere/anytime while Test Mode is active; otherwise only in Camp before committing to a run!
    if (!this.testFreeHeroSwitch) {
      if (!this.currentStage.isCamp) return;
      if (this.runHeroLocked && this.runHeroLocked !== charId) {
        sound.playUi('error');
        this.spawnDamageNumber(
          this.player.x,
          this.player.y - this.player.baseH * tuning.playerScale - 18,
          `COMMITTED TO ${this.cdef(this.runHeroLocked).name.toUpperCase()}`,
          '#f87171',
          0.95
        );
        return;
      }
    }
    if (this.selectedCharacter === charId) return;

    const prev = this.player;
    const prevBase = this.cdef(prev.characterId);
    const art = this.getArtifactBaseBonuses();

    // Preserve carried raid upgrade deltas when swapping heroes!
    const extraHp = Math.max(0, prev.maxHp - (prevBase.baseHp + art.maxHp));
    const extraMp = Math.max(0, prev.maxMp - (prevBase.baseMp + art.maxMp));
    const extraHpRegen = Math.max(0, prev.hpRegenLevel - art.hpRegen);
    const extraMpRegen = Math.max(0, prev.mpRegenLevel - (1 + art.mpRegen));
    const extraWeaponTier = Math.max(0, prev.weaponDamageBonus - (prevBase.bonusWeaponDamage + art.weaponTier));

    this.selectedCharacter = charId;
    const next = this.createFreshPlayer(this.currentStage.floorY, charId);
    next.x = prev.x;
    next.y = prev.y;
    next.facing = prev.facing;
    next.onGround = prev.onGround;
    next.maxHp += extraHp;
    next.hp = this.currentStage.isCamp ? next.maxHp : Math.min(next.maxHp, Math.max(1, prev.hp));
    next.maxMp += extraMp;
    next.mp = this.currentStage.isCamp ? next.maxMp : Math.min(next.maxMp, prev.mp);
    next.hpRegenLevel += extraHpRegen;
    next.mpRegenLevel += extraMpRegen;
    next.weaponDamageBonus += extraWeaponTier;
    next.runRelicLevels = { ...prev.runRelicLevels };

    // Apply this hero's permanent Boss-Shard unlocks + carried universal/class-eligible run gear
    const nextChar = this.cdef(charId);
    const charUnlocks = this.characterUnlocks[charId];
    const mergedWeapons = new Set<WeaponId>([
      nextChar.defaultWeapon,
      ...charUnlocks.weapons,
      ...prev.unlockedWeapons.filter((w) => canCharacterUseWeapon(charId, w)),
    ]);
    next.unlockedWeapons = WEAPON_ORDER.filter((w) => mergedWeapons.has(w));
    next.weapon = canCharacterUseWeapon(charId, prev.weapon) && next.unlockedWeapons.includes(prev.weapon)
      ? prev.weapon
      : nextChar.defaultWeapon;

    // Ensure each hero has their signature starter spell + permanent unlocked spells + run spells
    const onlyHadPrevStarter =
      prev.unlockedAbilities.length === 1 && prev.unlockedAbilities[0] === prevBase.defaultAbility;
    if (onlyHadPrevStarter && charUnlocks.spells.length <= 1) {
      next.unlockedAbilities = [nextChar.defaultAbility];
      next.abilitySlots = [
        nextChar.defaultAbility,
        prev.abilitySlots[1] === nextChar.defaultAbility ? prevBase.defaultAbility : prev.abilitySlots[1],
        prev.abilitySlots[2] === nextChar.defaultAbility ? 'grapple' : prev.abilitySlots[2],
      ] as [AbilityId, AbilityId, AbilityId];
    } else {
      const mergedAbilities = new Set<AbilityId>([
        nextChar.defaultAbility,
        ...charUnlocks.spells,
        ...prev.unlockedAbilities,
      ]);
      next.unlockedAbilities = ABILITY_ORDER.filter((a) => mergedAbilities.has(a));
      const nextSlots = [...prev.abilitySlots] as [AbilityId, AbilityId, AbilityId];
      if (!nextSlots.includes(nextChar.defaultAbility)) {
        nextSlots[0] = nextChar.defaultAbility;
      }
      next.abilitySlots = nextSlots;
    }

    next.unlockedAbilitySlots = 1;
    next.abilitySlotLevels = [...prev.abilitySlotLevels] as [number, number, number];
    next.itemSlots = [...prev.itemSlots] as [ItemId, ItemId, ItemId];
    next.itemCounts = { ...prev.itemCounts };
    next.specialItemSlot = charUnlocks.specials.includes(prev.specialItemSlot)
      ? prev.specialItemSlot
      : charUnlocks.specials[0] ?? 'eclipse_hourglass';
    next.specialItemCounts = { ...prev.specialItemCounts };
    next.skin = this.selectedSkins[charId] ?? 'default';
    next.level = prev.level;
    next.xp = prev.xp;
    next.xpToNext = prev.xpToNext;
    next.assassinTrainingLevel = prev.assassinTrainingLevel;
    next.swiftFootworkLevel = prev.swiftFootworkLevel;
    next.baseElements = [...prev.baseElements];
    next.combinedElement = prev.combinedElement;
    next.elementResonance = prev.elementResonance;
    // If the bound Phantom Tag Partner is the hero we just swapped into, swap partner to the previous hero!
    next.tagPartner = prev.tagPartner === charId ? prev.characterId : prev.tagPartner;
    next.tagPartnerCooldown = 0;

    this.player = next;
    sound.playUpgradePick();
    this.spawnSparkles(
      this.player.x,
      this.player.y - this.player.baseH * tuning.playerScale * 0.5,
      16,
      this.cdef(charId).accent,
      '#fff5d6',
      1.1
    );
    this.spawnDamageNumber(
      this.player.x,
      this.player.y - this.player.baseH * tuning.playerScale - 16,
      this.cdef(charId).name.toUpperCase(),
      this.cdef(charId).accent,
      1.0
    );
  }

  public craftRecipe(recipeId: string, tuning: TuningConfig): boolean {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
    if (!recipe || this.shards < recipe.cost) return false;

    const p = this.player;

    if (recipe.category === 'weapon' && recipe.weaponId) {
      if (!canCharacterUseWeapon(p.characterId, recipe.weaponId) || p.unlockedWeapons.includes(recipe.weaponId)) return false;
      this.shards -= recipe.cost;
      p.unlockedWeapons = WEAPON_ORDER.filter(
        (w) => p.unlockedWeapons.includes(w) || w === recipe.weaponId
      );
    } else if (recipe.category === 'potion' && recipe.itemId) {
      this.shards -= recipe.cost;
      p.itemCounts[recipe.itemId] += 1;
    } else if (recipe.category === 'special_item' && recipe.specialItemId) {
      const def = SPECIAL_ITEMS[recipe.specialItemId];
      if (p.specialItemCounts[recipe.specialItemId] >= def.maxCharges) return false;
      this.shards -= recipe.cost;
      p.specialItemCounts[recipe.specialItemId] += 1;
    } else {
      return false;
    }

    sound.playCraft();
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 14, recipe.accent, '#ffffff', 1.0);
    return true;
  }

  public craftArtifact(artifactId: ArtifactId, tuning: TuningConfig): boolean {
    const art = ARTIFACTS[artifactId];
    if (!art || art.isSacrifice) return false;
    if (this.hasArtifact(artifactId)) return false;
    if (this.bossCores < art.coreCost || this.shards < art.shardCost) return false;

    this.bossCores -= art.coreCost;
    this.shards -= art.shardCost;
    this.ownedArtifacts.push(artifactId);

    // Apply immediate stat gains to the current hero as well!
    const p = this.player;
    if (artifactId === 'crimson_fang') {
      p.maxHp += 1;
      p.hp = p.maxHp;
      p.hpRegenLevel += 1;
    } else if (artifactId === 'moonstone_signet') {
      p.maxMp += 2;
      p.mp = p.maxMp;
      p.mpRegenLevel += 1;
    } else if (artifactId === 'soul_anvil') {
      p.weaponDamageBonus += 1;
    } else if (artifactId === 'everflask') {
      p.itemCounts.health_potion += 1;
      p.itemCounts.mana_potion += 1;
      p.itemCounts.armor_potion += 1;
    }

    sound.playCraft();
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 22, art.accent, '#ffd166', 1.3);
    this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 20, art.name.toUpperCase(), art.accent, 1.05, 'PERMANENT ARTIFACT');
    return true;
  }

  public canSacrificeForArtifact(artifactId: ArtifactId): boolean {
    const art = ARTIFACTS[artifactId];
    if (!art || !art.isSacrifice) return false;
    if (this.hasArtifact(artifactId)) return false;
    if (this.bossCores < art.coreCost) return false;

    const p = this.player;
    const baseChar = this.cdef(p.characterId);
    const artBonus = this.getArtifactBaseBonuses();

    switch (art.sacrificeType) {
      case 'spell':
        return p.unlockedAbilities.length >= 2;
      case 'weapon_power':
        return p.weaponDamageBonus > baseChar.bonusWeaponDamage + artBonus.weaponTier;
      case 'max_hp':
        return p.maxHp > baseChar.baseHp + artBonus.maxHp;
      case 'slot_level':
        return p.abilitySlotLevels.some((lv, idx) => idx < p.unlockedAbilitySlots && lv >= 2);
      default:
        return false;
    }
  }

  public sacrificeForArtifact(
    artifactId: ArtifactId,
    tuning: TuningConfig,
    sacrificedSpellId?: AbilityId
  ): boolean {
    const art = ARTIFACTS[artifactId];
    if (!art || !art.isSacrifice || !this.canSacrificeForArtifact(artifactId)) return false;

    const p = this.player;

    switch (art.sacrificeType) {
      case 'spell': {
        const target =
          sacrificedSpellId && p.unlockedAbilities.includes(sacrificedSpellId)
            ? sacrificedSpellId
            : p.unlockedAbilities[p.unlockedAbilities.length - 1];
        if (!target || p.unlockedAbilities.length < 2) return false;
        p.unlockedAbilities = p.unlockedAbilities.filter((a) => a !== target);
        // Replace any equipped reference to the sacrificed spell with another owned spell
        for (let i = 0; i < 3; i++) {
          if (p.abilitySlots[i] === target) {
            p.abilitySlots[i] = p.unlockedAbilities[0];
          }
        }
        break;
      }
      case 'weapon_power': {
        p.weaponDamageBonus = Math.max(0, p.weaponDamageBonus - 1);
        break;
      }
      case 'max_hp': {
        p.maxHp = Math.max(1, p.maxHp - 1);
        p.hp = Math.min(p.hp, p.maxHp);
        break;
      }
      case 'slot_level': {
        let highestIdx = -1;
        let highestLv = 1;
        for (let i = 0; i < p.unlockedAbilitySlots; i++) {
          if (p.abilitySlotLevels[i] > highestLv) {
            highestLv = p.abilitySlotLevels[i];
            highestIdx = i;
          }
        }
        if (highestIdx === -1) return false;
        p.abilitySlotLevels[highestIdx] -= 1;
        break;
      }
    }

    this.bossCores -= art.coreCost;
    this.ownedArtifacts.push(artifactId);

    // Apply permanent stat bonuses granted by the newly forged Sacrifice Artifact
    if (artifactId === 'bloodsteel_edge') {
      p.weaponDamageBonus += 1;
    } else if (artifactId === 'undying_heart') {
      p.maxHp += 1;
      p.hp = p.maxHp;
    } else if (artifactId === 'arcane_conduit') {
      p.maxMp += 2;
      p.mp = p.maxMp;
    }

    sound.playCraft();
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 26, art.accent, '#ffffff', 1.4);
    this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 20, art.name.toUpperCase(), art.accent, 1.1, 'SACRIFICE COMPLETE');
    return true;
  }

  /** Gold Preparations Shop: buy HP/MP/Armor potions and simple tactical special items with Gold. */
  public buyGoldPrep(recipeId: string, tuning: TuningConfig): boolean {
    const recipe = GOLD_PREP_RECIPES.find((r) => r.id === recipeId);
    if (!recipe || this.gold < recipe.goldCost) return false;
    const p = this.player;

    if (recipe.category === 'potion' && recipe.itemId) {
      this.gold -= recipe.goldCost;
      p.itemCounts[recipe.itemId] += 1;
    } else if (recipe.category === 'special_item' && recipe.specialItemId) {
      const def = SPECIAL_ITEMS[recipe.specialItemId];
      if ((p.specialItemCounts[recipe.specialItemId] ?? 0) >= def.maxCharges) return false;
      this.gold -= recipe.goldCost;
      p.specialItemCounts[recipe.specialItemId] = (p.specialItemCounts[recipe.specialItemId] ?? 0) + 1;
      const unlocks = this.characterUnlocks[p.characterId];
      if (!unlocks.specials.includes(recipe.specialItemId)) {
        unlocks.specials.push(recipe.specialItemId);
      }
    } else {
      return false;
    }

    sound.playCraft();
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 14, recipe.accent, '#ffd166', 1.0);
    return true;
  }

  /** Crafting Type 1 — Permanent Character Unlocks (Boss Cores): weapons, spells, specials & skins for the CURRENT hero! */
  public unlockForCurrentChar(
    kind: 'weapon' | 'spell' | 'special' | 'skin',
    id: string,
    coreCost: number,
    tuning: TuningConfig
  ): boolean {
    if (this.bossCores < coreCost) return false;
    const p = this.player;
    const unlocks = this.characterUnlocks[p.characterId];
    let label = id.toUpperCase();
    let accent = '#e5a93c';

    if (kind === 'weapon') {
      const wId = id as WeaponId;
      if (!canCharacterUseWeapon(p.characterId, wId) || unlocks.weapons.includes(wId)) return false;
      this.bossCores -= coreCost;
      unlocks.weapons.push(wId);
      if (!p.unlockedWeapons.includes(wId)) {
        p.unlockedWeapons = WEAPON_ORDER.filter((w) => p.unlockedWeapons.includes(w) || w === wId);
      }
      label = WEAPONS[wId].name.toUpperCase();
      accent = WEAPONS[wId].accent;
    } else if (kind === 'spell') {
      const abId = id as AbilityId;
      if (unlocks.spells.includes(abId)) return false;
      this.bossCores -= coreCost;
      unlocks.spells.push(abId);
      if (!p.unlockedAbilities.includes(abId)) {
        p.unlockedAbilities = ABILITY_ORDER.filter((a) => p.unlockedAbilities.includes(a) || a === abId);
      }
      label = ABILITIES[abId].name.toUpperCase();
      accent = ABILITIES[abId].accent;
    } else if (kind === 'special') {
      const spId = id as SpecialItemId;
      if (unlocks.specials.includes(spId)) return false;
      this.bossCores -= coreCost;
      unlocks.specials.push(spId);
      p.specialItemCounts[spId] = Math.max(1, p.specialItemCounts[spId] ?? 0);
      label = SPECIAL_ITEMS[spId].name.toUpperCase();
      accent = SPECIAL_ITEMS[spId].accent;
    } else if (kind === 'skin') {
      const skinId = id as HeroSkinId;
      if (unlocks.skins.includes(skinId)) return false;
      this.bossCores -= coreCost;
      unlocks.skins.push(skinId);
      this.selectedSkins[p.characterId] = skinId;
      p.skin = skinId;
      label = HERO_SKINS[skinId].name.toUpperCase();
      accent = HERO_SKINS[skinId].accent;
    } else {
      return false;
    }

    sound.playCraft();
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 22, accent, '#ffffff', 1.25);
    this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 20, label, accent, 1.05, 'PERMANENT UNLOCK');
    return true;
  }

  /** Equip an unlocked skin for the current hero in Base Camp. */
  public selectSkin(skinId: HeroSkinId): void {
    const p = this.player;
    if (!this.characterUnlocks[p.characterId].skins.includes(skinId)) return;
    this.selectedSkins[p.characterId] = skinId;
    p.skin = skinId;
    sound.playInteract();
  }

  /** Crafting Type 2 — Sacrifice Altar: Pay Boss Cores + Sacrifice 10 levels of a Run Relic for a PERMANENT bonus on ALL heroes! */
  public sacrificeRelicAltar(stat: SacrificeAltarStat, tuning: TuningConfig): boolean {
    const def = SACRIFICE_ALTAR_OFFERINGS[stat];
    if (!def) return false;
    const p = this.player;
    if (this.bossCores < def.coreCost) return false;
    if ((p.runRelicLevels[stat] ?? 0) < def.levelsRequired) return false;

    this.bossCores -= def.coreCost;
    p.runRelicLevels[stat] -= def.levelsRequired;
    this.permAltarBonuses[stat] += 1;

    // Deduct the sacrificed run levels from current run stats, then apply the new permanent +1 blessing!
    if (stat === 'hp') {
      p.maxHp = Math.max(this.cdef(p.characterId).baseHp, p.maxHp - 5 + 1);
      p.hp = Math.min(p.maxHp, p.hp);
    } else if (stat === 'mp') {
      p.maxMp = Math.max(this.cdef(p.characterId).baseMp, p.maxMp - 5 + 1);
      p.mp = Math.min(p.maxMp, p.mp);
    } else if (stat === 'weapon') {
      p.weaponDamageBonus = Math.max(this.permAltarBonuses.weapon, p.weaponDamageBonus - 10 + 1);
    } else if (stat === 'spell') {
      p.abilitySlotLevels[0] = Math.max(1 + this.permAltarBonuses.spell, p.abilitySlotLevels[0] - 10 + 1);
    } else if (stat === 'regen') {
      p.hpRegenLevel = Math.max(this.permAltarBonuses.regen, p.hpRegenLevel - 5 + 1);
      p.mpRegenLevel = Math.max(1 + this.permAltarBonuses.regen, p.mpRegenLevel - 5 + 1);
    } else if (stat === 'agility') {
      p.assassinTrainingLevel = Math.max(0, p.assassinTrainingLevel - 5);
      p.swiftFootworkLevel = Math.max(0, p.swiftFootworkLevel - 5);
    }

    sound.playCursedShrine();
    this.triggerShake(11, 0.3);
    this.triggerImpactFlash(def.accent, 0.48, p.x, p.y - p.baseH * 0.5, 1.5, 0.34);
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 30, def.accent, '#ffd166', 1.45);
    this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 24, def.bonusLabel.toUpperCase(), def.accent, 1.1, 'ALTAR BLESSING');
    return true;
  }

  public hasBossCharm(id: BossCharmId): boolean {
    return this.bossCharms.includes(id);
  }

  public getActiveCharmSynergies(): CharmSynergyId[] {
    return computeActiveCharmSynergies(this.bossCharms).map((s) => s.id);
  }

  public hasCharmSynergy(id: CharmSynergyId): boolean {
    return this.getActiveCharmSynergies().includes(id);
  }

  private awardBossCharm(charmId: BossCharmId, fxX: number, fxY: number): void {
    const def = BOSS_CHARMS[charmId];
    this.lastBossCharmDrop = charmId;
    const prevSynergies = new Set(this.getActiveCharmSynergies());
    if (!this.bossCharms.includes(charmId)) {
      this.bossCharms.push(charmId);
    }
    const newSynergies = computeActiveCharmSynergies(this.bossCharms).filter((s) => !prevSynergies.has(s.id));
    sound.playMapRelicPickup();
    this.triggerImpactFlash(def.color, 0.36, fxX, fxY, 1.3, 0.28);
    this.shockwaves.push({
      x: fxX,
      y: fxY,
      radius: 12,
      maxRadius: 145,
      color: def.color,
      life: 0.36,
      maxLife: 0.36,
    });
    this.spawnSparkles(fxX, fxY, 32, def.color, '#ffffff', 1.45);
    this.spawnDamageNumber(fxX, fxY - 34, `${def.name.toUpperCase()}!`, def.color, 1.25, 'MYTHIC BOSS CHARM');
    if (newSynergies.length > 0) {
      this.spawnDamageNumber(
        fxX,
        fxY - 68,
        `SYNERGY: ${newSynergies[0].name.toUpperCase()}!`,
        newSynergies[0].color,
        1.18,
        'CHARM RESONANCE'
      );
    }
  }

  private spawnWorldPickup(
    kind: WorldPickup['kind'],
    x: number,
    y: number,
    value: number,
    vx = (Math.random() - 0.5) * 180,
    vy = -(160 + Math.random() * 110),
    charmId?: BossCharmId,
    loreId?: string
  ): void {
    const isPersistent = kind === 'map_relic' || kind === 'boss_charm' || kind === 'lore_fragment';
    this.pickups.push({
      id: this.nextPickupId++,
      kind,
      x,
      y,
      vx,
      vy,
      value,
      life: isPersistent ? 9999 : 22,
      bobPhase: Math.random() * Math.PI * 2,
      grounded: isPersistent,
      charmId,
      loreId,
    });
  }

  /** Scatter 5-7 shimmering Map Relics across high-road platforms, ledges & Underground Secret Passages! */
  private spawnMapRelicsForStage(): void {
    if (this.currentStage.isCamp || this.currentStage.isBigBossRoom) {
      return;
    }

    // Spawn the single planned Lore Fragment if this room matches the raid's lore plan!
    if (
      this.activeRaidLorePlan &&
      this.activeRaidLorePlan.roomNumber === this.currentStage.roomNumber &&
      !this.collectedLoreIds.includes(this.activeRaidLorePlan.loreId)
    ) {
      const loreCandidates = this.platforms.filter(
        (pl) =>
          !pl.id.startsWith('wall-') &&
          !pl.id.startsWith('floor-') &&
          pl.style !== 'grate' &&
          pl.w >= 90 &&
          pl.x > 260 &&
          pl.x + pl.w < this.currentStage.bossZoneStartX - 80
      );
      if (loreCandidates.length > 0) {
        const pickedPlat = loreCandidates[Math.floor(Math.random() * loreCandidates.length)];
        this.spawnWorldPickup(
          'lore_fragment',
          pickedPlat.x + pickedPlat.w * 0.5,
          pickedPlat.y - 30,
          0,
          0,
          0,
          undefined,
          this.activeRaidLorePlan.loreId
        );
      } else {
        this.spawnWorldPickup(
          'lore_fragment',
          Math.min(this.currentStage.bossZoneStartX - 180, 620),
          this.currentStage.floorY - 36,
          0,
          0,
          0,
          undefined,
          this.activeRaidLorePlan.loreId
        );
      }
    }

    if (this.currentStage.isBossGauntletRoom) {
      return;
    }

    // Always seed 2 high-value Map Relics inside any Underground Secret Passage!
    const ugFloors = this.platforms.filter((pl) => pl.style === 'underground' && pl.w >= 140);
    for (const ug of ugFloors) {
      this.spawnWorldPickup('map_relic', ug.x + ug.w * 0.28, ug.y - 28, 20, 0, 0);
      this.spawnWorldPickup('map_relic', ug.x + ug.w * 0.72, ug.y - 28, 20, 0, 0);
    }

    const candidates = this.platforms.filter(
      (pl) =>
        !pl.id.startsWith('wall-') &&
        !pl.id.startsWith('floor-') &&
        pl.style !== 'underground' &&
        pl.style !== 'grate' &&
        pl.w >= 70 &&
        pl.x > 180 &&
        pl.x + pl.w < this.currentStage.bossZoneStartX - 80
    );
    const chosen = shuffle(candidates).slice(0, 5);
    for (const plat of chosen) {
      const rx = plat.x + plat.w * (0.25 + Math.random() * 0.5);
      const ry = plat.y - 26;
      this.spawnWorldPickup('map_relic', rx, ry, 15, 0, 0);
    }
    if (chosen.length < 4) {
      const floorY = this.currentStage.floorY;
      for (let i = chosen.length; i < 4; i++) {
        const rx = 280 + i * 320;
        if (rx < this.currentStage.bossZoneStartX - 100) {
          this.spawnWorldPickup('map_relic', rx, floorY - 34, 15, 0, 0);
        }
      }
    }
  }

  private updatePickups(dt: number, tuning: TuningConfig): void {
    const p = this.player;
    const ph = (p.crouching ? p.crouchBaseH : p.baseH) * tuning.playerScale;
    const pcx = p.x;
    const pcy = p.y - ph * 0.5;

    if (this.lastLoreToastTimer > 0) {
      this.lastLoreToastTimer = Math.max(0, this.lastLoreToastTimer - dt);
      if (this.lastLoreToastTimer <= 0) {
        this.lastLoreToast = null;
      }
    }

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pk = this.pickups[i];
      pk.bobPhase += dt * 4.5;
      const isFloatingRelic =
        pk.kind === 'map_relic' || pk.kind === 'boss_charm' || pk.kind === 'lore_fragment';
      if (!isFloatingRelic) {
        pk.life -= dt;
        if (pk.life <= 0) {
          this.pickups.splice(i, 1);
          continue;
        }
      }

      const dx = pcx - pk.x;
      const dy = pcy - pk.y;
      const dist = Math.hypot(dx, dy);

      // Gentle magnetic pull on coins, goblets, lore & boss charms when player approaches
      const magnetRadius =
        pk.kind === 'boss_charm'
          ? 140
          : pk.kind === 'lore_fragment'
            ? 74
            : pk.kind === 'map_relic'
              ? 56
              : 108;
      if (dist < magnetRadius && dist > 1) {
        const pull = pk.kind === 'map_relic' || pk.kind === 'lore_fragment' ? 280 : 380;
        pk.vx += (dx / dist) * pull * dt * 6;
        pk.vy += (dy / dist) * pull * dt * 6;
        pk.grounded = false;
      }

      if (!pk.grounded) {
        if (!isFloatingRelic) {
          pk.vy += 680 * dt;
        }
        pk.x += pk.vx * dt;
        pk.y += pk.vy * dt;
        pk.vx *= Math.pow(0.25, dt);

        if (!isFloatingRelic) {
          const floorY = this.currentStage.floorY;
          if (pk.y >= floorY - 8 && pk.y <= floorY + 20) {
            pk.y = floorY - 8;
            if (Math.abs(pk.vy) > 95) {
              pk.vy = -pk.vy * 0.42;
            } else {
              pk.vy = 0;
              pk.vx *= 0.6;
              pk.grounded = true;
            }
          } else if (pk.vy > 0) {
            for (const plat of this.platforms) {
              if (!this.isPlatformSolid(plat) || plat.id.startsWith('wall-')) continue;
              if (pk.x >= plat.x + 4 && pk.x <= plat.x + plat.w - 4 && pk.y >= plat.y - 10 && pk.y <= plat.y + 12) {
                pk.y = plat.y - 10;
                pk.vy = 0;
                pk.vx *= 0.5;
                pk.grounded = true;
                break;
              }
            }
          }
        }
      }

      // Collect pickup on overlap!
      if (dist < (pk.kind === 'boss_charm' ? 48 : pk.kind === 'lore_fragment' ? 42 : pk.kind === 'map_relic' ? 38 : 34)) {
        if (pk.kind === 'gold') {
          this.gold += pk.value;
          this.raidGoldEarned += pk.value;
          sound.playGoldCoin();
          this.spawnSparkles(pk.x, pk.y, 7, '#fbbf24', '#fef08a', 0.78);
          this.spawnDamageNumber(pk.x, pk.y - 14, `+${pk.value}g`, '#ffd166', 0.85);
        } else if (pk.kind === 'hp_goblet') {
          const heal = Math.min(pk.value, p.maxHp - p.hp);
          p.hp = Math.min(p.maxHp, p.hp + pk.value);
          sound.playGobletDrink(false);
          this.spawnSparkles(pk.x, pk.y, 12, '#ef4444', '#fecaca', 0.95);
          this.spawnDamageNumber(pk.x, pk.y - 16, heal > 0 ? `+${heal} HP` : 'HP FULL', '#f87171', 0.92, 'GOBLET');
        } else if (pk.kind === 'mp_goblet') {
          const gain = Math.min(pk.value, p.maxMp - p.mp);
          p.mp = Math.min(p.maxMp, p.mp + pk.value);
          sound.playGobletDrink(true);
          this.spawnSparkles(pk.x, pk.y, 12, '#3b82f6', '#bfdbfe', 0.95);
          this.spawnDamageNumber(pk.x, pk.y - 16, gain > 0 ? `+${gain} MP` : 'MP FULL', '#60a5fa', 0.92, 'GOBLET');
        } else if (pk.kind === 'map_relic') {
          this.gold += pk.value;
          this.raidGoldEarned += pk.value;
          this.raidMapRelicsCollected += 1;
          sound.playMapRelicPickup();
          this.triggerImpactFlash('#fde047', 0.22, pk.x, pk.y, 0.95, 0.2);
          this.shockwaves.push({
            x: pk.x,
            y: pk.y,
            radius: 6,
            maxRadius: 68,
            color: '#fbbf24',
            life: 0.26,
            maxLife: 0.26,
          });
          this.spawnSparkles(pk.x, pk.y, 20, '#fbbf24', '#e879f9', 1.25);
          this.spawnDamageNumber(pk.x, pk.y - 22, `+${pk.value}g RELIC!`, '#fde047', 1.08, '+150 SCORE');
        } else if (pk.kind === 'boss_charm' && pk.charmId) {
          this.awardBossCharm(pk.charmId, pk.x, pk.y);
        } else if (pk.kind === 'lore_fragment' && pk.loreId) {
          const lore = LORE_BY_ID[pk.loreId];
          if (lore) {
            if (!this.collectedLoreIds.includes(lore.id)) {
              this.collectedLoreIds = [...this.collectedLoreIds, lore.id];
              saveCollectedLoreIds(this.collectedLoreIds);
            }
            this.activeRaidLorePlan = null;
            const raidFragments = LORE_BY_RAID[lore.raidId] ?? [];
            const foundCount = raidFragments.filter((l) => this.collectedLoreIds.includes(l.id)).length;
            this.lastLoreToast = {
              id: lore.id,
              title: lore.title,
              raidName: RAIDS[lore.raidId]?.name ?? lore.raidId,
              count: foundCount,
            };
            this.lastLoreToastTimer = 5.0;
            this.gold += 25;
            this.raidGoldEarned += 25;
            sound.playMapRelicPickup();
            this.triggerImpactFlash('#fde68a', 0.28, pk.x, pk.y, 1.1, 0.25);
            this.shockwaves.push({
              x: pk.x,
              y: pk.y,
              radius: 8,
              maxRadius: 84,
              color: '#f59e0b',
              life: 0.3,
              maxLife: 0.3,
            });
            this.spawnSparkles(pk.x, pk.y, 24, '#fde68a', '#f59e0b', 1.3);
            this.spawnDamageNumber(
              pk.x,
              pk.y - 24,
              `LORE FOUND (${foundCount}/4)`,
              '#fde68a',
              1.15,
              lore.title.toUpperCase()
            );
          }
        }
        this.pickups.splice(i, 1);
      }
    }
  }

  public toggleInventory(): void {
    if (this.status === 'INVENTORY') {
      this.status = this.modalReturnStatus;
      return;
    }
    if (this.status === 'CAMP' || this.status === 'PLAYING' || this.status === 'MAP') {
      if (this.status !== 'MAP') {
        this.modalReturnStatus = this.status;
      }
      sound.playInteract();
      this.status = 'INVENTORY';
    }
  }

  /** Open the forge / blood altar directly (mobile top bar). Only works in Base Camp. */
  public openCrafting(): void {
    if (this.status === 'CAMP' && this.currentStage.isCamp) {
      sound.playInteract();
      this.status = 'CRAFTING';
    }
  }

  public toggleMap(): void {
    if (this.status === 'MAP') {
      this.status = this.modalReturnStatus;
      return;
    }
    if (this.status === 'CAMP' || this.status === 'PLAYING' || this.status === 'INVENTORY') {
      if (this.status !== 'INVENTORY') {
        this.modalReturnStatus = this.status;
      }
      sound.playInteract();
      this.status = 'MAP';
    }
  }

  public closeModal(): void {
    if (this.status === 'CRAFTING' || this.status === 'RAID_SELECT') {
      this.status = 'CAMP';
    } else if (this.status === 'INVENTORY' || this.status === 'MAP') {
      this.status = this.modalReturnStatus;
    }
  }

  public loadStage(
    index: number,
    tuning: TuningConfig,
    preservePlayer: boolean,
    applyRoomRegen = true,
    enterCursed = false
  ): void {
    const rooms = this.getCurrentRaidRooms();
    const clamped = Math.max(0, Math.min(rooms.length - 1, index));
    this.stageIndex = clamped;
    const baseStage = rooms[clamped];
    this.isCursedChamber = enterCursed && !baseStage.isCamp;
    this.currentStage = this.isCursedChamber
      ? {
          ...baseStage,
          name: `Shattered Mirror Cathedral · ${baseStage.name}`,
          environment: 'mirror_cathedral',
          theme: {
            skyTop: '#0b081b',
            skyBottom: '#231542',
            moonColor: '#e0f2fe',
            parallaxColor: '#1b1335',
            archColor: '#2e2254',
            windowColor: '#67e8f9',
            stoneFill: '#141126',
            stoneTop: '#a5b4fc',
            bossFloorTop: '#f472b6',
          },
        }
      : baseStage;
    this.bossDefeatedHandled = false;

    const scaling = getRaidOrderScaling(this.getRaidOrderTier());
    this.platforms = this.currentStage.platforms;
    this.enemies = this.currentStage.createEnemies(scaling.hpMult, scaling.flatHpBonus);
    this.tuning = tuning;
    for (const e of this.enemies) this.applyEnemyHpTuning(e);
    if (this.isCursedChamber) {
      for (const e of this.enemies) {
        const bonus = Math.max(1, Math.round(e.maxHp * 0.25));
        e.maxHp += bonus;
        e.hp = e.maxHp;
      }
      // Shattered Mirror Cathedral: Manifest Phantom Mirror Copies of up to 4 non-boss foes!
      const mirrorCandidates = this.enemies.filter(
        (e) => !e.isBoss && !e.summoned && e.x > 300 && e.x < this.currentStage.bossZoneStartX - 110
      );
      const maxPhantoms = Math.min(4, mirrorCandidates.length);
      const stride = maxPhantoms > 0 ? Math.max(1, Math.floor(mirrorCandidates.length / maxPhantoms)) : 1;
      const phantoms: Enemy[] = [];
      for (let i = 0; i < mirrorCandidates.length && phantoms.length < maxPhantoms; i += stride) {
        const orig = mirrorCandidates[i];
        const mirrorOffset = (phantoms.length % 2 === 0 ? 1 : -1) * 94;
        const mirrorX = Math.max(
          240,
          Math.min(this.currentStage.bossZoneStartX - 90, orig.x + mirrorOffset)
        );
        const phantomHp = Math.max(2, Math.round(orig.maxHp * 0.45));
        phantoms.push({
          ...orig,
          id: this.nextEnemyId++,
          name: `Mirror ${orig.name}`,
          x: mirrorX,
          homeX: mirrorX,
          facing: (orig.facing === 1 ? -1 : 1) as 1 | -1,
          hp: phantomHp,
          maxHp: phantomHp,
          summoned: true,
          isMirrorPhantom: true,
          animTime: orig.animTime + 1.3,
        });
      }
      if (phantoms.length > 0) {
        this.enemies.push(...phantoms);
      }
    }
    this.interactables = this.currentStage.interactables.map((it) => ({ ...it, used: false }));
    this.totalEnemies = this.enemies.length;

    this.projectiles = [];
    this.gasClouds = [];
    this.groundHazards = [];
    this.affinityZones = [];
    this.attackPulsesLeft = 0;
    this.hangingBraziers = [];
    this.secretWalls = [];
    this.glassWalls = [];
    this.phantomAllies = [];
    this.pickups = [];
    this.crumbleStates.clear();
    this.minstrelAimAnchor = null;
    this.shockwaves = [];
    this.afterimages = [];
    this.particles = [];
    this.fx.reset();
    this.bloodStains = [];
    this.slashLines = [];
    this.elementalArcs = [];
    this.bossDeathSequences = [];
    this.damageNumbers = [];
    this.hitstopTimer = 0;
    this.cameraZoomPunch = 0;
    this.impactFrameTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.eclipseFreezeTimer = 0;

    // Auto-populate High-Road Hanging Fire Braziers + Breakable Secret Walls in standard raid rooms!
    if (
      !this.currentStage.isCamp &&
      !this.currentStage.isBigBossRoom &&
      !this.currentStage.isBossGauntletRoom
    ) {
      const floorFoes = this.enemies.filter(
        (e) =>
          !e.isBoss &&
          !isFlyingEnemyType(e.type) &&
          e.x > 360 &&
          e.x < this.currentStage.bossZoneStartX - 240 &&
          Math.abs(e.y - this.currentStage.floorY) < 90
      );
      const placedXs: number[] = [];
      for (const foe of floorFoes) {
        if (placedXs.length >= 3) break;
        if (placedXs.some((px) => Math.abs(px - foe.x) < 420)) continue;
        placedXs.push(foe.x);
        const by = Math.max(290, foe.y - 215);
        this.hangingBraziers.push({
          id: `brazier-${this.nextBrazierId++}`,
          x: foe.x,
          y: by,
          anchorY: Math.max(95, by - 175),
          vy: 0,
          state: 'hanging',
          swayPhase: placedXs.length * 1.9,
          smashTimer: 0,
        });
      }

      // Breakable Secret Wall #1: Far-left hidden wall niche near entry (classic Castlevania secret!)
      this.secretWalls.push({
        id: `secret-left-${clamped}`,
        x: 26,
        y: this.currentStage.floorY - 86,
        w: 36,
        h: 86,
        hp: 2,
        maxHp: 2,
        broken: false,
        flashTimer: 0,
        rewardRelic: false,
      });

      // Breakable Secret Wall #2: Elevated High-Road platform secret masonry cache (grants bonus Relic Blessing!)
      const highPlat = this.platforms.find(
        (pl) =>
          !pl.id.startsWith('wall-') &&
          pl.y < this.currentStage.floorY - 190 &&
          pl.w >= 130 &&
          pl.x > 460 &&
          pl.x + pl.w < this.currentStage.bossZoneStartX - 180
      );
      if (highPlat) {
        this.secretWalls.push({
          id: `secret-high-${clamped}`,
          x: highPlat.x + highPlat.w - 42,
          y: highPlat.y - 76,
          w: 36,
          h: 76,
          hp: 2,
          maxHp: 2,
          broken: false,
          flashTimer: 0,
          rewardRelic: true,
        });
      }
    }

    // Scatter 5-7 shimmering Map Relics across rafters, ledges & nooks of this room!
    this.spawnMapRelicsForStage();

    // Inside a Cursed Chamber: manifest an interactive Cursed Shrine for high-risk / huge-reward Pacts!
    if (this.isCursedChamber) {
      const shrineX = Math.max(
        340,
        Math.min(this.currentStage.bossZoneStartX - 240, Math.round(this.currentStage.bossZoneStartX * 0.46))
      );
      this.interactables.push({
        id: `cursed-shrine-${clamped}`,
        kind: 'cursed_shrine',
        x: shrineX,
        y: this.currentStage.floorY,
        label: 'Commune with Shattered Mirror Shrine (Forbidden Pact)',
        used: false,
      });
    }

    if (!preservePlayer) {
      this.player = this.createFreshPlayer(this.currentStage.floorY, this.selectedCharacter);
      this.player.x = 120;
      this.assassinations = 0;
      this.crits = 0;
      this.parries = 0;
      this.secretsFound = 0;
      this.pendingLevelUpLevels = [];
      this.levelUpDelayTimer = 0;
    } else {
      const p = this.player;
      p.x = 120;
      p.y = this.currentStage.floorY;
      p.vx = 0;
      p.vy = 0;
      p.facing = 1;
      p.onGround = true;
      p.crouching = false;
      p.parryWindowTimer = 0;
      p.parryCooldownTimer = 0;
      p.weaponChargeTimer = 0;
      p.grimoireOrbs = 3;
      p.grimoireOrbRechargeTimer = 0;
      p.shieldGuardActive = false;
      p.vanguardBashTimer = 0;
      p.vanguardBashHitIds.clear();
      p.bounceActive = false;
      p.bouncesLeft = 0;
      p.bounceTimer = 0;
      p.bounceHitIds.clear();
      p.bounceWallCooldown = 0;
      p.bounceDistLeft = 0;
      p.bounceCountDone = 0;
      p.tagPartnerCooldown = 0;
      p.attackState = 'idle';
      p.backdashTimer = 0;
      p.weaponSkillCooldown = 0;
      p.isHidden = false;
      p.dashAttackTimer = 0;
      p.katanaChargeTimer = 0;
      p.katanaMegaSlashTimer = 0;
      p.hammerLeapState = 'none';
      p.hammerLeapTimer = 0;
      p.rapierLungeTimer = 0;
      p.axeSpinTimer = 0;
      p.naginataVaultTimer = 0;
      p.minstrelZipActive = false;
      p.minstrelZipTimer = 0;
      p.minstrelVaultTimer = 0;
      p.minstrelDanceTimer = 0;
      p.ambushTimer = 0;
      p.shadowChainTimer = 0;
      p.shadowChainCount = 0;
      p.wallClingDir = 0;
      p.ledgeGrabActive = false;
      p.grapple.active = false;
      // Iron Vanguard passive: starts every chamber with +2 free Tower-Shield Armor!
      if (!this.currentStage.isCamp && p.characterId === 'vanguard') {
        p.armorShield = Math.max(p.armorShield, 2);
        p.armorTimer = Math.max(p.armorTimer, 24);
      }
      // Molten Anvil Heart & Glacial Warden Shard Boss Charms (+Armor on room entry!)
      if (!this.currentStage.isCamp && (this.hasBossCharm('molten_anvil_heart') || this.hasBossCharm('glacial_aegis_shard'))) {
        const bonusArmor =
          (this.hasBossCharm('molten_anvil_heart') ? (this.hasCharmSynergy('skyforged_tempest') ? 2 : 1) : 0) +
          (this.hasBossCharm('glacial_aegis_shard') ? (this.hasCharmSynergy('frozen_abyss') ? 2 : 1) : 0);
        p.armorShield = Math.max(p.armorShield, Math.min(4, bonusArmor));
        p.armorTimer = Math.max(p.armorTimer, 18);
      }
      p.hitStunTimer = 0;
      p.invulnTimer = 0.7;
      p.dropThroughTimer = 0;
      p.landTimer = 0;

      if (applyRoomRegen) {
        // Per-Room Regen: restores +hpRegenLevel HP and +mpRegenLevel MP on entering each new room!
        const hpHealed = p.hpRegenLevel > 0 ? Math.min(p.hpRegenLevel, p.maxHp - p.hp) : 0;
        const mpHealed = p.mpRegenLevel > 0 ? Math.min(p.mpRegenLevel, p.maxMp - p.mp) : 0;
        p.hp += hpHealed;
        p.mp += mpHealed;

        if (hpHealed > 0) {
          this.spawnDamageNumber(p.x - 16, p.y - p.baseH - 18, `+${hpHealed} HP`, '#f87171', 0.95, 'ROOM REGEN');
        }
        if (mpHealed > 0) {
          this.spawnDamageNumber(p.x + 18, p.y - p.baseH - 4, `+${mpHealed} MP`, '#60a5fa', 0.95);
        }
      }

      // Earth / Crystal Elemental Bastion grants free Armor Shield entering every chamber!
      if (this.hasElement('earth')) {
        const shieldGrant = p.combinedElement === 'crystal' ? 2 : 1;
        p.armorShield = Math.max(p.armorShield, shieldGrant);
        p.armorTimer = Math.max(p.armorTimer, 18);
        this.spawnDamageNumber(
          p.x,
          p.y - p.baseH - 32,
          `+${shieldGrant} SHIELD`,
          p.combinedElement === 'crystal' ? '#f0abfc' : '#d97706',
          0.95,
          p.combinedElement === 'crystal' ? 'CRYSTAL AEGIS' : 'EARTH BASTION'
        );
      }
    }

    this.pendingUpgrades = [];
    this.status = 'PLAYING';
    this.camera = this.createCamera(this.player, tuning);
  }

  public reset(tuning: TuningConfig): void {
    this.enterCamp(tuning, true, false);
  }

  // Loadout equipment changes are ONLY permitted while in Base Camp!
  public selectWeapon(weaponId: WeaponId): void {
    if (!this.currentStage.isCamp) return;
    const p = this.player;
    if (!canCharacterUseWeapon(p.characterId, weaponId)) return;
    if (!p.unlockedWeapons.includes(weaponId) || p.weapon === weaponId) return;
    p.weapon = weaponId;
    p.attackState = 'idle';
    sound.playInteract();
    this.spawnDamageNumber(p.x, p.y - p.baseH - 12, WEAPONS[p.weapon].shortName.toUpperCase(), WEAPONS[p.weapon].accent, 0.9);
  }

  public selectAbilityForSlot(slotIndex: 0 | 1 | 2, abilityId: AbilityId): void {
    if (!this.currentStage.isCamp) return;
    const p = this.player;
    if (slotIndex >= p.unlockedAbilitySlots) return;
    if (!p.unlockedAbilities.includes(abilityId)) return;
    if (p.abilitySlots[slotIndex] === abilityId) return;
    p.abilitySlots[slotIndex] = abilityId;
    sound.playInteract();
  }

  public selectItemForSlot(slotIndex: 0 | 1 | 2, itemId: ItemId): void {
    if (!this.currentStage.isCamp) return;
    if (this.player.itemSlots[slotIndex] === itemId) return;
    this.player.itemSlots[slotIndex] = itemId;
    sound.playInteract();
  }

  public selectSpecialItem(specialId: SpecialItemId): void {
    if (!this.currentStage.isCamp) return;
    if (this.player.specialItemSlot === specialId) return;
    this.player.specialItemSlot = specialId;
    sound.playInteract();
  }

  private openUpgradeDraft(title: string, poolMode: 'boss' | 'altar' = 'altar'): void {
    this.pendingUpgrades = this.generateUpgradeChoices(poolMode);
    this.upgradePromptTitle = title;
    this.status = 'CHOOSING_UPGRADE';
  }

  private generateUpgradeChoices(poolMode: 'boss' | 'altar' = 'altar'): UpgradeOption[] {
    const p = this.player;

    // Weapon & Spell unlocks (Boss-only!)
    const weaponSpellUnlockPool: UpgradeOption[] = [];

    for (const wId of WEAPON_ORDER) {
      if (!p.unlockedWeapons.includes(wId) && canCharacterUseWeapon(p.characterId, wId)) {
        const w = WEAPONS[wId];
        weaponSpellUnlockPool.push({
          id: `weapon_${wId}`,
          kind: 'unlock_weapon',
          category: w.ownerChar ? `${this.cdef(w.ownerChar).name} Weapon` : 'New Weapon',
          title: w.name,
          description: `${w.description} Added to your Inventory (equip in Base Camp [I]).`,
          accent: w.accent,
          weaponId: wId,
        });
      }
    }

    for (const aId of ABILITY_ORDER) {
      if (!p.unlockedAbilities.includes(aId)) {
        const ab = ABILITIES[aId];
        weaponSpellUnlockPool.push({
          id: `ability_${aId}`,
          kind: 'unlock_ability',
          category: 'New Spell',
          title: ab.name,
          description: `${ab.description} (${ab.manaCost} MP · Stored in Inventory for Base Camp [I]).`,
          accent: ab.accent,
          abilityId: aId,
        });
      }
    }

    // Special / Tag utility relics
    const specialPool: UpgradeOption[] = [];
    const hgDef = SPECIAL_ITEMS.eclipse_hourglass;
    if (p.specialItemCounts.eclipse_hourglass < hgDef.maxCharges) {
      specialPool.push({
        id: 'special_eclipse_hourglass',
        kind: 'special_item_charge',
        category: 'Special Relic [6]',
        title: '+1 Eclipse Hourglass Charge',
        description: `Refills 1 rare charge (${p.specialItemCounts.eclipse_hourglass + 1}/${hgDef.maxCharges}): Freezes time 4.2s, deals 8 Screen DMG + Burn & +2 MP.`,
        accent: hgDef.accent,
        specialItemId: 'eclipse_hourglass',
      });
    }

    const hornDef = SPECIAL_ITEMS.hero_tag_horn;
    if (p.specialItemCounts.hero_tag_horn < hornDef.maxCharges) {
      specialPool.push({
        id: 'special_hero_tag_horn',
        kind: 'special_item_charge',
        category: 'Special Relic [6]',
        title: '+1 Phantom Tag Horn Charge',
        description: `Refills 1 rare charge (${p.specialItemCounts.hero_tag_horn + 1}/${hornDef.maxCharges}): Summons twin companion hero echoes for a team-up strike & +1 HP/+2 MP!`,
        accent: hornDef.accent,
        specialItemId: 'hero_tag_horn',
      });
    }

    const allyPool = (['hunter', 'brute', 'ronin', 'minstrel'] as CharacterId[]).filter(
      (cid) => cid !== p.characterId && cid !== p.tagPartner
    );
    if (allyPool.length > 0) {
      const pickedPartner = allyPool[Math.floor(Math.random() * allyPool.length)];
      const partnerDef = this.cdef(pickedPartner);
      const partnerMove =
        pickedPartner === 'brute'
          ? 'Meteor Hammer Slam (massive AoE crater + stun)'
          : pickedPartner === 'ronin'
            ? 'Iaido Crimson Slash (wide cutting wave + burn)'
            : pickedPartner === 'hunter'
              ? 'Morning Star Shock-Whip (wide lash + guard break)'
              : 'Healing Encore Waltz (AoE damage + reflects projectiles + +1 HP/+1 MP)';
      specialPool.push({
        id: `tag_partner_${pickedPartner}`,
        kind: 'tag_partner',
        category: 'Hero Tag Relic',
        title: `Tag Partner: ${partnerDef.name}`,
        description: `Using [3] Weapon Skill auto-summons ${partnerDef.name}'s phantom echo every 7.5s for ${partnerMove}.`,
        accent: partnerDef.accent,
        partnerCharId: pickedPartner,
      });
    }

    // Weapon & Spell Mastery Relics (Boss-only!)
    const slotIdx = 0 as const;
    const nextLv = p.abilitySlotLevels[0] + 1;
    const equippedId = p.abilitySlots[0];
    const equippedName = ABILITIES[equippedId].shortName;
    const milestone = getSpellMilestoneInfo(equippedId, nextLv);
    const spellMasteryOpt: UpgradeOption = {
      id: `slot_lv_0_${nextLv}`,
      kind: 'upgrade_ability_slot',
      category: `Boss Spell Relic · Lv ${nextLv} · ${milestone.tag}`,
      title: `Spell Slot (${equippedName}) → Lv ${nextLv}`,
      description: milestone.summary,
      accent: nextLv === 3 ? '#f97316' : nextLv >= 4 ? '#ffd166' : '#f59e0b',
      slotIndex: slotIdx,
      abilityId: equippedId,
    };

    const nextWeaponLv = 1 + p.weaponDamageBonus + 1;
    const weaponMilestone = getWeaponMilestoneInfo(nextWeaponLv);
    const weaponMasteryOpt: UpgradeOption = {
      id: `weapon_dmg_${nextWeaponLv}`,
      kind: 'weapon_damage',
      category: `Boss Weapon Relic · ${weaponMilestone.tag}`,
      title: weaponMilestone.title,
      description: weaponMilestone.description,
      accent: nextWeaponLv === 3 ? '#93c5fd' : nextWeaponLv >= 4 ? '#f97316' : '#ef4444',
    };

    // Vitality / Arcane / Recovery / Agility Relics (Altar & Level-Up pool!)
    const vitPool: UpgradeOption[] = [
      {
        id: 'max_hp',
        kind: 'max_hp',
        category: 'Vitality Relic',
        title: 'Max HP +1',
        description: `Adds +1 Health block (Max ${p.maxHp + 1}) and restores +1 HP immediately.`,
        accent: '#dc2626',
      },
      {
        id: 'max_mp',
        kind: 'max_mp',
        category: 'Arcane Relic',
        title: 'Max MP +2',
        description: `Adds +2 Mana blocks (Max ${p.maxMp + 2}) and restores +2 MP immediately.`,
        accent: '#3b82f6',
      },
      {
        id: 'hp_regen',
        kind: 'hp_regen',
        category: 'Room Recovery',
        title: `HP Regen Lv ${p.hpRegenLevel + 1}`,
        description: `Restores +${p.hpRegenLevel + 1} HP each time you enter a new raid room.`,
        accent: '#f87171',
      },
      {
        id: 'mp_regen',
        kind: 'mp_regen',
        category: 'Room Recovery',
        title: `MP Regen Lv ${p.mpRegenLevel + 1}`,
        description: `Restores +${p.mpRegenLevel + 1} MP each time you enter a new raid room.`,
        accent: '#60a5fa',
      },
      {
        id: `altar-assassin-${p.assassinTrainingLevel + 1}`,
        kind: 'assassin_training',
        category: 'Shadow Relic',
        title: `Shadow Assassin +${p.assassinTrainingLevel + 1}`,
        description: '+6% Crit Chance, +12% Assassination Damage & longer Shadow Chain burst.',
        accent: '#f43f5e',
      },
      {
        id: `altar-swift-${p.swiftFootworkLevel + 1}`,
        kind: 'swift_footwork',
        category: 'Agility Relic',
        title: `Swift Footwork +${p.swiftFootworkLevel + 1}`,
        description: '+4% Move Speed & 5% faster Skill and Spell cooldowns.',
        accent: '#38bdf8',
      },
    ];

    if (poolMode === 'boss') {
      // BOSS RELICS: Exclusively Weapon & Spell Relics (Weapon Lv, Spell Lv, + New Weapon/Spell unlock or Special Relic)!
      const chosen: UpgradeOption[] = [weaponMasteryOpt, spellMasteryOpt];
      const thirdPool = shuffle([...weaponSpellUnlockPool, ...specialPool]);
      if (thirdPool.length > 0) {
        chosen.push(thirdPool[0]);
      } else {
        chosen.push(vitPool[0]);
      }
      return chosen;
    }

    // NON-BOSS ALTARS: Vitality, Arcane, Recovery, Shadow/Agility & Special Relics (NO weapon/spell upgrades!)
    const chosen: UpgradeOption[] = [];
    const pickFrom = (pool: UpgradeOption[]) => {
      const candidates = shuffle(pool).filter((o) => !chosen.some((c) => c.id === o.id));
      if (candidates.length > 0) chosen.push(candidates[0]);
    };
    pickFrom(vitPool.slice(0, 2)); // HP or MP
    pickFrom(vitPool.slice(2));    // Regen, Shadow, or Agility
    pickFrom(specialPool.length > 0 ? specialPool : vitPool);

    const remainder = shuffle([...vitPool, ...specialPool]).filter(
      (o) => !chosen.some((c) => c.id === o.id)
    );
    while (chosen.length < 3 && remainder.length > 0) {
      chosen.push(remainder.shift()!);
    }
    return chosen;
  }

  public selectUpgrade(optionId: string, tuning: TuningConfig): void {
    const opt = this.pendingUpgrades.find((o) => o.id === optionId);
    if (!opt) return;

    const p = this.player;
    sound.playUpgradePick();

    switch (opt.kind) {
      case 'unlock_weapon': {
        // New weapons stay in Inventory so player can equip them in Base Camp [I]!
        if (opt.weaponId && !p.unlockedWeapons.includes(opt.weaponId)) {
          p.unlockedWeapons = WEAPON_ORDER.filter(
            (w) => p.unlockedWeapons.includes(w) || w === opt.weaponId
          );
        }
        break;
      }
      case 'unlock_ability': {
        // New spells stay in Inventory so player chooses their loadout in Base Camp [I]!
        if (opt.abilityId && !p.unlockedAbilities.includes(opt.abilityId)) {
          p.unlockedAbilities.push(opt.abilityId);
        }
        break;
      }
      case 'extra_ability_slot': {
        if (p.unlockedAbilitySlots < 3) {
          const newIdx = p.unlockedAbilitySlots;
          p.unlockedAbilitySlots += 1;
          const unused = p.unlockedAbilities.find(
            (a) => !p.abilitySlots.slice(0, newIdx).includes(a)
          );
          p.abilitySlots[newIdx] = unused ?? p.unlockedAbilities[0];
        }
        break;
      }
      case 'upgrade_ability_slot': {
        const sIdx = opt.slotIndex ?? 0;
        p.abilitySlotLevels[sIdx] += 1;
        p.runRelicLevels.spell += 1;
        const spUpgrades = p.abilitySlotLevels[sIdx] - 1;
        if (spUpgrades > 0 && spUpgrades % 5 === 0) {
          const evoTier = spUpgrades / 5;
          const tierName = getEvolutionTierName(evoTier);
          sound.playWeaponEvolution(evoTier);
          this.triggerImpactFlash(opt.accent, 0.5, p.x, p.y - p.baseH * 0.5, 1.5, 0.34);
          this.shockwaves.push({
            x: p.x,
            y: p.y - p.baseH * 0.5,
            radius: 16,
            maxRadius: 180,
            color: opt.accent,
            life: 0.34,
            maxLife: 0.34,
          });
          this.spawnDamageNumber(
            p.x,
            p.y - p.baseH * tuning.playerScale - 42,
            `SPELL EVOLVED · ${tierName.toUpperCase()}!`,
            '#fde047',
            1.3
          );
        }
        break;
      }
      case 'special_item_charge': {
        if (opt.specialItemId) {
          const maxC = SPECIAL_ITEMS[opt.specialItemId].maxCharges;
          p.specialItemCounts[opt.specialItemId] = Math.min(
            maxC,
            p.specialItemCounts[opt.specialItemId] + 1
          );
        }
        break;
      }
      case 'weapon_damage': {
        p.weaponDamageBonus += 1;
        p.runRelicLevels.weapon += 1;
        // affinity-v1: the evolution moment (every 5 upgrades) is fired by the FX system on the next live frame.
        break;
      }
      case 'max_hp': {
        p.runRelicLevels.hp += 1;
        if (p.runRelicLevels.hp % 2 === 0) {
          p.maxHp += 1;
        }
        p.hp = Math.min(p.maxHp, p.hp + 1);
        break;
      }
      case 'max_mp': {
        p.runRelicLevels.mp += 1;
        if (p.runRelicLevels.mp % 2 === 0) {
          p.maxMp += 1;
        }
        p.mp = Math.min(p.maxMp, p.mp + 1);
        break;
      }
      case 'hp_regen': {
        p.hpRegenLevel += 1;
        p.runRelicLevels.regen += 1;
        break;
      }
      case 'mp_regen': {
        p.mpRegenLevel += 1;
        p.runRelicLevels.regen += 1;
        break;
      }
      case 'assassin_training': {
        p.assassinTrainingLevel += 1;
        p.runRelicLevels.agility += 1;
        break;
      }
      case 'swift_footwork': {
        p.swiftFootworkLevel += 1;
        p.runRelicLevels.agility += 1;
        break;
      }
      case 'element_affinity': {
        if (opt.elementId && !p.baseElements.includes(opt.elementId)) {
          p.baseElements = [...p.baseElements, opt.elementId];
          let isFusion = false;
          if (p.baseElements.length >= 2 && !p.combinedElement) {
            const fused = getCombinedElementId(p.baseElements[0], p.baseElements[1]);
            if (fused) {
              p.combinedElement = fused;
              isFusion = true;
            }
          }
          const activeDef = getActiveElementDef(p.baseElements, p.combinedElement);
          if (activeDef) {
            sound.playElementalAwaken(isFusion, activeDef.id);
            this.triggerShake(isFusion ? 13 : 8, isFusion ? 0.36 : 0.24);
            this.triggerImpactFlash(
              activeDef.primaryColor,
              isFusion ? 0.6 : 0.42,
              p.x,
              p.y - p.baseH * 0.5,
              isFusion ? 1.8 : 1.4,
              isFusion ? 0.42 : 0.3
            );
            this.shockwaves.push({
              x: p.x,
              y: p.y - p.baseH * 0.5,
              radius: 16,
              maxRadius: isFusion ? 230 : 165,
              color: activeDef.primaryColor,
              life: 0.38,
              maxLife: 0.38,
            });
            if (isFusion) {
              this.shockwaves.push({
                x: p.x,
                y: p.y - p.baseH * 0.5,
                radius: 10,
                maxRadius: 170,
                color: activeDef.secondaryColor,
                life: 0.3,
                maxLife: 0.3,
              });
            }
            this.spawnSparkles(
              p.x,
              p.y - p.baseH * 0.5,
              isFusion ? 40 : 26,
              activeDef.primaryColor,
              activeDef.secondaryColor,
              isFusion ? 1.75 : 1.35
            );
            this.spawnDamageNumber(
              p.x,
              p.y - p.baseH * tuning.playerScale - 46,
              isFusion ? `FUSION: ${activeDef.name.toUpperCase()}!` : `${activeDef.name.toUpperCase()} AFFINITY!`,
              activeDef.primaryColor,
              1.4,
              isFusion ? activeDef.title.toUpperCase() : 'ELEMENT AWAKENED'
            );
          }
          // Immediate Armor Shield grant if Earth or Crystal was just awakened
          if (opt.elementId === 'earth' || p.combinedElement === 'crystal') {
            const grant = p.combinedElement === 'crystal' ? 2 : 1;
            p.armorShield = Math.max(p.armorShield, grant);
            p.armorTimer = Math.max(p.armorTimer, 18);
          }
        }
        break;
      }
      case 'element_resonance': {
        p.elementResonance += 1;
        const activeDef = getActiveElementDef(p.baseElements, p.combinedElement);
        if (activeDef) {
          sound.playElementalAwaken(true, activeDef.id);
          this.shockwaves.push({
            x: p.x,
            y: p.y - p.baseH * 0.5,
            radius: 14,
            maxRadius: 195,
            color: activeDef.primaryColor,
            life: 0.34,
            maxLife: 0.34,
          });
          this.spawnSparkles(p.x, p.y - p.baseH * 0.5, 30, activeDef.primaryColor, activeDef.glowColor, 1.5);
        }
        break;
      }
      case 'tag_partner': {
        if (opt.partnerCharId) {
          p.tagPartner = opt.partnerCharId;
          p.tagPartnerCooldown = 0;
          const partnerDef = this.cdef(opt.partnerCharId);
          sound.playHeroTagIn();
          this.spawnSparkles(p.x, p.y - p.baseH * 0.5, 26, partnerDef.accent, '#ffffff', 1.35);
          this.spawnDamageNumber(
            p.x,
            p.y - p.baseH * tuning.playerScale - 36,
            `${partnerDef.name.toUpperCase()} BOUND!`,
            partnerDef.accent,
            1.2,
            'USE [3] FOR TAG ASSIST'
          );
        }
        break;
      }
      case 'cursed_glass_cannon': {
        p.weaponDamageBonus += 3;
        p.maxHp = Math.max(2, p.maxHp - 2);
        p.hp = Math.min(p.hp, p.maxHp);
        sound.playCursedShrine();
        this.triggerShake(11, 0.3);
        this.triggerImpactFlash('#f43f5e', 0.5, p.x, p.y - p.baseH * 0.5, 1.5, 0.32);
        this.spawnDamageNumber(
          p.x,
          p.y - p.baseH * tuning.playerScale - 36,
          '+3 WEAPON · -2 MAX HP',
          '#fb7185',
          1.25,
          'CURSED PACT SEALED'
        );
        break;
      }
      case 'cursed_blood_grimoire': {
        p.abilitySlotLevels[0] += 3;
        p.mp = p.maxMp;
        p.armorShield = 0;
        p.armorTimer = 0;
        p.cursedGlassVulnerable = true;
        sound.playCursedShrine();
        this.triggerShake(10, 0.28);
        this.triggerImpactFlash('#a855f7', 0.5, p.x, p.y - p.baseH * 0.5, 1.5, 0.32);
        this.spawnDamageNumber(
          p.x,
          p.y - p.baseH * tuning.playerScale - 36,
          '+3 SPELL LV · FULL MP',
          '#c084fc',
          1.25,
          'NEXT HIT 2X DMG'
        );
        break;
      }
      case 'cursed_reaper_pact': {
        this.bossCores += 1;
        this.shards += 8;
        sound.playCursedShrine();
        this.triggerShake(13, 0.35);
        this.triggerImpactFlash('#dc2626', 0.55, p.x, p.y - p.baseH * 0.5, 1.65, 0.34);
        this.spawnDamageNumber(
          p.x,
          p.y - p.baseH * tuning.playerScale - 36,
          '+1 BOSS CORE · +8 SHARDS',
          '#ffd166',
          1.25,
          'CURSED CHAMPION AWAKENED!'
        );
        const champSpec = ENEMY_SPECS.knight;
        const spawnX = Math.max(
          220,
          Math.min(this.currentStage.bossZoneStartX - 120, p.x + p.facing * 230)
        );
        this.enemies.push({
          id: this.nextEnemyId++,
          type: 'knight',
          name: 'Cursed Blood Champion',
          x: spawnX,
          y: this.currentStage.floorY,
          vx: 0,
          vy: 0,
          baseW: champSpec.baseW,
          baseH: champSpec.baseH,
          facing: p.x < spawnX ? -1 : 1,
          hp: Math.round(champSpec.hp * 1.9),
          maxHp: Math.round(champSpec.hp * 1.9),
          isBoss: false,
          homeX: spawnX,
          homeY: this.currentStage.floorY,
          patrolRadius: 220,
          visionRange: 520,
          alerted: true,
          alertTimer: 0.4,
          onGround: true,
          attackCooldown: 0.8,
          attackChargeTimer: 0,
          chargeDuration: 0.48,
          lungeTimer: 0,
          chargeVx: 0,
          chargeVy: 0,
          stateTimer: 0,
          flashTimer: 0.3,
          invulnTimer: 0,
          bossHitCounter: 0,
          hurtStunTimer: 0,
          burnTimer: 0,
          burnTickTimer: 0,
          animTime: 0,
          dead: false,
          shieldActive: true,
        });
        this.totalEnemies += 1;
        this.shockwaves.push({
          x: spawnX,
          y: this.currentStage.floorY - 36,
          radius: 14,
          maxRadius: 150,
          color: '#dc2626',
          life: 0.34,
          maxLife: 0.34,
        });
        break;
      }
    }

    this.pendingUpgrades = [];
    this.status = this.currentStage.isCamp ? 'CAMP' : 'PLAYING';
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 16, opt.accent, '#ffffff', 1.1);
    this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 16, opt.title.toUpperCase(), opt.accent, 0.95);
  }

  public isPlatformSolid(plat: Platform): boolean {
    if (!plat.crumbling) return true;
    return this.crumbleStates.get(plat.id)?.state !== 'broken';
  }

  private grantXp(amount: number, x: number, y: number, bonusTag?: string): void {
    const p = this.player;
    p.xp += amount;
    this.spawnDamageNumber(x, y, `+${amount} XP`, '#38bdf8', 0.85, bonusTag);

    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level += 1;
      // Smoother, steady XP curve: Lv1→2 = 5 XP, Lv2→3 = 8 XP, Lv3→4 = 11 XP, Lv4→5 = 14 XP...
      p.xpToNext = 5 + (p.level - 1) * 3;
      this.pendingLevelUpLevels.push(p.level);
      this.levelUpDelayTimer = 0.42;
      const isAffinityLevel = p.level % 5 === 0;
      sound.playLevelUp();
      this.triggerImpactFlash(
        isAffinityLevel ? '#c084fc' : '#38bdf8',
        isAffinityLevel ? 0.48 : 0.34,
        p.x,
        p.y - p.baseH * 0.5,
        isAffinityLevel ? 1.55 : 1.25,
        isAffinityLevel ? 0.34 : 0.26
      );
      this.spawnSparkles(
        p.x,
        p.y - p.baseH * 0.5,
        isAffinityLevel ? 34 : 24,
        isAffinityLevel ? '#c084fc' : '#38bdf8',
        '#fde047',
        isAffinityLevel ? 1.65 : 1.4
      );
      this.spawnDamageNumber(
        p.x,
        p.y - p.baseH - 28,
        `LEVEL ${p.level}!`,
        isAffinityLevel ? '#e879f9' : '#fde047',
        1.4,
        isAffinityLevel ? 'ELEMENTAL AFFINITY!' : 'CHOOSE REWARD'
      );
    }
  }

  private buildElementAffinityOptions(): UpgradeOption[] {
    const p = this.player;

    // 1st Elemental Affinity (Lv 5): Player chooses 1 from 6 randomly drawn out of the 10 Base Affinities!
    if (p.baseElements.length === 0) {
      const offered = shuffle([...BASE_ELEMENT_ORDER]).slice(0, 6);
      return offered.map((elId) => {
        const def = BASE_ELEMENTS[elId];
        return {
          id: `affinity-base-${elId}`,
          kind: 'element_affinity',
          category: `Base Affinity · ${def.title}`,
          title: `${def.name} Affinity`,
          description: def.description,
          accent: def.primaryColor,
          elementId: elId,
        };
      });
    }

    // 2nd Elemental Affinity (Lv 10): Player chooses 1 from 6 randomly drawn remaining Base Elements to FUSE!
    if (p.baseElements.length === 1) {
      const firstEl = p.baseElements[0];
      const remaining = shuffle(BASE_ELEMENT_ORDER.filter((id) => id !== firstEl)).slice(0, 6);
      return remaining.map((elId) => {
        const baseDef = BASE_ELEMENTS[elId];
        const fusedId = getCombinedElementId(firstEl, elId);
        const fusedDef = fusedId ? COMBINED_ELEMENTS[fusedId] : null;
        return {
          id: `affinity-fuse-${elId}`,
          kind: 'element_affinity',
          category: fusedDef
            ? `Fusion · ${BASE_ELEMENTS[firstEl].name} + ${baseDef.name}`
            : `Elemental Affinity · ${baseDef.title}`,
          title: fusedDef ? `${baseDef.name} → ${fusedDef.name}` : `${baseDef.name} Affinity`,
          description: fusedDef ? fusedDef.description : baseDef.description,
          accent: fusedDef ? fusedDef.primaryColor : baseDef.primaryColor,
          elementId: elId,
          combinedElementId: fusedId ?? undefined,
        };
      });
    }

    // Lv 15, 20, 25+: Amplify Combined Element Resonance + Weapon & Spell Evolution boosts!
    const activeDef = getActiveElementDef(p.baseElements, p.combinedElement);
    const nextRes = p.elementResonance + 1;
    const nextWepLv = 2 + p.weaponDamageBonus;
    const wepInfo = getWeaponMilestoneInfo(nextWepLv);
    const equippedSpell = p.abilitySlots[0];
    const nextSpellLv = p.abilitySlotLevels[0] + 1;
    const spInfo = getSpellMilestoneInfo(equippedSpell, nextSpellLv);

    return [
      {
        id: `affinity-res-${nextRes}`,
        kind: 'element_resonance',
        category: activeDef ? `${activeDef.name} Resonance +${nextRes}` : `Elemental Resonance +${nextRes}`,
        title: activeDef ? `${activeDef.name} Mastery Lv ${nextRes}` : `Elemental Resonance Lv ${nextRes}`,
        description: `Amplifies your ${activeDef?.name ?? 'Elemental'} strike damage (+1 AoE), wave reach, and glowing elemental aura!`,
        accent: activeDef?.primaryColor ?? '#c084fc',
        combinedElementId: p.combinedElement ?? undefined,
      },
      {
        id: `lvl-wep-res-${nextWepLv}`,
        kind: 'weapon_damage',
        category: `Weapon · ${wepInfo.tag}`,
        title: wepInfo.title,
        description: wepInfo.description,
        accent: '#e5a93c',
        weaponId: p.weapon,
      },
      {
        id: `lvl-spell-res-${nextSpellLv}`,
        kind: 'upgrade_ability_slot',
        category: `Spell [4] · ${spInfo.tag}`,
        title: `${ABILITIES[equippedSpell].shortName} Lv ${nextSpellLv}`,
        description: spInfo.summary,
        accent: ABILITIES[equippedSpell].accent,
        abilityId: equippedSpell,
        slotIndex: 0,
      },
    ];
  }

  private buildLevelUpOptions(): UpgradeOption[] {
    const p = this.player;

    // Level-ups focus on HP & MP Relics + Utility/Regen/Shadow/Agility.
    // Weapon & Spell Relics are reserved exclusively for defeating Bosses!
    const nextHpLv = p.runRelicLevels.hp + 1;
    const nextMpLv = p.runRelicLevels.mp + 1;

    const hpOpt: UpgradeOption = {
      id: `lvl-hp-${nextHpLv}`,
      kind: 'max_hp',
      category: `Vitality Relic · Lv ${nextHpLv}/10`,
      title: nextHpLv % 2 === 0 ? '+1 Max HP & Heal' : 'Vitality Relic (+1 HP Heal)',
      description:
        nextHpLv % 2 === 0
          ? 'Gain +1 Max HP & restore +1 HP. (Sacrifice 10 HP Relics at Camp Altar for +1 permanent HP!)'
          : 'Restore +1 HP & advance toward +1 Max HP next level. (10 levels can be sacrificed at Camp Altar.)',
      accent: '#ef4444',
    };

    const mpOpt: UpgradeOption = {
      id: `lvl-mp-${nextMpLv}`,
      kind: 'max_mp',
      category: `Arcane Relic · Lv ${nextMpLv}/10`,
      title: nextMpLv % 2 === 0 ? '+1 Max MP & Restore' : 'Arcane Relic (+1 MP Restore)',
      description:
        nextMpLv % 2 === 0
          ? 'Gain +1 Max MP & restore +1 MP. (Sacrifice 10 MP Relics at Camp Altar for +1 permanent MP!)'
          : 'Restore +1 MP & advance toward +1 Max MP next level. (10 levels can be sacrificed at Camp Altar.)',
      accent: '#60a5fa',
    };

    const thirdPool: UpgradeOption[] = [
      {
        id: `lvl-hp-regen-${p.hpRegenLevel + 1}`,
        kind: 'hp_regen',
        category: `HP Recovery · Lv ${p.hpRegenLevel + 1}`,
        title: `Room HP Regen Lv ${p.hpRegenLevel + 1}`,
        description: `Restore +${p.hpRegenLevel + 1} HP automatically whenever you enter a new raid room.`,
        accent: '#f87171',
      },
      {
        id: `lvl-mp-regen-${p.mpRegenLevel + 1}`,
        kind: 'mp_regen',
        category: `MP Recovery · Lv ${p.mpRegenLevel + 1}`,
        title: `Room MP Regen Lv ${p.mpRegenLevel + 1}`,
        description: `Restore +${p.mpRegenLevel + 1} MP automatically whenever you enter a new raid room.`,
        accent: '#38bdf8',
      },
      {
        id: `lvl-assassin-${p.assassinTrainingLevel + 1}`,
        kind: 'assassin_training',
        category: `Shadow Relic · Lv ${p.runRelicLevels.agility + 1}/10`,
        title: `Shadow Assassin +${p.assassinTrainingLevel + 1}`,
        description: '+6% Crit Chance, +12% Assassination Damage & longer Shadow Chain burst.',
        accent: '#f43f5e',
      },
      {
        id: `lvl-swift-${p.swiftFootworkLevel + 1}`,
        kind: 'swift_footwork',
        category: `Agility Relic · Lv ${p.runRelicLevels.agility + 1}/10`,
        title: `Swift Footwork +${p.swiftFootworkLevel + 1}`,
        description: '+4% Move Speed & 5% faster Skill and Spell cooldowns.',
        accent: '#22d3ee',
      },
    ];

    const pickedThird = shuffle(thirdPool)[0];
    return [hpOpt, mpOpt, pickedThird];
  }

  private updateCrumblingPlatforms(dt: number): void {
    for (const [id, st] of this.crumbleStates.entries()) {
      st.timer -= dt;
      if (st.state === 'shaking' && st.timer <= 0) {
        st.state = 'broken';
        st.timer = 3.2;
        sound.playCrumble();
        const plat = this.platforms.find((pl) => pl.id === id);
        if (plat) {
          for (let i = 0; i < 12; i++) {
            this.particles.push({
              x: plat.x + Math.random() * plat.w,
              y: plat.y + Math.random() * plat.h,
              vx: (Math.random() - 0.5) * 90,
              vy: 40 + Math.random() * 110,
              size: 4 + Math.random() * 4,
              color: i % 2 === 0 ? '#78513a' : '#4a3225',
              life: 0.52,
              maxLife: 0.52,
              kind: 'dust',
              rotation: 0,
            });
          }
        }
      } else if (st.state === 'broken' && st.timer <= 0) {
        this.crumbleStates.delete(id);
        const plat = this.platforms.find((pl) => pl.id === id);
        if (plat) {
          this.spawnSparkles(plat.x + plat.w * 0.5, plat.y + 6, 8, '#d4a373', '#fef08a', 0.8);
        }
      }
    }
  }

  public snapHangingBrazier(b: HangingBrazier): void {
    if (b.state !== 'hanging') return;
    b.state = 'falling';
    b.vy = 105;
    sound.playBrazierSnap();
    this.spawnSparkles(b.x, b.y - 18, 14, '#fb923c', '#fef08a', 1.15);
    this.spawnDamageNumber(b.x, b.y - 34, 'SNAP!', '#fde047', 0.95);
  }

  private updateHangingBraziers(dt: number, tuning: TuningConfig): void {
    const attackBox = this.getAttackHitbox(tuning);
    const megaBox = this.getKatanaMegaHitbox(tuning);

    for (const b of this.hangingBraziers) {
      if (b.state === 'smashed') {
        if (b.smashTimer > 0) b.smashTimer = Math.max(0, b.smashTimer - dt);
        continue;
      }

      if (b.state === 'hanging') {
        const bRect: Rect = { x: b.x - 22, y: b.y - 44, w: 44, h: 56 };
        if (
          (attackBox && rectsOverlap(attackBox, bRect)) ||
          (megaBox && rectsOverlap(megaBox, bRect))
        ) {
          this.snapHangingBrazier(b);
        }
        continue;
      }

      // Falling fire cauldron!
      b.vy = Math.min(820, b.vy + 1040 * dt);
      b.y += b.vy * dt;

      if (Math.random() < 0.7) {
        this.particles.push({
          x: b.x + (Math.random() - 0.5) * 20,
          y: b.y - 14,
          vx: (Math.random() - 0.5) * 55,
          vy: -45 - Math.random() * 60,
          size: 4,
          color: Math.random() < 0.5 ? '#f97316' : '#fef08a',
          life: 0.24,
          maxLife: 0.24,
          kind: 'ember',
          rotation: 0,
        });
      }

      const fallRect: Rect = { x: b.x - 22, y: b.y - 16, w: 44, h: 28 };
      let hitTarget = false;
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (rectsOverlap(fallRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
          hitTarget = true;
          break;
        }
      }
      if (!hitTarget) {
        for (const plat of this.platforms) {
          if (!plat.oneWay && this.isPlatformSolid(plat) && rectsOverlap(fallRect, plat)) {
            b.y = plat.y;
            hitTarget = true;
            break;
          }
        }
      }
      if (!hitTarget && b.y >= this.currentStage.floorY) {
        b.y = this.currentStage.floorY;
        hitTarget = true;
      }

      if (hitTarget) {
        b.state = 'smashed';
        b.vy = 0;
        b.smashTimer = 1.6;
        sound.playBrazierCrash();
        this.triggerShake(11, 0.28);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.09);
        this.shockwaves.push({
          x: b.x,
          y: b.y - 8,
          radius: 14,
          maxRadius: 128,
          color: '#f97316',
          life: 0.32,
          maxLife: 0.32,
        });
        this.spawnSparkles(b.x, b.y - 12, 28, '#f97316', '#fef08a', 1.55);

        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) * 0.5;
          if (Math.hypot(enemy.x - b.x, ey - b.y) <= 128) {
            const dmg = enemy.isBoss ? 8 : 14;
            enemy.hp = Math.max(0, enemy.hp - dmg);
            enemy.flashTimer = 0.22;
            enemy.hurtStunTimer = enemy.isBoss ? 0.08 : 0.35;
            enemy.alerted = true;
            this.applyBurn(enemy, 4.5);
            this.spawnDamageNumber(enemy.x, ey - 14, `${dmg}`, '#fb923c', 1.35, 'BRAZIER SMASH!');
            if (enemy.hp <= 0) {
              this.handleEnemyKilled(enemy, enemy.x, ey, false);
              this.shards += 2;
              this.grantXp(1, enemy.x, ey - 48, 'TRAP BONUS');
            }
          }
        }
      }
    }
  }

  public getPlayerRect(scale: number): Rect {
    const w = this.player.baseW * scale;
    const h = (this.player.crouching ? this.player.crouchBaseH : this.player.baseH) * scale;
    return {
      x: this.player.x - w / 2,
      y: this.player.y - h,
      w,
      h,
    };
  }

  // Slightly forgiving damage hurtbox so players never feel cheated by grazing pixel touches
  public getPlayerHurtbox(scale: number): Rect {
    const r = this.getPlayerRect(scale);
    const padX = Math.min(5, r.w * 0.16);
    const padTop = Math.min(5, r.h * 0.1);
    return {
      x: r.x + padX,
      y: r.y + padTop,
      w: Math.max(10, r.w - padX * 2),
      h: Math.max(14, r.h - padTop),
    };
  }

  public getEnemyRect(enemy: Enemy, scale: number): Rect {
    const w = enemy.baseW * scale;
    const h = enemy.baseH * scale;
    return {
      x: enemy.x - w / 2,
      y: enemy.y - h,
      w,
      h,
    };
  }


  private beginEvoAttackActive(tuning: TuningConfig, scale: number, h: number): void {
    const p = this.player;
    const c = combatTune(tuning);
    const tier = evoCombatTier(p, tuning);
    this.attackPulsesLeft = extraPulses(p.attackWeapon, tier);
    this.attackPulseTimer = Math.max(0.08, (p.attackTimer || 0.16) * 0.45);
    // Palm-only waves for the Monk finisher; other weapons fire on every swing at their tier.
    const allowPalm = p.attackWeapon !== 'ash_wraps' || p.monkComboStep === 2;
    if (!allowPalm) return;
    // Assassin: Mythic+ cross-slashes fling ghost daggers; Transcendent flings them on every strike (a fan on the cross-slash).
    if (p.attackWeapon === 'shadow_daggers' && tier >= 2) {
      const cross = p.assassinComboStep === 2;
      const n = cross ? (tier >= 3 ? 3 : 1) : tier >= 3 ? 1 : 0;
      const gx = p.x + p.facing * 24 * scale;
      const gy = p.y - h * 0.58;
      for (let i = 0; i < n; i++) {
        const ang = (i - (n - 1) / 2) * 0.17;
        this.spawnThrownDagger(gx, gy, gx + p.facing * Math.cos(ang) * 200, gy + Math.sin(ang) * 200, tuning, 1, true, 0);
      }
    }
    const waves = swingWaves(p.attackWeapon, tier, c);
    const ox = p.x + p.facing * 28 * scale;
    const oy = p.y - h * 0.55;
    const weaponLv = 1 + p.weaponDamageBonus;
    // Hammer already launches a seismic aftershock at weaponLv >= 4; skip the Mythic duplicate.
    for (const spec of waves) {
      if (p.attackWeapon === 'hammer' && spec.kind === 'player_quake' && weaponLv >= 4 && tier < 3) continue;
      if (p.attackWeapon === 'hammer' && spec.kind === 'player_quake' && weaponLv >= 4 && tier >= 3 && spec.speed >= 330) continue;
      const n = Math.max(1, spec.count);
      const offs = spec.yOff.length ? spec.yOff : [0];
      for (let i = 0; i < n; i++) {
        const yOff = offs[i % offs.length] * scale;
        this.projectiles.push({
          id: this.nextProjectileId++,
          x: ox,
          y: spec.kind === 'player_quake' ? p.y - 4 : oy + yOff,
          vx: p.facing * spec.speed,
          vy: 0,
          radius: spec.radius * scale,
          fromEnemy: false,
          damage: 1,
          life: spec.life,
          rotation: 0,
          kind: spec.kind,
          slotLevel: weaponLv,
        });
      }
    }
    if (tier >= 1) {
      const pal = affFlags(p, tuning).profile?.pal;
      this.shockwaves.push({
        x: ox,
        y: oy,
        radius: 6,
        maxRadius: 36 + tier * 14,
        color: pal?.mid ?? '#d6d3d1',
        life: 0.16,
        maxLife: 0.16,
      });
    }
  }

  private spawnAffinityZone(x: number, y: number, kind: BaseElementId, r: number, life: number): void {
    this.affinityZones.push({ x, y, r, life, maxLife: life, kind, tick: 0.2, hitIds: new Set() });
  }

  private applySkill3Cast(tuning: TuningConfig): void {
    const p = this.player;
    // Assassin: Mark for Death applies its affinity effects at the marked foe / the execution, not around him.
    if (p.characterId === 'assassin') return;
    const c = combatTune(tuning);
    const flags = affFlags(p, tuning);
    const scale = tuning.playerScale;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const cx = p.x;
    const cy = p.y - h * 0.5;
    const pow = c.affinityPower;
    const pal = flags.profile?.pal;
    const color = pal?.mid ?? '#d6d3d1';
    if (flags.id) {
      this.shockwaves.push({ x: cx, y: cy, radius: 8, maxRadius: 70 + pow * 20, color, life: 0.28, maxLife: 0.28 });
      this.spawnSparkles(cx, cy, 10 + Math.round(pow * 6), color, pal?.core ?? '#fafafa', 0.9);
    }
    const zr = skillZoneRadius(flags, c);
    if (zr > 0 && (flags.fire || flags.shadow || flags.light || flags.earth || flags.water)) {
      const kind: BaseElementId = flags.fire ? 'fire' : flags.shadow ? 'shadow' : flags.light ? 'light' : flags.earth ? 'earth' : 'water';
      this.spawnAffinityZone(cx, p.y - 2, kind, zr * scale, 1.4 + 0.4 * pow);
    }
    const R = (90 + 30 * pow) * scale;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
      const d = Math.hypot(enemy.x - cx, ey - cy);
      if (d > R + enemy.baseW * tuning.enemyScale * 0.4) continue;
      if (flags.water && !enemy.isBoss) {
        enemy.vx = (enemy.x >= p.x ? 1 : -1) * (160 + 80 * pow);
        enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.12);
      }
      if (flags.air && !enemy.isBoss) {
        // Gust pull: yank foes toward the skill so the follow-through connects.
        const dir = Math.sign(p.x - enemy.x) || p.facing;
        enemy.vx = dir * (140 + 70 * pow);
        enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.1);
      }
      if (flags.earth && !enemy.isBoss) {
        enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.2 * pow);
        enemy.vx = (enemy.x >= p.x ? 1 : -1) * (200 + 80 * pow);
      }
      if (flags.shadow) {
        enemy.witherTimer = Math.max(enemy.witherTimer ?? 0, 2.4 * pow);
        enemy.witherTickTimer = enemy.witherTickTimer ?? 0.4;
      }
    }
    if (flags.light) {
      // A small holy burst around the caster — bonus damage is applied on the skill's actual hits vs bosses.
      this.shockwaves.push({ x: cx, y: cy, radius: 10, maxRadius: 86 * scale * pow, color: pal?.core ?? '#cfae5c', life: 0.24, maxLife: 0.24 });
    }
  }

  private applyAffinityAfterHit(
    enemy: Enemy,
    hitX: number,
    hitY: number,
    tuning: TuningConfig,
    flags: ReturnType<typeof affFlags>,
    mods: ReturnType<typeof affinityHitMods>
  ): void {
    if (mods.wither > 0 && enemy.hp > 0) {
      enemy.witherTimer = Math.max(enemy.witherTimer ?? 0, mods.wither);
      enemy.witherTickTimer = enemy.witherTickTimer ?? 0.5;
    }
    if (mods.lifestealChance > 0 && this.player.hp < this.player.maxHp && Math.random() < mods.lifestealChance) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      this.spawnDamageNumber(this.player.x, this.player.y - this.player.baseH * tuning.playerScale - 16, '+1 HP', '#7c6ea0', 0.85, 'WITHER');
    }
    if (mods.splashR > 0 && mods.splashDmg > 0 && isSkill3Active(this.player)) {
      const eScale = tuning.enemyScale;
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        const oy = other.y - (other.baseH * eScale) * 0.5;
        if (Math.hypot(other.x - hitX, oy - hitY) <= mods.splashR) {
          other.hp = Math.max(0, other.hp - mods.splashDmg);
          other.flashTimer = 0.12;
          this.spawnDamageNumber(other.x, oy - 10, `${mods.splashDmg}`, flags.profile?.pal.mid ?? '#d6d3d1', 0.8);
          if (other.hp <= 0) this.handleEnemyKilled(other, other.x, oy);
        }
      }
    }
    if (mods.pull && !enemy.isBoss && enemy.hp > 0) {
      enemy.vx += Math.sign(this.player.x - enemy.x) * 40;
    }
    void flags;
  }

  private updateAffinityZones(dt: number, tuning: TuningConfig): void {
    const p = this.player;
    const flags = affFlags(p, tuning);
    const c = combatTune(tuning);
    // Leave a short elemental trail behind dashes / leaps / waltzes.
    if (isSkill3Active(p) && flags.id && skillZoneRadius(flags, c) > 0) {
      this.affinityTrailAcc += dt;
      if (this.affinityTrailAcc >= 0.07) {
        this.affinityTrailAcc = 0;
        const kind: BaseElementId = flags.fire
          ? 'fire'
          : flags.shadow
            ? 'shadow'
            : flags.light
              ? 'light'
              : flags.earth
                ? 'earth'
                : flags.water
                  ? 'water'
                  : 'air';
        this.spawnAffinityZone(p.x, p.y - 2, kind, skillZoneRadius(flags, c) * tuning.playerScale * 0.85, 0.7);
      }
    } else {
      this.affinityTrailAcc = 0;
    }

    const eScale = tuning.enemyScale;
    for (let i = this.affinityZones.length - 1; i >= 0; i--) {
      const z = this.affinityZones[i];
      z.life -= dt;
      z.tick -= dt;
      if (z.tick <= 0) {
        z.tick = 0.28;
        for (const enemy of this.enemies) {
          if (enemy.dead || z.hitIds.has(enemy.id)) continue;
          const ey = enemy.y - (enemy.baseH * eScale) / 2;
          if (Math.hypot(enemy.x - z.x, ey - z.y) > z.r + enemy.baseW * eScale * 0.3) continue;
          if (z.kind === 'fire') this.applyBurn(enemy, 2.0);
          if (z.kind === 'water') enemy.chillTimer = Math.max(enemy.chillTimer ?? 0, 1.6);
          if (z.kind === 'shadow') {
            enemy.witherTimer = Math.max(enemy.witherTimer ?? 0, 1.8);
            enemy.witherTickTimer = enemy.witherTickTimer ?? 0.5;
          }
          if (z.kind === 'earth') enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.12);
          if (z.kind === 'light' || z.kind === 'fire' || z.kind === 'earth') {
            z.hitIds.add(enemy.id);
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 1 + p.weaponDamageBonus, { bonusDamage: 0, noAssassinate: true, stun: 0.08, kbX: 60 });
          } else {
            z.hitIds.add(enemy.id);
          }
        }
      }
      if (z.life <= 0) this.affinityZones.splice(i, 1);
    }
  }

  public getKatanaMegaHitbox(tuning: TuningConfig): Rect | null {
    const p = this.player;
    if (p.katanaMegaSlashTimer <= 0) return null;
    const scale = tuning.playerScale;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const reach = tuning.attackRange * scale * attackReachMul(p.weapon, evoCombatTier(p, tuning), affFlags(p, tuning), combatTune(tuning));
    const weaponLv = 1 + p.weaponDamageBonus;
    const megaR = reach * (weaponLv >= 4 ? 2.15 : 1.9) * (1 + 0.08 * evoCombatTier(p, tuning) * combatTune(tuning).evoReach);
    const cx = p.x + p.facing * 20 * scale;
    const cy = p.y - h * 0.56;
    return {
      x: p.facing === 1 ? cx - megaR * 0.25 : cx - megaR,
      y: cy - megaR * 0.92,
      w: megaR * 1.25,
      h: megaR * 1.84,
    };
  }

  public getAttackHitbox(tuning: TuningConfig): Rect | null {
    const p = this.player;
    if (p.attackState !== 'active') return null;

    const scale = tuning.playerScale;
    const h = (p.attackWasCrouching ? p.crouchBaseH : p.baseH) * scale;
    const c = combatTune(tuning);
    const evoT = evoCombatTier(p, tuning);
    const flags = affFlags(p, tuning);
    const reach = tuning.attackRange * scale * attackReachMul(p.attackWeapon, evoT, flags, c);
    const heightMul = attackHeightMul(p.attackWeapon, evoT, flags, c);
    const weaponLv = 1 + p.weaponDamageBonus;

    if (
      p.attackWeapon === 'spire_staff' ||
      p.attackWeapon === 'arcane_wand' ||
      p.attackWeapon === 'orbiting_grimoire' ||
      p.attackWeapon === 'burst_crossbow' ||
      p.attackWeapon === 'twin_chakram'
    ) {
      // Ranged & thrown weapons fire projectiles instead of melee hitboxes.
      return null;
    }

    // Tower Shield & Mace: sturdy heavy close-mid blunt strike + auto frontal shield guard!
    if (p.attackWeapon === 'shield_mace') {
      const maceW = reach * 1.02;
      const maceH = h * 1.24 * heightMul;
      const originX = p.x + p.facing * (p.baseW * scale * 0.16);
      return {
        x: p.facing === 1 ? originX : originX - maceW,
        y: p.y - h * 1.08,
        w: maceW,
        h: maceH,
      };
    }

    // Monk Chain-Sickle (Kusarigama): close slash + weighted mid-range chain yank!
    if (p.attackWeapon === 'kusarigama') {
      const chainW = reach * (weaponLv >= 4 ? 1.85 : 1.65);
      const chainH = Math.max(36, h * 0.92 * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.14);
      return {
        x: p.facing === 1 ? originX : originX - chainW,
        y: p.y - h * 0.62 - chainH / 2,
        w: chainW,
        h: chainH,
      };
    }

    // Blade-Dancer Solar Crescent Glaive: sweeping twin-ended golden poleblade arc!
    if (p.attackWeapon === 'solar_glaive') {
      const glaiveW = reach * (weaponLv >= 4 ? 1.56 : 1.38);
      const glaiveH = h * 1.48 * heightMul;
      const startX = p.facing === 1 ? p.x - 16 * scale : p.x + 16 * scale - glaiveW;
      return {
        x: startX,
        y: p.y - h * 1.18,
        w: glaiveW,
        h: glaiveH,
      };
    }

    // Prism Striker Pinball Gauntlets: agile short-burst crystal fists!
    if (p.attackWeapon === 'prism_gauntlets') {
      const fistW = reach * (weaponLv >= 4 ? 1.12 : 0.96);
      const fistH = h * 0.92 * heightMul;
      const originX = p.x + p.facing * (p.baseW * scale * 0.12);
      return {
        x: p.facing === 1 ? originX : originX - fistW,
        y: p.y - h * 0.9,
        w: fistW,
        h: fistH,
      };
    }

    // 1. Quick Thrust Base Weapon (Needle Estoc)
    if (p.attackWeapon === 'estoc_spear') {
      const thrustReach = reach * (weaponLv >= 4 ? 1.3 : 1.16);
      const hitH = Math.max(16, 20 * scale * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.22);
      const centerY = p.y - h * 0.56;
      return {
        x: p.facing === 1 ? originX : originX - thrustReach,
        y: centerY - hitH / 2,
        w: thrustReach,
        h: hitH,
      };
    }

    // 2. Quick Small Slash Base Weapon (Swift Dirk)
    if (p.attackWeapon === 'short_blade') {
      const slashW = reach * (weaponLv >= 4 ? 0.92 : 0.78);
      const slashH = h * 0.92 * heightMul;
      const originX = p.x + p.facing * (p.baseW * scale * 0.14);
      return {
        x: p.facing === 1 ? originX : originX - slashW,
        y: p.y - h * 0.96,
        w: slashW,
        h: slashH,
      };
    }

    // 3. Slow Wide Charging Slash Base Weapon (Cleaver Greatsword)
    if (p.attackWeapon === 'cleaver_greatsword') {
      const chargeScale = 1 + Math.min(0.42, p.weaponChargeTimer * 0.4);
      const slashW = reach * 1.62 * chargeScale;
      const slashH = h * 2.18 * heightMul * Math.min(1.25, chargeScale);
      const startX = p.facing === 1 ? p.x - 18 * scale : p.x + 18 * scale - slashW;
      return {
        x: startX,
        y: p.y - h * 1.56,
        w: slashW,
        h: slashH,
      };
    }

    // 4. Slow Long Charging Thrust Base Weapon (Imperial War-Lance)
    if (p.attackWeapon === 'joust_lance') {
      const chargeScale = 1 + Math.min(0.45, p.weaponChargeTimer * 0.42);
      const lanceReach = reach * 1.85 * chargeScale;
      const hitH = Math.max(24, 30 * scale * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.2);
      const centerY = p.y - h * 0.54;
      return {
        x: p.facing === 1 ? originX : originX - lanceReach,
        y: centerY - hitH / 2,
        w: lanceReach,
        h: hitH,
      };
    }

    // 5. Super Wide, Very Short Distance Quick Weapon (Crescent War Fans)
    if (p.attackWeapon === 'war_fans') {
      const fanHalfW = Math.max(54, reach * 0.64);
      const fanH = h * 1.9 * heightMul;
      return {
        x: p.x - fanHalfW,
        y: p.y - h * 1.44,
        w: fanHalfW * 2,
        h: fanH,
      };
    }

    // 6. Slow Impact AoE Weapon (Seismic Impact Flail)
    if (p.attackWeapon === 'meteor_flail') {
      const blastR = Math.max(118, reach * (weaponLv >= 4 ? 1.55 : 1.38));
      const impactX = p.x + p.facing * 72 * scale;
      const impactY = p.y - h * 0.28;
      return {
        x: impactX - blastR,
        y: impactY - blastR,
        w: blastR * 2,
        h: blastR * 2,
      };
    }

    if (p.attackWeapon === 'shadow_daggers') {
      // Twin daggers: short-to-medium reach; the cross-slash reaches a little further and covers more height.
      const cross = p.assassinComboStep === 2;
      const dReach = reach * (cross ? 1.35 : 1.05) * (weaponLv >= 4 ? 1.08 : 1.0);
      const hitH = Math.max(26, h * (cross ? 0.82 : 0.5) * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.15);
      return {
        x: p.facing === 1 ? originX : originX - dReach,
        y: p.y - h * 0.58 - hitH / 2,
        w: dReach,
        h: hitH,
      };
    }

    if (p.attackWeapon === 'ash_wraps') {
      // Monk fists: very short, fast; the 3rd (palm) strike reaches a little further and taller.
      const palm = p.monkComboStep === 2;
      const fistReach = reach * (palm ? 1.25 : 1.0) * (weaponLv >= 4 ? 1.12 : 1.0);
      const hitH = Math.max(24, h * (palm ? 0.78 : 0.52) * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.1);
      return {
        x: p.facing === 1 ? originX : originX - fistReach,
        y: p.y - h * 0.6 - hitH / 2,
        w: fistReach,
        h: hitH,
      };
    }

    if (p.attackWeapon === 'katana') {
      // Wide sweeping iaijutsu slash — wider & faster than broadsword!
      const slashW = reach * (weaponLv >= 4 ? 1.5 : 1.28);
      const slashH = h * (weaponLv >= 4 ? 2.0 : 1.8) * heightMul;
      const startX = p.facing === 1 ? p.x - 10 * scale : p.x + 10 * scale - slashW;
      return {
        x: startX,
        y: p.y - h * (weaponLv >= 4 ? 1.5 : 1.38),
        w: slashW,
        h: slashH,
      };
    }

    if (p.attackWeapon === 'sword') {
      // Wide sweeping arc — Tier 4+ Grand Cleave extends reach by +25%!
      const slashW = reach * (weaponLv >= 4 ? 1.35 : 1.08);
      const slashH = h * (weaponLv >= 4 ? 1.9 : 1.65) * heightMul;
      const startX = p.facing === 1 ? p.x - 8 * scale : p.x + 8 * scale - slashW;
      return {
        x: startX,
        y: p.y - h * (weaponLv >= 4 ? 1.44 : 1.32),
        w: slashW,
        h: slashH,
      };
    }

    if (p.attackWeapon === 'hammer') {
      // Big Boom AoE — Tier 4+ Seismic Boom expands blast radius!
      const boomR = reach * (weaponLv >= 4 ? 1.42 : 1.25);
      const cx = p.x + p.facing * (34 * scale);
      const cy = p.y - h * 0.32;
      return {
        x: cx - boomR,
        y: cy - boomR,
        w: boomR * 2,
        h: boomR * 2,
      };
    }

    if (p.attackWeapon === 'rapier') {
      // Fast long piercing fencing thrust!
      const thrustReach = reach * (weaponLv >= 4 ? 1.26 : 1.14);
      const hitH = Math.max(20, (weaponLv >= 4 ? 36 : 22) * scale * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.25);
      const centerY = p.y - h * 0.56;
      return {
        x: p.facing === 1 ? originX : originX - thrustReach,
        y: centerY - hitH / 2,
        w: thrustReach,
        h: hitH,
      };
    }

    if (p.attackWeapon === 'greataxe') {
      // Wide heavy overhead-to-floor Obsidian cleave!
      const axeW = reach * (weaponLv >= 4 ? 1.54 : 1.38);
      const axeH = h * (weaponLv >= 4 ? 2.05 : 1.85) * heightMul;
      const startX = p.facing === 1 ? p.x - 14 * scale : p.x + 14 * scale - axeW;
      return {
        x: startX,
        y: p.y - h * 1.48,
        w: axeW,
        h: axeH,
      };
    }

    if (p.attackWeapon === 'naginata') {
      // Long sweeping polearm arc reaching far forward & high above!
      const poleW = reach * (weaponLv >= 4 ? 1.62 : 1.44);
      const poleH = h * (weaponLv >= 4 ? 1.95 : 1.75) * heightMul;
      const startX = p.facing === 1 ? p.x - 8 * scale : p.x + 8 * scale - poleW;
      return {
        x: startX,
        y: p.y - h * 1.42,
        w: poleW,
        h: poleH,
      };
    }

    if (p.attackWeapon === 'ribbon_whip' || p.attackWeapon === 'silk_whip') {
      const isSilk = p.attackWeapon === 'silk_whip';
      const whipReach = reach * (isSilk ? 1.26 : 1.12);
      const hitH = Math.max(26, 34 * scale * heightMul);
      const originX = p.x + p.facing * (p.baseW * scale * 0.2);
      const centerY = p.y - h * 0.56;
      return {
        x: p.facing === 1 ? originX : originX - whipReach,
        y: centerY - hitH / 2,
        w: whipReach,
        h: hitH,
      };
    }

    // Classic straight Whip hitbox (Tier 4+ slightly extended tip)
    const whipReach = reach * (weaponLv >= 4 ? 1.08 : 1.0);
    const hitH = Math.max(18, 22 * scale * heightMul);
    const originX = p.x + p.facing * (p.baseW * scale * 0.25);
    const centerY = p.y - h * 0.56;
    return {
      x: p.facing === 1 ? originX : originX - whipReach,
      y: centerY - hitH / 2,
      w: whipReach,
      h: hitH,
    };
  }

  public getNearbyInteractable(): Interactable | null {
    const p = this.player;
    let closest: Interactable | null = null;
    let bestDist = 82;
    for (const item of this.interactables) {
      if (item.used) continue;
      if (item.kind === 'camp_hero_hunter' && p.characterId === 'hunter') continue;
      if (item.kind === 'camp_hero_brute' && p.characterId === 'brute') continue;
      if (item.kind === 'camp_hero_ronin' && p.characterId === 'ronin') continue;
      if (item.kind === 'camp_hero_minstrel' && p.characterId === 'minstrel') continue;
      if (item.kind === 'camp_hero_monk' && p.characterId === 'monk') continue;
      if (item.kind === 'camp_hero_wizard' && p.characterId === 'wizard') continue;
      if (item.kind === 'camp_hero_assassin' && p.characterId === 'assassin') continue;
      if (item.kind === 'camp_hero_ranger' && p.characterId === 'ranger') continue;
      if (item.kind === 'camp_hero_vanguard' && p.characterId === 'vanguard') continue;
      if (item.kind === 'camp_hero_dancer' && p.characterId === 'dancer') continue;
      if (item.kind === 'camp_hero_bouncer' && p.characterId === 'bouncer') continue;
      const d = Math.hypot(p.x - item.x, p.y - item.y);
      if (d < bestDist) {
        bestDist = d;
        closest = item;
      }
    }
    return closest;
  }

  /** affinity-v1: the moment a weapon evolves (every 5 weapon upgrades). */
  private onWeaponTierUp(tier: number, moment: boolean): void {
    const p = this.player;
    const tuning = this.tuning ?? DEFAULT_TUNING;
    const tierName = getEvolutionTierName(tier);
    const el = visualElement(p, tuning.fx);
    const look = tierLook(tier);
    const glow = el ? el.pal.mid : look.glow;
    const core = el ? el.pal.core : look.glowCore;
    sound.playWeaponTierUp(tier);
    this.spawnDamageNumber(
      p.x,
      p.y - p.baseH * tuning.playerScale - 44,
      `${WEAPONS[p.weapon]?.shortName ?? 'WEAPON'} EVOLVED`.toUpperCase(),
      core,
      1.3,
      tierName.toUpperCase()
    );
    if (moment) {
      this.triggerShake(8 + tier * 2, 0.3);
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.12);
      this.screenFlashColor = glow;
      this.screenFlashAlpha = Math.max(this.screenFlashAlpha, 0.22);
      this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.05);
    }
  }

  public triggerShake(magnitude: number, duration = 0.22): void {
    magnitude *= this.tuning.shakeMult ?? 1;
    if (magnitude <= 0) return;
    this.camera.shakeMagnitude = Math.max(this.camera.shakeMagnitude, magnitude);
    this.camera.shakeDuration = duration;
    this.camera.shakeTime = duration;
  }

  public spawnSparkles(
    x: number,
    y: number,
    count: number,
    primaryColor: string,
    secondaryColor: string,
    speedMult = 1
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.55;
      const speed = (70 + Math.random() * 190) * speedMult;
      const isSparkle = i % 3 !== 0;
      const maxLife = 0.24 + Math.random() * 0.26;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: isSparkle ? 4.5 + Math.random() * 4.5 : 2 + Math.random() * 2.5,
        color: i % 2 === 0 ? primaryColor : secondaryColor,
        life: maxLife,
        maxLife,
        kind: isSparkle ? 'sparkle' : 'ember',
        rotation: Math.random() * Math.PI,
      });
    }
  }

  public spawnDamageNumber(
    x: number,
    y: number,
    text: string,
    color: string,
    scale = 1,
    subtext?: string
  ): void {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 10,
      y,
      vy: -62 * scale,
      text,
      subtext,
      color,
      scale,
      life: 0.85,
      maxLife: 0.85,
    });
  }

  private updateTransition(dt: number): boolean {
    if (this.transitionPhase === 'none') return false;

    if (this.transitionPhase === 'fade_out') {
      this.transitionAlpha = Math.min(1, this.transitionAlpha + dt * 2.8);
      if (this.transitionAlpha >= 1) {
        if (this.transitionMidCallback) {
          const cb = this.transitionMidCallback;
          this.transitionMidCallback = null;
          cb();
        }
        this.transitionPhase = 'hold';
        this.transitionHoldTimer = 0.24;
      }
      return true;
    }

    if (this.transitionPhase === 'hold') {
      this.transitionHoldTimer -= dt;
      if (this.transitionHoldTimer <= 0) {
        this.transitionPhase = 'fade_in';
      }
      return true;
    }

    // fade_in — allow movement once mostly clear
    this.transitionAlpha = Math.max(0, this.transitionAlpha - dt * 2.5);
    if (this.transitionAlpha <= 0) {
      this.transitionPhase = 'none';
      this.transitionLabel = '';
      this.transitionSublabel = '';
    }
    return this.transitionAlpha > 0.45;
  }

  public update(
    dt: number,
    input: InputState,
    rawTuning: TuningConfig,
    viewportW: number,
    viewportH: number
  ): void {
    const tuning = this.buildEffectiveTuning(rawTuning);
    let safeDt = Math.min(dt, 0.05) * Math.max(0.05, tuning.gameSpeed ?? 1);

    // FREEZE-UNTIL-KEY: hold the exact assassination frame (screenshots / tuning). Camera stays put.
    if (this.killFreezeHold) {
      if (this.status !== 'PLAYING') {
        this.killFreezeHold = false;
      } else {
        return;
      }
    }

    this.time += safeDt;

    this.updateCameraShake(safeDt);

    const blockingTransition = this.updateTransition(safeDt);
    if (blockingTransition) {
      this.updateParticlesAndNumbers(safeDt);
      this.updateCamera(safeDt, tuning, viewportW, viewportH);
      return;
    }

    if (this.status !== 'PLAYING' && this.status !== 'CAMP') {
      this.updateParticlesAndNumbers(safeDt);
      this.updateCamera(safeDt, tuning, viewportW, viewportH);
      return;
    }

    // Presses made during hit-freeze are latched and replayed on the first live frame (otherwise a
    // tap of [3]/[4] landing inside a freeze was silently dropped — very noticeable with rapid wizard bolts).
    const latch = this.latchedPresses;
    if (this.hitstopTimer > 0) {
      latch.attack ||= input.attackJustPressed;
      latch.skill ||= input.backdashJustPressed;
      latch.spell ||= input.spellJustPressed;
      latch.item ||= input.itemJustPressed;
      latch.special ||= input.specialItemJustPressed;
      latch.jump ||= input.jumpJustPressed;
      latch.interact ||= input.interactJustPressed;
      this.hitstopTimer = Math.max(0, this.hitstopTimer - safeDt);
      if (this.impactFrameTimer > 0) {
        this.impactFrameTimer = Math.max(0, this.impactFrameTimer - safeDt);
      }
      if (this.screenFlashAlpha > 0) {
        this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - safeDt * 0.35);
      }
      if (this.impactBurstTimer > 0) {
        this.impactBurstTimer = Math.max(0, this.impactBurstTimer - safeDt * 0.2);
      }
      return;
    }

    if (latch.attack || latch.skill || latch.spell || latch.item || latch.special || latch.jump || latch.interact) {
      input = {
        ...input,
        attackJustPressed: input.attackJustPressed || latch.attack,
        backdashJustPressed: input.backdashJustPressed || latch.skill,
        spellJustPressed: input.spellJustPressed || latch.spell,
        itemJustPressed: input.itemJustPressed || latch.item,
        specialItemJustPressed: input.specialItemJustPressed || latch.special,
        jumpJustPressed: input.jumpJustPressed || latch.jump,
        interactJustPressed: input.interactJustPressed || latch.interact,
      };
      latch.attack = latch.skill = latch.spell = latch.item = latch.special = latch.jump = latch.interact = false;
    }

    // Hit-stop is over: engage the "freeze until key" hold on a clean frame (flash cleared, particles kept).
    if (this.killFreezeHoldPending) {
      this.killFreezeHoldPending = false;
      if (this.status === 'PLAYING') {
        this.killFreezeHold = true;
        this.screenFlashAlpha = 0;
        this.impactFrameTimer = 0;
        this.impactBurstTimer = 0;
        return;
      }
    }

    // Assassination slow-motion: real time ticks the timer, the world runs at killSlowScale.
    if (this.killSlowTimer > 0) {
      this.killSlowTimer = Math.max(0, this.killSlowTimer - safeDt);
      safeDt *= this.killSlowScale;
    }

    this.updateParticlesAndNumbers(safeDt);

    if (this.cameraZoomPunch > 0) {
      this.cameraZoomPunch *= Math.pow(0.002, safeDt);
      if (this.cameraZoomPunch < 0.002) this.cameraZoomPunch = 0;
    }
    if (this.impactFrameTimer > 0) {
      this.impactFrameTimer = Math.max(0, this.impactFrameTimer - safeDt);
    }
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - safeDt);
      if (this.comboTimer === 0) this.comboCount = 0;
    }
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - safeDt * 2.4);
    }
    if (this.impactBurstTimer > 0) {
      this.impactBurstTimer = Math.max(0, this.impactBurstTimer - safeDt);
    }
    if (this.eclipseFreezeTimer > 0) {
      this.eclipseFreezeTimer = Math.max(0, this.eclipseFreezeTimer - safeDt);
    }
    if (this.levelUpDelayTimer > 0) {
      this.levelUpDelayTimer = Math.max(0, this.levelUpDelayTimer - safeDt);
    }

    this.updateCrumblingPlatforms(safeDt);
    this.updatePlayer(safeDt, input, tuning);
    this.fx.update(safeDt, this.player, this.enemies, tuning, this.currentStage.floorY);
    if (this.status !== 'PLAYING' && this.status !== 'CAMP') {
      this.updateCamera(safeDt, tuning, viewportW, viewportH);
      return;
    }

    if (!this.currentStage.isCamp) {
      if (this.status === 'PLAYING') {
        this.raidElapsedSeconds += safeDt;
      }
      // Eclipse Hourglass slows foes to 14%; Minstrel Whip-Zip creates tactical 42% slow-motion!
      const minstrelSlow = this.player.minstrelZipActive ? this.charTune('minstrel').zipSlowMo : 1.0;
      const enemySlowMult = Math.min(this.eclipseFreezeTimer > 0 ? 0.14 : 1.0, minstrelSlow);
      const enemyDt = safeDt * enemySlowMult;
      this.updateEnemies(enemyDt, tuning);
      this.updateProjectiles(safeDt, tuning, enemySlowMult);
      this.updateGasClouds(safeDt, tuning);
      this.updateGroundHazards(enemyDt, tuning);
      this.updateHangingBraziers(enemyDt, tuning);
      this.updateSecretWalls(safeDt);
      this.updatePhantomAllies(safeDt, tuning);
      this.updatePickups(safeDt, tuning);
      this.updateBossDeathSequences(safeDt);
      this.updateAffinityZones(safeDt, tuning);
      this.checkCombatCollisions(tuning);

      // Check ALL Room Bosses defeated -> Energy violently sprouts out of the slain boss & crystallizes into a Floating Relic!
      const bosses = this.enemies.filter((e) => e.isBoss);
      if (bosses.length > 0 && bosses.every((b) => b.dead) && !this.bossDefeatedHandled) {
        this.bossDefeatedHandled = true;
        for (const e of this.enemies) {
          if (!e.dead && e.summoned) {
            e.dead = true;
            this.spawnSparkles(e.x, e.y - 24, 10, '#2dd4bf', '#ffffff', 0.9);
          }
        }

        const isBigBoss = Boolean(this.currentStage.isBigBossRoom);
        const isGauntletDuo = Boolean(this.currentStage.isBossGauntletRoom);
        const cursedShardBonus = this.isCursedChamber ? 4 : 0;
        const cursedCoreBonus = this.isCursedChamber ? 1 : 0;
        const shardGain = (isBigBoss ? 12 : isGauntletDuo ? 7 : 4) + cursedShardBonus;
        const coreGain = (isBigBoss ? 2 : isGauntletDuo ? 2 : 1) + cursedCoreBonus;
        this.shards += shardGain;
        this.bossCores += coreGain;
        if (!this.roomsCleared.includes(this.currentStage.roomNumber)) {
          this.roomsCleared.push(this.currentStage.roomNumber);
        }

        const lastBoss = bosses[bosses.length - 1];
        this.startBossDeathSequence(lastBoss, true, shardGain, coreGain);
      }

      // Open Level-Up Reward (or Every-5-Levels Elemental Affinity!) once hit-freeze settles
      if (
        this.pendingLevelUpLevels.length > 0 &&
        this.status === 'PLAYING' &&
        this.hitstopTimer <= 0 &&
        this.levelUpDelayTimer <= 0 &&
        this.pendingUpgrades.length === 0
      ) {
        const reachedLv = this.pendingLevelUpLevels.shift() ?? this.player.level;
        if (reachedLv % 5 === 0) {
          this.pendingUpgrades = this.buildElementAffinityOptions();
          this.upgradePromptTitle =
            this.player.baseElements.length === 0
              ? `Level ${reachedLv} · Choose 1 of 6 Elemental Affinities`
              : this.player.baseElements.length === 1
                ? `Level ${reachedLv} · Fuse 1 of 6 Combined Elements!`
                : `Level ${reachedLv} · Elemental Resonance`;
        } else {
          this.pendingUpgrades = this.buildLevelUpOptions();
          this.upgradePromptTitle = `Level ${reachedLv} Reached — Choose Your Reward`;
        }
        this.status = 'CHOOSING_UPGRADE';
      }
    } else {
      // Still let player test swings/skills in Camp cleanly
      this.updateProjectiles(safeDt, tuning, 1.0);
      this.updateGasClouds(safeDt, tuning);
    }

    this.updateCamera(safeDt, tuning, viewportW, viewportH);
  }

  private updatePlayer(dt: number, input: InputState, tuning: TuningConfig): void {
    const p = this.player;
    const cDef = this.cdef(p.characterId);
    const scale = tuning.playerScale;
    const cdSpeedMult =
      1 +
      p.swiftFootworkLevel * 0.05 +
      Math.max(0, p.abilitySlotLevels[0] - 1) * 0.03 +
      this.permAltarBonuses.agility * 0.04 +
      (this.hasBossCharm('paradox_hourglass') ? 0.25 : 0) +
      (this.hasCharmSynergy('neon_paradox') ? 0.18 : 0);
    this.frameInput = input;
    p.animTime += dt;
    if (p.landTimer > 0) p.landTimer = Math.max(0, p.landTimer - dt);
    if (p.ledgeCooldown > 0) p.ledgeCooldown = Math.max(0, p.ledgeCooldown - dt);
    if (p.wallJumpLockTimer > 0) p.wallJumpLockTimer = Math.max(0, p.wallJumpLockTimer - dt);
    if (p.katanaMegaSlashTimer > 0) p.katanaMegaSlashTimer = Math.max(0, p.katanaMegaSlashTimer - dt);
    if (p.monkComboTimer > 0) {
      p.monkComboTimer = Math.max(0, p.monkComboTimer - dt);
      if (p.monkComboTimer === 0) p.monkComboStep = 0;
    }
    if (p.monkPalmTimer > 0) p.monkPalmTimer = Math.max(0, p.monkPalmTimer - dt);
    if (p.wizardNovaTimer > 0) p.wizardNovaTimer = Math.max(0, p.wizardNovaTimer - dt);
    if (p.wizardCastTimer > 0) p.wizardCastTimer = Math.max(0, p.wizardCastTimer - dt);
    if (p.wizardFloatTimer > 0) p.wizardFloatTimer = Math.max(0, p.wizardFloatTimer - dt);
    if (p.assassinStepTimer > 0) p.assassinStepTimer = Math.max(0, p.assassinStepTimer - dt);
    if (p.assassinBlinkTimer > 0) p.assassinBlinkTimer = Math.max(0, p.assassinBlinkTimer - dt);
    if (p.onGround) p.assassinBlinkUsed = false;
    if (p.assassinThrowTimer > 0) p.assassinThrowTimer = Math.max(0, p.assassinThrowTimer - dt);
    if (p.assassinThrowCooldown > 0) p.assassinThrowCooldown = Math.max(0, p.assassinThrowCooldown - dt);
    if (p.assassinMarkCastTimer > 0) p.assassinMarkCastTimer = Math.max(0, p.assassinMarkCastTimer - dt);
    if (p.assassinComboTimer > 0) {
      p.assassinComboTimer = Math.max(0, p.assassinComboTimer - dt);
      if (p.assassinComboTimer === 0) p.assassinComboStep = 0;
    }

    // Cooldowns & Buff timers
    if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    if (p.flashTimer > 0) p.flashTimer = Math.max(0, p.flashTimer - dt);
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    if (p.dropThroughTimer > 0) p.dropThroughTimer = Math.max(0, p.dropThroughTimer - dt);
    if (p.attackBufferTimer > 0) p.attackBufferTimer = Math.max(0, p.attackBufferTimer - dt);
    if (p.weaponSkillCooldown > 0) {
      p.weaponSkillCooldown = Math.max(0, p.weaponSkillCooldown - dt * cdSpeedMult);
    }
    if (p.parryWindowTimer > 0) p.parryWindowTimer = Math.max(0, p.parryWindowTimer - dt);
    if (p.parryCooldownTimer > 0) p.parryCooldownTimer = Math.max(0, p.parryCooldownTimer - dt);
    if (p.tagPartnerCooldown > 0) {
      p.tagPartnerCooldown = Math.max(0, p.tagPartnerCooldown - dt * cdSpeedMult);
    }
    if (p.specialItemCooldown > 0) p.specialItemCooldown = Math.max(0, p.specialItemCooldown - dt);
    if (p.fireWeaponTimer > 0) p.fireWeaponTimer = Math.max(0, p.fireWeaponTimer - dt);
    if (p.shadowChainTimer > 0) {
      p.shadowChainTimer = Math.max(0, p.shadowChainTimer - dt);
      if (p.shadowChainTimer === 0) p.shadowChainCount = 0;
    }
    if (p.armorTimer > 0) {
      p.armorTimer = Math.max(0, p.armorTimer - dt);
      if (p.armorTimer === 0) p.armorShield = 0;
    }

    for (const id of ABILITY_ORDER) {
      if (p.abilityCooldowns[id] > 0) {
        p.abilityCooldowns[id] = Math.max(0, p.abilityCooldowns[id] - dt * cdSpeedMult);
      }
    }

    // Update Minstrel 8-way directional whip target reticle (only while not crouching)
    if ((p.weapon === 'ribbon_whip' || p.weapon === 'silk_whip') && !p.crouching) {
      this.minstrelAimAnchor = this.findMinstrelWhipAnchor(input, tuning, p.minstrelZipActive);
    } else {
      this.minstrelAimAnchor = null;
    }

    // Key 5: Equipped Single Item Slot · Key 6: Equipped Single Special Item Slot
    if (input.itemJustPressed) {
      this.useItem(p.itemSlots[0], tuning);
    }
    if (input.specialItemJustPressed) {
      this.useSpecialItem(tuning);
    }

    if (input.interactJustPressed) {
      // Mobile: the Interact button performs the stealth assassination when one is lined up.
      const assassinTarget = input.autoAttack ? this.findMeleeAssassinationTarget(tuning) : null;
      if (p.characterId === 'assassin' && this.tryAssassinInteractExecute(input, tuning)) {
        // Shadow-step execute from range (handled).
      } else if (assassinTarget && p.attackState === 'idle') {
        p.facing = assassinTarget.x >= p.x ? 1 : -1;
        p.attackBufferTimer = 0.14;
      } else {
        this.tryInteract(tuning);
      }
      if (this.status !== 'PLAYING' && this.status !== 'CAMP') return;
    }

    if (input.jumpJustPressed) {
      p.jumpBufferTimer = tuning.jumpBufferMs / 1000;
    }
    if (input.attackJustPressed) {
      p.attackBufferTimer = 0.14;
    }

    // Active Ledge Grab & Pull-Up Mantle (Available for ALL heroes!)
    if (p.ledgeGrabActive) {
      p.ledgeGrabTimer += dt;
      const t = Math.min(1, p.ledgeGrabTimer / Math.max(0.05, p.ledgeGrabDuration));
      // Smooth ease-out curve: lift up first, then step cleanly onto platform edge
      const easeY = 1 - Math.pow(1 - t, 3);
      const easeX = t * t * (3 - 2 * t);
      p.x = p.ledgeStartX + (p.ledgeTargetX - p.ledgeStartX) * easeX;
      p.y = p.ledgeStartY + (p.ledgeTargetY - p.ledgeStartY) * easeY;
      p.vx = 0;
      p.vy = 0;
      p.wallClingDir = 0;
      if (t >= 1) {
        p.x = p.ledgeTargetX;
        p.y = p.ledgeTargetY;
        p.ledgeGrabActive = false;
        p.onGround = true;
        p.landTimer = 0.12;
        p.ledgeCooldown = 0.18;
      }
      return;
    }

    // Hitstun
    if (p.hitStunTimer > 0) {
      p.grapple.active = false;
      p.backdashTimer = 0;
      p.dashAttackTimer = 0;
      p.katanaChargeTimer = 0;
      p.hammerLeapState = 'none';
      p.hammerLeapTimer = 0;
      p.rapierLungeTimer = 0;
      p.axeSpinTimer = 0;
      p.naginataVaultTimer = 0;
      p.minstrelZipActive = false;
      p.minstrelVaultTimer = 0;
      p.minstrelDanceTimer = 0;
      p.monkDashTimer = 0;
      p.monkChargeTimer = 0;
      p.monkCharge = 0;
      p.wizardFloatTimer = 0;
      p.assassinBlinkTimer = 0;
      p.wallClingDir = 0;
      p.hitStunTimer = Math.max(0, p.hitStunTimer - dt);
      if (!p.isAirKnockback) {
        p.vx *= Math.pow(0.02, dt);
      } else {
        p.vx *= Math.pow(0.55, dt);
      }
      this.applyPlayerPhysics(dt, tuning, false);
      if (p.onGround && p.isAirKnockback && p.vy >= 0) {
        p.isAirKnockback = false;
        p.vx = 0;
        p.hitStunTimer = Math.min(p.hitStunTimer, 0.06);
      }
      return;
    }
    p.isAirKnockback = false;

    if (p.grapple.active) {
      p.wallClingDir = 0;
      this.updateGrapple(dt, input, tuning);
      return;
    }

    // Active MINSTREL WHIP-ZIP MOTION (100% Invulnerable + Damage On Touch + 3 Exit Cancels!)
    if (p.minstrelZipActive) {
      this.updateMinstrelZip(dt, input, tuning);
      return;
    }

    // Active MINSTREL ENCORE WALTZ DANCE (Key 3 — Musical 3-Beat Spin + Projectile Deflect + Finale!)
    if (p.minstrelDanceTimer > 0) {
      this.updateMinstrelDance(dt, input, tuning);
      return;
    }

    // Active MINSTREL VAULT THROW-LAUNCH (Jump Exit from Zip — Deals Contact Damage & Bounces Back!)
    if (p.minstrelVaultTimer > 0) {
      this.updateMinstrelVault(dt, input, tuning);
      return;
    }

    // Active Katana Key [3] Charge -> Unleash HUGE Wide Iaijutsu Slash!
    if (p.katanaChargeTimer > 0) {
      p.katanaChargeTimer = Math.max(0, p.katanaChargeTimer - dt);
      p.wallClingDir = 0;
      const moveDirCharge = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (moveDirCharge !== 0) {
        p.facing = moveDirCharge > 0 ? 1 : -1;
      }
      p.vx *= Math.pow(0.01, dt);
      this.applyPlayerPhysics(dt, tuning, false);
      if (Math.random() < 0.5) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 26,
          y: p.y - p.baseH * scale * 0.55 + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 50,
          vy: -25 - Math.random() * 40,
          size: 3.5,
          color: '#f43f5e',
          life: 0.2,
          maxLife: 0.2,
          kind: 'sparkle',
          rotation: Math.random() * Math.PI,
        });
      }
      if (p.katanaChargeTimer === 0) {
        this.releaseKatanaMegaSlash(tuning);
      }
      return;
    }

    // Active WAR HAMMER KEY [3] — Meteor Slam (Big Leap -> Plunge -> MASSIVE Ground AoE!)
    if (p.hammerLeapState !== 'none') {
      p.wallClingDir = 0;
      p.crouching = false;
      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.03) {
        this.afterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: false,
          color: p.hammerLeapState === 'slamming' ? '#f97316' : '#fbbf24',
          life: 0.22,
          maxLife: 0.22,
        });
      }
      const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (p.hammerLeapState === 'rising') {
        p.hammerLeapTimer = Math.max(0, p.hammerLeapTimer - dt);
        if (steer !== 0) {
          p.facing = steer > 0 ? 1 : -1;
          p.vx = steer * 270;
        }
        this.applyPlayerPhysics(dt, tuning, true);
        if (p.hammerLeapTimer <= 0 || p.vy > -35) {
          p.hammerLeapState = 'slamming';
          p.vy = 1080;
          p.vx = p.facing * 125;
        }
      } else {
        p.vy = Math.max(p.vy, 1080);
        this.applyPlayerPhysics(dt, tuning, false);
        if (p.onGround) {
          p.hammerLeapState = 'none';
          p.hammerLeapTimer = 0;
          p.vx = 0;
          this.executeHammerMeteorSlam(tuning);
        }
      }
      return;
    }

    // Active CRIMSON RAPIER KEY [3] — Phantom Lunge (Invulnerable Blink-Pierce!)
    if (p.rapierLungeTimer > 0) {
      p.rapierLungeTimer = Math.max(0, p.rapierLungeTimer - dt);
      p.wallClingDir = 0;
      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.022) {
        this.afterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: false,
          color: '#f43f5e',
          life: 0.22,
          maxLife: 0.22,
        });
      }
      p.vx = p.facing * 750;
      p.vy = 0;
      this.applyPlayerPhysics(dt, tuning, false);

      const lungeBox: Rect = {
        x: p.x - 18 * scale + (p.facing === 1 ? 0 : -72 * scale),
        y: p.y - p.baseH * scale * 0.92,
        w: 96 * scale,
        h: p.baseH * scale * 0.84,
      };
      const weaponLv = 1 + p.weaponDamageBonus;
      for (const enemy of this.enemies) {
        if (enemy.dead || p.rapierLungeHitIds.has(enemy.id)) continue;
        if (rectsOverlap(lungeBox, this.getEnemyRect(enemy, tuning.enemyScale))) {
          p.rapierLungeHitIds.add(enemy.id);
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
        }
      }

      // Tier 3+ Bloodburst Explosion at the end of Phantom Lunge!
      if (p.rapierLungeTimer === 0 && weaponLv >= 3) {
        const bx = p.x + p.facing * 20 * scale;
        const by = p.y - p.baseH * scale * 0.55;
        const burstR = 112;
        sound.playHammerBoom();
        this.triggerShake(8, 0.2);
        this.shockwaves.push({
          x: bx,
          y: by,
          radius: 12,
          maxRadius: burstR,
          color: '#f43f5e',
          life: 0.24,
          maxLife: 0.24,
        });
        this.spawnSparkles(bx, by, 20, '#f43f5e', '#ffd166', 1.35);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - bx, ey - by) <= burstR + 14) {
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
          }
        }
      }
      return;
    }

    // Active VANGUARD KEY [3] — Bulwark Shield Bash (armored charge that stuns & slams enemies!)
    if (p.vanguardBashTimer > 0) {
      p.vanguardBashTimer = Math.max(0, p.vanguardBashTimer - dt);
      p.shieldGuardActive = true;
      p.vx = p.facing * 520;
      p.vy = Math.min(p.vy, 60);
      this.applyPlayerPhysics(dt, tuning, false);

      const bashBox: Rect = {
        x: p.x + (p.facing === 1 ? -6 : -78) * scale,
        y: p.y - p.baseH * scale * 0.96,
        w: 84 * scale,
        h: p.baseH * scale * 0.94,
      };
      const weaponLv = 1 + p.weaponDamageBonus;
      for (const enemy of this.enemies) {
        if (enemy.dead || p.vanguardBashHitIds.has(enemy.id)) continue;
        if (rectsOverlap(bashBox, this.getEnemyRect(enemy, tuning.enemyScale))) {
          p.vanguardBashHitIds.add(enemy.id);
          sound.playHammerBoom();
          this.triggerShake(7.5, 0.16);
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv + 1, {
            bonusDamage: 2,
            guardBreak: true,
            kbX: 460,
            kbY: 165,
            stun: 0.7,
          });
        }
      }
      return;
    }

    // Update active Prism Glass Walls (shimmering crystalline bounce barriers!)
    for (let gi = this.glassWalls.length - 1; gi >= 0; gi--) {
      const gw = this.glassWalls[gi];
      gw.life -= dt;
      gw.flashTimer = Math.max(0, gw.flashTimer - dt);
      if (gw.life <= 0) {
        this.spawnSparkles(gw.x + gw.w * 0.5, gw.y + gw.h * 0.5, 10, gw.color, '#ffffff', 0.85);
        this.glassWalls.splice(gi, 1);
      }
    }

    // Active PRISM STRIKER — Penetrating Physics Ricochet Bounce Flight!
    // (Frontal dash invulnerability is enforced directionally inside damagePlayer!)
    if (p.bounceActive) {
      p.bounceTimer -= dt;
      p.bounceWallCooldown = Math.max(0, p.bounceWallCooldown - dt);
      const halfW = (p.baseW * scale) / 2;
      const h = p.baseH * scale;
      const weaponLv = 1 + p.weaponDamageBonus;
      const evoTier = this.getWeaponEvoTier();

      // Afterimages along ricochet path
      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.02) {
        this.afterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: false,
          color: p.bouncesLeft <= 1 ? '#f472b6' : '#22d3ee',
          life: 0.22,
          maxLife: 0.22,
        });
      }

      // Physics gravity + optional manual directional steering/dampening
      const steerX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const steerY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const manualDampen =
        (steerX !== 0 && Math.sign(steerX) !== Math.sign(p.vx)) || input.down;
      p.vy += tuning.gravity * 0.42 * dt;
      if (steerX !== 0) p.vx += steerX * 420 * dt;
      if (steerY !== 0) p.vy += steerY * 380 * dt;

      const prevX = p.x;
      const prevY = p.y;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.bounceDistLeft -= Math.hypot(p.x - prevX, p.y - prevY);
      p.facing = p.vx >= 0 ? 1 : -1;

      // Penetrate straight through enemies & bosses on the way!
      const pierceBox: Rect = {
        x: p.x - halfW - 14 * scale,
        y: p.y - h - 6,
        w: (halfW * 2 + 28 * scale),
        h: h + 10,
      };
      for (const enemy of this.enemies) {
        if (enemy.dead || p.bounceHitIds.has(enemy.id)) continue;
        if (rectsOverlap(pierceBox, this.getEnemyRect(enemy, tuning.enemyScale))) {
          p.bounceHitIds.add(enemy.id);
          const speedBonus = Math.min(3, Math.floor(Math.hypot(p.vx, p.vy) / 260));
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv, {
            bonusDamage: speedBonus,
            guardBreak: true,
            kbX: 85,
            stun: 0.24,
          });
          this.spawnSparkles(enemy.x, enemy.y - enemy.baseH * tuning.enemyScale * 0.5, 10, '#22d3ee', '#f472b6', 1.0);
        }
      }

      // Check surface collision (Glass Walls, Platforms, Arena Bounds, Ceiling)
      let hitNormalX = 0;
      let hitNormalY = 0;
      let hitGlass: GlassWall | null = null;
      const pRect: Rect = { x: p.x - halfW, y: p.y - h, w: halfW * 2, h };

      // 1. Prism Glass Walls (highest priority for box-machine ricochets!)
      for (const gw of this.glassWalls) {
        if (rectsOverlap(pRect, gw)) {
          hitGlass = gw;
          if (gw.orientation === 'vertical') {
            if (p.vx > 0) {
              p.x = gw.x - halfW - 1;
              hitNormalX = -1;
            } else {
              p.x = gw.x + gw.w + halfW + 1;
              hitNormalX = 1;
            }
          } else {
            if (p.vy > 0) {
              p.y = gw.y - 1;
              hitNormalY = -1;
            } else {
              p.y = gw.y + gw.h + h + 1;
              hitNormalY = 1;
            }
          }
          break;
        }
      }

      // 2. Stage Platforms (solid walls/floors/ceilings + one-way tops when falling)
      if (hitNormalX === 0 && hitNormalY === 0) {
        for (const plat of this.platforms) {
          if (!this.isPlatformSolid(plat)) continue;
          if (plat.oneWay) {
            if (
              p.vy > 0 &&
              p.x + halfW > plat.x + 2 &&
              p.x - halfW < plat.x + plat.w - 2 &&
              prevY <= plat.y + 14 &&
              p.y >= plat.y
            ) {
              p.y = plat.y - 1;
              hitNormalY = -1;
              break;
            }
          } else if (rectsOverlap(pRect, plat)) {
            if (p.vy >= 0 && prevY <= plat.y + 16) {
              p.y = plat.y - 1;
              hitNormalY = -1;
            } else if (p.vy < 0 && prevY - h >= plat.y + plat.h - 16) {
              p.y = plat.y + plat.h + h + 1;
              hitNormalY = 1;
            } else if (p.vx > 0 && prevX + halfW <= plat.x + 18) {
              p.x = plat.x - halfW - 1;
              hitNormalX = -1;
            } else if (p.vx < 0 && prevX - halfW >= plat.x + plat.w - 18) {
              p.x = plat.x + plat.w + halfW + 1;
              hitNormalX = 1;
            } else {
              hitNormalY = p.vy >= 0 ? -1 : 1;
            }
            break;
          }
        }
      }

      // 3. World edges & top ceiling
      if (hitNormalX === 0 && hitNormalY === 0) {
        if (p.x - halfW <= 8) {
          p.x = halfW + 10;
          hitNormalX = 1;
        } else if (p.x + halfW >= this.currentStage.worldWidth - 8) {
          p.x = this.currentStage.worldWidth - halfW - 10;
          hitNormalX = -1;
        } else if (p.y - h <= 24) {
          p.y = 26 + h;
          hitNormalY = 1;
        }
      }

      if ((hitNormalX !== 0 || hitNormalY !== 0) && p.bounceWallCooldown <= 0) {
        p.bounceWallCooldown = 0.045;
        p.bouncesLeft -= 1;
        p.bounceHitIds.clear();
        if (hitGlass) {
          hitGlass.flashTimer = 0.28;
        }

        if (p.bouncesLeft <= 0) {
          // FINAL BOUNCE SURFACE EXPLOSION!
          p.bounceActive = false;
          p.bounceTimer = 0;
          const blastR = 138 + evoTier * 18;
          sound.playExplosion(true);
          this.triggerShake(10.5, 0.24);
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.075);
          this.shockwaves.push({
            x: p.x,
            y: p.y - h * 0.5,
            radius: 14,
            maxRadius: blastR,
            color: '#f472b6',
            life: 0.3,
            maxLife: 0.3,
          });
          this.shockwaves.push({
            x: p.x,
            y: p.y - h * 0.5,
            radius: 8,
            maxRadius: blastR * 0.72,
            color: '#22d3ee',
            life: 0.24,
            maxLife: 0.24,
          });
          this.spawnSparkles(p.x, p.y - h * 0.5, 28, '#22d3ee', '#f472b6', 1.4);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - enemy.baseH * tuning.enemyScale * 0.5;
            if (Math.hypot(enemy.x - p.x, ey - (p.y - h * 0.5)) <= blastR) {
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv + 1, {
                bonusDamage: 3 + evoTier * 2,
                guardBreak: true,
                kbX: 280,
                kbY: 165,
                stun: 0.58,
              });
            }
          }
          this.spawnDamageNumber(p.x, p.y - h - 18, 'PRISM DETONATION!', '#f472b6', 1.2);
          // Graceful rebound hop out of impact
          p.vx = hitNormalX !== 0 ? hitNormalX * 210 : -p.facing * 140;
          p.vy = hitNormalY === -1 ? -320 : -190;
          p.onGround = false;
          return;
        }

        // Reflect velocity off the hit surface (physics ricochet + optional manual dampening!)
        // Every bounce expands maximum travel reach so chained ricochets cover wider arenas!
        p.bounceCountDone += 1;
        const speedBoost = manualDampen ? 0.72 : Math.min(1.28, 1.0 + p.bounceCountDone * 0.06);
        const nextReach = (210 + p.bounceCountDone * 95) * scale;
        p.bounceDistLeft = manualDampen ? nextReach * 0.72 : nextReach;

        if (hitNormalX !== 0) {
          p.vx = -p.vx * speedBoost;
          if (Math.abs(p.vx) < (manualDampen ? 260 : 480)) {
            p.vx = hitNormalX * (manualDampen ? 290 : 540);
          }
          // Slight vertical pop so wall-to-wall pinball stays lively!
          p.vy = p.vy * 0.78 - (input.up ? 190 : 75);
        }
        if (hitNormalY !== 0) {
          p.vy = -p.vy * speedBoost;
          if (hitNormalY === -1 && p.vy > (manualDampen ? -240 : -440)) {
            p.vy = manualDampen ? -270 : -480;
          } else if (hitNormalY === 1 && p.vy < 240) {
            p.vy = 320;
          }
          p.vx = p.vx * (manualDampen ? 0.78 : 1.02);
          if (Math.abs(p.vx) < 220) {
            p.vx = (steerX !== 0 ? steerX : p.facing) * (manualDampen ? 240 : 450);
          }
        }
        p.facing = p.vx >= 0 ? 1 : -1;
        p.bounceTimer = Math.max(p.bounceTimer, 1.5);
        sound.playParry(true);
        this.triggerShake(4.8, 0.11);
        this.shockwaves.push({
          x: p.x,
          y: p.y - h * 0.5,
          radius: 8,
          maxRadius: 68,
          color: hitGlass ? '#67e8f9' : '#22d3ee',
          life: 0.2,
          maxLife: 0.2,
        });
        this.spawnSparkles(p.x, p.y - h * 0.5, 14, '#22d3ee', '#ffffff', 1.1);
        this.spawnDamageNumber(
          p.x,
          p.y - h - 12,
          manualDampen ? `SOFT BOUNCE (${p.bouncesLeft})` : `RICOCHET! (${p.bouncesLeft})`,
          '#67e8f9',
          0.95
        );
      }

      if (p.bounceDistLeft <= 0 || p.bounceTimer <= 0 || p.y > this.currentStage.worldHeight + 40) {
        if (p.bounceDistLeft <= 0) {
          p.vx *= 0.35;
          p.vy *= 0.35;
          this.spawnSparkles(p.x, p.y - h * 0.5, 8, '#22d3ee', '#e0f2fe', 0.8);
        }
        p.bounceActive = false;
        p.bouncesLeft = 0;
        p.bounceDistLeft = 0;
      }
      return;
    }

    // Active MONK KEY [3] — Pyre Dash (long, wide, invulnerable power dash that hurls foes aside)
    if (p.monkDashTimer > 0) {
      this.updateMonkPyreDash(dt, tuning);
      return;
    }

    // Active OBSIDIAN GREATAXE KEY [3] — Cyclone Cleave (360° Spinning Iron Tornado!)
    if (p.axeSpinTimer > 0) {
      p.axeSpinTimer = Math.max(0, p.axeSpinTimer - dt);
      p.axeSpinTickTimer -= dt;
      p.wallClingDir = 0;
      const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (steer !== 0) {
        p.facing = steer > 0 ? 1 : -1;
      }
      p.vx = p.facing * 245;
      this.applyPlayerPhysics(dt, tuning, false);

      if (p.axeSpinTickTimer <= 0) {
        p.axeSpinTickTimer = 0.13;
        const weaponLv = 1 + p.weaponDamageBonus;
        const spinR = 112 * scale;
        const cx = p.x;
        const cy = p.y - p.baseH * scale * 0.52;
        sound.playSwordSlash();
        this.spawnSparkles(cx, cy, 10, '#ea580c', '#fef08a', 1.15);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cx, ey - cy) <= spinR + enemy.baseW * tuning.enemyScale * 0.35) {
            if (weaponLv >= 3) this.applyBurn(enemy, 3.2);
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
          }
        }
      }
      return;
    }

    // Active STORM NAGINATA KEY [3] — Tempest Vault (Leaping Spinning Lightning Polearm!)
    if (p.naginataVaultTimer > 0) {
      p.naginataVaultTimer = Math.max(0, p.naginataVaultTimer - dt);
      p.wallClingDir = 0;
      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.032) {
        this.afterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: false,
          color: '#38bdf8',
          life: 0.22,
          maxLife: 0.22,
        });
      }
      this.applyPlayerPhysics(dt, tuning, false);

      const weaponLv = 1 + p.weaponDamageBonus;
      const vaultR = 122 * scale;
      const cx = p.x + p.facing * 10 * scale;
      const cy = p.y - p.baseH * scale * 0.55;
      for (const enemy of this.enemies) {
        if (enemy.dead || p.naginataVaultHitIds.has(enemy.id)) continue;
        const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
        if (Math.hypot(enemy.x - cx, ey - cy) <= vaultR + enemy.baseW * tuning.enemyScale * 0.35) {
          p.naginataVaultHitIds.add(enemy.id);
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
          if (weaponLv >= 3) {
            // Tier 3+ Thunder Strike vertical shockwave on pierced target!
            this.shockwaves.push({
              x: enemy.x,
              y: ey,
              radius: 10,
              maxRadius: 84,
              color: '#38bdf8',
              life: 0.22,
              maxLife: 0.22,
            });
            this.spawnSparkles(enemy.x, ey - 20, 14, '#38bdf8', '#ffffff', 1.25);
          }
        }
      }
      // Deflect nearby enemy projectiles during Tempest Vault spin!
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i];
        if (!proj.fromEnemy) continue;
        if (Math.hypot(proj.x - cx, proj.y - cy) <= vaultR) {
          sound.playArmorBlock();
          this.spawnSparkles(proj.x, proj.y, 8, '#38bdf8', '#ffffff', 0.9);
          this.projectiles.splice(i, 1);
        }
      }
      return;
    }

    // Active Special Backdash (Key 3)
    if (p.backdashTimer > 0) {
      p.backdashTimer = Math.max(0, p.backdashTimer - dt);
      p.wallClingDir = 0;
      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.032) {
        this.afterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: p.crouching,
          color: '#60a5fa',
          life: 0.22,
          maxLife: 0.22,
        });
      }
      p.vx = -p.facing * (445 + p.weaponDamageBonus * 45);
      p.vy = 0;
      this.applyPlayerPhysics(dt, tuning, false);
      return;
    }

    // Active Long Forward Dash Attack
    if (p.dashAttackTimer > 0) {
      p.dashAttackTimer = Math.max(0, p.dashAttackTimer - dt);
      p.wallClingDir = 0;
      this.afterimageAccum += dt;
      if (this.afterimageAccum >= 0.026) {
        this.afterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: false,
          color: p.fireWeaponTimer > 0 ? '#f97316' : '#ef4444',
          life: 0.24,
          maxLife: 0.24,
        });
      }
      p.vx = p.facing * (650 + (p.dashAttackLevel - 1) * 35);
      p.vy = 0;
      this.applyPlayerPhysics(dt, tuning, false);

      const dashBox: Rect = {
        x: p.x - p.baseW * scale * 0.6 + (p.facing === 1 ? 0 : -46 * scale),
        y: p.y - p.baseH * scale * 0.92,
        w: p.baseW * scale * 1.2 + 46 * scale,
        h: p.baseH * scale * 0.85,
      };
      for (const enemy of this.enemies) {
        if (enemy.dead || p.dashAttackHitIds.has(enemy.id)) continue;
        if (rectsOverlap(dashBox, this.getEnemyRect(enemy, tuning.enemyScale))) {
          p.dashAttackHitIds.add(enemy.id);
          this.handlePlayerHitEnemy(enemy, tuning, 'dash', p.dashAttackLevel);
        }
      }

      // Lv 4+ Phantom Wake: explosive AoE shockwave burst when dash completes!
      if (p.dashAttackTimer === 0 && p.dashAttackLevel >= 4) {
        const wakeX = p.x;
        const wakeY = p.y - p.baseH * scale * 0.5;
        const wakeR = 102;
        sound.playHammerBoom();
        this.triggerShake(Math.max(7, tuning.critShakeIntensity * 0.85), 0.2);
        this.shockwaves.push({
          x: wakeX,
          y: wakeY,
          radius: 14,
          maxRadius: wakeR,
          color: '#ef4444',
          life: 0.24,
          maxLife: 0.24,
        });
        this.spawnSparkles(wakeX, wakeY, 18, '#ef4444', '#ffd166', 1.3);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - wakeX, ey - wakeY) <= wakeR + 12) {
            this.handlePlayerHitEnemy(enemy, tuning, 'dash', p.dashAttackLevel);
          }
        }
      }
      return;
    }

    // Trigger Weapon Skill (Key 3) — grants rare 0.10s Perfect Parry ONLY if 12s Parry Cooldown is ready!
    if (input.backdashJustPressed && p.weaponSkillCooldown <= 0) {
      if (this.triggerWeaponSkill(tuning)) {
        this.applySkill3Cast(tuning);
        if (p.parryCooldownTimer <= 0) {
          p.parryWindowTimer = Math.max(p.parryWindowTimer, 0.10);
        }
        if (p.tagPartner && p.tagPartnerCooldown <= 0 && !this.currentStage.isCamp) {
          this.summonPhantomAlly(p.tagPartner, tuning);
          p.tagPartnerCooldown = 7.5;
        }
        return;
      }
    }

    // Trigger Equipped Single Spell (Key 4)
    if (input.spellJustPressed) {
      const abilityId = p.abilitySlots[0];
      const slotLevel = p.abilitySlotLevels[0];
      if (this.tryCastAbility(abilityId, slotLevel, input, tuning)) {
        return;
      }
    }

    // Orbiting Grimoire passive: smoothly regenerate up to 3 orbiting elemental orbs!
    if (p.weapon === 'orbiting_grimoire' && p.grimoireOrbs < 3) {
      p.grimoireOrbRechargeTimer += dt;
      if (p.grimoireOrbRechargeTimer >= 0.85) {
        p.grimoireOrbRechargeTimer = 0;
        p.grimoireOrbs = Math.min(3, p.grimoireOrbs + 1);
      }
    }

    // Automatic Click-to-Charge buildup for Cleaver Greatsword & Imperial War-Lance (NO hold required!)
    if (
      p.attackState === 'startup' &&
      (p.attackWeapon === 'cleaver_greatsword' || p.attackWeapon === 'joust_lance')
    ) {
      const pct =
        p.attackTotalStartup > 0
          ? Math.max(0, Math.min(1, 1 - p.attackTimer / p.attackTotalStartup))
          : 1;
      p.weaponChargeTimer = pct * 0.85;
      if (Math.random() < 0.65) {
        const chH = (p.attackWasCrouching ? p.crouchBaseH : p.baseH) * scale;
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 34,
          y: p.y - chH * 0.6 + (Math.random() - 0.5) * 28,
          vx: (Math.random() - 0.5) * 45,
          vy: -38 - Math.random() * 42,
          size: 3.6,
          color: p.attackWeapon === 'cleaver_greatsword' ? '#fb923c' : '#fde047',
          life: 0.22,
          maxLife: 0.22,
          kind: 'sparkle',
          rotation: Math.random() * Math.PI,
        });
      }
    }

    // Tower Shield auto-guard is active while swinging Shield & Mace or during Bulwark Bash!
    p.shieldGuardActive =
      p.vanguardBashTimer > 0 ||
      (p.attackWeapon === 'shield_mace' && (p.attackState === 'startup' || p.attackState === 'active'));

    // Update Weapon Attack State Machine
    this.updatePlayerAttack(dt, tuning);

    const isAttacking = p.attackState !== 'idle';

    // MOBILE AUTOMATIC ATTACK: swings at foes in weapon range (stealth-safe), deflects projectiles & cracks secret walls.
    let autoAttackTriggered = false;
    if (
      input.autoAttack &&
      tuning.mobileAutoAttack !== false &&
      !this.currentStage.isCamp &&
      p.attackState === 'idle' &&
      p.attackBufferTimer <= 0 &&
      !p.minstrelZipActive
    ) {
      const moveInputX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const target = this.findAutoAttackTarget(tuning, moveInputX);
      let closestTargetDir: -1 | 0 | 1 = target ? (target.x - p.x >= 0 ? 1 : -1) : 0;
      const pyMid = p.y - (p.crouching ? p.crouchBaseH : p.baseH) * scale * 0.5;
      const wepReach = this.getAutoAttackReach(tuning);

      // 2. Incoming enemy projectiles -> automatic deflect swing
      if (closestTargetDir === 0) {
        for (const proj of this.projectiles) {
          if (!proj.fromEnemy) continue;
          const dx = proj.x - p.x;
          const dy = Math.abs(proj.y - pyMid);
          if (Math.abs(dx) <= 88 && dy <= 58) {
            closestTargetDir = dx >= 0 ? 1 : -1;
            break;
          }
        }
      }

      // 3. Adjacent intact Secret Walls
      if (closestTargetDir === 0) {
        for (const sw of this.secretWalls) {
          if (sw.broken) continue;
          const swCenterX = sw.x + sw.w * 0.5;
          const dx = swCenterX - p.x;
          const dy = Math.abs(sw.y + sw.h * 0.5 - pyMid);
          if (dx * p.facing >= -10 && Math.abs(dx) <= wepReach * 0.9 && dy <= 76) {
            closestTargetDir = dx >= 0 ? 1 : -1;
            break;
          }
        }
      }

      if (closestTargetDir !== 0) {
        if (moveInputX === 0 || moveInputX === closestTargetDir) {
          p.facing = closestTargetDir;
        }
        if (p.facing === closestTargetDir) {
          p.attackBufferTimer = 0.08;
          autoAttackTriggered = true;
        }
      }
    }

    // Assassin: crouch / hold down + [1] throws a dagger instead of a melee chain.
    if (
      p.attackBufferTimer > 0 &&
      p.attackState === 'idle' &&
      p.characterId === 'assassin' &&
      p.weapon === 'shadow_daggers' &&
      (input.down || p.crouching) &&
      !autoAttackTriggered &&
      !this.currentStage.isCamp
    ) {
      p.attackBufferTimer = 0;
      if (p.assassinThrowCooldown <= 0) {
        const th = this.player;
        th.facing = (input.right ? 1 : 0) - (input.left ? 1 : 0) !== 0 ? (input.right ? 1 : -1) : th.facing;
        this.throwDagger(tuning);
      }
    }

    // Start buffered weapon attack (Key 1 or Mobile Auto-Attack) — rare tight 0.10s Parry Window ONLY if 12s Parry Cooldown is ready!
    if (p.attackBufferTimer > 0 && p.attackState === 'idle') {
      p.attackBufferTimer = 0;
      p.weaponChargeTimer = 0;
      if (p.parryCooldownTimer <= 0) {
        p.parryWindowTimer = Math.max(p.parryWindowTimer, 0.10);
      }

      // Minstrel Ribbon/Silk Whip:
      // - Manual Standing / Airborne [1] attempts 8-way directional Whip-Zip!
      // - Crouching + [1] OR Mobile Auto-Attack executes her crisp ribbon-lash strike!
      if (
        (p.weapon === 'ribbon_whip' || p.weapon === 'silk_whip') &&
        !p.crouching &&
        !autoAttackTriggered
      ) {
        const moveInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (moveInput !== 0) p.facing = moveInput > 0 ? 1 : -1;
        if (this.tryStartMinstrelWhipZip(input, tuning, false)) {
          return;
        }
        // No anchor in aimed direction: crisp dry whip snap feedback without performing a standing attack
        sound.playWhip();
        const aimX = (input.right ? 1 : 0) - (input.left ? 1 : 0) || p.facing;
        const aimY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
        this.spawnSparkles(
          p.x + aimX * 42,
          p.y - p.baseH * scale * 0.55 + aimY * 32,
          6,
          '#ec4899',
          '#fef08a',
          0.7
        );
        return;
      }

      p.attackState = 'startup';
      p.attackWeapon = p.weapon;
      p.attackWasCrouching = p.crouching;
      p.attackWasAirborne = !p.onGround;
      p.attackHitIds.clear();

      const wepEvoTier = this.getWeaponEvoTier();
      if (p.weapon === 'hammer') {
        p.attackTotalStartup = Math.max(0.3, (tuning.attackStartupMs / 1000) * 4.8);
        p.attackTimer = p.attackTotalStartup;
        sound.playHammerCharge();
      } else if (p.weapon === 'greataxe') {
        p.attackTotalStartup = Math.max(0.22, (tuning.attackStartupMs / 1000) * 3.4);
        p.attackTimer = p.attackTotalStartup;
        sound.playHammerCharge();
      } else if (p.weapon === 'rapier' || p.weapon === 'estoc_spear') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * (p.weapon === 'estoc_spear' ? 0.56 : 0.58);
        p.attackTimer = p.attackTotalStartup;
        sound.playRapierThrust(wepEvoTier);
      } else if (p.weapon === 'short_blade') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.46;
        p.attackTimer = p.attackTotalStartup;
        sound.playDaggerSlash(1, wepEvoTier);
      } else if (p.weapon === 'cleaver_greatsword') {
        // Click-to-charge: single click auto-charges cleanly then unleashes full wide cleave!
        p.attackTotalStartup = Math.max(0.32, (tuning.attackStartupMs / 1000) * 5.2);
        p.attackTimer = p.attackTotalStartup;
        sound.playHammerCharge();
      } else if (p.weapon === 'joust_lance') {
        // Click-to-charge: single click auto-charges cleanly then unleashes long skewer!
        p.attackTotalStartup = Math.max(0.28, (tuning.attackStartupMs / 1000) * 4.6);
        p.attackTimer = p.attackTotalStartup;
        sound.playHammerCharge();
      } else if (p.weapon === 'arcane_wand') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 1.05;
        p.attackTimer = p.attackTotalStartup;
      } else if (p.weapon === 'orbiting_grimoire') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.85;
        p.attackTimer = p.attackTotalStartup;
      } else if (p.weapon === 'burst_crossbow') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.72;
        p.attackTimer = p.attackTotalStartup;
      } else if (p.weapon === 'shield_mace') {
        p.attackTotalStartup = Math.max(0.14, (tuning.attackStartupMs / 1000) * 2.1);
        p.attackTimer = p.attackTotalStartup;
        p.shieldGuardActive = true;
        sound.playArmorBlock();
      } else if (p.weapon === 'kusarigama') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.68;
        p.attackTimer = p.attackTotalStartup;
        sound.playWhip(wepEvoTier);
      } else if (p.weapon === 'twin_chakram') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.65;
        p.attackTimer = p.attackTotalStartup;
        sound.playKatanaSlash(wepEvoTier);
      } else if (p.weapon === 'solar_glaive') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.82;
        p.attackTimer = p.attackTotalStartup;
        sound.playNaginataSlash(wepEvoTier);
      } else if (p.weapon === 'prism_lance') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.45;
        p.attackTimer = p.attackTotalStartup;
        sound.playRapierThrust(wepEvoTier);
      } else if (p.weapon === 'prism_gauntlets') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.42;
        p.attackTimer = p.attackTotalStartup;
        sound.playMonkFist(1, wepEvoTier);
      } else if (p.weapon === 'war_fans') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.52;
        p.attackTimer = p.attackTotalStartup;
        sound.playKatanaSlash(wepEvoTier);
      } else if (p.weapon === 'meteor_flail') {
        p.attackTotalStartup = Math.max(0.28, (tuning.attackStartupMs / 1000) * 4.4);
        p.attackTimer = p.attackTotalStartup;
        sound.playHammerCharge();
      } else if (p.weapon === 'naginata') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.9;
        p.attackTimer = p.attackTotalStartup;
        sound.playNaginataSlash(wepEvoTier);
      } else if (p.weapon === 'katana') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.72;
        p.attackTimer = p.attackTotalStartup;
        sound.playKatanaSlash(wepEvoTier);
      } else if (p.weapon === 'sword') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 0.85;
        p.attackTimer = p.attackTotalStartup;
        sound.playSwordSlash(wepEvoTier);
      } else if (p.weapon === 'ash_wraps') {
        // Monk 3-hit chain: jab -> jab -> heavy palm, chained while inside the combo window.
        p.monkComboStep = p.monkComboTimer > 0 ? (p.monkComboStep + 1) % 3 : 0;
        p.monkComboTimer = 0.7;
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * (p.monkComboStep === 2 ? 1.0 : 0.5);
        p.attackTimer = p.attackTotalStartup;
        sound.playMonkFist(p.monkComboStep, wepEvoTier);
      } else if (p.weapon === 'shadow_daggers') {
        // Twin daggers: stab, slash, then a crossing double slash — chained while inside the combo window.
        p.assassinComboStep = p.assassinComboTimer > 0 ? (p.assassinComboStep + 1) % 3 : 0;
        p.assassinComboTimer = 0.6;
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * (p.assassinComboStep === 2 ? 0.95 : 0.45);
        p.attackTimer = p.attackTotalStartup;
        sound.playDaggerSlash(p.assassinComboStep, wepEvoTier);
      } else if (p.weapon === 'spire_staff') {
        p.attackTotalStartup = (tuning.attackStartupMs / 1000) * 1.15;
        p.attackTimer = p.attackTotalStartup;
      } else {
        p.attackTotalStartup = tuning.attackStartupMs / 1000;
        p.attackTimer = p.attackTotalStartup;
        sound.playWhip(wepEvoTier);
      }
      const startM = startupMul(p.weapon, evoCombatTier(p, tuning), affFlags(p, tuning), combatTune(tuning));
      p.attackTotalStartup *= startM;
      p.attackTimer = p.attackTotalStartup;
    }

    // Crouch handling
    const wantsCrouch = input.down && p.onGround;
    if (!isAttacking || !tuning.freezeOnAttack) {
      p.crouching = wantsCrouch;
    }

    // Horizontal movement (Distinct Hero Speed + Swift Footwork + Elemental Gale + Shadow Chain Momentum + Crouch-Walking!)
    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const freezeGround = isAttacking && p.onGround && tuning.freezeOnAttack;
    const lockAirDirection = isAttacking && !p.onGround && tuning.lockAirDirectionOnAttack;

    const swiftMult = 1 + p.swiftFootworkLevel * 0.04 + this.permAltarBonuses.agility * 0.04;
    const elSpeedBonus =
      p.combinedElement === 'aether' || p.combinedElement === 'phantom' || p.combinedElement === 'tempest'
        ? 0.2
        : p.combinedElement === 'lightning' || p.combinedElement === 'crimson_storm'
          ? 0.18
          : p.combinedElement === 'frost' || p.combinedElement === 'sandstorm' || this.hasElement('storm')
            ? 0.14
            : this.hasElement('air')
              ? 0.16
              : 0;
    const chainSpeedMult = p.shadowChainTimer > 0 ? 1.34 : 1.0;
    const chainJumpMult = p.shadowChainTimer > 0 ? 1.12 : 1.0;
    const charmSpeedBonus =
      (this.hasBossCharm('sunscarab_seal') ? 0.14 : 0) +
      (this.hasBossCharm('neon_overclock_chip') ? 0.16 : 0) +
      (this.hasCharmSynergy('neon_paradox') ? 0.12 : 0) +
      (this.hasCharmSynergy('solar_singularity') ? 0.1 : 0);
    const charmJumpMult =
      (this.hasBossCharm('jade_feather_pearl') ? 1.12 : 1.0) *
      (this.hasBossCharm('abyssal_trident_pearl') ? 1.14 : 1.0);
    const effectiveMoveSpeed = tuning.moveSpeed * cDef.speedMult * (swiftMult + elSpeedBonus + charmSpeedBonus) * chainSpeedMult;
    const effectiveJumpForce = tuning.jumpForce * cDef.jumpMult * chainJumpMult * charmJumpMult;
    const maxHeroAirJumps =
      (cDef.airJumps > 0 ? Math.max(cDef.airJumps, tuning.airJumps) : 0) +
      (this.isCursedChamber ? 1 : 0);
    const monkCharging = p.characterId === 'monk' && p.monkChargeTimer > 0 && p.onGround && input.jumpHeld;
    if (monkCharging) {
      p.crouching = true;
    }

    if (p.shadowChainTimer > 0 && (Math.abs(p.vx) > 60 || !p.onGround)) {
      this.shadowAfterimageAccum += dt;
      if (this.shadowAfterimageAccum >= 0.065) {
        this.shadowAfterimageAccum = 0;
        this.afterimages.push({
          x: p.x,
          y: p.y,
          facing: p.facing,
          crouching: p.crouching,
          color: '#c084fc',
          life: 0.22,
          maxLife: 0.22,
        });
      }
    }

    if (p.wallJumpLockTimer > 0) {
      // Brief momentum preservation right after kicking off a wall (Mega Man X feel!)
    } else if (freezeGround) {
      p.vx = 0;
    } else if (lockAirDirection) {
      // Lock horizontal direction, velocity, and facing while attacking mid-air
    } else if (p.onGround) {
      if (p.crouching) {
        // Crouch-Walking at crisp 75% walk speed for snappy stealth assassinations!
        if (moveDir !== 0 && !isAttacking) {
          p.facing = moveDir > 0 ? 1 : -1;
          p.vx = moveDir * effectiveMoveSpeed * 0.75;
        } else {
          p.vx = 0;
        }
      } else if (moveDir !== 0) {
        if (!isAttacking) {
          p.facing = moveDir > 0 ? 1 : -1;
        }
        p.vx = moveDir * effectiveMoveSpeed;
      } else {
        p.vx = 0;
      }
    } else {
      if (moveDir !== 0 && !isAttacking && tuning.airTurnFacing) {
        p.facing = moveDir > 0 ? 1 : -1;
      }

      const maxAirSpeed = effectiveMoveSpeed * tuning.airMaxSpeedMult;
      const controlNorm = Math.max(0, Math.min(1, tuning.airControl / 100));

      if (moveDir !== 0 && controlNorm > 0) {
        const targetVx = moveDir * maxAirSpeed;
        if (controlNorm >= 0.9) {
          p.vx = targetVx;
        } else {
          const accel = (460 + controlNorm * 2800) * dt;
          if (p.vx < targetVx) {
            p.vx = Math.min(targetVx, p.vx + accel);
          } else if (p.vx > targetVx) {
            p.vx = Math.max(targetVx, p.vx - accel);
          }
        }
      } else if (moveDir === 0 && tuning.airDrag > 0) {
        const dragNorm = Math.max(0, Math.min(1, tuning.airDrag / 100));
        if (dragNorm >= 0.92) {
          p.vx = 0;
        } else {
          const decel = (240 + dragNorm * 2200) * dt;
          if (Math.abs(p.vx) <= decel) {
            p.vx = 0;
          } else {
            p.vx -= Math.sign(p.vx) * decel;
          }
        }
      }
    }

    if (monkCharging) {
      p.vx *= 0.3;
    }
    if (p.wizardFloatTimer > 0 && !p.onGround) {
      const ctW = this.charTune('wizard');
      const floatSpeed = effectiveMoveSpeed * Math.max(0.2, ctW.wizardFloatMoveSpeed);
      if (moveDir !== 0) {
        if (!isAttacking && tuning.airTurnFacing) {
          p.facing = moveDir > 0 ? 1 : -1;
        }
        p.vx = moveDir * floatSpeed;
      } else {
        p.vx *= Math.pow(0.12, dt);
      }
      // Gentle bob; no net drop until the float ends.
      p.vy = Math.sin(p.animTime * 7) * 16;
      if (Math.random() < 0.55) {
        const el = this.getWizardElement();
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 22 * scale,
          y: p.y - 2 - Math.random() * 6,
          vx: (Math.random() - 0.5) * 20,
          vy: 8 + Math.random() * 18,
          size: 2.2,
          color: Math.random() < 0.5 ? el.c1 : '#e0e7ff',
          life: 0.4,
          maxLife: 0.4,
          kind: 'energy_wisp',
          rotation: p.animTime,
        });
      }
    }

    if (p.onGround) {
      p.coyoteTimer = tuning.coyoteTimeMs / 1000;
      p.airJumpsRemaining = maxHeroAirJumps;
      p.airBackdashUsed = false;
      p.jumpCutApplied = false;
      p.wallClingDir = 0;
      p.wizardFloatUsed = false;
      p.wizardFloatTimer = 0;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
      if (p.airJumpsRemaining > maxHeroAirJumps) {
        p.airJumpsRemaining = maxHeroAirJumps;
      }
      if (p.monkChargeTimer > 0 && p.vy >= 0) {
        // Walked off a ledge while charging — cancel, do not auto-jump.
        p.monkChargeTimer = 0;
        p.monkCharge = 0;
      }
    }

    // Down + Jump, or a mobile deep-stick-down: drop through soft one-way platforms (bridge, timber, rafter)!
    let dropThrough = false;
    const wantDrop =
      p.onGround &&
      (input.dropJustPressed || (input.down && (input.jumpJustPressed || p.jumpBufferTimer > 0)));
    if (wantDrop) {
      const standingOnOneWay = this.platforms.some(
        (plat) =>
          plat.oneWay &&
          Math.abs(p.y - plat.y) <= 8 &&
          p.x + (p.baseW * scale) / 2 > plat.x + 2 &&
          p.x - (p.baseW * scale) / 2 < plat.x + plat.w - 2
      );
      if (standingOnOneWay) {
        dropThrough = true;
        p.dropThroughTimer = 0.24;
        p.y += 10;
        p.vy = Math.max(p.vy, 95);
        p.onGround = false;
        p.crouching = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
      }
    }

    // Jump, Wall Jump (Ronin), & Double Jump (Hunter) — responsive jump-cancel out of recovery!
    // Monk: hold jump on the ground to charge a high leap; release to jump (short tap = normal).
    // Wizard: a second jump in the air starts a 2s hover (once per airtime).
    const jumpLocked = isAttacking && p.attackState !== 'recovery' && tuning.jumpLockWhenAttacking;
    const ctMonk = this.charTune('monk');
    const chargeTime = Math.max(0.12, ctMonk.monkChargeTime);
    const didMonkChargeJump = this.updateMonkChargeJump(
      dt,
      input,
      tuning,
      effectiveJumpForce,
      dropThrough,
      jumpLocked,
      chargeTime
    );
    if (!dropThrough && !jumpLocked && p.jumpBufferTimer > 0 && !didMonkChargeJump) {
      if (p.wallClingDir !== 0 && cDef.canWallCling) {
        // Mega Man X Wall Kick Jump!
        const kickDir = (-p.wallClingDir) as 1 | -1;
        p.vy = -effectiveJumpForce * 0.98;
        p.vx = kickDir * effectiveMoveSpeed * 1.18;
        p.facing = kickDir;
        p.wallClingDir = 0;
        p.wallJumpLockTimer = 0.13;
        p.crouching = false;
        p.jumpBufferTimer = 0;
        p.jumpCutApplied = false;
        if (p.attackState === 'recovery') p.attackState = 'idle';
        sound.playJump();
        this.spawnSparkles(p.x - kickDir * 10, p.y - p.baseH * scale * 0.5, 8, '#f43f5e', '#ffffff', 0.85);
      } else if (p.coyoteTimer > 0) {
        p.vy = -effectiveJumpForce;
        p.onGround = false;
        p.crouching = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.jumpCutApplied = false;
        if (p.attackState === 'recovery') p.attackState = 'idle';
        sound.playJump();
        for (let i = 0; i < 4; i++) {
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 14,
            y: p.y - 2,
            vx: (Math.random() - 0.5) * 60,
            vy: -15 - Math.random() * 25,
            size: 3,
            color: '#7a8296',
            life: 0.22,
            maxLife: 0.22,
            kind: 'dust',
            rotation: 0,
          });
        }
      } else if (p.airJumpsRemaining > 0) {
        // Vampire Hunter crisp Double Jump!
        p.airJumpsRemaining -= 1;
        p.vy = -effectiveJumpForce * 0.94;
        p.crouching = false;
        p.jumpBufferTimer = 0;
        p.jumpCutApplied = false;
        if (p.attackState === 'recovery') p.attackState = 'idle';
        if (moveDir !== 0 && tuning.airControl > 0 && !lockAirDirection) {
          p.vx = moveDir * effectiveMoveSpeed * tuning.airMaxSpeedMult;
          if (tuning.airTurnFacing && !isAttacking) {
            p.facing = moveDir > 0 ? 1 : -1;
          }
        }
        sound.playJump();
        this.spawnSparkles(p.x, p.y - 2, 7, '#cbd5e1', '#93c5fd', 0.65);
      } else if (this.tryStartWizardFloat(tuning)) {
        p.jumpBufferTimer = 0;
        p.jumpCutApplied = true;
        if (p.attackState === 'recovery') p.attackState = 'idle';
      } else if (this.tryStartShadowBlink(tuning)) {
        p.jumpBufferTimer = 0;
        p.jumpCutApplied = true;
        if (p.attackState === 'recovery') p.attackState = 'idle';
      } else if (p.characterId === 'assassin' && p.assassinBlinkUsed) {
        // Consume the press so a jump after the blink does not fire when he lands.
        p.jumpBufferTimer = 0;
      } else if (p.characterId === 'wizard' && (p.wizardFloatUsed || p.wizardFloatTimer > 0)) {
        // Consume the press so a jump during the float does not fire when he lands.
        p.jumpBufferTimer = 0;
      }
    }

    // Variable jump height cut (skipped during a Monk charged jump or Wizard float)
    if (
      !input.jumpHeld &&
      p.vy < -140 &&
      !p.jumpCutApplied &&
      !p.isAirKnockback &&
      p.wizardFloatTimer <= 0 &&
      tuning.jumpCutMultiplier < 0.99
    ) {
      p.vy *= tuning.jumpCutMultiplier;
      p.jumpCutApplied = true;
    }

    this.applyPlayerPhysics(dt, tuning, dropThrough || p.dropThroughTimer > 0);

    // Universal Ledge Grab & Pull-Up check (ALL 3 Heroes!)
    if (
      !p.onGround &&
      !input.down &&
      p.ledgeCooldown <= 0 &&
      p.dropThroughTimer <= 0 &&
      p.vy >= -150 &&
      p.attackState === 'idle' &&
      !dropThrough
    ) {
      if (this.tryStartLedgePullUp(moveDir, tuning)) {
        return;
      }
    }

    // Ronin Mega Man X-style Wall Cling & Slow Wall Slide!
    if (cDef.canWallCling && !p.onGround && !p.ledgeGrabActive && p.wallJumpLockTimer <= 0) {
      const halfW = (p.baseW * scale) / 2;
      const h = p.baseH * scale;
      let clung: -1 | 0 | 1 = 0;
      for (const plat of this.platforms) {
        if (plat.oneWay || plat.h < 34) continue;
        // Ensure vertical overlap with wall face
        const vertOverlap = p.y - 8 > plat.y && p.y - h + 8 < plat.y + plat.h;
        if (!vertOverlap) continue;
        const touchingRightWall = Math.abs(p.x + halfW - plat.x) <= 5;
        const touchingLeftWall = Math.abs(p.x - halfW - (plat.x + plat.w)) <= 5;

        if (touchingRightWall && (moveDir > 0 || (p.wallClingDir === 1 && p.vy > 0))) {
          clung = 1;
          p.x = plat.x - halfW;
          break;
        }
        if (touchingLeftWall && (moveDir < 0 || (p.wallClingDir === -1 && p.vy > 0))) {
          clung = -1;
          p.x = plat.x + plat.w + halfW;
          break;
        }
      }
      p.wallClingDir = clung;
      if (clung !== 0) {
        p.facing = clung;
        if (p.vy > 105) {
          p.vy = 105;
        }
        if (Math.random() < 0.28) {
          this.particles.push({
            x: p.x + clung * halfW,
            y: p.y - h * 0.4,
            vx: -clung * (18 + Math.random() * 25),
            vy: -15 - Math.random() * 20,
            size: 2.5,
            color: '#cbd5e1',
            life: 0.18,
            maxLife: 0.18,
            kind: 'dust',
            rotation: 0,
          });
        }
      }
    } else {
      p.wallClingDir = 0;
    }

    // Update Hiding Spot stealth status
    const inSpot = this.currentStage.hidingSpots.some(
      (spot) =>
        p.x >= spot.x + 8 &&
        p.x <= spot.x + spot.w - 8 &&
        p.y <= spot.y + 8 &&
        p.y >= spot.y - spot.h + 10
    );
    p.isHidden =
      inSpot &&
      p.attackState === 'idle' &&
      p.dashAttackTimer <= 0 &&
      p.rapierLungeTimer <= 0 &&
      p.monkDashTimer <= 0 &&
      p.axeSpinTimer <= 0 &&
      p.naginataVaultTimer <= 0 &&
      p.hammerLeapState === 'none' &&
      !p.grapple.active &&
      p.hitStunTimer <= 0;

    if (p.isHidden) {
      p.ambushTimer = 0.45;
    } else if (p.ambushTimer > 0) {
      p.ambushTimer = Math.max(0, p.ambushTimer - dt);
    }

    // Pitfall safety
    if (p.y > this.currentStage.worldHeight + 80) {
      this.damagePlayer(1, p.x, false, tuning);
      if (this.status === 'PLAYING') {
        const safePlat = this.findNearestSafePlatform(p.x);
        p.x = Math.max(safePlat.x + 36, Math.min(safePlat.x + safePlat.w - 36, p.x - 90));
        p.y = safePlat.y;
        p.vx = 0;
        p.vy = 0;
        p.onGround = true;
        p.hitStunTimer = 0.15;
      }
    }
  }

  private tryStartLedgePullUp(moveDir: number, tuning: TuningConfig): boolean {
    const p = this.player;
    const scale = tuning.playerScale;
    const halfW = (p.baseW * scale) / 2;
    const h = p.baseH * scale;
    const handsY = p.y - h * 0.78;

    for (const plat of this.platforms) {
      if (plat.id === 'wall-left' || plat.id === 'wall-right') continue;
      // Hands near the top lip of the platform (just below or level with plat.y)
      if (handsY < plat.y - 12 || handsY > plat.y + 26) continue;
      // Don't pull up if feet are already above platform top
      if (p.y <= plat.y + 8) continue;

      // Left corner of platform (player on left side moving right or facing right)
      const nearLeftCorner =
        p.x + halfW >= plat.x - 10 &&
        p.x + halfW <= plat.x + 14 &&
        (moveDir > 0 || p.facing === 1);
      if (nearLeftCorner) {
        p.ledgeGrabActive = true;
        p.ledgeGrabTimer = 0;
        p.ledgeGrabDuration = 0.16;
        p.ledgeStartX = p.x;
        p.ledgeStartY = p.y;
        p.ledgeTargetX = plat.x + Math.min(halfW + 10, plat.w * 0.5);
        p.ledgeTargetY = plat.y;
        p.facing = 1;
        p.wallClingDir = 0;
        sound.playJump();
        this.spawnSparkles(plat.x + 2, plat.y, 5, '#cbd5e1', '#e5a93c', 0.5);
        return true;
      }

      // Right corner of platform (player on right side moving left or facing left)
      const nearRightCorner =
        p.x - halfW <= plat.x + plat.w + 10 &&
        p.x - halfW >= plat.x + plat.w - 14 &&
        (moveDir < 0 || p.facing === -1);
      if (nearRightCorner) {
        p.ledgeGrabActive = true;
        p.ledgeGrabTimer = 0;
        p.ledgeGrabDuration = 0.16;
        p.ledgeStartX = p.x;
        p.ledgeStartY = p.y;
        p.ledgeTargetX = plat.x + plat.w - Math.min(halfW + 10, plat.w * 0.5);
        p.ledgeTargetY = plat.y;
        p.facing = -1;
        p.wallClingDir = 0;
        sound.playJump();
        this.spawnSparkles(plat.x + plat.w - 2, plat.y, 5, '#cbd5e1', '#e5a93c', 0.5);
        return true;
      }
    }
    return false;
  }

  private releaseKatanaMegaSlash(tuning: TuningConfig): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const weaponLv = 1 + p.weaponDamageBonus;
    const flatBonus = this.getWeaponFlatBonus(weaponLv);

    p.katanaMegaSlashTimer = p.katanaMegaSlashMax;
    p.katanaMegaHitIds.clear();
    p.invulnTimer = Math.max(p.invulnTimer, 0.22);

    sound.playSwordSlash();
    sound.playCrit();
    this.triggerShake(Math.max(8, tuning.critShakeIntensity * 0.9), 0.22);

    const cx = p.x + p.facing * 42 * scale;
    const cy = p.y - h * 0.56;
    this.spawnSparkles(cx, cy, 24, '#f43f5e', '#ffd166', 1.45);
    this.shockwaves.push({
      x: cx,
      y: cy,
      radius: 18,
      maxRadius: tuning.attackRange * scale * 1.65,
      color: '#f43f5e',
      life: 0.24,
      maxLife: 0.24,
    });

    // Tier 3+ Skill Evolution: launches a blazing Crimson Katana Gale Arc projectile!
    if (weaponLv >= 3) {
      this.projectiles.push({
        id: this.nextProjectileId++,
        x: p.x + p.facing * 36 * scale,
        y: cy,
        vx: p.facing * 520,
        vy: 0,
        radius: 26 + flatBonus * 4,
        fromEnemy: false,
        damage: 3 + flatBonus,
        life: 0.95,
        rotation: 0,
        kind: 'katana_wave',
        slotLevel: weaponLv,
      });
    }
    if (evoCombatTier(p, tuning) >= 3) {
      this.projectiles.push({
        id: this.nextProjectileId++,
        x: p.x + p.facing * 36 * scale,
        y: cy - 22 * scale,
        vx: p.facing * 480,
        vy: -40,
        radius: 22 + flatBonus * 3,
        fromEnemy: false,
        damage: 2 + flatBonus,
        life: 0.9,
        rotation: 0,
        kind: 'katana_wave',
        slotLevel: weaponLv,
      });
    }
  }

  private triggerWeaponSkill(tuning: TuningConfig): boolean {
    const p = this.player;
    const scale = tuning.playerScale;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const wDef = WEAPONS[p.weapon];
    const weaponLv = 1 + p.weaponDamageBonus;
    const evoTier = this.getWeaponEvoTier();
    const flatBonus = this.getWeaponFlatBonus(weaponLv);

    // Weapon skill cancels attack startup/recovery for crisp responsiveness
    p.attackState = 'idle';
    p.attackTimer = 0;

    switch (p.weapon) {
      case 'whip': {
        // Whip Weapon Skill: Backdash (Every 5 upgrades expands Explosive Parting Shock Snap!)
        const canBackdash = p.onGround || (tuning.allowAirBackdash && !p.airBackdashUsed);
        if (!canBackdash) return false;
        p.backdashTimer = this.charTune().backdashSec + Math.min(0.1, evoTier * 0.03);
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.invulnTimer = Math.max(p.invulnTimer, 0.24 + evoTier * 0.06);
        p.crouching = false;
        if (!p.onGround) {
          p.airBackdashUsed = true;
          p.vy = 0;
        }
        // Parting Shock Snap scales dramatically at 5+ and 10+ upgrades!
        if (weaponLv >= 3 || evoTier >= 1) {
          const snapX = p.x + p.facing * 26 * scale;
          const snapY = p.y - h * 0.5;
          const snapR = 98 + evoTier * 44;
          const ringColor = evoTier >= 2 ? '#c084fc' : evoTier >= 1 ? '#fde047' : '#e5a93c';
          this.shockwaves.push({
            x: snapX,
            y: snapY,
            radius: 10,
            maxRadius: snapR,
            color: ringColor,
            life: 0.24 + evoTier * 0.05,
            maxLife: 0.24 + evoTier * 0.05,
          });
          if (evoTier >= 1) {
            this.shockwaves.push({
              x: snapX,
              y: snapY,
              radius: 8,
              maxRadius: snapR * 0.65,
              color: '#ffffff',
              life: 0.2,
              maxLife: 0.2,
            });
          }
          this.spawnSparkles(snapX, snapY, 16 + evoTier * 10, ringColor, '#ffffff', 1.15 + evoTier * 0.25);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
            if (Math.hypot(enemy.x - snapX, ey - snapY) <= snapR) {
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
            }
          }
        }
        this.afterimageAccum = 0;
        sound.playBackdash(evoTier);
        return true;
      }

      case 'sword': {
        // Sword Weapon Skill: Crescent Blade Wave (Evo I = Twin Cross-Waves, Evo II+ = Triple Fan!)
        p.weaponSkillCooldown = wDef.skillCooldown;
        const waveR = 20 + evoTier * 7 + Math.min(10, flatBonus * 2);
        const offsets =
          evoTier >= 2
            ? [-22 * scale, 0, 22 * scale]
            : evoTier >= 1 || weaponLv >= 3
              ? [-16 * scale, 14 * scale]
              : [0];
        for (const dy of offsets) {
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 22 * scale,
            y: p.y - h * 0.55 + dy,
            vx: p.facing * (485 + evoTier * 70 + Math.min(90, flatBonus * 12)),
            vy: evoTier >= 2 ? dy * 1.4 : 0,
            radius: waveR,
            fromEnemy: false,
            damage: 2 + flatBonus,
            life: 0.95 + evoTier * 0.15,
            rotation: 0,
            kind: 'sword_wave',
            slotLevel: weaponLv,
          });
        }
        sound.playSwordSlash(evoTier);
        this.spawnSparkles(
          p.x + p.facing * 22 * scale,
          p.y - h * 0.55,
          10 + evoTier * 8,
          evoTier >= 2 ? '#fde047' : '#93c5fd',
          '#ffffff',
          0.95 + evoTier * 0.25
        );
        return false;
      }

      case 'katana': {
        // Katana Weapon Skill: Brief Iaido Charge -> HUGE Wide Crimson Slash!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.katanaChargeMax = Math.max(0.22, 0.34 - evoTier * 0.04);
        p.katanaChargeTimer = p.katanaChargeMax;
        p.crouching = false;
        sound.playHammerCharge();
        this.spawnSparkles(p.x, p.y - h * 0.52, 10 + evoTier * 8, '#f43f5e', '#ffd166', 0.85 + evoTier * 0.25);
        return true;
      }

      case 'hammer': {
        // Hammer Weapon Skill: METEOR SLAM — Big Leap Upward -> Plunge -> MASSIVE Area Damage!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.hammerLeapState = 'rising';
        p.hammerLeapTimer = 0.26;
        p.vy = -660 - evoTier * 30;
        p.vx = p.facing * (265 + evoTier * 20);
        p.onGround = false;
        p.crouching = false;
        p.invulnTimer = Math.max(p.invulnTimer, 0.75 + evoTier * 0.1);
        this.afterimageAccum = 0;
        sound.playJump();
        sound.playHammerCharge();
        this.spawnSparkles(p.x, p.y - 6, 16 + evoTier * 10, '#fbbf24', '#f97316', 1.2 + evoTier * 0.25);
        return true;
      }

      case 'rapier': {
        // Crimson Rapier Weapon Skill: PHANTOM LUNGE — Blink-Pierce Through Enemies!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.rapierLungeTimer = 0.24 + evoTier * 0.04;
        p.rapierLungeHitIds.clear();
        p.invulnTimer = Math.max(p.invulnTimer, 0.32 + evoTier * 0.08);
        p.crouching = false;
        this.afterimageAccum = 0;
        sound.playBackdash(evoTier);
        sound.playRapierThrust(evoTier);
        this.spawnSparkles(p.x, p.y - h * 0.55, 14 + evoTier * 10, '#f43f5e', '#fff1f2', 1.2 + evoTier * 0.25);
        return true;
      }

      case 'greataxe': {
        // Obsidian Greataxe Weapon Skill: CYCLONE CLEAVE — Spinning Iron Tornado!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.axeSpinTimer = 0.52 + evoTier * 0.14;
        p.axeSpinTickTimer = 0.02;
        p.invulnTimer = Math.max(p.invulnTimer, 0.45 + evoTier * 0.12);
        p.crouching = false;
        sound.playGreataxeSwing(evoTier);
        this.spawnSparkles(p.x, p.y - h * 0.5, 16 + evoTier * 10, '#ea580c', '#fef08a', 1.25 + evoTier * 0.25);
        return true;
      }

      case 'naginata': {
        // Storm Naginata Weapon Skill: TEMPEST VAULT — Leaping Lightning Arc + Storm Wave!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.naginataVaultTimer = 0.34;
        p.naginataVaultHitIds.clear();
        p.vy = -445;
        p.vx = p.facing * 315;
        p.onGround = false;
        p.crouching = false;
        p.invulnTimer = Math.max(p.invulnTimer, 0.36 + evoTier * 0.08);
        this.afterimageAccum = 0;
        sound.playJump();
        sound.playNaginataSlash(evoTier);
        this.spawnSparkles(p.x, p.y - h * 0.5, 16 + evoTier * 10, '#38bdf8', '#e0f2fe', 1.25 + evoTier * 0.25);
        const offsets =
          evoTier >= 2
            ? [-24 * scale, 0, 24 * scale]
            : evoTier >= 1 || weaponLv >= 3
              ? [-16 * scale, 16 * scale]
              : [0];
        for (const dy of offsets) {
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 28 * scale,
            y: p.y - h * 0.58 + dy,
            vx: p.facing * (540 + evoTier * 65 + Math.min(90, flatBonus * 12)),
            vy: evoTier >= 2 ? dy * 1.2 : 0,
            radius: 22 + evoTier * 6 + Math.min(10, flatBonus * 2),
            fromEnemy: false,
            damage: 2 + flatBonus,
            life: 0.95 + evoTier * 0.15,
            rotation: 0,
            kind: 'storm_arc',
            slotLevel: weaponLv,
          });
        }
        return true;
      }

      case 'ash_wraps': {
        // Monk Weapon Skill [3]: PYRE DASH — long, wide, invulnerable power dash (8-way when enabled).
        const ct = this.charTune('monk');
        p.monkChargeTimer = 0;
        p.monkCharge = 0;
        const aim = this.readMonkDashAim(ct, p);
        p.monkDashDirX = aim.dirX;
        p.monkDashDirY = aim.dirY;
        p.monkDashSlam = aim.slam;
        if (aim.dirX !== 0) p.facing = aim.dirX > 0 ? 1 : -1;
        p.monkDashTimer = p.monkDashSlam
          ? Math.max(0.8, ct.monkDashSec * 3)
          : Math.max(0.08, ct.monkDashSec) * (1 + evoTier * 0.08);
        p.monkDashHitIds.clear();
        p.weaponSkillCooldown = ct.monkDashCooldown;
        p.invulnTimer = Math.max(p.invulnTimer, p.monkDashTimer + 0.14);
        p.crouching = false;
        p.monkComboStep = 0;
        p.monkComboTimer = 0;
        this.afterimageAccum = 0;
        sound.playMonkDash(evoTier);
        this.triggerShake(5 + evoTier * 2, 0.16);
        this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.025);
        this.shockwaves.push({
          x: p.x - p.facing * 10 * scale,
          y: p.y - h * 0.45,
          radius: 8,
          maxRadius: 70 + evoTier * 24,
          color: evoTier >= 2 ? '#fde68a' : evoTier >= 1 ? '#ea580c' : '#a8a29e',
          life: 0.22,
          maxLife: 0.22,
        });
        // Kick-off ash plume from the floor
        for (let i = 0; i < 14 + evoTier * 6; i++) {
          this.particles.push({
            x: p.x - p.facing * (6 + Math.random() * 20),
            y: p.y - Math.random() * 10,
            vx: -p.facing * (60 + Math.random() * 160),
            vy: -20 - Math.random() * 90,
            size: 3 + Math.random() * 3,
            color: Math.random() < 0.7 ? '#57534e' : '#a8a29e',
            life: 0.45,
            maxLife: 0.45,
            kind: 'dust',
            rotation: 0,
          });
        }
        return true;
      }

      case 'shadow_daggers': {
        // Assassin Weapon Skill [3]: MARK FOR DEATH — brand a foe from very far; press again to shadow-step and execute it.
        return this.castMarkForDeath(tuning);
      }

      case 'spire_staff': {
        // Wizard Weapon Skill [3]: REPULSION NOVA — radial force blast that hurls foes away.
        const ct = this.charTune('wizard');
        p.weaponSkillCooldown = ct.wizardNovaCooldown;
        this.executeWizardNova(tuning);
        return true;
      }

      case 'ribbon_whip':
      case 'silk_whip': {
        // Minstrel Weapon Skill: ENCORE WALTZ / CRESCENDO WALTZ!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.minstrelZipActive = false;
        p.minstrelVaultTimer = 0;
        p.minstrelDanceTimer = 0.72 + evoTier * 0.14;
        p.minstrelDanceTickTimer = 0.02;
        p.invulnTimer = Math.max(p.invulnTimer, 0.56 + evoTier * 0.14);
        p.crouching = false;
        p.vy = Math.min(p.vy, -120);
        sound.playWhip(evoTier);
        sound.playBuff(evoTier);
        this.spawnSparkles(p.x, p.y - h * 0.55, 18 + evoTier * 12, '#ec4899', '#fde047', 1.3 + evoTier * 0.25);
        this.spawnDamageNumber(
          p.x,
          p.y - h - 18,
          evoTier >= 2
            ? 'MYTHIC SYMPHONY!'
            : evoTier >= 1
              ? 'AWAKENED WALTZ!'
              : p.weapon === 'silk_whip'
                ? 'CRESCENDO WALTZ!'
                : 'ENCORE WALTZ!',
          '#f472b6',
          1.05 + evoTier * 0.1
        );
        return true;
      }

      case 'estoc_spear': {
        // Quick Thrust [3]: NEEDLE FLURRY — rapid piercing dash lunge
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.rapierLungeTimer = 0.22 + evoTier * 0.04;
        p.rapierLungeHitIds.clear();
        p.invulnTimer = Math.max(p.invulnTimer, 0.24);
        p.vx = p.facing * 640;
        sound.playRapierThrust(evoTier);
        this.spawnSparkles(p.x + p.facing * 26, p.y - h * 0.55, 14, '#e2e8f0', '#38bdf8', 1.1);
        this.spawnDamageNumber(p.x, p.y - h - 18, 'NEEDLE FLURRY!', '#e2e8f0', 1.0);
        return true;
      }

      case 'short_blade': {
        // Quick Small Slash [3]: RIPOSTE STEP — agile blink-slash behind foes
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.rapierLungeTimer = 0.18;
        p.rapierLungeHitIds.clear();
        p.invulnTimer = Math.max(p.invulnTimer, 0.30);
        p.vx = p.facing * 560;
        sound.playDaggerSlash(2, evoTier);
        this.spawnSparkles(p.x, p.y - h * 0.55, 14, '#94a3b8', '#f8fafc', 1.0);
        this.spawnDamageNumber(p.x, p.y - h - 18, 'RIPOSTE STEP!', '#cbd5e1', 1.0);
        return true;
      }

      case 'cleaver_greatsword': {
        // Slow Wide Charging Slash [3]: SUNDERING ARC — huge shockwave slash
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.axeSpinTimer = 0.44 + evoTier * 0.1;
        p.axeSpinTickTimer = 0.02;
        p.invulnTimer = Math.max(p.invulnTimer, 0.35);
        sound.playGreataxeSwing();
        this.triggerShake(7.5, 0.22);
        this.shockwaves.push({
          x: p.x + p.facing * 42,
          y: p.y - h * 0.5,
          radius: 14,
          maxRadius: 150,
          color: '#fb923c',
          life: 0.26,
          maxLife: 0.26,
        });
        this.spawnDamageNumber(p.x, p.y - h - 18, 'SUNDERING ARC!', '#fb923c', 1.08);
        return true;
      }

      case 'joust_lance': {
        // Slow Long Charging Thrust [3]: IMPERIAL CHARGE — unstoppable lance thrust forward
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.rapierLungeTimer = 0.32 + evoTier * 0.06;
        p.rapierLungeHitIds.clear();
        p.invulnTimer = Math.max(p.invulnTimer, 0.36);
        p.vx = p.facing * 720;
        sound.playNaginataSlash(evoTier);
        this.triggerShake(6.5, 0.2);
        this.spawnSparkles(p.x + p.facing * 36, p.y - h * 0.52, 18, '#facc15', '#fef08a', 1.25);
        this.spawnDamageNumber(p.x, p.y - h - 18, 'IMPERIAL CHARGE!', '#facc15', 1.08);
        return true;
      }

      case 'arcane_wand': {
        // Ranged Weapon [3]: ARCANE FAN — fires 3 spread elemental bolts!
        p.weaponSkillCooldown = wDef.skillCooldown;
        for (const vyOff of [-125, 0, 125]) {
          this.spawnWizardBolt(tuning);
          const last = this.projectiles[this.projectiles.length - 1];
          if (last) last.vy = vyOff;
        }
        this.spawnSparkles(p.x + p.facing * 26, p.y - h * 0.58, 16, '#818cf8', '#e0e7ff', 1.15);
        this.spawnDamageNumber(p.x, p.y - h - 18, 'ARCANE FAN!', '#a5b4fc', 1.05);
        return true;
      }

      case 'war_fans': {
        // Super Wide Short Quick Weapon [3]: GALE FLOURISH — close-range 360° whirlwind
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.minstrelDanceTimer = 0.54 + evoTier * 0.1;
        p.minstrelDanceTickTimer = 0.02;
        p.invulnTimer = Math.max(p.invulnTimer, 0.36);
        sound.playKatanaSlash(evoTier);
        this.shockwaves.push({
          x: p.x,
          y: p.y - h * 0.55,
          radius: 10,
          maxRadius: 96,
          color: '#2dd4bf',
          life: 0.22,
          maxLife: 0.22,
        });
        this.spawnDamageNumber(p.x, p.y - h - 18, 'GALE FLOURISH!', '#2dd4bf', 1.05);
        return true;
      }

      case 'meteor_flail': {
        // Slow Impact AoE Weapon [3]: CATACLYSM SMASH — massive leaping area detonation!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.hammerLeapState = 'rising';
        p.hammerLeapTimer = 0.26;
        p.vy = -520;
        p.vx = p.facing * 185;
        p.onGround = false;
        p.invulnTimer = Math.max(p.invulnTimer, 0.6);
        sound.playHammerCharge();
        this.spawnDamageNumber(p.x, p.y - h - 18, 'CATACLYSM SMASH!', '#ef4444', 1.12);
        return true;
      }

      case 'orbiting_grimoire': {
        // Orbiting Grimoire [3]: SHIFT ELEMENT — cycles Fire -> Glacial -> Storm -> Venom -> Shadow -> Light!
        const GRIM_CYCLE: BaseElementId[] = ['fire', 'glacial', 'storm', 'venom', 'shadow', 'light'];
        p.grimoireElementIndex = (p.grimoireElementIndex + 1) % GRIM_CYCLE.length;
        const nextEl = GRIM_CYCLE[p.grimoireElementIndex];
        const elDef = BASE_ELEMENTS[nextEl];
        p.grimoireOrbs = Math.min(3, p.grimoireOrbs + 1);
        p.weaponSkillCooldown = wDef.skillCooldown;
        sound.playBuff(evoTier);
        this.shockwaves.push({
          x: p.x,
          y: p.y - h * 0.55,
          radius: 10,
          maxRadius: 92,
          color: elDef.primaryColor,
          life: 0.24,
          maxLife: 0.24,
        });
        this.spawnSparkles(p.x, p.y - h * 0.55, 16, elDef.primaryColor, elDef.glowColor, 1.1);
        this.spawnDamageNumber(p.x, p.y - h - 18, `GRIMOIRE: ${elDef.name.toUpperCase()}!`, elDef.primaryColor, 1.05);
        return true;
      }

      case 'burst_crossbow': {
        // Dusk Ranger [3]: VAULT VOLLEY — evasive backflip + 5-bolt piercing fan!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.vx = -p.facing * 265;
        p.vy = -300;
        p.onGround = false;
        p.invulnTimer = Math.max(p.invulnTimer, 0.42);
        sound.playBackdash();
        sound.playDaggerSlash(2, evoTier);
        const wLv = 1 + p.weaponDamageBonus;
        const fanAngles = [-0.26, -0.13, 0, 0.13, 0.26];
        for (const a of fanAngles) {
          const spd = 650;
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 22 * scale,
            y: p.y - h * 0.58,
            vx: Math.cos(a) * spd * p.facing,
            vy: Math.sin(a) * spd,
            radius: 7,
            fromEnemy: false,
            damage: Math.max(2, wLv),
            life: 0.9,
            rotation: Math.atan2(Math.sin(a) * spd, Math.cos(a) * spd * p.facing),
            kind: 'crossbow_bolt',
            color: '#34d399',
            color2: '#d1fae5',
            pierce: true,
            hitIds: [],
            slotLevel: wLv,
          });
        }
        this.spawnSparkles(p.x + p.facing * 20, p.y - h * 0.56, 16, '#10b981', '#a7f3d0', 1.15);
        this.spawnDamageNumber(p.x, p.y - h - 18, 'VAULT VOLLEY!', '#34d399', 1.08);
        return true;
      }

      case 'shield_mace': {
        // Iron Vanguard [3]: BULWARK BASH — armored forward Tower-Shield charge smashing foes!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.vanguardBashTimer = 0.36 + evoTier * 0.05;
        p.vanguardBashHitIds.clear();
        p.shieldGuardActive = true;
        p.invulnTimer = Math.max(p.invulnTimer, 0.44);
        sound.playArmorBlock();
        this.triggerShake(6.5, 0.18);
        this.shockwaves.push({
          x: p.x + p.facing * 24,
          y: p.y - h * 0.54,
          radius: 10,
          maxRadius: 105,
          color: '#38bdf8',
          life: 0.22,
          maxLife: 0.22,
        });
        this.spawnDamageNumber(p.x, p.y - h - 18, 'BULWARK BASH!', '#38bdf8', 1.1);
        return true;
      }

      case 'kusarigama': {
        // Monk Chain-Sickle [3]: CHAIN TEMPEST — 360° chain whirl that yanks all nearby foes into melee & shreds them!
        p.weaponSkillCooldown = wDef.skillCooldown;
        p.invulnTimer = Math.max(p.invulnTimer, 0.34);
        const pullR = (235 + evoTier * 35) * scale;
        const wLv = 1 + p.weaponDamageBonus;
        sound.playWhip(evoTier);
        sound.playKatanaSlash(evoTier);
        this.triggerShake(6.5, 0.18);
        this.shockwaves.push({
          x: p.x,
          y: p.y - h * 0.55,
          radius: 16,
          maxRadius: pullR,
          color: '#f59e0b',
          life: 0.28,
          maxLife: 0.28,
        });
        this.spawnSparkles(p.x, p.y - h * 0.55, 22, '#f59e0b', '#fef08a', 1.25);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          const dist = Math.hypot(enemy.x - p.x, ey - (p.y - h * 0.55));
          if (dist <= pullR) {
            if (!enemy.isBoss) {
              // Yank enemy right toward the Monk!
              const dirToPlayer = p.x >= enemy.x ? 1 : -1;
              enemy.x += (p.x - enemy.x) * 0.52;
              enemy.vx = dirToPlayer * 240;
              enemy.vy = -125;
              enemy.onGround = false;
            }
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', wLv, {
              bonusDamage: 1,
              stun: 0.4,
              kbX: 0,
            });
          }
        }
        this.spawnDamageNumber(p.x, p.y - h - 18, 'CHAIN TEMPEST!', '#f59e0b', 1.1);
        return true;
      }

      case 'twin_chakram': {
        // Sun Blade-Dancer [3]: CHAKRAM WARP (if a chakram is airborne) OR RAZOR VORTEX trap!
        p.weaponSkillCooldown = wDef.skillCooldown;
        const activeChakrams = this.projectiles.filter((pr) => !pr.fromEnemy && pr.kind === 'chakram');
        const wLv = 1 + p.weaponDamageBonus;
        if (activeChakrams.length > 0) {
          // Warp directly to the farthest airborne Chakram in a golden slashing cyclone!
          let farthest = activeChakrams[0];
          let bestD = -1;
          for (const ch of activeChakrams) {
            const d = Math.hypot(ch.x - p.x, ch.y - p.y);
            if (d > bestD) {
              bestD = d;
              farthest = ch;
            }
          }
          this.spawnSparkles(p.x, p.y - h * 0.5, 16, '#fbbf24', '#ffffff', 1.1);
          p.x = Math.max(40, Math.min(this.currentStage.worldWidth - 40, farthest.x));
          p.y = Math.min(this.currentStage.floorY, farthest.y + h * 0.45);
          p.vy = -210;
          p.invulnTimer = Math.max(p.invulnTimer, 0.42);
          sound.playBackdash();
          sound.playKatanaSlash(evoTier);
          this.triggerShake(7, 0.18);
          this.shockwaves.push({
            x: p.x,
            y: p.y - h * 0.5,
            radius: 12,
            maxRadius: 128,
            color: '#fbbf24',
            life: 0.25,
            maxLife: 0.25,
          });
          this.spawnSparkles(p.x, p.y - h * 0.5, 24, '#fbbf24', '#fef08a', 1.35);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
            if (Math.hypot(enemy.x - p.x, ey - (p.y - h * 0.5)) <= 132) {
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', wLv + 1, { bonusDamage: 2, stun: 0.35 });
            }
          }
          this.spawnDamageNumber(p.x, p.y - h - 18, 'CHAKRAM WARP!', '#fbbf24', 1.12);
        } else {
          // Deploy a hovering Razor Vortex trap ahead that slices foes rapidly!
          const vxX = Math.max(40, Math.min(this.currentStage.worldWidth - 40, p.x + p.facing * 135 * scale));
          const vxY = p.y - h * 0.55;
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: vxX,
            y: vxY,
            vx: 0,
            vy: 0,
            radius: 44,
            fromEnemy: false,
            damage: Math.max(1, wLv),
            life: 2.6 + evoTier * 0.4,
            maxLife: 2.6 + evoTier * 0.4,
            rotation: 0,
            kind: 'chakram_vortex',
            color: '#fbbf24',
            color2: '#f59e0b',
            returnTimer: 0.05,
            slotLevel: wLv,
          });
          sound.playKatanaSlash(evoTier);
          this.spawnSparkles(vxX, vxY, 18, '#fbbf24', '#fef08a', 1.2);
          this.spawnDamageNumber(p.x, p.y - h - 18, 'RAZOR VORTEX!', '#fbbf24', 1.08);
        }
        return true;
      }

      case 'prism_lance': {
        // Prism Striker [3]: EVOLVING PRISM GLASS WALL BOX MACHINE!
        // Lv 1-4: 1 wall behind enemy | Lv 5-9: 2 opposing walls | Lv 10-14: 3 walls (+ceiling) | Lv 15+: Full 4-wall Box!
        p.weaponSkillCooldown = wDef.skillCooldown;
        this.glassWalls = [];
        let target: Enemy | null = null;
        let bestScore = Infinity;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dxE = e.x - p.x;
          const dyE = e.y - p.y;
          const d = Math.hypot(dxE, dyE);
          if (d > 480) continue;
          const inFront = dxE * p.facing >= -20 ? 0.65 : 1.35;
          if (d * inFront < bestScore) {
            bestScore = d * inFront;
            target = e;
          }
        }
        const dir = target ? (target.x >= p.x ? 1 : -1) : p.facing;
        const cx = target
          ? target.x
          : Math.max(120, Math.min(this.currentStage.worldWidth - 120, p.x + p.facing * 170));
        const baseFloorY = target ? target.y : p.y;
        const spanX = target?.isBoss ? 128 : 96;
        const wallH = target?.isBoss ? 225 : 185;
        const topY = Math.max(48, baseFloorY - wallH);
        const wallLife = 7.5 + evoTier * 1.2;

        // Wall 1 (Base): Tall Glass Wall directly BEHIND the enemy!
        const backX = Math.max(24, Math.min(this.currentStage.worldWidth - 38, cx + dir * spanX));
        this.glassWalls.push({
          id: this.nextGlassWallId++,
          x: backX,
          y: topY,
          w: 16,
          h: wallH + 12,
          orientation: 'vertical',
          life: wallLife,
          maxLife: wallLife,
          flashTimer: 0.35,
          color: '#22d3ee',
        });

        // Wall 2 (Evo Tier >= 1, Weapon Lv 5+): Front opposing Glass Wall (ping-pong corridor!)
        if (evoTier >= 1) {
          const frontX = Math.max(24, Math.min(this.currentStage.worldWidth - 38, cx - dir * spanX));
          this.glassWalls.push({
            id: this.nextGlassWallId++,
            x: frontX,
            y: topY,
            w: 16,
            h: wallH + 12,
            orientation: 'vertical',
            life: wallLife,
            maxLife: wallLife,
            flashTimer: 0.35,
            color: '#38bdf8',
          });
        }

        // Wall 3 (Evo Tier >= 2, Weapon Lv 10+): Overhead Ceiling Glass Slab!
        if (evoTier >= 2) {
          const leftX = Math.max(24, cx - spanX);
          this.glassWalls.push({
            id: this.nextGlassWallId++,
            x: leftX,
            y: topY,
            w: spanX * 2 + 16,
            h: 16,
            orientation: 'horizontal',
            life: wallLife,
            maxLife: wallLife,
            flashTimer: 0.35,
            color: '#a78bfa',
          });
        }

        // Wall 4 (Evo Tier >= 3, Weapon Lv 15+): Reinforced Floor Glass Prism — FULL BOUNCE BOX MACHINE!
        if (evoTier >= 3) {
          const leftX = Math.max(24, cx - spanX);
          this.glassWalls.push({
            id: this.nextGlassWallId++,
            x: leftX,
            y: baseFloorY + 2,
            w: spanX * 2 + 16,
            h: 16,
            orientation: 'horizontal',
            life: wallLife,
            maxLife: wallLife,
            flashTimer: 0.35,
            color: '#f472b6',
          });
        }

        sound.playParry(false);
        this.triggerShake(5.5, 0.14);
        this.spawnSparkles(backX + 8, topY + wallH * 0.5, 20, '#22d3ee', '#ffffff', 1.25);
        const wallMsg =
          evoTier >= 3
            ? 'PRISM BOX MACHINE!'
            : evoTier === 2
              ? '3-WALL PRISM CAGE!'
              : evoTier === 1
                ? 'TWIN GLASS WALLS!'
                : 'GLASS WALL!';
        this.spawnDamageNumber(cx, topY - 14, wallMsg, '#67e8f9', 1.15);
        return true;
      }

      case 'solar_glaive': {
        // Blade-Dancer [3]: SUNBURST SPIN-DASH — invulnerable spinning golden dash-slash + burning sun ring + air jump reset!
        p.weaponSkillCooldown = wDef.skillCooldown;
        const wLv = 1 + p.weaponDamageBonus;
        const dashDist = (175 + evoTier * 36) * scale;
        const startX = p.x;
        const endX = Math.max(40, Math.min(this.currentStage.worldWidth - 40, p.x + p.facing * dashDist));
        const midY = p.y - h * 0.52;
        this.spawnSparkles(startX, midY, 16, '#fbbf24', '#f97316', 1.2);
        p.x = endX;
        p.vx = p.facing * 260;
        p.vy = -195;
        p.invulnTimer = Math.max(p.invulnTimer, 0.48);
        p.airJumpsRemaining = Math.max(p.airJumpsRemaining, this.cdef(p.characterId).airJumps);
        sound.playBackdash(evoTier);
        sound.playNaginataSlash(evoTier);
        this.triggerShake(6.5, 0.18);
        this.shockwaves.push({
          x: endX,
          y: midY,
          radius: 14,
          maxRadius: 122 + evoTier * 22,
          color: '#f97316',
          life: 0.28,
          maxLife: 0.28,
        });
        this.spawnSparkles(endX, midY, 24, '#fbbf24', '#fef08a', 1.35);
        const minX = Math.min(startX, endX) - 42;
        const maxX = Math.max(startX, endX) + 42;
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (enemy.x >= minX && enemy.x <= maxX && Math.abs(ey - midY) <= 105) {
            enemy.burnTimer = Math.max(enemy.burnTimer ?? 0, 3.2);
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', wLv + 1, {
              bonusDamage: 1 + evoTier,
              stun: 0.35,
              dirX: p.facing,
            });
          }
        }
        this.spawnDamageNumber(endX, p.y - h - 18, 'SUNBURST SPIN!', '#fb923c', 1.12);
        return true;
      }

      case 'prism_gauntlets': {
        // Prism Striker [3]: RICOCHET NOVA SLAM — launches 4 X-cross prism bolts + upward vault + prism shockwave!
        p.weaponSkillCooldown = wDef.skillCooldown;
        const wLv = 1 + p.weaponDamageBonus;
        const cx = p.x;
        const cy = p.y - h * 0.52;
        p.vy = -380;
        p.onGround = false;
        p.invulnTimer = Math.max(p.invulnTimer, 0.35);
        const angles = [-Math.PI * 0.78, -Math.PI * 0.22, Math.PI * 0.22, Math.PI * 0.78];
        for (const ang of angles) {
          const spd = 560 + evoTier * 55;
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: cx,
            y: cy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: 10,
            fromEnemy: false,
            damage: Math.max(2, wLv + evoTier),
            life: 0.85 + evoTier * 0.15,
            rotation: ang,
            kind: 'crossbow_bolt',
            color: '#e879f9',
            color2: '#67e8f9',
            pierce: true,
            hitIds: [],
            slotLevel: wLv,
          });
        }
        sound.playParry(false);
        sound.playHammerBoom();
        this.triggerShake(7, 0.2);
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: 12,
          maxRadius: 130 + evoTier * 24,
          color: '#e879f9',
          life: 0.28,
          maxLife: 0.28,
        });
        this.spawnSparkles(cx, cy, 26, '#e879f9', '#67e8f9', 1.35);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cx, ey - cy) <= 135 + evoTier * 24) {
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', wLv + 1, {
              bonusDamage: 1,
              kbX: 310,
              kbY: 220,
              stun: 0.45,
              dirX: enemy.x >= cx ? 1 : -1,
            });
          }
        }
        this.spawnDamageNumber(cx, p.y - h - 18, 'RICOCHET NOVA!', '#e879f9', 1.14);
        return true;
      }
    }
  }

  private findMinstrelWhipAnchor(
    input: InputState,
    tuning: TuningConfig,
    excludePrev: boolean
  ): { x: number; y: number } | null {
    const p = this.player;
    const scale = tuning.playerScale;
    const isSilk = p.weapon === 'silk_whip';
    const maxRange = (isSilk ? 400 : 345) * scale;
    const ox = p.x;
    const oy = p.y - p.baseH * scale * 0.56;

    // 8-way directional aiming: player directionals decisively guide where the whip hooks!
    const rawX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const rawY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const hasExplicitDir = rawX !== 0 || rawY !== 0;

    let aimX = rawX;
    let aimY = rawY;
    if (!hasExplicitDir) {
      aimX = p.facing * 0.92;
      aimY = -0.38;
    } else {
      const len = Math.hypot(aimX, aimY) || 1;
      aimX /= len;
      aimY /= len;
    }

    let bestFound = false;
    let bestX = 0;
    let bestY = 0;
    let bestScore = -Infinity;

    const consider = (ax: number, ay: number, bonus = 0) => {
      const dx = ax - ox;
      const dy = ay - oy;
      const dist = Math.hypot(dx, dy);
      if (dist < 44 || dist > maxRange) return;
      if (excludePrev && Math.hypot(ax - p.minstrelZipX, ay - p.minstrelZipY) < 64) return;
      const dot = (dx * aimX + dy * aimY) / dist;
      const minDot = hasExplicitDir ? 0.25 : 0.05;
      if (dot < minDot) return;
      const score = dot * 320 + bonus - Math.abs(dist - 195) * 0.28;
      if (!bestFound || score > bestScore) {
        bestFound = true;
        bestX = ax;
        bestY = ay;
        bestScore = score;
      }
    };

    // 1. Hanging Braziers (whip-latching snaps them onto enemies below!)
    for (const b of this.hangingBraziers) {
      if (b.state === 'hanging') {
        consider(b.x, b.y - 8, 85);
      }
    }

    // 2. All intact platforms — INCLUDING main floor surfaces, rafters, bridges, pillars & walls!
    for (const plat of this.platforms) {
      if (!this.isPlatformSolid(plat)) continue;

      if (plat.id === 'wall-left' || plat.id === 'wall-right') {
        const wx = plat.id === 'wall-left' ? 10 : this.currentStage.worldWidth - 10;
        consider(wx, oy + aimY * 140, 26);
        consider(wx, oy - 55, 16);
        continue;
      }

      const isFloor =
        plat.style === 'stone' ||
        plat.style === 'boss_floor' ||
        plat.style === 'camp_ground' ||
        plat.style === 'crypt_slab' ||
        plat.style === 'obsidian';

      // Project aimed ray onto platform top surface so floor grabs & diagonal zips land right where aimed!
      if (Math.abs(aimY) > 0.12) {
        const t = (plat.y + 3 - oy) / aimY;
        if (t > 44 && t <= maxRange) {
          const hitX = ox + aimX * t;
          if (hitX >= plat.x + 8 && hitX <= plat.x + plat.w - 8) {
            consider(hitX, plat.y + 3, isFloor ? 48 : plat.style === 'rafter' ? 75 : 58);
          }
        }
      }

      // Forward/aimed horizontal floor-skimming & platform lip sampling
      const sampleDist = isFloor ? 210 : 165;
      const aimProbeX = ox + (Math.abs(aimX) > 0.1 ? Math.sign(aimX) : p.facing) * sampleDist;
      const clampedX = Math.max(plat.x + 14, Math.min(plat.x + plat.w - 14, aimProbeX));
      const styleBonus = isFloor
        ? rawY > 0 || !p.onGround
          ? 52
          : 28
        : plat.style === 'rafter'
          ? 70
          : 50;

      consider(clampedX, plat.y + 4, styleBonus);
      if (isFloor) {
        // Extra floor grab points near/far so Minstrel can dash-zip across the floor reliably
        const nearX = Math.max(
          plat.x + 14,
          Math.min(plat.x + plat.w - 14, ox + (Math.abs(aimX) > 0.1 ? Math.sign(aimX) : p.facing) * 145)
        );
        const farX = Math.max(
          plat.x + 14,
          Math.min(plat.x + plat.w - 14, ox + (Math.abs(aimX) > 0.1 ? Math.sign(aimX) : p.facing) * 275)
        );
        consider(nearX, plat.y + 4, styleBonus - 4);
        consider(farX, plat.y + 4, styleBonus - 2);
      } else {
        consider(plat.x + 16, plat.y + 4, styleBonus - 8);
        consider(plat.x + plat.w - 16, plat.y + 4, styleBonus - 8);
      }

      // Solid pillar vertical sides
      if (!plat.oneWay && plat.h >= 60 && !isFloor) {
        const sideX = dxSide(ox, plat);
        consider(sideX, Math.max(plat.y + 18, Math.min(plat.y + plat.h - 24, oy + aimY * 90)), 42);
      }
    }

    if (bestFound) {
      return { x: bestX, y: bestY };
    }
    return null;
  }

  private tryStartMinstrelWhipZip(
    input: InputState,
    tuning: TuningConfig,
    excludePrev: boolean
  ): boolean {
    const p = this.player;
    const anchor = this.findMinstrelWhipAnchor(input, tuning, excludePrev);
    if (!anchor) return false;

    p.minstrelZipActive = true;
    p.minstrelZipX = anchor.x;
    p.minstrelZipY = anchor.y;
    p.minstrelZipTimer = this.charTune('minstrel').zipDurationSec;
    p.minstrelZipHitIds.clear();
    p.minstrelVaultTimer = 0;
    p.attackState = 'idle';
    p.crouching = false;
    p.onGround = false;
    p.facing = anchor.x >= p.x ? 1 : -1;
    p.invulnTimer = Math.max(p.invulnTimer, 0.24);
    this.afterimageAccum = 0;

    // If latching onto a Hanging Brazier, snap its chain immediately!
    for (const b of this.hangingBraziers) {
      if (b.state === 'hanging' && Math.hypot(anchor.x - b.x, anchor.y - b.y) < 40) {
        this.snapHangingBrazier(b);
      }
    }

    sound.playWhip();
    sound.playGrapple();
    sound.playSlowMoPulse();
    this.spawnSparkles(anchor.x, anchor.y, 14, '#ec4899', '#fef08a', 1.05);
    return true;
  }

  private updateMinstrelZip(dt: number, input: InputState, tuning: TuningConfig): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const weaponLv = 1 + p.weaponDamageBonus;

    // 100% INVULNERABLE while in whip-zip slow-motion!
    p.invulnTimer = Math.max(p.invulnTimer, 0.16);
    p.minstrelZipTimer -= dt;

    // Exit 1: Press [3] (Special Ability) -> Encore Waltz dance!
    if (input.backdashJustPressed && p.weaponSkillCooldown <= 0) {
      p.minstrelZipActive = false;
      this.triggerWeaponSkill(tuning);
      return;
    }

    // Exit 2: Press [2] / Space (Jump) -> Throw herself forward-upward! Hits deal dmg & bounce back!
    if (input.jumpJustPressed) {
      const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (moveDir !== 0) p.facing = moveDir > 0 ? 1 : -1;
      p.minstrelZipActive = false;
      p.minstrelVaultTimer = 0.54;
      p.minstrelVaultHitIds.clear();
      p.vx = p.facing * 440;
      p.vy = -385;
      p.onGround = false;
      p.invulnTimer = Math.max(p.invulnTimer, 0.22);
      p.jumpBufferTimer = 0;
      sound.playJump();
      this.spawnSparkles(p.x, p.y - p.baseH * scale * 0.5, 14, '#f472b6', '#fef08a', 1.15);
      return;
    }

    // Exit 3: Press [1] (Attack) -> Directional re-whip onto ANOTHER surface (no standing attack fallback!)
    if (input.attackJustPressed) {
      const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (moveDir !== 0) p.facing = moveDir > 0 ? 1 : -1;
      p.attackBufferTimer = 0;
      if (this.tryStartMinstrelWhipZip(input, tuning, true)) {
        return;
      }
      // No second anchor: release hook gracefully into a light acrobatic flourish hop
      p.minstrelZipActive = false;
      p.vy = Math.min(p.vy, -210);
      p.airJumpsRemaining = 1;
      sound.playWhip();
      this.spawnSparkles(p.x, p.y - p.baseH * scale * 0.5, 8, '#ec4899', '#fef08a', 0.9);
      return;
    }

    // Afterimage trail while zipping!
    this.afterimageAccum += dt;
    if (this.afterimageAccum >= 0.03) {
      this.afterimageAccum = 0;
      this.afterimages.push({
        x: p.x,
        y: p.y,
        facing: p.facing,
        crouching: false,
        color: '#ec4899',
        life: 0.24,
        maxLife: 0.24,
      });
    }

    const targetX = p.minstrelZipX;
    const targetY = Math.min(this.currentStage.floorY, p.minstrelZipY + p.baseH * scale * 0.18);
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 28 || p.minstrelZipTimer <= 0) {
      p.minstrelZipActive = false;
      p.vx = p.facing * 175;
      p.vy = targetY >= this.currentStage.floorY - 12 ? -145 : -255;
      p.airJumpsRemaining = 1;
      p.invulnTimer = Math.max(p.invulnTimer, 0.2);
      return;
    }

    // Smooth, deliberate tactical speed during slow-motion so player can easily chain [1]/[2]/[3]!
    const zipSpeed = p.weapon === 'silk_whip' ? 580 : 525;
    p.vx = (dx / dist) * zipSpeed;
    p.vy = (dy / dist) * zipSpeed;
    p.x = Math.max(20, Math.min(this.currentStage.worldWidth - 20, p.x + p.vx * dt));
    p.y = Math.max(40, Math.min(this.currentStage.floorY, p.y + p.vy * dt));
    p.onGround = false;

    // Snap any Hanging Brazier she zips past!
    for (const b of this.hangingBraziers) {
      if (b.state === 'hanging' && Math.hypot(p.x - b.x, p.y - p.baseH * scale * 0.5 - b.y) < 46) {
        this.snapHangingBrazier(b);
      }
    }

    // Deal contact damage to every enemy she zips through!
    const touchRect: Rect = {
      x: p.x - p.baseW * scale * 0.85,
      y: p.y - p.baseH * scale * 1.05,
      w: p.baseW * scale * 1.7,
      h: p.baseH * scale * 1.15,
    };
    for (const enemy of this.enemies) {
      if (enemy.dead || p.minstrelZipHitIds.has(enemy.id)) continue;
      if (rectsOverlap(touchRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
        p.minstrelZipHitIds.add(enemy.id);
        this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
        this.spawnSparkles(enemy.x, enemy.y - enemy.baseH * tuning.enemyScale * 0.5, 10, '#ec4899', '#fef08a', 1.1);
      }
    }
  }

  private updateMinstrelVault(dt: number, input: InputState, tuning: TuningConfig): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const weaponLv = 1 + p.weaponDamageBonus;
    p.minstrelVaultTimer = Math.max(0, p.minstrelVaultTimer - dt);

    // Can re-whip [1] or Encore Waltz [3] mid-vault!
    if (input.backdashJustPressed && p.weaponSkillCooldown <= 0) {
      p.minstrelVaultTimer = 0;
      this.triggerWeaponSkill(tuning);
      return;
    }
    if (input.attackJustPressed) {
      p.attackBufferTimer = 0;
      if (this.tryStartMinstrelWhipZip(input, tuning, false)) {
        return;
      }
    }

    this.afterimageAccum += dt;
    if (this.afterimageAccum >= 0.03) {
      this.afterimageAccum = 0;
      this.afterimages.push({
        x: p.x,
        y: p.y,
        facing: p.facing,
        crouching: false,
        color: '#f472b6',
        life: 0.2,
        maxLife: 0.2,
      });
    }

    const prevVx = p.vx;
    this.applyPlayerPhysics(dt, tuning, false);

    // Hit an enemy -> Deal throw-impact damage AND bounce back a little with i-frames!
    const vaultRect: Rect = {
      x: p.x - p.baseW * scale * 0.85,
      y: p.y - p.baseH * scale * 1.05,
      w: p.baseW * scale * 1.7,
      h: p.baseH * scale * 1.12,
    };
    for (const enemy of this.enemies) {
      if (enemy.dead || p.minstrelVaultHitIds.has(enemy.id)) continue;
      if (rectsOverlap(vaultRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
        p.minstrelVaultHitIds.add(enemy.id);
        p.invulnTimer = Math.max(p.invulnTimer, 0.38);
        this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv + 1);
        const bounceDir = p.x <= enemy.x ? -1 : 1;
        p.vx = bounceDir * 245;
        p.vy = -330;
        p.minstrelVaultTimer = 0;
        p.airJumpsRemaining = 1;
        sound.playJump();
        this.triggerShake(5.5, 0.14);
        this.spawnSparkles(p.x, p.y - p.baseH * scale * 0.5, 16, '#fde047', '#ec4899', 1.25);
        this.spawnDamageNumber(p.x, p.y - p.baseH * scale - 14, 'BOUNCE!', '#f472b6', 0.95);
        return;
      }
    }

    // Hit a solid wall -> bounce back gracefully!
    if (Math.abs(prevVx) > 80 && p.vx === 0 && !p.onGround) {
      const bounceDir = prevVx > 0 ? -1 : 1;
      p.vx = bounceDir * 225;
      p.vy = -315;
      p.facing = bounceDir;
      p.minstrelVaultTimer = 0;
      p.airJumpsRemaining = 1;
      sound.playJump();
      this.spawnSparkles(p.x, p.y - p.baseH * scale * 0.5, 10, '#f472b6', '#ffffff', 0.9);
      return;
    }

    if (p.onGround) {
      p.minstrelVaultTimer = 0;
    }
  }

  private updateMinstrelDance(dt: number, input: InputState, tuning: TuningConfig): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const isSilk = p.weapon === 'silk_whip';
    const weaponLv = 1 + p.weaponDamageBonus;
    const radius = (isSilk ? 116 : 96) * scale;

    p.minstrelDanceTimer = Math.max(0, p.minstrelDanceTimer - dt);
    p.minstrelDanceTickTimer -= dt;
    p.invulnTimer = Math.max(p.invulnTimer, 0.12);

    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (steer !== 0) {
      p.facing = steer > 0 ? 1 : -1;
      p.vx = steer * 155;
    } else {
      p.vx *= Math.pow(0.08, dt);
    }
    // Graceful hovering waltz drift
    p.vy = Math.min(p.vy, 32);
    this.applyPlayerPhysics(dt, tuning, false);

    const cx = p.x;
    const cy = p.y - p.baseH * scale * 0.55;

    // Deflect & shatter any enemy projectiles touching the Encore Waltz ribbon ring!
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.fromEnemy) continue;
      if (Math.hypot(proj.x - cx, proj.y - cy) <= radius) {
        sound.playArmorBlock();
        this.spawnSparkles(proj.x, proj.y, 10, '#fde047', '#ec4899', 1.0);
        this.projectiles.splice(i, 1);
      }
    }

    // 3 rhythmic waltz beats damage surrounding enemies!
    const wepEvo = this.getWeaponEvoTier();
    if (p.minstrelDanceTickTimer <= 0) {
      p.minstrelDanceTickTimer = 0.22;
      sound.playWhip(wepEvo);
      this.spawnSparkles(cx, cy, 12 + wepEvo * 8, '#ec4899', '#fef08a', 1.15 + wepEvo * 0.25);
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
        if (Math.hypot(enemy.x - cx, ey - cy) <= radius + wepEvo * 28 + enemy.baseW * tuning.enemyScale * 0.35) {
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
        }
      }
    }

    // Golden Crescendo Finale burst when the waltz ends!
    if (p.minstrelDanceTimer === 0) {
      const finR = radius * 1.25 + wepEvo * 40;
      sound.playCrit();
      this.triggerShake(7.5 + wepEvo * 3, 0.22);
      this.shockwaves.push({
        x: cx,
        y: cy,
        radius: 16,
        maxRadius: finR,
        color: '#ec4899',
        life: 0.28,
        maxLife: 0.28,
      });
      this.shockwaves.push({
        x: cx,
        y: cy,
        radius: 10,
        maxRadius: finR * 0.72,
        color: '#fde047',
        life: 0.22,
        maxLife: 0.22,
      });
      this.spawnSparkles(cx, cy, 24 + wepEvo * 12, '#fde047', '#ec4899', 1.5 + wepEvo * 0.3);
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
        if (Math.hypot(enemy.x - cx, ey - cy) <= finR + enemy.baseW * tuning.enemyScale * 0.35) {
          if (weaponLv >= 3) this.applyBurn(enemy, 3.0);
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv + 1);
        }
      }
    }
  }

  private executeHammerMeteorSlam(tuning: TuningConfig): void {
    const p = this.player;
    const weaponLv = 1 + p.weaponDamageBonus;
    const evoTier = this.getWeaponEvoTier();
    const flatBonus = this.getWeaponFlatBonus(weaponLv);
    const blastR = 210 + evoTier * 55;

    sound.playHammerBoom(evoTier);
    this.triggerShake(13 + evoTier * 3.5, 0.34 + evoTier * 0.06);
    this.triggerImpactFlash(evoTier >= 2 ? '#fde047' : '#fb923c', 0.4 + evoTier * 0.1, p.x, p.y - 18, 1.35 + evoTier * 0.3, 0.28);

    // Massive double shockwave crater rings!
    this.shockwaves.push({
      x: p.x,
      y: p.y - 8,
      radius: 18,
      maxRadius: blastR,
      color: '#f97316',
      life: 0.32 + evoTier * 0.06,
      maxLife: 0.32 + evoTier * 0.06,
    });
    this.shockwaves.push({
      x: p.x,
      y: p.y - 8,
      radius: 10,
      maxRadius: blastR * 0.68,
      color: '#fef08a',
      life: 0.24 + evoTier * 0.05,
      maxLife: 0.24 + evoTier * 0.05,
    });
    this.spawnSparkles(p.x, p.y - 16, 36 + evoTier * 18, '#f97316', '#fef08a', 1.8 + evoTier * 0.3);
    this.spawnDamageNumber(
      p.x,
      p.y - p.baseH * tuning.playerScale - 24,
      evoTier >= 2 ? 'MYTHIC CATACLYSM!' : evoTier >= 1 ? 'AWAKENED METEOR!' : 'METEOR SLAM!',
      '#fb923c',
      1.15 + evoTier * 0.15
    );

    // Massive Area Damage to every enemy within the crater radius!
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
      if (Math.hypot(enemy.x - p.x, ey - (p.y - 12)) <= blastR + enemy.baseW * tuning.enemyScale * 0.4) {
        if (weaponLv >= 3) {
          this.applyBurn(enemy, 4.0);
        }
        this.handlePlayerHitEnemy(enemy, tuning, 'hammer_meteor', weaponLv);
      }
    }

    // Twin Seismic Shockwaves racing left & right across the floor (Evo I+ spawns extra high-speed echo waves!)
    const speeds =
      evoCombatTier(p, tuning) >= 3 ? [380, 520, 300] : evoTier >= 1 ? [380, 520] : [375];
    for (const spd of speeds) {
      for (const dir of [-1, 1] as const) {
        this.projectiles.push({
          id: this.nextProjectileId++,
          x: p.x + dir * 24,
          y: p.y - 4,
          vx: dir * (spd + Math.min(120, flatBonus * 14)),
          vy: 0,
          radius: 16 + evoTier * 5 + Math.min(8, flatBonus),
          fromEnemy: false,
          damage: 3 + flatBonus,
          life: 1.05 + evoTier * 0.18,
          rotation: 0,
          kind: 'player_quake',
          slotLevel: weaponLv,
        });
      }
    }
  }

  private tryCastAbility(
    abilityId: AbilityId,
    slotLevel: number,
    input: InputState,
    tuning: TuningConfig
  ): boolean {
    const p = this.player;
    const ct = this.charTune();
    const baseDef = ABILITIES[abilityId];
    const def = {
      ...baseDef,
      manaCost: Math.max(0, Math.round(baseDef.manaCost * ct.spellCostMult)),
      cooldown: baseDef.cooldown * ct.spellCooldownMult,
    };
    if (p.abilityCooldowns[abilityId] > 0) return false;
    if (p.mp < def.manaCost) {
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 12, 'LOW MP', '#60a5fa', 0.85);
      return false;
    }

    const scale = tuning.playerScale;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const flatBonus = this.getSpellFlatBonus(slotLevel);
    const spellEvo = this.getSpellEvoTier(slotLevel);

    p.mp -= def.manaCost;
    p.abilityCooldowns[abilityId] = def.cooldown;

    switch (abilityId) {
      case 'fireball': {
        const vy = input.up ? -130 : 0;
        // Every 5 upgrades evolves volley count: Base = 1, Awakened (5+) = 2 Twin, Mythic (10+) = 3 Triple!
        const offsets =
          spellEvo >= 2
            ? [-16 * scale, 0, 16 * scale]
            : spellEvo >= 1
              ? [-11 * scale, 11 * scale]
              : [0];
        for (const dy of offsets) {
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 20 * scale,
            y: p.y - h * 0.58 + dy,
            vx: p.facing * (510 + spellEvo * 65 + Math.min(80, flatBonus * 12)),
            vy: vy + (spellEvo >= 2 ? dy * 1.4 : 0),
            radius: 9 + spellEvo * 3.5 + Math.min(4, flatBonus * 0.6),
            fromEnemy: false,
            damage: 2 + flatBonus,
            life: 1.5 + spellEvo * 0.2,
            rotation: 0,
            kind: 'fireball',
            slotLevel,
          });
        }
        sound.playFireball(spellEvo);
        this.spawnSparkles(
          p.x + p.facing * 18 * scale,
          p.y - h * 0.58,
          8 + spellEvo * 8,
          spellEvo >= 2 ? '#fde047' : '#f97316',
          '#fef08a',
          0.85 + spellEvo * 0.3
        );
        return false;
      }

      case 'dash_attack': {
        p.dashAttackTimer = 0.27 + spellEvo * 0.07;
        p.dashAttackLevel = slotLevel;
        p.dashAttackHitIds.clear();
        p.attackState = 'idle';
        p.crouching = false;
        p.invulnTimer = Math.max(p.invulnTimer, p.dashAttackTimer + spellEvo * 0.08);
        this.afterimageAccum = 0;
        sound.playWhip(spellEvo);
        if (spellEvo >= 1) {
          this.shockwaves.push({
            x: p.x,
            y: p.y - h * 0.5,
            radius: 10,
            maxRadius: 85 + spellEvo * 30,
            color: '#f43f5e',
            life: 0.22,
            maxLife: 0.22,
          });
        }
        return true;
      }

      case 'grapple': {
        const dirX = input.up ? p.facing * 0.14 : p.facing * 0.7;
        const dirY = input.up ? -0.99 : -0.71;
        const speed = 1080 + spellEvo * 140;
        p.grapple = {
          active: true,
          phase: 'extending',
          x: p.x + p.facing * 8 * scale,
          y: p.y - h * 0.62,
          vx: dirX * speed,
          vy: dirY * speed,
          maxLength: 360 + spellEvo * 70 + Math.min(60, flatBonus * 12),
          timer: 0.55,
          slotLevel,
        };
        p.attackState = 'idle';
        p.crouching = false;
        sound.playGrapple(spellEvo);
        return true;
      }

      case 'gas_bomb': {
        const vxList =
          spellEvo >= 2 ? [210, 290, 370] : spellEvo >= 1 ? [230, 325] : [270];
        for (const vxMag of vxList) {
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 14 * scale,
            y: p.y - h * 0.72,
            vx: p.facing * vxMag,
            vy: -350 - spellEvo * 25,
            radius: 7 + spellEvo * 2,
            fromEnemy: false,
            damage: 0,
            life: 2.0,
            rotation: 0,
            kind: 'gas_flask',
            slotLevel,
          });
        }
        sound.playGasBreak(spellEvo);
        return false;
      }

      case 'fire_weapon': {
        p.fireWeaponLevel = slotLevel;
        p.fireWeaponTimer = 8.0 + (slotLevel - 1) * 2.2;
        sound.playBuff(spellEvo);
        this.spawnSparkles(p.x, p.y - h * 0.5, 14 + spellEvo * 10, '#f97316', '#fef08a', 0.95 + spellEvo * 0.3);
        if (spellEvo >= 1) {
          this.shockwaves.push({
            x: p.x,
            y: p.y - h * 0.5,
            radius: 12,
            maxRadius: 110 + spellEvo * 35,
            color: '#fb923c',
            life: 0.28,
            maxLife: 0.28,
          });
        }
        this.spawnDamageNumber(
          p.x,
          p.y - h - 14,
          spellEvo >= 2 ? 'SUPERNOVA BLADE!' : spellEvo >= 1 ? 'SOLAR OVERDRIVE!' : `FIRE WEAPON LV ${slotLevel}`,
          '#fb923c',
          0.95 + spellEvo * 0.15
        );
        return false;
      }

      case 'cinder_palm': {
        // Open-palm thrust: a cone of ash and embers with a huge shove (great for pit kills).
        p.monkPalmTimer = 0.26;
        p.attackState = 'idle';
        p.crouching = false;
        const coneW = (118 + spellEvo * 34 + Math.min(40, flatBonus * 6)) * scale;
        const coneH = p.baseH * scale * (1.25 + spellEvo * 0.15);
        const box: Rect = {
          x: p.facing === 1 ? p.x : p.x - coneW,
          y: p.y - coneH * 0.92,
          w: coneW,
          h: coneH,
        };
        const palmX = p.x + p.facing * 22 * scale;
        const palmY = p.y - h * 0.58;
        sound.playMonkFist(2, spellEvo);
        sound.playBackdash(spellEvo);
        this.triggerShake(7 + spellEvo * 2, 0.18);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.045);
        this.shockwaves.push({ x: palmX, y: palmY, radius: 6, maxRadius: 58 + spellEvo * 20, color: '#a8a29e', life: 0.2, maxLife: 0.2 });
        for (let i = 0; i < 26 + spellEvo * 12; i++) {
          const spread = (Math.random() - 0.5) * 0.9;
          const spd = 260 + Math.random() * 360;
          const ember = Math.random() < 0.35;
          this.particles.push({
            x: palmX,
            y: palmY + (Math.random() - 0.5) * 14,
            vx: p.facing * Math.cos(spread) * spd,
            vy: Math.sin(spread) * spd * 0.7,
            size: ember ? 2.5 : 3 + Math.random() * 3,
            color: ember ? '#ea580c' : Math.random() < 0.5 ? '#78716c' : '#d6d3d1',
            life: 0.32,
            maxLife: 0.32,
            kind: ember ? 'ember' : 'dust',
            rotation: 0,
          });
        }
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          if (rectsOverlap(box, this.getEnemyRect(enemy, tuning.enemyScale))) {
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              kbX: 470,
              kbY: 190,
              dirX: p.facing,
              stun: 0.7,
              guardBreak: true,
            });
          }
        }
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
          const proj = this.projectiles[i];
          if (proj.fromEnemy && proj.x >= box.x && proj.x <= box.x + box.w && proj.y >= box.y && proj.y <= box.y + box.h) {
            this.spawnSparkles(proj.x, proj.y, 6, '#a8a29e', '#ffffff', 0.7);
            this.projectiles.splice(i, 1);
          }
        }
        return false;
      }

      case 'venom_needles': {
        // Assassin spell: a fan of poisoned needles (more every 5 levels), tinted by the active Affinity.
        const el = this.getWizardElement();
        const count = Math.min(7, 3 + spellEvo * 2);
        const speed = 660;
        for (let i = 0; i < count; i++) {
          const ang = (i - (count - 1) / 2) * 0.13;
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 20 * scale,
            y: p.y - h * 0.6,
            vx: p.facing * Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed + (input.up ? -60 : 0),
            radius: 5,
            fromEnemy: false,
            damage: 1,
            life: 0.62 + spellEvo * 0.08,
            rotation: 0,
            kind: 'venom_needle',
            slotLevel,
            color: el.root ? el.c1 : '#65a30d',
            hitIds: [],
          });
        }
        p.assassinThrowTimer = 0.26;
        sound.playVenomNeedles(spellEvo);
        this.spawnSparkles(p.x + p.facing * 22 * scale, p.y - h * 0.6, 6, '#4d7c0f', '#bef264', 0.7);
        return false;
      }

      case 'chain_storm': {
        // Lightning leaps between nearby foes, in the colour of the active Affinity.
        const el = this.getWizardElement();
        const maxTargets = 3 + spellEvo + (slotLevel >= 4 ? 1 : 0);
        const firstRange = 360 * scale;
        const hopRange = 230 * scale;
        const eScale = tuning.enemyScale;
        const hit: Enemy[] = [];
        let px = p.x + p.facing * 20 * scale;
        let py = p.y - h * 0.82;
        for (let n = 0; n < maxTargets; n++) {
          let best: Enemy | null = null;
          let bestD = Infinity;
          for (const enemy of this.enemies) {
            if (enemy.dead || hit.includes(enemy)) continue;
            const ey = enemy.y - (enemy.baseH * eScale) / 2;
            const d = Math.hypot(enemy.x - px, ey - py);
            const lim = n === 0 ? firstRange : hopRange;
            if (d <= lim && d < bestD) {
              bestD = d;
              best = enemy;
            }
          }
          if (!best) break;
          const by = best.y - (best.baseH * eScale) / 2;
          this.elementalArcs.push({
            kind: 'lightning',
            x1: px,
            y1: py,
            x2: best.x,
            y2: by,
            color: el.c1,
            secondaryColor: el.c2,
            life: 0.34,
            maxLife: 0.34,
            seed: Math.random() * 100,
          });
          hit.push(best);
          px = best.x;
          py = by;
        }
        if (hit.length === 0) {
          // Nothing in reach: refund and fizzle so the cast is never wasted.
          p.mp += def.manaCost;
          p.abilityCooldowns[abilityId] = 0.2;
          this.spawnSparkles(p.x + p.facing * 20 * scale, p.y - h * 0.82, 8, el.c1, '#e0e7ff', 0.6);
          this.spawnDamageNumber(p.x, p.y - h - 12, 'NO TARGET', el.c1, 0.8);
          return false;
        }
        p.wizardCastTimer = 0.3;
        sound.playElementalProc('lightning');
        sound.playWizardBolt(spellEvo, true);
        this.triggerShake(5 + spellEvo * 2, 0.16);
        this.triggerImpactFlash(el.c1, 0.16, p.x, p.y - h * 0.6, 1.0, 0.14);
        for (const enemy of hit) {
          this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, { kbX: 80, stun: 0.6, dirX: enemy.x >= p.x ? 1 : -1 });
        }
        return false;
      }

      case 'ricochet_snare': {
        // Ranger starter spell: weighted green snare bola that pierces, binds & stuns foes in a razor burst!
        const ox = p.x + p.facing * 20 * scale;
        const oy = p.y - h * 0.56;
        const count = spellEvo >= 2 ? 3 : spellEvo >= 1 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.16;
          const spd = 620 + spellEvo * 55;
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: ox,
            y: oy,
            vx: p.facing * Math.cos(spread) * spd,
            vy: Math.sin(spread) * spd + (input.up ? -90 : 0),
            radius: 10 + spellEvo * 2,
            fromEnemy: false,
            damage: 2 + flatBonus,
            life: 1.05 + spellEvo * 0.15,
            rotation: 0,
            kind: 'crossbow_bolt',
            color: '#10b981',
            color2: '#a7f3d0',
            pierce: true,
            hitIds: [],
            slotLevel,
          });
        }
        // Also immediately snare-bind nearby enemies in front cone for crisp CC feel!
        const snareRange = 220 + spellEvo * 45;
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const dx = (enemy.x - p.x) * p.facing;
          const dy = Math.abs(enemy.y - p.y);
          if (dx >= -15 && dx <= snareRange && dy <= 95) {
            enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 1.1 + spellEvo * 0.25);
            enemy.chillTimer = Math.max(enemy.chillTimer ?? 0, 2.5);
            this.spawnSparkles(enemy.x, enemy.y - enemy.baseH * tuning.enemyScale * 0.5, 10, '#10b981', '#d1fae5', 0.9);
          }
        }
        sound.playGrapple(spellEvo);
        this.spawnSparkles(ox, oy, 14, '#10b981', '#fef08a', 1.0);
        this.spawnDamageNumber(p.x, p.y - h - 14, 'SNARE BOLA!', '#34d399', 0.95);
        return false;
      }

      case 'aegis_slam': {
        // Vanguard starter spell: +1 Armor Shield + twin iron shockwaves left & right staggering enemies!
        p.armorShield = Math.min(4, p.armorShield + 1 + (spellEvo >= 2 ? 1 : 0));
        p.armorTimer = Math.max(p.armorTimer, 14 + spellEvo * 4);
        const radius = 148 + spellEvo * 32;
        const cx = p.x;
        const cy = p.y - h * 0.35;
        sound.playArmorBlock();
        sound.playHammerBoom();
        this.triggerShake(7.5 + spellEvo * 1.5, 0.22);
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: 14,
          maxRadius: radius,
          color: '#38bdf8',
          life: 0.3,
          maxLife: 0.3,
        });
        for (const dir of [-1, 1] as const) {
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: cx + dir * 24,
            y: p.y - 14,
            vx: dir * (390 + spellEvo * 50),
            vy: 0,
            radius: 18 + spellEvo * 3,
            fromEnemy: false,
            damage: 2 + flatBonus,
            life: 0.55 + spellEvo * 0.12,
            rotation: 0,
            kind: 'player_quake',
            color: '#38bdf8',
            color2: '#e0f2fe',
            pierce: true,
            hitIds: [],
            slotLevel,
          });
        }
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cx, ey - cy) <= radius) {
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              kbX: 300,
              kbY: 210,
              stun: 0.85,
              guardBreak: true,
              dirX: enemy.x >= cx ? 1 : -1,
            });
          }
        }
        this.spawnSparkles(cx, cy, 22, '#38bdf8', '#ffffff', 1.2);
        this.spawnDamageNumber(p.x, p.y - h - 14, 'AEGIS SLAM (+1 ARMOR)', '#38bdf8', 1.0);
        return false;
      }

      case 'solar_bloom': {
        // Blade-Dancer starter spell: radiant sun-ring AoE slicing & igniting nearby enemies!
        const cx = p.x;
        const cy = p.y - h * 0.52;
        const radius = 158 + spellEvo * 32;
        sound.playKatanaSlash(spellEvo);
        sound.playFireball(spellEvo);
        this.triggerShake(6.5, 0.2);
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: 12,
          maxRadius: radius,
          color: '#fbbf24',
          life: 0.3,
          maxLife: 0.3,
        });
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: 8,
          maxRadius: radius * 0.65,
          color: '#f97316',
          life: 0.22,
          maxLife: 0.22,
        });
        this.spawnSparkles(cx, cy, 28 + spellEvo * 8, '#fbbf24', '#fef08a', 1.35);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cx, ey - cy) <= radius + 12) {
            enemy.burnTimer = Math.max(enemy.burnTimer ?? 0, 3.6 + spellEvo * 0.6);
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              bonusDamage: 1,
              kbX: 220,
              kbY: 160,
              stun: 0.45,
              dirX: enemy.x >= cx ? 1 : -1,
            });
          }
        }
        this.spawnDamageNumber(p.x, p.y - h - 14, 'SOLAR BLOOM!', '#fbbf24', 1.04);
        return false;
      }

      case 'prism_beam': {
        // Prism Striker starter spell: instant refracted cyan crystal beam piercing every foe ahead!
        const beamLen = (420 + spellEvo * 65) * scale;
        const ox = p.x + p.facing * 20 * scale;
        const oy = p.y - h * 0.56;
        const endX = ox + p.facing * beamLen;
        this.elementalArcs.push({
          kind: 'beam',
          x1: ox,
          y1: oy,
          x2: endX,
          y2: oy,
          color: '#22d3ee',
          secondaryColor: '#e879f9',
          life: 0.34,
          maxLife: 0.34,
          seed: Math.random() * 100,
        });
        sound.playParry(false);
        sound.playWizardBolt(spellEvo, true);
        this.triggerShake(6.5, 0.18);
        this.spawnSparkles(ox, oy, 16, '#22d3ee', '#ffffff', 1.15);
        const minX = Math.min(ox, endX);
        const maxX = Math.max(ox, endX);
        const halfH = (34 + spellEvo * 8) * scale;
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          const ew = (enemy.baseW * tuning.enemyScale) / 2;
          if (enemy.x + ew >= minX && enemy.x - ew <= maxX && Math.abs(ey - oy) <= halfH + (enemy.baseH * tuning.enemyScale) * 0.45) {
            this.spawnSparkles(enemy.x, ey, 12, '#67e8f9', '#e879f9', 1.05);
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              bonusDamage: 1 + spellEvo,
              kbX: 250,
              stun: 0.55,
              guardBreak: true,
              dirX: p.facing,
            });
          }
        }
        this.spawnDamageNumber(p.x, p.y - h - 14, 'PRISM BEAM!', '#22d3ee', 1.05);
        return false;
      }

      case 'frost_nova': {
        // Forge-exclusive spell: Glacial Nova freezing all nearby enemies; bonus shatter damage to chilled foes!
        const cx = p.x;
        const cy = p.y - h * 0.5;
        const radius = 172 + spellEvo * 34;
        sound.playElementalProc('water');
        this.triggerShake(6.5, 0.2);
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: 12,
          maxRadius: radius,
          color: '#7dd3fc',
          life: 0.34,
          maxLife: 0.34,
        });
        this.spawnSparkles(cx, cy, 30 + spellEvo * 10, '#7dd3fc', '#ffffff', 1.35);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cx, ey - cy) <= radius + 10) {
            const wasChilled = (enemy.chillTimer ?? 0) > 0;
            enemy.chillTimer = Math.max(enemy.chillTimer ?? 0, 4.2 + spellEvo * 0.8);
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              bonusDamage: wasChilled ? 3 + spellEvo : 1,
              kbX: 160,
              stun: 0.75 + spellEvo * 0.2,
              dirX: enemy.x >= cx ? 1 : -1,
            });
          }
        }
        this.spawnDamageNumber(p.x, p.y - h - 14, 'GLACIAL NOVA!', '#7dd3fc', 1.08);
        return false;
      }

      case 'phantom_blades': {
        // Forge-exclusive spell: summons a fan of 5 spectral purple daggers that pierce rapidly!
        const count = 5 + spellEvo * 2;
        const ox = p.x + p.facing * 20 * scale;
        const oy = p.y - h * 0.62;
        const spd = 720 + spellEvo * 50;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.14;
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: ox,
            y: oy + (i - (count - 1) / 2) * 5,
            vx: p.facing * Math.cos(spread) * spd,
            vy: Math.sin(spread) * spd + (input.up ? -85 : 0),
            radius: 7,
            fromEnemy: false,
            damage: Math.max(1, 1 + Math.floor(flatBonus * 0.75)),
            life: 0.75 + spellEvo * 0.12,
            rotation: Math.atan2(Math.sin(spread) * spd, p.facing * Math.cos(spread) * spd),
            kind: 'crossbow_bolt',
            color: '#c084fc',
            color2: '#f5d0fe',
            pierce: true,
            hitIds: [],
            slotLevel,
          });
        }
        sound.playVenomNeedles(spellEvo);
        this.spawnSparkles(ox, oy, 18, '#c084fc', '#ffffff', 1.1);
        this.spawnDamageNumber(p.x, p.y - h - 14, 'PHANTOM BLADES!', '#c084fc', 1.02);
        return false;
      }

      case 'meteor_call': {
        // Forge-exclusive spell: calls a blazing meteor directly onto the nearest enemy ahead!
        let target: Enemy | null = null;
        let bestScore = Infinity;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d > 520) continue;
          const frontBias = (e.x - p.x) * p.facing >= -20 ? 0.65 : 1.4;
          if (d * frontBias < bestScore) {
            bestScore = d * frontBias;
            target = e;
          }
        }
        const tx = target ? target.x : Math.max(60, Math.min(this.currentStage.worldWidth - 60, p.x + p.facing * 200));
        const ty = target ? target.y - 16 : p.y - 16;
        const blastR = 148 + spellEvo * 32;
        this.elementalArcs.push({
          kind: 'beam',
          x1: tx - p.facing * 90,
          y1: Math.max(20, ty - 340),
          x2: tx,
          y2: ty,
          color: '#ef4444',
          secondaryColor: '#fde047',
          life: 0.4,
          maxLife: 0.4,
          seed: Math.random() * 100,
        });
        sound.playHammerBoom();
        sound.playFireball(Math.max(1, spellEvo));
        this.triggerShake(9.5 + spellEvo * 2, 0.3);
        this.shockwaves.push({
          x: tx,
          y: ty,
          radius: 16,
          maxRadius: blastR,
          color: '#ef4444',
          life: 0.36,
          maxLife: 0.36,
        });
        this.shockwaves.push({
          x: tx,
          y: ty,
          radius: 10,
          maxRadius: blastR * 0.6,
          color: '#fef08a',
          life: 0.24,
          maxLife: 0.24,
        });
        this.spawnSparkles(tx, ty, 38, '#ef4444', '#fde047', 1.55);
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - tx, ey - ty) <= blastR + 12) {
            enemy.burnTimer = Math.max(enemy.burnTimer ?? 0, 4.5);
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              bonusDamage: 3 + spellEvo * 2,
              kbX: 310,
              kbY: 260,
              stun: 0.9,
              guardBreak: true,
              dirX: enemy.x >= tx ? 1 : -1,
            });
          }
        }
        this.spawnDamageNumber(tx, ty - 42, 'METEOR CALL!', '#ef4444', 1.2);
        return false;
      }

      case 'blood_siphon': {
        // Forge-exclusive spell: crimson pulse draining nearby foes and restoring +1 HP!
        const cx = p.x;
        const cy = p.y - h * 0.52;
        const radius = 165 + spellEvo * 28;
        let drained = 0;
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cx, ey - cy) <= radius + 10) {
            drained++;
            this.elementalArcs.push({
              kind: 'lightning',
              x1: enemy.x,
              y1: ey,
              x2: cx,
              y2: cy,
              color: '#be123c',
              secondaryColor: '#fda4af',
              life: 0.34,
              maxLife: 0.34,
              seed: Math.random() * 100,
            });
            this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLevel, {
              bonusDamage: 1,
              kbX: 110,
              stun: 0.35,
              dirX: enemy.x >= cx ? 1 : -1,
            });
          }
        }
        sound.playBuff(spellEvo);
        this.shockwaves.push({
          x: cx,
          y: cy,
          radius: 12,
          maxRadius: radius,
          color: '#be123c',
          life: 0.3,
          maxLife: 0.3,
        });
        this.spawnSparkles(cx, cy, 22, '#be123c', '#fda4af', 1.2);
        if (drained > 0) {
          const healAmt = spellEvo >= 2 && drained >= 3 ? 2 : 1;
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          this.spawnDamageNumber(p.x, p.y - h - 16, `SIPHON +${healAmt} HP`, '#fb7185', 1.08);
        } else {
          this.spawnDamageNumber(p.x, p.y - h - 16, 'BLOOD SIPHON', '#be123c', 0.92);
        }
        return false;
      }
    }
  }

  // ===========================================================================
  // MONK & WIZARD KITS
  // ===========================================================================

  // ===========================================================================
  // ASSASSIN KIT: Twin Nightfangs, Mark for Death [3], Shadow Step execute, Shadow Blink, Venom Needles
  // ===========================================================================

  /** Cooldown of [3] after an execute / boss mark (Transcendent weapons are faster). */
  private markCooldownSec(): number {
    const ct = this.charTune('assassin');
    const evo = Math.min(3, this.getWeaponEvoTier());
    return Math.max(0.5, ct.assassinMarkCooldown * (evo >= 3 ? 0.65 : 1));
  }

  private liveMarkedFoes(): Enemy[] {
    return this.enemies.filter((e) => !e.dead && !e.isBoss && (e.markTimer ?? 0) > 0);
  }

  /** The marked regular foe nearest to the Assassin (if any). */
  private nearestLiveMark(): Enemy | null {
    const p = this.player;
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.liveMarkedFoes()) {
      const d = Math.abs(e.x - p.x);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private onMarkExpired(enemy: Enemy, tuning: TuningConfig): void {
    const p = this.player;
    this.spawnSparkles(enemy.x, enemy.y - enemy.baseH * tuning.enemyScale * 0.55, 6, '#44403c', '#9f1239', 0.55);
    if (!enemy.isBoss && p.characterId === 'assassin') {
      p.weaponSkillCooldown = Math.max(p.weaponSkillCooldown, this.markCooldownSec() * 0.5);
    }
  }

  private onMarkedFoeDied(enemy: Enemy): void {
    const p = this.player;
    enemy.markTimer = 0;
    if (p.characterId !== 'assassin') return;
    p.weaponSkillCooldown = Math.max(p.weaponSkillCooldown, this.markCooldownSec() * 0.6);
  }

  /** Aimed target for Mark for Death: nearest foe in the facing direction (any foe behind us as a fallback). */
  private findMarkTarget(tuning: TuningConfig, includeBosses = true): Enemy | null {
    const p = this.player;
    const ct = this.charTune('assassin');
    const flags = affFlags(p, tuning);
    const range = ct.assassinMarkRange * (flags.air ? 1 + 0.25 * combatTune(tuning).affinityPower : 1);
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const e of this.enemies) {
      if (e.dead || (e.markTimer ?? 0) > 0) continue;
      if (e.isBoss && !includeBosses) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (Math.abs(dx) > range || Math.abs(dy) > range * 0.55) continue;
      const behind = dx * p.facing < -30;
      const score = Math.abs(dx) + Math.abs(dy) * 1.4 + (behind ? 420 : 0) + (e.isBoss ? 0 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  /** Brand a foe: skull mark, beam, affinity status. Bosses take extra damage; regular foes can be executed. */
  private applyDeathMark(enemy: Enemy, tuning: TuningConfig, fromBeam: boolean): void {
    const p = this.player;
    const ct = this.charTune('assassin');
    const evo = Math.min(3, this.getWeaponEvoTier());
    const flags = affFlags(p, tuning);
    const c = combatTune(tuning);
    const pow = c.affinityPower;
    const base = enemy.isBoss ? ct.assassinBossMarkDuration : ct.assassinMarkDuration;
    const dur = base * (evo >= 1 ? 1.25 : 1) * (flags.shadow ? 1 + 0.3 * pow : 1);
    enemy.markTimer = dur;
    enemy.markMaxTimer = dur;
    const ey = enemy.y - enemy.baseH * tuning.enemyScale * 0.55;
    if (fromBeam) {
      const h = (p.crouching ? p.crouchBaseH : p.baseH) * tuning.playerScale;
      this.markBeams.push({ x1: p.x + p.facing * 14 * tuning.playerScale, y1: p.y - h * 0.62, x2: enemy.x, y2: ey, life: 0.32, maxLife: 0.32 });
    }
    this.shockwaves.push({ x: enemy.x, y: ey, radius: 6, maxRadius: 54, color: '#9f1239', life: 0.32, maxLife: 0.32 });
    this.spawnSparkles(enemy.x, ey, 12, '#7f1d1d', '#fda4af', 0.8);
    this.spawnDamageNumber(
      enemy.x,
      enemy.y - enemy.baseH * tuning.enemyScale - 22,
      enemy.isBoss ? `MARKED +${Math.round(ct.assassinBossMarkBonusPct)}%` : 'MARKED FOR DEATH',
      '#be123c',
      1.15,
      enemy.isBoss ? 'BOSS TAKES EXTRA DAMAGE' : 'PRESS [3] TO EXECUTE'
    );
    // Affinity changes what the brand does to the foe.
    if (flags.fire) {
      enemy.burnTimer = Math.max(enemy.burnTimer, 3.2 * pow);
      enemy.burnTickTimer = Math.max(enemy.burnTickTimer, 0.75);
    }
    if (flags.water) enemy.chillTimer = Math.max(enemy.chillTimer ?? 0, 3 * pow);
    if (flags.shadow) {
      enemy.witherTimer = Math.max(enemy.witherTimer ?? 0, 3.6 * pow);
      enemy.witherTickTimer = enemy.witherTickTimer ?? 0.5;
    }
    if (flags.earth && !enemy.isBoss) enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.35 * pow);
    if (flags.light) this.shockwaves.push({ x: enemy.x, y: ey, radius: 6, maxRadius: 80, color: '#fde68a', life: 0.3, maxLife: 0.3 });
    // Mythic: the brand also lands on a second nearby regular foe.
    if (evo >= 2 && !enemy.isBoss && fromBeam) {
      let second: Enemy | null = null;
      let sd = 380;
      for (const e of this.enemies) {
        if (e === enemy || e.dead || e.isBoss || (e.markTimer ?? 0) > 0) continue;
        const d = Math.hypot(e.x - enemy.x, e.y - enemy.y);
        if (d < sd) {
          sd = d;
          second = e;
        }
      }
      if (second) this.applyDeathMark(second, tuning, false);
    }
  }

  /** [3] Mark for Death: with a live mark it shadow-step executes it; otherwise it brands a foe. */
  private castMarkForDeath(tuning: TuningConfig): boolean {
    const p = this.player;
    if (this.currentStage.isCamp) return false;
    const live = this.nearestLiveMark();
    if (live) {
      this.shadowStepExecute(live, tuning, true);
      return true;
    }
    const target = this.findMarkTarget(tuning);
    if (!target) {
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 14, 'NO TARGET', '#9f1239', 0.85);
      p.weaponSkillCooldown = Math.max(p.weaponSkillCooldown, 0.3);
      return false;
    }
    p.facing = target.x >= p.x ? 1 : -1;
    p.assassinMarkCastTimer = 0.3;
    p.crouching = false;
    sound.playDeathMark();
    this.triggerShake(3, 0.12);
    this.applyDeathMark(target, tuning, true);
    // A regular foe: [3] is ready again at once so the execute is one more press. A boss: full cooldown.
    p.weaponSkillCooldown = target.isBoss ? this.markCooldownSec() : 0.45;
    return true;
  }

  private isPlayerSpotFree(x: number, y: number, tuning: TuningConfig): boolean {
    const p = this.player;
    const scale = tuning.playerScale;
    const halfW = (p.baseW * scale) / 2;
    const h = p.baseH * scale;
    if (x < halfW + 6 || x > this.currentStage.worldWidth - halfW - 6) return false;
    const rect: Rect = { x: x - halfW, y: y - h, w: halfW * 2, h: h - 4 };
    for (const plat of this.platforms) {
      if (plat.oneWay || !this.isPlatformSolid(plat)) continue;
      if (rectsOverlap(rect, plat)) return false;
    }
    return true;
  }

  /** Foe the Assassin can execute from a distance right now: a marked foe, or an unaware / low-HP one in range. */
  public findAssassinRangedTarget(tuning: TuningConfig): Enemy | null {
    const p = this.player;
    if (p.characterId !== 'assassin' || this.currentStage.isCamp) return null;
    const ct = this.charTune('assassin');
    const flags = affFlags(p, tuning);
    const markRange = ct.assassinMarkRange * (flags.air ? 1 + 0.25 * combatTune(tuning).affinityPower : 1);
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const e of this.enemies) {
      if (e.dead || e.isBoss) continue;
      const dx = Math.abs(e.x - p.x);
      const dy = Math.abs(e.y - p.y);
      let score: number;
      if ((e.markTimer ?? 0) > 0) {
        if (dx > markRange || dy > markRange * 0.55) continue;
        score = dx - 100000;
      } else {
        const unaware = !e.alerted && tuning.assassinationEnabled;
        const weak = e.hp <= Math.max(1, Math.floor(e.maxHp * ct.assassinExecHpPct));
        if (!unaware && !weak) continue;
        if (dx > ct.assassinExecRange || dy > 170) continue;
        score = dx;
      }
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  /** Interact (desktop [0] / mobile stick tap) for the Assassin: execute from range when no door / melee target comes first. */
  private tryAssassinInteractExecute(input: InputState, tuning: TuningConfig): boolean {
    const p = this.player;
    if (p.characterId !== 'assassin' || this.currentStage.isCamp) return false;
    if (this.assassinStepCd > 0) return false;
    const target = this.findAssassinRangedTarget(tuning);
    if (!target) return false;
    const marked = (target.markTimer ?? 0) > 0;
    if (!marked) {
      if (this.getNearbyInteractable()) return false;
      if (input.autoAttack && this.findMeleeAssassinationTarget(tuning)) return false;
    }
    this.shadowStepExecute(target, tuning, marked);
    return true;
  }

  /** Teleport to a foe and execute it (kill credit, XP, drops and the full assassination freeze). */
  private shadowStepExecute(enemy: Enemy, tuning: TuningConfig, viaMark: boolean): void {
    const p = this.player;
    const ct = this.charTune('assassin');
    const scale = tuning.playerScale;
    const evo = Math.min(3, this.getWeaponEvoTier());
    const flags = affFlags(p, tuning);
    const pow = combatTune(tuning).affinityPower;
    const halfW = (p.baseW * scale) / 2;
    const eHalf = (enemy.baseW * tuning.enemyScale) / 2;
    const gap = eHalf + halfW + 6;
    const dir = enemy.facing;
    const tries = [enemy.x - dir * gap, enemy.x + dir * gap, enemy.x - dir * (gap + 44), enemy.x + dir * (gap + 44)];
    let destX = tries[0];
    for (const x of tries) {
      if (this.isPlayerSpotFree(x, enemy.y, tuning)) {
        destX = x;
        break;
      }
    }
    destX = Math.max(halfW + 6, Math.min(this.currentStage.worldWidth - halfW - 6, destX));
    const sx = p.x;
    const sy = p.y;
    const dist = Math.hypot(destX - sx, enemy.y - sy);
    const n = Math.min(14, Math.max(3, Math.floor(dist / 48)));
    const trailCol = flags.id ? (flags.profile?.pal.mid ?? '#7f1d1d') : '#7f1d1d';
    for (let i = 0; i <= n; i++) {
      this.afterimages.push({
        x: sx + ((destX - sx) * i) / n,
        y: sy + ((enemy.y - sy) * i) / n,
        facing: p.facing,
        crouching: false,
        color: i % 2 ? trailCol : '#1c1917',
        life: 0.3 + i * 0.012,
        maxLife: 0.46,
      });
    }
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: sx + (Math.random() - 0.5) * 18,
        y: sy - Math.random() * p.baseH * scale,
        vx: (Math.random() - 0.5) * 90,
        vy: -20 - Math.random() * 70,
        size: 3 + Math.random() * 3.5,
        color: Math.random() < 0.6 ? '#1c1917' : '#44403c',
        life: 0.5,
        maxLife: 0.5,
        kind: 'dust',
        rotation: 0,
      });
    }
    p.x = destX;
    p.y = enemy.y;
    p.vx = 0;
    p.vy = 0;
    p.onGround = enemy.onGround;
    p.facing = enemy.x >= destX ? 1 : -1;
    p.attackState = 'idle';
    p.attackTimer = 0;
    p.crouching = false;
    p.assassinStepTimer = 0.34;
    p.invulnTimer = Math.max(p.invulnTimer, 0.55);
    sound.playShadowStep();
    this.shockwaves.push({ x: destX, y: p.y - p.baseH * scale * 0.5, radius: 8, maxRadius: 74, color: '#7f1d1d', life: 0.26, maxLife: 0.26 });
    this.triggerShake(4, 0.14);

    const weak = !viaMark && enemy.alerted;
    enemy.markTimer = 0;
    const hitX = enemy.x;
    const hitY = enemy.y - enemy.baseH * tuning.enemyScale * 0.55;
    this.handlePlayerHitEnemy(enemy, tuning, 'dash', 1 + p.weaponDamageBonus, {
      forceAssassinate: true,
      kbX: 240,
      kbY: 100,
      dirX: p.facing,
      callout: viaMark ? 'DEATH MARK' : weak ? 'FINISHED' : 'SHADOW STEP',
    });

    // Awakened: ghost daggers fly at other foes. Transcendent: a shadow burst around the kill.
    if (evo >= 1) {
      let sent = 0;
      for (const e of this.enemies) {
        if (e === enemy || e.dead || sent >= 2) continue;
        if (Math.hypot(e.x - hitX, e.y - hitY) > 440) continue;
        this.spawnThrownDagger(hitX, hitY, e.x, e.y - e.baseH * tuning.enemyScale * 0.55, tuning, 1, true, 0);
        sent += 1;
      }
    }
    if (evo >= 3) {
      this.shockwaves.push({ x: hitX, y: hitY, radius: 10, maxRadius: 150 * scale, color: '#0c0a09', life: 0.3, maxLife: 0.3 });
      this.shockwaves.push({ x: hitX, y: hitY, radius: 10, maxRadius: 120 * scale, color: '#9f1239', life: 0.26, maxLife: 0.26 });
      for (const e of this.enemies) {
        if (e === enemy || e.dead) continue;
        const ey = e.y - (e.baseH * tuning.enemyScale) / 2;
        if (Math.hypot(e.x - hitX, ey - hitY) <= 150 * scale) {
          this.handlePlayerHitEnemy(e, tuning, 'weapon', 1 + p.weaponDamageBonus, {
            kbX: 340,
            kbY: 140,
            dirX: e.x >= hitX ? 1 : -1,
            stun: 0.5,
            noAssassinate: true,
          });
        }
      }
    }
    this.assassinAffinityExecute(hitX, hitY, tuning, flags, pow);

    if (viaMark) {
      p.weaponSkillCooldown = this.liveMarkedFoes().length > 0 ? 0.6 : this.markCooldownSec();
    } else {
      this.assassinStepCd = 0.9;
    }
  }

  /** Affinity on Mark for Death: what the execution leaves behind / does around the kill. */
  private assassinAffinityExecute(x: number, y: number, tuning: TuningConfig, flags: AffinityFlags, pow: number): void {
    const p = this.player;
    if (!flags.id) return;
    const scale = tuning.playerScale;
    const c = combatTune(tuning);
    const zr = skillZoneRadius(flags, c);
    if (zr > 0 && (flags.fire || flags.shadow || flags.light || flags.earth || flags.water)) {
      const kind: BaseElementId = flags.fire ? 'fire' : flags.shadow ? 'shadow' : flags.light ? 'light' : flags.earth ? 'earth' : 'water';
      this.spawnAffinityZone(x, p.y - 2, kind, zr * scale * 1.2, 1.4 + 0.4 * pow);
    }
    const R = (110 + 30 * pow) * scale;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const ey = e.y - (e.baseH * tuning.enemyScale) / 2;
      if (Math.hypot(e.x - x, ey - y) > R) continue;
      if (flags.water) {
        e.chillTimer = Math.max(e.chillTimer ?? 0, 2.5 * pow);
        if (!e.isBoss) e.vx = (e.x >= x ? 1 : -1) * 150 * pow;
      }
      if (flags.air && !e.isBoss) {
        e.vx = Math.sign(x - e.x || 1) * (150 + 60 * pow);
        e.hurtStunTimer = Math.max(e.hurtStunTimer, 0.1);
      }
      if (flags.earth && !e.isBoss) {
        e.hurtStunTimer = Math.max(e.hurtStunTimer, 0.3 * pow);
        e.vx = (e.x >= x ? 1 : -1) * 190 * pow;
      }
      if (flags.fire) {
        e.burnTimer = Math.max(e.burnTimer, 2.4 * pow);
        e.burnTickTimer = Math.max(e.burnTickTimer, 0.75);
      }
      if (flags.shadow) {
        e.witherTimer = Math.max(e.witherTimer ?? 0, 2.6 * pow);
        e.witherTickTimer = e.witherTickTimer ?? 0.5;
      }
    }
    if (flags.shadow && p.hp < p.maxHp && Math.random() < 0.45 * pow) {
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.spawnDamageNumber(p.x, p.y - p.baseH * scale - 26, '+1 HP', '#c084fc', 0.9);
    }
    if (flags.earth) this.triggerShake(6, 0.18);
    const col = flags.profile?.pal.mid ?? '#9f1239';
    this.shockwaves.push({ x, y, radius: 8, maxRadius: R, color: col, life: 0.3, maxLife: 0.3 });
    this.spawnSparkles(x, y, 10 + Math.round(pow * 6), col, flags.profile?.pal.core ?? '#fafafa', 0.9);
  }

  /** A thrown (or ghost) dagger toward a point. `spectral` daggers pierce and are tinted crimson. */
  private spawnThrownDagger(
    ox: number,
    oy: number,
    tx: number,
    ty: number,
    tuning: TuningConfig,
    dmg: number,
    spectral: boolean,
    bonus: number
  ): void {
    const p = this.player;
    const ct = this.charTune('assassin');
    const ang = Math.atan2(ty - oy, tx - ox);
    const speed = spectral ? 760 : 940;
    const weaponLv = 1 + p.weaponDamageBonus;
    this.projectiles.push({
      id: this.nextProjectileId++,
      x: ox,
      y: oy,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      radius: spectral ? 7 : 6,
      fromEnemy: false,
      damage: dmg + bonus,
      life: Math.max(0.2, (spectral ? 520 : ct.assassinDaggerRange) / speed),
      rotation: ang,
      kind: 'thrown_dagger',
      slotLevel: weaponLv,
      color: spectral ? '#be123c' : undefined,
      pierce: spectral,
      hitIds: [],
      startX: ox,
    });
  }

  /** Crouch + [1]: throw a dagger (aims at the nearest foe in front). Unaware regular foes die from range. */
  private throwDagger(tuning: TuningConfig): void {
    const p = this.player;
    const ct = this.charTune('assassin');
    const scale = tuning.playerScale;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const ox = p.x + p.facing * 18 * scale;
    const oy = p.y - h * 0.62;
    // Auto-aim: nearest foe ahead within range, otherwise straight.
    let aimX = ox + p.facing * 300;
    let aimY = oy;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - p.x;
      if (dx * p.facing < 10 || Math.abs(dx) > ct.assassinDaggerRange) continue;
      const ey = e.y - e.baseH * tuning.enemyScale * 0.55;
      if (Math.abs(ey - oy) > 140) continue;
      if (Math.abs(dx) < bestD) {
        bestD = Math.abs(dx);
        aimX = e.x;
        aimY = ey;
      }
    }
    this.spawnThrownDagger(ox, oy, aimX, aimY, tuning, 1, false, Math.max(0, ct.assassinDaggerDamage - 1));
    p.assassinThrowCooldown = ct.assassinDaggerCooldown;
    p.assassinThrowTimer = 0.22;
    p.crouching = p.crouching && p.onGround;
    sound.playDaggerThrow();
    this.spawnSparkles(ox, oy, 4, '#a8a29e', '#fafafa', 0.5);
  }

  private assassinProjectileHit(proj: Projectile, target: Enemy, tuning: TuningConfig): void {
    const p = this.player;
    const ct = this.charTune('assassin');
    const weaponLv = 1 + p.weaponDamageBonus;
    const hitX = target.x;
    const hitY = target.y - target.baseH * tuning.enemyScale * 0.55;
    if (proj.kind === 'venom_needle') {
      this.handlePlayerHitEnemy(target, tuning, 'fireball', proj.slotLevel ?? 1, { kbX: 50 });
      if (!target.dead) {
        const evo = this.getSpellEvoTier(proj.slotLevel ?? 1);
        target.poisonTimer = Math.max(target.poisonTimer ?? 0, 4.5 + evo * 1.2);
        target.poisonTickTimer = target.poisonTickTimer ?? 0.6;
        this.spawnSparkles(hitX, hitY, 6, '#4d7c0f', '#bef264', 0.7);
      }
      return;
    }
    // Thrown dagger: executes unaware regular foes; otherwise a real hit that can shove foes into pits.
    const unaware = !target.alerted && !target.isBoss && !proj.color;
    this.handlePlayerHitEnemy(target, tuning, 'weapon', weaponLv, {
      forceAssassinate: unaware && tuning.assassinationEnabled,
      callout: unaware ? 'KNIFE IN THE DARK' : undefined,
      bonusDamage: Math.max(0, proj.damage - 1),
      kbX: 170,
      kbY: 40,
      dirX: proj.vx >= 0 ? 1 : -1,
      assassinViaDagger: true,
    });
    void ct;
    this.spawnSparkles(hitX, hitY, 6, '#d6d3d1', '#fafafa', 0.6);
  }

  /** Jump again in the air: Shadow Blink a short way in the held direction. Passes through foes, stops at solid walls. */
  private tryStartShadowBlink(tuning: TuningConfig): boolean {
    const p = this.player;
    if (p.characterId !== 'assassin' || p.assassinBlinkUsed || p.onGround || p.ledgeGrabActive) return false;
    const ct = this.charTune('assassin');
    const input = this.frameInput;
    let dx = input ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : 0;
    let dy = input ? (input.down ? 1 : 0) - (input.up ? 1 : 0) : 0;
    if (dx === 0 && dy === 0) dx = p.facing;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const dist = Math.max(40, ct.assassinBlinkDistance);
    const scale = tuning.playerScale;
    const halfW = (p.baseW * scale) / 2;
    const h = p.baseH * scale;
    const sx = p.x;
    const sy = p.y;
    let nx = sx;
    let ny = sy;
    const step = 8;
    for (let d = step; d <= dist; d += step) {
      const tx = sx + dx * d;
      const ty = sy + dy * d;
      const rect: Rect = { x: tx - halfW + 2, y: ty - h + 2, w: halfW * 2 - 4, h: h - 4 };
      let blocked = tx < halfW + 4 || tx > this.currentStage.worldWidth - halfW - 4;
      if (!blocked) {
        for (const plat of this.platforms) {
          if (plat.oneWay || !this.isPlatformSolid(plat)) continue;
          if (rectsOverlap(rect, plat)) {
            blocked = true;
            break;
          }
        }
      }
      if (blocked) break;
      nx = tx;
      ny = ty;
    }
    const moved = Math.hypot(nx - sx, ny - sy);
    const trail = Math.max(2, Math.floor(moved / 36));
    for (let i = 0; i <= trail; i++) {
      this.afterimages.push({
        x: sx + ((nx - sx) * i) / trail,
        y: sy + ((ny - sy) * i) / trail,
        facing: p.facing,
        crouching: false,
        color: i % 2 ? '#7f1d1d' : '#1c1917',
        life: 0.26 + i * 0.01,
        maxLife: 0.38,
      });
    }
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: sx + (Math.random() - 0.5) * 16,
        y: sy - Math.random() * h,
        vx: (Math.random() - 0.5) * 80,
        vy: -10 - Math.random() * 50,
        size: 3 + Math.random() * 3,
        color: Math.random() < 0.65 ? '#1c1917' : '#57534e',
        life: 0.42,
        maxLife: 0.42,
        kind: 'dust',
        rotation: 0,
      });
    }
    p.x = nx;
    p.y = ny;
    p.vy = dy < -0.3 ? -150 : dy > 0.3 ? 140 : Math.min(p.vy, 0) * 0.4;
    p.vx = dx * 130;
    if (dx !== 0 && Math.abs(dx) > 0.3) p.facing = dx > 0 ? 1 : -1;
    p.assassinBlinkUsed = true;
    p.assassinBlinkTimer = 0.24;
    p.crouching = false;
    p.invulnTimer = Math.max(p.invulnTimer, ct.assassinBlinkIFrames);
    this.shockwaves.push({ x: nx, y: ny - h * 0.5, radius: 6, maxRadius: 46, color: '#7f1d1d', life: 0.22, maxLife: 0.22 });
    sound.playShadowBlink();
    return true;
  }

  /** Element the Wizard's bolt / spells take: the active Affinity, or pale arcane when none. */
  private getWizardElement(): { id: string; name: string; c1: string; c2: string; root: BaseElementId | null } {
    const p = this.player;
    const def = getActiveElementDef(p.baseElements, p.combinedElement);
    if (!def) return { id: 'arcane', name: 'Arcane', c1: '#8b90b0', c2: '#2a2c40', root: null };
    const root: BaseElementId | null = def.isCombined ? (def.parents?.[0] ?? null) : (def.id as BaseElementId);
    const muted = combatTune(this.effectiveTuning ?? this.tuning).mutedBolts;
    const cols = muted ? mutedBoltColors(p) : { c1: def.primaryColor, c2: def.secondaryColor };
    return { id: def.id, name: def.name, c1: cols.c1, c2: cols.c2, root };
  }


  /** Monk: hold jump on the ground to charge, release to leap. Returns true if a charged/tap jump was performed this frame. */
  private updateMonkChargeJump(
    dt: number,
    input: InputState,
    tuning: TuningConfig,
    effectiveJumpForce: number,
    dropThrough: boolean,
    jumpLocked: boolean,
    chargeTime: number
  ): boolean {
    const p = this.player;
    const scale = tuning.playerScale;
    const ct = this.charTune('monk');
    if (p.characterId !== 'monk') {
      p.monkChargeTimer = 0;
      p.monkCharge = 0;
      return false;
    }

    const canCharge =
      p.onGround &&
      !dropThrough &&
      !jumpLocked &&
      p.monkDashTimer <= 0 &&
      p.ledgeGrabActive === false &&
      p.hitStunTimer <= 0;

    if (canCharge && input.jumpHeld) {
      p.monkChargeTimer += dt;
      p.monkCharge = Math.min(1, p.monkChargeTimer / chargeTime);
      p.crouching = true;
      p.jumpBufferTimer = 0;
      p.coyoteTimer = 0;
      this.spawnMonkChargeFx(tuning, p.monkCharge);
      return true;
    }

    if (canCharge && p.monkChargeTimer > 0 && !input.jumpHeld) {
      const charge = Math.min(1, p.monkChargeTimer / chargeTime);
      const maxMult = Math.max(1, ct.monkChargeJumpMult);
      const mult = 1 + (maxMult - 1) * charge;
      p.vy = -effectiveJumpForce * mult;
      p.onGround = false;
      p.crouching = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.jumpCutApplied = true;
      p.monkChargeTimer = 0;
      p.monkCharge = 0;
      if (p.attackState === 'recovery') p.attackState = 'idle';
      sound.playJump();
      this.triggerShake(2 + charge * 6, 0.1 + charge * 0.1);
      for (let i = 0; i < 6 + Math.floor(charge * 10); i++) {
        const ember = Math.random() < 0.45 + charge * 0.3;
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 22 * scale,
          y: p.y - 2,
          vx: (Math.random() - 0.5) * (70 + charge * 80),
          vy: -20 - Math.random() * (40 + charge * 70),
          size: ember ? 2.2 : 3 + Math.random() * 3,
          color: ember ? (charge > 0.7 ? '#fde68a' : '#ea580c') : '#57534e',
          life: 0.28 + charge * 0.18,
          maxLife: 0.28 + charge * 0.18,
          kind: ember ? 'ember' : 'dust',
          rotation: 0,
        });
      }
      return true;
    }

    if (!input.jumpHeld) {
      p.monkChargeTimer = 0;
      p.monkCharge = 0;
    }
    return false;
  }

  private spawnMonkChargeFx(tuning: TuningConfig, charge: number): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const h = p.crouchBaseH * scale;
    if (Math.random() > 0.35 + charge * 0.5) return;
    const ember = Math.random() < 0.55 + charge * 0.3;
    this.particles.push({
      x: p.x + (Math.random() - 0.5) * 20 * scale,
      y: p.y - Math.random() * h * 0.7,
      vx: (Math.random() - 0.5) * 30,
      vy: -25 - Math.random() * (40 + charge * 50),
      size: ember ? 2 + charge * 2 : 3,
      color: ember ? (charge > 0.75 ? '#fde68a' : '#c2410c') : '#78716c',
      life: 0.28 + charge * 0.22,
      maxLife: 0.28 + charge * 0.22,
      kind: ember ? 'ember' : 'dust',
      rotation: 0,
    });
  }

  /** Second jump in the air starts the Wizard's hover. Once per airtime. */
  private tryStartWizardFloat(tuning: TuningConfig): boolean {
    const p = this.player;
    if (p.characterId !== 'wizard' || p.wizardFloatUsed || p.onGround || p.ledgeGrabActive) return false;
    const ct = this.charTune('wizard');
    const dur = Math.max(0.2, ct.wizardFloatDuration);
    p.wizardFloatTimer = dur;
    p.wizardFloatUsed = true;
    p.vy = 0;
    p.crouching = false;
    sound.playJump();
    this.spawnWizardFloatBurst(tuning);
    return true;
  }

  private spawnWizardFloatBurst(tuning: TuningConfig): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const el = this.getWizardElement();
    const h = p.baseH * scale;
    this.shockwaves.push({
      x: p.x,
      y: p.y - 4,
      radius: 8,
      maxRadius: 52 * scale,
      color: el.c1,
      life: 0.28,
      maxLife: 0.28,
    });
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      this.particles.push({
        x: p.x + Math.cos(a) * 10,
        y: p.y - 6,
        vx: Math.cos(a) * (40 + Math.random() * 50),
        vy: -10 - Math.random() * 30,
        size: 2.4,
        color: i % 2 === 0 ? el.c1 : '#e0e7ff',
        life: 0.4,
        maxLife: 0.4,
        kind: 'energy_wisp',
        rotation: a,
      });
    }
    void h;
  }

  private readMonkDashAim(
    ct: { monkDashDirections: boolean },
    p: Player
  ): { dirX: number; dirY: number; slam: boolean } {
    if (!ct.monkDashDirections) {
      return { dirX: p.facing, dirY: 0, slam: false };
    }
    const input = this.frameInput;
    let dx = 0;
    let dy = 0;
    if (input) {
      dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    }
    if (dx === 0 && dy === 0) {
      return { dirX: p.facing, dirY: 0, slam: false };
    }
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    // Down in the air = slam. On the ground, pure down is a standing slam; a diagonal flattens to a horizontal dash.
    if (dirY > 0.35 && p.onGround) {
      if (Math.abs(dirX) < 0.01) return { dirX: 0, dirY: 1, slam: true };
      return { dirX: Math.sign(dirX), dirY: 0, slam: false };
    }
    const slam = dirY > 0.35 && !p.onGround;
    return { dirX, dirY, slam };
  }

  private doMonkDashSlamImpact(tuning: TuningConfig, weaponLv: number, evoTier: number): void {
    const p = this.player;
    const ct = this.charTune('monk');
    const scale = tuning.playerScale;
    const bodyH = p.baseH * scale;
    const bx = p.x;
    const by = p.y - bodyH * 0.2;
    const r = (130 + evoTier * 28) * scale;
    p.vx *= 0.25;
    p.vy = 0;
    p.invulnTimer = Math.max(p.invulnTimer, 0.12);
    sound.playHammerBoom(evoTier);
    this.triggerShake(10 + evoTier * 3, 0.24);
    this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.03);
    this.shockwaves.push({
      x: bx,
      y: by,
      radius: 12,
      maxRadius: r,
      color: evoTier >= 2 ? '#fde68a' : '#ea580c',
      life: 0.32,
      maxLife: 0.32,
    });
    this.shockwaves.push({
      x: bx,
      y: p.y,
      radius: 8,
      maxRadius: r * 0.7,
      color: '#a8a29e',
      life: 0.22,
      maxLife: 0.22,
    });
    this.spawnSparkles(bx, by, 18 + evoTier * 6, '#ea580c', '#d6d3d1', 1.3);
    for (let i = 0; i < 16; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      this.particles.push({
        x: p.x + dir * Math.random() * 16,
        y: p.y - 2,
        vx: dir * (160 + Math.random() * 240),
        vy: -30 - Math.random() * 80,
        size: 3 + Math.random() * 3,
        color: Math.random() < 0.4 ? '#ea580c' : '#57534e',
        life: 0.4,
        maxLife: 0.4,
        kind: Math.random() < 0.35 ? 'ember' : 'dust',
        rotation: 0,
      });
    }
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
      if (Math.hypot(enemy.x - bx, ey - by) <= r + 14) {
        this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv, {
          kbX: ct.monkDashKnockback * 0.85,
          kbY: 240,
          dirX: enemy.x >= p.x ? 1 : -1,
          bonusDamage: Math.max(0, ct.monkDashDamage - 1),
          stun: 0.6,
          guardBreak: true,
          noAssassinate: true,
        });
      }
    }
  }

  private updateMonkPyreDash(dt: number, tuning: TuningConfig): void {
    const p = this.player;
    const ct = this.charTune('monk');
    const scale = tuning.playerScale;
    const evoTier = this.getWeaponEvoTier();
    const weaponLv = 1 + p.weaponDamageBonus;
    p.monkDashTimer = Math.max(0, p.monkDashTimer - dt);
    p.wallClingDir = 0;
    const speed = ct.monkDashLength / Math.max(0.08, ct.monkDashSec);
    const dirX = p.monkDashDirX;
    const dirY = p.monkDashDirY;
    const wasOnGround = p.onGround;
    if (p.monkDashSlam) {
      // Downward smash: keep some sideways speed and fall hard until we hit the floor.
      p.vx = dirX * speed * (p.onGround ? 0 : 0.55);
      p.vy = Math.max(p.vy, 1080);
      p.invulnTimer = Math.max(p.invulnTimer, 0.1);
      this.applyPlayerPhysics(dt, tuning, false);
    } else {
      p.vx = dirX * speed;
      p.vy = dirY * speed;
      this.applyPlayerPhysics(dt, tuning, false, { noGravity: true });
    }

    // Ash / ember / pale-chi trail
    const trailColor = evoTier >= 2 ? '#fde68a' : evoTier >= 1 ? '#c2410c' : '#a8a29e';
    this.afterimageAccum += dt;
    if (this.afterimageAccum >= 0.022) {
      this.afterimageAccum = 0;
      this.afterimages.push({ x: p.x, y: p.y, facing: p.facing, crouching: false, color: trailColor, life: 0.28, maxLife: 0.28 });
    }
    const bodyH = p.baseH * scale;
    for (let i = 0; i < 3 + evoTier; i++) {
      const ember = Math.random() < 0.3 + evoTier * 0.15;
      this.particles.push({
        x: p.x - p.facing * (Math.random() * 26),
        y: p.y - Math.random() * bodyH * 1.1,
        vx: -p.facing * (40 + Math.random() * 90),
        vy: -30 - Math.random() * 70,
        size: ember ? 2.2 : 3 + Math.random() * 3.5,
        color: ember ? (evoTier >= 2 ? '#fde68a' : '#ea580c') : Math.random() < 0.6 ? '#57534e' : '#d6d3d1',
        life: ember ? 0.5 : 0.42,
        maxLife: ember ? 0.5 : 0.42,
        kind: ember ? 'ember' : 'dust',
        rotation: 0,
      });
    }

    // Tall, wide hitbox that strikes and hurls everything it passes (biased toward dash direction)
    const boxH = bodyH * ct.monkDashHeightMult;
    const boxW = ct.monkDashWidth * scale;
    const box: Rect = {
      x: p.x - boxW / 2 + dirX * boxW * 0.2,
      y: p.y - boxH + Math.min(0, dirY) * boxH * 0.15,
      w: boxW,
      h: boxH,
    };
    for (const enemy of this.enemies) {
      if (enemy.dead || p.monkDashHitIds.has(enemy.id)) continue;
      if (rectsOverlap(box, this.getEnemyRect(enemy, tuning.enemyScale))) {
        p.monkDashHitIds.add(enemy.id);
        this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv, {
          kbX: ct.monkDashKnockback,
          kbY: 170,
          dirX: dirX !== 0 ? (dirX > 0 ? 1 : -1) : p.facing,
          bonusDamage: Math.max(0, ct.monkDashDamage - 1),
          stun: 0.55,
          guardBreak: true,
        });
      }
    }
    for (const sw of this.secretWalls) {
      if (sw.broken) continue;
      const hitId = -9500 - this.secretWalls.indexOf(sw);
      if (!p.monkDashHitIds.has(hitId) && rectsOverlap(box, sw)) {
        p.monkDashHitIds.add(hitId);
        this.damageSecretWall(sw, 1);
      }
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.fromEnemy && proj.x >= box.x && proj.x <= box.x + box.w && proj.y >= box.y && proj.y <= box.y + box.h) {
        this.spawnSparkles(proj.x, proj.y, 6, '#d6d3d1', '#ffffff', 0.7);
        this.projectiles.splice(i, 1);
      }
    }

    // Down-slam: end when we hit the ground (or the timer runs out as a safety net).
    if (p.monkDashSlam && !wasOnGround && p.onGround) {
      p.monkDashTimer = 0;
      this.doMonkDashSlamImpact(tuning, weaponLv, evoTier);
      return;
    }
    if (p.monkDashSlam && p.onGround && wasOnGround) {
      // Started a down-dash already on the floor — immediate shockwave slam.
      p.monkDashTimer = 0;
      this.doMonkDashSlamImpact(tuning, weaponLv, evoTier);
      return;
    }

    // Awakened (5 upgrades): ends in an Ash Burst. Mythic (10): a second, larger burst.
    if (p.monkDashTimer === 0) {
      p.vx = (dirX !== 0 ? Math.sign(dirX) : p.facing) * 90;
      if (p.monkDashSlam) {
        this.doMonkDashSlamImpact(tuning, weaponLv, evoTier);
      } else if (evoTier >= 1) {
        const bursts = evoTier >= 3 ? 3 : evoTier >= 2 ? 2 : 1;
        for (let b = 0; b < bursts; b++) {
          const bx = p.x + p.facing * (20 + b * 40) * scale;
          const by = p.y - bodyH * 0.5;
          const r = (105 + b * 40) * scale;
          this.shockwaves.push({ x: bx, y: by, radius: 10, maxRadius: r, color: b === 0 ? '#ea580c' : '#fde68a', life: 0.28, maxLife: 0.28 });
          this.spawnSparkles(bx, by, 16, '#ea580c', '#d6d3d1', 1.2);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
            if (Math.hypot(enemy.x - bx, ey - by) <= r + 12) {
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv, {
                kbX: 360,
                kbY: 200,
                dirX: enemy.x >= p.x ? 1 : -1,
                stun: 0.5,
                guardBreak: true,
                noAssassinate: true,
              });
            }
          }
        }
        sound.playHammerBoom(evoTier);
        this.triggerShake(9 + evoTier * 2, 0.22);
      }
    }
  }

  private executeWizardNova(tuning: TuningConfig): void {
    const p = this.player;
    const ct = this.charTune('wizard');
    const scale = tuning.playerScale;
    const evoTier = this.getWeaponEvoTier();
    const weaponLv = 1 + p.weaponDamageBonus;
    const el = this.getWizardElement();
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;
    const cx = p.x;
    const cy = p.y - h * 0.5;
    const R = ct.wizardNovaRadius * scale * (1 + evoTier * 0.15);
    p.wizardNovaTimer = 0.34;
    p.attackState = 'idle';
    p.invulnTimer = Math.max(p.invulnTimer, 0.3);
    if (!p.onGround) p.vy = Math.min(p.vy, -80);

    sound.playWizardNova(evoTier);
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.05);
    this.triggerShake(9 + evoTier * 3, 0.24);
    this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.04);
    this.triggerImpactFlash(el.c1, 0.22, cx, cy, 1.4, 0.2);
    this.shockwaves.push({ x: cx, y: cy, radius: 12, maxRadius: R, color: el.c1, life: 0.34, maxLife: 0.34 });
    this.shockwaves.push({ x: cx, y: cy, radius: 8, maxRadius: R * 0.68, color: '#e0e7ff', life: 0.22, maxLife: 0.22 });
    if (evoTier >= 1) {
      this.shockwaves.push({ x: cx, y: cy, radius: 20, maxRadius: R * 1.22, color: el.c2, life: 0.42, maxLife: 0.42 });
    }
    // Dust skirt kicked out along the floor + arcane motes flung outward
    for (let i = 0; i < 28 + evoTier * 10; i++) {
      const a = (Math.PI * 2 * i) / (28 + evoTier * 10);
      const spd = 320 + Math.random() * 220;
      this.particles.push({
        x: cx + Math.cos(a) * 10,
        y: cy + Math.sin(a) * 10,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd * 0.75,
        size: 2.5 + Math.random() * 2,
        color: i % 3 === 0 ? '#e0e7ff' : el.c1,
        life: 0.34,
        maxLife: 0.34,
        kind: 'energy_wisp',
        rotation: 0,
      });
    }
    for (let i = 0; i < 14; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      this.particles.push({
        x: p.x + dir * Math.random() * 12,
        y: p.y - 2,
        vx: dir * (180 + Math.random() * 220),
        vy: -20 - Math.random() * 50,
        size: 3 + Math.random() * 3,
        color: '#57534e',
        life: 0.4,
        maxLife: 0.4,
        kind: 'dust',
        rotation: 0,
      });
    }

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
      const d = Math.hypot(enemy.x - cx, ey - cy);
      if (d > R + enemy.baseW * tuning.enemyScale * 0.5) continue;
      const falloff = 1 - 0.35 * Math.min(1, d / Math.max(1, R));
      this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv, {
        kbX: ct.wizardNovaForce * falloff * (1 + evoTier * 0.1),
        kbY: ct.wizardNovaLift * falloff,
        dirX: enemy.x >= p.x ? 1 : -1,
        bonusDamage: Math.max(0, ct.wizardNovaDamage - 1),
        stun: 0.6,
        guardBreak: true,
        noAssassinate: true,
      });
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj.fromEnemy && Math.hypot(proj.x - cx, proj.y - cy) <= R) {
        this.spawnSparkles(proj.x, proj.y, 6, el.c1, '#ffffff', 0.8);
        this.projectiles.splice(i, 1);
      }
    }
    if (evoCombatTier(p, tuning) >= 3) {
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i + Math.PI / 4;
        this.projectiles.push({
          id: this.nextProjectileId++,
          x: cx + Math.cos(a) * 16,
          y: cy + Math.sin(a) * 16,
          vx: Math.cos(a) * 420,
          vy: Math.sin(a) * 420,
          radius: 8,
          fromEnemy: false,
          damage: 0,
          life: 0.55,
          rotation: 0,
          kind: 'arcane_bolt',
          slotLevel: weaponLv,
          color: el.c1,
          color2: el.c2,
          pierce: true,
          hitIds: [],
          startX: cx,
        });
      }
    }
  }

  private spawnWizardBolt(tuning: TuningConfig): void {
    const p = this.player;
    const ct = this.charTune('wizard');
    const scale = tuning.playerScale;
    const evoTier = this.getWeaponEvoTier();
    const el = this.getWizardElement();
    const h = (p.attackWasCrouching ? p.crouchBaseH : p.baseH) * scale;
    p.wizardBoltCount += 1;
    const overcharged = p.wizardBoltCount % 4 === 0;
    const speed = Math.max(120, ct.wizardBoltSpeed) * (overcharged ? 1.12 : 1);
    const range = ct.wizardBoltRange * scale * (1 + evoTier * 0.1);
    const x = p.x + p.facing * 20 * scale;
    const y = p.y - h * 0.66;
    this.projectiles.push({
      id: this.nextProjectileId++,
      x,
      y,
      vx: p.facing * speed,
      vy: 0,
      radius: (overcharged ? 11 : 7) + evoTier * 1.5,
      fromEnemy: false,
      damage: 0,
      life: range / speed,
      rotation: 0,
      kind: 'arcane_bolt',
      slotLevel: 1 + p.weaponDamageBonus,
      color: el.c1,
      color2: el.c2,
      pierce: overcharged || wizardBoltPierce(evoTier, affFlags(p, tuning)),
      overcharged,
      hitIds: [],
      startX: x,
    });
    if (wizardExtraBolts(evoCombatTier(p, tuning)) > 0) {
      this.projectiles.push({
        id: this.nextProjectileId++,
        x,
        y: y + 14 * scale,
        vx: p.facing * speed * 0.92,
        vy: 30,
        radius: 6 + evoTier,
        fromEnemy: false,
        damage: 0,
        life: range / speed,
        rotation: 0,
        kind: 'arcane_bolt',
        slotLevel: 1 + p.weaponDamageBonus,
        color: el.c1,
        color2: el.c2,
        pierce: wizardBoltPierce(evoTier, affFlags(p, tuning)),
        overcharged: false,
        hitIds: [],
        startX: x,
      });
    }
    p.wizardCastTimer = 0.18;
    sound.playWizardBolt(evoTier, overcharged);
    this.spawnSparkles(x, y, overcharged ? 10 : 5, el.c1, '#e0e7ff', overcharged ? 0.9 : 0.55);
    if (overcharged) {
      this.shockwaves.push({ x, y, radius: 4, maxRadius: 34, color: el.c1, life: 0.16, maxLife: 0.16 });
    }
  }

  private wizardBoltHit(proj: Projectile, target: Enemy, tuning: TuningConfig): void {
    const p = this.player;
    const ct = this.charTune('wizard');
    const root = this.getWizardElement().root;
    const over = Boolean(proj.overcharged);
    let bonus = Math.max(0, ct.wizardBoltDamage - 1) + (over ? 1 : 0);
    if (root === 'light' && target.isBoss) bonus += 1;
    if (root === 'shadow' && !target.alerted) bonus += 1;
    const kb = (over ? 260 : 150) * (root === 'earth' ? 1.6 : 1);
    const dist = Math.abs(target.x - p.x);
    this.handlePlayerHitEnemy(target, tuning, 'weapon', 1 + p.weaponDamageBonus, {
      kbX: kb,
      kbY: over || root === 'earth' ? 130 : 0,
      dirX: proj.vx >= 0 ? 1 : -1,
      bonusDamage: bonus,
      noAssassinate: dist > 95 * tuning.playerScale,
      guardBreak: over || root === 'earth',
    });
    const c1 = proj.color ?? '#a5b4fc';
    this.shockwaves.push({ x: proj.x, y: proj.y, radius: 4, maxRadius: over ? 60 : 32, color: c1, life: 0.18, maxLife: 0.18 });
    this.spawnSparkles(proj.x, proj.y, over ? 12 : 7, c1, proj.color2 ?? '#312e81', over ? 1.0 : 0.7);
    if (root === 'fire') {
      for (const other of this.enemies) {
        if (other.dead || other === target) continue;
        const oy = other.y - (other.baseH * tuning.enemyScale) / 2;
        if (Math.hypot(other.x - proj.x, oy - proj.y) <= 52) this.applyBurn(other, 2.4);
      }
    }
  }

  /** True when a regular enemy stands within `dist` px of a ledge in direction `dir` (no floor beyond). */
  /** True when nothing solid lies beneath (x, y) — i.e. the point hangs over a pit / bottomless gap. */
  private isOverVoid(x: number, y: number): boolean {
    return !this.platforms.some(
      (plat) => this.isPlatformSolid(plat) && x >= plat.x && x <= plat.x + plat.w && plat.y >= y - 10 && plat.w >= 40
    );
  }

  private isNearLedge(enemy: Enemy, dir: number, dist: number, tuning: TuningConfig): boolean {
    const halfW = (enemy.baseW * tuning.enemyScale) / 2;
    let under: Platform | null = null;
    for (const plat of this.platforms) {
      if (!this.isPlatformSolid(plat)) continue;
      if (enemy.x >= plat.x && enemy.x <= plat.x + plat.w && Math.abs(plat.y - enemy.y) <= 12) {
        under = plat;
        break;
      }
    }
    if (!under) return false;
    const edgeX = dir > 0 ? under.x + under.w : under.x;
    const toEdge = (edgeX - enemy.x) * dir - halfW;
    if (toEdge > dist) return false;
    const beyondX = edgeX + dir * 14;
    return !this.platforms.some(
      (plat) => this.isPlatformSolid(plat) && beyondX >= plat.x && beyondX <= plat.x + plat.w && plat.y <= enemy.y + 40 && plat.y + plat.h >= enemy.y - 4
    );
  }

  /** An enemy fell below the level (pit / bottomless gap). Regular foes die; bosses follow General → Fall Death. */
  private handleEnemyFell(enemy: Enemy, tuning: TuningConfig): void {
    const stage = this.currentStage;
    const pitX = enemy.x;
    const pitTopY = stage.floorY + 12;
    // Ash plume rising from the pit mouth
    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: pitX + (Math.random() - 0.5) * 40,
        y: pitTopY + Math.random() * 30,
        vx: (Math.random() - 0.5) * 60,
        vy: -60 - Math.random() * 120,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#44403c' : '#78716c',
        life: 0.7,
        maxLife: 0.7,
        kind: 'dust',
        rotation: 0,
      });
    }
    sound.playPitFall(enemy.isBoss);

    if (enemy.isBoss) {
      const mode = Math.round(tuning.fallDeathBossMode ?? 0);
      const dmg =
        mode === 1 ? enemy.hp : mode === 0 ? Math.max(1, Math.round((enemy.maxHp * (tuning.fallDeathBossDamagePct ?? 25)) / 100)) : 0;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      if (enemy.hp <= 0) {
        this.fallKills += 1;
        enemy.y = stage.floorY;
        this.handleEnemyKilled(enemy, pitX, pitTopY - 20, false, true);
        this.spawnDamageNumber(pitX, pitTopY - 60, 'CAST INTO THE ABYSS', '#e7e5e4', 1.25);
        return;
      }
      // Return the boss to its arena, stunned and briefly protected.
      const minX = stage.bossZoneStartX + 90;
      const maxX = stage.worldWidth - 90;
      enemy.x = Math.max(minX, Math.min(maxX, enemy.homeX));
      enemy.y = enemy.homeY - 40;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.onGround = false;
      enemy.invulnTimer = Math.max(enemy.invulnTimer, 0.9);
      enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.5);
      enemy.flashTimer = 0.3;
      this.spawnSparkles(enemy.x, enemy.y - 40, 16, '#a8a29e', '#ffffff', 1.1);
      if (dmg > 0) this.spawnDamageNumber(enemy.x, enemy.y - 80, `${dmg}`, '#e7e5e4', 1.3, 'FELL');
      return;
    }

    enemy.hp = 0;
    this.fallKills += 1;
    this.handleEnemyKilled(enemy, pitX, pitTopY - 20, false, true);
    this.spawnDamageNumber(pitX, pitTopY - 50, 'INTO THE ABYSS', '#e7e5e4', 1.1, 'FELL');
  }

  private updateGrapple(dt: number, input: InputState, tuning: TuningConfig): void {
    const p = this.player;
    const g = p.grapple;
    const scale = tuning.playerScale;
    g.timer -= dt;

    if (g.phase === 'pulling' && input.jumpJustPressed) {
      g.active = false;
      p.vy = -tuning.jumpForce * 0.85;
      sound.playJump();
      return;
    }

    if (g.timer <= 0) {
      g.active = false;
      return;
    }

    if (g.phase === 'extending') {
      g.x += g.vx * dt;
      g.y += g.vy * dt;

      const dist = Math.hypot(g.x - p.x, g.y - (p.y - p.baseH * scale * 0.6));
      if (dist > g.maxLength) {
        g.active = false;
        return;
      }

      const hookRect: Rect = { x: g.x - 6, y: g.y - 6, w: 12, h: 12 };
      for (const plat of this.platforms) {
        if (rectsOverlap(hookRect, plat)) {
          g.phase = 'pulling';
          g.timer = 0.6;
          this.spawnSparkles(g.x, g.y, 7, '#e2e8f0', '#e5a93c', 0.7);
          sound.playHit();
          return;
        }
      }

      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (rectsOverlap(hookRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
          this.handlePlayerHitEnemy(enemy, tuning, 'grapple', g.slotLevel);
          if (g.slotLevel >= 3) {
            enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, enemy.isBoss ? 0.16 : 0.42);
          }
          // Lv 4+ Chain Slam AoE Shockwave!
          if (g.slotLevel >= 4) {
            const slamR = 96;
            sound.playHammerBoom();
            this.shockwaves.push({
              x: g.x,
              y: g.y,
              radius: 12,
              maxRadius: slamR,
              color: '#cbd5e1',
              life: 0.24,
              maxLife: 0.24,
            });
            for (const other of this.enemies) {
              if (other.dead || other === enemy) continue;
              const oy = other.y - (other.baseH * tuning.enemyScale) / 2;
              if (Math.hypot(other.x - g.x, oy - g.y) <= slamR) {
                this.handlePlayerHitEnemy(other, tuning, 'grapple', g.slotLevel);
              }
            }
          }
          // Lv 5+ Vampiric Reel restores +1 MP!
          if (g.slotLevel >= 5 && p.mp < p.maxMp) {
            p.mp = Math.min(p.maxMp, p.mp + 1);
            this.spawnDamageNumber(p.x, p.y - p.baseH * scale - 18, '+1 MP', '#60a5fa', 0.9, 'SIPHON');
          }
          g.phase = 'pulling';
          g.timer = 0.35;
          return;
        }
      }
    } else {
      const targetX = g.x;
      const targetY = g.y + p.baseH * scale * 0.45;
      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 28) {
        g.active = false;
        p.vy = -340;
        p.vx = p.facing * 120;
        p.airJumpsRemaining = Math.max(p.airJumpsRemaining, Math.min(1, tuning.airJumps));
        p.airBackdashUsed = false;
        return;
      }

      const pullSpeed = 740;
      p.vx = (dx / dist) * pullSpeed;
      p.vy = (dy / dist) * pullSpeed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.onGround = false;
    }
  }

  private useItem(itemId: ItemId, tuning: TuningConfig): void {
    const p = this.player;
    if (p.itemCounts[itemId] <= 0) {
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 12, 'EMPTY', '#94a3b8', 0.8);
      return;
    }

    const h = p.baseH * tuning.playerScale;

    switch (itemId) {
      case 'health_potion': {
        if (p.hp >= p.maxHp) {
          this.spawnDamageNumber(p.x, p.y - h - 12, 'HP FULL', '#f87171', 0.8);
          return;
        }
        p.itemCounts[itemId] -= 1;
        const heal = Math.min(2, p.maxHp - p.hp);
        p.hp += heal;
        sound.playBuff();
        this.spawnSparkles(p.x, p.y - h * 0.5, 12, '#ef4444', '#fecaca', 0.9);
        this.spawnDamageNumber(p.x, p.y - h - 12, `+${heal} HP`, '#f87171', 1.05);
        break;
      }

      case 'mana_potion': {
        if (p.mp >= p.maxMp) {
          this.spawnDamageNumber(p.x, p.y - h - 12, 'MP FULL', '#60a5fa', 0.8);
          return;
        }
        p.itemCounts[itemId] -= 1;
        const gain = Math.min(2, p.maxMp - p.mp);
        p.mp = Math.min(p.maxMp, p.mp + gain);
        sound.playBuff();
        this.spawnSparkles(p.x, p.y - h * 0.5, 12, '#3b82f6', '#bfdbfe', 0.9);
        this.spawnDamageNumber(p.x, p.y - h - 12, `+${gain} MP`, '#60a5fa', 1.05);
        break;
      }

      case 'armor_potion': {
        p.itemCounts[itemId] -= 1;
        p.armorShield = 2;
        p.armorTimer = 14.0;
        sound.playBuff();
        this.spawnSparkles(p.x, p.y - h * 0.5, 14, '#cbd5e1', '#ffffff', 0.9);
        this.spawnDamageNumber(p.x, p.y - h - 12, 'ARMOR +2', '#e2e8f0', 1.05);
        break;
      }
    }
  }

  private useSpecialItem(tuning: TuningConfig): void {
    const p = this.player;
    const id = p.specialItemSlot;
    const def = SPECIAL_ITEMS[id];
    const h = p.baseH * tuning.playerScale;

    if (p.specialItemCounts[id] <= 0) {
      this.spawnDamageNumber(p.x, p.y - h - 14, 'NO CHARGES', '#94a3b8', 0.85);
      return;
    }
    if (p.specialItemCooldown > 0) {
      this.spawnDamageNumber(
        p.x,
        p.y - h - 14,
        `COOLDOWN ${Math.ceil(p.specialItemCooldown)}s`,
        '#c084fc',
        0.85
      );
      return;
    }

    p.specialItemCounts[id] -= 1;
    p.specialItemCooldown = def.cooldown;

    if (id === 'smoke_vial') {
      // SHADOW SMOKE VIAL: Obscuring smoke bomb — instant 3.5s Ambush Stealth + blinds & stuns nearby foes!
      p.ambushTimer = Math.max(p.ambushTimer, 3.5);
      p.shadowChainTimer = Math.max(p.shadowChainTimer, 3.5);
      p.invulnTimer = Math.max(p.invulnTimer, 0.55);
      sound.playGasBreak();
      this.triggerShake(6, 0.2);
      this.shockwaves.push({
        x: p.x,
        y: p.y - h * 0.5,
        radius: 14,
        maxRadius: 210,
        color: '#94a3b8',
        life: 0.36,
        maxLife: 0.36,
      });
      for (let i = 0; i < 24; i++) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 90,
          y: p.y - h * 0.5 + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 140,
          vy: -30 - Math.random() * 80,
          size: 8 + Math.random() * 10,
          color: i % 2 === 0 ? '#64748b' : '#334155',
          life: 0.85,
          maxLife: 0.85,
          kind: 'gas',
          rotation: Math.random() * Math.PI,
        });
      }
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 230) {
          enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, enemy.isBoss ? 0.35 : 1.5);
          if (!enemy.isBoss) enemy.alerted = false;
          this.spawnDamageNumber(enemy.x, enemy.y - 44, 'BLINDED', '#cbd5e1', 0.9);
        }
      }
      this.spawnDamageNumber(p.x, p.y - h - 22, 'SMOKE VIAL!', '#cbd5e1', 1.1, 'AMBUSH STEALTH');
      return;
    }

    if (id === 'fire_bomb') {
      // ALCHEMIST FIRE BOMB: Blazing AoE fire detonation with guard-break & 4s Burn!
      sound.playExplosion(false);
      this.triggerShake(10, 0.28);
      this.triggerImpactFlash('#f97316', 0.42, p.x, p.y - h * 0.5, 1.35, 0.25);
      this.shockwaves.push({
        x: p.x,
        y: p.y - h * 0.5,
        radius: 14,
        maxRadius: 235,
        color: '#f97316',
        life: 0.34,
        maxLife: 0.34,
      });
      this.spawnSparkles(p.x, p.y - h * 0.5, 28, '#f97316', '#fde047', 1.45);
      this.spawnDamageNumber(p.x, p.y - h - 22, 'FIRE BOMB!', '#fb923c', 1.15, 'AOE BURN');
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= 250) {
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          const dmg = 5 + this.getWeaponFlatBonus(1 + p.weaponDamageBonus);
          enemy.shieldActive = false;
          enemy.hp = Math.max(0, enemy.hp - dmg);
          this.raidDamageDealt += dmg;
          enemy.flashTimer = 0.22;
          enemy.hurtStunTimer = enemy.isBoss ? 0.14 : 0.45;
          this.applyBurn(enemy, 4.0);
          this.spawnBloodBurst(enemy.x, ey, enemy.x >= p.x ? 1 : -1, 14, 1.05, 2);
          this.spawnDamageNumber(enemy.x, ey - 16, `${dmg}`, '#fb923c', 1.2, 'BURN');
          if (enemy.hp <= 0) {
            this.handleEnemyKilled(enemy, enemy.x, ey);
          }
        }
      }
      return;
    }

    if (id === 'hero_tag_horn') {
      // PHANTOM TAG HORN: Summon TWO spectral companion heroes simultaneously + heal +1 HP & +2 MP!
      p.hp = Math.min(p.maxHp, p.hp + 1);
      p.mp = Math.min(p.maxMp, p.mp + 2);
      p.invulnTimer = Math.max(p.invulnTimer, 0.75);
      const others = shuffle(
        (['hunter', 'brute', 'ronin', 'minstrel', 'monk', 'wizard', 'assassin'] as CharacterId[]).filter(
          (c) => c !== p.characterId
        )
      );
      this.summonPhantomAlly(others[0], tuning, p.facing * 54);
      this.summonPhantomAlly(others[1], tuning, -p.facing * 54);
      this.triggerShake(10, 0.28);
      this.triggerImpactFlash('#38bdf8', 0.45, p.x, p.y - h * 0.5, 1.5, 0.28);
      this.spawnDamageNumber(p.x, p.y - h - 22, 'PHANTOM TAG-TEAM!', '#38bdf8', 1.25, 'TWIN ECHOES · +1 HP/+2 MP');
      return;
    }

    // ECLIPSE HOURGLASS: 4.2s Time Freeze + Screen-Wide 8 Cataclysm DMG + Burn + +2 MP!
    this.eclipseFreezeTimer = 4.2;
    p.mp = Math.min(p.maxMp, p.mp + 2);
    p.invulnTimer = Math.max(p.invulnTimer, 0.8);

    sound.playBossEnergySprout(false);
    sound.playCrit();
    this.hitstopTimer = Math.max(this.hitstopTimer, 0.22);
    this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.11);
    this.impactFrameTimer = Math.max(this.impactFrameTimer, 0.085);
    this.triggerShake(14, 0.36);
    this.triggerImpactFlash('#c084fc', 0.56, p.x, p.y - h * 0.5, 1.85, 0.34);

    this.shockwaves.push({
      x: p.x,
      y: p.y - h * 0.5,
      radius: 18,
      maxRadius: 480,
      color: '#c084fc',
      life: 0.45,
      maxLife: 0.45,
    });
    this.shockwaves.push({
      x: p.x,
      y: p.y - h * 0.5,
      radius: 12,
      maxRadius: 310,
      color: '#fde047',
      life: 0.34,
      maxLife: 0.34,
    });
    this.spawnSparkles(p.x, p.y - h * 0.5, 34, '#c084fc', '#fde047', 1.75);
    this.spawnDamageNumber(p.x, p.y - h - 22, 'ECLIPSE HOURGLASS!', '#d8b4fe', 1.25, 'TIME SHATTERED · +2 MP');

    // Clear enemy projectiles in view and shatter every nearby enemy!
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (this.projectiles[i].fromEnemy) {
        this.spawnSparkles(this.projectiles[i].x, this.projectiles[i].y, 6, '#c084fc', '#ffffff', 0.8);
        this.projectiles.splice(i, 1);
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      if (Math.abs(enemy.x - p.x) > 760) continue;
      const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
      const dmg = 8;
      enemy.hp = Math.max(0, enemy.hp - dmg);
      enemy.flashTimer = 0.24;
      enemy.hurtStunTimer = enemy.isBoss ? 0.15 : 0.45;
      this.applyBurn(enemy, 4.5);
      this.spawnBloodBurst(enemy.x, ey, enemy.x >= p.x ? 1 : -1, 16, 1.15, 3);
      this.spawnSlashLine(enemy.x, ey, -0.5, 130, 7, '#c084fc', '#ffffff', 0.26);
      this.spawnDamageNumber(enemy.x, ey - 16, `${dmg}`, '#d8b4fe', 1.3, 'ECLIPSE');
      if (enemy.hp <= 0) {
        this.handleEnemyKilled(enemy, enemy.x, ey);
      }
    }
  }

  private grantOrAutoUseItem(
    itemId: ItemId,
    sourceX: number,
    sourceY: number,
    tuning: TuningConfig
  ): void {
    const p = this.player;
    // If this item matches the player's Single Equipped Item Slot [5], store it;
    // otherwise USE IT AUTOMATICALLY on pickup!
    if (p.itemSlots[0] === itemId) {
      p.itemCounts[itemId] += 1;
      const label =
        itemId === 'health_potion'
          ? '+1 HP POTION'
          : itemId === 'mana_potion'
            ? '+1 MP POTION'
            : '+1 ARMOR FLASK';
      this.spawnDamageNumber(sourceX, sourceY - 38, `${label} · +2 SHARDS`, '#e5a93c', 0.95);
      return;
    }

    const h = p.baseH * tuning.playerScale;
    sound.playGem();
    sound.playBuff();
    if (itemId === 'health_potion') {
      const heal = Math.min(2, p.maxHp - p.hp);
      p.hp += heal;
      this.spawnSparkles(p.x, p.y - h * 0.5, 14, '#ef4444', '#fecaca', 1.0);
      this.spawnDamageNumber(
        sourceX,
        sourceY - 38,
        heal > 0 ? `+${heal} HP · +2 SHARDS` : 'HP FULL · +2 SHARDS',
        '#f87171',
        0.95,
        'AUTO-USED POTION'
      );
    } else if (itemId === 'mana_potion') {
      const gain = Math.min(2, p.maxMp - p.mp);
      p.mp += gain;
      this.spawnSparkles(p.x, p.y - h * 0.5, 14, '#3b82f6', '#bfdbfe', 1.0);
      this.spawnDamageNumber(
        sourceX,
        sourceY - 38,
        gain > 0 ? `+${gain} MP · +2 SHARDS` : 'MP FULL · +2 SHARDS',
        '#60a5fa',
        0.95,
        'AUTO-USED POTION'
      );
    } else {
      p.armorShield = Math.max(p.armorShield, 2);
      p.armorTimer = 14.0;
      this.spawnSparkles(p.x, p.y - h * 0.5, 14, '#cbd5e1', '#ffffff', 1.0);
      this.spawnDamageNumber(
        sourceX,
        sourceY - 38,
        'ARMOR +2 · +2 SHARDS',
        '#e2e8f0',
        0.95,
        'AUTO-USED FLASK'
      );
    }
  }

  /** Weapon reach used by mobile auto-attack (matches the swing reach, times the tuning multiplier). */
  private getAutoAttackReach(tuning: TuningConfig): number {
    const p = this.player;
    if (p.weapon === 'spire_staff' || p.weapon === 'arcane_wand' || p.weapon === 'orbiting_grimoire') {
      const ct = this.charTune('wizard');
      return ct.wizardBoltRange * tuning.playerScale * 0.9 * (tuning.mobileAutoAttackRange ?? 1);
    }
    if (p.weapon === 'burst_crossbow') {
      return 390 * tuning.playerScale * (tuning.mobileAutoAttackRange ?? 1);
    }
    if (p.weapon === 'twin_chakram') {
      return 275 * tuning.playerScale * (tuning.mobileAutoAttackRange ?? 1);
    }
    if (p.weapon === 'prism_lance' || p.weapon === 'prism_gauntlets') {
      return (p.weapon === 'prism_lance' ? 240 : 175) * tuning.playerScale * (tuning.mobileAutoAttackRange ?? 1);
    }
    const longReach =
      p.weapon === 'whip' ||
      p.weapon === 'naginata' ||
      p.weapon === 'solar_glaive' ||
      p.weapon === 'ribbon_whip' ||
      p.weapon === 'silk_whip' ||
      p.weapon === 'kusarigama';
    const reachM = attackReachMul(p.weapon, evoCombatTier(p, tuning), affFlags(p, tuning), combatTune(tuning));
    return tuning.attackRange * (longReach ? 1.24 : 1.05) * tuning.playerScale * (tuning.mobileAutoAttackRange ?? 1) * reachM;
  }

  /** True when a hit on this enemy right now would count as a stealth assassination. */
  private isAssassinationPosition(enemy: Enemy, tuning: TuningConfig): boolean {
    const p = this.player;
    if (!tuning.assassinationEnabled || enemy.isBoss || enemy.dead) return false;
    if (p.ambushTimer > 0) return true;
    if (enemy.alerted) return false;
    const isBehindEnemy = (p.x - enemy.x) * enemy.facing < 24;
    const isDrop = !p.onGround && p.y < enemy.y - 22 && Math.abs(p.x - enemy.x) < 145;
    return isBehindEnemy || isDrop;
  }

  /** Enemy (if any) the player can assassinate right now (one swing, or a shadow-step for the Assassin). */
  public findAssassinationTarget(tuning: TuningConfig): Enemy | null {
    const melee = this.findMeleeAssassinationTarget(tuning);
    if (melee) return melee;
    return this.player.characterId === 'assassin' ? this.findAssassinRangedTarget(tuning) : null;
  }

  /** Enemy (if any) the player can assassinate right now with one swing. */
  private findMeleeAssassinationTarget(tuning: TuningConfig): Enemy | null {
    const p = this.player;
    if (this.currentStage.isCamp) return null;
    const reach =
      p.weapon === 'spire_staff' ||
      p.weapon === 'arcane_wand' ||
      p.weapon === 'orbiting_grimoire' ||
      p.weapon === 'burst_crossbow' ||
      p.weapon === 'twin_chakram'
        ? 95 * tuning.playerScale
        : this.getAutoAttackReach(tuning) / Math.max(0.1, tuning.mobileAutoAttackRange ?? 1);
    const pyMid = p.y - (p.crouching ? p.crouchBaseH : p.baseH) * tuning.playerScale * 0.5;
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead || enemy.isBoss) continue;
      const ew = enemy.baseW * tuning.enemyScale * 0.5;
      const eh = enemy.baseH * tuning.enemyScale;
      const absDx = Math.abs(enemy.x - p.x) - ew;
      const dy = Math.abs(enemy.y - eh * 0.5 - pyMid);
      const isDrop = !p.onGround && p.y < enemy.y - 26;
      if (absDx > reach || (!isDrop && dy > Math.max(76, eh * 0.72))) continue;
      if (!this.isAssassinationPosition(enemy, tuning)) continue;
      if (absDx < bestD) {
        bestD = absDx;
        best = enemy;
      }
    }
    return best;
  }

  /**
   * Mobile auto-attack target. Never swings at an unaware enemy (keeps stealth intact) unless
   * the player is in assassination position and Auto-Assassinate is on.
   */
  private findAutoAttackTarget(tuning: TuningConfig, moveInputX: number): Enemy | null {
    const p = this.player;
    const reach = this.getAutoAttackReach(tuning);
    const scale = tuning.playerScale;
    const pyMid = p.y - (p.crouching ? p.crouchBaseH : p.baseH) * scale * 0.5;
    const priority = Math.round(tuning.mobileAutoAttackPriority ?? 0);
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const ew = enemy.baseW * tuning.enemyScale * 0.5;
      const eh = enemy.baseH * tuning.enemyScale;
      const dx = enemy.x - p.x;
      const absDx = Math.abs(dx) - ew;
      const dy = Math.abs(enemy.y - eh * 0.5 - pyMid);
      if (absDx > reach || dy > Math.max(76, eh * 0.72)) continue;

      // Stealth guard
      if (!enemy.alerted) {
        if (!tuning.mobileAutoAssassinate || !this.isAssassinationPosition(enemy, tuning)) continue;
      }

      const inFront = dx * p.facing >= -18;
      // Auto-turn toward a foe behind us unless the player is deliberately running away from it.
      const runningAway = moveInputX !== 0 && Math.sign(dx) !== moveInputX;
      if (!inFront && (priority === 3 || runningAway)) continue;

      let score = absDx + (inFront ? 0 : 35);
      if (priority === 1) score = enemy.hp * 1000 + absDx;
      else if (priority === 2) score = (enemy.isBoss ? 0 : 1e7) - enemy.maxHp * 1000 + absDx;
      if (score < bestScore) {
        bestScore = score;
        best = enemy;
      }
    }
    return best;
  }

  private tryInteract(tuning: TuningConfig): void {
    const target = this.getNearbyInteractable();
    if (!target) {
      // Allow [0] near a Hanging Brazier to snap its chain and drop fire onto foes below!
      const p = this.player;
      for (const b of this.hangingBraziers) {
        if (b.state === 'hanging' && Math.hypot(p.x - b.x, p.y - 28 - b.y) < 110) {
          this.snapHangingBrazier(b);
          return;
        }
      }
      return;
    }

    const p = this.player;
    const h = p.baseH * tuning.playerScale;

    // Reusable Camp & Door stations (do not permanently mark used)
    if (target.kind === 'camp_hero_hunter') {
      this.selectCharacter('hunter', tuning);
      return;
    }
    if (target.kind === 'camp_hero_brute') {
      this.selectCharacter('brute', tuning);
      return;
    }
    if (target.kind === 'camp_hero_ronin') {
      this.selectCharacter('ronin', tuning);
      return;
    }
    if (target.kind === 'camp_hero_minstrel') {
      this.selectCharacter('minstrel', tuning);
      return;
    }
    if (target.kind === 'camp_hero_monk') {
      this.selectCharacter('monk', tuning);
      return;
    }
    if (target.kind === 'camp_hero_wizard') {
      this.selectCharacter('wizard', tuning);
      return;
    }
    if (target.kind === 'camp_hero_assassin') {
      this.selectCharacter('assassin', tuning);
      return;
    }
    if (target.kind === 'camp_hero_ranger') {
      this.selectCharacter('ranger', tuning);
      return;
    }
    if (target.kind === 'camp_hero_vanguard') {
      this.selectCharacter('vanguard', tuning);
      return;
    }
    if (target.kind === 'camp_hero_dancer') {
      this.selectCharacter('dancer', tuning);
      return;
    }
    if (target.kind === 'camp_hero_bouncer') {
      this.selectCharacter('bouncer', tuning);
      return;
    }
    if (target.kind === 'camp_weapon_rack') {
      this.toggleInventory();
      return;
    }
    if (target.kind === 'camp_craft_bench') {
      sound.playInteract();
      this.status = 'CRAFTING';
      return;
    }
    if (target.kind === 'camp_raid_gate') {
      this.openRaidSelect();
      return;
    }
    if (target.kind === 'exit_door') {
      if (target.locked) {
        sound.playInteract();
        this.spawnDamageNumber(target.x, target.y - 100, 'DEFEAT BOSS FIRST', '#f87171', 0.95);
        return;
      }
      sound.playInteract();
      const rooms = this.getCurrentRaidRooms();
      if (this.currentStage.isBigBossRoom) {
        this.raidsCompleted += 1;
        if (this.activeRaidId === 'eclipse_gauntlet') {
          // Conquering the End Boss Gauntlet completes the campaign cycle & unlocks all raids anew!
          this.raidsClearedInRun = [];
          this.raidsClearedCountInRun = 0;
        } else {
          this.raidsClearedCountInRun += 1;
          if (!this.raidsClearedInRun.includes(this.activeRaidId)) {
            this.raidsClearedInRun.push(this.activeRaidId);
          }
        }
        this.rollOfferedRaids();
        this.status = 'VICTORY';
      } else if (this.stageIndex + 1 < rooms.length) {
        const nextIdx = this.stageIndex + 1;
        const nextRoom = rooms[nextIdx];
        const regenSummary =
          p.hpRegenLevel > 0 || p.mpRegenLevel > 0
            ? `Room Regen: ${p.hpRegenLevel > 0 ? `+${p.hpRegenLevel} HP ` : ''}${p.mpRegenLevel > 0 ? `+${p.mpRegenLevel} MP` : ''}`.trim()
            : '';
        this.startRoomTransition(nextRoom.name, regenSummary, () => {
          this.loadStage(nextIdx, tuning, true, true, false);
        });
      }
      return;
    }
    if (target.kind === 'cursed_door') {
      sound.playCursedShrine();
      const rooms = this.getCurrentRaidRooms();
      if (this.stageIndex + 1 < rooms.length) {
        const nextIdx = this.stageIndex + 1;
        const nextRoom = rooms[nextIdx];
        this.startRoomTransition(
          `SHATTERED MIRROR CATHEDRAL · ${nextRoom.name}`,
          'Twisted Gravity · Phantom Reflections · 2x Shards · Mirror Shrine & Extra Boss Core',
          () => {
            this.loadStage(nextIdx, tuning, true, true, true);
          }
        );
      }
      return;
    }

    target.used = true;
    sound.playInteract();

    switch (target.kind) {
      case 'cursed_shrine': {
        sound.playCursedShrine();
        this.spawnSparkles(target.x, target.y - 42, 24, '#67e8f9', '#f472b6', 1.35);
        this.pendingUpgrades = this.buildCursedPactOptions();
        this.upgradePromptTitle = 'Shattered Mirror Shrine — Seal a Forbidden Pact';
        this.status = 'CHOOSING_UPGRADE';
        break;
      }
      case 'secret_cache': {
        sound.playRelicCrystallize(Boolean(target.isBigBossRelic));
        sound.playCoin();
        this.shards += 5;
        p.hp = Math.min(p.maxHp, p.hp + 1);
        p.mp = Math.min(p.maxMp, p.mp + 2);
        this.grantXp(2, target.x, target.y - 68, 'SECRET CACHE');
        this.spawnSparkles(target.x, target.y - 26, 26, '#ffd166', '#c084fc', 1.35);
        if (target.isBigBossRelic) {
          this.openUpgradeDraft('Hidden Alcove Relic — Choose 1 of 3', 'altar');
        } else {
          this.spawnDamageNumber(
            target.x,
            target.y - 46,
            '+5 SHARDS · +1 HP · +2 MP',
            '#ffd166',
            1.15,
            'SECRET TREASURE!'
          );
        }
        break;
      }
      case 'brazier': {
        const gain = Math.min(2, p.maxMp - p.mp);
        p.mp += gain;
        this.spawnSparkles(target.x, target.y - 34, 14, '#60a5fa', '#e0f2fe', 1.0);
        this.spawnDamageNumber(target.x, target.y - 52, '+2 MP', '#60a5fa', 1.05, 'BRAZIER LIT');
        break;
      }
      case 'chest': {
        const isHighRoadCache = target.y < this.currentStage.floorY - 220;
        sound.playChest();
        this.shards += isHighRoadCache ? 3 : 2;
        const roll = Math.random();
        const droppedItem: ItemId =
          roll < 0.45 ? 'health_potion' : roll < 0.78 ? 'mana_potion' : 'armor_potion';
        this.spawnSparkles(target.x, target.y - 16, isHighRoadCache ? 22 : 16, '#e5a93c', '#fff5d6', 1.15);
        this.grantOrAutoUseItem(droppedItem, target.x, target.y, tuning);
        if (isHighRoadCache) {
          this.grantXp(2, target.x, target.y - 62, 'HIGH-ROAD CACHE');
        }
        break;
      }
      case 'boss_relic':
      case 'boss_chest': {
        const relicGlow = target.relicColor ?? '#ffd166';
        sound.playRelicCrystallize(Boolean(target.isBigBossRelic));
        this.shockwaves.push({
          x: target.x,
          y: target.y - 46,
          radius: 14,
          maxRadius: target.isBigBossRelic ? 150 : 105,
          color: relicGlow,
          life: 0.34,
          maxLife: 0.34,
        });
        if (this.currentStage.isBigBossRoom) {
          this.shards += 10;
          this.triggerShake(8, 0.22);
          this.spawnSparkles(target.x, target.y - 44, 34, relicGlow, '#ffffff', 1.55);
          this.spawnDamageNumber(target.x, target.y - 72, '+10 RELIC SHARDS', relicGlow, 1.2, 'GRAND RAID RELIC');
        } else {
          this.triggerShake(5, 0.16);
          this.spawnSparkles(target.x, target.y - 44, 26, relicGlow, '#ffffff', 1.35);
          this.openUpgradeDraft(`${this.currentStage.bossName} Weapon & Spell Relic — Choose 1 of 3`, 'boss');
        }
        break;
      }
      case 'fountain': {
        const hpGain = Math.min(2, p.maxHp - p.hp);
        const mpGain = Math.min(2, p.maxMp - p.mp);
        p.hp += hpGain;
        p.mp += mpGain;
        this.spawnSparkles(p.x, p.y - h * 0.5, 18, '#ef4444', '#60a5fa', 1.1);
        this.spawnDamageNumber(target.x, target.y - 44, '+2 HP / +2 MP', '#f87171', 1.05);
        break;
      }
      case 'shrine': {
        p.fireWeaponTimer = Math.max(p.fireWeaponTimer, 10.0);
        this.spawnSparkles(target.x, target.y - 26, 16, '#f97316', '#fef08a', 1.1);
        this.spawnDamageNumber(target.x, target.y - 48, 'FLAME BLESSING', '#fb923c', 1.05);
        break;
      }
      case 'upgrade_altar': {
        this.spawnSparkles(target.x, target.y - 52, 20, '#ffd166', '#ffffff', 1.2);
        this.openUpgradeDraft('Vitality & Arcane Shrine — Choose 1 of 3', 'altar');
        break;
      }
    }
  }

  private findNearestSafePlatform(x: number): Platform {
    let best = this.platforms[2];
    let bestDist = Infinity;
    for (const plat of this.platforms) {
      if (plat.id.startsWith('wall-') || plat.oneWay) continue;
      if (plat.x <= x) {
        const dist = Math.abs(x - (plat.x + plat.w * 0.5));
        if (dist < bestDist) {
          bestDist = dist;
          best = plat;
        }
      }
    }
    return best;
  }

  private updatePlayerAttack(dt: number, tuning: TuningConfig): void {
    const p = this.player;
    if (p.attackState === 'idle') return;

    if (p.attackState === 'active' && this.attackPulsesLeft > 0) {
      this.attackPulseTimer -= dt;
      if (this.attackPulseTimer <= 0) {
        this.attackPulsesLeft -= 1;
        p.attackHitIds.clear();
        this.attackPulseTimer = 0.1;
        const hPulse = (p.attackWasCrouching ? p.crouchBaseH : p.baseH) * tuning.playerScale;
        this.spawnSparkles(p.x + p.facing * 28 * tuning.playerScale, p.y - hPulse * 0.55, 8, '#e7e5e4', '#fafafa', 0.7);
      }
    }

    const scale = tuning.playerScale;
    const h = (p.attackWasCrouching ? p.crouchBaseH : p.baseH) * scale;

    // Subtle hammer charging sparks while winding up
    if (p.attackState === 'startup' && p.attackWeapon === 'hammer' && Math.random() < 0.45) {
      this.particles.push({
        x: p.x - p.facing * 12 * scale + (Math.random() - 0.5) * 18,
        y: p.y - h - 18 * scale + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 50,
        vy: -30 - Math.random() * 40,
        size: 3.5,
        color: '#fbbf24',
        life: 0.2,
        maxLife: 0.2,
        kind: 'sparkle',
        rotation: Math.random() * Math.PI,
      });
    }

    p.attackTimer -= dt;
    if (p.attackTimer <= 0) {
      if (p.attackState === 'startup') {
        p.attackState = 'active';
        const weaponLv = 1 + p.weaponDamageBonus;
        if (p.attackWeapon === 'hammer') {
          p.attackTimer = Math.max(0.16, (tuning.attackActiveMs / 1000) * 1.25);
          // BIG BOOM shockwave + camera shake + explosion sparkles!
          const boomX = p.x + p.facing * 34 * scale;
          const boomY = p.y - h * 0.32;
          const boomR = tuning.attackRange * scale * (weaponLv >= 4 ? 1.42 : 1.25);
          sound.playHammerBoom();
          this.triggerShake(Math.max(8, tuning.critShakeIntensity * 0.9), 0.25);
          this.spawnSparkles(boomX, boomY, weaponLv >= 4 ? 28 : 22, '#f97316', '#fef08a', 1.45);
          this.shockwaves.push({
            x: boomX,
            y: boomY,
            radius: 16,
            maxRadius: boomR,
            color: p.fireWeaponTimer > 0 ? '#f97316' : '#fbbf24',
            life: 0.24,
            maxLife: 0.24,
          });
          // Tier 4+ Attack Evolution: Hammer Slam releases a forward Seismic Aftershock!
          if (weaponLv >= 4) {
            this.projectiles.push({
              id: this.nextProjectileId++,
              x: boomX,
              y: p.y - 4,
              vx: p.facing * 360,
              vy: 0,
              radius: 14,
              fromEnemy: false,
              damage: 2 + this.getWeaponFlatBonus(weaponLv),
              life: 0.72,
              rotation: 0,
              kind: 'player_quake',
              slotLevel: weaponLv,
            });
          }
        } else if (p.attackWeapon === 'greataxe') {
          p.attackTimer = Math.max(0.14, (tuning.attackActiveMs / 1000) * 1.15);
          sound.playGreataxeSwing();
          if (weaponLv >= 4) sound.playHammerBoom();
          this.triggerShake(6.5, 0.18);
          const axX = p.x + p.facing * 42 * scale;
          const axY = p.y - h * 0.45;
          this.spawnSparkles(axX, axY, weaponLv >= 4 ? 18 : 12, '#ea580c', '#fef08a', 1.25);
          if (weaponLv >= 4) {
            this.shockwaves.push({
              x: axX,
              y: axY,
              radius: 12,
              maxRadius: 96 * scale,
              color: '#ea580c',
              life: 0.22,
              maxLife: 0.22,
            });
          }
        } else if (p.attackWeapon === 'rapier') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 0.78;
          this.spawnSparkles(
            p.x + p.facing * tuning.attackRange * scale * 0.95,
            p.y - h * 0.56,
            weaponLv >= 4 ? 10 : 5,
            '#f43f5e',
            '#fff1f2',
            0.9
          );
        } else if (p.attackWeapon === 'naginata') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 1.1;
          this.spawnSparkles(
            p.x + p.facing * 64 * scale,
            p.y - h * 0.56,
            weaponLv >= 4 ? 12 : 7,
            '#38bdf8',
            '#e0f2fe',
            0.95
          );
        } else if (p.attackWeapon === 'katana') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 1.05;
          if (p.fireWeaponTimer > 0 || weaponLv >= 4) {
            this.spawnSparkles(
              p.x + p.facing * 58 * scale,
              p.y - h * 0.56,
              weaponLv >= 4 ? 12 : 8,
              p.fireWeaponTimer > 0 ? '#f97316' : '#f43f5e',
              '#fff1f2',
              0.95
            );
          }
        } else if (p.attackWeapon === 'ash_wraps') {
          const palm = p.monkComboStep === 2;
          p.attackTimer = (tuning.attackActiveMs / 1000) * (palm ? 0.95 : 0.65);
          const fx = p.x + p.facing * tuning.attackRange * scale * (palm ? 0.95 : 0.75);
          const fy = p.y - h * 0.6;
          this.spawnSparkles(fx, fy, palm ? 10 : 4, palm ? '#e7e5e4' : '#a8a29e', weaponLv >= 6 ? '#ea580c' : '#78716c', palm ? 0.9 : 0.5);
          if (palm) {
            this.shockwaves.push({
              x: fx,
              y: fy,
              radius: 4,
              maxRadius: (40 + this.getWeaponEvoTier() * 16) * scale,
              color: this.getWeaponEvoTier() >= 2 ? '#fde68a' : this.getWeaponEvoTier() >= 1 ? '#ea580c' : '#d6d3d1',
              life: 0.16,
              maxLife: 0.16,
            });
          }
        } else if (p.attackWeapon === 'shadow_daggers') {
          const cross = p.assassinComboStep === 2;
          p.attackTimer = (tuning.attackActiveMs / 1000) * (cross ? 0.95 : 0.55);
          const dEvo = this.getWeaponEvoTier();
          const dx = p.x + p.facing * tuning.attackRange * scale * (cross ? 1.0 : 0.8);
          const dy = p.y - h * 0.58 + (p.assassinComboStep === 1 ? 6 * scale : -2 * scale);
          this.spawnSparkles(dx, dy, cross ? 9 : 4, cross ? '#e7e5e4' : '#a8a29e', weaponLv >= 6 ? '#9f1239' : '#57534e', cross ? 0.85 : 0.5);
          if (cross) {
            this.shockwaves.push({
              x: dx,
              y: dy,
              radius: 4,
              maxRadius: (36 + dEvo * 14) * scale,
              color: dEvo >= 2 ? '#be123c' : '#9f1239',
              life: 0.16,
              maxLife: 0.16,
            });
          }
        } else if (p.attackWeapon === 'spire_staff' || p.attackWeapon === 'arcane_wand') {
          p.attackTimer = 0.06;
          this.spawnWizardBolt(tuning);
        } else if (p.attackWeapon === 'orbiting_grimoire') {
          // Orbiting Grimoire: launches one of the orbiting elemental orbs that EXPLODES on contact!
          p.attackTimer = 0.08;
          const GRIM_CYCLE: BaseElementId[] = ['fire', 'glacial', 'storm', 'venom', 'shadow', 'light'];
          const orbEl = GRIM_CYCLE[p.grimoireElementIndex % GRIM_CYCLE.length];
          const elDef = BASE_ELEMENTS[orbEl];
          const empowered = p.grimoireOrbs > 0;
          if (p.grimoireOrbs > 0) p.grimoireOrbs -= 1;
          sound.playFireball();
          this.projectiles.push({
            id: this.nextProjectileId++,
            x: p.x + p.facing * 26 * scale,
            y: p.y - h * 0.58,
            vx: p.facing * (empowered ? 530 : 450),
            vy: 0,
            radius: empowered ? 12 : 9,
            fromEnemy: false,
            damage: Math.max(2, weaponLv + (empowered ? 1 : 0)),
            life: 1.15,
            rotation: 0,
            kind: 'grimoire_orb',
            color: elDef.primaryColor,
            color2: elDef.glowColor,
            orbElement: orbEl,
            overcharged: empowered,
            slotLevel: weaponLv,
          });
          this.spawnSparkles(p.x + p.facing * 24 * scale, p.y - h * 0.58, 10, elDef.primaryColor, elDef.glowColor, 0.95);
        } else if (p.attackWeapon === 'burst_crossbow') {
          // Dusk Ranger Burst Crossbow: crisp 3-bolt spread fan!
          p.attackTimer = 0.07;
          sound.playDaggerSlash(1, this.getWeaponEvoTier());
          const angles = [-0.09, 0, 0.09];
          for (const a of angles) {
            const spd = 690;
            this.projectiles.push({
              id: this.nextProjectileId++,
              x: p.x + p.facing * 24 * scale,
              y: p.y - h * 0.58,
              vx: Math.cos(a) * spd * p.facing,
              vy: Math.sin(a) * spd,
              radius: 6,
              fromEnemy: false,
              damage: Math.max(1, Math.round(weaponLv * 0.72)),
              life: 0.72,
              rotation: Math.atan2(Math.sin(a) * spd, Math.cos(a) * spd * p.facing),
              kind: 'crossbow_bolt',
              color: '#34d399',
              color2: '#ecfdf5',
              pierce: this.getWeaponEvoTier() >= 2,
              hitIds: [],
              slotLevel: weaponLv,
            });
          }
          this.spawnSparkles(p.x + p.facing * 24 * scale, p.y - h * 0.58, 8, '#10b981', '#fef08a', 0.8);
        } else if (p.attackWeapon === 'twin_chakram') {
          // Sun Blade-Dancer: mid-range looping boomerang Chakram!
          p.attackTimer = 0.07;
          const activeCount = this.projectiles.filter((pr) => !pr.fromEnemy && pr.kind === 'chakram').length;
          if (activeCount < 3) {
            this.projectiles.push({
              id: this.nextProjectileId++,
              x: p.x + p.facing * 24 * scale,
              y: p.y - h * 0.56,
              vx: p.facing * 590,
              vy: 0,
              radius: 15,
              fromEnemy: false,
              damage: Math.max(2, weaponLv),
              life: 1.65,
              rotation: 0,
              kind: 'chakram',
              color: '#fbbf24',
              color2: '#fef3c7',
              returning: false,
              returnAge: 0,
              hitIds: [],
              slotLevel: weaponLv,
            });
            this.spawnSparkles(p.x + p.facing * 24 * scale, p.y - h * 0.56, 9, '#fbbf24', '#ffffff', 0.9);
          }
        } else if (p.attackWeapon === 'prism_lance') {
          // Prism Striker: 8-way directional launch with medium starting reach that expands on every bounce!
          // Starts with 2 bounces, +1 bounce every 5 weapon levels!
          p.attackTimer = 0.05;
          p.crouching = false;
          const totalBounces = 2 + Math.floor(weaponLv / 5);
          const inp = this.frameInput;
          let dirX = inp ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0;
          let dirY = inp ? (inp.down ? 1 : 0) - (inp.up ? 1 : 0) : 0;
          if (dirX !== 0) {
            p.facing = dirX > 0 ? 1 : -1;
          }
          if (dirX === 0 && dirY === 0) {
            dirX = p.facing;
            dirY = -0.14;
          } else if (dirY === 0) {
            // Slight lift on pure horizontal aim so the lunge skims cleanly without scraping the floor
            dirY = -0.14;
          }
          const mag = Math.hypot(dirX, dirY) || 1;
          const launchSpd = 640;
          p.vx = (dirX / mag) * launchSpd;
          p.vy = (dirY / mag) * launchSpd;
          const aimingIntoFloor = dirY > 0 && p.onGround;
          if (aimingIntoFloor) {
            p.y -= 2;
          }
          p.onGround = false;
          p.bounceActive = true;
          p.bouncesLeft = totalBounces;
          p.maxBounces = totalBounces;
          p.bounceCountDone = 0;
          p.bounceDistLeft = 210 * scale;
          p.bounceTimer = 1.6;
          p.bounceSpeed = launchSpd;
          p.bounceHitIds.clear();
          p.bounceWallCooldown = aimingIntoFloor ? 0 : 0.03;
          this.spawnSparkles(p.x, p.y - h * 0.5, 14, '#22d3ee', '#ffffff', 1.15);
        } else if (p.attackWeapon === 'prism_gauntlets') {
          // Prism Pinball Gauntlets: punch + agile short-burst directional ricochet!
          p.attackTimer = (tuning.attackActiveMs / 1000) * 0.72;
          const totalBounces = 2 + Math.floor(weaponLv / 5);
          const inp = this.frameInput;
          let dirX = inp ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0;
          let dirY = inp ? (inp.down ? 1 : 0) - (inp.up ? 1 : 0) : 0;
          if (dirX !== 0) p.facing = dirX > 0 ? 1 : -1;
          if (dirX === 0 && dirY === 0) {
            dirX = p.facing;
            dirY = -0.18;
          } else if (dirY === 0) {
            dirY = -0.16;
          }
          const mag = Math.hypot(dirX, dirY) || 1;
          const launchSpd = 690;
          p.vx = (dirX / mag) * launchSpd;
          p.vy = (dirY / mag) * launchSpd;
          p.onGround = false;
          p.bounceActive = true;
          p.bouncesLeft = totalBounces;
          p.maxBounces = totalBounces;
          p.bounceCountDone = 0;
          p.bounceDistLeft = 148 * scale;
          p.bounceTimer = 1.25;
          p.bounceSpeed = launchSpd;
          p.bounceHitIds.clear();
          p.bounceWallCooldown = 0.025;
          this.spawnSparkles(p.x + p.facing * 26 * scale, p.y - h * 0.55, 14, '#e879f9', '#67e8f9', 1.15);
        } else if (p.attackWeapon === 'solar_glaive') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 1.05;
          this.spawnSparkles(p.x + p.facing * 64 * scale, p.y - h * 0.58, 12, '#f97316', '#fef08a', 1.05);
        } else if (p.attackWeapon === 'shield_mace') {
          p.attackTimer = Math.max(0.14, (tuning.attackActiveMs / 1000) * 1.15);
          sound.playHammerBoom();
          this.triggerShake(5.5, 0.14);
          this.spawnSparkles(p.x + p.facing * 48 * scale, p.y - h * 0.52, 14, '#38bdf8', '#e0f2fe', 1.1);
        } else if (p.attackWeapon === 'kusarigama') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 0.88;
          this.spawnSparkles(p.x + p.facing * tuning.attackRange * scale * 1.35, p.y - h * 0.58, 10, '#f59e0b', '#fef08a', 0.95);
        } else if (p.attackWeapon === 'estoc_spear') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 0.72;
          this.spawnSparkles(p.x + p.facing * tuning.attackRange * scale * 1.0, p.y - h * 0.56, 7, '#e2e8f0', '#38bdf8', 0.85);
        } else if (p.attackWeapon === 'short_blade') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 0.62;
          this.spawnSparkles(p.x + p.facing * tuning.attackRange * scale * 0.65, p.y - h * 0.56, 6, '#cbd5e1', '#f8fafc', 0.75);
        } else if (p.attackWeapon === 'cleaver_greatsword') {
          p.attackTimer = Math.max(0.15, (tuning.attackActiveMs / 1000) * 1.25);
          sound.playGreataxeSwing();
          this.triggerShake(p.weaponChargeTimer > 0.35 ? 9.5 : 6.0, 0.2);
          const cx = p.x + p.facing * 52 * scale;
          const cy = p.y - h * 0.5;
          this.spawnSparkles(cx, cy, p.weaponChargeTimer > 0.35 ? 24 : 14, '#fb923c', '#fef08a', 1.3);
          this.shockwaves.push({
            x: cx,
            y: cy,
            radius: 14,
            maxRadius: (108 + p.weaponChargeTimer * 70) * scale,
            color: '#fb923c',
            life: 0.24,
            maxLife: 0.24,
          });
        } else if (p.attackWeapon === 'joust_lance') {
          p.attackTimer = Math.max(0.14, (tuning.attackActiveMs / 1000) * 1.15);
          sound.playNaginataSlash(this.getWeaponEvoTier());
          this.triggerShake(p.weaponChargeTimer > 0.35 ? 8.5 : 5.0, 0.18);
          const lx = p.x + p.facing * 95 * scale;
          const ly = p.y - h * 0.54;
          this.spawnSparkles(lx, ly, p.weaponChargeTimer > 0.35 ? 22 : 12, '#facc15', '#ffffff', 1.25);
          this.shockwaves.push({
            x: lx,
            y: ly,
            radius: 10,
            maxRadius: (75 + p.weaponChargeTimer * 55) * scale,
            color: '#facc15',
            life: 0.2,
            maxLife: 0.2,
          });
        } else if (p.attackWeapon === 'war_fans') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 0.72;
          this.spawnSparkles(p.x, p.y - h * 0.58, 12, '#2dd4bf', '#ccfbf1', 0.95);
        } else if (p.attackWeapon === 'meteor_flail') {
          p.attackTimer = Math.max(0.18, (tuning.attackActiveMs / 1000) * 1.3);
          const impactX = p.x + p.facing * 72 * scale;
          const impactY = p.y - h * 0.28;
          const blastR = Math.max(118, tuning.attackRange * scale * (weaponLv >= 4 ? 1.55 : 1.38));
          sound.playHammerBoom();
          this.triggerShake(Math.max(9.5, tuning.critShakeIntensity), 0.28);
          this.spawnSparkles(impactX, impactY, 32, '#ef4444', '#fde047', 1.55);
          this.shockwaves.push({
            x: impactX,
            y: impactY,
            radius: 14,
            maxRadius: blastR,
            color: '#ef4444',
            life: 0.28,
            maxLife: 0.28,
          });
          this.shockwaves.push({
            x: impactX,
            y: impactY,
            radius: 8,
            maxRadius: blastR * 0.65,
            color: '#fef08a',
            life: 0.2,
            maxLife: 0.2,
          });
        } else if (p.attackWeapon === 'sword') {
          p.attackTimer = (tuning.attackActiveMs / 1000) * 1.1;
          if (p.fireWeaponTimer > 0 || weaponLv >= 4) {
            this.spawnSparkles(
              p.x + p.facing * 52 * scale,
              p.y - h * 0.56,
              weaponLv >= 4 ? 12 : 8,
              p.fireWeaponTimer > 0 ? '#f97316' : '#93c5fd',
              '#fef08a',
              0.9
            );
          }
        } else {
          p.attackTimer = tuning.attackActiveMs / 1000;
          const whipReach = tuning.attackRange * scale * (weaponLv >= 4 ? 1.08 : 1.0);
          const tipX = p.x + p.facing * (p.baseW * scale * 0.25 + whipReach);
          const tipY = p.y - h * 0.56;
          if (weaponLv >= 4) {
            // Tier 4+ Attack Evolution: Morning Star golden impact burst at Whip tip!
            const burstR = 54 * scale;
            this.shockwaves.push({
              x: tipX,
              y: tipY,
              radius: 8,
              maxRadius: burstR,
              color: p.fireWeaponTimer > 0 ? '#f97316' : '#ffd166',
              life: 0.2,
              maxLife: 0.2,
            });
            this.spawnSparkles(tipX, tipY, 12, '#ffd166', '#ffffff', 1.05);
            for (const enemy of this.enemies) {
              if (enemy.dead || p.attackHitIds.has(enemy.id)) continue;
              const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
              if (Math.hypot(enemy.x - tipX, ey - tipY) <= burstR + 12) {
                p.attackHitIds.add(enemy.id);
                this.handlePlayerHitEnemy(enemy, tuning, 'weapon', weaponLv);
              }
            }
          } else if (p.fireWeaponTimer > 0) {
            this.spawnSparkles(
              p.x + p.facing * tuning.attackRange * scale * 0.7,
              tipY,
              6,
              '#f97316',
              '#fef08a',
              0.7
            );
          }
        }
        this.beginEvoAttackActive(tuning, scale, h);
        if (p.attackWeapon === 'shadow_daggers' && p.assassinComboStep === 2) this.attackPulsesLeft += 1;
      } else if (p.attackState === 'active') {
        p.attackState = 'recovery';
        p.attackTimer =
          p.attackWeapon === 'hammer' || p.attackWeapon === 'meteor_flail'
            ? Math.max(0.18, (tuning.attackRecoveryMs / 1000) * 1.48)
            : p.attackWeapon === 'greataxe' || p.attackWeapon === 'cleaver_greatsword' || p.attackWeapon === 'joust_lance'
              ? Math.max(0.15, (tuning.attackRecoveryMs / 1000) * 1.24)
              : p.attackWeapon === 'rapier' || p.attackWeapon === 'estoc_spear' || p.attackWeapon === 'war_fans'
                ? (tuning.attackRecoveryMs / 1000) * 0.58
                : p.attackWeapon === 'short_blade'
                  ? (tuning.attackRecoveryMs / 1000) * 0.46
                : p.attackWeapon === 'shadow_daggers'
                  ? (tuning.attackRecoveryMs / 1000) * (p.assassinComboStep === 2 ? 0.95 : 0.4)
                : p.attackWeapon === 'ash_wraps'
                  ? (tuning.attackRecoveryMs / 1000) * (p.monkComboStep === 2 ? 1.25 : 0.55)
                  : p.attackWeapon === 'spire_staff' || p.attackWeapon === 'arcane_wand' || p.attackWeapon === 'orbiting_grimoire'
                    ? (tuning.attackRecoveryMs / 1000) * 1.65
                  : p.attackWeapon === 'burst_crossbow'
                    ? Math.max(0.24, (tuning.attackRecoveryMs / 1000) * 2.55)
                  : p.attackWeapon === 'twin_chakram' || p.attackWeapon === 'kusarigama' || p.attackWeapon === 'solar_glaive'
                    ? (tuning.attackRecoveryMs / 1000) * 0.9
                  : p.attackWeapon === 'prism_gauntlets'
                    ? (tuning.attackRecoveryMs / 1000) * 0.55
                  : p.attackWeapon === 'shield_mace'
                    ? Math.max(0.16, (tuning.attackRecoveryMs / 1000) * 1.32)
                : p.attackWeapon === 'katana'
                  ? (tuning.attackRecoveryMs / 1000) * 0.78
                  : p.attackWeapon === 'sword' || p.attackWeapon === 'naginata'
                    ? (tuning.attackRecoveryMs / 1000) * 0.88
                    : tuning.attackRecoveryMs / 1000;
      } else {
        p.attackState = 'idle';
        p.attackTimer = 0;
        p.weaponChargeTimer = 0;
      }
    }
  }

  private applyPlayerPhysics(
    dt: number,
    tuning: TuningConfig,
    ignoreOneWay: boolean,
    opts?: { noGravity?: boolean }
  ): void {
    const p = this.player;
    const scale = tuning.playerScale;
    const halfW = (p.baseW * scale) / 2;
    const h = (p.crouching ? p.crouchBaseH : p.baseH) * scale;

    p.x += p.vx * dt;
    for (const plat of this.platforms) {
      if (plat.oneWay || !this.isPlatformSolid(plat)) continue;
      const pRect: Rect = { x: p.x - halfW, y: p.y - h, w: halfW * 2, h };
      if (rectsOverlap(pRect, plat)) {
        const overlapTop = p.y - plat.y;
        if (overlapTop > 10) {
          if (p.vx > 0) {
            p.x = plat.x - halfW;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.w + halfW;
          }
          p.vx = 0;
        }
      }
    }

    p.x = Math.max(halfW + 4, Math.min(this.currentStage.worldWidth - halfW - 4, p.x));

    const wasOnGround = p.onGround;
    const prevY = p.y;
    const hover = opts?.noGravity || p.wizardFloatTimer > 0;
    if (!hover) {
      // Shattered Mirror Cathedral twists gravity (0.72x); Alien Mothership has crisp low-gravity (0.80x)!
      const realmGravMult =
        this.currentStage.environment === 'mirror_cathedral'
          ? 0.72
          : this.currentStage.environment === 'alien'
            ? 0.80
            : 1.0;
      let effectiveGravity = tuning.gravity * realmGravMult;
      if (!p.onGround && Math.abs(p.vy) < 95) {
        effectiveGravity = tuning.gravity * tuning.apexHangGravityMult * realmGravMult;
      } else if (p.vy > 0) {
        effectiveGravity = tuning.gravity * tuning.fallGravityMult * realmGravMult;
      }
      p.vy = Math.min(tuning.maxFallSpeed, p.vy + effectiveGravity * dt);
    }
    p.y += p.vy * dt;
    p.onGround = false;

    for (const plat of this.platforms) {
      if (!this.isPlatformSolid(plat)) continue;
      if (p.x + halfW <= plat.x + 2 || p.x - halfW >= plat.x + plat.w - 2) {
        continue;
      }

      if (plat.oneWay) {
        if (ignoreOneWay) continue;
        if (p.vy >= 0 && prevY <= plat.y + 8 && p.y >= plat.y) {
          if (plat.style === 'bounce_cap') {
            // Mushroom Kingdom Bouncy Toadstool Pad — launches the hero skyward!
            p.y = plat.y - 2;
            p.vy = -785;
            p.onGround = false;
            p.airJumpsRemaining = Math.max(1, p.airJumpsRemaining);
            sound.playJump();
            this.shockwaves.push({
              x: p.x,
              y: plat.y + 6,
              radius: 10,
              maxRadius: 72,
              color: '#34d399',
              life: 0.24,
              maxLife: 0.24,
            });
            this.spawnSparkles(p.x, plat.y + 2, 14, '#ec4899', '#6ee7b7', 1.15);
            this.spawnDamageNumber(p.x, plat.y - 16, 'BOUNCE!', '#6ee7b7', 0.9);
            continue;
          }
          if (plat.style === 'wind_pad') {
            // Dragon Crane Emerald Updraft Column — lifts hero gracefully onto high pagoda roofs!
            p.y = plat.y - 2;
            p.vy = -735;
            p.onGround = false;
            p.airJumpsRemaining = Math.max(1, p.airJumpsRemaining);
            sound.playBackdash();
            this.shockwaves.push({
              x: p.x,
              y: plat.y + 4,
              radius: 10,
              maxRadius: 78,
              color: '#5eead4',
              life: 0.26,
              maxLife: 0.26,
            });
            this.spawnSparkles(p.x, plat.y + 2, 16, '#34d399', '#fef08a', 1.15);
            this.spawnDamageNumber(p.x, plat.y - 16, 'UPDRAFT!', '#5eead4', 0.9);
            continue;
          }
          p.y = plat.y;
          p.vy = 0;
          p.onGround = true;
          if (plat.crumbling && !this.crumbleStates.has(plat.id)) {
            this.crumbleStates.set(plat.id, { state: 'shaking', timer: 0.68 });
            for (let d = 0; d < 5; d++) {
              this.particles.push({
                x: plat.x + Math.random() * plat.w,
                y: plat.y + plat.h,
                vx: (Math.random() - 0.5) * 35,
                vy: 25 + Math.random() * 45,
                size: 3,
                color: '#a87c5b',
                life: 0.34,
                maxLife: 0.34,
                kind: 'dust',
                rotation: 0,
              });
            }
          }
        }
      } else {
        if (p.vy >= 0 && prevY <= plat.y + 12 && p.y >= plat.y) {
          p.y = plat.y;
          p.vy = 0;
          p.onGround = true;
        } else if (p.vy < 0 && prevY - h >= plat.y + plat.h - 10 && p.y - h <= plat.y + plat.h) {
          p.y = plat.y + plat.h + h;
          p.vy = 0;
        }
      }
    }

    // Trigger smooth 30fps landing compression & dust when touching down from a jump
    if (!wasOnGround && p.onGround) {
      p.landTimer = 0.16;
      p.wizardFloatTimer = 0;
      p.wizardFloatUsed = false;
      p.assassinBlinkUsed = false;
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 18,
          y: p.y - 1,
          vx: (Math.random() - 0.5) * 75,
          vy: -12 - Math.random() * 22,
          size: 3,
          color: '#7a8296',
          life: 0.2,
          maxLife: 0.2,
          kind: 'dust',
          rotation: 0,
        });
      }
    }
  }

  private updateEnemies(baseDt: number, tuning: TuningConfig): void {
    const p = this.player;
    const eScale = tuning.enemyScale;
    const bossStart = this.currentStage.bossZoneStartX;
    const raidScaling = getRaidOrderScaling(this.getRaidOrderTier());
    const pace = raidScaling.chargeSpeedMult * this.getRoomPaceMult();

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;

      // ENEMIES THAT FALL DIE: below the level (pits / bottomless gaps) = kill with full credit.
      if (enemy.y > this.currentStage.worldHeight + 24) {
        if (tuning.fallDeathEnabled !== false) {
          this.handleEnemyFell(enemy, tuning);
          if (enemy.dead) continue;
        } else {
          enemy.x = enemy.homeX;
          enemy.y = enemy.homeY;
          enemy.vx = 0;
          enemy.vy = 0;
        }
      }

      const et = this.enemyTune(enemy);
      // Per-type AI time scale (movement, cooldowns, windups all speed up / slow down together)
      const dt = baseDt * Math.max(0.05, et.speedMult);
      const isFlying = isFlyingEnemyType(enemy.type);

      // Trigger Phase II ENRAGE on Big Bosses at <= 52% HP (tunable per boss)!
      const canEnrage = enemy.isBigBoss || (enemy.isBoss && Boolean(et.phase2OnMiniBoss));
      if (canEnrage && !enemy.enraged && enemy.hp <= enemy.maxHp * (et.phase2At ?? 0.52)) {
        enemy.enraged = true;
        enemy.invulnTimer = Math.max(enemy.invulnTimer, 0.75);
        sound.playExplosion(true);
        this.triggerShake(11, 0.35);
        this.triggerImpactFlash('#ff334b', 0.32, enemy.x, enemy.y - enemy.baseH * eScale * 0.55, 1.35, 0.3);
        this.shockwaves.push({
          x: enemy.x,
          y: enemy.y - enemy.baseH * eScale * 0.5,
          radius: 18,
          maxRadius: 175,
          color: '#ff334b',
          life: 0.35,
          maxLife: 0.35,
        });
        this.spawnDamageNumber(
          enemy.x,
          enemy.y - enemy.baseH * eScale - 24,
          'PHASE II — ENRAGED!',
          '#ff334b',
          1.25
        );
      }

      // Shattered Mirror Cathedral: At <= 60% HP, the room boss refracts a crystalline Phantom Mirror Copy!
      if (
        this.isCursedChamber &&
        enemy.isBoss &&
        !enemy.isMirrorPhantom &&
        !enemy.mirrorSplitDone &&
        enemy.hp <= enemy.maxHp * 0.6
      ) {
        enemy.mirrorSplitDone = true;
        const mirrorX = Math.max(
          this.currentStage.bossZoneStartX + 90,
          Math.min(this.currentStage.worldWidth - 110, enemy.x + (enemy.x > this.player.x ? -155 : 155))
        );
        const phantomHp = Math.max(4, Math.round(enemy.maxHp * 0.32));
        this.enemies.push({
          ...enemy,
          id: this.nextEnemyId++,
          name: `Mirror ${enemy.name}`,
          x: mirrorX,
          homeX: mirrorX,
          facing: (this.player.x < mirrorX ? -1 : 1) as 1 | -1,
          hp: phantomHp,
          maxHp: phantomHp,
          isBoss: false,
          isBigBoss: false,
          summoned: true,
          isMirrorPhantom: true,
          mirrorSplitDone: true,
          alerted: true,
          invulnTimer: 0.35,
          flashTimer: 0.35,
          attackCooldown: 1.0,
          attackChargeTimer: 0,
        });
        this.totalEnemies += 1;
        sound.playCursedShrine();
        this.shockwaves.push({
          x: mirrorX,
          y: enemy.y - enemy.baseH * eScale * 0.5,
          radius: 14,
          maxRadius: 155,
          color: '#67e8f9',
          life: 0.38,
          maxLife: 0.38,
        });
        this.spawnSparkles(mirrorX, enemy.y - enemy.baseH * eScale * 0.5, 26, '#67e8f9', '#f472b6', 1.4);
        this.spawnDamageNumber(
          mirrorX,
          enemy.y - enemy.baseH * eScale - 24,
          'MIRROR REFLECTION!',
          '#67e8f9',
          1.2,
          'SHATTERED CATHEDRAL'
        );
      }

      if (enemy.chillTimer && enemy.chillTimer > 0) {
        enemy.chillTimer = Math.max(0, enemy.chillTimer - dt);
        enemy.vx *= Math.pow(0.28, dt);
      }
      const isChilled = Boolean(enemy.chillTimer && enemy.chillTimer > 0);
      const enemyPace = (enemy.enraged ? pace * (et.enrageSpeed ?? 1.24) : pace) * (isChilled ? 0.58 : 1.0);

      enemy.animTime += dt * (isChilled ? 0.6 : 1.0);
      if (enemy.flashTimer > 0) enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);
      if (enemy.invulnTimer > 0) enemy.invulnTimer = Math.max(0, enemy.invulnTimer - dt);
      if (enemy.alertTimer > 0) enemy.alertTimer = Math.max(0, enemy.alertTimer - dt);
      if (enemy.attackCooldown > 0) enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      if (enemy.attackSwingTimer && enemy.attackSwingTimer > 0) {
        enemy.attackSwingTimer = Math.max(0, enemy.attackSwingTimer - dt);
      }
      if (enemy.type === 'knight' || enemy.type === 'obsidian_guard') {
        enemy.shieldActive =
          enemy.attackChargeTimer <= 0 && enemy.lungeTimer <= 0 && enemy.hurtStunTimer <= 0;
      }

      // Burning Embers DoT ticking!
      if (enemy.burnTimer > 0) {
        enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
        enemy.burnTickTimer -= dt;
        if (enemy.burnTickTimer <= 0) {
          enemy.burnTickTimer = 0.75;
          const bx = enemy.x;
          const by = enemy.y - enemy.baseH * eScale * 0.55;
          enemy.hp = Math.max(0, enemy.hp - 1);
          enemy.flashTimer = 0.1;
          this.spawnSparkles(bx, by, 6, '#f97316', '#fde047', 0.75);
          this.spawnDamageNumber(bx, by - 12, '1', '#fb923c', 0.88, 'BURN');
          if (enemy.hp <= 0) {
            this.handleEnemyKilled(enemy, bx, by);
            continue;
          }
        }
      }

      if (enemy.witherTimer && enemy.witherTimer > 0) {
        enemy.witherTimer = Math.max(0, enemy.witherTimer - dt);
        enemy.witherTickTimer = (enemy.witherTickTimer ?? 0.9) - dt;
        if (enemy.witherTickTimer <= 0) {
          enemy.witherTickTimer = 0.9;
          const wx = enemy.x;
          const wy = enemy.y - enemy.baseH * eScale * 0.55;
          enemy.hp = Math.max(0, enemy.hp - 1);
          enemy.flashTimer = 0.1;
          this.spawnSparkles(wx, wy, 5, '#583e82', '#160d22', 0.7);
          this.spawnDamageNumber(wx, wy - 12, '1', '#7c6ea0', 0.85, 'WITHER');
          if (enemy.hp <= 0) {
            this.handleEnemyKilled(enemy, wx, wy);
            continue;
          }
        }
      }

      // Assassin Venom Needles: poison ticks (no reaction speed-up for the foe, no stacking).
      if (enemy.poisonTimer && enemy.poisonTimer > 0) {
        enemy.poisonTimer = Math.max(0, enemy.poisonTimer - dt);
        enemy.poisonTickTimer = (enemy.poisonTickTimer ?? 0.6) - dt;
        if (enemy.poisonTickTimer <= 0) {
          enemy.poisonTickTimer = 0.6;
          const qx = enemy.x;
          const qy = enemy.y - enemy.baseH * eScale * 0.55;
          enemy.hp = Math.max(0, enemy.hp - (enemy.isBoss ? 1 : 1));
          enemy.flashTimer = 0.08;
          this.spawnSparkles(qx, qy, 4, '#4d7c0f', '#a3e635', 0.55);
          this.spawnDamageNumber(qx, qy - 12, '1', '#84cc16', 0.82, 'POISON');
          if (enemy.hp <= 0) {
            this.handleEnemyKilled(enemy, qx, qy);
            continue;
          }
        }
      }

      // Assassin Mark for Death: the brand burns down; an unspent mark on a regular foe costs a short cooldown.
      if (enemy.markTimer && enemy.markTimer > 0) {
        enemy.markTimer = Math.max(0, enemy.markTimer - dt);
        if (enemy.markTimer === 0) this.onMarkExpired(enemy, tuning);
      }

      if (enemy.hurtStunTimer > 0) {
        enemy.hurtStunTimer = Math.max(0, enemy.hurtStunTimer - dt);
        // Launched foes keep their momentum through the air (so knockback can carry them over pits)
        // and stay helpless until they land.
        const airborneLaunch = !isFlying && !enemy.onGround && !enemy.isBoss;
        if (airborneLaunch) enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.04);
        // Ledge Shove assist: once a launched foe is over open void (nothing solid below it), its carry
        // bleeds off fast so it drops into the pit instead of sailing across narrow gaps.
        const overVoid = airborneLaunch && tuning.ledgeShoveAssist !== false && this.isOverVoid(enemy.x, enemy.y);
        enemy.vx *= Math.pow(overVoid ? 0.004 : airborneLaunch ? 0.5 : 0.04, dt);
        if (isFlying) {
          enemy.x = Math.max(20, Math.min(this.currentStage.worldWidth - 20, enemy.x + enemy.vx * dt));
        }
        if (!enemy.isBoss && enemy.attackChargeTimer > 0) {
          enemy.attackChargeTimer = 0;
          enemy.pendingAttackKind = '';
          enemy.lungeTimer = 0;
        }
        if (!isFlying) {
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
        }
        continue;
      }

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const distX = Math.abs(dx);
      const distY = Math.abs(dy);

      // Hiding spots conceal the hunter from non-boss enemies!
      if (p.isHidden && !enemy.isBoss) {
        if (enemy.alerted && Math.hypot(dx, dy) > tuning.hideBreakDistance) {
          enemy.alerted = false;
          enemy.attackChargeTimer = 0;
          enemy.pendingAttackKind = '';
          enemy.lungeTimer = 0;
        }
      } else if (!enemy.alerted) {
        // Enemies do NOT hear sounds behind their backs — strictly frontal line-of-sight!
        // Vision cones start short on early raids & rooms, and grow longer as raids progress!
        const inFront = dx * enemy.facing > 0;
        const raidVisionScale = enemy.isBoss
          ? 1.0
          : Math.min(
              1.5,
              0.65 +
                (this.getRaidOrderTier() - 1) * 0.18 +
                Math.max(0, this.currentStage.roomNumber - 1) * 0.05
            );
        const crouchStealth = p.crouching && !enemy.isBoss ? tuning.crouchStealthMult : 1.0;
        const chainStealth = p.shadowChainTimer > 0 && !enemy.isBoss ? tuning.chainStealthMult : 1.0;
        const assassinQuiet =
          p.characterId === 'assassin' && !enemy.isBoss
            ? Math.max(0.1, this.charTune('assassin').assassinVisionMult)
            : 1;
        const mirageStealth =
          (p.crouching || p.shadowChainTimer > 0) &&
          !enemy.isBoss &&
          this.hasCharmSynergy('mycelial_mirage')
            ? 0.65
            : 1.0;
        const effectiveVision =
          enemy.visionRange *
          raidVisionScale *
          crouchStealth *
          chainStealth *
          mirageStealth *
          et.visionMult *
          tuning.stealthVisionMult *
          assassinQuiet;
        const canSee = enemy.isBoss
          ? p.x >= bossStart
          : isFlying
            ? inFront && Math.hypot(dx, dy) < effectiveVision
            : inFront && distX < effectiveVision && distY < Math.min(tuning.visionHeight, 88);

        if (canSee) {
          enemy.alerted = true;
          enemy.alertTimer = 0.7;
          enemy.attackCooldown = Math.max(enemy.attackCooldown, et.reactionSec / (pace * 1.15));
          if (!enemy.isBoss) {
            this.spawnDamageNumber(
              enemy.x,
              enemy.y - enemy.baseH * eScale - 16,
              'SPOTTED!',
              '#ef4444',
              0.92
            );
          }
        }
      }

      // Snapshot so the generic windup / cooldown / damage tuning can be applied after the AI switch.
      const prevCooldown = enemy.attackCooldown;
      const prevCharge = enemy.attackChargeTimer;
      const prevProjCount = this.projectiles.length;
      const prevHazardCount = this.groundHazards.length;

      // Alerted non-boss enemies fight with heightened Alert Fury speed!
      const alertFuryPace = !enemy.isBoss && enemy.alerted ? 1.22 : 1.0;
      const startTelegraph = (kind: string, baseDuration: number) => {
        const dur = Math.max(0.22, baseDuration / (enemyPace * alertFuryPace));
        enemy.pendingAttackKind = kind;
        enemy.chargeDuration = dur;
        enemy.attackChargeTimer = dur;
      };

      switch (enemy.type) {
        case 'ghoul': {
          // Castlevania Shambler (2 Attacks): (1) Close Claw Lunge & (2) Mid-Range Leaping Pounce!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'pounce' && enemy.onGround) {
                enemy.vy = -345;
                enemy.vx = enemy.facing * 205;
                enemy.onGround = false;
                enemy.attackCooldown = 1.65 / pace;
              } else {
                enemy.lungeTimer = 0.28;
                enemy.chargeVx = enemy.facing * 205;
                enemy.attackCooldown = 1.55 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted) {
            if (enemy.onGround) {
              if (distX > 20 && distX < 380) {
                enemy.facing = dx >= 0 ? 1 : -1;
                if (enemy.attackCooldown <= 0 && distY < 80) {
                  if (distX < 125) {
                    startTelegraph('lunge', 0.52);
                    enemy.vx = 0;
                  } else if (distX < 245) {
                    startTelegraph('pounce', 0.58);
                    enemy.vx = 0;
                  } else {
                    enemy.vx = enemy.facing * 48;
                  }
                } else {
                  enemy.vx = enemy.facing * 48;
                }
              } else {
                enemy.vx = 0;
              }
            }
          } else {
            this.patrolHorizontal(enemy, 30);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'skeleton': {
          // Castlevania Skeleton (2 Attacks + Hop): (1) Single Fixed-Arc Bone Toss & (2) Twin High-Low Bone Volley (+ defensive Hop)!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'hop' && enemy.onGround) {
                const hopDir = distX < 125 ? -enemy.facing : enemy.facing;
                enemy.vy = -315;
                enemy.vx = hopDir * 110;
                enemy.onGround = false;
                enemy.attackCooldown = 1.2 / pace;
              } else if (enemy.pendingAttackKind === 'bone_double') {
                // Attack 2: Double Bone Volley (one steep arc, one long arc — jump/duck or slash!)
                for (const arc of [
                  { vx: 155, vy: -365 },
                  { vx: 235, vy: -290 },
                ]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 12 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.72,
                    vx: enemy.facing * arc.vx,
                    vy: arc.vy,
                    radius: 7,
                    fromEnemy: true,
                    damage: 1,
                    life: 2.5,
                    rotation: 0,
                    kind: 'bone',
                  });
                }
                enemy.attackCooldown = 1.85 / pace;
              } else {
                // Attack 1: Classic fixed parabolic bone arc
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 12 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.72,
                  vx: enemy.facing * 195,
                  vy: -335,
                  radius: 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.4,
                  rotation: 0,
                  kind: 'bone',
                });
                enemy.attackCooldown = 1.65 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            if (enemy.onGround) {
              enemy.facing = dx >= 0 ? 1 : -1;
              if (distX < 110) {
                enemy.vx = -enemy.facing * 36;
              } else if (distX > 250 && distX < 390) {
                enemy.vx = enemy.facing * 42;
              } else {
                enemy.vx = 0;
              }

              if (enemy.attackCooldown <= 0 && distX < 360 && distY < 135) {
                enemy.stateTimer += 1;
                if (distX < 130 && enemy.stateTimer % 3 === 0) {
                  startTelegraph('hop', 0.42);
                } else if (enemy.stateTimer % 2 === 0) {
                  startTelegraph('bone_double', 0.56);
                } else {
                  startTelegraph('bone', 0.48);
                }
              }
            }
          } else {
            this.patrolHorizontal(enemy, 32);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'bat': {
          // Castlevania Night Bat (2 Attacks): (1) Straight Locked-Angle Dive & (2) Hovering Sonic Screech Orb!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx *= Math.pow(0.05, dt);
            enemy.vy = Math.sin(enemy.animTime * 18) * 14;
            enemy.y += enemy.vy * dt;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'screech') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 10 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.45,
                  vx: enemy.chargeVx,
                  vy: enemy.chargeVy,
                  radius: 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.5,
                  rotation: 0,
                  kind: 'orb',
                });
                enemy.attackCooldown = 1.85 / pace;
              } else {
                enemy.lungeTimer = 0.68;
                enemy.vx = enemy.chargeVx;
                enemy.vy = enemy.chargeVy;
                enemy.attackCooldown = 1.9 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;
            enemy.y = Math.min(this.currentStage.floorY - 14, enemy.y);
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            const hoverY = Math.min(enemy.homeY, p.y - p.baseH * tuning.playerScale - 42);
            const patternY = hoverY + Math.sin(enemy.animTime * 2.2) * 18;
            const desiredVx = distX > 110 ? enemy.facing * 48 : enemy.facing * 24;
            const desiredVy = Math.max(-52, Math.min(52, (patternY - enemy.y) * 1.6));
            enemy.vx += (desiredVx - enemy.vx) * Math.min(1, dt * 2.6);
            enemy.vy += (desiredVy - enemy.vy) * Math.min(1, dt * 2.6);
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;

            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 350) {
              enemy.stateTimer += 1;
              const targetX = p.x;
              const targetY = p.y - p.baseH * tuning.playerScale * 0.5;
              const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
              if (enemy.stateTimer % 2 === 0) {
                // Attack 2: Sonic Screech Orb
                const orbSpeed = 195;
                enemy.chargeVx = Math.cos(angle) * orbSpeed;
                enemy.chargeVy = Math.sin(angle) * orbSpeed;
                startTelegraph('screech', 0.58);
              } else {
                // Attack 1: Straight Locked-Vector Dive
                const diveSpeed = 235;
                enemy.chargeVx = Math.cos(angle) * diveSpeed;
                enemy.chargeVy = Math.sin(angle) * diveSpeed;
                startTelegraph('dive', 0.64);
              }
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 0.86) * (enemy.patrolRadius * 0.48);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 1.9) * 16;
            enemy.facing = Math.cos(enemy.animTime * 0.86) >= 0 ? 1 : -1;
          }
          break;
        }

        case 'knight': {
          // Halberd Knight (2 Attacks): (1) Straight Halberd Rush & (2) Ground-Slam Shockwave!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'stomp') {
                sound.playHammerBoom();
                this.shockwaves.push({
                  x: enemy.x + enemy.facing * 20,
                  y: enemy.y - 6,
                  radius: 8,
                  maxRadius: 68,
                  color: '#f59e0b',
                  life: 0.2,
                  maxLife: 0.2,
                });
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 22,
                  y: enemy.y - 4,
                  vx: enemy.facing * 225,
                  vy: 0,
                  radius: 10,
                  fromEnemy: true,
                  damage: 1,
                  life: 1.45,
                  rotation: 0,
                  kind: 'shockwave',
                });
                enemy.attackCooldown = 1.9 / pace;
              } else {
                enemy.lungeTimer = 0.42;
                enemy.chargeVx = enemy.facing * 230;
                enemy.attackCooldown = 1.85 / pace;
                sound.playHammerCharge();
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 260 && distY < 75 && enemy.onGround) {
              enemy.stateTimer += 1;
              if (distX > 155 || enemy.stateTimer % 2 === 0) {
                startTelegraph('stomp', 0.62);
              } else {
                startTelegraph('charge', 0.6);
              }
              enemy.vx = 0;
            } else if (distX > 32 && distX < 390) {
              enemy.vx = enemy.facing * 52;
            } else {
              enemy.vx = 0;
            }
          } else {
            this.patrolHorizontal(enemy, 34);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'goblin_grunt': {
          // Goblin Raider (2 Attacks): (1) Close Dagger Lunge & (2) Mid-Range Spinning Dagger Throw!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'dagger') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 12 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.56,
                  vx: enemy.facing * 245,
                  vy: -12,
                  radius: 6,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.1,
                  rotation: 0,
                  kind: 'goblin_dagger',
                });
                enemy.attackCooldown = 1.65 / pace;
              } else {
                enemy.lungeTimer = 0.28;
                enemy.chargeVx = enemy.facing * 215;
                enemy.attackCooldown = 1.55 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 280 && distY < 75 && enemy.onGround) {
              if (distX < 140) {
                startTelegraph('lunge', 0.5);
              } else {
                startTelegraph('dagger', 0.54);
              }
              enemy.vx = 0;
            } else if (distX > 22 && distX < 370) {
              enemy.vx = enemy.facing * 58;
            } else {
              enemy.vx = 0;
            }
          } else {
            this.patrolHorizontal(enemy, 36);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'goblin_archer': {
          // Goblin Scout (2 Attacks): (1) Straight Horizontal Arrow & (2) Twin Fanned High-Low Volley!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'arrow_volley') {
                for (const vy of [-58, 32]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 14 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.58,
                    vx: enemy.facing * 255,
                    vy,
                    radius: 6,
                    fromEnemy: true,
                    damage: 1,
                    life: 2.3,
                    rotation: 0,
                    kind: 'goblin_arrow',
                  });
                }
                enemy.attackCooldown = 1.9 / pace;
              } else {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 14 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.56,
                  vx: enemy.facing * 275,
                  vy: 0,
                  radius: 6,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.3,
                  rotation: 0,
                  kind: 'goblin_arrow',
                });
                enemy.attackCooldown = 1.7 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (distX < 115) {
              enemy.vx = -enemy.facing * 34;
            } else if (distX > 290 && distX < 410) {
              enemy.vx = enemy.facing * 36;
            } else {
              enemy.vx = 0;
            }
            if (enemy.attackCooldown <= 0 && distX < 395 && distY < 110 && enemy.onGround) {
              enemy.stateTimer += 1;
              if (enemy.stateTimer % 2 === 0) {
                startTelegraph('arrow_volley', 0.62);
              } else {
                startTelegraph('arrow', 0.56);
              }
            }
          } else {
            this.patrolHorizontal(enemy, 30);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'goblin_bomber': {
          // Goblin Sapper (2 Attacks): (1) High-Arc Powder Bomb & (2) Fast Low-Arc Toss Bomb!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const isLow = enemy.pendingAttackKind === 'bomb_low';
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + enemy.facing * 12 * eScale,
                y: enemy.y - enemy.baseH * eScale * 0.68,
                vx: enemy.facing * (isLow ? 255 : 180),
                vy: isLow ? -185 : -355,
                radius: 8,
                fromEnemy: true,
                damage: 1,
                life: 2.5,
                rotation: 0,
                kind: 'goblin_bomb',
              });
              enemy.pendingAttackKind = '';
              enemy.attackCooldown = 1.9 / pace;
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (distX < 120) {
              enemy.vx = -enemy.facing * 28;
            } else if (distX > 250 && distX < 380) {
              enemy.vx = enemy.facing * 34;
            } else {
              enemy.vx = 0;
            }
            if (enemy.attackCooldown <= 0 && distX < 360 && distY < 130 && enemy.onGround) {
              enemy.stateTimer += 1;
              if (enemy.stateTimer % 2 === 0) {
                startTelegraph('bomb_low', 0.6);
              } else {
                startTelegraph('bomb', 0.64);
              }
            }
          } else {
            this.patrolHorizontal(enemy, 28);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'goblin_shaman': {
          // Goblin Witch-Doctor (2 Attacks): (1) Aimed Hex Orb & (2) Twin Forked Emerald Hex Bolts!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.2) * 14;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'hex_fork') {
                const baseAngle = Math.atan2(enemy.chargeVy, enemy.chargeVx);
                const spd = 190;
                for (const off of [-0.22, 0.22]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 14 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.62,
                    vx: Math.cos(baseAngle + off) * spd,
                    vy: Math.sin(baseAngle + off) * spd,
                    radius: 7,
                    fromEnemy: true,
                    damage: 1,
                    life: 2.7,
                    rotation: 0,
                    kind: 'goblin_hex',
                  });
                }
                enemy.attackCooldown = 2.0 / pace;
              } else {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 14 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.62,
                  vx: enemy.chargeVx,
                  vy: enemy.chargeVy,
                  radius: 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.7,
                  rotation: 0,
                  kind: 'goblin_hex',
                });
                enemy.attackCooldown = 1.85 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            const targetX = enemy.homeX + Math.sin(enemy.animTime * 0.8) * Math.min(85, enemy.patrolRadius * 0.65);
            enemy.x += Math.max(-42, Math.min(42, (targetX - enemy.x) * 1.5)) * dt;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 1.9) * 16;

            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 395) {
              enemy.stateTimer += 1;
              const angle = Math.atan2(
                p.y - p.baseH * tuning.playerScale * 0.5 - (enemy.y - enemy.baseH * eScale * 0.62),
                p.x - enemy.x
              );
              enemy.chargeVx = Math.cos(angle) * 195;
              enemy.chargeVy = Math.sin(angle) * 195;
              if (enemy.stateTimer % 2 === 0) {
                startTelegraph('hex_fork', 0.66);
              } else {
                startTelegraph('hex', 0.6);
              }
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 0.76) * (enemy.patrolRadius * 0.45);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 1.6) * 14;
            enemy.facing = Math.cos(enemy.animTime * 0.76) >= 0 ? 1 : -1;
          }
          break;
        }

        case 'goblin_brute': {
          // Hobgoblin Crusher (2 Attacks): (1) Heavy Bull Charge & (2) Club Ground-Smash Shockwave!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'stomp') {
                sound.playHammerBoom();
                this.shockwaves.push({
                  x: enemy.x + enemy.facing * 20,
                  y: enemy.y - 6,
                  radius: 10,
                  maxRadius: 76,
                  color: '#f97316',
                  life: 0.22,
                  maxLife: 0.22,
                });
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 22,
                  y: enemy.y - 4,
                  vx: enemy.facing * 235,
                  vy: 0,
                  radius: 11,
                  fromEnemy: true,
                  damage: 1,
                  life: 1.5,
                  rotation: 0,
                  kind: 'shockwave',
                });
                enemy.attackCooldown = 1.95 / pace;
              } else {
                enemy.lungeTimer = 0.46;
                enemy.chargeVx = enemy.facing * 235;
                enemy.attackCooldown = 1.95 / pace;
                sound.playHammerCharge();
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 270 && distY < 80 && enemy.onGround) {
              enemy.stateTimer += 1;
              if (distX > 165 || enemy.stateTimer % 2 === 0) {
                startTelegraph('stomp', 0.68);
              } else {
                startTelegraph('charge', 0.66);
              }
              enemy.vx = 0;
            } else if (distX > 34 && distX < 390) {
              enemy.vx = enemy.facing * 42;
            } else {
              enemy.vx = 0;
            }
          } else {
            this.patrolHorizontal(enemy, 28);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_valerius': {
          // Lord Valerius (Nocturne Castle Big Boss): Multi-Phase Crimson Spread, Vampire Leap, Phase II Crimson Waves + Bat Summon!
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'orbs') {
                const speed = enemy.enraged ? 240 : 215;
                const angles = enemy.enraged ? [-0.32, -0.16, 0, 0.16, 0.32] : [-0.18, 0, 0.18];
                for (const a of angles) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 26 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.58,
                    vx: Math.cos(a) * speed * enemy.facing,
                    vy: Math.sin(a) * speed,
                    radius: 8,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.8,
                    rotation: 0,
                    kind: 'orb',
                  });
                }
                sound.playFireball();
                enemy.attackCooldown = 1.65 / enemyPace;
              } else if (enemy.pendingAttackKind === 'eclipse') {
                // Phase II Crimson Blade Wave!
                for (const dy of [-26, 18]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 28 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.5 + dy,
                    vx: enemy.facing * 310,
                    vy: 0,
                    radius: 16,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.3,
                    rotation: 0,
                    kind: 'crimson_wave',
                  });
                }
                if (enemy.enraged) {
                  this.spawnBossMinion('bat', enemy.x - enemy.facing * 60, this.currentStage.floorY - 140);
                }
                sound.playSwordSlash();
                enemy.attackCooldown = 1.75 / enemyPace;
              } else {
                enemy.vy = -445;
                enemy.vx = enemy.facing * 230;
                enemy.onGround = false;
                enemy.attackCooldown = 1.5 / enemyPace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              if (enemy.enraged && enemy.stateTimer % 3 === 0) {
                startTelegraph('eclipse', 0.62);
              } else if (distX > 175 || enemy.stateTimer % 2 === 1) {
                startTelegraph('orbs', 0.62);
              } else {
                startTelegraph('leap', 0.56);
              }
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 110 ? 68 : 30);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_colossus': {
          // Iron Colossus: Slow heavy march -> telegraphed Leaping Shockwave Slam OR Iron Bull Charge
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          const wasAirborne = !enemy.onGround;
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'slam') {
                enemy.vy = -475;
                enemy.vx = enemy.facing * 155;
                enemy.onGround = false;
                enemy.attackCooldown = 1.8 / pace;
              } else {
                enemy.lungeTimer = 0.54;
                enemy.chargeVx = enemy.facing * 265;
                enemy.attackCooldown = 1.7 / pace;
                sound.playHammerCharge();
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              if (enemy.stateTimer % 2 === 1) {
                startTelegraph('slam', 0.68);
              } else {
                startTelegraph('charge', 0.66);
              }
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 110 ? 52 : 24);
            }
          }

          this.applyEnemyGroundPhysics(enemy, dt, tuning);

          if (wasAirborne && enemy.onGround) {
            sound.playHammerBoom();
            this.triggerShake(8, 0.22);
            this.shockwaves.push({
              x: enemy.x,
              y: enemy.y - 8,
              radius: 14,
              maxRadius: 110,
              color: '#f59e0b',
              life: 0.26,
              maxLife: 0.26,
            });
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 24,
                y: enemy.y - 4,
                vx: dir * 225,
                vy: 0,
                radius: 12,
                fromEnemy: true,
                damage: 2,
                life: 1.85,
                rotation: 0,
                kind: 'shockwave',
              });
            }
          }
          break;
        }

        case 'boss_malakor': {
          // Arch-Lich Malakor: Slow levitating hover -> telegraphed Teleport OR 3-Bolt Arcane Spread
          if (!enemy.alerted) break;
          enemy.facing = dx >= 0 ? 1 : -1;
          const desiredY = this.currentStage.floorY - 125 + Math.sin(enemy.animTime * 1.9) * 44;
          enemy.y += (desiredY - enemy.y) * Math.min(1, dt * 2.5);

          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'teleport') {
                this.spawnSparkles(enemy.x, enemy.y - 40, 14, '#e879f9', '#ffffff', 1.1);
                const leftX = bossStart + 180;
                const rightX = this.currentStage.worldWidth - 180;
                enemy.x = Math.abs(enemy.x - leftX) < Math.abs(enemy.x - rightX) ? rightX : leftX;
                this.spawnSparkles(enemy.x, enemy.y - 40, 14, '#e879f9', '#ffffff', 1.1);
                sound.playBackdash();
                enemy.attackCooldown = 1.15 / pace;
              } else {
                const baseAngle = Math.atan2(p.y - 30 - (enemy.y - 45), p.x - enemy.x);
                const speed = 235;
                for (const offset of [-0.24, 0, 0.24]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 20,
                    y: enemy.y - 48,
                    vx: Math.cos(baseAngle + offset) * speed,
                    vy: Math.sin(baseAngle + offset) * speed,
                    radius: 8,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.7,
                    rotation: 0,
                    kind: 'lich_bolt',
                  });
                }
                sound.playFireball();
                enemy.attackCooldown = 1.7 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.attackCooldown <= 0) {
            enemy.stateTimer += 1;
            if (enemy.stateTimer % 3 === 0) {
              startTelegraph('teleport', 0.56);
            } else {
              startTelegraph('bolts', 0.66);
            }
          }
          break;
        }

        case 'boss_goblin_chief': {
          // Chieftain Skar (Goblin Camp Mini-Boss): Slow swagger -> Twin Spinning Daggers OR Cleaver Lunge
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'daggers') {
                for (const vy of [-28, 22]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 20 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.56,
                    vx: enemy.facing * 235,
                    vy,
                    radius: 7,
                    fromEnemy: true,
                    damage: 1,
                    life: 2.4,
                    rotation: 0,
                    kind: 'goblin_dagger',
                  });
                }
                enemy.attackCooldown = 1.65 / pace;
              } else {
                enemy.lungeTimer = 0.42;
                enemy.chargeVx = enemy.facing * 255;
                enemy.attackCooldown = 1.6 / pace;
                sound.playHammerCharge();
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              if (distX > 180 || enemy.stateTimer % 2 === 1) {
                startTelegraph('daggers', 0.62);
              } else {
                startTelegraph('lunge', 0.64);
              }
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 105 ? 58 : 26);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_goblin_shaman': {
          // Hexlord Zog (Goblin Camp Mini-Boss): Slow hovering totem-shaman -> 3-Hex Spread OR Twin Powder Bombs
          if (!enemy.alerted) break;
          enemy.facing = dx >= 0 ? 1 : -1;
          const hoverY = this.currentStage.floorY - 120 + Math.sin(enemy.animTime * 1.75) * 38;
          enemy.y += (hoverY - enemy.y) * Math.min(1, dt * 2.5);
          const anchorX =
            bossStart +
            (this.currentStage.worldWidth - bossStart) * 0.52 +
            Math.sin(enemy.animTime * 0.65) * 140;
          enemy.x += Math.max(-55, Math.min(55, (anchorX - enemy.x) * 1.4)) * dt;

          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'hex_fan') {
                const baseAngle = Math.atan2(p.y - 30 - (enemy.y - 45), p.x - enemy.x);
                const speed = 185;
                for (const offset of [-0.26, 0, 0.26]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 18,
                    y: enemy.y - 45,
                    vx: Math.cos(baseAngle + offset) * speed,
                    vy: Math.sin(baseAngle + offset) * speed,
                    radius: 8,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.8,
                    rotation: 0,
                    kind: 'goblin_hex',
                  });
                }
                sound.playFireball();
                enemy.attackCooldown = 1.75 / pace;
              } else {
                for (const vxMag of [145, 240]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 16,
                    y: enemy.y - 48,
                    vx: enemy.facing * vxMag,
                    vy: -320,
                    radius: 8,
                    fromEnemy: true,
                    damage: 1,
                    life: 2.6,
                    rotation: 0,
                    kind: 'goblin_bomb',
                  });
                }
                enemy.attackCooldown = 1.85 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.attackCooldown <= 0) {
            enemy.stateTimer += 1;
            if (enemy.stateTimer % 2 === 1) {
              startTelegraph('hex_fan', 0.66);
            } else {
              startTelegraph('bomb_rain', 0.68);
            }
          }
          break;
        }

        case 'boss_goblin_warlord': {
          // Warchief Kragmash (Goblin Camp Final Boss): Slow heavy stride -> Shockwave Axe Slam / Warlord Bull Charge / Twin Powder Bombs
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          const wasAirborne = !enemy.onGround;
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'slam') {
                enemy.vy = -485;
                enemy.vx = enemy.facing * 175;
                enemy.onGround = false;
                enemy.attackCooldown = 1.75 / pace;
              } else if (enemy.pendingAttackKind === 'charge') {
                enemy.lungeTimer = 0.52;
                enemy.chargeVx = enemy.facing * 270;
                enemy.attackCooldown = 1.65 / pace;
                sound.playHammerCharge();
              } else {
                for (const vxMag of [155, 260]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 20 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.65,
                    vx: enemy.facing * vxMag,
                    vy: -355,
                    radius: 8,
                    fromEnemy: true,
                    damage: 1,
                    life: 2.6,
                    rotation: 0,
                    kind: 'goblin_bomb',
                  });
                }
                enemy.attackCooldown = 1.8 / pace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const pattern = enemy.stateTimer % 3;
              if (pattern === 1) {
                startTelegraph('slam', 0.68);
              } else if (pattern === 2) {
                startTelegraph('charge', 0.66);
              } else {
                startTelegraph('bombs', 0.64);
              }
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 115 ? 54 : 26);
            }
          }

          this.applyEnemyGroundPhysics(enemy, dt, tuning);

          if (wasAirborne && enemy.onGround) {
            sound.playHammerBoom();
            this.triggerShake(9, 0.24);
            this.shockwaves.push({
              x: enemy.x,
              y: enemy.y - 8,
              radius: 16,
              maxRadius: 118,
              color: '#f97316',
              life: 0.26,
              maxLife: 0.26,
            });
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 24,
                y: enemy.y - 4,
                vx: dir * (enemy.enraged ? 280 : 235),
                vy: 0,
                radius: 13,
                fromEnemy: true,
                damage: 2,
                life: 1.9,
                rotation: 0,
                kind: 'shockwave',
              });
            }
            if (enemy.enraged) {
              // Phase II Extra Powder Bombs on slam landing!
              for (const vxMag of [-195, 195]) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x,
                  y: enemy.y - 44,
                  vx: vxMag,
                  vy: -360,
                  radius: 8,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.5,
                  rotation: 0,
                  kind: 'goblin_bomb',
                });
              }
            }
          }
          break;
        }

        // =====================================================================
        // NEW REGULAR ENEMIES (Necropolis & Brimstone Sanctum)
        // =====================================================================
        case 'grave_hound': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'pounce' && enemy.onGround) {
                enemy.vy = -345;
                enemy.vx = enemy.facing * 255;
                enemy.onGround = false;
              } else {
                enemy.lungeTimer = 0.3;
                enemy.chargeVx = enemy.facing * 265;
              }
              enemy.attackCooldown = 1.5 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 250 && distY < 80) {
              startTelegraph(distX > 135 ? 'pounce' : 'lunge', 0.48);
              enemy.vx = 0;
            } else if (distX > 22 && distX < 390) {
              enemy.vx = enemy.facing * 72;
            } else {
              enemy.vx = 0;
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 42);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'wraith': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.4) * 14;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'wail') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 14 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.55,
                  vx: enemy.facing * 210,
                  vy: 0,
                  radius: 12,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.4,
                  rotation: 0,
                  kind: 'banshee_wail',
                });
              } else {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 12 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.58,
                  vx: enemy.chargeVx,
                  vy: enemy.chargeVy,
                  radius: 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.8,
                  rotation: 0,
                  kind: 'soul_skull',
                });
              }
              enemy.attackCooldown = 1.9 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.x += enemy.facing * 36 * dt;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.0) * 18;
            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 380) {
              enemy.stateTimer += 1;
              const angle = Math.atan2(p.y - 34 - (enemy.y - 26), p.x - enemy.x);
              enemy.chargeVx = Math.cos(angle) * 175;
              enemy.chargeVy = Math.sin(angle) * 175;
              startTelegraph(enemy.stateTimer % 2 === 0 ? 'wail' : 'hex', 0.6);
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 0.8) * (enemy.patrolRadius * 0.45);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 1.7) * 14;
            enemy.facing = Math.cos(enemy.animTime * 0.8) >= 0 ? 1 : -1;
          }
          break;
        }

        case 'gargoyle':
        case 'ember_imp': {
          const isImp = enemy.type === 'ember_imp';
          if (enemy.attackChargeTimer > 0) {
            enemy.vx *= Math.pow(0.05, dt);
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'shards' || enemy.pendingAttackKind === 'lava') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 10 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.5,
                  vx: enemy.chargeVx,
                  vy: enemy.chargeVy,
                  radius: isImp ? 8 : 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.5,
                  rotation: 0,
                  kind: isImp ? 'lava_orb' : 'stone_shard',
                });
                enemy.attackCooldown = 1.85 / enemyPace;
              } else {
                enemy.lungeTimer = 0.62;
                enemy.vx = enemy.chargeVx;
                enemy.vy = enemy.chargeVy;
                enemy.attackCooldown = 1.9 / enemyPace;
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.x += enemy.vx * dt;
            enemy.y = Math.min(this.currentStage.floorY - 14, enemy.y + enemy.vy * dt);
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            const hoverY = Math.min(enemy.homeY, p.y - 105) + Math.sin(enemy.animTime * 2.2) * 16;
            enemy.x += enemy.facing * 42 * dt;
            enemy.y += (hoverY - enemy.y) * Math.min(1, dt * 2.4);
            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 370) {
              enemy.stateTimer += 1;
              const angle = Math.atan2(p.y - 34 - enemy.y, p.x - enemy.x);
              const spd = enemy.stateTimer % 2 === 0 ? 210 : 250;
              enemy.chargeVx = Math.cos(angle) * spd;
              enemy.chargeVy = Math.sin(angle) * spd;
              startTelegraph(
                enemy.stateTimer % 2 === 0 ? (isImp ? 'lava' : 'shards') : 'dive',
                0.6
              );
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 0.85) * (enemy.patrolRadius * 0.45);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 1.9) * 15;
            enemy.facing = Math.cos(enemy.animTime * 0.85) >= 0 ? 1 : -1;
          }
          break;
        }

        case 'acolyte': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const offsets = enemy.pendingAttackKind === 'hex_fork' ? [-0.2, 0.2] : [0];
              const baseA = Math.atan2(p.y - 36 - (enemy.y - 36), p.x - enemy.x);
              for (const off of offsets) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 14 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.64,
                  vx: Math.cos(baseA + off) * 180,
                  vy: Math.sin(baseA + off) * 180,
                  radius: 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.9,
                  rotation: 0,
                  kind: 'soul_skull',
                });
              }
              enemy.attackCooldown = 1.9 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.vx = distX < 130 ? -enemy.facing * 32 : distX > 280 ? enemy.facing * 36 : 0;
            if (enemy.attackCooldown <= 0 && distX < 390 && distY < 130) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 0 ? 'hex_fork' : 'hex', 0.62);
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 28);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'obsidian_guard': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'lava') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 18 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.56,
                  vx: enemy.facing * 245,
                  vy: -40,
                  radius: 8,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.2,
                  rotation: 0,
                  kind: 'lava_orb',
                });
              } else {
                enemy.lungeTimer = 0.42;
                enemy.chargeVx = enemy.facing * 245;
                sound.playHammerCharge();
              }
              enemy.attackCooldown = 1.8 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 280 && distY < 80) {
              enemy.stateTimer += 1;
              startTelegraph(distX > 155 || enemy.stateTimer % 2 === 0 ? 'lava' : 'charge', 0.6);
              enemy.vx = 0;
            } else if (distX > 32 && distX < 400) {
              enemy.vx = enemy.facing * 50;
            } else {
              enemy.vx = 0;
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 32);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        // =====================================================================
        // NEW UNIQUE MINI-BOSSES & HUGE MULTI-PHASE BIG BOSSES
        // =====================================================================
        case 'boss_vampire_duelist': {
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'blink') {
                this.spawnSparkles(enemy.x, enemy.y - 36, 12, '#f43f5e', '#ffffff', 1.1);
                enemy.x = Math.max(
                  bossStart + 100,
                  Math.min(this.currentStage.worldWidth - 110, p.x + (p.x > enemy.x ? 120 : -120))
                );
                enemy.facing = p.x >= enemy.x ? 1 : -1;
                this.spawnSparkles(enemy.x, enemy.y - 36, 12, '#f43f5e', '#ffffff', 1.1);
                enemy.lungeTimer = 0.28;
                enemy.chargeVx = enemy.facing * 310;
              } else if (enemy.pendingAttackKind === 'eclipse') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 20 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.56,
                  vx: enemy.facing * 285,
                  vy: 0,
                  radius: 14,
                  fromEnemy: true,
                  damage: 2,
                  life: 2.2,
                  rotation: 0,
                  kind: 'crimson_wave',
                });
                sound.playSwordSlash();
              } else {
                enemy.lungeTimer = 0.36;
                enemy.chargeVx = enemy.facing * 295;
                sound.playSwordSlash();
              }
              enemy.attackCooldown = 1.5 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const mod = enemy.stateTimer % 3;
              startTelegraph(mod === 0 ? 'blink' : mod === 1 ? 'lunge' : 'eclipse', 0.54);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 110 ? 74 : 30);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_gargoyle_king':
        case 'boss_pyre_matriarch':
        case 'boss_banshee': {
          if (!enemy.alerted) break;
          const isBanshee = enemy.type === 'boss_banshee';
          const isPyre = enemy.type === 'boss_pyre_matriarch';
          enemy.facing = dx >= 0 ? 1 : -1;
          const hoverY = this.currentStage.floorY - 128 + Math.sin(enemy.animTime * 1.9) * 38;
          const anchorX =
            bossStart +
            (this.currentStage.worldWidth - bossStart) * 0.52 +
            Math.sin(enemy.animTime * 0.72) * 145;
          if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.x += enemy.vx * dt;
            enemy.y = Math.min(this.currentStage.floorY - 16, enemy.y + enemy.vy * dt);
            break;
          }
          enemy.y += (hoverY - enemy.y) * Math.min(1, dt * 2.6);
          enemy.x += Math.max(-62, Math.min(62, (anchorX - enemy.x) * 1.5)) * dt;

          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const baseAngle = Math.atan2(p.y - 34 - (enemy.y - 45), p.x - enemy.x);
              if (enemy.pendingAttackKind === 'dive') {
                enemy.lungeTimer = 0.65;
                enemy.vx = Math.cos(baseAngle) * 285;
                enemy.vy = Math.sin(baseAngle) * 285;
              } else if (isBanshee) {
                for (const off of [-0.22, 0, 0.22]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 18,
                    y: enemy.y - 45,
                    vx: Math.cos(baseAngle + off) * 215,
                    vy: Math.sin(baseAngle + off) * 215,
                    radius: 13,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.5,
                    rotation: 0,
                    kind: 'banshee_wail',
                  });
                }
                sound.playFireball();
              } else {
                for (const off of [-0.28, 0, 0.28]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 18,
                    y: enemy.y - 45,
                    vx: Math.cos(baseAngle + off) * 225,
                    vy: Math.sin(baseAngle + off) * 225,
                    radius: 8,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.6,
                    rotation: 0,
                    kind: isPyre ? 'lava_orb' : 'stone_shard',
                  });
                }
                sound.playFireball();
                if (isPyre) {
                  this.spawnGroundHazard(p.x, 'flame_pillar', 0.78, 52, 135, 2);
                }
              }
              enemy.attackCooldown = 1.65 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.attackCooldown <= 0) {
            enemy.stateTimer += 1;
            const kind =
              enemy.stateTimer % 2 === 0
                ? 'dive'
                : isBanshee
                  ? 'wail'
                  : isPyre
                    ? 'lava'
                    : 'shards';
            startTelegraph(kind, 0.62);
          }
          break;
        }

        case 'boss_goblin_sapper': {
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const speeds = enemy.pendingAttackKind === 'bomb_rain' ? [140, 210, 285] : [170, 250];
              for (const spd of speeds) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 18 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.68,
                  vx: enemy.facing * spd,
                  vy: -365,
                  radius: 9,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.6,
                  rotation: 0,
                  kind: 'goblin_bomb',
                });
              }
              sound.playFireball();
              enemy.attackCooldown = 1.75 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.vx = distX < 140 ? -enemy.facing * 52 : distX > 260 ? enemy.facing * 55 : 0;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 0 ? 'bomb_rain' : 'bomb', 0.6);
              enemy.vx = 0;
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_goblin_behemoth':
        case 'boss_executioner':
        case 'boss_slag_titan':
        case 'boss_cinder_warden':
        case 'boss_infernal_knight': {
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          const isFire =
            enemy.type === 'boss_slag_titan' ||
            enemy.type === 'boss_cinder_warden' ||
            enemy.type === 'boss_infernal_knight';
          const wasAirborne = !enemy.onGround;
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'slam') {
                enemy.vy = -480;
                enemy.vx = enemy.facing * 175;
                enemy.onGround = false;
              } else if (enemy.pendingAttackKind === 'lava') {
                for (const vxMag of [175, 265]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 20 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.62,
                    vx: enemy.facing * vxMag,
                    vy: -240,
                    radius: 9,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.5,
                    rotation: 0,
                    kind: 'lava_orb',
                  });
                }
                sound.playFireball();
                this.spawnGroundHazard(p.x, 'flame_pillar', 0.76, 56, 145, 2);
              } else {
                enemy.lungeTimer = 0.48;
                enemy.chargeVx = enemy.facing * 275;
                sound.playHammerCharge();
              }
              enemy.attackCooldown = 1.68 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const mod = enemy.stateTimer % 3;
              startTelegraph(mod === 0 && isFire ? 'lava' : mod === 1 ? 'slam' : 'charge', 0.64);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 115 ? 56 : 26);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          if (wasAirborne && enemy.onGround) {
            sound.playHammerBoom();
            this.triggerShake(8.5, 0.24);
            this.shockwaves.push({
              x: enemy.x,
              y: enemy.y - 8,
              radius: 14,
              maxRadius: 118,
              color: isFire ? '#f97316' : '#f59e0b',
              life: 0.26,
              maxLife: 0.26,
            });
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 24,
                y: enemy.y - 4,
                vx: dir * 240,
                vy: 0,
                radius: 12,
                fromEnemy: true,
                damage: 2,
                life: 1.85,
                rotation: 0,
                kind: 'shockwave',
              });
            }
          }
          break;
        }

        case 'boss_gravedigger': {
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'tombstone') {
                for (const vxMag of [150, 245]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 20 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.65,
                    vx: enemy.facing * vxMag,
                    vy: -370,
                    radius: 11,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.7,
                    rotation: 0,
                    kind: 'tombstone',
                  });
                }
                sound.playHammerBoom();
                this.spawnGroundHazard(p.x, 'bone_spike', 0.74, 54, 115, 2);
              } else {
                enemy.lungeTimer = 0.44;
                enemy.chargeVx = enemy.facing * 255;
                sound.playHammerCharge();
              }
              enemy.attackCooldown = 1.7 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 1 ? 'tombstone' : 'charge', 0.62);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 110 ? 52 : 24);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_bone_reaver': {
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'scythe') {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 22 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.56,
                  vx: enemy.facing * 310,
                  vy: 0,
                  radius: 15,
                  fromEnemy: true,
                  damage: 2,
                  life: 2.5,
                  rotation: 0,
                  kind: 'bone_scythe',
                  returnTimer: 0.92,
                });
                sound.playSwordSlash();
              } else {
                enemy.vy = -425;
                enemy.vx = enemy.facing * 235;
                enemy.onGround = false;
              }
              enemy.attackCooldown = 1.65 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 1 ? 'scythe' : 'leap', 0.6);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 115 ? 62 : 28);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_necromancer': {
          // Malgrim the Grave-King (Weeping Necropolis HUGE Big Boss):
          // Soul Skull Swarm, Boomerang Bone Scythes, Undead Summon, Phase II Teleport Barrage!
          if (!enemy.alerted) break;
          enemy.facing = dx >= 0 ? 1 : -1;
          const hoverY = this.currentStage.floorY - 122 + Math.sin(enemy.animTime * 1.65) * 34;
          const anchorX =
            bossStart +
            (this.currentStage.worldWidth - bossStart) * 0.52 +
            Math.sin(enemy.animTime * 0.58) * 165;
          enemy.y += (hoverY - enemy.y) * Math.min(1, dt * 2.4);
          enemy.x += Math.max(-55, Math.min(55, (anchorX - enemy.x) * 1.4)) * dt;

          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const baseA = Math.atan2(p.y - 36 - (enemy.y - 62), p.x - enemy.x);
              if (enemy.pendingAttackKind === 'summon') {
                this.spawnBossMinion('skeleton', enemy.x - 95, this.currentStage.floorY);
                if (enemy.enraged) {
                  this.spawnBossMinion('wraith', enemy.x + 95, this.currentStage.floorY - 120);
                }
                sound.playBuff();
              } else if (enemy.pendingAttackKind === 'scythe') {
                for (const dy of enemy.enraged ? [-32, 18] : [0]) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 26,
                    y: enemy.y - 54 + dy,
                    vx: enemy.facing * 320,
                    vy: 0,
                    radius: 16,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.6,
                    rotation: 0,
                    kind: 'bone_scythe',
                    returnTimer: 0.96,
                  });
                }
                sound.playSwordSlash();
              } else if (enemy.pendingAttackKind === 'teleport') {
                this.spawnSparkles(enemy.x, enemy.y - 56, 18, '#2dd4bf', '#ffffff', 1.2);
                const leftX = bossStart + 180;
                const rightX = this.currentStage.worldWidth - 180;
                enemy.x = Math.abs(enemy.x - leftX) < Math.abs(enemy.x - rightX) ? rightX : leftX;
                this.spawnSparkles(enemy.x, enemy.y - 56, 18, '#2dd4bf', '#ffffff', 1.2);
                sound.playBackdash();
              } else {
                const fan = enemy.enraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.24, 0, 0.24];
                for (const off of fan) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 22,
                    y: enemy.y - 58,
                    vx: Math.cos(baseA + off) * 195,
                    vy: Math.sin(baseA + off) * 195,
                    radius: 8,
                    fromEnemy: true,
                    damage: 2,
                    life: 3.1,
                    rotation: 0,
                    kind: 'soul_skull',
                  });
                }
                sound.playFireball();
              }
              enemy.attackCooldown = 1.65 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.attackCooldown <= 0) {
            enemy.stateTimer += 1;
            const pat = enemy.stateTimer % 4;
            if (pat === 0) {
              startTelegraph('summon', 0.68);
            } else if (pat === 1) {
              startTelegraph('hex_fan', 0.62);
            } else if (pat === 2) {
              startTelegraph('scythe', 0.64);
            } else {
              startTelegraph('teleport', 0.52);
            }
          }
          break;
        }

        case 'boss_forge_lord': {
          // Ignis the Forge Lord (Brimstone Sanctum HUGE Big Boss):
          // Colossal Quake Slam + Lava Eruption, Molten Bull Charge, Phase II Ember Imp Summon!
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          const wasAirborne = !enemy.onGround;
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'slam') {
                enemy.vy = -510;
                enemy.vx = enemy.facing * 190;
                enemy.onGround = false;
              } else if (enemy.pendingAttackKind === 'lava') {
                const arcs = enemy.enraged ? [140, 210, 280, 340] : [165, 255];
                for (const vxMag of arcs) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 26 * eScale,
                    y: enemy.y - enemy.baseH * eScale * 0.68,
                    vx: enemy.facing * vxMag,
                    vy: -360,
                    radius: 10,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.6,
                    rotation: 0,
                    kind: 'lava_orb',
                  });
                }
                if (enemy.enraged) {
                  this.spawnBossMinion('ember_imp', enemy.x - enemy.facing * 70, this.currentStage.floorY - 150);
                }
                sound.playFireball();
              } else {
                enemy.lungeTimer = 0.54;
                enemy.chargeVx = enemy.facing * (enemy.enraged ? 305 : 270);
                sound.playHammerCharge();
              }
              enemy.attackCooldown = 1.65 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const pat = enemy.stateTimer % 3;
              startTelegraph(pat === 1 ? 'slam' : pat === 2 ? 'lava' : 'charge', 0.64);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 120 ? 54 : 26);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          if (wasAirborne && enemy.onGround) {
            sound.playHammerBoom();
            this.triggerShake(11, 0.28);
            this.shockwaves.push({
              x: enemy.x,
              y: enemy.y - 8,
              radius: 18,
              maxRadius: 150,
              color: '#f97316',
              life: 0.3,
              maxLife: 0.3,
            });
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 28,
                y: enemy.y - 4,
                vx: dir * (enemy.enraged ? 295 : 245),
                vy: 0,
                radius: 14,
                fromEnemy: true,
                damage: 2,
                life: 2.0,
                rotation: 0,
                kind: 'shockwave',
              });
            }
          }
          break;
        }

        case 'boss_eclipse_overlord': {
          // Draculor · Sovereign of the Blood Eclipse (FINAL BIG BAD END BOSS!)
          // Eclipse Blade Waves, Teleport Cross-Barrage, Meteor Dive Slam, Phase II Soul Skulls + Crimson Storms!
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          const wasAirborne = !enemy.onGround;
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'eclipse') {
                const count = enemy.enraged ? 3 : 2;
                for (let k = 0; k < count; k++) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 32 * eScale,
                    y: enemy.y - enemy.baseH * eScale * (0.28 + k * 0.26),
                    vx: enemy.facing * (enemy.enraged ? 345 : 300),
                    vy: 0,
                    radius: 18,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.4,
                    rotation: 0,
                    kind: 'crimson_wave',
                  });
                }
                sound.playSwordSlash();
              } else if (enemy.pendingAttackKind === 'blink') {
                this.spawnSparkles(enemy.x, enemy.y - 68, 22, '#ff334b', '#ffd166', 1.35);
                const leftX = bossStart + 185;
                const rightX = this.currentStage.worldWidth - 185;
                enemy.x = Math.abs(enemy.x - leftX) < Math.abs(enemy.x - rightX) ? rightX : leftX;
                enemy.facing = p.x >= enemy.x ? 1 : -1;
                this.spawnSparkles(enemy.x, enemy.y - 68, 22, '#ff334b', '#ffd166', 1.35);
                const fan = enemy.enraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.22, 0, 0.22];
                for (const a of fan) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 24,
                    y: enemy.y - 76,
                    vx: Math.cos(a) * 245 * enemy.facing,
                    vy: Math.sin(a) * 245,
                    radius: 9,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.8,
                    rotation: 0,
                    kind: 'orb',
                  });
                }
                sound.playBackdash();
              } else if (enemy.pendingAttackKind === 'slam') {
                enemy.vy = -530;
                enemy.vx = enemy.facing * 245;
                enemy.onGround = false;
              } else {
                // Homing Soul Skulls + Scythe!
                for (const off of [-0.28, 0.28]) {
                  const baseA = Math.atan2(p.y - 36 - (enemy.y - 72), p.x - enemy.x);
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 24,
                    y: enemy.y - 72,
                    vx: Math.cos(baseA + off) * 200,
                    vy: Math.sin(baseA + off) * 200,
                    radius: 9,
                    fromEnemy: true,
                    damage: 2,
                    life: 3.1,
                    rotation: 0,
                    kind: 'soul_skull',
                  });
                }
                sound.playFireball();
              }
              enemy.attackCooldown = 1.55 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const pat = enemy.stateTimer % 4;
              startTelegraph(
                pat === 1 ? 'eclipse' : pat === 2 ? 'slam' : pat === 3 ? 'blink' : 'hex_fan',
                0.58
              );
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 125 ? 70 : 32);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          if (wasAirborne && enemy.onGround) {
            sound.playHammerBoom();
            this.triggerShake(12, 0.3);
            this.shockwaves.push({
              x: enemy.x,
              y: enemy.y - 8,
              radius: 20,
              maxRadius: 165,
              color: '#ff334b',
              life: 0.3,
              maxLife: 0.3,
            });
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 28,
                y: enemy.y - 4,
                vx: dir * (enemy.enraged ? 305 : 255),
                vy: 0,
                radius: 14,
                fromEnemy: true,
                damage: 2,
                life: 2.1,
                rotation: 0,
                kind: 'shockwave',
              });
            }
          }
          break;
        }

        case 'boss_mushroom_sovereign': {
          // Sporelord Amanita · Mycelium Sovereign (Mushroom Kingdom Big Boss)
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          const wasAirborne = !enemy.onGround;
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'spore_volley') {
                const arcs = enemy.enraged ? [-260, -140, -35, 70, 175] : [-210, -85, 45];
                for (const vxOff of arcs) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 20,
                    y: enemy.y - 96,
                    vx: enemy.facing * 175 + vxOff * 0.7,
                    vy: -(330 + Math.abs(vxOff) * 0.4),
                    radius: 11,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.8,
                    rotation: 0,
                    kind: 'orb',
                    color: '#34d399',
                  });
                }
                sound.playFireball();
              } else if (enemy.pendingAttackKind === 'slam') {
                enemy.vy = -515;
                enemy.vx = enemy.facing * 240;
                enemy.onGround = false;
              } else {
                // Toxic spore shockwaves left + right
                for (const dir of [-1, 1] as const) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + dir * 34,
                    y: enemy.y - 10,
                    vx: dir * (enemy.enraged ? 285 : 235),
                    vy: 0,
                    radius: 15,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.2,
                    rotation: 0,
                    kind: 'shockwave',
                    color: '#10b981',
                  });
                }
                sound.playHammerBoom();
              }
              enemy.attackCooldown = 1.6 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const pat = enemy.stateTimer % 3;
              startTelegraph(pat === 1 ? 'spore_volley' : pat === 2 ? 'slam' : 'wave', 0.62);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 140 ? 64 : 26);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          if (wasAirborne && enemy.onGround) {
            sound.playHammerBoom();
            this.triggerShake(11, 0.26);
            this.shockwaves.push({
              x: enemy.x,
              y: enemy.y - 8,
              radius: 18,
              maxRadius: 175,
              color: '#10b981',
              life: 0.34,
              maxLife: 0.34,
            });
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 30,
                y: enemy.y - 6,
                vx: dir * 245,
                vy: 0,
                radius: 14,
                fromEnemy: true,
                damage: 2,
                life: 2.0,
                rotation: 0,
                kind: 'shockwave',
                color: '#34d399',
              });
            }
          }
          break;
        }

        case 'boss_sand_pharaoh': {
          // Pharaoh-Khan Sethra · Dune Sovereign (Sand Fortress Big Boss)
          if (!enemy.alerted) {
            enemy.vx = 0;
            this.applyEnemyGroundPhysics(enemy, dt, tuning);
            break;
          }
          if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.facing * (enemy.enraged ? 430 : 355);
          } else if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'mirage_blink') {
                this.spawnSparkles(enemy.x, enemy.y - 60, 22, '#eab308', '#fef08a', 1.3);
                const leftX = bossStart + 185;
                const rightX = this.currentStage.worldWidth - 185;
                enemy.x = Math.abs(enemy.x - leftX) < Math.abs(enemy.x - rightX) ? rightX : leftX;
                enemy.facing = p.x >= enemy.x ? 1 : -1;
                this.spawnSparkles(enemy.x, enemy.y - 60, 22, '#eab308', '#fef08a', 1.3);
                const fan = enemy.enraged ? [-0.28, -0.14, 0, 0.14, 0.28] : [-0.18, 0, 0.18];
                for (const a of fan) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 26,
                    y: enemy.y - 68,
                    vx: Math.cos(a) * 285 * enemy.facing,
                    vy: Math.sin(a) * 285,
                    radius: 10,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.6,
                    rotation: 0,
                    kind: 'orb',
                    color: '#facc15',
                  });
                }
                sound.playBackdash();
              } else if (enemy.pendingAttackKind === 'khopesh_charge') {
                enemy.lungeTimer = 0.56;
                sound.playSwordSlash();
              } else {
                // Twin Golden Dune Waves
                for (let k = 0; k < (enemy.enraged ? 3 : 2); k++) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 32,
                    y: enemy.y - (32 + k * 46),
                    vx: enemy.facing * (enemy.enraged ? 350 : 295),
                    vy: 0,
                    radius: 16,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.3,
                    rotation: 0,
                    kind: 'crimson_wave',
                    color: '#eab308',
                  });
                }
                sound.playSwordSlash();
              }
              enemy.attackCooldown = 1.55 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              const pat = enemy.stateTimer % 3;
              startTelegraph(pat === 1 ? 'khopesh_charge' : pat === 2 ? 'mirage_blink' : 'solar_wave', 0.56);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 150 ? 78 : 30);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_alien_archon': {
          // Void Archon Xel'Vora · Star Harvester (Hovering Alien Ship Big Boss)
          if (!enemy.alerted) break;
          enemy.facing = dx >= 0 ? 1 : -1;
          const hoverY = this.currentStage.floorY - 195 + Math.sin(this.time * 2.5) * 44;
          const targetX = p.x + (enemy.x >= p.x ? 260 : -260);
          const clampedX = Math.max(bossStart + 140, Math.min(this.currentStage.worldWidth - 140, targetX));
          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'plasma_fan') {
                const baseA = Math.atan2(p.y - 38 - (enemy.y - 60), p.x - enemy.x);
                const fan = enemy.enraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.24, 0, 0.24];
                for (const a of fan) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 24,
                    y: enemy.y - 60,
                    vx: Math.cos(baseA + a) * 285,
                    vy: Math.sin(baseA + a) * 285,
                    radius: 10,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.9,
                    rotation: 0,
                    kind: 'orb',
                    color: '#22d3ee',
                  });
                }
                sound.playFireball();
              } else {
                // Phase-Warp + Ring of Void Orbs!
                this.spawnSparkles(enemy.x, enemy.y - 55, 22, '#06b6d4', '#818cf8', 1.3);
                enemy.x = Math.abs(enemy.x - (bossStart + 220)) < 250 ? this.currentStage.worldWidth - 220 : bossStart + 220;
                this.spawnSparkles(enemy.x, enemy.y - 55, 22, '#06b6d4', '#818cf8', 1.3);
                const count = enemy.enraged ? 8 : 6;
                for (let k = 0; k < count; k++) {
                  const a = (Math.PI * 2 * k) / count;
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x,
                    y: enemy.y - 55,
                    vx: Math.cos(a) * 215,
                    vy: Math.sin(a) * 215,
                    radius: 9,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.7,
                    rotation: 0,
                    kind: 'orb',
                    color: '#818cf8',
                  });
                }
                sound.playBackdash();
              }
              enemy.attackCooldown = 1.5 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else {
            enemy.x += (clampedX - enemy.x) * Math.min(1, dt * 2.2);
            enemy.y += (hoverY - enemy.y) * Math.min(1, dt * 3.0);
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 1 ? 'plasma_fan' : 'warp_ring', 0.56);
            }
          }
          break;
        }

        case 'boss_dragon_crane': {
          // Longhe · Celestial Crane-Wyrm (Soaring Dragon Crane Big Boss)
          if (!enemy.alerted) break;
          enemy.facing = dx >= 0 ? 1 : -1;
          if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.x = Math.max(bossStart + 90, Math.min(this.currentStage.worldWidth - 90, enemy.x + enemy.chargeVx * dt));
            enemy.y = Math.max(420, Math.min(this.currentStage.floorY - 12, enemy.y + enemy.chargeVy * dt));
          } else if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'crane_dive') {
                const angle = Math.atan2(p.y - 30 - enemy.y, p.x - enemy.x);
                const spd = enemy.enraged ? 520 : 440;
                enemy.chargeVx = Math.cos(angle) * spd;
                enemy.chargeVy = Math.sin(angle) * spd;
                enemy.lungeTimer = 0.52;
                sound.playSwordSlash();
              } else {
                // Jade Gale Blade Waves + Celestial Feather Fan
                const baseA = Math.atan2(p.y - 36 - (enemy.y - 52), p.x - enemy.x);
                const fan = enemy.enraged ? [-0.34, -0.17, 0, 0.17, 0.34] : [-0.22, 0, 0.22];
                for (const a of fan) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 28,
                    y: enemy.y - 52,
                    vx: Math.cos(baseA + a) * 320,
                    vy: Math.sin(baseA + a) * 320,
                    radius: 12,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.7,
                    rotation: 0,
                    kind: 'crimson_wave',
                    color: '#34d399',
                  });
                }
                sound.playSwordSlash();
              }
              enemy.attackCooldown = 1.48 / enemyPace;
              enemy.pendingAttackKind = '';
            }
          } else {
            const hoverY = this.currentStage.floorY - 220 + Math.sin(this.time * 3.1) * 52;
            const targetX = p.x + (enemy.x >= p.x ? 250 : -250);
            const clampedX = Math.max(bossStart + 130, Math.min(this.currentStage.worldWidth - 130, targetX));
            enemy.x += (clampedX - enemy.x) * Math.min(1, dt * 2.5);
            enemy.y += (hoverY - enemy.y) * Math.min(1, dt * 3.2);
            if (enemy.attackCooldown <= 0) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 1 ? 'crane_dive' : 'gale_blades', 0.54);
            }
          }
          break;
        }

        // ===== MUSHROOM KINGDOM BESPOKE ENEMIES =====
        case 'spore_hopper': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              enemy.vy = -435;
              enemy.vx = enemy.facing * 225;
              enemy.onGround = false;
              enemy.attackCooldown = 1.15 / pace;
              enemy.pendingAttackKind = '';
              sound.playJump();
            }
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 360) {
              startTelegraph('hop', 0.34);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * 52;
            }
          } else if (!enemy.alerted && enemy.onGround) {
            this.patrolHorizontal(enemy, 46);
            if (enemy.attackCooldown <= 0) {
              enemy.vy = -310;
              enemy.onGround = false;
              enemy.attackCooldown = 1.9;
            }
          }
          const wasAir = !enemy.onGround;
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          if (wasAir && enemy.onGround && enemy.alerted) {
            this.spawnSparkles(enemy.x, enemy.y - 6, 8, '#a3e635', '#d9f99d', 0.75);
          }
          break;
        }

        case 'mycelium_spitter': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const shots = enemy.pendingAttackKind === 'double_spore' ? [-18, 22] : [0];
              for (const vxOff of shots) {
                const distFactor = Math.max(0.45, Math.min(1.25, distX / 240));
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 12 * eScale,
                  y: enemy.y - enemy.baseH * eScale * 0.75,
                  vx: enemy.facing * (195 * distFactor) + vxOff,
                  vy: -315 - Math.abs(vxOff) * 1.4,
                  radius: 8,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.8,
                  rotation: 0,
                  kind: 'spore_glob',
                  color: '#84cc16',
                });
              }
              sound.playGasBreak();
              enemy.attackCooldown = 1.9 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.vx = distX < 130 ? -enemy.facing * 42 : 0;
            if (enemy.attackCooldown <= 0 && distX < 410) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 0 ? 'double_spore' : 'spore', 0.56);
            }
          } else {
            this.patrolHorizontal(enemy, 28);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'cap_brute': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'cap_slam') {
                enemy.vy = -380;
                enemy.vx = enemy.facing * 150;
                enemy.onGround = false;
                enemy.attackCooldown = 1.9 / pace;
              } else {
                enemy.lungeTimer = 0.44;
                enemy.chargeVx = enemy.facing * 240;
                enemy.attackCooldown = 1.65 / pace;
                sound.playHammerCharge();
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.shieldActive = enemy.hurtStunTimer <= 0;
            if (enemy.attackCooldown <= 0 && distX < 250) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 0 ? 'cap_slam' : 'cap_charge', 0.62);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * 56;
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 38);
          }
          const wasAirBrute = !enemy.onGround;
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          if (wasAirBrute && enemy.onGround && enemy.alerted) {
            sound.playHammerBoom();
            this.triggerShake(5.5, 0.16);
            for (const dir of [-1, 1] as const) {
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + dir * 20,
                y: enemy.y - 6,
                vx: dir * 210,
                vy: 0,
                radius: 10,
                fromEnemy: true,
                damage: 1,
                life: 1.35,
                rotation: 0,
                kind: 'shockwave',
                color: '#a855f7',
              });
            }
          }
          break;
        }

        // ===== SAND FORTRESS BESPOKE ENEMIES =====
        case 'dune_stalker': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              enemy.lungeTimer = 0.34;
              enemy.chargeVx = enemy.facing * 350;
              enemy.attackCooldown = 1.45 / pace;
              enemy.pendingAttackKind = '';
              sound.playWhip();
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
            if (enemy.lungeTimer <= 0 && enemy.onGround) {
              // Quick desert back-hop after slash!
              enemy.vy = -255;
              enemy.vx = -enemy.facing * 145;
              enemy.onGround = false;
            }
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 250) {
              startTelegraph('dune_dash', 0.44);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 130 ? 115 : 55);
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 74);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'scarab_swarmer': {
          if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.vx = enemy.facing * 185;
            if (enemy.onGround && enemy.attackCooldown <= 0 && distX < 185) {
              enemy.vy = -340;
              enemy.vx = enemy.facing * 245;
              enemy.onGround = false;
              enemy.attackCooldown = 1.05 / pace;
            }
          } else {
            this.patrolHorizontal(enemy, 92);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'sun_acolyte': {
          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 4) * 8;
            if (enemy.attackChargeTimer <= 0) {
              const aim = Math.atan2(
                p.y - p.baseH * tuning.playerScale * 0.5 - (enemy.y - enemy.baseH * eScale * 0.55),
                p.x - enemy.x
              );
              for (const spread of [-0.18, 0.18]) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 14,
                  y: enemy.y - enemy.baseH * eScale * 0.55,
                  vx: Math.cos(aim + spread) * 235,
                  vy: Math.sin(aim + spread) * 235,
                  radius: 8,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.5,
                  rotation: 0,
                  kind: 'orb',
                  color: '#fbbf24',
                });
              }
              sound.playFireball();
              enemy.attackCooldown = 2.0 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            const hoverX = enemy.homeX + Math.sin(enemy.animTime * 0.9) * 88;
            enemy.x += (hoverX - enemy.x) * Math.min(1, dt * 2.2);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.1) * 18;
            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 420) {
              startTelegraph('sun_flare', 0.6);
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 0.8) * 55;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 1.7) * 14;
            enemy.facing = Math.cos(enemy.animTime * 0.8) >= 0 ? 1 : -1;
          }
          break;
        }

        // ===== ALIEN SHIP BESPOKE ENEMIES =====
        case 'plasma_drone': {
          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const aim = Math.atan2(
                p.y - p.baseH * tuning.playerScale * 0.5 - (enemy.y - enemy.baseH * eScale * 0.5),
                p.x - enemy.x
              );
              for (const off of [-0.07, 0.07]) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 14,
                  y: enemy.y - enemy.baseH * eScale * 0.5,
                  vx: Math.cos(aim + off) * 340,
                  vy: Math.sin(aim + off) * 340,
                  radius: 6,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.1,
                  rotation: aim + off,
                  kind: 'rail_beam',
                  color: '#38bdf8',
                });
              }
              sound.playWizardBolt();
              enemy.attackCooldown = 1.75 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            const targetX = p.x + (enemy.x >= p.x ? 190 : -190);
            enemy.x += Math.max(-110, Math.min(110, (targetX - enemy.x) * 1.6)) * dt;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.8) * 20;
            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 430) {
              startTelegraph('plasma_twin', 0.48);
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 1.1) * Math.min(95, enemy.patrolRadius);
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.4) * 12;
            enemy.facing = Math.cos(enemy.animTime * 1.1) >= 0 ? 1 : -1;
          }
          break;
        }

        case 'void_stalker': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              if (enemy.pendingAttackKind === 'phase_blink') {
                // Blink behind the hero on the same elevation!
                const blinkX = Math.max(
                  60,
                  Math.min(this.currentStage.worldWidth - 60, p.x - p.facing * 86)
                );
                this.spawnSparkles(enemy.x, enemy.y - 24, 10, '#c084fc', '#38bdf8', 0.85);
                enemy.x = blinkX;
                enemy.facing = p.x >= enemy.x ? 1 : -1;
                enemy.lungeTimer = 0.28;
                enemy.chargeVx = enemy.facing * 290;
                this.spawnSparkles(enemy.x, enemy.y - 24, 12, '#c084fc', '#ffffff', 0.95);
                sound.playShadowStep();
                enemy.attackCooldown = 1.85 / pace;
              } else {
                enemy.lungeTimer = 0.3;
                enemy.chargeVx = enemy.facing * 310;
                enemy.attackCooldown = 1.35 / pace;
                sound.playSwordSlash();
              }
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.chargeVx;
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 340) {
              enemy.stateTimer += 1;
              startTelegraph(enemy.stateTimer % 2 === 0 ? 'phase_blink' : 'void_slash', 0.52);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * 92;
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 64);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'mech_turret': {
          enemy.vx = 0;
          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              for (const k of [0, 1, 2]) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * (18 + k * 24),
                  y: enemy.y - enemy.baseH * eScale * 0.56,
                  vx: enemy.facing * (375 + k * 22),
                  vy: 0,
                  radius: 6,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.0,
                  rotation: enemy.facing === 1 ? 0 : Math.PI,
                  kind: 'rail_beam',
                  color: '#f43f5e',
                });
              }
              sound.playFireball();
              enemy.attackCooldown = 2.15 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 460 && Math.abs(dy) < 120) {
              startTelegraph('rail_burst', 0.62);
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        // ===== DRAGON CRANE BESPOKE ENEMIES =====
        case 'crane_disciple': {
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              enemy.vy = -440;
              enemy.vx = enemy.facing * 265;
              enemy.onGround = false;
              enemy.attackCooldown = 1.45 / pace;
              enemy.pendingAttackKind = '';
              sound.playJump();
            }
          } else if (enemy.alerted && enemy.onGround) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0 && distX < 280) {
              startTelegraph('crane_kick', 0.42);
              enemy.vx = 0;
            } else {
              enemy.vx = enemy.facing * (distX > 120 ? 118 : 60);
            }
          } else if (!enemy.alerted) {
            this.patrolHorizontal(enemy, 76);
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'jade_sentinel': {
          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const aim = Math.atan2(
                p.y - p.baseH * tuning.playerScale * 0.5 - (enemy.y - enemy.baseH * eScale * 0.55),
                p.x - enemy.x
              );
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + enemy.facing * 12,
                y: enemy.y - enemy.baseH * eScale * 0.55,
                vx: Math.cos(aim) * 230,
                vy: Math.sin(aim) * 230,
                radius: 7,
                fromEnemy: true,
                damage: 1,
                life: 2.6,
                rotation: aim,
                kind: 'jade_bolt',
                color: '#34d399',
              });
              sound.playWizardBolt();
              enemy.attackCooldown = 1.85 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 1.1) * 70;
            enemy.y = enemy.homeY + Math.cos(enemy.animTime * 2.0) * 22;
            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 420) {
              startTelegraph('jade_arrow', 0.52);
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 0.8) * 50;
            enemy.y = enemy.homeY + Math.cos(enemy.animTime * 1.5) * 16;
          }
          break;
        }

        case 'cloud_wyrmling': {
          if (enemy.attackChargeTimer > 0) {
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const aim = Math.atan2(
                p.y - p.baseH * tuning.playerScale * 0.45 - (enemy.y - enemy.baseH * eScale * 0.45),
                p.x - enemy.x
              );
              for (const off of [-0.14, 0, 0.14]) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + enemy.facing * 16,
                  y: enemy.y - enemy.baseH * eScale * 0.45,
                  vx: Math.cos(aim + off) * 255,
                  vy: Math.sin(aim + off) * 255,
                  radius: 7,
                  fromEnemy: true,
                  damage: 1,
                  life: 2.3,
                  rotation: aim + off,
                  kind: 'jade_bolt',
                  color: '#2dd4bf',
                });
              }
              sound.playWhip();
              enemy.attackCooldown = 2.0 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            const desiredX = p.x + (enemy.x >= p.x ? 165 : -165);
            enemy.x += Math.max(-135, Math.min(135, (desiredX - enemy.x) * 1.8)) * dt;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 3.1) * 34;
            if (enemy.attackCooldown <= 0 && Math.hypot(dx, dy) < 410) {
              startTelegraph('wyrm_fan', 0.56);
            }
          } else {
            enemy.x = enemy.homeX + Math.sin(enemy.animTime * 1.2) * 110;
            enemy.y = enemy.homeY + Math.sin(enemy.animTime * 2.5) * 26;
            enemy.facing = Math.cos(enemy.animTime * 1.2) >= 0 ? 1 : -1;
          }
          break;
        }

        case 'dwarf_miner': {
          // Corrupted Pick-Miner: steady patrol; when alerted, winds up a crystal-sparking pickaxe charge!
          if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.facing * 320 * enemyPace;
            if (enemy.lungeTimer <= 0) enemy.vx = 0;
          } else if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              enemy.lungeTimer = 0.36;
              enemy.attackCooldown = 1.65 / pace;
              enemy.pendingAttackKind = '';
              sound.playWhip();
              this.spawnSparkles(enemy.x + enemy.facing * 18, enemy.y - 24, 10, '#c084fc', '#fde68a', 0.9);
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (distX < 185 && enemy.attackCooldown <= 0) {
              startTelegraph('charge', 0.48);
            } else {
              enemy.vx = enemy.facing * 98 * enemyPace;
            }
          } else {
            enemy.vx = enemy.facing * 52;
            if (enemy.x < enemy.homeX - enemy.patrolRadius) enemy.facing = 1;
            if (enemy.x > enemy.homeX + enemy.patrolRadius) enemy.facing = -1;
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'dwarf_sapper': {
          // Crystal Keg-Sapper: simple patrol; lobs arcing amethyst powder-bombs when alerted!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const lobVx = Math.max(-290, Math.min(290, dx * 1.15));
              this.projectiles.push({
                id: this.nextProjectileId++,
                x: enemy.x + enemy.facing * 14,
                y: enemy.y - enemy.baseH * eScale * 0.62,
                vx: lobVx,
                vy: -340,
                radius: 9,
                fromEnemy: true,
                damage: 2,
                life: 2.2,
                rotation: 0,
                kind: 'goblin_bomb',
                color: '#a855f7',
              });
              sound.playWhip();
              enemy.attackCooldown = 2.0 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (distX < 340 && enemy.attackCooldown <= 0) {
              startTelegraph('bomb', 0.56);
            } else if (distX < 120) {
              enemy.vx = -enemy.facing * 75 * enemyPace;
            } else {
              enemy.vx = enemy.facing * 64 * enemyPace;
            }
          } else {
            enemy.vx = enemy.facing * 48;
            if (enemy.x < enemy.homeX - enemy.patrolRadius) enemy.facing = 1;
            if (enemy.x > enemy.homeX + enemy.patrolRadius) enemy.facing = -1;
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'runed_golem': {
          // Runed Vault-Golem: armored patrol; slams ground sending purple crystal shockwaves!
          if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              sound.playHammerBoom();
              this.triggerShake(6.5, 0.16);
              this.shockwaves.push({
                x: enemy.x,
                y: enemy.y - 10,
                radius: 10,
                maxRadius: 115,
                color: '#c084fc',
                life: 0.28,
                maxLife: 0.28,
              });
              for (const dir of [-1, 1] as const) {
                this.projectiles.push({
                  id: this.nextProjectileId++,
                  x: enemy.x + dir * 20,
                  y: enemy.y - 16,
                  vx: dir * 265,
                  vy: 0,
                  radius: 10,
                  fromEnemy: true,
                  damage: 2,
                  life: 1.5,
                  rotation: 0,
                  kind: 'stone_shard',
                  color: '#c084fc',
                });
              }
              enemy.attackCooldown = 2.35 / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (distX < 250 && enemy.attackCooldown <= 0) {
              startTelegraph('slam', 0.68);
            } else {
              enemy.vx = enemy.facing * 70 * enemyPace;
            }
          } else {
            enemy.vx = enemy.facing * 42;
            if (enemy.x < enemy.homeX - enemy.patrolRadius) enemy.facing = 1;
            if (enemy.x > enemy.homeX + enemy.patrolRadius) enemy.facing = -1;
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }

        case 'boss_dwarf_king': {
          // THANE BORIN · THE GILDED HOLLOW — 3-Move Subterranean Boss (Amethyst Maul Slam, Crystal Volley, Gilded Charge)!
          if (enemy.hp <= enemy.maxHp * 0.5 && !enemy.enraged) {
            enemy.enraged = true;
            sound.playBossIntro();
            this.triggerShake(10, 0.3);
            this.spawnDamageNumber(enemy.x, enemy.y - 125, 'HEART OF THE VEIN AWAKENS!', '#e879f9', 1.25);
          }
          const phaseMult = enemy.enraged ? 1.26 : 1.0;

          if (enemy.lungeTimer > 0) {
            enemy.lungeTimer = Math.max(0, enemy.lungeTimer - dt);
            enemy.vx = enemy.facing * 430 * phaseMult;
            if (enemy.lungeTimer <= 0) enemy.vx = 0;
          } else if (enemy.attackChargeTimer > 0) {
            enemy.vx = 0;
            enemy.attackChargeTimer = Math.max(0, enemy.attackChargeTimer - dt);
            if (enemy.attackChargeTimer <= 0) {
              const kind = enemy.pendingAttackKind;
              if (kind === 'charge') {
                enemy.lungeTimer = 0.48;
                sound.playHammerBoom();
                this.spawnSparkles(enemy.x, enemy.y - 45, 18, '#fbbf24', '#c084fc', 1.2);
              } else if (kind === 'slam') {
                sound.playHammerBoom();
                this.triggerShake(11, 0.28);
                this.shockwaves.push({
                  x: enemy.x,
                  y: enemy.y - 12,
                  radius: 16,
                  maxRadius: 175,
                  color: '#c084fc',
                  life: 0.34,
                  maxLife: 0.34,
                });
                for (const dir of [-1, 1] as const) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + dir * 28,
                    y: enemy.y - 18,
                    vx: dir * (310 * phaseMult),
                    vy: 0,
                    radius: 13,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.0,
                    rotation: 0,
                    kind: 'shockwave',
                    color: '#a855f7',
                  });
                }
                // Spawn crystal spire pillars under player!
                const pillars = enemy.enraged ? 3 : 2;
                for (let k = 0; k < pillars; k++) {
                  const px = p.x + (k - (pillars - 1) / 2) * 140;
                  this.groundHazards.push({
                    id: this.nextHazardId++,
                    x: Math.max(120, Math.min(this.currentStage.worldWidth - 120, px)),
                    y: this.currentStage.floorY,
                    width: 48,
                    height: 150,
                    warnTimer: 0.72 / phaseMult,
                    maxWarn: 0.72 / phaseMult,
                    activeTimer: 0.45,
                    maxActive: 0.45,
                    damage: 2,
                    kind: 'eclipse_pillar',
                    hitPlayer: false,
                  });
                }
              } else {
                // Amethyst crystal fan volley
                const aim = Math.atan2(p.y - 36 - (enemy.y - 68), p.x - enemy.x);
                const angles = enemy.enraged ? [-0.36, -0.18, 0, 0.18, 0.36] : [-0.24, 0, 0.24];
                for (const off of angles) {
                  this.projectiles.push({
                    id: this.nextProjectileId++,
                    x: enemy.x + enemy.facing * 24,
                    y: enemy.y - 68,
                    vx: Math.cos(aim + off) * 320 * phaseMult,
                    vy: Math.sin(aim + off) * 320 * phaseMult,
                    radius: 9,
                    fromEnemy: true,
                    damage: 2,
                    life: 2.6,
                    rotation: aim + off,
                    kind: 'stone_shard',
                    color: '#e879f9',
                  });
                }
                sound.playWhip();
              }
              enemy.attackCooldown = (enemy.enraged ? 1.35 : 1.75) / pace;
              enemy.pendingAttackKind = '';
            }
          } else if (enemy.alerted) {
            enemy.facing = dx >= 0 ? 1 : -1;
            if (enemy.attackCooldown <= 0) {
              const r = Math.random();
              if (distX < 240 && r < 0.45) {
                startTelegraph('slam', 0.62 / phaseMult);
              } else if (r < 0.78) {
                startTelegraph('charge', 0.52 / phaseMult);
              } else {
                startTelegraph('shards', 0.56 / phaseMult);
              }
            } else {
              enemy.vx = enemy.facing * (distX > 190 ? 125 : 75) * phaseMult;
            }
          }
          this.applyEnemyGroundPhysics(enemy, dt, tuning);
          break;
        }
      }

      this.applyEnemyAttackTuning(enemy, et, prevCooldown, prevCharge, prevProjCount, prevHazardCount);
    }
  }

  /** Generic per-type windup / cooldown / damage tuning layered on top of every enemy's hand-written AI. */
  private applyEnemyAttackTuning(
    enemy: Enemy,
    et: EnemyTuning,
    prevCooldown: number,
    prevCharge: number,
    prevProjCount: number,
    prevHazardCount: number
  ): void {
    if (et.cooldownMult !== 1 && enemy.attackCooldown > prevCooldown + 1e-6) {
      enemy.attackCooldown = prevCooldown + (enemy.attackCooldown - prevCooldown) * Math.max(0.05, et.cooldownMult);
    }
    if (et.windupMult !== 1 && enemy.attackChargeTimer > prevCharge + 1e-6) {
      const m = Math.max(0.05, et.windupMult);
      enemy.attackChargeTimer *= m;
      enemy.chargeDuration *= m;
    }
    for (let i = prevProjCount; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (proj.fromEnemy && !proj.tuned) {
        proj.tuned = true;
        proj.damage = this.scaleEnemyDamage(proj.damage, enemy);
      }
    }
    for (let i = prevHazardCount; i < this.groundHazards.length; i++) {
      const h = this.groundHazards[i];
      if (!h.tuned) {
        h.tuned = true;
        h.damage = this.scaleEnemyDamage(h.damage, enemy);
      }
    }
  }

  private patrolHorizontal(enemy: Enemy, speed: number): void {
    enemy.vx = enemy.facing * speed;
    if (enemy.x > enemy.homeX + enemy.patrolRadius) {
      enemy.facing = -1;
    } else if (enemy.x < enemy.homeX - enemy.patrolRadius) {
      enemy.facing = 1;
    }
  }

  private applyEnemyGroundPhysics(enemy: Enemy, dt: number, tuning: TuningConfig): void {
    const scale = tuning.enemyScale;
    const halfW = (enemy.baseW * scale) / 2;

    if (enemy.onGround && !enemy.isBoss && enemy.hurtStunTimer <= 0) {
      const probeX = enemy.x + enemy.facing * (halfW + 8);
      const probeY = enemy.y + 8;
      const hasFloorAhead = this.platforms.some(
        (plat) =>
          this.isPlatformSolid(plat) &&
          probeX >= plat.x &&
          probeX <= plat.x + plat.w &&
          Math.abs(plat.y - enemy.y) <= 12 &&
          probeY >= plat.y
      );
      if (!hasFloorAhead) {
        enemy.facing = enemy.facing === 1 ? -1 : 1;
        enemy.vx = -enemy.vx;
      }
    }

    enemy.x += enemy.vx * dt;
    enemy.x = Math.max(halfW + 10, Math.min(this.currentStage.worldWidth - halfW - 10, enemy.x));

    if (enemy.isBoss) {
      enemy.x = Math.max(
        this.currentStage.bossZoneStartX + 70,
        Math.min(this.currentStage.worldWidth - 48, enemy.x)
      );
    }

    const prevY = enemy.y;
    enemy.vy = Math.min(820, enemy.vy + tuning.gravity * dt);
    enemy.y += enemy.vy * dt;
    enemy.onGround = false;

    for (const plat of this.platforms) {
      if (!this.isPlatformSolid(plat)) continue;
      if (enemy.x + halfW <= plat.x + 2 || enemy.x - halfW >= plat.x + plat.w - 2) {
        continue;
      }
      if (enemy.vy >= 0 && prevY <= plat.y + 12 && enemy.y >= plat.y) {
        enemy.y = plat.y;
        enemy.vy = 0;
        enemy.onGround = true;
      }
    }
  }

  private updateProjectiles(dt: number, tuning: TuningConfig, enemySlowMult = 1.0): void {
    const pRect = this.getPlayerHurtbox(tuning.playerScale);
    const attackBox = this.getAttackHitbox(tuning);
    const megaBox = this.getKatanaMegaHitbox(tuning);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const pdt = proj.fromEnemy ? dt * enemySlowMult : dt;
      proj.life -= pdt;
      if (
        proj.kind === 'bone' ||
        proj.kind === 'gas_flask' ||
        proj.kind === 'goblin_bomb' ||
        proj.kind === 'tombstone' ||
        proj.kind === 'lava_orb' ||
        proj.kind === 'spore_glob'
      ) {
        proj.vy += (proj.kind === 'lava_orb' ? 480 : proj.kind === 'spore_glob' ? 620 : 740) * pdt;
        proj.rotation += (proj.kind === 'tombstone' ? 8 : 11) * pdt;
      } else if (proj.kind === 'goblin_dagger' || proj.kind === 'bone_scythe') {
        proj.rotation += 15 * pdt;
        if (proj.kind === 'bone_scythe' && proj.returnTimer !== undefined) {
          proj.returnTimer -= pdt;
          if (proj.returnTimer <= 0) {
            proj.vx = -proj.vx;
            proj.returnTimer = 99;
          }
        }
      } else if (proj.kind === 'chakram') {
        proj.rotation += 24 * pdt;
        proj.returnAge = (proj.returnAge ?? 0) + pdt;
        if (!proj.returning && proj.returnAge >= 0.34) {
          proj.returning = true;
          proj.hitIds = [];
          sound.playWhip();
        }
        if (proj.returning) {
          const targetX = this.player.x;
          const targetY = this.player.y - this.player.baseH * tuning.playerScale * 0.55;
          const toX = targetX - proj.x;
          const toY = targetY - proj.y;
          const d = Math.hypot(toX, toY);
          if (d < 28) {
            this.projectiles.splice(i, 1);
            continue;
          }
          const retSpd = 610;
          proj.vx += ((toX / d) * retSpd - proj.vx) * Math.min(1, pdt * 9.5);
          proj.vy += ((toY / d) * retSpd - proj.vy) * Math.min(1, pdt * 9.5);
        } else {
          // Slight deceleration toward apex of outbound arc
          proj.vx *= Math.pow(0.28, pdt);
        }
      } else if (proj.kind === 'chakram_vortex') {
        proj.rotation += 18 * pdt;
        proj.vx = 0;
        proj.vy = 0;
      } else if (proj.kind === 'crossbow_bolt' || proj.kind === 'rail_beam') {
        proj.rotation = Math.atan2(proj.vy, proj.vx);
      } else if (proj.kind === 'jade_bolt') {
        const targetX = this.player.x;
        const targetY = this.player.y - this.player.baseH * tuning.playerScale * 0.5;
        const desiredA = Math.atan2(targetY - proj.y, targetX - proj.x);
        const speed = Math.hypot(proj.vx, proj.vy) || 225;
        proj.vx += (Math.cos(desiredA) * speed - proj.vx) * Math.min(1, pdt * 0.9);
        proj.vy += (Math.sin(desiredA) * speed - proj.vy) * Math.min(1, pdt * 0.9);
        proj.rotation = Math.atan2(proj.vy, proj.vx);
      } else if (proj.kind === 'grimoire_orb') {
        proj.rotation += 9 * pdt;
      } else if (proj.kind === 'soul_skull') {
        // Gentle homing steer toward player while remaining dodgeable!
        const targetX = this.player.x;
        const targetY = this.player.y - this.player.baseH * tuning.playerScale * 0.5;
        const desiredA = Math.atan2(targetY - proj.y, targetX - proj.x);
        const speed = Math.hypot(proj.vx, proj.vy) || 180;
        proj.vx += (Math.cos(desiredA) * speed - proj.vx) * Math.min(1, pdt * 1.35);
        proj.vy += (Math.sin(desiredA) * speed - proj.vy) * Math.min(1, pdt * 1.35);
        proj.rotation = 0;
      } else if (
        proj.kind === 'goblin_arrow' ||
        proj.kind === 'shockwave' ||
        proj.kind === 'katana_wave' ||
        proj.kind === 'crimson_wave' ||
        proj.kind === 'storm_arc' ||
        proj.kind === 'banshee_wail'
      ) {
        proj.rotation = 0;
      } else {
        proj.rotation += 4 * pdt;
      }
      proj.x += proj.vx * pdt;
      proj.y += proj.vy * pdt;

      if (proj.life <= 0 || proj.y > this.currentStage.worldHeight + 60) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const projRect: Rect = {
        x: proj.x - proj.radius,
        y: proj.y - proj.radius,
        w: proj.radius * 2,
        h: proj.radius * 2,
      };

      if (proj.fromEnemy) {
        // Universal Zero-Extra-Button Projectile DEFLECTION!
        // Striking any enemy projectile with [1] Attack, [3] Skill, or during Parry Window reflects it right back!
        const parryReflectHit =
          (attackBox && rectsOverlap(attackBox, projRect)) ||
          (megaBox && rectsOverlap(megaBox, projRect)) ||
          ((this.player.parryWindowTimer > 0 || this.player.minstrelDanceTimer > 0) &&
            rectsOverlap(pRect, projRect));
        if (parryReflectHit) {
          proj.fromEnemy = false;
          proj.vx = (Math.abs(proj.vx) > 60 ? -proj.vx : this.player.facing * 260) * 1.5;
          proj.vy = -proj.vy * 0.35 - 20;
          proj.damage = Math.max(3, proj.damage + 2);
          proj.life = 1.45;
          proj.kind = 'sword_wave';
          proj.radius = Math.max(14, proj.radius);
          proj.slotLevel = 1 + this.player.weaponDamageBonus;
          this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
          this.player.invulnTimer = Math.max(this.player.invulnTimer, 0.35);
          this.parries += 1;
          sound.playParry(true);
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.085);
          this.triggerShake(6.5, 0.14);
          this.shockwaves.push({
            x: proj.x,
            y: proj.y,
            radius: 8,
            maxRadius: 68,
            color: '#fde047',
            life: 0.2,
            maxLife: 0.2,
          });
          this.spawnSparkles(proj.x, proj.y, 16, '#fde047', '#ffffff', 1.15);
          this.spawnDamageNumber(proj.x, proj.y - 24, 'DEFLECT! +1 MP', '#fde047', 1.05);
          continue;
        }

        // Iron Vanguard Tower Shield automatically intercepts frontal enemy projectiles!
        if (
          this.player.shieldGuardActive &&
          rectsOverlap(projRect, pRect) &&
          (proj.x - this.player.x) * this.player.facing >= -18
        ) {
          sound.playArmorBlock();
          this.spawnSparkles(proj.x, proj.y, 12, '#60a5fa', '#ffffff', 0.95);
          this.spawnDamageNumber(this.player.x, this.player.y - 54, 'SHIELDED', '#93c5fd', 0.9);
          this.projectiles.splice(i, 1);
          continue;
        }

        // Goblin Bomb, Tombstone, Lava Orb, & Spore Glob detonate cleanly on solid ground or player hit
        if (
          proj.kind === 'goblin_bomb' ||
          proj.kind === 'tombstone' ||
          proj.kind === 'lava_orb' ||
          proj.kind === 'spore_glob'
        ) {
          let hitGround = false;
          for (const plat of this.platforms) {
            if (!plat.oneWay && rectsOverlap(projRect, plat)) {
              hitGround = true;
              break;
            }
          }
          const hitPlayer = rectsOverlap(projRect, pRect);
          if (hitGround || hitPlayer) {
            const blastR = proj.kind === 'spore_glob' ? 50 : proj.kind === 'tombstone' ? 58 : 66;
            sound.playExplosion(false);
            this.shockwaves.push({
              x: proj.x,
              y: proj.y,
              radius: 10,
              maxRadius: blastR,
              color:
                proj.kind === 'spore_glob'
                  ? '#84cc16'
                  : proj.kind === 'tombstone'
                    ? '#94a3b8'
                    : '#f97316',
              life: 0.24,
              maxLife: 0.24,
            });
            this.spawnSparkles(
              proj.x,
              proj.y,
              14,
              proj.kind === 'spore_glob'
                ? '#a3e635'
                : proj.kind === 'tombstone'
                  ? '#cbd5e1'
                  : '#f97316',
              '#fde047',
              1.05
            );
            const pCenterX = pRect.x + pRect.w / 2;
            const pCenterY = pRect.y + pRect.h / 2;
            if (hitPlayer || Math.hypot(pCenterX - proj.x, pCenterY - proj.y) <= blastR) {
              this.damagePlayer(
                proj.damage,
                proj.x,
                proj.kind !== 'goblin_bomb' && proj.kind !== 'spore_glob',
                tuning
              );
            }
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        if (rectsOverlap(projRect, pRect)) {
          const isBossProj =
            proj.kind === 'orb' ||
            proj.kind === 'shockwave' ||
            proj.kind === 'lich_bolt' ||
            proj.kind === 'goblin_hex' ||
            proj.kind === 'crimson_wave' ||
            proj.kind === 'bone_scythe' ||
            proj.kind === 'banshee_wail';
          this.damagePlayer(proj.damage, proj.x, isBossProj, tuning);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      let hitSolid = false;
      for (const plat of this.platforms) {
        if (!plat.oneWay || proj.kind === 'gas_flask') {
          if (rectsOverlap(projRect, plat)) {
            hitSolid = true;
            break;
          }
        }
      }

      // Player projectiles can snap Hanging Brazier chains & shatter Secret Walls from afar!
      for (const b of this.hangingBraziers) {
        if (b.state === 'hanging') {
          const bRect: Rect = { x: b.x - 20, y: b.y - 44, w: 40, h: 52 };
          if (rectsOverlap(projRect, bRect)) {
            this.snapHangingBrazier(b);
          }
        }
      }
      for (const sw of this.secretWalls) {
        if (!sw.broken && rectsOverlap(projRect, sw)) {
          this.damageSecretWall(sw, 2);
          hitSolid = true;
        }
      }

      if (proj.kind === 'thrown_dagger' || proj.kind === 'venom_needle') {
        // Assassin projectiles: thin, fast, point along their flight; daggers kill the unaware.
        proj.rotation = Math.atan2(proj.vy, proj.vx);
        if (Math.random() < 0.35) {
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            size: 2,
            color: proj.kind === 'venom_needle' ? '#84cc16' : proj.color ?? '#a8a29e',
            life: 0.18,
            maxLife: 0.18,
            kind: 'energy_wisp',
            rotation: 0,
          });
        }
        const dHit = proj.hitIds ?? (proj.hitIds = []);
        let dTarget: Enemy | null = null;
        for (const enemy of this.enemies) {
          if (enemy.dead || dHit.includes(enemy.id)) continue;
          if (rectsOverlap(projRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
            dTarget = enemy;
            break;
          }
        }
        if (dTarget) {
          dHit.push(dTarget.id);
          this.assassinProjectileHit(proj, dTarget, tuning);
          if (!proj.pierce || dTarget.isBoss) this.projectiles.splice(i, 1);
        } else if (hitSolid) {
          this.spawnSparkles(proj.x, proj.y, 5, '#a8a29e', '#ffffff', 0.5);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      if (proj.kind === 'arcane_bolt') {
        if (Math.random() < 0.7) {
          this.particles.push({
            x: proj.x - Math.sign(proj.vx) * proj.radius,
            y: proj.y + (Math.random() - 0.5) * proj.radius,
            vx: -proj.vx * 0.08 + (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            size: proj.overcharged ? 3.5 : 2.5,
            color: Math.random() < 0.5 ? (proj.color ?? '#a5b4fc') : '#e0e7ff',
            life: 0.2,
            maxLife: 0.2,
            kind: 'energy_wisp',
            rotation: 0,
          });
        }
        const hitIds = proj.hitIds ?? (proj.hitIds = []);
        let target: Enemy | null = null;
        for (const enemy of this.enemies) {
          if (enemy.dead || hitIds.includes(enemy.id)) continue;
          if (rectsOverlap(projRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
            target = enemy;
            break;
          }
        }
        if (target) {
          hitIds.push(target.id);
          this.wizardBoltHit(proj, target, tuning);
          if (!proj.pierce || target.isBoss) {
            this.projectiles.splice(i, 1);
          }
        } else if (hitSolid) {
          this.spawnSparkles(proj.x, proj.y, 6, proj.color ?? '#a5b4fc', '#ffffff', 0.6);
          this.projectiles.splice(i, 1);
        } else {
          // Bolt shatters enemy projectiles it meets
          for (let j = this.projectiles.length - 1; j >= 0; j--) {
            const other = this.projectiles[j];
            if (!other.fromEnemy) continue;
            if (Math.hypot(other.x - proj.x, other.y - proj.y) <= proj.radius + other.radius + 4) {
              this.spawnSparkles(other.x, other.y, 6, proj.color ?? '#a5b4fc', '#ffffff', 0.7);
              this.projectiles.splice(j, 1);
              if (j < i) i--;
            }
          }
        }
        continue;
      }

      // ===== ORBITING GRIMOIRE: ELEMENTAL EXPLOSIVE ORB =====
      if (proj.kind === 'grimoire_orb') {
        const orbColor = proj.color ?? '#f97316';
        if (Math.random() < 0.7) {
          this.particles.push({
            x: proj.x + (Math.random() - 0.5) * 10,
            y: proj.y + (Math.random() - 0.5) * 10,
            vx: -proj.vx * 0.1 + (Math.random() - 0.5) * 35,
            vy: (Math.random() - 0.5) * 35,
            size: 3.2,
            color: orbColor,
            life: 0.22,
            maxLife: 0.22,
            kind: 'energy_wisp',
            rotation: 0,
          });
        }
        let hitFoe: Enemy | null = null;
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          if (rectsOverlap(projRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
            hitFoe = enemy;
            break;
          }
        }
        if (hitFoe || hitSolid) {
          const blastR = 96;
          const el = proj.orbElement ?? 'fire';
          sound.playExplosion(false);
          this.triggerShake(5.5, 0.14);
          this.shockwaves.push({
            x: proj.x,
            y: proj.y,
            radius: 12,
            maxRadius: blastR,
            color: orbColor,
            life: 0.24,
            maxLife: 0.24,
          });
          this.spawnSparkles(proj.x, proj.y, 18, orbColor, '#ffffff', 1.15);
          let blastHits = 0;
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - enemy.baseH * tuning.enemyScale * 0.5;
            if (Math.hypot(enemy.x - proj.x, ey - proj.y) <= blastR) {
              blastHits++;
              if (el === 'fire') {
                enemy.burnTimer = Math.max(enemy.burnTimer ?? 0, 3.0);
                enemy.burnTickTimer = 0.45;
              } else if (el === 'glacial') {
                enemy.chillTimer = Math.max(enemy.chillTimer ?? 0, 3.2);
              } else if (el === 'venom') {
                enemy.poisonTimer = Math.max(enemy.poisonTimer ?? 0, 3.5);
                enemy.poisonTickTimer = 0.5;
              }
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', proj.slotLevel ?? 1, {
                bonusDamage: el === 'shadow' ? 2 : 1,
                guardBreak: el === 'storm' || el === 'fire',
                stun: el === 'storm' ? 0.48 : 0.18,
                kbX: 165,
              });
            }
          }
          if (el === 'light' && blastHits >= 2) {
            this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
            this.spawnDamageNumber(proj.x, proj.y - 26, '+1 MP', '#fde047', 0.9);
          }
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // ===== DUSK RANGER: BURST CROSSBOW BOLT =====
      if (proj.kind === 'crossbow_bolt') {
        if (Math.random() < 0.45) {
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: -proj.vx * 0.06,
            vy: (Math.random() - 0.5) * 18,
            size: 2.2,
            color: proj.color ?? '#34d399',
            life: 0.14,
            maxLife: 0.14,
            kind: 'energy_wisp',
            rotation: 0,
          });
        }
        const cHit = proj.hitIds ?? (proj.hitIds = []);
        let hitFoe: Enemy | null = null;
        for (const enemy of this.enemies) {
          if (enemy.dead || cHit.includes(enemy.id)) continue;
          if (rectsOverlap(projRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
            hitFoe = enemy;
            break;
          }
        }
        if (hitFoe) {
          cHit.push(hitFoe.id);
          this.handlePlayerHitEnemy(hitFoe, tuning, 'weapon', proj.slotLevel ?? 1, {
            bonusDamage: proj.pierce ? 1 : 0,
            kbX: 130,
          });
          if (!proj.pierce || hitFoe.isBoss) {
            this.projectiles.splice(i, 1);
          }
        } else if (hitSolid) {
          this.spawnSparkles(proj.x, proj.y, 5, '#6ee7b7', '#ffffff', 0.55);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      // ===== SUN BLADE-DANCER: LOOPING TWIN CHAKRAM =====
      if (proj.kind === 'chakram') {
        if (Math.random() < 0.55) {
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 28,
            vy: (Math.random() - 0.5) * 28,
            size: 2.6,
            color: proj.returning ? '#fb7185' : '#fbbf24',
            life: 0.18,
            maxLife: 0.18,
            kind: 'energy_wisp',
            rotation: 0,
          });
        }
        const chHit = proj.hitIds ?? (proj.hitIds = []);
        for (const enemy of this.enemies) {
          if (enemy.dead || chHit.includes(enemy.id)) continue;
          if (rectsOverlap(projRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
            chHit.push(enemy.id);
            this.handlePlayerHitEnemy(enemy, tuning, 'weapon', proj.slotLevel ?? 1, {
              bonusDamage: proj.returning ? 1 : 0,
              kbX: proj.returning ? -110 : 110,
              stun: 0.15,
            });
          }
        }
        if (hitSolid && !proj.returning) {
          proj.returning = true;
          proj.hitIds = [];
          this.spawnSparkles(proj.x, proj.y, 8, '#fbbf24', '#ffffff', 0.75);
        }
        continue;
      }

      // ===== SUN BLADE-DANCER [3]: RAZOR VORTEX HALO =====
      if (proj.kind === 'chakram_vortex') {
        proj.returnTimer = (proj.returnTimer ?? 0) - pdt;
        if (proj.returnTimer <= 0) {
          proj.returnTimer = 0.22;
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - enemy.baseH * tuning.enemyScale * 0.5;
            if (Math.hypot(enemy.x - proj.x, ey - proj.y) <= 78) {
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', proj.slotLevel ?? 1, {
                bonusDamage: 0,
                kbX: 40,
                stun: 0.12,
              });
            }
          }
          this.spawnSparkles(proj.x, proj.y, 5, '#fbbf24', '#fb7185', 0.7);
        }
        continue;
      }

      let hitEnemy: Enemy | null = null;
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        if (rectsOverlap(projRect, this.getEnemyRect(enemy, tuning.enemyScale))) {
          hitEnemy = enemy;
          break;
        }
      }

      if (proj.kind === 'fireball') {
        if (Math.random() < 0.45) {
          this.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            size: 3.5,
            color: '#f97316',
            life: 0.16,
            maxLife: 0.16,
            kind: 'ember',
            rotation: 0,
          });
        }

        if (hitEnemy || hitSolid) {
          const slotLv = proj.slotLevel ?? 1;
          const splashR = slotLv >= 4 ? 112 : slotLv >= 2 ? 64 : 52;
          if (slotLv >= 4) {
            sound.playExplosion(false);
            this.triggerShake(Math.max(8, tuning.critShakeIntensity * 0.85), 0.22);
          }
          this.shockwaves.push({
            x: proj.x,
            y: proj.y,
            radius: 8,
            maxRadius: splashR,
            color: slotLv >= 4 ? '#ef4444' : '#f97316',
            life: slotLv >= 4 ? 0.26 : 0.2,
            maxLife: slotLv >= 4 ? 0.26 : 0.2,
          });
          this.spawnSparkles(
            proj.x,
            proj.y,
            slotLv >= 4 ? 22 : 14,
            '#f97316',
            '#fef08a',
            slotLv >= 4 ? 1.45 : 1.15
          );

          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
            if (enemy === hitEnemy || Math.hypot(enemy.x - proj.x, ey - proj.y) <= splashR + 12) {
              this.handlePlayerHitEnemy(enemy, tuning, 'fireball', slotLv);
            }
          }
          this.projectiles.splice(i, 1);
        }
      } else if (proj.kind === 'gas_flask') {
        if (hitEnemy || hitSolid) {
          const slotLv = proj.slotLevel ?? 1;
          this.spawnGasCloud(proj.x, proj.y - 12, slotLv, tuning);
          this.projectiles.splice(i, 1);
        }
      } else if (
        proj.kind === 'sword_wave' ||
        proj.kind === 'katana_wave' ||
        proj.kind === 'storm_arc' ||
        proj.kind === 'player_quake'
      ) {
        if (hitEnemy) {
          const wLv = proj.slotLevel ?? 1;
          if ((proj.kind === 'player_quake' || proj.kind === 'katana_wave') && wLv >= 3) {
            this.applyBurn(hitEnemy, 3.2);
          }
          this.handlePlayerHitEnemy(hitEnemy, tuning, 'fireball', wLv);
          if (proj.kind === 'player_quake') {
            this.projectiles.splice(i, 1);
          } else if (hitEnemy.isBoss) {
            this.projectiles.splice(i, 1);
          } else {
            proj.x += Math.sign(proj.vx) * 28;
          }
        } else if (
          hitSolid &&
          (proj.kind === 'sword_wave' || proj.kind === 'katana_wave' || proj.kind === 'storm_arc')
        ) {
          this.spawnSparkles(
            proj.x,
            proj.y,
            6,
            proj.kind === 'katana_wave'
              ? '#fb7185'
              : proj.kind === 'storm_arc'
                ? '#38bdf8'
                : '#93c5fd',
            '#ffffff',
            0.7
          );
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private spawnGasCloud(x: number, y: number, slotLevel: number, tuning: TuningConfig): void {
    sound.playGasBreak();
    this.spawnSparkles(x, y, 10, '#4ade80', '#bbf7d0', 0.85);
    const duration = slotLevel >= 5 ? 8.0 : 4.2 + (slotLevel - 1) * 0.9;
    const radius = slotLevel >= 5 ? 124 : 80 + (slotLevel - 1) * 10;

    // Lv 4+ Shatter Impact: flask detonates in a heavy toxic blast wave on landing!
    if (slotLevel >= 4) {
      const blastR = 104;
      sound.playHammerBoom();
      this.triggerShake(Math.max(6, tuning.critShakeIntensity * 0.7), 0.18);
      this.shockwaves.push({
        x,
        y,
        radius: 12,
        maxRadius: blastR,
        color: '#22c55e',
        life: 0.24,
        maxLife: 0.24,
      });
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
        if (Math.hypot(enemy.x - x, ey - y) <= blastR + 10) {
          this.handlePlayerHitEnemy(enemy, tuning, 'gas', slotLevel);
        }
      }
    }

    this.gasClouds.push({
      id: this.nextCloudId++,
      x,
      y,
      radius,
      life: duration,
      maxLife: duration,
      tickTimer: 0.08,
      tickDamage: 1 + this.getSpellFlatBonus(slotLevel),
      slotLevel,
    });
  }

  private updateGasClouds(dt: number, tuning: TuningConfig): void {
    for (let i = this.gasClouds.length - 1; i >= 0; i--) {
      const cloud = this.gasClouds[i];
      cloud.life -= dt;
      if (cloud.life <= 0) {
        this.gasClouds.splice(i, 1);
        continue;
      }

      cloud.tickTimer -= dt;
      if (cloud.tickTimer <= 0) {
        cloud.tickTimer = 0.6;
        for (const enemy of this.enemies) {
          if (enemy.dead) continue;
          const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
          if (Math.hypot(enemy.x - cloud.x, ey - cloud.y) <= cloud.radius + 16) {
            this.handlePlayerHitEnemy(enemy, tuning, 'gas', cloud.slotLevel);
          }
        }
      }
    }
  }

  private spawnGroundHazard(
    x: number,
    kind: GroundHazard['kind'],
    warnDuration = 0.72,
    width = 48,
    height = 175,
    damage = 2
  ): void {
    const clampedX = Math.max(
      this.currentStage.bossZoneStartX + 44,
      Math.min(this.currentStage.worldWidth - 64, x)
    );
    this.groundHazards.push({
      id: this.nextHazardId++,
      x: clampedX,
      y: this.currentStage.floorY,
      width,
      height,
      warnTimer: warnDuration,
      maxWarn: warnDuration,
      activeTimer: 0.34,
      maxActive: 0.34,
      damage,
      kind,
      hitPlayer: false,
    });
  }

  private updateGroundHazards(dt: number, tuning: TuningConfig): void {
    const pRect = this.getPlayerHurtbox(tuning.playerScale);
    for (let i = this.groundHazards.length - 1; i >= 0; i--) {
      const h = this.groundHazards[i];
      if (h.warnTimer > 0) {
        h.warnTimer -= dt;
        if (h.warnTimer <= 0) {
          sound.playHammerBoom();
          this.triggerShake(6, 0.16);
          const burstCol =
            h.kind === 'flame_pillar'
              ? '#f97316'
              : h.kind === 'hex_pillar'
                ? '#4ade80'
                : h.kind === 'bone_spike'
                  ? '#e2e8f0'
                  : '#ff334b';
          this.spawnSparkles(h.x, h.y - 24, 14, burstCol, '#ffffff', 1.1);
        }
      } else {
        h.activeTimer -= dt;
        if (!h.hitPlayer) {
          const hazardBox: Rect = {
            x: h.x - h.width * 0.45,
            y: h.y - h.height * 0.92,
            w: h.width * 0.9,
            h: h.height * 0.92,
          };
          if (rectsOverlap(pRect, hazardBox)) {
            h.hitPlayer = true;
            this.damagePlayer(h.damage, h.x, true, tuning);
          }
        }
        if (h.activeTimer <= 0) {
          this.groundHazards.splice(i, 1);
        }
      }
    }
  }

  private getBossRelicColors(type: EnemyType): { primary: string; secondary: string } {
    switch (type) {
      case 'boss_valerius':
      case 'boss_vampire_duelist':
      case 'boss_eclipse_overlord':
        return { primary: '#ff334b', secondary: '#ffd166' };
      case 'boss_goblin_chief':
      case 'boss_goblin_sapper':
      case 'boss_goblin_shaman':
      case 'boss_goblin_behemoth':
      case 'boss_goblin_warlord':
        return { primary: '#4ade80', secondary: '#fbbf24' };
      case 'boss_gravedigger':
      case 'boss_banshee':
      case 'boss_bone_reaver':
      case 'boss_necromancer':
      case 'boss_malakor':
        return { primary: '#2dd4bf', secondary: '#c084fc' };
      case 'boss_pyre_matriarch':
      case 'boss_slag_titan':
      case 'boss_cinder_warden':
      case 'boss_infernal_knight':
      case 'boss_forge_lord':
        return { primary: '#f97316', secondary: '#fef08a' };
      default:
        return { primary: '#ffd166', secondary: '#ff4d6d' };
    }
  }

  private startBossDeathSequence(
    boss: Enemy,
    spawnsRelic: boolean,
    shardGain: number,
    coreGain: number
  ): void {
    const isBig = Boolean(boss.isBigBoss || (spawnsRelic && this.currentStage.isBigBossRoom));
    const colors = this.getBossRelicColors(boss.type);
    const relicX = Math.max(
      this.currentStage.bossZoneStartX + 96,
      Math.min(this.currentStage.worldWidth - 190, boss.x)
    );
    const dur = isBig ? 1.85 : 1.15;

    this.bossDeathSequences.push({
      id: this.nextBossDeathId++,
      x: relicX,
      y: Math.min(this.currentStage.floorY - 42, boss.y - boss.baseH * 0.55),
      floorY: this.currentStage.floorY,
      timer: dur,
      duration: dur,
      isBigBoss: isBig,
      color: colors.primary,
      secondaryColor: colors.secondary,
      bossName: boss.name,
      spawnsRelic,
      relicSpawned: false,
      shardGain,
      coreGain,
      nextPulseTime: dur - 0.14,
    });

    sound.playBossEnergySprout(isBig);
    this.triggerShake(isBig ? 18 : 11, isBig ? 1.45 : 0.85);
    this.cameraZoomPunch = Math.max(this.cameraZoomPunch, isBig ? 0.13 : 0.08);
    this.triggerImpactFlash(colors.primary, isBig ? 0.65 : 0.42, relicX, boss.y - 52, isBig ? 2.1 : 1.4, 0.34);

    // Initial massive shockwave rings + sprouting energy wisps!
    this.shockwaves.push({
      x: relicX,
      y: boss.y - 46,
      radius: 14,
      maxRadius: isBig ? 270 : 175,
      color: colors.primary,
      life: isBig ? 0.55 : 0.38,
      maxLife: isBig ? 0.55 : 0.38,
    });
    const wispCount = isBig ? 42 : 24;
    const relicTargetY = this.currentStage.floorY - 48;
    for (let i = 0; i < wispCount; i++) {
      const ang = (i / wispCount) * Math.PI * 2 + Math.random() * 0.25;
      const spd = (isBig ? 230 : 165) + Math.random() * 190;
      this.particles.push({
        x: relicX,
        y: boss.y - 46,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: isBig ? 6 : 4.5,
        color: i % 2 === 0 ? colors.primary : colors.secondary,
        life: dur * (0.7 + Math.random() * 0.3),
        maxLife: dur,
        kind: 'energy_wisp',
        rotation: ang,
        targetX: relicX,
        targetY: relicTargetY,
      });
    }
  }

  private updateBossDeathSequences(dt: number): void {
    for (let i = this.bossDeathSequences.length - 1; i >= 0; i--) {
      const seq = this.bossDeathSequences[i];
      seq.timer -= dt;

      // Periodic energy pulses & upward sparks sprouting during crystallization!
      if (seq.timer <= seq.nextPulseTime && seq.timer > 0.15) {
        seq.nextPulseTime -= seq.isBigBoss ? 0.24 : 0.28;
        this.triggerShake(seq.isBigBoss ? 12 : 6.5, 0.2);
        this.shockwaves.push({
          x: seq.x,
          y: seq.floorY - 48,
          radius: 10,
          maxRadius: seq.isBigBoss ? 220 : 135,
          color: Math.random() > 0.45 ? seq.color : seq.secondaryColor,
          life: 0.32,
          maxLife: 0.32,
        });
        this.spawnSparkles(seq.x, seq.floorY - 48, seq.isBigBoss ? 18 : 10, seq.color, '#ffffff', seq.isBigBoss ? 1.6 : 1.15);
      }

      if (seq.timer <= 0) {
        if (seq.spawnsRelic && !seq.relicSpawned) {
          seq.relicSpawned = true;
          this.interactables.push({
            id: `boss-relic-${this.stageIndex}`,
            kind: 'boss_relic',
            x: seq.x,
            y: seq.floorY,
            label: seq.isBigBoss
              ? `Claim Grand Raid Relic (+${seq.shardGain} Shards)`
              : 'Claim Floating Boss Relic (1 of 3)',
            used: false,
            relicColor: seq.color,
            isBigBossRelic: seq.isBigBoss,
          });

          // Unlock exit door once the Floating Relic manifests!
          const door = this.interactables.find((it) => it.kind === 'exit_door');
          if (door) {
            door.locked = false;

            // In 1 random room per raid (Rooms 1-3), ALSO unlock a glowing Cursed Door side-by-side!
            const rooms = this.getCurrentRaidRooms();
            if (
              !seq.isBigBoss &&
              !this.currentStage.isBigBossRoom &&
              this.stageIndex === this.cursedDoorRoomIndex &&
              this.stageIndex + 1 < rooms.length &&
              !this.interactables.some((it) => it.kind === 'cursed_door')
            ) {
              const cursedX = Math.max(this.currentStage.bossZoneStartX + 70, door.x - 122);
              this.interactables.push({
                id: `cursed-door-${this.stageIndex}`,
                kind: 'cursed_door',
                x: cursedX,
                y: door.y,
                label: 'Enter Shattered Mirror Cathedral · 2x Loot & Mirror Shrine',
                used: false,
                locked: false,
              });
              sound.playCursedShrine();
              this.shockwaves.push({
                x: cursedX,
                y: door.y - 68,
                radius: 14,
                maxRadius: 140,
                color: '#67e8f9',
                life: 0.45,
                maxLife: 0.45,
              });
              this.spawnSparkles(cursedX, door.y - 68, 28, '#67e8f9', '#f472b6', 1.45);
              this.spawnDamageNumber(
                cursedX,
                door.y - 148,
                'MIRROR CATHEDRAL OPENED!',
                '#67e8f9',
                1.2,
                'CURSED PRISM · 2X REWARD'
              );
            }
          }

          sound.playRelicCrystallize(seq.isBigBoss);
          this.triggerShake(seq.isBigBoss ? 15 : 9, seq.isBigBoss ? 0.42 : 0.26);
          this.cameraZoomPunch = Math.max(this.cameraZoomPunch, seq.isBigBoss ? 0.1 : 0.06);
          this.triggerImpactFlash('#ffffff', seq.isBigBoss ? 0.65 : 0.38, seq.x, seq.floorY - 48, seq.isBigBoss ? 2.0 : 1.35, 0.32);
          this.shockwaves.push({
            x: seq.x,
            y: seq.floorY - 48,
            radius: 12,
            maxRadius: seq.isBigBoss ? 260 : 165,
            color: '#ffffff',
            life: 0.42,
            maxLife: 0.42,
          });
          this.spawnSparkles(seq.x, seq.floorY - 48, seq.isBigBoss ? 40 : 26, seq.color, seq.secondaryColor, seq.isBigBoss ? 1.8 : 1.4);
          this.spawnDamageNumber(
            seq.x,
            seq.floorY - 94,
            `+${seq.coreGain} BOSS CORE${seq.coreGain > 1 ? 'S' : ''} · +${seq.shardGain} SHARDS`,
            seq.secondaryColor,
            seq.isBigBoss ? 1.3 : 1.15,
            seq.isBigBoss ? 'GRAND RELIC MANIFESTED · DOOR OPEN' : 'FLOATING RELIC FORMED · DOOR OPEN'
          );
        }
        this.bossDeathSequences.splice(i, 1);
      }
    }
  }

  private spawnBloodBurst(
    x: number,
    y: number,
    dirX: number,
    count: number,
    speedScale = 1.0,
    mistCount = 2
  ): void {
    const dir = dirX === 0 ? 1 : Math.sign(dirX);
    const bloodPalette = ['#991b1b', '#dc2626', '#ef4444', '#7f1d1d', '#b91c1c'];
    for (let i = 0; i < count; i++) {
      const forwardBias = i < count * 0.72;
      const spread = forwardBias ? (Math.random() - 0.5) * 1.15 : Math.random() * Math.PI * 2;
      const baseAngle = forwardBias ? (dir > 0 ? -0.35 : Math.PI + 0.35) + spread : spread;
      const speed = (115 + Math.random() * 290) * speedScale;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(baseAngle) * speed,
        vy: Math.sin(baseAngle) * speed - (65 + Math.random() * 95) * speedScale,
        size: 2.8 + Math.random() * 3.8,
        color: bloodPalette[Math.floor(Math.random() * bloodPalette.length)],
        life: 0.45 + Math.random() * 0.48,
        maxLife: 0.93,
        kind: 'blood',
        rotation: baseAngle,
      });
    }
    for (let i = 0; i < mistCount; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: dir * (25 + Math.random() * 75) * speedScale,
        vy: -25 - Math.random() * 45,
        size: 11 + Math.random() * 11 * speedScale,
        color: i % 2 === 0 ? '#dc2626' : '#7f1d1d',
        life: 0.32 + Math.random() * 0.24,
        maxLife: 0.56,
        kind: 'blood_mist',
        rotation: Math.random() * Math.PI,
      });
    }
  }

  private spawnSlashLine(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    color: string,
    coreColor = '#ffffff',
    duration = 0.22
  ): void {
    this.slashLines.push({
      x,
      y,
      angle,
      length,
      width,
      color,
      coreColor,
      life: duration,
      maxLife: duration,
    });
  }

  private addBloodStain(x: number, y: number, width: number): void {
    // Merge slightly if very close to existing stain so stains build up organically
    for (const st of this.bloodStains) {
      if (Math.abs(st.y - y) < 3 && Math.abs(st.x - x) < 12) {
        st.width = Math.min(44, st.width + width * 0.28);
        st.alpha = Math.min(0.88, st.alpha + 0.08);
        return;
      }
    }
    this.bloodStains.push({
      x,
      y,
      width: Math.max(7, Math.min(34, width)),
      color: Math.random() > 0.35 ? '#7f1d1d' : '#991b1b',
      alpha: 0.58 + Math.random() * 0.24,
    });
    if (this.bloodStains.length > 140) {
      this.bloodStains.shift();
    }
  }

  private applyBurn(enemy: Enemy, duration = 3.2): void {
    if (enemy.dead) return;
    enemy.burnTimer = Math.max(enemy.burnTimer, duration);
    if (enemy.burnTickTimer <= 0) {
      enemy.burnTickTimer = 0.65;
    }
  }

  private handleEnemyKilled(enemy: Enemy, hitX: number, hitY: number, wasAssassination = false, fell = false): void {
    if ((enemy.markTimer ?? 0) > 0 && !enemy.isBoss) this.onMarkedFoeDied(enemy);
    enemy.markTimer = 0;
    enemy.dead = true;
    const isBig = Boolean(enemy.isBigBoss);

    // Elaborate category-specific enemy dying sound + arterial blood eruption!
    sound.playEnemyDeath(enemy.type, enemy.isBoss, isBig, wasAssassination);
    const pushDir = this.player.x <= enemy.x ? 1 : -1;
    this.spawnBloodBurst(
      hitX,
      hitY,
      pushDir,
      isBig ? 48 : enemy.isBoss ? 36 : wasAssassination ? 32 : 24,
      isBig ? 1.45 : enemy.isBoss ? 1.3 : wasAssassination ? 1.3 : 1.1,
      isBig ? 8 : enemy.isBoss ? 6 : 5
    );
    if (!fell) this.addBloodStain(hitX, this.currentStage.floorY, enemy.isBoss ? 34 : 20);
    this.spawnSparkles(hitX, hitY, enemy.isBoss ? 30 : 16, '#dc2626', '#ffd166', enemy.isBoss ? 1.65 : 1.15);

    // Lethal cleave slash line!
    this.spawnSlashLine(
      hitX,
      hitY,
      (pushDir > 0 ? -0.45 : Math.PI + 0.45) + (Math.random() - 0.5) * 0.35,
      enemy.isBoss ? 220 : wasAssassination ? 195 : 115,
      enemy.isBoss ? 10 : wasAssassination ? 8 : 5,
      wasAssassination ? '#ff334b' : '#ef4444',
      '#ffffff',
      enemy.isBoss ? 0.36 : 0.24
    );

    // Unmistakable Kill Freeze + Camera Shake!
    this.hitstopTimer = Math.max(this.hitstopTimer, isBig ? 0.32 : enemy.isBoss ? 0.24 : 0.11);
    this.cameraZoomPunch = Math.max(this.cameraZoomPunch, isBig ? 0.14 : enemy.isBoss ? 0.095 : 0.045);
    this.triggerShake(isBig ? 19 : enemy.isBoss ? 14 : 6.8, isBig ? 0.45 : enemy.isBoss ? 0.34 : 0.18);
    this.triggerImpactFlash(
      enemy.isBoss ? '#ffd166' : '#ef4444',
      enemy.isBoss ? 0.52 : 0.22,
      hitX,
      hitY,
      enemy.isBoss ? 1.65 : 0.9,
      enemy.isBoss ? 0.32 : 0.16
    );

    // If this boss fell in a Duo-Boss room while its partner still lives, STILL sprout boss energy dramatically!
    if (enemy.isBoss) {
      const otherBossAlive = this.enemies.some((e) => e.isBoss && !e.dead);
      if (otherBossAlive) {
        this.startBossDeathSequence(enemy, false, 0, 0);
      }
    }

    // Permanent Artifact: Arcane Conduit — 30% chance on any kill to restore +1 MP!
    if (this.hasArtifact('arcane_conduit') && this.player.mp < this.player.maxMp && Math.random() < 0.3) {
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
      this.spawnDamageNumber(this.player.x, this.player.y - this.player.baseH - 22, '+1 MP', '#60a5fa', 0.88, 'CONDUIT');
    }

    // Gold Coin drops on EVERY kill (+Assassination bonus + Boss jackpot!) plus occasional HP & MP Goblets!
    const isElite =
      enemy.type === 'knight' ||
      enemy.type === 'goblin_brute' ||
      enemy.type === 'obsidian_guard' ||
      enemy.type === 'runed_golem';
    const baseGold = isBig ? 120 : enemy.isBoss ? 45 : isElite ? 14 : 6;
    const assassinGold = wasAssassination ? 12 : 0;
    const charmGoldMult =
      (this.hasBossCharm('deep_vein_heart') ? 1.3 : 1) *
      (this.hasBossCharm('cursed_compass') ? 1.4 : 1) *
      (this.hasBossCharm('velvet_signet') ? 1.25 : 1) *
      (this.hasCharmSynergy('gilded_corsair') ? 1.3 : 1) *
      (this.hasCharmSynergy('crystal_singularity') ? 1.2 : 1) *
      (this.hasCharmSynergy('sunfire_ordnance') ? 1.25 : 1) *
      (enemy.isBoss && this.hasBossCharm('astral_eclipse_prism') ? 1.25 : 1) *
      (wasAssassination && !this.player.onGround && this.hasCharmSynergy('celestial_chalice') ? 1.8 : 1);
    const totalGold = Math.round((baseGold + assassinGold) * charmGoldMult);
    const coinPieces = isBig ? 6 : enemy.isBoss ? 4 : wasAssassination ? 3 : 2;
    const goldPerPiece = Math.max(1, Math.round(totalGold / coinPieces));
    for (let c = 0; c < coinPieces; c++) {
      this.spawnWorldPickup(
        'gold',
        hitX + (Math.random() - 0.5) * 18,
        hitY - 8,
        goldPerPiece,
        (Math.random() - 0.5) * 210,
        -(180 + Math.random() * 120)
      );
    }
    if (!enemy.summoned) {
      const gobletRoll = Math.random();
      if (enemy.isBoss || gobletRoll < 0.14) {
        this.spawnWorldPickup('hp_goblet', hitX - 10, hitY - 10, 1, -75 - Math.random() * 50, -210);
      }
      if (enemy.isBoss || (gobletRoll >= 0.14 && gobletRoll < 0.28)) {
        this.spawnWorldPickup('mp_goblet', hitX + 10, hitY - 10, 2, 75 + Math.random() * 50, -210);
      }
    }

    // FINAL BIG BOSS SIGNATURE MYTHIC CHARM DROP!
    if (isBig && !enemy.summoned) {
      const charmId = RAID_BOSS_CHARM[this.activeRaidId];
      if (charmId) {
        this.spawnWorldPickup('boss_charm', hitX, Math.min(hitY - 24, this.currentStage.floorY - 44), 1, 0, 0, charmId);
        this.awardBossCharm(charmId, hitX, hitY - 20);
      }
    }

    // Boss Charm Kill Passives & Cross-Charm Synergies!
    if (this.hasBossCharm('crimson_chalice')) {
      this.chaliceKillCounter += 1;
      if (this.chaliceKillCounter % 5 === 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 2);
        this.spawnDamageNumber(this.player.x, this.player.y - this.player.baseH - 26, '+1 HP +2 MP', '#ef4444', 0.95, 'CRIMSON CHALICE');
      }
    }
    if (this.hasBossCharm('paradox_hourglass')) {
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
    }
    if (this.hasBossCharm('phylactery_locket')) {
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
      const boltCount = this.hasCharmSynergy('plague_necromancy') ? 2 : 1;
      for (let b = 0; b < boltCount; b++) {
        const nearest = this.enemies.find((other) => !other.dead && other !== enemy && Math.hypot(other.x - hitX, other.y - hitY) < 420);
        const angle = nearest ? Math.atan2(nearest.y - 32 - hitY, nearest.x - hitX) + (b - 0.5) * 0.22 : (this.player.facing > 0 ? 0 : Math.PI);
        this.projectiles.push({
          id: this.nextProjectileId++,
          x: hitX,
          y: hitY,
          vx: Math.cos(angle) * 380,
          vy: Math.sin(angle) * 380,
          radius: 8,
          fromEnemy: false,
          damage: this.hasCharmSynergy('forge_of_souls') ? 4 : 3,
          life: 1.5,
          rotation: 0,
          kind: 'orb',
          color: this.hasCharmSynergy('forge_of_souls') ? '#f97316' : '#a855f7',
        });
      }
    }
    if (this.hasBossCharm('mycelial_crown')) {
      // Spore cloud burst damages nearby enemies & trims active cooldowns by 18%
      this.shockwaves.push({ x: hitX, y: hitY, radius: 10, maxRadius: 118, color: '#10b981', life: 0.28, maxLife: 0.28 });
      this.player.weaponSkillCooldown *= 0.82;
      for (const ab of Object.keys(this.player.abilityCooldowns) as AbilityId[]) {
        this.player.abilityCooldowns[ab] *= 0.82;
      }
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        if (Math.hypot(other.x - hitX, other.y - hitY) < 125) {
          other.hp = Math.max(0, other.hp - 2);
          other.flashTimer = 0.14;
          this.spawnDamageNumber(other.x, other.y - 40, '2', '#34d399', 0.88, 'SPORE');
          if (other.hp <= 0) this.handleEnemyKilled(other, other.x, other.y - 24);
        }
      }
      if (wasAssassination && this.hasCharmSynergy('crimson_spores')) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.player.weaponSkillCooldown = 0;
        this.spawnDamageNumber(this.player.x, this.player.y - this.player.baseH - 36, 'CRIMSON SPORES +1 HP', '#ec4899', 0.96);
      }
    }
    if (wasAssassination && this.hasBossCharm('sunscarab_seal')) {
      this.shockwaves.push({ x: hitX, y: hitY, radius: 12, maxRadius: 120, color: '#eab308', life: 0.24, maxLife: 0.24 });
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        if (Math.hypot(other.x - hitX, other.y - hitY) < 130) {
          this.applyBurn(other, 3.5);
          other.hurtStunTimer = Math.max(other.hurtStunTimer, 0.55);
          this.spawnDamageNumber(other.x, other.y - 44, 'SCORCHED', '#facc15', 0.85);
        }
      }
    }

    // Shattered Mirror Phantoms burst into crystalline glass shards, restoring +1 MP & dropping +1 Relic Shard!
    if (enemy.isMirrorPhantom) {
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 10,
        maxRadius: 96,
        color: '#67e8f9',
        life: 0.28,
        maxLife: 0.28,
      });
      this.spawnSparkles(hitX, hitY, 22, '#e0f2fe', '#f472b6', 1.35);
      this.shards += 1;
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
      this.spawnDamageNumber(hitX, hitY - 26, '+1 SHARD · +1 MP', '#67e8f9', 0.92, 'MIRROR SHATTERED!');
      sound.playCoin();
    }

    // Non-boss foes occasionally drop Relic Shards for camp crafting (DOUBLED inside Cursed Chambers!)
    if (
      !enemy.isBoss &&
      !enemy.summoned &&
      (isElite || this.isCursedChamber || Math.random() < 0.45)
    ) {
      const shardDrop = this.isCursedChamber ? 2 : 1;
      this.shards += shardDrop;
      this.spawnDamageNumber(hitX, hitY - 26, `+${shardDrop} SHARD${shardDrop > 1 ? 'S' : ''}`, '#e5a93c', 0.85);
      sound.playCoin();
    }

    // Elemental Kill Passives (Nature heal every 5 kills; Light/Solar/Prism chance to heal)
    if (this.player.combinedElement === 'nature') {
      this.elementalKillCounter += 1;
      if (this.elementalKillCounter % 5 === 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
        this.spawnDamageNumber(
          this.player.x,
          this.player.y - this.player.baseH - 26,
          '+1 HP · +1 MP',
          '#4ade80',
          0.95,
          'NATURE BLOOM'
        );
      }
    } else if (this.hasElement('light') && this.player.hp < this.player.maxHp && Math.random() < 0.22) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      this.spawnDamageNumber(this.player.x, this.player.y - this.player.baseH - 24, '+1 HP', '#fde047', 0.9, 'DAWN GRACE');
    }

    // Simple, clean XP numbers: 1 XP per normal enemy, 2 XP elite, 4 XP mini-boss, 8 XP big boss (+1 XP Assassination & +1 XP Cursed Chamber bonus!)
    const baseXp = isBig
      ? 8
      : enemy.isBoss
        ? 4
        : enemy.type === 'knight' ||
            enemy.type === 'goblin_brute' ||
            enemy.type === 'obsidian_guard'
          ? 2
          : 1;
    const cursedXp = this.isCursedChamber ? 1 : 0;
    const totalXp = baseXp + (wasAssassination ? 1 : 0) + cursedXp;
    this.grantXp(
      totalXp,
      hitX,
      hitY - 44,
      wasAssassination ? 'ASSASSIN +1 XP' : this.isCursedChamber ? 'CURSED +1 XP' : undefined
    );
  }

  private checkCombatCollisions(tuning: TuningConfig): void {
    const p = this.player;
    const pRect = this.getPlayerHurtbox(tuning.playerScale);
    const attackBox = this.getAttackHitbox(tuning);
    const megaBox = this.getKatanaMegaHitbox(tuning);

    // Check Breakable Secret Walls against weapon attacks!
    if (attackBox || megaBox) {
      for (const sw of this.secretWalls) {
        if (sw.broken) continue;
        if (
          (attackBox && rectsOverlap(attackBox, sw)) ||
          (megaBox && rectsOverlap(megaBox, sw))
        ) {
          const hitId = -9000 - this.secretWalls.indexOf(sw);
          if (!p.attackHitIds.has(hitId)) {
            p.attackHitIds.add(hitId);
            this.damageSecretWall(sw, 1);
          }
        }
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const eRect = this.getEnemyRect(enemy, tuning.enemyScale);

      if (attackBox && !p.attackHitIds.has(enemy.id) && rectsOverlap(attackBox, eRect)) {
        p.attackHitIds.add(enemy.id);
        if (p.attackWeapon === 'ash_wraps') {
          // Monk 3-hit chain: jab, jab, heavy palm (bonus damage, guard break, big shove).
          const palm = p.monkComboStep === 2;
          this.handlePlayerHitEnemy(
            enemy,
            tuning,
            'weapon',
            1 + p.weaponDamageBonus,
            palm
              ? { kbX: 320, kbY: 130, bonusDamage: this.charTune('monk').monkComboBonus, guardBreak: true, stun: 0.42 }
              : { kbX: 105 }
          );
        } else if (p.attackWeapon === 'shadow_daggers') {
          // Dagger chain: stab, slash, then a cross-slash (bonus damage, a real shove for pit kills).
          const cross = p.assassinComboStep === 2;
          this.handlePlayerHitEnemy(
            enemy,
            tuning,
            'weapon',
            1 + p.weaponDamageBonus,
            cross
              ? { kbX: 300, kbY: 110, bonusDamage: this.charTune('assassin').assassinComboBonus, stun: 0.3 }
              : { kbX: 85 }
          );
        } else if (p.attackWeapon === 'cleaver_greatsword' || p.attackWeapon === 'joust_lance') {
          const chargeBonus = Math.round(p.weaponChargeTimer * 4.5) + 1;
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 1 + p.weaponDamageBonus, {
            bonusDamage: chargeBonus,
            guardBreak: true,
            kbX: 280 + p.weaponChargeTimer * 180,
            stun: 0.25 + p.weaponChargeTimer * 0.28,
          });
        } else if (p.attackWeapon === 'meteor_flail') {
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 1 + p.weaponDamageBonus, {
            bonusDamage: 2,
            guardBreak: true,
            kbX: 310,
            kbY: 140,
            stun: 0.42,
          });
        } else if (p.attackWeapon === 'kusarigama') {
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 1 + p.weaponDamageBonus, {
            bonusDamage: 0,
            kbX: 40,
            stun: 0.3,
          });
          if (!enemy.dead && !enemy.isBoss) {
            // Weighted chain yanks enemies straight into Monk melee range!
            const pullDir = p.x >= enemy.x ? 1 : -1;
            enemy.vx = pullDir * 330;
            enemy.vy = -125;
            enemy.onGround = false;
            enemy.x += (p.x + p.facing * 42 - enemy.x) * 0.36;
            this.spawnSparkles(enemy.x, enemy.y - 26, 8, '#e2e8f0', '#fb923c', 0.8);
          }
        } else if (p.attackWeapon === 'shield_mace') {
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 1 + p.weaponDamageBonus, {
            bonusDamage: 1,
            guardBreak: true,
            kbX: 390,
            kbY: 155,
            stun: 0.4,
          });
        } else {
          this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 1 + p.weaponDamageBonus);
        }
      }

      if (megaBox && !p.katanaMegaHitIds.has(enemy.id) && rectsOverlap(megaBox, eRect)) {
        p.katanaMegaHitIds.add(enemy.id);
        this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 2 + p.weaponDamageBonus);
      }

      const isPiercedByBounce = p.bounceActive && p.bounceHitIds.has(enemy.id);
      if (
        !enemy.dead &&
        !isPiercedByBounce &&
        !(p.isHidden && !enemy.isBoss) &&
        rectsOverlap(pRect, eRect)
      ) {
        this.damagePlayer(this.scaleEnemyDamage(1, enemy), enemy.x, enemy.isBoss, tuning);
        enemy.alerted = true;
      }
    }
  }

  private handlePlayerHitEnemy(
    enemy: Enemy,
    tuning: TuningConfig,
    source: 'weapon' | 'fireball' | 'dash' | 'grapple' | 'gas' | 'hammer_meteor',
    abilityPower = 1,
    opts?: HitOpts
  ): void {
    const p = this.player;
    const eScale = tuning.enemyScale;
    const hitX = enemy.x;
    const hitY = enemy.y - enemy.baseH * eScale * 0.55;

    // Boss post-hit invulnerability frames (prevents instant combo-melting bosses!)
    if (enemy.isBoss && enemy.invulnTimer > 0 && source !== 'gas') {
      sound.playArmorBlock();
      this.spawnSparkles(hitX, hitY, 6, '#e2e8f0', '#94a3b8', 0.75);
      return;
    }

    const weaponLv = 1 + p.weaponDamageBonus;
    const weaponFlat = this.getWeaponFlatBonus(weaponLv);
    const spellFlat = this.getSpellFlatBonus(abilityPower);

    const isBehindEnemy = (p.x - enemy.x) * enemy.facing < 24;
    const isDropAssassination =
      !enemy.alerted &&
      !enemy.isBoss &&
      !p.onGround &&
      p.y < enemy.y - 22 &&
      Math.abs(p.x - enemy.x) < 145;
    const canAssassinate = (source === 'weapon' || source === 'dash') && !opts?.noAssassinate;
    const isAssassination =
      (Boolean(opts?.forceAssassinate) && !enemy.isBoss) ||
      (canAssassinate &&
        tuning.assassinationEnabled &&
        ((!enemy.alerted && (isBehindEnemy || isDropAssassination)) ||
          (p.ambushTimer > 0 && !enemy.isBoss)));

    const isHeavyHit =
      source === 'hammer_meteor' ||
      Boolean(opts?.guardBreak) ||
      ((p.weapon === 'hammer' ||
        p.weapon === 'greataxe' ||
        p.weapon === 'cleaver_greatsword' ||
        p.weapon === 'joust_lance' ||
        p.weapon === 'meteor_flail' ||
        p.weapon === 'shield_mace') &&
        source === 'weapon');

    // Front-Shield Guard for armored Knights & Obsidian Guards!
    // Light frontal strikes clang off the shield; flank behind, use heavy Hammer/Greataxe, or cast Spells to shatter guard!
    if (!enemy.isBoss && enemy.shieldActive && source === 'weapon' && !isBehindEnemy && !isAssassination) {
      if (!isHeavyHit && p.katanaMegaSlashTimer <= 0) {
        sound.playArmorBlock();
        this.triggerShake(3.2, 0.1);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.036);
        this.spawnSparkles(hitX + enemy.facing * 12, hitY, 10, '#f8fafc', '#fbbf24', 0.9);
        this.spawnDamageNumber(hitX, hitY - 14, 'SHIELDED', '#cbd5e1', 0.9, 'FLANK OR HEAVY');
        enemy.alerted = true;
        return;
      } else {
        enemy.shieldActive = false;
        this.spawnDamageNumber(hitX, hitY - 26, 'GUARD BREAK', '#fbbf24', 1.0);
      }
    } else if (enemy.shieldActive && (isBehindEnemy || source !== 'weapon')) {
      enemy.shieldActive = false;
    }

    // Track flowing melee combo streak for +10% crit bonus at 5+ hits
    if (source !== 'gas') {
      this.comboCount += 1;
      this.comboTimer = 3.2;
    }

    const aFlags = affFlags(p, tuning);
    const aMods =
      source === 'gas' || !combatTune(tuning).affinityAttacks
        ? affinityHitMods(aFlags, enemy, { ...combatTune(tuning), affinityPower: 0 }, false)
        : affinityHitMods(aFlags, enemy, combatTune(tuning), isSkill3Active(p));

    const fireBonusActive =
      p.fireWeaponTimer > 0 &&
      (source === 'weapon' || source === 'dash' || source === 'hammer_meteor');
    const fireCritBonus = fireBonusActive ? (p.fireWeaponLevel >= 5 ? 40 : 20) : 0;
    const crestCritBonus = this.hasArtifact('vampire_crest') ? 12 : 0;
    const rapierCritBonus =
      (p.weapon === 'rapier' || p.weapon === 'silk_whip' || p.weapon === 'estoc_spear') && source === 'weapon' ? 15 : 0;
    const comboCritBonus = this.comboCount >= 5 ? 10 : 0;
    const assassinCritBonus = p.assassinTrainingLevel * 6 + this.permAltarBonuses.agility * 4;
    const weaponCritBonus = Math.max(0, weaponLv - 1);
    const elementCritBonus =
      p.combinedElement === 'eclipse' || p.combinedElement === 'bloodmoon'
        ? 25
        : p.combinedElement === 'phantom' || p.combinedElement === 'glacial_light'
          ? 22
          : p.combinedElement === 'hellfire' || p.combinedElement === 'crimson_storm'
            ? 20
            : p.combinedElement === 'abyss' ||
                p.combinedElement === 'obsidian' ||
                this.hasElement('shadow') ||
                this.hasElement('glacial') ||
                this.hasElement('blood')
              ? 18
              : 0;
    const charmCritBonus =
      (this.hasBossCharm('crimson_chalice') ? 15 : 0) +
      (this.hasBossCharm('velvet_signet') ? 18 : 0);
    const effectiveCritChance =
      source === 'gas'
        ? 0
        : Math.min(
            100,
            tuning.weaponCritChance +
              fireCritBonus +
              crestCritBonus +
              rapierCritBonus +
              comboCritBonus +
              assassinCritBonus +
              weaponCritBonus +
              elementCritBonus +
              charmCritBonus
          );

    const isCrit =
      !isAssassination &&
      effectiveCritChance > 0 &&
      Math.random() * 100 < effectiveCritChance;

    if (isCrit && this.hasBossCharm('velvet_signet')) {
      p.mp = Math.min(p.maxMp, p.mp + 1);
    }
    if (this.hasBossCharm('abyssal_trident_pearl') || this.hasBossCharm('glacial_aegis_shard')) {
      enemy.chillTimer = Math.max(enemy.chillTimer ?? 0, 2.6);
    }

    // Rebalanced slower power scaling: gentle % per level + flat milestone every 3 levels
    let baseDamage = 1;
    const weaponPctMult =
      (1 + Math.max(0, weaponLv - 1) * 0.05) *
      (this.hasBossCharm('molten_anvil_heart') ? 1.2 : 1) *
      (this.hasBossCharm('ironhorn_war_tusk') ? 1.25 : 1) *
      (this.hasCharmSynergy('iron_glacier') ? 1.25 : 1) *
      (this.hasCharmSynergy('gilded_furnace') ? 1.25 : 1) *
      (this.hasCharmSynergy('forge_of_souls') ? 1.2 : 1);
    const spellPctMult =
      (1 + Math.max(0, abilityPower - 1) * 0.1) *
      (this.hasBossCharm('phylactery_locket') ? 1.25 : 1) *
      (this.hasCharmSynergy('forge_of_souls') ? 1.2 : 1);
    if (source === 'hammer_meteor') {
      const charBonus = this.cdef(p.characterId).bonusBaseDamage;
      baseDamage = Math.round((this.charTune().hammerMeteorDamage + charBonus + weaponFlat + (enemy.isBoss ? 2 : 0)) * weaponPctMult);
    } else if (source === 'weapon') {
      const charBonus = this.cdef(p.characterId).bonusBaseDamage;
      const heavyBonus = p.weapon === 'hammer' || p.weapon === 'greataxe' ? 1 : 0;
      const megaBonus = p.katanaMegaSlashTimer > 0 ? this.charTune().katanaMegaBonus : 0;
      const bossBonus = enemy.isBoss ? 1 : 0;
      baseDamage = Math.max(1, Math.round((1 + charBonus + heavyBonus + megaBonus + weaponFlat + bossBonus) * weaponPctMult));
    } else if (source === 'fireball') {
      baseDamage = Math.max(2, Math.round((2 + spellFlat + (enemy.isBoss ? 1 : 0)) * spellPctMult));
    } else if (source === 'dash') {
      baseDamage = Math.max(2, Math.round((3 + spellFlat + weaponFlat) * spellPctMult));
    } else if (source === 'grapple') {
      baseDamage = Math.max(2, Math.round((2 + spellFlat) * spellPctMult));
    } else if (source === 'gas') {
      baseDamage = Math.max(1, Math.round((1 + spellFlat) * spellPctMult));
    }

    const fireBonus = fireBonusActive ? 1 + this.getSpellFlatBonus(p.fireWeaponLevel) : 0;
    let damage = baseDamage + fireBonus + Math.max(0, Math.round((opts?.bonusDamage ?? 0) + aMods.bonusDamage));

    // Boss Charm Global & Aerial Damage Modifiers!
    if (this.hasBossCharm('astral_eclipse_prism')) {
      damage = Math.max(damage + 1, Math.round(damage * 1.18));
    }
    if (!p.onGround && this.hasBossCharm('jade_feather_pearl')) {
      const airMult = this.hasCharmSynergy('skyforged_tempest') ? 1.75 : 1.45;
      damage = Math.max(damage + 1, Math.round(damage * airMult));
    }

    // Light / Solar / Prism / Eclipse Boss Damage bonus!
    if (enemy.isBoss && this.hasElement('light')) {
      const bossMult = p.combinedElement === 'solar' || p.combinedElement === 'eclipse' ? 1.3 : 1.25;
      damage = Math.max(damage + 1, Math.round(damage * bossMult));
    }

    if (tuning.playerDamageMult !== 1 && !isAssassination) {
      damage = tuning.playerDamageMult <= 0 ? 0 : Math.max(1, Math.round(damage * tuning.playerDamageMult));
    }

    // HARDER FIGHTS WHEN DISCOVERED: Alerted non-boss foes bracing head-on resist 28% frontal non-crit/non-spell damage!
    const isSpellSrcCheck = source === 'fireball' || source === 'dash' || source === 'grapple' || source === 'gas';
    const hitFromFront = (p.x - enemy.x) * enemy.facing > 0;
    if (!isAssassination && !isCrit && !isSpellSrcCheck && !enemy.isBoss && enemy.alerted && hitFromFront && damage > 1) {
      damage = Math.max(1, Math.round(damage * 0.72));
    }

    if (isAssassination) {
      const assMult = (1 + p.assassinTrainingLevel * 0.12) * this.charTune().assassinDamageMult * tuning.playerDamageMult;
      const shadowAssBonus = this.hasElement('shadow') ? 2 : 0;
      damage = enemy.isBoss
        ? Math.round((8 + weaponFlat * 2 + shadowAssBonus) * assMult)
        : Math.max(enemy.hp, Math.round((6 + shadowAssBonus) * assMult));
      this.assassinations += 1;
      if (this.hasCharmSynergy('eclipse_sovereign')) {
        p.mp = Math.min(p.maxMp, p.mp + 1);
        p.shadowChainTimer = Math.max(p.shadowChainTimer, 4.0);
      }
    } else if (isCrit) {
      const critMult =
        tuning.critMultiplier *
        (this.hasCharmSynergy('celestial_chalice') ? 1.25 : 1) *
        (this.hasCharmSynergy('skyforged_tempest') && !p.onGround ? 1.3 : 1);
      damage = Math.max(2, Math.round(damage * critMult));
      this.crits += 1;
      if (this.hasCharmSynergy('eclipse_sovereign')) {
        p.mp = Math.min(p.maxMp, p.mp + 1);
        p.shadowChainTimer = Math.max(p.shadowChainTimer, 3.0);
      }
    }

    // Blackpowder Idol (Explosive AoE blast on Crits & Assassinations) + Singularity Core (Gravity Pull on Spells & Crits)!
    if ((isCrit || isAssassination) && this.hasBossCharm('blackpowder_idol')) {
      const blastR = this.hasCharmSynergy('blood_and_powder') ? 155 : 112;
      const blastDmg = Math.max(
        2,
        Math.round(damage * (this.hasCharmSynergy('void_alchemist') ? 0.55 : 0.35))
      );
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 12,
        maxRadius: blastR,
        color: this.hasCharmSynergy('void_alchemist') ? '#22d3ee' : '#f97316',
        life: 0.25,
        maxLife: 0.25,
      });
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        if (Math.hypot(other.x - hitX, other.y - hitY) <= blastR) {
          if (this.hasCharmSynergy('void_alchemist')) {
            other.x += (hitX - other.x) * 0.35;
          }
          other.hp = Math.max(0, other.hp - blastDmg);
          other.flashTimer = 0.14;
          if (this.hasCharmSynergy('sunfire_ordnance')) this.applyBurn(other, 3.0);
          this.spawnDamageNumber(other.x, other.y - 38, `${blastDmg}`, '#fb923c', 0.9, 'BLAST');
          if (other.hp <= 0) this.handleEnemyKilled(other, other.x, other.y - 24);
        }
      }
      if (this.hasCharmSynergy('blood_and_powder')) {
        this.blastSiphonCounter += 1;
        if (this.blastSiphonCounter % 4 === 0) {
          p.hp = Math.min(p.maxHp, p.hp + 1);
          this.spawnDamageNumber(p.x, p.y - p.baseH - 28, '+1 HP', '#fb7185', 0.9, 'BLOOD & POWDER');
        }
      }
    }
    if ((isSpellSrcCheck || isCrit) && this.hasBossCharm('singularity_core')) {
      const pullR = 175;
      this.shockwaves.push({ x: hitX, y: hitY, radius: 18, maxRadius: pullR, color: '#06b6d4', life: 0.22, maxLife: 0.22 });
      for (const other of this.enemies) {
        if (other.dead || other === enemy || other.isBoss) continue;
        if (Math.hypot(other.x - hitX, other.y - hitY) <= pullR) {
          other.x += (hitX - other.x) * 0.42;
          if (this.hasCharmSynergy('solar_singularity')) {
            this.applyBurn(other, 3.4);
          }
        }
      }
      damage = Math.round(damage * 1.25);
    }
    if ((isCrit || isHeavyHit) && this.hasBossCharm('deep_vein_heart')) {
      damage = Math.round(damage * 1.25);
      const shardR = this.hasCharmSynergy('crystal_singularity') ? 135 : 95;
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 10,
        maxRadius: shardR,
        color: '#c084fc',
        life: 0.24,
        maxLife: 0.24,
      });
      this.spawnSparkles(hitX, hitY, 16, '#c084fc', '#fde68a', 1.15);
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        if (Math.hypot(other.x - hitX, other.y - hitY) <= shardR) {
          const splash = Math.max(2, Math.round(damage * (this.hasCharmSynergy('crystal_singularity') ? 0.4 : 0.28)));
          other.hp = Math.max(0, other.hp - splash);
          other.flashTimer = 0.14;
          this.spawnDamageNumber(other.x, other.y - 36, `${splash}`, '#e879f9', 0.9, 'CRYSTAL');
          if (other.hp <= 0) this.handleEnemyKilled(other, other.x, other.y - 24);
        }
      }
    }

    // Assassin: Mark for Death makes a marked boss take extra damage from every hit.
    if (enemy.isBoss && (enemy.markTimer ?? 0) > 0 && source !== 'gas' && damage > 0) {
      const ctM = this.charTune('assassin');
      const lightBonus = this.hasElement('light') ? 1.2 : 1;
      const extra = Math.max(1, Math.ceil(damage * (ctM.assassinBossMarkBonusPct / 100) * lightBonus - 0.001));
      damage += extra;
      this.spawnDamageNumber(hitX + 12, hitY - 34, `+${extra}`, '#be123c', 0.95, 'MARKED');
      this.spawnSparkles(hitX, hitY, 6, '#9f1239', '#fda4af', 0.7);
    }

    const dealt = Math.min(enemy.hp, damage);
    this.raidDamageDealt += Math.max(0, dealt);
    enemy.hp = Math.max(0, enemy.hp - damage);
    if (enemy.hp > 0 && !enemy.isBoss && source !== 'gas') sound.playEnemyHurt(enemy.type);
    enemy.flashTimer = 0.18;
    enemy.hurtStunTimer = enemy.isBoss ? 0.04 : source === 'gas' ? 0.05 : 0.22;
    enemy.alerted = true;
    const pushDir =
      opts?.dirX !== undefined ? (opts.dirX >= 0 ? 1 : -1) : source === 'hammer_meteor' ? (enemy.x >= p.x ? 1 : -1) : p.facing;
    if (source !== 'gas') {
      const kbMult = tuning.knockbackMult ?? 1;
      const kb = (opts?.kbX ?? (source === 'hammer_meteor' ? 280 : isHeavyHit ? 225 : 135)) * kbMult * aMods.kbMul;
      enemy.vx = pushDir * (enemy.isBoss ? (opts?.kbX ? Math.min(160, 48 + kb * 0.12) : 48) : kb);
      const flying = isFlyingEnemyType(enemy.type);
      if (!enemy.isBoss && enemy.hp > 0) {
        if (opts?.stun || aMods.stunAdd) enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, (opts?.stun ?? 0) + aMods.stunAdd);
        if (opts?.kbY && !flying) {
          enemy.vy = Math.min(enemy.vy, -opts.kbY * kbMult);
          enemy.onGround = false;
        }
        // Ledge shove: any hero's hit next to a pit edge sends regular foes over it.
        if (tuning.ledgeShoveAssist !== false && !flying && enemy.onGround && this.isNearLedge(enemy, pushDir, 70, tuning)) {
          enemy.vx = pushDir * Math.max(Math.abs(enemy.vx), 300);
          enemy.vy = Math.min(enemy.vy, -150);
          enemy.onGround = false;
          enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.45);
        }
      }
    }

    // Wraith spectral phase-step when surviving a strike!
    if (enemy.type === 'wraith' && enemy.hp > 0 && source !== 'gas') {
      this.spawnSparkles(enemy.x, hitY, 10, '#67e8f9', '#ffffff', 0.9);
      enemy.x = Math.max(80, Math.min(this.currentStage.worldWidth - 100, enemy.x + pushDir * 85));
      this.spawnSparkles(enemy.x, hitY, 10, '#67e8f9', '#ffffff', 0.9);
    }

    // Visceral directional BLOOD BURST on EVERY hit!
    if (source !== 'gas') {
      this.spawnBloodBurst(
        hitX,
        hitY,
        pushDir,
        isAssassination ? 34 : isCrit ? 22 : isHeavyHit ? 15 : 11,
        isAssassination ? 1.38 : isCrit ? 1.2 : isHeavyHit ? 1.12 : 0.95,
        isAssassination ? 6 : isCrit ? 4 : 2
      );
    }

    // Boss Anti-Combo Protection: Post-Hit Immunity + Reactive Jump-Away OR Instant Counter-Charge!
    if (enemy.isBoss && enemy.hp > 0 && source !== 'gas') {
      enemy.invulnTimer = (enemy.isBigBoss ? 0.62 : 0.56) * (this.enemyTune(enemy).invulnMult ?? 1);
      enemy.bossHitCounter += 1;
      const pace = getRaidOrderScaling(this.getRaidOrderTier()).chargeSpeedMult * this.getRoomPaceMult();
      const isFlyingBoss = isFlyingEnemyType(enemy.type);

      if (enemy.lungeTimer <= 0) {
        if (enemy.bossHitCounter % 2 === 1) {
          // Odd hits: Boss immediately jumps away (or blinks across arena) so player can't combo-lock!
          enemy.attackChargeTimer = 0;
          enemy.pendingAttackKind = '';
          if (isFlyingBoss) {
            this.spawnSparkles(enemy.x, enemy.y - 42, 12, '#e879f9', '#ffffff', 1.0);
            const leftX = this.currentStage.bossZoneStartX + 170;
            const rightX = this.currentStage.worldWidth - 170;
            enemy.x = Math.abs(enemy.x - leftX) < Math.abs(enemy.x - rightX) ? rightX : leftX;
            this.spawnSparkles(enemy.x, enemy.y - 42, 12, '#e879f9', '#ffffff', 1.0);
            sound.playBackdash();
            enemy.attackCooldown = 0.72 / pace;
          } else if (enemy.onGround) {
            let awayDir = enemy.x >= p.x ? 1 : -1;
            const bossMinX = this.currentStage.bossZoneStartX + 120;
            const bossMaxX = this.currentStage.worldWidth - 120;
            if ((awayDir === 1 && enemy.x > bossMaxX - 110) || (awayDir === -1 && enemy.x < bossMinX + 110)) {
              awayDir = -awayDir;
            }
            enemy.vy = -415;
            enemy.vx = awayDir * 255;
            enemy.onGround = false;
            enemy.hurtStunTimer = 0;
            enemy.attackCooldown = 0.8 / pace;
            sound.playJump();
            this.spawnSparkles(enemy.x, enemy.y - 8, 8, '#cbd5e1', '#fbbf24', 0.85);
          }
        } else if (enemy.attackChargeTimer <= 0) {
          // Even hits: Boss braces and immediately telegraphs a swift counter-charge attack!
          enemy.facing = p.x >= enemy.x ? 1 : -1;
          enemy.vx = 0;
          enemy.hurtStunTimer = 0;
          const distToPlayer = Math.abs(p.x - enemy.x);
          const counterDur = Math.max(0.3, 0.48 / pace);
          let counterKind = 'charge';
          if (enemy.type === 'boss_valerius') {
            counterKind = enemy.enraged ? 'eclipse' : distToPlayer > 155 ? 'orbs' : 'leap';
          } else if (enemy.type === 'boss_vampire_duelist') {
            counterKind = distToPlayer > 170 ? 'blink' : 'lunge';
          } else if (enemy.type === 'boss_colossus' || enemy.type === 'boss_goblin_behemoth' || enemy.type === 'boss_executioner') {
            counterKind = 'charge';
          } else if (enemy.type === 'boss_malakor') {
            counterKind = 'bolts';
          } else if (enemy.type === 'boss_gargoyle_king') {
            counterKind = 'dive';
          } else if (enemy.type === 'boss_goblin_chief') {
            counterKind = 'lunge';
          } else if (enemy.type === 'boss_goblin_sapper') {
            counterKind = 'bomb_rain';
          } else if (enemy.type === 'boss_goblin_shaman') {
            counterKind = 'hex_fan';
          } else if (enemy.type === 'boss_goblin_warlord' || enemy.type === 'boss_forge_lord') {
            counterKind = distToPlayer < 230 ? 'charge' : 'slam';
          } else if (enemy.type === 'boss_gravedigger') {
            counterKind = 'tombstone';
          } else if (enemy.type === 'boss_banshee') {
            counterKind = 'wail';
          } else if (enemy.type === 'boss_bone_reaver') {
            counterKind = 'scythe';
          } else if (enemy.type === 'boss_necromancer') {
            counterKind = 'hex_fan';
          } else if (enemy.type === 'boss_pyre_matriarch' || enemy.type === 'boss_slag_titan' || enemy.type === 'boss_cinder_warden' || enemy.type === 'boss_infernal_knight') {
            counterKind = 'lava';
          } else if (enemy.type === 'boss_eclipse_overlord') {
            counterKind = distToPlayer < 210 ? 'eclipse' : 'blink';
          } else if (enemy.type === 'boss_mushroom_sovereign') {
            counterKind = distToPlayer < 220 ? 'slam' : 'spore_volley';
          } else if (enemy.type === 'boss_sand_pharaoh') {
            counterKind = distToPlayer < 220 ? 'khopesh_charge' : 'mirage_blink';
          } else if (enemy.type === 'boss_alien_archon') {
            counterKind = distToPlayer < 230 ? 'warp_ring' : 'plasma_fan';
          } else if (enemy.type === 'boss_dragon_crane') {
            counterKind = distToPlayer < 260 ? 'crane_dive' : 'gale_blades';
          } else if (enemy.type === 'boss_dwarf_king') {
            counterKind = distToPlayer < 230 ? 'slam' : 'charge';
          }
          enemy.pendingAttackKind = counterKind;
          enemy.chargeDuration = counterDur;
          enemy.attackChargeTimer = counterDur;
          sound.playHammerCharge();
        }
      }
    }

    // Milestone Lv 3+ Burn DoT & Permanent Grimoire Ember Artifact!
    const isSpellSource = source === 'fireball' || source === 'dash' || source === 'grapple' || source === 'gas';
    const shouldBurn =
      (isSpellSource && (abilityPower >= 3 || this.hasArtifact('grimoire_ember'))) ||
      (fireBonusActive && (p.fireWeaponLevel >= 3 || this.hasArtifact('grimoire_ember'))) ||
      ((source === 'weapon' || source === 'hammer_meteor') && weaponLv >= 5);
    if (shouldBurn && enemy.hp > 0) {
      this.applyBurn(enemy, 3.2);
    }

    // Fire Weapon Lv 4+ Flame Surge: melee hits emit fiery impact shockwave!
    if (fireBonusActive && p.fireWeaponLevel >= 4 && source === 'weapon') {
      const surgeR = 72;
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 10,
        maxRadius: surgeR,
        color: '#f97316',
        life: 0.2,
        maxLife: 0.2,
      });
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        const oy = other.y - (other.baseH * eScale) / 2;
        if (Math.hypot(other.x - hitX, oy - hitY) <= surgeR) {
          other.hp = Math.max(0, other.hp - 1);
          other.flashTimer = 0.12;
          this.applyBurn(other, 2.8);
          this.spawnDamageNumber(other.x, oy - 10, '1', '#fb923c', 0.85, 'SURGE');
          if (other.hp <= 0) this.handleEnemyKilled(other, other.x, oy);
        }
      }
    }

    // affinity-v1: element / weapon-tier impact effects and per-element hit feel
    const fxFeel =
      source !== 'gas' && !isAssassination
        ? this.fx.onHit(p, enemy, hitX, hitY, pushDir, { heavy: isHeavyHit, crit: isCrit, source, floorY: enemy.y })
        : { shakeMul: 1, hitstopAddMs: 0, extraShake: 0 };

    if (isAssassination) {
      // MASSIVE ANIME EXECUTION FREEZE + SLOW-MO + TRIPLE CROSS-SLASH + DOUBLE SHOCKWAVE!
      sound.playAssassinate();
      this.spawnSparkles(hitX, hitY, 44, '#ff334b', '#fff5d6', 2.0);
      this.spawnSlashLine(hitX, hitY, pushDir > 0 ? -0.58 : Math.PI + 0.58, 300, 14, '#ff334b', '#ffffff', 0.38);
      this.spawnSlashLine(hitX, hitY, pushDir > 0 ? 0.42 : Math.PI - 0.42, 235, 9, '#ffd166', '#ffffff', 0.32);
      this.spawnSlashLine(hitX, hitY, pushDir > 0 ? 0.04 : Math.PI - 0.04, 210, 5, '#ffffff', '#ff334b', 0.28);
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 14,
        maxRadius: 175,
        color: '#ff334b',
        life: 0.34,
        maxLife: 0.34,
      });
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 6,
        maxRadius: 115,
        color: '#fde047',
        life: 0.26,
        maxLife: 0.26,
      });
      // Shadow Chain Momentum: EVERY assassination triggers speed + stealth burst & rising chain chime!
      p.shadowChainCount += 1;
      const ctA = this.charTune();
      const mpReward = Math.max(0, Math.round(ctA.assassinMpReward));
      const chainDuration = ctA.shadowChainSec + p.assassinTrainingLevel * 0.7;
      p.shadowChainTimer = Math.max(p.shadowChainTimer, chainDuration);
      p.ambushTimer = Math.max(p.ambushTimer, chainDuration);
      sound.playShadowChain(p.shadowChainCount);

      const funnyCallouts = isDropAssassination
        ? ['DROP BONK!', 'FROM THE RAFTERS!', 'AIR MAIL!', 'HEADS UP!']
        : p.crouching
          ? ['SNEAK ATTACK!', 'BOO!', 'ANKLE BITER!', 'DIDN’T SEE ME!']
          : ['SURPRISE!', 'LIGHTS OUT!', 'SHADOW CHAIN!', 'CLEAN CUT!'];
      const callout = opts?.callout
        ? opts.callout
        : p.shadowChainCount >= 2
          ? `SHADOW CHAIN x${p.shadowChainCount}!`
          : funnyCallouts[Math.floor(Math.random() * funnyCallouts.length)];
      const mpTag = mpReward > 0 ? ` · +${mpReward} MP` : '';
      this.spawnDamageNumber(hitX, hitY - 18, `${damage}`, '#ff334b', 1.55, `${callout}${mpTag}`);
      // ASSASSINATION FREEZE (fully tunable in the Kill FX tab)
      this.triggerKillFreeze(hitX, hitY, enemy.isBoss, tuning);

      // Assassination execution bonus: restore +2 MP + brief i-frames
      p.mp = Math.min(p.maxMp, p.mp + mpReward);
      p.invulnTimer = Math.max(p.invulnTimer, ctA.assassinIFramesSec);
      this.afterimages.push({
        x: p.x,
        y: p.y,
        facing: p.facing,
        crouching: p.crouching,
        color: '#c084fc',
        life: 0.28,
        maxLife: 0.28,
      });
    } else if (isCrit) {
      // BIG FLASH FREEZE + IMPACT FRAME + ZOOM PUNCH on Critical Strike!
      sound.playCrit();
      this.spawnSparkles(hitX, hitY, 26, '#ffd166', '#ffffff', 1.55);
      this.spawnSlashLine(hitX, hitY, pushDir > 0 ? -0.52 : Math.PI + 0.52, 180, 9, '#ffd166', '#ffffff', 0.26);
      this.spawnSlashLine(hitX, hitY, pushDir > 0 ? 0.55 : Math.PI - 0.55, 130, 5, '#ff4d6d', '#ffffff', 0.22);
      this.spawnDamageNumber(hitX, hitY - 14, `${damage}`, '#ffd166', 1.38, 'CRITICAL');
      this.triggerShake(Math.max(12, tuning.critShakeIntensity * 1.25) * fxFeel.shakeMul + fxFeel.extraShake, 0.3);
      this.hitstopTimer = Math.max((tuning.hitstopMs / 1000) * 3.0, 0.175) + fxFeel.hitstopAddMs / 1000;
      this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.085);
      this.impactFrameTimer = Math.max(this.impactFrameTimer, 0.06);
      this.triggerImpactFlash('#fff3b0', 0.52, hitX, hitY, 1.35, 0.26);

      // Permanent Artifact: Vampire Lord's Crest — Crits restore +1 MP!
      if (this.hasArtifact('vampire_crest') && p.mp < p.maxMp) {
        p.mp = Math.min(p.maxMp, p.mp + 1);
        this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 16, '+1 MP', '#60a5fa', 0.85, 'CREST');
      }

      // Permanent Sacrifice Artifact: Bloodsteel Edge — Weapon crits unleash an AoE shockwave!
      if (this.hasArtifact('bloodsteel_edge') && (source === 'weapon' || source === 'hammer_meteor')) {
        const edgeR = 92;
        this.shockwaves.push({
          x: hitX,
          y: hitY,
          radius: 12,
          maxRadius: edgeR,
          color: '#ef4444',
          life: 0.24,
          maxLife: 0.24,
        });
        for (const other of this.enemies) {
          if (other.dead || other === enemy) continue;
          const oy = other.y - (other.baseH * eScale) / 2;
          if (Math.hypot(other.x - hitX, oy - hitY) <= edgeR) {
            other.hp = Math.max(0, other.hp - 2);
            other.flashTimer = 0.14;
            this.spawnDamageNumber(other.x, oy - 12, '2', '#ef4444', 0.95, 'BLOODSTEEL');
            if (other.hp <= 0) this.handleEnemyKilled(other, other.x, oy);
          }
        }
      }
    } else if (source === 'gas') {
      this.spawnSparkles(hitX, hitY, 6, '#4ade80', '#bbf7d0', 0.65);
      this.spawnDamageNumber(hitX, hitY - 8, `${damage}`, '#4ade80', 0.92);
    } else {
      // Crisp, tactile normal hit: distinct hit audio + guaranteed micro hit-freeze + small shake + slash streak!
      sound.playHit(isHeavyHit, p.weapon);
      const sparkPrimary =
        source === 'hammer_meteor' || fireBonusActive || source === 'fireball' ? '#fb923c' : '#fff6d6';
      this.spawnSparkles(hitX, hitY, source === 'hammer_meteor' ? 18 : 12, sparkPrimary, '#e5a93c', 1.05);
      this.spawnSlashLine(
        hitX,
        hitY,
        (pushDir > 0 ? -0.4 : Math.PI + 0.4) + (Math.random() - 0.5) * 0.55,
        isHeavyHit ? 115 : 82,
        isHeavyHit ? 6.5 : 4.2,
        fireBonusActive ? '#f97316' : '#ef4444',
        '#ffffff',
        0.16
      );
      this.spawnDamageNumber(
        hitX,
        hitY - 10,
        `${damage}`,
        source === 'hammer_meteor' || fireBonusActive || source === 'fireball' ? '#fdba74' : '#f3efe6',
        isHeavyHit ? 1.24 : 1.02
      );
      if (source === 'weapon' || source === 'dash' || source === 'hammer_meteor' || source === 'grapple') {
        const minFreeze = isHeavyHit ? 0.068 : 0.044;
        this.hitstopTimer = Math.max(this.hitstopTimer, Math.max(tuning.hitstopMs / 1000, minFreeze) + fxFeel.hitstopAddMs / 1000);
        this.triggerShake((isHeavyHit ? 6.2 : 3.8) * fxFeel.shakeMul + fxFeel.extraShake, isHeavyHit ? 0.16 : 0.11);
        this.cameraZoomPunch = Math.max(this.cameraZoomPunch, isHeavyHit ? 0.032 : 0.014);
      }
    }

    if (source !== 'gas') {
      this.applyElementalHitEffect(enemy, hitX, hitY, tuning, isCrit, isAssassination);
      this.applyAffinityAfterHit(enemy, hitX, hitY, tuning, aFlags, aMods);
    }

    // Monk passive — Unbroken Flow: every fist strike shaves 0.2s off Pyre Dash.
    if (p.characterId === 'monk' && source === 'weapon' && p.attackState !== 'idle' && p.weaponSkillCooldown > 0) {
      p.weaponSkillCooldown = Math.max(0, p.weaponSkillCooldown - 0.2);
    }

    if (enemy.hp <= 0) {
      this.handleEnemyKilled(enemy, hitX, hitY, isAssassination);
    }
  }

  private applyElementalHitEffect(
    enemy: Enemy,
    hitX: number,
    hitY: number,
    tuning: TuningConfig,
    isCrit: boolean,
    isAssassination: boolean
  ): void {
    const p = this.player;
    const activeDef = getActiveElementDef(p.baseElements, p.combinedElement);
    if (!activeDef) return;

    this.elementalHitCounter += 1;
    const eScale = tuning.enemyScale;
    const resBonus = p.elementResonance;
    const procDmg = 1 + resBonus + (activeDef.isCombined ? 1 : 0);
    const id = activeDef.id;

    // 1. Chill / Slow (Water, Glacial & all Ice Fusions)
    if ((this.hasElement('water') || this.hasElement('glacial')) && enemy.hp > 0) {
      enemy.chillTimer = Math.max(
        enemy.chillTimer ?? 0,
        id === 'frost' || id === 'permafrost' || id === 'glacial' ? 4.0 : 2.6
      );
    }

    // 2. Burn / Venom DoT (Fire, Venom & all Burn/Plague Fusions)
    if ((this.hasElement('fire') || this.hasElement('venom')) && enemy.hp > 0) {
      this.applyBurn(
        enemy,
        id === 'hellfire' || id === 'magma' || id === 'solar' || id === 'plaguefire' || id === 'venom' ? 4.6 : 3.4
      );
    }

    // 2b. Blood Siphon (Blood & Blood Fusions heal +1 HP every 6 strikes!)
    if (this.hasElement('blood') && this.elementalHitCounter % 6 === 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + 1);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 18, '+1 HP', '#dc2626', 0.9, 'BLOOD SIPHON');
    }

    // 3. MP Flow (Water / Steam / Prism / Aether / Abyss crits)
    const mpInterval = id === 'steam' || id === 'prism' || id === 'aether' ? 3 : 4;
    if (
      (this.hasElement('water') || id === 'aether' || id === 'arcane_blood') &&
      this.elementalHitCounter % mpInterval === 0 &&
      p.mp < p.maxMp
    ) {
      p.mp = Math.min(p.maxMp, p.mp + 1);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 16, '+1 MP', activeDef.primaryColor, 0.85, activeDef.name.toUpperCase());
    } else if (id === 'abyss' && isCrit && p.mp < p.maxMp) {
      p.mp = Math.min(p.maxMp, p.mp + 1);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 16, '+1 MP', '#818cf8', 0.85, 'ABYSS');
    }

    // 4. Visual & Audio Elemental Strike Procs!
    const shouldBigProc = isCrit || isAssassination || this.elementalHitCounter % 2 === 0;
    if (!shouldBigProc) {
      this.spawnSparkles(hitX, hitY, 6, activeDef.primaryColor, activeDef.secondaryColor, 0.8);
      return;
    }

    sound.playElementalProc(id);
    this.spawnSparkles(hitX, hitY, activeDef.isCombined ? 16 : 10, activeDef.primaryColor, activeDef.secondaryColor, activeDef.isCombined ? 1.25 : 1.0);

    const dealSplash = (radius: number, dmg: number, label: string, pullTowardHit = false) => {
      for (const other of this.enemies) {
        if (other.dead || other === enemy) continue;
        const oy = other.y - (other.baseH * eScale) * 0.5;
        if (Math.hypot(other.x - hitX, oy - hitY) <= radius) {
          other.hp = Math.max(0, other.hp - dmg);
          other.flashTimer = 0.14;
          if (this.hasElement('water') || this.hasElement('glacial')) other.chillTimer = Math.max(other.chillTimer ?? 0, 2.8);
          if (this.hasElement('fire') || this.hasElement('venom')) this.applyBurn(other, 3.2);
          if (pullTowardHit && !other.isBoss) {
            other.vx = (hitX >= other.x ? 1 : -1) * 195;
          }
          this.spawnDamageNumber(other.x, oy - 12, `${dmg}`, activeDef.primaryColor, 0.9, label);
          if (other.hp <= 0) this.handleEnemyKilled(other, other.x, oy);
        }
      }
    };

    if (id === 'lightning' || id === 'storm' || id === 'tempest' || id === 'crimson_storm' || id === 'storm_earth') {
      // Jagged Chain Lightning jumping up to 3 nearby enemies!
      let prevX = hitX;
      let prevY = hitY;
      const chained = new Set<number>([enemy.id]);
      for (let hop = 0; hop < 3 + resBonus; hop++) {
        let best: Enemy | null = null;
        let bestDist = 270;
        for (const other of this.enemies) {
          if (other.dead || chained.has(other.id)) continue;
          const oy = other.y - (other.baseH * eScale) * 0.5;
          const d = Math.hypot(other.x - prevX, oy - prevY);
          if (d < bestDist) {
            bestDist = d;
            best = other;
          }
        }
        if (!best) break;
        chained.add(best.id);
        const by = best.y - (best.baseH * eScale) * 0.5;
        this.elementalArcs.push({
          kind: 'lightning',
          x1: prevX,
          y1: prevY,
          x2: best.x,
          y2: by,
          color: activeDef.primaryColor,
          secondaryColor: activeDef.secondaryColor,
          life: 0.28,
          maxLife: 0.28,
          seed: Math.random() * 100,
        });
        best.hp = Math.max(0, best.hp - procDmg);
        best.flashTimer = 0.16;
        this.spawnDamageNumber(best.x, by - 12, `${procDmg}`, '#facc15', 0.98, 'CHAIN');
        if (best.hp <= 0) this.handleEnemyKilled(best, best.x, by);
        prevX = best.x;
        prevY = by;
      }
      return;
    }

    if (id === 'light' || id === 'solar' || id === 'prism' || id === 'aether' || id === 'eclipse') {
      // Radiant Sky Beam calling down from above!
      this.elementalArcs.push({
        kind: 'beam',
        x1: hitX,
        y1: hitY - 320,
        x2: hitX,
        y2: enemy.y,
        color: activeDef.primaryColor,
        secondaryColor: activeDef.secondaryColor,
        life: 0.34,
        maxLife: 0.34,
        seed: Math.random() * 100,
      });
      this.shockwaves.push({
        x: hitX,
        y: hitY,
        radius: 10,
        maxRadius: id === 'eclipse' || id === 'solar' ? 145 + resBonus * 20 : 112 + resBonus * 16,
        color: activeDef.primaryColor,
        life: 0.26,
        maxLife: 0.26,
      });
      if (id === 'prism' || id === 'eclipse') {
        // Refracted beam splits to a nearby target too!
        const extra = this.enemies.find(
          (o) => !o.dead && o !== enemy && Math.hypot(o.x - hitX, o.y - enemy.y) < 260
        );
        if (extra) {
          const ey = extra.y - (extra.baseH * eScale) * 0.5;
          this.elementalArcs.push({
            kind: 'beam',
            x1: hitX,
            y1: hitY - 120,
            x2: extra.x,
            y2: extra.y,
            color: activeDef.secondaryColor,
            secondaryColor: activeDef.primaryColor,
            life: 0.32,
            maxLife: 0.32,
            seed: Math.random() * 100,
          });
          extra.hp = Math.max(0, extra.hp - procDmg);
          extra.flashTimer = 0.14;
          this.spawnDamageNumber(extra.x, ey - 12, `${procDmg}`, activeDef.secondaryColor, 0.95, activeDef.name.toUpperCase());
          if (extra.hp <= 0) this.handleEnemyKilled(extra, extra.x, ey);
        }
      }
      dealSplash(id === 'solar' || id === 'eclipse' ? 140 + resBonus * 18 : 108 + resBonus * 15, procDmg, activeDef.name.toUpperCase());
      return;
    }

    if (id === 'earth' || id === 'nature' || id === 'magma' || id === 'crystal' || id === 'obsidian') {
      // Erupting Earth / Briar / Magma / Crystal / Obsidian Ground Spikes!
      this.elementalArcs.push({
        kind: 'spikes',
        x1: hitX - 65,
        y1: enemy.y,
        x2: hitX + 65,
        y2: enemy.y - 78,
        color: activeDef.primaryColor,
        secondaryColor: activeDef.secondaryColor,
        life: 0.36,
        maxLife: 0.36,
        seed: Math.random() * 100,
      });
      this.shockwaves.push({
        x: hitX,
        y: enemy.y - 8,
        radius: 12,
        maxRadius: 125 + resBonus * 18,
        color: activeDef.primaryColor,
        life: 0.26,
        maxLife: 0.26,
      });
      dealSplash(125 + resBonus * 18, procDmg, activeDef.name.toUpperCase());
      return;
    }

    // Sweeping Elemental Wave (Water, Fire, Air, Shadow, Steam, Frost, Abyss, Hellfire, Sandstorm, Phantom)
    const waveSpan = activeDef.isCombined ? 175 + resBonus * 22 : 135 + resBonus * 18;
    this.elementalArcs.push({
      kind: 'wave',
      x1: hitX,
      y1: hitY,
      x2: hitX + p.facing * waveSpan,
      y2: hitY,
      color: activeDef.primaryColor,
      secondaryColor: activeDef.secondaryColor,
      life: 0.3,
      maxLife: 0.3,
      seed: Math.random() * 100,
    });
    this.shockwaves.push({
      x: hitX,
      y: hitY,
      radius: 10,
      maxRadius: activeDef.isCombined ? 128 + resBonus * 18 : 98 + resBonus * 14,
      color: activeDef.primaryColor,
      life: 0.24,
      maxLife: 0.24,
    });
    dealSplash(
      activeDef.isCombined ? 132 + resBonus * 18 : 102 + resBonus * 14,
      procDmg,
      activeDef.name.toUpperCase(),
      id === 'abyss'
    );
  }

  private buildCursedPactOptions(): UpgradeOption[] {
    return [
      {
        id: 'pact_glass_cannon',
        kind: 'cursed_glass_cannon',
        category: 'Cursed Blood Pact',
        title: 'Glass Cannon Oath',
        description: '+3 Weapon Mastery immediately — sacrifice 2 Max HP (min 2 Max HP).',
        accent: '#f43f5e',
      },
      {
        id: 'pact_blood_grimoire',
        kind: 'cursed_blood_grimoire',
        category: 'Cursed Blood Pact',
        title: 'Blood Grimoire Bargain',
        description: '+3 Spell Slot Levels & restore Full MP — strip Armor & next hit deals 2x damage.',
        accent: '#a855f7',
      },
      {
        id: 'pact_reaper_bargain',
        kind: 'cursed_reaper_pact',
        category: 'Cursed Blood Pact',
        title: "Reaper's Ambush",
        description: 'Claim +1 Boss Core & +8 Relic Shards right now — awakens a Cursed Blood Champion!',
        accent: '#f59e0b',
      },
    ];
  }

  private damageSecretWall(sw: SecretWall, amount: number): void {
    if (sw.broken) return;
    sw.hp -= amount;
    sw.flashTimer = 0.16;
    sound.playArmorBlock();
    this.triggerShake(4.5, 0.12);
    this.spawnSparkles(sw.x + sw.w * 0.5, sw.y + sw.h * 0.5, 10, '#cbd5e1', '#ffd166', 0.9);
    if (sw.hp <= 0) {
      sw.broken = true;
      this.secretsFound += 1;
      sound.playSecretReveal();
      this.triggerShake(8.5, 0.24);
      this.shockwaves.push({
        x: sw.x + sw.w * 0.5,
        y: sw.y + sw.h * 0.5,
        radius: 10,
        maxRadius: 115,
        color: '#ffd166',
        life: 0.34,
        maxLife: 0.34,
      });
      this.spawnSparkles(sw.x + sw.w * 0.5, sw.y + sw.h * 0.5, 28, '#ffd166', '#c084fc', 1.4);
      this.spawnDamageNumber(
        sw.x + sw.w * 0.5,
        sw.y - 14,
        'SECRET WALL SHATTERED!',
        '#ffd166',
        1.15,
        sw.rewardRelic ? 'HIDDEN RELIC ALCOVE' : 'HIDDEN TREASURE CACHE'
      );
      this.interactables.push({
        id: `secret-cache-${sw.id}`,
        kind: 'secret_cache',
        x: sw.x + sw.w * 0.5,
        y: sw.y + sw.h,
        label: sw.rewardRelic
          ? 'Claim Secret Relic Cache (1 of 3 + 5 Shards)'
          : 'Loot Secret Cache (+5 Shards · +2 XP · Heal)',
        used: false,
        isBigBossRelic: sw.rewardRelic,
      });
    }
  }

  private updateSecretWalls(dt: number): void {
    for (const sw of this.secretWalls) {
      if (sw.flashTimer > 0) sw.flashTimer = Math.max(0, sw.flashTimer - dt);
    }
  }

  private summonPhantomAlly(charId: CharacterId, tuning: TuningConfig, offsetX?: number): void {
    const p = this.player;
    const def = this.cdef(charId);
    const spawnX = Math.max(
      40,
      Math.min(this.currentStage.worldWidth - 40, p.x + (offsetX ?? p.facing * 42))
    );
    sound.playHeroTagIn();
    this.phantomAllies.push({
      id: this.nextPhantomId++,
      characterId: charId,
      x: spawnX,
      y: p.y,
      facing: p.facing,
      timer: 0.92,
      maxTimer: 0.92,
      actionDone: false,
      color: def.accent,
    });
    this.shockwaves.push({
      x: spawnX,
      y: p.y - p.baseH * tuning.playerScale * 0.5,
      radius: 10,
      maxRadius: 72,
      color: def.accent,
      life: 0.24,
      maxLife: 0.24,
    });
    this.spawnSparkles(spawnX, p.y - 30, 16, def.accent, '#ffffff', 1.15);
    this.spawnDamageNumber(spawnX, p.y - 72, `${def.name.toUpperCase()} TAG!`, def.accent, 1.0);
  }

  private updatePhantomAllies(dt: number, tuning: TuningConfig): void {
    const evoBonus = this.getWeaponEvoTier() * 2;
    for (let i = this.phantomAllies.length - 1; i >= 0; i--) {
      const ally = this.phantomAllies[i];
      ally.timer -= dt;

      // Execute signature Hero Tag-In Assist after 0.16s arrival pose!
      if (!ally.actionDone && ally.timer <= ally.maxTimer - 0.16) {
        ally.actionDone = true;
        const ay = ally.y - 34;

        if (ally.characterId === 'brute') {
          // BRUTE ECHO: Meteor Hammer Crater Slam!
          sound.playHammerBoom();
          this.triggerShake(11, 0.26);
          this.shockwaves.push({
            x: ally.x,
            y: ally.y - 10,
            radius: 16,
            maxRadius: 190,
            color: '#f97316',
            life: 0.34,
            maxLife: 0.34,
          });
          this.spawnSparkles(ally.x, ally.y - 16, 26, '#f97316', '#fde047', 1.45);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
            if (Math.hypot(enemy.x - ally.x, ey - ally.y) <= 195) {
              enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.9);
              enemy.shieldActive = false;
              this.handlePlayerHitEnemy(enemy, tuning, 'hammer_meteor', 4 + evoBonus);
            }
          }
        } else if (ally.characterId === 'ronin') {
          // RONIN ECHO: Iaido Crimson Dimension Slash!
          sound.playKatanaSlash(2);
          this.triggerShake(8.5, 0.2);
          const slashX = ally.x + ally.facing * 92;
          this.spawnSlashLine(slashX, ay, ally.facing > 0 ? -0.14 : Math.PI + 0.14, 250, 11, '#f43f5e', '#ffffff', 0.3);
          this.spawnSparkles(slashX, ay, 24, '#f43f5e', '#ffd166', 1.35);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const dx = (enemy.x - ally.x) * ally.facing;
            if (dx > -35 && dx < 245 && Math.abs(enemy.y - ally.y) < 115) {
              this.applyBurn(enemy, 3.5);
              this.handlePlayerHitEnemy(enemy, tuning, 'dash', 4 + evoBonus);
            }
          }
        } else if (ally.characterId === 'hunter') {
          // HUNTER ECHO: Morning Star Shock-Whip Crack!
          sound.playWhip(2);
          this.triggerShake(7.5, 0.18);
          const lashX = ally.x + ally.facing * 88;
          this.spawnSlashLine(lashX, ay, 0, 230, 8, '#e5a93c', '#fff7ed', 0.26);
          this.shockwaves.push({
            x: lashX,
            y: ay,
            radius: 10,
            maxRadius: 120,
            color: '#e5a93c',
            life: 0.26,
            maxLife: 0.26,
          });
          this.spawnSparkles(lashX, ay, 20, '#e5a93c', '#ffffff', 1.25);
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const dx = (enemy.x - ally.x) * ally.facing;
            if (dx > -30 && dx < 230 && Math.abs(enemy.y - ally.y) < 105) {
              enemy.shieldActive = false;
              enemy.hurtStunTimer = Math.max(enemy.hurtStunTimer, 0.85);
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 4 + evoBonus);
            }
          }
        } else {
          // MINSTREL ECHO: Healing Encore Waltz + Projectile Deflect!
          sound.playMinstrelDance(2);
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
          this.player.mp = Math.min(this.player.maxMp, this.player.mp + 1);
          this.shockwaves.push({
            x: ally.x,
            y: ay,
            radius: 14,
            maxRadius: 175,
            color: '#f472b6',
            life: 0.34,
            maxLife: 0.34,
          });
          this.spawnSparkles(ally.x, ay, 24, '#f472b6', '#fde047', 1.3);
          this.spawnDamageNumber(ally.x, ay - 30, '+1 HP · +1 MP', '#f472b6', 1.0, 'ENCORE ASSIST');
          for (const proj of this.projectiles) {
            if (proj.fromEnemy && Math.hypot(proj.x - ally.x, proj.y - ay) < 180) {
              proj.fromEnemy = false;
              proj.vx = -proj.vx * 1.4;
              proj.kind = 'sword_wave';
              proj.damage = Math.max(3, proj.damage + 2);
            }
          }
          for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            const ey = enemy.y - (enemy.baseH * tuning.enemyScale) / 2;
            if (Math.hypot(enemy.x - ally.x, ey - ay) <= 180) {
              this.handlePlayerHitEnemy(enemy, tuning, 'weapon', 3 + Math.floor(evoBonus / 2));
            }
          }
        }

        // Phantom Allies can also shatter nearby Secret Walls!
        for (const sw of this.secretWalls) {
          if (!sw.broken && Math.hypot(sw.x - ally.x, sw.y - ally.y) < 210) {
            this.damageSecretWall(sw, 2);
          }
        }
      }

      if (ally.timer <= 0) {
        this.phantomAllies.splice(i, 1);
      }
    }
  }

  private damagePlayer(
    damage: number,
    sourceX: number,
    isBossAttack: boolean,
    tuning: TuningConfig
  ): void {
    const p = this.player;
    if (damage <= 0 || p.invulnTimer > 0 || this.status !== 'PLAYING') return;

    // RARE TIGHT PERFECT PARRY (0.10s window, 12-second cooldown so combat stays challenging!)
    if (p.parryWindowTimer > 0 && p.parryCooldownTimer <= 0) {
      p.parryWindowTimer = 0;
      p.parryCooldownTimer = 12.0;
      p.invulnTimer = 0.55;
      p.mp = Math.min(p.maxMp, p.mp + 2);
      this.parries += 1;
      const py = p.y - p.baseH * tuning.playerScale * 0.55;
      sound.playParry(false);
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.14);
      this.cameraZoomPunch = Math.max(this.cameraZoomPunch, 0.075);
      this.triggerShake(9.5, 0.2);
      this.triggerImpactFlash('#fde047', 0.48, p.x + p.facing * 18, py, 1.45, 0.24);
      this.shockwaves.push({
        x: p.x + p.facing * 16,
        y: py,
        radius: 12,
        maxRadius: 135,
        color: '#fde047',
        life: 0.26,
        maxLife: 0.26,
      });
      this.spawnSparkles(p.x + p.facing * 18, py, 24, '#fde047', '#ffffff', 1.35);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 20, 'PARRY! (12s CD)', '#fde047', 1.2, '+2 MP · GUARD BREAK');

      // Stagger & guard-break the attacking enemy!
      let closestAttacker: Enemy | null = null;
      let bestDist = 220;
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const d = Math.abs(enemy.x - sourceX) + Math.abs(enemy.y - p.y) * 0.5;
        if (d < bestDist) {
          bestDist = d;
          closestAttacker = enemy;
        }
      }
      if (closestAttacker) {
        closestAttacker.hurtStunTimer = Math.max(closestAttacker.hurtStunTimer, closestAttacker.isBoss ? 0.85 : 1.45);
        closestAttacker.shieldActive = false;
        closestAttacker.attackChargeTimer = 0;
        closestAttacker.lungeTimer = 0;
        closestAttacker.vx = (closestAttacker.x >= p.x ? 1 : -1) * 190;
        closestAttacker.flashTimer = 0.22;
      }
      return;
    }

    const isPitCheck = !isBossAttack && Math.abs(sourceX - p.x) < 1;

    // Prism Striker ('bouncer') is INVULNERABLE while dashing/bouncing if hit from the FRONT!
    if (p.characterId === 'bouncer' && (p.bounceActive || p.backdashTimer > 0) && !isPitCheck) {
      const moveDir = Math.abs(p.vx) > 25 ? Math.sign(p.vx) : p.facing;
      if ((sourceX - p.x) * moveDir >= -16) {
        p.invulnTimer = Math.max(p.invulnTimer, 0.22);
        p.flashTimer = 0.08;
        sound.playArmorBlock();
        this.triggerShake(4.2, 0.1);
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.04);
        this.spawnSparkles(
          p.x + moveDir * 22,
          p.y - p.baseH * tuning.playerScale * 0.5,
          18,
          '#22d3ee',
          '#f472b6',
          1.15
        );
        this.spawnDamageNumber(
          p.x,
          p.y - p.baseH * tuning.playerScale - 14,
          'PRISM GUARD!',
          '#67e8f9',
          1.02
        );
        return;
      }
    }

    // Vampire Hunter Whip Backdash Phantom Evade bonus (+1 MP & violet flash!)
    if (p.backdashTimer > 0 && p.characterId !== 'bouncer') {
      p.invulnTimer = 0.45;
      p.mp = Math.min(p.maxMp, p.mp + 1);
      this.parries += 1;
      sound.playParry(true);
      this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 16, '#c084fc', '#ffffff', 1.1);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 16, 'PHANTOM EVADE +1 MP', '#c084fc', 1.05);
      return;
    }

    // Iron Vanguard Tower Shield automatically blocks frontal hits while attacking or bashing!
    if (p.shieldGuardActive && !isPitCheck && (sourceX - p.x) * p.facing >= -18) {
      p.invulnTimer = 0.36;
      p.flashTimer = 0.1;
      sound.playArmorBlock();
      this.triggerShake(4.8, 0.12);
      this.hitstopTimer = Math.max(this.hitstopTimer, 0.045);
      this.spawnSparkles(p.x + p.facing * 20, p.y - p.baseH * tuning.playerScale * 0.5, 16, '#60a5fa', '#ffffff', 1.05);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 12, 'TOWER GUARD!', '#93c5fd', 1.0);
      return;
    }

    if (p.armorShield > 0) {
      p.armorShield -= 1;
      if (p.armorShield <= 0) p.armorTimer = 0;
      p.invulnTimer = 0.7;
      p.flashTimer = 0.12;
      sound.playArmorBlock();
      this.triggerShake(4.2, 0.12);
      this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 12, '#cbd5e1', '#ffffff', 0.9);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 10, 'BLOCKED', '#e2e8f0', 0.95);
      return;
    }

    // Balanced combat hits: normal enemies deal 1 dmg throughout the game; bosses start at 1 on early stages and grow to 2!
    const isPitFall = !isBossAttack && Math.abs(sourceX - p.x) < 1;
    const baseCap = isPitFall ? 1 : isBossAttack ? this.getBossBaseDamage() : 1;
    const tuneMult = isPitFall
      ? 1
      : isBossAttack
        ? this.tuning.bossDamageMult
        : this.tuning.enemyDamageMult;
    let finalDamage = isPitFall
      ? 1
      : tuneMult <= 1
        ? Math.min(baseCap, Math.max(1, damage))
        : Math.max(1, damage);
    if (p.cursedGlassVulnerable) {
      finalDamage = finalDamage * 2;
      p.cursedGlassVulnerable = false;
    }

    p.hp = Math.max(0, p.hp - finalDamage);
    this.comboCount = 0;
    this.comboTimer = 0;
    p.invulnTimer = tuning.playerInvulnSec;
    p.flashTimer = 0.18;
    p.attackState = 'idle';
    p.attackTimer = 0;
    p.katanaChargeTimer = 0;
    p.hammerLeapState = 'none';
    p.hammerLeapTimer = 0;
    p.rapierLungeTimer = 0;
    p.axeSpinTimer = 0;
    p.naginataVaultTimer = 0;
    p.wallClingDir = 0;

    // Permanent Sacrifice Artifact: Undying Heart — survive a lethal hit once per raid with 2 HP!
    if (p.hp <= 0 && this.hasArtifact('undying_heart') && !this.undyingUsed) {
      this.undyingUsed = true;
      p.hp = Math.min(p.maxHp, 2);
      p.invulnTimer = 1.6;
      sound.playUpgradePick();
      this.triggerShake(11, 0.28);
      this.shockwaves.push({
        x: p.x,
        y: p.y - p.baseH * tuning.playerScale * 0.5,
        radius: 16,
        maxRadius: 130,
        color: '#ff4d6d',
        life: 0.34,
        maxLife: 0.34,
      });
      this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 24, '#ff4d6d', '#ffd166', 1.35);
      this.spawnDamageNumber(p.x, p.y - p.baseH * tuning.playerScale - 18, 'UNDYING HEART', '#ff4d6d', 1.15, '+2 HP');
      return;
    }

    const knockDir = p.x < sourceX ? -1 : 1;

    if (!p.onGround) {
      p.isAirKnockback = true;
      p.vx = knockDir * tuning.airKnockbackX;
      p.vy = -tuning.airKnockbackY;
      p.hitStunTimer = Math.max(tuning.playerHitStunMs / 1000, 0.32);
    } else {
      p.isAirKnockback = false;
      p.vx = 0;
      p.hitStunTimer = tuning.playerHitStunMs / 1000;
    }

    // Visceral hurt feedback: camera shake + brief hurt freeze + crimson flash + blood burst!
    sound.playPlayerHurt(isBossAttack);
    this.hitstopTimer = Math.max(this.hitstopTimer, isBossAttack ? 0.085 : 0.064);
    this.triggerShake(isBossAttack ? 11.5 : 7.2, isBossAttack ? 0.28 : 0.19);
    this.screenFlashColor = '#dc2626';
    this.screenFlashAlpha = Math.max(this.screenFlashAlpha, isBossAttack ? 0.34 : 0.24);
    this.spawnBloodBurst(p.x, p.y - p.baseH * tuning.playerScale * 0.5, knockDir, isBossAttack ? 18 : 12, 1.0, 3);
    this.spawnSparkles(p.x, p.y - p.baseH * tuning.playerScale * 0.5, 9, '#ff4d6d', '#ffffff', 0.8);
    this.spawnDamageNumber(
      p.x,
      p.y - p.baseH * tuning.playerScale - 8,
      `-${damage}`,
      isBossAttack && damage > 1 ? '#ff334b' : '#f87171',
      isBossAttack && damage > 1 ? 1.15 : 1.0
    );

    if (p.hp <= 0) {
      this.status = 'GAME_OVER';
    }
  }

  private updateCamera(
    dt: number,
    tuning: TuningConfig,
    viewportW: number,
    viewportH: number
  ): void {
    const cam = this.camera;
    const p = this.player;
    const dzX = tuning.cameraDeadzoneX;
    const dzY = tuning.cameraDeadzoneY;

    if (p.x > cam.targetX + dzX) {
      cam.targetX = p.x - dzX;
    } else if (p.x < cam.targetX - dzX) {
      cam.targetX = p.x + dzX;
    }

    const desiredCenterY = p.y + tuning.cameraOffsetY;
    if (p.onGround && Math.abs(desiredCenterY - cam.anchorY) > dzY * 0.65) {
      cam.anchorY = desiredCenterY;
    } else if (desiredCenterY < cam.anchorY - dzY) {
      cam.anchorY = desiredCenterY + dzY;
    } else if (desiredCenterY > cam.anchorY + dzY) {
      cam.anchorY = desiredCenterY - dzY;
    }
    cam.targetY = cam.anchorY;

    const halfViewW = viewportW / (2 * tuning.zoom);
    const halfViewH = viewportH / (2 * tuning.zoom);
    const worldW = this.currentStage.worldWidth;
    const worldH = this.currentStage.worldHeight;

    const minX = Math.min(worldW / 2, halfViewW);
    const maxX = Math.max(worldW / 2, worldW - halfViewW);
    const minY = Math.min(worldH / 2, halfViewH);
    const maxY = Math.max(worldH / 2, worldH - halfViewH);

    cam.targetX = Math.max(minX, Math.min(maxX, cam.targetX));
    cam.targetY = Math.max(minY, Math.min(maxY, cam.targetY));

    // Optional look-ahead: lead the camera toward where the hero faces (used by the portrait mobile view).
    const lookGoal = (tuning.cameraLookAhead ?? 0) * this.player.facing;
    this.cameraLookOffset += (lookGoal - this.cameraLookOffset) * (1 - Math.pow(0.04, dt));
    const goalX = Math.max(minX, Math.min(maxX, cam.targetX + this.cameraLookOffset));

    const smooth = 1 - Math.pow(1 - Math.max(0.02, Math.min(0.95, tuning.cameraSmoothing)), dt * 60);
    cam.x += (goalX - cam.x) * smooth;
    cam.y += (cam.targetY - cam.y) * smooth;
  }

  private updateCameraShake(dt: number): void {
    const cam = this.camera;
    if (cam.shakeTime > 0) {
      cam.shakeTime = Math.max(0, cam.shakeTime - dt);
      const progress = cam.shakeDuration > 0 ? cam.shakeTime / cam.shakeDuration : 0;
      const power = cam.shakeMagnitude * progress * progress;
      cam.offsetX = (Math.random() * 2 - 1) * power;
      cam.offsetY = (Math.random() * 2 - 1) * power;
      if (cam.shakeTime === 0) {
        cam.shakeMagnitude = 0;
        cam.offsetX = 0;
        cam.offsetY = 0;
      }
    }
  }

  private updateParticlesAndNumbers(dt: number): void {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const prog = 1 - sw.life / sw.maxLife;
      sw.radius = 12 + (sw.maxRadius - 12) * prog;
    }

    for (let i = this.markBeams.length - 1; i >= 0; i--) {
      this.markBeams[i].life -= dt;
      if (this.markBeams[i].life <= 0) this.markBeams.splice(i, 1);
    }
    if (this.assassinStepCd > 0) this.assassinStepCd = Math.max(0, this.assassinStepCd - dt);

    for (let i = this.slashLines.length - 1; i >= 0; i--) {
      const sl = this.slashLines[i];
      sl.life -= dt;
      if (sl.life <= 0) {
        this.slashLines.splice(i, 1);
      }
    }

    for (let i = this.elementalArcs.length - 1; i >= 0; i--) {
      const arc = this.elementalArcs[i];
      arc.life -= dt;
      if (arc.life <= 0) {
        this.elementalArcs.splice(i, 1);
      }
    }

    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const g = this.afterimages[i];
      g.life -= dt;
      if (g.life <= 0) {
        this.afterimages.splice(i, 1);
      }
    }

    const floorY = this.currentStage.floorY;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      const prevY = pt.y;
      if (pt.kind === 'blood') {
        pt.vy += 680 * dt;
        pt.vx *= Math.pow(0.45, dt);
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;

        // Splat onto platforms or floor, leaving persistent crimson stains!
        let splatted = false;
        if (pt.vy > 0) {
          if (pt.y >= floorY) {
            this.addBloodStain(pt.x, floorY, pt.size * 3.1);
            splatted = true;
          } else {
            for (const plat of this.platforms) {
              if (
                plat.id.startsWith('wall-') ||
                pt.x < plat.x ||
                pt.x > plat.x + plat.w
              ) {
                continue;
              }
              if (prevY <= plat.y + 8 && pt.y >= plat.y) {
                this.addBloodStain(pt.x, plat.y, pt.size * 2.8);
                splatted = true;
                break;
              }
            }
          }
        }
        if (splatted) {
          this.particles.splice(i, 1);
          continue;
        }
      } else if (pt.kind === 'blood_mist') {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= Math.pow(0.14, dt);
        pt.vy *= Math.pow(0.22, dt);
        pt.size += 12 * dt;
      } else if (pt.kind === 'energy_wisp') {
        // Sprout outward then magnetically spiral back into the Floating Relic crystal!
        const frac = pt.life / Math.max(0.001, pt.maxLife);
        if (frac < 0.62 && pt.targetX !== undefined && pt.targetY !== undefined) {
          const toX = pt.targetX - pt.x;
          const toY = pt.targetY - pt.y;
          pt.vx += toX * 14 * dt;
          pt.vy += toY * 14 * dt;
          pt.vx *= Math.pow(0.08, dt);
          pt.vy *= Math.pow(0.08, dt);
        } else {
          pt.vx *= Math.pow(0.25, dt);
          pt.vy *= Math.pow(0.25, dt);
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
      } else {
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        if (pt.kind === 'ember') {
          pt.vy += 260 * dt;
        } else {
          pt.vx *= Math.pow(0.08, dt);
          pt.vy *= Math.pow(0.08, dt);
          pt.rotation += 5 * dt;
        }
      }
    }

    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.life -= dt;
      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
        continue;
      }
      dn.y += dn.vy * dt;
      dn.vy *= Math.pow(0.15, dt);
    }
  }

  public getHudSnapshot(): HudSnapshot {
    const alive = this.enemies.filter((e) => !e.dead);
    const activeBosses: BossHudBar[] = this.enemies
      .filter((e) => e.isBoss && e.alerted && !e.dead)
      .map((b) => ({
        id: b.id,
        name: b.name,
        hp: b.hp,
        maxHp: b.maxHp,
        enraged: Boolean(b.enraged),
        isBigBoss: Boolean(b.isBigBoss),
      }));
    const leadBoss = activeBosses[0] ?? null;
    const firstBoss = this.enemies.find((e) => e.isBoss);
    const progressPct = this.currentStage.isCamp
      ? 0
      : Math.max(
          0,
          Math.min(100, Math.round((this.player.x / (this.currentStage.worldWidth - 240)) * 100))
        );
    const nearby = this.getNearbyInteractable();
    const exitDoor = this.interactables.find((it) => it.kind === 'exit_door');
    const bossChest = this.interactables.find(
      (it) => it.kind === 'boss_relic' || it.kind === 'boss_chest'
    );

    const effTuning = this.effectiveTuning ?? this.tuning;
    const assassinationReady =
      this.status === 'PLAYING' && effTuning ? Boolean(this.findAssassinationTarget(effTuning)) : false;

    return {
      assassinationReady,
      assassinMarkLive: this.liveMarkedFoes().length > 0,
      assassinMarkTime: Math.max(0, ...this.liveMarkedFoes().map((e) => e.markTimer ?? 0), 0),
      characterId: this.player.characterId,
      inCamp: Boolean(this.currentStage.isCamp),
      isBigBossRoom: Boolean(this.currentStage.isBigBossRoom),
      activeRaidId: this.activeRaidId,
      activeRaidName: RAIDS[this.activeRaidId].name,
      raidOrderTier: this.getRaidOrderTier(),
      raidsClearedInRun: [...this.raidsClearedInRun],
      offeredRaids: [...this.offeredRaids],
      endRaidUnlocked: this.isEndRaidUnlocked(),
      raidsRequiredForEnd: RAIDS_REQUIRED_FOR_END_RAID,
      roomNumber: this.currentStage.roomNumber,
      raidRoomsTotal: 4,
      raidsCompleted: this.raidsCompleted,
      roomsCleared: [...this.roomsCleared],
      shards: this.shards,
      bossCores: this.bossCores,
      ownedArtifacts: [...this.ownedArtifacts],
      undyingUsed: this.undyingUsed,
      bossChestSpawned: Boolean(bossChest && !bossChest.used),
      exitDoorUnlocked: Boolean(exitDoor && !exitDoor.locked),

      stageIndex: this.stageIndex,
      stageCount: this.getCurrentRaidRooms().length,
      stageName: this.currentStage.name,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      mp: this.player.mp,
      maxMp: this.player.maxMp,
      hpRegenLevel: this.player.hpRegenLevel,
      mpRegenLevel: this.player.mpRegenLevel,
      weapon: this.player.weapon,
      unlockedWeapons: [...this.player.unlockedWeapons],
      weaponDamageBonus: this.player.weaponDamageBonus,
      isHidden: this.player.isHidden,
      armorShield: this.player.armorShield,
      armorTimer: this.player.armorTimer,
      fireWeaponTimer: this.player.fireWeaponTimer,
      weaponSkillCooldown: this.player.weaponSkillCooldown,
      wallClingDir: this.player.wallClingDir,
      ledgeGrabActive: this.player.ledgeGrabActive,
      katanaCharging: this.player.katanaChargeTimer > 0,
      unlockedAbilities: [...this.player.unlockedAbilities],
      unlockedAbilitySlots: this.player.unlockedAbilitySlots,
      abilitySlots: [...this.player.abilitySlots] as [AbilityId, AbilityId, AbilityId],
      abilitySlotLevels: [...this.player.abilitySlotLevels] as [number, number, number],
      abilityCooldowns: { ...this.player.abilityCooldowns },
      itemSlots: [...this.player.itemSlots] as [ItemId, ItemId, ItemId],
      itemCounts: { ...this.player.itemCounts },
      specialItemSlot: this.player.specialItemSlot,
      specialItemCounts: { ...this.player.specialItemCounts },
      specialItemCooldown: this.player.specialItemCooldown,
      eclipseFreezeTimer: this.eclipseFreezeTimer,
      nearbyInteractableLabel: nearby ? nearby.label : null,
      enemiesRemaining: alive.length,
      enemiesTotal: this.totalEnemies,
      bossName: leadBoss ? leadBoss.name : firstBoss ? firstBoss.name : this.currentStage.bossName,
      bossHp: leadBoss ? leadBoss.hp : firstBoss ? 0 : null,
      bossMaxHp: leadBoss ? leadBoss.maxHp : firstBoss ? firstBoss.maxHp : null,
      bossActive: activeBosses.length > 0,
      bossEnraged: activeBosses.some((b) => b.enraged),
      activeBosses,
      status: this.status,
      pendingUpgrades: this.pendingUpgrades,
      upgradePromptTitle: this.upgradePromptTitle,
      assassinations: this.assassinations,
      crits: this.crits,
      parries: this.parries,
      parryCooldown: this.player.parryCooldownTimer,
      secretsFound: this.secretsFound,
      isCursedChamber: this.isCursedChamber,
      cursedDoorAvailable: this.interactables.some((it) => it.kind === 'cursed_door' && !it.used),
      tagPartner: this.player.tagPartner,
      tagPartnerCooldown: this.player.tagPartnerCooldown,
      gold: this.gold,
      raidGoldEarned: this.raidGoldEarned,
      raidDamageDealt: this.raidDamageDealt,
      raidElapsedSeconds: this.raidElapsedSeconds,
      raidMapRelicsCollected: this.raidMapRelicsCollected,
      raidScore: this.getRaidScoreAndRank().score,
      raidRank: this.getRaidScoreAndRank().rank,
      runHeroLocked: this.runHeroLocked,
      testFreeHeroSwitch: this.testFreeHeroSwitch,
      skin: this.player.skin,
      unlockedSkins: [...this.characterUnlocks[this.player.characterId].skins],
      unlockedSpecials: [...this.characterUnlocks[this.player.characterId].specials],
      charPermanentWeapons: [...this.characterUnlocks[this.player.characterId].weapons],
      charPermanentSpells: [...this.characterUnlocks[this.player.characterId].spells],
      runRelicLevels: { ...this.player.runRelicLevels },
      permAltarBonuses: { ...this.permAltarBonuses },
      bossCharms: [...this.bossCharms],
      activeCharmSynergies: this.getActiveCharmSynergies(),
      lastBossCharmDrop: this.lastBossCharmDrop,
      progressPct,
      level: this.player.level,
      xp: this.player.xp,
      xpToNext: this.player.xpToNext,
      baseElements: [...this.player.baseElements],
      combinedElement: this.player.combinedElement,
      elementResonance: this.player.elementResonance,
      weaponEvolutionTier: this.getWeaponEvoTier(),
      spellEvolutionTier: this.getSpellEvoTier(this.player.abilitySlotLevels[0]),
      shadowChainTimer: this.player.shadowChainTimer,
      shadowChainCount: this.player.shadowChainCount,
      minstrelSlowMo: this.player.minstrelZipActive,
      grimoireElement: (['fire', 'glacial', 'storm', 'venom', 'shadow', 'light'] as const)[
        this.player.grimoireElementIndex % 6
      ],
      grimoireOrbs: this.player.grimoireOrbs,
      bouncesLeft: this.player.bounceActive
        ? this.player.bouncesLeft
        : 2 + Math.floor((1 + this.player.weaponDamageBonus) / 5),
      maxBounces: 2 + Math.floor((1 + this.player.weaponDamageBonus) / 5),
      collectedLoreIds: [...this.collectedLoreIds],
      lastLoreToast: this.lastLoreToast ? { ...this.lastLoreToast } : null,
    };
  }
}

function dxSide(ox: number, plat: Platform): number {
  const leftDist = Math.abs(ox - plat.x);
  const rightDist = Math.abs(ox - (plat.x + plat.w));
  return leftDist <= rightDist ? plat.x : plat.x + plat.w;
}

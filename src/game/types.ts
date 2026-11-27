export type Facing = 1 | -1;

export type CharacterId = 'hunter' | 'brute' | 'ronin' | 'minstrel';

export type RaidId =
  | 'nocturne_castle'
  | 'goblin_camp'
  | 'weeping_necropolis'
  | 'brimstone_sanctum'
  | 'eclipse_gauntlet';

export type EnemyType =
  | 'ghoul'
  | 'skeleton'
  | 'bat'
  | 'knight'
  | 'boss_vampire_duelist'
  | 'boss_colossus'
  | 'boss_malakor'
  | 'boss_gargoyle_king'
  | 'boss_valerius'
  | 'goblin_grunt'
  | 'goblin_archer'
  | 'goblin_bomber'
  | 'goblin_shaman'
  | 'goblin_brute'
  | 'boss_goblin_chief'
  | 'boss_goblin_sapper'
  | 'boss_goblin_shaman'
  | 'boss_goblin_behemoth'
  | 'boss_goblin_warlord'
  | 'grave_hound'
  | 'wraith'
  | 'gargoyle'
  | 'acolyte'
  | 'boss_gravedigger'
  | 'boss_banshee'
  | 'boss_executioner'
  | 'boss_bone_reaver'
  | 'boss_necromancer'
  | 'ember_imp'
  | 'obsidian_guard'
  | 'boss_cinder_warden'
  | 'boss_pyre_matriarch'
  | 'boss_slag_titan'
  | 'boss_infernal_knight'
  | 'boss_forge_lord'
  | 'boss_eclipse_overlord';

export type GameStatus =
  | 'CAMP'
  | 'RAID_SELECT'
  | 'PLAYING'
  | 'CHOOSING_UPGRADE'
  | 'CRAFTING'
  | 'INVENTORY'
  | 'MAP'
  | 'VICTORY'
  | 'GAME_OVER';

export type WeaponId =
  | 'whip'
  | 'rapier'
  | 'hammer'
  | 'greataxe'
  | 'katana'
  | 'naginata'
  | 'ribbon_whip'
  | 'silk_whip'
  | 'sword';

export type AbilityId =
  | 'fireball'
  | 'dash_attack'
  | 'grapple'
  | 'gas_bomb'
  | 'fire_weapon';

export type ItemId =
  | 'health_potion'
  | 'mana_potion'
  | 'armor_potion';

export type SpecialItemId = 'eclipse_hourglass' | 'hero_tag_horn';

export interface SpecialItemDef {
  id: SpecialItemId;
  name: string;
  shortName: string;
  description: string;
  cooldown: number;
  maxCharges: number;
  accent: string;
}

export type ArtifactId =
  | 'crimson_fang'
  | 'moonstone_signet'
  | 'vampire_crest'
  | 'soul_anvil'
  | 'everflask'
  | 'grimoire_ember'
  | 'bloodsteel_edge'
  | 'undying_heart'
  | 'arcane_conduit';

export interface ArtifactDef {
  id: ArtifactId;
  name: string;
  description: string;
  coreCost: number;
  shardCost: number;
  isSacrifice?: boolean;
  sacrificeType?: 'spell' | 'weapon_power' | 'max_hp' | 'slot_level';
  sacrificeLabel?: string;
  accent: string;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  traitSummary: string;
  defaultWeapon: WeaponId;
  defaultAbility: AbilityId;
  baseHp: number;
  baseMp: number;
  baseW: number;
  baseH: number;
  crouchBaseH: number;
  speedMult: number;
  jumpMult: number;
  airJumps: number;
  canWallCling: boolean;
  bonusBaseDamage: number;
  bonusWeaponDamage: number;
  accent: string;
}

export interface RaidDef {
  id: RaidId;
  name: string;
  subtitle: string;
  description: string;
  finalBossName: string;
  accent: string;
  isEndRaid?: boolean;
}

export interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'potion' | 'weapon' | 'special_item';
  itemId?: ItemId;
  weaponId?: WeaponId;
  specialItemId?: SpecialItemId;
  accent: string;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  shortName: string;
  description: string;
  skillName: string;
  skillDescription: string;
  skillCooldown: number;
  accent: string;
  ownerChar?: CharacterId;
  isMainWeapon?: boolean;
}

export interface AbilityDef {
  id: AbilityId;
  name: string;
  shortName: string;
  manaCost: number;
  cooldown: number;
  description: string;
  accent: string;
}

export interface ItemDef {
  id: ItemId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
}

export type BaseElementId = 'water' | 'fire' | 'air' | 'earth' | 'light' | 'shadow';

export type CombinedElementId =
  | 'steam'
  | 'frost'
  | 'nature'
  | 'prism'
  | 'abyss'
  | 'lightning'
  | 'magma'
  | 'solar'
  | 'hellfire'
  | 'sandstorm'
  | 'aether'
  | 'phantom'
  | 'crystal'
  | 'obsidian'
  | 'eclipse';

export type ElementId = BaseElementId | CombinedElementId;

export interface ElementDef {
  id: ElementId;
  name: string;
  title: string;
  shortDesc: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  isCombined: boolean;
  parents?: [BaseElementId, BaseElementId];
}

export interface ElementalArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  secondaryColor: string;
  life: number;
  maxLife: number;
  kind: 'lightning' | 'beam' | 'spikes' | 'wave';
  seed: number;
}

export type UpgradeKind =
  | 'unlock_ability'
  | 'unlock_weapon'
  | 'extra_ability_slot'
  | 'upgrade_ability_slot'
  | 'special_item_charge'
  | 'assassin_training'
  | 'swift_footwork'
  | 'element_affinity'
  | 'element_resonance'
  | 'tag_partner'
  | 'cursed_glass_cannon'
  | 'cursed_blood_grimoire'
  | 'cursed_reaper_pact'
  | 'weapon_damage'
  | 'max_hp'
  | 'max_mp'
  | 'hp_regen'
  | 'mp_regen';

export interface UpgradeOption {
  id: string;
  kind: UpgradeKind;
  category: string;
  title: string;
  description: string;
  accent: string;
  abilityId?: AbilityId;
  weaponId?: WeaponId;
  specialItemId?: SpecialItemId;
  elementId?: BaseElementId;
  combinedElementId?: CombinedElementId;
  partnerCharId?: CharacterId;
  slotIndex?: 0 | 1 | 2;
}

export interface TuningConfig {
  zoom: number;
  playerScale: number;
  enemyScale: number;

  moveSpeed: number;
  jumpForce: number;
  gravity: number;
  coyoteTimeMs: number;
  jumpBufferMs: number;

  airControl: number;
  airMaxSpeedMult: number;
  airDrag: number;
  airTurnFacing: boolean;
  jumpCutMultiplier: number;
  fallGravityMult: number;
  apexHangGravityMult: number;
  maxFallSpeed: number;
  airJumps: number;
  allowAirBackdash: boolean;
  lockAirDirectionOnAttack: boolean;

  attackStartupMs: number;
  attackActiveMs: number;
  attackRecoveryMs: number;
  attackRange: number;
  jumpLockWhenAttacking: boolean;
  freezeOnAttack: boolean;
  hitstopMs: number;
  weaponCritChance: number;
  critMultiplier: number;
  assassinationEnabled: boolean;

  playerHitStunMs: number;
  airKnockbackX: number;
  airKnockbackY: number;

  cameraOffsetY: number;
  cameraDeadzoneX: number;
  cameraDeadzoneY: number;
  cameraSmoothing: number;
  critShakeIntensity: number;
  showCameraGuide: boolean;

  // ===== Tuning v2: General =====
  /** Global world time scale (1 = normal). */
  gameSpeed: number;
  /** Multiplies every camera shake. */
  shakeMult: number;
  /** Multiplies every camera zoom punch. */
  zoomPunchMult: number;
  /** Multiplies every screen / impact flash alpha. */
  flashMult: number;
  /** Multiplies all damage the player deals to enemies. */
  playerDamageMult: number;
  /** Multiplies all damage regular enemies deal to the player. */
  enemyDamageMult: number;
  /** Multiplies all damage bosses deal to the player. */
  bossDamageMult: number;
  /** Seconds of invulnerability after the player is hit. */
  playerInvulnSec: number;
  /** Global multiplier on every enemy's detection range. */
  stealthVisionMult: number;
  /** Detection range multiplier while crouch-walking. */
  crouchStealthMult: number;
  /** Detection range multiplier during Shadow Chain. */
  chainStealthMult: number;
  /** "Sixth sense" distance an enemy notices you behind its back (normal / crouching / chain). */
  closeSenseNormal: number;
  closeSenseCrouch: number;
  closeSenseChain: number;
  /** Max vertical distance a ground enemy can spot you. */
  visionHeight: number;
  /** Enemies that lose you while you hide stop chasing beyond this distance. */
  hideBreakDistance: number;

  killFreeze: KillFreezeTuning;
  characters: Record<CharacterId, CharacterTuning>;
  enemies: Record<string, EnemyTuning>;
  bosses: Record<string, BossTuning>;
}

export interface KillFreezeTuning {
  /** Master toggle for the assassination freeze/impact package. */
  enabled: boolean;
  /** Full world freeze (hit-stop) on assassination, ms. */
  freezeMs: number;
  /** Bosses: freeze duration multiplier. */
  bossFreezeMult: number;
  /** Slow-motion after the freeze. 1 = off. */
  slowMoScale: number;
  slowMoMs: number;
  /** Camera zoom punch (0 = none). */
  zoomPunch: number;
  /** Screen flash on/off + strength + impact-frame length. */
  flash: boolean;
  flashAlpha: number;
  impactFrameMs: number;
  /** Camera shake strength. */
  shake: number;
  shakeMs: number;
  /** Freeze the game after every assassination until a key / tap (screenshots & tuning). */
  holdUntilKey: boolean;
}

export interface CharacterTuning {
  baseHp: number;
  baseMp: number;
  speedMult: number;
  jumpMult: number;
  airJumps: number;
  canWallCling: boolean;
  bonusBaseDamage: number;
  bonusWeaponDamage: number;
  /** Multiplies attack startup / active / recovery times (lower = faster swings). */
  attackTimeMult: number;
  attackRangeMult: number;
  spellCostMult: number;
  spellCooldownMult: number;
  assassinDamageMult: number;
  assassinMpReward: number;
  assassinIFramesSec: number;
  shadowChainSec: number;
  // Character specials (only used by the owning hero)
  backdashSec: number; // hunter
  hammerMeteorDamage: number; // brute
  katanaMegaBonus: number; // ronin
  zipSlowMo: number; // minstrel
  zipDurationSec: number; // minstrel
}

export interface EnemyTuning {
  hpMult: number;
  damageMult: number;
  /** Time scale of this enemy's whole AI (movement, cooldowns, windups). */
  speedMult: number;
  visionMult: number;
  /** Seconds from spotting you to first attack. */
  reactionSec: number;
  /** Multiplies telegraph / windup time (higher = easier to dodge). */
  windupMult: number;
  /** Multiplies time between attacks (lower = more aggressive). */
  cooldownMult: number;
}

export interface BossTuning extends EnemyTuning {
  /** HP fraction that triggers Phase II enrage (big bosses). */
  phase2At: number;
  /** Allow Phase II on mini-boss rooms too. */
  phase2OnMiniBoss: boolean;
  /** Pace boost while enraged. */
  enrageSpeed: number;
  /** Post-hit invulnerability multiplier (anti-combo). */
  invulnMult: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  id: string;
  oneWay?: boolean;
  crumbling?: boolean;
  style?:
    | 'stone'
    | 'bridge'
    | 'pillar'
    | 'boss_floor'
    | 'rafter'
    | 'camp_ground'
    | 'timber'
    | 'palisade'
    | 'crypt_slab'
    | 'obsidian';
}

export interface HangingBrazier {
  id: string;
  x: number;
  y: number;
  anchorY: number;
  vy: number;
  state: 'hanging' | 'falling' | 'smashed';
  swayPhase: number;
  smashTimer: number;
}

export interface TorchProp {
  x: number;
  y: number;
  phase: number;
}

export type InteractableKind =
  | 'chest'
  | 'boss_chest'
  | 'boss_relic'
  | 'exit_door'
  | 'cursed_door'
  | 'cursed_shrine'
  | 'secret_cache'
  | 'fountain'
  | 'brazier'
  | 'shrine'
  | 'upgrade_altar'
  | 'camp_hero_hunter'
  | 'camp_hero_brute'
  | 'camp_hero_ronin'
  | 'camp_hero_minstrel'
  | 'camp_weapon_rack'
  | 'camp_craft_bench'
  | 'camp_raid_gate';

export interface SecretWall {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  broken: boolean;
  flashTimer: number;
  rewardRelic: boolean;
}

export interface PhantomAlly {
  id: number;
  characterId: CharacterId;
  x: number;
  y: number;
  facing: Facing;
  timer: number;
  maxTimer: number;
  actionDone: boolean;
  color: string;
}

export interface Interactable {
  id: string;
  kind: InteractableKind;
  x: number;
  y: number;
  label: string;
  used: boolean;
  locked?: boolean;
  relicColor?: string;
  isBigBossRelic?: boolean;
}

export interface StageTheme {
  skyTop: string;
  skyBottom: string;
  moonColor: string;
  parallaxColor: string;
  archColor: string;
  windowColor: string;
  stoneFill: string;
  stoneTop: string;
  bossFloorTop: string;
}

export interface HidingSpot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'alcove' | 'curtain';
}

export interface StageDef {
  index: number;
  roomNumber: number;
  raidId?: RaidId;
  environment?: 'castle' | 'goblin_camp' | 'cemetery' | 'foundry' | 'eclipse';
  isCamp?: boolean;
  isBigBossRoom?: boolean;
  isBossGauntletRoom?: boolean;
  name: string;
  bossName: string;
  worldWidth: number;
  worldHeight: number;
  floorY: number;
  bossZoneStartX: number;
  exitDoorX?: number;
  theme: StageTheme;
  platforms: Platform[];
  torches: TorchProp[];
  interactables: Interactable[];
  hidingSpots: HidingSpot[];
  createEnemies: (hpMult?: number, flatHpBonus?: number) => Enemy[];
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fromEnemy: boolean;
  damage: number;
  /** Set by the tuning layer so per-type damage multipliers only apply once. */
  tuned?: boolean;
  life: number;
  rotation: number;
  kind:
    | 'bone'
    | 'orb'
    | 'fireball'
    | 'gas_flask'
    | 'shockwave'
    | 'lich_bolt'
    | 'sword_wave'
    | 'player_quake'
    | 'katana_wave'
    | 'goblin_arrow'
    | 'goblin_bomb'
    | 'goblin_hex'
    | 'goblin_dagger'
    | 'soul_skull'
    | 'tombstone'
    | 'banshee_wail'
    | 'bone_scythe'
    | 'stone_shard'
    | 'crimson_wave'
    | 'lava_orb'
    | 'storm_arc';
  slotLevel?: number;
  returnTimer?: number;
}

export interface GasCloud {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
  tickDamage: number;
  slotLevel: number;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface GroundHazard {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  warnTimer: number;
  maxWarn: number;
  activeTimer: number;
  maxActive: number;
  damage: number;
  kind: 'flame_pillar' | 'hex_pillar' | 'eclipse_pillar' | 'bone_spike';
  hitPlayer: boolean;
  tuned?: boolean;
}

export interface GrappleState {
  active: boolean;
  phase: 'extending' | 'pulling';
  x: number;
  y: number;
  vx: number;
  vy: number;
  maxLength: number;
  timer: number;
  slotLevel: number;
}

export interface Afterimage {
  x: number;
  y: number;
  facing: Facing;
  crouching: boolean;
  color: string;
  life: number;
  maxLife: number;
}

export interface Player {
  characterId: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseW: number;
  baseH: number;
  crouchBaseH: number;
  facing: Facing;
  onGround: boolean;
  crouching: boolean;

  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  hpRegenLevel: number;
  mpRegenLevel: number;
  hpRegenAccum: number;
  mpRegenAccum: number;

  coyoteTimer: number;
  jumpBufferTimer: number;
  dropThroughTimer: number;
  airJumpsRemaining: number;
  airBackdashUsed: boolean;
  jumpCutApplied: boolean;

  // Mega Man X-style Wall Cling & Wall Jump (Ronin)
  wallClingDir: -1 | 0 | 1;
  wallJumpLockTimer: number;

  // Ledge Grab & Pull-Up (All Characters)
  ledgeGrabActive: boolean;
  ledgeGrabTimer: number;
  ledgeGrabDuration: number;
  ledgeStartX: number;
  ledgeStartY: number;
  ledgeTargetX: number;
  ledgeTargetY: number;
  ledgeCooldown: number;

  weapon: WeaponId;
  unlockedWeapons: WeaponId[];
  weaponDamageBonus: number;

  attackState: 'idle' | 'startup' | 'active' | 'recovery';
  attackTimer: number;
  attackTotalStartup: number;
  attackWasCrouching: boolean;
  attackWasAirborne: boolean;
  attackWeapon: WeaponId;
  attackHitIds: Set<number>;
  attackBufferTimer: number;

  // Katana Key 3: Charge -> Huge Wide Iaijutsu Slash
  katanaChargeTimer: number;
  katanaChargeMax: number;
  katanaMegaSlashTimer: number;
  katanaMegaSlashMax: number;
  katanaMegaHitIds: Set<number>;

  // Hammer Key 3: Meteor Leap -> Massive AoE Ground Slam
  hammerLeapState: 'none' | 'rising' | 'slamming';
  hammerLeapTimer: number;

  // Crimson Rapier Key 3: Phantom Lunge
  rapierLungeTimer: number;
  rapierLungeHitIds: Set<number>;

  // Obsidian Greataxe Key 3: Cyclone Cleave
  axeSpinTimer: number;
  axeSpinTickTimer: number;

  // Storm Naginata Key 3: Tempest Vault
  naginataVaultTimer: number;
  naginataVaultHitIds: Set<number>;

  // Minstrel Ribbon-Whip Grapple Zip, Vault Throw, & Encore Waltz Dance
  minstrelZipActive: boolean;
  minstrelZipX: number;
  minstrelZipY: number;
  minstrelZipTimer: number;
  minstrelZipHitIds: Set<number>;
  minstrelVaultTimer: number;
  minstrelVaultHitIds: Set<number>;
  minstrelDanceTimer: number;
  minstrelDanceTickTimer: number;

  isHidden: boolean;
  ambushTimer: number;
  shadowChainTimer: number;
  shadowChainCount: number;
  level: number;
  xp: number;
  xpToNext: number;
  assassinTrainingLevel: number;
  swiftFootworkLevel: number;
  baseElements: BaseElementId[];
  combinedElement: CombinedElementId | null;
  elementResonance: number;
  parryWindowTimer: number;
  tagPartner: CharacterId | null;
  tagPartnerCooldown: number;
  cursedGlassVulnerable: boolean;
  backdashTimer: number;
  weaponSkillCooldown: number;
  dashAttackTimer: number;
  dashAttackLevel: number;
  dashAttackHitIds: Set<number>;
  fireWeaponTimer: number;
  fireWeaponLevel: number;
  armorShield: number;
  armorTimer: number;

  unlockedAbilities: AbilityId[];
  unlockedAbilitySlots: number;
  abilitySlots: [AbilityId, AbilityId, AbilityId];
  abilitySlotLevels: [number, number, number];
  abilityCooldowns: Record<AbilityId, number>;

  // Single Equipped Item Slot (Key 5) + Single Special Item Slot (Key 6)
  itemSlots: [ItemId, ItemId, ItemId];
  itemCounts: Record<ItemId, number>;
  specialItemSlot: SpecialItemId;
  specialItemCounts: Record<SpecialItemId, number>;
  specialItemCooldown: number;
  grapple: GrappleState;

  hitStunTimer: number;
  isAirKnockback: boolean;
  invulnTimer: number;
  flashTimer: number;

  animTime: number;
  landTimer: number;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseW: number;
  baseH: number;
  facing: Facing;
  hp: number;
  maxHp: number;
  isBoss: boolean;
  isBigBoss?: boolean;
  enraged?: boolean;
  summoned?: boolean;

  homeX: number;
  homeY: number;
  patrolRadius: number;
  visionRange: number;
  alerted: boolean;
  alertTimer: number;

  onGround: boolean;
  attackCooldown: number;
  attackChargeTimer: number;
  chargeDuration: number;
  pendingAttackKind?: string;
  lungeTimer: number;
  chargeVx: number;
  chargeVy: number;
  stateTimer: number;
  flashTimer: number;
  invulnTimer: number;
  bossHitCounter: number;
  hurtStunTimer: number;
  burnTimer: number;
  burnTickTimer: number;
  chillTimer?: number;
  animTime: number;
  dead: boolean;
  shieldActive?: boolean;
  attackSwingTimer?: number;
  telegraphTargetX?: number;
  telegraphTargetY?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  kind: 'sparkle' | 'ember' | 'slash' | 'dust' | 'gas' | 'blood' | 'blood_mist' | 'energy_wisp';
  rotation: number;
  targetX?: number;
  targetY?: number;
}

export interface BloodStain {
  x: number;
  y: number;
  width: number;
  color: string;
  alpha: number;
}

export interface SlashLine {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  color: string;
  coreColor: string;
  life: number;
  maxLife: number;
}

export interface BossDeathSequence {
  id: number;
  x: number;
  y: number;
  floorY: number;
  timer: number;
  duration: number;
  isBigBoss: boolean;
  color: string;
  secondaryColor: string;
  bossName: string;
  spawnsRelic: boolean;
  relicSpawned: boolean;
  shardGain: number;
  coreGain: number;
  nextPulseTime: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  vy: number;
  text: string;
  subtext?: string;
  color: string;
  scale: number;
  life: number;
  maxLife: number;
}

export interface CameraState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  anchorY: number;
  shakeTime: number;
  shakeDuration: number;
  shakeMagnitude: number;
  offsetX: number;
  offsetY: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  attackJustPressed: boolean;
  backdashJustPressed: boolean;
  interactJustPressed: boolean;
  spellJustPressed: boolean;
  itemJustPressed: boolean;
  specialItemJustPressed: boolean;
  autoAttack?: boolean;
}

export interface BossHudBar {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  enraged: boolean;
  isBigBoss: boolean;
}

export interface HudSnapshot {
  characterId: CharacterId;
  activeRaidId: RaidId;
  activeRaidName: string;
  raidOrderTier: number;
  raidsClearedInRun: RaidId[];
  offeredRaids: RaidId[];
  endRaidUnlocked: boolean;
  raidsRequiredForEnd: number;
  inCamp: boolean;
  isBigBossRoom: boolean;
  roomNumber: number;
  raidRoomsTotal: number;
  raidsCompleted: number;
  roomsCleared: number[];
  shards: number;
  bossCores: number;
  ownedArtifacts: ArtifactId[];
  undyingUsed: boolean;
  bossChestSpawned: boolean;
  exitDoorUnlocked: boolean;

  stageIndex: number;
  stageCount: number;
  stageName: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  hpRegenLevel: number;
  mpRegenLevel: number;
  weapon: WeaponId;
  unlockedWeapons: WeaponId[];
  weaponDamageBonus: number;
  isHidden: boolean;
  wallClingDir: -1 | 0 | 1;
  ledgeGrabActive: boolean;
  katanaCharging: boolean;
  armorShield: number;
  armorTimer: number;
  fireWeaponTimer: number;
  weaponSkillCooldown: number;
  unlockedAbilities: AbilityId[];
  unlockedAbilitySlots: number;
  abilitySlots: [AbilityId, AbilityId, AbilityId];
  abilitySlotLevels: [number, number, number];
  abilityCooldowns: Record<AbilityId, number>;
  itemSlots: [ItemId, ItemId, ItemId];
  itemCounts: Record<ItemId, number>;
  specialItemSlot: SpecialItemId;
  specialItemCounts: Record<SpecialItemId, number>;
  specialItemCooldown: number;
  eclipseFreezeTimer: number;
  level: number;
  xp: number;
  xpToNext: number;
  baseElements: BaseElementId[];
  combinedElement: CombinedElementId | null;
  elementResonance: number;
  weaponEvolutionTier: number;
  spellEvolutionTier: number;
  shadowChainTimer: number;
  shadowChainCount: number;
  minstrelSlowMo: boolean;
  nearbyInteractableLabel: string | null;
  enemiesRemaining: number;
  enemiesTotal: number;
  bossName: string;
  bossHp: number | null;
  bossMaxHp: number | null;
  bossActive: boolean;
  bossEnraged: boolean;
  activeBosses: BossHudBar[];
  status: GameStatus;
  pendingUpgrades: UpgradeOption[];
  upgradePromptTitle: string;
  assassinations: number;
  crits: number;
  parries: number;
  secretsFound: number;
  isCursedChamber: boolean;
  cursedDoorAvailable: boolean;
  tagPartner: CharacterId | null;
  tagPartnerCooldown: number;
  progressPct: number;
}

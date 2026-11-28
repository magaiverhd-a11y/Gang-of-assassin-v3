import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Backpack,
  Flame,
  Gem,
  Hammer,
  Map as MapIcon,
  Pause,
  Play,
  RotateCcw,
  Skull,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { CraftingModal } from './components/CraftingModal';
import { AbilityIcon, SpecialItemIcon, WeaponIcon } from './components/GameIcons';
import { InventoryModal } from './components/InventoryModal';
import { MapModal } from './components/MapModal';
import { MobileAction, MobileControls, TouchDirectionalState, vibrate } from './components/MobileControls';
import { RaidSelectModal } from './components/RaidSelectModal';
import { LeftHud, RightHud } from './components/SideHuds';
import { TuningPanel } from './components/TuningPanel';
import { cloneTuning, loadStoredTuning, saveStoredTuning } from './game/tuningStore';
import { sound } from './game/audio';
import {
  BASE_ELEMENTS,
  CHARACTERS,
  CHARACTER_ORDER,
  COMBINED_ELEMENTS,
  DEFAULT_TUNING,
  getActiveElementDef,
  getRaidOrderScaling,
} from './game/defaults';
import { GameEngine } from './game/engine';
import { renderGame } from './game/renderer';
import {
  AbilityId,
  ArtifactId,
  CharacterId,
  HudSnapshot,
  InputState,
  ItemId,
  RaidId,
  TuningConfig,
  WeaponId,
} from './game/types';

/** Portrait phone layout: touch device held upright, or forced with ?mobile (?mobile=0 forces it off). */
function detectMobileLayout(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('mobile')) return params.get('mobile') !== '0';
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const touch = coarse || (navigator.maxTouchPoints ?? 0) > 0;
  return touch && window.innerHeight > window.innerWidth;
}

function useMobileLayout(): boolean {
  const [mobile, setMobile] = useState<boolean>(() => detectMobileLayout());
  useEffect(() => {
    const update = () => setMobile(detectMobileLayout());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('nc-mobile', mobile);
    if (!mobile) return;
    // iOS Safari ignores user-scalable=no: block pinch / double-tap zoom gestures ourselves.
    const block = (e: Event) => e.preventDefault();
    let lastTouchEnd = 0;
    const onTouchEnd = (e: TouchEvent) => {
      const now = performance.now();
      if (now - lastTouchEnd < 300 && !(e.target as HTMLElement | null)?.closest('input,select,textarea')) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('gesturestart', block, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      document.removeEventListener('gesturestart', block);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, [mobile]);
  return mobile;
}

/** Camera overrides for the portrait mobile view (zoom fitted to screen width + look-ahead). */
function buildMobileFrameTuning(t: TuningConfig, viewportW: number): TuningConfig {
  const widthFactor = Math.max(0.85, Math.min(1.7, viewportW / 390));
  const zoom = Math.max(0.3, (t.mobileZoom || 0.8) * widthFactor);
  const halfViewW = viewportW / (2 * zoom);
  return {
    ...t,
    zoom,
    cameraOffsetY: t.mobileCameraOffsetY,
    cameraDeadzoneX: Math.min(t.cameraDeadzoneX, halfViewW * 0.2),
    cameraLookAhead: t.mobileLookAhead,
  };
}

export default function App() {
  const isMobileLayout = useMobileLayout();
  const isMobileRef = useRef<boolean>(isMobileLayout);
  isMobileRef.current = isMobileLayout;
  const [paused, setPaused] = useState<boolean>(false);
  const pausedRef = useRef<boolean>(false);
  pausedRef.current = paused;
  const [tuning, setTuning] = useState<TuningConfig>(() => loadStoredTuning());
  const [showTuning, setShowTuning] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [hud, setHud] = useState<HudSnapshot>({
    characterId: 'hunter',
    inCamp: true,
    isBigBossRoom: false,
    activeRaidId: 'nocturne_castle',
    activeRaidName: 'Nocturne Castle',
    raidOrderTier: 1,
    raidsClearedInRun: [],
    offeredRaids: ['nocturne_castle', 'goblin_camp'],
    endRaidUnlocked: false,
    raidsRequiredForEnd: 3,
    roomNumber: 0,
    raidRoomsTotal: 4,
    raidsCompleted: 0,
    roomsCleared: [],
    shards: 4,
    bossCores: 0,
    ownedArtifacts: [],
    undyingUsed: false,
    bossChestSpawned: false,
    exitDoorUnlocked: false,

    stageIndex: -1,
    stageCount: 5,
    stageName: 'Base Camp · Crossroads',
    hp: 10,
    maxHp: 10,
    mp: 10,
    maxMp: 10,
    hpRegenLevel: 0,
    mpRegenLevel: 1,
    weapon: 'whip',
    unlockedWeapons: ['whip'],
    weaponDamageBonus: 0,
    isHidden: false,
    armorShield: 0,
    armorTimer: 0,
    fireWeaponTimer: 0,
    weaponSkillCooldown: 0,
    wallClingDir: 0,
    ledgeGrabActive: false,
    katanaCharging: false,
    unlockedAbilities: ['fireball'],
    unlockedAbilitySlots: 1,
    abilitySlots: ['fireball', 'dash_attack', 'grapple'],
    abilitySlotLevels: [1, 1, 1],
    abilityCooldowns: {
      fireball: 0,
      dash_attack: 0,
      grapple: 0,
      gas_bomb: 0,
      fire_weapon: 0,
      cinder_palm: 0,
      chain_storm: 0,
    },
    itemSlots: ['health_potion', 'mana_potion', 'armor_potion'],
    itemCounts: {
      health_potion: 2,
      mana_potion: 2,
      armor_potion: 1,
    },
    specialItemSlot: 'eclipse_hourglass',
    specialItemCounts: {
      eclipse_hourglass: 1,
      hero_tag_horn: 0,
    },
    specialItemCooldown: 0,
    eclipseFreezeTimer: 0,
    nearbyInteractableLabel: null,
    enemiesRemaining: 0,
    enemiesTotal: 0,
    bossName: '',
    bossHp: null,
    bossMaxHp: null,
    bossActive: false,
    bossEnraged: false,
    activeBosses: [],
    status: 'CAMP',
    pendingUpgrades: [],
    upgradePromptTitle: '',
    assassinations: 0,
    crits: 0,
    progressPct: 0,
    level: 1,
    xp: 0,
    xpToNext: 3,
    baseElements: [],
    combinedElement: null,
    elementResonance: 0,
    weaponEvolutionTier: 0,
    spellEvolutionTier: 0,
    shadowChainTimer: 0,
    shadowChainCount: 0,
    minstrelSlowMo: false,
    parries: 0,
    secretsFound: 0,
    isCursedChamber: false,
    cursedDoorAvailable: false,
    tagPartner: null,
    tagPartnerCooldown: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tuningRef = useRef<TuningConfig>(tuning);
  const engineRef = useRef<GameEngine | null>(null);

  const keysHeldRef = useRef<Set<string>>(new Set());
  const jumpQueuedRef = useRef<boolean>(false);
  const attackQueuedRef = useRef<boolean>(false);
  const weaponSkillQueuedRef = useRef<boolean>(false);
  const interactQueuedRef = useRef<boolean>(false);
  const spellQueuedRef = useRef<boolean>(false);
  const itemQueuedRef = useRef<boolean>(false);
  const specialItemQueuedRef = useRef<boolean>(false);
  const touchDirsRef = useRef<TouchDirectionalState>({ left: false, right: false, up: false, down: false });
  const touchJumpHeldRef = useRef<boolean>(false);

  useEffect(() => {
    tuningRef.current = tuning;
    saveStoredTuning(tuning);
  }, [tuning]);

  const handleTuningReplace = useCallback((next: TuningConfig) => {
    tuningRef.current = next;
    setTuning(next);
  }, []);

  const handleTestFreeze = useCallback(() => {
    engineRef.current?.previewKillFreeze(tuningRef.current);
  }, []);

  const handleTuningChange = useCallback(
    <K extends keyof TuningConfig>(key: K, value: TuningConfig[K]) => {
      setTuning((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleResetDefaults = useCallback(() => {
    setTuning(cloneTuning(DEFAULT_TUNING));
  }, []);

  const handleReturnToCamp = useCallback((preserveUpgrades?: boolean) => {
    if (engineRef.current) {
      const keep =
        preserveUpgrades !== undefined
          ? preserveUpgrades
          : engineRef.current.status !== 'GAME_OVER';
      engineRef.current.enterCamp(tuningRef.current, true, keep);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleOpenRaidSelect = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.openRaidSelect();
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleStartRaid = useCallback((raidId?: RaidId) => {
    if (engineRef.current) {
      engineRef.current.startRaid(tuningRef.current, raidId);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleSelectCharacter = useCallback((charId: CharacterId) => {
    if (engineRef.current) {
      engineRef.current.selectCharacter(charId, tuningRef.current);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleCraftRecipe = useCallback((recipeId: string) => {
    if (engineRef.current) {
      engineRef.current.craftRecipe(recipeId, tuningRef.current);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleCraftArtifact = useCallback((artifactId: ArtifactId) => {
    if (engineRef.current) {
      engineRef.current.craftArtifact(artifactId, tuningRef.current);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleSacrificeArtifact = useCallback(
    (artifactId: ArtifactId, sacrificedSpellId?: AbilityId) => {
      if (engineRef.current) {
        engineRef.current.sacrificeForArtifact(
          artifactId,
          tuningRef.current,
          sacrificedSpellId
        );
        setHud(engineRef.current.getHudSnapshot());
      }
    },
    []
  );

  const handleCanSacrifice = useCallback((artifactId: ArtifactId): boolean => {
    return engineRef.current ? engineRef.current.canSacrificeForArtifact(artifactId) : false;
  }, []);

  const handleToggleInventory = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleInventory();
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleToggleMap = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleMap();
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.closeModal();
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sound.muted = next;
      return next;
    });
  }, []);

  const handleSelectWeapon = useCallback((weaponId: WeaponId) => {
    if (engineRef.current) {
      engineRef.current.selectWeapon(weaponId);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleSelectAbility = useCallback((slotIndex: 0 | 1 | 2, abilityId: AbilityId) => {
    if (engineRef.current) {
      engineRef.current.selectAbilityForSlot(slotIndex, abilityId);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleSelectItem = useCallback((slotIndex: 0 | 1 | 2, itemId: ItemId) => {
    if (engineRef.current) {
      engineRef.current.selectItemForSlot(slotIndex, itemId);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleSelectUpgrade = useCallback((optionId: string) => {
    if (engineRef.current) {
      engineRef.current.selectUpgrade(optionId, tuningRef.current);
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  const handleTouchDirections = useCallback((dirs: TouchDirectionalState) => {
    touchDirsRef.current = dirs;
  }, []);

  const handleMobileAction = useCallback((action: MobileAction, pressed: boolean) => {
    if (action === 'jump') {
      touchJumpHeldRef.current = pressed;
      if (pressed) jumpQueuedRef.current = true;
      return;
    }
    if (!pressed) return;
    if (action === 'skill') weaponSkillQueuedRef.current = true;
    else if (action === 'spell') spellQueuedRef.current = true;
    else if (action === 'interact') interactQueuedRef.current = true;
    else if (action === 'item') itemQueuedRef.current = true;
    else if (action === 'special') specialItemQueuedRef.current = true;
    else if (action === 'attack') attackQueuedRef.current = true;
  }, []);

  const handleReleaseFreeze = useCallback(() => {
    engineRef.current?.releaseKillFreeze();
  }, []);

  const handleOpenCrafting = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.openCrafting();
      setHud(engineRef.current.getHudSnapshot());
    }
  }, []);

  // Mobile: haptic pulse on each assassination / kill streak tick.
  const lastAssassinationsRef = useRef<number>(0);
  useEffect(() => {
    if (hud.assassinations > lastAssassinationsRef.current && isMobileRef.current) {
      vibrate(tuningRef.current.mobileHaptics !== false, [28, 40, 46]);
    }
    lastAssassinationsRef.current = hud.assassinations;
  }, [hud.assassinations]);

  // Strict Keyboard Bindings:
  // WASD Move & Crouch-Walk · 1 Attack · 2 Jump · 3 Weapon Skill · 0 Interact
  // 4 Cast Equipped Spell · 5 Use Equipped Item · 6 Use Special Item · I Inventory · M Map · Esc Close Modal · Tab Tuning
  // 7 / 8 / 9 and Q / E / F / T / C intentionally do NOTHING.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;

      // Never treat typing in the tuning panel (search / number boxes / paste box) as game input.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Assassination "freeze until key": any key resumes (and is swallowed).
      if (engineRef.current?.releaseKillFreeze()) {
        e.preventDefault();
        return;
      }

      if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'ArrowDown' ||
        code === 'ArrowLeft' ||
        code === 'ArrowRight'
      ) {
        e.preventDefault();
      }

      const status = engineRef.current?.status;

      if (code === 'Escape' && !e.repeat) {
        if (
          status === 'CRAFTING' ||
          status === 'INVENTORY' ||
          status === 'MAP' ||
          status === 'RAID_SELECT'
        ) {
          handleCloseModal();
          return;
        }
      }

      if (code === 'KeyI' && !e.repeat) {
        if (status === 'CAMP' || status === 'PLAYING' || status === 'INVENTORY' || status === 'MAP') {
          handleToggleInventory();
          return;
        }
      }

      if (code === 'KeyM' && !e.repeat) {
        if (status === 'CAMP' || status === 'PLAYING' || status === 'INVENTORY' || status === 'MAP') {
          handleToggleMap();
          return;
        }
      }

      if (status === 'CRAFTING') {
        if (code === 'Digit0' || code === 'Numpad0') {
          handleCloseModal();
        }
        return;
      }

      if (status === 'RAID_SELECT') {
        if (!e.repeat) {
          const eng = engineRef.current;
          if (code === 'Digit1' || code === 'Numpad1') {
            if (eng?.isEndRaidUnlocked()) {
              handleStartRaid('eclipse_gauntlet');
            } else if (eng?.offeredRaids[0]) {
              handleStartRaid(eng.offeredRaids[0]);
            }
          } else if (code === 'Digit2' || code === 'Numpad2') {
            if (!eng?.isEndRaidUnlocked() && eng?.offeredRaids[1]) {
              handleStartRaid(eng.offeredRaids[1]);
            }
          } else if (code === 'Digit0' || code === 'Numpad0') {
            handleCloseModal();
          }
        }
        return;
      }

      if (status === 'INVENTORY' || status === 'MAP') {
        return;
      }

      // When choosing 1 of 3 upgrades, pressing 1 / 2 / 3 picks the reward card directly
      if (engineRef.current && status === 'CHOOSING_UPGRADE' && !e.repeat) {
        const opts = engineRef.current.pendingUpgrades;
        if ((code === 'Digit1' || code === 'Numpad1') && opts[0]) {
          handleSelectUpgrade(opts[0].id);
          return;
        }
        if ((code === 'Digit2' || code === 'Numpad2') && opts[1]) {
          handleSelectUpgrade(opts[1].id);
          return;
        }
        if ((code === 'Digit3' || code === 'Numpad3') && opts[2]) {
          handleSelectUpgrade(opts[2].id);
          return;
        }
        return;
      }

      if (code === 'KeyR' && !e.repeat) {
        handleReturnToCamp();
        return;
      }

      if (code === 'Tab' && !e.repeat) {
        e.preventDefault();
        setShowTuning((prev) => !prev);
        return;
      }

      const wasHeld = keysHeldRef.current.has(code);
      keysHeldRef.current.add(code);

      if (!wasHeld) {
        if (code === 'Digit1' || code === 'Numpad1') {
          attackQueuedRef.current = true;
        }
        if (code === 'Digit2' || code === 'Numpad2' || code === 'Space') {
          jumpQueuedRef.current = true;
        }
        if (code === 'Digit3' || code === 'Numpad3') {
          weaponSkillQueuedRef.current = true;
        }
        if (code === 'Digit4' || code === 'Numpad4') {
          spellQueuedRef.current = true;
        }
        if (code === 'Digit5' || code === 'Numpad5') {
          itemQueuedRef.current = true;
        }
        if (code === 'Digit6' || code === 'Numpad6') {
          specialItemQueuedRef.current = true;
        }
        if (code === 'Digit0' || code === 'Numpad0') {
          interactQueuedRef.current = true;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const onWindowBlur = () => {
      keysHeldRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [
    handleReturnToCamp,
    handleCloseModal,
    handleToggleInventory,
    handleToggleMap,
    handleSelectUpgrade,
    handleStartRaid,
  ]);

  // Core Canvas Resize & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!engineRef.current) {
      engineRef.current = new GameEngine(tuningRef.current);
      // Debug hook for tuning / automated smoke tests: open the game with ?debug in the URL.
      if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')) {
        (window as unknown as { __nocturneEngine?: GameEngine }).__nocturneEngine = engineRef.current;
      }
    }

    let viewportW = stage.clientWidth || 960;
    let viewportH = stage.clientHeight || 540;
    let frameTuningSrc: TuningConfig | null = null;
    let frameTuningW = 0;
    let frameTuning: TuningConfig = tuningRef.current;

    const syncCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewportW = Math.max(isMobileRef.current ? 240 : 320, stage.clientWidth);
      viewportH = Math.max(isMobileRef.current ? 200 : 240, stage.clientHeight);
      canvas.width = Math.round(viewportW * dpr);
      canvas.height = Math.round(viewportH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncCanvasSize();
    const resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(stage);

    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccum = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const held = keysHeldRef.current;
      const touch = touchDirsRef.current;
      const mobile = isMobileRef.current;
      const input: InputState = {
        left: held.has('KeyA') || held.has('ArrowLeft') || touch.left,
        right: held.has('KeyD') || held.has('ArrowRight') || touch.right,
        up: held.has('KeyW') || held.has('ArrowUp') || touch.up,
        down: held.has('KeyS') || held.has('ArrowDown') || touch.down,
        jumpHeld: held.has('Digit2') || held.has('Numpad2') || held.has('Space') || touchJumpHeldRef.current,
        autoAttack: mobile,
        jumpJustPressed: jumpQueuedRef.current,
        attackJustPressed: attackQueuedRef.current,
        backdashJustPressed: weaponSkillQueuedRef.current,
        interactJustPressed: interactQueuedRef.current,
        spellJustPressed: spellQueuedRef.current,
        itemJustPressed: itemQueuedRef.current,
        specialItemJustPressed: specialItemQueuedRef.current,
      };
      jumpQueuedRef.current = false;
      attackQueuedRef.current = false;
      weaponSkillQueuedRef.current = false;
      interactQueuedRef.current = false;
      spellQueuedRef.current = false;
      itemQueuedRef.current = false;
      specialItemQueuedRef.current = false;

      const engine = engineRef.current!;
      engine.fx.mobile = mobile;
      if (mobile) {
        if (frameTuningSrc !== tuningRef.current || frameTuningW !== viewportW) {
          frameTuningSrc = tuningRef.current;
          frameTuningW = viewportW;
          frameTuning = buildMobileFrameTuning(tuningRef.current, viewportW);
        }
      } else {
        frameTuning = tuningRef.current;
      }
      if (!pausedRef.current) {
        engine.update(dt, input, frameTuning, viewportW, viewportH);
      }
      renderGame(ctx, engine, frameTuning, viewportW, viewportH);

      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.06) {
        hudSyncAccum = 0;
        setHud(engine.getHudSnapshot());
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [isMobileLayout]);

  const activeChar = CHARACTERS[hud.characterId];

  // Modals / overlays: inside the game view on desktop, over game + control deck on mobile portrait.
  const modalLayer = (
    <>
          {/* Camp Crafting Forge & Blood Altar Modal */}
          {hud.status === 'CRAFTING' && (
            <CraftingModal
              hud={hud}
              onCraftRecipe={handleCraftRecipe}
              onCraftArtifact={handleCraftArtifact}
              onSacrificeArtifact={handleSacrificeArtifact}
              canSacrifice={handleCanSacrifice}
              onClose={handleCloseModal}
            />
          )}

          {/* Inventory & Base Camp Loadout Modal (I) */}
          {hud.status === 'INVENTORY' && (
            <InventoryModal
              hud={hud}
              onSelectWeapon={handleSelectWeapon}
              onSelectAbility={handleSelectAbility}
              onSelectItem={handleSelectItem}
              onClose={handleCloseModal}
            />
          )}

          {/* Raid Selection Modal */}
          {hud.status === 'RAID_SELECT' && (
            <RaidSelectModal
              hud={hud}
              onStartRaid={handleStartRaid}
              onSelectCharacter={handleSelectCharacter}
              onClose={handleCloseModal}
            />
          )}

          {/* Raid Map Modal (M) */}
          {hud.status === 'MAP' && <MapModal hud={hud} onClose={handleCloseModal} />}

          {/* Choose 1 of 3 Upgrade Modal (Opened from Boss Chests & Relic Altars) */}
          {hud.status === 'CHOOSING_UPGRADE' && hud.pendingUpgrades.length > 0 && (
            <div className="absolute inset-0 bg-[#080a10]/84 flex items-start sm:items-center justify-center p-6 z-20 overflow-y-auto">
              <div className="max-w-3xl w-full bg-[#11141f] border border-[#2f364d] p-6 space-y-5">
                <div className="text-center space-y-1">
                  <h2
                    className="text-xl font-bold tracking-wider text-[#e5a93c]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {hud.upgradePromptTitle || 'Choose 1 of 3 Upgrades'}
                  </h2>
                  <p className="text-xs text-[#9aa2b8]">
                    Select one blessing below or press 1, 2, or 3 to continue.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {hud.pendingUpgrades.map((opt, idx) => {
                    const combinedDef = opt.combinedElementId
                      ? COMBINED_ELEMENTS[opt.combinedElementId]
                      : null;
                    const baseElDef = opt.elementId ? BASE_ELEMENTS[opt.elementId] : null;
                    const elVisual = combinedDef ?? baseElDef;
                    const isElementCard =
                      opt.kind === 'element_affinity' || opt.kind === 'element_resonance';

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectUpgrade(opt.id)}
                        className="text-left bg-[#161a28] hover:bg-[#1e2436] border border-[#2c334a] hover:border-[#e5a93c] p-4 flex flex-col justify-between gap-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e5a93c]"
                        style={
                          isElementCard && elVisual
                            ? {
                                borderColor: `${elVisual.primaryColor}88`,
                                boxShadow: `inset 0 0 24px ${elVisual.primaryColor}18`,
                              }
                            : undefined
                        }
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium" style={{ color: opt.accent }}>
                              {opt.category}
                            </span>
                            <span className="font-mono text-[#7c859e]">[{idx + 1}]</span>
                          </div>

                          {(isElementCard ||
                            opt.abilityId ||
                            opt.weaponId ||
                            opt.specialItemId ||
                            opt.kind === 'assassin_training' ||
                            opt.kind === 'swift_footwork') && (
                            <div className="w-10 h-10 bg-[#101420] border border-[#2e364f] flex items-center justify-center">
                              {isElementCard && elVisual ? (
                                <span
                                  className="w-6 h-6 rounded-full border border-white/80"
                                  style={{
                                    background: elVisual.isCombined
                                      ? `linear-gradient(135deg, ${elVisual.primaryColor}, ${elVisual.secondaryColor})`
                                      : `radial-gradient(circle at 35% 35%, ${elVisual.glowColor}, ${elVisual.primaryColor} 65%, ${elVisual.secondaryColor})`,
                                    boxShadow: `0 0 12px ${elVisual.primaryColor}`,
                                  }}
                                />
                              ) : opt.abilityId ? (
                                <AbilityIcon id={opt.abilityId} className="w-6 h-6" />
                              ) : opt.weaponId ? (
                                <WeaponIcon id={opt.weaponId} className="w-6 h-6" />
                              ) : opt.specialItemId ? (
                                <SpecialItemIcon id={opt.specialItemId} className="w-6 h-6" />
                              ) : opt.kind === 'assassin_training' ? (
                                <Skull className="w-5 h-5 text-[#f43f5e]" />
                              ) : opt.kind === 'swift_footwork' ? (
                                <Zap className="w-5 h-5 text-[#38bdf8]" />
                              ) : null}
                            </div>
                          )}

                          <h3 className="text-sm font-semibold text-[#f3efe6] leading-snug">
                            {opt.title}
                          </h3>
                          <p className="text-xs text-[#a5adc2] leading-relaxed">
                            {opt.description}
                          </p>
                        </div>

                        <div
                          className="pt-2 border-t border-[#242a3d] text-xs font-medium"
                          style={{ color: isElementCard ? opt.accent : '#e5a93c' }}
                        >
                          {combinedDef
                            ? `Fuse ${combinedDef.name}`
                            : opt.kind === 'element_affinity'
                              ? 'Awaken Element'
                              : 'Choose Blessing'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Victory / Defeat Overlay */}
          {(hud.status === 'VICTORY' || hud.status === 'GAME_OVER') && (
            <div className="absolute inset-0 bg-[#080a10]/84 flex items-center justify-center p-6 z-20">
              <div className="max-w-md w-full bg-[#121520] border border-[#2c3347] p-7 text-center space-y-5">
                <div className="space-y-1.5">
                  <h2
                    className={`text-2xl font-bold tracking-wider ${
                      hud.status === 'VICTORY' ? 'text-[#e5a93c]' : 'text-[#c82333]'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {hud.status === 'VICTORY'
                      ? hud.activeRaidId === 'eclipse_gauntlet'
                        ? 'Eclipse Overlord Vanquished'
                        : 'Raid Conquered'
                      : 'Fallen in the Raid'}
                  </h2>
                  <p className="text-xs text-[#a5adc2]">
                    {hud.status === 'VICTORY'
                      ? hud.activeRaidId === 'eclipse_gauntlet'
                        ? 'You conquered the End Boss Gauntlet! All raids have unlocked for a fresh campaign cycle while your upgrades and artifacts carry onward.'
                        : 'All upgrades, spells, and gear carry back to Base Camp for your next raid!'
                      : 'Raid upgrades were lost — only your forged Permanent Artifacts and Boss Cores endure.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs text-[#9aa2b8]">
                  <span>
                    Room{' '}
                    <span className="font-mono tabular-nums text-[#e8e4dc]">
                      {hud.isBigBossRoom ? 'Final Boss' : `${hud.roomNumber}/${hud.raidRoomsTotal}`}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Cores{' '}
                    <span className="font-mono tabular-nums text-[#ff6b8b]">
                      {hud.bossCores}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Artifacts{' '}
                    <span className="font-mono tabular-nums text-[#e5a93c]">
                      {hud.ownedArtifacts.length}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleReturnToCamp(hud.status === 'VICTORY')}
                    className="px-5 py-2.5 text-sm font-medium bg-[#c82333] hover:bg-[#d92b3c] text-white rounded transition-colors whitespace-nowrap"
                  >
                    Return to Base Camp
                  </button>
                </div>
              </div>
            </div>
          )}
    </>
  );

  if (isMobileLayout) {
    const iconBtn = (
      key: string,
      label: string,
      icon: React.ReactNode,
      onPress: () => void,
      opts: { active?: boolean; disabled?: boolean; accent?: string } = {}
    ) => (
      <button
        key={key}
        type="button"
        aria-label={label}
        title={label}
        disabled={opts.disabled}
        data-mobile-menu={key}
        onClick={(e) => {
          vibrate(tuningRef.current.mobileHaptics !== false, 8);
          onPress();
          (e.currentTarget as HTMLButtonElement).blur();
        }}
        className="h-9 min-w-9 px-1.5 flex flex-col items-center justify-center rounded border transition-colors disabled:opacity-30"
        style={{
          borderColor: opts.active ? opts.accent ?? '#e5a93c' : '#2a2633',
          background: opts.active ? '#2a1d1d' : '#13121a',
          color: opts.active ? '#fde68a' : '#cfc6b6',
        }}
      >
        {icon}
        <span className="text-[7.5px] leading-none mt-0.5 tracking-wider uppercase text-[#8f8698]">{label}</span>
      </button>
    );
    const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
    const mpPct = Math.max(0, Math.min(100, (hud.mp / Math.max(1, hud.maxMp)) * 100));
    const xpPct = Math.max(0, Math.min(100, (hud.xp / Math.max(1, hud.xpToNext)) * 100));
    const canMenu = hud.status === 'CAMP' || hud.status === 'PLAYING' || hud.status === 'INVENTORY' || hud.status === 'MAP';

    return (
      <div
        className="fixed inset-0 overflow-hidden flex flex-col bg-[#07080d] text-[#e8e4dc]"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
        data-layout="mobile-portrait"
      >
        {/* Compact top bar: menus + vitals */}
        <header className="shrink-0 bg-[#0d0c12] border-b border-[#2a2230] px-1.5 pt-1 pb-1 space-y-1">
          <div className="flex items-center gap-1">
            <span
              className="text-[11px] font-bold tracking-[0.14em] text-[#e5a93c] mr-auto pl-1 truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {hud.inCamp ? activeChar.name : `R${hud.roomNumber}/${hud.raidRoomsTotal}`}
            </span>
            {iconBtn('inventory', 'Bag', <Backpack className="w-4 h-4" />, handleToggleInventory, {
              active: hud.status === 'INVENTORY',
              disabled: !canMenu,
            })}
            {iconBtn('map', 'Map', <MapIcon className="w-4 h-4" />, handleToggleMap, {
              active: hud.status === 'MAP',
              disabled: !canMenu,
            })}
            {hud.inCamp &&
              iconBtn('craft', 'Forge', <Hammer className="w-4 h-4" />, handleOpenCrafting, {
                active: hud.status === 'CRAFTING',
                disabled: hud.status !== 'CAMP',
              })}
            {hud.inCamp &&
              iconBtn('hero', 'Hero', <RotateCcw className="w-4 h-4" />, () => {
                const idx = CHARACTER_ORDER.indexOf(hud.characterId);
                handleSelectCharacter(CHARACTER_ORDER[(idx + 1) % CHARACTER_ORDER.length]);
              }, { disabled: hud.status !== 'CAMP' })}
            {hud.inCamp
              ? iconBtn('raid', 'Raid', <Flame className="w-4 h-4" />, handleOpenRaidSelect, {
                  active: hud.status === 'RAID_SELECT',
                  accent: '#c82333',
                  disabled: hud.status !== 'CAMP',
                })
              : iconBtn('camp', 'Camp', <RotateCcw className="w-4 h-4" />, () => {
                  if (hud.status !== 'PLAYING' || window.confirm('Leave the raid and return to Base Camp?')) {
                    handleReturnToCamp();
                  }
                })}
            {iconBtn('pause', paused ? 'Play' : 'Pause', paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />, () => setPaused((v) => !v), {
              active: paused,
            })}
            {iconBtn('mute', muted ? 'Muted' : 'Sound', muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />, handleToggleMute)}
            {iconBtn('tune', 'Tune', <SlidersHorizontal className="w-4 h-4" />, () => setShowTuning((v) => !v), {
              active: showTuning,
              accent: '#c82333',
            })}
          </div>
          <div className="flex items-center gap-2 px-1 text-[9.5px] font-mono">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between leading-none mb-0.5">
                <span className="text-[#f87171] font-bold">HP</span>
                <span className="tabular-nums text-[#f3efe6]">{hud.hp}/{hud.maxHp}</span>
              </div>
              <div className="h-2 bg-[#1b1015] border border-[#4a1d26]">
                <div className="h-full bg-gradient-to-r from-[#7f1d1d] to-[#dc2626]" style={{ width: `${hpPct}%` }} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between leading-none mb-0.5">
                <span className="text-[#93c5fd] font-bold">MP</span>
                <span className="tabular-nums text-[#f3efe6]">{hud.mp}/{hud.maxMp}</span>
              </div>
              <div className="h-2 bg-[#0f1424] border border-[#1e3a5f]">
                <div className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6]" style={{ width: `${mpPct}%` }} />
              </div>
            </div>
            <div className="w-[64px] shrink-0">
              <div className="flex justify-between leading-none mb-0.5">
                <span className="text-[#38bdf8] font-bold">LV{hud.level}</span>
                <span className="text-[#ffd166]">◆{hud.shards}</span>
              </div>
              <div className="h-2 bg-[#161c2c] border border-[#2a3856]">
                <div className="h-full bg-gradient-to-r from-[#38bdf8] to-[#c084fc]" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {/* Game view: fills the top part, never covered by controls */}
          <div
            ref={stageRef}
            className="flex-1 relative min-h-0 overflow-hidden bg-[#07090f] touch-none"
            data-mobile-stage
            onPointerDownCapture={handleReleaseFreeze}
          >
            <canvas ref={canvasRef} className="block w-full h-full touch-none" />

            {/* Small status chips over the top edge of the view */}
            <div className="pointer-events-none absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start gap-2 text-[9px] font-mono">
              <span className="px-1.5 py-0.5 bg-[#07080d]/70 border border-[#2a2230] text-[#cbb89a] truncate max-w-[60%]">
                {hud.inCamp ? hud.stageName : hud.activeRaidName}
              </span>
              <span className="flex gap-1">
                {!hud.inCamp && (
                  <span className="px-1.5 py-0.5 bg-[#07080d]/70 border border-[#2a2230] text-[#e8e4dc]">
                    Foes {hud.enemiesRemaining}/{hud.enemiesTotal}
                  </span>
                )}
                {hud.isHidden && (
                  <span className="px-1.5 py-0.5 bg-[#0c1626]/80 border border-[#1e3a5f] text-[#93c5fd]">HIDDEN</span>
                )}
              </span>
            </div>

            {hud.bossActive && hud.activeBosses.length > 0 && (
              <div className="pointer-events-none absolute top-7 left-1/2 -translate-x-1/2 w-[92%] space-y-1">
                {hud.activeBosses.map((boss) => (
                  <div key={boss.id} className="bg-[#0b0d13]/85 px-2 py-1 border border-[#4a202c]">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {boss.name}
                        {boss.enraged ? ' · II' : ''}
                      </span>
                      <span className="font-mono text-[#e5a93c]">
                        {boss.hp}/{boss.maxHp}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1b1620]">
                      <div
                        className={boss.enraged ? 'h-full bg-[#f97316]' : 'h-full bg-[#c82333]'}
                        style={{ width: `${Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hud.nearbyInteractableLabel && (hud.status === 'PLAYING' || hud.status === 'CAMP') ? (
              <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] bg-[#0b0d13]/85 border border-[#e5a93c]/60 text-[#fde68a] whitespace-nowrap">
                Interact: {hud.nearbyInteractableLabel}
              </div>
            ) : null}

            {paused && (
              <button
                type="button"
                onClick={() => setPaused(false)}
                className="absolute inset-0 z-10 bg-[#07080d]/70 flex flex-col items-center justify-center gap-2"
              >
                <span className="text-2xl tracking-[0.3em] text-[#e5a93c]" style={{ fontFamily: 'var(--font-display)' }}>
                  PAUSED
                </span>
                <span className="text-xs text-[#9aa2b8]">Tap to resume</span>
              </button>
            )}
          </div>

          <MobileControls
            hud={hud}
            tuning={tuning}
            onDirectionChange={handleTouchDirections}
            onAction={handleMobileAction}
            onAnyTouch={handleReleaseFreeze}
          />

          {/* Menus cover game + deck on a phone so they have room */}
          {modalLayer}

          {showTuning && (
            <div className="absolute inset-0 z-30">
              <TuningPanel
                tuning={tuning}
                onReplace={handleTuningReplace}
                onTestFreeze={handleTestFreeze}
                onClose={() => setShowTuning(false)}
              />
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#0b0d13] text-[#e8e4dc]">
      {/* Compact Single-Row Top Bar */}
      <header className="h-12 shrink-0 px-5 border-b border-[#222736] bg-[#10131c] flex items-center justify-between gap-4">
        {/* Zone 1: Brand */}
        <span
          className="text-base font-bold tracking-wider text-[#e8e4dc] whitespace-nowrap shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Nocturne Castle
        </span>

        {/* Zone 2: Stage / Camp Status */}
        <div className="hidden md:flex items-center gap-3 text-xs text-[#9aa2b8] min-w-0">
          <span className="whitespace-nowrap shrink-0 text-[#e5a93c] font-medium">
            {hud.stageName}
          </span>

          <span className="text-[#353c52]" aria-hidden="true">·</span>

          <span className="whitespace-nowrap shrink-0 text-[#e8e4dc]">
            {activeChar.name}
          </span>

          <span className="text-[#353c52]" aria-hidden="true">·</span>

          <span className="whitespace-nowrap shrink-0">
            Shards{' '}
            <span className="font-mono tabular-nums text-[#ffd166] font-semibold">
              {hud.shards}
            </span>
          </span>

          <span className="text-[#353c52]" aria-hidden="true">·</span>

          <span className="whitespace-nowrap shrink-0 inline-flex items-center gap-1">
            <Gem className="w-3 h-3 text-[#ff6b8b]" />
            <span>Cores</span>{' '}
            <span className="font-mono tabular-nums text-[#ff6b8b] font-semibold">
              {hud.bossCores}
            </span>
          </span>

          {!hud.inCamp && (
            <>
              <span className="text-[#353c52]" aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0 text-[#cbd5e1]">
                {hud.activeRaidName}
                {hud.raidOrderTier >= 2 ? ` (T${hud.raidOrderTier})` : ''}
              </span>
              <span className="text-[#353c52]" aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0">
                Foes{' '}
                <span className="font-mono tabular-nums text-[#e8e4dc]">
                  {hud.enemiesRemaining}/{hud.enemiesTotal}
                </span>
              </span>
            </>
          )}

          {hud.inCamp && hud.raidOrderTier >= 2 && (
            <>
              <span className="text-[#353c52]" aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0 font-mono text-[#fda4af]">
                {getRaidOrderScaling(hud.raidOrderTier).label}
              </span>
            </>
          )}

          {hud.exitDoorUnlocked && !hud.inCamp && (
            <>
              <span className="text-[#353c52]" aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0 font-mono text-[#e5a93c]">
                {hud.bossChestSpawned ? 'CLAIM RELIC · DOOR OPEN' : 'DOOR OPEN →'}
              </span>
            </>
          )}

          <span className="text-[#353c52]" aria-hidden="true">·</span>

          <span
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            title={`Level ${hud.level} (${hud.xp}/${hud.xpToNext} XP)`}
          >
            <span className="font-mono text-[11px] font-bold text-[#38bdf8]">
              LV {hud.level}
            </span>
            <span className="w-16 h-1.5 bg-[#161c2c] border border-[#2a3856] overflow-hidden inline-block">
              <span
                className="block h-full bg-gradient-to-r from-[#38bdf8] to-[#c084fc] transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.round((hud.xp / Math.max(1, hud.xpToNext)) * 100))}%`,
                }}
              />
            </span>
          </span>

          {(() => {
            const activeEl = getActiveElementDef(hud.baseElements, hud.combinedElement);
            if (!activeEl) return null;
            return (
              <>
                <span className="text-[#353c52]" aria-hidden="true">·</span>
                <span
                  className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold"
                  style={{ color: activeEl.primaryColor }}
                  title={`${activeEl.name} (${activeEl.title}) — ${activeEl.shortDesc}`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-white/75"
                    style={{
                      background: activeEl.isCombined
                        ? `linear-gradient(135deg, ${activeEl.primaryColor}, ${activeEl.secondaryColor})`
                        : activeEl.primaryColor,
                      boxShadow: `0 0 7px ${activeEl.primaryColor}`,
                    }}
                  />
                  {activeEl.name.toUpperCase()}
                </span>
              </>
            );
          })()}

          {hud.shadowChainTimer > 0 && (
            <>
              <span className="text-[#353c52]" aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0 font-mono text-[11px] font-bold text-[#e879f9] animate-pulse">
                CHAIN x{Math.max(1, hud.shadowChainCount)} ({hud.shadowChainTimer.toFixed(1)}s)
              </span>
            </>
          )}

          {hud.isHidden && (
            <>
              <span className="text-[#353c52]" aria-hidden="true">·</span>
              <span className="whitespace-nowrap shrink-0 font-mono text-[#93c5fd]">
                HIDDEN
              </span>
            </>
          )}
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hud.inCamp && (
            <div className="hidden xl:flex items-center gap-1.5 mr-1">
              <button
                type="button"
                onClick={(e) => {
                  const idx = CHARACTER_ORDER.indexOf(hud.characterId);
                  const nextChar = CHARACTER_ORDER[(idx + 1) % CHARACTER_ORDER.length];
                  handleSelectCharacter(nextChar);
                  (e.currentTarget as HTMLButtonElement).blur();
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-[#e8e4dc] bg-[#191d2b] hover:bg-[#23293b] border border-[#2a3145] rounded transition-colors whitespace-nowrap"
              >
                Swap Hero
              </button>
              <button
                type="button"
                onClick={(e) => {
                  handleOpenRaidSelect();
                  (e.currentTarget as HTMLButtonElement).blur();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#991b2e] hover:bg-[#b52238] border border-[#c82333] rounded transition-colors whitespace-nowrap"
              >
                <Flame className="w-3.5 h-3.5" />
                Choose Raid
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              handleToggleInventory();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              hud.status === 'INVENTORY'
                ? 'bg-[#2a2315] border-[#e5a93c] text-[#fde68a]'
                : 'bg-[#191d2b] border-[#2a3145] text-[#d4d8e3] hover:text-white hover:bg-[#23293b]'
            }`}
            title="Inventory & Base Camp Loadout (I)"
          >
            <Backpack className="w-3.5 h-3.5" />
            <span>I</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              handleToggleMap();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              hud.status === 'MAP'
                ? 'bg-[#17233a] border-[#60a5fa] text-[#bfdbfe]'
                : 'bg-[#191d2b] border-[#2a3145] text-[#d4d8e3] hover:text-white hover:bg-[#23293b]'
            }`}
            title="Raid Map (M)"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>M</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              handleToggleMute();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="p-1.5 text-[#9aa2b8] hover:text-white rounded hover:bg-[#1b202e] transition-colors"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              handleReturnToCamp();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#d4d8e3] hover:text-white bg-[#191d2b] hover:bg-[#23293b] border border-[#2a3145] rounded transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Camp
          </button>

          <button
            type="button"
            onClick={(e) => {
              setShowTuning((prev) => !prev);
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
              showTuning
                ? 'bg-[#c82333] border-[#e03e4e] text-white'
                : 'bg-[#191d2b] border-[#2a3145] text-[#d4d8e3] hover:text-white hover:bg-[#23293b]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Tune
          </button>
        </div>
      </header>

      {/* Main Layout: Left HUD (Health + Item [5] + Special [6]) | Pure Game Screen | Right HUD (Mana + Spell [4]) */}
      <main className="flex-1 flex min-h-0 relative overflow-hidden">
        <LeftHud hud={hud} onOpenInventory={handleToggleInventory} />

        {/* Unobstructed Center Game Viewport */}
        <div
          ref={stageRef}
          className="flex-1 relative min-w-0 h-full overflow-hidden bg-[#07090f]"
          onPointerDownCapture={() => {
            engineRef.current?.releaseKillFreeze();
          }}
        >
          <canvas ref={canvasRef} className="block w-full h-full" />

          {/* Boss Health Bar(s) — Supports Single Boss, Enraged Phase II, and Eclipse Duo-Boss Chambers */}
          {hud.bossActive && hud.activeBosses.length > 0 && (
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 w-[min(460px,84%)] space-y-2">
              {hud.activeBosses.map((boss) => (
                <div
                  key={boss.id}
                  className={`bg-[#0b0d13]/90 px-4 py-2 border transition-colors ${
                    boss.enraged
                      ? 'border-[#f59e0b] shadow-[0_0_16px_rgba(245,158,11,0.35)]'
                      : boss.isBigBoss
                        ? 'border-[#8c273e]'
                        : 'border-[#3a1f28]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-semibold tracking-wider text-[#e8e4dc] truncate"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {boss.name}
                      </span>
                      {boss.enraged && (
                        <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#3b1510] border border-[#f59e0b] text-[#fde68a] animate-pulse shrink-0">
                          PHASE II
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums text-[#e5a93c] shrink-0">
                      {boss.hp}/{boss.maxHp}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#1b1620] border border-[#4a202c]">
                    <div
                      className={`h-full transition-all duration-150 ${
                        boss.enraged
                          ? 'bg-gradient-to-r from-[#dc2626] via-[#f97316] to-[#facc15]'
                          : 'bg-[#c82333]'
                      }`}
                      style={{
                        width: `${Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isMobileLayout && modalLayer}
        </div>

        <RightHud hud={hud} onOpenMap={handleToggleMap} />

        {/* Slide-over Tuning Drawer */}
        {showTuning && (
          <div className="absolute top-0 right-0 bottom-0 z-30 shadow-2xl max-w-full">
            <TuningPanel
              tuning={tuning}
              onReplace={handleTuningReplace}
              onTestFreeze={handleTestFreeze}
              onClose={() => setShowTuning(false)}
            />
          </div>
        )}
      </main>
    </div>
  );
}

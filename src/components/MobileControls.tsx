import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { ArrowUp, Hand, Skull, Swords, Wind } from 'lucide-react';
import { ABILITIES, ITEMS, SPECIAL_ITEMS, WEAPONS } from '../game/defaults';
import { HudSnapshot, TuningConfig } from '../game/types';
import { AbilityIcon, ItemIcon, SpecialItemIcon, WeaponSkillIcon } from './GameIcons';

export interface TouchDirectionalState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/** Index = value stored in tuning.mobileBtn* (keep in sync with MOBILE_ACTION_LABELS). */
export type MobileAction = 'jump' | 'skill' | 'spell' | 'interact' | 'item' | 'special' | 'attack';
export const MOBILE_ACTIONS: MobileAction[] = ['jump', 'skill', 'spell', 'interact', 'item', 'special', 'attack'];

export function mobileActionAt(index: number): MobileAction {
  return MOBILE_ACTIONS[Math.max(0, Math.min(MOBILE_ACTIONS.length - 1, Math.round(index) || 0))];
}

interface MobileControlsProps {
  hud: HudSnapshot;
  tuning: TuningConfig;
  onDirectionChange: (dirs: TouchDirectionalState) => void;
  onAction: (action: MobileAction, pressed: boolean) => void;
  onAnyTouch?: () => void;
}

const NO_DIRS: TouchDirectionalState = { left: false, right: false, up: false, down: false };

export function vibrate(enabled: boolean, pattern: number | number[]) {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    // unsupported
  }
}

interface ButtonVisual {
  label: string;
  sub: string;
  icon: ReactNode;
  ready: boolean;
  /** Border / glow colour when ready. */
  color: string;
  alert?: boolean;
}

function describeAction(action: MobileAction, hud: HudSnapshot): ButtonVisual {
  switch (action) {
    case 'jump':
      return { label: 'Jump', sub: 'Hold = higher', icon: <ArrowUp className="w-7 h-7 stroke-[2.5]" />, ready: true, color: '#d94660' };
    case 'skill': {
      const ready = hud.weaponSkillCooldown <= 0;
      return {
        label: 'Dash',
        sub: ready ? WEAPONS[hud.weapon].skillName : `${hud.weaponSkillCooldown.toFixed(1)}s`,
        icon: ready ? <WeaponSkillIcon id={hud.weapon} className="w-7 h-7" /> : <Wind className="w-7 h-7" />,
        ready,
        color: '#e5a93c',
      };
    }
    case 'spell': {
      const id = hud.abilitySlots[0];
      const def = ABILITIES[id];
      const cd = hud.abilityCooldowns[id];
      const ready = cd <= 0 && hud.mp >= def.manaCost;
      return {
        label: def.shortName,
        sub: cd > 0 ? `${cd.toFixed(1)}s` : `${def.manaCost} MP`,
        icon: <AbilityIcon id={id} className="w-7 h-7" />,
        ready,
        color: '#5b8def',
      };
    }
    case 'interact': {
      if (hud.assassinationReady) {
        return { label: 'Assassinate', sub: 'Strike now', icon: <Skull className="w-7 h-7" />, ready: true, color: '#ff2d46', alert: true };
      }
      const near = hud.nearbyInteractableLabel;
      return {
        label: 'Interact',
        sub: near ? near : 'Backstab',
        icon: <Hand className="w-7 h-7" />,
        ready: Boolean(near),
        color: near ? '#e5a93c' : '#8b6a9e',
      };
    }
    case 'item': {
      const id = hud.itemSlots[0];
      const n = hud.itemCounts[id];
      return { label: ITEMS[id].shortName, sub: `x${n}`, icon: <ItemIcon id={id} className="w-7 h-7" />, ready: n > 0, color: '#c82333' };
    }
    case 'special': {
      const id = hud.specialItemSlot;
      const n = hud.specialItemCounts[id];
      const ready = n > 0 && hud.specialItemCooldown <= 0;
      return {
        label: SPECIAL_ITEMS[id].shortName,
        sub: hud.specialItemCooldown > 0 ? `${hud.specialItemCooldown.toFixed(1)}s` : `x${n}`,
        icon: <SpecialItemIcon id={id} className="w-7 h-7" />,
        ready,
        color: '#a78bfa',
      };
    }
    case 'attack':
    default:
      return { label: 'Attack', sub: 'Manual', icon: <Swords className="w-7 h-7" />, ready: true, color: '#e8e4dc' };
  }
}

/** One big multitouch-safe action button. Tracks its own pointer so several can be held at once. */
function DeckButton({
  action,
  hud,
  big,
  style,
  haptics,
  onAction,
  onAnyTouch,
  mini,
}: {
  action: MobileAction;
  hud: HudSnapshot;
  big?: boolean;
  mini?: boolean;
  style: CSSProperties;
  haptics: boolean;
  onAction: (action: MobileAction, pressed: boolean) => void;
  onAnyTouch?: () => void;
}) {
  const pointerRef = useRef<number | null>(null);
  const [held, setHeld] = useState(false);
  const v = describeAction(action, hud);

  const release = (e: ReactPointerEvent) => {
    if (pointerRef.current !== e.pointerId) return;
    pointerRef.current = null;
    setHeld(false);
    onAction(action, false);
  };

  const size = mini ? 50 : big ? 92 : 82;
  const active = v.ready || held;
  return (
    <button
      type="button"
      data-mobile-action={action}
      aria-label={v.label}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        onAnyTouch?.();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // synthetic events in tests
        }
        pointerRef.current = e.pointerId;
        setHeld(true);
        vibrate(haptics, v.alert ? 22 : 10);
        onAction(action, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="absolute flex flex-col items-center justify-center select-none touch-none"
      style={{
        ...style,
        width: size,
        height: size,
        borderRadius: mini ? '50%' : 14,
        border: `2px solid ${active ? v.color : '#2a3045'}`,
        color: active ? '#f3ece0' : '#6b7390',
        background: held
          ? `radial-gradient(circle at 50% 40%, ${v.color}55, #120d16 78%)`
          : `radial-gradient(circle at 50% 30%, ${active ? v.color + '26' : '#1a1f2e'}, #0c0e15 80%)`,
        boxShadow: held
          ? `0 0 22px ${v.color}88, inset 0 0 14px ${v.color}55`
          : v.alert
            ? `0 0 18px ${v.color}aa`
            : `0 4px 10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)${active ? `, 0 0 10px ${v.color}33` : ''}`,
        transform: held ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 70ms ease-out, box-shadow 90ms ease-out',
        animation: v.alert && !held ? 'nc-pulse 0.9s ease-in-out infinite' : undefined,
        opacity: active ? 1 : 0.72,
      }}
    >
      <span className="pointer-events-none">{v.icon}</span>
      {!mini && (
        <>
          <span
            className="pointer-events-none mt-0.5 text-[10.5px] font-bold uppercase tracking-wider leading-none truncate max-w-[86%]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {v.label}
          </span>
          <span className="pointer-events-none mt-0.5 font-mono text-[9px] leading-none text-[#b7a98d] truncate max-w-[88%]">
            {v.sub}
          </span>
        </>
      )}
      {mini && (
        <span className="pointer-events-none absolute -bottom-1 -right-1 font-mono text-[9px] font-bold px-1 rounded bg-[#0b0d13] border border-[#2a3045] text-[#ffd166]">
          {v.sub}
        </span>
      )}
    </button>
  );
}

/**
 * Portrait control deck: joystick in the middle, one big button in each corner,
 * optional mini Item / Relic buttons on the sides. Lives BELOW the game view, never over it.
 */
export function MobileControls({ hud, tuning, onDirectionChange, onAction, onAnyTouch }: MobileControlsProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const stickPointerIdRef = useRef<number | null>(null);
  const lastDirsRef = useRef<TouchDirectionalState>(NO_DIRS);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [dirs, setDirs] = useState<TouchDirectionalState>(NO_DIRS);
  const haptics = tuning.mobileHaptics !== false;

  const updateStick = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const r = rect.width * 0.38;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > r) {
        dx = (dx / d) * r;
        dy = (dy / d) * r;
      }
      setKnob({ x: dx, y: dy });
      // Crisp 8-way: walk left/right, down = crouch / drop-through, up = aim / climb.
      const next: TouchDirectionalState = {
        left: dx < -r * 0.28,
        right: dx > r * 0.28,
        up: dy < -r * 0.5,
        down: dy > r * 0.42,
      };
      const prev = lastDirsRef.current;
      if (next.left !== prev.left || next.right !== prev.right || next.up !== prev.up || next.down !== prev.down) {
        if ((next.down && !prev.down) || (next.up && !prev.up)) vibrate(haptics, 6);
        lastDirsRef.current = next;
        setDirs(next);
        onDirectionChange(next);
      }
    },
    [haptics, onDirectionChange]
  );

  const resetStick = useCallback(() => {
    stickPointerIdRef.current = null;
    setKnob({ x: 0, y: 0 });
    lastDirsRef.current = NO_DIRS;
    setDirs(NO_DIRS);
    onDirectionChange(NO_DIRS);
  }, [onDirectionChange]);

  const tl = mobileActionAt(tuning.mobileBtnTopLeft);
  const tr = mobileActionAt(tuning.mobileBtnTopRight);
  const bl = mobileActionAt(tuning.mobileBtnBottomLeft);
  const br = mobileActionAt(tuning.mobileBtnBottomRight);
  const pad = 12;
  const common = { hud, haptics, onAction, onAnyTouch };

  const arrow = (on: boolean) => (on ? '#ffd166' : '#4a5270');

  return (
    <section
      aria-label="Touch controls"
      data-mobile-deck
      className="relative w-full shrink-0 select-none touch-none overflow-hidden"
      style={{
        height: `calc(${Math.max(20, Math.min(50, tuning.mobileDeckPct || 35))}dvh + env(safe-area-inset-bottom, 0px))`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background:
          'radial-gradient(ellipse at 50% 45%, rgba(120,24,38,0.16) 0%, rgba(11,13,19,0) 60%), linear-gradient(180deg, #0f111a 0%, #090a10 100%)',
        borderTop: '2px solid #2a2230',
        boxShadow: 'inset 0 1px 0 rgba(229,169,60,0.18)',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Gothic filigree line */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1 h-px w-2/3"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(229,169,60,0.35), transparent)' }}
      />

      <div className="absolute inset-0" style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <DeckButton action={tl} style={{ top: pad, left: pad }} {...common} />
        <DeckButton action={tr} style={{ top: pad, right: pad }} {...common} />
        <DeckButton action={bl} style={{ bottom: pad, left: pad }} big={bl === 'jump'} {...common} />
        <DeckButton action={br} style={{ bottom: pad, right: pad }} big {...common} />

        {tuning.mobileMiniButtons !== false && (
          <>
            <DeckButton action="item" mini style={{ top: '50%', left: pad + 16, marginTop: -25 }} {...common} />
            <DeckButton action="special" mini style={{ top: '50%', right: pad + 16, marginTop: -25 }} {...common} />
          </>
        )}

        {/* Joystick touch zone: the whole middle column (generous for thumbs) */}
        <div
          ref={zoneRef}
          role="application"
          aria-label="Movement joystick"
          data-mobile-stick
          className="absolute top-0 bottom-0 flex items-center justify-center touch-none"
          style={{ left: 104, right: 104 }}
          onPointerDown={(e) => {
            e.preventDefault();
            onAnyTouch?.();
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // synthetic
            }
            stickPointerIdRef.current = e.pointerId;
            updateStick(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (stickPointerIdRef.current !== e.pointerId) return;
            updateStick(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            if (stickPointerIdRef.current === e.pointerId) resetStick();
          }}
          onPointerCancel={(e) => {
            if (stickPointerIdRef.current === e.pointerId) resetStick();
          }}
        >
          <div
            ref={baseRef}
            className="pointer-events-none relative rounded-full flex items-center justify-center"
            style={{
              width: 'min(150px, 100%, 21dvh)',
              aspectRatio: '1 / 1',
              background: 'radial-gradient(circle at 50% 45%, #171b29 0%, #0b0d14 70%)',
              border: '2px solid #3a3346',
              boxShadow: 'inset 0 0 26px rgba(0,0,0,0.85), 0 0 0 5px rgba(20,16,26,0.9), 0 0 18px rgba(120,24,38,0.25)',
            }}
          >
            <div className="absolute inset-3 rounded-full border border-[#2a2536]" />
            <span className="absolute top-1.5 text-[11px]" style={{ color: arrow(dirs.up) }}>▲</span>
            <span className="absolute bottom-1.5 text-[11px]" style={{ color: arrow(dirs.down) }}>▼</span>
            <span className="absolute left-2 text-[11px]" style={{ color: arrow(dirs.left) }}>◀</span>
            <span className="absolute right-2 text-[11px]" style={{ color: arrow(dirs.right) }}>▶</span>
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: '40%',
                aspectRatio: '1 / 1',
                transform: `translate(${knob.x}px, ${knob.y}px)`,
                background: 'radial-gradient(circle at 40% 35%, #3a3346, #15121d 75%)',
                border: '2px solid rgba(229,169,60,0.8)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.7)',
              }}
            >
              <div className="w-1/3 h-1/3 rounded-full border border-[#e5a93c]/60 bg-[#e5a93c]/20" />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[8.5px] font-mono tracking-[0.18em] text-[#5d5568] uppercase whitespace-nowrap">
          {tuning.mobileAutoAttack !== false ? 'Auto-attack on' : 'Auto-attack off'}
          {hud.isHidden ? ' · hidden' : ''}
        </div>
      </div>
    </section>
  );
}

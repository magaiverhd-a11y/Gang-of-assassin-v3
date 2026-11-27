import { useRef, useState } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { ABILITIES, CHARACTERS, ITEMS, WEAPONS } from '../game/defaults';
import { HudSnapshot } from '../game/types';
import { AbilityIcon, ItemIcon, WeaponSkillIcon } from './GameIcons';

export interface TouchDirectionalState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

interface MobileControlsProps {
  hud: HudSnapshot;
  onDirectionChange: (dirs: TouchDirectionalState) => void;
  onJumpDown: () => void;
  onJumpUp: () => void;
  onSkillPress: () => void;
  onSpellPress: () => void;
  onItemPress: () => void;
}

export function MobileControls({
  hud,
  onDirectionChange,
  onJumpDown,
  onJumpUp,
  onSkillPress,
  onSpellPress,
  onItemPress,
}: MobileControlsProps) {
  const stickRef = useRef<HTMLDivElement | null>(null);
  const stickPointerIdRef = useRef<number | null>(null);
  const jumpPointerIdRef = useRef<number | null>(null);

  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDirs, setActiveDirs] = useState<TouchDirectionalState>({
    left: false,
    right: false,
    up: false,
    down: false,
  });
  const [jumpHeld, setJumpHeld] = useState(false);

  const spellId = hud.abilitySlots[0];
  const spellDef = ABILITIES[spellId];
  const spellCd = hud.abilityCooldowns[spellId];
  const spellNoMp = hud.mp < spellDef.manaCost;
  const spellReady = spellCd <= 0 && !spellNoMp;

  const itemId = hud.itemSlots[0];
  const itemDef = ITEMS[itemId];
  const itemCount = hud.itemCounts[itemId];

  const activeWeapon = WEAPONS[hud.weapon];
  const skillReady = hud.weaponSkillCooldown <= 0;
  const tagPartnerDef = hud.tagPartner ? CHARACTERS[hud.tagPartner] : null;
  const tagReady = Boolean(tagPartnerDef && hud.tagPartnerCooldown <= 0);

  const updateStickFromClient = (clientX: number, clientY: number) => {
    const el = stickRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxRadius = rect.width * 0.36;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobOffset({ x: dx, y: dy });

    // Responsive 8-way deadzone: crisp left/right walk, down crouch, diagonal crouch-walk & aim
    const deadzone = 13;
    const nextDirs: TouchDirectionalState = {
      left: dx < -deadzone,
      right: dx > deadzone,
      up: dy < -deadzone * 1.15,
      down: dy > deadzone * 1.05,
    };
    setActiveDirs(nextDirs);
    onDirectionChange(nextDirs);
  };

  const resetStick = () => {
    stickPointerIdRef.current = null;
    setKnobOffset({ x: 0, y: 0 });
    const cleared: TouchDirectionalState = {
      left: false,
      right: false,
      up: false,
      down: false,
    };
    setActiveDirs(cleared);
    onDirectionChange(cleared);
  };

  return (
    <section
      aria-label="Mobile touch controls"
      className="relative w-full shrink-0 bg-[#0b0e16] border-t-2 border-[#252c40] select-none touch-none overflow-hidden"
      style={{
        height: 'clamp(210px, 34dvh, 276px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Subtle gothic background radial glow centered behind thumbstick */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(229, 169, 60, 0.08) 0%, rgba(11, 14, 22, 0.96) 66%)',
        }}
      />

      {/* TOP-LEFT CORNER: SPELL [4] */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onSpellPress();
        }}
        className={`absolute top-3 left-3 w-[74px] h-[74px] flex flex-col items-center justify-center gap-0.5 border-2 active:scale-95 transition-transform ${
          spellReady
            ? 'bg-[#131d33] border-[#3b82f6] text-[#e0f2fe] shadow-[0_0_14px_rgba(59,130,246,0.28)]'
            : 'bg-[#0e121e] border-[#263047] text-[#6d7894] opacity-75'
        }`}
        aria-label={`Cast ${spellDef.shortName}`}
      >
        <AbilityIcon id={spellId} className="w-6 h-6" />
        <span className="text-[10px] font-bold tracking-wider uppercase leading-none truncate max-w-[66px]">
          {spellDef.shortName}
        </span>
        <span className="font-mono text-[9px] leading-none text-[#93c5fd]">
          {spellCd > 0 ? `${spellCd.toFixed(1)}s` : `${spellDef.manaCost} MP`}
        </span>
      </button>

      {/* BOTTOM-LEFT CORNER: ITEM [5] */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onItemPress();
        }}
        className={`absolute bottom-3 left-3 w-[74px] h-[74px] flex flex-col items-center justify-center gap-0.5 border-2 active:scale-95 transition-transform ${
          itemCount > 0
            ? 'bg-[#1a1522] border-[#c82333] text-[#fde8ea] shadow-[0_0_12px_rgba(200,35,51,0.25)]'
            : 'bg-[#0e121e] border-[#252b3d] text-[#687089] opacity-65'
        }`}
        aria-label={`Use ${itemDef.shortName}`}
      >
        <ItemIcon id={itemId} className="w-6 h-6" />
        <span className="text-[10px] font-bold tracking-wider uppercase leading-none truncate max-w-[66px]">
          {itemDef.shortName}
        </span>
        <span className="font-mono text-[10px] font-bold leading-none text-[#ffd166]">
          x{itemCount}
        </span>
      </button>

      {/* TOP-RIGHT CORNER: WEAPON SKILL [3] (+ Auto Tag Partner) */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onSkillPress();
        }}
        className={`absolute top-3 right-3 w-[74px] h-[74px] flex flex-col items-center justify-center gap-0.5 border-2 active:scale-95 transition-transform ${
          skillReady
            ? 'bg-[#1d1924] border-[#e5a93c] text-[#fef3c7] shadow-[0_0_14px_rgba(229,169,60,0.3)]'
            : 'bg-[#0e121e] border-[#262d42] text-[#757e96] opacity-75'
        }`}
        aria-label={`Use ${activeWeapon.skillName}`}
      >
        <WeaponSkillIcon id={hud.weapon} className="w-6 h-6" />
        <span className="text-[10px] font-bold tracking-wider uppercase leading-none truncate max-w-[66px]">
          Skill
        </span>
        <span className="font-mono text-[9px] leading-none text-[#fde68a]">
          {skillReady ? (tagReady ? 'TAG RDY' : 'READY') : `${hud.weaponSkillCooldown.toFixed(1)}s`}
        </span>
        {tagPartnerDef && (
          <span
            className="absolute -top-1.5 -left-1.5 px-1 py-0.5 text-[8px] font-mono font-bold border bg-[#0c0f18]"
            style={{
              borderColor: tagReady ? tagPartnerDef.accent : '#334155',
              color: tagReady ? tagPartnerDef.accent : '#64748b',
            }}
          >
            <Sparkles className="w-2.5 h-2.5 inline" />
          </span>
        )}
      </button>

      {/* BOTTOM-RIGHT CORNER: JUMP [2] */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          jumpPointerIdRef.current = e.pointerId;
          setJumpHeld(true);
          onJumpDown();
        }}
        onPointerUp={(e) => {
          if (jumpPointerIdRef.current === e.pointerId) {
            jumpPointerIdRef.current = null;
            setJumpHeld(false);
            onJumpUp();
          }
        }}
        onPointerCancel={(e) => {
          if (jumpPointerIdRef.current === e.pointerId) {
            jumpPointerIdRef.current = null;
            setJumpHeld(false);
            onJumpUp();
          }
        }}
        className={`absolute bottom-3 right-3 w-[78px] h-[78px] flex flex-col items-center justify-center gap-0.5 border-2 transition-transform ${
          jumpHeld
            ? 'scale-95 bg-[#3d1722] border-[#ff6b8b] text-white shadow-[0_0_18px_rgba(244,63,94,0.45)]'
            : 'bg-[#26131c] border-[#d94660] text-[#ffe4e6] shadow-[0_0_14px_rgba(217,70,96,0.28)]'
        }`}
        aria-label="Jump"
      >
        <ArrowUp className="w-7 h-7 stroke-[2.5]" />
        <span
          className="text-[11px] font-bold tracking-widest uppercase leading-none"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          JUMP
        </span>
      </button>

      {/* EXACT CENTER (MID): 8-WAY VIRTUAL THUMBSTICK / MOVEMENT CONTROL */}
      <div
        ref={stickRef}
        role="application"
        aria-label="Movement thumbstick"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          stickPointerIdRef.current = e.pointerId;
          updateStickFromClient(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (stickPointerIdRef.current !== e.pointerId) return;
          e.preventDefault();
          updateStickFromClient(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (stickPointerIdRef.current === e.pointerId) {
            resetStick();
          }
        }}
        onPointerCancel={(e) => {
          if (stickPointerIdRef.current === e.pointerId) {
            resetStick();
          }
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[138px] h-[138px] rounded-full bg-[#111522] border-2 border-[#3a435e] shadow-[inset_0_0_24px_rgba(0,0,0,0.75)] flex items-center justify-center touch-none"
      >
        {/* Inner engraved compass ring */}
        <div className="pointer-events-none absolute inset-3 rounded-full border border-[#252d42]" />

        {/* Directional active indicators */}
        <span
          className={`pointer-events-none absolute top-2.5 text-[10px] font-mono font-bold transition-colors ${
            activeDirs.up ? 'text-[#ffd166]' : 'text-[#4f5873]'
          }`}
        >
          ▲
        </span>
        <span
          className={`pointer-events-none absolute bottom-2 text-[10px] font-mono font-bold transition-colors ${
            activeDirs.down ? 'text-[#ffd166]' : 'text-[#4f5873]'
          }`}
        >
          ▼
        </span>
        <span
          className={`pointer-events-none absolute left-2.5 text-[10px] font-mono font-bold transition-colors ${
            activeDirs.left ? 'text-[#ffd166]' : 'text-[#4f5873]'
          }`}
        >
          ◀
        </span>
        <span
          className={`pointer-events-none absolute right-2.5 text-[10px] font-mono font-bold transition-colors ${
            activeDirs.right ? 'text-[#ffd166]' : 'text-[#4f5873]'
          }`}
        >
          ▶
        </span>

        {/* Floating Thumb Knob */}
        <div
          className="pointer-events-none w-14 h-14 rounded-full bg-gradient-to-b from-[#2b334a] to-[#171c2b] border-2 border-[#e5a93c]/85 shadow-[0_4px_14px_rgba(0,0,0,0.65)] flex items-center justify-center"
          style={{
            transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
          }}
        >
          <div className="w-5 h-5 rounded-full border border-[#e5a93c]/60 bg-[#e5a93c]/20" />
        </div>
      </div>

      {/* Subtle bottom-center Auto-Attack indicator caption */}
      <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono tracking-wider text-[#6e7791] uppercase whitespace-nowrap">
        Auto-Attack On · Parry Active
      </div>
    </section>
  );
}

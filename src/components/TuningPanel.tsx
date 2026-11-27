import React, { useState } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import { TuningConfig } from '../game/types';

interface TuningPanelProps {
  tuning: TuningConfig;
  onChange: <K extends keyof TuningConfig>(key: K, value: TuningConfig[K]) => void;
  onResetDefaults: () => void;
}

interface HoverInfo {
  title: string;
  description: string;
}

interface SliderRowProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
  onHover: (info: HoverInfo | null) => void;
}

function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  display,
  onChange,
  onHover,
}: SliderRowProps) {
  return (
    <div
      className="space-y-1.5 -mx-2 px-2 py-1 rounded hover:bg-[#171b27] transition-colors"
      onMouseEnter={() => onHover({ title: label, description })}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-[#c5cbd9]">{label}</span>
        <span className="font-mono tabular-nums text-[#e8e4dc]">{display}</span>
      </div>
      <input
        type="range"
        className="tune-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={(e) => (e.currentTarget as HTMLInputElement).blur()}
        onKeyUp={(e) => (e.currentTarget as HTMLInputElement).blur()}
      />
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onHover: (info: HoverInfo | null) => void;
}

function ToggleRow({ label, description, checked, onChange, onHover }: ToggleRowProps) {
  return (
    <button
      type="button"
      onMouseEnter={() => onHover({ title: label, description })}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        onChange(!checked);
        (e.currentTarget as HTMLButtonElement).blur();
      }}
      className="w-full flex items-center justify-between gap-3 -mx-2 px-2 py-1.5 text-left rounded hover:bg-[#171b27] transition-colors group focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#c82333]"
    >
      <span className="text-xs font-medium text-[#e8e4dc] group-hover:text-white transition-colors">
        {label}
      </span>
      <span
        className={`shrink-0 w-9 h-5 rounded-sm border transition-colors flex items-center px-0.5 ${
          checked
            ? 'bg-[#c82333] border-[#e03e4e]'
            : 'bg-[#1a1e2b] border-[#2c3347]'
        }`}
        aria-hidden="true"
      >
        <span
          className={`w-3.5 h-3.5 rounded-[1px] bg-[#f4f1ea] transition-transform duration-150 ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
}

export const TuningPanel: React.FC<TuningPanelProps> = ({
  tuning,
  onChange,
  onResetDefaults,
}) => {
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  const offsetLabel =
    tuning.cameraOffsetY < 0
      ? `${Math.round(tuning.cameraOffsetY)} px (Higher)`
      : tuning.cameraOffsetY > 0
      ? `+${Math.round(tuning.cameraOffsetY)} px (Lower)`
      : '0 px (Center)';

  return (
    <aside
      aria-label="Game Tuning Controls"
      className="w-80 shrink-0 h-full bg-[#10131c] border-l border-[#222736] flex flex-col select-none"
    >
      <div className="px-4 py-3 border-b border-[#222736] flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#e8e4dc] tracking-wide">
          Tuning
        </h2>
        <button
          type="button"
          onClick={(e) => {
            onResetDefaults();
            (e.currentTarget as HTMLButtonElement).blur();
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#b6bccf] hover:text-white bg-[#191d2b] hover:bg-[#23293b] border border-[#2a3145] rounded transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      {/* Scrollable Tuning Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Section 1: Scale & Zoom */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#e5a93c] tracking-wide">
            Zoom & Scale
          </h3>
          <SliderRow
            label="Game Zoom"
            description="Controls how close or wide the camera views the castle. Lower values show more of the grand map at once."
            value={tuning.zoom}
            min={0.6}
            max={2.2}
            step={0.05}
            display={`${tuning.zoom.toFixed(2)}x`}
            onChange={(v) => onChange('zoom', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Character Size"
            description="Scales the player's sprite, collision hitbox, and weapon reach proportionally."
            value={tuning.playerScale}
            min={0.6}
            max={1.8}
            step={0.05}
            display={`${tuning.playerScale.toFixed(2)}x`}
            onChange={(v) => onChange('playerScale', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Enemy Size"
            description="Scales all 5 enemy types and their hitboxes simultaneously."
            value={tuning.enemyScale}
            min={0.6}
            max={1.8}
            step={0.05}
            display={`${tuning.enemyScale.toFixed(2)}x`}
            onChange={(v) => onChange('enemyScale', v)}
            onHover={setHovered}
          />
        </section>

        <div className="border-t border-[#1e2331]" />

        {/* Section 2: Dynamic Camera */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#e5a93c] tracking-wide">
            Dynamic Camera
          </h3>
          <SliderRow
            label="Camera Height Offset"
            description="Shifts the camera vertically relative to the player. Negative values raise the camera so the player sits lower on screen and reveals more of the tall castle above."
            value={tuning.cameraOffsetY}
            min={-260}
            max={80}
            step={5}
            display={offsetLabel}
            onChange={(v) => onChange('cameraOffsetY', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Horizontal Deadzone"
            description="How far left or right the player can move before the camera starts scrolling. Larger values minimize camera motion."
            value={tuning.cameraDeadzoneX}
            min={0}
            max={220}
            step={5}
            display={`${Math.round(tuning.cameraDeadzoneX)} px`}
            onChange={(v) => onChange('cameraDeadzoneX', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Vertical Deadzone"
            description="Vertical buffer before the camera shifts upward or downward. Keeps normal jumps steady without screen bobbing."
            value={tuning.cameraDeadzoneY}
            min={0}
            max={180}
            step={5}
            display={`${Math.round(tuning.cameraDeadzoneY)} px`}
            onChange={(v) => onChange('cameraDeadzoneY', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Camera Smoothing"
            description="How quickly the camera catches up once the player pushes past the deadzone. Higher values track more tightly."
            value={tuning.cameraSmoothing}
            min={0.04}
            max={0.5}
            step={0.02}
            display={`${tuning.cameraSmoothing.toFixed(2)}`}
            onChange={(v) => onChange('cameraSmoothing', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Crit Shake Intensity"
            description="Strength of the screen shake triggered on Critical hits and Backstab Assassinations."
            value={tuning.critShakeIntensity}
            min={0}
            max={24}
            step={1}
            display={`${Math.round(tuning.critShakeIntensity)} px`}
            onChange={(v) => onChange('critShakeIntensity', v)}
            onHover={setHovered}
          />
          <ToggleRow
            label="Show Deadzone Guide"
            description="Draws a dashed amber frame showing the minimal-motion camera deadzone window in real time."
            checked={tuning.showCameraGuide}
            onChange={(v) => onChange('showCameraGuide', v)}
            onHover={setHovered}
          />
        </section>

        <div className="border-t border-[#1e2331]" />

        {/* Section 3: Movement & Platform Forgiveness */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#e5a93c] tracking-wide">
            Movement & Forgiveness
          </h3>
          <SliderRow
            label="Move Speed"
            description="Horizontal walking speed when pressing A or D."
            value={tuning.moveSpeed}
            min={120}
            max={420}
            step={5}
            display={`${Math.round(tuning.moveSpeed)} px/s`}
            onChange={(v) => onChange('moveSpeed', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Jump Force"
            description="Initial upward launch strength when pressing Jump (key 2). Higher values let you reach taller ledges."
            value={tuning.jumpForce}
            min={360}
            max={780}
            step={10}
            display={`${Math.round(tuning.jumpForce)}`}
            onChange={(v) => onChange('jumpForce', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Gravity"
            description="Downward pull on the player and enemies. Higher gravity creates heavier, snappier jump arcs."
            value={tuning.gravity}
            min={700}
            max={2200}
            step={20}
            display={`${Math.round(tuning.gravity)}`}
            onChange={(v) => onChange('gravity', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Coyote Time"
            description="Platform forgiveness: brief grace window after walking off a ledge where pressing Jump (2) still succeeds."
            value={tuning.coyoteTimeMs}
            min={0}
            max={250}
            step={5}
            display={`${Math.round(tuning.coyoteTimeMs)} ms`}
            onChange={(v) => onChange('coyoteTimeMs', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Jump Buffer"
            description="Platform forgiveness: pressing Jump (2) slightly before landing automatically triggers a jump the moment you touch ground."
            value={tuning.jumpBufferMs}
            min={0}
            max={250}
            step={5}
            display={`${Math.round(tuning.jumpBufferMs)} ms`}
            onChange={(v) => onChange('jumpBufferMs', v)}
            onHover={setHovered}
          />
        </section>

        <div className="border-t border-[#1e2331]" />

        {/* Section 3b: Air Control */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#e5a93c] tracking-wide">
            Air Control
          </h3>
          <SliderRow
            label="Air Steering"
            description="How strongly A/D steers you in mid-air. 0% locks your jump arc like classic Castlevania I; 100% gives instant mid-air control."
            value={tuning.airControl}
            min={0}
            max={100}
            step={5}
            display={`${Math.round(tuning.airControl)}%`}
            onChange={(v) => onChange('airControl', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Air Max Speed"
            description="Horizontal speed multiplier while airborne relative to your ground walking speed."
            value={tuning.airMaxSpeedMult}
            min={0.5}
            max={1.4}
            step={0.05}
            display={`${tuning.airMaxSpeedMult.toFixed(2)}x`}
            onChange={(v) => onChange('airMaxSpeedMult', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Air Drag (Brake)"
            description="How quickly you slow down horizontally when releasing A/D mid-jump. 0% preserves full momentum glide; 100% stops immediately."
            value={tuning.airDrag}
            min={0}
            max={100}
            step={5}
            display={`${Math.round(tuning.airDrag)}%`}
            onChange={(v) => onChange('airDrag', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Extra Air Jumps"
            description="Number of additional jumps allowed in mid-air before touching the ground (0 = classic single jump, 1 = double jump, 2 = triple jump)."
            value={tuning.airJumps}
            min={0}
            max={2}
            step={1}
            display={
              tuning.airJumps === 0
                ? '0 (Single)'
                : tuning.airJumps === 1
                ? '1 (Double)'
                : '2 (Triple)'
            }
            onChange={(v) => onChange('airJumps', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Short-Hop Cut"
            description="Upward velocity multiplier when releasing Jump (2) early. Lower values create crisp short hops; 1.00x forces fixed full-height jumps."
            value={tuning.jumpCutMultiplier}
            min={0.25}
            max={1.0}
            step={0.05}
            display={
              tuning.jumpCutMultiplier >= 0.99
                ? '1.00x (Fixed)'
                : `${tuning.jumpCutMultiplier.toFixed(2)}x`
            }
            onChange={(v) => onChange('jumpCutMultiplier', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Apex Hang Gravity"
            description="Reduces gravity near the top peak of your jump for extra hang time and precision when landing or whipping airborne foes."
            value={tuning.apexHangGravityMult}
            min={0.4}
            max={1.0}
            step={0.04}
            display={`${tuning.apexHangGravityMult.toFixed(2)}x`}
            onChange={(v) => onChange('apexHangGravityMult', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Fall Gravity Boost"
            description="Increases gravity while descending so landings feel weighty and snappy instead of floaty."
            value={tuning.fallGravityMult}
            min={0.8}
            max={2.2}
            step={0.05}
            display={`${tuning.fallGravityMult.toFixed(2)}x`}
            onChange={(v) => onChange('fallGravityMult', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Max Fall Speed"
            description="Caps terminal falling speed during long drops from high castle rafters."
            value={tuning.maxFallSpeed}
            min={400}
            max={1200}
            step={20}
            display={`${Math.round(tuning.maxFallSpeed)} px/s`}
            onChange={(v) => onChange('maxFallSpeed', v)}
            onHover={setHovered}
          />
          <div className="pt-1 space-y-1">
            <ToggleRow
              label="Lock Air Direction on Attack"
              description="Locks your horizontal direction, velocity, and facing while attacking in mid-air until the swing finishes."
              checked={tuning.lockAirDirectionOnAttack}
              onChange={(v) => onChange('lockAirDirectionOnAttack', v)}
              onHover={setHovered}
            />
            <ToggleRow
              label="Mid-Air Turn Facing"
              description="Allows flipping which direction your character faces in mid-air when pressing A or D. Turn off to stay locked to takeoff facing."
              checked={tuning.airTurnFacing}
              onChange={(v) => onChange('airTurnFacing', v)}
              onHover={setHovered}
            />
            <ToggleRow
              label="Allow Air Backdash"
              description="Lets you trigger your Backdash (key 3) once in mid-air for aerial dodging; refreshes on landing or grappling."
              checked={tuning.allowAirBackdash}
              onChange={(v) => onChange('allowAirBackdash', v)}
              onHover={setHovered}
            />
          </div>
        </section>

        <div className="border-t border-[#1e2331]" />

        {/* Section 4: Combat */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#e5a93c] tracking-wide">
            Combat & Weapon
          </h3>
          <SliderRow
            label="Attack Startup"
            description="Wind-up delay before the whip strike becomes active. Lower values feel snappier and more responsive."
            value={tuning.attackStartupMs}
            min={15}
            max={200}
            step={5}
            display={`${Math.round(tuning.attackStartupMs)} ms`}
            onChange={(v) => onChange('attackStartupMs', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Attack Active"
            description="How long the extended whip hitbox stays live and able to hit enemies."
            value={tuning.attackActiveMs}
            min={50}
            max={260}
            step={5}
            display={`${Math.round(tuning.attackActiveMs)} ms`}
            onChange={(v) => onChange('attackActiveMs', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Attack Recovery"
            description="Cooldown time after the whip retracts before you can swing again or resume moving if frozen."
            value={tuning.attackRecoveryMs}
            min={30}
            max={300}
            step={5}
            display={`${Math.round(tuning.attackRecoveryMs)} ms`}
            onChange={(v) => onChange('attackRecoveryMs', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Weapon Range"
            description="Horizontal reach of your whip attack in pixels."
            value={tuning.attackRange}
            min={44}
            max={150}
            step={2}
            display={`${Math.round(tuning.attackRange)} px`}
            onChange={(v) => onChange('attackRange', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Weapon Crit Chance"
            description="Percentage chance for your attacks to land a Critical hit with multiplied damage and camera shake. Normal enemies never crit."
            value={tuning.weaponCritChance}
            min={0}
            max={100}
            step={5}
            display={`${Math.round(tuning.weaponCritChance)}%`}
            onChange={(v) => onChange('weaponCritChance', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Crit Multiplier"
            description="Damage multiplier applied whenever your weapon rolls a Critical hit."
            value={tuning.critMultiplier}
            min={2}
            max={5}
            step={1}
            display={`${tuning.critMultiplier}x`}
            onChange={(v) => onChange('critMultiplier', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Hitstop Freeze"
            description="Brief micro-pause on impact when your weapon strikes an enemy to give hits extra weight."
            value={tuning.hitstopMs}
            min={0}
            max={120}
            step={5}
            display={`${Math.round(tuning.hitstopMs)} ms`}
            onChange={(v) => onChange('hitstopMs', v)}
            onHover={setHovered}
          />

          <div className="pt-1 space-y-1">
            <ToggleRow
              label="Jump Lock When Attacking"
              description="Prevents initiating a jump or air jump while your attack swing is active."
              checked={tuning.jumpLockWhenAttacking}
              onChange={(v) => onChange('jumpLockWhenAttacking', v)}
              onHover={setHovered}
            />
            <ToggleRow
              label="Freeze on Attack"
              description="Locks horizontal ground movement while swinging your weapon. Turn off to run and whip freely."
              checked={tuning.freezeOnAttack}
              onChange={(v) => onChange('freezeOnAttack', v)}
              onHover={setHovered}
            />
            <ToggleRow
              label="Backstab Assassination"
              description="Striking an enemy from behind before they spot you triggers an instant lethal assassination on regular foes (bonus damage on Boss)."
              checked={tuning.assassinationEnabled}
              onChange={(v) => onChange('assassinationEnabled', v)}
              onHover={setHovered}
            />
          </div>
        </section>

        <div className="border-t border-[#1e2331]" />

        {/* Section 5: Hit Reaction */}
        <section className="space-y-2 pb-2">
          <h3 className="text-xs font-semibold text-[#e5a93c] tracking-wide">
            Player Hit Reaction
          </h3>
          <SliderRow
            label="Ground Hitstun (Stuck)"
            description="How long the player stays briefly stuck in place when taking damage on the ground."
            value={tuning.playerHitStunMs}
            min={60}
            max={500}
            step={10}
            display={`${Math.round(tuning.playerHitStunMs)} ms`}
            onChange={(v) => onChange('playerHitStunMs', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Air Knockback X"
            description="Horizontal pushback velocity when the player is struck while jumping in mid-air."
            value={tuning.airKnockbackX}
            min={80}
            max={480}
            step={10}
            display={`${Math.round(tuning.airKnockbackX)}`}
            onChange={(v) => onChange('airKnockbackX', v)}
            onHover={setHovered}
          />
          <SliderRow
            label="Air Knockback Y"
            description="Upward pop strength applied alongside backward knockback when struck mid-jump."
            value={tuning.airKnockbackY}
            min={140}
            max={540}
            step={10}
            display={`${Math.round(tuning.airKnockbackY)}`}
            onChange={(v) => onChange('airKnockbackY', v)}
            onHover={setHovered}
          />
        </section>
      </div>

      {/* Pinned Hover Explanation Box (always readable, never clipped by scroll) */}
      <div className="shrink-0 border-t border-[#222736] bg-[#0c0f17] px-4 py-3 min-h-[82px] flex flex-col justify-center">
        {hovered ? (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#e5a93c]">
              {hovered.title}
            </div>
            <p className="text-[11px] leading-relaxed text-[#b6bccf]">
              {hovered.description}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-[11px] text-[#757d94] leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#5c647a]" />
            <span>Hover over any tuning slider or toggle above to read what it changes.</span>
          </div>
        )}
      </div>
    </aside>
  );
};

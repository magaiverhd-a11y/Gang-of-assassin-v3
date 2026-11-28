import { Backpack, Coins, Crown, Map as MapIcon, Shield, Sparkles } from 'lucide-react';
import {
  ABILITIES,
  BOSS_CHARMS,
  CHARM_SYNERGIES,
  getActiveElementDef,
  getEvolutionTierName,
  getSpellCurrentTag,
  getWeaponCurrentTag,
  ITEMS,
  SPECIAL_ITEMS,
  WEAPONS,
} from '../game/defaults';
import { HudSnapshot } from '../game/types';
import {
  AbilityIcon,
  ItemIcon,
  SpecialItemIcon,
  WeaponIcon,
  WeaponSkillIcon,
} from './GameIcons';

const BLOCK_COLUMNS = 6;
const MIN_BLOCK_CAPACITY = 24;

function getBlockCapacity(maxVal: number): number {
  const padded = Math.max(MIN_BLOCK_CAPACITY, maxVal + 6);
  return Math.ceil(padded / BLOCK_COLUMNS) * BLOCK_COLUMNS;
}

interface LeftHudProps {
  hud: HudSnapshot;
  onOpenInventory: () => void;
}

export function LeftHud({ hud, onOpenInventory }: LeftHudProps) {
  const hpCapacity = getBlockCapacity(hud.maxHp);
  const activeWeapon = WEAPONS[hud.weapon];
  const weaponLevel = 1 + hud.weaponDamageBonus;
  const weaponTag = getWeaponCurrentTag(weaponLevel);

  return (
    <aside
      aria-label="Health and items"
      className="w-[228px] shrink-0 h-full bg-[#0c0f17] border-r border-[#232839] flex flex-col justify-between p-3.5 gap-3.5 overflow-y-auto select-none"
    >
      <div className="space-y-4">
        {/* HEALTH BLOCK METER (with reserved sockets for extra HP blocks) */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span
              className="text-xs font-bold tracking-widest text-[#f3efe6]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HEALTH
            </span>
            <div className="flex items-center gap-2">
              {hud.hpRegenLevel > 0 && (
                <span
                  className="font-mono text-[10px] text-[#f87171]"
                  title="HP restored upon entering each raid room"
                >
                  +{hud.hpRegenLevel}/rm
                </span>
              )}
              <span className="font-mono tabular-nums text-xs font-semibold text-[#f3efe6]">
                {hud.hp}
                <span className="text-[#687089]">/{hud.maxHp}</span>
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-6 gap-1.5 p-2 bg-[#090b11] border border-[#242a3d]"
            role="progressbar"
            aria-valuenow={hud.hp}
            aria-valuemin={0}
            aria-valuemax={hud.maxHp}
            aria-label="Player health blocks"
          >
            {Array.from({ length: hpCapacity }).map((_, idx) => {
              const filled = idx < hud.hp;
              const unlocked = idx < hud.maxHp;
              return (
                <div
                  key={idx}
                  className={`h-3.5 transition-all duration-150 ${
                    filled
                      ? 'bg-[#c82333] border border-[#f87171]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]'
                      : unlocked
                        ? 'bg-[#1d1218] border border-[#592330]'
                        : 'bg-[#0e111a] border border-dashed border-[#23293a]/75'
                  }`}
                  title={
                    filled
                      ? `HP Block ${idx + 1}`
                      : unlocked
                        ? `Empty HP Block ${idx + 1}`
                        : 'Reserved space for extra Health upgrade'
                  }
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#6d758c]">
            <span>Max {hud.maxHp} blocks</span>
            <span className="font-mono tabular-nums">
              +{Math.max(0, hpCapacity - hud.maxHp)} upgrade slots
            </span>
          </div>

          {hud.armorShield > 0 && (
            <div className="flex items-center justify-between px-2 py-1.5 bg-[#151a27] border border-[#3a455e] text-[11px]">
              <div className="flex items-center gap-1.5 text-[#cbd5e1]">
                <Shield className="w-3.5 h-3.5 text-[#e2e8f0]" />
                <span>Armor</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: hud.armorShield }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 bg-[#cbd5e1] border border-white/60 inline-block"
                  />
                ))}
                <span className="ml-1 font-mono tabular-nums text-[10px] text-[#9aa2b8]">
                  {hud.armorTimer.toFixed(0)}s
                </span>
              </div>
            </div>
          )}

          {/* Gold & Parry Cooldown Status Strip */}
          <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono">
            <span className="px-2 py-1 bg-[#1e1a0d] border border-[#6e5314] text-[#facc15] inline-flex items-center gap-1">
              <Coins className="w-3 h-3" />
              {hud.gold}g
            </span>
            <span
              className={`px-2 py-1 border ${
                hud.parryCooldown > 0
                  ? 'bg-[#1c1317] border-[#522430] text-[#fca5a5]'
                  : 'bg-[#111b20] border-[#254552] text-[#67e8f9]'
              }`}
            >
              {hud.parryCooldown > 0 ? `Parry ${hud.parryCooldown.toFixed(1)}s` : 'Parry Ready'}
            </span>
          </div>
        </section>

        <div className="h-px bg-[#1f2435]" />

        {/* EQUIPPED ITEM [5] & SPECIAL ITEM [6] */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span
              className="text-xs font-bold tracking-widest text-[#f3efe6]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ITEM &amp; RELIC
            </span>
            <span className="font-mono text-[10px] text-[#7c859e]">5 / 6 use</span>
          </div>

          <div className="space-y-2">
            {/* Single Equipped Item Slot [5] */}
            {(() => {
              const itemId = hud.itemSlots[0];
              const def = ITEMS[itemId];
              const count = hud.itemCounts[itemId];
              return (
                <div
                  className={`p-2 border transition-colors ${
                    count > 0
                      ? 'bg-[#121622] border-[#293045]'
                      : 'bg-[#0e111a] border-[#1f2435]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 flex items-center justify-center border ${
                          count > 0
                            ? 'bg-[#191e2e] border-[#38415c]'
                            : 'bg-[#10131d] border-[#212738] opacity-50'
                        }`}
                      >
                        <ItemIcon id={itemId} className="w-5 h-5" />
                      </div>
                      <span className="absolute -top-1.5 -left-1.5 font-mono text-[9px] font-bold px-1 py-0.2 bg-[#26161c] border border-[#6b2632] text-[#fca5a5] leading-tight">
                        5
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span
                          className={`text-xs font-semibold truncate ${
                            count > 0 ? 'text-[#f3efe6]' : 'text-[#687089]'
                          }`}
                        >
                          {def.shortName}
                        </span>
                        <span className="font-mono tabular-nums text-xs font-bold text-[#e8e4dc]">
                          x{count}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#838ca6] leading-tight line-clamp-2 mt-0.5">
                        {def.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-[#1d2233] text-[9px] font-mono text-[#737c96]">
                    Unslotted pickups auto-use · Swap in Camp [I]
                  </div>
                </div>
              );
            })()}

            {/* Single Equipped Special Item Slot [6] */}
            {(() => {
              const spId = hud.specialItemSlot;
              const def = SPECIAL_ITEMS[spId];
              const count = hud.specialItemCounts[spId] ?? 0;
              const cd = hud.specialItemCooldown;
              const freezeActive = hud.eclipseFreezeTimer > 0;

              return (
                <div
                  className={`p-2 border transition-colors ${
                    freezeActive
                      ? 'bg-[#211333] border-[#c084fc] shadow-[0_0_12px_rgba(192,132,252,0.28)]'
                      : count > 0 && cd <= 0
                        ? 'bg-[#171326] border-[#5b388c]'
                        : 'bg-[#0e111a] border-[#221f33]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 flex items-center justify-center border ${
                          freezeActive
                            ? 'bg-[#2d1647] border-[#e9d5ff]'
                            : count > 0
                              ? 'bg-[#1d1630] border-[#7c3aed]'
                              : 'bg-[#10131d] border-[#26233a] opacity-50'
                        }`}
                      >
                        <SpecialItemIcon id={spId} className="w-5 h-5" />
                      </div>
                      <span className="absolute -top-1.5 -left-1.5 font-mono text-[9px] font-bold px-1 py-0.2 bg-[#2b1542] border border-[#a855f7] text-[#e9d5ff] leading-tight">
                        6
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span
                          className={`text-xs font-semibold truncate ${
                            count > 0 || freezeActive ? 'text-[#f5ecff]' : 'text-[#687089]'
                          }`}
                        >
                          {def.shortName}
                        </span>
                        <span className="font-mono tabular-nums text-[10px] font-bold text-[#d8b4fe] shrink-0">
                          {count}/{def.maxCharges}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[9px] font-mono text-[#a78bfa] uppercase">
                          Special Relic
                        </span>
                        <span
                          className={`font-mono tabular-nums text-[10px] font-semibold ${
                            freezeActive
                              ? 'text-[#fde047] animate-pulse'
                              : cd > 0
                                ? 'text-[#fbbf24]'
                                : count > 0
                                  ? 'text-[#c084fc]'
                                  : 'text-[#687089]'
                          }`}
                        >
                          {freezeActive
                            ? `FROZEN ${hud.eclipseFreezeTimer.toFixed(1)}s`
                            : cd > 0
                              ? `${cd.toFixed(1)}s`
                              : count > 0
                                ? 'READY'
                                : 'EMPTY'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        <div className="h-px bg-[#1f2435]" />

        {/* WEAPON (1) & WEAPON SKILL (3) */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span
              className="text-xs font-bold tracking-widest text-[#f3efe6]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ARMAMENT
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#e5a93c]">
                Lv {weaponLevel}
              </span>
              <span className="font-mono text-[9px] px-1 py-0.5 bg-[#1b1f30] border border-[#3a425e] text-[#fde68a] uppercase">
                {weaponTag}
              </span>
            </div>
          </div>

          <div className="p-2 border bg-[#121622] border-[#293045]">
            {/* Active Weapon Row */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 shrink-0 bg-[#181d2c] border border-[#343d57] flex items-center justify-center">
                <WeaponIcon id={hud.weapon} className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-[#e5a93c]">1</span>
                  <span className="text-xs font-semibold text-[#f3efe6] truncate">
                    {activeWeapon.shortName}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#7c859e]">
                  {hud.characterId === 'minstrel'
                    ? hud.minstrelSlowMo
                      ? 'SLOW-MO: 1 Zip · 2 Vault · 3 Waltz'
                      : 'Dir+1 Whip-Zip · Crouch+1 Lash'
                    : hud.weapon === 'orbiting_grimoire'
                      ? `${(hud.grimoireElement ?? 'fire').toUpperCase()} · ${hud.grimoireOrbs ?? 3}/3 Orbs · [3] Shift`
                    : hud.weapon === 'prism_lance'
                      ? `${hud.bouncesLeft ?? 2}/${hud.maxBounces ?? 2} Bounces · [3] ${Math.min(4, 1 + hud.weaponEvolutionTier)}-Wall Glass`
                    : hud.weapon === 'prism_gauntlets'
                      ? `${hud.bouncesLeft ?? 2}/${hud.maxBounces ?? 2} Pinball Fists · [3] X-Nova Slam`
                    : hud.weapon === 'burst_crossbow'
                      ? '3-Bolt Spread · [3] Vault Volley'
                    : hud.weapon === 'shield_mace'
                      ? 'Frontal Auto-Guard · [3] Shield Bash'
                    : hud.weapon === 'kusarigama'
                      ? 'Chain Yank Pull · [3] 360° Tempest'
                    : hud.weapon === 'twin_chakram'
                      ? 'Looping Blades · [3] Warp / Vortex'
                    : hud.weapon === 'solar_glaive'
                      ? 'Wide Sun Sweep · [3] Spin-Dash'
                    : hud.weapon === 'shadow_daggers'
                      ? '1 Stab · Slash · Cross · Crouch+1 Throw'
                    : hud.weapon === 'ash_wraps'
                      ? '1 Jab · 1 Jab · 1 Palm (chain)'
                      : hud.weapon === 'spire_staff'
                        ? 'Elemental Bolt · every 4th Overcharged'
                    : hud.inCamp
                      ? 'Change in [I] Camp'
                      : 'Equipped Loadout'}
                </div>
              </div>
            </div>

            {/* Key 3 Weapon Skill */}
            <div className="mt-2 pt-2 border-t border-[#1e2436] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 shrink-0 flex items-center justify-center border ${
                    hud.weaponSkillCooldown > 0
                      ? 'bg-[#0f121b] border-[#24293b] opacity-55'
                      : 'bg-[#161e30] border-[#384c73]'
                  }`}
                >
                  <WeaponSkillIcon id={hud.weapon} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#93c5fd]">3</span>
                    <span className="text-[11px] font-medium text-[#e8e4dc] truncate">
                      {activeWeapon.skillName}
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-[#7c859e]">
                    {hud.weaponEvolutionTier >= 1
                      ? `${getEvolutionTierName(hud.weaponEvolutionTier)} Skill`
                      : 'Weapon Skill'}
                  </div>
                </div>
              </div>
              <span className="font-mono tabular-nums text-[10px] text-[#93c5fd] shrink-0">
                {hud.weaponSkillCooldown > 0
                  ? `${hud.weaponSkillCooldown.toFixed(1)}s`
                  : 'READY'}
              </span>
            </div>

            {/* Every-5-Upgrades Weapon Evolution Pip Progress */}
            <div className="mt-2 pt-1.5 border-t border-[#1e2436] space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-[#9aa2b8]">
                  Evo Tier {hud.weaponEvolutionTier} · {getEvolutionTierName(hud.weaponEvolutionTier)}
                </span>
                <span className="text-[#fde68a]">
                  {hud.weaponDamageBonus % 5}/5 → {getEvolutionTierName(hud.weaponEvolutionTier + 1)}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 5 }).map((_, pi) => {
                  const lit = pi < hud.weaponDamageBonus % 5;
                  return (
                    <span
                      key={pi}
                      className={`h-1.5 border ${
                        lit
                          ? 'bg-[#e5a93c] border-[#fde68a]'
                          : 'bg-[#0b0e17] border-[#252c42]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Inventory Button & Control Reference */}
      <div className="space-y-2 pt-2 border-t border-[#1b2030]">
        <button
          type="button"
          onClick={(e) => {
            onOpenInventory();
            (e.currentTarget as HTMLButtonElement).blur();
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 border text-xs transition-colors ${
            hud.inCamp
              ? 'bg-[#1a1f30] hover:bg-[#232a42] border-[#434e70] text-[#f3efe6]'
              : 'bg-[#121622] hover:bg-[#1a1f30] border-[#262d42] text-[#b4bccf]'
          }`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Backpack className="w-3.5 h-3.5 text-[#e5a93c]" />
            <span>{hud.inCamp ? 'Equip Loadout' : 'Inventory'}</span>
          </span>
          <span className="font-mono text-[10px] text-[#e5a93c]">[I]</span>
        </button>

        <div className="text-[10px] font-mono text-[#687089] flex items-center justify-between">
          <span>WASD Crouch-Walk</span>
          <span>2 Jump</span>
          <span>0 Act</span>
        </div>
      </div>
    </aside>
  );
}

interface RightHudProps {
  hud: HudSnapshot;
  onOpenMap: () => void;
}

export function RightHud({ hud, onOpenMap }: RightHudProps) {
  const mpCapacity = getBlockCapacity(hud.maxMp);

  return (
    <aside
      aria-label="Mana and spells"
      className="w-[244px] shrink-0 h-full bg-[#0c0f17] border-l border-[#232839] flex flex-col justify-between p-3.5 gap-3.5 overflow-y-auto select-none"
    >
      <div className="space-y-4">
        {/* MANA BLOCK METER (with reserved sockets for extra MP blocks) */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span
              className="text-xs font-bold tracking-widest text-[#f3efe6]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              MANA
            </span>
            <div className="flex items-center gap-2">
              {hud.mpRegenLevel > 0 && (
                <span
                  className="font-mono text-[10px] text-[#93c5fd]"
                  title="MP restored upon entering each raid room"
                >
                  +{hud.mpRegenLevel}/rm
                </span>
              )}
              <span className="font-mono tabular-nums text-xs font-semibold text-[#93c5fd]">
                {hud.mp}
                <span className="text-[#687089]">/{hud.maxMp}</span>
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-6 gap-1.5 p-2 bg-[#090b11] border border-[#242a3d]"
            role="progressbar"
            aria-valuenow={hud.mp}
            aria-valuemin={0}
            aria-valuemax={hud.maxMp}
            aria-label="Player mana blocks"
          >
            {Array.from({ length: mpCapacity }).map((_, idx) => {
              const filled = idx < hud.mp;
              const unlocked = idx < hud.maxMp;
              return (
                <div
                  key={idx}
                  className={`h-3.5 transition-all duration-150 ${
                    filled
                      ? 'bg-[#2563eb] border border-[#60a5fa]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]'
                      : unlocked
                        ? 'bg-[#10182b] border border-[#243d6b]'
                        : 'bg-[#0e111a] border border-dashed border-[#23293a]/75'
                  }`}
                  title={
                    filled
                      ? `MP Block ${idx + 1}`
                      : unlocked
                        ? `Empty MP Block ${idx + 1}`
                        : 'Reserved space for extra Mana upgrade'
                  }
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#6d758c]">
            <span>Max {hud.maxMp} blocks</span>
            <span className="font-mono tabular-nums">
              +{Math.max(0, mpCapacity - hud.maxMp)} upgrade slots
            </span>
          </div>

          {hud.fireWeaponTimer > 0 && (
            <div className="flex items-center justify-between px-2 py-1.5 bg-[#23170d] border border-[#7c4316] text-[11px]">
              <div className="flex items-center gap-1.5 text-[#fdba74]">
                <AbilityIcon id="fire_weapon" className="w-3.5 h-3.5" />
                <span>Fire Weapon</span>
              </div>
              <span className="font-mono tabular-nums text-[10px] text-[#fde68a]">
                {hud.fireWeaponTimer.toFixed(1)}s
              </span>
            </div>
          )}
        </section>

        <div className="h-px bg-[#1f2435]" />

        {/* SINGLE EQUIPPED SPELL SLOT (Key 4 — equip learned spells in Base Camp Inventory [I]) */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span
              className="text-xs font-bold tracking-widest text-[#f3efe6]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              SPELL
            </span>
            <span className="font-mono tabular-nums text-[10px] text-[#9aa2b8]">
              {hud.unlockedAbilities.length}/5 learned
            </span>
          </div>

          {(() => {
            const abilityId = hud.abilitySlots[0];
            const def = ABILITIES[abilityId];
            const slotLv = hud.abilitySlotLevels[0];
            const slotTag = getSpellCurrentTag(slotLv);
            const cd = hud.abilityCooldowns[abilityId];
            const cdPct = def.cooldown > 0 ? Math.min(100, (cd / def.cooldown) * 100) : 0;
            const notEnoughMp = hud.mp < def.manaCost;

            return (
              <div
                className={`p-3 border transition-colors ${
                  cd > 0 || notEnoughMp
                    ? 'bg-[#0f131e] border-[#23293c]'
                    : 'bg-[#131826] border-[#2e3750]'
                }`}
              >
                {/* Top Bar: Cast Key 4 + Slot Lv + Milestone Tag */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#172138] border border-[#385791] text-[#93c5fd]">
                      4
                    </span>
                    <span className="font-mono text-[10px] text-[#e5a93c]">
                      Lv {slotLv}
                    </span>
                  </div>

                  <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#191f30] border border-[#303a56] text-[#d6dce8] uppercase">
                    {slotTag}
                  </span>
                </div>

                {/* Active Spell Icon + Cost / Cooldown */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="relative w-12 h-12 shrink-0 flex items-center justify-center border overflow-hidden"
                    style={{
                      borderColor: cd > 0 || notEnoughMp ? '#293045' : def.accent,
                      backgroundColor: '#161b2a',
                    }}
                  >
                    <AbilityIcon
                      id={abilityId}
                      className={`w-7 h-7 transition-opacity ${
                        cd > 0 || notEnoughMp ? 'opacity-40' : 'opacity-100'
                      }`}
                    />
                    {cd > 0 && (
                      <div
                        className="absolute inset-x-0 bottom-0 bg-[#090b11]/75 pointer-events-none"
                        style={{ height: `${cdPct}%` }}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span
                        className={`text-xs font-semibold truncate ${
                          cd > 0 || notEnoughMp ? 'text-[#838ca6]' : 'text-[#f3efe6]'
                        }`}
                      >
                        {def.shortName}
                      </span>
                      <span
                        className={`font-mono tabular-nums text-[10px] font-semibold shrink-0 ${
                          cd > 0
                            ? 'text-[#fbbf24]'
                            : notEnoughMp
                              ? 'text-[#ef4444]'
                              : 'text-[#93c5fd]'
                        }`}
                      >
                        {cd > 0 ? `${cd.toFixed(1)}s` : `${def.manaCost} MP`}
                      </span>
                    </div>

                    {/* Mini Mana Cost Blocks */}
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: def.manaCost }).map((_, mi) => (
                        <span
                          key={mi}
                          className={`w-2.5 h-1.5 inline-block border ${
                            notEnoughMp
                              ? 'bg-[#3b151e] border-[#ef4444]/60'
                              : 'bg-[#3b82f6] border-[#93c5fd]/75'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-[9px] font-mono text-[#7c859e]">
                        {cd > 0 ? 'Cooling' : notEnoughMp ? 'Low MP' : 'Ready'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-[#8b94ad] leading-snug mt-2 pt-2 border-t border-[#1f263a]">
                  {def.description}
                </p>

                {/* Every-5-Upgrades Spell Evolution Pip Progress */}
                <div className="mt-2 pt-1.5 border-t border-[#1f263a] space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className="text-[#9aa2b8]">
                      Spell Evo {hud.spellEvolutionTier} · {getEvolutionTierName(hud.spellEvolutionTier)}
                    </span>
                    <span className="text-[#93c5fd]">
                      {(slotLv - 1) % 5}/5 → {getEvolutionTierName(hud.spellEvolutionTier + 1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 5 }).map((_, pi) => {
                      const lit = pi < (slotLv - 1) % 5;
                      return (
                        <span
                          key={pi}
                          className={`h-1.5 border ${
                            lit
                              ? 'bg-[#38bdf8] border-[#bae6fd]'
                              : 'bg-[#0b0e17] border-[#252c42]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="text-[10px] text-[#6d758c] leading-snug">
            {hud.inCamp
              ? 'Open Inventory [I] in Camp to change your Spell [4] or Item [5].'
              : 'Swap your Spell [4] or Item [5] back in Base Camp [I].'}
          </div>
          {Object.keys(hud.playerStatuses).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['burn', 'BURN', '#fb923c'],
                  ['freeze', 'FREEZE', '#7dd3fc'],
                  ['soaked', 'CHILL', '#38bdf8'],
                  ['stun', 'STUN', '#fde047'],
                  ['poison', 'POISON', '#84cc16'],
                  ['blind', 'BLIND', '#e879f9'],
                ] as const
              ).map(([key, label, color]) => {
                const secs = hud.playerStatuses[key];
                if (!secs || secs <= 0) return null;
                return (
                  <span
                    key={key}
                    className="px-1.5 py-0.5 text-[9px] font-mono border"
                    style={{ color, borderColor: color }}
                    title={`${label} ${secs.toFixed(1)}s`}
                  >
                    {label} {Math.ceil(secs)}s
                  </span>
                );
              })}
            </div>
          )}
        </section>

        <div className="h-px bg-[#1f2435]" />

        {/* LEVEL, XP & ELEMENTAL AFFINITY */}
        {(() => {
          const activeEl = getActiveElementDef(hud.baseElements, hud.combinedElement);
          const nextAffinityLv = Math.ceil((hud.level + 1) / 5) * 5;
          return (
            <section className="p-2.5 border bg-[#101420] border-[#252d44] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#38bdf8] uppercase">
                  Level {hud.level}
                </span>
                <span className="font-mono tabular-nums text-[10px] text-[#9aa2b8]">
                  {hud.xp}/{hud.xpToNext} XP
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#090c14] border border-[#232d45]">
                <div
                  className="h-full bg-gradient-to-r from-[#38bdf8] to-[#c084fc] transition-all duration-150"
                  style={{
                    width: `${Math.min(100, Math.round((hud.xp / Math.max(1, hud.xpToNext)) * 100))}%`,
                  }}
                />
              </div>

              {/* Active Elemental Affinity / Combined Fusion Readout */}
              {activeEl ? (
                <div
                  className="p-2 border bg-[#0c101b] space-y-1"
                  style={{ borderColor: `${activeEl.primaryColor}88` }}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-white/70"
                        style={{
                          background: activeEl.isCombined
                            ? `linear-gradient(135deg, ${activeEl.primaryColor}, ${activeEl.secondaryColor})`
                            : activeEl.primaryColor,
                          boxShadow: `0 0 8px ${activeEl.primaryColor}`,
                        }}
                      />
                      <span
                        className="text-[11px] font-bold truncate"
                        style={{ color: activeEl.primaryColor }}
                      >
                        {activeEl.name}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-[#cbd5e1] shrink-0">
                      {activeEl.isCombined
                        ? `Lv ${hud.affinityLevel}/${hud.affinityMaxLevel}`
                        : hud.affinityLevel > 0
                          ? `Lv ${hud.affinityLevel}/${hud.affinityMaxLevel}`
                          : `Fuse @ Lv ${nextAffinityLv}`}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-[#9aa2b8] leading-snug">
                    {activeEl.shortDesc}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-[#7f88a3] leading-snug">
                  No element yet. Open Element in camp, or wait for the raid choice at level 5 (then every 5 levels).
                </p>
              )}
            </section>
          );
        })()}

        {/* BOSS CHARMS & SYNERGIES + ARTIFACTS SUMMARY */}
        <section className="p-2.5 border bg-[#101420] border-[#252d44] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#fbbf24] uppercase">
              <Crown className="w-3 h-3" />
              <span>Boss Charms</span>
            </span>
            <span className="font-mono tabular-nums text-[10px] text-[#fde68a]">
              {hud.bossCharms.length} · {hud.activeCharmSynergies.length} Syn
            </span>
          </div>
          {hud.bossCharms.length > 0 ? (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {hud.bossCharms.map((cid) => (
                  <span
                    key={cid}
                    className="px-1.5 py-0.5 text-[9px] font-mono border bg-[#151222]"
                    style={{ borderColor: `${BOSS_CHARMS[cid].color}88`, color: BOSS_CHARMS[cid].color }}
                    title={BOSS_CHARMS[cid].effectSummary}
                  >
                    {BOSS_CHARMS[cid].name}
                  </span>
                ))}
              </div>
              {hud.activeCharmSynergies.map((sid) => {
                const syn = CHARM_SYNERGIES.find((item) => item.id === sid);
                if (!syn) return null;
                return (
                  <div key={sid} className="text-[9.5px] leading-snug text-[#e9d5ff]">
                    <strong style={{ color: syn.color }}>{syn.name}:</strong>{' '}
                    {syn.summary}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[9.5px] text-[#7f88a3] leading-snug">
              Slay Raid Final Bosses for signature Charms &amp; Synergies.
            </p>
          )}
          <div className="pt-1.5 border-t border-[#1e2436] flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-[#e5a93c] font-semibold">
              <Sparkles className="w-3 h-3" />
              Artifacts
            </span>
            <span className="font-mono text-[#fde68a]">{hud.ownedArtifacts.length} Bound</span>
          </div>
        </section>
      </div>

      {/* Bottom Map Button & Hotkey Hint */}
      <div className="space-y-2 pt-2 border-t border-[#1b2030]">
        <button
          type="button"
          onClick={(e) => {
            onOpenMap();
            (e.currentTarget as HTMLButtonElement).blur();
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 border bg-[#121622] hover:bg-[#1a1f30] border-[#262d42] text-xs text-[#b4bccf] hover:text-[#f3efe6] transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <MapIcon className="w-3.5 h-3.5 text-[#93c5fd]" />
            <span>Raid Map</span>
          </span>
          <span className="font-mono text-[10px] text-[#93c5fd]">[M]</span>
        </button>

        <div className="text-[10px] font-mono text-[#687089] flex items-center justify-between">
          <span>4 Spell</span>
          <span>5 Item</span>
          <span>6 Special</span>
        </div>
      </div>
    </aside>
  );
}

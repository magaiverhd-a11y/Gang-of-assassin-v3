import { useEffect, useState } from 'react';
import { BookOpen, Check, Lock, X } from 'lucide-react';
import {
  BOSS_CHARMS,
  CHARM_SYNERGIES,
  getRaidOrderScaling,
  RAID_BOSS_CHARM,
  RAID_ORDER,
  RAIDS,
  STANDARD_RAID_ORDER,
} from '../game/defaults';
import { BASE_ELEMENTS, ELEMENT_MATCHUPS, getEnemyElement } from '../game/elementFusions';
import { LORE_BY_RAID, LORE_FRAGMENTS } from '../game/lore';
import { RAIDS_BY_ID } from '../game/raids';
import { BaseElementId, HudSnapshot, RaidId } from '../game/types';

interface RaidSelectModalProps {
  hud: HudSnapshot;
  onStartRaid: (raidId: RaidId) => void;
  onOpenLore: (raidId: RaidId) => void;
  onClose: () => void;
}

function elementNames(ids: BaseElementId[]): string {
  return ids.map((id) => BASE_ELEMENTS[id].name).join(', ');
}

/** The element this raid's foes share, written out in full. */
function raidElementText(raidId: RaidId): string {
  const el = getEnemyElement('scout', raidId);
  const def = BASE_ELEMENTS[el];
  const match = ELEMENT_MATCHUPS[el];
  return `${def.name}. Weak to ${elementNames(match.weakTo)}. Resists ${elementNames(match.resists)}. Their hits inflict ${match.statusName.toLowerCase()}.`;
}

const RAID_BTN_BG: Record<RaidId, string> = {
  nocturne_castle: '#881337',
  goblin_camp: '#166534',
  weeping_necropolis: '#581c87',
  brimstone_sanctum: '#9a3412',
  mushroom_kingdom: '#065f46',
  sand_fortress: '#92400e',
  alien_ship: '#155e75',
  dragon_crane: '#0f766e',
  dwarven_mines: '#5b21b6',
  cyberpunk_city: '#be185d',
  pirate_armada: '#b45309',
  ghost_paradox: '#4338ca',
  noble_mansion: '#9f1239',
  underwater_city: '#0369a1',
  frost_wardens: '#0284c7',
  barbaric_nation: '#991b1b',
  eclipse_gauntlet: '#9f1239',
};

function RaidEmblem({ id, className = 'w-14 h-14' }: { id: RaidId; className?: string }) {
  switch (id) {
    case 'nocturne_castle':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <circle cx="44" cy="18" r="10" fill="#dc2626" opacity="0.88" />
          <circle cx="48" cy="15" r="8" fill="#151927" />
          <path d="M12 52V28L18 20L24 28V52H12Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M22 52V22L32 10L42 22V52H22Z" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.8" />
          <path d="M40 52V30L46 23L52 30V52H40Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M28 52V40C28 37.8 29.8 36 32 36C34.2 36 36 37.8 36 40V52H28Z" fill="#7f1d1d" />
          <circle cx="32" cy="27" r="3" fill="#f87171" />
        </svg>
      );
    case 'goblin_camp':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M16 50L48 16" stroke="#a16207" strokeWidth="4" strokeLinecap="round" />
          <path d="M48 50L16 16" stroke="#a16207" strokeWidth="4" strokeLinecap="round" />
          <path d="M38 14L53 14L49 27L39 23Z" fill="#94a3b8" stroke="#e2e8f0" strokeWidth="1.5" />
          <path d="M26 14L11 14L15 27L25 23Z" fill="#94a3b8" stroke="#e2e8f0" strokeWidth="1.5" />
          <path d="M22 44C22 36 26.5 31 32 31C37.5 31 42 36 42 44L38 51H26L22 44Z" fill="#15803d" stroke="#86efac" strokeWidth="1.6" />
          <path d="M17 38L23 36L22 42Z" fill="#16a34a" />
          <path d="M47 38L41 36L42 42Z" fill="#16a34a" />
          <circle cx="28.5" cy="40.5" r="2" fill="#fde047" />
          <circle cx="35.5" cy="40.5" r="2" fill="#fde047" />
        </svg>
      );
    case 'weeping_necropolis':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M14 54V28C14 17 22 10 32 10C42 10 50 17 50 28V54" stroke="#2dd4bf" strokeWidth="2.5" opacity="0.45" />
          <path d="M22 33C22 25.5 26.5 21 32 21C37.5 21 42 25.5 42 33C42 37.5 40 40.5 37.5 42V47H26.5V42C24 40.5 22 37.5 22 33Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="1.6" />
          <circle cx="28" cy="33" r="3" fill="#0f172a" />
          <circle cx="36" cy="33" r="3" fill="#0f172a" />
          <circle cx="28" cy="33" r="1.4" fill="#2dd4bf" />
          <circle cx="36" cy="33" r="1.4" fill="#2dd4bf" />
          <path d="M29 44V47M32 44V47M35 44V47" stroke="#0f172a" strokeWidth="1.6" />
          <path d="M18 52H46" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'brimstone_sanctum':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M32 10C37 18 44 21 44 30C44 37 38.5 41 32 41C25.5 41 20 37 20 30C20 23 25 19 27 14C28 18 30 19 32 10Z" fill="#ea580c" stroke="#fdba74" strokeWidth="1.6" />
          <path d="M32 21C35 26 37 28 37 32C37 35 34.8 37.5 32 37.5C29.2 37.5 27 35 27 32C27 28.5 29.5 26 32 21Z" fill="#fef08a" />
          <path d="M12 41H52L46 47H40L44 53H20L24 47H18L12 41Z" fill="#475569" stroke="#94a3b8" strokeWidth="1.6" />
        </svg>
      );
    case 'mushroom_kingdom':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M25 35H39L41 52H23L25 35Z" fill="#fef3c7" stroke="#fde68a" strokeWidth="1.5" />
          <path d="M11 36C11 21 20.5 12 32 12C43.5 12 53 21 53 36H11Z" fill="#c026d3" stroke="#f0abfc" strokeWidth="1.8" />
          <circle cx="24" cy="24" r="4" fill="#fdf4ff" />
          <circle cx="38" cy="21" r="3.2" fill="#fdf4ff" />
          <circle cx="43" cy="30" r="2.8" fill="#fdf4ff" />
          <circle cx="17" cy="14" r="2" fill="#34d399" />
          <circle cx="49" cy="16" r="2.2" fill="#34d399" />
          <circle cx="51" cy="44" r="1.8" fill="#a3e635" />
        </svg>
      );
    case 'sand_fortress':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <circle cx="32" cy="17" r="8" fill="#facc15" />
          <path d="M32 6V8M32 26V28M21 17H23M41 17H43" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 51L28 24H36L54 51H10Z" fill="#b45309" stroke="#fbbf24" strokeWidth="1.8" />
          <path d="M18 42H46M23 34H41" stroke="#78350f" strokeWidth="2" />
          <path d="M28 51V42H36V51H28Z" fill="#451a03" />
        </svg>
      );
    case 'alien_ship':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M24 38L16 54H48L40 38H24Z" fill="#38bdf8" opacity="0.22" />
          <ellipse cx="32" cy="31" rx="22" ry="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <path d="M20 29C20 21 25.5 16 32 16C38.5 16 44 21 44 29" fill="#0e7490" stroke="#7dd3fc" strokeWidth="1.8" />
          <circle cx="21" cy="31" r="2.2" fill="#e879f9" />
          <circle cx="32" cy="33" r="2.4" fill="#38bdf8" />
          <circle cx="43" cy="31" r="2.2" fill="#e879f9" />
        </svg>
      );
    case 'dragon_crane':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M32 34C22 24 14 19 8 22C11 30 18 37 28 39" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
          <path d="M32 34C42 24 50 19 56 22C53 30 46 37 36 39" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
          <path d="M32 13L37 26L32 49L27 26L32 13Z" fill="#f8fafc" stroke="#fbbf24" strokeWidth="1.6" />
          <circle cx="32" cy="26" r="3.5" fill="#fbbf24" />
          <path d="M23 50C28 47 36 47 41 50" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'dwarven_mines':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          {/* Glowing amethyst geode crystal cluster + gilded dwarven pickaxe */}
          <path d="M16 52L22 26L30 52H16Z" fill="#7c3aed" stroke="#d8b4fe" strokeWidth="1.5" />
          <path d="M26 52L34 14L44 52H26Z" fill="#a855f7" stroke="#f5d0fe" strokeWidth="1.8" />
          <path d="M39 52L46 28L52 52H39Z" fill="#6d28d9" stroke="#d8b4fe" strokeWidth="1.5" />
          <path d="M14 28C22 18 40 16 50 24" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M32 20L18 48" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="34" cy="34" r="3" fill="#fef08a" />
        </svg>
      );
    case 'cyberpunk_city':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="12" y="22" width="12" height="32" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.5" />
          <rect x="26" y="10" width="14" height="44" fill="#0f172a" stroke="#ec4899" strokeWidth="1.8" />
          <rect x="42" y="20" width="10" height="34" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.5" />
          <path d="M29 18H37M29 24H37M29 30H37" stroke="#f472b6" strokeWidth="2" />
          <path d="M15 30H21M45 28H49" stroke="#67e8f9" strokeWidth="2" />
          <path d="M8 54H56" stroke="#ec4899" strokeWidth="2" />
        </svg>
      );
    case 'pirate_armada':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M31 12V40" stroke="#d97706" strokeWidth="3" />
          <path d="M33 15C44 19 48 28 33 35Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M29 19C20 22 18 29 29 34Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.3" />
          <path d="M12 40H52L46 51H18L12 40Z" fill="#78350f" stroke="#fbbf24" strokeWidth="1.8" />
          <circle cx="24" cy="45" r="2" fill="#fde047" />
          <circle cx="32" cy="45" r="2" fill="#fde047" />
          <circle cx="40" cy="45" r="2" fill="#fde047" />
        </svg>
      );
    case 'ghost_paradox':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <rect x="18" y="12" width="28" height="40" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <path d="M24 22L40 22L24 42L40 42" stroke="#2dd4bf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="32" r="5" fill="#c4b5fd" />
          <path d="M12 20L18 24M46 40L52 44M52 20L46 24M12 44L18 40" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'noble_mansion':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M12 26L32 12L52 26V52H12V26Z" fill="#3b1024" stroke="#fbbf24" strokeWidth="1.8" />
          <path d="M26 52V36C26 32.5 28.8 30 32 30C35.2 30 38 32.5 38 36V52H26Z" fill="#be123c" stroke="#fde68a" strokeWidth="1.5" />
          <circle cx="20" cy="36" r="3" fill="#fbbf24" />
          <circle cx="44" cy="36" r="3" fill="#fbbf24" />
          <path d="M24 21L32 16L40 21" stroke="#fde68a" strokeWidth="1.8" />
        </svg>
      );
    case 'underwater_city':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M12 44C12 26 21 16 32 16C43 16 52 26 52 44H12Z" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
          <path d="M32 22V42M24 28V35L32 38L40 35V28" stroke="#2dd4bf" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M10 49C18 45 26 53 34 49C42 45 48 53 54 49" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="14" r="2.2" fill="#bae6fd" />
          <circle cx="46" cy="12" r="2.6" fill="#bae6fd" />
        </svg>
      );
    case 'frost_wardens':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M32 10L48 18V33C48 43 41 50 32 54C23 50 16 43 16 33V18L32 10Z" fill="#1e3a5f" stroke="#bae6fd" strokeWidth="2" />
          <path d="M32 18V46M20 26L44 38M44 26L20 38" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="32" cy="32" r="4" fill="#e0f2fe" />
        </svg>
      );
    case 'barbaric_nation':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M22 48C10 38 10 20 18 12C17 22 20 32 28 38" fill="#fef3c7" stroke="#d97706" strokeWidth="1.6" />
          <path d="M42 48C54 38 54 20 46 12C47 22 44 32 36 38" fill="#fef3c7" stroke="#d97706" strokeWidth="1.6" />
          <path d="M24 24H40L44 42L32 52L20 42L24 24Z" fill="#991b1b" stroke="#f97316" strokeWidth="1.8" />
          <path d="M28 32L36 40M36 32L28 40" stroke="#fde68a" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'eclipse_gauntlet':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="17" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="32" cy="32" r="14" fill="#09090f" stroke="#c084fc" strokeWidth="1.6" />
          <path d="M21 15L26 21L32 12L38 21L43 15L41 24H23L21 15Z" fill="#f59e0b" />
          <path d="M16 49L48 17" stroke="#f43f5e" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M48 49L16 17" stroke="#f43f5e" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
  }
}

export function RaidSelectModal({
  hud,
  onStartRaid,
  onOpenLore,
  onClose,
}: RaidSelectModalProps) {
  const [viewAll, setViewAll] = useState(false);
  const scaling = getRaidOrderScaling(hud.raidOrderTier);
  const standardClearedCount = hud.raidsClearedInRun.filter((id) =>
    STANDARD_RAID_ORDER.includes(id)
  ).length;
  const remainingForEnd = Math.max(0, hud.raidsRequiredForEnd - standardClearedCount);

  const offeredList: RaidId[] = hud.endRaidUnlocked
    ? ['eclipse_gauntlet']
    : hud.offeredRaids.length > 0
      ? hud.offeredRaids
      : STANDARD_RAID_ORDER.slice(0, 3);

  const displayedRaids: RaidId[] = viewAll
    ? [...STANDARD_RAID_ORDER, 'eclipse_gauntlet']
    : offeredList;

  const [selectedRaidId, setSelectedRaidId] = useState<RaidId>(displayedRaids[0]);

  useEffect(() => {
    if (!displayedRaids.includes(selectedRaidId)) {
      setSelectedRaidId(displayedRaids[0]);
    }
  }, [displayedRaids, selectedRaidId]);

  const activeRaidId = displayedRaids.includes(selectedRaidId)
    ? selectedRaidId
    : displayedRaids[0];
  const selectedRaid = RAIDS[activeRaidId];
  const selectedIsLocked = Boolean(selectedRaid.isEndRaid) && !hud.endRaidUnlocked;
  const selectedCharmId = RAID_BOSS_CHARM[activeRaidId];
  const selectedCharm = selectedCharmId ? BOSS_CHARMS[selectedCharmId] : null;
  const selectedCharmOwned = selectedCharmId ? hud.bossCharms.includes(selectedCharmId) : false;
  const selectedSynergies = selectedCharmId
    ? CHARM_SYNERGIES.filter((s) => s.charms.includes(selectedCharmId))
    : [];
  const selectedRooms = RAIDS_BY_ID[activeRaidId];
  const selectedLoreAll = LORE_BY_RAID[activeRaidId] ?? [];
  const selectedLoreFound = selectedLoreAll.filter((l) =>
    hud.collectedLoreIds.includes(l.id)
  ).length;

  // Full WASD / Arrow navigation + 0 (Zero) / Enter confirm!
  useEffect(() => {
    const cols = viewAll ? 6 : displayedRaids.length;
    const onKeyDown = (e: KeyboardEvent) => {
      const idx = Math.max(0, displayedRaids.indexOf(activeRaidId));
      if (e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRaidId(displayedRaids[(idx + 1) % displayedRaids.length]);
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRaidId(displayedRaids[(idx - 1 + displayedRaids.length) % displayedRaids.length]);
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRaidId(displayedRaids[(idx + cols) % displayedRaids.length]);
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRaidId(
          displayedRaids[(idx - cols + displayedRaids.length) % displayedRaids.length]
        );
      } else if (e.code === 'Digit0' || e.code === 'Numpad0' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedIsLocked) {
          onStartRaid(activeRaidId);
        }
      } else if (!viewAll && (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3')) {
        const pickIdx = Number(e.code.replace('Digit', '')) - 1;
        if (displayedRaids[pickIdx]) {
          e.preventDefault();
          e.stopPropagation();
          setSelectedRaidId(displayedRaids[pickIdx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [activeRaidId, displayedRaids, onClose, onStartRaid, selectedIsLocked, viewAll]);

  return (
    <div className="absolute inset-0 bg-[#080a10]/88 overflow-y-auto z-20">
      <div className="max-w-5xl w-full mx-auto my-2 sm:my-4 bg-[#11141f] border border-[#2f3750] p-3 sm:p-4 space-y-3">
        {/* Clean Compact Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#23293d] pb-2.5">
          <div className="min-w-0">
            <h2
              className="text-base sm:text-lg font-bold tracking-wide text-[#f3efe6] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {viewAll
                ? `All ${RAID_ORDER.length} Raids`
                : hud.endRaidUnlocked
                  ? 'Final Boss Gauntlet'
                  : 'Choose Next Raid'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#9aa2b8] mt-0.5">
              <span className="tabular-nums">
                {Math.min(standardClearedCount, hud.raidsRequiredForEnd)}/{hud.raidsRequiredForEnd}{' '}
                Cleared
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {hud.endRaidUnlocked
                  ? 'Final Gauntlet Open'
                  : scaling.tier === 1
                    ? 'Tier 1 Normal'
                    : `Tier ${scaling.tier} (+${Math.round((scaling.hpMult - 1) * 100)}% HP)`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-[#c5cede]">WASD to inspect · 0 to enter</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenLore(activeRaidId)}
              className="px-2.5 py-1.5 text-xs font-medium text-[#fde68a] bg-[#1a1625] hover:bg-[#241e33] border border-[#4a3b61] flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                Lore {hud.collectedLoreIds.length}/{LORE_FRAGMENTS.length}
              </span>
            </button>

            <div className="flex items-center bg-[#0c0f18] border border-[#272f46] p-0.5">
              <button
                type="button"
                onClick={() => setViewAll(false)}
                className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  !viewAll
                    ? 'bg-[#21283d] text-[#f3efe6]'
                    : 'text-[#8c95ad] hover:text-[#e2e8f0]'
                }`}
              >
                Offered
              </button>
              <button
                type="button"
                onClick={() => setViewAll(true)}
                className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  viewAll
                    ? 'bg-[#21283d] text-[#f3efe6]'
                    : 'text-[#8c95ad] hover:text-[#e2e8f0]'
                }`}
              >
                All {RAID_ORDER.length}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close raid select"
              className="p-2 text-[#9aa2b8] hover:text-white hover:bg-[#1c2130] border border-[#2c334a] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Raid Grid — Fits Completely on One Screen */}
        {viewAll ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 max-h-[52vh] overflow-y-auto pr-0.5">
            {displayedRaids.map((raidId) => {
              const raid = RAIDS[raidId];
              const charmId = RAID_BOSS_CHARM[raidId];
              const charm = charmId ? BOSS_CHARMS[charmId] : null;
              const isCleared = hud.raidsClearedInRun.includes(raidId);
              const isEndLocked = Boolean(raid.isEndRaid) && !hud.endRaidUnlocked;
              const isSelected = raidId === activeRaidId;
              const raidLore = LORE_BY_RAID[raidId] ?? [];
              const foundLore = raidLore.filter((l) => hud.collectedLoreIds.includes(l.id)).length;

              return (
                <button
                  key={raid.id}
                  type="button"
                  data-snd="chunky"
                  onClick={() => setSelectedRaidId(raid.id)}
                  onDoubleClick={() => !isEndLocked && onStartRaid(raid.id)}
                  className={`group text-left p-2.5 border transition-colors flex flex-col gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a2034] border-[#e5a93c]'
                      : isEndLocked
                        ? 'bg-[#10121c] border-[#22273a] opacity-65'
                        : 'bg-[#151927] border-[#2a324a] hover:border-[#64748b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 shrink-0 flex items-center justify-center border border-[#2a324a]"
                      style={{
                        background: `radial-gradient(circle at center, ${raid.accent}24, #0d101a 78%)`,
                      }}
                    >
                      {isEndLocked ? (
                        <Lock className="w-4 h-4 text-[#7c859e]" />
                      ) : (
                        <RaidEmblem id={raid.id} className="w-8 h-8" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-xs font-bold text-[#f3efe6] break-words whitespace-normal"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {raid.name}
                        </span>
                        {isCleared && <Check className="w-3 h-3 text-[#34d399] shrink-0" />}
                      </div>
                      <div className="text-[10px] text-[#9aa2b8] break-words whitespace-normal leading-snug">
                        {isEndLocked ? `Clear ${remainingForEnd} more raids to unlock` : raid.gimmick}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#22283d] text-[10px]">
                    <span className="break-words whitespace-normal font-medium leading-snug" style={{ color: charm?.color ?? '#cbd5e1' }}>
                      {charm?.name ?? 'Boss Relic'}
                    </span>
                    <span className="font-mono text-[#9aa2b8] tabular-nums shrink-0">
                      Lore {foundLore}/4
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className={`grid gap-3 ${
              displayedRaids.length === 1
                ? 'grid-cols-1 max-w-md mx-auto w-full'
                : displayedRaids.length === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {displayedRaids.map((raidId, index) => {
              const raid = RAIDS[raidId];
              const rooms = RAIDS_BY_ID[raidId];
              const finalBoss = rooms[rooms.length - 1]?.bossName ?? '';
              const charmId = RAID_BOSS_CHARM[raidId];
              const charm = charmId ? BOSS_CHARMS[charmId] : null;
              const charmOwned = charmId ? hud.bossCharms.includes(charmId) : false;
              const isSelected = raidId === activeRaidId;
              const raidLore = LORE_BY_RAID[raidId] ?? [];
              const foundLore = raidLore.filter((l) => hud.collectedLoreIds.includes(l.id)).length;

              return (
                <button
                  key={raid.id}
                  type="button"
                  data-snd="chunky"
                  onClick={() => setSelectedRaidId(raid.id)}
                  onDoubleClick={() => onStartRaid(raid.id)}
                  className={`group relative text-left p-3.5 border flex flex-col items-center text-center gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a2034] border-[#e5a93c]'
                      : 'bg-[#151927] border-[#2c344d] hover:border-[#64748b]'
                  }`}
                >
                  <span className="absolute top-2 right-2.5 font-mono text-[11px] text-[#7c859e] tabular-nums">
                    {index + 1}
                  </span>
                  <span className="absolute top-2 left-2.5 font-mono text-[10px] text-[#d4c49a] tabular-nums">
                    Lore {foundLore}/4
                  </span>

                  <div
                    className="w-16 h-16 flex items-center justify-center border border-[#2c344d] mt-1"
                    style={{
                      background: `radial-gradient(circle at center, ${raid.accent}2b, #0e111b 76%)`,
                    }}
                  >
                    <RaidEmblem id={raid.id} className="w-13 h-13" />
                  </div>

                  <div className="space-y-0.5 w-full">
                    <div
                      className="text-sm sm:text-base font-bold text-[#f3efe6] leading-snug"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {raid.name}
                    </div>
                    <div className="text-[11px] text-[#cbd5e1] break-words whitespace-normal leading-snug">{raid.gimmick}</div>
                    <div className="text-[11px] text-[#9aa2b8] break-words whitespace-normal leading-snug">Boss: {finalBoss}</div>
                  </div>

                  {charm && (
                    <div className="w-full pt-2 border-t border-[#22283d]">
                      <div
                        className="text-xs font-semibold break-words whitespace-normal leading-snug"
                        style={{ color: charm.color }}
                      >
                        {charm.name}
                        {charmOwned ? ' · Owned' : ''}
                      </div>
                      <div className="text-[11px] text-[#8c95ad] break-words whitespace-normal leading-snug">
                        {charm.effectSummary}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected raid: full text, wraps, and scrolls on a short screen. */}
        <div className="bg-[#0d1019] border border-[#2c344d] p-3 sm:p-3.5 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center border border-[#343e5c]"
              style={{
                background: `radial-gradient(circle at center, ${selectedRaid.accent}30, #0b0e17 78%)`,
              }}
            >
              <RaidEmblem id={selectedRaid.id} className="w-10 h-10 sm:w-11 sm:h-11" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-base sm:text-lg font-bold text-[#f3efe6] break-words whitespace-normal leading-snug"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {selectedRaid.name}
              </h3>
              <p className="text-xs text-[#9aa2b8] break-words whitespace-normal leading-snug mt-0.5">
                {selectedRaid.subtitle}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed break-words whitespace-normal">
              {selectedRaid.description}
            </p>
            <dl className="space-y-2 text-xs sm:text-[13px]">
              <div>
                <dt className="text-[#e5a93c] font-semibold">Place</dt>
                <dd className="text-[#c5cede] break-words whitespace-normal leading-relaxed">{selectedRaid.gimmick}</dd>
              </div>
              <div>
                <dt className="text-[#e5a93c] font-semibold">Enemies</dt>
                <dd className="text-[#c5cede] break-words whitespace-normal leading-relaxed">{selectedRaid.enemySummary}</dd>
              </div>
              <div>
                <dt className="text-[#e5a93c] font-semibold">Element</dt>
                <dd className="text-[#c5cede] break-words whitespace-normal leading-relaxed">{raidElementText(activeRaidId)}</dd>
              </div>
              <div>
                <dt className="text-[#e5a93c] font-semibold">Final boss</dt>
                <dd className="text-[#c5cede] break-words whitespace-normal leading-relaxed">
                  {selectedRooms[selectedRooms.length - 1]?.bossName ?? selectedRaid.finalBossName}
                </dd>
              </div>
              <div>
                <dt className="text-[#e5a93c] font-semibold">Reward</dt>
                <dd className="text-[#c5cede] break-words whitespace-normal leading-relaxed">
                  {selectedCharm ? (
                    <>
                      <span className="font-semibold" style={{ color: selectedCharm.color }}>
                        {selectedCharm.name}
                        {selectedCharmOwned ? ' (already owned)' : ''}
                      </span>
                      {'. '}
                      {selectedCharm.effectSummary}
                      {selectedSynergies.length > 0 && (
                        <>
                          {' '}
                          Synergizes with{' '}
                          {selectedSynergies
                            .map((s) => {
                              const otherId = s.charms[0] === selectedCharm.id ? s.charms[1] : s.charms[0];
                              return `${BOSS_CHARMS[otherId]?.name ?? s.name} (${s.name})`;
                            })
                            .join(', ')}
                          .
                        </>
                      )}{' '}
                    </>
                  ) : (
                    'Boss charm. '
                  )}
                  Lore scrolls {selectedLoreFound}/4.
                </dd>
              </div>
              <div>
                <dt className="text-[#e5a93c] font-semibold">Difficulty</dt>
                <dd className="text-[#c5cede] break-words whitespace-normal leading-relaxed">
                  {scaling.label}. {scaling.detail}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-1 border-t border-[#23293d]">
            <button
              type="button"
              onClick={() => onOpenLore(selectedRaid.id)}
              className="text-xs text-[#fde68a] hover:text-white underline underline-offset-2 cursor-pointer text-left break-words"
            >
              Lore: {selectedLoreFound}/4 collected
            </button>
            <button
              type="button"
              data-snd="chunky"
              disabled={selectedIsLocked}
              onClick={() => !selectedIsLocked && onStartRaid(selectedRaid.id)}
              className={`sm:min-w-[180px] py-2.5 px-4 text-xs sm:text-sm font-bold text-white text-center whitespace-normal leading-snug transition-opacity ${
                selectedIsLocked
                  ? 'bg-[#22273a] text-[#7c859e] cursor-not-allowed'
                  : 'hover:opacity-95 cursor-pointer'
              }`}
              style={!selectedIsLocked ? { backgroundColor: RAID_BTN_BG[selectedRaid.id] } : undefined}
            >
              {selectedIsLocked ? `Clear ${remainingForEnd} more raids` : 'Enter Raid [0]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

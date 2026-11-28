import { useEffect, useState } from 'react';
import { BookOpen, Lock, X } from 'lucide-react';
import { RAID_ORDER, RAIDS } from '../game/defaults';
import { LORE_BY_RAID, LORE_FRAGMENTS } from '../game/lore';
import { RaidId } from '../game/types';

interface LoreModalProps {
  collectedLoreIds: string[];
  initialRaidId?: RaidId;
  onClose: () => void;
}

export function LoreModal({ collectedLoreIds, initialRaidId, onClose }: LoreModalProps) {
  const [selectedRaidId, setSelectedRaidId] = useState<RaidId>(
    initialRaidId ?? RAID_ORDER[0]
  );

  const collectedSet = new Set(collectedLoreIds);
  const totalFound = collectedLoreIds.length;
  const totalLore = LORE_FRAGMENTS.length;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Digit0' || e.code === 'Numpad0') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRaidId((prev) => {
          const i = RAID_ORDER.indexOf(prev);
          return RAID_ORDER[(i - 1 + RAID_ORDER.length) % RAID_ORDER.length];
        });
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedRaidId((prev) => {
          const i = RAID_ORDER.indexOf(prev);
          return RAID_ORDER[(i + 1) % RAID_ORDER.length];
        });
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const raid = RAIDS[selectedRaidId];
  const entries = LORE_BY_RAID[selectedRaidId] ?? [];
  const raidFoundCount = entries.filter((f) => collectedSet.has(f.id)).length;

  return (
    <div className="absolute inset-0 bg-[#07090f]/90 flex items-center justify-center p-3 sm:p-5 z-40">
      <div className="max-w-4xl w-full max-h-[90vh] bg-[#11141f] border border-[#333c57] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#242b40] bg-[#0d1019]">
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-5 h-5 text-[#e5a93c] shrink-0" />
            <div className="min-w-0">
              <h2
                className="text-base sm:text-lg font-bold tracking-wide text-[#f3efe6] leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Chronicle of the Realms · Lore Codex
              </h2>
              <p className="text-xs text-[#9aa2b8]">
                {totalFound}/{totalLore} Fragments Recovered · Max 1 scroll spawns per raid · W/S to browse · 0/Esc to close
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lore codex"
            className="p-2 text-[#9aa2b8] hover:text-white hover:bg-[#1c2130] border border-[#2c334a] transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two-column Codex Body */}
        <div className="grid grid-cols-1 sm:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Raid List */}
          <div className="sm:col-span-4 border-b sm:border-b-0 sm:border-r border-[#23293d] bg-[#0e111b] overflow-y-auto p-2 space-y-1">
            {RAID_ORDER.map((rId) => {
              const r = RAIDS[rId];
              const list = LORE_BY_RAID[rId] ?? [];
              const found = list.filter((f) => collectedSet.has(f.id)).length;
              const isSelected = rId === selectedRaidId;
              return (
                <button
                  key={rId}
                  type="button"
                  onClick={() => setSelectedRaidId(rId)}
                  className={`w-full text-left px-3 py-2 border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a2033] border-[#e5a93c] text-[#f3efe6]'
                      : 'bg-transparent border-transparent text-[#9aa2b8] hover:bg-[#151a29] hover:text-[#e2e8f0]'
                  }`}
                >
                  <span className="text-xs font-semibold truncate">{r.name}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums shrink-0 ${
                      found === list.length
                        ? 'text-[#34d399] font-bold'
                        : found > 0
                          ? 'text-[#e5a93c]'
                          : 'text-[#64748b]'
                    }`}
                  >
                    {found}/{list.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Raid Lore Entries */}
          <div className="sm:col-span-8 p-4 overflow-y-auto space-y-3 bg-[#11141f]">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#23293d]">
              <div>
                <h3
                  className="text-base font-bold text-[#f3efe6]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {raid.name}
                </h3>
                <p className="text-xs text-[#9aa2b8]">{raid.subtitle}</p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#e5a93c] tabular-nums">
                {raidFoundCount}/{entries.length} Discovered
              </span>
            </div>

            <div className="space-y-2.5">
              {entries.map((entry) => {
                const unlocked = collectedSet.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 border ${
                      unlocked
                        ? 'bg-[#171b2a] border-[#3a425e]'
                        : 'bg-[#0e111a] border-[#202638] opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#e5a93c]">
                        Fragment {entry.order} of 4
                      </span>
                      {!unlocked && <Lock className="w-3.5 h-3.5 text-[#64748b]" />}
                    </div>
                    {unlocked ? (
                      <>
                        <div
                          className="text-sm font-bold text-[#f3efe6] mb-1"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {entry.title}
                        </div>
                        <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                          {entry.excerpt}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#7c859e] italic">
                        Unrecovered scroll fragment. Explore high ledges and hidden chambers in{' '}
                        {raid.name} to recover this record.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

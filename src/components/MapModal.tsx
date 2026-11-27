import { Check, Crown, Flame, Map as MapIcon, Skull, X } from 'lucide-react';
import { getRaidOrderScaling, RAIDS } from '../game/defaults';
import { RAIDS_BY_ID } from '../game/raids';
import { HudSnapshot } from '../game/types';

interface MapModalProps {
  hud: HudSnapshot;
  onClose: () => void;
}

export function MapModal({ hud, onClose }: MapModalProps) {
  const raidDef = RAIDS[hud.activeRaidId];
  const rooms = RAIDS_BY_ID[hud.activeRaidId];
  const scaling = getRaidOrderScaling(hud.raidOrderTier);

  return (
    <div className="absolute inset-0 bg-[#080a10]/88 flex items-center justify-center p-5 z-20">
      <div className="max-w-3xl w-full max-h-[90%] overflow-y-auto bg-[#11141f] border border-[#343b54] p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23293d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#151e33] border border-[#36508a] flex items-center justify-center">
              <MapIcon className="w-4 h-4 text-[#93c5fd]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold tracking-wider text-[#e5a93c]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {raidDef.name} · Raid Map
              </h2>
              <p className="text-[11px] text-[#9aa2b8]">
                {raidDef.isEndRaid
                  ? '4 Duo-Boss Chambers followed by the Final Overlord'
                  : '4 Distinct Chambers with Mini-Bosses followed by the Final Boss'}{' '}
                · <span className="text-[#cbd5e1] font-medium">{scaling.label}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            className="p-1.5 text-[#9aa2b8] hover:text-white hover:bg-[#1c2130] border border-[#2c334a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Base Camp Node */}
        <div
          className={`p-3 border flex items-center justify-between ${
            hud.inCamp
              ? 'bg-[#211a14] border-[#e5a93c]'
              : 'bg-[#131722] border-[#262d42]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#281810] border border-[#9c4c1b] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#f97316]" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#f3efe6]">Base Camp · Crossroads</div>
              <div className="text-[10px] text-[#9aa2b8]">
                Campfire · 3 Heroes · Loadout [I] · Forge &amp; Blood Altar · Raid Selection Gate
              </div>
            </div>
          </div>
          {hud.inCamp ? (
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#332714] border border-[#e5a93c] text-[#fde68a]">
              YOU ARE HERE
            </span>
          ) : (
            <span className="font-mono text-[10px] text-[#7c859e]">SAFE HAVEN</span>
          )}
        </div>

        {/* Raid Rooms Grid (Rooms 1-4 + Room 5 Final Boss) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rooms.map((room) => {
            const isCurrent = !hud.inCamp && hud.roomNumber === room.roomNumber;
            const isCleared = hud.roomsCleared.includes(room.roomNumber);
            const isFinal = Boolean(room.isBigBossRoom);

            return (
              <div
                key={room.roomNumber}
                className={`p-3.5 border transition-colors ${
                  isCurrent
                    ? isFinal
                      ? 'bg-[#27111a] border-[#ef4444]'
                      : 'bg-[#1a2136] border-[#60a5fa]'
                    : isCleared
                      ? 'bg-[#121c18] border-[#2c5c46]'
                      : isFinal
                        ? 'bg-[#171118] border-[#422030] md:col-span-2'
                        : 'bg-[#11141e] border-[#23293d]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                        isFinal
                          ? 'bg-[#2e121c] border-[#8c273e] text-[#ff6b8b]'
                          : 'bg-[#171d2e] border-[#303a56] text-[#cbd5e1]'
                      }`}
                    >
                      {isFinal
                        ? 'FINAL BOSS'
                        : room.isBossGauntletRoom
                          ? `BOSS DUO ${room.roomNumber}/4`
                          : `ROOM ${room.roomNumber}/4`}
                    </span>
                    <span className="text-xs font-semibold text-[#f3efe6]">{room.name}</span>
                  </div>

                  {isCurrent ? (
                    <span className="font-mono text-[9px] font-bold text-[#93c5fd]">CURRENT</span>
                  ) : isCleared ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold text-[#34d399]">
                      <Check className="w-3 h-3" />
                      CLEARED
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] text-[#687089]">LOCKED</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#9aa2b8]">
                  <span className="flex items-center gap-1.5">
                    {isFinal ? (
                      <Crown className="w-3.5 h-3.5 text-[#e5a93c]" />
                    ) : (
                      <Skull className="w-3.5 h-3.5 text-[#ef4444]" />
                    )}
                    <span>{room.bossName}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#ff6b8b]">
                    +{isFinal ? 2 : 1} Boss Core{isFinal ? 's' : ''}
                  </span>
                </div>

                {isCurrent && (
                  <div className="mt-2.5 pt-2 border-t border-[#283350] space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#cbd5e1]">
                      <span>
                        Foes: {hud.enemiesRemaining}/{hud.enemiesTotal}
                      </span>
                      <span>
                        {hud.exitDoorUnlocked
                          ? hud.bossChestSpawned
                            ? 'Claim Chest · Exit Open'
                            : 'Exit Door Open →'
                          : `${hud.progressPct}% Explored`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0c101a] border border-[#2a344d]">
                      <div
                        className="h-full bg-[#e5a93c]"
                        style={{ width: `${Math.min(100, Math.max(4, hud.progressPct))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#23293d] text-xs text-[#8a93ab]">
          <span>
            Raids Conquered:{' '}
            <strong className="font-mono tabular-nums text-[#e5a93c]">
              {hud.raidsCompleted}
            </strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1b2030] hover:bg-[#252c42] border border-[#343e59] text-[#e8e4dc] font-medium"
          >
            Close Map (M / Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

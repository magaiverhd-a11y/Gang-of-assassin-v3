import { Check, Crown, Flame, Lock, ShieldAlert, Skull, Swords, X } from 'lucide-react';
import { HeroPortrait } from './HeroPortrait';
import {
  CHARACTERS,
  CHARACTER_ORDER,
  getRaidOrderScaling,
  RAIDS,
  STANDARD_RAID_ORDER,
} from '../game/defaults';
import { RAIDS_BY_ID } from '../game/raids';
import { CharacterId, HudSnapshot, RaidId } from '../game/types';

interface RaidSelectModalProps {
  hud: HudSnapshot;
  onStartRaid: (raidId: RaidId) => void;
  onSelectCharacter: (charId: CharacterId) => void;
  onClose: () => void;
}

export function RaidSelectModal({
  hud,
  onStartRaid,
  onSelectCharacter,
  onClose,
}: RaidSelectModalProps) {
  const scaling = getRaidOrderScaling(hud.raidOrderTier);
  const standardClearedCount = hud.raidsClearedInRun.filter((id) =>
    STANDARD_RAID_ORDER.includes(id)
  ).length;

  const displayedRaids: RaidId[] = hud.endRaidUnlocked
    ? ['eclipse_gauntlet']
    : hud.offeredRaids.length > 0
      ? hud.offeredRaids
      : STANDARD_RAID_ORDER.slice(0, 2);

  return (
    <div className="absolute inset-0 bg-[#080a10]/88 flex items-center justify-center p-5 z-20">
      <div className="max-w-3xl w-full max-h-[92%] overflow-y-auto bg-[#11141f] border border-[#343b54] p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#23293d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#2a131a] border border-[#8c273e] flex items-center justify-center">
              {hud.endRaidUnlocked ? (
                <Crown className="w-4 h-4 text-[#f59e0b]" />
              ) : (
                <Flame className="w-4 h-4 text-[#f97316]" />
              )}
            </div>
            <div>
              <h2
                className="text-lg font-bold tracking-wider text-[#e5a93c]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {hud.endRaidUnlocked
                  ? 'Final Boss Gauntlet Unlocked'
                  : 'Choose 1 of 2 Raids'}
              </h2>
              <p className="text-[11px] text-[#9aa2b8]">
                {hud.endRaidUnlocked
                  ? 'Conquer 4 Duo-Boss Chambers and the Overlord of the Eclipse to complete the campaign.'
                  : `Conquered raids cannot be repeated until the cycle ends. Clear ${hud.raidsRequiredForEnd} raids to unlock the End Boss Gauntlet.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close raid select"
            className="p-1.5 text-[#9aa2b8] hover:text-white hover:bg-[#1c2130] border border-[#2c334a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Campaign Progress Strip */}
        <div className="p-3 bg-[#0e111b] border border-[#242c42] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#e8e4dc] uppercase tracking-wider text-[10px]">
              Campaign Progress · {Math.min(standardClearedCount, hud.raidsRequiredForEnd)}/
              {hud.raidsRequiredForEnd} Standard Raids Conquered
            </span>
            <span
              className={`font-mono text-[10px] font-bold ${
                hud.endRaidUnlocked ? 'text-[#f59e0b]' : 'text-[#93c5fd]'
              }`}
            >
              {hud.endRaidUnlocked
                ? 'ECLIPSE CITADEL OPEN'
                : `${Math.max(0, hud.raidsRequiredForEnd - standardClearedCount)} MORE TO UNLOCK END RAID`}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            {STANDARD_RAID_ORDER.map((rId) => {
              const r = RAIDS[rId];
              const isCleared = hud.raidsClearedInRun.includes(rId);
              const isOffered = !hud.endRaidUnlocked && hud.offeredRaids.includes(rId);

              return (
                <div
                  key={rId}
                  className={`px-2 py-1.5 border text-[10px] flex items-center justify-between gap-1 ${
                    isCleared
                      ? 'bg-[#111e18] border-[#285942] text-[#34d399]'
                      : isOffered
                        ? 'bg-[#1d1914] border-[#b4832c] text-[#fde68a]'
                        : 'bg-[#121521] border-[#22283c] text-[#727b94]'
                  }`}
                >
                  <span className="truncate font-medium">{r.name}</span>
                  {isCleared ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[8px] font-bold shrink-0">
                      <Check className="w-2.5 h-2.5" />
                      DONE
                    </span>
                  ) : isOffered ? (
                    <span className="font-mono text-[8px] font-bold shrink-0">OFFERED</span>
                  ) : (
                    <Lock className="w-2.5 h-2.5 shrink-0 opacity-60" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pick-Order Scaling Banner */}
        <div
          className={`p-3 border flex items-center justify-between gap-3 ${
            hud.endRaidUnlocked
              ? 'bg-[#261428] border-[#a855f7]'
              : scaling.tier >= 2
                ? 'bg-[#25151a] border-[#991b2e]'
                : 'bg-[#141c29] border-[#2d3e5e]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert
              className={`w-4 h-4 shrink-0 ${
                hud.endRaidUnlocked
                  ? 'text-[#d8b4fe]'
                  : scaling.tier >= 2
                    ? 'text-[#fb7185]'
                    : 'text-[#93c5fd]'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-[#f3efe6]">
                {hud.endRaidUnlocked ? 'End Boss Gauntlet · Maximum Threat' : scaling.label}
              </div>
              <div className="text-[11px] text-[#9aa2b8]">
                {hud.endRaidUnlocked
                  ? 'Fight 2 bosses per chamber across 4 arenas, then challenge Draculor, Eclipse Overlord.'
                  : scaling.detail}
              </div>
            </div>
          </div>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 border whitespace-nowrap ${
              hud.endRaidUnlocked
                ? 'bg-[#361640] border-[#c084fc] text-[#e9d5ff]'
                : scaling.tier >= 2
                  ? 'bg-[#361520] border-[#c82333] text-[#fda4af]'
                  : 'bg-[#182640] border-[#3b82f6] text-[#bfdbfe]'
            }`}
          >
            {scaling.tier === 1 && !hud.endRaidUnlocked
              ? 'NORMAL PACE'
              : `+${Math.round((scaling.hpMult - 1) * 100)}% HP · ${scaling.chargeSpeedMult}x CHARGE`}
          </span>
        </div>

        {/* Selectable Raid Cards (Either 1 Featured End Raid OR 2 Offered Standard Raids) */}
        <div
          className={`grid gap-4 ${
            hud.endRaidUnlocked ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {displayedRaids.map((raidId, index) => {
            const raid = RAIDS[raidId];
            const rooms = RAIDS_BY_ID[raidId];
            const isEndRaid = Boolean(raid.isEndRaid);

            const buttonBg =
              raid.id === 'goblin_camp'
                ? '#166534'
                : raid.id === 'weeping_necropolis'
                  ? '#115e59'
                  : raid.id === 'brimstone_sanctum'
                    ? '#9a3412'
                    : raid.id === 'eclipse_gauntlet'
                      ? '#6b21a8'
                      : '#991b2e';

            return (
              <div
                key={raid.id}
                className={`p-4 flex flex-col justify-between gap-4 border transition-colors ${
                  isEndRaid
                    ? 'bg-[#1a1324] border-[#a855f7] hover:border-[#f59e0b]'
                    : 'bg-[#151927] border-[#2c344d] hover:border-[#e5a93c]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-base font-bold tracking-wide text-[#f3efe6]"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {raid.name}
                        </span>
                        {isEndRaid && (
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 bg-[#351742] border border-[#c084fc] text-[#e9d5ff]">
                            END BOSS RAID
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono" style={{ color: raid.accent }}>
                        {raid.subtitle}
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#111521] border border-[#2f3854] text-[#e5a93c]">
                      [{index + 1}]
                    </span>
                  </div>

                  <p className="text-xs text-[#a5adc2] leading-relaxed">{raid.description}</p>

                  {/* 4 Chambers + Boss Preview */}
                  <div className="bg-[#10131e] border border-[#22283c] p-2.5 space-y-1.5">
                    {rooms.map((r) => (
                      <div
                        key={r.roomNumber}
                        className="flex items-center justify-between gap-2 text-[11px] text-[#9aa2b8]"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {r.isBigBossRoom ? (
                            <Crown className="w-3 h-3 text-[#e5a93c] shrink-0" />
                          ) : (
                            <Skull className="w-3 h-3 text-[#7c859e] shrink-0" />
                          )}
                          <span
                            className={
                              r.isBigBossRoom ? 'text-[#fde68a] font-medium truncate' : 'truncate'
                            }
                          >
                            {r.isBigBossRoom
                              ? 'Final Boss'
                              : r.isBossGauntletRoom
                                ? `Duo Arena ${r.roomNumber}`
                                : `Room ${r.roomNumber}`}{' '}
                            · {r.name}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] text-[#cbd5e1] truncate max-w-[46%] text-right">
                          {r.bossName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartRaid(raid.id)}
                  className="w-full py-2.5 px-3 text-xs font-bold tracking-wide text-white border transition-colors flex items-center justify-center gap-2 hover:brightness-110"
                  style={{
                    backgroundColor: buttonBg,
                    borderColor: raid.accent,
                  }}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>
                    {isEndRaid
                      ? `[1] Deploy to ${raid.name} · Boss Gauntlet`
                      : `[${index + 1}] Deploy to ${raid.name} (${
                          scaling.tier === 1 ? 'Normal' : `Tier ${scaling.tier}`
                        })`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Hero Switcher Strip */}
        <div className="pt-2 border-t border-[#23293d] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#9aa2b8]">
            <span className="font-semibold text-[#d4d8e3] uppercase tracking-wider text-[10px]">
              Active Hero · All Heroes Have Ledge Pull-Up &amp; Exclusive Weapons
            </span>
            <span>Swap hero before deploying</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CHARACTER_ORDER.map((charId) => {
              const c = CHARACTERS[charId];
              const selected = hud.characterId === charId;
              return (
                <button
                  key={charId}
                  type="button"
                  onClick={() => onSelectCharacter(charId)}
                  className={`text-left p-2.5 border transition-colors ${
                    selected
                      ? 'bg-[#1f1a18] border-[#e5a93c]'
                      : 'bg-[#121622] border-[#252c42] hover:border-[#3d4869]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <HeroPortrait id={charId} size={52} accent={c.accent} animate={selected} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#f3efe6]">{c.name}</span>
                        {selected && (
                          <span className="font-mono text-[9px] font-bold text-[#fde68a]">ACTIVE</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#9aa2b8] mt-0.5">{c.traitSummary}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

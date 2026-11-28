import { Backpack, Check, Coins, Crown, Gem, Lock, Palette, Sparkles, X } from 'lucide-react';
import {
  ABILITIES,
  ABILITY_ORDER,
  ARTIFACTS,
  BOSS_CHARM_ORDER,
  BOSS_CHARMS,
  canCharacterUseWeapon,
  CHARACTERS,
  CHARM_SYNERGIES,
  getSpellCurrentTag,
  getSpellMilestoneInfo,
  getWeaponCurrentTag,
  getWeaponMilestoneInfo,
  HERO_SKIN_ORDER,
  HERO_SKINS,
  ITEM_ORDER,
  ITEMS,
  SPECIAL_ITEM_ORDER,
  SPECIAL_ITEMS,
  WEAPON_ORDER,
  WEAPONS,
} from '../game/defaults';
import { AbilityId, HeroSkinId, HudSnapshot, ItemId, SpecialItemId, WeaponId } from '../game/types';
import { AbilityIcon, ItemIcon, SpecialItemIcon, WeaponIcon } from './GameIcons';

interface InventoryModalProps {
  hud: HudSnapshot;
  onSelectWeapon: (weaponId: WeaponId) => void;
  onSelectAbility: (slotIndex: 0 | 1 | 2, abilityId: AbilityId) => void;
  onSelectItem: (slotIndex: 0 | 1 | 2, itemId: ItemId) => void;
  onSelectSpecialItem: (specialId: SpecialItemId) => void;
  onSelectSkin: (skinId: HeroSkinId) => void;
  onClose: () => void;
}

export function InventoryModal({
  hud,
  onSelectWeapon,
  onSelectAbility,
  onSelectItem,
  onSelectSpecialItem,
  onSelectSkin,
  onClose,
}: InventoryModalProps) {
  const canEdit = hud.inCamp;
  const weaponLevel = 1 + hud.weaponDamageBonus;
  const nextWeaponInfo = getWeaponMilestoneInfo(weaponLevel + 1);

  return (
    <div className="absolute inset-0 bg-[#080a10]/88 flex items-center justify-center p-5 z-20">
      <div className="max-w-4xl w-full max-h-[92%] overflow-y-auto bg-[#11141f] border border-[#343b54] p-5 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23293d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#1a2033] border border-[#3c4a70] flex items-center justify-center">
              <Backpack className="w-4 h-4 text-[#e5a93c]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold tracking-wider text-[#e5a93c]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {canEdit ? 'Base Camp Loadout & Inventory' : 'Raid Inventory (View Only)'}
              </h2>
              <p className="text-[11px] text-[#9aa2b8]">
                {canEdit
                  ? 'Equip your Weapon, single Spell [4], and single Item [5] before deploying. Special Item [6] holds rare powers.'
                  : 'New weapons and spells are stored here. Return to Base Camp to swap your equipped Spell [4] or Item [5].'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 bg-[#221d0e] border border-[#856414] text-xs font-mono tabular-nums text-[#facc15] flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              <span>{hud.gold}g</span>
            </div>
            <div className="px-2.5 py-1 bg-[#181c2b] border border-[#4a3a22] text-xs font-mono tabular-nums text-[#ffd166]">
              {hud.shards} Shards
            </div>
            <div className="px-2.5 py-1 bg-[#22131c] border border-[#6e2438] text-xs font-mono tabular-nums text-[#ff6b8b] flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5" />
              <span>{hud.bossCores} Cores</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inventory"
              className="p-1.5 text-[#9aa2b8] hover:text-white hover:bg-[#1c2130] border border-[#2c334a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SECTION 1: WEAPONS */}
        <section className="space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-bold tracking-widest text-[#f3efe6] uppercase">
              {CHARACTERS[hud.characterId].name} Weapons · Mastery Tier {weaponLevel} (
              {getWeaponCurrentTag(weaponLevel)})
            </h3>
            <span className="text-[11px] text-[#a5adc2]">
              Next ({nextWeaponInfo.tag}): {nextWeaponInfo.description}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {WEAPON_ORDER.filter((wId) => canCharacterUseWeapon(hud.characterId, wId)).map(
              (wId) => {
                const def = WEAPONS[wId];
                const owned = hud.unlockedWeapons.includes(wId);
                const equipped = hud.weapon === wId;
                const ownerBadge = def.ownerChar
                  ? `${CHARACTERS[def.ownerChar].name.toUpperCase()} ONLY`
                  : 'HERO ONLY';

                return (
                  <button
                    key={wId}
                    type="button"
                    disabled={!owned || !canEdit}
                    onClick={() => onSelectWeapon(wId)}
                    className={`text-left p-3 border transition-colors ${
                      equipped
                        ? 'bg-[#201b16] border-[#e5a93c]'
                        : owned && canEdit
                          ? 'bg-[#151a27] hover:bg-[#1d2336] border-[#2d3650] hover:border-[#e5a93c]'
                          : owned
                            ? 'bg-[#131722] border-[#262d42] cursor-default'
                            : 'bg-[#0b0e16] border-dashed border-[#202638] opacity-55 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 shrink-0 bg-[#0f131f] border border-[#313b57] flex items-center justify-center">
                          {owned ? (
                            <WeaponIcon id={wId} className="w-5 h-5" />
                          ) : (
                            <Lock className="w-4 h-4 text-[#687089]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#f3efe6] truncate">
                              {def.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] text-[#e5a93c] uppercase">
                              {ownerBadge}
                            </span>
                            <span className="text-[#4a526a]">·</span>
                            <span className="font-mono text-[10px] text-[#93c5fd] truncate">
                              [3] {def.skillName}
                            </span>
                          </div>
                        </div>
                      </div>
                      {equipped ? (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#332714] border border-[#e5a93c] text-[#fde68a] shrink-0">
                          EQUIPPED
                        </span>
                      ) : owned && canEdit ? (
                        <span className="font-mono text-[9px] text-[#8a93ab] shrink-0">EQUIP</span>
                      ) : !owned ? (
                        <span className="font-mono text-[9px] text-[#687089] shrink-0">LOCKED</span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#9aa2b8] leading-snug">{def.description}</p>
                    <p className="text-[10px] text-[#7c859e] leading-snug mt-1">
                      {def.skillDescription}
                    </p>
                  </button>
                );
              }
            )}
          </div>

          {(() => {
            const otherHeroWeapons = WEAPON_ORDER.filter(
              (wId) =>
                !canCharacterUseWeapon(hud.characterId, wId) &&
                hud.unlockedWeapons.includes(wId)
            );
            if (otherHeroWeapons.length === 0) return null;
            return (
              <div className="p-2.5 bg-[#0e111b] border border-[#232a40] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8f99b2]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#9aa2b8]">
                    Other Heroes&apos; Armory:
                  </span>
                  {otherHeroWeapons.map((wId) => {
                    const def = WEAPONS[wId];
                    const ownerLabel = def.ownerChar ? CHARACTERS[def.ownerChar].name : 'Any Hero';
                    return (
                      <span
                        key={wId}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#141826] border border-[#2b334d] text-[#cbd5e1]"
                      >
                        <WeaponIcon id={wId} className="w-3.5 h-3.5" />
                        <span>{def.name}</span>
                        <span className="font-mono text-[9px] text-[#e5a93c]">({ownerLabel})</span>
                      </span>
                    );
                  })}
                </div>
                <span className="text-[10px] text-[#6e7791]">
                  Swap hero by the campfire to equip.
                </span>
              </div>
            );
          })()}
        </section>

        {/* SECTION 2: SINGLE SPELL SLOT (Key 4) */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold tracking-widest text-[#f3efe6] uppercase">
              Equipped Spell (Key 4 · Camp Only)
            </h3>
            <span className="font-mono text-[10px] text-[#9aa2b8]">
              {hud.unlockedAbilities.length}/{ABILITY_ORDER.length} Spells Learned
            </span>
          </div>

          {(() => {
            const equippedId = hud.abilitySlots[0];
            const def = ABILITIES[equippedId];
            const slotLv = hud.abilitySlotLevels[0];
            const nextMilestone = getSpellMilestoneInfo(equippedId, slotLv + 1);

            return (
              <div className="p-3.5 border bg-[#141826] border-[#2e3750] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 shrink-0 flex items-center justify-center border bg-[#101420]"
                      style={{ borderColor: def.accent }}
                    >
                      <AbilityIcon id={equippedId} className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#172138] border border-[#385791] text-[#93c5fd]">
                          Key 4
                        </span>
                        <span className="text-xs font-semibold text-[#f3efe6]">{def.name}</span>
                        <span className="font-mono text-[10px] text-[#e5a93c]">
                          Lv {slotLv} · {getSpellCurrentTag(slotLv)}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9aa2b8] mt-0.5">{def.description}</div>
                      <div className="text-[10px] text-[#7c859e] mt-0.5">
                        Next ({nextMilestone.tag}): {nextMilestone.summary}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#93c5fd] shrink-0">{def.manaCost} MP</span>
                </div>

                {/* Base-Camp Spell Picker */}
                <div className="pt-2.5 border-t border-[#22293e] grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ABILITY_ORDER.map((abId) => {
                    const learned = hud.unlockedAbilities.includes(abId);
                    const chosen = equippedId === abId;
                    const abDef = ABILITIES[abId];
                    return (
                      <button
                        key={abId}
                        type="button"
                        disabled={!learned || !canEdit}
                        onClick={() => onSelectAbility(0, abId)}
                        title={
                          learned
                            ? canEdit
                              ? `Assign ${abDef.name} to Key 4`
                              : `${abDef.name} (Return to Base Camp to equip)`
                            : `${abDef.name} — Locked`
                        }
                        className={`px-2 py-2 flex items-center gap-2 border transition-colors text-left ${
                          chosen
                            ? 'bg-[#222940] border-[#e5a93c] text-[#f3efe6]'
                            : learned && canEdit
                              ? 'bg-[#0e121c] border-[#28314a] hover:border-[#60a5fa] text-[#cbd5e1]'
                              : learned
                                ? 'bg-[#0e121c] border-[#21273a] text-[#8a93ab] opacity-65 cursor-default'
                                : 'bg-[#0a0c12] border-dashed border-[#1b2030] text-[#596178] opacity-40 cursor-not-allowed'
                        }`}
                      >
                        {learned ? (
                          <AbilityIcon id={abId} className="w-4 h-4 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 shrink-0 text-[#687089]" />
                        )}
                        <span className="text-[11px] font-medium truncate">{abDef.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>

        {/* SECTION 3: EQUIPPED ITEM (Key 5) & SPECIAL ITEM (Key 6) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Key 5 Single Item Slot */}
          {(() => {
            const equippedItem = hud.itemSlots[0];
            const def = ITEMS[equippedItem];

            return (
              <div className="p-3.5 border bg-[#141826] border-[#2e3750] flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#26161c] border border-[#6b2632] text-[#fca5a5]">
                        Key 5
                      </span>
                      <span className="text-xs font-bold tracking-wider text-[#f3efe6] uppercase">
                        Equipped Item
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-bold text-[#e8e4dc]">
                      x{hud.itemCounts[equippedItem]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 shrink-0 bg-[#101420] border border-[#343e59] flex items-center justify-center">
                      <ItemIcon id={equippedItem} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#f3efe6]">{def.name}</div>
                      <div className="text-[11px] text-[#8f99b2] leading-snug">
                        {def.description}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#22293e]">
                  <div className="grid grid-cols-3 gap-1.5">
                    {ITEM_ORDER.map((candidate) => {
                      const chosen = candidate === equippedItem;
                      return (
                        <button
                          key={candidate}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => onSelectItem(0, candidate)}
                          title={
                            canEdit
                              ? `Assign ${ITEMS[candidate].name} to Key 5`
                              : `${ITEMS[candidate].name} (Equip in Base Camp)`
                          }
                          className={`py-1.5 px-1.5 flex items-center justify-center gap-1.5 border transition-colors ${
                            chosen
                              ? 'bg-[#222940] border-[#e5a93c] text-[#f3efe6]'
                              : canEdit
                                ? 'bg-[#0e121c] border-[#272f46] text-[#8a93ab] hover:border-[#60a5fa]'
                                : 'bg-[#0e121c] border-[#1f2536] text-[#687089] opacity-60 cursor-default'
                          }`}
                        >
                          <ItemIcon id={candidate} className="w-3.5 h-3.5" />
                          <span className="font-mono text-[10px]">
                            x{hud.itemCounts[candidate]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[#7c859e]">
                    Unslotted items picked up during a raid activate automatically.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Key 6 Special Item Slot */}
          {(() => {
            const spId = hud.specialItemSlot;
            const def = SPECIAL_ITEMS[spId];
            const charges = hud.specialItemCounts[spId] ?? 0;

            return (
              <div className="p-3.5 border bg-[#171326] border-[#4f3378] flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#2b1542] border border-[#a855f7] text-[#e9d5ff]">
                        Key 6
                      </span>
                      <span className="text-xs font-bold tracking-wider text-[#f5ecff] uppercase">
                        Special Item
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-bold text-[#d8b4fe]">
                      {charges}/{def.maxCharges} Charges
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 shrink-0 bg-[#1d1430] border border-[#7c3aed] flex items-center justify-center">
                      <SpecialItemIcon id={spId} className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#f5ecff]">{def.name}</div>
                      <div className="text-[11px] text-[#c4b5fd] leading-snug">
                        {def.description}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2e2047] space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {SPECIAL_ITEM_ORDER.map((cand) => {
                      const unlocked = hud.unlockedSpecials.includes(cand);
                      const chosen = cand === spId;
                      return (
                        <button
                          key={cand}
                          type="button"
                          disabled={!canEdit || !unlocked}
                          onClick={() => onSelectSpecialItem(cand)}
                          className={`py-1 px-1.5 flex items-center justify-center gap-1 border text-[10px] transition-colors ${
                            chosen
                              ? 'bg-[#2b1542] border-[#c084fc] text-white'
                              : unlocked && canEdit
                                ? 'bg-[#101220] border-[#342654] text-[#c4b5fd] hover:border-[#a855f7]'
                                : 'bg-[#0c0e18] border-[#1f2233] text-[#596178] opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <SpecialItemIcon id={cand} className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">x{hud.specialItemCounts[cand] ?? 0}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#a78bfa]">
                    <span>Cooldown: {def.cooldown}s</span>
                    <span>Buy more w/ Gold in Camp</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* SECTION 3B: MYTHIC BOSS CHARMS & CROSS-CHARM SYNERGIES (RUN-SCOPED) */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold tracking-widest text-[#fbbf24] uppercase flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>Boss Charms &amp; Active Synergies (Run Loadout)</span>
            </h3>
            <span className="font-mono text-[10px] text-[#fde68a]">
              {hud.bossCharms.length}/{BOSS_CHARM_ORDER.length} Charms · {hud.activeCharmSynergies.length} Synergies
            </span>
          </div>

          {hud.bossCharms.length === 0 ? (
            <div className="p-3 bg-[#10131e] border border-dashed border-[#342d47] text-xs text-[#8a93ab]">
              Defeat any Raid&apos;s Final Big Boss to claim their unique pursued <strong className="text-[#fbbf24]">Boss Charm</strong>. Combine Charms from different raids to unlock powerful <strong className="text-[#c084fc]">Cross-Charm Synergies</strong>!
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {hud.bossCharms.map((cid) => {
                  const c = BOSS_CHARMS[cid];
                  return (
                    <div key={cid} className="p-2.5 bg-[#191522] border" style={{ borderColor: `${c.color}88` }}>
                      <div className="text-xs font-bold" style={{ color: c.color }}>{c.name}</div>
                      <div className="text-[10px] text-[#cbd5e1] mt-0.5">{c.effectSummary}</div>
                    </div>
                  );
                })}
              </div>
              {hud.activeCharmSynergies.length > 0 && (
                <div className="p-2.5 bg-[#22142b] border border-[#a855f7] space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#e9d5ff]">
                    Active Charm Synergies
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {hud.activeCharmSynergies.map((sid) => {
                      const syn = CHARM_SYNERGIES.find((item) => item.id === sid);
                      if (!syn) return null;
                      return (
                        <div key={sid} className="text-[11px]">
                          <span className="font-bold" style={{ color: syn.color }}>{syn.name}:</span>{' '}
                          <span className="text-[#e2e8f0]">{syn.summary}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 3C: HERO SKINS (EQUIP UNLOCKED SKINS IN CAMP) */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold tracking-widest text-[#cbd5e1] uppercase flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#e5a93c]" />
              <span>Hero Skins ({hud.unlockedSkins.length}/{HERO_SKIN_ORDER.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-[#7c859e]">Unlock more in Camp Forge</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HERO_SKIN_ORDER.map((skinId) => {
              const s = HERO_SKINS[skinId];
              const unlocked = hud.unlockedSkins.includes(skinId);
              const active = hud.skin === skinId;
              return (
                <button
                  key={skinId}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onSelectSkin(skinId)}
                  className={`px-2.5 py-1.5 border text-xs flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-[#211c12] border-[#facc15] text-[#fef08a]'
                      : unlocked
                        ? 'bg-[#141826] border-[#2e3750] text-[#cbd5e1] hover:border-[#e5a93c]'
                        : 'bg-[#0b0e16] border-dashed border-[#202638] text-[#596178] opacity-55 cursor-not-allowed'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.accent }} />
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 4: PERMANENT ARTIFACTS */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold tracking-widest text-[#e5a93c] uppercase">
              Permanent Artifacts (Survive Death · All Heroes)
            </h3>
            <span className="font-mono text-[10px] text-[#9aa2b8]">
              {hud.ownedArtifacts.length} Bound
            </span>
          </div>

          {hud.ownedArtifacts.length === 0 ? (
            <div className="p-3 bg-[#0d1019] border border-dashed border-[#242a3d] text-xs text-[#7c859e]">
              Run Relics &amp; Upgrades apply to all 4 heroes until death. Forge Permanent Artifacts at the Camp Forge &amp; Blood Altar for bonuses that endure even after death!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {hud.ownedArtifacts.map((artId) => {
                const art = ARTIFACTS[artId];
                return (
                  <div
                    key={art.id}
                    className="p-2.5 bg-[#131d19] border border-[#2a5c45] flex items-start gap-2.5"
                  >
                    <div
                      className="w-7 h-7 shrink-0 flex items-center justify-center border bg-[#0e1312]"
                      style={{ borderColor: art.accent }}
                    >
                      {art.isSacrifice ? (
                        <Sparkles className="w-3.5 h-3.5" style={{ color: art.accent }} />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-[#34d399]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#f3efe6]">{art.name}</div>
                      <p className="text-[10px] text-[#a7b5c9] leading-snug">{art.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#23293d] text-xs text-[#8a93ab]">
          <span>Press [I] or [Esc] to close Inventory</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1b2030] hover:bg-[#252c42] border border-[#343e59] text-[#e8e4dc] font-medium"
          >
            Close (I / Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Check, Coins, Flame, Gem, Hammer, Palette, Skull, Sparkles, Unlock, X } from 'lucide-react';
import {
  ABILITIES,
  ABILITY_ORDER,
  ARTIFACT_ORDER,
  ARTIFACTS,
  canCharacterUseWeapon,
  CHARACTERS,
  CRAFT_RECIPES,
  GOLD_PREP_RECIPES,
  HERO_SKIN_ORDER,
  HERO_SKINS,
  SACRIFICE_ALTAR_OFFERINGS,
  SPECIAL_ITEM_ORDER,
  SPECIAL_ITEMS,
  WEAPON_ORDER,
  WEAPONS,
} from '../game/defaults';
import { AbilityId, ArtifactId, HeroSkinId, HudSnapshot, SacrificeAltarStat } from '../game/types';
import { AbilityIcon, ItemIcon, SpecialItemIcon, WeaponIcon } from './GameIcons';

interface CraftingModalProps {
  hud: HudSnapshot;
  onBuyGoldPrep: (recipeId: string) => void;
  onUnlockForCurrentChar: (kind: 'weapon' | 'spell' | 'special' | 'skin', id: string, coreCost: number) => void;
  onSelectSkin: (skinId: HeroSkinId) => void;
  onSacrificeRelicAltar: (stat: SacrificeAltarStat) => void;
  onCraftRecipe: (recipeId: string) => void;
  onCraftArtifact: (artifactId: ArtifactId) => void;
  onSacrificeArtifact: (artifactId: ArtifactId, sacrificedSpellId?: AbilityId) => void;
  canSacrifice: (artifactId: ArtifactId) => boolean;
  onClose: () => void;
}

export function CraftingModal({
  hud,
  onBuyGoldPrep,
  onUnlockForCurrentChar,
  onSelectSkin,
  onSacrificeRelicAltar,
  onCraftRecipe,
  onCraftArtifact,
  onSacrificeArtifact,
  canSacrifice,
  onClose,
}: CraftingModalProps) {
  const [tab, setTab] = useState<'prep' | 'unlocks' | 'altar'>('prep');
  const [selectedSacrificeSpell, setSelectedSacrificeSpell] = useState<AbilityId | null>(null);

  const activeChar = CHARACTERS[hud.characterId];
  const regularArtifacts = ARTIFACT_ORDER.filter((id) => !ARTIFACTS[id].isSacrifice);
  const sacrificeArtifacts = ARTIFACT_ORDER.filter((id) => Boolean(ARTIFACTS[id].isSacrifice));

  const effectiveSacrificeSpell: AbilityId | undefined =
    selectedSacrificeSpell && hud.unlockedAbilities.includes(selectedSacrificeSpell)
      ? selectedSacrificeSpell
      : hud.unlockedAbilities[hud.unlockedAbilities.length - 1];

  const heroWeapons = WEAPON_ORDER.filter(
    (w) => canCharacterUseWeapon(hud.characterId, w) && WEAPONS[w].ownerChar === hud.characterId
  );

  return (
    <div className="absolute inset-0 bg-[#080a10]/88 flex items-center justify-center p-4 sm:p-5 z-20">
      <div className="max-w-4xl w-full max-h-[92%] overflow-y-auto bg-[#11141f] border border-[#343b54] p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23293d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#261710] border border-[#8a451a] flex items-center justify-center">
              {tab === 'prep' ? (
                <Coins className="w-4 h-4 text-[#facc15]" />
              ) : tab === 'unlocks' ? (
                <Unlock className="w-4 h-4 text-[#f97316]" />
              ) : (
                <Skull className="w-4 h-4 text-[#ef4444]" />
              )}
            </div>
            <div>
              <h2
                className="text-lg font-bold tracking-wider text-[#e5a93c]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Camp Quartermaster, Unlocks &amp; Sacrifice Altar
              </h2>
              <p className="text-[11px] text-[#9aa2b8]">
                Buy Gold preparations, spend Boss Cores to permanently unlock gear &amp; skins for {activeChar.name}, or sacrifice 10 Relic levels for all heroes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 bg-[#221d0e] border border-[#856414] text-xs font-mono tabular-nums text-[#facc15] flex items-center gap-1.5">
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
              aria-label="Close crafting forge"
              className="p-1.5 text-[#9aa2b8] hover:text-white hover:bg-[#1c2130] border border-[#2c334a]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#23293d] pb-3">
          <button
            type="button"
            onClick={() => setTab('prep')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              tab === 'prep'
                ? 'bg-[#261f10] border-[#facc15] text-[#fef08a]'
                : 'bg-[#141824] border-[#262e45] text-[#9aa2b8] hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            1. Gold Preparations
          </button>
          <button
            type="button"
            onClick={() => setTab('unlocks')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              tab === 'unlocks'
                ? 'bg-[#241914] border-[#f97316] text-[#fed7aa]'
                : 'bg-[#141824] border-[#262e45] text-[#9aa2b8] hover:text-white'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            2. {activeChar.name} Unlocks &amp; Skins
          </button>
          <button
            type="button"
            onClick={() => setTab('altar')}
            className={`px-3 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              tab === 'altar'
                ? 'bg-[#2a1219] border-[#ef4444] text-[#fca5a5]'
                : 'bg-[#141824] border-[#262e45] text-[#9aa2b8] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            3. Sacrifice Altar (All Heroes)
          </button>
        </div>

        {/* TAB 1: GOLD PREPARATIONS + SHARD SUPPLIES */}
        {tab === 'prep' && (
          <div className="space-y-5">
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-widest text-[#facc15] uppercase">
                  Gold Raid Preparations · Potions &amp; Tactical Specials
                </h3>
                <span className="text-[10px] font-mono text-[#8a93ab]">
                  Earn Gold from enemies, Map Relics, Assassinations &amp; Bosses
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {GOLD_PREP_RECIPES.map((rec) => {
                  const specialMaxed =
                    rec.specialItemId !== undefined &&
                    (hud.specialItemCounts[rec.specialItemId] ?? 0) >=
                      SPECIAL_ITEMS[rec.specialItemId].maxCharges;
                  const canAfford = hud.gold >= rec.goldCost && !specialMaxed;
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      disabled={!canAfford}
                      data-snd="none"
                      onClick={() => onBuyGoldPrep(rec.id)}
                      className={`text-left p-3 border flex items-start gap-3 transition-colors ${
                        specialMaxed
                          ? 'bg-[#0e111a] border-[#212738] opacity-55 cursor-not-allowed'
                          : canAfford
                            ? 'bg-[#171b2a] hover:bg-[#22283d] border-[#3a425e] hover:border-[#facc15]'
                            : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-9 h-9 shrink-0 bg-[#0f131e] border border-[#3b425c] flex items-center justify-center">
                        {rec.itemId ? (
                          <ItemIcon id={rec.itemId} className="w-5 h-5" />
                        ) : rec.specialItemId ? (
                          <SpecialItemIcon id={rec.specialItemId} className="w-5 h-5" />
                        ) : (
                          <Coins className="w-4 h-4 text-[#facc15]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#f3efe6] truncate">
                            {rec.name}
                          </span>
                          <span
                            className={`font-mono tabular-nums text-[11px] font-bold shrink-0 ${
                              specialMaxed
                                ? 'text-[#687089]'
                                : canAfford
                                  ? 'text-[#facc15]'
                                  : 'text-[#ef4444]'
                            }`}
                          >
                            {specialMaxed ? 'MAX' : `${rec.goldCost}g`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9aa2b8] leading-snug">{rec.description}</p>
                        {rec.itemId && (
                          <div className="text-[10px] font-mono text-[#7c859e]">
                            Carried: x{hud.itemCounts[rec.itemId]}
                          </div>
                        )}
                        {rec.specialItemId && (
                          <div className="text-[10px] font-mono text-[#c4b5fd]">
                            Charges: {hud.specialItemCounts[rec.specialItemId] ?? 0}/
                            {SPECIAL_ITEMS[rec.specialItemId].maxCharges}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Shard Camp Supplies */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold tracking-widest text-[#cbd5e1] uppercase">
                Shard Forge Supplies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {CRAFT_RECIPES.filter(
                  (recipe) =>
                    recipe.category !== 'weapon' ||
                    !recipe.weaponId ||
                    canCharacterUseWeapon(hud.characterId, recipe.weaponId)
                ).map((recipe) => {
                  const alreadyOwnedWeapon =
                    recipe.category === 'weapon' &&
                    recipe.weaponId !== undefined &&
                    hud.unlockedWeapons.includes(recipe.weaponId);
                  const specialMaxed =
                    recipe.category === 'special_item' &&
                    recipe.specialItemId !== undefined &&
                    (hud.specialItemCounts[recipe.specialItemId] ?? 0) >=
                      SPECIAL_ITEMS[recipe.specialItemId].maxCharges;
                  const canAfford = hud.shards >= recipe.cost && !alreadyOwnedWeapon && !specialMaxed;
                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      disabled={!canAfford}
                      data-snd="none"
                      onClick={() => onCraftRecipe(recipe.id)}
                      className={`text-left p-2.5 border flex items-start gap-2.5 transition-colors ${
                        alreadyOwnedWeapon || specialMaxed
                          ? 'bg-[#0e111a] border-[#212738] opacity-55 cursor-not-allowed'
                          : canAfford
                            ? 'bg-[#161a28] hover:bg-[#1e2436] border-[#2e364f] hover:border-[#e5a93c]'
                            : 'bg-[#11141e] border-[#212738] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-8 h-8 shrink-0 bg-[#0f131e] border border-[#2f3750] flex items-center justify-center">
                        {recipe.itemId ? (
                          <ItemIcon id={recipe.itemId} className="w-4 h-4" />
                        ) : recipe.weaponId ? (
                          <WeaponIcon id={recipe.weaponId} className="w-4 h-4" />
                        ) : recipe.specialItemId ? (
                          <SpecialItemIcon id={recipe.specialItemId} className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[#e5a93c]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#f3efe6] truncate">{recipe.name}</span>
                          <span className="font-mono text-[10px] text-[#ffd166] shrink-0">
                            {alreadyOwnedWeapon ? 'OWNED' : specialMaxed ? 'MAX' : `${recipe.cost} Shards`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9aa2b8] leading-snug">{recipe.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: PERMANENT HERO UNLOCKS (WEAPONS, SPELLS, SPECIALS & SKINS) */}
        {tab === 'unlocks' && (
          <div className="space-y-5">
            <div className="p-3 bg-[#1c1512] border border-[#6b3c1e] text-xs text-[#f3d9c6]">
              <strong className="text-[#fb923c]">Hero Unlocks ({activeChar.name}):</strong> Spend{' '}
              <strong className="text-[#ff6b8b]">Boss Cores</strong> to permanently unlock {activeChar.name}&apos;s exclusive secondary weapons,{' '}
              <strong>other heroes&apos; spells</strong>, <strong>brand-new Forge-exclusive spells</strong>, Specials &amp; Hero Skins across all future runs!
            </div>

            {/* Hero Skins */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold tracking-widest text-[#e5a93c] uppercase flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>{activeChar.name} Hero Skins</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {HERO_SKIN_ORDER.map((skinId) => {
                  const sDef = HERO_SKINS[skinId];
                  const unlocked = hud.unlockedSkins.includes(skinId);
                  const equipped = hud.skin === skinId;
                  const canAfford = !unlocked && hud.bossCores >= sDef.coreCost;
                  return (
                    <button
                      key={skinId}
                      type="button"
                      disabled={!unlocked && !canAfford}
                      onClick={() =>
                        unlocked
                          ? onSelectSkin(skinId)
                          : onUnlockForCurrentChar('skin', skinId, sDef.coreCost)
                      }
                      className={`text-left p-2.5 border transition-colors ${
                        equipped
                          ? 'bg-[#211c12] border-[#facc15]'
                          : unlocked
                            ? 'bg-[#131d19] hover:bg-[#192822] border-[#2a5c45]'
                            : canAfford
                              ? 'bg-[#171b2a] hover:bg-[#22283d] border-[#394263] hover:border-[#fb923c]'
                              : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/60"
                            style={{ backgroundColor: sDef.accent }}
                          />
                          <span className="text-xs font-semibold text-[#f3efe6] truncate">{sDef.name}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold shrink-0 text-[#fde68a]">
                          {equipped ? 'ACTIVE' : unlocked ? 'EQUIP' : `${sDef.coreCost} Core`}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9aa2b8] mt-1">{sDef.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Exclusive Hero Weapons */}
            {heroWeapons.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-bold tracking-widest text-[#cbd5e1] uppercase">
                  Permanent Hero Weapons (1 Boss Core)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {heroWeapons.map((wId) => {
                    const w = WEAPONS[wId];
                    const owned = hud.charPermanentWeapons.includes(wId);
                    const canAfford = !owned && hud.bossCores >= 1;
                    return (
                      <button
                        key={wId}
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onUnlockForCurrentChar('weapon', wId, 1)}
                        className={`text-left p-2.5 border flex items-center gap-2.5 transition-colors ${
                          owned
                            ? 'bg-[#131d19] border-[#2a5c45] cursor-default'
                            : canAfford
                              ? 'bg-[#171b2a] hover:bg-[#22283d] border-[#394263] hover:border-[#e5a93c]'
                              : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="w-8 h-8 shrink-0 bg-[#0e121c] border border-[#313b57] flex items-center justify-center">
                          <WeaponIcon id={wId} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#f3efe6] truncate">{w.name}</span>
                            <span className="font-mono text-[10px] font-bold text-[#34d399]">
                              {owned ? 'UNLOCKED' : '1 Core'}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#9aa2b8] truncate">{w.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Permanent Spells & Specials */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold tracking-widest text-[#f59e0b] uppercase">
                    Brand-New Forge Spells (1 Core)
                  </h3>
                  <div className="space-y-1.5">
                    {ABILITY_ORDER.filter((id) => Boolean(ABILITIES[id].forgeOnly)).map((abId) => {
                      const ab = ABILITIES[abId];
                      const owned = hud.charPermanentSpells.includes(abId);
                      const canAfford = !owned && hud.bossCores >= 1;
                      return (
                        <button
                          key={abId}
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockForCurrentChar('spell', abId, 1)}
                          className={`w-full text-left p-2 border flex items-center gap-2.5 transition-colors ${
                            owned
                              ? 'bg-[#131d19] border-[#2a5c45] cursor-default'
                              : canAfford
                                ? 'bg-[#1e1824] hover:bg-[#2a2033] border-[#6b4226] hover:border-[#f59e0b]'
                                : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <AbilityIcon id={abId} className="w-4 h-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#f3efe6] truncate">{ab.name}</span>
                              <span className="font-mono text-[9px] px-1 py-0.2 bg-[#2e1f0f] border border-[#92400e] text-[#fbbf24]">
                                FORGE
                              </span>
                            </div>
                            <div className="text-[10px] text-[#9aa2b8] truncate">{ab.description}</div>
                          </div>
                          <span className="font-mono text-[10px] text-[#fbbf24] shrink-0">
                            {owned ? 'UNLOCKED' : '1 Core'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold tracking-widest text-[#93c5fd] uppercase">
                    Hero Signature Spells for {activeChar.name} (1 Core)
                  </h3>
                  <div className="space-y-1.5">
                    {ABILITY_ORDER.filter((id) => !ABILITIES[id].forgeOnly).map((abId) => {
                      const ab = ABILITIES[abId];
                      const owned = hud.charPermanentSpells.includes(abId);
                      const canAfford = !owned && hud.bossCores >= 1;
                      const ownerLabel = ab.starterChar ? CHARACTERS[ab.starterChar].name : null;
                      return (
                        <button
                          key={abId}
                          type="button"
                          disabled={!canAfford}
                          onClick={() => onUnlockForCurrentChar('spell', abId, 1)}
                          className={`w-full text-left p-2 border flex items-center gap-2.5 transition-colors ${
                            owned
                              ? 'bg-[#131d19] border-[#2a5c45] cursor-default'
                              : canAfford
                                ? 'bg-[#161b29] hover:bg-[#20273b] border-[#313b57] hover:border-[#60a5fa]'
                                : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <AbilityIcon id={abId} className="w-4 h-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#f3efe6] truncate">{ab.name}</span>
                              {ownerLabel && (
                                <span className="font-mono text-[9px] text-[#7c859e] shrink-0">
                                  ({ownerLabel})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#8a93ab] truncate">{ab.description}</div>
                          </div>
                          <span className="font-mono text-[10px] text-[#93c5fd] shrink-0">
                            {owned ? 'UNLOCKED' : '1 Core'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold tracking-widest text-[#d8b4fe] uppercase">
                  Permanent Specials for {activeChar.name} (1 Core)
                </h3>
                <div className="space-y-1.5">
                  {SPECIAL_ITEM_ORDER.map((spId) => {
                    const sp = SPECIAL_ITEMS[spId];
                    const owned = hud.unlockedSpecials.includes(spId);
                    const canAfford = !owned && hud.bossCores >= 1;
                    return (
                      <button
                        key={spId}
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onUnlockForCurrentChar('special', spId, 1)}
                        className={`w-full text-left p-2 border flex items-center gap-2.5 transition-colors ${
                          owned
                            ? 'bg-[#131d19] border-[#2a5c45] cursor-default'
                            : canAfford
                              ? 'bg-[#171429] hover:bg-[#231d3d] border-[#423266] hover:border-[#c084fc]'
                              : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <SpecialItemIcon id={spId} className="w-4 h-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#f3efe6] truncate">{sp.name}</div>
                          <div className="text-[10px] text-[#a78bfa] truncate">{sp.description}</div>
                        </div>
                        <span className="font-mono text-[10px] text-[#d8b4fe] shrink-0">
                          {owned ? 'UNLOCKED' : '1 Core'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: SACRIFICE ALTAR (10 RELIC LEVELS + 2 BOSS CORES -> PERMANENT ALL-HERO BONUS!) */}
        {tab === 'altar' && (
          <div className="space-y-5">
            <div className="p-3 bg-[#1c1016] border border-[#592130] text-xs text-[#e2b8c3] leading-relaxed">
              <strong className="text-[#ff6b8b]">Sacrifice Altar (Permanent Cross-Hero Ascension):</strong>{' '}
              Sacrifice <strong className="text-white">10 levels of a Run Relic</strong> +{' '}
              <strong className="text-[#ff6b8b]">2 Boss Cores</strong> to permanently empower{' '}
              <strong className="text-[#fde68a]">EVERY hero in all future runs</strong>!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Object.values(SACRIFICE_ALTAR_OFFERINGS).map((off) => {
                const curLv = hud.runRelicLevels[off.stat] ?? 0;
                const permRank = hud.permAltarBonuses[off.stat] ?? 0;
                const ready = curLv >= off.levelsRequired && hud.bossCores >= off.coreCost;
                return (
                  <div
                    key={off.stat}
                    className={`p-3 border flex flex-col justify-between gap-2.5 ${
                      ready ? 'bg-[#22121a] border-[#ef4444]' : 'bg-[#121520] border-[#262c42]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#f3efe6]">{off.name}</span>
                        <span className="font-mono text-[10px] text-[#fde68a]">Rank {permRank}</span>
                      </div>
                      <p className="text-[11px] text-[#cbd5e1]">{off.bonusLabel}</p>
                      <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                        <span className={curLv >= off.levelsRequired ? 'text-[#34d399]' : 'text-[#9aa2b8]'}>
                          {off.relicLabel}: {curLv}/{off.levelsRequired}
                        </span>
                        <span className={hud.bossCores >= off.coreCost ? 'text-[#ff6b8b]' : 'text-[#ef4444]'}>
                          {off.coreCost} Cores
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!ready}
                      onClick={() => onSacrificeRelicAltar(off.stat)}
                      className={`w-full py-1.5 text-xs font-semibold border transition-colors ${
                        ready
                          ? 'bg-[#991b2e] hover:bg-[#b52238] border-[#ef4444] text-white'
                          : 'bg-[#161a26] border-[#262d42] text-[#687089] cursor-not-allowed'
                      }`}
                    >
                      {ready ? `Sacrifice ${off.levelsRequired} Levels` : `Need ${off.levelsRequired} Lv + ${off.coreCost} Cores`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Permanent Boss Core Artifacts */}
            <section className="space-y-2.5 pt-2 border-t border-[#23293d]">
              <h3 className="text-xs font-bold tracking-widest text-[#e5a93c] uppercase">
                Permanent Artifacts · Kept Across Death ({hud.ownedArtifacts.length}/{ARTIFACT_ORDER.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {regularArtifacts.map((artId) => {
                  const art = ARTIFACTS[artId];
                  const owned = hud.ownedArtifacts.includes(artId);
                  const canAfford = !owned && hud.bossCores >= art.coreCost && hud.shards >= art.shardCost;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      disabled={!canAfford}
                      data-snd="none"
                      onClick={() => onCraftArtifact(art.id)}
                      className={`text-left p-2.5 border flex items-start gap-2.5 transition-colors ${
                        owned
                          ? 'bg-[#131d19] border-[#2a5c45] cursor-default'
                          : canAfford
                            ? 'bg-[#171b2a] hover:bg-[#20263a] border-[#394263] hover:border-[#e5a93c]'
                            : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-7 h-7 shrink-0 flex items-center justify-center border bg-[#0e121c]" style={{ borderColor: owned ? '#34d399' : art.accent }}>
                        {owned ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Sparkles className="w-3.5 h-3.5" style={{ color: art.accent }} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#f3efe6] truncate">{art.name}</span>
                          <span className="font-mono text-[10px] shrink-0 text-[#ffd166]">
                            {owned ? 'OWNED' : `${art.coreCost}C + ${art.shardCost}S`}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9aa2b8] leading-snug">{art.description}</p>
                      </div>
                    </button>
                  );
                })}
                {sacrificeArtifacts.map((artId) => {
                  const art = ARTIFACTS[artId];
                  const owned = hud.ownedArtifacts.includes(artId);
                  const eligible = !owned && canSacrifice(artId);
                  return (
                    <div key={art.id} className="p-2.5 border bg-[#16111a] border-[#452130] space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#f3efe6]">{art.name}</span>
                        <span className="font-mono text-[10px] text-[#ff6b8b]">
                          {owned ? 'BOUND' : `${art.coreCost} Core`}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#c7cddc]">{art.description}</p>
                      {!owned && art.sacrificeType === 'spell' && hud.unlockedAbilities.length >= 2 && (
                        <div className="flex flex-wrap gap-1">
                          {hud.unlockedAbilities.map((abId) => (
                            <button
                              key={abId}
                              type="button"
                              onClick={() => setSelectedSacrificeSpell(abId)}
                              className={`px-1.5 py-0.5 border text-[9px] ${effectiveSacrificeSpell === abId ? 'border-[#ef4444] text-white bg-[#2e1620]' : 'border-[#2b3248] text-[#9aa2b8]'}`}
                            >
                              {ABILITIES[abId].shortName}
                            </button>
                          ))}
                        </div>
                      )}
                      {!owned && (
                        <button
                          type="button"
                          disabled={!eligible}
                          onClick={() =>
                            onSacrificeArtifact(
                              art.id,
                              art.sacrificeType === 'spell' ? effectiveSacrificeSpell : undefined
                            )
                          }
                          className={`w-full py-1 text-[11px] font-semibold border ${
                            eligible ? 'bg-[#991b2e] border-[#ef4444] text-white' : 'bg-[#151824] border-[#262b3d] text-[#687089]'
                          }`}
                        >
                          {eligible ? 'Perform Blood Sacrifice' : art.sacrificeLabel ?? 'Requirements Not Met'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#23293d] text-xs text-[#8a93ab]">
          <span>Gold Preparations refresh supplies · Hero Unlocks &amp; Altar Bonuses stay forever!</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1b2030] hover:bg-[#252c42] border border-[#343e59] text-[#e8e4dc] font-medium"
          >
            Back to Camp (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

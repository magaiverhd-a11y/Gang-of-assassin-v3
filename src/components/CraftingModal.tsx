import { useState } from 'react';
import { Check, Flame, Gem, Hammer, Skull, Sparkles, X } from 'lucide-react';
import {
  ABILITIES,
  ARTIFACT_ORDER,
  ARTIFACTS,
  CRAFT_RECIPES,
  SPECIAL_ITEMS,
  WEAPONS,
} from '../game/defaults';
import { AbilityId, ArtifactId, HudSnapshot } from '../game/types';
import { AbilityIcon, ItemIcon, SpecialItemIcon, WeaponIcon } from './GameIcons';

interface CraftingModalProps {
  hud: HudSnapshot;
  onCraftRecipe: (recipeId: string) => void;
  onCraftArtifact: (artifactId: ArtifactId) => void;
  onSacrificeArtifact: (artifactId: ArtifactId, sacrificedSpellId?: AbilityId) => void;
  canSacrifice: (artifactId: ArtifactId) => boolean;
  onClose: () => void;
}

export function CraftingModal({
  hud,
  onCraftRecipe,
  onCraftArtifact,
  onSacrificeArtifact,
  canSacrifice,
  onClose,
}: CraftingModalProps) {
  const [tab, setTab] = useState<'forge' | 'sacrifice'>('forge');
  const [selectedSacrificeSpell, setSelectedSacrificeSpell] = useState<AbilityId | null>(null);

  const regularArtifacts = ARTIFACT_ORDER.filter((id) => !ARTIFACTS[id].isSacrifice);
  const sacrificeArtifacts = ARTIFACT_ORDER.filter((id) => Boolean(ARTIFACTS[id].isSacrifice));

  const effectiveSacrificeSpell: AbilityId | undefined =
    selectedSacrificeSpell && hud.unlockedAbilities.includes(selectedSacrificeSpell)
      ? selectedSacrificeSpell
      : hud.unlockedAbilities[hud.unlockedAbilities.length - 1];

  return (
    <div className="absolute inset-0 bg-[#080a10]/88 flex items-center justify-center p-5 z-20">
      <div className="max-w-4xl w-full max-h-[92%] overflow-y-auto bg-[#11141f] border border-[#343b54] p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23293d] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#261710] border border-[#8a451a] flex items-center justify-center">
              {tab === 'forge' ? (
                <Hammer className="w-4 h-4 text-[#f97316]" />
              ) : (
                <Skull className="w-4 h-4 text-[#ef4444]" />
              )}
            </div>
            <div>
              <h2
                className="text-lg font-bold tracking-wider text-[#e5a93c]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Camp Forge &amp; Blood Altar
              </h2>
              <p className="text-[11px] text-[#9aa2b8]">
                Craft supplies with Shards, or spend Boss Cores to forge permanent Artifacts kept across death on all heroes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 bg-[#181c2b] border border-[#4a3a22] text-xs font-mono tabular-nums text-[#ffd166]">
              {hud.shards} Shards
            </div>
            <div className="px-2.5 py-1 bg-[#22131c] border border-[#6e2438] text-xs font-mono tabular-nums text-[#ff6b8b] flex items-center gap-1.5">
              <Gem className="w-3.5 h-3.5" />
              <span>{hud.bossCores} Boss Cores</span>
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

        {/* Tab Bar */}
        <div className="flex items-center gap-2 border-b border-[#23293d] pb-3">
          <button
            type="button"
            onClick={() => setTab('forge')}
            className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              tab === 'forge'
                ? 'bg-[#221a14] border-[#e5a93c] text-[#fde68a]'
                : 'bg-[#141824] border-[#262e45] text-[#9aa2b8] hover:text-white'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            Forge &amp; Artifacts
          </button>
          <button
            type="button"
            onClick={() => setTab('sacrifice')}
            className={`px-3.5 py-1.5 text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              tab === 'sacrifice'
                ? 'bg-[#2a1219] border-[#ef4444] text-[#fca5a5]'
                : 'bg-[#141824] border-[#262e45] text-[#9aa2b8] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Blood Altar · Sacrifice
          </button>
          <span className="ml-auto text-[11px] font-mono text-[#7c859e]">
            Artifacts Owned: {hud.ownedArtifacts.length}/{ARTIFACT_ORDER.length}
          </span>
        </div>

        {tab === 'forge' ? (
          <div className="space-y-5">
            {/* Permanent Boss Core Artifacts */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-widest text-[#e5a93c] uppercase">
                  Permanent Artifacts · Kept Across Death (All Heroes)
                </h3>
                <span className="text-[10px] font-mono text-[#8a93ab]">
                  Bosses drop 1 Boss Core (Final Boss drops 2)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {regularArtifacts.map((artId) => {
                  const art = ARTIFACTS[artId];
                  const owned = hud.ownedArtifacts.includes(artId);
                  const canAfford =
                    !owned && hud.bossCores >= art.coreCost && hud.shards >= art.shardCost;

                  return (
                    <button
                      key={art.id}
                      type="button"
                      disabled={!canAfford}
                      data-snd="none"
                      onClick={() => onCraftArtifact(art.id)}
                      className={`text-left p-3 border flex items-start gap-3 transition-colors ${
                        owned
                          ? 'bg-[#131d19] border-[#2a5c45] cursor-default'
                          : canAfford
                            ? 'bg-[#171b2a] hover:bg-[#20263a] border-[#394263] hover:border-[#e5a93c]'
                            : 'bg-[#10131d] border-[#212738] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div
                        className="w-9 h-9 shrink-0 flex items-center justify-center border bg-[#0e121c]"
                        style={{ borderColor: owned ? '#34d399' : art.accent }}
                      >
                        {owned ? (
                          <Check className="w-4 h-4 text-[#34d399]" />
                        ) : (
                          <Sparkles className="w-4 h-4" style={{ color: art.accent }} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#f3efe6] truncate">
                            {art.name}
                          </span>
                          {owned ? (
                            <span className="font-mono text-[10px] font-bold text-[#34d399] shrink-0">
                              OWNED
                            </span>
                          ) : (
                            <span className="font-mono tabular-nums text-[10px] shrink-0 flex items-center gap-1.5">
                              <span
                                className={
                                  hud.bossCores >= art.coreCost
                                    ? 'text-[#ff6b8b]'
                                    : 'text-[#ef4444]'
                                }
                              >
                                {art.coreCost} Core{art.coreCost > 1 ? 's' : ''}
                              </span>
                              <span className="text-[#4a526a]">+</span>
                              <span
                                className={
                                  hud.shards >= art.shardCost
                                    ? 'text-[#ffd166]'
                                    : 'text-[#ef4444]'
                                }
                              >
                                {art.shardCost} Shards
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9aa2b8] leading-snug">
                          {art.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Camp Supplies & Armory Weapons */}
            <section className="space-y-2.5">
              <h3 className="text-xs font-bold tracking-widest text-[#cbd5e1] uppercase">
                Camp Supplies &amp; Armory Weapons (Shards)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {CRAFT_RECIPES.map((recipe) => {
                  const alreadyOwnedWeapon =
                    recipe.category === 'weapon' &&
                    recipe.weaponId !== undefined &&
                    hud.unlockedWeapons.includes(recipe.weaponId);
                  const specialMaxed =
                    recipe.category === 'special_item' &&
                    recipe.specialItemId !== undefined &&
                    (hud.specialItemCounts[recipe.specialItemId] ?? 0) >=
                      SPECIAL_ITEMS[recipe.specialItemId].maxCharges;
                  const canAfford =
                    hud.shards >= recipe.cost && !alreadyOwnedWeapon && !specialMaxed;

                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      disabled={!canAfford}
                      data-snd="none"
                      onClick={() => onCraftRecipe(recipe.id)}
                      className={`text-left p-3 border flex items-start gap-3 transition-colors ${
                        alreadyOwnedWeapon || specialMaxed
                          ? 'bg-[#0e111a] border-[#212738] opacity-55 cursor-not-allowed'
                          : canAfford
                            ? 'bg-[#161a28] hover:bg-[#1e2436] border-[#2e364f] hover:border-[#e5a93c]'
                            : 'bg-[#11141e] border-[#212738] opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="w-9 h-9 shrink-0 bg-[#0f131e] border border-[#2f3750] flex items-center justify-center">
                        {recipe.itemId ? (
                          <ItemIcon id={recipe.itemId} className="w-5 h-5" />
                        ) : recipe.weaponId ? (
                          <WeaponIcon id={recipe.weaponId} className="w-5 h-5" />
                        ) : recipe.specialItemId ? (
                          <SpecialItemIcon id={recipe.specialItemId} className="w-5 h-5" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-[#e5a93c]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-semibold text-[#f3efe6] truncate">
                              {recipe.name}
                            </span>
                            {recipe.weaponId && (
                              <span className="font-mono text-[9px] px-1 py-0.5 bg-[#1b2135] border border-[#323e5e] text-[#93c5fd] shrink-0 uppercase">
                                {WEAPONS[recipe.weaponId].ownerChar
                                  ? WEAPONS[recipe.weaponId].ownerChar
                                  : 'ANY HERO'}
                              </span>
                            )}
                            {recipe.specialItemId && (
                              <span className="font-mono text-[9px] px-1 py-0.5 bg-[#28153d] border border-[#7c3aed] text-[#d8b4fe] shrink-0">
                                {hud.specialItemCounts[recipe.specialItemId] ?? 0}/
                                {SPECIAL_ITEMS[recipe.specialItemId].maxCharges}
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-mono tabular-nums text-[11px] font-bold shrink-0 ${
                              alreadyOwnedWeapon || specialMaxed
                                ? 'text-[#687089]'
                                : canAfford
                                  ? 'text-[#ffd166]'
                                  : 'text-[#ef4444]'
                            }`}
                          >
                            {alreadyOwnedWeapon
                              ? 'IN ARMORY'
                              : specialMaxed
                                ? 'MAX CHARGES'
                                : `${recipe.cost} Shards`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9aa2b8] leading-snug">
                          {recipe.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          /* BLOOD ALTAR — SACRIFICE CARRIED SPELLS / UPGRADES FOR PERMANENT ARTIFACT POWERS */
          <div className="space-y-4">
            <div className="p-3 bg-[#1c1016] border border-[#592130] text-xs text-[#e2b8c3] leading-relaxed">
              <strong className="text-[#ff6b8b]">Blood Altar Ritual:</strong> Sacrifice one carried
              Spell or Upgrade from your current run along with <strong className="text-white">1 Boss Core</strong>{' '}
              to forge a permanent <strong className="text-[#ffd166]">Sacrifice Artifact</strong>.
              Once forged, its new passive power endures through death and empowers <strong className="text-white">every hero</strong>.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sacrificeArtifacts.map((artId) => {
                const art = ARTIFACTS[artId];
                const owned = hud.ownedArtifacts.includes(artId);
                const eligible = !owned && canSacrifice(artId);

                return (
                  <div
                    key={art.id}
                    className={`p-3.5 border flex flex-col justify-between gap-3 ${
                      owned
                        ? 'bg-[#131d19] border-[#2a5c45]'
                        : eligible
                          ? 'bg-[#1a131c] border-[#5d2638]'
                          : 'bg-[#10121a] border-[#232738] opacity-75'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 shrink-0 flex items-center justify-center border bg-[#0e1018]"
                            style={{ borderColor: owned ? '#34d399' : art.accent }}
                          >
                            {owned ? (
                              <Check className="w-4 h-4 text-[#34d399]" />
                            ) : (
                              <Flame className="w-4 h-4" style={{ color: art.accent }} />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#f3efe6]">{art.name}</div>
                            <div className="font-mono text-[10px] text-[#ff6b8b]">
                              {owned ? 'PERMANENTLY BOUND' : `Cost: ${art.coreCost} Boss Core`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#c7cddc] leading-snug">
                        {art.description}
                      </p>

                      {!owned && art.sacrificeLabel && (
                        <div className="px-2 py-1 bg-[#140e15] border border-[#3a1f2b] text-[10px] font-mono text-[#fda4af]">
                          Requires: {art.sacrificeLabel}
                        </div>
                      )}

                      {/* Spell Picker for Grimoire Ember */}
                      {!owned && art.sacrificeType === 'spell' && hud.unlockedAbilities.length >= 2 && (
                        <div className="space-y-1 pt-1">
                          <div className="text-[10px] font-mono text-[#9aa2b8]">
                            Choose spell to sacrifice:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {hud.unlockedAbilities.map((abId) => {
                              const picked = effectiveSacrificeSpell === abId;
                              return (
                                <button
                                  key={abId}
                                  type="button"
                                  onClick={() => setSelectedSacrificeSpell(abId)}
                                  className={`flex items-center gap-1.5 px-2 py-1 border text-[10px] transition-colors ${
                                    picked
                                      ? 'bg-[#2e1620] border-[#ef4444] text-white'
                                      : 'bg-[#121520] border-[#2b3248] text-[#9aa2b8] hover:border-[#64748b]'
                                  }`}
                                >
                                  <AbilityIcon id={abId} className="w-3.5 h-3.5" />
                                  <span>{ABILITIES[abId].shortName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {!owned && (
                      <button
                        type="button"
                        disabled={!eligible}
                        data-snd="none"
                        onClick={() =>
                          onSacrificeArtifact(
                            art.id,
                            art.sacrificeType === 'spell' ? effectiveSacrificeSpell : undefined
                          )
                        }
                        className={`w-full py-1.5 text-xs font-semibold border transition-colors ${
                          eligible
                            ? 'bg-[#991b2e] hover:bg-[#b52238] border-[#ef4444] text-white'
                            : 'bg-[#151824] border-[#262b3d] text-[#687089] cursor-not-allowed'
                        }`}
                      >
                        {eligible ? 'Perform Blood Sacrifice' : 'Requirements Not Met'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#23293d] text-xs text-[#8a93ab]">
          <span>
            Permanent Artifacts persist through death and apply to every character.
          </span>
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

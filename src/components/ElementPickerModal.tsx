import { X } from 'lucide-react';
import { BASE_ELEMENT_ORDER, BASE_ELEMENTS } from '../game/elementFusions';
import { BaseElementId, HudSnapshot } from '../game/types';

interface ElementPickerModalProps {
  hud: HudSnapshot;
  onChoose: (id: BaseElementId) => void;
  onClose: () => void;
}

/** Next level (5, 10, 15...) where a raid offers an element choice. */
export function nextElementOfferLevel(level: number): number {
  return Math.ceil((level + 1) / 5) * 5;
}

export function ElementPickerModal({ hud, onChoose, onClose }: ElementPickerModalProps) {
  const fused = Boolean(hud.combinedElement);
  const inCamp = hud.inCamp;
  const current = hud.baseElements[0];
  const activeName = hud.combinedElement
    ? hud.combinedElement.replace(/_/g, ' ')
    : current
      ? BASE_ELEMENTS[current].name
      : null;
  const nextLv = nextElementOfferLevel(hud.level);

  return (
    <div className="absolute inset-0 bg-[#080a10]/90 overflow-y-auto z-30">
      <div className="max-w-3xl w-full mx-auto my-2 sm:my-4 bg-[#11141f] border border-[#3b2f55] p-3 sm:p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className="text-base sm:text-lg font-bold text-[#e9d5ff] break-words"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {fused ? 'Your element' : 'Choose your element'}
            </h2>
            <p className="text-xs text-[#c4b5fd] leading-relaxed break-words mt-1">
              {fused
                ? `${activeName} is fused. Camp will not replace a fusion. The next element upgrade is offered in a raid at level ${nextLv}, then every 5 levels.`
                : !inCamp
                  ? `You are in a raid. This list opens by itself at level 5, then every 5 levels. Go back to camp to pick a starting element before the next raid.`
                  : `Pick a starting element here in camp, before a raid. In a raid, another element choice appears at level 5, then every 5 levels (10, 15, 20, 25).`}
            </p>
            <p className="text-[11px] text-[#9aa2b8] mt-1 break-words">
              {activeName
                ? `Current: ${activeName}. Next raid offer: level ${nextLv}.`
                : `No element yet. Next raid offer: level ${nextLv}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close element picker"
            className="p-2 text-[#9aa2b8] hover:text-white border border-[#2c334a] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-2">
          {BASE_ELEMENT_ORDER.map((id) => {
            const def = BASE_ELEMENTS[id];
            const selected = current === id && !fused;
            return (
              <button
                key={id}
                type="button"
                disabled={fused || !inCamp}
                onClick={() => onChoose(id)}
                className={`text-left p-2.5 border space-y-1 ${
                  fused
                    ? 'opacity-70 cursor-default border-[#2a3148] bg-[#12151f]'
                    : selected
                      ? 'border-[#e9d5ff] bg-[#1c1630] cursor-pointer'
                      : 'border-[#2a3148] bg-[#151927] hover:border-[#a78bfa] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/70"
                    style={{ background: def.primaryColor, boxShadow: `0 0 8px ${def.primaryColor}` }}
                  />
                  <span className="text-sm font-bold text-[#f3efe6] break-words" style={{ fontFamily: 'var(--font-display)' }}>
                    {def.name}
                  </span>
                  {selected && <span className="ml-auto text-[10px] font-mono text-[#e9d5ff]">ON</span>}
                </div>
                <p className="text-[11px] text-[#c5cede] leading-snug break-words whitespace-normal">{def.shortDesc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

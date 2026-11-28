import React from 'react';
import { X } from 'lucide-react';
import { CREDITS, AMBIENCE, HEAVY_MUSIC, LIGHT_MUSIC } from '../game/audioManifest';

/** Required attribution (CC-BY) first, then every source used by the picked sounds and music. */
const REQUIRED = [
  'Monster / goblin vocals ("Voice Pack – Monsters N\' Such") by Alba MacKenna, CC-BY 4.0 — https://opengameart.org/content/voice-pack%E2%94%82monsters-n-such',
];

export const CreditsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-3"
      data-testid="credits-modal"
      data-snd="back"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-full flex flex-col bg-[#0f1119] border border-[#2a3145] rounded shadow-2xl text-[#e8e4dc]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3145]">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[#c9cee0]">Credits · Sound &amp; Music</h2>
          <button type="button" aria-label="Close credits" data-snd="back" onClick={onClose} className="p-1 text-[#9aa2b8] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 space-y-4 text-[12px] leading-snug">
          <section>
            <h3 className="font-semibold text-[#f0c987] mb-1">Attribution required</h3>
            <ul className="list-disc pl-5 space-y-1">
              {REQUIRED.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-2 text-[#9aa2b8]">Everything else below is CC0 / public domain (credit is given anyway), or made for this game.</p>
          </section>
          <section>
            <h3 className="font-semibold text-[#f0c987] mb-1">Soundtrack</h3>
            <p className="text-[#9aa2b8] mb-1">Heavy combat &amp; boss:</p>
            <ul className="list-disc pl-5">
              {HEAVY_MUSIC.map((t) => (
                <li key={t.id}>{t.title.replace(/^(Free|Blob|v1): /, '')}</li>
              ))}
            </ul>
            <p className="text-[#9aa2b8] mt-2 mb-1">Stealth &amp; light combat:</p>
            <ul className="list-disc pl-5">
              {LIGHT_MUSIC.map((t) => (
                <li key={t.id}>{t.title.replace(/^(Free|Blob|v1): /, '')}</li>
              ))}
            </ul>
            <p className="text-[#9aa2b8] mt-2 mb-1">Ambience ({AMBIENCE.length} beds, one per level at random):</p>
            <ul className="list-disc pl-5 columns-1 sm:columns-2">
              {AMBIENCE.map((t) => (
                <li key={t.id}>{t.title.replace(/^(Free|Blob|v1|Made \(layered\)): /, '')}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold text-[#f0c987] mb-1">Sources</h3>
            <ul className="space-y-1.5">
              {CREDITS.map((c) => (
                <li key={c.title + c.author}>
                  <span className="text-[#e8e4dc]">{c.title}</span> — {c.author} <span className="text-[#9aa2b8]">({c.license})</span>
                  {c.url && /^https?:/.test(c.url) && (
                    <>
                      {' '}
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-[#7c8bd6] underline break-all">
                        {c.url}
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[#9aa2b8]">
              Layered effects (heartbeats, flesh and bone, choir, bells, war horns, drones) were built from the CC0 recordings above. Blob Platformer sounds come from the Blob Platformer pack.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

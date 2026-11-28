import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  ClipboardPaste,
  Info,
  RotateCcw,
  Search,
  Snowflake,
  X,
} from 'lucide-react';
import { DEFAULT_TUNING } from '../game/defaults';
import { TuningConfig } from '../game/types';
import { cloneTuning, copyText, parseTuningJson } from '../game/tuningStore';
import {
  copyRoots,
  formatValue,
  getAt,
  GroupDef,
  ItemDef,
  pickRoots,
  setAt,
  TabDef,
  TUNING_TABS,
} from './tuningSchema';

interface TuningPanelProps {
  tuning: TuningConfig;
  onReplace: (next: TuningConfig) => void;
  onTestFreeze?: () => void;
  onOpenCredits?: () => void;
  onClose?: () => void;
}

interface HoverInfo {
  title: string;
  description: string;
}

const isDefault = (item: ItemDef, t: TuningConfig) =>
  JSON.stringify(getAt(t, item.path)) === JSON.stringify(getAt(DEFAULT_TUNING, item.path));

function ItemRow({
  item,
  tuning,
  onSet,
  onHover,
}: {
  item: ItemDef;
  tuning: TuningConfig;
  onSet: (path: string[], v: unknown) => void;
  onHover: (h: HoverInfo | null) => void;
}) {
  const changed = !isDefault(item, tuning);
  const hover = () => onHover({ title: item.label, description: item.desc });
  if (item.kind === 'toggle') {
    const checked = Boolean(getAt(tuning, item.path));
    return (
      <button
        type="button"
        data-tune-path={item.path.join('.')}
        onMouseEnter={hover}
        onFocus={hover}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => {
          onSet(item.path, !checked);
          hover();
          (e.currentTarget as HTMLButtonElement).blur();
        }}
        className="w-full flex items-center justify-between gap-3 -mx-2 px-2 py-1.5 text-left rounded hover:bg-[#171b27] transition-colors"
      >
        <span className={`text-xs font-medium ${changed ? 'text-[#e5a93c]' : 'text-[#e8e4dc]'}`}>
          {item.label}
          {changed && <span className="ml-1 text-[9px] align-top">●</span>}
        </span>
        <span
          className={`shrink-0 w-9 h-5 rounded-sm border flex items-center px-0.5 ${
            checked ? 'bg-[#c82333] border-[#e03e4e]' : 'bg-[#1a1e2b] border-[#2c3347]'
          }`}
          aria-hidden="true"
        >
          <span
            className={`w-3.5 h-3.5 rounded-[1px] bg-[#f4f1ea] transition-transform duration-150 ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </span>
      </button>
    );
  }
  if (item.kind === 'select') {
    const cur = Number(getAt(tuning, item.path)) || 0;
    return (
      <div
        className="flex items-center justify-between gap-2 -mx-2 px-2 py-1.5 rounded hover:bg-[#171b27] transition-colors"
        onMouseEnter={hover}
        onMouseLeave={() => onHover(null)}
        onTouchStart={hover}
      >
        <span className={`text-xs ${changed ? 'text-[#e5a93c]' : 'text-[#c5cbd9]'}`}>
          {item.label}
          {changed && <span className="ml-1 text-[9px] align-top">●</span>}
        </span>
        <select
          aria-label={item.label}
          data-tune-path={item.path.join('.')}
          value={cur}
          onChange={(e) => {
            onSet(item.path, parseInt(e.target.value, 10));
            (e.currentTarget as HTMLSelectElement).blur();
          }}
          className="max-w-[60%] bg-[#0c0f17] border border-[#262c3d] rounded px-1.5 py-1 text-[11px] text-[#e8e4dc] focus:outline-none focus:border-[#c82333]"
        >
          {item.options.map((o, i) => (
            <option key={o} value={i}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  const raw = getAt(tuning, item.path);
  const value = typeof raw === 'number' ? raw : 0;
  return (
    <div
      className="space-y-1 -mx-2 px-2 py-1 rounded hover:bg-[#171b27] transition-colors"
      onMouseEnter={hover}
      onMouseLeave={() => onHover(null)}
      onTouchStart={hover}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={changed ? 'text-[#e5a93c]' : 'text-[#c5cbd9]'}>
          {item.label}
          {changed && <span className="ml-1 text-[9px] align-top">●</span>}
        </span>
        <span className="flex items-center gap-1.5">
          <input
            type="number"
            aria-label={`${item.label} value`}
            className="w-16 bg-[#0c0f17] border border-[#262c3d] rounded px-1 py-0.5 text-right font-mono text-[11px] text-[#e8e4dc] focus:outline-none focus:border-[#c82333]"
            step={item.step}
            value={Number(value.toFixed(4))}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v)) onSet(item.path, v);
            }}
          />
          <span className="font-mono tabular-nums text-[10px] text-[#8b93a8] w-14 text-right">
            {formatValue(value, item.fmt)}
          </span>
        </span>
      </div>
      <input
        type="range"
        className="tune-slider"
        data-tune-path={item.path.join('.')}
        min={item.min}
        max={Math.max(item.max, value)}
        step={item.step}
        value={value}
        onChange={(e) => onSet(item.path, parseFloat(e.target.value))}
        onPointerUp={(e) => (e.currentTarget as HTMLInputElement).blur()}
        onKeyUp={(e) => (e.currentTarget as HTMLInputElement).blur()}
      />
    </div>
  );
}

function Group({
  group,
  tuning,
  open,
  onToggle,
  onSet,
  onHover,
  onResetGroup,
  tabLabel,
}: {
  group: GroupDef;
  tuning: TuningConfig;
  open: boolean;
  onToggle: () => void;
  onSet: (path: string[], v: unknown) => void;
  onHover: (h: HoverInfo | null) => void;
  onResetGroup: () => void;
  tabLabel?: string;
}) {
  const changedCount = group.items.filter((it) => !isDefault(it, tuning)).length;
  return (
    <section className="border border-[#1d2231] rounded bg-[#0f121a]">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-1.5 px-2.5 py-2 text-left"
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#e5a93c]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#6b7389]" />
          )}
          <span className="text-xs font-semibold text-[#e5a93c] tracking-wide">{group.title}</span>
          {tabLabel && <span className="text-[10px] text-[#6b7389]">· {tabLabel}</span>}
          {group.subtitle && !tabLabel && (
            <span className="text-[10px] text-[#5c647a] truncate">· {group.subtitle}</span>
          )}
          {changedCount > 0 && (
            <span className="ml-auto text-[10px] px-1.5 rounded bg-[#2a1f10] text-[#e5a93c]">
              {changedCount} changed
            </span>
          )}
        </button>
        {changedCount > 0 && (
          <button
            type="button"
            title="Reset this group"
            onClick={onResetGroup}
            className="px-2 py-2 text-[#6b7389] hover:text-white"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="px-2.5 pb-2.5 space-y-1">
          {group.items.map((it) => (
            <ItemRow key={it.path.join('.')} item={it} tuning={tuning} onSet={onSet} onHover={onHover} />
          ))}
        </div>
      )}
    </section>
  );
}

const btn =
  'inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#b6bccf] hover:text-white bg-[#191d2b] hover:bg-[#23293b] border border-[#2a3145] rounded transition-colors whitespace-nowrap';

export const TuningPanel: React.FC<TuningPanelProps> = ({ tuning, onReplace, onTestFreeze, onOpenCredits, onClose }) => {
  const [hovered, setHovered] = useState<HoverInfo | null>(null);
  const [tabId, setTabId] = useState<string>(TUNING_TABS[0].id);
  const [query, setQuery] = useState('');
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const tab = TUNING_TABS.find((t) => t.id === tabId) ?? TUNING_TABS[0];

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 1800);
  };

  const onSet = (path: string[], v: unknown) => onReplace(setAt(tuning, path, v));

  const isOpen = (g: GroupDef) => openMap[g.id] ?? !g.collapsed;
  const toggle = (g: GroupDef) => setOpenMap((m) => ({ ...m, [g.id]: !isOpen(g) }));
  const setAllOpen = (open: boolean, groups: GroupDef[]) =>
    setOpenMap((m) => {
      const next = { ...m };
      for (const g of groups) next[g.id] = open;
      return next;
    });

  const resetGroup = (g: GroupDef) => {
    let next = tuning;
    for (const it of g.items) next = setAt(next, it.path, getAt(DEFAULT_TUNING, it.path));
    onReplace(next);
    flash(`Reset ${g.title}`);
  };

  const resetTab = (t: TabDef) => {
    onReplace(copyRoots(tuning, DEFAULT_TUNING, t.roots));
    flash(`Reset ${t.label} tab`);
  };

  const resetAll = () => {
    if (!window.confirm('Reset ALL tuning (every tab) to defaults?')) return;
    onReplace(cloneTuning(DEFAULT_TUNING));
    flash('All tuning reset');
  };

  const copyAll = async () => {
    const json = JSON.stringify({ game: 'Nocturne Castle', version: 2, tuning }, null, 2);
    const ok = await copyText(json);
    (window as unknown as { __lastTuningCopy?: string }).__lastTuningCopy = json;
    flash(ok ? 'Copied all tuning JSON' : 'Copy blocked — use Paste box to see JSON');
    if (!ok) {
      setImportText(json);
      setImportOpen(true);
    }
  };

  const copyTab = async () => {
    const json = JSON.stringify({ game: 'Nocturne Castle', version: 2, tuning: pickRoots(tuning, tab.roots) }, null, 2);
    const ok = await copyText(json);
    flash(ok ? `Copied ${tab.label} JSON` : 'Copy blocked by browser');
  };

  const applyImport = () => {
    try {
      onReplace(parseTuningJson(importText, tuning));
      setImportOpen(false);
      setImportError(null);
      flash('Tuning imported');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const openImport = async () => {
    setImportError(null);
    setImportText('');
    setImportOpen(true);
    try {
      if (navigator.clipboard?.readText) {
        const t = await navigator.clipboard.readText();
        if (t && t.trim().startsWith('{')) setImportText(t);
      }
    } catch {
      // clipboard read not allowed: user pastes manually
    }
  };

  // Search across ALL tabs
  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return null;
    const out: { tab: TabDef; group: GroupDef }[] = [];
    for (const t of TUNING_TABS) {
      for (const g of t.groups) {
        const hitGroup = `${t.label} ${g.title} ${g.subtitle ?? ''}`.toLowerCase().includes(q);
        const items = hitGroup
          ? g.items
          : g.items.filter((it) => `${it.label} ${it.desc} ${it.path.join('.')}`.toLowerCase().includes(q));
        if (items.length) out.push({ tab: t, group: { ...g, id: `s-${t.id}-${g.id}`, items, collapsed: false } });
      }
    }
    return out;
  }, [q]);

  const changedInTab = (t: TabDef) =>
    t.groups.reduce((n, g) => n + g.items.filter((it) => !isDefault(it, tuning)).length, 0);

  return (
    <aside
      aria-label="Game Tuning Controls"
      className="relative w-screen max-w-full sm:w-[400px] shrink-0 h-full bg-[#10131c] border-l border-[#222736] flex flex-col select-none"
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[#222736] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#e8e4dc] tracking-wide">
            Tuning <span className="text-[10px] text-[#6b7389] font-normal">v2 · auto-saved</span>
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" className={btn} onClick={copyAll} title="Copy ALL tuning as JSON">
              <ClipboardCopy className="w-3 h-3" /> Copy
            </button>
            <button type="button" className={btn} onClick={openImport} title="Paste / import tuning JSON">
              <ClipboardPaste className="w-3 h-3" /> Paste
            </button>
            <button type="button" className={btn} onClick={resetAll} title="Reset every tab to defaults">
              <RotateCcw className="w-3 h-3" /> All
            </button>
            {onClose && (
              <button type="button" className={btn} onClick={onClose} aria-label="Close tuning">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#5c647a]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all settings (e.g. freeze, ghoul, jump)…"
            className="w-full bg-[#0c0f17] border border-[#262c3d] rounded pl-7 pr-2 py-1.5 text-xs text-[#e8e4dc] placeholder:text-[#4f566a] focus:outline-none focus:border-[#c82333]"
          />
        </div>
        {!searchResults && (
          <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 px-1" role="tablist">
            {TUNING_TABS.map((t) => {
              const n = changedInTab(t);
              const active = t.id === tab.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-tab={t.id}
                  onClick={() => setTabId(t.id)}
                  className={`shrink-0 px-2 py-1 text-[11px] rounded border transition-colors ${
                    active
                      ? 'bg-[#23161a] border-[#c82333] text-white'
                      : 'bg-[#141824] border-[#242a3b] text-[#9aa2b8] hover:text-white'
                  }`}
                  style={t.accent && active ? { borderColor: t.accent } : undefined}
                >
                  {t.label}
                  {n > 0 && <span className="ml-1 text-[9px] text-[#e5a93c]">{n}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {searchResults ? (
          searchResults.length === 0 ? (
            <p className="text-xs text-[#6b7389]">No settings match “{query}”.</p>
          ) : (
            searchResults.map(({ tab: t, group: g }) => (
              <Group
                key={g.id}
                group={g}
                tuning={tuning}
                open={openMap[g.id] ?? true}
                onToggle={() => setOpenMap((m) => ({ ...m, [g.id]: !(m[g.id] ?? true) }))}
                onSet={onSet}
                onHover={setHovered}
                onResetGroup={() => resetGroup(g)}
                tabLabel={t.label}
              />
            ))
          )
        ) : (
          <>
            {tab.note && <p className="text-[11px] leading-snug text-[#7d859b]">{tab.note}</p>}
            <div className="flex flex-wrap items-center gap-1">
              {tab.action === 'testFreeze' && onTestFreeze && (
                <button
                  type="button"
                  className={`${btn} !text-white !bg-[#5a1520] !border-[#c82333]`}
                  onClick={(e) => {
                    onTestFreeze();
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                  data-action="test-freeze"
                >
                  <Snowflake className="w-3 h-3" /> Test Freeze
                </button>
              )}
              {tab.action === 'credits' && onOpenCredits && (
                <button
                  type="button"
                  className={`${btn} !text-white !bg-[#2a3052] !border-[#7c8bd6]`}
                  onClick={(e) => {
                    onOpenCredits();
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                  data-action="open-credits"
                >
                  Credits
                </button>
              )}
              <button type="button" className={btn} onClick={copyTab}>
                <ClipboardCopy className="w-3 h-3" /> Copy tab
              </button>
              <button type="button" className={btn} onClick={() => resetTab(tab)}>
                <RotateCcw className="w-3 h-3" /> Reset tab
              </button>
              <button type="button" className={btn} onClick={() => setAllOpen(true, tab.groups)}>
                Expand all
              </button>
              <button type="button" className={btn} onClick={() => setAllOpen(false, tab.groups)}>
                Collapse all
              </button>
            </div>
            {tab.groups.map((g) => (
              <Group
                key={g.id}
                group={g}
                tuning={tuning}
                open={isOpen(g)}
                onToggle={() => toggle(g)}
                onSet={onSet}
                onHover={setHovered}
                onResetGroup={() => resetGroup(g)}
              />
            ))}
          </>
        )}
      </div>

      {/* Pinned explanation box */}
      <div className="shrink-0 border-t border-[#222736] bg-[#0c0f17] px-3 py-2.5 min-h-[72px] flex flex-col justify-center relative">
        {toast && (
          <div className="absolute -top-8 left-3 right-3 flex items-center gap-1.5 text-[11px] bg-[#13281b] border border-[#2f6b45] text-[#bbf7d0] rounded px-2 py-1">
            <Check className="w-3 h-3" /> {toast}
          </div>
        )}
        {hovered ? (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-[#e5a93c]">{hovered.title}</div>
            <p className="text-[11px] leading-relaxed text-[#b6bccf]">{hovered.description}</p>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-[11px] text-[#757d94] leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#5c647a]" />
            <span>Hover or tap a setting to read what it changes. Amber ● = changed from default.</span>
          </div>
        )}
      </div>

      {/* Import modal */}
      {importOpen && (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-3">
          <div className="w-full max-w-[380px] bg-[#10131c] border border-[#2a3145] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#e5a93c]">Paste tuning JSON</span>
              <button type="button" className={btn} onClick={() => setImportOpen(false)} aria-label="Close">
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-[#7d859b]">
              Paste a full export or a single tab. Unknown keys are ignored; missing keys keep their current value.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 bg-[#0c0f17] border border-[#262c3d] rounded p-2 font-mono text-[10px] text-[#e8e4dc] focus:outline-none focus:border-[#c82333]"
              placeholder='{ "tuning": { ... } }'
              data-role="import-text"
            />
            {importError && <p className="text-[11px] text-[#f87171]">{importError}</p>}
            <div className="flex justify-end gap-1">
              <button type="button" className={btn} onClick={() => setImportOpen(false)}>
                Cancel
              </button>
              <button type="button" className={`${btn} !text-white !bg-[#5a1520] !border-[#c82333]`} onClick={applyImport}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

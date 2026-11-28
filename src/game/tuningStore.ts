import { DEFAULT_TUNING } from './defaults';
import { TuningConfig } from './types';

export const TUNING_STORAGE_KEY = 'nocturne-castle.tuning.v2';

export function cloneTuning(t: TuningConfig): TuningConfig {
  return JSON.parse(JSON.stringify(t)) as TuningConfig;
}

type Plain = Record<string, unknown>;

function isPlain(v: unknown): v is Plain {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Deep-merge an (untrusted) partial tuning object onto a base.
 * Only keys that exist in the base are taken and only when the value type matches,
 * so old exports / hand-edited JSON can never break the engine.
 */
export function mergeTuning(base: TuningConfig, incoming: unknown): TuningConfig {
  const walk = (b: unknown, inc: unknown): unknown => {
    if (isPlain(b)) {
      if (!isPlain(inc)) return b;
      const out: Plain = {};
      for (const k of Object.keys(b)) {
        out[k] = k in inc ? walk(b[k], inc[k]) : b[k];
      }
      return out;
    }
    if (typeof b === 'number') {
      return typeof inc === 'number' && Number.isFinite(inc) ? inc : b;
    }
    if (typeof b === 'boolean') {
      return typeof inc === 'boolean' ? inc : b;
    }
    return b;
  };
  return walk(cloneTuning(base), incoming) as TuningConfig;
}

export const MOBILE_CONTROLS_REV_KEY = 'nocturne-castle.mobile-controls-rev';
const MOBILE_CONTROLS_REV = 2;

/**
 * v1 shipped Jump and Interact as the bottom corner buttons, with Item/Relic as mini buttons.
 * One-time migrate that exact stock layout to the v2 corners (Item + Special relic).
 * Custom layouts are left alone.
 */
function migrateMobileControls(t: TuningConfig): TuningConfig {
  if (typeof localStorage === 'undefined') return t;
  try {
    const rev = Number(localStorage.getItem(MOBILE_CONTROLS_REV_KEY) || '0');
    if (rev >= MOBILE_CONTROLS_REV) return t;
    let next = t;
    const isV1Stock =
      t.mobileBtnTopLeft === 2 &&
      t.mobileBtnTopRight === 1 &&
      t.mobileBtnBottomLeft === 3 &&
      t.mobileBtnBottomRight === 0 &&
      t.mobileMiniButtons === true;
    if (isV1Stock) {
      next = { ...t, mobileBtnBottomLeft: 4, mobileBtnBottomRight: 5, mobileMiniButtons: false };
    }
    localStorage.setItem(MOBILE_CONTROLS_REV_KEY, String(MOBILE_CONTROLS_REV));
    if (next !== t) {
      try {
        localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full / private mode
      }
    }
    return next;
  } catch {
    return t;
  }
}

export function loadStoredTuning(): TuningConfig {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(TUNING_STORAGE_KEY) : null;
    if (raw) return migrateMobileControls(mergeTuning(DEFAULT_TUNING, JSON.parse(raw)));
  } catch {
    // ignore corrupt storage
  }
  return migrateMobileControls(cloneTuning(DEFAULT_TUNING));
}

export function saveStoredTuning(t: TuningConfig): void {
  try {
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(t));
  } catch {
    // storage full / private mode
  }
}

export function clearStoredTuning(): void {
  try {
    localStorage.removeItem(TUNING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Parse pasted text: accepts the full export or the `{ "tuning": {...} }` wrapper. */
export function parseTuningJson(text: string, base: TuningConfig): TuningConfig {
  const parsed = JSON.parse(text) as unknown;
  const payload = isPlain(parsed) && isPlain(parsed.tuning) ? parsed.tuning : parsed;
  if (!isPlain(payload)) throw new Error('Not a tuning object');
  return mergeTuning(base, payload);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

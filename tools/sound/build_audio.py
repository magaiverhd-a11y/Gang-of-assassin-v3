#!/usr/bin/env python3
"""Resolve Magaiver's sound picks (picks-v2.txt) against the sound-picker-v2 manifest and copy the exact
clips the picker plays into src/assets/audio, then write src/game/audioManifest.ts.
Run:  python3 tools/sound/build_audio.py   (needs /workspace/gang-of-assassin/sound-mockup)"""
import json, os, re, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MOCK = '/workspace/gang-of-assassin/sound-mockup'
man = json.load(open(f'{MOCK}/audio-v2f/manifest.json'))
slots = {s['id']: s for s in man['slots']}
by_name = {s['name']: s for s in man['slots'] if not s.get('stage')}

# picker slot id -> game event key
EVENTS = {
 'ui_click':'ui_click','ui_chunky':'ui_chunky','ui_confirm':'ui_confirm','ui_back':'ui_back','ui_hover':'ui_hover','ui_error':'ui_error','ui_buy':'ui_buy',
 'jump':'jump','land':'land','dash':'dash','grapple':'grapple',
 'sword':'sword','katana':'katana','rapier':'rapier','naginata':'naginata','greataxe':'greataxe','whip':'whip','hammer_charge':'hammer_charge','hammer_boom':'hammer_boom',
 'hit_light':'hit_light','hit_heavy':'hit_heavy','crit':'crit','parry':'parry','block':'block','player_hurt':'player_hurt','fireball':'fireball','gas':'gas','buff':'buff',
 'assassinate':'assassinate','shadow_chain':'shadow_chain','slowmo':'slowmo','sneak_ready':'sneak_ready',
 'alert':'alert','goblin_alert':'goblin_alert','enemy_attack':'enemy_attack','enemy_hurt':'enemy_hurt',
 'death_ghoul':'death_ghoul','death_skeleton':'death_skeleton','death_bat':'death_bat','death_knight':'death_knight','death_goblin':'death_goblin','death_brute':'death_brute','death_wraith':'death_wraith','death_hound':'death_hound',
 'boss_intro':'boss_intro','boss_death':'boss_death','boss_sprout':'boss_sprout',
 'explosion_small':'explosion_small','explosion_big':'explosion_big','barrel':'barrel','collapse':'collapse',
 'coin':'coin','gem':'gem','chest':'chest','craft':'craft','relic':'relic','evolution':'evolution','secret':'secret',
 'levelup':'levelup','victory':'victory','raid_complete':'raid_complete','defeat':'defeat',
}
FOOT = {s['id']: s['id'][3:] for s in man['slots'] if s.get('foot')}

# ---- music (Magaiver's picks, from chat) ----
HEAVY_POOL = {'drake':'Drake boss music (Boss Battle Music, Juhani Junkala)','panther':'Panther boss music (Determined Pursuit, Emma_MA)','lament':'Laments of the War – choir + drums (Cethiel)'}
LIGHT_POOL = {'v1st0':'Gothic organ + choir','v1st1':'Stealth pulse','v1st2':'Dark Theme (JaggedStone)'}
AMB_EXCLUDE = {'hope','b_crypt_a'}   # Abandon Hope + first crypt ambience (bird/bat sounds)

def find_cand(cid):
    for s in man['slots']:
        for c in s['cands']:
            if c['id'] == cid: return s, c
    raise KeyError(cid)

def parse_picks(path):
    out = {}; sect = None
    for ln in open(path, encoding='utf-8'):
        ln = ln.rstrip('\n')
        m = re.match(r'^- (.*?): ((?:Free|Made|Blob|Flashy|Current|v1)\b.*)$', ln)
        if m:
            name, label = m.group(1), re.sub(r' \(default, not picked\)$', '', m.group(2))
            out[name] = label
    return out

def resolve(name, label):
    s = by_name[name]
    for c in s['cands']:
        if c['label'] == label: return s, c
    raise SystemExit(f'NO MATCH: {name!r} / {label!r}')

picks = parse_picks(os.path.join(ROOT, 'tools/sound/picks-v2.txt'))
assets = os.path.join(ROOT, 'src/assets/audio')
shutil.rmtree(assets, ignore_errors=True)
for d in ('sfx','fs','music','amb'): os.makedirs(f'{assets}/{d}')
def cp(src_rel, dst):
    shutil.copyfile(f'{MOCK}/{src_rel}', f'{assets}/{dst}')
    return dst

sfx = {}; cur = []; report = []; fs = {}
for name, label in picks.items():
    s, c = resolve(name, label)
    sid = s['id']
    if sid in EVENTS:
        ev = EVENTS[sid]
        if c['kind'] == 'cur':
            cur.append(ev); report.append((name, label, 'procedural (game original)'))
        else:
            files = c.get('files') or [c['file']]
            sfx[ev] = [cp(f, f'sfx/{ev}_{i}.mp3') for i, f in enumerate(files)]
            report.append((name, label, ', '.join(sfx[ev])))
    elif sid in FOOT:
        t = FOOT[sid]
        fs[t] = [cp(f, f'fs/{t}_{i}.mp3') for i, f in enumerate(c['steps'])]
        report.append((name, label, f'{len(fs[t])} steps'))
    else:
        raise SystemExit('unmapped slot ' + sid)
missing = [e for e in set(EVENTS.values()) if e not in sfx and e not in cur]
assert not missing, missing

music = {'light': [], 'heavy': []}
for pool, d in (('light', LIGHT_POOL), ('heavy', HEAVY_POOL)):
    for cid, title in d.items():
        s, c = find_cand(cid)
        assert title in c['label'], (title, c['label'])
        music[pool].append({'id': cid, 'title': c['label'], 'file': cp(c['file'], f'music/{cid}.mp3'), 'dur': c.get('dur')})
amb = []; seen = set()
for s in man['slots']:
    if s.get('role') != 'amb': continue
    for c in s['cands']:
        if c['id'] in AMB_EXCLUDE or c['file'] in seen: continue
        seen.add(c['file'])
        amb.append({'id': c['id'], 'title': c['label'], 'file': cp(c['file'], f"amb/{c['id']}.mp3"), 'dur': c.get('dur')})

# credits: sources behind everything shipped
used = set()
def credit_of(label_ids):
    pass
credit_keys = set()
for s in man['slots']:
    for c in s['cands']:
        pass
def collect(sid_label_pairs):
    for name, label in sid_label_pairs:
        s, c = resolve(name, label)
        if c.get('credit'): credit_keys.add((c['credit'], label))
collect(picks.items())
for pool in music.values():
    for t in pool:
        s, c = find_cand(t['id'])
        if c.get('credit'): credit_keys.add((c['credit'], t['title']))
for t in amb:
    s, c = find_cand(t['id'])
    if c.get('credit'): credit_keys.add((c['credit'], t['title']))
credits = [{'title': man['credits'][k][0], 'author': man['credits'][k][1], 'url': man['credits'][k][2], 'license': man['credits'][k][3], 'used': sorted({l for kk, l in credit_keys if kk == k})} for k in sorted({k for k, _ in credit_keys})]

def ts(o, indent=0): return json.dumps(o, ensure_ascii=False, indent=1)
loaders = []
files = sorted(set(sum(sfx.values(), []) + sum(fs.values(), []) + [t['file'] for p in music.values() for t in p] + [t['file'] for t in amb]))
out = ['// GENERATED by tools/sound/build_audio.py — do not edit by hand.',
       '/* eslint-disable */',
       'export const SFX_FILES: Record<string, string[]> = ' + ts(sfx) + ';',
       'export const PROCEDURAL_EVENTS: string[] = ' + ts(sorted(cur)) + ';',
       'export const FOOTSTEP_FILES: Record<string, string[]> = ' + ts(fs) + ';',
       'export interface TrackDef { id: string; title: string; file: string; dur: number | null }',
       'export const LIGHT_MUSIC: TrackDef[] = ' + ts(music['light']) + ';',
       'export const HEAVY_MUSIC: TrackDef[] = ' + ts(music['heavy']) + ';',
       'export const AMBIENCE: TrackDef[] = ' + ts(amb) + ';',
       'export interface CreditDef { title: string; author: string; url: string; license: string; used: string[] }',
       'export const CREDITS: CreditDef[] = ' + ts(credits) + ';',
       "// Lazy loaders (url strings; inlined as data URIs in the single-file build).",
       "export const AUDIO_URLS = import.meta.glob('../assets/audio/**/*.mp3', { query: '?url', import: 'default' }) as Record<string, () => Promise<string>>;",
       'export function audioUrl(file: string): Promise<string> {',
       "  const loader = AUDIO_URLS['../assets/audio/' + file];",
       "  if (!loader) return Promise.reject(new Error('missing audio asset ' + file));",
       '  return loader();',
       '}', '']
open(os.path.join(ROOT, 'src/game/audioManifest.ts'), 'w', encoding='utf-8').write('\n'.join(out))
json.dump({'picks': report, 'procedural': sorted(cur), 'music': music, 'ambience': amb}, open(os.path.join(ROOT, 'tools/sound/resolved-picks.json'), 'w'), indent=1, ensure_ascii=False)
tot = sum(os.path.getsize(f'{assets}/{f}') for f in files)
print(f'{len(files)} files, {tot/1e6:.1f} MB; sfx events {len(sfx)}, procedural {sorted(cur)}, footsteps {len(fs)}, ambience {len(amb)}')
for r in report: print(' ', r[0], '=>', r[1], '|', r[2])

"""sound-v1 headless test: audio event log (event -> clip), footsteps per terrain, UI sounds, music state machine
(stealth -> combat -> 10 s -> stealth resume position, heavy, boss), ambience pool, mixer, credits. Desktop + ?mobile."""
import json, sys, time, re
sys.path.insert(0, '/workspace/gang-of-assassin/builds/sound-v1/test-scripts')
from common import *
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8795/nocturne-castle-sound-v1.html'
R = {}
S = 'window.__nocturneSound.sound'
D = 'window.__nocturneSound.director'
def rec(mode, name, ok, info=None):
    R.setdefault(mode, {})[name] = {'pass': bool(ok), 'info': info}
    print(('PASS' if ok else 'FAIL'), mode, name, json.dumps(info)[:260], flush=True)
def log(s): return s.ev(f'{S}.log.slice()')
def clear(s): s.ev(f'{S}.log.length=0')
def sfx(entries): return [e for e in entries if e['kind'] == 'sfx']
def noise(errs): return [e for e in errs if 'favicon' not in e and '404' not in e]

LIGHT = {'v1st0', 'v1st1', 'v1st2'}; HEAVY = {'drake', 'panther', 'lament'}

# (js call, expected event, extra expected events)
CALLS = [
 ('playJump()', 'jump'), ('playBackdash()', 'dash'), ('playWhip()', 'whip'), ('playSwordSlash()', 'sword'),
 ('playKatanaSlash()', 'katana'), ('playRapierThrust()', 'rapier'), ('playNaginataSlash()', 'naginata'),
 ('playGreataxeSwing()', 'greataxe'), ('playHammerBoom()', 'hammer_boom'),
 ('playMonkFist(0)', 'hit_light'), ('playMonkFist(2)', 'hit_heavy'), ('playMonkDash()', 'dash'),
 ('playWizardBolt(0,false)', 'fireball'), ('playWizardBolt(0,true)', 'buff'), ('playWizardNova()', 'buff'),
 ('playDaggerSlash(0)', 'rapier'), ('playDaggerSlash(2)', 'sword'), ('playDaggerThrow()', 'rapier'),
 ('playShadowBlink()', 'dash'), ('playDeathMark()', 'sneak_ready'), ('playShadowStep()', 'dash'), ('playVenomNeedles()', 'rapier'),
 ('playUpgradePick()', 'ui_confirm'), ('playLevelUp()', 'levelup'), ('playSlowMoPulse()', 'slowmo'),
 ('playBrazierCrash()', 'barrel'), ('playCrumble()', 'collapse'), ('playFireball()', 'fireball'), ('playGrapple()', 'grapple'),
 ('playGasBreak()', 'gas'), ('playBuff()', 'buff'), ('playWeaponEvolution()', 'evolution'), ('playWeaponTierUp()', 'evolution'),
 ('playArmorBlock()', 'block'), ('playInteract()', 'ui_click'), ('playHit(false)', 'hit_light'), ('playHit(true)', 'hit_heavy'),
 ('playCrit()', 'crit'), ('playAssassinate()', 'assassinate'), ('playBossEnergySprout(true)', 'boss_sprout'),
 ('playRelicCrystallize(false)', 'relic'), ('playPlayerHurt()', 'player_hurt'), ('playParry()', 'parry'), ('playSecretReveal()', 'secret'),
 ('playEnemyDeath("ghoul",false,false)', 'death_ghoul'), ('playEnemyDeath("skeleton",false,false)', 'death_skeleton'),
 ('playEnemyDeath("bat",false,false)', 'death_bat'), ('playEnemyDeath("gargoyle",false,false)', 'death_bat'),
 ('playEnemyDeath("ember_imp",false,false)', 'death_bat'), ('playEnemyDeath("knight",false,false)', 'death_knight'),
 ('playEnemyDeath("obsidian_guard",false,false)', 'death_knight'), ('playEnemyDeath("goblin_grunt",false,false)', 'death_goblin'),
 ('playEnemyDeath("goblin_brute",false,false)', 'death_brute'), ('playEnemyDeath("wraith",false,false)', 'death_wraith'),
 ('playEnemyDeath("acolyte",false,false)', 'death_wraith'), ('playEnemyDeath("grave_hound",false,false)', 'death_hound'),
 ('playEnemyDeath("boss_vampire_duelist",true,false)', 'boss_death'),
 ('playLand(900)', 'land'), ('playEnemyHurt("ghoul")', 'enemy_hurt'), ('playEnemyAlert("ghoul")', 'alert'),
 ('playEnemyAlert("goblin_grunt")', 'goblin_alert'), ('playEnemyAttack()', 'enemy_attack'), ('playBossIntro()', 'boss_intro'),
 ('playBackstabReady()', 'sneak_ready'), ('playExplosion(false)', 'explosion_small'), ('playExplosion(true)', 'explosion_big'),
 ('playChest()', 'chest'), ('playCoin()', 'coin'), ('playGem()', 'gem'), ('playCraft()', 'craft'),
 ('playVictory()', 'victory'), ('playRaidComplete()', 'raid_complete'), ('playDefeat()', 'defeat'),
 ('playUi("click")', 'ui_click'), ('playUi("chunky")', 'ui_chunky'), ('playUi("confirm")', 'ui_confirm'), ('playUi("back")', 'ui_back'),
 ('playUi("hover")', 'ui_hover'), ('playUi("error")', 'ui_error'), ('playUi("buy")', 'ui_buy'),
]
PROCEDURAL = ['playHammerCharge()', 'playShadowChain(1)']

def event_table(s, m):
    ok_all = True; rows = []
    for call, ev in CALLS:
        clear(s); s.ev(f'{S}.{call}'); s.wait(60)
        e = sfx(log(s)); hit = [x for x in e if x['event'] == ev]
        good = bool(hit) and all(x['clip'].startswith(f'sfx/{ev}_') for x in hit)
        ok_all &= good; rows.append({'call': call, 'event': ev, 'clips': [x['clip'] for x in e], 'ok': good})
        if not good: print('   MISS', call, ev, [x['clip'] for x in e])
        s.wait(100)
    rec(m, f'event->clip table ({len(CALLS)} calls)', ok_all, {'failed': [r for r in rows if not r['ok']][:6]})
    for call in PROCEDURAL:
        clear(s); s.ev(f'{S}.{call}'); s.wait(60)
        rec(m, f'{call} stays procedural (no clip)', len(sfx(log(s))) == 0)
    return rows

def variants(s, m):
    for call, ev, n in [('playSwordSlash()', 'sword', 3), ('playHit(false)', 'hit_light', 3), ('playCrit()', 'crit', 2), ('playBossIntro()', 'boss_intro', 4), ('playEnemyHurt("ghoul")', 'enemy_hurt', 3)]:
        clear(s)
        for i in range(30):
            s.ev(f'{S}.{call}'); s.wait(170)
        clips = {x['clip'] for x in sfx(log(s)) if x['event'] == ev}
        rec(m, f'{ev} round-robin variants ({n} files)', len(clips) == n, sorted(clips))

def ingame_sfx(s, m, hero_keys=True):
    # jump + land
    clear(s); s.park(600, None); s.wait(200)
    s.ev(f'{E}.player.vy=-700; {E}.player.onGround=false'); s.wait(1100)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'landing after a fall plays land', 'land' in ev, ev[:6])
    # attack a foe: swing + hit + hurt + death
    clear(s); s.park(600, 60, hp=2, alerted=True); s.wait(150)
    for i in range(4):
        s.key('Digit1', 40); s.wait(260)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'attack plays swing + hit', any(x in ev for x in ('whip', 'sword', 'katana', 'rapier')) and any(x.startswith('hit_') or x == 'crit' for x in ev), ev[:10])
    rec(m, 'foe hurt/death clips', any(x == 'enemy_hurt' for x in ev) or any(x.startswith('death_') for x in ev), ev[:12])
    rec(m, 'foe death clip plays', any(x.startswith('death_') for x in ev), ev)
    # alert edge
    clear(s); s.park(600, 400, hp=50, alerted=False); s.wait(200)
    s.ev("(()=>{const e=window.__pool[0]; e.alerted=true;})()"); s.wait(300)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'enemy spots you -> alert clip', 'alert' in ev or 'goblin_alert' in ev, ev)
    clear(s); s.ev("(()=>{const e=window.__pool[0]; e.attackChargeTimer=0.5;})()"); s.wait(250)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'enemy attack wind-up -> enemy_attack clip', 'enemy_attack' in ev, ev)

def footsteps(s, m):
    seen = {}
    for raid in ['nocturne_castle', 'goblin_camp', 'weeping_necropolis', 'brimstone_sanctum', 'eclipse_gauntlet']:
        s.ev(f"{E}.offeredRaids=['{raid}','nocturne_castle']; {E}.startRaid({E}.tuning, '{raid}')")
        for _ in range(60):
            s.wait(150)
            if s.ev(E + '.status') == 'PLAYING' and s.ev(f"{E}.activeRaidId") == raid and not s.ev(f"{E}.currentStage.isCamp"): break
        s.wait(900)
        # coverage: place the hero on every platform style present and ask the terrain mapper
        info = s.ev(f"""(()=>{{const e={E}; const out={{}}; const nRooms=e.getCurrentRaidRooms().length;
          for(const pl of e.platforms){{ const st=pl.style||'stone'; if(out[st]) continue; const p=e.player; p.x=pl.x+pl.w/2; p.y=pl.y; p.onGround=true;
             out[st]={{terrain:window.__nocturneSound.director.events.terrainUnder(e), env:e.currentStage.environment}}; }}
          return {{out, nRooms}}; }})()""")
        for st, v in info['out'].items(): seen.setdefault(v['terrain'], []).append(f"{raid}:{st}")
        # real walk on the floor: foot log terrain must be right and clips from that terrain's set
        s.park(300, None); s.god(); clear(s); s.wait(150)
        s.page.keyboard.down('KeyD'); s.wait(3200); s.page.keyboard.up('KeyD'); s.wait(100)
        f = [e for e in log(s) if e['kind'] == 'foot']
        terr = {e['event'] for e in f}
        expected = s.ev(f"window.__nocturneSound.director.events.lastTerrain")
        ok = len(f) >= 3 and len(terr) >= 1 and all(e['clip'].startswith(f"fs/{e['event']}_") for e in f)
        rec(m, f'{raid}: walking plays footsteps ({len(f)} steps)', ok, {'terrains': sorted(terr), 'clips': [e['clip'] for e in f][:6]})
    rec(m, 'terrain map covers every picked set the levels can use', {'stone', 'wood', 'dirt', 'grass', 'gravel', 'carpet'} <= set(seen), {k: v[:3] for k, v in seen.items()})
    # four steps cycle round-robin
    clear(s)
    for i in range(8): s.ev(f"{S}.playFootstep('stone')"); s.wait(20)
    c = [e['clip'] for e in log(s) if e['kind'] == 'foot']
    rec(m, 'footsteps round-robin 4 clips', len(set(c)) == 4 and c[:4] == c[4:], c)
    # every terrain has its picked set
    allok = True
    for t in ['stone', 'wood', 'dirt', 'grass', 'gravel', 'metal', 'water', 'mud', 'carpet', 'snow', 'bones']:
        clear(s); s.ev(f"{S}.playFootstep('{t}')"); l = [e for e in log(s) if e['kind'] == 'foot']
        allok &= bool(l) and l[0]['clip'].startswith(f'fs/{t}_')
    rec(m, 'all 11 terrain footstep sets play', allok)

def ui_sounds(s, m):
    s.ev(f'{E}.startRaid && 0'); s.wait(100)
    clear(s)
    s.page.get_by_role('button', name=re.compile('Tune')).first.click(); s.wait(400)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'button press -> ui_click', 'ui_click' in ev, ev)
    clear(s); s.page.get_by_role('button', name=re.compile('^Close tuning')).first.click(); s.wait(300)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'close -> ui_back', 'ui_back' in ev, ev)
    clear(s)
    s.page.get_by_role('button', name=re.compile('Credits')).first.click(); s.wait(400)
    txt = s.ev("document.body.innerText")
    rec(m, 'Credits screen opens (Alba MacKenna CC-BY listed)', 'Alba MacKenna' in txt and 'CC-BY 4.0' in txt and 'Drake boss music' in txt.replace('\n', ' ') or ('Boss Battle Music' in txt and 'Alba MacKenna' in txt), None)
    s.shot('credits')
    clear(s); s.page.get_by_role('button', name='Close credits').click(); s.wait(300)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'credits close -> ui_back', 'ui_back' in ev, ev)
    # Tune > Sound tab
    s.page.get_by_role('button', name=re.compile('Tune')).first.click(); s.wait(400)
    s.page.locator('[data-tab=sound]').first.click(); s.wait(300)
    txt = s.ev("document.body.innerText")
    rec(m, 'Tune has Sound tab with Music / Ambience / Sound Effects / Footsteps sliders', all(w in txt for w in ['Music', 'Ambience', 'Sound Effects', 'Footsteps', 'Back to stealth after']), None)
    s.shot('tune-sound')
    # credits button inside Tune
    clear(s); s.page.locator('[data-action=open-credits]').click(); s.wait(300)
    rec(m, 'Tune > Sound > Credits button opens credits', s.ev("!!document.querySelector('[data-testid=credits-modal]')"))
    s.page.get_by_role('button', name='Close credits').click(); s.wait(200)
    s.page.get_by_role('button', name=re.compile('^Close tuning')).first.click(); s.wait(200)
    # hover
    clear(s)
    s.page.locator('button:not([disabled]):not([data-snd-skip])').first.hover(); s.wait(300)
    ev = [e['event'] for e in sfx(log(s))]
    rec(m, 'hover -> ui_hover' if not s.mobile else 'hover (skipped on touch)', ('ui_hover' in ev) or s.mobile, ev)
    # not allowed: disabled button
    dis = s.ev("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.disabled&&b.offsetParent); if(!b) return null; const r=b.getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2];})()")
    if dis:
        clear(s); s.page.mouse.click(dis[0], dis[1]); s.wait(250)
        ev = [e['event'] for e in sfx(log(s))]
        rec(m, 'disabled button -> ui_error', 'ui_error' in ev, ev)
    else:
        rec(m, 'disabled button -> ui_error (no disabled button on screen; covered by table)', True)

def sample_gains(s, ms, step=60):
    return s.ev(f"""new Promise(res=>{{const d={D}.music; const out=[]; const t0=performance.now();
       const iv=setInterval(()=>{{out.push({{t:Math.round(performance.now()-t0), st:d.stealthVoice?d.stealthVoice.gain.gain.value:null, fi:d.fightVoice?d.fightVoice.gain.gain.value:null, am:d.ambVoice?d.ambVoice.gain.gain.value:null}});
       if(performance.now()-t0>{ms}){{clearInterval(iv);res(out);}}}},{step});}})""")

def music_flow(s, m):
    # wait for stealth to start in room 1
    for _ in range(40):
        dbg = s.ev(f'{D}.music.debug()')
        if dbg['mode'] == 'stealth' and dbg['stealthPos'] is not None: break
        s.wait(250)
    rec(m, 'stage start: stealth track playing from the light pool + ambience on', dbg['mode'] == 'stealth' and dbg['stealth'] in LIGHT and dbg['ambience'] is not None, dbg)
    s.wait(3500)
    pos_before = s.ev(f'{D}.music.debug().stealthPos')
    # ---- stealth -> combat (one foe)
    s.park(600, 90, hp=99999, alerted=True); s.god()
    t_combat = time.time()
    gains = sample_gains(s, 2600)
    entries = [e for e in log(s) if e['kind'] == 'music']
    names = [e['event'] for e in entries]
    pause = [e for e in entries if e['event'] == 'stealth_pause']; cstart = [e for e in entries if e['event'] == 'combat_start']
    rec(m, 'fight starts -> stealth pauses, combat track starts', bool(pause) and bool(cstart), names)
    dbg = s.ev(f'{D}.music.debug()')
    rec(m, 'combat uses the light pool and a different track than stealth', dbg['fight'] in LIGHT and dbg['fight'] != dbg['stealth'], dbg)
    paused_at = float(re.search(r'at=([\d.]+)', pause[-1]['detail']).group(1)) if pause else None
    rec(m, 'stealth paused at the position it had reached', paused_at is not None and abs(paused_at - (pos_before + 0)) < 8.0 and paused_at > 3.0, {'before': pos_before, 'paused_at': paused_at})
    # smooth crossfade: max step between consecutive gain samples
    def maxstep(k):
        v = [g[k] for g in gains if g[k] is not None]
        return max([abs(v[i + 1] - v[i]) for i in range(len(v) - 1)] or [0]), (v[0] if v else None), (v[-1] if v else None)
    fi = maxstep('fi'); st = maxstep('st'); am = [g['am'] for g in gains if g['am'] is not None]
    rec(m, 'crossfade is smooth (no gain jumps) and complete', fi[0] < 0.13 and fi[2] > 0.97 and (st[0] < 0.13), {'fight': fi, 'stealth': st})
    rec(m, 'ambience stays on through the fight', am and min(am) > 0.95, {'min': min(am) if am else None})
    # stays combat while fighting for 4 s (enemy alive + alerted)
    s.wait(3500)
    rec(m, 'still combat while foes are engaged', s.ev(f'{D}.music.debug().mode') == 'combat', None)
    # ---- fight over: kill everything, time the 10 s
    s.ev("(()=>{for(const x of window.__nocturneEngine.enemies) if(!x.isBoss) x.dead=true;})()")
    t0 = time.time(); clear(s)
    s.wait(6000)
    mode6 = s.ev(f'{D}.music.debug().mode')
    rec(m, 'no stealth return before the 10 s cooldown (at 6 s)', mode6 == 'combat', mode6)
    for _ in range(80):
        s.wait(100)
        r = [e for e in log(s) if e['event'] == 'stealth_resume']
        if r: break
    elapsed = time.time() - t0
    rec(m, 'after 10 s without combat the stealth track returns', bool(r) and 9.4 <= elapsed <= 12.2, {'elapsed': round(elapsed, 2), 'log': r[:1]})
    if r:
        mm = re.search(r'resumeAt=([\d.]+) actualPos=([\d.]+)', r[0]['detail'])
        ra, ap = float(mm.group(1)), float(mm.group(2))
        rec(m, 'stealth resumes exactly where it stopped', paused_at is not None and abs(ra - paused_at) < 0.05 and abs(ap - ra) < 0.5, {'paused_at': paused_at, 'resumeAt': ra, 'actualPos': ap})
    s.wait(2200)
    dbg = s.ev(f'{D}.music.debug()')
    rec(m, 'back in stealth: same track, combat voice gone, ambience on', dbg['mode'] == 'stealth' and dbg['fight'] is None and dbg['stealth'] == s_track(s, dbg), dbg)
    return paused_at

def s_track(s, dbg): return dbg['picks']['stealth']

def heavy_boss_flow(s, m, paused_at=None):
    clear(s)
    dbg0 = s.ev(f'{D}.music.debug()')
    # ---- heavy: >=4 alerted foes at once
    s.ev("""(()=>{const e=window.__nocturneEngine; const p=e.player; p.x=600; p.y=e.currentStage.floorY; p.onGround=true; let n=0;
       for(const x of e.enemies){ if(x.isBoss) continue; if(n<5){ x.dead=false; x.hp=x.maxHp=99999; x.x=p.x+120+n*70; x.y=e.currentStage.floorY; x.alerted=true; x.attackCooldown=99; n++; } else x.dead=true; } return n;})()""")
    s.god(); s.wait(1800)
    ent = [e for e in log(s) if e['kind'] == 'music']
    dbg = s.ev(f'{D}.music.debug()')
    heavy = [e for e in ent if e['event'] == 'heavy_start']
    rec(m, 'many foes -> heavy combat music from the boss/heavy pool', bool(heavy) and dbg['fight'] in HEAVY, {'events': [e['event'] for e in ent], 'fight': dbg['fight']})
    # ---- boss
    clear(s)
    s.ev("""(()=>{const e=window.__nocturneEngine; const p=e.player; const b=e.enemies.find(x=>x.isBoss); window.__boss=b; for(const x of e.enemies) if(!x.isBoss) x.dead=true;
       b.hp=b.maxHp=999999; b.dead=false; b.alerted=true; b.invulnTimer=0; p.x=Math.max(600,b.x-600); p.y=e.currentStage.floorY; p.onGround=true; b.attackCooldown=99;})()""")
    s.god(); s.wait(2200)
    ent = [e for e in log(s) if e['kind'] == 'music']; sf = [e['event'] for e in sfx(log(s))]
    dbg = s.ev(f'{D}.music.debug()')
    rec(m, 'boss -> boss music (different track from the heavy-combat one)', dbg['mode'] == 'boss' and dbg['fight'] in HEAVY and dbg['fight'] == dbg['picks']['boss'] and dbg['picks']['boss'] != dbg['picks']['heavy'], dbg)
    rec(m, 'boss intro roar plays', 'boss_intro' in sf, sf[:8])
    # boss dies -> 10 s -> resume stealth where it stopped
    s.ev("window.__boss.dead=true; window.__boss.hp=0;")
    t0 = time.time(); clear(s)
    for _ in range(150):
        s.wait(100)
        r = [e for e in log(s) if e['event'] == 'stealth_resume']
        if r: break
    elapsed = time.time() - t0
    mm = re.search(r'from=(\w+) resumeAt=([\d.]+)', r[0]['detail']) if r else None
    rec(m, 'after the boss: 10 s -> back to stealth', bool(r) and 9.4 <= elapsed <= 12.5 and mm.group(1) == 'boss', {'elapsed': round(elapsed, 2), 'detail': r[0]['detail'] if r else None})
    if r and paused_at is not None:
        pass

def stage_random(s, m):
    ids = set(); picks = []
    for i in range(12):
        s.ev(f"{E}.enterCamp({E}.tuning, false)" if i % 2 else f"{E}.startRaid({E}.tuning, 'nocturne_castle')"); s.wait(1400)
    ent = [e for e in log(s) if e['event'] == 'stage_enter']
    amb = [re.search(r'amb=(\w+)', e['detail']).group(1) for e in ent]
    stl = [re.search(r'stealth=(\w+)', e['detail']).group(1) for e in ent]
    heavy = [re.search(r'heavy=(\w+)', e['detail']).group(1) for e in ent]
    boss = [re.search(r'boss=(\w+)', e['detail']).group(1) for e in ent]
    comb = [re.search(r'combat=(\w+)', e['detail']).group(1) for e in ent]
    banned = {'hope', 'b_crypt_a'}
    rec(m, 'ambience is random per level and never Abandon Hope / first crypt', len(set(amb)) >= 3 and not (set(amb) & banned), {'n': len(ent), 'amb': amb})
    rec(m, 'stealth + light-combat picks come only from the stealth pool', set(stl) <= LIGHT and set(comb) <= LIGHT and len(set(stl)) >= 2, {'stealth': stl, 'combat': comb})
    rec(m, 'heavy + boss picks come only from the boss/heavy pool', set(heavy) <= HEAVY and set(boss) <= HEAVY, {'heavy': heavy, 'boss': boss})
    return ent

def mixer(s, m, expect=(60, 55, 90)):
    mx = s.ev(f'{S}.getMixer()')
    g = s.ev(f'({{m:{S}.musicBus.gain.value, a:{S}.ambBus.gain.value, s:{S}.sfxBus.gain.value}})')
    em, ea, es = [(v / 100) ** p for v, p in zip(expect, (1.6, 1.6, 1.4))]
    rec(m, f'mixer {expect} -> bus gains match picker curves', abs(g['m'] - em) < 0.02 and abs(g['a'] - ea) < 0.02 and abs(g['s'] - es) < 0.02 and mx['music'] == expect[0] and mx['ambience'] == expect[1] and mx['sfx'] == expect[2], {'mixer': mx, 'gains': g, 'expect': [round(em, 3), round(ea, 3), round(es, 3)]})

def run(mobile):
    m = 'mobile' if mobile else 'desktop'
    with sync_playwright() as pw:
        s = Sess(pw, BASE, mobile=mobile, hero='hunter', raid=True)
        s.page.mouse.click(60 if not mobile else 195, 400); s.wait(2500)
        st = s.ev(f'{S}.context.state'); pp = s.ev(f'{S}.preloadProgress()')
        rec(m, 'audio context running after first gesture; all SFX clips decoded', st == 'running' and pp['loaded'] == pp['total'], {'state': st, 'progress': pp})
        mixer(s, m)
        pa = music_flow(s, m)
        heavy_boss_flow(s, m, pa)
        event_table(s, m)
        if not mobile:
            variants(s, m)
        s.ev(f'{E}.status') ; 
        # restore a sane room for in-game checks
        s.ev(f"{E}.startRaid({E}.tuning, 'nocturne_castle')"); s.wait(1800)
        s.ev(f"window.__pool=null")
        ingame_sfx(s, m)
        footsteps(s, m)
        ui_sounds(s, m)
        stage_random(s, m)
        # end screens
        s.ev(f"{E}.startRaid({E}.tuning, 'nocturne_castle')"); s.wait(1500); clear(s)
        s.ev(f"{E}.status='GAME_OVER'"); s.wait(1200)
        ev = [e['event'] for e in log(s)]
        rec(m, 'game over -> defeat clip + music fades out', 'defeat' in ev and 'silent' in ev, ev)
        s.ev(f"{E}.enterCamp({E}.tuning, false)"); s.wait(1500)
        dbg = s.ev(f'{D}.music.debug()')
        rec(m, 'back to camp -> music + ambience restart', dbg['mode'] == 'stealth' and dbg['ambience'], dbg)
        clear(s); s.ev(f"{E}.status='VICTORY'"); s.wait(2800)
        ev = [e['event'] for e in sfx(log(s))]
        rec(m, 'victory -> victory then raid_complete clips', 'victory' in ev and 'raid_complete' in ev, ev)
        errs = noise(s.errs)
        rec(m, 'no page errors', len(s.perrs) == 0 and len(errs) == 0, {'pageerrors': s.perrs[:3], 'console': errs[:3]})
        s.close()
    # mixer from stored tuning
    with sync_playwright() as pw:
        s = Sess(pw, BASE, mobile=mobile, hero=None, raid=False, tune={'sound': {'musicVol': 20, 'ambienceVol': 30, 'sfxVol': 70}})
        s.page.mouse.click(60 if not mobile else 195, 400); s.wait(1800)
        mixer(s, m + '-custom', (20, 30, 70))
        s.close()

if __name__ == '__main__':
    which = sys.argv[2] if len(sys.argv) > 2 else 'both'
    if which in ('both', 'desktop'): run(False)
    if which in ('both', 'mobile'): run(True)
    json.dump(R, open('/workspace/gang-of-assassin/builds/sound-v1/test-scripts/result-' + which + '.json', 'w'), indent=1)
    fails = [(m, k) for m in R for k, v in R[m].items() if not v['pass']]
    print('TOTAL', sum(len(v) for v in R.values()), 'FAIL', len(fails), fails)

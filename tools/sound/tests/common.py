import json, sys
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT='/workspace/gang-of-assassin/builds/sound-v1/'
OUT=ROOT+'screenshots/'; CROP=ROOT+'crops/'
E='window.__nocturneEngine'

class Sess:
    def __init__(s, pw, base, mobile=False, tune=None, hero='assassin', raid=True):
        s.mobile=mobile; s.errs=[]; s.perrs=[]; s.shots=[]
        s.tag=('390x844' if mobile else '1400x820')
        s.b=pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        if mobile:
            s.ctx=s.b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36')
        else:
            s.ctx=s.b.new_context(viewport={'width':1400,'height':820})
        s.page=s.ctx.new_page()
        s.page.on('pageerror', lambda e: (s.errs.append(str(e)), s.perrs.append(str(e))))
        s.page.on('console', lambda m: s.errs.append('console.error: '+m.text) if m.type=='error' else None)
        t={'weaponCritChance':0,'enemyDamageMult':0,'bossDamageMult':0}
        if tune: t.update(tune)
        s.page.add_init_script("localStorage.setItem('nocturne-castle.tuning.v2', JSON.stringify(%s));" % json.dumps(t))
        s.page.goto(base+'?debug'+('&mobile' if mobile else '')); s.page.wait_for_timeout(2200)
        if hero:
            s.ev(f"{E}.selectCharacter('{hero}', {E}.tuning)"); s.page.wait_for_timeout(300)
        if raid:
            for attempt in range(3):
                s.ev(f"{E}.offeredRaids=['nocturne_castle','brimstone_sanctum']"); s.ev(f"{E}.startRaid({E}.tuning, 'nocturne_castle')")
                for _ in range(50):
                    s.page.wait_for_timeout(200)
                    if s.ev(E+'.status')=='PLAYING' and not s.ev(f"{E}.currentStage.isCamp"): break
                if not s.ev(f"{E}.currentStage.isCamp"): break
            s.page.wait_for_timeout(600)
    def ev(s, js): return s.page.evaluate(js)
    def key(s, k, hold=60):
        s.page.keyboard.down(k); s.page.wait_for_timeout(hold); s.page.keyboard.up(k)
    def wait(s, ms): s.page.wait_for_timeout(ms)
    def player_box(s):
        return s.ev(f"""(()=>{{const e={E}; const p=e.player; const cs=[...document.querySelectorAll('canvas')].sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight); const c=cs[0]; const r=c.getBoundingClientRect();
          const t=e.effectiveTuning; const z=t.zoom*(1+e.cameraZoomPunch*(t.zoomPunchMult??1));
          const sx=r.left+r.width/2+e.camera.offsetX+(p.x-e.camera.x)*z; const sy=r.top+r.height/2+e.camera.offsetY+(p.y-e.camera.y)*z;
          return [sx, sy, z, p.baseH*t.playerScale*z];}})()""")
    def shot(s, n, crop=False, wide=1.6, fixedW=None):
        path=f'{OUT}{s.tag}-{n}.png'; s.page.screenshot(path=path); s.shots.append(path)
        if crop:
            sx,sy,z,hpx=s.player_box(); dpr=2 if s.mobile else 1
            im=Image.open(path); W=hpx*3.2*wide; H=hpx*2.2*wide
            box=[int((sx-W*0.5)*dpr), int((sy-H*0.82)*dpr), int((sx+W*0.5)*dpr), int((sy+H*0.18)*dpr)]
            box=[max(0,box[0]),max(0,box[1]),min(im.width,box[2]),min(im.height,box[3])]
            c=im.crop(box); k=420/max(1,c.height); c=c.resize((int(c.width*k), 420), Image.LANCZOS)
            c.save(f'{CROP}{s.tag}-{n}.png')
    def god(s): s.ev(f"(()=>{{const p={E}.player; p.invulnTimer=0; p.hp=p.maxHp; p.mp=p.maxMp; p.weaponSkillCooldown=0; p.flashTimer=0; p.hitStunTimer=0; p.assassinThrowCooldown=0;}})()")
    def park(s, px, off=None, hp=999, alerted=True, facing_en=-1, idx=0, etype=None):
        return s.ev(f"""(()=>{{const e={E}; const p=e.player; p.x={px}; p.y=e.currentStage.floorY; p.vx=0; p.vy=0; p.facing=1; p.onGround=true; p.attackState='idle';
          p.invulnTimer=0; p.flashTimer=0; p.hitStunTimer=0; p.hp=p.maxHp; p.mp=p.maxMp; p.weaponSkillCooldown=0; p.assassinBlinkUsed=false; p.assassinThrowCooldown=0; p.assassinComboTimer=0; p.xpToNext=99999; e.comboCount=0; e.pendingLevelUpLevels=[]; e.levelUpDelayTimer=0; if(e.status==='CHOOSING_UPGRADE') e.status='PLAYING';
          if(!window.__pool) window.__pool=e.enemies.filter(x=>!x.isBoss && ['ghoul','skeleton','knight'].includes(x.type)).slice(0,3);
          for (const x of e.enemies) {{ if(!x.isBoss) {{ x.dead=true; x.markTimer=0; }} }}
          const off={json.dumps(off)};
          if (off!==null && window.__pool.length) {{ const en=window.__pool[{idx}]; en.dead=false; if(!e.enemies.includes(en)) e.enemies.push(en);
            en.x=p.x+off; en.homeX=en.x; en.y=e.currentStage.floorY; en.vx=0; en.vy=0; en.hp={hp}; en.maxHp={hp}; en.alerted={json.dumps(alerted)}; en.facing={facing_en};
            en.attackCooldown=99; en.hurtStunTimer=0; en.shieldActive=false; en.onGround=true; en.invulnTimer=0; en.burnTimer=0; en.chillTimer=0; en.witherTimer=0; en.markTimer=0; en.poisonTimer=0; }}
          e.fx.particles.length=0; return true; }})()""")
    def close(s): s.ctx.close(); s.b.close()

class Touch:
    def __init__(s, sess):
        s.s=sess; s.page=sess.page; s.cdp=sess.ctx.new_cdp_session(sess.page); s.active={}
    def _send(s, kind):
        pts=[{'x':x,'y':y,'id':i} for i,(x,y) in s.active.items()]
        s.cdp.send('Input.dispatchTouchEvent', {'type':kind,'touchPoints':pts})
    def down(s,i,x,y): s.active[i]=(x,y); s._send('touchStart')
    def move(s,i,x,y): s.active[i]=(x,y); s._send('touchMove')
    def up(s,i): s.active.pop(i,None); s._send('touchEnd')
    def center(s, sel):
        bb=s.page.locator(sel).first.bounding_box(); return bb['x']+bb['width']/2, bb['y']+bb['height']/2
    def tap_button(s, text, hold=140):
        bbs=s.page.evaluate("""(t)=>{const b=[...document.querySelectorAll('button')].find(b=>b.innerText.toUpperCase().startsWith(t)); if(!b) return null; const r=b.getBoundingClientRect(); return [r.x+r.width/2,r.y+r.height/2];}""", text.upper())
        if not bbs: return False
        s.down(9,bbs[0],bbs[1]); s.page.wait_for_timeout(hold); s.up(9); s.page.wait_for_timeout(100); return True
    def stick(s): return s.center('[data-mobile-stick]')
    def flick_up(s, i=1, hold=100, dist=56):
        sx,sy=s.stick(); s.down(i,sx,sy); s.page.wait_for_timeout(20); s.move(i,sx,sy-18); s.move(i,sx,sy-dist); s.page.wait_for_timeout(hold); s.up(i); s.page.wait_for_timeout(40)
    def flick_dir(s, dx, dy, i=1, hold=100, dist=56):
        sx,sy=s.stick(); s.down(i,sx,sy); s.page.wait_for_timeout(20); s.move(i,sx+dx*18,sy+dy*18); s.move(i,sx+dx*dist,sy+dy*dist); s.page.wait_for_timeout(hold); s.up(i); s.page.wait_for_timeout(40)
    def stick_tap(s, hold=120):
        sx,sy=s.stick(); s.down(5,sx,sy); s.page.wait_for_timeout(hold); s.up(5); s.page.wait_for_timeout(100)

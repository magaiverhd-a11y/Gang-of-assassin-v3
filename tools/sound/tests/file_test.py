from playwright.sync_api import sync_playwright
import time
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
    for q,vp in [('?debug',{'width':1400,'height':820}),('?debug&mobile',{'width':390,'height':844})]:
        p=b.new_page(viewport=vp); errs=[]
        p.on('pageerror',lambda e:errs.append(str(e))); p.on('console',lambda m: m.type=='error' and errs.append(m.text))
        p.goto('file:///workspace/gang-of-assassin/builds/sound-v1/nocturne-castle-sound-v1.html'+q); p.wait_for_timeout(1500)
        p.mouse.click(100,400); p.wait_for_timeout(4000)
        print(q, p.evaluate("window.__nocturneSound && window.__nocturneSound.sound.context.state"), p.evaluate("JSON.stringify(window.__nocturneSound.sound.preloadProgress())"), errs)
    b.close()

"""Byte-identity check: every clip shipped in the game == the clip embedded in sound-picker-v2.html (what Magaiver heard)."""
import re, json, base64, hashlib, os, sys
html=open('/workspace/gang-of-assassin/sound-mockup/sound-picker-v2.html',encoding='utf-8').read()
i=html.index('const AUD=') if 'const AUD=' in html else -1
print('AUD marker', i)
m=re.search(r'(?:const|let|var)\s+AUD\s*=\s*',html); start=m.end()
dec=json.JSONDecoder(); aud,_=dec.raw_decode(html[start:])
print('picker clips', len(aud))
md5={}
for k,v in aud.items(): md5[hashlib.md5(base64.b64decode(v)).hexdigest()]=k
root='/workspace/gang-of-assassin/sound-v1-wt/src/assets/audio'
bad=0; n=0
for d,_,fs in os.walk(root):
    for f in fs:
        h=hashlib.md5(open(os.path.join(d,f),'rb').read()).hexdigest(); n+=1
        if h not in md5: bad+=1; print('NOT IN PICKER', d, f)
print(f'{n} shipped clips checked, {bad} not byte-identical to a picker clip')
sys.exit(1 if bad else 0)

"""PR1 part D: rephrase lines the TTS voice garbles (checked with Whisper)."""
import json, sys
sys.path.insert(0, '.')
from eq import *
c = Content()
c.set_line('j21-l5', text='Can you write the repair cost on the appraisal for my insurance company?',
           gloss='可唔可以喺估價單寫埋維修費，等我交畀保險公司？')
c.set_line('t7-l8', text='Thank you. Show this form to airport customs before you fly.')
c.set_ex('carousel-noun', 0, en='After immigration, collect your luggage from carousel three, then go through customs.')
c.set_md('certificate-noun', 0, en="Here's the certificate. It lists the stone and its size.", yue='呢張係證書，寫咗粒石同尺寸。')
for lid, L in c.L.items():
    for b in L['build']:
        if b['type'] == 'order' and b['tokens'][-1] == 'appraisal?' and lid == 'J21':
            pass
c.save()
for p in sorted(c.rerender):
    for q in (p, p.replace('.mp3', '-slow.mp3')):
        import os
        if os.path.exists(R + '/' + q): os.remove(R + '/' + q)
print(sorted(c.rerender))

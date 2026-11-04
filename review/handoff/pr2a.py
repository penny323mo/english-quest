"""PR2 part A: repair corrupted say strings, remove IPA-read-aloud lines, R3, roleplay text = audio text."""
import json, os, re, sys
sys.path.insert(0, '.')
from eq import *
from sayfix import ipa_index, ok_override

c = Content()
by = ipa_index(c)

# 1. The 43 corrupted say strings: an override for another word was copied onto the headword.
CORRUPT = {
    'pearl-noun': [0, 1, 2], 'gold-noun': [0, 1, 2], 'white-gold-phrase': [0, 1, 2], 'setting-noun': [0, 1, 2],
    'try-on-phrase': [0, 1, 2], 'fit-verb': [0, 2], 'loose-adj': [0, 1, 2], 'wrist-noun': [0, 1, 2],
    'almost-adv': [0, 1], 'comfortable-adj': [0, 1, 2], 'expensive-adj': [0, 1, 2],
    'refund-form-phrase': [0, 1, 2], 'on-the-side-phrase': [0, 1, 2], 'service-charge-phrase': [0, 1, 2],
    'return-your-call-phrase': [0, 1],
}

def repair(en, say):
    """Rebuild say from en; keep an override only on the single word it spells."""
    out = en
    for ov in re.findall(r'\[\[[^\]]+\]\]', say):
        toks = re.findall(r"[A-Za-z][A-Za-z'\-]*", en)
        target = next((w for w in toks if ok_override(by, [w], ov)), None)
        if target is None:  # a phrase lemma, e.g. "white gold"
            for i in range(len(toks) - 1):
                key = f'{toks[i]} {toks[i + 1]}'.lower()
                if key in by and ok_override(by, [toks[i], toks[i + 1]], ov):
                    target = f'{toks[i]} {toks[i + 1]}'
                    break
        if target and ov not in out:
            out = re.sub(r'(?<![A-Za-z\[])' + re.escape(target) + r'(?![A-Za-z\]])', ov, out, count=1)
    return out

n = 0
for cid, idxs in CORRUPT.items():
    card = c.byid[cid]
    for i in idxs:
        ex = card['examples'][i]
        new = repair(ex['en'], ex['say'])
        print(f'{cid} e{i}: {ex["say"]!r} -> {new!r}')
        ex['say'] = new
        c.rerender.add(ex['audio'])
        n += 1
        if ex['audio'] == card['audio']:
            card['say'] = new
print('repaired say strings', n)

# 2. Lines that made the voice read IPA aloud ("Night uses slash N slash").
def main_example(cid, en, yue):
    card = c.byid[cid]
    card['example'] = en
    card['exampleYue'] = yue
    card['say'] = en
    for ex in card.get('examples') or []:
        if ex.get('audio') == card['audio']:
            ex['en'], ex['yue'], ex['say'] = en, yue, en
    c.rerender.add(card['audio'])
main_example('wine-noun', 'A glass of red wine, please.', '唔該，一杯紅酒。')
main_example('vine-noun', 'A vine grows on the old wall.', '舊牆上面生咗條藤。')
main_example('west-noun', 'Walk west for five minutes.', '向西行五分鐘。')
main_example('vest-noun', 'Please wear a life vest on the boat.', '上船請着救生衣。')
c.set_md('very-adv', 1, en='Yes, it looks very clear.', yue='係呀，睇落好清。')
c.set_md('wine-noun', 1, en='Of course. Red or white?', yue='當然可以。紅酒定白酒？')
c.set_md('vine-noun', 1, en="Yes, that's a grape vine.", yue='係，嗰條係葡萄藤。')
c.set_md('vest-noun', 1, en="This vest is wool. It's very warm.", yue='呢件背心係羊毛，好暖。')
c.set_md('straight-adv', 1, en='Yes, go straight, then turn left.', yue='係，直行，然後轉左。')
c.set_md('lift-noun', 1, en='Thanks. I see the lift now.', yue='多謝。我見到部升降機喇。')
c.set_md('sick-adj', 1, en="Please rest. I'll ask Jo to cover your shift.", yue='好好休息。我叫 Jo 幫你頂更。')
c.set_md('night-noun', 1, en="Thanks. I'll take a taxi if I miss it.", yue='多謝。錯過咗我就搭的士。')
c.set_md('net-noun', 1, en='Good idea. We can fish from the pier.', yue='好主意。我哋可以喺碼頭釣魚。')

# 3. R3: the roleplay partner lines were shorter than what the clip says.
c.set_line('r3-a1', text='What would you like to order? Do you have any allergies?',
           gloss='你想點咩？有冇食物敏感？')
c.set_line('r3-a2', text='The sauce is a little spicy.', gloss='個醬有少少辣。')
c.set_line('r3-m1', text='Does this dish contain peanuts?', gloss='呢道菜有冇花生？')

# 4. Every roleplay turn shows the text its audio says.
byaudio = {ln['audio']: ln for ln in c.lines}
synced = 0
for lid, L in c.L.items():
    for t in L['roleplay']['turns']:
        a = byaudio.get(t['audio'])
        m = byaudio.get(t['modelAudio'])
        if a and t['line'] != a['text']:
            t['line'] = a['text']; synced += 1
        if m and t['expect'] != m['text']:
            t['expect'] = m['text']; synced += 1
        t['keywords'] = [k for k in t['keywords'] if k.lower() in t['expect'].lower()] or t['keywords']
print('roleplay texts synced', synced)

c.save()
for p in sorted(c.rerender):
    for q in (p, p.replace('.mp3', '-slow.mp3')):
        if os.path.exists(R + '/' + q): os.remove(R + '/' + q)
json.dump(sorted(c.rerender), open('rerender_pr2a.json', 'w'), indent=1)
print('rerender', len(c.rerender))

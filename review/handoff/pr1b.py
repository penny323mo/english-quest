"""PR1 part B: systematic quiz-key repairs."""
import json, re, sys
sys.path.insert(0, '.')
from eq import *

c = Content()
TOPIC = re.compile(r'^(關於|講緊|唔係)')
lexg = {}
for it in c.lex['items']:
    lexg.setdefault(it['lemma'].lower(), []).append(it['glossYue'])

def clean(g):
    return g.rstrip('。')

def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

# 1. Topic-label understand items -> real meaning choices from the lesson's own glosses.
fixed_u = 0
for lid, L in c.L.items():
    dl = L['dialogue']
    for u in L['understand']:
        if not all(TOPIC.match(ch) for ch in u['choices']):
            continue
        m = re.match(r'^(.*?)\s*([一-鿿？]+)$', u['prompt'])
        sent, tail = m.group(1).strip(), m.group(2)
        k = next(i for i, x in enumerate(dl) if norm(x['text']) == norm(sent))
        right = clean(dl[k]['glossYue'])
        others = [clean(x['glossYue']) for j, x in enumerate(dl) if j != k]
        n = len(dl)
        picks = []
        for off in (3, 5, 2, 4, 6, 1, 7):
            g = clean(dl[(k + off) % n]['glossYue'])
            tags = L.get('topicTags') or []
            if tags and not any(t in g for t in tags):
                continue
            if g != right and g not in picks and (k + off) % n != k:
                picks.append(g)
            if len(picks) == 2:
                break
        assert len(picks) == 2, (lid, sent)
        pos = u['answer']
        choices = picks[:]
        choices.insert(pos, right)
        u['choices'] = choices
        if tail == '即係問緊咩？' and not sent.rstrip().endswith('?'):
            tail = '呢句即係點？'
        u['prompt'] = f'{sent} {tail}'
        u.pop('explain', None)
        fixed_u += 1
print('understand topic items', fixed_u)

# 2. "你想用呢課嘅講法。你點講？" has no situation: say what you want to say.
fixed_b = 0
for lid, L in c.L.items():
    for b in L['build']:
        if b['type'] == 'choice' and b['promptYue'].startswith('你想用呢課嘅講法'):
            ans = b['choices'][b['answer']]
            src = next((x for x in L['dialogue'] if norm(x['text']) == norm(ans)), None)
            if src is None:
                import difflib
                src = max(L['dialogue'], key=lambda x: difflib.SequenceMatcher(a=norm(ans), b=norm(x['text'])).ratio())
                print('  closest', lid, '|', ans, '->', src['text'])
            b['promptYue'] = f'你想講「{clean(src["glossYue"])}」，你點講？'
            b['explain'] = '揀意思對得上嗰句。'
            fixed_b += 1
print('build generic prompts', fixed_b)

# 3. Roleplay keywords must be words the learner actually says in the expected line.
STOP = set('a an the and or but so if is are am was were be been i you we he she it they my your our his her its their me us them to of in on at for with by from this that these those there here do does did can could will would shall should may might must have has had not no yes please thank thanks okay ok hi hello sure what when where which who how why just very too also all any some one two'.split())
def words(s):
    return re.findall(r"[A-Za-z][A-Za-z'\-]*", s)
fixed_k = 0
for lid, L in c.L.items():
    for t in L['roleplay']['turns']:
        exp = t['expect'].lower()
        keep = [k for k in t['keywords'] if k.lower() in exp]
        if len(keep) == len(t['keywords']):
            continue
        want = max(1, len(t['keywords']))
        cands = [w for w in words(t['expect']) if w.lower() not in STOP and len(w) > 2
                 and w.lower() not in [k.lower() for k in keep]]
        cands.sort(key=lambda w: -len(w))
        for w in cands:
            if len(keep) >= want:
                break
            keep.append(w.lower())
        t['keywords'] = keep
        fixed_k += 1
print('roleplay keywords', fixed_k)

# 4. Fill-in choice explains must gloss the answer word.
fixed_e = 0
for lid, L in c.L.items():
    for q in L['quiz']:
        if q['type'] == 'choice' and '___' in q['prompt'] and q.get('explain'):
            ans = q['choices'][q['answer']]
            gl = lexg.get(ans.lower(), [])
            ex = clean(q['explain'])
            if gl and not any(ex == g or ex in g or g in ex for g in gl):
                q['explain'] = f'{ans} 係{gl[0]}。'
                fixed_e += 1
print('fill-in explains', fixed_e)

c.save()

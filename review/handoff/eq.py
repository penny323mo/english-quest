import json,glob,os,re
R='/home/user/english-quest'
def load(p): return json.load(open(os.path.join(R,p),encoding='utf-8'))
def save(p,d): open(os.path.join(R,p),'w',encoding='utf-8').write(json.dumps(d,ensure_ascii=False,indent=2)+"\n")
class Content:
    def __init__(s):
        s.L={}
        for f in sorted(glob.glob(R+'/content/lessons/*.json')):
            d=json.load(open(f,encoding='utf-8')); s.L[d['id']]=d
        s.lines=load('content/lines.json'); s.lex=load('content/lexicon.json')
        s.byid={it['id']:it for it in s.lex['items']}
        s.lineby={l['id']:l for l in s.lines}
        s.rerender=set()
    def save(s):
        for k,d in s.L.items(): save(f'content/lessons/{k.lower()}.json',d)
        save('content/lines.json',s.lines); save('content/lexicon.json',s.lex)
        json.dump(sorted(s.rerender),open(R+'/../rerender.json','w')) if False else None
    def dline(s,lid):
        L=s.L[lid.split('-')[0].upper()]
        for x in L['dialogue']:
            if x['id']==lid: return x
    def set_line(s,lid,text=None,gloss=None):
        """Change a dialogue/roleplay line; propagate English text through the lesson."""
        L=s.L[lid.split('-')[0].upper()]
        ln=s.lineby[lid]; d=s.dline(lid)
        old=ln['text']
        if text and text!=old:
            def walk(o):
                if isinstance(o,dict): return {k:walk(v) for k,v in o.items()}
                if isinstance(o,list): return [walk(v) for v in o]
                if isinstance(o,str): return o.replace(old,text)
                return o
            s.L[L['id']]=L=walk(L)
            ln['text']=text; ln['say']=text if ln.get('say')==old else ln.get('say')
            if ln['say']==old: ln['say']=text
            s.rerender.add(ln['audio'])
            d=s.dline(lid)
            if d:
                d['text']=text
                if d.get('say')==old or '[[' not in (d.get('say') or ''): d['say']=text
        if gloss:
            oldg=ln['glossYue']; ln['glossYue']=gloss
            if d:
                d['glossYue']=gloss
            # chunk glosses copying the line gloss
            for c in L['chunks']:
                if c.get('glossYue')==oldg: c['glossYue']=gloss
        return L

import difflib
def _tok(s): return re.findall(r"\[\[[^\]]+\]\]|[A-Za-z][A-Za-z'\-]*|\S",s)
def override_map(en,say):
    """word -> [[ipa]] substitutions used in say relative to en."""
    a=_tok(en); b=_tok(say); m={}
    sm=difflib.SequenceMatcher(a=a,b=b,autojunk=False)
    for op,i1,i2,j1,j2 in sm.get_opcodes():
        if op=='replace':
            ws=[w for w in a[i1:i2]]; os_=[x for x in b[j1:j2]]
            if all(x.startswith('[[') for x in os_):
                m[' '.join(ws)]=' '.join(os_)
    return m
def apply_overrides(en,m):
    out=en
    for w,o in sorted(m.items(),key=lambda kv:-len(kv[0])):
        out=re.sub(r'(?<![A-Za-z\[])'+re.escape(w)+r'(?![A-Za-z\]])',o,out)
    return out
def _set_ex(c,obj,en,yue,card=None,is_main=False):
    if en is not None and en!=obj['en']:
        old_say=obj.get('say') or obj['en']
        m=override_map(obj['en'],old_say) if old_say!=obj['en'] else {}
        obj['en']=en
        if 'say' in obj or m:
            obj['say']=apply_overrides(en,m) if m else en
        c.rerender.add(obj['audio'])
        if is_main and card is not None:
            card['example']=en; card['say']=obj.get('say',en)
    if yue is not None:
        obj['yue']=yue
        if is_main and card is not None: card['exampleYue']=yue
Content._set_ex=_set_ex
def set_ex(c,cid,i,en=None,yue=None):
    card=c.byid[cid]; ex=card['examples'][i]
    _set_ex(c,ex,en,yue,card,is_main=(i==0 or ex.get('audio')==card['audio']))
def set_md(c,cid,i,en=None,yue=None):
    card=c.byid[cid]; t=card['miniDialogue'][i]
    _set_ex(c,t,en,yue)
Content.set_ex=set_ex; Content.set_md=set_md

def set_line2(c,lid,text=None,gloss=None,also=()):
    """Change a line's English and/or gloss everywhere in its lesson and lines.json.
    also: extra (old,new) string pairs to replace inside the lesson (e.g. shortened RP/quiz quotes)."""
    key=lid.split('-')[0].upper()
    L=c.L[key]; ln=c.lineby[lid]
    old=ln['text']; oldg=ln['glossYue']
    pairs=[]
    if text and text!=old: pairs.append((old,text))
    if gloss and gloss!=oldg: pairs.append((oldg,gloss))
    pairs+=list(also)
    def walk(o):
        if isinstance(o,dict): return {k:walk(v) for k,v in o.items()}
        if isinstance(o,list): return [walk(v) for v in o]
        if isinstance(o,str):
            for a,b in pairs: o=o.replace(a,b)
            return o
        return o
    # say fields: rebuild from overrides
    def fix_say(obj):
        if text and text!=old:
            m=override_map(old,obj.get('say') or old) if (obj.get('say') or old)!=old else {}
            obj['text']=text; obj['say']=apply_overrides(text,m) if m else text
        if gloss: obj['glossYue']=gloss
    for d in L['dialogue']:
        if d['id']==lid: fix_say(d)
    c.L[key]=walk(L)
    fix_say(ln)
    if text and text!=old: c.rerender.add(ln['audio'])
Content.set_line=set_line2

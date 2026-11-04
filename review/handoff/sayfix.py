import sys,re,collections,json,difflib; sys.path.insert(0,'.')
import eq
from saycheck import nz
def ipa_index(c):
    by=collections.defaultdict(set)
    for it in c.lex['items']: by[it['lemma'].lower()].add(nz(it['ipa']))
    return by
def sim(a,b): return difflib.SequenceMatcher(a=a,b=b).ratio()
def word_ipa(by,words):
    """IPA candidates for a run of words: phrase lemma, or concatenation of single-word lemmas."""
    key=' '.join(w.lower() for w in words)
    out=set(by.get(key,set()))
    parts=[by.get(w.lower()) for w in words]
    if all(parts):
        out.add(''.join(sorted(p)[0] for p in parts))
    return out
def ok_override(by,words,ov):
    ov=nz(ov.replace('[[','').replace(']]',''))
    for x in word_ipa(by,words):
        if sim(ov,x)>0.72 and 0.7<=len(ov)/max(1,len(x))<=1.45: return True
    return False
def problems(by,en,say):
    a=eq._tok(en); b=eq._tok(say); probs=[]
    sm=difflib.SequenceMatcher(a=a,b=b,autojunk=False)
    for op,i1,i2,j1,j2 in sm.get_opcodes():
        if op=='equal': continue
        A=a[i1:i2]; B=b[j1:j2]
        if op=='replace' and all(x.startswith('[[') for x in B):
            if not ok_override(by,[w for w in A if re.match(r"[A-Za-z]",w)],' '.join(B)): probs.append((' '.join(A),' '.join(B)))
        elif ''.join(A).replace('-',' ').replace(' ','')==''.join(x for x in B if not x.startswith('[[')).replace(' ','') : pass
        else: probs.append((op+':'+' '.join(A),' '.join(B)))
    return probs
def repair(by,en,say):
    """Rebuild say from en, keeping each [[override]] only on a word it actually spells."""
    ovs=re.findall(r'\[\[[^\]]+\]\]',say)
    toks=re.findall(r"[A-Za-z][A-Za-z'\-]*",en)
    out=en
    for ov in ovs:
        best=None
        for n in (2,1):
            for i in range(len(toks)-n+1):
                ws=toks[i:i+n]
                if ok_override(by,ws,ov):
                    best=' '.join(ws); break
            if best: break
        if best and ov not in out:
            out=re.sub(r'(?<![A-Za-z\[])'+re.escape(best)+r'(?![A-Za-z\]])',ov,out,count=1)
    return out

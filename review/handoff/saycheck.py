import sys,re,collections,json,difflib; sys.path.insert(0,'.')
import eq
from eq import Content
def nz(s): return re.sub(r"[/ˈˌ.\s]",'',s).replace('ɝ','ɜɹ').replace('ɚ','əɹ').replace('ɜː','ɜ')
def run(c,verbose=True):
    ipas=collections.defaultdict(set)
    for it in c.lex['items']: ipas[it['lemma'].lower()].add(nz(it['ipa']))
    bad=[]
    def check(cid,where,en,say,obj):
        a=eq._tok(en); b=eq._tok(say)
        sm=difflib.SequenceMatcher(a=a,b=b,autojunk=False)
        probs=[]
        for op,i1,i2,j1,j2 in sm.get_opcodes():
            if op=='equal': continue
            A=' '.join(a[i1:i2]); B=' '.join(b[j1:j2])
            if op=='replace' and all(x.startswith('[[') for x in b[j1:j2]):
                ov=nz(B.replace('[[','').replace(']]',''))
                word=A.lower()
                ok=any(ov==x or difflib.SequenceMatcher(a=ov,b=x).ratio()>0.7 for x in ipas.get(word,set()))
                if not ok: probs.append(f'{A!r}->{B}')
            else: probs.append(f'{op}:{A!r}->{B!r}')
        if probs: bad.append((cid,where,en,say,probs,obj))
    for it in c.lex['items']:
        check(it['id'],'main',it['example'],it['say'],it)
        for i,e in enumerate(it.get('examples') or []):
            if e.get('say'): check(it['id'],f'e{i}',e['en'],e['say'],e)
        for i,e in enumerate(it.get('miniDialogue') or []):
            if e.get('say'): check(it['id'],f'm{i}',e['en'],e['say'],e)
    for ln in c.lines:
        if ln.get('say'): check(ln['id'],'line',ln['text'],ln['say'],ln)
    if verbose:
        print(len(bad), len(set(b[0] for b in bad)))
        for x in bad: print(x[0],x[1],'|',x[2],'|',x[3],'|',x[4])
    return bad
if __name__=='__main__': run(Content())

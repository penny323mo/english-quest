"""PR1: offensive/wrong meanings, wrong quiz keys, factual errors, carousel order."""
import json, re, sys
sys.path.insert(0, '.')
from eq import *

c = Content()
L = lambda k: c.L[k]

# ---------------------------------------------------------------- 1. 叫雞 / offensive glosses
c.set_line('r3-l1', gloss='我想要個雞，唔該。醬汁我有嘢想問。')
def repl_all(lesson, old, new):
    s = json.dumps(c.L[lesson], ensure_ascii=False)
    assert old in s, (lesson, old)
    c.L[lesson] = json.loads(s.replace(old, new))
repl_all('R2', '"我想叫雞"', '"我想要個雞"')
repl_all('R2', 'Ana 問 What would you like to order? 你想叫雞。', 'Ana 問 What would you like to order? 你想要雞。')
repl_all('R8', '我想改外賣地址，唔係叫雞', '我想改外賣地址，唔係要雞')
repl_all('T2', '"叫雞"', '"點餐"')
repl_all('T2', '"我想叫雞"', '"我想點餐"')
repl_all('J5', '"叫雞"', '"點餐"')
repl_all('J7', '想唔想叫雞', '想唔想點餐')
repl_all('T3', '"我想叫雞"', '"我想點餐"')
repl_all('R3', '"我想叫雞"', '"我想要個雞"')

# ---------------------------------------------------------------- 2. wrong glosses in lessons
c.set_line('t6-l1', gloss='你好，我係前台 Kim。今晚有咩可以幫到你？')
c.set_line('r6-l1', gloss=c.lineby['r6-l1']['glossYue'].replace('晚安。', '你好。'))
c.set_line('r15-l6', gloss='蝦湯有甲殼類海鮮。呢隻係乾淨碟。')
repl_all('R15', '蝦湯有貝殼類，所以呢個係乾淨碟。', '蝦湯有甲殼類海鮮。呢隻係乾淨碟。')
c.set_line('r15-l5', gloss='邊啲熱菜有海鮮（蝦蟹貝類）？可唔可以畀個乾淨碟我？')
L('R15')['canDoYue'] = L('R15')['canDoYue'].replace('邊啲菜有貝殼類', '邊啲菜有海鮮')
c.set_line('j3-l2', gloss='我鍾意呢條手鏈，個扣都好易開。')
c.set_line('t2-l5', gloss='直行。過咗啲店舖，閘口就喺左手邊。')
c.set_line('r4-l1', gloss='食成點呀？要唔要幫你添杯？')
c.set_line('t13-l1', gloss='我頭好痛，仲發高燒。可以食咩藥？')
c.set_line('w7-l2', gloss='咁辛苦你喇。返嚟嗰陣可唔可以帶醫生紙？')
c.set_line('j9-l1', gloss='有問題真係唔好意思。話我知發生咩事，等我幫你。')
c.set_line('w4-l4', gloss=c.lineby['w4-l4']['glossYue'].replace('同團隊', '同銷售團隊'))
c.set_line('d7-l3', gloss='好，兩邊剪短啲，唔該。')
for ch in L('D7')['chunks']:
    if ch['example'] == 'I would like a simple trim, and keep a light fringe.':
        ch['glossYue'] = '我想簡單修一修，留薄薄嘅瀏海。'
    if ch['example'] == "It's eighty dollars in total, and the price covers the blow dry.":
        ch['glossYue'] = '總共八十蚊，包埋吹乾。'
for ch in L('T3')['chunks']:
    if ch['glossYue'] == '呢張係你把⋯⋯。':
        ch['glossYue'] = '呢張係你嘅⋯⋯，今日走之前請帶住。'
for ch in L('R10')['chunks']:
    ch['glossYue'] = ch['glossYue'].replace('冰拿鐵', '凍拿鐵')
for ch in L('W3')['chunks']:
    if ch['glossYue'] == '我⋯⋯負責人趕唔切。':
        ch['glossYue'] = '我⋯⋯Mei 星期五趕唔切個新期限。'
L('T5')['titleYue'] = '唔見咗嘢點求助' if L('T5')['titleYue'] == '行失咗點求人' else L('T5')['titleYue']

# ---------------------------------------------------------------- 3. factual errors in lessons
# J6: Hong Kong and Macau have no sales tax.
j6 = L('J6')
c.set_line('j6-l1', text='How much does this piece cost? Is that the final price?',
           gloss='呢件幾多錢？係咪實價？')
c.set_line('j6-l4', text="Ten percent off, and that's the final price.", gloss='九折，呢個已經係實價。',
           also=[('Ten percent off, and tax is included.', "Ten percent off, and that's the final price.")])
j6 = L('J6')
j6['canDoEn'] = "Say the cost, a percent off, and whether it's the final price."
j6['canDoYue'] = '你識報價，仲識講折扣同實價。'
j6['lemmas'] = [x for x in j6['lemmas'] if x != 'tax-noun']
for p in j6['sound']['pairs']:
    if p['b'] == 'tax-noun': p['b'] = 'price-noun'
j6['understand'][1] = {"prompt": "Ten percent off, and that's the final price. 呢句即係點？",
                      "choices": ["加一成", "十八開", "減一成，已經係實價"], "answer": 2,
                      "explain": "off 係減。final price 係實價，唔使再加錢。"}
j6['chunks'][0].update({"pattern": "How much does this ___? Is that the final price?",
                        "example": "How much does this cost? Is that the final price?",
                        "glossYue": "呢件幾多錢？係咪實價？"})
j6['build'][0]['explain'] = '講減幾多，再講係咪實價。'
j6['quiz'][0]['choices'] = ['sale', 'price', 'total']
j6['quiz'][4]['choices'] = ['price', 'sale', 'cost']
j6['quiz'][4]['explain'] = 'sale 尾音係 /l/。price 同 cost 冇 /l/。'
for t in j6['roleplay']['turns']:
    if t['expect'].startswith('Ten percent off'):
        t['keywords'] = ['percent', 'final']

# J7: no tax-free forms in a Hong Kong / Macau jewellery shop.
c.set_line('j7-l3', text='The payment is approved. Here is your receipt and the certificate.',
           gloss='付款過咗。呢度係你嘅收據同證書。',
           also=[('This purchase is tax-free.', 'The payment is approved. Here is your receipt and the certificate.')])
c.set_line('j7-l4', text='Thank you. Could I also get an invoice for my company?',
           gloss='多謝。可唔可以另外開張發票，等我報公司數？')
c.set_line('j7-m2', text='Please keep the receipt with the certificate, in case you need a repair.',
           gloss='請將收據同證書放埋一齊，之後要維修都用得着。')
c.set_line('j7-m3', text='Could you sign here, please? The card needs your signature.',
           gloss='唔該喺度簽名。用卡要你簽名。')
j7 = L('J7')
j7['titleYue'] = '付款同包裝'
j7['titleEn'] = 'Payment and gift wrap'
j7['canDoYue'] = '你識收款、畀收據同證書，仲識包裝。'
j7['canDoEn'] = 'Take a card or cash payment, hand over the receipt and certificate, and offer to wrap the gift.'
j7['lemmas'] = [x for x in j7['lemmas'] if x not in ('tax-free-phrase', 'refund-form-phrase', 'passport-noun')] + ['certificate-noun']
j7['understand'][1] = {"prompt": "The payment is approved. Here is your receipt and the certificate. 呢句即係點？",
                      "choices": ["稅已經包咗", "張卡過唔到", "付款過咗，畀收據同證書"], "answer": 2,
                      "explain": "approved 係批咗、過咗。certificate 係證書。"}
j7['understand'][2]['choices'] = ['禮盒', '收據', '證書']
j7['chunks'][1] = {"pattern": "The payment is ___. Here is your receipt and the certificate.",
                   "example": "The payment is approved. Here is your receipt and the certificate.",
                   "glossYue": "付款⋯⋯。呢度係你嘅收據同證書。", "answer": "approved",
                   "choices": ["approved", "spicy", "loose"]}
j7['quiz'][2] = {"type": "meaning",
                 "prompt": "店員講「The payment is approved. Here is your receipt and the certificate.」，certificate 係咩意思？",
                 "choices": ["紙袋", "證書", "簽名"], "answer": 1}
rp = j7['roleplay']
rp['intro'] = 'Tom 喺櫃檯準備付款。等佢講完先答。'
rp['turns'][1] = {"partner": "Tom", "partnerId": "tom",
                  "line": c.lineby['j7-l2']['text'],
                  "audio": "assets/audio/lines/j7-l2.mp3", "audioSlow": "assets/audio/lines/j7-l2-slow.mp3",
                  "expect": "The payment is approved. Here is your receipt and the certificate.",
                  "keywords": ["approved", "receipt"],
                  "modelAudio": "assets/audio/lines/j7-l3.mp3", "modelSlow": "assets/audio/lines/j7-l3-slow.mp3"}

# T7: refund forms are stamped by customs at departure, not by a shop.
c.set_line('t7-l8', text='Thank you. Show this form to customs at the airport before you fly.',
           gloss='多謝。上機之前，喺機場將呢張表交畀海關睇。')

# T8: "I'm not here on holiday" contradicts "I'm here for tourism".
c.set_line('t8-l4', text="No, just tourism. Yes, my flight home is on Sunday.",
           gloss='唔係，淨係嚟觀光。係，我星期日搭飛機返去。',
           also=[("I'm not here on holiday.", "No, just tourism. Yes, my flight home is on Sunday.")])
for t in L('T8')['roleplay']['turns']:
    if t['expect'].startswith("No, just tourism"):
        t['keywords'] = ['tourism', 'flight']

# T3: a double room has one double bed (雙人床); 雙床 is a twin.
c.set_line('t3-l3', gloss=None) if False else None

# J17: pearl care was backwards.
j17 = L('J17')
j17['canDoEn'] = j17['canDoEn'].replace('wipe the pearl and then put perfume on',
                                       'put perfume on before the pearls and wipe them after wearing')
j17['canDoYue'] = j17['canDoYue'].replace('先抹乾珍珠，再搽香水', '先搽香水再戴珍珠，戴完抹乾淨')
for ch in j17['chunks']:
    if ch['pattern'] == 'Wipe the pearl, then put ___ on.':
        ch.update({"pattern": "Put ___ on first, then wipe the pearls after you wear them.",
                   "glossYue": "先搽香水，戴完再抹珍珠。"})

# T17: the can-do says the power bank must come out.
c.set_line('t17-l4', text='Yes, take both of them out and put them in a tray.',
           gloss='係，兩樣都要攞出嚟，放喺個盤度。')

# J19: clarity, not cut, is "clean".
c.set_line('j19-l7', text='So this stone costs more because the cut is much better?', gloss='即係呢粒切工好好多，所以貴啲？')
for ch in L('J19')['chunks']:
    if ch['example'] == 'So this stone costs more because the cut is much better?':
        ch.update({"pattern": "So this stone ___ more because the cut is much better?", "answer": "costs",
                   "choices": ["costs", "diamond", "certificate"], "glossYue": "即係呢粒切工好好多，所以⋯⋯？"})
for t in L('J19')['roleplay']['turns']:
    if t['expect'] == 'So this stone costs more because the cut is much better?':
        t['keywords'] = ['costs', 'cut']

# J21: a jeweller cannot know the customer's insurance excess.
c.set_line('j21-l5', text='Can you write the repair cost on the appraisal for my insurer?',
           gloss='可唔可以喺估價單寫埋維修費，等我交畀保險公司？')
c.set_line('j21-l6', text="Yes. The repair is two hundred dollars, and I'll write that on the appraisal.",
           gloss='可以。維修費係二百蚊，我會寫喺估價單上面。')
j21 = L('J21')
j21['canDoEn'] = j21['canDoEn'].replace('ask the policy excess', 'ask for the repair cost on the appraisal')
j21['canDoYue'] = j21['canDoYue'].replace('問保單自負額', '請店員喺估價單寫維修費')
for ch in j21['chunks']:
    if ch['pattern'].startswith('The excess on that policy'):
        ch.update({"pattern": "Yes. The ___ is two hundred dollars, and I'll write that on the appraisal.",
                   "example": "Yes. The repair is two hundred dollars, and I'll write that on the appraisal.",
                   "glossYue": "可以。⋯⋯費係二百蚊，我會寫喺估價單上面。", "answer": "repair",
                   "choices": ["repair", "photo", "clasp"]})
for b in j21['build']:
    if b['type'] == 'order' and 'excess' in b['tokens']:
        b['tokens'] = ['Can', 'you', 'write', 'the', 'repair', 'cost', 'on', 'the', 'appraisal?']
        b['answer'] = list(b['tokens'])
for q in j21['quiz']:
    if q['type'] == 'meaning' and 'appraisal for my insurer' in q['prompt']:
        q['choices'] = ['吊墜', '相片', '保險公司']
        q['answer'] = 2
    if q['type'] == 'choice' and '___' in q['prompt'] and 'policy charge' in q['prompt']:
        q['prompt'] = 'Can you write the repair cost on the ___ for my insurer? 呢句入面，邊個字先啱？'
        q['choices'] = ['appraisal', 'pendant', 'photo']
        q['answer'] = 0
        q['explain'] = 'appraisal 係估價單。'
for t in j21['roleplay']['turns']:
    if t['expect'].startswith('Can you write the repair cost'):
        t['keywords'] = ['repair', 'appraisal']

# J12: "this Friday" contradicted "collect tomorrow".
c.set_line('j12-l8', text="I'll text you when it's ready. You can collect it tomorrow.",
           gloss='準備好我會發短訊畀你。你聽日可以嚟攞。')

r15 = json.dumps(L('R15'), ensure_ascii=False).replace('"貝殼"', '"海鮮"')
c.L['R15'] = json.loads(r15)
c.save()
json.dump(sorted(c.rerender), open('rerender_pr1a.json', 'w'), indent=1)
print('rerender', len(c.rerender))

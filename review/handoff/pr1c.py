"""PR1 part C: item-by-item wrong keys, and wrong vocab-card glosses / facts."""
import json, re, sys
sys.path.insert(0, '.')
from eq import *

c = Content()
L = lambda k: c.L[k]
def q(lid, i): return L(lid)['quiz'][i]
def b(lid, i): return L(lid)['build'][i]
def u(lid, i): return L(lid)['understand'][i]

# ---------------- lessons
x = q('F5', 5); x['choices'][2] = "I'm from Hong Kong, and I live here now."; x['explain'] = 'live 係住。I live here now 即係而家住喺度。'
x = b('F6', 0); x['choices'][0] = 'I usually wake up early, then I start my shift.'
x = b('R10', 0)
x.update({'promptYue': 'Mira 問你要唔要燕麥奶。你點答？',
          'choices': ['Yes, oat milk, please. The name is Cleo.', "Iced, please. I'd like the small size.",
                      'To go, please. Keep the small size for me, thanks.'],
          'answer': 0, 'explain': '講 oat milk，再報個名。'})
x = q('R10', 2); x.update({'prompt': "You say 'Yes, oat milk, please.' What does oat milk mean?",
                          'choices': ['拎走', '名字', '燕麥奶'], 'answer': 2})
x = b('D4', 0); x['choices'][0] = "I'll take the prepaid one. I don't need unlimited data."
x = b('D7', 0); x['promptYue'] = '你想問喺度洗頭幾多錢。你點講？'
x = q('J3', 3); x.update({'prompt': '店員講「We have a pair of pearl earrings, and they match this necklace.」，係咩意思？'})
x = q('R2', 2); x['choices'] = ['登機證', '要杯水，唔要冰', '訂位']; x['answer'] = 1
x = q('J4', 3); x['choices'] = ['玉比較閃', '鑽石比玉更閃', '兩粒一樣貴']; x['answer'] = 1
x = q('T3', 3); x['choices'] = ['雙人床', '升降機', '雙床']; x['answer'] = 0
x = q('R3', 2); x.update({'prompt': "店員講「We'll check the ingredients and tell you what's in it.」，係咩意思？",
                         'choices': ['佢哋會睇吓有咩材料，再話你知', '醬汁好辣', '冇貝類'], 'answer': 0})
x = q('T4', 3); x['choices'] = ['大概要幾耐', '一定要轉右', '已經到咗']; x['answer'] = 0
x = q('T4', 0); x['prompt'] = '聽一次，揀你聽到嘅字：的士'
x = q('J20', 2); x['choices'] = ['手工費', '手鐲', '純度']; x['answer'] = 0
x = q('R16', 2); x['choices'] = ['烤魚', '特餐', '白飯']; x['answer'] = 1
x = q('R16', 4); x['choices'] = ['rice', 'mild', 'special']; x['answer'] = 2
x = q('D1', 1); x['prompt'] = '聽一次，揀你聽到嘅字：咳嗽'
x = q('D1', 2); x.update({'prompt': '客人講「I have had a fever and cough since Monday.」，fever 係咩意思？',
                         'choices': ['期限', '發燒', '藥房'], 'answer': 1})
x = u('R8', 1); x['choices'][x['answer']] = '講地址，再串街名'
x = q('D13', 1); x.update({'lemma': 'toothache-noun', 'choices': ['anaesthetic', 'filling', 'toothache'], 'answer': 2})
x = q('J9', 3); x.update({'prompt': '店員講「The manager can review the receipt, and we will repair it if the policy allows.」，係咩意思？',
                         'choices': ['經理會睇收據，政策容許就修理', '即刻退款', '聽日先修'], 'answer': 0})
x = q('W2', 3); x.update({'prompt': x['prompt'].replace('grateful 係咩意思', 'deadline 係咩意思'), 'answer': 0})
x = q('W8', 3); x['choices'] = ['工作', '進度', '星期五']; x['answer'] = 0
for ch in L('W8')['chunks']:
    if ch['glossYue'] == '呢項行動我負責。':
        ch['glossYue'] = '呢項工作我負責，我星期五會打畀客戶。'
x = b('D3', 0); x['choices'][0] = "If I decide today, is the deposit one month's rent?"; x['explain'] = '先問按金係咪一個月租。'
x = u('T10', 2); x['choices'][x['answer']] = '問行李收據上面嘅行李牌號碼'
x = q('J11', 2); x.update({'prompt': x['prompt'].replace('preference 係咩意思', 'occasion 係咩意思'),
                          'choices': ['檔期', '訂金', '場合'], 'answer': 2})
x = q('J12', 2); x['prompt'] = "客人講「I'm calling to ask about stock, and I'll collect the bracelet tomorrow after you confirm.」，stock 係咩意思？"
x = q('W3', 1); x['prompt'] = '聽一次，揀你聽到嘅字：靜音'
x = u('R1', 2); x['explain'] = 'Right this way 即係「呢邊請」，跟住佢行。right 開頭係 /r/。'
t18 = json.dumps(L('T18'), ensure_ascii=False).replace('"酒精"', '"酒"')
c.L['T18'] = json.loads(t18)

# phoneme items with more than one right answer
x = q('T11', 4); x['choices'] = ['line', 'exit', 'top-up']
x = q('J13', 4); x['choices'] = ['quote', 'logo', 'engraving']
x = q('R7', 4); x['choices'] = ['manager', 'undercooked', 'cold']
x = q('R9', 4); x['choices'] = ['mistake', 'receipt', 'bill']
x = q('T10', 4); x['prompt'] = '邊個字開頭係 /l/？'
x = q('T9', 4); x['choices'] = ['cancelled', 'rebook', 'voucher']
q('T11', 4)['explain'] = 'exit 有 /ɪ/。line 係 /aɪ/，top-up 冇 /ɪ/。'
q('J13', 4)['explain'] = 'logo 有 /l/。quote 同 engraving 冇。'
q('R7', 4)['explain'] = 'cold 有 /l/。manager 同 undercooked 冇。'
q('R9', 4)['explain'] = 'bill 有 /l/。mistake 同 receipt 冇。'
q('T10', 4)['explain'] = 'luggage 開頭係 /l/。hotel 同 deliver 嘅 /l/ 喺後面。'
q('T9', 4)['explain'] = 'cancelled 有 /l/。rebook 同 voucher 冇。'
for lid, i in [('T11', 4), ('J13', 4), ('R7', 4), ('R9', 4), ('T10', 4), ('T9', 4)]:
    print(lid, q(lid, i))

# ---------------- vocab cards
def card(k): return c.byid[k]
k = card('wind-verb'); k['exampleYue'] = '今晚記得幫個鐘上鍊。'
for e in k.get('examples') or []:
    if e['yue'] == '今晚記得上鐘。': e['yue'] = '今晚記得幫個鐘上鍊。'
k['glossYue'] = '上鍊；繞' if k['glossYue'] == '上緊（鐘錶）；繞' else k['glossYue']
k = card('smile-verb'); k['exampleYue'] = '笑一笑。'
k = card('name-noun'); k['exampleYue'] = '我個名叫 Mei。'
c.set_md('evening-noun', 0, en='Good evening. Do you have a booking?', yue='你好，有冇訂位？')
c.set_md('evening-noun', 1, yue='你好，我哋兩位。')
c.set_md('something-pron', 0, yue='可唔可以幫我揀份嘢送畀太太？')
c.set_md('something-pron', 1, yue='呢條頸巾佢日日都戴得。')
c.set_md('left-adv', 1, yue='搵個有綠色十字嘅招牌。')
k = card('right-adv'); k['glossYue'] = '正正；右邊'
c.set_ex('quiet-adj', 0, yue='今晚有間靜啲嘅房準備好。'); card('quiet-adj')['exampleYue'] = '今晚有間靜啲嘅房準備好。'
c.set_md('quiet-adj', 0, yue='有間靜啲嘅房準備好。')
card('mute-verb')['usageNotes'] = 'mute 係將個咪靜音，等其他人聽得清。'
c.set_ex('officer-noun', 1, yue='我要搵個關員嚟櫃檯。')
c.set_md('officer-noun', 1, yue='我要搵個關員嚟櫃檯。')
card('check-noun')['glossYue'] = '張單（埋單）'
c.set_ex('tall-cup-phrase', 1, yue='中杯係咪大啲嗰杯？')
c.set_md('tall-cup-phrase', 1, yue='中杯係咪大啲嗰杯？')
c.set_ex('noise-noun', 1, yue='走廊好嘈，搞到我瞓唔着。')
c.set_md('noise-noun', 1, yue='走廊好嘈，搞到我瞓唔着。')
# facts
c.set_ex('certificate-noun', 1, en='The certificate lists the stone and its size.', yue='證書寫咗粒石同尺寸。')
c.set_md('certificate-noun', 0, en='The certificate inside the box lists the stone and its size.', yue='盒入面張證書寫咗粒石同尺寸。')
c.set_ex('souvenir-noun', 1, en='We bought a small souvenir for Mei at the airport.',
         yue='我哋喺機場買咗份細細嘅紀念品畀 Mei。')
c.set_md('souvenir-noun', 1, en='Yes, something small for my mother.', yue='係呀，想買啲細細件嘅畀媽媽。')
c.set_ex('carousel-noun', 0, en='After immigration, collect your bag at carousel three, then go through customs.',
         yue='過咗入境，去三號轉盤攞行李，跟住過海關。')
c.set_ex('carousel-noun', 1, en='Your bags are on carousel three, just after passport control.',
         yue='你啲行李喺三號轉盤，過咗護照檢查就到。')
k = card('high-chair-phrase'); k['glossYue'] = '兒童椅（BB櫈）'
k['usageNotes'] = 'high chair 係畀細路坐嘅高身兒童椅，香港餐廳叫 BB櫈。'
k['pitfallsYue'] = '酒吧嗰種大人高凳係 bar stool，唔係 high chair。'
k['exampleYue'] = '可唔可以要張兒童椅？'
for e in (k.get('examples') or []) + (k.get('miniDialogue') or []):
    e['yue'] = e['yue'].replace('一張高腳櫈', '張兒童椅').replace('張高腳櫈', '張兒童椅').replace('高腳櫈', '兒童椅')
c.set_md('allergic-adj', 0, yue='我對甲殼類海鮮敏感，蝦同蟹都唔食得。')
k = card('alcohol-noun'); k['glossYue'] = '酒（酒類）'; k['usageNotes'] = 'alcohol 喺海關即係酒類。酒精係化學名，唔係飲品。'
c.set_ex('alcohol-noun', 2, yue='呢枝係咪酒，定係淨係果汁？')
c.set_md('alcohol-noun', 0, yue='呢樽酒已經超過免稅限額。')
c.set_md('alcohol-noun', 1, yue='因為啲酒超咗限額，你可能要補稅。')

sl = load('content/sense-labels.json')
for key, val in [('noun:restaurant-bill', '帳單'), ('adj:food-reaction', '過敏'), ('prep:lacking', '唔要；冇'),
                 ('noun:drink-spirit', '酒'), ('noun:home-bills', '水電煤')]:
    sl['sense'][key] = val
save('content/sense-labels.json', sl)

w8 = L('W8'); w8['topicTags'] = w8['topicTags'] + ['工作']
c.save()
json.dump(sorted(c.rerender), open('rerender_pr1c.json', 'w'), indent=1)
print('rerender', sorted(c.rerender))

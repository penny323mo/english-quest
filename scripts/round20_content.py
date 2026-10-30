"""Round 20: J7, R3, and T3 lexicon, lessons, decks, and soon teasers.

Imported by emit_content.py. Does not render audio and does not fetch Wiktionary.
"""
from __future__ import annotations

J7_IDS = [
    "pay-verb",
    "card-noun",
    "cash-noun",
    "contactless-adj",
    "receipt-noun",
    "invoice-noun",
    "tax-free-phrase",
    "refund-form-phrase",
    "bag-noun",
    "wrap-verb",
    "gift-box-phrase",
    "signature-noun",
    "approve-verb",
    "decline-verb",
]

R3_IDS = [
    "allergy-noun",
    "allergic-adj",
    "peanut-noun",
    "shellfish-noun",
    "dairy-noun",
    "gluten-noun",
    "spicy-adj",
    "sauce-noun",
    "on-the-side-phrase",
    "without-prep",
    "instead-adv",
    "contain-verb",
    "ingredients-noun",
    "carefully-adv",
    "thank-you-for-telling-phrase",
]

T3_IDS = [
    "key-card-phrase",
    "room-noun",
    "twin-noun",
    "double-adj",
    "view-noun",
    "wifi-noun",
    "password-noun",
    "breakfast-noun",
    "floor-noun",
    "elevator-noun",
    "late-checkout-phrase",
    "wake-up-call-phrase",
]

NEW = set(J7_IDS + R3_IDS + T3_IDS)

SENSE = {
    "verb:settle": "付款",
    "noun:payment-card": "付款卡",
    "noun:notes": "現金",
    "adj:tap-pay": "拍卡",
    "noun:proof": "收據",
    "noun:bill-doc": "發票",
    "phrase:no-tax": "免稅",
    "phrase:return-paper": "退款表",
    "noun:carrier": "紙袋",
    "verb:cover-gift": "包禮物",
    "phrase:present-box": "禮盒",
    "noun:signed-name": "簽名",
    "verb:accept-pay": "批核",
    "verb:refuse-pay": "拒絕",
    "noun:food-reaction": "過敏",
    "adj:food-reaction": "對食物",
    "noun:legume": "花生",
    "noun:seafood-mix": "貝類",
    "noun:milk-food": "奶製品",
    "noun:wheat-protein": "麩質",
    "adj:hot-spice": "辣",
    "noun:condiment": "醬",
    "phrase:served-apart": "另上",
    "prep:lacking": "冇包含",
    "adv:as-replacement": "改為",
    "verb:hold-inside": "含有",
    "noun:contents": "成分",
    "adv:with-care": "小心",
    "phrase:thanks-info": "多謝告知",
    "phrase:room-key": "鑰匙卡",
    "noun:hotel-room": "房間",
    "noun:two-beds": "雙床",
    "adj:one-large-bed": "雙人床",
    "noun:outlook": "景觀",
    "noun:wireless": "無線網絡",
    "noun:secret-code": "密碼",
    "noun:morning-meal": "早餐",
    "noun:storey": "樓層",
    "noun:lift": "升降機",
    "phrase:late-leave": "延遲退房",
    "phrase:morning-call": "叫醒",
}


def _meta(register, usage, pitfall, related, ex2, ex2_yue, ex2_say=None, mini=None):
    row = {
        "register": register,
        "usage": usage,
        "pitfall": pitfall,
        "related": related,
        "ex2": (ex2, ex2_yue, ex2_say),
    }
    if mini:
        row["mini"] = mini
    return row


META = {
    "pay-verb": _meta(
        "櫃檯", "Would you like to pay by card?",
        "pay 係付款。唔好讀成 /pe/。",
        ["card-noun", "cash-noun"],
        "Could I pay by card?", "可唔可以畀我用卡付款？",
        mini=[("Would you like to pay by card?", "你想唔想用卡付款？"), ("Yes, please.", "好，唔該。")],
    ),
    "card-noun": _meta(
        "櫃檯", "pay by card。",
        "card 呢度係付款卡。名片先至係 name card。",
        ["pay-verb", "contactless-adj"],
        "The card payment is ready.", "卡付款已經準備好。",
    ),
    "cash-noun": _meta(
        "櫃檯", "pay with cash。",
        "cash 尾係 /ʃ/，唔好讀成 /s/。",
        ["pay-verb", "receipt-noun"],
        "I do not have cash today.", "我今日冇帶現金。",
    ),
    "contactless-adj": _meta(
        "櫃檯", "contactless pay。",
        "中間有 /l/。拍卡就得，唔使插卡。",
        ["card-noun", "pay-verb"],
        "Contactless pay is ready now.", "而家可以拍卡付款。",
    ),
    "receipt-noun": _meta(
        "櫃檯", "Here is your receipt.",
        "重音喺第二節。唔好讀成開頭重音。",
        ["invoice-noun", "signature-noun"],
        "Please keep this receipt.", "請留低呢張收據。",
        "Please keep this [[ɹɪsˈit]].",
    ),
    "invoice-noun": _meta(
        "櫃檯", "I need an invoice.",
        "發票先至係 invoice。收據先至係 receipt。",
        ["receipt-noun", "tax-free-phrase"],
        "The invoice includes the total.", "發票有寫總數。",
    ),
    "tax-free-phrase": _meta(
        "櫃檯", "This purchase is tax-free.",
        "免稅係 tax-free。稅包咗先至係 tax included。",
        ["receipt-noun", "passport-noun"],
        "Tax-free needs your passport.", "免稅要睇你本護照。",
    ),
    "refund-form-phrase": _meta(
        "櫃檯", "Please sign the refund form.",
        "refund 呢度係名詞，重音喺第一節。動詞先至係第二節重音。",
        ["signature-noun", "receipt-noun"],
        "The refund form is on the counter.", "退款表格喺櫃檯上面。",
        "The [[ɹˈifˌʌnd]] form is on the counter.",
    ),
    "bag-noun": _meta(
        "櫃檯", "a paper bag。",
        "紙袋係 bag。行李先至係 luggage。",
        ["wrap-verb", "gift-box-phrase"],
        "Would you like a paper bag?", "你要唔要一個紙袋？",
    ),
    "wrap-verb": _meta(
        "櫃檯", "I can wrap the gift.",
        "開頭 w 唔出聲。",
        ["gift-box-phrase", "bag-noun"],
        "Please wrap this gift.", "請包裝呢份禮物。",
        "Please [[ɹˈæp]] this gift.",
    ),
    "gift-box-phrase": _meta(
        "櫃檯", "a gift box。",
        "禮盒係 gift box。包裝個動作先至係 wrap。",
        ["wrap-verb", "bag-noun"],
        "The gift box is ready.", "禮盒已經預備好。",
    ),
    "signature-noun": _meta(
        "櫃檯", "I need your signature.",
        "三音節。簽名係 signature。收據先至係 receipt。",
        ["receipt-noun", "approve-verb"],
        "Your signature goes here.", "簽名簽喺呢度。",
    ),
    "approve-verb": _meta(
        "櫃檯", "approve the payment。",
        "重音喺第二節。批核先至係 approve。",
        ["decline-verb", "card-noun"],
        "The bank did not approve it.", "銀行未批核呢筆付款。",
    ),
    "decline-verb": _meta(
        "櫃檯", "decline the payment。",
        "重音喺第二節。拒絕付款先用 decline。",
        ["approve-verb", "card-noun"],
        "I will decline this offer.", "我會拒絕呢個提議。",
    ),
    "allergy-noun": _meta(
        "餐廳", "I have a food allergy.",
        "名詞 allergy 重音喺第一節。形容詞先至係 allergic。",
        ["allergic-adj", "peanut-noun"],
        "Please tell me about any allergy.", "有過敏就話我知。",
    ),
    "allergic-adj": _meta(
        "餐廳", "I am allergic to peanuts.",
        "重音喺中間。後面用 to。",
        ["allergy-noun", "peanut-noun"],
        "She is allergic to shellfish.", "佢對貝類過敏。",
        "She is [[əlˈɜdʒɪk]] to shellfish.",
        mini=[("I am allergic to peanuts.", "我對花生過敏。"), ("Thank you for telling me.", "多謝你話我知。")],
    ),
    "peanut-noun": _meta(
        "餐廳", "peanut sauce。",
        "第二音係輕 /ə/。唔好讀成重音。",
        ["allergic-adj", "sauce-noun"],
        "This sauce has peanuts.", "呢款醬有花生。",
        "This sauce has [[pˈinəts]].",
    ),
    "shellfish-noun": _meta(
        "餐廳", "I cannot eat shellfish.",
        "有 /l/ 同 /ʃ/。貝類係 shellfish。",
        ["allergy-noun", "spicy-adj"],
        "Shellfish is not in this dish.", "呢道菜冇貝類。",
    ),
    "dairy-noun": _meta(
        "餐廳", "dairy products。",
        "奶製品係 dairy。日記先至係 diary，唔好撈。",
        ["gluten-noun", "ingredients-noun"],
        "I avoid dairy in this dish.", "呢道菜我唔食奶製品。",
    ),
    "gluten-noun": _meta(
        "餐廳", "This bread has gluten.",
        "第一音係 /u/。麩質係 gluten。",
        ["dairy-noun", "ingredients-noun"],
        "Is there gluten in the sauce?", "醬入面有冇麩質？",
    ),
    "spicy-adj": _meta(
        "餐廳", "too spicy。",
        "辣係 spicy。醬先至係 sauce。",
        ["sauce-noun", "on-the-side-phrase"],
        "I do not want it spicy.", "我唔想要辣。",
    ),
    "sauce-noun": _meta(
        "餐廳", "the sauce。",
        "醬係 sauce。尾音 /s/。",
        ["on-the-side-phrase", "spicy-adj"],
        "Could I have the sauce later?", "醬可唔可以遲啲先上？",
    ),
    "on-the-side-phrase": _meta(
        "餐廳", "on the side。",
        "另上係 on the side。on 讀 /ɔn/。",
        ["sauce-noun", "without-prep"],
        "Please put the sauce on the side.", "請將醬另上。",
        "Please put the sauce [[ˈɔn]] the side.",
    ),
    "without-prep": _meta(
        "餐廳", "without nuts。",
        "中間係清 /θ/。唔好讀成有聲 /ð/。",
        ["instead-adv", "allergic-adj"],
        "Could I have it without sauce?", "可唔可以唔要醬？",
        "Could I have it [[wɪθˈaʊt]] sauce?",
    ),
    "instead-adv": _meta(
        "餐廳", "fish instead。",
        "改為係 instead。重音喺第二節。",
        ["without-prep", "contain-verb"],
        "I will take the fish instead.", "我改為叫魚。",
    ),
    "contain-verb": _meta(
        "餐廳", "Does this contain peanuts?",
        "含有係 contain。重音喺第二節。",
        ["ingredients-noun", "peanut-noun"],
        "Does the sauce contain dairy?", "醬入面含唔含奶製品？",
    ),
    "ingredients-noun": _meta(
        "餐廳", "see the ingredients。",
        "成分係 ingredients。重音喺第二節。",
        ["contain-verb", "allergy-noun"],
        "The ingredients are on the menu.", "成分寫喺餐牌度。",
    ),
    "carefully-adv": _meta(
        "餐廳", "check carefully。",
        "小心係 carefully。三音節。",
        ["ingredients-noun", "allergy-noun"],
        "We checked the dish carefully.", "我哋已經小心查過呢道菜。",
    ),
    "thank-you-for-telling-phrase": _meta(
        "餐廳", "Thank you for telling me.",
        "多謝你話我知。唔好直譯成書面語「告訴我」。",
        ["allergy-noun", "carefully-adv"],
        "Thank you for telling the kitchen.", "多謝你話廚房知。",
    ),
    "key-card-phrase": _meta(
        "酒店", "Here is your key card.",
        "鑰匙卡係 key card。一張卡開一間房。",
        ["room-noun", "floor-noun"],
        "The key card opens your room.", "鑰匙卡開你間房。",
        mini=[("Here is your key card.", "呢張係你把鑰匙卡。"), ("Thank you.", "多謝。")],
    ),
    "room-noun": _meta(
        "酒店", "Your room is ready.",
        "房間係 room。雙人房先至係 double room。",
        ["double-adj", "twin-noun"],
        "Is the room ready now?", "間房而家預備好未？",
    ),
    "twin-noun": _meta(
        "酒店", "a twin room。",
        "雙床房有兩張床。一張大床先至係 double。",
        ["double-adj", "room-noun"],
        "We need a twin room tonight.", "我哋今晚要一間雙床房。",
    ),
    "double-adj": _meta(
        "酒店", "a double room。",
        "雙人房係一張大床。唔好同 twin 撈。",
        ["twin-noun", "view-noun"],
        "A double room is fine.", "雙人房就得。",
    ),
    "view-noun": _meta(
        "酒店", "a room with a view。",
        "景觀係 view。樓層先至係 floor。",
        ["room-noun", "floor-noun"],
        "I would like a city view.", "我想要城市景觀。",
    ),
    "wifi-noun": _meta(
        "酒店", "the wifi password。",
        "讀 /ˈwaɪ.faɪ/。唔好讀成 wee-fee。",
        ["password-noun", "room-noun"],
        "Wifi is free in the room.", "房入面無線網絡係免費。",
        "[[wˈaɪfˌaɪ]] is free in the room.",
    ),
    "password-noun": _meta(
        "酒店", "The password is on the card.",
        "重音喺第一節。第二節係 /ɝ/。",
        ["wifi-noun", "key-card-phrase"],
        "Could you tell me the password?", "可唔可以話我知密碼？",
        "Could you tell me the [[pˈæswˌɜd]]?",
    ),
    "breakfast-noun": _meta(
        "酒店", "Breakfast is included.",
        "早餐係 breakfast。兩音節。",
        ["include-verb", "room-noun"],
        "What time is breakfast?", "早餐幾點開始？",
    ),
    "floor-noun": _meta(
        "酒店", "on this floor。",
        "樓層係 floor。有 /l/。",
        ["elevator-noun", "room-noun"],
        "Your room is on floor five.", "你間房喺五樓。",
    ),
    "elevator-noun": _meta(
        "酒店", "The elevator is on the left.",
        "口語講升降機。重音喺第一節。",
        ["floor-noun", "luggage-noun"],
        "Please take the elevator.", "請搭升降機。",
    ),
    "late-checkout-phrase": _meta(
        "酒店", "a late checkout。",
        "延遲退房係 late checkout。checkout 係一個詞。",
        ["room-noun", "wake-up-call-phrase"],
        "Is a late checkout possible?", "可唔可以延遲退房？",
    ),
    "wake-up-call-phrase": _meta(
        "酒店", "a wake-up call。",
        "叫醒電話係 wake-up call。up 讀 /ʌp/。",
        ["late-checkout-phrase", "room-noun"],
        "I need a wake-up call at seven.", "我要七點叫醒電話。",
    ),
}


def add_items(add) -> None:
    add("pay-verb", "pay", "verb", "settle", "P EY1", ["pay"],
        "付款", "付款", "fuk6 fun2", ["pay by card"],
        "Would you like to pay by card?", "你想唔想用卡付款？")
    add("card-noun", "card", "noun", "payment-card", "K AA1 R D", ["card"],
        "卡", "卡", "kaat1", ["pay by card", "a card"],
        "I will pay by card.", "我會用卡付款。")
    add("cash-noun", "cash", "noun", "notes", "K AE1 SH", ["cash"],
        "現金", "现金", "jin6 gam1", ["pay with cash"],
        "I can pay with cash.", "我可以用現金付款。")
    add("contactless-adj", "contactless", "adj", "tap-pay", "K AA1 . N T AE0 . K T L EH2 S", ["con", "tact", "less"],
        "免接觸", "免接触", "min5 zip3 zuk1", ["contactless pay"],
        "Contactless pay is ready.", "可以拍卡付款。",
        note="中間有 /l/。")
    add("receipt-noun", "receipt", "noun", "proof", "R IH0 . S IY1 T", ["re", "ceipt"],
        "收據", "收据", "sau1 geoi3", ["a receipt"],
        "Here is your receipt.", "呢張係你張收據。",
        piper="Here is your [[ɹɪsˈit]].",
        note="重音喺第二節。")
    add("invoice-noun", "invoice", "noun", "bill-doc", "IH1 N . V OY0 S", ["in", "voice"],
        "發票", "发票", "faat3 piu3", ["an invoice"],
        "I need an invoice.", "我需要一張發票。")
    add("tax-free-phrase", "tax-free", "phrase", "no-tax", "T AE1 K S | F R IY1", ["tax", "free"],
        "免稅", "免税", "min5 seoi3", ["tax-free shopping"],
        "This purchase is tax-free.", "呢單可以免稅。", phrase=True)
    add("refund-form-phrase", "refund form", "phrase", "return-paper", "R IY1 . F AH2 N D | F AO1 R M", ["re", "fund", "form"],
        "退款表格", "退款表格", "teoi3 fun2 biu2 gaak3", ["sign the refund form"],
        "Please sign the refund form.", "請簽呢張退款表格。", phrase=True,
        piper="Please sign the [[ɹˈifˌʌnd]] form.")
    add("bag-noun", "bag", "noun", "carrier", "B AE1 G", ["bag"],
        "袋", "袋", "doi2", ["a paper bag"],
        "I need a paper bag.", "我要一個紙袋。")
    add("wrap-verb", "wrap", "verb", "cover-gift", "R AE1 P", ["wrap"],
        "包裝", "包装", "baau1 zong1", ["wrap the gift"],
        "I can wrap the gift.", "我可以包裝份禮物。",
        piper="I can [[ɹˈæp]] the gift.",
        note="開頭 w 唔出聲。")
    add("gift-box-phrase", "gift box", "phrase", "present-box", "G IH1 F T | B AA1 K S", ["gift", "box"],
        "禮盒", "礼盒", "lai5 hap6", ["a gift box"],
        "This gift box is ready.", "呢個禮盒預備好。", phrase=True)
    add("signature-noun", "signature", "noun", "signed-name", "S IH1 G . N AH0 . CH ER0", ["sig", "na", "ture"],
        "簽名", "签名", "cim1 meng2", ["your signature"],
        "I need your signature.", "我需要你簽名。",
        note="三音節，尾係 /ɚ/。")
    add("approve-verb", "approve", "verb", "accept-pay", "AH0 . P R UW1 V", ["ap", "prove"],
        "批核", "批核", "pai1 hat6", ["approve the payment"],
        "The bank will approve the payment.", "銀行會批核呢筆付款。")
    add("decline-verb", "decline", "verb", "refuse-pay", "D IH0 . K L AY1 N", ["de", "cline"],
        "拒絕", "拒绝", "keoi5 zyut6", ["decline the offer"],
        "I will decline the offer.", "我會拒絕呢個提議。")
    add("allergy-noun", "allergy", "noun", "food-reaction", "AE1 . L ER0 . JH IY0", ["al", "ler", "gy"],
        "過敏", "过敏", "gwo3 man5", ["a food allergy"],
        "I have a food allergy.", "我有食物過敏。")
    add("allergic-adj", "allergic", "adj", "food-reaction", "AH0 . L ER1 . JH IH0 K", ["al", "ler", "gic"],
        "過敏", "过敏", "gwo3 man5", ["allergic to peanuts"],
        "I am allergic to peanuts.", "我對花生過敏。",
        piper="I am [[əlˈɜdʒɪk]] to peanuts.",
        note="重音喺中間 /ɝ/。")
    add("peanut-noun", "peanut", "noun", "legume", "P IY1 . N AH0 T", ["pea", "nut"],
        "花生", "花生", "faa1 sang1", ["peanut sauce"],
        "I cannot eat peanut sauce.", "我唔食花生醬。",
        piper="I cannot eat [[pˈinət]] sauce.")
    add("shellfish-noun", "shellfish", "noun", "seafood-mix", "SH EH1 L . F IH2 SH", ["shell", "fish"],
        "貝類", "贝类", "bui3 leoi6", ["no shellfish"],
        "I cannot eat shellfish.", "我唔食貝類。",
        note="有 /l/。")
    add("dairy-noun", "dairy", "noun", "milk-food", "D EH1 . R IY0", ["dai", "ry"],
        "奶製品", "奶制品", "naai5 zai3 ban2", ["dairy products"],
        "I avoid dairy products.", "我唔食奶製品。")
    add("gluten-noun", "gluten", "noun", "wheat-protein", "G L UW1 . T AH0 N", ["glu", "ten"],
        "麩質", "麸质", "fu1 zat1", ["no gluten"],
        "This bread has gluten.", "呢款麵包有麩質。")
    add("spicy-adj", "spicy", "adj", "hot-spice", "S P AY1 . S IY0", ["spi", "cy"],
        "辣", "辣", "laat6", ["too spicy"],
        "This dish is too spicy.", "呢道菜太辣。")
    add("sauce-noun", "sauce", "noun", "condiment", "S AO1 S", ["sauce"],
        "醬", "酱", "zoeng3", ["the sauce"],
        "The sauce is on the side.", "醬汁放喺旁邊。")
    add("on-the-side-phrase", "on the side", "phrase", "served-apart", "AO1 N | DH AH0 | S AY1 D", ["on", "the", "side"],
        "另上", "另上", "ling6 soeng5", ["sauce on the side"],
        "Sauce on the side, please.", "醬汁另上，唔該。", phrase=True,
        piper="Sauce [[ˈɔn]] the side, please.")
    add("without-prep", "without", "prep", "lacking", "W IH0 TH . AW1 T", ["with", "out"],
        "冇", "没有", "mou5", ["without sauce"],
        "Could I have it without nuts?", "可唔可以唔要果仁？",
        piper="Could I have it [[wɪθˈaʊt]] nuts?",
        note="中間係清 /θ/。")
    add("instead-adv", "instead", "adv", "as-replacement", "IH2 N . S T EH1 D", ["in", "stead"],
        "改為", "改为", "goi2 wai4", ["fish instead"],
        "I will have fish instead.", "我改為叫魚。")
    add("contain-verb", "contain", "verb", "hold-inside", "K AH0 N . T EY1 N", ["con", "tain"],
        "含有", "含有", "ham4 jau5", ["contain peanuts"],
        "Does this dish contain peanuts?", "呢道菜含唔含花生？")
    add("ingredients-noun", "ingredients", "noun", "contents", "IH2 . N G R IY1 . D IY0 . AH0 N T S", ["in", "gre", "di", "ents"],
        "成分", "成分", "sing4 fan6", ["the ingredients"],
        "Could I see the ingredients?", "可唔可以睇吓成分？")
    add("carefully-adv", "carefully", "adv", "with-care", "K EH1 R . F AH0 . L IY0", ["care", "ful", "ly"],
        "小心", "小心", "siu2 sam1", ["check carefully"],
        "We will check carefully.", "我哋會小心檢查。")
    add("thank-you-for-telling-phrase", "thank you for telling me", "phrase", "thanks-info",
        "TH AE1 NG K | Y UW1 | F AO1 R | T EH1 . L IH0 NG", ["thank", "you", "for", "tell", "ing"],
        "多謝你話我知", "谢谢你告诉我", "do1 ze6 nei5 waa6 ngo5 zi1", ["thank you for telling me"],
        "Thank you for telling me.", "多謝你話我知。", phrase=True)
    add("key-card-phrase", "key card", "phrase", "room-key", "K IY1 | K AA1 R D", ["key", "card"],
        "鑰匙卡", "钥匙卡", "so2 si4 kaat1", ["your key card"],
        "Here is your key card.", "呢張係你把鑰匙卡。", phrase=True)
    add("room-noun", "room", "noun", "hotel-room", "R UW1 M", ["room"],
        "房間", "房间", "fong2 gaan1", ["your room"],
        "Your room is ready.", "你間房預備好。")
    add("twin-noun", "twin", "noun", "two-beds", "T W IH1 N", ["twin"],
        "雙床", "双床", "soeng1 cong4", ["a twin room"],
        "A twin room has two beds.", "雙床房有兩張床。")
    add("double-adj", "double", "adj", "one-large-bed", "D AH1 . B AH0 L", ["dou", "ble"],
        "雙人", "双人", "soeng1 jan4", ["a double room"],
        "A double room has one large bed.", "雙人房有一張大床。")
    add("view-noun", "view", "noun", "outlook", "V Y UW1", ["view"],
        "景觀", "景观", "ging2 gun1", ["a room with a view"],
        "I would like a room with a view.", "我想要有景觀嘅房。")
    add("wifi-noun", "wifi", "noun", "wireless", "W AY1 . F AY2", ["wi", "fi"],
        "無線網絡", "无线网络", "mou4 sin3 mong5 lok3", ["the wifi"],
        "The wifi password is on the card.", "無線網絡密碼喺卡上面。",
        piper="The [[wˈaɪfˌaɪ]] password is on the card.",
        cmu="wifi")
    add("password-noun", "password", "noun", "secret-code", "P AE1 S . W ER2 D", ["pass", "word"],
        "密碼", "密码", "mat6 maa5", ["the password"],
        "The password is on the card.", "密碼寫喺卡上面。",
        piper="The [[pˈæswˌɜd]] is on the card.",
        note="第二節係 /ɝ/。")
    add("breakfast-noun", "breakfast", "noun", "morning-meal", "B R EH1 . K F AH0 S T", ["break", "fast"],
        "早餐", "早餐", "zou2 caan1", ["breakfast is included"],
        "Breakfast is included.", "早餐已經包咗。")
    add("floor-noun", "floor", "noun", "storey", "F L AO1 R", ["floor"],
        "樓層", "楼层", "lau4 cang4", ["this floor"],
        "Your room is on this floor.", "你間房喺呢層。",
        note="有 /l/。")
    add("elevator-noun", "elevator", "noun", "lift", "EH1 . L AH0 . V EY2 . T ER0", ["el", "e", "va", "tor"],
        "升降機", "电梯", "sing1 gong3 gei1", ["the elevator"],
        "The elevator is on the left.", "升降機喺左手邊。",
        note="重音喺第一節。口語講升降機。")
    add("late-checkout-phrase", "late checkout", "phrase", "late-leave", "L EY1 T | CH EH1 K . AW2 T", ["late", "check", "out"],
        "延遲退房", "延迟退房", "jin4 ci4 teoi3 fong4", ["a late checkout"],
        "I need a late checkout.", "我需要延遲退房。", phrase=True)
    add("wake-up-call-phrase", "wake-up call", "phrase", "morning-call", "W EY1 K | AH1 P | K AO1 L", ["wake", "up", "call"],
        "叫醒電話", "叫醒电话", "giu3 sing2 din6 waa2", ["a wake-up call"],
        "I would like a wake-up call.", "我想要叫醒電話。", phrase=True)


def _line(lid, speaker, label, text, gloss, piper=None):
    return {
        "id": lid,
        "speaker": speaker,
        "speakerLabel": label,
        "text": text,
        "glossYue": gloss,
        "audio": f"assets/audio/lines/{lid}.mp3",
        "audioSlow": f"assets/audio/lines/{lid}-slow.mp3",
        "say": piper or text,
    }


def _turn(partner, pid, line, expect, keywords, model):
    return {
        "partner": partner,
        "partnerId": pid,
        "line": line["text"],
        "audio": line["audio"],
        "audioSlow": line["audioSlow"],
        "expect": expect,
        "keywords": keywords,
        "modelAudio": model["audio"],
        "modelSlow": model["audioSlow"],
    }


def lesson_pack():
    j7 = [
        _line("j7-l1", "mei", "Mei", "The total is ready.", "總數準備好。"),
        _line("j7-l2", "tom", "Tom", "I will pay by card.", "我會用卡付款。"),
        _line("j7-l3", "mei", "Mei", "This purchase is tax-free.", "呢單可以免稅。"),
        _line("j7-l4", "tom", "Tom", "Here is my passport.", "呢本係我本護照。"),
        _line("j7-l5", "mei", "Mei", "I can wrap the gift.", "我可以包裝份禮物。", "I can [[ɹˈæp]] the gift."),
    ]
    j7x = [
        _line("j7-l6", "tom", "Tom", "Could I pay with cash?", "可唔可以用現金付款？"),
        _line("j7-l7", "tom", "Tom", "Could you wrap this?", "可唔可以包裝呢份？"),
        _line("j7-m1", "mei", "Mei", "Would you like to pay by card?", "你想唔想用卡付款？"),
        _line("j7-m2", "mei", "Mei", "Here is your receipt.", "呢張係你張收據。", "Here is your [[ɹɪsˈit]]."),
        _line("j7-m3", "mei", "Mei", "Please sign the refund form.", "請簽呢張退款表格。", "Please sign the [[ɹˈifˌʌnd]] form."),
    ]
    r3 = [
        _line("r3-l1", "tom", "Tom", "I'd like the chicken, please.", "我想叫雞，唔該。"),
        _line("r3-l2", "tom", "Tom", "I am allergic to peanuts.", "我對花生過敏。", "I am [[əlˈɜdʒɪk]] to [[pˈinəts]]."),
        _line("r3-l3", "ana", "Ana", "We will check the ingredients.", "我哋會查吓成分。"),
        _line("r3-l4", "tom", "Tom", "Could I have the sauce on the side?", "醬可唔可以另上？", "Could I have the sauce [[ˈɔn]] the side?"),
        _line("r3-l5", "ana", "Ana", "Thank you for telling me.", "多謝你話我知。"),
    ]
    r3x = [
        _line("r3-a1", "ana", "Ana", "What would you like to order?", "你想叫咩？"),
        _line("r3-a2", "ana", "Ana", "The sauce is spicy.", "呢款醬好辣。"),
        _line("r3-m1", "ana", "Ana", "Does this dish contain peanuts?", "呢道菜含唔含花生？"),
        _line("r3-m2", "tom", "Tom", "Could I have it without nuts?", "可唔可以唔要果仁？", "Could I have it [[wɪθˈaʊt]] nuts?"),
    ]
    t3 = [
        _line("t3-l1", "kai", "Kai", "Do you have a reservation?", "你有冇訂房？"),
        _line("t3-l2", "tom", "Tom", "I have a reservation under Tom.", "我用 Tom 個名訂咗房。"),
        _line("t3-l3", "kai", "Kai", "Your room is a double with a view.", "你間房係有景觀嘅雙人房。"),
        _line("t3-l4", "tom", "Tom", "Could you tell me the wifi password?", "可唔可以話我知無線網絡密碼？", "Could you tell me the [[wˈaɪfˌaɪ]] [[pˈæswˌɜd]]?"),
        _line("t3-l5", "kai", "Kai", "Here is your key card.", "呢張係你把鑰匙卡。"),
    ]
    t3x = [
        _line("t3-m1", "kai", "Kai", "Breakfast is included.", "早餐已經包咗。"),
        _line("t3-m2", "tom", "Tom", "Could I have a late checkout?", "可唔可以延遲退房？"),
        _line("t3-m3", "kai", "Kai", "The elevator is on the left.", "升降機喺左手邊。"),
    ]
    lessons = [
        {
            "id": "J7",
            "unit": "J",
            "titleYue": "付款同退稅",
            "titleEn": "Payment and tax-free",
            "canDoYue": "你能夠收款、講免稅同包裝。",
            "canDoEn": "Take a card or cash payment, explain tax-free, and offer a bag or wrap.",
            "minutes": 12,
            "hero": "assets/art/lessons/j7.webp",
            "cast": ["mei", "tom"],
            "cefr": "A2/B1",
            "lemmas": J7_IDS + ["passport-noun"],
            "dialogue": j7,
            "understand": [
                {"prompt": "Would you like to pay by card? 係問？", "choices": ["想唔想用卡付款", "想唔想試戒指", "想唔想叫雞"], "answer": 0, "explain": "pay by card 係用卡付款。現金先至係 cash。"},
                {"prompt": "This purchase is tax-free. 即係？", "choices": ["呢單可以免稅", "稅已經包咗", "要加一成"], "answer": 0, "explain": "tax-free 係免稅。要睇護照。"},
                {"prompt": "Here is your receipt. 你遞畀客人？", "choices": ["收據", "退款表格", "禮盒"], "answer": 0, "explain": "receipt 重音喺第二節。發票先至係 invoice。"},
            ],
            "chunks": [
                {"pattern": "Would you like to pay by ___?", "example": "Would you like to pay by card?", "glossYue": "你想唔想用⋯⋯付款？", "answer": "card", "choices": ["card", "chicken", "gate"]},
                {"pattern": "This purchase is ___.", "example": "This purchase is tax-free.", "glossYue": "呢單可以⋯⋯。", "answer": "tax-free", "choices": ["tax-free", "spicy", "loose"]},
                {"pattern": "Here is your ___.", "example": "Here is your receipt.", "glossYue": "呢張係你張⋯⋯。", "answer": "receipt", "choices": ["receipt", "mirror", "menu"]},
                {"pattern": "I can ___ the gift.", "example": "I can wrap the gift.", "glossYue": "我可以⋯⋯份禮物。", "answer": "wrap", "choices": ["wrap", "measure", "recommend"]},
            ],
            "shadow": {"lineId": "j7-l5", "hint": "I can wrap the gift."},
            "build": [
                {"type": "choice", "promptYue": "Tom 想用現金。你點問卡？", "choices": ["Would you like to pay by card?", "Look in the mirror.", "A table for two, please."], "answer": 0, "explain": "先問付款方法。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Would", "you", "like", "to", "pay", "by", "card"], "answer": ["Would", "you", "like", "to", "pay", "by", "card"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "Tom 喺櫃檯準備付款。等佢講完先答。免稅要睇護照。",
                "turns": [
                    _turn("Tom", "tom", j7x[0], "Would you like to pay by card?", ["pay", "card"], j7x[2]),
                    _turn("Tom", "tom", j7[3], "This purchase is tax-free.", ["tax"], j7[2]),
                    _turn("Tom", "tom", j7x[1], "I can wrap the gift.", ["wrap"], j7[4]),
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "receipt-noun", "choices": ["receipt", "invoice", "cash"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "contactless-adj", "choices": ["contactless", "signature", "wrap"], "answer": 0},
                {"type": "meaning", "prompt": "tax-free", "choices": ["免稅", "收據", "紙袋"], "answer": 0},
                {"type": "meaning", "prompt": "wrap", "choices": ["包裝", "簽名", "批核"], "answer": 0},
                {"type": "choice", "prompt": "邊個有 /l/？", "choices": ["contactless", "cash", "pay"], "answer": 0, "explain": "contactless 有 /l/。cash 尾係 /ʃ/。"},
            ],
            "sound": {
                "ipa": "/l/",
                "title": "拍卡入面嗰個音",
                "note": "contactless 有 /l/。舌尖抵住上顎後面，氣由兩邊出。cash 尾係 /ʃ/，唔好讀成 /s/。receipt 重音喺第二節。wrap 開頭唔出聲。",
                "pairs": [
                    {"a": "contactless-adj", "b": "cash-noun"},
                    {"a": "bag-noun", "b": "wrap-verb"},
                ],
                "drill": ["contactless-adj", "receipt-noun", "wrap-verb", "cash-noun", "signature-noun"],
            },
            "next": "T1",
        },
        {
            "id": "R3",
            "unit": "R",
            "titleYue": "過敏同特別要求",
            "titleEn": "Allergies and special requests",
            "canDoYue": "你能夠講過敏同特別要求。",
            "canDoEn": "Say an allergy and ask for a dish without something, or with the sauce on the side.",
            "minutes": 12,
            "hero": "assets/art/lessons/r3.webp",
            "cast": ["ana", "tom"],
            "cefr": "A2",
            "lemmas": R3_IDS,
            "dialogue": r3,
            "understand": [
                {"prompt": "I am allergic to peanuts. 係講？", "choices": ["我對花生過敏", "我想叫雞", "醬好辣"], "answer": 0, "explain": "allergic to 後面跟唔食得嘅嘢。"},
                {"prompt": "Could I have the sauce on the side? 即係？", "choices": ["醬另上", "醬唔要得", "要多啲辣"], "answer": 0, "explain": "on the side 係另上。唔要先至係 without。"},
                {"prompt": "Thank you for telling me. 你應該？", "choices": ["多謝客人話你知", "叫佢埋單", "問佢訂位"], "answer": 0, "explain": "聽到過敏先多謝，再去查成分。"},
            ],
            "chunks": [
                {"pattern": "I am allergic to ___.", "example": "I am allergic to peanuts.", "glossYue": "我對⋯⋯過敏。", "answer": "peanuts", "choices": ["peanuts", "window", "passport"]},
                {"pattern": "Could I have it ___ nuts?", "example": "Could I have it without nuts?", "glossYue": "可唔可以⋯⋯果仁？", "answer": "without", "choices": ["without", "with", "under"]},
                {"pattern": "Sauce on the ___, please.", "example": "Sauce on the side, please.", "glossYue": "醬⋯⋯，唔該。", "answer": "side", "choices": ["side", "seat", "sale"]},
                {"pattern": "Thank you for ___ me.", "example": "Thank you for telling me.", "glossYue": "多謝你⋯⋯我知。", "answer": "telling", "choices": ["telling", "paying", "wrapping"]},
            ],
            "shadow": {"lineId": "r3-l2", "hint": "I am allergic to peanuts."},
            "build": [
                {"type": "choice", "promptYue": "Ana 問呢道菜含唔含花生。你點講？", "choices": ["I am allergic to peanuts.", "I'd like the chicken, please.", "Here is my passport."], "answer": 0, "explain": "先講過敏，再講唔食得咩。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["I", "am", "allergic", "to", "peanuts"], "answer": ["I", "am", "allergic", "to", "peanuts"]},
            ],
            "roleplay": {
                "you": "tom",
                "intro": "你係客人。Ana 等你叫嘢。有過敏就先講，等佢問完先答。",
                "turns": [
                    _turn("Ana", "ana", r3x[0], "I'd like the chicken, please.", ["chicken"], r3[0]),
                    _turn("Ana", "ana", r3x[2], "I am allergic to peanuts.", ["allergic"], r3[1]),
                    _turn("Ana", "ana", r3x[1], "Could I have the sauce on the side?", ["side"], r3[3]),
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "shellfish-noun", "choices": ["shellfish", "spicy", "sauce"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "allergic-adj", "choices": ["allergic", "allergy", "instead"], "answer": 0},
                {"type": "meaning", "prompt": "gluten", "choices": ["麩質", "貝類", "辣"], "answer": 0},
                {"type": "meaning", "prompt": "on the side", "choices": ["另上", "唔要", "含有"], "answer": 0},
                {"type": "choice", "prompt": "邊個有 /l/？", "choices": ["shellfish", "spicy", "sauce"], "answer": 0, "explain": "shellfish 有 /l/。allergic 重音喺中間。"},
            ],
            "sound": {
                "ipa": "/l/",
                "title": "貝類入面嗰個音",
                "note": "shellfish 有 /l/。舌尖抵住上顎後面。allergic 重音喺中間。without 中間係清 /θ/。on the side 入面 on 讀 /ɔn/。",
                "pairs": [
                    {"a": "shellfish-noun", "b": "spicy-adj"},
                    {"a": "allergic-adj", "b": "sauce-noun"},
                ],
                "drill": ["allergic-adj", "shellfish-noun", "peanut-noun", "without-prep", "gluten-noun"],
            },
            "next": None,
        },
        {
            "id": "T3",
            "unit": "T",
            "titleYue": "酒店入住",
            "titleEn": "Hotel check-in",
            "canDoYue": "你能夠入住、問密碼同早餐。",
            "canDoEn": "Check in with a reservation, ask for the wifi password, and confirm breakfast.",
            "minutes": 12,
            "hero": "assets/art/lessons/t3.webp",
            "cast": ["kai", "tom"],
            "cefr": "A2",
            "lemmas": ["reservation-noun", "passport-noun", "luggage-noun", "include-verb", *T3_IDS],
            "dialogue": t3,
            "understand": [
                {"prompt": "I have a reservation under Tom. 係講？", "choices": ["用 Tom 個名訂咗房", "我想叫雞", "我想免稅"], "answer": 0, "explain": "under 後面係落訂個名。"},
                {"prompt": "Your room is a double with a view. 間房？", "choices": ["一張大床，有景觀", "兩張床，冇窗", "只係升降機"], "answer": 0, "explain": "double 係一張大床。兩張床先至係 twin。"},
                {"prompt": "Here is your key card. 你收到？", "choices": ["鑰匙卡", "收據", "登機證"], "answer": 0, "explain": "鑰匙卡開房。密碼通常寫喺卡上面。"},
            ],
            "chunks": [
                {"pattern": "I have a reservation under ___.", "example": "I have a reservation under Tom.", "glossYue": "我用⋯⋯個名訂咗房。", "answer": "Tom", "choices": ["Tom", "chicken", "cash"]},
                {"pattern": "Your room is a ___.", "example": "Your room is a double.", "glossYue": "你間房係⋯⋯。", "answer": "double", "choices": ["double", "receipt", "sauce"]},
                {"pattern": "Could you tell me the wifi ___?", "example": "Could you tell me the wifi password?", "glossYue": "可唔可以話我知無線網絡⋯⋯？", "answer": "password", "choices": ["password", "passport", "peanut"]},
                {"pattern": "Here is your ___.", "example": "Here is your key card.", "glossYue": "呢張係你把⋯⋯。", "answer": "key card", "choices": ["key card", "gift box", "refund form"]},
            ],
            "shadow": {"lineId": "t3-l2", "hint": "I have a reservation under Tom."},
            "build": [
                {"type": "choice", "promptYue": "Kai 問你有冇訂房。你用 Tom 個名。", "choices": ["I have a reservation under Tom.", "I am allergic to peanuts.", "Would you like to pay by card?"], "answer": 0, "explain": "先講有訂，再講個名。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Could", "you", "tell", "me", "the", "password"], "answer": ["Could", "you", "tell", "me", "the", "password"]},
            ],
            "roleplay": {
                "you": "tom",
                "intro": "你係住客。Kai 喺酒店櫃檯。等佢問完先答。",
                "turns": [
                    _turn("Kai", "kai", t3[0], "I have a reservation under Tom.", ["reservation"], t3[1]),
                    _turn("Kai", "kai", t3[2], "Could you tell me the wifi password?", ["wifi", "password"], t3[3]),
                    _turn("Kai", "kai", t3x[0], "Could I have a late checkout?", ["late", "checkout"], t3x[1]),
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "floor-noun", "choices": ["floor", "view", "room"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "wifi-noun", "choices": ["wifi", "password", "breakfast"], "answer": 0},
                {"type": "meaning", "prompt": "elevator", "choices": ["升降機", "樓層", "早餐"], "answer": 0},
                {"type": "meaning", "prompt": "twin", "choices": ["雙床", "雙人床", "景觀"], "answer": 0},
                {"type": "choice", "prompt": "邊個有 /l/？", "choices": ["floor", "view", "room"], "answer": 0, "explain": "floor 有 /l/。wifi 讀 /waɪ faɪ/。"},
            ],
            "sound": {
                "ipa": "/l/",
                "title": "樓層開頭嗰個音",
                "note": "floor 同 late 都有 /l/。舌尖抵住上顎後面。elevator 重音喺第一節。wifi 讀 /waɪ faɪ/，唔好讀成 wee-fee。password 第二節係 /ɝ/。",
                "pairs": [
                    {"a": "floor-noun", "b": "view-noun"},
                    {"a": "elevator-noun", "b": "room-noun"},
                ],
                "drill": ["floor-noun", "elevator-noun", "wifi-noun", "password-noun", "breakfast-noun"],
            },
            "next": "R1",
        },
    ]
    extras = [*j7x, *r3x, *t3x]
    return lessons, extras


FLAG_ITEMS = [
    {
        "id": "refund-form-phrase",
        "lemma": "refund",
        "pos": "phrase",
        "cmudict": ["R IH0 F AH1 N D verb", "R IY1 F AH2 N D noun"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists the verb stress first and the noun stress second.",
        "resolution": "Teach the noun /ˈɹi.ˌfʌnd/ inside refund form. The clip is forced to that stress.",
        "resolved": True,
        "taughtIpa": "/ˈɹi.ˌfʌnd ˈfɔɹm/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "receipt-noun",
        "lemma": "receipt",
        "pos": "noun",
        "cmudict": ["R IH0 S IY1 T", "R IY0 S IY1 T"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has /ɪ/ and /i/ in the first syllable.",
        "resolution": "Teach the first form /ɹɪ.ˈsit/. The clip is forced so the stress stays on the second syllable.",
        "resolved": True,
        "taughtIpa": "/ɹɪ.ˈsit/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "wifi-noun",
        "lemma": "wifi",
        "pos": "noun",
        "cmudict": ["W AY1 F AY2", "W IY1 F IY2"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists /ˈwaɪ.faɪ/ and a wee-fee reading.",
        "resolution": "Teach /ˈwaɪ.ˌfaɪ/. The clip is forced so it does not become wee-fee.",
        "resolved": True,
        "taughtIpa": "/ˈwaɪ.ˌfaɪ/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "without-prep",
        "lemma": "without",
        "pos": "prep",
        "cmudict": ["W IH0 TH AW1 T", "W IH0 DH AW1 T"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has voiceless /θ/ and voiced /ð/.",
        "resolution": "Teach voiceless /wɪθ.ˈaʊt/, the first CMU form. The clip is forced.",
        "resolved": True,
        "taughtIpa": "/wɪθ.ˈaʊt/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "on-the-side-phrase",
        "lemma": "on",
        "pos": "phrase",
        "cmudict": ["AA1 N", "AO1 N"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists /ɑn/ first and /ɔn/ second.",
        "resolution": "Teach /ɔn/ in on the side, matching try on from round 19. The clip is forced.",
        "resolved": True,
        "taughtIpa": "/ˈɔn ðə ˈsaɪd/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "allergic-adj",
        "lemma": "allergic",
        "pos": "adj",
        "cmudict": ["AH0 L ER1 JH IH0 K"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "The learner IPA keeps CMU ɝ. This Piper voice has no ɝ and drops the vowel if it is forced.",
        "resolution": "The card stays /ə.ˈlɝ.dʒɪk/. The clip forces ɜ so the vowel is audible.",
        "resolved": True,
        "taughtIpa": "/ə.ˈlɝ.dʒɪk/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "password-noun",
        "lemma": "password",
        "pos": "noun",
        "cmudict": ["P AE1 S W ER2 D"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "The learner IPA keeps CMU ɝ. This Piper voice has no ɝ and drops the vowel if it is forced.",
        "resolution": "The card stays /ˈpæs.ˌwɝd/. The clip forces ɜ so the vowel is audible.",
        "resolved": True,
        "taughtIpa": "/ˈpæs.ˌwɝd/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "peanut-noun",
        "lemma": "peanut",
        "pos": "noun",
        "cmudict": ["P IY1 N AH0 T", "P IY1 N AH2 T"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has a reduced second vowel and a secondary-stress form.",
        "resolution": "Teach the first form /ˈpi.nət/. The clip is forced so the second vowel stays reduced.",
        "resolved": True,
        "taughtIpa": "/ˈpi.nət/",
        "resolvedBy": "round-20",
        "resolvedAt": "2026-10-30",
    },
]


# One learner order. CEFR never drops, including soon teasers.
# Shorter A2 lessons stay before the lengthened J4–J6 block so the path
# does not get easier in the middle of a band.
PATH_BANDS = [
    ("A1", "打好基礎", "氣息、打招呼、數字、禮貌、櫃檯同入座。", ["F1", "F2", "F3", "F4", "J1", "R1"]),
    ("A1A2", "起步", "想買咩，同埋機場櫃檯。", ["J2", "T1"]),
    ("A2", "上路", "件件嘅名、安檢、落單，然後材料、試戴、酒店、過敏。", ["J3", "T2", "R2", "J4", "J5", "T3", "R3", "T4", "R4"]),
    ("A2B1", "再深一點", "價錢同付款。問路同埋單仲未開。", ["J6", "J7", "T5", "R5"]),
    ("B1", "應用", "售後、投訴、加購、酒店問題、電話訂位。", ["J8", "J9", "J10", "T6", "R6"]),
]
SHIPPED_ORDER = ["F1", "F2", "F3", "F4", "J1", "R1", "J2", "T1", "J3", "T2", "R2", "J4", "J5", "T3", "R3", "J6", "J7"]
CEFR_RANK = {"A1": 1, "A1/A2": 2, "A2": 3, "A2/B1": 4, "B1": 5, "B1/B2": 6, "B2": 7}


def _line(lid, speaker, label, text, gloss, say=None):
    return {
        "id": lid,
        "speaker": speaker,
        "speakerLabel": label,
        "text": text,
        "glossYue": gloss,
        "audio": f"assets/audio/lines/{lid}.mp3",
        "audioSlow": f"assets/audio/lines/{lid}-slow.mp3",
        "say": say or text,
    }


def polish_dialogues(lessons):
    """Lengthen J4–J6 and keep J7/R3/T3 ahead of the lesson before them.

    Gloss stays on the new grammar and one or two key lines. Reused line ids
    keep the say text that was already rendered.
    """
    additions = {
        "J4": [
            _line("j4-l7", "mei", "Mei", "The gold is heavier than the silver.", "金重過銀。"),
            _line("j4-l8", "tom", "Tom", "The diamond is shinier than the jade.", "鑽石亮過玉。"),
        ],
        "J5": [
            _line("j5-l6", "tom", "Tom", "It feels a little loose.", ""),
            _line("j5-l7", "mei", "Mei", "How does it feel?", "戴落感覺點？"),
        ],
        "J6": [
            _line("j6-l6", "mei", "Mei", "This one is more expensive.", ""),
            _line("j6-l7", "mei", "Mei", "If you take both, the total is lower.", "兩件一齊要，總數會平啲。"),
            _line("j6-l8", "tom", "Tom", "That price is worth it.", ""),
            _line("j6-m1", "mei", "Mei", "The total is a good deal.", ""),
        ],
        "T3": [
            _line("t3-m1", "kai", "Kai", "Breakfast is included.", ""),
            _line("t3-m2", "tom", "Tom", "Could I have a late checkout?", ""),
            _line("t3-m3", "kai", "Kai", "The elevator is on the left.", ""),
        ],
        "R3": [
            _line("r3-a1", "ana", "Ana", "What would you like to order?", ""),
            _line("r3-a2", "ana", "Ana", "The sauce is spicy.", ""),
            _line("r3-m1", "ana", "Ana", "Does this dish contain peanuts?", ""),
            _line("r3-m2", "tom", "Tom", "Could I have it without nuts?", "", "Could I have it [[wɪθˈaʊt]] nuts?"),
        ],
        "J7": [
            _line("j7-l6", "tom", "Tom", "Could I pay with cash?", ""),
            _line("j7-l7", "tom", "Tom", "Could you wrap this?", ""),
            _line("j7-m1", "mei", "Mei", "Would you like to pay by card?", ""),
            _line("j7-m2", "mei", "Mei", "Here is your receipt.", "", "Here is your [[ɹɪsˈit]]."),
            _line("j7-m3", "mei", "Mei", "Please sign the refund form.", "", "Please sign the [[ɹˈifˌʌnd]] form."),
        ],
    }
    keep_gloss = {
        "J4": {"j4-l1", "j4-l7", "j4-l8"},
        "J5": {"j5-l1", "j5-l7"},
        "J6": {"j6-l7"},
        "T3": {"t3-l2", "t3-l4"},
        "R3": {"r3-l2"},
        "J7": {"j7-l3"},
    }
    by_lesson = {lesson["id"]: lesson for lesson in lessons}
    for lid, rows in additions.items():
        dialogue = by_lesson[lid]["dialogue"]
        have = {row["id"] for row in dialogue}
        for row in rows:
            if row["id"] not in have:
                dialogue.append(row)
                have.add(row["id"])
        keep = keep_gloss[lid]
        for row in dialogue:
            if row["id"] not in keep:
                row["glossYue"] = ""


def reorder_path(path):
    found = {}
    for unit in path["units"]:
        for entry in unit["lessons"]:
            found[entry["id"]] = entry
    units = []
    seen = []
    for uid, title, blurb, ids in PATH_BANDS:
        lessons = []
        for lid in ids:
            if lid not in found:
                raise SystemExit(f"path missing {lid}")
            lessons.append(found[lid])
            seen.append(lid)
        units.append({"id": uid, "title": title, "blurb": blurb, "lessons": lessons})
    extra = [lid for lid in found if lid not in seen]
    if extra:
        raise SystemExit(f"path lessons not placed: {extra}")
    flat = [entry for unit in units for entry in unit["lessons"]]
    for prev, entry in zip(flat, flat[1:]):
        if CEFR_RANK[entry["cefr"]] < CEFR_RANK[prev["cefr"]]:
            raise SystemExit(f"cefr dip {prev['id']} {prev['cefr']} -> {entry['id']} {entry['cefr']}")
    path["units"] = units


def chain_next(lessons):
    by_lesson = {lesson["id"]: lesson for lesson in lessons}
    for index, lid in enumerate(SHIPPED_ORDER):
        nxt = SHIPPED_ORDER[index + 1] if index + 1 < len(SHIPPED_ORDER) else None
        by_lesson[lid]["next"] = nxt


def apply_round20(items, lessons, path, flags, decks):
    by_id = {item["id"]: item for item in items}
    missing = [lid for lid in NEW if lid not in by_id]
    if missing:
        raise SystemExit(f"round 20 missing {missing}")
    for lid, meta in META.items():
        item = by_id[lid]
        ex2_en, ex2_yue, ex2_say = meta["ex2"]
        item["register"] = meta["register"]
        item["usageNotes"] = meta["usage"]
        item["pitfallsYue"] = meta["pitfall"]
        item["related"] = meta["related"]
        if meta.get("mini"):
            item["miniDialogue"] = [{"en": en, "yue": yue} for en, yue in meta["mini"]]
        item["examples"] = [
            {
                "en": item["example"],
                "yue": item["exampleYue"],
                "audio": item["audio"],
                "audioSlow": item["audioSlow"],
                "say": item["say"],
            },
            {
                "en": ex2_en,
                "yue": ex2_yue,
                "audio": f"assets/audio/words/{lid}-ex2.mp3",
                "audioSlow": f"assets/audio/words/{lid}-ex2-slow.mp3",
                "say": ex2_say or ex2_en,
            },
        ]
        if lid in NEW:
            item["sources"] = ["CMUdict 0.7b"]
            item["verified_at"] = "2026-10-30"
    by_lesson = {lesson["id"]: lesson for lesson in lessons}
    by_lesson["J7"]["cefr"] = "A2/B1"
    for unit in path["units"]:
        for entry in unit["lessons"]:
            if entry["id"] in {"J7", "T3", "R3"}:
                entry.pop("soon", None)
                entry.pop("title", None)
            if entry["id"] == "J7":
                entry["cefr"] = "A2/B1"
            if entry["id"] == "J8":
                entry["cefr"] = "B1"
        if unit["id"] == "J":
            unit["lessons"].append({"id": "J10", "title": "加購同禮盒", "soon": True, "cefr": "B1"})
        elif unit["id"] == "T":
            unit["lessons"].append({"id": "T6", "title": "酒店問題", "soon": True, "cefr": "B1"})
        elif unit["id"] == "R":
            unit["lessons"].append({"id": "R6", "title": "電話訂位", "soon": True, "cefr": "B1"})
    flags.extend(FLAG_ITEMS)
    jewellery = next(deck for deck in decks["decks"] if deck["id"] == "jewellery")
    jewellery["lemmas"] = list(dict.fromkeys([*jewellery["lemmas"], *J7_IDS]))
    decks["decks"].append({"id": "restaurant", "titleYue": "餐廳", "level": "A2", "lemmas": R3_IDS})
    decks["decks"].append({"id": "travel", "titleYue": "酒店入住", "level": "A2", "lemmas": T3_IDS})
    polish_dialogues(lessons)
    reorder_path(path)
    chain_next(lessons)
    return decks

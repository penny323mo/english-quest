"""Round 19: J4–J6 lexicon, lessons, CEFR, and the jewellery review deck.

Imported by emit_content.py. Does not render audio and does not fetch Wiktionary.
"""
from __future__ import annotations


CEFR = {
    "F1": "A1",
    "F2": "A1",
    "F3": "A1",
    "F4": "A1",
    "J1": "A1",
    "J2": "A1/A2",
    "J3": "A2",
    "J4": "A2",
    "J5": "A2",
    "J6": "A2/B1",
    "J7": "A2",
    "J8": "A2",
    "J9": "B1",
    "T1": "A1/A2",
    "T2": "A2",
    "T3": "A2",
    "T4": "A2",
    "T5": "A2/B1",
    "R1": "A1",
    "R2": "A2",
    "R3": "A2",
    "R4": "A2",
    "R5": "A2/B1",
}

# Content words only. resize is not in CMUdict, so it is not invented here.
DECK = [
    "jewellery-noun",
    "necklace-noun",
    "ring-noun",
    "bracelet-noun",
    "earring-noun",
    "pearl-noun",
    "silver-noun",
    "watch-noun",
    "just-looking-phrase",
    "gold-noun",
    "white-gold-phrase",
    "rose-gold-phrase",
    "platinum-noun",
    "diamond-noun",
    "jade-noun",
    "gemstone-noun",
    "karat-noun",
    "pure-adj",
    "authentic-adj",
    "certified-adj",
    "natural-adj",
    "treated-adj",
    "sparkle-verb",
    "setting-noun",
    "size-noun",
    "measure-verb",
    "try-on-phrase",
    "fit-verb",
    "tight-adj",
    "loose-adj",
    "finger-noun",
    "wrist-noun",
    "adjust-verb",
    "mirror-noun",
    "perfect-adj",
    "almost-adv",
    "comfortable-adj",
    "price-noun",
    "cost-noun",
    "discount-noun",
    "percent-noun",
    "off-adv",
    "special-adj",
    "offer-noun",
    "include-verb",
    "tax-noun",
    "total-noun",
    "budget-noun",
    "expensive-adj",
    "reasonable-adj",
    "worth-adj",
    "deal-noun",
    "sale-noun",
]

NEW = {
    "gold-noun",
    "white-gold-phrase",
    "rose-gold-phrase",
    "platinum-noun",
    "diamond-noun",
    "jade-noun",
    "gemstone-noun",
    "karat-noun",
    "pure-adj",
    "authentic-adj",
    "certified-adj",
    "natural-adj",
    "treated-adj",
    "sparkle-verb",
    "setting-noun",
    "size-noun",
    "measure-verb",
    "try-on-phrase",
    "fit-verb",
    "tight-adj",
    "loose-adj",
    "finger-noun",
    "wrist-noun",
    "adjust-verb",
    "mirror-noun",
    "perfect-adj",
    "almost-adv",
    "comfortable-adj",
    "cost-noun",
    "discount-noun",
    "percent-noun",
    "off-adv",
    "special-adj",
    "offer-noun",
    "include-verb",
    "tax-noun",
    "total-noun",
    "budget-noun",
    "expensive-adj",
    "reasonable-adj",
    "worth-adj",
    "deal-noun",
    "sale-noun",
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
    "jewellery-noun": _meta(
        "櫃檯", "店面常見串法係 jewellery。句式：a jewellery store。",
        "唔好讀出中間嘅 ə。兩種串法讀音一樣。",
        ["necklace-noun", "ring-noun"],
        "This jewellery is for a gift.", "呢份珠寶係送禮。",
        "This [[dʒˈulɹi]] is for a gift.",
    ),
    "necklace-noun": _meta(
        "櫃檯", "一件頸鏈用 this necklace。",
        "頸鏈係戴喺頸。手鏈先至係 bracelet。",
        ["gold-noun", "bracelet-noun"],
        "This necklace is real gold.", "呢條頸鏈係真金。",
    ),
    "ring-noun": _meta(
        "櫃檯", "a silver ring、the right size。",
        "尾音係 /ŋ/，唔好收成 /n/。",
        ["size-noun", "finger-noun"],
        "This ring is the right size.", "呢隻戒指碼數啱。",
    ),
    "bracelet-noun": _meta(
        "櫃檯", "this bracelet、a silver bracelet。",
        "重音喺第一節。尾音 /t/ 要收住。",
        ["wrist-noun", "silver-noun"],
        "I like this silver bracelet.", "我鍾意呢條銀手鏈。",
        "I like this silver [[bɹˈeɪslət]].",
    ),
    "earring-noun": _meta(
        "櫃檯", "a pair of earrings。多過一件用 these。",
        "通常一對。唔好講成一隻就完。",
        ["pearl-noun", "sale-noun"],
        "These earrings are on sale.", "呢對耳環而家特價。",
    ),
    "pearl-noun": _meta(
        "櫃檯", "a pearl earring。",
        "pearl 係珍珠。pair 先至係一對。",
        ["natural-adj", "earring-noun"],
        "This pearl is natural.", "呢顆珍珠係天然。",
        "This pearl is [[nˈætʃɚəl]].",
    ),
    "silver-noun": _meta(
        "櫃檯", "a silver ring。中間有 /v/。",
        "白金唔係銀。銀先至係 silver。",
        ["white-gold-phrase", "ring-noun"],
        "Is this silver or white gold?", "呢件係銀定係白金？",
    ),
    "watch-noun": _meta(
        "櫃檯", "a watch。開頭 /w/，尾音 /tʃ/。",
        "唔好同 what 撈亂。",
        ["wrist-noun", "deal-noun"],
        "This watch is a good deal.", "呢隻手錶好抵買。",
    ),
    "just-looking-phrase": _meta(
        "客氣", "客人未想買：I'm just looking。",
        "我睇吓先。直譯成只係睇吓唔自然。",
        ["gold-noun", "ring-noun"],
        "I'm just looking at the gold.", "我睇吓呢件金飾先。",
    ),
    "gold-noun": _meta(
        "櫃檯", "This is gold. / It is made of gold.",
        "金。白金同玫瑰金都要講清楚，唔好統稱金。",
        ["authentic-adj", "silver-noun", "karat-noun"],
        "Is this gold pure?", "呢件金係咪純？",
        mini=[("Is this real gold?", "呢件係咪真金？"), ("This gold is authentic.", "呢件金係正貨。")],
    ),
    "white-gold-phrase": _meta(
        "櫃檯", "white gold 係白金，唔係鉑金。",
        "白金唔等於 platinum。客人問白金，唔好攞鉑金出嚟。",
        ["platinum-noun", "gold-noun"],
        "White gold is not platinum.", "白金唔等於鉑金。",
        "White gold is not [[plˈætənəm]].",
    ),
    "rose-gold-phrase": _meta(
        "櫃檯", "rose gold 係玫瑰金。",
        "rose 呢度係色，唔係花。",
        ["gold-noun", "white-gold-phrase"],
        "Rose gold looks warm.", "玫瑰金睇落暖色。",
    ),
    "platinum-noun": _meta(
        "櫃檯", "This band is platinum. 三個音節。",
        "中間係 ə，唔好讀成兩節。白金唔係鉑金。",
        ["white-gold-phrase", "expensive-adj"],
        "Platinum costs more than silver.", "鉑金貴過銀。",
        "[[plˈætənəm]] costs more than silver.",
    ),
    "diamond-noun": _meta(
        "櫃檯", "Is the diamond natural?",
        "兩個音節 /ˈdaɪ.mənd/。唔好加多一個 ə。",
        ["natural-adj", "setting-noun"],
        "This diamond has a sparkle.", "呢粒鑽石有閃光。",
        "This [[dˈaɪmənd]] has a sparkle.",
    ),
    "jade-noun": _meta(
        "櫃檯", "This jade is natural. 玉係材料。",
        "玉係材料同工藝，唔好講醫療功效。",
        ["natural-adj", "gemstone-noun"],
        "Jade is a gemstone.", "玉係一種寶石。",
        mini=[("I like this jade.", "我鍾意呢塊玉。"), ("This jade is natural.", "呢塊玉係天然。")],
    ),
    "gemstone-noun": _meta(
        "櫃檯", "Jade is a gemstone.",
        "寶石可以係玉、鑽石或者其他石。",
        ["jade-noun", "diamond-noun"],
        "A gemstone can sparkle.", "寶石可以有閃光。",
    ),
    "karat-noun": _meta(
        "櫃檯", "eighteen karat gold。開數，唔係重量嘅 carat 用法。",
        "讀 /ˈkɛɹ.ət/。唔好讀成 /æ/。",
        ["gold-noun", "pure-adj"],
        "Eighteen karat is not pure.", "十八開唔係純金。",
    ),
    "pure-adj": _meta(
        "櫃檯", "pure gold。純，冇夾其他金屬。",
        "純金好軟。二十四開先至接近純。",
        ["gold-noun", "karat-noun"],
        "Pure gold is soft.", "純金好軟。",
    ),
    "authentic-adj": _meta(
        "櫃檯", "Is this authentic? 中間 /θ/。",
        "開頭係 ə，唔好讀成 ɔ。/θ/ 唔好變 /s/ 或者 /t/。",
        ["certified-adj", "gold-noun"],
        "Authentic jade has a certificate.", "正貨玉有證書。",
        "[[əθˈɛntɪk]] jade has a certificate.",
    ),
    "certified-adj": _meta(
        "櫃檯", "It is certified. 有證書。",
        "重音喺第一節。證書唔等於口講正貨。",
        ["authentic-adj", "natural-adj"],
        "This stone is certified.", "呢件石有證書。",
        "This stone is [[sˈɜtəfˌaɪd]].",
    ),
    "natural-adj": _meta(
        "櫃檯", "natural pearl、natural jade。三個音節。",
        "天然唔等於處理過。唔好食咗中間個音。",
        ["treated-adj", "pearl-noun"],
        "Natural jade is not treated.", "天然玉冇處理過。",
        "[[nˈætʃɚəl]] jade is not treated.",
    ),
    "treated-adj": _meta(
        "櫃檯", "This jade is treated. 處理過。",
        "處理過要講明。唔好當佢天然。",
        ["natural-adj", "jade-noun"],
        "Treated stones look brighter.", "處理過嘅石睇落光啲。",
        "[[tɹˈitɪd]] stones look brighter.",
    ),
    "sparkle-verb": _meta(
        "櫃檯", "Diamonds sparkle.",
        "閃光係睇落，唔好講成燈。",
        ["diamond-noun", "gemstone-noun"],
        "I like the sparkle of this ring.", "我鍾意呢隻戒指嘅閃光。",
    ),
    "setting-noun": _meta(
        "櫃檯", "The setting holds the stone. 鑲托。",
        "setting 呢度係托住寶石嗰件，唔係場景。",
        ["diamond-noun", "karat-noun"],
        "The diamond setting is tight.", "粒鑽石個鑲托好穩。",
        "The [[dˈaɪmənd]] setting is tight.",
    ),
    "size-noun": _meta(
        "櫃檯", "What size is this ring?",
        "碼係尺寸。唔好同 prize 撈。",
        ["fit-verb", "tight-adj"],
        "What size is this ring?", "呢隻戒指幾多碼？",
        mini=[("What size is this?", "呢件幾多碼？"), ("This size is a little tight.", "呢個碼有啲緊。")],
    ),
    "measure-verb": _meta(
        "櫃檯", "Can you measure my finger?",
        "量手指或者手腕。measure 係動作。",
        ["finger-noun", "wrist-noun"],
        "Please measure my wrist.", "唔該量吓我隻手腕。",
    ),
    "try-on-phrase": _meta(
        "客氣", "Would you like to try this ring on?",
        "try on 係試戴。on 呢句讀 /ɔn/。",
        ["ring-noun", "mirror-noun"],
        "I want to try the bracelet on.", "我想試吓呢條手鏈。",
        "I want to try the [[bɹˈeɪslət]] on.",
    ),
    "fit-verb": _meta(
        "櫃檯", "This ring does not fit. How does it feel?",
        "fit 係啱唔啱。tight 先至係太緊。",
        ["tight-adj", "loose-adj"],
        "The bracelet fits my wrist.", "條手鏈啱我手腕。",
        "The [[bɹˈeɪslət]] fits my wrist.",
    ),
    "tight-adj": _meta(
        "櫃檯", "a little tight。太緊。",
        "太緊先講 tight。啱碼就係 fit。",
        ["fit-verb", "adjust-verb"],
        "The ring feels tight.", "隻戒指戴住有啲緊。",
    ),
    "loose-adj": _meta(
        "櫃檯", "a little loose。開頭 /l/。",
        "loose 係鬆，尾音 /s/。lose 先至係失去。",
        ["fit-verb", "wrist-noun"],
        "A loose fit is not perfect.", "太鬆就唔算啱碼。",
        "A loose fit is not [[pˈɜfˌɪkt]].",
    ),
    "finger-noun": _meta(
        "櫃檯", "measure my finger。戒指戴喺手指。",
        "finger 有 /ŋ/。唔好讀成 fin-ner。",
        ["ring-noun", "measure-verb"],
        "This ring is for the finger.", "呢隻戒指係戴手指嘅。",
    ),
    "wrist-noun": _meta(
        "櫃檯", "on the wrist。手鏈戴喺手腕。",
        "開頭 /ɹ/。唔好讀成 list。",
        ["bracelet-noun", "measure-verb"],
        "The bracelet sits on the wrist.", "條手鏈戴喺手腕。",
        "The [[bɹˈeɪslət]] sits on the wrist.",
    ),
    "adjust-verb": _meta(
        "櫃檯", "I can adjust the size. 改碼。",
        "resize 呢輪唔教。改碼用 adjust。",
        ["size-noun", "tight-adj"],
        "We can adjust a tight ring.", "太緊嘅戒指可以改。",
    ),
    "mirror-noun": _meta(
        "櫃檯", "Look in the mirror.",
        "鏡。試完畀客人自己睇。",
        ["try-on-phrase", "fit-verb"],
        "The mirror shows the fit.", "照鏡就見到啱唔啱。",
    ),
    "perfect-adj": _meta(
        "櫃檯", "The fit is perfect. 形容詞重音喺第一節。",
        "唔好讀成動詞嗰個重音。",
        ["almost-adv", "fit-verb"],
        "The size is almost perfect.", "個碼差唔多啱晒。",
        "The size is almost [[pˈɜfˌɪkt]].",
    ),
    "almost-adv": _meta(
        "櫃檯", "almost right、almost perfect。差唔多。",
        "almost 唔等於完全啱。",
        ["perfect-adj", "size-noun"],
        "The size is almost perfect.", "個碼差唔多啱晒。",
        "The size is almost [[pˈɜfˌɪkt]].",
    ),
    "comfortable-adj": _meta(
        "櫃檯", "It feels comfortable. 四個音節。",
        "唔好吞中間嘅音。舒服先講，唔係完美。",
        ["fit-verb", "loose-adj"],
        "The bracelet feels comfortable.", "條手鏈戴得好舒服。",
        "The [[bɹˈeɪslət]] feels comfortable.",
    ),
    "price-noun": _meta(
        "櫃檯", "The price is ten dollars. How much is the price?",
        "價錢。問法可以用 How much does it cost?",
        ["cost-noun", "discount-noun"],
        "The price includes tax.", "價錢已經包稅。",
    ),
    "cost-noun": _meta(
        "櫃檯", "How much does this cost? 讀 /kɑst/。",
        "唔好讀成 /kɔst/。cost 同 price 都係問價錢。",
        ["price-noun", "total-noun"],
        "The cost includes tax.", "個價錢包稅。",
        "The [[kˈɑst]] includes tax.",
        mini=[("How much does this cost?", "呢件幾多錢？"), ("This piece is on sale today.", "呢件今日特價。")],
    ),
    "discount-noun": _meta(
        "櫃檯", "Is there a discount? 名詞重音喺第一節。",
        "唔好將重音放到第二節。折扣先至係減價。",
        ["percent-noun", "sale-noun"],
        "Is there a discount today?", "今日有冇折扣？",
    ),
    "percent-noun": _meta(
        "櫃檯", "ten percent off。重音喺第二節。",
        "十個 percent 先係一成。唔好話成十折。",
        ["off-adv", "discount-noun"],
        "Ten percent off the price.", "價錢減百分之十。",
    ),
    "off-adv": _meta(
        "櫃檯", "ten percent off。減。",
        "off 呢度係減，唔係關門。",
        ["percent-noun", "sale-noun"],
        "This piece is ten percent off.", "呢件減一成。",
    ),
    "special-adj": _meta(
        "櫃檯", "a special offer。特別優惠。",
        "special 唔等於特價本身。特價係 sale。",
        ["offer-noun", "sale-noun"],
        "Today there is a special price.", "今日有特別價錢。",
    ),
    "offer-noun": _meta(
        "櫃檯", "a special offer。",
        "尾音係 /ɚ/，唔好加多一個 /ɹ/。",
        ["special-adj", "include-verb"],
        "I like this offer.", "我鍾意呢個優惠。",
        "I like this [[ˈɔfɚ]].",
    ),
    "include-verb": _meta(
        "櫃檯", "The price includes tax. Does the total include tax?",
        "include 係包喺入面。唔好講成另外加。",
        ["tax-noun", "total-noun"],
        "The price includes tax.", "價錢已經包稅。",
    ),
    "tax-noun": _meta(
        "櫃檯", "Tax is included.",
        "稅可以包咗，或者另外計。要講明。",
        ["include-verb", "total-noun"],
        "The total includes tax.", "總數包咗稅。",
    ),
    "total-noun": _meta(
        "櫃檯", "The total is a good deal. It comes to…",
        "總數係加埋之後。唔好只報未扣嘅價錢。",
        ["tax-noun", "deal-noun"],
        "The total includes tax.", "總數包咗稅。",
    ),
    "budget-noun": _meta(
        "櫃檯", "within my budget。預算。",
        "預算係客人自己嘅上限。唔好笑佢。",
        ["price-noun", "reasonable-adj"],
        "This price fits my budget.", "呢個價錢啱我預算。",
    ),
    "expensive-adj": _meta(
        "櫃檯", "This ring is expensive. 貴。",
        "開頭係 /ɪk/。可以再講折扣，唔好只話貴。",
        ["reasonable-adj", "platinum-noun"],
        "Platinum is more expensive.", "鉑金更貴。",
        "[[plˈætənəm]] is more [[ɪkspˈɛnsɪv]].",
    ),
    "reasonable-adj": _meta(
        "櫃檯", "The price is reasonable. 四個音節。",
        "合理唔等於平。有折扣可以再合理啲。",
        ["price-noun", "discount-noun"],
        "A discount makes it reasonable.", "有折扣就合理啲。",
    ),
    "worth-adj": _meta(
        "櫃檯", "It is worth it. 值得。",
        "worth 中間有 /θ/。值得先係買得過。",
        ["deal-noun", "jade-noun"],
        "The deal is worth it.", "呢單好值得。",
    ),
    "deal-noun": _meta(
        "櫃檯", "a good deal。抵買。",
        "deal 呢度係抵買，唔係交易文件。",
        ["sale-noun", "total-noun"],
        "This sale is a good deal.", "呢個特價好抵買。",
    ),
    "sale-noun": _meta(
        "櫃檯", "on sale。尾音 /l/。",
        "sale 係特價。sell 先至係賣。",
        ["discount-noun", "price-noun"],
        "The earrings are on sale.", "對耳環而家特價。",
    ),
}


def add_items(add) -> None:
    add(
        "gold-noun", "gold", "noun", "yellow-metal", "G OW1 L D", ["gold"],
        "金", "金", "gam1", ["real gold", "made of gold"],
        "This gold is authentic.", "呢件金係正貨。",
        piper="This gold is [[əθˈɛntɪk]].",
        note="金。白金同玫瑰金要另外講。",
    )
    add(
        "white-gold-phrase", "white gold", "phrase", "pale-alloy", "W AY1 T | G OW1 L D", ["white", "gold"],
        "白金", "白金", "baak6 gam1", ["white gold ring"],
        "This ring is white gold.", "呢隻戒指係白金。",
        phrase=True,
        note="教 W AY1 T，唔教 HH W AY1 T。白金唔係鉑金。",
    )
    add(
        "rose-gold-phrase", "rose gold", "phrase", "pink-alloy", "R OW1 Z | G OW1 L D", ["rose", "gold"],
        "玫瑰金", "玫瑰金", "mui4 gwai3 gam1", ["rose gold band"],
        "I like this rose gold.", "我鍾意呢件玫瑰金。",
        phrase=True,
        note="rose 呢度係色水，跟 CMU R OW1 Z。",
    )
    add(
        "platinum-noun", "platinum", "noun", "dense-metal", "P L AE1 T . AH0 . N AH0 M", ["plat", "i", "num"],
        "鉑金", "铂金", "bok6 gam1", ["platinum band"],
        "This band is platinum.", "呢隻戒指圈係鉑金。",
        piper="This band is [[plˈætənəm]].",
        variants=["/ˈplæt.nəm/"],
        note="教三音節 /ˈplæt.ə.nəm/。CMU 第一條係兩音節，標做變體。",
    )
    add(
        "diamond-noun", "diamond", "noun", "clear-stone", "D AY1 . M AH0 N D", ["dia", "mond"],
        "鑽石", "钻石", "zoek3 sek6", ["a natural diamond"],
        "Is the diamond natural?", "粒鑽石係咪天然？",
        piper="Is the [[dˈaɪmənd]] [[nˈætʃɚəl]]?",
        note="兩個音節 /ˈdaɪ.mənd/。",
    )
    add(
        "jade-noun", "jade", "noun", "green-stone", "JH EY1 D", ["jade"],
        "玉", "玉", "juk6", ["natural jade"],
        "This jade is natural.", "呢塊玉係天然。",
        piper="This jade is [[nˈætʃɚəl]].",
        note="玉係材料同工藝。唔好講醫療功效。",
    )
    add(
        "gemstone-noun", "gemstone", "noun", "cut-stone", "JH EH1 M . S T OW2 N", ["gem", "stone"],
        "寶石", "宝石", "bou2 sek6", ["a gemstone"],
        "Jade is a gemstone.", "玉係一種寶石。",
    )
    add(
        "karat-noun", "karat", "noun", "fineness", "K EH1 R . AH0 T", ["kar", "at"],
        "開", "开", "hoi1", ["eighteen karat", "karat gold"],
        "This is eighteen karat gold.", "呢件係十八開金。",
        piper="This is eighteen [[kˈɛɹət]] gold.",
        note="金嘅開數。同 carat 同一個 CMU 音 /ˈkɛɹ.ət/。",
    )
    add(
        "pure-adj", "pure", "adj", "unmixed", "P Y UH1 R", ["pure"],
        "純", "纯", "seon4", ["pure gold"],
        "Is this gold pure?", "呢件金係咪純？",
    )
    add(
        "authentic-adj", "authentic", "adj", "genuine", "AH0 . TH EH1 N . T IH0 K", ["au", "then", "tic"],
        "正貨", "正品", "zing3 fo3", ["authentic gold"],
        "Is this authentic gold?", "呢件金係咪正貨？",
        piper="Is this [[əθˈɛntɪk]] gold?",
        variants=["/ɔ.ˈθɛn.tɪk/"],
        note="教 CMU 第一條 /ə.ˈθɛn.tɪk/。錄音強制 /θ/。/ɔ/ 開頭同冇 /t/ 嘅變體唔教。",
    )
    add(
        "certified-adj", "certified", "adj", "documented", "S ER1 . T AH0 . F AY2 D", ["cer", "ti", "fied"],
        "有證書", "有证书", "jau5 zing3 syu1", ["certified diamond"],
        "Yes. It is certified.", "係。有證書。",
        piper="Yes. It is [[sˈɜtəfˌaɪd]].",
        note="重音喺第一節 /ˈsɝ.tə.ˌfaɪd/。",
    )
    add(
        "natural-adj", "natural", "adj", "from-nature", "N AE1 CH . ER0 . AH0 L", ["nat", "ur", "al"],
        "天然", "天然", "tin1 jin4", ["natural jade", "natural pearl"],
        "This pearl is natural.", "呢顆珍珠係天然。",
        piper="This pearl is [[nˈætʃɚəl]].",
        variants=["/ˈnætʃ.ɹəl/"],
        note="教三音節 /ˈnætʃ.ɚ.əl/。CMU 第二條係兩音節，標做變體。",
    )
    add(
        "treated-adj", "treated", "adj", "processed", "T R IY1 T . IH0 D", ["treat", "ed"],
        "處理過", "处理过", "cyu5 lei5 gwo3", ["treated jade"],
        "This jade is treated.", "呢塊玉處理過。",
        piper="This jade is [[tɹˈitɪd]].",
        note="處理過要講明，唔好當天然。",
    )
    add(
        "sparkle-verb", "sparkle", "verb", "glitter", "S P AA1 R . K AH0 L", ["spar", "kle"],
        "閃光", "闪光", "sim2 gwong1", ["diamonds sparkle"],
        "Diamonds sparkle in the light.", "鑽石喺光下面會閃。",
    )
    add(
        "setting-noun", "setting", "noun", "mount", "S EH1 T . IH0 NG", ["set", "ting"],
        "鑲托", "镶托", "soeng3 tok3", ["diamond setting"],
        "This setting is eighteen karat gold.", "呢個鑲托係十八開金。",
        piper="This setting is eighteen [[kˈɛɹət]] gold.",
        note="呢度係托住寶石嘅鑲托。",
    )
    add(
        "size-noun", "size", "noun", "garment-measure", "S AY1 Z", ["size"],
        "碼", "码", "maa5", ["ring size", "the right size"],
        "This size is a little tight.", "呢個碼有啲緊。",
    )
    add(
        "measure-verb", "measure", "verb", "take-measure", "M EH1 . ZH ER0", ["meas", "ure"],
        "量度", "量度", "loeng4 dok6", ["measure a finger"],
        "Can you measure my finger?", "可唔可以量吓我隻手指？",
    )
    add(
        "try-on-phrase", "try on", "phrase", "wear-to-test", "T R AY1 | AO1 N", ["try", "on"],
        "試戴", "试戴", "si3 daai3", ["try this ring on"],
        "Would you like to try this ring on?", "想唔想試吓呢隻戒指？",
        phrase=True,
        variants=["/ˈtɹaɪ ˈɑn/"],
        note="on 喺呢句跟 CMU 第二條 AO1 N /ɔn/，因為未強制嘅句子係咁讀。第一條 AA1 N /ɑn/ 標做變體。",
    )
    add(
        "fit-verb", "fit", "verb", "be-suitable", "F IH1 T", ["fit"],
        "啱戴", "合适", "ngaam1 daai3", ["does not fit", "fits my wrist"],
        "This ring does not fit.", "呢隻戒指唔啱戴。",
    )
    add(
        "tight-adj", "tight", "adj", "too-small", "T AY1 T", ["tight"],
        "緊", "紧", "gan2", ["a little tight"],
        "This size is a little tight.", "呢個碼有啲緊。",
        note="太緊。fit 先至係啱唔啱。",
    )
    add(
        "loose-adj", "loose", "adj", "too-roomy", "L UW1 S", ["loose"],
        "鬆", "松", "sung1", ["a little loose"],
        "This bracelet is a little loose.", "呢條手鏈有啲鬆。",
        piper="This [[bɹˈeɪslət]] is a little loose.",
        note="開頭 /l/，尾音 /s/。lose 先至係失去。",
    )
    add(
        "finger-noun", "finger", "noun", "hand-digit", "F IH1 NG . G ER0", ["fin", "ger"],
        "手指", "手指", "sau2 zi2", ["measure my finger"],
        "Can you measure my finger?", "可唔可以量吓我隻手指？",
        note="中間 /ŋ/。",
    )
    add(
        "wrist-noun", "wrist", "noun", "arm-joint", "R IH1 S T", ["wrist"],
        "手腕", "手腕", "sau2 wun2", ["on the wrist"],
        "Please measure my wrist.", "唔該量吓我隻手腕。",
        note="開頭 /ɹ/。手鏈戴喺手腕。",
    )
    add(
        "adjust-verb", "adjust", "verb", "alter-fit", "AH0 . JH AH1 S T", ["ad", "just"],
        "改碼", "改码", "gaai2 maa5", ["adjust the size"],
        "I can adjust the size.", "我可以改吓個碼。",
        note="resize 唔喺呢輪。改碼用 adjust。",
    )
    add(
        "mirror-noun", "mirror", "noun", "looking-glass", "M IH1 R . ER0", ["mir", "ror"],
        "鏡", "镜", "geng3", ["look in the mirror"],
        "Please look in the mirror.", "請你照吓鏡。",
    )
    add(
        "perfect-adj", "perfect", "adj", "ideal-fit", "P ER1 . F IH2 K T", ["per", "fect"],
        "啱到極", "刚好", "ngaam1 dou3 gik6", ["a perfect fit"],
        "This fit is perfect.", "呢個碼啱到極。",
        piper="This fit is [[pˈɜfˌɪkt]].",
        variants=["/pɚ.ˈfɛkt/"],
        note="形容詞教 /ˈpɝ.ˌfɪkt/。CMU 第一條係動詞重音，標做變體。",
    )
    add(
        "almost-adv", "almost", "adv", "nearly", "AO1 L . M OW2 S T", ["al", "most"],
        "差唔多", "差不多", "caa1 m4 do1", ["almost right", "almost perfect"],
        "It feels almost right.", "戴落差唔多啱。",
    )
    add(
        "comfortable-adj", "comfortable", "adj", "at-ease", "K AH1 M . F ER0 . T AH0 . B AH0 L", ["com", "for", "ta", "ble"],
        "舒服", "舒服", "syu1 fuk6", ["feels comfortable"],
        "This size feels comfortable.", "呢個碼戴得好舒服。",
        note="四個音節 /ˈkʌm.fɚ.tə.bəl/。唔好吞中間。",
    )
    add(
        "cost-noun", "cost", "noun", "amount-due", "K AA1 S T", ["cost"],
        "費用", "费用", "fai3 jung6", ["the cost", "how much does this cost"],
        "How much does this cost?", "呢件幾多錢？",
        piper="How much does this [[kˈɑst]]?",
        variants=["/kɔst/"],
        note="教 CMU 第一條 /ˈkɑst/。錄音強制 /ɑ/。第二條 /kɔst/ 標做變體。",
    )
    add(
        "discount-noun", "discount", "noun", "price-cut", "D IH1 S . K AW0 N T", ["dis", "count"],
        "折扣", "折扣", "zit3 kau3", ["a discount", "ten percent discount"],
        "There is a discount today.", "今日有折扣。",
        variants=["/dɪs.ˈkaʊnt/"],
        note="名詞教 /ˈdɪs.kaʊnt/，重音喺第一節。CMU 第一條係動詞重音，標做變體。",
    )
    add(
        "percent-noun", "percent", "noun", "per-hundred", "P ER0 . S EH1 N T", ["per", "cent"],
        "百分比", "百分比", "baak3 fan6 bei2", ["ten percent", "percent off"],
        "It is ten percent off.", "呢件減百分之十。",
        note="重音喺第二節 /pɚ.ˈsɛnt/。",
    )
    add(
        "off-adv", "off", "adv", "taken-from", "AO1 F", ["off"],
        "減", "减", "gaam2", ["percent off", "ten percent off"],
        "It is ten percent off.", "呢件減百分之十。",
        note="呢度係減價，唔係關門。",
    )
    add(
        "special-adj", "special", "adj", "not-regular", "S P EH1 . SH AH0 L", ["spe", "cial"],
        "特別", "特别", "dak6 bit6", ["a special offer"],
        "This is a special offer.", "呢個係特別優惠。",
    )
    add(
        "offer-noun", "offer", "noun", "shop-offer", "AO1 . F ER0", ["of", "fer"],
        "優惠", "优惠", "jau1 wai6", ["a special offer"],
        "This offer includes tax.", "呢個優惠已經包稅。",
        piper="This [[ˈɔfɚ]] includes tax.",
        note="尾音 /ɚ/。唔好再加一個 /ɹ/。",
    )
    add(
        "include-verb", "include", "verb", "contain-in", "IH2 N . K L UW1 D", ["in", "clude"],
        "包括", "包括", "baau1 kut3", ["include tax", "tax included"],
        "Does the total include tax?", "總數包唔包稅？",
    )
    add(
        "tax-noun", "tax", "noun", "added-levy", "T AE1 K S", ["tax"],
        "稅", "税", "seoi3", ["include tax", "the tax"],
        "The tax is included.", "稅已經包咗。",
    )
    add(
        "total-noun", "total", "noun", "full-sum", "T OW1 . T AH0 L", ["to", "tal"],
        "總數", "总数", "zung2 sou3", ["the total", "it comes to"],
        "The total is a good deal.", "總數好抵買。",
    )
    add(
        "budget-noun", "budget", "noun", "spend-plan", "B AH1 . JH IH0 T", ["bud", "get"],
        "預算", "预算", "jyu6 syun3", ["within my budget"],
        "That is within my budget.", "呢個喺我預算之內。",
    )
    add(
        "expensive-adj", "expensive", "adj", "high-price", "IH0 K . S P EH1 N . S IH0 V", ["ex", "pen", "sive"],
        "貴", "贵", "gwai3", ["too expensive", "more expensive"],
        "This ring is expensive.", "呢隻戒指好貴。",
        piper="This ring is [[ɪkspˈɛnsɪv]].",
        note="開頭 /ɪk/，重音喺第二節。",
    )
    add(
        "reasonable-adj", "reasonable", "adj", "fair-price", "R IY1 . Z AH0 . N AH0 . B AH0 L", ["rea", "son", "a", "ble"],
        "合理", "合理", "hap6 lei5", ["a reasonable price"],
        "The price is reasonable.", "呢個價錢合理。",
        variants=["/ˈɹiz.nə.bəl/"],
        note="教四音節 /ˈɹi.zə.nə.bəl/。CMU 第二條少一個音，標做變體。",
    )
    add(
        "worth-adj", "worth", "adj", "deserved", "W ER1 TH", ["worth"],
        "值得", "值得", "zik6 dak1", ["worth it", "worth the price"],
        "This jade is worth it.", "呢塊玉值得買。",
        note="中間 /θ/。",
    )
    add(
        "deal-noun", "deal", "noun", "good-buy", "D IY1 L", ["deal"],
        "抵買", "划算", "dai2 maai5", ["a good deal"],
        "The total is a good deal.", "總數好抵買。",
    )
    add(
        "sale-noun", "sale", "noun", "cut-event", "S EY1 L", ["sale"],
        "特價", "特价", "dak6 gaa3", ["on sale", "a sale"],
        "This piece is on sale today.", "呢件今日特價。",
        note="尾音 /l/。sale 係特價，sell 先至係賣。",
    )


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
    j4 = [
        _line("j4-l1", "mei", "Mei", "This gold is authentic.", "呢件金係正貨。", "This gold is [[əθˈɛntɪk]]."),
        _line("j4-l2", "tom", "Tom", "Is the diamond natural?", "粒鑽石係咪天然？", "Is the [[dˈaɪmənd]] [[nˈætʃɚəl]]?"),
        _line("j4-l3", "mei", "Mei", "Yes. It is certified.", "係。有證書。", "Yes. It is [[sˈɜtəfˌaɪd]]."),
        _line("j4-l4", "tom", "Tom", "I like this jade.", "我鍾意呢塊玉。"),
        _line("j4-l5", "mei", "Mei", "This setting is eighteen karat gold.", "呢個鑲托係十八開金。", "This setting is eighteen [[kˈɛɹət]] gold."),
    ]
    j4x = _line("j4-l6", "tom", "Tom", "Is this real gold?", "呢件係咪真金？")
    j5 = [
        _line("j5-l1", "mei", "Mei", "Would you like to try this ring on?", "想唔想試吓呢隻戒指？"),
        _line("j5-l2", "tom", "Tom", "Can you measure my finger?", "可唔可以量吓我隻手指？"),
        _line("j5-l3", "mei", "Mei", "This size is a little tight.", "呢個碼有啲緊。"),
        _line("j5-l4", "tom", "Tom", "It feels almost right.", "戴落差唔多啱。"),
        _line("j5-l5", "mei", "Mei", "I can adjust it. Look in the mirror.", "我可以改。你照吓鏡。"),
    ]
    j5x = [
        _line("j5-m1", "mei", "Mei", "I can measure your finger.", "我可以量吓你隻手指。"),
        _line("j5-m2", "mei", "Mei", "I can adjust it.", "我可以改吓。"),
        _line("j5-m3", "mei", "Mei", "Look in the mirror.", "你照吓鏡。"),
        _line("j5-l6", "tom", "Tom", "It feels a little loose.", "戴落有啲鬆。"),
    ]
    j6 = [
        _line("j6-l1", "tom", "Tom", "How much does this cost?", "呢件幾多錢？", "How much does this [[kˈɑst]]?"),
        _line("j6-l2", "mei", "Mei", "This piece is on sale today.", "呢件今日特價。"),
        _line("j6-l3", "tom", "Tom", "Is there a discount?", "有冇折扣？"),
        _line("j6-l4", "mei", "Mei", "Ten percent off, and tax is included.", "減一成，稅已經包咗。"),
        _line("j6-l5", "tom", "Tom", "That is within my budget.", "呢個喺我預算之內。"),
    ]
    j6m = _line("j6-m1", "mei", "Mei", "The total is a good deal.", "總數好抵買。")
    lessons = [
        {
            "id": "J4",
            "unit": "J",
            "titleYue": "金、銀、鑽石、玉",
            "titleEn": "Gold, silver, diamond, jade",
            "canDoYue": "你能夠講金、鑽石同玉。",
            "canDoEn": "Name gold, a diamond, and jade, and ask if it is authentic.",
            "minutes": 12,
            "hero": "assets/art/lessons/j4.webp",
            "cast": ["mei", "tom"],
            "cefr": "A2",
            "lemmas": [
                "gold-noun", "silver-noun", "white-gold-phrase", "rose-gold-phrase", "platinum-noun",
                "diamond-noun", "jade-noun", "gemstone-noun", "karat-noun", "pure-adj", "authentic-adj",
                "certified-adj", "natural-adj", "treated-adj", "sparkle-verb", "setting-noun",
            ],
            "dialogue": j4,
            "understand": [
                {"prompt": "This gold is authentic. 係問緊定係講緊？", "choices": ["講呢件金係正貨", "講呢件係鉑金", "講玉可以治病"], "answer": 0, "explain": "authentic 係正貨。玉只係材料，唔好講醫療功效。"},
                {"prompt": "Is the diamond natural? 客人想知？", "choices": ["粒鑽石係咪天然", "個碼緊唔緊", "總數幾多"], "answer": 0, "explain": "natural 係天然。處理過要另外講。"},
                {"prompt": "eighteen karat 係講？", "choices": ["金嘅開數", "鑽石幾多克拉重量", "稅率"], "answer": 0, "explain": "karat 呢度係金嘅開。純金先至接近二十四開。"},
            ],
            "chunks": [
                {"pattern": "This ___ is authentic.", "example": "This gold is authentic.", "glossYue": "呢件⋯⋯係正貨。", "answer": "gold", "choices": ["gold", "passport", "menu"]},
                {"pattern": "Is the ___ natural?", "example": "Is the diamond natural?", "glossYue": "⋯⋯係咪天然？", "answer": "diamond", "choices": ["diamond", "gate", "seat"]},
                {"pattern": "It is ___.", "example": "It is certified.", "glossYue": "有證書。", "answer": "certified", "choices": ["certified", "boarding", "looking"]},
                {"pattern": "This setting is eighteen ___ gold.", "example": "This setting is eighteen karat gold.", "glossYue": "呢個鑲托係十八開金。", "answer": "karat", "choices": ["karat", "percent", "finger"]},
            ],
            "shadow": {"lineId": "j4-l1", "hint": "This gold is authentic."},
            "build": [
                {"type": "choice", "promptYue": "Tom 問 Is this real gold? 你點講？", "choices": ["This gold is authentic.", "I'm just looking, thank you.", "Go straight ahead."], "answer": 0, "explain": "先講材料，再講係正貨。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["This", "gold", "is", "authentic"], "answer": ["This", "gold", "is", "authentic"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "Tom 企喺展示盤前面。等佢問完先答。玉只講材料，唔好講醫療功效。",
                "turns": [
                    _turn("Tom", "tom", j4x, "This gold is authentic.", ["authentic"], j4[0]),
                    _turn("Tom", "tom", j4[1], "Yes. It is certified.", ["certified"], j4[2]),
                    _turn("Tom", "tom", j4[3], "This setting is eighteen karat gold.", ["karat"], j4[4]),
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "authentic-adj", "choices": ["authentic", "natural", "treated"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "diamond-noun", "choices": ["diamond", "jade", "gold"], "answer": 0},
                {"type": "meaning", "prompt": "gold", "choices": ["金", "稅", "碼"], "answer": 0},
                {"type": "meaning", "prompt": "jade", "choices": ["玉", "鏡", "折扣"], "answer": 0},
                {"type": "choice", "prompt": "邊個中間有 /θ/？", "choices": ["authentic", "setting", "pure"], "answer": 0, "explain": "authentic 有 /θ/。setting 開頭係 /s/。"},
            ],
            "sound": {
                "ipa": "/θ/",
                "title": "正貨中間嗰下",
                "note": "authentic 中間係 /θ/。舌尖伸喺上下牙中間，輕輕吹氣，唔好讀成 /s/ 或者 /t/。開頭係 ə，唔好讀成 ɔ。白金唔係鉑金。玉係材料同工藝，唔好講醫療功效。",
                "pairs": [
                    {"a": "authentic-adj", "b": "setting-noun"},
                    {"a": "pure-adj", "b": "treated-adj"},
                ],
                "drill": ["authentic-adj", "natural-adj", "certified-adj", "gold-noun", "jade-noun"],
            },
            "next": "J5",
        },
        {
            "id": "J5",
            "unit": "J",
            "titleYue": "尺寸同試戴",
            "titleEn": "Sizing and try-on",
            "canDoYue": "你能夠量碼同請人試戴。",
            "canDoEn": "Offer a try-on, measure a finger, and say if it is tight or loose.",
            "minutes": 12,
            "hero": "assets/art/lessons/j5.webp",
            "cast": ["mei", "tom"],
            "cefr": "A2",
            "lemmas": [
                "size-noun", "measure-verb", "try-on-phrase", "fit-verb", "tight-adj", "loose-adj",
                "finger-noun", "wrist-noun", "adjust-verb", "mirror-noun", "perfect-adj", "almost-adv",
                "comfortable-adj",
            ],
            "dialogue": j5,
            "understand": [
                {"prompt": "Would you like to try this ring on? 係？", "choices": ["請人試戴", "報總數", "問閘口點行"], "answer": 0, "explain": "try on 係試戴。等客人答完先動手。"},
                {"prompt": "This size is a little tight. 隻戒指？", "choices": ["有啲緊", "有啲鬆", "係特價"], "answer": 0, "explain": "tight 係緊。鬆先至係 loose。"},
                {"prompt": "Look in the mirror. 你想客人？", "choices": ["自己照鏡睇啱唔啱", "遞護照", "叫雞"], "answer": 0, "explain": "試完畀佢照鏡。"},
            ],
            "chunks": [
                {"pattern": "Would you like to try this ___ on?", "example": "Would you like to try this ring on?", "glossYue": "想唔想試吓呢隻⋯⋯？", "answer": "ring", "choices": ["ring", "menu", "gate"]},
                {"pattern": "Can you measure my ___?", "example": "Can you measure my finger?", "glossYue": "可唔可以量吓我隻⋯⋯？", "answer": "finger", "choices": ["finger", "passport", "chicken"]},
                {"pattern": "This size is a little ___.", "example": "This size is a little tight.", "glossYue": "呢個碼有啲⋯⋯。", "answer": "tight", "choices": ["tight", "sale", "aisle"]},
                {"pattern": "Look in the ___.", "example": "Look in the mirror.", "glossYue": "你照吓⋯⋯。", "answer": "mirror", "choices": ["mirror", "bin", "menu"]},
            ],
            "shadow": {"lineId": "j5-l1", "hint": "Would you like to try this ring on?"},
            "build": [
                {"type": "choice", "promptYue": "Tom 話個碼有啲緊。你點接？", "choices": ["I can adjust it.", "The total is a good deal.", "Ship is short."], "answer": 0, "explain": "太緊可以改碼。呢輪用 adjust，唔用 resize。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Can", "you", "measure", "my", "finger"], "answer": ["Can", "you", "measure", "my", "finger"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "Tom 想試戒指。等佢講完先答。問吓手感：How does it feel?",
                "turns": [
                    _turn("Tom", "tom", j5[1], "I can measure your finger.", ["measure", "finger"], j5x[0]),
                    _turn("Tom", "tom", j5[3], "I can adjust it.", ["adjust"], j5x[1]),
                    _turn("Tom", "tom", j5x[3], "Look in the mirror.", ["mirror"], j5x[2]),
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "loose-adj", "choices": ["loose", "tight", "size"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "finger-noun", "choices": ["finger", "fit", "wrist"], "answer": 0},
                {"type": "meaning", "prompt": "size", "choices": ["碼", "稅", "玉"], "answer": 0},
                {"type": "meaning", "prompt": "tight", "choices": ["緊", "鬆", "折扣"], "answer": 0},
                {"type": "choice", "prompt": "邊個開頭係 /l/？", "choices": ["loose", "tight", "fit"], "answer": 0, "explain": "loose 開頭係 /l/。tight 係 /t/。fit 係短 /ɪ/。"},
            ],
            "sound": {
                "ipa": "/l/",
                "title": "鬆，唔係失去",
                "note": "loose 開頭係 /l/。舌尖抵住上顎後面，氣由兩邊出，尾音 /s/。tight 係太緊。fit 係啱唔啱。lose 先至係失去，呢課唔教。",
                "pairs": [
                    {"a": "loose-adj", "b": "tight-adj"},
                    {"a": "finger-noun", "b": "wrist-noun"},
                ],
                "drill": ["loose-adj", "size-noun", "finger-noun", "mirror-noun", "adjust-verb"],
            },
            "next": "J6",
        },
        {
            "id": "J6",
            "unit": "J",
            "titleYue": "價錢同折扣",
            "titleEn": "Prices and discounts",
            "canDoYue": "你能夠報價同講折扣。",
            "canDoEn": "Say the cost, a percent off, and whether tax is included.",
            "minutes": 12,
            "hero": "assets/art/lessons/j6.webp",
            "cast": ["mei", "tom"],
            "cefr": "A2/B1",
            "lemmas": [
                "price-noun", "cost-noun", "discount-noun", "percent-noun", "off-adv", "special-adj",
                "offer-noun", "include-verb", "tax-noun", "total-noun", "budget-noun", "expensive-adj",
                "reasonable-adj", "worth-adj", "deal-noun", "sale-noun",
            ],
            "dialogue": j6,
            "understand": [
                {"prompt": "How much does this cost? 係問？", "choices": ["呢件幾多錢", "個碼緊唔緊", "粒鑽石係咪天然"], "answer": 0, "explain": "cost 讀 /kɑst/。可以再講特價。"},
                {"prompt": "Ten percent off, and tax is included. 即係？", "choices": ["減一成，稅包咗", "加一成稅", "十八開"], "answer": 0, "explain": "off 係減。included 係包咗喺總數。"},
                {"prompt": "within my budget 係？", "choices": ["喺我預算之內", "太貴唔買", "要改碼"], "answer": 0, "explain": "預算係客人自己嘅上限。"},
            ],
            "chunks": [
                {"pattern": "How much does this ___?", "example": "How much does this cost?", "glossYue": "呢件幾多⋯⋯？", "answer": "cost", "choices": ["cost", "finger", "gate"]},
                {"pattern": "This piece is on ___ today.", "example": "This piece is on sale today.", "glossYue": "呢件今日⋯⋯。", "answer": "sale", "choices": ["sale", "mirror", "aisle"]},
                {"pattern": "Ten percent ___.", "example": "Ten percent off.", "glossYue": "減一成。", "answer": "off", "choices": ["off", "on", "in"]},
                {"pattern": "That is within my ___.", "example": "That is within my budget.", "glossYue": "呢個喺我⋯⋯之內。", "answer": "budget", "choices": ["budget", "passport", "bracelet"]},
            ],
            "shadow": {"lineId": "j6-l4", "hint": "Ten percent off, and tax is included."},
            "build": [
                {"type": "choice", "promptYue": "Tom 問有冇折扣。你點講？", "choices": ["Ten percent off, and tax is included.", "Look in the mirror.", "A window seat, please."], "answer": 0, "explain": "講減幾多，再講稅包唔包。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["How", "much", "does", "this", "cost"], "answer": ["How", "much", "does", "this", "cost"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "Tom 問價錢。等佢講完先答。可以講：It comes to the total。",
                "turns": [
                    _turn("Tom", "tom", j6[0], "This piece is on sale today.", ["sale"], j6[1]),
                    _turn("Tom", "tom", j6[2], "Ten percent off, and tax is included.", ["percent", "tax"], j6[3]),
                    _turn("Tom", "tom", j6[4], "The total is a good deal.", ["total", "deal"], j6m),
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "sale-noun", "choices": ["sale", "tax", "total"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "discount-noun", "choices": ["discount", "deal", "cost"], "answer": 0},
                {"type": "meaning", "prompt": "discount", "choices": ["折扣", "碼", "玉"], "answer": 0},
                {"type": "meaning", "prompt": "budget", "choices": ["預算", "鑲托", "鏡"], "answer": 0},
                {"type": "choice", "prompt": "邊個尾音係 /l/？", "choices": ["sale", "tax", "cost"], "answer": 0, "explain": "sale 尾音係 /l/。discount 名詞重音喺第一節。"},
            ],
            "sound": {
                "ipa": "/l/",
                "title": "特價尾音",
                "note": "sale 尾音係 /l/。舌尖抵住上顎後面，氣由兩邊出。discount 名詞重音喺第一節 /ˈdɪs.kaʊnt/。cost 讀 /ˈkɑst/，唔好讀成 /kɔst/。",
                "pairs": [
                    {"a": "sale-noun", "b": "tax-noun"},
                    {"a": "discount-noun", "b": "cost-noun"},
                ],
                "drill": ["sale-noun", "discount-noun", "budget-noun", "percent-noun", "cost-noun"],
            },
            "next": "T1",
        },
    ]
    extras = [j4x, *j5x, j6m]
    return lessons, extras


FLAG_ITEMS = [
    {
        "id": "authentic-adj",
        "lemma": "authentic",
        "pos": "adj",
        "cmudict": ["AH0 TH EH1 N T IH0 K", "AO0 TH EH1 N T IH0 K", "AO0 TH EH1 N IH0 K", "AH0 TH EH1 N IH0 K"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has /ə/ and /ɔ/ onsets, and two forms drop the /t/.",
        "resolution": "Teach the first CMU form /ə.ˈθɛn.tɪk/. The clip is forced so the onset is /ə/ and the consonant is /θ/.",
        "resolved": True,
        "taughtIpa": "/ə.ˈθɛn.tɪk/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "platinum-noun",
        "lemma": "platinum",
        "pos": "noun",
        "cmudict": ["P L AE1 T N AH0 M", "P L AE1 T AH0 N AH0 M"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists two syllables first and three syllables second.",
        "resolution": "Teach the three-syllable form /ˈplæt.ə.nəm/ and force the clip. The two-syllable form stays a variant.",
        "resolved": True,
        "taughtIpa": "/ˈplæt.ə.nəm/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "natural-adj",
        "lemma": "natural",
        "pos": "adj",
        "cmudict": ["N AE1 CH ER0 AH0 L", "N AE1 CH R AH0 L"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has three syllables and a two-syllable reduction.",
        "resolution": "Teach three syllables /ˈnætʃ.ɚ.əl/. The clip is forced so an extra /ɹ/ is not inserted.",
        "resolved": True,
        "taughtIpa": "/ˈnætʃ.ɚ.əl/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "discount-noun",
        "lemma": "discount",
        "pos": "noun",
        "cmudict": ["D IH0 S K AW1 N T", "D IH1 S K AW0 N T"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU's first entry stresses the second syllable. The noun in this lesson stresses the first.",
        "resolution": "Teach the noun /ˈdɪs.kaʊnt/. The verb stress stays a labelled variant.",
        "resolved": True,
        "taughtIpa": "/ˈdɪs.kaʊnt/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "cost-noun",
        "lemma": "cost",
        "pos": "noun",
        "cmudict": ["K AA1 S T", "K AO1 S T"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has /ɑ/ and /ɔ/. Unforced Piper says /ɔ/.",
        "resolution": "Teach the first CMU form /kɑst/ and force the clip.",
        "resolved": True,
        "taughtIpa": "/ˈkɑst/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "perfect-adj",
        "lemma": "perfect",
        "pos": "adj",
        "cmudict": ["P ER0 F EH1 K T", "P ER1 F IH2 K T"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU's first entry is the verb stress. The adjective stresses the first syllable.",
        "resolution": "Teach the adjective /ˈpɝ.ˌfɪkt/ and force the clip. The verb form stays a variant.",
        "resolved": True,
        "taughtIpa": "/ˈpɝ.ˌfɪkt/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "reasonable-adj",
        "lemma": "reasonable",
        "pos": "adj",
        "cmudict": ["R IY1 Z AH0 N AH0 B AH0 L", "R IY1 Z N AH0 B AH0 L"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU has four syllables and a shorter form.",
        "resolution": "Teach four syllables /ˈɹi.zə.nə.bəl/. The shorter form stays a variant.",
        "resolved": True,
        "taughtIpa": "/ˈɹi.zə.nə.bəl/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "try-on-phrase",
        "lemma": "try on",
        "pos": "phrase",
        "cmudict": ["on: AA1 N", "on: AO1 N"],
        "wiktionary": "not re-fetched this round",
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists /ɑn/ first and /ɔn/ second. The unforced sentence uses /ɔn/.",
        "resolution": "Teach /ɔn/ in try on so the card matches the sentence audio. /ɑn/ stays a variant.",
        "resolved": True,
        "taughtIpa": "/ˈtɹaɪ ˈɔn/",
        "resolvedBy": "round-19",
        "resolvedAt": "2026-10-30",
    },
]


def apply_round(items, lessons, path, flags):
    by_id = {item["id"]: item for item in items}
    missing = [lid for lid in DECK if lid not in by_id]
    if missing:
        raise SystemExit(f"deck missing {missing}")
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
    for lesson in lessons:
        if lesson["id"] in CEFR:
            lesson["cefr"] = CEFR[lesson["id"]]
    for unit in path["units"]:
        for entry in unit["lessons"]:
            if entry["id"] not in CEFR:
                raise SystemExit(f"no cefr for {entry['id']}")
            entry["cefr"] = CEFR[entry["id"]]
    flags.extend(FLAG_ITEMS)
    return {
        "decks": [
            {
                "id": "jewellery",
                "titleYue": "珠寶櫃檯",
                "level": "A2",
                "lemmas": DECK,
            }
        ]
    }

#!/usr/bin/env python3
"""Build lexicon, lessons, path, and pronunciation flags for Night-1.

IPA is generated from a chosen CMUdict ARPAbet string. The string must be one
of the CMUdict pronunciations for that lemma (no silent pick). Wiktionary
disagreements are recorded in review/flags.json with an explicit resolution.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CMU_PATH = Path("/tmp/cmudict.dict")
OUT = ROOT / "content"
REVIEW = ROOT / "review"

VOWELS = {
    "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY",
    "IH", "IY", "OW", "OY", "UH", "UW",
}
BASE = {
    "AA": "ɑ", "AE": "æ", "AH": "ʌ", "AO": "ɔ", "AW": "aʊ", "AY": "aɪ",
    "B": "b", "CH": "tʃ", "D": "d", "DH": "ð", "EH": "ɛ", "ER": "ɝ",
    "EY": "eɪ", "F": "f", "G": "ɡ", "HH": "h", "IH": "ɪ", "IY": "i",
    "JH": "dʒ", "K": "k", "L": "l", "M": "m", "N": "n", "NG": "ŋ",
    "OW": "oʊ", "OY": "ɔɪ", "P": "p", "R": "ɹ", "S": "s", "SH": "ʃ",
    "T": "t", "TH": "θ", "UH": "ʊ", "UW": "u", "V": "v", "W": "w",
    "Y": "j", "Z": "z", "ZH": "ʒ",
}


def load_cmu(path: Path) -> dict[str, list[str]]:
    idx: dict[str, list[str]] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith(";;;"):
            continue
        body = line.split(" # ")[0].strip()
        parts = body.split()
        if len(parts) < 2:
            continue
        word, phones = parts[0], " ".join(parts[1:])
        # read(2) is an alternate pronunciation of read, not a different lemma.
        key = re.sub(r"\(\d+\)$", "", word).lower()
        idx.setdefault(key, []).append(phones)
    return idx


def phone_key(arp: str) -> str:
    return " ".join(t for t in arp.split() if t not in {".", "|"})


def split_words(arp: str) -> list[list[list[str]]]:
    words = []
    cur_word: list[list[str]] = []
    cur: list[str] = []
    for tok in arp.split():
        if tok == "|":
            if cur:
                cur_word.append(cur)
                cur = []
            if cur_word:
                words.append(cur_word)
                cur_word = []
            continue
        if tok == ".":
            if cur:
                cur_word.append(cur)
                cur = []
            continue
        cur.append(tok)
    if cur:
        cur_word.append(cur)
    if cur_word:
        words.append(cur_word)
    return words


def vowel_ipa(tok: str, nxt: str | None) -> tuple[str, int]:
    stress = 0
    base = tok
    if tok[-1].isdigit():
        stress = int(tok[-1])
        base = tok[:-1]
    ipa = BASE[base]
    if base == "AH" and stress == 0:
        ipa = "ə"
    elif base == "ER" and stress == 0:
        ipa = "ɚ"
    elif base == "IY" and nxt and nxt.rstrip("012") == "R":
        # CMU codes the NEAR vowel as IY+R. Learner IPA for GA is /ɪr/.
        ipa = "ɪ"
    return ipa, stress


def syllable_ipa(phones: list[str], stress: int) -> str:
    out = []
    for i, tok in enumerate(phones):
        base = tok[:-1] if tok[-1].isdigit() else tok
        if base in VOWELS:
            nxt = phones[i + 1] if i + 1 < len(phones) else None
            nxt_base = None
            if nxt:
                nxt_base = nxt[:-1] if nxt[-1].isdigit() else nxt
            ipa, _st = vowel_ipa(tok, nxt_base)
            out.append(ipa)
        else:
            out.append(BASE[base])
    prefix = "ˈ" if stress == 1 else ("ˌ" if stress == 2 else "")
    return prefix + "".join(out)


def syll_stress(phones: list[str]) -> int:
    best = 0
    for tok in phones:
        if tok[-1].isdigit():
            best = max(best, int(tok[-1]))
    return best


def ipa_of(arp: str) -> tuple[str, list[str], int]:
    words = split_words(arp)
    word_strs = []
    syl_ipas = []
    flat_syllables = []
    primary_at = None
    idx = 0
    for w in words:
        bits = []
        for syl in w:
            st = syll_stress(syl)
            rendered = syllable_ipa(syl, st)
            bits.append(rendered)
            syl_ipas.append(rendered)
            flat_syllables.append(syl)
            idx += 1
            if st == 1 and primary_at is None:
                primary_at = idx
        word_strs.append(".".join(bits))
    # Function words with no primary (the, a, weak to) stay unstressed.
    # A fallback of 1 painted a gold chip on /ðə/ and /ə/.
    if primary_at is None:
        primary_at = 0
    return "/" + " ".join(word_strs) + "/", syl_ipas, primary_at


ITEMS: list[dict] = []


def add(
    id: str,
    lemma: str,
    pos: str,
    sense: str,
    arp: str,
    ortho: list[str],
    yue: str,
    zh: str,
    jp: str,
    cols: list[str],
    example: str,
    example_yue: str,
    *,
    cmu: str | None = None,
    phrase: bool = False,
    piper: str | None = None,
    variants: list[str] | None = None,
    note: str | None = None,
    join_syllables: bool = False,
):
    ipa, syl_ipa, stress = ipa_of(arp)
    if join_syllables:
        if len(ortho) != 1:
            raise SystemExit(f"{id}: join_syllables needs one chip, got {ortho}")
        syl_ipa = [".".join(syl_ipa)]
    elif len(ortho) != len(syl_ipa):
        raise SystemExit(f"{id}: ortho {ortho} != syllables {syl_ipa}")
    ITEMS.append(
        {
            "id": id,
            "lemma": lemma,
            "pos": pos,
            "senseId": sense,
            "ipa": ipa,
            "syllables": ortho,
            "syllableIpa": syl_ipa,
            "stress": stress,
            "arpabet": phone_key(arp),
            "audio": f"assets/audio/words/{id}.mp3",
            "audioSlow": f"assets/audio/words/{id}-slow.mp3",
            "glossYue": yue,
            "glossZh": zh,
            "jyutping": jp,
            "collocations": cols,
            "example": example,
            "exampleYue": example_yue,
            "say": piper or example,
            "variants": variants or [],
            "note": note or "",
            "sources": [
                "CMUdict 0.7b",
                "Wiktionary English (cross-check 2026-10-29)",
            ],
            "verified_at": "2026-10-29",
            "status": "IPA_OK",
            "senseMismatch": False,
            "cmuLemma": (cmu or lemma).lower(),
            "phrase": phrase,
            "audioSha256": "",
        }
    )


def build_items() -> None:
    # --- heteronym bank (sense-matched; piper text forces the vowel) ---
    add("read-verb-present", "read", "verb", "present-interpret-text", "R IY1 D", ["read"],
        "讀（而家／習慣）", "读（现在）", "duk6", ["read the news", "read a book"],
        "I read the news every day.", "我每日都讀新聞。",
        piper="I [[ɹˈid]] the news every day.")
    add("read-verb-past", "read", "verb", "past-interpret-text", "R EH1 D", ["read"],
        "讀過（過去）", "读过", "duk6 gwo3", ["yesterday I read", "have you read"],
        "Yesterday I read the book.", "我尋日讀咗嗰本書。",
        piper="Yesterday I [[ɹˈɛd]] the book.")
    add("live-verb", "live", "verb", "reside", "L IH1 V", ["live"],
        "住", "住", "zyu6", ["live in Macau", "live here"],
        "I live in Macau.", "我住喺澳門。",
        piper="I [[lˈɪv]] in Macau.")
    add("live-adj", "live", "adj", "not-recorded", "L AY1 V", ["live"],
        "現場嘅；直播嘅", "现场的", "jin6 coeng4", ["a live show", "live music"],
        "It is a live show.", "呢個係現場表演。",
        piper="It is a [[lˈaɪv]] show.")
    add("bow-noun", "bow", "noun", "ribbon-or-weapon", "B OW1", ["bow"],
        "蝴蝶結；弓", "蝴蝶结；弓", "wu4 dip6 git3", ["a hair bow", "bow and arrow"],
        "She tied a bow in her hair.", "佢喺頭髮綁咗個蝴蝶結。",
        piper="She tied a [[bˈoʊ]] in her hair.")
    add("bow-verb", "bow", "verb", "bend-forward", "B AW1", ["bow"],
        "鞠躬", "鞠躬", "guk1 gung1", ["bow to the guest", "take a bow"],
        "Please bow to the guest.", "請向客人鞠躬。",
        piper="Please [[bˈaʊ]] to the guest.")
    add("wind-noun", "wind", "noun", "moving-air", "W IH1 N D", ["wind"],
        "風", "风", "fung1", ["the wind", "a strong wind"],
        "The wind is strong tonight.", "今晚風好大。",
        piper="The [[wˈɪnd]] is strong tonight.")
    add("wind-verb", "wind", "verb", "turn-or-coil", "W AY1 N D", ["wind"],
        "上緊（鐘錶）；繞", "上发条；绕", "soeng5 gan2", ["wind the clock", "wind the rope"],
        "Wind the clock tonight.", "今晚記得上鐘。",
        piper="[[wˈaɪnd]] the clock tonight.")
    add("bass-noun-fish", "bass", "noun", "fish", "B AE1 S", ["bass"],
        "鱸魚", "鲈鱼", "lou4 jyu4", ["a bass fish", "striped bass"],
        "We caught a bass in the river.", "我哋喺河捉到一條鱸魚。",
        piper="We caught a [[bˈæs]] in the river.")
    add("bass-noun-pitch", "bass", "noun", "low-pitch", "B EY1 S", ["bass"],
        "低音", "低音", "dai1 jam1", ["bass guitar", "the bass"],
        "He plays the bass guitar.", "佢彈低音結他。",
        piper="He plays the [[bˈeɪs]] guitar.")
    add("close-verb", "close", "verb", "shut", "K L OW1 Z", ["close"],
        "關上", "关上", "gwaan1 soeng6", ["close the door", "close the shop"],
        "Please close the door.", "唔該關門。",
        piper="Please [[klˈoʊz]] the door.")
    add("close-adj", "close", "adj", "near", "K L OW1 S", ["close"],
        "近；親近", "近", "kan5", ["a close friend", "close to the window"],
        "A close friend is here.", "一位好朋友喺度。",
        piper="A [[klˈoʊs]] friend is here.")

    # --- foundations & function words ---
    add("hello-intj", "hello", "intj", "greeting", "HH AH0 . L OW1", ["hel", "lo"],
        "你好", "你好", "nei5 hou2", ["hello again", "say hello"],
        "Hello. Let's begin.", "你好。我哋開始。",
        variants=["/hɛˈloʊ/"],
        note="CMU 亦收 HH EH0 L OW1。卡片用第一條 /həˈloʊ/。")
    add("hi-intj", "hi", "intj", "greeting", "HH AY1", ["hi"],
        "嗨", "嗨", "haai1", ["hi there"], "Hi. Good morning.", "嗨。早晨。")
    add("breath-noun", "breath", "noun", "air-from-lungs", "B R EH1 TH", ["breath"],
        "一啖氣；呼吸", "一口气", "jat1 daam6 hei3", ["a slow breath", "take a breath"],
        "Take a slow breath.", "慢慢吸一啖氣。")
    add("listen-verb", "listen", "verb", "hear-actively", "L IH1 S . AH0 N", ["lis", "ten"],
        "聽", "听", "teng1", ["listen again"], "Listen. Ship is short.", "聽住。Ship 係短音。",
        note="t 唔發音。")
    add("short-adj", "short", "adj", "brief-duration", "SH AO1 R T", ["short"],
        "短", "短", "dyun2", ["a short sound"], "Ship is short.", "Ship 係短音。")
    add("long-adj", "long", "adj", "greater-duration", "L AO1 NG", ["long"],
        "長", "长", "coeng4", ["a long sound"], "Sheep is long.", "Sheep 係長音。")
    add("ship-noun", "ship", "noun", "vessel", "SH IH1 P", ["ship"],
        "船", "船", "syun4", ["a short ship"], "Ship is short.", "Ship 係短音。")
    add("sheep-noun", "sheep", "noun", "animal", "SH IY1 P", ["sheep"],
        "羊", "羊", "joeng4", ["a long sheep"], "Sheep is long.", "Sheep 係長音。")
    add("sound-noun", "sound", "noun", "noise", "S AW1 N D", ["sound"],
        "聲音", "声音", "sing1 jam1", ["this sound"], "This sound is short.", "呢個音好短。")
    add("slow-adj", "slow", "adj", "not-fast", "S L OW1", ["slow"],
        "慢", "慢", "maan6", ["nice and slow", "a slow breath"],
        "Say it nice and slow.", "講慢啲。")
    add("smile-verb", "smile", "verb", "smile", "S M AY1 L", ["smile"],
        "微笑", "微笑", "mei4 siu3", ["smile a little"], "Smile a little.", "嘴角微微展開。",
        variants=["/ˈsmaɪ.əl/"],
        note="Wiktionary 另收兩音節 /ˈsmaɪ.əl/。教學用 CMU 單音節 /smaɪl/。")
    add("again-adv", "again", "adv", "one-more-time", "AH0 . G EH1 N", ["a", "gain"],
        "再", "再", "zoi3", ["say it again"], "Say it again.", "再講一次。",
        variants=["/əˈɡeɪn/"],
        note="CMU 另收 AH0 G EY1 N。卡片用 /əˈɡɛn/。")
    add("about-prep", "about", "prep", "concerning", "AH0 . B AW1 T", ["a", "bout"],
        "關於；大約", "关于", "gwaan1 jyu1", ["about the sound"],
        "About. The first sound is soft.", "About。第一個音好輕。",
        note="開頭係 schwa /ə/。")
    add("relax-verb", "relax", "verb", "become-calm", "R IH0 . L AE1 K S", ["re", "lax"],
        "放鬆", "放松", "fong3 sung1", ["relax and speak"], "Relax.", "放鬆。")
    add("begin-verb", "begin", "verb", "start", "B IH0 . G IH1 N", ["be", "gin"],
        "開始", "开始", "hoi1 ci2", ["let's begin"], "Let's begin.", "我哋開始。")
    add("keep-verb", "keep", "verb", "continue-state", "K IY1 P", ["keep"],
        "保持", "保持", "bou2 ci4", ["keep it light"], "Keep it light.", "輕輕帶過。")
    add("light-adj", "light", "adj", "not-heavy", "L AY1 T", ["light"],
        "輕巧", "轻", "heng1", ["keep it light"], "Keep it light.", "唔好用力。")
    add("name-noun", "name", "noun", "what-someone-is-called", "N EY1 M", ["name"],
        "名字", "名字", "ming4 zi6", ["my name is"], "My name is Mei.", "我叫 Mei。")
    add("the-art", "the", "art", "before-consonant", "DH AH0", ["the"],
        "英文冠詞，子音前面弱讀，中文往往唔使譯", "定冠词（弱读）", "", ["the sound", "the menu"],
        "The sound is short.", "個音好短。",
        variants=["/ði/ before a vowel", "/ðiː/ strong"],
        note="子音前面讀 /ðə/。元音前面讀 /ði/，見 the-art-vowel。the 唔係呢個，亦唔係嗰個。")
    add("the-art-vowel", "the", "art", "before-vowel", "DH IY0", ["the"],
        "英文冠詞，元音前面弱讀，中文往往唔使譯", "定冠词（元音前弱读）", "", ["the aisle", "the information"],
        "The aisle seat is free.", "通道位仲有。",
        piper="[[ðˈi]] aisle seat is free.",
        note="元音前面讀 /ði/。例句錄音只讀一次 /ði/，唔會先加個 /ðə/。")
    add("beat-verb", "beat", "verb", "strike-rhythm", "B IY1 T", ["beat"],
        "拍子；打拍", "拍子", "paak3 zi2", ["the beat"], "Beat is long.", "Beat 係長音。")
    add("bit-noun", "bit", "noun", "small-piece", "B IH1 T", ["bit"],
        "少少", "一点点", "siu2 siu2", ["a bit"], "Bit is short.", "Bit 係短音。")
    add("sit-verb", "sit", "verb", "be-seated", "S IH1 T", ["sit"],
        "坐", "坐", "co5", ["please sit"], "Sit is short.", "Sit 係短音。")
    add("seat-noun", "seat", "noun", "place-to-sit", "S IY1 T", ["seat"],
        "座位", "座位", "zo6 wai2", ["a window seat", "have a seat"],
        "A window seat, please.", "要靠窗位，唔該。")
    add("good-adj", "good", "adj", "pleasant", "G UH1 D", ["good"],
        "好", "好", "hou2", ["good morning", "a good flight"],
        "Good morning.", "早晨。")
    add("morning-noun", "morning", "noun", "early-day", "M AO1 R . N IH0 NG", ["mor", "ning"],
        "早晨；上晝", "早上", "zou2 san4", ["good morning"], "Good morning.", "早晨。")
    add("afternoon-noun", "afternoon", "noun", "after-noon", "AE2 F . T ER0 . N UW1 N", ["af", "ter", "noon"],
        "下晝", "下午", "haa6 zau3", ["good afternoon", "this afternoon"],
        "Good afternoon.", "午安。")
    add("evening-noun", "evening", "noun", "late-day", "IY1 V . N IH0 NG", ["eve", "ning"],
        "夜晚", "晚上", "je6 maan5", ["good evening"], "Good evening.", "晚上好。")
    add("my-det", "my", "det", "belonging-to-me", "M AY1", ["my"],
        "我嘅", "我的", "ngo5 ge3", ["my name", "my passport"], "My name is Ling.", "我叫 Ling。")
    add("nice-adj", "nice", "adj", "pleasant", "N AY1 S", ["nice"],
        "好；親切", "好", "hou2", ["nice to meet you", "a nice ring"],
        "Nice to meet you.", "認識你真好。",
        note="CMU 嘅 N IY1 S 係城市 Nice，唔係呢個意思。")
    add("meet-verb", "meet", "verb", "come-together", "M IY1 T", ["meet"],
        "見；認識", "见面", "gin3", ["nice to meet you"], "Nice to meet you.", "認識你真好。")
    add("you-pron", "you", "pron", "addressee", "Y UW1", ["you"],
        "你", "你", "nei5", ["thank you", "help you"], "Thank you.", "多謝。")
    add("thank-verb", "thank", "verb", "express-gratitude", "TH AE1 NG K", ["thank"],
        "多謝", "谢谢", "do1 ze6", ["thank you"], "Thank you.", "多謝。",
        note="目標音 /θ/。唔好讀成 f 或者 s。")
    add("thanks-noun", "thanks", "noun", "gratitude", "TH AE1 NG K S", ["thanks"],
        "多謝（短講）", "谢谢", "do1 ze6", ["thanks a lot"], "Thanks.", "多謝。")
    add("please-adv", "please", "adv", "polite-marker", "P L IY1 Z", ["please"],
        "唔該／請", "请", "m4 goi1", ["please sit", "a seat, please"],
        "A window seat, please.", "要靠窗位，唔該。")
    add("too-adv", "too", "adv", "also", "T UW1", ["too"],
        "都", "也", "dou1", ["me too", "you too"], "Nice to meet you, too.", "我都好高興認識你。")
    add("sir-noun", "sir", "noun", "polite-man", "S ER1", ["sir"],
        "先生（客氣）", "先生", "sin1 saang1", ["yes, sir"], "Yes, sir.", "係，先生。",
        piper="Yes, [[sˈɝ]].")
    add("madam-noun", "madam", "noun", "polite-woman", "M AE1 D . AH0 M", ["mad", "am"],
        "女士（客氣）", "女士", "neoi5 si6", ["yes, madam"], "Yes, madam.", "係，女士。")
    add("welcome-verb", "welcome", "verb", "greet-in", "W EH1 L . K AH0 M", ["wel", "come"],
        "歡迎", "欢迎", "fun1 jing4", ["welcome to", "you're welcome"],
        "Welcome to our jewellery store.", "歡迎嚟到我哋嘅珠寶店。",
        piper="Welcome to our [[dʒˈulɹi]] store.")
    add("a-art", "a", "art", "indefinite-before-consonant", "AH0", ["a"],
        "一個（子音前面，弱讀）", "一个", "jat1 go3", ["a table", "a seat"],
        "A table for two.", "兩位。",
        piper="[[ə ˈteɪbəl fɚ ˈtu.]]",
        variants=["/eɪ/ letter name"],
        note="冠詞讀 /ə/。字母名先至係 /eɪ/。")
    add("a-letter", "a", "noun", "letter-name", "EY1", ["a"],
        "英文字母 A", "字母 A", "zi6 mou5", ["the letter a"],
        "The letter a says its name.", "字母 A 讀自己個名。",
        piper="The letter [[ˈeɪ]] says its name.")
    add("of-prep", "of", "prep", "belonging", "AH1 V", ["of"],
        "嘅；屬於", "的", "ge3", ["of course", "a table of"],
        "Of course.", "當然。",
        variants=["/əv/ weak, as in of course"],
        note="單字引用讀 /ʌv/。片語 of course 通常弱讀 /əv/。")
    add("to-prep", "to", "prep", "toward", "T AH0", ["to"],
        "去；對", "到", "heoi3", ["to the gate", "nice to meet you"],
        "I am flying to Hong Kong.", "我飛去香港。",
        variants=["/tu/ strong", "/tɪ/ weak"],
        note="例句同多數句子弱讀 /tə/。單獨強調先至係 /tu/。")
    add("for-prep", "for", "prep", "intended-for", "F AO1 R", ["for"],
        "畀；為咗", "给；为了", "bei2", ["for you", "for two"],
        "Something for my wife.", "送俾我太太。",
        variants=["/fɚ/ weak"])
    add("in-prep", "in", "prep", "inside", "IH1 N", ["in"],
        "入面", "在…里", "jap6 min6", ["in Macau", "come in"],
        "I live in Macau.", "我住喺澳門。")
    add("on-prep", "on", "prep", "on-surface-or-time", "AA1 N", ["on"],
        "喺…上面；準時", "在…上", "hai2 soeng6 min6", ["on time"],
        "Your flight is on time.", "你嘅航班準時。")
    add("i-pron", "I", "pron", "first-person", "AY1", ["I"],
        "我", "我", "ngo5", ["I am", "I'm just looking"],
        "I'm just looking.", "我只係睇吓。",
        cmu="i")
    add("is-verb", "is", "verb", "be-3sg", "IH1 Z", ["is"],
        "係", "是", "hai6", ["this is", "my name is"],
        "This necklace is beautiful.", "呢條頸鏈好靚。")
    add("this-det", "this", "det", "near-thing", "DH IH1 S", ["this"],
        "呢個", "这个", "ni1 go3", ["this necklace", "this way"],
        "This necklace is beautiful.", "呢條頸鏈好靚。",
        note="美式 /ðɪs/。Free Dictionary 出現嘅 /ðəs/ 係紐西蘭音，唔教。")
    add("our-det", "our", "det", "belonging-to-us", "AW1 . ER0", ["our"],
        "我哋嘅", "我们的", "ngo5 dei6 ge3", ["our store"],
        "Welcome to our jewellery store.", "歡迎嚟到我哋嘅珠寶店。",
        variants=["/ɑɹ/ weak"],
        piper="Welcome to our [[dʒˈulɹi]] store.",
        join_syllables=True,
        note="小心讀係兩音節 /ˈaʊ.ɚ/。卡片唔拆做 ow、er。弱讀係 /ɑɹ/。")
    add("your-det", "your", "det", "belonging-to-you", "Y UH1 R", ["your"],
        "你嘅", "你的", "nei5 ge3", ["your passport", "your table"],
        "Here is your boarding pass.", "你張登機證喺度。",
        variants=["/jɔɹ/"],
        note="卡片用 CMU 第二條 /ˈjʊɹ/，同呢段音頻一致。CMU 第一條係 /jɔɹ/。")
    add("we-pron", "we", "pron", "first-plural", "W IY1", ["we"],
        "我哋", "我们", "ngo5 dei6", ["we have"], "We have a very nice ring.", "我哋有一隻好靚嘅戒指。")
    add("it-pron", "it", "pron", "thing", "IH1 T", ["it"],
        "佢（物件）", "它", "keoi5", ["see it", "it is"], "Would you like to see it?", "想唔想睇吓？")
    add("do-verb", "do", "verb", "auxiliary", "D UW1", ["do"],
        "做；有冇（問句）", "做", "zou6", ["do you have"],
        "Do you have a reservation?", "你有冇訂座？")
    add("yes-intj", "yes", "intj", "affirm", "Y EH1 S", ["yes"],
        "係／有", "是", "hai6", ["yes, please", "yes, thank you"],
        "Yes, thank you.", "好，多謝。")
    add("what-det", "what", "det", "which-thing", "W AH1 T", ["what"],
        "咩", "什么", "me1", ["what are you looking for"],
        "What are you looking for?", "你想搵咩？",
        variants=["/wɔt/", "/wɑt/"],
        note="CMU 主條係 /wʌt/。Wiktionary 美式亦列 /wɔt/、/wɑnt/ 一類元音。卡片跟 CMU /wʌt/。")
    add("where-adv", "where", "adv", "which-place", "W EH1 R", ["where"],
        "邊度", "哪里", "bin1 dou6", ["where are you flying"],
        "Where are you flying today?", "你今日飛去邊？")
    add("here-adv", "here", "adv", "this-place", "HH IY1 R", ["here"],
        "呢度", "这里", "ni1 dou6", ["here is", "over here"],
        "Here is my passport.", "我張護照喺度。",
        note="CMU 用 IY+R 記 NEAR 元音。教學 IPA 寫 /hɪr/。")
    add("just-adv", "just", "adv", "only", "JH AH1 S T", ["just"],
        "只係", "只是", "zi2 hai6", ["just looking"],
        "I'm just looking.", "我只係睇吓。")
    add("today-adv", "today", "adv", "this-day", "T AH0 . D EY1", ["to", "day"],
        "今日", "今天", "gam1 jat6", ["help you today"],
        "How may I help you today?", "今日有咩可以幫到你？")
    add("very-adv", "very", "adv", "intensifier", "V EH1 . R IY0", ["ver", "y"],
        "非常", "非常", "fei1 soeng4", ["very nice"],
        "We have a very nice ring.", "我哋有一隻好靚嘅戒指。",
        note="開頭係 /v/，下唇輕碰上排牙，唔好讀成 w。")
    add("have-verb", "have", "verb", "possess", "HH AE1 V", ["have"],
        "有", "有", "jau5", ["do you have", "we have"],
        "Do you have a reservation?", "你有冇訂座？",
        variants=["/əv/ unstressed"],
        note="重讀 /hæv/。弱讀可以係 /əv/，同 of 唔好撈亂。")
    add("would-verb", "would", "verb", "modal-polite", "W UH1 D", ["would"],
        "想唔想（客氣）", "愿意", "soeng2", ["would you like"],
        "Would you like to see it?", "想唔想睇吓？")
    add("like-verb", "like", "verb", "want-or-enjoy", "L AY1 K", ["like"],
        "想；鍾意", "想；喜欢", "soeng2", ["would you like"],
        "Would you like to see it?", "想唔想睇吓？")
    add("see-verb", "see", "verb", "look-at", "S IY1", ["see"],
        "睇", "看", "tai2", ["see it", "see your passport"],
        "Would you like to see it?", "想唔想睇吓？")
    add("want-verb", "want", "verb", "desire", "W AA1 N T", ["want"],
        "想要", "想要", "soeng2 jiu3", ["I want something"],
        "I want something for my wife.", "我想搵樣嘢送俾太太。",
        variants=["/wɔnt/"],
        note="CMU 主條 /wɑnt/。Wiktionary 美式亦有 /wɔnt/。卡片跟 CMU，音頻用同一個元音。",
        piper="I [[wˈɑnt]] something for my wife.")
    add("show-verb", "show", "verb", "let-see", "SH OW1", ["show"],
        "畀…睇", "给…看", "bei2 tai2", ["I'll show you", "show the pass"],
        "I'll show you a few.", "我畀你睇幾件。",
        note="開頭 /ʃ/，嘴唇稍圓，長噓氣。唔係 /tʃ/。")
    add("few-det", "few", "det", "small-number", "F Y UW1", ["few"],
        "幾件", "几个", "gei2 gin6", ["a few"], "I'll show you a few.", "我畀你睇幾件。")
    add("moment-noun", "moment", "noun", "short-time", "M OW1 . M AH0 N T", ["mo", "ment"],
        "一陣", "一会儿", "jat1 zan6", ["one moment"],
        "One moment, please.", "請等一陣。")
    add("one-num", "one", "num", "1", "W AH1 N", ["one"],
        "一", "一", "jat1", ["one moment"], "One moment, please.", "請等一陣。")
    add("two-num", "two", "num", "2", "T UW1", ["two"],
        "二；兩", "二", "loeng5", ["for two", "table for two"],
        "A table for two, please.", "兩位，唔該。",
        piper="[[ə ˈteɪbəl fɚ ˈtu]] , please.")
    add("love-verb", "love", "verb", "like-strongly", "L AH1 V", ["love"],
        "好想；鍾意", "很想", "hou2 soeng2", ["I'd love to"],
        "I'd love to see it.", "我好想睇。",
        variants=["/lʊv/"],
        note="美式引用音 /lʌv/。有人讀 /lʊv/，卡片跟 CMU。")
    add("come-verb", "come", "verb", "move-toward", "K AH1 M", ["come"],
        "嚟", "来", "lai4", ["come in", "come back"],
        "Please come in.", "請入嚟。",
        note="唔好讀成 /koʊm/。")
    add("look-verb", "look", "verb", "direct-eyes", "L UH1 K", ["look"],
        "睇", "看", "tai2", ["take a look", "look around"],
        "Please take a look.", "請慢慢睇。")
    add("looking-verb", "looking", "verb", "seeking", "L UH1 K . IH0 NG", ["look", "ing"],
        "搵緊；睇緊", "正在找", "wan2 gan2", ["just looking", "looking for"],
        "I'm just looking.", "我只係睇吓。")
    add("may-verb", "may", "verb", "modal-permission", "M EY1", ["may"],
        "可以（客氣）", "可以", "ho2 ji5", ["how may I", "may I see"],
        "How may I help you?", "有咩可以幫到你？")
    add("help-verb", "help", "verb", "assist", "HH EH1 L P", ["help"],
        "幫", "帮", "bong1", ["help you", "may I help"],
        "How may I help you today?", "今日有咩可以幫到你？",
        note="尾音 /p/ 要收住，唔好吞咗。")
    add("know-verb", "know", "verb", "be-aware", "N OW1", ["know"],
        "知道", "知道", "zi1 dou6", ["let me know"],
        "Let me know if you need anything.", "有需要就話我知。",
        note="k 唔發音。")
    add("let-verb", "let", "verb", "allow", "L EH1 T", ["let"],
        "讓", "让", "joeng6", ["let me know"],
        "Let me know.", "話我知。")
    add("need-verb", "need", "verb", "require", "N IY1 D", ["need"],
        "需要", "需要", "seoi1 jiu3", ["if you need"],
        "Let me know if you need anything.", "有需要就話我知。")
    add("if-conj", "if", "conj", "condition", "IH1 F", ["if"],
        "如果", "如果", "jyu4 gwo2", ["if you need"],
        "Let me know if you need anything.", "有需要就話我知。")
    add("anything-pron", "anything", "pron", "any-thing", "EH1 . N IY0 . TH IH2 NG", ["an", "y", "thing"],
        "任何嘢", "任何东西", "jam6 ho4 je5", ["anything else", "need anything"],
        "Let me know if you need anything.", "有需要就話我知。",
        note="中間有 /θ/。")
    add("something-pron", "something", "pron", "some-thing", "S AH1 M . TH IH0 NG", ["some", "thing"],
        "某樣嘢", "某样东西", "mau5 joeng6 je5", ["something for my wife"],
        "I want something for my wife.", "我想搵樣嘢送俾太太。",
        note="中間有 /θ/。")
    add("course-noun", "course", "noun", "of-course", "K AO1 R S", ["course"],
        "當然（of course）", "当然", "dong1 jin4", ["of course"],
        "Of course.", "當然。",
        piper="[[əv kˈɔɹs.]]")
    add("store-noun", "store", "noun", "shop", "S T AO1 R", ["store"],
        "店", "店", "dim3", ["jewellery store"],
        "Welcome to our jewellery store.", "歡迎嚟到我哋嘅珠寶店。",
        piper="Welcome to our [[dʒˈulɹi]] store.")
    add("jewellery-noun", "jewellery", "noun", "ornaments", "JH UW1 L . R IY0", ["jewel", "ry"],
        "珠寶（英式串法）", "珠宝", "zyu1 bou2", ["jewellery store"],
        "Welcome to our jewellery store.", "歡迎嚟到我哋嘅珠寶店。",
        cmu="jewelry",
        variants=["/ˈdʒu.əl.ɹi/"],
        piper="Welcome to our [[dʒˈulɹi]] store.",
        note="教學用兩音節 /ˈdʒul.ɹi/。錄音強制 [[dʒˈulɹi]]，唔會讀出中間嘅 ə。三音節 /ˈdʒu.əl.ɹi/ 只係備註。澳門店面常見串法係 jewellery。")
    add("jewelry-noun", "jewelry", "noun", "ornaments-us-spelling", "JH UW1 L . R IY0", ["jewel", "ry"],
        "珠寶（美式串法）", "珠宝", "zyu1 bou2", ["jewelry store"],
        "Jewelry and jewellery sound the same.", "兩種串法讀音一樣。",
        variants=["/ˈdʒu.əl.ɹi/"],
        piper="[[dʒˈulɹi]] and [[dʒˈulɹi]] sound the same.",
        note="同 jewellery 一樣，教學同錄音都係兩音節 /ˈdʒul.ɹi/。")
    add("necklace-noun", "necklace", "noun", "neck-jewel", "N EH1 K . L AH0 S", ["neck", "lace"],
        "頸鏈", "项链", "geng2 lin2", ["this necklace"],
        "This necklace is beautiful.", "呢條頸鏈好靚。")
    add("beautiful-adj", "beautiful", "adj", "lovely", "B Y UW1 . T AH0 . F AH0 L", ["beau", "ti", "ful"],
        "好靚", "漂亮", "hou2 leng3", ["is beautiful"],
        "This necklace is beautiful.", "呢條頸鏈好靚。")
    add("certainly-adv", "certainly", "adv", "of-course", "S ER1 . T AH0 N . L IY0", ["cer", "tain", "ly"],
        "當然可以", "当然", "dong1 jin4", ["certainly, take a look"],
        "Certainly. Please take a look.", "當然。請慢慢睇。")
    add("browsing-verb", "browsing", "verb", "looking-casually", "B R AW1 . Z IH0 NG", ["brows", "ing"],
        "隨便睇", "随便看看", "ceoi4 bin6 tai2", ["just browsing"],
        "I'm just browsing.", "我隨便睇吓。")
    add("enjoy-verb", "enjoy", "verb", "take-pleasure", "IH0 N . JH OY1", ["en", "joy"],
        "慢慢享受", "享受", "him2 sau6", ["enjoy your look"],
        "Enjoy the store.", "慢慢睇。",
        variants=["/ˌɛnˈdʒɔɪ/"],
        note="CMU 兩條：EH2 N JH OY1 同 IH0 N JH OY1。卡片用後者，貼近 Wiktionary /ɪnˈdʒɔɪ/。")
    add("around-adv", "around", "adv", "in-the-area", "ER0 . AW1 N D", ["a", "round"],
        "周圍", "周围", "zau1 wai4", ["look around"],
        "Please take a look around.", "請周圍睇吓。")
    add("silver-noun", "silver", "noun", "metal", "S IH1 L . V ER0", ["sil", "ver"],
        "銀", "银", "ngan4", ["a silver ring"],
        "I'm looking for a silver ring.", "我想搵一隻銀戒指。",
        note="中間 /v/。")
    add("ring-noun", "ring", "noun", "finger-jewel", "R IH1 NG", ["ring"],
        "戒指", "戒指", "gaai3 zi2", ["a silver ring"],
        "I'm looking for a silver ring.", "我想搵一隻銀戒指。",
        note="尾音 /ŋ/，同 n 唔同。")
    add("watch-noun", "watch", "noun", "wrist-watch", "W AA1 CH", ["watch"],
        "手錶", "手表", "sau2 biu1", ["a watch"],
        "A watch and a ring.", "一隻手錶同一隻戒指。",
        note="開頭 /w/，尾音 /tʃ/。")
    add("wife-noun", "wife", "noun", "spouse", "W AY1 F", ["wife"],
        "太太", "太太", "taai3 taai2", ["for my wife"],
        "Something for my wife.", "送俾我太太。")
    add("wine-noun", "wine", "noun", "drink", "W AY1 N", ["wine"],
        "酒（葡萄酒）", "葡萄酒", "zau2", ["a glass of wine"],
        "Wine starts with /w/.", "Wine 開頭係圓唇 /w/。",
        piper="[[wˈaɪn]]")
    add("vine-noun", "vine", "noun", "plant", "V AY1 N", ["vine"],
        "藤", "藤", "tang4", ["a vine"],
        "Vine starts with /v/.", "Vine 開頭係咬唇 /v/。",
        piper="[[vˈaɪn]]")
    add("west-noun", "west", "noun", "direction", "W EH1 S T", ["west"],
        "西", "西", "sai1", ["the west"], "West starts with /w/.", "West 開頭係 /w/。",
        piper="[[wˈɛst]]")
    add("vest-noun", "vest", "noun", "clothing", "V EH1 S T", ["vest"],
        "背心", "背心", "bui3 sam1", ["a vest"], "Vest starts with /v/.", "Vest 開頭係 /v/。",
        piper="[[vˈɛst]]")
    add("flying-verb", "flying", "verb", "travel-by-air", "F L AY1 . IH0 NG", ["fly", "ing"],
        "飛（緊）", "飞", "fei1", ["where are you flying"],
        "Where are you flying today?", "你今日飛去邊？")
    add("passport-noun", "passport", "noun", "travel-document", "P AE1 S . P AO2 R T", ["pass", "port"],
        "護照", "护照", "wu6 ziu3", ["my passport", "see your passport"],
        "Here is my passport.", "我張護照喺度。")
    add("window-noun", "window", "noun", "window", "W IH1 N . D OW0", ["win", "dow"],
        "窗", "窗", "coeng1", ["window seat", "by the window"],
        "A window seat, please.", "要靠窗位，唔該。")
    add("aisle-noun", "aisle", "noun", "passage-seat", "AY1 L", ["aisle"],
        "通道位", "过道", "tung1 dou6 wai2", ["window or aisle"],
        "Window or aisle?", "靠窗定係通道？",
        note="s 唔發音。讀 /aɪl/。")
    add("boarding-noun", "boarding", "noun", "getting-on", "B AO1 R . D IH0 NG", ["board", "ing"],
        "登機", "登机", "dang1 gei1", ["boarding pass"],
        "Here is your boarding pass.", "你張登機證喺度。")
    add("pass-noun", "pass", "noun", "permit-card", "P AE1 S", ["pass"],
        "證；通行證", "证", "zing3", ["boarding pass"],
        "Here is your boarding pass.", "你張登機證喺度。")
    add("flight-noun", "flight", "noun", "trip-by-air", "F L AY1 T", ["flight"],
        "航班", "航班", "hong4 baan1", ["your flight", "on time"],
        "Your flight is on time.", "你嘅航班準時。")
    add("time-noun", "time", "noun", "clock-time", "T AY1 M", ["time"],
        "時間", "时间", "si4 gaan3", ["on time"],
        "Your flight is on time.", "你嘅航班準時。")
    add("gate-noun", "gate", "noun", "airport-gate", "G EY1 T", ["gate"],
        "閘口", "登机口", "zaap6 hau2", ["the gate"],
        "Please go to the gate.", "請去閘口。")
    add("check-verb", "check", "verb", "check-in", "CH EH1 K", ["check"],
        "辦理（登機）", "办理", "baan6 lei5", ["check in"],
        "We check in at the desk.", "我哋喺櫃檯辦登機。",
        note="開頭係 /tʃ/，唔係 /ʃ/。check-in 唔好教成 sh。")
    add("sure-adj", "sure", "adj", "certain", "SH UH1 R", ["sure"],
        "好，冇問題", "当然", "hou2", ["sure, here it is"],
        "Sure. Here is your boarding pass.", "好。你張登機證喺度。",
        variants=["/ʃɔr/ pour-poor merger"],
        note="CMU /ʃʊr/。有人同 shore 合併讀 /ʃɔr/。卡片教 /ʃʊr/，兩種都係美式。")
    add("information-noun", "information", "noun", "facts", "IH2 N . F ER0 . M EY1 . SH AH0 N", ["in", "for", "ma", "tion"],
        "資料", "信息", "zi1 liu2", ["gate information"],
        "I'll show you the information.", "我畀你睇吓資料。",
        note="有 /ʃ/，係 -tion 尾。")
    add("ticket-noun", "ticket", "noun", "ticket", "T IH1 K . AH0 T", ["tick", "et"],
        "機票", "票", "gei1 piu3", ["a ticket"],
        "Here is the ticket.", "機票喺度。")
    add("luggage-noun", "luggage", "noun", "bags", "L AH1 G . AH0 JH", ["lug", "gage"],
        "行李", "行李", "hang4 lei5", ["your luggage"],
        "Your luggage is here.", "你嘅行李喺度。")
    add("reservation-noun", "reservation", "noun", "booking", "R EH2 . Z ER0 . V EY1 . SH AH0 N", ["res", "er", "va", "tion"],
        "訂座", "预订", "deng6 zo6", ["have a reservation"],
        "Do you have a reservation?", "你有冇訂座？",
        note="開頭 /r/。有 /ʃ/。")
    add("table-noun", "table", "noun", "dining-table", "T EY1 . B AH0 L", ["ta", "ble"],
        "檯", "桌子", "toi2", ["a table for two", "your table"],
        "A table for two, please.", "兩位，唔該。",
        piper="[[ə ˈteɪbəl fɚ ˈtu]] , please.",
        note="table 本身冇 /r/。今課嘅 /r/ 喺 right、reservation、ready。")
    add("right-adv", "right", "adv", "exactly-or-direction", "R AY1 T", ["right"],
        "就係咁；右邊", "就；右边", "zau6", ["right this way"],
        "Right this way.", "請跟我嚟。",
        note="美式 /r/：舌尖向上後方卷，唔好掂到上顎，亦唔好變 l。")
    add("way-noun", "way", "noun", "route", "W EY1", ["way"],
        "方向；路", "路", "lou6", ["this way"],
        "Right this way.", "請跟我嚟。")
    add("great-adj", "great", "adj", "excellent", "G R EY1 T", ["great"],
        "好極", "很好", "hou2 gik6", ["this is great"],
        "This is great.", "好好。",
        note="開頭有 /r/。")
    add("bring-verb", "bring", "verb", "carry-here", "B R IH1 NG", ["bring"],
        "攞嚟", "拿来", "lo2 lai4", ["bring the menu"],
        "I'll bring the menu.", "我攞餐牌嚟。")
    add("menu-noun", "menu", "noun", "list-of-dishes", "M EH1 N . Y UW0", ["men", "u"],
        "餐牌", "菜单", "caan1 paai4", ["the menu"],
        "I'll bring the menu.", "我攞餐牌嚟。")
    add("ready-adj", "ready", "adj", "prepared", "R EH1 . D IY0", ["rea", "dy"],
        "準備好", "准备好", "zeon2 bei6 hou2", ["are you ready"],
        "Are you ready?", "你準備好未？")
    add("red-adj", "red", "adj", "color", "R EH1 D", ["red"],
        "紅色", "红色", "hung4 sik1", ["red wine"],
        "The seat is red.", "張凳係紅色。",
        note="同 read（過去）同音，意思唔同。")
    add("led-verb", "led", "verb", "past-of-lead", "L EH1 D", ["led"],
        "帶領（過去）", "带领（过去）", "daai3 ling5", ["led the way"],
        "She led the way.", "佢帶咗路。")
    add("by-prep", "by", "prep", "near", "B AY1", ["by"],
        "喺…旁邊", "在…旁边", "hai2 pang4 bin1", ["by the window"],
        "A table by the window.", "靠窗嗰張檯。")
    add("back-adv", "back", "adv", "return", "B AE1 K", ["back"],
        "返嚟", "回来", "faan1 lai4", ["come back"],
        "Please come back.", "歡迎再嚟。")
    add("take-verb", "take", "verb", "accept-or-do", "T EY1 K", ["take"],
        "要；帶", "拿；要", "jiu3", ["take a look", "take a seat"],
        "Please take a look.", "請慢慢睇。")
    add("seat-verb", "seat", "verb", "give-a-seat", "S IY1 T", ["seat"],
        "安排坐低", "安排就座", "on1 paai4 co5", ["seat the guest"],
        "We can seat you now.", "而家可以安排你坐。",
        note="同 seat 名詞同音。")
    add("soft-adj", "soft", "adj", "gentle", "S AA1 F T", ["soft"],
        "輕；軟", "轻柔", "heng1", ["a soft sound"],
        "The first sound is soft.", "第一個音好輕。",
        variants=["/sɔft/"],
        note="CMU 主條 /sɑft/，另收 /sɔft/。卡片跟主條。",
        piper="The first sound is [[sˈɑft]].")
    add("with-prep", "with", "prep", "accompanying", "W IH1 DH", ["with"],
        "同；帶住", "和；带着", "tung4", ["with you", "with a smile"],
        "I'll go with you.", "我同你一齊去。",
        variants=["/wɪθ/"],
        note="CMU 主條同 Wiktionary 都係 /wɪð/。/wɪθ/ 係真實但較少嘅尾音變體。J1 會特別練 /wɪθ/，並且標明係變體。")
    add("with-prep-voiceless", "with", "prep", "voiceless-variant", "W IH1 TH", ["with"],
        "同（清音變體 /wɪθ/）", "和（清音）", "tung4", ["with you"],
        "With you.", "同你。",
        piper="[[wˈɪθ]] you.",
        note="呢張卡只練清音變體，唔係唯一標準音。主卡係 with-prep /wɪð/。")
    add("sank-verb", "sank", "verb", "past-of-sink", "S AE1 NG K", ["sank"],
        "沉咗（對比 thank）", "下沉（过去）", "cam4", ["the boat sank"],
        "The boat sank.", "艘船沉咗。",
        note="對比組。唔好用嚟代替 thank。")
    add("tank-noun", "tank", "noun", "container", "T AE1 NG K", ["tank"],
        "箱；缸", "箱", "soeng1", ["a water tank"],
        "A water tank.", "一個水缸。")
    add("think-verb", "think", "verb", "have-opinion", "TH IH1 NG K", ["think"],
        "諗", "想", "nam2", ["I think"], "I think so.", "我諗係。")
    add("sink-noun", "sink", "noun", "basin", "S IH1 NG K", ["sink"],
        "洗碗盆", "水槽", "sai2 wun2 pun4", ["the sink"], "The sink is full.", "洗碗盆滿咗。")
    add("three-num", "three", "num", "3", "TH R IY1", ["three"],
        "三", "三", "saam1", ["table for three"], "A table for three.", "三位。",
        note="係 /θ/，唔係 /f/。")
    add("tree-noun", "tree", "noun", "plant", "T R IY1", ["tree"],
        "樹", "树", "syu6", ["a tree"], "A tree by the door.", "門口有棵樹。")
    add("sheet-noun", "sheet", "noun", "paper", "SH IY1 T", ["sheet"],
        "一張紙", "一张纸", "jat1 zoeng1 zi2", ["a sheet of paper"],
        "A sheet of paper.", "一張紙。")
    add("cheat-verb", "cheat", "verb", "deceive", "CH IY1 T", ["cheat"],
        "呃（對比 sheet）", "欺骗", "ngaak1", ["don't cheat"],
        "Don't cheat.", "唔好呃。",
        note="對比組：/tʃ/ 對 /ʃ/。")
    add("shoe-noun", "shoe", "noun", "footwear", "SH UW1", ["shoe"],
        "鞋", "鞋", "haai4", ["a shoe"], "A new shoe.", "一對新鞋。")
    add("chew-verb", "chew", "verb", "masticate", "CH UW1", ["chew"],
        "嚼", "嚼", "zoek3", ["chew slowly"], "Chew slowly.", "慢慢嚼。")
    add("me-pron", "me", "pron", "object-me", "M IY1", ["me"],
        "我（賓語）", "我", "ngo5", ["let me know", "show me"],
        "Let me know.", "話我知。")
    add("go-verb", "go", "verb", "move", "G OW1", ["go"],
        "去", "去", "heoi3", ["go to the gate"], "Please go to the gate.", "請去閘口。")
    add("or-conj", "or", "conj", "alternative", "AO1 R", ["or"],
        "或者", "或者", "waak6 ze2", ["window or aisle"],
        "Window or aisle?", "靠窗定係通道？")
    add("free-adj", "free", "adj", "available", "F R IY1", ["free"],
        "空嘅；仲有位", "空着", "hung1", ["the seat is free"],
        "The aisle seat is free.", "通道位仲有。",
        note="呢度係座位仲有，唔係免費。")

    # phrases
    add("thank-you-phrase", "thank you", "phrase", "thanks", "TH AE1 NG K | Y UW1", ["thank", "you"],
        "多謝", "谢谢", "do1 ze6", ["thank you so much"],
        "Thank you.", "多謝。", phrase=True)
    add("of-course-phrase", "of course", "phrase", "yes-politely", "AH0 V | K AO1 R S", ["of", "course"],
        "當然", "当然", "dong1 jin4", ["of course, take a look"],
        "Of course.", "當然。", phrase=True,
        piper="[[əv kˈɔɹs.]]",
        note="of 喺呢度弱讀 /əv/。錄音用同一個弱讀，唔係單獨唸 of 嗰個 /ʌv/。")
    add("good-morning-phrase", "good morning", "phrase", "morning-greeting", "G UH1 D | M AO1 R . N IH0 NG", ["good", "mor", "ning"],
        "早晨", "早上好", "zou2 san4", ["good morning, Mei"],
        "Good morning.", "早晨。", phrase=True)
    add("nice-to-meet-phrase", "nice to meet you", "phrase", "introduction", "N AY1 S | T AH0 | M IY1 T | Y UW1", ["nice", "to", "meet", "you"],
        "認識你真好", "很高兴认识你", "jing6 sik1 nei5", ["nice to meet you too"],
        "Nice to meet you.", "認識你真好。", phrase=True,
        note="to 弱讀 /tə/。")
    add("just-looking-phrase", "just looking", "phrase", "not-buying-yet", "JH AH1 S T | L UH1 K . IH0 NG", ["just", "look", "ing"],
        "只係睇吓", "只是看看", "zi2 hai6 tai2 haa5", ["I'm just looking"],
        "I'm just looking.", "我只係睇吓。", phrase=True)
    add("how-may-i-phrase", "how may I help you", "phrase", "offer-help", "HH AW1 | M EY1 | AY1 | HH EH1 L P | Y UW1", ["how", "may", "I", "help", "you"],
        "有咩可以幫到你", "有什么可以帮你", "jau5 me1 ho2 ji5 bong1 dou2 nei5", ["how may I help you today"],
        "How may I help you?", "有咩可以幫到你？", phrase=True)
    add("boarding-pass-phrase", "boarding pass", "phrase", "boarding-document", "B AO1 R . D IH0 NG | P AE1 S", ["board", "ing", "pass"],
        "登機證", "登机牌", "dang1 gei1 zing3", ["your boarding pass"],
        "Here is your boarding pass.", "你張登機證喺度。", phrase=True)
    add("window-seat-phrase", "window seat", "phrase", "seat-by-window", "W IH1 N . D OW0 | S IY1 T", ["win", "dow", "seat"],
        "靠窗位", "靠窗座位", "kaau3 coeng1 wai2", ["a window seat please"],
        "A window seat, please.", "要靠窗位，唔該。", phrase=True)
    add("table-for-two-phrase", "a table for two", "phrase", "party-of-two", "AH0 | T EY1 . B AH0 L | F ER0 | T UW1", ["a", "ta", "ble", "for", "two"],
        "兩位", "两位", "loeng5 wai2", ["a table for two please"],
        "A table for two, please.", "兩位，唔該。", phrase=True,
        piper="[[ə ˈteɪbəl fɚ ˈtu]] , please.",
        note="a 弱讀 /ə/，for 弱讀 /fɚ/。錄音用呢兩個弱讀。")
    add("check-in-noun", "check-in", "noun", "airport-desk", "CH EH1 K | IH1 N", ["check", "in"],
        "辦理登機", "办理登机", "baan6 lei5 dang1 gei1", ["at check-in"],
        "We are at check-in.", "我哋喺登機櫃檯。", phrase=True,
        note="check 係 /tʃɛk/，in 係 /ɪn/。成個詞冇 /ʃ/。")
    add("right-this-way-phrase", "right this way", "phrase", "follow-me", "R AY1 T | DH IH1 S | W EY1", ["right", "this", "way"],
        "請跟我嚟", "请这边走", "cing2 gan1 ngo5 lai4", ["right this way please"],
        "Right this way.", "請跟我嚟。", phrase=True)
    add("let-me-know-phrase", "let me know", "phrase", "tell-me", "L EH1 T | M IY1 | N OW1", ["let", "me", "know"],
        "話我知", "告诉我", "waa6 ngo5 zi1", ["let me know if you need anything"],
        "Let me know.", "話我知。", phrase=True)


def verify(cmu: dict[str, list[str]]) -> None:
    for item in ITEMS:
        if item["phrase"]:
            continue
        lemma = item["cmuLemma"]
        options = cmu.get(lemma)
        if not options:
            raise SystemExit(f"CMU missing {item['id']} lemma={lemma}")
        if item["arpabet"] not in options:
            raise SystemExit(
                f"ARPAbet not in CMU for {item['id']}: {item['arpabet']}\n  options: {options}"
            )


FLAGS = [
    {
        "id": "with-prep",
        "lemma": "with",
        "pos": "prep",
        "cmudict": ["W IH1 DH /wɪð/", "W IH1 TH /wɪθ/", "W IH0 TH", "W IH0 DH"],
        "wiktionary": ["/wɪð/ primary", "/wɪθ/ rarely, preconsonantal or final"],
        "freeDictionary": "phonetics empty in the 2026-10-29 API payload; not used",
        "disagreement": "Sources agree both exist, but they rank the primary differently in casual teaching materials. CMU's first entry and Wiktionary's main GA form are voiced /wɪð/.",
        "resolution": "The word card teaches /wɪð/. A separate drill card with-prep-voiceless teaches /wɪθ/ and is labelled as the less common final variant, because J1's sound focus is /θ/. This is not a silent pick.",
        "resolved": True,
        "taughtIpa": "/wɪð/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "sure-adj",
        "lemma": "sure",
        "pos": "adj",
        "cmudict": ["SH UH1 R /ʃʊr/"],
        "wiktionary": ["/ʃʊə/ non-pour-poor", "/ʃɔː/ pour-poor merger", "GA often /ʃʊr/ or /ʃɔr/"],
        "freeDictionary": ["/ʃɔɹ/", "/ʃɔː/", "/ʃoː/"],
        "disagreement": "CMU has only /ʃʊr/. Free Dictionary's US audio line is /ʃɔɹ/, the pour-poor merger.",
        "resolution": "Teach /ʃʊr/ to match CMUdict and Piper en-us. The card notes /ʃɔr/ as an accepted US merger variant. Audio is the /ʃʊr/ form.",
        "resolved": True,
        "taughtIpa": "/ʃʊr/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "want-verb",
        "lemma": "want",
        "pos": "verb",
        "cmudict": ["W AA1 N T /wɑnt/", "W AO1 N T /wɔnt/"],
        "wiktionary": ["US /wɑnt/, /wʌnt/, /wɔnt/"],
        "freeDictionary": ["/wɔnt/", "/wɑnt/", "/wɒnt/"],
        "disagreement": "Primary vowel is not unique across US sources.",
        "resolution": "Teach CMU's first entry /wɑnt/, which Wiktionary and Free Dictionary also list. Audio is phoneme-forced to /wɑnt/ so it matches the card. /wɔnt/ stays as a labelled variant.",
        "resolved": True,
        "taughtIpa": "/wɑnt/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "hello-intj",
        "lemma": "hello",
        "pos": "intj",
        "cmudict": ["HH AH0 L OW1 /həˈloʊ/", "HH EH0 L OW1 /hɛˈloʊ/"],
        "wiktionary": ["GA /hɛˈloʊ/, /həˈloʊ/, /ˈhɛloʊ/"],
        "freeDictionary": "HTTP 404 on 2026-10-29; Wiktionary used instead",
        "disagreement": "Both /hə/ and /hɛ/ onsets are standard. Rank differs.",
        "resolution": "Teach CMU's first entry /həˈloʊ/. Card lists /hɛˈloʊ/ as a variant.",
        "resolved": True,
        "taughtIpa": "/həˈloʊ/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "here-adv",
        "lemma": "here",
        "pos": "adv",
        "cmudict": ["HH IY1 R"],
        "wiktionary": ["GA commonly /hɪr/"],
        "freeDictionary": ["/hiːɹ/", "/hɪɹ/"],
        "disagreement": "CMU writes the NEAR vowel as IY, so a naive map is /hir/. Learner dictionaries usually write /hɪr/.",
        "resolution": "Display /hɪr/. The converter treats IY immediately before R as the NEAR vowel. This matches Free Dictionary's /hɪɹ/ and does not invent a second sense.",
        "resolved": True,
        "taughtIpa": "/hɪr/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "soft-adj",
        "lemma": "soft",
        "pos": "adj",
        "cmudict": ["S AA1 F T /sɑft/", "S AO1 F T /sɔft/"],
        "wiktionary": ["both /sɑft/ and /sɔft/ are US"],
        "freeDictionary": ["/sɑft/", "/sɔft/", "/sɒft/"],
        "disagreement": "Two US vowels.",
        "resolution": "Teach CMU's first entry /sɑft/. Audio forced to /sɑft/. /sɔft/ noted as a variant. British /sɒft/ is not taught.",
        "resolved": True,
        "taughtIpa": "/sɑft/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "smile-verb",
        "lemma": "smile",
        "pos": "verb",
        "cmudict": ["S M AY1 L /smaɪl/"],
        "wiktionary": ["/smaɪl/", "/ˈsmaɪ.əl/"],
        "freeDictionary": ["/ˈsmaɪ.əl/"],
        "disagreement": "Free Dictionary returned only the two-syllable variant. CMU and Wiktionary's first form are one syllable.",
        "resolution": "Teach one-syllable /smaɪl/. The two-syllable form is noted, not used for audio.",
        "resolved": True,
        "taughtIpa": "/smaɪl/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "the-art",
        "lemma": "the",
        "pos": "art",
        "cmudict": ["DH AH0 /ðə/", "DH AH1", "DH IY0 /ði/"],
        "wiktionary": ["/ðə/ before consonants", "/ði/ before vowels", "/ðiː/ strong"],
        "freeDictionary": "API payload missed the article and showed only /ði/",
        "disagreement": "Not a real US disagreement. The API record was incomplete.",
        "resolution": "Two cards: the-art /ðə/ before consonants, the-art-vowel /ði/ before vowels. Strong /ðiː/ noted. The before-vowel clip is [[ðˈi]] aisle seat is free. A leading orthographic The made Piper say /ðə/ and then /ði/.",
        "resolved": True,
        "taughtIpa": "/ðə/ and /ði/",
        "resolvedBy": "round-2 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "this-det",
        "lemma": "this",
        "pos": "det",
        "cmudict": ["DH IH1 S /ðɪs/"],
        "wiktionary": ["/ðɪs/", "/ðəs/ New Zealand only"],
        "freeDictionary": ["/ðəs/"],
        "disagreement": "Free Dictionary returned the NZ vowel. US sources agree on /ðɪs/.",
        "resolution": "Teach /ðɪs/ only. Do not teach /ðəs/.",
        "resolved": True,
        "taughtIpa": "/ðɪs/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "wind-noun",
        "lemma": "wind",
        "pos": "noun",
        "cmudict": ["W IH1 N D noun-compatible", "W AY1 N D verb"],
        "wiktionary": ["noun /wɪnd/ GA", "verb /waɪnd/"],
        "freeDictionary": "API returned only /waɪnd/",
        "disagreement": "API missed the noun. CMUdict and Wiktionary agree on the split.",
        "resolution": "wind-noun /wɪnd/ with carrier 'The wind is strong tonight.' wind-verb /waɪnd/ with carrier 'Wind the clock tonight.' Audio is phoneme-forced so the sense cannot flip.",
        "resolved": True,
        "taughtIpa": "/wɪnd/ noun, /waɪnd/ verb",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
    {
        "id": "jewellery-noun",
        "lemma": "jewellery",
        "pos": "noun",
        "cmudict": ["no jewellery spelling", "jewelry JH UW1 L R IY0 and JH UW1 AH0 L R IY0"],
        "wiktionary": ["/ˈdʒuː(ə)lri/ for both spellings"],
        "freeDictionary": "jewellery /ˈdʒuːlri/; jewelry phonetics empty",
        "disagreement": "Spelling gap in CMUdict, not a sound conflict.",
        "resolution": "Map jewellery to CMU jewelry's two-syllable entry JH UW1 L R IY0. The card teaches /ˈdʒul.ɹi/. Piper's default reading of the spelling is the three-syllable variant, so every teaching clip is phoneme-forced to [[dʒˈulɹi]]. The three-syllable /ˈdʒu.əl.ɹi/ stays a noted variant and is not what the mp3 says.",
        "resolved": True,
        "taughtIpa": "/ˈdʒul.ɹi/",
        "resolvedBy": "round-1 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "your-det",
        "lemma": "your",
        "pos": "det",
        "cmudict": ["Y AO1 R /jɔɹ/ first", "Y UH1 R /jʊɹ/ second"],
        "wiktionary": ["/jɔːɹ/", "/jʊɹ/", "/jɚ/"],
        "freeDictionary": "CMUdict is the US source for this pair",
        "disagreement": "CMU's first entry is /jɔɹ/. The shipped clip says /jʊɹ/.",
        "resolution": "Keep the headword at Y UH1 R /ˈjʊɹ/ so the card matches the existing mp3. List CMU's first entry /jɔɹ/ as a variant. Not a silent drop.",
        "resolved": True,
        "taughtIpa": "/ˈjʊɹ/",
        "resolvedBy": "round-1 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "to-prep",
        "lemma": "to",
        "pos": "prep",
        "cmudict": ["T UW1 /tu/", "T IH0 /tɪ/", "T AH0 /tə/"],
        "wiktionary": ["strong /tu/", "weak /tə/", "weak /tɪ/"],
        "freeDictionary": "CMUdict lists all three",
        "disagreement": "The citation form is /tu/. The only shipped clip, 'I am flying to Hong Kong,' is the weak /tə/.",
        "resolution": "The headword is weak /tə/ (CMU T AH0, stress 0) so the example button matches the mp3. Strong /tu/ and weak /tɪ/ are variants. The sentence was not re-forced to a stressed [[tˈu]].",
        "resolved": True,
        "taughtIpa": "/tə/",
        "resolvedBy": "round-1 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "check-verb",
        "lemma": "check",
        "pos": "verb",
        "cmudict": ["CH EH1 K /tʃɛk/"],
        "wiktionary": ["/tʃɛk/"],
        "freeDictionary": ["/tʃɛk/"],
        "disagreement": "None. Recorded because the lesson brief names /ʃ/ next to check-in, and that would be the wrong phoneme.",
        "resolution": "check-in is taught as /ˈtʃɛk ɪn/. The /ʃ/ drill uses sure, show, information, sheet. Learners are told check is /tʃ/, not /ʃ/.",
        "resolved": True,
        "taughtIpa": "/tʃɛk/",
        "resolvedBy": "night-1 lexicographer",
        "resolvedAt": "2026-10-29",
    },
]


def line(lid: str, speaker: str, label: str, text: str, gloss: str, piper: str | None = None) -> dict:
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


def lesson_shell(**kwargs) -> dict:
    return kwargs


def build_lessons() -> list[dict]:
    f1 = [
        line("f1-l1", "mei", "Mei", "Hello. Let's begin with a slow breath.", "你好。我哋由一個慢呼吸開始。"),
        line("f1-l2", "mei", "Mei", "Listen. Ship is short. Sheep is long.", "聽住。Ship 係短音。Sheep 係長音。"),
        line("f1-l3", "mei", "Mei", "Keep it light. This sound is short.", "輕輕帶過。呢個音好短。"),
        line("f1-l4", "mei", "Mei", "About. The first sound is soft.", "About。第一個音好輕。"),
        line("f1-l5", "mei", "Mei", "Relax. Say it again, nice and slow.", "放鬆。再講一次，慢慢嚟。"),
    ]
    f2 = [
        line("f2-l1", "mei", "Mei", "Good morning. My name is Mei.", "早晨。我叫 Mei。"),
        line("f2-l2", "ling", "Ling", "Good morning. My name is Ling.", "早晨。我叫 Ling。"),
        line("f2-l3", "mei", "Mei", "Nice to meet you.", "認識你真好。"),
        line("f2-l4", "ling", "Ling", "Nice to meet you, too. Thank you.", "我都好高興認識你。多謝。"),
        line("f2-l5", "mei", "Mei", "Hi. Please say it again.", "嗨。請再講一次。"),
    ]
    j1 = [
        line("j1-l1", "mei", "Mei", "Welcome to our jewellery store. How may I help you today?", "歡迎嚟到我哋嘅珠寶店。今日有咩可以幫到你？", "Welcome to our [[dʒˈulɹi]] store. How may I help you today?"),
        line("j1-l2", "tom", "Tom", "Hi. I'm just looking, thank you.", "嗨。我只係睇吓，多謝。"),
        line("j1-l3", "mei", "Mei", "Of course. Please take a look around.", "當然。請周圍慢慢睇。", "[[əv kˈɔɹs.]] Please take a look around."),
        line("j1-l4", "tom", "Tom", "This necklace is beautiful.", "呢條頸鏈好靚。"),
        line("j1-l5", "mei", "Mei", "Thank you. Let me know if you need anything.", "多謝。有需要就話我知。"),
    ]
    j2 = [
        line("j2-l1", "mei", "Mei", "What are you looking for today?", "你今日想搵咩？"),
        line("j2-l2", "tom", "Tom", "I'm looking for a silver ring.", "我想搵一隻銀戒指。"),
        line("j2-l3", "mei", "Mei", "We have a very nice ring. Would you like to see it?", "我哋有一隻好靚嘅戒指。想唔想睇吓？"),
        line("j2-l4", "tom", "Tom", "Yes. I want something for my wife.", "好。我想搵樣嘢送俾太太。"),
        line("j2-l5", "mei", "Mei", "Of course. I'll show you a few.", "當然。我畀你睇幾件。", "[[əv kˈɔɹs.]] I'll show you a few."),
    ]
    t1 = [
        line("t1-l1", "kai", "Kai", "Good afternoon. Where are you flying today?", "午安。你今日飛去邊？"),
        line("t1-l2", "ling", "Ling", "I'm flying to Hong Kong. Here is my passport.", "我飛去香港。我張護照喺度。"),
        line("t1-l3", "kai", "Kai", "Thank you. Window or aisle?", "多謝。靠窗定係通道？"),
        line("t1-l4", "ling", "Ling", "A window seat, please.", "要靠窗位，唔該。"),
        line("t1-l5", "kai", "Kai", "Sure. I'll show you the information. Here is your boarding pass.", "好。我畀你睇吓資料。你張登機證喺度。"),
    ]
    r1 = [
        line("r1-l1", "ana", "Ana", "Good evening. Do you have a reservation?", "晚上好。你有冇訂座？"),
        line("r1-l2", "tom", "Tom", "Yes. A table for two, please.", "有。兩位，唔該。", "Yes. [[ə ˈteɪbəl fɚ ˈtu]] , please."),
        line("r1-l3", "ana", "Ana", "Right this way. Would you like a table by the window?", "請跟我嚟。想唔想坐靠窗？"),
        line("r1-l4", "tom", "Tom", "Yes, thank you. This is great.", "好，多謝。好好。"),
        line("r1-l5", "ana", "Ana", "Here is your table. Please have a seat. I'll bring the menu.", "你張檯喺度。請坐。我攞餐牌嚟。"),
    ]
    # model answers that are not already lines
    extras = [
        line("f1-m1", "ling", "Ling", "Ship. Sheep.", "Ship。Sheep。"),
        line("f1-m2", "ling", "Ling", "About.", "About。"),
        line("f1-m3", "ling", "Ling", "Nice and slow.", "慢慢嚟。"),
        line("f2-m2", "ling", "Ling", "Nice to meet you, too.", "我都好高興認識你。"),
        line("j1-m1", "mei", "Mei", "Of course. Please take a look.", "當然。請慢慢睇。", "[[əv kˈɔɹs.]] Please take a look."),
        line("j1-m2", "mei", "Mei", "Thank you.", "多謝。"),
        line("j1-m3", "mei", "Mei", "Let me know if you need anything.", "有需要就話我知。"),
        line("j2-m1", "mei", "Mei", "We have a very nice ring.", "我哋有一隻好靚嘅戒指。"),
        line("j2-m2", "mei", "Mei", "Would you like to see it?", "想唔想睇吓？"),
        line("j2-m3", "mei", "Mei", "I'll show you a few.", "我畀你睇幾件。"),
        line("j2-l6", "tom", "Tom", "Yes, please.", "好，唔該。"),
        line("t1-m1", "ling", "Ling", "I'm flying to Hong Kong.", "我飛去香港。"),
        line("t1-m2", "ling", "Ling", "Here is my passport.", "我張護照喺度。"),
        line("r1-m3", "tom", "Tom", "Thank you.", "多謝。"),
        line("j1-l6", "tom", "Tom", "Thanks. I'll look around.", "多謝。我周圍睇吓。"),
        line("t1-l6", "kai", "Kai", "May I see your passport, please?", "可唔可以畀我睇吓護照？"),
        line("r1-l6", "ana", "Ana", "Right this way.", "請跟我嚟。"),
    ]
    lessons = [
        {
            "id": "F1",
            "unit": "F",
            "titleYue": "氣息同長短音",
            "titleEn": "Sounds and breath",
            "canDoYue": "你能夠用慢呼吸分清短音 ship 同長音 sheep，並且讀到 about 開頭嗰個輕音。",
            "canDoEn": "Hear short ship and long sheep, and say the soft first sound in about.",
            "minutes": 12,
            "hero": "assets/art/lessons/f1.webp",
            "cast": ["mei"],
            "lemmas": ["hello-intj", "breath-noun", "listen-verb", "short-adj", "long-adj", "ship-noun", "sheep-noun", "sound-noun", "slow-adj", "smile-verb", "again-adv", "about-prep", "relax-verb", "begin-verb", "keep-verb", "light-adj", "the-art", "name-noun", "beat-verb", "bit-noun", "sit-verb", "seat-noun"],
            "dialogue": f1,
            "understand": [
                {"prompt": "Ship is short. 係講緊咩？", "choices": ["船呢個字係短元音", "羊係短元音", "請坐低"], "answer": 0, "explain": "ship 係 /ɪ/，短。sheep 先至係長音 /i/。"},
                {"prompt": "About 開頭嗰下係？", "choices": ["好輕嘅 schwa /ə/", "重重嘅 /eɪ/", "一個 /θ/"], "answer": 0, "explain": "about 係 /əˈbaʊt/。第一下唔使出力。"},
                {"prompt": "Keep it light. 想你點？", "choices": ["輕輕讀，唔好繃緊", "讀大聲啲", "讀快三倍"], "answer": 0, "explain": "light 呢度係輕巧，唔係燈光。"},
            ],
            "chunks": [
                {"pattern": "Let's begin with ___.", "example": "Let's begin with a slow breath.", "glossYue": "我哋由⋯⋯開始。", "answer": "a slow breath", "choices": ["a slow breath", "a boarding pass", "a silver ring"]},
                {"pattern": "___ is short. ___ is long.", "example": "Ship is short. Sheep is long.", "glossYue": "⋯⋯係短音。⋯⋯係長音。", "answer": "Ship / Sheep", "choices": ["Ship / Sheep", "Thank / sank", "Wine / vine"]},
                {"pattern": "Say it again, ___.", "example": "Say it again, nice and slow.", "glossYue": "再講一次，⋯⋯。", "answer": "nice and slow", "choices": ["nice and slow", "window or aisle", "just looking"]},
            ],
            "shadow": {"lineId": "f1-l2", "hint": "Listen. Ship is short. Sheep is long."},
            "build": [
                {"type": "choice", "promptYue": "Mei 話：Ship is short. Sheep is long. 邊句先係長音？", "choices": ["Sheep", "Ship", "Sit"], "answer": 0, "explain": "ee 通常係長 /i/。i 喺 ship 係短 /ɪ/。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Say", "it", "again", "nice", "and", "slow"], "answer": ["Say", "it", "again", "nice", "and", "slow"]},
            ],
            "roleplay": {
                "you": "ling",
                "intro": "Mei 喺開舖之前同你暖聲。佢講完一句，你先至答。唔會中途打斷你。",
                "turns": [
                    {"partner": "Mei", "partnerId": "mei", "line": "Listen. Ship is short. Sheep is long.", "audio": "assets/audio/lines/f1-l2.mp3", "audioSlow": "assets/audio/lines/f1-l2-slow.mp3", "expect": "Ship. Sheep.", "keywords": ["ship", "sheep"], "modelAudio": "assets/audio/lines/f1-m1.mp3", "modelSlow": "assets/audio/lines/f1-m1-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "About. The first sound is soft.", "audio": "assets/audio/lines/f1-l4.mp3", "audioSlow": "assets/audio/lines/f1-l4-slow.mp3", "expect": "About.", "keywords": ["about"], "modelAudio": "assets/audio/lines/f1-m2.mp3", "modelSlow": "assets/audio/lines/f1-m2-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "Relax. Say it again, nice and slow.", "audio": "assets/audio/lines/f1-l5.mp3", "audioSlow": "assets/audio/lines/f1-l5-slow.mp3", "expect": "Nice and slow.", "keywords": ["nice", "slow"], "modelAudio": "assets/audio/lines/f1-m3.mp3", "modelSlow": "assets/audio/lines/f1-m3-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "ship-noun", "choices": ["ship", "sheep", "seat"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "sheep-noun", "choices": ["sheep", "ship", "sit"], "answer": 0},
                {"type": "meaning", "prompt": "breath", "choices": ["一啖氣", "登機證", "銀戒指"], "answer": 0},
                {"type": "meaning", "prompt": "about 開頭", "choices": ["輕音 /ə/", "長音 /i/", "咬唇 /v/"], "answer": 0},
                {"type": "choice", "prompt": "邊對先係短／長？", "choices": ["ship / sheep", "thank / sank", "wine / vine"], "answer": 0, "explain": "今課只分長短元音。"},
            ],
            "sound": {
                "ipa": "/ɪ/ · /i/",
                "title": "短音同長音",
                "note": "短 /ɪ/：嘴微張，放鬆，一下就收。長 /i/：嘴角微微展開，拉長少少。用口型，唔好用粵拼代替英文音。about、the（子音前）開頭係更輕嘅 schwa /ə/，幾乎唔使出力。",
                "pairs": [
                    {"a": "ship-noun", "b": "sheep-noun"},
                    {"a": "bit-noun", "b": "beat-verb"},
                    {"a": "sit-verb", "b": "seat-noun"},
                ],
                "drill": ["ship-noun", "sheep-noun", "about-prep", "the-art"],
            },
            "next": "F2",
        },
        {
            "id": "F2",
            "unit": "F",
            "titleYue": "打招呼同名字",
            "titleEn": "Greetings and names",
            "canDoYue": "你能夠講早晨、講自己個名，並且用 /θ/ 講 thank you。",
            "canDoEn": "Say good morning, give your name, and pronounce thank you with /θ/.",
            "minutes": 12,
            "hero": "assets/art/lessons/f2.webp",
            "cast": ["mei"],
            "lemmas": ["good-morning-phrase", "good-adj", "morning-noun", "afternoon-noun", "evening-noun", "name-noun", "my-det", "nice-to-meet-phrase", "nice-adj", "meet-verb", "you-pron", "thank-you-phrase", "thank-verb", "thanks-noun", "please-adv", "too-adv", "hi-intj", "sir-noun", "madam-noun", "welcome-verb"],
            "dialogue": f2,
            "understand": [
                {"prompt": "My name is Mei. 係咩意思？", "choices": ["我叫 Mei", "我想買頸鏈", "兩位"], "answer": 0, "explain": "name 係名字。is 呢度等於「係」。"},
                {"prompt": "Nice to meet you. 幾時講？", "choices": ["第一次見面", "叫人埋單", "問靠窗定通道"], "answer": 0, "explain": "認識人嘅時候講，語氣輕就得。"},
                {"prompt": "Thank you 開頭個音係？", "choices": ["/θ/ 舌尖輕送氣", "/f/ 咬唇", "/s/ 牙齒縫"], "answer": 0, "explain": "舌尖輕觸上排牙，送氣。唔好變成 fanks。"},
            ],
            "chunks": [
                {"pattern": "Good ___.", "example": "Good morning.", "glossYue": "早晨／午安／晚上好。", "answer": "morning", "choices": ["morning", "passport", "necklace"]},
                {"pattern": "My name is ___.", "example": "My name is Ling.", "glossYue": "我叫⋯⋯。", "answer": "Ling", "choices": ["Ling", "a table", "check-in"]},
                {"pattern": "Nice to meet ___.", "example": "Nice to meet you.", "glossYue": "認識你真好。", "answer": "you", "choices": ["you", "the menu", "aisle"]},
                {"pattern": "Thank ___.", "example": "Thank you.", "glossYue": "多謝。", "answer": "you", "choices": ["you", "sank", "wine"]},
            ],
            "shadow": {"lineId": "f2-l1", "hint": "Good morning. My name is Mei."},
            "build": [
                {"type": "choice", "promptYue": "有人話 Nice to meet you. 你點接最自然？", "choices": ["Nice to meet you, too.", "A table for two.", "Window or aisle?"], "answer": 0, "explain": "too 表示「我都係」。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["My", "name", "is", "Ling"], "answer": ["My", "name", "is", "Ling"]},
            ],
            "roleplay": {
                "you": "ling",
                "intro": "你喺舖門口同 Mei 練習。佢講完，你再講。用你自己個名都得，關鍵字對到就會肯定你。",
                "turns": [
                    {"partner": "Mei", "partnerId": "mei", "line": "Good morning. My name is Mei.", "audio": "assets/audio/lines/f2-l1.mp3", "audioSlow": "assets/audio/lines/f2-l1-slow.mp3", "expect": "Good morning. My name is Ling.", "keywords": ["morning", "name"], "modelAudio": "assets/audio/lines/f2-l2.mp3", "modelSlow": "assets/audio/lines/f2-l2-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "Nice to meet you.", "audio": "assets/audio/lines/f2-l3.mp3", "audioSlow": "assets/audio/lines/f2-l3-slow.mp3", "expect": "Nice to meet you, too.", "keywords": ["nice", "meet"], "modelAudio": "assets/audio/lines/f2-m2.mp3", "modelSlow": "assets/audio/lines/f2-m2-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "Hi. Please say it again.", "audio": "assets/audio/lines/f2-l5.mp3", "audioSlow": "assets/audio/lines/f2-l5-slow.mp3", "expect": "Thank you.", "keywords": ["thank"], "modelAudio": "assets/audio/lines/j1-m2.mp3", "modelSlow": "assets/audio/lines/j1-m2-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "thank-verb", "choices": ["thank", "sank", "tank"], "answer": 0},
                {"type": "meaning", "prompt": "Good morning", "choices": ["早晨", "兩位", "登機證"], "answer": 0},
                {"type": "meaning", "prompt": "Nice to meet you", "choices": ["認識你真好", "只係睇吓", "靠窗位"], "answer": 0},
                {"type": "choice", "prompt": "sir 係叫邊種人？", "choices": ["男士，客氣", "一張檯", "一隻戒指"], "answer": 0, "explain": "madam 就係對女士。兩個都唔使每次都用。"},
                {"type": "listen", "prompt": "邊個有 /θ/？", "lemma": "three-num", "choices": ["three", "tree", "free"], "answer": 0},
            ],
            "sound": {
                "ipa": "/θ/",
                "title": "舌尖輕送氣",
                "note": "舌尖輕輕伸出，碰上排牙，送一小口氣。唔好咬實，亦唔好讀成 f 或者 s。呢個係口型，唔係粵拼。thank、think、three 都係呢個音。",
                "pairs": [
                    {"a": "thank-verb", "b": "sank-verb"},
                    {"a": "think-verb", "b": "sink-noun"},
                    {"a": "three-num", "b": "tree-noun"},
                ],
                "drill": ["thank-verb", "thanks-noun", "think-verb", "three-num"],
            },
            "next": "J1",
        },
        {
            "id": "J1",
            "unit": "J",
            "titleYue": "迎接客人",
            "titleEn": "Greeting a customer",
            "canDoYue": "你能夠同進店客人打招呼，並且大方回應 just looking。",
            "canDoEn": "Greet a walk-in and answer “just looking” with ease.",
            "minutes": 12,
            "hero": "assets/art/lessons/j1.webp",
            "cast": ["mei", "tom"],
            "lemmas": ["welcome-verb", "jewellery-noun", "jewelry-noun", "store-noun", "help-verb", "today-adv", "looking-verb", "just-looking-phrase", "just-adv", "please-adv", "thank-you-phrase", "of-course-phrase", "course-noun", "come-verb", "may-verb", "look-verb", "certainly-adv", "browsing-verb", "know-verb", "enjoy-verb", "necklace-noun", "beautiful-adj", "anything-pron", "with-prep", "how-may-i-phrase", "let-me-know-phrase"],
            "dialogue": j1,
            "understand": [
                {"prompt": "I'm just looking. 客人想點？", "choices": ["只係睇吓，未打算買", "即刻落單", "要兩位靠窗"], "answer": 0, "explain": "唔好追問。請佢慢慢睇就得。"},
                {"prompt": "How may I help you? 你喺做咩？", "choices": ["客氣咁問可唔可以幫手", "叫客人離開", "問航班號碼"], "answer": 0, "explain": "may 比 can 更慢、更有禮。"},
                {"prompt": "Of course. 係邊種語氣？", "choices": ["當然，冇問題", "唔得", "幾多錢"], "answer": 0, "explain": "後面通常接 Please take a look。"},
            ],
            "chunks": [
                {"pattern": "Welcome to ___.", "example": "Welcome to our jewellery store.", "glossYue": "歡迎嚟到⋯⋯。", "answer": "our jewellery store", "choices": ["our jewellery store", "the boarding gate", "a table for two"]},
                {"pattern": "How may I help you ___?", "example": "How may I help you today?", "glossYue": "今日有咩可以幫到你？", "answer": "today", "choices": ["today", "the menu", "my passport"]},
                {"pattern": "I'm just ___.", "example": "I'm just looking.", "glossYue": "我只係睇吓。", "answer": "looking", "choices": ["looking", "a necklace", "on time"]},
                {"pattern": "Of course. Please ___.", "example": "Of course. Please take a look.", "glossYue": "當然。請慢慢睇。", "answer": "take a look", "choices": ["take a look", "close the door", "go to the gate"]},
                {"pattern": "Let me know if you need ___.", "example": "Let me know if you need anything.", "glossYue": "有需要就話我知。", "answer": "anything", "choices": ["anything", "a bass guitar", "the wind"]},
            ],
            "shadow": {"lineId": "j1-l1", "hint": "Welcome to our jewellery store. How may I help you today?"},
            "build": [
                {"type": "choice", "promptYue": "客人話 I'm just looking, thank you. 你點接？", "choices": ["Of course. Please take a look.", "Please go away.", "Window or aisle?"], "answer": 0, "explain": "先接住個 thank you 嘅客氣，再請佢睇。"},
                {"type": "order", "promptYue": "排好櫃檯第一句。", "tokens": ["How", "may", "I", "help", "you", "today"], "answer": ["How", "may", "I", "help", "you", "today"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "你企喺櫃檯。Tom 行入嚟。等佢講完成句，你再答。",
                "turns": [
                    {"partner": "Tom", "partnerId": "tom", "line": "Hi. I'm just looking, thank you.", "audio": "assets/audio/lines/j1-l2.mp3", "audioSlow": "assets/audio/lines/j1-l2-slow.mp3", "expect": "Of course. Please take a look.", "keywords": ["course", "look"], "modelAudio": "assets/audio/lines/j1-m1.mp3", "modelSlow": "assets/audio/lines/j1-m1-slow.mp3"},
                    {"partner": "Tom", "partnerId": "tom", "line": "This necklace is beautiful.", "audio": "assets/audio/lines/j1-l4.mp3", "audioSlow": "assets/audio/lines/j1-l4-slow.mp3", "expect": "Thank you.", "keywords": ["thank"], "modelAudio": "assets/audio/lines/j1-m2.mp3", "modelSlow": "assets/audio/lines/j1-m2-slow.mp3"},
                    {"partner": "Tom", "partnerId": "tom", "line": "Thanks. I'll look around.", "audio": "assets/audio/lines/j1-l6.mp3", "audioSlow": "assets/audio/lines/j1-l6-slow.mp3", "expect": "Let me know if you need anything.", "keywords": ["know", "anything"], "modelAudio": "assets/audio/lines/j1-m3.mp3", "modelSlow": "assets/audio/lines/j1-m3-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "thank-verb", "choices": ["thank", "sank", "tank"], "answer": 0},
                {"type": "meaning", "prompt": "jewellery", "choices": ["珠寶", "護照", "餐牌"], "answer": 0},
                {"type": "meaning", "prompt": "just looking", "choices": ["只係睇吓", "即刻付款", "我有訂座"], "answer": 0},
                {"type": "choice", "prompt": "This necklace is beautiful. 你點接最得體？", "choices": ["Thank you.", "Go to the gate.", "Ship is short."], "answer": 0, "explain": "客人讚貨，先接一句 thank you 就得。"},
                {"type": "listen", "prompt": "邊個有 /θ/？", "lemma": "anything-pron", "choices": ["anything", "evening", "silver"], "answer": 0},
            ],
            "sound": {
                "ipa": "/θ/",
                "title": "thank、with 嘅舌尖",
                "note": "thank 一定係 /θæŋk/。舌尖輕觸上排牙再送氣。with 美式多數讀 /wɪð/（有聲），尾音有時先至係 /wɪθ/。兩種都聽一次。清音嗰下先練 /θ/，有聲嗰下聲帶要震。唔好用粵拼標英文。",
                "pairs": [
                    {"a": "thank-verb", "b": "sank-verb"},
                    {"a": "with-prep-voiceless", "b": "with-prep"},
                    {"a": "three-num", "b": "tree-noun"},
                ],
                "drill": ["thank-verb", "with-prep", "with-prep-voiceless", "anything-pron"],
            },
            "next": "J2",
        },
        {
            "id": "J2",
            "unit": "J",
            "titleYue": "你想搵咩",
            "titleEn": "What are you looking for?",
            "canDoYue": "你能夠問客人想搵咩，並且分清 /w/ 同 /v/。",
            "canDoEn": "Ask what they are looking for, and keep /w/ and /v/ apart.",
            "minutes": 12,
            "hero": "assets/art/lessons/j2.webp",
            "cast": ["mei", "tom"],
            "lemmas": ["what-det", "looking-verb", "today-adv", "silver-noun", "ring-noun", "watch-noun", "very-adv", "have-verb", "nice-adj", "would-verb", "like-verb", "see-verb", "want-verb", "something-pron", "wife-noun", "show-verb", "few-det", "moment-noun", "love-verb", "wine-noun", "vine-noun", "west-noun", "vest-noun", "we-pron"],
            "dialogue": j2,
            "understand": [
                {"prompt": "What are you looking for? 係問咩？", "choices": ["你想搵咩", "你叫咩名", "你飛去邊"], "answer": 0, "explain": "looking for 係「想搵」。唔係普通望一望。"},
                {"prompt": "very 開頭係邊個音？", "choices": ["/v/ 上齒輕碰下唇", "/w/ 雙唇收圓", "/θ/ 伸舌"], "answer": 0, "explain": "very 唔好讀成 wery。"},
                {"prompt": "Would you like to see it? 係邊種語氣？", "choices": ["客氣邀請", "命令", "道別"], "answer": 0, "explain": "would like 比 want 柔和。"},
            ],
            "chunks": [
                {"pattern": "What are you looking for ___?", "example": "What are you looking for today?", "glossYue": "你今日想搵咩？", "answer": "today", "choices": ["today", "the gate", "a breath"]},
                {"pattern": "I'm looking for ___.", "example": "I'm looking for a silver ring.", "glossYue": "我想搵⋯⋯。", "answer": "a silver ring", "choices": ["a silver ring", "my passport", "the menu"]},
                {"pattern": "Would you like to ___?", "example": "Would you like to see it?", "glossYue": "想唔想⋯⋯？", "answer": "see it", "choices": ["see it", "check in", "bow to the guest"]},
                {"pattern": "I'll show you ___.", "example": "I'll show you a few.", "glossYue": "我畀你睇⋯⋯。", "answer": "a few", "choices": ["a few", "the wind", "a live show"]},
            ],
            "shadow": {"lineId": "j2-l1", "hint": "What are you looking for today?"},
            "build": [
                {"type": "choice", "promptYue": "客人話 I'm looking for a silver ring. 你點接？", "choices": ["We have a very nice ring.", "Your flight is on time.", "Ship is short."], "answer": 0, "explain": "接住個需求，再邀請佢睇。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Would", "you", "like", "to", "see", "it"], "answer": ["Would", "you", "like", "to", "see", "it"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "Tom 已經入咗舖。你問完之後，等佢講完先答。",
                "turns": [
                    {"partner": "Tom", "partnerId": "tom", "line": "I'm looking for a silver ring.", "audio": "assets/audio/lines/j2-l2.mp3", "audioSlow": "assets/audio/lines/j2-l2-slow.mp3", "expect": "We have a very nice ring.", "keywords": ["very", "ring"], "modelAudio": "assets/audio/lines/j2-m1.mp3", "modelSlow": "assets/audio/lines/j2-m1-slow.mp3"},
                    {"partner": "Tom", "partnerId": "tom", "line": "Yes. I want something for my wife.", "audio": "assets/audio/lines/j2-l4.mp3", "audioSlow": "assets/audio/lines/j2-l4-slow.mp3", "expect": "Would you like to see it?", "keywords": ["like", "see"], "modelAudio": "assets/audio/lines/j2-m2.mp3", "modelSlow": "assets/audio/lines/j2-m2-slow.mp3"},
                    {"partner": "Tom", "partnerId": "tom", "line": "Yes, please.", "audio": "assets/audio/lines/j2-l6.mp3", "audioSlow": "assets/audio/lines/j2-l6-slow.mp3", "expect": "I'll show you a few.", "keywords": ["show", "few"], "modelAudio": "assets/audio/lines/j2-m3.mp3", "modelSlow": "assets/audio/lines/j2-m3-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "wine-noun", "choices": ["wine", "vine", "west"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "vine-noun", "choices": ["vine", "wine", "wife"], "answer": 0},
                {"type": "meaning", "prompt": "silver ring", "choices": ["銀戒指", "靠窗位", "登機證"], "answer": 0},
                {"type": "meaning", "prompt": "Would you like to see it?", "choices": ["想唔想睇吓", "請去閘口", "我只係睇吓"], "answer": 0},
                {"type": "choice", "prompt": "邊個開頭係 /v/？", "choices": ["very", "would", "wife"], "answer": 0, "explain": "would 同 wife 係圓唇 /w/。very 先至係 /v/。"},
            ],
            "sound": {
                "ipa": "/w/ · /v/",
                "title": "圓唇同咬唇",
                "note": "/w/：雙唇收圓，好似吹細蠟燭之前，牙齒唔使咬唇。/v/：上排牙輕碰下唇，聲帶要震。wine / vine、west / vest 就係呢一對。would、want、wife、watch 係 /w/。very 同 silver 入面係 /v/。",
                "pairs": [
                    {"a": "wine-noun", "b": "vine-noun"},
                    {"a": "west-noun", "b": "vest-noun"},
                ],
                "drill": ["wine-noun", "vine-noun", "very-adv", "would-verb", "wife-noun"],
            },
            "next": "T1",
        },
        {
            "id": "T1",
            "unit": "T",
            "titleYue": "機場櫃檯",
            "titleEn": "Airport check-in",
            "canDoYue": "你能夠辦登機：講目的地、遞護照、揀靠窗，並且分清 /ʃ/ 同 /tʃ/。",
            "canDoEn": "Check in: say where you are flying, show a passport, and choose a window seat.",
            "minutes": 12,
            "hero": "assets/art/lessons/t1.webp",
            "cast": ["kai"],
            "lemmas": ["afternoon-noun", "where-adv", "flying-verb", "today-adv", "passport-noun", "here-adv", "window-noun", "aisle-noun", "seat-noun", "window-seat-phrase", "boarding-pass-phrase", "boarding-noun", "pass-noun", "flight-noun", "time-noun", "gate-noun", "check-in-noun", "check-verb", "sure-adj", "show-verb", "information-noun", "ticket-noun", "luggage-noun", "please-adv", "thank-verb"],
            "dialogue": t1,
            "understand": [
                {"prompt": "Where are you flying today? 係問咩？", "choices": ["你今日飛去邊", "你想搵咩首飾", "你有冇訂座"], "answer": 0, "explain": "flying 係飛緊去邊度。"},
                {"prompt": "Window or aisle? 係兩個咩？", "choices": ["靠窗位定通道位", "紅酒定白酒", "金定銀"], "answer": 0, "explain": "aisle 係行路嗰條通道旁邊。"},
                {"prompt": "check-in 開頭係？", "choices": ["/tʃ/，一下堵住再放", "/ʃ/ 長噓氣", "/θ/ 伸舌"], "answer": 0, "explain": "check 唔係 sh。/ʃ/ 喺 sure、show、information。"},
            ],
            "chunks": [
                {"pattern": "Where are you flying ___?", "example": "Where are you flying today?", "glossYue": "你今日飛去邊？", "answer": "today", "choices": ["today", "a silver ring", "the menu"]},
                {"pattern": "Here is my ___.", "example": "Here is my passport.", "glossYue": "我張⋯⋯喺度。", "answer": "passport", "choices": ["passport", "necklace", "menu"]},
                {"pattern": "A window seat, ___.", "example": "A window seat, please.", "glossYue": "要靠窗位，唔該。", "answer": "please", "choices": ["please", "the wind", "just looking"]},
                {"pattern": "Here is your ___.", "example": "Here is your boarding pass.", "glossYue": "你張⋯⋯喺度。", "answer": "boarding pass", "choices": ["boarding pass", "silver ring", "slow breath"]},
            ],
            "shadow": {"lineId": "t1-l4", "hint": "A window seat, please."},
            "build": [
                {"type": "choice", "promptYue": "Kai 問 Window or aisle? 你想坐窗邊。", "choices": ["A window seat, please.", "I'm just looking.", "A table for two."], "answer": 0, "explain": "please 放句尾就夠禮貌。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Here", "is", "my", "passport"], "answer": ["Here", "is", "my", "passport"]},
            ],
            "roleplay": {
                "you": "ling",
                "intro": "你喺夜間櫃檯。Kai 問完一句，你再答。唔使急。",
                "turns": [
                    {"partner": "Kai", "partnerId": "kai", "line": "Good afternoon. Where are you flying today?", "audio": "assets/audio/lines/t1-l1.mp3", "audioSlow": "assets/audio/lines/t1-l1-slow.mp3", "expect": "I'm flying to Hong Kong.", "keywords": ["flying"], "modelAudio": "assets/audio/lines/t1-m1.mp3", "modelSlow": "assets/audio/lines/t1-m1-slow.mp3"},
                    {"partner": "Kai", "partnerId": "kai", "line": "May I see your passport, please?", "audio": "assets/audio/lines/t1-l6.mp3", "audioSlow": "assets/audio/lines/t1-l6-slow.mp3", "expect": "Here is my passport.", "keywords": ["passport"], "modelAudio": "assets/audio/lines/t1-m2.mp3", "modelSlow": "assets/audio/lines/t1-m2-slow.mp3"},
                    {"partner": "Kai", "partnerId": "kai", "line": "Thank you. Window or aisle?", "audio": "assets/audio/lines/t1-l3.mp3", "audioSlow": "assets/audio/lines/t1-l3-slow.mp3", "expect": "A window seat, please.", "keywords": ["window"], "modelAudio": "assets/audio/lines/t1-l4.mp3", "modelSlow": "assets/audio/lines/t1-l4-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "sheet-noun", "choices": ["sheet", "cheat", "seat"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "sure-adj", "choices": ["sure", "tour", "store"], "answer": 0},
                {"type": "meaning", "prompt": "boarding pass", "choices": ["登機證", "頸鏈", "餐牌"], "answer": 0},
                {"type": "meaning", "prompt": "aisle", "choices": ["通道位", "靠窗", "行李"], "answer": 0},
                {"type": "choice", "prompt": "邊個先有 /ʃ/？", "choices": ["show", "check", "ticket"], "answer": 0, "explain": "check 同 ticket 係 /tʃ/。show 先至係 /ʃ/。"},
            ],
            "sound": {
                "ipa": "/ʃ/",
                "title": "長噓氣，唔係 check",
                "note": "/ʃ/：嘴唇稍圓，舌面抬高，一口氣慢慢送出，好似叫人靜音但更圓。sure、show、information、sheet 都有。check-in 嘅 check 係 /tʃɛk/：先堵住，再放出。兩種都聽，唔好撈。boarding 本身係 /ˈbɔɹ.dɪŋ/，重點 /ɹ/ 同 /ŋ/，唔係 /ʃ/。",
                "pairs": [
                    {"a": "sheet-noun", "b": "cheat-verb"},
                    {"a": "shoe-noun", "b": "chew-verb"},
                    {"a": "sure-adj", "b": "check-verb"},
                ],
                "drill": ["sure-adj", "show-verb", "information-noun", "sheet-noun", "check-verb"],
            },
            "next": "R1",
        },
        {
            "id": "R1",
            "unit": "R",
            "titleYue": "入座",
            "titleEn": "Entering and seating",
            "canDoYue": "你能夠訂位入座：講人數、跟住 right this way，並且讀到美式 /r/。",
            "canDoEn": "Ask for a table and follow “right this way,” with a clear American /r/.",
            "minutes": 12,
            "hero": "assets/art/lessons/r1.webp",
            "cast": ["ana", "tom"],
            "lemmas": ["evening-noun", "reservation-noun", "table-noun", "table-for-two-phrase", "two-num", "right-adv", "right-this-way-phrase", "way-noun", "would-verb", "like-verb", "window-noun", "by-prep", "great-adj", "seat-noun", "bring-verb", "menu-noun", "ready-adj", "yes-intj", "do-verb", "have-verb", "please-adv", "thank-you-phrase", "red-adj", "led-verb"],
            "dialogue": r1,
            "understand": [
                {"prompt": "Do you have a reservation? 係問咩？", "choices": ["你有冇訂座", "你想搵銀戒指", "你飛去邊"], "answer": 0, "explain": "有就答 Yes，再講幾多位。"},
                {"prompt": "A table for two. 係幾多位？", "choices": ["兩位", "一位", "通道位"], "answer": 0, "explain": "for two 係人數，唔係價錢。"},
                {"prompt": "Right this way. 你應該？", "choices": ["跟住佢行", "遞護照", "講自己個名"], "answer": 0, "explain": "right 呢度係「就係咁邊」。開頭 /r/。"},
            ],
            "chunks": [
                {"pattern": "Do you have a ___?", "example": "Do you have a reservation?", "glossYue": "你有冇⋯⋯？", "answer": "reservation", "choices": ["reservation", "necklace", "boarding pass"]},
                {"pattern": "A table for ___, please.", "example": "A table for two, please.", "glossYue": "⋯⋯位，唔該。", "answer": "two", "choices": ["two", "sheep", "thank"]},
                {"pattern": "Right this ___.", "example": "Right this way.", "glossYue": "請跟我嚟。", "answer": "way", "choices": ["way", "wine", "wife"]},
                {"pattern": "I'll bring the ___.", "example": "I'll bring the menu.", "glossYue": "我攞⋯⋯嚟。", "answer": "menu", "choices": ["menu", "passport", "ring"]},
            ],
            "shadow": {"lineId": "r1-l2", "hint": "Yes. A table for two, please."},
            "build": [
                {"type": "choice", "promptYue": "Ana 問 Do you have a reservation? 你訂咗兩位。", "choices": ["Yes. A table for two, please.", "I'm just looking, thank you.", "Here is my passport."], "answer": 0, "explain": "先 yes，再講人數。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Right", "this", "way"], "answer": ["Right", "this", "way"]},
            ],
            "roleplay": {
                "you": "tom",
                "intro": "今晚你係客人。Ana 喺門口。等佢講完先答。",
                "turns": [
                    {"partner": "Ana", "partnerId": "ana", "line": "Good evening. Do you have a reservation?", "audio": "assets/audio/lines/r1-l1.mp3", "audioSlow": "assets/audio/lines/r1-l1-slow.mp3", "expect": "Yes. A table for two, please.", "keywords": ["table", "two"], "modelAudio": "assets/audio/lines/r1-l2.mp3", "modelSlow": "assets/audio/lines/r1-l2-slow.mp3"},
                    {"partner": "Ana", "partnerId": "ana", "line": "Would you like a table by the window?", "audio": "assets/audio/lines/r1-l3.mp3", "audioSlow": "assets/audio/lines/r1-l3-slow.mp3", "expect": "Yes, thank you.", "keywords": ["yes", "thank"], "modelAudio": "assets/audio/lines/r1-l4.mp3", "modelSlow": "assets/audio/lines/r1-l4-slow.mp3"},
                    {"partner": "Ana", "partnerId": "ana", "line": "Right this way.", "audio": "assets/audio/lines/r1-l6.mp3", "audioSlow": "assets/audio/lines/r1-l6-slow.mp3", "expect": "Thank you.", "keywords": ["thank"], "modelAudio": "assets/audio/lines/r1-m3.mp3", "modelSlow": "assets/audio/lines/r1-m3-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "right-adv", "choices": ["right", "light", "night"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "red-adj", "choices": ["red", "led", "read"], "answer": 0},
                {"type": "meaning", "prompt": "reservation", "choices": ["訂座", "護照", "頸鏈"], "answer": 0},
                {"type": "meaning", "prompt": "I'll bring the menu.", "choices": ["我攞餐牌嚟", "我飛去香港", "我只係睇吓"], "answer": 0},
                {"type": "choice", "prompt": "table 入面有冇 /r/？", "choices": ["冇。/r/ 喺 right、reservation", "有，讀成 rable", "同 light 同音"], "answer": 0, "explain": "table 係 /ˈteɪ.bəl/。唔好為咗課名硬加 /r/。"},
            ],
            "sound": {
                "ipa": "/ɹ/",
                "title": "美式捲舌",
                "note": "舌尖向上後方卷，唔好掂到上顎，兩邊嘴角唔使拉到笑。right、reservation、ready、bring、great 都有。table 係 /ˈteɪ.bəl/，冇 /r/。如果讀成 l，聽嘅人會聽成 light。",
                "pairs": [
                    {"a": "right-adv", "b": "light-adj"},
                    {"a": "red-adj", "b": "led-verb"},
                ],
                "drill": ["right-adv", "reservation-noun", "ready-adj", "bring-verb", "great-adj"],
            },
            "next": None,
        },
    ]
    # attach extra lines onto a side channel via the first lesson? Renderer collects all lessons' dialogue
    # plus this list stored on path meta. We'll return extras separately.
    return lessons, extras


PATH = {
    "units": [
        {
            "id": "F",
            "title": "打好基礎",
            "blurb": "氣息、長短音、打招呼。",
            "lessons": [
                {"id": "F1"},
                {"id": "F2"},
                {"id": "F3", "title": "數字、錢同時間", "soon": True},
                {"id": "F4", "title": "禮貌用語", "soon": True},
            ],
        },
        {
            "id": "J",
            "title": "珠寶櫃檯",
            "blurb": "明日返工用得着。",
            "lessons": [
                {"id": "J1"},
                {"id": "J2"},
                {"id": "J3", "title": "件件嘅名", "soon": True},
                {"id": "J4", "title": "金、銀、鑽石、玉", "soon": True},
                {"id": "J5", "title": "尺寸同試戴", "soon": True},
                {"id": "J6", "title": "價錢同付款", "soon": True},
                {"id": "J7", "title": "收尾同道別", "soon": True},
            ],
        },
        {
            "id": "T",
            "title": "旅行",
            "blurb": "機場先。",
            "lessons": [
                {"id": "T1"},
                {"id": "T2", "title": "安檢同方向", "soon": True},
                {"id": "T3", "title": "酒店入住", "soon": True},
                {"id": "T4", "title": "的士同問路", "soon": True},
                {"id": "T5", "title": "行失咗點求人", "soon": True},
            ],
        },
        {
            "id": "R",
            "title": "餐廳",
            "blurb": "入座先，落單下一課。",
            "lessons": [
                {"id": "R1"},
                {"id": "R2", "title": "落單", "soon": True},
                {"id": "R3", "title": "過敏同特別要求", "soon": True},
                {"id": "R4", "title": "用餐期間", "soon": True},
                {"id": "R5", "title": "埋單同貼士", "soon": True},
            ],
        },
    ]
}


def main() -> None:
    if not CMU_PATH.exists():
        raise SystemExit("missing /tmp/cmudict.dict")
    cmu = load_cmu(CMU_PATH)
    build_items()
    verify(cmu)
    lessons, extras = build_lessons()
    ids = {item["id"] for item in ITEMS}
    if len(ids) != len(ITEMS):
        raise SystemExit("duplicate lexicon ids")
    for lesson in lessons:
        for lid in lesson["lemmas"]:
            if lid not in ids:
                raise SystemExit(f"{lesson['id']} missing lemma {lid}")
        for pair in lesson["sound"]["pairs"]:
            for key in ("a", "b"):
                if pair[key] not in ids:
                    raise SystemExit(f"pair {pair[key]}")
        for d in lesson["sound"]["drill"]:
            if d not in ids:
                raise SystemExit(f"drill {d}")
        for q in lesson["quiz"]:
            if "lemma" in q and q["lemma"] not in ids:
                raise SystemExit(f"quiz {q['lemma']}")
    # drop internal-only fields from public lexicon
    public = []
    for item in ITEMS:
        row = dict(item)
        public.append(row)
    OUT.mkdir(exist_ok=True)
    (OUT / "lessons").mkdir(exist_ok=True)
    REVIEW.mkdir(exist_ok=True)
    lexicon = {
        "version": 1,
        "accent": "en-US",
        "license": "CC BY-SA 4.0",
        "licenseNote": "Compilation © 2026 Penny Lei, licensed CC BY-SA 4.0 because pronunciations were cross-checked against Wiktionary (CC BY-SA). Cantonese glosses are original. Code is MIT; see LICENSE and the in-app Attributions page.",
        "verified_at": "2026-10-29",
        "conventions": [
            "IPA is converted from the chosen CMUdict ARPAbet.",
            "AH0 → ə, ER0 → ɚ, ER1 → ɝ.",
            "IY immediately before R in the same syllable is the NEAR vowel /ɪ/ (here).",
            "Stress: ˈ primary, ˌ secondary, placed at the start of that syllable.",
            "Audio is Piper en_US ljspeech, espeak voice forced to en-us. Heteronyms use explicit phonemes.",
        ],
        "items": public,
    }
    (OUT / "lexicon.json").write_text(json.dumps(lexicon, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for lesson in lessons:
        (OUT / "lessons" / f"{lesson['id'].lower()}.json").write_text(
            json.dumps(lesson, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    manifest_lines = []
    for lesson in lessons:
        for row in lesson["dialogue"]:
            manifest_lines.append(row)
    for row in extras:
        manifest_lines.append(row)
    (OUT / "lines.json").write_text(json.dumps(manifest_lines, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "path.json").write_text(json.dumps(PATH, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (REVIEW / "flags.json").write_text(
        json.dumps(
            {
                "generated": "2026-10-29",
                "policy": "Disagreements are listed with a resolution. Nothing taught was chosen silently.",
                "items": FLAGS,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"lexicon {len(public)} lessons {len(lessons)} lines {len(manifest_lines)} flags {len(FLAGS)}")


if __name__ == "__main__":
    main()

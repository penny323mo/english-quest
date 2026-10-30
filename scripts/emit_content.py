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


def phone_base(tok: str) -> str:
    return tok[:-1] if tok[-1].isdigit() else tok


# English onsets. NG is never an onset. Medial clusters take the longest
# legal suffix (maximal onset); anything left is the previous syllable's coda.
ONSET2 = {
    ("P", "L"), ("P", "R"), ("B", "L"), ("B", "R"),
    ("T", "R"), ("T", "W"), ("D", "R"), ("D", "W"),
    ("K", "L"), ("K", "R"), ("K", "W"), ("G", "L"), ("G", "R"), ("G", "W"),
    ("F", "L"), ("F", "R"), ("TH", "R"), ("TH", "W"), ("SH", "R"),
    ("S", "P"), ("S", "T"), ("S", "K"), ("S", "M"), ("S", "N"),
    ("S", "L"), ("S", "W"), ("S", "F"),
    # Consonant + /j/ is a normal English onset (cute, few, music).
    ("P", "Y"), ("B", "Y"), ("T", "Y"), ("D", "Y"), ("K", "Y"), ("G", "Y"),
    ("F", "Y"), ("V", "Y"), ("M", "Y"), ("N", "Y"), ("HH", "Y"),
}
ONSET3 = {
    ("S", "P", "L"), ("S", "P", "R"), ("S", "T", "R"),
    ("S", "K", "L"), ("S", "K", "R"), ("S", "K", "W"),
    ("S", "P", "Y"), ("S", "T", "Y"), ("S", "K", "Y"),
}


def legal_onset(bases: tuple[str, ...]) -> bool:
    if not bases:
        return True
    if len(bases) == 1:
        return bases[0] != "NG" and bases[0] in BASE and bases[0] not in VOWELS
    if len(bases) == 2:
        return bases in ONSET2
    if len(bases) == 3:
        return bases in ONSET3
    return False


def longest_legal_onset(cons: list[str]) -> int:
    """Longest legal onset at the end of cons.

    /sm/ and /sn/ are legal English onsets (small, snow) but not after a
    nasal coda: announcement is /ə.ˈnaʊns.mənt/, not /ə.ˈnaʊn.smənt/.
    A lone /s/ after a nasal stays an onset, so agency remains /ˈeɪ.dʒən.si/.
    """
    bases = tuple(phone_base(p) for p in cons)
    for length in (3, 2, 1):
        if len(bases) < length or not legal_onset(bases[-length:]):
            continue
        onset = bases[-length:]
        if onset in {("S", "M"), ("S", "N")}:
            prev = len(bases) - length - 1
            if prev >= 0 and bases[prev] in {"N", "M", "NG"}:
                continue
        return length
    return 0


def resyllabify(phones: list[str]) -> list[list[str]]:
    """One syllable per vowel. Word-initial consonants stay on the first syllable."""
    if not phones:
        return []
    vowels = [i for i, tok in enumerate(phones) if phone_base(tok) in VOWELS]
    if not vowels:
        return [phones]
    cuts = [0]
    for left, right in zip(vowels, vowels[1:]):
        onset = longest_legal_onset(phones[left + 1:right])
        cuts.append(right - onset)
    cuts.append(len(phones))
    return [phones[cuts[i]:cuts[i + 1]] for i in range(len(cuts) - 1)]


def ipa_of(arp: str) -> tuple[str, list[str], int]:
    # Author dots are not trusted: illegal onsets like /ðd/ and /ndl/ came
    # from splitting before a consonant that cannot start an English syllable.
    words = []
    for dotted in split_words(arp):
        flat = [tok for syl in dotted for tok in syl]
        words.append(resyllabify(flat))
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
        "A close friend is here.", "有個好朋友喺度。",
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
        "放鬆", "放松", "fong3 sung1", ["relax and speak"], "Please relax.", "請放鬆吓。")
    add("begin-verb", "begin", "verb", "start", "B IH0 . G IH1 N", ["be", "gin"],
        "開始", "开始", "hoi1 ci2", ["let's begin"], "Let's begin.", "我哋開始。")
    add("keep-verb", "keep", "verb", "continue-state", "K IY1 P", ["keep"],
        "保持", "保持", "bou2 ci4", ["keep it light"], "Keep it light.", "輕輕帶過。")
    add("light-adj", "light", "adj", "not-heavy", "L AY1 T", ["light"],
        "輕巧", "轻", "heng1", ["keep it light"], "Keep it light.", "唔好用力。")
    add("name-noun", "name", "noun", "what-someone-is-called", "N EY1 M", ["name"],
        "名字", "名字", "ming4 zi6", ["my name is"], "My name is Mei.", "我叫 Mei，好高興認識你。")
    add("the-art", "the", "art", "before-consonant", "DH AH0", ["the"],
        "英文冠詞，子音前面弱讀，中文往往唔使譯", "定冠词（弱读）", "", ["the sound", "the menu"],
        "The sound is short.", "個音好短。",
        variants=["/ði/ before a vowel", "/ðiː/ strong"],
        note="子音前面讀 /ðə/。元音前面讀 /ði/，見 the-art-vowel。the 唔係呢個，亦唔係嗰個。")
    add("the-art-vowel", "the", "art", "before-vowel", "DH IY0", ["the"],
        "英文冠詞，元音前面弱讀，中文往往唔使譯", "定冠词（元音前弱读）", "", ["the aisle", "the information"],
        "The aisle seat is free.", "走廊位仲有。",
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
        "Good afternoon.", "你好。")
    add("evening-noun", "evening", "noun", "late-day", "IY1 V . N IH0 NG", ["eve", "ning"],
        "夜晚", "晚上", "je6 maan5", ["good evening"], "Good evening.", "你好。")
    add("my-det", "my", "det", "belonging-to-me", "M AY1", ["my"],
        "我嘅", "我的", "ngo5 ge3", ["my name", "my passport"], "My name is Ling.", "我叫 Ling，好高興認識你。")
    add("nice-adj", "nice", "adj", "pleasant", "N AY1 S", ["nice"],
        "好；親切", "好", "hou2", ["nice to meet you", "a nice ring"],
        "Nice to meet you.", "好高興認識你。",
        note="CMU 嘅 N IY1 S 係城市 Nice，唔係呢個意思。")
    add("meet-verb", "meet", "verb", "come-together", "M IY1 T", ["meet"],
        "見；認識", "见面", "gin3", ["nice to meet you"], "Nice to meet you.", "好高興認識你。")
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
        "先生（客氣）", "先生", "sin1 saang1", ["yes, sir"], "Yes, sir.", "好嘅，先生。",
        piper="Yes, [[sˈɝ]].")
    add("madam-noun", "madam", "noun", "polite-woman", "M AE1 D . AH0 M", ["mad", "am"],
        "女士（客氣）", "女士", "neoi5 si6", ["yes, madam"], "Yes, madam.", "好嘅，小姐。",
        note="madam 係英文嘅客氣稱呼。舖頭應客可以講小姐或者太太，唔好直譯做女士。")
    add("welcome-verb", "welcome", "verb", "greet-in", "W EH1 L . K AH0 M", ["wel", "come"],
        "歡迎", "欢迎", "fun1 jing4", ["welcome to", "you're welcome"],
        "Welcome to our jewellery store.", "歡迎嚟到我哋嘅珠寶店。",
        piper="Welcome to our [[dʒˈulɹi]] store.")
    add("a-art", "a", "art", "indefinite-before-consonant", "AH0", ["a"],
        "一個（子音前面，弱讀）", "一个", "jat1 go3", ["a table", "a seat"],
        "A table for two.", "一張兩位嘅檯。",
        piper="[[ə ˈteɪbəl fɚ ˈtu.]]",
        variants=["/eɪ/ letter name"],
        note="冠詞讀 /ə/。字母名先至係 /eɪ/。")
    add("a-letter", "a", "noun", "letter-name", "EY1", ["a"],
        "英文字母 A", "字母 A", "zi6 mou5", ["the letter a"],
        "The letter a says its name.", "字母 A 讀自己個名。",
        piper="The letter [[ˈeɪ]] says its name.")
    add("of-prep", "of", "prep", "belonging", "AH1 V", ["of"],
        "嘅；屬於", "的", "ge3", ["of course", "a table of"],
        "Of course.", "當然可以。",
        variants=["/əv/ weak, as in of course"],
        note="單字引用讀 /ʌv/。片語 of course 通常弱讀 /əv/。")
    add("to-prep", "to", "prep", "toward", "T AH0", ["to"],
        "去；對", "到", "heoi3", ["to the gate", "nice to meet you"],
        "I am flying to Hong Kong.", "我飛去香港。",
        variants=["/tu/ strong", "/tɪ/ weak"],
        note="例句同多數句子弱讀 /tə/。單獨強調先至係 /tu/。")
    add("for-prep", "for", "prep", "intended-for", "F AO1 R", ["for"],
        "畀；為咗", "给；为了", "bei2", ["for you", "for two"],
        "Something for my wife.", "送畀我太太。",
        variants=["/fɚ/ weak"])
    add("in-prep", "in", "prep", "inside", "IH1 N", ["in"],
        "入面", "在…里", "jap6 min6", ["in Macau", "come in"],
        "I live in Macau.", "我住喺澳門。")
    add("on-prep", "on", "prep", "on-surface-or-time", "AA1 N", ["on"],
        "喺…上面；準時", "在…上", "hai2 soeng6 min6", ["on time"],
        "Your flight is on time.", "你嘅航班準時。")
    add("i-pron", "I", "pron", "first-person", "AY1", ["I"],
        "我", "我", "ngo5", ["I am", "I'm just looking"],
        "I'm just looking.", "我睇吓先。",
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
        "Do you have a reservation?", "你有冇訂位呀？")
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
        "Here is my passport.", "呢本係我嘅護照。",
        note="CMU 用 IY+R 記 NEAR 元音。教學 IPA 寫 /hɪr/。")
    add("just-adv", "just", "adv", "only", "JH AH1 S T", ["just"],
        "只係", "只是", "zi2 hai6", ["just looking"],
        "I'm just looking.", "我睇吓先。")
    add("today-adv", "today", "adv", "this-day", "T AH0 . D EY1", ["to", "day"],
        "今日", "今天", "gam1 jat6", ["help you today"],
        "How may I help you today?", "今日有咩可以幫到你？")
    add("very-adv", "very", "adv", "intensifier", "V EH1 . R IY0", ["ver", "y"],
        "好（加強）", "非常", "hou2", ["very nice"],
        "We have a very nice ring.", "我哋有一隻好靚嘅戒指。",
        note="開頭係 /v/，下唇輕碰上排牙，唔好讀成 w。")
    add("have-verb", "have", "verb", "possess", "HH AE1 V", ["have"],
        "有", "有", "jau5", ["do you have", "we have"],
        "Do you have a reservation?", "你有冇訂位呀？",
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
        "I want something for my wife.", "我想買樣嘢畀太太。",
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
        "I'm just looking.", "我睇吓先。")
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
        "Let me know if you need anything.", "有咩需要就話我知。")
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
        "I want something for my wife.", "我想買樣嘢畀太太。",
        note="中間有 /θ/。")
    add("course-noun", "course", "noun", "of-course", "K AO1 R S", ["course"],
        "當然（of course）", "当然", "dong1 jin4", ["of course"],
        "Of course.", "當然可以。",
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
        "Please take a look around.", "隨便睇吓。")
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
    add("bracelet-noun", "bracelet", "noun", "wrist-jewel", "B R EY1 . S L AH0 T", ["brace", "let"],
        "手鏈", "手链", "sau2 lin2", ["this bracelet"],
        "This bracelet is beautiful.", "呢條手鏈好靚。",
        piper="This [[bɹˈeɪslət]] is beautiful.",
        note="兩個音節，重音喺第一節。尾音 /t/ 要收住。錄音用 /slət/，唔好讀成 /slɪt/。")
    add("earring-noun", "earring", "noun", "ear-jewel", "IH1 R . IH0 NG", ["ear", "ring"],
        "耳環", "耳环", "ji5 waan4", ["a pearl earring"],
        "I like this earring.", "我鍾意呢隻耳環。",
        variants=["/ˈiɹ.ɪŋ/"],
        note="CMU 另有 /ˈiɹ.ɪŋ/。卡片教 /ˈɪɹ.ɪŋ/，重音喺第一節。")
    add("pair-noun", "pair", "noun", "matched-two", "P EH1 R", ["pair"],
        "一對", "一对", "jat1 deoi3", ["a pair of earrings"],
        "A pair of earrings.", "一對耳環。",
        piper="A pair [[əv]] earrings.",
        note="美式 /pɛɹ/。唔好同 pearl（珍珠）撈亂。")
    add("pearl-noun", "pearl", "noun", "gem", "P ER1 L", ["pearl"],
        "珍珠", "珍珠", "zan1 zyu1", ["a pearl earring"],
        "This is a pearl earring.", "呢隻係珍珠耳環。",
        note="美式 /pɝl/，一個音節。有人會加一個好輕嘅 schwa，卡片跟 CMU。")
    add("these-det", "these", "det", "plural-near", "DH IY1 Z", ["these"],
        "呢啲", "这些", "ni1 di1", ["these earrings"],
        "These earrings are beautiful.", "呢啲耳環好靚。",
        note="長 /i/，尾有聲 /z/。this 先至係短 /ɪ/ 加 /s/。")
    add("wife-noun", "wife", "noun", "spouse", "W AY1 F", ["wife"],
        "太太", "太太", "taai3 taai2", ["for my wife"],
        "Something for my wife.", "送畀我太太。")
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
        "Here is my passport.", "呢本係我嘅護照。")
    add("window-noun", "window", "noun", "window", "W IH1 N . D OW0", ["win", "dow"],
        "窗", "窗", "coeng1", ["window seat", "by the window"],
        "A window seat, please.", "要靠窗位，唔該。")
    add("aisle-noun", "aisle", "noun", "passage-seat", "AY1 L", ["aisle"],
        "走廊位", "走廊位", "zau2 long4 wai2", ["window or aisle"],
        "Window or aisle?", "靠窗定係走廊位？",
        note="s 唔發音。讀 /aɪl/。座位叫走廊位，旁邊條路先叫通道。")
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
        "訂位", "预订", "deng6 wai2", ["have a reservation"],
        "Do you have a reservation?", "你有冇訂位呀？",
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
        "This is great.", "呢度真係好好。",
        note="開頭有 /r/。")
    add("bring-verb", "bring", "verb", "carry-here", "B R IH1 NG", ["bring"],
        "攞嚟", "拿来", "lo2 lai4", ["bring the menu"],
        "I'll bring the menu.", "我攞餐牌嚟。")
    add("menu-noun", "menu", "noun", "list-of-dishes", "M EH1 N . Y UW0", ["men", "u"],
        "餐牌", "菜单", "caan1 paai4", ["the menu"],
        "I'll bring the menu.", "我攞餐牌嚟。")
    add("order-verb", "order", "verb", "place-order", "AO1 R . D ER0", ["or", "der"],
        "叫（落單）", "点餐", "giu3", ["like to order"],
        "What would you like to order?", "你想叫咩？",
        note="美式 /ˈɔɹ.dɚ/。開頭圓唇，中間有 /ɹ/。")
    add("recommend-verb", "recommend", "verb", "suggest-dish", "R EH2 . K AH0 . M EH1 N D", ["re", "com", "mend"],
        "推薦", "推荐", "teoi1 zin3", ["what do you recommend"],
        "What do you recommend?", "你推薦咩？",
        note="重音喺第三節 mend。唔好讀成第一節。")
    add("else-adv", "else", "adv", "additional", "EH1 L S", ["else"],
        "其他", "其他", "kei4 taa1", ["anything else"],
        "Anything else?", "仲有冇其他？",
        note="尾音 /s/ 要留低。")
    add("water-noun", "water", "noun", "drink-water", "W AO1 . T ER0", ["wa", "ter"],
        "水", "水", "seoi2", ["some water"],
        "I'd like some water, please.", "我想要杯水，唔該。",
        variants=["/ˈwɑ.tɚ/"],
        note="CMU 係 /ˈwɔ.tɚ/。有人讀 /ˈwɑ.tɚ/。美式中間嘅 /t/ 常常輕輕一拍。")
    add("coffee-noun", "coffee", "noun", "coffee-drink", "K AA1 . F IY0", ["cof", "fee"],
        "咖啡", "咖啡", "gaa3 fe1", ["a coffee please"],
        "I'd like a coffee, please.", "我想要杯咖啡，唔該。",
        variants=["/ˈkɔ.fi/"],
        piper="I'd like [[ə kˈɑfi]] , please.",
        note="CMU 第一條 /ˈkɑ.fi/，第二條 /ˈkɔ.fi/。卡片教第一條。錄音用 /ɑ/。")
    add("tea-noun", "tea", "noun", "tea-drink", "T IY1", ["tea"],
        "茶", "茶", "caa4", ["tea please"],
        "I'd like tea, please.", "我想要杯茶，唔該。")
    add("chicken-noun", "chicken", "noun", "chicken-dish", "CH IH1 . K AH0 N", ["chick", "en"],
        "雞", "鸡", "gai1", ["the chicken please"],
        "I'd like the chicken, please.", "我想叫雞，唔該。",
        piper="I'd like the [[tʃˈɪkən]] , please.",
        note="兩個音節，重音喺第一節。第二節係 /ən/，唔好讀成 /ɪn/。開頭 /tʃ/，唔係 /ʃ/。")
    add("fish-noun", "fish", "noun", "fish-dish", "F IH1 SH", ["fish"],
        "魚", "鱼", "jyu4", ["the fish"],
        "I recommend the fish.", "我推薦魚。",
        note="一個音節。尾音 /ʃ/。")
    add("can-verb", "can", "verb", "modal-weak", "K AH0 N", ["can"],
        "可以（弱讀）", "可以", "ho2 ji5", ["can I have"],
        "Can I have some water, please?", "可唔可以畀我杯水？",
        variants=["/kæn/ stressed"],
        piper="[[kən]] I have some water, please.",
        note="問句入面通常好輕 /kən/，冇重音。重讀先至係 /kæn/。呢張卡教弱讀，因為 Can I have 就係咁讀。")
    add("cant-verb", "can't", "verb", "modal-negative", "K AE1 N T", ["can't"],
        "唔可以", "不可以", "m4 ho2 ji5", ["I can't"],
        "I can't eat fish.", "我食唔到魚。",
        note="有尾 /t/。食咗尾音就會聽成 can。")
    add("ready-adj", "ready", "adj", "prepared", "R EH1 . D IY0", ["rea", "dy"],
        "準備好", "准备好", "zeon2 bei6 hou2", ["are you ready"],
        "Are you ready?", "你準備好未？")
    add("red-adj", "red", "adj", "color", "R EH1 D", ["red"],
        "紅色", "红色", "hung4 sik1", ["red wine"],
        "The seat is red.", "呢個位係紅色。",
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
        "I'll be right with you.", "我即刻嚟招呼你。",
        piper="I'll be right [[wˈɪθ]] you.",
        note="呢張卡只練清音變體，唔係唯一標準音。主卡係 with-prep /wɪð/。")
    add("sank-verb", "sank", "verb", "past-of-sink", "S AE1 NG K", ["sank"],
        "沉咗（對比 thank）", "下沉（过去）", "cam4", ["the boat sank"],
        "The boat sank.", "一艘船沉咗。",
        note="對比組。唔好用嚟代替 thank。")
    add("tank-noun", "tank", "noun", "container", "T AE1 NG K", ["tank"],
        "箱；缸", "箱", "soeng1", ["a water tank"],
        "A water tank.", "一個水缸。")
    add("think-verb", "think", "verb", "have-opinion", "TH IH1 NG K", ["think"],
        "諗", "想", "nam2", ["I think"], "I think so.", "我諗係。")
    add("sink-noun", "sink", "noun", "basin", "S IH1 NG K", ["sink"],
        "洗碗盆", "水槽", "sai2 wun2 pun4", ["the sink"], "The sink is full.", "洗碗盆滿咗。")
    add("three-num", "three", "num", "3", "TH R IY1", ["three"],
        "三", "三", "saam1", ["table for three"], "A table for three.", "一張三位嘅檯。",
        note="係 /θ/，唔係 /f/。")
    add("tree-noun", "tree", "noun", "plant", "T R IY1", ["tree"],
        "樹", "树", "syu6", ["a tree"], "A tree by the door.", "門口有棵樹。")
    add("sheet-noun", "sheet", "noun", "paper", "SH IY1 T", ["sheet"],
        "一張紙", "一张纸", "jat1 zoeng1 zi2", ["a sheet of paper"],
        "A sheet of paper.", "呢度有一張紙。")
    add("cheat-verb", "cheat", "verb", "deceive", "CH IY1 T", ["cheat"],
        "呃（對比 sheet）", "欺骗", "ngaak1", ["don't cheat"],
        "Don't cheat.", "唔好呃。",
        note="對比組：/tʃ/ 對 /ʃ/。")
    add("shoe-noun", "shoe", "noun", "footwear", "SH UW1", ["shoe"],
        "鞋", "鞋", "haai4", ["a shoe"], "I need a new shoe.", "我要一隻新鞋。")
    add("chew-verb", "chew", "verb", "masticate", "CH UW1", ["chew"],
        "嚼", "嚼", "zoek3", ["chew slowly"], "Chew slowly.", "慢慢嚼。")
    add("me-pron", "me", "pron", "object-me", "M IY1", ["me"],
        "我（賓語）", "我", "ngo5", ["let me know", "show me"],
        "Let me know if you need anything.", "有咩需要就話我知。")
    add("go-verb", "go", "verb", "move", "G OW1", ["go"],
        "去", "去", "heoi3", ["go to the gate"], "Please go to the gate.", "請去閘口。")
    add("or-conj", "or", "conj", "alternative", "AO1 R", ["or"],
        "或者", "或者", "waak6 ze2", ["window or aisle"],
        "Window or aisle?", "靠窗定係走廊位？")
    add("free-adj", "free", "adj", "available", "F R IY1", ["free"],
        "空嘅；仲有位", "空着", "hung1", ["the seat is free"],
        "The aisle seat is free.", "走廊位仲有。",
        note="呢度係座位仲有，唔係免費。")

    # --- T2 security and directions ---
    add("bin-noun", "bin", "noun", "security-bin", "B IH1 N", ["bin"],
        "膠盤", "安检盘", "gaau1 pun4", ["in the bin", "a security bin"],
        "Put the liquids in the bin.", "將啲液體放喺個盤度。",
        note="安檢用嘅膠盤，唔係垃圾桶。")
    add("liquid-noun", "liquid", "noun", "liquid", "L IH1 K . W IH0 D", ["liq", "uid"],
        "液體", "液体", "jik6 tai2", ["liquids in the bin"],
        "Put the liquids in the bin.", "將啲液體放喺個盤度。",
        variants=["/ˈlɪk.wəd/"],
        piper="Put the [[lˈɪkwɪdz]] in the bin.",
        note="CMU 有 /ˈlɪk.wɪd/ 同 /ˈlɪk.wəd/。卡片教 /ɪ/ 嗰條。錄音跟卡片。")
    add("laptop-noun", "laptop", "noun", "laptop", "L AE1 P . T AA2 P", ["lap", "top"],
        "手提電腦", "笔记本电脑", "sau2 tai4 din6 nou5", ["my laptop"],
        "Here is my laptop.", "我部手提電腦喺度。",
        piper="Here is my [[lˈæpˌtɑp]].",
        note="兩個音節。重音喺 lap，top 有次重音。")
    add("belt-noun", "belt", "noun", "waist-belt", "B EH1 L T", ["belt"],
        "腰帶", "腰带", "jiu1 daai3", ["take off your belt"],
        "Please take off your belt.", "唔該除咗條腰帶。",
        note="有 /l/。同 left 一樣，元音係 /ɛ/。")
    add("straight-adv", "straight", "adv", "directly", "S T R EY1 T", ["straight"],
        "直行", "直行", "zik6 hang4", ["go straight"],
        "Go straight ahead.", "直行就得。",
        note="元音係 /eɪ/。唔好讀成 street 嘅 /i/。")
    add("ahead-adv", "ahead", "adv", "in-front", "AH0 . HH EH1 D", ["a", "head"],
        "前面", "前面", "cin4 min6", ["straight ahead"],
        "The gate is straight ahead.", "閘口就喺前面。",
        note="兩個音節。第一個音好輕 /ə/，重音喺 head。")
    add("which-det", "which", "det", "which-choice", "W IH1 CH", ["which"],
        "邊個", "哪个", "bin1 go3", ["which way"],
        "Which way to the gate?", "去閘口邊邊行？",
        variants=["/hwɪtʃ/"],
        note="美式多數讀 /wɪtʃ/。有人保留 /hw/。卡片教 /w/。")
    add("left-adv", "left", "adv", "left-side", "L EH1 F T", ["left"],
        "左邊", "左边", "zo2 bin6", ["on the left"],
        "Your gate is on the left.", "你個閘口喺左邊。",
        note="開頭 /l/，元音 /ɛ/。同 lift 只差個元音。")
    add("lift-noun", "lift", "noun", "elevator", "L IH1 F T", ["lift"],
        "升降機", "电梯", "sing1 gong3 gei1", ["the lift"],
        "Take the lift on the left.", "左邊有部升降機。",
        note="對比組。/lɪft/ 係升降機。left /lɛft/ 係左邊。")
    add("street-noun", "street", "noun", "city-street", "S T R IY1 T", ["street"],
        "街", "街", "gaai1", ["on the street"],
        "This is not the street.", "呢度唔係條街。",
        note="對比組。street 係長 /i/。straight 先至係 /eɪ/。")
    add("security-noun", "security", "noun", "airport-security", "S IH0 . K Y UH1 R . AH0 . T IY0", ["se", "cu", "ri", "ty"],
        "安檢", "安检", "on1 gim2", ["at security"],
        "Security is this way.", "安檢喺呢邊。",
        variants=["/sə.ˈkjʊɹ.ə.ti/"],
        piper="[[sɪkjˈʊɹəti]] is this way.",
        note="四個音節。CMU 第一個音係 /sɪ/。有人讀成 /sə/。卡片跟 CMU。")
    add("which-way-phrase", "which way", "phrase", "which-direction", "W IH1 CH | W EY1", ["which", "way"],
        "邊邊行", "往哪边", "bin1 bin1 haang4", ["which way to the gate"],
        "Which way to the gate?", "去閘口邊邊行？", phrase=True)
    add("straight-ahead-phrase", "straight ahead", "phrase", "straight-on", "S T R EY1 T | AH0 . HH EH1 D", ["straight", "a", "head"],
        "直行", "直行", "zik6 hang4", ["go straight ahead"],
        "Go straight ahead, please.", "唔該直行。", phrase=True)

    # phrases
    add("thank-you-phrase", "thank you", "phrase", "thanks", "TH AE1 NG K | Y UW1", ["thank", "you"],
        "多謝", "谢谢", "do1 ze6", ["thank you so much"],
        "Thank you.", "多謝。", phrase=True)
    add("of-course-phrase", "of course", "phrase", "yes-politely", "AH0 V | K AO1 R S", ["of", "course"],
        "當然", "当然", "dong1 jin4", ["of course, take a look"],
        "Of course.", "當然可以。", phrase=True,
        piper="[[əv kˈɔɹs.]]",
        note="of 喺呢度弱讀 /əv/。錄音用同一個弱讀，唔係單獨唸 of 嗰個 /ʌv/。")
    add("good-morning-phrase", "good morning", "phrase", "morning-greeting", "G UH1 D | M AO1 R . N IH0 NG", ["good", "mor", "ning"],
        "早晨", "早上好", "zou2 san4", ["good morning, Mei"],
        "Good morning.", "早晨。", phrase=True)
    add("nice-to-meet-phrase", "nice to meet you", "phrase", "introduction", "N AY1 S | T AH0 | M IY1 T | Y UW1", ["nice", "to", "meet", "you"],
        "好高興認識你", "很高兴认识你", "hou2 gou1 hing3 jing6 sik1 nei5", ["nice to meet you too"],
        "Nice to meet you.", "好高興認識你。", phrase=True,
        note="to 弱讀 /tə/。")
    add("just-looking-phrase", "just looking", "phrase", "not-buying-yet", "JH AH1 S T | L UH1 K . IH0 NG", ["just", "look", "ing"],
        "睇吓先", "只是看看", "tai2 haa5 sin1", ["I'm just looking"],
        "I'm just looking.", "我睇吓先。", phrase=True)
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
        "Let me know if you need anything.", "有咩需要就話我知。", phrase=True)

    # F3 numbers, money, time. F4 politeness. Contrast words for the sound beats.
    add("four-num", "four", "num", "4", "F AO1 R", ["four"],
        "四", "四", "sei3", ["four dollars", "four o'clock"],
        "I have four.", "我有四個。")
    add("five-num", "five", "num", "5", "F AY1 V", ["five"],
        "五", "五", "ng5", ["five dollars", "at five"],
        "It is five dollars.", "呢件係五蚊。",
        note="尾音收到 /v/。唔好食咗，變成 fine。")
    add("six-num", "six", "num", "6", "S IH1 K S", ["six"],
        "六", "六", "luk6", ["six dollars"],
        "It is six dollars.", "呢件係六蚊。",
        note="尾音係 /ks/。唔好變成 sick。")
    add("seven-num", "seven", "num", "7", "S EH1 . V AH0 N", ["sev", "en"],
        "七", "七", "cat1", ["seven dollars"],
        "It opens at seven.", "七點鐘開門。")
    add("eight-num", "eight", "num", "8", "EY1 T", ["eight"],
        "八", "八", "baat3", ["eight dollars"],
        "It opens at eight.", "八點鐘開門。")
    add("nine-num", "nine", "num", "9", "N AY1 N", ["nine"],
        "九", "九", "gau2", ["nine dollars"],
        "It opens at nine.", "九點鐘開門。")
    add("ten-num", "ten", "num", "10", "T EH1 N", ["ten"],
        "十", "十", "sap6", ["ten dollars"],
        "It opens at ten.", "十點鐘開門。",
        note="尾音 /n/ 要留低。")
    add("dollar-noun", "dollar", "noun", "currency", "D AA1 L . ER0", ["dol", "lar"],
        "蚊", "元", "man1", ["ten dollars", "one dollar"],
        "It is ten dollars.", "一共係十蚊。",
        variants=["/ˈdɔ.lɚ/"],
        note="教 CMU 第一條 /ˈdɑl.ɚ/，同 Wiktionary 美式 /ˈdɑ.lɚ/ 同一個元音。CMU 第二條 /ˈdɔ.lɚ/ 標做變體。")
    add("money-noun", "money", "noun", "funds", "M AH1 . N IY0", ["mon", "ey"],
        "錢", "钱", "cin4", ["some money"],
        "I don't have enough money.", "我冇帶夠錢。")
    add("how-adv", "how", "adv", "what-way", "HH AW1", ["how"],
        "點樣", "怎样", "dim2 joeng2", ["how much", "how are you"],
        "How much is this?", "呢個幾多錢？")
    add("much-adv", "much", "adv", "quantity", "M AH1 CH", ["much"],
        "幾多", "多少", "gei2 do1", ["how much"],
        "How much is the ring?", "隻戒指幾多錢？")
    add("clock-noun", "clock", "noun", "timepiece", "K L AA1 K", ["clock"],
        "鐘", "钟", "zung1", ["the clock", "o'clock"],
        "Look at the clock.", "睇吓個鐘。")
    add("oclock-adv", "o'clock", "adv", "on-the-hour", "AH0 . K L AA1 K", ["o", "clock"],
        "點", "点", "dim2", ["three o'clock", "five o'clock"],
        "It is three o'clock.", "而家係三點。")
    add("price-noun", "price", "noun", "cost", "P R AY1 S", ["price"],
        "價錢", "价钱", "gaa3 cin4", ["the price"],
        "The price is ten dollars.", "價錢係十蚊。")
    add("minute-noun", "minute", "noun", "sixty-seconds", "M IH1 N . AH0 T", ["min", "ute"],
        "分鐘", "分钟", "fan1 zung1", ["one minute", "wait a minute"],
        "Wait a minute.", "等陣。",
        piper="[[wˈeɪt ə mˈɪnət]]",
        note="時間嗰個讀音。CMU 另有形容詞「極細」M AY0 N UW1 T，呢張卡唔教。")
    add("hour-noun", "hour", "noun", "sixty-minutes", "AW1 . ER0", ["hour"],
        "個鐘", "小时", "go3 zung1", ["one hour"],
        "I waited for one hour.", "我等咗一個鐘。",
        join_syllables=True,
        variants=["/ˈaʊɹ/"],
        note="CMU 第一條 AW1 ER0，卡片 /ˈaʊ.ɚ/，同 Wiktionary 美式 /aʊɚ/。第二條 AW1 R 係 /ˈaʊɹ/，標做變體。")
    add("now-adv", "now", "adv", "this-moment", "N AW1", ["now"],
        "而家", "现在", "ji4 gaa1", ["right now"],
        "What time is it now?", "而家幾點？")
    add("fine-adj", "fine", "adj", "satisfactory", "F AY1 N", ["fine"],
        "幾好", "还好", "gei2 hou2", ["I am fine"],
        "I am fine.", "我幾好。",
        note="對比組。尾音係 /n/，唔係 five 嘅 /v/。")
    add("sick-adj", "sick", "adj", "ill", "S IH1 K", ["sick"],
        "病", "病", "beng6", ["I am sick"],
        "I am sick.", "我病咗。",
        note="對比組。冇 six 尾嗰個 /s/。")
    add("excuse-verb", "excuse", "verb", "forgive", "IH0 K . S K Y UW1 Z", ["ex", "cuse"],
        "借借；原諒", "原谅", "ze3 ze3", ["excuse me"],
        "Excuse me.", "唔該借借。",
        piper="[[ɪkskjˈuz]] me.",
        note="Excuse me 用動詞，尾音 /z/。名詞「藉口」先至係 /s/。Wiktionary 美式動詞 /ɪksˈkjuz/，名詞 /ɪksˈkjus/。錄音強制動詞，因為 Piper 讀個串法會變成名詞。")
    add("sorry-adj", "sorry", "adj", "apologetic", "S AA1 . R IY0", ["sor", "ry"],
        "對唔住", "对不起", "deoi3 m4 zyu6", ["I'm sorry"],
        "I'm sorry.", "對唔住。",
        variants=["/ˈsɔ.ɹi/"],
        note="卡片跟 CMU 同 Wiktionary 美式主條 /ˈsɑ.ɹi/。Simple English Wiktionary 亦列美式 /ˈsɔ.ɹi/，標做變體。")
    add("pardon-verb", "pardon", "verb", "ask-pardon", "P AA1 R . D AH0 N", ["par", "don"],
        "唔該再講一次", "请再说一遍", "m4 goi1 zoi3 gong2 jat1 ci3", ["pardon me"],
        "Pardon me.", "唔該再講一次。")
    add("night-noun", "night", "noun", "nighttime", "N AY1 T", ["night"],
        "夜晚", "夜晚", "je6 maan5", ["good night", "at night"],
        "Good night.", "晚安。",
        note="對比組。開頭係 /n/，light 係 /l/。")
    add("net-noun", "net", "noun", "mesh", "N EH1 T", ["net"],
        "網", "网", "mong5", ["a net"],
        "A fishing net.", "一張漁網。",
        note="對比組。開頭係 /n/，let 係 /l/。")
    add("how-much-phrase", "how much", "phrase", "ask-price", "HH AW1 | M AH1 CH", ["how", "much"],
        "幾多錢", "多少钱", "gei2 do1 cin4", ["how much is this"],
        "How much is this?", "呢個幾多錢？", phrase=True)
    add("excuse-me-phrase", "excuse me", "phrase", "get-attention", "IH0 K . S K Y UW1 Z | M IY1", ["ex", "cuse", "me"],
        "唔該借借", "不好意思", "m4 goi1 ze3 ze3", ["excuse me"],
        "Excuse me.", "唔該借借。", phrase=True,
        piper="[[ɪkskjˈuz]] me.")
    add("im-sorry-phrase", "I'm sorry", "phrase", "apology", "AY1 M | S AA1 . R IY0", ["I'm", "sor", "ry"],
        "對唔住", "对不起", "deoi3 m4 zyu6", ["I'm sorry"],
        "I'm sorry.", "對唔住。", phrase=True)
    add("youre-welcome-phrase", "you're welcome", "phrase", "reply-thanks", "Y UH1 R | W EH1 L . K AH0 M", ["you're", "wel", "come"],
        "唔使客氣", "不客气", "m4 sai2 haak3 hei3", ["you're welcome"],
        "You're welcome.", "唔使客氣。", phrase=True)
    add("good-night-phrase", "good night", "phrase", "farewell-night", "G UH1 D | N AY1 T", ["good", "night"],
        "晚安", "晚安", "maan5 on1", ["good night"],
        "Good night.", "晚安。", phrase=True)
    from round19_content import add_items
    add_items(add)
    from round20_content import add_items as add_items20
    add_items20(add)


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
    {
        "id": "dollar-noun",
        "lemma": "dollar",
        "pos": "noun",
        "cmudict": ["D AA1 L ER0 /ˈdɑl.ɚ/", "D AO1 L ER0 /ˈdɔ.lɚ/"],
        "wiktionary": ["GA /ˈdɑ.lɚ/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists a second US vowel /ɔ/. Wiktionary General American lists only /ˈdɑ.lɚ/.",
        "resolution": "Teach CMU's first entry, the /ɑ/ vowel, which matches Wiktionary GA. /ˈdɔ.lɚ/ stays a labelled variant. The example audio is Piper's /dɑ/.",
        "resolved": True,
        "taughtIpa": "/ˈdɑl.ɚ/",
        "resolvedBy": "round-11 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "hour-noun",
        "lemma": "hour",
        "pos": "noun",
        "cmudict": ["AW1 ER0 /ˈaʊ.ɚ/", "AW1 R /ˈaʊɹ/"],
        "wiktionary": ["US /aʊɚ/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU's second entry is a consonantal /ɹ/. Wiktionary's US entry is the rhotic vowel /aʊɚ/.",
        "resolution": "Teach CMU's first entry AW1 ER0 as /ˈaʊ.ɚ/, matching Wiktionary US. /ˈaʊɹ/ is a variant.",
        "resolved": True,
        "taughtIpa": "/ˈaʊ.ɚ/",
        "resolvedBy": "round-11 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "minute-noun",
        "lemma": "minute",
        "pos": "noun",
        "cmudict": ["M IH1 N AH0 T time", "M AY0 N UW1 T tiny", "M AY0 N Y UW1 T tiny"],
        "wiktionary": ["time /ˈmɪnɪt/", "adjective US /maɪˈn(j)uːt/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "Same spelling, two senses. The time noun is CMU's first entry. Wiktionary writes the unstressed vowel as /ɪ/; CMU writes AH0, which this app maps to /ə/.",
        "resolution": "Teach the time sense only. The card IPA follows CMU via AH0 → /ə/, so /ˈmɪ.nət/. The mp3 is phoneme-forced to that vowel, not the adjective and not Piper's default /ˈmɪnɪt/.",
        "resolved": True,
        "taughtIpa": "/ˈmɪ.nət/",
        "resolvedBy": "round-11 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "excuse-verb",
        "lemma": "excuse",
        "pos": "verb",
        "cmudict": ["IH0 K S K Y UW1 S noun /ɪkˈskjus/", "IH0 K S K Y UW1 Z verb /ɪkˈskjuz/"],
        "wiktionary": ["verb US /ɪksˈkjuz/", "noun US /ɪksˈkjus/", "excuse me /ɪksˈkjuz mi/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists the noun /s/ first and the verb /z/ second. Excuse me is the verb. Piper's default reading of the spelling is the noun /s/.",
        "resolution": "Teach the verb /z/. Every Excuse me clip is phoneme-forced to [[ɪkskjˈuz]] so it cannot say the noun.",
        "resolved": True,
        "taughtIpa": "/ɪk.ˈskjuz/",
        "resolvedBy": "round-11 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "sorry-adj",
        "lemma": "sorry",
        "pos": "adj",
        "cmudict": ["S AA1 R IY0 /ˈsɑ.ɹi/"],
        "wiktionary": ["GA /ˈsɑɹi/", "Simple English Wiktionary also lists US /ˈsɔːri/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU and Wiktionary's main GA line agree on /ɑ/. A second US vowel /ɔ/ is listed on Simple English Wiktionary and is not in CMU.",
        "resolution": "Teach CMU /ˈsɑ.ɹi/, which is Wiktionary's GA primary. Note /ˈsɔ.ɹi/ as a variant. Audio is Piper's /sɑ/.",
        "resolved": True,
        "taughtIpa": "/ˈsɑ.ɹi/",
        "resolvedBy": "round-11 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "earring-noun",
        "lemma": "earring",
        "pos": "noun",
        "cmudict": ["IH1 R IH0 NG /ˈɪɹ.ɪŋ/", "IY1 R IH0 NG /ˈiɹ.ɪŋ/"],
        "wiktionary": ["GA /ˈɪɹ.ɪŋ/", "also /ˈɪə.ɹɪŋ/ in British entries"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists a tense first vowel /i/ as a second US reading. Wiktionary's General American line is the lax /ɪ/.",
        "resolution": "Teach CMU's first entry /ˈɪɹ.ɪŋ/, which matches Wiktionary GA. /ˈiɹ.ɪŋ/ stays a labelled variant. Audio is Piper's reading of the example sentence.",
        "resolved": True,
        "taughtIpa": "/ˈɪɹ.ɪŋ/",
        "resolvedBy": "round-13 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "pair-noun",
        "lemma": "pair",
        "pos": "noun",
        "cmudict": ["P EH1 R /pɛɹ/"],
        "wiktionary": ["GA /pɛɹ/", "British /peə/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "British sources use /peə/. CMU and General American use /pɛɹ/, the same pattern as pear.",
        "resolution": "Teach the American /pɛɹ/. The card tells learners not to mix it up with pearl /pɝl/.",
        "resolved": True,
        "taughtIpa": "/ˈpɛɹ/",
        "resolvedBy": "round-13 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "pearl-noun",
        "lemma": "pearl",
        "pos": "noun",
        "cmudict": ["P ER1 L /pɝl/"],
        "wiktionary": ["GA /pɝl/"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "Merriam-Webster prints an optional schwa, /ˈpər(-ə)l/. CMU and Wiktionary GA are one syllable.",
        "resolution": "Teach the one-syllable CMU form /pɝl/. The optional schwa is noted, not taught as the main form.",
        "resolved": True,
        "taughtIpa": "/ˈpɝl/",
        "resolvedBy": "round-13 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "coffee-noun",
        "lemma": "coffee",
        "pos": "noun",
        "cmudict": ["K AA1 F IY0 /ˈkɑ.fi/", "K AO1 F IY0 /ˈkɔ.fi/"],
        "wiktionary": ["not re-fetched this round"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMUdict lists two American vowels for coffee: /ɑ/ first and /ɔ/ second.",
        "resolution": "Teach CMU's first entry /ˈkɑ.fi/. /ˈkɔ.fi/ stays a labelled variant. The clip is forced to /ɑ/ so it matches the card.",
        "resolved": True,
        "taughtIpa": "/ˈkɑ.fi/",
        "resolvedBy": "round-14 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "water-noun",
        "lemma": "water",
        "pos": "noun",
        "cmudict": ["W AO1 T ER0 /ˈwɔ.tɚ/"],
        "wiktionary": ["not re-fetched this round"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "This CMU file has only /ˈwɔ.tɚ/. A widespread American /ˈwɑ.tɚ/ is not listed there. The middle /t/ is often a flap.",
        "resolution": "Teach the CMU form /ˈwɔ.tɚ/. Note /ˈwɑ.tɚ/ as a variant, and tell learners the American /t/ is often a light tap. Audio is Piper's reading of the example.",
        "resolved": True,
        "taughtIpa": "/ˈwɔ.tɚ/",
        "resolvedBy": "round-14 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "can-verb",
        "lemma": "can",
        "pos": "verb",
        "cmudict": ["K AE1 N /kæn/", "K AH0 N /kən/"],
        "wiktionary": ["not re-fetched this round"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists the strong form /kæn/ first and the weak form /kən/ second. In Can I have, the weak form is the one people say.",
        "resolution": "This card teaches the weak form /kən/ with no stress, because that is the sound in Can I have. /kæn/ stays a labelled strong variant. The clip is forced to /kən/. can't is a separate card, /kænt/, with a clear /t/.",
        "resolved": True,
        "taughtIpa": "/kən/",
        "resolvedBy": "round-14 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "liquid-noun",
        "lemma": "liquid",
        "pos": "noun",
        "cmudict": ["L IH1 K W AH0 D /ˈlɪk.wəd/", "L IH1 K W IH0 D /ˈlɪk.wɪd/"],
        "wiktionary": ["not re-fetched this round"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists /ˈlɪk.wəd/ first and /ˈlɪk.wɪd/ second. Teaching materials usually use /ɪ/ in the second syllable.",
        "resolution": "Teach /ˈlɪk.wɪd/, which is in CMU. /ˈlɪk.wəd/ stays a labelled variant. The clip is forced to /ɪ/ so it matches the card.",
        "resolved": True,
        "taughtIpa": "/ˈlɪk.wɪd/",
        "resolvedBy": "round-17 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "which-det",
        "lemma": "which",
        "pos": "det",
        "cmudict": ["W IH1 CH /wɪtʃ/", "HH W IH1 CH /hwɪtʃ/"],
        "wiktionary": ["not re-fetched this round"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU lists /wɪtʃ/ first and the wine-whine /hwɪtʃ/ second.",
        "resolution": "Teach /wɪtʃ/. /hwɪtʃ/ stays a labelled variant for learners who still keep the /h/.",
        "resolved": True,
        "taughtIpa": "/wɪtʃ/",
        "resolvedBy": "round-17 lexicographer",
        "resolvedAt": "2026-10-30",
    },
    {
        "id": "security-noun",
        "lemma": "security",
        "pos": "noun",
        "cmudict": ["S IH0 K Y UH1 R AH0 T IY0 /sɪ.ˈkjʊɹ.ə.ti/"],
        "wiktionary": ["not re-fetched this round"],
        "freeDictionary": "not in the local phonetics cache",
        "disagreement": "CMU starts with /sɪ/. A common weak form starts with /sə/.",
        "resolution": "Teach the CMU form /sɪ.ˈkjʊɹ.ə.ti/. /sə.ˈkjʊɹ.ə.ti/ stays a labelled variant. The clip is forced to /sɪ/ so it matches the card.",
        "resolved": True,
        "taughtIpa": "/sɪ.ˈkjʊɹ.ə.ti/",
        "resolvedBy": "round-17 lexicographer",
        "resolvedAt": "2026-10-30",
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
        line("f2-l3", "mei", "Mei", "Nice to meet you.", "好高興認識你。"),
        line("f2-l4", "ling", "Ling", "Nice to meet you, too. Thank you.", "我都好高興認識你。多謝。"),
        line("f2-l5", "mei", "Mei", "Hi. Please say it again.", "嗨。請再講一次。"),
    ]
    j1 = [
        line("j1-l1", "mei", "Mei", "Welcome to our jewellery store. How may I help you today?", "歡迎嚟到我哋嘅珠寶店。今日有咩可以幫到你？", "Welcome to our [[dʒˈulɹi]] store. How may I help you today?"),
        line("j1-l2", "tom", "Tom", "Hi. I'm just looking, thank you.", "嗨，我睇吓先，多謝。"),
        line("j1-l3", "mei", "Mei", "Of course. Please take a look around.", "當然。隨便睇吓。", "[[əv kˈɔɹs.]] Please take a look around."),
        line("j1-l4", "tom", "Tom", "This necklace is beautiful.", "呢條頸鏈好靚。"),
        line("j1-l5", "mei", "Mei", "Thank you. Let me know if you need anything.", "多謝。有需要就話我知。"),
    ]
    j2 = [
        line("j2-l1", "mei", "Mei", "What are you looking for today?", "你今日想搵咩？"),
        line("j2-l2", "tom", "Tom", "I'm looking for a silver ring.", "我想搵一隻銀戒指。"),
        line("j2-l3", "mei", "Mei", "We have a very nice ring. Would you like to see it?", "我哋有一隻好靚嘅戒指。想唔想睇吓？"),
        line("j2-l4", "tom", "Tom", "Yes. I want something for my wife.", "好。我想買樣嘢畀太太。"),
        line("j2-l5", "mei", "Mei", "Of course. I'll show you a few.", "當然。我畀你睇幾件。", "[[əv kˈɔɹs.]] I'll show you a few."),
    ]
    j3 = [
        line("j3-l1", "mei", "Mei", "This necklace is beautiful.", "呢條頸鏈好靚。"),
        line("j3-l2", "tom", "Tom", "I like this bracelet.", "我鍾意呢條手鏈。", "I like this [[bɹˈeɪslət.]]"),
        line("j3-l3", "mei", "Mei", "We have a pair of pearl earrings.", "我哋有一對珍珠耳環。", "We have a pair [[əv]] pearl earrings."),
        line("j3-l4", "tom", "Tom", "May I see these earrings?", "可唔可以睇吓呢啲耳環？"),
        line("j3-l5", "mei", "Mei", "Of course. This pair is beautiful.", "當然。呢對好靚。", "[[əv kˈɔɹs.]] This pair is beautiful."),
    ]
    t1 = [
        line("t1-l1", "kai", "Kai", "Good afternoon. Where are you flying today?", "你好，你今日飛去邊？"),
        line("t1-l2", "ling", "Ling", "I'm flying to Hong Kong. Here is my passport.", "我飛去香港。呢本係我嘅護照。"),
        line("t1-l3", "kai", "Kai", "Thank you. Window or aisle?", "多謝。靠窗定係走廊位？"),
        line("t1-l4", "ling", "Ling", "A window seat, please.", "要靠窗位，唔該。"),
        line("t1-l5", "kai", "Kai", "Sure. I'll show you the information. Here is your boarding pass.", "好。我畀你睇吓資料。你張登機證喺度。"),
    ]
    t2 = [
        line("t2-l1", "kai", "Kai", "Boarding pass, please.", "登機證唔該。"),
        line("t2-l2", "ling", "Ling", "Here is my boarding pass.", "我張登機證喺度。"),
        line("t2-l3", "kai", "Kai", "Please put your liquids in the bin.", "唔該將液體放喺個盤度。"),
        line("t2-l4", "ling", "Ling", "Which way to the gate?", "去閘口邊邊行？"),
        line("t2-l5", "kai", "Kai", "Straight ahead. Your gate is on the left.", "直行就得。你個閘口喺左邊。"),
    ]
    r1 = [
        line("r1-l1", "ana", "Ana", "Good evening. Do you have a reservation?", "你好，有冇訂位呀？"),
        line("r1-l2", "tom", "Tom", "Yes. A table for two, please.", "有。兩位，唔該。", "Yes. [[ə ˈteɪbəl fɚ ˈtu]] , please."),
        line("r1-l3", "ana", "Ana", "Right this way. Would you like a table by the window?", "請跟我嚟。想唔想坐靠窗？"),
        line("r1-l4", "tom", "Tom", "Yes, thank you. This is great.", "好，多謝。好好。"),
        line("r1-l5", "ana", "Ana", "Here is your table. Please have a seat. I'll bring the menu.", "你張檯喺度。請坐。我攞餐牌嚟。"),
    ]
    r2 = [
        line("r2-l1", "ana", "Ana", "What would you like to order?", "你想叫咩？"),
        line("r2-l2", "tom", "Tom", "I'd like the chicken, please.", "我想叫雞，唔該。", "I'd like the [[tʃˈɪkən]] , please."),
        line("r2-l3", "ana", "Ana", "Would you like water or tea?", "你想要水定茶？"),
        line("r2-l4", "tom", "Tom", "Can I have some water, please?", "可唔可以畀我杯水？", "[[kən]] I have some water, please."),
        line("r2-l5", "ana", "Ana", "Anything else?", "仲有冇其他？"),
    ]
    f3 = [
        line("f3-l1", "mei", "Mei", "How much is this?", "呢個幾多錢？"),
        line("f3-l2", "ling", "Ling", "It is ten dollars.", "一共係十蚊。"),
        line("f3-l3", "mei", "Mei", "What time is it?", "而家幾點？"),
        line("f3-l4", "ling", "Ling", "It is three o'clock.", "而家係三點。"),
        line("f3-l5", "mei", "Mei", "Thank you. See you at five.", "多謝。五點見。"),
    ]
    f4 = [
        line("f4-l1", "mei", "Mei", "Excuse me.", "唔該借借。", "[[ɪkskjˈuz]] me."),
        line("f4-l2", "ling", "Ling", "I'm sorry.", "對唔住。"),
        line("f4-l3", "mei", "Mei", "That's all right.", "冇事。"),
        line("f4-l4", "ling", "Ling", "Thank you.", "多謝。"),
        line("f4-l5", "mei", "Mei", "You're welcome. Good night.", "唔使客氣。晚安。"),
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
        line("t1-m2", "ling", "Ling", "Here is my passport.", "呢本係我嘅護照。"),
        line("t2-m1", "ling", "Ling", "Here is my laptop.", "我部手提電腦喺度。"),
        line("t2-l6", "kai", "Kai", "You're all set.", "你搞掂啦。"),
        line("r1-m3", "tom", "Tom", "Thank you.", "多謝。"),
        line("j1-l6", "tom", "Tom", "Thanks. I'll look around.", "多謝。我周圍睇吓。"),
        line("t1-l6", "kai", "Kai", "May I see your passport, please?", "可唔可以畀我睇吓護照？"),
        line("r1-l6", "ana", "Ana", "Right this way.", "請跟我嚟。"),
        line("f3-l6", "mei", "Mei", "Is it five dollars?", "係咪五蚊？"),
        line("f3-m3", "ling", "Ling", "Yes. Five dollars.", "係呀，五蚊。"),
        line("f4-l6", "mei", "Mei", "You're welcome.", "唔使客氣。"),
        line("f4-m3", "ling", "Ling", "Good night.", "晚安。"),
        line("j3-l6", "tom", "Tom", "What is this?", "呢件係咩？"),
        line("j3-m1", "mei", "Mei", "This is a necklace.", "呢條係頸鏈。"),
        line("r2-l6", "tom", "Tom", "What do you recommend?", "你推薦咩？"),
        line("r2-m1", "tom", "Tom", "I'd like tea, please.", "我想要杯茶，唔該。"),
        line("r2-m2", "ana", "Ana", "I recommend the fish.", "我推薦魚。"),
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
                {"prompt": "Nice to meet you. 幾時講？", "choices": ["第一次見面", "叫人埋單", "問靠窗定走廊位"], "answer": 0, "explain": "識人嗰陣講，語氣輕就得。"},
                {"prompt": "Thank you 開頭個音係？", "choices": ["/θ/ 舌尖輕送氣", "/f/ 咬唇", "/s/ 牙齒縫"], "answer": 0, "explain": "舌尖輕觸上排牙，送氣。唔好變成 fanks。"},
            ],
            "chunks": [
                {"pattern": "Good ___.", "example": "Good morning.", "glossYue": "早晨／你好／晚安。", "answer": "morning", "choices": ["morning", "passport", "necklace"]},
                {"pattern": "My name is ___.", "example": "My name is Ling.", "glossYue": "我叫⋯⋯。", "answer": "Ling", "choices": ["Ling", "a table", "check-in"]},
                {"pattern": "Nice to meet ___.", "example": "Nice to meet you.", "glossYue": "好高興認識你。", "answer": "you", "choices": ["you", "the menu", "aisle"]},
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
                {"type": "meaning", "prompt": "Nice to meet you", "choices": ["好高興認識你", "睇吓先", "靠窗位"], "answer": 0},
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
            "next": "F3",
        },
        {
            "id": "F3",
            "unit": "F",
            "titleYue": "數字、錢同時間",
            "titleEn": "Numbers, money, and time",
            "canDoYue": "你能夠問幾多錢、答十蚊，同埋講三點。",
            "canDoEn": "Ask how much, say ten dollars, and say three o'clock.",
            "minutes": 12,
            "hero": "assets/art/lessons/f3.webp",
            "cast": ["mei"],
            "lemmas": ["how-much-phrase", "ten-num", "dollar-noun", "three-num", "oclock-adv", "five-num", "four-num", "six-num", "seven-num", "eight-num", "nine-num", "one-num", "two-num", "money-noun", "how-adv", "much-adv", "clock-noun", "price-noun", "minute-noun", "hour-noun", "now-adv", "time-noun", "fine-adj", "sick-adj"],
            "dialogue": f3,
            "understand": [
                {"prompt": "How much is this? 係問咩？", "choices": ["呢個幾多錢", "而家幾點", "我叫咩名"], "answer": 0, "explain": "how much 係問價錢。問時間用 what time。"},
                {"prompt": "Ten dollars. 係幾多？", "choices": ["十蚊", "十點", "早晨"], "answer": 0, "explain": "dollar 喺香港口語講做「蚊」。"},
                {"prompt": "Three o'clock. 係講緊咩？", "choices": ["三點", "三蚊", "三位"], "answer": 0, "explain": "o'clock 係點鐘，唔係錢。"},
            ],
            "chunks": [
                {"pattern": "How much is ___?", "example": "How much is this?", "glossYue": "呢個幾多錢？", "answer": "this", "choices": ["this", "three", "sorry"]},
                {"pattern": "It is ___ dollars.", "example": "It is ten dollars.", "glossYue": "⋯⋯蚊。", "answer": "ten", "choices": ["ten", "clock", "night"]},
                {"pattern": "It is three ___.", "example": "It is three o'clock.", "glossYue": "三點。", "answer": "o'clock", "choices": ["o'clock", "dollars", "sorry"]},
            ],
            "shadow": {"lineId": "f3-l1", "hint": "How much is this?"},
            "build": [
                {"type": "choice", "promptYue": "Mei 問 How much is this? 你點答？", "choices": ["It is ten dollars.", "Good morning.", "Excuse me."], "answer": 0, "explain": "先答價錢。十蚊就係 ten dollars。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["It", "is", "three", "o'clock"], "answer": ["It", "is", "three", "o'clock"]},
            ],
            "roleplay": {
                "you": "ling",
                "intro": "Mei 喺櫃檯問你價錢同時間。等佢講完先答，中途唔會插嘴。",
                "turns": [
                    {"partner": "Mei", "partnerId": "mei", "line": "How much is this?", "audio": "assets/audio/lines/f3-l1.mp3", "audioSlow": "assets/audio/lines/f3-l1-slow.mp3", "expect": "It is ten dollars.", "keywords": ["ten", "dollar"], "modelAudio": "assets/audio/lines/f3-l2.mp3", "modelSlow": "assets/audio/lines/f3-l2-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "What time is it?", "audio": "assets/audio/lines/f3-l3.mp3", "audioSlow": "assets/audio/lines/f3-l3-slow.mp3", "expect": "It is three o'clock.", "keywords": ["three", "clock"], "modelAudio": "assets/audio/lines/f3-l4.mp3", "modelSlow": "assets/audio/lines/f3-l4-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "Is it five dollars?", "audio": "assets/audio/lines/f3-l6.mp3", "audioSlow": "assets/audio/lines/f3-l6-slow.mp3", "expect": "Yes. Five dollars.", "keywords": ["five", "dollar"], "modelAudio": "assets/audio/lines/f3-m3.mp3", "modelSlow": "assets/audio/lines/f3-m3-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "five-num", "choices": ["five", "fine", "nine"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "six-num", "choices": ["six", "sick", "sit"], "answer": 0},
                {"type": "meaning", "prompt": "dollar", "choices": ["蚊", "點鐘", "對唔住"], "answer": 0},
                {"type": "meaning", "prompt": "o'clock", "choices": ["點鐘", "蚊", "護照"], "answer": 0},
                {"type": "meaning", "prompt": "price", "choices": ["價錢", "航班", "餐牌"], "answer": 0},
                {"type": "choice", "prompt": "邊句先係問時間？", "choices": ["What time is it?", "How much is this?", "Excuse me."], "answer": 0, "explain": "time 係時間。how much 係問錢。"},
            ],
            "sound": {
                "ipa": "尾音",
                "title": "唔好食尾音",
                "note": "廣東話成日食咗英文尾音。five 要收到 /v/，唔好變成 fine。six 尾有 /ks/，唔好變成 sick。ten 尾嘅 /n/ 都要留低。用口型，唔好用粵拼代替。",
                "pairs": [
                    {"a": "five-num", "b": "fine-adj"},
                    {"a": "six-num", "b": "sick-adj"},
                ],
                "drill": ["five-num", "six-num", "ten-num", "dollar-noun"],
            },
            "next": "F4",
        },
        {
            "id": "F4",
            "unit": "F",
            "titleYue": "禮貌用語",
            "titleEn": "Polite phrases",
            "canDoYue": "你能夠講 excuse me、I'm sorry，同埋 you're welcome。",
            "canDoEn": "Say excuse me, I'm sorry, and you're welcome.",
            "minutes": 12,
            "hero": "assets/art/lessons/f4.webp",
            "cast": ["mei"],
            "lemmas": ["excuse-me-phrase", "im-sorry-phrase", "youre-welcome-phrase", "good-night-phrase", "pardon-verb", "please-adv", "excuse-verb", "sorry-adj", "night-noun", "thank-you-phrase", "thank-verb", "welcome-verb", "good-adj", "me-pron", "light-adj", "let-verb", "net-noun"],
            "dialogue": f4,
            "understand": [
                {"prompt": "Excuse me. 通常係？", "choices": ["想人讓一讓，或者禮貌咁打招呼", "問幾多錢", "講自己個名"], "answer": 0, "explain": "行過人身邊、打斷人之前，都可以先講呢句。"},
                {"prompt": "I'm sorry. 係咩意思？", "choices": ["對唔住", "唔使客氣", "十蚊"], "answer": 0, "explain": "sorry 係道歉。you're welcome 先至係回應多謝。"},
                {"prompt": "You're welcome. 幾時講？", "choices": ["人哋講咗 thank you 之後", "問而家幾點", "第一次見面"], "answer": 0, "explain": "即係唔使客氣。"},
            ],
            "chunks": [
                {"pattern": "Excuse ___.", "example": "Excuse me.", "glossYue": "唔該借借。", "answer": "me", "choices": ["me", "night", "five"]},
                {"pattern": "I'm ___.", "example": "I'm sorry.", "glossYue": "對唔住。", "answer": "sorry", "choices": ["sorry", "welcome", "dollar"]},
                {"pattern": "You're ___.", "example": "You're welcome.", "glossYue": "唔使客氣。", "answer": "welcome", "choices": ["welcome", "sorry", "seven"]},
                {"pattern": "Good ___.", "example": "Good night.", "glossYue": "晚安。", "answer": "night", "choices": ["night", "dollar", "sorry"]},
            ],
            "shadow": {"lineId": "f4-l1", "hint": "Excuse me."},
            "build": [
                {"type": "choice", "promptYue": "你行過人身邊，第一句講邊句？", "choices": ["Excuse me.", "It is ten dollars.", "What time is it?"], "answer": 0, "explain": "先借一借，再講其他。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["I'm", "sorry"], "answer": ["I'm", "sorry"]},
            ],
            "roleplay": {
                "you": "ling",
                "intro": "你喺門口同 Mei 練習禮貌用語。等佢講完先答，中途唔會插嘴。",
                "turns": [
                    {"partner": "Mei", "partnerId": "mei", "line": "Excuse me.", "audio": "assets/audio/lines/f4-l1.mp3", "audioSlow": "assets/audio/lines/f4-l1-slow.mp3", "expect": "I'm sorry.", "keywords": ["sorry"], "modelAudio": "assets/audio/lines/f4-l2.mp3", "modelSlow": "assets/audio/lines/f4-l2-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "That's all right.", "audio": "assets/audio/lines/f4-l3.mp3", "audioSlow": "assets/audio/lines/f4-l3-slow.mp3", "expect": "Thank you.", "keywords": ["thank"], "modelAudio": "assets/audio/lines/f4-l4.mp3", "modelSlow": "assets/audio/lines/f4-l4-slow.mp3"},
                    {"partner": "Mei", "partnerId": "mei", "line": "You're welcome.", "audio": "assets/audio/lines/f4-l6.mp3", "audioSlow": "assets/audio/lines/f4-l6-slow.mp3", "expect": "Good night.", "keywords": ["night"], "modelAudio": "assets/audio/lines/f4-m3.mp3", "modelSlow": "assets/audio/lines/f4-m3-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "night-noun", "choices": ["night", "light", "let"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "let-verb", "choices": ["let", "net", "night"], "answer": 0},
                {"type": "meaning", "prompt": "Excuse me", "choices": ["唔該借借", "十蚊", "三點"], "answer": 0},
                {"type": "meaning", "prompt": "I'm sorry", "choices": ["對唔住", "唔使客氣", "早晨"], "answer": 0},
                {"type": "choice", "prompt": "You're welcome 係邊種回應？", "choices": ["唔使客氣，回應多謝", "問價錢", "問幾點"], "answer": 0, "explain": "人哋多謝你，你先講 you're welcome。"},
            ],
            "sound": {
                "ipa": "/l/ · /n/",
                "title": "舌邊同鼻音",
                "note": "英文 /l/：舌尖抵住上顎後面，氣由舌兩邊出。/n/：同樣個位，氣改由鼻出。night、net 開頭係 /n/。light、let 開頭係 /l/。唔好用粵語 n、l 混讀去代替。",
                "pairs": [
                    {"a": "light-adj", "b": "night-noun"},
                    {"a": "let-verb", "b": "net-noun"},
                ],
                "drill": ["night-noun", "light-adj", "let-verb", "net-noun"],
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
                {"prompt": "I'm just looking. 客人想點？", "choices": ["睇吓先，未打算買", "即刻落單", "要兩位靠窗"], "answer": 0, "explain": "唔好追問。請佢慢慢睇就得。"},
                {"prompt": "How may I help you? 你喺做咩？", "choices": ["客氣咁問可唔可以幫手", "叫客人離開", "問航班號碼"], "answer": 0, "explain": "may 比 can 更慢、更有禮。"},
                {"prompt": "Of course. 係邊種語氣？", "choices": ["當然，冇問題", "唔得", "幾多錢"], "answer": 0, "explain": "後面通常接 Please take a look。"},
            ],
            "chunks": [
                {"pattern": "Welcome to ___.", "example": "Welcome to our jewellery store.", "glossYue": "歡迎嚟到⋯⋯。", "answer": "our jewellery store", "choices": ["our jewellery store", "the boarding gate", "a table for two"]},
                {"pattern": "How may I help you ___?", "example": "How may I help you today?", "glossYue": "今日有咩可以幫到你？", "answer": "today", "choices": ["today", "the menu", "my passport"]},
                {"pattern": "I'm just ___.", "example": "I'm just looking.", "glossYue": "我睇吓先。", "answer": "looking", "choices": ["looking", "a necklace", "on time"]},
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
                {"type": "meaning", "prompt": "just looking", "choices": ["睇吓先", "即刻付款", "我有訂位"], "answer": 0},
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
                {"type": "meaning", "prompt": "Would you like to see it?", "choices": ["想唔想睇吓", "請去閘口", "我睇吓先"], "answer": 0},
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
            "next": "J3",
        },
        {
            "id": "J3",
            "unit": "J",
            "titleYue": "件件嘅名",
            "titleEn": "Names of the pieces",
            "canDoYue": "你能夠講頸鏈、手鏈、耳環同珍珠，並且分清 this／these 同 pair／pearl。",
            "canDoEn": "Name a necklace, a bracelet, and a pair of pearl earrings, and keep this/these and pair/pearl apart.",
            "minutes": 12,
            "hero": "assets/art/lessons/j3.webp",
            "cast": ["mei", "tom"],
            "lemmas": ["necklace-noun", "bracelet-noun", "earring-noun", "pair-noun", "pearl-noun", "these-det", "this-det", "beautiful-adj", "like-verb", "see-verb", "of-course-phrase", "have-verb", "we-pron"],
            "dialogue": j3,
            "understand": [
                {"prompt": "This necklace is beautiful. 係講緊邊件？", "choices": ["頸鏈", "手鏈", "耳環"], "answer": 0, "explain": "necklace 係戴喺頸嘅。bracelet 先至係手鏈。"},
                {"prompt": "A pair of earrings. 係幾多隻？", "choices": ["兩隻，一對", "一隻", "三隻"], "answer": 0, "explain": "pair 係一對。呢啲耳環用 these。"},
                {"prompt": "these 同 this 差喺？", "choices": ["these 係呢啲，尾音 /z/", "兩個都係一件", "these 係道別"], "answer": 0, "explain": "一件用 this /ðɪs/。多過一件用 these /ðiz/。"},
            ],
            "chunks": [
                {"pattern": "This ___ is beautiful.", "example": "This necklace is beautiful.", "glossYue": "呢條⋯⋯好靚。", "answer": "necklace", "choices": ["necklace", "passport", "menu"]},
                {"pattern": "I like this ___.", "example": "I like this bracelet.", "glossYue": "我鍾意呢條⋯⋯。", "answer": "bracelet", "choices": ["bracelet", "flight", "seat"]},
                {"pattern": "A pair of ___.", "example": "A pair of pearl earrings.", "glossYue": "一對⋯⋯。", "answer": "pearl earrings", "choices": ["pearl earrings", "boarding passes", "window seats"]},
                {"pattern": "May I see ___?", "example": "May I see these earrings?", "glossYue": "可唔可以睇吓⋯⋯？", "answer": "these earrings", "choices": ["these earrings", "your passport", "the gate"]},
            ],
            "shadow": {"lineId": "j3-l3", "hint": "We have a pair of pearl earrings."},
            "build": [
                {"type": "choice", "promptYue": "Tom 話 I like this bracelet. 你點接？", "choices": ["We have a pair of pearl earrings.", "I'm just looking, thank you.", "Go to the gate."], "answer": 0, "explain": "接住佢鍾意嘅件，再講一對相關嘅耳環。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["This", "necklace", "is", "beautiful"], "answer": ["This", "necklace", "is", "beautiful"]},
            ],
            "roleplay": {
                "you": "mei",
                "intro": "Tom 企喺櫃檯前。你講件名之前，等佢問完先答。",
                "turns": [
                    {"partner": "Tom", "partnerId": "tom", "line": "What is this?", "audio": "assets/audio/lines/j3-l6.mp3", "audioSlow": "assets/audio/lines/j3-l6-slow.mp3", "expect": "This is a necklace.", "keywords": ["necklace"], "modelAudio": "assets/audio/lines/j3-m1.mp3", "modelSlow": "assets/audio/lines/j3-m1-slow.mp3"},
                    {"partner": "Tom", "partnerId": "tom", "line": "I like this bracelet.", "audio": "assets/audio/lines/j3-l2.mp3", "audioSlow": "assets/audio/lines/j3-l2-slow.mp3", "expect": "We have a pair of pearl earrings.", "keywords": ["pair", "pearl"], "modelAudio": "assets/audio/lines/j3-l3.mp3", "modelSlow": "assets/audio/lines/j3-l3-slow.mp3"},
                    {"partner": "Tom", "partnerId": "tom", "line": "May I see these earrings?", "audio": "assets/audio/lines/j3-l4.mp3", "audioSlow": "assets/audio/lines/j3-l4-slow.mp3", "expect": "Of course. This pair is beautiful.", "keywords": ["pair", "beautiful"], "modelAudio": "assets/audio/lines/j3-l5.mp3", "modelSlow": "assets/audio/lines/j3-l5-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "these-det", "choices": ["these", "this", "three"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "pearl-noun", "choices": ["pearl", "pair", "ring"], "answer": 0},
                {"type": "meaning", "prompt": "bracelet", "choices": ["手鏈", "頸鏈", "登機證"], "answer": 0},
                {"type": "meaning", "prompt": "a pair of earrings", "choices": ["一對耳環", "一隻戒指", "靠窗位"], "answer": 0},
                {"type": "choice", "prompt": "邊個尾音係 /z/？", "choices": ["these", "this", "pair"], "answer": 0, "explain": "these /ðiz/ 有聲。this /ðɪs/ 係清 /s/。"},
            ],
            "sound": {
                "ipa": "/ðɪs/ · /ðiz/ · /pɛɹ/ · /pɝl/",
                "title": "一件同一對",
                "note": "this /ðɪs/：短 /ɪ/，尾清 /s/，講一件。these /ðiz/：長 /i/，尾有聲 /z/，講呢啲。pair /pɛɹ/ 係「一對」，嘴開少少。pearl /pɝl/ 係「珍珠」，舌尖向上卷，唔好掂到上顎。bracelet 重音喺第一節，尾 /t/ 要收住。earring 都係第一節重讀。",
                "pairs": [
                    {"a": "this-det", "b": "these-det"},
                    {"a": "pair-noun", "b": "pearl-noun"},
                ],
                "drill": ["this-det", "these-det", "pair-noun", "pearl-noun", "bracelet-noun", "earring-noun"],
            },
            "next": "J4",
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
                {"prompt": "Where are you flying today? 係問咩？", "choices": ["你今日飛去邊", "你想搵咩首飾", "你有冇訂位"], "answer": 0, "explain": "flying 係飛緊去邊度。"},
                {"prompt": "Window or aisle? 係兩個咩？", "choices": ["靠窗位定走廊位", "紅酒定白酒", "金定銀"], "answer": 0, "explain": "走廊位係行路嗰條通道旁邊。"},
                {"prompt": "check-in 開頭係？", "choices": ["/tʃ/，一下堵住再放", "/ʃ/ 長噓氣", "/θ/ 伸舌"], "answer": 0, "explain": "check 唔係 sh。/ʃ/ 喺 sure、show、information。"},
            ],
            "chunks": [
                {"pattern": "Where are you flying ___?", "example": "Where are you flying today?", "glossYue": "你今日飛去邊？", "answer": "today", "choices": ["today", "a silver ring", "the menu"]},
                {"pattern": "Here is my ___.", "example": "Here is my passport.", "glossYue": "呢本係我嘅⋯⋯。", "answer": "passport", "choices": ["passport", "necklace", "menu"]},
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
                {"type": "meaning", "prompt": "aisle", "choices": ["走廊位", "靠窗", "行李"], "answer": 0},
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
            "next": "T2",
        },
        {
            "id": "T2",
            "unit": "T",
            "titleYue": "安檢同方向",
            "titleEn": "Security and directions",
            "canDoYue": "你能夠過安檢同問閘口點行。",
            "canDoEn": "Clear security and ask which way to the gate.",
            "minutes": 12,
            "hero": "assets/art/lessons/t2.webp",
            "cast": ["kai"],
            "lemmas": ["bin-noun", "liquid-noun", "laptop-noun", "belt-noun", "which-way-phrase", "straight-ahead-phrase", "which-det", "straight-adv", "ahead-adv", "left-adv", "lift-noun", "street-noun", "security-noun", "gate-noun", "boarding-pass-phrase", "way-noun", "please-adv"],
            "dialogue": t2,
            "understand": [
                {"prompt": "Please put your liquids in the bin. 係叫你？", "choices": ["將液體放喺個盤", "叫雞", "訂位"], "answer": 0, "explain": "bin 係安檢用嘅膠盤。"},
                {"prompt": "Which way to the gate? 係問咩？", "choices": ["去閘口邊邊行", "你飛去邊", "你想叫咩"], "answer": 0, "explain": "which way 係問方向。"},
                {"prompt": "Straight ahead. 你應該？", "choices": ["直行，唔使轉彎", "返去櫃檯", "坐低叫餐"], "answer": 0, "explain": "ahead 係前面。直行就得。"},
            ],
            "chunks": [
                {"pattern": "Put the liquids in the ___.", "example": "Put the liquids in the bin.", "glossYue": "將液體放喺個⋯⋯度。", "answer": "bin", "choices": ["bin", "menu", "ring"]},
                {"pattern": "Here is my ___.", "example": "Here is my laptop.", "glossYue": "我部⋯⋯喺度。", "answer": "laptop", "choices": ["laptop", "chicken", "reservation"]},
                {"pattern": "Which way to the ___?", "example": "Which way to the gate?", "glossYue": "去⋯⋯邊邊行？", "answer": "gate", "choices": ["gate", "menu", "sheep"]},
                {"pattern": "Go straight ___.", "example": "Go straight ahead.", "glossYue": "直行⋯⋯。", "answer": "ahead", "choices": ["ahead", "aisle", "o'clock"]},
            ],
            "shadow": {"lineId": "t2-l4", "hint": "Which way to the gate?"},
            "build": [
                {"type": "choice", "promptYue": "Kai 話 You're all set. 你想問閘口點行。", "choices": ["Which way to the gate?", "I'd like the chicken, please.", "A table for two, please."], "answer": 0, "explain": "過咗安檢就可以問 Which way to the gate?"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Go", "straight", "ahead"], "answer": ["Go", "straight", "ahead"]},
            ],
            "roleplay": {
                "you": "ling",
                "intro": "你過緊安檢。Kai 講完一句，你再答。唔使急。",
                "turns": [
                    {"partner": "Kai", "partnerId": "kai", "line": "Boarding pass, please.", "audio": "assets/audio/lines/t2-l1.mp3", "audioSlow": "assets/audio/lines/t2-l1-slow.mp3", "expect": "Here is my boarding pass.", "keywords": ["boarding"], "modelAudio": "assets/audio/lines/t2-l2.mp3", "modelSlow": "assets/audio/lines/t2-l2-slow.mp3"},
                    {"partner": "Kai", "partnerId": "kai", "line": "Please put your liquids in the bin.", "audio": "assets/audio/lines/t2-l3.mp3", "audioSlow": "assets/audio/lines/t2-l3-slow.mp3", "expect": "Here is my laptop.", "keywords": ["laptop"], "modelAudio": "assets/audio/lines/t2-m1.mp3", "modelSlow": "assets/audio/lines/t2-m1-slow.mp3"},
                    {"partner": "Kai", "partnerId": "kai", "line": "You're all set.", "audio": "assets/audio/lines/t2-l6.mp3", "audioSlow": "assets/audio/lines/t2-l6-slow.mp3", "expect": "Which way to the gate?", "keywords": ["way", "gate"], "modelAudio": "assets/audio/lines/t2-l4.mp3", "modelSlow": "assets/audio/lines/t2-l4-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "liquid-noun", "choices": ["liquid", "lift", "left"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "lift-noun", "choices": ["lift", "left", "street"], "answer": 0},
                {"type": "meaning", "prompt": "bin", "choices": ["膠盤", "餐牌", "頸鏈"], "answer": 0},
                {"type": "meaning", "prompt": "straight ahead", "choices": ["直行就得", "請跟我嚟", "我想叫雞"], "answer": 0},
                {"type": "choice", "prompt": "邊個開頭係 /l/？", "choices": ["liquid", "straight", "street"], "answer": 0, "explain": "liquid、left、laptop 有 /l/。straight 同 street 開頭係 /st/。"},
            ],
            "sound": {
                "ipa": "/l/ · /ɛ/ · /eɪ/",
                "title": "直行同左邊",
                "note": "liquid、left、laptop、belt 都有 /l/：舌尖抵住上顎後面，氣由兩邊出。left /lɛft/ 係短 /ɛ/。lift /lɪft/ 係短 /ɪ/，升降機。straight /stɹeɪt/ 係 /eɪ/，一路滑去。street /stɹit/ 係長 /i/。唔好將 straight 讀成 street。",
                "pairs": [
                    {"a": "left-adv", "b": "lift-noun"},
                    {"a": "straight-adv", "b": "street-noun"},
                ],
                "drill": ["liquid-noun", "left-adv", "lift-noun", "straight-adv", "street-noun", "laptop-noun"],
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
                {"prompt": "Do you have a reservation? 係問咩？", "choices": ["你有冇訂位", "你想搵銀戒指", "你飛去邊"], "answer": 0, "explain": "有就答 Yes，再講幾多位。"},
                {"prompt": "A table for two. 係幾多位？", "choices": ["兩位", "一位", "走廊位"], "answer": 0, "explain": "for two 係人數，唔係價錢。"},
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
                {"type": "meaning", "prompt": "reservation", "choices": ["訂位", "護照", "頸鏈"], "answer": 0},
                {"type": "meaning", "prompt": "I'll bring the menu.", "choices": ["我攞餐牌嚟", "我飛去香港", "我睇吓先"], "answer": 0},
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
            "next": "R2",
        },
        {
            "id": "R2",
            "unit": "R",
            "titleYue": "落單",
            "titleEn": "Ordering",
            "canDoYue": "你能夠喺餐廳落單。",
            "canDoEn": "Order with I'd like, Can I have, What do you recommend?, and Anything else?",
            "minutes": 12,
            "hero": "assets/art/lessons/r2.webp",
            "cast": ["ana", "tom"],
            "lemmas": ["order-verb", "recommend-verb", "else-adv", "water-noun", "coffee-noun", "tea-noun", "chicken-noun", "fish-noun", "can-verb", "cant-verb", "would-verb", "like-verb", "have-verb", "please-adv", "anything-pron", "what-det"],
            "dialogue": r2,
            "understand": [
                {"prompt": "What would you like to order? 係問咩？", "choices": ["你想叫咩", "你有冇訂位", "你飛去邊"], "answer": 0, "explain": "坐低之後先叫嘢。"},
                {"prompt": "Can I have some water? 係講咩？", "choices": ["可唔可以畀我杯水", "我想叫雞", "我睇吓先"], "answer": 0, "explain": "Can I have 係客氣咁要嘢。"},
                {"prompt": "Anything else? 係問咩？", "choices": ["仲有冇其他", "一共幾多錢", "請跟我嚟"], "answer": 0, "explain": "可以再叫，或者問 What do you recommend?"},
            ],
            "chunks": [
                {"pattern": "I'd like the ___, please.", "example": "I'd like the chicken, please.", "glossYue": "我想叫⋯⋯，唔該。", "answer": "chicken", "choices": ["chicken", "reservation", "passport"]},
                {"pattern": "Can I have some ___, please?", "example": "Can I have some water, please?", "glossYue": "可唔可以畀我⋯⋯？", "answer": "water", "choices": ["water", "window", "wife"]},
                {"pattern": "What do you ___?", "example": "What do you recommend?", "glossYue": "你推薦咩？", "answer": "recommend", "choices": ["recommend", "reservation", "relax"]},
                {"pattern": "Anything ___?", "example": "Anything else?", "glossYue": "仲有冇其他？", "answer": "else", "choices": ["else", "o'clock", "aisle"]},
            ],
            "shadow": {"lineId": "r2-l2", "hint": "I'd like the chicken, please."},
            "build": [
                {"type": "choice", "promptYue": "Ana 問 What would you like to order? 你想叫雞。", "choices": ["I'd like the chicken, please.", "I'm just looking, thank you.", "Here is my passport."], "answer": 0, "explain": "I'd like 後面跟想叫嘅嘢，再加 please。"},
                {"type": "order", "promptYue": "排好呢句。", "tokens": ["Can", "I", "have", "some", "water"], "answer": ["Can", "I", "have", "some", "water"]},
            ],
            "roleplay": {
                "you": "tom",
                "intro": "你已經坐低。Ana 等你叫嘢。等佢問完先答。",
                "turns": [
                    {"partner": "Ana", "partnerId": "ana", "line": "What would you like to order?", "audio": "assets/audio/lines/r2-l1.mp3", "audioSlow": "assets/audio/lines/r2-l1-slow.mp3", "expect": "I'd like the chicken, please.", "keywords": ["chicken"], "modelAudio": "assets/audio/lines/r2-l2.mp3", "modelSlow": "assets/audio/lines/r2-l2-slow.mp3"},
                    {"partner": "Ana", "partnerId": "ana", "line": "Would you like water or tea?", "audio": "assets/audio/lines/r2-l3.mp3", "audioSlow": "assets/audio/lines/r2-l3-slow.mp3", "expect": "Can I have some water, please?", "keywords": ["water"], "modelAudio": "assets/audio/lines/r2-l4.mp3", "modelSlow": "assets/audio/lines/r2-l4-slow.mp3"},
                    {"partner": "Ana", "partnerId": "ana", "line": "Anything else?", "audio": "assets/audio/lines/r2-l5.mp3", "audioSlow": "assets/audio/lines/r2-l5-slow.mp3", "expect": "What do you recommend?", "keywords": ["recommend"], "modelAudio": "assets/audio/lines/r2-l6.mp3", "modelSlow": "assets/audio/lines/r2-l6-slow.mp3"},
                ],
            },
            "quiz": [
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "chicken-noun", "choices": ["chicken", "sheet", "sheep"], "answer": 0},
                {"type": "listen", "prompt": "你聽到邊個？", "lemma": "cant-verb", "choices": ["can't", "can", "cat"], "answer": 0},
                {"type": "meaning", "prompt": "recommend", "choices": ["推薦", "訂位", "登機證"], "answer": 0},
                {"type": "meaning", "prompt": "I'd like the chicken.", "choices": ["我想叫雞", "我想要杯水", "我睇吓先"], "answer": 0},
                {"type": "choice", "prompt": "can't 同 can 差喺邊？", "choices": ["can't 有清楚嘅 /t/", "兩個完全一樣", "can't 係 /ʃ/"], "answer": 0, "explain": "食咗尾 /t/ 就會聽成 can。問句入面 can 通常好輕 /kən/。"},
            ],
            "sound": {
                "ipa": "/tʃ/ · /ʃ/ · /kən/ · /kænt/",
                "title": "雞、can、can't",
                "note": "chicken 開頭係 /tʃ/，舌尖先堵住再放出。sheet 先至係 /ʃ/，一口氣慢慢出，冇粒塞音。問句 Can I 入面 can 好輕，讀 /kən/，冇重音。can't 先至係 /kænt/，有個清楚嘅 /t/。食咗個 /t/ 就會聽成 can。recommend 重音喺最後一節 mend，唔好讀成第一節。",
                "pairs": [
                    {"a": "chicken-noun", "b": "sheet-noun"},
                    {"a": "can-verb", "b": "cant-verb"},
                ],
                "drill": ["chicken-noun", "can-verb", "cant-verb", "recommend-verb", "order-verb", "water-noun"],
            },
            "next": None,
        },
    ]
    # attach extra lines onto a side channel via the first lesson? Renderer collects all lessons' dialogue
    # plus this list stored on path meta. We'll return extras separately.
    from round19_content import lesson_pack
    added, more = lesson_pack()
    from round20_content import lesson_pack as lesson_pack20
    added20, more20 = lesson_pack20()
    by20 = {lesson["id"]: lesson for lesson in added20}
    built = []
    for lesson in lessons:
        built.append(lesson)
        if lesson["id"] == "J3":
            built.extend(added)
            built.append(by20["J7"])
        if lesson["id"] == "T2":
            built.append(by20["T3"])
        if lesson["id"] == "R2":
            built.append(by20["R3"])
    extras.extend(more)
    extras.extend(more20)
    return built, extras


PATH = {
    "units": [
        {
            "id": "F",
            "title": "打好基礎",
            "blurb": "氣息、打招呼、數字、禮貌。",
            "lessons": [
                {"id": "F1"},
                {"id": "F2"},
                {"id": "F3"},
                {"id": "F4"},
            ],
        },
        {
            "id": "J",
            "title": "珠寶櫃檯",
            "blurb": "明日返工用得着。",
            "lessons": [
                {"id": "J1"},
                {"id": "J2"},
                {"id": "J3"},
                {"id": "J4"},
                {"id": "J5"},
                {"id": "J6"},
                {"id": "J7", "title": "收尾同道別", "soon": True},
                {"id": "J8", "title": "售後同保養", "soon": True},
                {"id": "J9", "title": "投訴同退換", "soon": True},
            ],
        },
        {
            "id": "T",
            "title": "旅行",
            "blurb": "機場先。",
            "lessons": [
                {"id": "T1"},
                {"id": "T2"},
                {"id": "T3", "title": "酒店入住", "soon": True},
                {"id": "T4", "title": "的士同問路", "soon": True},
                {"id": "T5", "title": "行失咗點求人", "soon": True},
            ],
        },
        {
            "id": "R",
            "title": "餐廳",
            "blurb": "入座，然後落單。",
            "lessons": [
                {"id": "R1"},
                {"id": "R2"},
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
    from round19_content import apply_round
    decks = apply_round(ITEMS, lessons, PATH, FLAGS)
    from round20_content import apply_round20
    decks = apply_round20(ITEMS, lessons, PATH, FLAGS, decks)
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
    seen_lines = set()
    for lesson in lessons:
        for row in lesson["dialogue"]:
            if row["id"] in seen_lines:
                continue
            seen_lines.add(row["id"])
            manifest_lines.append(row)
    for row in extras:
        if row["id"] in seen_lines:
            continue
        seen_lines.add(row["id"])
        manifest_lines.append(row)
    (OUT / "lines.json").write_text(json.dumps(manifest_lines, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "path.json").write_text(json.dumps(PATH, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "decks.json").write_text(json.dumps(decks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
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

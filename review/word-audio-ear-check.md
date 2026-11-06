# 每日抽卡 word clips: ear check

These **47 cards have no word clip in 每日抽卡**. They are still drawn, but the card front shows no word 🔊 (the back still plays its checked example sentence).

Word clips use Piper `en_US-libritts_r-medium`, speaker 144 (LibriTTS-R, CC BY 4.0):
the sentence voice, LJSpeech, garbles many isolated words. A take is kept only when
Whisper small.en (on the clip and on it a little quieter, louder and noisier) and
NVIDIA Parakeet both hear the word, or a reviewed homophone in
`tests/fixtures/word-homophones.json`, for the normal and the slow clip. These cards
got 6 takes, then 12 more, and none passed. Two recognisers agreeing on a different
word usually means the take really is wrong, but a person should decide. The last
take of each is kept on disk so a person can listen.

Play the clips from `assets/audio/` and tick the box only if the word is clear and
said right, normal and slow.

**To accept a ticked word:**
1. Delete its id from `content/word-audio-skip.json`.
2. Run `python3 scripts/render_audio.py`. The take you heard is kept (its file and
   text hash already match) and the word is added to `content/word-audio.json`.
3. Add both clips to `tests/fixtures/asr-known.json` with "ear check
   (review/word-audio-ear-check.md)", so the ASR check reports them instead of
   failing on the recognisers' mishearing.
4. `npm test`.

A word that sounds wrong stays in the skip list. It can get a `[[phoneme]]`
override in `WORD_SAY` (`scripts/render_audio.py`) and another try with
`scripts/pick_word_takes.py --only <id>`. If the recognisers wrote a true homophone,
add it to `tests/fixtures/word-homophones.json` instead.

| ✓ | Word | Card | 粵語 | Override | small.en heard (normal / slow) | Clips to play |
|---|---|---|---|---|---|---|
| ☐ | **a** | `a-art` | 一個（子音前面，弱讀） | `[[ə]]` | (static / *B | `words/a-art-word.mp3`, `words/a-art-word-slow.mp3` |
| ☐ | **back** | `back-adv` | 返嚟 | — | (passed) / Eh. | `words/back-adv-word.mp3`, `words/back-adv-word-slow.mp3` |
| ☐ | **bag** | `bag-noun` | 袋 | — | Back / TACT | `words/bag-noun-word.mp3`, `words/bag-noun-word-slow.mp3` |
| ☐ | **bow** | `bow-verb` | 鞠躬 | `[[bˈaʊ]]` | (passed) / Thou | `words/bow-verb-word.mp3`, `words/bow-verb-word-slow.mp3` |
| ☐ | **breakfast** | `breakfast-noun` | 早餐 | `[[ˈbɹɛkfəst]]` | A breakfast / A breakfast. | `words/breakfast-noun-word.mp3`, `words/breakfast-noun-word-slow.mp3` |
| ☐ | **by** | `by-prep` | 喺…旁邊 | — | *Slam / *Sigh | `words/by-prep-word.mp3`, `words/by-prep-word-slow.mp3` |
| ☐ | **chew** | `chew-verb` | 嚼 | — | 下 / 下 | `words/chew-verb-word.mp3`, `words/chew-verb-word-slow.mp3` |
| ☐ | **cost** | `cost-noun` | 費用 | `[[kˈɑst]]` | PUST / cast | `words/cost-noun-word.mp3`, `words/cost-noun-word-slow.mp3` |
| ☐ | **cough** | `cough-noun` | 咳嗽 | `[[ˈkɔf]]` | Hoth / Half | `words/cough-noun-word.mp3`, `words/cough-noun-word-slow.mp3` |
| ☐ | **fee** | `fee-noun` | 費用 | — | 下 / 下 | `words/fee-noun-word.mp3`, `words/fee-noun-word-slow.mp3` |
| ☐ | **few** | `few-det` | 幾件 | — | Phew! / "hue" | `words/few-det-word.mp3`, `words/few-det-word-slow.mp3` |
| ☐ | **have** | `have-verb` | 有 | — | half / half | `words/have-verb-word.mp3`, `words/have-verb-word-slow.mp3` |
| ☐ | **headache** | `headache-noun` | 頭痛 | `[[ˈhɛdˌeɪk]]` | Eddache / at ACH | `words/headache-noun-word.mp3`, `words/headache-noun-word-slow.mp3` |
| ☐ | **high chair** | `high-chair-phrase` | 兒童椅（BB櫈） | — | Hi chair. / (passed) | `words/high-chair-phrase-word.mp3`, `words/high-chair-phrase-word-slow.mp3` |
| ☐ | **in** | `in-prep` | 入面 | — | Death / Yes. | `words/in-prep-word.mp3`, `words/in-prep-word-slow.mp3` |
| ☐ | **karat** | `karat-noun` | 開 | `[[kˈɛɹət]]` | carrot / carrot | `words/karat-noun-word.mp3`, `words/karat-noun-word-slow.mp3` |
| ☐ | **key card** | `key-card-phrase` | 鑰匙卡 | `[[ˈki ˈkɑɹd]]` | E-card / e-card | `words/key-card-phrase-word.mp3`, `words/key-card-phrase-word-slow.mp3` |
| ☐ | **late checkout** | `late-checkout-phrase` | 延遲退房 | `[[ˈleɪt ˈtʃɛkˌaʊt]]` | Elite Edge account / Elite Edge account | `words/late-checkout-phrase-word.mp3`, `words/late-checkout-phrase-word-slow.mp3` |
| ☐ | **long wait** | `long-wait-phrase` | 等好耐 | — | Long weight / Long weight | `words/long-wait-phrase-word.mp3`, `words/long-wait-phrase-word-slow.mp3` |
| ☐ | **Macau** | `macau-noun` | 澳門 | — | Mako / (passed) | `words/macau-noun-word.mp3`, `words/macau-noun-word-slow.mp3` |
| ☐ | **may** | `may-verb` | 可以（客氣） | — | May / (passed) | `words/may-verb-word.mp3`, `words/may-verb-word-slow.mp3` |
| ☐ | **o'clock** | `oclock-adv` | 點 | — | A clock. / A clock. | `words/oclock-adv-word.mp3`, `words/oclock-adv-word-slow.mp3` |
| ☐ | **pair** | `pair-noun` | 一對 | — | Hair / (passed) | `words/pair-noun-word.mp3`, `words/pair-noun-word-slow.mp3` |
| ☐ | **pay** | `pay-verb` | 付款 | — | Hey. / Hey. | `words/pay-verb-word.mp3`, `words/pay-verb-word-slow.mp3` |
| ☐ | **payroll** | `payroll-noun` | 計糧 | — | Harrell / Harrell | `words/payroll-noun-word.mp3`, `words/payroll-noun-word-slow.mp3` |
| ☐ | **payslip** | `payslip-noun` | 糧單 | — | Pay sleep. / Pay sleep | `words/payslip-noun-word.mp3`, `words/payslip-noun-word-slow.mp3` |
| ☐ | **peanut** | `peanut-noun` | 花生 | `[[pˈinət]]` | He knit / He knit | `words/peanut-noun-word.mp3`, `words/peanut-noun-word-slow.mp3` |
| ☐ | **pick-up point** | `pickup-point-phrase` | 上車站 | — | Pick up points / (passed) | `words/pickup-point-phrase-word.mp3`, `words/pickup-point-phrase-word-slow.mp3` |
| ☐ | **prepaid** | `prepaid-adj` | 預繳 | — | for paid / (passed) | `words/prepaid-adj-word.mp3`, `words/prepaid-adj-word-slow.mp3` |
| ☐ | **quote** | `quote-noun` | 報價 | — | hoped / " | `words/quote-noun-word.mp3`, `words/quote-noun-word-slow.mp3` |
| ☐ | **refund** | `refund-noun` | 退款 | `[[ˈɹifənd]]` | A reef end. / I refund. | `words/refund-noun-word.mp3`, `words/refund-noun-word-slow.mp3` |
| ☐ | **right this way** | `right-this-way-phrase` | 請跟我嚟 | — | Write this way. / (passed) | `words/right-this-way-phrase-word.mp3`, `words/right-this-way-phrase-word-slow.mp3` |
| ☐ | **rose gold** | `rose-gold-phrase` | 玫瑰金 | `[[ˈɹoʊz ˈɡoʊld]]` | A rose of gold. / arose a gold. | `words/rose-gold-phrase-word.mp3`, `words/rose-gold-phrase-word-slow.mp3` |
| ☐ | **shoe** | `shoe-noun` | 鞋 | — | shu / shu | `words/shoe-noun-word.mp3`, `words/shoe-noun-word-slow.mp3` |
| ☐ | **sir** | `sir-noun` | 先生（客氣） | `[[sˈɝ]]` | [S] / /s/ | `words/sir-noun-word.mp3`, `words/sir-noun-word-slow.mp3` |
| ☐ | **sorry** | `sorry-adj` | 對唔住 | `[[ˈsɑɹi]]` | sorry / Surrey | `words/sorry-adj-word.mp3`, `words/sorry-adj-word-slow.mp3` |
| ☐ | **sparkling** | `sparkling-adj` | 有氣 | `[[ˈspɑɹklɪŋ]]` | A sparkling / espercling | `words/sparkling-adj-word.mp3`, `words/sparkling-adj-word-slow.mp3` |
| ☐ | **a table for two** | `table-for-two-phrase` | 兩位 | `[[ə ˈteɪbəl fɚ ˈtu]]` | I debul for it. / Edible for "et". | `words/table-for-two-phrase-word.mp3`, `words/table-for-two-phrase-word-slow.mp3` |
| ☐ | **tea** | `tea-noun` | 茶 | — | 𝘵 / 下 | `words/tea-noun-word.mp3`, `words/tea-noun-word-slow.mp3` |
| ☐ | **the** | `the-art-vowel` | 英文冠詞，元音前面弱讀，中文往往唔使譯 | `[[ðˈi]]` | 𝘴 / (passed) | `words/the-art-vowel-word.mp3`, `words/the-art-vowel-word-slow.mp3` |
| ☐ | **three** | `three-num` | 三 | — | (passed) / three | `words/three-num-word.mp3`, `words/three-num-word-slow.mp3` |
| ☐ | **towel** | `towel-noun` | 毛巾 | — | tau / (passed) | `words/towel-noun-word.mp3`, `words/towel-noun-word-slow.mp3` |
| ☐ | **try on** | `try-on-phrase` | 試戴 | — | Fry on! / Fry on! | `words/try-on-phrase-word.mp3`, `words/try-on-phrase-word-slow.mp3` |
| ☐ | **twin** | `twin-noun` | 雙床 | — | fwen / when | `words/twin-noun-word.mp3`, `words/twin-noun-word-slow.mp3` |
| ☐ | **weight** | `weight-noun` | 重量 | `[[ˈweɪt]]` | Oh wait. / await | `words/weight-noun-word.mp3`, `words/weight-noun-word-slow.mp3` |
| ☐ | **wipe** | `wipe-verb` | 抹 | — | (passed) / white | `words/wipe-verb-word.mp3`, `words/wipe-verb-word-slow.mp3` |
| ☐ | **would** | `would-verb` | 想唔想（客氣） | — | wit / wit | `words/would-verb-word.mp3`, `words/would-verb-word-slow.mp3` |

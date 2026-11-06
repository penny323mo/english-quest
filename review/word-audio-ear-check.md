# 每日抽卡 word clips: ear check

These **121 cards have no word clip in 每日抽卡**. They are still drawn, but the card front shows no word 🔊 (the back still plays its checked example sentence).

Word clips use Kokoro v0.19 (Apache-2.0 weights), voice `af`, through sherpa-onnx:
the sentence voice, LJSpeech, garbles many isolated words, and the Piper voices that
read them well are fine-tuned from the research-only Lessac data. A take is kept only
when Whisper small.en (on the clip and on it a little quieter, louder, noisier with
two seeds, and shifted by 40 ms) and NVIDIA Parakeet both hear exactly the word, or a
reviewed homophone in `tests/fixtures/word-homophones.json`, for the normal and the
slow clip. These cards got 6 takes, then 12 more, and none passed. "(passed)" means
that clip was heard right but its twin was not. Two recognisers disagreeing with the
word usually means the take is wrong, but a person should decide. The last take of
each is kept on disk so a person can listen.

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
| ☐ | **a** | `a-art` | 一個（子音前面，弱讀） | `[[ə]]` | [AUDIO OUT / (buzzing | `words/a-art-word.mp3`, `words/a-art-word-slow.mp3` |
| ☐ | **aisle** | `aisle-noun` | 走廊位 | — | I'll / I'll | `words/aisle-noun-word.mp3`, `words/aisle-noun-word-slow.mp3` |
| ☐ | **alcohol** | `alcohol-noun` | 酒（酒類） | — | (passed) / Alcohol | `words/alcohol-noun-word.mp3`, `words/alcohol-noun-word-slow.mp3` |
| ☐ | **allergic** | `allergic-adj` | 過敏 | `[[əlˈɜdʒɪk]]` | Allegic / Allegic | `words/allergic-adj-word.mp3`, `words/allergic-adj-word-slow.mp3` |
| ☐ | **beat** | `beat-verb` | 拍子；打拍 | — | (passed) / Bait | `words/beat-verb-word.mp3`, `words/beat-verb-word-slow.mp3` |
| ☐ | **breakfast** | `breakfast-noun` | 早餐 | `[[ˈbɹɛkfəst]]` | (passed) / A breakfast. | `words/breakfast-noun-word.mp3`, `words/breakfast-noun-word-slow.mp3` |
| ☐ | **buffet** | `buffet-noun` | 自助餐 | — | Buffet / buff it | `words/buffet-noun-word.mp3`, `words/buffet-noun-word-slow.mp3` |
| ☐ | **card** | `card-noun` | 卡 | — | card card / card card | `words/card-noun-word.mp3`, `words/card-noun-word-slow.mp3` |
| ☐ | **check** | `check-noun` | 張單（埋單） | — | (passed) / Check it. | `words/check-noun-word.mp3`, `words/check-noun-word-slow.mp3` |
| ☐ | **check** | `check-verb` | 辦理（登機） | — | (passed) / Check it. | `words/check-verb-word.mp3`, `words/check-verb-word-slow.mp3` |
| ☐ | **chef** | `chef-noun` | 廚師 | — | (passed) / The Chef | `words/chef-noun-word.mp3`, `words/chef-noun-word-slow.mp3` |
| ☐ | **chew** | `chew-verb` | 嚼 | — | chu / chu | `words/chew-verb-word.mp3`, `words/chew-verb-word-slow.mp3` |
| ☐ | **clock** | `clock-noun` | 鐘 | — | (passed) / clock | `words/clock-noun-word.mp3`, `words/clock-noun-word-slow.mp3` |
| ☐ | **close** | `close-verb` | 關上 | `[[klˈoʊz]]` | (passed) / Clothes | `words/close-verb-word.mp3`, `words/close-verb-word-slow.mp3` |
| ☐ | **cold** | `cold-adj` | 凍 | — | cold / cold cold | `words/cold-adj-word.mp3`, `words/cold-adj-word-slow.mp3` |
| ☐ | **compensation** | `compensation-noun` | 賠償 | — | (passed) / compensation compensation | `words/compensation-noun-word.mp3`, `words/compensation-noun-word-slow.mp3` |
| ☐ | **complimentary** | `complimentary-adj` | 免費贈送 | — | complementary / Complementary | `words/complimentary-adj-word.mp3`, `words/complimentary-adj-word-slow.mp3` |
| ☐ | **cost** | `cost-noun` | 費用 | `[[kˈɑst]]` | (passed) / cost | `words/cost-noun-word.mp3`, `words/cost-noun-word-slow.mp3` |
| ☐ | **cough** | `cough-noun` | 咳嗽 | `[[ˈkɔf]]` | comma / The castle of... | `words/cough-noun-word.mp3`, `words/cough-noun-word-slow.mp3` |
| ☐ | **course** | `course-noun` | 當然 | — | (passed) / course | `words/course-noun-word.mp3`, `words/course-noun-word-slow.mp3` |
| ☐ | **cup** | `cup-noun` | 杯 | — | Cup / (passed) | `words/cup-noun-word.mp3`, `words/cup-noun-word-slow.mp3` |
| ☐ | **discreet** | `discreet-adj` | 低調處理 | — | Discrete / Discrete | `words/discreet-adj-word.mp3`, `words/discreet-adj-word-slow.mp3` |
| ☐ | **egg** | `egg-noun` | 蛋 | — | Aggie / Eggy | `words/egg-noun-word.mp3`, `words/egg-noun-word-slow.mp3` |
| ☐ | **else** | `else-adv` | 其他 | — | Elsa / else | `words/else-adv-word.mp3`, `words/else-adv-word-slow.mp3` |
| ☐ | **email** | `email-noun` | 電郵 | `[[iˈmeɪl]]` | (passed) / YE male | `words/email-noun-word.mp3`, `words/email-noun-word-slow.mp3` |
| ☐ | **excess** | `excess-noun` | 自付額 | — | Access / (passed) | `words/excess-noun-word.mp3`, `words/excess-noun-word-slow.mp3` |
| ☐ | **fee** | `fee-noun` | 費用 | — | Feed / Feed | `words/fee-noun-word.mp3`, `words/fee-noun-word-slow.mp3` |
| ☐ | **few** | `few-det` | 幾件 | — | Phew / Phew. | `words/few-det-word.mp3`, `words/few-det-word-slow.mp3` |
| ☐ | **fit** | `fit-verb` | 啱戴 | — | Jin / (passed) | `words/fit-verb-word.mp3`, `words/fit-verb-word-slow.mp3` |
| ☐ | **fitting room** | `fitting-room-phrase` | 試身室 | — | Fitting room / (passed) | `words/fitting-room-phrase-word.mp3`, `words/fitting-room-phrase-word-slow.mp3` |
| ☐ | **for** | `for-prep` | 畀；為咗 | — | (passed) / 4 4 | `words/for-prep-word.mp3`, `words/for-prep-word-slow.mp3` |
| ☐ | **four** | `four-num` | 四 | — | for / Fort Fort | `words/four-num-word.mp3`, `words/four-num-word-slow.mp3` |
| ☐ | **freeze** | `freeze-verb` | 凍結 | — | (passed) / phrase | `words/freeze-verb-word.mp3`, `words/freeze-verb-word-slow.mp3` |
| ☐ | **gram** | `gram-noun` | 克 | — | gram / gram | `words/gram-noun-word.mp3`, `words/gram-noun-word-slow.mp3` |
| ☐ | **guarantee** | `guarantee-noun` | 保用 | — | (passed) / guarantee | `words/guarantee-noun-word.mp3`, `words/guarantee-noun-word-slow.mp3` |
| ☐ | **high chair** | `high-chair-phrase` | 兒童椅（BB櫈） | — | High chair / (passed) | `words/high-chair-phrase-word.mp3`, `words/high-chair-phrase-word-slow.mp3` |
| ☐ | **if** | `if-conj` | 如果 | — | (passed) / Yes. | `words/if-conj-word.mp3`, `words/if-conj-word-slow.mp3` |
| ☐ | **is** | `is-verb` | 係 | — | sikma / (passed) | `words/is-verb-word.mp3`, `words/is-verb-word-slow.mp3` |
| ☐ | **it** | `it-pron` | 佢（物件） | — | (audio cuts out / It's not. | `words/it-pron-word.mp3`, `words/it-pron-word-slow.mp3` |
| ☐ | **jade** | `jade-noun` | 玉 | `[[dʒˈeɪd]]` | Jade Jade / (passed) | `words/jade-noun-word.mp3`, `words/jade-noun-word-slow.mp3` |
| ☐ | **jewellery** | `jewellery-noun` | 珠寶（英式串法） | `[[dʒˈulɹi]]` | bracelet / bracelet | `words/jewellery-noun-word.mp3`, `words/jewellery-noun-word-slow.mp3` |
| ☐ | **jewelry** | `jewelry-noun` | 珠寶（美式串法） | `[[dʒˈulɹi]]` | bracelet / bracelet | `words/jewelry-noun-word.mp3`, `words/jewelry-noun-word-slow.mp3` |
| ☐ | **job** | `job-noun` | 工作 | — | (passed) / jobby | `words/job-noun-word.mp3`, `words/job-noun-word-slow.mp3` |
| ☐ | **karat** | `karat-noun` | 開 | `[[kˈɛɹət]]` | carrot / carrot | `words/karat-noun-word.mp3`, `words/karat-noun-word-slow.mp3` |
| ☐ | **key card** | `key-card-phrase` | 鑰匙卡 | `[[ˈki ˈkɑɹd]]` | (passed) / Kia card | `words/key-card-phrase-word.mp3`, `words/key-card-phrase-word-slow.mp3` |
| ☐ | **know** | `know-verb` | 知道 | — | No / (passed) | `words/know-verb-word.mp3`, `words/know-verb-word-slow.mp3` |
| ☐ | **laptop** | `laptop-noun` | 手提電腦 | `[[lˈæpˌtɑp]]` | Lapido / Lapita | `words/laptop-noun-word.mp3`, `words/laptop-noun-word-slow.mp3` |
| ☐ | **late checkout** | `late-checkout-phrase` | 延遲退房 | `[[ˈleɪt ˈtʃɛkˌaʊt]]` | LayTitch account / later checkout | `words/late-checkout-phrase-word.mp3`, `words/late-checkout-phrase-word-slow.mp3` |
| ☐ | **leak** | `leak-noun` | 漏水 | — | (passed) / Lake | `words/leak-noun-word.mp3`, `words/leak-noun-word-slow.mp3` |
| ☐ | **lease** | `lease-noun` | 租約 | — | (passed) / Lace | `words/lease-noun-word.mp3`, `words/lease-noun-word-slow.mp3` |
| ☐ | **led** | `led-verb` | 帶領（過去） | — | Lead / Lead | `words/led-verb-word.mp3`, `words/led-verb-word-slow.mp3` |
| ☐ | **live** | `live-verb` | 住 | `[[lˈɪv]]` | (passed) / Liz | `words/live-verb-word.mp3`, `words/live-verb-word-slow.mp3` |
| ☐ | **lustre** | `lustre-noun` | 光澤 | — | Lustr / (passed) | `words/lustre-noun-word.mp3`, `words/lustre-noun-word-slow.mp3` |
| ☐ | **Macau** | `macau-noun` | 澳門 | — | (passed) / Macau | `words/macau-noun-word.mp3`, `words/macau-noun-word-slow.mp3` |
| ☐ | **madam** | `madam-noun` | 女士（客氣） | — | madam / (passed) | `words/madam-noun-word.mp3`, `words/madam-noun-word-slow.mp3` |
| ☐ | **may** | `may-verb` | 可以（客氣） | — | May / Mayth | `words/may-verb-word.mp3`, `words/may-verb-word-slow.mp3` |
| ☐ | **meet** | `meet-verb` | 見；認識 | — | (passed) / mate | `words/meet-verb-word.mp3`, `words/meet-verb-word-slow.mp3` |
| ☐ | **millilitre** | `millilitre-noun` | 毫升 | — | (passed) / milliliter | `words/millilitre-noun-word.mp3`, `words/millilitre-noun-word-slow.mp3` |
| ☐ | **o'clock** | `oclock-adv` | 點 | — | A clock. / A clock. | `words/oclock-adv-word.mp3`, `words/oclock-adv-word-slow.mp3` |
| ☐ | **of** | `of-prep` | 嘅；屬於 | `[[ˈʌv]]` | others / A move. | `words/of-prep-word.mp3`, `words/of-prep-word-slow.mp3` |
| ☐ | **off** | `off-adv` | 減 | — | Wasp / Both. | `words/off-adv-word.mp3`, `words/off-adv-word-slow.mp3` |
| ☐ | **order** | `order-verb` | 叫（落單） | — | (passed) / ordered | `words/order-verb-word.mp3`, `words/order-verb-word-slow.mp3` |
| ☐ | **pair** | `pair-noun` | 一對 | — | pairs / Pairs | `words/pair-noun-word.mp3`, `words/pair-noun-word-slow.mp3` |
| ☐ | **percent** | `percent-noun` | 百分比 | — | percent / (passed) | `words/percent-noun-word.mp3`, `words/percent-noun-word-slow.mp3` |
| ☐ | **platinum** | `platinum-noun` | 鉑金 | `[[plˈætənəm]]` | (passed) / Platinum Platinum | `words/platinum-noun-word.mp3`, `words/platinum-noun-word-slow.mp3` |
| ☐ | **postage stamp** | `postage-stamp-noun` | 郵票 | — | (passed) / Postage a stamp. | `words/postage-stamp-noun-word.mp3`, `words/postage-stamp-noun-word-slow.mp3` |
| ☐ | **prepaid** | `prepaid-adj` | 預繳 | — | (passed) / Prepaid | `words/prepaid-adj-word.mp3`, `words/prepaid-adj-word-slow.mp3` |
| ☐ | **priority** | `priority-noun` | 優先 | — | Priority / (passed) | `words/priority-noun-word.mp3`, `words/priority-noun-word-slow.mp3` |
| ☐ | **quote** | `quote-noun` | 報價 | — | quote / " | `words/quote-noun-word.mp3`, `words/quote-noun-word-slow.mp3` |
| ☐ | **reach** | `reach-verb` | 聯絡到 | — | (passed) / Rach | `words/reach-verb-word.mp3`, `words/reach-verb-word-slow.mp3` |
| ☐ | **read** | `read-verb-present` | 讀（而家／習慣） | `[[ɹˈid]]` | RID / RID | `words/read-verb-present-word.mp3`, `words/read-verb-present-word-slow.mp3` |
| ☐ | **refill** | `refill-noun` | 添杯 | — | Refill / (passed) | `words/refill-noun-word.mp3`, `words/refill-noun-word-slow.mp3` |
| ☐ | **refund** | `refund-noun` | 退款 | `[[ˈɹifənd]]` | Arefend. / or efend | `words/refund-noun-word.mp3`, `words/refund-noun-word-slow.mp3` |
| ☐ | **return** | `return-noun` | 退貨 | `[[ɹɪtˈɜn]]` | RETURN / RETURN | `words/return-noun-word.mp3`, `words/return-noun-word-slow.mp3` |
| ☐ | **right this way** | `right-this-way-phrase` | 請跟我嚟 | — | Write this way. / (passed) | `words/right-this-way-phrase-word.mp3`, `words/right-this-way-phrase-word-slow.mp3` |
| ☐ | **rose gold** | `rose-gold-phrase` | 玫瑰金 | `[[ˈɹoʊz ˈɡoʊld]]` | Rosa Gold / Rose a gold | `words/rose-gold-phrase-word.mp3`, `words/rose-gold-phrase-word-slow.mp3` |
| ☐ | **sauce** | `sauce-noun` | 醬 | — | (passed) / Sauce | `words/sauce-noun-word.mp3`, `words/sauce-noun-word-slow.mp3` |
| ☐ | **savings account** | `savings-account-phrase` | 儲蓄戶口 | `[[ˈseɪvɪŋz əˈkaʊnt]]` | a savings account / A savings account. | `words/savings-account-phrase-word.mp3`, `words/savings-account-phrase-word-slow.mp3` |
| ☐ | **scratch** | `scratch-noun` | 刮痕 | — | (passed) / Scratch | `words/scratch-noun-word.mp3`, `words/scratch-noun-word-slow.mp3` |
| ☐ | **see** | `see-verb` | 睇 | — | (passed) / Seed. | `words/see-verb-word.mp3`, `words/see-verb-word-slow.mp3` |
| ☐ | **set** | `set-noun` | 套裝 | — | (passed) / said. | `words/set-noun-word.mp3`, `words/set-noun-word-slow.mp3` |
| ☐ | **sheep** | `sheep-noun` | 羊 | — | (passed) / sheep | `words/sheep-noun-word.mp3`, `words/sheep-noun-word-slow.mp3` |
| ☐ | **shellfish** | `shellfish-noun` | 貝類 | — | shellfish / selfish | `words/shellfish-noun-word.mp3`, `words/shellfish-noun-word-slow.mp3` |
| ☐ | **shift** | `shift-noun` | 更 | — | (passed) / shift | `words/shift-noun-word.mp3`, `words/shift-noun-word-slow.mp3` |
| ☐ | **ship** | `ship-noun` | 船 | — | (passed) / SHIP | `words/ship-noun-word.mp3`, `words/ship-noun-word-slow.mp3` |
| ☐ | **shoe** | `shoe-noun` | 鞋 | — | Shoe / Shoo | `words/shoe-noun-word.mp3`, `words/shoe-noun-word-slow.mp3` |
| ☐ | **sick** | `sick-adj` | 病 | — | SICKY / Sake | `words/sick-adj-word.mp3`, `words/sick-adj-word-slow.mp3` |
| ☐ | **SIM** | `sim-noun` | 電話卡 | — | Simma / Sim | `words/sim-noun-word.mp3`, `words/sim-noun-word-slow.mp3` |
| ☐ | **sir** | `sir-noun` | 先生（客氣） | `[[sˈɝ]]` | Thank you. / You'll see. | `words/sir-noun-word.mp3`, `words/sir-noun-word-slow.mp3` |
| ☐ | **sit** | `sit-verb` | 坐 | — | Sit. / Zeta | `words/sit-verb-word.mp3`, `words/sit-verb-word-slow.mp3` |
| ☐ | **six** | `six-num` | 六 | — | (passed) / The sex | `words/six-num-word.mp3`, `words/six-num-word-slow.mp3` |
| ☐ | **sketch** | `sketch-noun` | 草圖 | — | (passed) / The sketch. | `words/sketch-noun-word.mp3`, `words/sketch-noun-word-slow.mp3` |
| ☐ | **sorry** | `sorry-adj` | 對唔住 | `[[ˈsɑɹi]]` | Asuri / Isari | `words/sorry-adj-word.mp3`, `words/sorry-adj-word-slow.mp3` |
| ☐ | **sparkling** | `sparkling-adj` | 有氣 | `[[ˈspɑɹklɪŋ]]` | (passed) / A sparkling... | `words/sparkling-adj-word.mp3`, `words/sparkling-adj-word-slow.mp3` |
| ☐ | **spell** | `spell-verb` | 串字 | — | (passed) / Spell | `words/spell-verb-word.mp3`, `words/spell-verb-word-slow.mp3` |
| ☐ | **split** | `split-verb` | 分單 | — | (passed) / A split. | `words/split-verb-word.mp3`, `words/split-verb-word-slow.mp3` |
| ☐ | **stamp** | `stamp-verb` | 蓋章 | `[[ˈstæmp]]` | A stamp / A stamp. | `words/stamp-verb-word.mp3`, `words/stamp-verb-word-slow.mp3` |
| ☐ | **stock** | `stock-noun` | 存貨 | — | (passed) / The stock. | `words/stock-noun-word.mp3`, `words/stock-noun-word-slow.mp3` |
| ☐ | **street** | `street-noun` | 街 | — | (passed) / Street | `words/street-noun-word.mp3`, `words/street-noun-word-slow.mp3` |
| ☐ | **table for** | `table-for-phrase` | 幾位檯 | — | Table 4 / Table 4 | `words/table-for-phrase-word.mp3`, `words/table-for-phrase-word-slow.mp3` |
| ☐ | **a table for two** | `table-for-two-phrase` | 兩位 | `[[ə ˈteɪbəl fɚ ˈtu]]` | A table fur / A table fur | `words/table-for-two-phrase-word.mp3`, `words/table-for-two-phrase-word-slow.mp3` |
| ☐ | **take** | `take-verb` | 要 | — | Take it. / Take | `words/take-verb-word.mp3`, `words/take-verb-word-slow.mp3` |
| ☐ | **tap** | `tap-noun` | 水龍頭 | — | Tap / (passed) | `words/tap-noun-word.mp3`, `words/tap-noun-word-slow.mp3` |
| ☐ | **the** | `the-art` | 英文冠詞，子音前面弱讀，中文往往唔使譯 | `[[ðə]]` | and / I said | `words/the-art-word.mp3`, `words/the-art-word-slow.mp3` |
| ☐ | **the** | `the-art-vowel` | 英文冠詞，元音前面弱讀，中文往往唔使譯 | `[[ðˈi]]` | They / They... | `words/the-art-vowel-word.mp3`, `words/the-art-vowel-word-slow.mp3` |
| ☐ | **think** | `think-verb` | 諗 | — | Thank you. / Thank you. | `words/think-verb-word.mp3`, `words/think-verb-word-slow.mp3` |
| ☐ | **too** | `too-adv` | 都 | — | (passed) / A 2. | `words/too-adv-word.mp3`, `words/too-adv-word-slow.mp3` |
| ☐ | **toothache** | `toothache-noun` | 牙痛 | — | toothache / (passed) | `words/toothache-noun-word.mp3`, `words/toothache-noun-word-slow.mp3` |
| ☐ | **top-up** | `top-up-noun` | 增值 | — | (passed) / Top puppet | `words/top-up-noun-word.mp3`, `words/top-up-noun-word-slow.mp3` |
| ☐ | **transfer** | `transfer-verb` | 轉駁 | `[[tɹænsfˈɜ]]` | a savings account / A savings account. | `words/transfer-verb-word.mp3`, `words/transfer-verb-word-slow.mp3` |
| ☐ | **transfer** | `transfer-verb-bag` | 轉運 | `[[tɹænsfˈɜ]]` | a savings account / A savings account. | `words/transfer-verb-bag-word.mp3`, `words/transfer-verb-bag-word-slow.mp3` |
| ☐ | **treated** | `treated-adj` | 處理過 | `[[tɹˈitɪd]]` | Treateda / Treated A | `words/treated-adj-word.mp3`, `words/treated-adj-word-slow.mp3` |
| ☐ | **two** | `two-num` | 二；兩 | — | (passed) / A 2. | `words/two-num-word.mp3`, `words/two-num-word-slow.mp3` |
| ☐ | **week** | `week-noun` | 星期 | — | (passed) / WAKE | `words/week-noun-word.mp3`, `words/week-noun-word-slow.mp3` |
| ☐ | **weekend** | `weekend-noun` | 週末 | — | (passed) / We canned | `words/weekend-noun-word.mp3`, `words/weekend-noun-word-slow.mp3` |
| ☐ | **weight** | `weight-noun` | 重量 | `[[ˈweɪt]]` | Wait / Oh wait. | `words/weight-noun-word.mp3`, `words/weight-noun-word-slow.mp3` |
| ☐ | **wine** | `wine-noun` | 酒（葡萄酒） | `[[wˈaɪn]]` | wine wine / (passed) | `words/wine-noun-word.mp3`, `words/wine-noun-word-slow.mp3` |
| ☐ | **with** | `with-prep` | 同；帶住 | — | With it / With a | `words/with-prep-word.mp3`, `words/with-prep-word-slow.mp3` |
| ☐ | **worth** | `worth-adj` | 值得 | — | (passed) / WORSE | `words/worth-adj-word.mp3`, `words/worth-adj-word-slow.mp3` |
| ☐ | **wrap** | `wrap-verb` | 包裝 | `[[ɹˈæp]]` | Wrap / wrap | `words/wrap-verb-word.mp3`, `words/wrap-verb-word-slow.mp3` |
| ☐ | **your** | `your-det` | 你嘅 | — | Your th- / (passed) | `words/your-det-word.mp3`, `words/your-det-word-slow.mp3` |

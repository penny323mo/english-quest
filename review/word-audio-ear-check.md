# 每日抽卡 word clips: ear check

These **202 cards have no word clip in 每日抽卡**, so the daily draw leaves them out.
In 12 Piper takes each (normal and slow), Whisper base.en never transcribed the
word exactly, including on the clip made a little quieter, louder and noisier
(the check CI needs to pass the same way). Most are short single words. That does
**not** prove the audio is wrong: Whisper is weak on one isolated word. The last
take of each is kept on disk so a person can listen.

Play the clips from `assets/audio/` and tick the box only if the word is clear and
said right, normal and slow.

**To accept a ticked word:**
1. Delete its id from `content/word-audio-skip.json`.
2. Run `python3 scripts/render_audio.py`. The take you heard is kept (its file and
   text hash already match) and the word is added to `content/word-audio.json`.
3. Add both clips to `tests/fixtures/asr-known.json` with "ear check
   (review/word-audio-ear-check.md)", so the ASR check reports them instead of
   failing on Whisper's mishearing.
4. `npm test`.

A word that sounds wrong stays in the skip list. It can get a `[[phoneme]]`
override in `WORD_SAY` (`scripts/render_audio.py`) and another try with
`scripts/pick_word_takes.py --only <id>`.

| ✓ | Word | Card | 粵語 | Override | Whisper heard (normal / slow) | Clips to play |
|---|---|---|---|---|---|---|
| ☐ | **a** | `a-art` | 一個（子音前面，弱讀） | `[[ə]]` | but / I | `words/a-art-word.mp3`, `words/a-art-word-slow.mp3` |
| ☐ | **action item** | `action-item-noun` | 行動項 | — | Action I am / action I am | `words/action-item-noun-word.mp3`, `words/action-item-noun-word-slow.mp3` |
| ☐ | **aisle** | `aisle-noun` | 走廊位 | — | I'll / I'll... | `words/aisle-noun-word.mp3`, `words/aisle-noun-word-slow.mp3` |
| ☐ | **allergy** | `allergy-noun` | 過敏 | — | All in G / apology | `words/allergy-noun-word.mp3`, `words/allergy-noun-word-slow.mp3` |
| ☐ | **ambulance** | `ambulance-noun` | 救護車 | — | A meal in / from the lens | `words/ambulance-noun-word.mp3`, `words/ambulance-noun-word-slow.mp3` |
| ☐ | **annual leave** | `annual-leave-phrase` | 年假 | — | and you will leave. / and you will leave. | `words/annual-leave-phrase-word.mp3`, `words/annual-leave-phrase-word-slow.mp3` |
| ☐ | **bag** | `bag-noun` | 袋 | — | and / Thanks. | `words/bag-noun-word.mp3`, `words/bag-noun-word-slow.mp3` |
| ☐ | **balance** | `balance-noun` | 餘額 | — | Bullens / Bullens | `words/balance-noun-word.mp3`, `words/balance-noun-word-slow.mp3` |
| ☐ | **bangle** | `bangle-noun` | 手鐲 | — | then ball / then go | `words/bangle-noun-word.mp3`, `words/bangle-noun-word-slow.mp3` |
| ☐ | **bass** | `bass-noun-fish` | 鱸魚 | `[[bˈæs]]` | Nice / best | `words/bass-noun-fish-word.mp3`, `words/bass-noun-fish-word-slow.mp3` |
| ☐ | **bass** | `bass-noun-pitch` | 低音 | `[[bˈeɪs]]` | base / base | `words/bass-noun-pitch-word.mp3`, `words/bass-noun-pitch-word-slow.mp3` |
| ☐ | **battery** | `battery-noun` | 電池 | — | battery / That ray... | `words/battery-noun-word.mp3`, `words/battery-noun-word-slow.mp3` |
| ☐ | **bill later** | `bill-later-phrase` | 遲啲先埋單 | — | Bill lathe / Belay | `words/bill-later-phrase-word.mp3`, `words/bill-later-phrase-word-slow.mp3` |
| ☐ | **blanket** | `blanket-noun` | 被 | — | blanket / A link it. | `words/blanket-noun-word.mp3`, `words/blanket-noun-word-slow.mp3` |
| ☐ | **blocked** | `blocked-adj` | 凍結咗 | — | alert / The Larked. | `words/blocked-adj-word.mp3`, `words/blocked-adj-word-slow.mp3` |
| ☐ | **blocker** | `blocker-noun` | 阻礙 | — | Black / *buzzer* * | `words/blocker-noun-word.mp3`, `words/blocker-noun-word-slow.mp3` |
| ☐ | **blow dry** | `blow-dry-phrase` | 吹乾 | — | Let her dry. / Let her dry. | `words/blow-dry-phrase-word.mp3`, `words/blow-dry-phrase-word-slow.mp3` |
| ☐ | **bow** | `bow-noun` | 蝴蝶結；弓 | `[[bˈoʊ]]` | (static) / Oh | `words/bow-noun-word.mp3`, `words/bow-noun-word-slow.mp3` |
| ☐ | **bow** | `bow-verb` | 鞠躬 | `[[bˈaʊ]]` | Now / Bow | `words/bow-verb-word.mp3`, `words/bow-verb-word-slow.mp3` |
| ☐ | **box** | `box-noun` | 紙箱 | — | Parks / Parks | `words/box-noun-word.mp3`, `words/box-noun-word-slow.mp3` |
| ☐ | **buffet** | `buffet-noun` | 自助餐 | — | Perfect / Buff it. | `words/buffet-noun-word.mp3`, `words/buffet-noun-word-slow.mp3` |
| ☐ | **bulk** | `bulk-adj` | 批量 | — | Fuck. / Fuck. | `words/bulk-adj-word.mp3`, `words/bulk-adj-word-slow.mp3` |
| ☐ | **busy** | `busy-adj` | 忙 | — | (B) / Busy | `words/busy-adj-word.mp3`, `words/busy-adj-word-slow.mp3` |
| ☐ | **cancelled** | `cancelled-verb` | 取消咗 | — | "Cancel" / Penciled. | `words/cancelled-verb-word.mp3`, `words/cancelled-verb-word-slow.mp3` |
| ☐ | **candle** | `candle-noun` | 蠟燭 | — | Kindle / handle | `words/candle-noun-word.mp3`, `words/candle-noun-word-slow.mp3` |
| ☐ | **can't** | `cant-verb` | 唔可以 | — | Kent / hint | `words/cant-verb-word.mp3`, `words/cant-verb-word-slow.mp3` |
| ☐ | **cash** | `cash-noun` | 現金 | — | Pish / Pinch | `words/cash-noun-word.mp3`, `words/cash-noun-word-slow.mp3` |
| ☐ | **catch up later** | `catch-up-later-phrase` | 遲啲傾 | — | pitch up lay / Pitch off, Lay. | `words/catch-up-later-phrase-word.mp3`, `words/catch-up-later-phrase-word-slow.mp3` |
| ☐ | **character limit** | `character-limit-phrase` | 字數上限 | — | correct a limit / Parach to limit? | `words/character-limit-phrase-word.mp3`, `words/character-limit-phrase-word-slow.mp3` |
| ☐ | **cheaper** | `cheaper-adj` | 平啲 | — | Sheep. / She | `words/cheaper-adj-word.mp3`, `words/cheaper-adj-word-slow.mp3` |
| ☐ | **chew** | `chew-verb` | 嚼 | — | Shoo / shoe | `words/chew-verb-word.mp3`, `words/chew-verb-word-slow.mp3` |
| ☐ | **classic** | `classic-adj` | 經典 | — | classic / close it | `words/classic-adj-word.mp3`, `words/classic-adj-word-slow.mp3` |
| ☐ | **colour** | `color-noun` | 顏色 | — | Call / Color | `words/color-noun-word.mp3`, `words/color-noun-word-slow.mp3` |
| ☐ | **contactless** | `contactless-adj` | 拍卡 | — | had place / Pet place | `words/contactless-adj-word.mp3`, `words/contactless-adj-word-slow.mp3` |
| ☐ | **contract** | `contract-noun` | 合約 | — | "Contrict" / "Contrict" | `words/contract-noun-word.mp3`, `words/contract-noun-word-slow.mp3` |
| ☐ | **corner** | `corner-noun` | 街角 | — | Corinne / Corinne | `words/corner-noun-word.mp3`, `words/corner-noun-word-slow.mp3` |
| ☐ | **cost** | `cost-noun` | 費用 | `[[kˈɑst]]` | Cussed / Quest | `words/cost-noun-word.mp3`, `words/cost-noun-word-slow.mp3` |
| ☐ | **cough** | `cough-noun` | 咳嗽 | `[[ˈkɔf]]` | I got the / Back | `words/cough-noun-word.mp3`, `words/cough-noun-word-slow.mp3` |
| ☐ | **deposit** | `custom-deposit-noun` | 訂金 | — | Repose it. / and pause it. | `words/custom-deposit-noun-word.mp3`, `words/custom-deposit-noun-word-slow.mp3` |
| ☐ | **dairy** | `dairy-noun` | 奶製品 | — | Derry / Derry | `words/dairy-noun-word.mp3`, `words/dairy-noun-word-slow.mp3` |
| ☐ | **damage** | `damage-noun` | 損壞 | — | image / Do much. | `words/damage-noun-word.mp3`, `words/damage-noun-word-slow.mp3` |
| ☐ | **data** | `data-noun` | 數據 | — | DARE / Dayer | `words/data-noun-word.mp3`, `words/data-noun-word-slow.mp3` |
| ☐ | **deliver** | `deliver-verb` | 送到 | — | to live a / to live up | `words/deliver-verb-word.mp3`, `words/deliver-verb-word-slow.mp3` |
| ☐ | **deposit** | `deposit-noun` | 按金 | — | deposit / A positive | `words/deposit-noun-word.mp3`, `words/deposit-noun-word-slow.mp3` |
| ☐ | **deposit** | `deposit-verb` | 存入 | — | Depise it. / deposit | `words/deposit-verb-word.mp3`, `words/deposit-verb-word-slow.mp3` |
| ☐ | **describe** | `describe-verb` | 描述 | — | Subscribe / scribe | `words/describe-verb-word.mp3`, `words/describe-verb-word-slow.mp3` |
| ☐ | **doctor's note** | `doctors-note-phrase` | 醫生紙 | — | Tharkta's note. / Dark as note | `words/doctors-note-phrase-word.mp3`, `words/doctors-note-phrase-word-slow.mp3` |
| ☐ | **dollar** | `dollar-noun` | 蚊 | — | Carl / Tharrel | `words/dollar-noun-word.mp3`, `words/dollar-noun-word-slow.mp3` |
| ☐ | **duty** | `duty-noun` | 關稅 | — | Doobie / Dual E | `words/duty-noun-word.mp3`, `words/duty-noun-word-slow.mp3` |
| ☐ | **egg** | `egg-noun` | 蛋 | — | A / Thanks | `words/egg-noun-word.mp3`, `words/egg-noun-word-slow.mp3` |
| ☐ | **excess** | `excess-noun` | 自付額 | — | access / access | `words/excess-noun-word.mp3`, `words/excess-noun-word-slow.mp3` |
| ☐ | **exit** | `exit-noun` | 出口 | — | Exit / Ad percets | `words/exit-noun-word.mp3`, `words/exit-noun-word-slow.mp3` |
| ☐ | **fee** | `fee-noun` | 費用 | — | "Fee" / fee | `words/fee-noun-word.mp3`, `words/fee-noun-word-slow.mp3` |
| ☐ | **fever** | `fever-noun` | 發燒 | — | Steve / Steve | `words/fever-noun-word.mp3`, `words/fever-noun-word-slow.mp3` |
| ☐ | **few** | `few-det` | 幾件 | — | Hugh! / Hugh | `words/few-det-word.mp3`, `words/few-det-word-slow.mp3` |
| ☐ | **finger** | `finger-noun` | 手指 | — | Sing! / Sing the... | `words/finger-noun-word.mp3`, `words/finger-noun-word-slow.mp3` |
| ☐ | **fitting room** | `fitting-room-phrase` | 試身室 | — | Fading room. / Faking room. | `words/fitting-room-phrase-word.mp3`, `words/fitting-room-phrase-word-slow.mp3` |
| ☐ | **flavour** | `flavour-noun` | 口味 | — | play it / Flav | `words/flavour-noun-word.mp3`, `words/flavour-noun-word-slow.mp3` |
| ☐ | **font** | `font-noun` | 字體 | — | Point / Point | `words/font-noun-word.mp3`, `words/font-noun-word-slow.mp3` |
| ☐ | **fragile** | `fragile-adj` | 易碎 | — | "Fregal" / for actual | `words/fragile-adj-word.mp3`, `words/fragile-adj-word-slow.mp3` |
| ☐ | **fringe** | `fringe-noun` | 瀏海 | — | French / French | `words/fringe-noun-word.mp3`, `words/fringe-noun-word-slow.mp3` |
| ☐ | **gate** | `gate-noun` | 閘口 | — | 8 / 8 | `words/gate-noun-word.mp3`, `words/gate-noun-word-slow.mp3` |
| ☐ | **gemstone** | `gemstone-noun` | 寶石 | — | Gemstoom / Shenstuam | `words/gemstone-noun-word.mp3`, `words/gemstone-noun-word-slow.mp3` |
| ☐ | **gluten** | `gluten-noun` | 麩質 | — | Gluing. / c'mon | `words/gluten-noun-word.mp3`, `words/gluten-noun-word-slow.mp3` |
| ☐ | **go** | `go-verb` | 去 | — | Can we? / (buzzer) | `words/go-verb-word.mp3`, `words/go-verb-word-slow.mp3` |
| ☐ | **gold** | `gold-noun` | 金 | — | build / Filled | `words/gold-noun-word.mp3`, `words/gold-noun-word-slow.mp3` |
| ☐ | **good** | `good-adj` | 好 | — | bed / that | `words/good-adj-word.mp3`, `words/good-adj-word-slow.mp3` |
| ☐ | **goods** | `goods-noun` | 貨物 | — | That's... / Thanks! | `words/goods-noun-word.mp3`, `words/goods-noun-word-slow.mp3` |
| ☐ | **gram** | `gram-noun` | 克 | — | Prem / "Tren" | `words/gram-noun-word.mp3`, `words/gram-noun-word-slow.mp3` |
| ☐ | **half a size** | `half-size-phrase` | 半碼 | — | Her first size / have a size | `words/half-size-phrase-word.mp3`, `words/half-size-phrase-word-slow.mp3` |
| ☐ | **hallway** | `hallway-noun` | 走廊 | — | All way. / All way. | `words/hallway-noun-word.mp3`, `words/hallway-noun-word-slow.mp3` |
| ☐ | **handled** | `handled-verb` | 處理咗 | — | Condolt / Pandalt | `words/handled-verb-word.mp3`, `words/handled-verb-word-slow.mp3` |
| ☐ | **handover** | `handover-noun` | 交接 | — | and they will / Hello | `words/handover-noun-word.mp3`, `words/handover-noun-word-slow.mp3` |
| ☐ | **have** | `have-verb` | 有 | — | and / PES! | `words/have-verb-word.mp3`, `words/have-verb-word-slow.mp3` |
| ☐ | **here** | `here-adv` | 呢度 | — | Hair? / hair | `words/here-adv-word.mp3`, `words/here-adv-word-slow.mp3` |
| ☐ | **high chair** | `high-chair-phrase` | 兒童椅（BB櫈） | — | Hi Chair / Hi Chair | `words/high-chair-phrase-word.mp3`, `words/high-chair-phrase-word-slow.mp3` |
| ☐ | **Hong Kong** | `hong-kong-noun` | 香港 | — | Han Kang / Hine-Khan | `words/hong-kong-noun-word.mp3`, `words/hong-kong-noun-word-slow.mp3` |
| ☐ | **hour** | `hour-noun` | 個鐘 | — | L / L | `words/hour-noun-word.mp3`, `words/hour-noun-word-slow.mp3` |
| ☐ | **how** | `how-adv` | 點樣 | — | Help. / How? | `words/how-adv-word.mp3`, `words/how-adv-word-slow.mp3` |
| ☐ | **I** | `i-pron` | 我 | — | I / I | `words/i-pron-word.mp3`, `words/i-pron-word-slow.mp3` |
| ☐ | **if** | `if-conj` | 如果 | — | I / Bye! | `words/if-conj-word.mp3`, `words/if-conj-word-slow.mp3` |
| ☐ | **jewellery** | `jewellery-noun` | 珠寶（英式串法） | `[[dʒˈulɹi]]` | Joey / Showery | `words/jewellery-noun-word.mp3`, `words/jewellery-noun-word-slow.mp3` |
| ☐ | **jewelry** | `jewelry-noun` | 珠寶（美式串法） | `[[dʒˈulɹi]]` | Jory / She'll read | `words/jewelry-noun-word.mp3`, `words/jewelry-noun-word-slow.mp3` |
| ☐ | **job** | `job-noun` | 工作 | — | Jar / D'Arb. | `words/job-noun-word.mp3`, `words/job-noun-word-slow.mp3` |
| ☐ | **karat** | `karat-noun` | 開 | `[[kˈɛɹət]]` | "Hear it." / Carrot | `words/karat-noun-word.mp3`, `words/karat-noun-word-slow.mp3` |
| ☐ | **keep** | `keep-verb` | 保持 | — | Heek. / heat | `words/keep-verb-word.mp3`, `words/keep-verb-word-slow.mp3` |
| ☐ | **key card** | `key-card-phrase` | 鑰匙卡 | `[[ˈki ˈkɑɹd]]` | I keep hard. / A key card. | `words/key-card-phrase-word.mp3`, `words/key-card-phrase-word-slow.mp3` |
| ☐ | **laptop** | `laptop-noun` | 手提電腦 | `[[lˈæpˌtɑp]]` | Let's protect the / Look past your face | `words/laptop-noun-word.mp3`, `words/laptop-noun-word-slow.mp3` |
| ☐ | **late checkout** | `late-checkout-phrase` | 延遲退房 | `[[ˈleɪt ˈtʃɛkˌaʊt]]` | Delete a checkout. / We'll eat at checkout. | `words/late-checkout-phrase-word.mp3`, `words/late-checkout-phrase-word-slow.mp3` |
| ☐ | **layover** | `layover-noun` | 轉機停留 | — | Later. / Love? | `words/layover-noun-word.mp3`, `words/layover-noun-word-slow.mp3` |
| ☐ | **leather strap** | `leather-strap-phrase` | 皮錶帶 | — | Let us strip. / Let us strip. | `words/leather-strap-phrase-word.mp3`, `words/leather-strap-phrase-word-slow.mp3` |
| ☐ | **led** | `led-verb` | 帶領（過去） | — | Let / Let | `words/led-verb-word.mp3`, `words/led-verb-word-slow.mp3` |
| ☐ | **left** | `left-adv` | 左邊 | — | Left. / Last | `words/left-adv-word.mp3`, `words/left-adv-word-slow.mp3` |
| ☐ | **less sugar** | `less-sugar-phrase` | 少糖 | — | less showbo / less showbook | `words/less-sugar-phrase-word.mp3`, `words/less-sugar-phrase-word-slow.mp3` |
| ☐ | **lift** | `lift-noun` | 升降機 | — | Left / Left | `words/lift-noun-word.mp3`, `words/lift-noun-word-slow.mp3` |
| ☐ | **line** | `line-noun` | 線路 | — | Bye! / Bye! | `words/line-noun-word.mp3`, `words/line-noun-word-slow.mp3` |
| ☐ | **live** | `live-verb` | 住 | `[[lˈɪv]]` | Let's not / plans | `words/live-verb-word.mp3`, `words/live-verb-word-slow.mp3` |
| ☐ | **logo** | `logo-noun` | 標誌 | — | I hope / Lego | `words/logo-noun-word.mp3`, `words/logo-noun-word-slow.mp3` |
| ☐ | **long** | `long-adj` | 長 | — | Bye / Bye! | `words/long-adj-word.mp3`, `words/long-adj-word-slow.mp3` |
| ☐ | **long wait** | `long-wait-phrase` | 等好耐 | — | long wait / Line Wait | `words/long-wait-phrase-word.mp3`, `words/long-wait-phrase-word-slow.mp3` |
| ☐ | **look** | `look-verb` | 睇 | — | Like / LUT! | `words/look-verb-word.mp3`, `words/look-verb-word-slow.mp3` |
| ☐ | **lost** | `lost-adj` | 唔見咗 | — | Lust / Lust | `words/lost-adj-word.mp3`, `words/lost-adj-word-slow.mp3` |
| ☐ | **luggage** | `luggage-noun` | 行李 | — | Bloodage / Loveage | `words/luggage-noun-word.mp3`, `words/luggage-noun-word-slow.mp3` |
| ☐ | **lustre** | `lustre-noun` | 光澤 | — | Lust if... / Lust her. | `words/lustre-noun-word.mp3`, `words/lustre-noun-word-slow.mp3` |
| ☐ | **measure** | `measure-verb` | 量度 | — | Besh / Besh | `words/measure-verb-word.mp3`, `words/measure-verb-word-slow.mp3` |
| ☐ | **meter** | `meter-noun` | 咪錶 | — | Beat it. / Meet it! | `words/meter-noun-word.mp3`, `words/meter-noun-word-slow.mp3` |
| ☐ | **milestone** | `milestone-noun` | 里程碑 | — | My stone. / Maya Stone | `words/milestone-noun-word.mp3`, `words/milestone-noun-word-slow.mp3` |
| ☐ | **millilitre** | `millilitre-noun` | 毫升 | — | Malalia / The LaLia | `words/millilitre-noun-word.mp3`, `words/millilitre-noun-word-slow.mp3` |
| ☐ | **missing** | `missing-adj` | 搵唔到 | — | We say / This day. | `words/missing-adj-word.mp3`, `words/missing-adj-word-slow.mp3` |
| ☐ | **my** | `my-det` | 我嘅 | — | Bye! / Bye! | `words/my-det-word.mp3`, `words/my-det-word-slow.mp3` |
| ☐ | **napkin** | `napkin-noun` | 餐巾 | — | Next can / Neck can | `words/napkin-noun-word.mp3`, `words/napkin-noun-word-slow.mp3` |
| ☐ | **natural** | `natural-adj` | 天然 | `[[nˈætʃɚəl]]` | Next show / Next shot | `words/natural-adj-word.mp3`, `words/natural-adj-word-slow.mp3` |
| ☐ | **need** | `need-verb` | 需要 | — | Need / "B" | `words/need-verb-word.mp3`, `words/need-verb-word-slow.mp3` |
| ☐ | **never** | `never-adv` | 從不 | — | death / that | `words/never-adv-word.mp3`, `words/never-adv-word-slow.mp3` |
| ☐ | **nine** | `nine-num` | 九 | — | Bye / Bye! | `words/nine-num-word.mp3`, `words/nine-num-word-slow.mp3` |
| ☐ | **noisy** | `noisy-adj` | 嘈 | — | No, is it? / No, is it? | `words/noisy-adj-word.mp3`, `words/noisy-adj-word-slow.mp3` |
| ☐ | **not bad** | `not-bad-phrase` | 都唔差 | — | Backbud. / Nark Thud! | `words/not-bad-phrase-word.mp3`, `words/not-bad-phrase-word-slow.mp3` |
| ☐ | **notice** | `notice-noun` | 通知期 | — | Noice / Now is... | `words/notice-noun-word.mp3`, `words/notice-noun-word-slow.mp3` |
| ☐ | **notify** | `notify-verb` | 通知 | — | Now if I... / Now a fight. | `words/notify-verb-word.mp3`, `words/notify-verb-word-slow.mp3` |
| ☐ | **o'clock** | `oclock-adv` | 點 | — | A clock. / A clock. | `words/oclock-adv-word.mp3`, `words/oclock-adv-word-slow.mp3` |
| ☐ | **Octopus card** | `octopus-card-phrase` | 八達通 | — | "Artopus Card" / Arctupus card | `words/octopus-card-phrase-word.mp3`, `words/octopus-card-phrase-word-slow.mp3` |
| ☐ | **of** | `of-prep` | 嘅；屬於 | `[[ˈʌv]]` | I've been / I'd | `words/of-prep-word.mp3`, `words/of-prep-word-slow.mp3` |
| ☐ | **off** | `off-adv` | 減 | — | Oh / both | `words/off-adv-word.mp3`, `words/off-adv-word-slow.mp3` |
| ☐ | **offer** | `offer-noun` | 優惠 | `[[ˈɔfɚ]]` | Off the / Off | `words/offer-noun-word.mp3`, `words/offer-noun-word-slow.mp3` |
| ☐ | **officer** | `officer-noun` | 關員 | — | AFS / AFS | `words/officer-noun-word.mp3`, `words/officer-noun-word-slow.mp3` |
| ☐ | **on** | `on-prep` | 喺…上面；準時 | — | Bye / Bye. | `words/on-prep-word.mp3`, `words/on-prep-word-slow.mp3` |
| ☐ | **optional** | `optional-adj` | 可以唔要 | — | "optional" / "Arctional" | `words/optional-adj-word.mp3`, `words/optional-adj-word-slow.mp3` |
| ☐ | **order** | `order-noun` | 訂單 | — | 4 / forward | `words/order-noun-word.mp3`, `words/order-noun-word-slow.mp3` |
| ☐ | **order** | `order-verb` | 叫（落單） | — | Forward. / Board | `words/order-verb-word.mp3`, `words/order-verb-word-slow.mp3` |
| ☐ | **ordered** | `ordered-verb` | 點咗 | — | for / for it | `words/ordered-verb-word.mp3`, `words/ordered-verb-word-slow.mp3` |
| ☐ | **our** | `our-det` | 我哋嘅 | — | L / L | `words/our-det-word.mp3`, `words/our-det-word-slow.mp3` |
| ☐ | **overtime** | `overtime-noun` | 加班 | — | all the time. / all the time. | `words/overtime-noun-word.mp3`, `words/overtime-noun-word-slow.mp3` |
| ☐ | **owner** | `owner-noun` | 負責人 | — | [inaudible / out | `words/owner-noun-word.mp3`, `words/owner-noun-word-slow.mp3` |
| ☐ | **pair** | `pair-noun` | 一對 | — | parents / Power | `words/pair-noun-word.mp3`, `words/pair-noun-word-slow.mp3` |
| ☐ | **pass** | `pass-noun` | 證；通行證 | — | PESS / Piss | `words/pass-noun-word.mp3`, `words/pass-noun-word-slow.mp3` |
| ☐ | **password** | `password-noun` | 密碼 | `[[pˈæswˌɜd]]` | + word / "Pussword" | `words/password-noun-word.mp3`, `words/password-noun-word-slow.mp3` |
| ☐ | **pearl** | `pearl-noun` | 珍珠 | — | Horace / Hurry! | `words/pearl-noun-word.mp3`, `words/pearl-noun-word-slow.mp3` |
| ☐ | **photo** | `photo-noun` | 相片 | — | So do / too old though | `words/photo-noun-word.mp3`, `words/photo-noun-word-slow.mp3` |
| ☐ | **polish** | `polish-noun` | 擦亮劑 | — | Paralish / [buzzer] | `words/polish-noun-word.mp3`, `words/polish-noun-word-slow.mp3` |
| ☐ | **popular** | `popular-adj` | 多人揀 | — | Carpill? / Park Hill. | `words/popular-adj-word.mp3`, `words/popular-adj-word-slow.mp3` |
| ☐ | **power bank** | `power-bank-noun` | 行動電源 | — | Poundbank / pal bank | `words/power-bank-noun-word.mp3`, `words/power-bank-noun-word-slow.mp3` |
| ☐ | **propose** | `propose-verb` | 提議 | — | Proposed / Prepare | `words/propose-verb-word.mp3`, `words/propose-verb-word-slow.mp3` |
| ☐ | **public holiday** | `public-holiday-phrase` | 公眾假期 | — | public harlot day / public harla day | `words/public-holiday-phrase-word.mp3`, `words/public-holiday-phrase-word-slow.mp3` |
| ☐ | **pure** | `pure-adj` | 純 | — | here / Here | `words/pure-adj-word.mp3`, `words/pure-adj-word-slow.mp3` |
| ☐ | **purity** | `purity-noun` | 純度 | — | kill ready / Hear me? | `words/purity-noun-word.mp3`, `words/purity-noun-word-slow.mp3` |
| ☐ | **quantity** | `quantity-noun` | 數量 | — | Coently. / "Quentery" | `words/quantity-noun-word.mp3`, `words/quantity-noun-word-slow.mp3` |
| ☐ | **quarter** | `quarter-noun` | 季度 | — | Cora / Quorum | `words/quarter-noun-word.mp3`, `words/quarter-noun-word-slow.mp3` |
| ☐ | **rebook** | `rebook-verb` | 改期／改訂 | — | Rebel / Revolt | `words/rebook-verb-word.mp3`, `words/rebook-verb-word-slow.mp3` |
| ☐ | **refund** | `refund-noun` | 退款 | `[[ˈɹifənd]]` | brief and / Brave and | `words/refund-noun-word.mp3`, `words/refund-noun-word-slow.mp3` |
| ☐ | **rose gold** | `rose-gold-phrase` | 玫瑰金 | `[[ˈɹoʊz ˈɡoʊld]]` | Rose of World / arose a whole | `words/rose-gold-phrase-word.mp3`, `words/rose-gold-phrase-word-slow.mp3` |
| ☐ | **same here** | `same-here-phrase` | 我都係 | — | Same care. / Same hair | `words/same-here-phrase-word.mp3`, `words/same-here-phrase-word-slow.mp3` |
| ☐ | **sank** | `sank-verb` | 沉咗（對比 thank） | — | Say / Sink | `words/sank-verb-word.mp3`, `words/sank-verb-word-slow.mp3` |
| ☐ | **Saturday** | `saturday-noun` | 星期六 | — | Similarly, / "Sill the day." | `words/saturday-noun-word.mp3`, `words/saturday-noun-word-slow.mp3` |
| ☐ | **sauce** | `sauce-noun` | 醬 | — | SORES / So ours. | `words/sauce-noun-word.mp3`, `words/sauce-noun-word-slow.mp3` |
| ☐ | **see** | `see-verb` | 睇 | — | C / C | `words/see-verb-word.mp3`, `words/see-verb-word-slow.mp3` |
| ☐ | **setting** | `setting-noun` | 鑲托 | — | same / Saying | `words/setting-noun-word.mp3`, `words/setting-noun-word-slow.mp3` |
| ☐ | **ship** | `ship-noun` | 船 | — | Check / Check | `words/ship-noun-word.mp3`, `words/ship-noun-word-slow.mp3` |
| ☐ | **sick** | `sick-adj` | 病 | — | Say / SICK | `words/sick-adj-word.mp3`, `words/sick-adj-word-slow.mp3` |
| ☐ | **signature** | `signature-noun` | 簽名 | — | Signage / Signage | `words/signature-noun-word.mp3`, `words/signature-noun-word-slow.mp3` |
| ☐ | **silver** | `silver-noun` | 銀 | — | Solo / Silver | `words/silver-noun-word.mp3`, `words/silver-noun-word-slow.mp3` |
| ☐ | **SIM** | `sim-noun` | 電話卡 | — | Sim / Sim | `words/sim-noun-word.mp3`, `words/sim-noun-word-slow.mp3` |
| ☐ | **sir** | `sir-noun` | 先生（客氣） | `[[sˈɝ]]` | sub / So | `words/sir-noun-word.mp3`, `words/sir-noun-word-slow.mp3` |
| ☐ | **stamp** | `stamp-verb` | 蓋章 | `[[ˈstæmp]]` | a simple / a stem and | `words/stamp-verb-word.mp3`, `words/stamp-verb-word-slow.mp3` |
| ☐ | **suite** | `suite-noun` | 套房 | — | Sweet / Sweet | `words/suite-noun-word.mp3`, `words/suite-noun-word-slow.mp3` |
| ☐ | **a table for two** | `table-for-two-phrase` | 兩位 | `[[ə ˈteɪbəl fɚ ˈtu]]` | Art table for the two / Our table foot into | `words/table-for-two-phrase-word.mp3`, `words/table-for-two-phrase-word-slow.mp3` |
| ☐ | **tag number** | `tag-number-phrase` | 行李牌號碼 | — | Tip number / Tip number | `words/tag-number-phrase-word.mp3`, `words/tag-number-phrase-word-slow.mp3` |
| ☐ | **tall cup** | `tall-cup-phrase` | 中杯 | — | tall cup / Tall cut. | `words/tall-cup-phrase-word.mp3`, `words/tall-cup-phrase-word-slow.mp3` |
| ☐ | **tank** | `tank-noun` | 箱；缸 | — | Take / Take | `words/tank-noun-word.mp3`, `words/tank-noun-word-slow.mp3` |
| ☐ | **tap** | `tap-noun` | 水龍頭 | — | Tap / Check | `words/tap-noun-word.mp3`, `words/tap-noun-word-slow.mp3` |
| ☐ | **tax-free** | `tax-free-phrase` | 免稅 | — | Text free / Text free | `words/tax-free-phrase-word.mp3`, `words/tax-free-phrase-word-slow.mp3` |
| ☐ | **tax** | `tax-noun` | 稅 | — | "Ticks" / tics | `words/tax-noun-word.mp3`, `words/tax-noun-word-slow.mp3` |
| ☐ | **tax refund** | `tax-refund-phrase` | 退稅 | — | TICKS REFOND / Ticks refund. | `words/tax-refund-phrase-word.mp3`, `words/tax-refund-phrase-word-slow.mp3` |
| ☐ | **taxi** | `taxi-noun` | 的士 | — | Tixie / Tixie | `words/taxi-noun-word.mp3`, `words/taxi-noun-word-slow.mp3` |
| ☐ | **tea** | `tea-noun` | 茶 | — | T / T | `words/tea-noun-word.mp3`, `words/tea-noun-word-slow.mp3` |
| ☐ | **thank** | `thank-verb` | 多謝 | — | Check / Check | `words/thank-verb-word.mp3`, `words/thank-verb-word-slow.mp3` |
| ☐ | **the** | `the-art` | 英文冠詞，子音前面弱讀，中文往往唔使譯 | `[[ðə]]` | *static* / that | `words/the-art-word.mp3`, `words/the-art-word-slow.mp3` |
| ☐ | **then** | `then-adv` | 然後 | — | them / There | `words/then-adv-word.mp3`, `words/then-adv-word-slow.mp3` |
| ☐ | **too** | `too-adv` | 都 | — | two / Two | `words/too-adv-word.mp3`, `words/too-adv-word-slow.mp3` |
| ☐ | **toothache** | `toothache-noun` | 牙痛 | — | Too fake. / Too Fate | `words/toothache-noun-word.mp3`, `words/toothache-noun-word-slow.mp3` |
| ☐ | **top-up** | `top-up-noun` | 增值 | — | chart pop / Tarpop | `words/top-up-noun-word.mp3`, `words/top-up-noun-word-slow.mp3` |
| ☐ | **try on** | `try-on-phrase` | 試戴 | — | Try 'em on. / Try 'em on. | `words/try-on-phrase-word.mp3`, `words/try-on-phrase-word-slow.mp3` |
| ☐ | **undercooked** | `undercooked-adj` | 未煮熟 | — | Unacopt / Unacopt | `words/undercooked-adj-word.mp3`, `words/undercooked-adj-word-slow.mp3` |
| ☐ | **vest** | `vest-noun` | 背心 | `[[vˈɛst]]` | Best / Best | `words/vest-noun-word.mp3`, `words/vest-noun-word-slow.mp3` |
| ☐ | **vine** | `vine-noun` | 藤 | `[[vˈaɪn]]` | Fine. / HINE | `words/vine-noun-word.mp3`, `words/vine-noun-word-slow.mp3` |
| ☐ | **want** | `want-verb` | 想要 | `[[wˈɑnt]]` | What the... / white | `words/want-verb-word.mp3`, `words/want-verb-word-slow.mp3` |
| ☐ | **watch** | `watch-noun` | 手錶 | — | Watch / part | `words/watch-noun-word.mp3`, `words/watch-noun-word-slow.mp3` |
| ☐ | **water** | `water-noun` | 水 | — | Wow / *static* | `words/water-noun-word.mp3`, `words/water-noun-word-slow.mp3` |
| ☐ | **water resistant** | `water-resistant-adj` | 防水 | — | water resistant / War resistant | `words/water-resistant-adj-word.mp3`, `words/water-resistant-adj-word-slow.mp3` |
| ☐ | **way** | `way-noun` | 方向；路 | — | Wait. / Wait | `words/way-noun-word.mp3`, `words/way-noun-word-slow.mp3` |
| ☐ | **we** | `we-pron` | 我哋 | — | wait / Wait | `words/we-pron-word.mp3`, `words/we-pron-word-slow.mp3` |
| ☐ | **weight** | `weight-noun` | 重量 | `[[ˈweɪt]]` | Oh wait. / Wait | `words/weight-noun-word.mp3`, `words/weight-noun-word-slow.mp3` |
| ☐ | **window** | `window-noun` | 窗 | — | Wing toe. / Wing's old. | `words/window-noun-word.mp3`, `words/window-noun-word-slow.mp3` |
| ☐ | **window seat** | `window-seat-phrase` | 靠窗位 | — | Windows seat / Wind of seat | `words/window-seat-phrase-word.mp3`, `words/window-seat-phrase-word-slow.mp3` |
| ☐ | **wine** | `wine-noun` | 酒（葡萄酒） | `[[wˈaɪn]]` | Why? / Why? | `words/wine-noun-word.mp3`, `words/wine-noun-word-slow.mp3` |
| ☐ | **wipe** | `wipe-verb` | 抹 | — | Like / White | `words/wipe-verb-word.mp3`, `words/wipe-verb-word-slow.mp3` |
| ☐ | **with** | `with-prep-voiceless` | 同（清音變體 /wɪθ/） | `[[wˈɪθ]]` | What the / [static] | `words/with-prep-voiceless-word.mp3`, `words/with-prep-voiceless-word-slow.mp3` |
| ☐ | **worth** | `worth-adj` | 值得 | — | Poor ex / Boris. | `words/worth-adj-word.mp3`, `words/worth-adj-word-slow.mp3` |
| ☐ | **would** | `would-verb` | 想唔想（客氣） | — | What? / What? | `words/would-verb-word.mp3`, `words/would-verb-word-slow.mp3` |
| ☐ | **wrap up** | `wrap-up-verb` | 完結個會 | — | rip up / rip up | `words/wrap-up-verb-word.mp3`, `words/wrap-up-verb-word-slow.mp3` |
| ☐ | **wrap** | `wrap-verb` | 包裝 | `[[ɹˈæp]]` | Rest. / wrapped in | `words/wrap-verb-word.mp3`, `words/wrap-verb-word-slow.mp3` |
| ☐ | **yellow gold** | `yellow-gold-phrase` | 黃K金 | — | Y'all have good old. / Now, good luck. | `words/yellow-gold-phrase-word.mp3`, `words/yellow-gold-phrase-word-slow.mp3` |
| ☐ | **your** | `your-det` | 你嘅 | — | Our / Ever | `words/your-det-word.mp3`, `words/your-det-word-slow.mp3` |

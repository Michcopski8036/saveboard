# SaveBoard — listicle outreach email drafts

Drafted **2026-08-11**. Source research: `marketing/listicle-targets-2026-08-11.md`.
Positioning and canonical copy: `marketing/offsite-listings.md`. Pricing and limits: `public/llms.txt`.

**Every article below was opened and read again while drafting** — the research file's summary was
not treated as sufficient. Three of its details turned out to need correcting; those corrections
are noted in the relevant sections and collected at the bottom. Quality bar is
`~/PeriodVol/marketing/listicle-outreach-drafts.md` (Batch 2–3): quote a detail only that piece
has, concede the weakness before anyone else raises it, narrow the differentiator to one thing,
never claim "no other app does X" without hedging to what was actually checked.

**Six drafts: 4 email, 2 form.** One target (Tool Finder) is deliberately undrafted — see the note
before the checklist.

---

## ⚠️ Read this before sending: the weakness list changed

The brief for this batch said to concede "no web app". **That is not accurate and is not written
into these emails.** `saveboard.app` runs the full React app in a browser — `App.tsx` renders
`LandingPage` with `onGetStarted={() => setShowAuth(true)}` for non-native platforms, i.e. the web
build signs you in and works. What is genuinely true, and what every draft below concedes instead:

- **No browser extension** (there is no extension source anywhere in the repo).
- **The web build is the same phone-shaped app**, not a desktop-first one — and the share-sheet
  saving that is the entire pitch exists only in the iOS and Android apps.
- **No importer.** No CSV / Netscape-HTML / Pocket-export path exists in the codebase, so there is
  no migration route for someone arriving with a Pocket export. This matters most for BuyerSprint,
  whose whole test method starts with an import.
- **Raindrop is ahead on feature breadth** — nested collections, extensions, integrations, years of
  accumulated features. Never claim otherwise; the argument is a different axis, not a better one.
- **New and small** — one founder in Perth.

Claiming a missing web app would have been caught by any journalist who clicked the link, and it
would have made everything else in the email suspect. Do not put it back.

## Fixed facts used in every draft

- Free: **30 saves, 5 boards**, no card. **Pro A$5.49/month or A$34.99/year. Team A$9.49/month.**
- Currency is always written as **A$ with "Australian dollars" spelled out at least once**, and is
  **never put side by side with another currency** — the US-media pieces quote US$ prices and an
  exchange-rate comparison is not a fact we can assert.
- Links, plain text, no tracking parameters, all verified 200 on 2026-08-11:
  `saveboard.app` · `saveboard.app/pocket-alternative` · `saveboard.app/raindrop-alternative` ·
  `saveboard.app/saveboard-vs-raindrop`
- Sign-off is always:
  Mihee Youn / Founder, SaveBoard — saveboard.app
- Send from **creatorsloftperth@gmail.com** (same rule as the PeriodVol batches).

---

## 1. Cloudwards — ⭐ priority send, and the only one that is not a pitch

**To:** `hello@cloudwards.net`
Source: `cloudwards.net/contact/`, published as a mailto. `info@cloudwards.net` is the second
address on the same page and is the fallback after two weeks.
⛔ **Not `office@`** (the page labels it new business) and **not `application@`** (that is
"Write for us!"). Both are the wrong door for a correction.
**Named author (no address):** **Beatrice Manuel**, credited as Writer on the piece. No personal
address is published anywhere on the site — do not guess one; address the desk.

**The piece, read again 2026-08-11:** "Best Read-It-Later Apps in 2026: Top Ways to Save Web Pages
& Content", `cloudwards.net/best-read-it-later-apps/`, stamped **"11 May'26"** (JSON-LD
`dateModified` 2026-05-11, originally published 2022-08-14). Five entries: **1. Pocket ·
2. Instapaper · 3. EmailThis · 4. Safari Reading List · 5. Raindrop.**

Verbatim, all confirmed in the live HTML today:

- Section heading: **"1. Pocket: The Best Read-It-Later App"**
- **"Pricing: Free plan; Premium plan costs $5 per month"** and **"Provider website:
  www.getpocket.com"**
- **"Serious researchers can opt for Pocket Premium at 25% off the monthly price or $45 per year.
  This unlocks permanent backups, advanced search options and ad removal."**
- Final Thoughts: **"Pocket is easily our favorite, due to its user-friendly interface and great
  features."**
- Criteria line: **"Read-it-later apps ideally offer mobile, tablet and desktop versions."**
- A second, smaller error worth flagging gently: the first sentence *under the Pocket heading*
  reads **"If you're a fan of podcasts and having your content read to you, Instapaper might be
  your cup of tea."** — it names Instapaper inside Pocket's section.

**Subject:** Correction for your read-it-later roundup — the #1 pick shut down last year

> Hi Cloudwards team,
>
> This is a correction rather than a pitch, so I'll lead with the correction and keep the rest
> short.
>
> Your "Best Read-It-Later Apps in 2026" is stamped 11 May '26, and its number one is still
> "1. Pocket: The Best Read-It-Later App". Mozilla shut Pocket down in 2025 — the app stopped
> working on 8 July 2025 and the export window closed that October. The page still lists
> "Free plan; Premium plan costs $5 per month", still points to www.getpocket.com as the provider
> website, still offers readers "Pocket Premium at 25% off the monthly price or $45 per year", and
> the Final Thoughts still say "Pocket is easily our favorite". None of that can be acted on now,
> and a reader following the link lands on a service that no longer exists.
>
> Two smaller things I noticed while checking, in case they're useful to whoever picks this up:
> the first sentence under the Pocket heading recommends Instapaper rather than Pocket ("If you're
> a fan of podcasts and having your content read to you, Instapaper might be your cup of tea"),
> and the rest of the list — Instapaper, EmailThis, Safari Reading List, Raindrop — reads as
> unaffected, so this may only be a matter of the top slot moving up.
>
> Now the disclosure, because you should have it before you decide anything: I build a bookmark
> app, so I'm not a neutral party. I'm not asking to replace Pocket at number one, and I don't
> think we'd qualify — your own criteria say read-it-later apps "ideally offer mobile, tablet and
> desktop versions", and SaveBoard is a phone app first; the web build is the same phone-shaped
> app rather than a desktop-first one, there's no browser extension, and it doesn't do reader view,
> offline article text or text-to-speech, which is most of what your list ranks on.
>
> What it does replace is the *saving* half of what people used Pocket for, on a phone: you hit
> share inside whatever app you're already in — Instagram, YouTube, WhatsApp, your browser — and
> the link lands as a visual card on a board, in one tap. Free is 30 saves and five boards with no
> card; Pro is A$5.49 a month or A$34.99 a year in Australian dollars, Team A$9.49 a month.
> There's a write-up at saveboard.app/pocket-alternative and the app itself is at saveboard.app.
> If it's a fit for a "Pocket refugees" mention some day, great; if not, the number one entry is
> worth fixing on its own and that's the reason I wrote.
>
> Happy to send screenshots or answer anything. Thanks for keeping the piece maintained — the
> May update is why I bothered writing rather than assuming it was abandoned.
>
> Best,
> Mihee Youn
> Founder, SaveBoard — saveboard.app

**왜 이 각도인가 (KO):** 이 배치에서 유일하게 **부탁이 아닌 제보**다. 3개월 전에 갱신했다는 글이
2025년에 종료된 서비스를 1위로 유지 중이고, **가격($5/월, $45/년)과 공급자 링크(getpocket.com)까지
살아 있는 것처럼 적혀 있다** — 편집자 입장에서 이건 신고받으면 반드시 고쳐야 하는 종류의 오류라,
회신 동기가 우리 앱이 아니라 그들 자신에게 있다. 그래서 **정정이 본론, 우리는 부록**이고 순서를
뒤집으면 각도 자체가 죽는다. 우리 문단은 **"1위 자리를 달라"가 아니라 "우리는 그 기준에 애초에
안 맞는다"로 시작**한다 — 그들 자신의 선정 기준("모바일·태블릿·데스크톱 버전을 갖추는 것이
이상적")을 인용해 우리가 탈락 사유를 먼저 말하는 구조다. 그 뒤에 남는 주장은 딱 하나, **"Pocket이
하던 *저장*을 폰에서 대신한다"** 뿐이다. read-it-later(읽기 도구) 프레임에 억지로 끼우지 말 것 —
리더뷰·오프라인 본문·TTS 없음을 우리가 먼저 적어둔 이유다. Pocket 종료는 사실 진술로만 쓰고,
"거봐라" 식 논조는 한 글자도 넣지 않았다. Instapaper 오기 지적도 **"고칠 사람에게 유용할까 싶어"**로
감쌌다 — 트집이 아니라 도움으로 읽혀야 한다.

---

## 2. Zapier (Justin Pot) — 📝 **이메일 아님: 저자 개인 문의 폼**

**To:** ⛔ **No email address exists for this one.** Zapier's blog publishes no editorial address,
`zapier.com/contact` has none, and the guest-post guidelines route
(`blog-guest-posting.zapier.app`) excludes this category outright, verbatim: **"We don't accept
guest posts for app comparisons or best apps lists, since those follow a very specific process."**
→ **The only live route is the author's own contact form:** `https://justinpot.com/contact-me/`
(verified 2026-08-11 as rendering with a working reCAPTCHA and a Send Message button). His site's
most recent post was 2026-08-07, so he is active. **He publishes no email anywhere — do not guess
one.** Paste the body below into that form.

**The piece, read again 2026-08-11:** "The 4 best read it later apps to save content in 2026",
byline **"By Justin Pot · July 15, 2026"**, 8 min read. Footer: **"This article was originally
published in June 2017. The most recent update was in July 2026."** Four picks: **Instapaper (most
people) · Flyleaf (Apple users) · Readwise Reader (power users) · your browser's reading list (a
simple approach).**

Verbatim details the draft leans on:

- Flyleaf's cons box is literally **"Apple only"**, and the body says: **"Flyleaf is a streamlined
  read it later app for Apple devices—there's no web, Android, or Windows version."**
- **"Adding articles to Flyleaf is handled using the Share function on Apple devices, meaning
  there's no need to install any browser extensions."** — he already treats share-sheet saving as a
  virtue, not a workaround.
- His stated criterion: **"Let you save articles to read later in one click. Ideally there's a
  browser extension and a mobile app, but bookmarklets work in a pinch."**
- And the sidebar the pitch actually aims at: **"Bookmarking tools like Raindrop.io, Pinboard, and
  Google Bookmarks can also be used as an app to save articles. They don't extract your articles
  for offline reading, or offer custom fonts and color schemes, but they make up for that with
  organizational features."**

**Subject:** Your Flyleaf pick, without the Apple part

> Hi Justin,
>
> Sorry for using your personal contact form — Zapier's blog doesn't publish an editorial address,
> and the guest-post route says outright that it doesn't take submissions for app comparisons or
> best-apps lists, so this seemed like the only honest door. Tell me if it's the wrong one.
>
> I read the July update of "The 4 best read it later apps". The line I keep coming back to is the
> Flyleaf one: that adding articles is handled through the Share function on Apple devices, so
> there's no need to install a browser extension. That's exactly the behaviour I think most people
> actually want, and you're one of the few writers who framed it as a feature rather than a
> limitation — right next to a cons box that just says "Apple only", and the sentence that there's
> no web, Android or Windows version.
>
> I build SaveBoard, which is that same share-sheet idea on both iOS and Android: you hit share
> inside whatever app you're already in — Instagram, YouTube, WhatsApp, your browser — and the link
> lands as a visual card on a board, one tap, no extension. Made by me, in Perth.
>
> I'm not asking for one of the four slots, and I don't think it belongs there. By your own
> criteria it isn't a read-it-later app at all: it doesn't extract article text for offline
> reading, there's no custom typography or colour schemes, and there's no browser extension —
> the web build is the same phone-shaped app rather than a desktop one. What I had in mind is the
> paragraph where you point out that bookmarking tools like Raindrop.io and Pinboard can be used to
> save articles, trading offline extraction for organisational features. That paragraph is where
> SaveBoard honestly sits, and right now everything named in it is desktop-and-extension shaped.
> Raindrop is well ahead of us on breadth — nested collections, extensions, integrations, years of
> features — the only thing I'd claim is a different axis: saving on a phone, from inside other
> apps.
>
> If it ever earns a clause in that sidebar, that's the whole ask. Free tier is 30 saves and five
> boards with no card, Pro is A$5.49 a month or A$34.99 a year in Australian dollars — we're an
> Australian studio, so that's the currency it's priced in. saveboard.app, and there's a
> Raindrop comparison at saveboard.app/saveboard-vs-raindrop if it's useful.
>
> Either way, thanks for keeping a 2017 article honest for nine years. That's rarer than it should
> be.
>
> Best,
> Mihee Youn
> Founder, SaveBoard — saveboard.app

**왜 이 각도인가 (KO):** 4칸짜리 짧은 목록이라 **순위 편입은 현실적으로 불가능**하다. 그런데 이
기사에는 우리가 정확히 들어맞는 **다른 문단**이 있다 — "Raindrop·Pinboard 같은 북마크 도구도
기사 저장에 쓸 수 있다"는 사이드바. 그래서 목표를 **"4위 안"이 아니라 "그 문단의 한 구절"**로
낮췄고, 낮췄다는 사실을 메일 안에서 먼저 말한다. 저자는 이미 **Flyleaf의 공유시트 저장을 장점으로
써놨고, 같은 칸에 "Apple only"라고 단점도 적어놨다** — 우리 각도(iOS+안드로이드 공유시트)가
그 빈칸에 그대로 들어간다. 그의 선정 기준(오프라인 본문 추출·타이포그래피)을 인용해 **"우리는
read-it-later가 아니다"를 우리가 먼저 선언**한 게 이 메일의 핵심이다. ⚠️ 경로 주의: Zapier 블로그는
편집용 주소가 없고 게스트 폼은 **best-apps 목록을 명시적으로 거부**한다 — 그래서 저자 개인 폼이고,
첫 줄에서 그 사정을 인정하지 않으면 스팸처럼 읽힌다. 주소를 지어내지 말 것.

---

## 3. How-To Geek — 기존 목록 수정이 아니라 **새 기사 아이디어**

**To:** `editorial@howtogeek.com`
Source: `howtogeek.com/contact/`, where the address is labelled verbatim **"Editorial Inquiries —
Topic Ideas, Feedback, Corrections or Suggestions"**. ⚠️ That page renders its mailto links with
JavaScript, so curl/WebFetch shows an empty `href` and makes it look like no address exists — it
was read from the live DOM in a real browser. `pr@howtogeek.com` is Events & PR and `info@` is
general; neither is the right door.
**Named author (no address):** **T.M. Amrita**. No personal address published.

**The piece, read again 2026-08-11:** "5 Pocket Alternatives That Can Replace the Now-Defunct
'Read It Later' Service", `howtogeek.com/pocket-alternatives/`. JSON-LD `datePublished` =
`dateModified` = **2025-10-11** — published once, never updated. Five entries: **Instapaper ·
Flyleaf · Readwise · Matter · Reeder.**

Verbatim: the opening is **"One of the most famous read-later apps, Pocket by Mozilla, shut down
permanently in October."** The Flyleaf entry reads **"Flyleaf (iOS) is a read-later app designed
for Apple devices with an interface that makes it feel natural to use. The app lets you paste URLs
or use the share button on web browsers to save articles."**

**Subject:** Topic idea: the Android half of your Pocket alternatives piece

> Hi How-To Geek editorial,
>
> Your contact page says this address takes topic ideas, so here's one — with my interest in it
> declared up front: I build a bookmark app, so weigh this accordingly.
>
> T.M. Amrita's "5 Pocket Alternatives That Can Replace the Now-Defunct 'Read It Later' Service"
> is the piece I keep landing on when I search for where Pocket users went. What struck me
> re-reading it is how the five options land for an Android reader. Flyleaf you describe yourself
> as "(iOS)… designed for Apple devices"; Reeder, as far as I can tell from its own App Store
> listings, is Apple-only too; Readwise is a paid tool aimed at heavy readers. That leaves
> Instapaper and Matter carrying the whole Android side of a list about the shutdown of an app
> that a lot of people used on an Android phone.
>
> The story I think is missing — and I'd genuinely rather one of your writers did it than me — is
> the phone-side version of that piece: where do you save a link now, when the link isn't an
> article at all but an Instagram reel, a YouTube video or something a friend dropped in a group
> chat, and you're saving it from inside that app rather than from a browser? That's the behaviour
> Pocket's Android share-target actually served for a lot of people, and it's not the same question
> as "which reader has the best typography".
>
> My disclosure: SaveBoard is my app, and it does exactly that — share sheet in any app, one tap,
> the link becomes a visual card on a board, iOS and Android. It's new, it's small, it's me in
> Perth, there's no browser extension, and Raindrop is ahead of it on nearly every feature that
> isn't mobile saving. Free is 30 saves and five boards; Pro is A$5.49 a month or A$34.99 a year in
> Australian dollars. saveboard.app, and there's a comparison at
> saveboard.app/saveboard-vs-raindrop.
>
> If the idea is worth commissioning, I'd be glad to be one source among several and just as glad
> to be left out of it — the piece stands without me. And if you'd rather not touch it, no hard
> feelings; thanks for keeping a straight answer up for people whose read-later app disappeared.
>
> Best,
> Mihee Youn
> Founder, SaveBoard — saveboard.app

**왜 이 각도인가 (KO):** 이 글은 **게재 후 한 번도 갱신되지 않았다**(2025-10-11 발행=수정). 즉
"목록 고쳐주세요"는 기대값이 낮다. 대신 연락처 페이지가 스스로 창구를 **"Topic Ideas"**라고 라벨링해
놨으므로, **기존 글 수정이 아니라 신규 기사 제보**로 문을 맞췄다. 근거는 그 기사 안에 있다 —
5개 중 Flyleaf는 그들이 직접 "(iOS) Apple 기기용"이라고 썼고, Reeder도 애플 전용이라 **안드로이드
독자에게 남는 선택지가 사실상 둘**이다. 목록 내부 비교만 사용했고, Reeder는 우리가 직접 전수
확인한 게 아니라 **"App Store 표기로 보아"라는 헤지를 달았다**(절대비교 금지). 그리고 제안의
핵심을 "우리를 넣어달라"가 아니라 **"기사 주제 자체"**로 두고, **"당신 기자가 쓰는 게 낫다,
날 빼도 좋다"**로 이해관계를 스스로 끊었다 — PeriodVol HemAware 건에서 검증된 처리다.

---

## 4. BuyerSprint — 유일하게 **검토 요청을 공개 모집**하는 곳

**To:** `hello@buyersprint.com`
Source: `buyersprint.com/contact/`, which calls email "the fastest way to reach us" and lists four
uses, one of which is verbatim **"Review requests — we pick tools to test based on reader demand
and search data."** No form, so nothing to verify there.
**Byline mismatch, recorded as found:** the page's visible byline is **"BuyerSprint Editorial
Team"** while the HTML `author` meta says **`millerjosh16`**. The draft addresses the desk, not a
name.

**The piece, read again 2026-08-11:** "10 Best Pocket Alternatives 2026 (Tested) After Shutdown",
`buyersprint.com/2026/05/22/best-pocket-alternatives-2026/`, `datePublished` 2026-05-23,
`dateModified` 2026-05-31. Ten entries: **Readwise Reader · Matter · Instapaper · Raindrop.io ·
Wallabag · GoodLinks · Glasp · Recall · Reeder · Heimdal.**

Verbatim, and the reason this email is shaped the way it is:

- **"Affiliate Disclosure: BuyerSprint earns a commission from partner links on this page."** plus
  **"Of the 10 read-later apps covered below, BuyerSprint has an affiliate relationship with
  Readwise"** — their number one. Do not pitch for the top slot.
- Methodology: **"We imported a 1,200-article Pocket library into each tool that supports it,
  tested article-saving on web and mobile for 14 days, and verified vendor pricing and import
  behavior as of May 2026."** and **"For each tool, we then used it as the primary read-later app
  for 14 consecutive days across web, iOS, and Android (where applicable)."**
- Verdict: **"For most Pocket refugees with tagged libraries, the answer is Readwise Reader. For
  Kobo owners, the answer is Instapaper."**

**Subject:** Review request — mobile-first link saver that would fail your import test

> Hi BuyerSprint,
>
> Your contact page says review requests are welcome, so here's one, and I'll start with the part
> that argues against me.
>
> Your Pocket alternatives methodology begins by importing a 1,200-article Pocket library into each
> tool and scoring which fields survive. SaveBoard has no importer at all — no CSV, no Pocket
> export, nothing. On your first test step it scores zero, and I'd rather you heard that from me
> than found it in the first ten minutes. If a clean migration path is a hard requirement for the
> piece, that's a fair place to stop reading.
>
> What might still be worth 14 days of your time is that your list answers a different question
> than the one a lot of ex-Pocket users are actually asking. Your verdict is that Pocket refugees
> with tagged libraries should go to Readwise Reader and Kobo owners to Instapaper — both right, as
> far as I can tell, for people with a library to move. The other group has no library to move.
> They used Pocket as the button that appeared when they hit share on their phone, and what they
> saved wasn't only articles: it was Instagram reels, YouTube videos, links dropped in a group
> chat.
>
> SaveBoard is built for that person and nothing else. Share sheet in any app — Instagram, YouTube,
> WhatsApp, the browser — one tap, and the link becomes a visual card on a board you can search.
> iOS and Android. Straight about where it loses against your ten: no importer, no browser
> extension, the web build is the same phone-shaped app rather than a desktop-first one, no
> highlights or annotation, and Raindrop, which you already cover at number four, is ahead of it on
> feature breadth by a wide margin. It's new and it's one person in Perth.
>
> Pricing, so it's on the record: free tier is 30 saves and five boards with no card; Pro is A$5.49
> a month or A$34.99 a year; Team is A$9.49 a month. Those are Australian dollars — we're an
> Australian studio, and I'd rather quote our own currency than an exchange rate that moves.
> saveboard.app · saveboard.app/pocket-alternative
>
> Since you disclose the Readwise affiliate relationship on the page, I'll be equally plain: I'm
> not asking for a position near the top, and I'm not asking you to like it. If you test it and it
> doesn't hold up over 14 days, saying so is more useful to me than being left out. Happy to send
> screenshots, or Pro access for the testing period if that helps.
>
> Best,
> Mihee Youn
> Founder, SaveBoard — saveboard.app

**왜 이 각도인가 (KO):** 이 배치에서 **유일하게 "검토 요청 받습니다"라고 자기가 써 붙인 곳**이라,
정중한 부탁이 아니라 **정식 신청**의 형식이 맞다. 다만 두 가지가 이 메일의 모양을 결정했다.
① **그들의 테스트 1단계가 Pocket CSV 임포트**인데 우리는 임포터가 아예 없다 → 숨기면 10분 만에
들통나므로 **첫 문단에서 우리가 먼저 0점이라고 말하고, "그게 하드 기준이면 여기서 그만 읽어도
된다"**고 적었다(PeriodVol Tuta 건의 '유럽 한정' 처리와 같은 수법). ② **1위 Readwise는 그들의
제휴사**이고 페이지에 고지돼 있다 → 상위권을 노리는 순간 무리한 요청이 된다. 그래서 **"상위권을
원하지 않는다, 떨어뜨려도 좋다"**로 요청 수위를 낮췄다. 우리가 파는 건 순위가 아니라 **그들 결론이
다루지 않는 독자층**("옮길 라이브러리가 없는 사람")이다 — 이건 그들의 결론 문장을 그대로 인용해
세운 논거라 반박이 아니라 보완으로 읽힌다. ⚠️ Pro 계정 제공은 제휴·대가가 아니라 **테스트 기간
접근권**이다. 금전 제안으로 번역하지 말 것.

---

## 5. HashDork — 📝 **이메일 아님: 문의 폼**

**To:** ⛔ **No editorial email exists.** The only route is the contact form at
`https://hashdork.com/contact/` (verified 2026-08-11 as a working WPForms form with a loading
reCAPTCHA and no site-key error).
⛔ **Never `partnerships@squeezegrowth.com`** — the only address published on the site, and it is
labelled for "partnership and sponsorship inquiries". That is the ad desk; sending an editorial
suggestion there invites a rate card.
**Named author (no address):** **Jay**.

**The piece, read again 2026-08-11:** "15 Best Bookmark Managers in 2026",
`hashdork.com/best-bookmark-managers/`, `datePublished` 2026-01-14, `dateModified` 2026-03-02.
Fifteen entries in order: **Raindrop · SaveDay · Bookmark · Papaly · Diigo · Start.me · Bookmark
Ninja · Booky · Instapaper · Pinalist · Lasso · Bookmark OS · Zotero · Good Links · Anybox.**

Verbatim, and the hook this pitch is built on — **their own con line for entry 14 states the gap**:

- GoodLinks (#14): **"GoodLinks is a simple bookmark manager for iOS and macOS devices"**, con:
  **"Focus on the Apple ecosystem: It's only for iOS and macOS, which may leave out people who
  don't use Apple products."**
- Anybox (#15): **"Anybox is a durable bookmarking app made for Mac, iPhone, and iPad."**
- Opening line: **"Bookmark managers are a must-have for workers who want to maximize their
  efficiency at work and in their personal lives."**

⚠️ **Research-file drift:** an earlier automated read of this page reported that the intro still
says "best bookmark managers available in 2024". **That is not in the visible body** — the only
"2024" strings in the HTML are image upload paths. Do not put that line in the form; it would be a
false correction.

**Form message (paste as-is; keep it shorter than the emails — this is a form, and it gets
skimmed):**

> Hello,
>
> A suggestion for "15 Best Bookmark Managers in 2026", with my interest declared first: I build
> one of these apps, so read this in that light.
>
> Your entries 14 and 15 are the ones written up as phone-and-tablet apps rather than browser
> tools — GoodLinks, which you describe as being for iOS and macOS, and Anybox, made for Mac,
> iPhone and iPad. Your own con line for GoodLinks makes the point better than I could: "It's only
> for iOS and macOS, which may leave out people who don't use Apple products." Going by the
> descriptions in your own list, that corner of it is Apple-only.
>
> SaveBoard is the same idea on both iOS and Android. You hit share inside whatever app you're
> already in — Instagram, YouTube, WhatsApp, your browser — and the link becomes a visual card on a
> board you can search, in one tap. No extension needed because there's nothing to install into a
> browser.
>
> Where it's weaker than your existing entries, plainly: there's no browser extension at all, the
> web version is the same phone-shaped app rather than a desktop one, there's no import from
> another bookmark tool, and Raindrop — your number one — is ahead of it on nested collections,
> integrations and sheer feature count. It's a new app made by one person in Perth, Australia.
>
> Free tier: 30 saves, 5 boards, no card. Pro A$5.49/month or A$34.99/year, Team A$9.49/month —
> Australian dollars, since that's where it's priced. iOS and Android: saveboard.app · comparison
> with your number one: saveboard.app/saveboard-vs-raindrop
>
> To be clear this is an editorial suggestion and not an advertising enquiry — happy to be told
> it's the wrong desk. I'd send screenshots or answer questions if it's ever useful.
>
> Mihee Youn
> Founder, SaveBoard — saveboard.app
>
> Reply address: creatorsloftperth@gmail.com

**왜 이 각도인가 (KO):** **15칸**이라 이 배치에서 진입 장벽이 가장 낮고, 무엇보다 **논거가 그들
글 안에 이미 적혀 있다** — GoodLinks 단점란에 "iOS·macOS 전용이라 애플 안 쓰는 사람은 빠진다"고
자기들이 써놨다. 그 문장을 인용해 "그럼 그 자리를 안드로이드까지 커버하는 앱이 채우면 된다"로
잇는 구조라, 외부인의 홍보가 아니라 **목록의 구멍 메우기 제안**이 된다. 비교는 **그 15개 안에서만**
했다(전체 시장 절대비교 아님). ⚠️ 주의 둘: ① 창구가 폼뿐이고 사이트에 보이는 유일한 주소는
**광고 담당**이라, 폼 본문 마지막에 "광고 문의 아님"을 못 박았다(living360 처리와 동일). ② 폼은
회신 경로가 없으므로 **본문 마지막에 회신 주소를 직접 적었다** — 이 줄을 빼면 답을 받을 방법이
없다. 그리고 폼 제출은 발송 기록이 남지 않으니 **제출 직후 스크린샷을 남길 것.**

---

## 6. MakeUseOf — 방치된 두 기사, 그래서 **2026년판 제안**

**To:** `editorial@makeuseof.com`
Source: `makeuseof.com/contact/`, labelled Editorial Inquiries. Same Valnet setup as How-To Geek —
the mailto is written by JavaScript, so it must be read from the live DOM, not from curl.
`pr@makeuseof.com` and `info@makeuseof.com` are the wrong doors.
**Named authors (no addresses):** **Yash Wate** and **Maxwell Holland**.

**The two pieces, read again 2026-08-11:**

- **"Pocket Is Gone: Here Are 5 Awesome Apps to Save Anything You Love"** by Yash Wate,
  `makeuseof.com/best-pocket-alternatives-save-bookmarks/`, stamped **"Published Jun 6, 2025"**,
  never updated. It counts **down** from 5 to 1 — Instapaper, Raindrop.io, Matter, Readwise Reader,
  Recall — and its opening sentence is still in the future tense: **"After 17 years of service,
  Pocket, the beloved popular read-it-later service, will cease operations on July 8, 2025."**
- **"The 6 Best Bookmark Manager Apps for Android"** by Maxwell Holland,
  `makeuseof.com/best-bookmark-managers-android/`, stamped **"Published Dec 10, 2021"**. Six
  entries: **1 Raindrop · 2 VisiMarks · 3 Keeplink · 4 Pocket · 5 Bookmark · 6 LinkStore.** Pocket
  is still entry 4, described in the present tense: **"Pocket is an application created by
  Mozilla."** Two entries are already share-to-save apps — VisiMarks: **"The app can be used with
  any browser, you simply need to share the link to the app to have it saved"**, and Keeplink:
  **"just like VisiMarks, you have to share the link to the app."**

**Subject:** Story idea: a 2026 rewrite of your Android bookmark managers list

> Hi MakeUseOf editorial,
>
> A story idea, and my interest in it up front: I build a bookmark app, so discount this
> accordingly.
>
> Maxwell Holland's "The 6 Best Bookmark Manager Apps for Android" still ranks well for the
> obvious searches, and it's from December 2021. Its number four is Pocket, written in the present
> tense — "Pocket is an application created by Mozilla" — and Mozilla shut Pocket down on 8 July
> 2025. Yash Wate's "Pocket Is Gone" piece from June 2025 has the mirror-image problem: it's the
> right list, but it still says Pocket "will cease operations on July 8, 2025", in the future
> tense, a year after it did.
>
> The Android piece is the one I think is worth rewriting rather than patching, because the
> behaviour it describes has changed. The 2021 list already contained the seed of it — VisiMarks
> and Keeplink both work by sharing a link into the app rather than bookmarking in a browser — and
> that is how a lot of saving on a phone happens now, except that what gets saved often isn't a web
> page at all. It's an Instagram reel, a YouTube video, a link a friend dropped in a WhatsApp group.
> A 2026 version of that list is really the question "which app is best at catching whatever the
> Android share sheet hands it", which is a different test from the one a browser-bookmark roundup
> runs.
>
> Disclosure: my app, SaveBoard, is built for exactly that, on iOS and Android — share sheet, one
> tap, the link becomes a visual card on a board. So I'd be glad to be considered, and equally
> glad if your writer tests it and prefers something else; the idea is worth doing either way.
> Where it's weak: no browser extension, the web build is the same phone-shaped app rather than a
> desktop one, no import from other bookmark tools, and Raindrop — your 2021 number one and still
> a good pick — is ahead of it on feature breadth. It's new, and it's one person in Perth. Free is
> 30 saves and five boards; Pro A$5.49 a month or A$34.99 a year; Team A$9.49 a month, in
> Australian dollars. saveboard.app · saveboard.app/raindrop-alternative
>
> Happy to send screenshots or answer questions, and just as happy to be left out of the piece.
> Thanks for the work.
>
> Best,
> Mihee Youn
> Founder, SaveBoard — saveboard.app

**왜 이 각도인가 (KO):** 매체는 크지만 이 두 기사는 **방치 상태**다(2021-12-10 / 2025-06-06, 둘 다
갱신 이력 0). 그래서 "목록 고쳐주세요"가 아니라 **명분이 확실한 신규 기사 제안**으로 갔고, 명분은
지어낸 게 아니라 **두 기사의 시제 오류**다 — 안드로이드 글은 죽은 Pocket을 현재형으로 4위에 두고
있고, Pocket 종료 기사는 1년이 지났는데 아직 미래형("will cease operations")이다. 각도 ③(모바일·
공유시트)은 독립 매체 리스티클이 사실상 없고 경쟁사 자사 블로그가 다 차지하고 있어서, **새 기사를
만들게 하는 것**이 이 각도의 유일한 현실 경로다. 결정적으로 **2021년 목록 안에 이미 공유 저장
앱(VisiMarks·Keeplink)이 들어 있다** — 우리가 새 개념을 파는 게 아니라 그들이 5년 전에 발견한
행동이 표준이 됐다는 얘기가 되므로 설득이 쉽다. ⚠️ Valnet 계열(HTG·MakeUseOf·XDA)은 연락처
mailto를 **JS로 렌더**한다 — curl로 확인하면 "주소 없음"으로 잘못 보인다. 재확인은 실제 브라우저로.

---

## ⛔ Tool Finder — 초안 없음

**이건 광고 상품이므로 별도 판단이 필요하다.** `toolfinder.com/submit`은 등재를 **"List your tool
… Starting from $39"**로 판매한다(2026-08-11 브라우저 확인). 돈을 내고 목록에 오르는 것은 편집
제안이 아니라 광고 집행이고, 이 파일의 다른 다섯 건과 성격이 다르다 — 예산·기대 도달·다른 광고
채널과 나란히 놓고 판단할 사안이라 여기서 초안을 쓰지 않는다. 무료 편집 편입 경로가 있는지는
`tools@keepproductive.com`(사이트 구조화 데이터에만 있는 주소)에 물어봐야 알 수 있으나, **그
문의 자체가 유료 영업 회신을 부를 가능성이 높다.**

---

## Send checklist

**발신은 전부 `creatorsloftperth@gmail.com`.** 링크는 평문, 추적 파라미터 금지. 회신 없으면
1~2주 뒤 정중한 리마인드 **한 번**까지, 그다음은 놓는다. 전부 대표 실명으로 나가는 메일이다.

**권장 순서 — 성공 확률순, 그리고 앞의 결과를 보고 뒤를 조정할 수 있게:**

- [ ] **1. Cloudwards** — 📧 `hello@cloudwards.net`. **최우선.** 이 배치에서 유일하게 상대에게
      회신 동기가 있는 건(자기 글의 1위가 죽은 서비스). 2주 무응답 시 `info@cloudwards.net`으로
      1회. ⛔ `office@`(영업) · `application@`(기고 지원) 금지.
- [ ] **2. BuyerSprint** — 📧 `hello@buyersprint.com`. 검토 요청을 공개 모집하는 유일한 곳이라
      회신 확률이 높다. 회신이 오면 **테스트용 Pro 접근권을 실제로 줄 준비**를 해둘 것(메일에
      제안해 뒀다).
- [ ] **3. HashDork** — 📝 **폼 제출**, `https://hashdork.com/contact/`. 15칸이라 자리가 가장
      많다. ⛔ `partnerships@squeezegrowth.com`(광고 담당)로 보내지 말 것. **폼은 발송 기록이
      남지 않으니 제출 직후 스크린샷을 `marketing/`에 남길 것** — 그게 유일한 증거다. 본문 끝의
      회신 주소 줄을 지우지 말 것.
- [ ] **4. How-To Geek** — 📧 `editorial@howtogeek.com`. 기존 목록 수정이 아니라 **주제 제보**로
      나간다(그 주소의 공식 용도가 "Topic Ideas").
- [ ] **5. MakeUseOf** — 📧 `editorial@makeuseof.com`. HTG와 같은 Valnet 구조·같은 형식이라
      **HTG 회신 여부를 보고 보낼 것.** 둘 다 무응답이면 Valnet 편집 창구 자체가 안 열리는
      것으로 판단하고 이 경로는 접는다.
- [ ] **6. Zapier (Justin Pot)** — 📝 **폼 제출**, `https://justinpot.com/contact-me/`.
      매체 권위는 최상이지만 **4칸짜리 목록 + 저자 개인 폼**이라 확률은 가장 낮다. 마지막에
      보내되, 노리는 것은 순위가 아니라 **사이드바 한 구절**임을 잊지 말 것. 여기서도 제출
      스크린샷을 남길 것.

**보내지 않는 곳:**

- [ ] ⛔ **TechCrunch** — 초안 없음. `techcrunch.com/contact-us/`가 **"We do not accept pitches or
      guest post submissions"**라고 명시한다. `tips@`는 뉴스 제보용이라 제품 소개를 보내면 규정
      위반이다. 목록 구성(Raindrop·GoodLinks·Matter·mymind)이 우리와 완벽히 겹치지만 **문이
      닫혀 있다.**
- [ ] ⛔ **Tool Finder** — 초안 없음. 등재가 **$39~ 유료 상품**이라 편집 제안이 아니라 광고다.
      위 절 참조 — 마케팅 예산 문제로 별도 판단.
- [ ] ⛔ **경쟁사 자사 블로그 전부**(Fabric · Marqly · Mailist · Readless · Save This One ·
      ClipCrate · Stasht 등 조사 파일 🚩 표) — 자기 제품을 1위에 올린 글이라 게재 확률 대비
      포지셔닝 유출이 크다. PeriodVol Cythr 건과 같은 판단.
- [ ] ⛔ **TechRadar(4점) · XDA(3점)** — 점수 기준 미달이라 이번 배치 제외. TechRadar는 속보
      기사라 갱신되지 않고, XDA 기사는 제목이 **self-hosted 한정**이라 클라우드 앱은 정의상
      못 들어간다. 다만 두 곳 다 **각도 ③ 신규 기사 제보처**로는 유효하니 다음 배치에서 재검토.

**보내기 전에 먼저 할 것:**

- [ ] ⭐ **AlternativeTo 등록이 이 메일들보다 급하다.** SaveBoard는 아직 AlternativeTo에 없다
      (2026-08-11 확인). 리스티클 저자 상당수가 거기 데이터를 1차 자료로 쓰는데, 우리를 검색한
      기자가 아무것도 못 찾는 상태로 메일을 받는 건 최악의 순서다. 등록 절차는
      `marketing/offsite-listings.md`의 AlternativeTo 절에 있다.

**조사 파일에 반영할 수정 3건** (`listicle-targets-2026-08-11.md`를 다시 쓸 일이 생기면):

1. **HashDork의 "2024" 언급은 없다.** 자동 수집 요약이 "best bookmark managers available in
   2024"라는 본문 문장을 보고했으나, 실제 HTML에서 "2024"는 **이미지 업로드 경로뿐**이다.
   정정 소재로 쓰면 틀린 지적이 된다.
2. **MakeUseOf "Pocket Is Gone"은 역순(5→1) 목록이다.** Instapaper가 5번으로 시작하고 Recall이
   1번이다 — 조사 파일의 나열 순서를 순위로 읽으면 뒤집힌다. 그래서 초안은 순위를 주장하지 않고
   "counted down"이라고만 썼다.
3. **BuyerSprint 방법론 문장은 조사 요약과 표현이 다르다.** 실제 문장은 "We imported a
   1,200-article Pocket library into each tool that supports it, tested article-saving on web and
   mobile for 14 days…"이고, 14일 상시 사용 문장은 별개다. 인용할 때 위 4번 절의 표기를 쓸 것.

**검수:** 미실시. 필요하면 brand-qa에 넘길 것 (PeriodVol Batch 2는 검수에서 4건이 나왔다).

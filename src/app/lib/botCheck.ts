/**
 * User-Agent 로 크롤러를 가려낸다. 크롤러는 자기를 숨기지 않는다 — 식별되는 것이
 * 그들의 일이라서 UA 에 이름을 적고 온다. 그래서 UA 한 줄이면 대부분 잡힌다.
 *
 * ⚠️ 이것이 답하지 못하는 것:
 *  - JS 를 실행하지 않는 크롤러는 애초에 이 코드에 닿지 않는다. 링크 미리보기
 *    수집기(facebookexternalhit, 카카오 스크랩 등)가 전부 그렇다 — 안 잡히는 게
 *    아니라 **세지도 않는다.**
 *  - UA 를 속이는 스크래퍼. 막을 방법이 없고, 지금 궁금한 것도 그게 아니다.
 *  - 사람이 쓰는 인앱 브라우저(카카오톡·인스타)는 **사람이다.** 아래 규칙이
 *    'KAKAOTALK' 전체가 아니라 'kakaotalk-scrap'(미리보기 수집기)만 잡는 이유다.
 *
 * 그래서 이 함수의 답은 "크롤러다 / 크롤러로 보이지 않는다" 두 가지다.
 * "사람이다"를 증명하지는 않는다.
 */

/** 소문자 UA 에서 찾을 조각 → 화면에 쓸 이름. 위에서부터 먼저 맞는 것을 쓴다. */
const SIGNATURES: [string, string][] = [
  // 검색엔진
  ['googlebot', 'Google'],
  ['google-inspectiontool', 'Google'],
  ['storebot-google', 'Google'],
  ['bingbot', 'Bing'],
  ['yeti', 'Naver'],          // 네이버. 09-03 등록 직후 유입이 뛰었으니 특히 중요하다
  ['daum', 'Daum'],
  ['yandex', 'Yandex'],
  ['baiduspider', 'Baidu'],
  ['duckduckbot', 'DuckDuckGo'],
  ['slurp', 'Yahoo'],
  ['applebot', 'Apple'],
  ['petalbot', 'Petal'],
  ['seznambot', 'Seznam'],

  // AI 수집기
  ['gptbot', 'GPTBot'],
  ['oai-searchbot', 'OpenAI'],
  ['chatgpt-user', 'ChatGPT'],
  ['claudebot', 'ClaudeBot'],
  ['anthropic-ai', 'Anthropic'],
  ['perplexitybot', 'Perplexity'],
  ['ccbot', 'CCBot'],
  ['bytespider', 'Bytespider'],
  ['amazonbot', 'Amazon'],
  ['meta-externalagent', 'Meta'],

  // SEO·모니터링
  ['ahrefsbot', 'Ahrefs'],
  ['semrushbot', 'Semrush'],
  ['mj12bot', 'Majestic'],
  ['dotbot', 'DotBot'],
  ['dataforseo', 'DataForSEO'],
  ['screaming frog', 'ScreamingFrog'],

  // 링크 미리보기 — JS 를 안 돌려서 여기 닿을 일은 거의 없지만, 닿으면 사람이 아니다
  ['facebookexternalhit', '미리보기'],
  ['twitterbot', '미리보기'],
  ['slackbot', '미리보기'],
  ['discordbot', '미리보기'],
  ['telegrambot', '미리보기'],
  ['linkedinbot', '미리보기'],
  ['whatsapp', '미리보기'],
  ['kakaotalk-scrap', '미리보기'],   // ⚠️ 'kakaotalk' 전체를 잡으면 안 된다 — 인앱 브라우저는 사람
  ['embedly', '미리보기'],

  // 자동화 브라우저
  ['headlesschrome', '헤드리스'],
  ['phantomjs', '헤드리스'],
  ['puppeteer', '헤드리스'],
  ['playwright', '헤드리스'],

  // 마지막 그물. 위에 없는 것도 대개 이 셋 중 하나를 UA 에 적는다.
  ['crawler', '기타 봇'],
  ['spider', '기타 봇'],
  ['bot', '기타 봇'],
];

/** 크롤러면 화면에 쓸 이름, 아니면 false. */
export function detectBot(userAgent: string | null | undefined): string | false {
  if (!userAgent) return '알 수 없음';   // UA 가 없는 요청은 브라우저가 아니다
  const ua = userAgent.toLowerCase();
  for (const [needle, label] of SIGNATURES) {
    if (ua.includes(needle)) return label;
  }
  return false;
}

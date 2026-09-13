import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { supabase } from './supabase';
import { detectBot } from './botCheck';

export type TrackEvent = 'pageview' | 'board_click' | 'signup_click' | 'store_click_ios' | 'store_click_android';

const recent = new Map<string, number>();
const DEDUPE_MS = 30_000;

function currentSource(): string | null {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('utm_source') ?? params.get('src');
  return param ? param.toLowerCase().slice(0, 60) : null;
}

/**
 * Fire-and-forget, anonymous. A row records that a path was seen and where it
 * came from — never who. Failures are swallowed on purpose: analytics must not
 * be able to break a page, and the table is insert-only, so there is nothing
 * to read back or retry.
 */
export function track(event: TrackEvent, meta: Record<string, unknown> = {}) {
  try {
    if (typeof window === 'undefined') return;
    if ((navigator as any).webdriver) return;   // automated browser, not a reader

    const path = window.location.pathname;
    const key = `${event}:${path}`;
    const now = Date.now();
    if (now - (recent.get(key) ?? 0) < DEDUPE_MS) return;
    recent.set(key, now);

    const referrer = document.referrer && !document.referrer.startsWith(window.location.origin)
      ? document.referrer.slice(0, 300)
      : null;
    const source = currentSource();

    // 2026-09-13: 방문이 8월의 3배로 뛰었는데 유입처가 안 붙어서 "사람인지 크롤러인지"를
    // 답할 수 없었다. UA 로 가른 결과를 meta 에 넣는다 — meta 는 이미 jsonb 라 스키마
    // 변경이 없다. **크롤러가 아닐 때도 키를 쓴다**(bot: false). 키가 아예 없는 행은
    // 이 변경 전에 쌓인 것이고, 그건 "사람"이 아니라 "모름"이다. 둘을 섞으면 과거가
    // 전부 사람이었던 것처럼 보인다.
    const bot = detectBot(navigator.userAgent);

    void supabase.from('page_events').insert({ event, path, referrer, source, meta: { ...meta, bot } }).then(
      () => {}, () => {},
    );
  } catch {
    /* never surface */
  }
}

/** One pageview per route change, including the first render. */
export function usePageviews() {
  const location = useLocation();
  useEffect(() => { track('pageview'); }, [location.pathname]);
}

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { supabase } from './supabase';

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

    void supabase.from('page_events').insert({ event, path, referrer, source, meta }).then(
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

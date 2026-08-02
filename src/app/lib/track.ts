import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { supabase } from './supabase';

export type TrackEvent = 'pageview' | 'board_click' | 'signup_click';

const recent = new Map<string, number>();
const DEDUPE_MS = 30_000;

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

    void supabase.from('page_events').insert({ event, path, referrer, meta }).then(
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

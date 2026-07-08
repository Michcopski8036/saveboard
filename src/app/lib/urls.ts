import { Capacitor } from '@capacitor/core';

export const PROD_URL = 'https://www.saveboard.app';

// Base URL for links we hand to OTHER people (share links, invite links).
// On native the web view runs from a local scheme — iOS is `capacitor://localhost`,
// Android is `http://localhost` — so `window.location.origin` there is not a real
// public URL. Sniffing only for `capacitor` misses Android; use the authoritative
// Capacitor check plus a localhost guard so shared links always point at prod.
export function publicBase(): string {
  try {
    if (Capacitor.isNativePlatform()) return PROD_URL;
  } catch { /* Capacitor not ready */ }
  if (typeof window === 'undefined') return PROD_URL;
  const o = window.location.origin;
  if (/localhost|127\.0\.0\.1|capacitor:|file:/i.test(o)) return PROD_URL;
  return o;
}

// True on the native iOS/Android app (any local scheme), false on the real web.
export function isNativeApp(): boolean {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch { /* ignore */ }
  if (typeof window === 'undefined') return false;
  return /localhost|127\.0\.0\.1|capacitor:|file:/i.test(window.location.origin);
}

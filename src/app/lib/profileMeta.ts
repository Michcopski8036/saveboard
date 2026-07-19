import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

/**
 * Records the signed-in user's own platform and locale on their own auth record,
 * so the admin dashboard can show where users are and what they run on.
 *
 * Deliberately minimal: platform ('ios' | 'android' | 'web'), the browser/device
 * locale, and a last-seen timestamp. No IP, no device fingerprint, no third party.
 *
 * `last_seen` is a full timestamp so the admin dashboard can tell "signed in right
 * now" from "signed in this morning". It is a heartbeat, not a behavioural log — it
 * records only that the app was open, never what was done in it.
 */

/** Below this, a user counts as currently active in the admin dashboard. */
export const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

/** How often an open app re-stamps `last_seen`; also the write throttle. */
export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const HEARTBEAT_THROTTLE_MS = HEARTBEAT_INTERVAL_MS;

export async function recordProfileMeta(user: { user_metadata?: Record<string, any> } | null) {
  if (!user) return;

  const platform = Capacitor.getPlatform();                       // 'ios' | 'android' | 'web'
  const locale   = (typeof navigator !== 'undefined' && navigator.language) || '';
  const meta     = user.user_metadata ?? {};
  const now      = Date.now();

  const patch: Record<string, string> = {};
  if (platform && meta.platform !== platform) patch.platform = platform;
  if (locale   && meta.locale   !== locale)   patch.locale   = locale;

  // Heartbeat, throttled — auth events (including hourly token refresh) would
  // otherwise write far more often than the dashboard's resolution needs.
  const prev = Date.parse(meta.last_seen ?? '');
  if (!Number.isFinite(prev) || now - prev > HEARTBEAT_THROTTLE_MS) {
    patch.last_seen = new Date(now).toISOString();
  }

  if (Object.keys(patch).length === 0) return;

  // Best-effort: never let this break sign-in.
  try { await supabase.auth.updateUser({ data: patch }); } catch { /* ignore */ }
}

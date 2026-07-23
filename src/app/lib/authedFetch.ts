import { supabase } from './supabase';

// Flat shape (not a discriminated union): the project's tsconfig runs with
// strict:false, under which control-flow narrowing on an `ok` discriminant is
// unreliable. Optional fields keep every access valid at the call sites.
//   ok:true            → data is set
//   ok:false 'reauth'  → session expired/absent, user must sign in again
//   ok:false 'error'   → message carries the server's error string
export interface AuthedPost<T> {
  ok: boolean;
  data?: T;
  reason?: 'reauth' | 'error';
  message?: string;
}

// POSTs JSON with the current Supabase access token. If the server rejects the
// token (401 — an expired session, or an old cached bundle that never sent one),
// we refresh the session once and retry; a persistent 401 means the user has to
// sign in again. Everything else surfaces as a plain error string.
export async function authedPost<T = any>(path: string, body: unknown): Promise<AuthedPost<T>> {
  const post = (token?: string) => fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const { data: { session } } = await supabase.auth.getSession();
  let res = await post(session?.access_token);

  if (res.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) res = await post(data.session.access_token);
    if (res.status === 401) return { ok: false, reason: 'reauth' };
  }

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok || json?.error) {
    return { ok: false, reason: 'error', message: json?.error || `Request failed (${res.status})` };
  }
  return { ok: true, data: json as T };
}

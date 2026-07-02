// Unified boards — a board is a real entity (boards + board_members tables).
// A board with only its owner as member is "personal"; invite others and it
// becomes collaborative. Links point at a board via links.board_id. Board
// identity + mutations + sharing key off board_id; the UI still groups/displays
// by the board's NAME (kept in links.category as a fallback until Phase 3).
// See supabase/migrations/20260702_unified_boards_phase{1,2}.sql.
import { supabase } from './supabase';

export interface Board {
  id: string;
  name: string;
  sort_order: number;
  invite_token: string | null;   // set once the board has been shared
  owner_id: string;
  role: 'owner' | 'member';      // the current user's role on this board
  memberCount: number;           // accurate for boards you own; ≥1 otherwise
}
export interface BoardMember { user_id: string; role: string; }

/** Boards the current user owns or has joined, ordered for the sidebar. */
export async function loadBoards(uid: string): Promise<Board[]> {
  const { data: bdRaw } = await supabase
    .from('boards')
    .select('id, name, sort_order, invite_token, owner_id')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  // 'None' is the unsorted sentinel, not a real board — the Phase 1 backfill
  // created one from links whose category was literally 'None'. Never surface it.
  const bd = (bdRaw ?? []).filter((b: any) => b.name !== 'None');
  if (!bd.length) return [];

  // board_members is readable for my own rows + (as owner) every member of my
  // boards, so counts are exact for owned boards and my role is always present.
  const { data: mem } = await supabase.from('board_members').select('board_id, user_id, role');
  const memberCount: Record<string, number> = {};
  const myRole: Record<string, string> = {};
  (mem ?? []).forEach((m: any) => {
    memberCount[m.board_id] = (memberCount[m.board_id] ?? 0) + 1;
    if (m.user_id === uid) myRole[m.board_id] = m.role;
  });

  return bd.map((b: any) => ({
    id: b.id,
    name: b.name,
    sort_order: b.sort_order ?? 0,
    invite_token: b.invite_token ?? null,
    owner_id: b.owner_id,
    role: (myRole[b.id] as 'owner' | 'member') ?? (b.owner_id === uid ? 'owner' : 'member'),
    memberCount: memberCount[b.id] ?? 1,
  }));
}

/** Create a board (enforces the total-board tier limit). error='board_limit' on cap. */
export async function createBoard(name: string): Promise<{ board?: Board; error?: string }> {
  const { data, error } = await supabase.rpc('create_board', { p_name: name });
  if (error) return { error: error.message };
  const row: any = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: 'create_failed' };
  return { board: { id: row.id, name: row.name, sort_order: row.sort_order ?? 0, invite_token: row.invite_token ?? null, owner_id: row.owner_id, role: 'owner', memberCount: 1 } };
}

/** Make a board shareable → returns its invite token. error='share_limit'/'not_owner' on failure. */
export async function shareBoard(boardId: string): Promise<{ token?: string; error?: string }> {
  const { data, error } = await supabase.rpc('share_board', { p_board: boardId });
  if (error) return { error: error.message };
  return { token: data as string };
}

/** Join a shared board via its invite token. error='limit_members'/'board_not_found' on failure. */
export async function joinBoard(token: string): Promise<{ board?: { id: string; name: string; owner_id: string }; error?: string }> {
  const { data, error } = await supabase.rpc('join_board', { p_token: token });
  if (error) return { error: error.message };
  return { board: Array.isArray(data) ? data[0] : data };
}

/** Preview a board from its invite token (join screen); readable by anon. */
export async function getBoardByToken(token: string): Promise<{ id: string; name: string; owner_name: string; member_count: number } | null> {
  const { data } = await supabase.rpc('get_board_by_token', { p_token: token });
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

export async function loadBoardMembers(boardId: string): Promise<BoardMember[]> {
  const { data } = await supabase.from('board_members').select('user_id, role').eq('board_id', boardId);
  return (data ?? []) as BoardMember[];
}

/** Remove a member (owner) or leave a board (self) — same table delete, RLS-gated. */
export async function removeMember(boardId: string, userId: string): Promise<void> {
  await supabase.from('board_members').delete().eq('board_id', boardId).eq('user_id', userId);
}

export async function deleteBoard(boardId: string): Promise<void> {
  await supabase.from('boards').delete().eq('id', boardId);
}

/** Send a branded invite email via the Resend-backed API. ok:false → caller can fall back to mailto. */
export async function sendBoardInviteEmail(email: string, boardId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    // Web: hit THIS deployment (relative) so preview/prod each call their own
    // updated function. Native (capacitor://) can't do relative → use prod.
    const isWeb = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
    const endpoint = isWeb ? '/api/send-team-invite' : 'https://www.saveboard.app/api/send-team-invite';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ email, boardId }),
    });
    if (res.ok) return { ok: true };
    const j = await res.json().catch(() => ({} as any));
    return { ok: false, error: j.error || `http_${res.status}` };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export function inviteUrl(token: string): string {
  const base = typeof window !== 'undefined' && !window.location.origin.startsWith('capacitor')
    ? window.location.origin
    : 'https://saveboard.app';
  return `${base}/team/${token}`;
}

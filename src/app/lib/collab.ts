// Collaborative ("Team") boards — live multi-member boards backed by the
// collab_boards / collab_board_members / collab_links tables (see
// supabase/migrations/20260630_collab_boards.sql). Self-contained: does not
// touch the personal links/categories flow.
import { supabase } from './supabase';
import type { LinkData } from '../components/LinkCard';

export interface CollabBoard {
  id: string;
  name: string;
  owner_id: string;
  invite_token: string;
  role?: string; // 'owner' | 'member' (the current user's role)
}
export interface CollabMember { user_id: string; role: string; }

const mapLink = (r: any): LinkData => ({
  id: r.id,
  url: r.url ?? '',
  title: r.title ?? '',
  description: r.description ?? '',
  image: r.image ?? '',
  category: '',
  savedAt: new Date(r.created_at),
  notes: r.notes ?? undefined,
  tags: r.tags ?? undefined,
});

/** Boards the current user owns or has joined. */
export async function listMyCollabBoards(): Promise<CollabBoard[]> {
  const { data: mem } = await supabase
    .from('collab_board_members')
    .select('board_id, role')
    .order('joined_at', { ascending: true });
  const ids = (mem ?? []).map((m: any) => m.board_id);
  if (!ids.length) return [];
  const roleByBoard = new Map((mem ?? []).map((m: any) => [m.board_id, m.role]));
  const { data: boards } = await supabase
    .from('collab_boards')
    .select('id, name, owner_id, invite_token')
    .in('id', ids);
  return (boards ?? []).map((b: any) => ({ ...b, role: roleByBoard.get(b.id) }));
}

export async function loadCollabLinks(boardId: string): Promise<LinkData[]> {
  const { data } = await supabase
    .from('collab_links')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false });
  return (data ?? []).map(mapLink);
}

export async function loadCollabMembers(boardId: string): Promise<CollabMember[]> {
  const { data } = await supabase
    .from('collab_board_members')
    .select('user_id, role')
    .eq('board_id', boardId);
  return (data ?? []) as CollabMember[];
}

/** Create a board (free tier: 1 board). Returns { board, error, code }. */
export async function createCollabBoard(name: string): Promise<{ board?: CollabBoard; error?: string; code?: string }> {
  const { data, error } = await supabase.rpc('create_collab_board', { p_name: name });
  if (error) return { error: error.message, code: error.message };
  return { board: Array.isArray(data) ? data[0] : data };
}

/** Join via invite token (free owner: max 5 members). */
export async function joinCollabBoard(token: string): Promise<{ board?: CollabBoard; error?: string }> {
  const { data, error } = await supabase.rpc('join_collab_board', { p_token: token });
  if (error) return { error: error.message };
  return { board: Array.isArray(data) ? data[0] : data };
}

export async function getCollabBoardByToken(token: string): Promise<{ id: string; name: string; owner_name: string; member_count: number } | null> {
  const { data } = await supabase.rpc('get_collab_board_by_token', { p_token: token });
  const row = Array.isArray(data) ? data[0] : data;
  return row ?? null;
}

/** Add a link to a board, enriching title/description/image from the URL. */
export async function addCollabLink(boardId: string, userId: string, url: string): Promise<LinkData | null> {
  const { fetchMetadata } = await import('../utils/metadataFetcher');
  let meta: any = {};
  try { meta = await fetchMetadata(url); } catch { /* best-effort */ }
  const row = {
    board_id: boardId,
    url,
    title: meta?.title || url,
    description: meta?.description || '',
    image: meta?.image || '',
    added_by: userId,
  };
  const { data } = await supabase.from('collab_links').insert(row).select('*').single();
  return data ? mapLink(data) : null;
}

export async function deleteCollabLink(id: string): Promise<void> {
  await supabase.from('collab_links').delete().eq('id', id);
}

export async function updateCollabLink(id: string, fields: { title?: string; description?: string; tags?: string[]; notes?: string }): Promise<void> {
  await supabase.from('collab_links').update(fields).eq('id', id);
}

/** Leave (member) or, for the owner, delete the whole board. */
export async function leaveCollabBoard(boardId: string, userId: string): Promise<void> {
  await supabase.from('collab_board_members').delete().eq('board_id', boardId).eq('user_id', userId);
}
export async function deleteCollabBoard(boardId: string): Promise<void> {
  await supabase.from('collab_boards').delete().eq('id', boardId);
}

/** Send a branded invite email via the Resend-backed API. Returns ok:false if
 *  the service isn't configured / errors (caller can fall back to mailto). */
export async function sendTeamInviteEmail(email: string, boardId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('https://www.saveboard.app/api/send-team-invite', {
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
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://saveboard.app';
  return `${base}/team/${token}`;
}

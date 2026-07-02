import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Sends a branded Team-board invite email via Resend.
// Requires env: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY.
// Only a signed-in MEMBER of the board can send invites for it.
const supabase = createClient(
  'https://mchikdltrcbovhdzdhhf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = 'https://www.saveboard.app';
const FROM = 'SaveBoard <invites@saveboard.app>'; // must be a verified Resend domain

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) return res.status(503).json({ error: 'email_not_configured' });

  const { email, boardId } = (req.body ?? {}) as { email?: string; boardId?: string };
  if (!email || !boardId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  // Authenticate the caller and confirm they belong to the board.
  const authToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!authToken) return res.status(401).json({ error: 'Not authenticated' });
  const { data: userData, error: userErr } = await supabase.auth.getUser(authToken);
  const uid = userData?.user?.id;
  if (userErr || !uid) return res.status(401).json({ error: 'Not authenticated' });

  const { data: membership } = await supabase
    .from('board_members').select('board_id').eq('board_id', boardId).eq('user_id', uid).maybeSingle();
  if (!membership) return res.status(403).json({ error: 'Not a member of this board' });

  const { data: board } = await supabase
    .from('boards').select('name, invite_token, owner_id').eq('id', boardId).maybeSingle();
  if (!board) return res.status(404).json({ error: 'Board not found' });

  const inviterName =
    (userData!.user!.user_metadata?.name as string) ||
    (userData!.user!.user_metadata?.full_name as string) ||
    userData!.user!.email || 'A SaveBoard user';
  const joinUrl = `${SITE}/team/${board.invite_token}`;
  const subject = `${inviterName} invited you to "${board.name}" on SaveBoard`;
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
    <div style="font-size:20px;font-weight:800;color:#7C3AED;margin-bottom:16px">SaveBoard</div>
    <p style="font-size:15px;line-height:1.6;margin:0 0 4px"><b>${escapeHtml(inviterName)}</b> invited you to join their team board</p>
    <p style="font-size:22px;font-weight:800;margin:0 0 16px">“${escapeHtml(board.name)}”</p>
    <p style="font-size:14px;line-height:1.6;color:#4B5563;margin:0 0 20px">Save and organise links together — it's free for members.</p>
    <a href="${joinUrl}" style="display:inline-block;background:linear-gradient(90deg,#8B5CF6,#EC4899);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:14px">Join the board →</a>
    <p style="font-size:12px;color:#9CA3AF;margin:22px 0 0">Or paste this link: <br>${joinUrl}</p>
  </div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: email, subject, html }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return res.status(502).json({ error: 'send_failed', detail: detail.slice(0, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(502).json({ error: 'send_failed', detail: String(e?.message || e) });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

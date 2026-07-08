import { useState, useEffect } from 'react';
import { X, Copy, Check, Link2, Loader2, Trash2, RefreshCw, Mail, Send, Users, Globe, UserMinus, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { LinkData } from './LinkCard';
import type { User } from '@supabase/supabase-js';
import type { Board, BoardMember } from '../lib/boards';
import { shareBoard, loadBoardMembers, removeMember, inviteUrl, sendBoardInviteEmail } from '../lib/boards';
import { publicBase } from '../lib/urls';

interface BoardShareModalProps {
  board: Board;
  user: User;
  links: LinkData[];        // links in this board — used for the public snapshot
  onClose: () => void;
  onBoardsChanged?: () => void;  // refetch boards after invite / leave / remove
  onShowUpgrade?: () => void;
}

function deriveOwnerName(user: User): string {
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Someone';
}

const BASE_URL = publicBase();

async function pushSnapshot(links: LinkData[], token: string, ownerName: string, ownerEmail: string) {
  const snapshot = links.map(l => ({
    id: l.id, url: l.url, title: l.title, description: l.description, image: l.image,
    category: l.category, notes: l.notes ?? null, saved_at: l.savedAt.toISOString(),
  }));
  await supabase.from('shared_boards')
    .update({ links_snapshot: snapshot, synced_at: new Date().toISOString(), owner_name: ownerName, owner_email: ownerEmail })
    .eq('token', token);
  return snapshot.length;
}

export function BoardShareModal({ board, user, links, onClose, onBoardsChanged, onShowUpgrade }: BoardShareModalProps) {
  const { t } = useTheme();
  const { tr } = useLanguage();
  const isOwner = board.owner_id === user.id;
  const [tab, setTab] = useState<'invite' | 'public'>('invite');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
          <div className="min-w-0">
            <p className="text-[15px] font-bold truncate" style={{ color: t.textPrimary }}>Share “{board.name}”</p>
            <p className="text-[12px] mt-0.5" style={{ color: t.textMuted }}>{tr('inviteToEdit')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl transition-colors shrink-0"
            style={{ color: t.iconMuted }}
            onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 pt-3 shrink-0">
          {([['invite', 'Invite people', Users], ['public', 'Public link', Globe]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-colors"
              style={tab === id
                ? { background: t.accentBg, color: '#fff' }
                : { background: t.inputBg, color: t.textMuted, border: `1px solid ${t.inputBorder}` }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="px-5 py-5 overflow-y-auto">
          {tab === 'invite'
            ? <InviteTab board={board} user={user} isOwner={isOwner} onClose={onClose} onBoardsChanged={onBoardsChanged} onShowUpgrade={onShowUpgrade} />
            : <PublicTab board={board} user={user} links={links} isOwner={isOwner} />}
        </div>
      </div>
    </div>
  );
}

// ── Invite members (live collaboration) ──────────────────────────────────────
function InviteTab({ board, user, isOwner, onClose, onBoardsChanged, onShowUpgrade }: {
  board: Board; user: User; isOwner: boolean; onClose: () => void; onBoardsChanged?: () => void; onShowUpgrade?: () => void;
}) {
  const { t } = useTheme();
  const [token, setToken] = useState<string | null>(board.invite_token);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { loadBoardMembers(board.id).then(m => { setMembers(m); setLoading(false); }); }, [board.id]);

  // Lazily turn the board into a shared board (assigns an invite token).
  const ensureToken = async (): Promise<string | null> => {
    if (token) return token;
    setPreparing(true); setErr('');
    const { token: tok, error } = await shareBoard(board.id);
    setPreparing(false);
    if (error) {
      if (/share_limit/.test(error)) { onShowUpgrade?.(); setErr('You’ve reached your plan’s shared-board limit.'); }
      else setErr('Could not create an invite link. Please try again.');
      return null;
    }
    setToken(tok ?? null);
    onBoardsChanged?.();
    return tok ?? null;
  };

  const copyInvite = async () => {
    const tok = await ensureToken(); if (!tok) return;
    try { await navigator.clipboard.writeText(inviteUrl(tok)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
  };

  const sendInvite = async () => {
    const email = inviteEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setInviteMsg('Enter a valid email address.'); return; }
    const tok = await ensureToken(); if (!tok) return;
    setInviteMsg('Sending…');
    const { ok } = await sendBoardInviteEmail(email, board.id);
    if (ok) { setInviteMsg(`Invite sent to ${email} ✓`); setInviteEmail(''); return; }
    const subject = `Join my "${board.name}" board on SaveBoard`;
    const body = `Hi!\n\nI'd like you to join my board "${board.name}" on SaveBoard so we can save links together — it's free for members.\n\nJoin here:\n${inviteUrl(tok)}\n\nSee you there!`;
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setInviteMsg(`Opened your mail app to invite ${email}.`);
    setInviteEmail('');
  };

  const kickMember = async (uid: string) => {
    if (!confirm('Remove this member from the board?')) return;
    await removeMember(board.id, uid);
    setMembers(p => p.filter(m => m.user_id !== uid));
    onBoardsChanged?.();
  };

  const leaveBoard = async () => {
    if (!confirm('Leave this board? You’ll lose access to its links.')) return;
    await removeMember(board.id, user.id);
    onBoardsChanged?.();
    onClose();
  };

  return (
    <div className="space-y-4">
      {isOwner ? (
        <>
          {/* Email invite */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5 px-1" style={{ color: t.textMuted }}>{tr('inviteByEmail')}</p>
            <div className="flex items-center gap-2">
              <input type="email" value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setInviteMsg(''); }}
                onKeyDown={e => { if (e.key === 'Enter') sendInvite(); }}
                placeholder="teammate@email.com"
                className="flex-1 px-3 py-2 rounded-xl text-[14px] outline-none"
                style={{ background: t.inputBg, color: t.textPrimary, border: `1px solid ${t.inputBorder}`, fontSize: '16px' }} />
              <button onClick={sendInvite} disabled={preparing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
                style={{ background: t.accentBg }}>
                <Send className="w-4 h-4" />Send
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 gap-2 px-1">
              <button onClick={copyInvite} disabled={preparing}
                className="flex items-center gap-1.5 text-[12px] font-medium disabled:opacity-60" style={{ color: '#7C3AED' }}>
                {preparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link copied' : 'or copy invite link'}
              </button>
              {inviteMsg && <span className="text-[12px] text-right" style={{ color: t.accentBg }}>{inviteMsg}</span>}
            </div>
            {err && <p className="text-[12px] text-red-500 mt-2 px-1">{err}</p>}
          </div>

          {/* Members */}
          <div>
            <p className="text-[11px] font-semibold mb-1.5 px-1" style={{ color: t.textMuted }}>
              {loading ? 'Members' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
            </p>
            {loading ? (
              <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#7C3AED' }} /></div>
            ) : (
              <div className="space-y-1">
                {members.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: t.inputBg }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: t.badgeBg }}>
                      <Users className="w-3 h-3" style={{ color: t.badgeText }} />
                    </div>
                    <span className="flex-1 text-[13px] truncate" style={{ color: t.textSecondary }}>
                      {m.user_id === user.id ? 'You' : 'Member'}{m.role === 'owner' ? ' · owner' : ''}
                    </span>
                    {m.role !== 'owner' && (
                      <button onClick={() => kickMember(m.user_id)} title={tr('removeMember')} className="p-1 rounded-lg" style={{ color: '#EF4444' }}>
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        // Member (not owner) view: leave the board.
        <div className="space-y-3">
          <p className="text-[13px]" style={{ color: t.textMuted }}>
            You’re a member of this shared board. Its owner manages invites.
          </p>
          <button onClick={leaveBoard}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
            style={{ color: '#EF4444', border: `1px solid rgba(239,68,68,0.3)` }}>
            <LogOut className="w-4 h-4" />Leave board
          </button>
        </div>
      )}
    </div>
  );
}

// ── Public read-only snapshot link (anyone with the link can view) ────────────
function PublicTab({ board, user, links, isOwner }: { board: Board; user: User; links: LinkData[]; isOwner: boolean }) {
  const { t } = useTheme();
  const ownerName = deriveOwnerName(user);
  const ownerEmail = user.email ?? '';
  const [token, setToken] = useState<string | null>(null);
  const [linkCount, setLinkCount] = useState(0);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!isOwner) { setLoading(false); return; }
    (async () => {
      const { data: existing } = await supabase.from('shared_boards')
        .select('token').eq('owner_id', user.id).eq('category', board.name).maybeSingle();
      let tok = existing?.token as string | undefined;
      if (!tok) {
        const { data: inserted } = await supabase.from('shared_boards')
          .insert({ owner_id: user.id, category: board.name, links_snapshot: [], synced_at: null, owner_name: ownerName, owner_email: ownerEmail })
          .select('token').single();
        tok = inserted?.token;
      }
      if (tok) { setToken(tok); const c = await pushSnapshot(links, tok, ownerName, ownerEmail); setLinkCount(c); setSyncedAt(new Date()); }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.name, user.id]);

  const shareUrl = token ? `${BASE_URL}/share/${token}` : '';
  const handleCopy = async () => { if (!shareUrl) return; await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleSync = async () => { if (!token) return; setSyncing(true); const c = await pushSnapshot(links, token, ownerName, ownerEmail); setLinkCount(c); setSyncedAt(new Date()); setSyncing(false); };
  const handleRevoke = async () => { if (!token) return; setRevoking(true); await supabase.from('shared_boards').delete().eq('token', token); setToken(null); setRevoking(false); };
  const handleCreateNew = async () => {
    setLoading(true);
    const { data } = await supabase.from('shared_boards')
      .insert({ owner_id: user.id, category: board.name, links_snapshot: [], owner_name: ownerName, owner_email: ownerEmail })
      .select('token').single();
    const tok = data?.token ?? null; setToken(tok);
    if (tok) { const c = await pushSnapshot(links, tok, ownerName, ownerEmail); setLinkCount(c); setSyncedAt(new Date()); }
    setLoading(false);
  };

  if (!isOwner) {
    return <p className="text-[13px] py-2" style={{ color: t.textMuted }}>Only the board’s owner can create a public link.</p>;
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7C3AED' }} /></div>
      ) : token ? (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px]" style={{ color: t.textMuted }}>
              {syncedAt ? `${linkCount} link${linkCount !== 1 ? 's' : ''} · synced just now` : 'Not synced yet'}
            </p>
            <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1 text-[11px] font-medium disabled:opacity-50" style={{ color: '#7C3AED' }}>
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />Sync
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#7C3AED' }} />
            <span className="flex-1 text-[12px] truncate font-mono" style={{ color: t.textSecondary }}>{shareUrl}</span>
          </div>
          <button onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] text-white transition-opacity hover:opacity-90"
            style={{ background: copied ? '#22C55E' : 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={handleRevoke} disabled={revoking}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] transition-colors disabled:opacity-50"
            style={{ color: '#EF4444' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}Revoke link
          </button>
        </>
      ) : (
        <>
          <p className="text-[13px] text-center py-2" style={{ color: t.textMuted }}>{tr('noPublicLink')}</p>
          <button onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            <Link2 className="w-4 h-4" />Create public link
          </button>
        </>
      )}
    </div>
  );
}

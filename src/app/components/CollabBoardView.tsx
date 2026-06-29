import { useEffect, useState } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { Users, Link2, Plus, RefreshCw, Copy, Check, LogOut, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { LinkCard, LinkData } from './LinkCard';
import {
  CollabBoard, CollabMember, loadCollabLinks, loadCollabMembers, addCollabLink,
  deleteCollabLink, updateCollabLink, leaveCollabBoard, deleteCollabBoard, inviteUrl,
} from '../lib/collab';

// Self-contained view for a collaborative ("Team") board. Live-ish: refreshes on
// open and on demand. Reuses LinkCard for rendering; CRUD targets collab_links.
export function CollabBoardView({ board, currentUserId, onExit }: {
  board: CollabBoard;
  currentUserId: string;
  onExit: () => void;
}) {
  const { t } = useTheme();
  const [links, setLinks]     = useState<LinkData[]>([]);
  const [members, setMembers] = useState<CollabMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl]         = useState('');
  const [adding, setAdding]   = useState(false);
  const [copied, setCopied]   = useState(false);
  const isOwner = board.owner_id === currentUserId;

  const refresh = async () => {
    setLoading(true);
    const [l, m] = await Promise.all([loadCollabLinks(board.id), loadCollabMembers(board.id)]);
    setLinks(l); setMembers(m); setLoading(false);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [board.id]);

  const handleAdd = async () => {
    const u = url.trim(); if (!u || adding) return;
    setAdding(true);
    const link = await addCollabLink(board.id, currentUserId, /^https?:\/\//i.test(u) ? u : `https://${u}`);
    if (link) setLinks(p => [link, ...p]);
    setUrl(''); setAdding(false);
  };
  const handleDelete      = async (id: string) => { await deleteCollabLink(id); setLinks(p => p.filter(l => l.id !== id)); };
  const handleUpdateLink  = async (id: string, title: string, description: string) => { await updateCollabLink(id, { title, description }); setLinks(p => p.map(l => l.id === id ? { ...l, title, description } : l)); };
  const handleUpdateTags  = async (id: string, tags: string[]) => { await updateCollabLink(id, { tags }); setLinks(p => p.map(l => l.id === id ? { ...l, tags } : l)); };
  const handleUpdateNotes = async (id: string, notes: string) => { await updateCollabLink(id, { notes }); setLinks(p => p.map(l => l.id === id ? { ...l, notes } : l)); };
  const copyInvite = async () => { try { await navigator.clipboard.writeText(inviteUrl(board.invite_token)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ } };
  const handleLeaveOrDelete = async () => {
    if (isOwner) { if (!confirm('Delete this team board for everyone? This cannot be undone.')) return; await deleteCollabBoard(board.id); }
    else { if (!confirm('Leave this team board?')) return; await leaveCollabBoard(board.id, currentUserId); }
    onExit();
  };

  return (
    <div className="px-4 sm:px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-5 h-5 shrink-0" style={{ color: t.accentBg }} />
          <h2 className="text-[18px] font-bold truncate" style={{ color: t.body }}>{board.name}</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: t.badgeBg, color: t.badgeText }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={copyInvite} className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-xl" style={{ background: t.accentBg, color: '#fff' }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied!' : 'Invite'}
          </button>
          <button onClick={refresh} title="Refresh" className="p-2 rounded-xl" style={{ color: t.controlInactiveColor }}><RefreshCw className="w-4 h-4" /></button>
          <button onClick={handleLeaveOrDelete} title={isOwner ? 'Delete board' : 'Leave board'} className="p-2 rounded-xl" style={{ color: '#EF4444' }}>
            {isOwner ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Add link */}
      <div className="flex gap-2 mb-5">
        <input
          value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Paste a link to add to this board…"
          className="flex-1 px-3.5 py-2.5 rounded-xl text-[14px] outline-none"
          style={{ background: t.cardBg, color: t.body, border: `1px solid ${t.controlContainerBorder}` }}
        />
        <button onClick={handleAdd} disabled={adding || !url.trim()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold disabled:opacity-50" style={{ background: t.accentBg, color: '#fff' }}>
          <Plus className="w-4 h-4" />{adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      {/* Links */}
      {loading ? (
        <div className="text-center py-16 text-[14px]" style={{ color: t.emptySub }}>Loading…</div>
      ) : links.length === 0 ? (
        <div className="text-center py-16">
          <Link2 className="w-7 h-7 mx-auto mb-2" style={{ color: t.emptyIconColor }} />
          <p className="text-[15px] font-semibold" style={{ color: t.emptyTitle }}>No links yet</p>
          <p className="text-[13px] mt-1" style={{ color: t.emptySub }}>Add a link above, or tap <b>Invite</b> so your team can add theirs.</p>
        </div>
      ) : (
        <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 768: 3, 1280: 4 }}>
          <Masonry gutter="14px">
            {links.map(link => (
              <LinkCard key={link.id} link={link}
                onDelete={handleDelete} onUpdateLink={handleUpdateLink}
                onUpdateTags={handleUpdateTags} onUpdateNotes={handleUpdateNotes} />
            ))}
          </Masonry>
        </ResponsiveMasonry>
      )}
    </div>
  );
}

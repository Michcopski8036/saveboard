import { useState, useEffect } from 'react';
import { X, Copy, Check, Link2, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import type { LinkData } from './LinkCard';

interface ShareModalProps {
  category: string;
  userId: string;
  links: LinkData[];
  onClose: () => void;
}

const BASE_URL = window.location.origin;

async function pushSnapshot(links: LinkData[], token: string) {
  const snapshot = links.map(l => ({
    id: l.id,
    url: l.url,
    title: l.title,
    description: l.description,
    image: l.image,
    category: l.category,
    notes: l.notes ?? null,
    saved_at: l.savedAt.toISOString(),
  }));

  await supabase
    .from('shared_boards')
    .update({ links_snapshot: snapshot, synced_at: new Date().toISOString() })
    .eq('token', token);

  return snapshot.length;
}

export function ShareModal({ category, userId, links, onClose }: ShareModalProps) {
  const { t } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [linkCount, setLinkCount] = useState(0);
  const [syncedAt, setSyncedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    (async () => {
      let tok: string;

      const { data: existing } = await supabase
        .from('shared_boards')
        .select('token')
        .eq('owner_id', userId)
        .eq('category', category)
        .maybeSingle();

      if (existing?.token) {
        tok = existing.token;
      } else {
        const { data: inserted } = await supabase
          .from('shared_boards')
          .insert({ owner_id: userId, category, links_snapshot: [], synced_at: null })
          .select('token')
          .single();
        tok = inserted?.token ?? '';
      }

      setToken(tok);
      const count = await pushSnapshot(links, tok);
      setLinkCount(count);
      setSyncedAt(new Date());
      setLoading(false);
    })();
  }, [category, userId]);

  const shareUrl = token ? `${BASE_URL}/share/${token}` : '';

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);
    const count = await pushSnapshot(links, token);
    setLinkCount(count);
    setSyncedAt(new Date());
    setSyncing(false);
  };

  const handleRevoke = async () => {
    if (!token) return;
    setRevoking(true);
    await supabase.from('shared_boards').delete().eq('token', token);
    setToken(null);
    setRevoking(false);
  };

  const handleCreateNew = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('shared_boards')
      .insert({ owner_id: userId, category, links_snapshot: [] })
      .select('token')
      .single();
    const tok = data?.token ?? null;
    setToken(tok);
    if (tok) {
      const count = await pushSnapshot(links, tok);
      setLinkCount(count);
      setSyncedAt(new Date());
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: t.textPrimary }}>Share Board</p>
            <p className="text-[12px] mt-0.5" style={{ color: t.textMuted }}>
              <span className="font-semibold" style={{ color: t.textSecondary }}>{category}</span> — anyone with the link can view
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl transition-colors"
            style={{ color: t.iconMuted }}
            onMouseEnter={e => (e.currentTarget.style.background = t.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#7C3AED' }} />
            </div>
          ) : token ? (
            <>
              {/* Sync status */}
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px]" style={{ color: t.textMuted }}>
                  {syncedAt ? `${linkCount} link${linkCount !== 1 ? 's' : ''} · synced just now` : 'Not synced yet'}
                </p>
                <button onClick={handleSync} disabled={syncing}
                  className="flex items-center gap-1 text-[11px] font-medium disabled:opacity-50"
                  style={{ color: '#7C3AED' }}>
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>

              {/* Link display */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
                <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#7C3AED' }} />
                <span className="flex-1 text-[12px] truncate font-mono" style={{ color: t.textSecondary }}>{shareUrl}</span>
              </div>

              {/* Copy button */}
              <button onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] text-white transition-opacity hover:opacity-90"
                style={{ background: copied ? '#22C55E' : 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>

              {/* Revoke */}
              <button onClick={handleRevoke} disabled={revoking}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] transition-colors disabled:opacity-50"
                style={{ color: '#EF4444' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Revoke link
              </button>
            </>
          ) : (
            <>
              <p className="text-[13px] text-center py-2" style={{ color: t.textMuted }}>No active share link.</p>
              <button onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                <Link2 className="w-4 h-4" />
                Create share link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

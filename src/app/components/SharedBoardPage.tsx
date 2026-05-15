import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { Bookmark, ExternalLink, Clock, Globe, BookmarkPlus, Check, Loader2 } from 'lucide-react';

interface SharedLink {
  id: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  category: string;
  notes?: string;
  saved_at: string;
}

interface SharedBoard {
  token: string;
  category: string;
  links_snapshot: SharedLink[];
  synced_at: string | null;
}

function domain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function SharedBoardPage() {
  const { token } = useParams<{ token: string }>();
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from('shared_boards')
        .select('token, category, links_snapshot, synced_at')
        .eq('token', token)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setBoard(data);
      setLoading(false);
    })();
  }, [token]);

  const handleSaveBoard = async () => {
    if (!user) {
      // Store intent and redirect to main app (auth wall)
      localStorage.setItem('saveboard-pending-import', token!);
      window.location.href = window.location.origin;
      return;
    }

    setSaving(true);
    try {
      const catName = board!.category;

      // Create category if it doesn't exist
      const { data: existingCat } = await supabase
        .from('categories')
        .select('name')
        .eq('name', catName)
        .eq('user_id', user.id)
        .single();

      if (!existingCat) {
        await supabase.from('categories').insert({ name: catName, user_id: user.id });
      }

      // Clone all links into the user's account
      const newLinks = board!.links_snapshot.map(l => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        url: l.url,
        title: l.title,
        description: l.description || '',
        image: l.image || '',
        category: catName,
        created_at: Date.now(),
      }));

      await supabase.from('links').insert(newLinks);
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F7FF' }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm text-gray-400">Loading board…</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F7FF' }}>
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">Board not found</p>
        <p className="text-sm text-gray-400">This link may have been revoked or never existed.</p>
      </div>
    </div>
  );

  const links = board?.links_snapshot ?? [];

  return (
    <div className="min-h-screen" style={{ background: '#F8F7FF' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b" style={{ background: 'rgba(248,247,255,0.92)', backdropFilter: 'blur(12px)', borderColor: '#E5E3F0' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
              <Bookmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-bold" style={{ background: 'linear-gradient(90deg,#7C3AED,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SaveBoard</span>
          </div>
          <a href="https://www.saveboard.app" target="_blank" rel="noopener noreferrer"
            className="text-[12px] px-3 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            Get SaveBoard
          </a>
        </div>
      </header>

      {/* Board title + Save button */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(124,58,237,0.5)' }}>Shared Board</p>
          <h1 className="text-[28px] font-bold text-gray-900">{board?.category}</h1>
          <p className="text-[13px] text-gray-400 mt-1">
            {links.length} save{links.length !== 1 ? 's' : ''}
            {board?.synced_at && <span> · shared {timeAgo(board.synced_at)}</span>}
          </p>
        </div>

        <button
          onClick={handleSaveBoard}
          disabled={saving || saved}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shrink-0 transition-all hover:opacity-90 disabled:opacity-70 mt-2"
          style={{ background: saved ? '#10B981' : 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            <><BookmarkPlus className="w-4 h-4" /> Save Board</>
          )}
        </button>
      </div>

      {/* Links grid */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {links.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No saves in this board yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map(link => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                className="group rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#fff', border: '1px solid #EDE9FE', boxShadow: '0 1px 6px rgba(124,58,237,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.13)'; e.currentTarget.style.borderColor = '#C4B5FD'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 6px rgba(124,58,237,0.06)'; e.currentTarget.style.borderColor = '#EDE9FE'; }}>
                {link.image && link.image !== 'placeholder:memo' && link.image !== 'placeholder:pdf' && (
                  <div className="w-full h-36 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={link.image}
                      alt={link.title}
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 line-clamp-2 leading-snug">{link.title}</p>
                  {link.description && (
                    <p className="text-[12px] text-gray-400 mt-1 line-clamp-2">{link.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-gray-300 shrink-0" />
                    <span className="text-[11px] text-gray-400 truncate">{domain(link.url)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span className="text-[11px] text-gray-400">{timeAgo(link.saved_at)}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity self-end -mt-1" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Sign-in prompt for non-logged-in users */}
      {!user && (
        <div className="fixed bottom-0 inset-x-0 p-4" style={{ background: 'rgba(248,247,255,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E5E3F0' }}>
          <div className="max-w-sm mx-auto text-center">
            <p className="text-[13px] text-gray-500 mb-3">Sign in to save this board to your SaveBoard</p>
            <button
              onClick={handleSaveBoard}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
              Sign in & Save Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

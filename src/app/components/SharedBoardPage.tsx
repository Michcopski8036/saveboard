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
  owner_name?: string;
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
  const [skippedCount, setSkippedCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from('shared_boards')
        .select('token, category, owner_name, links_snapshot, synced_at')
        .eq('token', token)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setBoard(data);
      setLoading(false);
    })();
  }, [token]);

  const handleSaveBoard = async () => {
    if (!user) {
      localStorage.setItem('saveboard-pending-import', token!);
      window.location.href = window.location.origin;
      return;
    }

    setSaving(true);
    try {
      const catName = board!.category;

      const { data: existingCat } = await supabase
        .from('categories')
        .select('name')
        .eq('name', catName)
        .eq('user_id', user.id)
        .single();

      if (!existingCat) {
        await supabase.from('categories').insert({ name: catName, user_id: user.id });
      }

      const { data: existingLinks } = await supabase
        .from('links')
        .select('url')
        .eq('user_id', user.id);
      const existingUrls = new Set((existingLinks ?? []).map((l: any) => l.url));

      const newLinks = board!.links_snapshot
        .filter(l => !existingUrls.has(l.url))
        .map(l => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          url: l.url,
          title: l.title,
          description: l.description || '',
          image: l.image || '',
          category: catName,
          created_at: Date.now(),
        }));

      if (newLinks.length > 0) await supabase.from('links').insert(newLinks);
      setSaved(true);
      setSkippedCount(board!.links_snapshot.length - newLinks.length);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8" style={{ color: '#A259FF' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm text-gray-400">Loading board…</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">Board not found</p>
        <p className="text-sm text-gray-400">This link may have been revoked or never existed.</p>
      </div>
    </div>
  );

  const links = board?.links_snapshot ?? [];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[8px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900">
              Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
            </span>
          </div>
          <a
            href="https://www.saveboard.app"
            className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Get SaveBoard
          </a>
        </div>
      </nav>

      {/* Board header */}
      <div className="max-w-5xl mx-auto px-5 pt-28 pb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-purple-400">Shared Board</p>
          <h1 className="text-[36px] font-extrabold text-gray-900 leading-tight tracking-tight">
            {board?.category}
            {board?.owner_name && (
              <span className="text-gray-400 font-normal text-[22px] ml-3">by {board.owner_name}</span>
            )}
          </h1>
          <p className="text-[14px] text-gray-400 mt-2">
            {links.length} save{links.length !== 1 ? 's' : ''}
            {board?.synced_at && <span> · shared {timeAgo(board.synced_at)}</span>}
          </p>
        </div>

        <button
          onClick={handleSaveBoard}
          disabled={saving || saved}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold text-white shrink-0 mt-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-purple-200"
          style={{ background: saved ? '#10B981' : 'linear-gradient(to right, #A259FF, #FF7262)' }}>
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> {skippedCount > 0 ? `Saved! (${skippedCount} skipped)` : 'Saved!'}</>
          ) : (
            <><BookmarkPlus className="w-4 h-4" /> Save Board</>
          )}
        </button>
      </div>

      {/* Links grid */}
      <div className="max-w-5xl mx-auto px-5 pb-32">
        {links.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-[15px]">No saves in this board yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map(link => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                className="group rounded-2xl overflow-hidden flex flex-col border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                {link.image && link.image !== 'placeholder:memo' && link.image !== 'placeholder:pdf' && (
                  <div className="w-full h-36 shrink-0 overflow-hidden bg-gray-50">
                    <img
                      src={link.image}
                      alt={link.title}
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 line-clamp-2 leading-snug">{link.title}</p>
                    {link.description && (
                      <p className="text-[12px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{link.description}</p>
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
                </div>
                <div className="px-4 pb-3 flex justify-end">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA for guests */}
      {!user && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-4">
          <div className="max-w-sm mx-auto text-center">
            <p className="text-[13px] text-gray-500 mb-3">Sign in to save this board to your SaveBoard</p>
            <button
              onClick={handleSaveBoard}
              className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
              style={{ background: 'linear-gradient(to right, #A259FF, #FF7262)' }}>
              Sign in &amp; Save Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

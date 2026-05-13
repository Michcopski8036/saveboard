import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { Bookmark, ExternalLink, Clock, Globe } from 'lucide-react';
import type { LinkData } from './LinkCard';

interface SharedBoard {
  token: string;
  owner_id: string;
  category: string;
  created_at: string;
}

function domain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function SharedBoardPage() {
  const { token } = useParams<{ token: string }>();
  const [board, setBoard] = useState<SharedBoard | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: boardData, error: boardErr } = await supabase
        .from('shared_boards')
        .select('*')
        .eq('token', token)
        .single();

      if (boardErr || !boardData) { setNotFound(true); setLoading(false); return; }
      setBoard(boardData);

      const { data: linksData } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', boardData.owner_id)
        .eq('category', boardData.category)
        .order('saved_at', { ascending: false });

      setLinks((linksData ?? []).map((l: any) => ({
        ...l,
        savedAt: new Date(l.saved_at),
      })));
      setLoading(false);
    })();
  }, [token]);

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

  return (
    <div className="min-h-screen" style={{ background: '#F8F7FF' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b" style={{ background: 'rgba(248,247,255,0.92)', backdropFilter: 'blur(12px)', borderColor: '#E5E3F0' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
              <Bookmark className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-bold" style={{ background: 'linear-gradient(90deg,#7C3AED,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LinkBoard</span>
          </div>
          <a href="https://link-board-seven.vercel.app" target="_blank" rel="noopener noreferrer"
            className="text-[12px] px-3 py-1.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
            Get LinkBoard
          </a>
        </div>
      </header>

      {/* Board title */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(124,58,237,0.5)' }}>Shared Board</p>
        <h1 className="text-[28px] font-bold text-gray-900">{board?.category}</h1>
        <p className="text-[13px] text-gray-400 mt-1">{links.length} link{links.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Links grid */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {links.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No links in this board yet.</div>
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
                    <img src={link.image} alt={link.title} className="w-full h-full object-cover" crossOrigin="anonymous" />
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
                    <span className="text-[11px] text-gray-400">{timeAgo(link.savedAt)}</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity self-end -mt-1" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

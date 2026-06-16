import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { Bookmark, ExternalLink, Clock, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { PlatformPlaceholder, isPlaceholder, getPlatformFromPlaceholder, detectPlatformFromUrl } from './PlatformPlaceholder';

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
  owner_email?: string;
  links_snapshot: SharedLink[];
  synced_at: string | null;
}

// Keep in sync with FREE_LIMITS.links in UpgradePage.tsx (not imported here to
// keep the public share-page bundle from pulling in the upgrade UI).
const FREE_SAVE_LIMIT = 30;

// Real links dedup by URL; memos/notes share url '#', so fall back to title.
const importDedupKey = (l: { url?: string; title?: string }): string => {
  const u = (l.url ?? '').trim();
  return u && u !== '#' ? `u:${u}` : `t:${(l.title ?? '').trim().toLowerCase()}`;
};

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
  const [result, setResult] = useState<{ added: number; skippedExisting: number; limited: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .rpc('get_shared_board', { p_token: token })
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setBoard(data);
      setLoading(false);

      // Record view + bump the counter in one definer RPC (fire and forget).
      // Viewer id/email are derived server-side from the JWT, so they can't be
      // spoofed by the client; this also avoids a second round trip.
      supabase.rpc('record_board_view', { p_token: token }).then(() => {});
    })();
  }, [token]);

  const handleSaveBoard = async () => {
    if (!user) {
      localStorage.setItem('saveboard-pending-import', token!);
      window.location.href = `${window.location.origin}?auth=1`;
      return;
    }

    setSaving(true);
    try {
      const catName = board!.category;

      // Ensure the target board exists, and in parallel gather what we need to
      // dedup (links already in THIS board), enforce the Free saves limit
      // (total link count), and detect the plan.
      const [{ data: existingCat }, { data: boardLinks }, { count: totalCount }, { data: sub }] = await Promise.all([
        supabase.from('categories').select('name').eq('name', catName).eq('user_id', user.id).maybeSingle(),
        supabase.from('links').select('url, title').eq('user_id', user.id).eq('category', catName),
        supabase.from('links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle(),
      ]);

      if (!existingCat) {
        await supabase.from('categories').insert({ name: catName, user_id: user.id });
      }

      const isPro = sub?.status === 'active' && (sub?.plan === 'pro' || sub?.plan === 'team');

      // Dedup within the target board only (so a link already saved in a
      // different board still gets copied here), keyed so memos don't collapse.
      const seen = new Set((boardLinks ?? []).map((l: any) => importDedupKey(l)));
      const candidates = board!.links_snapshot.filter(l => {
        const k = importDedupKey(l);
        if (seen.has(k)) return false;
        seen.add(k);  // also dedup duplicates within the snapshot itself
        return true;
      });
      const skippedExisting = board!.links_snapshot.length - candidates.length;

      // Respect the Free plan saves limit.
      let toImport = candidates;
      let limited = 0;
      if (!isPro) {
        const remaining = Math.max(0, FREE_SAVE_LIMIT - (totalCount ?? 0));
        if (candidates.length > remaining) {
          toImport = candidates.slice(0, remaining);
          limited = candidates.length - remaining;
        }
      }

      const newLinks = toImport.map(l => ({
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
      setResult({ added: newLinks.length, skippedExisting, limited });
      setSaved(true);

      // Clean all-added result → auto-redirect into the app. Otherwise stay so
      // the user can read the summary (what was skipped / limited) and choose.
      if (skippedExisting === 0 && limited === 0) {
        setTimeout(() => {
          window.location.href = `${window.location.origin}?board=${encodeURIComponent(catName)}`;
        }, 1200);
      }
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
        </div>
      </nav>

      {/* Board header */}
      <div className="max-w-5xl mx-auto px-5 pt-28 pb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-purple-400">Shared Board</p>
          <h1 className="text-[36px] font-extrabold text-gray-900 leading-tight tracking-tight">
            {board?.category}
          </h1>
          <p className="text-[14px] text-gray-400 mt-1 mb-4">
            {links.length} save{links.length !== 1 ? 's' : ''}
            {board?.synced_at && <span> · shared {timeAgo(board.synced_at)}</span>}
          </p>
          {/* Shared by */}
          {(board?.owner_name || board?.owner_email) && (
            <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #A259FF, #FF7262)' }}>
                {(board.owner_name || board.owner_email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 leading-none mb-0.5">Shared by</p>
                <p className="text-[13px] font-semibold text-gray-800 leading-none">
                  {board.owner_name || board.owner_email?.split('@')[0]}
                </p>
              </div>
            </div>
          )}
        </div>

        {user && (
          saved ? (
            <a
              href={`${window.location.origin}?board=${encodeURIComponent(board!.category)}`}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold text-white shrink-0 mt-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
              style={{ background: '#6ECA97', boxShadow: '0 8px 24px rgba(110,202,151,0.30)' }}>
              <Check className="w-4 h-4" />
              Go to my board
            </a>
          ) : (
            <button
              onClick={handleSaveBoard}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold text-white shrink-0 mt-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-purple-200"
              style={{ background: 'linear-gradient(to right, #A259FF, #FF7262)' }}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><BookmarkPlus className="w-4 h-4" /> Save to My Board</>
              )}
            </button>
          )
        )}
      </div>

      {/* Save result summary */}
      {saved && result && (result.skippedExisting > 0 || result.limited > 0) && (
        <div className="max-w-5xl mx-auto px-5 -mt-2 mb-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-[14px] font-semibold text-gray-900 mb-2">
              Saved to your “{board!.category}” board
            </p>
            <ul className="space-y-1 text-[13px]">
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {result.added} new {result.added === 1 ? 'item' : 'items'} added
              </li>
              {result.skippedExisting > 0 && (
                <li className="text-gray-400 pl-[22px]">
                  {result.skippedExisting} already in this board — skipped
                </li>
              )}
              {result.limited > 0 && (
                <li className="text-amber-600 pl-[22px]">
                  {result.limited} not added — Free plan limit ({FREE_SAVE_LIMIT} saves) reached
                </li>
              )}
            </ul>
            {result.limited > 0 && (
              <a
                href={`${window.location.origin}?board=${encodeURIComponent(board!.category)}`}
                className="inline-block mt-3 text-[13px] font-semibold text-purple-600 hover:text-purple-700">
                Upgrade for more saves →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Links grid */}
      <div className="max-w-5xl mx-auto px-5 pb-32">
        {links.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-[15px]">No saves in this board yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map(link => {
              const isMemo = link.image === 'placeholder:memo';
              const isPdf  = link.image === 'placeholder:pdf';
              const dom    = isMemo ? 'Note' : isPdf ? 'PDF' : domain(link.url);
              const hasPlaceholder = isPlaceholder(link.image ?? '');
              const platform = hasPlaceholder
                ? getPlatformFromPlaceholder(link.image!)
                : (!link.image ? detectPlatformFromUrl(link.url) : null);
              const showPlaceholder = hasPlaceholder || !link.image;
              const showImage = !showPlaceholder && !isMemo && !isPdf;

              return (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="group rounded-2xl overflow-hidden flex flex-col border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">

                  {/* Thumbnail */}
                  {showPlaceholder ? (
                    <PlatformPlaceholder
                      platform={platform!}
                      domain={dom}
                      className="w-full aspect-video"
                    />
                  ) : showImage ? (
                    <div className="w-full aspect-video shrink-0 overflow-hidden bg-gray-50">
                      <img
                        src={link.image!}
                        alt={link.title}
                        className="w-full h-full object-cover"
                        onError={e => {
                          const wrapper = e.currentTarget.closest('.aspect-video') as HTMLElement | null;
                          if (wrapper) wrapper.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : null}

                  {/* Info */}
                  <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-2">
                    {/* Favicon + domain + time */}
                    <div className="flex items-center gap-1.5">
                      {!isMemo && !isPdf && (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${dom}&sz=32`}
                          alt=""
                          className="w-3.5 h-3.5 rounded-sm object-contain shrink-0 opacity-60"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <span className="text-[10px] text-gray-400 truncate flex-1">{dom}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-[10px] text-gray-400">{timeAgo(link.saved_at)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">{link.title}</p>

                    {/* Description */}
                    {link.description && (
                      link.description.trimStart().startsWith('<')
                        ? <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed rich-card-preview" dangerouslySetInnerHTML={{ __html: link.description }} />
                        : <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{link.description.replace(/^\[sz:(sm|md|lg)\]/, '')}</p>
                    )}

                    {/* External link icon on hover */}
                    <div className="flex justify-end mt-auto pt-1">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA for guests */}
      {!user && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
          <div className="max-w-sm mx-auto">
            {saved ? (
              <a
                href={`${window.location.origin}?board=${encodeURIComponent(board!.category)}`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-lg"
                style={{ background: '#6ECA97', boxShadow: '0 8px 24px rgba(110,202,151,0.30)' }}>
                <Check className="w-4 h-4" />
                Go to my board
              </a>
            ) : (
              <button
                onClick={handleSaveBoard}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-purple-200"
                style={{ background: 'linear-gradient(to right, #A259FF, #FF7262)' }}>
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4" /> Sign in &amp; Save to My Board</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { createBoard } from '../lib/boards';
import { Bookmark, ExternalLink, Clock, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { PlatformPlaceholder, isPlaceholder, getPlatformFromPlaceholder, detectPlatformFromUrl } from './PlatformPlaceholder';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { useLanguage } from '../context/LanguageContext';
import { sanitizeHtml } from '../lib/sanitize';

// Boards published by SaveBoard Guides carry both languages, because one board
// serves both the English and the Korean version of a guide post. The `_ko`
// fields are absent on every board a normal user shares, so they fall back.
interface SharedLink {
  id: string;
  url: string;
  title: string;
  title_ko?: string;
  description?: string;
  description_ko?: string;
  image?: string;
  category: string;
  notes?: string;
  saved_at: string;
}

interface SharedBoard {
  token: string;
  category: string;
  category_ko?: string;
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

function timeAgo(iso: string, ko = false): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return ko ? '방금' : 'just now';
  if (s < 3600) { const m = Math.floor(s / 60); return ko ? `${m}분 전` : `${m}m ago`; }
  if (s < 86400) { const h = Math.floor(s / 3600); return ko ? `${h}시간 전` : `${h}h ago`; }
  const d = Math.floor(s / 86400); return ko ? `${d}일 전` : `${d}d ago`;
}

// In-app browsers (KakaoTalk, Line, Instagram, Facebook…) block Google OAuth
// ("disallowed_useragent") and don't persist the login session, so sign-in can
// never complete there. Detect them so we can route the user to the app/browser.
function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || '';
  return /KAKAOTALK|Line\/|NAVER|DaumApps|FBAN|FBAV|Instagram|Threads|Snapchat|musical_ly/i.test(ua);
}
// Break out of the in-app browser into the real system browser.
function openExternalBrowser(url: string) {
  const ua = navigator.userAgent || '';
  if (/KAKAOTALK/i.test(ua)) {
    window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
  } else if (/Line\//i.test(ua)) {
    window.location.href = url + (url.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
  } else if (/Android/i.test(ua)) {
    window.location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  } else {
    alert('Open this page in Safari or Chrome to sign in:\nTap the ⋯ / share menu → "Open in browser".');
  }
}

export function SharedBoardPage() {
  const { tr, language } = useLanguage();
  const ko = language === 'ko';
  // Korean copy when the app is in Korean AND this board carries it; otherwise
  // the original field, so ordinary shared boards are untouched.
  const pick = (en?: string, koText?: string) => (ko && koText ? koText : en) ?? '';
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
      setBoard(data as SharedBoard);
      setLoading(false);

      // Record view + bump the counter in one definer RPC (fire and forget).
      // Viewer id/email are derived server-side from the JWT, so they can't be
      // spoofed by the client; this also avoids a second round trip.
      supabase.rpc('record_board_view', { p_token: token }).then(() => {});
    })();
  }, [token]);

  const handleSaveBoard = async () => {
    if (!user) {
      if (isInAppBrowser()) {
        // Google sign-in is blocked in in-app browsers; open the board in the
        // SaveBoard app (recipient is already signed in there) so the save works.
        window.location.href = `app.saveboard.saveboard://share/${token}`;
        return;
      }
      localStorage.setItem('saveboard-pending-import', token!);
      window.location.href = `${window.location.origin}?auth=1`;
      return;
    }

    setSaving(true);
    try {
      const catName = pick(board!.category, board!.category_ko);

      // Ensure the target board exists first — its id is what we dedup against.
      const { data: existingBoard } = await supabase.from('boards').select('id').eq('name', catName).eq('owner_id', user.id).maybeSingle();
      let importBoardId = existingBoard?.id as string | undefined;
      if (!importBoardId) {
        const { board: created } = await createBoard(catName);
        importBoardId = created?.id;
      }

      // Dedup (links already in THIS board), the Free-plan saves limit (total
      // link count), and the plan — in parallel.
      const [{ data: boardLinks }, { count: totalCount }, { data: sub }] = await Promise.all([
        supabase.from('links').select('url, title').eq('user_id', user.id).eq('board_id', importBoardId ?? ''),
        supabase.from('links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle(),
      ]);

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
        title: pick(l.title, l.title_ko),
        description: pick(l.description, l.description_ko),
        image: l.image || '',
        board_id: importBoardId ?? null,
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
        <p className="text-sm text-gray-400">{ko ? '보드 불러오는 중…' : 'Loading board…'}</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-800 mb-2">{tr('boardNotFound')}</p>
        <p className="text-sm text-gray-400">{tr('boardRevoked')}</p>
      </div>
    </div>
  );

  const links = board?.links_snapshot ?? [];

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-purple-400">{tr('sharedBoardTitle')}</p>
          <h1 className="text-[36px] font-extrabold text-gray-900 leading-tight tracking-tight">
            {pick(board?.category, board?.category_ko)}
          </h1>
          <p className="text-[14px] text-gray-400 mt-1 mb-4">
            {links.length} save{links.length !== 1 ? 's' : ''}
            {board?.synced_at && <span> · {ko ? '공유됨 ' : 'shared '}{timeAgo(board.synced_at, ko)}</span>}
          </p>
          {/* Shared by */}
          {(board?.owner_name || board?.owner_email) && (
            <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #A259FF, #FF7262)' }}>
                {(board.owner_name || board.owner_email || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] text-gray-400 leading-none mb-0.5">{tr('sharedBy')}</p>
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
                <><Loader2 className="w-4 h-4 animate-spin" /> {ko ? '저장 중…' : 'Saving…'}</>
              ) : (
                <><BookmarkPlus className="w-4 h-4" /> {ko ? '내 보드에 저장' : 'Save to My Board'}</>
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
              {ko ? `“${pick(board!.category, board!.category_ko)}” 보드에 저장됨` : `Saved to your “${board!.category}” board`}
            </p>
            <ul className="space-y-1 text-[13px]">
              <li className="flex items-center gap-2 text-gray-600">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                {ko ? `새 항목 ${result.added}개 추가됨` : `${result.added} new ${result.added === 1 ? 'item' : 'items'} added`}
              </li>
              {result.skippedExisting > 0 && (
                <li className="text-gray-400 pl-[22px]">
                  {ko ? `${result.skippedExisting}개는 이미 이 보드에 있어 건너뜀` : `${result.skippedExisting} already in this board — skipped`}
                </li>
              )}
              {result.limited > 0 && (
                <li className="text-amber-600 pl-[22px]">
                  {ko ? `${result.limited}개는 추가 안 됨 — 무료 플랜 한도(${FREE_SAVE_LIMIT}개) 도달` : `${result.limited} not added — Free plan limit (${FREE_SAVE_LIMIT} saves) reached`}
                </li>
              )}
            </ul>
            {result.limited > 0 && (
              <a
                href={`${window.location.origin}?board=${encodeURIComponent(board!.category)}`}
                className="inline-block mt-3 text-[13px] font-semibold text-purple-600 hover:text-purple-700">
                {ko ? '더 저장하려면 업그레이드 →' : 'Upgrade for more saves →'}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Links grid */}
      <div className="max-w-5xl mx-auto px-5 pb-32">
        {links.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-[15px]">{tr('noSavesYet')}</div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 1024: 3 }}>
            <Masonry gutter="16px">
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
              const title = pick(link.title, link.title_ko);
              const description = pick(link.description, link.description_ko);

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
                    <img
                      src={link.image!}
                      alt={title}
                      loading="lazy"
                      className="w-full h-auto block bg-gray-50"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
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
                        <span className="text-[10px] text-gray-400">{timeAgo(link.saved_at, ko)}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">{title}</p>

                    {/* Description */}
                    {description && (
                      description.trimStart().startsWith('<')
                        ? <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed rich-card-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
                        : <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{description.replace(/^\[sz:(sm|md|lg)\]/, '')}</p>
                    )}

                    {/* External link icon on hover */}
                    <div className="flex justify-end mt-auto pt-1">
                      <ExternalLink className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </a>
              );
            })}
            </Masonry>
          </ResponsiveMasonry>
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
            ) : isInAppBrowser() ? (
              <div className="space-y-2">
                <p className="text-[12px] text-center text-gray-500 leading-snug">
                  {ko ? '인앱 브라우저(카카오톡 등)에서는 로그인이 차단돼요. 저장하려면 앱이나 브라우저에서 열어주세요.' : 'Sign-in is blocked in in-app browsers (KakaoTalk, etc.). Open it in the app or your browser to save.'}
                </p>
                <button
                  onClick={() => { window.location.href = `app.saveboard.saveboard://share/${token}`; }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold text-white active:scale-95 transition-all shadow-lg shadow-purple-200"
                  style={{ background: 'linear-gradient(to right, #A259FF, #FF7262)' }}>
                  <BookmarkPlus className="w-4 h-4" /> Open in SaveBoard app
                </button>
                <button
                  onClick={() => openExternalBrowser(window.location.href)}
                  className="w-full py-2.5 rounded-2xl text-[13px] font-semibold text-gray-700 bg-gray-100 active:scale-95 transition-all">
                  Open in browser
                </button>
              </div>
            ) : (
              <button
                onClick={handleSaveBoard}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[14px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-purple-200"
                style={{ background: 'linear-gradient(to right, #A259FF, #FF7262)' }}>
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {ko ? '저장 중…' : 'Saving…'}</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4" /> {ko ? '로그인 후 내 보드에 저장' : 'Sign in & Save to My Board'}</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

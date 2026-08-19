import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { getBoardByToken, getBoardInvitePreview, isBoardMemberSelf, joinBoard, InvitePreviewLink } from '../lib/boards';
import { Users, Loader2, BookmarkPlus, Bookmark, ExternalLink, Clock, ArrowRight } from 'lucide-react';
import { PlatformPlaceholder, isPlaceholder, getPlatformFromPlaceholder, detectPlatformFromUrl } from './PlatformPlaceholder';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { useLanguage } from '../context/LanguageContext';
import { sanitizeHtml } from '../lib/sanitize';
import { isInAppBrowser, openExternalBrowser } from '../lib/browserEnv';

function domain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function timeAgo(ms: number, ko = false): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return ko ? '방금' : 'just now';
  if (s < 3600) { const m = Math.floor(s / 60); return ko ? `${m}분 전` : `${m}m ago`; }
  if (s < 86400) { const h = Math.floor(s / 3600); return ko ? `${h}시간 전` : `${h}h ago`; }
  const d = Math.floor(s / 86400); return ko ? `${d}일 전` : `${d}d ago`;
}

// Public invite landing for a shared board: /team/<invite_token>.
// If the preview RPC is live it renders the board's actual contents with ONE
// join CTA (Milanote-style "see it, then save it" — the viewer→member bridge);
// otherwise it falls back to the original meta-only join card, so the client
// can ship before the migration is applied.
export function JoinTeamBoard() {
  const { tr, language } = useLanguage();
  const ko = language === 'ko';
  const { token } = useParams();
  const [board, setBoard]     = useState<{ id: string; name: string; owner_name: string; member_count: number } | null>(null);
  const [preview, setPreview] = useState<InvitePreviewLink[] | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError]     = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [inAppBlocked, setInAppBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, b, pv] = await Promise.all([
        supabase.auth.getUser(),
        getBoardByToken(token!),
        getBoardInvitePreview(token!),
      ]);
      setSignedIn(!!user);
      if (!b) setError('This invite link is invalid or has been removed.');
      else {
        setBoard(b);
        setPreview(pv);
        if (user) setIsMember(await isBoardMemberSelf(b.id));
      }
      setLoading(false);
    })();
  }, [token]);

  const handleJoin = async () => {
    if (!signedIn) {
      if (isInAppBrowser()) { setInAppBlocked(true); return; }
      // sign in first, then auto-join (App reads this on load)
      localStorage.setItem('saveboard-pending-team', token!);
      window.location.href = '/?auth=1';
      return;
    }
    setJoining(true);
    const { board: joined, error } = await joinBoard(token!);
    if (error || !joined) {
      setError(/limit_members|full/i.test(error || '')
        ? (ko ? '이 보드는 가득 찼어요 — 멤버 한도에 도달했습니다.' : 'This board is full — it has reached its member limit.')
        : (ko ? '지금은 참여할 수 없어요. 다시 시도해 주세요.' : 'Could not join right now. Please try again.'));
      setJoining(false);
      return;
    }
    window.location.href = `/?team=${joined.id}`;
  };

  // ── The single conversion CTA, shared by both layouts ──────────────────────
  const joinCta = () => (
    isMember ? (
      <a href={`/?team=${board!.id}`}
        className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-lg`}
        style={{ background: '#6ECA97', boxShadow: '0 8px 24px rgba(110,202,151,0.30)' }}>
        <ArrowRight className="w-4 h-4" />
        {ko ? '보드 열기 — 이미 참여 중' : 'Open board — you’re a member'}
      </a>
    ) : inAppBlocked ? (
      <div className="space-y-2 w-full">
        <p className="text-[12px] text-center text-gray-500 leading-snug">
          {ko ? '인앱 브라우저(카카오톡 등)에서는 로그인이 차단돼요. 참여하려면 브라우저에서 열어주세요.' : 'Sign-in is blocked in in-app browsers (KakaoTalk, etc.). Open it in your browser to join.'}
        </p>
        <button onClick={() => openExternalBrowser(window.location.href)}
          className="w-full py-2.5 rounded-2xl text-[13px] font-semibold text-gray-700 bg-gray-100 active:scale-95 transition-all">
          {ko ? '브라우저에서 열기' : 'Open in browser'}
        </button>
      </div>
    ) : (
      <button onClick={handleJoin} disabled={joining}
        className={"w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 shadow-lg shadow-purple-200"}
        style={{ background: 'linear-gradient(to right, #A259FF, #FF7262)' }}>
        {joining
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {ko ? '참여 중…' : 'Joining…'}</>
          : <><BookmarkPlus className="w-4 h-4" /> {signedIn ? (ko ? '보드 참여하기' : 'Join this board') : (ko ? '로그인하고 참여' : 'Sign in to join')}</>}
      </button>
    )
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-7 h-7 animate-spin text-gray-300" />
    </div>
  );

  if (error && !board) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-7 text-center">
        <p className="text-[15px] font-semibold text-gray-900">{tr('inviteUnavailable')}</p>
        <p className="text-[13px] text-gray-500 mt-1.5">{error}</p>
        <a href="/" className="inline-block mt-5 text-[13px] font-semibold text-violet-600">Go to SaveBoard →</a>
      </div>
    </div>
  );

  if (!board) return null;

  // ── Fallback: preview RPC not available yet → the original join card ───────
  if (preview === null) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-7 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6 text-violet-600" />
        </div>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-violet-500 mb-1">{tr('teamBoardInvite')}</p>
        <h1 className="text-[20px] font-bold text-gray-900">{board.name}</h1>
        <p className="text-[13px] text-gray-500 mt-1.5">
          {board.owner_name ? <><b>{board.owner_name}</b>{ko ? '님이 공유' : ' shared'} · </> : null}{ko ? `멤버 ${board.member_count}명` : `${board.member_count} member${board.member_count !== 1 ? 's' : ''}`}
        </p>
        <p className="text-[13px] text-gray-600 mt-4">{ko ? '함께 보고 링크를 추가하려면 참여하세요 — 멤버는 무료예요.' : "Join to view and add links together — it's free for members."}</p>
        {error && <p className="text-[12px] text-red-500 mt-3">{error}</p>}
        <div className="mt-5">{joinCta()}</div>
      </div>
    </div>
  );

  // ── Full preview: the board's contents + one sticky join CTA ───────────────
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
      <div className="max-w-5xl mx-auto px-5 pt-28 pb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-2 text-violet-500">{tr('teamBoardInvite')}</p>
        <h1 className="text-[36px] font-extrabold text-gray-900 leading-tight tracking-tight">{board.name}</h1>
        <p className="text-[14px] text-gray-400 mt-1 mb-4">
          {board.owner_name ? <><b className="text-gray-600">{board.owner_name}</b>{ko ? '님이 공유' : ' shared'} · </> : null}
          {ko ? `멤버 ${board.member_count}명` : `${board.member_count} member${board.member_count !== 1 ? 's' : ''}`}
          {' · '}
          {ko ? `${preview.length}개 저장됨` : `${preview.length} save${preview.length !== 1 ? 's' : ''}`}
        </p>
        {!isMember && (
          <p className="text-[13px] text-gray-500">
            {ko ? '함께 보고 링크를 추가하려면 참여하세요 — 멤버는 무료예요.' : "Join to view and add links together — it's free for members."}
          </p>
        )}
      </div>

      {/* Links grid (read-only preview) */}
      <div className="max-w-5xl mx-auto px-5 pb-36">
        {preview.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-[15px]">{tr('noSavesYet')}</div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 1024: 3 }}>
            <Masonry gutter="16px">
            {preview.map(link => {
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
                    <PlatformPlaceholder platform={platform!} domain={dom} className="w-full aspect-video" />
                  ) : showImage ? (
                    <img src={link.image!} alt={link.title} loading="lazy"
                      className="w-full h-auto block bg-gray-50"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : null}

                  {/* Info */}
                  <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-2">
                    <div className="flex items-center gap-1.5">
                      {!isMemo && !isPdf && (
                        <img src={`https://www.google.com/s2/favicons?domain=${dom}&sz=32`} alt=""
                          className="w-3.5 h-3.5 rounded-sm object-contain shrink-0 opacity-60"
                          onError={e => { e.currentTarget.style.display = 'none'; }} />
                      )}
                      <span className="text-[10px] text-gray-400 truncate flex-1">{dom}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-[10px] text-gray-400">{timeAgo(link.created_at, ko)}</span>
                      </div>
                    </div>

                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">{link.title}</p>

                    {link.description && (
                      link.description.trimStart().startsWith('<')
                        ? <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed rich-card-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(link.description) }} />
                        : <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{link.description.replace(/^\[sz:(sm|md|lg)\]/, '')}</p>
                    )}

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

      {/* Sticky join CTA — the one action on this page */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-sm mx-auto">
          {error && <p className="text-[12px] text-center text-red-500 mb-2">{error}</p>}
          {joinCta()}
        </div>
      </div>
    </div>
  );
}

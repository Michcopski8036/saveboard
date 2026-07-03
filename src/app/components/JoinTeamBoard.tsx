import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { supabase } from '../lib/supabase';
import { getBoardByToken, joinBoard } from '../lib/boards';
import { Users, Loader2, BookmarkPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Public invite landing for a Team board: /team/<invite_token>
export function JoinTeamBoard() {
  const { tr, language } = useLanguage();
  const ko = language === 'ko';
  const { token } = useParams();
  const [board, setBoard]     = useState<{ id: string; name: string; owner_name: string; member_count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError]     = useState('');
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSignedIn(!!user);
      const b = await getBoardByToken(token!);
      if (!b) setError('This invite link is invalid or has been removed.');
      else setBoard(b);
      setLoading(false);
    })();
  }, [token]);

  const handleJoin = async () => {
    if (!signedIn) {
      // sign in first, then auto-join (App reads this on load)
      localStorage.setItem('saveboard-pending-team', token!);
      window.location.href = '/?auth=1';
      return;
    }
    setJoining(true);
    const { board: joined, error } = await joinBoard(token!);
    if (error || !joined) {
      setError(/limit_members|full/i.test(error || '') ? 'This board is full — it has reached its member limit.' : 'Could not join right now. Please try again.');
      setJoining(false);
      return;
    }
    window.location.href = `/?team=${joined.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-gray-100 p-7 text-center">
        {loading ? (
          <Loader2 className="w-7 h-7 animate-spin text-gray-300 mx-auto" />
        ) : error && !board ? (
          <>
            <p className="text-[15px] font-semibold text-gray-900">{tr('inviteUnavailable')}</p>
            <p className="text-[13px] text-gray-500 mt-1.5">{error}</p>
            <a href="/" className="inline-block mt-5 text-[13px] font-semibold text-violet-600">Go to SaveBoard →</a>
          </>
        ) : board ? (
          <>
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
            <button onClick={handleJoin} disabled={joining}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-[15px] py-3 rounded-2xl disabled:opacity-60">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
              {signedIn ? (joining ? (ko ? '참여 중…' : 'Joining…') : (ko ? '보드 참여' : 'Join board')) : (ko ? '로그인하고 참여' : 'Sign in to join')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

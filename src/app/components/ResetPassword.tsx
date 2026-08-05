import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';

const COPY = {
  en: {
    title: 'Set a new password',
    sub: 'Choose a new password for your SaveBoard account.',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    hint: 'Use 8+ characters with uppercase, lowercase, a number, and a symbol.',
    save: 'Save new password',
    saving: 'Saving...',
    mismatch: "Those two passwords don't match.",
    checking: 'Checking your link...',
    invalid: 'This reset link has expired or has already been used. Ask for a new one from the sign-in screen.',
    done: 'Password updated. You are signed in.',
    goToApp: 'Go to SaveBoard',
  },
  ko: {
    title: '새 비밀번호 설정',
    sub: 'SaveBoard 계정에 사용할 새 비밀번호를 정해주세요.',
    newPassword: '새 비밀번호',
    confirmPassword: '새 비밀번호 확인',
    hint: '대문자·소문자·숫자·기호를 포함해 8자 이상 사용하세요.',
    save: '새 비밀번호 저장',
    saving: '저장 중...',
    mismatch: '두 비밀번호가 서로 달라요.',
    checking: '링크 확인 중...',
    invalid: '이 재설정 링크는 만료됐거나 이미 사용됐어요. 로그인 화면에서 다시 요청해주세요.',
    done: '비밀번호가 변경됐어요. 로그인된 상태입니다.',
    goToApp: 'SaveBoard로 이동',
  },
} as const;

/**
 * Where a password-recovery email lands.
 *
 * supabase-js consumes the token in the URL on load and emits PASSWORD_RECOVERY,
 * which leaves a short-lived session that is allowed to do exactly one thing:
 * set a new password. So the check here is simply whether we ended up with a
 * session — if the link was stale or already used, there won't be one.
 */
export function ResetPassword() {
  const { language } = useLanguage();
  const c = COPY[language as keyof typeof COPY] ?? COPY.en;
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Reset password — SaveBoard';
    let settled = false;
    const finish = (s: 'ready' | 'invalid') => { if (!settled) { settled = true; setState(s); } };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) finish('ready');
    });
    // The event fires while the token is still being exchanged, so also check
    // directly — and give the exchange a moment before calling the link dead.
    supabase.auth.getSession().then(({ data }) => { if (data.session) finish('ready'); });
    const t = setTimeout(() => finish('invalid'), 4000);

    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const handleSave = async () => {
    if (password !== confirm) { setError(c.mismatch); return; }
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setState('done');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-5">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="p-2 bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E] rounded-[10px]">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
        </div>

        {state === 'checking' && (
          <p className="text-center text-sm text-gray-500">{c.checking}</p>
        )}

        {state === 'invalid' && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2">{c.title}</h2>
            <p className="text-sm text-red-500 text-center mb-6">{c.invalid}</p>
            <a href="/?auth=1" className="block w-full py-3 text-center bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity text-sm font-medium">
              {c.goToApp}
            </a>
          </>
        )}

        {state === 'done' && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2">{c.title}</h2>
            <p className="text-sm text-green-600 text-center mb-6">{c.done}</p>
            <a href="/" className="block w-full py-3 text-center bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity text-sm font-medium">
              {c.goToApp}
            </a>
          </>
        )}

        {state === 'ready' && (
          <>
            <h2 className="text-2xl font-bold text-center mb-2">{c.title}</h2>
            <p className="text-gray-500 text-center mb-8 text-sm">{c.sub}</p>
            <div className="space-y-3">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={c.newPassword} className={field} autoComplete="new-password" />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={c.confirmPassword} className={field} autoComplete="new-password" />
            </div>
            <p className="mt-2 text-xs text-gray-400">{c.hint}</p>
            {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
            <button
              onClick={handleSave}
              disabled={saving || !password || !confirm}
              className="w-full mt-4 py-3 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? c.saving : c.save}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

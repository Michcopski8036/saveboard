import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { supabase } from '../lib/supabase';
import { Bookmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const COPY = {
  en: {
    welcomeBack: 'Welcome back', createAccount: 'Create account',
    subLogin: 'Sign in to access your saves', subSignup: 'Start saving your favourite links',
    continueApple: 'Continue with Apple', continueGoogle: 'Continue with Google',
    or: 'or', email: 'Email', password: 'Password',
    passwordHint: 'Use 8+ characters with uppercase, lowercase, a number, and a symbol.',
    loading: 'Loading...', signIn: 'Sign in', signUp: 'Sign up',
    noAccount: "Don't have an account? ", haveAccount: 'Already have an account? ',
    confirmEmail: 'Check your email to confirm your account!',
    appleFailed: 'Apple Sign In failed',
  },
  ko: {
    welcomeBack: '다시 오신 걸 환영해요', createAccount: '계정 만들기',
    subLogin: '로그인하고 내 저장 목록을 확인하세요', subSignup: '좋아하는 링크를 저장해보세요',
    continueApple: 'Apple로 계속하기', continueGoogle: 'Google로 계속하기',
    or: '또는', email: '이메일', password: '비밀번호',
    passwordHint: '대문자·소문자·숫자·기호를 포함해 8자 이상 사용하세요.',
    loading: '로딩 중...', signIn: '로그인', signUp: '회원가입',
    noAccount: '계정이 없으신가요? ', haveAccount: '이미 계정이 있으신가요? ',
    confirmEmail: '이메일을 확인해 계정을 인증해주세요!',
    appleFailed: 'Apple 로그인에 실패했어요',
  },
} as const;

export function Auth() {
  const { language } = useLanguage();
  const c = COPY[language as keyof typeof COPY] ?? COPY.en;
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailAuth = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(c.confirmEmail);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    if (Capacitor.isNativePlatform()) {
      const { data } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'app.saveboard.saveboard://login-callback',
          skipBrowserRedirect: true,
        },
      });
      if (data?.url) await Browser.open({ url: data.url });
    } else {
      await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setError('');
    try {
      if (Capacitor.isNativePlatform()) {
        const rawNonce = crypto.randomUUID().replace(/-/g, '');
        const encoder = new TextEncoder();
        const data = encoder.encode(rawNonce);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashedNonce = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const { response } = await SignInWithApple.authorize({
          clientId: 'app.saveboard.saveboard',
          redirectURI: 'https://mchikdltrcbovhdzdhhf.supabase.co/auth/v1/callback',
          scopes: 'email name',
          nonce: hashedNonce,
        });
        if (!response.identityToken) throw new Error('Apple did not return an identity token');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: response.identityToken,
          nonce: rawNonce,
        });
        if (error) throw error;
        // Apple only provides name on first sign-in — save it immediately
        const givenName = response.givenName ?? '';
        const familyName = response.familyName ?? '';
        if (givenName || familyName) {
          await supabase.auth.updateUser({
            data: {
              full_name: `${givenName} ${familyName}`.trim(),
              given_name: givenName,
              family_name: familyName,
            },
          });
        }
      } else {
        // Web fallback
        await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: window.location.origin },
        });
      }
    } catch (err: any) {
      if (err?.message !== 'The user canceled the authorization attempt') {
        setError(err.message ?? c.appleFailed);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="p-2 bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E] rounded-[10px]">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          {isLogin ? c.welcomeBack : c.createAccount}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {isLogin ? c.subLogin : c.subSignup}
        </p>

        {/* Apple */}
        <button
          onClick={handleAppleSignIn}
          disabled={appleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-[10px] hover:bg-gray-900 transition-colors mb-3 disabled:opacity-60"
        >
          {appleLoading ? (
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.36.74 3.18.8 1.21-.24 2.37-.93 3.67-.84 1.56.12 2.73.72 3.5 1.84-3.22 1.93-2.46 6.18.65 7.38-.48 1.24-1.08 2.44-3 3.7zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
          )}
          <span className="text-sm font-medium">{c.continueApple}</span>
        </button>

        {/* Google */}
        <button
          onClick={() => handleOAuth('google')}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors mb-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium">{c.continueGoogle}</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">{c.or}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.email}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            placeholder={c.password}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm"
          />
        </div>

        {!isLogin && (
          <p className="mt-2 text-xs text-gray-400">
            {c.passwordHint}
          </p>
        )}

        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-500 text-center">{message}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
          className="w-full mt-4 py-3 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? c.loading : isLogin ? c.signIn : c.createAccount}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? c.noAccount : c.haveAccount}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="text-[#A259FF] font-medium hover:underline"
          >
            {isLogin ? c.signUp : c.signIn}
          </button>
        </p>
      </div>
    </div>
  );
}
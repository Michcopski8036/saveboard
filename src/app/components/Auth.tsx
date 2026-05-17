import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bookmark, ExternalLink } from 'lucide-react';

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent;
  return /KAKAOTALK|NAVER|Line\/|Instagram|FBAN|FBAV|Twitter|MicroMessenger|GSA\//.test(ua) ||
    (ua.includes('Android') && /wv/.test(ua)) ||
    (ua.includes('iPhone') && !ua.includes('Safari'));
}

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const inApp = isInAppBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
        setMessage('Check your email to confirm your account!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
  };

  const [copied, setCopied] = useState(false);

  const openInBrowser = () => {
    const url = window.location.href;
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // iOS Chrome scheme: replace https:// with googlechromes://
      window.location.href = url.replace(/^https:\/\//, 'googlechromes://').replace(/^http:\/\//, 'googlechrome://');
    } else {
      // Android Chrome intent
      const host = url.replace(/^https?:\/\//, '');
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end`;
    }
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      {inApp && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3">
          <p className="text-[13px] text-amber-800 font-medium text-center leading-snug">
            Google sign-in is blocked in this browser.
          </p>
          <p className="text-[12px] text-amber-700 text-center mt-0.5">
            Open SaveBoard in Chrome or Safari to sign in with Google.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={openInBrowser}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Chrome
            </button>
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors">
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-sm" style={{ marginTop: inApp ? '110px' : 0 }}>
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="p-2 bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E] rounded-[10px]">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
          </h1>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {isLogin ? 'Sign in to access your saves' : 'Start saving your favourite links'}
        </p>

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
          <span className="text-sm font-medium">Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            placeholder="Password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#A259FF] focus:border-transparent text-sm"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-500 text-center">{message}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
          className="w-full mt-4 py-3 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="text-[#A259FF] font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
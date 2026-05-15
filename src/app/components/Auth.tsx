import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bookmark } from 'lucide-react';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
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
          {isLogin ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          {isLogin ? 'Sign in to access your links' : 'Start saving your favorite links'}
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors mb-4"
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
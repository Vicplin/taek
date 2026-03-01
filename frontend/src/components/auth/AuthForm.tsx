'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleGoogleSignIn = () => {
    // Redirect to our API route for Google OAuth
    window.location.href = '/api/auth/google';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          full_name: !isLogin ? fullName : undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (isLogin) {
        // Refresh to update auth state
        router.refresh();
        // You might want to redirect to dashboard or home
        router.push('/dashboard'); 
      } else {
        setSuccess(data.message || 'Signup successful! Please check your email.');
        // Optional: Switch to login view or keep success message
        if (!data.message?.includes('check your email')) {
             setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-orbitron font-bold text-white mb-2">
          {isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
        </h2>
        <p className="text-gray-400 font-rajdhani text-sm">
          {isLogin ? 'Sign in to continue to your dashboard' : 'Join us and start your journey'}
        </p>
      </div>

      {/* Google Sign In Button */}
      <button 
        onClick={handleGoogleSignIn}
        type="button"
        className="w-full bg-black/40 hover:bg-white/5 border border-white/10 text-white font-rajdhani font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 group mb-6"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        </svg>
        <span className="group-hover:text-white transition-colors">
          {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
        </span>
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#151515] text-gray-500 font-rajdhani">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all"
              placeholder="John Doe"
              required={!isLogin}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all"
            placeholder="name@example.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white font-rajdhani focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-rajdhani">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-xs font-rajdhani">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-arena-red hover:bg-red-600 text-white font-orbitron font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(255,70,85,0.4)] hover:shadow-[0_0_30px_rgba(255,70,85,0.6)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN' : 'CREATE ACCOUNT')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setSuccess('');
          }}
          className="text-gray-400 hover:text-white text-sm font-rajdhani transition-colors underline decoration-gray-600 hover:decoration-white underline-offset-4"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

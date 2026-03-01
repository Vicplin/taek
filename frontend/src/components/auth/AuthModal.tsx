'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GamingButton from '@/components/shared/GamingButton';
import { createClient } from '@/lib/supabase/client';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);
  };
  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isParent, setIsParent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    if (mode === 'signup') {
      const newFieldErrors: Record<string, boolean> = {};

      if (!fullName.trim()) {
        newFieldErrors.fullName = true;
        setFieldErrors(newFieldErrors);
        setError('Full Name is required.');
        setLoading(false);
        return;
      }
      if (!email.trim()) {
        newFieldErrors.email = true;
        setFieldErrors(newFieldErrors);
        setError('Email Address is required.');
        setLoading(false);
        return;
      }
      if (!phoneNumber.trim()) {
        newFieldErrors.phoneNumber = true;
        setFieldErrors(newFieldErrors);
        setError('Phone Number is required.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        newFieldErrors.password = true;
        setFieldErrors(newFieldErrors);
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        newFieldErrors.confirmPassword = true;
        setFieldErrors(newFieldErrors);
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            phone: phoneNumber,
            account_type: isParent ? 'parent' : 'individual',
          }
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccessMessage('Account created! Check your email for a confirmation link.');
      setLoading(false);
      return;
    }

    if (mode === 'signin') {
      console.log('Attempting sign in with:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
        setLoading(false);
        return;
      }

      console.log('Sign in successful, closing modal');
      onClose();
      setLoading(false);
      window.location.reload(); // Force reload to update UI
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            layout: { duration: 0.3, type: "spring", bounce: 0, damping: 25, stiffness: 300 },
            opacity: { duration: 0.2 }
          }}
          className="relative w-full max-w-md bg-[#151515] rounded-xl overflow-hidden shadow-2xl border border-white/5 max-h-[90vh] flex flex-col"
        >
          {/* Corner Accents (Red) */}
          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm z-10" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm z-10" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm z-10" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20 bg-white/5 p-1 rounded-sm hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-8 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-orbitron font-bold text-white mb-2 tracking-wide uppercase">
                {mode === 'signin' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}
              </h2>
              <p className="text-gray-400 font-rajdhani">
                {mode === 'signin' 
                  ? 'Sign in to access your tournaments' 
                  : 'Join TAEK to start your journey'}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1 bg-black/40 rounded-lg mb-8 border border-white/5">
              <button
                onClick={() => mode !== 'signin' && toggleMode()}
                className={`flex-1 py-2.5 text-sm font-bold font-orbitron tracking-wider rounded-md transition-all duration-300 ${
                  mode === 'signin'
                    ? 'bg-arena-red text-white shadow-lg shadow-arena-red/20'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => mode !== 'signup' && toggleMode()}
                className={`flex-1 py-2.5 text-sm font-bold font-orbitron tracking-wider rounded-md transition-all duration-300 ${
                  mode === 'signup'
                    ? 'bg-arena-red text-white shadow-lg shadow-arena-red/20'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                SIGN UP
              </button>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); if(fieldErrors.fullName) setFieldErrors(prev => ({...prev, fullName: false})); }}
                      className={`block w-full pl-10 pr-3 py-3 bg-black/40 border ${fieldErrors.fullName ? 'border-red-400' : 'border-white/10'} rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani`}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { 
                      setEmail(e.target.value); 
                      if(error) setError(null);
                      if(fieldErrors.email) setFieldErrors(prev => ({...prev, email: false}));
                    }}
                    className={`block w-full pl-10 pr-3 py-3 bg-black/40 border ${(mode === 'signin' && error) || (mode === 'signup' && fieldErrors.email) ? 'border-red-400' : 'border-white/10'} rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani`}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); if(fieldErrors.phoneNumber) setFieldErrors(prev => ({...prev, phoneNumber: false})); }}
                      className={`block w-full pl-10 pr-3 py-3 bg-black/40 border ${fieldErrors.phoneNumber ? 'border-red-400' : 'border-white/10'} rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani`}
                      placeholder="+60 12-345 6789 or 012-345 6789"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { 
                      setPassword(e.target.value); 
                      if(error) setError(null);
                      if(fieldErrors.password) setFieldErrors(prev => ({...prev, password: false}));
                    }}
                    className={`block w-full pl-10 pr-10 py-3 bg-black/40 border ${(mode === 'signin' && error) || (mode === 'signup' && fieldErrors.password) ? 'border-red-400' : 'border-white/10'} rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani`}
                    placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-white focus:outline-none"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); if(fieldErrors.confirmPassword) setFieldErrors(prev => ({...prev, confirmPassword: false})); }}
                        className={`block w-full pl-10 pr-10 py-3 bg-black/40 border ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-white/10'} rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani`}
                        placeholder="Confirm your password"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-500 hover:text-white focus:outline-none"
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Parent Account Toggle */}
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-arena-red">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white font-orbitron">Parent Account?</div>
                        <div className="text-xs text-gray-500 font-rajdhani">Register as a parent to add multiple players</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsParent(!isParent)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isParent ? 'bg-white' : 'bg-gray-700'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-[#151515] transition-transform ${isParent ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </>
              )}

              {mode === 'signin' && (
                <div className="flex justify-end">
                  <button type="button" className="text-xs font-bold text-arena-red hover:text-white transition-colors uppercase tracking-wider">
                    Forgot Password?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-red-400 text-sm font-rajdhani text-center">
                  {error}
                </p>
              )}

              {successMessage && (
                <div className="text-center py-4 space-y-2">
                  <div className="text-4xl">📧</div>
                  <p className="text-green-400 text-sm font-rajdhani">
                    {successMessage}
                  </p>
                </div>
              )}

              <GamingButton fullWidth type="submit" disabled={loading}>
                {loading ? 'Please wait...' : (mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT')}
                {!loading && (
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </GamingButton>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#151515] px-4 text-gray-500 font-bold">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <button 
              onClick={signInWithGoogle}
              className="w-full bg-black/40 hover:bg-white/5 border border-white/10 text-white font-rajdhani font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="group-hover:text-white transition-colors">
                {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
              </span>
            </button>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm font-rajdhani">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button
                  onClick={toggleMode}
                  className="text-arena-red hover:text-white font-bold transition-colors ml-1 uppercase tracking-wider"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

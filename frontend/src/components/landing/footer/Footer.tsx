'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import AuthModal from '../../auth/AuthModal';

export default function Footer() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'signin' | 'signup'>('signup');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = feedbackText.trim();
    if (trimmed.length < 10) {
      setFeedbackError('Please share at least 10 characters of feedback.');
      setFeedbackSuccess(false);
      return;
    }
    if (trimmed.length > 500) {
      setFeedbackError('Feedback is too long. Please keep it under 500 characters.');
      setFeedbackSuccess(false);
      return;
    }
    setFeedbackError('');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFeedbackSuccess(true);
      setFeedbackText('');
      setTimeout(() => {
        setIsFeedbackOpen(false);
        setFeedbackSuccess(false);
      }, 1200);
    }, 600);
  };

  return (
    <footer className="bg-[#151515] border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image 
                src="/images/TaekLogoDark.png" 
                alt="TAEK" 
                width={120} 
                height={40} 
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed font-rajdhani max-w-sm">
              Malaysia&apos;s premier platform for Taekwondo tournament management, rankings, and athlete development.
            </p>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a href="#" className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-gray-400 hover:text-white hover:bg-arena-red transition-all border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.163c3.204 0 3.584.012 4.85.072 3.269.156 5.093 1.98 5.249 5.25.06 1.265.072 1.645.072 4.85s-.012 3.584-.072 4.85c-.156 3.269-1.98 5.093-5.25 5.249-1.265.06-1.645.072-4.85.072s-3.584-.012-4.85-.072c-3.269-.156-5.093-1.98-5.25-5.249-.06-1.265-.072-1.645-.072-4.85s.012-3.584.072-4.85c.156-3.269 1.98-5.093 5.25-5.249 1.265-.06 1.645-.072 4.85-.072zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
              {/* Email */}
              <a href="#" className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-gray-400 hover:text-white hover:bg-arena-red transition-all border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </a>
              {/* Phone */}
              <a href="#" className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-gray-400 hover:text-white hover:bg-arena-red transition-all border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </a>
              {/* WhatsApp */}
              <a href="#" className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-gray-400 hover:text-white hover:bg-arena-red transition-all border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21" /></svg>
              </a>
            </div>
          </div>

          {/* Tournaments Column */}
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-white font-orbitron font-bold mb-6 text-lg">Tournaments</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-rajdhani">
              <li><Link href="/tournaments" className="hover:text-white transition-colors">Find Tournaments</Link></li>
              <li>
                <button
                  onClick={() => {
                    setInitialAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="hover:text-white transition-colors text-left"
                >
                  Join Now
                </button>
              </li>
            </ul>
          </div>

          {/* Feedback & Support Column */}
          <div className="md:col-span-3">
            <h4 className="text-white font-orbitron font-bold mb-6 text-lg">Feedback & Support</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-rajdhani">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Feedback
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-rajdhani">
          <div className="flex flex-col gap-1 text-gray-500">
            <p>&copy; 2026 TAEK. All rights reserved. | Powered by passion for Taekwondo.</p>
            <p>
              Developed by <span className="text-arena-red font-bold">JC Contract Advisory</span>
            </p>
          </div>
          
          <Link href="/auth/staff-login" className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors font-orbitron group">
            <svg className="w-4 h-4 group-hover:text-arena-red transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            STAFF ACCESS
          </Link>
        </div>
      </div>

      {isFeedbackOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close feedback"
            onClick={() => setIsFeedbackOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-[#151515] border border-white/10 rounded-xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-orbitron font-bold uppercase tracking-widest">Send Feedback</h2>
                <p className="text-xs text-gray-500 mt-1">Keep it short and simple. Max 500 characters.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <span className="text-lg">×</span>
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-arena-red resize-none"
                  placeholder="Tell us what we did well or what we can improve."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Email (optional)</label>
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={e => setFeedbackEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-rajdhani focus:outline-none focus:border-arena-red"
                  placeholder="If you want us to reply"
                />
              </div>

              {feedbackError && (
                <p className="text-xs text-red-400 font-rajdhani">{feedbackError}</p>
              )}
              {feedbackSuccess && !feedbackError && (
                <p className="text-xs text-green-400 font-rajdhani">Thank you for your feedback.</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 font-bold text-xs uppercase tracking-[0.25em] bg-arena-red text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={initialAuthMode} />
    </footer>
  );
}

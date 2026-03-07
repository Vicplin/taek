'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import GamingButton from '../shared/GamingButton';
import { createClient } from '@/lib/supabase/client';
import AuthModal from '../auth/AuthModal';

export default function NavigationHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'signin' | 'signup'>('signin');
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  
  const openSignIn = () => {
    setInitialAuthMode('signin');
    setAuthModalOpen(true);
  };

  const openSignUp = () => {
    setInitialAuthMode('signup');
    setAuthModalOpen(true);
  };

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAboutClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      setIsOpen(false); // Close mobile menu if open
      
      const element = document.getElementById('about');
      if (element) {
        // Offset for fixed header (approx 100px)
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Trigger highlight effect
        setTimeout(() => {
          window.dispatchEvent(new Event('highlight-about'));
        }, 500); // Wait for scroll to (mostly) finish
      }
    }
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-deep-black/95 backdrop-blur-md shadow-lg border-b border-gray-800' : 'bg-transparent'}`}>
      <nav className={`container mx-auto px-4 flex justify-between items-center transition-all duration-300 ${scrolled ? 'py-4' : 'py-8'}`}>
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className={`relative transition-all duration-300 ${scrolled ? 'w-[120px] h-[40px]' : 'w-[160px] h-[53px]'}`}>
             <Image 
              src="/images/TaekLogoDark.png" 
              alt="TAEK" 
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-12">
          <Link href="/" className={`text-gray-300 hover:text-white font-rajdhani font-medium tracking-wide transition-all duration-300 ${scrolled ? 'text-sm' : 'text-lg'}`}>
            Home
          </Link>
          <Link href="/tournaments" className={`text-gray-300 hover:text-white font-rajdhani font-medium tracking-wide transition-all duration-300 ${scrolled ? 'text-sm' : 'text-lg'}`}>
            Tournaments
          </Link>
          <Link 
            href="/#about" 
            onClick={handleAboutClick}
            className={`text-gray-300 hover:text-white font-rajdhani font-medium tracking-wide transition-all duration-300 ${scrolled ? 'text-sm' : 'text-lg'}`}
          >
            About
          </Link>
        </div>
          
        <div className="hidden md:flex items-center gap-6">
          {!user && (
            <button 
              onClick={openSignIn} 
              className={`text-white hover:text-arena-red font-medium transition-all duration-300 ${scrolled ? 'text-sm' : 'text-base'}`}
            >
              Sign In
            </button>
          )}
          
          <GamingButton 
            onClick={() => {
              if (!user) {
                openSignUp()
              } else {
                router.push('/dashboard')
              }
            }} 
            variant="primary" 
            className={`transition-all duration-300 ${scrolled ? 'text-sm px-6 py-2' : 'text-base px-8 py-3'}`}
          >
            {user ? 'DASHBOARD' : 'GET STARTED'}
          </GamingButton>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white hover:text-arena-red focus:outline-none"
        >
          {isOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={initialAuthMode} />

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden bg-deep-black border-t border-gray-800 p-6 space-y-6 shadow-2xl h-screen absolute w-full left-0">
          <div className="flex flex-col space-y-4">
            <Link href="/" className="text-xl text-white font-orbitron hover:text-arena-red" onClick={() => setIsOpen(false)}>
              HOME
            </Link>
            <Link href="/tournaments" className="text-xl text-white font-orbitron hover:text-arena-red" onClick={() => setIsOpen(false)}>
              TOURNAMENTS
            </Link>
            <Link 
              href="/#about" 
              onClick={handleAboutClick}
              className="text-xl text-white font-orbitron hover:text-arena-red"
            >
              ABOUT
            </Link>
          </div>
          
          <div className="pt-6 border-t border-gray-800 flex flex-col space-y-4">
            {!user && (
              <GamingButton 
                onClick={() => {
                  openSignIn();
                  setIsOpen(false);
                }} 
                variant="ghost" 
                fullWidth
              >
                Sign In
              </GamingButton>
            )}
            
            <GamingButton 
              onClick={() => { 
                if (!user) {
                  openSignUp();
                } else {
                  router.push('/dashboard');
                }
                setIsOpen(false); 
              }} 
              variant="primary" 
              fullWidth
            >
              {user ? 'DASHBOARD' : 'GET STARTED'}
            </GamingButton>
          </div>
        </div>
      )}
    </header>
  );
}

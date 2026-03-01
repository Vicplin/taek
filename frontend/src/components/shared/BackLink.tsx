import Link from 'next/link';
import React from 'react';

type BackLinkProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function BackLink({ href, label = 'BACK', className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={
        `inline-flex items-center text-gray-400 hover:text-white mb-8 text-sm font-bold tracking-widest transition-colors group ${className || ''}`
      }
    >
      <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}


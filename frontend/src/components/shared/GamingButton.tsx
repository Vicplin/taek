import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GamingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  href?: string;
  className?: string;
  fullWidth?: boolean;
}

export default function GamingButton({
  children,
  variant = 'primary',
  href,
  className = '',
  fullWidth = false,
  disabled,
  ...props
}: GamingButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all duration-300 clip-path-polygon group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-arena-red text-white hover:bg-red-700 shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.6)]",
    outline: "border-2 border-arena-red text-arena-red hover:bg-arena-red hover:text-white",
    secondary: "border border-white/20 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm",
    ghost: "text-gray-300 hover:text-white hover:bg-white/5",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const combinedClasses = `${baseStyles} ${variants[variant]} ${widthClass} ${className}`;

  // Custom clip-path style for the gaming look (angled corners)
  const clipPathStyle = variant !== 'ghost' ? { clipPath: "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)" } : {};

  const content = (
    <>
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {/* Shine Effect Animation - Only if not disabled */}
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
      )}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClasses} style={clipPathStyle}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} style={clipPathStyle} disabled={disabled} {...props}>
      {content}
    </button>
  );
}

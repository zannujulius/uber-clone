import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants = {
  primary:   'bg-accent text-zinc-900 hover:bg-yellow-300 font-bold shadow-lg shadow-yellow-400/10',
  secondary: 'border border-accent text-accent hover:bg-accent/10 font-semibold',
  ghost:     'bg-card text-white hover:bg-elevated font-semibold',
  danger:    'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold',
};

const sizes = {
  sm: 'h-9  px-4 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-13 px-6 text-base rounded-2xl',
};

export default function Button({
  variant = 'primary', size = 'md', loading, fullWidth, children, disabled, className = '', ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

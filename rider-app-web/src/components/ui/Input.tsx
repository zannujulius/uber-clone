import { forwardRef, InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: string;       // lucide-like SVG string or emoji
  isPassword?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, isPassword, className = '', type, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const inputType = isPassword ? (show ? 'text' : 'password') : type;

    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</label>}
        <div className={`
          relative flex items-center
          bg-card border rounded-xl transition-colors duration-150
          focus-within:border-accent
          ${error ? 'border-red-500' : 'border-border'}
        `}>
          {leftIcon && (
            <span className="pl-3.5 text-zinc-500 text-base shrink-0 select-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              flex-1 bg-transparent text-white placeholder:text-zinc-600
              text-sm py-3 px-3.5 outline-none
              ${leftIcon ? 'pl-2' : ''}
              ${isPassword ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {show ? '🙈' : '👁️'}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

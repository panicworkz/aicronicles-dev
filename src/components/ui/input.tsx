import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={twMerge(
          clsx(
            'flex h-9 w-full rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-sm text-white placeholder:text-neutral-500 transition-colors outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

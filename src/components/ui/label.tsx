import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={twMerge(clsx('text-xs font-medium text-slate-400 select-none', className))}
      {...props}
    />
  )
);
Label.displayName = 'Label';

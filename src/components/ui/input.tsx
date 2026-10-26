import React, { type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightElement,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              'block w-full rounded-xl border bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all min-h-[42px] sm:min-h-[38px]',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600',
              leftIcon && 'pl-9 sm:pl-10',
              rightElement && 'pr-9 sm:pr-10',
              error
                ? 'border-rose-400 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/30'
                : 'border-slate-300/80 hover:border-slate-400/90',
              disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60',
              className,
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

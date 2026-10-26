import React, { type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { appleSnappy } from '@/utils/motion';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer touch-manipulation active:opacity-95';

    const variantStyles = {
      primary:
        'bg-amber-700 text-white hover:bg-amber-800 focus:ring-amber-600 active:bg-amber-900 shadow-xs border border-amber-800/20',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200/90 focus:ring-slate-400 active:bg-slate-300 border border-slate-200/50',
      outline:
        'border border-slate-300/90 bg-white/70 text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-400 shadow-2xs',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 focus:ring-slate-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 active:bg-rose-800 shadow-xs border border-rose-700/20',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] sm:min-h-0 gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[44px] sm:min-h-[38px] gap-2',
      lg: 'text-base px-5 py-2.5 min-h-[48px] sm:min-h-[44px] gap-2.5',
    };

    const isDisabled = disabled || isLoading;

    // Use motion.button for Apple-like micro-tap feedback
    const MotionButton = motion.button as React.ForwardRefExoticComponent<
      HTMLMotionProps<'button'> & React.RefAttributes<HTMLButtonElement>
    >;

    return (
      <MotionButton
        ref={ref}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={appleSnappy}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </MotionButton>
    );
  },
);

Button.displayName = 'Button';

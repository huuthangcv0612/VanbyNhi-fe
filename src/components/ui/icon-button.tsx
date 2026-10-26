import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Tooltip } from './tooltip';
import { appleSnappy } from '@/utils/motion';

export interface IconButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
  tooltip?: React.ReactNode;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      'aria-label': ariaLabel,
      tooltip,
      tooltipPlacement = 'top',
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none shrink-0 touch-manipulation';

    const variantStyles = {
      primary:
        'bg-amber-700 text-white hover:bg-amber-800 active:bg-amber-900 shadow-xs border border-amber-800/20',
      secondary:
        'bg-slate-100 text-slate-700 hover:bg-slate-200/80 active:bg-slate-300 text-slate-800 border border-slate-200/60',
      outline:
        'border border-slate-200/90 bg-white/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 shadow-2xs',
      ghost:
        'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/90 active:bg-slate-200/70',
      danger:
        'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 border border-rose-200/60',
    };

    // Ensure tap target conforms to Apple HIG (>= 44x44 on mobile touch devices)
    const sizeStyles = {
      sm: 'h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:h-8 sm:w-8 text-xs',
      md: 'h-10 w-10 min-h-[44px] min-w-[44px] sm:h-9 sm:w-9 text-sm',
      lg: 'h-11 w-11 min-h-[44px] min-w-[44px] sm:h-10 sm:w-10 text-base',
    };

    const buttonElement = (
      <motion.button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        whileHover={disabled || isLoading ? undefined : { scale: 1.04 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.94 }}
        transition={appleSnappy}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          icon
        )}
      </motion.button>
    );

    const tooltipContent = tooltip !== undefined ? tooltip : ariaLabel;

    if (tooltipContent && !disabled) {
      return (
        <Tooltip content={tooltipContent} placement={tooltipPlacement}>
          {buttonElement}
        </Tooltip>
      );
    }

    return buttonElement;
  },
);

IconButton.displayName = 'IconButton';

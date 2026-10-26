import React, { useState, useRef, useId, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/utils/cn';
import { appleDropdownSpring } from '@/utils/motion';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  className,
  delay = 200,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkTouch = () => {
        setIsTouchDevice(
          'ontouchstart' in window || navigator.maxTouchPoints > 0,
        );
      };
      checkTouch();
    }
  }, []);

  const showTooltip = () => {
    if (disabled || isTouchDevice) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const placementStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Clone child to inject event handlers & aria-describedby
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      children.props.onBlur?.(e);
      hideTooltip();
    },
    'aria-describedby': isVisible ? tooltipId : children.props['aria-describedby'],
  });

  return (
    <div className="relative inline-flex items-center justify-center">
      {trigger}

      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.94, y: placement === 'top' ? 2 : placement === 'bottom' ? -2 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={appleDropdownSpring}
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-slate-900/90 px-2.5 py-1 text-xs font-medium text-white shadow-md backdrop-blur-xs select-none',
              placementStyles[placement],
              className,
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

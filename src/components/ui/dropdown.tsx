import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/utils/cn';
import { appleDropdownSpring } from '@/utils/motion';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer select-none"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={appleDropdownSpring}
            style={{
              transformOrigin: align === 'right' ? 'top right' : 'top left',
            }}
            className={cn(
              'absolute z-50 mt-2 w-56 rounded-2xl bg-white/95 p-1.5 shadow-xl border border-slate-200/80 backdrop-blur-md ring-1 ring-black/5 focus:outline-none',
              align === 'right' ? 'right-0' : 'left-0',
            )}
            role="menu"
          >
            {items.map((item, index) => {
              if (item === 'divider') {
                return (
                  <div
                    key={`div-${index}`}
                    className="my-1 h-px bg-slate-100"
                    role="separator"
                  />
                );
              }

              return (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm text-left transition-colors cursor-pointer select-none',
                    item.danger
                      ? 'text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 active:bg-rose-100'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 active:bg-slate-200/70',
                    item.disabled && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {item.icon && (
                    <span className="shrink-0 text-slate-400 group-hover:text-slate-600">
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

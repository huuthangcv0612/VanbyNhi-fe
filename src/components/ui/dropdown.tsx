import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

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
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-52 rounded-xl bg-white p-1.5 shadow-lg border border-slate-200 ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0' : 'left-0',
          )}
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
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors cursor-pointer',
                  item.danger
                    ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  item.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {item.icon && (
                  <span className="shrink-0 text-slate-400 group-hover:text-slate-600">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

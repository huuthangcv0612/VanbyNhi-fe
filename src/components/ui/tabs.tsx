import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import { appleSpring } from '@/utils/motion';
import { Tooltip } from './tooltip';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layoutId?: string;
  iconOnlyOnMobile?: boolean;
}

export function SegmentedTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
  layoutId = 'activeTabIndicator',
  iconOnlyOnMobile = true,
}: SegmentedTabsProps<T>) {
  const sizeStyles = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-xs sm:text-sm',
    lg: 'p-1.5 text-sm sm:text-base',
  };

  const itemPaddingStyles = {
    sm: 'py-1 px-2.5 min-h-[32px]',
    md: 'py-1.5 px-3 min-h-[38px] sm:min-h-[34px]',
    lg: 'py-2 px-4 min-h-[44px] sm:min-h-[40px]',
  };

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60 overflow-x-auto max-w-full scrollbar-none',
        sizeStyles[size],
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const button = (
          <button
            key={tab.id}
            aria-pressed={isActive}
            aria-label={tab.label}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative z-10 inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors cursor-pointer select-none whitespace-nowrap',
              itemPaddingStyles[size],
              isActive
                ? 'text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50',
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                transition={appleSpring}
                className="absolute inset-0 z-[-1] rounded-xl bg-white shadow-xs border border-black/5"
              />
            )}

            {tab.icon && (
              <span className={cn('shrink-0', isActive ? 'text-amber-700' : 'text-slate-400')}>
                {tab.icon}
              </span>
            )}

            <span className={cn(iconOnlyOnMobile && tab.icon ? 'hidden sm:inline' : 'inline')}>
              {tab.label}
            </span>

            {tab.badge !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-600',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );

        if (iconOnlyOnMobile && tab.icon) {
          return (
            <Tooltip key={tab.id} content={tab.label} className="sm:hidden">
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </div>
  );
}

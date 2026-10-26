import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { appleSpring, appleFade } from '@/utils/motion';
import { IconButton } from './icon-button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={appleFade}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Dialog Card (Apple squircle, spring entrance) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={appleSpring}
            className={cn(
              'relative w-full rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 text-left shadow-2xl border border-slate-200/90 z-10 my-auto',
              maxWidthStyles[maxWidth],
              className,
            )}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="pr-2">
                <h3
                  id="modal-title"
                  className="text-base sm:text-lg font-bold leading-6 text-slate-900 font-serif"
                >
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <IconButton
                icon={<X className="w-4 h-4" />}
                aria-label="Đóng"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 -mr-1 -mt-1"
              />
            </div>

            <div className="mt-4 max-h-[calc(85vh-140px)] overflow-y-auto pr-1">
              {children}
            </div>

            {footer && (
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

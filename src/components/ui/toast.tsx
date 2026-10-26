import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ToastContext, type ToastItem } from './ToastContext';
import { appleSpring } from '@/utils/motion';
import { IconButton } from './icon-button';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast],
  );
  const error = useCallback(
    (message: string, title?: string) => showToast({ type: 'error', message, title }),
    [showToast],
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    [showToast],
  );
  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast],
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, removeToast, success, error, warning, info }}
    >
      {children}
      <div
        className="fixed bottom-20 sm:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const icons = {
              success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
              error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
              warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
              info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
            };

            const borders = {
              success: 'border-emerald-200/90 bg-emerald-50/95 text-emerald-950',
              error: 'border-rose-200/90 bg-rose-50/95 text-rose-950',
              warning: 'border-amber-200/90 bg-amber-50/95 text-amber-950',
              info: 'border-blue-200/90 bg-blue-50/95 text-blue-950',
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94 }}
                transition={appleSpring}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md transition-all',
                  borders[toast.type],
                )}
              >
                {icons[toast.type]}
                <div className="flex-1 text-sm min-w-0">
                  {toast.title && <p className="font-semibold text-xs sm:text-sm">{toast.title}</p>}
                  <p className="text-xs sm:text-sm opacity-90 leading-relaxed break-words">{toast.message}</p>
                </div>
                <IconButton
                  icon={<X className="w-3.5 h-3.5" />}
                  aria-label="Đóng thông báo"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 -mr-1.5 -mt-1.5 sm:min-h-0 sm:min-w-0 sm:h-7 sm:w-7"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export type { ToastItem };

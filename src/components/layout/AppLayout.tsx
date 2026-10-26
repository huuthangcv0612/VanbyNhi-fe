import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { appleFade } from '@/utils/motion';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-200 selection:text-amber-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={appleFade}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="hidden lg:block py-4 px-6 border-t border-slate-200/80 text-center text-xs text-slate-400">
          VanbyNhi — Nền tảng Quản lý & Học tập Văn học Việt Nam &copy; 2026
        </footer>
      </div>

      {/* iOS-inspired Bottom Navigation for Mobile / Tablet */}
      <BottomNav onOpenMenu={() => setSidebarOpen(true)} />
    </div>
  );
}

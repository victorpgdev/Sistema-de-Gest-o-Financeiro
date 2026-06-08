import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { Header }  from '@/components/Header';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { isSidebarOpen } = useUIStore();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - Fixa lateralmente */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Fixo no topo */}
        <Header />

        {/* Main Content Area - Role individualmente */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 md:p-8 min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

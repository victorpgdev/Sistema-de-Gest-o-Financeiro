import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function DashboardLayout() {
  const { isSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main 
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen flex flex-col",
          isSidebarOpen ? "pl-64" : "pl-20"
        )}
      >
        <Header />
        
        <div className="p-8 flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="p-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PG Financial ERP. Todos os direitos reservados.
        </footer>
      </main>
    </div>
  );
}

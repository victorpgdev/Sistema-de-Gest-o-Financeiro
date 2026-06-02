import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header }  from '@/components/Header';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { isSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - Fixa lateralmente */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Fixo no topo */}
        <Header />

        {/* Main Content Area - Role individualmente */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
          <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

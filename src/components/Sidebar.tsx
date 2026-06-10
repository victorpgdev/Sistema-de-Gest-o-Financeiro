import { 
  LayoutDashboard, 
  ArrowUpRight, 
  Wallet, 
  CreditCard, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Painel Geral', path: '/' },
  { icon: BarChart3, label: 'Fluxo de Caixa', path: '/cash-flow' },
  { icon: ArrowUpRight, label: 'Movimentações', path: '/transactions' },
  { icon: Wallet, label: 'Contas Bancárias', path: '/accounts' },
  { icon: CreditCard, label: 'Meus Cartões', path: '/cards' },
  { icon: Users, label: 'Equipe e Acessos', path: '/team' },
  { icon: GraduationCap, label: 'Academia PG', path: '/help' },
  { icon: ShieldCheck, label: 'Segurança e LGPD', path: '/security' },
  { icon: Activity, label: 'Diagnóstico', path: '/diag', masterOnly: true },
];

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isSidebarOpen ? 280 : 80,
        x: 0 // Mantém visível em desktop
      }}
      className={cn(
        "bg-card border-r flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-50",
        "fixed md:sticky left-0", // Floating on mobile, sticky on desktop
        !isSidebarOpen && "md:w-20 -translate-x-full md:translate-x-0", // Hidden on mobile if closed
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >

      <div className="p-6 flex items-center justify-between">
        {isSidebarOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">PG Financial</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {MENU_ITEMS.filter(item => !item.masterOnly || user?.role === 'MASTER').map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", !isSidebarOpen && "mx-auto")} />
            {isSidebarOpen && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* O link de Administração foi movido exclusivamente para o menu de usuário no Header para manter a UI limpa */}
      </nav>

      <div className="p-4 border-t">
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", !isSidebarOpen && "rotate-180 mx-auto")} />
          {isSidebarOpen && <span>Recolher</span>}
        </button>
      </div>
    </motion.aside>
  );
}

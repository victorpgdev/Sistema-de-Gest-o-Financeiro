import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard, 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  Settings, 
  ChevronLeft,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Visão Geral', path: '/' },
  { icon: BarChart3, label: 'Fluxo de Caixa', path: '/cash-flow' },
  { icon: ArrowUpRight, label: 'Movimentações', path: '/transactions' },
  { icon: Wallet, label: 'Contas e Bancos', path: '/accounts' },
  { icon: CreditCard, label: 'Cartões de Crédito', path: '/cards' },
  { icon: Users, label: 'Minha Equipe', path: '/team' },
];

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      className={cn(
        "bg-card border-r flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-20",
        !isSidebarOpen && "items-center"
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
        {MENU_ITEMS.map((item) => (
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

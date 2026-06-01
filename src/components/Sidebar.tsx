import { NavLink } from 'react-router-dom';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  LayoutDashboard,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PieChart,
  BarChart3,
  Crown,
  RefreshCw,
  CreditCard,
  BellRing,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',         path: '/'             },
  { icon: Wallet,          label: 'Contas e Saldos',   path: '/contas'       },
  { icon: CreditCard,      label: 'Cartões de Crédito',path: '/cartoes'      },
  { icon: RefreshCw,       label: 'Conciliação',       path: '/conciliacao'  },
  { icon: ArrowUpCircle,   label: 'Receitas',          path: '/receber'      },
  { icon: ArrowDownCircle, label: 'Despesas',          path: '/pagar'        },
  
  { section: 'Ferramentas' },
  { icon: BellRing,        label: 'Régua de Cobrança', path: '/cobrancas'    },
  { icon: Target,          label: 'Metas e Orçamentos',path: '/metas'        },

  { section: 'Análise' },
  { icon: PieChart,        label: 'Fluxo de Caixa',    path: '/fluxo'        },
  { icon: BarChart3,       label: 'Relatórios',        path: '/relatorios'   },
  { section: 'Sistema' },
  { icon: Settings,        label: 'Configurações',     path: '/configuracoes'},
  { icon: Building2,       label: 'Minha Empresa',     path: '/empresa'      },
  { icon: Crown,           label: 'Painel Master',     path: '/master'       },
];

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-card border-r transition-all duration-300 z-50 flex flex-col',
        isSidebarOpen ? 'w-64' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
        <div className={cn(
          'flex items-center gap-2.5 font-bold text-primary overflow-hidden transition-all duration-300',
          !isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-extrabold shrink-0">
            PG
          </div>
          <span className="text-lg font-extrabold whitespace-nowrap tracking-tight">Financial</span>
        </div>
        {!isSidebarOpen && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-extrabold mx-auto">
            PG
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 hover:bg-muted rounded-lg transition-colors shrink-0',
            !isSidebarOpen && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item, index) => {
          if ('section' in item) {
            if (!isSidebarOpen) return <div key={index} className="h-px bg-border/50 my-2 mx-1" />;
            return (
              <div key={index} className="px-3 pt-5 pb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const isMaster = item.path === '/master';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : isMaster
                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className={cn(
                'text-sm font-semibold whitespace-nowrap transition-all duration-300 overflow-hidden',
                !isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}>
                {item.label}
              </span>
              {/* Tooltip when collapsed */}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-background text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t shrink-0">
        <button className={cn(
          'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors',
          !isSidebarOpen && 'justify-center'
        )}>
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <span className={cn(
            'text-sm font-semibold whitespace-nowrap transition-all duration-300 overflow-hidden',
            !isSidebarOpen ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}

import { useState, useEffect } from 'react';
import { Bell, Search, Moon, Sun, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

const notifications = [
  { id: 1, type: 'warning', title: 'Conta a pagar vencendo',  body: 'Fornecedor ABC – R$ 1.200 vence amanhã', time: '5 min', read: false },
  { id: 2, type: 'success', title: 'Pagamento recebido',       body: 'Cliente X efetuou pagamento de R$ 4.500', time: '1h',    read: false },
  { id: 3, type: 'info',    title: 'Boleto gerado',             body: 'Fatura #1042 foi emitida com sucesso',    time: '2h',    read: true  },
  { id: 4, type: 'warning', title: 'Licença vencendo',          body: 'Sua licença vence em 14 dias',            time: '1d',    read: true  },
];

export function Header() {
  const { user, tenant, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b bg-card/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between gap-4">
      {/* Search */}
      <div className="relative max-w-sm w-full hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar transações, contatos..."
          className="w-full pl-10 pr-4 py-2 bg-muted/50 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          title={isDark ? 'Modo Claro' : 'Modo Escuro'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground relative"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-card" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-card border rounded-2xl shadow-xl shadow-black/10 z-50 overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <span className="font-bold">Notificações</span>
                {unread > 0 && (
                  <span className="text-xs font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">{unread} novas</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                {notifications.map(n => (
                  <div key={n.id} className={cn(
                    'flex items-start gap-3 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer',
                    !n.read && 'bg-primary/5'
                  )}>
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-2 shrink-0',
                      n.type === 'warning' ? 'bg-amber-500' :
                      n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t text-center">
                <button className="text-sm text-primary font-semibold hover:underline">Ver todas as notificações</button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-border mx-1" />

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 hover:bg-muted rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(user?.name?.[0] ?? 'A').toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold leading-tight">{user?.name ?? 'Administrador'}</p>
              <p className="text-xs text-muted-foreground leading-tight">{tenant?.name ?? 'Empresa Teste'}</p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', showProfile && 'rotate-180')} />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border rounded-2xl shadow-xl shadow-black/10 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="font-bold text-sm">{user?.name ?? 'Administrador'}</p>
                <p className="text-xs text-muted-foreground">{user?.email ?? 'admin@empresa.com'}</p>
              </div>
              <div className="py-1">
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <User className="w-4 h-4 text-muted-foreground" /> Meu Perfil
                </button>
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" /> Configurações
                </button>
              </div>
              <div className="py-1 border-t">
                <button 
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-rose-600"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showProfile) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowProfile(false); }}
        />
      )}
    </header>
  );
}

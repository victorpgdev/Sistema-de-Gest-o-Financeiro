import { useState, useEffect } from 'react';
import { 
   Bell, Moon, Sun, Search, User, LogOut, Settings, 
  ChevronDown, CheckCircle2, Info, AlertTriangle, 
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
}

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setNotifications(data.map(n => ({
        id: n.id,
        title: n.title,
        desc: n.message,
        time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: n.type as any,
        read: n.is_read
      })));
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    if (user) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
    setShowUserMenu(false);
  };

  return (
    <header className="h-20 border-b bg-background/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="relative w-full max-w-md hidden md:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          placeholder="Buscar transações, contatos..." 
          className="w-full pl-11 pr-4 py-2.5 bg-muted/40 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-6 ml-auto">
        <button className="p-3 hover:bg-muted rounded-2xl transition-all relative group">
          <Moon className="w-5 h-5 text-muted-foreground group-hover:rotate-12 transition-transform" />
        </button>

        {/* Notificações */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className={cn(
              "p-3 hover:bg-muted rounded-2xl transition-all relative group",
              showNotifications && "bg-muted"
            )}
          >
            <Bell className="w-5 h-5 text-muted-foreground group-hover:shake-animation" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0" onClick={() => setShowNotifications(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-[400px] bg-card border rounded-[2rem] shadow-2xl overflow-hidden z-50 origin-top-right"
                >
                  <div className="p-6 border-b flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">Notificações</h3>
                      {unreadCount > 0 && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 text-[10px] font-black rounded-full uppercase tracking-tighter">{unreadCount} novas</span>}
                    </div>
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest"
                    >
                      <CheckCheck className="w-3 h-3" /> Limpar Tudo
                    </button>
                  </div>

                  <div className="max-h-[450px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-20 text-center text-muted-foreground italic text-sm">Nenhuma notificação por aqui.</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={cn(
                            "p-5 border-b hover:bg-muted/30 transition-all cursor-pointer flex items-start gap-4 active:scale-95",
                            !n.read && "bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                            n.type === 'warning' ? "bg-amber-100 text-amber-600" :
                            n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                            {n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                             n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
                             <Info className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className={cn("text-sm font-bold", !n.read ? "text-foreground" : "text-muted-foreground")}>{n.title}</h4>
                              <span className="text-[10px] font-bold text-muted-foreground">{n.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.desc}</p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-1.5 animate-pulse" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <button className="w-full p-5 text-sm font-bold text-primary hover:bg-muted/50 transition-colors bg-muted/20">
                    Ver todas as notificações
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Menu do Usuário */}
        <div className="relative">
          <button 
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 p-1.5 pr-4 hover:bg-muted rounded-2xl transition-all group"
          >
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform uppercase">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold leading-none mb-1">{user?.name || 'Usuário'}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{user?.role === 'MASTER' ? 'Painel Master' : 'Administrador'}</p>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", showUserMenu && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-card border rounded-[2rem] shadow-2xl overflow-hidden z-50 origin-top-right p-2"
                >
                  <button 
                    onClick={handleSettings}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted rounded-2xl text-sm font-bold transition-all group"
                  >
                    <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" /> Meus Dados
                  </button>
                  {(user?.role === 'MASTER' || user?.email === 'victorhugoperea89@gmail.com') && (
                    <button 
                      onClick={() => { navigate('/master'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-5 py-4 hover:bg-amber-500/10 rounded-2xl text-sm font-bold transition-all group text-amber-600"
                    >
                      <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Master Admin
                    </button>
                  )}
                  <button 
                    onClick={handleSettings}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted rounded-2xl text-sm font-bold transition-all group"
                  >
                    <Settings className="w-5 h-5 text-muted-foreground group-hover:rotate-45 transition-transform" /> Configurações
                  </button>
                  <div className="my-2 border-t border-dashed" />
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-rose-500/10 rounded-2xl text-sm font-bold text-rose-600 transition-all group"
                  >
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> Sair do Sistema
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

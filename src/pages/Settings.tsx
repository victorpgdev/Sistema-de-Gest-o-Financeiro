import { useState, useEffect } from 'react';
import { 
  User, Settings as SettingsIcon, Shield, Bell, 
  CreditCard, Camera, Loader2, CheckCircle2, 
  AlertCircle, Save, Mail, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

export function Settings() {
  const { user, initialize } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Estados dos formulários
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: profileForm.name })
        .eq('id', user?.id);

      if (error) throw error;

      setNotification({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      await initialize(); // Atualiza os dados no Store Global
    } catch (err: any) {
      setNotification({ type: 'error', message: `Erro ao atualizar: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 pb-20 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md text-white font-bold text-sm",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400" : "bg-rose-500/90 border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Ajustes</h1>
          <p className="text-sm text-muted-foreground font-medium">Gerencie sua conta e as preferências da plataforma.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar de Navegação dos Ajustes */}
        <aside className="w-full lg:w-64 space-y-2">
          {[
            { id: 'profile', icon: User, label: 'Meu Perfil' },
            { id: 'security', icon: Shield, label: 'Segurança' },
            { id: 'system', icon: SettingsIcon, label: 'Personalização' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" : "hover:bg-muted text-muted-foreground"
              )}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1">
          <div className="bg-card border rounded-[2.5rem] p-8 md:p-12 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
            
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-muted rounded-[2.5rem] flex items-center justify-center text-4xl overflow-hidden border-4 border-background shadow-xl">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <button type="button" className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-all opacity-0 group-hover:opacity-100">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold">{user?.name || 'Seu Nome'}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                       <Shield className="w-3 h-3" /> Nível {user?.role}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-dashed">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nome de Exibição</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
                        <input 
                          className="w-full pl-12 pr-4 py-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold transition-all"
                          value={profileForm.name}
                          onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 ml-1">E-mail (Não editável)</label>
                      <div className="relative opacity-60 grayscale cursor-not-allowed">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
                        <input className="w-full pl-12 pr-4 py-4 bg-muted/40 border rounded-2xl font-bold outline-none" value={profileForm.email} readOnly />
                      </div>
                   </div>
                </div>

                <div className="pt-6 flex justify-end">
                   <button 
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-50"
                   >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                     SALVAR ALTERAÇÕES
                   </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 py-10 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-rose-500/10 text-rose-600 rounded-3xl flex items-center justify-center animate-pulse">
                    <Shield className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold">Gerenciar Acesso</h2>
                 <p className="text-muted-foreground max-w-sm mb-6">Em breve você poderá trocar sua senha e ativar autenticação de dois fatores por aqui.</p>
                 <button className="px-8 py-3 bg-muted rounded-xl font-bold text-xs uppercase tracking-widest opacity-50 cursor-not-allowed">Habilitar 2FA</button>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-8 py-10 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-blue-500/10 text-blue-600 rounded-3xl flex items-center justify-center">
                    <Building2 className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-bold">Dados da Empresa</h2>
                 <p className="text-muted-foreground max-w-sm mb-6">Personalize os dados da sua empresa e o logotipo que aparece nos relatórios.</p>
                 <button className="px-8 py-3 border-2 border-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-all">Configurar Organização</button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

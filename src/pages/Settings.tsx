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
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.tenant_id) return;

    // SEGURANÇA 1: Tipo e Tamanho
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotification({ type: 'error', message: 'Apenas PNG, JPG ou WEBP são permitidos.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Tamanho máximo de 2MB excedido.' });
      return;
    }

    setIsUploading(true);
    try {
      // SEGURANÇA 2 (ANTI-HACKER): Re-renderizar via Canvas (Sanitização)
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0);
      
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(b => resolve(b!), 'image/webp', 0.8)
      );
      
      const fileName = `logos/${user.tenant_id}-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', user.tenant_id);

      if (updateError) throw updateError;
      
      setNotification({ type: 'success', message: 'Logotipo renovado e higienizado!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Ameaça detectada ou erro no processamento.' });
    } finally {
      setIsUploading(false);
    }
  };

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
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Identidade Visual</h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Personalize a cara da sua plataforma</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10 p-8 border border-dashed rounded-[2rem] bg-muted/20">
                  <div className="w-40 h-40 bg-card border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-[10px] font-black text-primary animate-pulse">HIGIENIZANDO...</span>
                      </div>
                    ) : (
                      <>
                        <Building2 className="w-10 h-10 text-slate-300" />
                        <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">Subir Logo</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </>
                    )}
                  </div>
                  <div className="flex-1 space-y-5">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-700">Logo da Empresa</h3>
                      <p className="text-sm text-muted-foreground font-medium italic leading-relaxed">
                        Recomendamos o formato PNG transparente. O sistema removerá metadados e scripts ocultos automaticamente para sua segurança.
                      </p>
                    </div>
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                      <Shield className="w-5 h-5 text-emerald-600 mt-0.5" />
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Proteção PG Secure Ativa</span>
                         <p className="text-xs text-emerald-600 font-medium leading-relaxed opacity-80">
                           Cada pixel é reprocessado para garantir que nenhum vírus ou script seja injetado através da imagem.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                   <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest ml-1">Cores da Interface</h3>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                        <button key={color} className="h-12 rounded-xl border-2 border-background shadow-sm hover:scale-105 transition-all" style={{ backgroundColor: color }} />
                      ))}
                      <button className="h-12 rounded-xl border-2 border-dashed flex items-center justify-center text-xs font-bold text-muted-foreground hover:bg-muted transition-all">Custom</button>
                   </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

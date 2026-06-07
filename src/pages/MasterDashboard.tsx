import { useState, useEffect } from 'react';
import { 
  Building2, Users, Shield, Plus, Search, 
  MoreVertical, Edit2, Trash2, CheckCircle2, 
  X, Loader2, Filter, Globe, Calendar, 
  CreditCard, Ban, Key, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';

export function MasterDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tenants' | 'profiles'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, tenants(name)').order('created_at', { ascending: false })
      ]);
      
      if (tRes.error) throw tRes.error;
      if (pRes.error) throw pRes.error;

      setTenants(tRes.data || []);
      setProfiles(pRes.data.map(p => ({ ...p, tenant_name: p.tenants?.name })) || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Erro ao sincronizar dados administrativos.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCreateClient = async (form: any) => {
    setIsLoading(true);
    try {
      // 1. Criar o Tenant (Chave Única)
      const { data: tenant, error: tError } = await supabase
        .from('tenants')
        .insert([{ name: form.companyName, plan: form.plan, status: 'active' }])
        .select()
        .single();

      if (tError) throw tError;

      // 2. Criar o Perfil vinculado ao Tenant via Chave
      const { error: pError } = await supabase
        .from('profiles')
        .insert([{ 
          email: form.email, 
          name: form.clientName, 
          role: 'OWNER', 
          tenant_id: tenant.id,
          status: 'active'
        }]);

      if (pError) throw pError;

      setNotification({ type: 'success', message: 'Novo cliente ativado com sucesso!' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Falha na ativação: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProfiles = profiles.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20 relative">
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel Master</h1>
            <p className="text-sm text-muted-foreground font-medium">Controle de acessos e licenciamento global.</p>
          </div>
        </div>
        <div className="flex bg-muted/40 p-1 rounded-2xl border">
          <button onClick={() => setActiveTab('tenants')} className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all", activeTab === 'tenants' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>EMPRESAS</button>
          <button onClick={() => setActiveTab('profiles')} className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all", activeTab === 'profiles' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>USUÁRIOS</button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            placeholder={activeTab === 'tenants' ? "Buscar empresa..." : "Buscar usuário..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all outline-none"
        >
          <Plus className="w-5 h-5 transition-transform" /> Novo Cliente
        </button>
      </div>

      <div className="bg-card border rounded-[2.5rem] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'tenants' ? (
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                  <tr>
                    <th className="px-8 py-5">Organização</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Plano</th>
                    <th className="px-6 py-5">ID Único (Chave)</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-8 py-5 font-bold">{t.name}</td>
                      <td className="px-6 py-5">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", t.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{t.status}</span>
                      </td>
                      <td className="px-6 py-5 font-bold text-xs">{t.plan}</td>
                      <td className="px-6 py-5 text-xs font-mono opacity-40">{t.id}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                           <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><Edit2 className="w-4 h-4" /></button>
                           <button className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg"><Ban className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Nome / E-mail</th>
                    <th className="px-6 py-5">Empresa</th>
                    <th className="px-6 py-5">Cargo</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="font-bold text-xs">{p.tenant_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold text-xs">{p.role}</td>
                      <td className="px-6 py-5">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", p.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{p.status || 'active'}</span>
                      </td>
                      <td className="px-8 py-5 text-right text-muted-foreground">
                         <button className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg"><Ban className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card border rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-8">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-bold tracking-tight">Novo Cliente</h2>
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Ativação de Empresa e Chave Única</p>
                   </div>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-muted rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
                </div>
                <ClientForm onSave={handleCreateClient} onCancel={() => setShowModal(false)} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClientForm({ onSave, onCancel }: any) {
  const [form, setForm] = useState({
    clientName: '',
    email: '',
    companyName: '',
    plan: 'Basic'
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nome do Responsável</label>
          <input className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold transition-all" placeholder="Ex: João Silva" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">E-mail de Acesso</label>
          <input className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold transition-all" placeholder="joao@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nome da Empresa</label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-40" />
          <input className="w-full pl-12 pr-4 py-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold transition-all" placeholder="Ex: PG Digital Ltda" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Plano de Licença</label>
        <select className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold cursor-pointer appearance-none" value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
           <option value="Basic">Basic (1 Usuário)</option>
           <option value="Pro">Pro (Até 5 Usuários)</option>
           <option value="Enterprise">Enterprise (Ilimitado)</option>
        </select>
      </div>

      <div className="mt-8 pt-6 border-t flex gap-4">
         <button onClick={onCancel} className="flex-1 py-4 border rounded-[1.5rem] font-bold text-muted-foreground hover:bg-muted transition-all">CANCELAR</button>
         <button onClick={() => onSave(form)} className="flex-1 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">ATIVAR LICENÇA</button>
      </div>
    </div>
  );
}

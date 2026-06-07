import { useState, useEffect } from 'react';
import { 
  Building2, Users, ShieldCheck, Loader2, X, MoreHorizontal,
  Calendar, Lock, Unlock, Trash2, Search, Edit3, CheckCircle2,
  AlertCircle, ChevronRight, UserX, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { Navigate } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  document: string;
  plan: string;
  status: 'active' | 'suspended';
  expires_at?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'banned';
  tenant_name?: string;
}

export function MasterDashboard() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showEditTenant, setShowEditTenant] = useState<Tenant | null>(null);

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
      console.error('Erro ao buscar dados master:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleTenantStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('tenants').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
  };

  const handleUpdateTenant = async (formData: any) => {
    const { error } = await supabase.from('tenants').update(formData).eq('id', showEditTenant?.id);
    if (!error) {
      fetchData();
      setShowEditTenant(null);
    }
  };

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = profiles.filter(p => p.email.toLowerCase().includes(searchTerm.toLowerCase()) || p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (currentUser?.role !== 'MASTER') return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
           <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-2xl font-bold tracking-tight">Painel Master</h1>
              <p className="text-sm text-muted-foreground font-medium">Controle de acessos e licenciamento global.</p>
           </div>
        </div>
        
        <div className="flex bg-muted/40 p-1 rounded-2xl border backdrop-blur-sm">
          <button onClick={() => { setActiveTab('tenants'); setSearchTerm(''); }} className={cn("px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest", activeTab === 'tenants' ? "bg-background shadow-md text-primary" : "text-muted-foreground")}>Empresas</button>
          <button onClick={() => { setActiveTab('users'); setSearchTerm(''); }} className={cn("px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest", activeTab === 'users' ? "bg-background shadow-md text-primary" : "text-muted-foreground")}>Usuários</button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 border rounded-3xl shadow-sm">
         <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              placeholder={activeTab === 'tenants' ? "Buscar empresa..." : "Buscar usuário..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-muted/30 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
         </div>
      </div>

      {/* Listagem */}
      <div className="bg-card border rounded-[2rem] shadow-xl shadow-muted/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <tr>
                {activeTab === 'tenants' ? (
                  <>
                    <th className="px-8 py-5">Organização</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-center">Plano</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-5">Usuário</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5">Empresa</th>
                    <th className="px-8 py-5 text-right">Controles</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></td></tr>
              ) : activeTab === 'tenants' ? (
                filteredTenants.map(t => (
                  <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-8 py-6">
                       <span className="font-bold text-sm block">{t.name}</span>
                       <span className="text-[10px] text-muted-foreground uppercase">ID: {t.id.substring(0,8)}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={cn("px-3 py-1 rounded-full text-[10px] font-black", t.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{t.status === 'active' ? "ATIVO" : "SUSPENSO"}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black">{t.plan}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleTenantStatus(t.id, t.status)} className="p-2 hover:bg-muted rounded-xl">{t.status === 'active' ? <Lock className="w-4 h-4 text-rose-500" /> : <Unlock className="w-4 h-4 text-emerald-600" />}</button>
                          <button onClick={() => setShowEditTenant(t)} className="p-2 hover:bg-muted rounded-xl"><Edit3 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredUsers.map(p => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-8 py-6">
                       <span className="font-bold text-sm block">{p.name || 'Sem Perfil'}</span>
                       <span className="text-xs text-muted-foreground">{p.email}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={cn("px-3 py-1 rounded-full text-[10px] font-black", p.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>{p.status === 'active' ? "ATIVO" : "BANIDO"}</span>
                    </td>
                    <td className="px-6 py-6">
                       <span className="text-xs font-bold text-muted-foreground uppercase">{p.tenant_name || 'Master'}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => toggleUserStatus(p.id, p.status)} 
                            className={cn("p-2 rounded-xl transition-all", p.status === 'active' ? "hover:bg-rose-50 text-rose-500" : "hover:bg-emerald-50 text-emerald-600")}
                            title={p.status === 'active' ? 'Banir Usuário' : 'Desbanir Usuário'}
                          >
                             {p.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button className="p-2 hover:bg-muted rounded-xl"><MoreHorizontal className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showEditTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card border rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-bold">Assinaturas e Licença</h2>
                   <button onClick={() => setShowEditTenant(null)} className="p-2 bg-muted rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-xs font-black text-muted-foreground uppercase opacity-60">Empresa</label>
                      <input className="w-full p-4 bg-muted/40 border rounded-2xl font-bold" value={showEditTenant.name} onChange={e => setShowEditTenant({...showEditTenant, name: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-xs font-black text-muted-foreground uppercase opacity-60">Plano</label>
                         <select className="w-full p-4 bg-muted/40 border rounded-2xl font-bold" value={showEditTenant.plan} onChange={e => setShowEditTenant({...showEditTenant, plan: e.target.value as any})}>
                            <option value="Basic">Basic</option>
                            <option value="Pro">Pro</option>
                            <option value="Enterprise">Enterprise</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-black text-muted-foreground uppercase opacity-60">Vencimento</label>
                         <input type="date" className="w-full p-4 bg-muted/40 border rounded-2xl font-bold" value={showEditTenant.expires_at?.split('T')[0] || ''} onChange={e => setShowEditTenant({...showEditTenant, expires_at: e.target.value})} />
                      </div>
                   </div>
                </div>
                <div className="mt-10 flex gap-4">
                   <button onClick={() => setShowEditTenant(null)} className="flex-1 py-4 border rounded-2xl font-bold text-muted-foreground">Cancelar</button>
                   <button onClick={() => handleUpdateTenant(showEditTenant)} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20">Salvar Alterações</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

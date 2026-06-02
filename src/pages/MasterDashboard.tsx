import { useState, useEffect } from 'react';
import { 
  Building2, Users, ShieldCheck, Loader2, X, MoreHorizontal,
  Calendar, Lock, Unlock, Trash2, Search, Edit3, CheckCircle2,
  AlertCircle, ChevronRight
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
  tenant_name?: string;
}

export function MasterDashboard() {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modais
  const [showEditTenant, setShowEditTenant] = useState<Tenant | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    const [tRes, pRes] = await Promise.all([
      supabase.from('tenants').select('*').order('name'),
      supabase.from('profiles').select('*, tenants(name)')
    ]);
    if (!tRes.error) setTenants(tRes.data || []);
    if (!pRes.error) setProfiles(pRes.data.map(p => ({ ...p, tenant_name: p.tenants?.name })) || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleTenantStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('tenants').update({ status: newStatus }).eq('id', id);
    fetchData();
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
              <p className="text-sm text-muted-foreground font-medium">Gestão centralizada de infraestrutura e receita SaaS.</p>
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
         <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground px-2">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {tenants.length} ATIVAS</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> {tenants.filter(t => t.status === 'suspended').length} BLOQUEADAS</div>
         </div>
      </div>

      {/* Listagem */}
      <div className="bg-card border rounded-[2rem] shadow-xl shadow-muted/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/30 border-b text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              <tr>
                {activeTab === 'tenants' ? (
                  <>
                    <th className="px-8 py-5">Organização / ID</th>
                    <th className="px-6 py-5 text-center">Plano</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-center">Vencimento</th>
                    <th className="px-8 py-5 text-right">Controles</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-5">Perfil / Autenticação</th>
                    <th className="px-6 py-5">Empresa Vinculada</th>
                    <th className="px-6 py-5 text-center">Nível</th>
                    <th className="px-8 py-5 text-right">Gerenciar</th>
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
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center font-bold">{t.name[0]}</div>
                         <div>
                            <div className="font-bold text-sm text-foreground">{t.name}</div>
                            <div className="text-[10px] font-medium text-muted-foreground opacity-60">SaaS Node: {t.id.substring(0,8)}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-[10px] font-black">{t.plan}</span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold",
                        t.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600 border border-rose-100"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", t.status === 'active' ? "bg-emerald-500" : "bg-rose-500")} />
                        {t.status === 'active' ? 'ATIVA' : 'SUSPENSA'}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold tabular-nums text-muted-foreground">{t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'ILIMITADA'}</span>
                        {t.expires_at && (
                           <span className="text-[8px] font-black text-rose-500 uppercase mt-0.5">Renovação Mensal</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => toggleTenantStatus(t.id, t.status)} className={cn("p-2 rounded-xl transition-all", t.status === 'active' ? "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white")}>
                          {t.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setShowEditTenant(t)} className="p-2 bg-muted text-muted-foreground rounded-xl hover:bg-primary hover:text-white transition-all">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredUsers.map(p => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xs font-black">{p.name?.[0] || '?'}</div>
                          <div>
                             <div className="font-bold text-sm">{p.name || 'Pendente de Perfil'}</div>
                             <div className="text-xs text-muted-foreground">{p.email}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                         <Building2 className="w-3 h-3 text-muted-foreground" />
                         <span className="text-xs font-semibold text-muted-foreground uppercase">{p.tenant_name || 'Admin Master'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[10px] font-black border",
                         p.role === 'MASTER' ? "border-amber-200 bg-amber-50 text-amber-600" : "border-blue-100 bg-blue-50 text-blue-600"
                       )}>{p.role}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 hover:bg-muted rounded-xl transition-all opacity-40 hover:opacity-100">
                          <MoreHorizontal className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Tenant */}
      <AnimatePresence>
        {showEditTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/60 backdrop-blur-xl">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-card border rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative border-white/20"
            >
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ajustes de Conta SaaS</h2>
                    <p className="text-xs text-muted-foreground font-medium italic">ID: {showEditTenant.id}</p>
                  </div>
                  <button onClick={() => setShowEditTenant(null)} className="p-3 bg-muted rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nome Fantasia</label>
                        <input className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none transition-all font-bold" defaultValue={showEditTenant.name} onChange={e => setShowEditTenant({...showEditTenant, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Plano Atual</label>
                        <select className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" defaultValue={showEditTenant.plan} onChange={e => setShowEditTenant({...showEditTenant, plan: e.target.value})}>
                           <option value="Basic">Basic</option>
                           <option value="Pro">Pro</option>
                           <option value="Enterprise">Enterprise</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> Data de Expiração da Licença</label>
                     <input type="date" className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold tabular-nums" defaultValue={showEditTenant.expires_at ? showEditTenant.expires_at.split('T')[0] : ''} onChange={e => setShowEditTenant({...showEditTenant, expires_at: e.target.value})} />
                  </div>
               </div>

               <div className="mt-10 flex gap-4">
                  <button onClick={() => setShowEditTenant(null)} className="flex-1 py-4 border rounded-[1.5rem] font-bold text-muted-foreground hover:bg-muted">DESCARTAR</button>
                  <button onClick={() => handleUpdateTenant(showEditTenant)} className="flex-1 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">SALVAR ALTERAÇÕES</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

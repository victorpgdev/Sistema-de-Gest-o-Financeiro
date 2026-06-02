import { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, CheckCircle2, 
  Plus, Search, MoreHorizontal, Activity, ShieldCheck, Loader2, X,
  UserPlus, Mail, Shield, User
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
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        supabase.from('tenants').select('*'),
        supabase.from('profiles').select('*, tenants(name)')
      ]);
      if (!tRes.error) setTenants(tRes.data || []);
      if (!pRes.error) setProfiles(pRes.data.map(p => ({ ...p, tenant_name: p.tenants?.name })) || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveTenant = async (formData: any) => {
    const { error } = await supabase.from('tenants').insert([formData]);
    if (!error) {
      fetchData();
      setShowModal(false);
    } else {
      alert(error.message);
    }
  };

  if (currentUser?.role !== 'MASTER') return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      {/* Header Clean */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Painel Administrativo</h1>
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Gerenciamento global de infraestrutura e acessos.</p>
        </div>
        
        <div className="flex bg-muted/40 p-1 rounded-xl border">
          <button 
            onClick={() => setActiveTab('tenants')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'tenants' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >Empresas</button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'users' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >Usuários</button>
        </div>
      </div>

      {/* Stats Cards Clean */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Empresas Ativas', value: tenants.length, icon: Building2 },
          { label: 'Usuários Totais', value: profiles.length, icon: Users },
          { label: 'Receita Sistêmica', value: formatCurrency(tenants.length * 1500), icon: CreditCard },
        ].map((stat, i) => (
          <div key={i} className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">{stat.label}</p>
              <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-card border rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {activeTab === 'tenants' ? 'Listagem de Empresas' : 'Usuários do Sistema'}
            </h3>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> 
              {activeTab === 'tenants' ? 'Cadastrar Empresa' : 'Adicionar Usuário'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b text-xs font-semibold text-muted-foreground">
                <tr>
                  {activeTab === 'tenants' ? (
                    <>
                      <th className="px-6 py-4">Empresa / SaaS ID</th>
                      <th className="px-6 py-4">Documento</th>
                      <th className="px-6 py-4 text-center">Plano</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">Usuário / ID</th>
                      <th className="px-6 py-4">Organização</th>
                      <th className="px-6 py-4 text-center">Permissão</th>
                      <th className="px-6 py-4 text-center">Data</th>
                    </>
                  )}
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                ) : activeTab === 'tenants' ? (
                  tenants.map(t => (
                    <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">#{t.id.substring(0,8)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{t.document}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-primary">{t.plan}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold",
                          t.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                        )}>{t.status === 'active' ? 'ATIVA' : 'SUSPENSA'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  profiles.map(p => (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{p.name || 'Sem Nome'}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-muted-foreground">{p.tenant_name || 'MASTER'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 border rounded text-[10px] font-bold text-muted-foreground uppercase">{p.role}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-muted-foreground">05/08/24</td>
                      <td className="px-6 py-4 text-right cursor-pointer">
                         <MoreHorizontal className="w-4 h-4 text-muted-foreground ml-auto" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal Reutilizável Clean */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-card border rounded-2xl p-8 w-full max-w-lg shadow-2xl relative"
             >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold">{activeTab === 'tenants' ? 'Nova Empresa' : 'Adicionar Usuário'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-full"><X className="w-5 h-5" /></button>
                </div>

                {activeTab === 'tenants' ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Nome da Organização</label>
                      <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium" placeholder="Ex: Fama Contábil" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Documento (CNPJ/CPF)</label>
                      <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium" placeholder="00.000.000/0001-00" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-6">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserPlus className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-balance text-muted-foreground font-medium px-8">
                      Para criar usuários reais para terceiros, utilize o painel de <b>Authentication</b> do Supabase para garantir a segurança da senha.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 mt-8 pt-6 border-t font-semibold">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
                  <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20">Confirmar</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

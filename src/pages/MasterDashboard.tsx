import { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, ShieldCheck, Loader2, X, MoreHorizontal,
  Calendar, Lock, Unlock, ArrowDownCircle, Trash2
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
    const { error } = await supabase.from('tenants').update({ status: newStatus }).eq('id', id);
    if (!error) fetchData();
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Deseja excluir este perfil? (Isso não exclui a conta no Supabase)')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) fetchData();
  };

  if (currentUser?.role !== 'MASTER') return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">Administração Master</h1>
            <ShieldCheck className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Controle de licenças, acessos e faturamento global.</p>
        </div>
        
        <div className="flex bg-muted/40 p-1 rounded-xl border">
          <button onClick={() => setActiveTab('tenants')} className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'tenants' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}>Empresas</button>
          <button onClick={() => setActiveTab('users')} className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'users' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}>Usuários</button>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b bg-muted/20">
          <h3 className="text-base font-semibold">{activeTab === 'tenants' ? 'Gestão de Licenças' : 'Usuários Cadastrados'}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b text-xs font-semibold text-muted-foreground">
              <tr>
                {activeTab === 'tenants' ? (
                  <>
                    <th className="px-6 py-4">Empresa / SaaS ID</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Data Vencimento</th>
                    <th className="px-6 py-4 text-right">Ações Rápidas</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">Nome / E-mail</th>
                    <th className="px-6 py-4">Nível</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : activeTab === 'tenants' ? (
                tenants.map(t => (
                  <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">{t.id}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold",
                        t.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600 border border-rose-200"
                      )}>{t.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-medium text-muted-foreground font-mono">
                      {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'ILIMITADO'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => toggleTenantStatus(t.id, t.status)}
                          className={cn("p-2 rounded-lg transition-colors", t.status === 'active' ? "hover:bg-rose-50 text-rose-500" : "hover:bg-emerald-50 text-emerald-600")}
                          title={t.status === 'active' ? 'Bloquear Empresa' : 'Ativar Empresa'}
                        >
                          {t.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                profiles.map(p => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm">{p.name || 'Pendente de Sincro.'}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 border rounded text-[10px] font-bold",
                        p.role === 'MASTER' ? "border-amber-200 text-amber-600" : "border-blue-200 text-blue-600"
                      )}>{p.role}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => deleteProfile(p.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg group-hover:opacity-100 opacity-0 transition-all">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

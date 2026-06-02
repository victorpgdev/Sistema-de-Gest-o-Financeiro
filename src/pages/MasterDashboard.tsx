import { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, AlertCircle, CheckCircle2, 
  Plus, Search, MoreVertical, Activity, ShieldCheck, Loader2, X,
  UserPlus, Mail, Shield
} from 'lucide-react';
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
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tenants' | 'users'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const [tRes, pRes] = await Promise.all([
      supabase.from('tenants').select('*'),
      supabase.from('profiles').select('*, tenants(name)')
    ]);
    if (!tRes.error) setTenants(tRes.data || []);
    if (!pRes.error) setProfiles(pRes.data.map(p => ({ ...p, tenant_name: p.tenants?.name })) || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (user?.role !== 'MASTER') return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black tracking-tight uppercase">Master Admin</h1>
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Controle global de empresas e acessos.</p>
        </div>
        <div className="flex gap-2 p-1 bg-muted rounded-2xl">
           <button 
             onClick={() => setActiveTab('tenants')}
             className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'tenants' ? "bg-card shadow text-primary" : "text-muted-foreground")}
           >Empresas</button>
           <button 
             onClick={() => setActiveTab('users')}
             className={cn("px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'users' ? "bg-card shadow text-primary" : "text-muted-foreground")}
           >Usuários</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="p-8 bg-card border rounded-[2rem] shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Clientes</p>
            <h3 className="text-3xl font-black">{tenants.length}</h3>
         </div>
         <div className="p-8 bg-card border rounded-[2rem] shadow-sm">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Usuários</p>
            <h3 className="text-3xl font-black">{profiles.length}</h3>
         </div>
         <div className="p-8 bg-card border rounded-[2rem] shadow-sm col-span-1 md:col-span-2 bg-primary/5 border-primary/20">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Licença Master</p>
            <h3 className="text-2xl font-black">Sistema PG Financial v4.5</h3>
         </div>
      </div>

      {activeTab === 'tenants' ? (
        <div className="bg-card border rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-8 border-b flex items-center justify-between bg-muted/20">
            <h3 className="text-xl font-black uppercase tracking-tighter">Empresas Cadastradas</h3>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/30">Cadastrar Empresa</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Nome</th>
                <th className="px-6 py-5">Documento</th>
                <th className="px-6 py-5">Plano</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {tenants.map(t => (
                 <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                   <td className="px-8 py-5">
                      <p className="font-black text-sm uppercase">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">ID: {t.id.substring(0,8)}</p>
                   </td>
                   <td className="px-6 py-5 font-bold text-sm text-muted-foreground">{t.document}</td>
                   <td className="px-6 py-5 font-black uppercase text-xs">{t.plan}</td>
                   <td className="px-8 py-5 text-right"><button className="p-2 hover:bg-muted rounded-xl"><MoreVertical className="w-5 h-5 text-muted-foreground" /></button></td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card border rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="p-8 border-b flex items-center justify-between bg-muted/20">
            <h3 className="text-xl font-black uppercase tracking-tighter">Usuários do Sistema</h3>
            <button onClick={() => alert('Para criar um login funcional, cadastre o usuário no Supabase Auth com este e-mail.')} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/30">Criar Usuário</button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-muted/30 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Nome / E-mail</th>
                <th className="px-6 py-5">Empresa Vinc.</th>
                <th className="px-6 py-5">Nível</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {profiles.map(p => (
                 <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                   <td className="px-8 py-5">
                      <p className="font-black text-sm uppercase">{p.name || 'Sem Nome'}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{p.email}</p>
                   </td>
                   <td className="px-6 py-5 font-bold text-xs uppercase text-muted-foreground">{p.tenant_name || 'MASTER'}</td>
                   <td className="px-6 py-5">
                      <span className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest", p.role === 'MASTER' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                        {p.role}
                      </span>
                   </td>
                   <td className="px-8 py-5 text-right"><button className="p-2 hover:bg-muted rounded-xl"><MoreVertical className="w-5 h-5 text-muted-foreground" /></button></td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

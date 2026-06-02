import { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, AlertCircle, CheckCircle2, 
  Plus, Search, MoreVertical, Activity, ShieldCheck, Loader2, X 
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { Navigate } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  document: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  status: 'active' | 'suspended';
  created_at: string;
}

export function MasterDashboard() {
  const { user } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTenants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: false });
    if (!error) setTenants(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (formData: any) => {
    const { error } = await supabase.from('tenants').insert([formData]);
    if (!error) {
      fetchTenants();
      setShowModal(false);
    }
  };

  if (user?.role !== 'MASTER') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black tracking-tight uppercase">Master Admin</h1>
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Controle global de empresas e licenças.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-[2rem] font-black shadow-xl shadow-primary/30 hover:scale-105 transition-all active:scale-95 text-sm tracking-widest uppercase"
        >
          <Plus className="w-5 h-5" /> Cadastrar Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Empresas Ativas', value: tenants.filter(t => t.status === 'active').length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'MRR Estimado', value: formatCurrency(tenants.length * 1500), icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Plataforma', value: 'v4.2.0', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Status API', value: 'Online', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <div key={i} className="p-8 bg-card border rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black tabular-nums">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/20">
          <h3 className="text-xl font-black uppercase tracking-tighter">Gestão de Empresas</h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CNPJ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-muted border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/40 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Empresa</th>
                <th className="px-6 py-6">Documento</th>
                <th className="px-6 py-6">Plano</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : tenants.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-sm font-black uppercase tracking-tighter">
                        {t.name.substring(0,2)}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">SaaS ID: #{t.id.substring(0,8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-sm text-muted-foreground">{t.document}</td>
                  <td className="px-6 py-6 font-black uppercase text-xs tracking-widest">{t.plan}</td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                      t.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {t.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 hover:bg-muted rounded-2xl transition-all">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TenantModal 
          onClose={() => setShowModal(false)} 
          onSave={handleCreateTenant} 
        />
      )}
    </div>
  );
}

function TenantModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({ name: '', document: '', plan: 'Pro', status: 'active' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-card border rounded-[3rem] p-10 w-full max-w-lg shadow-2xl space-y-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Nova Empresa</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Empresa</label>
            <input className="w-full p-5 bg-muted border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 font-bold" placeholder="Razão Social ou Nome Fantasia" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CNPJ / CPF</label>
            <input className="w-full p-5 bg-muted border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 font-bold" placeholder="00.000.000/0001-00" value={form.document} onChange={e => setForm({...form, document: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Plano Adquirido</label>
              <select className="w-full p-5 bg-muted border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 font-bold" value={form.plan} onChange={e => setForm({...form, plan: e.target.value as any})}>
                <option value="Basic">Plano Básico</option>
                <option value="Pro">Plano Pro</option>
                <option value="Enterprise">Plano Enterprise</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="flex-1 py-5 border-2 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-muted transition-all">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 active:scale-95 transition-all">Ativar Licença</button>
        </div>
      </div>
    </div>
  );
}

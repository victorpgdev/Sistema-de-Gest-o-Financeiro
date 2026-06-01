import { useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Search,
  MoreVertical,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useAuthStore } from '@/store';
import { Navigate } from 'react-router-dom';

const growthData = [
  { name: 'Jan', revenue: 50000 },
  { name: 'Fev', revenue: 55000 },
  { name: 'Mar', revenue: 62000 },
  { name: 'Abr', revenue: 75000 },
  { name: 'Mai', revenue: 82000 },
  { name: 'Jun', revenue: 95000 },
];

const masterStats = [
  { label: 'Empresas Ativas', value: '142', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Usuários Totais', value: '1,284', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'MRR (Recorrência)', value: formatCurrency(95000), icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Taxa de Churn', value: '1.2%', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

const companies = [
  { id: '1', name: 'FAMA CONTABIL E EMPRESARIAL LTDA', document: '20.627.513/0001-34', segment: 'Contabilidade', plan: 'Enterprise', status: 'active', members: 45, expires: '2025-06-01' },
  { id: '2', name: 'Lopes Advocacia', document: '12.345.678/0001-90', segment: 'Advocacia', plan: 'Pro', status: 'active', members: 12, expires: '2025-01-15' },
  { id: '3', name: 'Tech Solutions Ltda', document: '98.765.432/0001-10', segment: 'Serviços', plan: 'Basic', status: 'suspended', members: 5, expires: '2024-05-20' },
  { id: '4', name: 'Clínica Sorriso', document: '44.555.666/0001-77', segment: 'Clínica', plan: 'Pro', status: 'active', members: 24, expires: '2024-11-30' },
];

export function MasterDashboard() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Only allow MASTER users
  if (user?.role !== 'MASTER') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Painel Master Admin</h1>
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground">Visão global da plataforma e controle de licenças.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
          <Plus className="w-5 h-5" />
          Cadastrar Empresa
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {masterStats.map((stat, i) => (
          <div key={i} className="p-6 bg-card border rounded-3xl shadow-sm hover:shadow-md transition-all group">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight tabular-nums">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 p-8 bg-card border rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Crescimento de Receita (MRR)</h3>
            <div className="flex gap-2">
              <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                +18.5% este mês
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.5)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   formatter={(val: any) => [formatCurrency(val as number), 'Receita']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="p-8 bg-card border rounded-3xl shadow-sm flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-8">Distribuição de Planos</h3>
          <div className="space-y-6">
            {[
              { label: 'Plano Enterprise', count: 18, color: 'bg-primary' },
              { label: 'Plano Pro', count: 64, color: 'bg-blue-400' },
              { label: 'Plano Basic', count: 48, color: 'bg-slate-400' },
              { label: 'Free Trial', count: 12, color: 'bg-muted' },
            ].map((plan, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">{plan.label}</span>
                  <span>{plan.count}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", plan.color)} 
                    style={{ width: `${(plan.count / 142) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Gestão de Empresas</h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome, CNPJ ou segmento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-muted/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Empresa</th>
                <th className="px-6 py-5">CNPJ</th>
                <th className="px-6 py-5">Plano</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((company) => (
                <tr key={company.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {company.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{company.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{company.members} usuários ativos</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-muted-foreground">{company.document}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                      company.plan === 'Enterprise' ? 'bg-amber-100 text-amber-700' : 
                      company.plan === 'Pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}>
                      {company.plan}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      {company.status === 'active' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[11px] font-bold uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ativa
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-lg text-[11px] font-bold uppercase">
                          <AlertCircle className="w-3.5 h-3.5" /> Suspensa
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

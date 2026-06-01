import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const monthlyData = [
  { name: 'Jan', receita: 42000, despesa: 24000 },
  { name: 'Fev', receita: 38000, despesa: 18000 },
  { name: 'Mar', receita: 55000, despesa: 32000 },
  { name: 'Abr', receita: 47000, despesa: 28000 },
  { name: 'Mai', receita: 61000, despesa: 35000 },
  { name: 'Jun', receita: 58000, despesa: 30000 },
  { name: 'Jul', receita: 72000, despesa: 38000 },
];

const categoryData = [
  { name: 'Serviços', value: 42000 },
  { name: 'Produtos', value: 28000 },
  { name: 'Assinat.', value: 15000 },
  { name: 'Outros',   value: 8000 },
];

const stats = [
  { label: 'Saldo Atual',    value: 125430.50, trend: '+12.5%', isPositive: true,  icon: DollarSign  },
  { label: 'Receita Mensal', value: 72000.00,  trend: '+8.2%',  isPositive: true,  icon: TrendingUp  },
  { label: 'Despesa Mensal', value: 38000.00,  trend: '+3.1%',  isPositive: false, icon: TrendingDown },
  { label: 'Lucro Líquido',  value: 34000.00,  trend: '+15.3%', isPositive: true,  icon: ArrowUpRight },
];

const recentTransactions = [
  { id: 1, description: 'Consultoria Mensal – Empresa X',   date: '28/07/24', amount: 12000.00, type: 'income',  status: 'paid'    },
  { id: 2, description: 'Assinatura AWS',                   date: '27/07/24', amount: 450.20,   type: 'expense', status: 'paid'    },
  { id: 3, description: 'Pagamento Fornecedor LogiTech',    date: '26/07/24', amount: 3200.00,  type: 'expense', status: 'pending' },
  { id: 4, description: 'Venda de Licença Software SaaS',  date: '25/07/24', amount: 4500.00,  type: 'income',  status: 'paid'    },
  { id: 5, description: 'Salários Equipe – Julho',          date: '24/07/24', amount: 18500.00, type: 'expense', status: 'pending' },
];

const alerts = [
  { type: 'warning', text: '3 contas a pagar vencem nos próximos 5 dias — R$ 6.200,00' },
  { type: 'success', text: '5 faturas recebidas esta semana — R$ 28.400,00' },
  { type: 'warning', text: 'Licença da empresa vence em 14 dias' },
];

const PERIODS = ['7 dias', 'Este Mês', 'Último Trimestre', 'Este Ano'];

export function Dashboard() {
  const [period, setPeriod] = useState('Este Mês');

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Resumo completo da saúde financeira da sua empresa.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl border">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                period === p
                  ? 'bg-card shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium border',
              a.type === 'warning'
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            )}
          >
            {a.type === 'warning'
              ? <AlertTriangle className="w-4 h-4 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {a.text}
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-full',
                stat.isPositive
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-rose-500/10 text-rose-600'
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(stat.value)}</h3>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 p-6 bg-card border rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Receita × Despesa</h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="w-3 h-3 rounded-full bg-primary inline-block" /> Receita
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Despesa
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
                  tickFormatter={(v: number) => `R$ ${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,.08)',
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="receita" stroke="var(--color-primary)"
                  strokeWidth={3} fillOpacity={1} fill="url(#gradReceita)" />
                <Area type="monotone" dataKey="despesa" stroke="#ef4444"
                  strokeWidth={2.5} fillOpacity={1} fill="url(#gradDespesa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="p-6 bg-card border rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">Receita por Categoria</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ left: 0, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={idx === 0 ? 'var(--color-primary)' : `hsl(221 83% ${53 + idx * 12}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-4 space-y-2">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="font-bold">{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="text-lg font-bold">Últimas Transações</h3>
          <button className="text-sm text-primary font-semibold hover:underline">Ver todas →</button>
        </div>
        <div className="divide-y divide-border/50">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                )}>
                  {t.type === 'income'
                    ? <ArrowUpRight className="w-5 h-5" />
                    : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.date}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={cn(
                  'font-bold text-sm tabular-nums',
                  t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                )}>
                  {t.type === 'income' ? '+' : '–'} {formatCurrency(t.amount)}
                </p>
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  t.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                )}>
                  {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const DATA_7D = [
  { name: 'Seg', receita: 3200, despesa: 1800 },
  { name: 'Ter', receita: 4100, despesa: 2200 },
  { name: 'Qua', receita: 2800, despesa: 3100 },
  { name: 'Qui', receita: 5600, despesa: 1400 },
  { name: 'Sex', receita: 7200, despesa: 2900 },
  { name: 'Sáb', receita: 1200, despesa: 800  },
  { name: 'Dom', receita: 900,  despesa: 400  },
];
const DATA_MES = [
  { name: 'Jan', receita: 42000, despesa: 24000 },
  { name: 'Fev', receita: 38000, despesa: 18000 },
  { name: 'Mar', receita: 55000, despesa: 32000 },
  { name: 'Abr', receita: 47000, despesa: 28000 },
  { name: 'Mai', receita: 61000, despesa: 35000 },
  { name: 'Jun', receita: 58000, despesa: 30000 },
  { name: 'Jul', receita: 72000, despesa: 38000 },
];
const DATA_TRIM = [
  { name: 'Q1 2024', receita: 135000, despesa: 74000 },
  { name: 'Q2 2024', receita: 166000, despesa: 93000 },
  { name: 'Q3 2024', receita: 185000, despesa: 103000 },
  { name: 'Q4 2024', receita: 210000, despesa: 118000 },
];
const DATA_ANO = [
  { name: '2021', receita: 380000, despesa: 260000 },
  { name: '2022', receita: 520000, despesa: 310000 },
  { name: '2023', receita: 696000, despesa: 388000 },
  { name: '2024', receita: 696000, despesa: 388000 },
];

const CATEGORY_DATA = [
  { name: 'Serviços',    value: 42000, color: '#3b82f6' },
  { name: 'Produtos',    value: 28000, color: '#8b5cf6' },
  { name: 'Assinat.',    value: 15000, color: '#06b6d4' },
  { name: 'Reembolsos',  value: 8000,  color: '#10b981' },
  { name: 'Outros',      value: 5000,  color: '#f59e0b' },
];

const PERIODS = ['7 dias', 'Este Mês', 'Trimestre', 'Anual'] as const;
type Period = typeof PERIODS[number];

const DATA_MAP: Record<Period, typeof DATA_7D> = {
  '7 dias':   DATA_7D,
  'Este Mês': DATA_MES,
  'Trimestre': DATA_TRIM,
  'Anual':    DATA_ANO,
};

const recentTransactions = [
  { id: 1, description: 'Consultoria Mensal – Empresa X',  date: '28/07/24', amount: 12000.00, type: 'income',  status: 'paid'    },
  { id: 2, description: 'Assinatura AWS',                  date: '27/07/24', amount: 450.20,   type: 'expense', status: 'paid'    },
  { id: 3, description: 'Salários Equipe – Julho',         date: '26/07/24', amount: 18500.00, type: 'expense', status: 'pending' },
  { id: 4, description: 'Venda de Licença SaaS',           date: '25/07/24', amount: 4500.00,  type: 'income',  status: 'paid'    },
  { id: 5, description: 'Aluguel do Escritório',           date: '24/07/24', amount: 2800.00,  type: 'expense', status: 'paid'    },
];

const alerts = [
  { type: 'warning', text: '3 contas a pagar vencem nos próximos 5 dias — R$ 6.200,00' },
  { type: 'success', text: '5 faturas recebidas esta semana — R$ 28.400,00' },
  { type: 'warning', text: 'Saldo em Caixa Interna abaixo do mínimo configurado' },
];

export function Dashboard() {
  const [period, setPeriod] = useState<Period>('Este Mês');
  const chartData = DATA_MAP[period];

  const totals = useMemo(() => {
    const rec = chartData.reduce((s, d) => s + d.receita, 0);
    const des = chartData.reduce((s, d) => s + d.despesa, 0);
    return { receita: rec, despesa: des, lucro: rec - des };
  }, [chartData]);

  const stats = [
    { label: 'Saldo Atual',    value: 125430.50,    trend: '+12.5%', up: true,  icon: DollarSign  },
    { label: 'Total Receitas', value: totals.receita, trend: '+8.2%', up: true,  icon: TrendingUp  },
    { label: 'Total Despesas', value: totals.despesa, trend: '+3.1%', up: false, icon: TrendingDown },
    { label: 'Lucro Líquido',  value: totals.lucro,   trend: '+15.3%',up: true,  icon: ArrowUpRight },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Header + Period */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Resumo completo da saúde financeira.</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                period === p ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
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
          <div key={i} className={cn(
            'flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium border',
            a.type === 'warning'
              ? 'bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
          )}>
            <span className="shrink-0 w-2 h-2 rounded-full inline-block" style={{
              backgroundColor: a.type === 'warning' ? '#f59e0b' : '#10b981'
            }} />
            {a.text}
          </div>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <s.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-full',
                s.up ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
              )}>
                {s.trend}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">{s.label}</p>
            <h3 className="text-2xl font-bold mt-1 tabular-nums">{formatCurrency(s.value)}</h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => v >= 1000 ? `${v / 1000}k` : String(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v: any) => formatCurrency(v as number)}
                />
                <Area type="monotone" dataKey="receita" stroke="#3b82f6" strokeWidth={3} fill="url(#gRec)" name="Receita" />
                <Area type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={2.5} fill="url(#gDes)" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 bg-card border rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold mb-6">Receita por Categoria</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} margin={{ left: 0, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  formatter={(v: any) => formatCurrency(v as number)}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {CATEGORY_DATA.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2.5">
            {CATEGORY_DATA.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
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
          <a href="/receber" className="text-sm text-primary font-semibold hover:underline">Ver todas →</a>
        </div>
        <div className="divide-y divide-border/50">
          {recentTransactions.map(t => (
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
                  t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
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

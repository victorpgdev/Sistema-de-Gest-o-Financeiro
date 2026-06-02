import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Scale, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const PERIODS = ['Diário', 'Semanal', 'Mensal', 'Anual'] as const;
type Period = typeof PERIODS[number];

const RAW: Record<Period, { name: string; entrada: number; saida: number }[]> = {
  Diário: [
    { name: 'Seg', entrada: 3200, saida: 1800 },
    { name: 'Ter', entrada: 4100, saida: 2200 },
    { name: 'Qua', entrada: 2800, saida: 3100 },
    { name: 'Qui', entrada: 5600, saida: 1400 },
    { name: 'Sex', entrada: 7200, saida: 2900 },
    { name: 'Sáb', entrada: 1200, saida: 800 },
    { name: 'Dom', entrada: 900,  saida: 400 },
  ],
  Semanal: [
    { name: 'S1', entrada: 18000, saida: 9200 },
    { name: 'S2', entrada: 22500, saida: 14000 },
    { name: 'S3', entrada: 31000, saida: 18500 },
    { name: 'S4', entrada: 29000, saida: 16200 },
  ],
  Mensal: [
    { name: 'Jan', entrada: 42000, saida: 24000 },
    { name: 'Fev', entrada: 38000, saida: 18000 },
    { name: 'Mar', entrada: 55000, saida: 32000 },
    { name: 'Abr', entrada: 47000, saida: 28000 },
    { name: 'Mai', entrada: 61000, saida: 35000 },
    { name: 'Jun', entrada: 58000, saida: 30000 },
    { name: 'Jul', entrada: 72000, saida: 38000 },
  ],
  Anual: [
    { name: '2021', entrada: 380000, saida: 260000 },
    { name: '2022', entrada: 520000, saida: 310000 },
    { name: '2023', entrada: 696000, saida: 388000 },
    { name: '2024', entrada: 820000, saida: 450000 },
  ],
};

const EXTRACT = [
  { date: '28/07', description: 'Consultoria Mensal – X',  type: 'income',  amount: 12000 },
  { date: '27/07', description: 'Assinatura AWS',           type: 'expense', amount: 450   },
  { date: '26/07', description: 'Venda Licença SaaS',       type: 'income',  amount: 4500  },
  { date: '25/07', description: 'Salários Equipe',          type: 'expense', amount: 18500 },
  { date: '24/07', description: 'Aluguel Escritório',       type: 'expense', amount: 2800  },
  { date: '23/07', description: 'Contrato Anual – ABC',     type: 'income',  amount: 36000 },
  { date: '22/07', description: 'Conta de Energia',         type: 'expense', amount: 380   },
  { date: '20/07', description: 'Consultoria Sprint Dev',   type: 'income',  amount: 8000  },
];

export function CashFlow() {
  const [period, setPeriod]   = useState<Period>('Mensal');
  const [page, setPage]       = useState(0);
  const ROWS_PER_PAGE = 6;

  const chartData = useMemo(() => {
    let balance = 10000;
    return RAW[period].map(d => {
      balance += d.entrada - d.saida;
      return { ...d, saldo: balance };
    });
  }, [period]);

  const totals = useMemo(() => ({
    entradas: chartData.reduce((s, d) => s + d.entrada, 0),
    saidas:   chartData.reduce((s, d) => s + d.saida, 0),
    saldo:    chartData.at(-1)?.saldo ?? 0,
  }), [chartData]);

  // Extract with running balance
  const extractWithBalance = useMemo(() => {
    let bal = 45630;
    return EXTRACT.map(e => {
      if (e.type === 'income') bal += e.amount;
      else bal -= e.amount;
      return { ...e, balance: bal };
    });
  }, []);

  const paginated = extractWithBalance.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);
  const totalPages = Math.ceil(extractWithBalance.length / ROWS_PER_PAGE);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Visualize entradas, saídas e evolução do saldo.</p>
        </div>
        <div className="flex gap-2">
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
          <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-all">
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Entradas', value: totals.entradas, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
          { label: 'Total Saídas',   value: totals.saidas,   color: 'text-rose-600',    bg: 'bg-rose-500/10 border-rose-500/20',       icon: TrendingDown },
          { label: 'Saldo Final',    value: totals.saldo,    color: totals.saldo >= 0 ? 'text-primary' : 'text-rose-600', bg: 'bg-primary/10 border-primary/20', icon: Scale },
        ].map((k, i) => (
          <div key={i} className={cn('p-6 border rounded-2xl shadow-sm flex items-center gap-4', k.bg)}>
            <div className={cn('p-3 rounded-xl', k.bg)}>
              <k.icon className={cn('w-6 h-6', k.color)} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{k.label}</p>
              <h3 className={cn('text-2xl font-extrabold tabular-nums', k.color)}>{formatCurrency(k.value)}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="p-6 bg-card border rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold mb-6">Fluxo — {period}</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                formatter={(v: any) => formatCurrency(v as number)}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Bar dataKey="entrada" fill="#10b981" name="Entradas" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="saida"   fill="#ef4444" name="Saídas"   radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line dataKey="saldo"  stroke="#3b82f6" strokeWidth={3} dot={false} name="Saldo Acumulado" type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Extract Table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold">Extrato Detalhado</h3>
          <span className="text-sm text-muted-foreground">{extractWithBalance.length} lançamentos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-left">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3 text-right">Entrada</th>
                <th className="px-6 py-3 text-right">Saída</th>
                <th className="px-6 py-3 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground whitespace-nowrap">{row.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                        row.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      )}>
                        {row.type === 'income' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-semibold text-sm">{row.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-emerald-600 tabular-nums">
                    {row.type === 'income' ? `+ ${formatCurrency(row.amount)}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-sm text-rose-600 tabular-nums">
                    {row.type === 'expense' ? `– ${formatCurrency(row.amount)}` : '—'}
                  </td>
                  <td className={cn(
                    'px-6 py-4 text-right font-extrabold text-sm tabular-nums',
                    row.balance >= 0 ? 'text-foreground' : 'text-rose-600'
                  )}>
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, extractWithBalance.length)} de {extractWithBalance.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 border rounded-xl hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 border rounded-xl hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

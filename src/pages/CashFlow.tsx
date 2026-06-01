import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  Calendar,
  Filter
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const PERIODS = ['Diário', 'Semanal', 'Mensal', 'Anual'] as const;
type Period = typeof PERIODS[number];

const dataByPeriod: Record<Period, { name: string; entrada: number; saida: number; saldo: number }[]> = {
  'Diário': [
    { name: 'Seg', entrada: 1200, saida: 800, saldo: 400 },
    { name: 'Ter', entrada: 2300, saida: 1100, saldo: 1200 },
    { name: 'Qua', entrada: 800,  saida: 1500, saldo: -700 },
    { name: 'Qui', entrada: 3100, saida: 900,  saldo: 2200 },
    { name: 'Sex', entrada: 1800, saida: 2200, saldo: -400 },
  ],
  'Semanal': [
    { name: 'S1', entrada: 9200,  saida: 6100,  saldo: 3100  },
    { name: 'S2', entrada: 12400, saida: 8300,  saldo: 4100  },
    { name: 'S3', entrada: 7800,  saida: 9200,  saldo: -1400 },
    { name: 'S4', entrada: 15600, saida: 7400,  saldo: 8200  },
  ],
  'Mensal': [
    { name: 'Jan', entrada: 42000, saida: 24000, saldo: 18000 },
    { name: 'Fev', entrada: 38000, saida: 18000, saldo: 20000 },
    { name: 'Mar', entrada: 55000, saida: 32000, saldo: 23000 },
    { name: 'Abr', entrada: 47000, saida: 28000, saldo: 19000 },
    { name: 'Mai', entrada: 61000, saida: 35000, saldo: 26000 },
    { name: 'Jun', entrada: 58000, saida: 30000, saldo: 28000 },
    { name: 'Jul', entrada: 72000, saida: 38000, saldo: 34000 },
  ],
  'Anual': [
    { name: '2021', entrada: 320000, saida: 240000, saldo: 80000  },
    { name: '2022', entrada: 480000, saida: 310000, saldo: 170000 },
    { name: '2023', entrada: 620000, saida: 380000, saldo: 240000 },
    { name: '2024', entrada: 510000, saida: 290000, saldo: 220000 },
  ],
};

const tableData = [
  { date: '31/07', description: 'Saldo Inicial',             type: 'balance', entrada: 0,       saida: 0,       saldo: 91430.50  },
  { date: '01/08', description: 'Venda de Licença SaaS',      type: 'income',  entrada: 4500.00, saida: 0,       saldo: 95930.50  },
  { date: '02/08', description: 'Assinatura AWS',             type: 'expense', entrada: 0,       saida: 450.20,  saldo: 95480.30  },
  { date: '03/08', description: 'Consultoria Empresa Beta',   type: 'income',  entrada: 12000.00,saida: 0,       saldo: 107480.30 },
  { date: '04/08', description: 'Salários da Equipe',         type: 'expense', entrada: 0,       saida: 18500.00,saldo: 88980.30  },
  { date: '05/08', description: 'Pagamento Fornecedor',       type: 'expense', entrada: 0,       saida: 3200.00, saldo: 85780.30  },
  { date: '06/08', description: 'Receita de Serviços',        type: 'income',  entrada: 8700.00, saida: 0,       saldo: 94480.30  },
];

export function CashFlow() {
  const [period, setPeriod] = useState<Period>('Mensal');
  const data = dataByPeriod[period];

  const totalEntrada = tableData.reduce((a, t) => a + t.entrada, 0);
  const totalSaida   = tableData.reduce((a, t) => a + t.saida, 0);
  const saldoFinal   = tableData[tableData.length - 1].saldo;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Visualize todas as entradas e saídas no período selecionado.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border bg-card rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Total Entradas</span>
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-700 tabular-nums">{formatCurrency(totalEntrada)}</h3>
        </div>
        <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Total Saídas</span>
          </div>
          <h3 className="text-3xl font-extrabold text-rose-700 tabular-nums">{formatCurrency(totalSaida)}</h3>
        </div>
        <div className={cn(
          'p-6 rounded-2xl border',
          saldoFinal >= 0
            ? 'bg-blue-500/5 border-blue-500/20'
            : 'bg-rose-500/5 border-rose-500/20'
        )}>
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Saldo do Período</span>
          </div>
          <h3 className={cn(
            'text-3xl font-extrabold tabular-nums',
            saldoFinal >= 0 ? 'text-blue-700' : 'text-rose-700'
          )}>
            {formatCurrency(saldoFinal)}
          </h3>
        </div>
      </div>

      {/* Period selector + chart */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="text-lg font-bold">Análise de Fluxo</h3>
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  period === p ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="entrada" name="Entradas" fill="var(--color-primary)" opacity={0.85} radius={[4,4,0,0]} />
              <Bar dataKey="saida"   name="Saídas"   fill="#ef4444"             opacity={0.85} radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#f59e0b"
                strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h3 className="text-lg font-bold">Extrato Detalhado</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4" />
            Agosto 2024
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Data</th>
                <th className="px-6 py-4 text-left">Descrição</th>
                <th className="px-6 py-4 text-right text-emerald-600">Entradas</th>
                <th className="px-6 py-4 text-right text-rose-600">Saídas</th>
                <th className="px-6 py-4 text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tableData.map((row, i) => (
                <tr key={i} className={cn(
                  'hover:bg-muted/20 transition-colors',
                  row.type === 'balance' && 'bg-muted/30 font-bold'
                )}>
                  <td className="px-6 py-3.5 text-sm font-medium">{row.date}</td>
                  <td className="px-6 py-3.5 text-sm">
                    <div className="flex items-center gap-2">
                      {row.type === 'income' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                      {row.type === 'expense' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                      {row.description}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-emerald-600 tabular-nums">
                    {row.entrada > 0 ? `+ ${formatCurrency(row.entrada)}` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-semibold text-rose-600 tabular-nums">
                    {row.saida > 0 ? `– ${formatCurrency(row.saida)}` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm font-bold tabular-nums">
                    {formatCurrency(row.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 bg-muted/20">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Totais</td>
                <td className="px-6 py-4 text-right font-extrabold text-emerald-600 tabular-nums">{formatCurrency(totalEntrada)}</td>
                <td className="px-6 py-4 text-right font-extrabold text-rose-600 tabular-nums">{formatCurrency(totalSaida)}</td>
                <td className="px-6 py-4 text-right font-extrabold tabular-nums">{formatCurrency(saldoFinal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

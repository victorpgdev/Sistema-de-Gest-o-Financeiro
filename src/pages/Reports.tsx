import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const REPORT_TYPES = [
  {
    id: 'cashflow',
    title: 'Fluxo de Caixa',
    description: 'Entradas, saídas e saldo por período',
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'income',
    title: 'Relatório de Receitas',
    description: 'Detalhamento de todas as entradas',
    icon: ArrowUpRight,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'expense',
    title: 'Relatório de Despesas',
    description: 'Detalhamento de todas as saídas',
    icon: ArrowDownRight,
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'contacts',
    title: 'Clientes & Fornecedores',
    description: 'Histórico financeiro por contato',
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
  },
  {
    id: 'costcenter',
    title: 'Centros de Custo',
    description: 'Orçamento x realizado por centro',
    icon: BarChart3,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'dre',
    title: 'DRE Gerencial',
    description: 'Demonstrativo de Resultado do Exercício',
    icon: FileText,
    color: 'text-cyan-600',
    bg: 'bg-cyan-500/10',
  },
];

const PERIODS = ['Esta Semana', 'Este Mês', 'Último Trimestre', 'Este Ano', 'Personalizado'];

const recentReports = [
  { name: 'Fluxo de Caixa – Julho 2024',    date: '31/07/2024', format: 'PDF',   size: '284 KB' },
  { name: 'Relatório de Receitas – Q2 2024', date: '30/06/2024', format: 'Excel', size: '512 KB' },
  { name: 'DRE Gerencial – Junho 2024',      date: '30/06/2024', format: 'PDF',   size: '196 KB' },
  { name: 'Centros de Custo – Junho 2024',   date: '28/06/2024', format: 'PDF',   size: '148 KB' },
];

export function Reports() {
  const [selectedReport, setSelectedReport] = useState('cashflow');
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios financeiros em PDF ou Excel com um clique.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report type selector */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-bold">1. Selecione o tipo de relatório</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REPORT_TYPES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReport(r.id)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                    selectedReport === r.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                >
                  <div className={cn('p-2.5 rounded-xl shrink-0', r.bg, r.color)}>
                    <r.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                  </div>
                  {selectedReport === r.id && (
                    <div className="ml-auto shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-bold">2. Selecione o período</h3>
            </div>
            <div className="p-6 flex flex-wrap gap-3">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all',
                    selectedPeriod === p
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card hover:bg-muted border-border text-foreground'
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Export buttons */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-bold">3. Gerar relatório</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {REPORT_TYPES.find(r => r.id === selectedReport)?.title} – {selectedPeriod}
              </p>
            </div>
            <div className="p-6 flex flex-col sm:flex-row gap-4">
              <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-600/20">
                <FileText className="w-5 h-5" />
                Exportar PDF
              </button>
              <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-600/20">
                <FileSpreadsheet className="w-5 h-5" />
                Exportar Excel
              </button>
              <button className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-card border-2 border-border hover:border-primary hover:bg-primary/5 rounded-2xl font-bold transition-all">
                <Download className="w-5 h-5 text-primary" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold">Relatórios Recentes</h3>
              <button className="text-xs text-primary font-semibold hover:underline">Ver todos</button>
            </div>
            <div className="divide-y divide-border/50">
              {recentReports.map((r, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/20 transition-colors cursor-pointer group">
                  <div className={cn(
                    'p-2 rounded-lg shrink-0 mt-0.5',
                    r.format === 'PDF' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  )}>
                    {r.format === 'PDF' ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.date} · {r.size}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border rounded-2xl shadow-sm p-6">
            <h3 className="font-bold mb-4">Resumo do Período</h3>
            <div className="space-y-3">
              {[
                { label: 'Total de Receitas',  value: formatCurrency(72000),  color: 'text-emerald-600' },
                { label: 'Total de Despesas',  value: formatCurrency(38000),  color: 'text-rose-600'    },
                { label: 'Saldo Período',      value: formatCurrency(34000),  color: 'text-primary'     },
                { label: 'Transações',         value: '142',                   color: 'text-foreground'  },
                { label: 'Relatórios Gerados', value: '18',                    color: 'text-foreground'  },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={cn('text-sm font-bold tabular-nums', item.color)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

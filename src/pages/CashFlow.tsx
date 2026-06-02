import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ComposedChart, Line
} from 'recharts';
import { 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Calendar,
  Filter,
  Search,
  PieChart as PieIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';

const DAILY_DATA = [
  { day: '01', entrada: 4500, saida: 2100, saldo: 2400 },
  { day: '02', entrada: 3200, saida: 4800, saldo: -1600 },
  { day: '03', entrada: 6700, saida: 3200, saldo: 3500 },
  { day: '04', entrada: 1200, saida: 5400, saldo: -4200 },
  { day: '05', entrada: 8900, saida: 3100, saldo: 5800 },
  { day: '06', entrada: 4300, saida: 2900, saldo: 1400 },
  { day: '07', entrada: 5600, saida: 4200, saldo: 1400 },
];

export function CashFlow() {
  const [period, setPeriod] = useState('Mensal');

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-6 pb-20">
      {/* Header Alinhado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Caixa Detalhado</h1>
          <p className="text-sm text-muted-foreground font-medium">Análise granular de entradas, saídas e disponibilidade financeira diária.</p>
        </div>
        <div className="flex bg-muted/40 p-1 rounded-xl border">
          {['Diário', 'Semanal', 'Mensal', 'Anual'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-5 py-2 rounded-lg text-xs font-semibold transition-all",
                period === p ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Métricas Alinhado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Entradas no Período', value: 34500.80, color: 'text-emerald-500', icon: ArrowUpRight },
          { label: 'Saídas no Período', value: 25800.45, color: 'text-rose-500', icon: ArrowDownRight },
          { label: 'Saldo Operacional', value: 8700.35, color: 'text-primary', icon: BarChart3 },
        ].map((m, i) => (
          <div key={i} className="p-8 bg-card border rounded-[2rem] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-4">
               <div className={cn("p-2 rounded-lg", m.color.replace('text', 'bg') + '/10', m.color)}>
                  <m.icon className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Período Selecionado</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">{m.label}</p>
            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(m.value)}</h3>
          </div>
        ))}
      </div>

      {/* Gráfico de Barras Empilhadas Complexo */}
      <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
           <div>
             <h3 className="text-lg font-semibold tracking-tight">Análise Temporal de Fluxo</h3>
             <p className="text-xs text-muted-foreground font-medium">Comparativo diário entre ingressos de capital e obrigações liquidadas.</p>
           </div>
           <div className="flex gap-4">
             <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-all"><Search className="w-4 h-4" /> FILTRAR DADOS</button>
             <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20"><Download className="w-4 h-4" /> EXPORTAR CSV</button>
           </div>
        </div>

        <div className="h-[450px] w-full">
           <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} dy={10} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                 />
                 <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 40, fontSize: 11, fontWeight: 700 }} iconType="circle" />
                 <Bar dataKey="entrada" name="Entradas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                 <Bar dataKey="saida" name="Saídas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Segunda Camada: Gráfico de Composição e Tabela */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-semibold">Composição de Gastos por Categoria</h3>
              <PieIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="h-[250px] flex items-center justify-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-border">
               <span className="text-xs font-bold text-muted-foreground uppercase opacity-50 tracking-widest">Processando Categorias em Tempo Real...</span>
            </div>
         </div>

         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-semibold">Últimas Movimentações Operacionais</h3>
              <button className="text-xs font-bold text-primary hover:underline">Ver todas</button>
            </div>
            <div className="space-y-4">
               {[
                 { item: 'Pagamento Fornecedor XYZ', val: -1250, date: '08/02', cat: 'Operação' },
                 { item: 'Recebimento Venda #882', val: 450, date: '08/02', cat: 'Vendas' },
                 { item: 'Assinatura Software Cloud', val: -89.90, date: '07/02', cat: 'Infra' },
                 { item: 'Venda Consultoria Especial', val: 2500, date: '07/02', cat: 'Vendas' },
               ].map((x, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl hover:bg-muted/40 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", x.val > 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                          {x.val > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className="text-sm font-semibold">{x.item}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{x.date} • {x.cat}</p>
                       </div>
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", x.val > 0 ? "text-emerald-600" : "text-rose-600")}>
                      {x.val > 0 ? '+' : ''}{formatCurrency(x.val)}
                    </span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

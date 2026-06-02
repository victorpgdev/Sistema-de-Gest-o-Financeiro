import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Loader2, 
  Target, Calculator, Activity, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard() {
  const [data, setData] = useState({ transactions: [], accounts: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const [tRes, aRes] = await Promise.all([
      supabase.from('transactions').select('*'),
      supabase.from('bank_accounts').select('*')
    ]);
    setData({ 
      transactions: tRes.data || [], 
      accounts: aRes.data || [] 
    });
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const metrics = useMemo(() => {
    const t = data.transactions;
    const balance = data.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
    const income = t.filter(x => x.type === 'income' && x.status === 'paid').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const expense = t.filter(x => x.type === 'expense' && x.status === 'paid').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const pendingIncome = t.filter(x => x.type === 'income' && x.status === 'pending').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const pendingExpense = t.filter(x => x.type === 'expense' && x.status === 'pending').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    
    return { balance, income, expense, profit: income - expense, pendingIncome, pendingExpense };
  }, [data]);

  // Dados Mock Avançados para os Gráficos Complexos (Enquanto o usuário não tem dados suficientes)
  const chartData = [
    { n: 'Jan', rec: 45000, des: 32000, proj: 48000 },
    { n: 'Fev', rec: 52000, des: 38000, proj: 55000 },
    { n: 'Mar', rec: 48000, des: 41000, proj: 50000 },
    { n: 'Abr', rec: 61000, des: 42000, proj: 65000 },
    { n: 'Mai', rec: 55000, des: 39000, proj: 60000 },
    { n: 'Jun', rec: 67000, des: 45000, proj: 72000 },
  ];

  const categoryData = [
    { name: 'Vendas', value: 45 },
    { name: 'Serviços', value: 30 },
    { name: 'Infra', value: 15 },
    { name: 'Outros', value: 10 },
  ];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-6 pb-20 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Relatório Executivo</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4" />
            <span>Consumo de dados: Tempo Real • Período: Últimos 6 meses</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-muted transition-all">Período Customizado</button>
           <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/20">Baixar Relatório PDF</button>
        </div>
      </div>

      {/* Main Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Liquidez Corrente', value: metrics.balance, icon: DollarSign, color: 'text-blue-500', trend: '+12.5%' },
          { label: 'Fluxo Positivo (Caixa)', value: metrics.income, icon: TrendingUp, color: 'text-emerald-500', trend: '+8.2%' },
          { label: 'Comprometimento (Despesas)', value: metrics.expense, icon: TrendingDown, color: 'text-rose-500', trend: '-2.4%' },
          { label: 'Lucratividade Líquida', value: metrics.profit, icon: Target, color: 'text-primary', trend: '+15.1%' },
        ].map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-card border rounded-3xl shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-2xl", s.color.replace('text', 'bg') + '/10', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">{s.trend}</span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(s.value)}</h3>
            <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
          </motion.div>
        ))}
      </div>

      {/* Complex Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Gráfico 1: Performance Multidimensional (7/12) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 p-8 bg-card border rounded-[2.5rem] shadow-sm space-y-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Performance Multidimensional</h3>
              <p className="text-xs text-muted-foreground font-medium italic">Comparativo entre faturamento, custos e projeção de mercado</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> <span className="text-[10px] font-bold text-muted-foreground">RECEITA</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500" /> <span className="text-[10px] font-bold text-muted-foreground">DESPESA</span></div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                   <linearGradient id="gradRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="n" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="rec" stroke="none" fill="url(#gradRec)" />
                <Bar dataKey="des" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="rec" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                <Line type="monotone" dataKey="proj" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico 2: Composição de Receita (5/12) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 p-8 bg-card border rounded-[2.5rem] shadow-sm flex flex-col h-full"
        >
          <h3 className="text-lg font-bold tracking-tight mb-8">Asset Allocation (Receita)</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={300}>
               <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">85%</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Efficiency</span>
            </div>
          </div>
          <div className="mt-8 space-y-3">
             {categoryData.map((item, i) => (
               <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                     <span className="text-xs font-bold text-muted-foreground uppercase">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums">{item.value}%</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Secondary Row: Real Time Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 space-y-6 relative overflow-hidden group">
            <div className="relative z-10">
               <Calculator className="w-10 h-10 mb-4 opacity-80 group-hover:rotate-12 transition-transform" />
               <h4 className="text-xl font-bold mb-2">Simulador de Impostos</h4>
               <p className="text-sm opacity-80 mb-6">Calcule o impacto tributário na sua próxima nota fiscal com as novas diretrizes.</p>
               <button className="px-6 py-2.5 bg-white text-primary rounded-xl text-xs font-bold shadow-lg">CALCULAR AGORA</button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
         </div>
         
         <div className="lg:col-span-2 p-8 bg-card border rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
               <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Activity className="w-6 h-6" />
               </div>
               <h3 className="text-lg font-bold tracking-tight">Status de Operação Bancária</h3>
               <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                 Todos os conectores de banco (Itaú, Nubank e Bradesco) estão operando em regime de alta disponibilidade. Nenhuma falha de sincronização detectada nas últimas 24 horas.
               </p>
               <div className="flex gap-4 pt-2">
                  <div className="flex flex-col"><span className="text-lg font-bold">99.9%</span><span className="text-[8px] font-black uppercase text-muted-foreground">Uptime API</span></div>
                  <div className="flex flex-col"><span className="text-lg font-bold">12ms</span><span className="text-[8px] font-black uppercase text-muted-foreground">Latência média</span></div>
               </div>
            </div>
            <div className="w-full md:w-56 h-32 bg-muted/40 rounded-[2rem] border-2 border-dashed border-border flex items-center justify-center">
               <span className="text-[10px] font-black text-muted-foreground opacity-50 uppercase tracking-widest">Sinal de Rede OK</span>
            </div>
         </div>
      </div>
    </div>
  );
}

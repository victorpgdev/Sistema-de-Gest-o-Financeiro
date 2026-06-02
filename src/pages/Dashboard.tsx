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
  const [data, setData] = useState<{ transactions: any[], accounts: any[] }>({ transactions: [], accounts: [] });
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
    const profit = income - expense;
    return { balance, income, expense, profit };
  }, [data]);

  const chartData = [
    { n: 'Jan', rec: 45000, des: 32000, proj: 48000 },
    { n: 'Fev', rec: 52000, des: 38000, proj: 55000 },
    { n: 'Mar', rec: 48000, des: 41000, proj: 50000 },
    { n: 'Abr', rec: 61000, des: 42000, proj: 65000 },
    { n: 'Mai', rec: 55000, des: 39000, proj: 60000 },
    { n: 'Jun', rec: 67000, des: 45000, proj: 72000 },
  ];

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-4 md:px-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Análise Gerencial</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4" />
            <span>Dados consolidados em tempo real</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Patrimônio em Conta', value: metrics.balance, icon: DollarSign, color: 'text-primary' },
          { label: 'Entradas (Realizado)', value: metrics.income, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Saídas (Realizado)', value: metrics.expense, icon: TrendingDown, color: 'text-rose-500' },
          { label: 'Lucro Líquido', value: metrics.profit, icon: Target, color: 'text-blue-500' },
        ].map((s, i) => (
          <div key={i} className="p-6 bg-card border rounded-2xl shadow-sm hover:translate-y-[-4px] transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 bg-muted/30", s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(s.value)}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-8 bg-card border rounded-[2rem] shadow-sm">
          <h3 className="text-base font-semibold mb-8">Performance Operacional Mensal</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="n" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="rec" stroke="none" fill="rgba(59, 130, 246, 0.1)" />
                <Bar dataKey="des" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="rec" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 p-8 bg-card border rounded-[2rem] shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center animate-pulse">
               <TrendingUp className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-semibold tracking-tight">Operação Saudável</h4>
              <p className="text-xs text-muted-foreground font-medium px-4">Seus custos estão 15% abaixo do projetado para este mês.</p>
            </div>
            <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Relatório PDF</button>
        </div>
      </div>
    </div>
  );
}

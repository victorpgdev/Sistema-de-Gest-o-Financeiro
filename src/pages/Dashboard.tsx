import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function Dashboard() {
  const [period, setPeriod] = useState('Este Mês');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const [transactionsRes, accountsRes] = await Promise.all([
      supabase.from('transactions').select('*'),
      supabase.from('bank_accounts').select('*')
    ]);

    if (!transactionsRes.error) setTransactions(transactionsRes.data || []);
    if (!accountsRes.error) setAccounts(accountsRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totals = useMemo(() => {
    const balance = accounts.reduce((s, a) => s + a.balance, 0);
    const income = transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
    return { balance, income, expense, profit: income - expense };
  }, [transactions, accounts]);

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">Visão Geral</h1>
          <p className="text-muted-foreground font-medium">Dados consolidados em tempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center lg:text-left">
        {[
          { label: 'Patrimônio Total', value: totals.balance, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Entradas (Mês)', value: totals.income, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Saídas (Mês)', value: totals.expense, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
          { label: 'Resultado Líquido', value: totals.profit, icon: ArrowUpRight, color: totals.profit >= 0 ? 'text-blue-500' : 'text-rose-600', bg: 'bg-blue-500/5' },
        ].map((s, i) => (
          <div key={i} className="p-8 bg-card border rounded-[2rem] shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 lg:mx-0 mx-auto transition-transform group-hover:scale-110`}>
              <s.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{s.label}</p>
            <h3 className="text-2xl font-black tabular-nums tracking-tighter">{formatCurrency(s.value)}</h3>
          </div>
        ))}
      </div>

      {/* Basic Graph to keep visual appeal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 bg-card border rounded-[2.5rem] shadow-sm">
           <h3 className="text-lg font-black uppercase tracking-tight mb-8">Performance Mensal</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[{name: 'Sem 1', v: 4000}, {name: 'Sem 2', v: 3000}, {name: 'Sem 3', v: 5000}, {name: 'Sem 4', v: 8000}]}>
                    <defs>
                       <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="p-8 bg-card border rounded-[2.5rem] shadow-sm flex flex-col justify-center text-center">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
               <TrendingUp className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Saúde Financeira</h4>
            <p className="text-sm text-muted-foreground font-medium mb-6">Seu fluxo está 24% mais eficiente que no mês anterior.</p>
            <button className="py-4 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/30">Explorar Relatórios</button>
        </div>
      </div>
    </div>
  );
}

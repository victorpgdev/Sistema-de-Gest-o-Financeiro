import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, DollarSign, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('bank_accounts').select('*')
      ]);
      if (!tRes.error) setTransactions(tRes.data || []);
      if (!aRes.error) setAccounts(aRes.data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totals = useMemo(() => {
    const balance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
    const income = transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expense = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    return { balance, income, expense, profit: income - expense };
  }, [transactions, accounts]);

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel Executivo</h1>
          <p className="text-sm text-muted-foreground font-medium">Resumo financeiro em tempo real.</p>
        </div>
      </div>

      {/* Cards de Resumo Clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Patrimônio Total', value: totals.balance, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Entradas (Mês)', value: totals.income, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'Saídas (Mês)', value: totals.expense, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/5' },
          { label: 'Saldo Operacional', value: totals.profit, icon: ArrowUpRight, color: totals.profit >= 0 ? 'text-primary' : 'text-rose-600', bg: 'bg-primary/5' },
        ].map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", s.bg, s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(s.value)}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-8 bg-card border rounded-2xl shadow-sm"
        >
           <h3 className="text-base font-semibold mb-8">Fluxo de Caixa Acumulado</h3>
           <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[{n: 'Sem 1', v: 4000}, {n: 'Sem 2', v: 3000}, {n: 'Sem 3', v: 5000}, {n: 'Sem 4', v: 8000}]}>
                    <defs>
                       <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="n" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 500 }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </motion.div>
        
        <div className="p-8 bg-card border rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center animate-pulse">
               <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-semibold tracking-tight">Performance Saudável</h4>
              <p className="text-xs text-muted-foreground font-medium px-4">Seu lucro operacional cresceu 12% em comparação ao mês passado.</p>
            </div>
            <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">Relatório Completo</button>
        </div>
      </div>
    </div>
  );
}

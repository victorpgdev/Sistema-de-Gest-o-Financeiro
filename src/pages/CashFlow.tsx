import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Search,
  PieChart as PieIcon,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function CashFlow() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('Mensal');

  const fetchData = async () => {
    if (!user?.tenant_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.warn('CashFlow fetch warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  // Processamento de dados para o gráfico
  const chartData = useMemo(() => {
    const daily: Record<string, { day: string, entrada: number, saida: number }> = {};
    
    // Pegar os últimos 15 dias ou do mês atual
    transactions.forEach(t => {
      const date = new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!daily[date]) daily[date] = { day: date, entrada: 0, saida: 0 };
      
      if (t.type === 'income') daily[date].entrada += t.amount;
      else daily[date].saida += t.amount;
    });

    return Object.values(daily).slice(-15); // Mostra os últimos 15 dias com movimentação
  }, [transactions]);

  const totals = useMemo(() => {
    const income = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
    const expense = transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa Real</h1>
          <p className="text-sm text-muted-foreground font-medium">Dados consolidados diretamente de suas movimentações bancárias.</p>
        </div>
        <div className="flex bg-muted/40 p-1 rounded-xl border">
          {['Diário', 'Semanal', 'Mensal'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("px-5 py-2 rounded-lg text-xs font-bold transition-all",
                period === p ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Entradas Totais" value={totals.income} color="text-emerald-500" icon={ArrowUpRight} />
        <MetricCard label="Saídas Totais" value={totals.expense} color="text-rose-500" icon={ArrowDownRight} />
        <MetricCard label="Saldo Operacional" value={totals.balance} color="text-primary" icon={BarChart3} />
      </div>

      <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold">Análise Temporal</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Download className="w-4 h-4" /> EXPORTAR RELATÓRIO
          </button>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 700 }} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{ fill: 'var(--primary)', opacity: 0.05 }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 40, fontSize: 10, fontWeight: 800 }} iconType="circle" />
              <Bar dataKey="entrada" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="saida" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-base font-bold mb-6 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-primary" /> Distribuição de Custos
            </h3>
            <div className="space-y-4">
              {transactions.filter(t => t.type === 'expense').slice(0, 5).map((t, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-muted/20 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600">{t.category || 'Geral'}</span>
                  <span className="text-xs font-black text-rose-500">{formatCurrency(t.amount)}</span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center py-10 text-xs text-muted-foreground italic">Sem dados suficientes.</p>}
            </div>
         </div>

         <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-base font-bold mb-6">Últimos Eventos de Caixa</h3>
            <div className="space-y-3">
              {transactions.slice(-4).reverse().map((t, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={cn("text-xs font-black", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="p-8 bg-card border rounded-[2rem] shadow-sm group">
      <div className="flex justify-between items-center mb-4">
         <div className={cn("p-2 rounded-lg", color.replace('text', 'bg') + '/10', color)}>
            <Icon className="w-5 h-5" />
         </div>
      </div>
      <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">{label}</p>
      <h3 className={cn("text-2xl font-black tracking-tight", color)}>{formatCurrency(value)}</h3>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, 
  TrendingUp, BarChart3, AlertCircle, 
  Plus, Loader2, Clock, ArrowRight, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TransactionModal } from '@/components/TransactionModal';
import { Transaction, BankAccount } from '@/types';
import { logActivity } from '@/lib/audit';

export function Dashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<{
    totals: { income: number; expense: number; balance: number };
    pending: { income: number; expense: number };
    recentTransactions: Transaction[];
    chartData: any[];
    insights: { topCategory: string; topCategoryValue: number; healthScore: number };
  }>({
    totals: { income: 0, expense: 0, balance: 0 },
    pending: { income: 0, expense: 0 },
    recentTransactions: [],
    chartData: [],
    insights: { topCategory: 'Analisando...', topCategoryValue: 0, healthScore: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.tenant_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: txs, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('due_date', { ascending: false });

      if (txError) throw txError;

      if (txs) {
        const transactions = txs as Transaction[];
        const income = transactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
        const pendIncome = transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);
        const pendExpense = transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);

        const chartMap: Record<string, { date: string; entrada: number; saida: number }> = {};
        const catMap: Record<string, number> = {};
        
        transactions.forEach(t => {
          const date = new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          if (!chartMap[date]) chartMap[date] = { date, entrada: 0, saida: 0 };
          
          if (t.type === 'income') {
            chartMap[date].entrada += t.amount;
          } else {
            chartMap[date].saida += t.amount;
            const category = t.category_id || 'Geral';
            catMap[category] = (catMap[category] || 0) + t.amount;
          }
        });

        const topCat = Object.entries(catMap).sort((a,b) => b[1] - a[1])[0] || ['Geral', 0];

        setData({
          totals: { income, expense, balance: income - expense },
          pending: { income: pendIncome, expense: pendExpense },
          recentTransactions: transactions.slice(0, 4),
          chartData: Object.values(chartMap).reverse().slice(-10),
          insights: {
            topCategory: String(topCat[0]),
            topCategoryValue: Number(topCat[1]),
            healthScore: income > 0 ? Math.min(100, Math.round(((income - expense) / income) * 100)) : 0
          }
        });
      }
    } catch (err: any) {
      console.warn("Dashboard sync warning:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (formData: Partial<Transaction>) => {
    const finalTenantId = user?.tenant_id;
    if (!finalTenantId) return;

    try {
      const { error } = await supabase.from('transactions').insert([{
        ...formData,
        tenant_id: finalTenantId
      }]);

      if (error) throw error;

      if (formData.status === 'paid' && formData.bank_account_id) {
        const { data: account } = await supabase.from('bank_accounts').select('balance').eq('id', formData.bank_account_id).single();
        if (account) {
          const newBalance = formData.type === 'income' ? Number(account.balance) + Number(formData.amount) : Number(account.balance) - Number(formData.amount);
          await supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', formData.bank_account_id);
        }
      } else if (formData.status === 'paid' && formData.credit_card_id) {
        const { data: card } = await supabase.from('credit_cards').select('current_spent').eq('id', formData.credit_card_id).single();
        if (card) {
          const newSpent = Number(card.current_spent) + Number(formData.amount);
          await supabase.from('credit_cards').update({ current_spent: newSpent }).eq('id', formData.credit_card_id);
        }
      }

      if (user) {
        await logActivity({
          userId: user.id, tenantId: finalTenantId,
          action: 'CREATE', module: 'TRANSACTIONS',
          description: `Novo lançamento via Dashboard: ${formData.description}`
        });
      }

      setNotification({ type: 'success', message: '🚀 Lançamento realizado com sucesso!' });
      setShowModal(false);
      fetchDashboardData();
    } catch (err: any) { 
      setNotification({ type: 'error', message: `Erro ao salvar: ${err.message}` });
    }
  };


  useEffect(() => { if (user) fetchDashboardData(); }, [user]);
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sincronizando Painel...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 max-w-[1600px] mx-auto px-6 overflow-hidden relative">
      
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md text-white font-bold text-sm",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400" : "bg-rose-500/90 border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Olá, <span className="text-primary">{user?.name?.split(' ')[0] || 'Usuário'}</span>!
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Saúde Financeira: {data.insights.healthScore}%</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-wider"
        >
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardSmall label="Disponível" value={data.totals.balance} icon={Wallet} color="primary" />
        <MetricCardSmall label="Entradas" value={data.totals.income} icon={ArrowUpCircle} color="emerald" />
        <MetricCardSmall label="Saídas" value={data.totals.expense} icon={ArrowDownCircle} color="rose" />
        <MetricCardSmall label="Projeção" value={data.pending.income - data.pending.expense} icon={TrendingUp} color="blue" />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Fluxo de Liquidez</h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chartData}>
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.03} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: 9, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                <Area type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={2} fill="url(#colorEntrada)" />
                <Area type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={2} fill="url(#colorSaida)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="bg-slate-900 rounded-[2rem] p-5 text-white flex-1 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inteligência PG</span>
              </div>
              <div className="space-y-3">
                <InsightItem 
                  icon={AlertCircle} 
                  color="text-primary"
                  text={data.insights.topCategoryValue > 0 ? `Maior saída: ${data.insights.topCategory}` : "Analisando..."}
                />
                <InsightItem 
                  icon={TrendingUp} 
                  color="text-emerald-400"
                  text={data.insights.healthScore > 25 ? "Caixa Saudável" : "Atenção ao Caixa"}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm flex flex-col min-h-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Recentes</h3>
            <div className="space-y-3 flex-1 overflow-y-auto scrollbar-hide">
              {data.recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", tx.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      {tx.type === 'income' ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 truncate">{tx.description}</span>
                  </div>
                  <span className={cn("text-[10px] font-black shrink-0", tx.type === 'income' ? "text-emerald-600" : "text-rose-600")}>{tx.amount > 1000 ? (tx.amount/1000).toFixed(1)+'k' : tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <TransactionModal 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function MetricCardSmall({ label, value, icon: Icon, color }: any) {
  const colors = {
    primary: "bg-primary text-white shadow-primary/20",
    emerald: "bg-white border border-slate-100 text-emerald-600",
    rose: "bg-white border border-slate-100 text-rose-600",
    blue: "bg-slate-800 text-white shadow-slate-900/10"
  };

  return (
    <div className={cn("px-5 py-4 rounded-[1.8rem] shadow-sm flex items-center gap-4", colors[color as keyof typeof colors])}>
      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{label}</p>
        <h3 className="text-sm font-black truncate">{formatCurrency(value)}</h3>
      </div>
    </div>
  );
}

function InsightItem({ icon: Icon, color, text }: any) {
  return (
    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
      <Icon className={cn("w-3.5 h-3.5 shrink-0", color)} />
      <p className="text-[10px] font-bold text-slate-200 leading-tight">{text}</p>
    </div>
  );
}

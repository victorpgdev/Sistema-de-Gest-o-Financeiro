import { useState, useEffect } from 'react';
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, 
  Trash2, CheckCircle2, Loader2, AlertCircle,
  Calendar as CalendarIcon, List as ListIcon,
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { logActivity } from '@/lib/audit';
import { TransactionModal } from '@/components/TransactionModal';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending' | 'overdue' | 'canceled';
  due_date: string;
  category: string;
  is_recurring?: boolean;
  bank_account_id?: string;
}

export function Transactions() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchTransactions = async () => {
    if (!user?.tenant_id && user?.role !== 'MASTER') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const query = supabase.from('transactions').select('*');
      if (user?.tenant_id) query.eq('tenant_id', user.tenant_id);
      const { data, error } = await query.order('due_date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.warn("Transactions fetch warning:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchTransactions(); 
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterType === 'all' || t.type === filterType)
  );

  const handleExportSheet = () => {
    if (transactions.length === 0) return;
    const headers = ['Data', 'Descricao', 'Categoria', 'Valor', 'Tipo', 'Status'];
    const rows = filtered.map(t => [
      new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR'),
      t.description,
      t.category || 'Geral',
      t.amount.toString().replace('.', ','),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.status === 'paid' ? 'Efetivado' : t.status === 'pending' ? 'Em Aberto' : t.status === 'overdue' ? 'Atrasado' : 'Cancelado'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MOVIMENTACOES_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  const handleSave = async (formData: any) => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { error: tError } = await supabase
        .from('transactions')
        .insert([{ ...formData, tenant_id: user.tenant_id, user_id: user.id }]);

      if (tError) throw tError;

      if (formData.status === 'paid' && formData.bank_account_id) {
        const { data: bank } = await supabase.from('bank_accounts').select('balance').eq('id', formData.bank_account_id).single();
        if (bank) {
          const newBalance = formData.type === 'income' ? Number(bank.balance) + Number(formData.amount) : Number(bank.balance) - Number(formData.amount);
          await supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', formData.bank_account_id);
        }
      }

      await logActivity({
        userId: user.id, tenantId: user.tenant_id, action: 'CREATE', module: 'TRANSACTIONS',
        description: `Lançamento criado: ${formData.description} (${formatCurrency(formData.amount)})`
      });

      setNotification({ type: 'success', message: '✅ Sincronizado com sucesso!' });
      fetchTransactions();
      setShowModal(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (t: Transaction) => {
    if (!window.confirm('Excluir esta transação? O saldo será estornado automaticamente.')) return;
    setIsLoading(true);
    try {
      if (t.status === 'paid' && t.bank_account_id) {
        const { data: bank } = await supabase.from('bank_accounts').select('balance').eq('id', t.bank_account_id).single();
        if (bank) {
          const restoredBalance = t.type === 'income' ? Number(bank.balance) - Number(t.amount) : Number(bank.balance) + Number(t.amount);
          await supabase.from('bank_accounts').update({ balance: restoredBalance }).eq('id', t.bank_account_id);
        }
      }
      await supabase.from('transactions').delete().eq('id', t.id);
      await logActivity({
        userId: user!.id, tenantId: user!.tenant_id!, action: 'DELETE', module: 'TRANSACTIONS',
        description: `Lançamento deletado (Estorno realizado): ${t.description}`
      });
      setNotification({ type: 'success', message: '🔄 Transação removida e saldo estornado.' });
      fetchTransactions();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md text-white font-bold text-sm",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400" : "bg-rose-500/90 border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimentações</h1>
          <p className="text-sm text-muted-foreground font-medium">Visualize e controle seu fluxo financeiro.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportSheet}
            className="hidden md:flex px-4 py-2.5 bg-white border rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50 transition-all items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Planilha
          </button>
          <div className="flex bg-muted p-1 rounded-xl border">
            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}><ListIcon className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('calendar')} className={cn("p-2 rounded-lg transition-all", viewMode === 'calendar' ? "bg-background shadow-sm text-primary" : "text-muted-foreground")}><CalendarIcon className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border overflow-hidden">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none outline-none font-bold text-xs rounded-xl" placeholder="Pesquisar lançamentos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="bg-slate-50 border-none outline-none font-black text-[10px] uppercase px-4 py-2 rounded-xl text-slate-500" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
      </div>

      {viewMode === 'list' ? (
        <ListView transactions={filtered} isLoading={isLoading} onDelete={handleDelete} />
      ) : (
        <CalendarView transactions={filtered} currentDate={currentDate} onMonthChange={setCurrentDate} />
      )}

      {showModal && (
        <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

function ListView({ transactions, isLoading, onDelete }: any) {
  return (
    <div className="bg-card border rounded-[2rem] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 border-b text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Data</th>
              <th className="px-6 py-5">Descrição</th>
              <th className="px-6 py-5 text-right">Valor</th>
              <th className="px-6 py-5 text-center">Status</th>
              <th className="px-8 py-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" /></td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-muted-foreground text-sm">Nenhuma movimentação encontrada.</td></tr>
            ) : transactions.map((t: Transaction) => (
              <tr key={t.id} className="hover:bg-muted/10 transition-all group">
                <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-700">{t.description}</span>
                      <span className="text-[10px] text-muted-foreground">{t.category}</span>
                      {t.is_recurring && <span className="text-[9px] font-black text-primary uppercase tracking-widest">Recorrente</span>}
                    </div>
                  </div>
                </td>
                <td className={cn("px-6 py-5 text-right font-black text-sm", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                    t.status === 'paid' ? "bg-emerald-50 text-emerald-600" : 
                    t.status === 'pending' ? "bg-amber-50 text-amber-600" :
                    t.status === 'overdue' ? "bg-rose-50 text-rose-600" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {t.status === 'paid' ? 'Efetivado' : 
                     t.status === 'pending' ? 'Em Aberto' :
                     t.status === 'overdue' ? 'Atrasado' : 'Cancelado'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => onDelete(t)} 
                    className="p-2 text-rose-400 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarView({ transactions, currentDate, onMonthChange }: any) {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const prevMonth = () => onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => onMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8 px-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-slate-700">{monthName}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-xl"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-2xl overflow-hidden border">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="bg-muted/50 p-4 text-[10px] font-black text-muted-foreground text-center uppercase tracking-widest">{d}</div>
        ))}
        {days.map((day, idx) => {
          const dateStr = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0] : '';
          const dayTxs = transactions.filter((t: Transaction) => t.due_date === dateStr);
          return (
            <div key={idx} className={cn("bg-card min-h-[120px] p-3 border-t border-r last:border-r-0 hover:bg-slate-50 transition-colors", !day && "bg-muted/20")}>
              {day && (
                <>
                  <span className={cn("text-xs font-black text-slate-400 mb-2 block", new Date().toISOString().split('T')[0] === dateStr && "text-primary")}>{day}</span>
                  <div className="space-y-1">
                    {dayTxs.map((t: Transaction) => (
                      <div key={t.id} className={cn("px-2 py-1 rounded-md text-[9px] font-black uppercase truncate border", t.type === 'income' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100")}>
                        {t.description}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

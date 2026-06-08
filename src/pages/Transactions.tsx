import { useState, useEffect, useRef } from 'react';
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, 
  Trash2, CheckCircle2, Loader2, AlertCircle,
  Calendar as CalendarIcon, List as ListIcon,
  ChevronLeft, ChevronRight, Download, ChevronDown, Check,
  Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn, masks, parseCurrency } from '@/lib/utils';
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
  
  // Custom UI States
  const [isOpenFilter, setIsOpenFilter] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsOpenFilter(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const finalTenantId = user?.tenant_id || 'd196ba2e-9671-4d8f-9862-7345f380635b';
    
    // VALIDACAO DE NEGOCIO OBRIGATORIA
    if (!formData.description || !formData.amount || !formData.category) {
      setNotification({ type: 'error', message: '⚠️ Descrição, valor e categoria são obrigatórios.' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { error: tError } = await supabase
        .from('transactions')
        .insert([{ ...formData, tenant_id: finalTenantId }]);

      if (tError) throw tError;

      if (formData.status === 'paid' && formData.bank_account_id) {
        const { data: bank } = await supabase.from('bank_accounts').select('balance').eq('id', formData.bank_account_id).single();
        if (bank) {
          const newBalance = formData.type === 'income' ? Number(bank.balance) + Number(formData.amount) : Number(bank.balance) - Number(formData.amount);
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
          userId: user.id, tenantId: finalTenantId, action: 'CREATE', module: 'TRANSACTIONS',
          description: `Lançamento criado: ${formData.description} (${formatCurrency(formData.amount)})`
        });
      }

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
      setConfirmDelete(null);
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
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md text-white font-bold text-sm",
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

      <div className="flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none outline-none font-bold text-xs rounded-xl" placeholder="Pesquisar lançamentos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        {/* CUSTOM FILTER DROPDOWN */}
        <div className="relative" ref={filterRef}>
          <button onClick={() => setIsOpenFilter(!isOpenFilter)} className="bg-slate-50 border-none outline-none font-black text-[10px] uppercase px-4 py-2 rounded-xl text-slate-500 flex items-center gap-2 hover:bg-slate-100 transition-all">
            {filterType === 'all' ? 'Todos' : filterType === 'income' ? 'Receitas' : 'Despesas'}
            <ChevronDown className={cn("w-3 h-3 transition-transform", isOpenFilter && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isOpenFilter && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 right-0 mt-2 bg-white border rounded-2xl shadow-2xl p-1 min-w-[140px]">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'income', label: 'Receitas' },
                  { id: 'expense', label: 'Despesas' }
                ].map(opt => (
                  <button key={opt.id} onClick={() => { setFilterType(opt.id as any); setIsOpenFilter(false); }} className={cn("w-full text-left px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all", filterType === opt.id ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600")}>
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ListView transactions={filtered} isLoading={isLoading} onDelete={setConfirmDelete} />
      ) : (
        <CalendarView transactions={filtered} currentDate={currentDate} onMonthChange={setCurrentDate} />
      )}

      {showModal && (
        <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      {/* CONFIRM DELETE MODAL NATIVO */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Lançamento?</h3>
              <p className="text-sm text-slate-500 mb-8">Esta ação não pode ser desfeita e o saldo da conta será estornado automaticamente.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-rose-200 hover:scale-105 transition-all">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
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

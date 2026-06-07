import { useState, useEffect } from 'react';
import { 
  Plus, Search, ArrowUpCircle, ArrowDownCircle, 
  MoreVertical, Edit2, Trash2, CheckCircle2, Clock, 
  Download, X, Loader2, Filter, AlertCircle,
  Calendar as CalendarIcon, List as ListIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  due_date: string;
  category: string;
  is_recurring?: boolean;
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
    if (!user?.tenant_id && user?.role !== 'MASTER') return;
    setIsLoading(true);
    try {
      const query = supabase.from('transactions').select('*');
      if (user?.tenant_id) query.eq('tenant_id', user.tenant_id);
      const { data, error } = await query.order('due_date', { ascending: false });
      if (!error) setTransactions(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchTransactions(); 
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, notification]);

  const handleSave = async (formData: any) => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('transactions').insert([{
        ...formData,
        tenant_id: user.tenant_id
      }]);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Lançamento registrado!' });
      fetchTransactions();
      setShowModal(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterType === 'all' || t.type === filterType)
  );

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

      {viewMode === 'list' ? (
        <ListView transactions={filtered} isLoading={isLoading} onToggleStatus={() => {}} onDelete={() => {}} />
      ) : (
        <CalendarView transactions={filtered} currentDate={currentDate} onMonthChange={setCurrentDate} />
      ) }

      <AnimatePresence>
        {showModal && (
          <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ListView({ transactions, isLoading, onToggleStatus, onDelete }: any) {
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
              ) : transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-muted/10 transition-all group">
                  <td className="px-8 py-5 text-xs font-bold text-slate-400">{new Date(t.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                         {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                       </div>
                       <div className="flex flex-col">
                         <span className="font-bold text-sm text-slate-700">{t.description}</span>
                         {t.is_recurring && <span className="text-[9px] font-black text-primary uppercase tracking-widest">Recorrente</span>}
                       </div>
                    </div>
                  </td>
                  <td className={cn("px-6 py-5 text-right font-black text-sm", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase", t.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                      {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => onDelete(t.id)} className="p-2 text-rose-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
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

  const days = [];
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
            const dayTxs = transactions.filter((t: any) => t.due_date === dateStr);
            return (
              <div key={idx} className={cn("bg-card min-h-[120px] p-3 border-t border-r last:border-r-0 hover:bg-slate-50 transition-colors", !day && "bg-muted/20")}>
                {day && (
                  <>
                    <span className={cn("text-xs font-black text-slate-400 mb-2 block", new Date().toISOString().split('T')[0] === dateStr && "text-primary")}>{day}</span>
                    <div className="space-y-1">
                       {dayTxs.map((t: any) => (
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

function TransactionModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    description: '', amount: 0, type: 'income', status: 'pending',
    due_date: new Date().toISOString().split('T')[0], category: '',
    is_recurring: false, recurrence_period: 'monthly'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold uppercase tracking-tight">Novo Lançamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-5">
          <div className="flex bg-muted p-1 rounded-xl border">
            <button onClick={() => setForm({...form, type: 'income'})} className={cn("flex-1 py-3 rounded-lg font-black text-[10px] uppercase transition-all", form.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground")}>Receita</button>
            <button onClick={() => setForm({...form, type: 'expense'})} className={cn("flex-1 py-3 rounded-lg font-black text-[10px] uppercase transition-all", form.type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground")}>Despesa</button>
          </div>
          <div className="space-y-1"><label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Descrição</label><input className="w-full p-4 bg-muted border rounded-2xl outline-none font-bold" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Valor (R$)</label><input className="w-full p-4 bg-muted border rounded-2xl outline-none font-bold" type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Data</label><input className="w-full p-4 bg-muted border rounded-2xl outline-none font-bold" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
          </div>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
             <div className="flex items-center gap-3">
               <input type="checkbox" id="rec" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-primary" />
               <label htmlFor="rec" className="text-xs font-black uppercase text-slate-700">Repetir Mensalmente</label>
             </div>
             {form.is_recurring && <span className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded uppercase">Ativo</span>}
          </div>
        </div>
        <div className="flex gap-4 mt-10 pt-8 border-t">
          <button onClick={onClose} className="flex-1 py-4 border rounded-2xl font-bold uppercase text-[10px]">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold uppercase text-[10px] shadow-xl shadow-primary/20 hover:scale-105 transition-all">Salvar</button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Plus, Search, ArrowUpCircle, ArrowDownCircle, 
  MoreVertical, Edit2, Trash2, CheckCircle2, Clock, 
  Download, X, Loader2, Filter, AlertCircle
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
}

export function Transactions() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('due_date', { ascending: false });

      if (!error) setTransactions(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchTransactions(); 
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSave = async (formData: any) => {
    try {
      const dataToSave: any = { 
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        due_date: formData.due_date,
        status: formData.status,
        tenant_id: user?.tenant_id || '235bacfd-ac10-4ab0-88ee-b50ada2bda4d'
      };

      if (formData.category) dataToSave.category = formData.category;
      
      const { error } = await supabase.from('transactions').insert([dataToSave]);
      
      if (error) {
        setNotification({ type: 'error', message: `Erro ao salvar: ${error.message}` });
      } else {
        setNotification({ type: 'success', message: 'Lançamento salvo com sucesso!' });
        fetchTransactions();
        setShowModal(false);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Erro crítico de conexão com o servidor.' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setNotification({ type: 'success', message: 'Lançamento excluído.' });
      fetchTransactions();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await supabase.from('transactions').update({ status: newStatus }).eq('id', id);
    fetchTransactions();
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterType === 'all' || t.type === filterType)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 relative">
      {/* Notificação Nativa */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
               "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
               notification.type === 'success' ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-rose-500/90 text-white border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimentações</h1>
          <p className="text-sm text-muted-foreground font-medium">Controle todas as suas receitas e despesas.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 border rounded-xl text-sm font-semibold hover:bg-muted transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="relative flex-1 w-full md:max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               placeholder="Pesquisar transação..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-11 pr-4 py-2.5 bg-muted/40 border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
             />
           </div>
           <div className="flex bg-muted/40 p-1 rounded-xl border">
             {['all', 'income', 'expense'].map(t => (
               <button 
                key={t}
                onClick={() => setFilterType(t as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all", 
                  filterType === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
               >
                 {t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}
               </button>
             ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/30 border-b text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-8 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4 text-center">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-muted-foreground font-medium">Nenhum lançamento encontrado.</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-8 py-5 text-sm font-medium text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center", 
                         t.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                       )}>
                         {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                       </div>
                       <span className="font-semibold text-sm">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-2 py-0.5 bg-muted border rounded text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.category || 'GERAL'}</span>
                  </td>
                  <td className={cn(
                    "px-6 py-5 text-right font-bold text-sm tabular-nums", 
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handleToggleStatus(t.id, t.status)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all", 
                        t.status === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                      )}
                    >
                      {t.status === 'paid' ? 'EFETIVADO' : 'PENDENTE'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <TransactionModal 
            onClose={() => setShowModal(false)} 
            onSave={handleSave} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TransactionModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    description: '',
    amount: 0,
    type: 'income',
    status: 'pending',
    due_date: new Date().toISOString().split('T')[0],
    category: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border rounded-2xl p-8 w-full max-w-lg shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Novo Lançamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          <div className="flex bg-muted/40 p-1 rounded-xl border">
            <button onClick={() => setForm({...form, type: 'income'})} className={cn("flex-1 py-2.5 rounded-lg font-semibold text-xs transition-all", form.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground")}>RECEITA</button>
            <button onClick={() => setForm({...form, type: 'expense'})} className={cn("flex-1 py-2.5 rounded-lg font-semibold text-xs transition-all", form.type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground")}>DESPESA</button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Descrição</label>
            <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium" placeholder="Ex: Venda de Produto" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Valor (R$)</label>
              <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none tabular-nums" type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Data</label>
              <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-semibold text-muted-foreground ml-1">Categoria (Opcional)</label>
             <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none" placeholder="Ex: Vendas, Alimentação..." value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t font-semibold">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90">Salvar Lançamento</button>
        </div>
      </motion.div>
    </div>
  );
}

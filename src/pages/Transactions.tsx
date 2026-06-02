import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, 
  MoreVertical, Edit2, Trash2, CheckCircle2, Clock, 
  Download, X, Loader2
} from 'lucide-react';
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
  
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('due_date', { ascending: false });

      if (!error) setTransactions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSave = async (formData: any) => {
    try {
      // Inclui o tenant_id se disponível
      const dataToSave = { ...formData, tenant_id: user?.tenant_id };
      const { error } = await supabase.from('transactions').insert([dataToSave]);
      
      if (error) {
        alert('Erro ao salvar no banco: ' + error.message);
      } else {
        fetchTransactions();
        setShowModal(false);
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    await supabase.from('transactions').update({ status: newStatus }).eq('id', id);
    fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir transação?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchTransactions();
  };

  const handleExport = () => {
    const headers = 'Data,Descricao,Valor,Tipo,Status\n';
    const rows = transactions.map(t => `${t.due_date},${t.description},${t.amount},${t.type},${t.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transacoes.csv';
    a.click();
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterType === 'all' || t.type === filterType)
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground font-medium text-sm">Controle real de entradas e saídas.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="px-5 py-3 border-2 rounded-2xl font-bold hover:bg-muted transition-all flex items-center gap-2">
            <Download className="w-5 h-5" /> Exportar
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between gap-4 bg-muted/20">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               placeholder="Pesquisar..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-11 pr-4 py-3 bg-muted border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
             />
           </div>
           <div className="flex gap-1 p-1 bg-muted rounded-xl">
             {['all', 'income', 'expense'].map(t => (
               <button 
                key={t}
                onClick={() => setFilterType(t as any)}
                className={cn("px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest", filterType === t ? "bg-card shadow text-primary" : "text-muted-foreground")}
               >
                 {t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}
               </button>
             ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/10 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Data</th>
                <th className="px-6 py-5">Descrição</th>
                <th className="px-6 py-5">Categoria</th>
                <th className="px-6 py-5 text-right">Valor</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-muted-foreground font-bold">Nenhuma transação encontrada.</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                       <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
                         {t.type === 'income' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                       </div>
                       <span className="font-extrabold text-sm uppercase tracking-tight">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5"><span className="px-2 py-1 bg-muted rounded-md text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.category}</span></td>
                  <td className={cn("px-6 py-5 text-right font-black text-sm tabular-nums", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => handleToggleStatus(t.id, t.status)}
                      className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", t.status === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}
                    >
                      {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TransactionModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
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
    category: 'Outros'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-card border rounded-[3rem] p-10 w-full max-w-lg shadow-2xl space-y-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Novo Lançamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted rounded-2xl">
            <button onClick={() => setForm({...form, type: 'income'})} className={cn("py-3 rounded-xl font-black text-xs uppercase transition-all", form.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground")}>Receita</button>
            <button onClick={() => setForm({...form, type: 'expense'})} className={cn("py-3 rounded-xl font-black text-xs uppercase transition-all", form.type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground")}>Despesa</button>
          </div>
          <input className="w-full p-5 bg-muted border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 font-bold" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input className="w-full p-5 bg-muted border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 font-bold tabular-nums" type="number" placeholder="Valor (R$)" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
            <input className="w-full p-5 bg-muted border-none rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 font-bold" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 border-2 rounded-2xl font-black uppercase text-xs hover:bg-muted transition-all">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary/30 active:scale-95 transition-all">Salvar Lançamento</button>
        </div>
      </div>
    </div>
  );
}

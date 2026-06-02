import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, 
  MoreVertical, Edit2, Trash2, CheckCircle2, Clock, 
  Download, FileSpreadsheet
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
  account_id: string;
}

export function Transactions() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Real Fetch from Supabase
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('due_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', id);
    
    if (!error) fetchTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchTransactions();
  };

  // CSV Export logic
  const handleExport = () => {
    if (transactions.length === 0) return;
    const headers = ['Data', 'Descricao', 'Valor', 'Tipo', 'Status'];
    const rows = transactions.map(t => [
      t.due_date,
      t.description,
      t.amount,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.status === 'paid' ? 'Efetivado' : 'Pendente'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_pg_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Movimentações</h1>
          <p className="text-muted-foreground">Registre e controle todas as suas receitas e despesas.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 border-2 border-primary/20 bg-card hover:bg-muted rounded-2xl font-bold transition-all"
          >
            <Download className="w-5 h-5" /> Exportar
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <Plus className="w-5 h-5" /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-card border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Pesquisar descrição..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-muted/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-xl">
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  filterType === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {t === 'all' ? 'Tudo' : t === 'income' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                   <td colSpan={6} className="px-8 py-12 text-center text-muted-foreground font-medium">Carregando transações...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                   <td colSpan={6} className="px-8 py-12 text-center text-muted-foreground font-medium">Nenhuma transação encontrada.</td>
                </tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-8 py-5 text-sm font-medium text-muted-foreground">{new Date(t.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        t.type === 'income' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      )}>
                        {t.type === 'income' ? <ArrowUpCircle className="w-4.5 h-4.5" /> : <ArrowDownCircle className="w-4.5 h-4.5" />}
                      </div>
                      <span className="font-bold text-sm">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 bg-muted rounded-lg text-xs font-bold text-muted-foreground uppercase">{t.category}</span>
                  </td>
                  <td className={cn(
                    "px-6 py-5 text-right font-black text-sm tabular-nums",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '–'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => handleToggleStatus(t.id, t.status)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all",
                        t.status === 'paid' 
                          ? "bg-emerald-500/10 text-emerald-600" 
                          : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                      )}
                    >
                      {t.status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

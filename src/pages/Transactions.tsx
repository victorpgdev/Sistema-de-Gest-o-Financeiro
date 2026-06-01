import { useState, useMemo } from 'react';
import {
  Plus, Search, Filter, Download, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Calendar, X, ChevronDown, Check, Trash2, Edit2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type TxType   = 'income' | 'expense';
type TxStatus = 'paid' | 'pending';

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  type: TxType;
  status: TxStatus;
}

// ─── Initial mock data ─────────────────────────────────────────────────────────
const INITIAL: Transaction[] = [
  { id: '1', date: '2024-07-01', description: 'Consultoria Mensal – Cliente X', category: 'Serviços',       account: 'Itaú Unibanco', amount: 12000.00, type: 'income',  status: 'paid'    },
  { id: '2', date: '2024-07-02', description: 'Aluguel do Escritório',          category: 'Infraestrutura', account: 'Itaú Unibanco', amount: 2800.00,  type: 'expense', status: 'paid'    },
  { id: '3', date: '2024-07-03', description: 'Venda de Licença SaaS',          category: 'Serviços',       account: 'Nubank PJ',     amount: 4500.00,  type: 'income',  status: 'paid'    },
  { id: '4', date: '2024-07-04', description: 'Assinatura AWS',                  category: 'Tecnologia',    account: 'Nubank PJ',     amount: 450.20,   type: 'expense', status: 'paid'    },
  { id: '5', date: '2024-07-05', description: 'Salários da Equipe',              category: 'Pessoal',       account: 'Itaú Unibanco', amount: 15200.00, type: 'expense', status: 'pending' },
  { id: '6', date: '2024-07-06', description: 'Reembolso de Despesas',           category: 'Outros',        account: 'Caixa Interna', amount: 150.00,   type: 'income',  status: 'paid'    },
  { id: '7', date: '2024-07-10', description: 'Contrato Anual – Empresa ABC',   category: 'Serviços',       account: 'Itaú Unibanco', amount: 36000.00, type: 'income',  status: 'pending' },
  { id: '8', date: '2024-07-12', description: 'Conta de Energia',                category: 'Infraestrutura',account: 'Caixa Interna', amount: 380.00,   type: 'expense', status: 'pending' },
];

const CATEGORIES = ['Serviços', 'Infraestrutura', 'Tecnologia', 'Pessoal', 'Marketing', 'Outros'];
const ACCOUNTS   = ['Itaú Unibanco', 'Nubank PJ', 'Caixa Interna', 'Bradesco'];

// ─── Modal de Nova / Editar Transação ─────────────────────────────────────────
function TransactionModal({
  onClose,
  onSave,
  editing,
}: {
  onClose: () => void;
  onSave: (t: Transaction) => void;
  editing: Transaction | null;
}) {
  const [form, setForm] = useState({
    type:        (editing?.type        ?? 'income')  as TxType,
    description:  editing?.description ?? '',
    amount:       editing?.amount      ?? '',
    date:         editing?.date        ?? new Date().toISOString().split('T')[0],
    category:     editing?.category    ?? CATEGORIES[0],
    account:      editing?.account     ?? ACCOUNTS[0],
    status:       (editing?.status     ?? 'pending') as TxStatus,
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) return;
    onSave({
      id:          editing?.id ?? Date.now().toString(),
      date:        form.date,
      description: form.description.trim(),
      category:    form.category,
      account:     form.account,
      amount:      Number(form.amount),
      type:        form.type,
      status:      form.status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card border rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h2 className="text-xl font-bold">{editing ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            {(['income', 'expense'] as TxType[]).map(t => (
              <button
                key={t}
                onClick={() => set('type', t)}
                className={cn(
                  'py-3 rounded-2xl font-bold text-sm border-2 transition-all',
                  form.type === t
                    ? t === 'income'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                )}
              >
                {t === 'income' ? '↑ Receita' : '↓ Despesa'}
              </button>
            ))}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-bold text-muted-foreground block mb-2">Descrição *</label>
            <input
              autoFocus
              placeholder="Ex: Consultoria Mensal, Conta de Luz..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Valor + Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Valor (R$) *</label>
              <input
                type="number"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Data de Vencimento</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Categoria + Conta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Categoria</label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Conta / Carteiro</label>
              <select
                value={form.account}
                onChange={e => set('account', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-bold text-muted-foreground block mb-2">Status</label>
            <div className="grid grid-cols-2 gap-3">
              {(['pending', 'paid'] as TxStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => set('status', s)}
                  className={cn(
                    'py-2.5 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2',
                    form.status === s
                      ? s === 'paid'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700'
                        : 'bg-amber-500/10 border-amber-500 text-amber-700'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  {form.status === s && <Check className="w-4 h-4" />}
                  {s === 'paid' ? 'Efetivado' : 'Pendente'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3 bg-muted/20">
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-2xl font-bold text-sm hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.description || !form.amount}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-40"
          >
            {editing ? 'Salvar Alterações' : 'Lançar Transação'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function Transactions() {
  const [data,       setData]       = useState<Transaction[]>(INITIAL);
  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState<'all' | TxType>('all');
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<Transaction | null>(null);
  const [openMenu,   setOpenMenu]   = useState<string | null>(null);

  // Filtered list
  const filtered = useMemo(() => {
    return data.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase())
        || t.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [data, search, filterType]);

  const totals = useMemo(() => ({
    income:  data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    pending: data.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0),
  }), [data]);

  const handleSave = (tx: Transaction) => {
    setData(d => editing ? d.map(t => t.id === tx.id ? tx : t) : [tx, ...d]);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    setData(d => d.filter(t => t.id !== id));
    setOpenMenu(null);
  };

  const handleToggleStatus = (id: string) => {
    setData(d => d.map(t => t.id === id
      ? { ...t, status: t.status === 'paid' ? 'pending' : 'paid' }
      : t
    ));
    setOpenMenu(null);
  };

  const openEdit = (t: Transaction) => { setEditing(t); setShowModal(true); setOpenMenu(null); };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">Registre e acompanhe todas as movimentações financeiras.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-all">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4" /> Receitas
          </p>
          <h3 className="text-2xl font-extrabold text-emerald-700 tabular-nums">{formatCurrency(totals.income)}</h3>
        </div>
        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4" /> Despesas
          </p>
          <h3 className="text-2xl font-extrabold text-rose-700 tabular-nums">{formatCurrency(totals.expense)}</h3>
        </div>
        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pendente</p>
          <h3 className="text-2xl font-extrabold text-amber-700 tabular-nums">{formatCurrency(totals.pending)}</h3>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        {/* Filters bar */}
        <div className="p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar descrição ou categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'income', 'expense'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold border transition-all',
                  filterType === f
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground font-medium">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors group relative">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      )}>
                        {t.type === 'income'
                          ? <ArrowUpRight className="w-4 h-4" />
                          : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-sm max-w-xs truncate">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{t.account}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(t.id)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95',
                        t.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      )}
                    >
                      {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                    </button>
                  </td>
                  <td className={cn(
                    'px-6 py-4 text-right font-bold text-sm tabular-nums whitespace-nowrap',
                    t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {t.type === 'income' ? '+' : '–'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-4 text-right relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                      className="p-2 hover:bg-muted rounded-xl transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {openMenu === t.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                        <div className="absolute right-4 top-full mt-1 w-44 bg-card border rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                          <button
                            onClick={() => openEdit(t)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" /> Editar
                          </button>
                          <button
                            onClick={() => handleToggleStatus(t.id)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
                          >
                            <Check className="w-4 h-4 text-muted-foreground" />
                            {t.status === 'paid' ? 'Marcar Pendente' : 'Marcar Efetivado'}
                          </button>
                          <div className="h-px bg-border mx-2 my-1" />
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t bg-muted/10 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {filtered.length} transaç{filtered.length === 1 ? 'ão' : 'ões'}
            {filterType !== 'all' || search ? ` filtrada${filtered.length === 1 ? '' : 's'}` : ''}
          </span>
          <span className={cn(
            'text-sm font-bold',
            totals.income - totals.expense >= 0 ? 'text-emerald-600' : 'text-rose-600'
          )}>
            Saldo: {formatCurrency(totals.income - totals.expense)}
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TransactionModal
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
          editing={editing}
        />
      )}
    </div>
  );
}

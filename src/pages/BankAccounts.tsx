import { useState } from 'react';
import {
  Plus, Wallet, ArrowRightLeft, TrendingUp, X, Check, Trash2, Edit2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface Account {
  id: string;
  bank: string;
  type: 'Checking' | 'Savings' | 'Investment' | 'Cash';
  balance: number;
  agency: string;
  number: string;
  color: string;
}

const TYPE_LABELS: Record<Account['type'], string> = {
  Checking:   'Conta Corrente',
  Savings:    'Conta Poupança',
  Investment: 'Investimentos',
  Cash:       'Caixa',
};

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const INITIAL: Account[] = [
  { id: '1', bank: 'Itaú Unibanco', type: 'Checking',   balance: 45200.50, agency: '0001', number: '12345-6', color: '#f97316' },
  { id: '2', bank: 'Nubank PJ',     type: 'Investment', balance: 80000.00, agency: '0001', number: '98765-4', color: '#8b5cf6' },
  { id: '3', bank: 'Caixa Interna', type: 'Cash',       balance: 230.00,   agency: '—',    number: '—',        color: '#10b981' },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
function AccountModal({
  onClose,
  onSave,
  editing,
}: {
  onClose: () => void;
  onSave: (a: Account) => void;
  editing: Account | null;
}) {
  const [form, setForm] = useState({
    bank:    editing?.bank    ?? '',
    type:    (editing?.type   ?? 'Checking') as Account['type'],
    balance: editing?.balance ?? '',
    agency:  editing?.agency  ?? '',
    number:  editing?.number  ?? '',
    color:   editing?.color   ?? COLORS[0],
  });

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.bank.trim()) return;
    onSave({
      id:      editing?.id ?? Date.now().toString(),
      bank:    form.bank.trim(),
      type:    form.type,
      balance: Number(form.balance) || 0,
      agency:  form.agency || '—',
      number:  form.number || '—',
      color:   form.color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-card border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h2 className="text-xl font-bold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm font-bold text-muted-foreground block mb-2">Nome da Conta / Banco *</label>
            <input
              autoFocus
              placeholder="Ex: Itaú Empresarial, Nubank PJ..."
              value={form.bank}
              onChange={e => set('bank', e.target.value)}
              className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Tipo</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                {(Object.keys(TYPE_LABELS) as Account['type'][]).map(k => (
                  <option key={k} value={k}>{TYPE_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Saldo Inicial (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={form.balance}
                onChange={e => set('balance', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Agência</label>
              <input
                placeholder="0001"
                value={form.agency}
                onChange={e => set('agency', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-muted-foreground block mb-2">Número da Conta</label>
              <input
                placeholder="12345-6"
                value={form.number}
                onChange={e => set('number', e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-muted-foreground block mb-3">Cor do Cartão</label>
            <div className="flex gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => set('color', c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all',
                    form.color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3 bg-muted/20">
          <button onClick={onClose} className="flex-1 py-3 border rounded-2xl font-bold text-sm hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.bank.trim()}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-40"
          >
            {editing ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function BankAccounts() {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<Account | null>(null);
  const [openMenu,  setOpenMenu]  = useState<string | null>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const onSave = (a: Account) => {
    setAccounts(d => editing ? d.map(x => x.id === a.id ? a : x) : [...d, a]);
    setEditing(null);
  };

  const onDelete = (id: string) => {
    setAccounts(d => d.filter(a => a.id !== id));
    setOpenMenu(null);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setShowModal(true);
    setOpenMenu(null);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas e Saldos</h1>
          <p className="text-muted-foreground">Gerencie suas contas bancárias e carteiras.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      {/* Total card */}
      <div className="p-6 bg-gradient-to-br from-primary to-blue-600 text-white rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-semibold mb-1">Patrimônio Total</p>
          <h2 className="text-4xl font-extrabold tabular-nums">{formatCurrency(totalBalance)}</h2>
          <p className="text-white/60 text-xs mt-2">{accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativa{accounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
          <Wallet className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div
            key={acc.id}
            className="relative p-6 bg-card border rounded-3xl shadow-sm hover:shadow-md transition-all group overflow-hidden"
          >
            {/* color stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ backgroundColor: acc.color }} />

            {/* Options menu */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setOpenMenu(openMenu === acc.id ? null : acc.id)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              {openMenu === acc.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                  <div className="absolute right-0 top-8 w-44 bg-card border rounded-2xl shadow-xl z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => openEdit(acc)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" /> Editar
                    </button>
                    <div className="h-px bg-border mx-2 my-1" />
                    <button
                      onClick={() => onDelete(acc.id)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6 mt-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md"
                style={{ backgroundColor: acc.color }}
              >
                {acc.bank[0]}
              </div>
              <div>
                <h3 className="font-bold">{acc.bank}</h3>
                <p className="text-xs text-muted-foreground font-semibold">{TYPE_LABELS[acc.type]}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Saldo Atual</p>
              <h3 className={cn(
                'text-3xl font-extrabold tabular-nums',
                acc.balance < 0 ? 'text-rose-600' : ''
              )}>
                {formatCurrency(acc.balance)}
              </h3>
            </div>

            <div className="mt-5 pt-5 border-t flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Ag: {acc.agency} • C: {acc.number}</span>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{((acc.balance / totalBalance) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="p-6 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-3xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-all group"
        >
          <div className="w-12 h-12 bg-muted group-hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Adicionar Conta</span>
        </button>
      </div>

      {showModal && (
        <AccountModal
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={onSave}
          editing={editing}
        />
      )}
    </div>
  );
}

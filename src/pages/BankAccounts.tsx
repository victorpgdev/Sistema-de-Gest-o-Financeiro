import { useState, useEffect } from 'react';
import {
  Plus, Wallet, ArrowRightLeft, TrendingUp, X, Check, Trash2, Edit2, Loader2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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

export function BankAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState<Account | null>(null);
  const [openMenu,  setOpenMenu]  = useState<string | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('bank_accounts').select('*').order('bank');
    if (!error) setAccounts(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const onSave = async (formData: any) => {
    if (editing) {
      await supabase.from('bank_accounts').update(formData).eq('id', editing.id);
    } else {
      await supabase.from('bank_accounts').insert([formData]);
    }
    fetchAccounts();
    setShowModal(false);
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return;
    await supabase.from('bank_accounts').delete().eq('id', id);
    fetchAccounts();
    setOpenMenu(null);
  };

  return (
    <div className="space-y-8 pb-8">
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

      <div className="p-6 bg-gradient-to-br from-primary to-blue-600 text-white rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-sm font-semibold mb-1">Patrimônio Total</p>
          <h2 className="text-4xl font-extrabold tabular-nums">{formatCurrency(totalBalance)}</h2>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
          <Wallet className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : accounts.map(acc => (
          <div key={acc.id} className="relative p-6 bg-card border rounded-3xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: acc.color }} />
            <div className="absolute top-4 right-4">
              <button onClick={() => setOpenMenu(openMenu === acc.id ? null : acc.id)} className="p-1.5 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              {openMenu === acc.id && (
                <div className="absolute right-0 top-8 w-40 bg-card border rounded-2xl shadow-xl z-20 py-1">
                  <button onClick={() => { setEditing(acc); setShowModal(true); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm font-bold hover:bg-muted"><Edit2 className="w-4 h-4" /> Editar</button>
                  <button onClick={() => onDelete(acc.id)} className="flex items-center gap-2 w-full px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /> Excluir</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-inner" style={{ backgroundColor: acc.color }}>{acc.bank[0]}</div>
              <div><h3 className="font-bold">{acc.bank}</h3><p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">{TYPE_LABELS[acc.type]}</p></div>
            </div>
            <h3 className="text-3xl font-black tabular-nums">{formatCurrency(acc.balance)}</h3>
            <div className="mt-5 pt-5 border-t text-[11px] font-bold text-muted-foreground">Ag: {acc.agency} • C: {acc.number}</div>
          </div>
        ))}
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="p-6 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-3xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-all group"><Plus className="w-8 h-8" /><span className="font-bold">Adicionar Conta</span></button>
      </div>

      {showModal && (
        <AccountFormModal
          editing={editing}
          onClose={() => setShowModal(false)}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function AccountFormModal({ editing, onClose, onSave }: any) {
  const [form, setForm] = useState({
    bank: editing?.bank || '',
    type: editing?.type || 'Checking',
    balance: editing?.balance || 0,
    agency: editing?.agency || '',
    number: editing?.number || '',
    color: editing?.color || COLORS[0]
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-black">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
        <div className="space-y-4">
          <input className="w-full p-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="Nome do Banco" value={form.bank} onChange={e => setForm({...form, bank: e.target.value})} />
          <select className="w-full p-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className="w-full p-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold" placeholder="Saldo (R$)" type="number" value={form.balance} onChange={e => setForm({...form, balance: Number(e.target.value)})} />
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 border-2 rounded-2xl font-black hover:bg-muted">CANCELA</button>
          <button onClick={() => onSave(form)} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30">SALVAR</button>
        </div>
      </div>
    </div>
  );
}

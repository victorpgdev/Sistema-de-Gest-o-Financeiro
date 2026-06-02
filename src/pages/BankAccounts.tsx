import { useState, useEffect } from 'react';
import {
  Plus, Wallet, ArrowRightLeft, Trash2, Edit2, Loader2, X, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

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
  Cash:       'Dinheiro em Espécie',
};

export function BankAccounts() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('bank_accounts').select('*').order('bank');
    if (!error) setAccounts(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const handleSave = async (formData: any) => {
    try {
      const dataToSave = {
        ...formData,
        tenant_id: user?.tenant_id || '235bacfd-ac10-4ab0-88ee-b50ada2bda4d'
      };

      let error;
      if (editing) {
        ({ error } = await supabase.from('bank_accounts').update(dataToSave).eq('id', editing.id));
      } else {
        ({ error } = await supabase.from('bank_accounts').insert([dataToSave]));
      }

      if (error) {
        alert('Erro ao salvar no banco: ' + error.message);
      } else {
        fetchAccounts();
        setShowModal(false);
        setEditing(null);
      }
    } catch (err) {
      alert('Erro de conexão ao salvar.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta conta permanentemente?')) return;
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (!error) fetchAccounts();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas e Saldos</h1>
          <p className="text-sm text-muted-foreground font-medium">Gerencie suas instituições bancárias e disponibilidades.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      {/* Patrimônio Resumo Clean */}
      <div className="p-8 bg-card border rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Patrimônio Líquido Total</p>
          <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalBalance)}</h2>
        </div>
        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center relative z-10">
          <Wallet className="w-7 h-7 text-primary" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> 
            <span className="text-sm font-medium">Carregando contas...</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-dashed rounded-2xl">
            Nenhuma conta cadastrada. Clique em "Nova Conta" para começar.
          </div>
        ) : (
          accounts.map(acc => (
            <div key={acc.id} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: acc.color }} />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-inner" style={{ backgroundColor: acc.color }}>
                    {acc.bank[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{acc.bank}</h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">{TYPE_LABELS[acc.type]}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(acc); setShowModal(true); }} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Saldo Disponível</p>
                  <span className="text-2xl font-bold tracking-tight tabular-nums">{formatCurrency(acc.balance)}</span>
                </div>
                <div className="pt-4 border-t flex justify-between text-[10px] font-semibold text-muted-foreground">
                  <span>Agência: {acc.agency}</span>
                  <span>Conta: {acc.number}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <AccountModal
            editing={editing}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountModal({ editing, onClose, onSave }: any) {
  const [form, setForm] = useState({
    bank: editing?.bank || '',
    type: editing?.type || 'Checking',
    balance: editing?.balance || 0,
    agency: editing?.agency || '',
    number: editing?.number || '',
    color: editing?.color || '#3b82f6'
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
          <h2 className="text-xl font-semibold">{editing ? 'Editar Conta' : 'Nova Conta'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Instituição Financeira</label>
            <input 
              className="w-full p-4 bg-muted/40 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium" 
              placeholder="Ex: Nubank, Itaú, Santander..." 
              value={form.bank} 
              onChange={e => setForm({...form, bank: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Tipo de Conta</label>
              <select 
                className="w-full p-4 bg-muted/40 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                value={form.type} 
                onChange={e => setForm({...form, type: e.target.value as any})}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Saldo Atual (R$)</label>
              <input 
                className="w-full p-4 bg-muted/40 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium tabular-nums" 
                type="number" 
                value={form.balance || ''} 
                onChange={e => setForm({...form, balance: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Agência</label>
                <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none" value={form.agency} onChange={e => setForm({...form, agency: e.target.value})} />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ml-1">Conta (com dígito)</label>
                <input className="w-full p-4 bg-muted/40 border rounded-xl outline-none" value={form.number} onChange={e => setForm({...form, number: e.target.value})} />
             </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t font-semibold">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl hover:bg-muted transition-colors">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90">Salvar Conta</button>
        </div>
      </motion.div>
    </div>
  );
}

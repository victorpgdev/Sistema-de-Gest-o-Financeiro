import { useState, useEffect } from 'react';
import { 
  Plus, Search, Wallet, MoreVertical, Trash2, 
  CheckCircle2, X, Loader2, Landmark, AlertCircle,
  Building2, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

import { GLOBAL_BANKS } from '@/lib/banks';

interface BankAccount {
  id: string;
  bank_name: string;
  type: string;
  balance: number;
  account_number: string;
  agency: string;
}

export function BankAccounts() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchAccounts = async () => {
    if (!user?.tenant_id && user?.role !== 'MASTER') return;
    setIsLoading(true);
    try {
      const query = supabase.from('bank_accounts').select('*');
      
      // Se não for MASTER (ou se o Master quiser ver apenas o dele), filtra por tenant_id
      if (user?.tenant_id) {
        query.eq('tenant_id', user.tenant_id);
      }

      const { data, error } = await query.order('bank_name');
      if (!error) setAccounts(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchAccounts(); 
// ... (rest of useEffect)
  }, [user, notification]);

  const handleSave = async (formData: any) => {
    if (!user?.tenant_id) {
      setNotification({ type: 'error', message: 'Erro: Usuário sem empresa vinculada.' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('bank_accounts').insert([{
        ...formData,
        tenant_id: user.tenant_id
      }]);

      if (error) {
        setNotification({ type: 'error', message: `Erro: ${error.message}` });
      } else {
        setNotification({ type: 'success', message: 'Conta bancária cadastrada!' });
        fetchAccounts();
        setShowModal(false);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Erro ao conectar ao banco.' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (!error) {
      setNotification({ type: 'success', message: 'Conta removida.' });
      fetchAccounts();
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              notification.type === 'success' ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-rose-500/90 text-white border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas e Saldos</h1>
          <p className="text-sm text-muted-foreground font-medium">Gerencie suas instituições bancárias e disponibilidades.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> Nova Conta
        </button>
      </div>

      <div className="bg-card border rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
        <div className="relative">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Patrimônio Líquido Total</p>
          <div className="flex items-end gap-3 font-black text-4xl md:text-5xl tracking-tighter">
            <span className="text-primary opacity-40 text-2xl mb-1">R$</span>
            {formatCurrency(totalBalance).replace('R$', '')}
          </div>
        </div>
        <div className="absolute right-12 top-1/2 -translate-y-1/2 w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground gap-3">
             <Landmark className="w-12 h-12 opacity-10" />
             <p className="font-semibold">Nenhuma conta cadastrada.</p>
          </div>
        ) : accounts.map(acc => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={acc.id} 
            className="bg-card border rounded-[2rem] p-6 hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6 text-primary" />
              </div>
              <button 
                onClick={() => handleDelete(acc.id)}
                className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">{acc.bank_name}</h3>
              <p className="text-xs font-semibold text-muted-foreground uppercase opacity-60 tracking-wider font-mono">
                Ag {acc.agency} • CC {acc.account_number}
              </p>
            </div>
            <div className="mt-6 pt-6 border-t flex items-center justify-between">
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{acc.type === 'checking' ? 'Corrente' : 'Poupança'}</span>
               <span className="font-bold text-lg tabular-nums">{formatCurrency(acc.balance)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="bg-card border rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative"
             >
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-bold tracking-tight">Nova Conta</h2>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-muted rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
                </div>

                <BankForm onSave={handleSave} onCancel={() => setShowModal(false)} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BankForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    bank_name: '',
    type: 'checking',
    balance: 0,
    agency: '',
    account_number: ''
  });
  const [bankSuggestions, setBankSuggestions] = useState<any[]>([]);

  const handleBankSearch = (val: string) => {
    setFormData({...formData, bank_name: val});
    if (val.length > 1) {
      const filtered = GLOBAL_BANKS.filter(b => b.name.toLowerCase().includes(val.toLowerCase()));
      setBankSuggestions(filtered);
    } else {
      setBankSuggestions([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 relative">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Building2 className="w-3 h-3" /> Instituição Financeira
        </label>
        <div className="relative">
          <input 
            className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" 
            placeholder="Ex: Nubank, Itaú, Chase..." 
            value={formData.bank_name}
            onChange={e => handleBankSearch(e.target.value)}
          />
          <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-20" />
        </div>
        
        <AnimatePresence>
          {bankSuggestions.length > 0 && (
            <motion.div 
               initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
               className="absolute z-10 w-full mt-2 bg-card border rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto"
            >
              {bankSuggestions.map(b => (
                <button 
                  key={b.code} 
                  onClick={() => { setFormData({...formData, bank_name: b.name}); setBankSuggestions([]); }}
                  className="w-full px-6 py-3 text-left hover:bg-primary hover:text-white transition-colors text-sm font-bold flex items-center justify-between"
                >
                  {b.name} <span className="text-[10px] opacity-60">#{b.code}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Tipo de Conta</label>
          <select 
            className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold appearance-none cursor-pointer"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="checking">Conta Corrente</option>
            <option value="savings">Conta Poupança</option>
            <option value="investment">Corretora / Investimento</option>
            <option value="cash">Caixa / Dinheiro</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Saldo Atual (R$)</label>
          <input 
            type="number"
            className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" 
            placeholder="0,00"
            value={formData.balance || ''}
            onChange={e => setFormData({...formData, balance: Number(e.target.value)})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Agência</label>
          <input 
            className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" 
            placeholder="0001"
            value={formData.agency}
            onChange={e => setFormData({...formData, agency: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Conta (com dígito)</label>
          <input 
            className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" 
            placeholder="12345-6"
            value={formData.account_number}
            onChange={e => setFormData({...formData, account_number: e.target.value})}
          />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button onClick={onCancel} className="flex-1 py-4 border rounded-[1.5rem] font-bold text-muted-foreground hover:bg-muted transition-all">CANCELAR</button>
        <button 
          onClick={() => onSave(formData)}
          className="flex-1 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
        >
          SALVAR CONTA
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Wallet, MoreVertical, Trash2, 
  CheckCircle2, X, Loader2, Landmark, AlertCircle,
  Building2, Globe, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { GLOBAL_BANKS } from '@/lib/banks';
import { checkPlanLimit, logAuditAction, PLAN_LIMITS } from '@/lib/limits';
import { security } from '@/lib/security';

interface BankAccount {
  id: string;
  bank_name: string;
  type: string;
  balance: number;
  account_number: string;
  agency: string;
}

export function BankAccounts() {
  const { user, tenant } = useAuthStore();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BankAccount | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchAccounts = async () => {
    if (!user?.tenant_id && user?.role !== 'MASTER') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const query = supabase.from('bank_accounts').select('*');
      if (user?.tenant_id) {
        query.eq('tenant_id', user.tenant_id);
      }
      const { data, error } = await query.order('bank_name');
      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      console.warn('BankAccounts fetch warning:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchAccounts(); 
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, notification]);

  const handleSave = async (formData: any) => {
    if (!user?.tenant_id) {
      setNotification({ type: 'error', message: 'Erro: Usuário sem empresa vinculada.' });
      return;
    }

    const sanitizedData = {
      ...formData,
      bank_name: security.sanitize(formData.bank_name),
      agency: security.sanitize(formData.agency),
      account_number: security.sanitize(formData.account_number)
    };

    const userPlan = tenant?.plan || 'Basic';
    const canAdd = await checkPlanLimit(user.tenant_id, userPlan, 'bankAccounts');
    
    if (!canAdd) {
      const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]?.bankAccounts;
      setNotification({ 
        type: 'error', 
        message: `Limite de Plano: O plano ${userPlan} permite apenas ${limit} conta(s). Faça upgrade!` 
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('bank_accounts').insert([{
        ...sanitizedData,
        tenant_id: user.tenant_id
      }]);

      if (error) {
        setNotification({ type: 'error', message: `Erro ao salvar: ${error.message}` });
      } else {
        await logAuditAction(user.tenant_id, user.id, 'CREATE_BANK_ACCOUNT', { bank: sanitizedData.bank_name });
        setNotification({ type: 'success', message: 'Conta cadastrada com sucesso!' });
        fetchAccounts();
        setShowModal(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw error;
      await logAuditAction(user?.tenant_id!, user?.id!, 'DELETE_BANK_ACCOUNT', { id });
      setNotification({ type: 'success', message: '🔄 Conta removida com sucesso.' });
      fetchAccounts();
      setConfirmDelete(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

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
          <h1 className="text-2xl font-semibold tracking-tight">Contas e Saldos</h1>
          <p className="text-sm text-muted-foreground font-medium">Bancos e disponibilidades do seu negócio.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5" /> Nova Conta
        </button>
      </div>

      <div className="bg-card border rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
        <div className="relative">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Patrimônio Líquido Total</p>
          <div className="flex items-end gap-3 font-black text-4xl md:text-5xl tracking-tighter text-slate-800">
            <span className="text-primary opacity-40 text-2xl mb-1 italic">R$</span>
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
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={acc.id} 
            className="bg-card border rounded-[2rem] p-6 hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Landmark className="w-6 h-6 text-primary" />
              </div>
              <button onClick={() => setConfirmDelete(acc)} className="p-2 hover:bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-slate-700">{acc.bank_name}</h3>
              <p className="text-xs font-semibold text-muted-foreground uppercase opacity-60 tracking-wider font-mono">
                Ag {security.maskFinancialData(acc.agency)} • CC {security.maskFinancialData(acc.account_number)}
              </p>
            </div>
            <div className="mt-6 pt-6 border-t flex items-center justify-between">
               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{acc.type}</span>
               <span className="font-bold text-lg tabular-nums text-slate-800">{formatCurrency(acc.balance)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-card border rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-bold tracking-tight">Nova Conta</h2>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-muted rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
                </div>
                <BankForm onSave={handleSave} onCancel={() => setShowModal(false)} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Conta?</h3>
              <p className="text-sm text-slate-500 mb-8">Esta ação removerá o banco "{confirmDelete.bank_name}" e todos os dados vinculados.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-rose-200 hover:scale-105 transition-all">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ACCOUNT_TYPES = [
  { id: 'checking', label: '🏦 Conta Corrente' },
  { id: 'savings', label: '💰 Poupança' },
  { id: 'investment', label: '📈 Investimento' },
  { id: 'cash', label: '💵 Caixa / Dinheiro' }
];

function BankForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({ bank_name: '', type: 'checking', balance: 0, agency: '', account_number: '' });
  const [bankSuggestions, setBankSuggestions] = useState<any[]>([]);
  const [isOpenType, setIsOpenType] = useState(false);

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
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Instituição Financeira</label>
        <div className="relative">
          <input className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" placeholder="Filtre pelo nome do banco..." value={formData.bank_name} onChange={e => handleBankSearch(e.target.value)} />
          <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-20" />
        </div>
        <AnimatePresence>
          {bankSuggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-10 w-full mt-2 bg-card border rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
              {bankSuggestions.map(b => (<button key={b.code} onClick={() => { setFormData({...formData, bank_name: b.name}); setBankSuggestions([]); }} className="w-full px-6 py-3 text-left hover:bg-primary hover:text-white transition-colors text-sm font-bold flex items-center justify-between">{b.name} <span className="text-[10px] opacity-60">#{b.code}</span></button>))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2 relative">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo de Conta</label>
          <div onClick={() => setIsOpenType(!isOpenType)} className="w-full p-4 bg-muted/40 border rounded-2xl cursor-pointer flex items-center justify-between hover:border-primary/40 transition-all font-bold text-sm">
            <span>{ACCOUNT_TYPES.find(t => t.id === formData.type)?.label}</span>
            <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpenType && "rotate-180")} />
          </div>
          <AnimatePresence>
            {isOpenType && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded-2xl shadow-2xl p-1 overflow-hidden">
                {ACCOUNT_TYPES.map(opt => (
                  <button key={opt.id} onClick={() => { setFormData({...formData, type: opt.id}); setIsOpenType(false); }} className={cn("w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all", formData.type === opt.id ? "bg-primary text-white" : "hover:bg-slate-50")}>
                    {opt.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2"><label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Saldo Inicial (R$)</label><input type="number" className="w-full p-4 bg-muted/40 border rounded-2xl outline-none font-bold" value={formData.balance || ''} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} /></div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Agência</label><input className="w-full p-4 bg-muted/40 border rounded-2xl outline-none font-bold" placeholder="0001" value={formData.agency} onChange={e => setFormData({...formData, agency: e.target.value})} /></div>
        <div className="space-y-2"><label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Conta + Dígito</label><input className="w-full p-4 bg-muted/40 border rounded-2xl outline-none font-bold" placeholder="12345-6" value={formData.account_number} onChange={e => setFormData({...formData, account_number: e.target.value})} /></div>
      </div>

      <div className="flex gap-4 mt-8 pt-6 border-t font-semibold">
          <button onClick={onCancel} className="flex-1 py-4 border rounded-2xl hover:bg-muted transition-all uppercase text-xs">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-xs">Salvar Conta</button>
      </div>
    </div>
  );
}

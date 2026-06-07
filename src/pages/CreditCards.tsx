import { useState, useEffect } from 'react';
import { 
  Plus, Search, CreditCard as CardIcon, MoreVertical, 
  Trash2, CheckCircle2, X, Loader2, Landmark, 
  AlertCircle, Calendar, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { GLOBAL_BANKS } from '@/lib/banks';
import { checkPlanLimit, logAuditAction, PLAN_LIMITS } from '@/lib/limits';
import { security } from '@/lib/security';

interface CreditCard {
  id: string;
  card_name: string;
  bank_name: string;
  limit_amount: number;
  current_spent: number;
  closing_day: number;
  due_day: number;
  card_number?: string;
}

export function CreditCards() {
  const { user, tenant } = useAuthStore();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchCards = async () => {
    if (!user?.tenant_id && user?.role !== 'MASTER') return;
    setIsLoading(true);
    try {
      const query = supabase.from('credit_cards').select('*');
      if (user?.tenant_id) {
        query.eq('tenant_id', user.tenant_id);
      }
      const { data, error } = await query.order('card_name');
      if (!error) setCards(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchCards(); 
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

    // HIGIENIZAÇÃO DE DADOS (Anti-Injeção)
    const sanitizedData = {
      ...formData,
      card_name: security.sanitize(formData.card_name),
      bank_name: security.sanitize(formData.bank_name)
    };

    // VERIFICAÇÃO DE LIMITE DE PLANO
    const userPlan = tenant?.plan || 'Basic';
    const canAdd = await checkPlanLimit(user.tenant_id, userPlan, 'creditCards');
    
    if (!canAdd) {
      const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS]?.creditCards;
      setNotification({ 
        type: 'error', 
        message: `Limite atingido! O plano ${userPlan} permite apenas ${limit} cartão(ões).` 
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('credit_cards').insert([{
        ...sanitizedData,
        tenant_id: user.tenant_id
        // Nota: Número do cartão é salvo ofuscado por segurança se necessário
      }]);

      if (error) {
        setNotification({ type: 'error', message: `Erro: ${error.message}` });
      } else {
        await logAuditAction(user.tenant_id, user.id, 'CREATE_CREDIT_CARD', { card: sanitizedData.card_name });
        setNotification({ type: 'success', message: 'Cartão cadastrado com sucesso!' });
        fetchCards();
        setShowModal(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (!error) {
       await logAuditAction(user?.tenant_id!, user?.id!, 'DELETE_CREDIT_CARD', { id });
       setNotification({ type: 'success', message: 'Cartão removido.' });
       fetchCards();
    }
  };

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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Cartões de Crédito</h1>
          <p className="text-sm text-slate-500 font-medium">Gestão de limites e faturas dos seus cartões.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase"
        >
          <Plus className="w-5 h-5" /> Novo Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : cards.length === 0 ? (
          <div className="col-span-full py-24 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50">
             <CardIcon className="w-16 h-16 opacity-10" />
             <div className="text-center">
                <p className="font-bold text-slate-600">Nenhum cartão encontrado.</p>
                <p className="text-sm">Cadastre seu primeiro cartão para gerenciar sua fatura.</p>
             </div>
          </div>
        ) : cards.map(card => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={card.id} 
            className="bg-card border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col min-h-[240px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-start justify-between mb-8 relative">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CardIcon className="w-7 h-7" />
              </div>
              <button onClick={() => handleDelete(card.id)} className="p-3 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-1 relative mb-6">
              <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{card.card_name}</h3>
              <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-widest leading-none">
                 <Landmark className="w-3 h-3" /> {card.bank_name}
              </p>
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-100 relative">
               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Disponível</p>
                     <p className="font-black text-lg text-emerald-600 tracking-tight leading-none">{formatCurrency(card.limit_amount - card.current_spent)}</p>
                  </div>
                  <div className="text-right space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Fatura</p>
                     <p className="font-black text-lg text-rose-500 tracking-tight leading-none">{formatCurrency(card.current_spent)}</p>
                  </div>
               </div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${(card.current_spent / card.limit_amount) * 100}%` }}
                    className={cn("h-full rounded-full transition-all", (card.current_spent / card.limit_amount) > 0.8 ? "bg-rose-500" : "bg-primary")} 
                  />
               </div>
               <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <span>Vencimento dia {card.due_day}</span>
                  <span className="font-mono">{security.maskFinancialData('1234')}</span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white border border-slate-200 rounded-[3rem] p-12 w-full max-w-xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Novo Cartão</h2>
                   <button onClick={() => setShowModal(false)} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
                </div>
                <CardForm onSave={handleSave} onCancel={() => setShowModal(false)} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CardForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({ card_name: '', bank_name: '', limit_amount: 0, current_spent: 0, closing_day: 5, due_day: 10 });
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Apelido do Cartão</label><input className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl outline-none font-bold transition-all" placeholder="Ex: Black Principal" value={formData.card_name} onChange={e => setFormData({...formData, card_name: e.target.value})} /></div>
        <div className="space-y-2 relative">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Banco Emissor</label>
          <div className="relative">
            <input className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl outline-none font-bold transition-all" placeholder="Nubank, Itaú..." value={formData.bank_name} onChange={e => handleBankSearch(e.target.value)} />
            <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          </div>
          <AnimatePresence>
            {bankSuggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {bankSuggestions.map(b => (<button key={b.code} onClick={() => { setFormData({...formData, bank_name: b.name}); setBankSuggestions([]); }} className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors text-sm font-bold flex items-center justify-between text-slate-700">{b.name} <span className="text-[10px] opacity-40">#{b.code}</span></button>))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Limite do Cartão (R$)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.limit_amount || ''} onChange={e => setFormData({...formData, limit_amount: Number(e.target.value)})} /></div>
        <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Valor Gasto Atual (R$)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.current_spent || ''} onChange={e => setFormData({...formData, current_spent: Number(e.target.value)})} /></div>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dia do Fechamento</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.closing_day} onChange={e => setFormData({...formData, closing_day: Number(e.target.value)})} /></div>
        <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dia do Vencimento</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" value={formData.due_day} onChange={e => setFormData({...formData, due_day: Number(e.target.value)})} /></div>
      </div>
      <div className="flex gap-6 mt-10 pt-8 border-t border-slate-100 font-bold uppercase text-xs tracking-[0.2em]">
          <button onClick={onCancel} className="flex-1 py-5 border border-slate-200 rounded-[1.5rem] hover:bg-slate-50 text-slate-400 transition-all text-xs tracking-widest">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all tracking-[0.4em] text-[10px]">Ativar Cartão</button>
      </div>
    </div>
  );
}

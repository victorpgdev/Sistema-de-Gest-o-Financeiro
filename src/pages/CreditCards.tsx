import { useState, useEffect } from 'react';
import { 
  Plus, CreditCard, MoreVertical, Trash2, 
  CheckCircle2, X, Loader2, Landmark, AlertCircle,
  Building2, Camera, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface Card {
  id: string;
  name: string;
  limit: number;
  last_digits: string;
  closing_day: number;
  due_day: number;
  current_bill: number;
  color?: string;
}

const MAJOR_BANKS = [
  { name: 'Nubank', color: 'bg-purple-600', textColor: 'text-white' },
  { name: 'Itaú Business', color: 'bg-orange-500', textColor: 'text-white' },
  { name: 'Bradesco', color: 'bg-red-600', textColor: 'text-white' },
  { name: 'Santander', color: 'bg-rose-600', textColor: 'text-white' },
  { name: 'Banco do Brasil', color: 'bg-yellow-400', textColor: 'text-blue-900' },
  { name: 'Inter', color: 'bg-orange-600', textColor: 'text-white' },
  { name: 'BTG Pactual', color: 'bg-slate-900', textColor: 'text-white' },
  { name: 'C6 Bank', color: 'bg-zinc-900', textColor: 'text-white' },
  { name: 'Chase', color: 'bg-blue-800', textColor: 'text-white' },
  { name: 'Wells Fargo', color: 'bg-red-700', textColor: 'text-white' },
  { name: 'Bank of America', color: 'bg-blue-700', textColor: 'text-white' },
];

export function CreditCards() {
  const { user } = useAuthStore();
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .order('name');
      if (!error) setCards(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchCards(); 
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSave = async (formData: any) => {
    const bankColor = MAJOR_BANKS.find(b => formData.name.includes(b.name))?.color || 'bg-slate-800';
    setIsLoading(true);
    try {
      const { error } = await supabase.from('credit_cards').insert([{
        name: formData.name,
        limit: formData.limit,
        last_digits: formData.last_digits,
        closing_day: formData.closing_day,
        due_day: formData.due_day,
        current_bill: formData.current_bill,
        color: bankColor,
        tenant_id: user?.tenant_id
      }]);

      if (error) {
        setNotification({ type: 'error', message: `Erro ao salvar: ${error.message}` });
      } else {
        setNotification({ type: 'success', message: 'Cartão configurado com sucesso!' });
        fetchCards();
        setShowModal(false);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Erro crítico de conexão.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (!error) {
      setNotification({ type: 'success', message: 'Cartão excluído.' });
      fetchCards();
    }
  };

  const totalBills = cards.reduce((acc, curr) => acc + curr.current_bill, 0);
  const totalLimit = cards.reduce((acc, curr) => acc + curr.limit, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
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
          <h1 className="text-2xl font-semibold tracking-tight">Cartões de Crédito</h1>
          <p className="text-sm text-muted-foreground font-medium">Gerencie seus limites, faturas e datas de fechamento.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-all outline-none"
        >
          <Plus className="w-5 h-5" /> Adicionar Cartão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Total em Faturas</p>
           <div className="text-4xl font-black tracking-tighter text-rose-600 tabular-nums">
             {formatCurrency(totalBills)}
           </div>
           <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-500/10 w-fit px-3 py-1 rounded-full">
             <AlertCircle className="w-3 h-3" /> Próximo vencimento em 4 dias
           </div>
        </div>
        <div className="bg-card border rounded-[2.5rem] p-8 shadow-sm">
           <div className="flex justify-between items-start mb-2">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Limite Total Disponível</p>
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">71.6% livre</span>
           </div>
           <div className="text-4xl font-black tracking-tighter tabular-nums">
             {formatCurrency(totalLimit - totalBills)}
           </div>
           <div className="mt-6 w-full h-2 bg-muted rounded-full overflow-hidden">
             <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${((totalLimit - totalBills) / totalLimit) * 100}%` }} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : cards.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center text-muted-foreground gap-3">
             <CreditCard className="w-12 h-12 opacity-10" />
             <p className="font-semibold">Nenhum cartão configurado.</p>
          </div>
        ) : cards.map(card => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={card.id} 
            className={cn("rounded-[2.5rem] p-4 group relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl", card.color || 'bg-slate-800')}
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <CreditCard className="w-40 h-40" />
            </div>
            
            <div className="relative p-6 space-y-12">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-black text-white">{card.name[0]}</div>
                   <div className="text-white">
                      <h3 className="font-bold text-xl">{card.name}</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Limite Disponível</p>
                   </div>
                </div>
                <button onClick={() => handleDelete(card.id)} className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="text-4xl font-black text-white tracking-widest tabular-nums">
                {formatCurrency(card.limit - card.current_bill)}
              </div>

              <div className="flex justify-between items-end">
                <div className="flex gap-8">
                   <div className="text-white/60">
                      <p className="text-[9px] font-black uppercase tracking-widest">Fechamento</p>
                      <p className="font-bold text-sm">Dia {card.closing_day}</p>
                   </div>
                   <div className="text-white/60">
                      <p className="text-[9px] font-black uppercase tracking-widest">Vencimento</p>
                      <p className="font-bold text-sm">Dia {card.due_day}</p>
                   </div>
                </div>
                <div className="text-right text-white/40 font-mono text-sm tracking-[0.3em]">
                   •••• {card.last_digits}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 flex items-center justify-between rounded-b-[2rem] -mx-4 -mb-4 mt-4">
               <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Fatura Atual</p>
                  <p className="font-bold text-rose-600">{formatCurrency(card.current_bill)}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Limite Total</p>
                  <p className="font-bold">{formatCurrency(card.limit)}</p>
               </div>
               <button className="text-primary font-bold text-xs flex items-center gap-1 hover:gap-2 transition-all">Ver Fatura <X className="w-4 h-4 rotate-45" /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card border rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-bold tracking-tight">Configurar Cartão</h2>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-muted rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
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
  const [formData, setFormData] = useState({
    name: '',
    limit: 0,
    last_digits: '',
    closing_day: 1,
    due_day: 1,
    current_bill: 0
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleSearch = (val: string) => {
    setFormData({...formData, name: val});
    if (val.length > 1) {
      setSuggestions(MAJOR_BANKS.filter(b => b.name.toLowerCase().includes(val.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 relative">
        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nome do Cartão (ex: Nubank)</label>
        <input 
          className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" 
          placeholder="Digite o banco ou nome..." 
          value={formData.name}
          onChange={e => handleSearch(e.target.value)}
        />
        <AnimatePresence>
           {suggestions.length > 0 && (
             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-10 w-full mt-2 bg-card border rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                {suggestions.map(b => (
                  <button key={b.name} onClick={() => { setFormData({...formData, name: b.name}); setSuggestions([]); }} className="w-full px-6 py-3 text-left hover:bg-primary hover:text-white transition-colors text-sm font-bold flex items-center justify-between">
                    {b.name} <div className={cn("w-3 h-3 rounded-full", b.color)} />
                  </button>
                ))}
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Limite (R$)</label>
          <input type="number" className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold tabular-nums" placeholder="0,00" value={formData.limit || ''} onChange={e => setFormData({...formData, limit: Number(e.target.value)})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Últimos 4 dígitos</label>
          <input maxLength={4} className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold font-mono tracking-widest" placeholder="0000" value={formData.last_digits} onChange={e => setFormData({...formData, last_digits: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Dia do Fechamento</label>
          <input type="number" min={1} max={31} className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" value={formData.closing_day} onChange={e => setFormData({...formData, closing_day: Number(e.target.value)})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Dia do Vencimento</label>
          <input type="number" min={1} max={31} className="w-full p-4 bg-muted/40 border border-transparent focus:border-primary rounded-2xl outline-none font-bold" value={formData.due_day} onChange={e => setFormData({...formData, due_day: Number(e.target.value)})} />
        </div>
      </div>

      <div className="mt-10 flex gap-4">
        <button onClick={onCancel} className="flex-1 py-4 border rounded-[1.5rem] font-bold text-muted-foreground hover:bg-muted transition-all">Cancelar</button>
        <button onClick={() => onSave(formData)} className="flex-1 py-4 bg-primary text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">Salvar Cartão</button>
      </div>
    </div>
  );
}

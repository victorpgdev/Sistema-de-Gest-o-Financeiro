import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check, Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight, CreditCard, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface TransactionModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const INCOME_CATEGORIES = [
  'Vendas de Produtos', 'Prestação de Serviços', 'Consultoria', 'Rendimentos', 
  'Reembolsos', 'Empréstimos Recebidos', 'Venda de Ativos', 'Comissões', 'Outras Receitas'
];

const EXPENSE_CATEGORIES = [
  'Aluguel e Condomínio', 'Salários e Encargos', 'Pro-labore', 'Marketing e Ads',
  'Fornecedores', 'Energia Elétrica', 'Água e Esgoto', 'Internet e Telefone',
  'Software e Assinaturas (SaaS)', 'Impostos e Contribuições', 'Taxas Bancárias',
  'Manutenção e Reparos', 'Papelaria e Escritório', 'Viagens e Estadias',
  'Combustível e Estacionamento', 'Alimentação e Refeição', 'Serviços de Terceiros',
  'Juros e Multas', 'Investimentos', 'Retirada de Lucros', 'Outras Despesas'
];

const STATUS_OPTIONS = [
  { id: 'pending', label: '🕒 Em Aberto', color: 'text-amber-600' },
  { id: 'paid', label: '✅ Efetivado', color: 'text-emerald-600' },
  { id: 'overdue', label: '🚨 Atrasado', color: 'text-rose-600' },
  { id: 'canceled', label: '❌ Cancelado', color: 'text-slate-500' }
];

export function TransactionModal({ onClose, onSave }: TransactionModalProps) {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
  
  const [isOpenCategories, setIsOpenCategories] = useState(false);
  const [isOpenStatus, setIsOpenStatus] = useState(false);
  const [isOpenPayment, setIsOpenPayment] = useState(false);
  const [isOpenCalendar, setIsOpenCalendar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    type: 'income',
    description: '',
    amount: 0,
    category: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    bank_account_id: '',
    credit_card_id: '',
    is_recurring: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.tenant_id) return;
        
        const { data: bData } = await supabase.from('bank_accounts').select('*').eq('tenant_id', user.tenant_id);
        const { data: cData } = await supabase.from('credit_cards').select('*').eq('tenant_id', user.tenant_id);
        
        setAccounts(bData || []);
        setCards(cData || []);
        
        if (bData && bData.length > 0) {
          setForm(f => ({ ...f, bank_account_id: bData[0].id }));
        } else if (cData && cData.length > 0) {
          setPaymentMethod('card');
          setForm(f => ({ ...f, credit_card_id: cData[0].id }));
        }
      } catch (err) { console.error(err); }
    };
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) setIsOpenCategories(false);
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setIsOpenStatus(false);
      if (paymentRef.current && !paymentRef.current.contains(event.target as Node)) setIsOpenPayment(false);
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) setIsOpenCalendar(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    onClose();
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const filteredCategories = categories.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSaveInternal = () => {
    // Normalizar dados: se for conta, limpa cartão. Se for cartão, limpa conta.
    const finalData = {
      ...form,
      bank_account_id: paymentMethod === 'account' ? form.bank_account_id : null,
      credit_card_id: paymentMethod === 'card' ? form.credit_card_id : null,
    };
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold uppercase tracking-tight text-slate-700">Novo Lançamento</h2>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="flex bg-muted p-1 rounded-xl border">
            <button onClick={() => { setForm({...form, type: 'income', category: ''}); setPaymentMethod('account'); }} className={cn("flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all", form.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground")}>↑ Receita</button>
            <button onClick={() => { setForm({...form, type: 'expense', category: ''}); }} className={cn("flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all", form.type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground")}>↓ Despesa</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1 relative" ref={statusRef}>
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Status</label>
                <div onClick={() => setIsOpenStatus(!isOpenStatus)} className="w-full p-3 bg-muted border rounded-xl cursor-pointer flex items-center justify-between font-bold text-xs">
                  <span>{STATUS_OPTIONS.find(s => s.id === form.status)?.label}</span>
                  <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpenStatus && "rotate-180")} />
                </div>
                <AnimatePresence>
                  {isOpenStatus && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[120] left-0 right-0 mt-1 bg-white border rounded-2xl shadow-2xl p-1 overflow-hidden">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => { setForm({...form, status: opt.id}); setIsOpenStatus(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-between", form.status === opt.id ? "bg-slate-50 text-blue-600" : "hover:bg-slate-50")}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="space-y-1 relative" ref={categoryRef}>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <div onClick={() => setIsOpenCategories(!isOpenCategories)} className="w-full p-3 bg-muted border rounded-xl cursor-pointer flex items-center justify-between group hover:border-primary/40 transition-all font-bold text-xs">
                  <span className="truncate">{form.category || "Selecione..."}</span>
                  <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpenCategories && "rotate-180")} />
                </div>
                <AnimatePresence>
                  {isOpenCategories && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[120] left-0 right-0 mt-1 bg-white border rounded-2xl shadow-2xl overflow-hidden min-w-[200px]">
                      <div className="p-2 border-b bg-slate-50">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input className="w-full pl-7 pr-3 py-1.5 bg-white border rounded-lg text-[10px] font-bold outline-none" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                        </div>
                      </div>
                      <div className="max-h-[160px] overflow-y-auto p-1 scrollbar-thin">
                        {filteredCategories.map(cat => (
                          <button key={cat} onClick={() => { setForm({...form, category: cat}); setIsOpenCategories(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold", form.category === cat ? "bg-primary text-white" : "hover:bg-slate-50")}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Descrição</label>
            <input className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs" placeholder="Ex: Mensalidade..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Valor</label>
              <input className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs" type="number" placeholder="0,00" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1 relative" ref={calendarRef}>
              <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Vencimento</label>
              <div onClick={() => setIsOpenCalendar(!isOpenCalendar)} className="w-full p-3 bg-muted border rounded-xl cursor-pointer flex items-center justify-between font-bold text-xs hover:border-primary/40 transition-all">
                <span>{new Date(form.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                <CalendarIcon className="w-3 h-3 text-slate-400" />
              </div>
              <AnimatePresence>
                {isOpenCalendar && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[130] right-0 mt-1 bg-white border rounded-[2rem] shadow-2xl p-4 min-w-[280px]">
                    <CustomCalendar value={form.due_date} onChange={(d) => { setForm({...form, due_date: d}); setIsOpenCalendar(false); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SELETOR DE FORMA DE PAGAMENTO (CONTA OU CARTÃO) */}
          <div className="space-y-1 relative" ref={paymentRef}>
            <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Origem / Pagamento</label>
            <div onClick={() => setIsOpenPayment(!isOpenPayment)} className="w-full p-3 bg-muted border rounded-xl cursor-pointer flex items-center justify-between font-bold text-xs hover:border-primary/40 transition-all">
              <div className="flex items-center gap-2">
                {paymentMethod === 'account' ? <Landmark className="w-3 h-3 text-primary" /> : <CreditCard className="w-3 h-3 text-primary" />}
                <span className="truncate">
                  {paymentMethod === 'account' 
                    ? (accounts.find(a => a.id === form.bank_account_id)?.bank_name || "Selecione a Conta...")
                    : (cards.find(c => c.id === form.credit_card_id)?.card_name || "Selecione o Cartão...")
                  }
                </span>
              </div>
              <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpenPayment && "rotate-180")} />
            </div>
            <AnimatePresence>
              {isOpenPayment && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[120] left-0 right-0 mt-1 bg-white border rounded-2xl shadow-2xl p-1 overflow-hidden">
                  {/* SEÇÃO CONTAS */}
                  {accounts.length > 0 && <div className="px-3 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">🏦 Contas Bancárias</div>}
                  {accounts.map(acc => (
                    <button key={acc.id} onClick={() => { setPaymentMethod('account'); setForm({...form, bank_account_id: acc.id}); setIsOpenPayment(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-between", paymentMethod === 'account' && form.bank_account_id === acc.id ? "bg-slate-50 text-blue-600" : "hover:bg-slate-50")}>
                      {acc.bank_name}
                    </button>
                  ))}
                  
                  {/* SEÇÃO CARTÕES (Somente se for Despesa) */}
                  {form.type === 'expense' && cards.length > 0 && <div className="px-3 py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b mt-2">💳 Cartões de Crédito</div>}
                  {form.type === 'expense' && cards.map(card => (
                    <button key={card.id} onClick={() => { setPaymentMethod('card'); setForm({...form, credit_card_id: card.id}); setIsOpenPayment(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-between", paymentMethod === 'card' && form.credit_card_id === card.id ? "bg-slate-50 text-blue-600" : "hover:bg-slate-50")}>
                      {card.card_name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="rec-shared" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-primary" />
              <label htmlFor="rec-shared" className="text-[10px] font-black uppercase text-slate-700">🔄 Repetir Mensalmente</label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t">
          <button onClick={handleClose} className="flex-1 py-3 border rounded-xl text-[9px] font-black uppercase hover:bg-muted transition-all">Cancelar</button>
          <button onClick={handleSaveInternal} className="flex-1 py-3 bg-primary text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all">Salvar Lançamento</button>
        </div>
      </motion.div>
    </div>
  );
}

function CustomCalendar({ value, onChange }: { value: string, onChange: (d: string) => void }) {
  const [curr, setCurr] = useState(new Date(value + 'T12:00:00'));
  const month = curr.getMonth();
  const year = curr.getFullYear();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <button onClick={() => setCurr(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-xs font-black uppercase tracking-widest">{monthNames[month]} {year}</span>
        <button onClick={() => setCurr(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-[8px] font-black text-slate-400 text-center">{d}</div>)}
        {days.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const isSelected = dStr === value;
          return (
            <button key={i} onClick={() => onChange(dStr)} className={cn("text-[10px] font-bold p-2 rounded-lg transition-all", isSelected ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600")}>{d}</button>
          );
        })}
      </div>
    </div>
  );
}

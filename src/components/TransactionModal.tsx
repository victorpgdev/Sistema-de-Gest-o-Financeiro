import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check, Search } from 'lucide-react';
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

export function TransactionModal({ onClose, onSave }: TransactionModalProps) {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isOpenCategories, setIsOpenCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    type: 'income',
    description: '',
    amount: 0,
    category: '',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    bank_account_id: '',
    is_recurring: false
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase.from('bank_accounts').select('*').eq('tenant_id', user?.tenant_id);
      if (data && data.length > 0) {
        setAccounts(data);
        setForm(f => ({ ...f, bank_account_id: data[0].id }));
      }
    };
    if (user) fetchAccounts();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenCategories(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const filteredCategories = categories.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
      {/* Modal - Overflow-visible para o dropdown não sumir */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-card border rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold uppercase tracking-tight text-slate-700">Novo Lançamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {/* Tipo: Receita / Despesa */}
          <div className="flex bg-muted p-1 rounded-xl border">
            <button onClick={() => { setForm({...form, type: 'income', category: ''}); setSearchTerm(''); }} className={cn("flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all", form.type === 'income' ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground")}>↑ Receita</button>
            <button onClick={() => { setForm({...form, type: 'expense', category: ''}); setSearchTerm(''); }} className={cn("flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all", form.type === 'expense' ? "bg-rose-500 text-white shadow-lg" : "text-muted-foreground")}>↓ Despesa</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {/* Status - Moved up */}
             <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Status</label>
              <select className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs cursor-pointer transition-all focus:border-primary appearance-none" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="pending">🕒 Em Aberto</option>
                <option value="paid">✅ Efetivado</option>
                <option value="overdue">🚨 Atrasado</option>
                <option value="canceled">❌ Cancelado</option>
              </select>
            </div>
            {/* Categoria - Moved up to have space below */}
            <div className="space-y-1 relative" ref={dropdownRef}>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <div 
                onClick={() => setIsOpenCategories(!isOpenCategories)}
                className="w-full p-3 bg-muted border rounded-xl cursor-pointer flex items-center justify-between group hover:border-primary/40 transition-all"
              >
                <span className={cn("font-bold text-xs truncate", !form.category && "text-muted-foreground")}>
                  {form.category || "Selecione..."}
                </span>
                <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpenCategories && "rotate-180")} />
              </div>

              <AnimatePresence>
                {isOpenCategories && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute z-[110] left-0 right-0 mt-1 bg-white border rounded-2xl shadow-2xl overflow-hidden min-w-[200px]"
                  >
                    <div className="p-2 border-b bg-slate-50">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input className="w-full pl-7 pr-3 py-1.5 bg-white border rounded-lg text-[10px] font-bold outline-none" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                      </div>
                    </div>
                    <div className="max-h-[160px] overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
                      {filteredCategories.map(cat => (
                        <button key={cat} onClick={() => { setForm({...form, category: cat}); setIsOpenCategories(false); }} className={cn("w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-between", form.category === cat ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600")}>
                          {cat} {form.category === cat && <Check className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Descrição do Lançamento</label>
            <input className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs focus:border-primary" placeholder="Ex: Mensalidade, Venda..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Valor</label>
              <input className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs focus:border-primary" type="number" placeholder="0,00" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Vencimento</label>
              <input className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs focus:border-primary" type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Conta Bancária</label>
            <select className="w-full p-3 bg-muted border rounded-xl outline-none font-bold text-xs cursor-pointer appearance-none" value={form.bank_account_id} onChange={e => setForm({...form, bank_account_id: e.target.value})}>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bank_name}</option>)}
            </select>
          </div>

          <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="rec-shared" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-primary" />
              <label htmlFor="rec-shared" className="text-[10px] font-black uppercase text-slate-700">🔄 Repetir Mensalmente</label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t font-black">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl text-[9px] uppercase hover:bg-muted transition-all">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-3 bg-primary text-white rounded-xl text-[9px] uppercase shadow-lg shadow-primary/20 hover:scale-105 transition-all">Salvar Lançamento</button>
        </div>
      </motion.div>
    </div>
  );
}

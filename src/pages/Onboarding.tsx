import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  ChevronRight, ChevronLeft, Check,
  Landmark, CreditCard, Tag, Sparkles,
  BarChart3, Plus, X
} from 'lucide-react';

// ─── Dados ────────────────────────────────────────────────────────────────────

const BANKS = [
  'Nubank', 'Itaú', 'Bradesco', 'Banco do Brasil',
  'Caixa Econômica', 'Santander', 'Inter', 'C6 Bank',
  'Sicoob', 'BTG Pactual', 'Outro'
];

const CARD_BRANDS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

const DEFAULT_CATEGORIES = [
  { label: 'Alimentação', emoji: '🍔' },
  { label: 'Transporte', emoji: '🚗' },
  { label: 'Moradia/Aluguel', emoji: '🏠' },
  { label: 'Saúde', emoji: '🏥' },
  { label: 'Educação', emoji: '📚' },
  { label: 'Lazer', emoji: '🎮' },
  { label: 'Vestuário', emoji: '👕' },
  { label: 'Fornecedores', emoji: '📦' },
  { label: 'Salários', emoji: '👥' },
  { label: 'Marketing', emoji: '📣' },
  { label: 'Tecnologia', emoji: '💻' },
  { label: 'Impostos', emoji: '📋' },
  { label: 'Energia/Água', emoji: '⚡' },
  { label: 'Internet/Telefone', emoji: '📡' },
  { label: 'Assinaturas', emoji: '🔄' },
];

const TOTAL_STEPS = 5;

// ─── Componente Principal ─────────────────────────────────────────────────────

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Estado de cada etapa
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [bank, setBank] = useState({ name: '', type: 'checking', balance: '' });
  const [skipBank, setSkipBank] = useState(false);
  const [card, setCard] = useState({ name: '', brand: 'Visa', limit: '', due_day: '10' });
  const [skipCard, setSkipCard] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Alimentação', 'Transporte', 'Moradia/Aluguel'
  ]);
  const [customCategory, setCustomCategory] = useState('');

  const toggleCategory = (label: string) => {
    setSelectedCategories(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    );
  };

  const addCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories(prev => [...prev, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  const canNext = () => {
    if (step === 0) return firstName.trim().length > 0;
    if (step === 1) return skipBank || bank.name !== '';
    if (step === 2) return skipCard || card.name !== '';
    if (step === 3) return selectedCategories.length > 0;
    return true;
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Atualizar nome do perfil + marcar onboarding completo
      await supabase.from('profiles')
        .update({ name: firstName, onboarding_completed: true })
        .eq('id', user?.id);

      // Criar conta bancária
      if (!skipBank && bank.name && user?.tenant_id) {
        await supabase.from('bank_accounts').insert([{
          tenant_id: user.tenant_id,
          bank_name: bank.name,
          type: bank.type,
          balance: Number(bank.balance) || 0,
          agency: '',
          account_number: '',
        }]);
      }

      // Criar cartão de crédito
      if (!skipCard && card.name && user?.tenant_id) {
        await supabase.from('credit_cards').insert([{
          tenant_id: user.tenant_id,
          name: card.name,
          brand: card.brand,
          credit_limit: Number(card.limit) || 0,
          due_day: Number(card.due_day) || 10,
        }]);
      }

      onComplete();
    } catch (err) {
      console.error(err);
      onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    `Seja bem-vindo(a)! 👋`,
    'Sua conta bancária',
    'Seu cartão de crédito',
    'Suas categorias',
    'Tudo pronto! 🎉',
  ];

  const stepIcons = [Sparkles, Landmark, CreditCard, Tag, Check];

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4 overflow-y-auto">

      {/* Fundo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-xl my-auto">

        {/* Logo + Progresso */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-xl shadow-primary/30">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">PG Financial</span>
          </div>

          {/* Steps visuais */}
          <div className="flex items-center justify-center gap-1.5">
            {stepTitles.map((_, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-all border-2",
                    i < step ? "bg-primary border-primary" : 
                    i === step ? "bg-white border-white" : 
                    "bg-white/10 border-white/20"
                  )}>
                    {i < step 
                      ? <Check className="w-3 h-3 text-white" />
                      : <Icon className={cn("w-3 h-3", i === step ? "text-primary" : "text-white/30")} />
                    }
                  </div>
                  {i < TOTAL_STEPS - 1 && (
                    <div className={cn("w-6 h-0.5 rounded-full", i < step ? "bg-primary" : "bg-white/20")} />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-white/40 text-xs mt-3">Etapa {step + 1} de {TOTAL_STEPS}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 px-10 py-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p className="text-primary-foreground/60 text-xs font-bold uppercase tracking-widest mb-1">
                  {step + 1} / {TOTAL_STEPS}
                </p>
                <h2 className="text-2xl font-black text-white tracking-tight">{stepTitles[step]}</h2>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Conteúdo */}
          <div className="px-10 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex gap-3 items-start">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Vamos configurar sua área financeira em <strong>menos de 2 minutos</strong> para você começar a usar agora mesmo.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Como quer ser chamado?</label>
                      <input
                        autoFocus
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Seu primeiro nome..."
                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl outline-none font-bold text-slate-800 text-lg transition-all"
                        onKeyDown={e => e.key === 'Enter' && canNext() && setStep(1)}
                      />
                    </div>
                    {firstName && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-500 pl-1">
                        Olá, <strong className="text-primary">{firstName}</strong>! Que bom ter você aqui 🎉
                      </motion.p>
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Cadastre seu banco principal. O saldo será atualizado automaticamente a cada lançamento efetivado.</p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Banco</label>
                      <div className="grid grid-cols-3 gap-2">
                        {BANKS.map(b => (
                          <button key={b} onClick={() => setBank({...bank, name: b})}
                            className={cn("p-2.5 rounded-xl text-xs font-bold border transition-all text-center",
                              bank.name === b ? "bg-primary/10 border-primary/40 text-primary" : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600"
                            )}>
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                    {bank.name && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                          <select value={bank.type} onChange={e => setBank({...bank, type: e.target.value})}
                            className="w-full p-3.5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm cursor-pointer">
                            <option value="checking">Corrente</option>
                            <option value="savings">Poupança</option>
                            <option value="investment">Investimento</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Atual (R$)</label>
                          <input type="number" value={bank.balance} onChange={e => setBank({...bank, balance: e.target.value})}
                            placeholder="0,00"
                            className="w-full p-3.5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                        </div>
                      </motion.div>
                    )}
                    <button onClick={() => { setSkipBank(true); setStep(2); }}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline">
                      Pular esta etapa, farei depois
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Adicione um cartão para controlar os lançamentos da fatura mensalmente.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Cartão</label>
                        <input value={card.name} onChange={e => setCard({...card, name: e.target.value})}
                          placeholder="Ex: Nubank Gold"
                          className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl outline-none font-bold text-sm transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bandeira</label>
                        <select value={card.brand} onChange={e => setCard({...card, brand: e.target.value})}
                          className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm cursor-pointer">
                          {CARD_BRANDS.map(b => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite (R$)</label>
                        <input type="number" value={card.limit} onChange={e => setCard({...card, limit: e.target.value})}
                          placeholder="5000,00"
                          className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia de Vencimento</label>
                        <input type="number" min="1" max="31" value={card.due_day} onChange={e => setCard({...card, due_day: e.target.value})}
                          className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                      </div>
                    </div>
                    <button onClick={() => { setSkipCard(true); setStep(3); }}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline">
                      Pular esta etapa, farei depois
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Escolha as categorias que você vai usar para classificar seus lançamentos. Você pode adicionar mais depois.</p>
                    <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                      {DEFAULT_CATEGORIES.map(cat => {
                        const isSelected = selectedCategories.includes(cat.label);
                        return (
                          <button key={cat.label} onClick={() => toggleCategory(cat.label)}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
                              isSelected 
                                ? "bg-primary/10 border-primary/30 text-primary" 
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                            )}>
                            <span>{cat.emoji}</span>
                            {cat.label}
                            {isSelected && <X className="w-3 h-3 opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                    {/* Categoria personalizada */}
                    <div className="flex gap-2">
                      <input value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCustomCategory()}
                        placeholder="Adicionar categoria personalizada..."
                        className="flex-1 p-3 bg-slate-50 border rounded-xl outline-none text-sm font-medium" />
                      <button onClick={addCustomCategory}
                        className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center text-4xl">🎉</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5 border space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua configuração</p>
                      <div className="space-y-2">
                        <SummaryRow label="Nome" value={firstName} />
                        {!skipBank && bank.name && <SummaryRow label="Banco" value={`${bank.name} (${bank.type === 'checking' ? 'Corrente' : 'Poupança'})`} />}
                        {!skipCard && card.name && <SummaryRow label="Cartão" value={`${card.name} ${card.brand}`} />}
                        <SummaryRow label="Categorias" value={`${selectedCategories.length} selecionadas`} />
                      </div>
                    </div>
                    <p className="text-center text-sm text-slate-500">
                      Tudo pronto! Sua área de trabalho está configurada. <strong className="text-emerald-600">Bom controle financeiro!</strong>
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Botões de navegação */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              {step > 0 && step < 4 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              )}

              <button
                onClick={() => step === TOTAL_STEPS - 1 ? handleFinish() : setStep(s => s + 1)}
                disabled={!canNext() || isLoading}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
                  canNext() && !isLoading
                    ? "bg-primary text-white shadow-xl shadow-primary/25 hover:scale-[1.02]"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isLoading ? '⏳ Finalizando...' : step === TOTAL_STEPS - 1 
                  ? <><Check className="w-4 h-4" /> Entrar no Sistema</>
                  : <>Continuar <ChevronRight className="w-4 h-4" /></>
                }
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-5">
          Tudo pode ser alterado depois em Configurações
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400 font-semibold">{label}</span>
      <span className="text-xs font-bold text-slate-700">{value}</span>
    </div>
  );
}

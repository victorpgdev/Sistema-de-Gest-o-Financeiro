import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import {
  ChevronRight, ChevronLeft, Check,
  Landmark, CreditCard, Tag, Sparkles,
  BarChart3, Plus, X, AlertCircle
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);
    try {
      if (!user?.id || !user?.tenant_id) throw new Error("Usuário não identificado.");

      // 1. Atualizar nome do perfil + marcar onboarding completo
      const { error: pError } = await supabase.from('profiles')
        .update({ 
          name: firstName, 
          onboarding_completed: true 
        })
        .eq('id', user.id);

      if (pError) throw pError;

      // 2. Criar conta bancária inicial
      if (!skipBank && bank.name) {
        const { error: bError } = await supabase.from('bank_accounts').insert([{
          tenant_id: user.tenant_id,
          bank_name: bank.name,
          type: bank.type,
          balance: Number(bank.balance) || 0,
        }]);
        if (bError) console.warn("Erro ao criar conta bancária no onboarding:", bError);
      }

      // 3. Criar cartão de crédito inicial
      if (!skipCard && card.name) {
        // CORREÇÃO: Nome das colunas sincronizado com o banco de dados
        const { error: cError } = await supabase.from('credit_cards').insert([{
          tenant_id: user.tenant_id,
          card_name: card.name,
          bank_name: 'Outros', // Campo exigido mas opcional no step
          limit_amount: Number(card.limit) || 0,
          current_spent: 0,
          due_day: Number(card.due_day) || 10,
          closing_day: 5
        }]);
        if (cError) console.warn("Erro ao criar cartão no onboarding:", cError);
      }

      onComplete();
      // Forçamos um refresh na página para garantir que todos os estados carreguem os novos dados salvos
      window.location.reload(); 
    } catch (err: any) {
      console.error("Erro crítico no onboarding:", err);
      setErrorMsg("Ocorreu um erro ao salvar seus dados. Por favor, tente novamente.");
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
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-xl my-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-xl shadow-primary/30">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">PG Financial</span>
          </div>

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
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-indigo-600 px-10 py-7">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <p className="text-primary-foreground/60 text-xs font-bold uppercase tracking-widest mb-1">{step + 1} / {TOTAL_STEPS}</p>
                <h2 className="text-2xl font-black text-white tracking-tight">{stepTitles[step]}</h2>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="px-10 py-8">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                {errorMsg && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-center text-rose-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-bold">{errorMsg}</p>
                  </div>
                )}

                {step === 0 && (
                  <div className="space-y-5">
                    <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex gap-3 items-start">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed">Configuraremos seu acesso em segundos para você começar agora mesmo.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Para começar, qual o seu nome?</label>
                      <input autoFocus value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Seu nome ou apelido..." className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl outline-none font-bold text-slate-800 text-lg transition-all" onKeyDown={e => e.key === 'Enter' && canNext() && setStep(1)} />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Qual banco você mais utiliza? O saldo será controlado por aqui.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {BANKS.map(b => (
                        <button key={b} onClick={() => setBank({...bank, name: b})} className={cn("p-2.5 rounded-xl text-xs font-bold border transition-all text-center", bank.name === b ? "bg-primary/10 border-primary/40 text-primary" : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600")}>{b}</button>
                      ))}
                    </div>
                    {bank.name && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Conta</label>
                          <select value={bank.type} onChange={e => setBank({...bank, type: e.target.value})} className="w-full p-3.5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm cursor-pointer"><option value="checking">Corrente</option><option value="savings">Poupança</option><option value="investment">Investimento</option></select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo Atual (R$)</label>
                          <input type="number" value={bank.balance} onChange={e => setBank({...bank, balance: e.target.value})} placeholder="0,00" className="w-full p-3.5 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                        </div>
                      </motion.div>
                    )}
                    <button onClick={() => { setSkipBank(true); setStep(2); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline">Pular esta etapa</button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Adicione seu cartão principal para controle de faturas.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Cartão</label>
                        <input value={card.name} onChange={e => setCard({...card, name: e.target.value})} placeholder="Ex: Black Principal" className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl outline-none font-bold text-sm transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Limite (R$)</label>
                        <input type="number" value={card.limit} onChange={e => setCard({...card, limit: e.target.value})} placeholder="5000,00" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vencimento (Dia)</label>
                        <input type="number" min="1" max="31" value={card.due_day} onChange={e => setCard({...card, due_day: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none font-bold text-sm" />
                      </div>
                    </div>
                    <button onClick={() => { setSkipCard(true); setStep(3); }} className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline">Pular esta etapa</button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Selecione o que você deseja controlar primeiro.</p>
                    <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                      {DEFAULT_CATEGORIES.map(cat => {
                        const isSelected = selectedCategories.includes(cat.label);
                        return (
                          <button key={cat.label} onClick={() => toggleCategory(cat.label)} className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5", isSelected ? "bg-primary/10 border-primary/30 text-primary" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300")}><span>{cat.emoji}</span>{cat.label}</button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5 text-center">
                    <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 rounded-full flex items-center justify-center text-4xl mx-auto">🎉</div>
                    <h3 className="text-xl font-bold text-slate-800">Pronto, {firstName}!</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Sua plataforma financeira foi configurada com sucesso. Clique no botão abaixo para começar a gerenciar seu dinheiro.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3 mt-8 pt-6 border-t">
              {step > 0 && step < 4 && (
                <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-6 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">Voltar</button>
              )}
              <button
                onClick={() => step === TOTAL_STEPS - 1 ? handleFinish() : setStep(s => s + 1)}
                disabled={!canNext() || isLoading}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all", canNext() && !isLoading ? "bg-primary text-white shadow-xl shadow-primary/25 hover:scale-[1.02]" : "bg-slate-100 text-slate-400 cursor-not-allowed")}
              >
                {isLoading ? '⏳ Salvando...' : step === TOTAL_STEPS - 1 ? 'Entrar no Sistema' : 'Continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

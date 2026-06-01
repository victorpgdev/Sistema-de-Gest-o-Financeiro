import { useState, useMemo } from 'react';
import { 
  Plus, CreditCard as CardIcon, Calendar, ArrowUpRight, 
  Settings2, PlusCircle, AlertCircle, CheckCircle2, ChevronRight,
  MoreHorizontal, Trash2, Edit2
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface CreditCard {
  id: string;
  name: string;
  lastDigits: string;
  limit: number;
  used: number;
  closingDay: number;
  dueDay: number;
  brand: 'Visa' | 'Mastercard' | 'Elo' | 'Amex';
  color: string;
}

const INITIAL_CARDS: CreditCard[] = [
  { id: '1', name: 'Nubank Ultravioleta', lastDigits: '8842', limit: 15000, used: 4250.50, closingDay: 28, dueDay: 5, brand: 'Mastercard', color: '#8b5cf6' },
  { id: '2', name: 'Itaú Business',       lastDigits: '1029', limit: 45000, used: 12800.00, closingDay: 15, dueDay: 22, brand: 'Visa', color: '#f97316' },
];

const BRANDS = ['Visa', 'Mastercard', 'Elo', 'Amex'] as const;
const COLORS = ['#8b5cf6', '#f97316', '#3b82f6', '#ef4444', '#10b981', '#000000'];

export function CreditCards() {
  const [cards, setCards] = useState<CreditCard[]>(INITIAL_CARDS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CreditCard | null>(null);

  const totalUsed = useMemo(() => cards.reduce((s, c) => s + c.used, 0), [cards]);
  const totalLimit = useMemo(() => cards.reduce((s, c) => s + c.limit, 0), [cards]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cartões de Crédito</h1>
          <p className="text-muted-foreground">Gerencie seus limites, faturas e datas de fechamento.</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" /> Adicionar Cartão
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border rounded-3xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Total em Faturas</p>
          <h3 className="text-3xl font-extrabold text-rose-600 tabular-nums">{formatCurrency(totalUsed)}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Próximo vencimento em 4 dias</span>
          </div>
        </div>
        <div className="p-6 bg-card border rounded-3xl shadow-sm col-span-1 md:col-span-2 flex flex-col justify-between">
           <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Limite Total Disponível</p>
              <p className="text-sm font-bold text-emerald-600">{( (1 - (totalUsed/totalLimit)) * 100).toFixed(1)}% livre</p>
           </div>
           <h3 className="text-3xl font-extrabold tabular-nums mt-2">{formatCurrency(totalLimit - totalUsed)}</h3>
           <div className="w-full h-2 bg-muted rounded-full mt-4 overflow-hidden">
             <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${(totalUsed / totalLimit) * 100}%` }}
             />
           </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {cards.map(card => (
          <div key={card.id} className="group relative">
             {/* The Visual Card */}
             <div className="relative h-56 w-full rounded-[2rem] p-8 text-white shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-1" style={{ backgroundColor: card.color }}>
                <div className="absolute top-0 right-0 p-8 opacity-20">
                   <CardIcon className="w-32 h-32 rotate-12" />
                </div>
                
                <div className="relative h-full flex flex-col justify-between">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center font-bold italic">
                            {card.brand[0]}
                         </div>
                         <h3 className="text-xl font-bold tracking-tight">{card.name}</h3>
                      </div>
                      <Settings2 className="w-6 h-6 opacity-60 cursor-pointer hover:opacity-100 transition-opacity" />
                   </div>

                   <div>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-1">Limite Disponível</p>
                      <h4 className="text-3xl font-bold tabular-nums">{formatCurrency(card.limit - card.used)}</h4>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <div className="flex gap-4">
                         <div>
                            <p className="text-[10px] text-white/50 uppercase font-bold">Fechamento</p>
                            <p className="text-sm font-bold">Dia {card.closingDay}</p>
                         </div>
                         <div>
                            <p className="text-[10px] text-white/50 uppercase font-bold">Vencimento</p>
                            <p className="text-sm font-bold">Dia {card.dueDay}</p>
                         </div>
                      </div>
                      <p className="text-sm font-mono font-bold tracking-widest opacity-80">•••• {card.lastDigits}</p>
                   </div>
                </div>
             </div>

             {/* Card Stats Detail below */}
             <div className="mt-4 px-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                   <div>
                      <p className="text-muted-foreground text-xs font-medium">Fatura Atual</p>
                      <p className="font-bold text-rose-600">{formatCurrency(card.used)}</p>
                   </div>
                   <div className="h-8 w-px bg-border" />
                   <div>
                      <p className="text-muted-foreground text-xs font-medium">Limite Total</p>
                      <p className="font-bold">{formatCurrency(card.limit)}</p>
                   </div>
                </div>
                <button className="flex items-center gap-2 font-bold text-primary hover:underline">
                   Ver Fatura <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}

        {/* Empty Placeholder / Add Card */}
        <button 
           onClick={() => { setEditing(null); setShowModal(true); }}
           className="h-56 w-full border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center gap-4 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all group"
        >
           <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-lg">
              <PlusCircle className="w-8 h-8" />
           </div>
           <p className="font-bold">Novo Cartão de Crédito</p>
        </button>
      </div>

      {/* Modal - Basic implementation for demo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-card border rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Configurar Cartão</h2>
              <p className="text-muted-foreground mb-8 text-sm">Preencha os dados do seu cartão para um controle preciso de faturas.</p>
              <div className="space-y-4 mb-8">
                 <input className="w-full p-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary" placeholder="Nome do Cartão (ex: Nubank)" />
                 <div className="grid grid-cols-2 gap-4">
                    <input className="w-full p-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary" placeholder="Limite (R$)" type="number" />
                    <input className="w-full p-4 bg-muted border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary" placeholder="Últimos 4 digitos" />
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-4 border rounded-2xl font-bold hover:bg-muted transition-colors">Cancelar</button>
                 <button className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Salvar Cartão</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

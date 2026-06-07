import { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, Download, 
  Calendar, ArrowUpRight, ArrowDownRight,
  Printer, Loader2, Filter, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

export function Reports() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>({ income: 0, expenses: 0, balance: 0, categories: [] });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = async () => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', user.tenant_id);

      if (txs) {
        const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expenses = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        
        // Agrupar por categoria
        const cats: any = {};
        txs.filter(t => t.type === 'expense').forEach(t => {
          const cat = t.category || 'Geral';
          cats[cat] = (cats[cat] || 0) + t.amount;
        });

        setData({
          income,
          expenses,
          balance: income - expenses,
          categories: Object.entries(cats).map(([name, value]) => ({ name, value }))
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (user) fetchReportData(); }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 relative print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inteligência Financeira</h1>
          <p className="text-sm text-muted-foreground font-medium">Análise detalhada da performance da sua empresa.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Printer className="w-5 h-5 text-slate-500" /> Imprimir Relatório
          </button>
          <button className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
            <Download className="w-5 h-5" /> Exportar Dados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Faturamento Total', value: data.income, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Gastos Operacionais', value: data.expenses, icon: ArrowDownRight, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Margem de Lucro', value: data.balance, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5' },
        ].map(card => (
          <div key={card.label} className="bg-card border rounded-[2rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{card.label}</span>
                <div className={cn("p-2 rounded-xl", card.bg)}><card.icon className={cn("w-5 h-5", card.color)} /></div>
             </div>
             <div className={cn("text-3xl font-black tracking-tight", card.color)}>
               {formatCurrency(card.value)}
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-card border rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
            <h3 className="font-bold text-lg mb-8 flex items-center gap-3">
               <PieChart className="w-6 h-6 text-primary" /> Gastos por Categoria
            </h3>
            <div className="space-y-6">
               {data.categories.length === 0 ? (
                 <div className="py-10 text-center text-muted-foreground italic">Nenhum dado de categoria disponível.</div>
               ) : data.categories.sort((a: any, b: any) => (b.value as number) - (a.value as number)).map((cat: any) => (
                  <div key={cat.name} className="space-y-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-600">
                        <span>{cat.name}</span>
                        <span className="text-slate-400 tabular-nums">{Math.round((cat.value / data.expenses) * 100)}%</span>
                     </div>
                     <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${(cat.value / data.expenses) * 100}%` }}
                          className="h-full bg-primary rounded-full transition-all duration-1000" 
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <div className="relative space-y-6 text-center lg:text-left">
               <div>
                 <h2 className="text-3xl font-bold tracking-tight mb-2 uppercase">Insights Automáticos</h2>
                 <p className="text-slate-400 font-medium">O PG Financial analisou seus dados dos últimos 30 dias.</p>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                  <p className="text-sm italic leading-relaxed text-slate-200">
                     "Parabéns! Suas despesas estão {data.balance > 0 ? 'sob controle' : 'acima do faturamento'}. {data.balance > 0 ? 'Excelente momento para investir no crescimento do seu negócio.' : 'Recomendamos revisar as categorias com maior peso no seu fluxo.'}"
                  </p>
               </div>
               <div className="flex items-center justify-center lg:justify-start gap-4">
                  <span className="px-5 py-2 bg-primary/20 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest">Algoritmo Ativo</span>
               </div>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .bg-card { border: none !important; box-shadow: none !important; }
          .rounded-\\[2rem\\], .rounded-\\[2\\.5rem\\] { border-radius: 0 !important; }
          .bg-slate-900 { color: black !important; background: white !important; border: 1px solid #eee !important; }
          .text-white { color: black !important; }
          .text-slate-400 { color: #666 !important; }
        }
      `}} />
    </div>
  );
}

import { useState } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft,
  ChevronRight,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// Mock OFX data
const bankStatement = [
  { id: 'b1', date: '2023-10-05', description: 'PIX RECEBIDO - JOAO SILVA', amount: 1500.00, type: 'income', matched: true, matchId: 't1' },
  { id: 'b2', date: '2023-10-05', description: 'PAG TITULO BANCO ITAU', amount: 350.00, type: 'expense', matched: true, matchId: 't2' },
  { id: 'b3', date: '2023-10-06', description: 'TARIFA BANCARIA', amount: 25.50, type: 'expense', matched: false },
  { id: 'b4', date: '2023-10-06', description: 'TED RECEBIDA - EMPRESA X', amount: 5000.00, type: 'income', matched: false },
  { id: 'b5', date: '2023-10-07', description: 'PAGAMENTO FORNECEDOR Y', amount: 1200.00, type: 'expense', matched: false },
];

const systemTransactions = [
  { id: 't1', date: '2023-10-05', description: 'Venda Consultoria - João Silva', amount: 1500.00, type: 'income', status: 'pending' },
  { id: 't2', date: '2023-10-05', description: 'Conta de Energia', amount: 350.00, type: 'expense', status: 'pending' },
  { id: 't3', date: '2023-10-06', description: 'Venda de Software - Empresa X', amount: 5000.00, type: 'income', status: 'pending' },
  { id: 't4', date: '2023-10-07', description: 'Fornecedor Y - Peças', amount: 1200.00, type: 'expense', status: 'pending' },
];

export function BankReconciliation() {
  const [selectedBank, setSelectedBank] = useState('itau');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Conciliação Bancária</h1>
          <p className="text-muted-foreground">Importe seu arquivo OFX e sincronize seu banco automaticamente.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground hover:bg-muted/80 rounded-2xl font-bold transition-all">
            Open Finance
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Upload className="w-5 h-5" />
            Importar OFX
          </button>
        </div>
      </div>

      {/* Conta Selector & Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-lg">Contas</h3>
          <div className="space-y-2">
            {[
              { id: 'itau', name: 'Itaú Unibanco', pending: 3 },
              { id: 'nubank', name: 'Nubank PJ', pending: 0 },
            ].map(bank => (
              <button 
                key={bank.id}
                onClick={() => setSelectedBank(bank.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                  selectedBank === bank.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <div>
                  <p className="font-bold">{bank.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Atualizado hoje</p>
                </div>
                {bank.pending > 0 ? (
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">
                    {bank.pending}
                  </span>
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-card border rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="grid grid-cols-3 border-b divide-x divide-border">
            <div className="p-6 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Saldo do Banco</p>
              <p className="text-2xl font-bold">{formatCurrency(45200.50)}</p>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Saldo no Sistema</p>
              <p className="text-2xl font-bold">{formatCurrency(43675.00)}</p>
            </div>
            <div className="p-6 text-center bg-rose-50/50">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Diferença Restante</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(1525.50)}</p>
            </div>
          </div>
          
          <div className="p-6 flex items-center justify-between bg-muted/20 border-b">
           <h3 className="font-bold">Lançamentos para Conciliar (3 pendentes)</h3>
           <div className="flex gap-2">
             <button className="p-2 border rounded-xl hover:bg-muted text-muted-foreground"><Search className="w-4 h-4"/></button>
             <button className="p-2 border rounded-xl hover:bg-muted text-muted-foreground"><Filter className="w-4 h-4"/></button>
           </div>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-border">
            {/* Header Conciliação */}
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 p-4 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <div>Extrato Bancário (OFX)</div>
              <div className="w-8"></div>
              <div>Sistema Financeiro</div>
              <div className="w-24 text-center">Ação</div>
            </div>

            {bankStatement.map(item => {
              const matchedSystemItem = systemTransactions.find(t => t.id === item.matchId);
              const suggestedSystemItem = !item.matched && item.amount === 5000 ? systemTransactions.find(t => t.id === 't3') : null;

              return (
                <div key={item.id} className="grid grid-cols-[1fr_auto_1fr_auto] gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                  {/* Lado Banco */}
                  <div className={cn(
                    "p-4 rounded-xl border-l-4 bg-card shadow-sm",
                    item.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-muted-foreground">{item.date}</span>
                      <span className={cn("font-bold", item.type === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate" title={item.description}>{item.description}</p>
                  </div>

                  {/* Ícone meio */}
                  <div className="flex items-center justify-center">
                    {item.matched ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : suggestedSystemItem ? (
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Lado Sistema */}
                  {item.matched ? (
                    <div className="p-4 rounded-xl border bg-emerald-50/30 shadow-sm opacity-70">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-muted-foreground">{matchedSystemItem?.date}</span>
                        <span className="font-bold text-muted-foreground">{formatCurrency(matchedSystemItem?.amount || 0)}</span>
                      </div>
                      <p className="text-sm font-semibold text-muted-foreground">{matchedSystemItem?.description}</p>
                    </div>
                  ) : suggestedSystemItem ? (
                    <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/30 shadow-sm relative cursor-pointer hover:border-amber-500 transition-colors">
                      <span className="absolute -top-2.5 right-4 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Sugestão</span>
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-muted-foreground">{suggestedSystemItem.date}</span>
                         <span className={cn("font-bold", suggestedSystemItem.type === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                            {formatCurrency(suggestedSystemItem.amount)}
                         </span>
                      </div>
                      <p className="text-sm font-semibold">{suggestedSystemItem.description}</p>
                    </div>
                  ) : (
                    <button className="h-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Search className="w-5 h-5" />
                      <span className="text-xs font-bold">Buscar lançamento</span>
                    </button>
                  )}

                  {/* Ação */}
                  <div className="w-24 flex items-center justify-center">
                    {item.matched ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Conciliado</span>
                    ) : suggestedSystemItem ? (
                      <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                        Confirmar
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-card border hover:bg-muted text-xs font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap">
                        Novo Lançamento
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

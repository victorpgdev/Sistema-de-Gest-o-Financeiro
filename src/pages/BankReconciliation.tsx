import { useState, useMemo } from 'react';
import { 
  FileUp, CheckCircle, AlertCircle, ArrowLeftRight, 
  Plus, Search, Check, RefreshCw, Smartphone
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface BankLine {
  id: string;
  date: string;
  description: string;
  amount: number;
  match?: SystemTransaction;
  status: 'pending' | 'matched' | 'created';
}

interface SystemTransaction {
  date: string;
  description: string;
  amount: number;
}

const INITIAL_BANK_DATA: BankLine[] = [
  { id: '1', date: '2023-10-05', description: 'PIX RECEBIDO - JOAO SILVA', amount: 1500, status: 'matched', match: { date: '2023-10-05', description: 'Venda Consultoria - João Silva', amount: 1500 } },
  { id: '2', date: '2023-10-05', description: 'PAG TITULO BANCO ITAU', amount: -350, status: 'matched', match: { date: '2023-10-05', description: 'Conta de Energia', amount: -350 } },
  { id: '3', date: '2023-10-06', description: 'TARIFA BANCARIA', amount: -25.50, status: 'pending' },
  { id: '4', date: '2023-10-06', description: 'TED RECEBIDA - EMPRESA X', amount: 5000, status: 'pending', match: { date: '2023-10-06', description: 'Venda de Software - Empresa X', amount: 5000 } },
];

export function BankReconciliation() {
  const [activeAccount, setActiveAccount] = useState('Itaú Unibanco');
  const [bankItems, setBankItems] = useState<BankLine[]>(INITIAL_BANK_DATA);

  const stats = {
    bank: 45200.50,
    system: 43675.00,
    diff: 1525.50
  };

  const pendingCount = bankItems.filter(i => i.status === 'pending').length;

  const handleConfirm = (id: string) => {
    setBankItems(items => items.map(item => 
      item.id === id ? { ...item, status: 'matched' } : item
    ));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Conciliação Bancária</h1>
          <p className="text-muted-foreground font-medium">Importe seu arquivo OFX e sincronize seu banco manualmente.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Open Finance</button>
          <button className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30 flex items-center gap-2">
            <FileUp className="w-4 h-4" /> Importar OFX
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Account List */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Contas</h3>
          {[
            { name: 'Itaú Unibanco', badge: 3, active: activeAccount === 'Itaú Unibanco' },
            { name: 'Nubank PJ', active: activeAccount === 'Nubank PJ' },
          ].map(acc => (
            <button 
              key={acc.name}
              onClick={() => setActiveAccount(acc.name)}
              className={cn(
                "w-full p-6 rounded-[2rem] border-2 text-left transition-all relative flex items-center justify-between",
                acc.active ? "bg-card border-primary shadow-lg shadow-primary/5" : "bg-card/50 border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <div>
                <p className="font-black text-sm uppercase">{acc.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Atualizado hoje</p>
              </div>
              {acc.badge ? (
                <span className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{acc.badge}</span>
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:col-span-3 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 bg-card border rounded-[2.5rem] shadow-sm overflow-hidden">
             <div className="p-8 border-r text-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Saldo do Banco</p>
                <h4 className="text-2xl font-black">{formatCurrency(stats.bank)}</h4>
             </div>
             <div className="p-8 border-r text-center bg-muted/5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Saldo no Sistema</p>
                <h4 className="text-2xl font-black">{formatCurrency(stats.system)}</h4>
             </div>
             <div className="p-8 text-center">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Diferença Restante</p>
                <h4 className="text-2xl font-black text-rose-500">{formatCurrency(stats.diff)}</h4>
             </div>
          </div>

          {/* Table Header */}
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase">Lançamentos para Conciliar ({pendingCount} pendentes)</h3>
            <div className="flex gap-2">
               <button className="p-2 bg-muted rounded-lg"><Search className="w-4 h-4 text-muted-foreground" /></button>
               <button className="p-2 bg-muted rounded-lg"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </div>

          {/* Reconciliation List */}
          <div className="space-y-4">
             <div className="grid grid-cols-12 px-8 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <div className="col-span-5">Extrato Bancário (OFX)</div>
                <div className="col-span-5 text-center">Sistema Financeiro</div>
                <div className="col-span-2 text-right">Ação</div>
             </div>

             {bankItems.map((item) => (
               <div key={item.id} className="grid grid-cols-12 items-center bg-card border rounded-[2rem] p-4 shadow-sm group hover:shadow-md transition-all">
                  {/* Left: Bank Side */}
                  <div className="col-span-5 pl-4">
                     <p className="text-xs font-bold text-muted-foreground mb-1">{item.date}</p>
                     <div className="flex items-center justify-between pr-4">
                        <span className="font-black text-sm uppercase truncate max-w-[200px]">{item.description}</span>
                        <span className={cn("font-black text-sm", item.amount > 0 ? "text-emerald-500" : "text-rose-500")}>
                          {item.amount > 0 ? '+' : ''}{formatCurrency(item.amount)}
                        </span>
                     </div>
                  </div>

                  {/* Middle: Icon / Matcher */}
                  <div className="col-span-1 flex justify-center">
                    {item.status === 'matched' ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center animate-pulse">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Right: System Side */}
                  <div className="col-span-4 px-4 border-l border-dashed border-border h-full flex flex-col justify-center">
                    {item.match ? (
                      <div className={cn("transition-opacity", item.status === 'matched' ? 'opacity-40' : 'opacity-100')}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.match.date}</p>
                          {item.status === 'pending' && <span className="bg-amber-500/10 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Sugestão</span>}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-tight truncate max-w-[150px]">{item.match.description}</p>
                          <p className="text-xs font-bold tabular-nums">{formatCurrency(item.match.amount)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 opacity-40">
                         <button className="text-[10px] font-black uppercase text-primary hover:underline">Buscar lançamento</button>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="col-span-2 text-right pr-4">
                    {item.status === 'matched' ? (
                      <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center justify-end gap-1">
                        <CheckCircle className="w-4 h-4" /> Conciliado
                      </span>
                    ) : item.match ? (
                      <button 
                        onClick={() => handleConfirm(item.id)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >Confirmar</button>
                    ) : (
                      <button 
                        className="px-4 py-2 border-2 border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                      >Novo Lançamento</button>
                    )}
                  </div>
               </div>
             ))}
          </div>

        </div>
      </div>
    </div>
  );
}

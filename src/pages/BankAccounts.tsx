import { 
  Plus, 
  Search, 
  MoreVertical, 
  Wallet, 
  Building2, 
  CreditCard, 
  ArrowRightLeft 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const accounts = [
  { bank: 'Itaú Unibanco', type: 'Checking', balance: 45200.50, agency: '0001', number: '12345-6' },
  { bank: 'Nubank', type: 'Investment', balance: 80000.00, agency: '0001', number: '98765-4' },
  { bank: 'Caixa Interna', type: 'Cash', balance: 230.00, agency: '-', number: '-' },
];

export function BankAccounts() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas Bancárias</h1>
          <p className="text-muted-foreground">Gerencie suas contas e saldos em tempo real.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
          <Plus className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accounts.map((acc, i) => (
          <div key={i} className="p-6 bg-card border rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-20 h-20 rotate-12" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-bold">
                {acc.bank[0]}
              </div>
              <div>
                <h3 className="font-bold">{acc.bank}</h3>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{acc.type}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <h3 className="text-3xl font-extrabold tracking-tight">{formatCurrency(acc.balance)}</h3>
            </div>

            <div className="mt-6 pt-6 border-t flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Ag: {acc.agency} • C: {acc.number}</span>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-8 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold">Histórico de Transações</h3>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Pesquisar transações..." 
              className="w-full pl-11 pr-4 py-3 bg-muted/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <p>Selecione uma conta para ver o extrato detalhado.</p>
        </div>
      </div>
    </div>
  );
}

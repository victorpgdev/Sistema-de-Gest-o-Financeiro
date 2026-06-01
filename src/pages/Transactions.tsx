import { 
  Plus, 
  Search, 
  Filter, 
  Download,
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const transactions = [
  { id: '1', date: '2023-10-01', description: 'Venda de Software SaaS', category: 'Serviços', account: 'Itaú Unibanco', amount: 4500.00, type: 'income', status: 'paid' },
  { id: '2', date: '2023-10-02', description: 'Aluguel do Escritório', category: 'Infraestrutura', account: 'Itaú Unibanco', amount: 2800.00, type: 'expense', status: 'paid' },
  { id: '3', date: '2023-10-03', description: 'Consultoria Mensal - Cliente X', category: 'Serviços', account: 'Nubank', amount: 12000.00, type: 'income', status: 'pending' },
  { id: '4', date: '2023-10-04', description: 'Assinatura AWS', category: 'Tecnologia', account: 'Nubank', amount: 450.20, type: 'expense', status: 'paid' },
  { id: '5', date: '2023-10-05', description: 'Salários da Equipe', category: 'Pessoal', account: 'Itaú Unibanco', amount: 15200.00, type: 'expense', status: 'pending' },
  { id: '6', date: '2023-10-06', description: 'Reembolso Despesas', category: 'Outros', account: 'Caixa Interna', amount: 150.00, type: 'income', status: 'paid' },
];

export function Transactions() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transações Financeiras</h1>
          <p className="text-muted-foreground">Registre e acompanhe todas as movimentações financeiras.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold transition-all">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Entradas (Mês)</p>
          <h3 className="text-2xl font-bold text-emerald-700">{formatCurrency(16650.00)}</h3>
        </div>
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Saídas (Mês)</p>
          <h3 className="text-2xl font-bold text-rose-700">{formatCurrency(18450.20)}</h3>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Pendente</p>
          <h3 className="text-2xl font-bold text-blue-700">{formatCurrency(27200.00)}</h3>
        </div>
        <div className="p-4 bg-card border rounded-2xl">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Movimentado</p>
          <h3 className="text-2xl font-bold">{formatCurrency(35100.20)}</h3>
        </div>
      </div>

      <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar descrição ou categoria..." 
              className="w-full pl-11 pr-4 py-3 bg-muted/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm font-medium transition-colors">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Este Mês
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-xl text-sm font-medium transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Conta</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-8 py-4 text-sm font-medium">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {t.type === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold text-sm">{t.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                    {t.account}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      t.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {t.status === 'paid' ? 'Efetivado' : 'Pendente'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold text-sm",
                    t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t bg-muted/10 flex items-center justify-between">
           <span className="text-sm text-muted-foreground font-medium">Exibindo 6 de 142 transações</span>
           <div className="flex gap-2">
             <button className="px-4 py-2 bg-card border rounded-xl text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50">Anterior</button>
             <button className="px-4 py-2 bg-card border rounded-xl text-sm font-bold hover:bg-muted transition-colors">Próxima</button>
           </div>
        </div>
      </div>
    </div>
  );
}

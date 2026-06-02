import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard }      from './pages/Dashboard';
import { Login }          from './pages/Login';
import { MasterDashboard } from './pages/MasterDashboard';
import { BankAccounts }   from './pages/BankAccounts';
import { BankReconciliation } from './pages/BankReconciliation';
import { Transactions }   from './pages/Transactions';
import { CreditCards }    from './pages/CreditCards';
import { CashFlow }       from './pages/CashFlow';
import { Reports }        from './pages/Reports';
import { useEffect } from 'react';
import { useAuthStore } from './store';
import { Loader2 } from 'lucide-react';

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {isAuthenticated ? (
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route path="/"          element={<Dashboard />} />
            <Route path="/master"    element={<MasterDashboard />} />

            {/* Financeiro */}
            <Route path="/accounts"       element={<BankAccounts />} />
            <Route path="/cards"          element={<CreditCards />} />
            <Route path="/reconciliation" element={<BankReconciliation />} />
            <Route path="/transactions"   element={<Transactions />} />
            
            {/* Ferramentas */}
            <Route path="/cobrancas"   element={<PlaceholderPage title="Régua de Cobrança" desc="Configuração de lembretes e alertas para não perder vencimentos." />} />
            <Route path="/metas"       element={<PlaceholderPage title="Metas e Orçamentos" desc="Definição de metas financeiras para planejamento futuro." />} />

            {/* Análise */}
            <Route path="/cash-flow"      element={<CashFlow />} />
            <Route path="/reports"        element={<Reports />} />

            {/* Sistema */}
            <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" desc="Suas preferências de conta e segurança." />} />
            <Route path="/empresa"       element={<PlaceholderPage title="Minha Empresa" desc="Dados do seu plano e informações gerais." />} />
            
            {/* Catch-all for authenticated */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*"      element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

// Placeholder for sections in development
function PlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 rounded-3xl border bg-card text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-4xl">🚧</div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-sm">{desc}</p>
    </div>
  );
}

export default App;

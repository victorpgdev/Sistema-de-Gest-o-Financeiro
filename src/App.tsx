import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard }      from './pages/Dashboard';
import { Login }          from './pages/Login';
import { MasterDashboard } from './pages/MasterDashboard';
import { BankAccounts }   from './pages/BankAccounts';
import { BankReconciliation } from './pages/BankReconciliation';
import { Transactions }   from './pages/Transactions';
import { CashFlow }       from './pages/CashFlow';
import { Reports }        from './pages/Reports';

function App() {
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*"     element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route path="/"          element={<Dashboard />} />
          <Route path="/master"    element={<MasterDashboard />} />

          {/* Financeiro */}
          <Route path="/contas"      element={<BankAccounts />} />
          <Route path="/cartoes"     element={<PlaceholderPage title="Cartões de Crédito" desc="Gerenciamento de faturas e limites de cartões." />} />
          <Route path="/conciliacao" element={<BankReconciliation />} />
          <Route path="/receber"     element={<Transactions />} />
          <Route path="/pagar"       element={<Transactions />} />
          
          {/* Ferramentas */}
          <Route path="/cobrancas"   element={<PlaceholderPage title="Régua de Cobrança" desc="Configuração de lembretes e alertas para não perder vencimentos." />} />
          <Route path="/metas"       element={<PlaceholderPage title="Metas e Orçamentos" desc="Definição de metas financeiras para planejamento futuro." />} />

          {/* Análise */}
          <Route path="/fluxo"       element={<CashFlow />} />
          <Route path="/relatorios"  element={<Reports />} />

          {/* Sistema */}
          <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" desc="Suas preferências de conta e segurança." />} />
          <Route path="/empresa"       element={<PlaceholderPage title="Minha Empresa" desc="Dados do seu plano e informações gerais." />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
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

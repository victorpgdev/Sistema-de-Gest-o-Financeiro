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
import { Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';

function App() {
  const { isAuthenticated, isLoading, initialize, tenant, user } = useAuthStore();

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

  // Lógica de Bloqueio de Licença (Multi-tenant) e Bloqueio Individual
  // Se o usuário for banido INDIVIDUALMENTE ou se a EMPRESA estiver suspensa, bloqueia.
  const isAccountBlocked = user?.role !== 'MASTER' && (tenant?.status === 'suspended' || user?.status === 'banned');

  return (
    <BrowserRouter>
      <Routes>
        {isAuthenticated ? (
          isAccountBlocked ? (
            <Route path="*" element={<BlockedAccountScreen message={user?.status === 'banned' ? 'Sua conta individual foi suspensa pelo administrador.' : 'A licença desta empresa expirou ou está suspensa.'} />} />
          ) : (
            <Route element={<DashboardLayout />}>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/master"    element={<MasterDashboard />} />
              <Route path="/accounts"       element={<BankAccounts />} />
              <Route path="/cards"          element={<CreditCards />} />
              <Route path="/reconciliation" element={<BankReconciliation />} />
              <Route path="/transactions"   element={<Transactions />} />
              <Route path="/cash-flow"      element={<CashFlow />} />
              <Route path="/reports"        element={<Reports />} />
              
              {/* Fallbacks */}
              <Route path="/cobrancas"   element={<PlaceholderPage title="Régua de Cobrança" desc="Em breve." />} />
              <Route path="/metas"       element={<PlaceholderPage title="Metas" desc="Em breve." />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )
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

function BlockedAccountScreen({ message }: { message: string }) {
  const { logout } = useAuthStore();
  return (
    <div className="h-screen w-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border-2 border-rose-100 rounded-[2.5rem] p-10 text-center space-y-6 shadow-2xl shadow-rose-500/5">
        <div className="w-20 h-20 bg-rose-500/10 text-rose-600 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Acesso Interrompido</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <div className="pt-4 space-y-3">
          <button 
            onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            Falar com Suporte
          </button>
          <button 
            onClick={logout}
            className="w-full py-4 border rounded-2xl font-semibold text-muted-foreground hover:bg-muted transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 rounded-3xl border bg-card text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-4xl">🚧</div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}

export default App;

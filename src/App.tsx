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
import { Team }           from './pages/Team';
import { Settings }       from './pages/Settings';
import { Help }           from './pages/Help';
import { Onboarding }     from './pages/Onboarding';
import { SecurityCompliance } from './pages/SecurityCompliance';
import { TermsConsent }     from './components/TermsConsent';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store';
import { Loader2, ShieldAlert } from 'lucide-react';

function App() {
  const { isAuthenticated, isLoading, initialize, tenant, user } = useAuthStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Bloquear Menu de Contexto (Botão Direito) - Native Feel
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    // Bloquear atalhos de desenvolvedor
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C'))) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Detecta primeiro acesso (Onboarding e LGPD)
  useEffect(() => {
    if (user && user.role !== 'MASTER') {
      // 1. Verifica Consentimento LGPD (Cache Local primeiro para velocidade)
      const localConsent = localStorage.getItem(`lgpd_consent_${user.id}`);
      if (localConsent === 'true') {
        setShowConsent(false);
      } else {
        supabase.from('lgpd_consentimentos').select('id').eq('usuario_id', user.id).single()
          .then(({ data: consent }) => {
            if (consent) {
              localStorage.setItem(`lgpd_consent_${user.id}`, 'true');
              setShowConsent(false);
            } else {
              setShowConsent(true);
            }
          });
      }

      // 2. Verifica Onboarding
      supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single()
        .then(({ data }) => {
          if (data && !data.onboarding_completed) setShowOnboarding(true);
        });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

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
              <Route path="/transactions"   element={<Transactions />} />
              <Route path="/cash-flow"      element={<CashFlow />} />
              <Route path="/reports"        element={<Reports />} />
              <Route path="/team"           element={<Team />} />
              <Route path="/settings"       element={<Settings />} />
              <Route path="/help"           element={<Help />} />
              <Route path="/security"       element={<SecurityCompliance />} />
              
              {/* Gestão Avançada */}
              <Route path="/cobrancas"   element={<PlaceholderPage title="Régua de Cobrança" desc="Módulo de automação de recebimentos." />} />
              <Route path="/metas"       element={<PlaceholderPage title="Gestão de Metas" desc="Definição e acompanhamento de objetivos financeiros." />} />
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

      {/* Trava LGPD: Aceite de Termos Obrigatório */}
      {isAuthenticated && showConsent && (
        <TermsConsent user={user} onAccept={() => setShowConsent(false)} />
      )}

      {/* Onboarding: aparece 1x no primeiro acesso após aceite dos termos */}
      {isAuthenticated && !showConsent && showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
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

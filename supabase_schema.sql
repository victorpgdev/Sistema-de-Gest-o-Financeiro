-- CONFIGURAÇÃO MULTI-TENANT PARA SISTEMA FINANCEIRO (PF, PJ, EMPRESA)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tenants (Empresas/Organizações)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document TEXT UNIQUE, 
  plan TEXT DEFAULT 'Basic' CHECK (plan IN ('Basic', 'Pro', 'Enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id),
  name TEXT,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'OWNER' CHECK (role IN ('MASTER', 'OWNER', 'FINANCE', 'VIEWER')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  bank_name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Checking', 'Savings', 'Investment', 'Cash')),
  balance DECIMAL(15,2) DEFAULT 0,
  agency TEXT,
  number TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Transações (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'canceled')),
  due_date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Auditoria de Log (IMUTÁVEL)
CREATE TABLE IF NOT EXISTS auditoria_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  descricao TEXT,
  dados_alterados JSONB,
  user_agent TEXT,
  ip_address TEXT,
  data_hora TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Solicitações LGPD
CREATE TABLE IF NOT EXISTS solicitacoes_lgpd (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  tipo_solicitacao TEXT NOT NULL,
  status TEXT DEFAULT 'pendente',
  data_abertura TIMESTAMPTZ DEFAULT NOW(),
  data_conclusao TIMESTAMPTZ
);

-- 8. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_lgpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Permissões básicas por Tenant
CREATE POLICY "Tenant isolation for audit" ON auditoria_logs FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for lgpd" ON solicitacoes_lgpd FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Tenant isolation for notifications" ON notifications FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PERMISSÃO ESPECIAL PARA O MASTER
CREATE POLICY "Master admin access" ON auditoria_logs FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MASTER'));

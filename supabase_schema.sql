-- CONFIGURAÇÃO MULTI-TENANT PARA SISTEMA FINANCEIRO (PF, PJ, EMPRESA)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tenants (Empresas/Organizações)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  document TEXT UNIQUE, -- CNPJ ou CPF
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  bank TEXT NOT NULL,
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
  tenant_id UUID REFERENCES tenants(id),
  account_id UUID REFERENCES bank_accounts(id),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  due_date DATE DEFAULT CURRENT_DATE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS) - LIBERANDO ACESSO
-- ==========================================

-- Habilitar RLS em tudo
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para Tenants (Só MASTER vê tudo, OWNER vê o seu)
CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Políticas para Profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- Políticas para Contas Bancárias (Multi-tenant)
CREATE POLICY "Users can manage accounts of their tenant" ON bank_accounts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Políticas para Transações (Multi-tenant)
CREATE POLICY "Users can manage transactions of their tenant" ON transactions
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PERMISSÃO ESPECIAL PARA O MASTER (VOCÊ)
CREATE POLICY "Master can do everything" ON tenants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'MASTER')
);

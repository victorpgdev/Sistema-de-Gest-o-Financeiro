-- # PG FINANCIAL ERP - DATABASE SCHEMA (PRODUCTION READY)
-- Versão: 1.0.0
-- Localização: Português Brasil

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE TENANTS (EMPRESAS)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'Basic' CHECK (plan IN ('Basic', 'Pro', 'Enterprise')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PERFIS (USUÁRIOS)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'OWNER' CHECK (role IN ('MASTER', 'OWNER', 'FINANCE', 'VIEWER')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    lgpd_accepted BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE CONTAS BANCÁRIAS
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    type TEXT DEFAULT 'checking' CHECK (type IN ('checking', 'savings', 'investment', 'cash')),
    balance NUMERIC(15, 2) DEFAULT 0.00,
    account_number TEXT,
    agency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE CARTÕES DE CRÉDITO
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    card_name TEXT NOT NULL,
    bank_name TEXT,
    limit_amount NUMERIC(15, 2) DEFAULT 0.00,
    current_spent NUMERIC(15, 2) DEFAULT 0.00,
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE TRANSAÇÕES (LANÇAMENTOS)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE AUDITORIA (LOGS)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SEGURANÇA (RLS - ROW LEVEL SECURITY)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;

-- 9. FUNÇÃO AUXILIAR PARA RLS (EVITAR RECURSÃO)
CREATE OR REPLACE FUNCTION is_master() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'MASTER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. POLÍTICAS DE ACESSO (MULTITENANT)

-- POLÍTICA GERAL: Usuários comuns só vêem dados do seu próprio tenant. Master vê tudo.
DROP POLICY IF EXISTS "Tenant isolation for bank_accounts" ON bank_accounts;
CREATE POLICY "Tenant isolation for bank_accounts" ON bank_accounts
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR is_master());

DROP POLICY IF EXISTS "Tenant isolation for credit_cards" ON credit_cards;
CREATE POLICY "Tenant isolation for credit_cards" ON credit_cards
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR is_master());

DROP POLICY IF EXISTS "Tenant isolation for transactions" ON transactions;
CREATE POLICY "Tenant isolation for transactions" ON transactions
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR is_master());

DROP POLICY IF EXISTS "Tenant isolation for auditoria_logs" ON auditoria_logs;
CREATE POLICY "Tenant isolation for auditoria_logs" ON auditoria_logs
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR is_master());

-- POLÍTICA PARA PROFILES (A MAIS CRÍTICA PARA EVITAR RECURSÃO)
DROP POLICY IF EXISTS "Profiles isolation" ON profiles;
CREATE POLICY "Profiles isolation" ON profiles
    USING (id = auth.uid() OR tenant_id = (SELECT tenant_id FROM profiles p WHERE p.id = auth.uid()) OR is_master());

-- 10. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON credit_cards;
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

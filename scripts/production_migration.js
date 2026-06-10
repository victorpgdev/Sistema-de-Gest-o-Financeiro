import { createClient } from '@supabase/supabase-js';
import process from 'process';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Use service role for DDL

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- 1. Tabelas Base e Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela: Categorias (Substitui campo string por ID)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, name, type)
);

-- 3. Tabela: Contatos (Clientes/Fornecedores)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  document TEXT,
  phone TEXT,
  type TEXT CHECK (type IN ('client', 'supplier', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ajustes na Tabela de Transações
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS observations TEXT;

-- 5. Ajustes na Tabela de Contas Bancárias
-- Tenta renomear 'number' para 'account_number' se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bank_accounts' AND column_name='number') THEN
    ALTER TABLE bank_accounts RENAME COLUMN number TO account_number;
  END IF;
END $$;

-- 6. Logs de Auditoria Master
ALTER TABLE auditoria_logs ADD COLUMN IF NOT EXISTS nivel TEXT DEFAULT 'INFO';
ALTER TABLE auditoria_logs ADD COLUMN IF NOT EXISTS stack_trace TEXT;

-- 7. RLS e Políticas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tenant isolation for categories') THEN
    CREATE POLICY "Tenant isolation for categories" ON categories USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Tenant isolation for contacts') THEN
    CREATE POLICY "Tenant isolation for contacts" ON contacts USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER');
  END IF;
END $$;
`;

async function runMigration() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase Environment Variables');
    return;
  }
  console.log('🚀 Running Production Migration...');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('❌ Migration Failed:', error.message);
    console.log('💡 Note: Ensure "exec_sql" function is enabled in Supabase.');
  } else {
    console.log('✅ Migration Successful!');
  }
}

runMigration();

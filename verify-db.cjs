const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://odrghxceqtlnokskvchu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcmdoeGNlcXRsbm9rc2t2Y2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjQxMzYsImV4cCI6MjA5NTkwMDEzNn0.DxeFYMcwvqElYhm10NITyBFJpJaMWnuwElbg14hRohE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersistence() {
  console.log('🚀 Iniciando teste de persistência via código...');

  // 1. Tentar criar um Tenant de Teste (Empresa)
  const testTenantId = '235bacfd-ac10-4ab0-88ee-b50ada2bda4d';
  console.log('--- Testando criação de Empresa (Tenants) ---');
  
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .upsert([{ 
      id: testTenantId, 
      name: 'Empresa Teste Master',
      document: '00.000.000/0001-99',
      plan: 'Enterprise',
      status: 'active'
    }])
    .select();

  if (tenantError) {
    console.error('❌ ERRO ao criar Empresa:', tenantError.message);
    if (tenantError.message.includes('relation "tenants" does not exist')) {
      console.log('👉 SOLUÇÃO: Você PRECISA rodar o SQL no Supabase para criar as tabelas.');
    }
  } else {
    console.log('✅ Empresa criada/verificada com sucesso!');
  }

  // 2. Tentar criar uma Transação (Lançamento)
  console.log('\n--- Testando criação de Lançamento (Transactions) ---');
  const { data: transData, error: transError } = await supabase
    .from('transactions')
    .insert([{
      tenant_id: testTenantId,
      description: 'LANÇAMENTO DE TESTE VIA CÓDIGO',
      amount: 123.45,
      type: 'income',
      status: 'pending',
      category: 'Teste'
    }])
    .select();

  if (transError) {
    console.error('❌ ERRO ao salvar Lançamento:', transError.message);
  } else {
    console.log('✅ Lançamento salvo com sucesso no banco de dados!');
    console.log('Dados salvos:', transData);
  }
}

testPersistence();

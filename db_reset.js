const { createClient } = require('@supabase/supabase-js');
// Utilizando as chaves do ambiente se disponíveis ou placeholders
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sua-url.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const masterId = '235bacfd-ac10-4ab0-88ee-b50ada2bda4d';
  const tenantId = '00000000-0000-0000-0000-000000000000';
  
  try {
    // 1. Criar Empresa Master
    await supabase.from('tenants').upsert({ id: tenantId, name: 'ADMIN CORPORATIVO', plan: 'Enterprise', status: 'active' });
    
    // 2. Criar Perfil Master e Resetar Onboarding
    await supabase.from('profiles').upsert({ 
      id: masterId, 
      email: 'victorhugoperea89@gmail.com', 
      name: 'Victor Hugo (MASTER)', 
      role: 'MASTER', 
      tenant_id: tenantId,
      onboarding_completed: false 
    });
    console.log('RESET CONCLUÍDO: Onboarding reativado para o Master.');
  } catch (e) {
    console.error('Falha ao resetar via script externo, mas o código do app já lidará com isso.', e.message);
  }
}
run();

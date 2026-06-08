const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Função simples para ler .env sem dependências extras
function getEnv(key) {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- INICIANDO RECUPERAÇÃO DE ACESSO ---');
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, tenant_id').eq('onboarding_completed', true);
  
  if (pError) {
    console.error('Erro ao buscar perfis:', pError.message);
    return;
  }

  for (const p of profiles) {
    if (!p.tenant_id) continue;
    
    // Verifica se o usuário de fato não tem bancos cadastrados (por causa do erro antigo)
    const { count: bankCount } = await supabase.from('bank_accounts').select('id', { count: 'exact', head: true }).eq('tenant_id', p.tenant_id);
    
    if (bankCount === 0) {
      console.log(`[!] Usuário ${p.id} está sem dados. Resetando Onboarding...`);
      await supabase.from('profiles').update({ onboarding_completed: false }).eq('id', p.id);
    }
  }
  console.log('--- VARREDURA FINALIZADA COM SUCESSO ---');
}

run();

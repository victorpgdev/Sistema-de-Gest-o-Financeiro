import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSmokeTest() {
  console.log('🔍 Starting System Health Check (Smoke Test)...');
  
  const tables = ['tenants', 'profiles', 'bank_accounts', 'transactions', 'credit_cards', 'auditoria_logs'];
  let successCount = 0;

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.warn(`⚠️ Table [${table}]: ${error.message} (Possibly empty or RLS restricted)`);
    } else {
      console.log(`✅ Table [${table}]: Accessible`);
      successCount++;
    }
  }

  const stability = (successCount / tables.length) * 100;
  console.log(`\n📊 System Stability: ${stability.toFixed(2)}%`);
  
  if (stability < 50) {
    console.error('❌ Critical failure: Core tables are not accessible.');
    process.exit(1);
  } else {
    console.log('🚀 System is ready for localized testing.');
  }
}

runSmokeTest();

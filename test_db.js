
import { createClient } from '@supabase/supabase-js';

// Usando service key para bypass RLS (apenas para diagnóstico)
const supabase = createClient('https://odrghxceqtlnokskvchu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcmdoeGNlcXRsbm9rc2t2Y2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjQxMzYsImV4cCI6MjA5NTkwMDEzNn0.DxeFYMcwvqElYhm10NITyBFJpJaMWnuwElbg14hRohE');

async function test() {
  // Tenta inserir um cartão para ver a mensagem de erro (que vai revelar colunas esperadas)
  const { error: cardErr } = await supabase.from('credit_cards').insert([{
    card_name: 'TESTE', bank_name: 'Teste', limit_amount: 100, current_spent: 0, closing_day: 5, due_day: 10, tenant_id: 'd196ba2e-9671-4d8f-9862-7345f380635b'
  }]);
  console.log('INSERT WITH card_name:', cardErr ? cardErr.message : 'SUCESSO!');

  // Tenta com 'name' ao invés de card_name
  const { error: cardErr2 } = await supabase.from('credit_cards').insert([{
    name: 'TESTE2', bank_name: 'Teste', credit_limit: 100, current_spent: 0, closing_day: 5, due_day: 10, tenant_id: 'd196ba2e-9671-4d8f-9862-7345f380635b'
  }]);
  console.log('INSERT WITH name+credit_limit:', cardErr2 ? cardErr2.message : 'SUCESSO!');
}
test();

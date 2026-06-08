
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://odrghxceqtlnokskvchu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kcmdoeGNlcXRsbm9rc2t2Y2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjQxMzYsImV4cCI6MjA5NTkwMDEzNn0.DxeFYMcwvqElYhm10NITyBFJpJaMWnuwElbg14hRohE');

async function create() {
  console.log('--- STARTING INSERT ---');
  try {
    const { data, error } = await supabase.from('tenants').insert([{
      name: 'PG DIGITAL CORP',
      plan: 'Enterprise',
      status: 'active'
    }]).select();
    
    if (error) {
      console.log('--- ERROR ---');
      console.log(error.message);
    } else {
      console.log('--- SUCCESS ---');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('--- EXCEPTION ---');
    console.log(e.message);
  }
}
create();

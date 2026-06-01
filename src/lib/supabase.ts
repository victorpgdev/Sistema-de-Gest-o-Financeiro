import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully if env vars are missing to avoid white screen
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials missing! Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env or Vercel settings.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

/**
 * Helper to get the current tenant ID from the session/user metadata
 */
export async function getCurrentTenantId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.user_metadata?.tenant_id;
}

/**
 * Multi-tenant safe query builder
 */
export async function tenantQuery(table: string) {
  const tenantId = await getCurrentTenantId();
  return supabase.from(table).select('*').eq('tenant_id', tenantId);
}

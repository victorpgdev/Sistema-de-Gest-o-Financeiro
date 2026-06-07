import { supabase } from './supabase';

export const PLAN_LIMITS = {
  Basic: {
    bankAccounts: 1,
    creditCards: 1,
    teamMembers: 1,
  },
  Pro: {
    bankAccounts: 5,
    creditCards: 5,
    teamMembers: 5,
  },
  Enterprise: {
    bankAccounts: 999,
    creditCards: 999,
    teamMembers: 999,
  }
};

export async function checkPlanLimit(tenantId: string, plan: string, type: keyof typeof PLAN_LIMITS.Basic) {
  const tableMap = {
    bankAccounts: 'bank_accounts',
    creditCards: 'credit_cards',
    teamMembers: 'profiles'
  };

  const { count, error } = await supabase
    .from(tableMap[type])
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) return false;

  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.Basic;
  return (count || 0) < limit[type];
}

export async function logAuditAction(tenantId: string, userId: string, action: string, metadata: any = {}) {
  await supabase.from('audit_logs').insert([{
    tenant_id: tenantId,
    user_id: userId,
    action,
    metadata
  }]);
}

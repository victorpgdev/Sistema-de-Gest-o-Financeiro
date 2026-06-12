import { supabase } from './supabase';

export const PLAN_LIMITS = {
  Basic: {
    bankAccounts: 10, // Aumentado para uso pessoal sem travas imediatas
    creditCards: 10,
    teamMembers: 2,
  },
  Pro: {
    bankAccounts: 50,
    creditCards: 50,
    teamMembers: 10,
  },
  Enterprise: {
    bankAccounts: 9999,
    creditCards: 9999,
    teamMembers: 9999,
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

/**
 * Registra uma ação na tabela de auditoria oficial.
 */
export async function logAuditAction(tenantId: string, userId: string, action: string, metadata: any = {}) {
  await supabase.from('auditoria_logs').insert([{
    tenant_id: tenantId,
    user_id: userId,
    action,
    module: 'FINANCEIRO',
    description: `Ação manual: ${action}`,
    metadata
  }]);
}

import { supabase } from './supabase';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'CONSENT_LGPD' | 'ERROR' | 'SYSTEM_CHECK';
export type AuditModule = 'AUTH' | 'TRANSACTIONS' | 'ACCOUNTS' | 'CARDS' | 'TEAM' | 'REPORTS' | 'SYSTEM' | 'DIAGNOSTIC';
export type AuditLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface AuditLogParams {
  userId?: string;
  tenantId?: string;
  action: AuditAction;
  module: AuditModule;
  description: string;
  details?: any;
  level?: AuditLevel;
}

/**
 * Registra uma atividade no log de auditoria imutável do sistema.
 * Agora suporta níveis de gravidade para diagnóstico facilitado.
 */
export async function logActivity({ 
  userId, 
  tenantId, 
  action, 
  module, 
  description, 
  details,
  level = 'INFO'
}: AuditLogParams) {
  try {
    const userAgent = navigator.userAgent;
    
    const { error } = await supabase.from('auditoria_logs').insert([{
      usuario_id: userId,
      tenant_id: tenantId,
      acao: action,
      modulo: module,
      descricao: description,
      dados_alterados: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      user_agent: userAgent,
      nivel: level,
      data_hora: new Date().toISOString()
    }]);

    if (error) console.error('Falha ao registrar auditoria:', error);
  } catch (err) {
    console.error('Erro crítico no sistema de log:', err);
  }
}

/**
 * Atalho para registrar erros do sistema automaticamente.
 */
export async function logError(error: Error | any, module: AuditModule, context?: string) {
  const { user } = (window as any).authStore?.getState?.() || {}; // Hackish access to store if available globally, or pass it
  
  console.error(`[${module}] Error:`, error);

  await logActivity({
    userId: user?.id,
    tenantId: user?.tenant_id,
    action: 'ERROR',
    module: module,
    description: `${context ? context + ': ' : ''}${error.message || 'Erro desconhecido'}`,
    details: {
      stack: error.stack,
      name: error.name,
      ...error
    },
    level: 'ERROR'
  });
}


/**
 * Formata dados sensíveis para conformidade LGPD (Mascaramento)
 */
export function maskSensitiveData(value: string, type: 'email' | 'cpf' | 'cnpj' | 'phone') {
  if (!value) return '';
  
  switch (type) {
    case 'email':
      const [user, domain] = value.split('@');
      return `${user.substring(0, 3)}***@${domain}`;
    case 'cpf':
      return value.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, '$1.***.***-$2');
    case 'cnpj':
      return value.replace(/(\d{2})\.\d{3}\.\d{3}\/\d{4}-(\d{2})/, '$1.***.***/****-$2');
    case 'phone':
      return value.replace(/(\d{2})\d{5}(\d{4})/, '($1) *****-$2');
    default:
      return '********';
  }
}

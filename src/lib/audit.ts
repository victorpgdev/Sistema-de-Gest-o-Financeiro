import { supabase } from './supabase';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'CONSENT_LGPD';
export type AuditModule = 'AUTH' | 'TRANSACTIONS' | 'ACCOUNTS' | 'CARDS' | 'TEAM' | 'REPORTS' | 'SYSTEM';

interface AuditLogParams {
  userId: string;
  tenantId: string;
  action: AuditAction;
  module: AuditModule;
  description: string;
  details?: any;
}

/**
 * Registra uma atividade no log de auditoria imutável do sistema.
 * Padrão Enterprise para conformidade LGPD e Auditoria Financeira.
 */
export async function logActivity({ 
  userId, 
  tenantId, 
  action, 
  module, 
  description, 
  details 
}: AuditLogParams) {
  try {
    // Obter dados do navegador/dispositivo
    const userAgent = navigator.userAgent;
    
    // O IP idealmente é capturado no lado do servidor (Edge Functions do Supabase)
    // Mas aqui registramos o contexto completo do cliente
    const { error } = await supabase.from('auditoria_logs').insert([{
      usuario_id: userId,
      tenant_id: tenantId,
      acao: action,
      modulo: module,
      descricao: description,
      dados_alterados: details ? JSON.stringify(details) : null,
      user_agent: userAgent,
      data_hora: new Date().toISOString()
    }]);

    if (error) console.error('Falha ao registrar auditoria:', error);
  } catch (err) {
    console.error('Erro crítico no sistema de log:', err);
  }
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

import { supabase } from './supabase';

interface LogEntry {
  userId?: string;
  tenantId?: string;
  action: string;
  module: string;
  description: string;
  metadata?: any;
  nivel?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  stack_trace?: string;
}

/**
 * Registra uma atividade ou erro no sistema de auditoria PG-IRONCLAD.
 */
export async function logActivity(entry: LogEntry) {
  try {
    const { error } = await supabase.from('auditoria_logs').insert([{
      user_id: entry.userId,
      tenant_id: entry.tenantId,
      action: entry.action,
      module: entry.module,
      description: entry.description,
      metadata: entry.metadata || {},
      nivel: entry.nivel || 'INFO',
      stack_trace: entry.stack_trace
    }]);

    if (error) {
      // Falha silenciosa para não quebrar a UI, mas loga no console em dev
      console.error('Audit Log Error:', error.message);
    }
  } catch (err) {
    console.warn('Silent Audit Failure:', err);
  }
}

/**
 * Captura erros globais do sistema e envia para auditoria.
 */
export function setupGlobalErrorLogging(userId?: string, tenantId?: string) {
  window.onerror = function(message, source, lineno, colno, error) {
    logActivity({
      userId,
      tenantId,
      action: 'SYSTEM_ERROR',
      module: 'GLOBAL_HANDLER',
      nivel: 'CRITICAL',
      description: `Erro Crítico: ${message}`,
      metadata: { source, lineno, colno },
      stack_trace: error?.stack
    });
  };

  window.onunhandledrejection = function(event) {
    logActivity({
      userId,
      tenantId,
      action: 'PROMISE_REJECTION',
      module: 'GLOBAL_HANDLER',
      nivel: 'ERROR',
      description: `Promessa Rejeitada: ${event.reason?.message || event.reason}`,
      stack_trace: event.reason?.stack
    });
  };
}

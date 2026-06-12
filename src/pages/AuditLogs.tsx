import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, Search, Filter, 
  ChevronLeft, ChevronRight, Loader2, 
  Terminal, ShieldAlert, Activity, 
  User, Database, Globe, Bug, Eye, X, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { logActivity } from '@/lib/audit';

interface AuditLog {
  id: string;
  user_id: string;
  tenant_id: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  nivel: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  created_at: string;
  stack_trace?: string;
  metadata?: any;
}

export function AuditLogs() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const itemsPerPage = 15;

  const fetchLogs = async () => {
    if (!user?.tenant_id && user?.role !== 'MASTER') return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('auditoria_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.role !== 'MASTER') {
        query = query.eq('tenant_id', user?.tenant_id);
      }

      if (filterLevel !== 'ALL') {
        query = query.eq('nivel', filterLevel);
      }

      const { data, error } = await query.range((page - 1) * itemsPerPage, page * itemsPerPage - 1);
      
      if (!error) setLogs(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchLogs(); 
  }, [user, page, filterLevel]);

  const handleSimulateError = async () => {
    // Forçar um erro de referência para testar o Global Handler
    try {
      // @ts-ignore
      console.log(variavelNaoExistente.valor);
    } catch (err: any) {
      await logActivity({
        userId: user?.id,
        tenantId: user?.tenant_id || undefined,
        action: 'MANUAL_TEST_ERROR',
        module: 'AUDIT_PAGE',
        nivel: 'ERROR',
        description: 'Erro simulado pelo usuário para teste de telemetria.',
        stack_trace: err.stack
      });
      fetchLogs();
    }
  };

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200';
      case 'ERROR': return 'bg-rose-50 text-rose-500 border-rose-100';
      case 'WARNING': return 'bg-amber-50 text-amber-500 border-amber-100';
      case 'SUCCESS': return 'bg-emerald-50 text-emerald-500 border-emerald-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Registro de Auditoria</h1>
            <p className="text-sm text-muted-foreground font-medium tracking-tight">Telemetria PG-IRONCLAD v2.1 Ativa</p>
          </div>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={handleSimulateError}
             className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 transition-all border border-rose-200"
           >
             <Bug className="w-4 h-4" /> Simular Erro
           </button>
           <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border">
             {['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'].map(lvl => (
               <button 
                 key={lvl}
                 onClick={() => { setFilterLevel(lvl); setPage(1); }}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                   filterLevel === lvl ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-800"
                 )}
               >
                 {lvl === 'CRITICAL' ? '⚠️ CRÍTICO' : lvl}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Pesquisar por descrição, módulo ou ação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">Timestamp / IP</th>
                <th className="px-6 py-6">Módulo / Ação</th>
                <th className="px-6 py-6">Descrição do Evento</th>
                <th className="px-8 py-6 text-center">Nível</th>
                <th className="px-10 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-400 text-sm font-medium italic">Nenhum evento registrado nesta filtragem.</td></tr>
              ) : logs.filter(l => l.description.toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <p className="text-sm font-black text-slate-700">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       <Globe className="w-3 h-3 text-slate-300" /> {log.ip_address || 'Internal System'}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-primary opacity-40 shrink-0" />
                        <span className="font-black text-[10px] text-primary uppercase tracking-[0.15em]">{log.module}</span>
                     </div>
                     <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{log.action}</p>
                  </td>
                  <td className="px-6 py-6 max-w-sm">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed truncate">{log.description}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      getLevelStyles(log.nivel)
                    )}>
                      {log.nivel}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 ml-auto"
                    >
                       <Eye className="w-4 h-4" /> <span className="text-[9px] font-black uppercase">Ver Detalhes</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Página {page}</p>
           <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-3 bg-white border rounded-xl hover:bg-slate-100 transition-all text-slate-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                className="p-3 bg-white border rounded-xl hover:bg-slate-100 transition-all text-slate-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end p-0 md:p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="h-full w-full max-w-2xl bg-white border-l shadow-2xl overflow-y-auto p-10 relative"
            >
              <button onClick={() => setSelectedLog(null)} className="absolute top-8 right-8 p-3 bg-slate-100 rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
              
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                   <div className={cn("w-16 h-16 rounded-[2rem] flex items-center justify-center", getLevelStyles(selectedLog.nivel))}>
                      <Activity className="w-8 h-8" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Detalhes do Evento</h2>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{selectedLog.module} / {selectedLog.action}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                       <p className="font-bold text-slate-800">{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço IP</p>
                       <p className="font-bold text-slate-800">{selectedLog.ip_address || 'Não registrado'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Descrição Completa</h3>
                   <div className="p-6 bg-white border border-slate-100 rounded-3xl text-slate-600 font-medium leading-relaxed">
                      {selectedLog.description}
                   </div>
                </div>

                {selectedLog.stack_trace && (
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        <Bug className="w-4 h-4" /> Stack Trace (Erro Técnico)
                      </h3>
                      <pre className="p-6 bg-slate-900 text-rose-300 text-[11px] font-mono rounded-3xl overflow-x-auto whitespace-pre-wrap leading-loose">
                         {selectedLog.stack_trace}
                      </pre>
                   </div>
                )}

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Database className="w-4 h-4" /> Dados Adicionais (JSON)
                      </h3>
                      <pre className="p-6 bg-slate-100 text-slate-600 text-[11px] font-mono rounded-3xl overflow-x-auto">
                         {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

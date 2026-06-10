import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Bug, Terminal, RefreshCw, 
  Search, Filter, ChevronDown, Eye, AlertTriangle, 
  CheckCircle, Server, Database, Globe, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { logActivity } from '@/lib/audit';

export function DiagnosticCenter() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>({
    db: 'checking',
    auth: 'checking',
    latency: 0
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    const start = Date.now();
    try {
      let query = supabase
        .from('auditoria_logs')
        .select('*')
        .order('data_hora', { ascending: false })
        .limit(100);

      if (user?.role !== 'MASTER' && user?.tenant_id) {
        query = query.eq('tenant_id', user.tenant_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      
      setSystemStatus({
        db: 'online',
        auth: 'online',
        latency: Date.now() - start
      });
    } catch (err) {
      console.error(err);
      setSystemStatus((prev: any) => ({ ...prev, db: 'error', auth: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Log check-in
    if (user) {
      logActivity({
        userId: user.id || undefined,
        tenantId: user.tenant_id || undefined,
        action: 'SYSTEM_CHECK',
        module: 'DIAGNOSTIC',
        description: 'Acesso à Central de Diagnóstico',
        level: 'INFO'
      });
    }
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.modulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'ALL' || log.nivel === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': case 'CRITICAL': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'WARNING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DEBUG': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            Central de Diagnóstico
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Monitoramento de Integridade e Logs de Auditoria do Sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchLogs}
            className="p-3 bg-white border rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs"
          >
            <RefreshCw className={cn("w-4 h-4 text-primary", isLoading && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      {/* SYSTEM HEALTH CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HealthCard 
          label="Base de Dados" 
          status={systemStatus.db} 
          icon={Database} 
          info={`${systemStatus.latency}ms latência`} 
        />
        <HealthCard 
          label="Autenticação" 
          status={systemStatus.auth} 
          icon={ShieldAlert} 
          info="Supabase Auth Provider" 
        />
        <HealthCard 
          label="Infraestrutura" 
          status="online" 
          icon={Server} 
          info="Vercel Edge Network" 
        />
      </div>

      <div className="bg-white border rounded-[2rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {/* TOOLBAR */}
        <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-xs"
              placeholder="Pesquisar por descrição, módulo ou ação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             {['ALL', 'INFO', 'WARNING', 'ERROR', 'DEBUG'].map(level => (
               <button 
                key={level}
                onClick={() => setFilterLevel(level)}
                className={cn(
                  "px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all whitespace-nowrap",
                  filterLevel === level ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border text-slate-500 hover:bg-slate-50"
                )}
               >
                 {level === 'ALL' ? 'Todos' : level}
               </button>
             ))}
          </div>
        </div>

        {/* LOG TABLE */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-4">Data/Hora</th>
                <th className="px-6 py-4">Nível</th>
                <th className="px-6 py-4">Módulo</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <RefreshCw className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                    Nenhum log encontrado para esses critérios.
                  </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-4 font-bold text-slate-400 whitespace-nowrap">
                    {new Date(log.data_hora).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg font-black text-[9px] uppercase border",
                      getLevelColor(log.nivel)
                    )}>
                      {log.nivel || 'INFO'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-600 block">{log.modulo}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{log.acao}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700 line-clamp-1">{log.descricao}</p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="p-2 text-primary bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG DETAILS MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl relative max-h-[85vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn("p-4 rounded-2xl", getLevelColor(selectedLog.nivel))}>
                    {selectedLog.nivel === 'ERROR' ? <Bug className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Detalhes do Evento</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedLog.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <Search className="w-6 h-6 text-slate-400 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Módulo</p>
                    <p className="font-bold text-slate-700">{selectedLog.modulo}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ação</p>
                    <p className="font-bold text-slate-700">{selectedLog.acao}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-[2rem] border">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Descrição Completa</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                    "{selectedLog.descricao}"
                  </p>
                </div>

                {selectedLog.dados_alterados && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-2">
                      <Bug className="w-3 h-3" /> Metadados / Payload
                    </p>
                    <div className="p-6 bg-slate-900 rounded-[2rem] text-blue-300 font-mono text-[10px] overflow-x-auto whitespace-pre">
                      {typeof selectedLog.dados_alterados === 'string' 
                        ? JSON.stringify(JSON.parse(selectedLog.dados_alterados), null, 2)
                        : JSON.stringify(selectedLog.dados_alterados, null, 2)
                      }
                    </div>
                  </div>
                )}

                <div className="p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed flex flex-col gap-3">
                   <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-slate-400 uppercase">Contexto do Usuário:</span>
                      <span className="font-bold text-primary">{selectedLog.usuario_id || 'Visitante'}</span>
                   </div>
                   <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-slate-400 uppercase">IP Address:</span>
                      <span className="font-bold text-slate-600">{selectedLog.ip_address || 'Proxy Local'}</span>
                   </div>
                   <div className="flex items-start justify-between text-[10px] gap-4">
                      <span className="font-black text-slate-400 uppercase shrink-0">User Agent:</span>
                      <span className="font-bold text-slate-400 text-right leading-tight italic">{selectedLog.user_agent}</span>
                   </div>
                </div>
              </div>

              <div className="mt-10">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Fechar Diagnóstico
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HealthCard({ label, status, icon: Icon, info }: any) {
  const isOnline = status === 'online';
  const isChecking = status === 'checking';

  return (
    <div className="bg-white border rounded-[2rem] p-6 shadow-sm flex items-center gap-5 relative overflow-hidden group hover:border-primary/30 transition-all">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
        isOnline ? "bg-emerald-50 text-emerald-600" : isChecking ? "bg-slate-100 text-slate-400 animate-pulse" : "bg-rose-50 text-rose-600"
      )}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : isChecking ? "bg-slate-300" : "bg-rose-500")} />
          <h3 className="text-sm font-black text-slate-700">
            {isOnline ? 'Operacional' : isChecking ? 'Verificando...' : 'Falha Detectada'}
          </h3>
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{info}</p>
      </div>
    </div>
  );
}

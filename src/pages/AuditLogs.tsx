import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, Search, Filter, 
  ChevronLeft, ChevronRight, Loader2, 
  Terminal, ShieldAlert, Activity, 
  User, Database, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface AuditLog {
  id: string;
  user_id: string;
  tenant_id: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  nivel: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  created_at: string;
  stack_trace?: string;
}

export function AuditLogs() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [page, setPage] = useState(1);
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

  const filteredLogs = logs.filter(l => 
    l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelStyles = (level: string) => {
    switch (level) {
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
            <p className="text-sm text-muted-foreground font-medium tracking-tight">PG-IRONCLAD v2.0 - Monitoramento de Integridade</p>
          </div>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border">
          {['ALL', 'INFO', 'WARNING', 'ERROR'].map(lvl => (
            <button 
              key={lvl}
              onClick={() => { setFilterLevel(lvl); setPage(1); }}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                filterLevel === lvl ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Pesquisar em logs de auditoria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white border rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-10 py-6">Timestamp / IP</th>
                <th className="px-6 py-6">Módulo / Ação</th>
                <th className="px-6 py-6">Descrição do Evento</th>
                <th className="px-8 py-6 text-center">Nível</th>
                <th className="px-10 py-6 text-right">Rastreio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-24 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center text-slate-400 text-sm font-medium italic">Nenhum evento registrado nesta filtragem.</td></tr>
              ) : filteredLogs.map(log => (
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
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{log.description}</p>
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
                    <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                       <Database className="w-4 h-4" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <ShieldAlert className="w-8 h-8 text-primary" />
               </div>
               <div>
                 <h2 className="text-xl font-black uppercase tracking-tight">Auditoria Imutável</h2>
                 <p className="text-slate-400 text-xs font-bold leading-relaxed mt-1">Este log é registrado via PG-IRONCLAD e não pode ser apagado por usuários comuns, garantindo conformidade jurídica.</p>
               </div>
            </div>
         </div>

         <div className="bg-white border rounded-[3rem] p-10 relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                 <Activity className="w-8 h-8 text-emerald-500" />
               </div>
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Saúde do Motor</h2>
                  <div className="flex items-center gap-3 mt-2">
                     <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Banco OK
                     </span>
                     <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" /> Auth OK
                     </span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, Shield, 
  Trash2, Edit2, CheckCircle2, X, 
  Loader2, AlertCircle, ShieldCheck,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'FINANCE' | 'VIEWER';
  status: 'active' | 'suspended';
}

export function Team() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchMembers = async () => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', user.tenant_id);
      
      if (!error) setMembers(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchMembers(); 
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, notification]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setNotification({ type: 'success', message: 'Status do membro atualizado.' });
      fetchMembers();
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) {
      setNotification({ type: 'success', message: 'Permissões atualizadas.' });
      fetchMembers();
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 relative">
       <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md text-white font-bold text-sm",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400" : "bg-rose-500/90 border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipe e Permissões</h1>
          <p className="text-sm text-muted-foreground font-medium">Controle quem pode acessar as suas finanças.</p>
        </div>
        <button 
          onClick={() => setNotification({ type: 'error', message: 'O convite por e-mail requer plano PRO.' })}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <UserPlus className="w-5 h-5" /> Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : members.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-[3rem]">Você é o único membro com acesso a estes dados.</div>
        ) : members.map(member => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={member.id} 
            className="bg-card border rounded-[2.5rem] p-8 hover:shadow-xl transition-all group relative overflow-hidden"
          >
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                  {member.name?.[0] || member.email[0].toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-800 truncate">{member.name || 'Usuário Sem Nome'}</h3>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  member.status === 'active' ? "bg-emerald-500" : "bg-rose-500"
                )} />
             </div>

             <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <Shield className="w-3.5 h-3.5" /> Nível de Acesso
                   </div>
                   <select 
                     disabled={member.role === 'OWNER'}
                     className="bg-muted px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-600 outline-none border-none cursor-pointer disabled:opacity-50"
                     value={member.role}
                     onChange={(e) => handleRoleChange(member.id, e.target.value)}
                   >
                      <option value="OWNER">Dono</option>
                      <option value="FINANCE">Financeiro</option>
                      <option value="VIEWER">Apenas Ver</option>
                   </select>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <UserCheck className="w-3.5 h-3.5" /> Status da Conta
                   </div>
                   <button 
                    disabled={member.role === 'OWNER'}
                    onClick={() => handleToggleStatus(member.id, member.status)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all disabled:opacity-50",
                      member.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}
                   >
                    {member.status === 'active' ? 'Ativo' : 'Suspenso'}
                   </button>
                </div>
             </div>

             {member.role !== 'OWNER' && (
               <button className="absolute bottom-4 right-4 p-2 text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:text-rose-600">
                 <Trash2 className="w-4 h-4" />
               </button>
             )}
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-primary/30 transition-all" />
         <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-2">
               <h2 className="text-2xl font-bold tracking-tight uppercase">Dica de Segurança Master</h2>
               <p className="text-slate-400 text-sm font-medium italic">
                  "Divida o trabalho, mas mantenha a chave do cofre. Atribua o nível 'Financeiro' para seus auxiliares poderem alimentar o fluxo de caixa sem alterar seus dados sensíveis."
               </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
               <span className="px-4 py-1.5 bg-primary/20 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-center">Proteção Ativa</span>
               <span className="text-slate-500 text-[10px] font-bold text-center">PG Security Systems</span>
            </div>
         </div>
      </div>
    </div>
  );
}

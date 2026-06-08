import { useState, useEffect } from 'react';
import { 
  Building2, Users, Shield, Plus, Search, 
  MoreVertical, Edit2, Trash2, CheckCircle2, 
  X, Loader2, Filter, Globe, Calendar, 
  CreditCard, Ban, Key, AlertCircle, Link,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { formatCurrency, cn } from '@/lib/utils';

export function MasterDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tenants' | 'profiles'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState<any>(null);
  const [showEditTenantModal, setShowEditTenantModal] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'tenant' | 'profile', id: string, name: string} | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*, tenants(name)').order('created_at', { ascending: false })
      ]);
      
      if (tRes.error) throw tRes.error;
      if (pRes.error) throw pRes.error;

      setTenants(tRes.data || []);
      setProfiles(pRes.data.map(p => ({ ...p, tenant_name: p.tenants?.name })) || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: `Erro: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleUpdateTenant = async (form: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: form.name,
          plan: form.plan,
          status: form.status
        })
        .eq('id', showEditTenantModal.id);

      if (error) throw error;

      setNotification({ type: 'success', message: 'Empresa atualizada com sucesso!' });
      setShowEditTenantModal(null);
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkTenant = async (profileId: string, tenantId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({ tenant_id: tenantId }).eq('id', profileId);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Vínculo empresa-usuário atualizado!' });
      setShowLinkModal(null);
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!showDeleteConfirm || confirmInput !== 'DELETAR') return;
    
    setIsLoading(true);
    try {
      if (showDeleteConfirm.type === 'tenant') {
        await supabase.from('profiles').delete().eq('tenant_id', showDeleteConfirm.id);
        const { error } = await supabase.from('tenants').delete().eq('id', showDeleteConfirm.id);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Empresa e dados deletados permanentemente.' });
      } else {
        const { error } = await supabase.from('profiles').delete().eq('id', showDeleteConfirm.id);
        if (error) throw error;
        setNotification({ type: 'success', message: 'Usuário removido do banco de dados.' });
      }
      fetchData();
      setShowDeleteConfirm(null);
      setConfirmInput('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (form: any) => {
    setIsLoading(true);
    try {
      const { data: tenant, error: tError } = await supabase
        .from('tenants')
        .insert([{ 
          name: form.companyName, 
          plan: form.plan, 
          status: 'active',
          document_number: form.document,
          entity_type: form.type,
          business_sector: form.type === 'PJ' ? form.sector : 'Pessoal'
        }])
        .select()
        .single();

      if (tError) throw tError;

      const { error: pError } = await supabase
        .from('profiles')
        .insert([{ 
          id: crypto.randomUUID(), // Nota: Para produção real, este ID viria do Supabase Auth
          email: form.email, 
          name: form.clientName, 
          role: 'OWNER', 
          tenant_id: tenant.id,
          status: 'active',
          onboarding_completed: true
        }]);

      if (pError) throw pError;

      setNotification({ type: 'success', message: 'Novo cliente ativado com sucesso!' });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setNotification({ type: 'error', message: `Falha na ativação: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredProfiles = profiles.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20 relative">
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md text-white font-bold text-sm",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400" : "bg-rose-500/90 border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Painel Master</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">O motor central do PG Financial SaaS.</p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab('tenants')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider", activeTab === 'tenants' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-800")}>EMPRESAS</button>
          <button onClick={() => setActiveTab('profiles')} className={cn("px-6 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider", activeTab === 'profiles' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-800")}>USUÁRIOS</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Faturamento Estimado (MRR)</p>
          <div className="flex items-end gap-2 font-black text-3xl text-emerald-600 tracking-tighter">
            <span className="text-emerald-500/40 text-lg mb-1 italic">R$</span>
            {formatCurrency(
              tenants.reduce((acc, t) => {
                if (t.status !== 'active') return acc;
                const prices: any = { 'Basic': 99.90, 'Pro': 199.90, 'Enterprise': 499.90 };
                return acc + (prices[t.plan] || 0);
              }, 0)
            ).replace('R$', '')}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black border border-emerald-100">PLATAFORMA ATIVA</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total de Empresas</p>
          <div className="font-black text-4xl text-slate-800 tracking-tighter">{tenants.length}</div>
          <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400">
             <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {tenants.filter(t => t.status === 'active').length} Ativas</span>
             <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {tenants.filter(t => t.status !== 'active').length} Inativas</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Usuários Totais</p>
          <div className="font-black text-4xl text-slate-800 tracking-tighter">{profiles.length}</div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-indigo-500 italic">Métrica de Engajamento Global</p>
        </motion.div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            placeholder={activeTab === 'tenants' ? "Pesquisar por nome da empresa..." : "Pesquisar por nome ou e-mail..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-slate-700"
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider"
        >
          <Plus className="w-5 h-5 flex-shrink-0" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'tenants' ? (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Organização</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6">Plano</th>
                    <th className="px-8 py-6">Chave Única</th>
                    <th className="px-10 py-6 text-right">Controle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6 font-bold text-slate-700">{t.name}</td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
                          t.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        )}>{t.status}</span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => setShowEditTenantModal(t)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border transition-all hover:scale-105 active:scale-95",
                            t.plan === 'Enterprise' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                            t.plan === 'Pro' ? "bg-cyan-50 text-cyan-600 border-cyan-100" :
                            "bg-slate-50 text-slate-500 border-slate-200"
                          )}
                        >
                          {t.plan}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-mono text-slate-400 opacity-60">{t.id}</td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={() => setShowEditTenantModal(t)}
                            className="p-2.5 hover:bg-slate-100 text-slate-500 hover:text-primary rounded-xl transition-all border border-transparent hover:border-slate-200"
                           >
                            <Edit2 className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => setShowDeleteConfirm({ type: 'tenant', id: t.id, name: t.name })}
                            className="p-2.5 hover:bg-rose-50 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100"
                           >
                            <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6">Responsável / Acesso</th>
                    <th className="px-8 py-6">Empresa Vinculada</th>
                    <th className="px-8 py-6 text-center">Nível</th>
                    <th className="px-8 py-6 text-center">Cadastro</th>
                    <th className="px-10 py-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <p className="font-bold text-slate-700">{p.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{p.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => setShowLinkModal(p)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest",
                            p.tenant_name 
                              ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-primary hover:text-primary" 
                              : "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100 animate-pulse"
                          )}
                        >
                          {p.tenant_name ? <Building2 className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                          {p.tenant_name || 'Vincular Agora'}
                        </button>
                      </td>
                      <td className="px-8 py-6 text-center font-bold text-[10px] text-slate-500 uppercase tracking-widest">{p.role}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", 
                          p.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>{p.status || 'active'}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <button 
                          onClick={() => setShowDeleteConfirm({ type: 'profile', id: p.id, name: p.name || p.email })}
                          className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border rounded-[3rem] p-12 w-full max-w-md shadow-2xl relative text-center">
               <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <ShieldAlert className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Segurança Master</h3>
               <p className="text-sm text-slate-500 mb-8">
                 Deseja deletar permanentemente <strong>{showDeleteConfirm.name}</strong>? 
                 {showDeleteConfirm.type === 'tenant' && ' Isso apagará TODAS as transações e usuários vinculados.'}
               </p>
               
               <div className="space-y-4 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digite <span className="text-rose-600 underline">DELETAR</span> para prosseguir</p>
                  <input 
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 focus:border-rose-500 rounded-2xl outline-none font-black text-center uppercase tracking-widest transition-all"
                    value={confirmInput}
                    onChange={e => setConfirmInput(e.target.value)}
                    placeholder="CONFIRMAÇÃO..."
                  />
               </div>

               <div className="flex gap-4">
                  <button onClick={() => { setShowDeleteConfirm(null); setConfirmInput(''); }} className="flex-1 py-4 border-2 rounded-2xl font-black text-xs uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                  <button 
                    onClick={executeDelete}
                    disabled={confirmInput !== 'DELETAR'}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all",
                      confirmInput === 'DELETAR' ? "bg-rose-600 text-white shadow-rose-200" : "bg-slate-200 text-slate-400 grayscale"
                    )}
                  >
                    Confirmar Exclusão
                  </button>
               </div>
            </motion.div>
          </div>
        )}

        {showEditTenantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Editar Empresa</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest opacity-60">Alterar dados da licença ativa</p>
                 </div>
                 <button onClick={() => setShowEditTenantModal(null)} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"><X className="w-6 h-6" /></button>
              </div>

              <TenantEditForm 
                tenant={showEditTenantModal} 
                onSave={handleUpdateTenant} 
                onCancel={() => setShowEditTenantModal(null)} 
              />
            </motion.div>
          </div>
        )}

        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Vincular Empresa</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{showLinkModal.email}</p>
                 </div>
                 <button onClick={() => setShowLinkModal(null)} className="p-3 bg-slate-100 text-slate-500 rounded-2xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Escolha a Organização</label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {showLinkModal.tenant_id && (
                    <button
                      onClick={() => handleLinkTenant(showLinkModal.id, null as any)}
                      className="w-full flex items-center justify-between p-5 bg-rose-50/50 hover:bg-rose-50 border-2 border-dashed border-rose-200 rounded-[1.5rem] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                         <Ban className="w-5 h-5 text-rose-500" />
                         <span className="font-bold text-sm text-rose-600">Desvincular Usuário</span>
                      </div>
                    </button>
                  )}
                  
                  {tenants.map(tenant => (
                    <button
                      key={tenant.id}
                      onClick={() => handleLinkTenant(showLinkModal.id, tenant.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all border-2",
                        showLinkModal.tenant_id === tenant.id 
                          ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                          : "bg-slate-50/50 border-transparent hover:border-slate-200 hover:bg-white text-slate-600"
                      )}
                    >
                      <div className="flex items-center gap-4">
                         <Building2 className={cn("w-5 h-5", showLinkModal.tenant_id === tenant.id ? "text-white" : "text-slate-400")} />
                         <span className="font-bold text-sm">{tenant.name}</span>
                      </div>
                      {showLinkModal.tenant_id === tenant.id && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-slate-200 rounded-[3rem] p-12 w-full max-w-xl shadow-2xl relative">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                   <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Novo Cliente</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest opacity-60">Ativar nova licença no sistema</p>
                   </div>
                   <button onClick={() => setShowModal(false)} className="p-4 bg-slate-100 rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
                </div>
                <ClientForm onSave={handleCreateClient} onCancel={() => setShowModal(false)} />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TenantEditForm({ tenant, onSave, onCancel }: any) {
  const [form, setForm] = useState({
    name: tenant.name || '',
    plan: tenant.plan || 'Basic',
    status: tenant.status || 'active'
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Organização</label>
        <input 
          className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl outline-none font-bold transition-all" 
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} 
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Plano Atual</label>
          <select 
            className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl outline-none font-bold cursor-pointer"
            value={form.plan}
            onChange={e => setForm({...form, plan: e.target.value})}
          >
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status Licença</label>
          <select 
            className={cn(
              "w-full p-4 border rounded-2xl outline-none font-bold cursor-pointer transition-all",
              form.status === 'active' ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-rose-50 border-rose-200 text-rose-600"
            )}
            value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}
          >
            <option value="active">ATIVA</option>
            <option value="inactive">INATIVA</option>
            <option value="banned">BLOQUEADA</option>
          </select>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 flex gap-4">
         <button onClick={onCancel} className="flex-1 py-4 border border-slate-200 rounded-[1.5rem] font-bold text-slate-400 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">Descartar</button>
         <button 
          onClick={() => onSave(form)} 
          className="flex-1 py-4 bg-primary text-white rounded-[1.5rem] font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-[0.2em]"
         >
          Salvar Alterações
         </button>
      </div>
    </div>
  );
}

function ClientForm({ onSave, onCancel }: any) {
  const [form, setForm] = useState({ 
    clientName: '', 
    email: '', 
    companyName: '', 
    plan: 'Basic', 
    type: 'PJ', 
    document: '', 
    sector: 'Serviços' 
  });

  const SECTORS = [
    'Serviços', 'Comércio', 'Indústria', 'Tecnologia', 
    'Saúde', 'Educação', 'Alimentação', 'Jurídico', 
    'Imobiliário', 'Outros'
  ];

  return (
    <div className="space-y-8">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border mb-2">
          <button onClick={() => setForm({...form, type: 'PJ'})} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", form.type === 'PJ' ? "bg-white shadow-sm text-primary" : "text-slate-500")}>Empresa (PJ)</button>
          <button onClick={() => setForm({...form, type: 'PF'})} className={cn("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", form.type === 'PF' ? "bg-white shadow-sm text-primary" : "text-slate-500")}>Pessoal (PF)</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" placeholder="Nome do Cliente" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" placeholder="exemplo@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
      </div>

      <div className="space-y-8 p-8 bg-slate-900 rounded-[2.5rem] text-white transition-all shadow-2xl shadow-indigo-500/5">
          <div className="space-y-2 text-center md:text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{form.type === 'PJ' ? 'Identificação da Empresa' : 'Identificação da Conta'}</label>
            <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:border-primary transition-all text-center md:text-left" placeholder={form.type === 'PJ' ? "Ex: Advocacia do Luiz Daniel" : "Ex: Minhas Finanças Pessoais"} value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{form.type === 'PJ' ? 'CNPJ' : 'CPF'}</label>
               <input className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white tracking-widest" placeholder={form.type === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"} value={form.document} onChange={e => setForm({...form, document: e.target.value})} />
            </div>
            {form.type === 'PJ' && (
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Ramo de Atividade</label>
                 <select className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white cursor-pointer" value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}>
                    {SECTORS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
                 </select>
              </div>
            )}
            {form.type === 'PF' && (
              <div className="flex items-center justify-center p-5 bg-primary/10 border border-primary/20 rounded-2xl">
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Categoria: Financeiro Pessoal</span>
              </div>
            )}
          </div>
      </div>

      <div className="flex gap-6 mt-10 pt-8 border-t border-slate-100 flex-col md:flex-row">
          <button onClick={onCancel} className="flex-1 py-5 border border-slate-200 rounded-[1.5rem] font-bold text-slate-400 hover:bg-slate-50 transition-all uppercase text-xs tracking-[0.2em]">Cancelar</button>
          <button onClick={() => onSave(form)} className="flex-1 py-5 bg-primary text-white rounded-[1.5rem] font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-[0.2em]">Ativar Licença</button>
      </div>
    </div>
  );
}

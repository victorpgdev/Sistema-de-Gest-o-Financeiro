import { useState } from 'react';
import { 
  ShieldCheck, FileText, Download, 
  Trash2, Lock, Eye, CheckCircle2, 
  Database, AlertTriangle, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';
import { logActivity } from '@/lib/audit';
import { cn } from '@/lib/utils';

export function SecurityCompliance() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [modalType, setModalType] = useState<'none' | 'export' | 'delete' | 'sql'>('none');
  const [confirmText, setConfirmText] = useState('');

  // 1. Exportar JSON (Portabilidade)
  const handleExportJSON = async () => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { data: txs } = await supabase.from('transactions').select('*').eq('tenant_id', user.tenant_id);
      const { data: accounts } = await supabase.from('bank_accounts').select('*').eq('tenant_id', user.tenant_id);
      
      const bundle = { export_date: new Date().toISOString(), transactions: txs || [], bank_accounts: accounts || [] };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      downloadFile(blob, `BACKUP_FORMATADO_${user.name?.replace(/\s/g, '_')}.json`);
      
      await logActivity({
        userId: user.id, tenantId: user.tenant_id, action: 'EXPORT', module: 'SYSTEM',
        description: 'Usuário realizou exportação JSON de dados.'
      });
      setModalType('none');
    } finally { setIsLoading(false); }
  };

  // 2. Backup SQL (PostgreSQL para Restauração)
  const handleExportSQL = async () => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { data: txs } = await supabase.from('transactions').select('*').eq('tenant_id', user.tenant_id);
      
      let sql = `-- BACKUP PG FINANCIAL \n-- DATA: ${new Date().toLocaleString()}\n-- TENANT: ${user.tenant_id}\n\n`;
      sql += `CREATE TABLE IF NOT EXISTS transactions_restore (id UUID, description TEXT, amount NUMERIC, type TEXT, status TEXT, due_date DATE, category TEXT);\n\n`;
      
      txs?.forEach(t => {
        sql += `INSERT INTO transactions_restore (id, description, amount, type, status, due_date, category) VALUES ('${t.id}', '${t.description.replace(/'/g, "''")}', ${t.amount}, '${t.type}', '${t.status}', '${t.due_date}', '${t.category || 'Geral'}');\n`;
      });

      const blob = new Blob([sql], { type: 'text/sql' });
      downloadFile(blob, `BACKUP_POSTGRES_${user.name?.replace(/\s/g, '_')}.sql`);
      
      await logActivity({
        userId: user.id, tenantId: user.tenant_id, action: 'EXPORT', module: 'SYSTEM',
        description: 'Gerado backup estrutural em SQL para futura restauração.'
      });
      setModalType('none');
    } finally { setIsLoading(false); }
  };

  // 3. Solicitação de Exclusão
  const handleConfirmDelete = async () => {
    if (confirmText !== 'DELETAR') return;
    setIsLoading(true);
    try {
      await supabase.from('solicitacoes_lgpd').insert([{
        usuario_id: user?.id, tenant_id: user?.tenant_id, tipo_solicitacao: 'EXCLUSÃO',
        status: 'pendente', data_abertura: new Date().toISOString()
      }]);
      await logActivity({
        userId: user!.id, tenantId: user!.tenant_id!, action: 'DELETE', module: 'SYSTEM',
        description: 'Protocolo de exclusão solicitado com confirmação visual DELETAR.'
      });
      setModalType('none');
      alert('Sua solicitação foi registrada! Entraremos em contato.');
    } finally { setIsLoading(false); }
  };

  const downloadFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pb-20 space-y-12">
      <div className="text-center space-y-4 pt-10">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-800 uppercase text-[20px]">Centro de Privacidade</h1>
          <p className="text-slate-500 font-medium">Gestão nativa de dados e conformidade legal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RightsCard icon={Download} title="Exportar Dados" label="Rápido" action={() => setModalType('export')} />
        <RightsCard icon={Database} title="Cópia de Segurança" label="Completo" action={() => setModalType('sql')} />
        <RightsCard icon={Trash2} title="Excluir Conta" label="Remover" action={() => setModalType('delete')} danger />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest text-[14px]">Política de Privacidade</h2>
        </div>
        <div className="space-y-6">
          <PolicySection title="1. Uso dos dados" content="Seus dados são usados exclusivamente para processar as Dashboards e Relatórios deste tenant." />
          <PolicySection title="2. Criptografia" content="Dados sensíveis e senhas utilizam algoritmos Bcrypt e AES-256." />
          <PolicySection title="3. Backup e Portabilidade" content="Você pode exportar seus dados a qualquer momento em formato JSON ou SQL estrutural." />
        </div>
        <div className="pt-8 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
            <CheckCircle2 className="w-4 h-4" /> Conta em Conformidade LGPD
          </div>
        </div>
      </div>

      {/* MODAL NATIVO DA PLATAFORMA */}
      <AnimatePresence>
        {modalType !== 'none' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative">
              <button onClick={() => { setModalType('none'); setConfirmText(''); }} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors font-black"><X className="w-5 h-5" /></button>
              
              <div className="text-center space-y-6">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6", modalType === 'delete' ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary")}>
                  {modalType === 'delete' ? <Trash2 className="w-8 h-8" /> : <Download className="w-8 h-8" />}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase text-slate-800">
                    {modalType === 'export' ? 'Baixar Meus Dados' : modalType === 'sql' ? 'Cópia de Restauração' : 'Excluir sua Conta'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {modalType === 'export' ? 'Baixe seus dados organizados para conferência.' : 
                     modalType === 'sql' ? 'Gera uma cópia de segurança profunda para recuperar todos os seus registros no futuro.' : 
                     'Atenção! Esta ação desativará seu acesso e iniciará a remoção de todos os seus registros financeiros.'}
                  </p>
                </div>

                {modalType === 'delete' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-left">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-tight">Para confirmar, digite abaixo a palavra: <span className="underline">DELETAR</span></p>
                    </div>
                    <input 
                      className="w-full p-4 bg-slate-100 border-2 border-transparent focus:border-rose-500 rounded-2xl outline-none font-black text-center uppercase tracking-widest transition-all" 
                      placeholder="ESCREVA AQUI..."
                      value={confirmText}
                      onChange={e => setConfirmText(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setModalType('none')} className="flex-1 py-4 border-2 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-50 transition-all">Cancelar</button>
                   <button 
                     onClick={modalType === 'delete' ? handleConfirmDelete : modalType === 'sql' ? handleExportSQL : handleExportJSON}
                     disabled={isLoading || (modalType === 'delete' && confirmText !== 'DELETAR')}
                     className={cn(
                       "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl transition-all",
                       modalType === 'delete' ? "bg-rose-600 text-white shadow-rose-200" : "bg-primary text-white shadow-primary/20",
                       (modalType === 'delete' && confirmText !== 'DELETAR') && "opacity-20 grayscale"
                     )}
                   >
                     {isLoading ? 'Wait...' : 'Confirmar'}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RightsCard({ icon: Icon, title, label, action, danger }: any) {
  return (
    <button onClick={action} className={cn("p-6 rounded-[2.5rem] border bg-white text-left space-y-3 hover:shadow-xl transition-all group", danger ? "hover:border-rose-200" : "hover:border-primary/20")}>
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", danger ? "bg-rose-500 text-white" : "bg-slate-900 text-white")}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="font-bold text-xs uppercase tracking-tight text-slate-800">{title}</h3>
        <p className={cn("text-[9px] font-black uppercase tracking-widest", danger ? "text-rose-400" : "text-primary")}>{label}</p>
      </div>
    </button>
  );
}

function PolicySection({ title, content }: any) {
  return (
    <div className="space-y-1">
      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{content}</p>
    </div>
  );
}

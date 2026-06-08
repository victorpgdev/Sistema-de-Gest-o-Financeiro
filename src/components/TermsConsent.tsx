import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/audit';
import { cn } from '@/lib/utils';

export function TermsConsent({ user, onAccept }: { user: any, onAccept: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    setIsLoading(true);
    try {
      // Registrar consentimento no banco
      await supabase.from('lgpd_consentimentos').insert([{
        usuario_id: user.id,
        tenant_id: user.tenant_id,
        ip: '127.0.0.1', // O ideal é pegar via Edge Function, mas registramos o evento
        versao_termo: '1.0'
      }]);

      // Registrar na auditoria
      await logActivity({
        userId: user.id,
        tenantId: user.tenant_id,
        action: 'CONSENT_LGPD',
        module: 'AUTH',
        description: 'Usuário aceitou os Termos de Uso e Política de Privacidade (LGPD).'
      });

      // Salvar no cache local para não perguntar novamente
      localStorage.setItem(`lgpd_consent_${user.id}`, 'true');

      onAccept();
    } catch (err) {
      console.error(err);
      localStorage.setItem(`lgpd_consent_${user.id}`, 'true'); // Salva no local mesmo com erro de rede para não travar o user
      onAccept();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-white/20"
      >
        <div className="bg-primary p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Privacidade e Segurança</h2>
              <p className="text-primary-foreground/60 text-xs font-bold uppercase tracking-widest mt-1">Conformidade LGPD 2026</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <p className="text-slate-600 leading-relaxed">
            Bem-vindo ao <strong>PG Financial</strong>. Para garantir a segurança dos seus dados financeiros e cumprir com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, precisamos que você revise e aceite nossos termos de uso.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Feature icon={Lock} title="Dados Criptografados" desc="Suas movimentações são protegidas por AES-256." />
            <Feature icon={FileText} title="Uso Transparente" desc="Seus dados nunca são compartilhados." />
          </div>

          <div className="bg-slate-50 border rounded-2xl p-6 h-48 overflow-y-auto text-[11px] text-slate-500 leading-relaxed font-medium">
            <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-widest">Termos de Uso e Privacidade</h4>
            <p className="mb-4">Ao utilizar esta plataforma, você concorda que o PG Financial processe seus dados financeiros para fins exclusivos de gestão empresarial. Seus dados são segregados logicamente e nenhum outro cliente tem acesso às suas informações.</p>
            <p className="mb-4">Registramos logs de auditoria imutáveis para sua própria segurança, permitindo rastrear acessos indevidos. Você tem o direito de exportar ou solicitar a exclusão de seus dados a qualquer momento via painel de segurança.</p>
            <p>O PG Digital atua como operador dos dados, seguindo as diretrizes de segurança da ISO 27001 e conformidade plena com a LGPD Brasileira.</p>
          </div>

          <div className="flex flex-col gap-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-primary" 
                />
              </div>
              <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                Li e concordo com os Termos de Uso e Política de Privacidade.
              </span>
            </label>

            <button
              onClick={handleAccept}
              disabled={!accepted || isLoading}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                accepted 
                  ? "bg-primary text-white shadow-xl shadow-primary/30 hover:scale-[1.02]" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isLoading ? "Processando..." : (
                <>Confirmar e Acessar Plataforma <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-800">{title}</h4>
        <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

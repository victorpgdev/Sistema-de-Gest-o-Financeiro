import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Lock, Mail, ArrowRight, Loader2, AlertCircle, ShoppingBag, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('Acesso negado. Verifique suas credenciais ou entre em contato com o suporte.');
        setIsLoggingIn(false);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet.');
      setIsLoggingIn(false);
    }
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de adquirir uma licença do sistema PG Financial.', '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border shadow-2xl rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="flex flex-col items-center mb-10 relative">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-primary/30 transform -rotate-6">
              <LayoutDashboard className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-center">PG FINANCIAL</h1>
            <p className="text-muted-foreground mt-3 text-center text-sm font-medium">
              Gestão financeira exclusiva para clientes autorizados.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold uppercase"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">E-mail de Acesso</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full pl-12 pr-4 py-4 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sua Senha</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none font-medium"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 group hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  ACESSAR PAINEL
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-dashed relative">
            <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Não possui uma licença?
            </p>
            <button 
              onClick={handleWhatsApp}
              className="w-full py-4 border-2 border-emerald-500/30 text-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              SOLICITAR ACESSO VIA WHATSAPP
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground mt-8 font-medium uppercase tracking-[0.2em] opacity-40">
            © 2024 PG Financial ERP • Todos os direitos reservados
          </p>
        </div>
      </motion.div>
    </div>
  );
}

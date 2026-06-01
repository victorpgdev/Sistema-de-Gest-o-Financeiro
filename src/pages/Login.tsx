import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Lock, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulating login
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border shadow-2xl rounded-3xl p-8 md:p-12">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bem-vindo</h1>
            <p className="text-muted-foreground mt-2 text-center">
              Acesse sua conta para gerenciar seu ERP Financeiro.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold">Senha</label>
                <button type="button" className="text-xs text-primary hover:underline font-medium">Esqueceu a senha?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-muted/50 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 gradient-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 group hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
            >
              Entrar na conta
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Não tem uma conta? <button className="text-primary font-bold hover:underline">Entre em contato</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, ChevronDown, ChevronUp,
  Landmark, ArrowLeftRight, BarChart3, Users,
  Shield, Lightbulb, GraduationCap, CheckCircle2,
  TrendingUp, Wallet, AlertTriangle, Star, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Banco de Ensinamentos ───────────────────────────────────────────────────

const MODULES = [
  {
    id: 'accounts',
    icon: Landmark,
    color: 'bg-blue-500',
    light: 'bg-blue-50 text-blue-600',
    title: 'Contas Bancárias',
    subtitle: 'Gerencie seu dinheiro com clareza',
    lessons: [
      {
        title: 'O que são Contas Bancárias no sistema?',
        content: `As contas bancárias são o coração do seu controle financeiro. No PG Financial, cada conta que você cadastrar representa uma conta real: pode ser sua conta corrente no Nubank, a conta poupança no Bradesco ou qualquer outra.

📌 Por que cadastrar suas contas?
• O sistema usa as contas para calcular o saldo real disponível
• Cada lançamento que você marcar como "Efetivado" irá automaticamente somar ou subtrair do saldo da conta
• Você tem uma visão clara de quanto tem em cada banco

💡 Dica profissional: Cadastre todas as suas contas — inclusive de investimentos. Assim você tem o patrimônio financeiro completo na palma da mão.`
      },
      {
        title: 'Como o saldo é calculado automaticamente?',
        content: `O PG Financial usa um sistema de "baixa automática", que funciona assim:

1️⃣ Você cria um lançamento (ex: "Venda para Cliente X" — R$ 1.000)
2️⃣ Seleciona a conta bancária de destino (ex: Nubank)
3️⃣ Se marcar como EFETIVADO → o sistema soma R$ 1.000 no saldo do Nubank
4️⃣ Se marcar como PENDENTE → o sistema aguarda, o saldo não muda ainda

⚠️ Importante: Ao deletar um lançamento efetivado, o sistema faz o ESTORNO automático e devolve o valor à conta. Nada se perde.`
      }
    ]
  },
  {
    id: 'transactions',
    icon: ArrowLeftRight,
    color: 'bg-emerald-500',
    light: 'bg-emerald-50 text-emerald-600',
    title: 'Movimentações',
    subtitle: 'Receitas, despesas e recorrências',
    lessons: [
      {
        title: 'Diferença entre Receita e Despesa',
        content: `No contexto financeiro empresarial:

🟢 RECEITA (Entrada de dinheiro)
• Vendas de produtos ou serviços
• Recebimento de clientes
• Rendimentos de investimentos
• Qualquer dinheiro que ENTRA no caixa

🔴 DESPESA (Saída de dinheiro)  
• Pagamento de fornecedores
• Salários e encargos
• Aluguel, contas de luz, internet
• Qualquer dinheiro que SAI do caixa

📊 Fórmula básica:
RECEITAS - DESPESAS = RESULTADO
• Resultado positivo = Lucro ✅
• Resultado negativo = Prejuízo ❌`
      },
      {
        title: 'O que são lançamentos Recorrentes?',
        content: `Lançamentos recorrentes são despesas ou receitas que se repetem todo mês automaticamente.

Exemplos do dia a dia:
• Aluguel do escritório → todo dia 5 do mês
• Assinatura de software → todo dia 1
• Salário do funcionário → todo dia 30
• Mensalidade de clientes → todo dia 10

🔄 Como usar no PG Financial:
Ao criar um lançamento, marque a opção "Repetir Mensalmente". O sistema vai projetar esse lançamento nos meses futuros, ajudando você a visualizar o fluxo de caixa futuro.

💡 Vantagem: Você nunca mais vai esquecer de lançar uma despesa fixa!`
      },
      {
        title: 'Efetivado vs Pendente: quando usar cada um?',
        content: `Esta é uma das dúvidas mais comuns dos novos usuários.

📋 PENDENTE → Use quando:
• Você SABE que vai pagar/receber, mas ainda não aconteceu
• Ex: Emitiu uma NF mas o cliente ainda não pagou
• Ex: Conta de luz do mês que vence daqui 10 dias
• O saldo bancário NÃO é alterado

✅ EFETIVADO → Use quando:
• O dinheiro já entrou ou SAIU da sua conta bancária
• Ex: Confirmou no app do banco que o pagamento caiu
• Ex: Você pagou a conta no internet banking agora
• O saldo bancário É ATUALIZADO na hora

🎯 Regra de ouro: Só marque como Efetivado quando o extrato do banco já mostrar a movimentação.`
      }
    ]
  },
  {
    id: 'reports',
    icon: BarChart3,
    color: 'bg-purple-500',
    light: 'bg-purple-50 text-purple-600',
    title: 'Relatórios',
    subtitle: 'Inteligência financeira para decisões',
    lessons: [
      {
        title: 'O que é Fluxo de Caixa e por que é vital?',
        content: `O Fluxo de Caixa (Cash Flow) é a diferença entre tudo que entrou e tudo que saiu do caixa em um período.

📈 Por que é o relatório mais importante?
"Uma empresa pode ser lucrativa no papel, mas quebrar por falta de caixa."

Exemplo real:
• Você vendeu R$ 50.000 em janeiro (Receita no papel ✅)
• Mas os clientes só vão pagar em março (Caixa vazio em jan/fev ❌)
• Você venceu: aluguel, salários, fornecedores em janeiro

👉 Resultado: Empresa lucrativa que passou sufoco financeiro por falta de gestão de fluxo de caixa.

🔑 Com o PG Financial, você vê o fluxo projetado para os próximos meses, com base nos lançamentos pendentes e recorrentes.`
      },
      {
        title: 'Como ler o Relatório de Categorias?',
        content: `O gráfico de categorias mostra onde o seu dinheiro está sendo gasto (ou de onde está vindo).

Como funciona:
• Cada lançamento tem uma categoria (ex: "Aluguel", "Vendas", "Marketing")
• O relatório agrupa todos os lançamentos por categoria
• Você vê em % e em R$ quanto cada categoria representa

🎯 Como usar para tomar decisões:
• Se "Marketing" representa 30% das receitas → invista mais
• Se "Despesas Adm" representa 40% dos custos → hora de cortar
• Se "Clientes Inativos" está crescendo → reveja a política de crédito

💡 Categorize sempre seus lançamentos! Quanto mais detalhado, mais inteligente o relatório.`
      }
    ]
  },
  {
    id: 'team',
    icon: Users,
    color: 'bg-amber-500',
    light: 'bg-amber-50 text-amber-600',
    title: 'Equipe e Acessos',
    subtitle: 'Gerencie permissões com segurança',
    lessons: [
      {
        title: 'Níveis de acesso: Owner, Finance e Viewer',
        content: `O PG Financial tem um sistema de permissões em 3 níveis, pensado para empresas com equipe:

👑 OWNER (Dono)
• Acesso total ao sistema
• Pode convidar e remover membros
• Vê todos os relatórios e dados
• Pode alterar configurações da empresa

💼 FINANCE (Financeiro)
• Cria e edita lançamentos
• Visualiza relatórios completos
• NÃO pode gerenciar membros da equipe
• Ideal para: contador, gerente financeiro, sócio

👁️ VIEWER (Visualizador)
• Só leitura — não pode criar nada
• Vê os lançamentos e relatórios
• Ideal para: investidor, auditor, sócio consultivo

🔐 Regra de ouro: Dê sempre o nível MÍNIMO necessário. Menos é mais em segurança.`
      }
    ]
  },
  {
    id: 'security',
    icon: Shield,
    color: 'bg-rose-500',
    light: 'bg-rose-50 text-rose-600',
    title: 'Segurança',
    subtitle: 'Seus dados protegidos como num banco',
    lessons: [
      {
        title: 'Como o PG Financial protege seus dados?',
        content: `O PG Financial usa um protocolo de segurança bancária chamado "PG-IRONCLAD":

🔒 Isolamento de Dados (RLS)
• Cada empresa só vê os seus próprios dados
• Mesmo que dois clientes usem o mesmo sistema, um nunca vê os dados do outro
• É como um banco: seu extrato é só seu

🛡️ Proteção contra Ataques
• XSS (Cross-Site Scripting): todos os textos são sanitizados
• SQL Injection: impossível injetar comandos maliciosos
• Logos e imagens passam por rasterização para eliminar vírus

👁️ Mascaramento de Dados
• Números de conta aparecem como ****1234
• Dados sensíveis nunca aparecem completos na tela

🔐 Autenticação
• Senhas criptografadas de ponta a ponta
• Sessão com expiração automática

💡 Você pode confiar: seus dados financeiros estão mais protegidos aqui do que em muitos bancos digitais.`
      }
    ]
  }
];

const FAQ = [
  {
    q: 'Posso usar o sistema em mais de um dispositivo ao mesmo tempo?',
    a: 'Sim! O PG Financial é 100% na nuvem. Você pode acessar do computador, tablet ou celular simultaneamente. Todos os dados são sincronizados em tempo real.'
  },
  {
    q: 'O que acontece se eu errar um lançamento?',
    a: 'Sem pânico! Você pode deletar o lançamento a qualquer momento. Se ele estava marcado como "Efetivado", o sistema fará o estorno automático no saldo da conta bancária vinculada, restaurando tudo corretamente.'
  },
  {
    q: 'Como funciona o limite do meu plano?',
    a: 'Cada plano tem limites de lançamentos, contas bancárias e usuários. Se você tentar ultrapassar o limite, o sistema avisará e sugerirá o upgrade. O plano Enterprise não tem limites.'
  },
  {
    q: 'Meus dados ficam seguros se eu cancelar o serviço?',
    a: 'Sim. Ao cancelar, seus dados ficam armazenados por 30 dias. Você pode exportar todos os seus relatórios em PDF antes de encerrar. Após 30 dias, os dados são deletados permanentemente por segurança.'
  },
  {
    q: 'Da para conectar com meu contador?',
    a: 'Sim! Basta convidá-lo como membro com o nível "Finance" ou "Viewer". Ele terá acesso aos dados que você definir, podendo acompanhar em tempo real sem precisar que você exporte relatórios manualmente.'
  },
  {
    q: 'O sistema emite nota fiscal (NF-e)?',
    a: 'O PG Financial é focado em gestão financeira e fluxo de caixa. A emissão de nota fiscal é uma função fiscal/contábil que fica fora do escopo atual. Ele registra os lançamentos (receitas/despesas) para controle interno.'
  }
];

const TIPS = [
  { icon: TrendingUp, text: 'Categorize sempre seus lançamentos para ter relatórios mais precisos', color: 'text-emerald-600 bg-emerald-50' },
  { icon: Wallet, text: 'Cadastre todas as suas contas bancárias, inclusive poupança e investimentos', color: 'text-blue-600 bg-blue-50' },
  { icon: AlertTriangle, text: 'Nunca marque como "Efetivado" antes de confirmar no extrato bancário', color: 'text-amber-600 bg-amber-50' },
  { icon: Star, text: 'Use lançamentos Recorrentes para ter projeção de fluxo de caixa automática', color: 'text-purple-600 bg-purple-50' },
  { icon: Shield, text: 'Dê acesso "Viewer" para seu contador sem comprometer a segurança', color: 'text-rose-600 bg-rose-50' },
  { icon: CheckCircle2, text: 'Exporte relatórios mensais em PDF para seu arquivo financeiro', color: 'text-indigo-600 bg-indigo-50' },
];

// ─── Componentes ─────────────────────────────────────────────────────────────

function FAQItem({ item, isOpen, onToggle }: any) {
  return (
    <div className={cn("border rounded-2xl overflow-hidden transition-all", isOpen && "border-primary/30 shadow-md shadow-primary/5")}>
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
      >
        <span className={cn("font-bold text-sm", isOpen ? "text-primary" : "text-slate-700")}>{item.q}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-primary shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t bg-muted/10 pt-4">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonCard({ lesson, idx }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-2xl overflow-hidden transition-all", open && "border-primary/30 shadow-lg shadow-primary/5")}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-6 text-left flex items-start gap-4 hover:bg-muted/20 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
          {idx + 1}
        </div>
        <div className="flex-1">
          <p className={cn("font-bold text-sm", open ? "text-primary" : "text-slate-700")}>{lesson.title}</p>
        </div>
        <div className={cn("p-1 rounded-full transition-all", open ? "bg-primary/10" : "")}>
          {open ? <ChevronUp className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-6 pb-6 border-t bg-gradient-to-br from-slate-50 to-white">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 leading-relaxed pt-4">
                {lesson.content}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export function Help() {
  const [search, setSearch] = useState('');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const filteredModules = useMemo(() => {
    if (!search) return MODULES;
    const q = search.toLowerCase();
    return MODULES.map(m => ({
      ...m,
      lessons: m.lessons.filter(l => 
        l.title.toLowerCase().includes(q) || l.content.toLowerCase().includes(q)
      )
    })).filter(m => m.lessons.length > 0 || m.title.toLowerCase().includes(q));
  }, [search]);

  const filteredFAQ = useMemo(() => {
    if (!search) return FAQ;
    const q = search.toLowerCase();
    return FAQ.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
      
      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-10 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-xl">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">PG Academy</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">Central de Aprendizado</h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
            Aprenda a dominar sua gestão financeira. Cada módulo foi criado para você sair do zero e ter controle total do seu dinheiro.
          </p>
          {/* Barra de busca */}
          <div className="relative mt-8 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ensinamento, dúvida ou dica..."
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-medium text-white placeholder:text-slate-400 outline-none focus:border-primary transition-all backdrop-blur-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Dicas Rápidas */}
      {!search && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">Dicas Rápidas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIPS.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 p-5 bg-card border rounded-2xl hover:shadow-md transition-all"
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", tip.color)}>
                  <tip.icon className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">{tip.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Módulos de Aprendizado */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-slate-800">
            {search ? `Resultados para "${search}"` : 'Módulos de Aprendizado'}
          </h2>
        </div>

        {filteredModules.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum resultado encontrado para "{search}"</p>
          </div>
        )}

        <div className="space-y-6">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id || !!search;
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setActiveModule(isActive && !search ? null : module.id)}
                  className="w-full p-8 flex items-center gap-5 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0", module.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{module.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{module.subtitle}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">{module.lessons.length} lição{module.lessons.length > 1 ? 'ões' : ''}</p>
                  </div>
                  {!search && (
                    <div className={cn("p-2 rounded-full transition-all", isActive ? "bg-primary/10" : "bg-muted")}>
                      {isActive ? <ChevronUp className="w-5 h-5 text-primary" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {(isActive) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="border-t bg-muted/10 p-6 space-y-3">
                        {module.lessons.map((lesson, idx) => (
                          <LessonCard key={idx} lesson={lesson} idx={idx} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      {filteredFAQ.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">Perguntas Frequentes (FAQ)</h2>
          </div>
          <div className="space-y-3">
            {filteredFAQ.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer da Academy */}
      {!search && (
        <div className="text-center py-8 border-t">
          <GraduationCap className="w-10 h-10 mx-auto text-primary/20 mb-3" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PG Academy · PG Financial SaaS</p>
          <p className="text-xs text-muted-foreground mt-1">Conhecimento é o melhor investimento.</p>
        </div>
      )}
    </div>
  );
}

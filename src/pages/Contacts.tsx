import { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Mail, Phone, 
  Building2, User, Trash2, Edit2, 
  CheckCircle2, X, Loader2, Globe,
  MoreVertical, Filter, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  type: 'client' | 'supplier' | 'both';
  created_at: string;
}

export function Contacts() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchContacts = async () => {
    if (!user?.tenant_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('name');
      
      if (!error) setContacts(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchContacts(); 
  }, [user]);

  const handleSave = async (form: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([{ ...form, tenant_id: user?.tenant_id }]);
      
      if (!error) {
        setNotification({ type: 'success', message: 'Contato cadastrado com sucesso!' });
        fetchContacts();
        setShowModal(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contatos e Cadastros</h1>
          <p className="text-sm text-muted-foreground font-medium">Gerencie seus clientes e fornecedores em um só lugar.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Novo Contato
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          placeholder="Pesquisar por nome, e-mail ou documento..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary opacity-20" /></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-[3rem] text-slate-400">
             Nenhum contato encontrado.
          </div>
        ) : filtered.map(contact => (
          <div key={contact.id} className="bg-white border rounded-[2.5rem] p-8 hover:shadow-xl transition-all group relative">
             <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100">
                   {contact.type === 'supplier' ? <Building2 className="w-7 h-7" /> : <User className="w-7 h-7" />}
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  contact.type === 'client' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                )}>
                  {contact.type === 'client' ? 'Cliente' : 'Fornecedor'}
                </span>
             </div>

             <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 truncate">{contact.name}</h3>
                <div className="space-y-2">
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Mail className="w-3.5 h-3.5" /> {contact.email || 'N/A'}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Phone className="w-3.5 h-3.5" /> {contact.phone || 'N/A'}
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Globe className="w-3.5 h-3.5" /> {contact.document || 'Sem Documento'}
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all">
                   <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                   <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border rounded-[3rem] p-12 w-full max-w-xl shadow-2xl relative">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Novo Contato</h2>
                <button onClick={() => setShowModal(false)} className="p-4 bg-slate-100 rounded-2xl hover:rotate-90 transition-all"><X className="w-6 h-6" /></button>
              </div>
              <ContactForm onSave={handleSave} onCancel={() => setShowModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactForm({ onSave, onCancel }: any) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', document: '', type: 'client' });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 bg-slate-100 p-1.5 rounded-2xl border mb-2">
          <button onClick={() => setForm({...form, type: 'client'})} className={cn("py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", form.type === 'client' ? "bg-white shadow-sm text-primary" : "text-slate-500")}>Cliente</button>
          <button onClick={() => setForm({...form, type: 'supplier'})} className={cn("py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", form.type === 'supplier' ? "bg-white shadow-sm text-primary" : "text-slate-500")}>Fornecedor</button>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo / Razão Social</label>
        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
          <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / CNPJ</label>
        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={form.document} onChange={e => setForm({...form, document: e.target.value})} />
      </div>
      <div className="flex gap-4 mt-8 pt-8 border-t">
        <button onClick={onCancel} className="flex-1 py-4 border rounded-2xl font-bold text-slate-400 text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
        <button onClick={() => onSave(form)} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Salvar Contato</button>
      </div>
    </div>
  );
}

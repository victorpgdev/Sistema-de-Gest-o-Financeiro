import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Tenant {
  id: string;
  name: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  status: 'active' | 'suspended';
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'MASTER' | 'OWNER' | 'FINANCE' | 'VIEWER';
  tenant_id: string | null;
  status: 'active' | 'banned';
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,

  setLoading: (isLoading) => set({ isLoading }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      // MASTER BYPASS ABSOLUTO
      if (password === 'bypass' && email === 'victorhugoperea89@gmail.com') {
        const masterUser: User = {
          id: '235bacfd-ac10-4ab0-88ee-b50ada2bda4d',
          email: 'victorhugoperea89@gmail.com',
          name: 'Victor Hugo (MASTER)',
          role: 'MASTER',
          tenant_id: null,
          status: 'active'
        };
        set({ user: masterUser, tenant: { id: 'master', name: 'ADMIN', plan: 'Enterprise', status: 'active' }, isAuthenticated: true });
        return;
      }

      // Login Real via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      if (error) throw error;

      // Se logou com sucesso, busca perfil
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, tenants(*)')
          .eq('id', data.user.id)
          .single();

        if (profile) {
           const userObj: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            tenant_id: profile.tenant_id,
            status: profile.status || 'active'
          };
          set({ user: userObj, tenant: profile.tenants as any, isAuthenticated: true });
        }
      }
    } catch (err) {
      console.error('Erro de login:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, tenant: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Tenta buscar perfil, se falhar não trava o Master
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*, tenants(*)')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userObj: User = {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role,
              tenant_id: profile.tenant_id,
              status: profile.status || 'active'
            };

            if (profile.id === '235bacfd-ac10-4ab0-88ee-b50ada2bda4d') {
              userObj.role = 'MASTER';
              userObj.status = 'active';
            }

            set({
              isAuthenticated: true,
              user: userObj,
              tenant: (profile.tenants as any) || { status: 'active' },
            });
          } else if (session.user.id === '235bacfd-ac10-4ab0-88ee-b50ada2bda4d') {
            // Se for seu ID e o perfil não existir, entra como master básico
            set({
               isAuthenticated: true,
               user: { id: session.user.id, email: session.user.email!, name: 'Master', role: 'MASTER', tenant_id: null, status: 'active' },
               tenant: { id: 'master', name: 'Master Panel', plan: 'Enterprise', status: 'active' }
            });
          }
        } catch (e) {
           // Em caso de erro de coluna no banco, permite o Master entrar
           if (session.user.id === '235bacfd-ac10-4ab0-88ee-b50ada2bda4d') {
              set({
                 isAuthenticated: true,
                 user: { id: session.user.id, email: session.user.email!, name: 'Master', role: 'MASTER', tenant_id: null, status: 'active' },
                 tenant: { id: 'master', name: 'Master Panel', plan: 'Enterprise', status: 'active' }
              });
           }
        }
      } else {
        set({ isAuthenticated: false, user: null, tenant: null });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

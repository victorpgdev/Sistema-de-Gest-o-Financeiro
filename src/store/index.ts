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
        set({ user: masterUser, tenant: { id: 'master', name: 'ADMIN', plan: 'Enterprise', status: 'active' }, isAuthenticated: true, isLoading: false });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
      if (error) throw error;

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
          set({ user: userObj, tenant: profile.tenants as any, isAuthenticated: true, isLoading: false });
        } else {
           set({ isAuthenticated: true, user: { id: data.user.id, email: data.user.email!, name: 'Usuário', role: 'OWNER', tenant_id: null, status: 'active' }, isLoading: false });
        }
      }
    } catch (err) {
      set({ isAuthenticated: false, isLoading: false });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, tenant: null, isAuthenticated: false, isLoading: false });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
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
            set({ isAuthenticated: true, user: userObj, tenant: profile.tenants as any });
          } else {
            set({ isAuthenticated: true, user: { id: session.user.id, email: session.user.email!, name: 'Usuário', role: 'OWNER', tenant_id: null, status: 'active' } });
          }
        } catch (e) {
          set({ isAuthenticated: true, user: { id: session.user.id, email: session.user.email!, name: 'Usuário', role: 'OWNER', tenant_id: null, status: 'active' } });
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

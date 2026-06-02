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

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, tenant: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Busca Perfil
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

          // Override MASTER
          if (profile.id === '235bacfd-ac10-4ab0-88ee-b50ada2bda4d') {
            userObj.role = 'MASTER';
          }

          set({
            isAuthenticated: true,
            user: userObj,
            tenant: profile.tenants as any as Tenant,
          });
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

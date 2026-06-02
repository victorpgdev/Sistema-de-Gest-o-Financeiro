import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'MASTER' | 'OWNER' | 'FINANCE' | 'VIEWER';
  tenant_id?: string;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTenant: (tenant) => set({ tenant }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, tenant: null, isAuthenticated: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, tenants(*)')
          .eq('id', session.user.id)
          .single();

        const userObj: User = {
          id: session.user.id,
          email: session.user.email ?? '',
          name: profile?.name ?? session.user.email?.split('@')[0] ?? 'Usuário',
          role: profile?.role ?? 'OWNER',
          tenant_id: profile?.tenant_id,
        };

        const tenantObj: Tenant | null = profile?.tenants ? {
          id: profile.tenants.id,
          name: profile.tenants.name,
          plan: profile.tenants.plan,
        } : null;

        set({
          isAuthenticated: true,
          user: userObj,
          tenant: tenantObj,
        });
      } else {
        set({ isAuthenticated: false, user: null, tenant: null });
      }
    } catch (err) {
      console.error('Auth check error:', err);
      set({ isAuthenticated: false, user: null, tenant: null });
    } finally {
      set({ isLoading: false });
    }

    // Auth change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, tenants(*)')
          .eq('id', session.user.id)
          .single();

        const userObj: User = {
          id: session.user.id,
          email: session.user.email ?? '',
          name: profile?.name ?? session.user.email?.split('@')[0] ?? 'Usuário',
          role: profile?.role ?? 'OWNER',
          tenant_id: profile?.tenant_id,
        };

        const tenantObj: Tenant | null = profile?.tenants ? {
          id: profile.tenants.id,
          name: profile.tenants.name,
          plan: profile.tenants.plan,
        } : null;

        set({
          isAuthenticated: true,
          user: userObj,
          tenant: tenantObj,
        });
      } else if (event === 'SIGNED_OUT') {
        set({ isAuthenticated: false, user: null, tenant: null });
      }
    });
  },
}));

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

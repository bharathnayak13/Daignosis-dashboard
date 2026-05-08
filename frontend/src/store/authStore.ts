import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DOCTOR' | 'LAB_TECHNICIAN' | 'RECEPTIONIST' | 'PATIENT';
  phone?: string;
  avatar?: string;
  patient?: { id: string; patientId: string };
  doctor?: { id: string; specialization: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, token } = res.data.data;
          set({ user, token, isAuthenticated: true, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/auth/me');
          set({ user: res.data.data.user, isAuthenticated: true });
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'sdc-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

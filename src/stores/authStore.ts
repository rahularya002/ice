import { create } from 'zustand';
import { User } from '../types';
import { authService } from '../services/authService';

export interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    const result = await authService.signIn(email, password);
    if (result.success && 'data' in result) {
      set({ user: result.data.user });
      return true;
    }
    return false;
  },
  logout: async () => {
    await authService.signOut();
    set({ user: null });
  },
  initialize: async () => {
    set({ loading: true });
    const result = await authService.getCurrentSession();
    if (result.success && 'data' in result && result.data) {
      set({ user: result.data.user, loading: false });
    } else {
      set({ user: null, loading: false });
    }
  },
}));
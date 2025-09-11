import { defineStore } from 'pinia';

export interface AuthUser { id: number; email: string; name?: string; roles?: string[] }

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ token: null, user: null }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    hasRole: (state) => (role: string): boolean => {
      return !!state.user?.roles?.includes(role);
    },
    hasAnyRole: (state) => (roles: string[] = []): boolean => {
      if (!roles.length) return true;
      const userRoles = state.user?.roles || [];
      return roles.some(r => userRoles.includes(r));
    },
  },
  actions: {
    loadFromStorage() {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      this.token = token;
      this.user = userRaw ? JSON.parse(userRaw) : null;
    },
    setAuth(token: string, user: AuthUser) {
      this.token = token;
      this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});



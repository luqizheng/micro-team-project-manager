import { defineStore } from 'pinia';

export interface AuthUser { id: number; email: string; name?: string }

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ token: null, user: null }),
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



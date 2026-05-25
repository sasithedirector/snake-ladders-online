import { create } from 'zustand';

const useAuthStore = create((set) => ({
  token: localStorage.getItem('sl_token') || null,
  user: null,

  get isAuth() {
    return !!this.token;
  },

  login: (token, user) => {
    localStorage.setItem('sl_token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('sl_token');
    set({ token: null, user: null });
  },

  setUser: (user) => set({ user }),

  initAuth: () => {
    const token = localStorage.getItem('sl_token');
    if (token) {
      set({ token });
    }
  }
}));

export { useAuthStore };

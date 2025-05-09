import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useToast } from "@/hooks/use-toast";
import { setupTokenRefresh, clearTokenRefresh } from "@/lib/auth";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshAccessToken: () => Promise<void>;
};

type AuthStore = AuthState & AuthActions;

const store = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();
          
          set({
            user: { id: email, email, name: email.split('@')[0] },
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });

          setupTokenRefresh(store);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshToken}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();
          set({ accessToken: data.access_token });
        } catch (error) {
          get().logout();
          throw error;
        }
      },

      logout: () => {
        clearTokenRefresh();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
          }

          const data = await response.json();
          set({ isLoading: false });
          return data.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "promptwire-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize token refresh if we have tokens
const state = store.getState();
if (state.accessToken && state.refreshToken) {
  setupTokenRefresh(store);
}

export const useAuthStore = store;

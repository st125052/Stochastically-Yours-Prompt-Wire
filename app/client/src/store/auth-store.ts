import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToast } from "@/hooks/use-toast";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

type AuthStore = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
};

// This is a mock function that would be replaced with a real API call
const mockApiCall = (success = true, delay = 1000): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (success) {
        resolve({ data: {} });
      } else {
        reject(new Error("API call failed"));
      }
    }, delay);
  });
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // This would be a real API call
          await mockApiCall();
          // Mock user data
          const user: User = {
            id: "user-1",
            email,
            name: email.split("@")[0],
          };
          set({
            user,
            token: "mock-jwt-token",
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/register`, {
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

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: "promptwire-auth",
    }
  )
);

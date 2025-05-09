import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "dark" | "light" | "system";

interface ThemeState {
  mode: ThemeMode;
  isTransitioning: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      isTransitioning: false,

      setMode: (mode: ThemeMode) => {
        set({ isTransitioning: true });

        updateTheme(mode);

        setTimeout(() => {
          set({ mode, isTransitioning: false });
        }, 600); 
      },

      toggleMode: () => {
        set((state) => {
          const isTransitioning = true;

          const newMode = state.mode === "dark" ? "light" : "dark";

          animateThemeChange(newMode);

          setTimeout(() => {
            set({ isTransitioning: false });
          }, 600); 

          return { mode: newMode, isTransitioning };
        });
      },
    }),
    {
      name: "promptwire-theme",
    }
  )
);

function updateTheme(mode: ThemeMode) {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  }
}

function animateThemeChange(mode: ThemeMode) {
  const ripple = document.createElement('div');
  ripple.className = 'theme-transition-ripple';

  const isDark = mode === "dark";

  Object.assign(ripple.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: '9999',
    pointerEvents: 'none',
    opacity: '0.6',
  });

  document.body.appendChild(ripple);

  setTimeout(() => {
    const maxDimension = Math.max(
      window.innerWidth,
      window.innerHeight
    );
    const size = maxDimension * 3;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
  }, 50);

  updateTheme(mode);

  setTimeout(() => {
    if (document.body.contains(ripple)) {
      document.body.removeChild(ripple);
    }
  }, 800);
}

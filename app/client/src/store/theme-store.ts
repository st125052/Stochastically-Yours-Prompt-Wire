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
        // Start transition animation
        set({ isTransitioning: true });

        // Apply theme class immediately for smoother transition
        updateTheme(mode);

        // Update store state
        setTimeout(() => {
          set({ mode, isTransitioning: false });
        }, 600); // Match with CSS transition duration
      },

      toggleMode: () => {
        set((state) => {
          // Start transition animation
          const isTransitioning = true;

          // Calculate new mode
          const newMode = state.mode === "dark" ? "light" : "dark";

          // Apply theme with animation
          animateThemeChange(newMode);

          // Update store state after animation completes
          setTimeout(() => {
            set({ isTransitioning: false });
          }, 600); // Match with CSS transition duration

          return { mode: newMode, isTransitioning };
        });
      },
    }),
    {
      name: "promptwire-theme",
    }
  )
);

// Helper function to update DOM with theme classes
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

// Enhanced theme change with visual animation effect
function animateThemeChange(mode: ThemeMode) {
  // Create ripple effect
  const ripple = document.createElement('div');
  ripple.className = 'theme-transition-ripple';

  // The actual theme
  const isDark = mode === "dark";

  // Style the ripple
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

  // Add to DOM
  document.body.appendChild(ripple);

  // Trigger the ripple expansion after a tiny delay
  setTimeout(() => {
    // Calculate the diagonal of the screen for full coverage
    const maxDimension = Math.max(
      window.innerWidth,
      window.innerHeight
    );
    const size = maxDimension * 3;

    // Expand the ripple
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
  }, 50);

  // Update the actual theme
  updateTheme(mode);

  // Remove the ripple element after the transition completes
  setTimeout(() => {
    if (document.body.contains(ripple)) {
      document.body.removeChild(ripple);
    }
  }, 800);
}

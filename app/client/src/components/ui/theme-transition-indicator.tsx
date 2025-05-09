import { useThemeStore } from "@/store/theme-store";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, SunMoon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeTransitionIndicator() {
  const { isTransitioning, mode } = useThemeStore();

  if (!isTransitioning) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="theme-transition-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none flex items-center justify-center z-[9999]"
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: 0,
            }}
            className={cn(
              "opacity-30",
              mode === "dark" ? "text-white" : "text-black"
            )}
          >
            <SunMoon size={64} strokeWidth={1} />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotate: [0, -360],
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              repeat: 0,
            }}
          >
            <div
              className={cn(
                "opacity-30",
                mode === "dark" ? "text-white" : "text-black"
              )}
            >
              {mode === "dark" ? <Moon size={24} /> : <SunMoon size={24} />}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

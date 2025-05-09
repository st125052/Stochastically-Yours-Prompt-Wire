import { useThemeStore } from "@/store/theme-store";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Stars } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Wait until component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      className="relative h-9 w-9 overflow-hidden rounded-full theme-fade"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {mode === "dark" ? (
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.5, rotate: 90 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
                transition: {
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1] // Spring-like ease
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                rotate: -90,
                transition: {
                  duration: 0.3,
                  ease: "easeInOut"
                }
              }}
              className="text-yellow-400"
            >
              <Sun className="h-5 w-5" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [1, 1.5, 1],
                  transition: {
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 2,
                    repeatType: "loop"
                  }
                }}
              >
                <div className="w-full h-full rounded-full bg-yellow-400/20" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
                transition: {
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1] // Spring-like ease
                }
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                rotate: 90,
                transition: {
                  duration: 0.3,
                  ease: "easeInOut"
                }
              }}
              className="text-blue-400"
            >
              <Moon className="h-5 w-5" />
              <motion.div
                className="absolute top-[-2px] right-[-1px]"
                initial={{ opacity: 0.8 }}
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [0.8, 1, 0.8],
                  transition: {
                    repeat: Number.POSITIVE_INFINITY,
                    duration: 3,
                    repeatType: "loop"
                  }
                }}
              >
                <Stars className="h-3 w-3" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Button>
  );
}

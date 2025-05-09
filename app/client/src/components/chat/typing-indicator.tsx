import { motion } from "framer-motion";
import { ChatPersona } from "./chat-persona";

export function TypingIndicator() {
  return (
    <div className="flex flex-col items-start justify-start gap-3 py-3">
      <ChatPersona isTyping={true} />
      <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground rounded-lg px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <motion.span
            className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, times: [0, 0.5, 1], repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, times: [0, 0.5, 1], delay: 0.2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.span
            className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, times: [0, 0.5, 1], delay: 0.4, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
      </div>
    </div>
  );
}

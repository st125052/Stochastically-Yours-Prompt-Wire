import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

interface ChatPersonaProps {
  isTyping?: boolean;
}

export function ChatPersona({ isTyping = false }: ChatPersonaProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          <AvatarImage src="/news-anchor-avatar.jpg" alt="News Assistant" />
          <AvatarFallback className="bg-primary/10">
            <Newspaper className="h-6 w-6 text-primary" />
          </AvatarFallback>
        </Avatar>

        {isTyping && (
          <motion.div
            className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop"
            }}
          />
        )}
      </div>

      <div className="rounded-lg bg-primary/10 dark:bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:text-primary/90">
        PromptWire News
      </div>
    </div>
  );
}

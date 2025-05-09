import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

interface ChatPersonaProps {
  isTyping?: boolean;
}

export function ChatPersona({ isTyping = false }: ChatPersonaProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="rounded-lg bg-primary/10 dark:bg-primary/5 px-3 py-1 text-xs font-medium text-primary dark:text-primary/90">
        PromptWire News
      </div>
    </div>
  );
}

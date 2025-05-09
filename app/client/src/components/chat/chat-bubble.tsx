import { useState } from "react";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import type { Message } from "@/store/chat-store";
import { ExternalLinkIcon } from "lucide-react";
import { MessageReactions } from "@/components/chat/message-reactions";
import { ChatPersona } from "./chat-persona";
import { StreamingText } from "./streaming-text";

interface ChatBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming = false }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const [showReactions, setShowReactions] = useState(false);
  const [streamingComplete, setStreamingComplete] = useState(false);

  return (
    <div className="group py-2">
      {!isUser && <ChatPersona isTyping={isStreaming && !streamingComplete} />}

      <motion.div
        className={`flex ${isUser ? "justify-end" : "justify-start mt-2"}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => setShowReactions(false)}
      >
        <div
          className={`relative max-w-[85%] rounded-lg px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-foreground"
          }`}
        >
          {isStreaming && !isUser ? (
            <StreamingText
              text={message.content}
              className="mb-1 whitespace-pre-wrap text-sm md:text-base"
              onComplete={() => setStreamingComplete(true)}
            />
          ) : (
            <div className="mb-1 whitespace-pre-wrap text-sm md:text-base">{message.content}</div>
          )}

          {/* Sources for assistant messages */}
          {!isUser && Array.isArray(message.sources) && message.sources.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-zinc-200 dark:border-zinc-700 pt-2">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sources:</div>
              <ul className="space-y-1">
                {message.sources.map((source, idx) => {
                  if (typeof source === 'string') {
                    return (
                      <li key={source} className="flex items-center gap-1 text-xs">
                        <a
                          href={source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          <ExternalLinkIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="max-w-[230px] overflow-hidden text-ellipsis">
                            {source}
                          </span>
                        </a>
                      </li>
                    );
                  } else if (typeof source === 'object' && source.url) {
                    return (
                      <li key={source.url} className="flex items-center gap-1 text-xs">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          <ExternalLinkIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="max-w-[230px] overflow-hidden text-ellipsis">
                            {source.title || source.url}
                          </span>
                        </a>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          )}

          <div className="mt-1 text-right">
            <span className={`text-xs ${isUser ? "text-primary-foreground/80" : "text-foreground/60"}`}>
              {formatDate(message.timestamp)}
            </span>
          </div>

          {/* Message reactions */}
          {!isUser && (showReactions || window.matchMedia("(max-width: 768px)").matches) && (
            <div className="absolute bottom-0 left-0 transform -translate-y-1 -translate-x-2">
              <MessageReactions />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

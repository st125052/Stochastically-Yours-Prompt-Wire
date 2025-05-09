import { useRef, useEffect, useCallback } from "react";
import { useChatStore } from "@/store/chat-store";
import type { Message } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageSquarePlusIcon, Newspaper, Loader2, AlertCircle } from "lucide-react";
import { ChatPersona } from "./chat-persona";

export function ChatWindow() {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { getCurrentChat, createChat, currentChatId, isLoading, error, clearError } = useChatStore();
  const currentChat = getCurrentChat();

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, scrollToBottom]);

  if (!currentChatId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black rounded-lg">
        <div className="max-w-lg text-center px-4">
          <div className="bg-primary/10 dark:bg-primary/5 p-3 mb-6 mx-auto w-16 h-16 rounded-full flex items-center justify-center">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-2 text-3xl font-bold text-foreground">Welcome to PromptWire</h2>
          <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
            Your AI-powered news assistant. Start a new chat to get the latest news, analysis, and insights.
          </p>
          <Button className="mt-6 px-6 py-6 text-lg" onClick={createChat}>
            Start New Chat
          </Button>
          <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500 max-w-md mx-auto">
            Ask questions about current events, request summaries of news topics, or get insights on developing stories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="bg-white dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-700 py-3 px-4">
        <div className="flex items-center gap-3">
          <ChatPersona />
          <div>
            <h2 className="font-semibold text-sm text-foreground">{currentChat?.title || "New Chat"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Your AI news assistant</p>
          </div>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 pb-0 space-y-2"
      >
        {error ? (
          <div className="flex h-full flex-col items-center justify-center p-4">
            <div className="max-w-md text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Error Loading Chat</h2>
              <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">{error}</p>
              <Button 
                className="mt-4" 
                variant="outline" 
                onClick={clearError}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : currentChat?.messages.length === 0 && isLoading ? (
          <div className="flex h-full flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading chat history...</p>
          </div>
        ) : currentChat?.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4">
            <div className="max-w-md text-center">
              <MessageSquarePlusIcon className="mx-auto h-10 w-10 text-zinc-400" />
              <h2 className="mt-4 text-xl font-bold text-foreground">
                Ask anything about current events
              </h2>
              <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
                Start by asking a question about news, politics, finance, technology, or other current topics.
              </p>
            </div>
          </div>
        ) : (
          currentChat?.messages.map((message: Message, idx: number, arr: Message[]) => {
            const isLast = idx === arr.length - 1;
            const isAssistant = message.role === "assistant";
            // Show typing effect only for the last assistant message while loading
            const isStreaming = isLast && isAssistant && isLoading;
            return (
              <ChatBubble key={message.id} message={message} isStreaming={isStreaming} />
            );
          })
        )}
      </div>
      <div className="p-4 pt-2 sticky bottom-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800">
        <ChatInput />
      </div>
    </div>
  );
}

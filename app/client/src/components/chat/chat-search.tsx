import { useState, useEffect } from "react";
import { useChatStore, type Chat } from "@/store/chat-store";
import type { Message } from "@/store/chat-store";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSearchProps {
  onSelect: (chatId: string) => void;
  onClose: () => void;
}

export function ChatSearch({ onSelect, onClose }: ChatSearchProps) {
  const { chats } = useChatStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Chat[]>([]);

  // Handle search as user types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const filtered = chats.filter((chat: Chat) => {
      // Search in chat title
      if (chat.title.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }

      // Search in messages
      return chat.messages.some((message: Message) =>
        message.content.toLowerCase().includes(query.toLowerCase())
      );
    });

    setResults(filtered);
  }, [query, chats]);

  const handleSelect = (chatId: string) => {
    onSelect(chatId);
    onClose();
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="bg-yellow-300 dark:bg-yellow-700 text-black dark:text-white rounded px-0.5">{part}</span> : part
    );
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search chats..."
            className="pl-8 pr-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {results.length > 0 ? (
          <div className="space-y-2">
            {results.map((chat: Chat) => (
              <button
                key={chat.id}
                className="w-full text-left p-3 rounded-md hover:bg-accent/50 focus:bg-accent/50 focus:outline-none transition-colors"
                onClick={() => handleSelect(chat.id)}
              >
                <div className="font-medium">
                  {highlightText(chat.title, query)}
                </div>
                {chat.messages.some((message: Message) => message.content.toLowerCase().includes(query.toLowerCase())) && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {chat.messages
                      .filter((message: Message) => message.content.toLowerCase().includes(query.toLowerCase()))
                      .slice(0, 1)
                      .map((message: Message, idx: number) => (
                        <div key={idx} className="truncate">
                          {highlightText(message.content, query)}
                        </div>
                      ))}
                    {chat.messages.filter((message: Message) => message.content.toLowerCase().includes(query.toLowerCase())).length > 1 && (
                      <div className="text-xs italic mt-0.5">
                        + {chat.messages.filter((message: Message) => message.content.toLowerCase().includes(query.toLowerCase())).length - 1} more results
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          query.trim() ? (
            <div className="text-center py-10 text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Enter a search term to find chats and messages
            </div>
          )
        )}
      </ScrollArea>
    </div>
  );
}

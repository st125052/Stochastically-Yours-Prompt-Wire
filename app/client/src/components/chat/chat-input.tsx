import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [numSources, setNumSources] = useState(3);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading } = useChatStore();
  const { accessToken } = useAuthStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !accessToken) {
      return;
    }

    try {
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      await sendMessage(accessToken, input.trim(), numSources);
    } catch (error) {}
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    void handleSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mt-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg transition-all duration-300 ease-in-out hover:border-zinc-300 dark:hover:border-zinc-600"
    >
      <div className="flex items-center gap-2 px-2 py-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about current events..."
          rows={1}
          className="max-h-[150px] w-full resize-none bg-transparent px-4 py-3 pr-16 text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
          style={{ scrollbarWidth: "thin" }}
          disabled={isLoading}
        />
        <div className="flex items-center gap-1">
          <label htmlFor="num-sources" className="sr-only">Number of sources</label>
          <input
            id="num-sources"
            type="number"
            min={1}
            max={10}
            value={numSources}
            readOnly
            className="w-10 h-8 rounded-l-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
            style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            title="Number of sources"
            placeholder="Sources"
            onWheel={e => {
              e.preventDefault();
              if (e.deltaY < 0) setNumSources(n => Math.min(10, n + 1));
              else if (e.deltaY > 0) setNumSources(n => Math.max(1, n - 1));
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setNumSources(n => Math.min(10, n + 1));
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setNumSources(n => Math.max(1, n - 1));
              }
            }}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 ml-2"
          disabled={!input.trim() || isLoading}
          onClick={handleButtonClick}
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

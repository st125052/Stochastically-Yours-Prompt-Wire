import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { SendIcon, LoaderCircleIcon, Sparkles } from "lucide-react";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatBubble } from "@/components/chat/chat-bubble";

// Mock sources for demo purposes
const mockSources = [
  {
    url: "https://example.com/article1",
    title: "Breaking News: Latest Technology Trends",
  },
  {
    url: "https://example.com/article2",
    title: "AI Advancements: The Future of News Delivery",
  },
];

// Helper to generate a random UUID since crypto.randomUUID might not be available
const generateRandomId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export function ChatInput() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<null | { content: string, id: string }>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addMessage } = useChatStore();

  // Auto-resize textarea on mount
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  // Update height when input changes
  // We do need the input dependency here as we want to adjust height when text changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    addMessage(userMessage, "user");

    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate API call delay with typing indicator
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Hide typing indicator
      setIsTyping(false);

      // Generate the assistant response
      const response = `Here's the information you requested about "${userMessage}". I've found some relevant articles that might help answer your question.`;

      // Create a message ID for streaming
      const messageId = generateRandomId(); // Use our custom generator instead of crypto.randomUUID()

      // Start streaming the response
      setStreamingMessage({ content: response, id: messageId });

      // After streaming is complete, add final message to chat
      // This will be handled by the onComplete callback in the streaming component
      setTimeout(() => {
        addMessage(response, "assistant", mockSources);
        setStreamingMessage(null);
      }, response.length * 30 + 500); // Roughly the time it takes to stream + a little buffer

    } catch (error) {
      console.error("Error sending message", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };

  return (
    <>
      {isTyping && <TypingIndicator />}

      {streamingMessage && (
        <ChatBubble
          message={{
            id: streamingMessage.id,
            content: streamingMessage.content,
            role: "assistant",
            timestamp: new Date(),
          }}
          isStreaming={true}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="relative mt-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg transition-all duration-300 ease-in-out hover:border-zinc-300 dark:hover:border-zinc-600"
      >
        <div className="flex items-end">
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

          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full bg-transparent border-0"
              title="AI Suggestions"
            >
              <Sparkles className="h-5 w-5" />
              <span className="sr-only">AI Suggestions</span>
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-9 w-9 rounded-full"
            >
              {isLoading ? (
                <LoaderCircleIcon className="h-5 w-5 animate-spin" />
              ) : (
                <SendIcon className="h-5 w-5" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

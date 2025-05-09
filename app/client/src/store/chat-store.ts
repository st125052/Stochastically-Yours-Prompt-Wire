import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chatApi, type ChatHistoryItem, type ChatMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

export type MessageSource = {
  url: string;
  title: string;
};

export type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: MessageSource[];
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

type ChatStore = {
  chats: Chat[];
  currentChatId: string | null;
  isLoading: boolean;
  error: string | null;
  createChat: () => string;
  setCurrentChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addMessage: (content: string, role: "user" | "assistant", sources?: MessageSource[]) => void;
  getCurrentChat: () => Chat | undefined;
  loadChatHistory: (token: string) => Promise<void>;
  loadChatHistoryDetail: (token: string, chatId: string) => Promise<void>;
  clearError: () => void;
  sendMessage: (token: string, message: string) => Promise<void>;
};

// Custom storage with date handling
const customStorage = createJSONStorage<ChatStore>(() => localStorage, {
  reviver: (key, value) => {
    // Convert ISO date strings back to Date objects
    if (typeof value === "string" &&
        (key === "timestamp" || key === "createdAt" || key === "updatedAt") &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  }
});

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      isLoading: false,
      error: null,

      createChat: () => {
        const newChat: Chat = {
          id: crypto.randomUUID(),
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          currentChatId: newChat.id,
        }));

        return newChat.id;
      },

      setCurrentChat: (chatId: string) => {
        set({ currentChatId: chatId });
      },

      deleteChat: async (chatId: string) => {
        const accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) return;
        try {
          // Call backend to delete chat
          const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delete-chat?chat_id=${chatId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          if (!res.ok) throw new Error('Failed to delete chat on server');
          set((state) => {
            const newChats = state.chats.filter((chat) => chat.id !== chatId);
            let newCurrentChatId = state.currentChatId;
            if (state.currentChatId === chatId) {
              newCurrentChatId = newChats.length > 0 ? newChats[0].id : null;
            }
            return {
              chats: newChats,
              currentChatId: newCurrentChatId,
            };
          });
        } catch (e) {
          console.error('Failed to delete chat:', e);
        }
      },

      addMessage: (content: string, role: "user" | "assistant", sources?: MessageSource[]) => {
        set((state) => {
          // If there's no current chat, create one
          if (!state.currentChatId) {
            const newChat: Chat = {
              id: crypto.randomUUID(),
              title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            return {
              chats: [
                {
                  ...newChat,
                  messages: [
                    {
                      id: crypto.randomUUID(),
                      content,
                      role,
                      timestamp: new Date(),
                      sources,
                    },
                  ],
                },
                ...state.chats,
              ],
              currentChatId: newChat.id,
            };
          }

          // Otherwise, add the message to the current chat
          return {
            chats: state.chats.map((chat) => {
              if (chat.id === state.currentChatId) {
                // Update the chat title if this is the first message
                const shouldUpdateTitle = chat.messages.length === 0 && role === "user";

                return {
                  ...chat,
                  title: shouldUpdateTitle
                    ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
                    : chat.title,
                  messages: [
                    ...chat.messages,
                    {
                      id: crypto.randomUUID(),
                      content,
                      role,
                      timestamp: new Date(),
                      sources,
                    },
                  ],
                  updatedAt: new Date(),
                };
              }
              return chat;
            }),
          };
        });
      },

      getCurrentChat: () => {
        const { chats, currentChatId } = get();
        return chats.find((chat) => chat.id === currentChatId);
      },

      loadChatHistory: async (token: string) => {
        if (get().isLoading) return;
        try {
          set({ isLoading: true, error: null });
          const response = await chatApi.getChatHistory(token);
          if (!response || !Array.isArray(response.chats)) {
            set({ 
              error: 'Invalid chat history response', 
              isLoading: false 
            });
            return;
          }
          if (response.chats.length === 0) {
            set({ isLoading: false });
            return;
          }
          // Preserve the exact chat_id from the backend
          let chats = response.chats.slice(0, 10).map((item) => ({
            id: item.chat_id, // Use the exact chat_id from backend
            title: item.title || "Chat " + item.chat_id.slice(0, 8),
            messages: [],
            createdAt: new Date(item.last_used),
            updatedAt: new Date(item.last_used),
          }));
          // Deduplicate by chat id
          const seen = new Set();
          chats = chats.filter(chat => {
            if (seen.has(chat.id)) return false;
            seen.add(chat.id);
            return true;
          });
          set({
            chats,
            currentChatId: chats.length > 0 ? chats[0].id : get().currentChatId,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to load chat history:", error);
          set({ 
            error: 'Failed to load chat history. Please try again.', 
            isLoading: false 
          });
        }
      },

      loadChatHistoryDetail: async (token: string, chatId: string) => {
        if (get().isLoading) return;

        try {
          set({ isLoading: true, error: null });
          const response = await chatApi.getChatHistoryDetail(token, chatId);
          
          // Handle empty or invalid response
          if (!Array.isArray(response?.history)) {
            console.log('No chat history found for chat:', chatId);
            set({ isLoading: false });
            return;
          }

          // Convert API messages to our Message format
          const messages: Message[] = response.history.map((msg) => ({
            id: crypto.randomUUID(),
            content: msg.message,
            role: msg.role === "assistant" ? "assistant" : "user",
            timestamp: new Date(msg.time_stamp || Date.now()),
            // sources: msg.sources ? msg.sources.map(source => ({ url: source.url, title: source.title })) : undefined
          }));

          // Update the chat in our store
          set((state) => ({
            chats: state.chats.map((chat) => {
              if (chat.id === chatId) {
                return {
                  ...chat,
                  messages,
                  // Optionally update title/updatedAt if available
                  updatedAt: new Date()
                };
              }
              return chat;
            }),
            isLoading: false,
          }));
        } catch (error) {
          console.error("Failed to load chat history detail:", error);
          set({ 
            error: 'Failed to load chat messages. Please try again.', 
            isLoading: false 
          });
        }
      },

      clearError: () => set({ error: null }),

      sendMessage: async (token: string, message: string) => {
        if (get().isLoading) {
          console.log('Already loading, ignoring message');
          return;
        }

        try {
          console.log('Starting to send message:', { message });
          set({ isLoading: true, error: null });

          // Get or create chat ID
          let chatId = get().currentChatId;
          if (!chatId) {
            console.log('No current chat ID, creating new chat');
            chatId = get().createChat();
          }
          console.log('Using chat ID:', chatId);

          // Add user message immediately
          get().addMessage(message, "user");
          console.log('Added user message to chat');

          // Send message to API
          console.log('Sending message to API...');
          const response = await chatApi.sendMessage(token, message, chatId);
          console.log('Received API response:', response);

          // Add AI response
          get().addMessage(
            response.response,
            "assistant",
            response.sources
          );
          console.log('Added AI response to chat');

          set({ isLoading: false });
        } catch (error) {
          console.error("Failed to send message:", error);
          set({ 
            error: 'Failed to send message. Please try again.', 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: "promptwire-chats",
      storage: customStorage,
      version: 1,
    }
  )
);

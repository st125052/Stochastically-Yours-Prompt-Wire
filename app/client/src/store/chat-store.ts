import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { chatApi, type ChatHistoryItem } from "@/services/api";

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
  createChat: () => void;
  setCurrentChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addMessage: (content: string, role: "user" | "assistant", sources?: MessageSource[]) => void;
  getCurrentChat: () => Chat | undefined;
  loadChatHistory: (token: string) => Promise<void>;
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
      },

      setCurrentChat: (chatId: string) => {
        set({ currentChatId: chatId });
      },

      deleteChat: (chatId: string) => {
        set((state) => {
          const newChats = state.chats.filter((chat) => chat.id !== chatId);
          let newCurrentChatId = state.currentChatId;

          // If we're deleting the current chat, select another one
          if (state.currentChatId === chatId) {
            newCurrentChatId = newChats.length > 0 ? newChats[0].id : null;
          }

          return {
            chats: newChats,
            currentChatId: newCurrentChatId,
          };
        });
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
          set({ isLoading: true });
          const response = await chatApi.getChatHistory(token);
          
          if (!response || !Array.isArray(response.chats)) {
            console.error('Invalid chat history response:', response);
            return;
          }

          if (response.chats.length === 0) {
            set({ isLoading: false });
            return;
          }

          const chats: Chat[] = response.chats.slice(0, 10).map((item) => ({
            id: item.chat_id,
            title: "Chat " + item.chat_id.slice(0, 8),
            messages: [],
            createdAt: new Date(item.last_used),
            updatedAt: new Date(item.last_used),
          }));

          set((state) => ({
            chats: [...chats, ...state.chats],
            currentChatId: chats.length > 0 ? chats[0].id : state.currentChatId,
            isLoading: false,
          }));
        } catch (error) {
          console.error("Failed to load chat history:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "promptwire-chats",
      storage: customStorage,
      // Add a version number for the storage
      version: 1,
      // Optional migration for older versions
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('State rehydrated successfully');
        } else {
          console.warn('Failed to rehydrate state');
        }
      }
    }
  )
);

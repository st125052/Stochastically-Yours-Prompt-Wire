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
  isStreaming?: boolean;
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
  sendMessage: (token: string, message: string, numSources?: number) => Promise<void>;
};

const enablePersistence = import.meta.env.VITE_ENABLE_CHAT_PERSISTENCE === "true";

const storeFactory = (set: any, get: any) => ({
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

    set((state: any) => ({
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
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delete-chat?chat_id=${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete chat on server');
      set((state: any) => {
        const newChats = state.chats.filter((chat: any) => chat.id !== chatId);
        let newCurrentChatId = state.currentChatId;
        if (state.currentChatId === chatId) {
          newCurrentChatId = newChats.length > 0 ? newChats[0].id : null;
        }
        return {
          chats: newChats,
          currentChatId: newCurrentChatId,
        };
      });
    } catch (e) {}
  },

  addMessage: (content: string, role: "user" | "assistant", sources?: MessageSource[]) => {
    set((state: any) => {
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

      return {
        chats: state.chats.map((chat: any) => {
          if (chat.id === state.currentChatId) {
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
    return chats.find((chat: any) => chat.id === currentChatId);
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

      let chats = response.chats.slice(0, 10).map((item) => ({
        id: item.chat_id, 
        title: item.title || "Chat " + item.chat_id.slice(0, 8),
        messages: [],
        createdAt: new Date(item.last_used),
        updatedAt: new Date(item.last_used),
      }));
      const seen = new Set();
      chats = chats.filter((chat: any) => {
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
      
      if (!Array.isArray(response?.history)) {
        set({ isLoading: false });
        return;
      }

      const messages: Message[] = response.history.map((msg) => ({
        id: crypto.randomUUID(),
        content: msg.message,
        role: msg.role === "assistant" ? "assistant" : "user",
        timestamp: new Date(msg.time_stamp || Date.now()),
      }));

      set((state: any) => ({
        chats: state.chats.map((chat: any) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages,
              updatedAt: new Date()
            };
          }
          return chat;
        }),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: 'Failed to load chat messages. Please try again.', 
        isLoading: false 
      });
    }
  },

  clearError: () => set({ error: null }),

  sendMessage: async (token: string, message: string, numSources: number = 3) => {
    if (get().isLoading) {
      return;
    }

    try {
      set({ isLoading: true, error: null });

      let chatId = get().currentChatId;
      if (!chatId) {
        chatId = get().createChat();
      }

      get().addMessage(message, "user");

      const streamingId = crypto.randomUUID();
      set((state: any) => ({
        chats: state.chats.map((chat: any) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: streamingId,
                    content: "",
                    role: "assistant",
                    timestamp: new Date(),
                    isStreaming: true,
                  },
                ],
              }
            : chat
        ),
      }));

      const response = await chatApi.sendMessage(token, message, chatId, numSources);

      set((state: any) => ({
        chats: state.chats.map((chat: any) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((msg: any) =>
                  msg.id === streamingId
                    ? {
                        ...msg,
                        content: response.response,
                        sources: response.sources,
                        isStreaming: false,
                      }
                    : msg
                ),
              }
            : chat
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: 'Failed to send message. Please try again.',
        isLoading: false,
      });
    }
  },
});

export const useChatStore = enablePersistence
  ? create(
      persist(storeFactory, {
        name: "promptwire-chats",
        storage: createJSONStorage(() => localStorage),
        version: 1,
      })
    )
  : create(storeFactory);

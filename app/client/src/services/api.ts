import { Chat } from "@/store/chat-store";

export interface ChatHistoryItem {
  chat_id: string;
  last_used: string;
}

export interface ChatHistoryResponse {
  chats: ChatHistoryItem[];
}

export const chatApi = {
  getChatHistory: async (token: string): Promise<ChatHistoryResponse> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    return response.json();
  },
}; 
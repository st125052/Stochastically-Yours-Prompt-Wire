import { Chat } from "@/store/chat-store";

export type ChatHistoryItem = {
  chat_id: string;
  title?: string;
  last_used: string;
};

export interface ChatHistoryResponse {
  chats: ChatHistoryItem[];
}

export type ChatMessage = {
  message: string;
  role: "user" | "ai";
  timestamp?: string;
  sources?: Array<{
    url: string;
    title: string;
  }>;
};

export type ChatHistoryDetail = {
  messages: ChatMessage[];
  title?: string;
};

export interface ChatHistoryDetailResponse {
  history: ChatHistoryDetail;
}

export type ChatResponse = {
  response: string;
  sources: Array<{
    url: string;
    title: string;
  }>;
};

export type ChatRequest = {
  message: string;
  chat_id: string;
  num_sources?: number;
};

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

  getChatHistoryDetail: async (token: string, chatId: string): Promise<ChatHistoryDetailResponse> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat-history?chat_id=${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chat history detail");
    }

    return response.json();
  },

  sendMessage: async (token: string, message: string, chatId: string, numSources: number = 3): Promise<ChatResponse> => {
    console.log('Sending message to API:', {
      url: `${import.meta.env.VITE_BACKEND_URL}/chat`,
      message,
      chatId,
      numSources
    });

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chat_id: chatId,
        num_sources: numSources
      }),
    });

    if (!response.ok) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText
      });
      throw new Error("Failed to send message");
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  },
}; 
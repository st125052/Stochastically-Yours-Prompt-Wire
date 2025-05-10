# Prompt Wire: AI Chat Platform for Financial News

Welcome to **Prompt Wire**, a modern, full-stack AI chat application designed specifically for financial news. This platform enables seamless, context-aware conversations with advanced source attribution, helping users get reliable, up-to-date financial information and news insights. Prompt Wire leverages state-of-the-art technologies across the stack to deliver a robust, scalable, and user-friendly experience tailored for the finance sector.

---

## 🌐 Live URLs

- **Client (Frontend):** [https://www.aitmltask.online](https://www.aitmltask.online)
- **Server (Backend API):** [https://api.aitmltask.online](https://api.aitmltask.online)
- **Weaviate (Vector DB):** [https://weaviate-api.aitmltask.online](https://weaviate-api.aitmltask.online)

---

## 🛠️ Product Overview

### What is Prompt Wire?

Prompt Wire is an AI-powered chat platform focused on financial news. Users interact with a large language model (LLM) in a conversational interface to get answers, summaries, and insights about financial markets, companies, and economic events. The system supports persistent chat history, source citation for AI responses, and robust authentication. It is designed for reliability, scalability, and transparency in AI-driven financial Q&A.

### Key Features

- **Conversational AI for Finance:** Chat with an LLM that provides detailed, context-aware answers about financial news and topics.
- **Source Attribution:** Each AI response can include links to reputable financial news sources, ensuring transparency and trust.
- **Persistent Chat History:** All conversations are stored and can be revisited at any time.
- **Multi-Chat Support:** Manage multiple chat threads, each with its own history.
- **Authentication:** Secure login and token-based authentication.
- **Modern UI:** Fast, responsive React + Vite frontend with a clean, intuitive design.
- **Robust Backend:** Flask API with JWT authentication, chat management, and integration with Weaviate for vector search.
- **Scalable Infrastructure:** Dockerized deployment for all components, enabling easy scaling and maintenance.

---

## 🏗️ Architecture & Deployment

### 1. **Frontend**
- **Tech:** React + Vite, Zustand for state management, modern UI/UX.
- **Deployment:** Dockerized and hosted on **Heroku**.
- **Domain:** [https://www.aitmltask.online](https://www.aitmltask.online)

### 2. **Backend**
- **Tech:** Python Flask, JWT authentication, RESTful API, DynamoDB for chat storage.
- **Deployment:** Dockerized Flask app hosted on **Heroku**.
- **Domain:** [https://api.aitmltask.online](https://api.aitmltask.online)

### 3. **Weaviate (Vector Database)**
- **Tech:** Weaviate (open-source vector search engine).
- **Deployment:** Self-hosted on **Google Cloud Platform (GCP)**.
- **Integration:** Flask backend and Weaviate run on the same Docker network for secure, high-speed communication.
- **Domain:** [https://weaviate-api.aitmltask.online](https://weaviate-api.aitmltask.online)

### 4. **Domain & Networking**
- **Domain Registrar:** GoDaddy
- **Proxy & SSL:** All domains are proxied and secured via **Cloudflare** for enhanced security, performance, and global CDN.

---

## 🔒 Security & Best Practices

- **JWT Authentication:** All API endpoints are protected with JWT tokens.
- **CORS:** Configured to allow only trusted origins.
- **Cloudflare Proxy:** Shields all services from direct exposure, providing DDoS protection and SSL termination.
- **Environment Variables:** All sensitive configuration is managed via environment variables.

---

## 🚀 How It Works

1. **User logs in** via the frontend, receiving a JWT token.
2. **Chat history** is fetched and displayed in the sidebar.
3. **User sends a message**; the frontend POSTs to the backend `/chat` endpoint.
4. **Backend stores the message** and fetches the last 4 messages for context.
5. **AI response is generated** (optionally using Weaviate for vector search and source retrieval from financial news sources).
6. **Response and sources** are returned to the frontend and displayed, with clickable source links.
7. **All chats and messages** are persisted and can be managed (deleted, revisited, etc.).

---

## 🧑‍💻 For Developers

### Main Repositories

- **Frontend:** React + Vite app (see `/client`)
- **Backend:** Flask API (see `/server/app`)
- **Weaviate Integration:** Flask app connects to Weaviate via internal Docker network on GCP.

### Key Endpoints

- `POST /chat` — Send a message, get AI response (with chat history context and sources)
- `GET /chats` — List all chat threads for the user
- `GET /chat-history?chat_id=...` — Get full message history for a chat
- `DELETE /delete-chat?chat_id=...` — Delete a specific chat
- `DELETE /delete-all-chats` — Delete all user chats

---

## 📝 Domain & Hosting Details

- **Frontend:** Dockerized React app, Heroku, Cloudflare proxy, GoDaddy domain
- **Backend:** Dockerized Flask app, Heroku, Cloudflare proxy, GoDaddy domain
- **Weaviate:** Self-hosted on GCP, Docker, Cloudflare proxy, GoDaddy domain

---

## 📦 Tech Stack

- **Frontend:** React, Vite, Zustand, TypeScript, modern CSS
- **Backend:** Python, Flask, JWT, DynamoDB, Weaviate, Docker
- **Infra:** Heroku, GCP, Docker, Cloudflare, GoDaddy

---

**Built with ❤️ by the Stochastically Yours team.**
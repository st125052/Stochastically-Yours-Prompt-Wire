# PromptWire

PromptWire is an AI-powered news assistant web application that provides a chat interface with real-time streaming responses, persona avatars, and a clean, responsive design with both light and dark mode support.

## Features

- AI-powered chat assistant with news domain knowledge
- Streaming text outputs with typing animation
- News anchor persona with typing indicators
- Message reactions and sources display
- Dark/Light mode support
- Responsive design

## Docker Setup

### Prerequisites

- Docker and Docker Compose installed on your system
- Git (to clone the repository)

### Running with Docker

1. Clone the repository:

```bash
git clone <repository-url>
cd promptwire
```

2. Build and start the containers:

```bash
docker-compose up -d
```

This will build the Docker image and start the container in detached mode.

3. Access the application:

Open your browser and navigate to `http://localhost:3000`

4. Stop the containers:

```bash
docker-compose down
```

### Docker Commands

- Build the Docker image:
  ```bash
  docker-compose build
  ```

- Start the containers:
  ```bash
  docker-compose up -d
  ```

- View container logs:
  ```bash
  docker-compose logs -f
  ```

- Stop the containers:
  ```bash
  docker-compose down
  ```

## Development Setup (without Docker)

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview the production build:

```bash
npm run preview
```

## Project Structure

```
promptwire/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── auth/         # Authentication components
│   │   ├── chat/         # Chat interface components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   └── store/            # State management
├── .dockerignore         # Docker ignore file
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
└── package.json          # Project dependencies
```

## License

MIT

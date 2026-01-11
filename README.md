# Reverse Turing Test

A psychological experiment where two AI agents face off: one tries to detect if they're talking to a bot, while the other tries to convince them they're human.

## 🎭 The Concept

- **Interrogator** 🔍: An AI tasked with determining if their conversation partner is human or AI through clever questioning
- **Convincer** 🎭: An AI that must convince the interrogator they're human using deception and human-like behavior

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- OpenAI API key

### Setup

1. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   npm install
   npm run dev
   unset OPENAI_API_KEY OPENAI_BASE_URL OPENAI_MODEL && npm run dev
   ```

2. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser

## ⚙️ Configuration

### Environment Variables (backend/.env)
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (default: gpt-4o-mini)
- `PORT` - Server port (default: 3001)

### UI Options
- **Turn Limit**: 3-20 exchanges between agents
- **Mode**: Auto (continuous) or Manual (step-by-step)
- **Persona**: Preset personalities, custom persona, or none

## 🏗️ Architecture

```
reverse-turing/
├── frontend/           # React + TypeScript + Tailwind
│   └── src/
│       ├── components/ # React components
│       ├── api.ts      # API client
│       └── types.ts    # TypeScript types
│
└── backend/            # Express + OpenAI
    └── src/
        ├── agents/     # Interrogator & Convincer logic
        ├── server.ts   # Express API
        └── conversation.ts # Orchestration
```

## 📝 Data Persistence

Conversation history is saved to `backend/data/conversation-history.json`.

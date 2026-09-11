# Aura

A little companion who listens, remembers, and gets to know you.

Aura is not a game, not a social network, and not a generic chatbot. You pick one of five
original creatures, give it a name, and talk to it about your day. Over time it remembers the
facts, preferences, goals, relationships, and life events you've shared, and brings them back
into future conversations naturally.

## Requirements

- Python 3.11+
- Node.js 18+
- An API key from any ONE of: OpenAI, Anthropic (Claude), Google (Gemini), or any
  OpenAI-compatible provider (OpenRouter, Groq, Together, a local Ollama/vLLM server, etc.)

## Project structure

```
backend/    FastAPI + SQLAlchemy + SQLite
frontend/   React + Vite + TypeScript + Tailwind + Framer Motion
```

## Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# edit .env: set AI_PROVIDER (openai / anthropic / google) and AI_API_KEY
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. SQLite database file `companion.db` is created
automatically in `backend/` on first run.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL defaults to http://localhost:8000/api, adjust if needed
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment variables

Backend (`backend/.env`):

| Variable | Description |
|---|---|
| `AI_PROVIDER` | `openai`, `anthropic`, or `google`. Defaults to `openai`. |
| `AI_API_KEY` | Your API key for whichever provider you chose. Required for chat and memory extraction. |
| `AI_MODEL` | Optional. Leave blank to use a sensible default per provider (see below). |
| `AI_BASE_URL` | Optional, `openai` provider only. Point it at any OpenAI-compatible endpoint (OpenRouter, Groq, Together, a local Ollama/vLLM server, etc.) instead of api.openai.com. |
| `DATABASE_URL` | Defaults to `sqlite:///./companion.db`. |
| `CORS_ORIGINS` | Comma-separated allowed origins for the frontend. |

Frontend (`frontend/.env`):

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:8000/api`. |

## API overview

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/companions` | List the five companions |
| POST | `/api/users/guest` | Create a guest user with a chosen companion + name |
| POST | `/api/chat` | Send a message, get a reply, trigger memory extraction |
| GET | `/api/conversations/{user_id}` | Full message history for a user |
| GET | `/api/memories/{user_id}` | All saved memories for a user |
| DELETE | `/api/memories/{memory_id}` | Delete a single memory |
| DELETE | `/api/memories/user/{user_id}` | Forget everything for a user |

## Architecture

- **Frontend** is a single-page React app. A guest user ID is generated server-side on first
  visit and persisted in `localStorage`, so no login is required. The flow is: landing →
  choose companion → name companion → chat.
- **Backend** is a FastAPI app with three SQLite tables: `users`, `conversation_messages`, and
  `memories`. Each chat turn: loads the companion's personality config, retrieves the top
  ~18 relevant memories, loads the last 12 messages of conversation, builds a system prompt,
  calls the AI, stores both messages, then runs a second lightweight AI call to extract any new
  durable memories from that exchange.
- **Voice** uses the browser's built-in `SpeechRecognition` (speech-to-text) and
  `SpeechSynthesis` (text-to-speech) APIs. Text chat always works; voice is progressively
  enhanced and never required. Tapping "Voice mode" switches to a full-screen view where the
  creature is the focus: tap the mic, speak, it auto-sends what it heard and speaks its reply
  back, with live captions instead of a chat log.
- **The companion visibly reacts.** A lightweight keyword-based emotion read on your message
  (`frontend/src/lib/emotion.ts`) drives the creature's expression and motion -- comforting for
  "I'm sad", concerned for "I'm anxious about my exam", excited for good news, calm when you
  mention being tired -- independently of its idle/listening/thinking/speaking animation state,
  so it's expressive in both text and voice mode, not just an icon next to a chat bubble.

## Memory system

Memory is deliberately simple and fully explainable — no vector database, no embeddings.

1. After each exchange, a separate AI call (`extract_memories`) reads just that one exchange
   and returns structured JSON memories (`fact`, `preference`, `goal`, `relationship`,
   `life_event`, or `emotional_context`) with an importance score from 1–10.
2. New memories are checked against existing ones for near-duplicates (fuzzy string
   similarity) before being saved, so the memory list doesn't grow endlessly with repeats.
3. On the next message, memories are ranked by a blend of `importance` and recency of last
   use, and the top ~18 are injected into the system prompt — not the entire conversation
   history.
4. Users can view everything a companion remembers, delete individual memories, or wipe all
   memories for a fresh start, from the "What [companion] remembers" panel in the chat UI.

## AI configuration

The backend talks to AI providers through a small adapter layer
(`backend/app/services/providers/`), so it isn't locked to OpenAI. Pick a provider with
`AI_PROVIDER` and drop the matching key into `AI_API_KEY`:

| `AI_PROVIDER` | Where to get a key | Default model if `AI_MODEL` is blank |
|---|---|---|
| `openai` | platform.openai.com | `gpt-4o-mini` |
| `anthropic` | console.anthropic.com | `claude-3-5-sonnet-20241022` |
| `google` | aistudio.google.com | `gemini-1.5-flash` |

To use any other OpenAI-compatible provider (OpenRouter, Groq, Together, a self-hosted
Ollama/vLLM server, etc.), keep `AI_PROVIDER=openai`, set `AI_API_KEY` to that provider's key,
`AI_BASE_URL` to its endpoint, and `AI_MODEL` to the model name it expects.

Adding another provider later is a matter of writing one new file in
`backend/app/services/providers/` implementing the `ChatProvider.chat(...)` interface and
wiring it into `get_provider()` -- nothing else in the app needs to change.

If `AI_API_KEY` is missing, the provider is misconfigured, or the AI call fails for any reason,
the backend returns a friendly error message and never exposes stack traces to the client.

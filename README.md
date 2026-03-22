# Gemini Collab

Real-time group chat where **Google Gemini** is a first-class participant. Create a group, invite your team, and bring AI into the conversation with `@Gemini` — it reads the chat history and responds with full context.

Built for the [Zero to Agent: Vercel x Google DeepMind Hackathon](https://cerebralvalley.ai/e/zero-to-agent-sf).

## The Problem

AI assistants today are single-player. You open a tab, have a private conversation, then copy-paste answers to your team. Context gets lost, teammates ask the same questions separately, and the AI never sees the full picture of what the group is working on.

## The Solution

Gemini Collab puts AI directly into the group chat. Everyone sees the same conversation with Gemini, the AI maintains context across all messages, and the entire team benefits from every interaction. No more copy-pasting AI responses into Slack.

**How it works:**
1. Sign in with Google
2. Create a group and share the invite link
3. Chat with your team — mention `@Gemini` anytime to bring AI into the conversation
4. Gemini reads the last 20 messages for context and responds naturally as a chat participant

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) |
| **AI** | Google Gemini 2.5 Flash via Vercel AI SDK |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Google OAuth via Supabase Auth |
| **Real-time** | Supabase Realtime (Postgres Changes) |
| **Monitoring** | Sentry (error tracking + performance) |
| **Deployment** | Vercel |

## Architecture

```
Browser ──> Next.js (Vercel)
              ├── Server Components (auth, data fetching)
              ├── API Route /api/chat (Gemini streaming)
              └── Client Components (chat UI, realtime subscriptions)
                    │
                    └──> Supabase
                           ├── Auth (Google OAuth)
                           ├── Database (groups, messages, profiles)
                           └── Realtime (live message sync)
```

No WebSocket server, no separate backend, no infrastructure to manage. Supabase handles auth, database, AND real-time — the entire app is a single Next.js deployment on Vercel.

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GOOGLE_GENERATIVE_AI_API_KEY

# Run the dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error monitoring |

## Team

Built by [Tanmay Kallakuri](https://github.com/TanmayKallakuri)

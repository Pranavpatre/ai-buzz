# AI Buzz

AI Buzz is a daily AI briefing app — think Inshorts, but for AI. It pulls content from 40+ sources across news, podcasts, and articles, summarizes each item into a full-screen card with 3–5 key bullet points using Claude AI, and presents them in a fast vertical snap-scroll. One place, one scroll, fully caught up.

## Features

- **Snap-scroll digest feed** — Full-screen cards, one per item. Swipe to read next.
- **Filter tabs** — All / News / Podcasts / Articles
- **Auto-sync** — Fetches and summarizes new content on page load (15-min cooldown)
- **Source links** — Every card links to the original article, video, or paper
- **Admin panel** — Manage RSS feeds, YouTube channels, and Gmail newsletters

## Content Sources

| Type | Sources |
|------|---------|
| **News** | Google News AI, TechCrunch AI, VentureBeat AI, MIT Tech Review AI, Ars Technica AI |
| **Podcasts** | 25 YouTube channels — Lex Fridman, All-In, No Priors, Fireship, OpenAI, Anthropic, Google DeepMind, and more |
| **Articles** | Simon Willison, Ethan Mollick (One Useful Thing), ArXiv (cs.AI/cs.LG/cs.CL), Reddit (r/MachineLearning, r/LocalLLaMA), Hacker News AI |

## Summarization Pipeline

```
Feeds (RSS / YouTube / Gmail)
    ↓
fetch-rss (Supabase Edge Function)
    → Fetch XML from all active feeds
    → Filter by 140+ AI keywords
    → Deduplicate against existing digests
    ↓
summarize (Supabase Edge Function)
    → Claude Haiku (Anthropic API)
    → Generates headline + 3–5 bullet points
    → Parallel batches of 5
    ↓
React snap-scroll feed
    → Up to 200 digests
    → Filter by type
    → Link to original source
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Edge Functions | Deno (Supabase Edge Functions) |
| AI | Claude Haiku (Anthropic API) |
| APIs | YouTube Data API v3, Gmail API |
| Hosting | Vercel |

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Pranavpatre/ai-buzz.git
cd ai-buzz

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Environment Variables

Set the following as Supabase secrets:

```
ANTHROPIC_API_KEY   # Required for the summarize edge function
YOUTUBE_API_KEY     # Required for YouTube channel discovery
```

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Run tests (Vitest)
```

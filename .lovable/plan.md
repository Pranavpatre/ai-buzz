

## Problem

**Firecrawl does not support scraping x.com/twitter.com** — it explicitly blocks the domain. Your only feed (`@AnthropicAI`) is an X feed, so `fetch-rss` returns zero items.

## Solution

Replace the direct X profile scraping approach with **Firecrawl's Search API**. Instead of scraping `x.com/@AnthropicAI`, we search the web for recent posts/news from that account. This sidesteps the x.com block entirely.

## Changes

### 1. Rewrite `supabase/functions/fetch-x/index.ts`

- Replace the scrape call with Firecrawl's `/v1/search` endpoint
- Search query: `"@{handle}" OR "{handle}" site:x.com OR site:twitter.com` with time filter `tbs: "qdr:m"` (last month)
- Falls back to a broader search like `"{handle} AI announcement"` if no results
- Parse search results into the same `{ title, link, description, pubDate }` format
- Keep the existing AI keyword filter on results

### 2. No other file changes needed

The `fetch-rss` function already calls `fetch-x` correctly, and the admin UI / digest flow are all wired up. Only the scraping strategy inside `fetch-x` needs to change.

## Technical Detail

Firecrawl Search API request:
```
POST https://api.firecrawl.dev/v1/search
{
  "query": "from:AnthropicAI",
  "limit": 10,
  "tbs": "qdr:m",
  "scrapeOptions": { "formats": ["markdown"] }
}
```

Response gives us URLs, titles, descriptions, and optionally full markdown content — everything needed to filter and summarize.


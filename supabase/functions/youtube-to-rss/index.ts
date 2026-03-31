import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractChannelIdFromUrl(url: string): string | null {
  const match = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  return match ? match[1] : null;
}

function extractHandleFromUrl(url: string): string | null {
  // youtube.com/@handle
  const match = url.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  return match ? match[1] : null;
}

function extractUsernameFromUrl(url: string): string | null {
  // youtube.com/user/username
  const match = url.match(/youtube\.com\/user\/([a-zA-Z0-9_.-]+)/);
  return match ? match[1] : null;
}

function extractCustomNameFromUrl(url: string): string | null {
  // youtube.com/c/name
  const match = url.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/);
  return match ? match[1] : null;
}

async function resolveViaApi(params: Record<string, string>, apiKey: string): Promise<string | null> {
  const qs = new URLSearchParams({ part: "id", key: apiKey, ...params });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${qs}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.id ?? null;
}

async function resolveViaSearch(query: string, apiKey: string): Promise<string | null> {
  const qs = new URLSearchParams({ part: "snippet", type: "channel", q: query, maxResults: "1", key: apiKey });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${qs}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.items?.[0]?.id?.channelId ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { youtubeUrl } = await req.json();
    if (!youtubeUrl || typeof youtubeUrl !== "string") {
      return new Response(JSON.stringify({ error: "Missing youtubeUrl" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: "YOUTUBE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let url = youtubeUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    let channelId: string | null = null;

    // 1. Direct /channel/UCxxxxxx URL — no API call needed
    channelId = extractChannelIdFromUrl(url);

    // 2. @handle URL → forHandle API
    if (!channelId) {
      const handle = extractHandleFromUrl(url);
      if (handle) channelId = await resolveViaApi({ forHandle: handle }, YOUTUBE_API_KEY);
    }

    // 3. /user/username URL → forUsername API
    if (!channelId) {
      const username = extractUsernameFromUrl(url);
      if (username) channelId = await resolveViaApi({ forUsername: username }, YOUTUBE_API_KEY);
    }

    // 4. /c/name URL → search API
    if (!channelId) {
      const customName = extractCustomNameFromUrl(url);
      if (customName) channelId = await resolveViaSearch(customName, YOUTUBE_API_KEY);
    }

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: "Could not find a YouTube channel for that URL. Try a URL like youtube.com/@channelname" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    return new Response(JSON.stringify({ rssUrl, channelId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("youtube-to-rss error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

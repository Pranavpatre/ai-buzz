import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractChannelIdFromHtml(html: string): string | null {
  // Try multiple patterns to find channel ID
  const patterns = [
    /\"channelId\":\"(UC[a-zA-Z0-9_-]{22})\"/,
    /channel_id=(UC[a-zA-Z0-9_-]{22})/,
    /\"externalId\":\"(UC[a-zA-Z0-9_-]{22})\"/,
    /data-channel-external-id=\"(UC[a-zA-Z0-9_-]{22})\"/,
    /\/channel\/(UC[a-zA-Z0-9_-]{22})/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractChannelIdFromUrl(url: string): string | null {
  // Direct channel URL: youtube.com/channel/UCxxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelMatch) return channelMatch[1];
  return null;
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

    // Normalize URL
    let url = youtubeUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    // Try extracting channel ID directly from URL
    let channelId = extractChannelIdFromUrl(url);

    if (!channelId) {
      // Fetch the YouTube page and extract channel ID from HTML
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Failed to fetch YouTube page (${res.status})` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const html = await res.text();
      channelId = extractChannelIdFromHtml(html);
    }

    if (!channelId) {
      return new Response(JSON.stringify({ error: "Could not extract channel ID from that URL. Try a channel URL like youtube.com/@channelname" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

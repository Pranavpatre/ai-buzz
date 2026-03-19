import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  try {
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

function extractBody(payload: any): string {
  // Check for direct body data
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Check parts (multipart emails)
  if (payload.parts) {
    // Prefer text/plain, then text/html
    for (const mimeType of ["text/plain", "text/html"]) {
      for (const part of payload.parts) {
        if (part.mimeType === mimeType && part.body?.data) {
          return decodeBase64Url(part.body.data);
        }
        // Nested parts (e.g. multipart/alternative inside multipart/mixed)
        if (part.parts) {
          for (const sub of part.parts) {
            if (sub.mimeType === mimeType && sub.body?.data) {
              return decodeBase64Url(sub.body.data);
            }
          }
        }
      }
    }
  }

  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { providerToken, domains, existingUrls } = await req.json();

    if (!providerToken) {
      return new Response(JSON.stringify({ error: "Missing Google provider token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!domains || domains.length === 0) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingUrlSet = new Set(existingUrls || []);
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const allItems: any[] = [];

    for (const { feedId, feedName, domain } of domains) {
      try {
        // Search for recent emails from this domain
        const query = `from:${domain} newer_than:7d`;
        const searchUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=5`;

        const searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${providerToken}` },
        });

        if (!searchRes.ok) {
          console.error(`Gmail search failed for ${domain}: ${searchRes.status}`);
          if (searchRes.status === 401 || searchRes.status === 403) {
            return new Response(JSON.stringify({ error: "Gmail access denied. Please re-authenticate with Google." }), {
              status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          continue;
        }

        const searchData = await searchRes.json();
        const messageIds = (searchData.messages || []).map((m: any) => m.id);

        for (const msgId of messageIds) {
          try {
            // Fetch full message
            const msgRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
              { headers: { Authorization: `Bearer ${providerToken}` } }
            );

            if (!msgRes.ok) continue;
            const msg = await msgRes.json();

            const headers = msg.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === "Subject")?.value || "Newsletter";
            const dateHeader = headers.find((h: any) => h.name === "Date")?.value || "";
            const messageIdHeader = headers.find((h: any) => h.name === "Message-ID")?.value || msgId;

            // Use a stable URL-like identifier for dedup
            const stableUrl = `gmail://${domain}/${msgId}`;
            if (existingUrlSet.has(stableUrl)) continue;

            const pubDate = dateHeader ? new Date(dateHeader) : new Date(parseInt(msg.internalDate));
            if (pubDate < cutoff) continue;

            // Extract body content
            const rawBody = extractBody(msg.payload);
            const textContent = rawBody.includes("<") ? stripHtml(rawBody) : rawBody;

            // Truncate to reasonable size for summarization
            const description = textContent.slice(0, 4000);

            if (description.length < 50) {
              console.log(`Skipping email from ${domain} - too short`);
              continue;
            }

            allItems.push({
              feedId,
              feedName,
              feedType: "newsletter",
              title: subject,
              link: stableUrl,
              description,
              pubDate: pubDate.toISOString(),
            });
          } catch (e) {
            console.error(`Error fetching message ${msgId}:`, e);
          }
        }
      } catch (e) {
        console.error(`Error processing domain ${domain}:`, e);
      }
    }

    console.log(`Found ${allItems.length} newsletter emails from Gmail`);

    return new Response(JSON.stringify({ items: allItems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-gmail-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

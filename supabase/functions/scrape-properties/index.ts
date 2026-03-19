import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ScrapeRequest = { urls?: string[] };
type ScrapeItem = {
  url: string;
  title?: string;
  description?: string;
  images?: string[];
  keywords?: string[];
  price?: number;
  currency?: string;
  location?: string;
  plot_size?: string;
  land_category?: string;
  amenities?: string[];
  error?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });

const stripHtml = (html: string) => {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withBreaks = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|section|article|h1|h2|h3|h4|h5|h6)>/gi, "\n");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, " ");
  return withoutTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const uniq = (items: string[]) => [...new Set(items.map((s) => s.trim()).filter(Boolean))];

const baseHeaders: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const looksBlocked = (html: string) => {
  const h = (html || "").toLowerCase();
  if (!h) return true;
  if (h.includes("captcha")) return true;
  if (h.includes("cloudflare")) return true;
  if (h.includes("attention required")) return true;
  if (h.includes("access denied")) return true;
  if (h.includes("unusual traffic")) return true;
  if (h.includes("verify you are human")) return true;
  if (h.includes("enable javascript")) return true;
  return false;
};

const fetchHtmlDirect = async (url: string) => {
  const r = await fetch(url, { headers: baseHeaders, redirect: "follow" });
  const html = await r.text();
  return { ok: r.ok, status: r.status, html, via: "direct" as const };
};

const fetchHtmlZenRows = async (url: string, apiKey: string) => {
  const proxyUrl =
    `https://api.zenrows.com/v1/?url=${encodeURIComponent(url)}&js_render=true&premium_proxy=true`;
  const r = await fetch(proxyUrl, {
    headers: {
      ...baseHeaders,
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const html = await r.text();
  return { ok: r.ok, status: r.status, html, via: "zenrows" as const };
};

const fetchHtmlScrapingBee = async (url: string, apiKey: string) => {
  const proxyUrl =
    `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}&render_js=true`;
  const r = await fetch(proxyUrl, { headers: baseHeaders });
  const html = await r.text();
  return { ok: r.ok, status: r.status, html, via: "scrapingbee" as const };
};

const fetchHtmlJina = async (url: string) => {
  const normalized = url.replace(/^https?:\/\//i, "");
  const proxyUrl = `https://r.jina.ai/http://${normalized}`;
  const r = await fetch(proxyUrl, { headers: { "User-Agent": baseHeaders["User-Agent"] } });
  const html = await r.text();
  return { ok: r.ok, status: r.status, html, via: "jina" as const };
};

const fetchHtmlWithFallback = async (url: string) => {
  const direct = await fetchHtmlDirect(url);
  if (direct.ok && !looksBlocked(direct.html)) return direct;

  const zenKey = (Deno.env.get("ZENROWS_API_KEY") || "").trim();
  if (zenKey) {
    const zen = await fetchHtmlZenRows(url, zenKey);
    if (zen.ok && !looksBlocked(zen.html)) return zen;
  }

  const beeKey = (Deno.env.get("SCRAPINGBEE_API_KEY") || "").trim();
  if (beeKey) {
    const bee = await fetchHtmlScrapingBee(url, beeKey);
    if (bee.ok && !looksBlocked(bee.html)) return bee;
  }

  const jina = await fetchHtmlJina(url);
  if (jina.ok && jina.html.trim().length > 200) return jina;

  const sample = stripHtml(direct.html || "").slice(0, 240);
  const reason = direct.ok ? "blocked" : `http_${direct.status}`;
  throw new Error(`${reason}_via_${direct.via}: ${sample}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, { status: 405 });
  }

  let payload: ScrapeRequest;
  try {
    payload = (await req.json()) as ScrapeRequest;
  } catch {
    return json({ error: "invalid_json" }, { status: 400 });
  }

  const urls = (payload.urls || [])
    .map((u) => (u || "").trim())
    .filter(Boolean);

  if (urls.length === 0) {
    return json({ error: "no_urls" }, { status: 400 });
  }

  const features = [
    "all ensuite",
    "servant quarters",
    "sq",
    "modern finishes",
    "gated community",
    "electric fence",
    "cctv",
    "borehole",
    "generator",
    "solar",
    "airbnb",
    "furnished",
    "electricity available",
    "beacons",
    "ready for construction",
    "scenic views",
    "title deed ready",
    "fenced",
    "main road",
    "bypass",
    "installment",
    "payment plan",
    "financing",
    "50x100",
    "1/8 acre",
    "1/4 acre",
    "1/2 acre",
  ];

  const results: ScrapeItem[] = [];

  for (const url of urls) {
    try {
      const fetched = await fetchHtmlWithFallback(url);
      const html = fetched.html;
      const lowerHtml = html.toLowerCase();
      const text = stripHtml(html);
      const lowerText = text.toLowerCase();

      let title = "";
      let description = "";
      const images: string[] = [];

      const titleMatch =
        html.match(
          /<(?:meta|title)[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["']/i,
        ) ||
        html.match(/<title>([^<]+)<\/title>/i) ||
        html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (titleMatch) title = titleMatch[1].trim();

      const descMatch = html.match(
        /<meta[^>]*(?:property|name)=["'](?:og:)?description["'][^>]*content=["']([^"']+)["']/i,
      );
      if (descMatch) description = descMatch[1].trim();

      const imgOg = html.matchAll(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/gi,
      );
      for (const m of imgOg) images.push(m[1]);

      if (images.length === 0) {
        const imgTags = html.matchAll(
          /<img[^>]+(?:src|data-src|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi,
        );
        for (const m of imgTags) {
          if (m[1].includes("property") || m[1].includes("listing")) images.push(m[1]);
        }
      }

      const keywords: string[] = [];
      for (const f of features) {
        if (lowerHtml.includes(f)) keywords.push(f);
      }

      let price: number | undefined;
      let currency: string | undefined;
      let location: string | undefined;
      let plot_size: string | undefined;
      let land_category: string | undefined;
      let amenities: string[] | undefined;

      if (url.includes("buyrentkenya.com/")) {
        const priceMatch = text.match(/KSh\s*([\d,]+)/i);
        if (priceMatch) {
          const n = Number(priceMatch[1].replace(/,/g, ""));
          if (Number.isFinite(n)) price = n;
          currency = "KES";
        }

        const locMatch = text.match(/\b([A-Z][A-Za-z ]+ County)\b/);
        if (locMatch) location = locMatch[1].trim();

        const descBlock =
          text.match(/Land Description\s+([\s\S]*?)\s+Land Features/i) ||
          text.match(/Land Description\s+([\s\S]*?)\s+Created At:/i) ||
          text.match(/Land Description\s+([\s\S]*?)\s+Similar Properties/i);
        if (!description && descBlock) description = descBlock[1].trim();

        const acreageMatch = (description || text).match(/\b(\d+(?:\.\d+)?)\s*(?:ac|acre|acres)\b/i);
        if (acreageMatch) plot_size = `${acreageMatch[1]} acres`;

        if (lowerText.includes("freehold")) land_category = "freehold";
        else if (lowerText.includes("leasehold")) land_category = "leasehold";

        const nearbyBlock =
          text.match(/Nearby\s+([\s\S]*?)\s+Similar Properties/i) ||
          text.match(/Nearby\s+([\s\S]*?)\s+Created At:/i) ||
          text.match(/Nearby\s+([\s\S]*?)\s+Land Features/i);
        if (nearbyBlock) {
          const lines = nearbyBlock[1]
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => /^[A-Za-z][A-Za-z \-]{1,40}$/.test(s));
          amenities = uniq(lines);
        }

        if (!title && description) {
          const first = description.split("\n").map((s) => s.trim()).filter(Boolean)[0];
          if (first) title = first.slice(0, 80);
        }
      }

      if (!title) {
        const firstLine = text.split("\n").map((s) => s.trim()).filter(Boolean)[0];
        if (firstLine) title = firstLine.slice(0, 80);
      }
      if (!description) {
        const lines = text
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
        description = lines.slice(1, 8).join("\n").trim();
      }

      results.push({
        url,
        title,
        description,
        images: uniq(images),
        keywords: uniq([...(keywords || []), ...(amenities || [])]),
        price,
        currency,
        location,
        plot_size,
        land_category,
        amenities,
      });
    } catch (e) {
      results.push({ url, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return json({ items: results }, { status: 200 });
});

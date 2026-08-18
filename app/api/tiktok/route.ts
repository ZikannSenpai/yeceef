import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanTag(input: string) {
  return input.replace(/^#/, "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function pickJson(html: string) {
  const patterns = [
    /<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/i,
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (!m) continue;
    try { return JSON.parse(m[1]); } catch {}
  }
  return null;
}

function collectNumbers(value: unknown, out: number[] = []) {
  if (typeof value === "number" && Number.isFinite(value)) out.push(value);
  else if (Array.isArray(value)) value.slice(0, 120).forEach(v => collectNumbers(v, out));
  else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).slice(0, 120).forEach(v => collectNumbers(v, out));
  return out;
}

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return "-";
  return Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = cleanTag(searchParams.get("tag") || "MargaYeceFamily");
  if (!tag) return NextResponse.json({ error: "Tag kosong" }, { status: 400 });

  const url = `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        "accept-language": "id-ID,id;q=0.9,en;q=0.8",
        accept: "text/html,application/xhtml+xml"
      },
      next: { revalidate: 900 }
    });
    if (!res.ok) throw new Error(`TikTok ${res.status}`);
    const html = await res.text();
    const data = pickJson(html);

    let videos = 0;
    let views = 0;
    let items: Array<{ id: string; desc: string; views: number; cover: string; url: string }> = [];

    if (data?.ChallengePage) {
      const challenge = data.ChallengePage.challengeInfo?.challenge || data.ChallengePage.challenge;
      const stats = data.ChallengePage.challengeInfo?.stats || data.ChallengePage.stats;
      videos = Number(stats?.videoCount || 0);
      views = Number(stats?.viewCount || 0);
      void challenge;
    }

    const itemModule = data?.ItemModule || data?.props?.pageProps?.itemList || data?.props?.pageProps?.items;
    if (itemModule && typeof itemModule === "object") {
      const raw = Array.isArray(itemModule) ? itemModule : Object.values(itemModule as Record<string, unknown>);
      items = raw.map((item: any) => ({
        id: String(item?.id || item?.itemId || ""),
        desc: String(item?.desc || "TikTok video"),
        views: Number(item?.stats?.playCount || item?.stats?.play_count || item?.playCount || 0),
        cover: String(item?.video?.cover || item?.video?.dynamicCover || item?.video?.originCover || ""),
        url: item?.author?.uniqueId && item?.id ? `https://www.tiktok.com/@${item.author.uniqueId}/video/${item.id}` : url
      })).filter((v: any) => v.id);
    }

    if (!videos || !views) {
      const nums = collectNumbers(data).filter(n => n > 1000);
      videos = videos || Math.max(0, ...nums.filter(n => n < 1_000_000));
      views = views || Math.max(0, ...nums.filter(n => n >= 1_000_000));
    }

    items.sort((a,b) => b.views - a.views);
    return NextResponse.json({
      ok: true,
      tag,
      videos,
      views,
      videosLabel: formatCompact(videos),
      viewsLabel: formatCompact(views),
      topVideos: items.slice(0, 5)
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      tag,
      videos: null,
      views: null,
      videosLabel: "scrape gagal",
      viewsLabel: "scrape gagal",
      topVideos: [],
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}

import { NextRequest, NextResponse } from "next/server";

function getScripts(html: string) {
    const result: any[] = [];

    const regex = /<script[^>]+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;

    while ((match = regex.exec(html))) {
        try {
            result.push({
                id: match[1],
                data: JSON.parse(match[2])
            });
        } catch {}
    }

    return result;
}

function scan(obj: any, videos: any[]) {
    if (!obj || typeof obj !== "object") return;

    if (obj.id && obj.stats && obj.video && obj.author) {
        videos.push(obj);
    }

    if (Array.isArray(obj)) {
        for (const item of obj) scan(item, videos);
    } else {
        for (const value of Object.values(obj)) {
            scan(value, videos);
        }
    }
}

export async function GET(req: NextRequest) {
    try {
        const tag = req.nextUrl.searchParams
            .get("tag")
            ?.replace(/^#/, "")
            .trim();

        if (!tag) {
            return NextResponse.json({
                ok: false,
                error: "tag wajib diisi"
            });
        }

        const res = await fetch(
            `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`,
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9"
                },
                cache: "no-store"
            }
        );

        const html = await res.text();

        const scripts = getScripts(html);

        const videos: any[] = [];

        for (const script of scripts) {
            scan(script.data, videos);
        }

        const unique = new Map<string, any>();

        for (const video of videos) {
            unique.set(String(video.id), video);
        }

        const list = [...unique.values()];

        const totalViews = list.reduce(
            (total, video) => total + Number(video.stats?.playCount || 0),
            0
        );

        return NextResponse.json({
            ok: true,
            tag,
            hashtag: `#${tag}`,
            totalVideos: list.length,
            totalViews,
            videos: list.map(video => ({
                id: video.id,
                views: Number(video.stats?.playCount || 0)
            }))
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Scrape gagal"
            },
            {
                status: 500
            }
        );
    }
}

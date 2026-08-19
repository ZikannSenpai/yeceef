import { NextRequest, NextResponse } from "next/server";

function cleanTag(tag: string) {
    return tag
        .replace(/^#/, "")
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "");
}

function findDeep(obj: any, keys: string[]): any {
    if (!obj || typeof obj !== "object") return null;

    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
            return obj[key];
        }
    }

    for (const value of Object.values(obj)) {
        const result = findDeep(value, keys);
        if (result !== null) return result;
    }

    return null;
}

function parseScript(html: string, id: string) {
    const regex = new RegExp(
        `<script[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,
        "i"
    );

    const match = html.match(regex);
    if (!match?.[1]) return null;

    try {
        return JSON.parse(match[1]);
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rawTag = searchParams.get("tag");

        if (!rawTag) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Parameter tag wajib diisi"
                },
                { status: 400 }
            );
        }

        const tag = cleanTag(rawTag);

        if (!tag) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Hashtag tidak valid"
                },
                { status: 400 }
            );
        }

        const url = `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                Referer: "https://www.tiktok.com/"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    tag,
                    error: `TikTok HTTP ${response.status}`
                },
                { status: response.status }
            );
        }

        const html = await response.text();

        let data =
            parseScript(html, "SIGI_STATE") ||
            parseScript(html, "__UNIVERSAL_DATA_FOR_REHYDRATION__") ||
            parseScript(html, "__NEXT_DATA__");

        if (!data) {
            return NextResponse.json({
                ok: false,
                tag,
                totalVideos: 0,
                totalViews: 0,
                error: "Data hashtag TikTok tidak ditemukan"
            });
        }

        /*
         * TikTok bisa berubah struktur JSON-nya.
         * Cari object challenge/hashtag secara recursive.
         */

        const challengeInfo = findDeep(data, ["challengeInfo", "challenge"]);

        const stats =
            challengeInfo?.stats ||
            challengeInfo?.challengeStats ||
            findDeep(data, ["challengeStats", "stats"]);

        const totalVideos =
            Number(
                stats?.videoCount ??
                    stats?.video_count ??
                    findDeep(data, ["videoCount", "video_count"]) ??
                    0
            ) || 0;

        const totalViews =
            Number(
                stats?.viewCount ??
                    stats?.view_count ??
                    findDeep(data, ["viewCount", "view_count"]) ??
                    0
            ) || 0;

        return NextResponse.json({
            ok: true,
            tag,
            hashtag: `#${tag}`,
            totalVideos,
            totalViews
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Scrape gagal"
            },
            { status: 500 }
        );
    }
}

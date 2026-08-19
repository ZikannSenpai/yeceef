import { NextRequest, NextResponse } from "next/server";

function cleanTag(tag: string) {
    return tag
        .replace(/^#/, "")
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, "");
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

function walk(value: any, callback: (obj: Record<string, any>) => void) {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
        for (const item of value) {
            walk(item, callback);
        }
        return;
    }

    callback(value);

    for (const child of Object.values(value)) {
        walk(child, callback);
    }
}

function toNumber(value: any): number | null {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string") {
        return null;
    }

    const text = value.trim().toLowerCase();

    if (!text) return null;

    const clean = text.replace(/,/g, "");

    const direct = Number(clean);

    if (Number.isFinite(direct)) {
        return direct;
    }

    const match = clean.match(/^([\d.]+)\s*(k|m|b|t)?$/);

    if (!match) return null;

    const num = Number(match[1]);
    const suffix = match[2];

    if (!Number.isFinite(num)) return null;

    const multiplier =
        suffix === "k"
            ? 1_000
            : suffix === "m"
            ? 1_000_000
            : suffix === "b"
            ? 1_000_000_000
            : suffix === "t"
            ? 1_000_000_000_000
            : 1;

    return num * multiplier;
}

function findStats(data: any) {
    let totalVideos: number | null = null;
    let totalViews: number | null = null;

    walk(data, obj => {
        /*
         * Bentuk umum:
         *
         * {
         *   stats: {
         *      videoCount: 123,
         *      viewCount: 456
         *   }
         * }
         */

        const stats = obj.stats || obj.challengeStats || obj.statsInfo;

        if (stats && typeof stats === "object") {
            const videos = toNumber(
                stats.videoCount ??
                    stats.video_count ??
                    stats.videoNum ??
                    stats.video_num ??
                    stats.videoNumber
            );

            const views = toNumber(
                stats.viewCount ??
                    stats.view_count ??
                    stats.viewNum ??
                    stats.view_num ??
                    stats.viewNumber
            );

            if (videos !== null && videos > 0 && totalVideos === null) {
                totalVideos = videos;
            }

            if (views !== null && views > 0 && totalViews === null) {
                totalViews = views;
            }
        }

        /*
         * Beberapa response TikTok langsung
         * naro field di object.
         */

        const videos = toNumber(
            obj.videoCount ?? obj.video_count ?? obj.videoNum ?? obj.video_num
        );

        const views = toNumber(
            obj.viewCount ?? obj.view_count ?? obj.viewNum ?? obj.view_num
        );

        if (videos !== null && videos > 0 && totalVideos === null) {
            totalVideos = videos;
        }

        if (views !== null && views > 0 && totalViews === null) {
            totalViews = views;
        }
    });

    return {
        totalVideos: totalVideos ?? 0,
        totalViews: totalViews ?? 0
    };
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
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

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
                {
                    status: response.status
                }
            );
        }

        const html = await response.text();

        const scripts = [
            "SIGI_STATE",
            "__UNIVERSAL_DATA_FOR_REHYDRATION__",
            "__NEXT_DATA__"
        ];

        let data: any = null;
        let source: string | null = null;

        for (const id of scripts) {
            const parsed = parseScript(html, id);

            if (parsed) {
                data = parsed;
                source = id;
                break;
            }
        }

        if (!data) {
            return NextResponse.json({
                ok: false,
                tag,
                hashtag: `#${tag}`,
                totalVideos: 0,
                totalViews: 0,
                source: null,
                error: "JSON data TikTok tidak ditemukan"
            });
        }

        const stats = findStats(data);

        return NextResponse.json({
            ok: true,
            tag,
            hashtag: `#${tag}`,

            totalVideos: stats.totalVideos,

            totalViews: stats.totalViews,

            source
        });

        const candidates: any[] = [];

        walk(data, obj => {
            const keys = Object.keys(obj);

            if (
                keys.some(key =>
                    /challenge|hashtag|video|view|stats/i.test(key)
                )
            ) {
                candidates.push({
                    keys,
                    data: obj
                });
            }
        });

        return NextResponse.json({
            ok: true,
            tag,
            source,
            candidates: candidates.slice(0, 100)
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

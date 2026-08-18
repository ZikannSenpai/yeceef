import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanTag(input: string) {
    return input
        .replace(/^#/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
}

function formatCompact(n: number) {
    if (!Number.isFinite(n) || n <= 0) return "0";

    return Intl.NumberFormat("id-ID", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(n);
}

function parseNumber(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== "string") return 0;

    const cleaned = value
        .replace(/,/g, "")
        .replace(/\./g, "")
        .replace(/\s/g, "");

    const n = Number(cleaned);

    return Number.isFinite(n) ? n : 0;
}

function getNested(obj: any, paths: string[][]) {
    for (const path of paths) {
        let current = obj;

        for (const key of path) {
            if (
                current === null ||
                current === undefined ||
                typeof current !== "object"
            ) {
                current = undefined;
                break;
            }

            current = current[key];
        }

        if (current !== undefined && current !== null) {
            return current;
        }
    }

    return undefined;
}

function extractScripts(html: string) {
    const result: Record<string, any> = {};

    const regex =
        /<script[^>]*id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;

    while ((match = regex.exec(html))) {
        const id = match[1];
        const content = match[2].trim();

        if (!content) continue;

        try {
            result[id] = JSON.parse(content);
        } catch {
            // skip
        }
    }

    return result;
}

function findObjects(
    value: unknown,
    predicate: (obj: Record<string, any>) => boolean,
    result: Record<string, any>[] = [],
    depth = 0
) {
    if (depth > 12 || result.length >= 100) return result;

    if (Array.isArray(value)) {
        for (const item of value) {
            findObjects(item, predicate, result, depth + 1);

            if (result.length >= 100) break;
        }

        return result;
    }

    if (!value || typeof value !== "object") {
        return result;
    }

    const obj = value as Record<string, any>;

    try {
        if (predicate(obj)) {
            result.push(obj);
        }
    } catch {}

    for (const child of Object.values(obj).slice(0, 200)) {
        findObjects(child, predicate, result, depth + 1);

        if (result.length >= 100) break;
    }

    return result;
}

function findChallenge(data: any, tag: string) {
    const objects = findObjects(
        data,
        (obj) => {
            const name =
                obj.challengeName ||
                obj.uniqueId ||
                obj.title ||
                obj.name;

            return (
                typeof name === "string" &&
                name.toLowerCase().replace(/^#/, "") === tag.toLowerCase()
            );
        }
    );

    return objects[0] || null;
}

function findStats(data: any) {
    const candidates = findObjects(
        data,
        (obj) => {
            const hasVideo =
                obj.videoCount !== undefined ||
                obj.video_count !== undefined;

            const hasViews =
                obj.viewCount !== undefined ||
                obj.view_count !== undefined;

            return hasVideo || hasViews;
        }
    );

    for (const obj of candidates) {
        const videos = parseNumber(
            obj.videoCount ?? obj.video_count
        );

        const views = parseNumber(
            obj.viewCount ?? obj.view_count
        );

        if (videos > 0 || views > 0) {
            return {
                videos,
                views,
            };
        }
    }

    return {
        videos: 0,
        views: 0,
    };
}

function findVideoItems(data: any, fallbackUrl: string) {
    const objects = findObjects(
        data,
        (obj) => {
            return Boolean(
                obj.id &&
                (
                    obj.desc !== undefined ||
                    obj.description !== undefined
                ) &&
                (
                    obj.stats ||
                    obj.playCount !== undefined ||
                    obj.play_count !== undefined
                )
            );
        }
    );

    const videos: Array<{
        id: string;
        desc: string;
        views: number;
        cover: string;
        url: string;
    }> = [];

    const used = new Set<string>();

    for (const item of objects) {
        const id = String(item.id);

        if (!id || used.has(id)) continue;

        const stats = item.stats || item.statistics || {};

        const views = parseNumber(
            stats.playCount ??
                stats.play_count ??
                stats.viewCount ??
                item.playCount ??
                item.play_count ??
                item.viewCount
        );

        const author =
            item.author?.uniqueId ||
            item.author?.unique_id ||
            item.author?.nickname ||
            item.author?.name ||
            "";

        const cover =
            item.video?.cover ||
            item.video?.originCover ||
            item.video?.dynamicCover ||
            item.cover ||
            "";

        videos.push({
            id,
            desc: String(
                item.desc ||
                    item.description ||
                    "TikTok video"
            ),
            views,
            cover: String(cover),
            url:
                author && id
                    ? `https://www.tiktok.com/@${author}/video/${id}`
                    : fallbackUrl,
        });

        used.add(id);

        if (videos.length >= 20) break;
    }

    return videos;
}

function extractMeta(html: string, property: string) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regexes = [
        new RegExp(
            `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
            "i"
        ),
        new RegExp(
            `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
            "i"
        ),
        new RegExp(
            `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
            "i"
        ),
    ];

    for (const regex of regexes) {
        const match = html.match(regex);

        if (match?.[1]) {
            return match[1];
        }
    }

    return "";
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const tag = cleanTag(
        searchParams.get("tag") || "MargaYeceFamily"
    );

    if (!tag) {
        return NextResponse.json(
            {
                ok: false,
                error: "Tag kosong",
            },
            {
                status: 400,
            }
        );
    }

    const url = `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

                "Accept-Language":
                    "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

                "Cache-Control":
                    "no-cache",

                Pragma:
                    "no-cache",

                Referer:
                    "https://www.tiktok.com/",
            },

            next: {
                revalidate: 900,
            },
        });

        if (!res.ok) {
            throw new Error(`TikTok HTTP ${res.status}`);
        }

        const html = await res.text();

        if (!html || html.length < 500) {
            throw new Error("Response TikTok kosong");
        }

        const scripts = extractScripts(html);

        let videos = 0;
        let views = 0;

        let sourceData: any[] = [];

        for (const [id, value] of Object.entries(scripts)) {
            if (
                id === "SIGI_STATE" ||
                id === "__NEXT_DATA__" ||
                id === "__UNIVERSAL_DATA_FOR_REHYDRATION__" ||
                id === "SIGI_STATE_WEB"
            ) {
                sourceData.push(value);
            }
        }

        const allData = sourceData;

        /*
         * Cari challenge / hashtag stats
         */

        for (const data of allData) {
            const challenge = findChallenge(data, tag);

            if (challenge) {
                const stats =
                    challenge.stats ||
                    challenge.challengeInfo?.stats ||
                    challenge.challengeStats ||
                    {};

                const foundVideos = parseNumber(
                    stats.videoCount ??
                        stats.video_count ??
                        challenge.videoCount ??
                        challenge.video_count
                );

                const foundViews = parseNumber(
                    stats.viewCount ??
                        stats.view_count ??
                        challenge.viewCount ??
                        challenge.view_count
                );

                if (foundVideos > videos) {
                    videos = foundVideos;
                }

                if (foundViews > views) {
                    views = foundViews;
                }
            }

            const stats = findStats(data);

            if (stats.videos > videos) {
                videos = stats.videos;
            }

            if (stats.views > views) {
                views = stats.views;
            }
        }

        /*
         * Cari video
         */

        let items: Array<{
            id: string;
            desc: string;
            views: number;
            cover: string;
            url: string;
        }> = [];

        for (const data of allData) {
            const found = findVideoItems(data, url);

            for (const video of found) {
                if (!items.some((x) => x.id === video.id)) {
                    items.push(video);
                }
            }
        }

        /*
         * Fallback dari metadata HTML
         */

        if (!videos) {
            const description =
                extractMeta(html, "og:description");

            const match = description.match(
                /([\d.,]+)\s*(?:Videos?|Video)/i
            );

            if (match) {
                videos = parseNumber(match[1]);
            }
        }

        if (!views) {
            const description =
                extractMeta(html, "og:description");

            const matches = description.match(
                /([\d.,]+)\s*(?:Views?|Views)/gi
            );

            if (matches?.length) {
                views = Math.max(
                    ...matches.map((x) =>
                        parseNumber(
                            x.replace(
                                /\s*(?:Views?|Views)/i,
                                ""
                            )
                        )
                    )
                );
            }
        }

        /*
         * Sort video berdasarkan views
         */

        items.sort(
            (a, b) => b.views - a.views
        );

        /*
         * Kalau TikTok mengembalikan HTML tapi datanya
         * nggak bisa dibaca, jangan pura-pura sukses.
         */

        const hasData =
            videos > 0 ||
            views > 0 ||
            items.length > 0;

        return NextResponse.json({
            ok: hasData,
            tag,

            videos,
            views,

            videosLabel:
                videos > 0
                    ? formatCompact(videos)
                    : "0",

            viewsLabel:
                views > 0
                    ? formatCompact(views)
                    : "0",

            topVideos:
                items.slice(0, 5),

            debug: {
                htmlLength: html.length,
                scripts: Object.keys(scripts),
                videosFound: items.length,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,

                tag,

                videos: 0,
                views: 0,

                videosLabel: "scrape gagal",
                viewsLabel: "scrape gagal",

                topVideos: [],

                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            {
                status: 200,
            }
        );
    }
}
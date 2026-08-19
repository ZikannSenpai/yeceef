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

function simplify(value: any, depth = 0): any {
    if (depth > 4) {
        return "[MAX_DEPTH]";
    }

    if (
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        if (typeof value === "string" && value.length > 500) {
            return value.slice(0, 500) + "...";
        }

        return value;
    }

    if (Array.isArray(value)) {
        return value.slice(0, 10).map(item => simplify(item, depth + 1));
    }

    if (typeof value === "object") {
        const result: Record<string, any> = {};

        for (const [key, val] of Object.entries(value)) {
            result[key] = simplify(val, depth + 1);
        }

        return result;
    }

    return String(value);
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
                {
                    status: 400
                }
            );
        }

        const tag = cleanTag(rawTag);

        if (!tag) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Hashtag tidak valid"
                },
                {
                    status: 400
                }
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

        const scriptIds = [
            "SIGI_STATE",
            "__UNIVERSAL_DATA_FOR_REHYDRATION__",
            "__NEXT_DATA__"
        ];

        let data: any = null;
        let source: string | null = null;

        for (const id of scriptIds) {
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
                source: null,
                error: "JSON TikTok tidak ditemukan"
            });
        }

        const candidates: any[] = [];

        walk(data, obj => {
            const keys = Object.keys(obj);

            const matched = keys.some(key =>
                /challenge|hashtag|video|view|stats/i.test(key)
            );

            if (!matched) return;

            candidates.push({
                keys,
                data: simplify(obj)
            });
        });

        return NextResponse.json({
            ok: true,
            tag,
            hashtag: `#${tag}`,
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

import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanTag(input: string) {
    return input
        .replace(/^#/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
}

function getStructure(value: any, depth = 0): any {
    if (depth > 6) {
        return "[max-depth]";
    }

    if (value === null) {
        return "null";
    }

    if (Array.isArray(value)) {
        return {
            type: "array",
            length: value.length,
            first: value.length > 0 ? getStructure(value[0], depth + 1) : null
        };
    }

    if (typeof value !== "object") {
        return typeof value;
    }

    const result: Record<string, any> = {};

    for (const [key, val] of Object.entries(value)) {
        result[key] = getStructure(val, depth + 1);
    }

    return result;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const tag = cleanTag(searchParams.get("tag") || "fyp");

    if (!tag) {
        return NextResponse.json(
            {
                ok: false,
                error: "Tag kosong"
            },
            {
                status: 400
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

                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

                Referer: "https://www.tiktok.com/"
            },

            cache: "no-store"
        });

        const html = await res.text();

        if (!res.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    status: res.status,
                    error: `TikTok HTTP ${res.status}`,
                    htmlLength: html.length
                },
                {
                    status: 200
                }
            );
        }

        const match = html.match(
            /<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i
        );

        if (!match) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "UNIVERSAL_DATA_FOR_REHYDRATION tidak ditemukan",

                    htmlLength: html.length,

                    scriptIds: [
                        ...html.matchAll(/<script[^>]*id=["']([^"']+)["']/gi)
                    ].map(m => m[1])
                },
                {
                    status: 200
                }
            );
        }

        let data: any;

        try {
            data = JSON.parse(match[1]);
        } catch (error) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "JSON TikTok gagal diparse",

                    htmlLength: html.length,

                    parseError:
                        error instanceof Error ? error.message : "Unknown error"
                },
                {
                    status: 200
                }
            );
        }

        return NextResponse.json(
            {
                ok: true,

                tag,

                htmlLength: html.length,

                rootKeys:
                    data && typeof data === "object" ? Object.keys(data) : [],

                structure: getStructure(data)
            },
            {
                status: 200
            }
        );
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,

                tag,

                error: error instanceof Error ? error.message : "Unknown error"
            },
            {
                status: 200
            }
        );
    }
}

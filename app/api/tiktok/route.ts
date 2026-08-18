import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanTag(input: string) {
    return input
        .replace(/^#/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
}

function findRelevant(value: any, path = "$", result: any[] = [], depth = 0) {
    if (depth > 15 || result.length >= 100) return result;

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            findRelevant(item, `${path}[${index}]`, result, depth + 1);
        });

        return result;
    }

    if (!value || typeof value !== "object") {
        return result;
    }

    for (const [key, val] of Object.entries(value)) {
        const lower = key.toLowerCase();

        if (
            lower.includes("challenge") ||
            lower.includes("hashtag") ||
            lower.includes("itemlist") ||
            lower.includes("item_list") ||
            lower.includes("video") ||
            lower.includes("stats") ||
            lower.includes("count") ||
            lower.includes("view")
        ) {
            result.push({
                path: `${path}.${key}`,
                type: Array.isArray(val)
                    ? "array"
                    : val === null
                    ? "null"
                    : typeof val,
                length: Array.isArray(val) ? val.length : undefined,
                keys:
                    val && typeof val === "object" && !Array.isArray(val)
                        ? Object.keys(val).slice(0, 30)
                        : undefined,
                sample:
                    typeof val === "string" ||
                    typeof val === "number" ||
                    typeof val === "boolean"
                        ? val
                        : undefined
            });
        }

        findRelevant(val, `${path}.${key}`, result, depth + 1);

        if (result.length >= 100) break;
    }

    return result;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const tag = cleanTag(searchParams.get("tag") || "margaycf");

    const url = `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`;

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

                Referer: "https://www.tiktok.com/"
            },

            cache: "no-store"
        });

        const html = await res.text();

        const match = html.match(
            /<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i
        );

        if (!match) {
            return NextResponse.json({
                ok: false,
                error: "Universal data tidak ditemukan",
                htmlLength: html.length
            });
        }

        let data: any;

        try {
            data = JSON.parse(match[1]);
        } catch {
            return NextResponse.json({
                ok: false,
                error: "Gagal parse JSON TikTok"
            });
        }

        const relevant = findRelevant(data);

        return NextResponse.json({
            ok: true,
            tag,
            totalFound: relevant.length,
            relevant
        });
    } catch (error) {
        return NextResponse.json({
            ok: false,
            tag,
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

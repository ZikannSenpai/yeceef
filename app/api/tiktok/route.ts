import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const tag = req.nextUrl.searchParams.get("tag")?.replace("#", "");

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
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
            },
            cache: "no-store"
        }
    );

    const html = await res.text();

    const match =
        html.match(
            /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
        ) ||
        html.match(/<script[^>]+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);

    if (!match) {
        return NextResponse.json({
            ok: false,
            error: "data TikTok tidak ditemukan"
        });
    }

    const data = JSON.parse(match[1]);

    const result: Record<string, any> = {};

    function scan(obj: any) {
        if (!obj || typeof obj !== "object") return;

        for (const [key, value] of Object.entries(obj)) {
            if (
                /videoCount|viewCount|video_count|view_count|stats/i.test(key)
            ) {
                result[key] = value;
            }

            scan(value);
        }
    }

    scan(data);

    return NextResponse.json({
        ok: true,
        tag,
        data: result
    });
}

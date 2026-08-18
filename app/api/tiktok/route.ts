import { NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanTag(input: string) {
    return input
        .replace(/^#/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const tag = cleanTag(searchParams.get("tag") || "fyp");

    const url = `https://www.tiktok.com/tag/${encodeURIComponent(tag)}`;

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            cache: "no-store"
        });

        const html = await res.text();

        const match = html.match(
            /<script[^>]*id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i
        );

        if (!match) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "UNIVERSAL_DATA tidak ditemukan",
                    htmlLength: html.length
                },
                { status: 200 }
            );
        }

        let data: unknown;

        try {
            data = JSON.parse(match[1]);
        } catch {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Gagal parse JSON TikTok",
                    htmlLength: html.length
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                ok: true,
                tag,
                data
            },
            {
                status: 200
            }
        );
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 200 }
        );
    }
}

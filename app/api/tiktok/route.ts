import { NextRequest, NextResponse } from "next/server";

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

        const url =
            `https://m.tiktok.com/node/share/tag/${encodeURIComponent(tag)}` +
            `?uniqueId=${encodeURIComponent(tag)}&appId=1233`;

        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
                Accept: "application/json"
            },
            cache: "no-store"
        });

        const text = await res.text();

        let data: any;

        try {
            data = JSON.parse(text);
        } catch {
            const match = text.match(
                /<script[^>]+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/
            );

            if (!match) {
                return NextResponse.json({
                    ok: false,
                    error: "TikTok mengembalikan HTML dan data hashtag tidak ditemukan"
                });
            }

            data = JSON.parse(match[1]);
        }

        if (!data?.challengeInfo) {
            return NextResponse.json({
                ok: false,
                tag,
                error: "challengeInfo tidak ditemukan",
                data
            });
        }

        const info = data.challengeInfo;

        return NextResponse.json({
            ok: true,
            tag,
            hashtag: `#${tag}`,
            totalVideos: info.stats?.videoCount ?? info.stats?.video_count ?? 0,
            totalViews: info.stats?.viewCount ?? info.stats?.view_count ?? 0
        });
    } catch (error: any) {
        return NextResponse.json({
            ok: false,
            error: error?.message || "Scrape gagal"
        });
    }
}

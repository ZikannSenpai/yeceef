# Marga Yece Family

Next.js + Tailwind comic/manga portal untuk Marga Yece Family.

## Jalankan

```bash
npm install
npm run dev
```

## TikTok scrape
Route: `GET /api/tiktok?tag=margayecefamily`

Route melakukan server-side fetch halaman hashtag TikTok dan mencoba membaca `SIGI_STATE` / `__NEXT_DATA__`. Jika struktur TikTok berubah atau request ditolak, UI tetap menampilkan data fallback agar layout tidak blank.

## Vercel
Project ini siap dideploy ke Vercel. Jangan taruh secret scraper/API key ke repository. Untuk scraper eksternal berbayar, tambahkan env variable server-side dan ubah route `/api/tiktok`.

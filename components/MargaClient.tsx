"use client";

import Image from "next/image";
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Info,
    ShieldCheck,
    Users,
    Eye,
    Hash,
    ArrowUpRight
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Gen = {
    id: number;
    title: string;
    desc: string;
    members: number;
    status?: string;
};

type Admin = {
    name: string;
    username: string;
    title: string;
    desc: string;
    avatar: string;
};

type Anggota = {
    id: number | string;
    nama: string;
    tiktok: string;
    gen: number;
    role: string;
    status: string;
};

const FALLBACK_VIDEOS = [
    {
        id: "1",
        views: 182000,
        desc: "reyy prengset",
        cover: "https://cdn.discordapp.com/attachments/1435475294852091966/1539185702221385748/IMG-20260814-WA0010.jpg?ex=6a8565e4&is=6a841464&hm=72ca9cdea5bc64e0f4f32f3a115dcb92ca9ffff6e0150e025033050fedaf0a78&",
        url: "https://www.tiktok.com/reyyxprst"
    }
];

function useReveal() {
    useEffect(() => {
        const els = Array.from(
            document.querySelectorAll<HTMLElement>(".reveal")
        );

        const io = new IntersectionObserver(
            entries =>
                entries.forEach(entry => {
                    entry.target.classList.toggle(
                        "is-visible",
                        entry.isIntersecting
                    );

                    entry.target.classList.toggle(
                        "is-hidden",
                        !entry.isIntersecting &&
                            entry.boundingClientRect.top < 0
                    );
                }),
            { threshold: 0.14 }
        );

        els.forEach(el => io.observe(el));

        return () => io.disconnect();
    }, []);
}

function ScrollRow({
    children,
    className = ""
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);

    const scroll = (dir: number) =>
        ref.current?.scrollBy({
            left: dir * 290,
            behavior: "smooth"
        });

    return (
        <div className="relative">
            <button
                aria-label="Geser kiri"
                onClick={() => scroll(-1)}
                className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-cyan-300/50 bg-black/80 p-2 text-cyan-300"
            >
                <ChevronLeft size={18} />
            </button>

            <div
                ref={ref}
                className={`scroll-row flex snap-x gap-4 overflow-x-auto px-8 pb-2 ${className}`}
            >
                {children}
            </div>

            <button
                aria-label="Geser kanan"
                onClick={() => scroll(1)}
                className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-cyan-300/50 bg-black/80 p-2 text-cyan-300"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

function Counter({ value }: { value: number }) {
    return <span>{new Intl.NumberFormat("id-ID").format(value)}</span>;
}

export default function MargaClient() {
    useReveal();

    const [gens, setGens] = useState<Gen[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [anggota, setAnggota] = useState<Anggota[]>([]);

    const [gen, setGen] = useState(0);
    const [stats, setStats] = useState<any>(null);
    const [pressed, setPressed] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/marga")
            .then(r => r.json())
            .then(data => {
                setGens(data.gens || []);
                setAdmins(data.admins || []);
                setAnggota(data.anggota || []);
            })
            .catch(() => null);
    }, []);

    useEffect(() => {
        fetch("/api/tiktok?tag=margaycf")
            .then(r => r.json())
            .then(setStats)
            .catch(() => null);
    }, []);

    const press = (id: string) => {
        setPressed(id);

        window.setTimeout(() => setPressed(null), 180);
    };

    const videos = stats?.topVideos?.length ? stats.topVideos : FALLBACK_VIDEOS;

    const totalMembers = anggota.length;

    const selectedGen =
        gens.length > 0 ? gens[Math.min(gen, gens.length - 1)] : null;

    return (
        <main className="manga-bg min-h-screen overflow-x-hidden">
            <header className="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#05070b]/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <a
                        href="#home"
                        className="comic-title font-black text-cyan-300"
                    >
                        YUZAKI CREATOR FAMILY
                    </a>

                    <nav className="hidden gap-5 text-xs font-bold uppercase tracking-widest text-slate-400 sm:flex">
                        <a href="#gen">Gen</a>
                        <a href="#members">Members</a>
                        <a href="#stats">Stats</a>
                        <a href="#rank">Rank</a>
                        <a href="#admin">Admin</a>
                    </nav>

                    <a
                        href="https://www.tiktok.com/tag/margaycf"
                        target="_blank"
                        rel="noreferrer"
                        className="sketch-btn rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-black text-slate-950"
                    >
                        #MARGAYCF
                    </a>
                </div>
            </header>

            <section
                id="home"
                className="reveal mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-14 md:grid-cols-[1.3fr_.7fr] md:pt-20"
            >
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">
                        <ShieldCheck size={14} />
                        Marga TikTok Anime
                    </div>

                    <h1 className="comic-title max-w-3xl text-5xl font-black leading-[.92] sm:text-7xl">
                        MARGA
                        <br />
                        <span className="text-cyan-300">
                            YUZAKI CREATOR
                        </span>{" "}
                        FAMILY.
                    </h1>

                    <p className="mt-6 max-w-xl text-sm leading-7 text-slate-400">
                        deskripsinya tanya deni🗿
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <a
                            href="#gen"
                            onMouseDown={() => press("explore")}
                            className={`sketch-btn press-zoom rounded-xl bg-blue-600 px-5 py-3 text-sm font-black ${
                                pressed === "explore" ? "pressed" : ""
                            }`}
                        >
                            JELAJAHI{" "}
                            <ArrowUpRight size={17} className="inline" />
                        </a>

                        <a
                            href="#admin"
                            onMouseDown={() => press("info")}
                            className={`sketch-btn press-zoom rounded-xl bg-transparent px-5 py-3 text-sm font-black ${
                                pressed === "info" ? "pressed" : ""
                            }`}
                        >
                            <Info size={17} className="mr-1 inline" />
                            INFO
                        </a>
                    </div>

                    <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                        <div className="manga-panel press-zoom rounded-xl p-4">
                            <p className="text-[10px] uppercase text-slate-500">
                                Generasi
                            </p>

                            <p className="mt-1 text-2xl font-black text-cyan-300">
                                {gens.length}
                            </p>
                        </div>

                        <div className="manga-panel press-zoom rounded-xl p-4">
                            <p className="text-[10px] uppercase text-slate-500">
                                Anggota
                            </p>

                            <p className="mt-1 text-2xl font-black">
                                <Counter value={totalMembers} />
                            </p>
                        </div>

                        <div className="manga-panel press-zoom rounded-xl p-4">
                            <p className="text-[10px] uppercase text-slate-500">
                                Status
                            </p>

                            <p className="mt-1 text-2xl font-black text-cyan-300">
                                LIVE
                            </p>
                        </div>
                    </div>
                </div>

                <div className="manga-panel screentone min-h-[320px] overflow-hidden rounded-2xl p-7 md:min-h-[410px]">
                    <div className="relative z-10 flex h-full flex-col justify-between">
                        <div className="flex justify-between text-[10px] font-bold tracking-[.3em] text-cyan-300">
                            <span>YCF FILE 01</span>
                            <span>EST. 2026</span>
                        </div>

                        <div>
                            <div className="mb-5 inline-block -rotate-3 border-2 border-cyan-300 px-3 py-1 text-xs font-black uppercase text-cyan-300">
                                Marga Anime
                            </div>

                            <p className="text-4xl font-black leading-none">
                                YCF
                                <br />
                                <span className="text-cyan-300">FMLY.</span>
                            </p>

                            <p className="mt-4 max-w-xs text-xs leading-6 text-slate-500">
                                Anime creator • editor • Designer • Programmer
                            </p>
                        </div>

                        <div className="flex items-end justify-between text-[10px] text-slate-500">
                            <span> ZikaNyawDev </span>
                            <span>///</span>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="gen"
                className="reveal border-y border-cyan-300/10 bg-black/20 py-14"
            >
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold tracking-[.24em] text-cyan-300">
                                01 / GENERASI MARGA
                            </p>

                            <h2 className="comic-title mt-2 text-3xl font-black">
                                GEN ARC
                            </h2>
                        </div>

                        <span className="text-xs text-slate-500">SWIPE →</span>
                    </div>

                    <ScrollRow>
                        {gens.map((g, i) => (
                            <button
                                key={g.id}
                                onClick={() => setGen(i)}
                                className={`manga-panel press-zoom min-w-[260px] snap-start rounded-2xl p-5 text-left ${
                                    gen === i ? "ring-2 ring-cyan-300" : ""
                                }`}
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-cyan-300">
                                            {String(g.id).padStart(2, "0")}
                                        </span>

                                        <span className="text-[10px] uppercase text-slate-500">
                                            {g.members} member
                                        </span>
                                    </div>

                                    <h3 className="mt-10 text-xl font-black">
                                        {g.title}
                                    </h3>

                                    <p className="mt-3 text-xs leading-6 text-slate-400">
                                        {g.desc}
                                    </p>

                                    <span
                                        className={`mt-4 inline-block rounded px-2 py-1 text-[9px] font-black ${
                                            g.status === "OPEN"
                                                ? "bg-cyan-300/10 text-cyan-300"
                                                : "bg-red-500/10 text-red-400"
                                        }`}
                                    >
                                        {g.status ||
                                            (g.members > 0 ? "OPEN" : "CLOSE")}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </ScrollRow>

                    {selectedGen && (
                        <div className="manga-panel mt-6 rounded-2xl p-6">
                            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[.2em] text-slate-500">
                                        Selected Arc
                                    </p>

                                    <p className="mt-1 text-2xl font-black text-cyan-300">
                                        {selectedGen.title}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {selectedGen.desc}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <a
                                        href="#members"
                                        className="sketch-btn rounded-xl bg-blue-600 px-4 py-3 text-xs font-black"
                                    >
                                        DAFTAR ANGGOTA
                                    </a>

                                    <a
                                        href="https://chat.whatsapp.com/G8A2tRpJ1UdF95WWFX0ujV?s=cl&p=a&ilr=0"
                                        className="sketch-btn rounded-xl bg-transparent px-4 py-3 text-xs font-black"
                                    >
                                        BERGABUNG
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section
                id="members"
                className="reveal mx-auto max-w-6xl px-4 py-14"
            >
                <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[.24em] text-cyan-300">
                        02 / POPULASI
                    </p>

                    <h2 className="comic-title mt-2 text-3xl font-black">
                        DAFTAR ANGGOTA
                    </h2>

                    <p className="mt-2 text-xs text-slate-500">
                        Total{" "}
                        <span className="text-cyan-300">{anggota.length}</span>{" "}
                        anggota terdaftar
                    </p>
                </div>

                <div className="manga-panel overflow-hidden rounded-2xl">
                    <div className="overflow-x-auto">
                        <div className="min-w-[700px]">
                            <table className="w-full text-left">
                                <thead className="border-b border-cyan-300/10 bg-cyan-300/5">
                                    <tr className="text-[10px] uppercase tracking-widest text-cyan-300">
                                        <th className="px-5 py-4">#</th>

                                        <th className="px-5 py-4">
                                            Nama Member
                                        </th>

                                        <th className="px-5 py-4">
                                            Nama TikTok
                                        </th>

                                        <th className="px-5 py-4">Gen</th>

                                        <th className="px-5 py-4">Role</th>

                                        <th className="px-5 py-4">Status</th>
                                    </tr>
                                </thead>
                            </table>

                            <div className="max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left">
                                    <tbody>
                                        {anggota.length > 0 ? (
                                            anggota.map((member, i) => (
                                                <tr
                                                    key={member.id ?? i}
                                                    className="border-b border-white/5 transition hover:bg-cyan-300/5"
                                                >
                                                    <td className="px-5 py-4 text-xs text-slate-500">
                                                        {String(i + 1).padStart(
                                                            2,
                                                            "0"
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-black">
                                                            {member.nama}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <a
                                                            href={`https://www.tiktok.com/@${member.tiktok.replace(
                                                                /^@/,
                                                                ""
                                                            )}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-cyan-300 hover:underline"
                                                        >
                                                            @
                                                            {member.tiktok.replace(
                                                                /^@/,
                                                                ""
                                                            )}
                                                        </a>
                                                    </td>

                                                    <td className="px-5 py-4 text-xs">
                                                        GEN {member.gen}
                                                    </td>

                                                    <td className="px-5 py-4 text-xs text-slate-400">
                                                        {member.role}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`rounded px-2 py-1 text-[9px] font-black ${
                                                                member.status?.toLowerCase() ===
                                                                "aktif"
                                                                    ? "bg-cyan-300/10 text-cyan-300"
                                                                    : "bg-red-500/10 text-red-400"
                                                            }`}
                                                        >
                                                            {member.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-5 py-10 text-center text-xs text-slate-500"
                                                >
                                                    Belum ada anggota.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="stats" className="reveal mx-auto max-w-6xl px-4 py-14">
                <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[.24em] text-cyan-300">
                        03 / TIKTOK DATA
                    </p>

                    <h2 className="comic-title mt-2 text-3xl font-black">
                        STATISTIK TAGAR
                    </h2>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    <div className="manga-panel press-zoom rounded-2xl p-6">
                        <div className="relative z-10">
                            <Hash className="text-cyan-300" />

                            <p className="mt-8 text-3xl font-black">
                                #{stats?.tag || "margayecefamily"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                hashtag utama
                            </p>
                        </div>
                    </div>

                    <div className="manga-panel press-zoom rounded-2xl p-6">
                        <div className="relative z-10">
                            <Users className="text-cyan-300" />

                            <p className="mt-8 text-3xl font-black">
                                {stats?.videosLabel || "loading"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                video terdeteksi
                            </p>
                        </div>
                    </div>

                    <div className="manga-panel press-zoom rounded-2xl p-6">
                        <div className="relative z-10">
                            <Eye className="text-cyan-300" />

                            <p className="mt-8 text-3xl font-black">
                                {stats?.viewsLabel || "loading"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                total views hashtag
                            </p>
                        </div>
                    </div>
                </div>

                <div className="manga-panel mt-5 rounded-2xl p-5">
                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-black">
                                TOP 5 TAGAR MARGA ANIME
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                Daftar marga dengan tagar terbanyak.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {["#", "#", "#", "#", "#"].map(t => (
                                <span
                                    key={t}
                                    className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-cyan-200"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="rank"
                className="reveal border-y border-cyan-300/10 bg-black/20 py-14"
            >
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-6 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold tracking-[.24em] text-cyan-300">
                                04 / VIEWER RANK
                            </p>

                            <h2 className="comic-title mt-2 text-3xl font-black">
                                PERINGKAT PENONTON
                            </h2>
                        </div>

                        <span className="text-xs text-slate-500">
                            TOP 5 VIDEO
                        </span>
                    </div>

                    <ScrollRow>
                        {videos.map((v: any, i: number) => (
                            <a
                                key={v.id}
                                href={v.url}
                                target="_blank"
                                rel="noreferrer"
                                className="manga-panel press-zoom min-w-[190px] snap-start overflow-hidden rounded-2xl"
                            >
                                <div className="relative aspect-[4/5] bg-slate-900">
                                    <Image
                                        src={
                                            v.cover ||
                                            "https://picsum.photos/seed/fallback/640/960"
                                        }
                                        alt={v.desc}
                                        fill
                                        sizes="190px"
                                        className="object-cover opacity-80"
                                        unoptimized
                                    />

                                    <div className="absolute left-2 top-2 rounded bg-black/80 px-2 py-1 text-xs font-black text-cyan-300">
                                        #{i + 1}
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-10">
                                        <p className="line-clamp-2 text-xs font-bold">
                                            {v.desc}
                                        </p>

                                        <p className="mt-1 text-[10px] text-cyan-300">
                                            {Intl.NumberFormat("id-ID", {
                                                notation: "compact",
                                                maximumFractionDigits: 1
                                            }).format(
                                                Number(v.views || 0)
                                            )}{" "}
                                            views
                                        </p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </ScrollRow>
                </div>
            </section>

            <section id="admin" className="reveal mx-auto max-w-6xl px-4 py-14">
                <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[.24em] text-cyan-300">
                        05 / STAFF
                    </p>

                    <h2 className="comic-title mt-2 text-3xl font-black">
                        ADMIN OF MARGA
                    </h2>
                </div>

                <ScrollRow>
                    {admins.map(a => (
                        <article
                            key={a.username}
                            className="manga-panel press-zoom min-w-[290px] snap-start rounded-2xl p-6"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-4">
                                    {a.avatar ? (
                                        <Image
                                            src={a.avatar}
                                            alt={a.name}
                                            width={72}
                                            height={72}
                                            className="rounded-2xl border-2 border-cyan-300/40 object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-2 border-cyan-300/40 bg-cyan-300/10 text-2xl font-black text-cyan-300">
                                            {a.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-lg font-black">
                                            {a.name}
                                        </p>

                                        <p className="text-xs text-cyan-300">
                                            {a.username}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-6 inline-block rounded border border-cyan-300/20 px-2 py-1 text-[10px] font-black tracking-widest text-cyan-200">
                                    {a.title}
                                </p>

                                <p className="mt-4 text-sm leading-7 text-slate-400">
                                    {a.desc}
                                </p>

                                <footer className="mt-7 border-t border-white/5 pt-4 text-[10px] uppercase tracking-widest text-slate-600">
                                    Marga Yece Family • Admin Panel
                                </footer>
                            </div>
                        </article>
                    ))}
                </ScrollRow>
            </section>

            <footer
                id="join"
                className="border-t border-cyan-300/10 bg-black/30 py-10"
            >
                <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-black">MARGA YECE FAMILY</p>

                        <p className="mt-1 text-xs text-slate-500">
                            TikTok Anime Community Portal
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <a
                            className="sketch-btn rounded-xl px-4 py-3 text-xs font-black"
                            href="https://www.tiktok.com/tag/margayecefamily"
                            target="_blank"
                            rel="noreferrer"
                        >
                            TIKTOK <ExternalLink size={14} className="inline" />
                        </a>

                        <a
                            className="sketch-btn rounded-xl bg-blue-600 px-4 py-3 text-xs font-black"
                            href="#home"
                        >
                            BACK TOP ↑
                        </a>
                    </div>
                </div>
            </footer>
        </main>
    );
}

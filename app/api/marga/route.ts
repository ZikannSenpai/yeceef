import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const databasePath = path.join(
    process.cwd(),
    "database"
);

async function readJSON(file: string) {
    try {
        const data = await fs.readFile(
            path.join(databasePath, file),
            "utf8"
        );

        return JSON.parse(data);
    } catch (error) {
        console.error(
            `Gagal membaca ${file}:`,
            error
        );

        return [];
    }
}

export async function GET() {
    try {
        const [gens, admins, anggota] =
            await Promise.all([
                readJSON("gens.json"),
                readJSON("admins.json"),
                readJSON("anggota.json")
            ]);

        return NextResponse.json({
            gens,
            admins,
            anggota
        });
    } catch (error) {
        console.error(
            "API Marga Error:",
            error
        );

        return NextResponse.json(
            {
                gens: [],
                admins: [],
                anggota: []
            },
            {
                status: 500
            }
        );
    }
}
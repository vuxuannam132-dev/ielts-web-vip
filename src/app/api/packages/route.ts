import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
        return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
    }
    const pkg = await prisma.package.findUnique({ where: { code } });
    if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(pkg);
}

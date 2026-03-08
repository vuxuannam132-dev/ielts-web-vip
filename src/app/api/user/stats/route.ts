import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                targetBand: true,
                lifetimePracticeCount: true,
                currentStreak: true,
            }
        });
        return NextResponse.json(user || { targetBand: null, lifetimePracticeCount: 0, currentStreak: 0 });
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { targetBand } = await req.json();
        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: { targetBand: parseFloat(targetBand) }
        });
        return NextResponse.json({ success: true, targetBand: user.targetBand });
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

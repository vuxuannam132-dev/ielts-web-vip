import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const totalUsers = await prisma.user.count();
        const vipUsers = await prisma.user.count({ where: { tier: { in: ['PRO', 'PREMIUM', 'EDU'] } } });
        const totalSubmissions = await prisma.submission.count();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUsersCount = await prisma.user.count({ where: { lastLoginAt: { gte: sevenDaysAgo } } });

        const topUsers = await prisma.user.findMany({
            orderBy: { lifetimePracticeCount: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                lifetimePracticeCount: true,
                tier: true,
                estimatedBand: true,
                currentStreak: true,
            }
        });

        return NextResponse.json({ totalUsers, vipUsers, totalSubmissions, activeUsersCount, topUsers });
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}

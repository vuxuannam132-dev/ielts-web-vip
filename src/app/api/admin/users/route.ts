import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// GET all users
export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tier: true,
                tierExpiresAt: true,
                currentStreak: true,
                lifetimePracticeCount: true,
                estimatedBand: true,
                createdAt: true,
                lastLoginAt: true,
                _count: { select: { submissions: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("[Admin Users GET Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// UPDATE user (tier, role)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId, role, tier, tierExpiresAt } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        const data: any = {};
        if (role) data.role = ["ADMIN", "USER", "TEACHER"].includes(role) ? role : "USER";
        if (tier) data.tier = ["FREE", "PRO", "PREMIUM", "EDU"].includes(tier) ? tier : "FREE";
        if (tierExpiresAt !== undefined) data.tierExpiresAt = tierExpiresAt ? new Date(tierExpiresAt) : null;

        const updated = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, name: true, role: true, tier: true }
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error("[Admin Users PATCH Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE user
export async function DELETE(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session || session.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        if (userId === session.id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        await prisma.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin Users DELETE Error]:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

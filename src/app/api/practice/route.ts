import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// Public API to fetch practice sets by skill (includes user's class assignments if logged in)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const skill = searchParams.get("skill");
    const id = searchParams.get("id");

    try {
        if (id) {
            const set = await prisma.practiceSet.findUnique({ where: { id } });
            return NextResponse.json(set);
        }

        const session = await getSessionFromRequest(req);
        let userClassIds: string[] = [];

        if (session?.id) {
            const memberships = await prisma.classMember.findMany({
                where: { userId: session.id, status: 'APPROVED' },
                select: { classId: true }
            });
            userClassIds = memberships.map(m => m.classId);
        }

        const sets = await prisma.practiceSet.findMany({
            where: {
                isActive: true,
                OR: [
                    { classId: null },
                    { classId: { in: userClassIds } }
                ],
                ...(skill ? { skill: skill.toUpperCase() } : {})
            },
            select: {
                id: true,
                skill: true,
                title: true,
                description: true,
                difficulty: true,
                content: true,
                createdAt: true,
                classId: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(sets);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch practice sets" }, { status: 500 });
    }
}

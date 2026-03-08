import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API to fetch practice sets by skill
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const skill = searchParams.get("skill");
    const id = searchParams.get("id");

    try {
        if (id) {
            const set = await prisma.practiceSet.findUnique({ where: { id } });
            return NextResponse.json(set);
        }

        const sets = await prisma.practiceSet.findMany({
            where: {
                isActive: true,
                classId: null, // only public sets
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
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(sets);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch practice sets" }, { status: 500 });
    }
}

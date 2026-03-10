import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// GET: student views their classes with assignments
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.classMember.findMany({
        where: { userId: session.id, status: "APPROVED" },
        include: {
            class: {
                include: {
                    teacher: { select: { id: true, name: true, email: true } },
                    _count: { select: { members: { where: { status: "APPROVED" } } } },
                }
            }
        },
        orderBy: { joinedAt: "desc" }
    });

    // Fetch assignments for each class separately
    const classIds = memberships.map((m: any) => m.class.id);
    const assignments = await prisma.classAssignment.findMany({
        where: { classId: { in: classIds } },
        orderBy: { createdAt: "desc" }
    });

    // Attach assignments per class
    const result = memberships.map((m: any) => ({
        ...m,
        class: {
            ...m.class,
            assignments: assignments.filter((a: any) => a.classId === m.class.id)
        }
    }));

    return NextResponse.json(result);
}

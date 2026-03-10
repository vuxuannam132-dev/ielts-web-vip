import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// GET pending members for a class
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const members = await prisma.classMember.findMany({
        where: {
            classId: classId || undefined,
            class: { teacherId: session.id },
        },
        include: {
            user: {
                select: {
                    id: true, name: true, email: true,
                    tier: true, currentStreak: true,
                    lifetimePracticeCount: true, estimatedBand: true,
                    createdAt: true,
                }
            }
        },
        orderBy: { joinedAt: "desc" }
    });

    return NextResponse.json(members);
}

// PATCH: approve or reject a member
export async function PATCH(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { memberId, status } = await req.json();
    if (!memberId || !["APPROVED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const updated = await prisma.classMember.update({
        where: { id: memberId },
        data: { status }
    });

    return NextResponse.json(updated);
}

// DELETE: remove a student from class
export async function DELETE(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "Missing memberId" }, { status: 400 });

    await prisma.classMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
}

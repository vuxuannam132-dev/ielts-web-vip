import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

function generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET: list teacher's classes
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const classes = await prisma.class.findMany({
        where: { teacherId: session.id },
        include: {
            _count: { select: { members: { where: { status: "APPROVED" } } } },
            members: {
                where: { status: "APPROVED" },
                include: {
                    user: {
                        select: {
                            id: true, name: true, email: true,
                            tier: true, currentStreak: true,
                            lifetimePracticeCount: true, estimatedBand: true,
                        }
                    }
                },
                take: 50,
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(classes);
}

// POST: create a new class
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Tên lớp không được để trống" }, { status: 400 });

    const inviteCode = generateInviteCode();
    const newClass = await prisma.class.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            inviteCode,
            teacherId: session.id,
        }
    });

    return NextResponse.json(newClass, { status: 201 });
}

// DELETE: delete a class
export async function DELETE(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 });

    await prisma.class.delete({ where: { id: classId, teacherId: session.id } });
    return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// GET: assignments for a class
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 });

    const assignments = await prisma.classAssignment.findMany({
        where: { classId },
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(assignments);
}

// POST: create assignment (teacher only)
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { classId, title, description, dueDate, skill, practiceSetId } = await req.json();
    if (!classId || !title?.trim()) {
        return NextResponse.json({ error: "ClassId và tiêu đề là bắt buộc" }, { status: 400 });
    }

    // Verify teacher owns this class
    const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: session.id } });
    if (!cls) return NextResponse.json({ error: "Không tìm thấy lớp" }, { status: 404 });

    const assignment = await prisma.classAssignment.create({
        data: {
            classId,
            teacherId: session.id,
            title: title.trim(),
            description: description?.trim() || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            skill: skill || null,
            practiceSetId: practiceSetId || null,
        }
    });

    return NextResponse.json(assignment, { status: 201 });
}

// DELETE: remove assignment (teacher only)
export async function DELETE(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.classAssignment.delete({ where: { id, teacherId: session.id } });
    return NextResponse.json({ success: true });
}

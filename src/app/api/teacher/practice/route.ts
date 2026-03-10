import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// POST: teacher creates a practice set (optionally scoped to a class)
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { skill, title, difficulty, contentJSON, classId } = body;

    if (!skill || !title?.trim()) {
        return NextResponse.json({ error: "Thiếu kỹ năng hoặc tiêu đề" }, { status: 400 });
    }

    // If class-scoped, verify teacher owns the class
    if (classId) {
        const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: session.id } });
        if (!cls) return NextResponse.json({ error: "Bạn không phải giáo viên của lớp này" }, { status: 403 });
    }

    const practiceSet = await prisma.practiceSet.create({
        data: {
            skill: skill.toUpperCase(),
            title: title.trim(),
            description: `${skill} Practice`,
            difficulty: difficulty || "Medium",
            content: JSON.stringify(contentJSON || {}),
            isActive: true,
            classId: classId || null,
        }
    });

    return NextResponse.json({ success: true, id: practiceSet.id }, { status: 201 });
}

// GET: teacher's practice sets (optionally filter by classId)
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    // Get all classes belonging to this teacher
    const teacherClasses = await prisma.class.findMany({
        where: { teacherId: session.id },
        select: { id: true }
    });
    const classIds = teacherClasses.map(c => c.id);

    const sets = await prisma.practiceSet.findMany({
        where: classId
            ? { classId }
            : { classId: { in: classIds } },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return NextResponse.json(sets);
}

// DELETE: teacher deletes their own practice set
export async function DELETE(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Verify teacher owns this practice set via class ownership
    const set = await prisma.practiceSet.findUnique({ where: { id } });
    if (!set) return NextResponse.json({ error: "Không tìm thấy bộ đề" }, { status: 404 });

    if (set.classId) {
        const cls = await prisma.class.findFirst({ where: { id: set.classId, teacherId: session.id } });
        if (!cls && session.role !== "ADMIN") return NextResponse.json({ error: "Không có quyền xóa" }, { status: 403 });
    }

    await prisma.practiceSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

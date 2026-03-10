import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// POST: teacher adds a student by email to a class
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, classId } = await req.json();
    if (!email?.trim() || !classId) {
        return NextResponse.json({ error: "Email và classId là bắt buộc" }, { status: 400 });
    }

    // Verify teacher owns this class
    const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: session.id } });
    if (!cls) return NextResponse.json({ error: "Bạn không phải giáo viên của lớp này" }, { status: 403 });

    // Find user by email
    const targetUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!targetUser) return NextResponse.json({ error: "Không tìm thấy tài khoản với email này" }, { status: 404 });

    if (targetUser.id === session.id) {
        return NextResponse.json({ error: "Không thể thêm chính mình vào lớp" }, { status: 400 });
    }

    // Upgrade user to STUDENT role + EDU tier if they're a regular user
    if (targetUser.role === "USER") {
        await prisma.user.update({
            where: { id: targetUser.id },
            data: { role: "STUDENT", tier: "EDU" }
        });
    }

    // Add as APPROVED member (direct teacher addition, no approval needed)
    const existing = await prisma.classMember.findFirst({
        where: { classId, userId: targetUser.id }
    });

    if (existing) {
        if (existing.status === "APPROVED") {
            return NextResponse.json({ error: "Học sinh này đã trong lớp rồi" }, { status: 400 });
        }
        // Update status to APPROVED if was PENDING/REJECTED
        await prisma.classMember.update({
            where: { id: existing.id },
            data: { status: "APPROVED" }
        });
    } else {
        await prisma.classMember.create({
            data: { classId, userId: targetUser.id, status: "APPROVED" }
        });
    }

    return NextResponse.json({
        success: true,
        student: { name: targetUser.name, email: targetUser.email, role: "STUDENT", tier: "EDU" }
    });
}

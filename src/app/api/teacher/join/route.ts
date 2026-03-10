import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// POST: student joins a class via invite code
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { inviteCode } = await req.json();
    if (!inviteCode?.trim()) return NextResponse.json({ error: "Nhập mã mời để vào lớp" }, { status: 400 });

    const classRoom = await prisma.class.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() }
    });

    if (!classRoom) return NextResponse.json({ error: "Mã mời không đúng hoặc lớp không tồn tại" }, { status: 404 });

    // Check if teacher is trying to join own class
    if (classRoom.teacherId === session.id) {
        return NextResponse.json({ error: "Bạn là giáo viên của lớp này" }, { status: 400 });
    }

    // Check if already a member
    const existing = await prisma.classMember.findFirst({
        where: { classId: classRoom.id, userId: session.id }
    });

    if (existing) {
        const statusMsg = existing.status === "APPROVED" ? "Bạn đã là thành viên lớp này"
            : existing.status === "PENDING" ? "Yêu cầu của bạn đang chờ giáo viên duyệt"
                : "Yêu cầu của bạn đã bị từ chối";
        return NextResponse.json({ error: statusMsg }, { status: 400 });
    }

    const member = await prisma.classMember.create({
        data: {
            classId: classRoom.id,
            userId: session.id,
            status: "PENDING",
        }
    });

    return NextResponse.json({ success: true, className: classRoom.name, status: member.status });
}

// GET: student's own classes
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const memberships = await prisma.classMember.findMany({
        where: { userId: session.id },
        include: {
            class: {
                include: {
                    teacher: { select: { id: true, name: true, email: true } },
                    _count: { select: { members: { where: { status: "APPROVED" } } } }
                }
            }
        },
        orderBy: { joinedAt: "desc" }
    });

    return NextResponse.json(memberships);
}

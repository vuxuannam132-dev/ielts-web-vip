import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// POST: submit a bug report
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    const { title, description, url } = await req.json();

    if (!title?.trim() || !description?.trim()) {
        return NextResponse.json({ error: "Tiêu đề và mô tả không được để trống" }, { status: 400 });
    }

    const report = await prisma.bugReport.create({
        data: {
            userId: session?.id || null,
            userEmail: session?.email || null,
            userName: session?.name || null,
            title: title.trim(),
            description: description.trim(),
            url: url || null,
        }
    });

    return NextResponse.json({ success: true, id: report.id });
}

// GET: list bug reports (admin only)
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.bugReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return NextResponse.json(reports);
}

// PATCH: update bug report status (admin only)
export async function PATCH(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();
    const updated = await prisma.bugReport.update({
        where: { id },
        data: { status }
    });

    return NextResponse.json(updated);
}

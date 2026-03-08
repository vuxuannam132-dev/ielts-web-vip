import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        // Require ADMIN role
        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { userId, newPassword } = body;

        if (!userId || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        return NextResponse.json({ success: true, message: "Password reset successfully for " + user.email }, { status: 200 });

    } catch (error) {
        console.error("[Admin Reset Password API]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

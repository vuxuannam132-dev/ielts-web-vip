import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);

        if (existingUser) {
            if (!existingUser.isVerified) {
                await prisma.user.update({
                    where: { email: normalizedEmail },
                    data: { verifyCode: otp, verifyExpiry: expiry }
                });
                const { sendMail } = await import('@/lib/mailer');
                await sendMail({
                    to: normalizedEmail,
                    subject: "Mã xác nhận đăng ký tài khoản",
                    html: `<p>Xin chào ${name},</p><p>Mã xác nhận của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn sau 15 phút.</p>`
                });
                return NextResponse.json({ success: true, email: normalizedEmail, requiresVerification: true }, { status: 200 });
            }
            return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 409 });
        }

        // Hash password and create
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: "USER",
                tier: "FREE",
                isVerified: false,
                verifyCode: otp,
                verifyExpiry: expiry
            }
        });

        // Log
        await prisma.activityLog.create({
            data: {
                type: 'ACCOUNT',
                message: `Người dùng ${name} (${normalizedEmail}) vừa đăng ký tài khoản.`,
                userId: user.id
            }
        });

        const { sendMail } = await import('@/lib/mailer');
        await sendMail({
            to: normalizedEmail,
            subject: "Mã xác nhận đăng ký tài khoản",
            html: `<p>Xin chào ${name},</p><p>Mã xác nhận của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn sau 15 phút.</p>`
        });

        return NextResponse.json({ success: true, email: normalizedEmail, requiresVerification: true }, { status: 201 });

    } catch (error) {
        console.error("[Register API Error]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

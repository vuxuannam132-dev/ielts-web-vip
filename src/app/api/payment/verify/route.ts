import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { packageId, packageCode } = await req.json();

        if (!packageCode) {
            return NextResponse.json({ success: false, error: "Missing package parameters." }, { status: 400 });
        }

        // Validate package exists
        const pkg = await prisma.package.findUnique({ where: { code: packageCode } });
        if (!pkg) {
            return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
        }

        // --- CASSO / PAYMENT GATEWAY WEBHOOK PREPARATION ---
        // In reality, this endpoint should not be directly triggered by the frontend like this
        // for final verification, unless it's checking a polling state.
        // For a real implementation:
        // 1. Create a Transaction record here with status=PENDING if creating an invoice
        // 2. The frontend polls a status checking endpoint
        // 3. Casso webhook hits /api/payment/webhook -> verifies amount and content matches `IELTS UID PKG`
        // 4. Webhook updates Transaction=SUCCESS and upgrades User
        // ---------------------------------------------------

        // MOCK IMPLEMENTATION: Immediately upgrade user

        let tierExpiresAt = null;
        if (pkg.durationDays) {
            tierExpiresAt = new Date();
            tierExpiresAt.setDate(tierExpiresAt.getDate() + pkg.durationDays);
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                tier: pkg.code,
                tierExpiresAt: tierExpiresAt,
            }
        });

        return NextResponse.json({ success: true, message: "Payment verified successfully. Account upgraded." });

    } catch (error: any) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Casso Webhook endpoint
 * Casso calls this URL when a bank transfer is detected.
 * Set the webhook URL to: https://your-domain.vercel.app/api/payment/webhook
 * Set webhook secret in Admin → System Settings as `casso_webhook_secret`
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-casso-signature") || "";

        // Fetch secret from DB
        const secretConfig = await prisma.systemConfig.findUnique({ where: { key: "casso_webhook_secret" } });
        const webhookSecret = secretConfig?.value || "";

        // Verify HMAC signature if secret is configured
        if (webhookSecret) {
            const hmac = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
            if (hmac !== signature) {
                console.error("[Casso Webhook] Invalid signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const payload = JSON.parse(body);
        // Casso sends array of transactions
        const transactions = Array.isArray(payload.data) ? payload.data : [payload.data];

        for (const tx of transactions) {
            if (!tx) continue;
            const description: string = (tx.description || tx.memo || "").toUpperCase();

            // Find matching pending transaction by transfer content (IELTS XXXXXX CODE)
            const pending = await prisma.transaction.findFirst({
                where: {
                    status: "PENDING",
                    transferContent: { mode: "insensitive", contains: "IELTS" }
                },
                orderBy: { createdAt: "desc" }
            });

            if (!pending) continue;

            // Extract code from description: "IELTS ABCDEF PRO"
            const parts = description.split(" ");
            const ieltIdx = parts.indexOf("IELTS");
            if (ieltIdx === -1) continue;

            const shortId = parts[ieltIdx + 1];
            const pkgCode = parts[ieltIdx + 2];

            if (!shortId || !pkgCode) continue;

            // Find the exact matching pending transaction
            const matchedTx = await prisma.transaction.findFirst({
                where: {
                    status: "PENDING",
                    packageCode: pkgCode,
                    transferContent: { contains: shortId, mode: "insensitive" }
                }
            });

            if (!matchedTx) continue;

            // Validate amount
            const pkg = await prisma.package.findUnique({ where: { code: pkgCode } });
            if (!pkg) continue;

            // Allow payment to proceed if amount matches (Casso sends in VND)
            const paidAmount = Number(tx.amount || tx.creditAmount || 0);
            if (paidAmount < pkg.price) {
                console.log(`[Casso] Amount mismatch: expected ${pkg.price}, got ${paidAmount}`);
                continue;
            }

            // Upgrade user!
            let tierExpiresAt = null;
            if (pkg.durationDays) {
                tierExpiresAt = new Date();
                tierExpiresAt.setDate(tierExpiresAt.getDate() + pkg.durationDays);
            }

            await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: matchedTx.id },
                    data: { status: "SUCCESS", cassoId: String(tx.id || "") }
                }),
                prisma.user.update({
                    where: { id: matchedTx.userId },
                    data: { tier: pkgCode, tierExpiresAt }
                })
            ]);

            console.log(`[Casso] ✅ Upgraded user ${matchedTx.userId} to ${pkgCode}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Casso Webhook Error]:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}

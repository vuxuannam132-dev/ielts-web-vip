import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        let amountIn = 0;
        let transactionContent = "";
        let referenceNumber = "";

        // Detect Casso.vn payload
        if (body.data && Array.isArray(body.data) && body.data.length > 0) {
            const tx = body.data[0];
            amountIn = tx.amount;
            transactionContent = tx.description;
            referenceNumber = tx.tid || tx.id?.toString();
        } 
        // Detect SePay payload
        else if (body.amountIn !== undefined) {
            amountIn = body.amountIn;
            transactionContent = body.transactionContent;
            referenceNumber = body.referenceNumber || body.id?.toString();
        } else {
            return NextResponse.json({ success: true, message: "Unknown webhook format" });
        }

        // Ensure this is a positive incoming transaction
        if (!amountIn || amountIn <= 0) {
            return NextResponse.json({ success: true, message: "Ignored, not an incoming transaction" });
        }

        if (!transactionContent) {
            return NextResponse.json({ success: true, message: "Ignored, no content" });
        }

        const contentUpper = transactionContent.toUpperCase();
        
        // Find user by matching ID prefix
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });

        const matchedUser = users.find(u => contentUpper.includes(`IELTS ${u.id.substring(0, 6).toUpperCase()}`));

        if (!matchedUser) {
            console.error("Webhook unmatched user for content:", transactionContent);
            return NextResponse.json({ success: true, message: "User not found" });
        }

        // Find package code in the content
        const packages = await prisma.package.findMany({
            where: { isActive: true }
        });

        const matchedPackage = packages.find(p => contentUpper.includes(p.code.toUpperCase()));

        if (!matchedPackage) {
            console.error("Webhook unmatched package for content:", transactionContent);
            return NextResponse.json({ success: true, message: "Package not found" });
        }

        if (amountIn < matchedPackage.price) {
            console.error(`Webhook amount ${amountIn} is less than package price ${matchedPackage.price}`);
            return NextResponse.json({ success: true, message: "Insufficient amount" });
        }

        const existingTx = await prisma.transaction.findFirst({
            where: { cassoId: referenceNumber }
        });

        if (existingTx) {
            return NextResponse.json({ success: true, message: "Already processed" });
        }

        const expiresAt = matchedPackage.durationDays 
            ? new Date(Date.now() + matchedPackage.durationDays * 24 * 60 * 60 * 1000)
            : null;

        await prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    userId: matchedUser.id,
                    packageCode: matchedPackage.code,
                    amount: amountIn,
                    transferContent: transactionContent,
                    status: "SUCCESS",
                    cassoId: referenceNumber || body.id?.toString(),
                }
            });

            await tx.user.update({
                where: { id: matchedUser.id },
                data: {
                    tier: matchedPackage.code,
                    tierExpiresAt: expiresAt,
                }
            });
        });

        console.log(`Successfully upgraded user ${matchedUser.email} to ${matchedPackage.code}`);
        return NextResponse.json({ success: true, message: "Payment processed successfully" });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

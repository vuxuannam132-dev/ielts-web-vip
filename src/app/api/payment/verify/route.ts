import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";

// GET: return existing transaction status for this user
export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const txId = searchParams.get("txId");
    if (!txId) return NextResponse.json({ error: "Missing txId" }, { status: 400 });

    const tx = await prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx || tx.userId !== session.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ status: tx.status });
}

// POST: create a pending transaction
export async function POST(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { packageCode, packageId } = await req.json();
    if (!packageCode) return NextResponse.json({ error: "Missing packageCode" }, { status: 400 });

    const pkg = await prisma.package.findUnique({ where: { code: packageCode } });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    if (pkg.price === 0) {
        // Free package — upgrade immediately
        await prisma.user.update({
            where: { id: session.id },
            data: { tier: pkg.code }
        });
        return NextResponse.json({ success: true, status: "SUCCESS" });
    }

    const transferContent = `IELTS ${session.id.substring(0, 6).toUpperCase()} ${packageCode}`;

    // Check for existing pending tx  
    const existingTx = await prisma.transaction.findFirst({
        where: { userId: session.id, packageCode, status: "PENDING" }
    });
    if (existingTx) {
        return NextResponse.json({ success: true, txId: existingTx.id, transferContent, status: "PENDING" });
    }

    const tx = await prisma.transaction.create({
        data: {
            userId: session.id,
            packageCode,
            amount: pkg.price,
            transferContent,
            status: "PENDING",
        }
    });

    return NextResponse.json({ success: true, txId: tx.id, transferContent, status: "PENDING" });
}

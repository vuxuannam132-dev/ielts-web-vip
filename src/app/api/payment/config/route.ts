import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const configs = await prisma.systemConfig.findMany({
        where: {
            key: { in: ['payment_bank_name', 'payment_account_number', 'payment_account_name', 'payment_qr_url'] }
        }
    });

    const map: Record<string, string> = {};
    for (const c of configs) {
        map[c.key] = c.value;
    }

    return NextResponse.json({
        bankName: map['payment_bank_name'] || "N/A",
        accNumber: map['payment_account_number'] || "N/A",
        accName: map['payment_account_name'] || "N/A",
        qrUrl: map['payment_qr_url'] || null,
    });
}

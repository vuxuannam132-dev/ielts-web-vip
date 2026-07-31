import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const configs = await prisma.systemConfig.findMany({
        where: {
            key: { in: ['bankName', 'bankAccount', 'accountHolder', 'bankQRUrl', 'payment_bank_name', 'payment_account_number', 'payment_account_name', 'payment_qr_url'] }
        }
    });

    const map: Record<string, string> = {};
    for (const c of configs) {
        map[c.key] = c.value;
    }

    return NextResponse.json({
        bankName: map['bankName'] || map['payment_bank_name'] || "N/A",
        accNumber: map['bankAccount'] || map['payment_account_number'] || "N/A",
        accName: map['accountHolder'] || map['payment_account_name'] || "N/A",
        qrUrl: map['bankQRUrl'] || map['payment_qr_url'] || null,
    });
}

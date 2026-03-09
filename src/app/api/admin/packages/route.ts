import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const packages = await prisma.package.findMany({ orderBy: { price: 'asc' } });
        return NextResponse.json(packages);
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi khi lấy danh sách gói' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await req.json();
        const { code, name, price, durationDays, description, benefits, isActive, requiresManualApproval } = body;

        const newPackage = await prisma.package.create({
            data: {
                code,
                name,
                price: Number(price),
                durationDays: durationDays ? Number(durationDays) : null,
                description,
                benefits: typeof benefits === 'string' ? benefits : JSON.stringify(benefits),
                isActive: Boolean(isActive),
                requiresManualApproval: Boolean(requiresManualApproval),
            }
        });
        return NextResponse.json(newPackage, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Mã code (tier) này đã tồn tại.' }, { status: 400 });
        }
        console.error('Package CREATE error:', error);
        return NextResponse.json({ error: 'Lỗi khi tạo gói mới' }, { status: 500 });
    }
}

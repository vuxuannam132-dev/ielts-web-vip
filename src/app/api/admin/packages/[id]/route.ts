import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSessionFromRequest(req);
        if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await req.json();
        const { code, name, price, durationDays, description, benefits, isActive, requiresManualApproval } = body;

        const updated = await prisma.package.update({
            where: { id: params.id },
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
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Package PUT error:', error);
        return NextResponse.json({ error: 'Lỗi cập nhật gói' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSessionFromRequest(req);
        if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await prisma.package.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi xóa gói' }, { status: 500 });
    }
}

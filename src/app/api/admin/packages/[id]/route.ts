import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await req.json();
        const { code, name, price, durationDays, description, benefits, isActive } = body;

        const updated = await prisma.package.update({
            where: { id: params.id },
            data: {
                code, name, price, durationDays, description, benefits: JSON.stringify(benefits), isActive
            }
        });
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi cập nhật gói' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        await prisma.package.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi xóa gói' }, { status: 500 });
    }
}

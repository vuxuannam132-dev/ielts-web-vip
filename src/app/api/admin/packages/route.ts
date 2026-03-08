import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const packages = await prisma.package.findMany({
            orderBy: { price: 'asc' }
        });
        return NextResponse.json(packages);
    } catch (error) {
        return NextResponse.json({ error: 'Lỗi khi lấy danh sách gói' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if ((session?.user as any)?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const body = await req.json();
        const { code, name, price, durationDays, description, benefits, isActive } = body;

        const newPackage = await prisma.package.create({
            data: {
                code, name, price, durationDays, description, benefits: JSON.stringify(benefits), isActive
            }
        });
        return NextResponse.json(newPackage, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Mã code (tier) này đã tồn tại.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Lỗi khi tạo gói mới' }, { status: 500 });
    }
}

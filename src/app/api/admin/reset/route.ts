import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type } = await req.json();

        if (type === 'exercises') {
            await prisma.submission.deleteMany({});
            await prisma.practiceSet.deleteMany({});
            return NextResponse.json({ success: true, message: 'Đã xóa toàn bộ bài tập và bài làm.' });
        }

        if (type === 'users') {
            await prisma.user.deleteMany({
                where: {
                    role: { not: 'ADMIN' }
                }
            });
            return NextResponse.json({ success: true, message: 'Đã xóa toàn bộ người dùng (trừ Admin).' });
        }

        if (type === 'all') {
            await prisma.submission.deleteMany({});
            await prisma.practiceSet.deleteMany({});
            await prisma.user.deleteMany({
                where: {
                    role: { not: 'ADMIN' }
                }
            });
            return NextResponse.json({ success: true, message: 'Đã Khôi phục cài đặt gốc toàn bộ hệ thống.' });
        }

        return NextResponse.json({ error: 'Invalid reset type' }, { status: 400 });

    } catch (error: any) {
        console.error('Reset error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

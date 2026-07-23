import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.email || session.role !== 'ADMIN') {
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

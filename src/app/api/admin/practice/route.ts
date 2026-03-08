import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { skill, title, section, difficulty, content, questions } = body;

        if (!skill || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const practiceSet = await prisma.practiceSet.create({
            data: {
                skill: skill.toUpperCase(),
                title,
                description: section || `${skill} Practice`,
                content: JSON.stringify({
                    section: section || `${skill} Practice`,
                    difficulty: difficulty || 'Medium',
                    passage: content || '',
                    questions: questions || [],
                }),
            },
        });

        return NextResponse.json({ success: true, id: practiceSet.id });
    } catch (error) {
        console.error('Practice upload error:', error);
        return NextResponse.json({ error: 'Failed to save practice set' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sets = await prisma.practiceSet.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json(sets);
    } catch (error) {
        console.error('Practice fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch practice sets' }, { status: 500 });
    }
}

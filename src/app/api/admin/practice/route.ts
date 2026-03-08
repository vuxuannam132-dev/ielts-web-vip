import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { skill, title, section, difficulty, contentJSON } = body;

        if (!skill || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const practiceSet = await prisma.practiceSet.create({
            data: {
                skill: skill.toUpperCase(),
                title,
                description: section || `${skill} Practice`,
                difficulty: difficulty || 'Medium',
                content: JSON.stringify(contentJSON || {}),
                isActive: true,
            },
        });

        return NextResponse.json({ success: true, id: practiceSet.id });
    } catch (error) {
        console.error('Practice upload error:', error);
        return NextResponse.json({ error: 'Failed to save practice set' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session || !["ADMIN", "TEACHER"].includes(session.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const skill = searchParams.get('skill');

        const sets = await prisma.practiceSet.findMany({
            where: skill ? { skill: skill.toUpperCase() } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        return NextResponse.json(sets);
    } catch (error) {
        console.error('Practice fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch practice sets' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        await prisma.practiceSet.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete practice set' }, { status: 500 });
    }
}

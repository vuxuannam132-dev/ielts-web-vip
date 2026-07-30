import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const set = await prisma.flashcardSet.findUnique({
                where: { id },
                include: { cards: true }
            });
            if (!set) return NextResponse.json({ error: 'Flashcard Set not found' }, { status: 404 });
            return NextResponse.json(set);
        }

        const sets = await prisma.flashcardSet.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { cards: true }
                }
            }
        });

        return NextResponse.json(sets);
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

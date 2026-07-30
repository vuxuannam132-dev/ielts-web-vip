import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, description, rawData } = body;

        if (!title || !rawData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Parse rawData (assumed from Google Sheets: English \t Vietnamese \t IPA)
        const lines = rawData.split('\n').map((line: string) => line.trim()).filter(Boolean);
        const cardsData = [];

        for (const line of lines) {
            const columns = line.split('\t').map((col: string) => col.trim());
            // Need at least Term and Meaning
            if (columns.length >= 2) {
                cardsData.push({
                    term: columns[0],
                    meaning: columns[1],
                    ipa: columns[2] || null
                });
            }
        }

        if (cardsData.length === 0) {
            return NextResponse.json({ error: 'No valid flashcard data found in input' }, { status: 400 });
        }

        const newSet = await prisma.flashcardSet.create({
            data: {
                title,
                description,
                cards: {
                    create: cardsData
                }
            }
        });

        return NextResponse.json({ success: true, setId: newSet.id, count: cardsData.length });
    } catch (error) {
        console.error('Error uploading flashcards:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

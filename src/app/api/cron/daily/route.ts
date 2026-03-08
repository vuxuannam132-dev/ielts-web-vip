import { NextResponse } from 'next/server';
import { generateDailyPractice } from '@/lib/ai/contentGenerator';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    // Secure the cron job using a Bearer token or Vercel's secret
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await generateDailyPractice();
        return NextResponse.json({ success: true, message: 'Daily practice content generated successfully.' });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { configs } = body as { configs: { key: string; value: string }[] };

        if (!configs || !Array.isArray(configs)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        for (const config of configs) {
            await prisma.systemConfig.upsert({
                where: { key: config.key },
                update: { value: config.value },
                create: { key: config.key, value: config.value },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Config update error:', error);
        return NextResponse.json({ error: 'Failed to update configs' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getSessionFromRequest(request);
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const configs = await prisma.systemConfig.findMany();
        const configMap: Record<string, string> = {};
        configs.forEach(c => { configMap[c.key] = c.value; });

        return NextResponse.json(configMap);
    } catch (error) {
        console.error('Config fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch configs' }, { status: 500 });
    }
}

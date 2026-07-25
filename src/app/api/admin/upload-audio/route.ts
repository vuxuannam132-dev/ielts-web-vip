import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.email || !['ADMIN', 'TEACHER'].includes(session.role as string)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = file.type || 'audio/mpeg';
        const dataUri = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({ success: true, url: dataUri });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

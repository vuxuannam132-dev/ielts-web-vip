import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// TEMPORARY DEBUG ENDPOINT - REMOVE AFTER DIAGNOSIS
export async function GET(req: NextRequest) {
    const cookies = req.cookies.getAll().map(c => ({
        name: c.name,
        valueLength: c.value.length,
        preview: c.value.substring(0, 30),
    }));

    let tokenResult = null;
    let tokenError = null;

    try {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "",
        });
        tokenResult = token ? {
            id: token.id,
            sub: token.sub,
            email: token.email,
            role: token.role,
            tier: token.tier,
        } : null;
    } catch (e: any) {
        tokenError = e.message;
    }

    return NextResponse.json({
        cookies,
        token: tokenResult,
        tokenError,
        env: {
            hasAuthSecret: !!process.env.AUTH_SECRET,
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            nodeEnv: process.env.NODE_ENV,
            nextAuthUrl: process.env.NEXTAUTH_URL,
        }
    });
}

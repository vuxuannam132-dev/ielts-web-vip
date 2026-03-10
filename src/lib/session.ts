import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export interface SessionUser {
    id: string;
    email: string;
    name?: string;
    role: string;
    tier: string;
}

/**
 * Decodes the NextAuth session JWT using NextAuth's own getToken helper.
 * This is the recommended approach - it correctly handles cookie names,
 * encryption, and signing without manual jose implementation.
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
    try {
        const token = await getToken({
            req,
            secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "",
        });

        if (!token) return null;

        const userId = (token.id as string) || (token.sub as string);
        if (!userId) return null;

        return {
            id: userId,
            email: (token.email as string) || "",
            name: token.name as string | undefined,
            role: (token.role as string) || "USER",
            tier: (token.tier as string) || "FREE",
        };
    } catch (err) {
        console.error("[session] getToken failed:", err);
        return null;
    }
}
